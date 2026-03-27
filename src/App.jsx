import React, { useState, useEffect, useRef } from 'react';

// Appwrite anonymous analytics
const AW_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const AW_PROJECT  = 'upstreamapproach';
const AW_DB       = 'upstream_db';

// ... [Keep existing awTrack, trackCheckin, trackTool, trackAISession, trackPSTContact functions] ...

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('landing'); // landing, dashboard, tools, etc
  const [activeMembership, setActiveMembership] = useState(null);

  // FIXED: Splash screen timer logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000); // 3-second splash
    return () => clearTimeout(timer);
  }, []);

  // Handle switching into an agency
  const handleSwitchMembership = async (membership) => {
    setLoading(true);
    try {
      setActiveMembership(membership);
      // Ensure we track the entry
      await trackCheckin(membership.agencyCode, 'entry', 'start');
      setView('dashboard');
    } catch (err) {
      console.error("Failed to load agency:", err);
    } finally {
      // Small delay to ensure smooth transition
      setTimeout(() => setLoading(false), 800);
    }
  };

  if (showSplash) {
    return (
      <div style={{
        height: '100vh', 
        background: '#0f172a', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center'
      }}>
        <img src={LOGO_SRC} style={{ width: 120, marginBottom: 20 }} alt="Logo" />
        <div style={{ color: '#38bdf8', fontWeight: 600, letterSpacing: '0.1em' }}>UPSTREAM</div>
        <div style={{ position: 'absolute', bottom: 40, color: '#475569', fontSize: 12 }}>
          Advancing First Responder Wellness
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', background: '#070b14', color: '#f1f5f9', overflow: 'hidden' }}>
      {loading && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(7,11,20,0.8)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {/* Add a spinner or progress bar here */}
          <div className="loader">Loading...</div>
        </div>
      )}

      {/* Main View Logic */}
      {view === 'landing' ? (
        <LandingPage onSelect={handleSwitchMembership} />
      ) : (
        <MainAppView 
          membership={activeMembership} 
          onBack={() => setView('landing')} 
        />
      )}
    </div>
  );
}
