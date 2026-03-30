// netlify/functions/chat.js
// Uses Anthropic Claude API - reliable, no key rotation needed

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `You are Upstream AI PST. Your role is to support first responders using a warm, steady, non-clinical tone.

CIT-informed communication:
- Slow the pace
- Offer simple choices to reduce pressure
- Create space before problem-solving
- Validate without labels or interpretation
- Ground the moment before offering guidance
- Never diagnose, assess, or evaluate risk
- Never use clinical or therapeutic language
- Never escalate or interpret danger; you only support the moment
- You cannot call for help, alert others, or take action outside the conversation

Tone guidelines:
- Calm, steady, peer-like presence
- Short, clear sentences
- No jargon or therapy terms
- No assumptions about the user
- No judgment, analysis, or evaluation
- Keep the moment simple and steady

Grounding behavior:
- Begin with a grounding line when the moment feels tense or fast
- Keep grounding gentle, optional, and non-directive
- Use plain, human language

Fallback rules:
- If unsure, slow the pace
- Offer a choice
- Ground the moment
- Keep language simple and steady

You are speaking with a first responder — paramedic, firefighter, law enforcement, dispatcher, or ER staff. You understand shift work, the weight of difficult calls, and the culture of pushing through. You speak like a peer, not a clinician.`;

exports.handler = async function (event) {
  // CORS preflight
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

  // Accept messages in either Gemini format (contents) or Claude format (messages)
  let messages = [];

  if (body.messages) {
    // Already in Claude format
    messages = body.messages;
  } else if (body.contents) {
    // Convert from Gemini format used by App.jsx
    messages = body.contents.map((m) => ({
      role: m.role === "model" ? "assistant" : "user",
      content: m.parts ? m.parts[0].text : m.content,
    }));
  } else if (body.prompt) {
    // Simple prompt format
    messages = [{ role: "user", content: body.prompt }];
  } else {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "No messages provided" }),
    };
  }

  // Use system prompt from request or fall back to built-in
  const systemPrompt =
    (body.systemInstruction &&
      body.systemInstruction.parts &&
      body.systemInstruction.parts[0].text) ||
    body.system ||
    SYSTEM_PROMPT;

  const maxTokens =
    (body.generationConfig && body.generationConfig.maxOutputTokens) || 400;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001", // Fast and affordable for chat
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: messages,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error("Anthropic error:", response.status, err);
      return {
        statusCode: response.status,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          error:
            err.error && err.error.message ? err.error.message : "API error",
        }),
      };
    }

    const data = await response.json();
    const text =
      data.content && data.content[0] && data.content[0].text;

    if (!text) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Empty response from AI" }),
      };
    }

    // Return in Gemini-compatible format so App.jsx needs zero changes
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        candidates: [
          {
            content: {
              parts: [{ text }],
            },
          },
        ],
        // Also include native Claude format
        content: data.content,
      }),
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
