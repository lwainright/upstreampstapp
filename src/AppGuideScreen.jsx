// ============================================================
// SCREEN: AppGuideScreen
// Upstream Initiative — Per-Seat App Guide
// Shows what's in the app and how to use it
// Accessible from About screen anytime
// Works offline — hardwired content
// ============================================================
import React, { useState } from 'react';
import { ScreenSingle, Card, SLabel } from './ui.jsx';

const GUIDES = {
  responder: {
    label: "First Responder",
    icon: "🚑",
    color: "#38bdf8",
    intro: "Upstream Approach is built for the shift culture — EMS, Fire, Law Enforcement, Corrections, Dispatch, and all public safety personnel. Anonymous, confidential, no login required. Use it before, during, or after a shift.",
    sections: [
      {
        title: "Your Home Screen",
        icon: "🏠",
        items: [
          { name: "AI Peer Support", how: "Tap the red URGENT tile. Confidential AI chat available 24/7. Understands shift culture. Nothing stored.", color: "#ef4444" },
          { name: "Shift Check-In", how: "Tap CHECK-IN. Quick anonymous check-in at start, mid, or end of shift. Green/Yellow/Orange/Red. Nobody sees your individual response.", color: "#38bdf8" },
          { name: "90-Second Dump", how: "Tap VENT. Voice or text — say what's on your mind. Delete or save privately. Timer runs out, you're done.", color: "#f97316" },
          { name: "PTSD Interruption", how: "Tap the red bar below the tiles. Auto-runs a visual grounding tool. Just follow the light. No buttons needed.", color: "#ef4444" },
          { name: "Coping Tools", how: "Tap the green tile. Breathing, grounding, HRV, journal, after-action reset — all offline.", color: "#22c55e" },
          { name: "Human PST", how: "Tap the purple tile. Your agency's peer support team. Only available when your agency has PST active.", color: "#a78bfa" },
          { name: "Resources", how: "Tap the grey tile. Crisis lines, national resources, state-specific help.", color: "#64748b" },
        ]
      },
      {
        title: "Tools Screen",
        icon: "🛠",
        items: [
          { name: "HRV Check", how: "60-second camera-based heart rate variability reading. Put your finger on the lens. Shows your body's stress level.", color: "#f87171" },
          { name: "Box Breathing", how: "4-4-4-4 animated. Tap circle to start. Voice guide available. Proven to lower cortisol in under 4 minutes.", color: "#22c55e" },
          { name: "5-4-3-2-1 Grounding", how: "Sensory awareness technique. Breaks flashback loops. Works anywhere.", color: "#38bdf8" },
          { name: "Journal", how: "Private voice or text. Never leaves your device. Nobody reads it.", color: "#a78bfa" },
          { name: "After-Action Reset", how: "3-step structured decompression. Good after a rough call before going home.", color: "#f97316" },
          { name: "Family Connect", how: "Generate a session code. Share with anyone you trust. Private chat — deletes when you close it.", color: "#a78bfa" },
        ]
      },
      {
        title: "Private Safety Area",
        icon: "🔒",
        items: [
          { name: "How to access", how: "Tap the Upstream logo 5 times in 3 seconds from any screen. Set a PIN on first use.", color: "#38bdf8" },
          { name: "Secure Space", how: "Record private notes, talk to AI confidentially, or connect privately with someone you trust.", color: "#38bdf8" },
          { name: "Medical Journal", how: "Lab values reference, imaging translator, symptom journal, appointment prep. PIN protected.", color: "#38bdf8" },
          { name: "Quick Exit", how: "Top right corner — always visible. Instantly takes you to weather.com. Clears session.", color: "#ef4444" },
        ]
      },
      {
        title: "Specialized Resources",
        icon: "📚",
        items: [
          { name: "Corrections & Detention", how: "Tap Resources. Corrections-specific peer support, corrections fatigue education, and CPOF.", color: "#f97316" },
          { name: "SRO & School-Based", how: "Tap Resources. NASRO resources and school-based incident decompression in High Acuity tool.", color: "#22c55e" },
          { name: "Mobile Crisis / Co-Responder", how: "Tap Resources. CIT International, NAMI co-responder resources, SAMHSA mobile crisis tools.", color: "#a78bfa" },
          { name: "Line of Duty Death", how: "Tap Resources → Grief. COPS, National Fallen Firefighters, EMS Loses. High Acuity tool has a specific LOD case type.", color: "#475569" },
          { name: "Suicide Prevention", how: "Tap Resources → Prevention. QPR training, IAFF Center of Excellence, 988.", color: "#ef4444" },
          { name: "Chaplaincy", how: "Tap Resources → Spiritual. Federation of Fire Chaplains, ICPC for law enforcement.", color: "#a78bfa" },
          { name: "Sleep & Shift Work", how: "Tap Resources → Wellness. Shift work sleep disorder resources and fatigue management tools.", color: "#6366f1" },
          { name: "Financial Wellness", how: "Tap Resources → Financial. Shift worker financial planning and disability resources.", color: "#22c55e" },
        ]
      },
      {
        title: "PST Request",
        icon: "🤝",
        items: [
          { name: "Submit a request", how: "Scan the PST QR code posted in your station. Or tap Human PST on the home screen. 5-step anonymous form.", color: "#a78bfa" },
          { name: "Your case number", how: "Generated automatically. Keep it. A PST member will reach out in your preferred way.", color: "#a78bfa" },
          { name: "Confidentiality", how: "Your request never goes to supervisors, HR, or administration. PST team only.", color: "#22c55e" },
        ]
      },
    ]
  },

  veteran: {
    label: "Veteran",
    icon: "🎖",
    color: "#a78bfa",
    intro: "Upstream Approach includes a full veteran support section — resources, education, and tools built for the transition and what comes after it.",
    sections: [
      {
        title: "Veterans Section",
        icon: "🎖",
        items: [
          { name: "How to access", how: "Tap Tools → Veterans tile. Three tabs: Resources, Education, Tools.", color: "#a78bfa" },
          { name: "Resources tab", how: "11 categories — crisis support, mental health, peer support, MST, TBI, housing, legal, NC-specific. All tap-to-call.", color: "#a78bfa" },
          { name: "Education tab", how: "8 plain-language articles — transition, PTSD, moral injury, identity after service, asking for help.", color: "#a78bfa" },
          { name: "Tools tab", how: "In-app wellness tools + VA-recommended apps. All work offline.", color: "#a78bfa" },
          { name: "Veterans Crisis Line", how: "Always visible at the top. Call 988 → Press 1. Text 838255. Chat available.", color: "#ef4444" },
        ]
      },
      {
        title: "AI Peer Support",
        icon: "🤖",
        items: [
          { name: "Veteran-aware AI", how: "Tap AI on the nav bar. The AI understands military culture, transition stress, and veteran-specific experiences.", color: "#ef4444" },
          { name: "Confidential", how: "Nothing is stored. No login. No record. Say what you actually need to say.", color: "#22c55e" },
        ]
      },
      {
        title: "All Responder Tools Available",
        icon: "🛠",
        items: [
          { name: "Same tools", how: "Box breathing, grounding, HRV, journal, PTSD interruption — all available. All offline.", color: "#38bdf8" },
          { name: "Private Safety Area", how: "Tap the logo 5 times. PIN protected. Medical journal, secure chat, safety resources.", color: "#38bdf8" },
        ]
      },
    ]
  },

  telecommunications: {
    label: "Telecommunications & Comm Centers",
    icon: "📡",
    color: "#22c55e",
    intro: "You carry the weight of this work without always being recognized for it. This app includes a dedicated section for dispatchers, records staff, victim advocates, and all civilian support personnel.",
    sections: [
      {
        title: "Civilian Section",
        icon: "📡",
        items: [
          { name: "How to access", how: "Tap Tools → Telecommunications & Comm Centers tile. Three tabs: Resources, Education, Tools.", color: "#22c55e" },
          { name: "Resources tab", how: "9 categories including dispatcher-specific resources, workplace rights, secondary traumatic stress, victim advocate support.", color: "#22c55e" },
          { name: "Education tab", how: "9 articles including 'You Were on That Call Too' — validating civilian exposure to trauma.", color: "#22c55e" },
          { name: "Crisis", how: "988, Safe Call Now, 211 always visible at top.", color: "#ef4444" },
        ]
      },
      {
        title: "All Wellness Tools Available",
        icon: "🛠",
        items: [
          { name: "Same tools", how: "AI chat, breathing, grounding, journal, HRV — all available. Your stress is real. These tools work for you.", color: "#38bdf8" },
          { name: "PST access", how: "If your agency has peer support active, you can access it too via Human PST.", color: "#a78bfa" },
        ]
      },
    ]
  },

  spouse: {
    label: "Spouse / Partner",
    icon: "💙",
    color: "#f97316",
    intro: "You signed up for the person, not the job — but the job came with them. This app has resources and tools built specifically for partners of first responders and veterans.",
    sections: [
      {
        title: "What's Here for You",
        icon: "💙",
        items: [
          { name: "AI Support", how: "Tap AI on the nav bar. Peer-to-peer tone — like talking to another first responder spouse who gets it.", color: "#ef4444" },
          { name: "Coping Tools", how: "Tap Tools. Breathing, grounding, journal — tools that work for you, not just your partner.", color: "#22c55e" },
          { name: "Resources", how: "Tap Resources. Crisis lines, spouse-specific support organizations, family wellness resources.", color: "#64748b" },
        ]
      },
      {
        title: "Private Safety Area",
        icon: "🔒",
        items: [
          { name: "How to access", how: "Tap the Upstream logo 5 times. Set a PIN. This is your private space.", color: "#38bdf8" },
          { name: "Safety resources", how: "If you don't feel safe — domestic resources, safety planning, one-tap 911 and DV hotline.", color: "#ef4444" },
          { name: "Quick Exit", how: "Top right corner. Instantly leaves the app. Clears session. No trace.", color: "#ef4444" },
        ]
      },
      {
        title: "Family Connect",
        icon: "🔗",
        items: [
          { name: "Talk privately", how: "Tap Tools → Family Connect. Generate a code. Share with your partner or a trusted person. Private chat — nothing stored.", color: "#a78bfa" },
        ]
      },
    ]
  },

  family: {
    label: "Family Member",
    icon: "👨‍👩‍👧",
    color: "#eab308",
    intro: "Growing up in or living with a first responder or veteran household is its own kind of experience. This app has tools and resources that understand that.",
    sections: [
      {
        title: "Tools for You",
        icon: "🛠",
        items: [
          { name: "PTSD Interruption", how: "Tap the red bar on the home screen. A moving light to follow. Auto-runs. No buttons. Just breathe with it.", color: "#ef4444" },
          { name: "Breathing", how: "Tap Tools → Box Breathing. 4-4-4-4. Works when you're anxious or overwhelmed.", color: "#22c55e" },
          { name: "Grounding", how: "Tap Tools → 5-4-3-2-1. Name what you see, hear, touch. Breaks anxiety spirals.", color: "#38bdf8" },
          { name: "Journal", how: "Tap Tools → Journal. Private voice or text. Nobody reads it. Just for you.", color: "#a78bfa" },
          { name: "AI Chat", how: "Tap AI. Confidential. Understands what it's like to carry someone else's stress at home.", color: "#ef4444" },
        ]
      },
      {
        title: "If You Need Help",
        icon: "📞",
        items: [
          { name: "988", how: "Tap Resources → 988. Call or text. 24/7. Free. Someone will answer.", color: "#ef4444" },
          { name: "Crisis Text Line", how: "Text HOME to 741741. If you don't want to talk, you can text.", color: "#ef4444" },
          { name: "Talk to someone", how: "Tap AI. You don't have to say everything — just start somewhere.", color: "#38bdf8" },
        ]
      },
      {
        title: "Private Space",
        icon: "🔒",
        items: [
          { name: "Safety area", how: "Tap the logo 5 times. PIN protected. If something at home feels wrong, there are resources here.", color: "#38bdf8" },
        ]
      },
    ]
  },

  retiree: {
    label: "Retiree",
    icon: "🏅",
    color: "#64748b",
    intro: "Retirement doesn't turn off what the job put in you. The tools here work for the long game — managing what you carry, staying connected, and finding what comes next.",
    sections: [
      {
        title: "What's Available",
        icon: "🛠",
        items: [
          { name: "All wellness tools", how: "Box breathing, grounding, HRV, journal, PTSD interruption. Built for what the job does to the body and mind over time.", color: "#38bdf8" },
          { name: "AI Chat", how: "Confidential peer-level conversation. Understands the culture.", color: "#ef4444" },
          { name: "Veterans resources", how: "Tap Tools → Veterans. Benefits, mental health, peer support, transition resources.", color: "#a78bfa" },
        ]
      },
      {
        title: "Private Safety Area",
        icon: "🔒",
        items: [
          { name: "Medical Journal", how: "Lab values, imaging translator, symptom tracker, appointment prep. PIN protected.", color: "#38bdf8" },
          { name: "Secure space", how: "Tap logo 5 times. Private notes, confidential AI chat.", color: "#38bdf8" },
        ]
      },
    ]
  },
};

export default function AppGuideScreen({ navigate, agency, logoSrc }) {
  const [activeSeat, setActiveSeat] = useState(() => {
    try {
      const seats = JSON.parse(localStorage.getItem("upstream_seats") || "[]");
      return seats[0] || "responder";
    } catch(e) { return "responder"; }
  });
  const [openSection, setOpenSection] = useState(0);

  const seats = Object.keys(GUIDES);
  const guide = GUIDES[activeSeat] || GUIDES.responder;

  return (
    <ScreenSingle headerProps={{ onBack: () => navigate("about"), agencyName: agency?.name, logoSrc }}>

      <div style={{ fontSize: 18, fontWeight: 800, color: "#dde8f4", marginBottom: 4 }}>App Guide</div>
      <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, marginBottom: 16 }}>
        What's in the app and how to use it.
      </div>

      {/* Seat tabs */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 16 }}>
        {seats.map(key => {
          const g = GUIDES[key];
          const isActive = activeSeat === key;
          return (
            <div key={key} onClick={() => { setActiveSeat(key); setOpenSection(0); }}
              style={{ flexShrink: 0, padding: "8px 14px", borderRadius: 20, cursor: "pointer", background: isActive ? g.color + "15" : "rgba(255,255,255,0.03)", border: `1.5px solid ${isActive ? g.color + "40" : "rgba(255,255,255,0.07)"}`, fontSize: 12, fontWeight: isActive ? 800 : 600, color: isActive ? g.color : "#64748b", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
              <span>{g.icon}</span> {g.label}
            </div>
          );
        })}
      </div>

      {/* Intro */}
      <div style={{ background: guide.color + "08", border: `1px solid ${guide.color}20`, borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>{guide.intro}</div>
      </div>

      {/* Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {guide.sections.map((section, si) => (
          <div key={si} style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${openSection === si ? guide.color + "30" : "rgba(255,255,255,0.06)"}`, borderRadius: 14, overflow: "hidden" }}>
            <div onClick={() => setOpenSection(openSection === si ? -1 : si)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }}>
              <span style={{ fontSize: 20 }}>{section.icon}</span>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: openSection === si ? guide.color : "#dde8f4" }}>{section.title}</div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5"
                style={{ transform: openSection === si ? "rotate(90deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
            {openSection === si && (
              <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                {section.items.map((item, ii) => (
                  <div key={ii} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 14px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.name}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>{item.how}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick access */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 16px", marginTop: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Quick Access</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            { label: "AI Peer Support",    dest: "aichat",    color: "#ef4444" },
            { label: "PTSD Interruption",  dest: "ptsd",      color: "#ef4444" },
            { label: "Box Breathing",      dest: "breathing", color: "#22c55e" },
            { label: "Crisis Resources",   dest: "resources", color: "#64748b" },
          ].map((t, i) => (
            <div key={i} onClick={() => navigate(t.dest)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, cursor: "pointer", background: t.color + "08", border: `1px solid ${t.color}18` }}>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: t.color }}>{t.label}</div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}
        </div>
      </div>

    </ScreenSingle>
  );
}
