// ============================================================
// SCREEN: ShiftCheckScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { AppHeader, Screen, ScreenSingle, Btn, Card, SLabel, DragList, NavBtn, DesktopWrap, HomeTile, ToolCard } from './ui.jsx';
import { BoltIcon, ClockIcon, BreathIcon, HeartIcon, GaugeIcon, HomeIcon, InfoIcon, MapIcon, UserIcon, ToolsIcon, GroundIcon, JournalIcon, ResetIcon, LockIcon, BuildingIcon, TimerIcon, SettingsIcon, ShieldIcon } from './icons.jsx';
import { trackCheckin, trackTool, trackAISession, trackPSTContact, AW_ENDPOINT, AW_PROJECT, AW_DB } from './analytics.js';
import { useLayoutConfig, getContractStatus, getCodeStatus, getContractBanner, detectSpiritual, detectLevel } from './utils.js';

export default function ShiftCheckScreen({navigate,agency}){
  const[phase,setPhase]=useState(null); // null=choose, "s1","midshift","s2"
  const[selected,setSelected]=useState(null);
  const[submitted,setSubmitted]=useState(false);
  const lc=useLayoutConfig();
  const s1opts=[
    {key:"S1-G",emoji:"🟢",label:"Great",   color:"#22c55e",msg:"Great start. Keep checking in throughout your shift."},
    {key:"S1-Y",emoji:"🟡",label:"Striving",color:"#eab308",msg:"Noted. Checking in is the right move. Support is here if you need it."},
    {key:"S1-O",emoji:"🟠",label:"Not Well",color:"#f97316",msg:"Thank you for being honest. Coping tools and peer support are ready now."},
    {key:"S1-R",emoji:"🔴",label:"Ill",     color:"#ef4444",msg:"You reached out. Full support is ready for you right now."},
  ];
  const midshiftopts=[
    {key:"MID-G",emoji:"🟢",label:"Great",   color:"#22c55e",msg:"Good to hear. Keep taking care of yourself out there."},
    {key:"MID-Y",emoji:"🟡",label:"Striving",color:"#eab308",msg:"You're doing the work. Support is here if you need it."},
    {key:"MID-O",emoji:"🟠",label:"Not Well",color:"#f97316",msg:"Thanks for checking in. A quick reset might help - coping tools are here."},
    {key:"MID-R",emoji:"🔴",label:"Ill",     color:"#ef4444",msg:"You checked in. That matters. Support is ready for you right now."},
  ];
  const s2opts=[
    {key:"S2-G",emoji:"🟢",label:"Great",   color:"#22c55e",msg:"Glad to hear it. Rest up and take care of yourself."},
    {key:"S2-Y",emoji:"🟡",label:"Striving",color:"#eab308",msg:"That's real. Decompress before you get home - coping tools are here."},
    {key:"S2-O",emoji:"🟠",label:"Not Well",color:"#f97316",msg:"You made it through. Don't carry this home alone - support is right here."},
    {key:"S2-R",emoji:"🔴",label:"Ill",     color:"#ef4444",msg:"You showed up and got through it. Peer support is ready when you are."},
  ];
  const opts=phase==="s1"?s1opts:phase==="midshift"?midshiftopts:s2opts;
  const title=phase==="s1"?"Upstream Daily Shift Check":phase==="midshift"?"Midshift Check-In":"Shift Close Check";
  const prompt=phase==="s1"?"How are you starting your shift?":phase==="midshift"?"How are you doing mid-shift?":"How are you leaving this shift?";

  if(!phase){return(
    <ScreenSingle headerProps={{onBack:()=>navigate("home"),title:"Shift Check",agencyName:(agency&&agency.name)}}>
      <div style={{fontSize:lc.isDesktop?18:16,fontWeight:700,color:"#dde8f4",textAlign:"center",marginTop:8}}>Which check-in?</div>
      <div style={{display:"flex",flexDirection:"column",gap:14,marginTop:4}}>
        <div onClick={()=>setPhase("s1")} style={{background:"rgba(56,189,248,0.07)",border:"1.5px solid rgba(56,189,248,0.2)",borderRadius:16,padding:"20px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:48,height:48,borderRadius:14,background:"rgba(56,189,248,0.12)",border:"1px solid rgba(56,189,248,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🌅</div>
          <div><div style={{fontSize:15,fontWeight:800,color:"#38bdf8"}}>Start-of-Shift Check</div><div style={{fontSize:12,color:"#8099b0",marginTop:3}}>How are you starting your shift?</div></div>
        </div>
        <div onClick={()=>setPhase("midshift")} style={{background:"rgba(234,179,8,0.07)",border:"1.5px solid rgba(234,179,8,0.2)",borderRadius:16,padding:"20px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:48,height:48,borderRadius:14,background:"rgba(234,179,8,0.12)",border:"1px solid rgba(234,179,8,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>[S]️</div>
          <div><div style={{fontSize:15,fontWeight:800,color:"#eab308"}}>Midshift Check-In</div><div style={{fontSize:12,color:"#8099b0",marginTop:3}}>Quick pulse check during your shift</div></div>
        </div>
        <div onClick={()=>setPhase("s2")} style={{background:"rgba(139,92,246,0.07)",border:"1.5px solid rgba(139,92,246,0.2)",borderRadius:16,padding:"20px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:48,height:48,borderRadius:14,background:"rgba(139,92,246,0.12)",border:"1px solid rgba(139,92,246,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🌙</div>
          <div><div style={{fontSize:15,fontWeight:800,color:"#a78bfa"}}>End-of-Shift Check</div><div style={{fontSize:12,color:"#8099b0",marginTop:3}}>How are you leaving this shift?</div></div>
        </div>
      </div>
    </ScreenSingle>
  );}

  return(
    <ScreenSingle headerProps={{onBack:()=>(setPhase(null),setSelected(null),setSubmitted(false)),title,agencyName:(agency&&agency.name)}}>
      {!submitted?(<>
        <div style={{fontSize:lc.isDesktop?18:15,fontWeight:700,color:"#dde8f4",textAlign:"center"}}>{prompt}</div>
        {opts.map(o=>(<div key={o.key} onClick={()=>setSelected(o.key)} style={{background:selected===o.key?`${o.color}18`:"rgba(255,255,255,0.03)",border:`1.5px solid ${selected===o.key?o.color+"55":"rgba(255,255,255,0.065)"}`,borderRadius:14,padding:"16px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,transition:"all 0.13s"}}><span style={{fontSize:26}}>{o.emoji}</span><span style={{fontSize:15,fontWeight:700,color:selected===o.key?o.color:"#dde8f4"}}>{o.label}</span></div>))}
        {selected&&<Btn onClick={()=>{
          setSubmitted(true);
          // Track anonymous check-in to Appwrite
          const statusMap={'S1-G':'great','S1-Y':'striving','S1-O':'notwell','S1-R':'ill','MID-G':'great','MID-Y':'striving','MID-O':'notwell','MID-R':'ill','S2-G':'great','S2-Y':'striving','S2-O':'notwell','S2-R':'ill'};
          trackCheckin((agency&&agency.code), statusMap[selected]||'unknown', phase);
        }}>Submit Check-In →</Btn>}
      </>):(<>
        <Card style={{background:"rgba(56,189,248,0.07)",borderColor:"rgba(56,189,248,0.2)",textAlign:"center"}}><div style={{fontSize:22,marginBottom:8}}>v</div><div style={{fontSize:15,fontWeight:700,color:"#38bdf8",marginBottom:8}}>Check-In Recorded</div><div style={{fontSize:13,color:"#3d5268",lineHeight:1.6}}>{opts.find(o=>o.key===selected)&&(o=>o.key===selected).msg}</div></Card>
        <NavBtn icon={<BreathIcon/>} label="Quick Breathing Reset" sub="60-second grounding" color="#22c55e" bg="rgba(34,197,94,0.09)" onClick={()=>navigate("breathing")}/>
        {(selected==="S1-O"||selected==="S1-R"||selected==="S2-O"||selected==="S2-R"||selected==="MID-O"||selected==="MID-R")&&(<>
          <NavBtn icon={<BoltIcon/>} label="Talk to AI PST" sub="Anonymous peer support" color="#ef4444" bg="rgba(239,68,68,0.09)" onClick={()=>navigate("aichat")}/>
          <NavBtn icon={<HeartIcon/>} label={agency?"Contact Human PST":"Find Peer Support"} sub={agency?"Real peer support team":"Enter agency code to connect"} color="#a78bfa" bg="rgba(167,139,250,0.09)" locked={!agency} onClick={()=>agency?navigate("humanpst"):navigate("agencycode")}/>
        </>)}
        <div onClick={()=>(setPhase(null),setSelected(null),setSubmitted(false),navigate("home"))} style={{textAlign:"center",fontSize:12,color:"#1e3a52",cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>Back to Home</div>
      </>)}
    </ScreenSingle>
  );
}

// 
// COPING TOOLS HUB
// 

