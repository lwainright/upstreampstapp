// ============================================================
// Upstream Initiative — First Responder Edition
import React, { useState, useEffect, useRef } from 'react';
import { useLayoutConfig } from '../utils.js';
import { trackCheckin, trackTool, trackAISession, trackPSTContact, AW_ENDPOINT, AW_PROJECT, AW_DB } from '../analytics.js';
export default function AgencyCodeScreen({onJoin,onSkip,isChange=false,currentAgency=null,roster=[]}){
  const[phone,setPhone]=useState("");
  const[matchedAgency,setMatchedAgency]=useState(null);
  const[confirmLeave,setConfirmLeave]=useState(false);


    const upper=code.trim().toUpperCase();
    const match=AGENCY_CODES[upper];
      const cs=getContractStatus(match);
      // Code expired - redirect to successor or block
        setError("This code has been renewed. Enter your new agency code.");
      }
        setError("This code has expired. Contact your agency administrator for the current code.");
      }
      setMatchedAgency({...match,code:upper,contractStatus:cs,codeStatus:codeS});
      if(cs==="grace"||cs==="purged"){setStep("contract_lapsed");return;}
    }else{setError("Code not recognized. Check with your administrator.");}

    const cleaned=phone.replace(/\D/g,"");
    const inactiveMatch=roster.find(e=>(e.phone||"").replace(/\D/g,"")=== cleaned&&e.status==="inactive");
    else if(inactiveMatch){setError("Your access has been deactivated. Contact your agency administrator.");}
  };
  if(confirmLeave){return(
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,paddingTop:20}}>
        <div style={{fontSize:17,fontWeight:800,color:"#dde8f4",textAlign:"center"}}>Leave {currentAgency}?</div>
        <Btn color="#ef4444" bg="rgba(239,68,68,0.12)" onClick={()=>onJoin(null)} style={{width:"100%"}}>Yes, leave agency</Btn>
      </div>
  );}
  if(step==="event"){return(
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,paddingTop:20}}>
        <div style={{fontSize:18,fontWeight:800,color:"#38bdf8",textAlign:"center"}}>{matchedAgency&&matchedAgency.name}</div>
        <div style={{background:"rgba(234,179,8,0.07)",border:"1px solid rgba(234,179,8,0.2)",borderRadius:12,padding:"12px 16px",width:"100%"}}>
          <div style={{fontSize:11,color:"#64748b",lineHeight:1.6}}>Access is open to all event attendees with this code.</div>
        <Card style={{width:"100%",background:"rgba(56,189,248,0.05)",borderColor:"rgba(56,189,248,0.15)"}}>
          {["All wellness tools","AI Peer Support","Human PST panel","Crisis resources"].map((f,i)=>(
          ))}
        <Btn color="#38bdf8" onClick={()=>onJoin(matchedAgency)} style={{width:"100%"}}>Enter Event Mode →</Btn>
    </ScreenSingle>

    <ScreenSingle headerProps={{onBack:()=>(setStep("code"),setError("")),title:"Verify Access"}}>
        <div style={{fontSize:38}}>📱</div>
        <div style={{fontSize:12,color:"#64748b",textAlign:"center"}}>Agency code verified v</div>
      <Card style={{background:"rgba(56,189,248,0.04)",borderColor:"rgba(56,189,248,0.12)"}}>
        <div style={{fontSize:13,color:"#8099b0",lineHeight:1.6}}>Enter the phone number your agency has on file to confirm you are on the roster.</div>
      <input value={phone} onChange={e=>{setPhone(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&tryPhone()} placeholder="Your phone number" type="tel"
      {error&&<div style={{fontSize:12,color:"#ef4444",textAlign:"center"}}>{error}</div>}
      <div style={{fontSize:11,color:"#334155",lineHeight:1.6,textAlign:"center"}}>Your number is only used to verify roster membership - not stored or shared.</div>
  );}
  if(step==="contract_lapsed"){
    const isPurged=matchedAgency&&matchedAgency.contractStatus==="purged";
    return(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,paddingTop:20}}>
          <div style={{fontSize:17,fontWeight:800,color:isGrace?"#eab308":"#64748b",textAlign:"center"}}>{matchedAgency&&matchedAgency.name}</div>
            <div style={{background:"rgba(234,179,8,0.08)",border:"1.5px solid rgba(234,179,8,0.25)",borderRadius:14,padding:"16px",width:"100%"}}>
              <div style={{fontSize:13,color:"#8099b0",lineHeight:1.7}}>Your personal wellness tools are fully available. Agency features - Human PST, crew dashboard, and admin tools - are paused while the contract is renewed.</div>
            </div>
          {isPurged&&(
              <div style={{fontSize:13,fontWeight:700,color:"#64748b",marginBottom:8}}>Agency access has ended</div>
            </div>
          <Card style={{width:"100%",background:"rgba(56,189,248,0.05)",borderColor:"rgba(56,189,248,0.12)"}}>
            {["AI Peer Support","All coping tools","Journal","Resources & crisis lines"].map((f,i)=>(
            ))}
          <Btn color="#38bdf8" onClick={()=>onJoin({...matchedAgency,contractStatus:matchedAgency.contractStatus})} style={{width:"100%"}}>Continue with Personal Tools →</Btn>
        </div>
    );

    <ScreenSingle headerProps={{onBack:isChange?()=>setStep("code"):null,title:"Access Granted"}}>
        <div style={{fontSize:44}}>[ok]</div>
        <div style={{fontSize:13,color:"#3d5268",textAlign:"center",lineHeight:1.7}}>Verified. Human PST access is now enabled.</div>
          <div style={{fontSize:12,color:"#38bdf8",fontWeight:600,marginBottom:6}}>What is unlocked:</div>
            <div key={i} style={{fontSize:13,color:"#2d4a66",lineHeight:1.9}}>[ok] {f}</div>
        </Card>
      </div>
  );}
  return(
      {isChange&&currentAgency&&(
          <div style={{fontSize:12,color:"#eab308",fontWeight:600,marginBottom:4}}>Currently: {currentAgency}</div>
        </div>
      <Card style={{background:"rgba(56,189,248,0.04)",borderColor:"rgba(56,189,248,0.12)"}}>
        <div style={{fontSize:13,color:"#8099b0",lineHeight:1.6}}>Enter your agency code or event code to unlock access. Scan a QR code at your event or agency location.</div>
      <input value={code} onChange={e=>{setCode(e.target.value.toUpperCase());setError("");}} onKeyDown={e=>e.key==="Enter"&&tryCode()} placeholder="AGENCY OR EVENT CODE" maxLength={12}
      {error&&<div style={{fontSize:12,color:"#ef4444",textAlign:"center",marginTop:-4}}>{error}</div>}
      <div style={{display:"flex",alignItems:"center",gap:12,margin:"4px 0"}}>
        <span style={{fontSize:11,color:"#334155"}}>or</span>
      </div>
        <div style={{fontSize:22,marginBottom:8}}>📷</div>
        <div style={{fontSize:11,color:"#334155",lineHeight:1.5}}>In production, scanning your agency or event QR code fills this in automatically.</div>
      {!isChange&&<div onClick={onSkip} style={{textAlign:"center",fontSize:13,color:"#8099b0",cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>Continue without a code →</div>}
    </ScreenSingle>
}

// HOME

