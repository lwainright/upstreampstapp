// ============================================================
// Upstream Initiative — First Responder Edition
import React, { useState, useEffect, useRef } from 'react';
import { useLayoutConfig } from '../utils.js';
import { trackCheckin, trackTool, trackAISession, trackPSTContact, AW_ENDPOINT, AW_PROJECT, AW_DB } from '../analytics.js';
export default function ShiftCheckScreen({navigate,agency}){
  const[selected,setSelected]=useState(null);
  const lc=useLayoutConfig();
    {key:"S1-G",emoji:"🟢",label:"Great",   color:"#22c55e",msg:"Great start. Keep checking in throughout your shift."},
    {key:"S1-O",emoji:"🟠",label:"Not Well",color:"#f97316",msg:"Thank you for being honest. Coping tools and peer support are ready now."},
  ];
    {key:"MID-G",emoji:"🟢",label:"Great",   color:"#22c55e",msg:"Good to hear. Keep taking care of yourself out there."},
    {key:"MID-O",emoji:"🟠",label:"Not Well",color:"#f97316",msg:"Thanks for checking in. A quick reset might help - coping tools are here."},
  ];
    {key:"S2-G",emoji:"🟢",label:"Great",   color:"#22c55e",msg:"Glad to hear it. Rest up and take care of yourself."},
    {key:"S2-O",emoji:"🟠",label:"Not Well",color:"#f97316",msg:"You made it through. Don't carry this home alone - support is right here."},
  ];
  const title=phase==="s1"?"Upstream Daily Shift Check":phase==="midshift"?"Midshift Check-In":"Shift Close Check";

    <ScreenSingle headerProps={{onBack:()=>navigate("home"),title:"Shift Check",agencyName:(agency&&agency.name)}}>
      <div style={{display:"flex",flexDirection:"column",gap:14,marginTop:4}}>
          <div style={{width:48,height:48,borderRadius:14,background:"rgba(56,189,248,0.12)",border:"1px solid rgba(56,189,248,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🌅</div>
        </div>
          <div style={{width:48,height:48,borderRadius:14,background:"rgba(234,179,8,0.12)",border:"1px solid rgba(234,179,8,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>[S]️</div>
        </div>
          <div style={{width:48,height:48,borderRadius:14,background:"rgba(139,92,246,0.12)",border:"1px solid rgba(139,92,246,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🌙</div>
        </div>
    </ScreenSingle>

    <ScreenSingle headerProps={{onBack:()=>(setPhase(null),setSelected(null),setSubmitted(false)),title,agencyName:(agency&&agency.name)}}>
        <div style={{fontSize:lc.isDesktop?18:15,fontWeight:700,color:"#dde8f4",textAlign:"center"}}>{prompt}</div>
        {selected&&<Btn onClick={()=>{
          // Track anonymous check-in to Appwrite
          trackCheckin((agency&&agency.code), statusMap[selected]||'unknown', phase);
      </>):(<>
        <NavBtn icon={<BreathIcon/>} label="Quick Breathing Reset" sub="60-second grounding" color="#22c55e" bg="rgba(34,197,94,0.09)" onClick={()=>navigate("breathing")}/>
          <NavBtn icon={<BoltIcon/>} label="Talk to AI PST" sub="Anonymous peer support" color="#ef4444" bg="rgba(239,68,68,0.09)" onClick={()=>navigate("aichat")}/>
        </>)}
      </>)}
  );

// COPING TOOLS HUB

