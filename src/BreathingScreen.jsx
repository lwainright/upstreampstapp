// ============================================================
// SCREEN: BreathingScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { AppHeader, Screen, ScreenSingle, Btn, Card, SLabel, DragList, NavBtn, DesktopWrap, HomeTile, ToolCard } from '../ui.jsx';
import { BoltIcon, ClockIcon, BreathIcon, HeartIcon, GaugeIcon, HomeIcon, InfoIcon, MapIcon, UserIcon, ToolsIcon, GroundIcon, JournalIcon, ResetIcon, LockIcon, BuildingIcon, TimerIcon, SettingsIcon, ShieldIcon } from '../icons.jsx';
import { trackCheckin, trackTool, trackAISession, trackPSTContact, AW_ENDPOINT, AW_PROJECT, AW_DB } from '../analytics.js';
import { useLayoutConfig, getContractStatus, getCodeStatus, getContractBanner, detectSpiritual, detectLevel } from '../utils.js';

export default function BreathingScreen({navigate,agency}){
  const steps=[{label:"Inhale",duration:4,color:"#38bdf8"},{label:"Hold",duration:4,color:"#a78bfa"},{label:"Exhale",duration:4,color:"#22c55e"},{label:"Hold",duration:4,color:"#eab308"}];
  const instruct=["Breathe in slowly through your nose","Hold gently","Breathe out slowly through your mouth","Hold and relax"];
  const[active,setActive]=useState(false);
  const[si,setSi]=useState(0);
  const[cd,setCd]=useState(4);
  const[cycles,setCycles]=useState(0);
  const lc=useLayoutConfig();
  const circleSize=lc.isDesktop?220:lc.isTablet?200:180;
  const innerSize=circleSize-40;
  const r=circleSize/2-20;
  useEffect(()=>{
    if(!active)return;
    if(cd===0){const n=(si+1)%4;setSi(n);setCd(steps[n].duration);if(n===0)setCycles(c=>c+1);return;}
    const t=setTimeout(()=>setCd(c=>c-1),1000);return()=>clearTimeout(t);
  },[active,cd,si]);
  const cur=steps[si];
  const prog=active?(steps[si].duration-cd)/steps[si].duration:0;
  return(
    <ScreenSingle headerProps={{onBack:()=>navigate("tools"),title:"Box Breathing",agencyName:(agency&&agency.name)}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:22,paddingTop:10}}>
        <div style={{position:"relative",width:circleSize,height:circleSize,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width={circleSize} height={circleSize} style={{position:"absolute",transform:"rotate(-90deg)"}}>
            <circle cx={circleSize/2} cy={circleSize/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6"/>
            <circle cx={circleSize/2} cy={circleSize/2} r={r} fill="none" stroke={cur.color} strokeWidth="6" strokeDasharray={`${2*Math.PI*r}`} strokeDashoffset={`${2*Math.PI*r*(1-prog)}`} strokeLinecap="round" style={{transition:"stroke-dashoffset 1s linear,stroke 0.3s"}}/>
          </svg>
          <div style={{width:innerSize,height:innerSize,borderRadius:"50%",background:`radial-gradient(circle,${cur.color}18 0%,transparent 70%)`,border:`2px solid ${cur.color}30`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4}}>
            <div style={{fontSize:lc.isDesktop?40:32,fontWeight:900,color:cur.color}}>{active?cd:">"}</div>
            <div style={{fontSize:lc.isDesktop?16:14,fontWeight:700,color:cur.color}}>{cur.label}</div>
            {cycles>0&&<div style={{fontSize:10,color:"#2d4a66"}}>Cycle {cycles}</div>}
          </div>
        </div>
        <div style={{textAlign:"center"}}><div style={{fontSize:15,color:"#c8dae8",fontWeight:600}}>{instruct[si]}</div><div style={{fontSize:12,color:"#2d4a66",marginTop:4}}>Box Breathing . 4-4-4-4</div></div>
        <div style={{display:"flex",gap:8}}>{steps.map((s,i)=><div key={i} style={{background:i===si&&active?s.color+"30":"rgba(255,255,255,0.04)",border:`1px solid ${i===si&&active?s.color+"60":"rgba(255,255,255,0.07)"}`,borderRadius:8,padding:"6px 10px",fontSize:11,color:i===si&&active?s.color:"#2d4a66",fontWeight:i===si?700:400,transition:"all 0.3s"}}>{s.label}</div>)}</div>
        <Btn color={active?"#f87171":"#38bdf8"} bg={active?"rgba(239,68,68,0.1)":"rgba(56,189,248,0.1)"} onClick={()=>{setActive(!active);if(!active){setSi(0);setCd(4);setCycles(0);}}} style={{padding:"14px 40px"}}>{active?"Stop":"Start Breathing"}</Btn>
        {cycles>=3&&<Card style={{background:"rgba(34,197,94,0.08)",borderColor:"rgba(34,197,94,0.2)",textAlign:"center"}}><div style={{fontSize:14,fontWeight:700,color:"#22c55e",marginBottom:4}}>3 cycles complete 🌊</div><div style={{fontSize:12,color:"#2d4a66"}}>Your nervous system is resetting.</div></Card>}
      </div>
    </ScreenSingle>
  );
}

// 
// GROUNDING
// 

