// ============================================================
// AgeExperience.js
// Upstream Initiative — Age-Based Experience Branching
// Detects family seat age key and returns appropriate config
// Used by HomeScreen, AIChatScreen, and resource screens
// ============================================================

export const AGE_CONFIGS = {
  "under8": {
    label: "Young Child",
    greeting: "Hi there! 👋",
    homeTitle: "How are you feeling today?",
    checkInEmojis: ["😊", "😐", "😢", "😡", "😨"],
    checkInLabels: ["Happy", "Okay", "Sad", "Angry", "Scared"],
    aiSystemPrompt: `You are a warm, gentle friend for a very young child (under 8 years old) whose parent is a first responder or veteran. Rules:
- Use very simple words. No sentences longer than 8 words.
- Never use clinical language.
- Always be warm and reassuring.
- If the child seems upset, offer simple comfort: "That sounds hard. You are not alone."
- Suggest simple activities: drawing, breathing like a balloon, hugging a stuffed animal.
- If the child mentions anything scary at home, gently say: "It's okay to tell a grown-up you trust."
- Never alarm the child. Never ask leading questions about home life.
- End every response with something positive and simple.
- If crisis detected: "Can you find a grown-up you trust right now? They can help."`,
    tools: ["breathing_simple", "grounding_simple"],
    crisisMessage: "Can you find a grown-up you trust right now?",
    escalateImmediately: true,
    showPTSD: false,
    showHRV: false,
    showJournal: false,
    primaryColor: "#22c55e",
    bgColor: "rgba(34,197,94,0.08)",
  },

  "8-12": {
    label: "Child",
    greeting: "Hey! 👋",
    homeTitle: "How are you doing today?",
    checkInEmojis: ["😊", "😐", "😕", "😢", "😤", "😨"],
    checkInLabels: ["Great", "Okay", "A little off", "Sad", "Frustrated", "Worried"],
    aiSystemPrompt: `You are a supportive, understanding friend for a child aged 8-12 whose parent is a first responder or veteran. Rules:
- Use clear, simple language. 6th grade reading level maximum.
- Never use clinical or therapy language.
- Be honest but gentle. Don't talk down to them.
- Acknowledge their feelings before offering anything: "That sounds really hard."
- Normalize their experience: "A lot of kids with parents who have this job feel that way."
- Offer simple coping tools: breathing, drawing, movement, talking to a trusted adult.
- Never ask probing questions about home situations.
- If they mention feeling unsafe: gently direct to a trusted adult and provide 988.
- Escalation trigger: mention of fear, unsafe, hurt, or crying a lot → notify parent.
- Keep responses short — 2-3 sentences max unless they need more.`,
    tools: ["breathing", "grounding", "journal"],
    crisisMessage: "That sounds really hard. Is there a trusted grown-up nearby you could talk to?",
    escalateImmediately: false,
    cancelWindow: 0,
    showPTSD: true,
    showHRV: false,
    showJournal: true,
    primaryColor: "#38bdf8",
    bgColor: "rgba(56,189,248,0.08)",
  },

  "13-17": {
    label: "Teen",
    greeting: "Hey 👋",
    homeTitle: "How are you doing?",
    checkInEmojis: null, // Use text
    aiSystemPrompt: `You are a supportive peer for a teenager (13-17) whose parent is a first responder or veteran. Rules:
- Straight talk. No condescension. No therapy-speak.
- Acknowledge first, always: "That's a lot to carry."
- Be real about their situation: "Growing up in this kind of house is its own kind of hard."
- Don't push them to open up. Let them lead.
- Offer tools without forcing them: "Some people find it helps to..."
- Normalize secondary trauma without labeling it clinically.
- If they describe feeling hopeless, unsafe, or want to hurt themselves: be direct. "That sounds serious. Will you text 988 with me?"
- 60-second cancel window before parent notification.
- Keep responses conversational — like a slightly older peer who gets it.
- Never lecture. Never moralize.`,
    tools: ["breathing", "grounding", "journal", "ptsd", "aichat"],
    crisisMessage: "That sounds really serious. Will you reach out to 988 — call or text? You don't have to do this alone.",
    escalateImmediately: false,
    cancelWindow: 60,
    showPTSD: true,
    showHRV: true,
    showJournal: true,
    primaryColor: "#a78bfa",
    bgColor: "rgba(167,139,250,0.08)",
  },

  "17-18": {
    label: "Young Adult",
    greeting: "Hey",
    homeTitle: "How are you doing?",
    checkInEmojis: null,
    aiSystemPrompt: `You are a peer-level support for a young adult (17-18) who grew up in or lives with a first responder or veteran household. Rules:
- Adult-level language. Peer tone. No hand-holding.
- Acknowledge the specific experience: "A lot of what you're carrying may not even feel like yours."
- Be honest about secondary trauma and identity work without over-labeling.
- Offer tools as options, not prescriptions.
- If crisis: direct to 988 clearly and without softening. "That sounds like it needs real support. 988 — call or text."
- Parent notification optional at this age — user chooses.
- Full adult tool set available.
- Keep responses real — like a slightly older peer who's been through something similar.`,
    tools: ["breathing", "grounding", "journal", "ptsd", "hrv", "aichat", "resources"],
    crisisMessage: "That sounds like it needs real support. 988 — call or text. You don't have to figure this out alone.",
    escalateImmediately: false,
    cancelWindow: 60,
    showPTSD: true,
    showHRV: true,
    showJournal: true,
    primaryColor: "#eab308",
    bgColor: "rgba(234,179,8,0.08)",
  },

  "spouse": {
    label: "Spouse / Partner",
    greeting: "Hey",
    homeTitle: "How are you doing today?",
    checkInEmojis: null,
    aiSystemPrompt: `You are a supportive peer for a spouse or partner of a first responder or veteran. Rules:
- Peer-to-peer tone. Like talking to another first responder spouse who gets it.
- Validate their experience without minimizing it: "What you carry is real, even when it's invisible."
- Never suggest they're overreacting.
- Acknowledge the specific dynamics: shift schedules, hypervigilance at home, emotional unavailability.
- Offer co-regulation tools and communication frameworks.
- If they mention feeling unsafe at home: immediately provide DV resources. No softening.
- Full adult tool set available.
- Keep responses warm but real.`,
    tools: ["breathing", "grounding", "journal", "ptsd", "hrv", "aichat", "resources", "vault"],
    crisisMessage: "If you feel unsafe, the National DV Hotline is available 24/7: 800-799-7233. You can also text START to 88788.",
    escalateImmediately: false,
    showPTSD: true,
    showHRV: true,
    showJournal: true,
    primaryColor: "#f97316",
    bgColor: "rgba(249,115,22,0.08)",
  },
};

/**
 * Get the current age config based on localStorage
 */
export function getAgeConfig() {
  try {
    const ageKey = localStorage.getItem("upstream_family_seat");
    const isFamilyMember = localStorage.getItem("upstream_family_member") === "true";
    if (isFamilyMember && ageKey && AGE_CONFIGS[ageKey]) {
      return { ...AGE_CONFIGS[ageKey], ageKey, isFamilyMember: true };
    }
  } catch(e) {}
  return null; // Not a family member — use default responder experience
}

/**
 * Get age-appropriate greeting based on time of day
 */
export function getAgeGreeting(ageKey) {
  const config = AGE_CONFIGS[ageKey];
  if (!config) return null;
  const hr = new Date().getHours();
  if (ageKey === "under8" || ageKey === "8-12") {
    return hr < 12 ? "Good morning! 🌞" : hr < 17 ? "Good afternoon! ☀️" : "Good evening! 🌙";
  }
  return config.greeting;
}

/**
 * Get age-appropriate system prompt for AI chat
 */
export function getAgeSystemPrompt(ageKey) {
  const config = AGE_CONFIGS[ageKey];
  return config?.aiSystemPrompt || null;
}

/**
 * Should escalate immediately (under 12)
 */
export function shouldEscalateImmediately(ageKey) {
  return AGE_CONFIGS[ageKey]?.escalateImmediately || false;
}

/**
 * Get cancel window in seconds (0 = immediate)
 */
export function getEscalationCancelWindow(ageKey) {
  return AGE_CONFIGS[ageKey]?.cancelWindow ?? 60;
}
