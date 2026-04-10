// ============================================================
// FETCH RESOURCES — Upstream Initiative
// Tiered resource lookup: Appwrite → SAMHSA → Directories → Lifelines
// Privacy first: ZIP never stored, only used for search
// ============================================================

const AW_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT;
const AW_PROJECT  = import.meta.env.VITE_APPWRITE_PROJECT;
const AW_DB       = import.meta.env.VITE_APPWRITE_DATABASE;

// ── Cache config ─────────────────────────────────────────────
const CACHE_KEY    = 'upstream_resources_cache';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

function saveToCache(results) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data:      results,
      timestamp: Date.now(),
    }));
  } catch(e) { /* storage full — skip */ }
}

function loadFromCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_EXPIRY) return null;
    return data;
  } catch(e) { return null; }
}

// ── Tier 4 — Always visible, no network needed ────────────────
export const LIFELINES = [
  {
    label: "988 Suicide & Crisis Lifeline",
    sub:   "Call or text 988 — 24/7",
    phone: "988",
    color: "#ef4444",
    icon:  "🆘",
  },
  {
    label: "Crisis Text Line",
    sub:   "Text HOME to 741741",
    phone: null,
    color: "#f97316",
    icon:  "💬",
  },
  {
    label: "Veterans Crisis Line",
    sub:   "Call 988, Press 1 — or text 838255",
    phone: "988",
    color: "#a78bfa",
    icon:  "🎖",
    veteranOnly: true,
  },
  {
    label: "Safe Call Now — First Responders",
    sub:   "1-206-459-3020 — 24/7",
    phone: "12064593020",
    color: "#38bdf8",
    icon:  "🚨",
    frOnly: true,
  },
];

// ── Tier 3 — Directory links, always shown ────────────────────
function buildDirectoryLinks(appType, isVeteran) {
  const links = [];

  if (appType === 'first_responder' || !appType) {
    links.push({
      label: "NVFC First Responder Helpline",
      sub:   "National Volunteer Fire Council — Behavioral Health Directory",
      url:   "https://www.nvfc.org/programs/fire-ems-helpline/",
      color: "#f97316",
      icon:  "🚒"
    });
    links.push({
      label: "Badge of Life",
      sub:   "Law Enforcement Mental Health Resources",
      url:   "https://www.badgeoflife.org",
      color: "#38bdf8",
      icon:  "🛡"
    });
    links.push({
      label: "First Responder Support Network",
      sub:   "Retreat programs and peer support",
      url:   "https://www.frsn.org",
      color: "#22c55e",
      icon:  "🤝"
    });
  }

  if (isVeteran) {
    links.push({
      label: "Make the Connection",
      sub:   "VA — Veteran mental health stories and resources",
      url:   "https://maketheconnection.net",
      color: "#a78bfa",
      icon:  "🎖"
    });
    links.push({
      label: "Vet Center Program",
      sub:   "Community-based counseling for Veterans",
      url:   "https://www.vetcenter.va.gov",
      color: "#eab308",
      icon:  "🏠"
    });
  }

  return links;
}

// ── Auto-import SAMHSA result to Appwrite ─────────────────────
async function cacheResourceToAppwrite(resource, zip, state, appType) {
  try {
    // Rate limit: only import once per ZIP per 30 days
    const lastImport = localStorage.getItem(`upstream_imported_${zip}`);
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (lastImport && Date.now() - Number(lastImport) < thirtyDays) return;

    const id = 'res' + Date.now() + Math.random().toString(36).slice(2, 5);
    await fetch(
      `${AW_ENDPOINT}/databases/${AW_DB}/collections/resources/documents`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': AW_PROJECT,
        },
        body: JSON.stringify({
          documentId: id,
          data: {
            title:      resource.name,
            phone:      resource.phone || '',
            address:    resource.address || '',
            zip_code:   zip,
            state:      state || '',
            type:       'treatment',
            source:     'samhsa_auto',
            app_type:   appType || 'first_responder',
            active:     true,
            verified:   false,
            external_id: resource.id || '',
            imported_at: new Date().toISOString(),
          }
        })
      }
    );

    localStorage.setItem(`upstream_imported_${zip}`, Date.now().toString());
  } catch(e) {
    // Silent — never interrupt user
  }
}

// ── Main fetch function ───────────────────────────────────────
export async function fetchResources({ zip, state, appType, isVeteran }) {

  // If offline — serve from cache immediately
  if (!navigator.onLine) {
    const cached = loadFromCache();
    if (cached) {
      return {
        ...cached,
        tier4: LIFELINES.filter(l => {
          if (l.veteranOnly && !isVeteran) return false;
          if (l.frOnly && appType !== 'first_responder') return false;
          return true;
        }),
        fromCache: true,
      };
    }
    // No cache — return tier 4 only
    return {
      tier1: [], tier2: [],
      tier3: buildDirectoryLinks(appType, isVeteran),
      tier4: LIFELINES.filter(l => {
        if (l.veteranOnly && !isVeteran) return false;
        if (l.frOnly && appType !== 'first_responder') return false;
        return true;
      }),
      fromCache: false,
      offline: true,
    };
  }

  const results = {
    tier1:   [],
    tier2:   [],
    tier3:   buildDirectoryLinks(appType, isVeteran),
    tier4:   LIFELINES.filter(l => {
      if (l.veteranOnly && !isVeteran) return false;
      if (l.frOnly && appType !== 'first_responder') return false;
      return true;
    }),
    loading: false,
    error:   null,
  };

  // ── Tier 1: Appwrite vetted resources ──────────────────────
  try {
    const types = [appType || 'first_responder'];
    if (isVeteran && appType !== 'veteran') types.push('veteran');

    let url = `${AW_ENDPOINT}/databases/${AW_DB}/collections/resources/documents?`;
    url += `queries[]=${encodeURIComponent(JSON.stringify({method:"equal",attribute:"active",values:[true]}))}`;
    url += `&queries[]=${encodeURIComponent(JSON.stringify({method:"equal",attribute:"verified",values:[true]}))}`;

    if (zip) {
      const zipUrl = url + `&queries[]=${encodeURIComponent(JSON.stringify({method:"equal",attribute:"zip_code",values:[zip]}))}`;
      const zipRes = await fetch(zipUrl, { headers: { 'X-Appwrite-Project': AW_PROJECT } });
      const zipData = await zipRes.json();

      if (zipData.documents?.length > 0) {
        results.tier1 = zipData.documents;
      } else if (state) {
        const stateUrl = url + `&queries[]=${encodeURIComponent(JSON.stringify({method:"equal",attribute:"state",values:[state]}))}`;
        const stateRes = await fetch(stateUrl, { headers: { 'X-Appwrite-Project': AW_PROJECT } });
        const stateData = await stateRes.json();
        results.tier1 = stateData.documents || [];
      }
    } else if (state) {
      const stateUrl = url + `&queries[]=${encodeURIComponent(JSON.stringify({method:"equal",attribute:"state",values:[state]}))}`;
      const stateRes = await fetch(stateUrl, { headers: { 'X-Appwrite-Project': AW_PROJECT } });
      const stateData = await stateRes.json();
      results.tier1 = stateData.documents || [];
    }
  } catch(e) {
    results.error = 'Could not reach resource database.';
  }

  // ── Tier 2: SAMHSA — only if Tier 1 empty ─────────────────
  if (results.tier1.length === 0 && zip) {
    try {
      const samhsa = await fetch(
        `https://findtreatment.gov/locator/api/v1/locations?sType=SA&zipCode=${zip}&radius=25&limit=5`
      );
      if (samhsa.ok) {
        const data = await samhsa.json();
        results.tier2 = (data.rows || []).map(r => ({
          title:   r.name1,
          phone:   r.phone,
          address: `${r.city}, ${r.state}`,
          type:    'samhsa',
          source:  'SAMHSA Treatment Locator',
          id:      r.id,
        }));

        // Auto-import to Appwrite for future use
        results.tier2.forEach(r => {
          cacheResourceToAppwrite(r, zip, state, appType);
        });
      }
    } catch(e) {
      // SAMHSA unreachable — skip, tier 4 still shows
    }
  }

  // Save to cache for offline use
  saveToCache(results);

  return results;
}
