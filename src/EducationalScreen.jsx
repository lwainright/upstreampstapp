// ============================================================
// SCREEN: EducationalScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { AppHeader, Screen, ScreenSingle, Btn, Card, SLabel, DragList, NavBtn, DesktopWrap, HomeTile, ToolCard } from './ui.jsx';
import { BoltIcon, ClockIcon, BreathIcon, HeartIcon, GaugeIcon, HomeIcon, InfoIcon, MapIcon, UserIcon, ToolsIcon, GroundIcon, JournalIcon, ResetIcon, LockIcon, BuildingIcon, TimerIcon, SettingsIcon, ShieldIcon } from './icons.jsx';
import { trackCheckin, trackTool, trackAISession, trackPSTContact, AW_ENDPOINT, AW_PROJECT, AW_DB } from './analytics.js';
import { useLayoutConfig, getContractStatus, getCodeStatus, getContractBanner, detectSpiritual, detectLevel } from './utils.js';

export default function EducationalScreen({navigate,agency}){
  const[selected,setSelected]=useState(null);
  const modules=[
    {id:"stress",icon:"🧠",color:"#38bdf8",title:"Stress vs. Trauma",tag:"5 min",body:[
      "Stress and trauma are different. Stress is the body's response to demands - it's normal and often manageable. Trauma is what happens when an experience overwhelms the nervous system's ability to cope.",
      "First responders experience both. High-frequency, low-severity stress accumulates over time. Critical incidents can cause acute trauma responses.",
      "Knowing the difference matters because the tools for each are different. Box breathing manages stress. EMDR processes trauma. Peer support helps both.",
      "You don't have to diagnose yourself. You just have to notice when something isn't passing on its own.",
    ]},
    {id:"sleep",icon:"😴",color:"#a78bfa",title:"Sleep & Recovery",tag:"4 min",body:[
      "Sleep deprivation is an occupational hazard in this job. Shift work disrupts circadian rhythm. Critical calls activate the nervous system at 3am. Hypervigilance makes it hard to wind down.",
      "What helps: keep your sleep space dark and cool, avoid screens 30 min before sleep, box breathing before sleep signals the body it's safe, and brief 20-minute naps are more restorative than you think.",
      "Your brain processes the day's experiences during sleep - including difficult calls. Sleep isn't a luxury. It's part of the job.",
    ]},
    {id:"family",icon:"🏠",color:"#f97316",title:"Family Impact",tag:"6 min",body:[
      "The people at home feel the weight of this job even when you don't talk about it. Hypervigilance doesn't turn off at the door. Short fuses, emotional withdrawal, and trouble being present are common - and they affect relationships.",
      "This isn't weakness. It's physiology.",
      "What helps: name it without detailed debriefing ('Rough shift. I'm here though.'), physical transition rituals like changing clothes or a walk, and letting your family know it's not about them.",
      "Peer support for families exists. The resources section has links.",
    ]},
    {id:"peer",icon:"🤝",color:"#22c55e",title:"Peer Support Basics",tag:"5 min",body:[
      "Peer support works because it comes from someone who's been there. Not a therapist. Not a supervisor. Someone who has done the job and understands the culture.",
      "Peer support is not a formal interview, not mandatory reporting, and not a sign that something is wrong with you.",
      "Peer support is a check-in, a conversation that doesn't leave the room, someone saying 'I've been there too.'",
      "Reaching out to your PST team is one of the strongest things you can do.",
    ]},
    {id:"grounding",icon:"🌊",color:"#eab308",title:"Tactical Grounding",tag:"3 min",body:[
      "Grounding techniques interrupt the stress response by anchoring you to the present moment. They work because the brain can't fully process both a threat response and sensory awareness at the same time.",
      "Box Breathing (4-4-4-4) slows the heart rate and signals safety to the nervous system.",
      "5-4-3-2-1 engages all five senses to interrupt rumination.",
      "Cold water on the face activates the dive reflex and drops heart rate fast.",
      "These aren't soft. They're tactical. Use them.",
    ]},
    {id:"substance",icon:"🚫",color:"#ef4444",title:"Substance Use Awareness",tag:"5 min",body:[
      "Alcohol is the most common coping mechanism in first responder culture. It works short-term - it blunts the nervous system and quiets the noise. The problem is that it disrupts REM sleep, increases anxiety over time, and doesn't process the underlying stress.",
      "This isn't about judgment. It's about knowing what's actually happening.",
      "Signs worth noticing: needing a drink to wind down after most shifts, drinking alone or to stop thinking, others commenting on your drinking.",
      "Resources that work for this culture specifically are in the Resources section. No AA meeting required if that's not your thing.",
    ]},
  ];
    const selected_mod=modules.find(m=>m.id===selected);

  if(selected_mod){return(
    <ScreenSingle headerProps={{onBack:()=>setSelected(null),title:selected_mod.title,agencyName:(agency&&agency.name)}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:4}}>
        <div style={{width:52,height:52,borderRadius:15,background:selected_mod.color+"18",border:`1px solid ${selected_mod.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>{selected_mod.icon}</div>
        <div>
          <div style={{fontSize:18,fontWeight:800,color:"#dde8f4"}}>{selected_mod.title}</div>
          <div style={{fontSize:11,color:selected_mod.color,fontWeight:600,marginTop:2}}>{selected_mod.tag} read</div>
        </div>
      </div>
      {selected_mod.body.map((para,i)=>(
        <div key={i} style={{fontSize:14,color:"#c8dae8",lineHeight:1.8,marginBottom:12}}>{para}</div>
      ))}
      <div style={{background:"rgba(56,189,248,0.05)",border:"1px solid rgba(56,189,248,0.12)",borderRadius:12,padding:"12px 14px",marginTop:8}}>
        <div style={{fontSize:11,color:"#38bdf8",fontWeight:700,marginBottom:2}}>Want to go deeper?</div>
        <div onClick={()=>navigate("resources")} style={{fontSize:12,color:"#8099b0",cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>Resources & support programs →</div>
      </div>
    </ScreenSingle>
  );}

  return(
    <Screen headerProps={{onBack:()=>navigate("tools"),title:"Learn",agencyName:(agency&&agency.name)}}>
      <div className="full-width" style={{fontSize:13,color:"#8099b0",lineHeight:1.6}}>Short, stigma-free modules you can read anytime - on shift, after a call, or at home.</div>
      <div className="full-width" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {modules.map((m)=>(
          <div key={m.id} onClick={()=>setSelected(m.id)} style={{background:"rgba(255,255,255,0.025)",border:`1.5px solid rgba(255,255,255,0.065)`,borderRadius:18,padding:"18px 14px",cursor:"pointer",display:"flex",flexDirection:"column",gap:10,transition:"all 0.13s",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:"15%",right:"15%",height:2,background:m.color,opacity:0.5,borderRadius:"0 0 4px 4px"}}/>
            <div style={{width:46,height:46,borderRadius:13,background:m.color+"18",border:`1px solid ${m.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{m.icon}</div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"#dde8f4",lineHeight:1.3,marginBottom:3}}>{m.title}</div>
              <div style={{fontSize:10,color:m.color,fontWeight:600}}>{m.tag}</div>
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

// 
// FEEDBACK
// 

