// ============================================================
// COMPONENT: FamilyCodeGenerator
// Upstream Initiative — Family Access Code Generator
// Responder generates 3-4 codes for family members
// Each code links to age-appropriate experience
// Lives in About → Settings
// ============================================================
import React, { useState, useEffect } from 'react';
import { databases } from './appwrite.js';
import { ID, Query } from 'appwrite';

const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE || '69c88588001ed071c19e';

const MEMBER_TYPES = [
  { key: "spouse",   label: "Spouse / Partner", icon: "💙", color: "#f97316", ageKey: null },
  { key: "teen",     label: "Teen (13–17)",      icon: "🧒", color: "#a78bfa", ageKey: "13-17" },
  { key: "child",    label: "Child (8–12)",       icon: "👦", color: "#38bdf8", ageKey: "8-12" },
  { key: "young",    label: "Young Child (< 8)",  icon: "🧸", color: "#22c55e", ageKey: "under8" },
  { key: "adult",    label: "Young Adult (17–18)",      icon: "🎓", color: "#eab308", ageKey: "17-18" },
];

function generateFamilyCode(type) {
  const prefix = { spouse: "SP", teen: "TN", child: "CH", young: "YC", adult: "AD" }[type] || "FM";
  const num = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${num}`;
}

export default function FamilyCodeGenerator({ agencyCode, navigate }) {
  const [codes, setCodes] = useState(() => {
    try { return JSON.parse(localStorage.getItem("upstream_family_codes") || "[]"); } catch(e) { return []; }
  });
  const [generating, setGenerating] = useState(false);
  const [selectedType, setSelectedType] = useState("spouse");
  const [contactPhone, setContactPhone] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [copied, setCopied] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");

  const maxCodes = 4;
  const activeCodes = codes.filter(c => !c.used);

  const generateCode = async () => {
    if (activeCodes.length >= maxCodes) {
      setStatusMsg(`Maximum of ${maxCodes} active codes allowed.`);
      return;
    }
    setGenerating(true);
    const code = generateFamilyCode(selectedType);
    const memberType = MEMBER_TYPES.find(t => t.key === selectedType);
    const newCode = {
      id: Date.now(),
      code,
      type: selectedType,
      label: memberType?.label || selectedType,
      ageKey: memberType?.ageKey || null,
      contactPhone: contactPhone.trim() || null,
      created: new Date().toISOString(),
      used: false,
      usedAt: null,
      agencyCode: agencyCode || null,
    };

    // Save to Appwrite
    try {
      await databases.createDocument(DB_ID, 'family_codes', ID.unique(), {
        code,
        type:         selectedType,
        ageKey:       memberType?.ageKey || null,
        agencyCode:   agencyCode || null,
        contactPhone: contactPhone.trim() || null,
        used:         false,
        createdAt:    new Date().toISOString(),
      });
    } catch(e) {
      console.warn("Family code save to Appwrite failed:", e.message);
    }

    const updated = [...codes, newCode];
    setCodes(updated);
    try { localStorage.setItem("upstream_family_codes", JSON.stringify(updated)); } catch(e) {}
    setContactPhone("");
    setShowAdd(false);
    setGenerating(false);
    setStatusMsg("Code generated ✓");
    setTimeout(() => setStatusMsg(""), 2000);
  };

  const copyCode = (code) => {
    try {
      navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    } catch(e) {}
  };

  const shareCode = (c) => {
    const memberType = MEMBER_TYPES.find(t => t.key === c.type);
    const text = `Here's your Upstream Approach access code: ${c.code}\n\nOpen the app at https://upstreampst.netlify.app and enter this code to get started.\n\nThis code is just for you.`;
    if (navigator.share) {
      navigator.share({ title: "Upstream Approach Access Code", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setCopied(c.code + "_share");
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const revokeCode = (id) => {
    const updated = codes.filter(c => c.id !== id);
    setCodes(updated);
    try { localStorage.setItem("upstream_family_codes", JSON.stringify(updated)); } catch(e) {}
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "10px 12px",
    fontSize: 13, fontFamily: "'DM Sans',sans-serif",
    outline: "none", color: "#dde8f4", width: "100%",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      <div style={{ background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.18)", borderRadius: 14, padding: "14px 16px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fb923c", marginBottom: 4 }}>👨‍👩‍👧 Family Access</div>
        <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
          Generate a private code for each family member. They enter it in the app to get an age-appropriate experience. You get notified if they escalate.
        </div>
      </div>

      {statusMsg && (
        <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#22c55e", fontWeight: 700 }}>
          {statusMsg}
        </div>
      )}

      {/* Active codes */}
      {codes.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Active Codes ({activeCodes.length}/{maxCodes})
          </div>
          {codes.map(c => {
            const memberType = MEMBER_TYPES.find(t => t.key === c.type);
            const isUsed = c.used;
            return (
              <div key={c.id} style={{ background: isUsed ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.03)", border: `1px solid ${isUsed ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)"}`, borderRadius: 14, padding: "14px 16px", opacity: isUsed ? 0.5 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{memberType?.icon || "👤"}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isUsed ? "#334155" : "#dde8f4" }}>{c.label}</div>
                      <div style={{ fontSize: 10, color: "#334155", marginTop: 1 }}>
                        {isUsed ? `Used ${new Date(c.usedAt).toLocaleDateString()}` : `Created ${new Date(c.created).toLocaleDateString()}`}
                      </div>
                    </div>
                  </div>
                  {!isUsed && (
                    <div onClick={() => revokeCode(c.id)} style={{ fontSize: 11, color: "#f87171", cursor: "pointer", padding: "3px 8px", borderRadius: 6, background: "rgba(239,68,68,0.08)" }}>
                      Revoke
                    </div>
                  )}
                </div>

                {!isUsed && (
                  <>
                    <div style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.15)", borderRadius: 10, padding: "10px 14px", marginBottom: 8, textAlign: "center" }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: "#38bdf8", letterSpacing: "0.12em" }}>{c.code}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <div onClick={() => copyCode(c.code)} style={{ flex: 1, padding: "8px", borderRadius: 8, cursor: "pointer", textAlign: "center", background: copied === c.code ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${copied === c.code ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.08)"}`, fontSize: 12, fontWeight: 700, color: copied === c.code ? "#22c55e" : "#94a3b8" }}>
                        {copied === c.code ? "✓ Copied" : "Copy"}
                      </div>
                      <div onClick={() => shareCode(c)} style={{ flex: 2, padding: "8px", borderRadius: 8, cursor: "pointer", textAlign: "center", background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", fontSize: 12, fontWeight: 700, color: "#38bdf8" }}>
                        {copied === c.code + "_share" ? "✓ Copied message" : "Share →"}
                      </div>
                    </div>
                    {c.contactPhone && (
                      <div style={{ marginTop: 6, fontSize: 11, color: "#475569" }}>
                        📞 Escalation alerts → {c.contactPhone}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add new code */}
      {activeCodes.length < maxCodes && !showAdd && (
        <div onClick={() => setShowAdd(true)} style={{ padding: "13px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(249,115,22,0.08)", border: "1.5px solid rgba(249,115,22,0.25)", fontSize: 13, fontWeight: 700, color: "#fb923c" }}>
          + Generate New Code
        </div>
      )}

      {showAdd && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#dde8f4" }}>Who is this code for?</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {MEMBER_TYPES.map(t => (
              <div key={t.key} onClick={() => setSelectedType(t.key)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, cursor: "pointer", background: selectedType === t.key ? t.color + "12" : "rgba(255,255,255,0.02)", border: `1.5px solid ${selectedType === t.key ? t.color + "40" : "rgba(255,255,255,0.06)"}` }}>
                <span style={{ fontSize: 18 }}>{t.icon}</span>
                <div style={{ flex: 1, fontSize: 13, fontWeight: selectedType === t.key ? 700 : 500, color: selectedType === t.key ? t.color : "#8099b0" }}>{t.label}</div>
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${selectedType === t.key ? t.color : "rgba(255,255,255,0.15)"}`, background: selectedType === t.key ? t.color : "transparent", flexShrink: 0 }}/>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 11, color: "#475569", marginBottom: 6 }}>Your phone number for escalation alerts (optional)</div>
            <input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="e.g. 252-555-1234" style={inputStyle}/>
            <div style={{ fontSize: 11, color: "#334155", marginTop: 4, lineHeight: 1.5 }}>
              If this family member escalates in the app, you'll receive an SMS notification.
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <div onClick={() => setShowAdd(false)} style={{ flex: 1, padding: "11px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 12, fontWeight: 700, color: "#64748b" }}>Cancel</div>
            <div onClick={generating ? null : generateCode} style={{ flex: 2, padding: "11px", borderRadius: 10, cursor: generating ? "not-allowed" : "pointer", textAlign: "center", background: generating ? "rgba(255,255,255,0.03)" : "rgba(249,115,22,0.12)", border: `1.5px solid ${generating ? "rgba(255,255,255,0.07)" : "rgba(249,115,22,0.35)"}`, fontSize: 13, fontWeight: 700, color: generating ? "#334155" : "#fb923c" }}>
              {generating ? "Generating..." : "Generate Code"}
            </div>
          </div>
        </div>
      )}

      {activeCodes.length >= maxCodes && (
        <div style={{ fontSize: 12, color: "#475569", textAlign: "center", lineHeight: 1.6 }}>
          Maximum of {maxCodes} active codes. Revoke one to generate a new code.
        </div>
      )}

      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 14px", fontSize: 11, color: "#334155", lineHeight: 1.7 }}>
        🔒 Codes are single-use and tied only to you — not to your name or badge number. Family members get an age-appropriate experience. You receive escalation alerts only — never their content.
      </div>
    </div>
  );
}
