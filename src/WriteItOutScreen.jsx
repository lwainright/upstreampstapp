// ============================================================
// WriteItOutScreen.jsx
// Upstream Approach -- Write It Out hub
// Journal + 90-Second Dump + Reflective Notes
// ============================================================
import React from 'react';
import { ScreenSingle } from './ui.jsx';

const TOOLS = [
  {
    key: "dump90",
    icon: "⏱",
    title: "90-Second Dump",
    sub: "Type everything. It auto-shreds when done. Nothing saved. Nothing sent.",
    color: "#f97316",
    bg: "rgba(249,115,22,0.08)",
    border: "rgba(249,115,22,0.22)",
    badge: "VENT",
    badgeColor: "#f97316",
    dest: "dump90",
  },
  {
    key: "journal",
    icon: "📓",
    title: "Journal",
    sub: "Private. Stays on your device. No sync, no cloud, no one can see it.",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.22)",
    badge: "PRIVATE",
    badgeColor: "#a78bfa",
    dest: "journal",
  },
  {
    key: "afteraction",
    icon: "🔄",
    title: "After-Action Reset",
    sub: "Structured processing after a hard call, case, or incident.",
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.08)",
    border: "rgba(56,189,248,0.22)",
    badge: null,
    dest: "afteraction",
  },
  {
    key: "grief",
    icon: "🕊️",
    title: "Grief Support",
    sub: "Line of duty, patient loss, case outcome, personal loss. All valid here.",
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.06)",
    border: "rgba(148,163,184,0.18)",
    badge: null,
    dest: "grief",
  },
];

const PROMPTS = [
  "What happened today that I'm still carrying?",
  "What do I want to set down before I walk in the door?",
  "What would I want someone to know about what I saw today?",
  "What is one thing I did today that was enough?",
  "What do I need right now that I haven't asked for?",
];

export default function WriteItOutScreen({ navigate, agency, logoSrc }) {
  const prompt = PROMPTS[new Date().getDate() % PROMPTS.length];

  return (
    <ScreenSingle headerProps={{ onBack: () => navigate("home"), agencyName: agency?.name, logoSrc }}>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

        {/* Header */}
        <div style={{ textAlign:"center", padding:"8px 0 4px" }}>
          <div style={{ fontSize:32, marginBottom:8 }}>✍️</div>
          <div style={{ fontSize:18, fontWeight:800, color:"#dde8f4" }}>Write It Out</div>
          <div style={{ fontSize:12, color:"#64748b", marginTop:4, lineHeight:1.6 }}>
            Getting it out of your head is the first step.
          </div>
        </div>

        {/* Rotating prompt */}
        <div style={{ background:"rgba(167,139,250,0.05)", border:"1px solid rgba(167,139,250,0.12)", borderRadius:12, padding:"12px 14px" }}>
          <div style={{ fontSize:10, fontWeight:700, color:"#a78bfa", letterSpacing:"0.1em", marginBottom:5 }}>TODAY'S PROMPT</div>
          <div style={{ fontSize:13, color:"#94a3b8", lineHeight:1.7, fontStyle:"italic" }}>"{prompt}"</div>
        </div>

        {/* Tool tiles */}
        {TOOLS.map(tool => (
          <div key={tool.key} onClick={() => navigate(tool.dest)}
            style={{ background:tool.bg, border:`1.5px solid ${tool.border}`, borderRadius:16, padding:"16px", cursor:"pointer", display:"flex", alignItems:"center", gap:14, position:"relative", overflow:"hidden" }}>
            {tool.badge && (
              <div style={{ position:"absolute", top:10, right:12, fontSize:9, fontWeight:800, color:tool.badgeColor, background:`${tool.bg}`, border:`1px solid ${tool.badgeColor}40`, padding:"2px 7px", borderRadius:5, letterSpacing:"0.08em" }}>{tool.badge}</div>
            )}
            <div style={{ width:48, height:48, borderRadius:14, background:tool.bg, border:`1px solid ${tool.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>{tool.icon}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:800, color:tool.color, marginBottom:3 }}>{tool.title}</div>
              <div style={{ fontSize:12, color:"#64748b", lineHeight:1.5 }}>{tool.sub}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tool.color} strokeWidth="2.5" style={{ flexShrink:0 }}><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        ))}

      </div>
    </ScreenSingle>
  );
}
