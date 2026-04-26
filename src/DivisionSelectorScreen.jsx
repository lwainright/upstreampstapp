// ============================================================
// SCREEN: DivisionSelectorScreen
// Upstream Initiative — Multi-Division Agency Support
// Option B: One QR, division selector after join
// Responder picks their division — can switch for mutual aid
// ============================================================
import React, { useState, useEffect } from 'react';
import { databases } from './appwrite.js';
import { Query } from 'appwrite';

const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE || '69c88588001ed071c19e';

export default function DivisionSelectorScreen({ agencyCode, agencyName, onSelect, onSkip }) {
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await databases.listDocuments(DB_ID, 'agency_divisions', [
          Query.equal('agencyCode', agencyCode),
          Query.equal('active', true),
          Query.orderAsc('name'),
          Query.limit(50),
        ]);
        setDivisions(res.documents || []);
      } catch(e) {
        setDivisions([]);
      }
      setLoading(false);
    };
    load();
  }, [agencyCode]);

  const filtered = divisions.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.description || "").toLowerCase().includes(search.toLowerCase())
  );

  const confirm = () => {
    if (!selected) return;
    try {
      localStorage.setItem("upstream_active_division", JSON.stringify(selected));
    } catch(e) {}
    onSelect(selected);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#040d18",
      display: "flex", flexDirection: "column",
      fontFamily: "'DM Sans', sans-serif",
      animation: "fadeIn 0.2s ease-out",
    }}>
      <style>{`@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }`}</style>

      {/* Header */}
      <div style={{ background: "rgba(6,14,27,0.97)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "16px 20px", flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#dde8f4" }}>{agencyName || agencyCode}</div>
        <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>Select your division</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>

        {divisions.length > 5 && (
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search divisions..."
            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", color: "#dde8f4", marginBottom: 16, boxSizing: "border-box" }}
          />
        )}

        {loading && (
          <div style={{ textAlign: "center", padding: "40px", color: "#475569", fontSize: 13 }}>Loading divisions...</div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#334155", fontSize: 13, lineHeight: 1.7 }}>
            No divisions found for this agency.{"\n"}You can continue without selecting a division.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(div => {
            const isSelected = selected?.$id === div.$id;
            return (
              <div key={div.$id} onClick={() => setSelected(div)}
                style={{ background: isSelected ? "rgba(56,189,248,0.1)" : "rgba(255,255,255,0.025)", border: `1.5px solid ${isSelected ? "rgba(56,189,248,0.35)" : "rgba(255,255,255,0.07)"}`, borderRadius: 14, padding: "16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "all 0.15s" }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: isSelected ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${isSelected ? "rgba(56,189,248,0.3)" : "rgba(255,255,255,0.08)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                  {div.icon || "🏢"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: isSelected ? "#38bdf8" : "#dde8f4" }}>{div.name}</div>
                  {div.description && (
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{div.description}</div>
                  )}
                  {div.supervisor && (
                    <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>Supervisor: {div.supervisor}</div>
                  )}
                </div>
                <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${isSelected ? "#38bdf8" : "rgba(255,255,255,0.15)"}`, background: isSelected ? "#38bdf8" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {isSelected && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#040d18" }}/>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer actions */}
      <div style={{ padding: "16px 20px", background: "rgba(6,14,27,0.97)", borderTop: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <div onClick={selected ? confirm : null} style={{ padding: "14px", borderRadius: 12, cursor: selected ? "pointer" : "not-allowed", textAlign: "center", background: selected ? "rgba(56,189,248,0.12)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${selected ? "rgba(56,189,248,0.3)" : "rgba(255,255,255,0.07)"}`, fontSize: 14, fontWeight: 800, color: selected ? "#38bdf8" : "#334155", marginBottom: 10 }}>
          {selected ? `Join ${selected.name} →` : "Select a division"}
        </div>
        <div onClick={onSkip} style={{ textAlign: "center", fontSize: 12, color: "#334155", cursor: "pointer" }}>
          Skip — continue without a division
        </div>
      </div>
    </div>
  );
}

// ── Division Switcher (quick switch for mutual aid) ───────────
export function DivisionSwitcher({ agencyCode, currentDivision, onSwitch, onClose }) {
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await databases.listDocuments(DB_ID, 'agency_divisions', [
          Query.equal('agencyCode', agencyCode),
          Query.equal('active', true),
          Query.orderAsc('name'),
          Query.limit(50),
        ]);
        setDivisions(res.documents || []);
      } catch(e) { setDivisions([]); }
      setLoading(false);
    };
    load();
  }, [agencyCode]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 1000 }} onClick={onClose}>
      <div style={{ background: "#0b1829", border: "1.5px solid rgba(255,255,255,0.08)", borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 480, maxHeight: "70vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", margin: "0 auto 20px" }}/>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#dde8f4", marginBottom: 4 }}>Switch Division</div>
        <div style={{ fontSize: 12, color: "#475569", marginBottom: 16 }}>For mutual aid or special events — temporary switch</div>

        {loading && <div style={{ textAlign: "center", color: "#475569", fontSize: 13, padding: "20px" }}>Loading...</div>}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {divisions.map(div => {
            const isCurrent = currentDivision?.$id === div.$id;
            return (
              <div key={div.$id} onClick={() => { onSwitch(div); onClose(); }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, cursor: "pointer", background: isCurrent ? "rgba(56,189,248,0.08)" : "rgba(255,255,255,0.025)", border: `1px solid ${isCurrent ? "rgba(56,189,248,0.25)" : "rgba(255,255,255,0.06)"}` }}>
                <div style={{ fontSize: 20 }}>{div.icon || "🏢"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isCurrent ? "#38bdf8" : "#dde8f4" }}>{div.name}</div>
                  {div.description && <div style={{ fontSize: 11, color: "#475569", marginTop: 1 }}>{div.description}</div>}
                </div>
                {isCurrent && <div style={{ fontSize: 10, fontWeight: 700, color: "#38bdf8", background: "rgba(56,189,248,0.12)", padding: "2px 8px", borderRadius: 6 }}>ACTIVE</div>}
              </div>
            );
          })}
        </div>

        <div onClick={onClose} style={{ textAlign: "center", fontSize: 12, color: "#334155", cursor: "pointer", marginTop: 16 }}>Cancel</div>
      </div>
    </div>
  );
}
