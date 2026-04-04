// ============================================================
// SCREEN: MasterLoginModal
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { AppHeader, Screen, ScreenSingle, Btn, Card, SLabel, DragList, NavBtn, DesktopWrap, HomeTile, ToolCard } from './ui.jsx';
import { BoltIcon, ClockIcon, BreathIcon, HeartIcon, GaugeIcon, HomeIcon, InfoIcon, MapIcon, UserIcon, ToolsIcon, GroundIcon, JournalIcon, ResetIcon, LockIcon, BuildingIcon, TimerIcon, SettingsIcon, ShieldIcon } from './icons.jsx';
import { trackCheckin, trackTool, trackAISession, trackPSTContact, AW_ENDPOINT, AW_PROJECT, AW_DB } from './analytics.js';
import { useLayoutConfig, getContractStatus, getCodeStatus, getContractBanner, detectSpiritual, detectLevel } from './utils.js';

export default function MasterLoginModal({onSuccess,onClose}){
  const[pin,setPin]=useState("");
  const[err,setErr]=useState("");
  const[shake,setShake]=useState(false);

  const handleKey=(digit)=>{
    if(pin.length>=4) return;
    const next=pin+digit;
    setPin(next);
    setErr("");
    if(next.length===4){
      if(next===MASTER_PIN){
        onSuccess();
      } else {
        setShake(true);
        setTimeout(()=>{setPin("");setShake(false);setErr("Incorrect PIN");},600);
      }
    }
  };

  const handleBack=()=>setPin(p=>p.slice(0,-1));

  const dots=[0,1,2,3].map(i=>(
    <div key={i} style={{
      width:14,height:14,borderRadius:"50%",
      background:i<pin.length?"#38bdf8":"rgba(56,189,248,0.15)",
      border:"1.5px solid rgba(56,189,248,0.4)",
      transition:"background 0.15s",
    }}/>
  ));

  const keys=["1","2","3","4","5","6","7","8","9","","0","⌫"];

  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:3000}}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:"#0b1829",border:"1.5px solid rgba(56,189,248,0.18)",
        borderRadius:24,padding:"36px 28px 28px",
        width:300,maxWidth:"90vw",
        animation:shake?"shake 0.4s":"none",
      }}>
        <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}`}</style>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:28,marginBottom:8}}>🔐</div>
          <div style={{fontSize:15,fontWeight:700,color:"#dde8f4",marginBottom:4}}>Master Access</div>
          <div style={{fontSize:12,color:"#3d5268"}}>Enter platform PIN to continue</div>
        </div>

        {/* Dots */}
        <div style={{display:"flex",justifyContent:"center",gap:14,marginBottom:28}}>
          {dots}
        </div>

        {/* Error */}
        {err&&<div style={{textAlign:"center",fontSize:12,color:"#f87171",marginBottom:16}}>{err}</div>}

        {/* Keypad */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {keys.map((k,i)=>(
            k===""?(
              <div key={i}/>
            ):(
              <div key={i} onClick={()=>k==="⌫"?handleBack():handleKey(k)}
                style={{
                  background:k==="⌫"?"rgba(239,68,68,0.1)":"rgba(255,255,255,0.05)",
                  border:`1.5px solid ${k==="⌫"?"rgba(239,68,68,0.25)":"rgba(255,255,255,0.08)"}`,
                  borderRadius:12,padding:"16px 0",
                  textAlign:"center",fontSize:k==="⌫"?18:20,
                  fontWeight:700,color:k==="⌫"?"#f87171":"#dde8f4",
                  cursor:"pointer",userSelect:"none",
                  transition:"background 0.1s",
                }}
              >{k}</div>
            )
          ))}
        </div>

        <div onClick={onClose} style={{textAlign:"center",marginTop:20,fontSize:13,color:"#334155",cursor:"pointer"}}>Cancel</div>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────


