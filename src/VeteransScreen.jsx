// ============================================================
// SCREEN: VeteransScreen
// Upstream Initiative — Veteran Support
// Hardwired resources — works offline
// ============================================================
import React, { useState } from 'react';
import { ScreenSingle, Card, SLabel, Btn } from './ui.jsx';

const RESOURCES = [
  {
    category: "Crisis & Immediate Support",
    color: "#ef4444",
    icon: "🚨",
    items: [
      { label: "Veterans Crisis Line", detail: "Call 988 then Press 1 · 24/7 · Confidential", action: "tel:988", actionLabel: "Call 988 → Press 1" },
      { label: "Veterans Crisis Text", detail: "Text 838255 · 24/7", action: "sms:838255", actionLabel: "Text now" },
      { label: "Veterans Crisis Chat", detail: "Online chat available 24/7", action: "https://www.veteranscrisisline.net/get-help-now/chat/", actionLabel: "Chat now" },
      { label: "Safe Call Now", detail: "1-206-459-3020 · First responders & veterans · 24/7", action: "tel:12064593020", actionLabel: "Call now" },
    ]
  },
  {
    category: "Mental Health & PTSD",
    color: "#a78bfa",
    icon: "🧠",
    items: [
      { label: "VA Mental Health Services", detail: "Free mental health care for eligible veterans", action: "tel:18002738255", actionLabel: "VA: 800-273-8255" },
      { label: "Make the Connection", detail: "Real stories from veterans about mental health and recovery", action: "https://www.maketheconnection.net", actionLabel: "maketheconnection.net" },
      { label: "PTSD Coach App (VA)", detail: "Free VA app for managing PTSD symptoms — works offline", action: "https://www.ptsd.va.gov/appvid/mobile/ptsdcoach_app.asp", actionLabel: "Get PTSD Coach" },
      { label: "22Zero", detail: "Brain-based PTSD protocol for veterans — peer-led", action: "https://www.22zero.org", actionLabel: "22zero.org" },
      { label: "Give an Hour", detail: "Free mental health care from volunteer providers for veterans", action: "https://www.giveanhour.org", actionLabel: "giveanhour.org" },
      { label: "Headstrong", detail: "Free mental health treatment for post-9/11 veterans", action: "https://www.theheadstrongproject.org", actionLabel: "theheadstrongproject.org" },
    ]
  },
  {
    category: "Peer Support",
    color: "#38bdf8",
    icon: "🤝",
    items: [
      { label: "Vets4Warriors", detail: "Veteran-to-veteran peer support · 24/7 · Confidential", action: "tel:18554383838", actionLabel: "855-838-8838" },
      { label: "Team Red White & Blue", detail: "Enriching veterans' lives through physical and social activity", action: "https://www.teamrwb.org", actionLabel: "teamrwb.org" },
      { label: "The Mission Continues", detail: "Veteran-led community service platoons nationwide", action: "https://www.missioncontinues.org", actionLabel: "missioncontinues.org" },
      { label: "Travis Manion Foundation", detail: "Character-driven leadership for veterans transitioning to civilian life", action: "https://www.travismanion.org", actionLabel: "travismanion.org" },
      { label: "BraveHeart", detail: "Peer support for veterans and first responders", action: "https://www.braveheartforheroes.org", actionLabel: "braveheartforheroes.org" },
    ]
  },
  {
    category: "Substance Use & Recovery",
    color: "#22c55e",
    icon: "🌱",
    items: [
      { label: "VA Substance Use Treatment", detail: "Free treatment for eligible veterans", action: "tel:18002738255", actionLabel: "VA: 800-273-8255" },
      { label: "SAMHSA National Helpline", detail: "Free, confidential · 24/7 · Treatment referrals", action: "tel:18006624357", actionLabel: "800-662-4357" },
      { label: "Volunteers of America — Veterans", detail: "Substance use and recovery programs for veterans", action: "https://www.voa.org/veterans", actionLabel: "voa.org/veterans" },
      { label: "SMART Recovery", detail: "Science-based addiction recovery — veteran-friendly", action: "https://www.smartrecovery.org", actionLabel: "smartrecovery.org" },
    ]
  },
  {
    category: "Identity & Transition",
    color: "#f97316",
    icon: "🎖",
    items: [
      { label: "American Corporate Partners (ACP)", detail: "Free mentoring for veterans transitioning to civilian careers", action: "https://www.acp-usa.org", actionLabel: "acp-usa.org" },
      { label: "Hire Heroes USA", detail: "Free career coaching and job placement for veterans", action: "https://www.hireheroesusa.org", actionLabel: "hireheroesusa.org" },
      { label: "Student Veterans of America", detail: "Support for veterans in higher education", action: "https://www.studentveterans.org", actionLabel: "studentveterans.org" },
      { label: "VA Transition Assistance Program", detail: "Resources for separating service members", action: "https://www.benefits.va.gov/tap/", actionLabel: "benefits.va.gov/tap" },
      { label: "The Headspace and Timing Blog", detail: "Veteran-written content on identity, purpose, and transition", action: "https://www.headspaceandtiming.com", actionLabel: "headspaceandtiming.com" },
    ]
  },
  {
    category: "MST — Military Sexual Trauma",
    color: "#ec4899",
    icon: "💗",
    items: [
      { label: "VA MST Support", detail: "Free counseling for MST — no service-connection required", action: "tel:18002738255", actionLabel: "VA: 800-273-8255" },
      { label: "Safe Helpline (RAINN)", detail: "Confidential support for military sexual trauma · 24/7", action: "tel:18779955247", actionLabel: "877-995-5247" },
      { label: "Safe Helpline Chat", detail: "Online chat — confidential", action: "https://safehelpline.org", actionLabel: "safehelpline.org" },
      { label: "Protect Our Defenders", detail: "Advocacy and support for MST survivors", action: "https://www.protectourdefenders.com", actionLabel: "protectourdefenders.com" },
    ]
  },
  {
    category: "TBI — Traumatic Brain Injury",
    color: "#eab308",
    icon: "⚡",
    items: [
      { label: "Defense and Veterans Brain Injury Center", detail: "TBI resources for veterans and service members", action: "tel:18664TBI4USA", actionLabel: "866-4TBI-4USA" },
      { label: "BrainLine Military", detail: "TBI education and resources for veterans", action: "https://www.brainline.org/military", actionLabel: "brainline.org/military" },
      { label: "VA Polytrauma System of Care", detail: "Specialized TBI treatment for veterans", action: "https://www.polytrauma.va.gov", actionLabel: "polytrauma.va.gov" },
    ]
  },
  {
    category: "Homeless & Housing",
    color: "#64748b",
    icon: "🏠",
    items: [
      { label: "National Call Center for Homeless Veterans", detail: "24/7 · Free · Confidential", action: "tel:18774248387", actionLabel: "877-4AID-VET" },
      { label: "HUD-VASH Program", detail: "Housing vouchers + case management for homeless veterans", action: "https://www.hud.gov/program_offices/public_indian_housing/programs/hcv/vash", actionLabel: "hud.gov/vash" },
      { label: "Volunteers of America Veterans Housing", detail: "Transitional and permanent housing programs", action: "https://www.voa.org/veterans-services", actionLabel: "voa.org/veterans" },
    ]
  },
  {
    category: "Legal & Benefits",
    color: "#38bdf8",
    icon: "⚖️",
    items: [
      { label: "VA Benefits", detail: "Disability compensation, education, healthcare", action: "tel:18008271000", actionLabel: "800-827-1000" },
      { label: "Veterans Service Organizations (VSOs)", detail: "Free claims assistance — DAV, VFW, American Legion", action: "https://www.va.gov/vso/", actionLabel: "va.gov/vso" },
      { label: "National Veterans Legal Services Program", detail: "Free legal help for veterans with VA claims", action: "https://www.nvlsp.org", actionLabel: "nvlsp.org" },
      { label: "NC Veterans Affairs", detail: "NC-specific veteran benefits and services", action: "https://www.milvets.nc.gov", actionLabel: "milvets.nc.gov" },
    ]
  },
  {
    category: "Postpartum — Veterans & Families",
    color: "#ec4899",
    icon: "👶",
    items: [
      { label: "Postpartum Support International (PSI)", detail: "National helpline + peer support. Covers veterans and military families.", action: "tel:18009444773", actionLabel: "800-944-4773" },
      { label: "PSI — For Fathers and Partners", detail: "Paternal postpartum depression is real — especially underdiagnosed in veterans who suppress emotional responses.", action: "https://www.postpartum.net/get-help/for-fathers-and-partners/", actionLabel: "postpartum.net" },
      { label: "Military Families Postpartum Support", detail: "Military OneSource — postpartum and new parent resources for active duty and veteran families.", action: "tel:18009424342", actionLabel: "800-342-9647" },
    ]
  },
  {
    category: "Family & Caregiver Support",
    color: "#a78bfa",
    icon: "👨‍👩‍👧",
    items: [
      { label: "VA Caregiver Support Program", detail: "Support for those caring for veterans", action: "tel:18552603274", actionLabel: "855-260-3274" },
      { label: "Veteran Spouse Network (VSN)", detail: "Peer-led support for partners of veterans", action: "https://www.veteranspousenetwork.org", actionLabel: "veteranspousenetwork.org" },
      { label: "Blue Star Families", detail: "Resources for military and veteran families", action: "https://www.bluestarfam.org", actionLabel: "bluestarfam.org" },
      { label: "Military OneSource", detail: "Free counseling and resources for veteran families", action: "tel:18009424342", actionLabel: "800-342-9647" },
    ]
  },
  {
    category: "NC-Specific Veteran Resources",
    color: "#22c55e",
    icon: "🌲",
    items: [
      { label: "NC Division of Veterans Affairs", detail: "Benefits, claims, and services for NC veterans", action: "tel:19198073171", actionLabel: "919-807-3171" },
      { label: "NC Veteran Treatment Courts", detail: "Alternative sentencing for veterans — keeps records clean", action: "https://www.nccourts.gov/services/veteran-treatment-courts", actionLabel: "nccourts.gov" },
      { label: "Responder Assistance Initiative (RAI)", detail: "Behavioral health services for NC veterans and families", action: "https://www.ncdhhs.gov", actionLabel: "ncdhhs.gov" },
      { label: "NC Veteran Suicide Prevention", detail: "NC-specific veteran suicide prevention resources", action: "https://www.milvets.nc.gov/services/veteran-suicide-prevention", actionLabel: "milvets.nc.gov" },
      { label: "Volunteers of America Carolinas", detail: "Veteran services across NC and SC", action: "https://www.voacarolinas.org", actionLabel: "voacarolinas.org" },
    ]
  },
];

const EDUCATION = [
  {
    title: "Understanding Military-to-Civilian Transition",
    body: "Leaving the military means losing your unit, your identity, your mission, and your structure — all at once. This is not weakness. It's one of the most difficult transitions a human being can make. The civilian world doesn't speak the same language, and that friction is real.",
    color: "#f97316",
  },
  {
    title: "What PTSD Actually Is",
    body: "PTSD is not a character flaw or a sign of weakness. It's a normal nervous system response to abnormal experiences. The brain gets stuck in survival mode — hypervigilance, nightmares, startle response, emotional numbness. These are adaptations that kept you alive. They just don't turn off automatically.",
    color: "#a78bfa",
  },
  {
    title: "Moral Injury — When It's Deeper Than PTSD",
    body: "Moral injury happens when you experience something that violates your core beliefs — doing something, witnessing something, or failing to prevent something. It shows up as shame, guilt, and spiritual crisis. It's different from PTSD and needs different tools. You are not your worst moment.",
    color: "#ef4444",
  },
  {
    title: "The High-Low Cycle at Home",
    body: "Many veterans oscillate between hypervigilance (on-guard, irritable, controlling) and emotional shutdown (numb, withdrawn, disconnected). Their families experience this as unpredictable. Understanding this cycle is the first step to interrupting it.",
    color: "#38bdf8",
  },
  {
    title: "Identity After Service",
    body: "For many veterans, military service is not just a job — it's who they are. Separation can feel like losing a limb. Rebuilding identity in civilian life is real work. It's not about forgetting who you were. It's about expanding who you are.",
    color: "#22c55e",
  },
  {
    title: "Asking for Help Is Tactical",
    body: "In the military, you call for backup when the situation exceeds your capacity. Mental health support is backup. Using available resources isn't weakness — it's mission awareness. The mission now is staying whole for yourself and the people who need you.",
    color: "#eab308",
  },
  {
    title: "Substance Use and Self-Medication",
    body: "Alcohol and substances are common coping tools after service. They work — briefly. Then they become part of the problem. If you're using to sleep, to quiet your mind, or to feel something (or nothing), that's worth talking to someone about. It's treatable and you don't have to white-knuckle it alone.",
    color: "#64748b",
  },
  {
    title: "MST — It Happens to Men Too",
    body: "Military Sexual Trauma affects veterans of all genders. Male survivors often face additional stigma and are less likely to seek help. MST is not a reflection of strength or weakness. It is something that was done to you. Free, confidential support is available — no service connection required.",
    color: "#ec4899",
  },
];

export default function VeteransScreen({ navigate, agency, logoSrc }) {
  const [tab, setTab] = useState("resources");
  const [openCategory, setOpenCategory] = useState(null);
  const [openEdu, setOpenEdu] = useState(null);

  const tabs = [
    { key: "resources",  label: "Resources" },
    { key: "education",  label: "Education" },
    { key: "tools",      label: "Tools"     },
  ];

  return (
    <ScreenSingle headerProps={{ onBack: () => navigate("home"), agencyName: agency?.name, logoSrc }}>

      {/* Header */}
      <div style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 14, padding: "14px 16px", marginBottom: 4 }}>
        <div style={{ fontSize: 13, color: "#c4b5fd", fontWeight: 700, marginBottom: 4 }}>🎖 Veteran Support</div>
        <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
          Resources, education, and tools for veterans and their families. Everything here is hardwired — works offline, no login required.
        </div>
      </div>

      {/* Crisis always visible */}
      <div style={{ background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "12px 16px" }}>
        <div style={{ fontSize: 12, color: "#fca5a5", fontWeight: 700, marginBottom: 6 }}>Veterans Crisis Line — 24/7</div>
        <div style={{ display: "flex", gap: 8 }}>
          <div onClick={() => window.location.href = "tel:988"} style={{ flex: 1, padding: "10px 6px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: "rgba(239,68,68,0.15)", border: "1.5px solid rgba(239,68,68,0.35)", fontSize: 13, fontWeight: 800, color: "#ef4444" }}>📞 988 → 1</div>
          <div onClick={() => window.location.href = "sms:838255"} style={{ flex: 1, padding: "10px 6px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)", fontSize: 12, fontWeight: 700, color: "#a78bfa" }}>Text 838255</div>
          <div onClick={() => window.open("https://www.veteranscrisisline.net/get-help-now/chat/", "_blank")} style={{ flex: 1, padding: "10px 6px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", fontSize: 12, fontWeight: 700, color: "#38bdf8" }}>💬 Chat</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 5, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 5 }}>
        {tabs.map(t => (
          <div key={t.key} onClick={() => setTab(t.key)} style={{ flex: 1, textAlign: "center", padding: "10px 8px", borderRadius: 9, background: tab === t.key ? "rgba(167,139,250,0.18)" : "transparent", border: `1px solid ${tab === t.key ? "rgba(167,139,250,0.35)" : "transparent"}`, cursor: "pointer", fontSize: 11, fontWeight: tab === t.key ? 800 : 600, color: tab === t.key ? "#a78bfa" : "#8099b0" }}>
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
            Plain language. No clinical jargon. Written for veterans, by people who understand service culture.
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
            Tools that work. No fluff. All available offline.
          </div>

          {[
            { icon: "💙", label: "Follow the Light", sub: "Bilateral sensory grounding · Auto-runs · No buttons", dest: "ptsd", color: "#38bdf8" },
            { icon: "🫁", label: "Box Breathing", sub: "4-4-4-4 · Tactical nervous system reset", dest: "breathing", color: "#22c55e" },
            { icon: "🌿", label: "5-4-3-2-1 Grounding", sub: "Sensory awareness · Breaks flashback loops", dest: "grounding", color: "#38bdf8" },
            { icon: "📓", label: "Journal", sub: "Private voice or text · Never leaves your device", dest: "journal", color: "#a78bfa" },
            { icon: "💓", label: "HRV Check", sub: "60-second body readiness check · Camera-based", dest: "hrv", color: "#f87171" },
            { icon: "🤖", label: "AI Peer Support", sub: "Confidential · Understands veteran culture · 24/7", dest: "aichat", color: "#ef4444" },
          ].map((t, i) => (
            <div key={i} onClick={() => navigate(t.dest)} style={{ background: t.color + "08", border: `1px solid ${t.color}20`, borderRadius: 14, padding: "16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 28 }}>{t.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: t.color }}>{t.label}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{t.sub}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }}/>

          {/* External apps */}
          <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 4 }}>VA-Recommended Apps</div>
          {[
            { label: "PTSD Coach", detail: "Free VA app · Manages PTSD symptoms · Works offline", url: "https://www.ptsd.va.gov/appvid/mobile/ptsdcoach_app.asp" },
            { label: "Mindfulness Coach", detail: "Free VA app · Guided mindfulness · For veterans", url: "https://www.ptsd.va.gov/appvid/mobile/mindfulnesscoach_app.asp" },
            { label: "Insomnia Coach", detail: "Free VA app · Sleep improvement · Evidence-based", url: "https://www.ptsd.va.gov/appvid/mobile/insomniacoach_app.asp" },
            { label: "Veteran Peer Apps (VA)", detail: "Full list of VA-developed wellness apps", url: "https://www.ptsd.va.gov/appvid/mobile/" },
          ].map((a, i) => (
            <div key={i} onClick={() => window.open(a.url, "_blank")} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#dde8f4" }}>{a.label}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{a.detail}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}
        </div>
      )}

    </ScreenSingle>
  );
}
