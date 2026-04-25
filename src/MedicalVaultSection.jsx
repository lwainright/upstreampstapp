// ============================================================
// COMPONENT: MedicalVaultSection
// Upstream Initiative — Medical Wellness Journal
// Inside Safety Vault — PIN protected
// ⚠️ NOT MEDICAL ADVICE — For tracking and reference only
// ============================================================
import React, { useState, useRef } from 'react';
import AIMedicalChat from './AIMedicalChat.jsx';

// ── Disclaimer ────────────────────────────────────────────────
export function MedicalDisclaimer({ compact = false }) {
  return (
    <div style={{
      background: "rgba(4,13,24,0.95)",
      border: "2px solid #38bdf8",
      borderRadius: compact ? 10 : 14,
      padding: compact ? "10px 12px" : "16px",
      marginBottom: compact ? 10 : 16,
      boxShadow: "0 0 12px rgba(56,189,248,0.15)",
    }}>
      <div style={{ fontSize: compact ? 11 : 13, fontWeight: 900, color: "#38bdf8", marginBottom: compact ? 2 : 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        ⚠️ NOT MEDICAL ADVICE
      </div>
      <div style={{ fontSize: compact ? 11 : 12, color: "#dde8f4", lineHeight: 1.75, fontWeight: 500 }}>
        This tool is for personal tracking and general reference only. It does{" "}
        <strong style={{ color: "#38bdf8", fontWeight: 800 }}>not</strong>{" "}
        diagnose, treat, or interpret your individual results.
        {!compact && <>
          <br/><br/>
          If you have questions about your results,{" "}
          <strong style={{ color: "#38bdf8" }}>contact your physician or healthcare provider.</strong>
          <br/><br/>
          <strong style={{ color: "#38bdf8" }}>If you are experiencing a medical emergency, call 911 immediately.</strong>
        </>}
      </div>
      {!compact && (
        <div onClick={() => window.location.href = "tel:911"} style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px", borderRadius: 10, cursor: "pointer", background: "rgba(56,189,248,0.12)", border: "1.5px solid #38bdf8", fontSize: 13, fontWeight: 900, color: "#38bdf8", letterSpacing: "0.04em" }}>
          📞 EMERGENCY — CALL 911
        </div>
      )}
    </div>
  );
}

// ── Lab Values Reference ───────────────────────────────────────
const LAB_DATA = [
  {
    panel: "Complete Blood Count (CBC)",
    color: "#38bdf8",
    tests: [
      { name: "White Blood Cells (WBC)", range: "4.0–11.0 K/µL", high: "Body may be reacting to stress, irritation, or infection", low: "Immune system may be tired or recovering" },
      { name: "Hemoglobin — Men", range: "13.5–17.5 g/dL", high: "Sometimes related to dehydration or long-term conditions", low: "Often related to anemia or blood loss" },
      { name: "Hemoglobin — Women", range: "12.0–15.5 g/dL", high: "Sometimes related to dehydration or long-term conditions", low: "Often related to anemia or blood loss" },
      { name: "Platelets", range: "150–450 K/µL", high: "Can happen after illness or inflammation", low: "Can affect clotting" },
    ]
  },
  {
    panel: "Basic Metabolic Panel (BMP)",
    color: "#22c55e",
    tests: [
      { name: "Sodium (Na)", range: "135–145 mmol/L", high: "Often related to dehydration or medications", low: "Often related to hydration or medications" },
      { name: "Potassium (K)", range: "3.5–5.0 mmol/L", high: "Can affect muscles and heart rhythm", low: "Can affect muscles and heart rhythm" },
      { name: "Creatinine — Men", range: "0.7–1.3 mg/dL", high: "Kidneys may be working harder than usual", low: "Often not concerning on its own" },
      { name: "Creatinine — Women", range: "0.6–1.1 mg/dL", high: "Kidneys may be working harder than usual", low: "Often not concerning on its own" },
      { name: "Glucose (fasting)", range: "70–99 mg/dL", high: "Blood sugar may be elevated", low: "Can cause shakiness, sweating, or confusion" },
    ]
  },
  {
    panel: "Liver Panel",
    color: "#f97316",
    tests: [
      { name: "AST / ALT", range: "10–40 U/L", high: "Liver may be irritated or reacting to medication", low: "Usually not concerning" },
      { name: "Alkaline Phosphatase (ALP)", range: "44–147 U/L", high: "Can relate to bone growth, healing, or liver/bile ducts", low: "Usually not concerning" },
      { name: "Bilirubin", range: "0.1–1.2 mg/dL", high: "Yellowing of skin or eyes may occur", low: "Usually not concerning" },
    ]
  },
  {
    panel: "Inflammation Markers",
    color: "#ef4444",
    tests: [
      { name: "CRP (C-Reactive Protein)", range: "< 1.0 mg/dL", high: "Indicates inflammation somewhere in the body", low: "Normal — no significant inflammation detected" },
      { name: "ESR — Men", range: "0–15 mm/hr", high: "Also indicates inflammation", low: "Normal" },
      { name: "ESR — Women", range: "0–20 mm/hr", high: "Also indicates inflammation", low: "Normal" },
    ]
  },
  {
    panel: "Thyroid Panel",
    color: "#a78bfa",
    tests: [
      { name: "TSH", range: "0.4–4.0 µIU/mL", high: "Thyroid may be underactive", low: "Thyroid may be overactive" },
    ]
  },
];

function LabReference({ onClose }) {
  const [openPanel, setOpenPanel] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, background: "#040d18" }}>
      <MedicalDisclaimer compact/>
      <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.6, marginBottom: 4 }}>
        These are typical U.S. reference ranges. Individual labs may vary. These are for general reference only — not for interpreting your specific results.
      </div>

      {LAB_DATA.map((panel, pi) => (
        <div key={pi} style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${openPanel === pi ? panel.color + "40" : "rgba(255,255,255,0.06)"}`, borderRadius: 14, overflow: "hidden" }}>
          <div onClick={() => setOpenPanel(openPanel === pi ? null : pi)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 15px", cursor: "pointer" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: panel.color, flexShrink: 0 }}/>
            <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: openPanel === pi ? panel.color : "#dde8f4" }}>{panel.panel}</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>{panel.tests.length} values</div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" style={{ transform: openPanel === pi ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          {openPanel === pi && (
            <div style={{ padding: "0 14px 14px" }}>
              {panel.tests.map((test, ti) => (
                <div key={ti} onClick={() => setSelectedTest(selectedTest?.name === test.name ? null : test)}
                  style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${selectedTest?.name === test.name ? panel.color + "40" : "rgba(255,255,255,0.06)"}`, borderRadius: 10, padding: "11px 13px", marginBottom: 8, cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: selectedTest?.name === test.name ? 8 : 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#dde8f4" }}>{test.name}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: panel.color, background: panel.color + "15", padding: "2px 8px", borderRadius: 6 }}>{test.range}</div>
                  </div>
                  {selectedTest?.name === test.name && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                      <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, padding: "8px 10px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#f87171", marginBottom: 3 }}>IF HIGH</div>
                        <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{test.high}</div>
                      </div>
                      <div style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.15)", borderRadius: 8, padding: "8px 10px" }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#38bdf8", marginBottom: 3 }}>IF LOW</div>
                        <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{test.low}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 14px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>Questions to ask your doctor</div>
        {["Is this something you want to recheck?", "Could this be from dehydration, stress, or medication?", "Is this a pattern or a one-time change?", "Do you want more tests?", "What symptoms should I track?"].map((q, i) => (
          <div key={i} style={{ fontSize: 12, color: "#94a3b8", padding: "6px 0", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>• {q}</div>
        ))}
      </div>

      <div onClick={onClose} style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", cursor: "pointer", textDecoration: "underline", marginTop: 4 }}>Close</div>
    </div>
  );
}

// ── Imaging Dictionary & Translator ───────────────────────────
const IMAGING_TERMS = {
  "CT Scan": [
    { term: "Thickening", plain: "The wall of an organ looks thicker than usual. This can happen from swelling, irritation, or the body reacting to something." },
    { term: "Fat Stranding", plain: "The fat around an organ looks streaky, which usually means the body is dealing with irritation or inflammation." },
    { term: "Enlarged Lymph Nodes", plain: "The body's filter stations are working harder than usual." },
    { term: "Fluid Collection", plain: "There is extra fluid in an area where it normally wouldn't be." },
    { term: "Opacity", plain: "A cloudy area on the scan." },
    { term: "Consolidation", plain: "Part of the lung looks filled in instead of airy." },
    { term: "Attenuation", plain: "How bright or dark an area looks on the scan." },
  ],
  "MRI": [
    { term: "Edema", plain: "Swelling inside tissues." },
    { term: "Lesion", plain: "A spot that looks different from the surrounding tissue. This word does not automatically mean something dangerous." },
    { term: "Degeneration", plain: "Wear-and-tear changes that happen over time." },
    { term: "Herniation", plain: "Something pushing out of its normal space — like a disc in the spine." },
    { term: "Signal Intensity", plain: "How bright or dark the tissue looks in the image." },
  ],
  "Ultrasound": [
    { term: "Hypoechoic", plain: "The tissue looks darker than the surrounding area." },
    { term: "Hyperechoic", plain: "The tissue looks brighter than the surrounding area." },
    { term: "Cystic", plain: "Fluid-filled — like a water balloon." },
    { term: "Solid", plain: "Made of tissue, not fluid." },
    { term: "Vascular Flow", plain: "Blood is moving through the area." },
  ],
  "X-Ray": [
    { term: "Fracture", plain: "A break or crack in a bone." },
    { term: "Dislocation", plain: "A bone has moved out of its normal position." },
    { term: "Effusion", plain: "Extra fluid in a joint or around the lungs." },
    { term: "Infiltrate", plain: "Something is in the lung tissue that shouldn't be there." },
  ],
};

const NOT_MEAN = [
  { term: "Lesion", notMean: "does not automatically mean cancer" },
  { term: "Enlarged lymph nodes", notMean: "do not always mean infection" },
  { term: "Fluid", notMean: "does not always mean something dangerous" },
  { term: "Thickening", notMean: "does not always mean disease" },
  { term: "Opacity", notMean: "does not always mean something serious" },
  { term: "Nonspecific findings", notMean: "does not mean something was found — it means more information is needed" },
];

const REPORT_TRANSLATIONS = [
  { original: "Diffuse colonic wall thickening with surrounding fat stranding", plain: "The wall of the colon looks thicker, and the fat around it looks irritated." },
  { original: "No acute findings", plain: "Nothing dangerous or urgent was seen." },
  { original: "Stable compared to prior imaging", plain: "Nothing has changed since the last scan." },
  { original: "Recommend correlating clinically", plain: "Your doctor will look at your symptoms and exam to understand what this result means." },
  { original: "Findings are nonspecific", plain: "This could be from many different things." },
  { original: "Follow up as needed", plain: "Come back if your symptoms continue or get worse." },
  { original: "No significant interval change", plain: "Nothing has changed much since the last scan." },
  { original: "Cannot exclude", plain: "The scan can't rule it out completely — more tests may be needed." },
];

function ImagingTranslator({ onClose }) {
  const [openType, setOpenType] = useState(null);
  const [tab, setTab] = useState("dictionary");
  const [noteInput, setNoteInput] = useState("");
  const [translated, setTranslated] = useState("");

  const translateNote = () => {
    if (!noteInput.trim()) return;
    let result = noteInput;
    REPORT_TRANSLATIONS.forEach(t => {
      const regex = new RegExp(t.original, "gi");
      result = result.replace(regex, `[${t.plain}]`);
    });
    // Replace known terms
    Object.values(IMAGING_TERMS).flat().forEach(t => {
      const regex = new RegExp(`\\b${t.term}\\b`, "gi");
      result = result.replace(regex, `${t.term} (${t.plain})`);
    });
    setTranslated(result !== noteInput ? result : "Paste your imaging report notes above. The translator will rewrite medical terms into plain language.");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, background: "#040d18" }}>
      <MedicalDisclaimer compact/>

      <div style={{ display: "flex", gap: 5, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4 }}>
        {["dictionary", "translator", "not-mean"].map(t => (
          <div key={t} onClick={() => setTab(t)} style={{ flex: 1, textAlign: "center", padding: "8px 4px", borderRadius: 8, cursor: "pointer", background: tab === t ? "rgba(56,189,248,0.15)" : "transparent", border: `1px solid ${tab === t ? "rgba(56,189,248,0.3)" : "transparent"}`, fontSize: 11, fontWeight: tab === t ? 800 : 600, color: tab === t ? "#38bdf8" : "#64748b" }}>
            {t === "dictionary" ? "Dictionary" : t === "translator" ? "Translator" : "What It's Not"}
          </div>
        ))}
      </div>

      {tab === "dictionary" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>Tap a scan type to see plain-language definitions of common terms.</div>
          {Object.entries(IMAGING_TERMS).map(([type, terms], i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${openType === type ? "rgba(56,189,248,0.3)" : "rgba(255,255,255,0.06)"}`, borderRadius: 12, overflow: "hidden" }}>
              <div onClick={() => setOpenType(openType === type ? null : type)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer" }}>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: openType === type ? "#38bdf8" : "#dde8f4" }}>{type}</div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" style={{ transform: openType === type ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}><polyline points="9 18 15 12 9 6"/></svg>
              </div>
              {openType === type && (
                <div style={{ padding: "0 14px 12px" }}>
                  {terms.map((t, ti) => (
                    <div key={ti} style={{ padding: "8px 0", borderBottom: ti < terms.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#38bdf8", marginBottom: 3 }}>{t.term}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{t.plain}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "translator" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
            Paste text from your imaging report and tap Translate. Common medical terms will be rewritten in plain language.
          </div>
          <textarea value={noteInput} onChange={e => setNoteInput(e.target.value)} placeholder="Paste imaging report notes here..." rows={5} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", resize: "none", color: "#dde8f4", lineHeight: 1.6 }}/>
          <div onClick={translateNote} style={{ padding: "12px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: "rgba(56,189,248,0.1)", border: "1.5px solid rgba(56,189,248,0.25)", fontSize: 13, fontWeight: 700, color: "#38bdf8" }}>Translate to Plain Language</div>
          {translated && (
            <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 12, padding: "14px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", marginBottom: 8 }}>PLAIN LANGUAGE VERSION</div>
              <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.8 }}>{translated}</div>
            </div>
          )}
          <MedicalDisclaimer compact/>
        </div>
      )}

      {tab === "not-mean" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>Seeing a word in your report can be scary. Here's what these common terms do NOT automatically mean.</div>
          {NOT_MEAN.map((item, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#38bdf8", marginBottom: 4 }}>"{item.term}"</div>
              <div style={{ fontSize: 12, color: "#22c55e" }}>✓ {item.notMean}</div>
            </div>
          ))}
        </div>
      )}

      <div onClick={onClose} style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", cursor: "pointer", textDecoration: "underline", marginTop: 4 }}>Close</div>
    </div>
  );
}

// ── Symptom Journal ────────────────────────────────────────────
function SymptomJournal({ onClose }) {
  const [entries, setEntries] = useState(() => {
    try { return JSON.parse(localStorage.getItem("upstream_symptom_log") || "[]"); } catch(e) { return []; }
  });
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ symptom: "", severity: 5, duration: "", triggers: "", notes: "" });
  const [saved, setSaved] = useState(false);

  const saveEntry = () => {
    if (!form.symptom.trim()) return;
    const entry = { ...form, id: Date.now(), timestamp: new Date().toISOString() };
    const updated = [entry, ...entries];
    setEntries(updated);
    try { localStorage.setItem("upstream_symptom_log", JSON.stringify(updated)); } catch(e) {}
    setForm({ symptom: "", severity: 5, duration: "", triggers: "", notes: "" });
    setAdding(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const deleteEntry = (id) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    try { localStorage.setItem("upstream_symptom_log", JSON.stringify(updated)); } catch(e) {}
  };

  const severityColor = (s) => s <= 3 ? "#22c55e" : s <= 6 ? "#eab308" : "#ef4444";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, background: "#040d18" }}>
      <MedicalDisclaimer compact/>

      {saved && <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#22c55e", fontWeight: 700, textAlign: "center" }}>✓ Saved to your device</div>}

      {!adding && (
        <div onClick={() => setAdding(true)} style={{ padding: "13px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(56,189,248,0.08)", border: "1.5px solid rgba(56,189,248,0.2)", fontSize: 13, fontWeight: 700, color: "#38bdf8" }}>
          + Log a Symptom
        </div>
      )}

      {adding && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#dde8f4", marginBottom: 12 }}>New Symptom Entry</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input value={form.symptom} onChange={e => setForm(p => ({...p, symptom: e.target.value}))} placeholder="What symptom? (e.g. headache, fatigue)" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", color: "#dde8f4" }}/>
            <div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>Severity: <span style={{ color: severityColor(form.severity), fontWeight: 700 }}>{form.severity}/10</span></div>
              <input type="range" min={1} max={10} value={form.severity} onChange={e => setForm(p => ({...p, severity: Number(e.target.value)}))} style={{ width: "100%", accentColor: severityColor(form.severity) }}/>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8" }}><span>Mild</span><span>Moderate</span><span>Severe</span></div>
            </div>
            <input value={form.duration} onChange={e => setForm(p => ({...p, duration: e.target.value}))} placeholder="How long? (e.g. 2 hours, since yesterday)" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", color: "#dde8f4" }}/>
            <input value={form.triggers} onChange={e => setForm(p => ({...p, triggers: e.target.value}))} placeholder="Any triggers? (optional)" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", color: "#dde8f4" }}/>
            <textarea value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} placeholder="Additional notes..." rows={3} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", resize: "none", color: "#dde8f4" }}/>
            <div style={{ display: "flex", gap: 8 }}>
              <div onClick={() => setAdding(false)} style={{ flex: 1, padding: "11px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>Cancel</div>
              <div onClick={saveEntry} style={{ flex: 2, padding: "11px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: "rgba(34,197,94,0.1)", border: "1.5px solid rgba(34,197,94,0.25)", fontSize: 12, fontWeight: 700, color: "#22c55e" }}>Save Entry</div>
            </div>
          </div>
        </div>
      )}

      {entries.length === 0 && !adding && (
        <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8", fontSize: 13 }}>No symptoms logged yet.</div>
      )}

      {entries.map((entry, i) => (
        <div key={entry.id} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "13px 15px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#dde8f4" }}>{entry.symptom}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: severityColor(entry.severity), background: severityColor(entry.severity) + "15", padding: "3px 8px", borderRadius: 6 }}>{entry.severity}/10</div>
              <div onClick={() => deleteEntry(entry.id)} style={{ fontSize: 11, color: "#f87171", cursor: "pointer", padding: "3px 8px", borderRadius: 6, background: "rgba(239,68,68,0.08)" }}>✕</div>
            </div>
          </div>
          {entry.duration && <div style={{ fontSize: 12, color: "#94a3b8" }}>Duration: {entry.duration}</div>}
          {entry.triggers && <div style={{ fontSize: 12, color: "#94a3b8" }}>Triggers: {entry.triggers}</div>}
          {entry.notes && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, lineHeight: 1.5 }}>{entry.notes}</div>}
        </div>
      ))}

      <div onClick={onClose} style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", cursor: "pointer", textDecoration: "underline", marginTop: 4 }}>Close</div>
    </div>
  );
}

// ── Appointment Prep ───────────────────────────────────────────
function AppointmentPrep({ onClose }) {
  const [questions, setQuestions] = useState(() => {
    try { return JSON.parse(localStorage.getItem("upstream_appt_questions") || "[]"); } catch(e) { return []; }
  });
  const [newQ, setNewQ] = useState("");

  const addQuestion = () => {
    if (!newQ.trim()) return;
    const updated = [...questions, { id: Date.now(), text: newQ.trim() }];
    setQuestions(updated);
    try { localStorage.setItem("upstream_appt_questions", JSON.stringify(updated)); } catch(e) {}
    setNewQ("");
  };

  const removeQuestion = (id) => {
    const updated = questions.filter(q => q.id !== id);
    setQuestions(updated);
    try { localStorage.setItem("upstream_appt_questions", JSON.stringify(updated)); } catch(e) {}
  };

  const checklist = ["Photo ID", "Insurance card", "Medication list", "Symptom journal", "Lab results", "Imaging reports", "Questions list", "Phone charger"];
  const [checked, setChecked] = useState({});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, background: "#040d18" }}>
      <MedicalDisclaimer compact/>

      <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase" }}>What to bring</div>
      {checklist.map((item, i) => (
        <div key={i} onClick={() => setChecked(p => ({...p, [item]: !p[item]}))} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, cursor: "pointer", background: checked[item] ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${checked[item] ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.07)"}` }}>
          <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${checked[item] ? "#22c55e" : "rgba(255,255,255,0.2)"}`, background: checked[item] ? "#22c55e" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12, color: "#040d18" }}>
            {checked[item] && "✓"}
          </div>
          <div style={{ fontSize: 13, color: checked[item] ? "#22c55e" : "#8099b0", textDecoration: checked[item] ? "line-through" : "none" }}>{item}</div>
        </div>
      ))}

      <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }}/>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase" }}>Questions for your doctor</div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={newQ} onChange={e => setNewQ(e.target.value)} onKeyDown={e => e.key === "Enter" && addQuestion()} placeholder="Add a question..." style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", color: "#dde8f4" }}/>
        <div onClick={addQuestion} style={{ padding: "10px 14px", borderRadius: 10, cursor: "pointer", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)", fontSize: 13, fontWeight: 700, color: "#38bdf8" }}>Add</div>
      </div>
      {questions.length === 0 && <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>No questions added yet.</div>}
      {questions.map(q => (
        <div key={q.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ flex: 1, fontSize: 13, color: "#cbd5e1" }}>• {q.text}</div>
          <div onClick={() => removeQuestion(q.id)} style={{ fontSize: 11, color: "#f87171", cursor: "pointer" }}>✕</div>
        </div>
      ))}

      <div onClick={onClose} style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", cursor: "pointer", textDecoration: "underline", marginTop: 4 }}>Close</div>
    </div>
  );
}

// ── Main Medical Section ───────────────────────────────────────
export default function MedicalVaultSection({ onClose }) {
  const [section, setSection] = useState(null);

  const tools = [
    { key: "aichat",   icon: "🤖", label: "AI Medical Assistant",       sub: "Plain language help — not medical advice",           color: "#ef4444" },
    { key: "labs",      icon: "🧪", label: "Lab Values Reference",       sub: "Standard ranges + plain language explanations",     color: "#38bdf8" },
    { key: "imaging",   icon: "🔬", label: "Imaging Translator",          sub: "Plain language dictionary + report translator",      color: "#a78bfa" },
    { key: "symptoms",  icon: "📋", label: "Symptom Journal",             sub: "Log symptoms, severity, duration, triggers",         color: "#22c55e" },
    { key: "appt",      icon: "📅", label: "Appointment Prep",            sub: "Bring list + questions for your doctor",             color: "#f97316" },
    { key: "connect",   icon: "🔗", label: "Family Connect",              sub: "Private session chat with someone you trust",        color: "#a78bfa" },            sub: "Bring list + questions for your doctor",             color: "#f97316" },
  ];

  if (section === "connect") return (
    <div style={{ background: "#040d18", minHeight: "60vh" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
        <div onClick={() => setSection(null)} style={{ cursor:"pointer", color:"#38bdf8", fontSize:13, fontWeight:700 }}>← Back</div>
        <div style={{ fontSize:15, fontWeight:800, color:"#dde8f4" }}>Family Connect</div>
      </div>
      <div style={{ fontSize:13, color:"#94a3b8", lineHeight:1.6, marginBottom:16 }}>
        Start a private session to talk through results or appointments with a family member — anywhere in the world.
      </div>
      <div onClick={() => { /* navigate to familyconnect */ window.history.pushState({}, "", ""); }} style={{ padding:"15px", borderRadius:14, cursor:"pointer", textAlign:"center", background:"rgba(167,139,250,0.12)", border:"1.5px solid rgba(167,139,250,0.3)", fontSize:15, fontWeight:800, color:"#a78bfa" }}>
        Open Family Connect →
      </div>
    </div>
  );

  if (section === "aichat") return (
    <div style={{ display:"flex", flexDirection:"column", height:"80vh", background:"#040d18" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16, flexShrink:0 }}>
        <div onClick={() => setSection(null)} style={{ cursor:"pointer", color:"#38bdf8", fontSize:13, fontWeight:700 }}>← Back</div>
        <div style={{ fontSize:15, fontWeight:800, color:"#dde8f4" }}>AI Medical Assistant</div>
      </div>
      <AIMedicalChat onClose={() => setSection(null)}/>
    </div>
  );

  if (section === "labs") return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div onClick={() => setSection(null)} style={{ cursor: "pointer", color: "#38bdf8", fontSize: 13, fontWeight: 700 }}>← Back</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#dde8f4" }}>Lab Values Reference</div>
      </div>
      <LabReference onClose={() => setSection(null)}/>
    </div>
  );

  if (section === "imaging") return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div onClick={() => setSection(null)} style={{ cursor: "pointer", color: "#38bdf8", fontSize: 13, fontWeight: 700 }}>← Back</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#dde8f4" }}>Imaging Translator</div>
      </div>
      <ImagingTranslator onClose={() => setSection(null)}/>
    </div>
  );

  if (section === "symptoms") return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div onClick={() => setSection(null)} style={{ cursor: "pointer", color: "#38bdf8", fontSize: 13, fontWeight: 700 }}>← Back</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#dde8f4" }}>Symptom Journal</div>
      </div>
      <SymptomJournal onClose={() => setSection(null)}/>
    </div>
  );

  if (section === "appt") return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div onClick={() => setSection(null)} style={{ cursor: "pointer", color: "#38bdf8", fontSize: 13, fontWeight: 700 }}>← Back</div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#dde8f4" }}>Appointment Prep</div>
      </div>
      <AppointmentPrep onClose={() => setSection(null)}/>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, background: "#040d18", color: "#dde8f4" }}>
      <MedicalDisclaimer/>

      <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.6 }}>
        A private, device-only medical wellness journal. Track symptoms, understand your lab and imaging results in plain language, and prepare for appointments. Nothing is shared with anyone.
      </div>

      {tools.map(t => (
        <div key={t.key} onClick={() => setSection(t.key)} style={{ background: t.color + "08", border: `1px solid ${t.color}20`, borderRadius: 14, padding: "16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 28 }}>{t.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.color }}>{t.label}</div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 2 }}>{t.sub}</div>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      ))}

      {/* National Resources */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 16px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Resources</div>
        {[
          { label: "NIH MedlinePlus — Plain language health info", url: "https://medlineplus.gov", color: "#38bdf8" },
          { label: "RadiologyInfo.org — Patient imaging guide", url: "https://www.radiologyinfo.org", color: "#a78bfa" },
          { label: "CDC Health Topics", url: "https://www.cdc.gov/az/index.html", color: "#22c55e" },
          { label: "VA Health Library (Veterans)", url: "https://www.myhealth.va.gov/mhv-portal-web/library", color: "#f97316" },
        ].map((r, i) => (
          <div key={i} onClick={() => window.open(r.url, "_blank")} style={{ padding: "9px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none", cursor: "pointer", fontSize: 12, color: r.color, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {r.label}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        ))}
      </div>

      {/* Emergency — always last */}
      <div style={{ background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "12px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "#fca5a5", fontWeight: 700, marginBottom: 4 }}>Medical Emergency?</div>
        <div onClick={() => window.location.href = "tel:911"} style={{ fontSize: 15, fontWeight: 900, color: "#ef4444", cursor: "pointer" }}>📞 Call 911</div>
        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>For questions about your results, contact your physician or healthcare provider.</div>
      </div>

      <div onClick={onClose} style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", cursor: "pointer", textDecoration: "underline" }}>Close</div>
    </div>
  );
}
