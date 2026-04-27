// ============================================================
// SCREEN: SmartResourcesScreen
// Upstream Initiative — Unified Seat-Aware Resources Hub
// Reads seat(s) and serves the right content automatically
// Crisis resources always hardwired at top
// ============================================================
import React, { useState, useEffect } from 'react';
import { DEVELOPMENTAL_SUPPORT } from './SupportLayers.js';
import { ScreenSingle } from './ui.jsx';

// ── Always visible crisis resources ──────────────────────────
const CRISIS_ALWAYS = [
  { label: "988 Suicide & Crisis Lifeline", detail: "Call or text · 24/7 · Free · Confidential", action: "tel:988", actionLabel: "📞 Call or Text 988", color: "#ef4444" },
  { label: "National DV Hotline", detail: "800-799-7233 · 24/7 · Safe · Confidential", action: "tel:18007997233", actionLabel: "📞 800-799-7233", color: "#ef4444" },
  { label: "Crisis Text Line", detail: "Text HOME to 741741 · 24/7", action: "sms:741741?body=HOME", actionLabel: "💬 Text HOME to 741741", color: "#f97316" },
  { label: "Safe Call Now", detail: "206-459-3020 · First responders & public safety · 24/7", action: "tel:12064593020", actionLabel: "📞 206-459-3020", color: "#38bdf8" },
  { label: "Veterans Crisis Line", detail: "Call 988 then Press 1 · Veterans of all eras · 24/7", action: "tel:988", actionLabel: "📞 988 → Press 1", color: "#a78bfa" },
  { label: "211 — Local Services", detail: "Local health and human services", action: "tel:211", actionLabel: "📞 211", color: "#22c55e" },
];

// ── Seat-specific resource sets ───────────────────────────────
const SEAT_RESOURCES = {
  responder: {
    label: "First Responder Resources",
    icon: "🚨",
    color: "#ef4444",
    resources: [
      { label: "Badge of Life", detail: "Mental health and suicide prevention for LE", url: "https://www.badgeoflife.org" },
      { label: "First Responder Support Network", detail: "Trauma-informed programs for first responders", url: "https://www.frsn.org" },
      { label: "Code Green Campaign — EMS", detail: "Mental health awareness for EMS providers", url: "https://www.codegreencampaign.org" },
      { label: "NVFC Share the Load", detail: "Fire service peer support program", url: "https://www.nvfc.org/programs/share-the-load-program/" },
      { label: "Safe Call Now", detail: "24/7 crisis referral for first responders", phone: "12064593020" },
      { label: "QPR Suicide Prevention Training", detail: "Question Persuade Refer — gatekeeper training", url: "https://www.qprinstitute.com" },
      { label: "CPOF — Corrections Officer Foundation", detail: "Peer support for corrections officers", url: "https://www.cpof.org" },
      { label: "Corrections Fatigue Resources", detail: "Dr. Caterina Spinaris — corrections-specific stress", url: "https://www.correctionsfatigue.com" },
      { label: "Beyond the Headset — Dispatcher Wellness", detail: "Mental health for 911 professionals", url: "https://www.beyondtheheadset.org" },
      { label: "NASRO — School Resource Officers", detail: "SRO-specific wellness resources", url: "https://www.nasro.org" },
      { label: "CIT International — Co-Responders", detail: "Crisis intervention team wellness", url: "https://www.citinternational.org" },
      { label: "AAMS — Air Medical & CCT", detail: "Critical care transport wellness", url: "https://www.aams.org" },
      { label: "Concerns of Police Survivors", detail: "Support after line of duty death", url: "https://www.concernsofpolicesurvivors.org" },
      { label: "National Fallen Firefighters Foundation", detail: "Support after line of duty death — fire", url: "https://www.firehero.org" },
      { label: "Federation of Fire Chaplains", detail: "Spiritual care for fire service", url: "https://www.firechaplains.org" },
      { label: "ICPC — Police Chaplains", detail: "Spiritual care for law enforcement", url: "https://www.icpc4cops.org" },
      { label: "First Responders First — Recovery", detail: "Addiction recovery for first responders", url: "https://www.firstrespondersfirst.org" },
      { label: "APPA — Probation & Parole", detail: "Wellness for probation and parole officers", url: "https://www.appa-net.org" },
      { label: "FLEOA — Federal Law Enforcement", detail: "Peer support for federal agents", url: "https://www.fleoa.org" },
    ]
  },
  veteran: {
    label: "Veteran Resources",
    icon: "🎖",
    color: "#a78bfa",
    resources: [
      { label: "Veterans Crisis Line", detail: "Call 988 Press 1 · 24/7", phone: "988" },
      { label: "VA Mental Health Services", detail: "Free mental health care for eligible veterans", phone: "18002738255" },
      { label: "Vets4Warriors", detail: "Veteran-to-veteran peer support · 24/7", phone: "18558388838" },
      { label: "22Zero", detail: "Brain-based trauma protocol for veterans", url: "https://www.22zero.org" },
      { label: "Give an Hour", detail: "Free mental health care for veterans", url: "https://www.giveanhour.org" },
      { label: "Team Red White & Blue", detail: "Community and connection for veterans", url: "https://www.teamrwb.org" },
      { label: "Travis Manion Foundation", detail: "Purpose-driven leadership for veterans", url: "https://www.travismanion.org" },
      { label: "Student Veterans of America", detail: "College support for veterans", url: "https://www.studentveterans.org" },
      { label: "VA Benefits", detail: "Disability compensation and pension", phone: "18008271000" },
    ]
  },
  telecommunications: {
    label: "Telecommunications & Dispatch",
    icon: "📡",
    color: "#38bdf8",
    resources: [
      { label: "Beyond the Headset", detail: "Mental health community for 911 professionals", url: "https://www.beyondtheheadset.org" },
      { label: "Dispatcher Draft Project", detail: "Mental health for 911 dispatchers", url: "https://www.dispatcherdraftproject.com" },
      { label: "APCO International Wellness", detail: "Telecommunications professional wellness", url: "https://www.apcointl.org/programs/wellness/" },
      { label: "IAED — Emergency Dispatch", detail: "Professional standards and wellness for dispatchers", url: "https://www.iaed.org" },
      { label: "AAMS — CCT Dispatch", detail: "Air medical and critical care transport resources", url: "https://www.aams.org" },
      { label: "IAFCCP — Flight & CCT Paramedics", detail: "Critical care transport wellness", url: "https://www.iafccp.org" },
    ]
  },
  humanservices: {
    label: "Human Services Worker Resources",
    icon: "🏛",
    color: "#38bdf8",
    resources: [
      { label: "NCWWI — Child Welfare Workforce", detail: "Federally funded secondary trauma support for CPS/DSS", url: "https://www.ncwwi.org" },
      { label: "NCTSN — Secondary Traumatic Stress", detail: "STS tools for child welfare workers", url: "https://www.nctsn.org" },
      { label: "APS TARC — APS Worker Wellness", detail: "Adult Protective Services worker support", url: "https://www.napsa-now.org" },
      { label: "NAPSA — Adult Protective Services", detail: "APS worker mental health resources", url: "https://www.napsa-now.org" },
      { label: "Casey Family Programs", detail: "Workforce resilience and secondary trauma", url: "https://www.casey.org" },
      { label: "CWLA — Worker Wellness", detail: "Child welfare workforce wellness standards", url: "https://www.cwla.org" },
      { label: "NASW — Social Worker Self-Care", detail: "Self-care standards for social workers", url: "https://www.socialworkers.org" },
      { label: "ProQOL — Self Assessment", detail: "Free compassion fatigue self-assessment", url: "https://www.proqol.org" },
    ]
  },
  civilianworkforce: {
    label: "Civilian Workforce Resources",
    icon: "🏢",
    color: "#64748b",
    resources: [
      { label: "EAP — Employee Assistance Program", detail: "Ask HR for your number. Free confidential counseling.", url: null },
      { label: "SAMHSA Workplace Wellness", detail: "Free workplace mental health resources", url: "https://www.samhsa.gov/workplace" },
      { label: "Vicarious Trauma Toolkit", detail: "Free toolkit for public service staff", url: "https://vtt.ovc.ojp.gov" },
      { label: "ProQOL Self Assessment", detail: "Compassion fatigue self-assessment", url: "https://www.proqol.org" },
      { label: "Mental Health America — Workplace", detail: "Tools for managing mental health at work", url: "https://www.mhanational.org" },
      { label: "EEOC — Workplace Rights", detail: "Know your rights", phone: "18004694295" },
    ]
  },
  retiree: {
    label: "Retiree Resources",
    icon: "🏅",
    color: "#94a3b8",
    resources: [
      { label: "First Responder Support Network", detail: "Programs for retired first responders", url: "https://www.frsn.org" },
      { label: "Give an Hour", detail: "Free mental health care for veterans and first responders", url: "https://www.giveanhour.org" },
      { label: "22Zero", detail: "Brain-based trauma protocol", url: "https://www.22zero.org" },
      { label: "Hire Heroes USA", detail: "Free career coaching for transitioning responders", url: "https://www.hireheroesusa.org" },
      { label: "Team Red White & Blue", detail: "Community and connection in retirement", url: "https://www.teamrwb.org" },
      { label: "VA Benefits", detail: "Disability compensation and pension for eligible veterans", phone: "18008271000" },
      { label: "Firefighter Cancer Support Network", detail: "Cancer prevention and support for retired fire service", url: "https://www.firefightercancersupport.org" },
    ]
  },
  spouse: {
    label: "Spouse & Partner Resources",
    icon: "💙",
    color: "#f97316",
    resources: [
      { label: "National DV Hotline", detail: "800-799-7233 · 24/7 · Confidential", phone: "18007997233" },
      { label: "First Responders Foundation — Families", detail: "Support for first responder families", url: "https://www.firstrespondersfoundation.org" },
      { label: "Postpartum Support International", detail: "For mothers AND fathers — 800-944-4773", phone: "18009444773" },
      { label: "Al-Anon Family Groups", detail: "Support for families of those with alcohol problems", url: "https://al-anon.org" },
      { label: "NAMI HelpLine", detail: "Free mental health info and referrals", phone: "18009506264" },
      { label: "Open Path Collective", detail: "Affordable therapy — $30-$80/session", url: "https://openpathcollective.org" },
    ]
  },
  family: {
    label: "Family Resources",
    icon: "👨‍👩‍👧",
    color: "#22c55e",
    resources: [
      { label: "988 — Crisis Line", detail: "Call or text 988 · 24/7", phone: "988" },
      { label: "Teen Line", detail: "Text TEEN to 839863 · Peer support by teens", text: "839863", textBody: "TEEN" },
      { label: "Crisis Text Line", detail: "Text HOME to 741741", text: "741741" },
      { label: "Child Mind Institute", detail: "Kid and teen mental health resources", url: "https://childmind.org" },
      { label: "JED Foundation", detail: "Teen and young adult mental health", url: "https://www.jedfoundation.org" },
      { label: "Active Minds — College", detail: "College student mental health", url: "https://www.activeminds.org" },
      { label: "Love is Respect", detail: "Healthy relationships — ages 13-26", url: "https://www.loveisrespect.org" },
    ]
  },
};

// ── General resources always shown ────────────────────────────
const GENERAL_RESOURCES = [
  { label: "NAMI HelpLine", detail: "Free mental health info and referrals · 800-950-6264", phone: "18009506264", color: "#38bdf8" },
  { label: "Open Path Collective", detail: "Affordable therapy · $30-$80 per session", url: "https://openpathcollective.org", color: "#22c55e" },
  { label: "Psychology Today Therapist Finder", detail: "Find a therapist by specialty and insurance", url: "https://www.psychologytoday.com/us/therapists", color: "#38bdf8" },
  { label: "SMART Recovery", detail: "Science-based addiction recovery · Online and in-person", url: "https://www.smartrecovery.org", color: "#22c55e" },
  { label: "SAMHSA National Helpline", detail: "Free · Confidential · Treatment referrals · 24/7", phone: "18006624357", color: "#a78bfa" },
  { label: "Shift Work Sleep Disorder", detail: "Sleep foundation resources for shift workers", url: "https://www.sleepfoundation.org/shift-work", color: "#6366f1" },
];

function ResourceItem({ item, color }) {
  const handleTap = () => {
    if (item.phone) window.location.href = `tel:${item.phone}`;
    else if (item.text) window.location.href = `sms:${item.text}${item.textBody ? `?body=${item.textBody}` : ""}`;
    else if (item.url) window.open(item.url, "_blank");
  };
  return (
    <div onClick={item.phone || item.text || item.url ? handleTap : null}
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "11px 14px", marginBottom: 6, cursor: item.phone || item.text || item.url ? "pointer" : "default" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#dde8f4", marginBottom: 2 }}>{item.label}</div>
      <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.5 }}>{item.detail}</div>
      {(item.phone || item.text || item.url) && (
        <div style={{ fontSize: 11, fontWeight: 700, color: color || "#38bdf8", marginTop: 5 }}>
          {item.phone ? "📞 Tap to call" : item.text ? "💬 Tap to text" : "🔗 Tap to open"} →
        </div>
      )}
    </div>
  );
}

function DDSupportPanel() {
  const [open, setOpen] = React.useState(false);
  const [activeItem, setActiveItem] = React.useState(null);

  return (
    <div style={{ background:"rgba(167,139,250,0.06)", border:`1px solid ${open?"rgba(167,139,250,0.3)":"rgba(167,139,250,0.15)"}`, borderRadius:14, overflow:"hidden" }}>
      <div onClick={() => setOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", cursor:"pointer" }}>
        <span style={{ fontSize:20 }}>🧩</span>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, fontWeight:700, color:open?"#a78bfa":"#dde8f4" }}>Supporting People Who Process Differently</div>
          <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>Communication, de-escalation, resources -- for any setting</div>
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" style={{ transform:open?"rotate(90deg)":"none", transition:"transform 0.2s", flexShrink:0 }}><polyline points="9 18 15 12 9 6"/></svg>
      </div>
      {open && (
        <div style={{ padding:"0 14px 14px" }}>
          <div style={{ fontSize:11, color:"#64748b", lineHeight:1.6, marginBottom:12 }}>
            Plain language. No diagnostic labels. For anyone working with or supporting people with intellectual or developmental disabilities, autism, or anyone who processes information differently.
          </div>

          {/* Quick tools */}
          {[
            { label:"Communication Adjustments", items: DEVELOPMENTAL_SUPPORT.communicationAdjustments, color:"#38bdf8" },
            { label:"De-escalation Steps",       items: DEVELOPMENTAL_SUPPORT.deescalationSteps,       color:"#f97316" },
            { label:"For Family Members",         items: DEVELOPMENTAL_SUPPORT.familyGuide,             color:"#22c55e" },
          ].map((group, gi) => (
            <div key={gi} style={{ marginBottom:10 }}>
              <div style={{ fontSize:11, fontWeight:700, color:group.color, marginBottom:6, letterSpacing:"0.08em", textTransform:"uppercase" }}>{group.label}</div>
              {group.items.map((item, i) => (
                <div key={i} style={{ marginBottom:6 }}>
                  <div onClick={() => setActiveItem(activeItem===`${gi}-${i}`?null:`${gi}-${i}`)}
                    style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", background:"rgba(255,255,255,0.03)", border:`1px solid ${activeItem===`${gi}-${i}`?group.color+"40":"rgba(255,255,255,0.06)"}`, borderRadius:9, cursor:"pointer" }}>
                    <div style={{ flex:1, fontSize:12, fontWeight:600, color:activeItem===`${gi}-${i}`?group.color:"#dde8f4" }}>{item.title}</div>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" style={{ transform:activeItem===`${gi}-${i}`?"rotate(90deg)":"none", transition:"transform 0.2s", flexShrink:0 }}><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                  {activeItem===`${gi}-${i}` && (
                    <div style={{ padding:"10px 12px", fontSize:12, color:"#94a3b8", lineHeight:1.8, background:"rgba(255,255,255,0.02)", borderRadius:"0 0 9px 9px", border:`1px solid ${group.color}20`, borderTop:"none" }}>{item.body}</div>
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* Resources */}
          <div style={{ fontSize:11, fontWeight:700, color:"#a78bfa", marginBottom:6, letterSpacing:"0.08em", textTransform:"uppercase" }}>DD/ID Organizations</div>
          {DEVELOPMENTAL_SUPPORT.resources.slice(0,4).map((r,i) => (
            <div key={i} onClick={() => window.open(r.url,"_blank")}
              style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:9, padding:"10px 12px", marginBottom:6, cursor:"pointer" }}>
              <div style={{ fontSize:12, fontWeight:700, color:"#dde8f4" }}>{r.label}</div>
              <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{r.detail}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SmartResourcesScreen({ navigate, agency, logoSrc }) {
  const [seats, setSeats] = useState([]);
  const [expandedSection, setExpandedSection] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [finderQuery, setFinderQuery] = useState("");
  const [finderScope, setFinderScope] = useState("national");
  const [finderCity, setFinderCity] = useState("");
  const [finderLoading, setFinderLoading] = useState(false);
  const [finderResults, setFinderResults] = useState(null);
  const [finderError, setFinderError] = useState("");

  const handleSearch = async () => {
    const query = finderQuery.trim();
    if (!query) return;
    setFinderLoading(true);
    setFinderResults(null);
    setFinderError("");
    try {
      const seat = (() => { try { const s = localStorage.getItem("upstream_seats"); return s ? JSON.parse(s)[0] : "responder"; } catch(e) { return "responder"; } })();
      const userState = localStorage.getItem("upstream_user_state") || "";
      const res = await fetch("/.netlify/functions/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          scope: finderScope,
          location: finderCity,
          state: userState,
          seat,
          existingResources: [],
        }),
      });
      const data = await res.json();
      const results = data.resources || [];
      setFinderResults(results);
      if (results.length === 0) setFinderError("No results found. Try different terms or a broader scope.");
    } catch(e) {
      setFinderError("Search unavailable. Please check your connection.");
    }
    setFinderLoading(false);
  };

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("upstream_seats") || '["responder"]');
      setSeats(Array.isArray(stored) ? stored : ["responder"]);
    } catch(e) {
      setSeats(["responder"]);
    }
  }, []);

  // Get seat-specific resource sections
  const mySections = seats
    .filter(s => SEAT_RESOURCES[s])
    .map(s => SEAT_RESOURCES[s]);

  // Deduplicate if multiple seats share resources
  const seenLabels = new Set();
  const uniqueSections = mySections.map(section => ({
    ...section,
    resources: section.resources.filter(r => {
      if (seenLabels.has(r.label)) return false;
      seenLabels.add(r.label);
      return true;
    })
  }));

  return (
    <ScreenSingle headerProps={{ onBack: () => navigate("home"), agencyName: agency?.name, logoSrc }}>

      {/* ── AI RESOURCE FINDER ── */}
      <div style={{ background:"rgba(56,189,248,0.08)", border:"1.5px solid rgba(56,189,248,0.25)", borderRadius:16, padding:"16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
          <span style={{ fontSize:20 }}>🔍</span>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:"#38bdf8" }}>Find Resources Near You</div>
            <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>Local, regional, state, or national — type anything</div>
          </div>
        </div>
        <div style={{ display:"flex", gap:6, marginBottom:10 }}>
          {[{k:"local",l:"📍 Local"},{k:"regional",l:"🗺 Regional"},{k:"state",l:"🏛 State"},{k:"national",l:"🌐 National"}].map(s => (
            <div key={s.k} onClick={() => { setFinderResults(null); setFinderError(""); setFinderScope(s.k); }}
              style={{ flex:1, padding:"7px 2px", borderRadius:8, cursor:"pointer", textAlign:"center", background:finderScope===s.k?"rgba(56,189,248,0.15)":"rgba(255,255,255,0.03)", border:`1px solid ${finderScope===s.k?"rgba(56,189,248,0.35)":"rgba(255,255,255,0.07)"}` }}>
              <div style={{ fontSize:10, fontWeight:finderScope===s.k?800:600, color:finderScope===s.k?"#38bdf8":"#64748b" }}>{s.l}</div>
            </div>
          ))}
        </div>
        {finderScope === "local" && (
          <input value={finderCity} onChange={e => setFinderCity(e.target.value)} placeholder="City or ZIP code"
            style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:9, padding:"9px 12px", fontSize:12, outline:"none", width:"100%", color:"#dde8f4", marginBottom:8, boxSizing:"border-box" }}/>
        )}
        <div style={{ display:"flex", gap:8 }}>
          <input value={finderQuery} onChange={e => setFinderQuery(e.target.value)}
            onKeyDown={e => e.key==="Enter" && !finderLoading && handleSearch()}
            placeholder='e.g. "grief support" or "veteran housing NC"'
            style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:9, padding:"10px 12px", fontSize:12, outline:"none", color:"#dde8f4" }}/>
          <div onClick={() => !finderLoading && handleSearch()}
            style={{ padding:"10px 16px", borderRadius:9, cursor:finderLoading?"not-allowed":"pointer", background:finderLoading?"rgba(255,255,255,0.02)":"rgba(56,189,248,0.15)", border:`1px solid ${finderLoading?"rgba(255,255,255,0.06)":"rgba(56,189,248,0.35)"}`, fontSize:13, fontWeight:700, color:finderLoading?"#475569":"#38bdf8", flexShrink:0 }}>
            {finderLoading ? "..." : "Search"}
          </div>
        </div>
        {finderLoading && <div style={{ textAlign:"center", padding:"10px 0 2px", color:"#38bdf8", fontSize:12 }}>Searching...</div>}
        {finderError && <div style={{ fontSize:11, color:"#f87171", marginTop:8 }}>{finderError}</div>}
        {finderResults && finderResults.length > 0 && (
          <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:8 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"#475569", letterSpacing:"0.1em" }}>RESULTS</div>
            {finderResults.map((r, i) => (
              <div key={i} onClick={() => r.url ? window.open(r.url,"_blank") : r.phone ? window.location.href="tel:"+r.phone : null}
                style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"11px 13px", cursor:"pointer" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#dde8f4", marginBottom:2 }}>{r.name}</div>
                {r.description && <div style={{ fontSize:11, color:"#64748b", lineHeight:1.5, marginBottom:4 }}>{r.description.slice(0,120)}{r.description.length>120?"...":""}</div>}
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  {r.category && <span style={{ fontSize:9, fontWeight:700, color:"#38bdf8", background:"rgba(56,189,248,0.1)", padding:"2px 6px", borderRadius:4 }}>{r.category}</span>}
                  {r.verified && <span style={{ fontSize:9, fontWeight:700, color:"#22c55e", background:"rgba(34,197,94,0.1)", padding:"2px 6px", borderRadius:4 }}>✓ Vetted</span>}
                </div>
              </div>
            ))}
          </div>
        )}
        {finderResults && finderResults.length === 0 && !finderLoading && (
          <div style={{ textAlign:"center", padding:"8px 0 2px", color:"#475569", fontSize:12 }}>No results. Try different terms or broader scope.</div>
        )}
      </div>

      {/* Header */}
      <div style={{ fontSize: 18, fontWeight: 800, color: "#dde8f4", marginBottom: 4 }}>Resources</div>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16, lineHeight: 1.6 }}>
        Curated for you based on your role. Crisis resources are always at the top.
      </div>

      {/* ── CRISIS — ALWAYS VISIBLE ── */}
      <div style={{ background: "rgba(239,68,68,0.07)", border: "1.5px solid rgba(239,68,68,0.2)", borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(239,68,68,0.15)" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#ef4444", letterSpacing: "0.12em", textTransform: "uppercase" }}>🚨 Crisis — Always Available</div>
        </div>
        <div style={{ padding: "10px 14px" }}>
          {CRISIS_ALWAYS.map((item, i) => (
            <div key={i} onClick={() => window.location.href = item.action}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < CRISIS_ALWAYS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", cursor: "pointer" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#dde8f4" }}>{item.label}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>{item.detail}</div>
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, color: item.color, background: item.color + "15", border: `1px solid ${item.color}30`, padding: "5px 10px", borderRadius: 8, whiteSpace: "nowrap", flexShrink: 0 }}>
                {item.actionLabel}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FOR YOU — SEAT AWARE ── */}
      {uniqueSections.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#475569", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
            For You
          </div>
          {uniqueSections.map((section, si) => (
            <div key={si} style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${expandedSection === si ? section.color + "40" : "rgba(255,255,255,0.06)"}`, borderRadius: 14, overflow: "hidden", marginBottom: 8 }}>
              <div onClick={() => setExpandedSection(expandedSection === si ? null : si)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }}>
                <span style={{ fontSize: 20 }}>{section.icon}</span>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: expandedSection === si ? section.color : "#dde8f4" }}>{section.label}</div>
                <div style={{ fontSize: 10, color: "#475569" }}>{section.resources.length} resources</div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" style={{ transform: expandedSection === si ? "rotate(90deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
              </div>
              {expandedSection === si && (
                <div style={{ padding: "0 14px 14px" }}>
                  {section.resources.map((r, ri) => (
                    <ResourceItem key={ri} item={r} color={section.color}/>
                  ))}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* ── GENERAL RESOURCES ── */}
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "#475569", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
          General Resources
        </div>
        {GENERAL_RESOURCES.map((item, i) => (
          <ResourceItem key={i} item={item} color={item.color}/>
        ))}
      </div>

      {/* ── LOCAL RESOURCES (if agency has them) ── */}
      {agency?.localResources && agency.localResources.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#475569", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
            Local — {agency.name}
          </div>
          {agency.localResources.map((item, i) => (
            <ResourceItem key={i} item={item} color="#22c55e"/>
          ))}
        </div>
      )}

      {/* ── DEVELOPMENTAL SUPPORT ── */}
      <div style={{ marginTop: 16 }}>
        <DDSupportPanel/>
      </div>

      {/* ── UPDATE SEATS ── */}
      <div onClick={() => navigate("about")} style={{ marginTop: 20, padding: "12px 16px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 12, color: "#475569" }}>
        Not seeing the right resources? Update your role in Settings →
      </div>

    </ScreenSingle>
  );
}
