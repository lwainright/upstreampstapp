// ═══════════════════════════════════════════════════════════════
// DEMO DATA LOADER - ENHANCED VERSION
// ═══════════════════════════════════════════════════════════════
// Utility for loading demo PST, CIT, and resource data
// © 2026 Upstream Applications, LLC
// ═══════════════════════════════════════════════════════════════

/**
 * Load all demo data files
 * @returns {Promise<Object>} Demo data with pst, cit, resources, and branding
 */
export const loadDemoData = async () => {
  try {
    // ENHANCED: Load all demo files in parallel for faster loading
    const [pst, cit, resources, branding] = await Promise.all([
      fetch("/demo/pst.json")
        .then(r => {
          if (!r.ok) throw new Error(`PST data failed: ${r.status}`);
          return r.json();
        })
        .catch(err => {
          console.warn("⚠️ PST data unavailable:", err.message);
          return []; // ADDED: Fallback to empty array
        }),
      
      fetch("/demo/cit.json")
        .then(r => {
          if (!r.ok) throw new Error(`CIT data failed: ${r.status}`);
          return r.json();
        })
        .catch(err => {
          console.warn("⚠️ CIT data unavailable:", err.message);
          return null; // ADDED: Fallback to null
        }),
      
      fetch("/demo/resources.json")
        .then(r => {
          if (!r.ok) throw new Error(`Resources failed: ${r.status}`);
          return r.json();
        })
        .catch(err => {
          console.warn("⚠️ Resources unavailable:", err.message);
          return []; // ADDED: Fallback to empty array
        }),
      
      // ADDED: Optional branding file
      fetch("/demo/branding.json")
        .then(r => {
          if (!r.ok) return null; // Branding is optional
          return r.json();
        })
        .catch(() => null) // Silent fail for optional file
    ]);
    
    // ADDED: Validate loaded data
    const validatedData = {
      pst: validatePSTData(pst),
      cit: validateCITData(cit),
      resources: validateResourcesData(resources),
      branding: branding || getDefaultBranding(), // ADDED: Default branding
      loadedAt: new Date().toISOString(), // ADDED: Timestamp
      isDemo: true // ADDED: Flag
    };
    
    // ADDED: Log successful load
    console.log("✅ Demo data loaded:", {
      pstMembers: validatedData.pst.length,
      citTeam: validatedData.cit ? "Loaded" : "None",
      resources: validatedData.resources.length,
      branding: "Loaded"
    });
    
    return validatedData;
    
  } catch (err) {
    // ENHANCED: More detailed error logging
    console.error("❌ Error loading demo data:", err);
    console.error("Stack trace:", err.stack);
    
    // ENHANCED: Return safe fallback with minimal data
    return getFallbackDemoData();
  }
};

// ═══════════════════════════════════════════════════════════════
// DATA VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Validate PST roster data
 * @param {Array} data - PST data array
 * @returns {Array} Validated PST data
 */
function validatePSTData(data) {
  if (!Array.isArray(data)) {
    console.warn("⚠️ PST data is not an array, using empty array");
    return [];
  }
  
  // Filter out invalid entries
  const valid = data.filter(member => {
    if (!member.id || !member.name) {
      console.warn("⚠️ Skipping invalid PST member:", member);
      return false;
    }
    return true;
  });
  
  return valid;
}

/**
 * Validate CIT team data
 * @param {Object} data - CIT data object
 * @returns {Object|null} Validated CIT data
 */
function validateCITData(data) {
  if (!data) return null;
  
  if (typeof data !== 'object') {
    console.warn("⚠️ CIT data is not an object, using null");
    return null;
  }
  
  // Ensure required fields exist
  if (!data.name && !data.id) {
    console.warn("⚠️ CIT data missing required fields");
    return null;
  }
  
  return data;
}

/**
 * Validate resources data
 * @param {Array} data - Resources data array
 * @returns {Array} Validated resources data
 */
function validateResourcesData(data) {
  if (!Array.isArray(data)) {
    console.warn("⚠️ Resources data is not an array, using empty array");
    return [];
  }
  
  // Filter out invalid entries
  const valid = data.filter(resource => {
    if (!resource.id || !resource.label) {
      console.warn("⚠️ Skipping invalid resource:", resource);
      return false;
    }
    return true;
  });
  
  return valid;
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT & FALLBACK DATA
// ═══════════════════════════════════════════════════════════════

/**
 * Get default branding configuration
 * @returns {Object} Default branding
 */
function getDefaultBranding() {
  return {
    logoUrl: "/icons/icon-512.png",
    primaryColor: "#38bdf8",
    secondaryColor: "#0b1829",
    accentColor: "#a78bfa",
    headerImageUrl: "",
    agencyName: "Demo Agency"
  };
}

/**
 * Get fallback demo data (minimal safe configuration)
 * @returns {Object} Fallback demo data
 */
function getFallbackDemoData() {
  return {
    pst: [], // No PST members
    cit: null, // No CIT team
    resources: [
      // ADDED: Minimal crisis resources even in fallback
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
    branding: getDefaultBranding(),
    loadedAt: new Date().toISOString(),
    isDemo: true,
    isFallback: true, // ADDED: Flag to indicate fallback mode
    fallbackReason: "Demo files failed to load"
  };
}

// ═══════════════════════════════════════════════════════════════
// INDIVIDUAL DATA LOADERS (Optional - for selective loading)
// ═══════════════════════════════════════════════════════════════

/**
 * Load only PST data
 * @returns {Promise<Array>} PST roster
 */
export const loadPSTData = async () => {
  try {
    const response = await fetch("/demo/pst.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return validatePSTData(data);
  } catch (err) {
    console.error("Error loading PST data:", err);
    return [];
  }
};

/**
 * Load only CIT data
 * @returns {Promise<Object|null>} CIT team
 */
export const loadCITData = async () => {
  try {
    const response = await fetch("/demo/cit.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return validateCITData(data);
  } catch (err) {
    console.error("Error loading CIT data:", err);
    return null;
  }
};

/**
 * Load only resources data
 * @returns {Promise<Array>} Resources
 */
export const loadResourcesData = async () => {
  try {
    const response = await fetch("/demo/resources.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return validateResourcesData(data);
  } catch (err) {
    console.error("Error loading resources data:", err);
    return [];
  }
};

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Check if demo data is available
 * @returns {Promise<boolean>} True if demo files exist
 */
export const isDemoDataAvailable = async () => {
  try {
    const response = await fetch("/demo/pst.json", { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Preload demo data (for faster access later)
 * @returns {Promise<void>}
 */
export const preloadDemoData = async () => {
  console.log("📥 Preloading demo data...");
  await loadDemoData();
  console.log("✅ Demo data preloaded");
};

/**
 * Clear demo data cache (if using caching)
 */
export const clearDemoDataCache = () => {
  // Future: Implement caching and clearing logic
  console.log("🗑️ Demo data cache cleared");
};

// ═══════════════════════════════════════════════════════════════
// EXPORT DEFAULT (for backward compatibility)
// ═══════════════════════════════════════════════════════════════

export default {
  loadDemoData,
  loadPSTData,
  loadCITData,
  loadResourcesData,
  isDemoDataAvailable,
  preloadDemoData,
  clearDemoDataCache
};
