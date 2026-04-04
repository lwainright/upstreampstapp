// ============================================================
// SCREEN: AboutScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { AppHeader, Screen, ScreenSingle, Btn, Card, SLabel, DragList, NavBtn, DesktopWrap, HomeTile, ToolCard } from '../components/ui.jsx';
import { useLayoutConfig } from '../utils.js';
import { BoltIcon, ClockIcon, BreathIcon, HeartIcon, GaugeIcon, HomeIcon, InfoIcon, MapIcon, UserIcon, ToolsIcon, GroundIcon, JournalIcon, ResetIcon, LockIcon, BuildingIcon, TimerIcon, SettingsIcon, ShieldIcon } from '../icons.jsx';
import { trackCheckin, trackTool, trackAISession, trackPSTContact, AW_ENDPOINT, AW_PROJECT, AW_DB } from '../analytics.js';

export default function AboutScreen({navigate,agency,onChangeAgency,role,setRole,userState,onChangeState,userLanguage="en",setUserLanguage}){
  const[tab,setTab]=useState("about");
  const tabs=[{key:"about",label:"About"},{key:"founder",label:"Founder"},{key:"privacy",label:"Privacy"},{key:"security",label:"Security"},{key:"settings",label:"Settings"},{key:"account",label:"Agency"},{key:"role",label:"Role"}];
  const lc=useLayoutConfig();

  // ── Triple-tap master login ───────────────────────────────────────────────
  const tapCountRef=useRef(0);
  const tapTimerRef=useRef(null);
  const[showMasterLogin,setShowMasterLogin]=useState(false);
  const[masterUnlocked,setMasterUnlocked]=useState(false);

  const handleLogoTap=()=>{
    tapCountRef.current+=1;
    clearTimeout(tapTimerRef.current);
    if(tapCountRef.current>=3){
      tapCountRef.current=0;
      setShowMasterLogin(true);
    } else {
      tapTimerRef.current=setTimeout(()=>{tapCountRef.current=0;},1200);
    }
  };

  const handleMasterSuccess=()=>{
    setShowMasterLogin(false);
    setMasterUnlocked(true);
    setRole("platform");
    navigate("admintools");
  };
  // ─────────────────────────────────────────────────────────────────────────

  return(
    <Screen headerProps={{onBack:()=>navigate("home"),title:"About",agencyName:(agency&&agency.name)}}>
      {showMasterLogin&&<MasterLoginModal onSuccess={handleMasterSuccess} onClose={()=>setShowMasterLogin(false)}/>}
      <div className="full-width" style={{display:"flex",gap:6,background:"rgba(56,189,248,0.04)",borderRadius:12,padding:8,overflowX:"auto",border:"1px solid rgba(56,189,248,0.15)",minHeight:54}}>
        {tabs.map(t=>(<div key={t.key} onClick={()=>setTab(t.key)} style={{flex:"0 0 auto",textAlign:"center",padding:"12px 16px",minHeight:38,borderRadius:9,background:tab===t.key?"rgba(56,189,248,0.2)":"rgba(255,255,255,0.02)",border:`1.5px solid ${tab===t.key?"rgba(56,189,248,0.4)":"rgba(56,189,248,0.12)"}`,cursor:"pointer",fontSize:12,fontWeight:tab===t.key?800:600,color:tab===t.key?"#dde8f4":"#a8c5db",transition:"all 0.2s",whiteSpace:"nowrap",display:"flex",alignItems:"center"}}>{t.label}</div>))}
      </div>

      {tab==="about"&&(<>
        <div className="full-width" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"10px 0"}}>
          <img src={LOGO_SRC} alt="Upstream Approach" style={{width:"60%",maxWidth:220,height:"auto",objectFit:"contain"}}/>
          <div style={{fontSize:13,color:"#3d5268",textAlign:"center",letterSpacing:"0.1em",textTransform:"uppercase"}}>First Responder Wellness App</div>
          {/* Tap this icon 3× quickly to open master login */}
          <div onClick={handleLogoTap} title="Tap 3× for platform access"
            style={{width:28,height:28,borderRadius:"50%",background:"rgba(56,189,248,0.07)",border:"1.5px solid rgba(56,189,248,0.18)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:14,marginTop:2}}>
            🔐
          </div>
        </div>
        <Card><SLabel>Our Purpose</SLabel><p style={{fontSize:13,color:"#8099b0",lineHeight:1.75,marginBottom:12}}>First responders face challenges most people will never experience. This app was created to provide support for those who spend their careers supporting everyone else.</p><p style={{fontSize:13,color:"#8099b0",lineHeight:1.75}}>Our goal: <span style={{color:"#dde8f4",fontWeight:600}}>make wellness support accessible, confidential, and built for the realities of the job.</span></p></Card>
        <Card><SLabel>Our Mission</SLabel><p style={{fontSize:13,color:"#8099b0",lineHeight:1.75}}>To support the mental wellness and resilience of first responders by providing confidential tools, peer connection, and access to trusted support resources.</p></Card>
        <Card><SLabel>Who This Is For</SLabel>{["EMS / Paramedics / EMTs","Firefighters","Law Enforcement","Emergency Communications / Dispatch","Other emergency service professionals"].map((r,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:i<4?"1px solid rgba(255,255,255,0.04)":"none"}}><div style={{width:6,height:6,borderRadius:"50%",background:"#38bdf8",flexShrink:0}}/><span style={{fontSize:13,color:"#8099b0"}}>{r}</span></div>))}</Card>
        <Card style={{background:"rgba(56,189,248,0.05)",borderColor:"rgba(56,189,248,0.15)"}} className="full-width"><SLabel>A Culture Shift</SLabel><p style={{fontSize:13,color:"#38bdf8",fontWeight:600,lineHeight:1.6}}>Taking care of yourself is not weakness - it's part of staying effective in the job and healthy outside of it.</p></Card>
      </>)}

      {tab==="founder"&&(<>
        <div className="full-width" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"10px 0"}}><div style={{width:64,height:64,borderRadius:"50%",background:"linear-gradient(135deg,rgba(14,165,233,0.2),rgba(56,189,248,0.1))",border:"2px solid rgba(56,189,248,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>🌊</div><div style={{fontSize:14,fontWeight:700,color:"#dde8f4"}}>Founder</div><div style={{fontSize:12,color:"#2d4a66"}}>Nearly 30 years in Emergency Medical Services</div></div>
        <Card style={{background:"rgba(56,189,248,0.04)",borderColor:"rgba(56,189,248,0.12)"}}><p style={{fontSize:13,color:"#8099b0",lineHeight:1.8,marginBottom:12}}>This app was created by someone who understands the job from the inside.</p><p style={{fontSize:13,color:"#8099b0",lineHeight:1.8,marginBottom:12}}>After nearly three decades in EMS, I've seen firsthand the impact this profession can have on the people who serve in it.</p><p style={{fontSize:13,color:"#8099b0",lineHeight:1.8}}>For many years, the culture encouraged people to keep moving to the next call. That mindset has helped many perform under pressure - but also made it harder for some to seek support.</p></Card>
        <Card><SLabel color="#38bdf8">Why "Upstream Approach"?</SLabel><p style={{fontSize:13,color:"#8099b0",lineHeight:1.8}}>The name comes from addressing problems <span style={{color:"#dde8f4",fontWeight:600}}>before they become crises</span> - recognizing stress early and building resilience over time.</p></Card>
        <Card><SLabel color="#38bdf8">Background</SLabel>{["Nearly 30 years in Emergency Medical Services","Field Paramedic experience","Communications / Dispatch experience","Leadership and supervisory roles","Peer support and wellness initiative experience"].map((r,i)=>(<div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"7px 0",borderBottom:i<4?"1px solid rgba(255,255,255,0.04)":"none"}}><div style={{width:6,height:6,borderRadius:"50%",background:"#38bdf8",flexShrink:0,marginTop:4}}/><span style={{fontSize:13,color:"#8099b0",lineHeight:1.5}}>{r}</span></div>))}</Card>
        <Card style={{background:"rgba(56,189,248,0.04)",borderColor:"rgba(56,189,248,0.12)"}} className="full-width"><p style={{fontSize:13,color:"#38bdf8",fontWeight:600,lineHeight:1.7,textAlign:"center"}}>Taking care of the people who spend their careers taking care of everyone else.</p></Card>
      </>)}

      {tab==="privacy"&&(<>
        <Card style={{background:"rgba(34,197,94,0.05)",borderColor:"rgba(34,197,94,0.15)"}}><SLabel color="#22c55e">Confidential by Design</SLabel><p style={{fontSize:13,color:"#8099b0",lineHeight:1.8}}>We do not share personal information, conversations, or wellness check-in data with employers, supervisors, or agencies. Your data is not sold, shared, or used for marketing.</p></Card>
        <Card style={{background:"rgba(56,189,248,0.05)",borderColor:"rgba(56,189,248,0.15)"}}>
          <SLabel color="#38bdf8">Location & State Detection</SLabel>
          <p style={{fontSize:13,color:"#8099b0",lineHeight:1.8,marginBottom:8}}>To show you relevant first responder resources, we detect your approximate state using your internet connection (IP address) - <span style={{color:"#dde8f4",fontWeight:600}}>not your GPS or device location.</span></p>
          <p style={{fontSize:13,color:"#8099b0",lineHeight:1.8,marginBottom:8}}>This means we only know what state you are likely in - never your city, neighborhood, or street address.</p>
          <p style={{fontSize:13,color:"#8099b0",lineHeight:1.8}}>You can always change your state manually in Settings. No location permission is ever requested.</p>
        </Card>
        <Card><SLabel color="#a78bfa">Peer Support Conversations</SLabel><p style={{fontSize:13,color:"#8099b0",lineHeight:1.75}}>Treated with respect and discretion, consistent with best practices in first responder peer support programs.</p></Card>
        <Card><SLabel color="#eab308">Your Control</SLabel><p style={{fontSize:13,color:"#8099b0",lineHeight:1.75}}>You are always in control of what you share. Many features allow anonymous or minimal-input use.</p></Card>
        <Card style={{background:"rgba(239,68,68,0.06)",borderColor:"rgba(239,68,68,0.18)"}}><SLabel color="#f87171">Limits of Confidentiality</SLabel>{["Someone expresses an immediate risk of harm to themselves or others","Required by applicable laws or emergency intervention protocols"].map((r,i)=>(<div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"5px 0"}}><div style={{width:5,height:5,borderRadius:"50%",background:"#f87171",flexShrink:0,marginTop:5}}/><span style={{fontSize:12,color:"#8099b0",lineHeight:1.6}}>{r}</span></div>))}</Card>
        <div className="full-width" style={{fontSize:11,color:"#1e3a52",textAlign:"center",lineHeight:1.7}}>This app is not a replacement for professional medical or mental health care.</div>
      </>)}

      {tab==="security"&&(<>
        <Card style={{background:"rgba(56,189,248,0.05)",borderColor:"rgba(56,189,248,0.15)"}}><SLabel>Protecting Your Information</SLabel><p style={{fontSize:13,color:"#8099b0",lineHeight:1.8}}>This platform uses modern security practices to ensure information you enter remains protected.</p></Card>
        {[{title:"Encryption",color:"#38bdf8",icon:"🔐",body:"Data transmitted through the app is protected using secure encryption so it cannot easily be intercepted."},{title:"Limited Access",color:"#a78bfa",icon:"🔒",body:"Wellness information is not accessible to employers, agencies, or supervisors."},{title:"Responsible Data Handling",color:"#eab308",icon:"📋",body:"User information is used only to support the app's intended features."}].map((s,i)=>(<Card key={i}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><span style={{fontSize:20}}>{s.icon}</span><SLabel color={s.color}>{s.title}</SLabel></div><p style={{fontSize:13,color:"#8099b0",lineHeight:1.75}}>{s.body}</p></Card>))}
      </>)}

      {tab==="role"&&(<>
        <Card style={{background:"rgba(56,189,248,0.05)",borderColor:"rgba(56,189,248,0.15)"}} className="full-width">
          <SLabel>Current Role</SLabel>
          <div style={{fontSize:18,fontWeight:800,color:"#38bdf8",marginTop:4}}>{ROLE_LABELS[role]}</div>
          <div style={{fontSize:12,color:"#3d5268",marginTop:4}}>Tap a role to preview that experience. In production, roles are assigned by your agency administrator.</div>
        </Card>
        <div style={{display:"flex",flexDirection:"column",gap:10}} className="full-width">
          {ROLES.map(r=>(
            <div key={r} onClick={()=>setRole(r)} style={{background:role===r?"rgba(56,189,248,0.1)":"rgba(255,255,255,0.03)",border:`1.5px solid ${role===r?"rgba(56,189,248,0.3)":"rgba(255,255,255,0.07)"}`,borderRadius:14,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:role===r?"#38bdf8":"#1e3a52",flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:role===r?"#38bdf8":"#dde8f4"}}>{ROLE_LABELS[r]}</div>
                <div style={{fontSize:12,color:"#2d4a66",marginTop:2}}>{{user:"Basic wellness features",pst:"PST panel . Alert response . Coverage status",supervisor:"All user features + Admin Tools (limited) + [S] icon",admin:"Full Admin Tools . Dashboards . All screens"}[r]}</div>
              </div>
              {role===r&&<span style={{fontSize:10,color:"#38bdf8",fontWeight:700,background:"rgba(56,189,248,0.12)",padding:"3px 8px",borderRadius:6}}>ACTIVE</span>}
            </div>
          ))}
        </div>
      </>)}

      {tab==="settings"&&(<>
        <Card>
          <SLabel color="#38bdf8">{t("yourLanguage",userLanguage)}</SLabel>
          <div style={{fontSize:13,color:"#8099b0",marginTop:4,lineHeight:1.6}}>
            {t("autoDetected",userLanguage)}
          </div>
          <div style={{background:"rgba(56,189,248,0.08)",border:"1.5px solid rgba(56,189,248,0.2)",borderRadius:12,padding:"14px 16px",marginTop:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:12,color:"#64748b",fontWeight:600,marginBottom:2}}>
                {t("currentLanguage",userLanguage)}
              </div>
              <div style={{fontSize:16,fontWeight:700,color:"#38bdf8"}}>
                {userLanguage==='es'?'🇪🇸 Espanol':'🇺🇸 English'}
              </div>
            </div>
            {setUserLanguage&&<div onClick={()=>setUserLanguage(userLanguage==='es'?'en':'es')} style={{fontSize:13,color:"#38bdf8",fontWeight:700,cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>{t("change",userLanguage)}</div>}
          </div>
        </Card>
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div>
              <SLabel color="#38bdf8">{t("yourState",userLanguage)}</SLabel>
              <div style={{fontSize:13,color:"#8099b0",marginTop:4,lineHeight:1.6}}>Used to show relevant first responder mental health resources and programs in your state and surrounding areas</div>
            </div>
          </div>
          <div style={{background:"rgba(56,189,248,0.08)",border:"1.5px solid rgba(56,189,248,0.2)",borderRadius:12,padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:12,color:"#64748b",fontWeight:600,marginBottom:2}}>{t("currentlySetTo",userLanguage)}</div>
              <div style={{fontSize:16,fontWeight:700,color:"#38bdf8"}}>{userState||"North Carolina"}</div>
            </div>
            {onChangeState&&<div onClick={onChangeState} style={{fontSize:13,color:"#38bdf8",fontWeight:700,cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>{t("change",userLanguage)}</div>}
          </div>
        </Card>
        <Card style={{background:"rgba(255,255,255,0.02)",borderColor:"rgba(255,255,255,0.05)"}}>
          <SLabel color="#64748b">Privacy Setting</SLabel>
          <div style={{fontSize:13,color:"#8099b0",marginTop:8,lineHeight:1.6}}>Your state selection is stored only on this device and used to filter resources. It is never shared or transmitted.</div>
        </Card>
      </>)}

      {tab==="account"&&(<>
        <Card style={{background:agency?"rgba(56,189,248,0.05)":"rgba(255,255,255,0.025)",borderColor:agency?"rgba(56,189,248,0.15)":"rgba(255,255,255,0.06)"}} className="full-width">
          <SLabel color={agency?"#38bdf8":"#2d4a66"}>Current Mode</SLabel>
          <div style={{display:"flex",alignItems:"center",gap:10,marginTop:4}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:agency?"#22c55e":"#2d4a66",boxShadow:agency?"0 0 8px rgba(34,197,94,0.5)":"none"}}/>
            <span style={{fontSize:16,fontWeight:700,color:agency?"#dde8f4":"#3d5268"}}>{agency?agency.name:"Individual Mode"}</span>
          </div>
          <div style={{fontSize:12,color:"#2d4a66",marginTop:4}}>{agency?"Agency code active . Human PST enabled":"No agency linked . Human PST not available"}</div>
        </Card>
        {agency?(<Btn color="#38bdf8" onClick={()=>onChangeAgency()} className="full-width">Change Agency Code</Btn>):(<Btn color="#38bdf8" onClick={()=>onChangeAgency()}>Enter Agency Code →</Btn>)}
        <Card className="full-width"><SLabel>What agency codes unlock:</SLabel>{["Human PST availability panel","Contact request flow (Text / Call)","Agency name shown in header","Crew Stream bar on Home Screen"].map((f,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:i<3?"1px solid rgba(255,255,255,0.04)":"none"}}><div style={{fontSize:14}}>{agency?"[ok]":"🔒"}</div><span style={{fontSize:13,color:agency?"#8099b0":"#2d4a66"}}>{f}</span></div>))}</Card>
        <div className="full-width" style={{fontSize:11,color:"#1e3a52",textAlign:"center"}}>Demo codes: UPSTREAM . METRO24 . FIRE07 . EMS01 . SHERIFF</div>
      </>)}
    </Screen>
  );
}

// Icons
function BoltIcon(){return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>;}
function ClockIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;}
function BreathIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>;}
function HeartIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;}
function GaugeIcon({color}){return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M12 2a10 10 0 0 1 7.39 16.75"/><path d="M12 2a10 10 0 0 0-7.39 16.75"/><line x1="12" y1="12" x2="15.5" y2="8.5"/><circle cx="12" cy="12" r="1.5" fill={color}/></svg>;}
function HomeIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;}
function InfoIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;}
function MapIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>;}
function UserIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;}
function ToolsIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;}
function GroundIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>;}
function JournalIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;}
function ResetIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>;}
function LockIcon({size=18}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;}
function BuildingIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;}
function TimerIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M9 3h6"/><path d="M12 3v2"/></svg>;}
function SettingsIcon(){return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;}
function ShieldIcon(){return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;}

// 
// TRANSLATION HELPER
// 
const translations={
  en:{
    // Navigation
    home:"Home",
    aiPST:"AI PST",
    pstTeam:"PST Team",
    tools:"Tools",
    about:"About",
    // Buttons
    submit:"Submit",
    cancel:"Cancel",
    save:"Save",
    send:"Send",
    back:"Back",
    continue:"Continue",
    skip:"Skip",
    change:"Change",
    // Common
    loading:"Loading...",
    optional:"Optional",
    required:"Required",
    // AI PST
    text:"Text",
    voice:"Voice",
    tapToSpeak:"Tap to Speak",
    listening:"Listening...",
    speaking:"Speaking...",
    you:"YOU",
    typeHere:"Type here...",
    // State selector
    welcome:"Welcome to Upstream",
    selectState:"Select Your State",
    yourState:"Your State",
    currentlySetTo:"Currently Set To:",
    // Language
    yourLanguage:"Your Language",
    currentLanguage:"Current Language:",
    autoDetected:"Auto-detected from your phone settings",
  },
  es:{
    // Navigation
    home:"Inicio",
    aiPST:"PST IA",
    pstTeam:"Equipo PST",
    tools:"Herramientas",
    about:"Acerca de",
    // Buttons
    submit:"Enviar",
    cancel:"Cancelar",
    save:"Guardar",
    send:"Enviar",
    back:"Atras",
    continue:"Continuar",
    skip:"Saltar",
    change:"Cambiar",
    // Common
    loading:"Cargando...",
    optional:"Opcional",
    required:"Requerido",
    // AI PST
    text:"Texto",
    voice:"Voz",
    tapToSpeak:"Toca para Hablar",
    listening:"Escuchando...",
    speaking:"Hablando...",
    you:"TU",
    typeHere:"Escribe aqui...",
    // State selector
    welcome:"Bienvenido a Upstream",
    selectState:"Selecciona Tu Estado",
    yourState:"Tu Estado",
    currentlySetTo:"Configurado Como:",
    // Language
    yourLanguage:"Tu Idioma",
    currentLanguage:"Idioma Actual:",
    autoDetected:"Detectado automaticamente desde la configuracion de tu telefono",
  }
};

const t=(key,lang="en")=>translations[lang][key]||translations.en[key]||key;

// 
// ROOT APP
const ROLES=["user","pst","supervisor","admin","platform"];


// 
// EMERGENCY CONTACTS
// 

