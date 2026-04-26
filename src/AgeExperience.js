// AgeExperience.js
// Upstream Initiative - Age-Based Experience Branching

export const AGE_CONFIGS = {
  "18-24": {
    label: "Young Adult / College",
    greeting: "Hey",
    homeTitle: "How are you doing?",
    checkInEmojis: null,
    aiSystemPrompt: "You are a peer-level support for a young adult (18-24) navigating college or early career. Full adult language. Peer tone. Real talk. If crisis: direct to 988. No parent notification at this age.",
    tools: ["breathing", "grounding", "journal", "ptsd", "hrv", "aichat", "resources"],
    crisisMessage: "That sounds serious. 988 - call or text. You do not have to figure this out alone.",
    escalateImmediately: false,
    cancelWindow: 0,
    parentNotify: false,
    showPTSD: true,
    showHRV: true,
    showJournal: true,
    primaryColor: "#22c55e",
    bgColor: "rgba(34,197,94,0.08)",
  },
  "under8": {
    label: "Young Child",
    greeting: "Hi there!",
    homeTitle: "How are you feeling today?",
    checkInEmojis: ["happy", "okay", "sad", "angry", "scared"],
    checkInLabels: ["Happy", "Okay", "Sad", "Angry", "Scared"],
    aiSystemPrompt: "You are a warm, gentle friend for a very young child (under 8) whose parent is a first responder. Use very simple words. No sentences longer than 8 words. Never use clinical language. Always be warm and reassuring. If the child mentions anything scary at home, gently say: It is okay to tell a grown-up you trust.",
    tools: ["breathing_simple", "grounding_simple"],
    crisisMessage: "Can you find a grown-up you trust right now?",
    escalateImmediately: true,
    cancelWindow: 0,
    parentNotify: true,
    showPTSD: false,
    showHRV: false,
    showJournal: false,
    primaryColor: "#22c55e",
    bgColor: "rgba(34,197,94,0.08)",
  },
  "8-12": {
    label: "Child",
    greeting: "Hey!",
    homeTitle: "How are you doing today?",
    checkInEmojis: ["great", "okay", "alittleoff", "sad", "frustrated", "worried"],
    checkInLabels: ["Great", "Okay", "A little off", "Sad", "Frustrated", "Worried"],
    aiSystemPrompt: "You are a supportive friend for a child aged 8-12 whose parent is a first responder. Use clear, simple language. 6th grade reading level maximum. Never use clinical language. Be honest but gentle. Acknowledge their feelings first. If they mention feeling unsafe: direct to a trusted adult and provide 988. Keep responses short.",
    tools: ["breathing", "grounding", "journal"],
    crisisMessage: "That sounds really hard. Is there a trusted grown-up nearby you could talk to?",
    escalateImmediately: true,
    cancelWindow: 0,
    parentNotify: true,
    showPTSD: true,
    showHRV: false,
    showJournal: true,
    primaryColor: "#38bdf8",
    bgColor: "rgba(56,189,248,0.08)",
  },
  "13-17": {
    label: "Teen",
    greeting: "Hey",
    homeTitle: "How are you doing?",
    checkInEmojis: null,
    aiSystemPrompt: "You are a supportive peer for a teenager (13-17) whose parent is a first responder. Straight talk. No condescension. No therapy-speak. Acknowledge first, always. Be real about their situation. Do not push them to open up. 60-second cancel window before parent notification. Never lecture. Never moralize.",
    tools: ["breathing", "grounding", "journal", "ptsd", "aichat"],
    crisisMessage: "That sounds really serious. Will you reach out to 988 - call or text? You do not have to do this alone.",
    escalateImmediately: false,
    cancelWindow: 60,
    parentNotify: true,
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
    aiSystemPrompt: "You are a peer-level support for a young adult (17-18) who grew up in a first responder or veteran household. Adult-level language. Peer tone. No hand-holding. Be honest about secondary trauma. Offer tools as options. If crisis: direct to 988 clearly.",
    tools: ["breathing", "grounding", "journal", "ptsd", "hrv", "aichat", "resources"],
    crisisMessage: "That sounds like it needs real support. 988 - call or text. You do not have to figure this out alone.",
    escalateImmediately: false,
    cancelWindow: 60,
    parentNotify: true,
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
    aiSystemPrompt: "You are a supportive peer for a spouse or partner of a first responder or veteran. Peer-to-peer tone. Validate their experience. Never suggest they are overreacting. Acknowledge shift schedules, hypervigilance at home. If they mention feeling unsafe: immediately provide DV resources. No softening. Full adult tool set available.",
    tools: ["breathing", "grounding", "journal", "ptsd", "hrv", "aichat", "resources", "vault"],
    crisisMessage: "If you feel unsafe, the National DV Hotline is available 24/7: 800-799-7233. You can also text START to 88788.",
    escalateImmediately: false,
    cancelWindow: 0,
    parentNotify: false,
    showPTSD: true,
    showHRV: true,
    showJournal: true,
    primaryColor: "#f97316",
    bgColor: "rgba(249,115,22,0.08)",
  },
};

export function ageKeyFromBirthYear(birthYear) {
  const currentYear = new Date().getFullYear();
  const age = currentYear - parseInt(birthYear);
  if (age < 8)  return "under8";
  if (age < 13) return "8-12";
  if (age < 17) return "13-17";
  if (age < 18) return "17-18";
  if (age < 25) return "18-24";
  return "spouse";
}

export function checkAgeProgression() {
  try {
    const birthYear = localStorage.getItem("upstream_family_birth_year");
    if (!birthYear) return null;
    const isFamilyMember = localStorage.getItem("upstream_family_member") === "true";
    if (!isFamilyMember) return null;
    const currentKey = localStorage.getItem("upstream_family_seat");
    const calculatedKey = ageKeyFromBirthYear(birthYear);
    if (calculatedKey !== currentKey) {
      localStorage.setItem("upstream_family_seat", calculatedKey);
      const seatMap = {
        "under8": ["family"], "8-12": ["family"], "13-17": ["family"],
        "17-18": ["family"], "18-24": ["family"], "spouse": ["spouse"],
      };
      localStorage.setItem("upstream_seats", JSON.stringify(seatMap[calculatedKey] || ["family"]));
      return { changed: true, oldKey: currentKey, newKey: calculatedKey };
    }
    return { changed: false };
  } catch(e) { return null; }
}

export function getAgeMentalHealthResources(ageKey) {
  const resources = {
    "under8": [
      { label: "Child Mind Institute - For Kids", detail: "Plain-language mental health for young children", url: "https://childmind.org/audience/for-kids/" },
      { label: "PBS Kids - Big Feelings", detail: "Age-appropriate emotional education", url: "https://pbskids.org" },
      { label: "988 - Tell a grown-up to call", detail: "988 - 24/7 - For any emotional emergency", phone: "988" },
    ],
    "8-12": [
      { label: "Child Mind Institute", detail: "Kid-friendly mental health resources", url: "https://childmind.org" },
      { label: "988 Crisis Line", detail: "Call or text 988 - 24/7", phone: "988" },
      { label: "Crisis Text Line", detail: "Text HOME to 741741", text: "741741" },
      { label: "First Responders Children Foundation", detail: "Free counseling for children of responders", url: "https://www.1stresponderchildren.org" },
    ],
    "13-17": [
      { label: "Teen Line", detail: "Text TEEN to 839863 - Peer support by teens for teens", text: "839863", textBody: "TEEN" },
      { label: "Crisis Text Line", detail: "Text HOME to 741741 - 24/7", text: "741741" },
      { label: "988 Crisis Line", detail: "Call or text 988 - 24/7", phone: "988" },
      { label: "Love is Respect", detail: "Ages 13-26 - Healthy relationship education", url: "https://www.loveisrespect.org" },
      { label: "Military Kids Connect", detail: "For kids 6-17 with a parent in service", url: "https://militarykidsconnect.health.mil" },
      { label: "JED Foundation - Teen Mental Health", detail: "Talking about mental health", url: "https://seizetheawkward.org" },
      { label: "NAMI Teen Resources", detail: "Mental health education for teens", url: "https://www.nami.org/Support-Education/Teens-Young-Adults" },
    ],
    "17-18": [
      { label: "988 Crisis Line", detail: "Call or text 988 - 24/7", phone: "988" },
      { label: "Crisis Text Line", detail: "Text HOME to 741741 - 24/7", text: "741741" },
      { label: "Teen Line", detail: "Text TEEN to 839863 - Through age 19", text: "839863", textBody: "TEEN" },
      { label: "Love is Respect", detail: "Ages 13-26 - Healthy relationships", url: "https://www.loveisrespect.org" },
      { label: "JED Foundation", detail: "Mental health and suicide prevention for young adults", url: "https://www.jedfoundation.org" },
      { label: "NAMI Young Adult Resources", detail: "Mental health support transitioning to adulthood", url: "https://www.nami.org/Support-Education/Teens-Young-Adults" },
    ],
    "18-24": [
      { label: "988 Crisis Line", detail: "Call or text 988 - 24/7", phone: "988" },
      { label: "Crisis Text Line", detail: "Text HOME to 741741 - 24/7", text: "741741" },
      { label: "Active Minds - College Mental Health", detail: "Campus chapters and peer support", url: "https://www.activeminds.org" },
      { label: "JED Foundation", detail: "Mental health for college students", url: "https://www.jedfoundation.org" },
      { label: "Love is Respect", detail: "Healthy relationship education through age 26", url: "https://www.loveisrespect.org" },
      { label: "NAMI HelpLine", detail: "Free mental health info and referrals", phone: "18009506264" },
      { label: "Open Path Collective", detail: "Affordable therapy - $30-$80/session", url: "https://openpathcollective.org" },
      { label: "Student Veterans of America", detail: "College support for children of veterans", url: "https://www.studentveterans.org" },
    ],
    "spouse": [
      { label: "988 Crisis Line", detail: "Call or text 988 - 24/7", phone: "988" },
      { label: "Crisis Text Line", detail: "Text HOME to 741741 - 24/7", text: "741741" },
      { label: "National DV Hotline", detail: "800-799-7233 - 24/7 - Confidential", phone: "18007997233" },
      { label: "NAMI HelpLine", detail: "Free mental health info and referrals", phone: "18009506264" },
      { label: "Psychology Today Therapist Finder", detail: "Find a therapist by specialty and insurance", url: "https://www.psychologytoday.com/us/therapists" },
      { label: "Open Path Collective", detail: "Affordable therapy - $30-$80/session", url: "https://openpathcollective.org" },
      { label: "Postpartum Support International", detail: "For new parents - mothers AND fathers", phone: "18009444773" },
    ],
  };
  return resources[ageKey] || resources["spouse"];
}

export function getAgeConfig() {
  try {
    const ageKey = localStorage.getItem("upstream_family_seat");
    const isFamilyMember = localStorage.getItem("upstream_family_member") === "true";
    if (isFamilyMember && ageKey && AGE_CONFIGS[ageKey]) {
      return { ...AGE_CONFIGS[ageKey], ageKey, isFamilyMember: true };
    }
  } catch(e) {}
  return null;
}

export function getAgeGreeting(ageKey) {
  const config = AGE_CONFIGS[ageKey];
  if (!config) return null;
  const hr = new Date().getHours();
  if (ageKey === "under8" || ageKey === "8-12") {
    return hr < 12 ? "Good morning!" : hr < 17 ? "Good afternoon!" : "Good evening!";
  }
  return config.greeting;
}

export function getAgeSystemPrompt(ageKey) {
  const config = AGE_CONFIGS[ageKey];
  return config ? config.aiSystemPrompt : null;
}

export function shouldEscalateImmediately(ageKey) {
  return AGE_CONFIGS[ageKey] ? AGE_CONFIGS[ageKey].escalateImmediately : false;
}

export function getEscalationCancelWindow(ageKey) {
  return AGE_CONFIGS[ageKey] ? AGE_CONFIGS[ageKey].cancelWindow : 60;
}
