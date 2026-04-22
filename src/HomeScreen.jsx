// ============================================================
// SCREEN: HomeScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect } from 'react';
import { Screen, Card, SLabel } from './ui.jsx';
import { useLayoutConfig } from './utils.js';
import { BoltIcon, ClockIcon, TimerIcon, ToolsIcon, HeartIcon, MapIcon } from './icons.jsx';

function CrewBar() {
  const bars = [
    { color: "#22c55e", pct: 48 },
    { color: "#eab308", pct: 30 },
    { color: "#f97316", pct: 14 },
    { color: "#ef4444", pct: 8 },
  ];
  return (
    <div style={{ display: "flex", gap: 4, height: 32, alignItems: "flex-end" }}>
      {Array.from({ length: 8 }).map((_, i) => {
        const level = i < 4 ? 0 : i < 6 ? 1 : i < 7 ? 2 : 3;
        const b = bars[level];
        return (
          <div key={i} style={{
            flex: 1, borderRadius: 4,
            background: b.color + "30",
            border: `1px solid ${b.color}50`,
            height: `${60 + Math.random() * 40}%`,
          }}/>
        );
      })}
    </div>
  );
}

export default function HomeScreen({
  navigate,
  gaugeLevel,
  setGaugeLevel,
  agency,
  role,
  pstAlert,
  pstAlertMsg,
  criticalIncident,
  agencyNotification,
  setAgencyNotification,
  logoSrc,
}) {
  const [pulse, setPulse] = useState(false);
  const [time, setTime] = useState(new Date());
  const lc = useLayoutConfig();

  const hr = time.getHours();
  const greeting =
    hr >= 5 && hr < 12 ? "Good Morning" :
    hr >= 12 && hr < 17 ? "Good Afternoon" :
    hr >= 17 && hr < 21 ? "Good Evening" :
    "Good Night";

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 600);
    return () => clearTimeout(t);
  }, [gaugeLevel]);

  const gc = [
    { label: "Great",    color: "#22c55e", bg: "rgba(34,197,94,0.12)",  glow: "0 0 24px rgba(34,197,94,0.5)"  },
    { label: "Striving", color: "#eab308", bg: "rgba(234,179,8,0.12)",  glow: "0 0 24px rgba(234,179,8,0.5)"  },
    { label: "Not Well", color: "#f97316", bg: "rgba(249,115,22,0.12)", glow: "0 0 24px rgba(249,115,22,0.5)" },
    { label: "Ill",      color: "#ef4444", bg: "rgba(239,68,68,0.12)",  glow: "0 0 24px rgba(239,68,68,0.5)"  },
  ];
  const cur = gc[gaugeLevel];

  const isAdminRole = role === "supervisor" || role === "admin" || role === "platform";
  const isPST = role === "pst" || role === "admin";

  const HomeTile = ({ icon, label, color, bg, border, badge, locked, onClick }) => (
    <div
      onClick={onClick}
      style={{
        background: bg || "rgba(255,255,255,0.03)",
        border: `1.5px solid ${border || "rgba(255,255,255,0.08)"}`,
        borderRadius: 18, padding: "18px 12px",
        cursor: "pointer", display: "flex",
        flexDirection: "column", alignItems: "center",
        gap: 10, position: "relative", minHeight: 100,
        justifyContent: "center",
        opacity: locked ? 0.5 : 1,
      }}
    >
      {badge && (
        <div style={{
          position: "absolute", top: 8, right: 8,
          fontSize: 8, fontWeight: 800, color, letterSpacing: "0.08em",
          background: color + "20", padding: "2px 6px", borderRadius: 5,
        }}>
          {badge}
        </div>
      )}
      {locked && <div style={{ position: "absolute", top: 8, left: 8, fontSize: 12 }}>🔒</div>}
      <div style={{ color, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
      <div style={{
        fontSize: 11, fontWeight: 700, color: "#dde8f4",
        textAlign: "center", lineHeight: 1.4, whiteSpace: "pre-line",
      }}>
        {label}
      </div>
    </div>
  );

  return (
    <Screen headerProps={{ agencyName: agency?.name, logoSrc }}>

      {criticalIncident && (
        <div className={lc.isDesktop ? "full-width" : ""} style={{
          background: "#07080f", border: "2px solid rgba(148,163,184,0.25)",
          borderRadius: 14, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#334155", border: "2px solid #64748b", flexShrink: 0 }}/>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: "#f1f5f9", letterSpacing: "0.08em" }}>CRITICAL INCIDENT SUPPORT AVAILABLE</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Your PST team is standing by. Human PST is recommended.</div>
          </div>
        </div>
      )}

      {pstAlert && !criticalIncident && (
        <div className={lc.isDesktop ? "full-width" : ""} style={{
          background: "rgba(139,92,246,0.1)", border: "1.5px solid rgba(139,92,246,0.3)",
          borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#8b5cf6", boxShadow: "0 0 8px rgba(139,92,246,0.8)", flexShrink: 0 }}/>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#c4b5fd" }}>Peer Support Available</div>
            {pstAlertMsg
              ? <div style={{ fontSize: 12, color: "#a78bfa", marginTop: 3, lineHeight: 1.5 }}>{pstAlertMsg}</div>
              : <div style={{ fontSize: 12, color: "#7c5cbf", marginTop: 2 }}>Your PST team is available if you want to talk.</div>
            }
          </div>
        </div>
      )}

      {agencyNotification && (
        <div className={lc.isDesktop ? "full-width" : ""} style={{
          background: agencyNotification.priority === "Urgent" ? "rgba(239,68,68,0.1)" : agencyNotification.priority === "Important" ? "rgba(234,179,8,0.1)" : "rgba(56,189,248,0.08)",
          border: `1.5px solid ${agencyNotification.priority === "Urgent" ? "rgba(239,68,68,0.3)" : agencyNotification.priority === "Important" ? "rgba(234,179,8,0.3)" : "rgba(56,189,248,0.2)"}`,
          borderRadius: 14, padding: "12px 16px", display: "flex", gap: 12, alignItems: "flex-start",
        }}>
          <div style={{ fontSize: 18, flexShrink: 0 }}>
            {agencyNotification.priority === "Urgent" ? "🚨" : agencyNotification.priority === "Important" ? "⚠️" : "📢"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748b", marginBottom: 4 }}>
              Agency Notification · {agencyNotification.priority}
            </div>
            <div style={{ fontSize: 13, color: "#dde8f4", lineHeight: 1.6 }}>{agencyNotification.message}</div>
            <div style={{ fontSize: 10, color: "#3d5268", marginTop: 4 }}>{agencyNotification.timestamp}</div>
          </div>
          <div onClick={() => setAgencyNotification(null)} style={{ cursor: "pointer", color: "#64748b", fontSize: 18, lineHeight: 1 }}>×</div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gridColumn: lc.isDesktop ? "1/-1" : "auto" }}>
        <div>
          <div style={{ fontSize: 11, color: "#0ea5e9", letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 700 }}>{greeting}</div>
          <div style={{ fontSize: lc.isDesktop ? 24 : 21, fontWeight: 800, color: "#dde8f4", marginTop: 3 }}>How are you doing today?</div>
          <div style={{ fontSize: 12, color: "#8099b0", marginTop: 2 }}>{time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isAdminRole && (
            <div onClick={() => navigate("admintools")} title="Admin Tools" style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.25)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#eab308", fontSize: 16 }}>⚙️</div>
          )}
          {isPST && (
            <div onClick={() => navigate("pstpanel")} title="PST Panel" style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#a78bfa", fontSize: 16 }}>🛡️</div>
          )}
          <div onClick={() => setGaugeLevel((gaugeLevel + 1) % 4)} style={{ cursor: "pointer", userSelect: "none", background: cur.bg, border: `1.5px solid ${cur.color}50`, borderRadius: 16, padding: "10px 13px", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, boxShadow: pulse ? cur.glow : "none", transition: "box-shadow 0.3s" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: cur.color, letterSpacing: "0.1em", textTransform: "uppercase" }}>{cur.label}</div>
            <div style={{ display: "flex", gap: 3 }}>
              {gc.map((g, i) => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i === gaugeLevel ? g.color : "rgba(255,255,255,0.08)", transition: "background 0.3s" }}/>
              ))}
            </div>
            <div style={{ fontSize: 9, color: "#8099b0", letterSpacing: "0.08em" }}>SHIFT STREAM</div>
          </div>
        </div>
      </div>

      {/* PTSD Interruption — full width above tiles */}
      <div className={lc.isDesktop ? "full-width" : ""} onClick={() => navigate("ptsd")} style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(239,68,68,0.15)", border: "1.5px solid rgba(239,68,68,0.4)", borderRadius: 14, padding: "13px 18px", cursor: "pointer" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#ef4444" }}>PTSD Interruption</div>
          <div style={{ fontSize: 11, color: "#f87171", marginTop: 1 }}>21 grounding tools — tap when a call won't leave your head</div>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </div>

      <div className={lc.isDesktop ? "full-width" : ""} style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        <HomeTile icon={<BoltIcon />}  label={"AI Peer\nSupport"}  color="#ef4444" bg="rgba(239,68,68,0.1)"    border="rgba(239,68,68,0.22)"   badge="URGENT"   onClick={() => navigate("aichat")} />
        <HomeTile icon={<ClockIcon />} label={"Shift\nCheck"}      color="#38bdf8" bg="rgba(56,189,248,0.08)"  border="rgba(56,189,248,0.2)"   badge="CHECK-IN" onClick={() => navigate("shiftcheck")} />
        <HomeTile icon={<TimerIcon />} label={"90-Second\nDump"}   color="#f97316" bg="rgba(249,115,22,0.08)"  border="rgba(249,115,22,0.2)"   badge="VENT"     onClick={() => navigate("dump90")} />
        <HomeTile icon={<ToolsIcon />} label={"Coping\nTools"}     color="#22c55e" bg="rgba(34,197,94,0.08)"   border="rgba(34,197,94,0.2)"                     onClick={() => navigate("tools")} />
        <HomeTile icon={<HeartIcon />} label={"Human\nPST"}        color="#a78bfa" bg="rgba(167,139,250,0.08)" border="rgba(167,139,250,0.2)"  locked={!agency} onClick={() => navigate(agency ? "humanpst" : "agencycode")} />
        <HomeTile icon={<MapIcon />}   label="Resources"            color="#64748b" bg="rgba(100,116,139,0.07)" border="rgba(100,116,139,0.15)"                  onClick={() => navigate("resources")} />
      </div>

      {agency ? (
        <Card className={lc.isDesktop ? "full-width" : ""}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <SLabel>Crew Stream</SLabel>
            <span style={{ fontSize: 11, color: "#2d4a66" }}>Anonymous · 8 on shift</span>
          </div>
          <CrewBar />
        </Card>
      ) : (
        <div onClick={() => navigate("agencycode")} className={lc.isDesktop ? "full-width" : ""} style={{ background: "rgba(56,189,248,0.04)", border: "1px solid rgba(56,189,248,0.12)", borderRadius: 16, padding: "16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#38bdf8", fontSize: 22 }}>🏢</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#dde8f4" }}>Join Your Agency</div>
            <div style={{ fontSize: 12, color: "#8099b0", marginTop: 2 }}>Enter your agency code to unlock Human PST access</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a52" strokeWidth="2.5" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      )}

      <div className={lc.isDesktop ? "full-width" : ""} style={{ background: "rgba(56,189,248,0.04)", border: "1px solid rgba(56,189,248,0.1)", borderRadius: 12, padding: "12px 14px" }}>
        <div style={{ fontSize: 12, color: "#38bdf8", fontWeight: 600, marginBottom: 4 }}>🛡 Fully Anonymous</div>
        <div style={{ fontSize: 12, color: "#2d4a66", lineHeight: 1.6 }}>No login required. Your check-ins and conversations are private. AI PST has no access to your identity or contact info.</div>
      </div>

    </Screen>
  );
}
