// ============================================================
// netlify/functions/chat.js
// Upstream Approach -- AI Peer Support + Admin AI
// Continuum-Aware: Green/Yellow/Orange/Red classification
// Domain Profile Injection: seat/agency config shapes tone
// Privacy-First: no identity, no PHI, no session logging
// ============================================================

const Anthropic = require("@anthropic-ai/sdk");

// ── Mental Health Continuum Definitions ──────────────────────
// These are the thresholds the classifier uses.
// Red/Orange trigger PST handoff logic.
const CONTINUUM_CLASSIFIER_PROMPT = `
You are a mental health continuum classifier for a peer support platform.
Analyze the conversation and classify the user's current state.

Return ONLY a JSON object with this exact structure:
{
  "level": "green" | "yellow" | "orange" | "red",
  "confidence": "high" | "medium" | "low",
  "indicators": ["brief", "list", "of", "what", "you", "noticed"],
  "recommendPST": true | false,
  "recommendCrisis": true | false
}

Continuum definitions:
- GREEN: Healthy/thriving. Stress is manageable. No distress signals. Seeking decompression or resources.
- YELLOW: Reacting. Elevated stress, burnout signs, frustration, fatigue. Functional but struggling. Needs support tools.
- ORANGE: Injured. Significant distress. Hopelessness, isolation, unable to cope, sleep disruption, intrusive thoughts. Needs human PST.
- RED: Crisis. Active suicidal ideation, self-harm, acute psychiatric emergency, imminent danger to self or others. Needs immediate crisis resources.

Be conservative -- when in doubt, rate lower not higher.
Never rate GREEN if any distress is present.
ORANGE and RED should trigger recommendPST: true.
RED should always trigger recommendCrisis: true.
`;

// ── Domain Profile System Prompts ────────────────────────────
// Each seat gets a tone and behavior preset.
// These inject into the AI system prompt.
const DOMAIN_PROFILES = {
  responder: {
    tone: "peer",
    style: "Brief, direct, tactical. No therapy-speak. No long intros. Get to the point. You are a peer who has been there, not a counselor. First responder culture values brevity and action over processing.",
    pacing: "fast",
    maxTier: 3,
  },
  veteran: {
    tone: "peer",
    style: "Peer to peer. Military culture aware. No civilian assumptions. Acknowledge service without glorifying it. Direct but not cold. Honor the experience without over-thanking.",
    pacing: "moderate",
    maxTier: 3,
  },
  telecommunications: {
    tone: "peer",
    style: "Dispatch and comm center aware. Acknowledge the invisible nature of the work -- never on scene but always in it. Brief and practical.",
    pacing: "fast",
    maxTier: 3,
  },
  humanservices: {
    tone: "peer",
    style: "DSS/CPS/APS aware. Secondary trauma is real. System fatigue is real. Acknowledge the weight of decisions that affect families. No judgment about the system.",
    pacing: "moderate",
    maxTier: 3,
  },
  civilian: {
    tone: "supportive",
    style: "Warm, accessible, non-clinical. Government and civilian workforce. Workplace stress, bureaucratic pressure, secondary exposure. Meet them where they are.",
    pacing: "moderate",
    maxTier: 2,
  },
  spouse: {
    tone: "supportive",
    style: "Partner of a first responder or veteran. Acknowledge the secondary exposure, the schedule disruption, the emotional unavailability. DV resources always available. Never minimize their experience.",
    pacing: "moderate",
    maxTier: 3,
  },
  family: {
    tone: "gentle",
    style: "Family member. Age-aware. Warm, accessible, simple language. Non-clinical. Meet them where they are developmentally.",
    pacing: "slow",
    maxTier: 1,
  },
  retiree: {
    tone: "peer",
    style: "Retired first responder or veteran. Identity transition is real. Loss of role, loss of structure, loss of community. Peer tone, not clinical. Acknowledge the career without minimizing the transition.",
    pacing: "moderate",
    maxTier: 3,
  },
  hospital: {
    tone: "peer",
    style: "Hospital staff. Moral injury, compassion fatigue, burnout. Clinical-adjacent language is okay but do not use diagnostic framing. Peer tone. Acknowledge the specific weight of healthcare work.",
    pacing: "moderate",
    maxTier: 2,
  },
  school: {
    tone: "peer",
    style: "School staff. Behavioral stress, parent conflict, administrative pressure. Youth-safe language. Never clinical. Soft, accessible, practical.",
    pacing: "moderate",
    maxTier: 1,
    youthSafe: true,
  },
  entertainment: {
    tone: "peer",
    style: "Entertainment industry. No routing. No escalation. Private decompression only. The director might be the stressor. Peer tone, flexible, non-judgmental.",
    pacing: "moderate",
    maxTier: 2,
  },
  mhpro: {
    tone: "peer",
    style: "Mental health professional. Peer to peer. They know the clinical language -- do not use it with them. Acknowledge the specific weight of holding space for others. Boundary fatigue, compassion fatigue, vicarious trauma.",
    pacing: "slow",
    maxTier: 3,
  },
  default: {
    tone: "supportive",
    style: "Warm, accessible, peer-style support. Non-clinical. Meet them where they are.",
    pacing: "moderate",
    maxTier: 2,
  },
};

// ── Continuum Response Templates ─────────────────────────────
// What the AI appends when it detects Orange or Red
const CONTINUUM_RESPONSES = {
  orange: {
    pstOffer: "\n\n---\nWhat you are sharing sounds like it deserves more than I can offer right now. Would you like me to connect you with a peer support team member? They are trained for exactly this. Tap 'Talk to Someone' on the home screen to request support.",
    tone: "slow down, be present, do not rush to solutions",
  },
  red: {
    crisis: "\n\n---\n**If you are in crisis right now:** Call or text **988** -- 24/7, free, confidential. Or text HOME to 741741.\n\nYou do not have to figure this out alone.",
    tone: "safety first, no problem-solving, direct to crisis resources immediately",
  },
};

// ── Core Handler ─────────────────────────────────────────────
exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const {
      messages = [],
      systemPrompt,
      agencyName,
      seat,           // user's seat (responder, veteran, hospital, etc.)
      ageKey,         // family member age key if applicable
      isAdmin = false,
      isAdminAI = false,
      adminContext,
    } = body;

    const client = new Anthropic.Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // ── Admin AI path (separate from peer support) ──────────
    if (isAdminAI) {
      const adminResponse = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        system: `You are an AI business assistant for Upstream Initiative LLC, a first responder wellness platform company. You help the platform owner with: client management, invoice tracking, writing, platform analytics, and business decisions. Current context: ${adminContext || "General business assistance"}. Be concise and practical.`,
        messages: messages.slice(-10),
      });

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          content: adminResponse.content[0]?.text || "",
          continuum: null,
          isAdminAI: true,
        }),
      };
    }

    // ── Get domain profile based on seat ────────────────────
    const profile = DOMAIN_PROFILES[seat] || DOMAIN_PROFILES.default;

    // ── Build system prompt ──────────────────────────────────
    const baseSystem = systemPrompt || `You are a confidential peer support companion for ${agencyName || "Upstream Approach"}. You provide anonymous, judgment-free emotional support.`;

    const domainInjection = `

TONE AND STYLE: ${profile.style}
PACING: ${profile.pacing}
IMPORTANT RULES:
- Never identify the user
- Never store or reference personal information
- Never provide clinical diagnosis or treatment
- Never recommend specific medications
- Always offer 988 if crisis indicators are present
- Keep responses ${profile.pacing === "fast" ? "brief -- 2-3 sentences max unless they need more" : profile.pacing === "slow" ? "warm and spacious -- give them room" : "conversational -- match their energy"}
- You are a peer, not a therapist
- This is not clinical care, not documentation, not reporting`;

    const fullSystem = baseSystem + domainInjection;

    // ── Run continuum classification on recent messages ──────
    let continuumResult = null;
    const recentMessages = messages.slice(-6); // Last 6 messages only

    if (recentMessages.length > 0 && !isAdmin) {
      try {
        const conversationText = recentMessages
          .map(m => `${m.role}: ${m.content}`)
          .join("\n");

        const classifierResponse = await client.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 200,
          system: CONTINUUM_CLASSIFIER_PROMPT,
          messages: [{ role: "user", content: conversationText }],
        });

        const classifierText = classifierResponse.content[0]?.text || "{}";
        // Strip any markdown fences
        const cleanJson = classifierText.replace(/```json|```/g, "").trim();
        continuumResult = JSON.parse(cleanJson);
      } catch (e) {
        // Classifier failed -- continue without it, do not crash
        continuumResult = { level: "green", confidence: "low", recommendPST: false, recommendCrisis: false };
      }
    }

    // ── Build response based on continuum level ──────────────
    let continuumInstruction = "";
    if (continuumResult) {
      if (continuumResult.level === "red") {
        continuumInstruction = `\n\nCRITICAL: The user appears to be in crisis (RED on the mental health continuum). ${CONTINUUM_RESPONSES.red.tone}. Append crisis resources to your response.`;
      } else if (continuumResult.level === "orange") {
        continuumInstruction = `\n\nIMPORTANT: The user appears to be significantly distressed (ORANGE on the mental health continuum). ${CONTINUUM_RESPONSES.orange.tone}. Gently offer PST connection.`;
      } else if (continuumResult.level === "yellow") {
        continuumInstruction = `\n\nNOTE: The user is showing signs of stress (YELLOW). Be warm and supportive. Offer coping tools naturally.`;
      }
    }

    // ── Generate peer support response ──────────────────────
    const chatResponse = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system: fullSystem + continuumInstruction,
      messages: messages.slice(-20), // Last 20 messages for context
    });

    let responseText = chatResponse.content[0]?.text || "";

    // ── Append continuum-triggered additions ─────────────────
    if (continuumResult?.level === "red") {
      responseText += CONTINUUM_RESPONSES.red.crisis;
    } else if (continuumResult?.level === "orange" && continuumResult?.recommendPST) {
      responseText += CONTINUUM_RESPONSES.orange.pstOffer;
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        content: responseText,
        continuum: continuumResult,
        // Frontend uses this to show PST button, crisis resources, etc.
        showPSTOffer: continuumResult?.recommendPST || false,
        showCrisis: continuumResult?.recommendCrisis || false,
        continuumLevel: continuumResult?.level || "green",
      }),
    };

  } catch (error) {
    console.error("Chat function error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Something went wrong. Please try again.",
        content: "I am having trouble connecting right now. If you are in crisis, please call or text 988.",
        continuum: null,
        showCrisis: false,
        showPSTOffer: false,
        continuumLevel: "green",
      }),
    };
  }
};
