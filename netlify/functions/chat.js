// netlify/functions/chat.js
// Gemini key rotation with true round-robin and per-key cooldown tracking

// In-memory rotation state (persists across warm invocations of the same function instance)
let currentKeyIndex = 0;
const keyCooldowns = {}; // key -> timestamp when it's usable again

const COOLDOWN_MS = 62000; // 62 seconds after a 429 before retrying that key
const RETRY_DELAY_MS = 200; // small pause between key attempts

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
    // Handle CORS preflight
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Collect all available keys
  const allKeys = [
    process.env.GEMINI_KEY_1,
    process.env.GEMINI_KEY_2,
    process.env.GEMINI_KEY_3,
    process.env.GEMINI_KEY_4,
    process.env.GEMINI_KEY_5,
  ].filter(Boolean);

  if (allKeys.length === 0) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "No API keys configured" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const model = body.model || "gemini-2.0-flash";
  const payload = {
    systemInstruction: body.systemInstruction,
    contents: body.contents,
    generationConfig: body.generationConfig || {
      maxOutputTokens: 400,
      temperature: 0.85,
    },
  };

  const now = Date.now();

  // Build ordered list starting from currentKeyIndex (true round-robin)
  // Skip any keys still in cooldown
  const orderedKeys = [];
  for (let i = 0; i < allKeys.length; i++) {
    const idx = (currentKeyIndex + i) % allKeys.length;
    const key = allKeys[idx];
    const cooldownUntil = keyCooldowns[key] || 0;
    if (now >= cooldownUntil) {
      orderedKeys.push({ key, idx });
    }
  }

  // If all keys are in cooldown, just try them all anyway (cooldown may have expired)
  const keysToTry =
    orderedKeys.length > 0
      ? orderedKeys
      : allKeys.map((key, idx) => ({ key, idx }));

  for (const { key, idx } of keysToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.status === 429) {
        // Put this key in cooldown and try the next one
        keyCooldowns[key] = Date.now() + COOLDOWN_MS;
        console.log(`Key index ${idx} rate limited, cooling down for 62s`);
        await sleep(RETRY_DELAY_MS);
        continue;
      }

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const errMsg = err.error?.message || "API error";
        console.error(`Key index ${idx} returned ${response.status}: ${errMsg}`);

        // Don't burn through other keys for non-429 errors (bad key, quota exceeded, etc.)
        return {
          statusCode: response.status,
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ error: errMsg }),
        };
      }

      // Success — advance the round-robin index for next request
      currentKeyIndex = (idx + 1) % allKeys.length;

      const data = await response.json();
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(data),
      };
    } catch (err) {
      // Network error — try next key
      console.error(`Key index ${idx} network error: ${err.message}`);
      await sleep(RETRY_DELAY_MS);
      continue;
    }
  }

  // All keys exhausted or in cooldown
  const earliestCooldown = Math.min(
    ...allKeys.map((k) => keyCooldowns[k] || 0)
  );
  const waitSeconds = Math.max(
    0,
    Math.ceil((earliestCooldown - Date.now()) / 1000)
  );

  return {
    statusCode: 429,
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({
      error: `All API keys are currently rate limited. Try again in ~${waitSeconds}s.`,
      retryAfter: waitSeconds,
    }),
  };
};
