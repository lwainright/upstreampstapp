import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import LoginScreen from './components/LoginScreen';

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

// Layout & Nav
import { BottomNav, DesktopWrap } from './ui.jsx';
import { useLayoutConfig } from './utils.js';
import { trackCheckin, trackTool, trackAISession, trackPSTContact } from './analytics.js';
import { fetchResources, LIFELINES } from './fetchResources.js';

// Constants
const APP_VERSION = "2.2.0";
const isOpsRole = (r) => r === "supervisor" || r === "admin" || r === "platform";

const ROLES = ["user", "pst", "supervisor", "admin", "platform"];
const ROLE_LABELS = {
  user: "Responder",
  pst: "PST Member",
  supervisor: "Supervisor",
  admin: "Admin",
  platform: "Platform Owner",
};
const ROLE_COLORS = {
  user: "#38bdf8",
  pst: "#a78bfa",
  supervisor: "#eab308",
  admin: "#94a3b8",
  platform: "#f59e0b",
};
const ROLE_BADGES = {
  user: "USER",
  pst: "PST",
  supervisor: "SUPV",
  admin: "ADMIN",
  platform: "PLATFORM",
};

const LOGO_SRC = "/icons/logo.png";
const LOGO_FULL_SRC = "/icons/logo-full.png";

// ── Storage helpers ──────────────────────────────────────────────────────────

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
        const real = parsed.filter(
          m => !DEMO_IDS.includes(m.id) && m.agencyCode && m.agencyCode.length > 0
        );
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

// ── State selector component ─────────────────────────────────────────────────

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
    <div style={{
      minHeight: "100vh", background: "#040d18",
      display: "flex", flexDirection: "column",
      alignItems: "center", padding: "40px 24px",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#dde8f4", marginBottom: 8 }}>
        Select Your State
      </div>
      <div style={{ fontSize: 13, color: "#3d5268", marginBottom: 24, textAlign: "center" }}>
        Used to show relevant first responder resources in your area.
      </div>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 8, width: "100%", maxWidth: 400, overflowY: "auto",
      }}>
        {Object.entries(STATE_NAMES).map(([code, name]) => (
          <div
            key={code}
            onClick={() => onSelect(code)}
            style={{
              padding: "12px 14px", borderRadius: 12,
              background: currentState === code ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.03)",
              border: `1.5px solid ${currentState === code ? "rgba(56,189,248,0.4)" : "rgba(255,255,255,0.07)"}`,
              cursor: "pointer",
              fontSize: 13, fontWeight: currentState === code ? 700 : 500,
              color: currentState === code ? "#38bdf8" : "#8099b0",
            }}
          >
            {name}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const {
    user, role: authRole, agencyCode: authAgencyCode,
    isPlatform: isAuthPlatform, loading, checkSession,
  } = useAuth();

  const [memberships, setMemberships] = useState(() => loadMemberships());
  const [activeMembership, setActiveMembership] = useState(() => loadActiveMembership());
  const [showSplash, setShowSplash] = useState(() => {
    try { return !sessionStorage.getItem("upstream_splash_done"); } catch (e) { return true; }
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

  const lc = useLayoutConfig();

  // Auto-detect language
  useEffect(() => {
    const lang = (navigator.language || "en").split("-")[0];
    setUserLanguage(lang === "es" ? "es" : "en");
  }, []);

  // Auto-detect state via IP (once)
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

  // Auto-route platform users after login
  useEffect(() => {
    if (user && authRole === "platform") {
      setScreen("admintools");
    }
  }, [user, authRole]);

  const handleSetUserState = (s) => {
    setUserState(s);
    try {
      localStorage.setItem("upstream_user_state", s);
      localStorage.setItem("upstream_state_at", String(Date.now()));
    } catch (e) {}
  };

  const handleJoin = (a) => {
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
    "customalerts", "educational",
  ];

  const navigate = (s) => {
    setScreen(s);
    if (TOOL_SCREENS.includes(s)) {
      trackTool((activeMembership && activeMembership.agencyCode) || "NONE", s);
    }
  };

  const agency = activeMembership
    ? { name: activeMembership.agencyName, short: activeMembership.agencyShort, code: activeMembership.agencyCode }
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

  // ── Loading screen ──
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", background: "#040d18",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#3d5268", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
      }}>
        Checking session...
      </div>
    );
  }

  // ── State confirm screen ──
  if (showStateConfirm && detectedState) {
    return (
      <div style={{
        position: "fixed", inset: 0, background: "#04070f",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999, padding: "0 24px",
      }}>
        <div
