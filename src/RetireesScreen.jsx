// ============================================================
// SCREEN: RetireesScreen
// Upstream Initiative — Retiree Wellness
// For retired first responders, veterans, and public safety
// Hardwired resources — works offline
// ============================================================
import React, { useState } from 'react';
import { ScreenSingle } from './ui.jsx';

const RESOURCES = [
  {
    category: "Crisis & Immediate Support",
    color: "#ef4444",
    icon: "🚨",
    items: [
      { label: "988 Suicide & Crisis Lifeline", detail: "Call or text 988 · 24/7 · Free · Confidential", action: "tel:988", actionLabel: "Call or Text 988" },
      { label: "Veterans Crisis Line", detail: "Call 988 then Press 1 · For veterans of all eras", action: "tel:988", actionLabel: "988 → Press 1" },
      { label: "Safe Call Now", detail: "1-206-459-3020 · Retired first responders included · 24/7", action: "tel:12064593020", actionLabel: "Call now" },
      { label: "Crisis Text Line", detail: "Text HOME to 741741 · 24/7", action: "sms:741741?body=HOME", actionLabel: "Text now" },
    ]
  },
  {
    category: "Mental Health & PTSD",
    color: "#a78bfa",
    icon: "🧠",
    items: [
      { label: "First Responder Support Network (FRSN)", detail: "Trauma-informed programs for retired first responders and their families.", action: "https://www.frsn.org", actionLabel: "frsn.org" },
      { label: "Badge of Life", detail: "Mental health and suicide prevention for retired law enforcement.", action: "https://www.badgeoflife.org", actionLabel: "badgeoflife.org" },
      { label: "Give an Hour", detail: "Free mental health care from volunteer providers for veterans and first responders.", action: "https://www.giveanhour.org", actionLabel: "giveanhour.org" },
      { label: "VA Mental Health Services", detail: "Free mental health care for eligible veterans — including retired military.", action: "tel:18002738255", actionLabel: "800-273-8255" },
      { label: "22Zero", detail: "Brain-based trauma protocol — peer-led, works for retired responders and veterans.", action: "https://www.22zero.org", actionLabel: "22zero.org" },
    ]
  },
  {
    category: "Retirement Transition",
    color: "#f97316",
    icon: "🏅",
    items: [
      { label: "American CP (ACP) — Mentoring for Retirees", detail: "Free mentoring for veterans and first responders transitioning out of service.", action: "https://www.acp-usa.org", actionLabel: "acp-usa.org" },
      { label: "Hire Heroes USA", detail: "Free career coaching and job placement for transitioning first responders and veterans.", action: "https://www.hireheroesusa.org", actionLabel: "hireheroesusa.org" },
      { label: "Travis Manion Foundation", detail: "Purpose-driven leadership for veterans and first responders in transition.", action: "https://www.travismanion.org", actionLabel: "travismanion.org" },
      { label: "Team Red White & Blue", detail: "Community and connection for retired veterans and first responders through physical and social activity.", action: "https://www.teamrwb.org", actionLabel: "teamrwb.org" },
    ]
  },
  {
    category: "Peer Support & Community",
    color: "#38bdf8",
    icon: "🤝",
    items: [
      { label: "Vets4Warriors", detail: "Veteran-to-veteran peer support · 24/7 · Confidential · For retired military.", action: "tel:18558388838", actionLabel: "855-838-8838" },
      { label: "Blue H.E.L.P.", detail: "Support for law enforcement survivors and retirees after critical incidents.", action: "https://bluehelp.org", actionLabel: "bluehelp.org" },
      { label: "National Volunteer Fire Council (NVFC)", detail: "Share the Load peer support program for retired fire service members.", action: "https://www.nvfc.org/programs/share-the-load-program/", actionLabel: "nvfc.org" },
      { label: "Concerns of Police Survivors (COPS)", detail: "Support for surviving families and colleagues of fallen officers.", action: "https://www.concernsofpolicesurvivors.org", actionLabel: "concernsofpolicesurvivors.org" },
    ]
  },
  {
    category: "Physical Health & Chronic Conditions",
    color: "#22c55e",
    icon: "💪",
    items: [
      { label: "VA Health Care — Retired Veterans", detail: "Healthcare, disability compensation, and chronic condition management for eligible veterans.", action: "tel:18008271000", actionLabel: "800-827-1000" },
      { label: "Firefighter Cancer Support Network", detail: "Cancer prevention and support resources for retired fire service members — elevated exposure rates.", action: "https://www.firefightercancersupport.org", actionLabel: "firefightercancersupport.org" },
      { label: "First Responder Physical Wellness", detail: "Occupational injury, chronic pain, and physical wellness resources for retired responders.", action: "https://www.naemsp.org", actionLabel: "naemsp.org" },
      { label: "Shift Work Sleep Disorder Resources", detail: "Sleep issues don't stop at retirement — shift work patterns can affect sleep long after leaving the job.", action: "https://www.sleepfoundation.org/shift-work", actionLabel: "sleepfoundation.org" },
    ]
  },
  {
    category: "Substance Use & Recovery",
    color: "#22c55e",
    icon: "🌱",
    items: [
      { label: "SAMHSA National Helpline", detail: "Free · Confidential · Treatment referrals · 24/7", action: "tel:18006624357", actionLabel: "800-662-4357" },
      { label: "First Responders First", detail: "Addiction recovery built for first responders — confidential, peer-informed, career-safe.", action: "https://www.firstrespondersfirst.org", actionLabel: "firstrespondersfirst.org" },
      { label: "SMART Recovery", detail: "Science-based addiction recovery — online and in-person.", action: "https://www.smartrecovery.org", actionLabel: "smartrecovery.org" },
    ]
  },
  {
    category: "Financial & Benefits",
    color: "#eab308",
    icon: "💰",
    items: [
      { label: "VA Benefits — Disability & Pension", detail: "Disability compensation, pension, education, and healthcare for eligible veterans.", action: "tel:18008271000", actionLabel: "800-827-1000" },
      { label: "Veterans Service Organizations (VSOs)", detail: "Free claims assistance — DAV, VFW, American Legion. Don't navigate VA alone.", action: "https://www.va.gov/vso/", actionLabel: "va.gov/vso" },
      { label: "National Veterans Legal Services Program", detail: "Free legal help for veterans with VA claims.", action: "https://www.nvlsp.org", actionLabel: "nvlsp.org" },
      { label: "Responder Retirement Financial Planning", detail: "Pension management, disability planning, and financial resources for retired first responders.", action: "https://www.responderlife.com", actionLabel: "responderlife.com" },
    ]
  },
  {
    category: "Chaplaincy & Spiritual Care",
    color: "#a78bfa",
    icon: "✝️",
    items: [
      { label: "Federation of Fire Chaplains", detail: "Chaplaincy and spiritual care for retired fire service members — non-denominational.", action: "https://www.firechaplains.org", actionLabel: "firechaplains.org" },
      { label: "International Conference of Police Chaplains", detail: "Chaplaincy and grief ministry for retired law enforcement.", action: "https://www.icpc4cops.org", actionLabel: "icpc4cops.org" },
    ]
  },
  {
    category: "NC-Specific Resources",
    color: "#22c55e",
    icon: "🌲",
    items: [
      { label: "NC Division of Veterans Affairs", detail: "Benefits, claims, and services for NC veterans and retired military.", action: "tel:19198073171", actionLabel: "919-807-3171" },
      { label: "NC Veteran Treatment Courts", detail: "Alternative sentencing for veterans — keeps records clean.", action: "https://www.nccourts.gov/services/veteran-treatment-courts", actionLabel: "nccourts.gov" },
      { label: "Responder Assistance Initiative (RAI)", detail: "NC behavioral health services for retired first responders and their families.", action: "https://www.ncdhhs.gov", actionLabel: "ncdhhs.gov" },
      { label: "NC 211", detail: "Local health and human services across NC.", action: "tel:211", actionLabel: "Call 211" },
    ]
  },
];

const EDUCATION = [
  {
    title: "Retirement Isn't a Finish Line — It's a Transition",
    body: "For most first responders and veterans, retirement means losing your identity, your mission, your structure, your unit, and your purpose — all at once. The civilian world doesn't speak the same language. The routine that kept you regulated for 20+ years is gone. The adrenaline cycles stop. This is one of the hardest transitions a person can make, and almost no one prepares you for it.",
    color: "#f97316",
  },
  {
    title: "What You Carry Doesn't Retire When You Do",
    body: "Two decades of shift work, critical incidents, high-acuity calls, traumatic exposure, and sleep disruption don't disappear when you hand in your badge or discharge your weapon. The nervous system patterns you developed to survive the job follow you into retirement. Hypervigilance, sleep issues, emotional numbing, reactivity — these don't stop at a retirement date. They just show up in a different context.",
    color: "#a78bfa",
  },
  {
    title: "Identity After the Job",
    body: "When the job is who you are — not just what you do — leaving it can feel like losing a limb. Many retirees describe feeling invisible, purposeless, or like they're watching life from the outside. Rebuilding identity after a career in public service is real work. It's not about forgetting who you were. It's about expanding who you are.",
    color: "#38bdf8",
  },
  {
    title: "Physical Health — The Long Game",
    body: "First responders and veterans carry elevated rates of cancer, cardiovascular disease, chronic pain, hearing loss, and orthopedic injuries from years of occupational exposure. Firefighters specifically carry the highest cancer rates of any occupational group. Retirement is the time to get ahead of what the job left behind — not to ignore it. Know your exposures. Get screened. Use your benefits.",
    color: "#22c55e",
  },
  {
    title: "Retirement and Relationships",
    body: "Spouses and partners of first responders and veterans often built their lives around the schedule, the absence, and the emotional patterns of the job. When that structure disappears — suddenly you're home, all day, every day — it can create unexpected friction. The relationship that survived the job may need new tools for the retirement. This is normal and it's workable.",
    color: "#f97316",
  },
  {
    title: "Alcohol and Retirement — A Honest Conversation",
    body: "Alcohol use tends to increase significantly in the first years of retirement for first responders and veterans. The social structure of the job is gone. The routine is gone. The identity is uncertain. Alcohol fills those gaps quickly. If you're drinking more since you retired — that's information worth paying attention to. It's common. It's understandable. And it's treatable.",
    color: "#64748b",
  },
  {
    title: "Asking for Help Is Still Tactical",
    body: "You called for backup when the situation exceeded your capacity. Mental health support is backup. Using available resources in retirement isn't weakness — it's the same situational awareness that kept you and your team alive. The mission now is staying whole for yourself and the people who need you.",
    color: "#eab308",
  },
];

export default function RetireesScreen({ navigate, agency, logoSrc }) {
  const [tab, setTab] = useState("resources");
  const [openCategory, setOpenCategory] = useState(null);
  const [openEdu, setOpenEdu] = useState(null);

  const tabs = [
    { key: "resources", label: "Resources" },
    { key: "education", label: "Education" },
    { key: "tools",     label: "Tools"     },
  ];

  return (
    <ScreenSingle headerProps={{ onBack: () => navigate("home"), agencyName: agency?.name, logoSrc }}>

      {/* Header */}
      <div style={{ background: "rgba(100,116,139,0.08)", border: "1px solid rgba(100,116,139,0.2)", borderRadius: 14, padding: "14px 16px", marginBottom: 4 }}>
        <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 700, marginBottom: 4 }}>🏅 Retiree Wellness</div>
        <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
          For retired first responders, veterans, and public safety professionals. What the job gave you — and what it left behind — doesn't retire when you do.
        </div>
      </div>

      {/* Crisis always visible */}
      <div style={{ background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "12px 16px" }}>
        <div style={{ fontSize: 12, color: "#fca5a5", fontWeight: 700, marginBottom: 6 }}>If you need help right now</div>
        <div style={{ display: "flex", gap: 8 }}>
          <div onClick={() => window.location.href = "tel:988"} style={{ flex: 1, padding: "10px 6px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: "rgba(239,68,68,0.15)", border: "1.5px solid rgba(239,68,68,0.35)", fontSize: 13, fontWeight: 800, color: "#ef4444" }}>📞 988</div>
          <div onClick={() => window.location.href = "tel:12064593020"} style={{ flex: 1, padding: "10px 6px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", fontSize: 11, fontWeight: 700, color: "#38bdf8" }}>Safe Call Now</div>
          <div onClick={() => window.location.href = "sms:741741?body=HOME"} style={{ flex: 1, padding: "10px 6px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", fontSize: 11, fontWeight: 700, color: "#a78bfa" }}>Text 741741</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 5, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 5 }}>
        {tabs.map(t => (
          <div key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, textAlign: "center", padding: "10px 8px", borderRadius: 9, background: tab === t.key ? "rgba(100,116,139,0.2)" : "transparent", border: `1px solid ${tab === t.key ? "rgba(100,116,139,0.4)" : "transparent"}`, cursor: "pointer", fontSize: 11, fontWeight: tab === t.key ? 800 : 600, color: tab === t.key ? "#94a3b8" : "#8099b0" }}>
            {t.label}
          </div>
        ))}
      </div>

      {/* ── RESOURCES TAB ── */}
      {tab === "resources" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {RESOURCES.map((cat, ci) => (
            <div key={ci} style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${openCategory === ci ? cat.color + "40" : "rgba(255,255,255,0.06)"}`, borderRadius: 14, overflow: "hidden" }}>
              <div onClick={() => setOpenCategory(openCategory === ci ? null : ci)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }}>
                <span style={{ fontSize: 20 }}>{cat.icon}</span>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: openCategory === ci ? cat.color : "#dde8f4" }}>{cat.category}</div>
                <div style={{ fontSize: 10, color: "#475569" }}>{cat.items.length} resources</div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" style={{ transform: openCategory === ci ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}><polyline points="9 18 15 12 9 6"/></svg>
              </div>
              {openCategory === ci && (
                <div style={{ padding: "0 14px 14px" }}>
                  {cat.items.map((item, ii) => (
                    <div key={ii} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "11px 13px", marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#dde8f4", marginBottom: 3 }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, marginBottom: item.action ? 8 : 0 }}>{item.detail}</div>
                      {item.action && (
                        <div onClick={() => item.action.startsWith("http") ? window.open(item.action, "_blank") : window.location.href = item.action}
                          style={{ display: "inline-block", padding: "6px 12px", borderRadius: 8, cursor: "pointer", background: cat.color + "15", border: `1px solid ${cat.color}30`, fontSize: 12, fontWeight: 700, color: cat.color }}>
                          {item.actionLabel} →
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── EDUCATION TAB ── */}
      {tab === "education" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, marginBottom: 4 }}>
            Plain language. Written for people who spent a career in service and are figuring out what comes next.
          </div>
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

      {/* ── TOOLS TAB ── */}
      {tab === "tools" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
            The same tools that worked on the job still work now. All offline.
          </div>
          {[
            { icon: "🤖", label: "AI Peer Support",         sub: "Confidential · Understands service culture · 24/7",        dest: "aichat",      color: "#ef4444" },
            { icon: "💙", label: "Follow the Light",        sub: "Bilateral sensory grounding · Auto-runs · No buttons",      dest: "ptsd",        color: "#38bdf8" },
            { icon: "🫁", label: "Box Breathing",           sub: "4-4-4-4 · Nervous system reset",                           dest: "breathing",   color: "#22c55e" },
            { icon: "🌿", label: "5-4-3-2-1 Grounding",    sub: "Sensory awareness · Breaks rumination",                     dest: "grounding",   color: "#38bdf8" },
            { icon: "📓", label: "Journal",                 sub: "Private voice or text · Never leaves your device",          dest: "journal",     color: "#a78bfa" },
            { icon: "💓", label: "HRV Check",               sub: "60-second body stress check · Camera-based",               dest: "hrv",         color: "#f87171" },
            { icon: "⚠️", label: "High Acuity Decompression",sub: "After a case or memory that's staying with you",          dest: "highacuity",  color: "#ef4444" },
            { icon: "🔄", label: "After-Action Reset",      sub: "3-step decompression — works in retirement too",           dest: "afteraction", color: "#38bdf8" },
            { icon: "🎖", label: "Veterans Resources",      sub: "Full veteran resource library · Benefits · Peer support",  dest: "veterans",    color: "#a78bfa" },
          ].map((t, i) => (
            <div key={i} onClick={() => navigate(t.dest)} style={{ background: t.color + "08", border: `1px solid ${t.color}20`, borderRadius: 14, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 24, flexShrink: 0 }}>{t.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.color }}>{t.label}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{t.sub}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}
        </div>
      )}

    </ScreenSingle>
  );
}
