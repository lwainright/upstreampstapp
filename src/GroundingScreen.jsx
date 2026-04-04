// ============================================================
// SCREEN: GroundingScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { AppHeader, Screen, ScreenSingle, Btn, Card, SLabel, DragList, NavBtn, DesktopWrap, HomeTile, ToolCard } from '../components/ui.jsx';
import { useLayoutConfig } from '../utils.js';
import { BoltIcon, ClockIcon, BreathIcon, HeartIcon, GaugeIcon, HomeIcon, InfoIcon, MapIcon, UserIcon, ToolsIcon, GroundIcon, JournalIcon, ResetIcon, LockIcon, BuildingIcon, TimerIcon, SettingsIcon, ShieldIcon } from '../icons.jsx';
import { trackCheckin, trackTool, trackAISession, trackPSTContact, AW_ENDPOINT, AW_PROJECT, AW_DB } from '../analytics.js';

export default function GroundingScreen({navigate,agency}){
  const steps=[{n:5,sense:"See",prompt:"Name 5 things you can see right now.",color:"#38bdf8",icon:"👁"},{n:4,sense:"Touch",prompt:"Name 4 things you can physically feel.",color:"#22c55e",icon:"[5]"},{n:3,sense:"Hear",prompt:"Name 3 things you can hear right now.",color:"#a78bfa",icon:"👂"},{n:2,sense:"Smell",prompt:"Name 2 things you can smell, or 2 you like.",color:"#eab308",icon:"👃"},{n:1,sense:"Taste",prompt:"Name 1 thing you can taste right now.",color:"#f97316",icon:"👅"}];
  const[step,setStep]=useState(0);
  const[done,setDone]=useState(false);
  const[input,setInput]=useState("");
  const[answers,setAnswers]=useState([]);
  const next=()=>{if(input.trim())setAnswers(prev=>[...prev,{step,text:input}]);setInput("");if(step>=4){setDone(true);}else{setStep(s=>s+1);}};
  const cur=steps[step];
  return(
    <ScreenSingle headerProps={{onBack:()=>navigate("tools"),title:"5-4-3-2-1 Grounding",agencyName:(agency&&agency.name)}}>
      {!done?(<>
        <div style={{display:"flex",gap:6}}>{steps.map((s,i)=><div key={i} style={{flex:1,height:6,borderRadius:3,background:i<step?"#22c55e":i===step?cur.color:"rgba(255,255,255,0.08)",transition:"all 0.3s"}}/>)}</div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,padding:"10px 0"}}>
          <div style={{width:72,height:72,borderRadius:"50%",background:`${cur.color}18`,border:`2px solid ${cur.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>{cur.icon}</div>
          <div style={{textAlign:"center"}}><div style={{fontSize:36,fontWeight:900,color:cur.color,lineHeight:1}}>{cur.n}</div><div style={{fontSize:18,fontWeight:700,color:"#dde8f4",marginTop:4}}>{cur.sense}</div></div>
          <div style={{fontSize:14,color:"#8099b0",textAlign:"center",lineHeight:1.6}}>{cur.prompt}</div>
        </div>
        <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder={`List ${cur.n} things...`} rows={3} style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"14px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",width:"100%"}}/>
        <Btn color={cur.color} bg={`${cur.color}18`} onClick={next}>{step<4?"Next →":"Complete v"}</Btn>
        <div onClick={next} style={{textAlign:"center",fontSize:12,color:"#1e3a52",cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>Skip this step</div>
      </>):(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,paddingTop:10}}>
          <div style={{fontSize:44}}>🌊</div>
          <div style={{fontSize:18,fontWeight:800,color:"#38bdf8",textAlign:"center"}}>Grounding Complete</div>
          <div style={{fontSize:13,color:"#3d5268",textAlign:"center",lineHeight:1.7}}>You just brought your nervous system back to the present moment.</div>
          {answers.length>0&&<Card style={{width:"100%"}}>{answers.map((a,i)=>(<div key={i} style={{padding:"6px 0",borderBottom:i<answers.length-1?"1px solid rgba(255,255,255,0.04)":"none"}}><span style={{fontSize:11,color:steps[a.step].color,fontWeight:700}}>{steps[a.step].sense}: </span><span style={{fontSize:12,color:"#8099b0"}}>{a.text}</span></div>))}</Card>}
          <div style={{display:"flex",gap:10,width:"100%"}}>
            <Btn color="#38bdf8" onClick={()=>(setStep(0),setDone(false),setAnswers([]),setInput(""))} style={{flex:1}}>Again</Btn>
            <Btn color="#22c55e" bg="rgba(34,197,94,0.1)" onClick={()=>navigate("tools")} style={{flex:1}}>Done</Btn>
          </div>
        </div>
      )}
    </ScreenSingle>
  );
}

// 
// JOURNAL
// 

