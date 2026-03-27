import React, { useState, useEffect, useRef } from 'react';

// --- ADDED THIS LINE ---
// Replace the URL below with your actual logo path (e.g., './logo.png' or a web URL)
const LOGO_SRC = "https://via.placeholder.com/150"; 

// Appwrite anonymous analytics
const AW_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const AW_PROJECT  = 'upstreamapproach';
const AW_DB       = 'upstream_db';

// ... (existing awTrack and track functions) ...

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('landing'); 
  const [activeMembership, setActiveMembership] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000); 
    return () => clearTimeout(timer);
  }, []);

  const handleSwitchMembership = async (membership) => {
    setLoading(true);
    try {
      setActiveMembership(membership);
      // await trackCheckin(membership.agencyCode, 'entry', 'start');
      setView('dashboard');
    } catch (err) {
      console.error("Failed to load agency:", err);
    } finally {
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
        {/* LOGO_SRC is now defined above, so this won't crash */}
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
          <div>Loading...</div>
        </div>
      )}

      {view === 'landing' ? (
        <LandingPage onSelect={handleSwitchMembership} />
      ) : (
        <div onClick={() => setView('landing')}>Return to Landing (Placeholder)</div>
      )}
    </div>
  );
}

// Simple LandingPage placeholder to ensure the file runs
function LandingPage({ onSelect }) {
    return (
        <div style={{ padding: 20 }}>
            <h2>Select Agency</h2>
            <button onClick={() => onSelect({ agencyCode: 'TEST', agencyName: 'Test Agency' })}>
                Test Agency
            </button>
        </div>
    );
}
