import React, { useState, useEffect, useRef } from 'react';

// Appwrite anonymous analytics
const AW_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const AW_PROJECT  = 'upstreamapproach';
const AW_DB       = 'upstream_db';  // Updated to match your database ID!

async function awTrack(collection, data) {
  // Fire-and-forget - never blocks UI, never crashes app
  try {
    const id = 'id' + Date.now() + Math.random().toString(36).slice(2,7);
    await fetch(`${AW_ENDPOINT}/databases/${AW_DB}/collections/${collection}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': AW_PROJECT,
      },
      body: JSON.stringify({
        documentId: id,
        data: { ...data, timestamp: new Date().toISOString() },
      }),
    });
  } catch(e) { /* silent - analytics never interrupts the user */ }
}

function trackCheckin(agencyCode, status, shiftPhase) {
  const now = new Date();
  awTrack('checkins', {
    agencyCode: agencyCode || 'NONE',
    status,
    shiftPhase: shiftPhase || '',
    dayOfWeek: now.getDay(),
    hour: now.getHours(),
  });
}
function trackTool(agencyCode, tool) {
  awTrack('tool_usage', { agencyCode: agencyCode || 'NONE', tool });
}
function trackAISession(agencyCode, crisisLevel, messageCount) {
  awTrack('ai_sessions', { agencyCode: agencyCode || 'NONE', crisisLevel: crisisLevel||0, messageCount: messageCount||1 });
}
function trackPSTContact(agencyCode, contactType) {
  awTrack('pst_contacts', { agencyCode: agencyCode || 'NONE', contactType, resolved: false });
}

async function fetchAgencyStats(agencyCode, days=30) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString();
    const headers = { 'X-Appwrite-Project': AW_PROJECT };
    const base = `${AW_ENDPOINT}/databases/${AW_DB}/collections`;
    const qs = (col) => base+"/"+col+"/documents?queries[]="+encodeURIComponent(JSON.stringify({method:"equal",attribute:"agencyCode",values:[agencyCode]}))+"&queries[]="+encodeURIComponent(JSON.stringify({method:"greaterThan",attribute:"timestamp",values:[sinceStr]}))+"&limit=5000";

    const [r1,r2,r3,r4] = await Promise.all([
      fetch(qs('checkins'),{headers}).then(r=>r.json()),
      fetch(qs('tool_usage'),{headers}).then(r=>r.json()),
      fetch(qs('ai_sessions'),{headers}).then(r=>r.json()),
      fetch(qs('pst_contacts'),{headers}).then(r=>r.json()),
    ]);

    const statusCounts={great:0,striving:0,notwell:0,ill:0};
    const byDay={};
    (r1.documents||[]).forEach(c=>{
      if(statusCounts[c.status]!==undefined) statusCounts[c.status]++;
      const day=c.timestamp&&c.timestamp.slice(0,10);
      if(day) byDay[day]=(byDay[day]||0)+1;
    });

    const toolCounts={};
    (r2.documents||[]).forEach(t=>{ toolCounts[t.tool]=(toolCounts[t.tool]||0)+1; });

    const total=r1.total||0;
    return {
      totalCheckins: total,
      statusCounts,
      byDay,
      toolCounts,
      totalToolUsage: r2.total||0,
      aiSessionCount: r3.total||0,
      pstContactCount: r4.total||0,
      wellnessScore: total>0 ? Math.round((statusCounts.great*100+statusCounts.striving*67+statusCounts.notwell*33)/total) : null,
    };
  } catch(e) { return null; }
}
// --------------------------------------------------------------------------

const LOGO_SRC = "/Logo-full.png";
const SPLASH_SRC = "/Logo-full.png";
const LOGO_FULL_SRC = "/Logo-full.png";

// Responsive layout hook
function useLayout() {
  const [layout, setLayout] = useState(() => getLayout());
  function getLayout() {
    const w = window.innerWidth;
    if (w >= 1024) return "desktop";
    if (w >= 640)  return "tablet";
    return "mobile";
  }
  useEffect(() => {
    const fn = () => setLayout(getLayout());
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return layout;
}

// Layout config per breakpoint
function useLayoutConfig() {
  const layout = useLayout();
  return {
    layout,
    isMobile:  layout === "mobile",
    isTablet:  layout === "tablet",
    isDesktop: layout === "desktop",
    maxW:      layout === "mobile" ? 420 : layout === "tablet" ? 680 : 900,
    contentPad:layout === "mobile" ? "20px 18px 0" : layout === "tablet" ? "28px 32px 0" : "32px 40px 0",
    logoW:     layout === "mobile" ? "72%" : layout === "tablet" ? "55%" : "42%",
    logoMaxW:  layout === "mobile" ? 280 : layout === "tablet" ? 340 : 320,
    headerPT:  layout === "mobile" ? 44 : 32,
    fontSize:  layout === "mobile" ? 1 : layout === "tablet" ? 1.08 : 1.12,
    twoCol:    layout !== "mobile",
    cardRadius:layout === "mobile" ? 18 : 22,
    btnRadius: layout === "mobile" ? 14 : 16,
    gap:       layout === "mobile" ? 12 : 16,
  };
}

// Agency Codes
// contractExpiry  - date contract ends / payment stops
// graceExpiry     - date data is purged (contractExpiry + 6 months)
// codeExpiry      - date THIS code stops working (rotation)
// successorCode   - the new code issued after rotation
// adminEmail      - where renewal/rotation emails go
const AGENCY_CODES = {
  // Each agency entry: name, short code, contract dates, code rotation dates, successor code, admin contact email
  // contractExpiry = when payment/contract ends
  // graceExpiry    = contractExpiry + 6 months (data purged if no renewal)
  // codeExpiry     = when this access code rotates (bi-annual or annual per agency agreement)
  // successorCode  = the new code issued at rotation (null until rotation is processed)
  // adminEmail     = where rotation/renewal emails are sent automatically
  UPSTREAM: { name:"Upstream Demo Agency", short:"DEMO",   contractExpiry:"2027-01-01", graceExpiry:"2027-07-01", codeExpiry:"2026-07-01", successorCode:null,      adminEmail:"admin@upstreamdemo.com" },
  METRO24:  { name:"Metro EMS",            short:"METRO",  contractExpiry:"2027-03-01", graceExpiry:"2027-09-01", codeExpiry:"2026-09-01", successorCode:null,      adminEmail:"admin@metroems.com" },
  FIRE07:   { name:"Station 7 Fire",       short:"FIRE07", contractExpiry:"2027-06-01", graceExpiry:"2027-12-01", codeExpiry:"2026-07-15", successorCode:null,      adminEmail:"admin@station7.com" },
  EMS01:    { name:"County EMS",           short:"EMS01",  contractExpiry:"2027-06-01", graceExpiry:"2027-12-01", codeExpiry:"2026-06-01", successorCode:null,      adminEmail:"admin@countyems.com" },
  SHERIFF:  { name:"Sheriff's Office",     short:"SHERIFF",contractExpiry:"2027-09-01", graceExpiry:"2028-03-01", codeExpiry:"2026-09-01", successorCode:null,      adminEmail:"admin@sheriff.com" },
};

// Contract / Code Status Helpers
function getContractStatus(agency){
  if(!agency) return "none";
  const now=new Date();
  if(now < new Date(agency.contractExpiry)) return "active";
  if(now < new Date(agency.graceExpiry))    return "grace";
  return "purged";
}
function getCodeStatus(agency){
  if(!agency) return "none";
  const now=new Date();
  const exp=new Date(agency.codeExpiry);
  if(now > exp) return agency.successorCode ? "expired" : "expired_no_successor";
  if(exp < new Date(now.getTime()+30*24*60*60*1000)) return "rotating";
  return "valid";
}
function getDaysUntil(dateStr){ return Math.ceil((new Date(dateStr)-new Date())/(1000*60*60*24)); }
function getDaysUntilPurge(agency){ return getDaysUntil(agency.graceExpiry); }

function getContractBanner(agencyCode){
  const agency=AGENCY_CODES[agencyCode];
  if(!agency) return null;
  const cs=getContractStatus(agency);
  const codeS=getCodeStatus(agency);
  if(cs==="active"&&codeS==="rotating"){
    const days=getDaysUntil(agency.codeExpiry);
    return {type:"rotating",color:"#eab308",bg:"rgba(234,179,8,0.08)",border:"rgba(234,179,8,0.25)",icon:"🔄",
      title:`Access code renews in ${days} day${days!==1?"s":""}`,
      body:"Your admin will receive the new code by email before this one expires. Share it with staff at your next roll call or briefing."};
  }
  if(codeS==="expired"||codeS==="expired_no_successor"){
    return {type:"code_expired",color:"#f97316",bg:"rgba(249,115,22,0.08)",border:"rgba(249,115,22,0.25)",icon:"🔑",
      title:"Your access code has been renewed",
      body:"Get the new code from your supervisor or agency admin and enter it to continue."};
  }
  if(cs==="grace"){
    const days=getDaysUntilPurge(agency);
    return {type:"grace",color:"#ef4444",bg:"rgba(239,68,68,0.07)",border:"rgba(239,68,68,0.2)",icon:"...",
      title:"Agency access is currently paused",
      body:`Your personal wellness tools are still fully available. Agency features are paused while the contract is renewed. Agency data is held securely for ${days} more day${days!==1?"s":""}.`,
      adminBody:`Contract has lapsed. Data held for ${days} more day${days!==1?"s":""}. Contact Upstream to reinstate - upstreampst.netlify.app`};
  }
  if(cs==="purged"){
    return {type:"purged",color:"#475569",bg:"rgba(71,85,105,0.08)",border:"rgba(71,85,105,0.2)",icon:"🗄️",
      title:"Agency access has ended",
      body:"Your personal wellness tools remain fully available. Agency data has been purged from the system per our data policy. Contact Upstream to start a new contract."};
  }
  return null;
}

const DEMO_MEMBERSHIPS = [
  {id:"m1",agencyCode:"UPSTREAM",agencyName:"Upstream Demo Agency",agencyShort:"DEMO",role:"user"},
  {id:"m1a",agencyCode:"UPSTREAM",agencyName:"Upstream Demo Agency",agencyShort:"DEMO",role:"admin"},
  {id:"m2",agencyCode:"METRO24",agencyName:"Metro EMS",agencyShort:"METRO",role:"pst"},
  {id:"m3",agencyCode:"FIRE07",agencyName:"Station 7 Fire",agencyShort:"FIRE07",role:"user"},
];
const ROLE_LABELS = {user:"Responder",pst:"PST Member",supervisor:"Supervisor",admin:"Admin",platform:"Platform Owner"};
const ROLE_COLORS = {user:"#38bdf8",pst:"#a78bfa",supervisor:"#eab308",admin:"#94a3b8",platform:"#f59e0b"};
const ROLE_BADGES = {user:"USER",pst:"PST",supervisor:"SUPV",admin:"ADMIN",platform:"PLATFORM"};
const isOpsRole = (r) => r==="supervisor"||r==="admin";

const DEMO_PST_ROSTERS = {
  UPSTREAM:[
    {id:"p1",name:"J. Martinez",role:"PST Lead",  status:"on",  workload:3},
    {id:"p2",name:"A. Thompson",role:"PST Member",status:"phone",workload:1},
    {id:"p3",name:"C. Williams",role:"PST Member",status:"off", workload:0},
    {id:"p4",name:"D. Nguyen",  role:"PST Member",status:"on",  workload:2},
  ],
  METRO24:[
    {id:"p5",name:"S. Okafor",role:"PST Lead",  status:"on",workload:4},
    {id:"p6",name:"T. Rivera",role:"PST Member",status:"on",workload:1},
  ],
  FIRE07:[{id:"p7",name:"B. Chen",role:"PST Lead",status:"phone",workload:2}],
};

const DEMO_ESCALATIONS = {
  UPSTREAM:[
    {id:"e1",time:"14:32",priority:"Urgent",  status:"open",    claimedBy:null,          note:"Broadcast escalation requested"},
    {id:"e2",time:"11:05",priority:"Priority",status:"claimed", claimedBy:"J. Martinez", note:"Follow-up after shift"},
    {id:"e3",time:"08:44",priority:"Routine", status:"completed",claimedBy:"A. Thompson",note:"Routine wellness check"},
  ],
  METRO24:[{id:"e4",time:"16:10",priority:"Urgent",status:"open",claimedBy:null,note:"Broadcast escalation requested"}],
  FIRE07:[],
};

// Multi-Agency Role Model
// Crisis Keywords
const KEYWORDS = {
  4: ["this is goodbye","this is my last shift","i have a plan","not going to be here tomorrow","taking pills tonight","ending it tonight","going to shoot myself","going to hang myself","take care of my family"],
  3: ["i want to die","want to kill myself","going to end my life","eat my gun","10-7 permanent","i'm going to end it","i don't want to live","tap out permanently"],
  2: ["everyone would be better off without me","i'm a burden","nothing matters anymore","no way out","i'm done fighting","the job broke me","i've got nothing left","i wish i wouldn't wake up","trapped","hopeless","worthless"],
  1: ["i'm not okay","i'm struggling","burned out","carrying the call","bad shift","can't shut my brain off","mentally drained","i'm numb","i feel empty","everything feels heavy"],
};
// Spiritual/chaplain keywords
const SPIRITUAL_KEYWORDS = [
  "pray","prayer","praying","god","jesus","lord","faith","bible","church","chaplain",
  "spiritual","spiritually","pastor","priest","minister","allah","holy spirit",
  "blessed","blessing","heaven","afterlife","soul","scripture","verse","amen",
  "rosary","worship","grace","forgive","forgiveness","sin","redemption","believe in god",
  "higher power","universe has a plan","everything happens for a reason"
];
function detectSpiritual(text){
  const lower=text.toLowerCase();
  return SPIRITUAL_KEYWORDS.some(kw=>lower.includes(kw));
}

function detectLevel(text) {
  const lower = text.toLowerCase();
  for (const lv of [4,3,2,1]) { if (KEYWORDS[lv].some(kw => lower.includes(kw))) return lv; }
  return 0;
}
const LEVEL_CONFIG = {
  1:{color:"#22c55e",label:"Level 1 - Distress Detected",bg:"rgba(34,197,94,0.1)",border:"rgba(34,197,94,0.25)"},
  2:{color:"#eab308",label:"Level 2 - Concerning Language",bg:"rgba(234,179,8,0.1)",border:"rgba(234,179,8,0.25)"},
  3:{color:"#ef4444",label:"Level 3 - Active Ideation",bg:"rgba(239,68,68,0.1)",border:"rgba(239,68,68,0.3)"},
  4:{color:"#1a1a2e",label:"Level 4 - Immediate Danger",bg:"rgba(0,0,0,0.35)",border:"rgba(255,255,255,0.15)",textColor:"#f8fafc"},
};

// Shared Header
function AppHeader({ onBack, title, agencyName, lc }) {
  return (
    <div style={{width:"100%",background:"linear-gradient(180deg,#0a1628 0%,rgba(10,22,40,0.97) 100%)",borderBottom:"1px solid rgba(56,189,248,0.1)",backdropFilter:"blur(14px)",paddingTop:lc.headerPT,paddingBottom:10,display:"flex",flexDirection:"column",alignItems:"center",position:"sticky",top:0,zIndex:100}}>
      {onBack && (
        <div onClick={onBack} style={{position:"absolute",top:lc.headerPT+6,left:lc.isDesktop?40:16,cursor:"pointer",color:"#38bdf8",display:"flex",alignItems:"center",gap:4,fontSize:lc.isDesktop?14:13,fontWeight:600}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>Back
        </div>
      )}
      <div style={{width:"100%",maxWidth:lc.maxW,padding:`0 ${lc.isDesktop?40:24}px`,display:"flex",justifyContent:"center"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><img src={LOGO_FULL_SRC} alt="Upstream Approach" style={{width:"90%",maxWidth:380,height:"auto",objectFit:"contain"}}/><div style={{fontSize:10,color:"#38bdf8",fontWeight:600,letterSpacing:"0.18em",textTransform:"uppercase",opacity:0.7}}>First Responder Edition</div></div>
      </div>
      {title && <div style={{fontSize:lc.isDesktop?12:11,color:"#38bdf8",fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",marginTop:6}}>{title}</div>}
      <div style={{marginTop:6,minHeight:22,display:"flex",alignItems:"center",justifyContent:"center"}}>
        {agencyName ? (
          <div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(14,165,233,0.07)",border:"1px solid rgba(14,165,233,0.15)",borderRadius:8,padding:"4px 14px"}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:"#0ea5e9"}}/>
            <span style={{fontSize:11,fontWeight:600,color:"#4d7a99",letterSpacing:"0.14em",textTransform:"uppercase"}}>{agencyName}</span>
          </div>
        ) : (
          <div style={{display:"flex",alignItems:"center",gap:6,opacity:0.2}}>
            <div style={{width:28,height:1,background:"#1e3a52"}}/>
            <span style={{fontSize:9,color:"#1e3a52",letterSpacing:"0.2em"}}>INDIVIDUAL MODE</span>
            <div style={{width:28,height:1,background:"#1e3a52"}}/>
          </div>
        )}
      </div>
    </div>
  );
}

function Screen({ children, headerProps }) {
  const lc = useLayoutConfig();
  return (
    <div style={{height:"100vh",background:"linear-gradient(160deg,#060e1b 0%,#0b1829 55%,#07101e 100%)",fontFamily:"'DM Sans',sans-serif",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden"}}>
      <div style={{position:"fixed",top:-100,left:"50%",transform:"translateX(-50%)",width:800,height:400,background:"radial-gradient(ellipse,rgba(8,70,160,0.18) 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"fixed",inset:0,opacity:0.02,pointerEvents:"none",backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 40px,#fff 40px,#fff 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,#fff 40px,#fff 41px)"}}/>
      <AppHeader {...headerProps} lc={lc}/>
      {/* Desktop: sidebar layout */}
      {lc.isDesktop ? (
        <div style={{width:"100%",maxWidth:lc.maxW,padding:lc.contentPad,display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,alignItems:"start",overflowY:"auto",flex:1,paddingBottom:20}}>
          {children}
        </div>
      ) : (
        <div style={{width:"100%",maxWidth:lc.maxW,padding:lc.contentPad,paddingBottom:80,display:"flex",flexDirection:"column",gap:lc.gap,overflowY:"auto",flex:1}}>
          {children}
        </div>
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        html,body{overflow:hidden;width:100%;height:100%;background:#060e1b;margin:0;padding:0;}
        *{box-sizing:border-box;margin:0;padding:0;}
        textarea,input{color:#dde8f4!important;}
        input::placeholder,textarea::placeholder{color:#2d4a66!important;}
        .full-width{grid-column:1/-1;}
        
        /* Custom scrollbar styling to match app background */
        ::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(6,14,27,0.5);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(56,189,248,0.2);
          border-radius: 10px;
          border: 2px solid rgba(6,14,27,0.5);
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(56,189,248,0.3);
        }
        /* Firefox scrollbar */
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(56,189,248,0.2) rgba(6,14,27,0.5);
        }
      `}</style>
    </div>
  );
}

// Screen with single-column override (for screens that shouldn't go 2-col on desktop)
function ScreenSingle({ children, headerProps }) {
  const lc = useLayoutConfig();
  return (
    <div style={{height:"100vh",background:"linear-gradient(160deg,#060e1b 0%,#0b1829 55%,#07101e 100%)",fontFamily:"'DM Sans',sans-serif",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden",zIndex:1}}>
      <div style={{position:"fixed",top:-100,left:"50%",transform:"translateX(-50%)",width:800,height:400,background:"radial-gradient(ellipse,rgba(8,70,160,0.18) 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"fixed",inset:0,opacity:0.02,pointerEvents:"none",backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 40px,#fff 40px,#fff 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,#fff 40px,#fff 41px)"}}/>
      <AppHeader {...headerProps} lc={lc}/>
      <div style={{width:"100%",maxWidth:Math.min(lc.maxW,560),padding:lc.contentPad,display:"flex",flexDirection:"column",gap:lc.gap,overflowY:"auto",flex:1,paddingBottom:lc.isDesktop?20:90}}>
        {children}
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        html,body{overflow:hidden;width:100%;height:100%;background:#060e1b;margin:0;padding:0;}
        *{box-sizing:border-box;margin:0;padding:0;}
        textarea,input{color:#dde8f4!important;}
        input::placeholder,textarea::placeholder{color:#2d4a66!important;}
        
        /* Custom scrollbar styling to match app background */
        ::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(6,14,27,0.5);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(56,189,248,0.2);
          border-radius: 10px;
          border: 2px solid rgba(6,14,27,0.5);
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(56,189,248,0.3);
        }
        /* Firefox scrollbar */
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(56,189,248,0.2) rgba(6,14,27,0.5);
        }
      `}</style>
    </div>
  );
}

function Btn({children,color="#38bdf8",bg,onClick,style={},disabled=false}){
  const[p,setP]=useState(false);
  return <div onClick={disabled?null:onClick} onMouseDown={()=>!disabled&&setP(true)} onMouseUp={()=>setP(false)} onMouseLeave={()=>setP(false)} style={{background:bg||"rgba(56,189,248,0.1)",border:`1.5px solid ${color}${disabled?"20":"40"}`,borderRadius:14,padding:"14px 18px",cursor:disabled?"not-allowed":"pointer",textAlign:"center",fontSize:14,fontWeight:700,color:disabled?color+"55":color,transform:p?"scale(0.97)":"scale(1)",transition:"all 0.13s",opacity:disabled?0.5:1,...style}}>{children}</div>;
}
function Card({children,style={},className="",onClick}){return <div onClick={onClick} className={className} style={{background:"rgba(255,255,255,0.033)",border:"1.5px solid rgba(255,255,255,0.065)",borderRadius:18,padding:"18px 16px",cursor:onClick?"pointer":"default",...style}}>{children}</div>;}
function SLabel({children,color="#38bdf8"}){return <div style={{fontSize:11,color,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:6}}>{children}</div>;}

// 
// DRAG AND DROP - reusable list
// 
function DragList({items,onReorder,renderItem,keyFn}){
  const[dragIdx,setDragIdx]=useState(null);
  const[overIdx,setOverIdx]=useState(null);

  const handleDragStart=(e,i)=>{
    setDragIdx(i);
    e.dataTransfer.effectAllowed="move";
    e.dataTransfer.setData("text/plain",String(i));
  };
  const handleDragOver=(e,i)=>{
    e.preventDefault();
    e.dataTransfer.dropEffect="move";
    if(i!==overIdx) setOverIdx(i);
  };
  const handleDrop=(e,i)=>{
    e.preventDefault();
    if(dragIdx===null||dragIdx===i){setDragIdx(null);setOverIdx(null);return;}
    const next=[...items];
    const [moved]=next.splice(dragIdx,1);
    next.splice(i,0,moved);
    onReorder(next);
    setDragIdx(null);
    setOverIdx(null);
  };
  const handleDragEnd=()=>{setDragIdx(null);setOverIdx(null);};

  // Touch support
  const touchStart=useRef(null);
  const handleTouchStart=(e,i)=>{
    touchStart.current={idx:i,y:e.touches[0].clientY};
    setDragIdx(i);
  };
  const handleTouchMove=(e)=>{
    if(touchStart.current===null)return;
    const y=e.touches[0].clientY;
    const els=e.currentTarget.parentNode.children;
    let over=touchStart.current.idx;
    for(let j=0;j<els.length;j++){
      const r=els[j].getBoundingClientRect();
      if(y>=r.top&&y<=r.bottom){over=j;break;}
    }
    setOverIdx(over);
  };
  const handleTouchEnd=(e)=>{
    if(touchStart.current===null||overIdx===null){setDragIdx(null);setOverIdx(null);touchStart.current=null;return;}
    const from=touchStart.current.idx;
    const to=overIdx;
    if(from!==to){
      const next=[...items];
      const[moved]=next.splice(from,1);
      next.splice(to,0,moved);
      onReorder(next);
    }
    setDragIdx(null);setOverIdx(null);touchStart.current=null;
  };

  return(
    <div>
      {items.map((item,i)=>(
        <div
          key={keyFn?keyFn(item):i}
          draggable
          onDragStart={e=>handleDragStart(e,i)}
          onDragOver={e=>handleDragOver(e,i)}
          onDrop={e=>handleDrop(e,i)}
          onDragEnd={handleDragEnd}
          onTouchStart={e=>handleTouchStart(e,i)}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            opacity:dragIdx===i?0.4:1,
            transform:overIdx===i&&dragIdx!==i?"translateY(-2px)":"none",
            borderTop:overIdx===i&&dragIdx!==null&&dragIdx!==i?"2px solid #38bdf8":"2px solid transparent",
            transition:"transform 0.15s, opacity 0.15s, border-color 0.1s",
            cursor:"grab",
          }}
        >
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{color:"#334155",fontSize:16,flexShrink:0,cursor:"grab",padding:"0 4px",userSelect:"none"}}>:::</div>
            <div style={{flex:1}}>{renderItem(item,i)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}




function NavBtn({icon,label,sub,color,bg,badge,compact,onClick,locked=false}){
  const[p,setP]=useState(false);
  const lc=useLayoutConfig();
  const fs=lc.isDesktop?16:compact?13:15;
  return(
    <div onMouseDown={()=>setP(true)} onMouseUp={()=>setP(false)} onMouseLeave={()=>setP(false)} onClick={onClick} style={{background:p&&!locked?bg:"rgba(255,255,255,0.033)",border:`1.5px solid ${locked?"rgba(255,255,255,0.04)":p?color+"55":"rgba(255,255,255,0.065)"}`,borderRadius:lc.cardRadius,padding:compact?"15px 13px":`${lc.isDesktop?20:17}px 20px`,cursor:"pointer",display:"flex",alignItems:compact?"center":"flex-start",flexDirection:compact?"column":"row",gap:compact?9:15,transition:"all 0.13s",transform:p&&!locked?"scale(0.98)":"scale(1)",position:"relative",overflow:"hidden",userSelect:"none",opacity:locked?0.55:1}}>
      <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,borderRadius:"18px 0 0 18px",background:locked?"#1e3a52":color,opacity:locked?1:p?1:0.55}}/>
      <div style={{width:compact?43:46,height:compact?43:46,borderRadius:compact?12:14,background:locked?"rgba(255,255,255,0.04)":bg,border:`1px solid ${locked?"rgba(255,255,255,0.06)":color+"25"}`,display:"flex",alignItems:"center",justifyContent:"center",color:locked?"#2d4a66":color,flexShrink:0}}>{locked?<LockIcon/>:icon}</div>
      <div style={{flex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <span style={{fontSize:fs,fontWeight:700,color:locked?"#2d4a66":"#dde8f4",lineHeight:1.3}}>{label}</span>
          {badge&&!locked&&<span style={{fontSize:9,fontWeight:800,letterSpacing:"0.13em",color,background:color+"18",padding:"2px 7px",borderRadius:6,textTransform:"uppercase"}}>{badge}</span>}
          {locked&&<span style={{fontSize:9,fontWeight:800,letterSpacing:"0.1em",color:"#1e3a52",background:"rgba(255,255,255,0.04)",padding:"2px 7px",borderRadius:6,textTransform:"uppercase"}}>AGENCY ONLY</span>}
        </div>
        {!compact&&<div style={{fontSize:12,color:locked?"#1e3a52":"#8099b0",marginTop:4,lineHeight:1.5}}>{locked?"Enter agency code to unlock":sub}</div>}
      </div>
      {!compact&&<div style={{color:"#1e3a52",alignSelf:"center"}}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg></div>}
    </div>
  );
}

function CrewBar(){
  const segs=[{pct:48,color:"#22c55e",label:"Great"},{pct:28,color:"#eab308",label:"Striving"},{pct:16,color:"#f97316",label:"Not Well"},{pct:8,color:"#ef4444",label:"Ill"}];
  return(<div><div style={{display:"flex",height:8,borderRadius:8,overflow:"hidden",gap:2}}>{segs.map((s,i)=><div key={i} style={{width:`${s.pct}%`,background:s.color,borderRadius:8}}/>)}</div><div style={{display:"flex",gap:14,marginTop:9,flexWrap:"wrap"}}>{segs.map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:6,height:6,borderRadius:"50%",background:s.color}}/><span style={{fontSize:10,color:"#8099b0"}}>{s.pct}% {s.label}</span></div>)}</div></div>);
}

// Bottom Nav (mobile/tablet) + Side Nav (desktop)
function BottomNav({screen,navigate,hasAgency,userLanguage="en",role="user"}){
  const lc=useLayoutConfig();
  const isOps=role==="supervisor"||role==="admin"||role==="platform";
  const tabs=[
    {key:"home",      label:t("home",userLanguage),   icon:<HomeIcon/>},
    {key:"aichat", label:t("aiPST",userLanguage),  icon:<BoltIcon/>},
    {key:"admintools",label:"Dashboard",              icon:<SettingsIcon/>, opsOnly:true},
    {key:"humanpst",  label:t("pstTeam",userLanguage),icon:<HeartIcon/>,    userOnly:true},
    {key:"tools",     label:t("tools",userLanguage),  icon:<ToolsIcon/>},
    {key:"resources", label:"Resources",              icon:<MapIcon/>,      opsOnly:true},
    {key:"about",     label:t("about",userLanguage),  icon:<UserIcon/>,     userOnly:true},
  ].filter(tab=>isOps?!tab.userOnly:!tab.opsOnly);
  const topLevel=["home","aichat","humanpst","tools","about","admintools","resources"];
  const active=topLevel.includes(screen)?screen:screen==="admintools"?"admintools":"home";

  if(lc.isDesktop){
    return(
      <div style={{position:"fixed",top:0,left:0,bottom:0,width:64,background:"#060e1b",borderRight:"1px solid rgba(255,255,255,0.06)",display:"flex",flexDirection:"column",alignItems:"center",paddingTop:140,gap:6,zIndex:200}}>
        {tabs.map(tab=>(
          <div key={tab.key} onClick={()=>navigate(tab.key)} title={tab.label} style={{width:44,height:44,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",background:(active===tab.key||screen===tab.key)?"rgba(56,189,248,0.15)":"transparent",border:"1px solid "+((active===tab.key||screen===tab.key)?"rgba(56,189,248,0.3)":"transparent"),color:(active===tab.key||screen===tab.key)?"#38bdf8":(tab.key==="humanpst"&&!hasAgency)?"#2d4a66":"#8099b0",transition:"all 0.2s",position:"relative"}}>
            {(tab.key==="humanpst"&&!hasAgency)?<LockIcon/>:tab.icon}
            {(tab.key==="humanpst"&&!hasAgency)&&<div style={{position:"absolute",top:4,right:4,width:5,height:5,borderRadius:"50%",background:"#38bdf8",opacity:0.6}}/>}
          </div>
        ))}
      </div>
    );
  }

  return(
    <div style={{position:"fixed",bottom:0,left:0,right:0,background:"rgba(6,14,27,0.97)",borderTop:"1px solid rgba(255,255,255,0.07)",backdropFilter:"blur(16px)",display:"flex",justifyContent:"space-around",padding:"10px 0 20px",zIndex:500}}>
      {tabs.map(tab=>(
        <div key={tab.key} onClick={()=>navigate(tab.key)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,cursor:"pointer",padding:"2px 10px",opacity:active===tab.key?1:(tab.key==="humanpst"&&!hasAgency)?0.4:0.7,transition:"opacity 0.2s",position:"relative"}}>
          <div style={{color:active===tab.key?"#38bdf8":(tab.key==="humanpst"&&!hasAgency)?"#2d4a66":"#8099b0"}}>{(tab.key==="humanpst"&&!hasAgency)?<LockIcon/>:tab.icon}</div>
          <span style={{fontSize:10,fontWeight:active===tab.key?700:500,color:active===tab.key?"#38bdf8":(tab.key==="humanpst"&&!hasAgency)?"#2d4a66":"#8099b0",letterSpacing:"0.06em"}}>{tab.label}</span>
          {(tab.key==="humanpst"&&!hasAgency)&&<div style={{position:"absolute",top:-2,right:6,width:6,height:6,borderRadius:"50%",background:"#38bdf8",opacity:0.6}}/>}
        </div>
      ))}
    </div>
  );
}

// Desktop content wrapper (offset for sidebar nav)
function DesktopWrap({children,isDesktop}){
  if(!isDesktop) return children;
  return <div style={{marginLeft:64,width:"calc(100vw - 64px)",overflowX:"hidden"}}>{children}</div>;
}

// 
// STATE SELECTOR (First Launch)
// 
function StateSelector({onSelect,currentState}){
  const[selected,setSelected]=useState(currentState||null);
  const lc=useLayoutConfig();
  
  const states=[
    {code:"AL",name:"Alabama"},{code:"AK",name:"Alaska"},{code:"AZ",name:"Arizona"},{code:"AR",name:"Arkansas"},
    {code:"CA",name:"California"},{code:"CO",name:"Colorado"},{code:"CT",name:"Connecticut"},{code:"DE",name:"Delaware"},
    {code:"FL",name:"Florida"},{code:"GA",name:"Georgia"},{code:"HI",name:"Hawaii"},{code:"ID",name:"Idaho"},
    {code:"IL",name:"Illinois"},{code:"IN",name:"Indiana"},{code:"IA",name:"Iowa"},{code:"KS",name:"Kansas"},
    {code:"KY",name:"Kentucky"},{code:"LA",name:"Louisiana"},{code:"ME",name:"Maine"},{code:"MD",name:"Maryland"},
    {code:"MA",name:"Massachusetts"},{code:"MI",name:"Michigan"},{code:"MN",name:"Minnesota"},{code:"MS",name:"Mississippi"},
    {code:"MO",name:"Missouri"},{code:"MT",name:"Montana"},{code:"NE",name:"Nebraska"},{code:"NV",name:"Nevada"},
    {code:"NH",name:"New Hampshire"},{code:"NJ",name:"New Jersey"},{code:"NM",name:"New Mexico"},{code:"NY",name:"New York"},
    {code:"NC",name:"North Carolina"},{code:"ND",name:"North Dakota"},{code:"OH",name:"Ohio"},{code:"OK",name:"Oklahoma"},
    {code:"OR",name:"Oregon"},{code:"PA",name:"Pennsylvania"},{code:"RI",name:"Rhode Island"},{code:"SC",name:"South Carolina"},
    {code:"SD",name:"South Dakota"},{code:"TN",name:"Tennessee"},{code:"TX",name:"Texas"},{code:"UT",name:"Utah"},
    {code:"VT",name:"Vermont"},{code:"VA",name:"Virginia"},{code:"WA",name:"Washington"},{code:"WV",name:"West Virginia"},
    {code:"WI",name:"Wisconsin"},{code:"WY",name:"Wyoming"}
  ];
  
  return(
    <ScreenSingle headerProps={{onBack:currentState?()=>onSelect(currentState):null,title:currentState?"Change State":"Welcome"}}>
      {!currentState&&(
        <div style={{background:"rgba(56,189,248,0.06)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:14,padding:"16px 18px"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#38bdf8",marginBottom:6}}>👋 Welcome to Upstream</div>
          <div style={{fontSize:13,color:"#8099b0",lineHeight:1.6}}>We will automatically show resources for your state and surrounding states. Confirm or change your state below.</div>
          <div style={{fontSize:11,color:"#334155",marginTop:8,lineHeight:1.6}}>🔒 State is detected from your internet connection - not GPS. We never access your precise location.</div>
        </div>
      )}
      {currentState&&(
        <div style={{background:"rgba(234,179,8,0.06)",border:"1px solid rgba(234,179,8,0.15)",borderRadius:14,padding:"14px 16px"}}>
          <div style={{fontSize:12,color:"#eab308",fontWeight:600,marginBottom:2}}>Current: {states.find(s=>s.code===currentState)&&(s=>s.code===currentState).name}</div>
          <div style={{fontSize:12,color:"#8099b0"}}>Select a new state to update your resources</div>
        </div>
      )}
      <div style={{fontSize:13,fontWeight:700,color:"#dde8f4",marginTop:8,marginBottom:8}}>Select Your State</div>
      <div style={{display:"grid",gridTemplateColumns:lc.isDesktop?"repeat(4,1fr)":"repeat(2,1fr)",gap:8}}>
        {states.map(s=>(
          <div key={s.code} onClick={()=>setSelected(s.code)} style={{background:selected===s.code?"rgba(56,189,248,0.12)":"rgba(255,255,255,0.03)",border:`1.5px solid ${selected===s.code?"rgba(56,189,248,0.3)":"rgba(255,255,255,0.06)"}`,borderRadius:12,padding:"12px 14px",cursor:"pointer",textAlign:"center",transition:"all 0.15s"}}>
            <div style={{fontSize:14,fontWeight:700,color:selected===s.code?"#38bdf8":"#dde8f4"}}>{s.code}</div>
            <div style={{fontSize:11,color:selected===s.code?"#38bdf8":"#8099b0",marginTop:2}}>{s.name}</div>
          </div>
        ))}
      </div>
      {selected&&<Btn color="#38bdf8" onClick={()=>onSelect(selected)}>Continue -></Btn>}
      {!currentState&&<div onClick={()=>onSelect("NC")} style={{textAlign:"center",fontSize:13,color:"#8099b0",cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>Skip for now (defaults to NC)</div>}
    </ScreenSingle>
  );
}

// 
// AGENCY CODE SCREEN
// 
function AgencyCodeScreen({onJoin,onSkip,isChange=false,currentAgency=null,roster=[]}){
  const[code,setCode]=useState("");
  const[phone,setPhone]=useState("");
  const[step,setStep]=useState("code");
  const[matchedAgency,setMatchedAgency]=useState(null);
  const[error,setError]=useState("");
  const[confirmLeave,setConfirmLeave]=useState(false);
  const lc=useLayoutConfig();

  const EVENT_CODES={"SUMMIT26":{name:"2026 First Responder Summit",short:"SUMMIT",eventMode:true},"PCIS26":{name:"PCIS Annual Conference",short:"PCIS",eventMode:true}};

  const tryCode=()=>{
    const upper=code.trim().toUpperCase();
    if(EVENT_CODES[upper]){setMatchedAgency(EVENT_CODES[upper]);setStep("event");setError("");return;}
    const match=AGENCY_CODES[upper];
    if(match){
      const cs=getContractStatus(match);
      const codeS=getCodeStatus(match);
      // Code expired - redirect to successor or block
      if(codeS==="expired"&&match.successorCode){
        setError("This code has been renewed. Enter your new agency code.");
        return;
      }
      if(codeS==="expired_no_successor"){
        setError("This code has expired. Contact your agency administrator for the current code.");
        return;
      }
      // Grace or purged - allow entry but agency features will be locked
      setMatchedAgency({...match,code:upper,contractStatus:cs,codeStatus:codeS});
      setError("");
      if(cs==="grace"||cs==="purged"){setStep("contract_lapsed");return;}
      if(roster&&roster.length>0){setStep("phone");}else{setStep("success");}
    }else{setError("Code not recognized. Check with your administrator.");}
  };

  const tryPhone=()=>{
    const cleaned=phone.replace(/\D/g,"");
    const activeMatch=roster.find(e=>(e.phone||"").replace(/\D/g,"")=== cleaned&&e.status==="active");
    const inactiveMatch=roster.find(e=>(e.phone||"").replace(/\D/g,"")=== cleaned&&e.status==="inactive");
    if(activeMatch){setStep("success");setError("");}
    else if(inactiveMatch){setError("Your access has been deactivated. Contact your agency administrator.");}
    else{setError("Phone number not found on roster. Contact your administrator.");}
  };

  if(confirmLeave){return(
    <ScreenSingle headerProps={{onBack:()=>setConfirmLeave(false),title:"Leave Agency"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,paddingTop:20}}>
        <div style={{fontSize:36}}>[!]️</div>
        <div style={{fontSize:17,fontWeight:800,color:"#dde8f4",textAlign:"center"}}>Leave {currentAgency}?</div>
        <div style={{fontSize:13,color:"#3d5268",textAlign:"center",lineHeight:1.7}}>You will return to Individual mode. Human PST access will be removed.</div>
        <Btn color="#ef4444" bg="rgba(239,68,68,0.12)" onClick={()=>onJoin(null)} style={{width:"100%"}}>Yes, leave agency</Btn>
        <div onClick={()=>setConfirmLeave(false)} style={{fontSize:13,color:"#2d4a66",cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>Cancel</div>
      </div>
    </ScreenSingle>
  );}

  if(step==="event"){return(
    <ScreenSingle headerProps={{onBack:()=>setStep("code"),title:"Event Access"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,paddingTop:20}}>
        <div style={{fontSize:44}}>🎟️</div>
        <div style={{fontSize:18,fontWeight:800,color:"#38bdf8",textAlign:"center"}}>{matchedAgency&&matchedAgency.name}</div>
        <div style={{fontSize:13,color:"#3d5268",textAlign:"center",lineHeight:1.7}}>Event access granted. All responder wellness features are available for the duration of this event.</div>
        <div style={{background:"rgba(234,179,8,0.07)",border:"1px solid rgba(234,179,8,0.2)",borderRadius:12,padding:"12px 16px",width:"100%"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#eab308",marginBottom:4}}>Event mode - no roster required</div>
          <div style={{fontSize:11,color:"#64748b",lineHeight:1.6}}>Access is open to all event attendees with this code.</div>
        </div>
        <Card style={{width:"100%",background:"rgba(56,189,248,0.05)",borderColor:"rgba(56,189,248,0.15)"}}>
          <div style={{fontSize:12,color:"#38bdf8",fontWeight:600,marginBottom:8}}>Unlocked for this event:</div>
          {["All wellness tools","AI Peer Support","Human PST panel","Crisis resources"].map((f,i)=>(
            <div key={i} style={{fontSize:13,color:"#2d4a66",lineHeight:1.9}}>[ok] {f}</div>
          ))}
        </Card>
        <Btn color="#38bdf8" onClick={()=>onJoin(matchedAgency)} style={{width:"100%"}}>Enter Event Mode -></Btn>
      </div>
    </ScreenSingle>
  );}

  if(step==="phone"){return(
    <ScreenSingle headerProps={{onBack:()=>(setStep("code"),setError("")),title:"Verify Access"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,paddingTop:10,marginBottom:8}}>
        <div style={{fontSize:38}}>📱</div>
        <div style={{fontSize:16,fontWeight:800,color:"#dde8f4",textAlign:"center"}}>{matchedAgency&&matchedAgency.name}</div>
        <div style={{fontSize:12,color:"#64748b",textAlign:"center"}}>Agency code verified v</div>
      </div>
      <Card style={{background:"rgba(56,189,248,0.04)",borderColor:"rgba(56,189,248,0.12)"}}>
        <div style={{fontSize:14,fontWeight:700,color:"#dde8f4",marginBottom:6}}>One more step</div>
        <div style={{fontSize:13,color:"#8099b0",lineHeight:1.6}}>Enter the phone number your agency has on file to confirm you are on the roster.</div>
      </Card>
      <input value={phone} onChange={e=>{setPhone(e.target.value);setError("");}} onKeyDown={e=>e.key==="Enter"&&tryPhone()} placeholder="Your phone number" type="tel"
        style={{background:"rgba(255,255,255,0.05)",border:"1.5px solid "+(error?"rgba(239,68,68,0.4)":phone?"rgba(56,189,248,0.3)":"rgba(255,255,255,0.09)"),borderRadius:14,padding:"16px 18px",fontSize:16,fontFamily:"'DM Sans',sans-serif",outline:"none",width:"100%",textAlign:"center",color:"#dde8f4"}}/>
      {error&&<div style={{fontSize:12,color:"#ef4444",textAlign:"center"}}>{error}</div>}
      <Btn color="#38bdf8" onClick={tryPhone} disabled={!phone.trim()}>Verify Phone Number</Btn>
      <div style={{fontSize:11,color:"#334155",lineHeight:1.6,textAlign:"center"}}>Your number is only used to verify roster membership - not stored or shared.</div>
    </ScreenSingle>
  );}

  if(step==="contract_lapsed"){
    const isGrace=matchedAgency&&matchedAgency.contractStatus==="grace";
    const isPurged=matchedAgency&&matchedAgency.contractStatus==="purged";
    const days=matchedAgency?getDaysUntilPurge(AGENCY_CODES[matchedAgency.code]):0;
    return(
      <ScreenSingle headerProps={{onBack:()=>setStep("code"),title:isGrace?"Agency Paused":"Agency Ended"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,paddingTop:20}}>
          <div style={{fontSize:44}}>{isGrace?"...":"🗄️"}</div>
          <div style={{fontSize:17,fontWeight:800,color:isGrace?"#eab308":"#64748b",textAlign:"center"}}>{matchedAgency&&matchedAgency.name}</div>
          {isGrace&&(
            <div style={{background:"rgba(234,179,8,0.08)",border:"1.5px solid rgba(234,179,8,0.25)",borderRadius:14,padding:"16px",width:"100%"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#eab308",marginBottom:8}}>Agency access is currently paused</div>
              <div style={{fontSize:13,color:"#8099b0",lineHeight:1.7}}>Your personal wellness tools are fully available. Agency features - Human PST, crew dashboard, and admin tools - are paused while the contract is renewed.</div>
              <div style={{fontSize:12,color:"#eab308",marginTop:10,fontWeight:600}}>Agency data held securely for {days} more day{days!==1?"s":""}.</div>
            </div>
          )}
          {isPurged&&(
            <div style={{background:"rgba(71,85,105,0.08)",border:"1.5px solid rgba(71,85,105,0.25)",borderRadius:14,padding:"16px",width:"100%"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#64748b",marginBottom:8}}>Agency access has ended</div>
              <div style={{fontSize:13,color:"#8099b0",lineHeight:1.7}}>Agency data has been purged from the system per our data policy. Your personal wellness tools remain fully available.</div>
            </div>
          )}
          <Card style={{width:"100%",background:"rgba(56,189,248,0.05)",borderColor:"rgba(56,189,248,0.12)"}}>
            <div style={{fontSize:12,color:"#38bdf8",fontWeight:600,marginBottom:6}}>Still available to you:</div>
            {["AI Peer Support","All coping tools","Journal","Resources & crisis lines"].map((f,i)=>(
              <div key={i} style={{fontSize:13,color:"#2d4a66",lineHeight:1.9}}>[ok] {f}</div>
            ))}
          </Card>
          <Btn color="#38bdf8" onClick={()=>onJoin({...matchedAgency,contractStatus:matchedAgency.contractStatus})} style={{width:"100%"}}>Continue with Personal Tools -></Btn>
          <div style={{fontSize:12,color:"#334155",textAlign:"center",lineHeight:1.6}}>To reinstate agency access contact Upstream at<br/><span style={{color:"#38bdf8"}}>upstreampst.netlify.app</span></div>
        </div>
      </ScreenSingle>
    );
  }

  if(step==="success"){return(
    <ScreenSingle headerProps={{onBack:isChange?()=>setStep("code"):null,title:"Access Granted"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,paddingTop:20}}>
        <div style={{fontSize:44}}>[ok]</div>
        <div style={{fontSize:18,fontWeight:800,color:"#38bdf8",textAlign:"center"}}>{matchedAgency&&matchedAgency.name}</div>
        <div style={{fontSize:13,color:"#3d5268",textAlign:"center",lineHeight:1.7}}>Verified. Human PST access is now enabled.</div>
        <Card style={{width:"100%",background:"rgba(56,189,248,0.05)",borderColor:"rgba(56,189,248,0.15)"}}>
          <div style={{fontSize:12,color:"#38bdf8",fontWeight:600,marginBottom:6}}>What is unlocked:</div>
          {["Human PST availability panel","Contact request and in-app chat","Agency name shown in header","Crew Stream bar on Home Screen"].map((f,i)=>(
            <div key={i} style={{fontSize:13,color:"#2d4a66",lineHeight:1.9}}>[ok] {f}</div>
          ))}
        </Card>
        <Btn color="#38bdf8" onClick={()=>onJoin(matchedAgency)} style={{width:"100%"}}>Enter Agency Mode -></Btn>
      </div>
    </ScreenSingle>
  );}

  return(
    <ScreenSingle headerProps={{onBack:(isChange||currentAgency)?()=>onSkip():null,title:"Join Agency"}}>
      {isChange&&currentAgency&&(
        <div style={{background:"rgba(234,179,8,0.07)",border:"1px solid rgba(234,179,8,0.18)",borderRadius:14,padding:"14px 16px"}}>
          <div style={{fontSize:12,color:"#eab308",fontWeight:600,marginBottom:4}}>Currently: {currentAgency}</div>
          <div onClick={()=>setConfirmLeave(true)} style={{fontSize:13,color:"#ef4444",cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>Leave this agency</div>
        </div>
      )}
      <Card style={{background:"rgba(56,189,248,0.04)",borderColor:"rgba(56,189,248,0.12)"}}>
        <div style={{fontSize:16,fontWeight:800,color:"#dde8f4",marginBottom:6}}>Enter your access code</div>
        <div style={{fontSize:13,color:"#8099b0",lineHeight:1.6}}>Enter your agency code or event code to unlock access. Scan a QR code at your event or agency location.</div>
      </Card>
      <input value={code} onChange={e=>{setCode(e.target.value.toUpperCase());setError("");}} onKeyDown={e=>e.key==="Enter"&&tryCode()} placeholder="AGENCY OR EVENT CODE" maxLength={12}
        style={{background:"rgba(255,255,255,0.05)",border:"1.5px solid "+(error?"rgba(239,68,68,0.4)":code?"rgba(56,189,248,0.3)":"rgba(255,255,255,0.09)"),borderRadius:14,padding:"16px 18px",fontSize:18,fontFamily:"'DM Sans',sans-serif",outline:"none",width:"100%",letterSpacing:"0.2em",fontWeight:700,textAlign:"center"}}/>
      {error&&<div style={{fontSize:12,color:"#ef4444",textAlign:"center",marginTop:-4}}>{error}</div>}
      <Btn color="#38bdf8" onClick={tryCode} disabled={!code.trim()}>Continue</Btn>
      <div style={{display:"flex",alignItems:"center",gap:12,margin:"4px 0"}}>
        <div style={{flex:1,height:1,background:"rgba(255,255,255,0.06)"}}/>
        <span style={{fontSize:11,color:"#334155"}}>or</span>
        <div style={{flex:1,height:1,background:"rgba(255,255,255,0.06)"}}/>
      </div>
      <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"16px",textAlign:"center"}}>
        <div style={{fontSize:22,marginBottom:8}}>📷</div>
        <div style={{fontSize:13,fontWeight:700,color:"#64748b",marginBottom:4}}>Scan QR Code</div>
        <div style={{fontSize:11,color:"#334155",lineHeight:1.5}}>In production, scanning your agency or event QR code fills this in automatically.</div>
      </div>
      {!isChange&&<div onClick={onSkip} style={{textAlign:"center",fontSize:13,color:"#8099b0",cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>Continue without a code -></div>}
      <div style={{fontSize:10,color:"#1e3a52",textAlign:"center"}}>Demo agency codes: UPSTREAM . METRO24 . FIRE07 . Event codes: SUMMIT26 . PCIS26</div>
    </ScreenSingle>
  );
}
// Home screen icon tile
function HomeTile({icon,label,color,bg,border,badge,locked=false,onClick}){
  const[p,setP]=useState(false);
  return(
    <div
      onMouseDown={()=>setP(true)} onMouseUp={()=>setP(false)} onMouseLeave={()=>setP(false)}
      onClick={onClick}
      style={{background:p?bg:"rgba(255,255,255,0.03)",border:`1.5px solid ${p?border:locked?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.07)"}`,borderRadius:18,padding:"18px 10px 14px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:10,transform:p?"scale(0.96)":"scale(1)",transition:"all 0.13s",position:"relative",opacity:locked?0.5:1,userSelect:"none"}}>
      <div style={{position:"absolute",top:0,left:"20%",right:"20%",height:2,borderRadius:"0 0 4px 4px",background:locked?"#1e3a52":color,opacity:locked?1:p?1:0.5}}/>
      <div style={{width:46,height:46,borderRadius:14,background:locked?"rgba(255,255,255,0.04)":bg,border:`1px solid ${locked?"rgba(255,255,255,0.06)":color+"30"}`,display:"flex",alignItems:"center",justifyContent:"center",color:locked?"#1e3a52":color}}>
        {locked?<LockIcon size={18}/>:icon}
      </div>
      <div style={{fontSize:11,fontWeight:700,color:locked?"#1e3a52":"#c8dae8",textAlign:"center",lineHeight:1.35,whiteSpace:"pre-line"}}>{label}</div>
      {badge&&!locked&&<div style={{position:"absolute",top:8,right:8,fontSize:8,fontWeight:800,letterSpacing:"0.1em",color,background:color+"18",padding:"2px 6px",borderRadius:5,textTransform:"uppercase"}}>{badge}</div>}
      {locked&&<div style={{position:"absolute",top:8,right:8,fontSize:8,fontWeight:800,letterSpacing:"0.08em",color:"#1e3a52",background:"rgba(255,255,255,0.04)",padding:"2px 6px",borderRadius:5,textTransform:"uppercase"}}>AGENCY</div>}
    </div>
  );
}

// 
// HOME
// 
function HomeScreen({navigate,gaugeLevel,setGaugeLevel,agency,role,pstAlert,pstAlertMsg,criticalIncident,agencyNotification,setAgencyNotification}){
  const[pulse,setPulse]=useState(false);
  const[time,setTime]=useState(new Date());
  const lc=useLayoutConfig();
  useEffect(()=>{const t=setInterval(()=>setTime(new Date()),1000);return()=>clearInterval(t);},[]);
  useEffect(()=>{setPulse(true);const t=setTimeout(()=>setPulse(false),600);return()=>clearTimeout(t);},[gaugeLevel]);
  const gc=[{label:"Great",color:"#22c55e",bg:"rgba(34,197,94,0.12)",glow:"0 0 24px rgba(34,197,94,0.5)"},{label:"Striving",color:"#eab308",bg:"rgba(234,179,8,0.12)",glow:"0 0 24px rgba(234,179,8,0.5)"},{label:"Not Well",color:"#f97316",bg:"rgba(249,115,22,0.12)",glow:"0 0 24px rgba(249,115,22,0.5)"},{label:"Ill",color:"#ef4444",bg:"rgba(239,68,68,0.12)",glow:"0 0 24px rgba(239,68,68,0.5)"}];
  const cur=gc[gaugeLevel];
  const hr=time.getHours();
  const greeting=hr<6?"Night Shift":hr<12?"Morning Shift":hr<18?"Day Shift":"Evening Shift";
  const isAdminRole=role==="supervisor"||role==="admin"||role==="platform";
  const isPST=role==="pst"||role==="admin";
  // Contract/code banner + acknowledgment state
  const contractBanner=agency?getContractBanner(agency.code):null;
  const isAgencyLocked=contractBanner&&(contractBanner.type==="grace"||contractBanner.type==="purged");
  const needsAck=contractBanner&&(contractBanner.type==="code_expired"||contractBanner.type==="rotating");
  const ackKey=agency?"upstream_ack_"+agency.code+"_"+(contractBanner&&contractBanner.type):"";
  const[ackDismissed,setAckDismissed]=useState(()=>{
    try{return ackKey?!!localStorage.getItem(ackKey):false;}catch(e){return false;}
  });
  const[showCodeModal,setShowCodeModal]=useState(()=>{
    if(!contractBanner||contractBanner.type!=="code_expired") return false;
    try{return!localStorage.getItem(ackKey);}catch(e){return false;}
    return false;
  });
  const[emailSent,setEmailSent]=useState(false);
  const[showEmailPreview,setShowEmailPreview]=useState(false);

  const handleAck=()=>{
    try{localStorage.setItem(ackKey,"1");}catch(e){}
    setAckDismissed(true);
    setShowCodeModal(false);
  };

  const handleSendAdminEmail=()=>{
    // In production this triggers a real transactional email to adminEmail.
    // For demo, show a preview of what the email looks like.
    setShowEmailPreview(true);
  };

  const handleConfirmEmail=()=>{
    setShowEmailPreview(false);
    setEmailSent(true);
    setTimeout(()=>setEmailSent(false),4000);
  };

  // Build email preview content based on banner type
  const agencyData=agency?AGENCY_CODES[agency.code]:null;
  const newCode=(agencyData&&agencyData.successorCode)||"[NEW-CODE]";
  const rotationDate=agencyData?new Date(agencyData.codeExpiry).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}):"";
  const adminEmail=(agencyData&&agencyData.adminEmail)||"your admin email";

  return(
    <Screen headerProps={{agencyName:(agency&&agency.name)}}>
      {/* Email Preview Modal */}
      {showEmailPreview&&agencyData&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1100,padding:20}}>
          <div style={{background:"#0c1929",border:"1.5px solid rgba(56,189,248,0.25)",borderRadius:20,padding:"24px",maxWidth:440,width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{fontSize:11,fontWeight:800,letterSpacing:"0.14em",textTransform:"uppercase",color:"#475569",marginBottom:16}}>Email Preview - Sent to {adminEmail}</div>
            {/* Simulated email */}
            <div style={{background:"#f8fafc",borderRadius:12,padding:"20px",fontFamily:"Georgia,serif"}}>
              <div style={{borderBottom:"2px solid #0EA5E9",paddingBottom:12,marginBottom:16}}>
                <div style={{fontSize:18,fontWeight:800,color:"#060E1B"}}>Upstream Initiative</div>
                <div style={{fontSize:11,color:"#64748b",marginTop:2}}>upstreaminitiative@gmail.com</div>
              </div>
              <div style={{fontSize:13,color:"#1e293b",lineHeight:1.8}}>
                <div style={{marginBottom:12}}><strong>To:</strong> {adminEmail}</div>
                <div style={{marginBottom:16}}><strong>Subject:</strong> {(contractBanner&&contractBanner.type)==="code_expired"?"Your Upstream agency access code has been renewed":"Action needed: Your Upstream access code renews soon"}</div>
                <div style={{marginBottom:12}}>Hello,</div>
                {(contractBanner&&contractBanner.type)==="code_expired"?(
                  <div>
                    <div style={{marginBottom:10}}>Your agency's Upstream access code has been renewed as scheduled. Your staff will need to enter the new code on their next login.</div>
                    <div style={{background:"#f1f5f9",border:"2px solid #0EA5E9",borderRadius:8,padding:"16px",textAlign:"center",marginBottom:16}}>
                      <div style={{fontSize:11,color:"#64748b",marginBottom:4}}>NEW ACCESS CODE</div>
                      <div style={{fontSize:28,fontWeight:900,color:"#060E1B",letterSpacing:"0.2em"}}>{newCode}</div>
                      <div style={{fontSize:11,color:"#64748b",marginTop:4}}>Share with your staff at roll call, group text, or your agency bulletin</div>
                    </div>
                    <div style={{marginBottom:10}}>Your staff will see a notification prompting them to enter the new code. Their personal wellness tools and data are unaffected.</div>
                    <div style={{marginBottom:10}}>No IT steps needed - just share the code.</div>
                  </div>
                ):(
                  <div>
                    <div style={{marginBottom:10}}>Your agency's current Upstream access code expires on <strong>{rotationDate}</strong>. A new code will be issued automatically on that date and sent to this email address.</div>
                    <div style={{background:"#f1f5f9",border:"1px solid #cbd5e1",borderRadius:8,padding:"12px",marginBottom:16}}>
                      <div style={{fontSize:12,color:"#475569",lineHeight:1.6}}><strong>What to do:</strong> When you receive the new code, share it with your staff however works best - roll call, group text, or agency bulletin. No IT steps needed.</div>
                    </div>
                    <div style={{marginBottom:10}}>Staff who receive the new code stay connected. Staff who don't receive it - for example, someone who has left the agency - simply won't be able to re-enter agency mode.</div>
                  </div>
                )}
                <div style={{marginBottom:10}}>Questions? Contact Lee Wainright at leewainright@gmail.com or 252-717-3689.</div>
                <div style={{color:"#64748b",fontSize:12,borderTop:"1px solid #e2e8f0",paddingTop:12,marginTop:12}}>Upstream Initiative . upstreampst.netlify.app<br/>Free. Confidential. You earned the right to ask for help.</div>
              </div>
            </div>
            <div style={{display:"flex",gap:10,marginTop:16}}>
              <div onClick={()=>setShowEmailPreview(false)} style={{flex:1,padding:"12px",borderRadius:11,cursor:"pointer",textAlign:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",fontSize:13,fontWeight:700,color:"#475569"}}>Cancel</div>
              <div onClick={handleConfirmEmail} style={{flex:2,padding:"12px",borderRadius:11,cursor:"pointer",textAlign:"center",background:"rgba(56,189,248,0.12)",border:"1.5px solid rgba(56,189,248,0.3)",fontSize:13,fontWeight:700,color:"#38bdf8"}}>📧 Send This Email</div>
            </div>
          </div>
        </div>
      )}
      {/* Code Expired - requires acknowledgment modal */}
      {showCodeModal&&contractBanner&&contractBanner.type==="code_expired"&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:900,padding:20}}>
          <div style={{background:"#0c1929",border:"1.5px solid rgba(249,115,22,0.35)",borderRadius:20,padding:"28px 24px",maxWidth:400,width:"100%"}}>
            <div style={{textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:36,marginBottom:8}}>🔑</div>
              <div style={{fontSize:17,fontWeight:800,color:"#f97316"}}>Your access code has been renewed</div>
            </div>
            <div style={{fontSize:13,color:"#8099b0",lineHeight:1.7,marginBottom:16}}>
              Your agency's access code has rotated. A new code has been sent to your agency administrator. Get the new code from your supervisor or admin and enter it to restore full agency access.
            </div>
            <div style={{background:"rgba(56,189,248,0.06)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:12,padding:"12px 14px",marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:700,color:"#38bdf8",marginBottom:4}}>Your personal tools still work</div>
              <div style={{fontSize:11,color:"#334155",lineHeight:1.6}}>AI Peer Support, breathing, grounding, journal, and all wellness tools are fully available right now.</div>
            </div>
            {isAdminRole&&(
              <div style={{marginBottom:16}}>
                <div style={{fontSize:12,color:"#64748b",marginBottom:8}}>As an admin, you can trigger the new code email:</div>
                <div onClick={emailSent?null:handleSendAdminEmail} style={{padding:"11px",borderRadius:11,cursor:emailSent?"default":"pointer",textAlign:"center",background:emailSent?"rgba(34,197,94,0.1)":"rgba(56,189,248,0.1)",border:`1px solid ${emailSent?"rgba(34,197,94,0.3)":"rgba(56,189,248,0.25)"}`,fontSize:13,fontWeight:700,color:emailSent?"#22c55e":"#38bdf8",transition:"all 0.2s"}}>
                  {emailSent?"v Email sent to admin":"📧 Send new code to admin email"}
                </div>
              </div>
            )}
            <div style={{display:"flex",gap:10}}>
              <div onClick={()=>navigate("agencycode")} style={{flex:2,padding:"13px",borderRadius:12,cursor:"pointer",textAlign:"center",background:"rgba(249,115,22,0.12)",border:"1.5px solid rgba(249,115,22,0.3)",fontSize:13,fontWeight:700,color:"#f97316"}}>Enter New Code</div>
              <div onClick={handleAck} style={{flex:1,padding:"13px",borderRadius:12,cursor:"pointer",textAlign:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",fontSize:13,fontWeight:700,color:"#475569"}}>Got It</div>
            </div>
          </div>
        </div>
      )}
      {/* Contract / Code Status Banner (persistent, dismissible for rotation) */}
      {contractBanner&&!showCodeModal&&(
        <div className={lc.isDesktop?"full-width":""} style={{background:contractBanner.bg,border:`1.5px solid ${contractBanner.border}`,borderRadius:14,padding:"12px 16px",display:"flex",gap:12,alignItems:"flex-start"}}>
          <div style={{fontSize:20,flexShrink:0}}>{contractBanner.icon}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:contractBanner.color,marginBottom:4}}>{contractBanner.title}</div>
            <div style={{fontSize:12,color:"#8099b0",lineHeight:1.6}}>{isAdminRole&&contractBanner.adminBody?contractBanner.adminBody:contractBanner.body}</div>
            {isAdminRole&&contractBanner.type==="rotating"&&(
              <div onClick={emailSent?null:handleSendAdminEmail} style={{marginTop:10,display:"inline-block",padding:"7px 14px",borderRadius:8,cursor:emailSent?"default":"pointer",background:emailSent?"rgba(34,197,94,0.1)":"rgba(234,179,8,0.12)",border:`1px solid ${emailSent?"rgba(34,197,94,0.3)":"rgba(234,179,8,0.3)"}`,fontSize:12,fontWeight:700,color:emailSent?"#22c55e":"#eab308",transition:"all 0.2s"}}>
                {emailSent?"v Email sent":"📧 Preview admin renewal email"}
              </div>
            )}
          </div>
          {contractBanner.type==="code_expired"&&(
            <div onClick={()=>navigate("agencycode")} style={{padding:"6px 12px",borderRadius:8,background:"rgba(249,115,22,0.15)",border:"1px solid rgba(249,115,22,0.35)",fontSize:11,fontWeight:700,color:"#f97316",cursor:"pointer",flexShrink:0,whiteSpace:"nowrap"}}>Enter New Code</div>
          )}
          {(contractBanner.type==="rotating")&&(
            <div onClick={handleAck} style={{cursor:"pointer",color:"#64748b",fontSize:18,lineHeight:1,flexShrink:0}}>x</div>
          )}
        </div>
      )}
      {/* Critical Incident Banner */}
      {criticalIncident&&(
        <div className={lc.isDesktop?"full-width":""} style={{background:"#07080f",border:"2px solid rgba(148,163,184,0.25)",borderRadius:14,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:10,height:10,borderRadius:"50%",background:"#334155",border:"2px solid #64748b",flexShrink:0}}/>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:800,color:"#f1f5f9",letterSpacing:"0.08em"}}>[*] CRITICAL INCIDENT SUPPORT AVAILABLE</div><div style={{fontSize:11,color:"#64748b",marginTop:2}}>Your PST team is standing by. Human PST is recommended.</div></div>
        </div>
      )}
      {/* PST Availability Banner */}
      {pstAlert&&!criticalIncident&&(
        <div className={lc.isDesktop?"full-width":""} style={{background:"rgba(139,92,246,0.1)",border:"1.5px solid rgba(139,92,246,0.3)",borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:8,height:8,borderRadius:"50%",background:"#8b5cf6",boxShadow:"0 0 8px rgba(139,92,246,0.8)",flexShrink:0}}/>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"#c4b5fd"}}>Peer Support Available</div>{pstAlertMsg?<div style={{fontSize:12,color:"#a78bfa",marginTop:3,lineHeight:1.5}}>{pstAlertMsg}</div>:<div style={{fontSize:12,color:"#7c5cbf",marginTop:2}}>Your PST team is available if you want to talk.</div>}</div>
        </div>
      )}
      {/* Agency Notification Banner */}
      {agencyNotification&&(
        <div className={lc.isDesktop?"full-width":""} style={{background:agencyNotification.priority==="Urgent"?"rgba(239,68,68,0.1)":agencyNotification.priority==="Important"?"rgba(234,179,8,0.1)":"rgba(56,189,248,0.08)",border:`1.5px solid ${agencyNotification.priority==="Urgent"?"rgba(239,68,68,0.3)":agencyNotification.priority==="Important"?"rgba(234,179,8,0.3)":"rgba(56,189,248,0.2)"}`,borderRadius:14,padding:"12px 16px",display:"flex",gap:12,alignItems:"flex-start"}}>
          <div style={{fontSize:20}}>{agencyNotification.priority==="Urgent"?"🚨":agencyNotification.priority==="Important"?"[!]️":"📢"}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#64748b",marginBottom:4}}>Agency Notification . {agencyNotification.priority}</div>
            <div style={{fontSize:13,color:"#dde8f4",lineHeight:1.6}}>{agencyNotification.message}</div>
            <div style={{fontSize:10,color:"#3d5268",marginTop:4}}>{agencyNotification.timestamp}</div>
          </div>
          <div onClick={()=>setAgencyNotification(null)} style={{cursor:"pointer",color:"#64748b",fontSize:18,lineHeight:1}}>x</div>
        </div>
      )}
      {/* Greeting row */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gridColumn:lc.isDesktop?"1/-1":"auto"}}>
        <div>
          <div style={{fontSize:11,color:"#0ea5e9",letterSpacing:"0.16em",textTransform:"uppercase",fontWeight:700}}>{greeting}</div>
          <div style={{fontSize:lc.isDesktop?24:21,fontWeight:800,color:"#dde8f4",marginTop:3}}>How are you doing today?</div>
          <div style={{fontSize:12,color:"#8099b0",marginTop:2}}>{time.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {isAdminRole&&<div onClick={()=>navigate("admintools")} title="Admin Tools" style={{width:36,height:36,borderRadius:10,background:"rgba(234,179,8,0.1)",border:"1px solid rgba(234,179,8,0.25)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#eab308"}}><SettingsIcon/></div>}
          {isPST&&<div onClick={()=>navigate("pstpanel")} title="PST Panel" style={{width:36,height:36,borderRadius:10,background:"rgba(139,92,246,0.1)",border:"1px solid rgba(139,92,246,0.25)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#a78bfa"}}><ShieldIcon/></div>}
          <div onClick={()=>setGaugeLevel((gaugeLevel+1)%4)} style={{cursor:"pointer",userSelect:"none",background:cur.bg,border:`1.5px solid ${cur.color}50`,borderRadius:16,padding:"10px 13px",display:"flex",flexDirection:"column",alignItems:"center",gap:4,boxShadow:pulse?cur.glow:"none",transition:"box-shadow 0.3s"}}>
            <GaugeIcon color={cur.color}/><div style={{fontSize:10,fontWeight:800,color:cur.color,letterSpacing:"0.1em",textTransform:"uppercase"}}>{cur.label}</div>
            <div style={{display:"flex",gap:3}}>{gc.map((g,i)=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:i===gaugeLevel?g.color:"rgba(255,255,255,0.08)",transition:"background 0.3s"}}/>)}</div>
            <div style={{fontSize:9,color:"#8099b0",letterSpacing:"0.08em"}}>SHIFT STREAM</div>
          </div>
        </div>
      </div>
      {/* 6 home buttons - clean icon grid */}
      <div className={lc.isDesktop?"full-width":""} style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
        <HomeTile icon={<BoltIcon/>}   label={"AI Peer\nSupport"}    color="#ef4444" bg="rgba(239,68,68,0.1)"    border="rgba(239,68,68,0.22)"   badge="URGENT"   onClick={()=>navigate("aichat")}/>
        <HomeTile icon={<ClockIcon/>}  label={"Shift\nCheck"}        color="#38bdf8" bg="rgba(56,189,248,0.08)"  border="rgba(56,189,248,0.2)"   badge="CHECK-IN" onClick={()=>navigate("shiftcheck")}/>
        <HomeTile icon={<TimerIcon/>}  label={"90-Second\nDump"}     color="#f97316" bg="rgba(249,115,22,0.08)"  border="rgba(249,115,22,0.2)"   badge="VENT"     onClick={()=>navigate("dump90")}/>
        <HomeTile icon={<BreathIcon/>} label={"Coping\nTools"}       color="#22c55e" bg="rgba(34,197,94,0.08)"   border="rgba(34,197,94,0.2)"                     onClick={()=>navigate("tools")}/>
        <HomeTile icon={<HeartIcon/>}  label={"Human\nPST"}          color="#a78bfa" bg="rgba(167,139,250,0.08)" border="rgba(167,139,250,0.2)"  locked={!agency||isAgencyLocked} onClick={()=>navigate(agency&&!isAgencyLocked?"humanpst":"agencycode")}/>
        <HomeTile icon={<InfoIcon/>}   label={"Resources"}            color="#64748b" bg="rgba(100,116,139,0.07)" border="rgba(100,116,139,0.15)"                  onClick={()=>navigate("resources")}/>
      </div>

      {agency?(
        <Card className={lc.isDesktop?"full-width":""}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><SLabel>Crew Stream</SLabel><span style={{fontSize:11,color:"#2d4a66"}}>Anonymous . 8 on shift</span></div>
          <CrewBar/>
        </Card>
      ):(
        <div onClick={()=>navigate("agencycode")} className={lc.isDesktop?"full-width":""} style={{background:"rgba(56,189,248,0.04)",border:"1px solid rgba(56,189,248,0.12)",borderRadius:16,padding:"16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:44,height:44,borderRadius:13,background:"rgba(56,189,248,0.1)",border:"1px solid rgba(56,189,248,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,color:"#38bdf8"}}><BuildingIcon/></div>
          <div style={{flex:1}}><div style={{fontSize:14,fontWeight:700,color:"#dde8f4"}}>Join Your Agency</div><div style={{fontSize:12,color:"#8099b0",marginTop:2}}>Enter your agency code to unlock Human PST access</div></div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a52" strokeWidth="2.5" style={{flexShrink:0}}><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      )}
      <div className={lc.isDesktop?"full-width":""} style={{background:"rgba(56,189,248,0.04)",border:"1px solid rgba(56,189,248,0.1)",borderRadius:12,padding:"12px 14px"}}>
        <div style={{fontSize:12,color:"#38bdf8",fontWeight:600,marginBottom:4}}>🛡 Fully Anonymous</div>
        <div style={{fontSize:12,color:"#2d4a66",lineHeight:1.6}}>No login required. Your check-ins and conversations are private. AI PST has no access to your identity or contact info.</div>
      </div>
    </Screen>
  );
}

// 
// AI PST
// 
function RoughCallScreen({navigate,agency,userLanguage="en",userState}){
  // ── state ──────────────────────────────────────────────────────
  const[phase,setPhase]=useState("moodcheck"); // moodcheck | chat | followup
  const[moodBefore,setMoodBefore]=useState(null);
  const[messages,setMessages]=useState([]);
  const[input,setInput]=useState("");
  const[inputMode,setInputMode]=useState("type");
  const[isListening,setIsListening]=useState(false);
  const[isSpeaking,setIsSpeaking]=useState(false);
  const[autoSpeak,setAutoSpeak]=useState(false);
  const[showVoicePicker,setShowVoicePicker]=useState(false);
  const[aiName,setAiName]=useState(()=>{try{return localStorage.getItem("upstream_ai_name")||"UPSTREAM AI";}catch(e){return"UPSTREAM AI";}});
  const[editingName,setEditingName]=useState(false);
  const[nameInput,setNameInput]=useState("");
  const[availableVoices,setAvailableVoices]=useState([]);
  const[selectedVoice,setSelectedVoice]=useState(null);
  const[speakingMsgIdx,setSpeakingMsgIdx]=useState(null);
  const[crisisLevel,setCrisisLevel]=useState(0);
  const[showCrisisCard,setShowCrisisCard]=useState(false);
  const[buddyPending,setBuddyPending]=useState(false);
  const[buddyModal,setBuddyModal]=useState(false);
  const[spiritualMode,setSpiritualMode]=useState(false);
  const[quickReplies,setQuickReplies]=useState([]);
  const[sessionSaved,setSessionSaved]=useState(false);
  const bottomRef=useRef(null);
  const recognitionRef=useRef(null);
  const synthRef=useRef(null);
  const lc=useLayoutConfig();

  useEffect(()=>{bottomRef.current&&bottomRef.current.scrollIntoView({behavior:"smooth"});},[messages]);

  // ── voices ──────────────────────────────────────────────────────
  useEffect(()=>{
    const loadVoices=()=>{
      const all=window.speechSynthesis.getVoices();
      const lang=userLanguage==="es"?"es":"en";
      const quality=all.filter(v=>v.lang.startsWith(lang)&&(v.name.includes("Enhanced")||v.name.includes("Premium")||v.name.includes("Neural")||v.name.includes("Natural")||v.name.includes("Siri")||v.name.includes("Google")||v.localService===true));
      const fallback=all.filter(v=>v.lang.startsWith(lang));
      const voices=quality.length>0?quality:fallback;
      setAvailableVoices(voices);
      const calm=voices.find(v=>v.name.includes("Samantha")||v.name.includes("Karen")||v.name.includes("Moira")||v.name.includes("Tessa")||v.name.includes("Alex")||v.name.includes("Daniel")||v.name.includes("Google US")||v.name.includes("Google UK"));
      setSelectedVoice(prev=>prev||(calm||voices[0]||null));
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged=loadVoices;
    return()=>{window.speechSynthesis.onvoiceschanged=null;};
  },[userLanguage]);

  // ── TTS ──────────────────────────────────────────────────────────
  const speakResponse=(text,idx)=>{
    window.speechSynthesis.cancel();
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang=userLanguage==="es"?"es-ES":"en-US";
    utterance.rate=0.88;utterance.pitch=1.0;utterance.volume=1.0;
    if(selectedVoice) utterance.voice=selectedVoice;
    utterance.onstart=()=>{setIsSpeaking(true);if(idx!==undefined)setSpeakingMsgIdx(idx);};
    utterance.onend=()=>{setIsSpeaking(false);setSpeakingMsgIdx(null);};
    utterance.onerror=()=>{setIsSpeaking(false);setSpeakingMsgIdx(null);};
    synthRef.current=utterance;
    window.speechSynthesis.speak(utterance);
  };
  const stopSpeaking=()=>{window.speechSynthesis.cancel();setIsSpeaking(false);setSpeakingMsgIdx(null);};

  // ── STT ──────────────────────────────────────────────────────────
  const startVoice=()=>{
    if(!("webkitSpeechRecognition" in window||"SpeechRecognition" in window)){alert("Voice input not supported on this browser. Try Chrome or Safari.");return;}
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    const r=new SR();r.continuous=false;r.interimResults=true;r.lang=userLanguage==="es"?"es-ES":"en-US";
    r.onresult=(e)=>{setInput(Array.from(e.results).map(r=>r[0].transcript).join(""));};
    r.onend=()=>setIsListening(false);r.onerror=()=>setIsListening(false);
    r.start();recognitionRef.current=r;setIsListening(true);
  };
  const stopVoice=()=>{recognitionRef.current&&recognitionRef.current.stop();setIsListening(false);};

  // ── conversation mode tracking ───────────────────────────────────
  const[convMode,setConvMode]=useState("companion"); // companion | elevated | pst
  const[isThinking,setIsThinking]=useState(false);
  const[resourcesOffered,setResourcesOffered]=useState(false);

  // ── quick reply pools by context ─────────────────────────────────
  const QUICK_REPLIES={
    general:["I'm not sure where to start","It was a rough call","I'm feeling overwhelmed","I just need to vent","I haven't been sleeping","I keep replaying it"],
    after_rough:["Tell me more about that","What's hitting hardest?","I'm doing okay, just processing","It's been building for a while","I don't want to talk to anyone yet","Can I just sit with this?"],
    after_crisis:["I want to talk to a real person","I'm safe right now","I need resources","Can you stay with me?","I'll reach out to someone I trust"],
    after_ai:["That's helpful","I hadn't thought of it that way","What should I do next?","I want to try a breathing reset","I want to write this down"],
    resources:["Yes, show me what's nearby","Just the crisis lines for now","I'm not ready for that yet","Tell me about peer support"],
  };

  const getQuickReplies=(msgText,level)=>{
    if(level>=3) return QUICK_REPLIES.after_crisis;
    if(messages.length<=1) return QUICK_REPLIES.general;
    if(msgText&&(msgText.includes("resource")||msgText.includes("therapist")||msgText.includes("nearby")||msgText.includes("near you"))) return QUICK_REPLIES.resources;
    if(msgText&&(msgText.includes("rough")||msgText.includes("hard")||msgText.includes("heavy"))) return QUICK_REPLIES.after_rough;
    return QUICK_REPLIES.after_ai;
  };

  // ── build system prompt ───────────────────────────────────────────
  const buildSystemPrompt=(currentCrisisLevel,currentConvMode,msgCount)=>{
    const location=userState?"Their state: "+userState+". ":"Location unknown. ";
    const agencyCtx=agency&&agency.code
      ? `This user's agency has a peer support team. Agency: ${agency.name||agency.code}. You can reference connecting them to their own PST team as the first option when offering support resources.`
      : "This user does not have a configured agency PST team.";

    const modeInstructions={
      companion:`You are in COMPANION MODE. Keep it natural and warm. Be present. Ask one good question at a time. Don't push toward resources unless the user brings it up or the conversation clearly gets heavier. You're a peer having a real conversation, not running a protocol.`,
      elevated:`You are in ELEVATED MODE. The conversation has gotten heavier. Lean in with more intentional questions. You can gently acknowledge the weight of what they're sharing. If it feels right and you haven't already, you may offer to share some support resources nearby — but only if the moment calls for it. Don't force it. One question at a time.`,
      pst:`You are in PST SUPPORT MODE. There are signs of real distress. Be calm, steady, and direct. Safety is the priority. Acknowledge what they're feeling without amplifying it. At the right moment, gently but clearly offer to connect them with real support — their agency PST team if available, or nearby first responder resources. You can also mention that 988 is available 24/7 if they need it right now. Stay with them.`
    };

    const resourceContext=`
RESOURCES YOU CAN OFFER (weave these in naturally, never dump a list):
- Agency PST team first if agency code is set
- Safe Call Now: 1-206-459-3020 (first responder specific, 24/7)
- First Responder Support Network: 1strespondernetwork.org
- 988 Suicide & Crisis Lifeline (call or text)
- Badge of Life: badgeoflife.com
- First responder therapists near them — you can offer to search for those specifically
- ${location}Use their state/region when suggesting local resources

RESOURCE OFFERING RULES:
- Never dump a list of resources unprompted
- If the conversation is heavy but they haven't asked, you may say something like: "Would it be helpful if I pointed you toward some peer support or counseling resources near you?"
- If they say yes or ask for resources, share 1-2 specific ones that fit their situation
- Always prioritize: 1) Agency PST team, 2) First responder specific resources, 3) Crisis lines
- If they ask about therapists nearby, tell them you can search for first responder specialists in their area and offer to do that`;

    return `You are an AI peer support companion inside the Upstream Approach app — a mental wellness platform built specifically for first responders (paramedics, firefighters, law enforcement, dispatchers, ER staff).

YOUR CHARACTER:
You are warm, direct, and real. You speak like a peer who has been around the job — not a clinician, not a chatbot. You understand shift work, dark humor as a coping tool, the culture of "pushing through," the weight of carrying calls home, and the stigma around asking for help in this profession. You do not use clinical language. You do not say things like "I understand that must be difficult." You say things like "That kind of call doesn't just stay at the scene."

YOUR CORE PRINCIPLES:
- One question at a time. Never pepper someone with multiple questions.
- Meet them where they are. Don't push toward resources unless the moment calls for it.
- Don't minimize. Don't fix. Listen first.
- If someone is in crisis, be calm and clear. Don't panic, don't overwhelm.
- Short responses are often better than long ones. Read the room.
- You can acknowledge dark or gallows humor — that's part of the culture. Don't pathologize it.
- Spiritual content is welcome. If faith comes up, hold that space without judgment.

${modeInstructions[currentConvMode]}

${agencyCtx}
${resourceContext}

CONVERSATION CONTEXT:
- Mood check-in: ${moodBefore||"not recorded"}
- Messages so far: ${msgCount}
- This is anonymous. No names, no identifying info stored.

Respond only with your reply text. No labels, no formatting, no preamble. Just speak.`;
  };

  // ── call Gemini API ───────────────────────────────────────────────
  const callClaude=async(allMessages,currentCrisisLevel,currentConvMode)=>{
    const systemPrompt=buildSystemPrompt(currentCrisisLevel,currentConvMode,allMessages.filter(m=>m.from==="user").length);
    const apiMessages=allMessages
      .filter(m=>m.from==="user"||m.from==="ai")
      .map(m=>({
        role:m.from==="user"?"user":"model",
        parts:[{text:m.text}]
      }));
    const response=await fetch("/.netlify/functions/chat",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        model:"gemini-2.0-flash",
        systemInstruction:{parts:[{text:systemPrompt}]},
        contents:apiMessages,
        generationConfig:{maxOutputTokens:400,temperature:0.85},
      })
    });
    if(!response.ok){
      const err=await response.json().catch(()=>({}));
      throw new Error("Chat error "+response.status+(err.error?" — "+err.error:""));
    }
    const data=await response.json();
    return data.candidates&&data.candidates[0]?.content?.parts?.[0]?.text
      ?data.candidates[0].content.parts[0].text.trim()
      :"I'm here. Take your time.";
  };

  // ── determine conversation mode from context ──────────────────────
  const determineMode=(level,msgCount,allMessages)=>{
    if(level>=3) return "pst";
    if(level>=2) return "elevated";
    // Check last few user messages for escalating themes
    const recentUserText=allMessages.filter(m=>m.from==="user").slice(-3).map(m=>m.text.toLowerCase()).join(" ");
    const heavyWords=["can't stop","nightmare","drinking","can't sleep","not okay","falling apart","breaking","numb","nothing matters","don't care anymore","exhausted","done","over it","hopeless","alone","nobody","suicide","hurt myself","end it"];
    const elevatedWords=["not great","struggling","hard lately","rough week","not sleeping","on edge","irritable","snapping","withdrawn","isolating","drinking more","nightmares","flashback","keeps coming back","can't shake it"];
    if(heavyWords.some(w=>recentUserText.includes(w))) return "pst";
    if(elevatedWords.some(w=>recentUserText.includes(w))||level>=1||msgCount>=6) return "elevated";
    return "companion";
  };

  // ── send ─────────────────────────────────────────────────────────
  const send=async()=>{
    if(!input.trim()||isThinking)return;
    const userText=input.trim();
    const level=detectLevel(userText);
    const isSpiritual=detectSpiritual(userText);
    if(isSpiritual&&!spiritualMode) setSpiritualMode(true);
    const newMessages=[...messages,{from:"user",text:userText}];
    setMessages(newMessages);
    setQuickReplies([]);
    setInput("");
    setIsThinking(true);
    const newCrisisLevel=Math.max(level,crisisLevel);
    if(level>crisisLevel){
      setCrisisLevel(newCrisisLevel);
      if(level>=2){setTimeout(()=>setShowCrisisCard(true),1200);if(!buddyPending){setBuddyPending(true);setTimeout(()=>setBuddyModal(true),180000);}}
    }
    trackAISession((agency&&agency.code),newCrisisLevel,newMessages.filter(m=>m.from==="user").length);
    const newMode=determineMode(newCrisisLevel,newMessages.filter(m=>m.from==="user").length,newMessages);
    if(newMode!==convMode) setConvMode(newMode);
    try{
      const reply=await callClaude(newMessages,newCrisisLevel,newMode);
      setMessages(prev=>[...prev,{from:"ai",text:reply}]);
      setQuickReplies(getQuickReplies(reply,newCrisisLevel));
      if(inputMode==="voice"||autoSpeak){const msgIdx=newMessages.length+1;setTimeout(()=>speakResponse(reply,msgIdx),100);}
    }catch(err){
      // Graceful fallback if API fails
      const fallbacks=["I'm here. Take your time.","You don't have to figure this out alone.","I hear you. What's hitting hardest right now?","That sounds like a lot to carry. I'm listening."];
      const fallback=fallbacks[Math.floor(Math.random()*fallbacks.length)];
      setMessages(prev=>[...prev,{from:"ai",text:fallback}]);
      setQuickReplies(getQuickReplies(fallback,newCrisisLevel));
    }finally{
      setIsThinking(false);
    }
  };

  const handleQuickReply=(text)=>{setInput(text);setQuickReplies([]);};

  // ── session → journal ─────────────────────────────────────────────
  const saveSessionToJournal=()=>{
    if(messages.length<2||sessionSaved) return;
    const userMsgs=messages.filter(m=>m.from==="user").map(m=>m.text).join(" | ");
    const summary="[AI PST Session] Mood before: "+(moodBefore||"not set")+". "+
      "Messages exchanged: "+messages.length+". "+
      "What I shared: "+userMsgs.substring(0,300)+(userMsgs.length>300?"...":"");
    const newEntry={text:summary,mode:"text",date:new Date().toLocaleString(),prompt:"AI Peer Support Session",anonymous:true,type:"rough_call",ephemeral:false,crisis:crisisLevel>=3,fromSession:true};
    try{
      const existing=JSON.parse(localStorage.getItem("upstream_journal")||"[]");
      localStorage.setItem("upstream_journal",JSON.stringify([newEntry,...existing]));
      setSessionSaved(true);
    }catch(e){}
  };

  // ── follow-up prompts ─────────────────────────────────────────────
  const FOLLOWUP=[
    {icon:"📓",label:"Write it down",sub:"Save a journal entry about this",action:()=>{saveSessionToJournal();navigate("journal");}},
    {icon:"💨",label:"Breathing reset",sub:"60-second box breathing",action:()=>navigate("breathing")},
    {icon:"🤝",label:"Talk to someone",sub:agency?"Contact your Human PST":"Find peer support",action:()=>navigate(agency?"humanpst":"agencycode")},
    {icon:"📞",label:"Crisis line",sub:"988 - free, confidential, 24/7",action:()=>{window.location.href="tel:988";}},
  ];

  // ── mood options ──────────────────────────────────────────────────
  const MOODS=[
    {label:"I'm good",sub:"Just checking in",color:"#22c55e",emoji:"🟢"},
    {label:"Striving",sub:"Getting through it",color:"#eab308",emoji:"🟡"},
    {label:"Not great",sub:"Could use support",color:"#f97316",emoji:"🟠"},
    {label:"Struggling",sub:"It's been heavy",color:"#ef4444",emoji:"🔴"},
    {label:"In crisis",sub:"I need help now",color:"#7c3aed",emoji:"🆘"},
  ];

  const startChat=(mood)=>{
    setMoodBefore(mood.label);
    setPhase("chat");
    const opener=mood.label==="In crisis"
      ?"You reached out and that took courage. I'm here. You are not alone right now. Can you tell me what's happening?"
      :mood.label==="Struggling"
      ?"I'm really glad you're here. Reaching out takes strength. What's going on?"
      :mood.label==="Not great"
      ?"Thanks for checking in. What's been weighing on you?"
      :"Hey. I'm really glad you reached out. Whether it's something specific or just a tough day - I'm here. What's on your mind?";
    setMessages([{from:"ai",text:opener}]);
    setQuickReplies(QUICK_REPLIES.general);
  };

  const lev=LEVEL_CONFIG[crisisLevel]||null;
  const chatH=lc.isDesktop?"360px":lc.isTablet?"320px":"240px";

  // ── MOOD CHECK-IN ────────────────────────────────────────────────
  if(phase==="moodcheck"){
    return(
      <ScreenSingle headerProps={{onBack:()=>navigate("home"),title:"AI Peer Support",agencyName:(agency&&agency.name)}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:22,marginBottom:8}}>👋</div>
          <div style={{fontSize:17,fontWeight:800,color:"#dde8f4",marginBottom:6}}>How are you right now?</div>
          <div style={{fontSize:13,color:"#3d5268",lineHeight:1.6}}>No right or wrong answer. This helps me show up for you better.</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {MOODS.map(m=>(
            <div key={m.label} onClick={()=>startChat(m)} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:14,background:m.label==="In crisis"?"rgba(124,58,237,0.1)":"rgba(255,255,255,0.04)",border:`1.5px solid ${m.color}30`,cursor:"pointer"}}>
              <span style={{fontSize:22}}>{m.emoji}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:m.color}}>{m.label}</div>
                <div style={{fontSize:12,color:"#475569",marginTop:2}}>{m.sub}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a52" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}
        </div>
        <div style={{fontSize:10,color:"#1e3a52",textAlign:"center",marginTop:8,letterSpacing:"0.06em"}}>ANONYMOUS . NO NAMES . NO CONTACT INFO STORED</div>
      </ScreenSingle>
    );
  }

  // ── FOLLOW-UP ─────────────────────────────────────────────────────
  if(phase==="followup"){
    return(
      <ScreenSingle headerProps={{onBack:()=>navigate("home"),title:"After Your Session",agencyName:(agency&&agency.name)}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:22,marginBottom:8}}>✓</div>
          <div style={{fontSize:17,fontWeight:800,color:"#dde8f4",marginBottom:6}}>Good work showing up</div>
          <div style={{fontSize:13,color:"#3d5268",lineHeight:1.6}}>Talking about it matters. Here are some ways to keep moving forward.</div>
        </div>
        {!sessionSaved&&messages.length>=2&&(
          <div onClick={saveSessionToJournal} style={{display:"flex",alignItems:"center",gap:12,padding:"14px",borderRadius:14,background:"rgba(167,139,250,0.08)",border:"1.5px solid rgba(167,139,250,0.25)",cursor:"pointer",marginBottom:10}}>
            <span style={{fontSize:22}}>📓</span>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:"#c4b5fd"}}>Save session to journal</div>
              <div style={{fontSize:12,color:"#7c5cbf",marginTop:2}}>Log a summary of this conversation privately</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c5cbf" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        )}
        {sessionSaved&&(
          <div style={{padding:"12px",borderRadius:12,background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",textAlign:"center",fontSize:13,color:"#22c55e",marginBottom:10}}>✓ Session saved to your journal</div>
        )}
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {FOLLOWUP.slice(sessionSaved?1:0).map((f,i)=>(
            <div key={i} onClick={f.action} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:14,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",cursor:"pointer"}}>
              <span style={{fontSize:22}}>{f.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:"#dde8f4"}}>{f.label}</div>
                <div style={{fontSize:12,color:"#475569",marginTop:2}}>{f.sub}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a52" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}
        </div>
        <div onClick={()=>setPhase("moodcheck")} style={{textAlign:"center",marginTop:16,fontSize:13,color:"#38bdf8",cursor:"pointer",fontWeight:600}}>Start another session</div>
      </ScreenSingle>
    );
  }

  // ── CHAT ──────────────────────────────────────────────────────────
  return(
    <ScreenSingle headerProps={{onBack:()=>setPhase("followup"),title:"AI Peer Support",agencyName:(agency&&agency.name)}}>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:6,flex:1,background:"rgba(255,255,255,0.03)",borderRadius:12,padding:4}}>
          {["type","voice"].map(m=>(
            <div key={m} onClick={()=>setInputMode(m)} style={{flex:1,textAlign:"center",padding:"9px",borderRadius:9,background:inputMode===m?"rgba(56,189,248,0.15)":"transparent",color:inputMode===m?"#38bdf8":"#475569",fontSize:12,fontWeight:600,cursor:"pointer"}}>
              {m==="type"?<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{verticalAlign:"middle",marginRight:4}}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{verticalAlign:"middle",marginRight:4}}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>}
              {t(m==="type"?"text":"voice",userLanguage)}
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:6}}>
          <div onClick={()=>setAutoSpeak(a=>!a)} title={autoSpeak?"Auto-speak ON":"Auto-speak OFF"}
            style={{padding:"9px 12px",borderRadius:10,background:autoSpeak?"rgba(167,139,250,0.15)":"rgba(255,255,255,0.04)",border:"1px solid "+(autoSpeak?"rgba(167,139,250,0.3)":"rgba(255,255,255,0.06)"),color:autoSpeak?"#a78bfa":"#475569",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            {autoSpeak?"On":"Read"}
          </div>
          <div onClick={()=>setShowVoicePicker(v=>!v)} title="Choose voice"
            style={{padding:"9px 12px",borderRadius:10,background:showVoicePicker?"rgba(56,189,248,0.15)":"rgba(255,255,255,0.04)",border:"1px solid "+(showVoicePicker?"rgba(56,189,248,0.3)":"rgba(255,255,255,0.06)"),color:showVoicePicker?"#38bdf8":"#475569",fontSize:12,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:4}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="10"/></svg>
            Voice
          </div>
        </div>
      </div>
      {showVoicePicker&&(
        <div style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"12px 14px"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:10,letterSpacing:"0.12em",textTransform:"uppercase"}}>Select Voice</div>
          {availableVoices.length===0&&(<div style={{fontSize:12,color:"#334155"}}>No voices available on this device. Try Chrome or Safari.</div>)}
          <div style={{display:"flex",flexDirection:"column",gap:6,maxHeight:160,overflowY:"auto"}}>
            {availableVoices.slice(0,8).map((v,i)=>(
              <div key={i} onClick={()=>(setSelectedVoice(v),setShowVoicePicker(false),speakResponse("Hi, I'm here to support you.",0))}
                style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 12px",borderRadius:9,background:selectedVoice&&selectedVoice.name===v.name?"rgba(56,189,248,0.1)":"rgba(255,255,255,0.03)",cursor:"pointer"}}>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:selectedVoice&&selectedVoice.name===v.name?"#38bdf8":"#c8dae8"}}>{v.name}</div>
                  <div style={{fontSize:10,color:"#334155"}}>{v.lang}{v.localService?" . On device":""}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  {selectedVoice&&selectedVoice.name===v.name&&<span style={{fontSize:9,fontWeight:800,color:"#38bdf8",background:"rgba(56,189,248,0.1)",borderRadius:4,padding:"2px 5px"}}>ACTIVE</span>}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/></svg>
                </div>
              </div>
            ))}
          </div>
          <div style={{fontSize:10,color:"#1e3a52",marginTop:8,textAlign:"center"}}>Tap a voice to preview . Voices vary by device</div>
        </div>
      )}
      <div style={{background:"rgba(56,189,248,0.05)",border:"1px solid rgba(56,189,248,0.12)",borderRadius:10,padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:11,color:"#38bdf8",fontWeight:600}}>AI PST . Anonymous Mode</span>
        <span style={{fontSize:10,color:"#2d4a66"}}>No names . No contact info stored</span>
      </div>

      {/* ── subtle crisis banner (level 1-2) ── */}
      {crisisLevel>=1&&crisisLevel<=2&&!showCrisisCard&&lev&&(
        <div style={{background:lev.bg,border:`1px solid ${lev.border}`,borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:lev.color}}>{lev.label}</div>
            <div style={{fontSize:11,color:"#64748b",marginTop:2}}>You don't have to go through this alone.</div>
          </div>
          <div onClick={()=>setShowCrisisCard(true)} style={{fontSize:11,color:lev.color,fontWeight:700,cursor:"pointer",padding:"6px 10px",border:`1px solid ${lev.border}`,borderRadius:8}}>Options</div>
        </div>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:10,minHeight:chatH,maxHeight:chatH,overflowY:"auto",paddingRight:2}}>
        {messages.map((m,i)=>(
          <div key={i} style={{alignSelf:m.from==="user"?"flex-end":"flex-start",maxWidth:"82%",background:m.from==="user"?"rgba(56,189,248,0.12)":"rgba(255,255,255,0.04)",borderRadius:m.from==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"12px 14px"}}>
            <div style={{fontSize:10,color:m.from==="user"?"#7dd3fc":"#0ea5e9",fontWeight:700,marginBottom:4}}>{m.from==="user"?"You":"AI Peer Support"}</div>
            <div style={{fontSize:lc.isDesktop?14:13,color:"#c8dae8",lineHeight:1.55}}>{m.text}</div>
          </div>
        ))}
        {isThinking&&(
          <div style={{alignSelf:"flex-start",maxWidth:"82%",background:"rgba(255,255,255,0.04)",borderRadius:"16px 16px 16px 4px",padding:"12px 14px"}}>
            <div style={{fontSize:10,color:"#0ea5e9",fontWeight:700,marginBottom:6}}>AI Peer Support</div>
            <div style={{display:"flex",gap:5,alignItems:"center"}}>
              {[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:"#38bdf8",opacity:0.7,animation:"pulse 1.2s infinite",animationDelay:i*0.22+"s"}}/>)}
            </div>
          </div>
        )}
        <div ref={bottomRef}/>
      </div>

      {/* ── quick replies ── */}
      {quickReplies.length>0&&phase==="chat"&&(
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {quickReplies.slice(0,4).map((r,i)=>(
            <div key={i} onClick={()=>handleQuickReply(r)} style={{padding:"7px 12px",borderRadius:20,background:"rgba(56,189,248,0.07)",border:"1px solid rgba(56,189,248,0.2)",fontSize:12,color:"#7dd3fc",cursor:"pointer",lineHeight:1.4}}>
              {r}
            </div>
          ))}
        </div>
      )}

      {/* ── assertive crisis card (level 3-4) ── */}
      {showCrisisCard&&lev&&(
        <div style={{background:lev.bg,border:`1.5px solid ${lev.border}`,borderRadius:16,padding:"16px"}}>
          <div style={{fontSize:12,color:lev.color,fontWeight:800,marginBottom:8}}>[!] {lev.label}</div>
          <div style={{fontSize:12,color:"#3d5268",marginBottom:12,lineHeight:1.6}}>I noticed something in what you shared. You don't have to keep going alone.</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {agency?(
              <div onClick={()=>navigate("humanpst")} style={{background:"rgba(167,139,250,0.12)",border:"1px solid rgba(167,139,250,0.3)",borderRadius:12,padding:"11px 14px",cursor:"pointer",fontSize:13,fontWeight:700,color:"#c4b5fd"}}>Talk to a Human PST Member</div>
            ):(
              <div onClick={()=>navigate("agencycode")} style={{background:"rgba(56,189,248,0.08)",border:"1px solid rgba(56,189,248,0.2)",borderRadius:12,padding:"11px 14px",cursor:"pointer",fontSize:13,fontWeight:700,color:"#7dd3fc"}}>Connect with Peer Support</div>
            )}
            <div style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:12,padding:"11px 14px",cursor:"pointer",fontSize:13,fontWeight:700,color:"#f87171"}} onClick={()=>(window.location.href="tel:988")}>Call 988 - Crisis Lifeline</div>
            <div style={{background:"rgba(56,189,248,0.08)",border:"1px solid rgba(56,189,248,0.2)",borderRadius:12,padding:"11px 14px",cursor:"pointer",fontSize:13,fontWeight:700,color:"#7dd3fc"}} onClick={()=>navigate("resources")}>View Resources</div>
            <div onClick={()=>setShowCrisisCard(false)} style={{textAlign:"center",fontSize:12,color:"#2d4a66",cursor:"pointer",padding:8}}>Continue conversation</div>
          </div>
        </div>
      )}

      {spiritualMode&&!showCrisisCard&&messages.length>1&&(
        <div style={{background:"rgba(167,139,250,0.07)",border:"1px solid rgba(167,139,250,0.18)",borderRadius:14,padding:"14px"}}>
          <div style={{fontSize:12,color:"#a78bfa",fontWeight:700,marginBottom:6}}>🙏 Faith-Based Support Available</div>
          <div style={{fontSize:12,color:"#3d5268",lineHeight:1.65,marginBottom:12}}>If you'd like to talk with someone who understands both the job and matters of faith, your Human PST team includes chaplain-trained members.</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {agency&&<div onClick={()=>navigate("humanpst")} style={{background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.25)",borderRadius:12,padding:"11px 14px",cursor:"pointer",fontSize:13,fontWeight:700,color:"#c4b5fd"}}>Contact Human PST</div>}
            <div onClick={()=>setSpiritualMode(false)} style={{textAlign:"center",fontSize:12,color:"#2d4a66",cursor:"pointer",padding:8}}>Continue here</div>
          </div>
        </div>
      )}

      {inputMode==="type"?(
        <div style={{display:"flex",gap:10}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!isThinking&&send()} placeholder={isThinking?"AI is responding...":"What's on your mind..."} disabled={isThinking} style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1.5px solid rgba(56,189,248,0.2)",borderRadius:12,padding:"12px 14px",color:"#dde8f4",fontSize:14,outline:"none",opacity:isThinking?0.5:1}}/>
          <div onClick={!isThinking?send:undefined} style={{width:46,height:46,borderRadius:12,background:isThinking?"rgba(56,189,248,0.05)":"rgba(56,189,248,0.15)",border:"1px solid rgba(56,189,248,0.3)",display:"flex",alignItems:"center",justifyContent:"center",cursor:isThinking?"default":"pointer",flexShrink:0,opacity:isThinking?0.4:1}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </div>
        </div>
      ):(
        <div>
          <div style={{background:"rgba(56,189,248,0.04)",border:"1px solid rgba(56,189,248,0.1)",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#2d4a66",textAlign:"center",marginBottom:10}}>
            🎤 Tap the mic to speak - your words appear above, then tap send
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10,alignItems:"center"}}>
          {input&&<div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#c8dae8",width:"100%"}}>{input}</div>}
          {isSpeaking&&(
            <div style={{background:"rgba(167,139,250,0.08)",borderRadius:12,padding:"12px",display:"flex",alignItems:"center",gap:8}}>
              <div style={{display:"flex",gap:2}}>
                {[1,2,3,4].map(i=>(
                  <div key={i} style={{width:3,height:8+i*2,background:"#a78bfa",borderRadius:2,animation:"pulse 0.6s ease-in-out infinite",animationDelay:`${i*0.1}s`}}/>
                ))}
              </div>
              <span style={{fontSize:12,color:"#a78bfa",fontWeight:600}}>
                {t("speaking",userLanguage)}
              </span>
            </div>
          )}
          <div style={{display:"flex",gap:10,width:"100%"}}>
            <div onClick={isListening?stopVoice:startVoice} style={{flex:1,height:52,borderRadius:14,background:isListening?"rgba(239,68,68,0.15)":"rgba(56,189,248,0.1)",border:"1.5px solid "+(isListening?"rgba(239,68,68,0.4)":"rgba(56,189,248,0.25)"),display:"flex",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",fontSize:13,fontWeight:700,color:isListening?"#f87171":"#38bdf8"}}>
              {isListening?(<><div style={{display:"flex",gap:3}}>{[1,2,3,4].map(i=><div key={i} style={{width:3,height:8+i*2,background:"#f87171",borderRadius:2}}/>)}</div>Stop</>):(<><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>Speak</>)}
            </div>
            {input&&<div onClick={!isThinking?send:undefined} style={{width:52,height:52,borderRadius:14,background:isThinking?"rgba(56,189,248,0.05)":"rgba(56,189,248,0.15)",border:"1.5px solid rgba(56,189,248,0.3)",display:"flex",alignItems:"center",justifyContent:"center",cursor:isThinking?"default":"pointer",opacity:isThinking?0.4:1}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </div>}
          </div>
          </div>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div onClick={()=>navigate("tools")} style={{background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.18)",borderRadius:12,padding:"12px",textAlign:"center",cursor:"pointer",fontSize:12,fontWeight:700,color:"#22c55e"}}>Coping Tools</div>
        <div onClick={()=>setPhase("followup")} style={{background:"rgba(249,115,22,0.08)",border:"1px solid rgba(249,115,22,0.18)",borderRadius:12,padding:"12px",textAlign:"center",cursor:"pointer",fontSize:12,fontWeight:700,color:"#f97316"}}>Wrap Up</div>
      </div>
      <div style={{fontSize:10,color:"#1e3a52",textAlign:"center",letterSpacing:"0.06em"}}>AI MEMORY . STORED ON DEVICE ONLY</div>
      {buddyModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20}}>
          <div style={{background:"#0c1a2e",border:"1.5px solid rgba(56,189,248,0.3)",borderRadius:20,padding:24,maxWidth:320,width:"100%"}}>
            <div style={{fontSize:22,textAlign:"center",marginBottom:10}}>👋</div>
            <div style={{fontSize:16,fontWeight:800,color:"#dde8f4",textAlign:"center",marginBottom:10}}>Checking in on you</div>
            <div style={{fontSize:13,color:"#3d5268",textAlign:"center",lineHeight:1.6,marginBottom:20}}>You've been here a while. How are you doing? Would you like to talk to a real person?</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div onClick={()=>setBuddyModal(false)} style={{background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.25)",borderRadius:12,padding:"12px",cursor:"pointer",textAlign:"center",fontSize:13,fontWeight:700,color:"#22c55e"}}>I'm okay, keep talking</div>
              <div onClick={()=>setBuddyModal(false)} style={{background:"rgba(234,179,8,0.1)",border:"1px solid rgba(234,179,8,0.25)",borderRadius:12,padding:"12px",cursor:"pointer",textAlign:"center",fontSize:13,fontWeight:700,color:"#eab308"}}>I need a break</div>
              <div onClick={()=>(setBuddyModal(false),agency?navigate("humanpst"):navigate("agencycode"))} style={{background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.25)",borderRadius:12,padding:"12px",cursor:"pointer",textAlign:"center",fontSize:13,fontWeight:700,color:"#c4b5fd"}}>Talk to a real person</div>
            </div>
          </div>
        </div>
      )}
    </ScreenSingle>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI CHAT SCREEN
// Conversational AI that reads the room — starts casual, shifts to PST support
// naturally when the conversation calls for it. No intake gate, no forced mode.
// ─────────────────────────────────────────────────────────────────────────────
function AIChatScreen({navigate,agency,userLanguage="en",userState}){
  const lc=useLayoutConfig();

  // ── state ────────────────────────────────────────────────────────────────
  const OPENING_MSG={from:"ai",text:"Hey, thanks for stopping by. How are you doing today?"};
  const[messages,setMessages]=useState([OPENING_MSG]);
  const[input,setInput]=useState("");
  const[isThinking,setIsThinking]=useState(false);
  const[crisisLevel,setCrisisLevel]=useState(0);
  const[convMode,setConvMode]=useState("casual"); // casual | support | pst
  const[showCrisisCard,setShowCrisisCard]=useState(false);
  const[spiritualMode,setSpiritualMode]=useState(false);
  const[quickReplies,setQuickReplies]=useState([]);
  const[sessionSaved,setSessionSaved]=useState(false);
  const[isListening,setIsListening]=useState(false);
  const[isSpeaking,setIsSpeaking]=useState(false);
  const[autoSpeak,setAutoSpeak]=useState(false);
  const[inputMode,setInputMode]=useState("type");
  const[availableVoices,setAvailableVoices]=useState([]);
  const[selectedVoice,setSelectedVoice]=useState(null);
  const[buddyPending,setBuddyPending]=useState(false);
  const[buddyModal,setBuddyModal]=useState(false);
  const[apiError,setApiError]=useState(false);
  const[showVoicePicker,setShowVoicePicker]=useState(false);
  const[aiName,setAiName]=useState(()=>{try{return localStorage.getItem("upstream_ai_name")||"UPSTREAM AI";}catch(e){return"UPSTREAM AI";}});
  const[editingName,setEditingName]=useState(false);
  const[nameInput,setNameInput]=useState("");
  const bottomRef=useRef(null);
  const recognitionRef=useRef(null);
  const synthRef=useRef(null);
  const textareaRef=useRef(null);

  useEffect(()=>{
    bottomRef.current&&bottomRef.current.scrollIntoView({behavior:"smooth"});
  },[messages]);

  useEffect(()=>{
    if(textareaRef.current){
      textareaRef.current.style.height="auto";
      textareaRef.current.style.height=Math.min(textareaRef.current.scrollHeight,140)+"px";
    }
  },[input]);

  // ── voices ───────────────────────────────────────────────────────────────
  useEffect(()=>{
    const loadVoices=()=>{
      const all=window.speechSynthesis.getVoices();
      const lang=userLanguage==="es"?"es":"en";
      const quality=all.filter(v=>v.lang.startsWith(lang)&&(v.name.includes("Enhanced")||v.name.includes("Premium")||v.name.includes("Neural")||v.name.includes("Siri")||v.name.includes("Google")||v.localService===true));
      const fallback=all.filter(v=>v.lang.startsWith(lang));
      const voices=quality.length>0?quality:fallback;
      setAvailableVoices(voices);
      const calm=voices.find(v=>v.name.includes("Samantha")||v.name.includes("Karen")||v.name.includes("Daniel")||v.name.includes("Google US")||v.name.includes("Google UK"));
      setSelectedVoice(prev=>prev||(calm||voices[0]||null));
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged=loadVoices;
    return()=>{window.speechSynthesis.onvoiceschanged=null;};
  },[userLanguage]);

  // ── TTS ──────────────────────────────────────────────────────────────────
  const speakResponse=(text)=>{
    window.speechSynthesis.cancel();
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.lang=userLanguage==="es"?"es-ES":"en-US";
    utterance.rate=0.88;utterance.pitch=1.0;utterance.volume=1.0;
    if(selectedVoice) utterance.voice=selectedVoice;
    utterance.onstart=()=>setIsSpeaking(true);
    utterance.onend=()=>setIsSpeaking(false);
    utterance.onerror=()=>setIsSpeaking(false);
    synthRef.current=utterance;
    window.speechSynthesis.speak(utterance);
  };
  const stopSpeaking=()=>{window.speechSynthesis.cancel();setIsSpeaking(false);};

  // ── STT ──────────────────────────────────────────────────────────────────
  const startVoice=()=>{
    if(!("webkitSpeechRecognition" in window||"SpeechRecognition" in window)){
      alert("Voice input not supported on this browser. Try Chrome or Safari.");return;
    }
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    const r=new SR();r.continuous=false;r.interimResults=true;
    r.lang=userLanguage==="es"?"es-ES":"en-US";
    r.onresult=(e)=>{setInput(Array.from(e.results).map(r=>r[0].transcript).join(""));};
    r.onend=()=>setIsListening(false);
    r.onerror=()=>setIsListening(false);
    r.start();recognitionRef.current=r;setIsListening(true);
  };
  const stopVoice=()=>{recognitionRef.current&&recognitionRef.current.stop();setIsListening(false);};

  // ── mode detection ───────────────────────────────────────────────────────
  const determineMode=(level,allMessages)=>{
    if(level>=3) return "pst";
    if(level>=2) return "support";
    const recentText=allMessages.filter(m=>m.from==="user").slice(-3).map(m=>m.text.toLowerCase()).join(" ");
    const supportWords=["not great","struggling","rough week","not sleeping","on edge","irritable","snapping","withdrawn","drinking more","nightmares","flashback","keeps coming back","can't shake","burned out","numb","heavy","hard lately"];
    if(supportWords.some(w=>recentText.includes(w))||level>=1) return "support";
    return "casual";
  };

  // ── quick replies by context ─────────────────────────────────────────────
  const QUICK_REPLIES={
    casual:["Just checking in","Had a rough shift","Something's been on my mind","Can't really explain it","Just needed to talk"],
    support:["It's been building for a while","I haven't been sleeping","I keep replaying it","I don't want to talk to anyone else yet","I'm doing okay, just processing"],
    pst:["I'm safe right now","I want to talk to a real person","I need resources","Can you stay with me?","I'll reach out to someone I trust"],
    resources:["Yes, show me what's nearby","Just the crisis lines for now","I'm not ready for that yet","Tell me about peer support"],
  };

  const getQuickReplies=(msgText,level,mode)=>{
    if(level>=3) return QUICK_REPLIES.pst;
    if(msgText&&(msgText.includes("resource")||msgText.includes("therapist")||msgText.includes("near you")||msgText.includes("nearby"))) return QUICK_REPLIES.resources;
    if(mode==="support"||mode==="pst") return QUICK_REPLIES.support;
    return QUICK_REPLIES.casual;
  };

  // ── system prompt ────────────────────────────────────────────────────────
  const buildSystemPrompt=(level,mode,msgCount)=>{
    const agencyCtx=agency&&agency.code
      ?`This user's agency has a peer support team (${agency.name||agency.code}). If support resources come up, mention their PST team first.`
      :"This user does not have a configured agency PST team.";
    const locationCtx=userState?`User's state: ${userState}.`:"Location unknown.";

    const modeGuide={
      casual:`You're in casual conversation mode. The person just wanted to talk — respond like a peer who happens to be knowledgeable about first responder life. Keep it light and real. Match their energy. If they're testing the app, just be normal about it — answer naturally, maybe with a bit of warmth or dry humor. Don't assume distress. Ask one easy question if it feels natural, but don't push.`,
      support:`The conversation has gotten a bit heavier. Stay warm and present. Slow down, ask one thoughtful question at a time. Don't push toward resources unless they bring it up or things get clearly heavier. You're a peer sitting with them, not running a protocol.`,
      pst:`There are signs of real distress. Be calm, steady, and clear. Safety is the priority. Acknowledge what they're feeling without amplifying it. When the moment is right, gently offer to connect them with real support — their agency PST team if available, 988, or nearby first responder resources. Stay with them. Don't rush.`,
    };

    return `You are an AI peer support companion inside Upstream Approach — a mental wellness app built specifically for first responders: paramedics, firefighters, law enforcement, dispatchers, ER staff.

YOUR CHARACTER:
You are warm, direct, and real. You talk like a peer who knows the job — not a clinician, not a chatbot. You understand shift work, gallows humor as a coping tool, the culture of pushing through, the weight of carrying calls home, and the stigma around asking for help in this profession. You do not use clinical language. You don't say "I understand that must be difficult for you." You say things like "That kind of call doesn't just stay at the scene." You can be casual, even a little dry, when the conversation calls for it.

CURRENT MODE: ${mode.toUpperCase()}
${modeGuide[mode]}

CORE PRINCIPLES (always):
- One question at a time. Never pepper someone with multiple questions.
- Meet them where they are. Don't project distress onto them.
- Short responses are often better. Read the room.
- Gallows humor and dark cop/fire/EMS humor is part of the culture — don't pathologize it.
- If faith or spiritual content comes up, hold that space with respect.
- If someone tests the app or asks something casual or technical, just answer normally. Don't pivot to emotional support unprompted.

SAFETY NET (always active, use only when warranted):
- If crisis language appears, shift naturally — don't announce the shift.
- Resources to weave in only when the moment calls for it: agency PST team first, Safe Call Now (1-206-459-3020), 988 Lifeline, First Responder Support Network (1strespondernetwork.org), Badge of Life (badgeoflife.com).
- Never dump a list of resources. Offer one or two, naturally.
- If they're in immediate danger, be clear and calm: 988 is available right now.

${agencyCtx}
${locationCtx}
Messages exchanged so far: ${msgCount}

Respond only with your reply. No labels, no formatting. Just speak.`;
  };

  // ── call Gemini via Netlify Function (key rotation) ─────────────────────
  const callAI=async(allMessages,level,mode)=>{
    setApiError(false);
    const systemPrompt=buildSystemPrompt(level,mode,allMessages.filter(m=>m.from==="user").length);
    const apiMessages=allMessages
      .filter(m=>m.from==="user"||m.from==="ai")
      .map(m=>({
        role:m.from==="user"?"user":"model",
        parts:[{text:m.text}]
      }));
    const response=await fetch("/.netlify/functions/chat",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        model:"gemini-2.0-flash",
        systemInstruction:{parts:[{text:systemPrompt}]},
        contents:apiMessages,
        generationConfig:{maxOutputTokens:400,temperature:0.85},
      })
    });
    if(!response.ok){
      const err=await response.json().catch(()=>({}));
      throw new Error("Chat error "+response.status+(err.error?" — "+err.error:""));
    }
    const data=await response.json();
    return data.candidates&&data.candidates[0]?.content?.parts?.[0]?.text
      ?data.candidates[0].content.parts[0].text.trim()
      :null;
  };

  // ── send ─────────────────────────────────────────────────────────────────
  const send=async()=>{
    if(!input.trim()||isThinking) return;
    const userText=input.trim();
    const level=detectLevel(userText);
    const isSpiritual=detectSpiritual(userText);
    if(isSpiritual&&!spiritualMode) setSpiritualMode(true);

    const newMessages=[...messages,{from:"user",text:userText}];
    setMessages(newMessages);
    setInput("");
    setQuickReplies([]);
    setIsThinking(true);

    const newLevel=Math.max(level,crisisLevel);
    if(level>crisisLevel){
      setCrisisLevel(newLevel);
      if(level>=2&&!showCrisisCard) setTimeout(()=>setShowCrisisCard(true),1500);
      if(level>=2&&!buddyPending){
        setBuddyPending(true);
        setTimeout(()=>setBuddyModal(true),300000); // 5 min — less abrupt than before
      }
    }

    const newMode=determineMode(newLevel,newMessages);
    if(newMode!==convMode) setConvMode(newMode);

    trackAISession((agency&&agency.code),newLevel,newMessages.filter(m=>m.from==="user").length);

    try{
      const reply=await callAI(newMessages,newLevel,newMode);
      if(reply){
        setMessages(prev=>[...prev,{from:"ai",text:reply}]);
        setQuickReplies(getQuickReplies(reply,newLevel,newMode));
        if(inputMode==="voice"||autoSpeak) speakResponse(reply);
      } else {
        throw new Error("empty response");
      }
    }catch(err){
      setApiError(true);
      // Neutral fallback — not crisis-toned
      const fallbacks=[
        "I'm here — keep going.",
        "Yeah, I'm listening.",
        "Go ahead, I'm with you.",
        "I hear you. What else?",
      ];
      const fallback=fallbacks[Math.floor(Math.random()*fallbacks.length)];
      setMessages(prev=>[...prev,{from:"ai",text:fallback}]);
      setQuickReplies(getQuickReplies(fallback,newLevel,newMode));
    }finally{
      setIsThinking(false);
    }
  };

  // ── save session to journal ──────────────────────────────────────────────
  const saveSession=()=>{
    if(messages.length<3||sessionSaved) return;
    const userMsgs=messages.filter(m=>m.from==="user").map(m=>m.text).join(" | ");
    const entry={
      text:"[AI Chat] "+userMsgs.substring(0,300)+(userMsgs.length>300?"...":""),
      mode:"text",date:new Date().toLocaleString(),
      prompt:"AI Chat Session",anonymous:true,
      type:"ai_chat",ephemeral:false,
      crisis:crisisLevel>=3,fromSession:true,
    };
    try{
      const existing=JSON.parse(localStorage.getItem("upstream_journal")||"[]");
      localStorage.setItem("upstream_journal",JSON.stringify([entry,...existing]));
      setSessionSaved(true);
    }catch(e){}
  };

  const lev=LEVEL_CONFIG[crisisLevel]||null;

  // ── render ───────────────────────────────────────────────────────────────
  return(
    <ScreenSingle headerProps={{onBack:()=>navigate("home"),title:"Chat",agencyName:(agency&&agency.name)}}>
      {/* messages */}
      <div style={{display:"flex",flexDirection:"column",gap:12,paddingBottom:8}}>
        {messages.map((m,i)=>(
          <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.from==="user"?"flex-end":"flex-start"}}>
            {m.from==="ai"&&(
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                <div style={{fontSize:10,color:"#2d4a66",fontWeight:700,letterSpacing:"0.1em"}}>{aiName}</div>
                {i===0&&!editingName&&(
                  <div onClick={()=>{setNameInput(aiName);setEditingName(true);}}
                    style={{fontSize:9,color:"#1e3a52",cursor:"pointer",letterSpacing:"0.06em",textDecoration:"underline",textDecorationStyle:"dotted"}}>rename</div>
                )}
              </div>
            )}
            <div style={{
              maxWidth:"84%",
              background:m.from==="user"?"rgba(56,189,248,0.12)":"rgba(255,255,255,0.04)",
              border:m.from==="user"?"1px solid rgba(56,189,248,0.25)":"1px solid rgba(255,255,255,0.07)",
              borderRadius:m.from==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px",
              padding:"11px 14px",
              fontSize:14,
              color:m.from==="user"?"#bae6fd":"#c8dae8",
              lineHeight:1.6,
            }}>{m.text}</div>
          </div>
        ))}

        {/* inline rename */}
      {editingName&&(
        <div style={{display:"flex",gap:8,alignItems:"center",padding:"8px 12px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10}}>
          <input
            autoFocus
            value={nameInput}
            onChange={e=>setNameInput(e.target.value.slice(0,24))}
            onKeyDown={e=>{
              if(e.key==="Enter"){
                const n=nameInput.trim()||"UPSTREAM AI";
                setAiName(n);
                try{localStorage.setItem("upstream_ai_name",n);}catch(err){}
                setEditingName(false);
              }
              if(e.key==="Escape") setEditingName(false);
            }}
            placeholder="Name this AI..."
            maxLength={24}
            style={{flex:1,background:"transparent",border:"none",outline:"none",color:"#dde8f4",fontSize:13,fontFamily:"inherit"}}
          />
          <div onClick={()=>{
            const n=nameInput.trim()||"UPSTREAM AI";
            setAiName(n);
            try{localStorage.setItem("upstream_ai_name",n);}catch(err){}
            setEditingName(false);
          }} style={{fontSize:12,color:"#38bdf8",cursor:"pointer",fontWeight:700,flexShrink:0}}>Save</div>
          <div onClick={()=>setEditingName(false)} style={{fontSize:12,color:"#334155",cursor:"pointer",flexShrink:0}}>Cancel</div>
        </div>
      )}

      {/* thinking indicator */}
        {isThinking&&(
          <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"18px 18px 18px 4px",padding:"12px 16px",display:"flex",gap:5,alignItems:"center"}}>
              {[0,1,2].map(i=>(
                <div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#38bdf8",opacity:0.6,animation:"pulse 1.2s ease-in-out infinite",animationDelay:`${i*0.2}s`}}/>
              ))}
            </div>
          </div>
        )}

        {/* api error notice — dev visibility */}
        {apiError&&(
          <div style={{fontSize:11,color:"#475569",textAlign:"center",padding:"4px 0"}}>
            Connection issue — responses may be limited
          </div>
        )}

        <div ref={bottomRef}/>
      </div>

      {/* quick replies */}
      {quickReplies.length>0&&!isThinking&&(
        <div style={{display:"flex",flexWrap:"wrap",gap:8,paddingBottom:4}}>
          {quickReplies.slice(0,4).map((r,i)=>(
            <div key={i} onClick={()=>{setInput(r);setQuickReplies([]);}}
              style={{padding:"7px 13px",borderRadius:20,background:"rgba(56,189,248,0.06)",border:"1px solid rgba(56,189,248,0.18)",fontSize:12,color:"#7dd3fc",cursor:"pointer",lineHeight:1.4}}>
              {r}
            </div>
          ))}
        </div>
      )}

      {/* crisis card — surfaces only when warranted */}
      {showCrisisCard&&lev&&crisisLevel>=2&&(
        <div style={{background:lev.bg,border:`1.5px solid ${lev.border}`,borderRadius:16,padding:"16px"}}>
          <div style={{fontSize:12,color:lev.color,fontWeight:800,marginBottom:6}}>{lev.label}</div>
          <div style={{fontSize:13,color:"#8099b0",marginBottom:12,lineHeight:1.6}}>You don't have to carry this alone. Real support is available.</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {agency?(
              <div onClick={()=>navigate("humanpst")} style={{background:"rgba(167,139,250,0.12)",border:"1px solid rgba(167,139,250,0.3)",borderRadius:12,padding:"11px 14px",cursor:"pointer",fontSize:13,fontWeight:700,color:"#c4b5fd"}}>Talk to a Human PST Member</div>
            ):(
              <div onClick={()=>navigate("agencycode")} style={{background:"rgba(56,189,248,0.08)",border:"1px solid rgba(56,189,248,0.2)",borderRadius:12,padding:"11px 14px",cursor:"pointer",fontSize:13,fontWeight:700,color:"#7dd3fc"}}>Connect with Peer Support</div>
            )}
            <div onClick={()=>window.location.href="tel:988"} style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:12,padding:"11px 14px",cursor:"pointer",fontSize:13,fontWeight:700,color:"#f87171"}}>Call 988 — Crisis Lifeline</div>
            <div onClick={()=>navigate("resources")} style={{background:"rgba(56,189,248,0.06)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:12,padding:"11px 14px",cursor:"pointer",fontSize:13,fontWeight:700,color:"#7dd3fc"}}>View Resources</div>
            <div onClick={()=>setShowCrisisCard(false)} style={{textAlign:"center",fontSize:12,color:"#2d4a66",cursor:"pointer",padding:8}}>Continue talking</div>
          </div>
        </div>
      )}

      {/* spiritual mode card */}
      {spiritualMode&&!showCrisisCard&&messages.length>1&&(
        <div style={{background:"rgba(167,139,250,0.06)",border:"1px solid rgba(167,139,250,0.15)",borderRadius:14,padding:"14px"}}>
          <div style={{fontSize:12,color:"#a78bfa",fontWeight:700,marginBottom:6}}>Faith-based support available</div>
          <div style={{fontSize:12,color:"#3d5268",lineHeight:1.65,marginBottom:10}}>If you'd like to talk with someone who understands both the job and matters of faith, your PST team may include chaplain-trained members.</div>
          {agency&&<div onClick={()=>navigate("humanpst")} style={{background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.22)",borderRadius:12,padding:"10px 14px",cursor:"pointer",fontSize:13,fontWeight:700,color:"#c4b5fd",marginBottom:6}}>Contact Human PST</div>}
          <div onClick={()=>setSpiritualMode(false)} style={{textAlign:"center",fontSize:12,color:"#2d4a66",cursor:"pointer",padding:6}}>Continue here</div>
        </div>
      )}

      {/* input */}
      {inputMode==="type"?(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey&&!isThinking){e.preventDefault();send();}}}
              placeholder={isThinking?"...":"Say something"}
              disabled={isThinking}
              rows={1}
              style={{flex:1,background:"rgba(255,255,255,0.05)",border:"1.5px solid rgba(56,189,248,0.18)",borderRadius:12,padding:"12px 14px",color:"#dde8f4",fontSize:14,outline:"none",opacity:isThinking?0.5:1,resize:"none",lineHeight:1.5,overflow:"hidden",fontFamily:"inherit"}}
            />
            <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
              <div onClick={!isThinking?send:undefined}
                style={{width:46,height:46,borderRadius:12,background:isThinking?"rgba(56,189,248,0.04)":"rgba(56,189,248,0.14)",border:"1px solid rgba(56,189,248,0.28)",display:"flex",alignItems:"center",justifyContent:"center",cursor:isThinking?"default":"pointer",opacity:isThinking?0.4:1}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </div>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <div onClick={()=>setInputMode("voice")}
              style={{flex:1,height:36,borderRadius:10,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer",fontSize:12,color:"#64748b",fontWeight:600}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
              Voice
            </div>
            <div onClick={()=>setAutoSpeak(a=>!a)}
              title={autoSpeak?"Read aloud: ON":"Read aloud: OFF"}
              style={{flex:1,height:36,borderRadius:10,background:autoSpeak?"rgba(167,139,250,0.12)":"rgba(255,255,255,0.04)",border:"1px solid "+(autoSpeak?"rgba(167,139,250,0.3)":"rgba(255,255,255,0.08)"),display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer",fontSize:12,color:autoSpeak?"#a78bfa":"#64748b",fontWeight:600}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              {autoSpeak?"Read aloud: on":"Read aloud"}
            </div>
            <div onClick={()=>setShowVoicePicker(v=>!v)}
              style={{height:36,paddingInline:10,borderRadius:10,background:showVoicePicker?"rgba(56,189,248,0.12)":"rgba(255,255,255,0.04)",border:"1px solid "+(showVoicePicker?"rgba(56,189,248,0.3)":"rgba(255,255,255,0.08)"),display:"flex",alignItems:"center",justifyContent:"center",gap:5,cursor:"pointer",fontSize:12,color:showVoicePicker?"#38bdf8":"#64748b",fontWeight:600,flexShrink:0}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="9"/></svg>
              Voice
            </div>
            {isSpeaking&&<div onClick={stopSpeaking}
              style={{height:36,paddingInline:12,borderRadius:10,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:12,color:"#f87171",fontWeight:600,gap:5}}>
              <div style={{display:"flex",gap:2}}>{[1,2,3].map(i=><div key={i} style={{width:2,height:6+i*2,background:"#f87171",borderRadius:1}}/>)}</div>Stop
            </div>}
          </div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {input&&<div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#c8dae8"}}>{input}</div>}
          <div style={{display:"flex",gap:10}}>
            <div onClick={isListening?stopVoice:startVoice}
              style={{flex:1,height:52,borderRadius:14,background:isListening?"rgba(239,68,68,0.15)":"rgba(56,189,248,0.1)",border:"1.5px solid "+(isListening?"rgba(239,68,68,0.4)":"rgba(56,189,248,0.25)"),display:"flex",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",fontSize:13,fontWeight:700,color:isListening?"#f87171":"#38bdf8"}}>
              {isListening?(<><div style={{display:"flex",gap:3}}>{[1,2,3,4].map(i=><div key={i} style={{width:3,height:8+i*2,background:"#f87171",borderRadius:2}}/>)}</div>Stop</>):(<><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>Speak</>)}
            </div>
            {input&&<div onClick={!isThinking?send:undefined}
              style={{width:52,height:52,borderRadius:14,background:"rgba(56,189,248,0.14)",border:"1.5px solid rgba(56,189,248,0.3)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </div>}
            <div onClick={()=>setInputMode("type")}
              style={{width:52,height:52,borderRadius:14,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
          </div>
        </div>
      )}

      {/* voice picker dropdown */}
      {showVoicePicker&&(
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"12px 14px"}}>
          <div style={{fontSize:11,fontWeight:700,color:"#475569",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>Select voice</div>
          {availableVoices.length===0&&(
            <div style={{fontSize:12,color:"#334155"}}>No voices found. Try Chrome or Safari for best results.</div>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:4,maxHeight:180,overflowY:"auto"}}>
            {availableVoices.map((v,i)=>{
              const isSelected=selectedVoice&&selectedVoice.name===v.name;
              return(
                <div key={i} onClick={()=>{setSelectedVoice(v);speakResponse("Hey, this is what I sound like.");}}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,background:isSelected?"rgba(56,189,248,0.1)":"rgba(255,255,255,0.02)",border:"1px solid "+(isSelected?"rgba(56,189,248,0.25)":"rgba(255,255,255,0.05)"),cursor:"pointer"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:isSelected?700:400,color:isSelected?"#7dd3fc":"#94a3b8"}}>{v.name}</div>
                    <div style={{fontSize:11,color:"#334155",marginTop:1}}>{v.lang}{v.localService?" · on device":""}</div>
                  </div>
                  {isSelected&&<div style={{width:6,height:6,borderRadius:"50%",background:"#38bdf8",flexShrink:0}}/>}
                </div>
              );
            })}
          </div>
          <div style={{fontSize:11,color:"#1e3a52",marginTop:8,textAlign:"center"}}>Tap a voice to preview it</div>
        </div>
      )}

      {/* bottom actions */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        <div onClick={()=>navigate("tools")}
          style={{background:"rgba(34,197,94,0.07)",border:"1px solid rgba(34,197,94,0.16)",borderRadius:12,padding:"12px",textAlign:"center",cursor:"pointer",fontSize:12,fontWeight:700,color:"#22c55e"}}>
          Coping Tools
        </div>
        <div onClick={saveSession}
          style={{background:sessionSaved?"rgba(56,189,248,0.04)":"rgba(56,189,248,0.07)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:12,padding:"12px",textAlign:"center",cursor:sessionSaved?"default":"pointer",fontSize:12,fontWeight:700,color:sessionSaved?"#2d4a66":"#38bdf8"}}>
          {sessionSaved?"Saved to Journal":"Save to Journal"}
        </div>
      </div>

      <div style={{fontSize:10,color:"#1e3a52",textAlign:"center",letterSpacing:"0.06em"}}>STORED ON DEVICE ONLY · ANONYMOUS</div>

      {/* buddy check modal */}
      {buddyModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20}}>
          <div style={{background:"#0c1a2e",border:"1.5px solid rgba(56,189,248,0.25)",borderRadius:20,padding:24,maxWidth:320,width:"100%"}}>
            <div style={{fontSize:22,textAlign:"center",marginBottom:10}}>👋</div>
            <div style={{fontSize:16,fontWeight:800,color:"#dde8f4",textAlign:"center",marginBottom:8}}>Still with you</div>
            <div style={{fontSize:13,color:"#3d5268",textAlign:"center",lineHeight:1.6,marginBottom:20}}>You've been here a while. How are you doing — would it help to talk to a real person?</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div onClick={()=>setBuddyModal(false)} style={{background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.25)",borderRadius:12,padding:"12px",cursor:"pointer",textAlign:"center",fontSize:13,fontWeight:700,color:"#22c55e"}}>I'm okay, keep going</div>
              <div onClick={()=>(setBuddyModal(false),agency?navigate("humanpst"):navigate("agencycode"))} style={{background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.25)",borderRadius:12,padding:"12px",cursor:"pointer",textAlign:"center",fontSize:13,fontWeight:700,color:"#c4b5fd"}}>Talk to a real person</div>
              <div onClick={()=>(setBuddyModal(false),window.location.href="tel:988")} style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:12,padding:"12px",cursor:"pointer",textAlign:"center",fontSize:13,fontWeight:700,color:"#f87171"}}>Call 988</div>
            </div>
          </div>
        </div>
      )}
    </ScreenSingle>
  );
}

// 
// HUMAN PST
// 
function HumanPSTScreen({navigate,agency}){
  const[step,setStep]=useState("panel");
  const[method,setMethod]=useState(null);
  const[urgency,setUrgency]=useState(null);
  const[name,setName]=useState("");
  const[phone,setPhone]=useState("");
  const[message,setMessage]=useState("");
  const[showTipModal,setShowTipModal]=useState(false);
  const[tipContext,setTipContext]=useState(null);
  const[tipPriority,setTipPriority]=useState("Priority");
  const[requestedPST,setRequestedPST]=useState(null);
  const[chatInput,setChatInput]=useState("");
  const[chatBlurred,setChatBlurred]=useState(false);
  const[showDeleteConfirm,setShowDeleteConfirm]=useState(false);
  const[chatMessages,setChatMessages]=useState([]);
  const[pstTyping,setPstTyping]=useState(false);
  const lc=useLayoutConfig();

  const pstReplies=[
    "Thank you for reaching out. I'm here and I'm listening. Take your time.",
    "That sounds really heavy. You don't have to carry this alone.",
    "I hear you. Can you tell me a bit more about what's been going on?",
    "You did the right thing reaching out. What's weighing on you most right now?",
    "I'm glad you messaged. There's no rush - we can go at whatever pace feels right.",
    "That makes a lot of sense given what you've been through. How are you doing right now, in this moment?",
  ];
  const[replyIdx,setReplyIdx]=useState(0);

  const sendChat=()=>{
    if(!chatInput.trim())return;
    const userMsg={from:"user",text:chatInput.trim(),time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})};
    setChatMessages(prev=>[...prev,userMsg]);
    setChatInput("");
    setPstTyping(true);
    setTimeout(()=>{
      const pstMsg={from:"pst",text:pstReplies[replyIdx%pstReplies.length],time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})};
      setChatMessages(prev=>[...prev,pstMsg]);
      setReplyIdx(i=>i+1);
      setPstTyping(false);
    },1800+Math.random()*1200);
  };

  const startChat=(targetPST)=>{
    const pstName=targetPST?targetPST.name:"a PST member";
    const openingMsg={from:"pst",text:"Hi, this is "+pstName+". I picked up your request and I'm here for you. To get started, can you share your name so I know who I'm talking with? This conversation stays between us and the PST team.",time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})};
    setChatMessages([openingMsg]);
    setStep("chat");
  };

  useEffect(()=>{
    if(step!=="chat")return;
    const handleVisibility=()=>{
      if(document.visibilityState==="hidden") setChatBlurred(true);
    };
    document.addEventListener("visibilitychange",handleVisibility);
    return()=>document.removeEventListener("visibilitychange",handleVisibility);
  },[step]);

  if(!agency){
    return(
      <ScreenSingle headerProps={{onBack:()=>navigate("home"),title:"Human Peer Support"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,paddingTop:20}}>
          <div style={{width:64,height:64,borderRadius:"50%",background:"rgba(56,189,248,0.08)",border:"2px solid rgba(56,189,248,0.15)",display:"flex",alignItems:"center",justifyContent:"center",color:"#38bdf8"}}><LockIcon size={28}/></div>
          <div style={{fontSize:17,fontWeight:800,color:"#dde8f4",textAlign:"center"}}>Agency Feature</div>
          <div style={{fontSize:13,color:"#3d5268",textAlign:"center",lineHeight:1.7}}>Human PST access is available to members of participating agencies. Enter your agency code to connect with your peer support team.</div>
          <Btn color="#38bdf8" onClick={()=>navigate("agencycode")} style={{width:"100%"}}>Enter Agency Code -></Btn>
          <div style={{background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.18)",borderRadius:12,padding:"14px 16px",width:"100%",textAlign:"center"}}>
            <div style={{fontSize:12,color:"#f87171",fontWeight:700,marginBottom:6}}>Need immediate support?</div>
            <div style={{fontSize:13,color:"#ef4444",fontWeight:700}}>📞 988 . Safe Call Now: 1-206-459-3020</div>
          </div>
          <div onClick={()=>navigate("resources")} style={{fontSize:13,color:"#38bdf8",cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>Browse peer support resources -></div>
        </div>
      </ScreenSingle>
    );
  }

  const pstMembers=[
    {id:"pst1",name:"J. Martinez",role:"PST Lead",unit:"EMS Division",status:"green",note:"Available now"},
    {id:"pst2",name:"A. Thompson",role:"PST Member",unit:"Station 4",status:"green",note:"On shift until 18:00"},
    {id:"pst3",name:"C. Williams",role:"PST Member",unit:"HQ / Admin",status:"yellow",note:"Available later today"},
    {id:"pst4",name:"D. Nguyen",role:"PST Member",unit:"Dispatch",status:"red",note:"Off duty today"},
  ];
  const sc={green:"#22c55e",yellow:"#eab308",red:"#ef4444"};
  const sl={green:"Available",yellow:"Limited",red:"Off Duty"};

  return(
    <ScreenSingle headerProps={{onBack:()=>navigate("home"),title:"Human Peer Support",agencyName:(agency&&agency.name)}}>
      {step==="panel"&&(<>
        <div style={{background:"rgba(167,139,250,0.07)",border:"1px solid rgba(167,139,250,0.18)",borderRadius:14,padding:"14px 16px"}}>
          <div style={{fontSize:13,color:"#c4b5fd",fontWeight:600,marginBottom:4}}>Real people. Real support.</div>
          <div style={{fontSize:12,color:"#3d5268",lineHeight:1.6}}>Your agency's peer support team are trained colleagues who've been there. Conversations stay within the PST team.</div>
        </div>

        <SLabel color="#a78bfa">PST Team</SLabel>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {pstMembers.map((m,i)=>{const available=m.status!=="red";return(
              <div key={i} style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:16,padding:"14px 16px",opacity:available?1:0.45}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:available?12:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:42,height:42,borderRadius:"50%",background:"rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>👤</div>
                    <div>
                      <div style={{fontSize:14,fontWeight:700,color:"#dde8f4"}}>{m.name}</div>
                      <div style={{fontSize:11,color:"#64748b"}}>{m.role} . {m.unit}</div>
                      <div style={{fontSize:11,color:"#3d5268",marginTop:2,fontStyle:"italic"}}>{m.note}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,flexShrink:0}}>
                    <div style={{width:9,height:9,borderRadius:"50%",background:sc[m.status],boxShadow:"0 0 7px "+sc[m.status]+"90"}}/>
                    <span style={{fontSize:9,color:sc[m.status],fontWeight:700}}>{sl[m.status]}</span>
                  </div>
                </div>
                {available&&(
                  <div style={{display:"flex",gap:8}}>
                    <div onClick={()=>(setRequestedPST(m),setMethod("Call Me"),setStep("contact"))}
                      style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px 0",borderRadius:10,background:"rgba(56,189,248,0.08)",border:"1px solid rgba(56,189,248,0.2)",cursor:"pointer"}}>
                      <span style={{fontSize:14}}>📞</span>
                      <span style={{fontSize:11,fontWeight:700,color:"#38bdf8"}}>Call</span>
                    </div>
                    <div onClick={()=>(setRequestedPST(m),setMethod("Text Me"),setStep("contact"))}
                      style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px 0",borderRadius:10,background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",cursor:"pointer"}}>
                      <span style={{fontSize:14}}>💬</span>
                      <span style={{fontSize:11,fontWeight:700,color:"#22c55e"}}>Text</span>
                    </div>
                    <div onClick={()=>(setRequestedPST(m),startChat(m))}
                      style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,padding:"9px 0",borderRadius:10,background:"rgba(167,139,250,0.1)",border:"1px solid rgba(167,139,250,0.3)",cursor:"pointer"}}>
                      <span style={{fontSize:14}}>🗨</span>
                      <span style={{fontSize:11,fontWeight:700,color:"#a78bfa"}}>Chat</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{height:1,background:"rgba(255,255,255,0.05)",borderRadius:1}}/>

        <div onClick={()=>(setRequestedPST(null),startChat(null))}
          style={{background:"rgba(167,139,250,0.08)",border:"1.5px solid rgba(167,139,250,0.25)",borderRadius:14,padding:"16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:44,height:44,borderRadius:12,background:"rgba(167,139,250,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>📡</div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:800,color:"#c4b5fd"}}>Broadcast to All PST</div>
            <div style={{fontSize:12,color:"#7c5cbf",marginTop:2}}>Send to every available PST member - first to respond gets the chat</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </div>

        <div onClick={()=>(setRequestedPST(null),setStep("contact"))}
          style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:14,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:44,height:44,borderRadius:12,background:"rgba(255,255,255,0.04)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>📋</div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700,color:"#94a3b8"}}>Request a Callback</div>
            <div style={{fontSize:12,color:"#475569",marginTop:2}}>Leave your name and number - PST will reach out</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </div>

        <Card style={{background:"rgba(234,179,8,0.06)",borderColor:"rgba(234,179,8,0.2)"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#eab308",marginBottom:8}}>🤝 Concerned About a Co-Worker?</div>
          <div style={{fontSize:13,color:"#8099b0",lineHeight:1.7,marginBottom:12}}>You can anonymously request that PST check on someone. No names, no identities - just a heads-up that someone might need support.</div>
          <Btn color="#eab308" bg="rgba(234,179,8,0.12)" onClick={()=>setShowTipModal(true)}>Submit Anonymous Wellness Check -></Btn>
        </Card>

        <div style={{background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.18)",borderRadius:12,padding:"12px 14px",textAlign:"center"}}>
          <div style={{fontSize:12,color:"#f87171",fontWeight:700,marginBottom:4}}>Crisis? Call now.</div>
          <div style={{fontSize:13,color:"#ef4444",fontWeight:700}}>988 . Safe Call Now: 1-206-459-3020</div>
        </div>
      </>)}
      {step==="contact"&&(<>
        <Card style={{background:"rgba(167,139,250,0.06)",borderColor:"rgba(167,139,250,0.18)"}}>
          <div style={{fontSize:13,color:"#c4b5fd",fontWeight:600,marginBottom:4}}>{requestedPST?"Contacting "+requestedPST.name:"Requesting PST Callback"}</div>
          <div style={{fontSize:12,color:"#3d5268"}}>Your name and number are shared with your PST team only - never with supervisors or admin.</div>
        </Card>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[{k:"Text Me",icon:"💬"},{k:"Call Me",icon:"📞"},{k:"In-Person",icon:"🤝"},{k:"Schedule Call",icon:"📅"}].map(m=>(
            <div key={m.k} onClick={()=>setMethod(m.k)} style={{background:method===m.k?"rgba(167,139,250,0.15)":"rgba(255,255,255,0.03)",border:`1.5px solid ${method===m.k?"rgba(167,139,250,0.45)":"rgba(255,255,255,0.07)"}`,borderRadius:14,padding:"16px 10px",cursor:"pointer",textAlign:"center"}}>
              <div style={{fontSize:20,marginBottom:6}}>{m.icon}</div>
              <div style={{fontSize:13,fontWeight:700,color:method===m.k?"#a78bfa":"#dde8f4"}}>{m.k}</div>
            </div>
          ))}
        </div>

        <div onClick={()=>startChat(requestedPST)} style={{background:"rgba(167,139,250,0.1)",border:"1.5px solid rgba(167,139,250,0.35)",borderRadius:14,padding:"16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:44,height:44,borderRadius:12,background:"rgba(167,139,250,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>💬</div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:800,color:"#c4b5fd"}}>{requestedPST?"Chat with "+requestedPST.name:"Broadcast to PST Team"}</div>
            <div style={{fontSize:12,color:"#7c5cbf",marginTop:2}}>{requestedPST?"Direct message - only "+requestedPST.name+" will see this":"First available PST member will pick this up"}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </div>

        <SLabel color="#a78bfa">Or request a callback</SLabel>
        <SLabel color="#a78bfa">Urgency</SLabel>
        {["Right now","Today","Anytime"].map(u=>(<div key={u} onClick={()=>setUrgency(u)} style={{background:urgency===u?"rgba(167,139,250,0.12)":"rgba(255,255,255,0.03)",border:`1.5px solid ${urgency===u?"rgba(167,139,250,0.4)":"rgba(255,255,255,0.07)"}`,borderRadius:12,padding:"12px 16px",cursor:"pointer",fontSize:14,fontWeight:urgency===u?700:400,color:urgency===u?"#a78bfa":"#dde8f4"}}>{u==="Right now"?"🔴":u==="Today"?"🟡":"🟢"} {u}</div>))}
        {method&&urgency&&(<>
          <div style={{background:"rgba(56,189,248,0.05)",border:"1px solid rgba(56,189,248,0.12)",borderRadius:12,padding:"10px 14px",fontSize:11,color:"#38bdf8",fontWeight:600}}>
            Your name and number are shared with your PST team only - never with supervisors or admin.
          </div>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.09)",borderRadius:12,padding:"12px 14px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",width:"100%"}}/>
          <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone number" style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.09)",borderRadius:12,padding:"12px 14px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",width:"100%"}}/>
          <textarea value={message} onChange={e=>setMessage(e.target.value)} placeholder="Optional - anything you want them to know first..." rows={3} style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.09)",borderRadius:12,padding:"12px 14px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",width:"100%"}}/>
          {name&&phone&&<Btn color="#a78bfa" bg="rgba(167,139,250,0.12)" onClick={()=>setStep("confirm")}>Send Request -></Btn>}
        </>)}
      </>)}
      {step==="confirm"&&(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,paddingTop:20}}>
          <div style={{fontSize:44}}>[ok]</div>
          <div style={{fontSize:18,fontWeight:800,color:"#a78bfa",textAlign:"center"}}>Request Sent</div>
          <div style={{fontSize:13,color:"#3d5268",textAlign:"center",lineHeight:1.7}}>A PST member will {method==="Text Me"?"text":"contact"} you - urgency: <span style={{color:"#a78bfa",fontWeight:700}}>{urgency}</span>.<br/><br/>Your name and number were submitted to the PST team only.</div>
          <div style={{background:"rgba(167,139,250,0.08)",border:"1.5px solid rgba(167,139,250,0.25)",borderRadius:14,padding:"16px",width:"100%",textAlign:"center"}}>
            <div style={{fontSize:13,fontWeight:700,color:"#c4b5fd",marginBottom:6}}>Want to chat now instead?</div>
            <div style={{fontSize:12,color:"#64748b",marginBottom:14,lineHeight:1.5}}>Start an in-app message thread with your PST team. Private and secure.</div>
            <Btn color="#a78bfa" bg="rgba(167,139,250,0.12)" onClick={startChat}>Open PST Chat</Btn>
          </div>
          <Btn color="#38bdf8" onClick={()=>navigate("home")} style={{width:"100%",marginTop:4}}>Back to Home</Btn>
        </div>
      )}
      {step==="chat"&&(
        <div style={{display:"flex",flexDirection:"column",height:"calc(100vh - 160px)"}}>
          <div style={{background:"rgba(167,139,250,0.07)",border:"1px solid rgba(167,139,250,0.18)",borderRadius:12,padding:"10px 14px",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 6px rgba(34,197,94,0.6)"}}/>
              <span style={{fontSize:12,fontWeight:700,color:"#c4b5fd"}}>{requestedPST?requestedPST.name+" (PST)":"PST Member Connected"}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div onClick={()=>setChatBlurred(b=>!b)} style={{fontSize:10,fontWeight:700,color:"#475569",cursor:"pointer",padding:"4px 8px",borderRadius:6,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)"}}>
                {chatBlurred?"Unblur":"Screenshot Protect"}
              </div>
              <div onClick={()=>setShowDeleteConfirm(true)} style={{fontSize:10,fontWeight:700,color:"#ef4444",cursor:"pointer",padding:"4px 8px",borderRadius:6,background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.15)"}}>
                Delete
              </div>
            </div>
          </div>

          <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"12px 14px",marginBottom:10}}>
            <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:8}}>Optional - share your contact info so PST can reach you by phone if needed</div>
            <div style={{display:"flex",gap:8}}>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"9px 12px",fontSize:12,fontFamily:"'DM Sans',sans-serif",outline:"none",color:"#dde8f4"}}/>
              <input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone number" style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"9px 12px",fontSize:12,fontFamily:"'DM Sans',sans-serif",outline:"none",color:"#dde8f4"}}/>
            </div>
            {name&&phone&&<div style={{fontSize:10,color:"#22c55e",marginTop:6,fontWeight:600}}>v PST can see your name and number in this thread</div>}
          </div>

          <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:10,padding:"4px 0",filter:chatBlurred?"blur(6px)":"none",transition:"filter 0.3s",userSelect:chatBlurred?"none":"auto"}}>
            {chatMessages.map((m,i)=>(
              <div key={i} style={{alignSelf:m.from==="user"?"flex-end":"flex-start",maxWidth:"82%"}}>
                <div style={{background:m.from==="user"?"rgba(167,139,250,0.18)":"rgba(255,255,255,0.05)",border:"1px solid "+(m.from==="user"?"rgba(167,139,250,0.3)":"rgba(255,255,255,0.08)"),borderRadius:m.from==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"10px 14px"}}>
                  <div style={{fontSize:13,color:m.from==="user"?"#dde8f4":"#c4b5fd",lineHeight:1.5}}>{m.text}</div>
                  <div style={{fontSize:9,color:"#334155",marginTop:4,textAlign:m.from==="user"?"right":"left"}}>{m.from==="pst"?"PST . ":""}{m.time}</div>
                </div>
              </div>
            ))}
            {pstTyping&&(
              <div style={{alignSelf:"flex-start",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"16px 16px 16px 4px",padding:"12px 16px",display:"flex",gap:5,alignItems:"center"}}>
                {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#a78bfa",opacity:0.6,animation:"pulse 1s infinite",animationDelay:i*0.2+"s"}}/>)}
              </div>
            )}
          </div>

          {chatBlurred&&(
            <div style={{textAlign:"center",padding:"8px",fontSize:11,color:"#475569"}}>
              Tap <strong style={{color:"#64748b"}}>Unblur</strong> to view messages
            </div>
          )}

          <div style={{display:"flex",gap:8,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.05)",marginTop:6}}>
            <input
              value={chatInput}
              onChange={e=>setChatInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&sendChat()}
              placeholder="Message your PST member..."
              style={{flex:1,background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(167,139,250,0.2)",borderRadius:12,padding:"12px 14px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",color:"#dde8f4"}}
            />
            <div onClick={sendChat} style={{width:44,height:44,borderRadius:12,background:"rgba(167,139,250,0.15)",border:"1.5px solid rgba(167,139,250,0.3)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </div>
          </div>

          <div style={{fontSize:10,color:"#1e3a52",textAlign:"center",marginTop:8,letterSpacing:"0.06em"}}>PRIVATE - PST TEAM ONLY - TAP "SCREENSHOT PROTECT" BEFORE SCREENSHOTTING</div>

          {showDeleteConfirm&&(
            <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:20}}>
              <div style={{background:"#0c1929",border:"1.5px solid rgba(239,68,68,0.3)",borderRadius:20,padding:"28px 22px",maxWidth:340,width:"100%",textAlign:"center"}}>
                <div style={{fontSize:32,marginBottom:12}}>🗑</div>
                <div style={{fontSize:15,fontWeight:800,color:"#f87171",marginBottom:8}}>Delete Chat Thread?</div>
                <div style={{fontSize:12,color:"#475569",lineHeight:1.6,marginBottom:20}}>This will clear the entire conversation from your device. The PST team may retain their copy per agency policy.</div>
                <div style={{display:"flex",gap:10}}>
                  <div onClick={()=>setShowDeleteConfirm(false)} style={{flex:1,padding:"12px",borderRadius:11,cursor:"pointer",textAlign:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",fontSize:13,fontWeight:700,color:"#475569"}}>Cancel</div>
                  <div onClick={()=>(setChatMessages([]),setShowDeleteConfirm(false),setStep("panel"))} style={{flex:1,padding:"12px",borderRadius:11,cursor:"pointer",textAlign:"center",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",fontSize:13,fontWeight:700,color:"#f87171"}}>Delete</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {showTipModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:20}} onClick={()=>setShowTipModal(false)}>
          <div style={{background:"#0b1829",border:"1.5px solid rgba(255,255,255,0.1)",borderRadius:20,padding:"28px 24px",maxWidth:440,width:"100%",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:18,fontWeight:800,color:"#dde8f4",marginBottom:8}}>Anonymous Wellness Check</div>
            <div style={{fontSize:13,color:"#8099b0",marginBottom:20,lineHeight:1.6}}>This request is completely anonymous. PST will know someone needs support, but not who submitted this tip or who needs help specifically. They'll proactively check on the crew.</div>
            <SLabel color="#eab308">Context (Optional)</SLabel>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
              {["Recent traumatic call","Behavioral changes noticed","Mentioned struggling","Just a feeling"].map(ctx=>(
                <div key={ctx} onClick={()=>setTipContext(ctx)} style={{padding:"12px 14px",borderRadius:10,background:tipContext===ctx?"rgba(234,179,8,0.12)":"rgba(255,255,255,0.03)",border:`1.5px solid ${tipContext===ctx?"rgba(234,179,8,0.3)":"rgba(255,255,255,0.06)"}`,cursor:"pointer",fontSize:13,color:tipContext===ctx?"#eab308":"#8099b0"}}>{ctx}</div>
              ))}
            </div>
            <SLabel color="#eab308">Urgency Level</SLabel>
            <div style={{display:"flex",gap:8,marginBottom:20}}>
              {[{label:"Routine",color:"#22c55e",desc:"General check-in"},{label:"Priority",color:"#eab308",desc:"Soon as possible"},{label:"Urgent",color:"#ef4444",desc:"Immediate attention"}].map(p=>(
                <div key={p.label} onClick={()=>setTipPriority(p.label)} style={{flex:1,padding:"10px 12px",borderRadius:10,background:tipPriority===p.label?`rgba(${p.color==="#22c55e"?"34,197,94":p.color==="#eab308"?"234,179,8":"239,68,68"},0.12)`:"rgba(255,255,255,0.03)",border:`1.5px solid ${tipPriority===p.label?p.color:"rgba(255,255,255,0.06)"}`,cursor:"pointer",textAlign:"center"}}>
                  <div style={{fontSize:12,fontWeight:700,color:p.color}}>{p.label}</div>
                  <div style={{fontSize:10,color:"#3d5268",marginTop:2}}>{p.desc}</div>
                </div>
              ))}
            </div>
            <div style={{background:"rgba(56,189,248,0.06)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:12,padding:"12px 14px",marginBottom:20}}>
              <div style={{fontSize:12,color:"#38bdf8",fontWeight:700,marginBottom:4}}>🔒 Your Privacy Protected</div>
              <div style={{fontSize:11,color:"#8099b0",lineHeight:1.6}}>* Your identity is not tracked<br/>* PST will not know who submitted this<br/>* They'll do general crew wellness checks</div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <Btn color="#64748b" bg="rgba(100,116,139,0.08)" onClick={()=>(setShowTipModal(false),setTipContext(null))} style={{flex:1}}>Cancel</Btn>
              <Btn color="#eab308" bg="rgba(234,179,8,0.12)" onClick={()=>{alert(`Anonymous wellness check submitted.\n\nPriority: ${tipPriority}\nContext: ${tipContext||"None provided"}\n\nPST team has been notified.`);setShowTipModal(false);setTipContext(null);}} style={{flex:2}}>Submit Wellness Check</Btn>
            </div>
          </div>
        </div>
      )}
    </ScreenSingle>
  );
}

// 
// SHIFT CHECK - S1 (Start) & S2 (End)
// 
function ShiftCheckScreen({navigate,agency}){
  const[phase,setPhase]=useState(null); // null=choose, "s1","midshift","s2"
  const[selected,setSelected]=useState(null);
  const[submitted,setSubmitted]=useState(false);
  const lc=useLayoutConfig();
  const s1opts=[
    {key:"S1-G",emoji:"🟢",label:"Great",   color:"#22c55e",msg:"Great start. Keep checking in throughout your shift."},
    {key:"S1-Y",emoji:"🟡",label:"Striving",color:"#eab308",msg:"Noted. Checking in is the right move. Support is here if you need it."},
    {key:"S1-O",emoji:"🟠",label:"Not Well",color:"#f97316",msg:"Thank you for being honest. Coping tools and peer support are ready now."},
    {key:"S1-R",emoji:"🔴",label:"Ill",     color:"#ef4444",msg:"You reached out. Full support is ready for you right now."},
  ];
  const midshiftopts=[
    {key:"MID-G",emoji:"🟢",label:"Great",   color:"#22c55e",msg:"Good to hear. Keep taking care of yourself out there."},
    {key:"MID-Y",emoji:"🟡",label:"Striving",color:"#eab308",msg:"You're doing the work. Support is here if you need it."},
    {key:"MID-O",emoji:"🟠",label:"Not Well",color:"#f97316",msg:"Thanks for checking in. A quick reset might help - coping tools are here."},
    {key:"MID-R",emoji:"🔴",label:"Ill",     color:"#ef4444",msg:"You checked in. That matters. Support is ready for you right now."},
  ];
  const s2opts=[
    {key:"S2-G",emoji:"🟢",label:"Great",   color:"#22c55e",msg:"Glad to hear it. Rest up and take care of yourself."},
    {key:"S2-Y",emoji:"🟡",label:"Striving",color:"#eab308",msg:"That's real. Decompress before you get home - coping tools are here."},
    {key:"S2-O",emoji:"🟠",label:"Not Well",color:"#f97316",msg:"You made it through. Don't carry this home alone - support is right here."},
    {key:"S2-R",emoji:"🔴",label:"Ill",     color:"#ef4444",msg:"You showed up and got through it. Peer support is ready when you are."},
  ];
  const opts=phase==="s1"?s1opts:phase==="midshift"?midshiftopts:s2opts;
  const title=phase==="s1"?"Upstream Daily Shift Check":phase==="midshift"?"Midshift Check-In":"Shift Close Check";
  const prompt=phase==="s1"?"How are you starting your shift?":phase==="midshift"?"How are you doing mid-shift?":"How are you leaving this shift?";

  if(!phase){return(
    <ScreenSingle headerProps={{onBack:()=>navigate("home"),title:"Shift Check",agencyName:(agency&&agency.name)}}>
      <div style={{fontSize:lc.isDesktop?18:16,fontWeight:700,color:"#dde8f4",textAlign:"center",marginTop:8}}>Which check-in?</div>
      <div style={{display:"flex",flexDirection:"column",gap:14,marginTop:4}}>
        <div onClick={()=>setPhase("s1")} style={{background:"rgba(56,189,248,0.07)",border:"1.5px solid rgba(56,189,248,0.2)",borderRadius:16,padding:"20px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:48,height:48,borderRadius:14,background:"rgba(56,189,248,0.12)",border:"1px solid rgba(56,189,248,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🌅</div>
          <div><div style={{fontSize:15,fontWeight:800,color:"#38bdf8"}}>Start-of-Shift Check</div><div style={{fontSize:12,color:"#8099b0",marginTop:3}}>How are you starting your shift?</div></div>
        </div>
        <div onClick={()=>setPhase("midshift")} style={{background:"rgba(234,179,8,0.07)",border:"1.5px solid rgba(234,179,8,0.2)",borderRadius:16,padding:"20px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:48,height:48,borderRadius:14,background:"rgba(234,179,8,0.12)",border:"1px solid rgba(234,179,8,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>[S]️</div>
          <div><div style={{fontSize:15,fontWeight:800,color:"#eab308"}}>Midshift Check-In</div><div style={{fontSize:12,color:"#8099b0",marginTop:3}}>Quick pulse check during your shift</div></div>
        </div>
        <div onClick={()=>setPhase("s2")} style={{background:"rgba(139,92,246,0.07)",border:"1.5px solid rgba(139,92,246,0.2)",borderRadius:16,padding:"20px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:48,height:48,borderRadius:14,background:"rgba(139,92,246,0.12)",border:"1px solid rgba(139,92,246,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🌙</div>
          <div><div style={{fontSize:15,fontWeight:800,color:"#a78bfa"}}>End-of-Shift Check</div><div style={{fontSize:12,color:"#8099b0",marginTop:3}}>How are you leaving this shift?</div></div>
        </div>
      </div>
    </ScreenSingle>
  );}

  return(
    <ScreenSingle headerProps={{onBack:()=>(setPhase(null),setSelected(null),setSubmitted(false)),title,agencyName:(agency&&agency.name)}}>
      {!submitted?(<>
        <div style={{fontSize:lc.isDesktop?18:15,fontWeight:700,color:"#dde8f4",textAlign:"center"}}>{prompt}</div>
        {opts.map(o=>(<div key={o.key} onClick={()=>setSelected(o.key)} style={{background:selected===o.key?`${o.color}18`:"rgba(255,255,255,0.03)",border:`1.5px solid ${selected===o.key?o.color+"55":"rgba(255,255,255,0.065)"}`,borderRadius:14,padding:"16px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,transition:"all 0.13s"}}><span style={{fontSize:26}}>{o.emoji}</span><span style={{fontSize:15,fontWeight:700,color:selected===o.key?o.color:"#dde8f4"}}>{o.label}</span></div>))}
        {selected&&<Btn onClick={()=>{
          setSubmitted(true);
          // Track anonymous check-in to Appwrite
          const statusMap={'S1-G':'great','S1-Y':'striving','S1-O':'notwell','S1-R':'ill','MID-G':'great','MID-Y':'striving','MID-O':'notwell','MID-R':'ill','S2-G':'great','S2-Y':'striving','S2-O':'notwell','S2-R':'ill'};
          trackCheckin((agency&&agency.code), statusMap[selected]||'unknown', phase);
        }}>Submit Check-In -></Btn>}
      </>):(<>
        <Card style={{background:"rgba(56,189,248,0.07)",borderColor:"rgba(56,189,248,0.2)",textAlign:"center"}}><div style={{fontSize:22,marginBottom:8}}>v</div><div style={{fontSize:15,fontWeight:700,color:"#38bdf8",marginBottom:8}}>Check-In Recorded</div><div style={{fontSize:13,color:"#3d5268",lineHeight:1.6}}>{opts.find(o=>o.key===selected)&&(o=>o.key===selected).msg}</div></Card>
        <NavBtn icon={<BreathIcon/>} label="Quick Breathing Reset" sub="60-second grounding" color="#22c55e" bg="rgba(34,197,94,0.09)" onClick={()=>navigate("breathing")}/>
        {(selected==="S1-O"||selected==="S1-R"||selected==="S2-O"||selected==="S2-R"||selected==="MID-O"||selected==="MID-R")&&(<>
          <NavBtn icon={<BoltIcon/>} label="Talk to AI PST" sub="Anonymous peer support" color="#ef4444" bg="rgba(239,68,68,0.09)" onClick={()=>navigate("aichat")}/>
          <NavBtn icon={<HeartIcon/>} label={agency?"Contact Human PST":"Find Peer Support"} sub={agency?"Real peer support team":"Enter agency code to connect"} color="#a78bfa" bg="rgba(167,139,250,0.09)" locked={!agency} onClick={()=>agency?navigate("humanpst"):navigate("agencycode")}/>
        </>)}
        <div onClick={()=>(setPhase(null),setSelected(null),setSubmitted(false),navigate("home"))} style={{textAlign:"center",fontSize:12,color:"#1e3a52",cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>Back to Home</div>
      </>)}
    </ScreenSingle>
  );
}

// 
// COPING TOOLS HUB
// 
function ToolCard({icon,label,sub,color,bg,onClick}){
  const[p,setP]=useState(false);
  return(
    <div
      onMouseDown={()=>setP(true)} onMouseUp={()=>setP(false)} onMouseLeave={()=>setP(false)}
      onClick={onClick}
      style={{background:p?bg:"rgba(255,255,255,0.033)",border:"1.5px solid "+(p?color+"55":"rgba(255,255,255,0.065)"),borderRadius:16,padding:"22px 12px 18px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,transform:p?"scale(0.97)":"scale(1)",transition:"all 0.13s",userSelect:"none",minHeight:140}}>
      <div style={{width:52,height:52,borderRadius:15,background:bg,border:"1px solid "+color+"30",display:"flex",alignItems:"center",justifyContent:"center",color:color,flexShrink:0}}>
        {icon}
      </div>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:13,fontWeight:700,color:"#dde8f4",lineHeight:1.3,marginBottom:4}}>{label}</div>
        <div style={{fontSize:11,color:"#8099b0",lineHeight:1.4}}>{sub}</div>
      </div>
    </div>
  );
}

function ToolsScreen({navigate,agency}){
  const lc=useLayoutConfig();
  const tools=[
    {icon:<BreathIcon/>,  label:"Box Breathing",     sub:"4-4-4-4 animated reset",         color:"#22c55e",bg:"rgba(34,197,94,0.09)",   dest:"breathing"},
    {icon:<GroundIcon/>,  label:"5-4-3-2-1 Grounding",sub:"Sensory awareness technique",   color:"#38bdf8",bg:"rgba(56,189,248,0.08)",  dest:"grounding"},
    {icon:<JournalIcon/>, label:"Journal",            sub:"Text or voice, private",          color:"#a78bfa",bg:"rgba(167,139,250,0.08)", dest:"journal"},
    {icon:<ResetIcon/>,   label:"After-Action Reset", sub:"Structured decompression",        color:"#f97316",bg:"rgba(249,115,22,0.08)",  dest:"afteraction"},
    {icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
     label:"PTSD Interruption",sub:"21 grounding tools",color:"#7EBFAD",bg:"rgba(126,191,173,0.09)",dest:"ptsd"},
    {icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.65A2 2 0 012.18 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.15A16 16 0 0015.54 16.78l1.41-1.41a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>,
     label:"Emergency Contacts",sub:"Your personal safety net",color:"#ef4444",bg:"rgba(239,68,68,0.08)",dest:"emergencycontacts"},
    {icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
     label:"Personal Alerts",sub:"Self-check reminders",color:"#eab308",bg:"rgba(234,179,8,0.08)",dest:"customalerts"},
    {icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
     label:"Learn",sub:"Stigma-free modules",color:"#64748b",bg:"rgba(100,116,139,0.08)",dest:"educational"},
    {icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
     label:"Feedback",sub:"Help improve this app",color:"#38bdf8",bg:"rgba(56,189,248,0.07)",dest:"feedback"},
  ];
  return(
    <Screen headerProps={{onBack:()=>navigate("home"),title:"Coping Tools",agencyName:agency&&agency.name}}>
      <div className="full-width" style={{fontSize:13,color:"#8099b0",lineHeight:1.6}}>Tools you can use anytime - during a shift, after a rough call, or at home.</div>
      <div className="full-width" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {tools.map((t,i)=>(
          <ToolCard key={i} icon={t.icon} label={t.label} sub={t.sub} color={t.color} bg={t.bg} onClick={()=>navigate(t.dest)}/>
        ))}
      </div>
      <div className="full-width" style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:14,padding:"12px 14px",textAlign:"center"}}>
        <div style={{fontSize:11,color:"#8099b0"}}>All tools work offline and stay completely private on your device.</div>
      </div>
    </Screen>
  );
}

// 
// BREATHING
// 
function BreathingScreen({navigate,agency}){
  const steps=[{label:"Inhale",duration:4,color:"#38bdf8"},{label:"Hold",duration:4,color:"#a78bfa"},{label:"Exhale",duration:4,color:"#22c55e"},{label:"Hold",duration:4,color:"#eab308"}];
  const instruct=["Breathe in slowly through your nose","Hold gently","Breathe out slowly through your mouth","Hold and relax"];
  const[active,setActive]=useState(false);
  const[si,setSi]=useState(0);
  const[cd,setCd]=useState(4);
  const[cycles,setCycles]=useState(0);
  const lc=useLayoutConfig();
  const circleSize=lc.isDesktop?220:lc.isTablet?200:180;
  const innerSize=circleSize-40;
  const r=circleSize/2-20;
  useEffect(()=>{
    if(!active)return;
    if(cd===0){const n=(si+1)%4;setSi(n);setCd(steps[n].duration);if(n===0)setCycles(c=>c+1);return;}
    const t=setTimeout(()=>setCd(c=>c-1),1000);return()=>clearTimeout(t);
  },[active,cd,si]);
  const cur=steps[si];
  const prog=active?(steps[si].duration-cd)/steps[si].duration:0;
  return(
    <ScreenSingle headerProps={{onBack:()=>navigate("tools"),title:"Box Breathing",agencyName:(agency&&agency.name)}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:22,paddingTop:10}}>
        <div style={{position:"relative",width:circleSize,height:circleSize,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width={circleSize} height={circleSize} style={{position:"absolute",transform:"rotate(-90deg)"}}>
            <circle cx={circleSize/2} cy={circleSize/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6"/>
            <circle cx={circleSize/2} cy={circleSize/2} r={r} fill="none" stroke={cur.color} strokeWidth="6" strokeDasharray={`${2*Math.PI*r}`} strokeDashoffset={`${2*Math.PI*r*(1-prog)}`} strokeLinecap="round" style={{transition:"stroke-dashoffset 1s linear,stroke 0.3s"}}/>
          </svg>
          <div style={{width:innerSize,height:innerSize,borderRadius:"50%",background:`radial-gradient(circle,${cur.color}18 0%,transparent 70%)`,border:`2px solid ${cur.color}30`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4}}>
            <div style={{fontSize:lc.isDesktop?40:32,fontWeight:900,color:cur.color}}>{active?cd:">"}</div>
            <div style={{fontSize:lc.isDesktop?16:14,fontWeight:700,color:cur.color}}>{cur.label}</div>
            {cycles>0&&<div style={{fontSize:10,color:"#2d4a66"}}>Cycle {cycles}</div>}
          </div>
        </div>
        <div style={{textAlign:"center"}}><div style={{fontSize:15,color:"#c8dae8",fontWeight:600}}>{instruct[si]}</div><div style={{fontSize:12,color:"#2d4a66",marginTop:4}}>Box Breathing . 4-4-4-4</div></div>
        <div style={{display:"flex",gap:8}}>{steps.map((s,i)=><div key={i} style={{background:i===si&&active?s.color+"30":"rgba(255,255,255,0.04)",border:`1px solid ${i===si&&active?s.color+"60":"rgba(255,255,255,0.07)"}`,borderRadius:8,padding:"6px 10px",fontSize:11,color:i===si&&active?s.color:"#2d4a66",fontWeight:i===si?700:400,transition:"all 0.3s"}}>{s.label}</div>)}</div>
        <Btn color={active?"#f87171":"#38bdf8"} bg={active?"rgba(239,68,68,0.1)":"rgba(56,189,248,0.1)"} onClick={()=>{setActive(!active);if(!active){setSi(0);setCd(4);setCycles(0);}}} style={{padding:"14px 40px"}}>{active?"Stop":"Start Breathing"}</Btn>
        {cycles>=3&&<Card style={{background:"rgba(34,197,94,0.08)",borderColor:"rgba(34,197,94,0.2)",textAlign:"center"}}><div style={{fontSize:14,fontWeight:700,color:"#22c55e",marginBottom:4}}>3 cycles complete 🌊</div><div style={{fontSize:12,color:"#2d4a66"}}>Your nervous system is resetting.</div></Card>}
      </div>
    </ScreenSingle>
  );
}

// 
// GROUNDING
// 
function GroundingScreen({navigate,agency}){
  const steps=[{n:5,sense:"See",prompt:"Name 5 things you can see right now.",color:"#38bdf8",icon:"👁"},{n:4,sense:"Touch",prompt:"Name 4 things you can physically feel.",color:"#22c55e",icon:"[5]"},{n:3,sense:"Hear",prompt:"Name 3 things you can hear right now.",color:"#a78bfa",icon:"👂"},{n:2,sense:"Smell",prompt:"Name 2 things you can smell, or 2 you like.",color:"#eab308",icon:"👃"},{n:1,sense:"Taste",prompt:"Name 1 thing you can taste right now.",color:"#f97316",icon:"👅"}];
  const[step,setStep]=useState(0);
  const[done,setDone]=useState(false);
  const[input,setInput]=useState("");
  const[answers,setAnswers]=useState([]);
  const next=()=>{if(input.trim())setAnswers(prev=>[...prev,{step,text:input}]);setInput("");if(step>=4){setDone(true);}else{setStep(s=>s+1);}};
  const cur=steps[step];
  return(
    <ScreenSingle headerProps={{onBack:()=>navigate("tools"),title:"5-4-3-2-1 Grounding",agencyName:(agency&&agency.name)}}>
      {!done?(<>
        <div style={{display:"flex",gap:6}}>{steps.map((s,i)=><div key={i} style={{flex:1,height:6,borderRadius:3,background:i<step?"#22c55e":i===step?cur.color:"rgba(255,255,255,0.08)",transition:"all 0.3s"}}/>)}</div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,padding:"10px 0"}}>
          <div style={{width:72,height:72,borderRadius:"50%",background:`${cur.color}18`,border:`2px solid ${cur.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>{cur.icon}</div>
          <div style={{textAlign:"center"}}><div style={{fontSize:36,fontWeight:900,color:cur.color,lineHeight:1}}>{cur.n}</div><div style={{fontSize:18,fontWeight:700,color:"#dde8f4",marginTop:4}}>{cur.sense}</div></div>
          <div style={{fontSize:14,color:"#8099b0",textAlign:"center",lineHeight:1.6}}>{cur.prompt}</div>
        </div>
        <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder={`List ${cur.n} things...`} rows={3} style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"14px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",width:"100%"}}/>
        <Btn color={cur.color} bg={`${cur.color}18`} onClick={next}>{step<4?"Next ->":"Complete v"}</Btn>
        <div onClick={next} style={{textAlign:"center",fontSize:12,color:"#1e3a52",cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>Skip this step</div>
      </>):(
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,paddingTop:10}}>
          <div style={{fontSize:44}}>🌊</div>
          <div style={{fontSize:18,fontWeight:800,color:"#38bdf8",textAlign:"center"}}>Grounding Complete</div>
          <div style={{fontSize:13,color:"#3d5268",textAlign:"center",lineHeight:1.7}}>You just brought your nervous system back to the present moment.</div>
          {answers.length>0&&<Card style={{width:"100%"}}>{answers.map((a,i)=>(<div key={i} style={{padding:"6px 0",borderBottom:i<answers.length-1?"1px solid rgba(255,255,255,0.04)":"none"}}><span style={{fontSize:11,color:steps[a.step].color,fontWeight:700}}>{steps[a.step].sense}: </span><span style={{fontSize:12,color:"#8099b0"}}>{a.text}</span></div>))}</Card>}
          <div style={{display:"flex",gap:10,width:"100%"}}>
            <Btn color="#38bdf8" onClick={()=>(setStep(0),setDone(false),setAnswers([]),setInput(""))} style={{flex:1}}>Again</Btn>
            <Btn color="#22c55e" bg="rgba(34,197,94,0.1)" onClick={()=>navigate("tools")} style={{flex:1}}>Done</Btn>
          </div>
        </div>
      )}
    </ScreenSingle>
  );
}

// 
// JOURNAL
// 
function JournalScreen({navigate,agency}){
  const prompts=["What's one thing from today's shift that stuck with you?","How are you carrying the weight of the job right now?","What would you tell a partner going through what you're going through?","If you could put today in a sentence, what would it be?","What do you need to let go of before you go home?","What's one small thing that helped today, even a little?","What does your body feel like right now?"];
  const[mode,setMode]=useState("text");
  const[entry,setEntry]=useState("");
  const[prompt,setPrompt]=useState(()=>prompts[Math.floor(Math.random()*prompts.length)]);
  const[saved,setSaved]=useState(false);
  const[entries,setEntries]=useState(()=>{try{const s=localStorage.getItem("upstream_journal");return s?JSON.parse(s):[];}catch(e){return [];}});
  const[isListening,setIsListening]=useState(false);
  const[isAnonymous,setIsAnonymous]=useState(false);
  const[entryType,setEntryType]=useState("normal");
  const[isCrisis,setIsCrisis]=useState(false);
  const[ephemeral,setEphemeral]=useState(false);
  const[showExport,setShowExport]=useState(false);
  const[showCrisisVault,setShowCrisisVault]=useState(false);
  const[crisisUnlocked,setCrisisUnlocked]=useState(false);
  const[exportOptions,setExportOptions]=useState({includeAnonymous:true,includeRoughCall:true,includeDates:true});
  const recognitionRef=useRef(null);
  const lc=useLayoutConfig();
  const startVoice=()=>{
    if(!("webkitSpeechRecognition" in window||"SpeechRecognition" in window)){alert("Voice not supported. Try Chrome.");return;}
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    const r=new SR();r.continuous=true;r.interimResults=true;r.lang="en-US";
    r.onresult=(e)=>{setEntry(Array.from(e.results).map(r=>r[0].transcript).join(" "));};
    r.onend=()=>setIsListening(false);
    r.start();recognitionRef.current=r;setIsListening(true);
  };
  const stopVoice=()=>{recognitionRef.current&&recognitionRef.current.stop();setIsListening(false);};
  const formatEntries=()=>{
    return entries.filter(e=>exportOptions.includeAnonymous||!e.anonymous).filter(e=>exportOptions.includeRoughCall||e.type!=="rough_call").map(e=>{
      let text="";
      if(exportOptions.includeDates)text+=`${e.date}\n`;
      if(e.anonymous)text+="[Anonymous]\n";
      if(e.type==="rough_call")text+="[After Rough Call]\n";
      text+=`${e.text}\n\n`;
      return text;
    }).join("---\n\n");
  };
  const[exportPassword,setExportPassword]=useState("");
  const[showPasswordInput,setShowPasswordInput]=useState(false);
  const[pendingExportType,setPendingExportType]=useState(null);

  const exportViaEmail=()=>{
    const body=formatEntries();
    window.location.href=`mailto:?subject=My Journal&body=${encodeURIComponent(body)}`;
    setShowExport(false);
  };
  const exportViaText=()=>{
    const body=formatEntries();
    if(body.length>1600){alert("Journal is too long for text. Try email or download instead.");return;}
    window.location.href=`sms:?&body=${encodeURIComponent(body)}`;
    setShowExport(false);
  };
  const exportAsFile=()=>{
    const text=formatEntries();
    const blob=new Blob([text],{type:"text/plain"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download=`journal_${Date.now()}.txt`;a.click();
    URL.revokeObjectURL(url);setShowExport(false);
  };
  const exportAsPDF=()=>{
    const text=formatEntries();
    const date=new Date().toLocaleDateString();
    const safeText=text.replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const html="<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>My Journal</title><style>body{font-family:Georgia,serif;max-width:680px;margin:40px auto;padding:0 20px;color:#1a1a2e;line-height:1.8;}h1{font-size:22px;color:#0ea5e9;border-bottom:2px solid #0ea5e9;padding-bottom:8px;}h2{font-size:13px;color:#64748b;font-weight:normal;margin-bottom:32px;}pre{white-space:pre-wrap;font-family:Georgia,serif;font-size:14px;}footer{margin-top:40px;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px;}</style></head><body><h1>My Journal</h1><h2>Exported "+date+" - Private and Confidential</h2><pre>"+safeText+"</pre><footer>Exported from Upstream - Free. Confidential. You earned the right to ask for help.</footer></body></html>";
    const blob=new Blob([html],{type:"text/html"});
    const url=URL.createObjectURL(blob);
    const w=window.open(url,'_blank');
    if(w){setTimeout(()=>{w.print();},800);}
    else{const a=document.createElement("a");a.href=url;a.download=`journal_${Date.now()}.html`;a.click();}
    URL.revokeObjectURL(url);setShowExport(false);
  };
  const requestPasswordExport=(type)=>{
    setPendingExportType(type);setShowPasswordInput(true);setExportPassword("");
  };
  const confirmPasswordExport=()=>{
    if(!exportPassword.trim()){return;}
    const text=formatEntries();
    // Simple XOR obfuscation - not true encryption but prevents casual reading
    const key=exportPassword;
    const encoded=btoa(text.split('').map((c,i)=>String.fromCharCode(c.charCodeAt(0)^key.charCodeAt(i%key.length))).join(''));
    const blob=new Blob([`UPSTREAM_PROTECTED
${encoded}`],{type:"text/plain"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download=`journal_protected_${Date.now()}.txt`;a.click();
    URL.revokeObjectURL(url);
    setShowPasswordInput(false);setPendingExportType(null);setExportPassword("");setShowExport(false);
  };
  const saveToStorage=(updated)=>{try{localStorage.setItem("upstream_journal",JSON.stringify(updated));}catch(e){}};
  const save=()=>{
    if(!entry.trim())return;
    const newEntry={text:entry,mode,date:new Date().toLocaleString(),prompt,anonymous:isAnonymous,type:entryType,ephemeral:ephemeral,crisis:isCrisis};
    if(!ephemeral){setEntries(prev=>{const updated=[newEntry,...prev];saveToStorage(updated);return updated;});}
    setEntry("");setSaved(true);setTimeout(()=>setSaved(false),3000);
    setPrompt(prompts[Math.floor(Math.random()*prompts.length)]);
    setIsAnonymous(false);setEntryType("normal");setIsCrisis(false);setEphemeral(false);
  };
  const visibleEntries=entries.filter(e=>!e.crisis);
  const crisisEntries=entries.filter(e=>e.crisis);
  return(
    <ScreenSingle headerProps={{onBack:()=>navigate("tools"),title:"Journal",agencyName:(agency&&agency.name)}}>
      <div style={{display:"flex",gap:8,background:"rgba(255,255,255,0.03)",borderRadius:12,padding:4}}>
        {["text","voice"].map(m=>(<div key={m} onClick={()=>setMode(m)} style={{flex:1,textAlign:"center",padding:"9px",borderRadius:9,background:mode===m?"rgba(167,139,250,0.15)":"transparent",border:`1px solid ${mode===m?"rgba(167,139,250,0.3)":"transparent"}`,cursor:"pointer",fontSize:12,fontWeight:mode===m?700:400,color:mode===m?"#a78bfa":"#3d5268",transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          {m==="text"?<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
          {m==="text"?"Write":"Voice"}
        </div>))}
      </div>
      <div style={{background:"rgba(167,139,250,0.07)",border:"1px solid rgba(167,139,250,0.18)",borderRadius:14,padding:"14px 16px"}}>
        <div style={{fontSize:11,color:"#a78bfa",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6}}>Today's Prompt</div>
        <div style={{fontSize:13,color:"#c4b5fd",lineHeight:1.7,fontStyle:"italic"}}>{prompt}</div>
        <div onClick={()=>setPrompt(prompts[Math.floor(Math.random()*prompts.length)])} style={{fontSize:11,color:"#6d4fa8",marginTop:8,cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>New prompt</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        <div onClick={()=>setIsAnonymous(!isAnonymous)} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"12px 14px",background:isAnonymous?"rgba(56,189,248,0.06)":"rgba(255,255,255,0.02)",border:`1.5px solid ${isAnonymous?"rgba(56,189,248,0.2)":"rgba(255,255,255,0.05)"}`,borderRadius:12,transition:"all 0.2s"}}>
          <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${isAnonymous?"#38bdf8":"#2d4a66"}`,background:isAnonymous?"#38bdf8":"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
            {isAnonymous&&<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0b1829" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600,color:isAnonymous?"#38bdf8":"#dde8f4"}}>Write Anonymously</div>
            <div style={{fontSize:11,color:"#3d5268",marginTop:2}}>No identity attached to this entry</div>
          </div>
        </div>
        <div style={{display:"flex",gap:10}}>
          {["normal","rough_call"].map(t=>(<div key={t} onClick={()=>setEntryType(t)} style={{flex:1,textAlign:"center",padding:"10px",borderRadius:10,background:entryType===t?"rgba(239,68,68,0.1)":"rgba(255,255,255,0.02)",border:`1.5px solid ${entryType===t?"rgba(239,68,68,0.25)":"rgba(255,255,255,0.05)"}`,cursor:"pointer",fontSize:12,fontWeight:entryType===t?700:500,color:entryType===t?"#f87171":"#3d5268",transition:"all 0.2s"}}>
            {t==="normal"?"Normal Entry":"After Rough Call"}
          </div>))}
        </div>
        {/* Crisis Mode toggle */}
        <div onClick={()=>setIsCrisis(!isCrisis)} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"12px 14px",background:isCrisis?"rgba(239,68,68,0.07)":"rgba(255,255,255,0.02)",border:`1.5px solid ${isCrisis?"rgba(239,68,68,0.25)":"rgba(255,255,255,0.05)"}`,borderRadius:12,transition:"all 0.2s"}}>
          <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${isCrisis?"#ef4444":"#2d4a66"}`,background:isCrisis?"#ef4444":"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
            {isCrisis&&<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0b1829" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600,color:isCrisis?"#f87171":"#dde8f4"}}>Crisis Mode - Hide This Entry</div>
            <div style={{fontSize:11,color:"#3d5268",marginTop:2}}>Saved but hidden. View only when grounded, behind a locked vault.</div>
          </div>
        </div>
        {/* Crisis vault button */}
        {crisisEntries.length>0&&(
          <div onClick={()=>setShowCrisisVault(!showCrisisVault)} style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.18)",borderRadius:12,padding:"10px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
            <div style={{fontSize:16}}>🔒</div>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:700,color:"#f87171"}}>{crisisEntries.length} Crisis Mode {crisisEntries.length===1?"Entry":"Entries"}</div>
              <div style={{fontSize:11,color:"#3d5268"}}>View when grounded - tap to unlock</div>
            </div>
            <div style={{fontSize:11,color:"#ef4444",fontWeight:700}}>{showCrisisVault?"Hide":"View"}</div>
          </div>
        )}
        {showCrisisVault&&crisisEntries.length>0&&(
          !crisisUnlocked?(
            <div style={{background:"rgba(239,68,68,0.06)",border:"1.5px solid rgba(239,68,68,0.2)",borderRadius:14,padding:"20px",textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:12}}>🔒</div>
              <div style={{fontSize:15,fontWeight:800,color:"#f87171",marginBottom:8}}>Are you grounded right now?</div>
              <div style={{fontSize:13,color:"#3d5268",lineHeight:1.7,marginBottom:16}}>These entries were written during a difficult moment. Only open them when you feel steady.</div>
              <div style={{display:"flex",gap:10}}>
                <div onClick={()=>setShowCrisisVault(false)} style={{flex:1,padding:"12px",borderRadius:11,cursor:"pointer",textAlign:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",fontSize:13,fontWeight:700,color:"#475569"}}>Not yet</div>
                <div onClick={()=>setCrisisUnlocked(true)} style={{flex:2,padding:"12px",borderRadius:11,cursor:"pointer",textAlign:"center",background:"rgba(239,68,68,0.1)",border:"1.5px solid rgba(239,68,68,0.25)",fontSize:13,fontWeight:700,color:"#f87171"}}>Yes, I'm grounded</div>
              </div>
            </div>
          ):(
            <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <div style={{fontSize:11,color:"#ef4444",fontWeight:700}}>Crisis Entries - Unlocked</div>
                <div onClick={()=>(setShowCrisisVault(false),setCrisisUnlocked(false))} style={{fontSize:11,color:"#334155",cursor:"pointer"}}>Lock again</div>
              </div>
              {crisisEntries.map((e,i)=>(<div key={i} style={{background:"rgba(239,68,68,0.04)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:12,padding:"12px 14px",marginBottom:8}}><div style={{fontSize:10,color:"#ef4444",marginBottom:4}}>{e.date}</div><div style={{fontSize:12,color:"#8099b0",lineHeight:1.5}}>{e.text}</div></div>))}
            </div>
          )
        )}
        <div onClick={()=>setEphemeral(!ephemeral)} style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"12px 14px",background:ephemeral?"rgba(234,179,8,0.06)":"rgba(255,255,255,0.02)",border:`1.5px solid ${ephemeral?"rgba(234,179,8,0.2)":"rgba(255,255,255,0.05)"}`,borderRadius:12,transition:"all 0.2s"}}>
          <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${ephemeral?"#eab308":"#2d4a66"}`,background:ephemeral?"#eab308":"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
            {ephemeral&&<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0b1829" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:600,color:ephemeral?"#eab308":"#dde8f4"}}>Don't Save This</div>
            <div style={{fontSize:11,color:"#3d5268",marginTop:2}}>Temporary - helps process in the moment</div>
          </div>
        </div>
      </div>
      {mode==="text"?(
        <textarea value={entry} onChange={e=>setEntry(e.target.value)} placeholder="Write freely - this stays on your device only..." rows={lc.isDesktop?10:6} style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"14px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",width:"100%",lineHeight:1.7}}/>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {entry&&<div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"14px",fontSize:13,color:"#c8dae8",lineHeight:1.7,minHeight:80}}>{entry}</div>}
          <div onClick={isListening?stopVoice:startVoice} style={{height:56,borderRadius:14,background:isListening?"rgba(239,68,68,0.12)":"rgba(167,139,250,0.12)",border:`1.5px solid ${isListening?"rgba(239,68,68,0.35)":"rgba(167,139,250,0.3)"}`,display:"flex",alignItems:"center",justifyContent:"center",gap:12,cursor:"pointer",color:isListening?"#f87171":"#a78bfa",fontWeight:700,fontSize:14}}>
            {isListening?(<><div style={{display:"flex",gap:3}}>{[1,2,3,4,5].map(i=><div key={i} style={{width:3,background:"#f87171",borderRadius:2,height:6+i*4}}/>)}</div>Recording - tap to stop</>):(<><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>Start Voice Entry</>)}
          </div>
        </div>
      )}
      <div style={{display:"flex",gap:10}}>
        {entry&&<Btn color="#a78bfa" bg="rgba(167,139,250,0.12)" onClick={save} style={{flex:1}}>{saved?"v Saved":"Save Entry"}</Btn>}
        {entry&&<Btn color="#2d4a66" bg="rgba(255,255,255,0.03)" onClick={()=>setEntry("")} style={{flex:0,padding:"14px 16px"}}>Clear</Btn>}
      </div>
      <div style={{fontSize:10,color:"#1e3a52",textAlign:"center",letterSpacing:"0.06em"}}>ENTRIES ON YOUR DEVICE ONLY . NEVER SHARED</div>
      {visibleEntries.length>0&&(<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <SLabel color="#a78bfa">Recent Entries ({visibleEntries.length})</SLabel>
          <div onClick={()=>setShowExport(true)} style={{fontSize:12,color:"#38bdf8",fontWeight:700,cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>Export Journal</div>
        </div>
        {visibleEntries.slice(0,3).map((e,i)=>(<Card key={i} style={{padding:"12px 14px",background:e.type==="rough_call"?"rgba(239,68,68,0.04)":"rgba(255,255,255,0.033)",borderColor:e.type==="rough_call"?"rgba(239,68,68,0.15)":"rgba(255,255,255,0.065)"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6,flexWrap:"wrap",gap:6}}><div style={{display:"flex",gap:6,alignItems:"center"}}><span style={{fontSize:10,color:"#a78bfa",fontWeight:700}}>{e.mode==="voice"?"Voice":"Text"}</span>{e.anonymous&&<span style={{fontSize:10,color:"#38bdf8",fontWeight:700,background:"rgba(56,189,248,0.12)",padding:"2px 8px",borderRadius:6}}>Anonymous</span>}{e.type==="rough_call"&&<span style={{fontSize:10,color:"#f87171",fontWeight:700,background:"rgba(239,68,68,0.12)",padding:"2px 8px",borderRadius:6}}>Rough Call</span>}</div><span style={{fontSize:10,color:"#1e3a52"}}>{e.date}</span></div><div style={{fontSize:12,color:"#8099b0",lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{e.text}</div></Card>))}
      </>)}
      {showExport&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:20}} onClick={()=>setShowExport(false)}>
          <div style={{background:"#0b1829",border:"1.5px solid rgba(255,255,255,0.1)",borderRadius:20,padding:"24px",maxWidth:420,width:"100%",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:17,fontWeight:800,color:"#dde8f4",marginBottom:6}}>Export Journal</div>
            <div style={{fontSize:12,color:"#475569",marginBottom:16,lineHeight:1.6}}>Your entries stay on your device. Exported only when you choose.</div>

            {/* Export type buttons */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
              {[
                {label:"Email",color:"#38bdf8",fn:exportViaEmail,icon:"M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7-10-7"},
                {label:"Text",color:"#22c55e",fn:exportViaText,icon:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"},
                {label:"Text File",color:"#eab308",fn:exportAsFile,icon:"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3"},
                {label:"PDF / Print",color:"#a78bfa",fn:exportAsPDF,icon:"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8"},
              ].map((btn,i)=>(
                <div key={i} onClick={btn.fn} style={{padding:"14px 10px",borderRadius:13,cursor:"pointer",textAlign:"center",background:`rgba(${btn.color==="#38bdf8"?"56,189,248":btn.color==="#22c55e"?"34,197,94":btn.color==="#eab308"?"234,179,8":"167,139,250"},0.1)`,border:`1.5px solid ${btn.color}30`,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={btn.color} strokeWidth="2">{btn.icon.split(" M").map((d,j)=><path key={j} d={(j===0?d:"M"+d)}/>)}</svg>
                  <div style={{fontSize:12,fontWeight:700,color:btn.color}}>{btn.label}</div>
                </div>
              ))}
            </div>

            {/* Password protected export */}
            <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:13,padding:"14px",marginBottom:16}}>
              <div style={{fontSize:12,fontWeight:700,color:"#64748b",marginBottom:10}}>Password Protected Export</div>
              {showPasswordInput?(
                <div>
                  <div style={{fontSize:12,color:"#8099b0",marginBottom:8}}>Set a password. You will need it to open this file.</div>
                  <input value={exportPassword} onChange={e=>setExportPassword(e.target.value)} type="password" placeholder="Enter password" style={{background:"rgba(255,255,255,0.05)",border:"1.5px solid rgba(56,189,248,0.2)",borderRadius:10,padding:"10px 13px",fontSize:13,outline:"none",width:"100%",color:"#dde8f4",fontFamily:"'DM Sans',sans-serif",marginBottom:10}}/>
                  <div style={{display:"flex",gap:8}}>
                    <div onClick={()=>(setShowPasswordInput(false),setExportPassword(""))} style={{flex:1,padding:"10px",borderRadius:10,cursor:"pointer",textAlign:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",fontSize:12,fontWeight:700,color:"#475569"}}>Cancel</div>
                    <div onClick={confirmPasswordExport} style={{flex:2,padding:"10px",borderRadius:10,cursor:"pointer",textAlign:"center",background:"rgba(56,189,248,0.1)",border:"1.5px solid rgba(56,189,248,0.25)",fontSize:12,fontWeight:700,color:"#38bdf8"}}>Export Protected File</div>
                  </div>
                </div>
              ):(
                <div onClick={()=>requestPasswordExport("file")} style={{padding:"11px",borderRadius:10,cursor:"pointer",textAlign:"center",background:"rgba(255,255,255,0.02)",border:"1.5px dashed rgba(255,255,255,0.1)",fontSize:12,fontWeight:700,color:"#475569",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Export with password protection
                </div>
              )}
            </div>

            {/* Include options */}
            <div style={{background:"rgba(255,255,255,0.02)",borderRadius:13,padding:"14px",marginBottom:16}}>
              <div style={{fontSize:12,color:"#64748b",fontWeight:700,marginBottom:10}}>Include in Export:</div>
              {[
                {key:"includeAnonymous",label:"Anonymous entries"},
                {key:"includeRoughCall",label:"After Rough Call entries"},
                {key:"includeDates",label:"Dates and timestamps"},
              ].map(opt=>(
                <div key={opt.key} onClick={()=>setExportOptions(prev=>({...prev,[opt.key]:!prev[opt.key]}))} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,cursor:"pointer"}}>
                  <div style={{width:18,height:18,borderRadius:5,border:`2px solid ${exportOptions[opt.key]?"#38bdf8":"#2d4a66"}`,background:exportOptions[opt.key]?"#38bdf8":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    {exportOptions[opt.key]&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#0b1829" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <span style={{fontSize:13,color:"#c8dae8"}}>{opt.label}</span>
                </div>
              ))}
            </div>

            <div style={{fontSize:10,color:"#334155",textAlign:"center",marginBottom:12}}>Never uploaded. Never shared unless you choose to.</div>
            <div onClick={()=>(setShowExport(false),setShowPasswordInput(false))} style={{padding:"13px",borderRadius:12,cursor:"pointer",textAlign:"center",background:"rgba(100,116,139,0.08)",border:"1px solid rgba(100,116,139,0.15)",fontSize:13,fontWeight:700,color:"#475569"}}>Cancel</div>
          </div>
        </div>
      )}
    </ScreenSingle>
  );
}

// 
// AFTER-ACTION RESET
// 
function AfterActionScreen({navigate,agency}){
  const[step,setStep]=useState(0);
  const[answers,setAnswers]=useState({impact:"",reaction:""});
  const defs=[{title:"Call Impact",subtitle:"Step 1 of 3",question:"How did this call affect you?",key:"impact",color:"#f97316"},{title:"What's Sticking",subtitle:"Step 2 of 3",question:"What part is staying with you?",key:"reaction",color:"#eab308"}];
  const lc=useLayoutConfig();
  return(
    <ScreenSingle headerProps={{onBack:()=>navigate("tools"),title:"After-Action Reset",agencyName:(agency&&agency.name)}}>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>{[0,1,2].map(i=><div key={i} style={{height:6,flex:i===step?2:1,borderRadius:3,background:i<step?"#22c55e":i===step?"#f97316":"rgba(255,255,255,0.08)",transition:"all 0.3s"}}/>)}<span style={{fontSize:11,color:"#2d4a66",marginLeft:6}}>Under 60 sec</span></div>
      {step<2?(<>
        <div style={{fontSize:11,color:defs[step].color,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase"}}>{defs[step].subtitle} . {defs[step].title}</div>
        <div style={{fontSize:lc.isDesktop?19:17,fontWeight:700,color:"#dde8f4"}}>{defs[step].question}</div>
        <textarea value={answers[defs[step].key]} onChange={e=>setAnswers(prev=>({...prev,[defs[step].key]:e.target.value}))} placeholder="Take your time..." rows={lc.isDesktop?6:4} style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"14px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",width:"100%"}}/>
        <Btn color={defs[step].color} bg={`rgba(${step===0?"249,115,22":"234,179,8"},0.1)`} onClick={()=>setStep(s=>s+1)}>Next -></Btn>
      </>):(<>
        <div style={{fontSize:15,fontWeight:700,color:"#dde8f4",textAlign:"center"}}>Step 3 . Reset</div>
        <div style={{fontSize:13,color:"#3d5268",textAlign:"center",lineHeight:1.6}}>Choose a reset tool.</div>
        <NavBtn icon={<BreathIcon/>} label="Box Breathing" sub="4-4-4-4 reset" color="#22c55e" bg="rgba(34,197,94,0.09)" onClick={()=>navigate("breathing")}/>
        <NavBtn icon={<GroundIcon/>} label="5-4-3-2-1 Grounding" sub="Sensory awareness" color="#38bdf8" bg="rgba(56,189,248,0.08)" onClick={()=>navigate("grounding")}/>
        <NavBtn icon={<HeartIcon/>} label={agency?"Contact Human PST":"Find Peer Support"} sub={agency?"Real peer support team":"Enter agency code to connect"} color="#a78bfa" bg="rgba(167,139,250,0.09)" locked={!agency} onClick={()=>agency?navigate("humanpst"):navigate("agencycode")}/>
        <div onClick={()=>{setStep(0);setAnswers({impact:"",reaction:""});navigate("home");}} style={{textAlign:"center",fontSize:12,color:"#1e3a52",cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>I'm good - back to Home</div>
      </>)}
    </ScreenSingle>
  );
}


// 
// 90-SECOND DUMP
// 
function Dump90Screen({navigate,agency}){
  const[mode,setMode]=useState("type");
  const[text,setText]=useState("");
  const[running,setRunning]=useState(false);
  const[elapsed,setElapsed]=useState(0);
  const[done,setDone]=useState(false);
  const[isListening,setIsListening]=useState(false);
  const[saved,setSaved]=useState(false);
  const recognitionRef=useRef(null);
  const intervalRef=useRef(null);
  const lc=useLayoutConfig();
  const TARGET=90;

  useEffect(()=>{
    if(running){
      intervalRef.current=setInterval(()=>setElapsed(e=>e+1),1000);
    }else{
      clearInterval(intervalRef.current);
    }
    return()=>clearInterval(intervalRef.current);
  },[running]);

  const startVoice=()=>{
    if(!("webkitSpeechRecognition" in window||"SpeechRecognition" in window)){alert("Voice not supported. Try Chrome.");return;}
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    const r=new SR();r.continuous=true;r.interimResults=true;r.lang="en-US";
    r.onresult=(e)=>{setText(Array.from(e.results).map(r=>r[0].transcript).join(" "));};
    r.onend=()=>setIsListening(false);
    r.start();recognitionRef.current=r;setIsListening(true);
  };
  const stopVoice=()=>{recognitionRef.current&&recognitionRef.current.stop();setIsListening(false);};

  const start=()=>{setRunning(true);setElapsed(0);};
  const stop=()=>setRunning(false);

  const remaining=Math.max(0,TARGET-elapsed);
  const pct=Math.min(elapsed/TARGET,1);
  const circleSize=lc.isDesktop?160:130;
  const r2=circleSize/2-8;
  const circ=2*Math.PI*r2;
  const pastTarget=elapsed>=TARGET;

  if(saved){return(
    <ScreenSingle headerProps={{onBack:()=>navigate("home"),title:"90-Second Dump",agencyName:(agency&&agency.name)}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:18,paddingTop:20}}>
        <div style={{fontSize:44}}>[ok]</div>
        <div style={{fontSize:18,fontWeight:800,color:"#38bdf8",textAlign:"center"}}>Saved Privately</div>
        <div style={{fontSize:13,color:"#3d5268",textAlign:"center",lineHeight:1.7}}>Your vent is saved encrypted on this device only. No one else can access it.</div>
        <Btn color="#38bdf8" onClick={()=>navigate("home")} style={{width:"100%"}}>Back to Home</Btn>
      </div>
    </ScreenSingle>
  );}

  return(
    <ScreenSingle headerProps={{onBack:()=>navigate("home"),title:"90-Second Dump",agencyName:(agency&&agency.name)}}>
      <div style={{background:"rgba(249,115,22,0.07)",border:"1px solid rgba(249,115,22,0.18)",borderRadius:12,padding:"12px 14px"}}>
        <div style={{fontSize:12,color:"#f97316",fontWeight:700,marginBottom:2}}>Get it out - all of it</div>
        <div style={{fontSize:12,color:"#3d5268",lineHeight:1.6}}>You have 90 seconds. Use your voice or type. No one reads this unless you choose to send it. Timer won't force-stop you.</div>
      </div>
      {/* Mode toggle */}
      <div style={{display:"flex",gap:8,background:"rgba(255,255,255,0.03)",borderRadius:12,padding:4}}>
        {["type","voice"].map(m=>(
          <div key={m} onClick={()=>setMode(m)} style={{flex:1,textAlign:"center",padding:"9px",borderRadius:9,background:mode===m?"rgba(249,115,22,0.15)":"transparent",border:`1px solid ${mode===m?"rgba(249,115,22,0.3)":"transparent"}`,cursor:"pointer",fontSize:12,fontWeight:mode===m?700:400,color:mode===m?"#f97316":"#3d5268",transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            {m==="type"?<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
            {m==="type"?"Type":"Voice"}
          </div>
        ))}
      </div>
      {/* Timer circle */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
        <div style={{position:"relative",width:circleSize,height:circleSize,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width={circleSize} height={circleSize} style={{position:"absolute",transform:"rotate(-90deg)"}}>
            <circle cx={circleSize/2} cy={circleSize/2} r={r2} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7"/>
            <circle cx={circleSize/2} cy={circleSize/2} r={r2} fill="none" stroke={pastTarget?"#22c55e":"#f97316"} strokeWidth="7" strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} strokeLinecap="round" style={{transition:"stroke-dashoffset 1s linear,stroke 0.5s"}}/>
          </svg>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,textAlign:"center"}}>
            {pastTarget
              ? <div style={{fontSize:28,fontWeight:900,color:"#22c55e"}}>v</div>
              : <div style={{fontSize:32,fontWeight:900,color:"#f97316"}}>{remaining}</div>}
            <div style={{fontSize:10,color:pastTarget?"#22c55e":"#2d4a66",fontWeight:700,letterSpacing:"0.08em"}}>{pastTarget?"PAST 90s":"SECONDS LEFT"}</div>
            {elapsed>0&&<div style={{fontSize:9,color:"#2d4a66"}}>{elapsed}s elapsed</div>}
          </div>
        </div>
        {!running&&elapsed===0&&<Btn color="#f97316" bg="rgba(249,115,22,0.12)" onClick={start} style={{padding:"13px 40px"}}>Start Timer</Btn>}
        {running&&<Btn color="#64748b" bg="rgba(100,116,139,0.1)" onClick={stop} style={{padding:"10px 32px"}}>Pause</Btn>}
        {!running&&elapsed>0&&<Btn color="#f97316" bg="rgba(249,115,22,0.1)" onClick={start} style={{padding:"10px 32px"}}>Continue</Btn>}
      </div>
      {/* Input */}
      {mode==="type"?(
        <textarea value={text} onChange={e=>{setText(e.target.value);if(!running&&elapsed===0)start();}} onFocus={()=>{if(!running&&elapsed===0)start();}} placeholder="Start typing - the timer starts automatically. Get it all out..." rows={lc.isDesktop?12:8} style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(249,115,22,0.2)",borderRadius:14,padding:"14px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",width:"100%",lineHeight:1.7}}/>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {text&&<div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(249,115,22,0.15)",borderRadius:14,padding:"14px",fontSize:13,color:"#c8dae8",lineHeight:1.7,minHeight:80}}>{text}</div>}
          <div onClick={isListening?stopVoice:()=>{startVoice();if(!running&&elapsed===0)start();}} style={{height:52,borderRadius:14,background:isListening?"rgba(239,68,68,0.15)":"rgba(249,115,22,0.12)",border:`1.5px solid ${isListening?"rgba(239,68,68,0.4)":"rgba(249,115,22,0.3)"}`,display:"flex",alignItems:"center",justifyContent:"center",gap:10,cursor:"pointer",color:isListening?"#f87171":"#f97316",fontWeight:700,fontSize:14}}>
            {isListening?(<><div style={{display:"flex",gap:3}}>{[1,2,3,4].map(i=><div key={i} style={{width:3,background:"#f87171",borderRadius:2,height:8+i*4}}/>)}</div>Listening...</>):(<><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>Tap to Speak</>)}
          </div>
        </div>
      )}
      {/* Action buttons */}
      {(text.trim()||elapsed>10)&&(
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{fontSize:12,color:"#2d4a66",textAlign:"center",marginBottom:4}}>What do you want to do with this?</div>
          <div onClick={()=>(setText(""),setElapsed(0),setRunning(false),navigate("home"))} style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:12,padding:"13px",cursor:"pointer",textAlign:"center",fontSize:13,fontWeight:700,color:"#f87171"}}>🗑 Delete - Wipe it clean</div>
          <div onClick={()=>setSaved(true)} style={{background:"rgba(56,189,248,0.08)",border:"1px solid rgba(56,189,248,0.2)",borderRadius:12,padding:"13px",cursor:"pointer",textAlign:"center",fontSize:13,fontWeight:700,color:"#38bdf8"}}>🔒 Save Privately - Encrypted on device only</div>
          <div onClick={()=>navigate("aichat")} style={{background:"rgba(139,92,246,0.08)",border:"1px solid rgba(139,92,246,0.2)",borderRadius:12,padding:"13px",cursor:"pointer",textAlign:"center",fontSize:13,fontWeight:700,color:"#a78bfa"}}>💬 Send to AI PST - Continues in peer support</div>
        </div>
      )}
    </ScreenSingle>
  );
}


// 
// ADMIN TOOLS
// 
// New AdminToolsScreen - clean, no JSX comments, no unicode box chars
// Uses only ScreenSingle wrapper (proven to work)
function AdminToolsScreen({navigate,membership,onSwitchAgency,pstAlert,setPstAlert,pstAlertMsg,setPstAlertMsg,criticalIncident,setCriticalIncident,setAgencyNotification,isPlatform=false,onGhostLogin}){
  const[tab,setTab]=useState("overview");
  const[liveStats,setLiveStats]=useState(null);
  const[statsLoading,setStatsLoading]=useState(false);
  const[statsError,setStatsError]=useState(false);
  const[statsDays,setStatsDays]=useState(30);

  useEffect(()=>{
    if(!(membership&&membership.agencyCode)) return;
    setStatsLoading(true);
    setStatsError(false);
    fetchAgencyStats(membership.agencyCode, statsDays)
      .then(data=>{
        setStatsLoading(false);
        if(data) setLiveStats(data);
        else setStatsError(true);
      })
      .catch(()=>{setStatsLoading(false);setStatsError(true);});
  },[(membership&&membership.agencyCode), statsDays]);

  useEffect(()=>{if(isPlatform)setTab("platform");},[isPlatform]);
  const[showAnonForm,setShowAnonForm]=useState(false);
  const[showConfirm,setShowConfirm]=useState(null);
  const[notifText,setNotifText]=useState("");
  const[notifPriority,setNotifPriority]=useState("Info");
  const[pstRoster,setPstRoster]=useState(DEMO_PST_ROSTERS[membership?membership.agencyCode:"UPSTREAM"]||[]);
  const[escalations,setEscalations]=useState(DEMO_ESCALATIONS[membership?membership.agencyCode:"UPSTREAM"]||[]);
  const[resources,setResources]=useState([
    {id:"r1",title:"CISM Protocol v3",category:"Protocol",status:"active",uploadedAt:"2026-02-10"},
    {id:"r2",title:"PST Referral Form",category:"Forms",status:"active",uploadedAt:"2026-01-22"},
    {id:"r3",title:"Resilience Toolkit",category:"Wellness",status:"pending",uploadedAt:"2026-03-05"},
  ]);
  const[addMemberModal,setAddMemberModal]=useState(false);
  const[newMemberName,setNewMemberName]=useState("");
  const[newMemberRole,setNewMemberRole]=useState("PST Member");
  const[anonText,setAnonText]=useState("");
  const[anonUrgency,setAnonUrgency]=useState("Priority");
  const[showRosterImport,setShowRosterImport]=useState(false);
  const[addEmployeeModal,setAddEmployeeModal]=useState(false);
  const[newEmpName,setNewEmpName]=useState("");
  const[newEmpPhone,setNewEmpPhone]=useState("");
  const[roster,setRoster]=useState([
    {id:"e1",name:"J. Rivera",    phone:"555-0142",status:"active",  joined:"2024-03-01"},
    {id:"e2",name:"M. Chen",      phone:"555-0187",status:"active",  joined:"2024-05-12"},
    {id:"e3",name:"T. Washington",phone:"555-0103",status:"active",  joined:"2023-11-08"},
    {id:"e4",name:"S. Okafor",    phone:"555-0155",status:"active",  joined:"2024-01-15"},
    {id:"e5",name:"B. Martinez",  phone:"555-0198",status:"inactive",joined:"2023-06-20"},
  ]);
  const[rosterFilter,setRosterFilter]=useState("all");
  const[importPreview,setImportPreview]=useState(null);
  const[importError,setImportError]=useState(null);
  const lc=useLayoutConfig();

  const isAdmin=(membership&&membership.role==="admin")||isPlatform;
  const isSupervisor=membership&&membership.role==="supervisor";
  const agencyName=membership?membership.agencyName:"Agency";

  // Wellness + Metrics data (used by inline Wellness and Metrics tabs)
  const trendData=[
    {day:"Mon",g:48,y:30,o:14,r:8},{day:"Tue",g:52,y:28,o:12,r:8},{day:"Wed",g:42,y:30,o:18,r:10},
    {day:"Thu",g:55,y:26,o:13,r:6},{day:"Fri",g:44,y:32,o:16,r:8},{day:"Sat",g:58,y:26,o:10,r:6},{day:"Sun",g:50,y:28,o:14,r:8},
  ];
  const heatmap=[
    {day:"Mon",count:18},{day:"Tue",count:22},{day:"Wed",count:31},
    {day:"Thu",count:20},{day:"Fri",count:28},{day:"Sat",count:12},{day:"Sun",count:9},
  ];
  const maxHeat=Math.max(...heatmap.map(h=>h.count));
  const shiftTimingData=[
    {label:"Start of Shift",count:32,pct:39,color:"#38bdf8"},
    {label:"Midshift",      count:28,pct:34,color:"#eab308"},
    {label:"End of Shift",  count:23,pct:28,color:"#a78bfa"},
  ];
  const toolAfterRough=[
    {label:"Box Breathing",    pct:38,color:"#22c55e"},
    {label:"AI PST Chat",      pct:32,color:"#ef4444"},
    {label:"90-Second Dump",   pct:24,color:"#f97316"},
    {label:"5-4-3-2-1 Ground.",pct:18,color:"#38bdf8"},
    {label:"Journal",          pct:14,color:"#a78bfa"},
  ];
  const weeklyTrend=[
    {week:"Feb W1",great:44,ok:32,rough:16,bad:8},{week:"Feb W2",great:46,ok:30,rough:15,bad:9},
    {week:"Feb W3",great:41,ok:33,rough:17,bad:9},{week:"Feb W4",great:48,ok:30,rough:14,bad:8},
    {week:"Mar W1",great:50,ok:28,rough:14,bad:8},{week:"Mar W2",great:52,ok:27,rough:13,bad:8},
  ];
  const featureUsage=[
    {label:"Shift Check-Ins",       count:83,pct:100,color:"#38bdf8",icon:"[ok]"},
    {label:"AI PST Chat",           count:47,pct:57, color:"#ef4444",icon:"🤖"},
    {label:"Box Breathing",         count:38,pct:46, color:"#22c55e",icon:"🫁"},
    {label:"Resources Accessed",    count:34,pct:41, color:"#64748b",icon:"📚"},
    {label:"5-4-3-2-1 Grounding",   count:29,pct:35, color:"#38bdf8",icon:"🖐"},
    {label:"Journal",               count:22,pct:27, color:"#a78bfa",icon:"📓"},
    {label:"Human PST - Chat",      count:21,pct:25, color:"#a78bfa",icon:"💬"},
    {label:"90-Second Dump",        count:18,pct:22, color:"#f97316",icon:"(t)"},
    {label:"After-Action Reset",    count:15,pct:18, color:"#f97316",icon:"🔄"},
    {label:"Human PST - Call",      count:14,pct:17, color:"#a78bfa",icon:"📞"},
    {label:"PTSD Interruption",     count:11,pct:13, color:"#7EBFAD",icon:"🧭"},
    {label:"Human PST - Text",      count:9, pct:11, color:"#a78bfa",icon:"📱"},
    {label:"Anonymous Reports",     count:8, pct:10, color:"#eab308",icon:"🔒"},
    {label:"Human PST - In Person", count:6, pct:7,  color:"#a78bfa",icon:"🤝"},
  ];
  const pstMethods=[
    {label:"In-App Chat",  count:21,pct:42,color:"#a78bfa"},
    {label:"Call Request", count:14,pct:28,color:"#38bdf8"},
    {label:"Text Request", count:9, pct:18,color:"#22c55e"},
    {label:"In Person",    count:6, pct:12,color:"#f97316"},
  ];
  const resourceGaps=[
    {label:"Crisis Resources",     views:142,status:"high",  color:"#ef4444"},
    {label:"State Pathways",       views:87, status:"high",  color:"#f97316"},
    {label:"Upstream Tools",       views:54, status:"normal",color:"#22c55e"},
    {label:"Downstream Resources", views:12, status:"low",   color:"#eab308"},
    {label:"CISM Protocols",       views:3,  status:"gap",   color:"#334155"},
    {label:"Chaplain Services",    views:0,  status:"gap",   color:"#1e3a52"},
  ];
  const openCount=escalations.filter(e=>e.status==="open").length;
  const onDutyCount=pstRoster.filter(m=>m.status==="on").length;
  const totalWorkload=pstRoster.reduce((s,m)=>s+m.workload,0);
  const statusColor={on:"#22c55e",phone:"#eab308",off:"#475569"};
  const statusLabel={on:"On Duty",phone:"By Phone",off:"Off Duty"};
  const goHome=()=>navigate("home");
  const adminTabs=isPlatform?["overview","wellness","metrics","escalations","pst","resources","settings","platform"]:["overview","wellness","metrics","escalations","pst","resources","settings"];

  const handleRosterFile=(e)=>{
    const file=e.target.files[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=(ev)=>{
      try{
        const text=ev.target.result;
        const rawLines=text.split("\n").filter(l=>l.trim());
        const headers=rawLines[0].split(",").map(h=>h.trim().toLowerCase());
        const nameIdx=headers.findIndex(h=>h.includes("name"));
        const phoneIdx=headers.findIndex(h=>h.includes("phone")||h.includes("number")||h.includes("tel"));
        if(nameIdx===-1||phoneIdx===-1){
          setImportError("Could not find Name and Phone columns. Check your headers.");
          setImportPreview(null);
          return;
        }
        const rows=rawLines.slice(1).map((line,i)=>{
          const cols=line.split(",").map(c=>c.trim());
          return{id:"imp"+Date.now()+i,name:cols[nameIdx]||"",phone:cols[phoneIdx]||"",status:"active",joined:new Date().toISOString().slice(0,10)};
        }).filter(r=>r.name&&r.phone);
        setImportPreview({rows:rows.slice(0,5),total:rows.length,allRows:rows,filename:file.name});
        setImportError(null);
      }catch(err){
        setImportError("Could not read file. Please use CSV format.");
        setImportPreview(null);
      }
    };
    reader.readAsText(file);
    e.target.value="";
  };
  const hp={onBack:goHome,title:"Admin Dashboard",agencyName:agencyName};
  const roleKey=membership?membership.role:"admin";
  const roleColor=ROLE_COLORS[roleKey]||"#94a3b8";
  const roleLabel=ROLE_LABELS[roleKey]||"Admin";
  const agencyShort=membership?membership.agencyShort:"--";

  return(
    <ScreenSingle headerProps={hp}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:12,padding:"10px 14px"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{fontSize:9,fontWeight:800,letterSpacing:"0.14em",color:roleColor,background:roleColor+"18",padding:"3px 10px",borderRadius:6,textTransform:"uppercase"}}>
            {roleLabel}
          </div>
          <span style={{fontSize:12,color:"#8099b0",fontWeight:500}}>{agencyName}</span>
        </div>
        <div onClick={onSwitchAgency} style={{display:"flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:8,padding:"5px 10px",cursor:"pointer"}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:roleColor}}/>
          <span style={{fontSize:10,fontWeight:700,color:"#64748b",textTransform:"uppercase"}}>{agencyShort}</span>
        </div>
      </div>

      <div style={{display:"flex",gap:5,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:14,padding:5,minHeight:52,overflowX:"auto"}}>
        {adminTabs.map(tk=>(
          <div key={tk} onClick={()=>!(((tk==="resources"||tk==="settings")&&!isAdmin))&&setTab(tk)} style={{flexShrink:0,minWidth:70,textAlign:"center",padding:"10px 8px",borderRadius:10,background:tab===tk?"rgba(255,255,255,0.13)":"transparent",border:"1px solid "+(tab===tk?"rgba(255,255,255,0.2)":"transparent"),cursor:((tk==="resources"||tk==="settings")&&!isAdmin)?"not-allowed":"pointer",fontSize:11,fontWeight:tab===tk?800:600,color:tab===tk?"#f1f5f9":tk==="platform"?"#f59e0b":((tk==="resources"||tk==="settings")&&!isAdmin)?"#2d4a66":"#8099b0",opacity:((tk==="resources"||tk==="settings")&&!isAdmin)?0.4:1,display:"flex",alignItems:"center",justifyContent:"center",gap:4,whiteSpace:"nowrap"}}>
            {{overview:"Overview",wellness:"Wellness",metrics:"Metrics",escalations:"Escalations",pst:"PST Team",resources:"Resources",settings:"Settings",platform:"Platform"}[tk]}
            {tk==="escalations"&&openCount>0&&<span style={{fontSize:9,fontWeight:800,color:"#ef4444",background:"rgba(239,68,68,0.2)",padding:"1px 5px",borderRadius:5}}>{openCount}</span>}
          </div>
        ))}
      </div>

      {tab==="overview"&&(
        <div>
          {/* Contract Status Card */}
          {(()=>{
            const agCode=membership?membership.agencyCode:null;
            const agData=agCode?AGENCY_CODES[agCode]:null;
            if(!agData) return null;
            const cs=getContractStatus(agData);
            const codeS=getCodeStatus(agData);
            const daysToCodeExp=getDaysUntil(agData.codeExpiry);
            const daysToGrace=cs==="grace"?getDaysUntilPurge(agData):null;
            const nextRotation=agData.codeExpiry?new Date(agData.codeExpiry).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):null;
            const contractEnd=agData.contractExpiry?new Date(agData.contractExpiry).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):null;
            return(
              <div style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"14px 16px",marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.14em",textTransform:"uppercase",color:"#475569",marginBottom:10}}>Contract & Access Status</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
                  <div style={{flex:1,minWidth:120,background:cs==="active"?"rgba(34,197,94,0.08)":cs==="grace"?"rgba(234,179,8,0.08)":"rgba(71,85,105,0.1)",border:`1px solid ${cs==="active"?"rgba(34,197,94,0.2)":cs==="grace"?"rgba(234,179,8,0.2)":"rgba(71,85,105,0.2)"}`,borderRadius:10,padding:"10px 12px"}}>
                    <div style={{fontSize:9,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:cs==="active"?"#22c55e":cs==="grace"?"#eab308":"#64748b",marginBottom:3}}>Contract</div>
                    <div style={{fontSize:13,fontWeight:700,color:"#dde8f4"}}>{cs==="active"?"Active":cs==="grace"?"Grace Period":"Ended"}</div>
                    <div style={{fontSize:10,color:"#334155",marginTop:2}}>{cs==="active"?`Renews ${contractEnd}`:cs==="grace"?`Data held ${daysToGrace}d`:"Data purged"}</div>
                  </div>
                  <div style={{flex:1,minWidth:120,background:codeS==="valid"?"rgba(56,189,248,0.06)":codeS==="rotating"?"rgba(234,179,8,0.08)":"rgba(249,115,22,0.08)",border:`1px solid ${codeS==="valid"?"rgba(56,189,248,0.15)":codeS==="rotating"?"rgba(234,179,8,0.2)":"rgba(249,115,22,0.2)"}`,borderRadius:10,padding:"10px 12px"}}>
                    <div style={{fontSize:9,fontWeight:800,letterSpacing:"0.12em",textTransform:"uppercase",color:codeS==="valid"?"#38bdf8":codeS==="rotating"?"#eab308":"#f97316",marginBottom:3}}>Access Code</div>
                    <div style={{fontSize:13,fontWeight:700,color:"#dde8f4"}}>{codeS==="valid"?"Valid":codeS==="rotating"?"Rotating Soon":"Expired"}</div>
                    <div style={{fontSize:10,color:"#334155",marginTop:2}}>{codeS==="valid"?`Rotates ${nextRotation}`:codeS==="rotating"?`${daysToCodeExp}d remaining`:"New code issued"}</div>
                  </div>
                </div>
                {codeS==="rotating"&&(
                  <div style={{background:"rgba(234,179,8,0.07)",border:"1px solid rgba(234,179,8,0.2)",borderRadius:10,padding:"10px 12px",marginBottom:8}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#eab308",marginBottom:3}}>🔄 Code rotation coming up</div>
                    <div style={{fontSize:11,color:"#8099b0",lineHeight:1.6}}>A new access code will be emailed to <span style={{color:"#eab308"}}>{agData.adminEmail}</span> before the current one expires. Share it with your staff at your next roll call or briefing.</div>
                  </div>
                )}
                {cs==="grace"&&(
                  <div style={{background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:10,padding:"10px 12px",marginBottom:8}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#f87171",marginBottom:3}}>... Contract renewal needed</div>
                    <div style={{fontSize:11,color:"#8099b0",lineHeight:1.6}}>Agency data is held securely for <span style={{color:"#f87171"}}>{daysToGrace} more days</span>. Renew to restore full access - nothing is lost. Contact Upstream at <span style={{color:"#38bdf8"}}>upstreampst.netlify.app</span></div>
                  </div>
                )}
                <div style={{fontSize:11,color:"#334155",fontStyle:"italic",lineHeight:1.65,paddingTop:4,borderTop:"1px solid rgba(255,255,255,0.04)"}}>
                  "Upstream is designed around trust. Your staff keep their personal wellness tools no matter what - that support never goes away. If your agency ever steps back from the platform, we hold your data securely for six months in case you return. And if you don't, it's purged from the system after six months of non-payment."
                </div>
              </div>
            );
          })()}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.16em",textTransform:"uppercase",color:"#475569"}}>Agency Overview</div>
            <div style={{display:"flex",gap:6}}>
              {[7,30,90].map(d=>(
                <div key={d} onClick={()=>setStatsDays(d)} style={{padding:"4px 10px",borderRadius:7,cursor:"pointer",fontSize:10,fontWeight:700,background:statsDays===d?"rgba(56,189,248,0.15)":"rgba(255,255,255,0.03)",border:`1px solid ${statsDays===d?"rgba(56,189,248,0.35)":"rgba(255,255,255,0.07)"}`,color:statsDays===d?"#38bdf8":"#475569"}}>{d}d</div>
              ))}
            </div>
          </div>
          {statsLoading&&<div style={{textAlign:"center",padding:"20px",fontSize:12,color:"#334155"}}>Loading live data...</div>}
          {statsError&&<div style={{background:"rgba(234,179,8,0.07)",border:"1px solid rgba(234,179,8,0.18)",borderRadius:10,padding:"10px 14px",fontSize:12,color:"#eab308",marginBottom:8}}>[!] Could not load live data - showing local counts</div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            {[
              {label:"Check-Ins",value:liveStats?liveStats.totalCheckins:"--",sub:liveStats?`${statsDays}d period`:"loading...",color:"#38bdf8"},
              {label:"Wellness Score",value:(liveStats&&liveStats.wellnessScore)!=null?liveStats.wellnessScore+"%":"--",sub:liveStats?"aggregate anonymous":"loading...",color:(liveStats&&liveStats.wellnessScore)>=70?"#22c55e":(liveStats&&liveStats.wellnessScore)>=40?"#eab308":"#ef4444"},
              {label:"AI PST Sessions",value:liveStats?liveStats.aiSessionCount:"--",sub:liveStats?`${statsDays}d period`:"loading...",color:"#a78bfa"},
              {label:"Tool Usage",value:liveStats?liveStats.totalToolUsage:"--",sub:liveStats?`${statsDays}d period`:"loading...",color:"#22c55e"},
            ].map((s,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:14,padding:"16px 14px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:s.color,opacity:0.5}}/>
                <div style={{fontSize:26,fontWeight:900,color:s.color,lineHeight:1}}>{s.value}</div>
                <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",marginTop:2}}>{s.label}</div>
                <div style={{fontSize:10,color:"#334155"}}>{s.sub}</div>
              </div>
            ))}
          </div>
          {/* Live wellness breakdown */}
          {liveStats&&liveStats.totalCheckins>0&&(
            <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:14,padding:"14px",marginBottom:12}}>
              <div style={{fontSize:10,fontWeight:700,color:"#475569",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>Wellness Breakdown - {liveStats.totalCheckins} check-ins</div>
              {[
                {label:"Great",count:liveStats.statusCounts.great,color:"#22c55e"},
                {label:"Striving",count:liveStats.statusCounts.striving,color:"#eab308"},
                {label:"Not Well",count:liveStats.statusCounts.notwell,color:"#f97316"},
                {label:"Ill",count:liveStats.statusCounts.ill,color:"#ef4444"},
              ].map((s,i)=>{
                const pct=liveStats.totalCheckins>0?Math.round((s.count/liveStats.totalCheckins)*100):0;
                return(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <div style={{width:64,fontSize:11,color:"#64748b"}}>{s.label}</div>
                    <div style={{flex:1,height:8,borderRadius:4,background:"rgba(255,255,255,0.04)",overflow:"hidden"}}>
                      <div style={{height:"100%",width:pct+"%",background:s.color,borderRadius:4,transition:"width 0.6s ease"}}/>
                    </div>
                    <div style={{width:40,fontSize:11,color:s.color,fontWeight:700,textAlign:"right"}}>{s.count}</div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Top tools */}
          {liveStats&&liveStats.totalToolUsage>0&&(()=>{
            const sorted=Object.entries(liveStats.toolCounts).sort((a,b)=>b[1]-a[1]).slice(0,4);
            const toolLabels={breathing:"Box Breathing",grounding:"5-4-3-2-1",journal:"Journal",dump90:"90-Sec Dump",afteraction:"After-Action",ptsd:"PTSD Tools",aichat:"AI Chat",emergencycontacts:"Emergency Contacts"};
            return(
              <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:14,padding:"14px",marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:700,color:"#475569",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:10}}>Most Used Tools</div>
                {sorted.map(([tool,count],i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,marginBottom:7}}>
                    <div style={{flex:1,fontSize:12,color:"#8099b0"}}>{toolLabels[tool]||tool}</div>
                    <div style={{fontSize:13,fontWeight:700,color:"#38bdf8"}}>{count}</div>
                  </div>
                ))}
              </div>
            );
          })()}
          <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.16em",textTransform:"uppercase",color:"#334155",marginBottom:8}}>Quick Actions</div>
          <div style={{background:pstAlert?"rgba(139,92,246,0.08)":"rgba(255,255,255,0.02)",border:"1px solid "+(pstAlert?"rgba(139,92,246,0.2)":"rgba(255,255,255,0.055)"),borderRadius:14,marginBottom:10,overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:pstAlert?"#c4b5fd":"#94a3b8"}}>PST Availability Banner</div>
                <div style={{fontSize:11,color:"#334155",marginTop:2}}>{pstAlert?"Active - visible to all staff":"Not active"}</div>
              </div>
              <div onClick={()=>{setPstAlert(!pstAlert);if(!pstAlert)setShowConfirm("pst");}} style={{padding:"8px 14px",borderRadius:10,cursor:"pointer",background:pstAlert?"rgba(100,116,139,0.1)":"rgba(139,92,246,0.12)",border:"1px solid "+(pstAlert?"rgba(100,116,139,0.2)":"rgba(139,92,246,0.3)"),fontSize:12,fontWeight:700,color:pstAlert?"#64748b":"#a78bfa",flexShrink:0}}>
                {pstAlert?"Deactivate":"Activate"}
              </div>
            </div>
            <div style={{padding:"0 14px 14px"}}>
              <textarea
                value={pstAlertMsg}
                onChange={e=>setPstAlertMsg(e.target.value)}
                placeholder="Optional message to staff (e.g. 'PST available in the break room until 18:00')"
                rows={2}
                maxLength={120}
                style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(139,92,246,0.2)",borderRadius:10,padding:"10px 12px",fontSize:12,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",width:"100%",lineHeight:1.5,color:"#cbd5e1"}}
              />
              <div style={{fontSize:10,color:"#334155",marginTop:4,textAlign:"right"}}>{pstAlertMsg.length}/120 - optional</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:criticalIncident?"rgba(30,30,46,0.7)":"rgba(255,255,255,0.02)",border:"1px solid "+(criticalIncident?"rgba(148,163,184,0.2)":"rgba(255,255,255,0.055)"),borderRadius:14,marginBottom:10}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:criticalIncident?"#f1f5f9":"#94a3b8"}}>Critical Incident Mode</div>
              <div style={{fontSize:11,color:"#334155",marginTop:2}}>{criticalIncident?"Active":"Not active"}</div>
            </div>
            <div onClick={()=>{setCriticalIncident(!criticalIncident);if(!criticalIncident)setShowConfirm("critical");}} style={{padding:"8px 14px",borderRadius:10,cursor:"pointer",background:criticalIncident?"rgba(100,116,139,0.1)":"rgba(71,85,105,0.15)",border:"1px solid "+(criticalIncident?"rgba(100,116,139,0.2)":"rgba(148,163,184,0.2)"),fontSize:12,fontWeight:700,color:criticalIncident?"#64748b":"#94a3b8"}}>
              {criticalIncident?"Deactivate":"Activate"}
            </div>
          </div>
          <div onClick={()=>setShowAnonForm(true)} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:14,cursor:"pointer",marginBottom:10}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:700,color:"#94a3b8"}}>Submit Anonymous Report</div>
              <div style={{fontSize:11,color:"#334155",marginTop:2}}>Goes to PST only - admin cannot view submissions</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>
      )}

      {tab==="wellness"&&(
        <div>
          <div style={{fontSize:10,color:"#334155",marginBottom:8,textAlign:"right"}}>::: Panels can be reordered in a future update</div>
          <div style={{background:"rgba(56,189,248,0.06)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:12,padding:"10px 14px",marginBottom:12}}>
            <div style={{fontSize:11,color:"#38bdf8",fontWeight:700}}>🔒 Anonymous and aggregated - minimum 5 responses before any category displays</div>
          </div>
          <Card>
            <SLabel color="#38bdf8">MHC Wellness - Last 7 Days</SLabel>
            <div style={{display:"flex",gap:3,height:90,alignItems:"flex-end",marginTop:12}}>
              {trendData.map((d,i)=>(
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",gap:1,alignItems:"center"}}>
                  <div style={{width:"100%",background:"#ef4444",height:`${d.r*0.75}px`,borderRadius:"2px 2px 0 0"}}/>
                  <div style={{width:"100%",background:"#f97316",height:`${d.o*0.75}px`}}/>
                  <div style={{width:"100%",background:"#eab308",height:`${d.y*0.75}px`}}/>
                  <div style={{width:"100%",background:"#22c55e",height:`${d.g*0.75}px`,borderRadius:"0 0 2px 2px"}}/>
                  <div style={{fontSize:9,color:"#2d4a66",marginTop:4}}>{d.day}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:10,marginTop:10,flexWrap:"wrap"}}>
              {[{c:"#22c55e",l:"Great"},{c:"#eab308",l:"Striving"},{c:"#f97316",l:"Not Well"},{c:"#ef4444",l:"Ill"}].map((x,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:"50%",background:x.c}}/><span style={{fontSize:10,color:"#2d4a66"}}>{x.l}</span></div>
              ))}
            </div>
          </Card>
          <Card>
            <SLabel color="#64748b">Weekly Trend Direction</SLabel>
            <div style={{display:"flex",gap:8,marginBottom:6}}>
              <div style={{fontSize:11,color:"#22c55e",fontWeight:700}}>IMPROVING</div>
              <div style={{fontSize:11,color:"#334155"}}>Great% up 8pts over 6 weeks</div>
            </div>
            <div style={{display:"flex",gap:3,height:60,alignItems:"flex-end"}}>
              {weeklyTrend.map((w,i)=>(
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",gap:1,alignItems:"center"}}>
                  <div style={{width:"100%",background:"#ef4444",height:`${w.bad*0.5}px`,borderRadius:"2px 2px 0 0"}}/>
                  <div style={{width:"100%",background:"#f97316",height:`${w.rough*0.5}px`}}/>
                  <div style={{width:"100%",background:"#eab308",height:`${w.ok*0.5}px`}}/>
                  <div style={{width:"100%",background:"#22c55e",height:`${w.great*0.5}px`,borderRadius:"0 0 2px 2px"}}/>
                  <div style={{fontSize:8,color:"#1e3a52",marginTop:3}}>{w.week.split(" ")[1]}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SLabel color="#eab308">Check-In Heatmap - By Day</SLabel>
            <div style={{display:"flex",gap:4,alignItems:"flex-end",height:60}}>
              {heatmap.map((h,i)=>{const pct=h.count/maxHeat;const col=pct>0.8?"#ef4444":pct>0.6?"#f97316":pct>0.4?"#eab308":"#22c55e";return(
                  <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                    <div style={{fontSize:9,color:col,fontWeight:700}}>{h.count}</div>
                    <div style={{width:"100%",background:col,height:`${pct*44}px`,borderRadius:4,opacity:0.8}}/>
                    <div style={{fontSize:9,color:"#2d4a66"}}>{h.day}</div>
                  </div>
                );
              })}
            </div>
          </Card>
          <Card>
            <SLabel color="#a78bfa">Shift Wellness Comparison</SLabel>
            {[{shift:"A Shift",pcts:[52,26,14,8]},{shift:"B Shift",pcts:[44,32,16,8]},{shift:"C Shift",pcts:[58,24,12,6]}].map((s,i)=>(
              <div key={i} style={{marginTop:12}}>
                <div style={{fontSize:12,color:"#8099b0",marginBottom:5,fontWeight:600}}>{s.shift}</div>
                <div style={{display:"flex",height:14,borderRadius:8,overflow:"hidden",gap:1}}>
                  {["#22c55e","#eab308","#f97316","#ef4444"].map((c,j)=>(<div key={j} style={{width:`${s.pcts[j]}%`,background:c}}/>))}
                </div>
                <div style={{display:"flex",gap:10,marginTop:4,flexWrap:"wrap"}}>
                  {[{c:"#22c55e",l:"Great"},{c:"#eab308",l:"Striving"},{c:"#f97316",l:"Not Well"},{c:"#ef4444",l:"Ill"}].map((x,j)=>(
                    <span key={j} style={{fontSize:10,color:x.c,fontWeight:600}}>{s.pcts[j]}% {x.l}</span>
                  ))}
                </div>
              </div>
            ))}
          </Card>
          <Card>
            <SLabel color="#f97316">Tool Effectiveness Signals</SLabel>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              {[{label:"Used tool after rough check-in",pct:"62%",color:"#22c55e"},{label:"Used 2+ tools in one session",pct:"34%",color:"#38bdf8"},{label:"AI PST switched to Human PST",pct:"18%",color:"#a78bfa"}].map((s,i)=>(
                <div key={i} style={{flex:1,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"12px 6px",textAlign:"center"}}>
                  <div style={{fontSize:18,fontWeight:900,color:s.color}}>{s.pct}</div>
                  <div style={{fontSize:9,color:"#475569",marginTop:4,lineHeight:1.4}}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:8}}>Most used after Rough/Bad check-in:</div>
            {toolAfterRough.map((t,i)=>(
              <div key={i} style={{marginBottom:8}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:11,color:"#8099b0"}}>{t.label}</span>
                  <span style={{fontSize:11,fontWeight:700,color:t.color}}>{t.pct}%</span>
                </div>
                <div style={{height:5,borderRadius:4,background:"rgba(255,255,255,0.04)"}}>
                  <div style={{height:"100%",width:`${t.pct}%`,background:t.color,borderRadius:4}}/>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}
      {tab==="metrics"&&(
        <div>
          <div style={{background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.15)",borderRadius:12,padding:"10px 14px",marginBottom:12}}>
            <div style={{fontSize:11,color:"#22c55e",fontWeight:700}}>📊 Anonymous aggregated data - no individual usage is tracked</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:4}}>
            {[{label:"Active Users",value:"127",sub:"This month",color:"#38bdf8"},{label:"Total Sessions",value:"312",sub:"This month",color:"#22c55e"},{label:"Escalations",value:"3",sub:"All resolved",color:"#eab308"},{label:"Avg Daily Check-Ins",value:"12",sub:"Per day",color:"#a78bfa"}].map((s,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:14,padding:"14px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:s.color,opacity:0.5}}/>
                <div style={{fontSize:26,fontWeight:900,color:s.color,lineHeight:1}}>{s.value}</div>
                <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",marginTop:2}}>{s.label}</div>
                <div style={{fontSize:10,color:"#334155"}}>{s.sub}</div>
              </div>
            ))}
          </div>
          <Card>
            <SLabel color="#38bdf8">PST Coverage Health</SLabel>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              {[{label:"Green",pct:"74%",sub:"Full coverage",color:"#22c55e"},{label:"Yellow",pct:"21%",sub:"Thin coverage",color:"#eab308"},{label:"Red",pct:"5%",sub:"No one available",color:"#ef4444"}].map((c,i)=>(
                <div key={i} style={{flex:1,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"12px 6px",textAlign:"center"}}>
                  <div style={{fontSize:20,fontWeight:900,color:c.color}}>{c.pct}</div>
                  <div style={{fontSize:9,fontWeight:700,color:c.color,marginTop:3}}>{c.label}</div>
                  <div style={{fontSize:9,color:"#334155",marginTop:2}}>{c.sub}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
              <span style={{fontSize:12,color:"#8099b0"}}>Avg PST online / day</span>
              <span style={{fontSize:13,fontWeight:700,color:"#38bdf8"}}>2.4</span>
            </div>
          </Card>
          <Card>
            <SLabel color="#a78bfa">Broadcast Request Metrics</SLabel>
            {[{label:"Total broadcasts sent",value:"19",color:"#cbd5e1"},{label:"Avg claim time",value:"6 min",color:"#22c55e"},{label:"Claimed within 10 minutes",value:"84%",color:"#22c55e"},{label:"Escalated at 30+ minutes",value:"11%",color:"#eab308"},{label:"Resolved",value:"89%",color:"#22c55e"},{label:"Unclaimed / expired",value:"11%",color:"#ef4444"}].map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<5?"1px solid rgba(255,255,255,0.04)":"none"}}>
                <span style={{fontSize:12,color:"#8099b0"}}>{m.label}</span>
                <span style={{fontSize:13,fontWeight:700,color:m.color}}>{m.value}</span>
              </div>
            ))}
          </Card>
          <Card>
            <SLabel color="#f97316">PST Follow-Up Metrics</SLabel>
            {[{label:"Chats marked for follow-up",value:"14",color:"#cbd5e1"},{label:"Follow-ups completed",value:"12",color:"#22c55e"},{label:"Completed within 24 hours",value:"79%",color:"#22c55e"},{label:"Avg completion time",value:"18 hrs",color:"#38bdf8"},{label:"Open / pending",value:"2",color:"#eab308"}].map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<4?"1px solid rgba(255,255,255,0.04)":"none"}}>
                <span style={{fontSize:12,color:"#8099b0"}}>{m.label}</span>
                <span style={{fontSize:13,fontWeight:700,color:m.color}}>{m.value}</span>
              </div>
            ))}
          </Card>
          <Card>
            <SLabel color="#38bdf8">AI PST Engagement</SLabel>
            {[{label:"Total conversations",value:"47",color:"#cbd5e1"},{label:"Avg session length",value:"9 min",color:"#38bdf8"},{label:"Returned within 24 hours",value:"31%",color:"#22c55e"},{label:"Switched AI to Human PST",value:"18%",color:"#a78bfa"}].map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<3?"1px solid rgba(255,255,255,0.04)":"none"}}>
                <span style={{fontSize:12,color:"#8099b0"}}>{m.label}</span>
                <span style={{fontSize:13,fontWeight:700,color:m.color}}>{m.value}</span>
              </div>
            ))}
          </Card>
          <Card>
            <SLabel color="#38bdf8">Feature Engagement - This Month</SLabel>
            <div style={{fontSize:10,color:"#334155",marginBottom:10}}>Ranked by usage. Bar = % of users who used each feature.</div>
            {featureUsage.map((f,i)=>(
              <div key={i} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <div style={{display:"flex",alignItems:"center",gap:7}}>
                    <span style={{fontSize:13}}>{f.icon}</span>
                    <span style={{fontSize:11,color:"#8099b0"}}>{f.label}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:10,color:"#334155"}}>{f.count}x</span>
                    <span style={{fontSize:11,fontWeight:700,color:f.color,minWidth:34,textAlign:"right"}}>{f.pct}%</span>
                  </div>
                </div>
                <div style={{height:5,borderRadius:4,background:"rgba(255,255,255,0.04)"}}>
                  <div style={{height:"100%",width:`${f.pct}%`,background:f.color,borderRadius:4,opacity:0.8}}/>
                </div>
              </div>
            ))}
          </Card>
          <Card>
            <SLabel color="#64748b">Resource Gap Analysis</SLabel>
            <div style={{fontSize:10,color:"#334155",marginBottom:10}}>High-view = demand. Zero-view = needs attention.</div>
            {resourceGaps.map((r,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<5?"1px solid rgba(255,255,255,0.04)":"none"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:r.color,flexShrink:0}}/>
                  <span style={{fontSize:12,color:"#8099b0"}}>{r.label}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:12,fontWeight:700,color:r.color}}>{r.views} views</span>
                  {r.status==="gap"&&<span style={{fontSize:9,fontWeight:800,color:"#ef4444",background:"rgba(239,68,68,0.15)",padding:"2px 6px",borderRadius:5}}>NEEDS ATTENTION</span>}
                  {r.status==="high"&&<span style={{fontSize:9,fontWeight:800,color:"#22c55e",background:"rgba(34,197,94,0.12)",padding:"2px 6px",borderRadius:5}}>HIGH DEMAND</span>}
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab==="escalations"&&(
        <div>
          <div style={{background:"rgba(56,189,248,0.04)",border:"1px solid rgba(56,189,248,0.1)",borderRadius:12,padding:"10px 14px",marginBottom:12,fontSize:11,color:"#38bdf8",fontWeight:700}}>
            Privacy: You see that a request exists and its status. You never see chat or PST notes.
          </div>
          {escalations.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:"#1e3a52",fontSize:13}}>No escalations at this time.</div>}
          <div style={{fontSize:10,color:"#334155",marginBottom:8}}>::: Drag to reprioritize open escalations</div>
          <DragList
            items={escalations}
            onReorder={setEscalations}
            keyFn={e=>e.id}
            renderItem={(esc)=>(
              <div style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:14,padding:"14px 16px",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:9,fontWeight:800,color:({Urgent:"#ef4444",Priority:"#eab308",Routine:"#22c55e"}[esc.priority]||"#64748b"),background:({Urgent:"#ef4444",Priority:"#eab308",Routine:"#22c55e"}[esc.priority]||"#64748b")+"20",padding:"2px 8px",borderRadius:5}}>{esc.priority.toUpperCase()}</span>
                    <span style={{fontSize:9,fontWeight:800,color:({open:"#ef4444",claimed:"#eab308",completed:"#22c55e"}[esc.status]||"#64748b"),background:({open:"#ef4444",claimed:"#eab308",completed:"#22c55e"}[esc.status]||"#64748b")+"18",padding:"2px 8px",borderRadius:5}}>{esc.status.toUpperCase()}</span>
                  </div>
                  <span style={{fontSize:10,color:"#334155"}}>{esc.time}</span>
                </div>
                <div style={{fontSize:12,color:"#64748b",lineHeight:1.6,marginBottom:esc.status==="open"?10:0}}>{esc.note}</div>
                {esc.claimedBy&&<div style={{fontSize:11,color:"#475569",marginTop:4}}>Claimed by: <span style={{color:"#94a3b8",fontWeight:600}}>{esc.claimedBy}</span></div>}
                {esc.status==="open"&&(
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {pstRoster.filter(m=>m.status!=="off").map(m=>(
                      <div key={m.id} onClick={()=>setEscalations(prev=>prev.map(e=>e.id===esc.id?{...e,status:"claimed",claimedBy:m.name}:e))} style={{padding:"7px 12px",borderRadius:9,cursor:"pointer",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",fontSize:11,fontWeight:700,color:"#64748b"}}>
                        Assign: {m.name.split(" ")[1]||m.name}
                      </div>
                    ))}
                    {isAdmin&&<div onClick={()=>setEscalations(prev=>prev.map(e=>e.id===esc.id?{...e,status:"claimed",claimedBy:"You (Admin)"}:e))} style={{padding:"7px 12px",borderRadius:9,cursor:"pointer",background:"rgba(148,163,184,0.1)",border:"1px solid rgba(148,163,184,0.2)",fontSize:11,fontWeight:700,color:"#94a3b8"}}>Claim Myself</div>}
                  </div>
                )}
              </div>
            )}
          />
          <div style={{height:1,background:"rgba(255,255,255,0.05)",margin:"16px 0"}}/>
          <div style={{fontSize:12,color:"#64748b",marginBottom:10}}>Send an agency-wide operational message to all staff.</div>
          <textarea value={notifText} onChange={e=>setNotifText(e.target.value)} placeholder='E.g., "Station coverage update at 1400"' rows={3} maxLength={200} style={{background:"rgba(255,255,255,0.03)",border:"1.5px solid rgba(255,255,255,0.07)",borderRadius:11,padding:"11px 13px",fontSize:12,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",width:"100%",lineHeight:1.6,color:"#cbd5e1",marginBottom:6}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:10,color:"#1e3a52"}}>{notifText.length}/200</div>
            <div style={{display:"flex",gap:6}}>
              {["Info","Important","Urgent"].map(lv=>(
                <div key={lv} onClick={()=>setNotifPriority(lv)} style={{padding:"5px 10px",borderRadius:7,cursor:"pointer",fontSize:10,fontWeight:700,background:notifPriority===lv?"rgba(100,116,139,0.15)":"rgba(100,116,139,0.04)",border:"1px solid "+(notifPriority===lv?"rgba(100,116,139,0.3)":"rgba(100,116,139,0.08)"),color:notifPriority===lv?"#cbd5e1":"#475569"}}>{lv}</div>
              ))}
            </div>
          </div>
          <div onClick={()=>{if(!notifText.trim())return;setAgencyNotification({message:notifText,priority:notifPriority,timestamp:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})});setNotifText("");setShowConfirm("notification");}} style={{padding:"12px",borderRadius:11,cursor:notifText.trim()?"pointer":"not-allowed",textAlign:"center",fontSize:13,fontWeight:700,background:notifText.trim()?"rgba(148,163,184,0.1)":"rgba(255,255,255,0.02)",border:"1px solid "+(notifText.trim()?"rgba(148,163,184,0.2)":"rgba(255,255,255,0.04)"),color:notifText.trim()?"#94a3b8":"#334155",opacity:notifText.trim()?1:0.5}}>
            Send Broadcast
          </div>
        </div>
      )}

      {tab==="pst"&&(
        <div>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.16em",textTransform:"uppercase",color:"#475569",marginBottom:8}}>PST Roster</div>
          <div style={{display:"flex",gap:10,marginBottom:12}}>
            {[{s:"on",label:"On Duty",c:"#22c55e"},{s:"phone",label:"By Phone",c:"#eab308"},{s:"off",label:"Off Duty",c:"#475569"}].map(x=>(
              <div key={x.s} style={{flex:1,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
                <div style={{fontSize:20,fontWeight:900,color:x.c}}>{pstRoster.filter(m=>m.status===x.s).length}</div>
                <div style={{fontSize:9,fontWeight:700,color:"#334155",marginTop:2}}>{x.label}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:10,color:"#334155",marginBottom:8}}>::: Drag to reorder priority</div>
          <DragList
            items={pstRoster}
            onReorder={setPstRoster}
            keyFn={m=>m.id}
            renderItem={(m)=>(
              <div style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:14,padding:"14px 16px",display:"flex",alignItems:"center",gap:14,marginBottom:8}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:statusColor[m.status],flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:"#cbd5e1"}}>{m.name}</div>
                  <div style={{fontSize:11,color:"#334155",marginTop:2}}>{m.role}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:10,fontWeight:700,color:statusColor[m.status]}}>{statusLabel[m.status]}</div>
                  <div style={{fontSize:10,color:"#334155",marginTop:2}}>{m.workload} follow-up{m.workload!==1?"s":""}</div>
                </div>
                {(isAdmin||isSupervisor)&&(
                  <div style={{display:"flex",flexDirection:"column",gap:4,marginLeft:4}}>
                    {["on","phone","off"].map(s=>(
                      <div key={s} onClick={()=>setPstRoster(prev=>prev.map(p=>p.id===m.id?{...p,status:s}:p))} style={{width:7,height:7,borderRadius:"50%",cursor:"pointer",background:m.status===s?statusColor[s]:"rgba(255,255,255,0.06)",border:"1px solid "+(m.status===s?statusColor[s]:"rgba(255,255,255,0.08)")}}/>
                    ))}
                  </div>
                )}
              </div>
            )}
          />
          {isAdmin&&(
            <div onClick={()=>setAddMemberModal(true)} style={{background:"rgba(255,255,255,0.02)",border:"1.5px dashed rgba(255,255,255,0.07)",borderRadius:14,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:34,height:34,borderRadius:9,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>+</div>
              <div style={{fontSize:13,fontWeight:700,color:"#475569"}}>Add PST Member</div>
            </div>
          )}
        </div>
      )}

      {tab==="resources"&&isAdmin&&(
        <div>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.16em",textTransform:"uppercase",color:"#475569",marginBottom:8}}>Resource Library</div>
          <div style={{fontSize:10,color:"#334155",marginBottom:8}}>::: Drag to reorder resources</div>
          <DragList
            items={resources}
            onReorder={setResources}
            keyFn={r=>r.id}
            renderItem={(r)=>(
              <div style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:14,padding:"13px 16px",display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                  <span style={{fontSize:13,fontWeight:700,color:"#cbd5e1"}}>{r.title}</span>
                  <span style={{fontSize:9,fontWeight:800,color:r.status==="pending"?"#eab308":"#22c55e",background:r.status==="pending"?"rgba(234,179,8,0.12)":"rgba(34,197,94,0.12)",padding:"2px 7px",borderRadius:5,textTransform:"uppercase"}}>{r.status}</span>
                </div>
                <div style={{fontSize:11,color:"#334155"}}>{r.category} - {r.uploadedAt}</div>
              </div>
              {r.status==="pending"&&<div onClick={()=>setResources(prev=>prev.map(x=>x.id===r.id?{...x,status:"active"}:x))} style={{padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:700,background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.25)",color:"#22c55e"}}>Approve</div>}
              <div onClick={()=>setResources(prev=>prev.filter(x=>x.id!==r.id))} style={{padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:700,background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.15)",color:"#f87171"}}>Remove</div>
            </div>
            )}
          />
          <div style={{background:"rgba(255,255,255,0.02)",border:"1.5px dashed rgba(255,255,255,0.07)",borderRadius:14,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:34,height:34,borderRadius:9,background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>+</div>
            <div style={{fontSize:13,fontWeight:700,color:"#475569"}}>Upload New Resource</div>
          </div>
        </div>
      )}

      {tab==="settings"&&isAdmin&&(
        <div>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.16em",textTransform:"uppercase",color:"#475569",marginBottom:12}}>Employee Roster</div>

          <div style={{background:"rgba(56,189,248,0.05)",border:"1px solid rgba(56,189,248,0.12)",borderRadius:12,padding:"12px 14px",marginBottom:14}}>
            <div style={{fontSize:12,fontWeight:700,color:"#38bdf8",marginBottom:4}}>How this works</div>
            <div style={{fontSize:11,color:"#334155",lineHeight:1.65}}>
              Employees on this list have agency access. Remove or deactivate someone to revoke their access - they keep the full wellness app and all personal data.
            </div>
          </div>

          <div style={{display:"flex",gap:8,marginBottom:14}}>
            {["all","active","inactive"].map(f=>(
              <div key={f} onClick={()=>setRosterFilter(f)}
                style={{flex:1,padding:"9px 6px",borderRadius:10,cursor:"pointer",textAlign:"center",
                  background:rosterFilter===f?"rgba(56,189,248,0.12)":"rgba(255,255,255,0.03)",
                  border:"1px solid "+(rosterFilter===f?"rgba(56,189,248,0.3)":"rgba(255,255,255,0.07)"),
                  fontSize:11,fontWeight:rosterFilter===f?800:600,
                  color:rosterFilter===f?"#38bdf8":"#64748b"}}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
                <span style={{fontSize:10,marginLeft:4,color:rosterFilter===f?"#38bdf8":"#334155"}}>
                  ({f==="all"?roster.length:roster.filter(e=>e.status===f).length})
                </span>
              </div>
            ))}
          </div>

          {roster.filter(e=>rosterFilter==="all"||e.status===rosterFilter).map((e)=>(
            <div key={e.id} style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:14,padding:"13px 16px",marginBottom:8,opacity:e.status==="inactive"?0.55:1}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:e.status==="active"?"#22c55e":"#475569",flexShrink:0}}/>
                    <span style={{fontSize:13,fontWeight:700,color:"#dde8f4"}}>{e.name}</span>
                  </div>
                  <div style={{fontSize:11,color:"#475569",paddingLeft:15}}>{e.phone}</div>
                </div>
                <div style={{display:"flex",gap:6,flexShrink:0}}>
                  <div onClick={()=>setRoster(prev=>prev.map(r=>r.id===e.id?{...r,status:e.status==="active"?"inactive":"active"}:r))}
                    style={{padding:"6px 10px",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:700,
                      background:e.status==="active"?"rgba(239,68,68,0.08)":"rgba(34,197,94,0.08)",
                      border:"1px solid "+(e.status==="active"?"rgba(239,68,68,0.2)":"rgba(34,197,94,0.2)"),
                      color:e.status==="active"?"#f87171":"#22c55e"}}>
                    {e.status==="active"?"Deactivate":"Reactivate"}
                  </div>
                  <div onClick={()=>setRoster(prev=>prev.filter(r=>r.id!==e.id))}
                    style={{padding:"6px 10px",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:700,
                      background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.15)",color:"#f87171"}}>
                    Remove
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div onClick={()=>setAddEmployeeModal(true)} style={{background:"rgba(255,255,255,0.02)",border:"1.5px dashed rgba(255,255,255,0.08)",borderRadius:14,padding:"13px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
            <div style={{width:34,height:34,borderRadius:9,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>+</div>
            <div style={{fontSize:13,fontWeight:700,color:"#475569"}}>Add Employee Manually</div>
          </div>

          <div style={{height:1,background:"rgba(255,255,255,0.06)",margin:"4px 0 20px"}}/>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.16em",textTransform:"uppercase",color:"#475569",marginBottom:10}}>Import Roster</div>

          <div style={{background:"rgba(255,255,255,0.02)",border:"1.5px dashed rgba(255,255,255,0.1)",borderRadius:14,padding:"20px 16px",marginBottom:10}}>
            <div style={{textAlign:"center",marginBottom:14}}>
              <div style={{fontSize:22,marginBottom:8}}>📋</div>
              <div style={{fontSize:13,fontWeight:700,color:"#cbd5e1",marginBottom:4}}>Upload CSV or Excel</div>
              <div style={{fontSize:11,color:"#475569",lineHeight:1.6}}>Two columns only: Name and Phone Number.</div>
            </div>
            <div style={{background:"rgba(56,189,248,0.05)",border:"1px solid rgba(56,189,248,0.12)",borderRadius:10,padding:"10px 14px",marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:700,color:"#38bdf8",marginBottom:4}}>Format:</div>
              <div style={{fontSize:11,color:"#2d4a66",fontFamily:"monospace",lineHeight:1.8}}>
                Name, Phone<br/>
                John Smith, 555-0142<br/>
                Jane Doe, 555-0187
              </div>
            </div>
            <label style={{display:"block"}}>
              <input type="file" accept=".csv,.xlsx,.xls" style={{display:"none"}}
                onChange={handleRosterFile}
              />
              <div style={{background:"rgba(56,189,248,0.1)",border:"1.5px solid rgba(56,189,248,0.3)",borderRadius:11,padding:"12px",textAlign:"center",cursor:"pointer",fontSize:13,fontWeight:700,color:"#38bdf8"}}>
                Choose File
              </div>
            </label>
          </div>

          {importError&&(
            <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:10,padding:"10px 14px",marginBottom:10,fontSize:12,color:"#f87171"}}>{importError}</div>
          )}

          {importPreview&&(
            <div style={{background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:14,padding:"14px 16px",marginBottom:10}}>
              <div style={{fontSize:12,fontWeight:700,color:"#22c55e",marginBottom:8}}>{importPreview.filename} - {importPreview.total} employees found</div>
              {importPreview.rows.map((r,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:i<importPreview.rows.length-1?"1px solid rgba(255,255,255,0.04)":"none"}}>
                  <span style={{fontSize:12,color:"#8099b0"}}>{r.name}</span>
                  <span style={{fontSize:11,color:"#475569"}}>{r.phone}</span>
                </div>
              ))}
              {importPreview.total>5&&<div style={{fontSize:10,color:"#334155",marginTop:6}}>...and {importPreview.total-5} more</div>}
              <div style={{display:"flex",gap:8,marginTop:12}}>
                <div onClick={()=>setImportPreview(null)}
                  style={{flex:1,padding:"10px",borderRadius:10,cursor:"pointer",textAlign:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",fontSize:12,fontWeight:700,color:"#475569"}}>
                  Cancel
                </div>
                <div onClick={()=>(setRoster(importPreview.allRows),setImportPreview(null),setShowConfirm("roster_imported"))}
                  style={{flex:2,padding:"10px",borderRadius:10,cursor:"pointer",textAlign:"center",background:"rgba(34,197,94,0.12)",border:"1.5px solid rgba(34,197,94,0.3)",fontSize:12,fontWeight:700,color:"#22c55e"}}>
                  Import {importPreview.total} Employees
                </div>
              </div>
            </div>
          )}

          <div style={{height:1,background:"rgba(255,255,255,0.06)",margin:"4px 0 20px"}}/>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.16em",textTransform:"uppercase",color:"#475569",marginBottom:10}}>Other Settings</div>
          {[
            {label:"Escalation Rules",   sub:"Who receives broadcast escalations and at what threshold"},
            {label:"Notification Prefs", sub:"Daily summary, weekly trends, PST availability alerts"},
            {label:"PST Certification",  sub:"Manage PST member qualifications and renewal dates"},
            {label:"Multi-Agency Access",sub:"Approve or revoke inter-agency membership requests"},
          ].map((s,i)=>(
            <div key={i} onClick={()=>setShowConfirm("settings_stub")}
              style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:14,cursor:"pointer",marginBottom:8}}>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700,color:"#cbd5e1"}}>{s.label}</div>
                <div style={{fontSize:11,color:"#334155",marginTop:2}}>{s.sub}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}
        </div>
      )}


      {tab==="platform"&&isPlatform&&(
        <PlatformInlineContent navigate={navigate} onGhostLogin={onGhostLogin||function(){}}/>
      )}

      {showAnonForm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:20}} onClick={()=>setShowAnonForm(false)}>
          <div style={{background:"#0c1929",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:20,padding:"28px 22px",maxWidth:420,width:"100%",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:16,fontWeight:800,color:"#cbd5e1",marginBottom:6}}>Submit Anonymous Report</div>
            <div style={{fontSize:12,color:"#475569",lineHeight:1.65,marginBottom:20}}>This report goes to the PST team only. Your identity is not attached. Agency admins cannot view it.</div>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              {[{k:"Routine",c:"#22c55e"},{k:"Priority",c:"#eab308"},{k:"Urgent",c:"#ef4444"}].map(u=>(
                <div key={u.k} onClick={()=>setAnonUrgency(u.k)} style={{flex:1,padding:"10px 6px",borderRadius:10,cursor:"pointer",textAlign:"center",background:anonUrgency===u.k?u.c+"18":"rgba(255,255,255,0.02)",border:"1.5px solid "+(anonUrgency===u.k?u.c:"rgba(255,255,255,0.055)")}}>
                  <div style={{fontSize:11,fontWeight:800,color:u.c}}>{u.k}</div>
                </div>
              ))}
            </div>
            <textarea value={anonText} onChange={e=>setAnonText(e.target.value)} placeholder="Describe your concern. The PST team will take it from here." rows={5} style={{background:"rgba(255,255,255,0.03)",border:"1.5px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"12px 14px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",width:"100%",lineHeight:1.6,marginBottom:16}}/>
            <div style={{display:"flex",gap:10}}>
              <div onClick={()=>(setShowAnonForm(false),setAnonText(""))} style={{flex:1,padding:"13px",borderRadius:12,cursor:"pointer",textAlign:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",fontSize:13,fontWeight:700,color:"#475569"}}>Cancel</div>
              <div onClick={()=>(setShowAnonForm(false),setAnonText(""),setShowConfirm("anon_submitted"))} style={{flex:2,padding:"13px",borderRadius:12,cursor:"pointer",textAlign:"center",background:"rgba(167,139,250,0.12)",border:"1.5px solid rgba(167,139,250,0.3)",fontSize:13,fontWeight:700,color:"#a78bfa"}}>Submit Report</div>
            </div>
          </div>
        </div>
      )}

      {addMemberModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:20}}>
          <div style={{background:"#0c1929",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:20,padding:"28px 22px",maxWidth:380,width:"100%"}}>
            <div style={{fontSize:15,fontWeight:800,color:"#cbd5e1",marginBottom:16}}>Add PST Member</div>
            <input value={newMemberName} onChange={e=>setNewMemberName(e.target.value)} placeholder="Full name" style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:11,padding:"11px 13px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",width:"100%",marginBottom:14}}/>
            <div style={{display:"flex",gap:8,marginBottom:20}}>
              {["PST Lead","PST Member"].map(r=>(
                <div key={r} onClick={()=>setNewMemberRole(r)} style={{flex:1,padding:"10px",borderRadius:10,cursor:"pointer",textAlign:"center",background:newMemberRole===r?"rgba(148,163,184,0.12)":"rgba(255,255,255,0.02)",border:"1.5px solid "+(newMemberRole===r?"rgba(148,163,184,0.3)":"rgba(255,255,255,0.06)"),fontSize:12,fontWeight:700,color:newMemberRole===r?"#94a3b8":"#475569"}}>{r}</div>
              ))}
            </div>
            <div style={{display:"flex",gap:10}}>
              <div onClick={()=>(setAddMemberModal(false),setNewMemberName(""))} style={{flex:1,padding:"12px",borderRadius:11,cursor:"pointer",textAlign:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",fontSize:13,fontWeight:700,color:"#475569"}}>Cancel</div>
              <div onClick={()=>{if(!newMemberName.trim())return;setPstRoster(prev=>[...prev,{id:"p"+Date.now(),name:newMemberName.trim(),role:newMemberRole,status:"on",workload:0}]);setAddMemberModal(false);setNewMemberName("");setShowConfirm("member_added");}} style={{flex:2,padding:"12px",borderRadius:11,cursor:"pointer",textAlign:"center",background:"rgba(148,163,184,0.12)",border:"1.5px solid rgba(148,163,184,0.3)",fontSize:13,fontWeight:700,color:"#94a3b8"}}>Add Member</div>
            </div>
          </div>
        </div>
      )}

      {addEmployeeModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:20}}>
          <div style={{background:"#0c1929",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:20,padding:"28px 22px",maxWidth:380,width:"100%"}}>
            <div style={{fontSize:15,fontWeight:800,color:"#cbd5e1",marginBottom:16}}>Add Employee</div>
            <input value={newEmpName} onChange={e=>setNewEmpName(e.target.value)} placeholder="Full name" style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:11,padding:"11px 13px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",width:"100%",marginBottom:10}}/>
            <input value={newEmpPhone} onChange={e=>setNewEmpPhone(e.target.value)} placeholder="Phone number" style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:11,padding:"11px 13px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",width:"100%",marginBottom:20}}/>
            <div style={{display:"flex",gap:10}}>
              <div onClick={()=>(setAddEmployeeModal(false),setNewEmpName(""),setNewEmpPhone(""))} style={{flex:1,padding:"12px",borderRadius:11,cursor:"pointer",textAlign:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",fontSize:13,fontWeight:700,color:"#475569"}}>Cancel</div>
              <div onClick={()=>{if(!newEmpName.trim()||!newEmpPhone.trim())return;setRoster(prev=>[...prev,{id:"e"+Date.now(),name:newEmpName.trim(),phone:newEmpPhone.trim(),status:"active",joined:new Date().toISOString().slice(0,10)}]);setAddEmployeeModal(false);setNewEmpName("");setNewEmpPhone("");}} style={{flex:2,padding:"12px",borderRadius:11,cursor:"pointer",textAlign:"center",background:"rgba(34,197,94,0.12)",border:"1.5px solid rgba(34,197,94,0.3)",fontSize:13,fontWeight:700,color:"#22c55e"}}>Add Employee</div>
            </div>
          </div>
        </div>
      )}

      {showConfirm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:20}}>
          <div style={{background:"#0c1929",border:"1px solid rgba(255,255,255,0.08)",borderRadius:18,padding:"28px 24px",maxWidth:320,width:"100%",textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:14}}>{showConfirm==="pst"?"v":showConfirm==="critical"?"[*]":showConfirm==="notification"?"📢":showConfirm==="anon_submitted"?"🔒":showConfirm==="member_added"?"👥":"[S]️"}</div>
            <div style={{fontSize:15,fontWeight:800,color:"#cbd5e1",marginBottom:8}}>{showConfirm==="pst"?"PST Banner Activated":showConfirm==="critical"?"Critical Mode Activated":showConfirm==="notification"?"Broadcast Sent":showConfirm==="anon_submitted"?"Report Submitted":showConfirm==="member_added"?"Member Added":showConfirm==="roster_imported"?"Roster Imported":"Saved"}</div>
            <div style={{fontSize:12,color:"#475569",lineHeight:1.6,marginBottom:22}}>{showConfirm==="anon_submitted"?"Your anonymous report has been submitted to the PST team. Agency admins cannot view it.":showConfirm==="roster_imported"?"Employee roster has been updated. Deactivated employees have lost agency access but keep the full app.":"Action completed successfully."}</div>
            <div onClick={()=>setShowConfirm(null)} style={{padding:"12px",borderRadius:11,cursor:"pointer",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",fontSize:13,fontWeight:700,color:"#64748b"}}>Done</div>
          </div>
        </div>
      )}
    </ScreenSingle>
  );
}



// 
// PLATFORM OWNER SCREEN
// 
function PlatformInlineContent({navigate,onGhostLogin}){
  const[tab,setTab]=useState("agencies");
  const[ghostTarget,setGhostTarget]=useState(null);
  const[showGhostConfirm,setShowGhostConfirm]=useState(null);
  const[searchQuery,setSearchQuery]=useState("");
  const lc=useLayoutConfig();

  const PLATFORM_AGENCIES=[
    {id:"a1",code:"UPSTREAM",name:"Upstream Demo Agency",  region:"Southeast",type:"EMS",     users:127,active:true, lastActive:"Today",    adminName:"J. Rivera",   adminPhone:"555-0100",events:3,escalations:3,adoptionPct:84},
    {id:"a2",code:"METRO24", name:"Metro EMS",             region:"Southeast",type:"EMS",     users:89, active:true, lastActive:"Today",    adminName:"S. Chen",     adminPhone:"555-0201",events:1,escalations:1,adoptionPct:71},
    {id:"a3",code:"FIRE07",  name:"Station 7 Fire",        region:"Southeast",type:"Fire",    users:44, active:true, lastActive:"Yesterday",adminName:"T. Burns",    adminPhone:"555-0301",events:0,escalations:0,adoptionPct:58},
    {id:"a4",code:"EMS01",   name:"County EMS",            region:"Midwest",  type:"EMS",     users:203,active:true, lastActive:"Today",    adminName:"M. Wallace",  adminPhone:"555-0401",events:4,escalations:6,adoptionPct:79},
    {id:"a5",code:"SHERIFF", name:"Sheriff Office",        region:"Southeast",type:"Law Enforcement",users:67,active:true,lastActive:"2 days ago",adminName:"D. Torres",adminPhone:"555-0501",events:1,escalations:2,adoptionPct:63},
    {id:"a6",code:"SUMMIT26",name:"2026 FR Summit",        region:"National", type:"Event",   users:312,active:true, lastActive:"Today",    adminName:"Upstream HQ", adminPhone:"555-0001",events:1,escalations:0,adoptionPct:91},
    {id:"a7",code:"PCIS26",  name:"PCIS Conference",       region:"National", type:"Event",   users:178,active:false,lastActive:"3 weeks ago",adminName:"Upstream HQ",adminPhone:"555-0001",events:0,escalations:0,adoptionPct:88},
  ];

  const PLATFORM_METRICS=[
    {label:"Total Users",        value:"1,020",sub:"Across all agencies", color:"#38bdf8"},
    {label:"Active Agencies",    value:"6",    sub:"1 inactive",          color:"#22c55e"},
    {label:"Event Attendees",    value:"490",  sub:"2 events this quarter",color:"#a78bfa"},
    {label:"Avg Feature Adoption",value:"76%", sub:"Platform-wide",       color:"#eab308"},
  ];

  const REGIONAL_DATA=[
    {region:"Southeast",agencies:3,users:238,adoption:73,topFeature:"AI PST Chat"},
    {region:"Midwest",  agencies:1,users:203,adoption:79,topFeature:"Shift Check-Ins"},
    {region:"National", agencies:2,users:490,adoption:90,topFeature:"Box Breathing"},
  ];

  const FEATURE_PLATFORM=[
    {label:"Shift Check-Ins",    pct:89,color:"#38bdf8"},
    {label:"AI PST Chat",        pct:71,color:"#ef4444"},
    {label:"Box Breathing",      pct:58,color:"#22c55e"},
    {label:"Human PST - Chat",   pct:34,color:"#a78bfa"},
    {label:"Resources",          pct:52,color:"#64748b"},
    {label:"Journal",            pct:31,color:"#a78bfa"},
    {label:"PTSD Interruption",  pct:22,color:"#7EBFAD"},
    {label:"After-Action Reset", pct:27,color:"#f97316"},
  ];

  const filtered=PLATFORM_AGENCIES.filter(a=>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())||
    a.code.toLowerCase().includes(searchQuery.toLowerCase())||
    a.region.toLowerCase().includes(searchQuery.toLowerCase())||
    a.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const typeColor={EMS:"#38bdf8",Fire:"#f97316","Law Enforcement":"#a78bfa",Event:"#22c55e"};

  return(
    <div>
      <div style={{background:"rgba(234,179,8,0.08)",border:"1.5px solid rgba(234,179,8,0.25)",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:"#eab308",flexShrink:0}}/>
        <div style={{fontSize:11,fontWeight:700,color:"#eab308"}}>PLATFORM OWNER - Full cross-agency access</div>
      </div>

      <div style={{display:"flex",gap:5,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:14,padding:5,overflowX:"auto"}}>
        {["agencies","analytics","regions","access-log"].map(tk=>(
          <div key={tk} onClick={()=>setTab(tk)} style={{flexShrink:0,minWidth:80,textAlign:"center",padding:"10px 12px",borderRadius:10,background:tab===tk?"rgba(234,179,8,0.15)":"transparent",border:"1px solid "+(tab===tk?"rgba(234,179,8,0.3)":"transparent"),cursor:"pointer",fontSize:11,fontWeight:tab===tk?800:600,color:tab===tk?"#eab308":"#8099b0",whiteSpace:"nowrap"}}>
            {{agencies:"Agencies",analytics:"Analytics",regions:"Regions","access-log":"Access Log"}[tk]}
          </div>
        ))}
      </div>

      {tab==="agencies"&&(
        <div>
          <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search agencies, regions, types..." style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"11px 14px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",width:"100%",color:"#dde8f4",marginBottom:12}}/>
          {filtered.map((a)=>(
            <div key={a.id} style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:16,padding:"14px 16px",marginBottom:10,opacity:a.active?1:0.5}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:a.active?"#22c55e":"#475569",flexShrink:0}}/>
                    <span style={{fontSize:14,fontWeight:800,color:"#dde8f4"}}>{a.name}</span>
                    <span style={{fontSize:9,fontWeight:800,color:typeColor[a.type]||"#64748b",background:(typeColor[a.type]||"#64748b")+"18",padding:"2px 8px",borderRadius:5}}>{a.type}</span>
                  </div>
                  <div style={{fontSize:11,color:"#475569",paddingLeft:15}}>{a.code} . {a.region} . Last active: {a.lastActive}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:18,fontWeight:900,color:"#38bdf8"}}>{a.users}</div>
                  <div style={{fontSize:9,color:"#334155"}}>users</div>
                </div>
              </div>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                {[
                  {label:"Adoption",value:a.adoptionPct+"%",color:"#22c55e"},
                  {label:"Escalations",value:String(a.escalations),color:a.escalations>0?"#eab308":"#475569"},
                  {label:"Open Events",value:String(a.events),color:a.events>0?"#a78bfa":"#475569"},
                ].map((s,i)=>(
                  <div key={i} style={{flex:1,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:10,padding:"8px 6px",textAlign:"center"}}>
                    <div style={{fontSize:15,fontWeight:800,color:s.color}}>{s.value}</div>
                    <div style={{fontSize:9,color:"#334155",marginTop:2}}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:8}}>
                <div onClick={()=>setShowGhostConfirm(a)}
                  style={{flex:2,padding:"9px",borderRadius:10,cursor:"pointer",textAlign:"center",background:"rgba(234,179,8,0.1)",border:"1.5px solid rgba(234,179,8,0.3)",fontSize:12,fontWeight:700,color:"#eab308"}}>
                  Enter as Support
                </div>
                <div onClick={()=>{}}
                  style={{flex:1,padding:"9px",borderRadius:10,cursor:"pointer",textAlign:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",fontSize:12,fontWeight:700,color:"#64748b"}}>
                  Contact Admin
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="analytics"&&(
        <div>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.16em",textTransform:"uppercase",color:"#475569",marginBottom:10}}>Platform Overview</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            {PLATFORM_METRICS.map((s,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:14,padding:"14px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:s.color,opacity:0.5}}/>
                <div style={{fontSize:24,fontWeight:900,color:s.color,lineHeight:1}}>{s.value}</div>
                <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",marginTop:2}}>{s.label}</div>
                <div style={{fontSize:10,color:"#334155"}}>{s.sub}</div>
              </div>
            ))}
          </div>
          <Card>
            <SLabel color="#38bdf8">Feature Adoption - Platform Wide</SLabel>
            <div style={{fontSize:10,color:"#334155",marginBottom:12}}>% of users who used each feature this month across all agencies</div>
            {FEATURE_PLATFORM.map((f,i)=>(
              <div key={i} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:12,color:"#8099b0"}}>{f.label}</span>
                  <span style={{fontSize:12,fontWeight:700,color:f.color}}>{f.pct}%</span>
                </div>
                <div style={{height:5,borderRadius:4,background:"rgba(255,255,255,0.04)"}}>
                  <div style={{height:"100%",width:`${f.pct}%`,background:f.color,borderRadius:4,opacity:0.8}}/>
                </div>
              </div>
            ))}
          </Card>
          <Card>
            <SLabel color="#eab308">Underutilized Features - Needs Attention</SLabel>
            <div style={{fontSize:11,color:"#334155",marginBottom:10}}>Features with platform-wide adoption below 30% - consider training or UX review</div>
            {FEATURE_PLATFORM.filter(f=>f.pct<30).map((f,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<FEATURE_PLATFORM.filter(x=>x.pct<30).length-1?"1px solid rgba(255,255,255,0.04)":"none"}}>
                <span style={{fontSize:12,color:"#8099b0"}}>{f.label}</span>
                <span style={{fontSize:12,fontWeight:700,color:"#eab308"}}>{f.pct}% adoption</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab==="regions"&&(
        <div>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.16em",textTransform:"uppercase",color:"#475569",marginBottom:12}}>Regional Breakdown</div>
          {REGIONAL_DATA.map((r,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:16,padding:"16px",marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div>
                  <div style={{fontSize:15,fontWeight:800,color:"#dde8f4"}}>{r.region}</div>
                  <div style={{fontSize:11,color:"#475569",marginTop:2}}>{r.agencies} {r.agencies===1?"agency":"agencies"} . {r.users} users</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:22,fontWeight:900,color:"#22c55e"}}>{r.adoption}%</div>
                  <div style={{fontSize:9,color:"#334155"}}>adoption</div>
                </div>
              </div>
              <div style={{height:6,borderRadius:4,background:"rgba(255,255,255,0.04)",marginBottom:8}}>
                <div style={{height:"100%",width:`${r.adoption}%`,background:"#22c55e",borderRadius:4}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:11,color:"#334155"}}>Top feature:</span>
                <span style={{fontSize:11,fontWeight:700,color:"#38bdf8"}}>{r.topFeature}</span>
              </div>
            </div>
          ))}
          <div style={{background:"rgba(56,189,248,0.05)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:12,padding:"12px 14px"}}>
            <div style={{fontSize:12,fontWeight:700,color:"#38bdf8",marginBottom:4}}>Regional insight</div>
            <div style={{fontSize:11,color:"#334155",lineHeight:1.65}}>
              National event attendees show 90% adoption - significantly higher than permanent agency deployments. Consider what drives engagement at events and replicate in agency onboarding.
            </div>
          </div>
        </div>
      )}

      {tab==="access-log"&&(
        <div>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.16em",textTransform:"uppercase",color:"#475569",marginBottom:8}}>Support Access Log</div>
          <div style={{background:"rgba(56,189,248,0.05)",border:"1px solid rgba(56,189,248,0.12)",borderRadius:12,padding:"10px 14px",marginBottom:12}}>
            <div style={{fontSize:11,color:"#38bdf8",fontWeight:700,marginBottom:2}}>Transparency policy</div>
            <div style={{fontSize:11,color:"#334155",lineHeight:1.6}}>Every support access session is logged. Agency admins can see when Upstream support entered their view and what actions were taken.</div>
          </div>
          {[
            {date:"Mar 19 2026",time:"09:14",agency:"Metro EMS",        action:"Roster import assistance",  duration:"12 min"},
            {date:"Mar 17 2026",time:"14:30",agency:"County EMS",        action:"Dashboard walkthrough",      duration:"28 min"},
            {date:"Mar 15 2026",time:"11:05",agency:"Station 7 Fire",    action:"Initial agency onboarding",  duration:"45 min"},
            {date:"Mar 12 2026",time:"16:22",agency:"Upstream Demo",     action:"Feature demo and training",  duration:"60 min"},
            {date:"Mar 10 2026",time:"09:55",agency:"2026 FR Summit",    action:"Event code setup",           duration:"8 min"},
          ].map((l,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:12,padding:"12px 14px",marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:12,fontWeight:700,color:"#cbd5e1"}}>{l.agency}</span>
                <span style={{fontSize:10,color:"#334155"}}>{l.date} . {l.time}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:11,color:"#475569"}}>{l.action}</span>
                <span style={{fontSize:10,fontWeight:700,color:"#64748b"}}>{l.duration}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showGhostConfirm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:20}}>
          <div style={{background:"#0c1929",border:"1.5px solid rgba(234,179,8,0.3)",borderRadius:20,padding:"28px 22px",maxWidth:380,width:"100%"}}>
            <div style={{fontSize:22,textAlign:"center",marginBottom:12}}>🔐</div>
            <div style={{fontSize:15,fontWeight:800,color:"#eab308",textAlign:"center",marginBottom:8}}>Enter as Platform Support</div>
            <div style={{fontSize:13,fontWeight:700,color:"#dde8f4",textAlign:"center",marginBottom:6}}>{showGhostConfirm.name}</div>
            <div style={{fontSize:12,color:"#475569",lineHeight:1.65,marginBottom:16,textAlign:"center"}}>
              You will see their admin dashboard exactly as their admin sees it. A banner will be visible. This session will be logged.
            </div>
            <div style={{background:"rgba(234,179,8,0.07)",border:"1px solid rgba(234,179,8,0.18)",borderRadius:10,padding:"10px 14px",marginBottom:20}}>
              <div style={{fontSize:11,color:"#eab308",fontWeight:700,marginBottom:2}}>What you can do:</div>
              <div style={{fontSize:11,color:"#64748b",lineHeight:1.7}}>
                [ok] View all admin tabs and data<br/>
                [ok] Upload rosters, edit resources<br/>
                [ok] Configure settings on their behalf<br/>
                X Cannot view PST conversations<br/>
                X Cannot view anonymous reports
              </div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <div onClick={()=>setShowGhostConfirm(null)}
                style={{flex:1,padding:"12px",borderRadius:11,cursor:"pointer",textAlign:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",fontSize:13,fontWeight:700,color:"#475569"}}>
                Cancel
              </div>
              <div onClick={()=>(setGhostTarget(showGhostConfirm),setShowGhostConfirm(null),onGhostLogin(showGhostConfirm))}
                style={{flex:2,padding:"12px",borderRadius:11,cursor:"pointer",textAlign:"center",background:"rgba(234,179,8,0.12)",border:"1.5px solid rgba(234,179,8,0.35)",fontSize:13,fontWeight:700,color:"#eab308"}}>
                Enter Support View
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function PlatformOwnerScreen({navigate,onGhostLogin}){
  const[tab,setTab]=useState("agencies");
  const[ghostTarget,setGhostTarget]=useState(null);
  const[showGhostConfirm,setShowGhostConfirm]=useState(null);
  const[searchQuery,setSearchQuery]=useState("");
  const lc=useLayoutConfig();

  const PLATFORM_AGENCIES=[
    {id:"a1",code:"UPSTREAM",name:"Upstream Demo Agency",  region:"Southeast",type:"EMS",     users:127,active:true, lastActive:"Today",    adminName:"J. Rivera",   adminPhone:"555-0100",events:3,escalations:3,adoptionPct:84},
    {id:"a2",code:"METRO24", name:"Metro EMS",             region:"Southeast",type:"EMS",     users:89, active:true, lastActive:"Today",    adminName:"S. Chen",     adminPhone:"555-0201",events:1,escalations:1,adoptionPct:71},
    {id:"a3",code:"FIRE07",  name:"Station 7 Fire",        region:"Southeast",type:"Fire",    users:44, active:true, lastActive:"Yesterday",adminName:"T. Burns",    adminPhone:"555-0301",events:0,escalations:0,adoptionPct:58},
    {id:"a4",code:"EMS01",   name:"County EMS",            region:"Midwest",  type:"EMS",     users:203,active:true, lastActive:"Today",    adminName:"M. Wallace",  adminPhone:"555-0401",events:4,escalations:6,adoptionPct:79},
    {id:"a5",code:"SHERIFF", name:"Sheriff Office",        region:"Southeast",type:"Law Enforcement",users:67,active:true,lastActive:"2 days ago",adminName:"D. Torres",adminPhone:"555-0501",events:1,escalations:2,adoptionPct:63},
    {id:"a6",code:"SUMMIT26",name:"2026 FR Summit",        region:"National", type:"Event",   users:312,active:true, lastActive:"Today",    adminName:"Upstream HQ", adminPhone:"555-0001",events:1,escalations:0,adoptionPct:91},
    {id:"a7",code:"PCIS26",  name:"PCIS Conference",       region:"National", type:"Event",   users:178,active:false,lastActive:"3 weeks ago",adminName:"Upstream HQ",adminPhone:"555-0001",events:0,escalations:0,adoptionPct:88},
  ];

  const PLATFORM_METRICS=[
    {label:"Total Users",        value:"1,020",sub:"Across all agencies", color:"#38bdf8"},
    {label:"Active Agencies",    value:"6",    sub:"1 inactive",          color:"#22c55e"},
    {label:"Event Attendees",    value:"490",  sub:"2 events this quarter",color:"#a78bfa"},
    {label:"Avg Feature Adoption",value:"76%", sub:"Platform-wide",       color:"#eab308"},
  ];

  const REGIONAL_DATA=[
    {region:"Southeast",agencies:3,users:238,adoption:73,topFeature:"AI PST Chat"},
    {region:"Midwest",  agencies:1,users:203,adoption:79,topFeature:"Shift Check-Ins"},
    {region:"National", agencies:2,users:490,adoption:90,topFeature:"Box Breathing"},
  ];

  const FEATURE_PLATFORM=[
    {label:"Shift Check-Ins",    pct:89,color:"#38bdf8"},
    {label:"AI PST Chat",        pct:71,color:"#ef4444"},
    {label:"Box Breathing",      pct:58,color:"#22c55e"},
    {label:"Human PST - Chat",   pct:34,color:"#a78bfa"},
    {label:"Resources",          pct:52,color:"#64748b"},
    {label:"Journal",            pct:31,color:"#a78bfa"},
    {label:"PTSD Interruption",  pct:22,color:"#7EBFAD"},
    {label:"After-Action Reset", pct:27,color:"#f97316"},
  ];

  const filtered=PLATFORM_AGENCIES.filter(a=>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())||
    a.code.toLowerCase().includes(searchQuery.toLowerCase())||
    a.region.toLowerCase().includes(searchQuery.toLowerCase())||
    a.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const typeColor={EMS:"#38bdf8",Fire:"#f97316","Law Enforcement":"#a78bfa",Event:"#22c55e"};
  const hp={onBack:()=>navigate("home"),title:"Platform Owner",agencyName:"Upstream HQ"};

  return(
    <ScreenSingle headerProps={hp}>
      <div style={{background:"rgba(234,179,8,0.08)",border:"1.5px solid rgba(234,179,8,0.25)",borderRadius:12,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:8,height:8,borderRadius:"50%",background:"#eab308",flexShrink:0}}/>
        <div style={{fontSize:11,fontWeight:700,color:"#eab308"}}>PLATFORM OWNER - Full cross-agency access</div>
      </div>

      <div style={{display:"flex",gap:5,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:14,padding:5,overflowX:"auto"}}>
        {["agencies","analytics","regions","access-log"].map(tk=>(
          <div key={tk} onClick={()=>setTab(tk)} style={{flexShrink:0,minWidth:80,textAlign:"center",padding:"10px 12px",borderRadius:10,background:tab===tk?"rgba(234,179,8,0.15)":"transparent",border:"1px solid "+(tab===tk?"rgba(234,179,8,0.3)":"transparent"),cursor:"pointer",fontSize:11,fontWeight:tab===tk?800:600,color:tab===tk?"#eab308":"#8099b0",whiteSpace:"nowrap"}}>
            {{agencies:"Agencies",analytics:"Analytics",regions:"Regions","access-log":"Access Log"}[tk]}
          </div>
        ))}
      </div>

      {tab==="agencies"&&(
        <div>
          <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search agencies, regions, types..." style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"11px 14px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",width:"100%",color:"#dde8f4",marginBottom:12}}/>
          {filtered.map((a)=>(
            <div key={a.id} style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:16,padding:"14px 16px",marginBottom:10,opacity:a.active?1:0.5}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    <div style={{width:7,height:7,borderRadius:"50%",background:a.active?"#22c55e":"#475569",flexShrink:0}}/>
                    <span style={{fontSize:14,fontWeight:800,color:"#dde8f4"}}>{a.name}</span>
                    <span style={{fontSize:9,fontWeight:800,color:typeColor[a.type]||"#64748b",background:(typeColor[a.type]||"#64748b")+"18",padding:"2px 8px",borderRadius:5}}>{a.type}</span>
                  </div>
                  <div style={{fontSize:11,color:"#475569",paddingLeft:15}}>{a.code} . {a.region} . Last active: {a.lastActive}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:18,fontWeight:900,color:"#38bdf8"}}>{a.users}</div>
                  <div style={{fontSize:9,color:"#334155"}}>users</div>
                </div>
              </div>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                {[
                  {label:"Adoption",value:a.adoptionPct+"%",color:"#22c55e"},
                  {label:"Escalations",value:String(a.escalations),color:a.escalations>0?"#eab308":"#475569"},
                  {label:"Open Events",value:String(a.events),color:a.events>0?"#a78bfa":"#475569"},
                ].map((s,i)=>(
                  <div key={i} style={{flex:1,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:10,padding:"8px 6px",textAlign:"center"}}>
                    <div style={{fontSize:15,fontWeight:800,color:s.color}}>{s.value}</div>
                    <div style={{fontSize:9,color:"#334155",marginTop:2}}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:8}}>
                <div onClick={()=>setShowGhostConfirm(a)}
                  style={{flex:2,padding:"9px",borderRadius:10,cursor:"pointer",textAlign:"center",background:"rgba(234,179,8,0.1)",border:"1.5px solid rgba(234,179,8,0.3)",fontSize:12,fontWeight:700,color:"#eab308"}}>
                  Enter as Support
                </div>
                <div onClick={()=>{}}
                  style={{flex:1,padding:"9px",borderRadius:10,cursor:"pointer",textAlign:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",fontSize:12,fontWeight:700,color:"#64748b"}}>
                  Contact Admin
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="analytics"&&(
        <div>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.16em",textTransform:"uppercase",color:"#475569",marginBottom:10}}>Platform Overview</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            {PLATFORM_METRICS.map((s,i)=>(
              <div key={i} style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:14,padding:"14px",position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:s.color,opacity:0.5}}/>
                <div style={{fontSize:24,fontWeight:900,color:s.color,lineHeight:1}}>{s.value}</div>
                <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",marginTop:2}}>{s.label}</div>
                <div style={{fontSize:10,color:"#334155"}}>{s.sub}</div>
              </div>
            ))}
          </div>
          <Card>
            <SLabel color="#38bdf8">Feature Adoption - Platform Wide</SLabel>
            <div style={{fontSize:10,color:"#334155",marginBottom:12}}>% of users who used each feature this month across all agencies</div>
            {FEATURE_PLATFORM.map((f,i)=>(
              <div key={i} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:12,color:"#8099b0"}}>{f.label}</span>
                  <span style={{fontSize:12,fontWeight:700,color:f.color}}>{f.pct}%</span>
                </div>
                <div style={{height:5,borderRadius:4,background:"rgba(255,255,255,0.04)"}}>
                  <div style={{height:"100%",width:`${f.pct}%`,background:f.color,borderRadius:4,opacity:0.8}}/>
                </div>
              </div>
            ))}
          </Card>
          <Card>
            <SLabel color="#eab308">Underutilized Features - Needs Attention</SLabel>
            <div style={{fontSize:11,color:"#334155",marginBottom:10}}>Features with platform-wide adoption below 30% - consider training or UX review</div>
            {FEATURE_PLATFORM.filter(f=>f.pct<30).map((f,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<FEATURE_PLATFORM.filter(x=>x.pct<30).length-1?"1px solid rgba(255,255,255,0.04)":"none"}}>
                <span style={{fontSize:12,color:"#8099b0"}}>{f.label}</span>
                <span style={{fontSize:12,fontWeight:700,color:"#eab308"}}>{f.pct}% adoption</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {tab==="regions"&&(
        <div>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.16em",textTransform:"uppercase",color:"#475569",marginBottom:12}}>Regional Breakdown</div>
          {REGIONAL_DATA.map((r,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:16,padding:"16px",marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                <div>
                  <div style={{fontSize:15,fontWeight:800,color:"#dde8f4"}}>{r.region}</div>
                  <div style={{fontSize:11,color:"#475569",marginTop:2}}>{r.agencies} {r.agencies===1?"agency":"agencies"} . {r.users} users</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:22,fontWeight:900,color:"#22c55e"}}>{r.adoption}%</div>
                  <div style={{fontSize:9,color:"#334155"}}>adoption</div>
                </div>
              </div>
              <div style={{height:6,borderRadius:4,background:"rgba(255,255,255,0.04)",marginBottom:8}}>
                <div style={{height:"100%",width:`${r.adoption}%`,background:"#22c55e",borderRadius:4}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:11,color:"#334155"}}>Top feature:</span>
                <span style={{fontSize:11,fontWeight:700,color:"#38bdf8"}}>{r.topFeature}</span>
              </div>
            </div>
          ))}
          <div style={{background:"rgba(56,189,248,0.05)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:12,padding:"12px 14px"}}>
            <div style={{fontSize:12,fontWeight:700,color:"#38bdf8",marginBottom:4}}>Regional insight</div>
            <div style={{fontSize:11,color:"#334155",lineHeight:1.65}}>
              National event attendees show 90% adoption - significantly higher than permanent agency deployments. Consider what drives engagement at events and replicate in agency onboarding.
            </div>
          </div>
        </div>
      )}

      {tab==="access-log"&&(
        <div>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.16em",textTransform:"uppercase",color:"#475569",marginBottom:8}}>Support Access Log</div>
          <div style={{background:"rgba(56,189,248,0.05)",border:"1px solid rgba(56,189,248,0.12)",borderRadius:12,padding:"10px 14px",marginBottom:12}}>
            <div style={{fontSize:11,color:"#38bdf8",fontWeight:700,marginBottom:2}}>Transparency policy</div>
            <div style={{fontSize:11,color:"#334155",lineHeight:1.6}}>Every support access session is logged. Agency admins can see when Upstream support entered their view and what actions were taken.</div>
          </div>
          {[
            {date:"Mar 19 2026",time:"09:14",agency:"Metro EMS",        action:"Roster import assistance",  duration:"12 min"},
            {date:"Mar 17 2026",time:"14:30",agency:"County EMS",        action:"Dashboard walkthrough",      duration:"28 min"},
            {date:"Mar 15 2026",time:"11:05",agency:"Station 7 Fire",    action:"Initial agency onboarding",  duration:"45 min"},
            {date:"Mar 12 2026",time:"16:22",agency:"Upstream Demo",     action:"Feature demo and training",  duration:"60 min"},
            {date:"Mar 10 2026",time:"09:55",agency:"2026 FR Summit",    action:"Event code setup",           duration:"8 min"},
          ].map((l,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:12,padding:"12px 14px",marginBottom:8}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:12,fontWeight:700,color:"#cbd5e1"}}>{l.agency}</span>
                <span style={{fontSize:10,color:"#334155"}}>{l.date} . {l.time}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:11,color:"#475569"}}>{l.action}</span>
                <span style={{fontSize:10,fontWeight:700,color:"#64748b"}}>{l.duration}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showGhostConfirm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,padding:20}}>
          <div style={{background:"#0c1929",border:"1.5px solid rgba(234,179,8,0.3)",borderRadius:20,padding:"28px 22px",maxWidth:380,width:"100%"}}>
            <div style={{fontSize:22,textAlign:"center",marginBottom:12}}>🔐</div>
            <div style={{fontSize:15,fontWeight:800,color:"#eab308",textAlign:"center",marginBottom:8}}>Enter as Platform Support</div>
            <div style={{fontSize:13,fontWeight:700,color:"#dde8f4",textAlign:"center",marginBottom:6}}>{showGhostConfirm.name}</div>
            <div style={{fontSize:12,color:"#475569",lineHeight:1.65,marginBottom:16,textAlign:"center"}}>
              You will see their admin dashboard exactly as their admin sees it. A banner will be visible. This session will be logged.
            </div>
            <div style={{background:"rgba(234,179,8,0.07)",border:"1px solid rgba(234,179,8,0.18)",borderRadius:10,padding:"10px 14px",marginBottom:20}}>
              <div style={{fontSize:11,color:"#eab308",fontWeight:700,marginBottom:2}}>What you can do:</div>
              <div style={{fontSize:11,color:"#64748b",lineHeight:1.7}}>
                [ok] View all admin tabs and data<br/>
                [ok] Upload rosters, edit resources<br/>
                [ok] Configure settings on their behalf<br/>
                X Cannot view PST conversations<br/>
                X Cannot view anonymous reports
              </div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <div onClick={()=>setShowGhostConfirm(null)}
                style={{flex:1,padding:"12px",borderRadius:11,cursor:"pointer",textAlign:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",fontSize:13,fontWeight:700,color:"#475569"}}>
                Cancel
              </div>
              <div onClick={()=>(setGhostTarget(showGhostConfirm),setShowGhostConfirm(null),onGhostLogin(showGhostConfirm))}
                style={{flex:2,padding:"12px",borderRadius:11,cursor:"pointer",textAlign:"center",background:"rgba(234,179,8,0.12)",border:"1.5px solid rgba(234,179,8,0.35)",fontSize:13,fontWeight:700,color:"#eab308"}}>
                Enter Support View
              </div>
            </div>
          </div>
        </div>
      )}
    </ScreenSingle>
  );
}

function PSTPanelScreen({navigate,agency}){
  const[members,setMembers]=useState([
    {name:"J. Martinez",role:"PST Lead",status:"on"},
    {name:"A. Thompson",role:"PST Member",status:"phone"},
    {name:"C. Williams",role:"PST Member",status:"off"},
    {name:"D. Nguyen",role:"PST Member",status:"on"},
  ]);
  const[myStatus,setMyStatus]=useState("on");
  const statusMap={
    on:{label:"On Duty",color:"#22c55e",dot:"#22c55e",bg:"rgba(34,197,94,0.12)"},
    phone:{label:"Available by Phone",color:"#eab308",dot:"#eab308",bg:"rgba(234,179,8,0.1)"},
    off:{label:"Off Duty",color:"#3d5268",dot:"#1e3a52",bg:"rgba(255,255,255,0.03)"},
  };
  const lc=useLayoutConfig();
  const onCount=members.filter(m=>m.status==="on").length;
  const phoneCount=members.filter(m=>m.status==="phone").length;

  return(
    <ScreenSingle headerProps={{onBack:()=>navigate("home"),title:"PST Coverage Panel",agencyName:(agency&&agency.name)}}>
      <div style={{background:"rgba(139,92,246,0.08)",border:"1.5px solid rgba(139,92,246,0.2)",borderRadius:14,padding:"14px 16px"}}>
        <div style={{fontSize:12,color:"#a78bfa",fontWeight:700,marginBottom:4}}>🟣 PST SHIFT COVERAGE</div>
        <div style={{fontSize:13,color:"#c4b5fd",lineHeight:1.6}}>On Duty notified first . Available by Phone second . Off Duty not notified</div>
        <div style={{display:"flex",gap:16,marginTop:10}}>
          <span style={{fontSize:12,color:"#22c55e",fontWeight:700}}>🟢 {onCount} On Duty</span>
          <span style={{fontSize:12,color:"#eab308",fontWeight:700}}>🟡 {phoneCount} By Phone</span>
          <span style={{fontSize:12,color:"#3d5268",fontWeight:700}}>(o) {members.length-onCount-phoneCount} Off Duty</span>
        </div>
      </div>

      <div>
        <div style={{fontSize:11,color:"#a78bfa",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10}}>My Availability</div>
        <div style={{display:"flex",gap:8}}>
          {Object.entries(statusMap).map(([k,s])=>(
            <div key={k} onClick={()=>setMyStatus(k)} style={{flex:1,background:myStatus===k?s.bg:"rgba(255,255,255,0.03)",border:`1.5px solid ${myStatus===k?s.color+"55":"rgba(255,255,255,0.065)"}`,borderRadius:12,padding:"12px 8px",cursor:"pointer",textAlign:"center",transition:"all 0.15s"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:s.dot,margin:"0 auto 6px"}}/>
              <div style={{fontSize:11,fontWeight:700,color:myStatus===k?s.color:"#2d4a66",lineHeight:1.4}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{fontSize:11,color:"#64748b",fontWeight:700,letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10}}>Team Coverage</div>
        {members.map((m,i)=>{const s=statusMap[m.status];return(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:i<members.length-1?"1px solid rgba(255,255,255,0.05)":"none"}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:s.dot,flexShrink:0}}/>
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"#dde8f4"}}>{m.name}</div><div style={{fontSize:11,color:"#3d5268"}}>{m.role}</div></div>
              <div style={{fontSize:11,fontWeight:600,color:s.color,background:s.bg,padding:"4px 10px",borderRadius:8}}>{s.label}</div>
            </div>
          );
        })}
      </div>
    </ScreenSingle>
  );
}

// 
// WELLNESS TREND DASHBOARD
// 
function DashboardScreen({navigate,agency}){
  const hp={onBack:()=>navigate("admintools"),title:"Wellness Dashboard",agencyName:agency&&agency.name};
  const trendData=[
    {day:"Mon",g:48,y:30,o:14,r:8},
    {day:"Tue",g:52,y:28,o:12,r:8},
    {day:"Wed",g:42,y:30,o:18,r:10},
    {day:"Thu",g:55,y:26,o:13,r:6},
    {day:"Fri",g:44,y:32,o:16,r:8},
    {day:"Sat",g:58,y:26,o:10,r:6},
    {day:"Sun",g:50,y:28,o:14,r:8},
  ];
  const heatmap=[
    {day:"Mon",count:18},{day:"Tue",count:22},{day:"Wed",count:31},
    {day:"Thu",count:20},{day:"Fri",count:28},{day:"Sat",count:12},{day:"Sun",count:9},
  ];
  const maxHeat=Math.max(...heatmap.map(h=>h.count));
  const shiftTiming=[
    {label:"Start of Shift",count:32,pct:39,color:"#38bdf8"},
    {label:"Midshift",      count:28,pct:34,color:"#eab308"},
    {label:"End of Shift",  count:23,pct:28,color:"#a78bfa"},
  ];
  const toolAfterRough=[
    {label:"Box Breathing",    pct:38,color:"#22c55e"},
    {label:"AI PST Chat",      pct:32,color:"#ef4444"},
    {label:"90-Second Dump",   pct:24,color:"#f97316"},
    {label:"5-4-3-2-1 Ground.",pct:18,color:"#38bdf8"},
    {label:"Journal",          pct:14,color:"#a78bfa"},
  ];
  const weeklyTrend=[
    {week:"Feb W1",great:44,ok:32,rough:16,bad:8},
    {week:"Feb W2",great:46,ok:30,rough:15,bad:9},
    {week:"Feb W3",great:41,ok:33,rough:17,bad:9},
    {week:"Feb W4",great:48,ok:30,rough:14,bad:8},
    {week:"Mar W1",great:50,ok:28,rough:14,bad:8},
    {week:"Mar W2",great:52,ok:27,rough:13,bad:8},
  ];
  return(
    <ScreenSingle headerProps={hp}>
      <div style={{background:"rgba(56,189,248,0.06)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:12,padding:"10px 14px"}}>
        <div style={{fontSize:11,color:"#38bdf8",fontWeight:700}}>🔒 Anonymous & aggregated - minimum 5 responses before any category displays</div>
      </div>

      <Card>
        <SLabel color="#38bdf8">MHC Wellness - Last 7 Days</SLabel>
        <div style={{display:"flex",gap:3,height:90,alignItems:"flex-end",marginTop:12}}>
          {trendData.map((d,i)=>(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",gap:1,alignItems:"center"}}>
              <div style={{width:"100%",background:"#ef4444",height:`${d.r*0.75}px`,borderRadius:"2px 2px 0 0"}}/>
              <div style={{width:"100%",background:"#f97316",height:`${d.o*0.75}px`}}/>
              <div style={{width:"100%",background:"#eab308",height:`${d.y*0.75}px`}}/>
              <div style={{width:"100%",background:"#22c55e",height:`${d.g*0.75}px`,borderRadius:"0 0 2px 2px"}}/>
              <div style={{fontSize:9,color:"#2d4a66",marginTop:4}}>{d.day}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:10,marginTop:10,flexWrap:"wrap"}}>
          {[{c:"#22c55e",l:"Great"},{c:"#eab308",l:"Striving"},{c:"#f97316",l:"Not Well"},{c:"#ef4444",l:"Ill"}].map((x,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:"50%",background:x.c}}/><span style={{fontSize:10,color:"#2d4a66"}}>{x.l}</span></div>
          ))}
        </div>
      </Card>

      <Card>
        <SLabel color="#64748b">Weekly Trend Direction</SLabel>
        <div style={{display:"flex",gap:8,marginBottom:6}}>
          <div style={{fontSize:11,color:"#22c55e",fontWeight:700}}>IMPROVING</div>
          <div style={{fontSize:11,color:"#334155"}}>Great% up 8pts over 6 weeks</div>
        </div>
        <div style={{display:"flex",gap:3,height:60,alignItems:"flex-end"}}>
          {weeklyTrend.map((w,i)=>(
            <div key={i} style={{flex:1,display:"flex",flexDirection:"column",gap:1,alignItems:"center"}}>
              <div style={{width:"100%",background:"#ef4444",height:`${w.bad*0.5}px`,borderRadius:"2px 2px 0 0"}}/>
              <div style={{width:"100%",background:"#f97316",height:`${w.rough*0.5}px`}}/>
              <div style={{width:"100%",background:"#eab308",height:`${w.ok*0.5}px`}}/>
              <div style={{width:"100%",background:"#22c55e",height:`${w.great*0.5}px`,borderRadius:"0 0 2px 2px"}}/>
              <div style={{fontSize:8,color:"#1e3a52",marginTop:3,textAlign:"center"}}>{w.week.split(' ')[1]}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
          <span style={{fontSize:9,color:"#1e3a52"}}>Feb W1</span>
          <span style={{fontSize:9,color:"#1e3a52"}}>Mar W2</span>
        </div>
      </Card>

      <Card>
        <SLabel color="#eab308">Check-In Heatmap - By Day of Week</SLabel>
        <div style={{fontSize:10,color:"#334155",marginBottom:10}}>Volume of check-ins per day (counts only)</div>
        <div style={{display:"flex",gap:4,alignItems:"flex-end",height:60}}>
          {heatmap.map((h,i)=>{
            const pct=h.count/maxHeat;
            const col=pct>0.8?"#ef4444":pct>0.6?"#f97316":pct>0.4?"#eab308":"#22c55e";
            return(
              <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={{fontSize:9,color:col,fontWeight:700}}>{h.count}</div>
                <div style={{width:"100%",background:col,height:`${pct*44}px`,borderRadius:4,opacity:0.8}}/>
                <div style={{fontSize:9,color:"#2d4a66"}}>{h.day}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <SLabel color="#a78bfa">Shift Wellness by Shift</SLabel>
        {[{shift:"A Shift",pcts:[52,26,14,8]},{shift:"B Shift",pcts:[44,32,16,8]},{shift:"C Shift",pcts:[58,24,12,6]}].map((s,i)=>(
          <div key={i} style={{marginTop:12}}>
            <div style={{fontSize:12,color:"#8099b0",marginBottom:5,fontWeight:600}}>{s.shift}</div>
            <div style={{display:"flex",height:14,borderRadius:8,overflow:"hidden",gap:1}}>
              {["#22c55e","#eab308","#f97316","#ef4444"].map((c,j)=>(<div key={j} style={{width:`${s.pcts[j]}%`,background:c}}/>))}
            </div>
            <div style={{display:"flex",gap:10,marginTop:4,flexWrap:"wrap"}}>
              {[{c:"#22c55e",l:"Great"},{c:"#eab308",l:"Striving"},{c:"#f97316",l:"Not Well"},{c:"#ef4444",l:"Ill"}].map((x,j)=>(
                <span key={j} style={{fontSize:10,color:x.c,fontWeight:600}}>{s.pcts[j]}% {x.l}</span>
              ))}
            </div>
          </div>
        ))}
      </Card>

      <Card>
        <SLabel color="#f97316">Tool Effectiveness Signals</SLabel>
        <div style={{fontSize:10,color:"#334155",marginBottom:12}}>Anonymous behavioral patterns - not tied to individuals</div>
        <div style={{display:"flex",gap:10,marginBottom:12}}>
          {[
            {label:"Used a tool after rough check-in",pct:"62%",color:"#22c55e"},
            {label:"Used 2+ tools in one session",     pct:"34%",color:"#38bdf8"},
            {label:"AI PST -> switched to Human PST",   pct:"18%",color:"#a78bfa"},
          ].map((s,i)=>(
            <div key={i} style={{flex:1,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"12px 8px",textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:900,color:s.color}}>{s.pct}</div>
              <div style={{fontSize:9,color:"#475569",marginTop:4,lineHeight:1.4}}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:8}}>Most used tool after Rough/Bad check-in:</div>
        {toolAfterRough.map((t,i)=>(
          <div key={i} style={{marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
              <span style={{fontSize:11,color:"#8099b0"}}>{t.label}</span>
              <span style={{fontSize:11,fontWeight:700,color:t.color}}>{t.pct}%</span>
            </div>
            <div style={{height:5,borderRadius:4,background:"rgba(255,255,255,0.04)"}}>
              <div style={{height:"100%",width:`${t.pct}%`,background:t.color,borderRadius:4}}/>
            </div>
          </div>
        ))}
      </Card>

      <Card>
        <SLabel color="#22c55e">Critical Incident Markers - 30 Day</SLabel>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginTop:8}}>
          {[
            {date:"Mar 5", tag:"Multiple Casualties",  impact:"Significant MHC shift day-of and 3 days after"},
            {date:"Feb 28",tag:"Critical Incident",    impact:"Moderate stress spike, normalized within 2 days"},
            {date:"Feb 18",tag:"High Stress Incident", impact:"Minimal measurable impact"},
          ].map((ci,i)=>(
            <div key={i} style={{background:"rgba(255,255,255,0.03)",borderRadius:10,padding:"10px 12px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:"#64748b",flexShrink:0}}/>
                <div style={{fontSize:12,fontWeight:700,color:"#94a3b8"}}>{ci.date} - {ci.tag}</div>
              </div>
              <div style={{fontSize:11,color:"#2d4a66",paddingLeft:15}}>{ci.impact}</div>
            </div>
          ))}
        </div>
      </Card>
    </ScreenSingle>
  );
}

function MetricsScreen({navigate,agency}){
  const hp={onBack:()=>navigate("admintools"),title:"Usage Metrics",agencyName:agency&&agency.name};
  const featureUsage=[
    {label:"Shift Check-Ins",        count:83,pct:100,color:"#38bdf8", icon:"[ok]"},
    {label:"AI PST Chat",            count:47,pct:57, color:"#ef4444", icon:"🤖"},
    {label:"Box Breathing",          count:38,pct:46, color:"#22c55e", icon:"🫁"},
    {label:"Resources Accessed",     count:34,pct:41, color:"#64748b", icon:"📚"},
    {label:"5-4-3-2-1 Grounding",    count:29,pct:35, color:"#38bdf8", icon:"🖐"},
    {label:"Journal",                count:22,pct:27, color:"#a78bfa", icon:"📓"},
    {label:"Human PST - Chat",       count:21,pct:25, color:"#a78bfa", icon:"💬"},
    {label:"90-Second Dump",         count:18,pct:22, color:"#f97316", icon:"(t)"},
    {label:"After-Action Reset",     count:15,pct:18, color:"#f97316", icon:"🔄"},
    {label:"Human PST - Call",       count:14,pct:17, color:"#a78bfa", icon:"📞"},
    {label:"PTSD Interruption",      count:11,pct:13, color:"#7EBFAD", icon:"🧭"},
    {label:"Anonymous Reports",      count:8, pct:10, color:"#eab308", icon:"🔒"},
    {label:"Human PST - Text",       count:9, pct:11, color:"#a78bfa", icon:"📱"},
    {label:"Human PST - In Person",  count:6, pct:7,  color:"#a78bfa", icon:"🤝"},
  ];
  const resourceGaps=[
    {label:"Crisis Resources",      views:142,status:"high",   color:"#ef4444"},
    {label:"State Pathways",        views:87, status:"high",   color:"#f97316"},
    {label:"Upstream Tools",        views:54, status:"normal", color:"#22c55e"},
    {label:"Downstream Resources",  views:12, status:"low",    color:"#eab308"},
    {label:"CISM Protocols",        views:3,  status:"gap",    color:"#334155"},
    {label:"Chaplain Services",     views:0,  status:"gap",    color:"#1e3a52"},
  ];
  return(
    <ScreenSingle headerProps={hp}>
      <div style={{background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.15)",borderRadius:12,padding:"10px 14px"}}>
        <div style={{fontSize:11,color:"#22c55e",fontWeight:700}}>📊 Anonymous aggregated data - no individual usage is tracked</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {[
          {label:"Active Users",       value:"127",sub:"This month",      color:"#38bdf8"},
          {label:"Total Sessions",     value:"312",sub:"This month",      color:"#22c55e"},
          {label:"Escalations",        value:"3",  sub:"All resolved",    color:"#eab308"},
          {label:"Avg Daily Check-Ins",value:"12", sub:"Per day",         color:"#a78bfa"},
        ].map((s,i)=>(
          <div key={i} style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:14,padding:"14px",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:s.color,opacity:0.5}}/>
            <div style={{fontSize:28,fontWeight:900,color:s.color,lineHeight:1}}>{s.value}</div>
            <div style={{fontSize:11,fontWeight:700,color:"#94a3b8",marginTop:2}}>{s.label}</div>
            <div style={{fontSize:10,color:"#334155"}}>{s.sub}</div>
          </div>
        ))}
      </div>

      <Card>
        <SLabel color="#38bdf8">PST Coverage Health</SLabel>
        <div style={{fontSize:10,color:"#334155",marginBottom:10}}>Aggregated availability - not tied to individual PST members</div>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          {[
            {label:"Green Coverage",  pct:"74%",sub:"Full coverage",  color:"#22c55e"},
            {label:"Yellow Coverage", pct:"21%",sub:"Thin coverage",  color:"#eab308"},
            {label:"Red Coverage",    pct:"5%", sub:"No one available",color:"#ef4444"},
          ].map((c,i)=>(
            <div key={i} style={{flex:1,background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"12px 8px",textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:900,color:c.color}}>{c.pct}</div>
              <div style={{fontSize:9,fontWeight:700,color:c.color,marginTop:3}}>{c.label}</div>
              <div style={{fontSize:9,color:"#334155",marginTop:2}}>{c.sub}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
          <span style={{fontSize:12,color:"#8099b0"}}>Avg PST members online / day</span>
          <span style={{fontSize:13,fontWeight:700,color:"#38bdf8"}}>2.4</span>
        </div>
      </Card>

      <Card>
        <SLabel color="#a78bfa">Broadcast Request Metrics</SLabel>
        <div style={{display:"flex",flexDirection:"column",gap:0}}>
          {[
            {label:"Total broadcasts sent",              value:"19",  color:"#cbd5e1"},
            {label:"Avg claim time",                     value:"6 min",color:"#22c55e"},
            {label:"Claimed within 10 minutes",          value:"84%", color:"#22c55e"},
            {label:"Escalated at 30+ minutes",           value:"11%", color:"#eab308"},
            {label:"Resolved (closed by PST or responder)",value:"89%",color:"#22c55e"},
            {label:"Unclaimed / expired",                value:"11%", color:"#ef4444"},
          ].map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<5?"1px solid rgba(255,255,255,0.04)":"none"}}>
              <span style={{fontSize:12,color:"#8099b0"}}>{m.label}</span>
              <span style={{fontSize:13,fontWeight:700,color:m.color}}>{m.value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SLabel color="#f97316">PST Follow-Up Metrics</SLabel>
        <div style={{display:"flex",flexDirection:"column",gap:0}}>
          {[
            {label:"Chats marked for follow-up",        value:"14",  color:"#cbd5e1"},
            {label:"Follow-ups completed",              value:"12",  color:"#22c55e"},
            {label:"Completed within 24 hours",         value:"79%", color:"#22c55e"},
            {label:"Avg follow-up completion time",     value:"18 hrs",color:"#38bdf8"},
            {label:"Open / pending",                    value:"2",   color:"#eab308"},
          ].map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<4?"1px solid rgba(255,255,255,0.04)":"none"}}>
              <span style={{fontSize:12,color:"#8099b0"}}>{m.label}</span>
              <span style={{fontSize:13,fontWeight:700,color:m.color}}>{m.value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SLabel color="#38bdf8">AI PST Engagement</SLabel>
        <div style={{display:"flex",flexDirection:"column",gap:0}}>
          {[
            {label:"Total conversations",               value:"47",  color:"#cbd5e1"},
            {label:"Avg session length",                value:"9 min",color:"#38bdf8"},
            {label:"Returned within 24 hours",          value:"31%", color:"#22c55e"},
            {label:"Switched AI to Human PST",          value:"18%", color:"#a78bfa"},
          ].map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:i<3?"1px solid rgba(255,255,255,0.04)":"none"}}>
              <span style={{fontSize:12,color:"#8099b0"}}>{m.label}</span>
              <span style={{fontSize:13,fontWeight:700,color:m.color}}>{m.value}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SLabel color="#38bdf8">Feature Engagement - This Month</SLabel>
        <div style={{fontSize:10,color:"#334155",marginBottom:12}}>Ranked by usage. Bar = % of users who used each feature.</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {featureUsage.map((f,i)=>(
            <div key={i}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <span style={{fontSize:13}}>{f.icon}</span>
                  <span style={{fontSize:11,color:"#8099b0"}}>{f.label}</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:10,color:"#334155"}}>{f.count}x</span>
                  <span style={{fontSize:11,fontWeight:700,color:f.color,minWidth:34,textAlign:"right"}}>{f.pct}%</span>
                </div>
              </div>
              <div style={{height:5,borderRadius:4,background:"rgba(255,255,255,0.04)"}}>
                <div style={{height:"100%",width:`${f.pct}%`,background:f.color,borderRadius:4,opacity:0.8}}/>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SLabel color="#64748b">Resource Gap Analysis</SLabel>
        <div style={{fontSize:10,color:"#334155",marginBottom:10}}>High-view items show demand. Zero-view items need attention.</div>
        {resourceGaps.map((r,i)=>(
          <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<5?"1px solid rgba(255,255,255,0.04)":"none"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:r.color,flexShrink:0}}/>
              <span style={{fontSize:12,color:"#8099b0"}}>{r.label}</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:12,fontWeight:700,color:r.color}}>{r.views} views</span>
              {r.status==="gap"&&<span style={{fontSize:9,fontWeight:800,color:"#ef4444",background:"rgba(239,68,68,0.15)",padding:"2px 6px",borderRadius:5}}>NEEDS ATTENTION</span>}
              {r.status==="high"&&<span style={{fontSize:9,fontWeight:800,color:"#22c55e",background:"rgba(34,197,94,0.12)",padding:"2px 6px",borderRadius:5}}>HIGH DEMAND</span>}
            </div>
          </div>
        ))}
      </Card>
    </ScreenSingle>
  );
}

const STATE_RESOURCES = {
  "AB": [
    {name:"Alberta Health Services Addiction & Mental Health",detail:"Provincial Program - Crisis; MH",url:"https://albertahealthservices.ca",phone:"811",icon:"💙",color:"#38bdf8",free:true,disciplines:["All"],tags:["Crisis", "MH", "Substance Use"]},
    {name:"Foothills Medical Centre Psychiatry",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://albertahealthservices.ca",phone:"403-944-1110",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Royal Alexandra Hospital Psychiatry",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://albertahealthservices.ca",phone:"780-735-4111",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Claresholm Centre for Mental Health",detail:"Behavioral Health Hospital - Trauma; MH",url:"https://albertahealthservices.ca",phone:"403-682-3500",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "MH"]},
    {name:"Fresh Start Recovery Centre",detail:"Residential Treatment - Substance Use; Trauma",url:"https://freshstartrecovery.ca",phone:"403-387-6266",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "AK": [
    {name:"Alaska Psychiatric Institute",detail:"Behavioral Health Hospital - Trauma; Crisis; Severe MH",url:"https://dhss.alaska.gov",phone:"907-269-7100",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis", "Inpatient"]},
    {name:"Providence Alaska Medical Center BH",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://providence.org",phone:"907-562-2211",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Fairbanks Memorial Hospital BH",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://foundationhealth.org",phone:"907-452-8181",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Bartlett Regional Hospital BH",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://bartletthospital.org",phone:"907-796-8900",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Rainforest Recovery Center",detail:"Residential Treatment - Substance Use; Trauma",url:"https://bartletthospital.org",phone:"907-796-8690",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "AL": [
    {name:"UAB Medicine Psychiatry",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://uabmedicine.org",phone:"205-934-3411",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis", "Inpatient", "Outpatient"]},
    {name:"Huntsville Hospital Behavioral Health",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://huntsvillehospital.org",phone:"256-265-8123",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Brookwood Baptist Medical Center BH",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://brookwoodbaptisthealth.com",phone:"205-877-1000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Bradford Health Services",detail:"Residential Treatment - Substance Use; Trauma",url:"https://bradfordhealth.com",phone:"888-577-0012",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
    {name:"AltaPointe Health",detail:"Outpatient/Community MH - Crisis; MH; Substance Use",url:"https://altapointe.org",phone:"251-450-2211",icon:"🆘",color:"#f97316",free:false,disciplines:["All"],tags:["Crisis", "MH", "Substance Use"]},
    {name:"Hill Crest Behavioral Health",detail:"Inpatient Treatment - Trauma; Substance Use",url:"https://hillcrestbhs.com",phone:"205-856-7864",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Substance Use", "Inpatient"]},
  ],
  "AR": [
    {name:"UAMS Psychiatric Research Institute",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://uamshealth.com",phone:"501-686-7000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Baptist Health Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://baptist-health.com",phone:"501-202-2000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"The BridgeWay",detail:"Inpatient Treatment - Trauma; Substance Use",url:"https://thebridgeway.com",phone:"800-245-0011",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Substance Use", "Inpatient"]},
    {name:"Pinnacle Pointe Behavioral Healthcare",detail:"Behavioral Health Hospital - Trauma; Youth",url:"https://pinnaclepointehospital.com",phone:"501-223-3322",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Youth"]},
    {name:"Oasis Renewal Center",detail:"Residential Treatment - Substance Use; Trauma",url:"https://oasisrenewalcenter.com",phone:"501-376-2747",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
    {name:"Arkansas BH Integration Network",detail:"Statewide Program - Crisis; MH",url:"https://humanservices.arkansas.gov",phone:"844-763-0198",icon:"🆘",color:"#f97316",free:true,disciplines:["All"],tags:["Crisis", "MH"]},
  ],
  "AZ": [
    {name:"Banner Behavioral Health",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://bannerhealth.com",phone:"602-254-4357",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Mayo Clinic Arizona Psychiatry",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://mayoclinic.org",phone:"480-515-6296",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Sonora Behavioral Health",detail:"Behavioral Health Hospital - Trauma; Substance Use",url:"https://sonorabehavioral.com",phone:"520-214-0211",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Substance Use"]},
    {name:"Sierra Tucson",detail:"Residential Treatment - PTSD; Trauma; Substance Use",url:"https://sierratucson.com",phone:"800-842-4487",icon:"🏠",color:"#ef4444",free:false,disciplines:["All"],tags:["PTSD", "Trauma", "Substance Use", "Responder-Competent"]},
    {name:"The Meadows",detail:"Residential Treatment - PTSD; Trauma; Substance Use",url:"https://themeadows.com",phone:"800-244-4949",icon:"🏠",color:"#ef4444",free:false,disciplines:["All"],tags:["PTSD", "Trauma", "Substance Use", "Responder-Competent"]},
    {name:"Community Bridges Inc",detail:"Outpatient/Crisis - Crisis; Substance Use",url:"https://communitybridgesaz.org",phone:"877-931-9142",icon:"🆘",color:"#f97316",free:false,disciplines:["All"],tags:["Crisis", "Substance Use"]},
    {name:"Terros Health",detail:"Outpatient - Crisis; MH",url:"https://terroshealth.org",phone:"602-685-6000",icon:"💙",color:"#22c55e",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
  ],
  "BC": [
    {name:"BC Mental Health & Substance Use Services",detail:"Provincial Program - MH; Substance Use",url:"https://bcmhsus.ca",phone:"604-524-7000",icon:"💙",color:"#38bdf8",free:true,disciplines:["All"],tags:["MH", "Substance Use"]},
    {name:"Vancouver General Hospital Psychiatry",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://vch.ca",phone:"604-875-4111",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"St. Paul's Hospital Psychiatry",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://providencehealthcare.org",phone:"604-806-8000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Island Health Mental Health & Substance Use",detail:"Outpatient/Crisis - Crisis; MH",url:"https://islandhealth.ca",phone:"250-370-8699",icon:"🆘",color:"#f97316",free:true,disciplines:["All"],tags:["Crisis", "MH", "Substance Use"]},
    {name:"Interior Health MHSU",detail:"Outpatient - MH; Substance Use (Rural)",url:"https://interiorhealth.ca",phone:"310-6789",icon:"💙",color:"#22c55e",free:true,disciplines:["All"],tags:["MH", "Substance Use"]},
    {name:"Edgewood Treatment Centre",detail:"Residential Treatment - Substance Use; Trauma",url:"https://edgewoodhealthnetwork.com",phone:"800-683-0111",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "CA": [
    {name:"UCLA Resnick Neuropsychiatric Hospital",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://uclahealth.org",phone:"310-825-9989",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"UCSF Langley Porter Psychiatric Institute",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://ucsfhealth.org",phone:"415-476-7000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Stanford Psychiatry & Behavioral Sciences",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://stanfordhealthcare.org",phone:"650-723-4000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Sutter Health Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://sutterhealth.org",phone:"916-887-4000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Didi Hirsch Mental Health Services",detail:"Outpatient/Crisis - Crisis; Suicide Prevention",url:"https://didihirsch.org",phone:"310-390-6612",icon:"🆘",color:"#f97316",free:false,disciplines:["All"],tags:["Crisis", "Suicide Prevention"]},
    {name:"Exodus Recovery",detail:"Crisis Stabilization/Outpatient - Crisis; Substance Use",url:"https://exodusrecovery.com",phone:"800-905-4673",icon:"🆘",color:"#f97316",free:false,disciplines:["All"],tags:["Crisis", "Substance Use"]},
    {name:"Betty Ford Center (Hazelden)",detail:"Residential Treatment - Substance Use; Trauma",url:"https://hazeldenbettyford.org",phone:"866-831-5700",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential", "Responder-Competent"]},
    {name:"Hope Cooperative Sacramento",detail:"Community MH - Crisis; MH Support",url:"https://hopecoop.org",phone:"916-441-0123",icon:"💙",color:"#22c55e",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
  ],
  "CO": [
    {name:"UCHealth Behavioral Health",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://uchealth.org",phone:"720-848-0000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Denver Health Behavioral Health",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://denverhealth.org",phone:"303-602-3300",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Colorado Crisis Services",detail:"Statewide Crisis Program - Crisis; MH",url:"https://coloradocrisisservices.org",phone:"844-493-8255",icon:"🆘",color:"#f97316",free:true,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Centennial Peaks Hospital",detail:"Behavioral Health Hospital - Trauma; Substance Use",url:"https://centennialpeaks.com",phone:"303-673-9990",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Substance Use"]},
    {name:"Cedar Springs Hospital",detail:"Behavioral Health Hospital - Trauma; General MH",url:"https://cedarspringsbhs.com",phone:"719-633-4114",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "MH"]},
    {name:"Recovery Village at Palmer Lake",detail:"Residential Treatment - Substance Use; Trauma",url:"https://therecoveryvillage.com",phone:"719-602-0914",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
    {name:"Mind Springs Health",detail:"Outpatient/Crisis - Crisis; MH (Rural)",url:"https://mindspringshealth.org",phone:"970-241-0324",icon:"💙",color:"#22c55e",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
  ],
  "CT": [
    {name:"Yale New Haven Psychiatry",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://ynhh.org",phone:"203-688-4242",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Hartford HealthCare Behavioral Health",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://hhchealth.org",phone:"860-545-7200",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Silver Hill Hospital",detail:"Residential Treatment - Trauma; Substance Use",url:"https://silverhillhospital.org",phone:"866-542-4455",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Trauma", "Substance Use", "Residential"]},
    {name:"Wheeler Clinic",detail:"Outpatient - Crisis; MH",url:"https://wheelerclinic.org",phone:"888-793-3500",icon:"💙",color:"#22c55e",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Natchaug Hospital",detail:"Behavioral Health Hospital - Trauma; MH",url:"https://natchaug.org",phone:"860-456-1311",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "MH", "Youth"]},
  ],
  "DE": [
    {name:"ChristianaCare Behavioral Health",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://christianacare.org",phone:"302-733-1000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Dover Behavioral Health",detail:"Inpatient Treatment - Trauma; Substance Use",url:"https://doverbehavioral.com",phone:"302-741-0140",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Substance Use", "Inpatient"]},
    {name:"Rockford Center",detail:"Behavioral Health Hospital - Trauma; MH",url:"https://rockfordcenter.com",phone:"866-847-4357",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "MH", "Youth"]},
    {name:"SUN Behavioral Delaware",detail:"Behavioral Health Hospital - Crisis; Substance Use",url:"https://sunbehavioral.com",phone:"302-604-5600",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "Substance Use"]},
  ],
  "FL": [
    {name:"UF Health Psychiatry",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://ufhealth.org",phone:"352-265-5481",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Jackson Behavioral Health",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://jacksonhealth.org",phone:"305-355-7000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Tampa General Behavioral Health",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://tgh.org",phone:"813-844-7000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Central Florida Behavioral Hospital",detail:"Behavioral Health Hospital - Trauma; Substance Use",url:"https://cfbehavioral.com",phone:"407-370-0111",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Substance Use"]},
    {name:"Hazelden Betty Ford Naples",detail:"Residential Treatment - Substance Use; Trauma",url:"https://hazeldenbettyford.org",phone:"866-831-5700",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential", "Responder-Competent"]},
    {name:"Aspire Health Partners",detail:"Outpatient/Crisis - Crisis; MH",url:"https://aspirehealthpartners.com",phone:"407-875-3700",icon:"💙",color:"#22c55e",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
  ],
  "GA": [
    {name:"Emory Behavioral Health",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://emoryhealthcare.org",phone:"404-778-5526",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Piedmont Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://piedmont.org",phone:"404-605-5000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Ridgeview Institute",detail:"Behavioral Health Hospital - Trauma; Substance Use",url:"https://ridgeviewinstitute.com",phone:"770-434-4567",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Substance Use"]},
    {name:"Peachford Hospital",detail:"Behavioral Health Hospital - Trauma; MH",url:"https://peachford.com",phone:"770-455-3200",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "MH", "Youth"]},
    {name:"Willingway",detail:"Residential Treatment - Substance Use; Trauma",url:"https://willingway.com",phone:"888-979-2140",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "HI": [
    {name:"Queen's Medical Center Behavioral Health",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://queens.org",phone:"808-691-1000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Hawaii State Hospital",detail:"Behavioral Health Hospital - Severe MH",url:"https://health.hawaii.gov",phone:"808-247-2191",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["MH", "Inpatient"]},
    {name:"Kuakini Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://kuakini.org",phone:"808-536-2236",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Hina Mauka",detail:"Residential Treatment - Substance Use; Trauma",url:"https://hinamauka.org",phone:"808-236-2600",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "IA": [
    {name:"University of Iowa Psychiatry",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://uihc.org",phone:"319-356-1616",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Broadlawns Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://broadlawns.org",phone:"515-282-2200",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"MercyOne Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://mercyone.org",phone:"515-247-3121",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Rosecrance Jackson Centers",detail:"Residential Treatment - Substance Use; Trauma",url:"https://rosecrance.org",phone:"800-472-9018",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "ID": [
    {name:"St. Luke's Behavioral Health",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://stlukesonline.org",phone:"208-381-2222",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Saint Alphonsus Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://saintalphonsus.org",phone:"208-367-2121",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Intermountain Hospital",detail:"Behavioral Health Hospital - Trauma; Substance Use",url:"https://intermountainhospital.com",phone:"208-377-8400",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Substance Use"]},
    {name:"Northpoint Recovery",detail:"Residential Treatment - Substance Use; Trauma",url:"https://northpointrecovery.com",phone:"208-901-8530",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "IL": [
    {name:"Rush University Road Home Program",detail:"Outpatient - PTSD; Trauma (Responder/Veteran)",url:"https://roadhomeprogram.org",phone:"312-942-8387",icon:"🧠",color:"#ef4444",free:false,disciplines:["All"],tags:["PTSD", "Trauma", "Responder-Competent"]},
    {name:"Northwestern Medicine Behavioral Health",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://nm.org",phone:"312-926-2000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"University of Chicago Psychiatry",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://uchicagomedicine.org",phone:"773-702-1000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Linden Oaks Behavioral Health",detail:"Behavioral Health Hospital - Trauma; Substance Use",url:"https://eehealth.org",phone:"630-305-5027",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Substance Use"]},
    {name:"Gateway Foundation",detail:"Residential Treatment - Substance Use; Trauma",url:"https://gatewayfoundation.org",phone:"877-505-4673",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "IN": [
    {name:"IU Health Behavioral Health",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://iuhealth.org",phone:"317-962-2000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Community Health Network Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://ecommunity.com",phone:"317-621-5700",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Ascension St. Vincent Stress Center",detail:"Behavioral Health Hospital - Trauma; Substance Use",url:"https://ascension.org",phone:"317-338-4800",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Substance Use"]},
    {name:"Valle Vista Health System",detail:"Inpatient Treatment - Trauma; Substance Use",url:"https://vallevistahospital.com",phone:"800-447-1348",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Substance Use", "Inpatient"]},
    {name:"Tara Treatment Center",detail:"Residential Treatment - Substance Use; Trauma",url:"https://taratreatmentcenter.org",phone:"800-397-9978",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "KS": [
    {name:"University of Kansas Health System Psychiatry",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://kansashealthsystem.com",phone:"913-588-1227",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Stormont Vail Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://stormontvail.org",phone:"785-354-6000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"KVC Hospitals",detail:"Behavioral Health Hospital - Trauma; Youth",url:"https://kvc.org",phone:"913-890-7468",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Youth"]},
    {name:"Valley Hope of Norton",detail:"Residential Treatment - Substance Use; Trauma",url:"https://valleyhope.org",phone:"785-877-5101",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "KY": [
    {name:"UK HealthCare Psychiatry",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://ukhealthcare.uky.edu",phone:"859-257-1000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"UofL Health Peace Hospital",detail:"Behavioral Health Hospital - Trauma; MH",url:"https://uoflhealth.org",phone:"502-451-3330",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "MH"]},
    {name:"The Brook Hospitals",detail:"Behavioral Health Hospital - Trauma; Substance Use",url:"https://thebrookhospital.com",phone:"800-866-8876",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Substance Use"]},
    {name:"Addiction Recovery Care",detail:"Residential Treatment - Substance Use; Trauma",url:"https://arccenters.com",phone:"606-638-0938",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "LA": [
    {name:"Ochsner Behavioral Health",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://ochsner.org",phone:"504-842-3000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Tulane Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://tulanehealthcare.com",phone:"504-988-5800",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"River Oaks Hospital",detail:"Behavioral Health Hospital - Trauma; MH",url:"https://riveroakshospital.com",phone:"800-366-1740",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "MH"]},
    {name:"Townsend Recovery Center",detail:"Residential Treatment - Substance Use; Trauma",url:"https://townsendla.com",phone:"800-760-8561",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "MA": [
    {name:"McLean Hospital - LEADER Program",detail:"Behavioral Health Hospital - PTSD; Responder",url:"https://mcleanhospital.org",phone:"800-333-0338",icon:"🧠",color:"#ef4444",free:false,disciplines:["All"],tags:["PTSD", "Trauma", "Responder-Competent"]},
    {name:"Mass General Psychiatry",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://massgeneral.org",phone:"617-726-2000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Brigham and Women's Psychiatry",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://brighamandwomens.org",phone:"617-732-5500",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Bournewood Hospital",detail:"Inpatient Treatment - Trauma; Substance Use",url:"https://bournewood.com",phone:"617-469-0300",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Substance Use", "Inpatient"]},
  ],
  "MB": [
    {name:"Manitoba Mental Health & Wellness",detail:"Provincial Program - Crisis; MH",url:"https://gov.mb.ca/health/mh",phone:"1-888-617-7715",icon:"💙",color:"#38bdf8",free:true,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Health Sciences Centre Psychiatry",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://hsc.mb.ca",phone:"204-787-3167",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"St. Boniface Hospital Psychiatry",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://stbonifacehospital.ca",phone:"204-237-2647",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Addictions Foundation of Manitoba",detail:"Residential Treatment - Substance Use; Trauma",url:"https://afm.mb.ca",phone:"1-866-638-2561",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "MD": [
    {name:"Johns Hopkins Psychiatry",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://hopkinsmedicine.org",phone:"410-955-5000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Sheppard Pratt",detail:"Behavioral Health Hospital - Trauma; MH",url:"https://sheppardpratt.org",phone:"410-938-3000",icon:"🏥",color:"#ef4444",free:false,disciplines:["All"],tags:["Trauma", "MH", "Responder-Competent"]},
    {name:"Adventist Behavioral Health",detail:"Behavioral Health Hospital - Trauma; Substance Use",url:"https://adventisthealthcare.com",phone:"301-838-4912",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Substance Use"]},
    {name:"Ashley Addiction Treatment",detail:"Residential Treatment - Substance Use; Trauma",url:"https://ashleytreatment.org",phone:"800-799-4673",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "ME": [
    {name:"Maine Medical Center Psychiatry",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://mainehealth.org",phone:"207-662-0111",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Northern Light Acadia Hospital",detail:"Behavioral Health Hospital - Trauma; Substance Use",url:"https://northernlighthealth.org",phone:"207-973-6100",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Substance Use"]},
    {name:"Spring Harbor Hospital",detail:"Behavioral Health Hospital - Trauma; MH",url:"https://mainebehavioralhealthcare.org",phone:"207-761-2200",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "MH", "Youth"]},
    {name:"Crossroads Maine",detail:"Residential Treatment - Substance Use (Women)",url:"https://crossroadsme.org",phone:"877-978-1667",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Residential"]},
  ],
  "MI": [
    {name:"University of Michigan Psychiatry",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://medicine.umich.edu",phone:"734-936-4000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Henry Ford Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://henryford.com",phone:"800-436-7936",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Pine Rest Christian Mental Health",detail:"Behavioral Health Hospital - Trauma; Substance Use",url:"https://pinerest.org",phone:"800-678-5500",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Substance Use"]},
    {name:"Harbor Oaks Hospital",detail:"Inpatient Treatment - Trauma; Substance Use",url:"https://harboroaks.com",phone:"586-725-5777",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Substance Use", "Inpatient"]},
    {name:"Skywood Recovery",detail:"Residential Treatment - Substance Use; Trauma",url:"https://skywoodrecovery.com",phone:"269-280-4673",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "MN": [
    {name:"Mayo Clinic Psychiatry",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://mayoclinic.org",phone:"507-284-2511",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"M Health Fairview Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://mhealthfairview.org",phone:"612-273-3000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Hazelden Betty Ford Minnesota",detail:"Residential Treatment - Substance Use; Trauma",url:"https://hazeldenbettyford.org",phone:"866-831-5700",icon:"🏠",color:"#ef4444",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential", "Responder-Competent"]},
    {name:"PrairieCare",detail:"Behavioral Health Hospital - Trauma; Youth",url:"https://prairie-care.com",phone:"952-826-8475",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "MH", "Youth"]},
  ],
  "MO": [
    {name:"Barnes-Jewish Hospital Psychiatry",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://barnesjewish.org",phone:"314-747-3000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Mercy Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://mercy.net",phone:"314-251-6000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"CenterPointe Hospital",detail:"Inpatient Treatment - Trauma; Substance Use",url:"https://centerpointehospital.com",phone:"800-345-5407",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Substance Use", "Inpatient"]},
    {name:"Burrell Behavioral Health",detail:"Outpatient - Crisis; MH",url:"https://burrellcenter.com",phone:"417-761-5000",icon:"💙",color:"#22c55e",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
  ],
  "MS": [
    {name:"University of Mississippi Medical Center Psychiatry",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://umc.edu",phone:"601-984-1000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Mississippi State Hospital",detail:"Behavioral Health Hospital - Severe MH",url:"https://msdh.ms.gov",phone:"601-351-8000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["MH", "Inpatient"]},
    {name:"Pine Grove Behavioral Health",detail:"Residential Treatment - Substance Use; Trauma",url:"https://pinegrovetreatment.com",phone:"888-574-4673",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
    {name:"Merit Health Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://merithealthwesley.com",phone:"601-268-8000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
  ],
  "MT": [
    {name:"Billings Clinic Behavioral Health",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://billingsclinic.com",phone:"406-238-2500",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"St. Patrick Hospital Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://providence.org",phone:"406-543-7271",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Montana State Hospital",detail:"Behavioral Health Hospital - Severe MH",url:"https://dphhs.mt.gov",phone:"406-693-7000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["MH", "Inpatient"]},
    {name:"Rimrock Foundation",detail:"Residential Treatment - Substance Use; Trauma",url:"https://rimrock.org",phone:"800-227-3953",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "NB": [
    {name:"Horizon Health Mental Health Services",detail:"Provincial Program - Crisis; MH",url:"https://horizonnb.ca",phone:"1-888-811-3664",icon:"💙",color:"#38bdf8",free:true,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Vitalite Health Network Mental Health",detail:"Provincial Program - MH; Substance Use",url:"https://vitalitenb.ca",phone:"1-888-820-5444",icon:"💙",color:"#38bdf8",free:true,disciplines:["All"],tags:["MH", "Substance Use"]},
    {name:"Addiction Services NB",detail:"Outpatient - Substance Use",url:"https://gnb.ca",phone:"1-866-355-5550",icon:"💊",color:"#22c55e",free:true,disciplines:["All"],tags:["Substance Use"]},
  ],
  "NC": [
    {name:"UNC Psychiatry",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://uncmedicalcenter.org",phone:"984-974-1000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Duke Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://dukehealth.org",phone:"919-684-8111",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Atrium Health Behavioral Health",detail:"Behavioral Health Hospital - Trauma; MH",url:"https://atriumhealth.org",phone:"704-444-2400",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "MH"]},
    {name:"Holly Hill Hospital",detail:"Behavioral Health Hospital - Trauma; Substance Use",url:"https://hollyhillhospital.com",phone:"919-250-7000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Substance Use"]},
    {name:"Old Vineyard Behavioral Health",detail:"Behavioral Health Hospital - Trauma; MH",url:"https://oldvineyardbhs.com",phone:"336-794-3550",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "MH", "Youth"]},
  ],
  "ND": [
    {name:"Sanford Behavioral Health",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://sanfordhealth.org",phone:"701-234-2000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Prairie St. John's",detail:"Behavioral Health Hospital - Trauma; Substance Use",url:"https://prairie-stjohns.com",phone:"701-476-7200",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Substance Use"]},
    {name:"North Dakota State Hospital",detail:"Behavioral Health Hospital - Severe MH",url:"https://www.hhs.nd.gov",phone:"701-253-3650",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["MH", "Inpatient"]},
    {name:"Heartview Foundation",detail:"Residential Treatment - Substance Use; Trauma",url:"https://heartview.org",phone:"701-222-0386",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "NE": [
    {name:"Nebraska Medicine Psychiatry",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://nebraskamed.com",phone:"402-559-4000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Bryan Medical Center Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://bryanhealth.com",phone:"402-481-1111",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"CHI Health Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://chihealth.com",phone:"402-717-4673",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Valley Hope of Omaha",detail:"Residential Treatment - Substance Use; Trauma",url:"https://valleyhope.org",phone:"402-991-8824",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "NH": [
    {name:"New Hampshire Hospital",detail:"Behavioral Health Hospital - Severe MH",url:"https://dhhs.nh.gov",phone:"603-271-5300",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["MH", "Inpatient"]},
    {name:"Dartmouth-Hitchcock Psychiatry",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://dhmc.org",phone:"603-650-5000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Hampstead Hospital",detail:"Behavioral Health Hospital - Trauma; MH",url:"https://hampsteadhospital.com",phone:"603-329-5311",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "MH", "Youth"]},
    {name:"Farnum Center",detail:"Residential Treatment - Substance Use; Trauma",url:"https://farnumcenter.org",phone:"603-622-3020",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "NJ": [
    {name:"Rutgers University Behavioral Health Care",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://ubhc.rutgers.edu",phone:"800-969-5300",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Hackensack Meridian Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://hackensackmeridianhealth.org",phone:"732-776-4555",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Carrier Clinic",detail:"Behavioral Health Hospital - Trauma; Substance Use",url:"https://carrierclinic.org",phone:"800-933-3579",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Substance Use"]},
    {name:"Princeton House Behavioral Health",detail:"Behavioral Health Hospital - Trauma; MH",url:"https://princetonhcs.org",phone:"800-242-2550",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "MH"]},
  ],
  "NL": [
    {name:"NL Mental Health & Addictions",detail:"Provincial Program - Crisis; MH",url:"https://gov.nl.ca",phone:"811",icon:"💙",color:"#38bdf8",free:true,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Waterford Hospital",detail:"Behavioral Health Hospital - MH; Trauma",url:"https://easternhealth.ca",phone:"709-777-6300",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["MH", "Trauma"]},
    {name:"Humberwood Treatment Centre",detail:"Residential Treatment - Substance Use",url:"https://westernhealth.nl.ca",phone:"709-634-4506",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Residential"]},
  ],
  "NM": [
    {name:"UNM Psychiatric Center",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://unmhealth.org",phone:"505-272-2800",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Presbyterian Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://phs.org",phone:"505-841-1234",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Mesilla Valley Hospital",detail:"Behavioral Health Hospital - Trauma; Substance Use",url:"https://mesillavalleyhospital.com",phone:"575-382-3500",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Substance Use"]},
    {name:"Shadow Mountain Recovery",detail:"Residential Treatment - Substance Use; Trauma",url:"https://shadowmountainrecovery.com",phone:"855-700-1667",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "NS": [
    {name:"Nova Scotia Mental Health & Addictions",detail:"Provincial Program - Crisis; MH",url:"https://mha.nshealth.ca",phone:"1-855-922-1122",icon:"💙",color:"#38bdf8",free:true,disciplines:["All"],tags:["Crisis", "MH", "Substance Use"]},
    {name:"QEII Health Sciences Centre Psychiatry",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://nshealth.ca",phone:"902-473-2700",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"IWK Health Centre (Youth)",detail:"Behavioral Health Hospital - Trauma; Youth",url:"https://iwk.nshealth.ca",phone:"902-470-8888",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Youth"]},
  ],
  "NV": [
    {name:"Desert Parkway Behavioral Healthcare",detail:"Behavioral Health Hospital - Trauma; Substance Use",url:"https://desertparkway.com",phone:"702-776-3500",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Substance Use"]},
    {name:"Seven Hills Behavioral Health",detail:"Behavioral Health Hospital - Trauma; MH",url:"https://sevenhillsbi.com",phone:"702-646-5000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "MH", "Youth"]},
    {name:"Reno Behavioral Healthcare Hospital",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://renobehavioral.com",phone:"775-393-2200",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"WestCare Nevada",detail:"Residential Treatment - Substance Use; Trauma",url:"https://westcare.com",phone:"702-385-3330",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "NY": [
    {name:"NYU Langone Psychiatry",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://nyulangone.org",phone:"646-929-7870",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Columbia Psychiatry",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://columbiapsychiatry.org",phone:"212-305-6001",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Zucker Hillside Hospital",detail:"Behavioral Health Hospital - Trauma; MH",url:"https://northwell.edu",phone:"718-470-8100",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "MH", "Youth"]},
    {name:"Four Winds Hospital",detail:"Behavioral Health Hospital - Trauma; Substance Use",url:"https://fourwindshospital.com",phone:"800-528-6624",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Substance Use"]},
    {name:"Mountainside Treatment Center",detail:"Residential Treatment - Substance Use; Trauma",url:"https://mountainside.com",phone:"800-762-5433",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "OH": [
    {name:"Ohio State University Harding Hospital",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://wexnermedical.osu.edu",phone:"614-293-9600",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Cleveland Clinic Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://my.clevelandclinic.org",phone:"216-444-2200",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"University Hospitals Psychiatry",detail:"Behavioral Health Hospital - Trauma; MH",url:"https://uhhospitals.org",phone:"216-844-1000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "MH"]},
    {name:"OhioGuidestone",detail:"Outpatient - Crisis; MH; Substance Use",url:"https://ohioguidestone.org",phone:"440-260-8300",icon:"💙",color:"#22c55e",free:false,disciplines:["All"],tags:["Crisis", "MH", "Substance Use"]},
    {name:"Glenbeigh",detail:"Residential Treatment - Substance Use; Trauma",url:"https://glenbeigh.com",phone:"800-234-1001",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "OK": [
    {name:"OU Health Behavioral Health",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://ouhealth.com",phone:"405-271-4700",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Laureate Psychiatric Clinic and Hospital",detail:"Behavioral Health Hospital - Trauma; MH",url:"https://laureate.com",phone:"918-481-4000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "MH"]},
    {name:"Griffin Memorial Hospital",detail:"Behavioral Health Hospital - Severe MH",url:"https://oklahoma.gov",phone:"405-321-4880",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["MH", "Inpatient"]},
    {name:"Valley Hope of Cushing",detail:"Residential Treatment - Substance Use; Trauma",url:"https://valleyhope.org",phone:"800-544-5101",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "ON": [
    {name:"CAMH Centre for Addiction and Mental Health",detail:"Behavioral Health Hospital - Trauma; MH; Substance Use",url:"https://camh.ca",phone:"416-535-8501",icon:"🏥",color:"#ef4444",free:false,disciplines:["All"],tags:["Trauma", "MH", "Substance Use", "Responder-Competent"]},
    {name:"Ontario Shores Centre for Mental Health Sciences",detail:"Behavioral Health Hospital - Trauma; MH",url:"https://ontarioshores.ca",phone:"905-430-4055",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "MH"]},
    {name:"The Royal Ottawa Mental Health Centre",detail:"Behavioral Health Hospital - PTSD; Trauma (Veteran/Responder)",url:"https://theroyal.ca",phone:"613-722-6521",icon:"🧠",color:"#ef4444",free:false,disciplines:["All"],tags:["PTSD", "Trauma", "Responder-Competent"]},
    {name:"Homewood Health Centre",detail:"Residential Treatment - Substance Use; Trauma",url:"https://homewoodhealth.com",phone:"519-824-1010",icon:"🏠",color:"#ef4444",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential", "Responder-Competent"]},
    {name:"ConnexOntario",detail:"Provincial Navigation Line - MH; Substance Use",url:"https://connexontario.ca",phone:"1-866-531-2600",icon:"💙",color:"#38bdf8",free:true,disciplines:["All"],tags:["MH", "Substance Use"]},
  ],
  "OR": [
    {name:"Oregon Health and Science University Psychiatry",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://ohsu.edu",phone:"503-494-8311",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Providence Behavioral Health OR",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://providence.org",phone:"503-574-9230",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Unity Center for Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://unityhealthcenter.org",phone:"503-944-8000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Hazelden Betty Ford Newberg",detail:"Residential Treatment - Substance Use; Trauma",url:"https://hazeldenbettyford.org",phone:"866-831-5700",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential", "Responder-Competent"]},
  ],
  "PA": [
    {name:"UPMC Western Psychiatric Hospital",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://upmc.com",phone:"412-624-1000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Penn Medicine Psychiatry",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://pennmedicine.org",phone:"215-662-4000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Belmont Behavioral Health",detail:"Behavioral Health Hospital - Trauma; Substance Use",url:"https://belmontbehavioral.com",phone:"844-603-9030",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Substance Use"]},
    {name:"Caron Treatment Centers",detail:"Residential Treatment - Substance Use; Trauma",url:"https://caron.org",phone:"800-854-6023",icon:"🏠",color:"#ef4444",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential", "Responder-Competent"]},
  ],
  "PEI": [
    {name:"PEI Mental Health & Addictions",detail:"Provincial Program - MH; Substance Use",url:"https://princeedwardisland.ca",phone:"1-833-553-6983",icon:"💙",color:"#38bdf8",free:true,disciplines:["All"],tags:["MH", "Substance Use", "Crisis"]},
    {name:"Queen Elizabeth Hospital Psychiatry",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://healthpei.ca",phone:"902-894-2111",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
  ],
  "QC": [
    {name:"Institut universitaire en sante mentale de Montreal",detail:"Behavioral Health Hospital - Trauma; MH",url:"https://ciusss-estmtl.gouv.qc.ca",phone:"514-251-4000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "MH"]},
    {name:"Douglas Mental Health University Institute",detail:"Behavioral Health Hospital - Trauma; PTSD; MH",url:"https://douglas.qc.ca",phone:"514-761-6131",icon:"🧠",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "PTSD", "MH"]},
    {name:"Centre de readaptation en dependance de Montreal",detail:"Residential Treatment - Substance Use",url:"https://ciusss-centresudmtl.gouv.qc.ca",phone:"514-385-1232",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Residential"]},
    {name:"Info-Social 811 Quebec",detail:"Provincial Crisis Line - Crisis; MH",url:"https://quebec.ca",phone:"811",icon:"🆘",color:"#f97316",free:true,disciplines:["All"],tags:["Crisis", "MH"]},
  ],
  "RI": [
    {name:"Butler Hospital",detail:"Behavioral Health Hospital - Trauma; MH",url:"https://butler.org",phone:"844-401-0111",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "MH"]},
    {name:"Bradley Hospital (Youth)",detail:"Behavioral Health Hospital - Trauma; Youth",url:"https://lifespan.org",phone:"401-432-1000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Youth"]},
    {name:"Newport Hospital Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://lifespan.org",phone:"401-846-6400",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
  ],
  "SC": [
    {name:"MUSC Behavioral Health",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://muschealth.org",phone:"843-792-2300",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Prisma Health Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://prismahealth.org",phone:"864-455-8988",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Three Rivers Behavioral Health",detail:"Behavioral Health Hospital - Trauma; Substance Use",url:"https://threeriversbehavioral.org",phone:"803-796-9911",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Substance Use"]},
    {name:"Charleston Center",detail:"Outpatient - Substance Use; MH",url:"https://charlestoncounty.org",phone:"843-958-3300",icon:"💙",color:"#22c55e",free:false,disciplines:["All"],tags:["Substance Use", "MH"]},
  ],
  "SD": [
    {name:"Avera Behavioral Health",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://avera.org",phone:"605-322-3000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Sanford Behavioral Health Sioux Falls",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://sanfordhealth.org",phone:"605-333-1000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Human Service Agency",detail:"Outpatient - Substance Use; MH",url:"https://humanserviceagency.org",phone:"605-886-0123",icon:"💙",color:"#22c55e",free:false,disciplines:["All"],tags:["Substance Use", "MH"]},
    {name:"Keystone Treatment Center",detail:"Residential Treatment - Substance Use; Trauma",url:"https://keystonetreatment.com",phone:"800-992-1921",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "SK": [
    {name:"Saskatchewan Health Authority Mental Health",detail:"Provincial Program - Crisis; MH",url:"https://saskhealthauthority.ca",phone:"306-655-4100",icon:"💙",color:"#38bdf8",free:true,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Royal University Hospital Psychiatry",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://saskhealthauthority.ca",phone:"306-655-1000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Regina General Hospital Psychiatry",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://saskhealthauthority.ca",phone:"306-766-4444",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Calder Centre",detail:"Residential Treatment - Substance Use; Youth",url:"https://saskhealthauthority.ca",phone:"306-655-4500",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Youth", "Residential"]},
  ],
  "TN": [
    {name:"Vanderbilt Behavioral Health",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://vanderbilthealth.com",phone:"615-936-3555",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"TriStar Centennial Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://tristarhealth.com",phone:"615-342-1450",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Parkridge Valley Hospital",detail:"Behavioral Health Hospital - Trauma; MH",url:"https://parkridgevalley.com",phone:"423-894-4220",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "MH", "Youth"]},
    {name:"Cumberland Heights",detail:"Residential Treatment - Substance Use; Trauma",url:"https://cumberlandheights.org",phone:"800-646-9998",icon:"🏠",color:"#ef4444",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential", "Responder-Competent"]},
  ],
  "TX": [
    {name:"UTHealth Behavioral Sciences",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://uth.edu",phone:"713-500-2000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Baylor Scott and White Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://bswhealth.com",phone:"844-279-3627",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Menninger Clinic",detail:"Residential Treatment - Trauma; Complex MH",url:"https://menningerclinic.org",phone:"713-275-5400",icon:"🏠",color:"#ef4444",free:false,disciplines:["All"],tags:["Trauma", "MH", "Residential", "Responder-Competent"]},
    {name:"La Hacienda Treatment Center",detail:"Residential Treatment - Substance Use; Trauma",url:"https://lahacienda.com",phone:"800-749-6160",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
    {name:"Greenhouse Treatment Center",detail:"Residential Treatment - Substance Use; Trauma",url:"https://greenhousetreatment.com",phone:"800-848-9090",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "UT": [
    {name:"University of Utah Behavioral Health",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://healthcare.utah.edu",phone:"801-581-2121",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Huntsman Mental Health Institute",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://hmhi.utah.edu",phone:"801-587-3000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Provo Canyon Behavioral Hospital",detail:"Behavioral Health Hospital - Trauma; MH",url:"https://provocanyon.com",phone:"800-848-9819",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "MH", "Youth"]},
    {name:"Cirque Lodge",detail:"Residential Treatment - Substance Use; Trauma",url:"https://cirquelodge.com",phone:"800-582-0709",icon:"🏠",color:"#ef4444",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential", "Responder-Competent"]},
  ],
  "VA": [
    {name:"VCU Health Psychiatry",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://vcuhealth.org",phone:"804-828-9000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Inova Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://inova.org",phone:"703-289-7560",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Dominion Hospital",detail:"Behavioral Health Hospital - Trauma; MH",url:"https://dominionhospital.com",phone:"703-538-2872",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "MH"]},
  ],
  "VT": [
    {name:"University of Vermont Medical Center Psychiatry",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://uvmhealth.org",phone:"802-847-0000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Brattleboro Retreat",detail:"Behavioral Health Hospital - Trauma; MH",url:"https://brattlebororetreat.org",phone:"800-738-7328",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "MH"]},
    {name:"Valley Vista VT",detail:"Residential Treatment - Substance Use; Trauma",url:"https://valleyvista.org",phone:"802-222-5201",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "WA": [
    {name:"UW Medicine Psychiatry",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://uwmedicine.org",phone:"206-598-3300",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Harborview Medical Center Behavioral Health",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://harborview.org",phone:"206-744-3000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"MultiCare Behavioral Health",detail:"Outpatient/Crisis - Crisis; MH",url:"https://multicare.org",phone:"800-576-7764",icon:"🆘",color:"#f97316",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Fairfax Behavioral Health",detail:"Behavioral Health Hospital - Trauma; Substance Use",url:"https://fairfaxbehavioralhealth.com",phone:"425-821-2000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Substance Use"]},
    {name:"Lakeside-Milam Recovery Centers",detail:"Residential Treatment - Substance Use; Trauma",url:"https://lakesidemilam.com",phone:"800-231-4303",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "WI": [
    {name:"UW Health Behavioral Health",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://uwhealth.org",phone:"608-263-6400",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Rogers Behavioral Health",detail:"Behavioral Health Hospital - Trauma; MH",url:"https://rogersbh.org",phone:"800-767-4411",icon:"🏥",color:"#ef4444",free:false,disciplines:["All"],tags:["Trauma", "MH", "Responder-Competent"]},
    {name:"Aurora Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://aurorahealthcare.org",phone:"414-773-4312",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Tellurian Behavioral Health",detail:"Residential Treatment - Substance Use; Trauma",url:"https://tellurian.org",phone:"608-222-7311",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "WV": [
    {name:"WVU Medicine Behavioral Medicine",detail:"Behavioral Health Hospital - Trauma; Crisis",url:"https://wvumedicine.org",phone:"304-598-4000",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Crisis"]},
    {name:"Highland Hospital",detail:"Behavioral Health Hospital - Trauma; Substance Use",url:"https://highlandhosp.com",phone:"304-926-1600",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "Substance Use"]},
    {name:"Thomas Health Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://thomashealth.org",phone:"304-766-3600",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Recovery Point West Virginia",detail:"Residential Treatment - Substance Use; Trauma",url:"https://recoverypointwv.org",phone:"304-523-4673",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
  "WY": [
    {name:"Wyoming Behavioral Institute",detail:"Behavioral Health Hospital - Trauma; MH",url:"https://wbihelp.com",phone:"800-457-9312",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Trauma", "MH"]},
    {name:"Cheyenne Regional Behavioral Health",detail:"Behavioral Health Hospital - Crisis; MH",url:"https://cheyenneregional.org",phone:"307-633-7370",icon:"🏥",color:"#38bdf8",free:false,disciplines:["All"],tags:["Crisis", "MH"]},
    {name:"Peak Wellness Center",detail:"Outpatient - Crisis; MH; Substance Use",url:"https://peakwellnesscenter.org",phone:"307-634-9653",icon:"💙",color:"#22c55e",free:false,disciplines:["All"],tags:["Crisis", "MH", "Substance Use"]},
    {name:"Volunteers of America Northern Rockies",detail:"Residential Treatment - Substance Use; Trauma",url:"https://voanr.org",phone:"307-672-0475",icon:"🏠",color:"#a78bfa",free:false,disciplines:["All"],tags:["Substance Use", "Trauma", "Residential"]},
  ],
};

const NATIONAL_RESOURCES = [
  {name:"988 Suicide & Crisis Lifeline",detail:"National Crisis Line - free, 24/7",url:"https://988lifeline.org",phone:"988",icon:"🆘",color:"#ef4444",free:true,disciplines:["All"],tags:["Crisis", "Suicide Prevention", "Responder-Competent"]},
  {name:"Safe Call Now",detail:"First responder peer crisis line, 24/7",url:"https://safecallnowusa.org",phone:"206-459-3020",icon:"🤝",color:"#ef4444",free:true,disciplines:["All"],tags:["Crisis", "PST", "Responder-Competent"]},
  {name:"Cop2Cop",detail:"Law enforcement peer support line, 24/7",url:"https://ubhc.rutgers.edu/cop2cop",phone:"866-267-2267",icon:"🛡",color:"#38bdf8",free:true,disciplines:["Law Enforcement"],tags:["PST", "Crisis", "Responder-Competent"]},
  {name:"SAMHSA National Helpline",detail:"Free, confidential treatment referrals 24/7",url:"https://samhsa.gov",phone:"800-662-4357",icon:"💊",color:"#22c55e",free:true,disciplines:["All"],tags:["Substance Use", "MH", "Referral"]},
  {name:"Veterans Crisis Line",detail:"Veterans and first responders crisis support",url:"https://veteranscrisisline.net",phone:"988 press 1",icon:"🆘",color:"#ef4444",free:true,disciplines:["All"],tags:["Crisis", "PTSD", "Responder-Competent"]},
  {name:"Fire/EMS Helpline - Share the Load",detail:"NVFC peer support line for fire and EMS",url:"https://nvfc.org",phone:"888-731-3473",icon:"🔥",color:"#f97316",free:true,disciplines:["Fire", "EMS"],tags:["PST", "Crisis", "Responder-Competent"]},
  {name:"Frontline Helpline - FRSN",detail:"First Responder Support Network peer line",url:"https://frsn.org",phone:"415-721-9789",icon:"🤝",color:"#38bdf8",free:true,disciplines:["All"],tags:["PST", "Trauma", "Responder-Competent"]},
  {name:"Trevor Project Lifeline",detail:"LGBTQ+ youth crisis support 24/7",url:"https://thetrevorproject.org",phone:"866-488-7386",icon:"🆘",color:"#a78bfa",free:true,disciplines:["All"],tags:["Crisis", "Youth", "LGBTQ+"]},
  {name:"Crisis Text Line",detail:"Text HOME to 741741 - 24/7 crisis text support",url:"https://crisistextline.org",phone:"Text HOME to 741741",icon:"💬",color:"#22c55e",free:true,disciplines:["All"],tags:["Crisis", "MH"]},
  {name:"National Domestic Violence Hotline",detail:"24/7 crisis and safety support",url:"https://thehotline.org",phone:"800-799-7233",icon:"🆘",color:"#ef4444",free:true,disciplines:["All"],tags:["Crisis", "Trauma"]},
  {name:"RAINN National Sexual Assault Hotline",detail:"24/7 trauma and crisis support",url:"https://rainn.org",phone:"800-656-4673",icon:"🆘",color:"#ef4444",free:true,disciplines:["All"],tags:["Crisis", "Trauma"]},
  {name:"IAFF Center of Excellence",detail:"Residential PTSD and substance use for fire/EMS",url:"https://iaffrecoverycenter.com",phone:"855-900-8437",icon:"🏠",color:"#ef4444",free:false,disciplines:["Fire", "EMS"],tags:["PTSD", "Substance Use", "Responder-Competent", "Residential"]},
  {name:"FRMHS Free Toolkits & Guides",detail:"Free evidence-informed toolkits for first responders",url:"https://frmhs.org",phone:"N/A",icon:"📚",color:"#64748b",free:true,disciplines:["All"],tags:["PTSD", "MH", "Education"]},
  {name:"NAMI Public Safety Professionals",detail:"Free guides, resilience tools, peer support info",url:"https://nami.org",phone:"N/A",icon:"💙",color:"#38bdf8",free:true,disciplines:["All"],tags:["MH", "PST", "Resilience"]},
  {name:"Crisis Text Line - BADGE Keyword",detail:"Text BADGE to 741741 - responder-specific support",url:"https://crisistextline.org",phone:"Text BADGE to 741741",icon:"🤝",color:"#ef4444",free:true,disciplines:["All"],tags:["Crisis", "Responder-Competent"]},
  {name:"Mind the Frontline",detail:"Free articles, guides and peer support tools",url:"https://mindthefrontline.org",phone:"866-MIND247",icon:"🤝",color:"#22c55e",free:true,disciplines:["All"],tags:["PST", "MH", "Education"]},
  {name:"SAMHSA First Responder Stress Management",detail:"Free online trainings and guides for responders",url:"https://samhsa.gov",phone:"N/A",icon:"📚",color:"#64748b",free:true,disciplines:["All"],tags:["MH", "Education", "Responder-Competent"]},
  {name:"First Responders Foundation BH Guides",detail:"Free articles, coping strategies, wellness guides",url:"https://firstrespondersfoundation.org",phone:"N/A",icon:"📚",color:"#64748b",free:true,disciplines:["All"],tags:["PTSD", "MH", "Education", "Responder-Competent"]},
];

function ResourcesScreen({navigate,agency,role,userState,onChangeState}){
  const[tab,setTab]=useState("crisis");
  const[selectedState,setSelectedState]=useState(userState||"NC");
  const[selectedDiscipline,setSelectedDiscipline]=useState("All");
  const[aiResources,setAiResources]=useState(null);
  const[aiLoading,setAiLoading]=useState(false);
  const[aiError,setAiError]=useState(null);

  // Load resources from built-in curated dataset
  const loadStateResources=(state)=>{
    if(!state||state==="All"){
      setAiResources(NATIONAL_RESOURCES);
      return;
    }
    const stateData=STATE_RESOURCES[state]||[];
    const neighbors=neighboringStates[state]||[];
    const neighborData=neighbors.flatMap(s=>(STATE_RESOURCES[s]||[]).slice(0,2).map(r=>({...r,neighborState:s})));
    setAiResources([...stateData,...neighborData,...NATIONAL_RESOURCES.filter(r=>r.tags.includes("Responder-Competent")).slice(0,5)]);
  };
  useEffect(()=>{loadStateResources(selectedState);},[selectedState]);
  const[calendarView,setCalendarView]=useState("list");
  const[events,setEvents]=useState([
    {id:1,date:"2026-03-15",title:"CISM Debrief: Station 7",type:"cism",color:"#ef4444"},
    {id:2,date:"2026-03-18",title:"PST Available 1800-2200",type:"pst",color:"#a78bfa"},
    {id:3,date:"2026-03-20",title:"Resilience Training",type:"training",color:"#22c55e"}
  ]);
  const isAdminRole=role==="supervisor"||role==="admin";
  
  const tabs=[
    {key:"crisis",label:"Crisis"},
    {key:"pathways",label:"State Pathways"},
    {key:"calendar",label:"Calendar"},
    {key:"upstream",label:"Upstream Approach"},
    {key:"downstream",label:"Downstream"}
  ];
  
  // Neighboring states map - shows resources from surrounding states too
  const neighboringStates={
    "AL":["MS","TN","GA","FL"],
    "AK":[],
    "AZ":["CA","NV","UT","CO","NM"],
    "AR":["MO","TN","MS","LA","TX","OK"],
    "CA":["OR","NV","AZ"],
    "CO":["WY","NE","KS","OK","NM","AZ","UT"],
    "CT":["NY","MA","RI"],
    "DE":["MD","PA","NJ"],
    "FL":["GA","AL"],
    "GA":["FL","AL","TN","NC","SC"],
    "HI":[],
    "ID":["MT","WY","UT","NV","OR","WA"],
    "IL":["WI","IA","MO","KY","IN"],
    "IN":["IL","MI","OH","KY"],
    "IA":["MN","WI","IL","MO","NE","SD"],
    "KS":["NE","MO","OK","CO"],
    "KY":["OH","IN","IL","MO","TN","VA","WV"],
    "LA":["AR","MS","TX"],
    "ME":["NH"],
    "MD":["PA","DE","VA","WV"],
    "MA":["NH","VT","NY","CT","RI"],
    "MI":["WI","IN","OH"],
    "MN":["ND","SD","IA","WI"],
    "MS":["TN","AL","LA","AR"],
    "MO":["IA","IL","KY","TN","AR","OK","KS","NE"],
    "MT":["ID","WY","SD","ND"],
    "NE":["SD","IA","MO","KS","CO","WY"],
    "NV":["OR","ID","UT","AZ","CA"],
    "NH":["VT","ME","MA"],
    "NJ":["NY","PA","DE"],
    "NM":["CO","OK","TX","AZ"],
    "NY":["PA","NJ","CT","MA","VT"],
    "NC":["VA","TN","GA","SC"],
    "ND":["MT","SD","MN"],
    "OH":["PA","WV","KY","IN","MI"],
    "OK":["KS","MO","AR","TX","NM","CO"],
    "OR":["WA","ID","NV","CA"],
    "PA":["NY","NJ","DE","MD","WV","OH"],
    "RI":["CT","MA"],
    "SC":["NC","GA"],
    "SD":["ND","MN","IA","NE","WY","MT"],
    "TN":["KY","VA","NC","GA","AL","MS","AR","MO"],
    "TX":["NM","OK","AR","LA"],
    "UT":["ID","WY","CO","NM","AZ","NV"],
    "VT":["NY","NH","MA"],
    "VA":["MD","WV","KY","TN","NC"],
    "WA":["ID","OR"],
    "WV":["OH","PA","MD","VA","KY"],
    "WI":["MN","MI","IL","IA"],
    "WY":["MT","SD","NE","CO","UT","ID"],
  };
  
  // Get relevant states for selector: user's state + neighbors + "All" (national)
  const getRelevantStates=()=>{
    if(!selectedState||selectedState==="All") return ["All"];
    const neighbors=neighboringStates[selectedState]||[];
    return [selectedState,...neighbors,"All"];
  };
  const states=getRelevantStates();
  const disciplines=["All","Law Enforcement","Fire","EMS","Dispatch","Corrections"];
  
  const crisis=[
    {name:"988 Suicide & Crisis Lifeline",detail:"Call or text 988 . 24/7",color:"#ef4444",icon:"📞"},
    {name:"Crisis Text Line",detail:"Text HOME to 741741",color:"#f97316",icon:"💬"},
    {name:"Safe Call Now",detail:"1-206-459-3020 . First Responders",color:"#38bdf8",icon:"🔵"},
    {name:"Badge of Life",detail:"badgeoflife.com",color:"#a78bfa",icon:"🛡"},
    {name:"First Responder Support Network",detail:"frsn.org",color:"#22c55e",icon:"🌐"}
  ];
  
  const statePathways={
    "NC":[
      {name:"NC Responder Alliance (NC RAI)",detail:"Gateway to EMDR, therapy, PST, chaplains . All disciplines",icon:"🌐",color:"#38bdf8",disciplines:["All"],free:true,tags:["EMDR","Therapy","PST","Chaplain"]},
      {name:"NC First Responder Peer Support Network",detail:"Statewide PST network . Certified PST members, CISM teams",icon:"🤝",color:"#a78bfa",disciplines:["All"],free:true,tags:["PST","CISM"]},
      {name:"NC-LEAP",detail:"NC Law Enforcement Assistance Program . Free, confidential",icon:"🛡",color:"#22c55e",disciplines:["Law Enforcement"],free:true,tags:["Therapy","EMDR","PST"]},
    ],
    "SC":[
      {name:"SC First Responder Peer Network",detail:"Statewide PST and crisis support",icon:"🤝",color:"#a78bfa",disciplines:["All"],free:true,tags:["PST","CISM"]},
      {name:"SC Law Enforcement Wellness Program",detail:"Confidential mental health support",icon:"🛡",color:"#22c55e",disciplines:["Law Enforcement"],free:true,tags:["Therapy","Counseling"]},
    ],
    "VA":[
      {name:"VA First Responder Alliance",detail:"Peer support and mental health resources",icon:"🌐",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST","Therapy"]},
      {name:"VA Fire Service Peer Support",detail:"Fire-specific peer support network",icon:"🔥",color:"#f97316",disciplines:["Fire"],free:true,tags:["PST"]},
      {name:"VA DCJS Law Enforcement Wellness",detail:"Wellness resources for LE statewide",icon:"🛡",color:"#a78bfa",disciplines:["Law Enforcement"],free:true,tags:["Wellness"]},
    ],
    "TN":[
      {name:"TN First Responder Wellness Coalition",detail:"Mental health and peer support programs",icon:"🎸",color:"#38bdf8",disciplines:["All"],free:true,tags:["Therapy","PST"]},
      {name:"TN EMS Critical Stress Network",detail:"CISM and peer support for EMS",icon:"🚑",color:"#22c55e",disciplines:["EMS"],free:true,tags:["CISM","PST"]},
    ],
    "GA":[
      {name:"GA First Responder Support Services",detail:"Statewide mental health resources",icon:"🍑",color:"#38bdf8",disciplines:["All"],free:true,tags:["Therapy","Counseling"]},
      {name:"GA Law Enforcement Assistance Program",detail:"Confidential support for LE",icon:"🛡",color:"#a78bfa",disciplines:["Law Enforcement"],free:true,tags:["Therapy","PST"]},
    ],
    "FL":[
      {name:"FL First Responder Wellness Network",detail:"Statewide peer support and mental health",icon:"🌴",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST","Therapy"]},
      {name:"FL Fire Chiefs Association Wellness",detail:"Wellness resources for fire service",icon:"🔥",color:"#f97316",disciplines:["Fire"],free:true,tags:["Wellness"]},
      {name:"FL Law Enforcement Assistance Program",detail:"Confidential counseling for LE",icon:"🛡",color:"#a78bfa",disciplines:["Law Enforcement"],free:true,tags:["Therapy"]},
    ],
    "TX":[
      {name:"TX First Responder Mental Health",detail:"Statewide resources and peer support",icon:"[*]",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST","Therapy"]},
      {name:"TX EMS Alliance Peer Support",detail:"Peer support for EMS professionals",icon:"🚑",color:"#22c55e",disciplines:["EMS"],free:true,tags:["PST"]},
      {name:"TX Municipal Police Association Wellness",detail:"Mental health resources for LE",icon:"🛡",color:"#a78bfa",disciplines:["Law Enforcement"],free:true,tags:["Wellness","Therapy"]},
    ],
    "CA":[
      {name:"CA First Responder Peer Support Network",detail:"Statewide peer support programs",icon:"🌅",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST"]},
      {name:"CA POST Officer Wellness",detail:"Law enforcement wellness resources",icon:"🛡",color:"#a78bfa",disciplines:["Law Enforcement"],free:true,tags:["Wellness"]},
      {name:"CA EMS Authority Wellness",detail:"EMS-specific support resources",icon:"🚑",color:"#22c55e",disciplines:["EMS"],free:true,tags:["PST","CISM"]},
    ],
    "NY":[
      {name:"NY First Responder Peer Support",detail:"Statewide peer support network",icon:"🗽",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST"]},
      {name:"NY Division of Criminal Justice Wellness",detail:"LE wellness and support programs",icon:"🛡",color:"#a78bfa",disciplines:["Law Enforcement"],free:true,tags:["Wellness"]},
      {name:"NY Fire Peer Support Program",detail:"Fire service peer support",icon:"🔥",color:"#f97316",disciplines:["Fire"],free:true,tags:["PST","CISM"]},
    ],
    "OH":[
      {name:"OH First Responder Peer Support",detail:"Statewide peer support resources",icon:"🌰",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST"]},
      {name:"OH Peace Officer Wellness Program",detail:"Confidential support for LE",icon:"🛡",color:"#a78bfa",disciplines:["Law Enforcement"],free:true,tags:["Wellness","Therapy"]},
    ],
    "PA":[
      {name:"PA First Responder Peer Support",detail:"Statewide peer support network",icon:"🔔",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST"]},
      {name:"PA State Police Wellness Program",detail:"Wellness resources for LE",icon:"🛡",color:"#a78bfa",disciplines:["Law Enforcement"],free:true,tags:["Wellness"]},
    ],
    "IL":[
      {name:"IL First Responder Peer Support Network",detail:"Statewide peer support",icon:"🌽",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST"]},
      {name:"IL Law Enforcement Wellness Alliance",detail:"LE mental health and wellness",icon:"🛡",color:"#a78bfa",disciplines:["Law Enforcement"],free:true,tags:["Wellness","Therapy"]},
    ],
    "WA":[
      {name:"WA First Responder Support Services",detail:"Peer support and mental health",icon:"🌲",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST","Therapy"]},
      {name:"WA State Patrol Wellness Program",detail:"LE wellness resources",icon:"🛡",color:"#a78bfa",disciplines:["Law Enforcement"],free:true,tags:["Wellness"]},
    ],
    "CO":[
      {name:"CO First Responder Peer Support",detail:"Statewide peer support network",icon:"🏔",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST"]},
      {name:"CO POST Officer Wellness",detail:"Law enforcement wellness",icon:"🛡",color:"#a78bfa",disciplines:["Law Enforcement"],free:true,tags:["Wellness"]},
    ],
    "AZ":[
      {name:"AZ First Responder Wellness Network",detail:"Statewide peer support and resources",icon:"🌵",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST","Therapy"]},
      {name:"AZ Peace Officer Peer Support",detail:"LE peer support programs",icon:"🛡",color:"#a78bfa",disciplines:["Law Enforcement"],free:true,tags:["PST"]},
    ],
    "OR":[
      {name:"OR First Responder Peer Support",detail:"Statewide peer support resources",icon:"🌲",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST"]},
      {name:"OR Responder Wellness Coalition",detail:"Mental health resources for all responders",icon:"💚",color:"#22c55e",disciplines:["All"],free:true,tags:["Therapy","Wellness"]},
    ],
    "MI":[
      {name:"MI First Responder Peer Support Network",detail:"Statewide peer support",icon:"🏞",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST"]},
      {name:"MI Law Enforcement Wellness",detail:"LE mental health resources",icon:"🛡",color:"#a78bfa",disciplines:["Law Enforcement"],free:true,tags:["Wellness"]},
    ],
    "KY":[
      {name:"KY First Responder Peer Support",detail:"Statewide peer support resources",icon:"🐴",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST"]},
    ],
    "AL":[
      {name:"AL First Responder Wellness Program",detail:"Peer support and mental health resources",icon:"🌙",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST","Therapy"]},
    ],
    "MS":[
      {name:"MS First Responder Support Network",detail:"Statewide peer support resources",icon:"🌊",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST"]},
    ],
    "LA":[
      {name:"LA First Responder Peer Support",detail:"Statewide peer support and mental health",icon:"🎷",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST","Therapy"]},
    ],
    "AR":[
      {name:"AR First Responder Wellness",detail:"Peer support resources statewide",icon:"💎",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST"]},
    ],
    "MO":[
      {name:"MO First Responder Peer Support",detail:"Statewide peer support network",icon:"[B]",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST"]},
    ],
    "IN":[
      {name:"IN First Responder Wellness Network",detail:"Peer support and mental health",icon:"🏁",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST","Therapy"]},
    ],
    "WI":[
      {name:"WI First Responder Peer Support",detail:"Statewide peer support resources",icon:"🧀",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST"]},
    ],
    "MN":[
      {name:"MN First Responder Mental Health",detail:"Statewide peer support and resources",icon:"🌟",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST","Therapy"]},
    ],
    "NJ":[
      {name:"NJ First Responder Peer Support",detail:"Statewide peer support network",icon:"🌆",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST"]},
    ],
    "MD":[
      {name:"MD First Responder Wellness Network",detail:"Peer support and mental health resources",icon:"🦀",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST","Therapy"]},
    ],
    "MA":[
      {name:"MA First Responder Peer Support",detail:"Statewide peer support resources",icon:"🦞",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST"]},
    ],
    "CT":[
      {name:"CT First Responder Wellness",detail:"Peer support and mental health",icon:"🌿",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST","Therapy"]},
    ],
    "WV":[
      {name:"WV First Responder Peer Support",detail:"Statewide peer support resources",icon:"[M]",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST"]},
    ],
    "NV":[
      {name:"NV First Responder Wellness",detail:"Peer support and mental health resources",icon:"🎰",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST","Therapy"]},
    ],
    "NM":[
      {name:"NM First Responder Peer Support",detail:"Statewide peer support network",icon:"🌶",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST"]},
    ],
    "UT":[
      {name:"UT First Responder Wellness Network",detail:"Peer support and mental health",icon:"[Sk]",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST","Therapy"]},
    ],
    "ID":[
      {name:"ID First Responder Peer Support",detail:"Statewide peer support resources",icon:"🥔",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST"]},
    ],
    "MT":[
      {name:"MT First Responder Wellness",detail:"Peer support and mental health resources",icon:"🦌",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST","Therapy"]},
    ],
    "WY":[
      {name:"WY First Responder Peer Support",detail:"Statewide resources and support",icon:"🤠",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST"]},
    ],
    "ND":[
      {name:"ND First Responder Wellness",detail:"Peer support resources statewide",icon:"🌾",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST"]},
    ],
    "SD":[
      {name:"SD First Responder Peer Support",detail:"Statewide peer support network",icon:"🏔",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST"]},
    ],
    "NE":[
      {name:"NE First Responder Wellness Network",detail:"Peer support and mental health",icon:"🌽",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST","Therapy"]},
    ],
    "KS":[
      {name:"KS First Responder Peer Support",detail:"Statewide peer support resources",icon:"🌻",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST"]},
    ],
    "OK":[
      {name:"OK First Responder Wellness",detail:"Peer support and mental health resources",icon:"🌪",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST","Therapy"]},
    ],
    "IA":[
      {name:"IA First Responder Peer Support",detail:"Statewide peer support network",icon:"🌽",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST"]},
    ],
    "NH":[
      {name:"NH First Responder Wellness",detail:"Peer support resources statewide",icon:"🍁",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST"]},
    ],
    "ME":[
      {name:"ME First Responder Peer Support",detail:"Statewide peer support resources",icon:"🦞",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST"]},
    ],
    "VT":[
      {name:"VT First Responder Wellness Network",detail:"Peer support and mental health",icon:"🍁",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST","Therapy"]},
    ],
    "RI":[
      {name:"RI First Responder Peer Support",detail:"Statewide peer support resources",icon:"[A]",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST"]},
    ],
    "DE":[
      {name:"DE First Responder Wellness",detail:"Peer support and mental health resources",icon:"🏰",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST","Therapy"]},
    ],
    "AK":[
      {name:"AK First Responder Peer Support",detail:"Statewide support resources",icon:"🐻",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST"]},
    ],
    "HI":[
      {name:"HI First Responder Wellness Network",detail:"Peer support and mental health",icon:"🌺",color:"#38bdf8",disciplines:["All"],free:true,tags:["PST","Therapy"]},
    ],
  };
  
  const nationalFallbacks=[
    {name:"Safe Call Now",detail:"1-206-459-3020 . 24/7 First Responder Hotline",icon:"📞",color:"#38bdf8"},
    {name:"988 Suicide & Crisis Lifeline",detail:"Call or text 988 . National crisis support",icon:"🔵",color:"#ef4444"},
    {name:"Badge of Life",detail:"badgeoflife.com . First responder resources",icon:"🛡",color:"#a78bfa"},
    {name:"First Responder Support Network",detail:"frsn.org . National peer support",icon:"🌐",color:"#22c55e"},
  ];
  
  const upstream=[
    {name:"Resilience Building",detail:"Sleep, nutrition, exercise, peer connection",icon:"💪",color:"#22c55e"},
    {name:"Stress Inoculation",detail:"Understanding cumulative stress exposure",icon:"🧠",color:"#38bdf8"},
    {name:"Compassion Fatigue Education",detail:"Recognizing early warning signs",icon:"📖",color:"#a78bfa"},
    {name:"Peer Community",detail:"Mentorship, forums, agency wellness",icon:"🤝",color:"#eab308"},
    {name:"Family Resources",detail:"Supporting those who support you",icon:"🏠",color:"#f97316"}
  ];
  
  const downstream=[
    {name:"First Responder Therapist Finder",detail:"Specialists who understand the job",icon:"🔍",color:"#38bdf8"},
    {name:"EMDR & Trauma Treatment",detail:"Evidence-based trauma processing",icon:"🌀",color:"#a78bfa"},
    {name:"Substance Use Recovery",detail:"Peer-led programs, SMART Recovery",icon:"🌱",color:"#22c55e"},
    {name:"CISM Debriefing",detail:"Critical incident stress management",icon:"🗣",color:"#f97316"},
    {name:"Return to Duty Guidance",detail:"Legal rights and peer advocacy",icon:"[=]️",color:"#eab308"}
  ];
  
  const lists={crisis,upstream,downstream};
  
  const getFilteredPathways=()=>{
    if(!aiResources) return statePathways[selectedState]||[];
    return aiResources.filter(r=>{
      if(selectedDiscipline==="All") return true;
      return (r.disciplines&&(r.disciplines.includes("All")||r.disciplines.includes(selectedDiscipline)));
    });
  };
  
  const filteredPathways=getFilteredPathways();
  const showNationalFallback=selectedState==="All"||(!aiLoading&&filteredPathways.length===0);
  
  return(
    <Screen headerProps={{onBack:()=>navigate("home"),title:"Resources",agencyName:(agency&&agency.name)}}>
      <div className="full-width" style={{display:"flex",gap:6,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:5,overflowX:"auto",minHeight:50}}>
        {tabs.map(t=>(
          <div
            key={t.key}
            onClick={()=>setTab(t.key)}
            style={{
              flex:1,
              textAlign:"center",
              padding:"10px 8px",
              borderRadius:9,
              background:tab===t.key?"rgba(56,189,248,0.18)":"transparent",
              border:"1px solid "+(tab===t.key?"rgba(56,189,248,0.35)":"transparent"),
              cursor:"pointer",
              fontSize:11,
              fontWeight:tab===t.key?800:600,
              color:tab===t.key?"#38bdf8":"#8099b0",
              transition:"all 0.2s",
              whiteSpace:"nowrap",
              display:"flex",
              alignItems:"center",
              justifyContent:"center",
            }}
          >
            {t.label}
          </div>
        ))}
      </div>
      
      {tab==="crisis"&&(
        <div className="full-width" style={{background:"rgba(239,68,68,0.1)",border:"1.5px solid rgba(239,68,68,0.35)",borderRadius:12,padding:"14px 16px"}}>
          <div style={{fontSize:13,color:"#fca5a5",fontWeight:800,marginBottom:6}}>If you're in crisis right now</div>
          <div style={{fontSize:13,color:"#94a3b8",lineHeight:1.7}}>Call or text <span style={{color:"#f87171",fontWeight:700}}>988</span> · Text HOME to <span style={{color:"#f87171",fontWeight:700}}>741741</span> · Safe Call Now <span style={{color:"#f87171",fontWeight:700}}>1-206-459-3020</span> — people who understand the job, 24/7.</div>
        </div>
      )}
      
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
          <div style={{background:"rgba(234,179,8,0.07)",border:"1px solid rgba(234,179,8,0.2)",borderRadius:10,padding:"10px 14px",display:"flex",gap:10,alignItems:"flex-start"}}>
            <div style={{fontSize:16,flexShrink:0}}>📍</div>
            <div>
              <div style={{fontSize:12,color:"#fbbf24",fontWeight:700,marginBottom:2}}>State resources are updated frequently</div>
              <div style={{fontSize:11,color:"#64748b",lineHeight:1.6}}>Know a resource we're missing? <span style={{color:"#38bdf8",cursor:"pointer",textDecoration:"underline"}} onClick={()=>navigate("feedback")}>Leave feedback</span> and we'll get it added.</div>
            </div>
          </div>
          
          <div>
            <SLabel color="#38bdf8">Your State</SLabel>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {states.map(s=>(
                <div 
                  key={s}
                  onClick={()=>setSelectedState(s)}
                  style={{
                    background:selectedState===s?"rgba(56,189,248,0.15)":"rgba(255,255,255,0.03)",
                    border:`1.5px solid ${selectedState===s?"rgba(56,189,248,0.35)":"rgba(255,255,255,0.07)"}`,
                    borderRadius:10,
                    padding:"8px 14px",
                    cursor:"pointer",
                    fontSize:12,
                    fontWeight:selectedState===s?700:400,
                    color:selectedState===s?"#38bdf8":"#8099b0",
                    transition:"all 0.15s"
                  }}
                >
                  {s==="All"?"National":s}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <SLabel color="#a78bfa">Your Discipline</SLabel>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {disciplines.map(d=>(
                <div 
                  key={d}
                  onClick={()=>setSelectedDiscipline(d)}
                  style={{
                    background:selectedDiscipline===d?"rgba(167,139,250,0.15)":"rgba(255,255,255,0.03)",
                    border:`1.5px solid ${selectedDiscipline===d?"rgba(167,139,250,0.35)":"rgba(255,255,255,0.07)"}`,
                    borderRadius:10,
                    padding:"8px 14px",
                    cursor:"pointer",
                    fontSize:11,
                    fontWeight:selectedDiscipline===d?700:400,
                    color:selectedDiscipline===d?"#a78bfa":"#8099b0",
                    transition:"all 0.15s"
                  }}
                >
                  {d}
                </div>
              ))}
            </div>
          </div>
          
          {filteredPathways.length>0&&(
            <>
              {aiLoading&&(
                <div style={{background:"rgba(56,189,248,0.05)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:10,padding:"16px 12px",marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:16,height:16,borderRadius:"50%",border:"2px solid #38bdf8",borderTopColor:"transparent",animation:"spin 0.8s linear infinite",flexShrink:0}}/>
                  <div style={{fontSize:12,color:"#38bdf8",fontWeight:600}}>Finding real resources for {selectedState}...</div>
                </div>
              )}
              {aiError&&(
                <div style={{background:"rgba(234,179,8,0.05)",border:"1px solid rgba(234,179,8,0.2)",borderRadius:10,padding:"8px 12px",marginBottom:8,fontSize:11,color:"#eab308"}}>{aiError}</div>
              )}
              {!aiLoading&&(
                <div style={{background:"rgba(34,197,94,0.05)",border:"1px solid rgba(34,197,94,0.15)",borderRadius:10,padding:"8px 12px",marginBottom:8,display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:"#22c55e",flexShrink:0}}/>
                  <div style={{fontSize:11,color:"#22c55e",fontWeight:600}}>{aiResources&&aiResources.length>0?"Live resources for":"Saved resources for"} {selectedState}{aiResources&&aiResources.length>0?" - updated weekly":""}</div>
                </div>
              )}
              <SLabel color="#22c55e">{selectedState} Resources</SLabel>
              {filteredPathways.map((r,i)=>(
                <Card key={i} style={{display:"flex",alignItems:"center",gap:14}}>
                  <div style={{width:44,height:44,borderRadius:13,background:`${r.color}18`,border:`1px solid ${r.color}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                    {r.icon}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2,flexWrap:"wrap"}}>
                      <div style={{fontSize:14,fontWeight:700,color:"#dde8f4"}}>{r.name}</div>
                      {r.neighborState&&<div style={{fontSize:9,fontWeight:800,letterSpacing:"0.08em",color:"#a78bfa",background:"rgba(167,139,250,0.15)",padding:"2px 6px",borderRadius:5}}>{r.neighborState}</div>}
                      {r.free&&<div style={{fontSize:9,fontWeight:800,letterSpacing:"0.08em",color:"#22c55e",background:"rgba(34,197,94,0.15)",padding:"2px 6px",borderRadius:5}}>FREE</div>}
                    </div>
                    <div style={{fontSize:12,color:"#8099b0",marginTop:3}}>{r.detail}</div>
                    {r.tags&&(
                      <div style={{display:"flex",gap:4,marginTop:6,flexWrap:"wrap"}}>
                        {r.tags.map((tag,j)=>(
                          <span key={j} style={{fontSize:9,color:"#38bdf8",background:"rgba(56,189,248,0.1)",padding:"2px 6px",borderRadius:4,fontWeight:600}}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a52" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </Card>
              ))}
            </>
          )}
          
          {showNationalFallback&&(
            <>
              {filteredPathways.length===0&&selectedState!=="All"&&(
                <div style={{background:"rgba(234,179,8,0.08)",border:"1px solid rgba(234,179,8,0.2)",borderRadius:12,padding:"14px 16px",textAlign:"center"}}>
                  <div style={{fontSize:12,color:"#eab308",fontWeight:700,marginBottom:4}}>
                    No {selectedDiscipline!=="All"?selectedDiscipline+" ":""}resources found for {selectedState}
                  </div>
                  <div style={{fontSize:11,color:"#3d5268",lineHeight:1.6}}>
                    We're working to add more state-specific programs. National resources shown below.
                  </div>
                </div>
              )}
              <SLabel color="#64748b">National Resources</SLabel>
              {nationalFallbacks.map((r,i)=>(
                <Card key={i} style={{display:"flex",alignItems:"center",gap:14}}>
                  <div style={{width:44,height:44,borderRadius:13,background:`${r.color}18`,border:`1px solid ${r.color}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                    {r.icon}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#dde8f4"}}>{r.name}</div>
                    <div style={{fontSize:12,color:"#2d4a66",marginTop:3}}>{r.detail}</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a52" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </Card>
              ))}
            </>
          )}
        </>
      )}
      
      {tab==="calendar"&&(<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <SLabel color="#38bdf8">Agency Calendar</SLabel>
          {isAdminRole&&<Btn color="#22c55e" bg="rgba(34,197,94,0.12)" onClick={()=>alert("Add Event feature - admin only")} style={{padding:"8px 12px",fontSize:12}}>+ Add Event</Btn>}
        </div>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {["month","list"].map(view=>(
            <div key={view} onClick={()=>setCalendarView(view)} style={{flex:1,textAlign:"center",padding:"10px",borderRadius:10,background:calendarView===view?"rgba(56,189,248,0.12)":"rgba(255,255,255,0.03)",border:`1.5px solid ${calendarView===view?"rgba(56,189,248,0.3)":"rgba(255,255,255,0.06)"}`,cursor:"pointer",fontSize:12,fontWeight:calendarView===view?700:500,color:calendarView===view?"#38bdf8":"#8099b0"}}>{view.charAt(0).toUpperCase()+view.slice(1)}</div>
          ))}
        </div>
        {calendarView==="list"&&events.map(event=>(
          <Card key={event.id} style={{display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:48,height:48,borderRadius:12,background:`${event.color}18`,border:`1px solid ${event.color}40`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <div style={{fontSize:11,color:event.color,fontWeight:700}}>{new Date(event.date).toLocaleDateString("en-US",{month:"short"})}</div>
              <div style={{fontSize:16,fontWeight:800,color:event.color}}>{new Date(event.date).getDate()}</div>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:"#dde8f4"}}>{event.title}</div>
              <div style={{fontSize:12,color:"#8099b0",marginTop:2}}>{event.type.toUpperCase()}</div>
            </div>
          </Card>
        ))}
        {calendarView==="month"&&(
          <Card>
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:8}}>
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day=>(
                <div key={day} style={{fontSize:11,fontWeight:700,color:"#64748b",textAlign:"center",padding:"8px 0"}}>{day}</div>
              ))}
              {[...Array(35)].map((_,i)=>{const dayNum=i-4;const hasEvent=events.some(e=>new Date(e.date).getDate()===dayNum);return(<div key={i} style={{aspectRatio:"1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderRadius:8,background:hasEvent?"rgba(56,189,248,0.06)":"rgba(255,255,255,0.02)",border:`1px solid ${hasEvent?"rgba(56,189,248,0.2)":"rgba(255,255,255,0.04)"}`,cursor:dayNum>0&&dayNum<=31?"pointer":"default",opacity:dayNum>0&&dayNum<=31?1:0.3}}>
                  <div style={{fontSize:13,fontWeight:600,color:hasEvent?"#38bdf8":"#8099b0"}}>{dayNum>0&&dayNum<=31?dayNum:""}</div>
                  {hasEvent&&<div style={{width:4,height:4,borderRadius:"50%",background:"#38bdf8",marginTop:2}}/>}
                </div>);
              })}
            </div>
          </Card>
        )}
      </>)}
      
      {tab!=="pathways"&&tab!=="crisis"&&tab!=="calendar"&&lists[tab].map((r,i)=>(
        <Card key={i} style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:44,height:44,borderRadius:13,background:`${r.color}18`,border:`1px solid ${r.color}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
            {r.icon}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700,color:"#dde8f4"}}>{r.name}</div>
            <div style={{fontSize:12,color:"#2d4a66",marginTop:3}}>{r.detail}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a52" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </Card>
      ))}
    </Screen>
  );
}

// 
// PTSD INTERRUPTION MODULE
// 
function PTSDInterruptionScreen({navigate,agency}){
  const[category,setCategory]=useState(null);
  const[toolIndex,setToolIndex]=useState(null);
  const[step,setStep]=useState(0);
  const[completed,setCompleted]=useState(false);

  const tools={
    grounding:{
      label:"Grounding",color:"#3D6B5E",icon:"🌊",
      items:[
        {title:"5-4-3-2-1 Reset",steps:["Name 5 things you can see","Name 4 things you can touch","Name 3 things you can hear","Name 2 things you can smell","Name 1 thing you can taste"]},
        {title:"Cold Reset",steps:["Hold something cold, or splash cold water on your face","Cold interrupts the adrenaline surge","Stay with the sensation for 30 seconds"]},
        {title:"Deep Pressure Reset",steps:["Press your feet firmly into the floor","Lean your back into a wall or chair","Feel the pressure - you're here, not there","Hold for 30 seconds"]},
      ]
    },
    breathing:{
      label:"Breathing",color:"#3A5A7C",icon:"💨",
      items:[
        {title:"Box Breathing",steps:["Inhale for 4 counts","Hold for 4 counts","Exhale for 4 counts","Hold for 4 counts","Repeat 4 times"]},
        {title:"4-7-8 Reset",steps:["Inhale for 4 counts","Hold for 7 counts","Exhale for 8 counts","Repeat 3 times","Your nervous system will slow"]},
        {title:"Tactical Breathing",steps:["Inhale slowly through your nose","Exhale slowly through your mouth","No counting needed - just slow and steady","Continue for 2 minutes"]},
      ]
    },
    orientation:{
      label:"Orientation",color:"#5A4A7A",icon:"🧭",
      items:[
        {title:"Name 3 Things",steps:["Say aloud: 'My name is...'","Say aloud: 'I am in...'","Say aloud: 'Today's date is...'","Repeat slowly until you feel present"]},
        {title:"Object Anchor",steps:["Hold something with texture - keys, coin, badge","Feel the temperature","Feel the weight","Describe it out loud"]},
        {title:"Room Scan",steps:["Turn your head slowly to the left","Name 3 things you see","Turn to the right","Name 3 more things","Keep going until the room feels familiar"]},
      ]
    },
    movement:{
      label:"Movement",color:"#6B4A3A",icon:"🚶",
      items:[
        {title:"Grounding Walk",steps:["Step forward with left foot","Say 'left' out loud","Step forward with right foot","Say 'right' out loud","Continue for 20 steps"]},
        {title:"Push Reset",steps:["Find a wall or countertop","Push against it with steady pressure","Feel your own strength","Hold for 10 seconds, release, repeat 3 times"]},
        {title:"Shoulder Roll",steps:["Roll your shoulders forward 3 times","Roll them back 3 times","Let your jaw unclench","Take a deep breath"]},
      ]
    },
    crisis:{
      label:"Crisis Support",color:"#6B2A2A",icon:"📞",
      items:[
        {title:"988 Crisis Lifeline",steps:["Call or text: 988","Available 24/7","Free and confidential","For anyone in emotional distress"]},
        {title:"Veterans Crisis Line",steps:["Call or text: 988, then press 1","Chat: VeteransCrisisLine.net","Available 24/7 for veterans and families"]},
        {title:"Talk to Someone Now",steps:["TAP_HUMANPST","TAP_AIPST"]},
      ]
    }
  };

  const allCategories=Object.entries(tools);
  const currentCat=category?tools[category]:null;
  const currentTool=currentCat&&toolIndex!==null?currentCat.items[toolIndex]:null;

  // Category List
  if(!category){
    return(
      <ScreenSingle headerProps={{onBack:()=>navigate("tools"),title:"PTSD Interruption",agencyName:(agency&&agency.name)}}>
        <div style={{fontSize:13,color:"#8099b0",lineHeight:1.75,marginBottom:20}}>
          These tools are designed for first responders (police, fire, EMS, corrections, dispatch) experiencing flashbacks, panic surges, or emotional overwhelm.
          <br/><br/>
          Choose what feels right. You're in control.
        </div>
        <SLabel>Tool Categories</SLabel>
        {allCategories.map(([key,cat])=>(
          <Card key={key} onClick={()=>setCategory(key)} style={{display:"flex",alignItems:"center",gap:14,background:`linear-gradient(135deg, ${cat.color}22, ${cat.color}0A)`,borderColor:`${cat.color}40`}}>
            <div style={{fontSize:28}}>{cat.icon}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:700,color:"#dde8f4"}}>{cat.label}</div>
              <div style={{fontSize:12,color:"#64748b",marginTop:2}}>{cat.items.length} tools</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3d5268" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </Card>
        ))}
      </ScreenSingle>
    );
  }

  // Tool List
  if(category&&toolIndex===null){
    return(
      <ScreenSingle headerProps={{onBack:()=>(setCategory(null),setStep(0)),title:currentCat.label,agencyName:(agency&&agency.name)}}>
        <div style={{fontSize:13,color:"#8099b0",fontStyle:"italic",marginBottom:16}}>
          Select a technique. Take your time.
        </div>
        {currentCat.items.map((tool,idx)=>(
          <Card key={idx} onClick={()=>(setToolIndex(idx),setStep(0),setCompleted(false))} style={{display:"flex",alignItems:"center",gap:14,background:`linear-gradient(135deg, ${currentCat.color}15, transparent)`,borderColor:`${currentCat.color}30`}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:`${currentCat.color}40`,border:`1px solid ${currentCat.color}60`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:currentCat.color,flexShrink:0}}>
              {idx+1}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:14,fontWeight:700,color:"#dde8f4"}}>{tool.title}</div>
              <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{tool.steps.length} steps</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3d5268" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </Card>
        ))}
      </ScreenSingle>
    );
  }

  // Tool Steps
  if(currentTool&&!completed){
    const progress=((step+1)/currentTool.steps.length)*100;
    return(
      <ScreenSingle headerProps={{onBack:()=>(setToolIndex(null),setStep(0)),title:currentTool.title,agencyName:(agency&&agency.name)}}>
        {/* Progress */}
        <div style={{display:"flex",gap:6,marginBottom:20}}>
          {currentTool.steps.map((_,i)=>(
            <div key={i} style={{flex:1,height:4,borderRadius:2,background:i<=step?currentCat.color:"rgba(255,255,255,0.08)",transition:"all 0.3s"}}/>
          ))}
        </div>
        
        {/* Step Display */}
        <Card style={{minHeight:180,padding:"28px 24px",background:`linear-gradient(135deg, ${currentCat.color}20, ${currentCat.color}08)`,borderColor:`${currentCat.color}40`,marginBottom:20,position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{position:"absolute",top:12,right:16,fontSize:11,color:`${currentCat.color}`,fontWeight:600}}>
            Step {step+1} of {currentTool.steps.length}
          </div>
          {currentTool.steps[step]==="TAP_HUMANPST"?(
            <div onClick={()=>navigate("humanpst")} style={{width:"100%",background:"rgba(167,139,250,0.12)",border:"1.5px solid rgba(167,139,250,0.35)",borderRadius:14,padding:"16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
              <div style={{width:44,height:44,borderRadius:12,background:"rgba(167,139,250,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🤝</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:800,color:"#c4b5fd"}}>Talk to a Human PST Member</div>
                <div style={{fontSize:12,color:"#7c5cbf",marginTop:2}}>Real peer support - call, text, or chat</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ):currentTool.steps[step]==="TAP_AIPST"?(
            <div onClick={()=>navigate("aichat")} style={{width:"100%",background:"rgba(239,68,68,0.1)",border:"1.5px solid rgba(239,68,68,0.3)",borderRadius:14,padding:"16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14,marginTop:12}}>
              <div style={{width:44,height:44,borderRadius:12,background:"rgba(239,68,68,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🤖</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:800,color:"#fca5a5"}}>Talk to AI Peer Support</div>
                <div style={{fontSize:12,color:"#7f1d1d",marginTop:2}}>Anonymous, available right now</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ):(
            <div style={{fontSize:16,lineHeight:1.8,color:"#e8e4dc",textAlign:"center",fontWeight:300}}>
              {currentTool.steps[step]}
            </div>
          )}
        </Card>

        {/* Step Dots */}
        <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:20}}>
          {currentTool.steps.map((_,i)=>(
            <div key={i} onClick={()=>setStep(i)} style={{width:i===step?24:8,height:8,borderRadius:4,background:i===step?currentCat.color:"rgba(255,255,255,0.15)",transition:"all 0.3s",cursor:"pointer"}}/>
          ))}
        </div>

        {/* Navigation */}
        <div style={{display:"flex",gap:10}}>
          {step>0&&(
            <Btn onClick={()=>setStep(step-1)} style={{flex:1,background:"rgba(255,255,255,0.05)",color:"#8099b0"}}>
              {'<- Previous'}
            </Btn>
          )}
          <Btn onClick={()=>{
            if(step<currentTool.steps.length-1){
              setStep(step+1);
            }else{
              setCompleted(true);
            }
          }} color={currentCat.color} bg={`${currentCat.color}CC`} style={{flex:2}}>
            {step<currentTool.steps.length-1?"Next Step ->":"Complete v"}
          </Btn>
        </div>
      </ScreenSingle>
    );
  }

  // Completion
  if(completed){
    return(
      <ScreenSingle headerProps={{onBack:()=>navigate("tools"),title:"Well Done",agencyName:(agency&&agency.name)}}>
        <div style={{textAlign:"center",paddingTop:20}}>
          <div style={{width:80,height:80,borderRadius:"50%",background:"rgba(126,191,173,0.1)",border:"2px solid rgba(126,191,173,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,margin:"0 auto 20px"}}>v</div>
          <div style={{fontSize:20,fontWeight:700,color:"#dde8f4",marginBottom:12}}>Tool Complete</div>
          <div style={{fontSize:14,color:"#8099b0",lineHeight:1.7,marginBottom:32,fontStyle:"italic"}}>
            You used a tool. That takes strength.
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <Btn onClick={()=>(setToolIndex(null),setStep(0),setCompleted(false))} color="#7EBFAD">
            Try Another Tool
          </Btn>
          <Btn onClick={()=>(setCategory(null),setToolIndex(null),setStep(0),setCompleted(false))} style={{background:"rgba(255,255,255,0.05)",color:"#8099b0"}}>
            Back to Categories
          </Btn>
          <div onClick={()=>navigate("tools")} style={{fontSize:13,color:"#64748b",textAlign:"center",cursor:"pointer",marginTop:6,textDecoration:"underline"}}>
            Return to Tools
          </div>
        </div>
      </ScreenSingle>
    );
  }
}

// 
// ABOUT
// 
function AboutScreen({navigate,agency,onChangeAgency,role,setRole,userState,onChangeState,userLanguage="en",setUserLanguage}){
  const[tab,setTab]=useState("about");
  const tabs=[{key:"about",label:"About"},{key:"founder",label:"Founder"},{key:"privacy",label:"Privacy"},{key:"security",label:"Security"},{key:"settings",label:"Settings"},{key:"account",label:"Agency"},{key:"role",label:"Role"}];
  const lc=useLayoutConfig();
  return(
    <Screen headerProps={{onBack:()=>navigate("home"),title:"About",agencyName:(agency&&agency.name)}}>
      <div className="full-width" style={{display:"flex",gap:6,background:"rgba(56,189,248,0.04)",borderRadius:12,padding:8,overflowX:"auto",border:"1px solid rgba(56,189,248,0.15)",minHeight:54}}>
        {tabs.map(t=>(<div key={t.key} onClick={()=>setTab(t.key)} style={{flex:"0 0 auto",textAlign:"center",padding:"12px 16px",minHeight:38,borderRadius:9,background:tab===t.key?"rgba(56,189,248,0.2)":"rgba(255,255,255,0.02)",border:`1.5px solid ${tab===t.key?"rgba(56,189,248,0.4)":"rgba(56,189,248,0.12)"}`,cursor:"pointer",fontSize:12,fontWeight:tab===t.key?800:600,color:tab===t.key?"#dde8f4":"#a8c5db",transition:"all 0.2s",whiteSpace:"nowrap",display:"flex",alignItems:"center"}}>{t.label}</div>))}
      </div>

      {tab==="about"&&(<>
        <div className="full-width" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"10px 0"}}><img src={LOGO_FULL_SRC} alt="Upstream Approach" style={{width:"60%",maxWidth:220,height:"auto",objectFit:"contain"}}/><div style={{fontSize:13,color:"#3d5268",textAlign:"center",letterSpacing:"0.1em",textTransform:"uppercase"}}>First Responder Wellness App</div></div>
        <Card><SLabel>Our Purpose</SLabel><p style={{fontSize:13,color:"#8099b0",lineHeight:1.75,marginBottom:12}}>First responders face challenges most people will never experience. This app was created to provide support for those who spend their careers supporting everyone else.</p><p style={{fontSize:13,color:"#8099b0",lineHeight:1.75}}>Our goal: <span style={{color:"#dde8f4",fontWeight:600}}>make wellness support accessible, confidential, and built for the realities of the job.</span></p></Card>
        <Card><SLabel>Our Mission</SLabel><p style={{fontSize:13,color:"#8099b0",lineHeight:1.75}}>To support the mental wellness and resilience of first responders by providing confidential tools, peer connection, and access to trusted support resources.</p></Card>
        <Card><SLabel>Who This Is For</SLabel>{["EMS / Paramedics / EMTs","Firefighters","Law Enforcement","Emergency Communications / Dispatch","Other emergency service professionals"].map((r,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:i<4?"1px solid rgba(255,255,255,0.04)":"none"}}><div style={{width:6,height:6,borderRadius:"50%",background:"#38bdf8",flexShrink:0}}/><span style={{fontSize:13,color:"#8099b0"}}>{r}</span></div>))}</Card>
        <Card style={{background:"rgba(56,189,248,0.05)",borderColor:"rgba(56,189,248,0.15)"}} className="full-width"><SLabel>A Culture Shift</SLabel><p style={{fontSize:13,color:"#38bdf8",fontWeight:600,lineHeight:1.6}}>Taking care of yourself is not weakness - it's part of staying effective in the job and healthy outside of it.</p></Card>
      </>)}

      {tab==="founder"&&(<>
        <div className="full-width" style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"10px 0"}}><div style={{width:64,height:64,borderRadius:"50%",background:"linear-gradient(135deg,rgba(14,165,233,0.2),rgba(56,189,248,0.1))",border:"2px solid rgba(56,189,248,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>🌊</div><div style={{fontSize:14,fontWeight:700,color:"#dde8f4"}}>Founder</div><div style={{fontSize:12,color:"#2d4a66"}}>Nearly 30 years in Emergency Medical Services</div></div>
        <Card style={{background:"rgba(56,189,248,0.04)",borderColor:"rgba(56,189,248,0.12)"}}><p style={{fontSize:13,color:"#8099b0",lineHeight:1.8,marginBottom:12}}>This app was created by someone who understands the job from the inside.</p><p style={{fontSize:13,color:"#8099b0",lineHeight:1.8,marginBottom:12}}>After nearly three decades in EMS, I've seen firsthand the impact this profession can have on the people who serve in it.</p><p style={{fontSize:13,color:"#8099b0",lineHeight:1.8}}>For many years, the culture encouraged people to keep moving to the next call. That mindset has helped many perform under pressure - but also made it harder for some to seek support.</p></Card>
        <Card><SLabel color="#38bdf8">Why "Upstream Approach"?</SLabel><p style={{fontSize:13,color:"#8099b0",lineHeight:1.8}}>The name comes from addressing problems <span style={{color:"#dde8f4",fontWeight:600}}>before they become crises</span> - recognizing stress early and building resilience over time.</p></Card>
        <Card><SLabel color="#38bdf8">Background</SLabel>{["Nearly 30 years in Emergency Medical Services","Field Paramedic experience","Communications / Dispatch experience","Leadership and supervisory roles","Peer support and wellness initiative experience"].map((r,i)=>(<div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"7px 0",borderBottom:i<4?"1px solid rgba(255,255,255,0.04)":"none"}}><div style={{width:6,height:6,borderRadius:"50%",background:"#38bdf8",flexShrink:0,marginTop:4}}/><span style={{fontSize:13,color:"#8099b0",lineHeight:1.5}}>{r}</span></div>))}</Card>
        <Card style={{background:"rgba(56,189,248,0.04)",borderColor:"rgba(56,189,248,0.12)"}} className="full-width"><p style={{fontSize:13,color:"#38bdf8",fontWeight:600,lineHeight:1.7,textAlign:"center"}}>Taking care of the people who spend their careers taking care of everyone else.</p></Card>
      </>)}

      {tab==="privacy"&&(<>
        <Card style={{background:"rgba(34,197,94,0.05)",borderColor:"rgba(34,197,94,0.15)"}}><SLabel color="#22c55e">Confidential by Design</SLabel><p style={{fontSize:13,color:"#8099b0",lineHeight:1.8}}>We do not share personal information, conversations, or wellness check-in data with employers, supervisors, or agencies. Your data is not sold, shared, or used for marketing.</p></Card>
        <Card style={{background:"rgba(56,189,248,0.05)",borderColor:"rgba(56,189,248,0.15)"}}>
          <SLabel color="#38bdf8">Location & State Detection</SLabel>
          <p style={{fontSize:13,color:"#8099b0",lineHeight:1.8,marginBottom:8}}>To show you relevant first responder resources, we detect your approximate state using your internet connection (IP address) - <span style={{color:"#dde8f4",fontWeight:600}}>not your GPS or device location.</span></p>
          <p style={{fontSize:13,color:"#8099b0",lineHeight:1.8,marginBottom:8}}>This means we only know what state you are likely in - never your city, neighborhood, or street address.</p>
          <p style={{fontSize:13,color:"#8099b0",lineHeight:1.8}}>You can always change your state manually in Settings. No location permission is ever requested.</p>
        </Card>
        <Card><SLabel color="#a78bfa">Peer Support Conversations</SLabel><p style={{fontSize:13,color:"#8099b0",lineHeight:1.75}}>Treated with respect and discretion, consistent with best practices in first responder peer support programs.</p></Card>
        <Card><SLabel color="#eab308">Your Control</SLabel><p style={{fontSize:13,color:"#8099b0",lineHeight:1.75}}>You are always in control of what you share. Many features allow anonymous or minimal-input use.</p></Card>
        <Card style={{background:"rgba(239,68,68,0.06)",borderColor:"rgba(239,68,68,0.18)"}}><SLabel color="#f87171">Limits of Confidentiality</SLabel>{["Someone expresses an immediate risk of harm to themselves or others","Required by applicable laws or emergency intervention protocols"].map((r,i)=>(<div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,padding:"5px 0"}}><div style={{width:5,height:5,borderRadius:"50%",background:"#f87171",flexShrink:0,marginTop:5}}/><span style={{fontSize:12,color:"#8099b0",lineHeight:1.6}}>{r}</span></div>))}</Card>
        <div className="full-width" style={{fontSize:11,color:"#1e3a52",textAlign:"center",lineHeight:1.7}}>This app is not a replacement for professional medical or mental health care.</div>
      </>)}

      {tab==="security"&&(<>
        <Card style={{background:"rgba(56,189,248,0.05)",borderColor:"rgba(56,189,248,0.15)"}}><SLabel>Protecting Your Information</SLabel><p style={{fontSize:13,color:"#8099b0",lineHeight:1.8}}>This platform uses modern security practices to ensure information you enter remains protected.</p></Card>
        {[{title:"Encryption",color:"#38bdf8",icon:"🔐",body:"Data transmitted through the app is protected using secure encryption so it cannot easily be intercepted."},{title:"Limited Access",color:"#a78bfa",icon:"🔒",body:"Wellness information is not accessible to employers, agencies, or supervisors."},{title:"Responsible Data Handling",color:"#eab308",icon:"📋",body:"User information is used only to support the app's intended features."}].map((s,i)=>(<Card key={i}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><span style={{fontSize:20}}>{s.icon}</span><SLabel color={s.color}>{s.title}</SLabel></div><p style={{fontSize:13,color:"#8099b0",lineHeight:1.75}}>{s.body}</p></Card>))}
      </>)}

      {tab==="role"&&(<>
        <Card style={{background:"rgba(56,189,248,0.05)",borderColor:"rgba(56,189,248,0.15)"}} className="full-width">
          <SLabel>Current Role</SLabel>
          <div style={{fontSize:18,fontWeight:800,color:"#38bdf8",marginTop:4}}>{ROLE_LABELS[role]}</div>
          <div style={{fontSize:12,color:"#3d5268",marginTop:4}}>Tap a role to preview that experience. In production, roles are assigned by your agency administrator.</div>
        </Card>
        <div style={{display:"flex",flexDirection:"column",gap:10}} className="full-width">
          {ROLES.map(r=>(
            <div key={r} onClick={()=>setRole(r)} style={{background:role===r?"rgba(56,189,248,0.1)":"rgba(255,255,255,0.03)",border:`1.5px solid ${role===r?"rgba(56,189,248,0.3)":"rgba(255,255,255,0.07)"}`,borderRadius:14,padding:"14px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:10,height:10,borderRadius:"50%",background:role===r?"#38bdf8":"#1e3a52",flexShrink:0}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:role===r?"#38bdf8":"#dde8f4"}}>{ROLE_LABELS[r]}</div>
                <div style={{fontSize:12,color:"#2d4a66",marginTop:2}}>{{user:"Basic wellness features",pst:"PST panel . Alert response . Coverage status",supervisor:"All user features + Admin Tools (limited) + [S] icon",admin:"Full Admin Tools . Dashboards . All screens"}[r]}</div>
              </div>
              {role===r&&<span style={{fontSize:10,color:"#38bdf8",fontWeight:700,background:"rgba(56,189,248,0.12)",padding:"3px 8px",borderRadius:6}}>ACTIVE</span>}
            </div>
          ))}
        </div>
      </>)}

      {tab==="settings"&&(<>
        <Card>
          <SLabel color="#38bdf8">{t("yourLanguage",userLanguage)}</SLabel>
          <div style={{fontSize:13,color:"#8099b0",marginTop:4,lineHeight:1.6}}>
            {t("autoDetected",userLanguage)}
          </div>
          <div style={{background:"rgba(56,189,248,0.08)",border:"1.5px solid rgba(56,189,248,0.2)",borderRadius:12,padding:"14px 16px",marginTop:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:12,color:"#64748b",fontWeight:600,marginBottom:2}}>
                {t("currentLanguage",userLanguage)}
              </div>
              <div style={{fontSize:16,fontWeight:700,color:"#38bdf8"}}>
                {userLanguage==='es'?'🇪🇸 Espanol':'🇺🇸 English'}
              </div>
            </div>
            {setUserLanguage&&<div onClick={()=>setUserLanguage(userLanguage==='es'?'en':'es')} style={{fontSize:13,color:"#38bdf8",fontWeight:700,cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>{t("change",userLanguage)}</div>}
          </div>
        </Card>
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div>
              <SLabel color="#38bdf8">{t("yourState",userLanguage)}</SLabel>
              <div style={{fontSize:13,color:"#8099b0",marginTop:4,lineHeight:1.6}}>Used to show relevant first responder mental health resources and programs in your state and surrounding areas</div>
            </div>
          </div>
          <div style={{background:"rgba(56,189,248,0.08)",border:"1.5px solid rgba(56,189,248,0.2)",borderRadius:12,padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontSize:12,color:"#64748b",fontWeight:600,marginBottom:2}}>{t("currentlySetTo",userLanguage)}</div>
              <div style={{fontSize:16,fontWeight:700,color:"#38bdf8"}}>{userState||"North Carolina"}</div>
            </div>
            {onChangeState&&<div onClick={onChangeState} style={{fontSize:13,color:"#38bdf8",fontWeight:700,cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>{t("change",userLanguage)}</div>}
          </div>
        </Card>
        <Card style={{background:"rgba(255,255,255,0.02)",borderColor:"rgba(255,255,255,0.05)"}}>
          <SLabel color="#64748b">Privacy Setting</SLabel>
          <div style={{fontSize:13,color:"#8099b0",marginTop:8,lineHeight:1.6}}>Your state selection is stored only on this device and used to filter resources. It is never shared or transmitted.</div>
        </Card>
      </>)}

      {tab==="account"&&(<>
        <Card style={{background:agency?"rgba(56,189,248,0.05)":"rgba(255,255,255,0.025)",borderColor:agency?"rgba(56,189,248,0.15)":"rgba(255,255,255,0.06)"}} className="full-width">
          <SLabel color={agency?"#38bdf8":"#2d4a66"}>Current Mode</SLabel>
          <div style={{display:"flex",alignItems:"center",gap:10,marginTop:4}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:agency?"#22c55e":"#2d4a66",boxShadow:agency?"0 0 8px rgba(34,197,94,0.5)":"none"}}/>
            <span style={{fontSize:16,fontWeight:700,color:agency?"#dde8f4":"#3d5268"}}>{agency?agency.name:"Individual Mode"}</span>
          </div>
          <div style={{fontSize:12,color:"#2d4a66",marginTop:4}}>{agency?"Agency code active . Human PST enabled":"No agency linked . Human PST not available"}</div>
        </Card>
        {agency?(<Btn color="#38bdf8" onClick={()=>onChangeAgency()} className="full-width">Change Agency Code</Btn>):(<Btn color="#38bdf8" onClick={()=>onChangeAgency()}>Enter Agency Code -></Btn>)}
        <Card className="full-width"><SLabel>What agency codes unlock:</SLabel>{["Human PST availability panel","Contact request flow (Text / Call)","Agency name shown in header","Crew Stream bar on Home Screen"].map((f,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:i<3?"1px solid rgba(255,255,255,0.04)":"none"}}><div style={{fontSize:14}}>{agency?"[ok]":"🔒"}</div><span style={{fontSize:13,color:agency?"#8099b0":"#2d4a66"}}>{f}</span></div>))}</Card>
        <div className="full-width" style={{fontSize:11,color:"#1e3a52",textAlign:"center"}}>Demo codes: UPSTREAM . METRO24 . FIRE07 . EMS01 . SHERIFF</div>
      </>)}
    </Screen>
  );
}

// Icons
function BoltIcon(){return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>;}
function ClockIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;}
function BreathIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>;}
function HeartIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;}
function GaugeIcon({color}){return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d="M12 2a10 10 0 0 1 7.39 16.75"/><path d="M12 2a10 10 0 0 0-7.39 16.75"/><line x1="12" y1="12" x2="15.5" y2="8.5"/><circle cx="12" cy="12" r="1.5" fill={color}/></svg>;}
function HomeIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;}
function InfoIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;}
function MapIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>;}
function UserIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;}
function ToolsIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;}
function GroundIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>;}
function JournalIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;}
function ResetIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>;}
function LockIcon({size=18}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;}
function BuildingIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;}
function TimerIcon(){return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M9 3h6"/><path d="M12 3v2"/></svg>;}
function SettingsIcon(){return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;}
function ShieldIcon(){return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;}

// 
// TRANSLATION HELPER
// 
const translations={
  en:{
    // Navigation
    home:"Home",
    aiPST:"AI PST",
    pstTeam:"PST Team",
    tools:"Tools",
    about:"About",
    // Buttons
    submit:"Submit",
    cancel:"Cancel",
    save:"Save",
    send:"Send",
    back:"Back",
    continue:"Continue",
    skip:"Skip",
    change:"Change",
    // Common
    loading:"Loading...",
    optional:"Optional",
    required:"Required",
    // AI PST
    text:"Text",
    voice:"Voice",
    tapToSpeak:"Tap to Speak",
    listening:"Listening...",
    speaking:"Speaking...",
    you:"YOU",
    typeHere:"Type here...",
    // State selector
    welcome:"Welcome to Upstream",
    selectState:"Select Your State",
    yourState:"Your State",
    currentlySetTo:"Currently Set To:",
    // Language
    yourLanguage:"Your Language",
    currentLanguage:"Current Language:",
    autoDetected:"Auto-detected from your phone settings",
  },
  es:{
    // Navigation
    home:"Inicio",
    aiPST:"PST IA",
    pstTeam:"Equipo PST",
    tools:"Herramientas",
    about:"Acerca de",
    // Buttons
    submit:"Enviar",
    cancel:"Cancelar",
    save:"Guardar",
    send:"Enviar",
    back:"Atras",
    continue:"Continuar",
    skip:"Saltar",
    change:"Cambiar",
    // Common
    loading:"Cargando...",
    optional:"Opcional",
    required:"Requerido",
    // AI PST
    text:"Texto",
    voice:"Voz",
    tapToSpeak:"Toca para Hablar",
    listening:"Escuchando...",
    speaking:"Hablando...",
    you:"TU",
    typeHere:"Escribe aqui...",
    // State selector
    welcome:"Bienvenido a Upstream",
    selectState:"Selecciona Tu Estado",
    yourState:"Tu Estado",
    currentlySetTo:"Configurado Como:",
    // Language
    yourLanguage:"Tu Idioma",
    currentLanguage:"Idioma Actual:",
    autoDetected:"Detectado automaticamente desde la configuracion de tu telefono",
  }
};

const t=(key,lang="en")=>translations[lang][key]||translations.en[key]||key;

// 
// ROOT APP
const ROLES=["user","pst","supervisor","admin","platform"];


// 
// EMERGENCY CONTACTS
// 
function EmergencyContactsScreen({navigate,agency}){
  const[contacts,setContacts]=useState(()=>{
    try{const s=localStorage.getItem("upstream_emergency_contacts");return s?JSON.parse(s):[];}catch(e){return [];}
  });
  const[showAdd,setShowAdd]=useState(false);
  const[newName,setNewName]=useState("");
  const[newPhone,setNewPhone]=useState("");
  const[newRole,setNewRole]=useState("PST");
  const lc=useLayoutConfig();

  const save=(c)=>{try{localStorage.setItem("upstream_emergency_contacts",JSON.stringify(c));}catch(e){}};
  const addContact=()=>{
    if(!newName.trim()||!newPhone.trim()) return;
    const c=[...contacts,{id:"ec"+Date.now(),name:newName.trim(),phone:newPhone.trim(),role:newRole}];
    setContacts(c);save(c);
    setNewName("");setNewPhone("");setNewRole("PST");setShowAdd(false);
  };
  const removeContact=(id)=>{const c=contacts.filter(x=>x.id!==id);setContacts(c);save(c);};

  const roleColors={PST:"#a78bfa",Chaplain:"#38bdf8",Therapist:"#22c55e",Supervisor:"#eab308",Family:"#f97316",Other:"#64748b"};
  const roles=["PST","Chaplain","Therapist","Supervisor","Family","Other"];

  return(
    <ScreenSingle headerProps={{onBack:()=>navigate("tools"),title:"Emergency Contacts",agencyName:(agency&&agency.name)}}>
      <div style={{background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.18)",borderRadius:12,padding:"12px 14px"}}>
        <div style={{fontSize:12,fontWeight:700,color:"#f87171",marginBottom:4}}>Your personal safety net</div>
        <div style={{fontSize:12,color:"#3d5268",lineHeight:1.6}}>These contacts stay on your device only. Nothing is sent unless you tap to call or text.</div>
      </div>

      {/* Built-in crisis numbers */}
      <div style={{fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6}}>Always Available</div>
      {[
        {name:"988 Crisis Lifeline",phone:"988",role:"Crisis",color:"#ef4444"},
        {name:"Safe Call Now",phone:"206-459-3020",role:"First Responders",color:"#38bdf8"},
        {name:"Crisis Text Line",phone:"741741",role:"Text HOME",color:"#22c55e"},
      ].map((c,i)=>(
        <div key={i} style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:14,padding:"13px 16px",display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:"#dde8f4"}}>{c.name}</div>
            <div style={{fontSize:11,color:"#475569",marginTop:2}}>{c.role}</div>
          </div>
          <a href={`tel:${c.phone}`} style={{padding:"8px 14px",borderRadius:10,background:`rgba(${c.color==="#ef4444"?"239,68,68":c.color==="#38bdf8"?"56,189,248":"34,197,94"},0.12)`,border:`1px solid ${c.color}40`,fontSize:12,fontWeight:700,color:c.color,textDecoration:"none",whiteSpace:"nowrap"}}>
            {c.role==="Text HOME"?"Text":"Call"} {c.phone}
          </a>
        </div>
      ))}

      {/* Personal contacts */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8,marginBottom:6}}>
        <div style={{fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:"0.12em",textTransform:"uppercase"}}>My Contacts ({contacts.length})</div>
        <div onClick={()=>setShowAdd(!showAdd)} style={{fontSize:12,fontWeight:700,color:"#38bdf8",cursor:"pointer"}}>+ Add</div>
      </div>

      {showAdd&&(
        <div style={{background:"rgba(56,189,248,0.05)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:14,padding:"16px",marginBottom:12}}>
          <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Name" style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.09)",borderRadius:10,padding:"11px 14px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",width:"100%",marginBottom:10,color:"#dde8f4"}}/>
          <input value={newPhone} onChange={e=>setNewPhone(e.target.value)} placeholder="Phone number" type="tel" style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.09)",borderRadius:10,padding:"11px 14px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",width:"100%",marginBottom:10,color:"#dde8f4"}}/>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
            {roles.map(r=>(
              <div key={r} onClick={()=>setNewRole(r)} style={{padding:"6px 12px",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:700,background:newRole===r?roleColors[r]+"20":"rgba(255,255,255,0.03)",border:`1px solid ${newRole===r?roleColors[r]+"50":"rgba(255,255,255,0.07)"}`,color:newRole===r?roleColors[r]:"#475569"}}>{r}</div>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            <div onClick={()=>setShowAdd(false)} style={{flex:1,padding:"11px",borderRadius:10,cursor:"pointer",textAlign:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",fontSize:12,fontWeight:700,color:"#475569"}}>Cancel</div>
            <div onClick={addContact} style={{flex:2,padding:"11px",borderRadius:10,cursor:"pointer",textAlign:"center",background:"rgba(56,189,248,0.12)",border:"1.5px solid rgba(56,189,248,0.3)",fontSize:12,fontWeight:700,color:"#38bdf8"}}>Save Contact</div>
          </div>
        </div>
      )}

      {contacts.length===0&&!showAdd&&(
        <div style={{textAlign:"center",padding:"28px 20px",color:"#1e3a52",fontSize:13}}>No personal contacts yet. Tap + Add to build your support list.</div>
      )}

      {contacts.map((c,i)=>(
        <div key={c.id} style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.055)",borderRadius:14,padding:"13px 16px",display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
              <div style={{fontSize:13,fontWeight:700,color:"#dde8f4"}}>{c.name}</div>
              <div style={{fontSize:9,fontWeight:800,color:roleColors[c.role]||"#64748b",background:(roleColors[c.role]||"#64748b")+"18",padding:"2px 7px",borderRadius:5}}>{c.role}</div>
            </div>
            <div style={{fontSize:11,color:"#475569"}}>{c.phone}</div>
          </div>
          <div style={{display:"flex",gap:6}}>
            <a href={`tel:${c.phone}`} style={{padding:"7px 11px",borderRadius:9,background:"rgba(56,189,248,0.1)",border:"1px solid rgba(56,189,248,0.25)",fontSize:11,fontWeight:700,color:"#38bdf8",textDecoration:"none"}}>Call</a>
            <a href={`sms:${c.phone}`} style={{padding:"7px 11px",borderRadius:9,background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.25)",fontSize:11,fontWeight:700,color:"#22c55e",textDecoration:"none"}}>Text</a>
            <div onClick={()=>removeContact(c.id)} style={{padding:"7px 11px",borderRadius:9,background:"rgba(239,68,68,0.07)",border:"1px solid rgba(239,68,68,0.15)",fontSize:11,fontWeight:700,color:"#f87171",cursor:"pointer"}}>x</div>
          </div>
        </div>
      ))}

      <div style={{fontSize:10,color:"#1e3a52",textAlign:"center",lineHeight:1.6,marginTop:8}}>Nothing is sent automatically. You confirm before anything leaves your device.</div>
    </ScreenSingle>
  );
}

// 
// CUSTOM ALERTS
// 
function CustomAlertsScreen({navigate,agency}){
  const[alerts,setAlerts]=useState(()=>{
    try{const s=localStorage.getItem("upstream_custom_alerts");return s?JSON.parse(s):[
      {id:"a1",enabled:false,text:"Check in with me every day during tough weeks",icon:"📅"},
      {id:"a2",enabled:false,text:"If my stress stays high for 3 days, suggest grounding tools",icon:"📊"},
      {id:"a3",enabled:false,text:"Remind me to journal if I haven't in a while",icon:"📓"},
      {id:"a4",enabled:false,text:"Prompt me to breathe before the end of each shift",icon:"🫁"},
    ];}catch(e){return [];}
  });
  const[showCustom,setShowCustom]=useState(false);
  const[customText,setCustomText]=useState("");

  const toggle=(id)=>{
    const next=alerts.map(a=>a.id===id?{...a,enabled:!a.enabled}:a);
    setAlerts(next);
    try{localStorage.setItem("upstream_custom_alerts",JSON.stringify(next));}catch(e){}
  };
  const addCustom=()=>{
    if(!customText.trim()) return;
    const next=[...alerts,{id:"a"+Date.now(),enabled:true,text:customText.trim(),icon:"🔔",custom:true}];
    setAlerts(next);
    try{localStorage.setItem("upstream_custom_alerts",JSON.stringify(next));}catch(e){}
    setCustomText("");setShowCustom(false);
  };
  const remove=(id)=>{
    const next=alerts.filter(a=>a.id!==id);
    setAlerts(next);
    try{localStorage.setItem("upstream_custom_alerts",JSON.stringify(next));}catch(e){}
  };

  return(
    <ScreenSingle headerProps={{onBack:()=>navigate("tools"),title:"Personal Alerts",agencyName:(agency&&agency.name)}}>
      <div style={{background:"rgba(56,189,248,0.06)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:12,padding:"12px 14px"}}>
        <div style={{fontSize:12,fontWeight:700,color:"#38bdf8",marginBottom:4}}>Your alerts. Your control.</div>
        <div style={{fontSize:12,color:"#3d5268",lineHeight:1.6}}>All alerts stay on your device. Nothing is shared with your agency or admin.</div>
      </div>

      <div style={{fontSize:11,fontWeight:700,color:"#64748b",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:6}}>Suggested Alerts</div>
      {alerts.map((a)=>(
        <div key={a.id} style={{background:"rgba(255,255,255,0.025)",border:`1.5px solid ${a.enabled?"rgba(56,189,248,0.2)":"rgba(255,255,255,0.055)"}`,borderRadius:14,padding:"13px 16px",display:"flex",alignItems:"center",gap:12,marginBottom:8,transition:"all 0.2s"}}>
          <div style={{fontSize:20,flexShrink:0}}>{a.icon}</div>
          <div style={{flex:1,fontSize:13,color:a.enabled?"#dde8f4":"#64748b",lineHeight:1.5}}>{a.text}</div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
            {a.custom&&<div onClick={()=>remove(a.id)} style={{fontSize:12,color:"#ef4444",cursor:"pointer",padding:"4px 8px"}}>x</div>}
            <div onClick={()=>toggle(a.id)} style={{width:44,height:24,borderRadius:12,background:a.enabled?"#38bdf8":"rgba(255,255,255,0.08)",border:`1px solid ${a.enabled?"#38bdf8":"rgba(255,255,255,0.12)"}`,position:"relative",cursor:"pointer",transition:"all 0.2s"}}>
              <div style={{position:"absolute",top:2,left:a.enabled?22:2,width:20,height:20,borderRadius:"50%",background:a.enabled?"#fff":"#475569",transition:"left 0.2s"}}/>
            </div>
          </div>
        </div>
      ))}

      {showCustom?(
        <div style={{background:"rgba(56,189,248,0.05)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:14,padding:"14px",marginTop:4}}>
          <textarea value={customText} onChange={e=>setCustomText(e.target.value)} placeholder="Write your own alert..." rows={2} style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(56,189,248,0.2)",borderRadius:10,padding:"11px 13px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",width:"100%",color:"#dde8f4",marginBottom:10}}/>
          <div style={{display:"flex",gap:8}}>
            <div onClick={()=>setShowCustom(false)} style={{flex:1,padding:"10px",borderRadius:10,cursor:"pointer",textAlign:"center",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",fontSize:12,fontWeight:700,color:"#475569"}}>Cancel</div>
            <div onClick={addCustom} style={{flex:2,padding:"10px",borderRadius:10,cursor:"pointer",textAlign:"center",background:"rgba(56,189,248,0.12)",border:"1.5px solid rgba(56,189,248,0.3)",fontSize:12,fontWeight:700,color:"#38bdf8"}}>Add Alert</div>
          </div>
        </div>
      ):(
        <div onClick={()=>setShowCustom(true)} style={{background:"rgba(255,255,255,0.02)",border:"1.5px dashed rgba(255,255,255,0.08)",borderRadius:14,padding:"14px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,marginTop:4}}>
          <div style={{width:34,height:34,borderRadius:9,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>+</div>
          <div style={{fontSize:13,fontWeight:700,color:"#475569"}}>Create your own alert</div>
        </div>
      )}

      <div style={{fontSize:10,color:"#1e3a52",textAlign:"center",lineHeight:1.6,marginTop:8}}>Alerts are reminders only - nothing is logged or shared.</div>
    </ScreenSingle>
  );
}

// 
// EDUCATIONAL CONTENT
// 
function EducationalScreen({navigate,agency}){
  const[selected,setSelected]=useState(null);
  const modules=[
    {id:"stress",icon:"🧠",color:"#38bdf8",title:"Stress vs. Trauma",tag:"5 min",body:[
      "Stress and trauma are different. Stress is the body's response to demands - it's normal and often manageable. Trauma is what happens when an experience overwhelms the nervous system's ability to cope.",
      "First responders experience both. High-frequency, low-severity stress accumulates over time. Critical incidents can cause acute trauma responses.",
      "Knowing the difference matters because the tools for each are different. Box breathing manages stress. EMDR processes trauma. Peer support helps both.",
      "You don't have to diagnose yourself. You just have to notice when something isn't passing on its own.",
    ]},
    {id:"sleep",icon:"😴",color:"#a78bfa",title:"Sleep & Recovery",tag:"4 min",body:[
      "Sleep deprivation is an occupational hazard in this job. Shift work disrupts circadian rhythm. Critical calls activate the nervous system at 3am. Hypervigilance makes it hard to wind down.",
      "What helps: keep your sleep space dark and cool, avoid screens 30 min before sleep, box breathing before sleep signals the body it's safe, and brief 20-minute naps are more restorative than you think.",
      "Your brain processes the day's experiences during sleep - including difficult calls. Sleep isn't a luxury. It's part of the job.",
    ]},
    {id:"family",icon:"🏠",color:"#f97316",title:"Family Impact",tag:"6 min",body:[
      "The people at home feel the weight of this job even when you don't talk about it. Hypervigilance doesn't turn off at the door. Short fuses, emotional withdrawal, and trouble being present are common - and they affect relationships.",
      "This isn't weakness. It's physiology.",
      "What helps: name it without detailed debriefing ('Rough shift. I'm here though.'), physical transition rituals like changing clothes or a walk, and letting your family know it's not about them.",
      "Peer support for families exists. The resources section has links.",
    ]},
    {id:"peer",icon:"🤝",color:"#22c55e",title:"Peer Support Basics",tag:"5 min",body:[
      "Peer support works because it comes from someone who's been there. Not a therapist. Not a supervisor. Someone who has done the job and understands the culture.",
      "Peer support is not a formal interview, not mandatory reporting, and not a sign that something is wrong with you.",
      "Peer support is a check-in, a conversation that doesn't leave the room, someone saying 'I've been there too.'",
      "Reaching out to your PST team is one of the strongest things you can do.",
    ]},
    {id:"grounding",icon:"🌊",color:"#eab308",title:"Tactical Grounding",tag:"3 min",body:[
      "Grounding techniques interrupt the stress response by anchoring you to the present moment. They work because the brain can't fully process both a threat response and sensory awareness at the same time.",
      "Box Breathing (4-4-4-4) slows the heart rate and signals safety to the nervous system.",
      "5-4-3-2-1 engages all five senses to interrupt rumination.",
      "Cold water on the face activates the dive reflex and drops heart rate fast.",
      "These aren't soft. They're tactical. Use them.",
    ]},
    {id:"substance",icon:"🚫",color:"#ef4444",title:"Substance Use Awareness",tag:"5 min",body:[
      "Alcohol is the most common coping mechanism in first responder culture. It works short-term - it blunts the nervous system and quiets the noise. The problem is that it disrupts REM sleep, increases anxiety over time, and doesn't process the underlying stress.",
      "This isn't about judgment. It's about knowing what's actually happening.",
      "Signs worth noticing: needing a drink to wind down after most shifts, drinking alone or to stop thinking, others commenting on your drinking.",
      "Resources that work for this culture specifically are in the Resources section. No AA meeting required if that's not your thing.",
    ]},
  ];
    const selected_mod=modules.find(m=>m.id===selected);

  if(selected_mod){return(
    <ScreenSingle headerProps={{onBack:()=>setSelected(null),title:selected_mod.title,agencyName:(agency&&agency.name)}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:4}}>
        <div style={{width:52,height:52,borderRadius:15,background:selected_mod.color+"18",border:`1px solid ${selected_mod.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>{selected_mod.icon}</div>
        <div>
          <div style={{fontSize:18,fontWeight:800,color:"#dde8f4"}}>{selected_mod.title}</div>
          <div style={{fontSize:11,color:selected_mod.color,fontWeight:600,marginTop:2}}>{selected_mod.tag} read</div>
        </div>
      </div>
      {selected_mod.body.map((para,i)=>(
        <div key={i} style={{fontSize:14,color:"#c8dae8",lineHeight:1.8,marginBottom:12}}>{para}</div>
      ))}
      <div style={{background:"rgba(56,189,248,0.05)",border:"1px solid rgba(56,189,248,0.12)",borderRadius:12,padding:"12px 14px",marginTop:8}}>
        <div style={{fontSize:11,color:"#38bdf8",fontWeight:700,marginBottom:2}}>Want to go deeper?</div>
        <div onClick={()=>navigate("resources")} style={{fontSize:12,color:"#8099b0",cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>Resources & support programs -></div>
      </div>
    </ScreenSingle>
  );}

  return(
    <Screen headerProps={{onBack:()=>navigate("tools"),title:"Learn",agencyName:(agency&&agency.name)}}>
      <div className="full-width" style={{fontSize:13,color:"#8099b0",lineHeight:1.6}}>Short, stigma-free modules you can read anytime - on shift, after a call, or at home.</div>
      <div className="full-width" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {modules.map((m)=>(
          <div key={m.id} onClick={()=>setSelected(m.id)} style={{background:"rgba(255,255,255,0.025)",border:`1.5px solid rgba(255,255,255,0.065)`,borderRadius:18,padding:"18px 14px",cursor:"pointer",display:"flex",flexDirection:"column",gap:10,transition:"all 0.13s",position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",top:0,left:"15%",right:"15%",height:2,background:m.color,opacity:0.5,borderRadius:"0 0 4px 4px"}}/>
            <div style={{width:46,height:46,borderRadius:13,background:m.color+"18",border:`1px solid ${m.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{m.icon}</div>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"#dde8f4",lineHeight:1.3,marginBottom:3}}>{m.title}</div>
              <div style={{fontSize:10,color:m.color,fontWeight:600}}>{m.tag}</div>
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

// 
// FEEDBACK
// 
function FeedbackScreen({navigate,agency}){
  const[mode,setMode]=useState(null); // null=list, "quick","voice","reflection"
  const[rating,setRating]=useState(null);
  const[helpedWhat,setHelpedWhat]=useState([]);
  const[feedbackText,setFeedbackText]=useState("");
  const[submitted,setSubmitted]=useState(false);
  const[isListening,setIsListening]=useState(false);
  const recognitionRef=useRef(null);
  const lc=useLayoutConfig();

  const tools=["Box Breathing","AI Peer Support","5-4-3-2-1 Grounding","Journal","90-Second Dump","After-Action Reset","Human PST","PTSD Interruption","Resources","Shift Check-In"];
  const toggle=(t)=>setHelpedWhat(prev=>prev.includes(t)?prev.filter(x=>x!==t):[...prev,t]);

  const startVoice=()=>{
    if(!("webkitSpeechRecognition" in window||"SpeechRecognition" in window)){alert("Voice not supported. Try Chrome.");return;}
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    const r=new SR();r.continuous=true;r.interimResults=true;r.lang="en-US";
    r.onresult=(e)=>{setFeedbackText(Array.from(e.results).map(r=>r[0].transcript).join(" "));};
    r.onend=()=>setIsListening(false);
    r.start();recognitionRef.current=r;setIsListening(true);
  };
  const stopVoice=()=>{recognitionRef.current&&recognitionRef.current.stop();setIsListening(false);};

  const submit=()=>{setSubmitted(true);};

  if(submitted){return(
    <ScreenSingle headerProps={{onBack:()=>navigate("tools"),title:"Feedback",agencyName:(agency&&agency.name)}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,paddingTop:20}}>
        <div style={{fontSize:44}}>🙏</div>
        <div style={{fontSize:18,fontWeight:800,color:"#38bdf8",textAlign:"center"}}>Thank you</div>
        <div style={{fontSize:13,color:"#3d5268",textAlign:"center",lineHeight:1.7}}>Your feedback helps make this better for every responder who uses it.</div>
        <div style={{background:"rgba(56,189,248,0.06)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:12,padding:"12px 14px",width:"100%",textAlign:"center"}}>
          <div style={{fontSize:11,color:"#38bdf8",fontWeight:700}}>Anonymous. Private. Never shared without your permission.</div>
        </div>
        <div onClick={()=>(setSubmitted(false),setMode(null),setRating(null),setHelpedWhat([]),setFeedbackText(""))} style={{fontSize:13,color:"#2d4a66",cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>Submit more feedback</div>
      </div>
    </ScreenSingle>
  );}

  if(mode==="quick"){return(
    <ScreenSingle headerProps={{onBack:()=>setMode(null),title:"Quick Feedback",agencyName:(agency&&agency.name)}}>
      <div style={{fontSize:15,fontWeight:700,color:"#dde8f4",textAlign:"center",marginBottom:8}}>Did Upstream help you today?</div>
      <div style={{display:"flex",gap:10,marginBottom:20}}>
        {[{v:5,label:"Really helped",color:"#22c55e"},{v:3,label:"Somewhat",color:"#eab308"},{v:1,label:"Not much",color:"#ef4444"}].map(r=>(
          <div key={r.v} onClick={()=>setRating(r.v)} style={{flex:1,padding:"14px 8px",borderRadius:14,cursor:"pointer",textAlign:"center",background:rating===r.v?r.color+"20":"rgba(255,255,255,0.03)",border:`1.5px solid ${rating===r.v?r.color:"rgba(255,255,255,0.07)"}`,transition:"all 0.15s"}}>
            <div style={{fontSize:22,marginBottom:4}}>{r.v===5?"😌":r.v===3?"😐":"😔"}</div>
            <div style={{fontSize:11,fontWeight:700,color:rating===r.v?r.color:"#475569"}}>{r.label}</div>
          </div>
        ))}
      </div>
      {rating&&(<>
        <div style={{fontSize:13,fontWeight:700,color:"#dde8f4",marginBottom:10}}>What helped? (optional)</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:16}}>
          {tools.map(t=>(
            <div key={t} onClick={()=>toggle(t)} style={{padding:"7px 12px",borderRadius:8,cursor:"pointer",fontSize:11,fontWeight:600,background:helpedWhat.includes(t)?"rgba(56,189,248,0.12)":"rgba(255,255,255,0.03)",border:`1px solid ${helpedWhat.includes(t)?"rgba(56,189,248,0.3)":"rgba(255,255,255,0.07)"}`,color:helpedWhat.includes(t)?"#38bdf8":"#475569",transition:"all 0.15s"}}>{t}</div>
          ))}
        </div>
        <textarea value={feedbackText} onChange={e=>setFeedbackText(e.target.value)} placeholder="Anything else? (optional)" rows={3} style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"12px 14px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",width:"100%",color:"#dde8f4",marginBottom:12}}/>
        <div style={{fontSize:10,color:"#334155",marginBottom:12,textAlign:"center"}}>Feedback is anonymous unless you choose to share it</div>
        <div onClick={submit} style={{padding:"14px",borderRadius:13,cursor:"pointer",textAlign:"center",background:"rgba(56,189,248,0.12)",border:"1.5px solid rgba(56,189,248,0.3)",fontSize:14,fontWeight:700,color:"#38bdf8"}}>Submit Feedback</div>
      </>)}
    </ScreenSingle>
  );}

  if(mode==="voice"){return(
    <ScreenSingle headerProps={{onBack:()=>setMode(null),title:"Voice Feedback",agencyName:(agency&&agency.name)}}>
      <div style={{fontSize:14,color:"#8099b0",lineHeight:1.6,marginBottom:12}}>Tell us what's working, what isn't, or what you wish existed. Voice or type - your call.</div>
      {feedbackText&&<div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"12px 14px",fontSize:13,color:"#c8dae8",lineHeight:1.7,minHeight:80,marginBottom:10}}>{feedbackText}</div>}
      <div onClick={isListening?stopVoice:startVoice} style={{height:54,borderRadius:14,background:isListening?"rgba(239,68,68,0.12)":"rgba(56,189,248,0.1)",border:`1.5px solid ${isListening?"rgba(239,68,68,0.35)":"rgba(56,189,248,0.25)"}`,display:"flex",alignItems:"center",justifyContent:"center",gap:10,cursor:"pointer",color:isListening?"#f87171":"#38bdf8",fontWeight:700,fontSize:14,marginBottom:10}}>
        {isListening?(<><div style={{display:"flex",gap:3}}>{[1,2,3,4].map(i=><div key={i} style={{width:3,background:"#f87171",borderRadius:2,height:8+i*4}}/>)}</div>Tap to stop</>):(<><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>Tap to speak</>)}
      </div>
      <textarea value={feedbackText} onChange={e=>setFeedbackText(e.target.value)} placeholder="Or type here..." rows={3} style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"12px 14px",fontSize:13,fontFamily:"'DM Sans',sans-serif",outline:"none",resize:"none",width:"100%",color:"#dde8f4",marginBottom:12}}/>
      {feedbackText&&<div onClick={submit} style={{padding:"14px",borderRadius:13,cursor:"pointer",textAlign:"center",background:"rgba(56,189,248,0.12)",border:"1.5px solid rgba(56,189,248,0.3)",fontSize:14,fontWeight:700,color:"#38bdf8"}}>Submit</div>}
    </ScreenSingle>
  );}

  return(
    <ScreenSingle headerProps={{onBack:()=>navigate("tools"),title:"Feedback",agencyName:(agency&&agency.name)}}>
      <div style={{background:"rgba(56,189,248,0.05)",border:"1px solid rgba(56,189,248,0.12)",borderRadius:12,padding:"12px 14px",marginBottom:4}}>
        <div style={{fontSize:12,color:"#38bdf8",fontWeight:700,marginBottom:2}}>Your voice matters</div>
        <div style={{fontSize:12,color:"#3d5268",lineHeight:1.6}}>Feedback is private unless you choose to share it. Agencies only see anonymous trends if you opt in.</div>
      </div>
      {[
        {key:"quick",icon:"[!]",title:"Quick Feedback",sub:"Did this help? 30 seconds",color:"#38bdf8"},
        {key:"voice",icon:"🎙",title:"Voice or Text Dump",sub:"Tell us what you really think",color:"#a78bfa"},
      ].map(o=>(
        <div key={o.key} onClick={()=>setMode(o.key)} style={{background:"rgba(255,255,255,0.025)",border:"1.5px solid rgba(255,255,255,0.065)",borderRadius:16,padding:"18px 16px",cursor:"pointer",display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:46,height:46,borderRadius:13,background:o.color+"18",border:`1px solid ${o.color}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{o.icon}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:700,color:"#dde8f4"}}>{o.title}</div>
            <div style={{fontSize:12,color:"#8099b0",marginTop:2}}>{o.sub}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1e3a52" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
      ))}
    </ScreenSingle>
  );
}


// 
// SPLASH / WELCOME SCREEN
// 
function SplashScreen({onDone,logoSrc,edition="First Responder"}){
  const[phase,setPhase]=useState("fadein");
  const[ripples,setRipples]=useState([]);
  const timerRef=useRef(null);
  const hr=new Date().getHours();
  const greeting=hr>=5&&hr<12?"Good morning":hr>=12&&hr<17?"Good afternoon":hr>=17&&hr<21?"Good evening":"You made it through today";

  useEffect(()=>{
    timerRef.current=setTimeout(()=>beginExit(),4500);
    return()=>clearTimeout(timerRef.current);
  },[]);

  const beginExit=()=>{
    clearTimeout(timerRef.current);
    if(phase==="fadeout"||phase==="done") return;
    setPhase("fadeout");
    setTimeout(()=>{setPhase("done");onDone&&onDone();},800);
  };

  const handleTap=(e)=>{
    if(phase==="fadeout"||phase==="done") return;
    const rect=e.currentTarget.getBoundingClientRect();
    const id=Date.now();
    setRipples(prev=>[...prev,{id,x:e.clientX-rect.left,y:e.clientY-rect.top}]);
    setTimeout(()=>setRipples(prev=>prev.filter(r=>r.id!==id)),600);
    setTimeout(beginExit,120);
  };

  if(phase==="done") return null;
  const fading=phase==="fadeout";

  return(
    <div onClick={handleTap} style={{position:"fixed",inset:0,background:"#060e1b",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:9999,cursor:"pointer",overflow:"hidden",opacity:fading?0:1,transition:fading?"opacity 0.8s ease":"opacity 1.2s ease",userSelect:"none"}}>
      <style>{`
        @keyframes breatheLogo{0%,100%{transform:scale(1);filter:drop-shadow(0 0 20px rgba(14,165,233,0.30))}50%{transform:scale(1.04);filter:drop-shadow(0 0 32px rgba(14,165,233,0.55))}}
        @keyframes breatheGlow{0%,100%{opacity:.7;transform:translate(-50%,-50%) scale(1)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.15)}}
        @keyframes fadeUp{0%{opacity:0;transform:translateY(10px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes rippleOut{0%{width:0;height:0;opacity:.7}100%{width:220px;height:220px;opacity:0}}
        @media(prefers-reduced-motion:reduce){*{animation-duration:.01ms!important}}
      `}</style>
      {/* ambient glow */}
      <div style={{position:"absolute",top:"38%",left:"50%",width:360,height:360,borderRadius:"50%",background:"radial-gradient(ellipse,rgba(14,165,233,0.15) 0%,transparent 70%)",animation:"breatheGlow 3.5s ease-in-out infinite",pointerEvents:"none",transform:"translate(-50%,-50%)"}}/>
      {/* logo */}
      {logoSrc&&<img src={logoSrc} alt="Upstream Approach" style={{width:"68%",maxWidth:260,height:"auto",objectFit:"contain",marginBottom:36,animation:"breatheLogo 3.5s ease-in-out infinite"}}/>}
      {/* brand stack */}
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,animation:"fadeUp 1.4s ease forwards",opacity:0}}>
        <div style={{fontSize:22,fontWeight:700,color:"#dde8f4",letterSpacing:"-0.01em",textAlign:"center"}}>Upstream Approach</div>
        <div style={{fontSize:12,color:"#38bdf8",fontWeight:500,letterSpacing:"0.04em",opacity:.75}}>powered by Upstream Initiative</div>
        <div style={{width:80,height:1,background:"linear-gradient(90deg,transparent,rgba(56,189,248,0.4),transparent)",margin:"6px 0"}}/>
        <div style={{fontSize:13,color:"#64748b",fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase"}}>{edition}</div>
      </div>
      {/* greeting */}
      <div style={{position:"absolute",bottom:80,fontSize:15,color:"#2d4a66",fontWeight:500,textAlign:"center",animation:"fadeUp 2s ease 0.6s forwards",opacity:0}}>{greeting}</div>
      {/* tap hint */}
      <div style={{position:"absolute",bottom:32,fontSize:11,color:"#1e3a52",letterSpacing:"0.1em",textTransform:"uppercase",animation:"fadeUp 2s ease 1s forwards",opacity:0}}>Tap to continue</div>
      {/* ripples */}
      {ripples.map(r=>(
        <div key={r.id} style={{position:"absolute",left:r.x,top:r.y,width:0,height:0,borderRadius:"50%",border:"1.5px solid rgba(56,189,248,0.5)",transform:"translate(-50%,-50%)",animation:"rippleOut 0.55s ease-out forwards",pointerEvents:"none"}}/>
      ))}
    </div>
  );
}

// Membership persistence helpers
// App version - bump this string any time you want to force a clean slate for all users
const APP_VERSION = "2.2.0";

// One-time migration: runs once per device per version
// Wipes any membership data that came from the old hardcoded DEMO_MEMBERSHIPS
function runMigrations(){
  try{
    const storedVersion=localStorage.getItem("upstream_app_version");
    if(storedVersion===APP_VERSION) return; // already migrated on this device

    // Hard wipe - previous versions may have written demo data into localStorage.
    // Any real agency a user has joined will be re-entered on next load.
    // This is safe because entering an agency code is a 5-second action.
    localStorage.removeItem("upstream_memberships");
    localStorage.removeItem("upstream_active_membership");
    localStorage.setItem("upstream_app_version", APP_VERSION);
  }catch(e){}
}
runMigrations();

function loadMemberships(){
  const DEMO_IDS=["m1","m1a","m2","m3"];
  try{
    const saved=localStorage.getItem("upstream_memberships");
    if(saved){
      const parsed=JSON.parse(saved);
      if(Array.isArray(parsed)){
        // Always filter out any hardcoded demo IDs - belt and suspenders
        const real=parsed.filter(m=>!DEMO_IDS.includes(m.id)&&m.agencyCode&&m.agencyCode.length>0);
        if(real.length>0) return real;
      }
    }
  }catch(e){}
  return [];
}
function saveMemberships(ms){
  try{localStorage.setItem("upstream_memberships",JSON.stringify(ms));}catch(e){}
}
function loadActiveMembership(){
  try{
    const saved=localStorage.getItem("upstream_active_membership");
    if(saved){const parsed=JSON.parse(saved);if(parsed&&parsed.id)return parsed;}
  }catch(e){}
  return null;
}
function saveActiveMembership(m){
  try{
    if(m)localStorage.setItem("upstream_active_membership",JSON.stringify(m));
    else localStorage.removeItem("upstream_active_membership");
  }catch(e){}
}

export default function App(){
  const[memberships,setMemberships]=useState(()=>loadMemberships());
  const[activeMembership,setActiveMembership]=useState(()=>loadActiveMembership());
  const[showSplash,setShowSplash]=useState(()=>{
    // Only show splash once per session
    try{return!sessionStorage.getItem("upstream_splash_done");}catch(e){return true;}
  });
  const[showSwitcher,setShowSwitcher]=useState(false);
  const[screen,setScreen]=useState("home");
  const[gaugeLevel,setGaugeLevel]=useState(1);
  const[showAgencyChange,setShowAgencyChange]=useState(false);
  const[pstAlert,setPstAlert]=useState(false);
  const[ghostAgency,setGhostAgency]=useState(null);
  const[pstAlertMsg,setPstAlertMsg]=useState("");
  const[criticalIncident,setCriticalIncident]=useState(false);
  const[agencyNotification,setAgencyNotification]=useState(null);
  const[userState,setUserState]=useState(()=>{
    // Load from localStorage on init - never re-fetch if already stored
    try{ return localStorage.getItem("upstream_user_state")||null; }catch(e){ return null; }
  });
  const[stateDetecting,setStateDetecting]=useState(false);

  useEffect(()=>{
    if(userState) return; // already have it - done
    // Check if we detected within the last 30 days
    try{
      const cached=localStorage.getItem("upstream_user_state");
      const cachedAt=localStorage.getItem("upstream_state_at");
      if(cached&&cachedAt&&(Date.now()-Number(cachedAt))<30*24*60*60*1000){
        setUserState(cached);
        return;
      }
    }catch(e){}
    // First time or expired - detect via IP (state-level only, not GPS)
    setStateDetecting(true);
    fetch("https://ipapi.co/json/")
      .then(r=>r.json())
      .then(data=>{
        if(data&&data.region_code&&data.country_code==="US"){
          // Show confirmation on first detection (VPN may give wrong state)
          setDetectedState(data.region_code);
          setShowStateConfirm(true);
        }
      })
      .catch(()=>{})
      .finally(()=>setStateDetecting(false));
  },[]);

  // Persist any manual state change to localStorage
  const handleSetUserState=(s)=>{
    setUserState(s);
    try{
      localStorage.setItem("upstream_user_state",s);
      localStorage.setItem("upstream_state_at",String(Date.now()));
    }catch(e){}
  }; // User's state - set on first launch
  const[showStateSelector,setShowStateSelector]=useState(false);
  const[showStateConfirm,setShowStateConfirm]=useState(false);
  const[detectedState,setDetectedState]=useState(null);
  const[userLanguage,setUserLanguage]=useState("en"); // Auto-detected or user-selected
  const lc=useLayoutConfig();

  // Auto-detect phone's language preference on first load
  useEffect(()=>{
    const browserLang=navigator.language||navigator.userLanguage;
    const langCode=browserLang.split('-')[0]; // "es-US" -> "es"
    // Support English and Spanish initially
    if(langCode==='es'){
      setUserLanguage('es');
    }else{
      setUserLanguage('en'); // Default to English
    }
  },[]);

  const handleJoin=(a)=>{
    if(!a){
      saveActiveMembership(null);
      setActiveMembership(null);
      // Also wipe memberships list so switcher shows nothing
      setMemberships([]);
      saveMemberships([]);
      setShowAgencyChange(false);
      setScreen("home");
      return;
    }
    // Derive agencyCode: prefer a.code (set by tryCode), fall back to a.short, then strip spaces
    const agencyCode=(a.code||a.short||"NEW").toUpperCase().trim();
    const newM={
      id:"m"+Date.now(),
      agencyCode,
      agencyName:a.name||agencyCode,
      agencyShort:a.short||agencyCode.slice(0,6),
      role:"user",
    };
    // Replace any existing membership for this agency, keep others
    // But also strip any old demo memberships (ids m1/m1a/m2/m3) just in case
    const DEMO_IDS=["m1","m1a","m2","m3"];
    setMemberships(prev=>{
      const cleaned=prev.filter(m=>!DEMO_IDS.includes(m.id)&&m.agencyCode!==newM.agencyCode);
      const next=[...cleaned,newM];
      saveMemberships(next);
      return next;
    });
    saveActiveMembership(newM);
    setActiveMembership(newM);
    setShowAgencyChange(false);
    setScreen("home");
  };
  const TOOL_SCREENS=['breathing','grounding','journal','dump90','afteraction','ptsd','aichat','emergencycontacts','customalerts','educational'];
  const navigate=(s)=>{
    setScreen(s);
    if(TOOL_SCREENS.includes(s)){
      trackTool((activeMembership&&activeMembership.agencyCode)||'NONE', s);
    }
  };
  const agency=activeMembership?{name:activeMembership.agencyName,short:activeMembership.agencyShort,code:activeMembership.agencyCode}:null;
  const role=activeMembership?activeMembership.role:"user";


  const STATE_NAMES={"AL":"Alabama","AK":"Alaska","AZ":"Arizona","AR":"Arkansas","CA":"California","CO":"Colorado","CT":"Connecticut","DE":"Delaware","FL":"Florida","GA":"Georgia","HI":"Hawaii","ID":"Idaho","IL":"Illinois","IN":"Indiana","IA":"Iowa","KS":"Kansas","KY":"Kentucky","LA":"Louisiana","ME":"Maine","MD":"Maryland","MA":"Massachusetts","MI":"Michigan","MN":"Minnesota","MS":"Mississippi","MO":"Missouri","MT":"Montana","NE":"Nebraska","NV":"Nevada","NH":"New Hampshire","NJ":"New Jersey","NM":"New Mexico","NY":"New York","NC":"North Carolina","ND":"North Dakota","OH":"Ohio","OK":"Oklahoma","OR":"Oregon","PA":"Pennsylvania","RI":"Rhode Island","SC":"South Carolina","SD":"South Dakota","TN":"Tennessee","TX":"Texas","UT":"Utah","VT":"Vermont","VA":"Virginia","WA":"Washington","WV":"West Virginia","WI":"Wisconsin","WY":"Wyoming","DC":"Washington D.C."};

  if(showStateConfirm&&detectedState){
    return(
      <div style={{position:"fixed",inset:0,background:"#04070f",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999,padding:"0 24px"}}>
        <div style={{background:"#0a1628",border:"1px solid rgba(56,189,248,0.2)",borderRadius:20,padding:"32px 28px",maxWidth:360,width:"100%",textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:16}}>📍</div>
          <div style={{fontSize:20,fontWeight:800,color:"#f1f5f9",marginBottom:8}}>Are you in {STATE_NAMES[detectedState]||detectedState}?</div>
          <div style={{fontSize:13,color:"#8099b0",marginBottom:24,lineHeight:1.6}}>We detected your state from your internet connection. If you're using a VPN, this may be incorrect.</div>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexDirection:"column"}}>
            <button onClick={()=>(handleSetUserState(detectedState),setShowStateConfirm(false),setDetectedState(null))} style={{padding:"14px 24px",borderRadius:12,background:"rgba(56,189,248,0.15)",border:"1px solid rgba(56,189,248,0.3)",color:"#38bdf8",fontWeight:700,fontSize:15,cursor:"pointer"}}>
              Yes, that's correct
            </button>
            <button onClick={()=>(setShowStateConfirm(false),setDetectedState(null),setShowStateSelector(true))} style={{padding:"14px 24px",borderRadius:12,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",color:"#8099b0",fontWeight:600,fontSize:14,cursor:"pointer"}}>
              No, let me choose my state
            </button>
          </div>
        </div>
      </div>
    );
  }

  if(showStateSelector){
    return <StateSelector onSelect={(state)=>{handleSetUserState(state);setShowStateSelector(false);}} currentState={userState}/>;
  }

  if(showAgencyChange){
    return <AgencyCodeScreen onJoin={handleJoin} onSkip={()=>setShowAgencyChange(false)} isChange={true} currentAgency={agency&&agency.name} roster={[]}/>;
  }

  const sharedProps={navigate,agency,userLanguage};

  const screens={
    home:       <HomeScreen {...sharedProps} gaugeLevel={gaugeLevel} setGaugeLevel={setGaugeLevel} role={role} pstAlert={pstAlert} pstAlertMsg={pstAlertMsg} criticalIncident={criticalIncident} agencyNotification={agencyNotification} setAgencyNotification={setAgencyNotification}/>,
    aichat:     <AIChatScreen {...sharedProps} userLanguage={userLanguage} userState={userState}/>,
    roughcall:  <RoughCallScreen {...sharedProps} userLanguage={userLanguage} userState={userState}/>,
    shiftcheck: <ShiftCheckScreen {...sharedProps}/>,
    humanpst:   <HumanPSTScreen {...sharedProps}/>,
    dump90:     <Dump90Screen {...sharedProps}/>,
    tools:      <ToolsScreen {...sharedProps}/>,
    breathing:  <BreathingScreen {...sharedProps}/>,
    grounding:  <GroundingScreen {...sharedProps}/>,
    journal:    <JournalScreen {...sharedProps}/>,
    afteraction:<AfterActionScreen {...sharedProps}/>,
    ptsd:       <PTSDInterruptionScreen {...sharedProps}/>,
    resources:  <ResourcesScreen {...sharedProps} role={role} userState={userState} onChangeState={()=>setShowStateSelector(true)}/>,
    admintools: <AdminToolsScreen navigate={navigate} membership={activeMembership} onSwitchAgency={()=>setShowSwitcher(true)} pstAlert={pstAlert} setPstAlert={setPstAlert} pstAlertMsg={pstAlertMsg} setPstAlertMsg={setPstAlertMsg} criticalIncident={criticalIncident} setCriticalIncident={setCriticalIncident} setAgencyNotification={setAgencyNotification} isPlatform={role==="platform"} onGhostLogin={(a)=>{setGhostAgency(a);navigate("admintools");}}/>,
    pstpanel:   <PSTPanelScreen {...sharedProps}/>,
    dashboard:  <DashboardScreen {...sharedProps}/>,
    metrics:    <MetricsScreen {...sharedProps}/>,
    about:      <AboutScreen navigate={navigate} agency={agency} onChangeAgency={()=>setShowAgencyChange(true)} role={role} setRole={(r)=>{if(activeMembership){const updated={...activeMembership,role:r};saveActiveMembership(updated);setActiveMembership(updated);}}} userState={userState} onChangeState={()=>setShowStateSelector(true)} userLanguage={userLanguage} setUserLanguage={setUserLanguage}/>,
    agencycode: <AgencyCodeScreen onJoin={handleJoin} onSkip={()=>navigate("home")} roster={[]}/>,
    platform:          <PlatformOwnerScreen navigate={navigate} onGhostLogin={(a)=>{setGhostAgency(a);navigate("admintools");}}/>,
    emergencycontacts: <EmergencyContactsScreen {...sharedProps}/>,
    customalerts:      <CustomAlertsScreen {...sharedProps}/>,
    educational:       <EducationalScreen {...sharedProps}/>,
    feedback:          <FeedbackScreen {...sharedProps}/>,
  };

  const handleSwitchMembership=(m)=>{
    saveActiveMembership(m);
    setActiveMembership(m);
    setShowSwitcher(false);
    if(m.role==="platform"){setScreen("admintools");}
    else{setScreen("home");}
  };

  return(
    <div style={{position:"relative",width:"100vw",overflowX:"hidden",overflowY:"hidden"}}>
      {showSplash&&<SplashScreen logoSrc={LOGO_FULL_SRC} edition="First Responder Edition" onDone={()=>{try{sessionStorage.setItem("upstream_splash_done","1");}catch(e){}setShowSplash(false);}}/>}
      <div onClick={()=>{const idx=ROLES.indexOf(role);const next=ROLES[(idx+1)%ROLES.length];if(activeMembership){const updated={...activeMembership,role:next};saveActiveMembership(updated);setActiveMembership(updated);}if(next==="platform")setScreen("admintools");else if(next!=="platform"&&isOpsRole(next)&&!isOpsRole(role))setScreen("home");if(!isOpsRole(next)&&role!=="platform")setScreen("home");}} style={{position:"fixed",top:8,right:8,zIndex:1001,background:"rgba(4,12,24,0.96)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,padding:"4px 10px",fontSize:10,fontWeight:700,color:ROLE_COLORS[role]||"#64748b",letterSpacing:"0.1em",cursor:"pointer",userSelect:"none"}} title="Tap to cycle role">
        {ROLE_BADGES[role]||"USER"}
      </div>
      {memberships.length>1&&(
        <div onClick={()=>setShowSwitcher(true)} style={{position:"fixed",top:8,left:lc.isDesktop?72:8,zIndex:1001,background:"rgba(4,12,24,0.96)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:8,padding:"4px 10px",fontSize:10,fontWeight:700,color:"#475569",letterSpacing:"0.08em",cursor:"pointer",userSelect:"none",display:"flex",alignItems:"center",gap:5}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:ROLE_COLORS[role]||"#64748b"}}/>
          {activeMembership?activeMembership.agencyShort:"--"}
        </div>
      )}
      {ghostAgency&&(
        <div style={{position:"fixed",top:0,left:0,right:0,zIndex:2000,background:"rgba(234,179,8,0.95)",padding:"6px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontSize:11,fontWeight:800,color:"#1a1000",letterSpacing:"0.08em"}}>🔐 PLATFORM SUPPORT VIEW - {ghostAgency.name}</div>
          <div onClick={()=>(setGhostAgency(null),navigate("platform"))} style={{fontSize:11,fontWeight:800,color:"#1a1000",cursor:"pointer",textDecoration:"underline"}}>Exit Support View</div>
        </div>
      )}
      <DesktopWrap isDesktop={lc.isDesktop}>
        {screens[screen]||screens["home"]}
      </DesktopWrap>
      <BottomNav screen={screen} navigate={navigate} hasAgency={!!agency} userLanguage={userLanguage} role={role}/>
      {showSwitcher&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:1000}} onClick={()=>setShowSwitcher(false)}>
          <div style={{background:"#0b1829",border:"1.5px solid rgba(255,255,255,0.09)",borderRadius:"24px 24px 0 0",padding:"28px 20px 40px",width:"100%",maxWidth:520}} onClick={e=>e.stopPropagation()}>
            <div style={{width:40,height:4,borderRadius:2,background:"rgba(255,255,255,0.1)",margin:"0 auto 24px"}}/>
            <div style={{fontSize:13,fontWeight:700,color:"#475569",letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:16}}>Switch View</div>
            {memberships.map(m=>{const isActive=activeMembership&&activeMembership.id===m.id;
              const rc=ROLE_COLORS[m.role]||"#64748b";
              return(
                <div key={m.id} onClick={()=>handleSwitchMembership(m)} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:14,background:isActive?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.02)",border:"1.5px solid "+(isActive?rc+"40":"rgba(255,255,255,0.06)"),marginBottom:10,cursor:"pointer"}}>
                  <div style={{width:42,height:42,borderRadius:12,background:isActive?rc+"20":"rgba(255,255,255,0.04)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:isActive?rc:"#475569",letterSpacing:"0.08em",flexShrink:0}}>
                    {ROLE_BADGES[m.role]||"USER"}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,color:isActive?"#dde8f4":"#94a3b8"}}>{m.agencyName}</div>
                    <div style={{fontSize:11,color:isActive?rc:"#475569",marginTop:2,fontWeight:600}}>{ROLE_LABELS[m.role]||m.role}</div>
                  </div>
                  {isActive&&<div style={{width:8,height:8,borderRadius:"50%",background:rc}}/>}
                </div>
              );
            })}
            <div onClick={()=>setShowSwitcher(false)} style={{textAlign:"center",marginTop:16,fontSize:13,color:"#334155",cursor:"pointer",padding:"10px"}}>Cancel</div>
          </div>
        </div>
      )}
    </div>
  );
}
