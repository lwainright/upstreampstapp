// ============================================================
// SCREEN: HumanPSTScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { AppHeader, Screen, ScreenSingle, Btn, Card, SLabel, DragList, NavBtn, DesktopWrap, HomeTile, ToolCard } from '../ui.jsx';
import { BoltIcon, ClockIcon, BreathIcon, HeartIcon, GaugeIcon, HomeIcon, InfoIcon, MapIcon, UserIcon, ToolsIcon, GroundIcon, JournalIcon, ResetIcon, LockIcon, BuildingIcon, TimerIcon, SettingsIcon, ShieldIcon } from '../icons.jsx';
import { trackCheckin, trackTool, trackAISession, trackPSTContact, AW_ENDPOINT, AW_PROJECT, AW_DB } from '../analytics.js';
import { useLayoutConfig, getContractStatus, getCodeStatus, getContractBanner, detectSpiritual, detectLevel } from '../utils.js';

export default function HumanPSTScreen({navigate,agency}){
  const[step,setStep]=useState("panel");
  const[method,setMethod]=useState(null);
  const[urgency,setUrgency]=useState(null);
  const[name,setName]=useState("");
  const[phone,setPhone]=useState("");
  const[message,setMessage]=useState("");
  const[showTipModal,setShowTipModal]=useState(false);
  const[tipContext,setTipContext]=useState(null);
  const[tipPriority,setTipPriority]=useState("Priority");
  const[requestedPST,setRequestedPST]=useState(null);
  const[chatInput,setChatInput]=useState("");
  const[chatBlurred,setChatBlurred]=useState(false);
  const[showDeleteConfirm,setShowDeleteConfirm]=useState(false);
  const[chatMessages,setChatMessages]=useState([]);
  const[pstTyping,setPstTyping]=useState(false);
  const lc=useLayoutConfig();

  const pstReplies=[
    "Thank you for reaching out. I'm here and I'm listening. Take your time.",
    "That sounds really heavy. You don't have to carry this alone.",
    "I hear you. Can you tell me a bit more about what's been going on?",
    "You did the right thing reaching out. What's weighing on you most right now?",
    "I'm glad you messaged. There's no rush - we can go at whatever pace feels right.",
    "That makes a lot of sense given what you've been through. How are you doing right now, in this moment?",
  ];
  const[replyIdx,setReplyIdx]=useState(0);

  const sendChat=()=>{
    if(!chatInput.trim())return;
    const userMsg={from:"user",text:chatInput.trim(),time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})};
    setChatMessages(prev=>[...prev,userMsg]);
    setChatInput("");
    setPstTyping(true);
    setTimeout(()=>{
      const pstMsg={from:"pst",text:pstReplies[replyIdx%pstReplies.length],time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})};
      setChatMessages(prev=>[...prev,pstMsg]);
      setReplyIdx(i=>i+1);
      setPstTyping(false);
    },1800+Math.random()*1200);
  };

  const startChat=(targetPST)=>{
    const pstName=targetPST?targetPST.name:"a PST member";
    const openingMsg={from:"pst",text:"Hi, this is "+pstName+". I picked up your request and I'm here for you. To get started, can you share your name so I know who I'm talking with? This conversation stays between us and the PST team.",time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})};
    setChatMessages([openingMsg]);
    setStep("chat");
  };

  useEffect(()=>{
    if(step!=="chat")return;
    const handleVisibility=()=>{
      if(document.visibilityState==="hidden") setChatBlurred(true);
    };
    document.addEventListener("visibilitychange",handleVisibility);
    return()=>document.removeEventListener("visibilitychange",handleVisibility);
  },[step]);

  if(!agency){
    return(
      <ScreenSingle headerProps={{onBack:()=>navigate("home"),title:"Human Peer Support"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,paddingTop:20}}>
          <div style={{width:64,height:64,borderRadius:"50%",background:"rgba(56,189,248,0.08)",border:"2px solid rgba(56,189,248,0.15)",display:"flex",alignItems:"center",justifyContent:"center",color:"#38bdf8"}}><LockIcon size={28}/></div>
          <div style={{fontSize:17,fontWeight:800,color:"#dde8f4",textAlign:"center"}}>Agency Feature</div>
          <div style={{fontSize:13,color:"#3d5268",textAlign:"center",lineHeight:1.7}}>Human PST access is available to members of participating agencies. Enter your agency code to connect with your peer support team.</div>
          <Btn color="#38bdf8" onClick={()=>navigate("agencycode")} style={{width:"100%"}}>Enter Agency Code →</Btn>
          <div style={{background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.18)",borderRadius:12,padding:"14px 16px",width:"100%",textAlign:"center"}}>
            <div style={{fontSize:12,color:"#f87171",fontWeight:700,marginBottom:6}}>Need immediate support?</div>
            <div style={{fontSize:13,color:"#ef4444",fontWeight:700}}>📞 988 . Safe Call Now: 1-206-459-3020</div>
          </div>
          <div onClick={()=>navigate("resources")} style={{fontSize:13,color:"#38bdf8",cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>Browse peer support resources →</div>
        </div>
      </ScreenSingle>
    );
  }

  const pstMembers=[
    {id:"pst1",name:"J. Martinez",role:"PST Lead",unit:"EMS Division",status:"green",note:"Available now"},
    {id:"pst2",name:"A. Thompson",role:"PST Member",unit:"Station 4",status:"green",note:"On shift until 18:00"},
    {id:"pst3",name:"C. Williams",role:"PST Member",unit:"HQ / Admin",status:"yellow",note:"Available later today"},
    {id:"pst4",name:"D. Nguyen",role:"PST Member",unit:"Dispatch",status:"red",note:"Off duty today"},
  ];
  const sc={green:"#22c55e",yellow:"#eab308",red:"#ef4444"};
  const sl={green:"Available",yellow:"Limited",red:"Off Duty"};

  return(
    <ScreenSingle headerProps={{onBack:()=>navigate("home"),title:"Human Peer Support",agencyName:(agency&&agency.name)}}>
      {step==="panel"&&(<>
        <div style={{background:"rgba(167,139,250,0.07)",border:"1px solid rgba(167,139,250,0.18)",borderRadius:14,padding:"14px 16px"}}>
          <div style={{fontSize:13,color:"#c4b5fd",fontWeight:600,marginBottom:4}}>Real people. Real support.</div>
          <div style={{fontSize:12,color:"#3d5268",lineHeight:1.6}}>Your agency's peer support team are trained colleagues who've been there. Conversations stay within the PST team.</div>
        </div>

        <SLabel color="#a78bfa">PST Team</SLabel>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {pstMembers.map((m,i)=>{const available=m.status!=="red";return(
              <div key={i} style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:16,padding:"14px 16px",opacity:available?1:0.45}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:available?12:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:42,height:42,borderRadius:"50%",background:"rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>👤</div>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:"#dde8f4"}}>{m.name}</div>
                      <div style={{fontSize:11,color:"#64748b"}}>{m.role} . {m.unit}</div>
                      <div style={{fontSize:11,color:"#3d5268",marginTop:2,fontStyle:"italic"}}>{m.note}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,flexShrink:0}}>
                    <div style={{width:9,height:9,borderRadius:"50%",background:sc[m.status],boxShadow:"0 0 7px "+sc[m.status]+"90"}}/>
                    <span style={{fontSize:9,color:sc[m.status],fontWeight:700}}>{sl[m.status]}</span>
                  </div>
                </div>
                {available&&(
                  <div style={{display:"flex",gap:8}}>
                    <div onClick={()=>(setRequestedPST(m),setMethod("Call Me"),setStep("contact"))}
                      style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px 0",borderRadius:10,background:"rgba(56,189,248,0.08)",border:"1px solid rgba(56,189,248,0.2)",cursor:"pointer"}}>
                      <span style={{fontSize:14}}>📞</span>
                      <span style={{fontSize:11,fontWeight:700,color:"#38bdf8"}}>Call</span>
                    </div>
                    <div onClick={()=>(setRequestedPST(m),setMethod("Text Me"),setStep("contact"))}
                      style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px 0",borderRadius:10,background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",cursor:"pointer"}}>
                      <span style={{fontSize:14}}>💬</span>
                      <span style={{fontSize:11,fontWeight:700,color:"#22c55e"}}>Text</span>
                    </div>
                    <div onClick={()=>(setRequestedPST(m),startChat(m))}
                      style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px 0",borderRadius:10,background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.3)",cursor:"pointer"}}>
                      <span style={{fontSize:14}}>🗨</span>
                      <span style={{fontSize:11,fontWeight:700,color:"#a78bfa"}}>Chat</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{height:1,background:"rgba(255,255,255,0.05)",borderRadius:1}}/>

        <div onClick={()=>(setRequestedPST(null),startChat(null))}
          style={{background:"rgba(167,139,250,0.08)",border:"1.5px solid rgba(167,139,250,0.25)",borderRadius:14,padding:"16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:44,height:44,borderRadius:12,background:"rgba(167,139,250,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>📡</div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:800,color:"#c4b5fd"}}>Broadcast to All PST</div>
            <div style={{fontSize:12,color:"#7c5cbf",marginTop:2}}>Send to every available PST member - first to respond gets the chat</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </div>

        <div onClick={()=>(setRequestedPST(null),setStep("contact"))}
          style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:44,height:44,borderRadius:12,background:"rgba(255,255,255,0.04)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>📋</div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700,color:"#94a3b8"}}>Request a Callback</div>
            <div style={{fontSize:12,color:"#475569",marginTop:2}}>Leave your name and number - PST will reach out</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </div>

        <Card style={{background:"rgba(234,179,8,0.06)",borderColor:"rgba(234,179,8,0.2)"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#eab308",marginBottom:8}}>🤝 Concerned About a Co-Worker?</div>
          <div style={{fontSize:13,color:"#8099b0",lineHeight:1.7,marginBottom:12}}>You can anonymously request that PST check on someone. No names, no identities - just a heads-up that someone might need support.</div>
          <Btn color="#eab308" bg="rgba(234,179,8,0.12)" onClick={()=>setShowTipModal(true)}>Submit Anonymous Wellness Check →</Btn>
        </Card>

        <div style={{background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.18)",borderRadius:12,padding:"12px 14px",textAlign:"center"}}>
          <div style={{fontSize:12,color:"#f87171",fontWeight:700,marginBottom:4}}>Crisis? Call now.</div>
          <div style={{fontSize:13,color:"#ef4444",fontWeight:700}}>988 . Safe Call Now: 1-206-459-3020</div>
        </div>
      </>)}
      {step==="contact"&&(<>
        <Card style={{background:"rgba(167,139,250,0.06)",borderColor:"rgba(167,139,250,0.18)"}}>
          <div style={{fontSize:13,color:"#c4b5fd",fontWeight:600,marginBottom:4}}>{requestedPST?"Contacting "+requestedPST.name:"Requesting PST Callback"}</div>
          <div style={{fontSize:12,color:"#3d5268"}}>Your name and number are shared with your PST team only - never with supervisors or admin.</div>
        </Card>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[{k:"Text Me",icon:"💬"},{k:"Call Me",icon:"📞"},{k:"In-Person",icon:"🤝"},{k:"Schedule Call",icon:"📅"}].map(m=>(
            <div key={m.k} onClick={()=>setMethod(m.k)} style={{background:method===m.k?"rgba(167,139,250,0.15)":"rgba(255,255,255,0.03)",border:`1.5px solid ${method===m.k?"rgba(167,139,250,0.45)":"rgba(255,255,255,0.07)"}`,borderRadius:14,padding:"16px 10px",cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:20,marginBottom:6}}>{m.icon}</div>
              <div style={{fontSize:13,fontWeight:700,color:method===m.k?"#a78bfa":"#dde8f4"}}>{m.k}</div>
            </div>
          ))}
        </div>

        <div onClick={()=>startChat(requestedPST)} style={{background:"rgba(167,139,250,0.1)",border:"1.5px solid rgba(167,139,250,0.35)",borderRadius:14,padding:"16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:44,height:44,borderRadius:12,background:"rgba(167,139,250,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>💬</div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:800,color:"#c4b5fd"}}>{requestedPST?"Chat with "+requestedPST.name:"Broadcast to PST Team"}</div>
            <div style={{fontSize:12,color:"#7c5cbf",marginTop:2}}>{requestedPST?"Direct message - only "+requestedPST.name+" will see this":"First available PST member will pick this up"}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </div>

        <SLabel color="#a78bfa">Or request a callback</SLabel>
        <SLabel color="#a78bfa">Urgency</SLabel>
        {["Right now","Today","Anytime"].map(u=>(<div key={u} onClick={()=>setUrgency(u)} style={{background:urgency===u?"rgba(167,139,250,0.12)":"rgba(255,255,255,0.03)",border:`1.5px solid ${urgency===u?"rgba(167,139,250,0.4)":"rgba(255,255,255,0.07)"}`,borderRadius:12,padding:"12px 16px",cursor:"pointer",fontSize:14,fontWeight:urgency===u?700:400,color:urgency===u?"#a78bfa":"#dde8f4"}}>{u==="Right now"?"🔴":u==="Today"?"🟡":"🟢"} {u}</div>))}
        {method&&urgency&&(<>
          <div style={{background:"rgba(56,189,248,0.05)",border:"1px solid rgba(56,189,248,0.12)",borderRadius:12,padding:"10px 14px",fontSize:11,color:"#38bdf8",fontWeight:600}}>
            Your name and number are shared with your PST team only - never with supervisors or admin.
          </div>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.09)",borderRadius:12,padding:"12px 14px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",width:"100%"}}/>
          <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone number" style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.09)",borderRadius:12,padding:"12px 14px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",width:"100%"}}/>
          <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Optional - anything you want them to know first..." rows={3} style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.09)",borderRadius:12,padding:"12px 14px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",width:"100%"}}/>
          {name&&phone&&<Btn color="#a78bfa" bg="rgba(167,139,250,0.12)" onClick={()=>setStep("confirm")}>Send Request →</Btn>}
        </>)}
      </>)}
      {step==="confirm"&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,paddingTop:20}}>
          <div style={{fontSize:44}}>[ok]</div>
          <div style={{fontSize:18,fontWeight:800,color:"#a78bfa",textAlign:"center"}}>Request Sent</div>
          <div style={{fontSize:13,color:"#3d5268",textAlign:"center",lineHeight:1.7}}>A PST member will {method==="Text Me"?"text":"contact"} you - urgency: <span style={{color:"#a78bfa",fontWeight:700}}>{urgency}</span>.<br/><br/>Your name and number were submitted to the PST team only.</div>
          <div style={{background:"rgba(167,139,250,0.08)",border:"1.5px solid rgba(167,139,250,0.25)",borderRadius:14,padding:"16px",width:"100%",textAlign:"center"}}>
            <div style={{fontSize:13,fontWeight:700,color:"#c4b5fd",marginBottom:6}}>Want to chat now instead?</div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:14,lineHeight:1.5}}>Start an in-app message thread with your PST team. Private and secure.</div>
            <Btn color="#a78bfa" bg="rgba(167,139,250,0.12)" onClick={startChat}>Open PST Chat</Btn>
          </div>
          <Btn color="#38bdf8" onClick={()=>navigate("home")} style={{width:"100%",marginTop:4}}>Back to Home</Btn>
        </div>
      )}
      {step==="chat"&&(
        <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 160px)"}}>
          <div style={{background:"rgba(167,139,250,0.07)",border:"1px solid rgba(167,139,250,0.18)",borderRadius:12,padding:"10px 14px",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 6px rgba(34,197,94,0.6)"}}/>
              <span style={{fontSize:12,fontWeight:700,color:"#c4b5fd"}}>{requestedPST?requestedPST.name+" (PST)":"PST Member Connected"}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div onClick={()=>setChatBlurred(b=>!b)} style={{fontSize:10,fontWeight:700,color:"#475569",cursor:"pointer",padding:"4px 8px",borderRadius:6,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)"}}>
                {chatBlurred?"Unblur":"Screenshot Protect"}
              </div>
              <div onClick={()=>setShowDeleteConfirm(true)} style={{fontSize:10,fontWeight:700,color:"#ef4444",cursor:"pointer",padding:"4px 8px",borderRadius:6,background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.15)"}}>
                Delete
              </div>
            </div>
          </div>

          <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"12px 14px",marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:8}}>Optional - share your contact info so PST can reach you by phone if needed</div>
            <div style={{display:"flex",gap:8}}>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"9px 12px",fontSize:12,fontFamily:"'DM Sans',sans-serif",outline:"none",color:"#dde8f4"}}/>
              <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone number" style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"9px 12px",fontSize:12,fontFamily:"'DM Sans',sans-serif",outline:"none",color:"#dde8f4"}}/>
            </div>
            {name&&phone&&<div style={{fontSize:10,color:"#22c55e",marginTop:6,fontWeight:600}}>v PST can see your name and number in this thread</div>}
          </div>

          <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,padding:"4px 0",filter:chatBlurred?"blur(6px)":"none",transition:"filter 0.3s",userSelect:chatBlurred?"none":"auto"}}>
            {chatMessages.map((m,i)=>(
              <div key={i} style={{alignSelf:m.from==="user"?"flex-end":"flex-start",maxWidth:"82%"}}>
                <div style={{background:m.from==="user"?"rgba(167,139,250,0.18)":"rgba(255,255,255,0.05)",border:"1px solid "+(m.from==="user"?"rgba(167,139,250,0.3)":"rgba(255,255,255,0.08)"),borderRadius:m.from==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"10px 14px"}}>
                  <div style={{fontSize:13,color:m.from==="user"?"#dde8f4":"#c4b5fd",lineHeight:1.5}}>{m.text}</div>
                  <div style={{fontSize:9,color:"#334155",marginTop:4,textAlign:m.from==="user"?"right":"left"}}>{m.from==="pst"?"PST . ":""}{m.time}</div>
                </div>
              </div>
            ))}
            {pstTyping&&(
              <div style={{alignSelf:"flex-start",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"16px 16px 16px 4px",padding:"12px 16px",display:"flex",gap:5,alignItems:"center"}}>
                {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#a78bfa",opacity:0.6,animation:"pulse 1s infinite",animationDelay:i*0.2+"s"}}/>)}
              </div>
            )}
          </div>

          {chatBlurred&&(
            <div style={{textAlign:"center",padding:"8px",fontSize:11,color:"#475569"}}>
              Tap <strong style={{color:"#64748b"}}>Unblur</strong> to view messages
            </div>
          )}

          <div style={{display:"flex",gap:8,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.05)",marginTop:6}}>
            <input
              value={chatInput}
              onChange={e=>setChatInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&sendChat()}
              placeholder="Message your PST member..."
              style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(167,139,250,0.2)",borderRadius:12,padding:"12px 14px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",color:"#dde8f4"}}
            />
            <div onClick={sendChat} style={{width:44,height:44,borderRadius:12,background:"rgba(167,139,250,0.15)",border:"1.5px solid rgba(167,139,250,0.3)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </div>
          </div>

          <div style={{fontSize:10,color:"#1e3a52",textAlign:"center",marginTop:8,letterSpacing:"0.06em"}}>PRIVATE - PST TEAM ONLY - TAP "SCREENSHOT PROTECT" BEFORE SCREENSHOTTING</div>

          {showDeleteConfirm&&(
            <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:20}}>
              <div style={{background:"#0c1929",border:"1.5px solid rgba(239,68,68,0.3)",borderRadius:20,padding:"28px 22px",maxWidth:340,width:"100%",textAlign:"center"}}>
                <div style={{fontSize:32,marginBottom:12}}>🗑</div>
                <div style={{fontSize:15,fontWeight:800,color:"#f87171",marginBottom:8}}>Delete Chat Thread?</div>
                <div style={{fontSize:12,color:"#475569",lineHeight:1.6,marginBottom:20}}>This will clear the entire conversation from your device. The PST team may retain their copy per agency policy.</div>
                <div style={{display:"flex",gap:10}}>
                  <div onClick={()=>setShowDeleteConfirm(false)} style={{flex:1,padding:"12px",borderRadius:11,cursor:"pointer",textAlign:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",fontSize:13,fontWeight:700,color:"#475569"}}>Cancel</div>
                  <div onClick={()=>(setChatMessages([]),setShowDeleteConfirm(false),setStep("panel"))} style={{flex:1,padding:"12px",borderRadius:11,cursor:"pointer",textAlign:"center",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",fontSize:13,fontWeight:700,color:"#f87171"}}>Delete</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {showTipModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:20}} onClick={()=>setShowTipModal(false)}>
          <div style={{background:"#0b1829",border:"1.5px solid rgba(255,255,255,0.1)",borderRadius:20,padding:"28px 24px",maxWidth:440,width:"100%",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:18,fontWeight:800,color:"#dde8f4",marginBottom:8}}>Anonymous Wellness Check</div>
            <div style={{fontSize:13,color:"#8099b0",marginBottom:20,lineHeight:1.6}}>This request is completely anonymous. PST will know someone needs support, but not who submitted this tip or who needs help specifically. They'll proactively check on the crew.</div>
            <SLabel color="#eab308">Context (Optional)</SLabel>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
              {["Recent traumatic call","Behavioral changes noticed","Mentioned struggling","Just a feeling"].map(ctx=>(
                <div key={ctx} onClick={()=>setTipContext(ctx)} style={{padding:"12px 14px",borderRadius:10,background:tipContext===ctx?"rgba(234,179,8,0.12)":"rgba(255,255,255,0.03)",border:`1.5px solid ${tipContext===ctx?"rgba(234,179,8,0.3)":"rgba(255,255,255,0.06)"}`,cursor:"pointer",fontSize:13,color:tipContext===ctx?"#eab308":"#8099b0"}}>{ctx}</div>
              ))}
            </div>
            <SLabel color="#eab308">Urgency Level</SLabel>
            <div style={{display:"flex",gap:8,marginBottom:20}}>
              {[{label:"Routine",color:"#22c55e",desc:"General check-in"},{label:"Priority",color:"#eab308",desc:"Soon as possible"},{label:"Urgent",color:"#ef4444",desc:"Immediate attention"}].map(p=>(
                <div key={p.label} onClick={()=>setTipPriority(p.label)} style={{flex:1,padding:"10px 12px",borderRadius:10,background:tipPriority===p.label?`rgba(${p.color==="#22c55e"?"34,197,94":p.color==="#eab308"?"234,179,8":"239,68,68"},0.12)`:"rgba(255,255,255,0.03)",border:`1.5px solid ${tipPriority===p.label?p.color:"rgba(255,255,255,0.06)"}`,cursor:"pointer",textAlign:"center"}}>
                  <div style={{fontSize:12,fontWeight:700,color:p.color}}>{p.label}</div>
                  <div style={{fontSize:10,color:"#3d5268",marginTop:2}}>{p.desc}</div>
                </div>
              ))}
            </div>
            <div style={{background:"rgba(56,189,248,0.06)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:12,padding:"12px 14px",marginBottom:20}}>
              <div style={{fontSize:12,color:"#38bdf8",fontWeight:700,marginBottom:4}}>🔒 Your Privacy Protected</div>
              <div style={{fontSize:11,color:"#8099b0",lineHeight:1.6}}>* Your identity is not tracked<br/>* PST will not know who submitted this<br/>* They'll do general crew wellness checks</div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <Btn color="#64748b" bg="rgba(100,116,139,0.08)" onClick={()=>(setShowTipModal(false),setTipContext(null))} style={{flex:1}}>Cancel</Btn>
              <Btn color="#eab308" bg="rgba(234,179,8,0.12)" onClick={()=>{alert(`Anonymous wellness check submitted.\n\nPriority: ${tipPriority}\nContext: ${tipContext||"None provided"}\n\nPST team has been notified.`);setShowTipModal(false);setTipContext(null);}} style={{flex:2}}>Submit Wellness Check</Btn>
            </div>
          </div>
        </div>
      )}
    </ScreenSingle>
  );
}

// 
// SHIFT CHECK - S1 (Start) & S2 (End)
// 

