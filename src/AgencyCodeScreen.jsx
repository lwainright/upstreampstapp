// ============================================================
// SCREEN: AgencyCodeScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { AppHeader, Screen, ScreenSingle, Btn, Card, SLabel } from '../ui.jsx';
import { useLayoutConfig } from '../utils.js';
import { getContractStatus, getCodeStatus, getContractBanner } from '../utils.js';
import { trackCheckin, trackTool, trackAISession, trackPSTContact, AW_ENDPOINT, AW_PROJECT, AW_DB } from '../analytics.js';

export default function AgencyCodeScreen({onJoin,onSkip,isChange=false,currentAgency=null,roster=[]}){
  const[code,setCode]=useState("");
  const[phone,setPhone]=useState("");
  const[step,setStep]=useState("code");
  const[matchedAgency,setMatchedAgency]=useState(null);
  const[error,setError]=useState("");
  const[confirmLeave,setConfirmLeave]=useState(false);
  const lc=useLayoutConfig();

  const EVENT_CODES={"SUMMIT26":{name:"2026 First Responder Summit",short:"SUMMIT",eventMode:true},"PCIS26":{name:"PCIS Annual Conference",short:"PCIS",eventMode:true}};

  const tryCode=()=>{
    const upper=code.trim().toUpperCase();
    if(EVENT_CODES[upper]){setMatchedAgency(EVENT_CODES[upper]);setStep("event");setError("");return;}
    const match=AGENCY_CODES[upper];
    if(match){
      const cs=getContractStatus(match);
      const codeS=getCodeStatus(match);
      // Code expired - redirect to successor or block
      if(codeS==="expired"&&match.successorCode){
        setError("This code has been renewed. Enter your new agency code.");
        return;
      }
      if(codeS==="expired_no_successor"){
        setError("This code has expired. Contact your agency administrator for the current code.");
        return;
      }
      // Grace or purged - allow entry but agency features will be locked
      setMatchedAgency({...match,code:upper,contractStatus:cs,codeStatus:codeS});
      setError("");
      if(cs==="grace"||cs==="purged"){setStep("contract_lapsed");return;}
      if(roster&&roster.length>0){setStep("phone");}else{setStep("success");}
    }else{setError("Code not recognized. Check with your administrator.");}
  };

  const tryPhone=()=>{
    const cleaned=phone.replace(/\D/g,"");
    const activeMatch=roster.find(e=>(e.phone||"").replace(/\D/g,"")=== cleaned&&e.status==="active");
    const inactiveMatch=roster.find(e=>(e.phone||"").replace(/\D/g,"")=== cleaned&&e.status==="inactive");
    if(activeMatch){setStep("success");setError("");}
    else if(inactiveMatch){setError("Your access has been deactivated. Contact your agency administrator.");}
    else{setError("Phone number not found on roster. Contact your administrator.");}
  };

  if(confirmLeave){return(
    <ScreenSingle headerProps={{onBack:()=>setConfirmLeave(false),title:"Leave Agency"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,paddingTop:20}}>
        <div style={{fontSize:36}}>[!]️</div>
        <div style={{fontSize:17,fontWeight:800,color:"#dde8f4",textAlign:"center"}}>Leave {currentAgency}?</div>
        <div style={{fontSize:13,color:"#3d5268",textAlign:"center",lineHeight:1.7}}>You will return to Individual mode. Human PST access will be removed.</div>
        <Btn color="#ef4444" bg="rgba(239,68,68,0.12)" onClick={()=>onJoin(null)} style={{width:"100%"}}>Yes, leave agency</Btn>
        <div onClick={()=>setConfirmLeave(false)} style={{fontSize:13,color:"#2d4a66",cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>Cancel</div>
      </div>
    </ScreenSingle>
  );}

  if(step==="event"){return(
    <ScreenSingle headerProps={{onBack:()=>setStep("code"),title:"Event Access"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,paddingTop:20}}>
        <div style={{fontSize:44}}>🎟️</div>
        <div style={{fontSize:18,fontWeight:800,color:"#38bdf8",textAlign:"center"}}>{matchedAgency&&matchedAgency.name}</div>
        <div style={{fontSize:13,color:"#3d5268",textAlign:"center",lineHeight:1.7}}>Event access granted. All responder wellness features are available for the duration of this event.</div>
        <div style={{background:"rgba(234,179,8,0.07)",border:"1px solid rgba(234,179,8,0.2)",borderRadius:12,padding:"12px 16px",width:"100%"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#eab308",marginBottom:4}}>Event mode - no roster required</div>
          <div style={{fontSize:11,color:"#64748b",lineHeight:1.6}}>Access is open to all event attendees with this code.</div>
        </div>
        <Card style={{width:"100%",background:"rgba(56,189,248,0.05)",borderColor:"rgba(56,189,248,0.15)"}}>
          <div style={{fontSize:12,color:"#38bdf8",fontWeight:600,marginBottom:8}}>Unlocked for this event:</div>
          {["All wellness tools","AI Peer Support","Human PST panel","Crisis resources"].map((f,i)=>(
            <div key={i} style={{fontSize:13,color:"#2d4a66",lineHeight:1.9}}>[ok] {f}</div>
          ))}
        </Card>
        <Btn color="#38bdf8" onClick={()=>onJoin(matchedAgency)} style={{width:"100%"}}>Enter Event Mode →</Btn>
      </div>
    </ScreenSingle>
  );}

  if(step==="phone"){return(
    <ScreenSingle headerProps={{onBack:()=>(setStep("code"),setError("")),title:"Verify Access"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,paddingTop:10,marginBottom:8}}>
        <div style={{fontSize:38}}>📱</div>
        <div style={{fontSize:16,fontWeight:800,color:"#dde8f4",textAlign:"center"}}>{matchedAgency&&matchedAgency.name}</div>
        <div style={{fontSize:12,color:"#64748b",textAlign:"center"}}>Agency code verified v</div>
      </div>
      <Card style={{background:"rgba(56,189,248,0.04)",borderColor:"rgba(56,189,248,0.12)"}}>
        <div style={{fontSize:14,fontWeight:700,color:"#dde8f4",marginBottom:6}}>One more step</div>
        <div style={{fontSize:13,color:"#8099b0",lineHeight:1.6}}>Enter the phone number your agency has on file to confirm you are on the roster.</div>
      </Card>
      <input value={phone} onChange={e=>{setPhone(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&tryPhone()} placeholder="Your phone number" type="tel"
        style={{background:"rgba(255,255,255,0.05)",border:"1.5px solid "+(error?"rgba(239,68,68,0.4)":phone?"rgba(56,189,248,0.3)":"rgba(255,255,255,0.09)"),borderRadius:14,padding:"16px 18px",fontSize:16,fontFamily:"'DM Sans',sans-serif",outline:"none",width:"100%",textAlign:"center",color:"#dde8f4"}}/>
      {error&&<div style={{fontSize:12,color:"#ef4444",textAlign:"center"}}>{error}</div>}
      <Btn color="#38bdf8" onClick={tryPhone} disabled={!phone.trim()}>Verify Phone Number</Btn>
      <div style={{fontSize:11,color:"#334155",lineHeight:1.6,textAlign:"center"}}>Your number is only used to verify roster membership - not stored or shared.</div>
    </ScreenSingle>
  );}

  if(step==="contract_lapsed"){
    const isGrace=matchedAgency&&matchedAgency.contractStatus==="grace";
    const isPurged=matchedAgency&&matchedAgency.contractStatus==="purged";
    const days=matchedAgency?getDaysUntilPurge(AGENCY_CODES[matchedAgency.code]):0;
    return(
      <ScreenSingle headerProps={{onBack:()=>setStep("code"),title:isGrace?"Agency Paused":"Agency Ended"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,paddingTop:20}}>
          <div style={{fontSize:44}}>{isGrace?"...":"🗄️"}</div>
          <div style={{fontSize:17,fontWeight:800,color:isGrace?"#eab308":"#64748b",textAlign:"center"}}>{matchedAgency&&matchedAgency.name}</div>
          {isGrace&&(
            <div style={{background:"rgba(234,179,8,0.08)",border:"1.5px solid rgba(234,179,8,0.25)",borderRadius:14,padding:"16px",width:"100%"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#eab308",marginBottom:8}}>Agency access is currently paused</div>
              <div style={{fontSize:13,color:"#8099b0",lineHeight:1.7}}>Your personal wellness tools are fully available. Agency features - Human PST, crew dashboard, and admin tools - are paused while the contract is renewed.</div>
              <div style={{fontSize:12,color:"#eab308",marginTop:10,fontWeight:600}}>Agency data held securely for {days} more day{days!==1?"s":""}.</div>
            </div>
          )}
          {isPurged&&(
            <div style={{background:"rgba(71,85,105,0.08)",border:"1.5px solid rgba(71,85,105,0.25)",borderRadius:14,padding:"16px",width:"100%"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#64748b",marginBottom:8}}>Agency access has ended</div>
              <div style={{fontSize:13,color:"#8099b0",lineHeight:1.7}}>Agency data has been purged from the system per our data policy. Your personal wellness tools remain fully available.</div>
            </div>
          )}
          <Card style={{width:"100%",background:"rgba(56,189,248,0.05)",borderColor:"rgba(56,189,248,0.12)"}}>
            <div style={{fontSize:12,color:"#38bdf8",fontWeight:600,marginBottom:6}}>Still available to you:</div>
            {["AI Peer Support","All coping tools","Journal","Resources & crisis lines"].map((f,i)=>(
              <div key={i} style={{fontSize:13,color:"#2d4a66",lineHeight:1.9}}>[ok] {f}</div>
            ))}
          </Card>
          <Btn color="#38bdf8" onClick={()=>onJoin({...matchedAgency,contractStatus:matchedAgency.contractStatus})} style={{width:"100%"}}>Continue with Personal Tools →</Btn>
          <div style={{fontSize:12,color:"#334155",textAlign:"center",lineHeight:1.6}}>To reinstate agency access contact Upstream at<br/><span style={{color:"#38bdf8"}}>upstreampst.netlify.app</span></div>
        </div>
      </ScreenSingle>
    );
  }

  if(step==="success"){return(
    <ScreenSingle headerProps={{onBack:isChange?()=>setStep("code"):null,title:"Access Granted"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,paddingTop:20}}>
        <div style={{fontSize:44}}>[ok]</div>
        <div style={{fontSize:18,fontWeight:800,color:"#38bdf8",textAlign:"center"}}>{matchedAgency&&matchedAgency.name}</div>
        <div style={{fontSize:13,color:"#3d5268",textAlign:"center",lineHeight:1.7}}>Verified. Human PST access is now enabled.</div>
        <Card style={{width:"100%",background:"rgba(56,189,248,0.05)",borderColor:"rgba(56,189,248,0.15)"}}>
          <div style={{fontSize:12,color:"#38bdf8",fontWeight:600,marginBottom:6}}>What is unlocked:</div>
          {["Human PST availability panel","Contact request and in-app chat","Agency name shown in header","Crew Stream bar on Home Screen"].map((f,i)=>(
            <div key={i} style={{fontSize:13,color:"#2d4a66",lineHeight:1.9}}>[ok] {f}</div>
          ))}
        </Card>
        <Btn color="#38bdf8" onClick={()=>onJoin(matchedAgency)} style={{width:"100%"}}>Enter Agency Mode →</Btn>
      </div>
    </ScreenSingle>
  );}

  return(
    <ScreenSingle headerProps={{onBack:(isChange||currentAgency)?()=>onSkip():null,title:"Join Agency"}}>
      {isChange&&currentAgency&&(
        <div style={{background:"rgba(234,179,8,0.07)",border:"1px solid rgba(234,179,8,0.18)",borderRadius:14,padding:"14px 16px"}}>
          <div style={{fontSize:12,color:"#eab308",fontWeight:600,marginBottom:4}}>Currently: {currentAgency}</div>
          <div onClick={()=>setConfirmLeave(true)} style={{fontSize:13,color:"#ef4444",cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>Leave this agency</div>
        </div>
      )}
      <Card style={{background:"rgba(56,189,248,0.04)",borderColor:"rgba(56,189,248,0.12)"}}>
        <div style={{fontSize:16,fontWeight:800,color:"#dde8f4",marginBottom:6}}>Enter your access code</div>
        <div style={{fontSize:13,color:"#8099b0",lineHeight:1.6}}>Enter your agency code or event code to unlock access. Scan a QR code at your event or agency location.</div>
      </Card>
      <input value={code} onChange={e=>{setCode(e.target.value.toUpperCase());setError("");}} onKeyDown={e=>e.key==="Enter"&&tryCode()} placeholder="AGENCY OR EVENT CODE" maxLength={12}
        style={{background:"rgba(255,255,255,0.05)",border:"1.5px solid "+(error?"rgba(239,68,68,0.4)":code?"rgba(56,189,248,0.3)":"rgba(255,255,255,0.09)"),borderRadius:14,padding:"16px 18px",fontSize:18,fontFamily:"'DM Sans',sans-serif",outline:"none",width:"100%",letterSpacing:"0.2em",fontWeight:700,textAlign:"center"}}/>
      {error&&<div style={{fontSize:12,color:"#ef4444",textAlign:"center",marginTop:-4}}>{error}</div>}
      <Btn color="#38bdf8" onClick={tryCode} disabled={!code.trim()}>Continue</Btn>
      <div style={{display:"flex",alignItems:"center",gap:12,margin:"4px 0"}}>
        <div style={{flex:1,height:1,background:"rgba(255,255,255,0.06)"}}/>
        <span style={{fontSize:11,color:"#334155"}}>or</span>
        <div style={{flex:1,height:1,background:"rgba(255,255,255,0.06)"}}/>
      </div>
      <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"16px",textAlign:"center"}}>
        <div style={{fontSize:22,marginBottom:8}}>📷</div>
        <div style={{fontSize:13,fontWeight:700,color:"#64748b",marginBottom:4}}>Scan QR Code</div>
        <div style={{fontSize:11,color:"#334155",lineHeight:1.5}}>In production, scanning your agency or event QR code fills this in automatically.</div>
      </div>
      {!isChange&&<div onClick={onSkip} style={{textAlign:"center",fontSize:13,color:"#8099b0",cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>Continue without a code →</div>}
      <div style={{fontSize:10,color:"#1e3a52",textAlign:"center"}}>Demo agency codes: UPSTREAM . METRO24 . FIRE07 . Event codes: SUMMIT26 . PCIS26</div>
    </ScreenSingle>
  );
}
// Home screen icon tile
