// ============================================================
// TurtleMascot.jsx
// Upstream Approach -- Schoolhouse Turtle
// Staff version: small branding element in school header
// Kids version: interactive, tap to get reactions
// SVG-based -- no external assets needed
// ============================================================
import React, { useState, useEffect } from 'react';

// ── Turtle SVG ────────────────────────────────────────────────
// Friendly, simple, school-appropriate
function TurtleSVG({ size = 80, mood = "happy", animate = false }) {
  const eyeY = mood === "sad" ? 38 : 36;
  const mouthPath = mood === "happy"
    ? "M 36 48 Q 40 53 44 48"
    : mood === "sad"
    ? "M 36 52 Q 40 47 44 52"
    : mood === "surprised"
    ? "M 38 49 Q 40 53 42 49"
    : mood === "sleepy"
    ? "M 37 50 Q 40 52 43 50"
    : "M 36 48 Q 40 53 44 48";

  const leftEyeClosed = mood === "sleepy" || mood === "blink";
  const rightEyeClosed = mood === "sleepy" || mood === "blink";

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"
      style={{ transition: "transform 0.3s", transform: animate ? "scale(1.08)" : "scale(1)" }}>
      {/* Shell */}
      <ellipse cx="40" cy="48" rx="28" ry="22" fill="#4a8c35" />
      {/* Shell pattern */}
      <ellipse cx="40" cy="46" rx="18" ry="14" fill="#5da832" />
      <ellipse cx="40" cy="44" rx="10" ry="8" fill="#72c23a" />
      {/* Shell segments */}
      <path d="M 32 36 L 28 50" stroke="#4a8c35" strokeWidth="1.5" fill="none" opacity="0.6"/>
      <path d="M 40 34 L 40 52" stroke="#4a8c35" strokeWidth="1.5" fill="none" opacity="0.6"/>
      <path d="M 48 36 L 52 50" stroke="#4a8c35" strokeWidth="1.5" fill="none" opacity="0.6"/>
      <path d="M 26 43 L 54 43" stroke="#4a8c35" strokeWidth="1.5" fill="none" opacity="0.6"/>
      {/* Head */}
      <ellipse cx="40" cy="28" rx="14" ry="12" fill="#a0d832" />
      {/* Eyes */}
      {leftEyeClosed ? (
        <path d={`M 34 ${eyeY} Q 36 ${eyeY-2} 38 ${eyeY}`}
          stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
      ) : (
        <circle cx="36" cy={eyeY} r="3" fill="white"/>
      )}
      {!leftEyeClosed && <circle cx="37" cy={eyeY} r="1.5" fill="#1e293b"/>}
      {rightEyeClosed ? (
        <path d={`M 42 ${eyeY} Q 44 ${eyeY-2} 46 ${eyeY}`}
          stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round"/>
      ) : (
        <circle cx="44" cy={eyeY} r="3" fill="white"/>
      )}
      {!rightEyeClosed && <circle cx="45" cy={eyeY} r="1.5" fill="#1e293b"/>}
      {/* Mouth */}
      <path d={mouthPath} stroke="#334155" strokeWidth="2" fill="none" strokeLinecap="round"/>
      {/* Cheeks */}
      {mood === "happy" && <>
        <ellipse cx="33" cy="41" rx="4" ry="3" fill="#f9a8d4" opacity="0.5"/>
        <ellipse cx="47" cy="41" rx="4" ry="3" fill="#f9a8d4" opacity="0.5"/>
      </>}
      {/* Legs */}
      <ellipse cx="18" cy="55" rx="7" ry="5" fill="#a0d832" />
      <ellipse cx="62" cy="55" rx="7" ry="5" fill="#a0d832" />
      <ellipse cx="24" cy="65" rx="6" ry="4" fill="#a0d832" />
      <ellipse cx="56" cy="65" rx="6" ry="4" fill="#a0d832" />
      {/* Tail */}
      <ellipse cx="40" cy="69" rx="5" ry="3" fill="#a0d832" />
      {/* Shell outline */}
      <ellipse cx="40" cy="48" rx="28" ry="22" fill="none" stroke="#4a6830" strokeWidth="1.5"/>
    </svg>
  );
}

// ── Moods and messages ────────────────────────────────────────
const TURTLE_REACTIONS = [
  { mood:"happy",     message:"Hi there! You got this.",              color:"#22c55e" },
  { mood:"happy",     message:"One step at a time. That is enough.",  color:"#22c55e" },
  { mood:"happy",     message:"You showed up today. That counts.",    color:"#38bdf8" },
  { mood:"surprised", message:"Oh! You found me.",                    color:"#a78bfa" },
  { mood:"happy",     message:"Breathe. Just breathe.",               color:"#38bdf8" },
  { mood:"happy",     message:"You are doing better than you think.", color:"#22c55e" },
  { mood:"sleepy",    message:"Even I take breaks. You should too.",  color:"#94a3b8" },
  { mood:"happy",     message:"Slow and steady. Remember?",           color:"#22c55e" },
  { mood:"happy",     message:"That was a hard moment. It passed.",   color:"#38bdf8" },
  { mood:"surprised", message:"Tap me again. I like it.",             color:"#f97316" },
];

// ── STAFF VERSION -- small, branding only ────────────────────
export function TurtleStaffBadge({ size = 32 }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <TurtleSVG size={size} mood="happy"/>
      <div style={{ fontSize:10, color:"#a0d832", fontWeight:700, letterSpacing:"0.05em" }}>
        UPSTREAM SCHOOLS
      </div>
    </div>
  );
}

// ── KIDS VERSION -- interactive, full featured ────────────────
export function TurtleKids({ size = 120 }) {
  const [tapCount, setTapCount] = useState(0);
  const [reaction, setReaction] = useState(TURTLE_REACTIONS[0]);
  const [animating, setAnimating] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [blinking, setBlinking] = useState(false);

  // Idle blink
  useEffect(() => {
    const interval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 200);
    }, 4000 + Math.random() * 3000);
    return () => clearInterval(interval);
  }, []);

  const handleTap = () => {
    const nextReaction = TURTLE_REACTIONS[(tapCount + 1) % TURTLE_REACTIONS.length];
    setReaction(nextReaction);
    setTapCount(t => t + 1);
    setAnimating(true);
    setShowMessage(true);
    setTimeout(() => setAnimating(false), 400);
    setTimeout(() => setShowMessage(false), 3000);
  };

  const currentMood = blinking ? "blink" : reaction.mood;

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
      {/* Speech bubble */}
      <div style={{
        minHeight:36,
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        transition:"opacity 0.3s",
        opacity: showMessage ? 1 : 0,
      }}>
        {showMessage && (
          <div style={{
            background:"rgba(15,23,42,0.85)",
            border:`1.5px solid ${reaction.color}`,
            borderRadius:12,
            padding:"8px 14px",
            fontSize:13,
            fontWeight:600,
            color:reaction.color,
            textAlign:"center",
            maxWidth:220,
            lineHeight:1.5,
          }}>
            {reaction.message}
          </div>
        )}
      </div>

      {/* Turtle */}
      <div onClick={handleTap} style={{ cursor:"pointer", userSelect:"none" }}>
        <TurtleSVG size={size} mood={currentMood} animate={animating}/>
      </div>

      <div style={{ fontSize:11, color:"#475569", textAlign:"center" }}>
        Tap me
      </div>
    </div>
  );
}

// ── SCHOOL STAFF HEADER BADGE ─────────────────────────────────
// Replaces the plain "School Staff Wellness" header
export function SchoolTurtleHeader() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
      <TurtleSVG size={40} mood="happy"/>
      <div>
        <div style={{ fontSize:16, fontWeight:800, color:"#dde8f4" }}>School Staff Wellness</div>
        <div style={{ fontSize:10, color:"#a0d832", fontWeight:600 }}>Slow and steady</div>
      </div>
    </div>
  );
}

// Default export -- the interactive kids version
export default TurtleKids;
