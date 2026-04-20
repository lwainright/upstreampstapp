// ============================================================
// SCREEN: IDVerifyScreen
// Upstream Initiative — First Responder ID Verification
// Runs after splash, before home. Optional — can skip.
// Uses Tesseract.js (loaded from CDN) for on-device OCR.
// No photo is ever sent to a server.
// ============================================================
import React, { useState, useRef } from 'react';

const KEYWORDS = [
  // EMS
  "ems","paramedic","emt","emergency medical","ambulance","medic",
  // Fire
  "fire","firefighter","fire department","fd","fire rescue",
  // Law Enforcement
  "police","law enforcement","officer","pd","sheriff","deputy",
  "trooper","detective","sergeant","lieutenant","constable",
  // Dispatch / Comms
  "dispatch","dispatcher","communications","911","comms",
  // Other
  "first responder","rescue","hazmat","tactical","swat",
  "corrections","probation","coast guard",
];

const TITLES = {
  ems:       { label: "EMS / Paramedic / EMT",     color: "#22c55e", icon: "🚑" },
  fire:      { label: "Fire / Firefighter",         color: "#f97316", icon: "🚒" },
  police:    { label: "Law Enforcement",            color: "#38bdf8", icon: "🚔" },
  dispatch:  { label: "Dispatch / Communications", color: "#a78bfa", icon: "📡" },
  rescue:    { label: "Rescue / Other",             color: "#eab308", icon: "🛟" },
};

function detectTitle(text) {
  const lower = text.toLowerCase();
  if (["paramedic","emt","ems","emergency medical","ambulance","medic"].some(k => lower.includes(k))) return "ems";
  if (["fire","firefighter","fire department","fd","fire rescue"].some(k => lower.includes(k))) return "fire";
  if (["police","officer","pd","sheriff","deputy","trooper","detective","sergeant","lieutenant","constable","law enforcement","swat","tactical"].some(k => lower.includes(k))) return "police";
  if (["dispatch","dispatcher","communications","911","comms"].some(k => lower.includes(k))) return "dispatch";
  if (["rescue","hazmat","coast guard","corrections","first responder"].some(k => lower.includes(k))) return "rescue";
  return null;
}

function loadTesseract() {
  return new Promise((resolve) => {
    if (window.Tesseract) { resolve(window.Tesseract); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    s.onload = () => resolve(window.Tesseract);
    document.head.appendChild(s);
  });
}

export default function IDVerifyScreen({ onVerified, onSkip }) {
  const [phase, setPhase] = useState("intro"); // intro | scanning | result | save
  const [scanning, setScanning] = useState(false);
  const [scanText, setScanText] = useState("");
  const [detectedTitle, setDetectedTitle] = useState(null);
  const [saveChoice, setSaveChoice] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  const handleImage = async (file) => {
    if (!file) return;
    setPhase("scanning");
    setScanning(true);
    setError("");

    try {
      const Tesseract = await loadTesseract();
      const { data: { text } } = await Tesseract.recognize(file, 'eng', {
        logger: () => {},
      });

      setScanText(text);
      const title = detectTitle(text);
      setDetectedTitle(title);
      setPhase("result");
    } catch (e) {
      setError("Could not read the image. Please try again with better lighting.");
      setPhase("intro");
    }
    setScanning(false);
  };

  const handleSaveChoice = (save) => {
    setSaveChoice(save);
    if (save) {
      try {
        localStorage.setItem("upstream_verified_fr", "true");
        localStorage.setItem("upstream_fr_title", detectedTitle || "rescue");
        localStorage.setItem("upstream_fr_verified_at", String(Date.now()));
      } catch (e) {}
    }
    onVerified(detectedTitle || "rescue");
  };

  const handleSkip = () => {
    try { localStorage.setItem("upstream_verify_skipped", "true"); } catch (e) {}
    onSkip();
  };

  const handleRetry = () => {
    setPhase("intro");
    setDetectedTitle(null);
    setScanText("");
    setError("");
  };

  const titleInfo = detectedTitle ? TITLES[detectedTitle] : null;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg,#060e1b 0%,#0b1829 55%,#07101e 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={e => handleImage(e.target.files?.[0])}
        style={{ display: "none" }}
      />

      {/* ── INTRO ── */}
      {phase === "intro" && (
        <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 4 }}>🪪</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "#dde8f4", textAlign: "center", lineHeight: 1.3 }}>
            Are you a First Responder?
          </div>
          <div style={{ fontSize: 14, color: "#8099b0", textAlign: "center", lineHeight: 1.7, maxWidth: 340 }}>
            Upstream Approach is <span style={{ color: "#22c55e", fontWeight: 700 }}>free</span> for verified first responders. Take a photo of your ID badge to unlock first responder resources.
          </div>

          <div style={{ background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.15)", borderRadius: 14, padding: "14px 18px", width: "100%", fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>
            🔒 <strong style={{ color: "#8099b0" }}>Your privacy is protected.</strong> Photos are processed entirely on your device. Nothing is sent to any server. We only read text — we never store your photo.
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "12px 16px", width: "100%", fontSize: 13, color: "#f87171" }}>
              {error}
            </div>
          )}

          <div
            onClick={() => fileRef.current?.click()}
            style={{ width: "100%", padding: "16px", borderRadius: 14, cursor: "pointer", textAlign: "center", background: "rgba(56,189,248,0.12)", border: "1.5px solid rgba(56,189,248,0.35)", fontSize: 15, fontWeight: 800, color: "#38bdf8", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
          >
            📷 Take Photo of ID Badge
          </div>

          <div style={{ fontSize: 13, color: "#475569", textAlign: "center" }}>
            or
          </div>

          <div
            onClick={handleSkip}
            style={{ width: "100%", padding: "14px", borderRadius: 14, cursor: "pointer", textAlign: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 14, fontWeight: 600, color: "#475569" }}
          >
            Skip for now
          </div>

          <div style={{ fontSize: 11, color: "#334155", textAlign: "center", lineHeight: 1.6 }}>
            You can always verify later in Settings.
          </div>
        </div>
      )}

      {/* ── SCANNING ── */}
      {phase === "scanning" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", border: "3px solid rgba(56,189,248,0.2)", borderTop: "3px solid #38bdf8", animation: "spin 1s linear infinite" }}/>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#dde8f4" }}>Reading your badge...</div>
          <div style={{ fontSize: 13, color: "#475569" }}>This stays on your device</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── RESULT ── */}
      {phase === "result" && (
        <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          {detectedTitle ? (
            <>
              <div style={{ fontSize: 56 }}>{titleInfo.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#dde8f4", textAlign: "center" }}>
                First Responder Verified ✓
              </div>
              <div style={{ background: `${titleInfo.color}18`, border: `1.5px solid ${titleInfo.color}40`, borderRadius: 14, padding: "14px 24px", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: titleInfo.color }}>{titleInfo.label}</div>
              </div>
              <div style={{ fontSize: 14, color: "#8099b0", textAlign: "center", lineHeight: 1.6 }}>
                First responder resources are now unlocked for you.
              </div>

              {/* Save choice */}
              <div style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#dde8f4", marginBottom: 6 }}>Save verification to this device?</div>
                <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, marginBottom: 16 }}>If saved, you won't need to verify again on this device. Stored locally only — never shared.</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div onClick={() => handleSaveChoice(true)} style={{ flex: 1, padding: "12px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: "rgba(34,197,94,0.12)", border: "1.5px solid rgba(34,197,94,0.3)", fontSize: 13, fontWeight: 700, color: "#22c55e" }}>
                    Yes, save it
                  </div>
                  <div onClick={() => handleSaveChoice(false)} style={{ flex: 1, padding: "12px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 13, fontWeight: 600, color: "#475569" }}>
                    Not now
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 48 }}>🤔</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#dde8f4", textAlign: "center" }}>
                Couldn't detect a first responder ID
              </div>
              <div style={{ fontSize: 13, color: "#8099b0", textAlign: "center", lineHeight: 1.7, maxWidth: 320 }}>
                Make sure your badge is well-lit and the text is clearly visible. Try again or enter an agency code instead.
              </div>
              <div onClick={handleRetry} style={{ width: "100%", padding: "14px", borderRadius: 14, cursor: "pointer", textAlign: "center", background: "rgba(56,189,248,0.12)", border: "1.5px solid rgba(56,189,248,0.3)", fontSize: 14, fontWeight: 700, color: "#38bdf8" }}>
                Try Again
              </div>
              <div onClick={handleSkip} style={{ fontSize: 13, color: "#475569", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
                Skip for now
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}
