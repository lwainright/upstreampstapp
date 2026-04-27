// ============================================================
// SCREEN: ResourcesScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect } from 'react';
import { Screen, Btn, Card, SLabel } from './ui.jsx';
import { databases } from './appwrite.js';
import { Query, ID } from 'appwrite';
import { trackResourceView } from './analytics.js';
import { RESOURCE_LANGUAGE_PACK } from './SupportLayers.js';

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
  { name:"Correctional Peace Officers Foundation", detail:"cpof.org · Corrections-specific", description:"Peer support, critical incident response, and family assistance for corrections officers and detention staff. One of the few organizations built specifically for corrections.", category:"Peer Support", scope:"National", color:"#f97316", icon:"🔐", url:"https://www.cpof.org" },
  { name:"Corrections Fatigue Resources", detail:"correctionsfatigue.com", description:"Dr. Caterina Spinaris — free educational resources on corrections-specific cumulative stress. Corrections fatigue is a documented, real condition separate from law enforcement burnout.", category:"Education", scope:"National", color:"#f97316", icon:"📖", url:"https://www.correctionsfatigue.com" },
  { name:"Beyond the Headset — Dispatcher Wellness", detail:"beyondtheheadset.org", description:"Mental health community and resources specifically for 911 dispatchers and communications professionals.", category:"Peer Support", scope:"National", color:"#38bdf8", icon:"📡", url:"https://www.beyondtheheadset.org" },
  { name:"Dispatcher Draft Project", detail:"dispatcherdraftproject.com", description:"Mental health resources built for 911 dispatchers. Addresses secondary trauma, compassion fatigue, and the unique stress of dispatching.", category:"Mental Health", scope:"National", color:"#38bdf8", icon:"📡", url:"https://www.dispatcherdraftproject.com" },
  { name:"APCO International — Dispatcher Wellness", detail:"apcointl.org/programs/wellness", description:"Association of Public-Safety Communications Officials wellness resources for telecommunications professionals.", category:"Wellness", scope:"National", color:"#38bdf8", icon:"📡", url:"https://www.apcointl.org/programs/wellness/" },
  { name:"AAMS — Air Medical & CCT Wellness", detail:"aams.org · Critical care transport", description:"Association of Air Medical Services — wellness and peer support resources for air medical and critical care transport professionals including communications and dispatch staff.", category:"Peer Support", scope:"National", color:"#38bdf8", icon:"🚁", url:"https://www.aams.org" },
  { name:"IAFCCP — Flight & Critical Care Paramedics", detail:"iafccp.org", description:"International Association of Flight and Critical Care Paramedics — professional wellness and peer support for CCT crews and support staff.", category:"Peer Support", scope:"National", color:"#38bdf8", icon:"🚁", url:"https://www.iafccp.org" },
  { name:"IAED — International Academies of Emergency Dispatch", detail:"iaed.org", description:"Professional standards and wellness resources for emergency dispatchers including critical care and medical priority dispatch professionals.", category:"Wellness", scope:"National", color:"#38bdf8", icon:"📡", url:"https://www.iaed.org" },
  // ── SRO ──
  { name:"National Association of School Resource Officers (NASRO)", detail:"nasro.org · SRO-specific wellness", description:"Professional association for school resource officers — peer support, mental health resources, and training for the unique stress of working in a school environment alongside law enforcement duties.", category:"Peer Support", scope:"National", color:"#22c55e", icon:"🏫", url:"https://www.nasro.org" },
  { name:"SRO — Dual Role Stress", detail:"Education · School + LE culture", description:"SROs carry two identities — law enforcement officer and school-based responder. The stress of navigating both cultures, building relationships with students, and responding to school-based crises is a documented and often unaddressed occupational stressor.", category:"Education", scope:"National", color:"#22c55e", icon:"🏫", url:"https://www.nasro.org" },

  // ── Mobile Crisis / Co-Responders ──
  { name:"SAMHSA — Mobile Crisis Resources", detail:"samhsa.gov · Co-responder models", description:"SAMHSA resources for mobile crisis teams and co-responder programs — includes wellness tools for mental health professionals and first responders working in co-responder models.", category:"Wellness", scope:"National", color:"#a78bfa", icon:"🧑‍⚕️", url:"https://www.samhsa.gov/mental-health/mobile-crisis-resources" },
  { name:"National Alliance on Mental Illness (NAMI) — Co-Responder Support", detail:"nami.org · Crisis intervention", description:"Resources for mental health co-responders and crisis intervention teams. Addresses compassion fatigue, vicarious trauma, and the unique stress of bridging law enforcement and mental health.", category:"Mental Health", scope:"National", color:"#a78bfa", icon:"🧑‍⚕️", url:"https://www.nami.org" },
  { name:"Crisis Intervention Team (CIT) International", detail:"citinternational.org", description:"Training, peer support, and wellness resources for CIT officers and mental health co-responders. The de-escalation culture comes with its own occupational stress.", category:"Peer Support", scope:"National", color:"#a78bfa", icon:"🧑‍⚕️", url:"https://www.citinternational.org" },

  // ── Critical Care / Advanced Paramedics ──
  { name:"National EMS Management Association (NEMSMA)", detail:"nemsma.org · EMS leadership wellness", description:"Resources for EMS supervisors and advanced practice paramedics — leadership stress, compassion fatigue, and workforce wellness.", category:"Wellness", scope:"National", color:"#38bdf8", icon:"🚑", url:"https://www.nemsma.org" },
  { name:"NAEMSP — Advanced Practice EMS Wellness", detail:"naemsp.org · Critical care paramedics", description:"National Association of EMS Physicians — resources for advanced practice and critical care paramedics navigating expanded clinical roles and the associated stress.", category:"Wellness", scope:"National", color:"#38bdf8", icon:"🚑", url:"https://www.naemsp.org" },
  { name:"Code Green Campaign — EMS Mental Health", detail:"codegreencampaign.org", description:"Mental health awareness specifically for EMS providers including advanced and critical care paramedics. Peer support, stigma reduction, and crisis resources.", category:"Mental Health", scope:"National", color:"#38bdf8", icon:"🚑", url:"https://www.codegreencampaign.org" },

  // ── Forensic / Crime Scene ──
  { name:"American Academy of Forensic Sciences (AAFS)", detail:"aafs.org · Forensic professional wellness", description:"Resources for forensic professionals including CSI, crime lab, and forensic pathology staff — secondary trauma, high-acuity case exposure, and occupational stress.", category:"Wellness", scope:"National", color:"#64748b", icon:"🔬", url:"https://www.aafs.org" },
  { name:"International Association of Identification (IAI)", detail:"theiai.org · CSI wellness", description:"Professional association for crime scene investigators and identification professionals — wellness and peer support resources.", category:"Peer Support", scope:"National", color:"#64748b", icon:"🔬", url:"https://www.theiai.org" },

  // ── SANE / Forensic Nurses ──
  { name:"International Association of Forensic Nurses (IAFN)", detail:"forensicnurses.org · SANE wellness", description:"Peer support and wellness resources for Sexual Assault Nurse Examiners (SANE) and forensic nurses — one of the highest secondary trauma roles in healthcare.", category:"Mental Health", scope:"National", color:"#ec4899", icon:"🧑‍⚕️", url:"https://www.forensicnurses.org" },

  // ── Federal Agents ──
  { name:"FBI Employee Assistance Program", detail:"fbi.gov · Federal agent wellness", description:"Federal agents carry a unique classification of stress — national security exposure, undercover work, long-term case immersion. EAP and peer support resources for federal law enforcement.", category:"Wellness", scope:"National", color:"#475569", icon:"🏛", url:"https://www.fbijobs.gov/life-at-fbi/employee-assistance-program" },
  { name:"Federal Law Enforcement Officers Association (FLEOA)", detail:"fleoa.org · Federal LE wellness", description:"Advocacy and peer support for federal law enforcement officers across all agencies — FBI, ATF, DEA, Secret Service, Border Patrol, and others.", category:"Peer Support", scope:"National", color:"#475569", icon:"🏛", url:"https://www.fleoa.org" },

  // ── Probation / Parole ──
  { name:"American Probation and Parole Association (APPA)", detail:"appa-net.org · P&P wellness", description:"Professional resources for probation and parole officers — an often-overlooked first responder population managing high-risk caseloads with significant secondary trauma exposure.", category:"Wellness", scope:"National", color:"#eab308", icon:"⚖️", url:"https://www.appa-net.org" },

  // ── Grief / Line of Duty ──
  { name:"Concerns of Police Survivors (COPS)", detail:"concernsofpolicesurvivors.org", description:"Support for surviving families and colleagues after a line of duty death. Peer support, counseling referrals, and survivor networks.", category:"Grief", scope:"National", color:"#475569", icon:"🕯", url:"https://www.concernsofpolicesurvivors.org" },
  { name:"National Fallen Firefighters Foundation", detail:"firehero.org · Line of duty grief", description:"Support for fire service families and surviving colleagues after a line of duty death.", category:"Grief", scope:"National", color:"#ef4444", icon:"🕯", url:"https://www.firehero.org" },
  { name:"EMS Loses — Line of Duty", detail:"emsloses.org", description:"Memorial and support resources for EMS providers after line of duty deaths of colleagues.", category:"Grief", scope:"National", color:"#38bdf8", icon:"🕯", url:"https://www.emsloses.org" },

  // ── Sleep ──
  { name:"Shift Work Sleep Disorder Resources", detail:"Circadian rhythm · Shift worker health", description:"Shift work sleep disorder is a documented clinical condition affecting first responders and shift workers. Resources on sleep hygiene, fatigue management, and occupational sleep health.", category:"Wellness", scope:"National", color:"#6366f1", icon:"😴", url:"https://www.sleepfoundation.org/shift-work" },

  // ── Suicide Prevention ──
  { name:"QPR Institute — Suicide Prevention Training", detail:"qprinstitute.com · Question Persuade Refer", description:"QPR (Question, Persuade, Refer) is evidence-based suicide prevention training. Gatekeeper training for first responders and public safety professionals.", category:"Prevention", scope:"National", color:"#ef4444", icon:"🛡", url:"https://www.qprinstitute.com" },
  { name:"First Responder Suicide Prevention — IAFF", detail:"iaff.org · Firefighter suicide prevention", description:"IAFF Center of Excellence — firefighter-specific suicide prevention, peer support, and mental health treatment resources.", category:"Prevention", scope:"National", color:"#ef4444", icon:"🛡", url:"https://www.iaff.org/behavioral-health/" },

  // ── Chaplaincy ──
  { name:"Federation of Fire Chaplains", detail:"firechaplains.org · Spiritual care", description:"Chaplaincy support for fire service personnel — spiritual care, grief support, and critical incident ministry. Non-denominational services available.", category:"Spiritual", scope:"National", color:"#a78bfa", icon:"✝️", url:"https://www.firechaplains.org" },
  { name:"International Conference of Police Chaplains", detail:"icpc4cops.org", description:"Chaplaincy and spiritual care resources for law enforcement — peer support, grief ministry, critical incident response.", category:"Spiritual", scope:"National", color:"#a78bfa", icon:"✝️", url:"https://www.icpc4cops.org" },

  // ── Financial ──
  { name:"First Responder Financial Wellness", detail:"Financial stress · Shift worker planning", description:"Financial stress is a significant but rarely addressed contributor to first responder mental health issues. Resources for shift worker financial planning, disability planning, and retirement preparation.", category:"Financial", scope:"National", color:"#22c55e", icon:"💰", url:"https://www.responderlife.com" },

  // ── Physical / Chronic Pain ──
  { name:"First Responder Physical Wellness", detail:"Occupational injury · Chronic pain", description:"Occupational injuries, chronic pain, and physical wear are significant stressors for first responders. Resources for injury management, chronic pain treatment, and return-to-duty physical wellness.", category:"Wellness", scope:"National", color:"#22c55e", icon:"💪", url:"https://www.naemsp.org" },

  // ── Addictions ──
  { name:"First Responder Addiction Recovery", detail:"Peer-led · Confidential · FR-specific", description:"First responders have significantly higher rates of substance use than the general population. Stigma and fear of career consequences prevent most from seeking help. These resources are peer-led, confidential, and understand the culture.", category:"Recovery", scope:"National", color:"#22c55e", icon:"🌱", url:"https://www.frsn.org" },
  { name:"First Responders First — Addiction Support", detail:"firstrespondersfirst.org", description:"Addiction treatment and recovery resources built for first responders — confidential, peer-informed, and career-safe.", category:"Recovery", scope:"National", color:"#22c55e", icon:"🌱", url:"https://www.firstrespondersfirst.org" },
  { name:"SMART Recovery — First Responders", detail:"smartrecovery.org · Science-based", description:"Science-based addiction recovery — online and in-person meetings. Evidence-based alternative to 12-step programs. Works for alcohol, substances, and behavioral addictions.", category:"Recovery", scope:"National", color:"#22c55e", icon:"🌱", url:"https://www.smartrecovery.org" },
  { name:"Al-Anon — Family Addiction Support", detail:"al-anon.org · For families", description:"Support for family members of people with alcohol or substance problems. Common in first responder and veteran households.", category:"Recovery", scope:"National", color:"#22c55e", icon:"🌱", url:"https://al-anon.org" },
  { name:"SAMHSA Helpline — Substance Use", detail:"1-800-662-4357 · 24/7 · Free", description:"Free, confidential treatment referral and information service for substance use disorders — available 24/7 in English and Spanish.", category:"Recovery", scope:"National", color:"#22c55e", icon:"🌱", phone:"18006624357" },

  // ── Postpartum ──
  { name:"Postpartum Support International (PSI)", detail:"postpartum.net · 1-800-944-4773", description:"The leading national organization for perinatal mental health. Postpartum depression, anxiety, and psychosis affect both mothers and fathers — including first responder parents returning to high-stress duty. Helpline, peer support groups, and provider directory.", category:"Postpartum", scope:"National", color:"#ec4899", icon:"👶", phone:"18009444773", url:"https://www.postpartum.net" },
  { name:"PSI — For Fathers and Partners", detail:"postpartum.net/get-help/for-fathers", description:"Paternal postpartum depression is real and underdiagnosed — especially in first responders who suppress emotional responses as part of their job culture. PSI has specific resources for fathers and non-birthing partners.", category:"Postpartum", scope:"National", color:"#ec4899", icon:"👶", url:"https://www.postpartum.net/get-help/for-fathers-and-partners/" },
  { name:"National Maternal Mental Health Hotline", detail:"1-833-943-5746 · 24/7 · Free", description:"Free, confidential support before, during, and after pregnancy. Call or text 24/7 in English and Spanish.", category:"Postpartum", scope:"National", color:"#ec4899", icon:"👶", phone:"18339435746" },
  { name:"Postpartum Progress", detail:"postpartumprogress.com · Peer community", description:"Peer community and education for people experiencing postpartum depression, anxiety, and related conditions. Warrior Mom community.", category:"Postpartum", scope:"National", color:"#ec4899", icon:"👶", url:"https://www.postpartumprogress.com" },

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

  const [finderScope, setFinderScope] = useState(null);
  const [finderCity, setFinderCity] = useState("");
  const [finderQuery, setFinderQuery] = useState("");
  const [finderLoading, setFinderLoading] = useState(false);
  const [finderResults, setFinderResults] = useState(null);
  const [finderError, setFinderError] = useState("");
  const [showEmotionalRedirect, setShowEmotionalRedirect] = useState(false);
  const [showCrisisRedirect, setShowCrisisRedirect] = useState(false);

  const currentState = userState || "NC";
  const stateName = STATE_NAMES[currentState] || currentState;

  // ── Track and open resource ───────────────────────────────────────────
  const openResourceDetail = (r) => {
    trackResourceView((agency && agency.code) || 'NONE', r.category || 'general', currentState);
    setSelectedResource(r);
  };

  const getResourceHref = (resource) => {
    if (!resource) return null;
    if (resource.phone) return `tel:${String(resource.phone).replace(/[^\d+]/g, '')}`;
    if (resource.textTo) { const body = encodeURIComponent(resource.textBody || ''); return `sms:${resource.textTo}${body ? `?body=${body}` : ''}`; }
    if (resource.url) return resource.url;
    return null;
  };

  const handleSearch = async (overrideQuery) => {
    // Use Resource Language Pack to build better queries
    let query = overrideQuery || finderQuery || "";
    if (!query.trim()) {
      // Get seat-appropriate default query
      const seat = (() => { try { const s = localStorage.getItem("upstream_seats"); return s ? JSON.parse(s)[0] : "responder"; } catch(e) { return "responder"; } })();
      const seatQueryMap = {
        responder:     RESOURCE_LANGUAGE_PACK.mentalHealth.slice(0,3).join(" OR "),
        veteran:       "veteran mental health peer support",
        hospital:      RESOURCE_LANGUAGE_PACK.mentalHealth[0] + " healthcare worker",
        school:        "educator wellness school staff support",
        humanservices: "social worker secondary trauma support",
        entertainment: "entertainment worker mental health Backline",
        mhpro:         "clinician burnout compassion fatigue support",
      };
      query = seatQueryMap[seat] || `first responder mental health resources`;
    }
    const lower = query.toLowerCase();
    if (CRISIS_KEYWORDS.some(k => lower.includes(k))) { setShowCrisisRedirect(true); return; }
    if (EMOTIONAL_KEYWORDS.some(k => lower.includes(k))) { setShowEmotionalRedirect(true); return; }

    setFinderLoading(true);
    setFinderResults(null);
    setFinderError("");
    setShowEmotionalRedirect(false);
    setShowCrisisRedirect(false);

    try {
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

      if (appwriteResources.length >= 3) {
        setFinderResults(appwriteResources.map(r => ({
          name: r.title, description: r.notes || "", phone: r.phone || "",
          url: r.file_url || "", category: r.type || "Resource",
          scope: r.state ? stateName : "National", verified: r.verified, fromDatabase: true,
        })));
      }

      const response = await fetch("/.netlify/functions/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, scope: finderScope, location: finderCity, state: currentState, existingResources: appwriteResources.slice(0, 20) })
      });

      const data = await response.json();
      const text = data.text || "";

      if (text === "REDIRECT_EMOTIONAL") { setShowEmotionalRedirect(true); setFinderLoading(false); return; }
      if (text === "REDIRECT_CRISIS") { setShowCrisisRedirect(true); setFinderLoading(false); return; }

      try {
        let clean = text.replace(/```json|```/g, "").trim();
        if (!clean.startsWith("[")) { const start = clean.indexOf("["); if (start >= 0) clean = clean.substring(start); }
        if (!clean.endsWith("]")) { const lastBrace = clean.lastIndexOf("},"); if (lastBrace > 0) clean = clean.substring(0, lastBrace + 1) + "]"; else clean = clean + "]"; }
        const parsed = JSON.parse(clean);
        const aiResults = Array.isArray(parsed) ? parsed.map(r => ({...r, aiFound: true})) : [];
        const existing = finderResults || [];
        const existingNames = new Set(existing.map(r => r.name?.toLowerCase()));
        const newResults = aiResults.filter(r => !existingNames.has(r.name?.toLowerCase()));
        setFinderResults([...existing, ...newResults]);

        newResults.forEach(async (r) => {
          try {
            await databases.createDocument(DB_ID, 'resources', ID.unique(), {
              title: (r.name || "Unknown").slice(0, 200), type: (r.category || "resource").slice(0, 200),
              phone: r.phone ? String(r.phone).slice(0, 20) : null,
              notes: r.description ? String(r.description).slice(0, 500) : null,
              state: finderScope === "national" ? null : (currentState || null),
              app_type: "first_responder", source: "ai_found", active: false, verified: false,
            });
          } catch(e) {}
        });
      } catch(e) {
        if (!finderResults || finderResults.length === 0) setFinderError("Could not find resources. Please try a different search.");
      }
    } catch(e) {
      if (!finderResults || finderResults.length === 0) setFinderError("Search unavailable. Please check your connection.");
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
      <Screen headerProps={{ onBack: () => setSelectedResource(null), agencyName: agency?.name, logoSrc }}>
        <Card style={{ background:`${r.color || "#38bdf8"}10`, borderColor:`${r.color || "#38bdf8"}25` }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:12 }}>
            <div style={{ width:52, height:52, borderRadius:14, background:`${r.color || "#38bdf8"}18`, border:`1px solid ${r.color || "#38bdf8"}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>{r.icon || "🌐"}</div>
            <div style={{ flex:1 }}><div style={{ fontSize:16, fontWeight:800, color:"#dde8f4", lineHeight:1.3 }}>{r.name}</div></div>
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
            {r.category && <span style={{ fontSize:10, fontWeight:700, color:r.color||"#38bdf8", background:`${r.color||"#38bdf8"}15`, padding:"3px 8px", borderRadius:6 }}>{r.category}</span>}
            {r.scope && <span style={{ fontSize:10, fontWeight:700, color:"#64748b", background:"rgba(255,255,255,0.06)", padding:"3px 8px", borderRadius:6 }}>{r.scope}</span>}
            {r.verified && <span style={{ fontSize:10, fontWeight:700, color:"#22c55e", background:"rgba(34,197,94,0.1)", padding:"3px 8px", borderRadius:6 }}>✓ Vetted</span>}
            {r.aiFound && <span style={{ fontSize:10, fontWeight:700, color:"#eab308", background:"rgba(234,179,8,0.1)", padding:"3px 8px", borderRadius:6 }}>AI Found</span>}
          </div>
          <p style={{ fontSize:13, color:"#8099b0", lineHeight:1.75 }}>{r.description || r.detail}</p>
        </Card>

        {r.phone && (
          <div onClick={() => window.location.href = `tel:${String(r.phone).replace(/[^\d+]/g, '')}`} style={{ background:"rgba(34,197,94,0.1)", border:"1.5px solid rgba(34,197,94,0.3)", borderRadius:14, padding:"16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontSize:22 }}>📞</div>
            <div><div style={{ fontSize:13, fontWeight:700, color:"#22c55e" }}>Call Now</div><div style={{ fontSize:12, color:"#64748b" }}>{r.phone}</div></div>
          </div>
        )}
        {r.textTo && (
          <div onClick={() => window.location.href = `sms:${r.textTo}?body=${encodeURIComponent(r.textBody||'')}`} style={{ background:"rgba(56,189,248,0.1)", border:"1.5px solid rgba(56,189,248,0.3)", borderRadius:14, padding:"16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontSize:22 }}>💬</div>
            <div><div style={{ fontSize:13, fontWeight:700, color:"#38bdf8" }}>Send Text</div><div style={{ fontSize:12, color:"#64748b" }}>Text {r.textBody} to {r.textTo}</div></div>
          </div>
        )}
        {r.url && (
          <div onClick={() => window.open(r.url, '_blank', 'noopener,noreferrer')} style={{ background:"rgba(167,139,250,0.1)", border:"1.5px solid rgba(167,139,250,0.3)", borderRadius:14, padding:"16px", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontSize:22 }}>🌐</div>
            <div><div style={{ fontSize:13, fontWeight:700, color:"#a78bfa" }}>Visit Website</div><div style={{ fontSize:12, color:"#64748b" }}>{r.url.replace('https://','').replace('http://','')}</div></div>
          </div>
        )}
      </Screen>
    );
  }

  return (
    <Screen headerProps={{ onBack: () => navigate("home"), agencyName:agency?.name, logoSrc }}>

      {/* AI RESOURCE FINDER -- always at top */}
      <div style={{ background:"rgba(56,189,248,0.05)", border:"1px solid rgba(56,189,248,0.15)", borderRadius:14, padding:"14px 14px 12px" }}>
        <div style={{ fontSize:12, fontWeight:800, color:"#38bdf8", marginBottom:10 }}>🔍 Find Resources</div>
        <div style={{ display:"flex", gap:6, marginBottom:10 }}>
          {[{k:"local",l:"📍 Local"},{k:"regional",l:"🗺 Regional"},{k:"state",l:"🏛 State"},{k:"national",l:"🌐 National"}].map(s => (
            <div key={s.k} onClick={() => { setFinderResults(null); setFinderError(""); setFinderScope(s.k); }} style={{ flex:1, padding:"7px 2px", borderRadius:8, cursor:"pointer", textAlign:"center", background:finderScope===s.k?"rgba(56,189,248,0.15)":"rgba(255,255,255,0.03)", border:`1px solid ${finderScope===s.k?"rgba(56,189,248,0.35)":"rgba(255,255,255,0.07)"}` }}>
              <div style={{ fontSize:10, fontWeight:finderScope===s.k?800:600, color:finderScope===s.k?"#38bdf8":"#64748b" }}>{s.l}</div>
            </div>
          ))}
        </div>
        {finderScope === "local" && (
          <input value={finderCity} onChange={e => setFinderCity(e.target.value)} placeholder="City or ZIP code" style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:9, padding:"9px 12px", fontSize:12, outline:"none", width:"100%", color:"#dde8f4", marginBottom:8, boxSizing:"border-box" }}/>
        )}
        <div style={{ display:"flex", gap:8 }}>
          <input
            value={finderQuery}
            onChange={e => setFinderQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !finderLoading && handleSearch()}
            placeholder='e.g. "grief support near me" or "veteran housing NC"'
            style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:9, padding:"10px 12px", fontSize:12, outline:"none", color:"#dde8f4" }}
          />
          <div onClick={() => !finderLoading && handleSearch()}
            style={{ padding:"10px 14px", borderRadius:9, cursor:finderLoading?"not-allowed":"pointer", background:finderLoading?"rgba(255,255,255,0.02)":"rgba(56,189,248,0.15)", border:`1px solid ${finderLoading?"rgba(255,255,255,0.06)":"rgba(56,189,248,0.35)"}`, fontSize:12, fontWeight:700, color:finderLoading?"#475569":"#38bdf8", flexShrink:0, display:"flex", alignItems:"center" }}>
            {finderLoading ? "..." : "Search"}
          </div>
        </div>
        {finderLoading && <div style={{ textAlign:"center", padding:"12px 0 4px", color:"#38bdf8", fontSize:12 }}>🔍 Searching live resources...</div>}
        {finderError && <div style={{ fontSize:11, color:"#f87171", marginTop:8 }}>{finderError}</div>}
        {finderResults && finderResults.length > 0 && (
          <div style={{ marginTop:12, display:"flex", flexDirection:"column", gap:8 }}>
            <div style={{ fontSize:10, fontWeight:700, color:"#475569", letterSpacing:"0.1em" }}>RESULTS</div>
            {finderResults.map((r, i) => (
              <div key={i} onClick={() => setSelectedResource({ ...r, icon:"🌐", color: r.verified ? "#22c55e" : "#38bdf8" })}
                style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"11px 13px", cursor:"pointer" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#dde8f4", marginBottom:2 }}>{r.name}</div>
                {r.description && <div style={{ fontSize:11, color:"#64748b", lineHeight:1.5, marginBottom:4 }}>{r.description.slice(0,100)}{r.description.length > 100 ? "..." : ""}</div>}
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  {r.category && <span style={{ fontSize:9, fontWeight:700, color:"#38bdf8", background:"rgba(56,189,248,0.1)", padding:"2px 6px", borderRadius:4 }}>{r.category}</span>}
                  {r.verified && <span style={{ fontSize:9, fontWeight:700, color:"#22c55e", background:"rgba(34,197,94,0.1)", padding:"2px 6px", borderRadius:4 }}>✓ Vetted</span>}
                  {r.aiFound && !r.verified && <span style={{ fontSize:9, fontWeight:700, color:"#eab308", background:"rgba(234,179,8,0.1)", padding:"2px 6px", borderRadius:4 }}>AI Found</span>}
                </div>
              </div>
            ))}
          </div>
        )}
        {finderResults && finderResults.length === 0 && !finderLoading && (
          <div style={{ textAlign:"center", padding:"10px 0 4px", color:"#475569", fontSize:12 }}>No results found. Try different terms or a broader scope.</div>
        )}
      </div>

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
            <Card key={i} onClick={() => openResourceDetail(r)} style={{ display:"flex", alignItems:"flex-start", gap:14, cursor:"pointer" }}>
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

          <div style={{ display:"flex", gap:6, marginBottom:12 }}>
            {[{k:"local",l:"📍 Local"},{k:"regional",l:"🗺 Regional"},{k:"state",l:"🏛 State"},{k:"national",l:"🌐 National"}].map(s => (
              <div key={s.k} onClick={() => { setFinderResults(null); setFinderError(""); setShowEmotionalRedirect(false); setShowCrisisRedirect(false); setFinderScope(s.k); }} style={{ flex:1, padding:"10px 4px", borderRadius:10, cursor:"pointer", textAlign:"center", background:finderScope===s.k?"rgba(56,189,248,0.15)":"rgba(255,255,255,0.03)", border:`1.5px solid ${finderScope===s.k?"rgba(56,189,248,0.4)":"rgba(255,255,255,0.07)"}`, transition:"all 0.2s" }}>
                <div style={{ fontSize:11, fontWeight:finderScope===s.k?800:600, color:finderScope===s.k?"#38bdf8":"#8099b0" }}>{s.l}</div>
              </div>
            ))}
          </div>

          {(finderScope === "state" || finderScope === "regional") && (
            <div style={{ background:"rgba(56,189,248,0.06)", border:"1px solid rgba(56,189,248,0.15)", borderRadius:10, padding:"8px 14px", marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:12, color:"#8099b0" }}>Searching: <span style={{ color:"#38bdf8", fontWeight:700 }}>{stateName}</span></div>
              <div onClick={() => onChangeState && onChangeState()} style={{ fontSize:12, color:"#38bdf8", cursor:"pointer", textDecoration:"underline" }}>Not your state?</div>
            </div>
          )}

          {finderScope === "local" && (
            <input value={finderCity} onChange={e => setFinderCity(e.target.value)} placeholder="Enter city or ZIP code" style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"12px 14px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", width:"100%", color:"#dde8f4", marginBottom:10 }}/>
          )}

          <textarea value={finderQuery} onChange={e => setFinderQuery(e.target.value)} placeholder="What resources can I help you locate today?" rows={3} style={{ background:"rgba(255,255,255,0.05)", border:"1.5px solid rgba(56,189,248,0.2)", borderRadius:12, padding:"14px 16px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"none", width:"100%", lineHeight:1.6, color:"#dde8f4", marginBottom:10 }}/>

          <div onClick={() => !finderLoading && handleSearch()} style={{ padding:"14px", borderRadius:12, cursor:finderLoading?"not-allowed":"pointer", textAlign:"center", background:finderLoading?"rgba(255,255,255,0.02)":"rgba(56,189,248,0.12)", border:`1.5px solid ${finderLoading?"rgba(255,255,255,0.06)":"rgba(56,189,248,0.3)"}`, fontSize:14, fontWeight:700, color:finderLoading?"#475569":"#38bdf8", marginBottom:16 }}>
            {finderLoading ? "Searching..." : "Find Resources"}
          </div>

          {finderLoading && <div style={{ textAlign:"center", padding:"24px", color:"#38bdf8", fontSize:13 }}><div style={{ fontSize:24, marginBottom:8 }}>🔍</div>Searching live resources...</div>}

          {showCrisisRedirect && (
            <Card style={{ background:"rgba(239,68,68,0.08)", borderColor:"rgba(239,68,68,0.25)", marginBottom:12 }}>
              <div style={{ fontSize:14, fontWeight:800, color:"#f87171", marginBottom:8 }}>Are you in crisis right now?</div>
              <div style={{ fontSize:13, color:"#94a3b8", lineHeight:1.6, marginBottom:14 }}>Help is available 24/7. Please reach out now.</div>
              <div onClick={() => { setTab("crisis"); setShowCrisisRedirect(false); }} style={{ padding:"12px", borderRadius:10, cursor:"pointer", textAlign:"center", background:"rgba(239,68,68,0.15)", border:"1.5px solid rgba(239,68,68,0.4)", fontSize:13, fontWeight:700, color:"#f87171" }}>View Crisis Resources →</div>
            </Card>
          )}

          {showEmotionalRedirect && (
            <Card style={{ background:"rgba(167,139,250,0.07)", borderColor:"rgba(167,139,250,0.2)", marginBottom:12 }}>
              <div style={{ fontSize:14, fontWeight:800, color:"#c4b5fd", marginBottom:8 }}>It sounds like you may need someone to talk to.</div>
              <div style={{ fontSize:13, color:"#94a3b8", lineHeight:1.6, marginBottom:14 }}>Our AI Peer Support is available right now — confidential, anytime.</div>
              <div onClick={() => navigate("aichat")} style={{ padding:"12px", borderRadius:10, cursor:"pointer", textAlign:"center", background:"rgba(167,139,250,0.12)", border:"1.5px solid rgba(167,139,250,0.3)", fontSize:13, fontWeight:700, color:"#a78bfa" }}>Connect with AI Peer Support →</div>
            </Card>
          )}

          {finderError && <div style={{ fontSize:12, color:"#f87171", marginBottom:12, textAlign:"center" }}>{finderError}</div>}

          {finderResults && finderResults.length === 0 && !finderLoading && (
            <div style={{ textAlign:"center", padding:"20px", color:"#475569", fontSize:13 }}>No resources found. Try a different scope or search term.</div>
          )}
          {finderResults && finderResults.map((r, i) => (
            <Card key={i} onClick={() => openResourceDetail({ ...r, icon:"🌐", color: r.verified ? "#22c55e" : "#38bdf8" })} style={{ display:"flex", alignItems:"flex-start", gap:14, cursor:"pointer", marginBottom:10 }}>
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
            <Card key={i} onClick={() => openResourceDetail(item)} style={{ display:'flex', alignItems:'flex-start', gap:14, cursor:"pointer" }}>
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
            <Card key={i} onClick={() => openResourceDetail(item)} style={{ display:'flex', alignItems:'flex-start', gap:14, cursor:"pointer" }}>
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
