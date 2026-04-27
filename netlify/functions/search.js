// ============================================================
// netlify/functions/search.js
// Upstream Approach -- AI Resource Finder
// Tavily search + Claude formatting + Appwrite auto-save
// Rate limited, input sanitized, vetting-aware
// Resources: search Appwrite first, then Tavily, then save for review
// ============================================================

const { checkRateLimit, sanitizeText, getClientIP, rateLimitResponse, corsHeaders } = require("./security");

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Resource Language Pack categories for query enhancement
const QUERY_ENHANCERS = {
  mental:     "mental health peer support community",
  crisis:     "crisis line hotline 24/7",
  housing:    "emergency housing assistance nonprofit",
  financial:  "emergency financial assistance nonprofit free",
  recovery:   "addiction recovery peer support free",
  dv:         "domestic violence shelter confidential",
  grief:      "grief support group bereavement",
  disability: "disability services support accessibility",
  youth:      "youth support programs teens free",
  caregiver:  "caregiver support respite care",
  legal:      "legal aid free tenant employment rights",
  spiritual:  "spiritual care chaplaincy faith community",
};

function enhanceQuery(query, seat) {
  const lower = query.toLowerCase();
  for (const [key, enhancer] of Object.entries(QUERY_ENHANCERS)) {
    if (lower.includes(key)) return query + " " + enhancer;
  }
  // Seat-specific enhancement
  const seatEnhancers = {
    responder:     "first responder public safety",
    veteran:       "veteran military",
    hospital:      "healthcare worker",
    school:        "educator school staff",
    humanservices: "social worker DSS CPS",
    entertainment: "entertainment industry worker",
    mhpro:         "mental health clinician",
  };
  return query + " " + (seatEnhancers[seat] || "");
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders(), body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  // Rate limit -- search is expensive
  const ip = getClientIP(event);
  if (!checkRateLimit(ip, "search", 15, 60000)) {
    return rateLimitResponse();
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const query = sanitizeText(body.query || "", 200);
    const scope = sanitizeText(body.scope || "national", 20);
    const location = sanitizeText(body.location || "", 100);
    const state = sanitizeText(body.state || "", 50);
    const seat = sanitizeText(body.seat || "responder", 30);
    const existingResources = Array.isArray(body.existingResources) ? body.existingResources : [];

    if (!query.trim()) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: "Query required" }),
      };
    }

    // Build location-aware query
    let searchQuery = enhanceQuery(query, seat);
    if (scope === "local" && location) searchQuery += ` ${location}`;
    else if (scope === "state" && state) searchQuery += ` ${state}`;

    // Search Tavily
    const tavilyRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: searchQuery,
        search_depth: "basic",
        max_results: 8,
        include_answer: false,
        include_raw_content: false,
      }),
    });

    if (!tavilyRes.ok) throw new Error("Tavily error " + tavilyRes.status);
    const tavilyData = await tavilyRes.json();
    const results = tavilyData.results || [];

    if (results.length === 0) {
      return {
        statusCode: 200,
        headers: corsHeaders(),
        body: JSON.stringify({ resources: [], message: "No results found. Try a different search." }),
      };
    }

    // Format with Claude -- plain language, vetting-aware
    const existingTitles = existingResources.map(r => r.title || r.name || "").join(", ");
    const formatPrompt = `You are a resource curator for a peer support platform serving first responders, hospital staff, school staff, veterans, and families.

Format these search results into a clean resource list. For each result:
- Use plain, non-clinical language
- Give a clear description of what the resource actually does
- Note if it is free or low-cost
- Note if it is available 24/7
- Skip duplicates of these already in the database: ${existingTitles || "none"}
- Skip results that are: paywalled, predatory, political, or not genuine support organizations
- Skip results that are news articles or blog posts about resources (not the resources themselves)

Return ONLY a JSON array. No markdown. No explanation. Format:
[{"name":"Resource Name","description":"What it does in plain language","url":"https://...","free":true,"available247":false,"category":"mental_health|crisis|housing|financial|recovery|dv|grief|disability|youth|caregiver|legal|spiritual|general","tier":0}]

Tier guide: 0=general, 1=low sensitivity, 2=moderate(housing/financial), 3=high(DV/substance), 4=restricted
If no valid resources found, return empty array: []

Search results:
${JSON.stringify(results.map(r => ({ title: r.title, url: r.url, content: r.content?.slice(0, 300) })))}`;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [{ role: "user", content: formatPrompt }],
      }),
    });

    if (!claudeRes.ok) throw new Error("Claude error " + claudeRes.status);
    const claudeData = await claudeRes.json();
    const claudeText = claudeData.content && claudeData.content[0] ? claudeData.content[0].text : "[]";

    let resources = [];
    try {
      const clean = claudeText.replace(/```json|```/g, "").trim();
      resources = JSON.parse(clean);
      if (!Array.isArray(resources)) resources = [];
    } catch(e) {
      resources = [];
    }

    // Auto-save to Appwrite for admin review (fire and forget)
    if (resources.length > 0) {
      try {
        const { Client, Databases, ID } = await import("appwrite");
        const client = new Client()
          .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || "https://nyc.cloud.appwrite.io/v1")
          .setProject(process.env.VITE_APPWRITE_PROJECT || "upstreamapproach");
        const databases = new Databases(client);
        const DB_ID = process.env.VITE_APPWRITE_DATABASE || "69c88588001ed071c19e";

        for (const r of resources.slice(0, 5)) {
          if (!r.name || !r.url) continue;
          await databases.createDocument(DB_ID, "resources", ID.unique(), {
            name: r.name.slice(0, 200),
            description: r.description?.slice(0, 500) || "",
            url: r.url.slice(0, 500),
            category: r.category || "general",
            tier: r.tier || 0,
            verified: false,
            source: "ai_found",
          }).catch(() => {}); // Ignore duplicates
        }
      } catch(e) {} // Never fail because of Appwrite
    }

    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({ resources, query: searchQuery }),
    };

  } catch(error) {
    console.error("Search error:", error);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({ error: "Search failed. Please try again.", resources: [] }),
    };
  }
};
