// ============================================================
// UTILS & HOOKS — Upstream Initiative
// Layout hooks, contract helpers, text detection
// ============================================================
import { useState, useEffect } from 'react';

// 1. Helper to get the current layout string
function getLayout() {
  if (typeof window === 'undefined') return "desktop";
  const w = window.innerWidth;
  if (w >= 1024) return "desktop";
  if (w >= 768) return "tablet";
  return "mobile";
}

// 2. Hook to listen to window resizes
export function useLayout() {
  const [layout, setLayout] = useState(() => getLayout());

  useEffect(() => {
    const handleResize = () => setLayout(getLayout());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return layout;
}

// 3. Layout config per breakpoint
export function useLayoutConfig() {
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
export function getContractStatus(agency){
  if(!agency) return "none";
  const now=new Date();
  if(now < new Date(agency.contractExpiry)) return "active";
  if(now < new Date(agency.graceExpiry))    return "grace";
  return "purged";
}
export function getCodeStatus(agency){
  if(!agency) return "none";
  const now=new Date();
  const exp=new Date(agency.codeExpiry);
  if(now > exp) return agency.successorCode ? "expired" : "expired_no_successor";
  if(exp < new Date(now.getTime()+30*24*60*60*1000)) return "rotating";
  return "valid";
}
export function getDaysUntil(dateStr){ return Math.ceil((new Date(dateStr)-new Date())/(1000*60*60*24)); }
export function getDaysUntilPurge(agency){ return getDaysUntil(agency.graceExpiry); }

export function getContractBanner(agencyCode){
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
export function detectSpiritual(text){
  const lower=text.toLowerCase();
  return SPIRITUAL_KEYWORDS.some(kw=>lower.includes(kw));
}

export function detectLevel(text) {
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
