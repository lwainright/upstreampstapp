// ============================================================
// SCREEN: JournalScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { AppHeader, Screen, ScreenSingle, Btn, Card, SLabel, DragList, NavBtn, DesktopWrap, HomeTile, ToolCard } from '../ui.jsx';
import { BoltIcon, ClockIcon, BreathIcon, HeartIcon, GaugeIcon, HomeIcon, InfoIcon, MapIcon, UserIcon, ToolsIcon, GroundIcon, JournalIcon, ResetIcon, LockIcon, BuildingIcon, TimerIcon, SettingsIcon, ShieldIcon } from '../icons.jsx';
import { trackCheckin, trackTool, trackAISession, trackPSTContact, AW_ENDPOINT, AW_PROJECT, AW_DB } from '../analytics.js';
import { useLayoutConfig, getContractStatus, getCodeStatus, getContractBanner, detectSpiritual, detectLevel } from '../utils.js';

export default function JournalScreen({navigate,agency}){
  const prompts=["What's one thing from today's shift that stuck with you?","How are you carrying the weight of the job right now?","What would you tell a partner going through what you're going through?","If you could put today in a sentence, what would it be?","What do you need to let go of before you go home?","What's one small thing that helped today, even a little?","What does your body feel like right now?"];
  const[mode,setMode]=useState("text");
  const[entry,setEntry]=useState("");
  const[prompt,setPrompt]=useState(()=>prompts[Math.floor(Math.random()*prompts.length)]);
  const[saved,setSaved]=useState(false);
  const[entries,setEntries]=useState(()=>{try{const s=localStorage.getItem("upstream_journal");return s?JSON.parse(s):[];}catch(e){return [];}});
  const[isListening,setIsListening]=useState(false);
  const[isAnonymous,setIsAnonymous]=useState(false);
  const[entryType,setEntryType]=useState("normal");
  const[isCrisis,setIsCrisis]=useState(false);
  const[ephemeral,setEphemeral]=useState(false);
  const[showExport,setShowExport]=useState(false);
  const[showCrisisVault,setShowCrisisVault]=useState(false);
  const[crisisUnlocked,setCrisisUnlocked]=useState(false);
  const[exportOptions,setExportOptions]=useState({includeAnonymous:true,includeRoughCall:true,includeDates:true});
  const recognitionRef=useRef(null);
  const lc=useLayoutConfig();
  const startVoice=()=>{
    if(!("webkitSpeechRecognition" in window||"SpeechRecognition" in window)){alert("Voice not supported. Try Chrome.");return;}
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    const r=new SR();r.continuous=true;r.interimResults=true;r.lang="en-US";
    r.onresult=(e)=>{setEntry(Array.from(e.results).map(r=>r[0].transcript).join(" "));};
    r.onend=()=>setIsListening(false);
    r.start();recognitionRef.current=r;setIsListening(true);
  };
  const stopVoice=()=>{recognitionRef.current&&recognitionRef.current.stop();setIsListening(false);};
  const formatEntries=()=>{
    return entries.filter(e=>exportOptions.includeAnonymous||!e.anonymous).filter(e=>exportOptions.includeRoughCall||e.type!=="rough_call").map(e=>{
      let text="";
      if(exportOptions.includeDates)text+=`${e.date}\n`;
      if(e.anonymous)text+="[Anonymous]\n";
      if(e.type==="rough_call")text+="[After Rough Call]\n";
      text+=`${e.text}\n\n`;
      return text;
    }).join("---\n\n");
  };
  const[exportPassword,setExportPassword]=useState("");
  const[showPasswordInput,setShowPasswordInput]=useState(false);
  const[pendingExportType,setPendingExportType]=useState(null);

  const exportViaEmail=()=>{
    const body=formatEntries();
    window.location.href=`mailto:?subject=My Journal&body=${encodeURIComponent(body)}`;
    setShowExport(false);
  };
  const exportViaText=()=>{
    const body=formatEntries();
    if(body.length>1600){alert("Journal is too long for text. Try email or download instead.");return;}
    window.location.href=`sms:?&body=${encodeURIComponent(body)}`;
    setShowExport(false);
  };
  const exportAsFile=()=>{
    const text=formatEntries();
    const blob=new Blob([text],{type:"text/plain"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download=`journal_${Date.now()}.txt`;a.click();
    URL.revokeObjectURL(url);setShowExport(false);
  };
  const exportAsPDF=()=>{
    const text=formatEntries();
    const date=new Date().toLocaleDateString();
    const safeText=text.replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const html="<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>My Journal</title><style>body{font-family:Georgia,serif;max-width:680px;margin:40px auto;padding:0 20px;color:#1a1a2e;line-height:1.8;}h1{font-size:22px;color:#0ea5e9;border-bottom:2px solid #0ea5e9;padding-bottom:8px;}h2{font-size:13px;color:#64748b;font-weight:normal;margin-bottom:32px;}pre{white-space:pre-wrap;font-family:Georgia,serif;font-size:14px;}footer{margin-top:40px;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px;}</style></head><body><h1>My Journal</h1><h2>Exported "+date+" - Private and Confidential</h2><pre>"+safeText+"</pre><footer>Exported from Upstream - Free. Confidential. You earned the right to ask for help.</footer></body></html>";
    const blob=new Blob([html],{type:"text/html"});
    const url=URL.createObjectURL(blob);
    const w=window.open(url,'_blank');
    if(w){setTimeout(()=>{w.print();},800);}
    else{const a=document.createElement("a");a.href=url;a.download=`journal_${Date.now()}.html`;a.click();}
    URL.revokeObjectURL(url);setShowExport(false);
  };
  const requestPasswordExport=(type)=>{
    setPendingExportType(type);setShowPasswordInput(true);setExportPassword("");
  };
  const confirmPasswordExport=()=>{
    if(!exportPassword.trim()){return;}
    const text=formatEntries();
    // Simple XOR obfuscation - not true encryption but prevents casual reading
    const key=exportPassword;
    const encoded=btoa(text.split('').map((c,i)=>String.fromCharCode(c.charCodeAt(0)^key.charCodeAt(i%key.length))).join(''));
    const blob=new Blob([`UPSTREAM_PROTECTED
${encoded}`],{type:"text/plain"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download=`journal_protected_${Date.now()}.txt`;a.click();
    URL.revokeObjectURL(url);
    setShowPasswordInput(false);setPendingExportType(null);setExportPassword("");setShowExport(false);
  };
  const saveToStorage=(updated)=>{try{localStorage.setItem("upstream_journal",JSON.stringify(updated));}catch(e){}};
  const save=()=>{
    if(!entry.trim())return;
    const newEntry={text:entry,mode,date:new Date().toLocaleString(),prompt,anonymous:isAnonymous,type:entryType,ephemeral:ephemeral,crisis:isCrisis};
    if(!ephemeral){setEntries(prev=>{const updated=[newEntry,...prev];saveToStorage(updated);return updated;});}
    setEntry("");setSaved(true);setTimeout(()=>setSaved(false),3000);
    setPrompt(prompts[Math.floor(Math.random()*prompts.length)]);
    setIsAnonymous(false);setEntryType("normal");setIsCrisis(false);setEphemeral(false);
  };
  const visibleEntries=entries.filter(e=>!e.crisis);
  const crisisEntries=entries.filter(e=>e.crisis);
  return(
    <ScreenSingle headerProps={{onBack:()=>navigate("tools"),title:"Journal",agencyName:(agency&&agency.name)}}>
      <div style={{display:"flex",gap:8,background:"rgba(255,255,255,0.03)",borderRadius:12,padding:4}}>
        {["text","voice"].map(m=>(<div key={m} onClick={()=>setMode(m)} style={{flex:1,textAlign:"center",padding:"9px",borderRadius:9,background:mode===m?"rgba(167,139,250,0.15)":"transparent",border:`1px solid ${mode===m?"rgba(167,139,250,0.3)":"transparent"}`,cursor:"pointer",fontSize:12,fontWeight:mode===m?700:400,color:mode===m?"#a78bfa":"#3d5268",transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          {m==="text"?<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
          {m==="text"?"Write":"Voice"}
        </div>))}
      </div>
      <div style={{background:"rgba(167,139,250,0.07)",border:"1px solid rgba(167,139,250,0.18)",borderRadius:14,padding:"14px 16px"}}>
        <div style={{fontSize:11,color:"#a78bfa",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6}}>Today's Prompt</div>
        <div style={{fontSize:13,color:"#c4b5fd",lineHeight:1.7,fontStyle:"italic"}}>{prompt}</div>
        <div onClick={()=>setPrompt(prompts[Math.floor(Math.random()*prompts.length)])} style={{fontSize:11,color:"#6d4fa8",marginTop:8,cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>New prompt</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div onClick={()=>setIsAnonymous(!isAnonymous)} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"12px 14px",background:isAnonymous?"rgba(56,189,248,0.06)":"rgba(255,255,255,0.02)",border:`1.5px solid ${isAnonymous?"rgba(56,189,248,0.2)":"rgba(255,255,255,0.05)"}`,borderRadius:12,transition:"all 0.2s"}}>
          <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${isAnonymous?"#38bdf8":"#2d4a66"}`,background:isAnonymous?"#38bdf8":"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
            {isAnonymous&&<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0b1829" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600,color:isAnonymous?"#38bdf8":"#dde8f4"}}>Write Anonymously</div>
            <div style={{fontSize:11,color:"#3d5268",marginTop:2}}>No identity attached to this entry</div>
          </div>
        </div>
        <div style={{display:"flex",gap:10}}>
          {["normal","rough_call"].map(t=>(<div key={t} onClick={()=>setEntryType(t)} style={{flex:1,textAlign:"center",padding:"10px",borderRadius:10,background:entryType===t?"rgba(239,68,68,0.1)":"rgba(255,255,255,0.02)",border:`1.5px solid ${entryType===t?"rgba(239,68,68,0.25)":"rgba(255,255,255,0.05)"}`,cursor:"pointer",fontSize:12,fontWeight:entryType===t?700:500,color:entryType===t?"#f87171":"#3d5268",transition:"all 0.2s"}}>
            {t==="normal"?"Normal Entry":"After Rough Call"}
          </div>))}
        </div>
        {/* Crisis Mode toggle */}
        <div onClick={()=>setIsCrisis(!isCrisis)} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"12px 14px",background:isCrisis?"rgba(239,68,68,0.07)":"rgba(255,255,255,0.02)",border:`1.5px solid ${isCrisis?"rgba(239,68,68,0.25)":"rgba(255,255,255,0.05)"}`,borderRadius:12,transition:"all 0.2s"}}>
          <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${isCrisis?"#ef4444":"#2d4a66"}`,background:isCrisis?"#ef4444":"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
            {isCrisis&&<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0b1829" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600,color:isCrisis?"#f87171":"#dde8f4"}}>Crisis Mode - Hide This Entry</div>
            <div style={{fontSize:11,color:"#3d5268",marginTop:2}}>Saved but hidden. View only when grounded, behind a locked vault.</div>
          </div>
        </div>
        {/* Crisis vault button */}
        {crisisEntries.length>0&&(
          <div onClick={()=>setShowCrisisVault(!showCrisisVault)} style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.18)",borderRadius:12,padding:"10px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:16}}>🔒</div>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:700,color:"#f87171"}}>{crisisEntries.length} Crisis Mode {crisisEntries.length===1?"Entry":"Entries"}</div>
              <div style={{fontSize:11,color:"#3d5268"}}>View when grounded - tap to unlock</div>
            </div>
            <div style={{fontSize:11,color:"#ef4444",fontWeight:700}}>{showCrisisVault?"Hide":"View"}</div>
          </div>
        )}
        {showCrisisVault&&crisisEntries.length>0&&(
          !crisisUnlocked?(
            <div style={{background:"rgba(239,68,68,0.06)",border:"1.5px solid rgba(239,68,68,0.2)",borderRadius:14,padding:"20px",textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:12}}>🔒</div>
              <div style={{fontSize:15,fontWeight:800,color:"#f87171",marginBottom:8}}>Are you grounded right now?</div>
              <div style={{fontSize:13,color:"#3d5268",lineHeight:1.7,marginBottom:16}}>These entries were written during a difficult moment. Only open them when you feel steady.</div>
              <div style={{display:"flex",gap:10}}>
                <div onClick={()=>setShowCrisisVault(false)} style={{flex:1,padding:"12px",borderRadius:11,cursor:"pointer",textAlign:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",fontSize:13,fontWeight:700,color:"#475569"}}>Not yet</div>
                <div onClick={()=>setCrisisUnlocked(true)} style={{flex:2,padding:"12px",borderRadius:11,cursor:"pointer",textAlign:"center",background:"rgba(239,68,68,0.1)",border:"1.5px solid rgba(239,68,68,0.25)",fontSize:13,fontWeight:700,color:"#f87171"}}>Yes, I'm grounded</div>
              </div>
            </div>
          ):(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{fontSize:11,color:"#ef4444",fontWeight:700}}>Crisis Entries - Unlocked</div>
                <div onClick={()=>(setShowCrisisVault(false),setCrisisUnlocked(false))} style={{fontSize:11,color:"#334155",cursor:"pointer"}}>Lock again</div>
              </div>
              {crisisEntries.map((e,i)=>(<div key={i} style={{background:"rgba(239,68,68,0.04)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:12,padding:"12px 14px",marginBottom:8}}><div style={{fontSize:10,color:"#ef4444",marginBottom:4}}>{e.date}</div><div style={{fontSize:12,color:"#8099b0",lineHeight:1.5}}>{e.text}</div></div>))}
            </div>
          )
        )}
        <div onClick={()=>setEphemeral(!ephemeral)} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"12px 14px",background:ephemeral?"rgba(234,179,8,0.06)":"rgba(255,255,255,0.02)",border:`1.5px solid ${ephemeral?"rgba(234,179,8,0.2)":"rgba(255,255,255,0.05)"}`,borderRadius:12,transition:"all 0.2s"}}>
          <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${ephemeral?"#eab308":"#2d4a66"}`,background:ephemeral?"#eab308":"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
            {ephemeral&&<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0b1829" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600,color:ephemeral?"#eab308":"#dde8f4"}}>Don't Save This</div>
            <div style={{fontSize:11,color:"#3d5268",marginTop:2}}>Temporary - helps process in the moment</div>
          </div>
        </div>
      </div>
      {mode==="text"?(
        <textarea value={entry} onChange={e=>setEntry(e.target.value)} placeholder="Write freely - this stays on your device only..." rows={lc.isDesktop?10:6} style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"14px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",width:"100%",lineHeight:1.7}}/>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {entry&&<div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"14px",fontSize:13,color:"#c8dae8",lineHeight:1.7,minHeight:80}}>{entry}</div>}
          <div onClick={isListening?stopVoice:startVoice} style={{height:56,borderRadius:14,background:isListening?"rgba(239,68,68,0.12)":"rgba(167,139,250,0.12)",border:`1.5px solid ${isListening?"rgba(239,68,68,0.35)":"rgba(167,139,250,0.3)"}`,display:"flex",alignItems:"center",justifyContent:"center",gap:12,cursor:"pointer",color:isListening?"#f87171":"#a78bfa",fontWeight:700,fontSize:14}}>
            {isListening?(<><div style={{display:"flex",gap:3}}>{[1,2,3,4,5].map(i=><div key={i} style={{width:3,background:"#f87171",borderRadius:2,height:6+i*4}}/>)}</div>Recording - tap to stop</>):(<><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>Start Voice Entry</>)}
          </div>
        </div>
      )}
      <div style={{display:"flex",gap:10}}>
        {entry&&<Btn color="#a78bfa" bg="rgba(167,139,250,0.12)" onClick={save} style={{flex:1}}>{saved?"v Saved":"Save Entry"}</Btn>}
        {entry&&<Btn color="#2d4a66" bg="rgba(255,255,255,0.03)" onClick={()=>setEntry("")} style={{flex:0,padding:"14px 16px"}}>Clear</Btn>}
      </div>
      <div style={{fontSize:10,color:"#1e3a52",textAlign:"center",letterSpacing:"0.06em"}}>ENTRIES ON YOUR DEVICE ONLY . NEVER SHARED</div>
      {visibleEntries.length>0&&(<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <SLabel color="#a78bfa">Recent Entries ({visibleEntries.length})</SLabel>
          <div onClick={()=>setShowExport(true)} style={{fontSize:12,color:"#38bdf8",fontWeight:700,cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>Export Journal</div>
        </div>
        {visibleEntries.slice(0,3).map((e,i)=>(<Card key={i} style={{padding:"12px 14px",background:e.type==="rough_call"?"rgba(239,68,68,0.04)":"rgba(255,255,255,0.033)",borderColor:e.type==="rough_call"?"rgba(239,68,68,0.15)":"rgba(255,255,255,0.065)"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6,flexWrap:"wrap",gap:6}}><div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{fontSize:10,color:"#a78bfa",fontWeight:700}}>{e.mode==="voice"?"Voice":"Text"}</span>{e.anonymous&&<span style={{fontSize:10,color:"#38bdf8",fontWeight:700,background:"rgba(56,189,248,0.12)",padding:"2px 8px",borderRadius:6}}>Anonymous</span>}{e.type==="rough_call"&&<span style={{fontSize:10,color:"#f87171",fontWeight:700,background:"rgba(239,68,68,0.12)",padding:"2px 8px",borderRadius:6}}>Rough Call</span>}</div><span style={{fontSize:10,color:"#1e3a52"}}>{e.date}</span></div><div style={{fontSize:12,color:"#8099b0",lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{e.text}</div></Card>))}
      </>)}
      {showExport&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:20}} onClick={()=>setShowExport(false)}>
          <div style={{background:"#0b1829",border:"1.5px solid rgba(255,255,255,0.1)",borderRadius:20,padding:"24px",maxWidth:420,width:"100%",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:17,fontWeight:800,color:"#dde8f4",marginBottom:6}}>Export Journal</div>
            <div style={{fontSize:12,color:"#475569",marginBottom:16,lineHeight:1.6}}>Your entries stay on your device. Exported only when you choose.</div>

            {/* Export type buttons */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
              {[
                {label:"Email",color:"#38bdf8",fn:exportViaEmail,icon:"M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7-10-7"},
                {label:"Text",color:"#22c55e",fn:exportViaText,icon:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"},
                {label:"Text File",color:"#eab308",fn:exportAsFile,icon:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3"},
                {label:"PDF / Print",color:"#a78bfa",fn:exportAsPDF,icon:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8"},
              ].map((btn,i)=>(
                <div key={i} onClick={btn.fn} style={{padding:"14px 10px",borderRadius:13,cursor:"pointer",textAlign:"center",background:`rgba(${btn.color==="#38bdf8"?"56,189,248":btn.color==="#22c55e"?"34,197,94":btn.color==="#eab308"?"234,179,8":"167,139,250"},0.1)`,border:`1.5px solid ${btn.color}30`,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={btn.color} strokeWidth="2">{btn.icon.split(" M").map((d,j)=><path key={j} d={(j===0?d:"M"+d)}/>)}</svg>
                  <div style={{fontSize:12,fontWeight:700,color:btn.color}}>{btn.label}</div>
                </div>
              ))}
            </div>

            {/* Password protected export */}
            <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:13,padding:"14px",marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:700,color:"#64748b",marginBottom:10}}>Password Protected Export</div>
              {showPasswordInput?(
                <div>
                  <div style={{fontSize:12,color:"#8099b0",marginBottom:8}}>Set a password. You will need it to open this file.</div>
                  <input value={exportPassword} onChange={e=>setExportPassword(e.target.value)} type="password" placeholder="Enter password" style={{background:"rgba(255,255,255,0.05)",border:"1.5px solid rgba(56,189,248,0.2)",borderRadius:10,padding:"10px 13px",fontSize:13,outline:"none",width:"100%",color:"#dde8f4",fontFamily:"'DM Sans',sans-serif",marginBottom:10}}/>
                  <div style={{display:"flex",gap:8}}>
                    <div onClick={()=>(setShowPasswordInput(false),setExportPassword(""))} style={{flex:1,padding:"10px",borderRadius:10,cursor:"pointer",textAlign:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",fontSize:12,fontWeight:700,color:"#475569"}}>Cancel</div>
                    <div onClick={confirmPasswordExport} style={{flex:2,padding:"10px",borderRadius:10,cursor:"pointer",textAlign:"center",background:"rgba(56,189,248,0.1)",border:"1.5px solid rgba(56,189,248,0.25)",fontSize:12,fontWeight:700,color:"#38bdf8"}}>Export Protected File</div>
                  </div>
                </div>
              ):(
                <div onClick={()=>requestPasswordExport("file")} style={{padding:"11px",borderRadius:10,cursor:"pointer",textAlign:"center",background:"rgba(255,255,255,0.02)",border:"1.5px dashed rgba(255,255,255,0.1)",fontSize:12,fontWeight:700,color:"#475569",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Export with password protection
                </div>
              )}
            </div>

            {/* Include options */}
            <div style={{background:"rgba(255,255,255,0.02)",borderRadius:13,padding:"14px",marginBottom:16}}>
              <div style={{fontSize:12,color:"#64748b",fontWeight:700,marginBottom:10}}>Include in Export:</div>
              {[
                {key:"includeAnonymous",label:"Anonymous entries"},
                {key:"includeRoughCall",label:"After Rough Call entries"},
                {key:"includeDates",label:"Dates and timestamps"},
              ].map(opt=>(
                <div key={opt.key} onClick={()=>setExportOptions(prev=>({...prev,[opt.key]:!prev[opt.key]}))} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,cursor:"pointer"}}>
                  <div style={{width:18,height:18,borderRadius:5,border:`2px solid ${exportOptions[opt.key]?"#38bdf8":"#2d4a66"}`,background:exportOptions[opt.key]?"#38bdf8":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {exportOptions[opt.key]&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0b1829" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <span style={{fontSize:13,color:"#c8dae8"}}>{opt.label}</span>
                </div>
              ))}
            </div>

            <div style={{fontSize:10,color:"#334155",textAlign:"center",marginBottom:12}}>Never uploaded. Never shared unless you choose to.</div>
            <div onClick={()=>(setShowExport(false),setShowPasswordInput(false))} style={{padding:"13px",borderRadius:12,cursor:"pointer",textAlign:"center",background:"rgba(100,116,139,0.08)",border:"1px solid rgba(100,116,139,0.15)",fontSize:13,fontWeight:700,color:"#475569"}}>Cancel</div>
          </div>
        </div>
      )}
    </ScreenSingle>
  );
}

// 
// AFTER-ACTION RESET
// 

