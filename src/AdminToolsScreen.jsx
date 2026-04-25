// ============================================================
// SCREEN: AdminToolsScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect } from 'react';
import { ScreenSingle, Card, SLabel } from './ui.jsx';
import { useLayoutConfig } from './utils.js';
import { databases, account } from './appwrite.js';
import { Query } from 'appwrite';
import PlatformInlineContent from './PlatformInlineContent';

// ── SheetJS loader ────────────────────────────────────────────────────────
function loadSheetJS() {
  return new Promise((resolve) => {
    if (window.XLSX) { resolve(window.XLSX); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = () => resolve(window.XLSX);
    document.head.appendChild(s);
  });
}

// ── Parse rows from 2D array ──────────────────────────────────────────────
function parseRosterRows(rows) {
  if (!rows || rows.length < 2) return null;
  const headers  = rows[0].map(h => String(h || '').trim().toLowerCase());
  const nameIdx  = headers.findIndex(h => h.includes("name"));
  const phoneIdx = headers.findIndex(h => h.includes("phone") || h.includes("number") || h.includes("tel") || h.includes("mobile"));
  if (nameIdx === -1 || phoneIdx === -1) return null;
  return rows.slice(1).map((row, i) => ({
    id:     "imp" + Date.now() + i,
    name:   String(row[nameIdx]  || '').trim(),
    phone:  String(row[phoneIdx] || '').trim(),
    status: "active",
    joined: new Date().toISOString().slice(0, 10),
  })).filter(r => r.name && r.phone);
}

// Custom dark dropdown
function DarkSelect({ value, onChange, options, small = false }) {
  const [open, setOpen] = React.useState(false);
  const current = options.find(o => o.value === value) || options[0];
  return (
    <div style={{ position: "relative" }}>
      <div onClick={() => setOpen(!open)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: small ? "4px 8px" : "8px 10px", color: "#dde8f4", fontSize: small ? 11 : 12, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, userSelect: "none", minWidth: small ? 80 : 100 }}>
        <span>{current ? current.label : value}</span>
        <span style={{ fontSize: 9, color: "#64748b" }}>▾</span>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#0c1929", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, zIndex: 200, overflow: "hidden", marginTop: 4, minWidth: 100 }}>
          {options.map(o => (
            <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); }} style={{ padding: small ? "8px 10px" : "10px 12px", cursor: "pointer", fontSize: small ? 11 : 12, color: o.value === value ? "#38bdf8" : "#dde8f4", background: o.value === value ? "rgba(56,189,248,0.08)" : "transparent", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
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
      databases.listDocuments(AW_DB, 'checkins',    [Query.equal('agencyCode', agencyCode), Query.greaterThan('$createdAt', sinceStr), Query.limit(5000)]),
      databases.listDocuments(AW_DB, 'tool_usage',  [Query.equal('agencyCode', agencyCode), Query.greaterThan('$createdAt', sinceStr), Query.limit(5000)]),
      databases.listDocuments(AW_DB, 'ai_sessions', [Query.equal('agencyCode', agencyCode), Query.greaterThan('$createdAt', sinceStr), Query.limit(5000)]),
      databases.listDocuments(AW_DB, 'pst_contacts',[Query.equal('agencyCode', agencyCode), Query.greaterThan('$createdAt', sinceStr), Query.limit(5000)]),
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
    (r2.documents || []).forEach(t => { toolCounts[t.tool] = (toolCounts[t.tool] || 0) + 1; });
    const total = r1.total || 0;
    return {
      totalCheckins: total, statusCounts, byDay, toolCounts,
      totalToolUsage: r2.total || 0, aiSessionCount: r3.total || 0, pstContactCount: r4.total || 0,
      wellnessScore: total > 0 ? Math.round((statusCounts.great * 100 + statusCounts.striving * 67 + statusCounts.notwell * 33) / total) : null,
    };
  } catch (e) { return null; }
}

// ── Excel to CSV Converter ───────────────────────────────────
function ExcelToCSV() {
  const [file, setFile] = React.useState(null);
  const [converting, setConverting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState("");
  const fileRef = React.useRef(null);

  const loadSheetJS = () => new Promise((resolve) => {
    if (window.XLSX) { resolve(window.XLSX); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = () => resolve(window.XLSX);
    document.head.appendChild(s);
  });

  const convert = async () => {
    if (!file) return;
    setConverting(true);
    setError("");
    setDone(false);
    try {
      const XLSX = await loadSheetJS();
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      // Convert all sheets
      wb.SheetNames.forEach(sheetName => {
        const ws = wb.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const safeName = sheetName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `${file.name.replace(/\.[^.]+$/, '')}_${safeName}.csv`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      });
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } catch(e) {
      setError("Could not convert file: " + e.message);
    }
    setConverting(false);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
      <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display:"none" }} onChange={e => { setFile(e.target.files?.[0] || null); setDone(false); setError(""); }}/>
      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
        <div onClick={() => fileRef.current?.click()} style={{ flex:1, padding:"10px 14px", borderRadius:10, cursor:"pointer", background:"rgba(56,189,248,0.08)", border:"1px solid rgba(56,189,248,0.2)", fontSize:12, fontWeight:700, color:"#38bdf8", textAlign:"center" }}>
          {file ? `✓ ${file.name}` : "Choose Excel File (.xlsx, .xls)"}
        </div>
        {file && (
          <div onClick={converting ? null : convert} style={{ padding:"10px 14px", borderRadius:10, cursor:converting?"not-allowed":"pointer", background:done?"rgba(34,197,94,0.1)":converting?"rgba(255,255,255,0.03)":"rgba(34,197,94,0.1)", border:`1px solid ${done?"rgba(34,197,94,0.3)":converting?"rgba(255,255,255,0.07)":"rgba(34,197,94,0.3)"}`, fontSize:12, fontWeight:700, color:done?"#22c55e":converting?"#334155":"#22c55e", whiteSpace:"nowrap" }}>
            {done ? "✓ Downloaded" : converting ? "Converting..." : "Convert & Download"}
          </div>
        )}
      </div>
      {error && <div style={{ fontSize:11, color:"#f87171", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.15)", borderRadius:8, padding:"8px 12px" }}>{error}</div>}
      <div style={{ fontSize:11, color:"#475569", lineHeight:1.6 }}>
        Each sheet downloads as a separate CSV. No data leaves your device.
      </div>
    </div>
  );
}

// ── Unclaimed Cases Alert ─────────────────────────────────────
function UnclaimedCasesAlert({ agencyCode, navigate }) {
  const [unclaimed, setUnclaimed] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [lastRefresh, setLastRefresh] = React.useState(null);

  const load = async () => {
    try {
      const { databases: db } = await import('./appwrite.js');
      const { Query: Q } = await import('appwrite');
      const AW_DB = import.meta.env.VITE_APPWRITE_DATABASE || '69c88588001ed071c19e';
      const queries = [Q.equal('status', 'open'), Q.orderDesc('createdAt'), Q.limit(50)];
      if (agencyCode) queries.push(Q.equal('agencyCode', agencyCode));
      const res = await db.listDocuments(AW_DB, 'pst_cases', queries);
      setUnclaimed(res.documents || []);
      setLastRefresh(new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }));
    } catch(e) { setUnclaimed([]); }
    setLoading(false);
  };

  React.useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [agencyCode]);

  const URGENCY_COLOR = { red:"#ef4444", orange:"#f97316", yellow:"#eab308", green:"#22c55e" };
  const redOrange = unclaimed.filter(c => c.urgency === 'red' || c.urgency === 'orange');
  const others = unclaimed.filter(c => c.urgency !== 'red' && c.urgency !== 'orange');

  if (loading) return null;

  return (
    <div style={{ marginBottom:14 }}>
      {/* Alert banner if red/orange unclaimed */}
      {redOrange.length > 0 && (
        <div style={{ background:"rgba(239,68,68,0.1)", border:"2px solid rgba(239,68,68,0.4)", borderRadius:14, padding:"12px 16px", marginBottom:10, display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ fontSize:22, flexShrink:0 }}>🚨</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:900, color:"#ef4444" }}>
              {redOrange.length} HIGH PRIORITY case{redOrange.length > 1 ? 's' : ''} unclaimed
            </div>
            <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>
              {redOrange.filter(c=>c.urgency==='red').length} Red · {redOrange.filter(c=>c.urgency==='orange').length} Orange · No PST member has responded yet
            </div>
          </div>
          <div onClick={() => navigate("pstdispatch")} style={{ padding:"8px 12px", borderRadius:9, cursor:"pointer", background:"rgba(239,68,68,0.15)", border:"1.5px solid rgba(239,68,68,0.4)", fontSize:11, fontWeight:800, color:"#ef4444", flexShrink:0 }}>
            View →
          </div>
        </div>
      )}

      {/* Summary of all unclaimed */}
      <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:14, padding:"12px 16px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#dde8f4" }}>
            Unclaimed Requests {unclaimed.length > 0 && <span style={{ background:"rgba(239,68,68,0.15)", color:"#ef4444", borderRadius:6, padding:"1px 7px", fontSize:11 }}>{unclaimed.length}</span>}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            {lastRefresh && <div style={{ fontSize:10, color:"#334155" }}>Updated {lastRefresh}</div>}
            <div onClick={load} style={{ fontSize:12, color:"#38bdf8", cursor:"pointer" }}>↻</div>
          </div>
        </div>

        {unclaimed.length === 0 ? (
          <div style={{ fontSize:12, color:"#22c55e", textAlign:"center", padding:"8px 0" }}>
            ✓ All requests have been claimed
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {/* Urgency breakdown */}
            <div style={{ display:"flex", gap:8, marginBottom:6 }}>
              {['red','orange','yellow','green'].map(u => {
                const count = unclaimed.filter(c => c.urgency === u).length;
                if (count === 0) return null;
                return (
                  <div key={u} style={{ background:URGENCY_COLOR[u]+"15", border:`1px solid ${URGENCY_COLOR[u]}30`, borderRadius:8, padding:"4px 10px", fontSize:11, fontWeight:700, color:URGENCY_COLOR[u] }}>
                    {count} {u.toUpperCase()}
                  </div>
                );
              })}
            </div>

            {/* First 3 unclaimed cases */}
            {unclaimed.slice(0, 3).map((c, i) => (
              <div key={c.$id} onClick={() => navigate("pstdispatch")} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:10, cursor:"pointer", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:URGENCY_COLOR[c.urgency]||"#64748b", flexShrink:0 }}/>
                <div style={{ flex:1, fontSize:12, color:"#94a3b8" }}>{c.caseNumber}</div>
                <div style={{ fontSize:10, color:"#475569" }}>
                  {(() => { const d = Date.now()-new Date(c.createdAt).getTime(); const m=Math.floor(d/60000); const h=Math.floor(m/60); return h>0?`${h}h ago`:`${m}m ago`; })()}
                </div>
              </div>
            ))}

            {unclaimed.length > 3 && (
              <div onClick={() => navigate("pstdispatch")} style={{ textAlign:"center", fontSize:11, color:"#38bdf8", cursor:"pointer", padding:"6px 0", textDecoration:"underline" }}>
                +{unclaimed.length - 3} more — View all in dispatch board
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminToolsScreen({
  navigate, logoSrc, membership, onSwitchAgency,
  pstAlert, setPstAlert, pstAlertMsg, setPstAlertMsg,
  criticalIncident, setCriticalIncident, setAgencyNotification,
  isPlatform = false, onGhostLogin,
}) {
  const [tab, setTab]                   = useState("overview");
  const [liveStats, setLiveStats]       = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError]     = useState(false);
  const [statsDays, setStatsDays]       = useState(30);
  const [showAnonForm, setShowAnonForm] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(null);
  const [notifText, setNotifText]       = useState("");
  const [notifPriority, setNotifPriority] = useState("Info");
  const [anonText, setAnonText]         = useState("");
  const [addMemberModal, setAddMemberModal]     = useState(false);
  const [newMemberName, setNewMemberName]       = useState("");
  const [newMemberRole, setNewMemberRole]       = useState("PST");
  const [addEmployeeModal, setAddEmployeeModal] = useState(false);
  const [newEmpName, setNewEmpName]     = useState("");
  const [newEmpPhone, setNewEmpPhone]   = useState("");
  const [rosterFilter, setRosterFilter] = useState("all");
  const [importPreview, setImportPreview] = useState(null);
  const [importError, setImportError]     = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  // ── Agency edit state ──────────────────────────────────────────────
  const [agencyEdit, setAgencyEdit] = useState({
    name: "", code: "", region: "", type: "", adminName: "", adminEmail: "", logoUrl: "", showLogo: false
  });
  const [agencyEditLoaded, setAgencyEditLoaded] = useState(false);
  const [agencyEditSaved, setAgencyEditSaved] = useState(false);
  const [agencyEditLoading, setAgencyEditLoading] = useState(false);

  // ── PST Members state ───────────────────────────────────────────────
  const [pstMembers, setPstMembers]     = useState([]);
  const [unclaimedCount, setUnclaimedCount] = useState(0);
  const [unclaimedRed, setUnclaimedRed]     = useState(0);
  const [pstLoading, setPstLoading]     = useState(false);
  const [pstSaved, setPstSaved]         = useState(false);
  const [editingMember, setEditingMember] = useState(null); // null or member object
  const [newMember, setNewMember]       = useState({ name:"", role:"PST", unit:"", phone:"", email:"", status:"green", note:"" });
  const [showAddMember, setShowAddMember] = useState(false);

  const memberRoles = ["PST", "Chaplain", "Therapist", "Admin", "Supervisor"];
  const memberStatuses = [
    { key:"green",  label:"Available",  color:"#22c55e" },
    { key:"yellow", label:"Limited",    color:"#eab308" },
    { key:"red",    label:"Off Duty",   color:"#ef4444" },
  ];

  const loadAgencyEdit = async () => {
    if (!agencyKey || agencyEditLoaded) return;
    setAgencyEditLoading(true);
    try {
      const doc = await databases.getDocument(AW_DB, 'agencies', agencyKey);
      setAgencyEdit({
        name:       doc.name       || "",
        code:       doc.code       || "",
        region:     doc.region     || "",
        type:       doc.type       || "",
        adminName:  doc.adminName  || "",
        adminEmail: doc.adminEmail || "",
        logoUrl:    doc.logoUrl    || "",
        showLogo:   doc.showLogo   || false,
      });
      setAgencyEditLoaded(true);
    } catch(e) {}
    setAgencyEditLoading(false);
  };

  const saveAgencyEdit = async () => {
    if (!agencyKey) return;
    setAgencyEditLoading(true);
    try {
      await databases.updateDocument(AW_DB, 'agencies', agencyKey, {
        name:       agencyEdit.name,
        region:     agencyEdit.region,
        type:       agencyEdit.type,
        adminName:  agencyEdit.adminName,
        adminEmail: agencyEdit.adminEmail,
        logoUrl:    agencyEdit.logoUrl || null,
        showLogo:   agencyEdit.showLogo,
      });
      setAgencyEditSaved(true);
      setTimeout(() => setAgencyEditSaved(false), 2000);
    } catch(e) {}
    setAgencyEditLoading(false);
  };

  const loadUnclaimedCases = async () => {
    if (!agencyKey) return;
    try {
      const { Query: Q } = await import('appwrite');
      const res = await databases.listDocuments(AW_DB, 'pst_cases', [
        Q.equal('agencyCode', agencyKey),
        Q.equal('status', 'open'),
        Q.limit(100),
      ]);
      const docs = res.documents || [];
      setUnclaimedCount(docs.length);
      setUnclaimedRed(docs.filter(d => d.urgency === 'red' || d.urgency === 'orange').length);
    } catch(e) { setUnclaimedCount(0); setUnclaimedRed(0); }
  };

  const loadPstMembers = async () => {
    if (!agencyKey || pstLoading) return;
    setPstLoading(true);
    try {
      const { Query } = await import('appwrite');
      const res = await databases.listDocuments(AW_DB, 'pst_members', [
        Query.equal('agencyCode', agencyEdit.code || agencyKey),
        Query.limit(50),
      ]);
      setPstMembers(res.documents || []);
    } catch(e) { setPstMembers([]); }
    setPstLoading(false);
  };

  const savePstMember = async (member) => {
    try {
      const { ID } = await import('appwrite');
      const data = {
        agencyCode: agencyEdit.code || agencyKey,
        name:   member.name,
        role:   member.role,
        unit:   member.unit   || "",
        phone:  member.phone  || "",
        email:  member.email  || "",
        status: member.status || "green",
        note:   member.note   || "",
      };
      if (member.$id) {
        await databases.updateDocument(AW_DB, 'pst_members', member.$id, data);
      } else {
        await databases.createDocument(AW_DB, 'pst_members', ID.unique(), data);
      }
      await loadPstMembers();
      setEditingMember(null);
      setShowAddMember(false);
      setNewMember({ name:"", role:"PST", unit:"", phone:"", email:"", status:"green", note:"" });
      setPstSaved(true);
      setTimeout(() => setPstSaved(false), 2000);
    } catch(e) {}
  };

  const deletePstMember = async (id) => {
    try {
      await databases.deleteDocument(AW_DB, 'pst_members', id);
      setPstMembers(prev => prev.filter(m => m.$id !== id));
    } catch(e) {}
  };

  const brandingLogoUrl_state = agencyEdit.logoUrl;

  const [retentionDays, setRetentionDays] = useState(() => {
    try { return parseInt(localStorage.getItem("upstream_pst_retention") || "90"); } catch(e) { return 90; }
  });
  const [retentionSaved, setRetentionSaved] = useState(false);

  const saveRetention = async (days) => {
    try {
      localStorage.setItem("upstream_pst_retention", String(days));
      if (agencyKey) {
        const { databases: db } = await import('./appwrite.js');
        const AW_DB = import.meta.env.VITE_APPWRITE_DATABASE || '69c88588001ed071c19e';
        await db.updateDocument(AW_DB, 'agencies', agencyKey, { pstRetentionDays: days }).catch(()=>{});
      }
      setRetentionSaved(true);
      setTimeout(() => setRetentionSaved(false), 2000);
    } catch(e) {}
  };

  const [humanPSTEnabled, setHumanPSTEnabled] = useState(() => {
    try { return localStorage.getItem("upstream_human_pst_active") !== "false"; } catch(e) { return true; }
  });
  const [humanPSTSaved, setHumanPSTSaved] = useState(false);

  const saveHumanPST = async (val) => {
    try {
      localStorage.setItem("upstream_human_pst_active", String(val));
      if (agencyKey) {
        const { databases: db } = await import('./appwrite.js');
        const AW_DB = import.meta.env.VITE_APPWRITE_DATABASE || '69c88588001ed071c19e';
        await db.updateDocument(AW_DB, 'agencies', agencyKey, { humanPSTActive: val }).catch(()=>{});
      }
      setHumanPSTSaved(true);
      setTimeout(() => setHumanPSTSaved(false), 2000);
    } catch(e) {}
  };

  const [crewStreamEnabled, setCrewStreamEnabled] = useState(() => {
    try { return localStorage.getItem("upstream_crew_stream") === "true"; } catch(e) { return false; }
  });
  const [crewStreamSaved, setCrewStreamSaved] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvConverted, setCsvConverted] = useState(false);
  const [csvConverting, setCsvConverting] = useState(false);

  const saveCrewStream = async (val) => {
    try {
      localStorage.setItem("upstream_crew_stream", String(val));
      if (agencyKey) {
        await databases.updateDocument(AW_DB, 'agencies', agencyKey, { crewStream: val }).catch(()=>{});
      }
      setCrewStreamSaved(true);
      setTimeout(() => setCrewStreamSaved(false), 2000);
    } catch(e) {}
  };

  const [brandingLogoUrl, setBrandingLogoUrl] = useState(() => {
    try { return localStorage.getItem("upstream_agency_logo_url") || ""; } catch(e) { return ""; }
  });
  const [brandingShowLogo, setBrandingShowLogo] = useState(() => {
    try { return localStorage.getItem("upstream_agency_show_logo") === "true"; } catch(e) { return false; }
  });
  const [brandingSaved, setBrandingSaved] = useState(false);

  const saveBranding = async () => {
    try {
      localStorage.setItem("upstream_agency_logo_url", brandingLogoUrl);
      localStorage.setItem("upstream_agency_show_logo", String(brandingShowLogo));
      // Save to Appwrite agencies collection if we have an agency key
      if (agencyKey) {
        await databases.updateDocument(AW_DB, 'agencies', agencyKey, {
          logoUrl: brandingShowLogo ? brandingLogoUrl : null,
          showLogo: brandingShowLogo,
        }).catch(() => {});
      }
      setBrandingSaved(true);
      setTimeout(() => setBrandingSaved(false), 2000);
    } catch(e) {}
  };
  const [roleUserId, setRoleUserId]     = useState("");
  const [roleType, setRoleType]         = useState("pst");
  const [agencyRoleRows, setAgencyRoleRows]   = useState([]);
  const [agencyResetRows, setAgencyResetRows] = useState([]);
  const [roleStatus, setRoleStatus]     = useState("");
  const [pstRoster, setPstRoster]       = useState([]);
  const [escalations, setEscalations]   = useState([]);
  const [resources, setResources]       = useState([]);
  const [roster, setRoster]             = useState([]);

  const lc           = useLayoutConfig();
  const isWide       = lc.isDesktop;
  const agencyKey    = membership ? membership.agencyCode : null;
  const isAdmin      = (membership && membership.role === "admin") || isPlatform;
  const isSupervisor = membership && membership.role === "supervisor";
  const agencyName   = membership ? membership.agencyName : "Agency";
  const openCount    = escalations.filter(e => e.status === "open").length;
  const roleKey      = membership ? membership.role : "admin";
  const roleColor    = ROLE_COLORS[roleKey] || "#94a3b8";
  const roleLabel    = ROLE_LABELS[roleKey] || "Admin";
  const agencyShort  = membership ? membership.agencyShort : "--";

  useEffect(() => { if (isPlatform) setTab("platform"); }, [isPlatform]);

  useEffect(() => {
    if (!agencyKey) return;
    setStatsLoading(true); setStatsError(false);
    fetchAgencyStats(agencyKey, statsDays).then(data => {
      setStatsLoading(false);
      if (data) setLiveStats(data); else setStatsError(true);
    }).catch(() => { setStatsLoading(false); setStatsError(true); });
  }, [agencyKey, statsDays]);

  useEffect(() => {
    if (tab === 'pst' && agencyKey) { loadAgencyRoles(); loadAgencyResets(); loadPSTRoster(); loadUnclaimedCases(); }
  }, [tab, agencyKey]);

  const loadPSTRoster = async () => {
    if (!agencyKey) return;
    try {
      const res = await databases.listDocuments(AW_DB, 'pst_roster', [Query.equal('agencyCode', agencyKey), Query.limit(100)]);
      if (res.documents && res.documents.length > 0)
        setPstRoster(res.documents.map(d => ({ id: d.$id, name: d.name, role: d.role || 'PST Member', status: d.status || 'off', workload: d.workload || 0 })));
    } catch (e) {}
  };

  const loadAgencyRoles = async () => {
    if (!agencyKey) return;
    try {
      const res = await databases.listDocuments(AW_DB, 'user_permissions', [Query.equal('agencyCode', agencyKey), Query.limit(200)]);
      setAgencyRoleRows(res.documents || []);
    } catch (e) { setAgencyRoleRows([]); }
  };

  const assignAgencyRole = async () => {
    if (!roleUserId.trim()) return;
    try {
      const { ID } = await import('appwrite');
      await databases.createDocument(AW_DB, 'user_permissions', ID.unique(), { agencyCode: agencyKey, userId: roleUserId.trim(), role: roleType });
      setRoleUserId(''); setRoleStatus('Role assigned ✓'); loadAgencyRoles();
    } catch (e) { setRoleStatus('Error: ' + e.message); }
  };

  const updateAgencyRole = async (docId, role) => {
    try { await databases.updateDocument(AW_DB, 'user_permissions', docId, { role }); setRoleStatus('Role updated ✓'); loadAgencyRoles(); }
    catch (e) { setRoleStatus('Error: ' + e.message); }
  };

  const revokeAgencyRole = async (docId) => {
    try { await databases.deleteDocument(AW_DB, 'user_permissions', docId); setRoleStatus('Role revoked ✓'); loadAgencyRoles(); }
    catch (e) { setRoleStatus('Error: ' + e.message); }
  };

  const loadAgencyResets = async () => {
    if (!agencyKey) return;
    try {
      const res = await databases.listDocuments(AW_DB, 'password_reset_requests', [Query.equal('agencyCode', agencyKey), Query.equal('status', 'open'), Query.limit(100)]);
      setAgencyResetRows(res.documents || []);
    } catch (e) { setAgencyResetRows([]); }
  };

  const resolveAgencyReset = async (docId) => {
    try { await databases.updateDocument(AW_DB, 'password_reset_requests', docId, { status: 'resolved', resolvedAt: new Date().toISOString() }); setRoleStatus('Reset resolved ✓'); loadAgencyResets(); }
    catch (e) { setRoleStatus('Error: ' + e.message); }
  };

  // ── Roster file handler — Excel + CSV ─────────────────────────────────
  const handleRosterFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    setImportError(null);
    setImportPreview(null);
    setImportLoading(true);

    const ext     = file.name.split('.').pop().toLowerCase();
    const isExcel = ext === 'xlsx' || ext === 'xls';

    try {
      let rows = [];
      if (isExcel) {
        const XLSX  = await loadSheetJS();
        const buffer = await file.arrayBuffer();
        const wb    = XLSX.read(buffer, { type: 'array' });
        const ws    = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      } else {
        const text = await file.text();
        rows = text.split('\n').filter(l => l.trim()).map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
      }

      const parsed = parseRosterRows(rows);
      if (!parsed) {
        setImportError('Could not find Name and Phone columns. Make sure your file has column headers named "Name" and "Phone".');
        setImportLoading(false);
        return;
      }
      if (parsed.length === 0) {
        setImportError('No valid rows found. Make sure data rows have both a name and a phone number.');
        setImportLoading(false);
        return;
      }
      setImportPreview({ rows: parsed.slice(0, 5), total: parsed.length, allRows: parsed, filename: file.name, type: isExcel ? 'Excel' : 'CSV' });
    } catch (err) {
      setImportError('Could not read file: ' + err.message);
    }
    setImportLoading(false);
  };

  const adminTabs = isPlatform
    ? ["overview", "wellness", "metrics", "escalations", "pst", "resources", "settings", "platform"]
    : ["overview", "wellness", "metrics", "escalations", "pst", "resources", "settings"];

  const buildTrendData = () => {
    if (!liveStats || !liveStats.byDay) return null;
    const days = Object.entries(liveStats.byDay).sort(([a],[b]) => a.localeCompare(b)).slice(-7);
    if (days.length < 2) return null;
    return days.map(([date, count]) => ({ day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }), count }));
  };
  const trendData = buildTrendData();
  const handleBack = () => navigate("home");

  return (
    <ScreenSingle wide={true} headerProps={{ onBack: handleBack, logoSrc, agencyName }}>

      {/* Role badge */}
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
              {{ overview:"Overview", wellness:"Wellness", metrics:"Metrics", escalations:"Escalations", pst:"PST Team", resources:"Resources", settings:"Settings", platform:"Platform" }[tk]}
              {tk === "escalations" && openCount > 0 && <span style={{ fontSize: 9, fontWeight: 800, color: "#ef4444", background: "rgba(239,68,68,0.2)", padding: "1px 5px", borderRadius: 5 }}>{openCount}</span>}
              {tk === "pst" && unclaimedCount > 0 && <span style={{ fontSize: 9, fontWeight: 800, color: unclaimedRed > 0 ? "#ef4444" : "#f97316", background: unclaimedRed > 0 ? "rgba(239,68,68,0.2)" : "rgba(249,115,22,0.2)", padding: "1px 5px", borderRadius: 5 }}>{unclaimedCount}</span>}
            </div>
          );
        })}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#475569" }}>Agency Overview</div>
            <div style={{ display: "flex", gap: 6 }}>
              {[7,30,90].map(d => <div key={d} onClick={() => setStatsDays(d)} style={{ padding: "4px 10px", borderRadius: 7, cursor: "pointer", fontSize: 10, fontWeight: 700, background: statsDays===d?"rgba(56,189,248,0.15)":"rgba(255,255,255,0.03)", border:`1px solid ${statsDays===d?"rgba(56,189,248,0.35)":"rgba(255,255,255,0.07)"}`, color: statsDays===d?"#38bdf8":"#475569" }}>{d}d</div>)}
            </div>
          </div>
          {statsLoading && <div style={{ textAlign:"center", padding:"20px", fontSize:12, color:"#334155" }}>Loading live data...</div>}
          {statsError && <div style={{ background:"rgba(234,179,8,0.07)", border:"1px solid rgba(234,179,8,0.18)", borderRadius:10, padding:"10px 14px", fontSize:12, color:"#eab308", marginBottom:12 }}>Could not load live data — check Appwrite permissions.</div>}
          {!agencyKey && <div style={{ background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.18)", borderRadius:10, padding:"10px 14px", fontSize:12, color:"#f87171", marginBottom:12 }}>No agency connected.</div>}

          {/* Desktop: 2 column layout — stats left, actions right */}
          <div style={{ display:"grid", gridTemplateColumns: isWide ? "1fr 1fr" : "1fr", gap: isWide ? 20 : 0 }}>

            {/* LEFT COLUMN — stats */}
            <div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
            {[
              { label:"Check-Ins",       value: liveStats?liveStats.totalCheckins:"--",  sub:`${statsDays}d`, color:"#38bdf8" },
              { label:"Wellness Score",  value: liveStats?.wellnessScore!=null?liveStats.wellnessScore+"%":"--", sub:"aggregate", color: liveStats?.wellnessScore>=70?"#22c55e":liveStats?.wellnessScore>=40?"#eab308":"#ef4444" },
              { label:"AI PST Sessions", value: liveStats?liveStats.aiSessionCount:"--",  sub:`${statsDays}d`, color:"#a78bfa" },
              { label:"Tool Usage",      value: liveStats?liveStats.totalToolUsage:"--",  sub:`${statsDays}d`, color:"#22c55e" },
            ].map((s,i) => (
              <div key={i} style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.055)", borderRadius:14, padding:"16px 14px", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:s.color, opacity:0.5 }}/>
                <div style={{ fontSize:26, fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", marginTop:2 }}>{s.label}</div>
                <div style={{ fontSize:10, color:"#334155" }}>{s.sub}</div>
              </div>
            ))}
          </div>
          {liveStats && liveStats.totalCheckins > 0 && (
            <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.055)", borderRadius:14, padding:"14px", marginBottom:12 }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#475569", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10 }}>Wellness Breakdown</div>
              {[{label:"Great",count:liveStats.statusCounts.great,color:"#22c55e"},{label:"Striving",count:liveStats.statusCounts.striving,color:"#eab308"},{label:"Not Well",count:liveStats.statusCounts.notwell,color:"#f97316"},{label:"Ill",count:liveStats.statusCounts.ill,color:"#ef4444"}].map((s,i) => {
                const pct = liveStats.totalCheckins>0?Math.round((s.count/liveStats.totalCheckins)*100):0;
                return <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}><div style={{ width:64, fontSize:11, color:"#64748b" }}>{s.label}</div><div style={{ flex:1, height:8, borderRadius:4, background:"rgba(255,255,255,0.04)", overflow:"hidden" }}><div style={{ height:"100%", width:pct+"%", background:s.color, borderRadius:4 }}/></div><div style={{ width:40, fontSize:11, color:s.color, fontWeight:700, textAlign:"right" }}>{s.count}</div></div>;
              })}
            </div>
          )}
            </div> {/* end left column */}

            {/* RIGHT COLUMN — quick actions */}
            <div>
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:"0.16em", textTransform:"uppercase", color:"#334155", marginBottom:8 }}>Quick Actions</div>
          <div style={{ background:pstAlert?"rgba(139,92,246,0.08)":"rgba(255,255,255,0.02)", border:`1px solid ${pstAlert?"rgba(139,92,246,0.2)":"rgba(255,255,255,0.055)"}`, borderRadius:14, marginBottom:10, overflow:"hidden" }}>
            <div style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px" }}>
              <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:700, color:pstAlert?"#c4b5fd":"#94a3b8" }}>PST Availability Banner</div><div style={{ fontSize:11, color:"#334155", marginTop:2 }}>{pstAlert?"Active":"Not active"}</div></div>
              <div onClick={() => { setPstAlert(!pstAlert); if(!pstAlert)setShowConfirm("pst"); }} style={{ padding:"8px 14px", borderRadius:10, cursor:"pointer", background:pstAlert?"rgba(100,116,139,0.1)":"rgba(139,92,246,0.12)", border:`1px solid ${pstAlert?"rgba(100,116,139,0.2)":"rgba(139,92,246,0.3)"}`, fontSize:12, fontWeight:700, color:pstAlert?"#64748b":"#a78bfa", flexShrink:0 }}>{pstAlert?"Deactivate":"Activate"}</div>
            </div>
            <div style={{ padding:"0 14px 14px" }}><textarea value={pstAlertMsg} onChange={e=>setPstAlertMsg(e.target.value)} placeholder="Optional message to staff" rows={2} maxLength={120} style={{ background:"rgba(255,255,255,0.04)", border:"1.5px solid rgba(139,92,246,0.2)", borderRadius:10, padding:"10px 12px", fontSize:12, fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"none", width:"100%", lineHeight:1.5, color:"#cbd5e1" }}/><div style={{ fontSize:10, color:"#334155", marginTop:4, textAlign:"right" }}>{pstAlertMsg.length}/120</div></div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", background:criticalIncident?"rgba(30,30,46,0.7)":"rgba(255,255,255,0.02)", border:`1px solid ${criticalIncident?"rgba(148,163,184,0.2)":"rgba(255,255,255,0.055)"}`, borderRadius:14, marginBottom:10 }}>
            <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:700, color:criticalIncident?"#f1f5f9":"#94a3b8" }}>Critical Incident Mode</div><div style={{ fontSize:11, color:"#334155", marginTop:2 }}>{criticalIncident?"Active":"Not active"}</div></div>
            <div onClick={() => { setCriticalIncident(!criticalIncident); if(!criticalIncident)setShowConfirm("critical"); }} style={{ padding:"8px 14px", borderRadius:10, cursor:"pointer", background:criticalIncident?"rgba(100,116,139,0.1)":"rgba(71,85,105,0.15)", border:`1px solid ${criticalIncident?"rgba(100,116,139,0.2)":"rgba(148,163,184,0.2)"}`, fontSize:12, fontWeight:700, color:criticalIncident?"#64748b":"#94a3b8" }}>{criticalIncident?"Deactivate":"Activate"}</div>
          </div>
            </div> {/* end right column */}
          </div> {/* end desktop grid */}
        </div>
      )}

      {/* ── WELLNESS ── */}
      {tab === "wellness" && (
        <div>
          <div style={{ background:"rgba(56,189,248,0.06)", border:"1px solid rgba(56,189,248,0.15)", borderRadius:12, padding:"10px 14px", marginBottom:12 }}><div style={{ fontSize:11, color:"#38bdf8", fontWeight:700 }}>🔒 Anonymous and aggregated — no individual data shown</div></div>
          <div style={{ display:"grid", gridTemplateColumns:isWide?"1fr 1fr":"1fr", gap:isWide?20:0 }}>
          <div>
          {trendData ? (
            <Card><SLabel color="#38bdf8">Check-In Activity — Last 7 Days</SLabel>
              <div style={{ display:"flex", gap:3, height:90, alignItems:"flex-end", marginTop:12 }}>
                {trendData.map((d,i) => { const max=Math.max(...trendData.map(x=>x.count),1); return <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center" }}><div style={{ width:"100%", background:"#38bdf8", height:`${(d.count/max)*80}px`, borderRadius:"3px 3px 0 0", opacity:0.7 }}/><div style={{ fontSize:9, color:"#2d4a66", marginTop:4 }}>{d.day}</div></div>; })}
              </div>
            </Card>
          ) : <Card><SLabel color="#38bdf8">Wellness Trend</SLabel><div style={{ fontSize:12, color:"#334155", padding:"20px 0", textAlign:"center" }}>{liveStats?"Not enough data yet":"Loading..."}</div></Card>}
          {liveStats && liveStats.totalCheckins > 0 && (
            <Card><SLabel color="#eab308">Wellness Breakdown</SLabel>
              {[{label:"Great",count:liveStats.statusCounts.great,color:"#22c55e"},{label:"Striving",count:liveStats.statusCounts.striving,color:"#eab308"},{label:"Not Well",count:liveStats.statusCounts.notwell,color:"#f97316"},{label:"Ill",count:liveStats.statusCounts.ill,color:"#ef4444"}].map((s,i) => {
                const pct=liveStats.totalCheckins>0?Math.round((s.count/liveStats.totalCheckins)*100):0;
                return <div key={i} style={{ marginBottom:10 }}><div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}><span style={{ fontSize:11, color:"#8099b0" }}>{s.label}</span><span style={{ fontSize:11, fontWeight:700, color:s.color }}>{pct}% ({s.count})</span></div><div style={{ height:5, borderRadius:4, background:"rgba(255,255,255,0.04)" }}><div style={{ height:"100%", width:pct+"%", background:s.color, borderRadius:4 }}/></div></div>;
              })}
            </Card>
          )}
          </div>
          <div>
          {liveStats && Object.keys(liveStats.toolCounts||{}).length > 0 && (
            <Card><SLabel color="#f97316">Tool Usage</SLabel>
              {Object.entries(liveStats.toolCounts).sort(([,a],[,b])=>b-a).slice(0,8).map(([tool,count],i) => {
                const max=Math.max(...Object.values(liveStats.toolCounts)); const pct=Math.round((count/max)*100);
                return <div key={i} style={{ marginBottom:8 }}><div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}><span style={{ fontSize:11, color:"#8099b0" }}>{tool}</span><span style={{ fontSize:11, fontWeight:700, color:"#38bdf8" }}>{count}x</span></div><div style={{ height:5, borderRadius:4, background:"rgba(255,255,255,0.04)" }}><div style={{ height:"100%", width:pct+"%", background:"#38bdf8", borderRadius:4, opacity:0.7 }}/></div></div>;
              })}
            </Card>
          )}
          </div>
          </div> {/* end wellness grid */}
        </div>
      )}

      {/* ── METRICS ── */}
      {tab === "metrics" && (
        <div>
          <div style={{ background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.15)", borderRadius:12, padding:"10px 14px", marginBottom:12 }}><div style={{ fontSize:11, color:"#22c55e", fontWeight:700 }}>📊 Anonymous aggregated data only</div></div>
          <div style={{ display:"grid", gridTemplateColumns:isWide?"1fr 1fr 1fr 1fr":"1fr 1fr", gap:10, marginBottom:12 }}>
            {[{label:"Check-Ins",value:liveStats?liveStats.totalCheckins:"--",sub:`${statsDays}d`,color:"#38bdf8"},{label:"AI Sessions",value:liveStats?liveStats.aiSessionCount:"--",sub:`${statsDays}d`,color:"#a78bfa"},{label:"PST Contacts",value:liveStats?liveStats.pstContactCount:"--",sub:`${statsDays}d`,color:"#22c55e"},{label:"Tool Uses",value:liveStats?liveStats.totalToolUsage:"--",sub:`${statsDays}d`,color:"#eab308"}].map((s,i) => (
              <div key={i} style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.055)", borderRadius:14, padding:"14px", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:s.color, opacity:0.5 }}/>
                <div style={{ fontSize:26, fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:11, fontWeight:700, color:"#94a3b8", marginTop:2 }}>{s.label}</div>
                <div style={{ fontSize:10, color:"#334155" }}>{s.sub}</div>
              </div>
            ))}
          </div>
          {!liveStats && <div style={{ textAlign:"center", padding:"40px 20px", color:"#334155", fontSize:13 }}>{statsLoading?"Loading metrics...":"No metrics data yet"}</div>}
        </div>
      )}

      {/* ── ESCALATIONS ── */}
      {tab === "escalations" && (
        <div>
          <div style={{ background:"rgba(56,189,248,0.04)", border:"1px solid rgba(56,189,248,0.1)", borderRadius:12, padding:"10px 14px", marginBottom:12, fontSize:11, color:"#38bdf8", fontWeight:700 }}>Privacy: You see that a request exists. You never see chat or PST notes.</div>
          {escalations.length===0 && <div style={{ textAlign:"center", padding:"40px 20px", color:"#1e3a52", fontSize:13 }}>No escalations at this time.</div>}
          {escalations.map(esc => (
            <div key={esc.id} style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.055)", borderRadius:14, padding:"14px 16px", marginBottom:10 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  {["Urgent","Priority","Routine"].map(p=>esc.priority===p&&<span key={p} style={{ fontSize:9, fontWeight:800, color:{Urgent:"#ef4444",Priority:"#eab308",Routine:"#22c55e"}[p], background:{Urgent:"#ef4444",Priority:"#eab308",Routine:"#22c55e"}[p]+"20", padding:"2px 8px", borderRadius:5 }}>{p.toUpperCase()}</span>)}
                </div>
                <span style={{ fontSize:10, color:"#334155" }}>{esc.time}</span>
              </div>
              <div style={{ fontSize:12, color:"#64748b", lineHeight:1.6 }}>{esc.note}</div>
            </div>
          ))}
          <div style={{ height:1, background:"rgba(255,255,255,0.05)", margin:"16px 0" }}/>
          <div style={{ fontSize:12, color:"#64748b", marginBottom:10 }}>Send an agency-wide operational message.</div>
          <textarea value={notifText} onChange={e=>setNotifText(e.target.value)} placeholder='E.g., "Station coverage update at 1400"' rows={3} maxLength={200} style={{ background:"rgba(255,255,255,0.03)", border:"1.5px solid rgba(255,255,255,0.07)", borderRadius:11, padding:"11px 13px", fontSize:12, fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"none", width:"100%", lineHeight:1.6, color:"#cbd5e1", marginBottom:6 }}/>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div style={{ fontSize:10, color:"#1e3a52" }}>{notifText.length}/200</div>
            <div style={{ display:"flex", gap:6 }}>{["Info","Important","Urgent"].map(lv=><div key={lv} onClick={()=>setNotifPriority(lv)} style={{ padding:"5px 10px", borderRadius:7, cursor:"pointer", fontSize:10, fontWeight:700, background:notifPriority===lv?"rgba(100,116,139,0.15)":"rgba(100,116,139,0.04)", border:`1px solid ${notifPriority===lv?"rgba(100,116,139,0.3)":"rgba(100,116,139,0.08)"}`, color:notifPriority===lv?"#cbd5e1":"#475569" }}>{lv}</div>)}</div>
          </div>
          <div onClick={()=>{ if(!notifText.trim())return; setAgencyNotification({message:notifText,priority:notifPriority,timestamp:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}); setNotifText(""); setShowConfirm("notification"); }} style={{ padding:"12px", borderRadius:11, cursor:notifText.trim()?"pointer":"not-allowed", textAlign:"center", fontSize:13, fontWeight:700, background:notifText.trim()?"rgba(148,163,184,0.1)":"rgba(255,255,255,0.02)", border:`1px solid ${notifText.trim()?"rgba(148,163,184,0.2)":"rgba(255,255,255,0.04)"}`, color:notifText.trim()?"#94a3b8":"#334155", opacity:notifText.trim()?1:0.5 }}>Send Broadcast</div>
        </div>
      )}

      {/* ── PST TEAM ── */}
      {tab === "pst" && (
        <div>
          {/* Dispatch Board — live unclaimed alert */}
          <div onClick={() => navigate("pstdispatch")} style={{ background: unclaimedRed > 0 ? "rgba(239,68,68,0.12)" : unclaimedCount > 0 ? "rgba(249,115,22,0.08)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${unclaimedRed > 0 ? "rgba(239,68,68,0.4)" : unclaimedCount > 0 ? "rgba(249,115,22,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius:14, padding:"14px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:14, marginBottom:14 }}>
            <div style={{ fontSize:24 }}>{unclaimedRed > 0 ? "🚨" : unclaimedCount > 0 ? "⚠️" : "📋"}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:800, color: unclaimedRed > 0 ? "#ef4444" : unclaimedCount > 0 ? "#f97316" : "#8099b0" }}>
                PST Dispatch Board
                {unclaimedCount > 0 && <span style={{ marginLeft:8, fontSize:12, background: unclaimedRed > 0 ? "rgba(239,68,68,0.2)" : "rgba(249,115,22,0.2)", padding:"2px 8px", borderRadius:6 }}>{unclaimedCount} unclaimed</span>}
              </div>
              <div style={{ fontSize:12, color:"#94a3b8", marginTop:2 }}>
                {unclaimedRed > 0 ? `${unclaimedRed} high-urgency case${unclaimedRed > 1 ? "s" : ""} need attention` : unclaimedCount > 0 ? `${unclaimedCount} open case${unclaimedCount > 1 ? "s" : ""} waiting for a PST member` : "No open cases right now"}
              </div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={unclaimedRed > 0 ? "#ef4444" : unclaimedCount > 0 ? "#f97316" : "#475569"} strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </div>

          {/* PST Request QR quick access */}
          <div onClick={() => navigate("adminai")} style={{ background:"rgba(167,139,250,0.06)", border:"1px solid rgba(167,139,250,0.18)", borderRadius:14, padding:"14px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:14, marginBottom:14 }}>
            <div style={{ fontSize:24 }}>🖨</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#a78bfa" }}>Generate PST QR Poster</div>
              <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>Print-ready poster for stations and vehicles</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </div>

          {/* Unclaimed cases alert */}
          <UnclaimedCasesAlert agencyCode={agencyCode} navigate={navigate}/>

          <div style={{ fontSize:10, fontWeight:800, letterSpacing:"0.16em", textTransform:"uppercase", color:"#475569", marginBottom:8 }}>PST Roster</div>
          <div style={{ display:"flex", gap:10, marginBottom:12 }}>
            {[{s:"on",label:"On Duty",c:"#22c55e"},{s:"phone",label:"By Phone",c:"#eab308"},{s:"off",label:"Off Duty",c:"#475569"}].map(x=>(
              <div key={x.s} style={{ flex:1, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:10, padding:"10px 8px", textAlign:"center" }}>
                <div style={{ fontSize:20, fontWeight:900, color:x.c }}>{pstRoster.filter(m=>m.status===x.s).length}</div>
                <div style={{ fontSize:9, fontWeight:700, color:"#334155", marginTop:2 }}>{x.label}</div>
              </div>
            ))}
          </div>
          {pstRoster.length===0 && <div style={{ textAlign:"center", padding:"20px", color:"#334155", fontSize:12 }}>No PST members added yet.</div>}
          {pstRoster.map(m=>(
            <div key={m.id} style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.055)", borderRadius:14, padding:"14px 16px", display:"flex", alignItems:"center", gap:14, marginBottom:8 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:statusColor[m.status]||"#475569", flexShrink:0 }}/>
              <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:700, color:"#cbd5e1" }}>{m.name}</div><div style={{ fontSize:11, color:"#334155", marginTop:2 }}>{m.role}</div></div>
              <div style={{ fontSize:10, fontWeight:700, color:statusColor[m.status]||"#475569" }}>{statusLabel[m.status]||"Off Duty"}</div>
            </div>
          ))}
          {isAdmin && <div onClick={()=>setAddMemberModal(true)} style={{ background:"rgba(255,255,255,0.02)", border:"1.5px dashed rgba(255,255,255,0.07)", borderRadius:14, padding:"14px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12, marginBottom:12 }}><div style={{ width:34, height:34, borderRadius:9, background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>+</div><div style={{ fontSize:13, fontWeight:700, color:"#475569" }}>Add PST Member</div></div>}
          {(isAdmin||isSupervisor) && (
            <Card style={{ marginTop:12 }}>
              <SLabel color="#a78bfa">Agency Role Assignment</SLabel>
              <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                <input value={roleUserId} onChange={e=>setRoleUserId(e.target.value)} placeholder="Appwrite userId" style={{ flex:1, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"8px 10px", color:"#dde8f4", fontSize:12 }}/>
                <DarkSelect value={roleType} onChange={setRoleType} options={ROLE_OPTIONS}/>
              </div>
              <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                <div onClick={assignAgencyRole} style={{ flex:1, padding:"8px", borderRadius:8, textAlign:"center", cursor:"pointer", background:"rgba(167,139,250,0.12)", border:"1px solid rgba(167,139,250,0.3)", color:"#a78bfa", fontWeight:700, fontSize:12 }}>Assign Role</div>
                <div onClick={loadAgencyRoles} style={{ flex:1, padding:"8px", borderRadius:8, textAlign:"center", cursor:"pointer", background:"rgba(56,189,248,0.12)", border:"1px solid rgba(56,189,248,0.3)", color:"#38bdf8", fontWeight:700, fontSize:12 }}>Refresh</div>
              </div>
              {roleStatus && <div style={{ fontSize:11, color:"#94a3b8", marginBottom:6 }}>{roleStatus}</div>}
              {agencyRoleRows.map(r=>(
                <div key={r.$id} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 0", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ flex:1, fontSize:11, color:"#cbd5e1" }}>{r.userId||r.user_id}</div>
                  <DarkSelect value={r.role||"pst"} onChange={val=>updateAgencyRole(r.$id,val)} options={ROLE_OPTIONS} small={true}/>
                  <div onClick={()=>revokeAgencyRole(r.$id)} style={{ fontSize:11, color:"#f87171", cursor:"pointer" }}>Revoke</div>
                </div>
              ))}
            </Card>
          )}
          {(isAdmin||isSupervisor) && (
            <Card style={{ marginTop:10 }}>
              <SLabel color="#38bdf8">Password Reset Requests</SLabel>
              {agencyResetRows.length===0 && <div style={{ fontSize:11, color:"#64748b" }}>No open reset requests.</div>}
              {agencyResetRows.map(r=>(
                <div key={r.$id} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 0", borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ flex:1 }}><div style={{ fontSize:11, color:"#cbd5e1" }}>{r.email||"unknown email"}</div><div style={{ fontSize:10, color:"#64748b" }}>{r.requestedRole||r.role||"staff"} · {(r.createdAt||r.$createdAt||"").slice(0,10)}</div></div>
                  <div onClick={()=>resolveAgencyReset(r.$id)} style={{ padding:"6px 10px", borderRadius:8, cursor:"pointer", background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.25)", fontSize:11, fontWeight:700, color:"#22c55e" }}>Resolve</div>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {/* ── RESOURCES ── */}
      {tab === "resources" && isAdmin && (
        <div>
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:"0.16em", textTransform:"uppercase", color:"#475569", marginBottom:8 }}>Resource Library</div>
          {resources.length===0 && <div style={{ textAlign:"center", padding:"30px", color:"#334155", fontSize:12 }}>No resources added yet.</div>}
          {resources.map(r=>(
            <div key={r.id} style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.055)", borderRadius:14, padding:"13px 16px", display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
              <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:700, color:"#cbd5e1" }}>{r.title}</div><div style={{ fontSize:11, color:"#334155" }}>{r.category}</div></div>
              <div onClick={()=>setResources(prev=>prev.filter(x=>x.id!==r.id))} style={{ padding:"6px 12px", borderRadius:8, cursor:"pointer", fontSize:11, fontWeight:700, background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.15)", color:"#f87171" }}>Remove</div>
            </div>
          ))}
        </div>
      )}

      {/* ── SETTINGS ── */}
      {tab === "settings" && isAdmin && (
        <div>

          {/* ── AGENCY INFO ── */}
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:"0.16em", textTransform:"uppercase", color:"#475569", marginBottom:12 }}>Agency Information</div>
          {!agencyEditLoaded && (
            <div onClick={() => loadAgencyEdit()} style={{ background:"rgba(56,189,248,0.08)", border:"1px solid rgba(56,189,248,0.2)", borderRadius:12, padding:"12px 16px", cursor:"pointer", textAlign:"center", fontSize:13, fontWeight:700, color:"#38bdf8", marginBottom:16 }}>
              {agencyEditLoading ? "Loading..." : "Load Agency Info"}
            </div>
          )}
          {agencyEditLoaded && (
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
              <div style={{ display:"grid", gridTemplateColumns:isWide?"1fr 1fr":"1fr", gap:10 }}>
                <div>
                  <div style={{ fontSize:11, color:"#64748b", marginBottom:4 }}>Agency Name</div>
                  <input value={agencyEdit.name} onChange={e=>setAgencyEdit(p=>({...p,name:e.target.value}))} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"11px 13px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%", color:"#dde8f4" }}/>
                </div>
                <div>
                  <div style={{ fontSize:11, color:"#64748b", marginBottom:4 }}>Agency Code <span style={{ color:"#334155" }}>(read only)</span></div>
                  <input value={agencyEdit.code} disabled style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"11px 13px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%", color:"#475569", cursor:"not-allowed" }}/>
                </div>
                <div>
                  <div style={{ fontSize:11, color:"#64748b", marginBottom:4 }}>Region / State</div>
                  <input value={agencyEdit.region} onChange={e=>setAgencyEdit(p=>({...p,region:e.target.value}))} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"11px 13px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%", color:"#dde8f4" }}/>
                </div>
                <div>
                  <div style={{ fontSize:11, color:"#64748b", marginBottom:4 }}>Agency Type</div>
                  <input value={agencyEdit.type} onChange={e=>setAgencyEdit(p=>({...p,type:e.target.value}))} placeholder="EMS / Fire / Law / Mixed" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"11px 13px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%", color:"#dde8f4" }}/>
                </div>
                <div>
                  <div style={{ fontSize:11, color:"#64748b", marginBottom:4 }}>Admin Name</div>
                  <input value={agencyEdit.adminName} onChange={e=>setAgencyEdit(p=>({...p,adminName:e.target.value}))} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"11px 13px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%", color:"#dde8f4" }}/>
                </div>
                <div>
                  <div style={{ fontSize:11, color:"#64748b", marginBottom:4 }}>Admin Email</div>
                  <input value={agencyEdit.adminEmail} onChange={e=>setAgencyEdit(p=>({...p,adminEmail:e.target.value}))} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"11px 13px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%", color:"#dde8f4" }}/>
                </div>
              </div>
              <div onClick={saveAgencyEdit} style={{ background:agencyEditSaved?"rgba(34,197,94,0.12)":"rgba(56,189,248,0.1)", border:`1.5px solid ${agencyEditSaved?"rgba(34,197,94,0.3)":"rgba(56,189,248,0.25)"}`, borderRadius:11, padding:"12px", textAlign:"center", cursor:"pointer", fontSize:13, fontWeight:700, color:agencyEditSaved?"#22c55e":"#38bdf8" }}>
                {agencyEditLoading ? "Saving..." : agencyEditSaved ? "✓ Saved" : "Save Agency Info"}
              </div>
            </div>
          )}

          <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"4px 0 20px" }}/>

          {/* ── PST MEMBERS ── */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
            <div style={{ fontSize:10, fontWeight:800, letterSpacing:"0.16em", textTransform:"uppercase", color:"#475569" }}>PST Members</div>
            <div style={{ display:"flex", gap:8 }}>
              {!pstMembers.length && <div onClick={loadPstMembers} style={{ fontSize:11, color:"#38bdf8", cursor:"pointer", padding:"5px 10px", borderRadius:8, background:"rgba(56,189,248,0.08)", border:"1px solid rgba(56,189,248,0.2)", fontWeight:700 }}>{pstLoading?"Loading...":"Load Members"}</div>}
              <div onClick={() => setShowAddMember(v=>!v)} style={{ fontSize:11, color:"#22c55e", cursor:"pointer", padding:"5px 10px", borderRadius:8, background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", fontWeight:700 }}>+ Add Member</div>
            </div>
          </div>

          {/* Add member form */}
          {showAddMember && (
            <div style={{ background:"rgba(34,197,94,0.05)", border:"1px solid rgba(34,197,94,0.15)", borderRadius:14, padding:"16px", marginBottom:14 }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#22c55e", marginBottom:12 }}>New PST Member</div>
              <div style={{ display:"grid", gridTemplateColumns:isWide?"1fr 1fr":"1fr", gap:10, marginBottom:10 }}>
                <input value={newMember.name} onChange={e=>setNewMember(p=>({...p,name:e.target.value}))} placeholder="Full name *" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"10px 12px", fontSize:12, fontFamily:"'DM Sans',sans-serif", outline:"none", color:"#dde8f4" }}/>
                <input value={newMember.unit} onChange={e=>setNewMember(p=>({...p,unit:e.target.value}))} placeholder="Unit / Station" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"10px 12px", fontSize:12, fontFamily:"'DM Sans',sans-serif", outline:"none", color:"#dde8f4" }}/>
                <input value={newMember.phone} onChange={e=>setNewMember(p=>({...p,phone:e.target.value}))} placeholder="Phone" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"10px 12px", fontSize:12, fontFamily:"'DM Sans',sans-serif", outline:"none", color:"#dde8f4" }}/>
                <input value={newMember.email} onChange={e=>setNewMember(p=>({...p,email:e.target.value}))} placeholder="Email" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"10px 12px", fontSize:12, fontFamily:"'DM Sans',sans-serif", outline:"none", color:"#dde8f4" }}/>
                <input value={newMember.note} onChange={e=>setNewMember(p=>({...p,note:e.target.value}))} placeholder="Availability note" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"10px 12px", fontSize:12, fontFamily:"'DM Sans',sans-serif", outline:"none", color:"#dde8f4" }}/>
                <div>
                  <div style={{ fontSize:11, color:"#64748b", marginBottom:6 }}>Role</div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                    {memberRoles.map(r => (
                      <div key={r} onClick={()=>setNewMember(p=>({...p,role:r}))} style={{ padding:"6px 12px", borderRadius:8, cursor:"pointer", fontSize:11, fontWeight:700, background:newMember.role===r?"rgba(167,139,250,0.15)":"rgba(255,255,255,0.03)", border:`1px solid ${newMember.role===r?"rgba(167,139,250,0.4)":"rgba(255,255,255,0.07)"}`, color:newMember.role===r?"#a78bfa":"#64748b" }}>{r}</div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:11, color:"#64748b", marginBottom:6 }}>Default Status</div>
                  <div style={{ display:"flex", gap:6 }}>
                    {memberStatuses.map(s => (
                      <div key={s.key} onClick={()=>setNewMember(p=>({...p,status:s.key}))} style={{ flex:1, padding:"6px 8px", borderRadius:8, cursor:"pointer", fontSize:11, fontWeight:700, textAlign:"center", background:newMember.status===s.key?s.color+"18":"rgba(255,255,255,0.03)", border:`1px solid ${newMember.status===s.key?s.color:"rgba(255,255,255,0.07)"}`, color:newMember.status===s.key?s.color:"#64748b" }}>{s.label}</div>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <div onClick={()=>setShowAddMember(false)} style={{ flex:1, padding:"10px", borderRadius:10, cursor:"pointer", textAlign:"center", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", fontSize:12, fontWeight:700, color:"#475569" }}>Cancel</div>
                <div onClick={()=>newMember.name.trim()&&savePstMember(newMember)} style={{ flex:2, padding:"10px", borderRadius:10, cursor:newMember.name.trim()?"pointer":"not-allowed", textAlign:"center", background:"rgba(34,197,94,0.12)", border:"1.5px solid rgba(34,197,94,0.3)", fontSize:12, fontWeight:700, color:"#22c55e", opacity:newMember.name.trim()?1:0.5 }}>Save Member</div>
              </div>
            </div>
          )}

          {/* Member list */}
          {pstSaved && <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:10, padding:"10px 14px", fontSize:12, color:"#22c55e", fontWeight:700, marginBottom:10, textAlign:"center" }}>✓ Saved</div>}
          {pstMembers.map((m,i) => (
            editingMember?.$id === m.$id ? (
              // Edit form inline
              <div key={m.$id} style={{ background:"rgba(56,189,248,0.05)", border:"1px solid rgba(56,189,248,0.15)", borderRadius:14, padding:"16px", marginBottom:10 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#38bdf8", marginBottom:12 }}>Editing {m.name}</div>
                <div style={{ display:"grid", gridTemplateColumns:isWide?"1fr 1fr":"1fr", gap:10, marginBottom:10 }}>
                  <input value={editingMember.name} onChange={e=>setEditingMember(p=>({...p,name:e.target.value}))} placeholder="Full name" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"10px 12px", fontSize:12, fontFamily:"'DM Sans',sans-serif", outline:"none", color:"#dde8f4" }}/>
                  <input value={editingMember.unit||""} onChange={e=>setEditingMember(p=>({...p,unit:e.target.value}))} placeholder="Unit / Station" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"10px 12px", fontSize:12, fontFamily:"'DM Sans',sans-serif", outline:"none", color:"#dde8f4" }}/>
                  <input value={editingMember.phone||""} onChange={e=>setEditingMember(p=>({...p,phone:e.target.value}))} placeholder="Phone" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"10px 12px", fontSize:12, fontFamily:"'DM Sans',sans-serif", outline:"none", color:"#dde8f4" }}/>
                  <input value={editingMember.email||""} onChange={e=>setEditingMember(p=>({...p,email:e.target.value}))} placeholder="Email" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"10px 12px", fontSize:12, fontFamily:"'DM Sans',sans-serif", outline:"none", color:"#dde8f4" }}/>
                  <input value={editingMember.note||""} onChange={e=>setEditingMember(p=>({...p,note:e.target.value}))} placeholder="Availability note" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"10px 12px", fontSize:12, fontFamily:"'DM Sans',sans-serif", outline:"none", color:"#dde8f4" }}/>
                  <div>
                    <div style={{ fontSize:11, color:"#64748b", marginBottom:6 }}>Role</div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {memberRoles.map(r => (
                        <div key={r} onClick={()=>setEditingMember(p=>({...p,role:r}))} style={{ padding:"6px 12px", borderRadius:8, cursor:"pointer", fontSize:11, fontWeight:700, background:editingMember.role===r?"rgba(167,139,250,0.15)":"rgba(255,255,255,0.03)", border:`1px solid ${editingMember.role===r?"rgba(167,139,250,0.4)":"rgba(255,255,255,0.07)"}`, color:editingMember.role===r?"#a78bfa":"#64748b" }}>{r}</div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:11, color:"#64748b", marginBottom:6 }}>Status</div>
                    <div style={{ display:"flex", gap:6 }}>
                      {memberStatuses.map(s => (
                        <div key={s.key} onClick={()=>setEditingMember(p=>({...p,status:s.key}))} style={{ flex:1, padding:"6px 8px", borderRadius:8, cursor:"pointer", fontSize:11, fontWeight:700, textAlign:"center", background:editingMember.status===s.key?s.color+"18":"rgba(255,255,255,0.03)", border:`1px solid ${editingMember.status===s.key?s.color:"rgba(255,255,255,0.07)"}`, color:editingMember.status===s.key?s.color:"#64748b" }}>{s.label}</div>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <div onClick={()=>setEditingMember(null)} style={{ flex:1, padding:"10px", borderRadius:10, cursor:"pointer", textAlign:"center", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", fontSize:12, fontWeight:700, color:"#475569" }}>Cancel</div>
                  <div onClick={()=>savePstMember(editingMember)} style={{ flex:2, padding:"10px", borderRadius:10, cursor:"pointer", textAlign:"center", background:"rgba(56,189,248,0.12)", border:"1.5px solid rgba(56,189,248,0.3)", fontSize:12, fontWeight:700, color:"#38bdf8" }}>Save Changes</div>
                </div>
              </div>
            ) : (
              <div key={m.$id} style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.055)", borderRadius:14, padding:"13px 16px", marginBottom:8, display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:9, height:9, borderRadius:"50%", background:memberStatuses.find(s=>s.key===m.status)?.color||"#475569", flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#dde8f4" }}>{m.name}</div>
                  <div style={{ fontSize:11, color:"#475569" }}>{m.role}{m.unit?` · ${m.unit}`:""}{m.note?` · ${m.note}`:""}</div>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <div onClick={()=>setEditingMember({...m})} style={{ fontSize:11, color:"#38bdf8", cursor:"pointer", padding:"5px 10px", borderRadius:8, background:"rgba(56,189,248,0.08)", border:"1px solid rgba(56,189,248,0.2)", fontWeight:700 }}>Edit</div>
                  <div onClick={()=>deletePstMember(m.$id)} style={{ fontSize:11, color:"#f87171", cursor:"pointer", padding:"5px 10px", borderRadius:8, background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", fontWeight:700 }}>Remove</div>
                </div>
              </div>
            )
          ))}

          {pstMembers.length === 0 && !pstLoading && agencyEditLoaded && (
            <div style={{ textAlign:"center", padding:"20px", color:"#334155", fontSize:12 }}>No PST members yet. Add your first member above.</div>
          )}

          <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"4px 0 20px" }}/>

          {/* ── EMPLOYEE ROSTER ── */}
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:"0.16em", textTransform:"uppercase", color:"#475569", marginBottom:12 }}>Employee Roster</div>
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            {["all","active","inactive"].map(f=>(
              <div key={f} onClick={()=>setRosterFilter(f)} style={{ flex:1, padding:"9px 6px", borderRadius:10, cursor:"pointer", textAlign:"center", background:rosterFilter===f?"rgba(56,189,248,0.12)":"rgba(255,255,255,0.03)", border:`1px solid ${rosterFilter===f?"rgba(56,189,248,0.3)":"rgba(255,255,255,0.07)"}`, fontSize:11, fontWeight:rosterFilter===f?800:600, color:rosterFilter===f?"#38bdf8":"#64748b" }}>
                {f.charAt(0).toUpperCase()+f.slice(1)} ({f==="all"?roster.length:roster.filter(e=>e.status===f).length})
              </div>
            ))}
          </div>
          {roster.filter(e=>rosterFilter==="all"||e.status===rosterFilter).map(e=>(
            <div key={e.id} style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.055)", borderRadius:14, padding:"13px 16px", marginBottom:8, opacity:e.status==="inactive"?0.55:1 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}><div style={{ width:7, height:7, borderRadius:"50%", background:e.status==="active"?"#22c55e":"#475569", flexShrink:0 }}/><span style={{ fontSize:13, fontWeight:700, color:"#dde8f4" }}>{e.name}</span></div>
                  <div style={{ fontSize:11, color:"#475569", paddingLeft:15 }}>{e.phone}</div>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <div onClick={()=>setRoster(prev=>prev.map(r=>r.id===e.id?{...r,status:e.status==="active"?"inactive":"active"}:r))} style={{ padding:"6px 10px", borderRadius:8, cursor:"pointer", fontSize:11, fontWeight:700, background:e.status==="active"?"rgba(239,68,68,0.08)":"rgba(34,197,94,0.08)", border:`1px solid ${e.status==="active"?"rgba(239,68,68,0.2)":"rgba(34,197,94,0.2)"}`, color:e.status==="active"?"#f87171":"#22c55e" }}>{e.status==="active"?"Deactivate":"Reactivate"}</div>
                  <div onClick={()=>setRoster(prev=>prev.filter(r=>r.id!==e.id))} style={{ padding:"6px 10px", borderRadius:8, cursor:"pointer", fontSize:11, fontWeight:700, background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.15)", color:"#f87171" }}>Remove</div>
                </div>
              </div>
            </div>
          ))}
          <div onClick={()=>setAddEmployeeModal(true)} style={{ background:"rgba(255,255,255,0.02)", border:"1.5px dashed rgba(255,255,255,0.08)", borderRadius:14, padding:"13px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
            <div style={{ width:34, height:34, borderRadius:9, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>+</div>
            <div style={{ fontSize:13, fontWeight:700, color:"#475569" }}>Add Employee Manually</div>
          </div>

          <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"4px 0 20px" }}/>

          {/* ── DIVISIONS ── */}
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:"0.16em", textTransform:"uppercase", color:"#475569", marginBottom:6 }}>Divisions</div>
          <div style={{ fontSize:12, color:"#64748b", marginBottom:12, lineHeight:1.6 }}>
            If your agency has multiple divisions, add them here. Responders will be prompted to select their division after joining via QR.
          </div>
          <DivisionManager agencyCode={agencyCode}/>

          <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"20px 0" }}/>

          {/* ── PST CASE RETENTION ── */}
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:"0.16em", textTransform:"uppercase", color:"#475569", marginBottom:6 }}>PST Case Retention</div>
          <div style={{ fontSize:12, color:"#64748b", marginBottom:12, lineHeight:1.6 }}>
            How long closed cases are kept before content is purged. Open cases are never auto-purged — they stay until a PST member closes them. Usage data (counts, colors) is always retained.
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
            {[30, 60, 90, 120].map(days => (
              <div key={days} onClick={() => { setRetentionDays(days); saveRetention(days); }}
                style={{ padding:"12px", borderRadius:10, cursor:"pointer", textAlign:"center", background:retentionDays===days?"rgba(56,189,248,0.12)":"rgba(255,255,255,0.03)", border:`1.5px solid ${retentionDays===days?"rgba(56,189,248,0.35)":"rgba(255,255,255,0.07)"}` }}>
                <div style={{ fontSize:18, fontWeight:900, color:retentionDays===days?"#38bdf8":"#475569" }}>{days}</div>
                <div style={{ fontSize:10, fontWeight:700, color:retentionDays===days?"#38bdf8":"#334155" }}>days</div>
              </div>
            ))}
          </div>
          <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"10px 14px", marginBottom:10, fontSize:11, color:"#475569", lineHeight:1.6 }}>
            🔒 <strong style={{ color:"#8099b0" }}>Open cases never auto-purge.</strong> Only closed cases are removed after {retentionDays} days. Usage statistics (case count, urgency level, resolution type) are always retained for analytics.
          </div>
          {retentionSaved && <div style={{ fontSize:11, color:"#22c55e", marginBottom:10 }}>✓ Saved</div>}
          <PSTCasePurgeRunner agencyCode={agencyCode} retentionDays={retentionDays}/>

          <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"4px 0 20px" }}/>

          {/* ── HUMAN PST TOGGLE ── */}
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:"0.16em", textTransform:"uppercase", color:"#475569", marginBottom:6 }}>Human PST</div>
          <div style={{ fontSize:12, color:"#64748b", marginBottom:12, lineHeight:1.6 }}>
            Controls whether Human PST is active for responders. When off, the tile shows as "Coming Soon". Requests that haven't been picked up remain visible to admins.
          </div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"14px 16px", marginBottom:10 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"#dde8f4" }}>Human PST Active</div>
              <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>{humanPSTEnabled ? "Responders can contact the PST team" : "PST tile shows as Coming Soon"}</div>
            </div>
            <div onClick={() => { const v = !humanPSTEnabled; setHumanPSTEnabled(v); saveHumanPST(v); }} style={{ width:44, height:26, borderRadius:13, background:humanPSTEnabled?"rgba(167,139,250,0.3)":"rgba(255,255,255,0.08)", border:`1.5px solid ${humanPSTEnabled?"rgba(167,139,250,0.5)":"rgba(255,255,255,0.12)"}`, cursor:"pointer", position:"relative", transition:"all 0.2s", flexShrink:0 }}>
              <div style={{ position:"absolute", top:3, left:humanPSTEnabled?20:3, width:16, height:16, borderRadius:"50%", background:humanPSTEnabled?"#a78bfa":"#475569", transition:"left 0.2s" }}/>
            </div>
          </div>
          {humanPSTSaved && <div style={{ fontSize:11, color:"#22c55e", marginBottom:10 }}>✓ Saved</div>}

          <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"4px 0 20px" }}/>

          {/* ── CREW STREAM ── */}
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:"0.16em", textTransform:"uppercase", color:"#475569", marginBottom:6 }}>Crew Stream</div>
          <div style={{ fontSize:12, color:"#64748b", marginBottom:12, lineHeight:1.6 }}>
            Shows anonymous shift wellness bars on the home screen. Agency analytics feature — off by default. Responders see it only when enabled.
          </div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"14px 16px", marginBottom:10 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"#dde8f4" }}>Enable Crew Stream</div>
              <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>Shows anonymous wellness bars on responder home screen</div>
            </div>
            <div onClick={() => { const v = !crewStreamEnabled; setCrewStreamEnabled(v); saveCrewStream(v); }} style={{ width:44, height:26, borderRadius:13, background:crewStreamEnabled?"rgba(56,189,248,0.3)":"rgba(255,255,255,0.08)", border:`1.5px solid ${crewStreamEnabled?"rgba(56,189,248,0.5)":"rgba(255,255,255,0.12)"}`, cursor:"pointer", position:"relative", transition:"all 0.2s", flexShrink:0 }}>
              <div style={{ position:"absolute", top:3, left:crewStreamEnabled?20:3, width:16, height:16, borderRadius:"50%", background:crewStreamEnabled?"#38bdf8":"#475569", transition:"left 0.2s" }}/>
            </div>
          </div>
          {crewStreamSaved && <div style={{ fontSize:11, color:"#22c55e", marginBottom:10 }}>✓ Saved</div>}

          <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"4px 0 20px" }}/>

          {/* ── AGENCY BRANDING ── */}
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:"0.16em", textTransform:"uppercase", color:"#475569", marginBottom:6 }}>Agency Branding</div>
          <div style={{ fontSize:12, color:"#64748b", marginBottom:12, lineHeight:1.6 }}>
            Your agency name always shows in the "Powered by" line. Optionally add your logo beside it.
          </div>

          {/* Preview */}
          <div style={{ background:"rgba(56,189,248,0.05)", border:"1px solid rgba(56,189,248,0.12)", borderRadius:12, padding:"12px 16px", marginBottom:12, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
            <div style={{ width:14, height:1, background:"#38bdf8", opacity:0.3 }}/>
            {brandingShowLogo && brandingLogoUrl && (
              <img src={brandingLogoUrl} alt="Agency logo" style={{ height:16, width:"auto", maxWidth:56, objectFit:"contain", borderRadius:3 }} onError={e=>e.target.style.display="none"}/>
            )}
            <span style={{ fontSize:9, fontWeight:700, color:"#4d7a99", letterSpacing:"0.14em", textTransform:"uppercase" }}>
              Powered by {agencyName}
            </span>
            <div style={{ width:14, height:1, background:"#38bdf8", opacity:0.3 }}/>
          </div>

          {/* Show logo toggle */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"14px 16px", marginBottom:10 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"#dde8f4" }}>Show logo beside agency name</div>
              <div style={{ fontSize:11, color:"#475569", marginTop:2 }}>Displays a small logo next to "Powered by"</div>
            </div>
            <div onClick={() => setBrandingShowLogo(v => !v)} style={{ width:44, height:26, borderRadius:13, background:brandingShowLogo?"rgba(56,189,248,0.3)":"rgba(255,255,255,0.08)", border:`1.5px solid ${brandingShowLogo?"rgba(56,189,248,0.5)":"rgba(255,255,255,0.12)"}`, cursor:"pointer", position:"relative", transition:"all 0.2s", flexShrink:0 }}>
              <div style={{ position:"absolute", top:3, left:brandingShowLogo?20:3, width:16, height:16, borderRadius:"50%", background:brandingShowLogo?"#38bdf8":"#475569", transition:"left 0.2s" }}/>
            </div>
          </div>

          {/* Logo URL input — only shows when toggle is on */}
          {brandingShowLogo && (
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, color:"#64748b", marginBottom:6 }}>Logo URL (from Appwrite Storage or any image URL)</div>
              <input
                value={brandingLogoUrl}
                onChange={e => setBrandingLogoUrl(e.target.value)}
                placeholder="https://nyc.cloud.appwrite.io/v1/storage/..."
                style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"11px 13px", fontSize:12, fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%", color:"#dde8f4" }}
              />
            </div>
          )}

          <div onClick={saveBranding} style={{ background:brandingSaved?"rgba(34,197,94,0.12)":"rgba(56,189,248,0.1)", border:`1.5px solid ${brandingSaved?"rgba(34,197,94,0.3)":"rgba(56,189,248,0.25)"}`, borderRadius:11, padding:"12px", textAlign:"center", cursor:"pointer", fontSize:13, fontWeight:700, color:brandingSaved?"#22c55e":"#38bdf8", marginBottom:20 }}>
            {brandingSaved ? "✓ Saved" : "Save Branding"}
          </div>

          <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"4px 0 20px" }}/>

          {/* ── EXCEL TO CSV CONVERTER ── */}
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:"0.16em", textTransform:"uppercase", color:"#475569", marginBottom:6 }}>Excel → CSV Converter</div>
          <div style={{ fontSize:12, color:"#64748b", marginBottom:12, lineHeight:1.6 }}>
            Upload any Excel file and download it as a CSV. Nothing is sent to any server — all conversion happens on your device.
          </div>
          <ExcelToCSV/>

          <div style={{ height:1, background:"rgba(255,255,255,0.06)", margin:"20px 0" }}/>

          {/* ── ROSTER IMPORT ── */}
          <div style={{ fontSize:10, fontWeight:800, letterSpacing:"0.16em", textTransform:"uppercase", color:"#475569", marginBottom:6 }}>Import Roster</div>
          <div style={{ fontSize:12, color:"#64748b", marginBottom:10, lineHeight:1.6 }}>
            Upload an Excel (.xlsx, .xls) or CSV file. File must have columns named <strong style={{ color:"#8099b0" }}>Name</strong> and <strong style={{ color:"#8099b0" }}>Phone</strong>.
          </div>
          <div style={{ background:"rgba(56,189,248,0.05)", border:"1px solid rgba(56,189,248,0.12)", borderRadius:10, padding:"10px 14px", marginBottom:12, fontSize:11, color:"#64748b", lineHeight:1.6 }}>
            💡 <strong style={{ color:"#8099b0" }}>Excel tip:</strong> Column A = Name, Column B = Phone. Row 1 = headers. Works with Excel, Google Sheets (export as .xlsx), or Numbers.
          </div>
          <label style={{ display:"block" }}>
            <input type="file" accept=".csv,.xlsx,.xls" style={{ display:"none" }} onChange={handleRosterFile}/>
            <div style={{ background:importLoading?"rgba(56,189,248,0.05)":"rgba(56,189,248,0.1)", border:"1.5px solid rgba(56,189,248,0.3)", borderRadius:11, padding:"12px", textAlign:"center", cursor:importLoading?"wait":"pointer", fontSize:13, fontWeight:700, color:importLoading?"#64748b":"#38bdf8", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
              {importLoading
                ? <><div style={{ width:14, height:14, border:"2px solid rgba(56,189,248,0.3)", borderTop:"2px solid #38bdf8", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/> Reading file...</>
                : <>📂 Choose Excel or CSV File</>}
            </div>
          </label>
          {importError && <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:10, padding:"10px 14px", marginTop:10, fontSize:12, color:"#f87171" }}>{importError}</div>}
          {importPreview && (
            <div style={{ background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:14, padding:"14px 16px", marginTop:10 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#22c55e" }}>{importPreview.filename}</div>
                <div style={{ fontSize:10, color:"#475569", background:"rgba(255,255,255,0.04)", padding:"2px 8px", borderRadius:5 }}>{importPreview.type}</div>
                <div style={{ fontSize:12, color:"#22c55e", marginLeft:"auto" }}>{importPreview.total} found</div>
              </div>
              <div style={{ fontSize:11, color:"#475569", marginBottom:8 }}>Preview (first 5):</div>
              {importPreview.rows.map((r,i)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:i<importPreview.rows.length-1?"1px solid rgba(255,255,255,0.04)":"none" }}>
                  <span style={{ fontSize:12, color:"#8099b0" }}>{r.name}</span>
                  <span style={{ fontSize:11, color:"#475569" }}>{r.phone}</span>
                </div>
              ))}
              {importPreview.total > 5 && <div style={{ fontSize:11, color:"#334155", marginTop:6 }}>...and {importPreview.total-5} more</div>}
              <div style={{ display:"flex", gap:8, marginTop:12 }}>
                <div onClick={()=>setImportPreview(null)} style={{ flex:1, padding:"10px", borderRadius:10, cursor:"pointer", textAlign:"center", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", fontSize:12, fontWeight:700, color:"#475569" }}>Cancel</div>
                <div onClick={()=>{ setRoster(importPreview.allRows); setImportPreview(null); setShowConfirm("roster_imported"); }} style={{ flex:2, padding:"10px", borderRadius:10, cursor:"pointer", textAlign:"center", background:"rgba(34,197,94,0.12)", border:"1.5px solid rgba(34,197,94,0.3)", fontSize:12, fontWeight:700, color:"#22c55e" }}>Import {importPreview.total} Employees</div>
              </div>
            </div>
          )}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── PLATFORM ── */}
      {tab === "platform" && isPlatform && (
        <PlatformInlineContent navigate={navigate} onGhostLogin={onGhostLogin||function(){}}/>
      )}

      {/* ── MODALS ── */}
      {addMemberModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, padding:20 }}>
          <div style={{ background:"#0c1929", border:"1.5px solid rgba(255,255,255,0.08)", borderRadius:20, padding:"28px 22px", maxWidth:380, width:"100%" }}>
            <div style={{ fontSize:15, fontWeight:800, color:"#cbd5e1", marginBottom:16 }}>Add PST Member</div>
            <input value={newMemberName} onChange={e=>setNewMemberName(e.target.value)} placeholder="Full name" style={{ background:"rgba(255,255,255,0.04)", border:"1.5px solid rgba(255,255,255,0.08)", borderRadius:11, padding:"11px 13px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%", marginBottom:14, color:"#dde8f4" }}/>
            <div style={{ marginBottom:20 }}><div style={{ fontSize:11, color:"#64748b", marginBottom:8 }}>Member Type</div><DarkSelect value={newMemberRole} onChange={setNewMemberRole} options={MEMBER_TYPE_OPTIONS}/></div>
            <div style={{ display:"flex", gap:10 }}>
              <div onClick={()=>{ setAddMemberModal(false); setNewMemberName(""); }} style={{ flex:1, padding:"12px", borderRadius:11, cursor:"pointer", textAlign:"center", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", fontSize:13, fontWeight:700, color:"#475569" }}>Cancel</div>
              <div onClick={()=>{ if(!newMemberName.trim())return; setPstRoster(prev=>[...prev,{id:"p"+Date.now(),name:newMemberName.trim(),role:newMemberRole,status:"on",workload:0}]); setAddMemberModal(false); setNewMemberName(""); setShowConfirm("member_added"); }} style={{ flex:2, padding:"12px", borderRadius:11, cursor:"pointer", textAlign:"center", background:"rgba(148,163,184,0.12)", border:"1.5px solid rgba(148,163,184,0.3)", fontSize:13, fontWeight:700, color:"#94a3b8" }}>Add Member</div>
            </div>
          </div>
        </div>
      )}

      {addEmployeeModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, padding:20 }}>
          <div style={{ background:"#0c1929", border:"1.5px solid rgba(255,255,255,0.08)", borderRadius:20, padding:"28px 22px", maxWidth:380, width:"100%" }}>
            <div style={{ fontSize:15, fontWeight:800, color:"#cbd5e1", marginBottom:16 }}>Add Employee</div>
            <input value={newEmpName} onChange={e=>setNewEmpName(e.target.value)} placeholder="Full name" style={{ background:"rgba(255,255,255,0.04)", border:"1.5px solid rgba(255,255,255,0.08)", borderRadius:11, padding:"11px 13px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%", marginBottom:10, color:"#dde8f4" }}/>
            <input value={newEmpPhone} onChange={e=>setNewEmpPhone(e.target.value)} placeholder="Phone number" style={{ background:"rgba(255,255,255,0.04)", border:"1.5px solid rgba(255,255,255,0.08)", borderRadius:11, padding:"11px 13px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%", marginBottom:20, color:"#dde8f4" }}/>
            <div style={{ display:"flex", gap:10 }}>
              <div onClick={()=>{ setAddEmployeeModal(false); setNewEmpName(""); setNewEmpPhone(""); }} style={{ flex:1, padding:"12px", borderRadius:11, cursor:"pointer", textAlign:"center", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", fontSize:13, fontWeight:700, color:"#475569" }}>Cancel</div>
              <div onClick={()=>{ if(!newEmpName.trim()||!newEmpPhone.trim())return; setRoster(prev=>[...prev,{id:"e"+Date.now(),name:newEmpName.trim(),phone:newEmpPhone.trim(),status:"active",joined:new Date().toISOString().slice(0,10)}]); setAddEmployeeModal(false); setNewEmpName(""); setNewEmpPhone(""); }} style={{ flex:2, padding:"12px", borderRadius:11, cursor:"pointer", textAlign:"center", background:"rgba(34,197,94,0.12)", border:"1.5px solid rgba(34,197,94,0.3)", fontSize:13, fontWeight:700, color:"#22c55e" }}>Add Employee</div>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, padding:20 }}>
          <div style={{ background:"#0c1929", border:"1px solid rgba(255,255,255,0.08)", borderRadius:18, padding:"28px 24px", maxWidth:320, width:"100%", textAlign:"center" }}>
            <div style={{ fontSize:36, marginBottom:14 }}>✓</div>
            <div style={{ fontSize:15, fontWeight:800, color:"#cbd5e1", marginBottom:8 }}>
              {showConfirm==="pst"?"PST Banner Activated":showConfirm==="critical"?"Critical Mode Activated":showConfirm==="notification"?"Broadcast Sent":showConfirm==="member_added"?"Member Added":showConfirm==="roster_imported"?"Roster Imported":"Saved"}
            </div>
            <div onClick={()=>setShowConfirm(null)} style={{ padding:"12px", borderRadius:11, cursor:"pointer", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.07)", fontSize:13, fontWeight:700, color:"#64748b", marginTop:16 }}>Done</div>
          </div>
        </div>
      )}

    </ScreenSingle>
  );
}
