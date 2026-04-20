// ============================================================
// SCREEN: BreathingScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { AppHeader, Screen, ScreenSingle, Btn, Card, SLabel, DragList, NavBtn, DesktopWrap, HomeTile, ToolCard } from './ui.jsx';
import { BoltIcon, ClockIcon, BreathIcon, HeartIcon, GaugeIcon, HomeIcon, InfoIcon, MapIcon, UserIcon, ToolsIcon, GroundIcon, JournalIcon, ResetIcon, LockIcon, BuildingIcon, TimerIcon, SettingsIcon, ShieldIcon } from './icons.jsx';
import { trackCheckin, trackTool, trackAISession, trackPSTContact, AW_ENDPOINT, AW_PROJECT, AW_DB } from './analytics.js';
import { useLayoutConfig, getContractStatus, getCodeStatus, getContractBanner, detectSpiritual, detectLevel } from './utils.js';

export default function BreathingScreen({ navigate, agency }) {
  const steps = [
    { label: "Inhale",  duration: 4, color: "#38bdf8", voice: "Inhale"  },
    { label: "Hold",    duration: 4, color: "#a78bfa", voice: "Hold"    },
    { label: "Exhale",  duration: 4, color: "#22c55e", voice: "Exhale"  },
    { label: "Hold",    duration: 4, color: "#eab308", voice: "Hold"    },
  ];
  const instruct = [
    "Breathe in slowly through your nose",
    "Hold gently",
    "Breathe out slowly through your mouth",
    "Hold and relax",
  ];

  const [active, setActive]   = useState(false);
  const [si, setSi]           = useState(0);
  const [cd, setCd]           = useState(4);
  const [cycles, setCycles]   = useState(0);
  const [voiceOn, setVoiceOn] = useState(true);
  const lc = useLayoutConfig();
  const circleSize = lc.isDesktop ? 220 : lc.isTablet ? 200 : 180;
  const innerSize  = circleSize - 40;
  const r          = circleSize / 2 - 20;

  const lastSpokenStep = useRef(-1);

  // Get saved voice preference
  const getVoice = () => {
    const saved = localStorage.getItem("breathingVoice");
    const voices = window.speechSynthesis?.getVoices() || [];
    if (saved) return voices.find(v => v.name === saved) || null;
    // Default: prefer calm English voice
    return voices.find(v =>
      v.name.includes("Samantha") ||
      v.name.includes("Karen")    ||
      v.name.includes("Moira")    ||
      v.name.includes("Google US English") ||
      v.lang === "en-US"
    ) || null;
  };

  // Voice using Web Speech API
  const speak = (text) => {
    if (!voiceOn) return;
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate   = 0.78;
    u.pitch  = 0.9;
    u.volume = 1;
    const v = getVoice();
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  };

  // Countdown numbers during inhale/exhale
  const speakCount = (count) => {
    if (!voiceOn) return;
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(count));
    u.rate   = 0.9;
    u.pitch  = 0.85;
    u.volume = 0.6;
    const v = getVoice();
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  };

  useEffect(() => {
    if (!active) return;

    // Speak step label when step changes
    if (lastSpokenStep.current !== si) {
      lastSpokenStep.current = si;
      speak(steps[si].voice);
      return;
    }

    if (cd === 0) {
      const n = (si + 1) % 4;
      setSi(n);
      setCd(steps[n].duration);
      if (n === 0) setCycles(c => c + 1);
      return;
    }

    // Speak count on inhale and exhale only (not hold)
    if (cd <= 3 && (si === 0 || si === 2)) {
      speakCount(cd);
    }

    const t = setTimeout(() => setCd(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [active, cd, si, voiceOn]);

  const handleToggle = () => {
    if (active) {
      // Stop
      window.speechSynthesis?.cancel();
      setActive(false);
    } else {
      // Start
      setSi(0);
      setCd(4);
      setCycles(0);
      lastSpokenStep.current = -1;
      setActive(true);
    }
  };

  const handleMuteToggle = () => {
    if (voiceOn) window.speechSynthesis?.cancel();
    setVoiceOn(v => !v);
  };

  const cur  = steps[si];
  const prog = active ? (steps[si].duration - cd) / steps[si].duration : 0;

  return (
    <ScreenSingle headerProps={{ onBack: () => navigate("tools"), agencyName: (agency && agency.name) }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, paddingTop: 10 }}>

        {/* Circle */}
        <div style={{ position: "relative", width: circleSize, height: circleSize, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width={circleSize} height={circleSize} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
            <circle cx={circleSize/2} cy={circleSize/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6"/>
            <circle cx={circleSize/2} cy={circleSize/2} r={r} fill="none" stroke={cur.color} strokeWidth="6"
              strokeDasharray={`${2*Math.PI*r}`}
              strokeDashoffset={`${2*Math.PI*r*(1-prog)}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
            />
          </svg>
          <div style={{ width: innerSize, height: innerSize, borderRadius: "50%", background: `radial-gradient(circle,${cur.color}18 0%,transparent 70%)`, border: `2px solid ${cur.color}30`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <div style={{ fontSize: lc.isDesktop ? 40 : 32, fontWeight: 900, color: cur.color }}>{active ? cd : "▶"}</div>
            <div style={{ fontSize: lc.isDesktop ? 16 : 14, fontWeight: 700, color: cur.color }}>{cur.label}</div>
            {cycles > 0 && <div style={{ fontSize: 10, color: "#2d4a66" }}>Cycle {cycles}</div>}
          </div>
        </div>

        {/* Instruction */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 15, color: "#c8dae8", fontWeight: 600 }}>{instruct[si]}</div>
          <div style={{ fontSize: 12, color: "#2d4a66", marginTop: 4 }}>Box Breathing · 4-4-4-4</div>
        </div>

        {/* Step indicators */}
        <div style={{ display: "flex", gap: 8 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ background: i===si&&active ? s.color+"30" : "rgba(255,255,255,0.04)", border: `1px solid ${i===si&&active ? s.color+"60" : "rgba(255,255,255,0.07)"}`, borderRadius: 8, padding: "6px 10px", fontSize: 11, color: i===si&&active ? s.color : "#2d4a66", fontWeight: i===si ? 700 : 400, transition: "all 0.3s" }}>
              {s.label}
            </div>
          ))}
        </div>

        {/* Start/Stop + Mute row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Btn
            color={active ? "#f87171" : "#38bdf8"}
            bg={active ? "rgba(239,68,68,0.1)" : "rgba(56,189,248,0.1)"}
            onClick={handleToggle}
            style={{ padding: "14px 40px" }}
          >
            {active ? "Stop" : "Start Breathing"}
          </Btn>

          {/* Mute toggle */}
          <div
            onClick={handleMuteToggle}
            title={voiceOn ? "Mute voice" : "Unmute voice"}
            style={{ width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: voiceOn ? "rgba(56,189,248,0.1)" : "rgba(255,255,255,0.04)", border: `1.5px solid ${voiceOn ? "rgba(56,189,248,0.3)" : "rgba(255,255,255,0.1)"}`, fontSize: 18, transition: "all 0.2s", flexShrink: 0 }}
          >
            {voiceOn ? "🔊" : "🔇"}
          </div>
        </div>

        {/* Voice info */}
        <div style={{ fontSize: 11, color: "#2d4a66", textAlign: "center", lineHeight: 1.8 }}>
          {voiceOn ? "Voice guidance on — tap 🔇 to mute" : "Voice muted — tap 🔊 to enable"}
          <br/>
          <span onClick={() => { localStorage.setItem("settingsReturnTo", "breathing"); navigate("about"); }} style={{ color: "#38bdf8", opacity: 0.6, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
            Change voice in Settings
          </span>
        </div>

        {/* Completion card */}
        {cycles >= 3 && (
          <Card style={{ background: "rgba(34,197,94,0.08)", borderColor: "rgba(34,197,94,0.2)", textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#22c55e", marginBottom: 4 }}>3 cycles complete 🌊</div>
            <div style={{ fontSize: 12, color: "#2d4a66" }}>Your nervous system is resetting.</div>
          </Card>
        )}
      </div>
    </ScreenSingle>
  );
}

//
// GROUNDING
//
