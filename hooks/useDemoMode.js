// ═══════════════════════════════════════════════════════════════
// USE DEMO MODE HOOK - ENHANCED VERSION
// ═══════════════════════════════════════════════════════════════
// Custom hook for initializing demo mode with comprehensive data
// © 2026 Upstream Applications, LLC
// ═══════════════════════════════════════════════════════════════

import { loadDemoData } from "../utils/demo.js";

/**
 * Demo mode hook - initializes demo agency data when user enters demo code
 * 
 * @param {string} agencyCode - The access code entered by user
 * @param {function} setRole - State setter for user role
 * @param {function} setAgencyData - State setter for agency configuration
 * @param {function} setDemoMode - ADDED: State setter for demo mode flag
 * @returns {Promise<boolean>} - Returns true if demo mode was activated
 */
export const useDemoMode = async (
  agencyCode, 
  setRole, 
  setAgencyData,
  setDemoMode = null // ADDED: Optional demo mode setter
) => {
  // Check if code matches any demo codes
  const DEMO_CODES = ["UPSTREAM", "DEMO"]; // ADDED: Support multiple demo codes
  const isDemoCode = DEMO_CODES.includes(agencyCode.toUpperCase());
  
  if (!isDemoCode) {
    return false; // ADDED: Return false if not demo code
  }
  
  // Set role to demo
  setRole("demo");
  
  // Set demo mode flag if setter provided
  if (setDemoMode) {
    setDemoMode(true);
  }
  
  try {
    // Load demo data from files
    const data = await loadDemoData();
    
    // ENHANCED: Merge demo data with complete configuration
    const demoConfig = {
      // Agency identification (ADDED)
      id: "demo-agency",
      agencyCode: "UPSTREAM",
      
      // Branding (ADDED)
      branding: {
        logoUrl: data.branding?.logoUrl || "/icons/icon-512.png",
        primaryColor: data.branding?.primaryColor || "#38bdf8",
        secondaryColor: data.branding?.secondaryColor || "#0b1829",
        accentColor: data.branding?.accentColor || "#a78bfa",
        headerImageUrl: data.branding?.headerImageUrl || "",
        agencyName: data.branding?.agencyName || "Demo Agency"
      },
      
      // Contact information (ADDED)
      contact: {
        adminEmail: "demo@upstream.app",
        adminPhone: "555-DEMO",
        website: "https://upstream.app"
      },
      
      // PST roster from demo data
      pstRoster: data.pst || [],
      pst: data.pst || [], // Keep both for compatibility
      
      // CIT team from demo data
      citTeam: data.cit || null,
      cit: data.cit || null, // Keep both for compatibility
      
      // Resources from demo data
      resources: data.resources || [],
      
      // Access codes (ADDED)
      accessCodes: ["UPSTREAM", "DEMO"],
      
      // Feature toggles - all enabled for demo
      features: {
        typingIndicator: true,
        groundingBar: true,
        demoMode: true, // Critical: marks as demo mode
        voiceMode: true, // ADDED: Enable voice in demo
        notifications: false, // ADDED: Disable real notifications in demo
        analytics: false // ADDED: Disable analytics in demo
      },
      
      // Quick prompts (ADDED)
      quickPrompts: data.quickPrompts || [
        "I just had a rough call",
        "Feeling burned out",
        "Need to talk about something",
        "Having trouble sleeping",
        "Family stress is getting to me"
      ],
      
      // Resource categories (ADDED)
      resourceCategories: data.resourceCategories || [
        "Crisis Support",
        "Mental Health",
        "Peer Support",
        "EAP Services"
      ],
      
      // Settings (ADDED)
      settings: {
        allowPSTContact: true,
        allowCITModules: true,
        allowLocalResources: true,
        allowAnonymousReports: true // ADDED
      },
      
      // Demo mode metadata (ADDED)
      isDemoMode: true,
      demoNotice: "You are in demo mode. All data is fictional and for demonstration purposes only.",
      demoLimitations: [
        "PST contact requests are simulated",
        "No real notifications will be sent",
        "Data is not saved between sessions"
      ]
    };
    
    // Set agency data with demo configuration
    setAgencyData(demoConfig);
    
    // Log demo mode activation (ADDED)
    console.log("✅ Demo mode activated:", {
      pstMembers: demoConfig.pstRoster?.length || 0,
      resources: demoConfig.resources?.length || 0,
      citTeam: demoConfig.citTeam ? "Loaded" : "None"
    });
    
    return true; // ADDED: Return success
    
  } catch (err) {
    console.error("❌ Demo mode failed to load:", err);
    
    // ENHANCED: Safe fallback with better defaults
    const fallbackConfig = {
      id: "demo-agency-fallback",
      agencyCode: "UPSTREAM",
      
      branding: {
        logoUrl: "/icons/icon-512.png",
        primaryColor: "#38bdf8",
        secondaryColor: "#0b1829",
        accentColor: "#a78bfa",
        headerImageUrl: "",
        agencyName: "Demo Agency (Fallback)"
      },
      
      contact: {
        adminEmail: "demo@upstream.app",
        adminPhone: "555-DEMO",
        website: "https://upstream.app"
      },
      
      pstRoster: [], // Empty roster
      pst: [],
      
      citTeam: null,
      cit: null,
      
      resources: [
        // Minimal crisis resources even in fallback (ADDED)
        {
          id: "fallback-988",
          type: "crisis",
          label: "988 Suicide & Crisis Lifeline",
          description: "24/7 confidential support",
          link: "https://988lifeline.org",
          phone: "988",
          hours: "24/7",
          category: "crisis"
        },
        {
          id: "fallback-safecall",
          type: "first-responder",
          label: "Safe Call Now",
          description: "Confidential help for first responders",
          link: "https://www.safecallnow.org",
          phone: "1-206-459-3020",
          hours: "24/7",
          category: "responder-support"
        }
      ],
      
      accessCodes: ["UPSTREAM", "DEMO"],
      
      features: {
        typingIndicator: true,
        groundingBar: true,
        demoMode: true,
        voiceMode: true,
        notifications: false,
        analytics: false
      },
      
      quickPrompts: [
        "I need to talk",
        "Having a rough day",
        "Could use some support"
      ],
      
      resourceCategories: ["Crisis Support", "Mental Health"],
      
      settings: {
        allowPSTContact: false, // CHANGED: Disabled if no PST loaded
        allowCITModules: true,
        allowLocalResources: true,
        allowAnonymousReports: false // CHANGED: Disabled if no PST
      },
      
      isDemoMode: true,
      demoNotice: "Demo mode loaded with limited data (fallback mode)",
      demoLimitations: [
        "Demo data failed to load completely",
        "Some features may be unavailable",
        "Contact system administrators if issue persists"
      ],
      loadError: err.message // ADDED: Error details for debugging
    };
    
    setAgencyData(fallbackConfig);
    
    // Log fallback activation (ADDED)
    console.warn("⚠️ Demo mode using fallback configuration");
    
    return true; // Still return true - demo mode is active, just limited
  }
};

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Check if an access code is a demo code
 * @param {string} code - Access code to check
 * @returns {boolean} - True if demo code
 */
export function isDemoCode(code) {
  const DEMO_CODES = ["UPSTREAM", "DEMO"];
  return DEMO_CODES.includes(code.toUpperCase());
}

/**
 * Exit demo mode and reset to anonymous user
 * @param {function} setRole - State setter for role
 * @param {function} setAgencyData - State setter for agency data
 * @param {function} setDemoMode - State setter for demo mode flag
 */
export function exitDemoMode(setRole, setAgencyData, setDemoMode = null) {
  setRole(null);
  setAgencyData(null);
  
  if (setDemoMode) {
    setDemoMode(false);
  }
  
  console.log("👋 Exited demo mode");
}

/**
 * Get demo mode status from agency data
 * @param {object} agencyData - Current agency configuration
 * @returns {boolean} - True if in demo mode
 */
export function isInDemoMode(agencyData) {
  return agencyData?.isDemoMode === true || 
         agencyData?.features?.demoMode === true;
}

/**
 * Get demo limitations/warnings
 * @param {object} agencyData - Current agency configuration
 * @returns {array} - List of limitations
 */
export function getDemoLimitations(agencyData) {
  return agencyData?.demoLimitations || [
    "Demo data is fictional",
    "No real actions will be taken",
    "Data is not persistent"
  ];
}

// ═══════════════════════════════════════════════════════════════
// DEMO MODE CONFIGURATION
// ═══════════════════════════════════════════════════════════════

/**
 * Demo codes that activate demo mode
 */
export const DEMO_ACCESS_CODES = ["UPSTREAM", "DEMO"];

/**
 * Default demo configuration (used as template)
 */
export const DEFAULT_DEMO_CONFIG = {
  id: "demo-agency",
  agencyCode: "UPSTREAM",
  branding: {
    logoUrl: "/icons/icon-512.png",
    primaryColor: "#38bdf8",
    secondaryColor: "#0b1829",
    accentColor: "#a78bfa",
    agencyName: "Demo Agency"
  },
  features: {
    typingIndicator: true,
    groundingBar: true,
    demoMode: true,
    voiceMode: true,
    notifications: false,
    analytics: false
  },
  isDemoMode: true
};
