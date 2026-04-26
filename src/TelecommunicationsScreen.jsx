// ============================================================
// SCREEN: TelecommunicationsScreen
// Upstream Initiative — Telecommunications & Comm Centers
// For dispatchers, admin, records, victim advocates,
// civilian investigators, and all non-sworn staff
// Hardwired resources — works offline
// ============================================================
import React, { useState } from 'react';
import { ScreenSingle, Card, SLabel } from './ui.jsx';

const RESOURCES = [
  {
    category: "Crisis & Immediate Support",
    color: "#ef4444",
    icon: "🚨",
    items: [
      { label: "988 Suicide & Crisis Lifeline", detail: "Call or text 988 · 24/7 · Free · Confidential", action: "tel:988", actionLabel: "Call or Text 988" },
      { label: "Crisis Text Line", detail: "Text HOME to 741741 · 24/7", action: "sms:741741?body=HOME", actionLabel: "Text now" },
      { label: "Safe Call Now", detail: "1-206-459-3020 · For public safety professionals including civilians · 24/7", action: "tel:12064593020", actionLabel: "Call now" },
      { label: "211 Warmline", detail: "Someone to talk to · Not a crisis line · 24/7", action: "tel:211", actionLabel: "Call 211" },
    ]
  },
  {
    category: "Corrections & Detention Officers",
    color: "#f97316",
    icon: "🔐",
    items: [
      { label: "Correctional Peace Officers Foundation (CPOF)", detail: "Support for corrections officers and their families — peer support, critical incident response, family assistance.", action: "https://www.cpof.org", actionLabel: "cpof.org" },
      { label: "American Jail Association — Wellness Resources", detail: "Mental health and wellness tools specific to jail and detention officers.", action: "https://www.americanjail.org", actionLabel: "americanjail.org" },
      { label: "American Correctional Association (ACA)", detail: "Professional development and wellness resources for corrections professionals.", action: "https://www.aca.org", actionLabel: "aca.org" },
      { label: "Safe Call Now", detail: "1-206-459-3020 · Covers corrections officers · 24/7 · Confidential", action: "tel:12064593020", actionLabel: "Call now" },
      { label: "Behind the Badge Foundation", detail: "Support for law enforcement and corrections officers — mental health, financial, family assistance.", action: "https://www.behindthebadgefoundation.org", actionLabel: "behindthebadgefoundation.org" },
      { label: "Corrections Fatigue", detail: "Dr. Caterina Spinaris — the leading researcher on corrections officer cumulative stress and fatigue. Free educational resources.", action: "https://www.correctionsfatigue.com", actionLabel: "correctionsfatigue.com" },
    ]
  },
  {
    category: "Dispatcher, CCT & Communications Staff",
    color: "#38bdf8",
    icon: "📡",
    items: [
      { label: "APCO International Wellness", detail: "Association of Public-Safety Communications Officials — dispatcher wellness resources", action: "https://www.apcointl.org/programs/wellness/", actionLabel: "apcointl.org" },
      { label: "NENA Wellness Resources", detail: "National Emergency Number Association — 911 professional wellness", action: "https://www.nena.org", actionLabel: "nena.org" },
      { label: "Dispatcher Draft Project", detail: "Mental health resources specifically for 911 dispatchers", action: "https://www.dispatcherdraftproject.com", actionLabel: "dispatcherdraftproject.com" },
      { label: "First Responder Support Network", detail: "Trauma-informed support — includes communications and civilian staff", action: "https://www.frsn.org", actionLabel: "frsn.org" },
      { label: "Beyond the Headset", detail: "Mental health community for 911 professionals", action: "https://www.beyondtheheadset.org", actionLabel: "beyondtheheadset.org" },
      { label: "International Academies of Emergency Dispatch (IAED)", detail: "Professional standards and wellness resources for emergency dispatchers including critical care and medical priority dispatch.", action: "https://www.iaed.org", actionLabel: "iaed.org" },
      { label: "Association of Air Medical Services (AAMS)", detail: "Wellness and support resources for air medical and critical care transport professionals including communications staff.", action: "https://www.aams.org", actionLabel: "aams.org" },
      { label: "IAFCCP — International Assoc. of Flight & Critical Care Paramedics", detail: "Professional association covering flight and critical care transport — includes wellness and peer support resources.", action: "https://www.iafccp.org", actionLabel: "iafccp.org" },
    ]
  },
  {
    category: "Workplace Mental Health",
    color: "#a78bfa",
    icon: "📡",
    items: [
      { label: "SAMHSA Workplace Wellness", detail: "Free resources for workplace mental health — for employees and supervisors", action: "https://www.samhsa.gov/workplace", actionLabel: "samhsa.gov/workplace" },
      { label: "Mental Health America — Workplace", detail: "Tools for managing mental health in the workplace", action: "https://www.mhanational.org/mental-health-workplace", actionLabel: "mhanational.org" },
      { label: "Employee Assistance Program (EAP)", detail: "Ask your HR department about your agency's EAP — typically free, confidential counseling sessions", action: null, actionLabel: null },
      { label: "SAMHSA National Helpline", detail: "Free, confidential treatment referrals · 24/7", action: "tel:18006624357", actionLabel: "800-662-4357" },
    ]
  },
  {
    category: "Secondary Traumatic Stress",
    color: "#f97316",
    icon: "🧠",
    items: [
      { label: "Compassion Fatigue Awareness Project", detail: "Education and self-care tools for those affected by secondary trauma", action: "https://www.compassionfatigue.org", actionLabel: "compassionfatigue.org" },
      { label: "ProQOL — Professional Quality of Life", detail: "Free self-assessment for compassion fatigue and secondary trauma", action: "https://www.proqol.org", actionLabel: "proqol.org" },
      { label: "NCTSN Secondary Traumatic Stress", detail: "National Child Traumatic Stress Network resources for those experiencing secondary trauma", action: "https://www.nctsn.org/trauma-informed-care/secondary-traumatic-stress", actionLabel: "nctsn.org" },
      { label: "Headington Institute", detail: "Resources for humanitarian and public safety workers experiencing secondary trauma", action: "https://www.headington-institute.org", actionLabel: "headington-institute.org" },
    ]
  },
  {
    category: "Victim Advocates & Support Staff",
    color: "#22c55e",
    icon: "💚",
    items: [
      { label: "Office for Victims of Crime (OVC)", detail: "Resources for victim advocates including self-care and secondary trauma", action: "https://ovc.ojp.gov", actionLabel: "ovc.ojp.gov" },
      { label: "National Organization for Victim Assistance", detail: "Training and support for victim advocates", action: "https://www.trynova.org", actionLabel: "trynova.org" },
      { label: "NCADV — Advocate Wellness", detail: "Resources for DV advocates experiencing compassion fatigue", action: "https://ncadv.org", actionLabel: "ncadv.org" },
      { label: "Vicarious Trauma Toolkit (OVC)", detail: "Free toolkit for organizations to address vicarious trauma in staff", action: "https://vtt.ovc.ojp.gov", actionLabel: "vtt.ovc.ojp.gov" },
    ]
  },
  {
    category: "Mental Health Treatment",
    color: "#a78bfa",
    icon: "🌀",
    items: [
      { label: "Psychology Today Therapist Finder", detail: "Find a therapist by specialty, insurance, and location", action: "https://www.psychologytoday.com/us/therapists", actionLabel: "psychologytoday.com" },
      { label: "Open Path Collective", detail: "Affordable therapy — sessions from $30-$80", action: "https://openpathcollective.org", actionLabel: "openpathcollective.org" },
      { label: "NAMI Helpline", detail: "National Alliance on Mental Illness · Free info and referrals", action: "tel:18009506264", actionLabel: "800-950-6264" },
      { label: "1st Help", detail: "Connects first responder families with culturally competent providers", action: "https://www.1sthelp.net", actionLabel: "1sthelp.net" },
    ]
  },
  {
    category: "Substance Use & Recovery",
    color: "#22c55e",
    icon: "🌱",
    items: [
      { label: "SAMHSA National Helpline", detail: "Free, confidential · Treatment referrals · 24/7", action: "tel:18006624357", actionLabel: "800-662-4357" },
      { label: "SMART Recovery", detail: "Science-based addiction recovery — online and in-person meetings", action: "https://www.smartrecovery.org", actionLabel: "smartrecovery.org" },
      { label: "Al-Anon", detail: "Support for families and friends of people with alcohol problems", action: "https://al-anon.org", actionLabel: "al-anon.org" },
    ]
  },
  {
    category: "Workplace Rights & HR Navigation",
    color: "#eab308",
    icon: "⚖️",
    items: [
      { label: "EEOC — Workplace Harassment", detail: "File a complaint or learn your rights", action: "tel:18004694295", actionLabel: "800-469-4295" },
      { label: "NC Department of Labor", detail: "NC workplace rights and labor law", action: "tel:18002251560", actionLabel: "800-225-1560" },
      { label: "FMLA — Family Medical Leave", detail: "You may be entitled to leave for mental health treatment — check with HR or DOL", action: "https://www.dol.gov/agencies/whd/fmla", actionLabel: "dol.gov/fmla" },
      { label: "ADA — Reasonable Accommodations", detail: "Mental health conditions may qualify for workplace accommodations under the ADA", action: "https://askjan.org", actionLabel: "askjan.org" },
    ]
  },
  {
    category: "NC-Specific Resources",
    color: "#22c55e",
    icon: "🌲",
    items: [
      { label: "NC DHHS Mental Health Services", detail: "NC mental health treatment and crisis services", action: "tel:18005274227", actionLabel: "800-527-4227" },
      { label: "NC 211", detail: "Local health and human services in NC", action: "tel:211", actionLabel: "Call 211" },
      { label: "Relias Behavioral Health NC", detail: "Statewide behavioral health resources for NC residents", action: "https://www.ncdhhs.gov/divisions/mhddsas", actionLabel: "ncdhhs.gov" },
      { label: "Empowerment Inc. NC", detail: "Peer support services across NC", action: "https://www.empowermentinc.org", actionLabel: "empowermentinc.org" },
    ]
  },
];

const EDUCATION = [
  {
    title: "Corrections — The Invisible Shift",
    body: "Corrections officers work in a closed environment with the people they're managing — all day, every day. No radio calls, no lights and sirens, no public recognition. Just sustained exposure in a confined space, managing people at their worst, often understaffed. The cumulative stress of that environment is documented, real, and almost entirely invisible to the mental health systems designed for other first responders. You carry a different kind of weight.",
    color: "#f97316",
  },
  {
    title: "Corrections Fatigue — It Has a Name",
    body: "Dr. Caterina Spinaris documented corrections-specific cumulative stress as 'corrections fatigue' — a pattern of emotional numbing, hypervigilance, cynicism, and relationship strain that develops from sustained exposure to a corrections environment. It's different from law enforcement burnout. It's different from PTSD. It's specific to the job. And it's treatable when it's named.",
    color: "#f97316",
  },
  {
    title: "Dispatchers — On Every Call, On No Scene",
    body: "Dispatchers take the call. They hear everything. They stay on the line. Then they go to the next call. No scene arrival, no visual confirmation, no closure. Just the voice on the other end — and then silence. The absence of closure is its own kind of wound. Dispatchers carry trauma from calls they never physically attended, and that experience is rarely recognized as what it is.",
    color: "#38bdf8",
  },
  {
    title: "Critical Care Dispatch — A Moving ICU and No One Sees You",
    body: "Critical care transport dispatchers are coordinating some of the highest-acuity calls in the system — STEMI alerts, trauma activations, stroke codes, NICU transfers, organ transport. They know the clinical picture as well as the crew. They're managing time-critical decisions across multiple agencies, hospitals, and sometimes air medical — all from a console. When the patient doesn't make it, they carry that too. No debriefs. No recognition. Just the next call.",
    color: "#38bdf8",
  },
  {
    title: "You Were on That Call Too",
    body: "Dispatchers take the call. Records staff process the reports. Victim advocates sit with survivors. Admin staff hear everything. You may not have been on scene — but your nervous system was there. Secondary traumatic stress is real, it's documented, and it's not a sign of weakness. It's the cost of caring.",
    color: "#38bdf8",
  },
  {
    title: "Secondary Traumatic Stress — What It Is",
    body: "Secondary traumatic stress (STS) is trauma that develops from indirect exposure to traumatic events — through what you hear, read, process, or witness in your work. Symptoms look exactly like PTSD: intrusive thoughts, nightmares, hypervigilance, emotional numbing, irritability. It is just as real as direct trauma.",
    color: "#a78bfa",
  },
  {
    title: "Compassion Fatigue — The Slow Drain",
    body: "Compassion fatigue builds gradually. It's the cumulative toll of caring for others in distress. Early signs: emotional exhaustion, reduced empathy, dreading work, cynicism, feeling like nothing you do matters. This is not burnout. It's a specific response to sustained exposure to others' suffering. It's treatable.",
    color: "#f97316",
  },
  {
    title: "The 'I Wasn't Even There' Trap",
    body: "One of the most common barriers for civilian staff is the belief that their stress isn't 'valid' because they weren't on scene. This is a trap. Trauma doesn't require physical presence. If what you heard, read, or processed affected you — that's real. You don't need to earn the right to support.",
    color: "#22c55e",
  },
  {
    title: "Dispatcher-Specific Stress",
    body: "Dispatchers occupy a uniquely difficult position: they are emotionally and operationally connected to incidents they cannot see, control, or resolve. The loss of a caller. A child on the line. An officer who doesn't respond. The helplessness of that position creates a specific kind of wound. It deserves a specific kind of support.",
    color: "#38bdf8",
  },
  {
    title: "Victim Advocate Burnout",
    body: "Victim advocates absorb the weight of survivors' experiences daily. The combination of empathy, limited resources, and systemic frustration creates a high risk of vicarious trauma and burnout. Taking care of yourself is not optional — it's what makes you able to keep showing up for the people who need you.",
    color: "#22c55e",
  },
  {
    title: "Talking to Your Supervisor About Mental Health",
    body: "This is one of the hardest conversations in any workplace — harder in law enforcement culture where mental health stigma is compounded by career anxiety. Know your rights: FMLA may protect you. EAPs are confidential. ADA may entitle you to accommodations. You don't have to disclose a diagnosis — you can simply request support.",
    color: "#eab308",
  },
  {
    title: "Self-Care Is Not a Spa Day",
    body: "In the context of secondary trauma and compassion fatigue, self-care means: sleep, boundaries, processing what you carry, connecting with people who get it, and getting professional support when you need it. It's not about bubble baths. It's about maintaining your capacity to function and stay human in a difficult job.",
    color: "#64748b",
  },
  {
    title: "When to Get Help",
    body: "If you're experiencing intrusive thoughts, nightmares, emotional numbness, persistent irritability, feeling detached from your work or life, increased substance use, or difficulty functioning at home — these are signs that what you're carrying has exceeded your coping capacity. That's not failure. That's information. Get support.",
    color: "#ef4444",
  },
];

export default function TelecommunicationsScreen({ navigate, agency, logoSrc }) {
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
      <div style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 14, padding: "14px 16px", marginBottom: 4 }}>
        <div style={{ fontSize: 13, color: "#38bdf8", fontWeight: 700, marginBottom: 4 }}>📡 Telecommunications & Comm Centers</div>
        <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
          For dispatchers, records staff, victim advocates, civilian investigators, and everyone who carries the weight of this work without a badge. You belong here too.
        </div>
      </div>

      {/* Crisis always visible */}
      <div style={{ background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "12px 16px" }}>
        <div style={{ fontSize: 12, color: "#fca5a5", fontWeight: 700, marginBottom: 6 }}>If you need help right now</div>
        <div style={{ display: "flex", gap: 8 }}>
          <div onClick={() => window.location.href = "tel:988"} style={{ flex: 1, padding: "10px 6px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: "rgba(239,68,68,0.15)", border: "1.5px solid rgba(239,68,68,0.35)", fontSize: 13, fontWeight: 800, color: "#ef4444" }}>📞 988</div>
          <div onClick={() => window.location.href = "sms:741741?body=HOME"} style={{ flex: 1, padding: "10px 6px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", fontSize: 12, fontWeight: 700, color: "#a78bfa" }}>Text HOME<br/><span style={{ fontSize: 10 }}>741741</span></div>
          <div onClick={() => window.location.href = "tel:12064593020"} style={{ flex: 1, padding: "10px 6px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", fontSize: 11, fontWeight: 700, color: "#38bdf8" }}>Safe Call Now</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 5, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 5 }}>
        {tabs.map(t => (
          <div key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, textAlign: "center", padding: "10px 8px", borderRadius: 9, background: tab === t.key ? "rgba(56,189,248,0.18)" : "transparent", border: `1px solid ${tab === t.key ? "rgba(56,189,248,0.35)" : "transparent"}`, cursor: "pointer", fontSize: 11, fontWeight: tab === t.key ? 800 : 600, color: tab === t.key ? "#38bdf8" : "#8099b0" }}>
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
                      <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, marginBottom: item.action ? 8 : 0 }}>{item.detail}</div>
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
          <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, marginBottom: 4 }}>
            Plain language. No clinical jargon. Written for the people who hold the system together from the inside.
          </div>
          {EDUCATION.map((item, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${openEdu === i ? item.color + "40" : "rgba(255,255,255,0.06)"}`, borderRadius: 14, overflow: "hidden" }}>
              <div onClick={() => setOpenEdu(openEdu === i ? null : i)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0 }}/>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: openEdu === i ? item.color : "#dde8f4" }}>{item.title}</div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" style={{ transform: openEdu === i ? "rotate(90deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
              </div>
              {openEdu === i && (
                <div style={{ padding: "0 16px 16px", fontSize: 13, color: "#8099b0", lineHeight: 1.8 }}>{item.body}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── TOOLS TAB ── */}
      {tab === "tools" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
            Same tools as everyone else — because you carry the same weight. All work offline.
          </div>
          {[
            { icon: "🤖", label: "AI Peer Support",      sub: "Confidential · Anonymous · Understands your work · 24/7",           dest: "aichat",    color: "#ef4444" },
            { icon: "💙", label: "Follow the Light",     sub: "Visual grounding tool · Auto-runs · No buttons needed",              dest: "ptsd",      color: "#38bdf8" },
            { icon: "🫁", label: "Box Breathing",        sub: "4-4-4-4 · Nervous system reset · Works in 4 minutes",               dest: "breathing", color: "#22c55e" },
            { icon: "🌿", label: "5-4-3-2-1 Grounding", sub: "Sensory awareness · Breaks rumination and anxiety spirals",          dest: "grounding", color: "#38bdf8" },
            { icon: "📓", label: "Journal",              sub: "Private voice or text · Get it out · Never leaves your device",      dest: "journal",   color: "#a78bfa" },
            { icon: "⏱",  label: "90-Second Dump",      sub: "Timed vent · Voice or text · Delete or save privately",              dest: "dump90",    color: "#f97316" },
            { icon: "💓", label: "HRV Check",            sub: "60-second body stress check · Camera-based · Device only",          dest: "hrv",       color: "#f87171" },
            { icon: "📋", label: "Shift Check-In",       sub: "Anonymous · Track how you're doing · No account needed",            dest: "shiftcheck",color: "#38bdf8" },
            { icon: "📞", label: "Crisis Resources",     sub: "988, Safe Call Now, 211 and more · Always one tap away",            dest: "resources", color: "#64748b" },
          ].map((t, i) => (
            <div key={i} onClick={() => navigate(t.dest)} style={{ background: t.color + "08", border: `1px solid ${t.color}20`, borderRadius: 14, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 24, flexShrink: 0 }}>{t.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.color }}>{t.label}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{t.sub}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}

          <div style={{ background: "rgba(56,189,248,0.05)", border: "1px solid rgba(56,189,248,0.12)", borderRadius: 12, padding: "12px 14px", marginTop: 4 }}>
            <div style={{ fontSize: 12, color: "#38bdf8", fontWeight: 600, marginBottom: 4 }}>🛡 Fully Anonymous</div>
            <div style={{ fontSize: 12, color: "#2d4a66", lineHeight: 1.6 }}>
              No login required. Nothing is shared with your agency, supervisor, or HR. What you do here is yours.
            </div>
          </div>
        </div>
      )}

    </ScreenSingle>
  );
}
