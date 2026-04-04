// ============================================================
// SCREEN: SplashScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { AppHeader, Screen, ScreenSingle, Btn, Card, SLabel, DragList, NavBtn, DesktopWrap, HomeTile, ToolCard } from '../components/ui.jsx';
import { useLayoutConfig } from '../utils.js';
import { BoltIcon, ClockIcon, BreathIcon, HeartIcon, GaugeIcon, HomeIcon, InfoIcon, MapIcon, UserIcon, ToolsIcon, GroundIcon, JournalIcon, ResetIcon, LockIcon, BuildingIcon, TimerIcon, SettingsIcon, ShieldIcon } from '../icons.jsx';
import { trackCheckin, trackTool, trackAISession, trackPSTContact, AW_ENDPOINT, AW_PROJECT, AW_DB } from '../analytics.js';

export default function SplashScreen({onDone,logoSrc,edition="First Responder"}){
  const[phase,setPhase]=useState("fadein");
  const[ripples,setRipples]=useState([]);
  const timerRef=useRef(null);
  const hr=new Date().getHours();
  const greeting=hr>=5&&hr<12?"Good morning":hr>=12&&hr<17?"Good afternoon":hr>=17&&hr<21?"Good evening":"You made it through today";

  useEffect(()=>{
    timerRef.current=setTimeout(()=>beginExit(),4500);
    return()=>clearTimeout(timerRef.current);
  },[]);

  const beginExit=()=>{
    clearTimeout(timerRef.current);
    if(phase==="fadeout"||phase==="done") return;
    setPhase("fadeout");
    setTimeout(()=>{setPhase("done");onDone&&onDone();},800);
  };

  const handleTap=(e)=>{
    if(phase==="fadeout"||phase==="done") return;
    const rect=e.currentTarget.getBoundingClientRect();
    const id=Date.now();
    setRipples(prev=>[...prev,{id,x:e.clientX-rect.left,y:e.clientY-rect.top}]);
    setTimeout(()=>setRipples(prev=>prev.filter(r=>r.id!==id)),600);
    setTimeout(beginExit,120);
  };

  if(phase==="done") return null;
  const fading=phase==="fadeout";

  return(
    <div onClick={handleTap} style={{position:"fixed",inset:0,background:"#060e1b",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:9999,cursor:"pointer",overflow:"hidden",opacity:fading?0:1,transition:fading?"opacity 0.8s ease":"opacity 1.2s ease",userSelect:"none"}}>
      <style>{`
        @keyframes breatheLogo{0%,100%{transform:scale(1);filter:drop-shadow(0 0 20px rgba(14,165,233,0.30))}50%{transform:scale(1.04);filter:drop-shadow(0 0 32px rgba(14,165,233,0.55))}}
        @keyframes breatheGlow{0%,100%{opacity:.7;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.15)}}
        @keyframes fadeUp{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes rippleOut{0%{width:0;height:0;opacity:.7}100%{width:220px;height:220px;opacity:0}}
        @media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important}}
      `}</style>
      {/* ambient glow */}
      <div style={{position:"absolute",top:"38%",left:"50%",width:360,height:360,borderRadius:"50%",background:"radial-gradient(ellipse,rgba(14,165,233,0.15) 0%,transparent 70%)",animation:"breatheGlow 3.5s ease-in-out infinite",pointerEvents:"none",transform:"translate(-50%,-50%)"}}/>
      {/* logo */}
      {logoSrc&&<img src={logoSrc} alt="Upstream Approach" style={{width:"68%",maxWidth:260,height:"auto",objectFit:"contain",marginBottom:36,animation:"breatheLogo 3.5s ease-in-out infinite"}}/>}
      {/* brand stack */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,animation:"fadeUp 1.4s ease forwards",opacity:0}}>
        <div style={{fontSize:22,fontWeight:700,color:"#dde8f4",letterSpacing:"-0.01em",textAlign:"center"}}>Upstream Approach</div>
        <div style={{fontSize:12,color:"#38bdf8",fontWeight:500,letterSpacing:"0.04em",opacity:.75}}>powered by Upstream Initiative</div>
        <div style={{width:80,height:1,background:"linear-gradient(90deg,transparent,rgba(56,189,248,0.4),transparent)",margin:"6px 0"}}/>
        <div style={{fontSize:13,color:"#64748b",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase"}}>{edition}</div>
      </div>
      {/* greeting */}
      <div style={{position:"absolute",bottom:80,fontSize:15,color:"#2d4a66",fontWeight:500,textAlign:"center",animation:"fadeUp 2s ease 0.6s forwards",opacity:0}}>{greeting}</div>
      {/* tap hint */}
      <div style={{position:"absolute",bottom:32,fontSize:11,color:"#1e3a52",letterSpacing:"0.1em",textTransform:"uppercase",animation:"fadeUp 2s ease 1s forwards",opacity:0}}>Tap to continue</div>
      {/* ripples */}
      {ripples.map(r=>(
        <div key={r.id} style={{position:"absolute",left:r.x,top:r.y,width:0,height:0,borderRadius:"50%",border:"1.5px solid rgba(56,189,248,0.5)",transform:"translate(-50%,-50%)",animation:"rippleOut 0.55s ease-out forwards",pointerEvents:"none"}}/>
      ))}
    </div>
  );
}

// Membership persistence helpers
// App version - bump this string any time you want to force a clean slate for all users
const APP_VERSION = "2.2.0";

// One-time migration: runs once per device per version
// Wipes any membership data that came from the old hardcoded DEMO_MEMBERSHIPS

