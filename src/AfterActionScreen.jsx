// ============================================================
// SCREEN: AfterActionScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { AppHeader, Screen, ScreenSingle, Btn, Card, SLabel, DragList, NavBtn, DesktopWrap, HomeTile, ToolCard } from '../components/ui.jsx';
import { useLayoutConfig } from '../utils.js';
import { BoltIcon, ClockIcon, BreathIcon, HeartIcon, GaugeIcon, HomeIcon, InfoIcon, MapIcon, UserIcon, ToolsIcon, GroundIcon, JournalIcon, ResetIcon, LockIcon, BuildingIcon, TimerIcon, SettingsIcon, ShieldIcon } from '../icons.jsx';
import { trackCheckin, trackTool, trackAISession, trackPSTContact, AW_ENDPOINT, AW_PROJECT, AW_DB } from '../analytics.js';

export default function AfterActionScreen({navigate,agency}){
  const[step,setStep]=useState(0);
  const[answers,setAnswers]=useState({impact:"",reaction:""});
  const defs=[{title:"Call Impact",subtitle:"Step 1 of 3",question:"How did this call affect you?",key:"impact",color:"#f97316"},{title:"What's Sticking",subtitle:"Step 2 of 3",question:"What part is staying with you?",key:"reaction",color:"#eab308"}];
  const lc=useLayoutConfig();
  return(
    <ScreenSingle headerProps={{onBack:()=>navigate("tools"),title:"After-Action Reset",agencyName:(agency&&agency.name)}}>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>{[0,1,2].map(i=><div key={i} style={{height:6,flex:i===step?2:1,borderRadius:3,background:i<step?"#22c55e":i===step?"#f97316":"rgba(255,255,255,0.08)",transition:"all 0.3s"}}/>)}<span style={{fontSize:11,color:"#2d4a66",marginLeft:6}}>Under 60 sec</span></div>
      {step<2?(<>
        <div style={{fontSize:11,color:defs[step].color,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase"}}>{defs[step].subtitle} . {defs[step].title}</div>
        <div style={{fontSize:lc.isDesktop?19:17,fontWeight:700,color:"#dde8f4"}}>{defs[step].question}</div>
        <textarea value={answers[defs[step].key]} onChange={e=>setAnswers(prev=>({...prev,[defs[step].key]:e.target.value}))} placeholder="Take your time..." rows={lc.isDesktop?6:4} style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"14px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",width:"100%"}}/>
        <Btn color={defs[step].color} bg={`rgba(${step===0?"249,115,22":"234,179,8"},0.1)`} onClick={()=>setStep(s=>s+1)}>Next →</Btn>
      </>):(<>
        <div style={{fontSize:15,fontWeight:700,color:"#dde8f4",textAlign:"center"}}>Step 3 . Reset</div>
        <div style={{fontSize:13,color:"#3d5268",textAlign:"center",lineHeight:1.6}}>Choose a reset tool.</div>
        <NavBtn icon={<BreathIcon/>} label="Box Breathing" sub="4-4-4-4 reset" color="#22c55e" bg="rgba(34,197,94,0.09)" onClick={()=>navigate("breathing")}/>
        <NavBtn icon={<GroundIcon/>} label="5-4-3-2-1 Grounding" sub="Sensory awareness" color="#38bdf8" bg="rgba(56,189,248,0.08)" onClick={()=>navigate("grounding")}/>
        <NavBtn icon={<HeartIcon/>} label={agency?"Contact Human PST":"Find Peer Support"} sub={agency?"Real peer support team":"Enter agency code to connect"} color="#a78bfa" bg="rgba(167,139,250,0.09)" locked={!agency} onClick={()=>agency?navigate("humanpst"):navigate("agencycode")}/>
        <div onClick={()=>{setStep(0);setAnswers({impact:"",reaction:""});navigate("home");}} style={{textAlign:"center",fontSize:12,color:"#1e3a52",cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>I'm good - back to Home</div>
      </>)}
    </ScreenSingle>
  );
}


// 
// 90-SECOND DUMP
// 

