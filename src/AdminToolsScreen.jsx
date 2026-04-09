import React, { useState, useEffect } from 'react';
import { ScreenSingle, Card, SLabel, DragList } from './ui.jsx';
import { useLayoutConfig } from './utils.js';
import PlatformInlineContent from './PlatformInlineContent';

// Role constants
const ROLE_LABELS = { user:"Responder", pst:"PST Member", supervisor:"Supervisor", admin:"Admin", platform:"Platform Owner" };
const ROLE_COLORS = { user:"#38bdf8", pst:"#a78bfa", supervisor:"#eab308", admin:"#94a3b8", platform:"#f59e0b" };

// Appwrite config
const AW_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const AW_PROJECT  = import.meta.env.VITE_APPWRITE_PROJECT  || 'upstreamapproach';
const AW_DB       = import.meta.env.VITE_APPWRITE_DATABASE || 'upstream_db';

// Date helpers
const getDaysUntil = (dateStr) => {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
};

// Fetch agency stats from Appwrite
async function fetchAgencyStats(agencyCode, days = 30) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString();
    const headers = { 'X-Appwrite-Project': AW_PROJECT };
    const base = `${AW_ENDPOINT}/databases/${AW_DB}/collections`;
    const qs = (col) =>
      base + "/" + col + "/documents?queries[]=" +
      encodeURIComponent(JSON.stringify({ method: "equal", attribute: "agencyCode", values: [agencyCode] })) +
      "&queries[]=" +
      encodeURIComponent(JSON.stringify({ method: "greaterThan", attribute: "timestamp", values: [sinceStr] })) +
      "&limit=5000";

    const [r1, r2, r3, r4] = await Promise.all([
      fetch(qs('checkins'),    { headers }).then(r => r.json()),
      fetch(qs('tool_usage'), { headers }).then(r => r.json()),
      fetch(qs('ai_sessions'),{ headers }).then(r => r.json()),
      fetch(qs('pst_contacts'),{ headers }).then(r => r.json()),
    ]);

    const statusCounts = { great: 0, striving: 0, notwell: 0, ill: 0 };
    const byDay = {};
    (r1.documents || []).forEach(c => {
      if (statusCounts[c.status] !== undefined) statusCounts[c.status]++;
      const day = c.timestamp && c.timestamp.slice(0, 10);
      if (day) byDay[day] = (byDay[day] || 0) + 1;
    });
    const toolCounts = {};
    (r2.documents || []).forEach(t => { toolCounts[t.tool] = (toolCounts[t.tool] || 0) + 1; });
    const total = r1.total || 0;
    return {
      totalCheckins: total, statusCounts, byDay, toolCounts,
      totalToolUsage: r2.total || 0,
      aiSessionCount: r3.total || 0,
      pstContactCount: r4.total || 0,
      wellnessScore: total > 0
        ? Math.round((statusCounts.great * 100 + statusCounts.striving * 67 + statusCounts.notwell * 33) / total)
        : null,
    };
  } catch (e) { return null; }
}

// Demo data
const DEMO_PST_ROSTERS = {
  UPSTREAM: [
    { id: "p1", name: "A. Rodriguez", role: "PST Lead",   status: "on",    workload: 2 },
    { id: "p2", name: "B. Thompson",  role: "PST Member", status: "phone", workload: 1 },
    { id: "p3", name: "C. Williams",  role: "PST Member", status: "off",   workload: 0 },
  ],
  DEMO123: [
    { id: "p1", name: "D. Johnson",  role: "PST Lead",   status: "on",   workload: 3 },
    { id: "p2", name: "E. Martinez", role: "PST Member", status: "on",   workload: 1 },
  ],
  PST123: [
    { id: "p1", name: "F. Davis", role: "PST Lead", status: "phone", workload: 2 },
  ],
};

const DEMO_ESCALATIONS = {
  UPSTREAM: [
    { id: "e1", priority: "Priority", status: "open",    time: "14:22", note: "Staff member requested immediate peer support after difficult call.", claimedBy: null },
    { id: "e2", priority: "Routine",  status: "claimed", time: "11:05", note: "Follow-up requested after yesterday's shift check-in.", claimedBy: "B. Thompson" },
  ],
  DEMO123: [
    { id: "e1", priority: "Urgent", status: "open", time: "09:15", note: "Critical incident — multiple responders affected.", claimedBy: null },
  ],
  PST123: [],
};

const statusColor = { on: "#22c55e", phone: "#eab308", off: "#475569" };
const statusLabel = { on: "On Duty", phone: "By Phone", off: "Off Duty" };

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

  const agencyKey = membership ? membership.agencyCode : "UPSTREAM";

  const [pstRoster, setPstRoster] = useState(
    DEMO_PST_ROSTERS[agencyKey] || DEMO_PST_ROSTERS["UPSTREAM"]
  );
  const [escalations, setEscalations] = useState(
    DEMO_ESCALATIONS[agencyKey] || []
  );
  const [resources, setResources] = useState([
    { id: "r1", title: "CISM Protocol v3",   category: "Protocol", status: "active",  uploadedAt: "2026-02-10" },
    { id: "r2", title: "PST Referral Form",   category: "Forms",    status: "active",  uploadedAt: "2026-01-22" },
    { id: "r3", title: "Resilience Toolkit",  category: "Wellness", status: "pending", uploadedAt: "2026-03-05" },
  ]);
  const [roster, setRoster] = useState([
    { id: "e1", name: "J. Rivera",     phone: "555-0142", status: "active",   joined: "2024-03-01" },
    { id: "e2", name: "M. Chen",       phone: "555-0187", status: "active",   joined: "2024-05-12" },
    { id: "e3", name: "T. Washington", phone: "555-0103", status: "active",   joined: "2023-11-08" },
    { id: "e4", name: "S. Okafor",     phone: "555-0155", status: "active",   joined: "2024-01-15" },
    { id: "e5", name: "B. Martinez",   phone: "555-0198", status: "inactive", joined: "2023-06-20" },
  ]);

  const lc = useLayoutConfig();
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
    if (!membership?.agencyCode) return;
    setStatsLoading(true);
    setStatsError(false);
    fetchAgencyStats(membership.agencyCode, statsDays)
      .then(data => {
        setStatsLoading(false);
        if (data) setLiveStats(data);
        else setStatsError(true);
      })
      .catch(() => { setStatsLoading(false); setStatsError(true); });
  }, [membership?.agencyCode, statsDays]);

  const adminTabs = isPlatform
    ? ["overview", "wellness", "metrics", "escalations", "pst", "resources", "settings", "platform"]
    : ["overview", "wellness", "metrics", "escalations", "pst", "resources", "settings"];

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
          setImportError("Could not find Name and Phone columns. Check your headers.");
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

  // Chart data
  const trendData = [
    { day: "Mon", g: 48, y: 30, o: 14, r: 8 }, { day: "Tue", g: 52, y: 28, o: 12, r: 8 },
    { day: "Wed", g: 42, y: 30, o: 18, r: 10 }, { day: "Thu", g: 55, y: 26, o: 13, r: 6 },
    { day: "Fri", g: 44, y: 32, o: 16, r: 8 }, { day: "Sat", g: 58, y: 26, o: 10, r: 6 },
    { day: "Sun", g: 50, y: 28, o: 14, r: 8 },
  ];
  const heatmap = [
    { day: "Mon", count: 18 }, { day: "Tue", count: 22 }, { day: "Wed", count: 31 },
    { day: "Thu", count: 20 }, { day: "Fri", count: 28 }, { day: "Sat", count: 12 }, { day: "Sun", count: 9 },
  ];
  const maxHeat = Math.max(...heatmap.map(h => h.count));
  const toolAfterRough = [
    { label: "Box Breathing",    pct: 38, color: "#22c55e" },
    { label: "AI PST Chat",      pct: 32, color: "#ef4444" },
    { label: "90-Second Dump",   pct: 24, color: "#f97316" },
    { label: "5-4-3-2-1 Ground.",pct: 18, color: "#38bdf8" },
    { label: "Journal",          pct: 14, color: "#a78bfa" },
  ];
  const featureUsage = [
    { label: "Shift Check-Ins",       count: 83, pct: 100, color: "#38bdf8", icon: "✓"  },
    { label: "AI PST Chat",           count: 47, pct: 57,  color: "#ef4444", icon: "🤖" },
    { label: "Box Breathing",         count: 38, pct: 46,  color: "#22c55e", icon: "🫁" },
    { label: "Resources Accessed",    count: 34, pct: 41,  color: "#64748b", icon: "📚" },
    { label: "5-4-3-2-1 Grounding",  count: 29, pct: 35,  color: "#38bdf8", icon: "🖐" },
    { label: "Journal",               count: 22, pct: 27,  color: "#a78bfa", icon: "📓" },
    { label: "Human PST - Chat",      count: 21, pct: 25,  color: "#a78bfa", icon: "💬" },
    { label: "90-Second Dump",        count: 18, pct: 22,  color: "#f97316", icon: "⏱" },
    { label: "After-Action Reset",    count: 15, pct: 18,  color: "#f97316", icon: "🔄" },
    { label: "Human PST - Call",      count: 14, pct: 17,  color: "#a78bfa", icon: "📞" },
    { label: "PTSD Interruption",     count: 11, pct: 13,  color: "#7EBFAD", icon: "🧭" },
    { label: "Human PST - Text",      count: 9,  pct: 11,  color: "#a78bfa", icon: "📱" },
    { label: "Anonymous Reports",     count: 8,  pct: 10,  color: "#eab308", icon: "🔒" },
    { label: "Human PST - In Person", count: 6,  pct: 7,   color: "#a78bfa", icon: "🤝" },
  ];
  const resourceGaps = [
    { label: "Crisis Resources",     views: 142, status: "high",   color: "#ef4444" },
    { label: "State Pathways",       views: 87,  status: "high",   color: "#f97316" },
    { label: "Upstream Tools",       views: 54,  status: "normal", color: "#22c55e" },
    { label: "Downstream Resources", views: 12,  status: "low",    color: "#eab308" },
    { label: "CISM Protocols",       views: 3,   status: "gap",    color: "#334155" },
    { label: "Chaplain Services",    views: 0,   status: "gap",    color: "#1e3a52" },
  ];

  return (
    <ScreenSingle>

      {/* Header row */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: 12, padding: "10px 14px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            fontSize: 9, fontWeight: 800, letterSpacing: "0.14em",
            color: roleColor, background: roleColor + "18",
            padding: "3px 10px", borderRadius: 6, textTransform: "uppercase",
          }}>
            {roleLabel}
          </div>
          <span style={{ fontSize: 12, color: "#8099b0", fontWeight: 500 }}>{agencyName}</span>
        </div>
        <div
          onClick={onSwitchAgency}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8, padding: "5px 10px", cursor: "pointer",
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: roleColor }}/>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
            {agencyShort}
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: "flex", gap: 5,
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 14, padding: 5, minHeight: 52, overflowX: "auto",
      }}>
        {adminTabs.map(tk => {
          const locked = (tk === "resources" || tk === "settings") && !isAdmin;
          return (
            <div
              key={tk}
              onClick={() => !locked && setTab(tk)}
              style={{
                flexShrink: 0, minWidth: 70, textAlign: "center",
                padding: "10px 8px", borderRadius: 10,
                background: tab === tk ? "rgba(255,255,255,0.13)" : "transparent",
                border: `1px solid ${tab === tk ? "rgba(255,255,255,0.2)" : "transparent"}`,
                cursor: locked ? "not-allowed" : "pointer",
                fontSize: 11, fontWeight: tab === tk ? 800 : 600,
                color: tab === tk ? "#f1f5f9" : tk === "platform" ? "#f59e0b" : locked ? "#2d4a66" : "#8099b0",
                opacity: locked ? 0.4 : 1,
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 4, whiteSpace: "nowrap",
              }}
            >
              {{ overview: "Overview", wellness: "Wellness", metrics: "Metrics", escalations: "Escalations", pst: "PST Team", resources: "Resources", settings: "Settings", platform: "Platform" }[tk]}
              {tk === "escalations" && openCount > 0 && (
                <span style={{
                  fontSize: 9, fontWeight: 800, color: "#ef4444",
                  background: "rgba(239,68,68,0.2)", padding: "1px 5px", borderRadius: 5,
                }}>
                  {openCount}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#475569" }}>
              Agency Overview
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[7, 30, 90].map(d => (
                <div key={d} onClick={() => setStatsDays(d)} style={{
                  padding: "4px 10px", borderRadius: 7, cursor: "pointer",
                  fontSize: 10, fontWeight: 700,
                  background: statsDays === d ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${statsDays === d ? "rgba(56,189,248,0.35)" : "rgba(255,255,255,0.07)"}`,
                  color: statsDays === d ? "#38bdf8" : "#475569",
                }}>
                  {d}d
                </div>
              ))}
            </div>
          </div>

          {statsLoading && <div style={{ textAlign: "center", padding: "20px", fontSize: 12, color: "#334155" }}>Loading live data...</div>}
          {statsError && (
            <div style={{ background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.18)", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#eab308", marginBottom: 8 }}>
              Could not load live data. Showing demo data.
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            {[
              { label: "Check-Ins",      value: liveStats ? liveStats.totalCheckins : "--",  sub: liveStats ? `${statsDays}d period` : "loading...", color: "#38bdf8" },
              { label: "Wellness Score", value: liveStats?.wellnessScore != null ? liveStats.wellnessScore + "%" : "--", sub: liveStats ? "aggregate anonymous" : "loading...", color: liveStats?.wellnessScore >= 70 ? "#22c55e" : liveStats?.wellnessScore >= 40 ? "#eab308" : "#ef4444" },
              { label: "AI PST Sessions",value: liveStats ? liveStats.aiSessionCount : "--", sub: liveStats ? `${statsDays}d period` : "loading...", color: "#a78bfa" },
              { label: "Tool Usage",     value: liveStats ? liveStats.totalToolUsage : "--", sub: liveStats ? `${statsDays}d period` : "loading...", color: "#22c55e" },
            ].map((s, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.055)",
                borderRadius: 14, padding: "16px 14px",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.color, opacity: 0.5 }}/>
                <div style={{ fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginTop: 2 }}>{s.label}</div>
                <div style={{ fontSize: 10, color: "#334155" }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {liveStats && liveStats.totalCheckins > 0 && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 14, padding: "14px", marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
                Wellness Breakdown — {liveStats.totalCheckins} check-ins
              </div>
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

          {/* PST Alert Toggle */}
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#334155", marginBottom: 8 }}>
            Quick Actions
          </div>
          <div style={{
            background: pstAlert ? "rgba(139,92,246,0.08)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${pstAlert ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.055)"}`,
            borderRadius: 14, marginBottom: 10, overflow: "hidden",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: pstAlert ? "#c4b5fd" : "#94a3b8" }}>PST Availability Banner</div>
                <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>{pstAlert ? "Active — visible to all staff" : "Not active"}</div>
              </div>
              <div
                onClick={() => { setPstAlert(!pstAlert); if (!pstAlert) setShowConfirm("pst"); }}
                style={{
                  padding: "8px 14px", borderRadius: 10, cursor: "pointer",
                  background: pstAlert ? "rgba(100,116,139,0.1)" : "rgba(139,92,246,0.12)",
                  border: `1px solid ${pstAlert ? "rgba(100,116,139,0.2)" : "rgba(139,92,246,0.3)"}`,
                  fontSize: 12, fontWeight: 700,
                  color: pstAlert ? "#64748b" : "#a78bfa", flexShrink: 0,
                }}
              >
                {pstAlert ? "Deactivate" : "Activate"}
              </div>
            </div>
            <div style={{ padding: "0 14px 14px" }}>
              <textarea
                value={pstAlertMsg}
                onChange={e => setPstAlertMsg(e.target.value)}
                placeholder="Optional message to staff"
                rows={2} maxLength={120}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1.5px solid rgba(139,92,246,0.2)",
                  borderRadius: 10, padding: "10px 12px",
                  fontSize: 12, fontFamily: "'DM Sans',sans-serif",
                  outline: "none", resize: "none", width: "100%",
                  lineHeight: 1.5, color: "#cbd5e1",
                }}
              />
              <div style={{ fontSize: 10, color: "#334155", marginTop: 4, textAlign: "right" }}>{pstAlertMsg.length}/120</div>
            </div>
          </div>

          {/* Critical Incident Toggle */}
          <div style={{
            display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
            background: criticalIncident ? "rgba(30,30,46,0.7)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${criticalIncident ? "rgba(148,163,184,0.2)" : "rgba(255,255,255,0.055)"}`,
            borderRadius: 14, marginBottom: 10,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: criticalIncident ? "#f1f5f9" : "#94a3b8" }}>Critical Incident Mode</div>
              <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>{criticalIncident ? "Active" : "Not active"}</div>
            </div>
            <div
              onClick={() => { setCriticalIncident(!criticalIncident); if (!criticalIncident) setShowConfirm("critical"); }}
              style={{
                padding: "8px 14px", borderRadius: 10, cursor: "pointer",
                background: criticalIncident ? "rgba(100,116,139,0.1)" : "rgba(71,85,105,0.15)",
                border: `1px solid ${criticalIncident ? "rgba(100,116,139,0.2)" : "rgba(148,163,184,0.2)"}`,
                fontSize: 12, fontWeight: 700,
                color: criticalIncident ? "#64748b" : "#94a3b8",
              }}
            >
              {criticalIncident ? "Deactivate" : "Activate"}
            </div>
          </div>

          {/* Anonymous Report */}
          <div
            onClick={() => setShowAnonForm(true)}
            style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.055)",
              borderRadius: 14, cursor: "pointer", marginBottom: 10,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>Submit Anonymous Report</div>
              <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>Goes to PST only — admin cannot view submissions</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
      )}

      {/* ── WELLNESS ── */}
      {tab === "wellness" && (
        <div>
          <div style={{ background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.15)", borderRadius: 12, padding: "10px 14px", marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#38bdf8", fontWeight: 700 }}>🔒 Anonymous and aggregated — minimum 5 responses before any category displays</div>
          </div>
          <Card>
            <SLabel color="#38bdf8">Wellness — Last 7 Days</SLabel>
            <div style={{ display: "flex", gap: 3, height: 90, alignItems: "flex-end", marginTop: 12 }}>
              {trendData.map((d, i) => (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1, alignItems: "center" }}>
                  <div style={{ width: "100%", background: "#ef4444", height: `${d.r * 0.75}px`, borderRadius: "2px 2px 0 0" }}/>
                  <div style={{ width: "100%", background: "#f97316", height: `${d.o * 0.75}px` }}/>
                  <div style={{ width: "100%", background: "#eab308", height: `${d.y * 0.75}px` }}/>
                  <div style={{ width: "100%", background: "#22c55e", height: `${d.g * 0.75}px`, borderRadius: "0 0 2px 2px" }}/>
                  <div style={{ fontSize: 9, color: "#2d4a66", marginTop: 4 }}>{d.day}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              {[{ c: "#22c55e", l: "Great" }, { c: "#eab308", l: "Striving" }, { c: "#f97316", l: "Not Well" }, { c: "#ef4444", l: "Ill" }].map((x, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: x.c }}/>
                  <span style={{ fontSize: 10, color: "#2d4a66" }}>{x.l}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SLabel color="#eab308">Check-In Heatmap — By Day</SLabel>
            <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 60 }}>
              {heatmap.map((h, i) => {
                const pct = h.count / maxHeat;
                const col = pct > 0.8 ? "#ef4444" : pct > 0.6 ? "#f97316" : pct > 0.4 ? "#eab308" : "#22c55e";
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ fontSize: 9, color: col, fontWeight: 700 }}>{h.count}</div>
                    <div style={{ width: "100%", background: col, height: `${pct * 44}px`, borderRadius: 4, opacity: 0.8 }}/>
                    <div style={{ fontSize: 9, color: "#2d4a66" }}>{h.day}</div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card>
            <SLabel color="#f97316">Most Used After Rough/Bad Check-In</SLabel>
            {toolAfterRough.map((t, i) => (
              <div key={i} style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, color: "#8099b0" }}>{t.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: t.color }}>{t.pct}%</span>
                </div>
                <div style={{ height: 5, borderRadius: 4, background: "rgba(255,255,255,0.04)" }}>
                  <div style={{ height: "100%", width: `${t.pct}%`, background: t.color, borderRadius: 4 }}/>
                </div>
              </div>
            ))}
          </Card>
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
              { label: "Active Users",        value: "127", sub: "This month",   color: "#38bdf8" },
              { label: "Total Sessions",      value: "312", sub: "This month",   color: "#22c55e" },
              { label: "Escalations",         value: "3",   sub: "All resolved", color: "#eab308" },
              { label: "Avg Daily Check-Ins", value: "12",  sub: "Per day",      color: "#a78bfa" },
            ].map((s, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 14, padding: "14px", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.color, opacity: 0.5 }}/>
                <div style={{ fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginTop: 2 }}>{s.label}</div>
                <div style={{ fontSize: 10, color: "#334155" }}>{s.sub}</div>
              </div>
            ))}
          </div>
          <Card>
            <SLabel color="#38bdf8">Feature Engagement — This Month</SLabel>
            {featureUsage.map((f, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 13 }}>{f.icon}</span>
                    <span style={{ fontSize: 11, color: "#8099b0" }}>{f.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 10, color: "#334155" }}>{f.count}x</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: f.color, minWidth: 34, textAlign: "right" }}>{f.pct}%</span>
                  </div>
                </div>
                <div style={{ height: 5, borderRadius: 4, background: "rgba(255,255,255,0.04)" }}>
                  <div style={{ height: "100%", width: `${f.pct}%`, background: f.color, borderRadius: 4, opacity: 0.8 }}/>
                </div>
              </div>
            ))}
          </Card>
          <Card>
            <SLabel color="#64748b">Resource Gap Analysis</SLabel>
            {resourceGaps.map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: r.color, flexShrink: 0 }}/>
                  <span style={{ fontSize: 12, color: "#8099b0" }}>{r.label}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: r.color }}>{r.views} views</span>
                  {r.status === "gap" && <span style={{ fontSize: 9, fontWeight: 800, color: "#ef4444", background: "rgba(239,68,68,0.15)", padding: "2px 6px", borderRadius: 5 }}>NEEDS ATTENTION</span>}
                  {r.status === "high" && <span style={{ fontSize: 9, fontWeight: 800, color: "#22c55e", background: "rgba(34,197,94,0.12)", padding: "2px 6px", borderRadius: 5 }}>HIGH DEMAND</span>}
                </div>
              </div>
            ))}
          </Card>
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
                    <span key={p} style={{ fontSize: 9, fontWeight: 800, color: { Urgent: "#ef4444", Priority: "#eab308", Routine: "#22c55e" }[p], background: { Urgent: "#ef4444", Priority: "#eab308", Routine: "#22c55e" }[p] + "20", padding: "2px 8px", borderRadius: 5 }}>
                      {p.toUpperCase()}
                    </span>
                  ))}
                  {["open", "claimed", "completed"].map(s => esc.status === s && (
                    <span key={s} style={{ fontSize: 9, fontWeight: 800, color: { open: "#ef4444", claimed: "#eab308", completed: "#22c55e" }[s], background: { open: "#ef4444", claimed: "#eab308", completed: "#22c55e" }[s] + "18", padding: "2px 8px", borderRadius: 5 }}>
                      {s.toUpperCase()}
                    </span>
                  ))}
                </div>
                <span style={{ fontSize: 10, color: "#334155" }}>{esc.time}</span>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, marginBottom: esc.status === "open" ? 10 : 0 }}>{esc.note}</div>
              {esc.claimedBy && <div style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>Claimed by: <span style={{ color: "#94a3b8", fontWeight: 600 }}>{esc.claimedBy}</span></div>}
              {esc.status === "open" && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {pstRoster.filter(m => m.status !== "off").map(m => (
                    <div key={m.id} onClick={() => setEscalations(prev => prev.map(e => e.id === esc.id ? { ...e, status: "claimed", claimedBy: m.name } : e))}
                      style={{ padding: "7px 12px", borderRadius: 9, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 11, fontWeight: 700, color: "#64748b" }}>
                      Assign: {m.name.split(" ")[1] || m.name}
                    </div>
                  ))}
                  {isAdmin && (
                    <div onClick={() => setEscalations(prev => prev.map(e => e.id === esc.id ? { ...e, status: "claimed", claimedBy: "You (Admin)" } : e))}
                      style={{ padding: "7px 12px", borderRadius: 9, cursor: "pointer", background: "rgba(148,163,184,0.1)", border: "1px solid rgba(148,163,184,0.2)", fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>
                      Claim Myself
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "16px 0" }}/>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>Send an agency-wide operational message to all staff.</div>
          <textarea
            value={notifText}
            onChange={e => setNotifText(e.target.value)}
            placeholder='E.g., "Station coverage update at 1400"'
            rows={3} maxLength={200}
            style={{ background: "rgba(255,255,255,0.03)", border: "1.5px solid rgba(255,255,255,0.07)", borderRadius: 11, padding: "11px 13px", fontSize: 12, fontFamily: "'DM Sans',sans-serif", outline: "none", resize: "none", width: "100%", lineHeight: 1.6, color: "#cbd5e1", marginBottom: 6 }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: "#1e3a52" }}>{notifText.length}/200</div>
            <div style={{ display: "flex", gap: 6 }}>
              {["Info", "Important", "Urgent"].map(lv => (
                <div key={lv} onClick={() => setNotifPriority(lv)} style={{ padding: "5px 10px", borderRadius: 7, cursor: "pointer", fontSize: 10, fontWeight: 700, background: notifPriority === lv ? "rgba(100,116,139,0.15)" : "rgba(100,116,139,0.04)", border: `1px solid ${notifPriority === lv ? "rgba(100,116,139,0.3)" : "rgba(100,116,139,0.08)"}`, color: notifPriority === lv ? "#cbd5e1" : "#475569" }}>
                  {lv}
                </div>
              ))}
            </div>
          </div>
          <div
            onClick={() => {
              if (!notifText.trim()) return;
              setAgencyNotification({ message: notifText, priority: notifPriority, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) });
              setNotifText("");
              setShowConfirm("notification");
            }}
            style={{ padding: "12px", borderRadius: 11, cursor: notifText.trim() ? "pointer" : "not-allowed", textAlign: "center", fontSize: 13, fontWeight: 700, background: notifText.trim() ? "rgba(148,163,184,0.1)" : "rgba(255,255,255,0.02)", border: `1px solid ${notifText.trim() ? "rgba(148,163,184,0.2)" : "rgba(255,255,255,0.04)"}`, color: notifText.trim() ? "#94a3b8" : "#334155", opacity: notifText.trim() ? 1 : 0.5 }}
          >
            Send Broadcast
          </div>
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
          {pstRoster.map(m => (
            <div key={m.id} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor[m.status], flexShrink: 0 }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1" }}>{m.name}</div>
                <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>{m.role}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: statusColor[m.status] }}>{statusLabel[m.status]}</div>
                <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>{m.workload} follow-up{m.workload !== 1 ? "s" : ""}</div>
              </div>
              {(isAdmin || isSupervisor) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginLeft: 4 }}>
                  {["on", "phone", "off"].map(s => (
                    <div key={s} onClick={() => setPstRoster(prev => prev.map(p => p.id === m.id ? { ...p, status: s } : p))}
                      style={{ width: 7, height: 7, borderRadius: "50%", cursor: "pointer", background: m.status === s ? statusColor[s] : "rgba(255,255,255,0.06)", border: `1px solid ${m.status === s ? statusColor[s] : "rgba(255,255,255,0.08)"}` }}/>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isAdmin && (
            <div onClick={() => setAddMemberModal(true)} style={{ background: "rgba(255,255,255,0.02)", border: "1.5px dashed rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>+</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Add PST Member</div>
            </div>
          )}
        </div>
      )}

      {/* ── RESOURCES ── */}
      {tab === "resources" && isAdmin && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#475569", marginBottom: 8 }}>Resource Library</div>
          {resources.map(r => (
            <div key={r.id} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 14, padding: "13px 16px", display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1" }}>{r.title}</span>
                  <span style={{ fontSize: 9, fontWeight: 800, color: r.status === "pending" ? "#eab308" : "#22c55e", background: r.status === "pending" ? "rgba(234,179,8,0.12)" : "rgba(34,197,94,0.12)", padding: "2px 7px", borderRadius: 5, textTransform: "uppercase" }}>{r.status}</span>
                </div>
                <div style={{ fontSize: 11, color: "#334155" }}>{r.category} — {r.uploadedAt}</div>
              </div>
              {r.status === "pending" && <div onClick={() => setResources(prev => prev.map(x => x.id === r.id ? { ...x, status: "active" } : x))} style={{ padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", color: "#22c55e" }}>Approve</div>}
              <div onClick={() => setResources(prev => prev.filter(x => x.id !== r.id))} style={{ padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)", color: "#f87171" }}>Remove</div>
            </div>
          ))}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1.5px dashed rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>+</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Upload New Resource</div>
          </div>
        </div>
      )}

      {/* ── SETTINGS (Employee Roster) ── */}
      {tab === "settings" && isAdmin && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#475569", marginBottom: 12 }}>Employee Roster</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {["all", "active", "inactive"].map(f => (
              <div key={f} onClick={() => setRosterFilter(f)} style={{ flex: 1, padding: "9px 6px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: rosterFilter === f ? "rgba(56,189,248,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${rosterFilter === f ? "rgba(56,189,248,0.3)" : "rgba(255,255,255,0.07)"}`, fontSize: 11, fontWeight: rosterFilter === f ? 800 : 600, color: rosterFilter === f ? "#38bdf8" : "#64748b" }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                <span style={{ fontSize: 10, marginLeft: 4, color: rosterFilter === f ? "#38bdf8" : "#334155" }}>
                  ({f === "all" ? roster.length : roster.filter(e => e.status === f).length})
                </span>
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
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <div onClick={() => setRoster(prev => prev.map(r => r.id === e.id ? { ...r, status: e.status === "active" ? "inactive" : "active" } : r))}
                    style={{ padding: "6px 10px", borderRadius: 8, cursor: "pointer", fontSize: 11, fontWeight: 700, background: e.status === "active" ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)", border: `1px solid ${e.status === "active" ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`, color: e.status === "active" ? "#f87171" : "#22c55e" }}>
                    {e.status === "active" ? "Deactivate" : "Reactivate"}
                  </div>
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
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#475569", marginBottom: 10 }}>Import Roster</div>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1.5px dashed rgba(255,255,255,0.1)", borderRadius: 14, padding: "20px 16px", marginBottom: 10 }}>
            <div style={{ textAlign: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>📋</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#cbd5e1", marginBottom: 4 }}>Upload CSV or Excel</div>
              <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.6 }}>Two columns only: Name and Phone Number.</div>
            </div>
            <label style={{ display: "block" }}>
              <input type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={handleRosterFile}/>
              <div style={{ background: "rgba(56,189,248,0.1)", border: "1.5px solid rgba(56,189,248,0.3)", borderRadius: 11, padding: "12px", textAlign: "center", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "#38bdf8" }}>Choose File</div>
            </label>
          </div>
          {importError && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 10, fontSize: 12, color: "#f87171" }}>{importError}</div>}
          {importPreview && (
            <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 14, padding: "14px 16px", marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#22c55e", marginBottom: 8 }}>{importPreview.filename} — {importPreview.total} employees found</div>
              {importPreview.rows.map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < importPreview.rows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <span style={{ fontSize: 12, color: "#8099b0" }}>{r.name}</span>
                  <span style={{ fontSize: 11, color: "#475569" }}>{r.phone}</span>
                </div>
              ))}
              {importPreview.total > 5 && <div style={{ fontSize: 10, color: "#334155", marginTop: 6 }}>...and {importPreview.total - 5} more</div>}
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
        <PlatformInlineContent navigate={navigate} onGhostLogin={onGhostLogin || function () {}}/>
      )}

      {/* ── MODALS ── */}

      {/* Anonymous Report Modal */}
      {showAnonForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 }} onClick={() => setShowAnonForm(false)}>
          <div style={{ background: "#0c1929", border: "1.5px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "28px 22px", maxWidth: 420, width: "100%", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#cbd5e1", marginBottom: 6 }}>Submit Anonymous Report</div>
            <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.65, marginBottom: 20 }}>This report goes to the PST team only. Your identity is not attached.</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[{ k: "Routine", c: "#22c55e" }, { k: "Priority", c: "#eab308" }, { k: "Urgent", c: "#ef4444" }].map(u => (
                <div key={u.k} onClick={() => setAnonUrgency(u.k)} style={{ flex: 1, padding: "10px 6px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: anonUrgency === u.k ? u.c + "18" : "rgba(255,255,255,0.02)", border: `1.5px solid ${anonUrgency === u.k ? u.c : "rgba(255,255,255,0.055)"}` }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: u.c }}>{u.k}</div>
                </div>
              ))}
            </div>
            <textarea value={anonText} onChange={e => setAnonText(e.target.value)} placeholder="Describe your concern." rows={5} style={{ background: "rgba(255,255,255,0.03)", border: "1.5px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 14px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", resize: "none", width: "100%", lineHeight: 1.6, marginBottom: 16 }}/>
            <div style={{ display: "flex", gap: 10 }}>
              <div onClick={() => { setShowAnonForm(false); setAnonText(""); }} style={{ flex: 1, padding: "13px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 13, fontWeight: 700, color: "#475569" }}>Cancel</div>
              <div onClick={() => { setShowAnonForm(false); setAnonText(""); setShowConfirm("anon_submitted"); }} style={{ flex: 2, padding: "13px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(167,139,250,0.12)", border: "1.5px solid rgba(167,139,250,0.3)", fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>Submit Report</div>
            </div>
          </div>
        </div>
      )}

      {/* Add PST Member Modal */}
      {addMemberModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 }}>
          <div style={{ background: "#0c1929", border: "1.5px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "28px 22px", maxWidth: 380, width: "100%" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#cbd5e1", marginBottom: 16 }}>Add PST Member</div>
            <input value={newMemberName} onChange={e => setNewMemberName(e.target.value)} placeholder="Full name" style={{ background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", borderRadius: 11, padding: "11px 13px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", width: "100%", marginBottom: 14, color: "#dde8f4" }}/>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {["PST Lead", "PST Member"].map(r => (
                <div key={r} onClick={() => setNewMemberRole(r)} style={{ flex: 1, padding: "10px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: newMemberRole === r ? "rgba(148,163,184,0.12)" : "rgba(255,255,255,0.02)", border: `1.5px solid ${newMemberRole === r ? "rgba(148,163,184,0.3)" : "rgba(255,255,255,0.06)"}`, fontSize: 12, fontWeight: 700, color: newMemberRole === r ? "#94a3b8" : "#475569" }}>{r}</div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div onClick={() => { setAddMemberModal(false); setNewMemberName(""); }} style={{ flex: 1, padding: "12px", borderRadius: 11, cursor: "pointer", textAlign: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 13, fontWeight: 700, color: "#475569" }}>Cancel</div>
              <div onClick={() => { if (!newMemberName.trim()) return; setPstRoster(prev => [...prev, { id: "p" + Date.now(), name: newMemberName.trim(), role: newMemberRole, status: "on", workload: 0 }]); setAddMemberModal(false); setNewMemberName(""); setShowConfirm("member_added"); }} style={{ flex: 2, padding: "12px", borderRadius: 11, cursor: "pointer", textAlign: "center", background: "rgba(148,163,184,0.12)", border: "1.5px solid rgba(148,163,184,0.3)", fontSize: 13, fontWeight: 700, color: "#94a3b8" }}>Add Member</div>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
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

      {/* Confirm Toast */}
      {showConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 }}>
          <div style={{ background: "#0c1929", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: "28px 24px", maxWidth: 320, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>
              {showConfirm === "pst" ? "✓" : showConfirm === "critical" ? "⚡" : showConfirm === "notification" ? "📢" : showConfirm === "anon_submitted" ? "🔒" : showConfirm === "member_added" ? "👥" : "✓"}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#cbd5e1", marginBottom: 8 }}>
              {showConfirm === "pst" ? "PST Banner Activated" : showConfirm === "critical" ? "Critical Mode Activated" : showConfirm === "notification" ? "Broadcast Sent" : showConfirm === "anon_submitted" ? "Report Submitted" : showConfirm === "member_added" ? "Member Added" : showConfirm === "roster_imported" ? "Roster Imported" : "Saved"}
            </div>
            <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6, marginBottom: 22 }}>
              {showConfirm === "anon_submitted" ? "Your anonymous report has been submitted to the PST team." : showConfirm === "roster_imported" ? "Employee roster has been updated." : "Action completed successfully."}
            </div>
            <div onClick={() => setShowConfirm(null)} style={{ padding: "12px", borderRadius: 11, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 13, fontWeight: 700, color: "#64748b" }}>Done</div>
          </div>
        </div>
      )}

    </ScreenSingle>
  );
} 
