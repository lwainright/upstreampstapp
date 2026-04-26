// ============================================================
// SCREEN: HospitalScreen
// Upstream Approach -- Hospital Staff Wellness
// Staff only. No patients. No PHI. No identity.
// Flow-based -- what happened, not who you are.
// This is not clinical care. Not reporting. Not documentation.
// ============================================================
import React, { useState, useEffect } from 'react';
import { ScreenSingle } from './ui.jsx';

const STAFF_GROUPS = [
  { key:"acute",          label:"Acute / High Intensity",        sub:"ED · ICU · OR · Trauma · Rapid Response · PACU",           icon:"🚨", color:"#ef4444" },
  { key:"bh",             label:"Behavioral Health + Crisis",    sub:"Psych · Detox · Crisis Stabilization · ED Psych",           icon:"🧠", color:"#a78bfa" },
  { key:"medsurg",        label:"Med/Surg + Inpatient",          sub:"Med/Surg · Telemetry · Oncology · Step-Down · Rehab",       icon:"🏥", color:"#38bdf8" },
  { key:"palliative",     label:"Palliative Care + Hospice",     sub:"Palliative · Hospice · Bereavement · End-of-Life",          icon:"🕯", color:"#94a3b8" },
  { key:"womenchildren",  label:"Women's and Children's",        sub:"L&D · NICU · Pediatrics · Mother/Baby · OB",                icon:"👶", color:"#ec4899" },
  { key:"support",        label:"Support Services",              sub:"Security · Transport · EVS · Dietary · Facilities · Sitters",icon:"🛡", color:"#f97316" },
  { key:"comms",          label:"Communications + Patient Relations", sub:"Public Info · Media · Patient Experience · Risk Mgmt", icon:"📡", color:"#eab308" },
  { key:"leadership",     label:"Leadership + Supervisors",      sub:"Charge Nurses · Managers · Directors · House Supervisors",  icon:"👔", color:"#64748b" },
  { key:"physicians",     label:"Physicians + APPs",             sub:"Attendings · Residents · Fellows · NPs · PAs",              icon:"⚕️", color:"#38bdf8" },
  { key:"interdisciplinary", label:"Interdisciplinary Teams",   sub:"Social Work · Case Mgmt · Chaplaincy · RT · PT/OT",         icon:"🤝", color:"#22c55e" },
];

const FLOWS = [
  {
    key:"code",
    label:"After a Code or Trauma",
    icon:"⚡",
    color:"#ef4444",
    normalize:"Your system just went through something intense. That does not switch off automatically.",
    states:[
      {key:"wired",     label:"Still amped / wired",       icon:"⚡"},
      {key:"numb",      label:"Flat / shut down",           icon:"😶"},
      {key:"heavy",     label:"Heavy / stuck",              icon:"🪨"},
      {key:"angry",     label:"Frustrated / angry",         icon:"🔥"},
    ],
    steps:[
      {title:"Stop moving for 10 seconds", body:"Do not go straight to the next thing. Your brain needs a break point to register that this event is over."},
      {title:"Orient to where you are now", body:"Look around. Name one thing you can see that is not related to what just happened. This tells your nervous system the event is done."},
      {title:"One slow exhale", body:"Breathe in through your nose. Exhale slowly through your mouth -- longer out than in. Do this once. That is enough to begin the shift."},
      {title:"Name one thing that ended", body:"\"That call is over.\" Your brain stays in the event until you give it an ending. Name it out loud if you can."},
    ],
    reanchor:"You are back in the room, not in the event.",
    resources:["peer","chaplain"],
    trackAs:"after_code",
  },
  {
    key:"violence",
    label:"After a Violent Incident",
    icon:"🛡",
    color:"#f97316",
    normalize:"Your body is still in alert mode. That is expected. It does not mean something is wrong with you.",
    states:[
      {key:"wired",   label:"Adrenaline still running",   icon:"⚡"},
      {key:"shaky",   label:"Shaky / unsettled",          icon:"😰"},
      {key:"angry",   label:"Angry",                      icon:"🔥"},
      {key:"numb",    label:"Shut down",                  icon:"😶"},
    ],
    steps:[
      {title:"Physical discharge first", body:"Press your hands together firmly for 5 seconds, then release. Physical tension needs a physical release before your brain can reset."},
      {title:"Safety check", body:"Look around. Are you in a safe space right now? If yes -- acknowledge it. Your nervous system needs that confirmation."},
      {title:"One breath", body:"Breathe in slow, exhale longer. One cycle is enough to interrupt the alert state."},
      {title:"Give it an ending", body:"The incident is over. It had an ending even if it does not feel that way yet. Say it: That is done."},
    ],
    reanchor:"You are safe enough right now. Your system will catch up.",
    resources:["peer","security"],
    trackAs:"after_violence",
  },
  {
    key:"death",
    label:"After a Death",
    icon:"🕯",
    color:"#475569",
    normalize:"You just held something heavy. That does not just switch off.",
    states:[
      {key:"heavy",     label:"Heavy / sad",       icon:"🪨"},
      {key:"numb",      label:"Numb / flat",        icon:"😶"},
      {key:"replaying", label:"Replaying it",       icon:"🔁"},
      {key:"okay",      label:"Okay for now",       icon:"💙"},
    ],
    steps:[
      {title:"Give yourself a moment", body:"Most people move directly to the next task after a death. That momentum is a coping mechanism. It works short-term. Give yourself 60 seconds before the next thing."},
      {title:"Slow exhale", body:"Exhale slowly. Longer out than in. Your body does not know the event is over until you tell it. The breath is how you tell it."},
      {title:"Name one thing you did that mattered", body:"Not whether the outcome was what you hoped. One thing you did that was right, or kind, or present. That counts."},
      {title:"Separate the weight", body:"The loss belongs to the patient and their family. You carried part of it for a moment -- which is part of the work. You do not have to carry it forward."},
    ],
    reanchor:"You showed up. That counts. You do not have to carry all of it forward.",
    resources:["chaplain","peer"],
    trackAs:"after_death",
  },
  {
    key:"peds",
    label:"Pediatric Case",
    icon:"👶",
    color:"#ec4899",
    normalize:"Pediatric cases hit differently. That is not weakness -- it is wiring.",
    states:[
      {key:"heavy",     label:"Heavy / sad",         icon:"🪨"},
      {key:"angry",     label:"Angry / frustrated",  icon:"🔥"},
      {key:"numb",      label:"Shut down",            icon:"😶"},
      {key:"replaying", label:"Replaying it",         icon:"🔁"},
    ],
    steps:[
      {title:"Acknowledge that this one is different", body:"Pediatric cases activate protective instincts that adult cases do not. Your nervous system is responding to something it was built to respond to. That is normal."},
      {title:"Physical reset", body:"Drop your shoulders. Press your feet into the floor. Take one slow breath. These are not techniques -- they are interrupts."},
      {title:"Separate the case from the child", body:"The child is not in front of you anymore. The case is over. Your brain may keep returning to it. That is a signal, not a command. You do not have to follow it."},
      {title:"One thing that was done right", body:"Even in cases that do not go the way you needed them to. What was one thing you or your team did that was right? Name it."},
    ],
    reanchor:"You did what you could with what you had.",
    resources:["peer","chaplain"],
    trackAs:"after_peds",
  },
  {
    key:"moral",
    label:"Moral Distress / Ethical Conflict",
    icon:"⚖️",
    color:"#a78bfa",
    normalize:"When what you are required to do conflicts with what you believe is right -- that leaves a mark.",
    states:[
      {key:"frustrated", label:"Frustrated / conflicted", icon:"🔥"},
      {key:"heavy",      label:"Heavy / burdened",        icon:"🪨"},
      {key:"angry",      label:"Angry",                   icon:"😤"},
      {key:"stuck",      label:"Stuck / can not move on", icon:"🔁"},
    ],
    steps:[
      {title:"Name the conflict clearly", body:"Not \"I am stressed.\" Specifically: what were you asked to do, and what did you believe was right? Naming it precisely reduces its power."},
      {title:"Separate what was yours", body:"You made a decision with the authority you had and the information you had. That is all anyone can do. The parts of the system that created the conflict are not yours to carry alone."},
      {title:"The moral distress is a signal", body:"It means you care. It means your values are intact. Feeling it is not weakness -- it is evidence that you are still engaged in the work the right way."},
      {title:"What is the next right thing", body:"Not the whole problem. Not fixing the system. Just the next right thing you can actually do. Focus there."},
    ],
    reanchor:"Your discomfort means your values are working. That is worth something.",
    resources:["peer","ethics","chaplain"],
    trackAs:"moral_distress",
  },
  {
    key:"holding",
    label:"Holding Space Fatigue",
    icon:"🫂",
    color:"#94a3b8",
    normalize:"You have been carrying other people's weight. That accumulates.",
    states:[
      {key:"drained",   label:"Drained / empty",       icon:"🪫"},
      {key:"heavy",     label:"Heavy / saturated",      icon:"🪨"},
      {key:"numb",      label:"Numb",                   icon:"😶"},
      {key:"tearful",   label:"On the edge",            icon:"💧"},
    ],
    steps:[
      {title:"You are allowed to put it down", body:"The work of holding space for others is real and it has a cost. You do not have to carry it out of this building."},
      {title:"What is yours vs what is theirs", body:"The grief belongs to the family. The fear belongs to the patient. You witnessed it and carried it for a moment -- which is the work. It does not have to be yours permanently."},
      {title:"One breath -- slow and complete", body:"Inhale. Hold briefly. Exhale longer than the inhale. This is not meditation. It is a physiological reset. One cycle is enough."},
      {title:"Name something that is yours", body:"One thing in your life outside this room that is yours. A person, a place, a plan. Something that exists beyond this work."},
    ],
    reanchor:"You do not have to carry all of it forward. What you did today was enough.",
    resources:["chaplain","peer"],
    trackAs:"holding_space_fatigue",
  },
  {
    key:"stacked",
    label:"Stacked Stress / Overwhelmed",
    icon:"📚",
    color:"#38bdf8",
    normalize:"This is not one thing. It is everything stacking.",
    states:[
      {key:"overwhelmed", label:"Overwhelmed / scattered", icon:"🌀"},
      {key:"exhausted",   label:"Exhausted",               icon:"😩"},
      {key:"shutdown",    label:"Shutting down",            icon:"😶"},
      {key:"irritable",   label:"Short fuse",              icon:"🔥"},
    ],
    steps:[
      {title:"Stop trying to solve all of it", body:"You cannot fix all of it in one shift. Your brain is trying to hold too many open loops at once. Close one."},
      {title:"The next one thing", body:"Not the whole problem. Not the whole shift. What is the next single thing you need to do? One thing. That is all you are responsible for right now."},
      {title:"Three breaths", body:"In through your nose. Out through your mouth. Three times. This is not a breathing exercise. It is a circuit breaker."},
      {title:"What can you actually control right now", body:"Not the staffing ratio. Not the administration. Not the patient's family. What can you actually affect in the next 10 minutes? Focus there."},
    ],
    reanchor:"Just the next step. Not all of them.",
    resources:["peer"],
    trackAs:"stacked_stress",
  },
  {
    key:"conflict",
    label:"Family or Team Conflict",
    icon:"⚡",
    color:"#f97316",
    normalize:"Conflict in high-stakes environments hits harder than conflict anywhere else.",
    states:[
      {key:"angry",      label:"Angry / frustrated",  icon:"🔥"},
      {key:"hurt",       label:"Hurt / dismissed",    icon:"💔"},
      {key:"replaying",  label:"Replaying it",         icon:"🔁"},
      {key:"tense",      label:"Still tense",          icon:"😤"},
    ],
    steps:[
      {title:"Let the adrenaline clear first", body:"You cannot process a conflict clearly while your nervous system is still in it. Give it 2-3 minutes before you decide what it means or what to do about it."},
      {title:"Separate the heat from the issue", body:"The intensity of the conflict is not the same as its importance. High-stakes environments create high-intensity moments. The heat is situational. The actual issue may be smaller."},
      {title:"What do you need right now", body:"To vent. To be heard. To step away. To resolve it. Identify one. That shapes your next move."},
      {title:"You do not have to resolve it today", body:"Not every conflict needs immediate resolution. Some need time. Your job right now is to regulate, not to fix."},
    ],
    reanchor:"You do not have to carry this forward. Address it when the heat is gone.",
    resources:["peer","leadership","patientrelations"],
    trackAs:"conflict",
  },
  {
    key:"narrative",
    label:"Narrative Burden / Story Weight",
    icon:"📡",
    color:"#eab308",
    normalize:"You are holding the story. Not just the facts -- the weight of it.",
    states:[
      {key:"heavy",     label:"Heavy / burdened",       icon:"🪨"},
      {key:"pressure",  label:"Pressure / tension",     icon:"😤"},
      {key:"conflicted",label:"Conflicted about it",    icon:"⚖️"},
      {key:"drained",   label:"Drained",                icon:"🪫"},
    ],
    steps:[
      {title:"Separate the story from yourself", body:"You communicated it. You held it. You carried it to the public or to a family or to leadership. That does not mean it is yours to keep."},
      {title:"Three facts vs three feelings", body:"Name three factual things about the situation. Then name three things you are feeling about it. Keeping them separate reduces the cognitive load."},
      {title:"Release the jaw and face", body:"Narrative stress lives in the face, jaw, and neck. Drop your jaw slightly. Release your forehead. Roll your shoulders back once. That physical release helps the cognitive release."},
      {title:"What is actually yours", body:"What part of this situation is genuinely your responsibility to carry? Name it specifically. Then name what is not yours. The second list is usually longer."},
    ],
    reanchor:"You can separate what is yours and what is not. The story is not you.",
    resources:["peer","chaplain","leadership"],
    trackAs:"narrative_burden",
  },
  {
    key:"decision",
    label:"Decision Fatigue",
    icon:"🧠",
    color:"#6366f1",
    normalize:"You have made too many decisions under too much pressure. That has a cost.",
    states:[
      {key:"foggy",    label:"Foggy / unclear",       icon:"🌫"},
      {key:"hesitant", label:"Second-guessing",       icon:"❓"},
      {key:"heavy",    label:"Heavy / burdened",      icon:"🪨"},
      {key:"shutdown", label:"Shutting down",          icon:"😶"},
    ],
    steps:[
      {title:"This is physiological, not a character flaw", body:"Decision fatigue is a documented phenomenon. Your brain uses glucose and cognitive resources to make decisions. After enough decisions, performance degrades. This is not weakness. It is biology."},
      {title:"Reduce the decision load now", body:"What is the next decision you actually have to make? Only that one. Not the ones after it. Just the next one."},
      {title:"Physical reset", body:"Stand up if you can. Walk 20 steps. Or just shift your weight. Physical movement breaks the cognitive loop."},
      {title:"Delegate one thing", body:"What is one thing in front of you that someone else can handle? Delegation is not weakness. It is operational triage."},
    ],
    reanchor:"You made the decisions you needed to make. That is the job.",
    resources:["peer","physician_support"],
    trackAs:"decision_fatigue",
  },
  {
    key:"isolation",
    label:"Isolation / Underrecognized Stress",
    icon:"🔇",
    color:"#475569",
    normalize:"What you do matters. The fact that it goes unrecognized does not change that.",
    states:[
      {key:"invisible",  label:"Invisible / overlooked", icon:"👻"},
      {key:"drained",    label:"Drained",                icon:"🪫"},
      {key:"frustrated", label:"Frustrated",             icon:"🔥"},
      {key:"disconnected",label:"Disconnected",          icon:"🔌"},
    ],
    steps:[
      {title:"The work is real even when the recognition is not", body:"The work you did happened. The impact was real. Recognition is external. The work is internal. One does not cancel the other."},
      {title:"Name what you actually did today", body:"Not what was noticed. Not what was praised. What did you actually do today that had value? Name it specifically."},
      {title:"Connection first", body:"Isolation stress is reduced by human contact, not by productivity. Before you do the next task -- make eye contact with one person. Say one thing. That is a real intervention."},
      {title:"Your role is part of the care", body:"No patient recovers in a dirty room. No code works without transport. No family gets answers without communications. Your role is not peripheral. It is infrastructure."},
    ],
    reanchor:"Your work is part of the care. That does not require anyone else to notice it.",
    resources:["peer"],
    trackAs:"isolation_stress",
  },
  {
    key:"whiplash",
    label:"Emotional Whiplash",
    icon:"🎢",
    color:"#ec4899",
    normalize:"Joy to crisis in seconds. Your system was not built for that transition without cost.",
    states:[
      {key:"disoriented", label:"Disoriented / jarred", icon:"🌀"},
      {key:"heavy",       label:"Heavy",                icon:"🪨"},
      {key:"numb",        label:"Shut down",            icon:"😶"},
      {key:"tearful",     label:"On the edge",          icon:"💧"},
    ],
    steps:[
      {title:"This transition is its own stress", body:"Going from a birth to a loss. From a save to a code. Your nervous system does not switch contexts cleanly. The disorientation is the gap between what just happened and what your system expected."},
      {title:"Name both moments separately", body:"Name what was in the room 10 minutes ago. Name what is in the room now. Keeping them as separate events helps your brain close the first one before entering the second."},
      {title:"Ground in right now", body:"Where are your feet? What is the temperature of the room? What can you hear that is neutral? Right now -- not what just happened, not what is next."},
      {title:"Give yourself permission to feel both", body:"The joy and the grief can coexist. You do not have to choose which one is appropriate. Both are real."},
    ],
    reanchor:"Both of those were real. You held them. That is the work.",
    resources:["peer","chaplain"],
    trackAs:"emotional_whiplash",
  },
];

// ── External Resources ────────────────────────────────────────
const EXTERNAL_RESOURCES = [
  { key:"988",             label:"988 Suicide and Crisis Lifeline",     detail:"Call or text 988 - 24/7 - Confidential",              action:"tel:988",            show:"crisis" },
  { key:"crisis_text",     label:"Crisis Text Line",                     detail:"Text HELLO to 741741 - 24/7",                         action:"sms:741741?body=HELLO", show:"always" },
  { key:"emotional_ppe",   label:"Emotional PPE Project",                detail:"Free therapy sessions for healthcare workers",         action:"https://www.emotionalppe.org", show:"always" },
  { key:"physician_line",  label:"Physician Support Line",               detail:"Anonymous - Staffed by volunteer psychiatrists",       action:"tel:18888090380",    show:"physicians" },
  { key:"safe_call",       label:"Safe Call Now",                        detail:"1-206-459-3020 - Public safety professionals",         action:"tel:12064593020",    show:"support" },
  { key:"schwartz",        label:"The Schwartz Center",                  detail:"Compassion support for healthcare workers",            action:"https://www.theschwartzcenter.org", show:"always" },
];

// ── Analytics tracker ─────────────────────────────────────────
async function trackHospitalFlow(flowKey, groupKey, agencyCode) {
  try {
    const { databases } = await import('./appwrite.js');
    const { ID } = await import('appwrite');
    const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE || '69c88588001ed071c19e';
    await databases.createDocument(DB_ID, 'tool_usage', ID.unique(), {
      agencyCode: agencyCode || 'HOSPITAL',
      toolName: 'hospital_' + flowKey,
      unitGroup: groupKey,
      timestamp: new Date().toISOString(),
    });
  } catch(e) {}
}

// ── Main Component ────────────────────────────────────────────
export default function HospitalScreen({ navigate, agency, logoSrc }) {
  const [screen, setScreen] = useState("home"); // home | group | flows | flow | state | steps | resources | crisis
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [showExternal, setShowExternal] = useState(false);
  const [tab, setTab] = useState("flows"); // flows | education | resources

  const group = STAFF_GROUPS.find(g => g.key === selectedGroup);
  const flow = FLOWS.find(f => f.key === selectedFlow);

  // QR context detection -- if URL has hospital context params
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ctx = params.get('hctx'); // hospital context
      const unit = params.get('hunit'); // hospital unit
      if (ctx) {
        // Map QR context to flow
        const contextMap = {
          'code':      'code',
          'violence':  'violence',
          'death':     'death',
          'peds':      'peds',
          'shiftend':  'stacked',
        };
        const flowKey = contextMap[ctx];
        if (flowKey) {
          setSelectedFlow(flowKey);
          if (unit) setSelectedGroup(unit);
          setScreen("flow");
        }
      }
    } catch(e) {}
  }, []);

  const startFlow = (flowKey, groupKey) => {
    setSelectedFlow(flowKey);
    setActiveStep(0);
    setSelectedState(null);
    setShowExternal(false);
    trackHospitalFlow(flowKey, groupKey || selectedGroup, agency?.code);
    setScreen("flow");
  };

  const goHome = () => {
    setScreen("home");
    setSelectedGroup(null);
    setSelectedFlow(null);
    setSelectedState(null);
    setActiveStep(0);
    setShowExternal(false);
  };

  // ── HOME ──
  if (screen === "home") return (
    <ScreenSingle headerProps={{ onBack: () => navigate("home"), agencyName: agency?.name, logoSrc }}>
      <div style={{ fontSize:18, fontWeight:800, color:"#dde8f4", marginBottom:4 }}>Hospital Staff Wellness</div>
      <div style={{ fontSize:12, color:"#64748b", lineHeight:1.6, marginBottom:4 }}>
        Anonymous. Not clinical care. Not reporting. Not documentation.
      </div>

      {/* Crisis always at top */}
      <div style={{ background:"rgba(239,68,68,0.07)", border:"1.5px solid rgba(239,68,68,0.2)", borderRadius:12, padding:"12px 16px", marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:800, color:"#ef4444", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>If you need help right now</div>
        <div style={{ display:"flex", gap:8 }}>
          <div onClick={() => window.location.href="tel:988"} style={{ flex:1, padding:"10px 6px", borderRadius:9, cursor:"pointer", textAlign:"center", background:"rgba(239,68,68,0.15)", border:"1.5px solid rgba(239,68,68,0.35)", fontSize:13, fontWeight:800, color:"#ef4444" }}>988</div>
          <div onClick={() => window.location.href="sms:741741?body=HELLO"} style={{ flex:1, padding:"10px 6px", borderRadius:9, cursor:"pointer", textAlign:"center", background:"rgba(167,139,250,0.1)", border:"1px solid rgba(167,139,250,0.25)", fontSize:11, fontWeight:700, color:"#a78bfa" }}>Text HELLO<br/><span style={{fontSize:9}}>741741</span></div>
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

      {/* FLOWS TAB */}
      {tab==="flows" && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#475569", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>What just happened?</div>
          {FLOWS.map(f => (
            <div key={f.key} onClick={() => startFlow(f.key, null)} style={{ background:f.color+"08", border:`1px solid ${f.color}20`, borderRadius:14, padding:"14px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:14 }}>
              <span style={{ fontSize:24, flexShrink:0 }}>{f.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:f.color }}>{f.label}</div>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={f.color} strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}
        </div>
      )}

      {/* EDUCATION TAB */}
      {tab==="education" && <HospitalEducation/>}

      {/* RESOURCES TAB */}
      {tab==="resources" && <HospitalResources agency={agency}/>}
    </ScreenSingle>
  );

  // ── FLOW SCREENS ──
  if (screen==="flow" && flow) return (
    <ScreenSingle headerProps={{ onBack:() => { setScreen("home"); setSelectedFlow(null); }, agencyName:agency?.name, logoSrc }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
        <span style={{ fontSize:28 }}>{flow.icon}</span>
        <div style={{ fontSize:16, fontWeight:800, color:flow.color }}>{flow.label}</div>
      </div>

      {/* Normalize */}
      <div style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${flow.color}20`, borderRadius:14, padding:"16px", marginBottom:20 }}>
        <div style={{ fontSize:14, color:"#dde8f4", lineHeight:1.8, fontStyle:"italic" }}>{flow.normalize}</div>
      </div>

      {/* State selection */}
      {!selectedState ? (
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
      ) : null}
    </ScreenSingle>
  );

  // ── STEPS SCREEN ──
  if (screen==="steps" && flow) return (
    <ScreenSingle headerProps={{ onBack:() => setScreen("flow"), agencyName:agency?.name, logoSrc }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
        <span style={{ fontSize:22 }}>{flow.icon}</span>
        <div style={{ fontSize:14, fontWeight:800, color:flow.color }}>{flow.label}</div>
      </div>

      {/* Step progress */}
      <div style={{ display:"flex", gap:6, marginBottom:20 }}>
        {flow.steps.map((_, i) => (
          <div key={i} onClick={() => setActiveStep(i)} style={{ flex:1, height:4, borderRadius:2, cursor:"pointer", background:i===activeStep?flow.color:i<activeStep?flow.color+"60":"rgba(255,255,255,0.08)", transition:"all 0.2s" }}/>
        ))}
      </div>

      {/* Current step */}
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

  // ── REANCHOR SCREEN ──
  if (screen==="reanchor" && flow) return (
    <ScreenSingle headerProps={{ onBack:() => setScreen("steps"), agencyName:agency?.name, logoSrc }}>
      <div style={{ textAlign:"center", paddingTop:20, display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
        <div style={{ fontSize:48 }}>{flow.icon}</div>
        <div style={{ fontSize:16, fontWeight:800, color:"#dde8f4", maxWidth:300, textAlign:"center", lineHeight:1.6 }}>{flow.reanchor}</div>

        <div style={{ width:"100%", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"14px 16px", fontSize:11, color:"#334155", lineHeight:1.7, textAlign:"center" }}>
          This is not clinical care. Not reporting. Not documentation.<br/>Nothing you entered here is stored or shared.
        </div>

        {/* Support routing */}
        <div style={{ width:"100%", fontSize:13, fontWeight:700, color:"#94a3b8", textAlign:"center", marginBottom:4 }}>Want to talk to someone?</div>
        <div style={{ display:"flex", gap:10, width:"100%" }}>
          <div onClick={() => setScreen("support_internal")} style={{ flex:1, padding:"12px", borderRadius:12, cursor:"pointer", textAlign:"center", background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", fontSize:12, fontWeight:700, color:"#22c55e" }}>
            Internal<br/><span style={{fontSize:10,fontWeight:400}}>Peer · Chaplain · Security</span>
          </div>
          <div onClick={() => setShowExternal(true)} style={{ flex:1, padding:"12px", borderRadius:12, cursor:"pointer", textAlign:"center", background:"rgba(56,189,248,0.06)", border:"1px solid rgba(56,189,248,0.15)", fontSize:12, fontWeight:700, color:"#38bdf8" }}>
            External<br/><span style={{fontSize:10,fontWeight:400}}>Anonymous · Off-facility</span>
          </div>
        </div>

        {showExternal && (
          <div style={{ width:"100%", display:"flex", flexDirection:"column", gap:8 }}>
            {EXTERNAL_RESOURCES.filter(r => r.show==="always" || r.show===selectedGroup).map(r => (
              <div key={r.key} onClick={() => {
                if(r.action.startsWith("http")) window.open(r.action,"_blank");
                else window.location.href=r.action;
              }} style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"11px 14px", cursor:"pointer" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#dde8f4" }}>{r.label}</div>
                <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{r.detail}</div>
              </div>
            ))}
          </div>
        )}

        <div onClick={goHome} style={{ padding:"12px 28px", borderRadius:12, cursor:"pointer", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", fontSize:12, fontWeight:600, color:"#475569" }}>
          Not now -- return home
        </div>
      </div>
    </ScreenSingle>
  );

  // ── INTERNAL SUPPORT SCREEN ──
  if (screen==="support_internal") return (
    <ScreenSingle headerProps={{ onBack:() => setScreen("reanchor"), agencyName:agency?.name, logoSrc }}>
      <div style={{ fontSize:16, fontWeight:800, color:"#dde8f4", marginBottom:6 }}>Internal Support</div>
      <div style={{ fontSize:12, color:"#64748b", lineHeight:1.6, marginBottom:20 }}>
        These contacts are configured by your hospital. Contact your manager or wellness team if a resource is missing.
      </div>
      <div style={{ background:"rgba(56,189,248,0.05)", border:"1px solid rgba(56,189,248,0.12)", borderRadius:12, padding:"16px", textAlign:"center" }}>
        <div style={{ fontSize:13, color:"#94a3b8", lineHeight:1.7 }}>
          Your hospital configures peer support, chaplaincy, security, and EAP contacts in the admin panel. Ask your department lead or wellness coordinator for direct contact information.
        </div>
      </div>
      <div style={{ marginTop:16, display:"flex", flexDirection:"column", gap:10 }}>
        {[
          {label:"Peer Support", icon:"🤝", detail:"A colleague who has been there"},
          {label:"Chaplaincy / Spiritual Care", icon:"🕯", detail:"Available to all staff regardless of faith"},
          {label:"Employee Assistance Program (EAP)", icon:"💙", detail:"Confidential -- does not go in your file"},
          {label:"Security", icon:"🛡", detail:"After violent incidents or safety concerns"},
        ].map((r,i) => (
          <div key={i} style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"13px 16px" }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#dde8f4" }}>{r.icon} {r.label}</div>
            <div style={{ fontSize:11, color:"#475569", marginTop:3 }}>{r.detail}</div>
          </div>
        ))}
      </div>
      <div onClick={() => setShowExternal(true)} style={{ marginTop:16, padding:"12px", borderRadius:12, cursor:"pointer", textAlign:"center", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", fontSize:12, fontWeight:600, color:"#475569" }}>
        Show external resources instead
      </div>
      {showExternal && (
        <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:8 }}>
          {EXTERNAL_RESOURCES.filter(r=>r.show==="always").map(r=>(
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

// ── Education Component ───────────────────────────────────────
const EDUCATION_ARTICLES = [
  {
    title:"Compassion Fatigue Is Real and It Has a Name",
    body:"Compassion fatigue develops from indirect exposure to suffering -- through what you hear, witness, and carry in your work. Symptoms look exactly like PTSD: intrusive thoughts, emotional numbing, hypervigilance, irritability. It is not weakness. It is what happens when you care deeply about the work for a sustained period without adequate recovery.",
    color:"#38bdf8",
  },
  {
    title:"Moral Distress -- When the System Conflicts With Your Values",
    body:"Moral distress occurs when you know the right thing to do but are constrained from doing it -- by the system, by resources, by hierarchy, by time. It is different from burnout. It leaves a specific kind of weight. Naming it accurately is the first step to addressing it.",
    color:"#a78bfa",
  },
  {
    title:"The Invisible Workforce -- Support Services and Secondary Trauma",
    body:"Environmental services staff clean the room after a death. Transport staff move patients through chaos. Security staff deescalate volatile situations. Dietary staff interact with frightened families. These roles absorb institutional trauma with almost zero formal support. Secondary traumatic stress does not require a clinical role to develop.",
    color:"#f97316",
  },
  {
    title:"Palliative Care -- The Weight of Presence",
    body:"Palliative care and hospice staff sit with dying patients and grieving families as a core job function. The cumulative weight of that presence -- often invisible to acute care colleagues -- is one of the highest occupational emotional loads in healthcare. Holding space for others requires its own recovery.",
    color:"#94a3b8",
  },
  {
    title:"Physicians and the Permission to Struggle",
    body:"Medical culture has historically treated struggle as incompatibility with the role. The data says otherwise: physician burnout rates exceed 50% nationally. Moral injury is documented across specialties. The perfection standard does not protect patients -- it delays physicians from getting support that would make them more present, not less.",
    color:"#6366f1",
  },
  {
    title:"Why Narrative Burden Is a Real Stressor",
    body:"Communications staff, patient relations teams, and risk management liaisons carry the emotional weight of institutional stories. They hold family complaints, media inquiries, and crisis narratives -- often without acknowledgment that this is its own form of secondary trauma exposure. Cognitive-emotional load is still load.",
    color:"#eab308",
  },
  {
    title:"What Psychological Safety Actually Means in a Hospital",
    body:"Psychological safety is not about feelings. It is about whether people can raise concerns, report errors, and ask for help without fear of punishment. When it is absent, errors increase, burnout increases, and staff leave. When it is present, outcomes improve. This app is not a substitute for psychological safety -- but it is a bridge when it is missing.",
    color:"#22c55e",
  },
];

function HospitalEducation() {
  const [open, setOpen] = useState(null);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6, marginBottom:4 }}>
        Plain language. No clinical jargon. Written for the people doing the work.
      </div>
      {EDUCATION_ARTICLES.map((item,i) => (
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

// ── Resources Component ───────────────────────────────────────
function HospitalResources({ agency }) {
  const sections = [
    {
      title:"Crisis -- Always Available",
      color:"#ef4444",
      items:[
        {label:"988 Suicide and Crisis Lifeline", detail:"Call or text 988 - 24/7 - Free - Confidential", action:"tel:988"},
        {label:"Crisis Text Line", detail:"Text HELLO to 741741 - 24/7", action:"sms:741741?body=HELLO"},
      ]
    },
    {
      title:"Healthcare Worker Support",
      color:"#38bdf8",
      items:[
        {label:"Emotional PPE Project", detail:"Free therapy sessions for healthcare workers - emotionalppe.org", action:"https://www.emotionalppe.org"},
        {label:"Physician Support Line", detail:"Anonymous - Volunteer psychiatrists - 888-409-0380", action:"tel:18884090380"},
        {label:"The Schwartz Center", detail:"Compassion support and Schwartz Rounds for healthcare teams", action:"https://www.theschwartzcenter.org"},
        {label:"American Nurses Foundation - Well-Being", detail:"Resources and grants for nurse mental health", action:"https://www.nursingworld.org/foundation/programs/well-being-initiative/"},
        {label:"AMA - Physician Well-Being Resources", detail:"American Medical Association burnout and support tools", action:"https://www.ama-assn.org/practice-management/physician-health"},
      ]
    },
    {
      title:"Secondary Trauma and Compassion Fatigue",
      color:"#a78bfa",
      items:[
        {label:"ProQOL Self-Assessment", detail:"Free self-assessment for compassion fatigue - proqol.org", action:"https://www.proqol.org"},
        {label:"Headington Institute", detail:"Resources for high-exposure healthcare workers", action:"https://www.headington-institute.org"},
        {label:"Compassion Fatigue Awareness Project", detail:"Education and tools for secondary trauma", action:"https://www.compassionfatigue.org"},
      ]
    },
    {
      title:"NICU and Pediatric Staff",
      color:"#ec4899",
      items:[
        {label:"NICU Parent Support -- Staff Resources", detail:"Support networks for NICU staff navigating family grief", action:"https://www.handtohold.org"},
        {label:"Pediatric Trauma Foundation", detail:"Resources for pediatric healthcare staff", action:"https://www.pediatrictraumafoundation.org"},
      ]
    },
    {
      title:"Palliative Care Staff",
      color:"#94a3b8",
      items:[
        {label:"National Hospice and Palliative Care Organization", detail:"Staff wellness resources for palliative care teams", action:"https://www.nhpco.org"},
        {label:"Schwartz Rounds", detail:"Structured support for clinicians dealing with end-of-life care", action:"https://www.theschwartzcenter.org/programs/schwartz-rounds/"},
      ]
    },
    {
      title:"Peer Support and Mental Health Treatment",
      color:"#22c55e",
      items:[
        {label:"Open Path Collective", detail:"Affordable therapy - $30-$80 per session", action:"https://openpathcollective.org"},
        {label:"NAMI HelpLine", detail:"Free mental health info and referrals - 800-950-6264", action:"tel:18009506264"},
        {label:"Psychology Today Therapist Finder", detail:"Find a therapist by specialty and insurance", action:"https://www.psychologytoday.com/us/therapists"},
        {label:"Safe Call Now", detail:"1-206-459-3020 - Public safety and healthcare support", action:"tel:12064593020"},
      ]
    },
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <div style={{ fontSize:11, color:"#334155", lineHeight:1.6, marginBottom:4 }}>
        Internal resources are configured by your hospital in the admin panel. These are external resources available to all healthcare staff.
      </div>
      {sections.map((sec,si) => (
        <ResourceSection key={si} section={sec}/>
      ))}
    </div>
  );
}

function ResourceSection({ section }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background:"rgba(255,255,255,0.025)", border:`1px solid ${open?section.color+"40":"rgba(255,255,255,0.06)"}`, borderRadius:14, overflow:"hidden" }}>
      <div onClick={() => setOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", cursor:"pointer" }}>
        <div style={{ flex:1, fontSize:13, fontWeight:700, color:open?section.color:"#dde8f4" }}>{section.title}</div>
        <div style={{ fontSize:10, color:"#475569" }}>{section.items.length}</div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" style={{ transform:open?"rotate(90deg)":"none", transition:"transform 0.2s", flexShrink:0 }}><polyline points="9 18 15 12 9 6"/></svg>
      </div>
      {open && (
        <div style={{ padding:"0 14px 14px" }}>
          {section.items.map((item,i) => (
            <div key={i} onClick={() => item.action.startsWith("http")?window.open(item.action,"_blank"):window.location.href=item.action}
              style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"11px 13px", marginBottom:6, cursor:"pointer" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#dde8f4", marginBottom:2 }}>{item.label}</div>
              <div style={{ fontSize:11, color:"#94a3b8", lineHeight:1.5, marginBottom:4 }}>{item.detail}</div>
              <div style={{ fontSize:11, fontWeight:700, color:section.color }}>
                {item.action.startsWith("http")?"Tap to open":"Tap to call or text"} →
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
