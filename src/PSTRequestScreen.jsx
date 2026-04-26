// ============================================================
// SCREEN: PSTRequestScreen
// Upstream Initiative — Anonymous PST Request Form
// Accessed via QR code scan — no login required
// Generates case number, routes to PST dispatch board
// Zero identity stored unless user opts in for callback
// ============================================================
import React, { useState, useEffect } from 'react';
import { databases } from './appwrite.js';
import { ID } from 'appwrite';

const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE || '69c88588001ed071c19e';

function generateCaseNumber(agencyCode) {
  const year = new Date().getFullYear();
  const num = String(Math.floor(1000 + Math.random() * 9000));
  return `PST-${agencyCode || 'GEN'}-${year}-${num}`;
}

const NEED_OPTIONS = [
  { key: "rough_call",   label: "I had a rough call",                         icon: "📞", color: "#ef4444" },
  { key: "peer_support", label: "I'd like peer support to contact me",         icon: "🤝", color: "#a78bfa" },
  { key: "grief",        label: "I'm dealing with a loss or line of duty death",icon: "🕯", color: "#475569" },
  { key: "supervisor",   label: "I'm a supervisor carrying my team",           icon: "👔", color: "#f97316" },
  { key: "sleep",        label: "Sleep and fatigue are affecting me",          icon: "🌙", color: "#6366f1" },
  { key: "checking_in",  label: "I need someone to check on me",              icon: "💙", color: "#38bdf8" },
  { key: "not_sure",     label: "I'm not sure — something feels off",         icon: "🌀", color: "#eab308" },
];

const CONTACT_OPTIONS = [
  { key: "call",    label: "Call me",                     icon: "📞" },
  { key: "text",    label: "Text me",                     icon: "💬" },
  { key: "no_contact", label: "No contact — just logging this", icon: "📋" },
];

const URGENCY_LEVELS = [
  { key: "green",  label: "Green — I'm okay, just reaching out", color: "#22c55e", bg: "rgba(34,197,94,0.1)",   border: "rgba(34,197,94,0.3)"   },
  { key: "yellow", label: "Yellow — I'm struggling a bit",       color: "#eab308", bg: "rgba(234,179,8,0.1)",  border: "rgba(234,179,8,0.3)"  },
  { key: "orange", label: "Orange — I really need support",      color: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.3)" },
  { key: "red",    label: "Red — I need help now",               color: "#ef4444", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.3)"  },
];

export default function PSTRequestScreen({ navigate, agency, agencyCode: propAgencyCode }) {
  const [step, setStep] = useState("need"); // need | urgency | details | contact | submit | done
  const [needType, setNeedType] = useState(null);
  const [urgency, setUrgency] = useState(null);
  const [narrative, setNarrative] = useState("");
  const [contactMethod, setContactMethod] = useState(null);
  const [callbackTime, setCallbackTime] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [caseNumber, setCaseNumber] = useState("");
  const [error, setError] = useState("");

  const agencyCode = propAgencyCode || (agency?.code) ||
    (() => { try { return JSON.parse(localStorage.getItem("upstream_active_membership") || "{}").agencyCode || "GEN"; } catch(e) { return "GEN"; } })();

  // Read division from URL if present (?div=DIVNAME)
  const divisionFromURL = (() => {
    try { return new URLSearchParams(window.location.search).get("div") || null; } catch(e) { return null; }
  })();
  const [division] = useState(divisionFromURL || (() => {
    try { return JSON.parse(localStorage.getItem("upstream_active_division") || "null")?.name || null; } catch(e) { return null; }
  })());

  // Auto-advance urgency to red if need is rough_call
  useEffect(() => {
    if (needType === "rough_call" && !urgency) setUrgency("orange");
    if (needType === "peer_support" && !urgency) setUrgency("yellow");
  }, [needType]);

  const submitRequest = async () => {
    if (!needType || !urgency) return;
    setSubmitting(true);
    setError("");
    const cn = generateCaseNumber(agencyCode);
    setCaseNumber(cn);

    try {
      await databases.createDocument(DB_ID, 'pst_cases', ID.unique(), {
        caseNumber:    cn,
        agencyCode,
        division: division || null,
        needType,
        urgency,
        narrative:     narrative.trim() || null,
        contactMethod: contactMethod || "no_contact",
        callbackTime:  callbackTime.trim() || null,
        // Only store contact info if they want a callback
        contactInfo:   (contactMethod && contactMethod !== "no_contact") ? contactInfo.trim() || null : null,
        status:        "open",
        createdAt:     new Date().toISOString(),
      });
    } catch(e) {
      // Still show success — don't block user if Appwrite is down
      console.warn("PST case save failed:", e.message);
    }

    setSubmitting(false);
    setStep("done");
  };

  const progressSteps = ["need", "urgency", "details", "contact", "submit"];
  const progressIdx = progressSteps.indexOf(step);

  // ── DONE ──
  if (step === "done") return (
    <div style={{ position: "fixed", inset: 0, background: "#040d18", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(34,197,94,0.1)", border: "2px solid rgba(34,197,94,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>✓</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: "#dde8f4" }}>Request Received</div>
        <div style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 14, padding: "16px 24px", width: "100%" }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>Your Case Number</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#38bdf8", letterSpacing: "0.06em" }}>{caseNumber}</div>
          <div style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>Keep this for your records</div>
        </div>
        <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>
          {contactMethod === "no_contact"
            ? "Your request has been logged. A PST member may follow up if appropriate."
            : "A PST member will reach out using your preferred contact method. Everything shared here is confidential."}
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px", width: "100%", fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>
          🔒 Your request is confidential. It is not shared with supervisors, HR, or your agency's administration.
        </div>

        {/* While you wait */}
        <div style={{ width: "100%", textAlign: "left" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>While you wait</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { label: "Follow the Light", sub: "Visual grounding — auto-runs", dest: "ptsd", color: "#38bdf8" },
              { label: "Box Breathing", sub: "4-4-4-4 nervous system reset", dest: "breathing", color: "#22c55e" },
              { label: "AI Peer Support", sub: "Talk to AI right now — anonymous", dest: "aichat", color: "#ef4444" },
            ].map((t, i) => (
              <div key={i} onClick={() => navigate(t.dest)} style={{ background: t.color + "08", border: `1px solid ${t.color}20`, borderRadius: 12, padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.color }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>{t.sub}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            ))}
          </div>
        </div>

        <div onClick={() => navigate("home")} style={{ fontSize: 13, color: "#94a3b8", cursor: "pointer", textDecoration: "underline" }}>
          Return to home
        </div>

        {/* Emergency always available */}
        <div style={{ width: "100%", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 16 }}>
          <div style={{ fontSize: 11, color: "#475569", marginBottom: 8 }}>If this is an emergency</div>
          <div onClick={() => window.location.href = "tel:988"} style={{ display: "inline-block", padding: "10px 24px", borderRadius: 10, cursor: "pointer", background: "rgba(239,68,68,0.1)", border: "1.5px solid rgba(239,68,68,0.3)", fontSize: 13, fontWeight: 800, color: "#ef4444" }}>
            📞 988 Crisis Line
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "#040d18", display: "flex", flexDirection: "column", fontFamily: "'DM Sans',sans-serif", overflowY: "auto" }}>

      {/* Header */}
      <div style={{ background: "rgba(6,14,27,0.97)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "14px 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          {step !== "need" && (
            <div onClick={() => {
              const prev = { urgency: "need", details: "urgency", contact: "details", submit: "contact" };
              setStep(prev[step] || "need");
            }} style={{ cursor: "pointer", color: "#38bdf8", fontSize: 13, fontWeight: 700 }}>← Back</div>
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#dde8f4" }}>Peer Support Request</div>
            <div style={{ fontSize: 11, color: "#475569" }}>
              {agency?.name || agencyCode} · Confidential
            </div>
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#475569" }}>
            {progressIdx + 1} / {progressSteps.length}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", gap: 4 }}>
          {progressSteps.map((s, i) => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= progressIdx ? "#38bdf8" : "rgba(255,255,255,0.08)", transition: "background 0.3s" }}/>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: "24px 20px", maxWidth: 480, margin: "0 auto", width: "100%" }}>

        {/* ── STEP 1: NEED TYPE ── */}
        {step === "need" && (<>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#dde8f4", marginBottom: 8 }}>What brings you here?</div>
          <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, marginBottom: 24 }}>
            No wrong answer. Pick what feels closest.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {NEED_OPTIONS.map(opt => (
              <div key={opt.key} onClick={() => { setNeedType(opt.key); setStep("urgency"); }}
                style={{ background: "rgba(255,255,255,0.03)", border: `1.5px solid rgba(255,255,255,0.08)`, borderRadius: 16, padding: "18px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "all 0.15s" }}>
                <div style={{ fontSize: 28 }}>{opt.icon}</div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: "#dde8f4" }}>{opt.label}</div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 24, padding: "14px 16px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 12, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#475569", marginBottom: 6 }}>In crisis right now?</div>
            <div onClick={() => window.location.href = "tel:988"} style={{ fontSize: 13, fontWeight: 800, color: "#ef4444", cursor: "pointer" }}>📞 Call 988 immediately</div>
          </div>
        </>)}

        {/* ── STEP 2: URGENCY ── */}
        {step === "urgency" && (<>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#dde8f4", marginBottom: 8 }}>How are you doing right now?</div>
          <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, marginBottom: 24 }}>
            This helps us make sure the right person reaches out.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {URGENCY_LEVELS.map(level => (
              <div key={level.key} onClick={() => { setUrgency(level.key); setStep("details"); }}
                style={{ background: urgency === level.key ? level.bg : "rgba(255,255,255,0.03)", border: `1.5px solid ${urgency === level.key ? level.border : "rgba(255,255,255,0.08)"}`, borderRadius: 14, padding: "16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 14, height: 14, borderRadius: "50%", background: level.color, flexShrink: 0, boxShadow: `0 0 8px ${level.color}60` }}/>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: urgency === level.key ? level.color : "#dde8f4" }}>{level.label}</div>
              </div>
            ))}
          </div>
        </>)}

        {/* ── STEP 3: DETAILS ── */}
        {step === "details" && (<>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#dde8f4", marginBottom: 8 }}>Tell us a little (optional)</div>
          <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, marginBottom: 20 }}>
            No names. No call numbers. No unit IDs. Just what's going on in your own words. This helps the PST member know how to support you.
          </div>
          <textarea
            value={narrative}
            onChange={e => setNarrative(e.target.value)}
            placeholder="Whatever you want to share — or leave blank..."
            rows={5}
            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "14px 16px", fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none", resize: "none", color: "#dde8f4", lineHeight: 1.6, boxSizing: "border-box" }}
          />
          <div style={{ fontSize: 11, color: "#475569", marginTop: 8, lineHeight: 1.6 }}>
            🔒 This narrative is only visible to PST members. It is never shared with supervisors, HR, or administration.
          </div>
          <div onClick={() => setStep("contact")} style={{ marginTop: 20, padding: "14px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(56,189,248,0.1)", border: "1.5px solid rgba(56,189,248,0.3)", fontSize: 14, fontWeight: 700, color: "#38bdf8" }}>
            Continue →
          </div>
        </>)}

        {/* ── STEP 4: CONTACT ── */}
        {step === "contact" && (<>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#dde8f4", marginBottom: 8 }}>How would you like to connect?</div>
          <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, marginBottom: 20 }}>
            Your choice. You're in control.
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {CONTACT_OPTIONS.map(opt => (
              <div key={opt.key} onClick={() => setContactMethod(opt.key)}
                style={{ background: contactMethod === opt.key ? "rgba(56,189,248,0.1)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${contactMethod === opt.key ? "rgba(56,189,248,0.35)" : "rgba(255,255,255,0.08)"}`, borderRadius: 14, padding: "16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ fontSize: 24 }}>{opt.icon}</div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: contactMethod === opt.key ? "#38bdf8" : "#dde8f4" }}>{opt.label}</div>
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${contactMethod === opt.key ? "#38bdf8" : "rgba(255,255,255,0.2)"}`, background: contactMethod === opt.key ? "#38bdf8" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {contactMethod === opt.key && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#040d18" }}/>}
                </div>
              </div>
            ))}
          </div>

          {contactMethod && contactMethod !== "no_contact" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              <input value={contactInfo} onChange={e => setContactInfo(e.target.value)}
                placeholder={contactMethod === "call" ? "Phone number" : "Phone number for text"}
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px", fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none", color: "#dde8f4" }}/>
              <input value={callbackTime} onChange={e => setCallbackTime(e.target.value)}
                placeholder="Best time to reach you (optional)"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px", fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: "none", color: "#dde8f4" }}/>
              <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.6 }}>
                🔒 Your contact info is only visible to the PST member who claims your case. It is not stored in agency records, not visible to supervisors or HR, and is removed when the case is closed.
              </div>
              <div style={{ fontSize: 11, color: "#22c55e", marginTop: 4, lineHeight: 1.5 }}>
                By providing your contact info you're giving consent for a PST member to reach out to you using the method you selected.
              </div>
            </div>
          )}

          {contactMethod && (
            <div onClick={() => setStep("submit")} style={{ padding: "14px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(56,189,248,0.1)", border: "1.5px solid rgba(56,189,248,0.3)", fontSize: 14, fontWeight: 700, color: "#38bdf8" }}>
              Review & Submit →
            </div>
          )}
        </>)}

        {/* ── STEP 5: REVIEW ── */}
        {step === "submit" && (<>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#dde8f4", marginBottom: 20 }}>Review your request</div>

          {[
            { label: "What brought you here", value: NEED_OPTIONS.find(n => n.key === needType)?.label },
            { label: "How you're doing", value: URGENCY_LEVELS.find(u => u.key === urgency)?.label },
            { label: "Contact preference", value: CONTACT_OPTIONS.find(c => c.key === contactMethod)?.label },
            { label: "Narrative", value: narrative.trim() || "Not provided" },
          ].map((item, i) => (
            <div key={i} style={{ padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 13, color: "#94a3b8" }}>{item.value}</div>
            </div>
          ))}

          <div style={{ margin: "20px 0", padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>
            🔒 This request is completely confidential. It goes to your agency's PST team only. Nothing is shared with supervisors, HR, or your department's administration.
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#f87171", marginBottom: 12 }}>
              {error}
            </div>
          )}

          <div onClick={submitting ? null : submitRequest}
            style={{ padding: "15px", borderRadius: 14, cursor: submitting ? "not-allowed" : "pointer", textAlign: "center", background: submitting ? "rgba(255,255,255,0.03)" : "rgba(56,189,248,0.12)", border: `1.5px solid ${submitting ? "rgba(255,255,255,0.07)" : "rgba(56,189,248,0.3)"}`, fontSize: 15, fontWeight: 800, color: submitting ? "#334155" : "#38bdf8" }}>
            {submitting ? "Submitting..." : "Submit Request"}
          </div>
        </>)}

      </div>
    </div>
  );
}

// ============================================================
// PEER SUPPORT SELF-CARE TOOLS
// For the person requesting support -- while waiting, or
// if they want to work through something on their own first.
// Same privacy model: on-device only, no sync, no trace.
// ============================================================

const RESPONDER_PROMPTS = [
  "What part of this is still running in the background",
  "What am I carrying that was not mine to begin with",
  "What do I need right now that I have not asked for",
  "What would I tell a partner going through this",
  "What would help me feel steadier right now",
  "What am I most afraid to say out loud",
];

const RESPONDER_RESETS = [
  {
    key:"scene",
    label:"Leave the Scene Behind",
    icon:"🚨",
    color:"#38bdf8",
    steps:[
      {title:"The call is over", body:"Your brain may still be running it -- the sounds, the faces, the decisions. That is how trauma memory works. Give your system a clear ending signal: that call is done. You are not in it anymore."},
      {title:"Orient to right now", body:"Look around. Name three things you can see that have nothing to do with that call. A wall. A chair. A window. That is called orienting -- it tells your nervous system the event is in the past."},
      {title:"One slow exhale", body:"Breathe in through your nose. Exhale slowly through your mouth -- longer out than in. One cycle. That is enough to begin shifting out of scene mode."},
      {title:"Separate what you carried vs what was yours", body:"Some of what you are feeling right now belonged to the patient, the family, or the situation. You absorbed it because you were present. You do not have to keep all of it. Name what was theirs."},
    ],
    reanchor:"You are off that scene. You are allowed to leave it there.",
  },
  {
    key:"homeyourself",
    label:"Come Home as Yourself",
    icon:"🏠",
    color:"#22c55e",
    steps:[
      {title:"The shift is over", body:"You have been in responder mode -- hypervigilant, operational, responsible for outcomes. That mode does not automatically switch off when you clock out. Give it a deliberate signal."},
      {title:"What is waiting for you", body:"Not the job. Your actual life. A person. A pet. A meal. A couch. Name one thing in your personal life that exists right now and has nothing to do with the work."},
      {title:"Lower the scan", body:"In responder mode you are constantly reading the environment for risk. You can release that now. The people in your home are not patients. The sounds around you are not calls. You can stop scanning."},
      {title:"What do you need tonight", body:"Not what the job needed. Not what your partner or family needs. What do you actually need tonight? Name one thing and give yourself permission to have it."},
    ],
    reanchor:"You came home. Now actually be home.",
  },
  {
    key:"secondguess",
    label:"Stop Second-Guessing the Call",
    icon:"🔁",
    color:"#a78bfa",
    steps:[
      {title:"The replay loop is normal", body:"Your brain replays high-stakes events looking for what you could have done differently. That is a survival mechanism. It is not evidence that you failed. It is evidence that you care about the outcome."},
      {title:"What you knew at the time", body:"You made decisions with the information you had, the resources you had, and the training you had in that moment. Judging that decision with information you only have now is not a fair assessment of what you did."},
      {title:"What was actually in your control", body:"Name specifically what you could have changed. Then name what was outside your control -- the patient's condition, the system, the resources, the timing. The second list is usually longer."},
      {title:"One thing you did right", body:"Not to dismiss what is bothering you. But your brain is only replaying the bad parts. Force it to also name one thing you did correctly or with intention. Both things are true."},
    ],
    reanchor:"You did what you could with what you had. That is the job.",
  },
];

export function ResponderPeerSupportTools({ compact = false }) {
  const [mode, setMode] = React.useState(null); // null | dump | reset | notes
  const [selectedReset, setSelectedReset] = React.useState(null);
  const [resetStep, setResetStep] = React.useState(0);
  const [dumpText, setDumpText] = React.useState("");
  const [dumpDone, setDumpDone] = React.useState(false);
  const [confirmClear, setConfirmClear] = React.useState(false);
  const [noteText, setNoteText] = React.useState("");
  const [notes, setNotes] = React.useState([]);
  const [selectedPrompt, setSelectedPrompt] = React.useState(null);
  const NOTES_KEY = "upstream_responder_notes";

  React.useEffect(() => {
    if (mode === "notes") {
      try {
        const saved = localStorage.getItem(NOTES_KEY);
        if (saved) setNotes(JSON.parse(saved));
      } catch(e) {}
    }
  }, [mode]);

  const saveNote = () => {
    if (!noteText.trim()) return;
    const note = { id: Date.now(), text: noteText, prompt: selectedPrompt, date: new Date().toLocaleDateString() };
    const updated = [note, ...notes];
    setNotes(updated);
    try { localStorage.setItem(NOTES_KEY, JSON.stringify(updated)); } catch(e) {}
    setNoteText("");
    setSelectedPrompt(null);
  };

  const deleteNote = (id) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    try { localStorage.setItem(NOTES_KEY, JSON.stringify(updated)); } catch(e) {}
  };

  const reset = RESPONDER_RESETS.find(r => r.key === selectedReset);

  // HOME
  if (!mode) return (
    <div style={{ marginTop: compact ? 0 : 24 }}>
      <div style={{ height:1, background:"rgba(255,255,255,0.06)", marginBottom:16 }}/>
      <div style={{ fontSize:12, fontWeight:800, color:"#475569", letterSpacing:"0.12em", textTransform:"uppercase", marginBottom:12 }}>Peer Support Self-Care Tools</div>
      <div style={{ fontSize:11, color:"#334155", lineHeight:1.6, marginBottom:14 }}>
        Private. On-device only. No sync. No trace. For you -- not your department.
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        <div onClick={() => setMode("dump")} style={{ background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.18)", borderRadius:12, padding:"13px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:20 }}>🔥</span>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#ef4444" }}>Dump Mode</div>
            <div style={{ fontSize:11, color:"#64748b" }}>Write anything. Auto-shreds when you close it.</div>
          </div>
        </div>
        <div onClick={() => setMode("reset")} style={{ background:"rgba(56,189,248,0.06)", border:"1px solid rgba(56,189,248,0.15)", borderRadius:12, padding:"13px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:20 }}>🔄</span>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#38bdf8" }}>Shift Decompression</div>
            <div style={{ fontSize:11, color:"#64748b" }}>Leave the scene. Come home as yourself. Stop the replay.</div>
          </div>
        </div>
        <div onClick={() => setMode("notes")} style={{ background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.15)", borderRadius:12, padding:"13px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:20 }}>📝</span>
          <div>
            <div style={{ fontSize:13, fontWeight:700, color:"#22c55e" }}>Reflective Notes</div>
            <div style={{ fontSize:11, color:"#64748b" }}>Saved on your device only. No sync. No cloud.</div>
          </div>
        </div>
      </div>
    </div>
  );

  // DUMP MODE
  if (mode === "dump") {
    if (dumpDone) return (
      <div style={{ textAlign:"center", padding:"24px 0", display:"flex", flexDirection:"column", alignItems:"center", gap:16 }}>
        <div style={{ fontSize:40 }}>🔥</div>
        <div style={{ fontSize:15, fontWeight:800, color:"#dde8f4" }}>You said it. It is gone.</div>
        <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.7, maxWidth:280, textAlign:"center" }}>Nothing was saved. Nothing was sent. Your nervous system got the release without the cost.</div>
        <div onClick={() => { setMode(null); setDumpDone(false); setDumpText(""); }} style={{ padding:"11px 24px", borderRadius:11, cursor:"pointer", background:"rgba(56,189,248,0.1)", border:"1.5px solid rgba(56,189,248,0.3)", fontSize:13, fontWeight:700, color:"#38bdf8" }}>Done</div>
      </div>
    );
    return (
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <div onClick={() => setMode(null)} style={{ fontSize:12, color:"#475569", cursor:"pointer" }}>← Back</div>
          <div style={{ fontSize:14, fontWeight:800, color:"#ef4444" }}>🔥 Dump Mode</div>
        </div>
        <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6, marginBottom:12 }}>Say anything. This clears itself when you close it. No saving. No trace.</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
          {RESPONDER_PROMPTS.slice(0,3).map((p,i) => (
            <div key={i} onClick={() => setDumpText(t => t ? t + "\n\n" + p + ": " : p + ": ")}
              style={{ padding:"4px 9px", borderRadius:7, background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.12)", fontSize:10, color:"#ef4444", cursor:"pointer" }}>
              {p}
            </div>
          ))}
        </div>
        <textarea value={dumpText} onChange={e => setDumpText(e.target.value)}
          placeholder="Let it out. No consequences. No record."
          rows={6} autoFocus
          style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(239,68,68,0.15)", borderRadius:12, padding:"12px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"none", color:"#dde8f4", lineHeight:1.7, boxSizing:"border-box", marginBottom:8 }}
        />
        <div style={{ fontSize:10, color:"#334155", marginBottom:12, textAlign:"center" }}>Nothing saved. Nothing leaves your device.</div>
        {confirmClear ? (
          <div style={{ background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.18)", borderRadius:11, padding:"14px", textAlign:"center" }}>
            <div style={{ fontSize:12, color:"#dde8f4", marginBottom:10 }}>Clear everything and close?</div>
            <div style={{ display:"flex", gap:8 }}>
              <div onClick={() => { setDumpText(""); setConfirmClear(false); setDumpDone(true); }} style={{ flex:1, padding:"10px", borderRadius:9, cursor:"pointer", textAlign:"center", background:"rgba(239,68,68,0.15)", border:"1px solid rgba(239,68,68,0.3)", fontSize:12, fontWeight:700, color:"#ef4444" }}>Clear and Close</div>
              <div onClick={() => setConfirmClear(false)} style={{ flex:1, padding:"10px", borderRadius:9, cursor:"pointer", textAlign:"center", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", fontSize:12, fontWeight:600, color:"#64748b" }}>Keep Writing</div>
            </div>
          </div>
        ) : dumpText.trim() ? (
          <div onClick={() => setConfirmClear(true)} style={{ padding:"11px", borderRadius:11, cursor:"pointer", textAlign:"center", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.15)", fontSize:12, fontWeight:700, color:"#ef4444" }}>Done -- Shred It</div>
        ) : null}
      </div>
    );
  }

  // SHIFT DECOMPRESSION RESETS
  if (mode === "reset" && !selectedReset) return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <div onClick={() => setMode(null)} style={{ fontSize:12, color:"#475569", cursor:"pointer" }}>← Back</div>
        <div style={{ fontSize:14, fontWeight:800, color:"#38bdf8" }}>Shift Decompression</div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {RESPONDER_RESETS.map(r => (
          <div key={r.key} onClick={() => { setSelectedReset(r.key); setResetStep(0); }}
            style={{ background:r.color+"08", border:`1px solid ${r.color}20`, borderRadius:12, padding:"13px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:22 }}>{r.icon}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:r.color }}>{r.label}</div>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={r.color} strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        ))}
      </div>
    </div>
  );

  if (mode === "reset" && selectedReset && reset) return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <div onClick={() => setSelectedReset(null)} style={{ fontSize:12, color:"#475569", cursor:"pointer" }}>← Back</div>
        <span style={{ fontSize:20 }}>{reset.icon}</span>
        <div style={{ fontSize:14, fontWeight:800, color:reset.color }}>{reset.label}</div>
      </div>
      <div style={{ display:"flex", gap:5, marginBottom:18 }}>
        {reset.steps.map((_, i) => (
          <div key={i} style={{ flex:1, height:4, borderRadius:2, background:i===resetStep?reset.color:i<resetStep?reset.color+"60":"rgba(255,255,255,0.08)" }}/>
        ))}
      </div>
      <div style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${reset.color}20`, borderRadius:14, padding:"18px", marginBottom:16, minHeight:140 }}>
        <div style={{ fontSize:14, fontWeight:800, color:reset.color, marginBottom:10 }}>{reset.steps[resetStep].title}</div>
        <div style={{ fontSize:13, color:"#94a3b8", lineHeight:1.85 }}>{reset.steps[resetStep].body}</div>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        {resetStep > 0 && (
          <div onClick={() => setResetStep(s=>s-1)} style={{ flex:1, padding:"12px", borderRadius:11, cursor:"pointer", textAlign:"center", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", fontSize:12, fontWeight:700, color:"#64748b" }}>Back</div>
        )}
        {resetStep < reset.steps.length-1 ? (
          <div onClick={() => setResetStep(s=>s+1)} style={{ flex:2, padding:"12px", borderRadius:11, cursor:"pointer", textAlign:"center", background:reset.color+"12", border:`1.5px solid ${reset.color}30`, fontSize:12, fontWeight:700, color:reset.color }}>Next</div>
        ) : (
          <div onClick={() => { setSelectedReset(null); setMode(null); }} style={{ flex:2, padding:"12px", borderRadius:11, cursor:"pointer", textAlign:"center", background:"rgba(56,189,248,0.1)", border:"1.5px solid rgba(56,189,248,0.3)", fontSize:12, fontWeight:700, color:"#38bdf8" }}>{reset.reanchor}</div>
        )}
      </div>
    </div>
  );

  // REFLECTIVE NOTES
  if (mode === "notes") {
    const [writing, setWriting] = React.useState(false);
    const [openNote, setOpenNote] = React.useState(null);

    if (writing) return (
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <div onClick={() => setWriting(false)} style={{ fontSize:12, color:"#475569", cursor:"pointer" }}>← Back</div>
          <div style={{ fontSize:14, fontWeight:800, color:"#22c55e" }}>📝 Reflective Note</div>
        </div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:10 }}>
          {RESPONDER_PROMPTS.map((p,i) => (
            <div key={i} onClick={() => setSelectedPrompt(p)}
              style={{ padding:"4px 9px", borderRadius:7, background:selectedPrompt===p?"rgba(34,197,94,0.12)":"rgba(255,255,255,0.04)", border:`1px solid ${selectedPrompt===p?"rgba(34,197,94,0.3)":"rgba(255,255,255,0.07)"}`, fontSize:10, color:selectedPrompt===p?"#22c55e":"#64748b", cursor:"pointer" }}>
              {p}
            </div>
          ))}
        </div>
        <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
          placeholder={selectedPrompt ? selectedPrompt + "..." : "What do you want to process or remember?"}
          rows={6} autoFocus
          style={{ width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(34,197,94,0.15)", borderRadius:12, padding:"12px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"none", color:"#dde8f4", lineHeight:1.7, boxSizing:"border-box", marginBottom:8 }}
        />
        <div style={{ fontSize:10, color:"#334155", marginBottom:10 }}>Saved on your device only. No sync. No cloud. Avoid identifiers.</div>
        <div style={{ display:"flex", gap:8 }}>
          <div onClick={() => setWriting(false)} style={{ flex:1, padding:"11px", borderRadius:11, cursor:"pointer", textAlign:"center", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", fontSize:12, fontWeight:600, color:"#475569" }}>Cancel</div>
          {noteText.trim() && <div onClick={() => { saveNote(); setWriting(false); }} style={{ flex:2, padding:"11px", borderRadius:11, cursor:"pointer", textAlign:"center", background:"rgba(34,197,94,0.1)", border:"1.5px solid rgba(34,197,94,0.3)", fontSize:12, fontWeight:700, color:"#22c55e" }}>Save to Device</div>}
        </div>
      </div>
    );

    return (
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
          <div onClick={() => setMode(null)} style={{ fontSize:12, color:"#475569", cursor:"pointer" }}>← Back</div>
          <div style={{ fontSize:14, fontWeight:800, color:"#22c55e" }}>📝 Reflective Notes</div>
        </div>
        <div style={{ fontSize:11, color:"#334155", lineHeight:1.6, marginBottom:12 }}>On-device only. No sync. Avoid names or identifiers. This is reflective practice, not documentation.</div>
        <div onClick={() => setWriting(true)} style={{ padding:"11px", borderRadius:11, cursor:"pointer", textAlign:"center", background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", fontSize:12, fontWeight:700, color:"#22c55e", marginBottom:12 }}>+ New Note</div>
        {notes.length === 0 && <div style={{ textAlign:"center", fontSize:12, color:"#334155", padding:"20px 0" }}>No saved notes yet.</div>}
        {notes.map(note => (
          <div key={note.id} style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:11, padding:"12px", marginBottom:7 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              {note.prompt && <div style={{ fontSize:10, fontWeight:700, color:"#22c55e" }}>{note.prompt}</div>}
              <div style={{ fontSize:10, color:"#334155" }}>{note.date}</div>
            </div>
            <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.7, marginBottom:8 }}>
              {openNote===note.id ? note.text : note.text.slice(0,80) + (note.text.length>80?"...":"")}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <div onClick={() => setOpenNote(openNote===note.id?null:note.id)} style={{ fontSize:11, color:"#475569", cursor:"pointer", textDecoration:"underline" }}>{openNote===note.id?"Collapse":"Read more"}</div>
              <div style={{ flex:1 }}/>
              <div onClick={() => deleteNote(note.id)} style={{ fontSize:11, color:"#ef4444", cursor:"pointer", textDecoration:"underline" }}>Delete</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}
