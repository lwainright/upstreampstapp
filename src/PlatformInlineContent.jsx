// ============================================================
// SCREEN: PlatformInlineContent
// Upstream Initiative — Platform Owner Console
// ============================================================
import React, { useState, useEffect } from 'react';
import { Card, SLabel } from './ui.jsx';
import { databases } from './appwrite.js';
import { Query, ID } from 'appwrite';

const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE || '69c88588001ed071c19e';

const typeColor = {
  EMS: "#38bdf8",
  Fire: "#f97316",
  "Law Enforcement": "#a78bfa",
  Event: "#22c55e",
  Other: "#64748b",
};

// Custom dropdown component — no native select, fully styled
function DarkSelect({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const current = options.find(o => o.value === value) || options[0];
  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 8, padding: "8px 10px",
          color: "#dde8f4", fontSize: 12,
          cursor: "pointer", display: "flex",
          justifyContent: "space-between", alignItems: "center",
          userSelect: "none",
        }}
      >
        <span>{current.label}</span>
        <span style={{ fontSize: 10, color: "#64748b" }}>▾</span>
      </div>
      {open && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0,
          background: "#0c1929",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 8, zIndex: 100, overflow: "hidden",
          marginTop: 4,
        }}>
          {options.map(o => (
            <div
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              style={{
                padding: "10px 12px", cursor: "pointer", fontSize: 12,
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

const ROLE_OPTIONS = [
  { value: "pst", label: "PST" },
  { value: "supervisor", label: "Supervisor" },
  { value: "admin", label: "Admin" },
];

const TYPE_OPTIONS = [
  { value: "EMS", label: "EMS" },
  { value: "Fire", label: "Fire" },
  { value: "Law Enforcement", label: "Law Enforcement" },
  { value: "Event", label: "Event" },
  { value: "Other", label: "Other" },
];

const logAudit = async (action, details = {}) => {
  try {
    await databases.createDocument(DB_ID, 'platform_audit_log', ID.unique(), {
      action,
      details: JSON.stringify(details),
    });
  } catch (e) {}
};

export default function PlatformInlineContent({ navigate, onGhostLogin }) {
  const [tab, setTab] = useState("agencies");
  const [showGhostConfirm, setShowGhostConfirm] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [agencies, setAgencies] = useState([]);
  const [agenciesLoading, setAgenciesLoading] = useState(false);
  const [roleRows, setRoleRows] = useState([]);
  const [resetRows, setResetRows] = useState([]);
  const [auditRows, setAuditRows] = useState([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [platformStats, setPlatformStats] = useState(null);

  const [createAgency, setCreateAgency] = useState({
    name: "", code: "", region: "", type: "EMS",
    adminName: "", adminEmail: "", adminPhone: "",
  });
  const [roleForm, setRoleForm] = useState({
    agencyCode: "", userId: "", role: "pst",
  });

  const loadAgencies = async () => {
    setAgenciesLoading(true);
    try {
      const res = await databases.listDocuments(DB_ID, 'agencies', [
        Query.limit(200),
        Query.orderDesc('$createdAt'),
      ]);
      setAgencies(res.documents || []);
    } catch (e) {
      setStatusMsg("Could not load agencies — check Appwrite permissions.");
    }
    setAgenciesLoading(false);
  };

  const loadPlatformStats = async () => {
    try {
      const [checkins, aiSessions, pstContacts, toolUsage] = await Promise.all([
        databases.listDocuments(DB_ID, 'checkins', [Query.limit(1)]),
        databases.listDocuments(DB_ID, 'ai_sessions', [Query.limit(1)]),
        databases.listDocuments(DB_ID, 'pst_contacts', [Query.limit(1)]),
        databases.listDocuments(DB_ID, 'tool_usage', [Query.limit(1)]),
      ]);
      setPlatformStats({
        totalCheckins: checkins.total || 0,
        totalAISessions: aiSessions.total || 0,
        totalPSTContacts: pstContacts.total || 0,
        totalToolUsage: toolUsage.total || 0,
      });
    } catch (e) {}
  };

  const loadRoleRows = async (agencyCode = '') => {
    try {
      const queries = [Query.limit(200)];
      if (agencyCode) queries.push(Query.equal('agencyCode', agencyCode));
      const res = await databases.listDocuments(DB_ID, 'user_permissions', queries);
      setRoleRows(res.documents || []);
    } catch (e) {
      setRoleRows([]);
    }
  };

  const loadResetRows = async () => {
    try {
      const res = await databases.listDocuments(DB_ID, 'password_reset_requests', [
        Query.equal('status', 'open'),
        Query.limit(200),
        Query.orderDesc('$createdAt'),
      ]);
      setResetRows(res.documents || []);
    } catch (e) {
      setResetRows([]);
    }
  };

  const loadAuditRows = async () => {
    try {
      const res = await databases.listDocuments(DB_ID, 'platform_audit_log', [
        Query.limit(50),
        Query.orderDesc('$createdAt'),
      ]);
      setAuditRows(res.documents || []);
    } catch (e) {
      setAuditRows([]);
    }
  };

  useEffect(() => {
    if (tab === 'agencies') { loadAgencies(); loadRoleRows(); }
    if (tab === 'analytics') loadPlatformStats();
    if (tab === 'reset-queue') loadResetRows();
    if (tab === 'access-log') loadAuditRows();
  }, [tab]);

  const createAgencyDoc = async () => {
    if (!createAgency.name.trim() || !createAgency.code.trim()) {
      setStatusMsg("Name and code are required.");
      return;
    }
    try {
      await databases.createDocument(DB_ID, 'agencies', ID.unique(), {
        name: createAgency.name.trim(),
        code: createAgency.code.trim().toUpperCase(),
        region: createAgency.region.trim() || 'Unknown',
        type: createAgency.type,
        adminName: createAgency.adminName.trim(),
        adminEmail: createAgency.adminEmail.trim(),
        adminPhone: createAgency.adminPhone.trim(),
        active: true,
      });
      await logAudit('agency_create', { code: createAgency.code.trim().toUpperCase() });
      setStatusMsg("Agency created ✓");
      setCreateAgency({ name: "", code: "", region: "", type: "EMS", adminName: "", adminEmail: "", adminPhone: "" });
      loadAgencies();
    } catch (e) {
      setStatusMsg("Create failed: " + e.message);
    }
  };

  const toggleAgencyActive = async (agencyId, currentActive) => {
    try {
      await databases.updateDocument(DB_ID, 'agencies', agencyId, { active: !currentActive });
      await logAudit('agency_status', { agencyId, active: !currentActive });
      setStatusMsg(!currentActive ? "Agency reactivated ✓" : "Agency deactivated ✓");
      loadAgencies();
    } catch (e) {
      setStatusMsg("Update failed: " + e.message);
    }
  };

  const assignRole = async () => {
    if (!roleForm.agencyCode.trim() || !roleForm.userId.trim()) {
      setStatusMsg("Agency code and user ID are required.");
      return;
    }
    try {
      await databases.createDocument(DB_ID, 'user_permissions', ID.unique(), {
        agencyCode: roleForm.agencyCode.trim().toUpperCase(),
        userId: roleForm.userId.trim(),
        role: roleForm.role,
      });
      await logAudit('role_assign', { agencyCode: roleForm.agencyCode.trim().toUpperCase(), userId: roleForm.userId.trim(), role: roleForm.role });
      setStatusMsg("Role assigned ✓");
      loadRoleRows(roleForm.agencyCode.trim().toUpperCase());
    } catch (e) {
      setStatusMsg("Role assign failed: " + e.message);
    }
  };

  const updateRole = async (docId, role) => {
    try {
      await databases.updateDocument(DB_ID, 'user_permissions', docId, { role });
      await logAudit('role_update', { docId, role });
      setStatusMsg("Role updated ✓");
      loadRoleRows(roleForm.agencyCode.trim().toUpperCase());
    } catch (e) {
      setStatusMsg("Update failed: " + e.message);
    }
  };

  const revokeRole = async (docId) => {
    try {
      await databases.deleteDocument(DB_ID, 'user_permissions', docId);
      await logAudit('role_revoke', { docId });
      setStatusMsg("Role revoked ✓");
      loadRoleRows(roleForm.agencyCode.trim().toUpperCase());
    } catch (e) {
      setStatusMsg("Revoke failed: " + e.message);
    }
  };

  const resolveReset = async (docId) => {
    try {
      await databases.updateDocument(DB_ID, 'password_reset_requests', docId, {
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
      });
      await logAudit('reset_resolved', { docId });
      setStatusMsg("Reset resolved ✓");
      loadResetRows();
    } catch (e) {
      setStatusMsg("Resolve failed: " + e.message);
    }
  };

  const filtered = agencies.filter(a =>
    (a.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.region || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.type || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const inputStyle = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8, padding: "8px 10px",
    color: "#dde8f4", fontSize: 12,
    fontFamily: "'DM Sans',sans-serif",
    outline: "none", width: "100%",
  };

  return (
    <div>
      <div style={{ background: "rgba(234,179,8,0.08)", border: "1.5px solid rgba(234,179,8,0.25)", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#eab308", flexShrink: 0 }}/>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#eab308" }}>PLATFORM OWNER — Full cross-agency access</div>
      </div>

      <div style={{ display: "flex", gap: 5, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: 5, overflowX: "auto", marginBottom: 12 }}>
        {["agencies", "analytics", "reset-queue", "access-log"].map(tk => (
          <div key={tk} onClick={() => setTab(tk)} style={{ flexShrink: 0, minWidth: 80, textAlign: "center", padding: "10px 12px", borderRadius: 10, background: tab === tk ? "rgba(234,179,8,0.15)" : "transparent", border: `1px solid ${tab === tk ? "rgba(234,179,8,0.3)" : "transparent"}`, cursor: "pointer", fontSize: 11, fontWeight: tab === tk ? 800 : 600, color: tab === tk ? "#eab308" : "#8099b0", whiteSpace: "nowrap" }}>
            {{ agencies: "Agencies", analytics: "Analytics", "reset-queue": "Reset Queue", "access-log": "Access Log" }[tk]}
          </div>
        ))}
      </div>

      {statusMsg && (
        <div style={{ background: statusMsg.includes("failed") || statusMsg.includes("Failed") ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)", border: `1px solid ${statusMsg.includes("failed") || statusMsg.includes("Failed") ? "rgba(239,68,68,0.25)" : "rgba(34,197,94,0.25)"}`, borderRadius: 10, padding: "10px 14px", fontSize: 12, color: statusMsg.includes("failed") || statusMsg.includes("Failed") ? "#f87171" : "#22c55e", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {statusMsg}
          <span onClick={() => setStatusMsg("")} style={{ cursor: "pointer", color: "#64748b", fontSize: 16 }}>×</span>
        </div>
      )}

      {/* ── AGENCIES ── */}
      {tab === "agencies" && (
        <div>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search agencies..." style={{ ...inputStyle, marginBottom: 12 }}/>

          <Card style={{ marginBottom: 12 }}>
            <SLabel color="#22c55e">Create New Agency</SLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <input value={createAgency.name} onChange={e => setCreateAgency(v => ({ ...v, name: e.target.value }))} placeholder="Agency name *" style={inputStyle}/>
              <input value={createAgency.code} onChange={e => setCreateAgency(v => ({ ...v, code: e.target.value.toUpperCase() }))} placeholder="Agency code *" style={inputStyle}/>
              <input value={createAgency.region} onChange={e => setCreateAgency(v => ({ ...v, region: e.target.value }))} placeholder="Region" style={inputStyle}/>
              <DarkSelect
                value={createAgency.type}
                onChange={val => setCreateAgency(v => ({ ...v, type: val }))}
                options={TYPE_OPTIONS}
              />
              <input value={createAgency.adminName} onChange={e => setCreateAgency(v => ({ ...v, adminName: e.target.value }))} placeholder="Admin name" style={inputStyle}/>
              <input value={createAgency.adminEmail} onChange={e => setCreateAgency(v => ({ ...v, adminEmail: e.target.value }))} placeholder="Admin email" style={inputStyle}/>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div onClick={createAgencyDoc} style={{ flex: 2, padding: "9px", borderRadius: 8, textAlign: "center", cursor: "pointer", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e", fontWeight: 700, fontSize: 12 }}>Create Agency</div>
              <div onClick={loadAgencies} style={{ flex: 1, padding: "9px", borderRadius: 8, textAlign: "center", cursor: "pointer", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8", fontWeight: 700, fontSize: 12 }}>Refresh</div>
            </div>
          </Card>

          <Card style={{ marginBottom: 12 }}>
            <SLabel color="#a78bfa">Role Assignment</SLabel>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
              <input value={roleForm.agencyCode} onChange={e => setRoleForm(v => ({ ...v, agencyCode: e.target.value.toUpperCase() }))} placeholder="Agency code" style={inputStyle}/>
              <input value={roleForm.userId} onChange={e => setRoleForm(v => ({ ...v, userId: e.target.value }))} placeholder="Appwrite userId" style={inputStyle}/>
              <DarkSelect
                value={roleForm.role}
                onChange={val => setRoleForm(v => ({ ...v, role: val }))}
                options={ROLE_OPTIONS}
              />
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <div onClick={assignRole} style={{ flex: 1, padding: "9px", borderRadius: 8, textAlign: "center", cursor: "pointer", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa", fontWeight: 700, fontSize: 12 }}>Assign Role</div>
              <div onClick={() => loadRoleRows(roleForm.agencyCode)} style={{ flex: 1, padding: "9px", borderRadius: 8, textAlign: "center", cursor: "pointer", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.3)", color: "#38bdf8", fontWeight: 700, fontSize: 12 }}>Load Roles</div>
            </div>
            {roleRows.length === 0 && <div style={{ fontSize: 11, color: "#64748b" }}>No roles loaded — enter an agency code and tap Load Roles.</div>}
            {roleRows.map(r => (
              <div key={r.$id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ flex: 1, fontSize: 11, color: "#cbd5e1" }}>{r.agencyCode} · {r.userId || r.user_id}</div>
                <DarkSelect
                  value={r.role || 'pst'}
                  onChange={val => updateRole(r.$id, val)}
                  options={ROLE_OPTIONS}
                />
                <div onClick={() => revokeRole(r.$id)} style={{ fontSize: 11, color: "#f87171", cursor: "pointer", flexShrink: 0 }}>Revoke</div>
              </div>
            ))}
          </Card>

          {agenciesLoading && <div style={{ textAlign: "center", padding: "20px", fontSize: 12, color: "#64748b" }}>Loading agencies...</div>}
          {!agenciesLoading && agencies.length === 0 && (
            <div style={{ textAlign: "center", padding: "30px", color: "#64748b", fontSize: 13 }}>No agencies found. Create one above or check Appwrite permissions.</div>
          )}
          {filtered.map(a => (
            <div key={a.$id} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 16, padding: "14px 16px", marginBottom: 10, opacity: a.active === false ? 0.5 : 1 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: a.active !== false ? "#22c55e" : "#475569", flexShrink: 0 }}/>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#dde8f4" }}>{a.name}</span>
                    <span style={{ fontSize: 9, fontWeight: 800, color: typeColor[a.type] || "#64748b", background: (typeColor[a.type] || "#64748b") + "18", padding: "2px 8px", borderRadius: 5 }}>{a.type}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", paddingLeft: 15 }}>{a.code} · {a.region} · {a.adminName || "No admin set"}</div>
                  {a.adminEmail && <div style={{ fontSize: 10, color: "#475569", paddingLeft: 15, marginTop: 2 }}>{a.adminEmail}</div>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <div onClick={() => setShowGhostConfirm(a)} style={{ flex: 2, padding: "9px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: "rgba(234,179,8,0.1)", border: "1.5px solid rgba(234,179,8,0.3)", fontSize: 12, fontWeight: 700, color: "#eab308" }}>Enter as Support</div>
                <div onClick={() => toggleAgencyActive(a.$id, a.active !== false)} style={{ flex: 1, padding: "9px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 12, fontWeight: 700, color: a.active !== false ? "#f87171" : "#22c55e" }}>
                  {a.active !== false ? "Deactivate" : "Reactivate"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ANALYTICS ── */}
      {tab === "analytics" && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#64748b", marginBottom: 10 }}>Platform Overview</div>
          {platformStats ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Total Check-Ins",  value: platformStats.totalCheckins,    color: "#38bdf8" },
                { label: "AI PST Sessions",  value: platformStats.totalAISessions,  color: "#a78bfa" },
                { label: "PST Contacts",     value: platformStats.totalPSTContacts, color: "#22c55e" },
                { label: "Tool Uses",        value: platformStats.totalToolUsage,   color: "#eab308" },
              ].map((s, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 14, padding: "14px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: s.color, opacity: 0.5 }}/>
                  <div style={{ fontSize: 24, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value.toLocaleString()}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", marginTop: 2 }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: "#64748b" }}>All time · all agencies</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "30px", color: "#64748b", fontSize: 12 }}>Loading platform stats...</div>
          )}
          <Card>
            <SLabel color="#38bdf8">Active Agencies</SLabel>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#38bdf8" }}>{agencies.filter(a => a.active !== false).length}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>of {agencies.length} total agencies</div>
            {agencies.filter(a => a.active !== false).slice(0, 5).map(a => (
              <div key={a.$id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center", marginTop: 8 }}>
                <span style={{ fontSize: 12, color: "#8099b0" }}>{a.name}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: typeColor[a.type] || "#64748b" }}>{a.type}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* ── RESET QUEUE ── */}
      {tab === "reset-queue" && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#64748b", marginBottom: 8 }}>Password Reset Requests</div>
          <div onClick={loadResetRows} style={{ padding: "8px 14px", borderRadius: 8, cursor: "pointer", background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", fontSize: 11, fontWeight: 700, color: "#38bdf8", display: "inline-block", marginBottom: 12 }}>Refresh Queue</div>
          {resetRows.length === 0 && <div style={{ fontSize: 12, color: "#64748b", textAlign: "center", padding: "20px" }}>No open reset requests.</div>}
          {resetRows.map(r => (
            <div key={r.$id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 12, padding: "12px 14px", marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#cbd5e1" }}>{r.email || 'unknown email'}</span>
                <span style={{ fontSize: 10, color: "#64748b" }}>{r.agencyCode || 'NO AGENCY'}</span>
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>Role: {r.requestedRole || r.role || 'staff'} · {(r.$createdAt || '').slice(0, 10)}</div>
              <div onClick={() => resolveReset(r.$id)} style={{ display: "inline-block", padding: "7px 12px", borderRadius: 8, cursor: "pointer", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", fontSize: 11, fontWeight: 700, color: "#22c55e" }}>Mark Resolved</div>
            </div>
          ))}
        </div>
      )}

      {/* ── ACCESS LOG ── */}
      {tab === "access-log" && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.16em", textTransform: "uppercase", color: "#64748b", marginBottom: 8 }}>Platform Audit Log</div>
          <div onClick={loadAuditRows} style={{ padding: "8px 14px", borderRadius: 8, cursor: "pointer", background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", fontSize: 11, fontWeight: 700, color: "#38bdf8", display: "inline-block", marginBottom: 12 }}>Refresh Log</div>
          {auditRows.length === 0 && <div style={{ fontSize: 12, color: "#64748b", textAlign: "center", padding: "20px" }}>No audit entries yet.</div>}
          {auditRows.map((l, i) => (
            <div key={l.$id || i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.055)", borderRadius: 12, padding: "12px 14px", marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#cbd5e1" }}>{l.action}</span>
                <span style={{ fontSize: 10, color: "#64748b" }}>{(l.$createdAt || '').slice(0, 10)}</span>
              </div>
              {l.details && (
                <div style={{ fontSize: 11, color: "#64748b" }}>
                  {(() => { try { const d = JSON.parse(l.details); return Object.entries(d).map(([k, v]) => `${k}: ${v}`).join(' · '); } catch { return l.details; } })()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ghost confirm modal */}
      {showGhostConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 }}>
          <div style={{ background: "#0c1929", border: "1.5px solid rgba(234,179,8,0.3)", borderRadius: 20, padding: "28px 22px", maxWidth: 380, width: "100%" }}>
            <div style={{ fontSize: 22, textAlign: "center", marginBottom: 12 }}>🔐</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#eab308", textAlign: "center", marginBottom: 8 }}>Enter as Platform Support</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#dde8f4", textAlign: "center", marginBottom: 6 }}>{showGhostConfirm.name}</div>
            <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.65, marginBottom: 16, textAlign: "center" }}>You will see their admin dashboard as their admin sees it. A banner will be visible. This session will be logged.</div>
            <div style={{ background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.18)", borderRadius: 10, padding: "10px 14px", marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "#eab308", fontWeight: 700, marginBottom: 4 }}>Access rules:</div>
              <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.7 }}>
                ✓ View all admin tabs and data<br/>
                ✓ Upload rosters, edit resources<br/>
                ✓ Configure settings on their behalf<br/>
                ✗ Cannot view PST conversations<br/>
                ✗ Cannot view anonymous reports
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div onClick={() => setShowGhostConfirm(null)} style={{ flex: 1, padding: "12px", borderRadius: 11, cursor: "pointer", textAlign: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 13, fontWeight: 700, color: "#475569" }}>Cancel</div>
              <div onClick={() => { setShowGhostConfirm(null); onGhostLogin(showGhostConfirm); logAudit('ghost_login', { agency: showGhostConfirm.code, agencyName: showGhostConfirm.name }); }} style={{ flex: 2, padding: "12px", borderRadius: 11, cursor: "pointer", textAlign: "center", background: "rgba(234,179,8,0.12)", border: "1.5px solid rgba(234,179,8,0.35)", fontSize: 13, fontWeight: 700, color: "#eab308" }}>Enter Support View</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
