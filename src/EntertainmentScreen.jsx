// ============================================================
// SCREEN: EntertainmentScreen
// Upstream Approach -- Entertainment Industry Wellness
// Film · TV · Theater · Live Events · Production · Post · Talent · Crew
// NO QR routing. NO internal escalation. NO admin view.
// Private decompression only. External resources only.
// The director might be the stressor.
// Routing = danger. Privacy = adoption.
// ============================================================
import React, { useState } from 'react';
import { ScreenSingle } from './ui.jsx';

const FLOWS = [
  {
    key:"performance",
    label:"After a High-Intensity Scene or Performance",
    icon:"🎬",
    color:"#ef4444",
    normalize:"That was a lot for your system. The scene is over. You are out of it.",
    states:[
      {key:"wired",       label:"Still wired / amped",       icon:"⚡"},
      {key:"shaken",      label:"Shaken",                    icon:"😰"},
      {key:"overloaded",  label:"Overloaded",                icon:"🌀"},
      {key:"numb",        label:"Numb / flat",               icon:"😶"},
    ],
    steps:[
      {title:"That was the character, not you", body:"Whatever emotional state you entered to do that scene -- grief, rage, fear, violence -- it was real enough to produce a real physiological response. Your body does not distinguish between performed and lived experience at the nervous system level. The scene is done. You are allowed to leave it."},
      {title:"Signal the end", body:"Your nervous system does not automatically know the take is over. Give it a signal. Look away from the set or stage. Name one thing in front of you that exists outside the story. That is the break point."},
      {title:"One complete breath", body:"Inhale through your nose. Exhale slowly through your mouth -- longer out than in. One cycle. That is enough to begin the transition out of character state."},
      {title:"Separate the performance from your identity", body:"What you just did was craft. It required real emotion but it is not a confession. You are not the character. The intensity of the performance is not a measurement of your worth or your stability."},
    ],
    reanchor:"You are out of the scene now. That was the work.",
    trackAs:"ent_performance",
  },
  {
    key:"conflict",
    label:"After a Production Blow-Up or Conflict",
    icon:"🎥",
    color:"#f97316",
    normalize:"That hit hard. Your system is still reacting. That is expected.",
    states:[
      {key:"angry",     label:"Angry",                icon:"🔥"},
      {key:"hurt",      label:"Hurt / dismissed",     icon:"💔"},
      {key:"shutdown",  label:"Shut down",             icon:"😶"},
      {key:"wired",     label:"Still wired",           icon:"⚡"},
    ],
    steps:[
      {title:"Let the adrenaline clear first", body:"You cannot process what just happened clearly while your nervous system is still activated from it. Give it two to three minutes before you decide what it means, what to do next, or who was wrong."},
      {title:"Replay interruption", body:"Your brain is designed to replay unresolved conflict looking for solutions. That loop is not helping you right now. Name what happened in one sentence -- factually, not emotionally. Then stop replaying. The fact of it does not change with more loops."},
      {title:"Release the jaw and shoulders", body:"Conflict stress lives in the face, jaw, and neck. Drop your jaw slightly. Release your forehead. Roll your shoulders once. That physical release lets the cognitive release follow."},
      {title:"You do not have to carry their energy forward", body:"Whatever came out of that room -- someone else's ego, someone else's pressure, someone else's crisis -- it does not belong in your body. You absorbed some of it. You do not have to keep it."},
    ],
    reanchor:"You do not have to carry their energy forward. That is theirs.",
    trackAs:"ent_conflict",
  },
  {
    key:"show",
    label:"After a Live Show or Theater Performance",
    icon:"🎭",
    color:"#a78bfa",
    normalize:"Your adrenaline was doing its job. Now it needs somewhere to go.",
    states:[
      {key:"wired",         label:"Still buzzing / wired",    icon:"⚡"},
      {key:"overstimulated",label:"Overstimulated",           icon:"🌀"},
      {key:"drained",       label:"Drained / crashed",        icon:"🪫"},
      {key:"emotional",     label:"Emotionally flooded",      icon:"💧"},
    ],
    steps:[
      {title:"The show is over", body:"Your nervous system has been running at performance level for hours. It does not automatically downshift when the curtain comes down. You have to give it a transition. The show is over. That is a complete thing."},
      {title:"Sensory downshift", body:"Find something quiet to look at. Lower your voice if you are talking. Reduce stimulation for 60 seconds. After a show your sensory system is maxed out. Give it one minute of reduced input before anything else."},
      {title:"Long exhale", body:"Exhale slowly and completely. Longer than your inhale. This activates the parasympathetic nervous system -- the off switch. One exhale is meaningful. Three is a reset."},
      {title:"You are offstage", body:"The character is done. The energy of the room is done. The audience is done. You can step out of the performance mode now. This is the real world and it runs at a different pace."},
    ],
    reanchor:"You are offstage now. The show is complete.",
    trackAs:"ent_show",
  },
  {
    key:"technical",
    label:"After a Technical Failure",
    icon:"🎚️",
    color:"#38bdf8",
    normalize:"That was high pressure. Whatever happened -- it is in the past now.",
    states:[
      {key:"frustrated",   label:"Frustrated",         icon:"🔥"},
      {key:"embarrassed",  label:"Embarrassed",         icon:"😳"},
      {key:"overloaded",   label:"Overloaded",          icon:"🌀"},
      {key:"wired",        label:"Still running hot",   icon:"⚡"},
    ],
    steps:[
      {title:"Separate the moment from your identity", body:"A technical failure is a moment in time. It is not a verdict on your competence, your preparation, or your worth. Systems fail. Connections drop. Equipment malfunctions. That is not the same as you failing."},
      {title:"What was actually in your control", body:"Name specifically what was within your control in that situation. Then name what was not. Most technical failures involve at least something outside your control. Acknowledge that distinction."},
      {title:"One breath reset", body:"Breathe in. Exhale slowly. One cycle. You do not need to clear your head completely. You just need to interrupt the spiral enough to reset for the next cue."},
      {title:"Reset before the next cue", body:"You do not have to resolve what happened right now. You need to be ready for what is next. That is the job. Set the failure aside -- not forever, just for now."},
    ],
    reanchor:"You can reset before the next cue. The moment is behind you.",
    trackAs:"ent_technical",
  },
  {
    key:"postproduction",
    label:"Post-Production Fatigue -- Editors, VFX, Sound",
    icon:"🎞️",
    color:"#6366f1",
    normalize:"You have been in hyper-focus mode. That has a cost.",
    states:[
      {key:"foggy",        label:"Foggy / unclear",      icon:"🌫"},
      {key:"drained",      label:"Drained / depleted",   icon:"🪫"},
      {key:"stuck",        label:"Stuck in the timeline",icon:"🔁"},
      {key:"overstimulated",label:"Screen-saturated",    icon:"👁"},
    ],
    steps:[
      {title:"Step out of the timeline", body:"You have been making thousands of micro-decisions inside a frame-by-frame world. Your brain is not designed to sustain that level of granular focus indefinitely. The timeline will be there when you return. Step outside of it for a moment."},
      {title:"Eye reset", body:"Look at something at least 20 feet away for 20 seconds. This is called the 20-20-20 rule and it is not just for eye strain -- it also breaks the cognitive lock that comes from sustained screen focus."},
      {title:"Cognitive unload", body:"What is the one thing your brain keeps returning to in the project? Name it out loud or to yourself. Externalizing the loop reduces its pull. You do not have to solve it right now. Just name it."},
      {title:"One next thing only", body:"Not the whole project. Not the deadline. Not the notes from the director. What is the single next action you need to take? One thing. Return to the work with that specific target only."},
    ],
    reanchor:"You can step out of the timeline now. It will be there when you return.",
    trackAs:"ent_postproduction",
  },
  {
    key:"writersroom",
    label:"Writer's Room or Creative Block",
    icon:"📝",
    color:"#22c55e",
    normalize:"That is a lot of pressure on one idea. No single idea carries that much weight.",
    states:[
      {key:"stuck",       label:"Stuck / nothing coming", icon:"🪨"},
      {key:"overwhelmed", label:"Overwhelmed",             icon:"🌀"},
      {key:"frustrated",  label:"Frustrated",              icon:"🔥"},
      {key:"numb",        label:"Creatively numb",         icon:"😶"},
    ],
    steps:[
      {title:"Creative block is not the same as creative failure", body:"A block means your brain has hit a temporary wall. It is not a diagnosis of your talent or your value to the project. It is a state -- and states change. This one will too."},
      {title:"Identity separation", body:"You are not the idea. If the idea is not working, that is information about the idea, not about you. The pressure you are feeling is external. Your creative capacity is separate from this specific moment."},
      {title:"Mental unclench", body:"Blocks are often a result of grip -- holding too tight to the right answer. Drop your shoulders. Unclench your hands. Take one slow breath. That physical release sometimes opens the cognitive one."},
      {title:"The next one line", body:"Not the whole script. Not the whole season. Not the pitch. One line. What is one true thing about this scene or character that you can write or say out loud right now? One line is a start. That is all you need."},
    ],
    reanchor:"You can return to it with fresh eyes. Clarity comes after the release, not before.",
    trackAs:"ent_writersroom",
  },
  {
    key:"pr",
    label:"Publicity or PR Crisis Stress",
    icon:"🎤",
    color:"#eab308",
    normalize:"You are holding the story. That is not the same as being responsible for it.",
    states:[
      {key:"tense",     label:"Tense / under pressure", icon:"😤"},
      {key:"overloaded",label:"Overloaded",              icon:"🌀"},
      {key:"anxious",   label:"Anxious",                 icon:"😰"},
      {key:"angry",     label:"Angry",                   icon:"🔥"},
    ],
    steps:[
      {title:"Separate the story from yourself", body:"You communicated it. You managed it. You held it publicly. That does not mean it is yours to carry permanently. The story belongs to the situation. You were the vehicle. Those are different things."},
      {title:"Three facts versus three feelings", body:"Name three factual things about the situation. Then name three things you are feeling about it. Keeping them in separate categories reduces the cognitive load of holding both at once."},
      {title:"Narrative boundary reset", body:"Where does your professional responsibility end and the public noise begin? Draw that line clearly. You are responsible for what you said and how you said it. You are not responsible for how the internet receives it."},
      {title:"You are not inside the public noise", body:"What is happening outside -- in media, in comment sections, in industry gossip -- is happening outside. It does not have to be inside your nervous system too. You can be informed without being immersed."},
    ],
    reanchor:"You are not inside the public noise. That story is separate from you.",
    trackAs:"ent_pr",
  },
  {
    key:"venuechaos",
    label:"Event or Venue Chaos",
    icon:"🎟️",
    color:"#f97316",
    normalize:"That was a lot happening at once. Your system responded to it. That is normal.",
    states:[
      {key:"wired",      label:"Still wired",       icon:"⚡"},
      {key:"shaky",      label:"Shaky / unsettled", icon:"😰"},
      {key:"overwhelmed",label:"Overwhelmed",        icon:"🌀"},
      {key:"snappy",     label:"Short fuse",         icon:"🔥"},
    ],
    steps:[
      {title:"Safety scan", body:"Look around. Is the immediate situation stable? If yes -- acknowledge it explicitly. Your nervous system is still in alert mode. It needs confirmation that the chaos is no longer active."},
      {title:"Physical grounding", body:"Press your feet into the floor. Feel the surface under you. That physical contact with something stable helps your nervous system register that you are no longer in the middle of chaos."},
      {title:"One slow breath", body:"Exhale longer than your inhale. One cycle. Your system does not need a full breathing session. It needs a circuit breaker. One slow exhale is that."},
      {title:"Pace reset", body:"Whatever your internal pace is right now -- it is probably faster than the moment requires. Slow one physical movement intentionally. Walk slower. Talk slower. Move deliberate. Pace is contagious in both directions."},
    ],
    reanchor:"You are safe enough right now. The pace can slow down.",
    trackAs:"ent_venuechaos",
  },
  {
    key:"exhaustion",
    label:"Exhaustion -- Can't Do One More Take",
    icon:"😩",
    color:"#64748b",
    normalize:"You have been running on empty. That is not a character flaw -- it is a physiological state.",
    states:[
      {key:"done",      label:"Done / empty",       icon:"🪫"},
      {key:"foggy",     label:"Foggy / unclear",    icon:"🌫"},
      {key:"overloaded",label:"Overloaded",          icon:"🌀"},
      {key:"snappy",    label:"Short fuse",          icon:"🔥"},
    ],
    steps:[
      {title:"You have exceeded your sustainable capacity", body:"This is not weakness. Long shoots, touring schedules, extended post-production sessions -- these create genuine physiological debt. Your performance degrades not because you are not trying hard enough but because the human system has limits that cannot be overridden by commitment alone."},
      {title:"Three breaths", body:"Inhale. Exhale longer. Three times. This is your circuit breaker. You do not need to feel better -- you just need to interrupt the depletion spiral long enough to take the next step."},
      {title:"One next thing only", body:"Not the whole day. Not the whole shoot. Not the deadline. What is the single next thing you absolutely need to do? One thing. That is all you are responsible for in this moment."},
      {title:"What can wait", body:"Something on your list can wait. It always can. Name one thing that does not have to happen in the next hour. Setting that down -- even temporarily -- reduces the load enough to function."},
    ],
    reanchor:"You only need the next step. Not all of them.",
    trackAs:"ent_exhaustion",
  },
  {
    key:"shredder",
    label:"90-Second Shredder -- Say What You Cannot Send",
    icon:"🔥",
    color:"#ef4444",
    normalize:"Say exactly what you would say if there were no consequences. Then watch it go.",
    states:null,
    steps:[],
    reanchor:"You said it. It is gone. Your nervous system got the release without the career cost.",
    trackAs:"ent_shredder",
    isShredder:true,
  },
];

const RESOURCES = [
  {
    title:"Industry Support",
    color:"#a78bfa",
    items:[
      {label:"Entertainment Community Fund", detail:"Formerly The Actors Fund - financial, housing, mental health, social services", action:"https://www.entertainmentcommunity.org"},
      {label:"Backline", detail:"Mental health support specifically for entertainment workers - therapist matching, case management", action:"https://backline.care"},
      {label:"MusiCares", detail:"Financial assistance, medical support, mental health - covers entertainment workers broadly", action:"https://www.grammy.com/musicares"},
      {label:"Tour Support", detail:"Mental health resources for touring entertainment professionals", action:"https://www.toursupport.org"},
      {label:"Sweet Relief Musicians Fund", detail:"Financial assistance for performers and crew - medical bill support", action:"https://www.sweetrelief.org"},
      {label:"Roadie Advocacy Group", detail:"Crew-specific peer support and advocacy", action:"https://www.roadieadvocacy.org"},
    ]
  },
  {
    title:"Unions and Guilds",
    color:"#38bdf8",
    items:[
      {label:"SAG-AFTRA", detail:"Actors, voice actors, stunt performers - mental health, safety, legal, contract support", action:"https://www.sagaftra.org"},
      {label:"IATSE", detail:"Crew, lighting, grips, camera, wardrobe, makeup - safety, mental health, emergency assistance", action:"https://iatse.net"},
      {label:"Directors Guild of America", detail:"Directors - legal, contract, safety resources", action:"https://www.dga.org"},
      {label:"Writers Guild of America", detail:"Writers - contract support, legal resources, emergency funds", action:"https://www.wga.org"},
      {label:"American Federation of Musicians", detail:"Musicians in entertainment - health and welfare, emergency assistance", action:"https://www.afm.org"},
      {label:"AGMA", detail:"Opera, dance, theater - mental health resources, contract support", action:"https://www.musicalartists.org"},
      {label:"Teamsters Entertainment", detail:"Drivers, logistics, location managers - safety, legal, emergency assistance", action:"https://teamster.org"},
    ]
  },
  {
    title:"Crisis -- Always Available",
    color:"#ef4444",
    items:[
      {label:"988 Suicide and Crisis Lifeline", detail:"Call or text 988 - 24/7 - Anonymous - Not tied to your employer", action:"tel:988"},
      {label:"Crisis Text Line", detail:"Text HOME to 741741 - 24/7 - Anonymous", action:"sms:741741?body=HOME"},
      {label:"SAMHSA National Helpline", detail:"Substance use and mental health - Free - Confidential - 800-662-4357", action:"tel:18006624357"},
      {label:"National DV Hotline", detail:"For touring relationships or workplace situations - 800-799-7233", action:"tel:18007997233"},
    ]
  },
  {
    title:"Financial Stability",
    color:"#22c55e",
    items:[
      {label:"Entertainment Community Fund Emergency Grants", detail:"Rent assistance, emergency grants, housing programs", action:"https://www.entertainmentcommunity.org/apply-for-assistance"},
      {label:"MusiCares Emergency Financial Support", detail:"Medical bill assistance, emergency grants", action:"https://www.grammy.com/musicares/get-help"},
      {label:"Sweet Relief Emergency Assistance", detail:"Grants for performers and crew in financial need", action:"https://www.sweetrelief.org/apply-for-assistance.html"},
    ]
  },
  {
    title:"Mental Health and Wellness",
    color:"#a78bfa",
    items:[
      {label:"Open Path Collective", detail:"Affordable therapy - $30-$80 per session", action:"https://openpathcollective.org"},
      {label:"Inclusive Therapists", detail:"Therapist directory with cultural and identity competency filters", action:"https://www.inclusivetherapists.com"},
      {label:"SMART Recovery", detail:"Science-based addiction recovery - online and in-person", action:"https://www.smartrecovery.org"},
      {label:"Behind the Scenes Foundation", detail:"Mental health and safety resources for entertainment industry workers", action:"https://www.btsf.org"},
    ]
  },
  {
    title:"Safety and Anonymous Reporting",
    color:"#64748b",
    items:[
      {label:"Callisto", detail:"Anonymous reporting tool - not routed to your employer or production", action:"https://www.projectcallisto.org"},
      {label:"AllVoices", detail:"Anonymous workplace reporting - not tied to HR or your production company", action:"https://www.allvoices.co"},
      {label:"IATSE Safety Hotline", detail:"Safety reporting for crew - independent of production oversight", action:"https://iatse.net/safety"},
    ]
  },
];

// Shredder component -- type and destroy
function Shredder({ onDone }) {
  const [text, setText] = useState("");
  const [shredding, setShredding] = useState(false);
  const [shredded, setShredded] = useState(false);

  const shred = () => {
    if (!text.trim()) return;
    setShredding(true);
    setTimeout(() => {
      setText("");
      setShredding(false);
      setShredded(true);
    }, 1200);
  };

  if (shredded) return (
    <div style={{ textAlign:"center", padding:"32px 20px", display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
      <div style={{ fontSize:48 }}>🔥</div>
      <div style={{ fontSize:16, fontWeight:800, color:"#dde8f4", maxWidth:300, textAlign:"center", lineHeight:1.6 }}>
        You said it. It is gone.
      </div>
      <div style={{ fontSize:13, color:"#94a3b8", textAlign:"center", lineHeight:1.7, maxWidth:280 }}>
        Your nervous system got the release without the career cost. Nothing was saved. Nothing was sent.
      </div>
      <div onClick={onDone} style={{ padding:"12px 28px", borderRadius:12, cursor:"pointer", background:"rgba(56,189,248,0.1)", border:"1.5px solid rgba(56,189,248,0.3)", fontSize:13, fontWeight:700, color:"#38bdf8" }}>
        Done
      </div>
    </div>
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      <div style={{ fontSize:14, fontWeight:800, color:"#ef4444", marginBottom:4 }}>🔥 90-Second Shredder</div>
      <div style={{ fontSize:13, color:"#94a3b8", lineHeight:1.7 }}>
        Type exactly what you would say if there were zero consequences. To anyone. About anything. Then hit Shred. It disappears completely. Nothing is saved. Nothing is sent.
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Say it all here..."
        rows={6}
        style={{ width:"100%", background:shredding?"rgba(239,68,68,0.08)":"rgba(255,255,255,0.04)", border:`1px solid ${shredding?"rgba(239,68,68,0.3)":"rgba(255,255,255,0.09)"}`, borderRadius:12, padding:"12px", fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"none", color:shredding?"transparent":"#dde8f4", lineHeight:1.6, boxSizing:"border-box", transition:"all 0.3s" }}
        disabled={shredding}
      />
      <div style={{ fontSize:10, color:"#334155", textAlign:"center" }}>
        Nothing is saved. Nothing is sent. This runs entirely on your device.
      </div>
      {text.trim() && !shredding && (
        <div onClick={shred} style={{ padding:"14px", borderRadius:12, cursor:"pointer", textAlign:"center", background:"rgba(239,68,68,0.12)", border:"1.5px solid rgba(239,68,68,0.3)", fontSize:14, fontWeight:800, color:"#ef4444" }}>
          Shred It
        </div>
      )}
      {shredding && (
        <div style={{ padding:"14px", borderRadius:12, textAlign:"center", background:"rgba(239,68,68,0.08)", border:"1.5px solid rgba(239,68,68,0.2)", fontSize:14, fontWeight:800, color:"#ef4444", opacity:0.6 }}>
          Shredding...
        </div>
      )}
    </div>
  );
}

export default function EntertainmentScreen({ navigate, agency, logoSrc }) {
  const [screen, setScreen] = useState("home");
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [showExternal, setShowExternal] = useState(false);
  const [tab, setTab] = useState("flows");
  const [openResource, setOpenResource] = useState(null);

  const flow = FLOWS.find(f => f.key === selectedFlow);

  const startFlow = (flowKey) => {
    setSelectedFlow(flowKey);
    setActiveStep(0);
    setSelectedState(null);
    setShowExternal(false);
    if (flowKey === "shredder") {
      setScreen("shredder");
    } else {
      setScreen("flow");
    }
  };

  const goHome = () => {
    setScreen("home");
    setSelectedFlow(null);
    setSelectedState(null);
    setActiveStep(0);
    setShowExternal(false);
  };

  // HOME
  if (screen === "home") return (
    <ScreenSingle headerProps={{ onBack: () => navigate("home"), agencyName: agency?.name, logoSrc }}>
      <div style={{ fontSize:18, fontWeight:800, color:"#dde8f4", marginBottom:4 }}>Entertainment Industry</div>
      <div style={{ fontSize:12, color:"#64748b", lineHeight:1.6, marginBottom:4 }}>
        Film · TV · Theater · Live Events · Production · Post · Talent · Crew
      </div>
      <div style={{ fontSize:11, color:"#334155", marginBottom:16, lineHeight:1.6 }}>
        Private. Anonymous. No routing. No escalation. No admin view. The director might be the stressor.
      </div>

      {/* Crisis always at top */}
      <div style={{ background:"rgba(239,68,68,0.07)", border:"1.5px solid rgba(239,68,68,0.2)", borderRadius:12, padding:"12px 16px", marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:800, color:"#ef4444", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>If you need help right now</div>
        <div style={{ display:"flex", gap:8 }}>
          <div onClick={() => window.location.href="tel:988"} style={{ flex:1, padding:"10px 6px", borderRadius:9, cursor:"pointer", textAlign:"center", background:"rgba(239,68,68,0.15)", border:"1.5px solid rgba(239,68,68,0.35)", fontSize:13, fontWeight:800, color:"#ef4444" }}>988</div>
          <div onClick={() => window.location.href="sms:741741?body=HOME"} style={{ flex:1, padding:"10px 6px", borderRadius:9, cursor:"pointer", textAlign:"center", background:"rgba(167,139,250,0.1)", border:"1px solid rgba(167,139,250,0.25)", fontSize:11, fontWeight:700, color:"#a78bfa" }}>Text HOME<br/><span style={{fontSize:9}}>741741</span></div>
          <div onClick={() => window.open("https://backline.care","_blank")} style={{ flex:1, padding:"10px 6px", borderRadius:9, cursor:"pointer", textAlign:"center", background:"rgba(56,189,248,0.08)", border:"1px solid rgba(56,189,248,0.2)", fontSize:10, fontWeight:700, color:"#38bdf8" }}>Backline<br/>Industry Support</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:5, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:5, marginBottom:16 }}>
        {["flows","resources"].map(t => (
          <div key={t} onClick={() => setTab(t)} style={{ flex:1, textAlign:"center", padding:"10px 8px", borderRadius:9, background:tab===t?"rgba(167,139,250,0.18)":"transparent", border:`1px solid ${tab===t?"rgba(167,139,250,0.35)":"transparent"}`, cursor:"pointer", fontSize:11, fontWeight:tab===t?800:600, color:tab===t?"#a78bfa":"#8099b0" }}>
            {t==="flows"?"Decompression":"Resources"}
          </div>
        ))}
      </div>

      {tab==="flows" && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#475569", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>What just happened?</div>
          {FLOWS.map(f => (
            <div key={f.key} onClick={() => startFlow(f.key)} style={{ background:f.color+"08", border:`1px solid ${f.color}20`, borderRadius:14, padding:"14px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:14 }}>
              <span style={{ fontSize:24, flexShrink:0 }}>{f.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:f.color }}>{f.label}</div>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={f.color} strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}
        </div>
      )}

      {tab==="resources" && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ fontSize:11, color:"#334155", lineHeight:1.6, marginBottom:4 }}>External only. Not tied to your employer, production, or studio. Fully private.</div>
          {RESOURCES.map((sec,si) => (
            <div key={si} style={{ background:"rgba(255,255,255,0.025)", border:`1px solid ${openResource===si?sec.color+"40":"rgba(255,255,255,0.06)"}`, borderRadius:14, overflow:"hidden" }}>
              <div onClick={() => setOpenResource(openResource===si?null:si)} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", cursor:"pointer" }}>
                <div style={{ flex:1, fontSize:13, fontWeight:700, color:openResource===si?sec.color:"#dde8f4" }}>{sec.title}</div>
                <div style={{ fontSize:10, color:"#475569" }}>{sec.items.length}</div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" style={{ transform:openResource===si?"rotate(90deg)":"none", transition:"transform 0.2s", flexShrink:0 }}><polyline points="9 18 15 12 9 6"/></svg>
              </div>
              {openResource===si && (
                <div style={{ padding:"0 14px 14px" }}>
                  {sec.items.map((item,i) => (
                    <div key={i} onClick={() => item.action.startsWith("http")?window.open(item.action,"_blank"):window.location.href=item.action}
                      style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"11px 13px", marginBottom:6, cursor:"pointer" }}>
                      <div style={{ fontSize:13, fontWeight:700, color:"#dde8f4", marginBottom:2 }}>{item.label}</div>
                      <div style={{ fontSize:11, color:"#94a3b8", lineHeight:1.5, marginBottom:4 }}>{item.detail}</div>
                      <div style={{ fontSize:11, fontWeight:700, color:sec.color }}>{item.action.startsWith("http")?"Tap to open":"Tap to call or text"} -></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </ScreenSingle>
  );

  // SHREDDER
  if (screen === "shredder") return (
    <ScreenSingle headerProps={{ onBack: goHome, agencyName: agency?.name, logoSrc }}>
      <Shredder onDone={goHome}/>
    </ScreenSingle>
  );

  // FLOW - normalize + state
  if (screen === "flow" && flow) return (
    <ScreenSingle headerProps={{ onBack: goHome, agencyName:agency?.name, logoSrc }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
        <span style={{ fontSize:28 }}>{flow.icon}</span>
        <div style={{ fontSize:16, fontWeight:800, color:flow.color }}>{flow.label}</div>
      </div>
      <div style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${flow.color}20`, borderRadius:14, padding:"16px", marginBottom:20 }}>
        <div style={{ fontSize:14, color:"#dde8f4", lineHeight:1.8, fontStyle:"italic" }}>{flow.normalize}</div>
      </div>
      {flow.states && (
        <>
          <div style={{ fontSize:12, color:"#475569", marginBottom:12 }}>Where are you right now?</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
            {flow.states.map(s => (
              <div key={s.key} onClick={() => { setSelectedState(s.key); setActiveStep(0); setScreen("steps"); }}
                style={{ display:"flex", alignItems:"center", gap:14, padding:"13px 16px", borderRadius:12, cursor:"pointer", background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)" }}>
                <span style={{ fontSize:22 }}>{s.icon}</span>
                <div style={{ fontSize:13, fontWeight:600, color:"#dde8f4" }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div onClick={() => { setSelectedState("general"); setActiveStep(0); setScreen("steps"); }}
            style={{ textAlign:"center", fontSize:12, color:"#334155", cursor:"pointer", textDecoration:"underline" }}>
            Skip -- just take me through it
          </div>
        </>
      )}
    </ScreenSingle>
  );

  // STEPS
  if (screen === "steps" && flow) return (
    <ScreenSingle headerProps={{ onBack:() => setScreen("flow"), agencyName:agency?.name, logoSrc }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
        <span style={{ fontSize:22 }}>{flow.icon}</span>
        <div style={{ fontSize:14, fontWeight:800, color:flow.color }}>{flow.label}</div>
      </div>
      <div style={{ display:"flex", gap:6, marginBottom:20 }}>
        {flow.steps.map((_, i) => (
          <div key={i} onClick={() => setActiveStep(i)} style={{ flex:1, height:4, borderRadius:2, cursor:"pointer", background:i===activeStep?flow.color:i<activeStep?flow.color+"60":"rgba(255,255,255,0.08)", transition:"all 0.2s" }}/>
        ))}
      </div>
      <div style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${flow.color}20`, borderRadius:16, padding:"20px", marginBottom:20, minHeight:160 }}>
        <div style={{ fontSize:15, fontWeight:800, color:flow.color, marginBottom:12 }}>{flow.steps[activeStep].title}</div>
        <div style={{ fontSize:14, color:"#94a3b8", lineHeight:1.85 }}>{flow.steps[activeStep].body}</div>
      </div>
      <div style={{ display:"flex", gap:10 }}>
        {activeStep > 0 && (
          <div onClick={() => setActiveStep(s=>s-1)} style={{ flex:1, padding:"13px", borderRadius:12, cursor:"pointer", textAlign:"center", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", fontSize:13, fontWeight:700, color:"#64748b" }}>Back</div>
        )}
        {activeStep < flow.steps.length-1 ? (
          <div onClick={() => setActiveStep(s=>s+1)} style={{ flex:2, padding:"13px", borderRadius:12, cursor:"pointer", textAlign:"center", background:flow.color+"15", border:`1.5px solid ${flow.color}35`, fontSize:13, fontWeight:700, color:flow.color }}>Next</div>
        ) : (
          <div onClick={() => setScreen("reanchor")} style={{ flex:2, padding:"13px", borderRadius:12, cursor:"pointer", textAlign:"center", background:"rgba(167,139,250,0.1)", border:"1.5px solid rgba(167,139,250,0.3)", fontSize:13, fontWeight:700, color:"#a78bfa" }}>Continue</div>
        )}
      </div>
    </ScreenSingle>
  );

  // REANCHOR
  if (screen === "reanchor" && flow) return (
    <ScreenSingle headerProps={{ onBack:() => setScreen("steps"), agencyName:agency?.name, logoSrc }}>
      <div style={{ textAlign:"center", paddingTop:20, display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
        <div style={{ fontSize:48 }}>{flow.icon}</div>
        <div style={{ fontSize:16, fontWeight:800, color:"#dde8f4", maxWidth:300, textAlign:"center", lineHeight:1.6 }}>{flow.reanchor}</div>
        <div style={{ width:"100%", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"14px 16px", fontSize:11, color:"#334155", lineHeight:1.7, textAlign:"center" }}>
          Private. Nothing stored. Nothing sent. Not tied to your employer or production.
        </div>
        <div style={{ width:"100%", fontSize:13, fontWeight:700, color:"#94a3b8", textAlign:"center" }}>External support -- no employer involvement</div>
        <div onClick={() => setShowExternal(s=>!s)} style={{ width:"100%", padding:"12px", borderRadius:12, cursor:"pointer", textAlign:"center", background:"rgba(167,139,250,0.08)", border:"1px solid rgba(167,139,250,0.2)", fontSize:12, fontWeight:700, color:"#a78bfa" }}>
          {showExternal ? "Hide resources" : "Show external resources"}
        </div>
        {showExternal && (
          <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:8 }}>
            {[
              {label:"Backline -- Industry Mental Health", action:"https://backline.care"},
              {label:"Entertainment Community Fund", action:"https://www.entertainmentcommunity.org"},
              {label:"988 Crisis Line", action:"tel:988"},
              {label:"Crisis Text Line -- Text HOME to 741741", action:"sms:741741?body=HOME"},
            ].map((r,i) => (
              <div key={i} onClick={() => r.action.startsWith("http")?window.open(r.action,"_blank"):window.location.href=r.action}
                style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"12px 14px", cursor:"pointer", fontSize:13, fontWeight:600, color:"#dde8f4" }}>
                {r.label}
              </div>
            ))}
          </div>
        )}
        <div onClick={goHome} style={{ padding:"12px 28px", borderRadius:12, cursor:"pointer", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", fontSize:12, fontWeight:600, color:"#475569" }}>
          Return home
        </div>
      </div>
    </ScreenSingle>
  );

  return null;
}
