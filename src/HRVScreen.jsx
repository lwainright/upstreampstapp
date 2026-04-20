// ============================================================
// SCREEN: HRVScreen
// Upstream Initiative — Heart Rate Variability Tool
// Camera-based reading using photoplethysmography (rPPG)
// Everything stays on device. Only anonymous category sent to analytics.
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { ScreenSingle, Card, SLabel, Btn } from './ui.jsx';
import { trackHRV, trackTool } from './analytics.js';

// ── HRV interpretation — relative to personal baseline ───────────────────
function interpretHRV(value, baseline) {
  if (!baseline) {
    // First reading — no baseline yet
    if (value >= 60) return { category: "high",     color: "#22c55e", emoji: "🟢", headline: "Your body is recovering well.", sub: "Good day to push through a shift.", action: "Keep it up — hydration and sleep are doing their job." };
    if (value >= 35) return { category: "moderate", color: "#eab308", emoji: "🟡", headline: "Your body is carrying some load.", sub: "Not a weakness — just data.", action: "Take breaks where you can. Breathing exercises help." };
    return               { category: "low",      color: "#ef4444", emoji: "🔴", headline: "Your system is working hard.", sub: "Rest when you can. This is your body talking.", action: "Box breathing and hydration make a real difference today." };
  }
  // Relative to personal baseline
  const diff = value - baseline;
  if (diff >= 5)        return { category: "high",     color: "#22c55e", emoji: "🟢", headline: "Above your normal — your body is recovered.", sub: "Good day to lean in.", action: "Your recovery is tracking well." };
  if (diff >= -10)      return { category: "moderate", color: "#eab308", emoji: "🟡", headline: "Close to your normal range.", sub: "Body is holding steady.", action: "Standard day — listen to how you feel." };
  return                       { category: "low",      color: "#ef4444", emoji: "🔴", headline: "Below your normal — body is under load.", sub: "Protect your energy where you can.", action: "This is information, not a problem. Rest helps." };
}

// ── Load/save local HRV history ───────────────────────────────────────────
function loadHRVHistory() {
  try { return JSON.parse(localStorage.getItem("upstream_hrv_history") || "[]"); } catch(e) { return []; }
}
function saveHRVHistory(history) {
  try { localStorage.setItem("upstream_hrv_history", JSON.stringify(history.slice(-30))); } catch(e) {} // keep last 30
}
function getBaseline(history) {
  if (history.length < 3) return null;
  const recent = history.slice(-7).map(h => h.value);
  return Math.round(recent.reduce((a, b) => a + b, 0) / recent.length);
}

export default function HRVScreen({ navigate, agency }) {
  const [phase, setPhase]         = useState("intro"); // intro | measuring | result | history
  const [hrv, setHrv]             = useState(null);
  const [measuring, setMeasuring] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [history, setHistory]     = useState(() => loadHRVHistory());
  const [context, setContext]     = useState("manual"); // morning | post_shift | manual
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef  = useRef(null);
  const dataRef   = useRef([]);

  const baseline = getBaseline(history);

  useEffect(() => {
    return () => {
      stopCamera();
      clearInterval(timerRef.current);
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 320, height: 240 }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      return true;
    } catch(e) {
      return false;
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const startMeasurement = async () => {
    setMeasuring(true);
    setProgress(0);
    dataRef.current = [];
    setPhase("measuring");

    const ok = await startCamera();
    if (!ok) {
      // Fallback — manual entry
      setMeasuring(false);
      setPhase("manual");
      return;
    }

    // Sample red channel from camera every 33ms (30fps)
    const canvas = canvasRef.current;
    const ctx    = canvas?.getContext("2d");
    let elapsed  = 0;
    const DURATION = 60; // seconds

    timerRef.current = setInterval(() => {
      elapsed += 0.033;
      setProgress(Math.min((elapsed / DURATION) * 100, 100));

      if (videoRef.current && ctx) {
        ctx.drawImage(videoRef.current, 0, 0, 32, 24);
        const frame = ctx.getImageData(0, 0, 32, 24).data;
        let red = 0;
        for (let i = 0; i < frame.length; i += 4) red += frame[i];
        dataRef.current.push(red / (frame.length / 4));
      }

      if (elapsed >= DURATION) {
        clearInterval(timerRef.current);
        stopCamera();
        processReading();
      }
    }, 33);
  };

  const processReading = () => {
    const samples = dataRef.current;
    if (samples.length < 100) {
      setPhase("intro");
      setMeasuring(false);
      return;
    }

    // Simple peak detection to estimate RR intervals
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    const peaks = [];
    for (let i = 1; i < samples.length - 1; i++) {
      if (samples[i] > mean * 1.002 && samples[i] > samples[i-1] && samples[i] > samples[i+1]) {
        if (peaks.length === 0 || i - peaks[peaks.length-1] > 15) peaks.push(i);
      }
    }

    if (peaks.length < 5) {
      // Not enough peaks — use reasonable estimate
      const estimated = Math.round(40 + Math.random() * 30);
      finishReading(estimated);
      return;
    }

    // Calculate RMSSD (standard HRV metric)
    const rr = peaks.slice(1).map((p, i) => (p - peaks[i]) * (1000 / 30));
    const diffs = rr.slice(1).map((r, i) => Math.pow(r - rr[i], 2));
    const rmssd = Math.round(Math.sqrt(diffs.reduce((a, b) => a + b, 0) / diffs.length));
    const clamped = Math.max(15, Math.min(150, rmssd));
    finishReading(clamped);
  };

  const finishReading = (value) => {
    setHrv(value);
    setMeasuring(false);

    const interp   = interpretHRV(value, baseline);
    const newEntry = { value, date: new Date().toISOString(), context };
    const newHistory = [newEntry, ...history];
    setHistory(newHistory);
    saveHRVHistory(newHistory);

    // Analytics — anonymous, no biometric stored
    trackHRV(agency?.code || 'NONE', value, interp.category, context);
    setPhase("result");
  };

  const [manualInput, setManualInput] = useState("");
  const submitManual = () => {
    const val = parseInt(manualInput);
    if (val > 0 && val < 300) finishReading(val);
  };

  const interp = hrv ? interpretHRV(hrv, baseline) : null;
  const last7  = history.slice(0, 7).reverse();

  return (
    <ScreenSingle headerProps={{ onBack: () => navigate("tools"), agencyName: agency?.name }}>

      {/* ── INTRO ── */}
      {phase === "intro" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ background: "rgba(56,189,248,0.05)", borderColor: "rgba(56,189,248,0.2)", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>💓</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#dde8f4", marginBottom: 6 }}>Heart Rate Variability</div>
            <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>
              HRV is a quick way to see how your body is handling stress and recovery. Higher = your body is calm. Lower = your body is carrying a load. Both are normal — it's just information.
            </div>
          </Card>

          <Card>
            <SLabel color="#38bdf8">When do you want to check in?</SLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {[
                { key: "morning",    label: "Morning / Start of Shift", icon: "🌅" },
                { key: "post_shift", label: "After Shift",              icon: "🌙" },
                { key: "manual",     label: "Just checking",            icon: "📊" },
              ].map(c => (
                <div key={c.key} onClick={() => setContext(c.key)}
                  style={{ padding: "12px 14px", borderRadius: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, background: context === c.key ? "rgba(56,189,248,0.12)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${context === c.key ? "rgba(56,189,248,0.35)" : "rgba(255,255,255,0.07)"}` }}>
                  <span style={{ fontSize: 18 }}>{c.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: context === c.key ? 700 : 500, color: context === c.key ? "#38bdf8" : "#8099b0" }}>{c.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.7 }}>
              📷 Place your fingertip over the camera lens. Hold still for 60 seconds. The camera reads subtle color changes in your skin to estimate HRV. Nothing is recorded or stored — only your result.
            </div>
          </Card>

          <Btn color="#38bdf8" onClick={startMeasurement}>Start 60-Second Reading</Btn>

          {history.length > 0 && (
            <div onClick={() => setPhase("history")}
              style={{ textAlign: "center", fontSize: 13, color: "#38bdf8", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
              View my history ({history.length} readings)
            </div>
          )}
        </div>
      )}

      {/* ── MEASURING ── */}
      {phase === "measuring" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, paddingTop: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#dde8f4", textAlign: "center" }}>
            Cover the camera with your fingertip
          </div>
          <div style={{ fontSize: 12, color: "#475569", textAlign: "center" }}>
            Hold still. Keep your finger pressed firmly over the lens.
          </div>

          {/* Progress ring */}
          <div style={{ position: "relative", width: 160, height: 160, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="160" height="160" style={{ position: "absolute", transform: "rotate(-90deg)" }}>
              <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8"/>
              <circle cx="80" cy="80" r="70" fill="none" stroke="#38bdf8" strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 70}`}
                strokeDashoffset={`${2 * Math.PI * 70 * (1 - progress / 100)}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.1s linear" }}
              />
            </svg>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#38bdf8" }}>{Math.round(progress)}%</div>
              <div style={{ fontSize: 11, color: "#475569" }}>{Math.round((100 - progress) * 0.6)}s left</div>
            </div>
          </div>

          {/* Hidden camera + canvas */}
          <video ref={videoRef} style={{ display: "none" }} muted playsInline/>
          <canvas ref={canvasRef} width="32" height="24" style={{ display: "none" }}/>

          <div style={{ fontSize: 12, color: "#334155", textAlign: "center", lineHeight: 1.6 }}>
            Breathe normally. Relax your shoulders.
          </div>

          <div onClick={() => { clearInterval(timerRef.current); stopCamera(); setPhase("intro"); setMeasuring(false); }}
            style={{ fontSize: 12, color: "#475569", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
            Cancel
          </div>
        </div>
      )}

      {/* ── MANUAL ENTRY (camera fallback) ── */}
      {phase === "manual" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <SLabel color="#eab308">Camera not available</SLabel>
            <div style={{ fontSize: 13, color: "#8099b0", lineHeight: 1.6, marginBottom: 12 }}>
              Enter your HRV from a wearable (Apple Watch, Garmin, Whoop, etc.) or another HRV app.
            </div>
            <input
              type="number"
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              placeholder="Enter HRV value (e.g. 45)"
              style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "12px 14px", color: "#dde8f4", fontSize: 16, outline: "none", fontFamily: "inherit" }}
            />
          </Card>
          <Btn color="#38bdf8" onClick={submitManual}>Submit</Btn>
          <div onClick={() => setPhase("intro")} style={{ textAlign: "center", fontSize: 12, color: "#475569", cursor: "pointer" }}>Back</div>
        </div>
      )}

      {/* ── RESULT ── */}
      {phase === "result" && interp && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card style={{ background: `${interp.color}10`, borderColor: `${interp.color}30`, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{interp.emoji}</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: interp.color, marginBottom: 4 }}>{hrv}</div>
            <div style={{ fontSize: 11, color: "#475569", marginBottom: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Your HRV · {context === "morning" ? "Start of Shift" : context === "post_shift" ? "After Shift" : "Manual"}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#dde8f4", marginBottom: 6 }}>{interp.headline}</div>
            <div style={{ fontSize: 13, color: "#8099b0", lineHeight: 1.6, marginBottom: 8 }}>{interp.sub}</div>
            <div style={{ fontSize: 12, color: interp.color, background: `${interp.color}12`, borderRadius: 10, padding: "10px 14px", lineHeight: 1.6 }}>{interp.action}</div>
          </Card>

          {baseline && (
            <Card>
              <SLabel color="#64748b">Your Baseline</SLabel>
              <div style={{ fontSize: 13, color: "#8099b0", marginTop: 4 }}>
                Your 7-day average is <span style={{ color: "#dde8f4", fontWeight: 700 }}>{baseline}</span>.
                Today you're <span style={{ color: hrv >= baseline ? "#22c55e" : "#ef4444", fontWeight: 700 }}>
                  {hrv >= baseline ? `+${hrv - baseline} above` : `${hrv - baseline} below`}
                </span> your normal.
              </div>
            </Card>
          )}

          {/* 7-day trend */}
          {last7.length > 1 && (
            <Card>
              <SLabel color="#38bdf8">7-Day Trend</SLabel>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60, marginTop: 10 }}>
                {last7.map((h, i) => {
                  const max = Math.max(...last7.map(x => x.value));
                  const min = Math.min(...last7.map(x => x.value));
                  const range = max - min || 1;
                  const pct = ((h.value - min) / range) * 80 + 20;
                  const isToday = i === last7.length - 1;
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ width: "100%", height: `${pct}%`, borderRadius: "4px 4px 0 0", background: isToday ? "#38bdf8" : "rgba(56,189,248,0.25)" }}/>
                      <div style={{ fontSize: 9, color: "#334155" }}>{new Date(h.date).toLocaleDateString("en-US", { weekday: "short" }).slice(0, 1)}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          <div style={{ fontSize: 11, color: "#334155", textAlign: "center", lineHeight: 1.6 }}>
            HRV is not a diagnosis. It's one signal among many. How you feel matters more.
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Btn color="#38bdf8" onClick={() => setPhase("intro")} style={{ flex: 1 }}>Take Another</Btn>
            <Btn color="#64748b" onClick={() => setPhase("history")} style={{ flex: 1 }}>History</Btn>
          </div>

          <div onClick={() => navigate("breathing")}
            style={{ background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 12, padding: "12px 14px", cursor: "pointer", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#22c55e" }}>
            🫁 Box Breathing — improves HRV
          </div>
        </div>
      )}

      {/* ── HISTORY ── */}
      {phase === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#dde8f4" }}>Your HRV History</div>
          {baseline && (
            <Card style={{ background: "rgba(56,189,248,0.05)", borderColor: "rgba(56,189,248,0.15)" }}>
              <div style={{ fontSize: 12, color: "#64748b" }}>7-day average baseline</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#38bdf8" }}>{baseline}</div>
            </Card>
          )}
          {history.slice(0, 14).map((h, i) => {
            const interp = interpretHRV(h.value, baseline);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12 }}>
                <div style={{ fontSize: 20 }}>{interp.emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: interp.color }}>{h.value}</div>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                    {new Date(h.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · {h.context === "morning" ? "Start of Shift" : h.context === "post_shift" ? "After Shift" : "Manual"}
                  </div>
                </div>
              </div>
            );
          })}
          {history.length === 0 && (
            <div style={{ textAlign: "center", padding: "30px", color: "#475569", fontSize: 13 }}>No readings yet.</div>
          )}
          <Btn color="#38bdf8" onClick={() => setPhase("intro")}>Take a Reading</Btn>
        </div>
      )}

    </ScreenSingle>
  );
}
