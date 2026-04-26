// ============================================================
// SCREEN: HighAcuityScreen
// Upstream Initiative — High Acuity Case Decompression
// For first responders AND human services workers
// After cases that stay with you
// ============================================================
import React, { useState, useEffect } from 'react';
import { ScreenSingle } from './ui.jsx';

const CASE_TYPES = [
  { key: "peds",      label: "Pediatric case",                      icon: "👶", color: "#ef4444" },
  { key: "fatality",  label: "Fatality / death scene",              icon: "🕯", color: "#475569" },
  { key: "removal",   label: "Child removal or placement",           icon: "🏠", color: "#f97316" },
  { key: "severe",    label: "Severe abuse or neglect",              icon: "⚠️", color: "#ef4444" },
  { key: "digital",   label: "High-acuity digital evidence",        icon: "💻", color: "#64748b" },
  { key: "elder",     label: "Elder exploitation or severe neglect", icon: "👴", color: "#eab308" },
  { key: "dv",        label: "Domestic violence with children",      icon: "🛡", color: "#f97316" },
  { key: "trafficking",label: "Trafficking or exploitation case",   icon: "🔒", color: "#a78bfa" },
  { key: "mi",        label: "Mass casualty / critical incident",    icon: "🚨", color: "#ef4444" },
  { key: "cct",       label: "Critical care transport / flight medical",icon: "🚁", color: "#38bdf8" },
  { key: "cctdispatch",label: "CCT dispatch — call that didn't make it", icon: "📡", color: "#38bdf8" },
  { key: "school",    label: "School-based incident (SRO)",           icon: "🏫", color: "#22c55e" },
  { key: "coresponse",label: "Mental health co-response / crisis call",  icon: "🧑‍⚕️", color: "#a78bfa" },
  { key: "lod",       label: "Line of duty death / colleague loss",      icon: "🕯", color: "#475569" },
  { key: "other",     label: "Something else that's staying with me",    icon: "💭", color: "#38bdf8" },
];

const WHAT_HIT = [
  "The person involved",
  "The decision I had to make",
  "What I saw or heard",
  "The environment",
  "Not being able to do more",
  "The uncertainty about what happens next",
  "The look on someone's face",
  "The drive home afterward",
  "Something I can't name yet",
];

const WHAT_NEED = [
  { key: "ground",    label: "Something to steady me right now",    icon: "🌿", dest: "grounding"  },
  { key: "breathe",   label: "A breathing reset",                    icon: "🫁", dest: "breathing"  },
  { key: "follow",    label: "Just follow something — no thinking",  icon: "💙", dest: "ptsd"       },
  { key: "dump",      label: "Say what I can't say out loud",        icon: "⏱", dest: "dump90"     },
  { key: "journal",   label: "Write it out privately",               icon: "📓", dest: "journal"    },
  { key: "ai",        label: "Talk to someone confidentially",       icon: "🤖", dest: "aichat"     },
  { key: "pst",       label: "Talk to a person from peer support",   icon: "🤝", dest: "humanpst"   },
  { key: "grief",     label: "This is a loss — I need grief support",  icon: "🕯", dest: "grief"       },
  { key: "sleep",     label: "It's affecting my sleep",                icon: "🌙", dest: "sleep"       },
  { key: "supervisor",label: "I'm a supervisor — I need debrief tools",icon: "👔", dest: "supervisor"  },
];

// Exposure boundary statement for high-acuity digital cases
function ExposureBoundary({ onContinue }) {
  return (
    <div style={{ background: "#040d18", padding: "24px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.25)", borderRadius: 14, padding: "16px" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#ef4444", marginBottom: 8 }}>Before you continue</div>
        <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.75 }}>
          This section is for your support after difficult case exposure.{"\n\n"}
          <strong style={{ color: "#dde8f4" }}>No case details, images, or evidence should be entered here.</strong>{"\n\n"}
          This is not documentation. Nothing entered here is discoverable. This is for your well-being only.
        </div>
      </div>
      <div onClick={onContinue} style={{ padding: "14px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(56,189,248,0.1)", border: "1.5px solid rgba(56,189,248,0.3)", fontSize: 14, fontWeight: 700, color: "#38bdf8" }}>
        I understand — continue
      </div>
    </div>
  );
}

export default function HighAcuityScreen({ navigate, agency, logoSrc }) {
  const [step, setStep] = useState("type"); // type | boundary | impact | ground | need | close
  const [caseType, setCaseType] = useState(null);
  const [whatHit, setWhatHit] = useState([]);
  const [note, setNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [showBoundary, setShowBoundary] = useState(false);

  const selectedType = CASE_TYPES.find(c => c.key === caseType);

  const toggleWhatHit = (item) => {
    setWhatHit(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const saveNote = () => {
    if (!note.trim()) return;
    try {
      const notes = JSON.parse(localStorage.getItem("upstream_highacuity_notes") || "[]");
      notes.unshift({ caseType, whatHit, note: note.trim(), timestamp: new Date().toISOString() });
      localStorage.setItem("upstream_highacuity_notes", JSON.stringify(notes.slice(0, 50)));
      setNoteSaved(true);
    } catch(e) {}
  };

  // Step: Case type selection
  if (step === "type") return (
    <ScreenSingle headerProps={{ onBack: () => navigate(-1), agencyName: agency?.name, logoSrc }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#dde8f4", marginBottom: 6 }}>High Acuity Decompression</div>
      <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, marginBottom: 20 }}>
        Some cases don't process the same way. This tool is for after the ones that stay with you. What kind of case was it?
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {CASE_TYPES.map(ct => (
          <div key={ct.key} onClick={() => {
            setCaseType(ct.key);
            if (ct.key === "digital") {
              setShowBoundary(true);
              setStep("boundary");
            } else {
              setStep("impact");
            }
          }} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "all 0.15s" }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{ct.icon}</span>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#dde8f4" }}>{ct.label}</div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        ))}
      </div>

      {/* Always accessible */}
      <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 12, textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#475569", marginBottom: 6 }}>In crisis right now?</div>
        <div onClick={() => window.location.href = "tel:988"} style={{ fontSize: 13, fontWeight: 800, color: "#ef4444", cursor: "pointer" }}>📞 Call 988 immediately</div>
      </div>
    </ScreenSingle>
  );

  // Step: Exposure boundary for digital cases
  if (step === "boundary") return (
    <ScreenSingle headerProps={{ onBack: () => setStep("type"), agencyName: agency?.name, logoSrc }}>
      <ExposureBoundary onContinue={() => setStep("impact")}/>
    </ScreenSingle>
  );

  // Step: What hit you
  if (step === "impact") return (
    <ScreenSingle headerProps={{ onBack: () => setStep("type"), agencyName: agency?.name, logoSrc }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 24 }}>{selectedType?.icon}</span>
        <div style={{ fontSize: 15, fontWeight: 800, color: selectedType?.color || "#dde8f4" }}>{selectedType?.label}</div>
      </div>

      <div style={{ fontSize: 14, fontWeight: 700, color: "#dde8f4", marginBottom: 6 }}>What part is your mind going back to?</div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14, lineHeight: 1.6 }}>Check all that apply. You don't have to name everything.</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
        {WHAT_HIT.map((item, i) => {
          const isSelected = whatHit.includes(item);
          return (
            <div key={i} onClick={() => toggleWhatHit(item)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 12, cursor: "pointer", background: isSelected ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.025)", border: `1.5px solid ${isSelected ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.07)"}` }}>
              <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${isSelected ? "#ef4444" : "rgba(255,255,255,0.15)"}`, background: isSelected ? "#ef4444" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12, color: "#040d18", fontWeight: 900 }}>
                {isSelected && "✓"}
              </div>
              <div style={{ fontSize: 13, color: isSelected ? "#fca5a5" : "#8099b0" }}>{item}</div>
            </div>
          );
        })}
      </div>

      {/* Optional private note */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: "#475569", marginBottom: 6 }}>Anything else you want to put down — just for you (optional)</div>
        <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="No case details — just what you're carrying..." rows={3}
          style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", resize: "none", color: "#dde8f4", lineHeight: 1.6, boxSizing: "border-box" }}/>
        {note.trim() && !noteSaved && (
          <div onClick={saveNote} style={{ marginTop: 6, padding: "8px 12px", borderRadius: 8, cursor: "pointer", display: "inline-block", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", fontSize: 11, fontWeight: 700, color: "#a78bfa" }}>
            Save privately
          </div>
        )}
        {noteSaved && <div style={{ fontSize: 11, color: "#22c55e", marginTop: 6 }}>✓ Saved to your device only</div>}
      </div>

      <div onClick={() => setStep("ground")} style={{ padding: "14px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(56,189,248,0.1)", border: "1.5px solid rgba(56,189,248,0.3)", fontSize: 14, fontWeight: 700, color: "#38bdf8" }}>
        Continue →
      </div>
    </ScreenSingle>
  );

  // Step: Grounding moment
  if (step === "ground") return (
    <ScreenSingle headerProps={{ onBack: () => setStep("impact"), agencyName: agency?.name, logoSrc }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: "#dde8f4", marginBottom: 6 }}>Take a moment before the next thing</div>
      <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, marginBottom: 20 }}>
        Your nervous system is still processing. Even 60 seconds helps.
      </div>

      {[
        { step: "1", text: "Put both feet flat on the floor." },
        { step: "2", text: "Drop your shoulders away from your ears." },
        { step: "3", text: "Take one slow breath in through your nose." },
        { step: "4", text: "Let it out slowly through your mouth." },
        { step: "5", text: "Name one thing you can see right now." },
      ].map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#38bdf8", flexShrink: 0 }}>{s.step}</div>
          <div style={{ fontSize: 14, color: "#dde8f4", lineHeight: 1.6, paddingTop: 4 }}>{s.text}</div>
        </div>
      ))}

      <div style={{ marginTop: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px", fontSize: 13, color: "#64748b", lineHeight: 1.75, textAlign: "center", fontStyle: "italic" }}>
        "You did what you could with what you had."
      </div>

      <div onClick={() => setStep("need")} style={{ marginTop: 16, padding: "14px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(56,189,248,0.1)", border: "1.5px solid rgba(56,189,248,0.3)", fontSize: 14, fontWeight: 700, color: "#38bdf8" }}>
        What do you need next? →
      </div>
    </ScreenSingle>
  );

  // Step: What do you need
  if (step === "need") return (
    <ScreenSingle headerProps={{ onBack: () => setStep("ground"), agencyName: agency?.name, logoSrc }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: "#dde8f4", marginBottom: 6 }}>What would help right now?</div>
      <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, marginBottom: 20 }}>
        No wrong answer. Pick what feels closest.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {WHAT_NEED.map(opt => (
          <div key={opt.key} onClick={() => { setStep("close"); setTimeout(() => navigate(opt.dest), 1200); }}
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{opt.icon}</span>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#dde8f4" }}>{opt.label}</div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        ))}
        <div onClick={() => setStep("close")} style={{ textAlign: "center", fontSize: 12, color: "#334155", cursor: "pointer", padding: "10px", textDecoration: "underline" }}>
          I'm okay — close this
        </div>
      </div>
    </ScreenSingle>
  );

  // Step: Close
  if (step === "close") return (
    <ScreenSingle headerProps={{ onBack: () => navigate("home"), agencyName: agency?.name, logoSrc }}>
      <div style={{ textAlign: "center", paddingTop: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{ width: 70, height: 70, borderRadius: "50%", background: "rgba(56,189,248,0.08)", border: "2px solid rgba(56,189,248,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>💙</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#dde8f4" }}>You used a tool</div>
        <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.75, maxWidth: 320, textAlign: "center" }}>
          That takes awareness. Most people just push through.{"\n\n"}
          Come back to this whenever you need it.
        </div>
        <div style={{ width: "100%", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px", fontSize: 12, color: "#475569", lineHeight: 1.7, textAlign: "center" }}>
          🔒 Nothing entered here was shared with anyone. Your notes are on your device only.
        </div>
        <div onClick={() => navigate("home")} style={{ padding: "13px 28px", borderRadius: 12, cursor: "pointer", background: "rgba(56,189,248,0.1)", border: "1.5px solid rgba(56,189,248,0.3)", fontSize: 13, fontWeight: 700, color: "#38bdf8" }}>
          Return home
        </div>
        <div style={{ fontSize: 11, color: "#334155", textAlign: "center" }}>
          If this is still heavy — 988 is always available
        </div>
      </div>
    </ScreenSingle>
  );

  return null;
}
