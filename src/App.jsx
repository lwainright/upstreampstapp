import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './hooks/useAuth';
import LoginScreen from './components/LoginScreen';
import { LogoProvider } from './ui.jsx';

// Screens
import SplashScreen from './SplashScreen';
import AgencyCodeScreen from './AgencyCodeScreen';
import HomeScreen from './HomeScreen';
import RoughCallScreen from './RoughCallScreen';
import AIChatScreen from './AIChatScreen';
import HumanPSTScreen from './HumanPSTScreen';
import ShiftCheckScreen from './ShiftCheckScreen';
import ToolsScreen from './ToolsScreen';
import BreathingScreen from './BreathingScreen';
import GroundingScreen from './GroundingScreen';
import JournalScreen from './JournalScreen';
import AfterActionScreen from './AfterActionScreen';
import Dump90Screen from './Dump90Screen';
import AdminToolsScreen from './AdminToolsScreen';
import AdminAIScreen from './AdminAIScreen';
import PlatformOwnerScreen from './PlatformOwnerScreen';
import PSTPanelScreen from './PSTPanelScreen';
import DashboardScreen from './DashboardScreen';
import MetricsScreen from './MetricsScreen';
import ResourcesScreen from './ResourcesScreen';
import PTSDInterruptionScreen from './PTSDInterruptionScreen';
import MasterLoginModal from './MasterLoginModal';
import AboutScreen from './AboutScreen';
import EmergencyContactsScreen from './EmergencyContactsScreen';
import CustomAlertsScreen from './CustomAlertsScreen';
import EducationalScreen from './EducationalScreen';
import FeedbackScreen from './FeedbackScreen';
import HRVScreen from './HRVScreen';

import { trackTool, trackSessionStart } from './analytics.js';
import IDVerifyScreen from './IDVerifyScreen';
import SafetyVaultScreen from './SafetyVaultScreen';
import VeteransScreen from './VeteransScreen';
import CivilianScreen from './CivilianScreen';
import FamilyConnectScreen from './FamilyConnectScreen';
import PSTRequestScreen from './PSTRequestScreen';
import PSTDispatchBoard from './PSTDispatchBoard';
import SeatSelectorScreen from './SeatSelectorScreen';
import DivisionSelectorScreen, { DivisionSwitcher } from './DivisionSelectorScreen';
import AppGuideScreen from './AppGuideScreen';
import KidsHomeScreen from './KidsHomeScreen';
import { getAgeConfig } from './AgeExperience.js';

const APP_VERSION = "2.2.6";
const isOpsRole = (r) => r === "supervisor" || r === "admin" || r === "platform";

const ROLES = ["user", "pst", "supervisor", "admin", "platform"];
const ROLE_LABELS = {
  user: "Responder", pst: "PST Member", supervisor: "Supervisor",
  admin: "Admin", platform: "Platform Owner",
};
const ROLE_COLORS = {
  user: "#38bdf8", pst: "#a78bfa", supervisor: "#eab308",
  admin: "#94a3b8", platform: "#f59e0b",
};
const ROLE_BADGES = {
  user: "USER", pst: "PST", supervisor: "SUPV",
  admin: "ADMIN", platform: "PLATFORM",
};

const LOGO_SRC = "https://nyc.cloud.appwrite.io/v1/storage/buckets/69e14d570027ebb13e13/files/69e154f3003b5265e9a3/view?project=upstreamapproach";
const LOGO_FULL_SRC = "https://nyc.cloud.appwrite.io/v1/storage/buckets/69e14d570027ebb13e13/files/69e154c7000987e685e8/view?project=upstreamapproach";

const ENABLE_DEMO_ROLE_SWITCHER = String(import.meta.env.VITE_ENABLE_DEMO_ROLE_SWITCHER || "").toLowerCase() === "true";

// ── Transition CSS ───────────────────────────────────────────
const TRANSITION_CSS = `
  @keyframes screenIn {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0);   }
  }
  .screen-transition {
    animation: screenIn 0.18s ease-out;
    will-change: opacity, transform;
  }
`;

// ── Nav icons ────────────────────────────────────────────────
function NavHome({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#38bdf8" : "#475569"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  );
}
function NavBolt({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "#ef4444" : "none"} stroke={active ? "#ef4444" : "#475569"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}
function NavPST({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#a78bfa" : "#475569"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>
  );
}
function NavTools({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#22c55e" : "#475569"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
    </svg>
  );
}
function NavAdmin({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#eab308" : "#475569"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  );
}
function NavShield({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#a78bfa" : "#475569"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}
function NavInfo({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#64748b" : "#475569"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  );
}
function NavAI({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#eab308" : "#475569"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M9 9h.01M15 9h.01M9 15h6"/>
    </svg>
  );
}

function BottomNav({ screen, navigate, role }) {
  const isOps = isOpsRole(role);
  const isPST = role === "pst";

  const userTabs = [
    { key: "home",     label: "Home",  icon: (a) => <NavHome active={a}  /> },
    { key: "aichat",   label: "AI",    icon: (a) => <NavBolt active={a}  /> },
    { key: "humanpst", label: "PST",   icon: (a) => <NavPST active={a}   /> },
    { key: "tools",    label: "Tools", icon: (a) => <NavTools active={a} /> },
    { key: "about",    label: "About", icon: (a) => <NavInfo active={a}  /> },
  ];
  const opsTabs = [
    { key: "home",       label: "Home",    icon: (a) => <NavHome active={a}   /> },
    { key: "admintools", label: "Admin",   icon: (a) => <NavAdmin active={a}  /> },
    { key: "adminai",    label: "Assist",  icon: (a) => <NavAI active={a}     /> },
    { key: "pstpanel",   label: "PST",     icon: (a) => <NavShield active={a} /> },
    { key: "about",      label: "About",   icon: (a) => <NavInfo active={a}   /> },
  ];
  const pstTabs = [
    { key: "home",     label: "Home",  icon: (a) => <NavHome active={a}   /> },
    { key: "aichat",   label: "AI",    icon: (a) => <NavBolt active={a}   /> },
    { key: "pstpanel", label: "Panel", icon: (a) => <NavShield active={a} /> },
    { key: "humanpst", label: "PST",   icon: (a) => <NavPST active={a}    /> },
    { key: "about",    label: "About", icon: (a) => <NavInfo active={a}   /> },
  ];

  const tabs = isOps ? opsTabs : isPST ? pstTabs : userTabs;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "rgba(6,14,27,0.97)",
      borderTop: "1px solid rgba(255,255,255,0.07)",
      display: "flex", alignItems: "stretch",
      zIndex: 500,
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
    }}>
      {tabs.map(t => {
        const active = screen === t.key;
        const activeColor =
          t.key === "aichat"     ? "#ef4444" :
          t.key === "humanpst"   ? "#a78bfa" :
          t.key === "pstpanel"   ? "#a78bfa" :
          t.key === "tools"      ? "#22c55e" :
          t.key === "admintools" ? "#eab308" :
          t.key === "adminai"    ? "#eab308" :
          "#38bdf8";
        return (
          <div key={t.key} onClick={() => navigate(t.key)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px 4px 8px", cursor: "pointer", borderTop: active ? `2px solid ${activeColor}` : "2px solid transparent", transition: "border-color 0.2s" }}>
            {t.icon(active)}
            <div style={{ fontSize: 9, fontWeight: active ? 800 : 600, color: active ? activeColor : "#475569", marginTop: 4, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              {t.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Storage helpers ──────────────────────────────────────────
function runMigrations() {
  try {
    const storedVersion = localStorage.getItem("upstream_app_version");
    if (storedVersion === APP_VERSION) return;
    localStorage.removeItem("upstream_memberships");
    localStorage.removeItem("upstream_active_membership");
    localStorage.setItem("upstream_app_version", APP_VERSION);
  } catch (e) {}
}
runMigrations();

function loadMemberships() {
  const DEMO_IDS = ["m1", "m1a", "m2", "m3"];
  try {
    const saved = localStorage.getItem("upstream_memberships");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const real = parsed.filter(m => !DEMO_IDS.includes(m.id) && m.agencyCode && m.agencyCode.length > 0);
        if (real.length > 0) return real;
      }
    }
  } catch (e) {}
  return [];
}
function saveMemberships(ms) {
  try { localStorage.setItem("upstream_memberships", JSON.stringify(ms)); } catch (e) {}
}
function loadActiveMembership() {
  try {
    const saved = localStorage.getItem("upstream_active_membership");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.id) return parsed;
    }
  } catch (e) {}
  return null;
}
function saveActiveMembership(m) {
  try {
    if (m) localStorage.setItem("upstream_active_membership", JSON.stringify(m));
    else localStorage.removeItem("upstream_active_membership");
  } catch (e) {}
}

const STATE_NAMES = {
  AL:"Alabama", AK:"Alaska", AZ:"Arizona", AR:"Arkansas", CA:"California",
  CO:"Colorado", CT:"Connecticut", DE:"Delaware", FL:"Florida", GA:"Georgia",
  HI:"Hawaii", ID:"Idaho", IL:"Illinois", IN:"Indiana", IA:"Iowa",
  KS:"Kansas", KY:"Kentucky", LA:"Louisiana", ME:"Maine", MD:"Maryland",
  MA:"Massachusetts", MI:"Michigan", MN:"Minnesota", MS:"Mississippi", MO:"Missouri",
  MT:"Montana", NE:"Nebraska", NV:"Nevada", NH:"New Hampshire", NJ:"New Jersey",
  NM:"New Mexico", NY:"New York", NC:"North Carolina", ND:"North Dakota", OH:"Ohio",
  OK:"Oklahoma", OR:"Oregon", PA:"Pennsylvania", RI:"Rhode Island", SC:"South Carolina",
  SD:"South Dakota", TN:"Tennessee", TX:"Texas", UT:"Utah", VT:"Vermont",
  VA:"Virginia", WA:"Washington", WV:"West Virginia", WI:"Wisconsin", WY:"Wyoming",
  DC:"Washington D.C.",
};

function StateSelector({ onSelect, currentState }) {
  return (
    <div style={{ minHeight: "100vh", background: "#040d18", display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 24px", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#dde8f4", marginBottom: 8 }}>Select Your State</div>
      <div style={{ fontSize: 13, color: "#3d5268", marginBottom: 24, textAlign: "center" }}>Used to show relevant first responder resources in your area.</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%", maxWidth: 400, overflowY: "auto" }}>
        {Object.entries(STATE_NAMES).map(([code, name]) => (
          <div key={code} onClick={() => onSelect(code)} style={{ padding: "12px 14px", borderRadius: 12, background: currentState === code ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${currentState === code ? "rgba(56,189,248,0.4)" : "rgba(255,255,255,0.07)"}`, cursor: "pointer", fontSize: 13, fontWeight: currentState === code ? 700 : 500, color: currentState === code ? "#38bdf8" : "#8099b0" }}>
            {name}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────
export default function App() {
  const { user, role: authRole, loading, checkSession, logout } = useAuth();

  const [memberships, setMemberships] = useState(() => loadMemberships());
  const [activeMembership, setActiveMembership] = useState(() => loadActiveMembership());
  const [showSplash, setShowSplash] = useState(() => {
    try { return !sessionStorage.getItem("upstream_splash_done"); } catch (e) { return true; }
  });
  const [showVerify, setShowVerify] = useState(() => {
    try {
      const verified      = localStorage.getItem("upstream_verified_fr");
      const skipped       = localStorage.getItem("upstream_verify_skipped");
      const hasMembership = loadActiveMembership();
      // Skip verify if: already verified, skipped, has agency, or has a staff session
      const hasSession    = !!localStorage.getItem("cookieFallback"); // Appwrite session marker
      return !verified && !skipped && !hasMembership && !hasSession;
    } catch (e) { return false; }
  });
  const [showSwitcher, setShowSwitcher] = useState(false);
  const [screen, setScreen] = useState("home");
  const [gaugeLevel, setGaugeLevel] = useState(1);
  const [showAgencyChange, setShowAgencyChange] = useState(false);
  const [pstAlert, setPstAlert] = useState(false);
  const [ghostAgency, setGhostAgency] = useState(null);
  const [pstAlertMsg, setPstAlertMsg] = useState("");
  const [criticalIncident, setCriticalIncident] = useState(false);
  const [agencyNotification, setAgencyNotification] = useState(null);
  const [userState, setUserState] = useState(() => {
    try { return localStorage.getItem("upstream_user_state") || null; } catch (e) { return null; }
  });
  const [showStateSelector, setShowStateSelector] = useState(false);
  const [showStateConfirm, setShowStateConfirm] = useState(false);
  const [detectedState, setDetectedState] = useState(null);
  const [userLanguage, setUserLanguage] = useState("en");
  const [didLoginThisSession, setDidLoginThisSession] = useState(false);
  const [showVault, setShowVault] = useState(false);
  const [showDivisionSelector, setShowDivisionSelector] = useState(false);
  const [activeDivision, setActiveDivision] = useState(() => {
    try { return JSON.parse(localStorage.getItem("upstream_active_division") || "null"); } catch(e) { return null; }
  });
  const [showDivisionSwitcher, setShowDivisionSwitcher] = useState(false);

  const [showSeatSelector, setShowSeatSelector] = useState(() => {
    try {
      // Show seat selector if: not done before, not verified FR, not agency member
      const done = localStorage.getItem("upstream_seat_selected");
      const hasMembership = loadActiveMembership();
      const verified = localStorage.getItem("upstream_verified_fr");
      return !done && !hasMembership && !verified;
    } catch(e) { return false; }
  });
  const [userSeats, setUserSeats] = useState(() => {
    try { return JSON.parse(localStorage.getItem("upstream_seats") || "[]"); } catch(e) { return []; }
  });
  const [showAgencyWelcome, setShowAgencyWelcome] = useState(() => {
    try {
      const dismissed = sessionStorage.getItem("upstream_agency_welcome_seen");
      return !dismissed;
    } catch(e) { return false; }
  });
  const [showAppGuide, setShowAppGuide] = useState(() => {
    try {
      const seen = localStorage.getItem("upstream_app_guide_seen");
      return !seen;
    } catch(e) { return false; }
  });
  const logoLongPressRef = useRef(null);

  const logoSrc = LOGO_SRC;
  const ageConfig = (() => { try { return getAgeConfig(); } catch(e) { return null; } })();

  // Stealth vault access — 5 taps on logo within 3 seconds
  const vaultTapCount = useRef(0);
  const vaultTapTimer = useRef(null);
  const handleLogoTap = () => {
    vaultTapCount.current += 1;
    clearTimeout(vaultTapTimer.current);
    if (vaultTapCount.current >= 5) {
      vaultTapCount.current = 0;
      setShowVault(true);
    } else {
      vaultTapTimer.current = setTimeout(() => { vaultTapCount.current = 0; }, 3000);
    }
  };
  const logoFullSrc = LOGO_FULL_SRC;

  // Auto-join agency from QR code URL param (?code=AGENCY_CODE)
  useEffect(() => {
    const joinFromQR = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");
        if (code && code.trim()) {
          const upper = code.trim().toUpperCase();

          // Check if this is a family code (SP-, TN-, CH-, YC-, AD- prefix)
          if (/^(SP|TN|CH|YC|AD)-\d{6}$/.test(upper)) {
            try {
              const { databases: db } = await import('./appwrite.js');
              const { Query: Q } = await import('appwrite');
              const AW_DB_ID = import.meta.env.VITE_APPWRITE_DATABASE || '69c88588001ed071c19e';
              const res = await db.listDocuments(AW_DB_ID, 'family_codes', [Q.equal('code', upper), Q.equal('used', false), Q.limit(1)]);
              if (res.documents && res.documents[0]) {
                const fc = res.documents[0];
                // Mark as used
                await db.updateDocument(AW_DB_ID, 'family_codes', fc.$id, { used: true, usedAt: new Date().toISOString() }).catch(()=>{});
                // Set family seat
                try {
                  localStorage.setItem("upstream_family_seat", fc.ageKey || "spouse");
                  localStorage.setItem("upstream_family_member", "true");
                  localStorage.setItem("upstream_seat_selected", "true");
                  const seatMap = { spouse:["spouse"], "13-17":["family"], "8-12":["family"], "under8":["family"], "17-21":["family"] };
                  localStorage.setItem("upstream_seats", JSON.stringify(seatMap[fc.ageKey] || ["family"]));
                  if (fc.agencyCode) {
                    const agRes = await db.listDocuments(AW_DB_ID, 'agencies', [Q.equal('code', fc.agencyCode), Q.limit(1)]).catch(()=>({documents:[]}));
                    const ag = agRes.documents?.[0];
                    const newM = { id:"m"+Date.now(), agencyCode:fc.agencyCode, agencyName:ag?.name||fc.agencyCode, agencyShort:(ag?.name||fc.agencyCode).slice(0,6), agencyLogoUrl:ag?.logoUrl||null, role:"user" };
                    saveActiveMembership(newM);
                    setActiveMembership(newM);
                  }
                } catch(e) {}
                window.history.replaceState({}, "", window.location.pathname);
                return;
              }
            } catch(e) {}
          }

          const existing = loadActiveMembership();
          if (!existing || existing.agencyCode !== upper || !existing.agencyLogoUrl) {
            // Fetch agency name + logo from Appwrite
            let agencyDisplayName = upper;
            let agencyLogoUrl = null;
            try {
              const { databases: db } = await import('./appwrite.js');
              const { Query: Q } = await import('appwrite');
              const AW_DB_ID = import.meta.env.VITE_APPWRITE_DATABASE || '69c88588001ed071c19e';
              const res = await db.listDocuments(AW_DB_ID, 'agencies', [Q.equal('code', upper), Q.limit(1)]);
              if (res.documents && res.documents[0]) {
                agencyDisplayName = res.documents[0].name || upper;
                agencyLogoUrl = res.documents[0].logoUrl || res.documents[0].logo_url || null;
              }
            } catch(e) {}
            // Fallback — if Appwrite fetch failed, check localStorage for saved branding
            if (!agencyLogoUrl) {
              try {
                const savedUrl = localStorage.getItem("upstream_agency_logo_url");
                const showLogo = localStorage.getItem("upstream_agency_show_logo") === "true";
                if (savedUrl && showLogo) agencyLogoUrl = savedUrl;
              } catch(e) {}
            }
          const newM = {
            id: "m" + Date.now(),
            agencyCode: upper,
            agencyName: agencyDisplayName,
            agencyShort: agencyDisplayName.slice(0, 6),
            agencyLogoUrl,
            role: "user",
          };
          saveActiveMembership(newM);
          setActiveMembership(newM);
          setMemberships([newM]);
          saveMemberships([newM]);
          setShowVerify(false);
          // Check if agency has divisions
          try {
            const divRes = await databases.listDocuments(AW_DB_ID, 'agency_divisions', [Q.equal('agencyCode', upper), Q.equal('active', true), Q.limit(1)]).catch(()=>({documents:[]}));
            if (divRes.documents && divRes.documents.length > 0) {
              setShowDivisionSelector(true);
            }
          } catch(e) {}
          // QR scan = vetted — save permanently so they never see verify again
          try { localStorage.setItem("upstream_verified_fr", "agency_qr"); } catch(e) {}
          // Clean URL without reloading
          window.history.replaceState({}, "", window.location.pathname);
          }
        }
      } catch (e) {}
    };
    joinFromQR();
  }, []);

  useEffect(() => {
    const lang = (navigator.language || "en").split("-")[0];
    setUserLanguage(lang === "es" ? "es" : "en");
  }, []);

  useEffect(() => {
    if (userState) return;
    try {
      const cached = localStorage.getItem("upstream_user_state");
      const cachedAt = localStorage.getItem("upstream_state_at");
      if (cached && cachedAt && (Date.now() - Number(cachedAt)) < 30 * 24 * 60 * 60 * 1000) {
        setUserState(cached);
        return;
      }
    } catch (e) {}
    fetch("https://ipapi.co/json/")
      .then(r => r.json())
      .then(data => {
        if (data && data.region_code && data.country_code === "US") {
          setDetectedState(data.region_code);
          setShowStateConfirm(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user && authRole === "platform" && didLoginThisSession) {
      setScreen("admintools");
    }
  }, [user, authRole, didLoginThisSession]);

  // If a staff session is found on load, skip ID verify entirely
  useEffect(() => {
    if (user) setShowVerify(false);
  }, [user]);

  const handleSetUserState = (s) => {
    setUserState(s);
    try {
      localStorage.setItem("upstream_user_state", s);
      localStorage.setItem("upstream_state_at", String(Date.now()));
    } catch (e) {}
  };

  const handleJoin = (a) => {
    if (a && a.staffLogin) { setScreen("stafflogin"); return; }
    // Check if this is a family code
    if (a && a.familyCode) {
      try {
        localStorage.setItem("upstream_family_seat", a.ageKey || "spouse");
        localStorage.setItem("upstream_family_member", "true");
        localStorage.setItem("upstream_seat_selected", "true");
        // Set seats based on age key
        const seatMap = {
          spouse: ["spouse"],
          "13-17": ["family"],
          "8-12": ["family"],
          "under8": ["family"],
          "17-21": ["family"],
        };
        localStorage.setItem("upstream_seats", JSON.stringify(seatMap[a.ageKey] || ["family"]));
      } catch(e) {}
      setScreen("home");
      return;
    }
    if (!a) {
      saveActiveMembership(null);
      setActiveMembership(null);
      setMemberships([]);
      saveMemberships([]);
      setShowAgencyChange(false);
      setScreen("home");
      return;
    }
    const agencyCode = (a.code || a.short || "NEW").toUpperCase().trim();
    const newM = {
      id: "m" + Date.now(),
      agencyCode,
      agencyName: a.name || agencyCode,
      agencyShort: a.short || agencyCode.slice(0, 6),
      agencyLogoUrl: a.logoUrl || a.logo_url || null,
      role: "user",
    };
    const DEMO_IDS = ["m1", "m1a", "m2", "m3"];
    setMemberships(prev => {
      const cleaned = prev.filter(m => !DEMO_IDS.includes(m.id) && m.agencyCode !== newM.agencyCode);
      const next = [...cleaned, newM];
      saveMemberships(next);
      return next;
    });
    saveActiveMembership(newM);
    setActiveMembership(newM);
    setShowAgencyChange(false);
    setScreen("home");
  };

  const TOOL_SCREENS = [
    "breathing", "grounding", "journal", "dump90",
    "afteraction", "ptsd", "aichat", "emergencycontacts",
    "customalerts", "educational", "hrv", "veterans", "civilian",
  ];

  const navigate = (s) => {
    setScreen(s);
    if (TOOL_SCREENS.includes(s)) {
      trackTool((activeMembership && activeMembership.agencyCode) || "NONE", s);
    }
  };

  const agency = activeMembership
    ? {
        name:    activeMembership.agencyName,
        short:   activeMembership.agencyShort,
        code:    activeMembership.agencyCode,
        // Use admin-saved branding if available, fall back to membership logo
        logoUrl: (() => {
          try {
            const showLogo = localStorage.getItem("upstream_agency_show_logo") === "true";
            const savedUrl = localStorage.getItem("upstream_agency_logo_url");
            return showLogo && savedUrl ? savedUrl : (activeMembership.agencyLogoUrl || null);
          } catch(e) { return null; }
        })(),
      }
    : null;

  const memberRole = activeMembership ? activeMembership.role : "user";
  const role = (user && authRole) ? authRole : memberRole;

  const handleSwitchMembership = (m) => {
    saveActiveMembership(m);
    setActiveMembership(m);
    setShowSwitcher(false);
    if (m.role === "platform") setScreen("admintools");
    else setScreen("home");
  };

  const NAV_HIDDEN_SCREENS = ["stafflogin", "agencycode"];
  const showNav = !showSplash && !NAV_HIDDEN_SCREENS.includes(screen);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#040d18", display: "flex", alignItems: "center", justifyContent: "center", color: "#3d5268", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
        Checking session...
      </div>
    );
  }

  if (showStateConfirm && detectedState) {
    return (
      <div style={{ position: "fixed", inset: 0, background: "#04070f", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "0 24px" }}>
        <div style={{ background: "#0a1628", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 20, padding: "32px 28px", maxWidth: 360, width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>📍</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginBottom: 8 }}>Are you in {STATE_NAMES[detectedState] || detectedState}?</div>
          <div style={{ fontSize: 13, color: "#8099b0", marginBottom: 24, lineHeight: 1.6 }}>We detected your state from your internet connection. If you're using a VPN, this may be incorrect.</div>
          <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
            <button onClick={() => { handleSetUserState(detectedState); setShowStateConfirm(false); setDetectedState(null); }} style={{ padding: "14px 24px", borderRadius: 12, background: "rgba(56,189,248,0.15)", border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Yes, that's correct</button>
            <button onClick={() => { setShowStateConfirm(false); setDetectedState(null); setShowStateSelector(true); }} style={{ padding: "14px 24px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#8099b0", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>No, let me choose my state</button>
          </div>
        </div>
      </div>
    );
  }

  if (showStateSelector) {
    return <StateSelector onSelect={(state) => { handleSetUserState(state); setShowStateSelector(false); }} currentState={userState}/>;
  }

  if (showAgencyChange) {
    return <AgencyCodeScreen onJoin={handleJoin} onSkip={() => setShowAgencyChange(false)} isChange={true} currentAgency={agency && agency.name} roster={[]}/>;
  }

  if (screen === "stafflogin") {
    return (
      <LoginScreen
        onLogin={async (result) => {
          await checkSession();
          setDidLoginThisSession(true);
          const r = result?.role;
          if (r === "pst") setScreen("pstpanel");
          else if (r === "supervisor" || r === "admin" || r === "platform") setScreen("admintools");
          else setScreen("home");
        }}
      />
    );
  }

  const sharedProps = { navigate, agency, userLanguage, logoSrc, agencyLogoSrc: agency?.logoUrl || null, onLogoTap: handleLogoTap };

  const screens = {
    home: (ageConfig && (ageConfig.ageKey === "under8" || ageConfig.ageKey === "8-12")) ? (
      <KidsHomeScreen navigate={navigate} agency={agency} ageConfig={ageConfig}/>
    ) : (
      <HomeScreen
        {...sharedProps}
        gaugeLevel={gaugeLevel}
        setGaugeLevel={setGaugeLevel}
        role={role}
        pstAlert={pstAlert}
        pstAlertMsg={pstAlertMsg}
        criticalIncident={criticalIncident}
        agencyNotification={agencyNotification}
        setAgencyNotification={setAgencyNotification}
      />
    ),
    aichat:      <AIChatScreen {...sharedProps} userState={userState} />,
    roughcall:   <RoughCallScreen {...sharedProps} userState={userState} />,
    shiftcheck:  <ShiftCheckScreen {...sharedProps} />,
    humanpst:    <HumanPSTScreen {...sharedProps} />,
    dump90:      <Dump90Screen {...sharedProps} />,
    tools:       <ToolsScreen {...sharedProps} />,
    breathing:   <BreathingScreen {...sharedProps} />,
    grounding:   <GroundingScreen {...sharedProps} />,
    journal:     <JournalScreen {...sharedProps} />,
    afteraction: <AfterActionScreen {...sharedProps} />,
    ptsd:        <PTSDInterruptionScreen {...sharedProps} />,
    resources: (
      <ResourcesScreen
        {...sharedProps}
        role={role}
        userState={userState}
        onChangeState={() => setShowStateSelector(true)}
      />
    ),
    admintools: (
      <AdminToolsScreen
        navigate={navigate}
        logoSrc={logoSrc}
        membership={activeMembership}
        onSwitchAgency={() => setShowSwitcher(true)}
        pstAlert={pstAlert}
        setPstAlert={setPstAlert}
        pstAlertMsg={pstAlertMsg}
        setPstAlertMsg={setPstAlertMsg}
        criticalIncident={criticalIncident}
        setCriticalIncident={setCriticalIncident}
        setAgencyNotification={setAgencyNotification}
        isPlatform={role === "platform"}
        onGhostLogin={(a) => { setGhostAgency(a); navigate("admintools"); }}
      />
    ),
    adminai:   <AdminAIScreen navigate={navigate} logoSrc={logoSrc} />,
    pstpanel:  <PSTPanelScreen {...sharedProps} />,
    dashboard: <DashboardScreen {...sharedProps} />,
    metrics:   <MetricsScreen {...sharedProps} />,
    about: (
      <AboutScreen
        navigate={navigate}
        agency={agency}
        onChangeAgency={() => setShowAgencyChange(true)}
        role={role}
        setRole={(r) => {
          if (activeMembership) {
            const updated = { ...activeMembership, role: r };
            saveActiveMembership(updated);
            setActiveMembership(updated);
          }
        }}
        userState={userState}
        onChangeState={() => setShowStateSelector(true)}
        userLanguage={userLanguage}
        setUserLanguage={setUserLanguage}
        logoSrc={logoSrc}
        MasterLoginModal={MasterLoginModal}
        onShowGuide={() => { try { localStorage.removeItem("upstream_app_guide_seen"); } catch(e) {} setShowAppGuide(true); }}
      />
    ),
    agencycode: <AgencyCodeScreen onJoin={handleJoin} onSkip={() => navigate("home")} roster={[]} />,
    platform: (
      <PlatformOwnerScreen
        navigate={navigate}
        onGhostLogin={(a) => { setGhostAgency(a); navigate("admintools"); }}
      />
    ),
    emergencycontacts: <EmergencyContactsScreen {...sharedProps} />,
    hrv:               <HRVScreen {...sharedProps} />,
    customalerts:      <CustomAlertsScreen {...sharedProps} />,
    educational:       <EducationalScreen {...sharedProps} />,
    feedback:          <FeedbackScreen {...sharedProps} />,
    appguide:          <AppGuideScreen {...sharedProps} />,
    veterans:          <VeteransScreen {...sharedProps} />,
    civilian:          <CivilianScreen {...sharedProps} />,
    familyconnect:     <FamilyConnectScreen {...sharedProps} />,
    pstrequest:        <PSTRequestScreen {...sharedProps} agencyCode={activeMembership?.agencyCode} />,
    pstdispatch:       <PSTDispatchBoard {...sharedProps} role={role} />,
  };

  return (
    <LogoProvider src={logoFullSrc}>
      {/* Inject transition CSS once */}
      <style>{TRANSITION_CSS}</style>

      <div style={{ position: "relative", width: "100vw", overflowX: "hidden", overflowY: "hidden", paddingBottom: showNav ? 64 : 0 }}>

        {showSplash && (
          <SplashScreen
            logoSrc={logoFullSrc}
            agency={agency}
            onDone={() => {
              try { sessionStorage.setItem("upstream_splash_done", "1"); } catch (e) {}
              setShowSplash(false);
              trackSessionStart((activeMembership && activeMembership.agencyCode) || "NONE", !!localStorage.getItem("upstream_verified_fr"));
            }}
          />
        )}

        {ENABLE_DEMO_ROLE_SWITCHER && (
          <div onClick={() => {
            const idx = ROLES.indexOf(role);
            const next = ROLES[(idx + 1) % ROLES.length];
            if (activeMembership) {
              const updated = { ...activeMembership, role: next };
              saveActiveMembership(updated);
              setActiveMembership(updated);
            }
            if (next === "platform") setScreen("admintools");
            else if (!isOpsRole(next) && role !== "platform") setScreen("home");
          }} style={{ position: "fixed", top: 8, right: 8, zIndex: 1001, background: "rgba(4,12,24,0.96)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "4px 10px", fontSize: 10, fontWeight: 700, color: ROLE_COLORS[role] || "#64748b", letterSpacing: "0.1em", cursor: "pointer", userSelect: "none" }} title="Tap to cycle role">
            {ROLE_BADGES[role] || "USER"}
          </div>
        )}

        {user && !didLoginThisSession && (
          <div onClick={async () => { await logout(); setDidLoginThisSession(false); setScreen("home"); }} style={{ position: "fixed", top: 8, left: 8, zIndex: 1002, background: "rgba(4,12,24,0.96)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "4px 10px", fontSize: 10, fontWeight: 700, color: "#f87171", letterSpacing: "0.08em", cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", gap: 5 }} title="End staff session">
            ⏻ END SESSION
          </div>
        )}

        {memberships.length > 1 && (
          <div onClick={() => setShowSwitcher(true)} style={{ position: "fixed", top: 8, left: 8, zIndex: 1001, background: "rgba(4,12,24,0.96)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "4px 10px", fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.08em", cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: ROLE_COLORS[role] || "#64748b" }}/>
            {activeMembership ? activeMembership.agencyShort : "--"}
          </div>
        )}

        {ghostAgency && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 2000, background: "rgba(234,179,8,0.95)", padding: "6px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#1a1000", letterSpacing: "0.08em" }}>🔐 PLATFORM SUPPORT VIEW — {ghostAgency.name}</div>
            <div onClick={() => { setGhostAgency(null); navigate("platform"); }} style={{ fontSize: 11, fontWeight: 800, color: "#1a1000", cursor: "pointer", textDecoration: "underline" }}>Exit Support View</div>
          </div>
        )}

        {/* ID Verify — shows once after splash if not yet verified */}
        {!showSplash && showVerify && (
          <IDVerifyScreen
            onVerified={(title) => setShowVerify(false)}
            onSkip={() => setShowVerify(false)}
            onStaffLogin={() => { setShowVerify(false); setScreen("stafflogin"); }}
            onActivationCode={() => { setShowVerify(false); setScreen("agencycode"); }}
          />
        )}

        {/* Screen with transition — key forces re-mount on every screen change */}
        {!showSplash && !showVerify && (
          <div key={screen} className="screen-transition">
            {screens[screen] || screens["home"]}
          </div>
        )}

        {showNav && <BottomNav screen={screen} navigate={navigate} role={role} />}

        {/* Division Selector — shows after QR join if agency has divisions */}
        {!showSplash && !showVerify && showDivisionSelector && activeMembership && (
          <DivisionSelectorScreen
            agencyCode={activeMembership.agencyCode}
            agencyName={activeMembership.agencyName}
            onSelect={(div) => {
              setActiveDivision(div);
              try { localStorage.setItem("upstream_active_division", JSON.stringify(div)); } catch(e) {}
              setShowDivisionSelector(false);
            }}
            onSkip={() => setShowDivisionSelector(false)}
          />
        )}

        {/* Division Switcher */}
        {showDivisionSwitcher && activeMembership && (
          <DivisionSwitcher
            agencyCode={activeMembership.agencyCode}
            currentDivision={activeDivision}
            onSwitch={(div) => {
              setActiveDivision(div);
              try { localStorage.setItem("upstream_active_division", JSON.stringify(div)); } catch(e) {}
            }}
            onClose={() => setShowDivisionSwitcher(false)}
          />
        )}

        {/* Seat Selector — one time after splash */}
        {!showSplash && !showVerify && showSeatSelector && (
          <SeatSelectorScreen
            onComplete={(seats) => {
              setUserSeats(seats);
              setShowSeatSelector(false);
            }}
            onSkip={() => setShowSeatSelector(false)}
          />
        )}

        {/* Agency Welcome Modal */}
        {!showSplash && !showVerify && agency && showAgencyWelcome && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:800, padding:24 }}
            onClick={() => { try { sessionStorage.setItem("upstream_agency_welcome_seen","1"); } catch(e) {} setShowAgencyWelcome(false); }}>
            <div style={{ background:"#0b1829", border:"1.5px solid rgba(56,189,248,0.2)", borderRadius:24, padding:"32px 28px", maxWidth:400, width:"100%", textAlign:"center" }}
              onClick={e => e.stopPropagation()}>
              {agency.logoUrl && (
                <img src={agency.logoUrl} alt={agency.name} style={{ height:60, width:"auto", maxWidth:200, objectFit:"contain", marginBottom:16, borderRadius:8 }} onError={e=>e.target.style.display="none"}/>
              )}
              {!agency.logoUrl && <div style={{ fontSize:36, marginBottom:16 }}>🏢</div>}
              <div style={{ fontSize:11, fontWeight:700, color:"#38bdf8", letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:8 }}>Welcome</div>
              <div style={{ fontSize:20, fontWeight:800, color:"#dde8f4", marginBottom:12 }}>{agency.name}</div>
              <div style={{ fontSize:13, color:"#64748b", lineHeight:1.7, marginBottom:24 }}>
                Your agency has provided Upstream Approach as a confidential wellness resource. Everything here is anonymous and private — no login required, nothing shared with your department.
              </div>
              <div onClick={() => { try { sessionStorage.setItem("upstream_agency_welcome_seen","1"); } catch(e) {} setShowAgencyWelcome(false); setShowAppGuide(true); }}
                style={{ padding:"14px", borderRadius:12, cursor:"pointer", background:"rgba(56,189,248,0.12)", border:"1.5px solid rgba(56,189,248,0.3)", fontSize:14, fontWeight:700, color:"#38bdf8", marginBottom:10 }}>
                Show me what's here →
              </div>
              <div onClick={() => { try { sessionStorage.setItem("upstream_agency_welcome_seen","1"); } catch(e) {} setShowAgencyWelcome(false); }}
                style={{ fontSize:12, color:"#334155", cursor:"pointer" }}>
                Skip for now
              </div>
            </div>
          </div>
        )}

        {/* App Guide Modal */}
        {!showSplash && !showVerify && showAppGuide && (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:800, padding:24 }}>
            <div style={{ background:"#0b1829", border:"1.5px solid rgba(56,189,248,0.15)", borderRadius:24, padding:"28px 24px", maxWidth:440, width:"100%", maxHeight:"85vh", overflowY:"auto" }}>
              <div style={{ fontSize:18, fontWeight:800, color:"#dde8f4", marginBottom:6, textAlign:"center" }}>What's in the app</div>
              <div style={{ fontSize:13, color:"#64748b", textAlign:"center", marginBottom:20 }}>Everything here is confidential and anonymous.</div>
              {[
                { icon:"🤖", color:"#ef4444", title:"AI Peer Support", body:"Confidential AI chat available 24/7. Understands shift culture, gallows humor, and what you carry home. Nothing is stored." },
                { icon:"📋", color:"#38bdf8", title:"Shift Check-In", body:"Quick anonymous check-in at start, mid, and end of shift. Helps you track how you're doing over time." },
                { icon:"🛠", color:"#22c55e", title:"Coping Tools", body:"Box breathing, grounding, HRV check, journal, after-action reset, 90-second vent. All work offline." },
                { icon:"🧠", color:"#ef4444", title:"PTSD Interruption", body:"When a call won't leave your head. Animated visual tool, auto-runs, no buttons needed." },
                { icon:"👥", color:"#a78bfa", title:"Human PST", body:"Your agency's peer support team. Chat, call, or text — your choice. Confidential." },
                { icon:"📞", color:"#64748b", title:"Crisis Resources", body:"988, Safe Call Now, 211, and more. Always one tap away." },
                { icon:"🔒", color:"#475569", title:"Private Safety Area", body:"A protected space for sensitive personal situations. Tap the logo 5 times to access." },
              ].map((item, i) => (
                <div key={i} style={{ display:"flex", gap:14, padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize:22, flexShrink:0, marginTop:2 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:item.color, marginBottom:3 }}>{item.title}</div>
                    <div style={{ fontSize:12, color:"#64748b", lineHeight:1.6 }}>{item.body}</div>
                  </div>
                </div>
              ))}
              <div onClick={() => { try { localStorage.setItem("upstream_app_guide_seen","1"); } catch(e) {} setShowAppGuide(false); }}
                style={{ marginTop:20, padding:"14px", borderRadius:12, cursor:"pointer", textAlign:"center", background:"rgba(56,189,248,0.12)", border:"1.5px solid rgba(56,189,248,0.3)", fontSize:14, fontWeight:700, color:"#38bdf8" }}>
                Got it — let's go
              </div>
            </div>
          </div>
        )}

        {/* Safety Vault — stealth access, zero trace */}
        {showVault && (
          <SafetyVaultScreen
            navigate={navigate}
            onClose={() => setShowVault(false)}
          />
        )}

        {showSwitcher && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowSwitcher(false)}>
            <div style={{ background: "#0b1829", border: "1.5px solid rgba(255,255,255,0.09)", borderRadius: "24px 24px 0 0", padding: "28px 20px 40px", width: "100%", maxWidth: 520 }} onClick={e => e.stopPropagation()}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", margin: "0 auto 24px" }}/>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>Switch View</div>
              {memberships.map(m => {
                const isActive = activeMembership && activeMembership.id === m.id;
                const rc = ROLE_COLORS[m.role] || "#64748b";
                return (
                  <div key={m.id} onClick={() => handleSwitchMembership(m)} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 14, background: isActive ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)", border: `1.5px solid ${isActive ? rc + "40" : "rgba(255,255,255,0.06)"}`, marginBottom: 10, cursor: "pointer" }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: isActive ? rc + "20" : "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: isActive ? rc : "#475569", letterSpacing: "0.08em", flexShrink: 0 }}>
                      {ROLE_BADGES[m.role] || "USER"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: isActive ? "#dde8f4" : "#94a3b8" }}>{m.agencyName}</div>
                      <div style={{ fontSize: 11, color: isActive ? rc : "#475569", marginTop: 2, fontWeight: 600 }}>{ROLE_LABELS[m.role] || m.role}</div>
                    </div>
                    {isActive && <div style={{ width: 8, height: 8, borderRadius: "50%", background: rc }}/>}
                  </div>
                );
              })}
              <div onClick={() => setShowSwitcher(false)} style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#334155", cursor: "pointer", padding: "10px" }}>Cancel</div>
            </div>
          </div>
        )}

      </div>
    </LogoProvider>
  );
}
