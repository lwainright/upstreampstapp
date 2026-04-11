// ============================================================
// SCREEN: HomeScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { Screen, Card, SLabel } from './ui.jsx';
import { useLayoutConfig } from '../utils.js';
import { BoltIcon, ClockIcon, BreathIcon, HeartIcon, GaugeIcon, HomeIcon, InfoIcon, MapIcon, UserIcon, ToolsIcon, GroundIcon, JournalIcon, ResetIcon, LockIcon, BuildingIcon, TimerIcon, SettingsIcon, ShieldIcon } from '../icons.jsx';
import { trackCheckin, trackTool, trackAISession, trackPSTContact, AW_ENDPOINT, AW_PROJECT, AW_DB } from '../analytics.js';

export default function HomeScreen({navigate,gaugeLevel,setGaugeLevel,agency,role,pstAlert,pstAlertMsg,criticalIncident,agencyNotification,setAgencyNotification}){
  const[pulse,setPulse]=useState(false);
  const[time,setTime]=useState(new Date());
  const lc=useLayoutConfig();
  useEffect(()=>{const t=setInterval(()=>setTime(new Date()),1000);return()=>clearInterval(t);},[]);
  useEffect(()=>{setPulse(true);const t=setTimeout(()=>setPulse(false),600);return()=>clearTimeout(t);},[gaugeLevel]);
  const gc=[{label:"Great",color:"#22c55e",bg:"rgba(34,197,94,0.12)",glow:"0 0 24px rgba(34,197,94,0.5)"},{label:"Striving",color:"#eab308",bg:"rgba(234,179,8,0.12)",glow:"0 0 24px rgba(234,179,8,0.5)"},{label:"Not Well",color:"#f97316",bg:"rgba(249,115,22,0.12)",glow:"0 0 24px rgba(249,115,22,0.5)"},{label:"Ill",color:"#ef4444",bg:"rgba(239,68,68,0.12)",glow:"0 0 24px rgba(239,68,68,0.5)"}];
  const cur=gc[gaugeLevel];
  const hr=time.getHours();
  const greeting=hr<6?"Night Shift":hr<12?"Morning Shift":hr<18?"Day Shift":"Evening Shift";
  const isAdminRole=role==="supervisor"||role==="admin"||role==="platform";
  const isPST=role==="pst"||role==="admin";
  // Contract/code banner + acknowledgment state
  const contractBanner=agency?getContractBanner(agency.code):null;
  const isAgencyLocked=contractBanner&&(contractBanner.type==="grace"||contractBanner.type==="purged");
  const needsAck=contractBanner&&(contractBanner.type==="code_expired"||contractBanner.type==="rotating");
  const ackKey=agency?"upstream_ack_"+agency.code+"_"+(contractBanner&&contractBanner.type):"";
  const[ackDismissed,setAckDismissed]=useState(()=>{
    try{return ackKey?!!localStorage.getItem(ackKey):false;}catch(e){return false;}
  });
  const[showCodeModal,setShowCodeModal]=useState(()=>{
    if(!contractBanner||contractBanner.type!=="code_expired") return false;
    try{return!localStorage.getItem(ackKey);}catch(e){return false;}
    return false;
  });
  const[emailSent,setEmailSent]=useState(false);
  const[showEmailPreview,setShowEmailPreview]=useState(false);

  const handleAck=()=>{
    try{localStorage.setItem(ackKey,"1");}catch(e){}
    setAckDismissed(true);
    setShowCodeModal(false);
  };

  const handleSendAdminEmail=()=>{
    // In production this triggers a real transactional email to adminEmail.
    // For demo, show a preview of what the email looks like.
    setShowEmailPreview(true);
  };

  const handleConfirmEmail=()=>{
    setShowEmailPreview(false);
    setEmailSent(true);
    setTimeout(()=>setEmailSent(false),4000);
  };

  // Build email preview content based on banner type
  const agencyData=agency?AGENCY_CODES[agency.code]:null;
  const newCode=(agencyData&&agencyData.successorCode)||"[NEW-CODE]";
  const rotationDate=agencyData?new Date(agencyData.codeExpiry).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}):"";
  const adminEmail=(agencyData&&agencyData.adminEmail)||"your admin email";

  return(
    <Screen headerProps={{agencyName:(agency&&agency.name)}}>
      {/* Email Preview Modal */}
      {showEmailPreview&&agencyData&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1100,padding:20}}>
          <div style={{background:"#0c1929",border:"1.5px solid rgba(56,189,248,0.25)",borderRadius:20,padding:"24px",maxWidth:440,width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{fontSize:11,fontWeight:800,letterSpacing:"0.14em",textTransform:"uppercase",color:"#475569",marginBottom:16}}>Email Preview - Sent to {adminEmail}</div>
            {/* Simulated email */}
            <div style={{background:"#f8fafc",borderRadius:12,padding:"20px",fontFamily:"Georgia,serif"}}>
              <div style={{borderBottom:"2px solid #0EA5E9",paddingBottom:12,marginBottom:16}}>
                <div style={{fontSize:18,fontWeight:800,color:"#060E1B"}}>Upstream Initiative</div>
                <div style={{fontSize:11,color:"#64748b",marginTop:2}}>upstreaminitiative@gmail.com</div>
              </div>
              <div style={{fontSize:13,color:"#1e293b",lineHeight:1.8}}>
                <div style={{marginBottom:12}}><strong>To:</strong> {adminEmail}</div>
                <div style={{marginBottom:16}}><strong>Subject:</strong> {(contractBanner&&contractBanner.type)==="code_expired"?"Your Upstream agency access code has been renewed":"Action needed: Your Upstream access code renews soon"}</div>
                <div style={{marginBottom:12}}>Hello,</div>
                {(contractBanner&&contractBanner.type)==="code_expired"?(
                  <div>
                    <div style={{marginBottom:10}}>Your agency's Upstream access code has been renewed as scheduled. Your staff will need to enter the new code on their next login.</div>
                    <div style={{background:"#f1f5f9",border:"2px solid #0EA5E9",borderRadius:8,padding:"16px",textAlign:"center",marginBottom:16}}>
                      <div style={{fontSize:11,color:"#64748b",marginBottom:4}}>NEW ACCESS CODE</div>
                      <div style={{fontSize:28,fontWeight:900,color:"#060E1B",letterSpacing:"0.2em"}}>{newCode}</div>
                      <div style={{fontSize:11,color:"#64748b",marginTop:4}}>Share with your staff at roll call, group text, or your agency bulletin</div>
                    </div>
                    <div style={{marginBottom:10}}>Your staff will see a notification prompting them to enter the new code. Their personal wellness tools and data are unaffected.</div>
                    <div style={{marginBottom:10}}>No IT steps needed - just share the code.</div>
                  </div>
                ):(
                  <div>
                    <div style={{marginBottom:10}}>Your agency's current Upstream access code expires on <strong>{rotationDate}</strong>. A new code will be issued automatically on that date and sent to this email address.</div>
                    <div style={{background:"#f1f5f9",border:"1px solid #cbd5e1",borderRadius:8,padding:"12px",marginBottom:16}}>
                      <div style={{fontSize:12,color:"#475569",lineHeight:1.6}}><strong>What to do:</strong> When you receive the new code, share it with your staff however works best - roll call, group text, or agency bulletin. No IT steps needed.</div>
                    </div>
                    <div style={{marginBottom:10}}>Staff who receive the new code stay connected. Staff who don't receive it - for example, someone who has left the agency - simply won't be able to re-enter agency mode.</div>
                  </div>
                )}
                <div style={{marginBottom:10}}>Questions? Contact Lee Wainright at leewainright@gmail.com or 252-717-3689.</div>
                <div style={{color:"#64748b",fontSize:12,borderTop:"1px solid #e2e8f0",paddingTop:12,marginTop:12}}>Upstream Initiative . upstreampst.netlify.app<br/>Free. Confidential. You earned the right to ask for help.</div>
              </div>
            </div>
            <div style={{display:"flex",gap:10,marginTop:16}}>
              <div onClick={()=>setShowEmailPreview(false)} style={{flex:1,padding:"12px",borderRadius:11,cursor:"pointer",textAlign:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",fontSize:13,fontWeight:700,color:"#475569"}}>Cancel</div>
              <div onClick={handleConfirmEmail} style={{flex:2,padding:"12px",borderRadius:11,cursor:"pointer",textAlign:"center",background:"rgba(56,189,248,0.12)",border:"1.5px solid rgba(56,189,248,0.3)",fontSize:13,fontWeight:700,color:"#38bdf8"}}>📧 Send This Email</div>
            </div>
          </div>
        </div>
      )}
      {/* Code Expired - requires acknowledgment modal */}
      {showCodeModal&&contractBanner&&contractBanner.type==="code_expired"&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:900,padding:20}}>
          <div style={{background:"#0c1929",border:"1.5px solid rgba(249,115,22,0.35)",borderRadius:20,padding:"28px 24px",maxWidth:400,width:"100%"}}>
            <div style={{textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:36,marginBottom:8}}>🔑</div>
              <div style={{fontSize:17,fontWeight:800,color:"#f97316"}}>Your access code has been renewed</div>
            </div>
            <div style={{fontSize:13,color:"#8099b0",lineHeight:1.7,marginBottom:16}}>
              Your agency's access code has rotated. A new code has been sent to your agency administrator. Get the new code from your supervisor or admin and enter it to restore full agency access.
            </div>
            <div style={{background:"rgba(56,189,248,0.06)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:12,padding:"12px 14px",marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:700,color:"#38bdf8",marginBottom:4}}>Your personal tools still work</div>
              <div style={{fontSize:11,color:"#334155",lineHeight:1.6}}>AI Peer Support, breathing, grounding, journal, and all wellness tools are fully available right now.</div>
            </div>
            {isAdminRole&&(
              <div style={{marginBottom:16}}>
                <div style={{fontSize:12,color:"#64748b",marginBottom:8}}>As an admin, you can trigger the new code email:</div>
                <div onClick={emailSent?null:handleSendAdminEmail} style={{padding:"11px",borderRadius:11,cursor:emailSent?"default":"pointer",textAlign:"center",background:emailSent?"rgba(34,197,94,0.1)":"rgba(56,189,248,0.1)",border:`1px solid ${emailSent?"rgba(34,197,94,0.3)":"rgba(56,189,248,0.25)"}`,fontSize:13,fontWeight:700,color:emailSent?"#22c55e":"#38bdf8",transition:"all 0.2s"}}>
                  {emailSent?"v Email sent to admin":"📧 Send new code to admin email"}
                </div>
              </div>
            )}
            <div style={{display:"flex",gap:10}}>
              <div onClick={()=>navigate("agencycode")} style={{flex:2,padding:"13px",borderRadius:12,cursor:"pointer",textAlign:"center",background:"rgba(249,115,22,0.12)",border:"1.5px solid rgba(249,115,22,0.3)",fontSize:13,fontWeight:700,color:"#f97316"}}>Enter New Code</div>
              <div onClick={handleAck} style={{flex:1,padding:"13px",borderRadius:12,cursor:"pointer",textAlign:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",fontSize:13,fontWeight:700,color:"#475569"}}>Got It</div>
            </div>
          </div>
        </div>
      )}
      {/* Contract / Code Status Banner (persistent, dismissible for rotation) */}
      {contractBanner&&!showCodeModal&&(
        <div className={lc.isDesktop?"full-width":""} style={{background:contractBanner.bg,border:`1.5px solid ${contractBanner.border}`,borderRadius:14,padding:"12px 16px",display:"flex",gap:12,alignItems:"flex-start"}}>
          <div style={{fontSize:20,flexShrink:0}}>{contractBanner.icon}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:contractBanner.color,marginBottom:4}}>{contractBanner.title}</div>
            <div style={{fontSize:12,color:"#8099b0",lineHeight:1.6}}>{isAdminRole&&contractBanner.adminBody?contractBanner.adminBody:contractBanner.body}</div>
            {isAdminRole&&contractBanner.type==="rotating"&&(
              <div onClick={emailSent?null:handleSendAdminEmail} style={{marginTop:10,display:"inline-block",padding:"7px 14px",borderRadius:8,cursor:emailSent?"default":"pointer",background:emailSent?"rgba(34,197,94,0.1)":"rgba(234,179,8,0.12)",border:`1px solid ${emailSent?"rgba(34,197,94,0.3)":"rgba(234,179,8,0.3)"}`,fontSize:12,fontWeight:700,color:emailSent?"#22c55e":"#eab308",transition:"all 0.2s"}}>
                {emailSent?"v Email sent":"📧 Preview admin renewal email"}
              </div>
            )}
          </div>
          {contractBanner.type==="code_expired"&&(
            <div onClick={()=>navigate("agencycode")} style={{padding:"6px 12px",borderRadius:8,background:"rgba(249,115,22,0.15)",border:"1px solid rgba(249,115,22,0.35)",fontSize:11,fontWeight:700,color:"#f97316",cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>Enter New Code</div>
          )}
          {(contractBanner.type==="rotating")&&(
            <div onClick={handleAck} style={{cursor:"pointer",color:"#64748b",fontSize:18,lineHeight:1,flexShrink:0}}>x</div>
          )}
        </div>
      )}
      {/* Critical Incident Banner */}
      {criticalIncident&&(
        <div className={lc.isDesktop?"full-width":""} style={{background:"#07080f",border:"2px solid rgba(148,163,184,0.25)",borderRadius:14,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:"#334155",border:"2px solid #64748b",flexShrink:0}}/>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:800,color:"#f1f5f9",letterSpacing:"0.08em"}}>[*] CRITICAL INCIDENT SUPPORT AVAILABLE</div><div style={{fontSize:11,color:"#64748b",marginTop:2}}>Your PST team is standing by. Human PST is recommended.</div></div>
        </div>
      )}
      {/* PST Availability Banner */}
      {pstAlert&&!criticalIncident&&(
        <div className={lc.isDesktop?"full-width":""} style={{background:"rgba(139,92,246,0.1)",border:"1.5px solid rgba(139,92,246,0.3)",borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:"#8b5cf6",boxShadow:"0 0 8px rgba(139,92,246,0.8)",flexShrink:0}}/>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"#c4b5fd"}}>Peer Support Available</div>{pstAlertMsg?<div style={{fontSize:12,color:"#a78bfa",marginTop:3,lineHeight:1.5}}>{pstAlertMsg}</div>:<div style={{fontSize:12,color:"#7c5cbf",marginTop:2}}>Your PST team is available if you want to talk.</div>}</div>
        </div>
      )}
      {/* Agency Notification Banner */}
      {agencyNotification&&(
        <div className={lc.isDesktop?"full-width":""} style={{background:agencyNotification.priority==="Urgent"?"rgba(239,68,68,0.1)":agencyNotification.priority==="Important"?"rgba(234,179,8,0.1)":"rgba(56,189,248,0.08)",border:`1.5px solid ${agencyNotification.priority==="Urgent"?"rgba(239,68,68,0.3)":agencyNotification.priority==="Important"?"rgba(234,179,8,0.3)":"rgba(56,189,248,0.2)"}`,borderRadius:14,padding:"12px 16px",display:"flex",gap:12,alignItems:"flex-start"}}>
          <div style={{fontSize:20}}>{agencyNotification.priority==="Urgent"?"🚨":agencyNotification.priority==="Important"?"[!]️":"📢"}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#64748b",marginBottom:4}}>Agency Notification . {agencyNotification.priority}</div>
            <div style={{fontSize:13,color:"#dde8f4",lineHeight:1.6}}>{agencyNotification.message}</div>
            <div style={{fontSize:10,color:"#3d5268",marginTop:4}}>{agencyNotification.timestamp}</div>
          </div>
          <div onClick={()=>setAgencyNotification(null)} style={{cursor:"pointer",color:"#64748b",fontSize:18,lineHeight:1}}>x</div>
        </div>
      )}
      {/* Greeting row */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gridColumn:lc.isDesktop?"1/-1":"auto"}}>
        <div>
          <div style={{fontSize:11,color:"#0ea5e9",letterSpacing:"0.16em",textTransform:"uppercase",fontWeight:700}}>{greeting}</div>
          <div style={{fontSize:lc.isDesktop?24:21,fontWeight:800,color:"#dde8f4",marginTop:3}}>How are you doing today?</div>
          <div style={{fontSize:12,color:"#8099b0",marginTop:2}}>{time.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {isAdminRole&&<div onClick={()=>navigate("admintools")} title="Admin Tools" style={{width:36,height:36,borderRadius:10,background:"rgba(234,179,8,0.1)",border:"1px solid rgba(234,179,8,0.25)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#eab308"}}><SettingsIcon/></div>}
          {isPST&&<div onClick={()=>navigate("pstpanel")} title="PST Panel" style={{width:36,height:36,borderRadius:10,background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.25)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#a78bfa"}}><ShieldIcon/></div>}
          <div onClick={()=>setGaugeLevel((gaugeLevel+1)%4)} style={{cursor:"pointer",userSelect:"none",background:cur.bg,border:`1.5px solid ${cur.color}50`,borderRadius:16,padding:"10px 13px",display:"flex",flexDirection:"column",alignItems:"center",gap:4,boxShadow:pulse?cur.glow:"none",transition:"box-shadow 0.3s"}}>
            <GaugeIcon color={cur.color}/><div style={{fontSize:10,fontWeight:800,color:cur.color,letterSpacing:"0.1em",textTransform:"uppercase"}}>{cur.label}</div>
            <div style={{display:"flex",gap:3}}>{gc.map((g,i)=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:i===gaugeLevel?g.color:"rgba(255,255,255,0.08)",transition:"background 0.3s"}}/>)}</div>
            <div style={{fontSize:9,color:"#8099b0",letterSpacing:"0.08em"}}>SHIFT STREAM</div>
          </div>
        </div>
      </div>
      {/* 6 home buttons - clean icon grid */}
      <div className={lc.isDesktop?"full-width":""} style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
        <HomeTile icon={<BoltIcon/>}   label={"AI Peer\nSupport"}    color="#ef4444" bg="rgba(239,68,68,0.1)"    border="rgba(239,68,68,0.22)"   badge="URGENT"   onClick={()=>navigate("aichat")}/>
        <HomeTile icon={<ClockIcon/>}  label={"Shift\nCheck"}        color="#38bdf8" bg="rgba(56,189,248,0.08)"  border="rgba(56,189,248,0.2)"   badge="CHECK-IN" onClick={()=>navigate("shiftcheck")}/>
        <HomeTile icon={<TimerIcon/>}  label={"90-Second\nDump"}     color="#f97316" bg="rgba(249,115,22,0.08)"  border="rgba(249,115,22,0.2)"   badge="VENT"     onClick={()=>navigate("dump90")}/>
        <HomeTile icon={<BreathIcon/>} label={"Coping\nTools"}       color="#22c55e" bg="rgba(34,197,94,0.08)"   border="rgba(34,197,94,0.2)"                     onClick={()=>navigate("tools")}/>
        <HomeTile icon={<HeartIcon/>}  label={"Human\nPST"}          color="#a78bfa" bg="rgba(167,139,250,0.08)" border="rgba(167,139,250,0.2)"  locked={!agency||isAgencyLocked} onClick={()=>navigate(agency&&!isAgencyLocked?"humanpst":"agencycode")}/>
        <HomeTile icon={<InfoIcon/>}   label={"Resources"}            color="#64748b" bg="rgba(100,116,139,0.07)" border="rgba(100,116,139,0.15)"                  onClick={()=>navigate("resources")}/>
      </div>

      {agency?(
        <Card className={lc.isDesktop?"full-width":""}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><SLabel>Crew Stream</SLabel><span style={{fontSize:11,color:"#2d4a66"}}>Anonymous . 8 on shift</span></div>
          <CrewBar/>
        </Card>
      ):(
        <div onClick={()=>navigate("agencycode")} className={lc.isDesktop?"full-width":""} style={{background:"rgba(56,189,248,0.04)",border:"1px solid rgba(56,189,248,0.12)",borderRadius:16,padding:"16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:44,height:44,borderRadius:13,background:"rgba(56,189,248,0.1)",border:"1px solid rgba(56,189,248,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#38bdf8"}}><BuildingIcon/></div>
          <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:"#dde8f4"}}>Join Your Agency</div><div style={{fontSize:12,color:"#8099b0",marginTop:2}}>Enter your agency code to unlock Human PST access</div></div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a52" strokeWidth="2.5" style={{flexShrink:0}}><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      )}
      <div className={lc.isDesktop?"full-width":""} style={{background:"rgba(56,189,248,0.04)",border:"1px solid rgba(56,189,248,0.1)",borderRadius:12,padding:"12px 14px"}}>
        <div style={{fontSize:12,color:"#38bdf8",fontWeight:600,marginBottom:4}}>🛡 Fully Anonymous</div>
        <div style={{fontSize:12,color:"#2d4a66",lineHeight:1.6}}>No login required. Your check-ins and conversations are private. AI PST has no access to your identity or contact info.</div>
      </div>
    </Screen>
  );
}

// 
// AI PST
// 

