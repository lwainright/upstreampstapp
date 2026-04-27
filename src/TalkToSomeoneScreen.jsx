// ============================================================
// TalkToSomeoneScreen.jsx
// Upstream Approach -- Talk to Someone hub
// AI Peer Support + Human PST + Safety Vault access
// ============================================================
import React, { useState, useEffect } from 'react';
import { ScreenSingle } from './ui.jsx';

export default function TalkToSomeoneScreen({ navigate, agency, logoSrc }) {
  const [humanPSTEnabled, setHumanPSTEnabled] = useState(false);
  const [pstMembers, setPstMembers] = useState(0);

  useEffect(() => {
    try {
      const toggles = JSON.parse(localStorage.getItem("upstream_toggles") || "{}");
      setHumanPSTEnabled(toggles.humanPST !== false && !!agency);
    } catch(e) {}
  }, [agency]);

  const continuumLevel = (() => {
    try {
      const l = parseInt(localStorage.getItem("upstream_crisis_level") || "0");
      return l;
    } catch(e) { return 0; }
  })();

  const urgencyColor = continuumLevel >= 3 ? "#ef4444" : continuumLevel >= 2 ? "#f97316" : "#38bdf8";

  return (
    <ScreenSingle headerProps={{ onBack: () => navigate("home"), agencyName: agency?.name, logoSrc }}>
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

        {/* Header */}
        <div style={{ textAlign:"center", padding:"8px 0 4px" }}>
          <div style={{ fontSize:32, marginBottom:8 }}>💬</div>
          <div style={{ fontSize:18, fontWeight:800, color:"#dde8f4" }}>Talk to Someone</div>
          <div style={{ fontSize:12, color:"#64748b", marginTop:4, lineHeight:1.6 }}>
            Anonymous. Confidential. Available now.
          </div>
        </div>

        {/* AI Peer Support -- always available */}
        <div onClick={() => navigate("aichat")}
          style={{ background:"rgba(239,68,68,0.08)", border:"1.5px solid rgba(239,68,68,0.25)", borderRadius:16, padding:"18px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:48, height:48, borderRadius:14, background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.25)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>⚡</div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
              <div style={{ fontSize:15, fontWeight:800, color:"#f87171" }}>AI Peer Support</div>
              <span style={{ fontSize:9, fontWeight:800, color:"#ef4444", background:"rgba(239,68,68,0.15)", padding:"2px 7px", borderRadius:5, letterSpacing:"0.08em" }}>24/7</span>
            </div>
            <div style={{ fontSize:12, color:"#64748b", lineHeight:1.5 }}>Anonymous peer-style support. No judgment. No identity required.</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </div>

        {/* Human PST */}
        <div onClick={() => humanPSTEnabled ? navigate("humanpst") : navigate("agencycode")}
          style={{ background: humanPSTEnabled ? "rgba(167,139,250,0.08)" : "rgba(255,255,255,0.02)", border:`1.5px solid ${humanPSTEnabled ? "rgba(167,139,250,0.25)" : "rgba(255,255,255,0.06)"}`, borderRadius:16, padding:"18px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:14, opacity: humanPSTEnabled ? 1 : 0.6 }}>
          <div style={{ width:48, height:48, borderRadius:14, background: humanPSTEnabled ? "rgba(167,139,250,0.12)" : "rgba(255,255,255,0.04)", border:`1px solid ${humanPSTEnabled ? "rgba(167,139,250,0.25)" : "rgba(255,255,255,0.08)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>🤝</div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
              <div style={{ fontSize:15, fontWeight:800, color: humanPSTEnabled ? "#a78bfa" : "#475569" }}>Human Peer Support</div>
              {humanPSTEnabled
                ? <span style={{ fontSize:9, fontWeight:800, color:"#22c55e", background:"rgba(34,197,94,0.12)", padding:"2px 7px", borderRadius:5 }}>AVAILABLE</span>
                : <span style={{ fontSize:9, fontWeight:800, color:"#475569", background:"rgba(255,255,255,0.05)", padding:"2px 7px", borderRadius:5 }}>AGENCY REQUIRED</span>
              }
            </div>
            <div style={{ fontSize:12, color:"#64748b", lineHeight:1.5 }}>
              {humanPSTEnabled
                ? "Real people, trained peer support. Anonymous request, you control contact."
                : "Connect your agency code to access your peer support team."
              }
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={humanPSTEnabled ? "#a78bfa" : "#334155"} strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </div>

        {/* Divider */}
        <div style={{ display:"flex", alignItems:"center", gap:10, margin:"4px 0" }}>
          <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.05)" }}/>
          <div style={{ fontSize:10, color:"#334155", fontWeight:600 }}>MORE SUPPORT</div>
          <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.05)" }}/>
        </div>

        {/* Crisis Resources */}
        <div onClick={() => navigate("resources")}
          style={{ background:"rgba(56,189,248,0.05)", border:"1px solid rgba(56,189,248,0.12)", borderRadius:14, padding:"14px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:20 }}>🗺</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#38bdf8" }}>Find Resources</div>
            <div style={{ fontSize:11, color:"#475569" }}>Local and national support organizations</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </div>

        {/* 988 Crisis Line */}
        <div onClick={() => window.location.href = "tel:988"}
          style={{ background:"rgba(239,68,68,0.05)", border:"1px solid rgba(239,68,68,0.15)", borderRadius:14, padding:"14px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:20 }}>📞</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#f87171" }}>988 Crisis Line</div>
            <div style={{ fontSize:11, color:"#475569" }}>Call or text — free, confidential, 24/7</div>
          </div>
          <div style={{ fontSize:13, fontWeight:800, color:"#ef4444" }}>Call</div>
        </div>

        {/* Safety Vault -- subtle, always findable */}
        <div onClick={() => navigate("safetyvault")}
          style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:12, padding:"12px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:10, marginTop:4 }}>
          <span style={{ fontSize:16 }}>🔒</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:600, color:"#475569" }}>Private Safety Space</div>
            <div style={{ fontSize:10, color:"#334155" }}>DV resources, recovery tools, personal notes — PIN protected</div>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </div>

      </div>
    </ScreenSingle>
  );
}
