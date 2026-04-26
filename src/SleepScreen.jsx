// ============================================================
// SCREEN: SleepScreen
// Upstream Initiative — Shift Work Sleep Module
// Shift work sleep disorder — not just a resource link
// Practical tools for before/during/after shift sleep issues
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { ScreenSingle } from './ui.jsx';

const SLEEP_TOOLS = [
  {
    key: "winddown",
    label: "Wind Down After a Shift",
    icon: "🌙",
    color: "#6366f1",
    sub: "Deactivate before you try to sleep",
    steps: [
      { title: "Dim your screens", body: "30 minutes before bed, lower screen brightness or use night mode. Blue light signals your brain to stay awake." },
      { title: "Temperature drop", body: "Lower the room to 65-68°F if possible. Your core body temperature needs to drop 2-3 degrees to initiate sleep. A cool shower also works." },
      { title: "The 4-7-8 breath", body: "Inhale for 4 counts. Hold for 7. Exhale for 8. Repeat 4 times. This activates your parasympathetic nervous system — the off switch." },
      { title: "Write it down", body: "If your brain is still running calls, write down the 3 things you're thinking about most. Getting them on paper gets them out of your head." },
      { title: "Anchor thought", body: "Pick one mundane, non-work thing to think about as you fall asleep. A place. A memory. A simple scene. Give your brain something boring to attach to." },
    ]
  },
  {
    key: "rotate",
    label: "Rotating Shift Recovery",
    icon: "🔄",
    color: "#38bdf8",
    sub: "Resetting after schedule changes",
    steps: [
      { title: "Light is your anchor", body: "Sunlight is the strongest circadian reset tool you have. Morning light for day shift transition. Blackout curtains for day sleep. Get it wrong and you'll fight your sleep for days." },
      { title: "Anchor your sleep window", body: "Pick a consistent 7-8 hour window and protect it — even on days off. Sleeping 'whenever' after rotation makes recovery take longer." },
      { title: "The 90-minute rule", body: "Sleep cycles are 90 minutes. If you can only get a short sleep, target 90, 180, or 270 minutes. Waking mid-cycle feels worse than a shorter complete cycle." },
      { title: "Caffeine cutoff", body: "Cut caffeine 6 hours before your intended sleep. Caffeine has a half-life of 5-6 hours — a coffee at 4pm is still half-active at 10pm." },
      { title: "Strategic napping", body: "A 20-minute nap before a night shift boosts alertness without grogginess. Set an alarm — going past 30 minutes puts you into deep sleep and makes waking harder." },
    ]
  },
  {
    key: "stuck",
    label: "Can't Turn Your Brain Off",
    icon: "💭",
    color: "#a78bfa",
    sub: "When the shift follows you to bed",
    steps: [
      { title: "Name what's running", body: "The brain replays unresolved situations. Identify the specific call or situation your mind keeps returning to. Naming it reduces its power." },
      { title: "The containment technique", body: "Visualize placing the thought in a box, closing it, and setting it aside. Tell yourself: 'I'll deal with this tomorrow.' Your brain needs permission to postpone." },
      { title: "Body scan — bottom up", body: "Starting at your feet, notice each body part and consciously relax it. Work upward. By the time you reach your head, most people are close to sleep." },
      { title: "White noise or brown noise", body: "Consistent background sound masks intrusive environmental noise and gives your brain something non-threatening to focus on. Brown noise (deeper than white) is often more effective for high-stress minds." },
      { title: "Use the journal first", body: "If you're in the app because you can't sleep — write it out in the journal before trying these tools. Externalizing the thought is the first step." },
    ]
  },
  {
    key: "fatigue",
    label: "On-Shift Fatigue Management",
    icon: "⚡",
    color: "#eab308",
    sub: "Staying sharp when you need to",
    steps: [
      { title: "The 2 AM dip", body: "The human body has a built-in performance dip between 2-4 AM regardless of sleep. Know it's coming. Don't make major decisions in that window if you can avoid it." },
      { title: "Movement beats caffeine", body: "A 5-minute walk, 10 jumping jacks, or any movement resets alertness more effectively than caffeine during the dip. Motion increases blood flow and core temperature." },
      { title: "Water first", body: "Dehydration mimics fatigue. Most people on shift drink less than they should. Before your next caffeine, drink 16oz of water and wait 15 minutes." },
      { title: "Strategic caffeine timing", body: "Caffeine takes 20-30 minutes to peak. Time it for the 2 AM dip, not when you're already exhausted. Caffeine works best as prevention, not recovery." },
      { title: "The 20-minute power nap", body: "If safe and permitted, a 20-minute nap during a break provides 2+ hours of improved alertness. Set an alarm. Don't go past 30 minutes." },
    ]
  },
];

const EDUCATION = [
  {
    title: "Shift Work Sleep Disorder Is a Real Diagnosis",
    body: "Shift Work Sleep Disorder (SWSD) is a recognized clinical condition — not just being tired. It occurs when your work schedule conflicts with your circadian rhythm. Symptoms include insomnia when you need to sleep, excessive sleepiness when you need to be awake, and a general inability to feel rested. It affects 10-38% of shift workers and is significantly more common in first responders.",
    color: "#6366f1",
  },
  {
    title: "What Chronic Sleep Deprivation Actually Does",
    body: "After 17-19 hours without sleep, cognitive impairment is equivalent to a 0.05% blood alcohol level. After 24 hours, it's equivalent to 0.10% — legally drunk. Chronic sleep deprivation accelerates cardiovascular disease, compromises immune function, increases risk of diabetes, and significantly elevates the risk of PTSD, depression, and anxiety. It's not a badge of toughness. It's a health crisis.",
    color: "#ef4444",
  },
  {
    title: "Why First Responders Sleep Differently",
    body: "Hypervigilance — the sustained alertness required for the job — doesn't turn off at shift end. Your nervous system stays activated. Add rotating shifts, high-stress incident exposure, noise in sleep environments, family schedule misalignment, and chronic cortisol elevation — and you have a perfect formula for sleep disruption that goes well beyond normal fatigue.",
    color: "#38bdf8",
  },
  {
    title: "Sleep and PTSD Are Connected",
    body: "Sleep disruption is both a symptom and a driver of PTSD. Nightmares, hyperarousal, and intrusive thoughts disrupt sleep. Sleep deprivation lowers the threshold for re-experiencing trauma. Breaking this cycle often requires addressing both simultaneously — sleep hygiene alone isn't enough when trauma is present. If sleep issues feel connected to specific incidents, the journal and AI support tools are a starting point.",
    color: "#a78bfa",
  },
];

export default function SleepScreen({ navigate, agency, logoSrc }) {
  const [tab, setTab] = useState("tools");
  const [activeTool, setActiveTool] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [openEdu, setOpenEdu] = useState(null);
  const [breathPhase, setBreathPhase] = useState(null);
  const [breathCount, setBreathCount] = useState(0);
  const breathRef = useRef(null);

  // 4-7-8 breathing
  const start478 = () => {
    setBreathPhase("inhale");
    setBreathCount(0);
    let count = 0;
    const phases = [
      { label: "inhale", duration: 4000 },
      { label: "hold",   duration: 7000 },
      { label: "exhale", duration: 8000 },
    ];
    let pi = 0;
    const next = () => {
      pi = (pi + 1) % 3;
      if (pi === 0) {
        count++;
        setBreathCount(count);
        if (count >= 4) { setBreathPhase(null); return; }
      }
      setBreathPhase(phases[pi].label);
      breathRef.current = setTimeout(next, phases[pi].duration);
    };
    breathRef.current = setTimeout(next, phases[0].duration);
  };

  useEffect(() => () => clearTimeout(breathRef.current), []);

  const tool = SLEEP_TOOLS.find(t => t.key === activeTool);

  return (
    <ScreenSingle headerProps={{ onBack: activeTool ? () => setActiveTool(null) : () => navigate("home"), agencyName: agency?.name, logoSrc }}>

      {!activeTool ? (
        <>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#dde8f4", marginBottom: 4 }}>Sleep & Fatigue</div>
          <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, marginBottom: 16 }}>
            Shift work sleep disorder is real, documented, and treatable. These tools work.
          </div>

          <div style={{ display: "flex", gap: 5, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 5, marginBottom: 16 }}>
            {["tools", "education"].map(t => (
              <div key={t} onClick={() => setTab(t)} style={{ flex: 1, textAlign: "center", padding: "10px 8px", borderRadius: 9, background: tab === t ? "rgba(99,102,241,0.18)" : "transparent", border: `1px solid ${tab === t ? "rgba(99,102,241,0.35)" : "transparent"}`, cursor: "pointer", fontSize: 11, fontWeight: tab === t ? 800 : 600, color: tab === t ? "#6366f1" : "#8099b0" }}>
                {t === "tools" ? "Tools" : "Education"}
              </div>
            ))}
          </div>

          {tab === "tools" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {SLEEP_TOOLS.map(tool => (
                <div key={tool.key} onClick={() => { setActiveTool(tool.key); setActiveStep(0); }}
                  style={{ background: tool.color + "08", border: `1px solid ${tool.color}20`, borderRadius: 16, padding: "16px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 28, flexShrink: 0 }}>{tool.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: tool.color }}>{tool.label}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{tool.sub}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={tool.color} strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              ))}

              {/* 4-7-8 quick access */}
              <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 16, padding: "16px 18px" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#6366f1", marginBottom: 6 }}>😴 4-7-8 Breath — Quick Sleep Trigger</div>
                {!breathPhase ? (
                  <div onClick={start478} style={{ padding: "12px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", fontSize: 13, fontWeight: 700, color: "#6366f1" }}>
                    Start — 4 rounds
                  </div>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 32, fontWeight: 900, color: "#6366f1", marginBottom: 4 }}>
                      {breathPhase === "inhale" ? "Breathe in" : breathPhase === "hold" ? "Hold" : "Breathe out"}
                    </div>
                    <div style={{ fontSize: 13, color: "#475569" }}>Round {breathCount + 1} of 4</div>
                    <div onClick={() => { clearTimeout(breathRef.current); setBreathPhase(null); }}
                      style={{ marginTop: 12, fontSize: 11, color: "#334155", cursor: "pointer", textDecoration: "underline" }}>Stop</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "education" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {EDUCATION.map((item, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${openEdu === i ? item.color + "40" : "rgba(255,255,255,0.06)"}`, borderRadius: 14, overflow: "hidden" }}>
                  <div onClick={() => setOpenEdu(openEdu === i ? null : i)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0 }}/>
                    <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: openEdu === i ? item.color : "#dde8f4" }}>{item.title}</div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" style={{ transform: openEdu === i ? "rotate(90deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                  {openEdu === i && (
                    <div style={{ padding: "0 16px 16px", fontSize: 13, color: "#94a3b8", lineHeight: 1.8 }}>{item.body}</div>
                  )}
                </div>
              ))}
              <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 12, padding: "12px 14px", fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
                If sleep issues feel connected to specific incidents or trauma, reach out via AI Support or the PST request — sleep and trauma treatment often need to happen together.
              </div>
            </div>
          )}
        </>
      ) : (
        // Tool detail view
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 28 }}>{tool?.icon}</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: tool?.color }}>{tool?.label}</div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 1 }}>{tool?.sub}</div>
            </div>
          </div>

          {/* Step indicators */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            {tool?.steps.map((_, i) => (
              <div key={i} onClick={() => setActiveStep(i)} style={{ flex: 1, height: 4, borderRadius: 2, cursor: "pointer", background: i === activeStep ? tool?.color : i < activeStep ? tool?.color + "60" : "rgba(255,255,255,0.08)" }}/>
            ))}
          </div>

          {/* Current step */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${tool?.color}20`, borderRadius: 16, padding: "20px", marginBottom: 20, minHeight: 160 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: tool?.color, marginBottom: 12 }}>{tool?.steps[activeStep]?.title}</div>
            <div style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.8 }}>{tool?.steps[activeStep]?.body}</div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {activeStep > 0 && (
              <div onClick={() => setActiveStep(s => s - 1)} style={{ flex: 1, padding: "13px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 13, fontWeight: 700, color: "#64748b" }}>← Back</div>
            )}
            {activeStep < (tool?.steps.length || 0) - 1 ? (
              <div onClick={() => setActiveStep(s => s + 1)} style={{ flex: 2, padding: "13px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: tool?.color + "15", border: `1.5px solid ${tool?.color}35`, fontSize: 13, fontWeight: 700, color: tool?.color }}>Next →</div>
            ) : (
              <div onClick={() => setActiveTool(null)} style={{ flex: 2, padding: "13px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(34,197,94,0.1)", border: "1.5px solid rgba(34,197,94,0.3)", fontSize: 13, fontWeight: 700, color: "#22c55e" }}>Done ✓</div>
            )}
          </div>
        </>
      )}
    </ScreenSingle>
  );
}
