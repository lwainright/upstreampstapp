// ============================================================
// SCREEN: MetricsScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { AppHeader, Screen, ScreenSingle, Btn, Card, SLabel, DragList, NavBtn, DesktopWrap, HomeTile, ToolCard } from '../ui.jsx';
import { BoltIcon, ClockIcon, BreathIcon, HeartIcon, GaugeIcon, HomeIcon, InfoIcon, MapIcon, UserIcon, ToolsIcon, GroundIcon, JournalIcon, ResetIcon, LockIcon, BuildingIcon, TimerIcon, SettingsIcon, ShieldIcon } from '../icons.jsx';
import { trackCheckin, trackTool, trackAISession, trackPSTContact, AW_ENDPOINT, AW_PROJECT, AW_DB } from '../analytics.js';
import { useLayoutConfig, getContractStatus, getCodeStatus, getContractBanner, detectSpiritual, detectLevel } from '../utils.js';

export default function MetricsScreen({navigate,agency}){
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


