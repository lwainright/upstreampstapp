// ============================================================
// SCREEN: AIChatScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { AppHeader, Screen, ScreenSingle, Btn, Card, SLabel, DragList, NavBtn, DesktopWrap, HomeTile, ToolCard } from '../ui.jsx';
import { useLayoutConfig } from '../utils.js';
import { BoltIcon, ClockIcon, BreathIcon, HeartIcon, GaugeIcon, HomeIcon, InfoIcon, MapIcon, UserIcon, ToolsIcon, GroundIcon, JournalIcon, ResetIcon, LockIcon, BuildingIcon, TimerIcon, SettingsIcon, ShieldIcon } from '../icons.jsx';
import { trackCheckin, trackTool, trackAISession, trackPSTContact, AW_ENDPOINT, AW_PROJECT, AW_DB } from '../analytics.js';

export default function AIChatScreen({navigate,agency,userLanguage="en",userState}){
  const lc=useLayoutConfig();

  // ── Offline detection ─────────────────────────────────────────────────────
  useEffect(()=>{
    const goOnline  = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  },[]);

  // ── state ────────────────────────────────────────────────────────────────
  const OPENING_MSG={from:"ai",text:"Hey, thanks for stopping by. How are you doing today?"};
  const[messages,setMessages]=useState([OPENING_MSG]);
  const[input,setInput]=useState("");
  const[isThinking,setIsThinking]=useState(false);
  const[crisisLevel,setCrisisLevel]=useState(0);
  const[convMode,setConvMode]=useState("casual"); // casual | support | pst
  const[showCrisisCard,setShowCrisisCard]=useState(false);
  const[spiritualMode,setSpiritualMode]=useState(false);
  const[quickReplies,setQuickReplies]=useState([]);
  const[sessionSaved,setSessionSaved]=useState(false);
  const[isListening,setIsListening]=useState(false);
  const[isSpeaking,setIsSpeaking]=useState(false);
  const[autoSpeak,setAutoSpeak]=useState(false);
  const[inputMode,setInputMode]=useState("type");
  const[availableVoices,setAvailableVoices]=useState([]);
  const[selectedVoice,setSelectedVoice]=useState(null);
  const[buddyPending,setBuddyPending]=useState(false);
  const[buddyModal,setBuddyModal]=useState(false);
  const[apiError,setApiError]=useState(false);
  const[isOffline,setIsOffline]=useState(!navigator.onLine);
  const[showVoicePicker,setShowVoicePicker]=useState(false);
  const[aiName,setAiName]=useState(()=>{try{return localStorage.getItem("upstream_ai_name")||"UPSTREAM AI";}catch(e){return"UPSTREAM AI";}});
  const[editingName,setEditingName]=useState(false);
  const[nameInput,setNameInput]=useState("");
  const bottomRef=useRef(null);
  const recognitionRef=useRef(null);
  const synthRef=useRef(null);
  const textareaRef=useRef(null);

  useEffect(()=>{
    bottomRef.current&&bottomRef.current.scrollIntoView({behavior:"smooth"});
  },[messages]);

  useEffect(()=>{
    if(textareaRef.current){
      textareaRef.current.style.height="auto";
      textareaRef.current.style.height=Math.min(textareaRef.current.scrollHeight,140)+"px";
    }
  },[input]);

  // ── voices ───────────────────────────────────────────────────────────────
  useEffect(()=>{
    const loadVoices=()=>{
      const all=window.speechSynthesis.getVoices();
      const lang=userLanguage==="es"?"es":"en";
      const quality=all.filter(v=>v.lang.startsWith(lang)&&(v.name.includes("Enhanced")||v.name.includes("Premium")||v.name.includes("Neural")||v.name.includes("Siri")||v.name.includes("Google")||v.localService===true));
      const fallback=all.filter(v=>v.lang.startsWith(lang));
      const voices=quality.length>0?quality:fallback;
      setAvailableVoices(voices);
      const calm=voices.find(v=>v.name.includes("Samantha")||v.name.includes("Karen")||v.name.includes("Daniel")||v.name.includes("Google US")||v.name.includes("Google UK"));
      setSelectedVoice(prev=>prev||(calm||voices[0]||null));
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged=loadVoices;
    return()=>{window.speechSynthesis.onvoiceschanged=null;};
  },[userLanguage]);

  // ── TTS ──────────────────────────────────────────────────────────────────
  const speakResponse=(text)=>{
    window.speechSynthesis.cancel();
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang=userLanguage==="es"?"es-ES":"en-US";
    utterance.rate=0.88;utterance.pitch=1.0;utterance.volume=1.0;
    if(selectedVoice) utterance.voice=selectedVoice;
    utterance.onstart=()=>setIsSpeaking(true);
    utterance.onend=()=>setIsSpeaking(false);
    utterance.onerror=()=>setIsSpeaking(false);
    synthRef.current=utterance;
    window.speechSynthesis.speak(utterance);
  };
  const stopSpeaking=()=>{window.speechSynthesis.cancel();setIsSpeaking(false);};

  // ── STT ──────────────────────────────────────────────────────────────────
  const startVoice=()=>{
    if(!("webkitSpeechRecognition" in window||"SpeechRecognition" in window)){
      alert("Voice input not supported on this browser. Try Chrome or Safari.");return;
    }
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    const r=new SR();r.continuous=false;r.interimResults=true;
    r.lang=userLanguage==="es"?"es-ES":"en-US";
    r.onresult=(e)=>{setInput(Array.from(e.results).map(r=>r[0].transcript).join(""));};
    r.onend=()=>setIsListening(false);
    r.onerror=()=>setIsListening(false);
    r.start();recognitionRef.current=r;setIsListening(true);
  };
  const stopVoice=()=>{recognitionRef.current&&recognitionRef.current.stop();setIsListening(false);};

  // ── mode detection ───────────────────────────────────────────────────────
  const determineMode=(level,allMessages)=>{
    if(level>=3) return "pst";
    if(level>=2) return "support";
    const recentText=allMessages.filter(m=>m.from==="user").slice(-3).map(m=>m.text.toLowerCase()).join(" ");
    const supportWords=["not great","struggling","rough week","not sleeping","on edge","irritable","snapping","withdrawn","drinking more","nightmares","flashback","keeps coming back","can't shake","burned out","numb","heavy","hard lately"];
    if(supportWords.some(w=>recentText.includes(w))||level>=1) return "support";
    return "casual";
  };

  // ── quick replies by context ─────────────────────────────────────────────
  const QUICK_REPLIES={
    casual:["Just checking in","Had a rough shift","Something's been on my mind","Can't really explain it","Just needed to talk"],
    support:["It's been building for a while","I haven't been sleeping","I keep replaying it","I don't want to talk to anyone else yet","I'm doing okay, just processing"],
    pst:["I'm safe right now","I want to talk to a real person","I need resources","Can you stay with me?","I'll reach out to someone I trust"],
    resources:["Yes, show me what's nearby","Just the crisis lines for now","I'm not ready for that yet","Tell me about peer support"],
  };

  const getQuickReplies=(msgText,level,mode)=>{
    if(level>=3) return QUICK_REPLIES.pst;
    if(msgText&&(msgText.includes("resource")||msgText.includes("therapist")||msgText.includes("near you")||msgText.includes("nearby"))) return QUICK_REPLIES.resources;
    if(mode==="support"||mode==="pst") return QUICK_REPLIES.support;
    return QUICK_REPLIES.casual;
  };

  // ── system prompt ────────────────────────────────────────────────────────
  const buildSystemPrompt=(level,mode,msgCount)=>{
    const agencyCtx=agency&&agency.code
      ?`This user's agency has a peer support team (${agency.name||agency.code}). If support resources come up, mention their PST team first.`
      :"This user does not have a configured agency PST team.";
    const locationCtx=userState?`User's state: ${userState}.`:"Location unknown.";

    const modeGuide={
      casual:`You're in casual conversation mode. The person just wanted to talk — respond like a peer who happens to be knowledgeable about first responder life. Keep it light and real. Match their energy. If they're testing the app, just be normal about it — answer naturally, maybe with a bit of warmth or dry humor. Don't assume distress. Ask one easy question if it feels natural, but don't push.`,
      support:`The conversation has gotten a bit heavier. Stay warm and present. Slow down, ask one thoughtful question at a time. Don't push toward resources unless they bring it up or things get clearly heavier. You're a peer sitting with them, not running a protocol.`,
      pst:`There are signs of real distress. Be calm, steady, and clear. Safety is the priority. Acknowledge what they're feeling without amplifying it. When the moment is right, gently offer to connect them with real support — their agency PST team if available, 988, or nearby first responder resources. Stay with them. Don't rush.`,
    };

    return `You are an AI peer support companion inside Upstream Approach — a mental wellness app built specifically for first responders: paramedics, firefighters, law enforcement, dispatchers, ER staff.

YOUR CHARACTER:
You are warm, direct, and real. You talk like a peer who knows the job — not a clinician, not a chatbot. You understand shift work, gallows humor as a coping tool, the culture of pushing through, the weight of carrying calls home, and the stigma around asking for help in this profession. You do not use clinical language. You don't say "I understand that must be difficult for you." You say things like "That kind of call doesn't just stay at the scene." You can be casual, even a little dry, when the conversation calls for it.

CURRENT MODE: ${mode.toUpperCase()}
${modeGuide[mode]}

CORE PRINCIPLES (always):
- One question at a time. Never pepper someone with multiple questions.
- Meet them where they are. Don't project distress onto them.
- Short responses are often better. Read the room.
- Gallows humor and dark cop/fire/EMS humor is part of the culture — don't pathologize it.
- If faith or spiritual content comes up, hold that space with respect.
- If someone tests the app or asks something casual or technical, just answer normally. Don't pivot to emotional support unprompted.

SAFETY NET (always active, use only when warranted):
- If crisis language appears, shift naturally — don't announce the shift.
- Resources to weave in only when the moment calls for it: agency PST team first, Safe Call Now (1-206-459-3020), 988 Lifeline, First Responder Support Network (1strespondernetwork.org), Badge of Life (badgeoflife.com).
- Never dump a list of resources. Offer one or two, naturally.
- If they're in immediate danger, be clear and calm: 988 is available right now.

${agencyCtx}
${locationCtx}
Messages exchanged so far: ${msgCount}

Respond only with your reply. No labels, no formatting. Just speak.`;
  };

  // ── call Gemini via Netlify Function (key rotation) ─────────────────────
  const callAI=async(allMessages,level,mode)=>{
    setApiError(false);
    const systemPrompt=buildSystemPrompt(level,mode,allMessages.filter(m=>m.from==="user").length);
    const apiMessages=allMessages
      .filter(m=>m.from==="user"||m.from==="ai")
      .map(m=>({
        role:m.from==="user"?"user":"model",
        parts:[{text:m.text}]
      }));
    // Timeout after 12 seconds — show slow signal warning
    const controller = new AbortController();
    const timeoutId = setTimeout(()=>controller.abort(), 12000);
    
    const response=await fetch("/.netlify/functions/chat",{
      signal: controller.signal,
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        model:"gemini-2.0-flash",
        systemInstruction:{parts:[{text:systemPrompt}]},
        contents:apiMessages,
        generationConfig:{maxOutputTokens:400,temperature:0.85},
      })
    });
    clearTimeout(timeoutId);
    if(!response.ok){
      const err=await response.json().catch(()=>({}));
      throw new Error("Chat error "+response.status+(err.error?" — "+err.error:""));
    }
    const data=await response.json();
    return data.candidates&&data.candidates[0]?.content?.parts?.[0]?.text
      ?data.candidates[0].content.parts[0].text.trim()
      :null;
  };

  // ── Offline screen ───────────────────────────────────────────────────────
  const OfflineScreen = () => (
    <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 20px",textAlign:"center"}}>
      <div style={{fontSize:36,marginBottom:16}}>📵</div>
      <div style={{fontSize:16,fontWeight:700,color:"#dde8f4",marginBottom:12}}>
        Looks like the signal dropped out.
      </div>
      <div style={{fontSize:13,color:"#8099b0",lineHeight:1.7,marginBottom:24,maxWidth:320}}>
        You're offline right now, but your messages are saved locally. You can keep typing, and I'll catch right back up as soon as we're back in range. In the meantime, I'm still here with the tools already on your device.
      </div>
      
      <div style={{width:"100%",maxWidth:320}}>
        <div style={{fontSize:10,fontWeight:800,color:"#3d5268",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:12}}>
          Works without signal
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
          {[
            {icon:"🫁",label:"Box Breathing",screen:"breathing"},
            {icon:"🌿",label:"Grounding Exercise",screen:"grounding"},
            {icon:"📓",label:"Journal",screen:"journal"},
            {icon:"🔄",label:"After Action Reset",screen:"afteraction"},
          ].map((t,i)=>(
            <div key={i} onClick={()=>navigate(t.screen)}
              style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,cursor:"pointer"}}>
              <span style={{fontSize:20}}>{t.icon}</span>
              <span style={{fontSize:13,fontWeight:600,color:"#8099b0"}}>{t.label}</span>
              <span style={{marginLeft:"auto",color:"#3d5268",fontSize:12}}>→</span>
            </div>
          ))}
        </div>

        <div style={{fontSize:10,fontWeight:800,color:"#3d5268",letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:12}}>
          Need to talk to someone now?
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <a href="tel:12064593020" style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"rgba(56,189,248,0.06)",border:"1px solid rgba(56,189,248,0.2)",borderRadius:12,textDecoration:"none"}}>
            <span style={{fontSize:18}}>📞</span>
            <div style={{textAlign:"left"}}>
              <div style={{fontSize:12,fontWeight:700,color:"#38bdf8"}}>Safe Call Now</div>
              <div style={{fontSize:11,color:"#3d5268"}}>1-206-459-3020 · 24/7</div>
            </div>
          </a>
          <a href="tel:988" style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:12,textDecoration:"none"}}>
            <span style={{fontSize:18}}>🆘</span>
            <div style={{textAlign:"left"}}>
              <div style={{fontSize:12,fontWeight:700,color:"#ef4444"}}>988 Lifeline</div>
              <div style={{fontSize:11,color:"#3d5268"}}>Call or Text · 24/7</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );

  // ── send ─────────────────────────────────────────────────────────────────
  const send=async()=>{
    if(!input.trim()||isThinking) return;
    
    // Check signal before attempting AI call
    if(!navigator.onLine){
      setIsOffline(true);
      return;
    }
    const userText=input.trim();
    const level=detectLevel(userText);
    const isSpiritual=detectSpiritual(userText);
    if(isSpiritual&&!spiritualMode) setSpiritualMode(true);

    const newMessages=[...messages,{from:"user",text:userText}];
    setMessages(newMessages);
    setInput("");
    setQuickReplies([]);
    setIsThinking(true);

    const newLevel=Math.max(level,crisisLevel);
    if(level>crisisLevel){
      setCrisisLevel(newLevel);
      if(level>=2&&!showCrisisCard) setTimeout(()=>setShowCrisisCard(true),1500);
      if(level>=2&&!buddyPending){
        setBuddyPending(true);
        setTimeout(()=>setBuddyModal(true),300000); // 5 min — less abrupt than before
      }
    }

    const newMode=determineMode(newLevel,newMessages);
    if(newMode!==convMode) setConvMode(newMode);

    trackAISession((agency&&agency.code),newLevel,newMessages.filter(m=>m.from==="user").length);

    try{
      const reply=await callAI(newMessages,newLevel,newMode);
      if(reply){
        setMessages(prev=>[...prev,{from:"ai",text:reply}]);
        setQuickReplies(getQuickReplies(reply,newLevel,newMode));
        if(inputMode==="voice"||autoSpeak) speakResponse(reply);
      } else {
        throw new Error("empty response");
      }
    }catch(err){
      setApiError(true);
      // Neutral fallback — not crisis-toned
      const fallbacks=[
        "I'm here — keep going.",
        "Yeah, I'm listening.",
        "Go ahead, I'm with you.",
        "I hear you. What else?",
      ];
      const fallback=fallbacks[Math.floor(Math.random()*fallbacks.length)];
      setMessages(prev=>[...prev,{from:"ai",text:fallback}]);
      setQuickReplies(getQuickReplies(fallback,newLevel,newMode));
    }finally{
      setIsThinking(false);
    }
  };

  // ── save session to journal ──────────────────────────────────────────────
  const saveSession=()=>{
    if(messages.length<3||sessionSaved) return;
    const userMsgs=messages.filter(m=>m.from==="user").map(m=>m.text).join(" | ");
    const entry={
      text:"[AI Chat] "+userMsgs.substring(0,300)+(userMsgs.length>300?"...":""),
      mode:"text",date:new Date().toLocaleString(),
      prompt:"AI Chat Session",anonymous:true,
      type:"ai_chat",ephemeral:false,
      crisis:crisisLevel>=3,fromSession:true,
    };
    try{
      const existing=JSON.parse(localStorage.getItem("upstream_journal")||"[]");
      localStorage.setItem("upstream_journal",JSON.stringify([entry,...existing]));
      setSessionSaved(true);
    }catch(e){}
  };

  const lev=LEVEL_CONFIG[crisisLevel]||null;

  // ── render ───────────────────────────────────────────────────────────────
  return(
    <ScreenSingle headerProps={{onBack:()=>navigate("home"),title:"Chat",agencyName:(agency&&agency.name)}}>
      {/* messages */}
      <div style={{display:"flex",flexDirection:"column",gap:12,paddingBottom:8}}>
        {messages.map((m,i)=>(
          <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.from==="user"?"flex-end":"flex-start"}}>
            {m.from==="ai"&&(
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                <div style={{fontSize:10,color:"#2d4a66",fontWeight:700,letterSpacing:"0.1em"}}>{aiName}</div>
                {i===0&&!editingName&&(
                  <div onClick={()=>{setNameInput(aiName);setEditingName(true);}}
                    style={{fontSize:9,color:"#1e3a52",cursor:"pointer",letterSpacing:"0.06em",textDecoration:"underline",textDecorationStyle:"dotted"}}>rename</div>
                )}
              </div>
            )}
            <div style={{
              maxWidth:"84%",
              background:m.from==="user"?"rgba(56,189,248,0.12)":"rgba(255,255,255,0.04)",
              border:m.from==="user"?"1px solid rgba(56,189,248,0.25)":"1px solid rgba(255,255,255,0.07)",
              borderRadius:m.from==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",
              padding:"11px 14px",
              fontSize:14,
              color:m.from==="user"?"#bae6fd":"#c8dae8",
              lineHeight:1.6,
            }}>{m.text}</div>
          </div>
        ))}

        {/* inline rename */}
      {editingName&&(
        <div style={{display:"flex",gap:8,alignItems:"center",padding:"8px 12px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10}}>
          <input
            autoFocus
            value={nameInput}
            onChange={e=>setNameInput(e.target.value.slice(0,24))}
            onKeyDown={e=>{
              if(e.key==="Enter"){
                const n=nameInput.trim()||"UPSTREAM AI";
                setAiName(n);
                try{localStorage.setItem("upstream_ai_name",n);}catch(err){}
                setEditingName(false);
              }
              if(e.key==="Escape") setEditingName(false);
            }}
            placeholder="Name this AI..."
            maxLength={24}
            style={{flex:1,background:"transparent",border:"none",outline:"none",color:"#dde8f4",fontSize:13,fontFamily:"inherit"}}
          />
          <div onClick={()=>{
            const n=nameInput.trim()||"UPSTREAM AI";
            setAiName(n);
            try{localStorage.setItem("upstream_ai_name",n);}catch(err){}
            setEditingName(false);
          }} style={{fontSize:12,color:"#38bdf8",cursor:"pointer",fontWeight:700,flexShrink:0}}>Save</div>
          <div onClick={()=>setEditingName(false)} style={{fontSize:12,color:"#334155",cursor:"pointer",flexShrink:0}}>Cancel</div>
        </div>
      )}

      {/* thinking indicator */}
        {isThinking&&(
          <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"18px 18px 18px 4px",padding:"12px 16px",display:"flex",gap:5,alignItems:"center"}}>
              {[0,1,2].map(i=>(
                <div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#38bdf8",opacity:0.6,animation:"pulse 1.2s ease-in-out infinite",animationDelay:`${i*0.2}s`}}/>
              ))}
            </div>
          </div>
        )}

        {/* Offline screen */}
      {isOffline && <OfflineScreen/>}
      
      {/* api error notice — dev visibility */}
        {apiError&&(
          <div style={{fontSize:11,color:"#475569",textAlign:"center",padding:"4px 0"}}>
            Connection issue — responses may be limited
          </div>
        )}

        <div ref={bottomRef}/>
      </div>

      {/* quick replies */}
      {!isOffline&&quickReplies.length>0&&!isThinking&&(
        <div style={{display:"flex",flexWrap:"wrap",gap:8,paddingBottom:4}}>
          {quickReplies.slice(0,4).map((r,i)=>(
            <div key={i} onClick={()=>{setInput(r);setQuickReplies([]);}}
              style={{padding:"7px 13px",borderRadius:20,background:"rgba(56,189,248,0.06)",border:"1px solid rgba(56,189,248,0.18)",fontSize:12,color:"#7dd3fc",cursor:"pointer",lineHeight:1.4}}>
              {r}
            </div>
          ))}
        </div>
      )}

      {/* crisis card — surfaces only when warranted */}
      {showCrisisCard&&lev&&crisisLevel>=2&&(
        <div style={{background:lev.bg,border:`1.5px solid ${lev.border}`,borderRadius:16,padding:"16px"}}>
          <div style={{fontSize:12,color:lev.color,fontWeight:800,marginBottom:6}}>{lev.label}</div>
          <div style={{fontSize:13,color:"#8099b0",marginBottom:12,lineHeight:1.6}}>You don't have to carry this alone. Real support is available.</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {agency?(
              <div onClick={()=>navigate("humanpst")} style={{background:"rgba(167,139,250,0.12)",border:"1px solid rgba(167,139,250,0.3)",borderRadius:12,padding:"11px 14px",cursor:"pointer",fontSize:13,fontWeight:700,color:"#c4b5fd"}}>Talk to a Human PST Member</div>
            ):(
              <div onClick={()=>navigate("agencycode")} style={{background:"rgba(56,189,248,0.08)",border:"1px solid rgba(56,189,248,0.2)",borderRadius:12,padding:"11px 14px",cursor:"pointer",fontSize:13,fontWeight:700,color:"#7dd3fc"}}>Connect with Peer Support</div>
            )}
            <div onClick={()=>window.location.href="tel:988"} style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:12,padding:"11px 14px",cursor:"pointer",fontSize:13,fontWeight:700,color:"#f87171"}}>Call 988 — Crisis Lifeline</div>
            <div onClick={()=>navigate("resources")} style={{background:"rgba(56,189,248,0.06)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:12,padding:"11px 14px",cursor:"pointer",fontSize:13,fontWeight:700,color:"#7dd3fc"}}>View Resources</div>
            <div onClick={()=>setShowCrisisCard(false)} style={{textAlign:"center",fontSize:12,color:"#2d4a66",cursor:"pointer",padding:8}}>Continue talking</div>
          </div>
        </div>
      )}

      {/* spiritual mode card */}
      {spiritualMode&&!showCrisisCard&&messages.length>1&&(
        <div style={{background:"rgba(167,139,250,0.06)",border:"1px solid rgba(167,139,250,0.15)",borderRadius:14,padding:"14px"}}>
          <div style={{fontSize:12,color:"#a78bfa",fontWeight:700,marginBottom:6}}>Faith-based support available</div>
          <div style={{fontSize:12,color:"#3d5268",lineHeight:1.65,marginBottom:10}}>If you'd like to talk with someone who understands both the job and matters of faith, your PST team may include chaplain-trained members.</div>
          {agency&&<div onClick={()=>navigate("humanpst")} style={{background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.22)",borderRadius:12,padding:"10px 14px",cursor:"pointer",fontSize:13,fontWeight:700,color:"#c4b5fd",marginBottom:6}}>Contact Human PST</div>}
          <div onClick={()=>setSpiritualMode(false)} style={{textAlign:"center",fontSize:12,color:"#2d4a66",cursor:"pointer",padding:6}}>Continue here</div>
        </div>
      )}

      {/* input */}
      {inputMode==="type"?(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey&&!isThinking){e.preventDefault();send();}}}
              placeholder={isThinking?"...":"Say something"}
              disabled={isThinking}
              rows={1}
              style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1.5px solid rgba(56,189,248,0.18)",borderRadius:12,padding:"12px 14px",color:"#dde8f4",fontSize:14,outline:"none",opacity:isThinking?0.5:1,resize:"none",lineHeight:1.5,overflow:"hidden",fontFamily:"inherit"}}
            />
            <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
              <div onClick={!isThinking?send:undefined}
                style={{width:46,height:46,borderRadius:12,background:isThinking?"rgba(56,189,248,0.04)":"rgba(56,189,248,0.14)",border:"1px solid rgba(56,189,248,0.28)",display:"flex",alignItems:"center",justifyContent:"center",cursor:isThinking?"default":"pointer",opacity:isThinking?0.4:1}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <div onClick={()=>setInputMode("voice")}
              style={{flex:1,height:36,borderRadius:10,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer",fontSize:12,color:"#64748b",fontWeight:600}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
              Voice
            </div>
            <div onClick={()=>setAutoSpeak(a=>!a)}
              title={autoSpeak?"Read aloud: ON":"Read aloud: OFF"}
              style={{flex:1,height:36,borderRadius:10,background:autoSpeak?"rgba(167,139,250,0.12)":"rgba(255,255,255,0.04)",border:"1px solid "+(autoSpeak?"rgba(167,139,250,0.3)":"rgba(255,255,255,0.08)"),display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer",fontSize:12,color:autoSpeak?"#a78bfa":"#64748b",fontWeight:600}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              {autoSpeak?"Read aloud: on":"Read aloud"}
            </div>
            <div onClick={()=>setShowVoicePicker(v=>!v)}
              style={{height:36,paddingInline:10,borderRadius:10,background:showVoicePicker?"rgba(56,189,248,0.12)":"rgba(255,255,255,0.04)",border:"1px solid "+(showVoicePicker?"rgba(56,189,248,0.3)":"rgba(255,255,255,0.08)"),display:"flex",alignItems:"center",justifyContent:"center",gap:5,cursor:"pointer",fontSize:12,color:showVoicePicker?"#38bdf8":"#64748b",fontWeight:600,flexShrink:0}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="9"/></svg>
              Voice
            </div>
            {isSpeaking&&<div onClick={stopSpeaking}
              style={{height:36,paddingInline:12,borderRadius:10,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:12,color:"#f87171",fontWeight:600,gap:5}}>
              <div style={{display:"flex",gap:2}}>{[1,2,3].map(i=><div key={i} style={{width:2,height:6+i*2,background:"#f87171",borderRadius:1}}/>)}</div>Stop
            </div>}
          </div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {input&&<div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#c8dae8"}}>{input}</div>}
          <div style={{display:"flex",gap:10}}>
            <div onClick={isListening?stopVoice:startVoice}
              style={{flex:1,height:52,borderRadius:14,background:isListening?"rgba(239,68,68,0.15)":"rgba(56,189,248,0.1)",border:"1.5px solid "+(isListening?"rgba(239,68,68,0.4)":"rgba(56,189,248,0.25)"),display:"flex",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",fontSize:13,fontWeight:700,color:isListening?"#f87171":"#38bdf8"}}>
              {isListening?(<><div style={{display:"flex",gap:3}}>{[1,2,3,4].map(i=><div key={i} style={{width:3,height:8+i*2,background:"#f87171",borderRadius:2}}/>)}</div>Stop</>):(<><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>Speak</>)}
            </div>
            {input&&<div onClick={!isThinking?send:undefined}
              style={{width:52,height:52,borderRadius:14,background:"rgba(56,189,248,0.14)",border:"1.5px solid rgba(56,189,248,0.3)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </div>}
            <div onClick={()=>setInputMode("type")}
              style={{width:52,height:52,borderRadius:14,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
          </div>
        </div>
      )}

      {/* voice picker dropdown */}
      {showVoicePicker&&(
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"12px 14px"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#475569",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Select voice</div>
          {availableVoices.length===0&&(
            <div style={{fontSize:12,color:"#334155"}}>No voices found. Try Chrome or Safari for best results.</div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:180,overflowY:"auto"}}>
            {availableVoices.map((v,i)=>{
              const isSelected=selectedVoice&&selectedVoice.name===v.name;
              return(
                <div key={i} onClick={()=>{setSelectedVoice(v);speakResponse("Hey, this is what I sound like.");}}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,background:isSelected?"rgba(56,189,248,0.1)":"rgba(255,255,255,0.02)",border:"1px solid "+(isSelected?"rgba(56,189,248,0.25)":"rgba(255,255,255,0.05)"),cursor:"pointer"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:isSelected?700:400,color:isSelected?"#7dd3fc":"#94a3b8"}}>{v.name}</div>
                    <div style={{fontSize:11,color:"#334155",marginTop:1}}>{v.lang}{v.localService?" · on device":""}</div>
                  </div>
                  {isSelected&&<div style={{width:6,height:6,borderRadius:"50%",background:"#38bdf8",flexShrink:0}}/>}
                </div>
              );
            })}
          </div>
          <div style={{fontSize:11,color:"#1e3a52",marginTop:8,textAlign:"center"}}>Tap a voice to preview it</div>
        </div>
      )}

      {/* bottom actions */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div onClick={()=>navigate("tools")}
          style={{background:"rgba(34,197,94,0.07)",border:"1px solid rgba(34,197,94,0.16)",borderRadius:12,padding:"12px",textAlign:"center",cursor:"pointer",fontSize:12,fontWeight:700,color:"#22c55e"}}>
          Coping Tools
        </div>
        <div onClick={saveSession}
          style={{background:sessionSaved?"rgba(56,189,248,0.04)":"rgba(56,189,248,0.07)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:12,padding:"12px",textAlign:"center",cursor:sessionSaved?"default":"pointer",fontSize:12,fontWeight:700,color:sessionSaved?"#2d4a66":"#38bdf8"}}>
          {sessionSaved?"Saved to Journal":"Save to Journal"}
        </div>
      </div>

      <div style={{fontSize:10,color:"#1e3a52",textAlign:"center",letterSpacing:"0.06em"}}>STORED ON DEVICE ONLY · ANONYMOUS</div>

      {/* buddy check modal */}
      {buddyModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20}}>
          <div style={{background:"#0c1a2e",border:"1.5px solid rgba(56,189,248,0.25)",borderRadius:20,padding:24,maxWidth:320,width:"100%"}}>
            <div style={{fontSize:22,textAlign:"center",marginBottom:10}}>👋</div>
            <div style={{fontSize:16,fontWeight:800,color:"#dde8f4",textAlign:"center",marginBottom:8}}>Still with you</div>
            <div style={{fontSize:13,color:"#3d5268",textAlign:"center",lineHeight:1.6,marginBottom:20}}>You've been here a while. How are you doing — would it help to talk to a real person?</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div onClick={()=>setBuddyModal(false)} style={{background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.25)",borderRadius:12,padding:"12px",cursor:"pointer",textAlign:"center",fontSize:13,fontWeight:700,color:"#22c55e"}}>I'm okay, keep going</div>
              <div onClick={()=>(setBuddyModal(false),agency?navigate("humanpst"):navigate("agencycode"))} style={{background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.25)",borderRadius:12,padding:"12px",cursor:"pointer",textAlign:"center",fontSize:13,fontWeight:700,color:"#c4b5fd"}}>Talk to a real person</div>
              <div onClick={()=>(setBuddyModal(false),window.location.href="tel:988")} style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:12,padding:"12px",cursor:"pointer",textAlign:"center",fontSize:13,fontWeight:700,color:"#f87171"}}>Call 988</div>
            </div>
          </div>
        </div>
      )}
    </ScreenSingle>
  );
}

// 
// HUMAN PST
// 

