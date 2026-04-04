// ============================================================
// SCREEN: ResourcesScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { AppHeader, Screen, ScreenSingle, Btn, Card, SLabel, DragList, NavBtn, DesktopWrap, HomeTile, ToolCard } from './ui.jsx';
import { useLayoutConfig } from './utils.js';
import { BoltIcon, ClockIcon, BreathIcon, HeartIcon, GaugeIcon, HomeIcon, InfoIcon, MapIcon, UserIcon, ToolsIcon, GroundIcon, JournalIcon, ResetIcon, LockIcon, BuildingIcon, TimerIcon, SettingsIcon, ShieldIcon } from './icons.jsx';
import { trackCheckin, trackTool, trackAISession, trackPSTContact, AW_ENDPOINT, AW_PROJECT, AW_DB } from './analytics.js';
import { fetchResources, LIFELINES } from './fetchResources.js';

export default function ResourcesScreen({navigate, agency, role, userState, onChangeState}){
  const [tab, setTab] = useState("crisis");
  const [zip, setZip] = useState(() => { try { return localStorage.getItem('upstream_zip') || ''; } catch (e) { return ''; } });
  const [zipResults, setZipResults] = useState(null);
  const [zipLoading, setZipLoading] = useState(false);
  const [selectedState, setSelectedState] = useState(userState || "NC");
  const [selectedDiscipline, setSelectedDiscipline] = useState("All");
  const [aiResources, setAiResources] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Load resources (Tries local storage cache first for dead zones!)
  const loadStateResources = (state) => {
    if (!state || state === "All") {
      setAiResources(crisis);
      return;
    }

    // 1. Check if we have Appwrite data cached in LocalStorage for this state
    let cachedData = [];
    try {
      const stored = localStorage.getItem(`appwrite_resources_${state}`);
      if (stored) cachedData = JSON.parse(stored);
    } catch(e) {
      console.log("No cached Appwrite resources found.");
    }

    // 2. Fallback to the hardcoded list at the bottom of line 71 if cache is empty
    const stateData = cachedData.length > 0 ? cachedData : (statePathways[state] || []);
    const neighbors = neighboringStates[state] || [];
    const neighborData = neighbors.flatMap(s => {
      const nData = statePathways[s] || [];
      return nData.slice(0, 2).map(r => ({ ...r, neighborState: s }));
    });

    // Merge them all together and ensure offline availability
    setAiResources([...stateData, ...neighborData, ...crisis]);
  };

  useEffect(() => { loadStateResources(selectedState); }, [selectedState]);

  const handleZipSearch = async () => {
    if (!zip || zip.length !== 5) return;
    try { localStorage.setItem('upstream_zip', zip); } catch(e) {}
    setZipLoading(true);
    
    try {
      const results = await fetchResources({
        zip,
        state: selectedState,
        appType: 'first_responder',
        isVeteran: false,
      });
      
      setZipResults(results);
      
      // CACHE TO APPWRITE FOR DEAD ZONE PERSISTENCE
      if (results && results.length > 0) {
        localStorage.setItem(`appwrite_resources_${selectedState}`, JSON.stringify(results));
        // Refresh visible state
        setAiResources([...results, ...crisis]);
      }
    } catch (error) {
      setAiError("Could not fetch latest resources. Using offline fallback.");
    } finally {
      setZipLoading(false);
    }
  };

  const [calendarView, setCalendarView] = useState("list");
  const [events, setEvents] = useState([
    { id: 1, date: "2026-03-15", title: "CISM Debrief: Station 7", type: "cism", color: "#ef4444" },
    { id: 2, date: "2026-03-18", title: "PST Available 1800-2200", type: "pst", color: "#a78bfa" },
    { id: 3, date: "2026-03-20", title: "Resilience Training", type: "training", color: "#22c55e" }
  ]);
  const isAdminRole = role === "supervisor" || role === "admin";
  
  const tabs = [
    { key: "crisis", label: "Crisis" },
    { key: "pathways", label: "State Pathways" },
    { key: "calendar", label: "Calendar" },
    { key: "upstream", label: "Upstream Approach" },
    { key: "downstream", label: "Downstream" }
  ];
  
  // Neighboring states map - shows resources from surrounding states too
  const neighboringStates = {
    "AL":["MS","TN","GA","FL"], "AK":[], "AZ":["CA","NV","UT","CO","NM"],
    "AR":["MO","TN","MS","LA","TX","OK"], "CA":["OR","NV","AZ"],
    "CO":["WY","NE","KS","OK","NM","AZ","UT"], "CT":["NY","MA","RI"],
    "DE":["MD","PA","NJ"], "FL":["GA","AL"], "GA":["FL","AL","TN","NC","SC"],
    "HI":[], "ID":["MT","WY","UT","NV","OR","WA"], "IL":["WI","IA","MO","KY","IN"],
    "IN":["IL","MI","OH","KY"], "IA":["MN","WI","IL","MO","NE","SD"],
    "KS":["NE","MO","OK","CO"], "KY":["OH","IN","IL","MO","TN","VA","WV"],
    "LA":["AR","MS","TX"], "ME":["NH"], "MD":["PA","DE","VA","WV"],
    "MA":["NH","VT","NY","CT","RI"], "MI":["WI","IN","OH"],
    "MN":["ND","SD","IA","WI"], "MS":["TN","AL","LA","AR"],
    "MO":["IA","IL","KY","TN","AR","OK","KS","NE"], "MT":["ID","WY","SD","ND"],
    "NE":["SD","IA","MO","KS","CO","WY"], "NV":["OR","ID","UT","AZ","CA"],
    "NH":["VT","ME","MA"], "NJ":["NY","PA","DE"], "NM":["CO","OK","TX","AZ"],
    "NY":["PA","NJ","CT","MA","VT"], "NC":["VA","TN","GA","SC"], "ND":["MT","SD","MN"],
    "OH":["PA","WV","KY","IN","MI"], "OK":["KS","MO","AR","TX","NM","CO"],
    "OR":["WA","ID","NV","CA"], "PA":["NY","NJ","DE","MD","WV","OH"],
    "RI":["CT","MA"], "SC":["NC","GA"], "SD":["ND","MN","IA","NE","WY","MT"],
    "TN":["KY","VA","NC","GA","AL","MS","AR","MO"], "TX":["NM","OK","AR","LA"],
    "UT":["ID","WY","CO","NM","AZ","NV"], "VT":["NY","NH","MA"], "VA":["MD","WV","KY","TN","NC"],
    "WA":["ID","OR"], "WV":["OH","PA","MD","VA","KY"], "WI":["MN","MI","IL","IA"],
    "WY":["MT","SD","NE","CO","UT","ID"]
  };
  
  const getRelevantStates = () => {
    if (!selectedState || selectedState === "All") return ["All"];
    const neighbors = neighboringStates[selectedState] || [];
    return [selectedState, ...neighbors, "All"];
  };
  
  const states = getRelevantStates();
  const disciplines = ["All", "Law Enforcement", "Fire", "EMS", "Dispatch", "Corrections"];
  
  const crisis = [
    { name: "988 Suicide & Crisis Lifeline", detail: "Call or text 988 . 24/7", color: "#ef4444", icon: "📞" },
    { name: "Crisis Text Line", detail: "Text HOME to 741741", color: "#f97316", icon: "💬" },
    { name: "Safe Call Now", detail: "1-206-459-3020 . First Responders", color: "#38bdf8", icon: "🔵" },
    { name: "Badge of Life", detail: "badgeoflife.com", color: "#a78bfa", icon: "🛡" },
    { name: "First Responder Support Network", detail: "frsn.org", color: "#22c55e", icon: "🌐" }
  ];
  
  const statePathways = {
    "NC":[
      {name:"NC Responder Alliance (NC RAI)", detail:"Gateway to EMDR, therapy, PST, chaplains . All disciplines", icon:"🌐", color:"#38bdf8", disciplines:["All"], free:true, tags:["EMDR","Therapy","PST","Chaplain"]},
      {name:"NC First Responder Peer Support Network", detail:"Statewide PST network . Certified PST members, CISM teams", icon:"🤝", color:"#a78bfa", disciplines:["All"], free:true, tags:["PST","CISM"]},
      {name:"NC-LEAP", detail:"NC Law Enforcement Assistance Program . Free, confidential", icon:"🛡", color:"#22c55e", disciplines:["Law Enforcement"], free:true, tags:["Therapy","EMDR","PST"]},
    ],
    "SC":[
      {name:"SC First Responder Peer Network", detail:"Statewide PST and crisis support", icon:"🤝", color:"#a78bfa", disciplines:["All"], free:true, tags:["PST","CISM"]},
    ],
    "VA":[
      {name:"VA First Responder Alliance", detail:"Peer support and mental health resources", icon:"🌐", color:"#38bdf8", disciplines:["All"], free:true, tags:["PST","Therapy"]},
    ]
  };
  
  const nationalFallbacks = [
    { name: "Safe Call Now", detail: "1-206-459-3020 . 24/7 First Responder Hotline", icon: "📞", color: "#38bdf8" },
    { name: "988 Suicide & Crisis Lifeline", detail: "Call or text 988 . National crisis support", icon: "🔵", color: "#ef4444" },
    { name: "Badge of Life", detail: "badgeoflife.com . First responder resources", icon: "🛡", color: "#a78bfa" },
    { name: "First Responder Support Network", detail: "frsn.org . National peer support", icon: "🌐", color: "#22c55e" },
  ];
  
  const upstream = [
    { name: "Resilience Building", detail: "Sleep, nutrition, exercise, peer connection", icon: "💪", color: "#22c55e" },
    { name: "Stress Inoculation", detail: "Understanding cumulative stress exposure", icon: "🧠", color: "#38bdf8" },
    { name: "Compassion Fatigue Education", detail: "Recognizing early warning signs", icon: "📖", color: "#a78bfa" },
    { name: "Peer Community", detail: "Mentorship, forums, agency wellness", icon: "🤝", color: "#eab308" },
    { name: "Family Resources", detail: "Supporting those who support you", icon: "🏠", color: "#f97316" }
  ];
  
  const downstream = [
    { name: "First Responder Therapist Finder", detail: "Specialists who understand the job", icon: "🔍", color: "#38bdf8" },
    { name: "EMDR & Trauma Treatment", detail: "Evidence-based trauma processing", icon: "🌀", color: "#a78bfa" },
    { name: "Substance Use Recovery", detail: "Peer-led programs, SMART Recovery", icon: "🌱", color: "#22c55e" },
    { name: "CISM Debriefing", detail: "Critical incident stress management", icon: "🗣", color: "#f97316" },
    { name: "Return to Duty Guidance", detail: "Legal rights and peer advocacy", icon: "[=]️", color: "#eab308" }
  ];
  
  const getFilteredPathways = () => {
    if (!aiResources) return statePathways[selectedState] || [];
    return aiResources.filter(r => {
      if (selectedDiscipline === "All") return true;
      return (r.disciplines && (r.disciplines.includes("All") || r.disciplines.includes(selectedDiscipline)));
    });
  };
  
  const filteredPathways = getFilteredPathways();
  const showNationalFallback = selectedState === "All" || (!aiLoading && filteredPathways.length === 0);
  
  return(
    <Screen headerProps={{onBack:()=>navigate("home"), title:"Resources", agencyName:(agency && agency.name)}}>
      
      {/* TABS NAVIGATION */}
      <div className="full-width" style={{display:"flex",gap:6,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:5,overflowX:"auto",minHeight:50}}>
        {tabs.map(t=>(
          <div
            key={t.key}
            onClick={()=>setTab(t.key)}
            style={{
              flex:1, textAlign:"center", padding:"10px 8px", borderRadius:9,
              background:tab===t.key?"rgba(56,189,248,0.18)":"transparent",
              border:"1px solid "+(tab===t.key?"rgba(56,189,248,0.35)":"transparent"),
              cursor:"pointer", fontSize:11, fontWeight:tab===t.key?800:600,
              color:tab===t.key?"#38bdf8":"#8099b0", transition:"all 0.2s",
              whiteSpace:"nowrap", display:"flex", alignItems:"center", justifyContent:"center",
            }}
          >
            {t.label}
          </div>
        ))}
      </div>
      
      {/* CRISIS TAB */}
      {tab==="crisis"&&(
        <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
          <div className="full-width" style={{background:"rgba(239,68,68,0.1)",border:"1.5px solid rgba(239,68,68,0.35)",borderRadius:12,padding:"14px 16px"}}>
            <div style={{fontSize:13,color:"#fca5a5",fontWeight:800,marginBottom:6}}>If you're in crisis right now</div>
            <div style={{fontSize:13,color:"#94a3b8",lineHeight:1.7}}>Call or text <span style={{color:"#f87171",fontWeight:700}}>988</span> · Text HOME to <span style={{color:"#f87171",fontWeight:700}}>741741</span> · Safe Call Now <span style={{color:"#f87171",fontWeight:700}}>1-206-459-3020</span> — people who understand the job, 24/7.</div>
          </div>
          
          <SLabel color="#ef4444">Available 24/7</SLabel>
          {crisis.map((r, i) => (
            <Card key={i} style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:44,height:44,borderRadius:13,background:`${r.color}18`,border:`1px solid ${r.color}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                {r.icon}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:"#dde8f4"}}>{r.name}</div>
                <div style={{fontSize:12,color:"#8099b0",marginTop:3}}>{r.detail}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
      
      {/* PATHWAYS TAB */}
      {tab==="pathways"&&(
        <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontSize:14,fontWeight:700,color:"#dde8f4"}}>State Resources</div>
            {onChangeState&&<div onClick={onChangeState} style={{fontSize:12,color:"#38bdf8",fontWeight:700,cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>Change My State</div>}
          </div>
          <Card style={{background:"rgba(56,189,248,0.06)",borderColor:"rgba(56,189,248,0.15)"}}>
            <div style={{fontSize:13,color:"#38bdf8",fontWeight:700,marginBottom:6}}>State-Specific Peer Support Networks</div>
            <div style={{fontSize:12,color:"#8099b0",lineHeight:1.7}}>
              Connect with vetted peer support programs, PST teams, chaplain networks, and EMDR clinicians in your state. All programs are free and responder-competent.
            </div>
          </Card>
          
          {/* ZIP Search */}
          <div style={{display: 'flex', gap: 8, margin: '12px 0'}}>
            <input 
              type="text" 
              placeholder="Enter Zip Code..." 
              value={zip} 
              onChange={(e) => setZip(e.target.value)}
              style={{flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0 12px', color: '#fff'}}
            />
            <Btn onClick={handleZipSearch} loading={zipLoading}>Search</Btn>
          </div>
          
          <div>
            <SLabel color="#38bdf8">Your State</SLabel>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {states.map(s=>(
                <div key={s} onClick={()=>setSelectedState(s)}
                  style={{
                    background:selectedState===s?"rgba(56,189,248,0.15)":"rgba(255,255,255,0.03)",
                    border:`1.5px solid ${selectedState===s?"rgba(56,189,248,0.35)":"rgba(255,255,255,0.07)"}`,
                    borderRadius:10, padding:"8px 14px", cursor:"pointer", fontSize:12, fontWeight:selectedState===s?700:400,
                    color:selectedState===s?"#38bdf8":"#8099b0", transition:"all 0.15s"
                  }}
                >
                  {s==="All"?"National":s}
                </div>
              ))}
            </div>
          </div>
          
          {/* Output Mapped Results */}
          <SLabel color="#22c55e">{selectedState} Results</SLabel>
          {filteredPathways.map((r, i) => (
            <Card key={i} style={{display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:44,height:44,borderRadius:13,background:`${r.color}18`,border:`1px solid ${r.color}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                {r.icon}
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#dde8f4"}}>{r.name}</div>
                  {r.neighborState && <div style={{fontSize:9,color:"#a78bfa"}}>{r.neighborState}</div>}
                </div>
                <div style={{fontSize:12,color:"#8099b0",marginTop:3}}>{r.detail}</div>
              </div>
            </Card>
          ))}
        </>
      )}

      {/* CALENDAR TAB */}
      {tab==="calendar"&&(
        <>
          <SLabel color="#38bdf8">Agency Events & Shifts</SLabel>
          {events.map(event => (
            <Card key={event.id} style={{borderLeft: `4px solid ${event.color}`, display: 'flex', justifyContent: 'space-between'}}>
              <div>
                <div style={{fontSize: 14, fontWeight: 700, color: '#fff'}}>{event.title}</div>
                <div style={{fontSize: 12, color: '#8099b0'}}>{event.date}</div>
              </div>
              <div style={{fontSize: 11, color: event.color, fontWeight: 700, textTransform: 'uppercase'}}>{event.type}</div>
            </Card>
          ))}
        </>
      )}

      {/* UPSTREAM TAB */}
      {tab==="upstream"&&(
        <>
          <SLabel color="#22c55e">Proactive Mental Health</SLabel>
          {upstream.map((item, i) => (
            <Card key={i} style={{display: 'flex', alignItems: 'center', gap: 14}}>
              <div style={{fontSize: 24}}>{item.icon}</div>
              <div>
                <div style={{fontSize: 14, fontWeight: 700, color: '#dde8f4'}}>{item.name}</div>
                <div style={{fontSize: 12, color: '#8099b0'}}>{item.detail}</div>
              </div>
            </Card>
          ))}
        </>
      )}

      {/* DOWNSTREAM TAB */}
      {tab==="downstream"&&(
        <>
          <SLabel color="#a78bfa">Trauma & Recovery Support</SLabel>
          {downstream.map((item, i) => (
            <Card key={i} style={{display: 'flex', alignItems: 'center', gap: 14}}>
              <div style={{fontSize: 24}}>{item.icon}</div>
              <div>
                <div style={{fontSize: 14, fontWeight: 700, color: '#dde8f4'}}>{item.name}</div>
                <div style={{fontSize: 12, color: '#8099b0'}}>{item.detail}</div>
              </div>
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}
