// ============================================================
// SCREEN: MentalHealthProfScreen
// Upstream Approach -- Mental Health Professional Gear
// Reflective practice. Peer support. Decompression.
// NOT clinical documentation. NOT case notes. NOT PHI.
// On-device only. No sync. No cloud. No identifiers.
// Dump Mode auto-deletes. Saved notes are PIN protected.
// This is the same legal category as a personal journal.
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { ScreenSingle } from './ui.jsx';

// Rotating arrival prompts -- human, non-clinical
const ARRIVAL_PROMPTS = [
  "What is sitting with you right now?",
  "What do you want to leave here before you go home?",
  "What part of today felt heavier than usual?",
  "What are you still carrying from this week?",
  "What surprised you today?",
  "What do you want to set down before you walk out?",
  "What boundary felt harder to hold today?",
  "What moment reminded you why you do this work?",
];

const REFLECTIVE_PROMPTS = [
  "What hit me today",
  "What I carried home that was not mine to carry",
  "What I am proud of",
  "What drained me more than usual",
  "What boundary slipped and what helped me catch it",
  "What I want to remember for myself",
  "What I want to let go of before tomorrow",
  "A moment that reminded me why I do this work",
];

const BOUNDARY_RESETS = [
  {
    key:"leaveroom",
    label:"Leave the Room Behind",
    icon:"🚪",
    color:"#38bdf8",
    steps:[
      {title:"Notice what you are still carrying", body:"Before you walk out, take one moment to notice what is still active in your body or mind from the day. You do not have to name it in detail. Just notice it is there."},
      {title:"Name it without details", body:"Give it a one-word label if you can. Heavy. Sad. Frustrated. Unresolved. That is enough. You are not solving it right now. You are just acknowledging it exists."},
      {title:"Picture setting it down", body:"Imagine putting that thing -- whatever you named -- on a surface in the room behind you. Not forever. Just for now. It will be there if you need to return to it. You do not have to carry it out."},
      {title:"One slow breath", body:"Exhale longer than you inhale. That breath is your signal that you are transitioning out of the professional role and into the personal one."},
      {title:"Step into the next moment lighter", body:"You showed up today. You held what you could hold. That is the work. The rest belongs to tomorrow."},
    ],
    reanchor:"You are allowed to leave it in the room.",
  },
  {
    key:"helpermode",
    label:"Shift Out of Helper Mode",
    icon:"🔄",
    color:"#a78bfa",
    steps:[
      {title:"You are off the clock", body:"Your nervous system does not automatically know when the session ends. The attentiveness, the tracking, the holding -- those states do not switch off without a signal. This is your signal."},
      {title:"Your needs are valid too", body:"You spent the day attending to other people's emotional states. Before you move into the rest of your day, check in with your own. What do you need right now? Food. Quiet. Movement. Something that has nothing to do with work."},
      {title:"Release the scanning", body:"In helper mode, you are constantly reading the room -- tone, body language, affect, risk. You can release that now. You are not responsible for reading anyone right now. Just be present to yourself."},
      {title:"Return to yourself", body:"Check in with your own baseline. Your own body. Your own needs. Not your client's, not your agency's, not your supervisor's. Yours."},
    ],
    reanchor:"You are allowed to be a person again, not the role.",
  },
  {
    key:"emotionaltab",
    label:"Close the Emotional Tab",
    icon:"🧠",
    color:"#22c55e",
    steps:[
      {title:"What tabs are still open", body:"Think of your mind like a browser. At the end of a heavy day, you may have multiple emotional tabs open -- a session that did not resolve, a disclosure that surprised you, a supervision conversation that left something unsettled. You do not have to close them all. Just notice which ones are running."},
      {title:"You cannot resolve everything today", body:"Some things in this work do not resolve in a single day. Holding the discomfort of an open loop is part of the job. It is also okay to set it aside intentionally, knowing it will be there when you return to it."},
      {title:"Choose one to close for now", body:"Pick one open thread -- just one -- and consciously decide to set it aside until tomorrow. Not forever. Just for now. Name it to yourself and put it down."},
      {title:"Three slow breaths", body:"Inhale through your nose. Exhale longer than your inhale. Three times. That is your system telling itself the active processing window is closing for today."},
    ],
    reanchor:"Your mind is allowed to rest. The work will still be there tomorrow.",
  },
  {
    key:"returntoyourself",
    label:"Return to Yourself",
    icon:"💙",
    color:"#f97316",
    steps:[
      {title:"Where are you right now", body:"Not professionally. Personally. In your own body, in your own life. What is the temperature of the room? What can you hear that has nothing to do with work? Ground in the physical present for one moment."},
      {title:"What is yours today", body:"Not what belongs to your clients or your agency or your caseload. What is happening in your own life today? One thing. Name it."},
      {title:"What do you need", body:"Not what your clients need, not what the system needs, not what your supervisor needs. What do you need right now? Rest. Connection. Food. Silence. Movement. Name one thing."},
      {title:"Give yourself permission", body:"You spend significant professional energy giving other people permission to struggle, to need support, to be human. You have the same permission. Take a moment to extend to yourself what you extend to others."},
    ],
    reanchor:"You are a person first. The role is what you do, not all of who you are.",
  },
];

const EXTERNAL_RESOURCES = [
  {
    title:"Clinician-Specific Peer Support",
    color:"#38bdf8",
    items:[
      {label:"Emotional PPE Project", detail:"Free confidential therapy for healthcare and mental health workers - not reported to your employer", action:"https://www.emotionalppe.org"},
      {label:"Therapist Aid -- Clinician Self-Care", detail:"Non-clinical tools and worksheets specifically for mental health professionals", action:"https://www.therapistaid.com/therapy-article/self-care-for-therapists"},
      {label:"National Volunteer Caregiver Network", detail:"Resources for helpers navigating compassion fatigue and burnout", action:"https://www.volunteercaregiving.org"},
    ]
  },
  {
    title:"Compassion Fatigue and Burnout Education",
    color:"#a78bfa",
    items:[
      {label:"ProQOL -- Professional Quality of Life", detail:"Research-based education on compassion fatigue and secondary trauma - non-clinical overview", action:"https://www.proqol.org"},
      {label:"Compassion Fatigue Awareness Project", detail:"Plain-language education to help name what you are experiencing", action:"https://www.compassionfatigue.org"},
      {label:"NCTSN -- Secondary Traumatic Stress Resources", detail:"For clinicians working with high-trauma populations", action:"https://www.nctsn.org/trauma-informed-care/secondary-traumatic-stress"},
      {label:"SAMHSA -- Practitioner Well-Being", detail:"Workforce wellness and stress management resources for mental health workers", action:"https://www.samhsa.gov/workforce/practitioner-wellness"},
      {label:"APA -- Self-Care for Psychologists", detail:"Burnout prevention and boundary-setting guidance from APA", action:"https://www.apa.org/topics/self-care"},
    ]
  },
  {
    title:"Ethics, Boundaries, and Professional Support",
    color:"#22c55e",
    items:[
      {label:"NASW -- Self-Care and Professional Boundaries", detail:"General guidance on maintaining boundaries as a social worker", action:"https://www.socialworkers.org/Practice/Clinical-Social-Work/Self-Care"},
      {label:"ACA -- Professional Wellness Resources", detail:"American Counseling Association resources for counselor well-being", action:"https://www.counseling.org/knowledge-center/vistas/by-subject/vistas-counselor-wellness"},
      {label:"APA Ethics and Self-Care Articles", detail:"Educational resources on ethics and personal wellness for psychologists", action:"https://www.apa.org/ethics"},
    ]
  },
  {
    title:"Crisis -- Always Available",
    color:"#ef4444",
    items:[
      {label:"988 Suicide and Crisis Lifeline", detail:"Call or text 988 - 24/7 - Not tied to your employer or license", action:"tel:988"},
      {label:"Crisis Text Line", detail:"Text HOME to 741741 - 24/7 - Anonymous", action:"sms:741741?body=HOME"},
      {label:"SAMHSA National Helpline", detail:"Free confidential substance and mental health referrals - 800-662-4357", action:"tel:18006624357"},
    ]
  },
  {
    title:"Grounding and Reset Tools",
    color:"#f97316",
    items:[
      {label:"UCLA Mindful Awareness Research Center", detail:"Free guided grounding practices - non-clinical", action:"https://www.uclahealth.org/programs/marc/free-guided-meditations"},
      {label:"Insight Timer", detail:"Free grounding and breathing tracks - general wellness, not therapy", action:"https://insighttimer.com"},
      {label:"VA Mindfulness Coach App", detail:"Free public app for general grounding - not VA-exclusive", action:"https://mobile.va.gov/app/mindfulness-coach"},
    ]
  },
  {
    title:"Affordable Therapy for Clinicians",
    color:"#64748b",
    items:[
      {label:"Open Path Collective", detail:"Affordable therapy - $30-$80 per session - clinicians need therapy too", action:"https://openpathcollective.org"},
      {label:"Inclusive Therapists", detail:"Therapist directory with cultural and identity competency filters", action:"https://www.inclusivetherapists.com"},
      {label:"Psychology Today Therapist Finder", detail:"Filter for sliding scale and specialties including clinician burnout", action:"https://www.psychologytoday.com/us/therapists"},
    ]
  },
];

// Storage keys -- on-device localStorage only
const NOTES_KEY = "upstream_mhp_notes";
const PIN_KEY = "upstream_mhp_pin";
const ONBOARDED_KEY = "upstream_mhp_onboarded";

export default function MentalHealthProfScreen({ navigate, agency, logoSrc }) {
  const [screen, setScreen] = useState("loading"); // loading|onboard|home|dump|notes|boundary|checkin|resources
  const [tab, setTab] = useState("tools");
  const [arrivalPrompt] = useState(() => ARRIVAL_PROMPTS[Math.floor(Math.random() * ARRIVAL_PROMPTS.length)]);
  const [selectedBoundary, setSelectedBoundary] = useState(null);
  const [boundaryStep, setBoundaryStep] = useState(0);
  const [openResource, setOpenResource] = useState(null);

  useEffect(() => {
    try {
      const onboarded = localStorage.getItem(ONBOARDED_KEY);
      const pin = localStorage.getItem(PIN_KEY);
      if (!onboarded) {
        setScreen("onboard1");
      } else if (pin) {
        setScreen("pincheck");
      } else {
        setScreen("home");
      }
    } catch(e) {
      setScreen("home");
    }
  }, []);

  const goHome = () => {
    setScreen("home");
    setSelectedBoundary(null);
    setBoundaryStep(0);
  };

  // LOADING
  if (screen === "loading") return null;

  // ONBOARDING
  if (screen === "onboard1") return (
    <ScreenSingle headerProps={{ onBack: () => navigate("home"), agencyName: agency?.name, logoSrc }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", padding:"20px 0", gap:16 }}>
        <div style={{ fontSize:48 }}>🧠</div>
        <div style={{ fontSize:18, fontWeight:800, color:"#dde8f4", lineHeight:1.4 }}>A private space for helpers who carry a lot</div>
        <div style={{ fontSize:13, color:"#94a3b8", lineHeight:1.8, maxWidth:320 }}>
          This gear is for mental health professionals who want a place to breathe, unload, and reset. It is not for case notes or clinical documentation. It is for you -- your reactions, your reflections, your boundaries, your humanity.
        </div>
        <div onClick={() => setScreen("onboard2")} style={{ width:"100%", padding:"14px", borderRadius:12, cursor:"pointer", textAlign:"center", background:"rgba(56,189,248,0.1)", border:"1.5px solid rgba(56,189,248,0.3)", fontSize:14, fontWeight:800, color:"#38bdf8", marginTop:8 }}>Continue</div>
      </div>
    </ScreenSingle>
  );

  if (screen === "onboard2") return (
    <ScreenSingle headerProps={{ onBack: () => setScreen("onboard1"), agencyName: agency?.name, logoSrc }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", padding:"20px 0", gap:16 }}>
        <div style={{ fontSize:48 }}>📝</div>
        <div style={{ fontSize:18, fontWeight:800, color:"#dde8f4", lineHeight:1.4 }}>Reflective practice, not clinical documentation</div>
        <div style={{ fontSize:13, color:"#94a3b8", lineHeight:1.8, maxWidth:320 }}>
          You can write about your day, your reactions, your stress, your wins, your triggers, or anything weighing on you. Just avoid names or details that identify anyone. This keeps everything clean, safe, and yours.
        </div>
        <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"14px 16px", fontSize:12, color:"#475569", lineHeight:1.7, textAlign:"left" }}>
          No PHI. No identifiers. No clinical documentation. This is not a medical record. It is a private decompression space -- legally in the same category as a personal journal.
        </div>
        <div onClick={() => setScreen("onboard3")} style={{ width:"100%", padding:"14px", borderRadius:12, cursor:"pointer", textAlign:"center", background:"rgba(56,189,248,0.1)", border:"1.5px solid rgba(56,189,248,0.3)", fontSize:14, fontWeight:800, color:"#38bdf8" }}>Got it</div>
      </div>
    </ScreenSingle>
  );

  if (screen === "onboard3") return (
    <ScreenSingle headerProps={{ onBack: () => setScreen("onboard2"), agencyName: agency?.name, logoSrc }}>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", padding:"20px 0", gap:16 }}>
        <div style={{ fontSize:48 }}>🔒</div>
        <div style={{ fontSize:18, fontWeight:800, color:"#dde8f4", lineHeight:1.4 }}>Everything stays on your device</div>
        <div style={{ fontSize:13, color:"#94a3b8", lineHeight:1.8, maxWidth:320 }}>
          Nothing syncs. Nothing uploads. Nothing is shared. You control what stays and what gets deleted. Dump Mode clears itself automatically when you close it.
        </div>
        <div onClick={() => { try { localStorage.setItem(ONBOARDED_KEY, "true"); } catch(e){} setScreen("home"); }} style={{ width:"100%", padding:"14px", borderRadius:12, cursor:"pointer", textAlign:"center", background:"rgba(56,189,248,0.1)", border:"1.5px solid rgba(56,189,248,0.3)", fontSize:14, fontWeight:800, color:"#38bdf8" }}>Open the Gear</div>
      </div>
    </ScreenSingle>
  );

  // HOME
  if (screen === "home") return (
    <ScreenSingle headerProps={{ onBack: () => navigate("home"), agencyName: agency?.name, logoSrc }}>
      <div style={{ fontSize:18, fontWeight:800, color:"#dde8f4", marginBottom:4 }}>Mental Health Professionals</div>
      <div style={{ fontSize:13, color:"#94a3b8", lineHeight:1.7, marginBottom:6, fontStyle:"italic" }}>
        {arrivalPrompt}
      </div>
      <div style={{ fontSize:11, color:"#334155", marginBottom:16, lineHeight:1.6 }}>
        Private. On-device only. Not clinical documentation. Not PHI. Peer-support aligned.
      </div>

      {/* Crisis at top */}
      <div style={{ background:"rgba(239,68,68,0.07)", border:"1.5px solid rgba(239,68,68,0.2)", borderRadius:12, padding:"12px 16px", marginBottom:16 }}>
        <div style={{ fontSize:11, fontWeight:800, color:"#ef4444", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:8 }}>If you need support right now</div>
        <div style={{ display:"flex", gap:8 }}>
          <div onClick={() => window.location.href="tel:988"} style={{ flex:1, padding:"10px 6px", borderRadius:9, cursor:"pointer", textAlign:"center", background:"rgba(239,68,68,0.15)", border:"1.5px solid rgba(239,68,68,0.35)", fontSize:13, fontWeight:800, color:"#ef4444" }}>988</div>
          <div onClick={() => window.location.href="sms:741741?body=HOME"} style={{ flex:1, padding:"10px 6px", borderRadius:9, cursor:"pointer", textAlign:"center", background:"rgba(167,139,250,0.1)", border:"1px solid rgba(167,139,250,0.25)", fontSize:11, fontWeight:700, color:"#a78bfa" }}>Text HOME<br/><span style={{fontSize:9}}>741741</span></div>
          <div onClick={() => window.open("https://www.emotionalppe.org","_blank")} style={{ flex:1, padding:"10px 6px", borderRadius:9, cursor:"pointer", textAlign:"center", background:"rgba(56,189,248,0.08)", border:"1px solid rgba(56,189,248,0.2)", fontSize:10, fontWeight:700, color:"#38bdf8" }}>Free Therapy<br/>Emotional PPE</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:5, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:5, marginBottom:16 }}>
        {["tools","notes","resources"].map(t => (
          <div key={t} onClick={() => setTab(t)} style={{ flex:1, textAlign:"center", padding:"10px 8px", borderRadius:9, background:tab===t?"rgba(56,189,248,0.18)":"transparent", border:`1px solid ${tab===t?"rgba(56,189,248,0.35)":"transparent"}`, cursor:"pointer", fontSize:11, fontWeight:tab===t?800:600, color:tab===t?"#38bdf8":"#8099b0" }}>
            {t==="tools"?"Tools":t==="notes"?"Notes":"Resources"}
          </div>
        ))}
      </div>

      {/* TOOLS TAB */}
      {tab==="tools" && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {/* Dump Mode -- featured */}
          <div onClick={() => setScreen("dump")} style={{ background:"rgba(239,68,68,0.08)", border:"1.5px solid rgba(239,68,68,0.2)", borderRadius:14, padding:"16px", cursor:"pointer" }}>
            <div style={{ fontSize:22, marginBottom:6 }}>🔥</div>
            <div style={{ fontSize:14, fontWeight:800, color:"#ef4444", marginBottom:4 }}>Dump Mode</div>
            <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6 }}>Say anything. Write anything. Auto-deletes when you close it. No saving. No trace. No consequences.</div>
          </div>

          {/* Boundary Resets */}
          <div onClick={() => setScreen("boundary")} style={{ background:"rgba(56,189,248,0.06)", border:"1px solid rgba(56,189,248,0.15)", borderRadius:14, padding:"16px", cursor:"pointer" }}>
            <div style={{ fontSize:22, marginBottom:6 }}>🚪</div>
            <div style={{ fontSize:14, fontWeight:800, color:"#38bdf8", marginBottom:4 }}>Boundary Reset Tools</div>
            <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6 }}>Leave the room behind. Shift out of helper mode. Close the emotional tab. Return to yourself.</div>
          </div>

          {/* Burnout Check-in */}
          <div onClick={() => setScreen("checkin")} style={{ background:"rgba(167,139,250,0.06)", border:"1px solid rgba(167,139,250,0.15)", borderRadius:14, padding:"16px", cursor:"pointer" }}>
            <div style={{ fontSize:22, marginBottom:6 }}>🪫</div>
            <div style={{ fontSize:14, fontWeight:800, color:"#a78bfa", marginBottom:4 }}>Burnout and Compassion Fatigue Check-In</div>
            <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6 }}>No scores. No labels. Just awareness of where you are today.</div>
          </div>
        </div>
      )}

      {/* NOTES TAB */}
      {tab==="notes" && <NotesSection/>}

      {/* RESOURCES TAB */}
      {tab==="resources" && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ fontSize:11, color:"#334155", lineHeight:1.6, marginBottom:4 }}>External only. Not tied to your employer, license, or agency.</div>
          {EXTERNAL_RESOURCES.map((sec,si) => (
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

  // DUMP MODE
  if (screen === "dump") return <DumpMode onDone={goHome} agency={agency} logoSrc={logoSrc}/>;

  // BOUNDARY RESETS
  if (screen === "boundary" && !selectedBoundary) return (
    <ScreenSingle headerProps={{ onBack: goHome, agencyName:agency?.name, logoSrc }}>
      <div style={{ fontSize:16, fontWeight:800, color:"#dde8f4", marginBottom:6 }}>Boundary Reset Tools</div>
      <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6, marginBottom:20 }}>Grounding tools for transitioning out of helper mode. Not therapy. Not clinical. Just human.</div>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {BOUNDARY_RESETS.map(b => (
          <div key={b.key} onClick={() => { setSelectedBoundary(b.key); setBoundaryStep(0); }}
            style={{ background:b.color+"08", border:`1px solid ${b.color}20`, borderRadius:14, padding:"16px", cursor:"pointer", display:"flex", alignItems:"center", gap:14 }}>
            <span style={{ fontSize:28, flexShrink:0 }}>{b.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:b.color }}>{b.label}</div>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={b.color} strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        ))}
      </div>
    </ScreenSingle>
  );

  if (screen === "boundary" && selectedBoundary) {
    const reset = BOUNDARY_RESETS.find(b => b.key === selectedBoundary);
    return (
      <ScreenSingle headerProps={{ onBack: () => setSelectedBoundary(null), agencyName:agency?.name, logoSrc }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
          <span style={{ fontSize:28 }}>{reset.icon}</span>
          <div style={{ fontSize:16, fontWeight:800, color:reset.color }}>{reset.label}</div>
        </div>
        <div style={{ display:"flex", gap:6, marginBottom:20 }}>
          {reset.steps.map((_, i) => (
            <div key={i} onClick={() => setBoundaryStep(i)} style={{ flex:1, height:4, borderRadius:2, cursor:"pointer", background:i===boundaryStep?reset.color:i<boundaryStep?reset.color+"60":"rgba(255,255,255,0.08)", transition:"all 0.2s" }}/>
          ))}
        </div>
        <div style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${reset.color}20`, borderRadius:16, padding:"20px", marginBottom:20, minHeight:160 }}>
          <div style={{ fontSize:15, fontWeight:800, color:reset.color, marginBottom:12 }}>{reset.steps[boundaryStep].title}</div>
          <div style={{ fontSize:14, color:"#94a3b8", lineHeight:1.85 }}>{reset.steps[boundaryStep].body}</div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          {boundaryStep > 0 && (
            <div onClick={() => setBoundaryStep(s=>s-1)} style={{ flex:1, padding:"13px", borderRadius:12, cursor:"pointer", textAlign:"center", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", fontSize:13, fontWeight:700, color:"#64748b" }}>Back</div>
          )}
          {boundaryStep < reset.steps.length-1 ? (
            <div onClick={() => setBoundaryStep(s=>s+1)} style={{ flex:2, padding:"13px", borderRadius:12, cursor:"pointer", textAlign:"center", background:reset.color+"15", border:`1.5px solid ${reset.color}35`, fontSize:13, fontWeight:700, color:reset.color }}>Next</div>
          ) : (
            <div onClick={() => { setSelectedBoundary(null); setBoundaryStep(0); setScreen("home"); }}
              style={{ flex:2, padding:"13px", borderRadius:12, cursor:"pointer", textAlign:"center", background:"rgba(56,189,248,0.1)", border:"1.5px solid rgba(56,189,248,0.3)", fontSize:13, fontWeight:700, color:"#38bdf8" }}>
              {reset.reanchor}
            </div>
          )}
        </div>
      </ScreenSingle>
    );
  }

  // BURNOUT CHECK-IN
  if (screen === "checkin") return <BurnoutCheckin onDone={goHome} agency={agency} logoSrc={logoSrc}/>;

  return null;
}

// ── Dump Mode Component ──────────────────────────────────────
function DumpMode({ onDone, agency, logoSrc }) {
  const [text, setText] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const handleBack = () => {
    if (text.trim()) {
      setConfirmClear(true);
    } else {
      onDone();
    }
  };

  return (
    <ScreenSingle headerProps={{ onBack: handleBack, agencyName:agency?.name, logoSrc }}>
      <div style={{ fontSize:16, fontWeight:800, color:"#ef4444", marginBottom:4 }}>🔥 Dump Mode</div>
      <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.7, marginBottom:16 }}>
        Say anything you need to say. This space clears itself when you close it. No saving. No exporting. No trace. This runs entirely on your device.
      </div>

      {REFLECTIVE_PROMPTS.slice(0,3).map((p,i) => (
        <div key={i} onClick={() => setText(t => t ? t + "\n\n" + p + ": " : p + ": ")}
          style={{ display:"inline-block", padding:"5px 10px", borderRadius:8, background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.12)", fontSize:11, color:"#ef4444", cursor:"pointer", marginRight:6, marginBottom:8 }}>
          {p}
        </div>
      ))}

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Let it out. You do not have to hold it."
        rows={8}
        autoFocus
        style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(239,68,68,0.15)", borderRadius:12, padding:"14px", fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"none", color:"#dde8f4", lineHeight:1.7, boxSizing:"border-box", marginBottom:12 }}
      />

      <div style={{ fontSize:10, color:"#334155", textAlign:"center", marginBottom:16 }}>
        Nothing is saved. Nothing leaves your device. Closing this screen deletes everything you wrote.
      </div>

      {confirmClear && (
        <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:12, padding:"16px", marginBottom:16, textAlign:"center" }}>
          <div style={{ fontSize:13, color:"#dde8f4", marginBottom:12 }}>This will delete everything you wrote. Ready to clear it?</div>
          <div style={{ display:"flex", gap:10 }}>
            <div onClick={() => { setText(""); setConfirmClear(false); onDone(); }} style={{ flex:1, padding:"11px", borderRadius:10, cursor:"pointer", textAlign:"center", background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", fontSize:13, fontWeight:700, color:"#ef4444" }}>Clear and Close</div>
            <div onClick={() => setConfirmClear(false)} style={{ flex:1, padding:"11px", borderRadius:10, cursor:"pointer", textAlign:"center", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", fontSize:13, fontWeight:600, color:"#64748b" }}>Keep Writing</div>
          </div>
        </div>
      )}

      {!confirmClear && text.trim() && (
        <div onClick={() => setConfirmClear(true)} style={{ padding:"12px", borderRadius:12, cursor:"pointer", textAlign:"center", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.15)", fontSize:12, fontWeight:700, color:"#ef4444" }}>
          Done -- Clear and Close
        </div>
      )}
    </ScreenSingle>
  );
}

// ── Notes Section ─────────────────────────────────────────────
function NotesSection() {
  const [notes, setNotes] = useState([]);
  const [writing, setWriting] = useState(false);
  const [newText, setNewText] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [openNote, setOpenNote] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(NOTES_KEY);
      if (saved) setNotes(JSON.parse(saved));
    } catch(e) {}
  }, []);

  const saveNote = () => {
    if (!newText.trim()) return;
    const note = { id: Date.now(), text: newText, prompt: newPrompt, date: new Date().toLocaleDateString() };
    const updated = [note, ...notes];
    setNotes(updated);
    try { localStorage.setItem(NOTES_KEY, JSON.stringify(updated)); } catch(e) {}
    setNewText("");
    setNewPrompt("");
    setWriting(false);
  };

  const deleteNote = (id) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    try { localStorage.setItem(NOTES_KEY, JSON.stringify(updated)); } catch(e) {}
    setOpenNote(null);
  };

  if (writing) return (
    <div>
      <div style={{ fontSize:14, fontWeight:800, color:"#38bdf8", marginBottom:12 }}>Reflective Practice Note</div>
      <div style={{ fontSize:12, color:"#94a3b8", marginBottom:10 }}>Choose a prompt or write freely. Avoid names or identifiers.</div>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
        {REFLECTIVE_PROMPTS.map((p,i) => (
          <div key={i} onClick={() => setNewPrompt(p)} style={{ padding:"5px 10px", borderRadius:8, background:newPrompt===p?"rgba(56,189,248,0.15)":"rgba(255,255,255,0.04)", border:`1px solid ${newPrompt===p?"rgba(56,189,248,0.35)":"rgba(255,255,255,0.07)"}`, fontSize:11, color:newPrompt===p?"#38bdf8":"#64748b", cursor:"pointer" }}>
            {p}
          </div>
        ))}
      </div>
      <textarea
        value={newText}
        onChange={e => setNewText(e.target.value)}
        placeholder={newPrompt ? newPrompt + "..." : "Where did today land for you?"}
        rows={7}
        autoFocus
        style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(56,189,248,0.15)", borderRadius:12, padding:"14px", fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"none", color:"#dde8f4", lineHeight:1.7, boxSizing:"border-box", marginBottom:10 }}
      />
      <div style={{ fontSize:10, color:"#334155", marginBottom:12 }}>Saved on your device only. No sync. No cloud. You control what stays.</div>
      <div style={{ display:"flex", gap:10 }}>
        <div onClick={() => { setWriting(false); setNewText(""); setNewPrompt(""); }} style={{ flex:1, padding:"12px", borderRadius:12, cursor:"pointer", textAlign:"center", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", fontSize:13, fontWeight:600, color:"#475569" }}>Cancel</div>
        {newText.trim() && <div onClick={saveNote} style={{ flex:2, padding:"12px", borderRadius:12, cursor:"pointer", textAlign:"center", background:"rgba(56,189,248,0.1)", border:"1.5px solid rgba(56,189,248,0.3)", fontSize:13, fontWeight:700, color:"#38bdf8" }}>Save to Device</div>}
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6, marginBottom:12 }}>
        Saved on your device only. No sync. No cloud. Avoid names or identifiers. This is reflective practice, not clinical documentation.
      </div>
      <div onClick={() => setWriting(true)} style={{ padding:"13px 16px", borderRadius:12, cursor:"pointer", textAlign:"center", background:"rgba(56,189,248,0.08)", border:"1px solid rgba(56,189,248,0.2)", fontSize:13, fontWeight:700, color:"#38bdf8", marginBottom:16 }}>
        + New Reflective Note
      </div>
      {notes.length === 0 && (
        <div style={{ textAlign:"center", padding:"32px 0", fontSize:13, color:"#334155" }}>No saved notes yet. Your entries will appear here.</div>
      )}
      {notes.map(note => (
        <div key={note.id} style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"14px", marginBottom:8 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
            {note.prompt && <div style={{ fontSize:11, fontWeight:700, color:"#38bdf8" }}>{note.prompt}</div>}
            <div style={{ fontSize:10, color:"#334155" }}>{note.date}</div>
          </div>
          <div style={{ fontSize:13, color:"#94a3b8", lineHeight:1.7, marginBottom:10 }}>
            {openNote===note.id ? note.text : note.text.slice(0,100) + (note.text.length>100?"...":"")}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <div onClick={() => setOpenNote(openNote===note.id?null:note.id)} style={{ fontSize:11, color:"#475569", cursor:"pointer", textDecoration:"underline" }}>
              {openNote===note.id?"Collapse":"Read more"}
            </div>
            <div style={{ flex:1 }}/>
            <div onClick={() => deleteNote(note.id)} style={{ fontSize:11, color:"#ef4444", cursor:"pointer", textDecoration:"underline" }}>Delete</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Burnout Check-In ─────────────────────────────────────────
function BurnoutCheckin({ onDone, agency, logoSrc }) {
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);

  const QUESTIONS = [
    { key:"heavy",   q:"How heavy are you feeling today?",            opts:["Light","Medium","Heavy","Very heavy"] },
    { key:"drain",   q:"What drained you more than usual?",           opts:["A session","System limits","A colleague","Personal life","Multiple things"] },
    { key:"steady",  q:"What helped you stay steady?",               opts:["A good session","A colleague","Routine","Nothing much","Something personal"] },
    { key:"need",    q:"What do you need before you leave today?",    opts:["Quiet","Connection","Food","Rest","Movement","Just to leave"] },
  ];

  const [step, setStep] = useState(0);

  if (done) return (
    <ScreenSingle headerProps={{ onBack: onDone, agencyName:agency?.name, logoSrc }}>
      <div style={{ textAlign:"center", padding:"32px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
        <div style={{ fontSize:48 }}>💙</div>
        <div style={{ fontSize:16, fontWeight:800, color:"#dde8f4" }}>Awareness is enough for now.</div>
        <div style={{ fontSize:13, color:"#94a3b8", lineHeight:1.7, maxWidth:300, textAlign:"center" }}>
          You checked in with yourself today. That matters. Nothing here was scored or judged. You do not have to fix everything right now.
        </div>
        <div onClick={onDone} style={{ padding:"12px 28px", borderRadius:12, cursor:"pointer", background:"rgba(56,189,248,0.1)", border:"1.5px solid rgba(56,189,248,0.3)", fontSize:13, fontWeight:700, color:"#38bdf8" }}>Done</div>
      </div>
    </ScreenSingle>
  );

  const q = QUESTIONS[step];
  return (
    <ScreenSingle headerProps={{ onBack: step===0?onDone:()=>setStep(s=>s-1), agencyName:agency?.name, logoSrc }}>
      <div style={{ fontSize:14, fontWeight:800, color:"#a78bfa", marginBottom:6 }}>Burnout and Compassion Fatigue Check-In</div>
      <div style={{ fontSize:11, color:"#334155", marginBottom:20 }}>No scores. No labels. Just awareness.</div>
      <div style={{ display:"flex", gap:6, marginBottom:24 }}>
        {QUESTIONS.map((_, i) => (
          <div key={i} style={{ flex:1, height:4, borderRadius:2, background:i===step?"#a78bfa":i<step?"#a78bfa60":"rgba(255,255,255,0.08)" }}/>
        ))}
      </div>
      <div style={{ fontSize:15, fontWeight:700, color:"#dde8f4", marginBottom:20 }}>{q.q}</div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {q.opts.map(opt => (
          <div key={opt} onClick={() => {
            setAnswers(a => ({...a, [q.key]:opt}));
            if (step < QUESTIONS.length-1) setStep(s=>s+1);
            else setDone(true);
          }} style={{ padding:"13px 16px", borderRadius:12, cursor:"pointer", background:answers[q.key]===opt?"rgba(167,139,250,0.15)":"rgba(255,255,255,0.025)", border:`1px solid ${answers[q.key]===opt?"rgba(167,139,250,0.35)":"rgba(255,255,255,0.07)"}`, fontSize:13, fontWeight:600, color:answers[q.key]===opt?"#a78bfa":"#dde8f4" }}>
            {opt}
          </div>
        ))}
      </div>
    </ScreenSingle>
  );
}
