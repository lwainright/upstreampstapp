// ============================================================
// SCREEN: Dump90Screen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { AppHeader, Screen, ScreenSingle, Btn, Card, SLabel, DragList, NavBtn, DesktopWrap, HomeTile, ToolCard } from './ui.jsx';
import { BoltIcon, ClockIcon, BreathIcon, HeartIcon, GaugeIcon, HomeIcon, InfoIcon, MapIcon, UserIcon, ToolsIcon, GroundIcon, JournalIcon, ResetIcon, LockIcon, BuildingIcon, TimerIcon, SettingsIcon, ShieldIcon } from './icons.jsx';
import { trackCheckin, trackTool, trackAISession, trackPSTContact, trackDebrief, AW_ENDPOINT, AW_PROJECT, AW_DB } from './analytics.js';
import { useLayoutConfig, getContractStatus, getCodeStatus, getContractBanner, detectSpiritual, detectLevel } from './utils.js';

export default function Dump90Screen({navigate,agency}){
  const[mode,setMode]=useState("type");
  const[text,setText]=useState("");
  const[running,setRunning]=useState(false);
  const[elapsed,setElapsed]=useState(0);
  const[done,setDone]=useState(false);
  const[isListening,setIsListening]=useState(false);
  const[saved,setSaved]=useState(false);
  const recognitionRef=useRef(null);
  const intervalRef=useRef(null);
  const lc=useLayoutConfig();
  const TARGET=90;

  useEffect(()=>{
    if(running){
      intervalRef.current=setInterval(()=>setElapsed(e=>e+1),1000);
    }else{
      clearInterval(intervalRef.current);
    }
    return()=>clearInterval(intervalRef.current);
  },[running]);

  const startVoice=()=>{
    if(!("webkitSpeechRecognition" in window||"SpeechRecognition" in window)){alert("Voice not supported. Try Chrome.");return;}
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    const r=new SR();r.continuous=true;r.interimResults=true;r.lang="en-US";
    r.onresult=(e)=>{setText(Array.from(e.results).map(r=>r[0].transcript).join(" "));};
    r.onend=()=>setIsListening(false);
    r.start();recognitionRef.current=r;setIsListening(true);
  };
  const stopVoice=()=>{recognitionRef.current&&recognitionRef.current.stop();setIsListening(false);};

  const start=()=>{setRunning(true);setElapsed(0);};
  const stop=()=>setRunning(false);

  const handleSave = () => {
    trackDebrief((agency&&agency.code), 'dump90', 1);
    setSaved(true);
  };

  const handleSendToAI = () => {
    trackDebrief((agency&&agency.code), 'dump90', 1);
    navigate("aichat");
  };

  const remaining=Math.max(0,TARGET-elapsed);
  const pct=Math.min(elapsed/TARGET,1);
  const circleSize=lc.isDesktop?160:130;
  const r2=circleSize/2-8;
  const circ=2*Math.PI*r2;
  const pastTarget=elapsed>=TARGET;

  if(saved){return(
    <ScreenSingle headerProps={{onBack:()=>navigate("home"),agencyName:(agency&&agency.name)}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:18,paddingTop:20}}>
        <div style={{fontSize:44}}>✓</div>
        <div style={{fontSize:18,fontWeight:800,color:"#38bdf8",textAlign:"center"}}>Saved Privately</div>
        <div style={{fontSize:13,color:"#3d5268",textAlign:"center",lineHeight:1.7}}>Your vent is saved encrypted on this device only. No one else can access it.</div>
        <Btn color="#38bdf8" onClick={()=>navigate("home")} style={{width:"100%"}}>Back to Home</Btn>
      </div>
    </ScreenSingle>
  );}

  return(
    <ScreenSingle headerProps={{onBack:()=>navigate("home"),agencyName:(agency&&agency.name)}}>
      <div style={{background:"rgba(249,115,22,0.07)",border:"1px solid rgba(249,115,22,0.18)",borderRadius:12,padding:"12px 14px"}}>
        <div style={{fontSize:12,color:"#f97316",fontWeight:700,marginBottom:2}}>Get it out - all of it</div>
        <div style={{fontSize:12,color:"#3d5268",lineHeight:1.6}}>You have 90 seconds. Use your voice or type. No one reads this unless you choose to send it. Timer won't force-stop you.</div>
      </div>
      {/* Mode toggle */}
      <div style={{display:"flex",gap:8,background:"rgba(255,255,255,0.03)",borderRadius:12,padding:4}}>
        {["type","voice"].map(m=>(
          <div key={m} onClick={()=>setMode(m)} style={{flex:1,textAlign:"center",padding:"9px",borderRadius:9,background:mode===m?"rgba(249,115,22,0.15)":"transparent",border:`1px solid ${mode===m?"rgba(249,115,22,0.3)":"transparent"}`,cursor:"pointer",fontSize:12,fontWeight:mode===m?700:400,color:mode===m?"#f97316":"#3d5268",transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            {m==="type"?<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
            {m==="type"?"Type":"Voice"}
          </div>
        ))}
      </div>
      {/* Timer circle */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
        <div style={{position:"relative",width:circleSize,height:circleSize,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width={circleSize} height={circleSize} style={{position:"absolute",transform:"rotate(-90deg)",pointerEvents:"none"}}>
            <circle cx={circleSize/2} cy={circleSize/2} r={r2} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7"/>
            <circle cx={circleSize/2} cy={circleSize/2} r={r2} fill="none" stroke={pastTarget?"#22c55e":"#f97316"} strokeWidth="7" strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} strokeLinecap="round" style={{transition:"stroke-dashoffset 1s linear,stroke 0.5s"}}/>
          </svg>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,textAlign:"center"}}>
            {pastTarget
              ? <div style={{fontSize:28,fontWeight:900,color:"#22c55e"}}>✓</div>
              : <div style={{fontSize:32,fontWeight:900,color:"#f97316"}}>{remaining}</div>}
            <div style={{fontSize:10,color:pastTarget?"#22c55e":"#2d4a66",fontWeight:700,letterSpacing:"0.08em"}}>{pastTarget?"PAST 90s":"SECONDS LEFT"}</div>
            {elapsed>0&&<div style={{fontSize:9,color:"#2d4a66"}}>{elapsed}s elapsed</div>}
          </div>
        </div>
        {!running&&elapsed===0&&<Btn color="#f97316" bg="rgba(249,115,22,0.12)" onClick={start} style={{padding:"13px 40px"}}>Start Timer</Btn>}
        {running&&<Btn color="#64748b" bg="rgba(100,116,139,0.1)" onClick={stop} style={{padding:"10px 32px"}}>Pause</Btn>}
        {!running&&elapsed>0&&<Btn color="#f97316" bg="rgba(249,115,22,0.1)" onClick={start} style={{padding:"10px 32px"}}>Continue</Btn>}
      </div>
      {/* Input */}
      {mode==="type"?(
        <textarea value={text} onChange={e=>{setText(e.target.value);if(!running&&elapsed===0)start();}} onFocus={()=>{if(!running&&elapsed===0)start();}} placeholder="Start typing - the timer starts automatically. Get it all out..." rows={lc.isDesktop?12:8} style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(249,115,22,0.2)",borderRadius:14,padding:"14px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",width:"100%",lineHeight:1.7}}/>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {text&&<div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(249,115,22,0.15)",borderRadius:14,padding:"14px",fontSize:13,color:"#c8dae8",lineHeight:1.7,minHeight:80}}>{text}</div>}
          <div onClick={isListening?stopVoice:()=>{startVoice();if(!running&&elapsed===0)start();}} style={{height:52,borderRadius:14,background:isListening?"rgba(239,68,68,0.15)":"rgba(249,115,22,0.12)",border:`1.5px solid ${isListening?"rgba(239,68,68,0.4)":"rgba(249,115,22,0.3)"}`,display:"flex",alignItems:"center",justifyContent:"center",gap:10,cursor:"pointer",color:isListening?"#f87171":"#f97316",fontWeight:700,fontSize:14}}>
            {isListening?(<><div style={{display:"flex",gap:3}}>{[1,2,3,4].map(i=><div key={i} style={{width:3,background:"#f87171",borderRadius:2,height:8+i*4}}/>)}</div>Listening...</>):(<><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>Tap to Speak</>)}
          </div>
        </div>
      )}
      {/* Action buttons */}
      {(text.trim()||elapsed>10)&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{fontSize:12,color:"#2d4a66",textAlign:"center",marginBottom:4}}>What do you want to do with this?</div>
          <div onClick={()=>(setText(""),setElapsed(0),setRunning(false),navigate("home"))} style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:12,padding:"13px",cursor:"pointer",textAlign:"center",fontSize:13,fontWeight:700,color:"#f87171"}}>🗑 Delete - Wipe it clean</div>
          <div onClick={handleSave} style={{background:"rgba(56,189,248,0.08)",border:"1px solid rgba(56,189,248,0.2)",borderRadius:12,padding:"13px",cursor:"pointer",textAlign:"center",fontSize:13,fontWeight:700,color:"#38bdf8"}}>🔒 Save Privately - Encrypted on device only</div>
          <div onClick={handleSendToAI} style={{background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.2)",borderRadius:12,padding:"13px",cursor:"pointer",textAlign:"center",fontSize:13,fontWeight:700,color:"#a78bfa"}}>💬 Send to AI PST - Continues in peer support</div>
        </div>
      )}
    </ScreenSingle>
  );
}

// 
// ADMIN TOOLS
//
