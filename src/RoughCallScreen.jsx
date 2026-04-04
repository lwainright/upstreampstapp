// ============================================================
// SCREEN: RoughCallScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { AppHeader, Screen, ScreenSingle, Btn, Card, SLabel, DragList, NavBtn, DesktopWrap, HomeTile, ToolCard } from './ui.jsx';
import { BoltIcon, ClockIcon, BreathIcon, HeartIcon, GaugeIcon, HomeIcon, InfoIcon, MapIcon, UserIcon, ToolsIcon, GroundIcon, JournalIcon, ResetIcon, LockIcon, BuildingIcon, TimerIcon, SettingsIcon, ShieldIcon } from './icons.jsx';
import { trackCheckin, trackTool, trackAISession, trackPSTContact, AW_ENDPOINT, AW_PROJECT, AW_DB } from './analytics.js';
import { useLayoutConfig, getContractStatus, getCodeStatus, getContractBanner, detectSpiritual, detectLevel } from './utils.js';

export default function RoughCallScreen({navigate,agency,userLanguage="en",userState}){
  // ── state ──────────────────────────────────────────────────────
  const[phase,setPhase]=useState("moodcheck"); // moodcheck | chat | followup
  const[moodBefore,setMoodBefore]=useState(null);
  const[messages,setMessages]=useState([]);
  const[input,setInput]=useState("");
  const[inputMode,setInputMode]=useState("type");
  const[isListening,setIsListening]=useState(false);
  const[isSpeaking,setIsSpeaking]=useState(false);
  const[autoSpeak,setAutoSpeak]=useState(false);
  const[showVoicePicker,setShowVoicePicker]=useState(false);
  const[aiName,setAiName]=useState(()=>{try{return localStorage.getItem("upstream_ai_name")||"UPSTREAM AI";}catch(e){return"UPSTREAM AI";}});
  const[editingName,setEditingName]=useState(false);
  const[nameInput,setNameInput]=useState("");
  const[availableVoices,setAvailableVoices]=useState([]);
  const[selectedVoice,setSelectedVoice]=useState(null);
  const[speakingMsgIdx,setSpeakingMsgIdx]=useState(null);
  const[crisisLevel,setCrisisLevel]=useState(0);
  const[showCrisisCard,setShowCrisisCard]=useState(false);
  const[buddyPending,setBuddyPending]=useState(false);
  const[buddyModal,setBuddyModal]=useState(false);
  const[spiritualMode,setSpiritualMode]=useState(false);
  const[quickReplies,setQuickReplies]=useState([]);
  const[sessionSaved,setSessionSaved]=useState(false);
  const bottomRef=useRef(null);
  const recognitionRef=useRef(null);
  const synthRef=useRef(null);
  const lc=useLayoutConfig();

  useEffect(()=>{bottomRef.current&&bottomRef.current.scrollIntoView({behavior:"smooth"});},[messages]);

  // ── voices ──────────────────────────────────────────────────────
  useEffect(()=>{
    const loadVoices=()=>{
      const all=window.speechSynthesis.getVoices();
      const lang=userLanguage==="es"?"es":"en";
      const quality=all.filter(v=>v.lang.startsWith(lang)&&(v.name.includes("Enhanced")||v.name.includes("Premium")||v.name.includes("Neural")||v.name.includes("Natural")||v.name.includes("Siri")||v.name.includes("Google")||v.localService===true));
      const fallback=all.filter(v=>v.lang.startsWith(lang));
      const voices=quality.length>0?quality:fallback;
      setAvailableVoices(voices);
      const calm=voices.find(v=>v.name.includes("Samantha")||v.name.includes("Karen")||v.name.includes("Moira")||v.name.includes("Tessa")||v.name.includes("Alex")||v.name.includes("Daniel")||v.name.includes("Google US")||v.name.includes("Google UK"));
      setSelectedVoice(prev=>prev||(calm||voices[0]||null));
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged=loadVoices;
    return()=>{window.speechSynthesis.onvoiceschanged=null;};
  },[userLanguage]);

  // ── TTS ──────────────────────────────────────────────────────────
  const speakResponse=(text,idx)=>{
    window.speechSynthesis.cancel();
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang=userLanguage==="es"?"es-ES":"en-US";
    utterance.rate=0.88;utterance.pitch=1.0;utterance.volume=1.0;
    if(selectedVoice) utterance.voice=selectedVoice;
    utterance.onstart=()=>{setIsSpeaking(true);if(idx!==undefined)setSpeakingMsgIdx(idx);};
    utterance.onend=()=>{setIsSpeaking(false);setSpeakingMsgIdx(null);};
    utterance.onerror=()=>{setIsSpeaking(false);setSpeakingMsgIdx(null);};
    synthRef.current=utterance;
    window.speechSynthesis.speak(utterance);
  };
  const stopSpeaking=()=>{window.speechSynthesis.cancel();setIsSpeaking(false);setSpeakingMsgIdx(null);};

  // ── STT ──────────────────────────────────────────────────────────
  const startVoice=()=>{
    if(!("webkitSpeechRecognition" in window||"SpeechRecognition" in window)){alert("Voice input not supported on this browser. Try Chrome or Safari.");return;}
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    const r=new SR();r.continuous=false;r.interimResults=true;r.lang=userLanguage==="es"?"es-ES":"en-US";
    r.onresult=(e)=>{setInput(Array.from(e.results).map(r=>r[0].transcript).join(""));};
    r.onend=()=>setIsListening(false);r.onerror=()=>setIsListening(false);
    r.start();recognitionRef.current=r;setIsListening(true);
  };
  const stopVoice=()=>{recognitionRef.current&&recognitionRef.current.stop();setIsListening(false);};

  // ── conversation mode tracking ───────────────────────────────────
  const[convMode,setConvMode]=useState("companion"); // companion | elevated | pst
  const[isThinking,setIsThinking]=useState(false);
  const[resourcesOffered,setResourcesOffered]=useState(false);

  // ── quick reply pools by context ─────────────────────────────────
  const QUICK_REPLIES={
    general:["I'm not sure where to start","It was a rough call","I'm feeling overwhelmed","I just need to vent","I haven't been sleeping","I keep replaying it"],
    after_rough:["Tell me more about that","What's hitting hardest?","I'm doing okay, just processing","It's been building for a while","I don't want to talk to anyone yet","Can I just sit with this?"],
    after_crisis:["I want to talk to a real person","I'm safe right now","I need resources","Can you stay with me?","I'll reach out to someone I trust"],
    after_ai:["That's helpful","I hadn't thought of it that way","What should I do next?","I want to try a breathing reset","I want to write this down"],
    resources:["Yes, show me what's nearby","Just the crisis lines for now","I'm not ready for that yet","Tell me about peer support"],
  };

  const getQuickReplies=(msgText,level)=>{
    if(level>=3) return QUICK_REPLIES.after_crisis;
    if(messages.length<=1) return QUICK_REPLIES.general;
    if(msgText&&(msgText.includes("resource")||msgText.includes("therapist")||msgText.includes("nearby")||msgText.includes("near you"))) return QUICK_REPLIES.resources;
    if(msgText&&(msgText.includes("rough")||msgText.includes("hard")||msgText.includes("heavy"))) return QUICK_REPLIES.after_rough;
    return QUICK_REPLIES.after_ai;
  };

  // ── build system prompt ───────────────────────────────────────────
  const buildSystemPrompt=(currentCrisisLevel,currentConvMode,msgCount)=>{
    const location=userState?"Their state: "+userState+". ":"Location unknown. ";
    const agencyCtx=agency&&agency.code
      ? `This user's agency has a peer support team. Agency: ${agency.name||agency.code}. You can reference connecting them to their own PST team as the first option when offering support resources.`
      : "This user does not have a configured agency PST team.";

    const modeInstructions={
      companion:`You are in COMPANION MODE. Keep it natural and warm. Be present. Ask one good question at a time. Don't push toward resources unless the user brings it up or the conversation clearly gets heavier. You're a peer having a real conversation, not running a protocol.`,
      elevated:`You are in ELEVATED MODE. The conversation has gotten heavier. Lean in with more intentional questions. You can gently acknowledge the weight of what they're sharing. If it feels right and you haven't already, you may offer to share some support resources nearby — but only if the moment calls for it. Don't force it. One question at a time.`,
      pst:`You are in PST SUPPORT MODE. There are signs of real distress. Be calm, steady, and direct. Safety is the priority. Acknowledge what they're feeling without amplifying it. At the right moment, gently but clearly offer to connect them with real support — their agency PST team if available, or nearby first responder resources. You can also mention that 988 is available 24/7 if they need it right now. Stay with them.`
    };

    const resourceContext=`
RESOURCES YOU CAN OFFER (weave these in naturally, never dump a list):
- Agency PST team first if agency code is set
- Safe Call Now: 1-206-459-3020 (first responder specific, 24/7)
- First Responder Support Network: 1strespondernetwork.org
- 988 Suicide & Crisis Lifeline (call or text)
- Badge of Life: badgeoflife.com
- First responder therapists near them — you can offer to search for those specifically
- ${location}Use their state/region when suggesting local resources

RESOURCE OFFERING RULES:
- Never dump a list of resources unprompted
- If the conversation is heavy but they haven't asked, you may say something like: "Would it be helpful if I pointed you toward some peer support or counseling resources near you?"
- If they say yes or ask for resources, share 1-2 specific ones that fit their situation
- Always prioritize: 1) Agency PST team, 2) First responder specific resources, 3) Crisis lines
- If they ask about therapists nearby, tell them you can search for first responder specialists in their area and offer to do that`;

    return `You are an AI peer support companion inside the Upstream Approach app — a mental wellness platform built specifically for first responders (paramedics, firefighters, law enforcement, dispatchers, ER staff).

YOUR CHARACTER:
You are warm, direct, and real. You speak like a peer who has been around the job — not a clinician, not a chatbot. You understand shift work, dark humor as a coping tool, the culture of "pushing through," the weight of carrying calls home, and the stigma around asking for help in this profession. You do not use clinical language. You do not say things like "I understand that must be difficult." You say things like "That kind of call doesn't just stay at the scene."

YOUR CORE PRINCIPLES:
- One question at a time. Never pepper someone with multiple questions.
- Meet them where they are. Don't push toward resources unless the moment calls for it.
- Don't minimize. Don't fix. Listen first.
- If someone is in crisis, be calm and clear. Don't panic, don't overwhelm.
- Short responses are often better than long ones. Read the room.
- You can acknowledge dark or gallows humor — that's part of the culture. Don't pathologize it.
- Spiritual content is welcome. If faith comes up, hold that space without judgment.

${modeInstructions[currentConvMode]}

${agencyCtx}
${resourceContext}

CONVERSATION CONTEXT:
- Mood check-in: ${moodBefore||"not recorded"}
- Messages so far: ${msgCount}
- This is anonymous. No names, no identifying info stored.

Respond only with your reply text. No labels, no formatting, no preamble. Just speak.`;
  };

  // ── call Gemini API ───────────────────────────────────────────────
  const callClaude=async(allMessages,currentCrisisLevel,currentConvMode)=>{
    const systemPrompt=buildSystemPrompt(currentCrisisLevel,currentConvMode,allMessages.filter(m=>m.from==="user").length);
    const apiMessages=allMessages
      .filter(m=>m.from==="user"||m.from==="ai")
      .map(m=>({
        role:m.from==="user"?"user":"model",
        parts:[{text:m.text}]
      }));
    const response=await fetch("/.netlify/functions/chat",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        model:"gemini-2.0-flash",
        systemInstruction:{parts:[{text:systemPrompt}]},
        contents:apiMessages,
        generationConfig:{maxOutputTokens:400,temperature:0.85},
      })
    });
    if(!response.ok){
      const err=await response.json().catch(()=>({}));
      throw new Error("Chat error "+response.status+(err.error?" — "+err.error:""));
    }
    const data=await response.json();
    return data.candidates&&data.candidates[0]?.content?.parts?.[0]?.text
      ?data.candidates[0].content.parts[0].text.trim()
      :"I'm here. Take your time.";
  };

  // ── determine conversation mode from context ──────────────────────
  const determineMode=(level,msgCount,allMessages)=>{
    if(level>=3) return "pst";
    if(level>=2) return "elevated";
    // Check last few user messages for escalating themes
    const recentUserText=allMessages.filter(m=>m.from==="user").slice(-3).map(m=>m.text.toLowerCase()).join(" ");
    const heavyWords=["can't stop","nightmare","drinking","can't sleep","not okay","falling apart","breaking","numb","nothing matters","don't care anymore","exhausted","done","over it","hopeless","alone","nobody","suicide","hurt myself","end it"];
    const elevatedWords=["not great","struggling","hard lately","rough week","not sleeping","on edge","irritable","snapping","withdrawn","isolating","drinking more","nightmares","flashback","keeps coming back","can't shake it"];
    if(heavyWords.some(w=>recentUserText.includes(w))) return "pst";
    if(elevatedWords.some(w=>recentUserText.includes(w))||level>=1||msgCount>=6) return "elevated";
    return "companion";
  };

  // ── send ─────────────────────────────────────────────────────────
  const send=async()=>{
    if(!input.trim()||isThinking)return;
    const userText=input.trim();
    const level=detectLevel(userText);
    const isSpiritual=detectSpiritual(userText);
    if(isSpiritual&&!spiritualMode) setSpiritualMode(true);
    const newMessages=[...messages,{from:"user",text:userText}];
    setMessages(newMessages);
    setQuickReplies([]);
    setInput("");
    setIsThinking(true);
    const newCrisisLevel=Math.max(level,crisisLevel);
    if(level>crisisLevel){
      setCrisisLevel(newCrisisLevel);
      if(level>=2){setTimeout(()=>setShowCrisisCard(true),1200);if(!buddyPending){setBuddyPending(true);setTimeout(()=>setBuddyModal(true),180000);}}
    }
    trackAISession((agency&&agency.code),newCrisisLevel,newMessages.filter(m=>m.from==="user").length);
    const newMode=determineMode(newCrisisLevel,newMessages.filter(m=>m.from==="user").length,newMessages);
    if(newMode!==convMode) setConvMode(newMode);
    try{
      const reply=await callClaude(newMessages,newCrisisLevel,newMode);
      setMessages(prev=>[...prev,{from:"ai",text:reply}]);
      setQuickReplies(getQuickReplies(reply,newCrisisLevel));
      if(inputMode==="voice"||autoSpeak){const msgIdx=newMessages.length+1;setTimeout(()=>speakResponse(reply,msgIdx),100);}
    }catch(err){
      // Graceful fallback if API fails
      const fallbacks=["I'm here. Take your time.","You don't have to figure this out alone.","I hear you. What's hitting hardest right now?","That sounds like a lot to carry. I'm listening."];
      const fallback=fallbacks[Math.floor(Math.random()*fallbacks.length)];
      setMessages(prev=>[...prev,{from:"ai",text:fallback}]);
      setQuickReplies(getQuickReplies(fallback,newCrisisLevel));
    }finally{
      setIsThinking(false);
    }
  };

  const handleQuickReply=(text)=>{setInput(text);setQuickReplies([]);};

  // ── session → journal ─────────────────────────────────────────────
  const saveSessionToJournal=()=>{
    if(messages.length<2||sessionSaved) return;
    const userMsgs=messages.filter(m=>m.from==="user").map(m=>m.text).join(" | ");
    const summary="[AI PST Session] Mood before: "+(moodBefore||"not set")+". "+
      "Messages exchanged: "+messages.length+". "+
      "What I shared: "+userMsgs.substring(0,300)+(userMsgs.length>300?"...":"");
    const newEntry={text:summary,mode:"text",date:new Date().toLocaleString(),prompt:"AI Peer Support Session",anonymous:true,type:"rough_call",ephemeral:false,crisis:crisisLevel>=3,fromSession:true};
    try{
      const existing=JSON.parse(localStorage.getItem("upstream_journal")||"[]");
      localStorage.setItem("upstream_journal",JSON.stringify([newEntry,...existing]));
      setSessionSaved(true);
    }catch(e){}
  };

  // ── follow-up prompts ─────────────────────────────────────────────
  const FOLLOWUP=[
    {icon:"📓",label:"Write it down",sub:"Save a journal entry about this",action:()=>{saveSessionToJournal();navigate("journal");}},
    {icon:"💨",label:"Breathing reset",sub:"60-second box breathing",action:()=>navigate("breathing")},
    {icon:"🤝",label:"Talk to someone",sub:agency?"Contact your Human PST":"Find peer support",action:()=>navigate(agency?"humanpst":"agencycode")},
    {icon:"📞",label:"Crisis line",sub:"988 - free, confidential, 24/7",action:()=>{window.location.href="tel:988";}},
  ];

  // ── mood options ──────────────────────────────────────────────────
  const MOODS=[
    {label:"I'm good",sub:"Just checking in",color:"#22c55e",emoji:"🟢"},
    {label:"Striving",sub:"Getting through it",color:"#eab308",emoji:"🟡"},
    {label:"Not great",sub:"Could use support",color:"#f97316",emoji:"🟠"},
    {label:"Struggling",sub:"It's been heavy",color:"#ef4444",emoji:"🔴"},
    {label:"In crisis",sub:"I need help now",color:"#7c3aed",emoji:"🆘"},
  ];

  const startChat=(mood)=>{
    setMoodBefore(mood.label);
    setPhase("chat");
    const opener=mood.label==="In crisis"
      ?"You reached out and that took courage. I'm here. You are not alone right now. Can you tell me what's happening?"
      :mood.label==="Struggling"
      ?"I'm really glad you're here. Reaching out takes strength. What's going on?"
      :mood.label==="Not great"
      ?"Thanks for checking in. What's been weighing on you?"
      :"Hey. I'm really glad you reached out. Whether it's something specific or just a tough day - I'm here. What's on your mind?";
    setMessages([{from:"ai",text:opener}]);
    setQuickReplies(QUICK_REPLIES.general);
  };

  const lev=LEVEL_CONFIG[crisisLevel]||null;
  const chatH=lc.isDesktop?"360px":lc.isTablet?"320px":"240px";

  // ── MOOD CHECK-IN ────────────────────────────────────────────────
  if(phase==="moodcheck"){
    return(
      <ScreenSingle headerProps={{onBack:()=>navigate("home"),title:"AI Peer Support",agencyName:(agency&&agency.name)}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:22,marginBottom:8}}>👋</div>
          <div style={{fontSize:17,fontWeight:800,color:"#dde8f4",marginBottom:6}}>How are you right now?</div>
          <div style={{fontSize:13,color:"#3d5268",lineHeight:1.6}}>No right or wrong answer. This helps me show up for you better.</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {MOODS.map(m=>(
            <div key={m.label} onClick={()=>startChat(m)} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:14,background:m.label==="In crisis"?"rgba(124,58,237,0.1)":"rgba(255,255,255,0.04)",border:`1.5px solid ${m.color}30`,cursor:"pointer"}}>
              <span style={{fontSize:22}}>{m.emoji}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:m.color}}>{m.label}</div>
                <div style={{fontSize:12,color:"#475569",marginTop:2}}>{m.sub}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a52" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}
        </div>
        <div style={{fontSize:10,color:"#1e3a52",textAlign:"center",marginTop:8,letterSpacing:"0.06em"}}>ANONYMOUS . NO NAMES . NO CONTACT INFO STORED</div>
      </ScreenSingle>
    );
  }

  // ── FOLLOW-UP ─────────────────────────────────────────────────────
  if(phase==="followup"){
    return(
      <ScreenSingle headerProps={{onBack:()=>navigate("home"),title:"After Your Session",agencyName:(agency&&agency.name)}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:22,marginBottom:8}}>✓</div>
          <div style={{fontSize:17,fontWeight:800,color:"#dde8f4",marginBottom:6}}>Good work showing up</div>
          <div style={{fontSize:13,color:"#3d5268",lineHeight:1.6}}>Talking about it matters. Here are some ways to keep moving forward.</div>
        </div>
        {!sessionSaved&&messages.length>=2&&(
          <div onClick={saveSessionToJournal} style={{display:"flex",alignItems:"center",gap:12,padding:"14px",borderRadius:14,background:"rgba(167,139,250,0.08)",border:"1.5px solid rgba(167,139,250,0.25)",cursor:"pointer",marginBottom:10}}>
            <span style={{fontSize:22}}>📓</span>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:"#c4b5fd"}}>Save session to journal</div>
              <div style={{fontSize:12,color:"#7c5cbf",marginTop:2}}>Log a summary of this conversation privately</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c5cbf" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        )}
        {sessionSaved&&(
          <div style={{padding:"12px",borderRadius:12,background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",textAlign:"center",fontSize:13,color:"#22c55e",marginBottom:10}}>✓ Session saved to your journal</div>
        )}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {FOLLOWUP.slice(sessionSaved?1:0).map((f,i)=>(
            <div key={i} onClick={f.action} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:14,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",cursor:"pointer"}}>
              <span style={{fontSize:22}}>{f.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:"#dde8f4"}}>{f.label}</div>
                <div style={{fontSize:12,color:"#475569",marginTop:2}}>{f.sub}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a52" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}
        </div>
        <div onClick={()=>setPhase("moodcheck")} style={{textAlign:"center",marginTop:16,fontSize:13,color:"#38bdf8",cursor:"pointer",fontWeight:600}}>Start another session</div>
      </ScreenSingle>
    );
  }

  // ── CHAT ──────────────────────────────────────────────────────────
  return(
    <ScreenSingle headerProps={{onBack:()=>setPhase("followup"),title:"AI Peer Support",agencyName:(agency&&agency.name)}}>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:6,flex:1,background:"rgba(255,255,255,0.03)",borderRadius:12,padding:4}}>
          {["type","voice"].map(m=>(
            <div key={m} onClick={()=>setInputMode(m)} style={{flex:1,textAlign:"center",padding:"9px",borderRadius:9,background:inputMode===m?"rgba(56,189,248,0.15)":"transparent",color:inputMode===m?"#38bdf8":"#475569",fontSize:12,fontWeight:600,cursor:"pointer"}}>
              {m==="type"?<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{verticalAlign:"middle",marginRight:4}}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{verticalAlign:"middle",marginRight:4}}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>}
              {t(m==="type"?"text":"voice",userLanguage)}
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:6}}>
          <div onClick={()=>setAutoSpeak(a=>!a)} title={autoSpeak?"Auto-speak ON":"Auto-speak OFF"}
            style={{padding:"9px 12px",borderRadius:10,background:autoSpeak?"rgba(167,139,250,0.15)":"rgba(255,255,255,0.04)",border:"1px solid "+(autoSpeak?"rgba(167,139,250,0.3)":"rgba(255,255,255,0.06)"),color:autoSpeak?"#a78bfa":"#475569",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            {autoSpeak?"On":"Read"}
          </div>
          <div onClick={()=>setShowVoicePicker(v=>!v)} title="Choose voice"
            style={{padding:"9px 12px",borderRadius:10,background:showVoicePicker?"rgba(56,189,248,0.15)":"rgba(255,255,255,0.04)",border:"1px solid "+(showVoicePicker?"rgba(56,189,248,0.3)":"rgba(255,255,255,0.06)"),color:showVoicePicker?"#38bdf8":"#475569",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="10"/></svg>
            Voice
          </div>
        </div>
      </div>
      {showVoicePicker&&(
        <div style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"12px 14px"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:10,letterSpacing:"0.12em",textTransform:"uppercase"}}>Select Voice</div>
          {availableVoices.length===0&&(<div style={{fontSize:12,color:"#334155"}}>No voices available on this device. Try Chrome or Safari.</div>)}
          <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:160,overflowY:"auto"}}>
            {availableVoices.slice(0,8).map((v,i)=>(
              <div key={i} onClick={()=>(setSelectedVoice(v),setShowVoicePicker(false),speakResponse("Hi, I'm here to support you.",0))}
                style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",borderRadius:9,background:selectedVoice&&selectedVoice.name===v.name?"rgba(56,189,248,0.1)":"rgba(255,255,255,0.03)",cursor:"pointer"}}>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:selectedVoice&&selectedVoice.name===v.name?"#38bdf8":"#c8dae8"}}>{v.name}</div>
                  <div style={{fontSize:10,color:"#334155"}}>{v.lang}{v.localService?" . On device":""}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  {selectedVoice&&selectedVoice.name===v.name&&<span style={{fontSize:9,fontWeight:800,color:"#38bdf8",background:"rgba(56,189,248,0.1)",borderRadius:4,padding:"2px 5px"}}>ACTIVE</span>}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/></svg>
                </div>
              </div>
            ))}
          </div>
          <div style={{fontSize:10,color:"#1e3a52",marginTop:8,textAlign:"center"}}>Tap a voice to preview . Voices vary by device</div>
        </div>
      )}
      <div style={{background:"rgba(56,189,248,0.05)",border:"1px solid rgba(56,189,248,0.12)",borderRadius:10,padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:11,color:"#38bdf8",fontWeight:600}}>AI PST . Anonymous Mode</span>
        <span style={{fontSize:10,color:"#2d4a66"}}>No names . No contact info stored</span>
      </div>

      {/* ── subtle crisis banner (level 1-2) ── */}
      {crisisLevel>=1&&crisisLevel<=2&&!showCrisisCard&&lev&&(
        <div style={{background:lev.bg,border:`1px solid ${lev.border}`,borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:lev.color}}>{lev.label}</div>
            <div style={{fontSize:11,color:"#64748b",marginTop:2}}>You don't have to go through this alone.</div>
          </div>
          <div onClick={()=>setShowCrisisCard(true)} style={{fontSize:11,color:lev.color,fontWeight:700,cursor:"pointer",padding:"6px 10px",border:`1px solid ${lev.border}`,borderRadius:8}}>Options</div>
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:10,minHeight:chatH,maxHeight:chatH,overflowY:"auto",paddingRight:2}}>
        {messages.map((m,i)=>(
          <div key={i} style={{alignSelf:m.from==="user"?"flex-end":"flex-start",maxWidth:"82%",background:m.from==="user"?"rgba(56,189,248,0.12)":"rgba(255,255,255,0.04)",borderRadius:m.from==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"12px 14px"}}>
            <div style={{fontSize:10,color:m.from==="user"?"#7dd3fc":"#0ea5e9",fontWeight:700,marginBottom:4}}>{m.from==="user"?"You":"AI Peer Support"}</div>
            <div style={{fontSize:lc.isDesktop?14:13,color:"#c8dae8",lineHeight:1.55}}>{m.text}</div>
          </div>
        ))}
        {isThinking&&(
          <div style={{alignSelf:"flex-start",maxWidth:"82%",background:"rgba(255,255,255,0.04)",borderRadius:"16px 16px 16px 4px",padding:"12px 14px"}}>
            <div style={{fontSize:10,color:"#0ea5e9",fontWeight:700,marginBottom:6}}>AI Peer Support</div>
            <div style={{display:"flex",gap:5,alignItems:"center"}}>
              {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:"#38bdf8",opacity:0.7,animation:"pulse 1.2s infinite",animationDelay:i*0.22+"s"}}/>)}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* ── quick replies ── */}
      {quickReplies.length>0&&phase==="chat"&&(
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {quickReplies.slice(0,4).map((r,i)=>(
            <div key={i} onClick={()=>handleQuickReply(r)} style={{padding:"7px 12px",borderRadius:20,background:"rgba(56,189,248,0.07)",border:"1px solid rgba(56,189,248,0.2)",fontSize:12,color:"#7dd3fc",cursor:"pointer",lineHeight:1.4}}>
              {r}
            </div>
          ))}
        </div>
      )}

      {/* ── assertive crisis card (level 3-4) ── */}
      {showCrisisCard&&lev&&(
        <div style={{background:lev.bg,border:`1.5px solid ${lev.border}`,borderRadius:16,padding:"16px"}}>
          <div style={{fontSize:12,color:lev.color,fontWeight:800,marginBottom:8}}>[!] {lev.label}</div>
          <div style={{fontSize:12,color:"#3d5268",marginBottom:12,lineHeight:1.6}}>I noticed something in what you shared. You don't have to keep going alone.</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {agency?(
              <div onClick={()=>navigate("humanpst")} style={{background:"rgba(167,139,250,0.12)",border:"1px solid rgba(167,139,250,0.3)",borderRadius:12,padding:"11px 14px",cursor:"pointer",fontSize:13,fontWeight:700,color:"#c4b5fd"}}>Talk to a Human PST Member</div>
            ):(
              <div onClick={()=>navigate("agencycode")} style={{background:"rgba(56,189,248,0.08)",border:"1px solid rgba(56,189,248,0.2)",borderRadius:12,padding:"11px 14px",cursor:"pointer",fontSize:13,fontWeight:700,color:"#7dd3fc"}}>Connect with Peer Support</div>
            )}
            <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:12,padding:"11px 14px",cursor:"pointer",fontSize:13,fontWeight:700,color:"#f87171"}} onClick={()=>(window.location.href="tel:988")}>Call 988 - Crisis Lifeline</div>
            <div style={{background:"rgba(56,189,248,0.08)",border:"1px solid rgba(56,189,248,0.2)",borderRadius:12,padding:"11px 14px",cursor:"pointer",fontSize:13,fontWeight:700,color:"#7dd3fc"}} onClick={()=>navigate("resources")}>View Resources</div>
            <div onClick={()=>setShowCrisisCard(false)} style={{textAlign:"center",fontSize:12,color:"#2d4a66",cursor:"pointer",padding:8}}>Continue conversation</div>
          </div>
        </div>
      )}

      {spiritualMode&&!showCrisisCard&&messages.length>1&&(
        <div style={{background:"rgba(167,139,250,0.07)",border:"1px solid rgba(167,139,250,0.18)",borderRadius:14,padding:"14px"}}>
          <div style={{fontSize:12,color:"#a78bfa",fontWeight:700,marginBottom:6}}>🙏 Faith-Based Support Available</div>
          <div style={{fontSize:12,color:"#3d5268",lineHeight:1.65,marginBottom:12}}>If you'd like to talk with someone who understands both the job and matters of faith, your Human PST team includes chaplain-trained members.</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {agency&&<div onClick={()=>navigate("humanpst")} style={{background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.25)",borderRadius:12,padding:"11px 14px",cursor:"pointer",fontSize:13,fontWeight:700,color:"#c4b5fd"}}>Contact Human PST</div>}
            <div onClick={()=>setSpiritualMode(false)} style={{textAlign:"center",fontSize:12,color:"#2d4a66",cursor:"pointer",padding:8}}>Continue here</div>
          </div>
        </div>
      )}

      {inputMode==="type"?(
        <div style={{display:"flex",gap:10}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!isThinking&&send()} placeholder={isThinking?"AI is responding...":"What's on your mind..."} disabled={isThinking} style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1.5px solid rgba(56,189,248,0.2)",borderRadius:12,padding:"12px 14px",color:"#dde8f4",fontSize:14,outline:"none",opacity:isThinking?0.5:1}}/>
          <div onClick={!isThinking?send:undefined} style={{width:46,height:46,borderRadius:12,background:isThinking?"rgba(56,189,248,0.05)":"rgba(56,189,248,0.15)",border:"1px solid rgba(56,189,248,0.3)",display:"flex",alignItems:"center",justifyContent:"center",cursor:isThinking?"default":"pointer",flexShrink:0,opacity:isThinking?0.4:1}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </div>
        </div>
      ):(
        <div>
          <div style={{background:"rgba(56,189,248,0.04)",border:"1px solid rgba(56,189,248,0.1)",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#2d4a66",textAlign:"center",marginBottom:10}}>
            🎤 Tap the mic to speak - your words appear above, then tap send
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10,alignItems:"center"}}>
          {input&&<div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#c8dae8",width:"100%"}}>{input}</div>}
          {isSpeaking&&(
            <div style={{background:"rgba(167,139,250,0.08)",borderRadius:12,padding:"12px",display:"flex",alignItems:"center",gap:8}}>
              <div style={{display:"flex",gap:2}}>
                {[1,2,3,4].map(i=>(
                  <div key={i} style={{width:3,height:8+i*2,background:"#a78bfa",borderRadius:2,animation:"pulse 0.6s ease-in-out infinite",animationDelay:`${i*0.1}s`}}/>
                ))}
              </div>
              <span style={{fontSize:12,color:"#a78bfa",fontWeight:600}}>
                {t("speaking",userLanguage)}
              </span>
            </div>
          )}
          <div style={{display:"flex",gap:10,width:"100%"}}>
            <div onClick={isListening?stopVoice:startVoice} style={{flex:1,height:52,borderRadius:14,background:isListening?"rgba(239,68,68,0.15)":"rgba(56,189,248,0.1)",border:"1.5px solid "+(isListening?"rgba(239,68,68,0.4)":"rgba(56,189,248,0.25)"),display:"flex",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",fontSize:13,fontWeight:700,color:isListening?"#f87171":"#38bdf8"}}>
              {isListening?(<><div style={{display:"flex",gap:3}}>{[1,2,3,4].map(i=><div key={i} style={{width:3,height:8+i*2,background:"#f87171",borderRadius:2}}/>)}</div>Stop</>):(<><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>Speak</>)}
            </div>
            {input&&<div onClick={!isThinking?send:undefined} style={{width:52,height:52,borderRadius:14,background:isThinking?"rgba(56,189,248,0.05)":"rgba(56,189,248,0.15)",border:"1.5px solid rgba(56,189,248,0.3)",display:"flex",alignItems:"center",justifyContent:"center",cursor:isThinking?"default":"pointer",opacity:isThinking?0.4:1}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </div>}
          </div>
          </div>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div onClick={()=>navigate("tools")} style={{background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.18)",borderRadius:12,padding:"12px",textAlign:"center",cursor:"pointer",fontSize:12,fontWeight:700,color:"#22c55e"}}>Coping Tools</div>
        <div onClick={()=>setPhase("followup")} style={{background:"rgba(249,115,22,0.08)",border:"1px solid rgba(249,115,22,0.18)",borderRadius:12,padding:"12px",textAlign:"center",cursor:"pointer",fontSize:12,fontWeight:700,color:"#f97316"}}>Wrap Up</div>
      </div>
      <div style={{fontSize:10,color:"#1e3a52",textAlign:"center",letterSpacing:"0.06em"}}>AI MEMORY . STORED ON DEVICE ONLY</div>
      {buddyModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20}}>
          <div style={{background:"#0c1a2e",border:"1.5px solid rgba(56,189,248,0.3)",borderRadius:20,padding:24,maxWidth:320,width:"100%"}}>
            <div style={{fontSize:22,textAlign:"center",marginBottom:10}}>👋</div>
            <div style={{fontSize:16,fontWeight:800,color:"#dde8f4",textAlign:"center",marginBottom:10}}>Checking in on you</div>
            <div style={{fontSize:13,color:"#3d5268",textAlign:"center",lineHeight:1.6,marginBottom:20}}>You've been here a while. How are you doing? Would you like to talk to a real person?</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div onClick={()=>setBuddyModal(false)} style={{background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.25)",borderRadius:12,padding:"12px",cursor:"pointer",textAlign:"center",fontSize:13,fontWeight:700,color:"#22c55e"}}>I'm okay, keep talking</div>
              <div onClick={()=>setBuddyModal(false)} style={{background:"rgba(234,179,8,0.1)",border:"1px solid rgba(234,179,8,0.25)",borderRadius:12,padding:"12px",cursor:"pointer",textAlign:"center",fontSize:13,fontWeight:700,color:"#eab308"}}>I need a break</div>
              <div onClick={()=>(setBuddyModal(false),agency?navigate("humanpst"):navigate("agencycode"))} style={{background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.25)",borderRadius:12,padding:"12px",cursor:"pointer",textAlign:"center",fontSize:13,fontWeight:700,color:"#c4b5fd"}}>Talk to a real person</div>
            </div>
          </div>
        </div>
      )}
    </ScreenSingle>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI CHAT SCREEN
// Conversational AI that reads the room — starts casual, shifts to PST support
// naturally when the conversation calls for it. No intake gate, no forced mode.
// ─────────────────────────────────────────────────────────────────────────────

