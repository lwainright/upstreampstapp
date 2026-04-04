// ============================================================
// SCREEN: PlatformOwnerScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { AppHeader, Screen, ScreenSingle, Btn, Card, SLabel, DragList, NavBtn, DesktopWrap, HomeTile, ToolCard } from './ui.jsx';
import { BoltIcon, ClockIcon, BreathIcon, HeartIcon, GaugeIcon, HomeIcon, InfoIcon, MapIcon, UserIcon, ToolsIcon, GroundIcon, JournalIcon, ResetIcon, LockIcon, BuildingIcon, TimerIcon, SettingsIcon, ShieldIcon } from './icons.jsx';
import { trackCheckin, trackTool, trackAISession, trackPSTContact, AW_ENDPOINT, AW_PROJECT, AW_DB } from './analytics.js';
import { useLayoutConfig, getContractStatus, getCodeStatus, getContractBanner, detectSpiritual, detectLevel } from './utils.js';

export default function PlatformOwnerScreen({navigate,onGhostLogin}){
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


