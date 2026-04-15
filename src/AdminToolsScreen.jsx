import React, { useState, useEffect } from 'react';
import { ScreenSingle, Card, SLabel } from './ui.jsx';
import { useLayoutConfig } from './utils.js';
import { databases, account } from './appwrite.js';
import { Query } from 'appwrite';
import PlatformInlineContent from './PlatformInlineContent';

// Custom dark dropdown — no native select
function DarkSelect({ value, onChange, options, small = false }) {
  const [open, setOpen] = React.useState(false);
  const current = options.find(o => o.value === value) || options[0];
  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 8,
          padding: small ? "4px 8px" : "8px 10px",
          color: "#dde8f4",
          fontSize: small ? 11 : 12,
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 6,
          userSelect: "none",
          minWidth: small ? 80 : 100,
        }}
      >
        <span>{current ? current.label : value}</span>
        <span style={{ fontSize: 9, color: "#64748b" }}>▾</span>
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          background: "#0c1929",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 8, zIndex: 200, overflow: "hidden",
          marginTop: 4, minWidth: 100,
        }}>
          {options.map(o => (
            <div
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              style={{
                padding: small ? "8px 10px" : "10px 12px",
                cursor: "pointer",
                fontSize: small ? 11 : 12,
                color: o.value === value ? "#38bdf8" : "#dde8f4",
                background: o.value === value ? "rgba(56,189,248,0.08)" : "transparent",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


const MEMBER_TYPE_OPTIONS = [
  { value: "PST", label: "PST" },
  { value: "Chaplain", label: "Chaplain" },
  { value: "Therapist", label: "Therapist" },
];

const ROLE_OPTIONS = [
  { value: "pst", label: "PST" },
  { value: "supervisor", label: "Supervisor" },
  { value: "admin", label: "Admin" },
];



const ROLE_LABELS = { user:"Responder", pst:"PST Member", supervisor:"Supervisor", admin:"Admin", platform:"Platform Owner" };
const ROLE_COLORS = { user:"#38bdf8", pst:"#a78bfa", supervisor:"#eab308", admin:"#94a3b8", platform:"#f59e0b" };

const AW_DB = import.meta.env.VITE_APPWRITE_DATABASE || '69c88588001ed071c19e';

const statusColor = { on: "#22c55e", phone: "#eab308", off: "#475569" };
const statusLabel = { on: "On Duty", phone: "By Phone", off: "Off Duty" };

async function fetchAgencyStats(agencyCode, days = 30) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString();

    const [r1, r2, r3, r4] = await Promise.all([
      databases.listDocuments(AW_DB, 'checkins', [
        Query.equal('agencyCode', agencyCode),
        Query.greaterThan('$createdAt', sinceStr),
        Query.limit(5000),
      ]),
      databases.listDocuments(AW_DB, 'tool_usage', [
        Query.equal('agencyCode', agencyCode),
        Query.greaterThan('$createdAt', sinceStr),
        Query.limit(5000),
      ]),
      databases.listDocuments(AW_DB, 'ai_sessions', [
        Query.equal('agencyCode', agencyCode),
        Query.greaterThan('$createdAt', sinceStr),
        Query.limit(5000),
      ]),
      databases.listDocuments(AW_DB, 'pst_contacts', [
        Query.equal('agencyCode', agencyCode),
        Query.greaterThan('$createdAt', sinceStr),
        Query.limit(5000),
      ]),
    ]);

    const statusCounts = { great: 0, striving: 0, notwell: 0, ill: 0 };
    const byDay = {};
    (r1.documents || []).forEach(c => {
      const s = (c.status || '').toLowerCase().replace(' ', '');
      if (statusCounts[s] !== undefined) statusCounts[s]++;
      const day = (c.$createdAt || '').slice(0, 10);
      if (day) byDay[day] = (byDay[day] || 0) + 1;
    });

    const toolCounts = {};
    (r2.documents || []).forEach(t => {
      toolCounts[t.tool] = (toolCounts[t.tool] || 0) + 1;
    });

    const total = r1.total || 0;
    return {
      totalCheckins: total,
      statusCounts,
      byDay,
      toolCounts,
      totalToolUsage: r2.total || 0,
      aiSessionCount: r3.total || 0,
      pstContactCount: r4.total || 0,
      wellnessScore: total > 0
        ? Math.round((statusCounts.great * 100 + statusCounts.striving * 67 + statusCounts.notwell * 33) / total)
        : null,
    };
  } catch (e) {
    console.error('fetchAgencyStats error:', e);
    return null;
  }
}

export default function AdminToolsScreen({
  navigate,
  membership,
  onSwitchAgency,
  pstAlert, setPstAlert,
  pstAlertMsg, setPstAlertMsg,
  criticalIncident, setCriticalIncident,
  setAgencyNotification,
  isPlatform = false,
  onGhostLogin,
}) {
  const [tab, setTab] = useState("overview");
  const [liveStats, setLiveStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(false);
  const [statsDays, setStatsDays] = useState(30);
  const [showAnonForm, setShowAnonForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(null);
  const [notifText, setNotifText] = useState("");
  const [notifPriority, setNotifPriority] = useState("Info");
  const [anonText, setAnonText] = useState("");
  const [anonUrgency, setAnonUrgency] = useState("Priority");
  const [addMemberModal, setAddMemberModal] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("PST Member");
  const [addEmployeeModal, setAddEmployeeModal] = useState(false);
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpPhone, setNewEmpPhone] = useState("");
  const [rosterFilter, setRosterFilter] = useState("all");
  const [importPreview, setImportPreview] = useState(null);
  const [importError, setImportError] = useState(null);
  const [roleUserId, setRoleUserId] = useState("");
  const [roleType, setRoleType] = useState("pst");
  const [agencyRoleRows, setAgencyRoleRows] = useState([]);
  const [agencyResetRows, setAgencyResetRows] = useState([]);
  const [roleStatus, setRoleStatus] = useState("");
  const [pstRoster, setPstRoster] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [resources, setResources] = useState([]);
  const [roster, setRoster] = useState([]);

  const lc = useLayoutConfig();
  const agencyKey = membership ? membership.agencyCode : null;
  const isAdmin = (membership && membership.role === "admin") || isPlatform;
  const isSupervisor = membership && membership.role === "supervisor";
  const agencyName = membership ? membership.agencyName : "Agency";
  const openCount = escalations.filter(e => e.status === "open").length;
  const roleKey = membership ? membership.role : "admin";
  const roleColor = ROLE_COLORS[roleKey] || "#94a3b8";
  const roleLabel = ROLE_LABELS[roleKey] || "Admin";
  const agencyShort = membership ? membership.agencyShort : "--";

  useEffect(() => {
    if (isPlatform) setTab("platform");
  }, [isPlatform]);

  useEffect(() => {
    if (!agencyKey) return;
    setStatsLoading(true);
    setStatsError(false);
    fetchAgencyStats(agencyKey, statsDays)
      .then(data => {
        setStatsLoading(false);
        if (data) setLiveStats(data);
        else setStatsError(true);
      })
      .catch(() => { setStatsLoading(false); setStatsError(true); });
  }, [agencyKey, statsDays]);

  useEffect(() => {
    if (tab === 'pst' && agencyKey) {
      loadAgencyRoles();
      loadAgencyResets();
      loadPSTRoster();
    }
  }, [tab, agencyKey]);

  const loadPSTRoster = async () => {
    if (!agencyKey) return;
    try {
      const res = await databases.listDocuments(AW_DB, 'pst_roster', [
        Query.equal('agencyCode', agencyKey),
        Query.limit(100),
      ]);
      if (res.documents && res.documents.length > 0) {
        setPstRoster(res.documents.map(d => ({
          id: d.$id,
          name: d.name,
          role: d.role || 'PST Member',
          status: d.status || 'off',
          workload: d.workload || 0,
        })));
      }
    } catch (e) {
      console.log('PST roster not in Appwrite, using local state');
    }
  };

  const loadAgencyRoles = async () => {
    if (!agencyKey) return;
    try {
      const res = await databases.listDocuments(AW_DB, 'user_permissions', [
        Query.equal('agencyCode', agencyKey),
        Query.limit(200),
      ]);
      setAgencyRoleRows(res.documents || []);
    } catch (e) {
      setAgencyRoleRows([]);
    }
  };

  const assignAgencyRole = async () => {
    if (!roleUserId.trim()) return;
    try {
      const { ID } = await import('appwrite');
      await databases.createDocument(AW_DB, 'user_permissions', ID.unique(), {
        agencyCode: agencyKey,
        userId: roleUserId.trim(),
        role: roleType,
      });
      setRoleUserId('');
      setRoleStatus('Role assigned ✓');
      loadAgencyRoles();
    } catch (e) {
      setRoleStatus('Error: ' + e.message);
    }
  };

  const updateAgencyRole = async (docId, role) => {
    try {
      await databases.updateDocument(AW_DB, 'user_permissions', docId, { role });
      setRoleStatus('Role updated ✓');
      loadAgencyRoles();
    } catch (e) {
      setRoleStatus('Error: ' + e.message);
    }
  };

  const revokeAgencyRole = async (docId) => {
    try {
      await databases.deleteDocument(AW_DB, 'user_permissions', docId);
      setRoleStatus('Role revoked ✓');
      loadAgencyRoles();
    } catch (e) {
      setRoleStatus('Error: ' + e.message);
    }
  };

  const loadAgencyResets = async () => {
    if (!agencyKey) return;
    try {
      const res = await databases.listDocuments(AW_DB, 'password_reset_requests', [
        Query.equal('agencyCode', agencyKey),
        Query.equal('status', 'open'),
        Query.limit(100),
      ]);
      setAgencyResetRows(res.documents || []);
    } catch (e) {
      setAgencyResetRows([]);
    }
  };

  const resolveAgencyReset = async (docId) => {
    try {
      await databases.updateDocument(AW_DB, 'password_reset_requests', docId, {
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
      });
      setRoleStatus('Reset resolved ✓');
      loadAgencyResets();
    } catch (e) {
      setRoleStatus('Error: ' + e.message);
    }
  };

  const handleRosterFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target.result;
        const rawLines = text.split("\n").filter(l => l.trim());
        const headers = rawLines[0].split(",").map(h => h.trim().toLowerCase());
        const nameIdx = headers.findIndex(h => h.includes("name"));
        const phoneIdx = headers.findIndex(h => h.includes("phone") || h.includes("number") || h.includes("tel"));
        if (nameIdx === -1 || phoneIdx === -1) {
          setImportError("Could not find Name and Phone columns.");
          setImportPreview(null);
          return;
        }
        const rows = rawLines.slice(1).map((line, i) => {
          const cols = line.split(",").map(c => c.trim());
          return { id: "imp" + Date.now() + i, name: cols[nameIdx] || "", phone: cols[phoneIdx] || "", status: "active", joined: new Date().toISOString().slice(0, 10) };
        }).filter(r => r.name && r.phone);
        setImportPreview({ rows: rows.slice(0, 5), total: rows.length, allRows: rows, filename: file.name });
        setImportError(null);
      } catch (err) {
        setImportError("Could not read file. Please use CSV format.");
        setImportPreview(null);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const adminTabs = isPlatform
    ? ["overview", "wellness", "metrics", "escalations", "pst", "resources", "settings", "platform"]
    : ["overview", "wellness", "metrics", "escalations", "pst", "resources", "settings"];

  // Build trend data from liveStats if available
  const buildTrendData = () => {
    if (!liveStats || !liveStats.byDay) return null;
    const days = Object.entries(liveStats.byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7);
    if (days.length < 2) return null;
    return days.map(([date, count]) => ({
      day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      count,
    }));
  };
  const trendData = buildTrendData();

  return (
    <ScreenSingle>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "10px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.14em", color: roleColor, background: roleColor + "18", padding: "3px 10px", borderRadius: 6, textTransform: "uppercase" }}>{roleLabel}</div>
          <span style={{ fontSize: 12, color: "#8099b0", fontWeight: 500 }}>{agencyName}</span>
        </div>
        <div onClick={onSwitchAgency} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "5px 10px", cursor: "pointer" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: roleColor }}/>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{agencyShort}</span>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", gap: 5, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: 5, minHeight: 52, overflowX: "auto" }}>
        {adminTabs.map(tk => {
          const locked = (tk === "resources" || tk === "settings") && !isAdmin;
          return (
            <div key={tk} onClick={() => !locked && setTab(tk)} style={{ flexShrink: 0, minWidth: 70, textAlign: "center", padding: "10px 8px", borderRadius: 10, background: tab === tk ? "rgba(255,255,255,0.13)" : "transparent", border: `1px solid ${tab === tk ? "rgba(255,255,255,0.2)" : "transparent"}`, cursor: locked ? "not-allowed" : "pointer", fontSize: 11, fontWeight: tab === tk ? 800 : 600, color: tab === tk ? "#f1f5f9" : tk === "platform" ? "#f59e0b" : locked ? "#2d4a66" : "#8099b0", opacity: locked ? 0.4 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, whiteSpace: "nowrap" }}>
              {{ overview: "Overview", wellness: "Wellness", metrics: "Metrics", escalations: "Escalations", pst: "PST Team", resources: "Resources", settings: "Settings", platform: "Platform" }[tk]}
              {tk === "escalations" && openCount > 0 && <span style={{ fontSize: 9, fontWeight: 800, color: "#ef4444", background: "rgba(239,68,68,0.2)", padding: "1px 5px", borderRadius: 5 }}>{openCount}</span>}
            </div>
          );
        })}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#475569" }}>Agency Overview</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[7, 30, 90].map(d => (
                <div key={d} onClick={() => setStatsDays(d)} style={{ padding: "4px 10px", borderRadius: 7, cursor: "pointer", fontSize: 10, fontWeight: 700, background: statsDays === d ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.03)", border: `1px solid ${statsDays === d ? "rgba(56,189,248,0.35)" : "rgba(255,255,255,0.07)"}`, color: statsDays === d ? "#38bdf8" : "#475569" }}>{d}d</div>
              ))}
            </div>
          </div>

          {statsLoading && <div style={{ textAlign: "center", padding: "20px", fontSize: 12, color: "#334155" }}>Loading live data...</div>}
          {statsError && <div style={{ background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.18)", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#eab308", marginBottom: 8 }}>Could not load live data — check Appwrite permissions.</div>}
          {!agencyKey && <div style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#f87171", marginBottom: 8 }}>No agency connected. Log in with a staff account linked to an agency.</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            {[
              { label: "Check-Ins",       value: liveStats ? liveStats.totalCheckins : "--",  sub: liveStats ? `${statsDays}d period` : "no data", color: "#38bdf8" },
              { label: "Wellness Score",  value: liveStats?.wellnessScore != null ? liveStats.wellnessScore + "%" : "--", sub: liveStats ? "aggregate anonymous" : "no data", color: liveStats?.wellnessScore >= 70 ? "#22c55e" : liveStats?.wellnessScore >= 40 ? "#eab308" : "#ef4444" },
              { label: "AI PST Sessions", value: liveStats ? liveStats.aiSessionCount : "--",  sub: liveStats ? `${statsDays}d period` : "no data", color: "#a78bfa" },
              { label: "Tool Usage",      value: liveStats ? liveStats.totalToolUsage : "--",  sub: liveStats ? `${statsDays}d period` : "no data", color: "#22c55e" },
            ].map((s, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 14, padding: "16px 14px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.color, opacity: 0.5 }}/>
                <div style={{ fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginTop: 2 }}>{s.label}</div>
                <div style={{ fontSize: 10, color: "#334155" }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {liveStats && liveStats.totalCheckins > 0 && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 14, padding: "14px", marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Wellness Breakdown — {liveStats.totalCheckins} check-ins</div>
              {[
                { label: "Great",    count: liveStats.statusCounts.great,    color: "#22c55e" },
                { label: "Striving", count: liveStats.statusCounts.striving, color: "#eab308" },
                { label: "Not Well", count: liveStats.statusCounts.notwell,  color: "#f97316" },
                { label: "Ill",      count: liveStats.statusCounts.ill,      color: "#ef4444" },
              ].map((s, i) => {
                const pct = liveStats.totalCheckins > 0 ? Math.round((s.count / liveStats.totalCheckins) * 100) : 0;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 64, fontSize: 11, color: "#64748b" }}>{s.label}</div>
                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: pct + "%", background: s.color, borderRadius: 4, transition: "width 0.6s ease" }}/>
                    </div>
                    <div style={{ width: 40, fontSize: 11, color: s.color, fontWeight: 700, textAlign: "right" }}>{s.count}</div>
                  </div>
                );
              })}
            </div>
          )}

          {liveStats && liveStats.totalCheckins === 0 && (
            <div style={{ background: "rgba(56,189,248,0.04)", border: "1px solid rgba(56,189,248,0.1)", borderRadius: 12, padding: "16px", marginBottom: 12, textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#38bdf8", fontWeight: 600, marginBottom: 4 }}>No check-ins yet for this period</div>
              <div style={{ fontSize: 11, color: "#334155" }}>Data will appear here as staff use the app</div>
            </div>
          )}

          {/* Quick Actions */}
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#334155", marginBottom: 8 }}>Quick Actions</div>

          <div style={{ background: pstAlert ? "rgba(139,92,246,0.08)" : "rgba(255,255,255,0.02)", border: `1px solid ${pstAlert ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.055)"}`, borderRadius: 14, marginBottom: 10, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: pstAlert ? "#c4b5fd" : "#94a3b8" }}>PST Availability Banner</div>
                <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>{pstAlert ? "Active — visible to all staff" : "Not active"}</div>
              </div>
              <div onClick={() => { setPstAlert(!pstAlert); if (!pstAlert) setShowConfirm("pst"); }} style={{ padding: "8px 14px", borderRadius: 10, cursor: "pointer", background: pstAlert ? "rgba(100,116,139,0.1)" : "rgba(139,92,246,0.12)", border: `1px solid ${pstAlert ? "rgba(100,116,139,0.2)" : "rgba(139,92,246,0.3)"}`, fontSize: 12, fontWeight: 700, color: pstAlert ? "#64748b" : "#a78bfa", flexShrink: 0 }}>
                {pstAlert ? "Deactivate" : "Activate"}
              </div>
            </div>
            <div style={{ padding: "0 14px 14px" }}>
              <textarea value={pstAlertMsg} onChange={e => setPstAlertMsg(e.target.value)} placeholder="Optional message to staff" rows={2} maxLength={120} style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(139,92,246,0.2)", borderRadius: 10, padding: "10px 12px", fontSize: 12, fontFamily: "'DM Sans',sans-serif", outline: "none", resize: "none", width: "100%", lineHeight: 1.5, color: "#cbd5e1" }}/>
              <div style={{ fontSize: 10, color: "#334155", marginTop: 4, textAlign: "right" }}>{pstAlertMsg.length}/120</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: criticalIncident ? "rgba(30,30,46,0.7)" : "rgba(255,255,255,0.02)", border: `1px solid ${criticalIncident ? "rgba(148,163,184,0.2)" : "rgba(255,255,255,0.055)"}`, borderRadius: 14, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: criticalIncident ? "#f1f5f9" : "#94a3b8" }}>Critical Incident Mode</div>
              <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>{criticalIncident ? "Active" : "Not active"}</div>
            </div>
            <div onClick={() => { setCriticalIncident(!criticalIncident); if (!criticalIncident) setShowConfirm("critical"); }} style={{ padding: "8px 14px", borderRadius: 10, cursor: "pointer", background: criticalIncident ? "rgba(100,116,139,0.1)" : "rgba(71,85,105,0.15)", border: `1px solid ${criticalIncident ? "rgba(100,116,139,0.2)" : "rgba(148,163,184,0.2)"}`, fontSize: 12, fontWeight: 700, color: criticalIncident ? "#64748b" : "#94a3b8" }}>
              {criticalIncident ? "Deactivate" : "Activate"}
            </div>
          </div>
        </div>
      )}

      {/* ── WELLNESS ── */}
      {tab === "wellness" && (
        <div>
          <div style={{ background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.15)", borderRadius: 12, padding: "10px 14px", marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#38bdf8", fontWeight: 700 }}>🔒 Anonymous and aggregated — minimum 5 responses before any category displays</div>
          </div>
          {trendData ? (
            <Card>
              <SLabel color="#38bdf8">Check-In Activity — Last 7 Days</SLabel>
              <div style={{ display: "flex", gap: 3, height: 90, alignItems: "flex-end", marginTop: 12 }}>
                {trendData.map((d, i) => {
                  const max = Math.max(...trendData.map(x => x.count), 1);
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ width: "100%", background: "#38bdf8", height: `${(d.count / max) * 80}px`, borderRadius: "3px 3px 0 0", opacity: 0.7 }}/>
                      <div style={{ fontSize: 9, color: "#2d4a66", marginTop: 4 }}>{d.day}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : (
            <Card>
              <SLabel color="#38bdf8">Wellness Trend</SLabel>
              <div style={{ fontSize: 12, color: "#334155", padding: "20px 0", textAlign: "center" }}>
                {liveStats ? "Not enough data yet — trend appears after 2+ days of check-ins" : "Loading..."}
              </div>
            </Card>
          )}

          {liveStats && liveStats.totalCheckins > 0 && (
            <Card>
              <SLabel color="#eab308">Wellness Breakdown</SLabel>
              {[
                { label: "Great",    count: liveStats.statusCounts.great,    color: "#22c55e" },
                { label: "Striving", count: liveStats.statusCounts.striving, color: "#eab308" },
                { label: "Not Well", count: liveStats.statusCounts.notwell,  color: "#f97316" },
                { label: "Ill",      count: liveStats.statusCounts.ill,      color: "#ef4444" },
              ].map((s, i) => {
                const pct = liveStats.totalCheckins > 0 ? Math.round((s.count / liveStats.totalCheckins) * 100) : 0;
                return (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: "#8099b0" }}>{s.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: s.color }}>{pct}% ({s.count})</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 4, background: "rgba(255,255,255,0.04)" }}>
                      <div style={{ height: "100%", width: pct + "%", background: s.color, borderRadius: 4 }}/>
                    </div>
                  </div>
                );
              })}
            </Card>
          )}

          {liveStats && Object.keys(liveStats.toolCounts || {}).length > 0 && (
            <Card>
              <SLabel color="#f97316">Tool Usage</SLabel>
              {Object.entries(liveStats.toolCounts)
                .sort(([,a],[,b]) => b - a)
                .slice(0, 8)
                .map(([tool, count], i) => {
                  const max = Math.max(...Object.values(liveStats.toolCounts));
                  const pct = Math.round((count / max) * 100);
                  return (
                    <div key={i} style={{ marginBottom: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 11, color: "#8099b0" }}>{tool}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#38bdf8" }}>{count}x</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 4, background: "rgba(255,255,255,0.04)" }}>
                        <div style={{ height: "100%", width: pct + "%", background: "#38bdf8", borderRadius: 4, opacity: 0.7 }}/>
                      </div>
                    </div>
                  );
                })}
            </Card>
          )}
        </div>
      )}

      {/* ── METRICS ── */}
      {tab === "metrics" && (
        <div>
          <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 12, padding: "10px 14px", marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#22c55e", fontWeight: 700 }}>📊 Anonymous aggregated data — no individual usage is tracked</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            {[
              { label: "Check-Ins",       value: liveStats ? liveStats.totalCheckins : "--",  sub: `${statsDays}d period`, color: "#38bdf8" },
              { label: "AI Sessions",     value: liveStats ? liveStats.aiSessionCount : "--",  sub: `${statsDays}d period`, color: "#a78bfa" },
              { label: "PST Contacts",    value: liveStats ? liveStats.pstContactCount : "--", sub: `${statsDays}d period`, color: "#22c55e" },
              { label: "Tool Uses",       value: liveStats ? liveStats.totalToolUsage : "--",  sub: `${statsDays}d period`, color: "#eab308" },
            ].map((s, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 14, padding: "14px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.color, opacity: 0.5 }}/>
                <div style={{ fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginTop: 2 }}>{s.label}</div>
                <div style={{ fontSize: 10, color: "#334155" }}>{s.sub}</div>
              </div>
            ))}
          </div>
          {!liveStats && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#334155", fontSize: 13 }}>
              {statsLoading ? "Loading metrics..." : "No metrics data available yet"}
            </div>
          )}
        </div>
      )}

      {/* ── ESCALATIONS ── */}
      {tab === "escalations" && (
        <div>
          <div style={{ background: "rgba(56,189,248,0.04)", border: "1px solid rgba(56,189,248,0.1)", borderRadius: 12, padding: "10px 14px", marginBottom: 12, fontSize: 11, color: "#38bdf8", fontWeight: 700 }}>
            Privacy: You see that a request exists and its status. You never see chat or PST notes.
          </div>
          {escalations.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#1e3a52", fontSize: 13 }}>No escalations at this time.</div>
          )}
          {escalations.map((esc) => (
            <div key={esc.id} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 14, padding: "14px 16px", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {["Urgent", "Priority", "Routine"].map(p => esc.priority === p && (
                    <span key={p} style={{ fontSize: 9, fontWeight: 800, color: { Urgent: "#ef4444", Priority: "#eab308", Routine: "#22c55e" }[p], background: { Urgent: "#ef4444", Priority: "#eab308", Routine: "#22c55e" }[p] + "20", padding: "2px 8px", borderRadius: 5 }}>{p.toUpperCase()}</span>
                  ))}
                  {["open", "claimed", "completed"].map(s => esc.status === s && (
                    <span key={s} style={{ fontSize: 9, fontWeight: 800, color: { open: "#ef4444", claimed: "#eab308", completed: "#22c55e" }[s], background: { open: "#ef4444", claimed: "#eab308", completed: "#22c55e" }[s] + "18", padding: "2px 8px", borderRadius: 5 }}>{s.toUpperCase()}</span>
                  ))}
                </div>
                <span style={{ fontSize: 10, color: "#334155" }}>{esc.time}</span>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{esc.note}</div>
            </div>
          ))}

          <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "16px 0" }}/>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>Send an agency-wide operational message to all staff.</div>
          <textarea value={notifText} onChange={e => setNotifText(e.target.value)} placeholder='E.g., "Station coverage update at 1400"' rows={3} maxLength={200} style={{ background: "rgba(255,255,255,0.03)", border: "1.5px solid rgba(255,255,255,0.07)", borderRadius: 11, padding: "11px 13px", fontSize: 12, fontFamily: "'DM Sans',sans-serif", outline: "none", resize: "none", width: "100%", lineHeight: 1.6, color: "#cbd5e1", marginBottom: 6 }}/>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: "#1e3a52" }}>{notifText.length}/200</div>
            <div style={{ display: "flex", gap: 6 }}>
              {["Info", "Important", "Urgent"].map(lv => (
                <div key={lv} onClick={() => setNotifPriority(lv)} style={{ padding: "5px 10px", borderRadius: 7, cursor: "pointer", fontSize: 10, fontWeight: 700, background: notifPriority === lv ? "rgba(100,116,139,0.15)" : "rgba(100,116,139,0.04)", border: `1px solid ${notifPriority === lv ? "rgba(100,116,139,0.3)" : "rgba(100,116,139,0.08)"}`, color: notifPriority === lv ? "#cbd5e1" : "#475569" }}>{lv}</div>
              ))}
            </div>
          </div>
          <div onClick={() => { if (!notifText.trim()) return; setAgencyNotification({ message: notifText, priority: notifPriority, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }); setNotifText(""); setShowConfirm("notification"); }} style={{ padding: "12px", borderRadius: 11, cursor: notifText.trim() ? "pointer" : "not-allowed", textAlign: "center", fontSize: 13, fontWeight: 700, background: notifText.trim() ? "rgba(148,163,184,0.1)" : "rgba(255,255,255,0.02)", border: `1px solid ${notifText.trim() ? "rgba(148,163,184,0.2)" : "rgba(255,255,255,0.04)"}`, color: notifText.trim() ? "#94a3b8" : "#334155", opacity: notifText.trim() ? 1 : 0.5 }}>Send Broadcast</div>
        </div>
      )}

      {/* ── PST TEAM ── */}
      {tab === "pst" && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#475569", marginBottom: 8 }}>PST Roster</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            {[{ s: "on", label: "On Duty", c: "#22c55e" }, { s: "phone", label: "By Phone", c: "#eab308" }, { s: "off", label: "Off Duty", c: "#475569" }].map(x => (
              <div key={x.s} style={{ flex: 1, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: x.c }}>{pstRoster.filter(m => m.status === x.s).length}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#334155", marginTop: 2 }}>{x.label}</div>
              </div>
            ))}
          </div>

          {pstRoster.length === 0 && (
            <div style={{ textAlign: "center", padding: "20px", color: "#334155", fontSize: 12 }}>No PST members added yet.</div>
          )}

          {pstRoster.map(m => (
            <div key={m.id} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor[m.status] || "#475569", flexShrink: 0 }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1" }}>{m.name}</div>
                <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>{m.role}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: statusColor[m.status] || "#475569" }}>{statusLabel[m.status] || "Off Duty"}</div>
              </div>
            </div>
          ))}

          {isAdmin && (
            <div onClick={() => setAddMemberModal(true)} style={{ background: "rgba(255,255,255,0.02)", border: "1.5px dashed rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>+</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Add PST Member</div>
            </div>
          )}

          {(isAdmin || isSupervisor) && (
            <Card style={{ marginTop: 12 }}>
              <SLabel color="#a78bfa">Agency Role Assignment</SLabel>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input value={roleUserId} onChange={e => setRoleUserId(e.target.value)} placeholder="Appwrite userId" style={{ flex: 1, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'8px 10px', color:'#dde8f4', fontSize: 12 }} />
                <DarkSelect value={roleType} onChange={setRoleType} options={ROLE_OPTIONS} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <div onClick={assignAgencyRole} style={{ flex: 1, padding:'8px', borderRadius:8, textAlign:'center', cursor:'pointer', background:'rgba(167,139,250,0.12)', border:'1px solid rgba(167,139,250,0.3)', color:'#a78bfa', fontWeight:700, fontSize:12 }}>Assign Role</div>
                <div onClick={loadAgencyRoles} style={{ flex: 1, padding:'8px', borderRadius:8, textAlign:'center', cursor:'pointer', background:'rgba(56,189,248,0.12)', border:'1px solid rgba(56,189,248,0.3)', color:'#38bdf8', fontWeight:700, fontSize:12 }}>Refresh</div>
              </div>
              {roleStatus && <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>{roleStatus}</div>}
              {agencyRoleRows.map(r => (
                <div key={r.$id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ flex: 1, fontSize: 11, color: '#cbd5e1' }}>{r.userId || r.user_id}</div>
                  <DarkSelect value={r.role || 'pst'} onChange={val => updateAgencyRole(r.$id, val)} options={ROLE_OPTIONS} small={true} />
                  <div onClick={() => revokeAgencyRole(r.$id)} style={{ fontSize: 11, color: '#f87171', cursor: 'pointer' }}>Revoke</div>
                </div>
              ))}
            </Card>
          )}

          {(isAdmin || isSupervisor) && (
            <Card style={{ marginTop: 10 }}>
              <SLabel color="#38bdf8">Password Reset Requests</SLabel>
              {agencyResetRows.length === 0 && <div style={{ fontSize: 11, color: '#64748b' }}>No open reset requests.</div>}
              {agencyResetRows.map(r => (
                <div key={r.$id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: '#cbd5e1' }}>{r.email || 'unknown email'}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>{r.requestedRole || r.role || 'staff'} · {(r.createdAt || r.$createdAt || '').slice(0, 10)}</div>
                  </div>
                  <div onClick={() => resolveAgencyReset(r.$id)} style={{ padding: '6px 10px', borderRadius: 8, cursor: 'pointer', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', fontSize: 11, fontWeight: 700, color: '#22c55e' }}>Resolve</div>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {/* ── RESOURCES ── */}
      {tab === "resources" && isAdmin && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#475569", marginBottom: 8 }}>Resource Library</div>
          {resources.length === 0 && <div style={{ textAlign: "center", padding: "30px", color: "#334155", fontSize: 12 }}>No resources added yet.</div>}
          {resources.map(r => (
            <div key={r.id} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 14, padding: "13px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1" }}>{r.title}</div>
                <div style={{ fontSize: 11, color: "#334155" }}>{r.category}</div>
              </div>
              <div onClick={() => setResources(prev => prev.filter(x => x.id !== r.id))} style={{ padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171" }}>Remove</div>
            </div>
          ))}
        </div>
      )}

      {/* ── SETTINGS ── */}
      {tab === "settings" && isAdmin && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#475569", marginBottom: 12 }}>Employee Roster</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {["all", "active", "inactive"].map(f => (
              <div key={f} onClick={() => setRosterFilter(f)} style={{ flex: 1, padding: "9px 6px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: rosterFilter === f ? "rgba(56,189,248,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${rosterFilter === f ? "rgba(56,189,248,0.3)" : "rgba(255,255,255,0.07)"}`, fontSize: 11, fontWeight: rosterFilter === f ? 800 : 600, color: rosterFilter === f ? "#38bdf8" : "#64748b" }}>
                {f.charAt(0).toUpperCase() + f.slice(1)} ({f === "all" ? roster.length : roster.filter(e => e.status === f).length})
              </div>
            ))}
          </div>
          {roster.filter(e => rosterFilter === "all" || e.status === rosterFilter).map(e => (
            <div key={e.id} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 14, padding: "13px 16px", marginBottom: 8, opacity: e.status === "inactive" ? 0.55 : 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: e.status === "active" ? "#22c55e" : "#475569", flexShrink: 0 }}/>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#dde8f4" }}>{e.name}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#475569", paddingLeft: 15 }}>{e.phone}</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <div onClick={() => setRoster(prev => prev.map(r => r.id === e.id ? { ...r, status: e.status === "active" ? "inactive" : "active" } : r))} style={{ padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, background: e.status === "active" ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)", border: `1px solid ${e.status === "active" ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`, color: e.status === "active" ? "#f87171" : "#22c55e" }}>{e.status === "active" ? "Deactivate" : "Reactivate"}</div>
                  <div onClick={() => setRoster(prev => prev.filter(r => r.id !== e.id))} style={{ padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171" }}>Remove</div>
                </div>
              </div>
            </div>
          ))}
          <div onClick={() => setAddEmployeeModal(true)} style={{ background: "rgba(255,255,255,0.02)", border: "1.5px dashed rgba(255,255,255,0.08)", borderRadius: 14, padding: "13px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>+</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Add Employee Manually</div>
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0 20px" }}/>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#475569", marginBottom: 10 }}>Import Roster (CSV)</div>
          <label style={{ display: "block" }}>
            <input type="file" accept=".csv" style={{ display: "none" }} onChange={handleRosterFile}/>
            <div style={{ background: "rgba(56,189,248,0.1)", border: "1.5px solid rgba(56,189,248,0.3)", borderRadius: 11, padding: "12px", textAlign: "center", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#38bdf8" }}>Choose CSV File</div>
          </label>
          {importError && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", marginTop: 10, fontSize: 12, color: "#f87171" }}>{importError}</div>}
          {importPreview && (
            <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 14, padding: "14px 16px", marginTop: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#22c55e", marginBottom: 8 }}>{importPreview.filename} — {importPreview.total} employees found</div>
              {importPreview.rows.map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < importPreview.rows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <span style={{ fontSize: 12, color: "#8099b0" }}>{r.name}</span>
                  <span style={{ fontSize: 11, color: "#475569" }}>{r.phone}</span>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <div onClick={() => setImportPreview(null)} style={{ flex: 1, padding: "10px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 12, fontWeight: 700, color: "#475569" }}>Cancel</div>
                <div onClick={() => { setRoster(importPreview.allRows); setImportPreview(null); setShowConfirm("roster_imported"); }} style={{ flex: 2, padding: "10px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: "rgba(34,197,94,0.12)", border: "1.5px solid rgba(34,197,94,0.3)", fontSize: 12, fontWeight: 700, color: "#22c55e" }}>Import {importPreview.total} Employees</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PLATFORM ── */}
      {tab === "platform" && isPlatform && (
        <PlatformInlineContent navigate={navigate} onGhostLogin={onGhostLogin || function(){}}/>
      )}

      {/* Modals */}
      {showAnonForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 }} onClick={() => setShowAnonForm(false)}>
          <div style={{ background: "#0c1929", border: "1.5px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "28px 22px", maxWidth: 420, width: "100%" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#cbd5e1", marginBottom: 6 }}>Submit Anonymous Report</div>
            <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.65, marginBottom: 20 }}>This report goes to the PST team only. Your identity is not attached.</div>
            <textarea value={anonText} onChange={e => setAnonText(e.target.value)} placeholder="Describe your concern." rows={5} style={{ background: "rgba(255,255,255,0.03)", border: "1.5px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 14px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", resize: "none", width: "100%", lineHeight: 1.6, marginBottom: 16 }}/>
            <div style={{ display: "flex", gap: 10 }}>
              <div onClick={() => { setShowAnonForm(false); setAnonText(""); }} style={{ flex: 1, padding: "13px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 13, fontWeight: 700, color: "#475569" }}>Cancel</div>
              <div onClick={() => { setShowAnonForm(false); setAnonText(""); setShowConfirm("anon_submitted"); }} style={{ flex: 2, padding: "13px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(167,139,250,0.12)", border: "1.5px solid rgba(167,139,250,0.3)", fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>Submit Report</div>
            </div>
          </div>
        </div>
      )}

      {addMemberModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 }}>
          <div style={{ background: "#0c1929", border: "1.5px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "28px 22px", maxWidth: 380, width: "100%" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#cbd5e1", marginBottom: 16 }}>Add PST Member</div>
            <input value={newMemberName} onChange={e => setNewMemberName(e.target.value)} placeholder="Full name" style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", borderRadius: 11, padding: "11px 13px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", width: "100%", marginBottom: 14, color: "#dde8f4" }}/>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>Member Type</div>
              <DarkSelect value={newMemberRole} onChange={setNewMemberRole} options={MEMBER_TYPE_OPTIONS} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div onClick={() => { setAddMemberModal(false); setNewMemberName(""); }} style={{ flex: 1, padding: "12px", borderRadius: 11, cursor: "pointer", textAlign: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 13, fontWeight: 700, color: "#475569" }}>Cancel</div>
              <div onClick={() => { if (!newMemberName.trim()) return; setPstRoster(prev => [...prev, { id: "p" + Date.now(), name: newMemberName.trim(), role: newMemberRole, status: "on", workload: 0 }]); setAddMemberModal(false); setNewMemberName(""); setShowConfirm("member_added"); }} style={{ flex: 2, padding: "12px", borderRadius: 11, cursor: "pointer", textAlign: "center", background: "rgba(148,163,184,0.12)", border: "1.5px solid rgba(148,163,184,0.3)", fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>Add Member</div>
            </div>
          </div>
        </div>
      )}

      {addEmployeeModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 }}>
          <div style={{ background: "#0c1929", border: "1.5px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "28px 22px", maxWidth: 380, width: "100%" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#cbd5e1", marginBottom: 16 }}>Add Employee</div>
            <input value={newEmpName} onChange={e => setNewEmpName(e.target.value)} placeholder="Full name" style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", borderRadius: 11, padding: "11px 13px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", width: "100%", marginBottom: 10, color: "#dde8f4" }}/>
            <input value={newEmpPhone} onChange={e => setNewEmpPhone(e.target.value)} placeholder="Phone number" style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", borderRadius: 11, padding: "11px 13px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", width: "100%", marginBottom: 20, color: "#dde8f4" }}/>
            <div style={{ display: "flex", gap: 10 }}>
              <div onClick={() => { setAddEmployeeModal(false); setNewEmpName(""); setNewEmpPhone(""); }} style={{ flex: 1, padding: "12px", borderRadius: 11, cursor: "pointer", textAlign: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 13, fontWeight: 700, color: "#475569" }}>Cancel</div>
              <div onClick={() => { if (!newEmpName.trim() || !newEmpPhone.trim()) return; setRoster(prev => [...prev, { id: "e" + Date.now(), name: newEmpName.trim(), phone: newEmpPhone.trim(), status: "active", joined: new Date().toISOString().slice(0, 10) }]); setAddEmployeeModal(false); setNewEmpName(""); setNewEmpPhone(""); }} style={{ flex: 2, padding: "12px", borderRadius: 11, cursor: "pointer", textAlign: "center", background: "rgba(34,197,94,0.12)", border: "1.5px solid rgba(34,197,94,0.3)", fontSize: 13, fontWeight: 700, color: "#22c55e" }}>Add Employee</div>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 }}>
          <div style={{ background: "#0c1929", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "28px 24px", maxWidth: 320, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>✓</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#cbd5e1", marginBottom: 8 }}>
              {showConfirm === "pst" ? "PST Banner Activated" : showConfirm === "critical" ? "Critical Mode Activated" : showConfirm === "notification" ? "Broadcast Sent" : showConfirm === "anon_submitted" ? "Report Submitted" : showConfirm === "member_added" ? "Member Added" : showConfirm === "roster_imported" ? "Roster Imported" : "Saved"}
            </div>
            <div onClick={() => setShowConfirm(null)} style={{ padding: "12px", borderRadius: 11, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 13, fontWeight: 700, color: "#64748b", marginTop: 16 }}>Done</div>
          </div>
        </div>
      )}

    </ScreenSingle>
  );
}
