// ═══════════════════════════════════════════════════════════════
// PST MEMBER TEMPLATE - ENHANCED VERSION
// ═══════════════════════════════════════════════════════════════
// Template for individual PST (Peer Support Team) members
// © 2026 Upstream Applications, LLC
// ═══════════════════════════════════════════════════════════════

export const PST_TEMPLATE = {
  // Member identification
  id: "", // string: UUID or generated ID (e.g., "pst-001")
  agencyId: "", // string: Which agency this PST belongs to (e.g., "metro-city-fd")
  
  // Personal information
  name: "", // string: Full name (e.g., "John Smith")
  role: "", // string: EMT, Paramedic, Firefighter, Telecommunicator, Police Officer, etc.
  unit: "", // string: Station/unit assignment (e.g., "Station 4", "HQ", "Dispatch")
  
  // Experience
  yearsService: 0, // number: Total years in service
  peerSince: 0, // number: Year they became PST (e.g., 2020)
  
  // PST specialties and areas of focus
  specialties: [], // array of strings: ["Trauma", "Pediatrics", "LE Support", "Family Crisis", "CISM", "Critical Incident", "Suicide Prevention"]
  
  // Contact information
  contact: {
    phone: "", // string: Contact phone number
    email: "", // string: Contact email (optional)
    preferredMethod: "phone" // string: "phone", "text", "email"
  },
  
  // Availability
  availability: {
    status: "available", // string: "available", "limited", "off-duty"
    currentShift: "", // string: Current shift schedule (e.g., "24-on, 48-off")
    onCallUntil: null, // date/string: When current on-call period ends (e.g., "2026-03-20")
    notes: "" // string: Availability notes (e.g., "Available evenings and weekends")
  },
  
  // Certifications and training
  certifications: [], // array of strings: ["CIT Basic", "PST Certification", "CISM", "Crisis Intervention"]
  
  // Languages spoken
  languages: ["English"], // array of strings: ["English", "Spanish", "ASL"]
  
  // Bio/introduction (optional)
  bio: "", // string: Brief introduction or background (for responder-facing display)
  
  // Internal notes (admin/coordinator only)
  internalNotes: "", // string: Admin notes not visible to responders
  
  // Statistics (optional, for tracking)
  stats: {
    totalContacts: 0, // number: Total times contacted
    totalFollowUps: 0, // number: Total follow-ups completed
    lastContact: null, // date/string: Last time contacted
    averageResponseTime: 0 // number: Average response time in minutes
  },
  
  // Profile settings
  settings: {
    visible: true, // boolean: Show in PST roster
    acceptsAnonymous: true, // boolean: Accepts anonymous wellness checks
    acceptsBroadcasts: true, // boolean: Receives "anyone available" broadcasts
    maxConcurrent: 3 // number: Max concurrent conversations
  },
  
  // Metadata
  createdAt: "", // string/date: When added to system
  updatedAt: "", // string/date: Last profile update
  active: true // boolean: Currently active PST member
};

// ═══════════════════════════════════════════════════════════════
// EXAMPLE PST MEMBER
// ═══════════════════════════════════════════════════════════════

export const EXAMPLE_PST_MEMBER = {
  id: "pst-jsmith-001",
  agencyId: "metro-city-fd",
  
  name: "John Smith",
  role: "Paramedic",
  unit: "Station 4",
  
  yearsService: 12,
  peerSince: 2020,
  
  specialties: [
    "Trauma Response",
    "Pediatric Calls",
    "Family Crisis",
    "Critical Incident Support"
  ],
  
  contact: {
    phone: "555-0100",
    email: "jsmith@metrocityfd.gov",
    preferredMethod: "phone"
  },
  
  availability: {
    status: "available",
    currentShift: "24-on, 48-off",
    onCallUntil: "2026-03-20",
    notes: "Available for calls during off-duty hours"
  },
  
  certifications: [
    "CIT Basic",
    "PST Certification",
    "CISM Level 1",
    "Crisis Intervention"
  ],
  
  languages: ["English", "Spanish"],
  
  bio: "12-year paramedic with experience in critical incident support. Available for peer conversations about tough calls, family stress, or just needing to talk.",
  
  internalNotes: "Very responsive, good with younger responders",
  
  stats: {
    totalContacts: 24,
    totalFollowUps: 18,
    lastContact: "2026-03-15",
    averageResponseTime: 15
  },
  
  settings: {
    visible: true,
    acceptsAnonymous: true,
    acceptsBroadcasts: true,
    maxConcurrent: 3
  },
  
  createdAt: "2020-06-15",
  updatedAt: "2026-03-17",
  active: true
};

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Create a new PST member from template
 */
export function createPSTMember(memberData) {
  return {
    ...PST_TEMPLATE,
    ...memberData,
    contact: {
      ...PST_TEMPLATE.contact,
      ...memberData.contact
    },
    availability: {
      ...PST_TEMPLATE.availability,
      ...memberData.availability
    },
    stats: {
      ...PST_TEMPLATE.stats,
      ...memberData.stats
    },
    settings: {
      ...PST_TEMPLATE.settings,
      ...memberData.settings
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Check if PST member is currently available
 */
export function isPSTAvailable(member) {
  if (!member.active) return false;
  if (!member.settings.visible) return false;
  if (member.availability.status === "off-duty") return false;
  
  // Check if on-call period has expired
  if (member.availability.onCallUntil) {
    const onCallDate = new Date(member.availability.onCallUntil);
    if (onCallDate < new Date()) return false;
  }
  
  return member.availability.status === "available";
}

/**
 * Get PST member display name with role
 */
export function getPSTDisplayName(member) {
  return `${member.name} - ${member.role}`;
}

/**
 * Filter PST members by specialty
 */
export function filterBySpecialty(members, specialty) {
  return members.filter(member => 
    member.specialties.includes(specialty) && 
    isPSTAvailable(member)
  );
}

/**
 * Update PST availability status
 */
export function updatePSTAvailability(member, status, notes = "") {
  return {
    ...member,
    availability: {
      ...member.availability,
      status,
      notes: notes || member.availability.notes
    },
    updatedAt: new Date().toISOString()
  };
}

// ═══════════════════════════════════════════════════════════════
// AVAILABILITY STATUS OPTIONS
// ═══════════════════════════════════════════════════════════════

export const PST_STATUS = {
  AVAILABLE: "available",
  LIMITED: "limited",
  OFF_DUTY: "off-duty"
};

export const PST_STATUS_LABELS = {
  available: "Available",
  limited: "Limited Availability",
  "off-duty": "Off Duty"
};

export const PST_STATUS_COLORS = {
  available: "#22c55e", // Green
  limited: "#eab308", // Yellow
  "off-duty": "#ef4444" // Red
};
