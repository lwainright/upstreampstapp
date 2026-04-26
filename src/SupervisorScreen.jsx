// ============================================================
// SCREEN: SupervisorScreen
// Upstream Initiative — Supervisor Wellness
// Supervisors carry the team's weight plus their own
// Tools, education, and resources specifically for supervisors
// ============================================================
import React, { useState } from 'react';
import { ScreenSingle } from './ui.jsx';

const TOOLS = [
  {
    key: "checkin",
    label: "Check-In Script Generator",
    icon: "💬",
    color: "#38bdf8",
    sub: "Non-clinical ways to check in with your team",
    scenarios: [
      {
        label: "After a hard call",
        prompts: [
          "How's your load after that one?",
          "Anything sticking with you from today?",
          "Do you need a minute before the next thing?",
          "Want to step outside for a bit?",
          "I noticed that one was heavy. You good?",
        ]
      },
      {
        label: "General check-in",
        prompts: [
          "How are you actually doing this week?",
          "What's one thing I can take off your plate right now?",
          "Anything you need from me to make this week easier?",
          "On a scale of one to ten, how's your bandwidth today?",
          "What's been the hardest part of the week so far?",
        ]
      },
      {
        label: "After a line of duty death",
        prompts: [
          "There's no right way to handle this. How are you doing with it?",
          "It's okay if you need some time. What do you need from me right now?",
          "I'm not going to pretend this is easy. What would help most today?",
          "You don't have to hold it together around me. What's going on?",
          "I'm checking in on you — not as your supervisor, just as someone who cares.",
        ]
      },
      {
        label: "When you're worried about someone",
        prompts: [
          "I've noticed you seem a little off lately. Is everything okay?",
          "I'm asking because I care, not because I'm evaluating you. How are you really doing?",
          "You've had a lot on you lately. I want to make sure you're getting what you need.",
          "Is there anything going on outside of work that's making things heavier?",
          "I'm not going to do anything with what you tell me — I just want to know you're okay.",
        ]
      },
    ]
  },
  {
    key: "overload",
    label: "Spot Overload Early",
    icon: "🔍",
    color: "#f97316",
    sub: "Signs your team member may be struggling",
    signs: [
      { category: "Behavioral changes", items: ["Increased irritability or short fuse", "Withdrawing from the team", "Avoiding certain calls or tasks", "Missing shifts or showing up late consistently", "Increased complaints — about everything"] },
      { category: "Performance changes", items: ["More errors than usual", "Slower response or decision-making", "Forgetting things they normally wouldn't", "Conflict with colleagues increasing", "Loss of interest in the job"] },
      { category: "Physical signs", items: ["Visible exhaustion beyond normal shift fatigue", "Increased illness", "Changes in weight or appearance", "Mentions of not sleeping", "Increased caffeine or substance use"] },
      { category: "What NOT to do", items: ["Don't ignore it and hope it resolves", "Don't make it a performance issue before addressing wellness", "Don't tell them to 'toughen up' or 'push through'", "Don't share what they tell you without their permission", "Don't wait until it becomes a crisis"] },
    ]
  },
  {
    key: "debrief",
    label: "Lead a Peer Debrief",
    icon: "🗣",
    color: "#a78bfa",
    sub: "Structured check-in after a critical incident",
    steps: [
      { title: "Set the ground rules", body: "Before you start: 'What's said here stays here. This is not a performance review. There are no wrong answers. Nobody has to share anything they don't want to.'" },
      { title: "Start with facts", body: "Ask each person to briefly describe their role in the incident. What they did, not how they felt. This grounds everyone in shared reality before moving to emotions." },
      { title: "Move to reactions", body: "Ask: 'What was the hardest part for you?' Let each person answer. Don't interpret or analyze their answers. Just acknowledge: 'That makes sense.' 'Thank you for sharing that.'" },
      { title: "Normalize responses", body: "Say explicitly: 'Everything people are feeling right now is a normal response to an abnormal situation. If you're struggling, that's not weakness — it's information.' Repeat this." },
      { title: "Offer tools without pushing", body: "Point to available resources: 'The app has tools specifically for after calls like this one. PST is available if anyone wants to talk to someone. EAP is an option. Nobody has to go through this alone.'" },
      { title: "Close with structure", body: "End with something concrete: next shift schedule, a follow-up check-in time, or a team meal. Grief and stress need structure around them." },
    ]
  },
  {
    key: "yourself",
    label: "Your Own Wellness",
    icon: "🪞",
    color: "#ef4444",
    sub: "Supervisors need support too — this one is for you",
    steps: [
      { title: "You're carrying two loads", body: "Your own operational stress plus the weight of everyone on your team. That's not a complaint — it's math. And it needs to be acknowledged before it can be managed." },
      { title: "The supervisor blind spot", body: "Supervisors are often the last to ask for help. You're the one people come to. Admitting struggle feels like it undermines your credibility. It doesn't. It models what you need your team to do." },
      { title: "Who do you go to?", body: "Most supervisors don't have a clear answer to this question. If you don't — identify one person right now. A peer supervisor, a mentor, a chaplain, a PST member from another agency. You need a place to put it." },
      { title: "The oxygen mask rule", body: "You cannot regulate your team if you're dysregulated. Your nervous system is contagious — in both directions. The most important thing you can do for your team's wellness is take care of yours first." },
      { title: "Use the same tools you offer", body: "The breathing tools, the journal, the AI support, the PST request — those exist for you too. You don't lose authority by using them. You gain credibility." },
    ]
  },
];

const EDUCATION = [
  {
    title: "The Supervisor Burden Nobody Talks About",
    body: "Supervisors absorb the stress of every person on their team in addition to their own. You're the one they come to after a hard call. You're the one who has to make the fitness-for-duty call. You're the one who writes the after-action. You're the one who has to hold it together publicly while falling apart privately. The mental health conversation in public safety almost always forgets supervisors — because supervisors are supposed to be the answer, not the ones who need it.",
    color: "#ef4444",
  },
  {
    title: "Supervisors and Moral Injury",
    body: "Supervisors are uniquely exposed to moral injury — the damage done when you're required to make decisions that conflict with your values. Sending a crew into a dangerous situation. Making a personnel decision that hurts someone. Enforcing a policy you know is wrong. Following orders when you disagree with them. These decisions accumulate. The weight of leadership is real and it needs somewhere to go.",
    color: "#f97316",
  },
  {
    title: "The Culture You Set Is the Culture They Survive In",
    body: "If you tell your team to use wellness resources while never using them yourself — they notice. If you minimize struggle publicly — they learn to hide it. If you debrief others but never ask for help — you model that supervisors don't need support. The single most powerful thing a supervisor can do for their team's mental health is demonstrate that asking for help is strength, not weakness.",
    color: "#38bdf8",
  },
  {
    title: "When to Escalate — And How",
    body: "If someone on your team is showing signs of significant distress — suicidal ideation, substance use that's affecting performance, a complete behavioral shift after an incident — your job is not to be their therapist. Your job is to connect them with support and protect them while they access it. Know your agency's EAP process. Know how to initiate a wellness check without making it punitive. Know that FMLA and ADA protections apply to mental health conditions.",
    color: "#a78bfa",
  },
];

export default function SupervisorScreen({ navigate, agency, logoSrc }) {
  const [tab, setTab] = useState("tools");
  const [activeTool, setActiveTool] = useState(null);
  const [activeScenario, setActiveScenario] = useState(0);
  const [activeSign, setActiveSign] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [openEdu, setOpenEdu] = useState(null);
  const [copied, setCopied] = useState(null);

  const tool = TOOLS.find(t => t.key === activeTool);

  const copyPrompt = (text) => {
    try { navigator.clipboard.writeText(text); } catch(e) {}
    setCopied(text);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <ScreenSingle headerProps={{ onBack: activeTool ? () => { setActiveTool(null); setActiveStep(0); } : () => navigate("home"), agencyName: agency?.name, logoSrc }}>

      {!activeTool ? (
        <>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#dde8f4", marginBottom: 4 }}>Supervisor Wellness</div>
          <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, marginBottom: 16 }}>
            You carry the team's weight plus your own. This module is for both — tools to support your people, and tools for yourself.
          </div>

          <div style={{ display: "flex", gap: 5, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 5, marginBottom: 16 }}>
            {["tools", "education"].map(t => (
              <div key={t} onClick={() => setTab(t)} style={{ flex: 1, textAlign: "center", padding: "10px 8px", borderRadius: 9, background: tab === t ? "rgba(239,68,68,0.18)" : "transparent", border: `1px solid ${tab === t ? "rgba(239,68,68,0.35)" : "transparent"}`, cursor: "pointer", fontSize: 11, fontWeight: tab === t ? 800 : 600, color: tab === t ? "#ef4444" : "#8099b0" }}>
                {t === "tools" ? "Supervisor Tools" : "Education"}
              </div>
            ))}
          </div>

          {tab === "tools" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {TOOLS.map(t => (
                <div key={t.key} onClick={() => { setActiveTool(t.key); setActiveStep(0); setActiveScenario(0); }}
                  style={{ background: t.color + "08", border: `1px solid ${t.color}20`, borderRadius: 16, padding: "16px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 28, flexShrink: 0 }}>{t.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: t.color }}>{t.label}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{t.sub}</div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              ))}

              {/* Quick access to PST */}
              <div style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#22c55e", marginBottom: 6 }}>🤝 Your peer support options</div>
                <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, marginBottom: 10 }}>
                  You don't have to carry this alone either. PST and AI support are available to supervisors the same as everyone else.
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div onClick={() => navigate("humanpst")} style={{ flex: 1, padding: "10px", borderRadius: 9, cursor: "pointer", textAlign: "center", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", fontSize: 11, fontWeight: 700, color: "#22c55e" }}>PST Request</div>
                  <div onClick={() => navigate("aichat")} style={{ flex: 1, padding: "10px", borderRadius: 9, cursor: "pointer", textAlign: "center", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 11, fontWeight: 700, color: "#ef4444" }}>AI Support</div>
                  <div onClick={() => navigate("journal")} style={{ flex: 1, padding: "10px", borderRadius: 9, cursor: "pointer", textAlign: "center", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", fontSize: 11, fontWeight: 700, color: "#a78bfa" }}>Journal</div>
                </div>
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
            </div>
          )}
        </>
      ) : (
        // Tool detail
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <span style={{ fontSize: 28 }}>{tool?.icon}</span>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: tool?.color }}>{tool?.label}</div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 1 }}>{tool?.sub}</div>
            </div>
          </div>

          {/* Check-in Script Generator */}
          {activeTool === "checkin" && (
            <>
              <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
                {tool.scenarios.map((s, i) => (
                  <div key={i} onClick={() => setActiveScenario(i)} style={{ flexShrink: 0, padding: "7px 12px", borderRadius: 10, cursor: "pointer", fontSize: 11, fontWeight: activeScenario === i ? 800 : 600, background: activeScenario === i ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${activeScenario === i ? "rgba(56,189,248,0.35)" : "rgba(255,255,255,0.07)"}`, color: activeScenario === i ? "#38bdf8" : "#64748b", whiteSpace: "nowrap" }}>
                    {s.label}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "#475569", marginBottom: 10 }}>Tap to copy a prompt</div>
              {tool.scenarios[activeScenario]?.prompts.map((p, i) => (
                <div key={i} onClick={() => copyPrompt(p)}
                  style={{ background: copied === p ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${copied === p ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.07)"}`, borderRadius: 10, padding: "12px 14px", marginBottom: 8, cursor: "pointer" }}>
                  <div style={{ fontSize: 13, color: copied === p ? "#22c55e" : "#dde8f4", lineHeight: 1.6, fontStyle: "italic" }}>"{p}"</div>
                  {copied === p && <div style={{ fontSize: 10, color: "#22c55e", marginTop: 4, fontWeight: 700 }}>✓ Copied</div>}
                </div>
              ))}
            </>
          )}

          {/* Spot Overload */}
          {activeTool === "overload" && (
            <>
              <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
                {tool.signs.map((s, i) => (
                  <div key={i} onClick={() => setActiveSign(i)} style={{ flexShrink: 0, padding: "7px 12px", borderRadius: 10, cursor: "pointer", fontSize: 11, fontWeight: activeSign === i ? 800 : 600, background: activeSign === i ? "rgba(249,115,22,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${activeSign === i ? "rgba(249,115,22,0.35)" : "rgba(255,255,255,0.07)"}`, color: activeSign === i ? "#f97316" : "#64748b", whiteSpace: "nowrap" }}>
                    {s.category}
                  </div>
                ))}
              </div>
              {tool.signs[activeSign]?.items.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: i < tool.signs[activeSign].items.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: activeSign === 3 ? "#ef4444" : "#f97316", flexShrink: 0, marginTop: 7 }}/>
                  <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>{item}</div>
                </div>
              ))}
            </>
          )}

          {/* Debrief steps & Yourself steps */}
          {(activeTool === "debrief" || activeTool === "yourself") && (
            <>
              <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
                {tool?.steps.map((_, i) => (
                  <div key={i} onClick={() => setActiveStep(i)} style={{ flex: 1, height: 4, borderRadius: 2, cursor: "pointer", background: i === activeStep ? tool?.color : i < activeStep ? tool?.color + "60" : "rgba(255,255,255,0.08)" }}/>
                ))}
              </div>
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
        </>
      )}
    </ScreenSingle>
  );
}
