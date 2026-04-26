// ============================================================
// SCREEN: SchoolStaffScreen
// Upstream Approach -- School System Staff Wellness
// Staff only. No students. No parents. No identity.
// Flow-based -- what happened, not who you are.
// Not clinical care. Not reporting. Not documentation.
// Same color scheme and architecture as HospitalScreen.
// ============================================================
import React, { useState, useEffect } from 'react';
import { ScreenSingle } from './ui.jsx';

const STAFF_GROUPS = [
  { key:"classroom",    label:"Classroom Staff",              sub:"Teachers · Assistants · Substitutes · Aides",                   icon:"📚", color:"#38bdf8" },
  { key:"support_mh",  label:"Student Support + Mental Health", sub:"Counselors · Social Workers · Psychologists · Behavior Teams", icon:"🧠", color:"#a78bfa" },
  { key:"admin",        label:"Administration + Leadership",  sub:"Principals · APs · Deans · Instructional Coaches",              icon:"👔", color:"#64748b" },
  { key:"ec",           label:"Special Education + EC Teams", sub:"EC Teachers · Behavior Specialists · IEP Coordinators",         icon:"⭐", color:"#f97316" },
  { key:"sro",          label:"SROs + Safety Teams",          sub:"School Resource Officers · Security · Safety Coordinators",     icon:"🛡", color:"#ef4444" },
  { key:"support",      label:"Support Staff",                sub:"Bus Drivers · Custodial · Cafeteria · Front Office · ISS",       icon:"🔧", color:"#22c55e" },
  { key:"district",     label:"District Office",              sub:"HR · Curriculum · Finance · Transportation · Communications",    icon:"🏛", color:"#eab308" },
];

const FLOWS = [
  {
    key:"incident",
    label:"After a High-Intensity Incident",
    icon:"⚡",
    color:"#ef4444",
    normalize:"That was a high-intensity moment. It is over now.",
    states:[
      {key:"shaken",  label:"Shaken",              icon:"😰"},
      {key:"angry",   label:"Angry",               icon:"🔥"},
      {key:"alert",   label:"Still hyper-alert",   icon:"⚡"},
      {key:"numb",    label:"Shut down / numb",     icon:"😶"},
    ],
    steps:[
      {title:"The incident is over", body:"Your brain does not automatically register that an event has ended. Give it a signal. Say it to yourself: that is done. The building is secure. I am through it."},
      {title:"Orient to right now", body:"Look around the room. Name three things you can see that have nothing to do with what just happened. This is called orienting -- it tells your nervous system the threat is gone."},
      {title:"One slow exhale", body:"Breathe in through your nose. Exhale slowly through your mouth -- longer out than in. Do this once. That is enough to begin the shift out of alert mode."},
      {title:"Drop your shoulders", body:"Most people carry tension in their shoulders and jaw after a high-intensity moment without realizing it. Consciously drop your shoulders. Release your jaw. That physical release helps the mental release follow."},
    ],
    reanchor:"You are back in the present moment. That is behind you.",
    resources:["peer","admin","sro"],
    trackAs:"school_incident",
  },
  {
    key:"behavioral",
    label:"After a Behavioral Escalation",
    icon:"🌀",
    color:"#f97316",
    normalize:"That interaction carried a lot of intensity. It was not yours to absorb.",
    states:[
      {key:"drained",     label:"Drained / depleted",    icon:"🪫"},
      {key:"frustrated",  label:"Frustrated",             icon:"🔥"},
      {key:"overloaded",  label:"Overloaded",             icon:"📚"},
      {key:"unsettled",   label:"Still unsettled",        icon:"😰"},
    ],
    steps:[
      {title:"That was their state, not yours", body:"What you witnessed -- the dysregulation, the intensity, the behavior -- belonged to the student in that moment. Your nervous system absorbed some of it. That is normal. It does not have to stay."},
      {title:"Boundary reset", body:"You did your job. You held the environment. You kept other students safe or called for support. That is the role. What happened in that student is not a reflection of what you did or who you are."},
      {title:"Physical release", body:"Press your hands together for five seconds. Then release. Or press your feet firmly into the floor. Physical tension from behavioral escalation needs a physical outlet before it clears cognitively."},
      {title:"Reset before the next block", body:"Do not carry this into the next classroom. You are allowed a moment between. Take it now."},
    ],
    reanchor:"You can move on to the next moment. That one is done.",
    resources:["peer","counselor"],
    trackAs:"school_behavioral",
  },
  {
    key:"stacked",
    label:"Stacked Day / Burnout Reset",
    icon:"📚",
    color:"#38bdf8",
    normalize:"This is not one thing. It is everything stacking at once.",
    states:[
      {key:"exhausted",   label:"Exhausted",             icon:"😩"},
      {key:"scattered",   label:"Scattered / unfocused",  icon:"🌀"},
      {key:"irritable",   label:"Short fuse",             icon:"🔥"},
      {key:"stuck",       label:"Stuck / cannot move",    icon:"🪨"},
    ],
    steps:[
      {title:"You cannot solve all of it right now", body:"Your brain is trying to hold too many open loops simultaneously. That is not a failure of effort -- it is an overloaded system. You do not have to fix everything. You just have to get to the end of this block."},
      {title:"The next one thing", body:"Not the whole day. Not the stack of work. Not the behavior plan that needs updating. What is the single next thing you need to do? Name it. Do only that."},
      {title:"Three breaths", body:"In through your nose. Out through your mouth. Three times. You do not have to clear your head. You just have to interrupt the spiral for 30 seconds."},
      {title:"What can you set down", body:"Not all of it -- just one thing. One task that can wait until tomorrow. One expectation you can lower for today. Name it. Set it down consciously."},
    ],
    reanchor:"One block at a time. Not the whole year.",
    resources:["peer"],
    trackAs:"school_stacked",
  },
  {
    key:"trauma",
    label:"After a School Tragedy or Loss",
    icon:"🕯",
    color:"#475569",
    normalize:"That is something that stays with people. You do not have to carry it alone.",
    states:[
      {key:"heavy",    label:"Heavy / sad",      icon:"🪨"},
      {key:"numb",     label:"Numb / flat",       icon:"😶"},
      {key:"shocked",  label:"Shocked",           icon:"😳"},
      {key:"replaying",label:"Replaying it",      icon:"🔁"},
    ],
    steps:[
      {title:"This affects everyone in the building", body:"When something significant happens in a school -- a student death, a community tragedy, a crisis -- the weight lands differently on the adults who have to hold the space for students while carrying it themselves. That is an enormous ask. Acknowledging it is not weakness."},
      {title:"Slow your breathing first", body:"Exhale slowly. Longer out than in. Your body needs to know the acute event is over before your mind can begin to process it. The breath is the signal."},
      {title:"You do not have to have answers", body:"Students and colleagues may look to you for stability today. Stability does not mean having answers or being unaffected. It means being present and regulated. Those are different things."},
      {title:"Name one thing that is still stable", body:"In the middle of a loss, it helps to ground in something that is unchanged. A routine. A person. A place. Name one thing in your world that is steady."},
    ],
    reanchor:"You showed up. You held space. That is the work.",
    resources:["peer","counselor","chaplain"],
    trackAs:"school_trauma",
  },
  {
    key:"conflict",
    label:"After a Conflict -- Parent, Admin, or Staff",
    icon:"⚡",
    color:"#a78bfa",
    normalize:"That was a high-pressure interaction. You can step out of that moment now.",
    states:[
      {key:"frustrated",  label:"Frustrated / angry",    icon:"🔥"},
      {key:"replaying",   label:"Replaying the conversation", icon:"🔁"},
      {key:"hurt",        label:"Hurt / dismissed",       icon:"💔"},
      {key:"tense",       label:"Still tense",            icon:"😤"},
    ],
    steps:[
      {title:"Pause the loop", body:"Your brain is designed to replay unresolved conflict to look for solutions. That is helpful when the conflict is still happening. It is not helpful now. The conversation is over. You can pause the loop."},
      {title:"Let the adrenaline clear first", body:"You cannot process a conflict clearly while your nervous system is still activated from it. Give it two to three minutes before you decide what it means, what to do next, or whether you were right."},
      {title:"Release the face and jaw", body:"Conflict stress lives in the face, jaw, and neck. Drop your jaw slightly. Release your forehead. Roll your shoulders once. That physical release lets the cognitive release follow."},
      {title:"What is actually yours to carry", body:"What part of that interaction is genuinely your responsibility? Name it specifically. Then name what belongs to the other person. The second list is usually longer than it feels in the moment."},
    ],
    reanchor:"You can step out of that moment. It does not have to follow you.",
    resources:["peer","admin"],
    trackAs:"school_conflict",
  },
  {
    key:"support_isolation",
    label:"Isolation / Underrecognized Stress",
    icon:"🔇",
    color:"#22c55e",
    normalize:"What you do in this building matters -- even when nobody notices.",
    states:[
      {key:"invisible",   label:"Invisible / overlooked",  icon:"👻"},
      {key:"drained",     label:"Drained",                 icon:"🪫"},
      {key:"frustrated",  label:"Frustrated",              icon:"🔥"},
      {key:"disconnected",label:"Disconnected",            icon:"🔌"},
    ],
    steps:[
      {title:"The work is real even when the recognition is not", body:"Bus drivers, custodial staff, cafeteria workers, front office staff, paras -- you absorb the weight of this building every day. The behavior on the bus. The aftermath in the hallways. The confrontations at the front desk. That exposure is real."},
      {title:"Your role is infrastructure", body:"No teacher can do their job in a building that does not function. No student can learn in a bus that is chaotic. No parent meeting happens without the front office. Your role is not peripheral. It is what makes everything else possible."},
      {title:"Name what you did today", body:"Not what was recognized. Not what was praised. What did you actually do today that had value? Name one thing specifically."},
      {title:"Connection before the next task", body:"Isolation stress is reduced by human contact, not by productivity. Before you do the next thing -- make brief contact with one person. That is a real intervention."},
    ],
    reanchor:"You are part of how this school works. That does not require anyone else to notice it.",
    resources:["peer"],
    trackAs:"school_isolation",
  },
  {
    key:"decision",
    label:"Decision Fatigue -- Leadership Reset",
    icon:"⚖️",
    color:"#eab308",
    normalize:"You have made too many decisions under too much pressure today.",
    states:[
      {key:"foggy",      label:"Foggy / unclear",      icon:"🌫"},
      {key:"second_guess",label:"Second-guessing",     icon:"❓"},
      {key:"caught",     label:"Caught in the middle", icon:"🪨"},
      {key:"heavy",      label:"Heavy",                icon:"🪨"},
    ],
    steps:[
      {title:"This is not a character flaw", body:"Decision fatigue is a documented phenomenon. After a certain number of decisions -- especially high-stakes ones involving students, staff, and parents -- your decision quality degrades. That is biology, not weakness."},
      {title:"Reduce the load right now", body:"What is the next decision you actually have to make today? Not all of them. Just the next one. Focus there. The rest can wait."},
      {title:"Caught in the middle is its own stress", body:"Principals and administrators absorb pressure from district leadership above and staff and families below. Being the buffer has a cost. Acknowledging that cost is not complaining -- it is accurate."},
      {title:"Delegate one thing", body:"What is one decision or task in front of you that someone else can handle? Delegation is not weakness. In a high-pressure environment it is the right operational move."},
    ],
    reanchor:"You made the decisions you had to make. That is the job.",
    resources:["peer","district"],
    trackAs:"school_decision",
  },
  {
    key:"endofday",
    label:"End of Day Reset",
    icon:"🌙",
    color:"#6366f1",
    normalize:"You are done for today. The building is behind you.",
    states:[
      {key:"carrying",   label:"Still carrying it",    icon:"🪨"},
      {key:"exhausted",  label:"Exhausted",             icon:"😩"},
      {key:"okay",       label:"Okay -- just need a moment", icon:"💙"},
      {key:"relief",     label:"Ready to be done",      icon:"🙌"},
    ],
    steps:[
      {title:"The school day has ended", body:"Your nervous system does not automatically switch off when the building empties. You have to give it a signal. That is what this is. The day is done. You are through it."},
      {title:"Leave the work in the building", body:"Not because it does not matter -- because it will be there tomorrow and you will not be useful to anyone if you carry all of it home. Name one thing you are leaving behind today."},
      {title:"Three slow breaths", body:"Inhale. Exhale longer. Three times. This is your signal that the professional day is complete and personal time begins. Your brain needs a transition marker."},
      {title:"Name one thing from today that worked", body:"Not the stack of what went wrong. One thing that worked. One student who had a better moment. One task that got done. One interaction that went the way you hoped."},
    ],
    reanchor:"You showed up today. That is enough. Tomorrow is separate from today.",
    resources:["peer"],
    trackAs:"school_endofday",
  },
];

const EXTERNAL_RESOURCES = [
  { key:"988",          label:"988 Suicide and Crisis Lifeline",  detail:"Call or text 988 - 24/7 - Free - Confidential",               action:"tel:988" },
  { key:"crisis_text",  label:"Crisis Text Line",                  detail:"Text HOME to 741741 - 24/7 - Anonymous",                       action:"sms:741741?body=HOME" },
  { key:"emotional_ppe",label:"Emotional PPE Project",             detail:"Free therapy for educators and helping professionals",          action:"https://www.emotionalppe.org" },
  { key:"safe_call",    label:"Safe Call Now",                     detail:"1-206-459-3020 - Public safety and school safety staff",        action:"tel:12064593020" },
  { key:"nea",          label:"NEA Member Assistance Program",     detail:"National Education Association - confidential counseling for NEA members", action:"https://www.nea.org/professional-excellence/student-engagement/tools-tips/teacher-wellness" },
  { key:"open_path",    label:"Open Path Collective",              detail:"Affordable therapy - $30-$80 per session",                     action:"https://openpathcollective.org" },
];

async function trackSchoolFlow(flowKey, groupKey, agencyCode) {
  try {
    const { databases } = await import('./appwrite.js');
    const { ID } = await import('appwrite');
    const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE || '69c88588001ed071c19e';
    await databases.createDocument(DB_ID, 'tool_usage', ID.unique(), {
      agencyCode: agencyCode || 'SCHOOL',
      toolName: 'school_' + flowKey,
      unitGroup: groupKey || 'unknown',
      timestamp: new Date().toISOString(),
    });
  } catch(e) {}
}

export default function SchoolStaffScreen({ navigate, agency, logoSrc }) {
  const [screen, setScreen] = useState("home");
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [showExternal, setShowExternal] = useState(false);
  const [tab, setTab] = useState("flows");

  const flow = FLOWS.find(f => f.key === selectedFlow);

  // QR context detection
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ctx = params.get('sctx'); // school context
      if (ctx) {
        const contextMap = {
          'incident':   'incident',
          'behavioral': 'behavioral',
          'lounge':     'stacked',
          'endofday':   'endofday',
          'conflict':   'conflict',
          'trauma':     'trauma',
        };
        const flowKey = contextMap[ctx];
        if (flowKey) {
          setSelectedFlow(flowKey);
          setScreen("flow");
        }
      }
    } catch(e) {}
  }, []);

  const startFlow = (flowKey) => {
    setSelectedFlow(flowKey);
    setActiveStep(0);
    setSelectedState(null);
    setShowExternal(false);
    trackSchoolFlow(flowKey, null, agency?.code);
    setScreen("flow");
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
      <div style={{ fontSize:18, fontWeight:800, color:"#dde8f4", marginBottom:4 }}>School Staff Wellness</div>
      <div style={{ fontSize:12, color:"#64748b", lineHeight:1.6, marginBottom:4 }}>
        For school staff only. Anonymous. Not surveillance. Not reporting. Not documentation.
      </div>

      {/* Crisis always at top */}
      <div style={{ background:"rgba(239,68,68,0.07)", border:"1.5px solid rgba(239,68,68,0.2)", borderRadius:12, padding:"12px 16px", marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:800, color:"#ef4444", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>If you need help right now</div>
        <div style={{ display:"flex", gap:8 }}>
          <div onClick={() => window.location.href="tel:988"} style={{ flex:1, padding:"10px 6px", borderRadius:9, cursor:"pointer", textAlign:"center", background:"rgba(239,68,68,0.15)", border:"1.5px solid rgba(239,68,68,0.35)", fontSize:13, fontWeight:800, color:"#ef4444" }}>988</div>
          <div onClick={() => window.location.href="sms:741741?body=HOME"} style={{ flex:1, padding:"10px 6px", borderRadius:9, cursor:"pointer", textAlign:"center", background:"rgba(167,139,250,0.1)", border:"1px solid rgba(167,139,250,0.25)", fontSize:11, fontWeight:700, color:"#a78bfa" }}>Text HOME<br/><span style={{fontSize:9}}>741741</span></div>
          <div onClick={() => window.open("https://www.emotionalppe.org","_blank")} style={{ flex:1, padding:"10px 6px", borderRadius:9, cursor:"pointer", textAlign:"center", background:"rgba(56,189,248,0.08)", border:"1px solid rgba(56,189,248,0.2)", fontSize:10, fontWeight:700, color:"#38bdf8" }}>Free Therapy<br/>Emotional PPE</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:5, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:5, marginBottom:16 }}>
        {["flows","education","resources"].map(t => (
          <div key={t} onClick={() => setTab(t)} style={{ flex:1, textAlign:"center", padding:"10px 8px", borderRadius:9, background:tab===t?"rgba(56,189,248,0.18)":"transparent", border:`1px solid ${tab===t?"rgba(56,189,248,0.35)":"transparent"}`, cursor:"pointer", fontSize:11, fontWeight:tab===t?800:600, color:tab===t?"#38bdf8":"#8099b0" }}>
            {t==="flows"?"Decompression":t==="education"?"Education":"Resources"}
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

      {tab==="education" && <SchoolEducation/>}
      {tab==="resources" && <SchoolResources/>}
    </ScreenSingle>
  );

  // FLOW - normalize + state selection
  if (screen==="flow" && flow) return (
    <ScreenSingle headerProps={{ onBack: goHome, agencyName:agency?.name, logoSrc }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
        <span style={{ fontSize:28 }}>{flow.icon}</span>
        <div style={{ fontSize:16, fontWeight:800, color:flow.color }}>{flow.label}</div>
      </div>

      <div style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${flow.color}20`, borderRadius:14, padding:"16px", marginBottom:20 }}>
        <div style={{ fontSize:14, color:"#dde8f4", lineHeight:1.8, fontStyle:"italic" }}>{flow.normalize}</div>
      </div>

      <div style={{ fontSize:12, color:"#475569", marginBottom:12 }}>How are you right now?</div>
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
    </ScreenSingle>
  );

  // STEPS
  if (screen==="steps" && flow) return (
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
          <div onClick={() => setScreen("reanchor")} style={{ flex:2, padding:"13px", borderRadius:12, cursor:"pointer", textAlign:"center", background:"rgba(56,189,248,0.1)", border:"1.5px solid rgba(56,189,248,0.3)", fontSize:13, fontWeight:700, color:"#38bdf8" }}>Continue</div>
        )}
      </div>
    </ScreenSingle>
  );

  // REANCHOR
  if (screen==="reanchor" && flow) return (
    <ScreenSingle headerProps={{ onBack:() => setScreen("steps"), agencyName:agency?.name, logoSrc }}>
      <div style={{ textAlign:"center", paddingTop:20, display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
        <div style={{ fontSize:48 }}>{flow.icon}</div>
        <div style={{ fontSize:16, fontWeight:800, color:"#dde8f4", maxWidth:300, textAlign:"center", lineHeight:1.6 }}>{flow.reanchor}</div>

        <div style={{ width:"100%", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"14px 16px", fontSize:11, color:"#334155", lineHeight:1.7, textAlign:"center" }}>
          Not reporting. Not documentation. Not admin tracking.<br/>Nothing here is stored or shared.
        </div>

        <div style={{ width:"100%", fontSize:13, fontWeight:700, color:"#94a3b8", textAlign:"center", marginBottom:4 }}>Want to talk to someone?</div>
        <div style={{ display:"flex", gap:10, width:"100%" }}>
          <div onClick={() => setScreen("support_internal")} style={{ flex:1, padding:"12px", borderRadius:12, cursor:"pointer", textAlign:"center", background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", fontSize:12, fontWeight:700, color:"#22c55e" }}>
            Internal<br/><span style={{fontSize:10,fontWeight:400}}>Peer · Counselor · Admin</span>
          </div>
          <div onClick={() => setShowExternal(true)} style={{ flex:1, padding:"12px", borderRadius:12, cursor:"pointer", textAlign:"center", background:"rgba(56,189,248,0.06)", border:"1px solid rgba(56,189,248,0.15)", fontSize:12, fontWeight:700, color:"#38bdf8" }}>
            External<br/><span style={{fontSize:10,fontWeight:400}}>Anonymous · Off-campus</span>
          </div>
        </div>

        {showExternal && (
          <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:8 }}>
            {EXTERNAL_RESOURCES.map(r => (
              <div key={r.key} onClick={() => r.action.startsWith("http")?window.open(r.action,"_blank"):window.location.href=r.action}
                style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"11px 14px", cursor:"pointer" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#dde8f4" }}>{r.label}</div>
                <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{r.detail}</div>
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

  // INTERNAL SUPPORT
  if (screen==="support_internal") return (
    <ScreenSingle headerProps={{ onBack:() => setScreen("reanchor"), agencyName:agency?.name, logoSrc }}>
      <div style={{ fontSize:16, fontWeight:800, color:"#dde8f4", marginBottom:6 }}>Internal Support</div>
      <div style={{ fontSize:12, color:"#64748b", lineHeight:1.6, marginBottom:20 }}>
        These contacts are configured by your district. Ask your principal or wellness coordinator for direct contact information.
      </div>
      {[
        {label:"Peer Support", icon:"🤝", detail:"A colleague who understands school work"},
        {label:"School Counselor", icon:"🧠", detail:"Counselors support staff too, not just students"},
        {label:"Admin Support", icon:"👔", detail:"Your principal or AP can be a resource too"},
        {label:"Employee Assistance Program (EAP)", icon:"💙", detail:"Confidential -- does not go in your personnel file"},
        {label:"Union Support Line", icon:"📋", detail:"Your union may have a confidential support line"},
      ].map((r,i) => (
        <div key={i} style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"13px 16px", marginBottom:8 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#dde8f4" }}>{r.icon} {r.label}</div>
          <div style={{ fontSize:11, color:"#475569", marginTop:3 }}>{r.detail}</div>
        </div>
      ))}
      <div onClick={() => setShowExternal(true)} style={{ marginTop:8, padding:"11px", borderRadius:11, cursor:"pointer", textAlign:"center", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", fontSize:12, fontWeight:600, color:"#475569" }}>
        Show external resources
      </div>
      {showExternal && (
        <div style={{ marginTop:10, display:"flex", flexDirection:"column", gap:8 }}>
          {EXTERNAL_RESOURCES.map(r => (
            <div key={r.key} onClick={() => r.action.startsWith("http")?window.open(r.action,"_blank"):window.location.href=r.action}
              style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"11px 14px", cursor:"pointer" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#dde8f4" }}>{r.label}</div>
              <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{r.detail}</div>
            </div>
          ))}
        </div>
      )}
    </ScreenSingle>
  );

  return null;
}

// Education Component
const SCHOOL_EDUCATION = [
  {
    title:"Compassion Fatigue Is Not a Teaching Problem -- It Is a Human Problem",
    body:"Compassion fatigue develops when you repeatedly absorb the emotional weight of other people's stress, trauma, and dysregulation. Teachers, counselors, and support staff do this every single day. It is not a sign that you are in the wrong job. It is a sign that you care, and that caring has a cost that needs to be acknowledged.",
    color:"#38bdf8",
  },
  {
    title:"Secondary Trauma in Schools -- What It Actually Is",
    body:"Secondary traumatic stress develops from indirect exposure to trauma -- hearing about it, witnessing its effects, responding to a student in crisis. School staff encounter this routinely. Self-harm disclosures. Family tragedies. Community violence that follows students into the building. These exposures accumulate. The fact that you were not the direct victim does not reduce the impact.",
    color:"#a78bfa",
  },
  {
    title:"Behavioral Escalation and the Nervous System",
    body:"When a student dysregulates severely, the adults in the room often co-regulate involuntarily -- meaning your nervous system responds to theirs. After a behavioral escalation, your body may be in a stress state even if you managed it calmly externally. That state needs a release before you move to the next classroom or the next task.",
    color:"#f97316",
  },
  {
    title:"The Invisible Workforce in Schools",
    body:"Bus drivers manage student behavior for hours before the school day officially begins. Custodial staff clean up after incidents. Front office staff absorb parent confrontations constantly. Cafeteria workers manage high-volume, high-behavior environments with almost no support. These roles carry significant occupational stress with almost no formal recognition or wellness structure.",
    color:"#22c55e",
  },
  {
    title:"Moral Distress for School Staff",
    body:"Moral distress occurs when you know what a student needs but cannot provide it -- because of caseload, resources, time, or system constraints. School counselors, social workers, and teachers experience this constantly. The frustration of seeing the gap between what is possible and what is needed is a specific, documented stressor. It needs to be named to be addressed.",
    color:"#eab308",
  },
  {
    title:"Why Burnout in Education Is Different",
    body:"Teacher burnout is not just job fatigue. It is the specific exhaustion that comes from combining high emotional labor, relational work, performance pressure, administrative load, and often personal investment in the outcomes of other people's children. These elements combine into a unique stress pattern that generic wellness tools do not address.",
    color:"#64748b",
  },
  {
    title:"The Case for Micro-Resets",
    body:"Research on school staff wellness shows that long decompression windows -- therapy, extended breaks, formal debriefs -- are rarely accessible during a school day. But 60-90 second micro-resets between classes, after incidents, or before difficult meetings have measurable physiological impact. Small, frequent interventions matter more than occasional large ones for shift workers in human-facing roles.",
    color:"#6366f1",
  },
];

function SchoolEducation() {
  const [open, setOpen] = useState(null);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6, marginBottom:4 }}>Plain language. Written for the people doing the work in schools.</div>
      {SCHOOL_EDUCATION.map((item,i) => (
        <div key={i} style={{ background:"rgba(255,255,255,0.025)", border:`1px solid ${open===i?item.color+"40":"rgba(255,255,255,0.06)"}`, borderRadius:14, overflow:"hidden" }}>
          <div onClick={() => setOpen(open===i?null:i)} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", cursor:"pointer" }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:item.color, flexShrink:0 }}/>
            <div style={{ flex:1, fontSize:13, fontWeight:700, color:open===i?item.color:"#dde8f4" }}>{item.title}</div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" style={{ transform:open===i?"rotate(90deg)":"none", transition:"transform 0.2s", flexShrink:0 }}><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          {open===i && <div style={{ padding:"0 16px 16px", fontSize:13, color:"#94a3b8", lineHeight:1.8 }}>{item.body}</div>}
        </div>
      ))}
    </div>
  );
}

function SchoolResources() {
  const [open, setOpen] = useState(null);
  const sections = [
    {
      title:"Crisis -- Always Available",
      color:"#ef4444",
      items:[
        {label:"988 Suicide and Crisis Lifeline", detail:"Call or text 988 - 24/7 - Free - Confidential", action:"tel:988"},
        {label:"Crisis Text Line", detail:"Text HOME to 741741 - 24/7", action:"sms:741741?body=HOME"},
      ]
    },
    {
      title:"Educator-Specific Support",
      color:"#38bdf8",
      items:[
        {label:"Emotional PPE Project", detail:"Free therapy for educators and helping professionals", action:"https://www.emotionalppe.org"},
        {label:"NEA Member Wellness", detail:"National Education Association wellness resources for members", action:"https://www.nea.org/professional-excellence/student-engagement/tools-tips/teacher-wellness"},
        {label:"AFT Wellbeing Resources", detail:"American Federation of Teachers mental health and wellness resources", action:"https://www.aft.org/wellbeing"},
        {label:"Educator Helpline (NC)", detail:"NC DPI teacher support and wellness resources", action:"https://www.dpi.nc.gov"},
      ]
    },
    {
      title:"Secondary Trauma and Burnout",
      color:"#a78bfa",
      items:[
        {label:"ProQOL Self-Assessment", detail:"Free self-assessment for compassion fatigue - used widely in education", action:"https://www.proqol.org"},
        {label:"Compassion Fatigue Awareness Project", detail:"Education and tools for secondary trauma in helping professions", action:"https://www.compassionfatigue.org"},
        {label:"Headington Institute", detail:"Resources for high-exposure human services workers including educators", action:"https://www.headington-institute.org"},
      ]
    },
    {
      title:"Mental Health Treatment",
      color:"#22c55e",
      items:[
        {label:"Open Path Collective", detail:"Affordable therapy - $30-$80 per session", action:"https://openpathcollective.org"},
        {label:"NAMI HelpLine", detail:"Free mental health information and referrals - 800-950-6264", action:"tel:18009506264"},
        {label:"Psychology Today Therapist Finder", detail:"Find a therapist by specialty, insurance, and location", action:"https://www.psychologytoday.com/us/therapists"},
      ]
    },
    {
      title:"NC-Specific Resources",
      color:"#22c55e",
      items:[
        {label:"NC DHHS Behavioral Health", detail:"NC mental health treatment and crisis services", action:"tel:18005274227"},
        {label:"NC 211", detail:"Local health and human services across NC", action:"tel:211"},
        {label:"NC Teacher Wellness Initiative", detail:"NCDPI teacher wellness resources", action:"https://www.dpi.nc.gov"},
      ]
    },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ fontSize:11, color:"#334155", lineHeight:1.6, marginBottom:4 }}>
        Internal school resources are configured by your district. These are external resources available to all school staff.
      </div>
      {sections.map((sec,si) => (
        <div key={si} style={{ background:"rgba(255,255,255,0.025)", border:`1px solid ${open===si?sec.color+"40":"rgba(255,255,255,0.06)"}`, borderRadius:14, overflow:"hidden" }}>
          <div onClick={() => setOpen(open===si?null:si)} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", cursor:"pointer" }}>
            <div style={{ flex:1, fontSize:13, fontWeight:700, color:open===si?sec.color:"#dde8f4" }}>{sec.title}</div>
            <div style={{ fontSize:10, color:"#475569" }}>{sec.items.length}</div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" style={{ transform:open===si?"rotate(90deg)":"none", transition:"transform 0.2s", flexShrink:0 }}><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          {open===si && (
            <div style={{ padding:"0 14px 14px" }}>
              {sec.items.map((item,i) => (
                <div key={i} onClick={() => item.action.startsWith("http")?window.open(item.action,"_blank"):window.location.href=item.action}
                  style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"11px 13px", marginBottom:6, cursor:"pointer" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#dde8f4", marginBottom:2 }}>{item.label}</div>
                  <div style={{ fontSize:11, color:"#94a3b8", lineHeight:1.5, marginBottom:4 }}>{item.detail}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:sec.color }}>{item.action.startsWith("http")?"Tap to open":"Tap to call"} -></div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
