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

import { trackTool } from './analytics.js';

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
    isPlatform: isAuthPlatform, loading, checkSession, logout,
  } = useAuth();

  const [memberships, setMemberships] = useState(() => loadMemberships());
  const [activeMembership, setActiveMembership] = useState(() => loadActiveMembership());
  const [showSplash, setShowSplash] = useState(() => {
    try { return !sessionStorage.getItem("upstream_splash_done"); } catch (e) { return true; }
  });
  const [showSwitcher, setShowSwitcher] = useState(false);
  // ✅ Always starts on "home" — platform users are redirected by the useEffect below
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

  // Track whether this session was established via explicit login in this page load
  const [didLoginThisSession, setDidLoginThisSession] = useState(false);

  // Only auto-route to admintools if the user JUST logged in (not on page load from cached session)
  useEffect(() => {
    if (user && authRole === "platform" && didLoginThisSession) {
      setScreen("admintools");
    }
  }, [user, authRole, didLoginThisSession]);

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
        <div style={{
          background: "#0a1628",
          border: "1px solid rgba(56,189,248,0.2)",
          borderRadius: 20, padding: "32px 28px",
          maxWidth: 360, width: "100%", textAlign: "center",
        }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>📍</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", marginBottom: 8 }}>
            Are you in {STATE_NAMES[detectedState] || detectedState}?
          </div>
          <div style={{ fontSize: 13, color: "#8099b0", marginBottom: 24, lineHeight: 1.6 }}>
            We detected your state from your internet connection.
            If you're using a VPN, this may be incorrect.
          </div>
          <div style={{ display: "flex", gap: 12, flexDirection: "column" }}>
            <button
              onClick={() => { handleSetUserState(detectedState); setShowStateConfirm(false); setDetectedState(null); }}
              style={{
                padding: "14px 24px", borderRadius: 12,
                background: "rgba(56,189,248,0.15)",
                border: "1px solid rgba(56,189,248,0.3)",
                color: "#38bdf8", fontWeight: 700, fontSize: 15, cursor: "pointer",
              }}
            >
              Yes, that's correct
            </button>
            <button
              onClick={() => { setShowStateConfirm(false); setDetectedState(null); setShowStateSelector(true); }}
              style={{
                padding: "14px 24px", borderRadius: 12,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#8099b0", fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}
            >
              No, let me choose my state
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showStateSelector) {
    return (
      <StateSelector
        onSelect={(state) => { handleSetUserState(state); setShowStateSelector(false); }}
        currentState={userState}
      />
    );
  }

  if (showAgencyChange) {
    return (
      <AgencyCodeScreen
        onJoin={handleJoin}
        onSkip={() => setShowAgencyChange(false)}
        isChange={true}
        currentAgency={agency && agency.name}
        roster={[]}
      />
    );
  }

  // ── Staff login screen ──
  if (screen === "stafflogin") {
    return (
      <LoginScreen
        onLogin={async () => {
          await checkSession();
          setDidLoginThisSession(true); // mark as explicit login so auto-route fires
          setScreen("home");
        }}
      />
    );
  }

  const sharedProps = { navigate, agency, userLanguage, logoSrc: LOGO_SRC };

  const screens = {
    home: (
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
    aichat: <AIChatScreen {...sharedProps} userState={userState} />,
    roughcall: <RoughCallScreen {...sharedProps} userState={userState} />,
    shiftcheck: <ShiftCheckScreen {...sharedProps} />,
    humanpst: <HumanPSTScreen {...sharedProps} />,
    dump90: <Dump90Screen {...sharedProps} />,
    tools: <ToolsScreen {...sharedProps} />,
    breathing: <BreathingScreen {...sharedProps} />,
    grounding: <GroundingScreen {...sharedProps} />,
    journal: <JournalScreen {...sharedProps} />,
    afteraction: <AfterActionScreen {...sharedProps} />,
    ptsd: <PTSDInterruptionScreen {...sharedProps} />,
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
    pstpanel: <PSTPanelScreen {...sharedProps} />,
    dashboard: <DashboardScreen {...sharedProps} />,
    metrics: <MetricsScreen {...sharedProps} />,
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
        logoSrc={LOGO_SRC}
        MasterLoginModal={MasterLoginModal}
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
    customalerts: <CustomAlertsScreen {...sharedProps} />,
    educational: <EducationalScreen {...sharedProps} />,
    feedback: <FeedbackScreen {...sharedProps} />,
  };

  return (
    <div style={{ position: "relative", width: "100vw", overflowX: "hidden", overflowY: "hidden" }}>

      {/* Splash */}
      {showSplash && (
        <SplashScreen
          logoSrc={LOGO_FULL_SRC}
          edition="First Responder Edition"
          onDone={() => {
            try { sessionStorage.setItem("upstream_splash_done", "1"); } catch (e) {}
            setShowSplash(false);
          }}
        />
      )}

      {/* Role badge — dev tool, cycles role on tap */}
      <div
        onClick={() => {
          const idx = ROLES.indexOf(role);
          const next = ROLES[(idx + 1) % ROLES.length];
          if (activeMembership) {
            const updated = { ...activeMembership, role: next };
            saveActiveMembership(updated);
            setActiveMembership(updated);
          }
          if (next === "platform") setScreen("admintools");
          else if (!isOpsRole(next) && role !== "platform") setScreen("home");
        }}
        style={{
          position: "fixed", top: 8, right: 8, zIndex: 1001,
          background: "rgba(4,12,24,0.96)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8, padding: "4px 10px",
          fontSize: 10, fontWeight: 700,
          color: ROLE_COLORS[role] || "#64748b",
          letterSpacing: "0.1em", cursor: "pointer", userSelect: "none",
        }}
        title="Tap to cycle role"
      >
        {ROLE_BADGES[role] || "USER"}
      </div>

      {/* Logout button — shown when a staff session is active from a previous login */}
      {user && !didLoginThisSession && (
        <div
          onClick={async () => {
            await logout();
            setDidLoginThisSession(false);
            setScreen("home");
          }}
          style={{
            position: "fixed", top: 8, left: 8, zIndex: 1002,
            background: "rgba(4,12,24,0.96)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 8, padding: "4px 10px",
            fontSize: 10, fontWeight: 700, color: "#f87171",
            letterSpacing: "0.08em", cursor: "pointer", userSelect: "none",
            display: "flex", alignItems: "center", gap: 5,
          }}
          title="End staff session"
        >
          ⏻ END SESSION
        </div>
      )}

      {/* Agency switcher badge */}
      {memberships.length > 1 && (
        <div
          onClick={() => setShowSwitcher(true)}
          style={{
            position: "fixed", top: 8, left: 8, zIndex: 1001,
            background: "rgba(4,12,24,0.96)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8, padding: "4px 10px",
            fontSize: 10, fontWeight: 700, color: "#475569",
            letterSpacing: "0.08em", cursor: "pointer", userSelect: "none",
            display: "flex", alignItems: "center", gap: 5,
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: ROLE_COLORS[role] || "#64748b" }}/>
          {activeMembership ? activeMembership.agencyShort : "--"}
        </div>
      )}

      {/* Ghost agency banner */}
      {ghostAgency && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 2000,
          background: "rgba(234,179,8,0.95)",
          padding: "6px 16px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#1a1000", letterSpacing: "0.08em" }}>
            🔐 PLATFORM SUPPORT VIEW — {ghostAgency.name}
          </div>
          <div
            onClick={() => { setGhostAgency(null); navigate("platform"); }}
            style={{ fontSize: 11, fontWeight: 800, color: "#1a1000", cursor: "pointer", textDecoration: "underline" }}
          >
            Exit Support View
          </div>
        </div>
      )}

      {/* Current screen */}
      {screens[screen] || screens["home"]}

      {/* Agency switcher drawer */}
      {showSwitcher && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)",
            display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000,
          }}
          onClick={() => setShowSwitcher(false)}
        >
          <div
            style={{
              background: "#0b1829",
              border: "1.5px solid rgba(255,255,255,0.09)",
              borderRadius: "24px 24px 0 0",
              padding: "28px 20px 40px",
              width: "100%", maxWidth: 520,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", margin: "0 auto 24px" }}/>
            <div style={{
              fontSize: 13, fontWeight: 700, color: "#475569",
              letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16,
            }}>
              Switch View
            </div>

            {memberships.map(m => {
              const isActive = activeMembership && activeMembership.id === m.id;
              const rc = ROLE_COLORS[m.role] || "#64748b";
              return (
                <div
                  key={m.id}
                  onClick={() => handleSwitchMembership(m)}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 16px", borderRadius: 14,
                    background: isActive ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                    border: `1.5px solid ${isActive ? rc + "40" : "rgba(255,255,255,0.06)"}`,
                    marginBottom: 10, cursor: "pointer",
                  }}
                >
                  <div style={{
                    width: 42, height: 42, borderRadius: 12,
                    background: isActive ? rc + "20" : "rgba(255,255,255,0.04)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, fontWeight: 800,
                    color: isActive ? rc : "#475569",
                    letterSpacing: "0.08em", flexShrink: 0,
                  }}>
                    {ROLE_BADGES[m.role] || "USER"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: isActive ? "#dde8f4" : "#94a3b8" }}>
                      {m.agencyName}
                    </div>
                    <div style={{ fontSize: 11, color: isActive ? rc : "#475569", marginTop: 2, fontWeight: 600 }}>
                      {ROLE_LABELS[m.role] || m.role}
                    </div>
                  </div>
                  {isActive && <div style={{ width: 8, height: 8, borderRadius: "50%", background: rc }}/>}
                </div>
              );
            })}

            <div
              onClick={() => setShowSwitcher(false)}
              style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#334155", cursor: "pointer", padding: "10px" }}
            >
              Cancel
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
