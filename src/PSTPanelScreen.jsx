// ============================================================
// SCREEN: PSTPanelScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { AppHeader, Screen, ScreenSingle, Btn, Card, SLabel, DragList, NavBtn, DesktopWrap, HomeTile, ToolCard } from '../components/ui.jsx';
import { useLayoutConfig } from '../utils.js';
import { BoltIcon, ClockIcon, BreathIcon, HeartIcon, GaugeIcon, HomeIcon, InfoIcon, MapIcon, UserIcon, ToolsIcon, GroundIcon, JournalIcon, ResetIcon, LockIcon, BuildingIcon, TimerIcon, SettingsIcon, ShieldIcon } from '../icons.jsx';
import { trackCheckin, trackTool, trackAISession, trackPSTContact, AW_ENDPOINT, AW_PROJECT, AW_DB } from '../analytics.js';

export default function PSTPanelScreen({navigate,agency}){
  const[members,setMembers]=useState([
    {name:"J. Martinez",role:"PST Lead",status:"on"},
    {name:"A. Thompson",role:"PST Member",status:"phone"},
    {name:"C. Williams",role:"PST Member",status:"off"},
    {name:"D. Nguyen",role:"PST Member",status:"on"},
  ]);
  const[myStatus,setMyStatus]=useState("on");
  const statusMap={
    on:{label:"On Duty",color:"#22c55e",dot:"#22c55e",bg:"rgba(34,197,94,0.12)"},
    phone:{label:"Available by Phone",color:"#eab308",dot:"#eab308",bg:"rgba(234,179,8,0.1)"},
    off:{label:"Off Duty",color:"#3d5268",dot:"#1e3a52",bg:"rgba(255,255,255,0.03)"},
  };
  const lc=useLayoutConfig();
  const onCount=members.filter(m=>m.status==="on").length;
  const phoneCount=members.filter(m=>m.status==="phone").length;

  return(
    <ScreenSingle headerProps={{onBack:()=>navigate("home"),title:"PST Coverage Panel",agencyName:(agency&&agency.name)}}>
      <div style={{background:"rgba(139,92,246,0.08)",border:"1.5px solid rgba(139,92,246,0.2)",borderRadius:14,padding:"14px 16px"}}>
        <div style={{fontSize:12,color:"#a78bfa",fontWeight:700,marginBottom:4}}>🟣 PST SHIFT COVERAGE</div>
        <div style={{fontSize:13,color:"#c4b5fd",lineHeight:1.6}}>On Duty notified first . Available by Phone second . Off Duty not notified</div>
        <div style={{display:"flex",gap:16,marginTop:10}}>
          <span style={{fontSize:12,color:"#22c55e",fontWeight:700}}>🟢 {onCount} On Duty</span>
          <span style={{fontSize:12,color:"#eab308",fontWeight:700}}>🟡 {phoneCount} By Phone</span>
          <span style={{fontSize:12,color:"#3d5268",fontWeight:700}}>(o) {members.length-onCount-phoneCount} Off Duty</span>
        </div>
      </div>

      <div>
        <div style={{fontSize:11,color:"#a78bfa",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10}}>My Availability</div>
        <div style={{display:"flex",gap:8}}>
          {Object.entries(statusMap).map(([k,s])=>(
            <div key={k} onClick={()=>setMyStatus(k)} style={{flex:1,background:myStatus===k?s.bg:"rgba(255,255,255,0.03)",border:`1.5px solid ${myStatus===k?s.color+"55":"rgba(255,255,255,0.065)"}`,borderRadius:12,padding:"12px 8px",cursor:"pointer",textAlign:"center",transition:"all 0.15s"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:s.dot,margin:"0 auto 6px"}}/>
              <div style={{fontSize:11,fontWeight:700,color:myStatus===k?s.color:"#2d4a66",lineHeight:1.4}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{fontSize:11,color:"#64748b",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10}}>Team Coverage</div>
        {members.map((m,i)=>{const s=statusMap[m.status];return(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:i<members.length-1?"1px solid rgba(255,255,255,0.05)":"none"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:s.dot,flexShrink:0}}/>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"#dde8f4"}}>{m.name}</div><div style={{fontSize:11,color:"#3d5268"}}>{m.role}</div></div>
              <div style={{fontSize:11,fontWeight:600,color:s.color,background:s.bg,padding:"4px 10px",borderRadius:8}}>{s.label}</div>
            </div>
          );
        })}
      </div>
    </ScreenSingle>
  );
}

// 
// WELLNESS TREND DASHBOARD
// 

