// ============================================================
// SCREEN: SeatSelectorScreen
// Upstream Initiative — Who are you?
// First launch seat selection — branches entire experience
// Multi-select checkboxes — check all that apply
// Saved to localStorage — changeable anytime in Settings
// ============================================================
import React, { useState } from 'react';

const SEATS = [
  {
    key: "responder",
    icon: "🚑",
    label: "First Responder",
    sub: "EMS · Fire · Law Enforcement · Corrections · Dispatch · SRO · Mobile Crisis · Co-Responder · Forensic · Probation · Parole",
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.08)",
    border: "rgba(56,189,248,0.25)",
  },
  {
    key: "veteran",
    icon: "🎖",
    label: "Veteran",
    sub: "Military service — any branch, any era",
    color: "#a78bfa",
    bg: "rgba(167,139,250,0.08)",
    border: "rgba(167,139,250,0.25)",
  },
  {
    key: "telecommunications",
    icon: "📡",
    label: "Telecommunications & Comm Centers",
    sub: "911 Dispatchers · Comm Centers · Call-takers · Supervisors",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.25)",
  },
  {
    key: "spouse",
    icon: "💙",
    label: "Spouse / Partner",
    sub: "Supporting a first responder or veteran at home",
    color: "#f97316",
    bg: "rgba(249,115,22,0.08)",
    border: "rgba(249,115,22,0.25)",
  },
  {
    key: "family",
    icon: "👨‍👩‍👧",
    label: "Family Member",
    sub: "Child, teen, or adult family member of a responder or veteran",
    color: "#eab308",
    bg: "rgba(234,179,8,0.08)",
    border: "rgba(234,179,8,0.25)",
  },
  {
    key: "civilianworkforce",
    icon: "🏛",
    label: "Civilian Workforce",
    sub: "Government · Administrative · Facilities · Courthouse · School support",
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.08)",
    border: "rgba(56,189,248,0.25)",
  },
  {
    key: "humanservices",
    icon: "🏛",
    label: "Human Services Worker",
    sub: "DSS · CPS · APS · Child Welfare · Adult Services",
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.08)",
    border: "rgba(56,189,248,0.25)",
  },
  {
    key: "retiree",
    icon: "🏅",
    label: "Retiree",
    sub: "Retired from first responder or military service",
    color: "#64748b",
    bg: "rgba(100,116,139,0.08)",
    border: "rgba(100,116,139,0.2)",
  },
];

export default function SeatSelectorScreen({ onComplete, onSkip }) {
  const [selected, setSelected] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("upstream_seats") || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch(e) { return []; }
  });

  const toggle = (key) => {
    setSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const save = () => {
    try {
      localStorage.setItem("upstream_seats", JSON.stringify(selected));
      localStorage.setItem("upstream_seat_selected", "true");
    } catch(e) {}
    onComplete(selected);
  };

  const skip = () => {
    try { localStorage.setItem("upstream_seat_selected", "true"); } catch(e) {}
    onSkip();
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#040d18",
      display: "flex", flexDirection: "column",
      alignItems: "center", overflowY: "auto",
      padding: "40px 24px 100px",
      fontFamily: "'DM Sans', sans-serif",
      animation: "fadeIn 0.2s ease-out",
    }}>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>

      <div style={{ width: "100%", maxWidth: 460, display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Header */}
        <div style={{ textAlign: "center", paddingTop: 10 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👋</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#dde8f4", marginBottom: 8, lineHeight: 1.3 }}>
            Who are you?
          </div>
          <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.7 }}>
            Check all that apply. This helps us show you the right tools and resources. You can change this anytime in Settings.
          </div>
        </div>

        {/* Seat options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {SEATS.map(seat => {
            const isSelected = selected.includes(seat.key);
            return (
              <div key={seat.key} onClick={() => toggle(seat.key)} style={{
                background: isSelected ? seat.bg : "rgba(255,255,255,0.025)",
                border: `1.5px solid ${isSelected ? seat.border : "rgba(255,255,255,0.07)"}`,
                borderRadius: 16, padding: "16px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 14,
                transition: "all 0.15s",
              }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>{seat.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: isSelected ? seat.color : "#dde8f4" }}>
                    {seat.label}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 3, lineHeight: 1.5 }}>
                    {seat.sub}
                  </div>
                </div>
                <div style={{
                  width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                  border: `2px solid ${isSelected ? seat.color : "rgba(255,255,255,0.15)"}`,
                  background: isSelected ? seat.color : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, color: "#040d18", fontWeight: 900,
                  transition: "all 0.15s",
                }}>
                  {isSelected && "✓"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Privacy note */}
        <div style={{ background: "rgba(56,189,248,0.04)", border: "1px solid rgba(56,189,248,0.1)", borderRadius: 12, padding: "12px 14px", fontSize: 12, color: "#334155", lineHeight: 1.6 }}>
          🔒 This stays on your device. Nothing is shared with your agency, supervisor, or anyone else.
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div
            onClick={selected.length > 0 ? save : null}
            style={{
              padding: "15px", borderRadius: 14, textAlign: "center",
              cursor: selected.length > 0 ? "pointer" : "not-allowed",
              background: selected.length > 0 ? "rgba(56,189,248,0.12)" : "rgba(255,255,255,0.03)",
              border: `1.5px solid ${selected.length > 0 ? "rgba(56,189,248,0.35)" : "rgba(255,255,255,0.07)"}`,
              fontSize: 15, fontWeight: 800,
              color: selected.length > 0 ? "#38bdf8" : "#334155",
              transition: "all 0.15s",
            }}
          >
            {selected.length === 0 ? "Select at least one" : `Continue with ${selected.length} selected →`}
          </div>

          <div onClick={skip} style={{ textAlign: "center", fontSize: 13, color: "#334155", cursor: "pointer", padding: "10px" }}>
            Skip for now
          </div>
        </div>

      </div>
    </div>
  );
}
