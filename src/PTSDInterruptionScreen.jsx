// ============================================================
// SCREEN: PTSDInterruptionScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { ScreenSingle, Btn, Card, SLabel } from './ui.jsx';
import { useLayoutConfig } from './utils.js';

// ── Following Ball Breathing Component ───────────────────────
function FollowingBall({ voiceOn, voiceName, onExit }) {
  const patterns = ["box", "figure8", "circle"];
  const [pattern] = useState(() => patterns[Math.floor(Math.random() * patterns.length)]);
  const [progress, setProgress] = useState(0); // 0-1 continuous
  const [showHint, setShowHint] = useState(true);
  const [muted, setMuted] = useState(!voiceOn);
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(voiceName || "");
  const animRef = useRef(null);
  const lastPhraseRef = useRef(0);
  const size = 260;
  const ball = 18;

  const phrases = [
    "Keep going",
    "You're doing great",
    "Stay with it",
    "Right here, right now",
    "One breath at a time",
    "Keep following",
    "You've got this",
    "Stay present",
    "Breathe with it",
    "You're doing great",
  ];

  const breathPhrases = {
    box:     ["breathe in...", "hold...", "breathe out...", "hold..."],
    figure8: ["follow the light...", "stay with it...", "keep going...", "you're doing great..."],
    circle:  ["breathe in as it grows...", "breathe out as it shrinks...", "keep following...", "you've got this..."],
  };

  useEffect(() => {
    const load = () => {
      const v = window.speechSynthesis?.getVoices().filter(v => v.lang.startsWith("en")) || [];
      setVoices(v);
    };
    load();
    window.speechSynthesis?.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", load);
  }, []);

  useEffect(() => {
    // Hide hint after 3 seconds
    const t = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let start = null;
    const duration = pattern === "box" ? 16000 : 12000; // ms per full cycle

    const speak = (text) => {
      if (muted) return;
      window.speechSynthesis?.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.75;
      u.pitch = 0.85;
      u.volume = 0.6;
      if (selectedVoice) {
        const v = voices.find(v => v.name === selectedVoice);
        if (v) u.voice = v;
      }
      window.speechSynthesis?.speak(u);
    };

    const tick = (ts) => {
      if (!start) start = ts;
      const elapsed = (ts - start) % duration;
      const p = elapsed / duration;
      setProgress(p);

      // Speak phrase at quarter intervals
      const quarter = Math.floor(p * 4);
      if (quarter !== lastPhraseRef.current) {
        lastPhraseRef.current = quarter;
        const phrases = breathPhrases[pattern];
        speak(phrases[quarter % phrases.length]);
      }

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.speechSynthesis?.cancel();
    };
  }, [muted, selectedVoice, voices, pattern]);

  // Calculate ball position based on pattern and progress
  const getBallPos = () => {
    const p = progress;
    const s = size;
    const pad = 30;
    const w = s - pad * 2;
    const cx = s / 2;
    const cy = s / 2;

    if (pattern === "box") {
      // Trace a square: top→right→bottom→left
      const perim = p * 4;
      if (perim < 1) return { x: pad + perim * w, y: pad };
      if (perim < 2) return { x: pad + w, y: pad + (perim - 1) * w };
      if (perim < 3) return { x: pad + w - (perim - 2) * w, y: pad + w };
      return { x: pad, y: pad + w - (perim - 3) * w };
    }

    if (pattern === "figure8") {
      const t = p * Math.PI * 2;
      const scale = w / 2.2;
      return {
        x: cx + scale * Math.sin(t),
        y: cy + scale * Math.sin(t * 2) / 2,
      };
    }

    // Circle (expanding/contracting)
    const t = p * Math.PI * 2;
    const phase = p < 0.5 ? p * 2 : (1 - p) * 2; // expand then contract
    const r = (w / 4) + phase * (w / 4);
    return {
      x: cx + r * Math.cos(t - Math.PI / 2),
      y: cy + r * Math.sin(t - Math.PI / 2),
    };
  };

  const pos = getBallPos();

  // Phase label
  const getPhaseLabel = () => {
    if (pattern === "box") {
      const q = Math.floor(progress * 4);
      return ["Breathe In", "Hold", "Breathe Out", "Hold"][q];
    }
    if (pattern === "circle") {
      return progress < 0.5 ? "Breathe In" : "Breathe Out";
    }
    return "Follow the light";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>

      {/* Hint */}
      <div style={{ fontSize: 13, color: "#8099b0", textAlign: "center", opacity: showHint ? 1 : 0, transition: "opacity 1s", height: 20 }}>
        Follow the light with your eyes
      </div>

      {/* Ball canvas */}
      <div style={{ position: "relative", width: size, height: size, cursor: "pointer" }} onClick={() => {}}>
        {/* Guide lines */}
        <svg width={size} height={size} style={{ position: "absolute", inset: 0 }}>
          {pattern === "box" && (
            <rect x={30} y={30} width={size - 60} height={size - 60}
              fill="none" stroke="rgba(56,189,248,0.08)" strokeWidth="1" strokeDasharray="4 4"/>
          )}
          {pattern === "figure8" && (
            <ellipse cx={size/2} cy={size/2} rx={(size-60)/2.2} ry={(size-60)/4}
              fill="none" stroke="rgba(56,189,248,0.06)" strokeWidth="1"/>
          )}
          {pattern === "circle" && (
            <circle cx={size/2} cy={size/2} r={(size-60)/3}
              fill="none" stroke="rgba(56,189,248,0.06)" strokeWidth="1"/>
          )}
        </svg>

        {/* Glow trail */}
        <div style={{
          position: "absolute",
          left: pos.x - ball * 1.5,
          top: pos.y - ball * 1.5,
          width: ball * 3,
          height: ball * 3,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }}/>

        {/* Ball */}
        <div style={{
          position: "absolute",
          left: pos.x - ball / 2,
          top: pos.y - ball / 2,
          width: ball,
          height: ball,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #7dd3fc, #38bdf8)",
          boxShadow: "0 0 20px rgba(56,189,248,0.6), 0 0 8px rgba(56,189,248,0.8)",
          pointerEvents: "none",
        }}/>
      </div>

      {/* Phase label */}
      <div style={{ fontSize: 16, fontWeight: 700, color: "#38bdf8", letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.8 }}>
        {getPhaseLabel()}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 4 }}>
        <div onClick={() => { setMuted(m => !m); }} style={{ width: 40, height: 40, borderRadius: "50%", background: muted ? "rgba(255,255,255,0.04)" : "rgba(56,189,248,0.1)", border: `1.5px solid ${muted ? "rgba(255,255,255,0.1)" : "rgba(56,189,248,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16 }}>
          {muted ? "🔇" : "🔊"}
        </div>
        {!muted && (
          <div onClick={() => setShowVoicePicker(v => !v)} style={{ fontSize: 10, color: "#38bdf8", cursor: "pointer", textDecoration: "underline", opacity: 0.7 }}>
            {showVoicePicker ? "close" : "change voice"}
          </div>
        )}
        <div onClick={onExit} style={{ fontSize: 12, color: "#475569", cursor: "pointer", textDecoration: "underline" }}>
          exit
        </div>
      </div>

      {/* Voice picker */}
      {showVoicePicker && !muted && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(56,189,248,0.15)", borderRadius: 12, padding: "12px", width: "100%", maxHeight: 160, overflowY: "auto" }}>
          <div onClick={() => { setSelectedVoice(""); setShowVoicePicker(false); }} style={{ padding: "8px 10px", borderRadius: 8, cursor: "pointer", fontSize: 12, color: selectedVoice === "" ? "#38bdf8" : "#8099b0", background: selectedVoice === "" ? "rgba(56,189,248,0.1)" : "transparent", marginBottom: 4 }}>Default (Auto)</div>
          {voices.map((v, i) => (
            <div key={i} onClick={() => { setSelectedVoice(v.name); setShowVoicePicker(false); }} style={{ padding: "8px 10px", borderRadius: 8, cursor: "pointer", fontSize: 12, color: selectedVoice === v.name ? "#38bdf8" : "#8099b0", background: selectedVoice === v.name ? "rgba(56,189,248,0.1)" : "transparent" }}>
              {v.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Timed Breathing Component ────────────────────────────────
function TimedBreathing({ type, voiceOn, voiceName, onExit }) {
  const cycles = type === "478" ? [
    { label: "Breathe In", duration: 4, color: "#22c55e" },
    { label: "Hold",       duration: 7, color: "#eab308" },
    { label: "Breathe Out",duration: 8, color: "#38bdf8" },
  ] : [
    { label: "Breathe In", duration: 5, color: "#22c55e" },
    { label: "Breathe Out",duration: 5, color: "#38bdf8" },
  ];

  const [phaseIdx, setPhaseIdx] = useState(0);
  const [countdown, setCountdown] = useState(cycles[0].duration);
  const [round, setRound] = useState(1);
  const maxRounds = type === "478" ? 4 : 8;
  const [muted, setMuted] = useState(!voiceOn);
  const [done, setDone] = useState(false);

  const speak = (text) => {
    if (muted) return;
    window.speechSynthesis?.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.75; u.pitch = 0.85; u.volume = 0.6;
    if (voiceName) {
      const v = window.speechSynthesis?.getVoices().find(v => v.name === voiceName);
      if (v) u.voice = v;
    }
    window.speechSynthesis?.speak(u);
  };

  useEffect(() => {
    speak(cycles[phaseIdx].label);
  }, [phaseIdx, round]);

  useEffect(() => {
    if (done) return;
    if (countdown === 0) {
      const next = (phaseIdx + 1) % cycles.length;
      if (next === 0) {
        if (round >= maxRounds) { setDone(true); return; }
        setRound(r => r + 1);
      }
      setPhaseIdx(next);
      setCountdown(cycles[next].duration);
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, phaseIdx, done]);

  const cur = cycles[phaseIdx];
  const pct = 1 - countdown / cur.duration;
  const size = 200;
  const r = size / 2 - 14;
  const circ = 2 * Math.PI * r;

  if (done) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20, paddingTop:20 }}>
      <div style={{ fontSize:48 }}>✓</div>
      <div style={{ fontSize:18, fontWeight:700, color:"#dde8f4" }}>Well done</div>
      <div style={{ fontSize:13, color:"#8099b0" }}>You stayed with it. That takes strength.</div>
      <div onClick={onExit} style={{ padding:"12px 28px", borderRadius:12, background:"rgba(56,189,248,0.1)", border:"1px solid rgba(56,189,248,0.25)", fontSize:13, fontWeight:700, color:"#38bdf8", cursor:"pointer" }}>Done</div>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
      <div style={{ fontSize:12, color:"#475569" }}>Round {round} of {maxRounds}</div>
      <div style={{ position:"relative", width:size, height:size, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <svg width={size} height={size} style={{ position:"absolute", transform:"rotate(-90deg)", pointerEvents:"none" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8"/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={cur.color} strokeWidth="8"
            strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} strokeLinecap="round"
            style={{ transition:"stroke-dashoffset 1s linear" }}/>
        </svg>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
          <div style={{ fontSize:44, fontWeight:900, color:cur.color }}>{countdown}</div>
          <div style={{ fontSize:14, fontWeight:700, color:cur.color }}>{cur.label}</div>
        </div>
      </div>
      <div onClick={() => { setMuted(m => !m); }} style={{ width:40, height:40, borderRadius:"50%", background:muted?"rgba(255,255,255,0.04)":"rgba(56,189,248,0.1)", border:`1.5px solid ${muted?"rgba(255,255,255,0.1)":"rgba(56,189,248,0.3)"}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", fontSize:16 }}>
        {muted ? "🔇" : "🔊"}
      </div>
      <div onClick={onExit} style={{ fontSize:12, color:"#475569", cursor:"pointer", textDecoration:"underline" }}>exit</div>
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────
export default function PTSDInterruptionScreen({ navigate, agency }) {
  const [category, setCategory] = useState(null);
  const [toolIndex, setToolIndex] = useState(null);
  const [step, setStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [showBall, setShowBall] = useState(false);
  const [voiceOn] = useState(() => {
    try { return localStorage.getItem("breathingVoice") !== "off"; } catch(e) { return true; }
  });
  const [voiceName] = useState(() => {
    try { return localStorage.getItem("breathingVoice") || ""; } catch(e) { return ""; }
  });
  const lc = useLayoutConfig();

  const tools = {
    grounding: {
      label: "Grounding", color: "#3D6B5E", icon: "🌊",
      items: [
        { title: "5-4-3-2-1 Reset", steps: ["Name 5 things you can see", "Name 4 things you can touch", "Name 3 things you can hear", "Name 2 things you can smell", "Name 1 thing you can taste"] },
        { title: "Cold Reset", steps: ["Hold something cold, or splash cold water on your face", "Cold interrupts the adrenaline surge", "Stay with the sensation for 30 seconds"] },
        { title: "Deep Pressure Reset", steps: ["Press your feet firmly into the floor", "Lean your back into a wall or chair", "Feel the pressure - you're here, not there", "Hold for 30 seconds"] },
      ]
    },
    breathing: {
      label: "Breathing", color: "#3A5A7C", icon: "💨",
      items: [
        { title: "Follow the Light", steps: ["FOLLOW_BALL"] },
        { title: "4-7-8 Reset", steps: ["TIMED_478"] },
        { title: "Tactical Breathing", steps: ["TIMED_TACTICAL"] },
      ]
    },
    orientation: {
      label: "Orientation", color: "#5A4A7A", icon: "🧭",
      items: [
        { title: "Name 3 Things", steps: ["Say aloud: 'My name is...'", "Say aloud: 'I am in...'", "Say aloud: 'Today's date is...'", "Repeat slowly until you feel present"] },
        { title: "Object Anchor", steps: ["Hold something with texture - keys, coin, badge", "Feel the temperature", "Feel the weight", "Describe it out loud"] },
        { title: "Room Scan", steps: ["Turn your head slowly to the left", "Name 3 things you see", "Turn to the right", "Name 3 more things", "Keep going until the room feels familiar"] },
      ]
    },
    movement: {
      label: "Movement", color: "#6B4A3A", icon: "🚶",
      items: [
        { title: "Grounding Walk", steps: ["Step forward with left foot", "Say 'left' out loud", "Step forward with right foot", "Say 'right' out loud", "Continue for 20 steps"] },
        { title: "Push Reset", steps: ["Find a wall or countertop", "Push against it with steady pressure", "Feel your own strength", "Hold for 10 seconds, release, repeat 3 times"] },
        { title: "Shoulder Roll", steps: ["Roll your shoulders forward 3 times", "Roll them back 3 times", "Let your jaw unclench", "Take a deep breath"] },
      ]
    },
    crisis: {
      label: "Crisis Support", color: "#6B2A2A", icon: "📞",
      items: [
        { title: "988 Crisis Lifeline", steps: ["Call or text: 988", "Available 24/7", "Free and confidential", "For anyone in emotional distress"] },
        { title: "Safe Call Now", steps: ["Call: 1-206-459-3020", "First responder specific", "Available 24/7", "Confidential"] },
        { title: "Talk to Someone Now", steps: ["TAP_HUMANPST", "TAP_AIPST"] },
      ]
    }
  };

  const allCategories = Object.entries(tools);
  const currentCat = category ? tools[category] : null;
  const currentTool = currentCat && toolIndex !== null ? currentCat.items[toolIndex] : null;

  // Following ball — full screen takeover
  if (showBall) {
    return (
      <ScreenSingle headerProps={{ onBack: () => setShowBall(false), agencyName: agency?.name }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <FollowingBall
            voiceOn={voiceOn}
            voiceName={voiceName}
            onExit={() => setShowBall(false)}
          />
        </div>
      </ScreenSingle>
    );
  }

  // Category List
  if (!category) {
    return (
      <ScreenSingle headerProps={{ onBack: () => navigate("tools"), agencyName: agency?.name }}>
        <div style={{ fontSize: 13, color: "#8099b0", lineHeight: 1.75 }}>
          Tools for first responders experiencing flashbacks, panic surges, or emotional overwhelm. Choose what feels right.
        </div>

        {/* Quick start — follow the ball */}
        <div onClick={() => setShowBall(true)} style={{ background: "rgba(56,189,248,0.1)", border: "1.5px solid rgba(56,189,248,0.3)", borderRadius: 16, padding: "18px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 32 }}>💙</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#38bdf8" }}>Follow the Light</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Auto-runs · No buttons · Just follow</div>
          </div>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#38bdf8", background: "rgba(56,189,248,0.15)", padding: "3px 8px", borderRadius: 6 }}>START</div>
        </div>

        <SLabel>All Tools</SLabel>
        {allCategories.map(([key, cat]) => (
          <Card key={key} onClick={() => setCategory(key)} style={{ display: "flex", alignItems: "center", gap: 14, background: `linear-gradient(135deg, ${cat.color}22, ${cat.color}0A)`, borderColor: `${cat.color}40` }}>
            <div style={{ fontSize: 28 }}>{cat.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#dde8f4" }}>{cat.label}</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{cat.items.length} tools</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3d5268" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </Card>
        ))}
      </ScreenSingle>
    );
  }

  // Tool List
  if (category && toolIndex === null) {
    return (
      <ScreenSingle headerProps={{ onBack: () => { setCategory(null); setStep(0); }, agencyName: agency?.name }}>
        <div style={{ fontSize: 13, color: "#8099b0", fontStyle: "italic", marginBottom: 16 }}>Select a technique. Take your time.</div>
        {currentCat.items.map((tool, idx) => (
          <Card key={idx} onClick={() => {
            if (tool.steps[0] === "FOLLOW_BALL") { setShowBall(true); return; }
            setToolIndex(idx); setStep(0); setCompleted(false);
          }} style={{ display: "flex", alignItems: "center", gap: 14, background: `linear-gradient(135deg, ${currentCat.color}15, transparent)`, borderColor: `${currentCat.color}30` }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${currentCat.color}40`, border: `1px solid ${currentCat.color}60`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: currentCat.color, flexShrink: 0 }}>
              {idx + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#dde8f4" }}>{tool.title}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                {tool.steps[0] === "FOLLOW_BALL" ? "Auto-runs · follow the animated light" : `${tool.steps.length} steps`}
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3d5268" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </Card>
        ))}
      </ScreenSingle>
    );
  }

  // Tool Steps
  if (currentTool && !completed) {
    return (
      <ScreenSingle headerProps={{ onBack: () => { setToolIndex(null); setStep(0); }, agencyName: agency?.name }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {currentTool.steps.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? currentCat.color : "rgba(255,255,255,0.08)", transition: "all 0.3s" }}/>
          ))}
        </div>

        <Card style={{ minHeight: 180, padding: "28px 24px", background: `linear-gradient(135deg, ${currentCat.color}20, ${currentCat.color}08)`, borderColor: `${currentCat.color}40`, marginBottom: 20, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", top: 12, right: 16, fontSize: 11, color: currentCat.color, fontWeight: 600 }}>
            Step {step + 1} of {currentTool.steps.length}
          </div>
          {currentTool.steps[step] === "TIMED_478" ? (
            <TimedBreathing type="478" voiceOn={voiceOn} voiceName={voiceName} onExit={() => { setToolIndex(null); setStep(0); }}/>
          ) : currentTool.steps[step] === "TIMED_TACTICAL" ? (
            <TimedBreathing type="tactical" voiceOn={voiceOn} voiceName={voiceName} onExit={() => { setToolIndex(null); setStep(0); }}/>
          ) : currentTool.steps[step] === "TAP_HUMANPST" ? (
            <div onClick={() => navigate("humanpst")} style={{ width: "100%", background: "rgba(167,139,250,0.12)", border: "1.5px solid rgba(167,139,250,0.35)", borderRadius: 14, padding: "16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(167,139,250,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🤝</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#c4b5fd" }}>Talk to a Human PST Member</div>
                <div style={{ fontSize: 12, color: "#7c5cbf", marginTop: 2 }}>Real peer support - call, text, or chat</div>
              </div>
            </div>
          ) : currentTool.steps[step] === "TAP_AIPST" ? (
            <div onClick={() => navigate("aichat")} style={{ width: "100%", background: "rgba(239,68,68,0.1)", border: "1.5px solid rgba(239,68,68,0.3)", borderRadius: 14, padding: "16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🤖</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#fca5a5" }}>Talk to AI Peer Support</div>
                <div style={{ fontSize: 12, color: "#7f1d1d", marginTop: 2 }}>Anonymous, available right now</div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 16, lineHeight: 1.8, color: "#e8e4dc", textAlign: "center", fontWeight: 300 }}>
              {currentTool.steps[step]}
            </div>
          )}
        </Card>

        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 20 }}>
          {currentTool.steps.map((_, i) => (
            <div key={i} onClick={() => setStep(i)} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, background: i === step ? currentCat.color : "rgba(255,255,255,0.15)", transition: "all 0.3s", cursor: "pointer" }}/>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {step > 0 && (
            <Btn onClick={() => setStep(step - 1)} style={{ flex: 1, background: "rgba(255,255,255,0.05)", color: "#8099b0" }}>← Back</Btn>
          )}
          <Btn onClick={() => { if (step < currentTool.steps.length - 1) { setStep(step + 1); } else { setCompleted(true); } }}
            color={currentCat.color} bg={`${currentCat.color}CC`} style={{ flex: 2 }}>
            {step < currentTool.steps.length - 1 ? "Next →" : "Complete ✓"}
          </Btn>
        </div>
      </ScreenSingle>
    );
  }

  // Completion
  if (completed) {
    return (
      <ScreenSingle headerProps={{ onBack: () => navigate("tools"), agencyName: agency?.name }}>
        <div style={{ textAlign: "center", paddingTop: 20 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(126,191,173,0.1)", border: "2px solid rgba(126,191,173,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 20px" }}>✓</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#dde8f4", marginBottom: 12 }}>Tool Complete</div>
          <div style={{ fontSize: 14, color: "#8099b0", lineHeight: 1.7, marginBottom: 32, fontStyle: "italic" }}>You used a tool. That takes strength.</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Btn onClick={() => setShowBall(true)} color="#38bdf8">Follow the Light →</Btn>
          <Btn onClick={() => { setToolIndex(null); setStep(0); setCompleted(false); }} color="#7EBFAD">Try Another Tool</Btn>
          <Btn onClick={() => { setCategory(null); setToolIndex(null); setStep(0); setCompleted(false); }} style={{ background: "rgba(255,255,255,0.05)", color: "#8099b0" }}>Back to Categories</Btn>
          <div onClick={() => navigate("tools")} style={{ fontSize: 13, color: "#64748b", textAlign: "center", cursor: "pointer", marginTop: 6, textDecoration: "underline" }}>Return to Tools</div>
        </div>
      </ScreenSingle>
    );
  }
}
