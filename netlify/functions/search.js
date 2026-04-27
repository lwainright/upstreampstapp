// search.js -- AI Resource Finder
// Uses Claude directly -- no Tavily dependency
// One API key, no external search service

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: "Method not allowed" };

  try {
    const body = JSON.parse(event.body || "{}");
    const query = (body.query || "").slice(0, 300).trim();
    const scope = body.scope || "national";
    const location = (body.location || "").trim();
    const state = (body.state || "").trim();
    const seat = body.seat || "responder";

    if (!query) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Query required", resources: [] }) };
    }

    // Build location context
    let locationContext = "";
    if (scope === "local" && location) {
      locationContext = `Focus specifically on resources in or near ${location}. Include local nonprofits, county programs, and community organizations in that area.`;
    } else if (scope === "state" && state) {
      locationContext = `Focus on resources in ${state}. Include state-funded programs, NC 211, state hotlines, and organizations that serve ${state} residents specifically.`;
    } else if (scope === "regional" && state) {
      locationContext = `Focus on resources in the ${state} region. Include regional nonprofits and multi-county programs serving that area.`;
    } else {
      locationContext = "Focus on national resources available anywhere in the US.";
    }

    // Seat context
    const seatContext = {
      responder: "The user is a first responder (EMS, fire, law enforcement, dispatch, corrections).",
      veteran: "The user is a veteran or active military.",
      hospital: "The user is a hospital or healthcare worker.",
      school: "The user is a school staff member.",
      humanservices: "The user is a DSS, CPS, or human services worker.",
      entertainment: "The user is an entertainment industry worker.",
      mhpro: "The user is a mental health professional.",
      civilian: "The user is a civilian employee or general public.",
      spouse: "The user is the partner or spouse of a first responder or veteran.",
      family: "The user is a family member.",
    }[seat] || "The user is seeking support resources.";

    const prompt = `You are a resource specialist helping people find support resources.

${seatContext}
${locationContext}

The user is searching for: "${query}"

Return 6-10 resources that match this search. Include:
- National hotlines and organizations
- State-specific programs and agencies
- Local nonprofits, community centers, county programs if scope is local or regional
- 211 services (always relevant)
- Any relevant resource the person could actually use right now

Do NOT limit to only well-known organizations. If someone needs local help, give them local options.
Include real phone numbers and websites when you know them.
Mark free=true if the service is free or sliding scale.
Mark verified=false for local/regional resources you are less certain about so the user knows to confirm.

Return ONLY a JSON array, no markdown, no explanation:
[
  {
    "name": "Organization Name",
    "description": "What they do and who they serve in plain language",
    "url": "https://website.org or null",
    "phone": "800-xxx-xxxx or null",
    "category": "mental_health or crisis or recovery or grief or housing or financial or legal or general",
    "free": true,
    "verified": true
  }
]`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) {
      console.error("Claude error:", res.status);
      return { statusCode: 200, headers, body: JSON.stringify({ resources: [], error: "Search unavailable" }) };
    }

    const data = await res.json();
    const text = (data.content && data.content[0] ? data.content[0].text : "[]")
      .replace(/```json|```/g, "").trim();

    let resources = [];
    try {
      resources = JSON.parse(text);
      if (!Array.isArray(resources)) resources = [];
    } catch(e) {
      console.error("Parse error:", e.message);
      resources = [];
    }

    return { statusCode: 200, headers, body: JSON.stringify({ resources }) };

  } catch(err) {
    console.error("Search error:", err.message);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message, resources: [] }) };
  }
};
