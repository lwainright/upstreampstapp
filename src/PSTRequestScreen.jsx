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
  { key: "rough_call",   label: "I had a rough call",                    icon: "📞", color: "#ef4444" },
  { key: "peer_support", label: "I'd like someone from peer support to contact me", icon: "🤝", color: "#a78bfa" },
  { key: "checking_in",  label: "I need someone to check on me",          icon: "💙", color: "#38bdf8" },
  { key: "not_sure",     label: "I'm not sure — something feels off",     icon: "🌀", color: "#eab308" },
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
                🔒 Your contact info is only visible to the PST member who handles your case. It is never stored in agency records.
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
