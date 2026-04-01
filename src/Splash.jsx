import React, { useState, useEffect, useRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Splash.jsx — Upstream Approach
//
// Presence-first welcome screen. Not a support screen, not a warning screen.
// Sets calm, stigma-free emotional tone before the app loads.
//
// Props:
//   logoSrc   — URL or import path for the Upstream logo image
//   edition   — "First Responder" | "Student" | "Veteran" | "Family" | etc.
//   onDone    — callback fired when splash exits (fade-out complete)
// ─────────────────────────────────────────────────────────────────────────────

const EDITION = "First Responder"; // override via prop or env

function getGreeting() {
  const hr = new Date().getHours();
  if (hr >= 5  && hr < 12) return "Good Morning";
  if (hr >= 12 && hr < 17) return "Good Afternoon";
  if (hr >= 17 && hr < 21) return "Good Evening";
  return "You Made It Through Today";      // late night — steady, non-clinical
}

export default function SplashScreen({ logoSrc, edition = EDITION, onDone }) {
  const [phase, setPhase]       = useState("fadein");   // fadein | hold | fadeout | done
  const [ripples, setRipples]   = useState([]);
  const timerRef                = useRef(null);
  const greeting                = getGreeting();

  // ── auto-advance ─────────────────────────────────────────────────────────
  useEffect(() => {
    // fade in completes at 1.2s, then hold until 2.8s, then fade out
    const holdTimer = setTimeout(() => beginExit(), 2800);
    timerRef.current = holdTimer;
    return () => clearTimeout(timerRef.current);
  }, []);

  const beginExit = () => {
    clearTimeout(timerRef.current);
    if (phase === "fadeout" || phase === "done") return;
    setPhase("fadeout");
    setTimeout(() => { setPhase("done"); onDone && onDone(); }, 800);
  };

  // ── tap to continue — ripple then exit ───────────────────────────────────
  const handleTap = (e) => {
    if (phase === "fadeout" || phase === "done") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
    setTimeout(beginExit, 120);   // slight delay so ripple is visible first
  };

  if (phase === "done") return null;

  const fading = phase === "fadeout";

  return (
    <div
      onClick={handleTap}
      style={{
        position:        "fixed",
        inset:           0,
        background:      "#060e1b",
        display:         "flex",
        flexDirection:   "column",
        alignItems:      "center",
        justifyContent:  "center",
        zIndex:          9999,
        cursor:          "pointer",
        overflow:        "hidden",
        opacity:         fading ? 0 : 1,
        transition:      fading ? "opacity 0.8s ease" : "opacity 1.2s ease",
        userSelect:      "none",
      }}
    >

      {/* ── ambient glow — breathes with the logo ── */}
      <div style={{
        position:   "absolute",
        top:        "38%",
        left:       "50%",
        transform:  "translate(-50%, -50%)",
        width:       360,
        height:      360,
        borderRadius:"50%",
        background:  "radial-gradient(ellipse, rgba(14,165,233,0.15) 0%, transparent 70%)",
        animation:   "breatheGlow 3.5s ease-in-out infinite",
        pointerEvents:"none",
      }}/>

      {/* ── logo with breathing pulse ── */}
      {logoSrc && (
        <img
          src={logoSrc}
          alt="Upstream Approach"
          style={{
            width:       "68%",
            maxWidth:    260,
            height:      "auto",
            objectFit:   "contain",
            marginBottom: 36,
            animation:   "breatheLogo 3.5s ease-in-out infinite",
            filter:      "drop-shadow(0 0 20px rgba(14,165,233,0.3))",
          }}
        />
      )}

      {/* ── brand stack ── */}
      <div style={{
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        gap:             6,
        animation:      "fadeUp 1.4s ease forwards",
        opacity:         0,
      }}>
        <div style={{
          fontSize:      22,
          fontWeight:    700,
          color:         "#dde8f4",
          letterSpacing: "-0.01em",
          textAlign:     "center",
        }}>
          Upstream Approach
        </div>

        <div style={{
          fontSize:      12,
          color:         "#38bdf8",
          fontWeight:    500,
          letterSpacing: "0.04em",
          opacity:       0.75,
        }}>
          powered by Upstream Initiative
        </div>

        {/* divider */}
        <div style={{
          width:           80,
          height:           1,
          background:      "linear-gradient(90deg, transparent, rgba(56,189,248,0.4), transparent)",
          margin:          "6px 0",
        }}/>

        {/* edition */}
        <div style={{
          fontSize:      13,
          color:         "#64748b",
          fontWeight:    600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}>
          {edition}
        </div>
      </div>

      {/* ── time-aware greeting — brighter, bigger ── */}
      <div style={{
        position:        "absolute",
        bottom:           80,
        fontSize:         24,
        color:            "#e0f2fe",
        fontWeight:       700,
        letterSpacing:    "0.02em",
        textAlign:        "center",
        animation:        "fadeUp 2s ease 0.6s forwards, greetingPulse 3s ease-in-out 1.5s infinite",
        opacity:           0,
      }}>
        {greeting}
      </div>

      {/* ── tap hint — bright, pulsing ── */}
      <div style={{
        position:      "absolute",
        bottom:        32,
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
        gap:           8,
        animation:     "fadeUp 2s ease 1s forwards",
        opacity:       0,
      }}>
        <div style={{
          width:      40,
          height:     1,
          background: "linear-gradient(90deg, transparent, rgba(56,189,248,0.6), transparent)",
        }}/>
        <div style={{
          fontSize:      13,
          fontWeight:    700,
          color:         "#38bdf8",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          animation:     "tapPulse 2.2s ease-in-out infinite",
        }}>
          Tap to continue
        </div>
      </div>

      {/* ── ripple effects ── */}
      {ripples.map(r => (
        <div key={r.id} style={{
          position:      "absolute",
          left:           r.x,
          top:            r.y,
          width:          0,
          height:         0,
          borderRadius:  "50%",
          border:        "1.5px solid rgba(56,189,248,0.5)",
          transform:     "translate(-50%, -50%)",
          animation:     "rippleOut 0.55s ease-out forwards",
          pointerEvents: "none",
        }}/>
      ))}

      {/* ── keyframes ── */}
      <style>{`
        @keyframes breatheLogo {
          0%, 100% { transform: scale(1);    filter: drop-shadow(0 0 20px rgba(14,165,233,0.30)); }
          50%       { transform: scale(1.04); filter: drop-shadow(0 0 32px rgba(14,165,233,0.55)); }
        }
        @keyframes breatheGlow {
          0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1);    }
          50%       { opacity: 1;   transform: translate(-50%, -50%) scale(1.15); }
        }
        @keyframes fadeUp {
          0%   { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0);    }
        }
        @keyframes greetingPulse {
          0%, 100% { text-shadow: 0 0 18px rgba(56,189,248,0.45); }
          50%       { text-shadow: 0 0 36px rgba(56,189,248,0.85); }
        }
        @keyframes tapPulse {
          0%, 100% { opacity: 0.65; }
          50%       { opacity: 1;   }
        }
        @keyframes rippleOut {
          0%   { width: 0;    height: 0;    opacity: 0.7; }
          100% { width: 220px; height: 220px; opacity: 0;   }
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; }
        }
      `}</style>

    </div>
  );
}
