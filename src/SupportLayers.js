// ============================================================
// SupportLayers.js
// Upstream Approach -- Cross-Cutting Support Overlays
// Developmental Support + Spirituality + Recovery
// These are overlays, not standalone modules.
// Called by domain screens when context requires them.
// No identity. No diagnosis. No clinical language.
// ============================================================

// ── DEVELOPMENTAL SUPPORT LAYER ──────────────────────────────
// For workers interacting with people who process differently.
// Also for family members supporting someone with DD/ID.
// Language: behavioral, not diagnostic. Never label the person.

export const DEVELOPMENTAL_SUPPORT = {

  // Communication adjustments for workers
  communicationAdjustments: [
    { title: "Use concrete language", body: "Avoid abstract instructions. Instead of 'calm down,' say 'sit here with me.' Instead of 'think about it,' say 'let's look at this together.'" },
    { title: "Give one instruction at a time", body: "Multiple steps at once create overwhelm. Pause between each instruction and wait for a response before continuing." },
    { title: "Allow processing time", body: "Some people need significantly more time to process and respond. Silence is not resistance. Wait before repeating or rephrasing." },
    { title: "Offer choices, not open questions", body: "Instead of 'what do you want?' try 'do you want A or B?' Choices reduce overwhelm while preserving autonomy." },
    { title: "Watch for sensory overload", body: "Loud environments, bright lights, physical crowding, or multiple speakers can trigger shutdown or escalation. Reduce input before asking questions." },
    { title: "Match your pace to theirs", body: "Slowing your speech, lowering your voice, and reducing movement signals safety. Fast movement and loud voice signal threat." },
    { title: "Avoid figurative language", body: "Idioms, sarcasm, and metaphors can be confusing or misinterpreted literally. Use plain, direct language." },
    { title: "Predictability is grounding", body: "Explain what is going to happen before it happens. Transitions are hard. Warnings help." },
  ],

  // Deescalation steps for workers
  deescalationSteps: [
    { title: "Do not match their energy", body: "If they are escalating, your escalation amplifies theirs. Lower your voice, slow your movements, and create space." },
    { title: "Name what you see, not what you assume", body: "Instead of 'you are angry,' try 'I can see this is really hard right now.' Naming behavior, not intent, stays factual." },
    { title: "Give them a job", body: "A simple, concrete task can redirect escalating energy. 'Can you hold this for me?' or 'Can you sit here?' creates engagement without confrontation." },
    { title: "Reduce demands temporarily", body: "During escalation, removing demands often reduces intensity faster than adding them. Come back to the original task when calm is restored." },
    { title: "Find the sensory trigger first", body: "Behavior is communication. If someone is escalating without an obvious cause, look for sensory input -- sound, smell, touch, temperature, lighting." },
  ],

  // Resources for workers and families
  resources: [
    { label: "AAIDD -- American Association on Intellectual and Developmental Disabilities", detail: "Professional standards and advocacy for DD/ID support", url: "https://www.aaidd.org" },
    { label: "The Arc", detail: "Advocacy and services for people with intellectual and developmental disabilities", url: "https://www.thearc.org" },
    { label: "NACM -- National Association of Case Managers", detail: "Case management resources for DD/ID populations", url: "https://www.acmaweb.org" },
    { label: "Autism Society of America", detail: "Resources for autism support across the lifespan", url: "https://www.autismsociety.org" },
    { label: "PACER Center", detail: "Resources for families of children with disabilities", url: "https://www.pacer.org" },
    { label: "Self-Advocates Becoming Empowered", detail: "By and for people with intellectual disabilities", url: "https://www.sabeusa.org" },
    { label: "NC DHHS Developmental Disabilities", detail: "NC-specific services and resources", url: "https://www.ncdhhs.gov/divisions/daas/developmental-disabilities" },
  ],

  // For family members
  familyGuide: [
    { title: "Routine is not rigidity", body: "Predictable routines reduce anxiety and create safety. This is not stubbornness -- it is a nervous system that depends on predictability to feel safe." },
    { title: "Meltdowns are not tantrums", body: "A meltdown is involuntary sensory or emotional overload, not a behavioral choice. Punishment during a meltdown makes it worse and longer." },
    { title: "Find their communication", body: "Some people communicate through behavior, gesture, picture, device, or silence. Learning their communication system matters more than requiring them to use yours." },
    { title: "Your wellbeing matters too", body: "Caregiver burnout is real and common. You cannot support someone else's nervous system when yours is dysregulated. Your self-care is part of their care." },
  ],
};

// ── SPIRITUALITY SUPPORT LAYER ────────────────────────────────
// Universal first. Faith-specific only when user asks.
// Non-religious language is default.
// No scripture reproduced in full. Summaries only.
// Available to all domains as an optional overlay.

export const SPIRITUALITY_SUPPORT = {

  // Universal -- no religion assumed
  universal: {
    groundingPrompts: [
      "What is one thing in your life right now that is larger than this moment?",
      "Where do you find meaning in the work you do?",
      "What is one thing that reminded you recently that connection is real?",
      "What would you want someone going through this to know?",
      "Where does your sense of purpose come from, when everything else feels heavy?",
    ],
    meaningMaking: [
      { title: "Your presence matters", body: "The fact that you showed up -- for the call, for the patient, for the student, for the family -- is not nothing. Presence in hard moments is one of the most human things there is." },
      { title: "Meaning is not always visible in the moment", body: "The impact of what you do often surfaces later -- in someone's recovery, in a family that stayed together, in a student who remembered one adult who didn't give up on them." },
      { title: "Grief and purpose can coexist", body: "Caring deeply enough to grieve is a sign that what you do matters. The weight is not proof that you failed -- it is proof that you are present." },
    ],
    breathPrayer: [
      { inhale: "I am here", exhale: "This is enough" },
      { inhale: "I showed up", exhale: "That counts" },
      { inhale: "I am grounded", exhale: "I can release this" },
      { inhale: "I am connected", exhale: "I am not alone" },
    ],
  },

  // Faith-specific -- only surface when user explicitly asks
  faithSpecific: {
    christian: {
      shortVerses: [
        { reference: "Psalm 46:1", text: "God is our refuge and strength, an ever-present help in trouble." },
        { reference: "Isaiah 40:31", text: "Those who hope in the Lord will renew their strength." },
        { reference: "Matthew 5:4", text: "Blessed are those who mourn, for they will be comforted." },
        { reference: "Philippians 4:13", text: "I can do all this through him who gives me strength." },
        { reference: "Psalm 23:4", text: "Even though I walk through the darkest valley, I will fear no evil, for you are with me." },
      ],
      encouragement: "You are not carrying this alone. Your presence in this work is not an accident.",
    },
    muslim: {
      shortVerses: [
        { reference: "Quran 2:286", text: "God does not burden a soul beyond that it can bear." },
        { reference: "Quran 94:5-6", text: "Indeed, with hardship will be ease. Indeed, with hardship will be ease." },
        { reference: "Quran 13:28", text: "Surely in the remembrance of God do hearts find rest." },
      ],
      encouragement: "Sabr -- patience and steadfastness -- is itself a form of worship. You are doing sacred work.",
    },
    jewish: {
      shortVerses: [
        { reference: "Psalm 121:1-2", text: "I lift up my eyes to the mountains -- where does my help come from? My help comes from the Lord." },
        { reference: "Isaiah 41:10", text: "Do not fear, for I am with you; do not be dismayed, for I am your God." },
      ],
      encouragement: "Tikkun Olam -- repairing the world -- is not finished in one day, or one career. You are part of something larger.",
    },
    buddhist: {
      shortVerses: [
        { reference: "Dhammapada 1", text: "Mind is the forerunner of all actions. If one speaks or acts with a serene mind, happiness follows." },
        { reference: "Traditional teaching", text: "May all beings be happy. May all beings be safe. May all beings be healthy. May all beings live with ease." },
      ],
      encouragement: "Compassion for others begins with compassion for yourself. You cannot pour from an empty vessel.",
    },
    indigenous: {
      encouragement: "Many traditions recognize the sacred nature of those who walk between worlds -- those who carry others through difficult passages. Your work has been honored in human communities for as long as humans have existed.",
    },
  },

  // Chaplaincy and spiritual care resources
  resources: [
    { label: "National Association of Chaplains", detail: "Chaplaincy resources and referrals", url: "https://www.professionalchaplains.org" },
    { label: "Fire Service Chaplain Network", detail: "Chaplains specifically for fire and EMS", url: "https://www.fireservicechaplaincy.org" },
    { label: "Law Enforcement Chaplaincy", detail: "Chaplains for law enforcement officers", url: "https://www.lecusa.org" },
    { label: "The Schwartz Center", detail: "Compassion support for healthcare workers -- spiritually inclusive", url: "https://www.theschwartzcenter.org" },
    { label: "Chaplaincy Innovation Lab", detail: "Connecting people with spiritual care across contexts", url: "https://chaplaincyinnovation.org" },
  ],
};

// ── RECOVERY SUPPORT LAYER ────────────────────────────────────
// Non-judgmental. Non-diagnostic. User-led only.
// Available everywhere. Never pushed. Never assumed.
// First responder-specific resources included.

export const RECOVERY_SUPPORT = {

  // Micro-tools -- on-device, no network
  microTools: {
    urgeSurfing: [
      { title: "Name it", body: "What is the urge telling you it wants? Name it specifically -- not 'I want to drink,' but 'I want to stop feeling this way.' That distinction matters." },
      { title: "Rate it", body: "On a scale of 0 to 10, how intense is the urge right now? Naming a number makes it less abstract and often slightly smaller." },
      { title: "Ride the wave", body: "Urges are not permanent. They peak and pass, usually within 20-30 minutes if you do not act on them. This one will too." },
      { title: "Ground in right now", body: "Name 5 things you can see. 4 you can touch. 3 you can hear. 2 you can smell. 1 you can taste. You are in this moment, not in the craving." },
      { title: "One minute at a time", body: "You do not have to not drink forever right now. You just have to not drink in the next minute. Then the next one." },
    ],
    grounding: [
      "Press your feet into the floor and feel the ground under you.",
      "Hold something cold -- ice water, a cold surface -- and focus on the sensation.",
      "Take three slow breaths. Exhale longer than you inhale.",
      "Name one thing in front of you that is not related to what you are feeling.",
      "Text or call one person. Say anything. The connection is the intervention.",
    ],
  },

  // Peer support resources
  peerSupport: [
    { label: "SMART Recovery", detail: "Science-based addiction recovery -- online and in-person meetings", url: "https://www.smartrecovery.org" },
    { label: "AA -- Alcoholics Anonymous", detail: "Peer-led recovery -- meetings worldwide", url: "https://www.aa.org" },
    { label: "NA -- Narcotics Anonymous", detail: "Peer-led recovery for substance use", url: "https://www.na.org" },
    { label: "LifeRing Secular Recovery", detail: "Non-religious peer recovery support", url: "https://lifering.org" },
    { label: "Refuge Recovery", detail: "Buddhist-informed addiction recovery", url: "https://refugerecovery.org" },
    { label: "Recovery Dharma", detail: "Community-based, peer-led Buddhist recovery", url: "https://recoverydharma.org" },
  ],

  // First responder specific
  firstResponderSpecific: [
    { label: "First Responders First", detail: "Substance use and mental health support specifically for first responders", url: "https://firstrespondersfirst.org" },
    { label: "IAFF Center of Excellence", detail: "Fire and EMS addiction and mental health treatment", url: "https://www.iaffrecoverycenter.com" },
    { label: "Code Green Campaign", detail: "Mental health resources for first responders including substance use", url: "https://codegreencampaign.org" },
    { label: "Safe Call Now", detail: "24/7 confidential helpline for public safety professionals -- 1-206-459-3020", phone: "12064593020" },
    { label: "Responder Alliance", detail: "Peer support and recovery for first responders", url: "https://responderalliance.org" },
  ],

  // Treatment options
  treatment: [
    { label: "SAMHSA Treatment Locator", detail: "Find local treatment options -- free and confidential", url: "https://findtreatment.gov" },
    { label: "SAMHSA National Helpline", detail: "Free confidential treatment referrals -- 800-662-4357 -- 24/7", phone: "18006624357" },
    { label: "Hazelden Betty Ford", detail: "Residential and outpatient treatment -- first responder aware", url: "https://www.hazeldenbettyford.org" },
    { label: "Valley Hope", detail: "Residential and outpatient treatment with first responder programs", url: "https://www.valleyhope.org" },
  ],

  // Family support
  familySupport: [
    { label: "Al-Anon", detail: "Support for family and friends of people with alcohol use disorder", url: "https://al-anon.org" },
    { label: "Nar-Anon", detail: "Support for families affected by substance use", url: "https://www.nar-anon.org" },
    { label: "Families Anonymous", detail: "Peer support for families dealing with substance use", url: "https://www.familiesanonymous.org" },
    { label: "SMART Recovery Family and Friends", detail: "Science-based support for families", url: "https://www.smartrecovery.org/family" },
  ],

  // Harm reduction
  harmReduction: [
    { label: "SAMHSA Harm Reduction Resources", detail: "Evidence-based harm reduction information", url: "https://www.samhsa.gov/find-help/harm-reduction" },
    { label: "Naloxone Access", detail: "Find naloxone near you -- NEXT Distro", url: "https://nextdistro.org" },
    { label: "NEXT Distro", detail: "Mail-order naloxone and harm reduction supplies", url: "https://nextdistro.org" },
  ],
};

// ── Resource Language Pack ────────────────────────────────────
// The vocabulary the AI uses when searching for resources
// not already in Appwrite. Used by search.js (Tavily queries).
export const RESOURCE_LANGUAGE_PACK = {
  mentalHealth: ["mental health support", "peer support", "emotional support", "community mental health", "free counseling", "non-clinical support", "stress support group"],
  crisis: ["crisis line", "suicide prevention", "crisis support", "emergency mental health", "crisis stabilization"],
  recovery: ["recovery support group", "substance use support", "peer recovery", "harm reduction", "addiction recovery", "sober support"],
  spirituality: ["spiritual support", "faith-based community", "chaplaincy", "spiritual care", "faith-sensitive counseling"],
  domesticViolence: ["domestic violence support", "DV shelter", "safety planning", "survivor support", "protective order help", "confidential shelter"],
  housing: ["housing assistance", "emergency shelter", "rent assistance", "utility assistance", "eviction prevention", "transitional housing"],
  financial: ["financial assistance", "emergency aid", "food assistance", "utility help", "employment support", "community relief"],
  caregiver: ["caregiver support", "respite care", "caregiver burnout", "kinship care", "elder care navigation", "disability caregiver"],
  disability: ["disability services", "accessibility resources", "assistive technology", "ADA navigation", "disability support"],
  youth: ["youth support", "teen support", "youth crisis", "youth mental health", "school-based support", "youth peer support"],
  grief: ["grief support", "bereavement group", "loss support", "grief counseling", "sudden loss support"],
  legal: ["legal aid", "tenant rights", "employment rights", "family court", "protective order", "legal navigation"],
  transportation: ["medical transport", "community transport", "disability transport", "rural transport", "safe ride program"],
  community: ["community center", "volunteer group", "support circle", "peer group", "community connection"],
  universal: ["local support services", "community programs", "nonprofit organizations", "public resources", "state assistance", "peer support groups"],
};

// ── Resource Tier Definitions ─────────────────────────────────
// Used by the policy engine to filter what each domain sees
export const RESOURCE_TIERS = {
  0: "General info -- appropriate for all audiences including youth",
  1: "Low sensitivity -- appropriate for most adult audiences",
  2: "Moderate sensitivity -- housing, financial, general MH -- most domains",
  3: "High sensitivity -- DV, substance use, CPS navigation -- professional/adult domains",
  4: "Restricted -- admin only, geo-limited, requires agency configuration",
};

// ── Vetting Checklist ─────────────────────────────────────────
// The criteria the AI uses before sending a resource for approval
export const VETTING_CHECKLIST = [
  "Has a real website or verifiable contact information",
  "Is a known nonprofit, government agency, or community organization",
  "Avoids scam patterns -- no paywalls, crypto, predatory practices",
  "Uses non-coercive, non-manipulative language",
  "Does not require identity unless operationally necessary (e.g., DV shelters)",
  "Matches the category the user requested",
  "Serves the correct population for this domain",
  "Is free or low-cost, or clearly explains any costs",
  "Available in the correct geographic scope",
  "Aligns with platform tone -- non-clinical, non-diagnostic, non-judgmental",
  "Safe for the domain -- youth-safe if school context, staff-appropriate if professional context",
];
