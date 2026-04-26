// ============================================================
// SCREEN: PSTPanelScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { AppHeader, Screen, ScreenSingle, Btn, Card, SLabel, DragList, NavBtn, DesktopWrap, HomeTile, ToolCard } from './ui.jsx';
import { BoltIcon, ClockIcon, BreathIcon, HeartIcon, GaugeIcon, HomeIcon, InfoIcon, MapIcon, UserIcon, ToolsIcon, GroundIcon, JournalIcon, ResetIcon, LockIcon, BuildingIcon, TimerIcon, SettingsIcon, ShieldIcon } from './icons.jsx';
import { trackCheckin, trackTool, trackAISession, trackPSTContact, AW_ENDPOINT, AW_PROJECT, AW_DB } from './analytics.js';
import { useLayoutConfig, getContractStatus, getCodeStatus, getContractBanner, detectSpiritual, detectLevel } from './utils.js';

export default function PSTPanelScreen({navigate,agency}){
  const[members,setMembers]=useState([
    {name:"J. Martinez",role:"PST Lead",   status:"on"},
    {name:"A. Thompson",role:"PST Member", status:"phone"},
    {name:"C. Williams",role:"PST Member", status:"off"},
    {name:"D. Nguyen",  role:"PST Member", status:"on"},
  ]);
  const[myStatus,setMyStatus]=useState("on");
  const lc=useLayoutConfig();
  const isWide=lc.isDesktop;

  const statusMap={
    on:    {label:"On Duty",           color:"#22c55e",dot:"#22c55e",bg:"rgba(34,197,94,0.12)"},
    phone: {label:"Available by Phone",color:"#eab308",dot:"#eab308",bg:"rgba(234,179,8,0.1)"},
    off:   {label:"Off Duty",          color:"#3d5268",dot:"#1e3a52",bg:"rgba(255,255,255,0.03)"},
  };

  const onCount    = members.filter(m=>m.status==="on").length;
  const phoneCount = members.filter(m=>m.status==="phone").length;
  const offCount   = members.length - onCount - phoneCount;

  return(
    <ScreenSingle wide={true} headerProps={{onBack:()=>navigate("home"),agencyName:(agency&&agency.name)}}>

      {/* Dispatch Board button */}
      <div onClick={() => navigate("pstdispatch")} style={{ background:"rgba(239,68,68,0.1)", border:"1.5px solid rgba(239,68,68,0.3)", borderRadius:14, padding:"14px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:800, color:"#ef4444" }}>🚨 PST Dispatch Board</div>
          <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>View incoming requests · Claim cases · Write narratives</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </div>

      {/* Coverage summary banner */}
      <div style={{background:"rgba(139,92,246,0.08)",border:"1.5px solid rgba(139,92,246,0.2)",borderRadius:14,padding:"14px 16px"}}>
        <div style={{fontSize:12,color:"#a78bfa",fontWeight:700,marginBottom:4}}>🟣 PST SHIFT COVERAGE</div>
        <div style={{fontSize:13,color:"#c4b5fd",lineHeight:1.6}}>On Duty notified first · Available by Phone second · Off Duty not notified</div>
        <div style={{display:"flex",gap:16,marginTop:10}}>
          <span style={{fontSize:12,color:"#22c55e",fontWeight:700}}>🟢 {onCount} On Duty</span>
          <span style={{fontSize:12,color:"#eab308",fontWeight:700}}>🟡 {phoneCount} By Phone</span>
          <span style={{fontSize:12,color:"#3d5268",fontWeight:700}}>⚫ {offCount} Off Duty</span>
        </div>
      </div>

      {/* Desktop: 2 columns — my status left, team right */}
      <div style={{display:"grid", gridTemplateColumns:isWide?"1fr 1fr":"1fr", gap:isWide?24:16}}>

        {/* LEFT — My availability */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{fontSize:11,color:"#a78bfa",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase"}}>My Availability</div>
          <div style={{display:"flex",flexDirection:isWide?"column":"row",gap:8}}>
            {Object.entries(statusMap).map(([k,s])=>(
              <div key={k} onClick={()=>setMyStatus(k)} style={{flex:1,background:myStatus===k?s.bg:"rgba(255,255,255,0.03)",border:`1.5px solid ${myStatus===k?s.color+"55":"rgba(255,255,255,0.065)"}`,borderRadius:12,padding:isWide?"16px 14px":"12px 8px",cursor:"pointer",textAlign:"center",transition:"all 0.15s",display:"flex",alignItems:"center",gap:isWide?12:0,flexDirection:isWide?"row":"column"}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:s.dot,flexShrink:0}}/>
                <div style={{fontSize:isWide?13:11,fontWeight:700,color:myStatus===k?s.color:"#2d4a66",lineHeight:1.4}}>{s.label}</div>
                {myStatus===k && <div style={{marginLeft:"auto",fontSize:11,color:s.color,fontWeight:800}}>✓ Active</div>}
              </div>
            ))}
          </div>

          {/* Pending requests — desktop shows here */}
          {isWide && (
            <div>
              <div style={{fontSize:11,color:"#64748b",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10}}>Incoming Requests</div>
              <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:14,padding:"20px",textAlign:"center"}}>
                <div style={{fontSize:13,color:"#2d4a66"}}>No active requests</div>
                <div style={{fontSize:11,color:"#1e3a52",marginTop:4}}>You'll be notified when someone reaches out</div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Team coverage */}
        <div>
          <div style={{fontSize:11,color:"#64748b",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10}}>Team Coverage</div>
          <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:14,padding:"4px 0",overflow:"hidden"}}>
            {members.map((m,i)=>{
              const s=statusMap[m.status];
              return(
                <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderBottom:i<members.length-1?"1px solid rgba(255,255,255,0.05)":"none",background:"transparent",transition:"background 0.15s"}}>
                  <div style={{width:9,height:9,borderRadius:"50%",background:s.dot,flexShrink:0,boxShadow:m.status==="on"?`0 0 6px ${s.dot}80`:"none"}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:700,color:"#dde8f4"}}>{m.name}</div>
                    <div style={{fontSize:11,color:"#3d5268"}}>{m.role}</div>
                  </div>
                  <div style={{fontSize:11,fontWeight:600,color:s.color,background:s.bg,padding:"4px 12px",borderRadius:8,flexShrink:0}}>{s.label}</div>
                  {isWide && m.status !== "off" && (
                    <div style={{display:"flex",gap:6,flexShrink:0}}>
                      <div style={{padding:"5px 10px",borderRadius:8,background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.2)",fontSize:11,fontWeight:700,color:"#a78bfa",cursor:"pointer"}}>Message</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile: pending requests */}
      {!isWide && (
        <div>
          <div style={{fontSize:11,color:"#64748b",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10}}>Incoming Requests</div>
          <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:14,padding:"20px",textAlign:"center"}}>
            <div style={{fontSize:13,color:"#2d4a66"}}>No active requests</div>
            <div style={{fontSize:11,color:"#1e3a52",marginTop:4}}>You'll be notified when someone reaches out</div>
          </div>
        </div>
      )}

    </ScreenSingle>
  );
}

// 
// WELLNESS TREND DASHBOARD
// 
