// ============================================================
// SCREEN: HomeCustomizationScreen
// Upstream Initiative — Home Screen Customization
// Pin/hide/reorder tiles — saved to localStorage
// ============================================================
import React, { useState, useEffect } from 'react';
import { ScreenSingle } from './ui.jsx';

export const DEFAULT_TILES = [
  { key: "aichat",           label: "AI Peer Support",         icon: "🤖", color: "#ef4444" },
  { key: "humanpst",         label: "Talk to Someone",          icon: "🤝", color: "#22c55e" },
  { key: "breathing",        label: "Box Breathing",            icon: "🫁", color: "#22c55e" },
  { key: "grounding",        label: "5-4-3-2-1 Grounding",     icon: "🌿", color: "#38bdf8" },
  { key: "ptsd",             label: "Follow the Light",         icon: "💙", color: "#38bdf8" },
  { key: "journal",          label: "Journal",                  icon: "📓", color: "#a78bfa" },
  { key: "hrv",              label: "HRV Check",                icon: "💓", color: "#f87171" },
  { key: "dump90",           label: "90-Second Dump",           icon: "⏱",  color: "#f97316" },
  { key: "afteraction",      label: "After-Action Reset",       icon: "🔄", color: "#38bdf8" },
  { key: "highacuity",       label: "High Acuity",              icon: "⚠️", color: "#ef4444" },
  { key: "resources",        label: "Resources",                icon: "📚", color: "#38bdf8" },
  { key: "safetyvault",      label: "Safety Vault",             icon: "🔒", color: "#475569" },
  { key: "familyconnect",    label: "Family Connect",           icon: "🔗", color: "#22c55e" },
  { key: "shiftcheck",       label: "Shift Check-In",           icon: "📋", color: "#eab308" },
  { key: "tools",            label: "All Tools",                icon: "🛠",  color: "#64748b" },
];

export function getHomeLayout() {
  try {
    const stored = localStorage.getItem("upstream_home_layout");
    if (stored) return JSON.parse(stored);
  } catch(e) {}
  return DEFAULT_TILES.map(t => ({ ...t, visible: true, pinned: false }));
}

export function saveHomeLayout(layout) {
  try { localStorage.setItem("upstream_home_layout", JSON.stringify(layout)); } catch(e) {}
}

export default function HomeCustomizationScreen({ navigate, agency, logoSrc }) {
  const [layout, setLayout] = useState(() => {
    const saved = getHomeLayout();
    // Merge any new tiles not in saved layout
    const savedKeys = new Set(saved.map(t => t.key));
    const newTiles = DEFAULT_TILES.filter(t => !savedKeys.has(t.key)).map(t => ({ ...t, visible: true, pinned: false }));
    return [...saved, ...newTiles];
  });
  const [saved, setSaved] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);

  const toggleVisible = (key) => {
    setLayout(prev => prev.map(t => t.key === key ? { ...t, visible: !t.visible } : t));
  };

  const togglePin = (key) => {
    setLayout(prev => prev.map(t => t.key === key ? { ...t, pinned: !t.pinned, visible: true } : t));
  };

  const moveUp = (index) => {
    if (index === 0) return;
    setLayout(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index) => {
    if (index === layout.length - 1) return;
    setLayout(prev => {
      const next = [...prev];
      [next[index + 1], next[index]] = [next[index], next[index + 1]];
      return next;
    });
  };

  const handleSave = () => {
    saveHomeLayout(layout);
    setSaved(true);
    setTimeout(() => { setSaved(false); navigate("home"); }, 1200);
  };

  const handleReset = () => {
    const reset = DEFAULT_TILES.map(t => ({ ...t, visible: true, pinned: false }));
    setLayout(reset);
    saveHomeLayout(reset);
  };

  const pinned = layout.filter(t => t.pinned);
  const visible = layout.filter(t => t.visible && !t.pinned);
  const hidden = layout.filter(t => !t.visible);

  return (
    <ScreenSingle headerProps={{ onBack: () => navigate("home"), agencyName: agency?.name, logoSrc }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#dde8f4", marginBottom: 4 }}>Customize Your Home</div>
      <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, marginBottom: 20 }}>
        Pin your most-used tools to the top. Hide what you don't need. Reorder with the arrows. Everything is still available in Tools.
      </div>

      {/* Pinned */}
      {pinned.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#eab308", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>📌 Pinned — Always at top</div>
          {pinned.map((tile, i) => (
            <TileRow key={tile.key} tile={tile} index={i} total={pinned.length}
              onTogglePin={() => togglePin(tile.key)} onToggleVisible={() => toggleVisible(tile.key)}
              onMoveUp={() => moveUp(layout.indexOf(tile))} onMoveDown={() => moveDown(layout.indexOf(tile))} isPinned/>
          ))}
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0 16px" }}/>
        </>
      )}

      {/* Visible */}
      <div style={{ fontSize: 10, fontWeight: 800, color: "#475569", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>Visible</div>
      {visible.map((tile, i) => (
        <TileRow key={tile.key} tile={tile} index={i} total={visible.length}
          onTogglePin={() => togglePin(tile.key)} onToggleVisible={() => toggleVisible(tile.key)}
          onMoveUp={() => moveUp(layout.indexOf(tile))} onMoveDown={() => moveDown(layout.indexOf(tile))}/>
      ))}

      {/* Hidden */}
      {hidden.length > 0 && (
        <>
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0 16px" }}/>
          <div style={{ fontSize: 10, fontWeight: 800, color: "#334155", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>Hidden — tap eye to restore</div>
          {hidden.map((tile, i) => (
            <TileRow key={tile.key} tile={tile} index={i} total={hidden.length}
              onTogglePin={() => togglePin(tile.key)} onToggleVisible={() => toggleVisible(tile.key)}
              onMoveUp={() => {}} onMoveDown={() => {}} isHidden/>
          ))}
        </>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
        <div onClick={handleReset} style={{ flex: 1, padding: "12px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 12, fontWeight: 700, color: "#475569" }}>
          Reset to default
        </div>
        <div onClick={handleSave} style={{ flex: 2, padding: "12px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: saved ? "rgba(34,197,94,0.15)" : "rgba(56,189,248,0.12)", border: `1.5px solid ${saved ? "rgba(34,197,94,0.4)" : "rgba(56,189,248,0.35)"}`, fontSize: 13, fontWeight: 800, color: saved ? "#22c55e" : "#38bdf8" }}>
          {saved ? "✓ Saved!" : "Save & go home"}
        </div>
      </div>
    </ScreenSingle>
  );
}

function TileRow({ tile, onTogglePin, onToggleVisible, onMoveUp, onMoveDown, isPinned, isHidden }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, marginBottom: 6, background: isPinned ? "rgba(234,179,8,0.06)" : isHidden ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.03)", border: `1px solid ${isPinned ? "rgba(234,179,8,0.2)" : isHidden ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.07)"}`, opacity: isHidden ? 0.5 : 1 }}>
      <span style={{ fontSize: 20, flexShrink: 0 }}>{tile.icon}</span>
      <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: isHidden ? "#334155" : "#dde8f4" }}>{tile.label}</div>

      {/* Move up/down */}
      {!isHidden && (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div onClick={onMoveUp} style={{ width: 24, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#475569", fontSize: 12 }}>▲</div>
          <div onClick={onMoveDown} style={{ width: 24, height: 20, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#475569", fontSize: 12 }}>▼</div>
        </div>
      )}

      {/* Pin */}
      {!isHidden && (
        <div onClick={onTogglePin} style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: isPinned ? "rgba(234,179,8,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${isPinned ? "rgba(234,179,8,0.3)" : "rgba(255,255,255,0.07)"}`, fontSize: 14 }}>
          📌
        </div>
      )}

      {/* Show/hide */}
      <div onClick={onToggleVisible} style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 14 }}>
        {isHidden ? "👁" : "🚫"}
      </div>
    </div>
  );
}
