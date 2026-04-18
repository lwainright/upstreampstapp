// netlify/functions/search.js
// AI Resource Finder — uses Claude Sonnet with web search
// Finds current, live first responder resources

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

exports.handler = async function (event) {
  if (event.httpMethod === "OPTIONS") {
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

  if (!ANTHROPIC_API_KEY) {
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "API key not configured" }),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Invalid JSON" }),
    };
  }

  const { query, scope, location, state, existingResources } = body;

  if (!query) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "No query provided" }),
    };
  }

  const locationContext = scope === "local" || scope === "regional"
    ? `Location: ${location || state || "NC"}`
    : scope === "state"
    ? `State: ${state || "NC"}`
    : "Scope: National";

  const existingContext = existingResources && existingResources.length > 0
    ? `\n\nAlready in vetted database (include these if relevant):\n${existingResources.map(r => `- ${r.title}: ${r.notes || ""} (${r.phone || ""})`).join("\n")}`
    : "";

  const systemPrompt = `You are a resource finder for first responders. Use web search to find current, accurate resources.

${locationContext}${existingContext}

CRITICAL RULES:
- Use web search to find CURRENT information — not outdated training data
- Only return real, verified organizations with accurate contact info
- First responder focus: mental health, peer support, PTSD, crisis lines, substance recovery, chaplains
- No random therapist directories, no Yelp, no ads
- Verify phone numbers and websites are current
- Return ONLY a valid JSON array — no markdown, no backticks, no explanation
- Max 6 results
- Each result must have: name, description, phone, url, category, scope
- description max 120 characters
- Start response with [ and end with ]

If the query sounds emotional (struggling, overwhelmed, not okay): respond with exactly REDIRECT_EMOTIONAL
If crisis language detected: respond with exactly REDIRECT_CRISIS`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "interleaved-thinking-2025-05-14",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: query }],
        tools: [{ type: "web_search_20250305", name: "web_search" }],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("Anthropic error:", response.status, err);
      return {
        statusCode: response.status,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: err.error?.message || "API error" }),
      };
    }

    const data = await response.json();
    const text = data.content?.find(b => b.type === "text")?.text || "";

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ text }),
    };
  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Service unavailable" }),
    };
  }
};
