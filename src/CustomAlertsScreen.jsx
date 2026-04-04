// ============================================================
// SCREEN: CustomAlertsScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { AppHeader, Screen, ScreenSingle, Btn, Card, SLabel, DragList, NavBtn, DesktopWrap, HomeTile, ToolCard } from './ui.jsx';
import { BoltIcon, ClockIcon, BreathIcon, HeartIcon, GaugeIcon, HomeIcon, InfoIcon, MapIcon, UserIcon, ToolsIcon, GroundIcon, JournalIcon, ResetIcon, LockIcon, BuildingIcon, TimerIcon, SettingsIcon, ShieldIcon } from './icons.jsx';
import { trackCheckin, trackTool, trackAISession, trackPSTContact, AW_ENDPOINT, AW_PROJECT, AW_DB } from './analytics.js';
import { useLayoutConfig, getContractStatus, getCodeStatus, getContractBanner, detectSpiritual, detectLevel } from './utils.js';

export default function CustomAlertsScreen({navigate,agency}){
  const[alerts,setAlerts]=useState(()=>{
    try{const s=localStorage.getItem("upstream_custom_alerts");return s?JSON.parse(s):[
      {id:"a1",enabled:false,text:"Check in with me every day during tough weeks",icon:"📅"},
      {id:"a2",enabled:false,text:"If my stress stays high for 3 days, suggest grounding tools",icon:"📊"},
      {id:"a3",enabled:false,text:"Remind me to journal if I haven't in a while",icon:"📓"},
      {id:"a4",enabled:false,text:"Prompt me to breathe before the end of each shift",icon:"🫁"},
    ];}catch(e){return [];}
  });
  const[showCustom,setShowCustom]=useState(false);
  const[customText,setCustomText]=useState("");

  const toggle=(id)=>{
    const next=alerts.map(a=>a.id===id?{...a,enabled:!a.enabled}:a);
    setAlerts(next);
    try{localStorage.setItem("upstream_custom_alerts",JSON.stringify(next));}catch(e){}
  };
  const addCustom=()=>{
    if(!customText.trim()) return;
    const next=[...alerts,{id:"a"+Date.now(),enabled:true,text:customText.trim(),icon:"🔔",custom:true}];
    setAlerts(next);
    try{localStorage.setItem("upstream_custom_alerts",JSON.stringify(next));}catch(e){}
    setCustomText("");setShowCustom(false);
  };
  const remove=(id)=>{
    const next=alerts.filter(a=>a.id!==id);
    setAlerts(next);
    try{localStorage.setItem("upstream_custom_alerts",JSON.stringify(next));}catch(e){}
  };

  return(
    <ScreenSingle headerProps={{onBack:()=>navigate("tools"),title:"Personal Alerts",agencyName:(agency&&agency.name)}}>
      <div style={{background:"rgba(56,189,248,0.06)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:12,padding:"12px 14px"}}>
        <div style={{fontSize:12,fontWeight:700,color:"#38bdf8",marginBottom:4}}>Your alerts. Your control.</div>
        <div style={{fontSize:12,color:"#3d5268",lineHeight:1.6}}>All alerts stay on your device. Nothing is shared with your agency or admin.</div>
      </div>

      <div style={{fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6}}>Suggested Alerts</div>
      {alerts.map((a)=>(
        <div key={a.id} style={{background:"rgba(255,255,255,0.025)",border:`1.5px solid ${a.enabled?"rgba(56,189,248,0.2)":"rgba(255,255,255,0.055)"}`,borderRadius:14,padding:"13px 16px",display:"flex",alignItems:"center",gap:12,marginBottom:8,transition:"all 0.2s"}}>
          <div style={{fontSize:20,flexShrink:0}}>{a.icon}</div>
          <div style={{flex:1,fontSize:13,color:a.enabled?"#dde8f4":"#64748b",lineHeight:1.5}}>{a.text}</div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            {a.custom&&<div onClick={()=>remove(a.id)} style={{fontSize:12,color:"#ef4444",cursor:"pointer",padding:"4px 8px"}}>x</div>}
            <div onClick={()=>toggle(a.id)} style={{width:44,height:24,borderRadius:12,background:a.enabled?"#38bdf8":"rgba(255,255,255,0.08)",border:`1px solid ${a.enabled?"#38bdf8":"rgba(255,255,255,0.12)"}`,position:"relative",cursor:"pointer",transition:"all 0.2s"}}>
              <div style={{position:"absolute",top:2,left:a.enabled?22:2,width:20,height:20,borderRadius:"50%",background:a.enabled?"#fff":"#475569",transition:"left 0.2s"}}/>
            </div>
          </div>
        </div>
      ))}

      {showCustom?(
        <div style={{background:"rgba(56,189,248,0.05)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:14,padding:"14px",marginTop:4}}>
          <textarea value={customText} onChange={e=>setCustomText(e.target.value)} placeholder="Write your own alert..." rows={2} style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(56,189,248,0.2)",borderRadius:10,padding:"11px 13px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",width:"100%",color:"#dde8f4",marginBottom:10}}/>
          <div style={{display:"flex",gap:8}}>
            <div onClick={()=>setShowCustom(false)} style={{flex:1,padding:"10px",borderRadius:10,cursor:"pointer",textAlign:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",fontSize:12,fontWeight:700,color:"#475569"}}>Cancel</div>
            <div onClick={addCustom} style={{flex:2,padding:"10px",borderRadius:10,cursor:"pointer",textAlign:"center",background:"rgba(56,189,248,0.12)",border:"1.5px solid rgba(56,189,248,0.3)",fontSize:12,fontWeight:700,color:"#38bdf8"}}>Add Alert</div>
          </div>
        </div>
      ):(
        <div onClick={()=>setShowCustom(true)} style={{background:"rgba(255,255,255,0.02)",border:"1.5px dashed rgba(255,255,255,0.08)",borderRadius:14,padding:"14px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,marginTop:4}}>
          <div style={{width:34,height:34,borderRadius:9,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>+</div>
          <div style={{fontSize:13,fontWeight:700,color:"#475569"}}>Create your own alert</div>
        </div>
      )}

      <div style={{fontSize:10,color:"#1e3a52",textAlign:"center",lineHeight:1.6,marginTop:8}}>Alerts are reminders only - nothing is logged or shared.</div>
    </ScreenSingle>
  );
}

// 
// EDUCATIONAL CONTENT
// 

