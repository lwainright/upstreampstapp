// ============================================================
// SCREEN: CivilianWorkforceScreen
// Upstream Initiative — Civilian Workforce Wellness
// Government employees, secretaries, janitorial, facilities,
// courthouse staff, school support, public service workers
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
      { label: "Crisis Text Line", detail: "Text HOME to 741741 · 24/7", action: "sms:741741?body=HOME", actionLabel: "Text now" },
      { label: "SAMHSA National Helpline", detail: "Free · Confidential · Treatment referrals · 24/7", action: "tel:18006624357", actionLabel: "800-662-4357" },
      { label: "211 — Local Support Services", detail: "Local health and human services · 24/7", action: "tel:211", actionLabel: "Call 211" },
    ]
  },
  {
    category: "Workplace Mental Health",
    color: "#38bdf8",
    icon: "🏢",
    items: [
      { label: "Employee Assistance Program (EAP)", detail: "Ask HR for your EAP number. Free confidential counseling — does not go in your personnel file.", action: null, actionLabel: null },
      { label: "SAMHSA Workplace Wellness", detail: "Free workplace mental health resources for employees and supervisors.", action: "https://www.samhsa.gov/workplace", actionLabel: "samhsa.gov/workplace" },
      { label: "Mental Health America — Workplace", detail: "Tools for managing mental health in the workplace.", action: "https://www.mhanational.org/mental-health-workplace", actionLabel: "mhanational.org" },
      { label: "National Council for Mental Wellbeing", detail: "Workforce mental health support — burnout prevention, resilience training.", action: "https://www.thenationalcouncil.org", actionLabel: "thenationalcouncil.org" },
    ]
  },
  {
    category: "Secondary Trauma & Compassion Fatigue",
    color: "#a78bfa",
    icon: "🧠",
    items: [
      { label: "Compassion Fatigue Awareness Project", detail: "Education and self-care tools for those affected by secondary trauma in public service.", action: "https://www.compassionfatigue.org", actionLabel: "compassionfatigue.org" },
      { label: "ProQOL — Professional Quality of Life", detail: "Free self-assessment for compassion fatigue and secondary trauma — used widely in public service.", action: "https://www.proqol.org", actionLabel: "proqol.org" },
      { label: "Vicarious Trauma Toolkit (OVC)", detail: "Free toolkit for organizations to address vicarious trauma in staff — courthouse and victim services focused.", action: "https://vtt.ovc.ojp.gov", actionLabel: "vtt.ovc.ojp.gov" },
    ]
  },
  {
    category: "Workplace Rights",
    color: "#eab308",
    icon: "⚖️",
    items: [
      { label: "EEOC — Workplace Harassment", detail: "Know your rights. File a complaint or get information.", action: "tel:18004694295", actionLabel: "800-469-4295" },
      { label: "NC Department of Labor", detail: "NC workplace rights and labor law.", action: "tel:18002251560", actionLabel: "800-225-1560" },
      { label: "FMLA — Family Medical Leave", detail: "Mental health treatment may qualify for protected leave.", action: "https://www.dol.gov/agencies/whd/fmla", actionLabel: "dol.gov/fmla" },
      { label: "ADA — Reasonable Accommodations", detail: "Mental health conditions may qualify for workplace accommodations.", action: "https://askjan.org", actionLabel: "askjan.org" },
    ]
  },
  {
    category: "Mental Health Treatment",
    color: "#22c55e",
    icon: "🌀",
    items: [
      { label: "NAMI HelpLine", detail: "Free mental health info and referrals · 800-950-6264", action: "tel:18009506264", actionLabel: "800-950-6264" },
      { label: "Open Path Collective", detail: "Affordable therapy — sessions from $30-$80.", action: "https://openpathcollective.org", actionLabel: "openpathcollective.org" },
      { label: "Psychology Today Therapist Finder", detail: "Find a therapist by specialty, insurance, and location.", action: "https://www.psychologytoday.com/us/therapists", actionLabel: "psychologytoday.com" },
    ]
  },
  {
    category: "Substance Use & Recovery",
    color: "#22c55e",
    icon: "🌱",
    items: [
      { label: "SAMHSA National Helpline", detail: "Free · Confidential · 24/7 · Treatment referrals", action: "tel:18006624357", actionLabel: "800-662-4357" },
      { label: "SMART Recovery", detail: "Science-based addiction recovery — online and in-person.", action: "https://www.smartrecovery.org", actionLabel: "smartrecovery.org" },
      { label: "Al-Anon", detail: "Support for families and friends of people with alcohol problems.", action: "https://al-anon.org", actionLabel: "al-anon.org" },
    ]
  },
  {
    category: "NC-Specific Resources",
    color: "#22c55e",
    icon: "🌲",
    items: [
      { label: "NC DHHS — Behavioral Health", detail: "NC mental health treatment and crisis services.", action: "tel:18005274227", actionLabel: "800-527-4227" },
      { label: "NC 211", detail: "Local health and human services across NC.", action: "tel:211", actionLabel: "Call 211" },
      { label: "Empowerment Inc. NC", detail: "Peer support services across NC.", action: "https://www.empowermentinc.org", actionLabel: "empowermentinc.org" },
    ]
  },
];

const EDUCATION = [
  {
    title: "You Work in a High-Stress Environment — Even If Nobody Calls It That",
    body: "The courthouse clerk who processes domestic violence cases every day. The school secretary who manages crisis calls while trying to keep the front office running. The janitor who cleaned up after the incident nobody talks about. The government building security guard who responds to situations alone. The stress you carry is real — and it rarely gets named.",
    color: "#38bdf8",
  },
  {
    title: "Secondary Traumatic Stress in Public Service",
    body: "You don't have to be on the front line to be affected by what happens there. Repeated exposure to other people's trauma — through the work you process, the situations you witness, the environments you maintain — accumulates. Secondary traumatic stress is documented, recognized, and treatable. You don't have to earn it with a badge.",
    color: "#a78bfa",
  },
  {
    title: "The Invisible Workforce",
    body: "Public service wellness programs are almost universally designed for sworn or licensed staff. Secretaries, custodians, clerks, facilities workers, and administrative staff are the invisible backbone of every agency — and the last to receive wellness support. If you've ever felt like these resources weren't built for you — you're right. This one is.",
    color: "#38bdf8",
  },
  {
    title: "Burnout in Public Service",
    body: "Public service burnout is specific — chronic underfunding, understaffing, public frustration directed at you personally, and the weight of systems you can't fix. Early signs: emotional exhaustion, cynicism, feeling like nothing you do matters, dreading work. This is not a personal failure. It's a systemic pressure that needs a personal response.",
    color: "#f97316",
  },
  {
    title: "Your EAP — What It Actually Is",
    body: "Most public employees have access to an Employee Assistance Program through their employer. Most have no idea what it is or how to use it. Your EAP offers free, confidential counseling sessions — typically 3-8 sessions per issue per year. It does not go in your personnel file. Your supervisor cannot access it. HR does not see individual usage. It exists for exactly the situations you're navigating.",
    color: "#22c55e",
  },
  {
    title: "When to Ask for Help",
    body: "If you're feeling consistently overwhelmed, having trouble sleeping, withdrawing from people you care about, using alcohol or substances to cope, feeling hopeless, or just feeling like something is off — those are signs worth paying attention to. You don't have to be in crisis to deserve support. You just have to notice.",
    color: "#ef4444",
  },
];

export default function CivilianWorkforceScreen({ navigate, agency, logoSrc }) {
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

      <div style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 14, padding: "14px 16px", marginBottom: 4 }}>
        <div style={{ fontSize: 13, color: "#38bdf8", fontWeight: 700, marginBottom: 4 }}>🏛 Civilian Workforce Wellness</div>
        <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
          For government employees, administrative staff, facilities workers, courthouse clerks, school support staff, and all public service workers. You belong here too.
        </div>
      </div>

      <div style={{ background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "12px 16px" }}>
        <div style={{ fontSize: 12, color: "#fca5a5", fontWeight: 700, marginBottom: 6 }}>If you need help right now</div>
        <div style={{ display: "flex", gap: 8 }}>
          <div onClick={() => window.location.href = "tel:988"} style={{ flex: 1, padding: "10px 6px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: "rgba(239,68,68,0.15)", border: "1.5px solid rgba(239,68,68,0.35)", fontSize: 13, fontWeight: 800, color: "#ef4444" }}>📞 988</div>
          <div onClick={() => window.location.href = "sms:741741?body=HOME"} style={{ flex: 1, padding: "10px 6px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", fontSize: 12, fontWeight: 700, color: "#a78bfa" }}>Text HOME<br/><span style={{ fontSize: 10 }}>741741</span></div>
          <div onClick={() => window.location.href = "tel:211"} style={{ flex: 1, padding: "10px 6px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", fontSize: 12, fontWeight: 700, color: "#38bdf8" }}>211</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 5, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 5 }}>
        {tabs.map(t => (
          <div key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, textAlign: "center", padding: "10px 8px", borderRadius: 9, background: tab === t.key ? "rgba(56,189,248,0.18)" : "transparent", border: `1px solid ${tab === t.key ? "rgba(56,189,248,0.35)" : "transparent"}`, cursor: "pointer", fontSize: 11, fontWeight: tab === t.key ? 800 : 600, color: tab === t.key ? "#38bdf8" : "#8099b0" }}>
            {t.label}
          </div>
        ))}
      </div>

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

      {tab === "education" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, marginBottom: 4 }}>
            Plain language. Written for the people who keep everything running.
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

      {tab === "tools" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
            The same tools that work for first responders work for you. Your nervous system responds the same way. All offline.
          </div>
          {[
            { icon: "🤖", label: "AI Peer Support",      sub: "Confidential · Anonymous · 24/7",                         dest: "aichat",      color: "#ef4444" },
            { icon: "💙", label: "Follow the Light",     sub: "Bilateral sensory grounding · Auto-runs · No buttons",    dest: "ptsd",        color: "#38bdf8" },
            { icon: "🫁", label: "Box Breathing",        sub: "4-4-4-4 · Nervous system reset",                         dest: "breathing",   color: "#22c55e" },
            { icon: "🌿", label: "5-4-3-2-1 Grounding", sub: "Sensory awareness · Breaks anxiety spirals",              dest: "grounding",   color: "#38bdf8" },
            { icon: "⏱",  label: "90-Second Dump",      sub: "Timed vent · Voice or text · Get it out",                dest: "dump90",      color: "#f97316" },
            { icon: "📓", label: "Journal",              sub: "Private · Never leaves your device",                     dest: "journal",     color: "#a78bfa" },
            { icon: "💓", label: "HRV Check",            sub: "60-second stress check · Camera-based",                  dest: "hrv",         color: "#f87171" },
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
          <div style={{ background: "rgba(56,189,248,0.05)", border: "1px solid rgba(56,189,248,0.12)", borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ fontSize: 12, color: "#38bdf8", fontWeight: 600, marginBottom: 4 }}>🛡 Fully Anonymous</div>
            <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.6 }}>No login. Nothing shared with your agency, supervisor, or HR.</div>
          </div>
        </div>
      )}
    </ScreenSingle>
  );
}
