import React, { useState, useEffect } from 'react';
import { Screen, Card, SLabel } from './ui.jsx';
import { useLayoutConfig } from './utils.js';
import { BuildingIcon, HeartIcon, BoltIcon, ClockIcon, BreathIcon, MapIcon, ToolsIcon } from './icons.jsx';

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

  const hr = time.getHours();
  const greeting =
    hr < 6  ? "Night Shift" :
    hr < 12 ? "Morning Shift" :
    hr < 18 ? "Day Shift" :
    "Evening Shift";

  const isAdminRole = role === "supervisor" || role === "admin" || role === "platform";
  const isPST = role === "pst" || role === "admin";

  const HomeTile = ({ icon, label, color, bg, border, badge, locked, onClick }) => (
    <div
      onClick={onClick}
      style={{
        background: bg || "rgba(255,255,255
