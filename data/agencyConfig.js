// ═══════════════════════════════════════════════════════════════
// AGENCY CONFIGURATION - ENHANCED VERSION
// ═══════════════════════════════════════════════════════════════
// This version includes all optional enhancements for better
// multi-agency support, branding control, and contact management
// ═══════════════════════════════════════════════════════════════

export const DEFAULT_AGENCY_CONFIG = {
  // Agency identification (ADDED)
  id: "", // e.g., "metro-city-fd"
  agencyCode: "", // e.g., "METRO24" (6-digit code users enter)
  
  // Branding (ENHANCED)
  branding: {
    logoUrl: "/icons/icon-512.png",
    primaryColor: "#38bdf8",
    secondaryColor: "#0b1829", // ADDED: for dark backgrounds
    accentColor: "#a78bfa", // ADDED: for PST features
    headerImageUrl: "",
    agencyName: "Upstream",
  },
  
  // Agency contact information (ADDED)
  contact: {
    adminEmail: "", // for support/questions
    adminPhone: "",
    website: ""
  },
  
  // Human PST roster (optional)
  pstRoster: [],
  
  // CIT team (optional)
  citTeam: null,
  
  // Local resources (optional)
  resources: [],
  
  // Access codes that unlock agency mode
  accessCodes: [],
  
  // Feature toggles (optional, safe defaults)
  features: {
    typingIndicator: false,
    groundingBar: false,
    demoMode: false,
  },
  
  // Optional: agency-specific quick prompts (future use)
  quickPrompts: [],
  
  // Optional: agency-specific resource categories (future use)
  resourceCategories: [],
  
  // Optional: agency-specific settings (future-proofing)
  settings: {
    allowPSTContact: true,
    allowCITModules: true,
    allowLocalResources: true,
  }
};

// ═══════════════════════════════════════════════════════════════
// EXAMPLE USAGE
// ═══════════════════════════════════════════════════════════════

export const EXAMPLE_AGENCY = {
  // Agency identification
  id: "metro-city-fd",
  agencyCode: "METRO24",
  
  // Branding with custom colors
  branding: {
    logoUrl: "/assets/metro-city-logo.png",
    primaryColor: "#ef4444", // Red for fire department
    secondaryColor: "#1e293b", // Dark slate
    accentColor: "#f59e0b", // Amber for alerts
    headerImageUrl: "/assets/metro-city-header.jpg",
    agencyName: "Metro City Fire Department",
  },
  
  // Contact information
  contact: {
    adminEmail: "pst@metrocityfd.gov",
    adminPhone: "555-0100",
    website: "https://metrocityfd.gov"
  },
  
  // PST roster
  pstRoster: [
    {
      name: "John Smith",
      role: "PST Coordinator",
      phone: "555-0100",
      available: true,
      unit: "HQ"
    },
    {
      name: "Jane Doe",
      role: "PST Specialist",
      phone: "555-0101",
      available: true,
      unit: "Station 4"
    }
  ],
  
  // CIT team reference
  citTeam: null, // Would reference a CIT_TEMPLATE object
  
  // Local resources
  resources: [
    {
      name: "Metro City Crisis Line",
      phone: "555-HELP",
      hours: "24/7",
      type: "crisis"
    }
  ],
  
  // Access codes
  accessCodes: ["METRO24", "MCFD2024"],
  
  // Features enabled
  features: {
    typingIndicator: true,
    groundingBar: true,
    demoMode: false,
  },
  
  // Quick prompts
  quickPrompts: [],
  
  // Resource categories
  resourceCategories: [],
  
  // Settings
  settings: {
    allowPSTContact: true,
    allowCITModules: true,
    allowLocalResources: true,
  }
};
