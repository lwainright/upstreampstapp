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

// ── INLINE SVG LOGO (Fixes the 404/Flicker) ──────────────────────────────────
const InlineLogo = ({ size = 40, color = "#38bdf8" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 22V12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 12L21 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 12L3 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const APP_VERSION = "2.2.1";
const isOpsRole = (r) => r === "supervisor" || r === "admin" || r === "platform";

const ROLES = ["user", "pst", "supervisor", "admin", "platform"];
const ROLE_COLORS = { user: "#38bdf8", pst: "#a78bfa", supervisor: "#eab308", admin: "#94a3b8", platform: "#f59e0b" };
const ROLE_BADGES = { user: "USER", pst: "PST", supervisor: "SUPV", admin: "ADMIN", platform: "PLATFORM" };

// ── App Component ────────────────────────────────────────────────────────────

export default function App() {
  const { user, role: authRole, loading, checkSession } = useAuth();
  
  // States
  const [showSplash, setShowSplash] = useState(() => {
    try { return !sessionStorage.getItem("upstream_splash_done"); } catch (e) { return true; }
  });
  const [screen, setScreen] = useState("home");
  const [activeMembership, setActiveMembership] = useState(null);
  const [userState, setUserState] = useState(localStorage.getItem("upstream_user_state") || null);
  const [showStateConfirm, setShowStateConfirm] = useState(false);
  const [detectedState, setDetectedState] = useState(null);

  // ── 1. SAFETY BYPASS (Fixes the Breathing Loop) ────────────────────────────
  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        console.log("Upstream: Safety bypass triggered - hiding splash");
        setShowSplash(false);
        sessionStorage.setItem("upstream_splash_done", "1");
      }, 4000); // Forces app open after 4 seconds
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  // ── 2. SESSION & STATE DETECTION ───────────────────────────────────────────
  useEffect(() => {
    if (!userState) {
      fetch("https://ipapi.co/json/")
        .then(r => r.json())
        .then(data => {
          if (data.country_code === "US") {
            setDetectedState(data.region_code);
            setShowStateConfirm(true);
          }
        }).catch(() => {});
    }
  }, [userState]);

  const navigate = (s) => setScreen(s);

  // ── 3. RENDER LOGIC ────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#040d18", display: "flex", alignItems: "center", justifyContent: "center", color: "#3d5268" }}>
      Initializing Upstream...
    </div>
  );

  const sharedProps = { navigate, userState, InlineLogo };

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden", background: "#040d18" }}>
      
      {/* Splash Screen Overlay */}
      {showSplash && (
        <SplashScreen 
          onDone={() => setShowSplash(false)} 
          logo={<InlineLogo size={80} />}
        />
      )}

      {/* Admin/Role Badge (Triple Tap Area nearby) */}
      <div 
        onClick={() => {/* Cycle role logic here */}}
        style={{ position: "fixed", top: 10, right: 10, zIndex: 1001, background: "rgba(0,0,0,0.5)", padding: "4px 8px", borderRadius: 4, fontSize: 10, color: "#fff" }}
      >
        {ROLE_BADGES[authRole] || "USER"}
      </div>

      {/* Main Screen Router */}
      <main style={{ width: "100%", height: "100%" }}>
        {screen === "home" && <HomeScreen {...sharedProps} />}
        {screen === "about" && <AboutScreen {...sharedProps} MasterLoginModal={MasterLoginModal} />}
        {/* Add other screens as needed here */}
      </main>

      {/* State Confirmation Modal */}
      {showStateConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
           <div style={{ background: "#0a1628", padding: 30, borderRadius: 20, textAlign: "center" }}>
              <p style={{ color: "#fff" }}>Detected location: {detectedState}</p>
              <button onClick={() => { localStorage.setItem("upstream_user_state", detectedState); setShowStateConfirm(false); }}>Confirm</button>
           </div>
        </div>
      )}

      <BottomNav active={screen} onNavigate={navigate} />
    </div>
  );
}
