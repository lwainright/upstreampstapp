// ============================================================
// AgeExperience.js
// Upstream Initiative — Age-Based Experience Branching
// Detects family seat age key and returns appropriate config
// Used by HomeScreen, AIChatScreen, and resource screens
// ============================================================

// ── Age Progression Utilities ────────────────────────────────

/**
 * Calculate age key from birth year
 * Only birth year stored — never full DOB
 */
export function ageKeyFromBirthYear(birthYear) {
  const currentYear = new Date().getFullYear();
  const age = currentYear - parseInt(birthYear);
  if (age < 8)  return "under8";
  if (age < 13) return "8-12";
  if (age < 17) return "13-17";
  if (age < 18) return "17-18";
  if (age < 25) return "18-24";
  return "spouse"; // 25+ defaults to adult/spouse experience
}

/**
 * Check on app launch if age range needs updating
 * Fires silently — shows one notification if range changed
 * Returns { changed, oldKey, newKey } or null
 */
export function checkAgeProgression() {
  try {
    const birthYear = localStorage.getItem("upstream_family_birth_year");
    if (!birthYear) return null;

    const isFamilyMember = localStorage.getItem("upstream_family_member") === "true";
    if (!isFamilyMember) return null;

    const currentKey = localStorage.getItem("upstream_family_seat");
    const calculatedKey = ageKeyFromBirthYear(birthYear);

    if (calculatedKey !== currentKey) {
      // Update silently
      localStorage.setItem("upstream_family_seat", calculatedKey);
      // Update seats array
      const seatMap = {
        "under8":  ["family"],
        "8-12":    ["family"],
        "13-17":   ["family"],
        "17-18":   ["family"],
        "18-24":   ["family"],
        "spouse":  ["spouse"],
      };
      localStorage.setItem("upstream_seats", JSON.stringify(seatMap[calculatedKey] || ["family"]));
      return { changed: true, oldKey: currentKey, newKey: calculatedKey };
    }
    return { changed: false };
  } catch(e) { return null; }
}

/**
 * Get age-appropriate mental health resources
 * This is what changes with age — not the coping tools
 */
export function getAgeMentalHealthResources(ageKey) {
  const resources = {
    "under8": [
      { label: "Child Mind Institute — For Kids", detail: "Plain-language mental health for young children", url: "https://childmind.org/audience/for-kids/" },
      { label: "PBS Kids — Big Feelings", detail: "Age-appropriate emotional education", url: "https://pbskids.org" },
      { label: "988 — Tell a grown-up to call", detail: "988 · 24/7 · For any emotional emergency", phone: "988" },
    ],
    "8-12": [
      { label: "Child Mind Institute", detail: "Kid-friendly mental health resources", url: "https://childmind.org" },
      { label: "Kids Help Phone (Canada-based, US friendly)", detail: "Text-based support for kids", url: "https://kidshelpphone.ca" },
      { label: "988 Crisis Line", detail: "Call or text 988 · 24/7", phone: "988" },
      { label: "Crisis Text Line", detail: "Text HOME to 741741", text: "741741" },
      { label: "First Responders Children's Foundation", detail: "Free counseling for children of responders", url: "https://www.1stresponderchildren.org" },
    ],
    "13-17": [
      { label: "Teen Line", detail: "Text TEEN to 839863 · Peer support by teens for teens", text: "839863", textBody: "TEEN" },
      { label: "Crisis Text Line", detail: "Text HOME to 741741 · 24/7", text: "741741" },
      { label: "988 Crisis Line", detail: "Call or text 988 · 24/7", phone: "988" },
      { label: "Love is Respect", detail: "Ages 13-26 · Healthy relationship education", url: "https://www.loveisrespect.org" },
      { label: "Military Kids Connect", detail: "For kids 6-17 navigating a parent's service stress", url: "https://militarykidsconnect.health.mil" },
      { label: "JED Foundation — Teen Mental Health", detail: "Seize the Awkward — talking about mental health", url: "https://seizetheawkward.org" },
      { label: "NAMI — Teen & Young Adult Resources", detail: "Mental health education for teens", url: "https://www.nami.org/Support-Education/Teens-Young-Adults" },
    ],
    "17-18": [
      { label: "988 Crisis Line", detail: "Call or text 988 · 24/7", phone: "988" },
      { label: "Crisis Text Line", detail: "Text HOME to 741741 · 24/7", text: "741741" },
      { label: "Teen Line", detail: "Text TEEN to 839863 · Through age 19", text: "839863", textBody: "TEEN" },
      { label: "Love is Respect", detail: "Ages 13-26 · Healthy relationships", url: "https://www.loveisrespect.org" },
      { label: "JED Foundation", detail: "Mental health and suicide prevention for young adults", url: "https://www.jedfoundation.org" },
      { label: "NAMI Teen & Young Adult Resources", detail: "Mental health support transitioning to adulthood", url: "https://www.nami.org/Support-Education/Teens-Young-Adults" },
    ],
    "18-24": [
      { label: "988 Crisis Line", detail: "Call or text 988 · 24/7", phone: "988" },
      { label: "Crisis Text Line", detail: "Text HOME to 741741 · 24/7", text: "741741" },
      { label: "Active Minds — College Mental Health", detail: "Campus chapters and peer support", url: "https://www.activeminds.org" },
      { label: "JED Foundation", detail: "Mental health and suicide prevention for college students", url: "https://www.jedfoundation.org" },
      { label: "Love is Respect", detail: "Healthy relationship education through age 26", url: "https://www.loveisrespect.org" },
      { label: "NAMI HelpLine", detail: "Free mental health info and referrals", phone: "18009506264" },
      { label: "Open Path Collective", detail: "Affordable therapy — $30-$80/session", url: "https://openpathcollective.org" },
      { label: "Student Veterans of America", detail: "College support for children of veterans/responders", url: "https://www.studentveterans.org" },
      { label: "Responder Assistance Initiative (NC)", detail: "NC behavioral health services for young adults", url: "https://www.ncdhhs.gov" },
    ],
    "spouse": [
      { label: "988 Crisis Line", detail: "Call or text 988 · 24/7", phone: "988" },
      { label: "Crisis Text Line", detail: "Text HOME to 741741 · 24/7", text: "741741" },
      { label: "National DV Hotline", detail: "800-799-7233 · 24/7 · Confidential", phone: "18007997233" },
      { label: "NAMI HelpLine", detail: "Free mental health info and referrals", phone: "18009506264" },
      { label: "Psychology Today Therapist Finder", detail: "Find a therapist by specialty and insurance", url: "https://www.psychologytoday.com/us/therapists" },
      { label: "Open Path Collective", detail: "Affordable therapy — $30-$80/session", url: "https://openpathcollective.org" },
      { label: "Postpartum Support International", detail: "For new parents — mothers AND fathers", phone: "18009444773" },
    ],
  };
  return resources[ageKey] || resources["spouse"];
}

export const AGE_CONFIGS = {
  "18-24": {
    label: "Young Adult / College",
    greeting: "Hey",
    homeTitle: "How are you doing?",
    checkInEmojis: null,
    aiSystemPrompt: `You are a peer-level support for a young adult (18-24) navigating college, the job market, or early career — who grew up in or is connected to a first responder or veteran household. Rules:
- Full adult language. Peer tone. Real talk.
- Acknowledge the specific transition: leaving home, new independence, carrying what you grew up with into a new environment.
- College and job market stress is real on top of family background stress.
- Offer tools without pushing. Validate without over-reassuring.
- Financial stress, identity, relationships — all fair game.
- If crisis: direct to 988 clearly. "That sounds serious. 988 — call or text."
- Full tool set available. Parent notification OFF at this age — fully independent.
- Keep responses real and human.`,
    tools: ["breathing", "grounding", "journal", "ptsd", "hrv", "aichat", "resources"],
    crisisMessage: "That sounds serious. 988 — call or text. You don't have to figure this out alone.",
    escalateImmediately: false,
    cancelWindow: 0, // No parent notification — adult
    parentNotify: false,
    showPTSD: true,
    showHRV: true,
    showJournal: true,
    primaryColor: "#22c55e",
    bgColor: "rgba(34,197,94,0.08)",
  },

  "under8": {
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
