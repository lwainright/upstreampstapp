// ============================================================
// SCREEN: FeedbackScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { AppHeader, Screen, ScreenSingle, Btn, Card, SLabel, DragList, NavBtn, DesktopWrap, HomeTile, ToolCard } from '../ui.jsx';
import { BoltIcon, ClockIcon, BreathIcon, HeartIcon, GaugeIcon, HomeIcon, InfoIcon, MapIcon, UserIcon, ToolsIcon, GroundIcon, JournalIcon, ResetIcon, LockIcon, BuildingIcon, TimerIcon, SettingsIcon, ShieldIcon } from '../icons.jsx';
import { trackCheckin, trackTool, trackAISession, trackPSTContact, AW_ENDPOINT, AW_PROJECT, AW_DB } from '../analytics.js';
import { useLayoutConfig, getContractStatus, getCodeStatus, getContractBanner, detectSpiritual, detectLevel } from '../utils.js';

export default function FeedbackScreen({navigate,agency}){
  const[mode,setMode]=useState(null); // null=list, "quick","voice","reflection"
  const[rating,setRating]=useState(null);
  const[helpedWhat,setHelpedWhat]=useState([]);
  const[feedbackText,setFeedbackText]=useState("");
  const[submitted,setSubmitted]=useState(false);
  const[isListening,setIsListening]=useState(false);
  const recognitionRef=useRef(null);
  const lc=useLayoutConfig();

  const tools=["Box Breathing","AI Peer Support","5-4-3-2-1 Grounding","Journal","90-Second Dump","After-Action Reset","Human PST","PTSD Interruption","Resources","Shift Check-In"];
  const toggle=(t)=>setHelpedWhat(prev=>prev.includes(t)?prev.filter(x=>x!==t):[...prev,t]);

  const startVoice=()=>{
    if(!("webkitSpeechRecognition" in window||"SpeechRecognition" in window)){alert("Voice not supported. Try Chrome.");return;}
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    const r=new SR();r.continuous=true;r.interimResults=true;r.lang="en-US";
    r.onresult=(e)=>{setFeedbackText(Array.from(e.results).map(r=>r[0].transcript).join(" "));};
    r.onend=()=>setIsListening(false);
    r.start();recognitionRef.current=r;setIsListening(true);
  };
  const stopVoice=()=>{recognitionRef.current&&recognitionRef.current.stop();setIsListening(false);};

  const submit=()=>{setSubmitted(true);};

  if(submitted){return(
    <ScreenSingle headerProps={{onBack:()=>navigate("tools"),title:"Feedback",agencyName:(agency&&agency.name)}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,paddingTop:20}}>
        <div style={{fontSize:44}}>🙏</div>
        <div style={{fontSize:18,fontWeight:800,color:"#38bdf8",textAlign:"center"}}>Thank you</div>
        <div style={{fontSize:13,color:"#3d5268",textAlign:"center",lineHeight:1.7}}>Your feedback helps make this better for every responder who uses it.</div>
        <div style={{background:"rgba(56,189,248,0.06)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:12,padding:"12px 14px",width:"100%",textAlign:"center"}}>
          <div style={{fontSize:11,color:"#38bdf8",fontWeight:700}}>Anonymous. Private. Never shared without your permission.</div>
        </div>
        <div onClick={()=>(setSubmitted(false),setMode(null),setRating(null),setHelpedWhat([]),setFeedbackText(""))} style={{fontSize:13,color:"#2d4a66",cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>Submit more feedback</div>
      </div>
    </ScreenSingle>
  );}

  if(mode==="quick"){return(
    <ScreenSingle headerProps={{onBack:()=>setMode(null),title:"Quick Feedback",agencyName:(agency&&agency.name)}}>
      <div style={{fontSize:15,fontWeight:700,color:"#dde8f4",textAlign:"center",marginBottom:8}}>Did Upstream help you today?</div>
      <div style={{display:"flex",gap:10,marginBottom:20}}>
        {[{v:5,label:"Really helped",color:"#22c55e"},{v:3,label:"Somewhat",color:"#eab308"},{v:1,label:"Not much",color:"#ef4444"}].map(r=>(
          <div key={r.v} onClick={()=>setRating(r.v)} style={{flex:1,padding:"14px 8px",borderRadius:14,cursor:"pointer",textAlign:"center",background:rating===r.v?r.color+"20":"rgba(255,255,255,0.03)",border:`1.5px solid ${rating===r.v?r.color:"rgba(255,255,255,0.07)"}`,transition:"all 0.15s"}}>
            <div style={{fontSize:22,marginBottom:4}}>{r.v===5?"😌":r.v===3?"😐":"😔"}</div>
            <div style={{fontSize:11,fontWeight:700,color:rating===r.v?r.color:"#475569"}}>{r.label}</div>
          </div>
        ))}
      </div>
      {rating&&(<>
        <div style={{fontSize:13,fontWeight:700,color:"#dde8f4",marginBottom:10}}>What helped? (optional)</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
          {tools.map(t=>(
            <div key={t} onClick={()=>toggle(t)} style={{padding:"7px 12px",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:600,background:helpedWhat.includes(t)?"rgba(56,189,248,0.12)":"rgba(255,255,255,0.03)",border:`1px solid ${helpedWhat.includes(t)?"rgba(56,189,248,0.3)":"rgba(255,255,255,0.07)"}`,color:helpedWhat.includes(t)?"#38bdf8":"#475569",transition:"all 0.15s"}}>{t}</div>
          ))}
        </div>
        <textarea value={feedbackText} onChange={e=>setFeedbackText(e.target.value)} placeholder="Anything else? (optional)" rows={3} style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"12px 14px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",width:"100%",color:"#dde8f4",marginBottom:12}}/>
        <div style={{fontSize:10,color:"#334155",marginBottom:12,textAlign:"center"}}>Feedback is anonymous unless you choose to share it</div>
        <div onClick={submit} style={{padding:"14px",borderRadius:13,cursor:"pointer",textAlign:"center",background:"rgba(56,189,248,0.12)",border:"1.5px solid rgba(56,189,248,0.3)",fontSize:14,fontWeight:700,color:"#38bdf8"}}>Submit Feedback</div>
      </>)}
    </ScreenSingle>
  );}

  if(mode==="voice"){return(
    <ScreenSingle headerProps={{onBack:()=>setMode(null),title:"Voice Feedback",agencyName:(agency&&agency.name)}}>
      <div style={{fontSize:14,color:"#8099b0",lineHeight:1.6,marginBottom:12}}>Tell us what's working, what isn't, or what you wish existed. Voice or type - your call.</div>
      {feedbackText&&<div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"12px 14px",fontSize:13,color:"#c8dae8",lineHeight:1.7,minHeight:80,marginBottom:10}}>{feedbackText}</div>}
      <div onClick={isListening?stopVoice:startVoice} style={{height:54,borderRadius:14,background:isListening?"rgba(239,68,68,0.12)":"rgba(56,189,248,0.1)",border:`1.5px solid ${isListening?"rgba(239,68,68,0.35)":"rgba(56,189,248,0.25)"}`,display:"flex",alignItems:"center",justifyContent:"center",gap:10,cursor:"pointer",color:isListening?"#f87171":"#38bdf8",fontWeight:700,fontSize:14,marginBottom:10}}>
        {isListening?(<><div style={{display:"flex",gap:3}}>{[1,2,3,4].map(i=><div key={i} style={{width:3,background:"#f87171",borderRadius:2,height:8+i*4}}/>)}</div>Tap to stop</>):(<><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>Tap to speak</>)}
      </div>
      <textarea value={feedbackText} onChange={e=>setFeedbackText(e.target.value)} placeholder="Or type here..." rows={3} style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"12px 14px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",width:"100%",color:"#dde8f4",marginBottom:12}}/>
      {feedbackText&&<div onClick={submit} style={{padding:"14px",borderRadius:13,cursor:"pointer",textAlign:"center",background:"rgba(56,189,248,0.12)",border:"1.5px solid rgba(56,189,248,0.3)",fontSize:14,fontWeight:700,color:"#38bdf8"}}>Submit</div>}
    </ScreenSingle>
  );}

  return(
    <ScreenSingle headerProps={{onBack:()=>navigate("tools"),title:"Feedback",agencyName:(agency&&agency.name)}}>
      <div style={{background:"rgba(56,189,248,0.05)",border:"1px solid rgba(56,189,248,0.12)",borderRadius:12,padding:"12px 14px",marginBottom:4}}>
        <div style={{fontSize:12,color:"#38bdf8",fontWeight:700,marginBottom:2}}>Your voice matters</div>
        <div style={{fontSize:12,color:"#3d5268",lineHeight:1.6}}>Feedback is private unless you choose to share it. Agencies only see anonymous trends if you opt in.</div>
      </div>
      {[
        {key:"quick",icon:"[!]",title:"Quick Feedback",sub:"Did this help? 30 seconds",color:"#38bdf8"},
        {key:"voice",icon:"🎙",title:"Voice or Text Dump",sub:"Tell us what you really think",color:"#a78bfa"},
      ].map(o=>(
        <div key={o.key} onClick={()=>setMode(o.key)} style={{background:"rgba(255,255,255,0.025)",border:"1.5px solid rgba(255,255,255,0.065)",borderRadius:16,padding:"18px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:46,height:46,borderRadius:13,background:o.color+"18",border:`1px solid ${o.color}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{o.icon}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700,color:"#dde8f4"}}>{o.title}</div>
            <div style={{fontSize:12,color:"#8099b0",marginTop:2}}>{o.sub}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a52" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      ))}
    </ScreenSingle>
  );
}


// 
// SPLASH / WELCOME SCREEN
// 

