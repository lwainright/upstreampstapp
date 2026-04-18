// netlify/functions/search.js
// AI Resource Finder — Tavily search + Claude formatting
// Tavily finds current live results, Claude formats into clean resource cards

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

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

  // Safety check for emotional/crisis language
  const lower = query.toLowerCase();
  const crisisWords = ["suicide", "kill myself", "end it", "don't want to be here", "hurt myself", "self harm"];
  const emotionalWords = ["overwhelmed", "struggling", "not okay", "can't handle", "breaking down", "hopeless", "depressed", "burned out"];
  
  if (crisisWords.some(w => lower.includes(w))) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ text: "REDIRECT_CRISIS" }),
    };
  }
  if (emotionalWords.some(w => lower.includes(w))) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ text: "REDIRECT_EMOTIONAL" }),
    };
  }

  const locationContext = scope === "local" || scope === "regional"
    ? `${location || state || "NC"}`
    : scope === "state"
    ? `${state || "NC"}`
    : "national";

  // Build Tavily search query
  const searchQuery = `first responder mental health resources ${locationContext} ${query}`;

  let tavilyResults = [];
  
  // Step 1: Tavily search
  try {
    const tavilyRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY || "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",
        query: searchQuery,
        search_depth: "advanced",
        max_results: 8,
        include_answer: true,
      }),
    });

    if (tavilyRes.ok) {
      const tavilyData = await tavilyRes.json();
      tavilyResults = tavilyData.results || [];
    }
  } catch(e) {
    console.error("Tavily error:", e);
    // Continue to Claude fallback
  }

  // Step 2: Claude formats Tavily results into clean resource cards
  const existingContext = existingResources && existingResources.length > 0
    ? `Already in vetted database: ${existingResources.slice(0,10).map(r => r.title).join(", ")}`
    : "";

  const tavilyContext = tavilyResults.length > 0
    ? `Live search results to use:\n${tavilyResults.map(r => `- ${r.title}: ${r.content?.slice(0,200)} (${r.url})`).join("\n")}`
    : "No live search results — use your knowledge of verified first responder organizations.";

  const systemPrompt = `You are a resource formatter for a first responder wellness app.

Location context: ${locationContext}
${existingContext}

${tavilyContext}

Format the above search results into a clean JSON array of first responder resources.
Return ONLY a valid JSON array — no markdown, no backticks, no explanation.
Max 6 results. Skip duplicates with existing database.
Each result: {"name":"...","description":"...","phone":"...","url":"...","category":"...","scope":"..."}
description max 100 characters.
Only include real verified organizations — no ads, no directories, no Yelp.
Start with [ end with ]`;

  try {
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: `Format these into resource cards for: ${query} near ${locationContext}` }],
      }),
    });

    const claudeData = await claudeRes.json();
    const text = claudeData.content?.[0]?.text || "[]";

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ text }),
    };
  } catch(err) {
    console.error("Claude error:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Service unavailable" }),
    };
  }
};
