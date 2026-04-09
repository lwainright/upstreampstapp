import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';

// Screen Imports
import HomeScreen from './HomeScreen';
import AboutScreen from './AboutScreen';
import MasterLoginModal from './MasterLoginModal';
import { BottomNav } from './ui.jsx';

// ── THE LOGO (Baked into the code) ──────────────────────────────────────────
const InlineLogo = ({ size = 60, color = "#38bdf8" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 12L21 7M12 12L3 7M12 12V22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function App() {
  const { user, role, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [screen, setScreen] = useState("home");
  const [showEject, setShowEject] = useState(false);

  // ── THE SAFETY VALVE ──────────────────────────────────────────────────────
  useEffect(() => {
    // Attempt to hide splash after 3 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    // If still stuck after 6 seconds, show the manual "Enter App" button
    const ejectTimer = setTimeout(() => {
      if (showSplash) setShowEject(true);
    }, 6000);

    return () => {
      clearTimeout(timer);
      clearTimeout(ejectTimer);
    };
  }, [showSplash]);

  if (loading) return null;

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#040d18', overflow: 'hidden' }}>
      
      {/* ── THE SPLASH OVERLAY (Directly in App.jsx to avoid hang) ─────────── */}
      {showSplash && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, background: '#040d18',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="breathing-animation">
            <InlineLogo size={100} />
          </div>
          <h1 style={{ color: '#fff', fontSize: 24, marginTop: 20, fontFamily: 'sans-serif' }}>UPSTREAM</h1>
          
          {showEject && (
            <button 
              onClick={() => setShowSplash(false)}
              style={{
                marginTop: 40, padding: '12px 24px', background: '#38bdf8', color: '#000',
                border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              Enter App
            </button>
          )}

          <style>{`
            .breathing-animation { animation: breathe 3s ease-in-out infinite; }
            @keyframes breathe { 0%, 100% { opacity: 0.3; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.1); } }
          `}</style>
        </div>
      )}

      {/* ── MAIN CONTENT ───────────────────────────────────────────────────── */}
      <div style={{ width: '100%', height: 'calc(100% - 70px)', overflowY: 'auto' }}>
        {screen === "home" && <HomeScreen navigate={setScreen} InlineLogo={InlineLogo} />}
        {screen === "about" && <AboutScreen navigate={setScreen} MasterLoginModal={MasterLoginModal} />}
      </div>

      <BottomNav active={screen} onNavigate={setScreen} />
    </div>
  );
}
