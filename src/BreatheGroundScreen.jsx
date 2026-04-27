// ============================================================
// BreatheGroundScreen.jsx
// Upstream Approach -- Breathe & Ground hub
// Box Breathing + 5-4-3-2-1 + Follow the Light
// ============================================================
import React, { useState } from 'react';
import { ScreenSingle } from './ui.jsx';

const TOOLS = [
  {
    key: "breathing",
    icon: "🫁",
    title: "Box Breathing",
    sub: "4-4-4-4 pattern. Slows your nervous system in under 2 minutes.",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.22)",
    time: "2 min",
    dest: "breathing",
  },
  {
    key: "grounding",
    icon: "🌿",
    title: "5-4-3-2-1 Grounding",
    sub: "Brings you back to right now. Works anywhere, anytime.",
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.08)",
    border: "rgba(56,189,248,0.22)",
    time: "3 min",
    dest: "grounding",
  },
  {
    key: "ptsd",
    icon: "💙",
    title: "Follow the Light",
    sub: "Bilateral sensory grounding. Helps when a call won't leave your head.",
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.08)",
    border: "rgba(56,189,248,0.22)",
    time: "5 min",
    dest: "ptsd",
  },
  {
    key: "sleep",
    icon: "🌙",
    title: "Sleep Tools",
    sub: "Shift work sleep disorder. 4-7-8 breathing. Wind-down tools.",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.22)",
    time: "5 min",
    dest: "sleep",
  },
];

const QUICK_TIP = [
  "Exhale longer than you inhale — that activates the parasympathetic brake.",
  "Your feet on the floor are grounding. Feel them right now.",
  "Cold water on your wrists resets your nervous system fast.",
  "Name 3 things you can see right now. Your brain is already shifting.",
  "One slow breath in. Hold 2 seconds. Slow breath out. That's enough to start.",
];

export default function BreatheGroundScreen({ navigate, agency, logoSrc }) {
  const tip = QUICK_TIP[Math.floor(Date.now() / 86400000) % QUICK_TIP.length];

  return (
    <ScreenSingle headerProps={{ onBack: () => navigate("home"), agencyName: agency?.name, logoSrc }}>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

        {/* Header */}
        <div style={{ textAlign:"center", padding:"8px 0 4px" }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🌬️</div>
          <div style={{ fontSize:18, fontWeight:800, color:"#dde8f4" }}>Breathe & Ground</div>
          <div style={{ fontSize:12, color:"#64748b", marginTop:4, lineHeight:1.6 }}>
            Regulate first. Everything else after.
          </div>
        </div>

        {/* Quick tip */}
        <div style={{ background:"rgba(34,197,94,0.05)", border:"1px solid rgba(34,197,94,0.12)", borderRadius:12, padding:"12px 14px" }}>
          <div style={{ fontSize:10, fontWeight:700, color:"#22c55e", letterSpacing:"0.1em", marginBottom:5 }}>QUICK TIP</div>
          <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.7, fontStyle:"italic" }}>{tip}</div>
        </div>

        {/* Tool tiles */}
        {TOOLS.map(tool => (
          <div key={tool.key} onClick={() => navigate(tool.dest)}
            style={{ background:tool.bg, border:`1.5px solid ${tool.border}`, borderRadius:16, padding:"16px", cursor:"pointer", display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:48, height:48, borderRadius:14, background:`${tool.bg}`, border:`1px solid ${tool.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>{tool.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                <div style={{ fontSize:14, fontWeight:800, color:tool.color }}>{tool.title}</div>
                <span style={{ fontSize:9, fontWeight:700, color:tool.color, background:`${tool.bg}`, padding:"2px 6px", borderRadius:4, opacity:0.8 }}>{tool.time}</span>
              </div>
              <div style={{ fontSize:12, color:"#64748b", lineHeight:1.5 }}>{tool.sub}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tool.color} strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        ))}

        {/* HRV link */}
        <div onClick={() => navigate("hrv")}
          style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"12px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:18 }}>💓</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#f87171" }}>Check Your HRV</div>
            <div style={{ fontSize:10, color:"#475569" }}>See how recovered your nervous system is right now</div>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </div>

      </div>
    </ScreenSingle>
  );
}
