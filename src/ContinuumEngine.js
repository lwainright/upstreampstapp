// ============================================================
// ContinuumEngine.js
// Upstream Approach -- Mental Health Continuum + Signal Engine
// Used by AIChatScreen, ShiftCheckScreen, PSTRequestScreen
// No identity. No PHI. On-device only.
// ============================================================

// ── Continuum Levels ─────────────────────────────────────────
export const CONTINUUM_LEVELS = {
  GREEN:  { key: "green",  label: "Doing okay",      color: "#22c55e", score: 0 },
  YELLOW: { key: "yellow", label: "Feeling the weight",color: "#eab308", score: 1 },
  ORANGE: { key: "orange", label: "Struggling",       color: "#f97316", score: 2 },
  RED:    { key: "red",    label: "Need support now", color: "#ef4444", score: 3 },
};

// ── Signal Keywords (on-device, no network) ──────────────────
const YELLOW_SIGNALS = [
  "tired", "exhausted", "burnt out", "burnout", "overwhelmed", "stressed",
  "frustrated", "irritable", "short fuse", "can't focus", "can't sleep",
  "not sleeping", "dragging", "worn out", "running on empty", "stacking",
  "too much", "hard week", "hard shift", "rough day", "rough shift",
  "not okay", "struggling a bit", "off today", "not myself",
];

const ORANGE_SIGNALS = [
  "hopeless", "helpless", "worthless", "don't care anymore", "don't care",
  "what's the point", "can't do this", "can't keep going", "falling apart",
  "breaking down", "losing it", "losing my mind", "numb", "empty inside",
  "no way out", "trapped", "alone", "nobody cares", "nobody understands",
  "drink to cope", "drinking more", "using to cope", "self-medicating",
  "intrusive thoughts", "can't stop thinking", "nightmares", "flashbacks",
  "panic attacks", "can't breathe", "shutting down", "checked out",
];

const RED_SIGNALS = [
  "kill myself", "end it all", "end my life", "don't want to be here",
  "don't want to live", "suicidal", "want to die", "better off dead",
  "planning to", "have a plan", "goodbye", "not going to be around",
  "hurt myself", "hurting myself", "cutting", "self harm", "self-harm",
  "overdose", "take pills", "take all my pills", "shoot myself",
  "hang myself", "can't go on", "no reason to live", "goodbye everyone",
];

// ── On-Device Signal Detector ─────────────────────────────────
// Runs locally -- no network call required
export function detectContinuumLevel(text) {
  if (!text) return CONTINUUM_LEVELS.GREEN;
  const lower = text.toLowerCase();

  // Check red first -- highest priority
  if (RED_SIGNALS.some(s => lower.includes(s))) {
    return CONTINUUM_LEVELS.RED;
  }
  if (ORANGE_SIGNALS.some(s => lower.includes(s))) {
    return CONTINUUM_LEVELS.ORANGE;
  }
  if (YELLOW_SIGNALS.some(s => lower.includes(s))) {
    return CONTINUUM_LEVELS.YELLOW;
  }
  return CONTINUUM_LEVELS.GREEN;
}

// ── Escalation Check (combines multiple messages) ────────────
export function assessConversation(messages) {
  if (!messages || messages.length === 0) return CONTINUUM_LEVELS.GREEN;
  
  // Look at last 10 user messages
  const userMessages = messages
    .filter(m => m.from === "user" || m.role === "user")
    .slice(-10)
    .map(m => m.text || m.content || "")
    .join(" ");

  return detectContinuumLevel(userMessages);
}

// ── Operational Modes ─────────────────────────────────────────
// Determines what the AI should do based on continuum level
export function getOperationalMode(level) {
  switch(level.key) {
    case "red":    return "crisis";         // Immediate resources, no problem-solving
    case "orange": return "support";        // Slow down, offer PST, be present
    case "yellow": return "decompression";  // Tools, grounding, skill-building
    default:       return "companion";      // Normal peer conversation
  }
}

// ── Shift Check-In Continuum Assessment ──────────────────────
// Used by ShiftCheckScreen for structured check-in
export function assessShiftCheckin({ mood, energy, stress, sleep, connection }) {
  let score = 0;
  
  // Mood: 1=very low, 2=low, 3=okay, 4=good, 5=great
  if (mood <= 1) score += 3;
  else if (mood <= 2) score += 2;
  else if (mood <= 3) score += 1;

  // Energy: 1=depleted, 2=low, 3=okay, 4=good, 5=high
  if (energy <= 1) score += 2;
  else if (energy <= 2) score += 1;

  // Stress: 1=none, 2=low, 3=moderate, 4=high, 5=extreme
  if (stress >= 5) score += 3;
  else if (stress >= 4) score += 2;
  else if (stress >= 3) score += 1;

  // Sleep: 1=none, 2=poor, 3=fair, 4=good, 5=great
  if (sleep <= 1) score += 2;
  else if (sleep <= 2) score += 1;

  // Connection: 1=very isolated, 2=isolated, 3=okay, 4=connected, 5=very connected
  if (connection <= 1) score += 2;
  else if (connection <= 2) score += 1;

  if (score >= 8) return CONTINUUM_LEVELS.RED;
  if (score >= 5) return CONTINUUM_LEVELS.ORANGE;
  if (score >= 2) return CONTINUUM_LEVELS.YELLOW;
  return CONTINUUM_LEVELS.GREEN;
}

// ── Domain Profile (client-side version) ─────────────────────
// Mirrors the server-side domain profiles in chat.js
export function getDomainProfile(seat) {
  const profiles = {
    responder:       { pacing: "fast",     youthSafe: false, maxTier: 3 },
    veteran:         { pacing: "moderate", youthSafe: false, maxTier: 3 },
    telecommunications: { pacing: "fast", youthSafe: false, maxTier: 3 },
    humanservices:   { pacing: "moderate", youthSafe: false, maxTier: 3 },
    civilian:        { pacing: "moderate", youthSafe: false, maxTier: 2 },
    spouse:          { pacing: "moderate", youthSafe: false, maxTier: 3 },
    family:          { pacing: "slow",     youthSafe: true,  maxTier: 1 },
    retiree:         { pacing: "moderate", youthSafe: false, maxTier: 3 },
    hospital:        { pacing: "moderate", youthSafe: false, maxTier: 2 },
    school:          { pacing: "moderate", youthSafe: true,  maxTier: 1 },
    entertainment:   { pacing: "moderate", youthSafe: false, maxTier: 2 },
    mhpro:           { pacing: "slow",     youthSafe: false, maxTier: 3 },
  };
  return profiles[seat] || { pacing: "moderate", youthSafe: false, maxTier: 2 };
}

// ── Resource Tier Filter ──────────────────────────────────────
// Filters resources based on domain profile max tier
export function filterResourcesByTier(resources, seat) {
  const profile = getDomainProfile(seat);
  return resources.filter(r => (r.tier || 0) <= profile.maxTier);
}

// ── Youth Safe Filter ─────────────────────────────────────────
export function isYouthSafeContext(seat) {
  return getDomainProfile(seat).youthSafe;
}

// ── Recommended Response for Level ───────────────────────────
export function getContinuumRecommendation(level) {
  switch(level.key) {
    case "red":
      return {
        message: "This is important. Please reach out to 988 -- call or text, 24/7, free, confidential.",
        action: "crisis",
        showCrisis: true,
        showPST: true,
      };
    case "orange":
      return {
        message: "What you're sharing sounds like it deserves more support. Would you like to connect with a peer support team member?",
        action: "pst",
        showCrisis: false,
        showPST: true,
      };
    case "yellow":
      return {
        message: "That sounds like a lot to carry. Let's slow down for a minute.",
        action: "decompress",
        showCrisis: false,
        showPST: false,
      };
    default:
      return {
        message: null,
        action: "companion",
        showCrisis: false,
        showPST: false,
      };
  }
}
