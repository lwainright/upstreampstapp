// ============================================================
// SCREEN: ResourcesScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect } from 'react';
import { Screen, Btn, Card, SLabel } from './ui.jsx';
import { databases } from './appwrite.js';
import { Query, ID } from 'appwrite';

const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE || '69c88588001ed071c19e';

const CRISIS_KEYWORDS = ["suicide","kill myself","end it","can't go on","don't want to be here","hurt myself","self harm","crisis","emergency"];
const EMOTIONAL_KEYWORDS = ["overwhelmed","struggling","not okay","can't handle","breaking down","falling apart","exhausted","hopeless","depressed","anxious","stressed","burned out","can't cope"];

const neighboringStates = {
  "AL":["MS","TN","GA","FL"],"AK":[],"AZ":["CA","NV","UT","CO","NM"],"AR":["MO","TN","MS","LA","TX","OK"],
  "CA":["OR","NV","AZ"],"CO":["WY","NE","KS","OK","NM","AZ","UT"],"CT":["NY","MA","RI"],
  "DE":["MD","PA","NJ"],"FL":["GA","AL"],"GA":["FL","AL","TN","NC","SC"],"HI":[],
  "ID":["MT","WY","UT","NV","OR","WA"],"IL":["WI","IA","MO","KY","IN"],"IN":["IL","MI","OH","KY"],
  "IA":["MN","WI","IL","MO","NE","SD"],"KS":["NE","MO","OK","CO"],"KY":["OH","IN","IL","MO","TN","VA","WV"],
  "LA":["AR","MS","TX"],"ME":["NH"],"MD":["PA","DE","VA","WV"],"MA":["NH","VT","NY","CT","RI"],
  "MI":["WI","IN","OH"],"MN":["ND","SD","IA","WI"],"MS":["TN","AL","LA","AR"],
  "MO":["IA","IL","KY","TN","AR","OK","KS","NE"],"MT":["ID","WY","SD","ND"],
  "NE":["SD","IA","MO","KS","CO","WY"],"NV":["OR","ID","UT","AZ","CA"],"NH":["VT","ME","MA"],
  "NJ":["NY","PA","DE"],"NM":["CO","OK","TX","AZ"],"NY":["PA","NJ","CT","MA","VT"],
  "NC":["VA","TN","GA","SC"],"ND":["MT","SD","MN"],"OH":["PA","WV","KY","IN","MI"],
  "OK":["KS","MO","AR","TX","NM","CO"],"OR":["WA","ID","NV","CA"],"PA":["NY","NJ","DE","MD","WV","OH"],
  "RI":["CT","MA"],"SC":["NC","GA"],"SD":["ND","MN","IA","NE","WY","MT"],
  "TN":["KY","VA","NC","GA","AL","MS","AR","MO"],"TX":["NM","OK","AR","LA"],"UT":["ID","WY","CO","NM","AZ","NV"],
  "VT":["NY","NH","MA"],"VA":["MD","WV","KY","TN","NC"],"WA":["ID","OR"],
  "WV":["OH","PA","MD","VA","KY"],"WI":["MN","MI","IL","IA"],"WY":["MT","SD","NE","CO","UT","ID"]
};

const STATE_NAMES = {
  AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",
  DE:"Delaware",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",
  KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",
  MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",
  NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",
  OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",
  TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",
  WI:"Wisconsin",WY:"Wyoming",DC:"Washington D.C."
};

const crisis = [
  { name:"988 Suicide & Crisis Lifeline", detail:"Call or text 988 · 24/7", description:"Free, confidential support for people in distress. Available around the clock for anyone in emotional crisis or suicidal distress.", category:"Crisis", scope:"National", color:"#ef4444", icon:"📞", phone:"988" },
  { name:"Crisis Text Line", detail:"Text HOME to 741741", description:"Free 24/7 crisis support via text. Connect with a trained crisis counselor by texting HOME to 741741.", category:"Crisis", scope:"National", color:"#f97316", icon:"💬", textTo:"741741", textBody:"HOME" },
  { name:"Safe Call Now", detail:"1-206-459-3020 · First Responders", description:"Confidential 24/7 crisis referral service designed specifically for first responders, public safety professionals, and their families.", category:"Crisis", scope:"National", color:"#38bdf8", icon:"🔵", phone:"12064593020" },
  { name:"Badge of Life", detail:"badgeoflife.com", description:"Mental health and suicide prevention resources specifically for law enforcement. Peer support training and officer wellness resources.", category:"Mental Health", scope:"National", color:"#a78bfa", icon:"🛡", url:"https://www.badgeoflife.org" },
  { name:"First Responder Support Network", detail:"frsn.org", description:"Peer support and treatment programs for first responders struggling with PTSD, addiction, and other behavioral health challenges.", category:"Peer Support", scope:"National", color:"#22c55e", icon:"🌐", url:"https://www.frsn.org" }
];

const upstream = [
  { name:"Resilience Building", detail:"Sleep, nutrition, exercise, peer connection", description:"Proactive strategies for building and maintaining mental and physical resilience. Covers sleep hygiene, nutrition for shift workers, exercise routines, and peer connection.", category:"Wellness", scope:"National", icon:"💪", color:"#22c55e" },
  { name:"Stress Inoculation", detail:"Understanding cumulative stress exposure", description:"Educational resources on how repeated exposure to trauma and stress accumulates over a career. Learn early warning signs and proactive coping strategies.", category:"Education", scope:"National", icon:"🧠", color:"#38bdf8" },
  { name:"Compassion Fatigue Education", detail:"Recognizing early warning signs", description:"Understand the difference between burnout, compassion fatigue, and PTSD. Identify where you are and what steps to take.", category:"Education", scope:"National", icon:"📖", color:"#a78bfa" },
  { name:"Peer Community", detail:"Mentorship, forums, agency wellness", description:"Connect with peers who understand the job. Mentorship programs, anonymous forums, and agency wellness initiatives.", category:"Peer Support", scope:"National", icon:"🤝", color:"#eab308" },
  { name:"Family Resources", detail:"Supporting those who support you", description:"Resources for first responder families including communication guides, stress management for partners, and family counseling referrals.", category:"Family", scope:"National", icon:"🏠", color:"#f97316" }
];

const downstream = [
  { name:"First Responder Therapist Finder", detail:"Specialists who understand the job", description:"Directory of licensed therapists with specific training in first responder culture, trauma, and occupational stress. Nationwide listings.", category:"Therapy", scope:"National", icon:"🔍", color:"#38bdf8", url:"https://www.frsn.org" },
  { name:"EMDR & Trauma Treatment", detail:"Evidence-based trauma processing", description:"Eye Movement Desensitization and Reprocessing (EMDR) is a highly effective, evidence-based treatment for PTSD. Find certified EMDR therapists who specialize in first responders.", category:"Therapy", scope:"National", icon:"🌀", color:"#a78bfa" },
  { name:"Substance Use Recovery", detail:"Peer-led programs, SMART Recovery", description:"Confidential recovery support programs designed for first responders. Peer-led groups, SMART Recovery, and agency-sensitive treatment options.", category:"Recovery", scope:"National", icon:"🌱", color:"#22c55e" },
  { name:"CISM Debriefing", detail:"Critical incident stress management", description:"Structured group debriefing process for teams following a critical incident. ICISF-certified teams available nationwide.", category:"CISM", scope:"National", icon:"🗣", color:"#f97316" },
  { name:"Return to Duty Guidance", detail:"Legal rights and peer advocacy", description:"Know your rights. Resources for navigating fitness for duty evaluations, FMLA, ADA accommodations, and returning to work after a mental health leave.", category:"Legal", scope:"National", icon:"⚖️", color:"#eab308" }
];

export default function ResourcesScreen({ navigate, agency, role, userState, onChangeState, logoSrc }) {
  const [tab, setTab] = useState("crisis");
  const [selectedResource, setSelectedResource] = useState(null);

  // Find Help state
  const [finderScope, setFinderScope] = useState(null);
  const [finderCity, setFinderCity] = useState("");
  const [finderQuery, setFinderQuery] = useState("");
  const [finderLoading, setFinderLoading] = useState(false);
  const [finderResults, setFinderResults] = useState(null);
  const [finderError, setFinderError] = useState("");
  const [showEmotionalRedirect, setShowEmotionalRedirect] = useState(false);
  const [showCrisisRedirect, setShowCrisisRedirect] = useState(false);
  const [showStateChange, setShowStateChange] = useState(false);

  const currentState = userState || "NC";
  const stateName = STATE_NAMES[currentState] || currentState;
  const neighbors = neighboringStates[currentState] || [];

  const getResourceHref = (resource) => {
    if (!resource) return null;
    if (resource.phone) return `tel:${String(resource.phone).replace(/[^\d+]/g, '')}`;
    if (resource.textTo) { const body = encodeURIComponent(resource.textBody || ''); return `sms:${resource.textTo}${body ? `?body=${body}` : ''}`; }
    if (resource.url) return resource.url;
    return null;
  };

  const openResource = (resource) => {
    const href = getResourceHref(resource);
    if (!href) return;
    if (href.startsWith('tel:') || href.startsWith('sms:')) { window.location.href = href; return; }
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  // Auto-fire search when scope is tapped (except local which needs city)
  useEffect(() => {
    if (finderScope && finderScope !== "local") {
      handleSearch();
    }
  }, [finderScope]);

  const handleSearch = async (overrideQuery) => {
    const query = overrideQuery || finderQuery || `first responder mental health resources`;

    const lower = query.toLowerCase();
    if (CRISIS_KEYWORDS.some(k => lower.includes(k))) { setShowCrisisRedirect(true); return; }
    if (EMOTIONAL_KEYWORDS.some(k => lower.includes(k))) { setShowEmotionalRedirect(true); return; }

    setFinderLoading(true);
    setFinderResults(null);
    setFinderError("");
    setShowEmotionalRedirect(false);
    setShowCrisisRedirect(false);

    try {
      // Get existing resources to avoid duplicates
      let appwriteResources = [];
      try {
        const res = await databases.listDocuments(DB_ID, 'resources', [
          Query.equal('active', true),
          Query.limit(50),
          ...(finderScope === "state" || finderScope === "local" || finderScope === "regional"
            ? [Query.equal('state', currentState)]
            : []),
        ]);
        appwriteResources = res.documents || [];
      } catch(e) {}

      // If we have enough from Appwrite, show those first
      if (appwriteResources.length >= 3) {
        setFinderResults(appwriteResources.map(r => ({
          name: r.title,
          description: r.notes || "",
          phone: r.phone || "",
          url: r.file_url || "",
          category: r.type || "Resource",
          scope: r.state ? stateName : "National",
          verified: r.verified,
          fromDatabase: true,
        })));
      }

      // Call Tavily search function
      const response = await fetch("/.netlify/functions/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          scope: finderScope,
          location: finderCity,
          state: currentState,
          existingResources: appwriteResources.slice(0, 20),
        })
      });

      const data = await response.json();
      const text = data.text || "";

      if (text === "REDIRECT_EMOTIONAL") { setShowEmotionalRedirect(true); setFinderLoading(false); return; }
      if (text === "REDIRECT_CRISIS") { setShowCrisisRedirect(true); setFinderLoading(false); return; }

      try {
        let clean = text.replace(/```json|```/g, "").trim();
        if (!clean.startsWith("[")) {
          const start = clean.indexOf("[");
          if (start >= 0) clean = clean.substring(start);
        }
        if (!clean.endsWith("]")) {
          const lastBrace = clean.lastIndexOf("},");
          if (lastBrace > 0) clean = clean.substring(0, lastBrace + 1) + "]";
          else clean = clean + "]";
        }
        const parsed = JSON.parse(clean);
        const aiResults = Array.isArray(parsed) ? parsed.map(r => ({...r, aiFound: true})) : [];

        // Combine database + AI results, deduplicate by name
        const existing = finderResults || [];
        const existingNames = new Set(existing.map(r => r.name?.toLowerCase()));
        const newResults = aiResults.filter(r => !existingNames.has(r.name?.toLowerCase()));
        setFinderResults([...existing, ...newResults]);

        // Auto-save new AI-found resources
        newResults.forEach(async (r) => {
          try {
            await databases.createDocument(DB_ID, 'resources', ID.unique(), {
              title: (r.name || "Unknown").slice(0, 200),
              type: (r.category || "resource").slice(0, 200),
              phone: r.phone ? String(r.phone).slice(0, 20) : null,
              notes: r.description ? String(r.description).slice(0, 500) : null,
              state: finderScope === "national" ? null : (currentState || null),
              app_type: "first_responder",
              source: "ai_found",
              active: false,
              verified: false,
            });
          } catch(e) {}
        });
      } catch(e) {
        if (!finderResults || finderResults.length === 0) {
          setFinderError("Could not find resources. Please try a different search.");
        }
      }
    } catch(e) {
      if (!finderResults || finderResults.length === 0) {
        setFinderError("Search unavailable. Please check your connection.");
      }
    }
    setFinderLoading(false);
  };

  const tabs = [
    { key:"crisis",     label:"Crisis" },
    { key:"finder",     label:"Find Help" },
    { key:"upstream",   label:"Upstream" },
    { key:"downstream", label:"Downstream" },
  ];

  // Resource detail view
  if (selectedResource) {
    const r = selectedResource;
    return (
      <Screen headerProps={{ onBack: () => setSelectedResource(null), title: "Resource Detail", agencyName: agency?.name, logoSrc }}>
        <Card style={{ background:`${r.color || "#38bdf8"}10`, borderColor:`${r.color || "#38bdf8"}25` }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:12 }}>
            <div style={{ width:52, height:52, borderRadius:14, background:`${r.color || "#38bdf8"}18`, border:`1px solid ${r.color || "#38bdf8"}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>
              {r.icon || "🌐"}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:16, fontWeight:800, color:"#dde8f4", lineHeight:1.3 }}>{r.name}</div>
            </div>
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
            {r.category && <span style={{ fontSize:10, fontWeight:700, color:r.color||"#38bdf8", background:`${r.color||"#38bdf8"}15`, padding:"3px 8px", borderRadius:6 }}>{r.category}</span>}
            {r.scope && <span style={{ fontSize:10, fontWeight:700, color:"#64748b", background:"rgba(255,255,255,0.06)", padding:"3px 8px", borderRadius:6 }}>{r.scope}</span>}
            {r.verified && <span style={{ fontSize:10, fontWeight:700, color:"#22c55e", background:"rgba(34,197,94,0.1)", padding:"3px 8px", borderRadius:6 }}>✓ Vetted</span>}
            {r.aiFound && <span style={{ fontSize:10, fontWeight:700, color:"#eab308", background:"rgba(234,179,8,0.1)", padding:"3px 8px", borderRadius:6 }}>AI Found</span>}
            {r.free && <span style={{ fontSize:10, fontWeight:700, color:"#22c55e", background:"rgba(34,197,94,0.1)", padding:"3px 8px", borderRadius:6 }}>Free</span>}
          </div>
          <p style={{ fontSize:13, color:"#8099b0", lineHeight:1.75 }}>{r.description || r.detail}</p>
        </Card>

        {r.phone && (
          <div onClick={() => window.location.href = `tel:${String(r.phone).replace(/[^\d+]/g, '')}`} style={{ background:"rgba(34,197,94,0.1)", border:"1.5px solid rgba(34,197,94,0.3)", borderRadius:14, padding:"16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontSize:22 }}>📞</div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"#22c55e" }}>Call Now</div>
              <div style={{ fontSize:12, color:"#64748b" }}>{r.phone}</div>
            </div>
          </div>
        )}
        {r.textTo && (
          <div onClick={() => window.location.href = `sms:${r.textTo}?body=${encodeURIComponent(r.textBody||'')}`} style={{ background:"rgba(56,189,248,0.1)", border:"1.5px solid rgba(56,189,248,0.3)", borderRadius:14, padding:"16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontSize:22 }}>💬</div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"#38bdf8" }}>Send Text</div>
              <div style={{ fontSize:12, color:"#64748b" }}>Text {r.textBody} to {r.textTo}</div>
            </div>
          </div>
        )}
        {r.url && (
          <div onClick={() => window.open(r.url, '_blank', 'noopener,noreferrer')} style={{ background:"rgba(167,139,250,0.1)", border:"1.5px solid rgba(167,139,250,0.3)", borderRadius:14, padding:"16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontSize:22 }}>🌐</div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"#a78bfa" }}>Visit Website</div>
              <div style={{ fontSize:12, color:"#64748b" }}>{r.url.replace('https://','').replace('http://','')}</div>
            </div>
          </div>
        )}
      </Screen>
    );
  }

  return (
    <Screen headerProps={{ onBack: () => navigate("home"), title:"Resources", agencyName:agency?.name, logoSrc }}>

      {/* TABS */}
      <div className="full-width" style={{ display:"flex", gap:5, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:5, overflowX:"auto", minHeight:50 }}>
        {tabs.map(t => (
          <div key={t.key} onClick={() => setTab(t.key)} style={{ flex:1, textAlign:"center", padding:"10px 8px", borderRadius:9, background:tab===t.key?"rgba(56,189,248,0.18)":"transparent", border:"1px solid "+(tab===t.key?"rgba(56,189,248,0.35)":"transparent"), cursor:"pointer", fontSize:11, fontWeight:tab===t.key?800:600, color:tab===t.key?"#38bdf8":"#8099b0", whiteSpace:"nowrap", display:"flex", alignItems:"center", justifyContent:"center" }}>
            {t.label}
          </div>
        ))}
      </div>

      {/* ── CRISIS ── */}
      {tab === "crisis" && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div className="full-width" style={{ background:"rgba(239,68,68,0.1)", border:"1.5px solid rgba(239,68,68,0.35)", borderRadius:12, padding:"14px 16px" }}>
            <div style={{ fontSize:13, color:"#fca5a5", fontWeight:800, marginBottom:6 }}>If you're in crisis right now</div>
            <div style={{ fontSize:13, color:"#94a3b8", lineHeight:1.7 }}>
              Call or text <span style={{ color:"#f87171", fontWeight:700 }}>988</span> · Text HOME to <span style={{ color:"#f87171", fontWeight:700 }}>741741</span> · Safe Call Now <span style={{ color:"#f87171", fontWeight:700 }}>1-206-459-3020</span>
            </div>
          </div>
          <SLabel color="#ef4444">Available 24/7</SLabel>
          {crisis.map((r, i) => (
            <Card key={i} onClick={() => setSelectedResource(r)} style={{ display:"flex", alignItems:"flex-start", gap:14, cursor:"pointer" }}>
              <div style={{ width:48, height:48, borderRadius:13, background:`${r.color}18`, border:`1px solid ${r.color}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{r.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#dde8f4", marginBottom:3 }}>{r.name}</div>
                <div style={{ fontSize:12, color:"#8099b0", marginBottom:4 }}>{r.detail}</div>
                <div style={{ fontSize:12, color:"#64748b", lineHeight:1.6 }}>{r.description}</div>
                <div style={{ display:"flex", gap:6, marginTop:6 }}>
                  <span style={{ fontSize:9, fontWeight:700, color:r.color, background:`${r.color}15`, padding:"2px 8px", borderRadius:5 }}>{r.category}</span>
                  <span style={{ fontSize:9, fontWeight:700, color:"#475569", background:"rgba(255,255,255,0.05)", padding:"2px 8px", borderRadius:5 }}>{r.scope}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── FIND HELP ── */}
      {tab === "finder" && (
        <div>
          <Card style={{ background:"rgba(56,189,248,0.05)", borderColor:"rgba(56,189,248,0.15)", marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:800, color:"#38bdf8", marginBottom:4 }}>AI Resource Finder</div>
            <div style={{ fontSize:12, color:"#64748b", lineHeight:1.6 }}>Tap your search scope to find resources. Results come from our vetted database first, then live web search.</div>
          </Card>

          {/* Scope buttons — auto-fire on tap */}
          <SLabel color="#38bdf8">What scope?</SLabel>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
            {[
              { k:"local",    l:"📍 Local",    sub:"Your city or ZIP" },
              { k:"regional", l:"🗺 Regional",  sub:`${stateName} + neighbors` },
              { k:"state",    l:"🏛 State",     sub:stateName },
              { k:"national", l:"🌐 National",  sub:"Nationwide" },
            ].map(s => (
              <div key={s.k} onClick={() => {
                setFinderResults(null);
                setFinderError("");
                setShowEmotionalRedirect(false);
                setShowCrisisRedirect(false);
                setFinderScope(s.k);
              }} style={{ padding:"14px 12px", borderRadius:12, cursor:"pointer", textAlign:"center", background:finderScope===s.k?"rgba(56,189,248,0.15)":"rgba(255,255,255,0.03)", border:`1.5px solid ${finderScope===s.k?"rgba(56,189,248,0.4)":"rgba(255,255,255,0.07)"}`, transition:"all 0.2s" }}>
                <div style={{ fontSize:14, fontWeight:800, color:finderScope===s.k?"#38bdf8":"#dde8f4", marginBottom:3 }}>{s.l}</div>
                <div style={{ fontSize:11, color:"#64748b" }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* State confirmation */}
          {(finderScope === "state" || finderScope === "regional") && (
            <div style={{ background:"rgba(56,189,248,0.06)", border:"1px solid rgba(56,189,248,0.15)", borderRadius:10, padding:"10px 14px", marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:12, color:"#8099b0" }}>Searching: <span style={{ color:"#38bdf8", fontWeight:700 }}>{stateName}</span></div>
              <div onClick={() => onChangeState && onChangeState()} style={{ fontSize:12, color:"#38bdf8", cursor:"pointer", textDecoration:"underline" }}>Not your state?</div>
            </div>
          )}

          {/* City/zip for local */}
          {finderScope === "local" && (
            <div style={{ marginBottom:12 }}>
              <input value={finderCity} onChange={e => setFinderCity(e.target.value)} placeholder="Enter city or ZIP code" style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"12px 14px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%", color:"#dde8f4", marginBottom:8 }}/>
              <div onClick={() => finderCity.trim() && handleSearch()} style={{ padding:"12px", borderRadius:10, cursor:finderCity.trim()?"pointer":"not-allowed", textAlign:"center", background:finderCity.trim()?"rgba(56,189,248,0.12)":"rgba(255,255,255,0.02)", border:`1.5px solid ${finderCity.trim()?"rgba(56,189,248,0.3)":"rgba(255,255,255,0.06)"}`, fontSize:13, fontWeight:700, color:finderCity.trim()?"#38bdf8":"#475569" }}>
                Search Local Resources
              </div>
            </div>
          )}

          {/* Optional keyword refinement */}
          {finderScope && (
            <div style={{ marginBottom:12 }}>
              <textarea value={finderQuery} onChange={e => setFinderQuery(e.target.value)} placeholder="What resources can I help you locate today? (optional — leave blank for general results)" rows={2} style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"12px 14px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"none", width:"100%", lineHeight:1.5, color:"#dde8f4" }}/>
              {finderQuery.trim() && (
                <div onClick={() => handleSearch()} style={{ marginTop:8, padding:"10px", borderRadius:10, cursor:"pointer", textAlign:"center", background:"rgba(56,189,248,0.1)", border:"1px solid rgba(56,189,248,0.25)", fontSize:12, fontWeight:700, color:"#38bdf8" }}>
                  Refine Search
                </div>
              )}
            </div>
          )}

          {/* Loading */}
          {finderLoading && (
            <div style={{ textAlign:"center", padding:"24px", color:"#38bdf8", fontSize:13 }}>
              <div style={{ fontSize:24, marginBottom:8 }}>🔍</div>
              Searching live resources...
            </div>
          )}

          {/* Crisis redirect */}
          {showCrisisRedirect && (
            <Card style={{ background:"rgba(239,68,68,0.08)", borderColor:"rgba(239,68,68,0.25)", marginBottom:12 }}>
              <div style={{ fontSize:14, fontWeight:800, color:"#f87171", marginBottom:8 }}>Are you in crisis right now?</div>
              <div style={{ fontSize:13, color:"#94a3b8", lineHeight:1.6, marginBottom:14 }}>Help is available 24/7. Please reach out now.</div>
              <div onClick={() => { setTab("crisis"); setShowCrisisRedirect(false); }} style={{ padding:"12px", borderRadius:10, cursor:"pointer", textAlign:"center", background:"rgba(239,68,68,0.15)", border:"1.5px solid rgba(239,68,68,0.4)", fontSize:13, fontWeight:700, color:"#f87171" }}>
                View Crisis Resources →
              </div>
            </Card>
          )}

          {/* Emotional redirect */}
          {showEmotionalRedirect && (
            <Card style={{ background:"rgba(167,139,250,0.07)", borderColor:"rgba(167,139,250,0.2)", marginBottom:12 }}>
              <div style={{ fontSize:14, fontWeight:800, color:"#c4b5fd", marginBottom:8 }}>It sounds like you may need someone to talk to.</div>
              <div style={{ fontSize:13, color:"#94a3b8", lineHeight:1.6, marginBottom:14 }}>Our AI Peer Support is available right now — confidential, anytime.</div>
              <div onClick={() => navigate("aichat")} style={{ padding:"12px", borderRadius:10, cursor:"pointer", textAlign:"center", background:"rgba(167,139,250,0.12)", border:"1.5px solid rgba(167,139,250,0.3)", fontSize:13, fontWeight:700, color:"#a78bfa" }}>
                Connect with AI Peer Support →
              </div>
            </Card>
          )}

          {/* Error */}
          {finderError && <div style={{ fontSize:12, color:"#f87171", marginBottom:12, textAlign:"center" }}>{finderError}</div>}

          {/* Results */}
          {finderResults && finderResults.length === 0 && !finderLoading && (
            <div style={{ textAlign:"center", padding:"20px", color:"#475569", fontSize:13 }}>No resources found. Try a different scope or search term.</div>
          )}
          {finderResults && finderResults.map((r, i) => (
            <Card key={i} onClick={() => setSelectedResource({ ...r, icon:"🌐", color: r.verified ? "#22c55e" : "#38bdf8" })} style={{ display:"flex", alignItems:"flex-start", gap:14, cursor:"pointer", marginBottom:10 }}>
              <div style={{ width:48, height:48, borderRadius:13, background: r.verified ? "rgba(34,197,94,0.1)" : "rgba(56,189,248,0.1)", border:`1px solid ${r.verified ? "rgba(34,197,94,0.2)" : "rgba(56,189,248,0.2)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>🌐</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#dde8f4", marginBottom:3 }}>{r.name}</div>
                {r.description && <div style={{ fontSize:12, color:"#8099b0", lineHeight:1.6, marginBottom:4 }}>{r.description}</div>}
                {(r.phone || r.url) && <div style={{ fontSize:11, color:"#64748b", marginBottom:4 }}>{r.phone || r.url}</div>}
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {r.category && <span style={{ fontSize:9, fontWeight:700, color:"#38bdf8", background:"rgba(56,189,248,0.1)", padding:"2px 8px", borderRadius:5 }}>{r.category}</span>}
                  {r.scope && <span style={{ fontSize:9, fontWeight:700, color:"#64748b", background:"rgba(255,255,255,0.05)", padding:"2px 8px", borderRadius:5 }}>{r.scope}</span>}
                  {r.verified && <span style={{ fontSize:9, fontWeight:700, color:"#22c55e", background:"rgba(34,197,94,0.1)", padding:"2px 8px", borderRadius:5 }}>✓ Vetted</span>}
                  {r.aiFound && !r.verified && <span style={{ fontSize:9, fontWeight:700, color:"#eab308", background:"rgba(234,179,8,0.1)", padding:"2px 8px", borderRadius:5 }}>AI Found</span>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── UPSTREAM ── */}
      {tab === "upstream" && (
        <>
          <SLabel color="#22c55e">Proactive Mental Health</SLabel>
          {upstream.map((item, i) => (
            <Card key={i} onClick={() => setSelectedResource(item)} style={{ display:'flex', alignItems:'flex-start', gap:14, cursor:"pointer" }}>
              <div style={{ fontSize:28, flexShrink:0, marginTop:2 }}>{item.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'#dde8f4', marginBottom:3 }}>{item.name}</div>
                <div style={{ fontSize:12, color:'#8099b0', marginBottom:4 }}>{item.detail}</div>
                <div style={{ fontSize:12, color:"#64748b", lineHeight:1.6 }}>{item.description}</div>
              </div>
            </Card>
          ))}
        </>
      )}

      {/* ── DOWNSTREAM ── */}
      {tab === "downstream" && (
        <>
          <SLabel color="#a78bfa">Trauma & Recovery Support</SLabel>
          {downstream.map((item, i) => (
            <Card key={i} onClick={() => setSelectedResource(item)} style={{ display:'flex', alignItems:'flex-start', gap:14, cursor:"pointer" }}>
              <div style={{ fontSize:28, flexShrink:0, marginTop:2 }}>{item.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:'#dde8f4', marginBottom:3 }}>{item.name}</div>
                <div style={{ fontSize:12, color:'#8099b0', marginBottom:4 }}>{item.detail}</div>
                <div style={{ fontSize:12, color:"#64748b", lineHeight:1.6 }}>{item.description}</div>
              </div>
            </Card>
          ))}
        </>
      )}

    </Screen>
  );
}
