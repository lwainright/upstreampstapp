// ============================================================
// DailyCheckInScreen.jsx
// Upstream Approach -- Daily Check In
// Replaces ShiftCheckScreen for general population
// Works for anyone -- shift worker or not
// Continuum-aware -- stores level for AI chat context
// ============================================================
import React, { useState } from 'react';
import { ScreenSingle } from './ui.jsx';
import { assessShiftCheckin, CONTINUUM_LEVELS } from './ContinuumEngine.js';

const QUESTIONS = [
  {
    key: "mood",
    label: "How are you doing emotionally?",
    icon: "🧠",
    options: [
      { value:1, label:"Really struggling",   color:"#ef4444" },
      { value:2, label:"Not great",            color:"#f97316" },
      { value:3, label:"Getting by",           color:"#eab308" },
      { value:4, label:"Pretty good",          color:"#22c55e" },
      { value:5, label:"Really well",          color:"#38bdf8" },
    ]
  },
  {
    key: "energy",
    label: "How is your energy?",
    icon: "⚡",
    options: [
      { value:1, label:"Completely depleted",  color:"#ef4444" },
      { value:2, label:"Running low",          color:"#f97316" },
      { value:3, label:"Okay",                 color:"#eab308" },
      { value:4, label:"Good",                 color:"#22c55e" },
      { value:5, label:"High energy",          color:"#38bdf8" },
    ]
  },
  {
    key: "stress",
    label: "How much stress are you carrying?",
    icon: "🌡",
    options: [
      { value:5, label:"Extreme",              color:"#ef4444" },
      { value:4, label:"A lot",                color:"#f97316" },
      { value:3, label:"Moderate",             color:"#eab308" },
      { value:2, label:"Some",                 color:"#22c55e" },
      { value:1, label:"Very little",          color:"#38bdf8" },
    ]
  },
  {
    key: "sleep",
    label: "How did you sleep?",
    icon: "🌙",
    options: [
      { value:1, label:"Barely slept",         color:"#ef4444" },
      { value:2, label:"Poor",                 color:"#f97316" },
      { value:3, label:"Fair",                 color:"#eab308" },
      { value:4, label:"Good",                 color:"#22c55e" },
      { value:5, label:"Great",                color:"#38bdf8" },
    ]
  },
  {
    key: "connection",
    label: "How connected do you feel to others?",
    icon: "🤝",
    options: [
      { value:1, label:"Very isolated",        color:"#ef4444" },
      { value:2, label:"Pretty alone",         color:"#f97316" },
      { value:3, label:"Okay",                 color:"#eab308" },
      { value:4, label:"Connected",            color:"#22c55e" },
      { value:5, label:"Very connected",       color:"#38bdf8" },
    ]
  },
];

const LEVEL_RESPONSES = {
  green: {
    icon: "✅",
    color: "#22c55e",
    bg: "rgba(34,197,94,0.08)",
    border: "rgba(34,197,94,0.2)",
    title: "Doing well",
    message: "You're in a good place today. Keep doing what you're doing.",
    cta: null,
  },
  yellow: {
    icon: "💛",
    color: "#eab308",
    bg: "rgba(234,179,8,0.08)",
    border: "rgba(234,179,8,0.2)",
    title: "Feeling the weight",
    message: "It sounds like today has some heaviness to it. That's real. Consider taking a few minutes for yourself.",
    cta: "Try Breathe & Ground",
    ctaDest: "breatheground",
  },
  orange: {
    icon: "🧡",
    color: "#f97316",
    bg: "rgba(249,115,22,0.08)",
    border: "rgba(249,115,22,0.2)",
    title: "Struggling today",
    message: "What you're carrying sounds heavy. You don't have to figure it out alone right now.",
    cta: "Talk to Someone",
    ctaDest: "talktosomeone",
  },
  red: {
    icon: "🔴",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.2)",
    title: "Need support now",
    message: "This is a hard moment. Please reach out — AI support is available right now, and 988 is always there.",
    cta: "Get Support Now",
    ctaDest: "talktosomeone",
  },
};

export default function DailyCheckInScreen({ navigate, agency, logoSrc }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  const allAnswered = QUESTIONS.every(q => answers[q.key] !== undefined);
  const currentQ = QUESTIONS.findIndex(q => answers[q.key] === undefined);
  const progress = Object.keys(answers).length;

  const handleAnswer = (key, value) => {
    const next = { ...answers, [key]: value };
    setAnswers(next);
  };

  const handleSubmit = () => {
    const level = assessShiftCheckin(answers);
    setResult(level);
    setSubmitted(true);
    // Store for AI chat context
    const numericLevel = level.key === "red" ? 3 : level.key === "orange" ? 2 : level.key === "yellow" ? 1 : 0;
    try { localStorage.setItem("upstream_crisis_level", String(numericLevel)); } catch(e) {}
    try { localStorage.setItem("upstream_last_checkin", new Date().toISOString()); } catch(e) {}
  };

  const response = result ? LEVEL_RESPONSES[result.key] : null;

  return (
    <ScreenSingle headerProps={{ onBack: () => navigate("home"), agencyName: agency?.name, logoSrc }}>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

        {!submitted ? (<>
          {/* Header */}
          <div style={{ textAlign:"center", padding:"8px 0 4px" }}>
            <div style={{ fontSize:32, marginBottom:8 }}>📋</div>
            <div style={{ fontSize:18, fontWeight:800, color:"#dde8f4" }}>Daily Check In</div>
            <div style={{ fontSize:12, color:"#64748b", marginTop:4 }}>
              How are you doing today?
            </div>
          </div>

          {/* Progress */}
          <div style={{ background:"rgba(255,255,255,0.03)", borderRadius:8, height:6, overflow:"hidden" }}>
            <div style={{ width:`${(progress/QUESTIONS.length)*100}%`, height:"100%", background:"#38bdf8", borderRadius:8, transition:"width 0.3s" }}/>
          </div>

          {/* Questions */}
          {QUESTIONS.map((q, qi) => {
            const answered = answers[q.key] !== undefined;
            const isNext = qi === currentQ;
            const isPast = answers[q.key] !== undefined;

            return (
              <div key={q.key} style={{ opacity: qi > currentQ && !isPast ? 0.4 : 1, transition:"opacity 0.3s" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                  <span style={{ fontSize:18 }}>{q.icon}</span>
                  <div style={{ fontSize:13, fontWeight:700, color: answered ? "#475569" : "#dde8f4" }}>{q.label}</div>
                  {answered && <span style={{ fontSize:16, marginLeft:"auto" }}>✓</span>}
                </div>
                {(!answered || isNext) && (
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {q.options.map(opt => (
                      <div key={opt.value} onClick={() => handleAnswer(q.key, opt.value)}
                        style={{ padding:"11px 14px", borderRadius:10, cursor:"pointer", background: answers[q.key]===opt.value ? `${opt.color}18` : "rgba(255,255,255,0.03)", border:`1.5px solid ${answers[q.key]===opt.value ? opt.color+"50" : "rgba(255,255,255,0.07)"}`, fontSize:13, fontWeight:600, color: answers[q.key]===opt.value ? opt.color : "#94a3b8", transition:"all 0.15s" }}>
                        {opt.label}
                      </div>
                    ))}
                  </div>
                )}
                {answered && !isNext && (
                  <div style={{ fontSize:12, color:"#475569", paddingLeft:4 }}>
                    {q.options.find(o => o.value === answers[q.key])?.label}
                    <span onClick={() => setAnswers(a => { const n={...a}; delete n[q.key]; return n; })}
                      style={{ marginLeft:8, fontSize:11, color:"#334155", cursor:"pointer", textDecoration:"underline" }}>change</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Submit */}
          {allAnswered && (
            <div onClick={handleSubmit}
              style={{ padding:"14px", borderRadius:14, cursor:"pointer", textAlign:"center", background:"rgba(56,189,248,0.12)", border:"1.5px solid rgba(56,189,248,0.3)", fontSize:14, fontWeight:800, color:"#38bdf8", marginTop:4 }}>
              See My Results
            </div>
          )}

        </>) : (<>
          {/* Results */}
          <div style={{ textAlign:"center", padding:"8px 0" }}>
            <div style={{ fontSize:40, marginBottom:8 }}>{response.icon}</div>
            <div style={{ fontSize:18, fontWeight:800, color:response.color }}>{response.title}</div>
          </div>

          <div style={{ background:response.bg, border:`1.5px solid ${response.border}`, borderRadius:16, padding:"18px 16px" }}>
            <div style={{ fontSize:13, color:"#94a3b8", lineHeight:1.8 }}>{response.message}</div>
          </div>

          {/* CTA if needed */}
          {response.cta && (
            <div onClick={() => navigate(response.ctaDest)}
              style={{ padding:"14px", borderRadius:14, cursor:"pointer", textAlign:"center", background:response.bg, border:`1.5px solid ${response.border}`, fontSize:14, fontWeight:800, color:response.color }}>
              {response.cta} →
            </div>
          )}

          {/* 988 if red */}
          {result?.key === "red" && (
            <div onClick={() => window.location.href = "tel:988"}
              style={{ padding:"14px", borderRadius:14, cursor:"pointer", textAlign:"center", background:"rgba(239,68,68,0.08)", border:"1.5px solid rgba(239,68,68,0.25)", fontSize:14, fontWeight:800, color:"#ef4444" }}>
              📞 Call or Text 988 — Free, Confidential, 24/7
            </div>
          )}

          {/* Summary */}
          <div style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"14px 16px" }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#475569", marginBottom:10, letterSpacing:"0.08em" }}>TODAY'S CHECK IN</div>
            {QUESTIONS.map(q => {
              const opt = q.options.find(o => o.value === answers[q.key]);
              return (
                <div key={q.key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ fontSize:12, color:"#475569" }}>{q.label.split("?")[0]}</div>
                  <div style={{ fontSize:12, fontWeight:600, color:opt?.color }}>{opt?.label}</div>
                </div>
              );
            })}
          </div>

          {/* Do another check in tomorrow hint */}
          <div style={{ textAlign:"center", fontSize:11, color:"#334155", paddingBottom:8 }}>
            Your check in is stored on your device only. Nothing leaves your phone.
          </div>

          <div onClick={() => { setAnswers({}); setSubmitted(false); setResult(null); }}
            style={{ padding:"10px", borderRadius:10, cursor:"pointer", textAlign:"center", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", fontSize:12, color:"#334155" }}>
            Check in again
          </div>

        </>)}
      </div>
    </ScreenSingle>
  );
}
