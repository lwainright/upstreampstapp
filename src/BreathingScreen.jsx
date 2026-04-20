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
  const [voiceOn, setVoiceOn]           = useState(true);
  const [showVoicePicker, setShowVoicePicker] = useState(false);
  const [voices, setVoices]             = useState([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState(() => {
    try { return localStorage.getItem("breathingVoice") || ""; } catch(e) { return ""; }
  });

  // Load English voices
  useEffect(() => {
    const load = () => {
      const v = window.speechSynthesis?.getVoices().filter(v => v.lang.startsWith("en")) || [];
      setVoices(v);
    };
    load();
    window.speechSynthesis?.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", load);
  }, []);

  const saveVoice = (name) => {
    setSelectedVoiceName(name);
    try { localStorage.setItem("breathingVoice", name); } catch(e) {}
    setShowVoicePicker(false);
  };
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

    if (cd === 0) {
      const n = (si + 1) % 4;
      setSi(n);
      setCd(steps[n].duration);
      if (n === 0) setCycles(c => c + 1);
      lastSpokenStep.current = -1; // reset so next step speaks
      return;
    }

    // Speak step label on first tick of each step
    if (lastSpokenStep.current !== si) {
      lastSpokenStep.current = si;
      speak(steps[si].voice);
    } else if (cd <= 3 && (si === 0 || si === 2)) {
      // Speak countdown on inhale/exhale only
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
          <div onClick={handleToggle} style={{ width: innerSize, height: innerSize, borderRadius: "50%", background: `radial-gradient(circle,${cur.color}18 0%,transparent 70%)`, border: `2px solid ${active ? cur.color+"50" : cur.color+"40"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer", boxShadow: active ? "none" : `0 0 24px ${cur.color}20` }}>
            <div style={{ fontSize: lc.isDesktop ? 40 : 32, fontWeight: 900, color: cur.color }}>{active ? cd : "▶"}</div>
            <div style={{ fontSize: lc.isDesktop ? 16 : 14, fontWeight: 700, color: cur.color }}>{active ? cur.label : "Tap to Start"}</div>
            {active && cycles > 0 && <div style={{ fontSize: 10, color: "#2d4a66" }}>Cycle {cycles}</div>}
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

          {/* Mute + voice picker toggle */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div
              onClick={() => { handleMuteToggle(); if (!voiceOn) setShowVoicePicker(false); }}
              style={{ width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: voiceOn ? "rgba(56,189,248,0.1)" : "rgba(255,255,255,0.04)", border: `1.5px solid ${voiceOn ? "rgba(56,189,248,0.3)" : "rgba(255,255,255,0.1)"}`, fontSize: 18, transition: "all 0.2s", flexShrink: 0 }}
            >
              {voiceOn ? "🔊" : "🔇"}
            </div>
            {voiceOn && (
              <div onClick={() => setShowVoicePicker(v => !v)} style={{ fontSize: 9, color: "#38bdf8", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2, opacity: 0.7, whiteSpace: "nowrap" }}>
                {showVoicePicker ? "close" : "change voice"}
              </div>
            )}
          </div>
        </div>

        {/* Inline voice picker — drops below play button row */}
        {showVoicePicker && voiceOn && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(56,189,248,0.15)", borderRadius: 14, padding: "12px 14px", width: "100%" }}>
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, marginBottom: 8, letterSpacing: "0.08em", textTransform: "uppercase" }}>Choose Voice</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 180, overflowY: "auto" }}>
              <div onClick={() => saveVoice("")} style={{ padding: "9px 12px", borderRadius: 9, cursor: "pointer", background: selectedVoiceName === "" ? "rgba(56,189,248,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${selectedVoiceName === "" ? "rgba(56,189,248,0.3)" : "rgba(255,255,255,0.06)"}`, fontSize: 12, fontWeight: selectedVoiceName === "" ? 700 : 500, color: selectedVoiceName === "" ? "#38bdf8" : "#8099b0", display: "flex", justifyContent: "space-between" }}>
                <span>Default (Auto)</span>
                {selectedVoiceName === "" && <span style={{ fontSize: 10, color: "#38bdf8" }}>ACTIVE</span>}
              </div>
              {voices.map((v, i) => (
                <div key={i} onClick={() => saveVoice(v.name)} style={{ padding: "9px 12px", borderRadius: 9, cursor: "pointer", background: selectedVoiceName === v.name ? "rgba(56,189,248,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${selectedVoiceName === v.name ? "rgba(56,189,248,0.3)" : "rgba(255,255,255,0.06)"}`, fontSize: 12, fontWeight: selectedVoiceName === v.name ? 700 : 500, color: selectedVoiceName === v.name ? "#38bdf8" : "#8099b0", display: "flex", justifyContent: "space-between" }}>
                  <span>{v.name}</span>
                  {selectedVoiceName === v.name && <span style={{ fontSize: 10, color: "#38bdf8" }}>ACTIVE</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Voice hint */}
        {!showVoicePicker && (
          <div style={{ fontSize: 11, color: "#2d4a66", textAlign: "center" }}>
            {voiceOn ? "Voice guidance on — tap 🔇 to mute" : "Voice muted — tap 🔊 to enable"}
          </div>
        )}

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
