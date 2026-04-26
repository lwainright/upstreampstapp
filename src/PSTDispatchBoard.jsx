// ============================================================
// SCREEN: PSTDispatchBoard
// Upstream Initiative — PST Dispatch Board
// CAD-style incoming queue for PST members
// Role: pst, supervisor, admin
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { ScreenSingle } from './ui.jsx';
import { databases } from './appwrite.js';
import { Query, ID } from 'appwrite';

const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE || '69c88588001ed071c19e';

const URGENCY = {
  red:    { color: "#ef4444", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.35)",  label: "RED",    pulse: true  },
  orange: { color: "#f97316", bg: "rgba(249,115,22,0.1)",  border: "rgba(249,115,22,0.3)",  label: "ORANGE", pulse: true  },
  yellow: { color: "#eab308", bg: "rgba(234,179,8,0.08)",  border: "rgba(234,179,8,0.25)",  label: "YELLOW", pulse: false },
  green:  { color: "#22c55e", bg: "rgba(34,197,94,0.06)",  border: "rgba(34,197,94,0.2)",   label: "GREEN",  pulse: false },
};

const STATUS = {
  open:        { color: "#ef4444", label: "Open"        },
  claimed:     { color: "#eab308", label: "Claimed"     },
  in_progress: { color: "#38bdf8", label: "In Progress" },
  follow_up:   { color: "#a78bfa", label: "Follow Up"   },
  referred:    { color: "#f97316", label: "Referred"    },
  closed:      { color: "#22c55e", label: "Closed"      },
};

const NEED_LABELS = {
  rough_call:   "Rough Call",
  peer_support: "Peer Support",
  checking_in:  "Check-In",
  not_sure:     "Unsure",
};

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return "Just now";
}

// ── Case Detail Modal ─────────────────────────────────────────
function CaseDetail({ case: c, onClose, onUpdate, myName }) {
  const [narrative, setNarrative] = useState(c.pstNarrative || "");
  const [status, setStatus] = useState(c.status || "open");
  const [followUpNote, setFollowUpNote] = useState(c.followUpNote || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const u = URGENCY[c.urgency] || URGENCY.green;

  const save = async (newStatus) => {
    setSaving(true);
    try {
      await databases.updateDocument(DB_ID, 'pst_cases', c.$id, {
        pstNarrative:  narrative.trim() || null,
        status:        newStatus || status,
        followUpNote:  followUpNote.trim() || null,
        claimedBy:     c.claimedBy || myName,
        updatedAt:     new Date().toISOString(),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (newStatus) setStatus(newStatus);
      onUpdate();
    } catch(e) {}
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 999, padding: "0 0 0 0" }}>
      <div style={{ background: "#0b1829", border: "1.5px solid rgba(255,255,255,0.08)", borderRadius: "20px 20px 0 0", padding: "24px 20px 40px", width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto" }}>

        {/* Case header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: u.color, letterSpacing: "0.1em", marginBottom: 4 }}>
              {u.label} · {NEED_LABELS[c.needType] || c.needType}
            </div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "#dde8f4" }}>{c.caseNumber}</div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{timeAgo(c.createdAt)} · {c.contactMethod}</div>
          </div>
          <div onClick={onClose} style={{ cursor: "pointer", color: "#475569", fontSize: 20 }}>×</div>
        </div>

        {/* Requester narrative */}
        {c.narrative && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px", marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Their Words</div>
            <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>{c.narrative}</div>
          </div>
        )}

        {/* Contact info — only visible to the PST member who claimed this case */}
        {c.contactInfo && (c.claimedBy === myName || !c.claimedBy) && (
          <div style={{ background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.15)", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#38bdf8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Contact — Provided by Requester</div>
            <div style={{ fontSize: 11, color: "#334155", marginBottom: 6 }}>They chose to share this for callback purposes only.</div>
            <div style={{ fontSize: 13, color: "#38bdf8", fontWeight: 700 }}>{c.contactInfo}</div>
            {c.callbackTime && <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>Best time: {c.callbackTime}</div>}
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <div onClick={() => window.location.href = `tel:${c.contactInfo}`} style={{ flex: 1, padding: "9px", borderRadius: 8, cursor: "pointer", textAlign: "center", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", fontSize: 12, fontWeight: 700, color: "#22c55e" }}>📞 Call</div>
              <div onClick={() => window.location.href = `sms:${c.contactInfo}`} style={{ flex: 1, padding: "9px", borderRadius: 8, cursor: "pointer", textAlign: "center", background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", fontSize: 12, fontWeight: 700, color: "#38bdf8" }}>💬 Text</div>
            </div>
          </div>
        )}

        {/* PST narrative */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>PST Narrative (coded — no names)</div>
          <textarea value={narrative} onChange={e => setNarrative(e.target.value)} placeholder="Write your coded narrative here. No identifying information..." rows={4}
            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", resize: "none", color: "#dde8f4", lineHeight: 1.6, boxSizing: "border-box" }}/>
        </div>

        {/* Follow up note */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Follow-Up Note</div>
          <textarea value={followUpNote} onChange={e => setFollowUpNote(e.target.value)} placeholder="Next steps, observations, referral info..." rows={3}
            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px 14px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", resize: "none", color: "#dde8f4", lineHeight: 1.6, boxSizing: "border-box" }}/>
        </div>

        {/* Status actions */}
        <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Update Status</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {[
            { key: "claimed",     label: "Claim",       color: "#eab308" },
            { key: "in_progress", label: "In Progress", color: "#38bdf8" },
            { key: "follow_up",   label: "Follow Up",   color: "#a78bfa" },
            { key: "referred",    label: "Refer Out",   color: "#f97316" },
            { key: "closed",      label: "Close Case",  color: "#22c55e" },
          ].map(s => (
            <div key={s.key} onClick={() => save(s.key)}
              style={{ padding: "10px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: status === s.key ? s.color + "20" : "rgba(255,255,255,0.03)", border: `1.5px solid ${status === s.key ? s.color + "50" : "rgba(255,255,255,0.07)"}`, fontSize: 12, fontWeight: 700, color: status === s.key ? s.color : "#8099b0" }}>
              {s.label}
            </div>
          ))}
        </div>

        <div onClick={() => save()} style={{ padding: "13px", borderRadius: 12, cursor: saving ? "not-allowed" : "pointer", textAlign: "center", background: saving ? "rgba(255,255,255,0.03)" : "rgba(56,189,248,0.1)", border: `1.5px solid ${saving ? "rgba(255,255,255,0.07)" : "rgba(56,189,248,0.3)"}`, fontSize: 14, fontWeight: 700, color: saving ? "#334155" : "#38bdf8" }}>
          {saved ? "✓ Saved" : saving ? "Saving..." : "Save Notes"}
        </div>

        <div style={{ marginTop: 10, fontSize: 11, color: "#334155", textAlign: "center", lineHeight: 1.6 }}>
          🔒 PST narratives are confidential. Never include names, badge numbers, or identifying information.
        </div>
      </div>
    </div>
  );
}

// ── Main Board ────────────────────────────────────────────────
export default function PSTDispatchBoard({ navigate, agency, logoSrc, role }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("open");
  const [divisionFilter, setDivisionFilter] = useState("all");
  const [divisions, setDivisions] = useState([]);

  useEffect(() => {
    if (!agencyCode) return;
    databases.listDocuments(DB_ID, 'agency_divisions', [
      Query.equal('agencyCode', agencyCode),
      Query.equal('active', true),
      Query.limit(20),
    ]).then(res => setDivisions(res.documents || [])).catch(()=>{});
  }, [agencyCode]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [myName] = useState(() => {
    try { return JSON.parse(localStorage.getItem("upstream_active_membership") || "{}").agencyName || "PST Member"; } catch(e) { return "PST Member"; }
  });
  const pollRef = useRef(null);

  const agencyCode = agency?.code || (() => {
    try { return JSON.parse(localStorage.getItem("upstream_active_membership") || "{}").agencyCode || ""; } catch(e) { return ""; }
  })();

  // Auto-purge closed cases past retention on board load
  const runAutoPurge = async () => {
    try {
      const retention = parseInt(localStorage.getItem("upstream_pst_retention") || "90");
      const cutoff = new Date(Date.now() - retention * 24 * 60 * 60 * 1000).toISOString();
      const queries = [Query.equal('status','closed'), Query.lessThan('createdAt', cutoff), Query.limit(50)];
      if (agencyCode) queries.push(Query.equal('agencyCode', agencyCode));
      const res = await databases.listDocuments(DB_ID, 'pst_cases', queries);
      for (const doc of res.documents || []) {
        await databases.updateDocument(DB_ID, 'pst_cases', doc.$id, {
          narrative: null, pstNarrative: null, followUpNote: null,
          contactInfo: null, callbackTime: null, status: 'purged',
        }).catch(()=>{});
      }
    } catch(e) {}
  };

  const loadCases = async () => {
    try {
      const queries = [Query.limit(100), Query.orderDesc("createdAt")];
      if (agencyCode) queries.push(Query.equal("agencyCode", agencyCode));
      if (filter === "open") queries.push(Query.equal("status", "open"));
      else if (filter === "active") queries.push(Query.notEqual("status", "closed"));
      if (divisionFilter !== "all") queries.push(Query.equal("division", divisionFilter));
      // All = no status filter
      const res = await databases.listDocuments(DB_ID, "pst_cases", queries);
      setCases(res.documents || []);
    } catch(e) {
      setCases([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCases();
    runAutoPurge(); // Background purge on load
    pollRef.current = setInterval(loadCases, 15000); // poll every 15s
    return () => clearInterval(pollRef.current);
  }, [filter, agencyCode]);

  const openCount  = cases.filter(c => c.status === "open").length;
  const redCount   = cases.filter(c => c.urgency === "red" && c.status !== "closed").length;

  const filters = [
    { key: "open",   label: "Incoming",   count: cases.filter(c => c.status === "open").length },
    { key: "active", label: "Active",     count: cases.filter(c => !["open","closed"].includes(c.status)).length },
    { key: "all",    label: "All",        count: cases.length },
  ];

  return (
    <ScreenSingle headerProps={{ onBack: () => navigate("pstpanel"), agencyName: agency?.name, logoSrc }}>

      {/* Board header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#dde8f4" }}>PST Dispatch</div>
          <div style={{ fontSize: 12, color: "#475569" }}>{agencyCode} · Auto-refreshes every 15s</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {redCount > 0 && (
            <div style={{ background: "rgba(239,68,68,0.15)", border: "1.5px solid rgba(239,68,68,0.4)", borderRadius: 10, padding: "6px 10px", fontSize: 11, fontWeight: 800, color: "#ef4444" }}>
              🔴 {redCount} RED
            </div>
          )}
          <div onClick={loadCases} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#38bdf8", fontSize: 16 }}>↻</div>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
        {Object.entries(URGENCY).map(([key, u]) => {
          const count = cases.filter(c => c.urgency === key && c.status !== "closed").length;
          return (
            <div key={key} style={{ background: u.bg, border: `1px solid ${u.border}`, borderRadius: 12, padding: "10px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: u.color }}>{count}</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: u.color, letterSpacing: "0.08em" }}>{u.label}</div>
            </div>
          );
        })}
      </div>

      {/* Division filter — only shows if agency has divisions */}
      {divisions.length > 0 && (
        <div style={{ display:"flex", gap:5, overflowX:"auto", paddingBottom:4 }}>
          <div onClick={() => setDivisionFilter("all")} style={{ flexShrink:0, padding:"6px 12px", borderRadius:16, cursor:"pointer", background:divisionFilter==="all"?"rgba(56,189,248,0.12)":"rgba(255,255,255,0.03)", border:`1px solid ${divisionFilter==="all"?"rgba(56,189,248,0.3)":"rgba(255,255,255,0.07)"}`, fontSize:11, fontWeight:divisionFilter==="all"?800:600, color:divisionFilter==="all"?"#38bdf8":"#64748b", whiteSpace:"nowrap" }}>All Divisions</div>
          {divisions.map(div => (
            <div key={div.$id} onClick={() => setDivisionFilter(div.name)} style={{ flexShrink:0, padding:"6px 12px", borderRadius:16, cursor:"pointer", background:divisionFilter===div.name?"rgba(56,189,248,0.12)":"rgba(255,255,255,0.03)", border:`1px solid ${divisionFilter===div.name?"rgba(56,189,248,0.3)":"rgba(255,255,255,0.07)"}`, fontSize:11, fontWeight:divisionFilter===div.name?800:600, color:divisionFilter===div.name?"#38bdf8":"#64748b", whiteSpace:"nowrap" }}>
              {div.icon||"🏢"} {div.name}
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 5, background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4 }}>
        {filters.map(f => (
          <div key={f.key} onClick={() => setFilter(f.key)} style={{ flex: 1, textAlign: "center", padding: "9px 6px", borderRadius: 9, background: filter === f.key ? "rgba(56,189,248,0.15)" : "transparent", border: `1px solid ${filter === f.key ? "rgba(56,189,248,0.3)" : "transparent"}`, cursor: "pointer", fontSize: 11, fontWeight: filter === f.key ? 800 : 600, color: filter === f.key ? "#38bdf8" : "#8099b0" }}>
            {f.label} {f.count > 0 && <span style={{ background: filter === f.key ? "rgba(56,189,248,0.2)" : "rgba(255,255,255,0.08)", borderRadius: 6, padding: "1px 5px", fontSize: 10 }}>{f.count}</span>}
          </div>
        ))}
      </div>

      {/* Cases */}
      {loading && (
        <div style={{ textAlign: "center", padding: "30px", color: "#475569", fontSize: 13 }}>Loading cases...</div>
      )}

      {!loading && cases.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "#334155", fontSize: 13 }}>
          {filter === "open" ? "No incoming cases right now." : "No cases found."}
        </div>
      )}

      {!loading && cases.map(c => {
        const u = URGENCY[c.urgency] || URGENCY.green;
        const s = STATUS[c.status] || STATUS.open;
        return (
          <div key={c.$id} onClick={() => setSelectedCase(c)}
            style={{ background: u.bg, border: `1.5px solid ${u.border}`, borderRadius: 16, padding: "14px 16px", cursor: "pointer", position: "relative", overflow: "hidden" }}>

            {/* Urgency stripe */}
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: u.color, borderRadius: "16px 0 0 16px" }}/>

            <div style={{ paddingLeft: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: u.color, letterSpacing: "0.08em" }}>
                    {u.label} · {NEED_LABELS[c.needType] || c.needType}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#dde8f4", marginTop: 2 }}>{c.caseNumber}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: s.color, background: s.color + "15", padding: "2px 8px", borderRadius: 6 }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: "#334155" }}>{timeAgo(c.createdAt)}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <div style={{ fontSize: 11, color: c.contactMethod !== "no_contact" ? "#22c55e" : "#64748b", background: c.contactMethod !== "no_contact" ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.04)", borderRadius: 6, padding: "3px 8px", fontWeight: c.contactMethod !== "no_contact" ? 700 : 400 }}>
                  {c.contactMethod === "no_contact" ? "No contact" : c.contactMethod === "call" ? "📞 Call requested" : "💬 Text requested"}
                </div>
                {c.claimedBy && (
                  <div style={{ fontSize: 11, color: "#475569", background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "3px 8px" }}>
                    Claimed by {c.claimedBy}
                  </div>
                )}
                {c.division && (
                  <div style={{ fontSize: 11, color: "#38bdf8", background: "rgba(56,189,248,0.08)", borderRadius: 6, padding: "3px 8px" }}>
                    {c.division}
                  </div>
                )}
                {c.narrative && (
                  <div style={{ fontSize: 11, color: "#475569", background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "3px 8px" }}>
                    Has narrative
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* New request button */}
      <div onClick={() => navigate("pstrequest")} style={{ padding: "13px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>
        + Submit a Request (Testing)
      </div>

      {/* Case detail modal */}
      {selectedCase && (
        <CaseDetail
          case={selectedCase}
          onClose={() => setSelectedCase(null)}
          onUpdate={() => { loadCases(); setSelectedCase(null); }}
          myName={myName}
        />
      )}

      <style>{`
        @keyframes pulse-border {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </ScreenSingle>
  );
}
