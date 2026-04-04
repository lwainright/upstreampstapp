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

export default function ResourcesScreen({navigate,agency,role,userState,onChangeState}){
  const[tab,setTab]=useState("crisis");
  const[zip,setZip]=useState(()=>{try{return localStorage.getItem('upstream_zip')||'';}catch(e){return '';}});
  const[zipResults,setZipResults]=useState(null);
  const[zipLoading,setZipLoading]=useState(false);
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

  const handleZipSearch=async()=>{
    if(!zip||zip.length!==5) return;
    try{localStorage.setItem('upstream_zip',zip);}catch(e){}
    setZipLoading(true);
    const results=await fetchResources({
      zip,
      state: selectedState,
      appType: 'first_responder',
      isVeteran: false,
    });
    setZipResults(results);
    setZipLoading(false);
  };
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

