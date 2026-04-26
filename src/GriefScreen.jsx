// ============================================================
// SCREEN: GriefScreen
// Upstream Initiative — Grief & Line of Duty Death
// For loss of a colleague, line of duty death, suicide of a peer
// Hardwired resources — works offline
// ============================================================
import React, { useState } from 'react';
import { ScreenSingle } from './ui.jsx';

const LOSS_TYPES = [
  { key: "lod",       label: "Line of duty death",              icon: "🕯", color: "#475569" },
  { key: "suicide",   label: "Colleague suicide",               icon: "💙", color: "#38bdf8" },
  { key: "sudden",    label: "Sudden unexpected death",         icon: "🕯", color: "#64748b" },
  { key: "medical",   label: "Illness or medical — colleague",  icon: "🕯", color: "#64748b" },
  { key: "personal",  label: "Personal loss — family or friend",icon: "💔", color: "#ef4444" },
  { key: "patient",   label: "Loss of a patient or client",     icon: "🫂", color: "#a78bfa" },
  { key: "child",     label: "Loss of a child — case or call",  icon: "👶", color: "#ef4444" },
];

const RESOURCES = [
  { label: "Concerns of Police Survivors (COPS)", detail: "Support for surviving families and colleagues after a line of duty death.", url: "https://www.concernsofpolicesurvivors.org", color: "#475569" },
  { label: "National Fallen Firefighters Foundation", detail: "Support after line of duty death — fire service.", url: "https://www.firehero.org", color: "#ef4444" },
  { label: "EMS Loses — Line of Duty", detail: "Memorial and support for EMS line of duty deaths.", url: "https://www.emsloses.org", color: "#38bdf8" },
  { label: "Blue H.E.L.P.", detail: "Law enforcement suicide awareness and survivor support.", url: "https://bluehelp.org", color: "#475569" },
  { label: "Safe Call Now", detail: "24/7 crisis support for first responders.", phone: "12064593020", color: "#38bdf8" },
  { label: "988 Suicide & Crisis Lifeline", detail: "Call or text 988 · 24/7", phone: "988", color: "#ef4444" },
  { label: "TAPS — Tragedy Assistance Program", detail: "Support for those grieving the death of a military or public safety hero.", url: "https://www.taps.org", color: "#a78bfa" },
  { label: "Federation of Fire Chaplains", detail: "Chaplaincy and grief ministry for fire service.", url: "https://www.firechaplains.org", color: "#a78bfa" },
  { label: "ICPC — Police Chaplains", detail: "Grief ministry and spiritual care for law enforcement.", url: "https://www.icpc4cops.org", color: "#a78bfa" },
];

export default function GriefScreen({ navigate, agency, logoSrc }) {
  const [step, setStep] = useState("type"); // type | debrief | resources | close
  const [lossType, setLossType] = useState(null);
  const [reflection, setReflection] = useState("");
  const [need, setNeed] = useState(null);
  const [reflectionSaved, setReflectionSaved] = useState(false);

  const selectedType = LOSS_TYPES.find(l => l.key === lossType);

  const saveReflection = () => {
    if (!reflection.trim()) return;
    try {
      const entries = JSON.parse(localStorage.getItem("upstream_grief_notes") || "[]");
      entries.unshift({ lossType, reflection: reflection.trim(), timestamp: new Date().toISOString() });
      localStorage.setItem("upstream_grief_notes", JSON.stringify(entries.slice(0, 30)));
      setReflectionSaved(true);
    } catch(e) {}
  };

  // Step 1 — Type of loss
  if (step === "type") return (
    <ScreenSingle headerProps={{ onBack: () => navigate("home"), agencyName: agency?.name, logoSrc }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#dde8f4", marginBottom: 6 }}>Grief & Loss</div>
      <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, marginBottom: 20 }}>
        Loss in this work is different. It's collective and personal at the same time. This tool is for when you need somewhere to put it.
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
        What kind of loss are you carrying?
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {LOSS_TYPES.map(lt => (
          <div key={lt.key} onClick={() => { setLossType(lt.key); setStep("debrief"); }}
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>{lt.icon}</span>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#dde8f4" }}>{lt.label}</div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 12, padding: "12px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#475569", marginBottom: 6 }}>In crisis right now?</div>
        <div onClick={() => window.location.href = "tel:988"} style={{ fontSize: 13, fontWeight: 800, color: "#ef4444", cursor: "pointer" }}>📞 Call 988 immediately</div>
      </div>
    </ScreenSingle>
  );

  // Step 2 — Debrief / reflection
  if (step === "debrief") return (
    <ScreenSingle headerProps={{ onBack: () => setStep("type"), agencyName: agency?.name, logoSrc }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 28 }}>{selectedType?.icon}</span>
        <div style={{ fontSize: 16, fontWeight: 800, color: selectedType?.color || "#dde8f4" }}>{selectedType?.label}</div>
      </div>

      {/* Acknowledgment */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "16px", marginBottom: 20 }}>
        <div style={{ fontSize: 14, color: "#dde8f4", lineHeight: 1.8, fontStyle: "italic" }}>
          {lossType === "lod" && "Line of duty death is a specific kind of grief. It's personal, collective, and it happens in a culture that often doesn't create space to grieve."}
          {lossType === "suicide" && "Losing a colleague to suicide leaves a particular kind of weight — questions, guilt, anger, sadness, all at once. There's no clean way through it."}
          {lossType === "sudden" && "Sudden loss doesn't give you time to prepare. You were at work, and then everything changed."}
          {lossType === "medical" && "Watching a colleague decline, or losing them to illness, is a long grief that the job rarely makes room for."}
          {lossType === "personal" && "The job expects you to show up regardless. Personal loss doesn't stop at the station door, and it shouldn't have to."}
          {lossType === "patient" && "You did everything you could. That's true even when the outcome wasn't what you needed it to be."}
          {lossType === "child" && "Losing a child — in any context — is a different kind of weight. It stays differently. You're not wrong for that."}
        </div>
      </div>

      {/* Grounding */}
      <div style={{ fontSize: 13, fontWeight: 700, color: "#dde8f4", marginBottom: 12 }}>Take a moment first</div>
      {[
        "Put both feet flat on the floor.",
        "Take one slow breath in. Let it out slowly.",
        "Drop your shoulders.",
        "You're allowed to feel this.",
      ].map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#475569", flexShrink: 0, marginTop: 7 }}/>
          <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{s}</div>
        </div>
      ))}

      {/* Reflection */}
      <div style={{ marginTop: 20 }}>
        <div style={{ fontSize: 12, color: "#475569", marginBottom: 8 }}>What do you want to put down — just for you (optional)</div>
        <textarea value={reflection} onChange={e => setReflection(e.target.value)}
          placeholder="No details required. Just what you're carrying..."
          rows={4} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", resize: "none", color: "#dde8f4", lineHeight: 1.6, boxSizing: "border-box" }}/>
        {reflection.trim() && !reflectionSaved && (
          <div onClick={saveReflection} style={{ marginTop: 6, padding: "8px 12px", borderRadius: 8, cursor: "pointer", display: "inline-block", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", fontSize: 11, fontWeight: 700, color: "#a78bfa" }}>
            Save privately
          </div>
        )}
        {reflectionSaved && <div style={{ fontSize: 11, color: "#22c55e", marginTop: 6 }}>✓ Saved to your device only</div>}
      </div>

      <div onClick={() => setStep("resources")} style={{ marginTop: 20, padding: "14px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(56,189,248,0.1)", border: "1.5px solid rgba(56,189,248,0.3)", fontSize: 14, fontWeight: 700, color: "#38bdf8" }}>
        Find support →
      </div>
    </ScreenSingle>
  );

  // Step 3 — Resources
  if (step === "resources") return (
    <ScreenSingle headerProps={{ onBack: () => setStep("debrief"), agencyName: agency?.name, logoSrc }}>
      <div style={{ fontSize: 16, fontWeight: 800, color: "#dde8f4", marginBottom: 6 }}>Support Resources</div>
      <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, marginBottom: 20 }}>
        These organizations exist specifically for what you're going through.
      </div>

      {RESOURCES.map((r, i) => (
        <div key={i} onClick={() => r.phone ? window.location.href = `tel:${r.phone}` : window.open(r.url, "_blank")}
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "13px 15px", marginBottom: 8, cursor: "pointer" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#dde8f4", marginBottom: 3 }}>{r.label}</div>
          <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5, marginBottom: 5 }}>{r.detail}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: r.color }}>
            {r.phone ? "📞 Tap to call →" : "🔗 Tap to open →"}
          </div>
        </div>
      ))}

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <div onClick={() => navigate("aichat")} style={{ flex: 1, padding: "12px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, fontWeight: 700, color: "#ef4444" }}>
          🤖 AI Support
        </div>
        <div onClick={() => navigate("humanpst")} style={{ flex: 1, padding: "12px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", fontSize: 12, fontWeight: 700, color: "#22c55e" }}>
          🤝 Talk to Someone
        </div>
        <div onClick={() => navigate("journal")} style={{ flex: 1, padding: "12px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", fontSize: 12, fontWeight: 700, color: "#a78bfa" }}>
          📓 Journal
        </div>
      </div>

      <div style={{ marginTop: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px", fontSize: 13, color: "#64748b", lineHeight: 1.75, textAlign: "center", fontStyle: "italic" }}>
        "Grief is the price of love. In this work, it's also the price of service."
      </div>

      <div onClick={() => navigate("home")} style={{ marginTop: 12, padding: "12px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.15)", fontSize: 12, fontWeight: 700, color: "#38bdf8" }}>
        Return home
      </div>
    </ScreenSingle>
  );

  return null;
}
