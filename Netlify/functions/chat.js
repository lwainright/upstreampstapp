exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Collect all available keys
  const keys = [
    process.env.GEMINI_KEY_1,
    process.env.GEMINI_KEY_2,
    process.env.GEMINI_KEY_3,
    process.env.GEMINI_KEY_4,
    process.env.GEMINI_KEY_5,
  ].filter(Boolean);

  if (keys.length === 0) {
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

  // Rotate through keys — shuffle so load is spread across keys
  const shuffled = keys.sort(() => Math.random() - 0.5);

  for (const key of shuffled) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // If rate limited, try next key
      if (response.status === 429) continue;

      // If not OK and not a rate limit, return the error
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        return {
          statusCode: response.status,
          body: JSON.stringify({ error: err.error?.message || "API error" }),
        };
      }

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
      continue;
    }
  }

  // All keys exhausted
  return {
    statusCode: 429,
    body: JSON.stringify({
      error: "All API keys are currently rate limited. Please try again soon.",
    }),
  };
};
