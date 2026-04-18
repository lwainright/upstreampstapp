// ============================================================
// SCREEN: ResourcesScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect } from 'react';
import { Screen, Btn, Card, SLabel } from './ui.jsx';
import { databases } from './appwrite.js';
import { Query } from 'appwrite';
import { fetchResources } from './fetchResources.js';

const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE || '69c88588001ed071c19e';

const CRISIS_KEYWORDS = ["suicide","kill myself","end it","can't go on","don't want to be here","hurt myself","self harm","crisis","emergency"];
const EMOTIONAL_KEYWORDS = ["overwhelmed","struggling","not okay","can't handle","breaking down","falling apart","exhausted","hopeless","depressed","anxious","stressed","burned out","burnout","falling apart","can't cope"];

export default function ResourcesScreen({ navigate, agency, role, userState, onChangeState, logoSrc }) {
  const [tab, setTab] = useState("crisis");
  const [zip, setZip] = useState(() => { try { return localStorage.getItem('upstream_zip') || ''; } catch (e) { return ''; } });
  const [zipLoading, setZipLoading] = useState(false);
  const [selectedState, setSelectedState] = useState(userState || "NC");
  const [selectedDiscipline, setSelectedDiscipline] = useState("All");
  const [aiResources, setAiResources] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);

  // AI Finder state
  const [finderQuery, setFinderQuery] = useState("");
  const [finderScope, setFinderScope] = useState("state");
  const [finderCity, setFinderCity] = useState("");
  const [finderLoading, setFinderLoading] = useState(false);
  const [finderResults, setFinderResults] = useState(null);
  const [finderError, setFinderError] = useState("");
  const [showEmotionalRedirect, setShowEmotionalRedirect] = useState(false);
  const [showCrisisRedirect, setShowCrisisRedirect] = useState(false);

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

  const crisis = [
    { name: "988 Suicide & Crisis Lifeline", detail: "Call or text 988 · Available 24/7", description: "Free, confidential support for people in distress. Available around the clock for anyone in emotional crisis or suicidal distress.", category: "Crisis", scope: "National", color: "#ef4444", icon: "📞", phone: "988" },
    { name: "Crisis Text Line", detail: "Text HOME to 741741", description: "Free 24/7 crisis support via text. Connect with a trained crisis counselor by texting HOME to 741741.", category: "Crisis", scope: "National", color: "#f97316", icon: "💬", textTo: "741741", textBody: "HOME" },
    { name: "Safe Call Now", detail: "1-206-459-3020 · First Responders", description: "Confidential 24/7 crisis referral service designed specifically for first responders, public safety professionals, and their families.", category: "Crisis", scope: "National", color: "#38bdf8", icon: "🔵", phone: "12064593020" },
    { name: "Badge of Life", detail: "badgeoflife.com", description: "Mental health and suicide prevention resources specifically for law enforcement. Offers peer support training, resilience programs, and officer wellness resources.", category: "Mental Health", scope: "National", color: "#a78bfa", icon: "🛡", url: "https://www.badgeoflife.org" },
    { name: "First Responder Support Network", detail: "frsn.org", description: "Peer support and treatment programs for first responders struggling with PTSD, addiction, and other behavioral health challenges.", category: "Peer Support", scope: "National", color: "#22c55e", icon: "🌐", url: "https://www.frsn.org" }
  ];

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

  const statePathways = {
    "NC":[
      { name:"NC Responder Alliance (NC RAI)", detail:"Gateway to EMDR, therapy, PST, chaplains · All disciplines", description:"A statewide network connecting first responders to vetted mental health providers including EMDR therapists, peer support teams, and chaplains. Free and confidential for all NC first responders.", category:"Peer Support", scope:"State", icon:"🌐", color:"#38bdf8", disciplines:["All"], free:true, tags:["EMDR","Therapy","PST","Chaplain"], url:"https://www.ncresponderalliance.org" },
      { name:"NC First Responder Peer Support Network", detail:"Statewide PST network · Certified PST members, CISM teams", description:"Certified peer support specialists available statewide. CISM debriefing teams deployed for critical incidents. All disciplines welcome.", category:"CISM", scope:"State", icon:"🤝", color:"#a78bfa", disciplines:["All"], free:true, tags:["PST","CISM"] },
      { name:"NC-LEAP", detail:"NC Law Enforcement Assistance Program · Free, confidential", description:"Free, confidential mental health support program specifically for law enforcement officers in North Carolina. Includes therapy, EMDR, and peer support referrals.", category:"Mental Health", scope:"State", icon:"🛡", color:"#22c55e", disciplines:["Law Enforcement"], free:true, tags:["Therapy","EMDR","PST"] },
    ],
    "SC":[{ name:"SC First Responder Peer Network", detail:"Statewide PST and crisis support", description:"Peer support and crisis intervention resources for South Carolina first responders. Certified PST members available statewide.", category:"Peer Support", scope:"State", icon:"🤝", color:"#a78bfa", disciplines:["All"], free:true, tags:["PST","CISM"] }],
    "VA":[{ name:"VA First Responder Alliance", detail:"Peer support and mental health resources", description:"Virginia statewide alliance connecting first responders to peer support specialists, mental health providers, and crisis resources.", category:"Peer Support", scope:"State", icon:"🌐", color:"#38bdf8", disciplines:["All"], free:true, tags:["PST","Therapy"] }]
  };

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

  const tabs = [
    { key:"crisis", label:"Crisis" },
    { key:"pathways", label:"State Pathways" },
    { key:"finder", label:"Find Help" },
    { key:"calendar", label:"Calendar" },
    { key:"upstream", label:"Upstream Approach" },
    { key:"downstream", label:"Downstream" }
  ];

  const getRelevantStates = () => {
    if (!selectedState || selectedState === "All") return ["All"];
    const neighbors = neighboringStates[selectedState] || [];
    return [selectedState, ...neighbors, "All"];
  };

  const states = getRelevantStates();

  const loadStateResources = (state) => {
    if (!state || state === "All") { setAiResources(crisis); return; }
    let cachedData = [];
    try { const stored = localStorage.getItem(`appwrite_resources_${state}`); if (stored) cachedData = JSON.parse(stored); } catch(e) {}
    const stateData = cachedData.length > 0 ? cachedData : (statePathways[state] || []);
    const neighbors = neighboringStates[state] || [];
    const neighborData = neighbors.flatMap(s => { const nData = statePathways[s] || []; return nData.slice(0, 2).map(r => ({ ...r, neighborState: s })); });
    setAiResources([...stateData, ...neighborData, ...crisis]);
  };

  useEffect(() => { loadStateResources(selectedState); }, [selectedState]);

  const handleZipSearch = async () => {
    const cleanZip = String(zip || '').replace(/\D/g, '').slice(0, 5);
    if (!cleanZip || cleanZip.length !== 5) return;
    setZip(cleanZip);
    try { localStorage.setItem('upstream_zip', cleanZip); } catch(e) {}
    setZipLoading(true);
    try {
      const results = await fetchResources({ zip: cleanZip, state: selectedState, appType: 'first_responder', isVeteran: false });
      if (results) { localStorage.setItem(`appwrite_resources_${selectedState}`, JSON.stringify(results)); setAiResources([...(Array.isArray(results) ? results : []), ...crisis]); }
    } catch (error) {
      setAiError("Could not fetch latest resources. Using offline fallback.");
    } finally { setZipLoading(false); }
  };

  const getFilteredPathways = () => {
    if (!aiResources) return statePathways[selectedState] || [];
    return aiResources.filter(r => { if (selectedDiscipline === "All") return true; return (r.disciplines && (r.disciplines.includes("All") || r.disciplines.includes(selectedDiscipline))); });
  };

  const filteredPathways = getFilteredPathways();

  const checkSafetyLanguage = (text) => {
    const lower = text.toLowerCase();
    if (CRISIS_KEYWORDS.some(k => lower.includes(k))) return "crisis";
    if (EMOTIONAL_KEYWORDS.some(k => lower.includes(k))) return "emotional";
    return "resource";
  };

  const handleFinderSearch = async () => {
    if (!finderQuery.trim()) return;
    const safety = checkSafetyLanguage(finderQuery);
    if (safety === "crisis") { setShowCrisisRedirect(true); return; }
    if (safety === "emotional") { setShowEmotionalRedirect(true); return; }

    setFinderLoading(true);
    setFinderResults(null);
    setFinderError("");
    setShowEmotionalRedirect(false);
    setShowCrisisRedirect(false);

    try {
      // Build context from Appwrite Resources collection
      let appwriteResources = [];
      try {
        const res = await databases.listDocuments(DB_ID, 'Resources', [Query.limit(100)]);
        appwriteResources = res.documents || [];
      } catch(e) {}

      const locationContext = finderScope === "local" || finderScope === "regional"
        ? `Location: ${finderCity || selectedState}`
        : finderScope === "state"
        ? `State: ${selectedState}`
        : "Scope: National";

      const resourceContext = appwriteResources.length > 0
        ? `\n\nVetted resources in database:\n${appwriteResources.map(r => `- ${r.title}: ${r.notes || ''} (${r.type || ''}, ${r.state || 'National'}, ${r.phone || r.file_url || ''})`).join('\n')}`
        : "";

      const systemPrompt = `You are a resource finder for first responders. Your ONLY job is to find relevant resources. Do not provide emotional support, advice, or conversation. Only return resources.

${locationContext}
${resourceContext}

Rules:
- Search the vetted database above first
- If not found there, safely search for official organizations, licensed providers, government programs, national hotlines, recognized nonprofits
- Only return resources from .gov, .org, or verified organizations
- No random blogs, unverified coaches, or questionable sources
- If the request is emotional or a crisis, respond only with: REDIRECT_EMOTIONAL or REDIRECT_CRISIS
- Return results as JSON array with fields: name, description, phone, url, category, scope

Respond ONLY with a JSON array. No other text.`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: finderQuery }],
          tools: [{ type: "web_search_20250305", name: "web_search" }],
        })
      });

      const data = await response.json();
      const text = data.content?.find(b => b.type === "text")?.text || "";

      if (text.includes("REDIRECT_EMOTIONAL")) { setShowEmotionalRedirect(true); setFinderLoading(false); return; }
      if (text.includes("REDIRECT_CRISIS")) { setShowCrisisRedirect(true); setFinderLoading(false); return; }

      try {
        const clean = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(clean);
        setFinderResults(Array.isArray(parsed) ? parsed : []);
      } catch(e) {
        setFinderError("Could not parse results. Please try a different search.");
      }
    } catch(e) {
      setFinderError("Search unavailable. Please check your connection.");
    }
    setFinderLoading(false);
  };

  // Resource detail view
  if (selectedResource) {
    const r = selectedResource;
    const href = getResourceHref(r);
    return (
      <Screen headerProps={{ onBack: () => setSelectedResource(null), title: "Resource Detail", agencyName: agency?.name, logoSrc }}>
        <Card style={{ background: `${r.color || "#38bdf8"}10`, borderColor: `${r.color || "#38bdf8"}25` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: `${r.color || "#38bdf8"}18`, border: `1px solid ${r.color || "#38bdf8"}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>
              {r.icon || "🌐"}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#dde8f4", lineHeight: 1.3 }}>{r.name}</div>
              {r.neighborState && <div style={{ fontSize: 10, color: "#a78bfa", marginTop: 2 }}>Also serves: {r.neighborState}</div>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {r.category && <span style={{ fontSize: 10, fontWeight: 700, color: r.color || "#38bdf8", background: `${r.color || "#38bdf8"}15`, padding: "3px 8px", borderRadius: 6 }}>{r.category}</span>}
            {r.scope && <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", background: "rgba(255,255,255,0.06)", padding: "3px 8px", borderRadius: 6 }}>{r.scope}</span>}
            {r.free && <span style={{ fontSize: 10, fontWeight: 700, color: "#22c55e", background: "rgba(34,197,94,0.1)", padding: "3px 8px", borderRadius: 6 }}>Free</span>}
            {r.aiFound && <span style={{ fontSize: 10, fontWeight: 700, color: "#eab308", background: "rgba(234,179,8,0.1)", padding: "3px 8px", borderRadius: 6 }}>AI Found</span>}
          </div>
          <p style={{ fontSize: 13, color: "#8099b0", lineHeight: 1.75 }}>{r.description || r.detail}</p>
        </Card>

        {r.phone && (
          <div onClick={() => window.location.href = `tel:${String(r.phone).replace(/[^\d+]/g, '')}`} style={{ background: "rgba(34,197,94,0.1)", border: "1.5px solid rgba(34,197,94,0.3)", borderRadius: 14, padding: "16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 22 }}>📞</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#22c55e" }}>Call Now</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{r.phone}</div>
            </div>
          </div>
        )}

        {r.textTo && (
          <div onClick={() => window.location.href = `sms:${r.textTo}?body=${encodeURIComponent(r.textBody || '')}`} style={{ background: "rgba(56,189,248,0.1)", border: "1.5px solid rgba(56,189,248,0.3)", borderRadius: 14, padding: "16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 22 }}>💬</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#38bdf8" }}>Send Text</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Text {r.textBody} to {r.textTo}</div>
            </div>
          </div>
        )}

        {r.url && (
          <div onClick={() => window.open(r.url, '_blank', 'noopener,noreferrer')} style={{ background: "rgba(167,139,250,0.1)", border: "1.5px solid rgba(167,139,250,0.3)", borderRadius: 14, padding: "16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 22 }}>🌐</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>Visit Website</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{r.url.replace('https://','').replace('http://','')}</div>
            </div>
          </div>
        )}

        {r.tags && r.tags.length > 0 && (
          <Card>
            <SLabel color="#64748b">Specialties</SLabel>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
              {r.tags.map((tag, i) => (
                <span key={i} style={{ fontSize: 11, color: "#8099b0", background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: 8 }}>{tag}</span>
              ))}
            </div>
          </Card>
        )}
      </Screen>
    );
  }

  return (
    <Screen headerProps={{ onBack: () => navigate("home"), title: "Resources", agencyName: agency?.name, logoSrc }}>

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

      {/* ── PATHWAYS ── */}
      {tab === "pathways" && (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:700, color:"#dde8f4" }}>State Resources</div>
            {onChangeState && <div onClick={onChangeState} style={{ fontSize:12, color:"#38bdf8", fontWeight:700, cursor:"pointer", textDecoration:"underline", textUnderlineOffset:3 }}>Change My State</div>}
          </div>
          <Card style={{ background:"rgba(56,189,248,0.06)", borderColor:"rgba(56,189,248,0.15)" }}>
            <div style={{ fontSize:13, color:"#38bdf8", fontWeight:700, marginBottom:6 }}>State-Specific Peer Support Networks</div>
            <div style={{ fontSize:12, color:"#8099b0", lineHeight:1.7 }}>Connect with vetted peer support programs, PST teams, chaplain networks, and EMDR clinicians in your state.</div>
          </Card>
          <div style={{ display:'flex', gap:8, margin:'12px 0' }}>
            <input type="text" placeholder="Enter ZIP code..." value={zip} onChange={(e) => setZip(e.target.value.replace(/\D/g,'').slice(0,5))} style={{ flex:1, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'0 12px', color:'#fff', fontFamily:"'DM Sans',sans-serif", outline:"none" }}/>
            <Btn onClick={handleZipSearch}>{zipLoading ? "Searching..." : "Search"}</Btn>
          </div>
          {aiError && <div style={{ fontSize:11, color:"#fca5a5", marginTop:-6 }}>{aiError}</div>}
          <div>
            <SLabel color="#38bdf8">Your State</SLabel>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {states.map(s => (
                <div key={s} onClick={() => setSelectedState(s)} style={{ background:selectedState===s?"rgba(56,189,248,0.15)":"rgba(255,255,255,0.03)", border:`1.5px solid ${selectedState===s?"rgba(56,189,248,0.35)":"rgba(255,255,255,0.07)"}`, borderRadius:10, padding:"8px 14px", cursor:"pointer", fontSize:12, fontWeight:selectedState===s?700:400, color:selectedState===s?"#38bdf8":"#8099b0" }}>
                  {s==="All"?"National":s}
                </div>
              ))}
            </div>
          </div>
          <SLabel color="#22c55e">{selectedState} Results</SLabel>
          {aiLoading && <div style={{ fontSize:12, color:"#64748b" }}>Loading...</div>}
          {filteredPathways.map((r, i) => (
            <Card key={i} onClick={() => setSelectedResource(r)} style={{ display:"flex", alignItems:"flex-start", gap:14, cursor:"pointer" }}>
              <div style={{ width:48, height:48, borderRadius:13, background:`${r.color || "#38bdf8"}18`, border:`1px solid ${(r.color || "#38bdf8")}25`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{r.icon || "🌐"}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:"#dde8f4" }}>{r.name}</div>
                  {r.neighborState && <div style={{ fontSize:9, color:"#a78bfa" }}>{r.neighborState}</div>}
                </div>
                <div style={{ fontSize:12, color:"#8099b0", marginBottom:4 }}>{r.detail}</div>
                {r.description && <div style={{ fontSize:12, color:"#64748b", lineHeight:1.6, marginBottom:4 }}>{r.description}</div>}
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {r.category && <span style={{ fontSize:9, fontWeight:700, color:r.color||"#38bdf8", background:`${r.color||"#38bdf8"}15`, padding:"2px 8px", borderRadius:5 }}>{r.category}</span>}
                  {r.free && <span style={{ fontSize:9, fontWeight:700, color:"#22c55e", background:"rgba(34,197,94,0.1)", padding:"2px 8px", borderRadius:5 }}>Free</span>}
                </div>
              </div>
            </Card>
          ))}
        </>
      )}

      {/* ── AI RESOURCE FINDER ── */}
      {tab === "finder" && (
        <div>
          <Card style={{ background:"rgba(56,189,248,0.05)", borderColor:"rgba(56,189,248,0.15)", marginBottom:12 }}>
            <div style={{ fontSize:14, fontWeight:800, color:"#38bdf8", marginBottom:4 }}>AI Resource Finder</div>
            <div style={{ fontSize:12, color:"#64748b", lineHeight:1.6 }}>Searches our vetted resource database first. If not found, safely searches verified organizations and adds new resources for admin review.</div>
          </Card>

          {/* Scope selector */}
          <div style={{ marginBottom:12 }}>
            <SLabel color="#38bdf8">Search Scope</SLabel>
            <div style={{ display:"flex", gap:8 }}>
              {[{k:"local",l:"Local"},{k:"regional",l:"Regional"},{k:"state",l:"State"},{k:"national",l:"National"}].map(s => (
                <div key={s.k} onClick={() => setFinderScope(s.k)} style={{ flex:1, textAlign:"center", padding:"9px 6px", borderRadius:10, cursor:"pointer", background:finderScope===s.k?"rgba(56,189,248,0.15)":"rgba(255,255,255,0.03)", border:`1.5px solid ${finderScope===s.k?"rgba(56,189,248,0.35)":"rgba(255,255,255,0.07)"}`, fontSize:11, fontWeight:finderScope===s.k?800:600, color:finderScope===s.k?"#38bdf8":"#64748b" }}>
                  {s.l}
                </div>
              ))}
            </div>
          </div>

          {/* City/zip input for local or regional */}
          {(finderScope === "local" || finderScope === "regional") && (
            <input
              value={finderCity}
              onChange={e => setFinderCity(e.target.value)}
              placeholder="Enter city or ZIP code"
              style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"12px 14px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%", color:"#dde8f4", marginBottom:12 }}
            />
          )}

          {/* Main query input */}
          <div style={{ marginBottom:12 }}>
            <textarea
              value={finderQuery}
              onChange={e => { setFinderQuery(e.target.value); setShowEmotionalRedirect(false); setShowCrisisRedirect(false); }}
              placeholder="What resources can I help you locate today?"
              rows={3}
              style={{ background:"rgba(255,255,255,0.05)", border:"1.5px solid rgba(56,189,248,0.2)", borderRadius:12, padding:"14px 16px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"none", width:"100%", lineHeight:1.6, color:"#dde8f4" }}
            />
          </div>

          <div onClick={finderLoading ? null : handleFinderSearch} style={{ padding:"14px", borderRadius:12, cursor:finderLoading?"not-allowed":"pointer", textAlign:"center", background:finderLoading?"rgba(255,255,255,0.02)":"rgba(56,189,248,0.12)", border:`1.5px solid ${finderLoading?"rgba(255,255,255,0.06)":"rgba(56,189,248,0.3)"}`, fontSize:14, fontWeight:700, color:finderLoading?"#475569":"#38bdf8", marginBottom:16 }}>
            {finderLoading ? "Searching..." : "Find Resources"}
          </div>

          {/* Crisis redirect */}
          {showCrisisRedirect && (
            <Card style={{ background:"rgba(239,68,68,0.08)", borderColor:"rgba(239,68,68,0.25)", marginBottom:12 }}>
              <div style={{ fontSize:14, fontWeight:800, color:"#f87171", marginBottom:8 }}>Are you in crisis right now?</div>
              <div style={{ fontSize:13, color:"#94a3b8", lineHeight:1.6, marginBottom:14 }}>If you're in immediate distress, please reach out now. Help is available 24/7.</div>
              <div onClick={() => { setTab("crisis"); setShowCrisisRedirect(false); }} style={{ padding:"12px", borderRadius:10, cursor:"pointer", textAlign:"center", background:"rgba(239,68,68,0.15)", border:"1.5px solid rgba(239,68,68,0.4)", fontSize:13, fontWeight:700, color:"#f87171" }}>
                View Crisis Resources →
              </div>
            </Card>
          )}

          {/* Emotional redirect */}
          {showEmotionalRedirect && (
            <Card style={{ background:"rgba(167,139,250,0.07)", borderColor:"rgba(167,139,250,0.2)", marginBottom:12 }}>
              <div style={{ fontSize:14, fontWeight:800, color:"#c4b5fd", marginBottom:8 }}>It sounds like you may need someone to talk to.</div>
              <div style={{ fontSize:13, color:"#94a3b8", lineHeight:1.6, marginBottom:14 }}>Our AI Peer Support is available right now — confidential and available anytime.</div>
              <div onClick={() => navigate("aichat")} style={{ padding:"12px", borderRadius:10, cursor:"pointer", textAlign:"center", background:"rgba(167,139,250,0.12)", border:"1.5px solid rgba(167,139,250,0.3)", fontSize:13, fontWeight:700, color:"#a78bfa" }}>
                Connect with AI Peer Support →
              </div>
            </Card>
          )}

          {/* Error */}
          {finderError && <div style={{ fontSize:12, color:"#f87171", marginBottom:12 }}>{finderError}</div>}

          {/* Results */}
          {finderResults && finderResults.length === 0 && (
            <div style={{ textAlign:"center", padding:"20px", color:"#475569", fontSize:13 }}>No resources found. Try a different search term.</div>
          )}
          {finderResults && finderResults.map((r, i) => (
            <Card key={i} onClick={() => setSelectedResource({ ...r, icon:"🌐", color:"#38bdf8", aiFound:true })} style={{ display:"flex", alignItems:"flex-start", gap:14, cursor:"pointer", marginBottom:10 }}>
              <div style={{ width:48, height:48, borderRadius:13, background:"rgba(56,189,248,0.1)", border:"1px solid rgba(56,189,248,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>🌐</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:"#dde8f4", marginBottom:3 }}>{r.name}</div>
                {r.description && <div style={{ fontSize:12, color:"#8099b0", lineHeight:1.6, marginBottom:4 }}>{r.description}</div>}
                {(r.phone || r.url) && <div style={{ fontSize:12, color:"#64748b", marginBottom:4 }}>{r.phone || r.url}</div>}
                <div style={{ display:"flex", gap:6 }}>
                  {r.category && <span style={{ fontSize:9, fontWeight:700, color:"#38bdf8", background:"rgba(56,189,248,0.1)", padding:"2px 8px", borderRadius:5 }}>{r.category}</span>}
                  {r.scope && <span style={{ fontSize:9, fontWeight:700, color:"#64748b", background:"rgba(255,255,255,0.05)", padding:"2px 8px", borderRadius:5 }}>{r.scope}</span>}
                  <span style={{ fontSize:9, fontWeight:700, color:"#eab308", background:"rgba(234,179,8,0.1)", padding:"2px 8px", borderRadius:5 }}>AI Found</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── CALENDAR ── */}
      {tab === "calendar" && (
        <>
          <SLabel color="#38bdf8">Agency Events & Shifts</SLabel>
          {[
            { id:1, date:"2026-03-15", title:"CISM Debrief: Station 7", type:"cism", color:"#ef4444" },
            { id:2, date:"2026-03-18", title:"PST Available 1800-2200", type:"pst", color:"#a78bfa" },
            { id:3, date:"2026-03-20", title:"Resilience Training", type:"training", color:"#22c55e" }
          ].map(event => (
            <Card key={event.id} style={{ borderLeft:`4px solid ${event.color}`, display:'flex', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{event.title}</div>
                <div style={{ fontSize:12, color:'#8099b0' }}>{event.date}</div>
              </div>
              <div style={{ fontSize:11, color:event.color, fontWeight:700, textTransform:'uppercase' }}>{event.type}</div>
            </Card>
          ))}
        </>
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
