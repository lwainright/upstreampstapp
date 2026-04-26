// ============================================================
// SCREEN: HumanServicesScreen
// Upstream Initiative — Human Services Worker Wellness
// DSS / CPS / APS / Child Welfare / Adult Services
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
      { label: "Safe Call Now", detail: "1-206-459-3020 · Public safety & human services · 24/7", action: "tel:12064593020", actionLabel: "Call now" },
      { label: "SAMHSA National Helpline", detail: "Free · Confidential · Treatment referrals · 24/7", action: "tel:18006624357", actionLabel: "800-662-4357" },
    ]
  },
  {
    category: "Worker Wellness — Child Welfare",
    color: "#38bdf8",
    icon: "👶",
    items: [
      { label: "National Child Welfare Workforce Institute (NCWWI)", detail: "Federally funded — secondary trauma, burnout prevention, worker resilience. The only program specifically built for CPS/DSS workers.", action: "https://www.ncwwi.org", actionLabel: "ncwwi.org" },
      { label: "Child Welfare Information Gateway — Worker Well-Being", detail: "Federal clearinghouse — compassion fatigue, secondary trauma, stress management, peer support models.", action: "https://www.childwelfare.gov/topics/management/workforce/workforcewellbeing/", actionLabel: "childwelfare.gov" },
      { label: "Casey Family Programs — Workforce Well-Being", detail: "Secondary trauma resources, worker resilience training, workforce stabilization.", action: "https://www.casey.org", actionLabel: "casey.org" },
      { label: "CWLA — Child Welfare League of America (Worker Wellness)", detail: "National standards for worker well-being and trauma-informed workforce practices.", action: "https://www.cwla.org", actionLabel: "cwla.org" },
    ]
  },
  {
    category: "Secondary Traumatic Stress",
    color: "#a78bfa",
    icon: "🧠",
    items: [
      { label: "NCTSN — Secondary Traumatic Stress for Child Welfare Workers", detail: "STS toolkits, worker self-care plans, trauma-informed supervision guides.", action: "https://www.nctsn.org/trauma-informed-care/secondary-traumatic-stress", actionLabel: "nctsn.org" },
      { label: "ProQOL — Professional Quality of Life Scale", detail: "Free self-assessment for compassion fatigue and secondary trauma. Used widely in child welfare.", action: "https://www.proqol.org", actionLabel: "proqol.org" },
      { label: "Compassion Fatigue Awareness Project", detail: "Education and self-care tools for those affected by secondary trauma.", action: "https://www.compassionfatigue.org", actionLabel: "compassionfatigue.org" },
      { label: "Headington Institute", detail: "Resources for humanitarian and human services workers experiencing secondary trauma.", action: "https://www.headington-institute.org", actionLabel: "headington-institute.org" },
    ]
  },
  {
    category: "Adult Protective Services (APS)",
    color: "#f97316",
    icon: "👴",
    items: [
      { label: "APS TARC — APS Worker Well-Being Resources", detail: "Adult Protective Services Technical Assistance Resource Center — stress, burnout, trauma-informed APS practice, worker safety.", action: "https://www.napsa-now.org/get-informed/aps-technical-assistance-resource-center/", actionLabel: "napsa-now.org" },
      { label: "NAPSA — National Adult Protective Services Association", detail: "APS worker mental health, safety planning, emotional impact training.", action: "https://www.napsa-now.org", actionLabel: "napsa-now.org" },
      { label: "National Center on Elder Abuse (NCEA)", detail: "Resources for workers dealing with elder abuse, neglect, and exploitation cases.", action: "https://ncea.acl.gov", actionLabel: "ncea.acl.gov" },
    ]
  },
  {
    category: "High Acuity Case Support",
    color: "#ef4444",
    icon: "⚠️",
    items: [
      { label: "NCMEC — Investigator Support Resources", detail: "National Center for Missing & Exploited Children — psychological support and trauma resources for investigators and child welfare workers.", action: "https://www.missingkids.org", actionLabel: "missingkids.org" },
      { label: "NCTSN — High-Impact Trauma Resources", detail: "Tools for workers after fatality cases, severe abuse, and high-acuity exposure.", action: "https://www.nctsn.org", actionLabel: "nctsn.org" },
      { label: "ICAC TTA Program", detail: "Training and technical assistance for investigators and partner agencies — includes mental health and resilience components.", action: "https://www.icactaskforce.org", actionLabel: "icactaskforce.org" },
    ]
  },
  {
    category: "Mental Health Treatment",
    color: "#22c55e",
    icon: "🌀",
    items: [
      { label: "NASW — Social Worker Self-Care Standards", detail: "National Association of Social Workers — ethical self-care, burnout prevention, mental health support for human services workers.", action: "https://www.socialworkers.org", actionLabel: "socialworkers.org" },
      { label: "National Council for Mental Wellbeing", detail: "Workforce mental health support across human services — burnout prevention, resilience training.", action: "https://www.thenationalcouncil.org", actionLabel: "thenationalcouncil.org" },
      { label: "Open Path Collective", detail: "Affordable therapy — sessions from $30-$80. Good for workers without strong EAP coverage.", action: "https://openpathcollective.org", actionLabel: "openpathcollective.org" },
      { label: "1st Help", detail: "Connects human services workers with providers who understand the culture.", action: "https://www.1sthelp.net", actionLabel: "1sthelp.net" },
    ]
  },
  {
    category: "Workplace Rights & EAP",
    color: "#eab308",
    icon: "⚖️",
    items: [
      { label: "Employee Assistance Program (EAP)", detail: "Ask HR for your EAP number. Typically free confidential counseling sessions. Does not go in your personnel file.", action: null, actionLabel: null },
      { label: "FMLA — Family Medical Leave", detail: "Mental health treatment may qualify for protected leave. Contact HR or DOL.", action: "https://www.dol.gov/agencies/whd/fmla", actionLabel: "dol.gov/fmla" },
      { label: "EEOC — Workplace Harassment", detail: "Know your rights if facing retaliation for seeking mental health support.", action: "tel:18004694295", actionLabel: "800-469-4295" },
    ]
  },
  {
    category: "NC-Specific Resources",
    color: "#22c55e",
    icon: "🌲",
    items: [
      { label: "NC DHHS — Behavioral Health Services", detail: "NC mental health treatment and crisis services", action: "tel:18005274227", actionLabel: "800-527-4227" },
      { label: "Responder Assistance Initiative (RAI)", detail: "NC behavioral health services for high-stress workers and families.", action: "https://www.ncdhhs.gov", actionLabel: "ncdhhs.gov" },
      { label: "NC 211", detail: "Local health and human services in NC.", action: "tel:211", actionLabel: "Call 211" },
    ]
  },
];

const EDUCATION = [
  {
    title: "What You See Has a Name",
    body: "Secondary traumatic stress, compassion fatigue, moral injury — these are documented, recognized responses to the work you do. They happen to people who care about their work. They are not a character flaw. They are not weakness. They are what happens when you absorb the weight of other people's worst days, repeatedly, without adequate support.",
    color: "#38bdf8",
  },
  {
    title: "Secondary Traumatic Stress — Plain Language",
    body: "Secondary traumatic stress (STS) develops from indirect exposure to trauma — through what you hear, read, witness, or process in your casework. Symptoms look exactly like PTSD: intrusive thoughts, nightmares, hypervigilance, emotional numbing, irritability. It is just as real as direct trauma. The difference is no one gives you a medal for it.",
    color: "#a78bfa",
  },
  {
    title: "Compassion Fatigue — The Slow Drain",
    body: "Compassion fatigue builds gradually. It's the cumulative toll of caring about people in crisis, day after day, with a caseload that never empties. Early signs: emotional exhaustion, reduced empathy, dreading work, cynicism, feeling like nothing you do matters. This is treatable. It is not permanent. But it needs attention.",
    color: "#f97316",
  },
  {
    title: "Moral Injury in Human Services",
    body: "Moral injury happens when what you're required to do conflicts with what you believe is right. In child welfare — making a removal you believe is wrong, or not being able to make one you believe is necessary. In APS — watching a client refuse help they clearly need. The helplessness and conflict that comes from those decisions leaves marks that look like burnout but go deeper.",
    color: "#ef4444",
  },
  {
    title: "High Acuity Cases — What They Do",
    body: "Fatality cases. Severe abuse. Removal of a child you've worked with for months. An elder exploitation case where the family is the abuser. High acuity cases don't process the same way routine cases do. They stay. They replay. They show up in your sleep. That's not weakness — that's your brain trying to make sense of something that doesn't make sense. It needs a process, not suppression.",
    color: "#ef4444",
  },
  {
    title: "The Permission Structure Nobody Gave You",
    body: "First responders have a culture that at least acknowledges the weight — shift culture, peer support, CISM teams. Human services workers often get a desk, a caseload, and a supervisor who is also drowning. You may never have been told that what you're experiencing has a name, that it's normal, and that you're allowed to get support. Consider this that permission.",
    color: "#22c55e",
  },
  {
    title: "Burnout vs. Secondary Trauma — They're Different",
    body: "Burnout comes from chronic overload — too much work, not enough resources, too little control. Secondary trauma comes from the content of the work — what you see, hear, and carry. You can be burned out without secondary trauma. You can have secondary trauma without being burned out. Most human services workers have both. They need different tools.",
    color: "#38bdf8",
  },
  {
    title: "When to Get Help",
    body: "If you're experiencing intrusive thoughts about cases, nightmares, emotional numbing, persistent irritability, difficulty being present at home, increased substance use, or feeling like you can't do this anymore — these are signs that what you're carrying has exceeded your coping capacity. That's not failure. That's information. Get support. Your EAP is confidential. It doesn't go in your file.",
    color: "#ef4444",
  },
  {
    title: "School Resource Officers — The Job Nobody Fully Prepared You For",
    body: "SROs carry two identities simultaneously — law enforcement officer and school-based community member. You're building relationships with students on Monday and responding to a threat on Tuesday. The stress of navigating both cultures, holding authority and trust at the same time, and responding to school-based crises — active threats, student suicide, overdoses — is a documented and largely unaddressed occupational stressor. NASRO is the primary professional resource built specifically for you.",
    color: "#22c55e",
  },
  {
    title: "Mobile Crisis and Co-Responders — Bridging Two Systems",
    body: "Mental health co-responders and mobile crisis workers sit at the intersection of two high-stress systems — law enforcement and mental health. You're managing de-escalation, clinical assessment, and safety simultaneously, often with limited resources and high community expectations. The compassion fatigue and vicarious trauma that come from sustained crisis intervention work are real and specific. You need tools that understand both sides of what you carry.",
    color: "#a78bfa",
  },
  {
    title: "Line of Duty Death — When the Loss Is One of Your Own",
    body: "The death of a colleague in the line of duty is a specific kind of grief — it's personal, it's collective, and it happens in a culture that often doesn't create space to grieve. The pressure to stay operational, to hold it together for the team, can delay processing for months or years. Survivor guilt, anger, hypervigilance, and complicated grief are all normal responses. COPS (Concerns of Police Survivors) and similar organizations exist specifically for this.",
    color: "#475569",
  },
  {
    title: "Your Supervisor Probably Wasn't Trained for This Either",
    body: "Most human services supervisors receive little to no training on secondary trauma, compassion fatigue, or how to support staff after high-acuity cases. If your supervisor doesn't ask how you're doing after a hard case — it's probably not because they don't care. It's because nobody taught them how. The tools in this app work for supervisors too.",
    color: "#64748b",
  },
];

export default function HumanServicesScreen({ navigate, agency, logoSrc }) {
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
        <div style={{ fontSize: 13, color: "#38bdf8", fontWeight: 700, marginBottom: 4 }}>🏛 Human Services Worker Wellness</div>
        <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
          For DSS, CPS, APS, child welfare, adult services workers, and supervisors. What you carry is real — and it has a name.
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
            Plain language. No clinical jargon. Written for the people who hold the hardest cases.
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
            These tools work. They're the same tools first responders use — because your nervous system responds the same way they do. All work offline.
          </div>

          {/* High acuity decompression — featured */}
          <div onClick={() => navigate("highacuity")} style={{ background: "rgba(239,68,68,0.1)", border: "1.5px solid rgba(239,68,68,0.3)", borderRadius: 16, padding: "16px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 28 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#ef4444" }}>High Acuity Case Decompression</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>After a case that stays with you — structured decompression</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </div>

          {[
            { icon: "🤖", label: "AI Peer Support",      sub: "Confidential · Understands human services work · 24/7",     dest: "aichat",    color: "#ef4444" },
            { icon: "💙", label: "Follow the Light",     sub: "Bilateral sensory grounding · Auto-runs · No buttons",       dest: "ptsd",      color: "#38bdf8" },
            { icon: "🫁", label: "Box Breathing",        sub: "4-4-4-4 · Nervous system reset · Works anywhere",            dest: "breathing", color: "#22c55e" },
            { icon: "🌿", label: "5-4-3-2-1 Grounding", sub: "Sensory awareness · Breaks rumination",                       dest: "grounding", color: "#38bdf8" },
            { icon: "⏱",  label: "90-Second Dump",      sub: "Timed vent · Voice or text · Say what you can't say at work", dest: "dump90",    color: "#f97316" },
            { icon: "📓", label: "Journal",              sub: "Private voice or text · Never leaves your device",            dest: "journal",   color: "#a78bfa" },
            { icon: "💓", label: "HRV Check",            sub: "60-second body stress check · Camera-based",                 dest: "hrv",       color: "#f87171" },
            { icon: "🔄", label: "After-Action Reset",  sub: "3-step structured decompression · Before you go home",        dest: "afteraction", color: "#38bdf8" },
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
            <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.6 }}>
              No login required. Nothing shared with your agency, supervisor, or HR. What you do here is yours.
            </div>
          </div>
        </div>
      )}

    </ScreenSingle>
  );
}
