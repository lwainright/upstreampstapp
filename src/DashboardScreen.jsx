// ============================================================
// SCREEN: DashboardScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { AppHeader, Screen, ScreenSingle, Btn, Card, SLabel, DragList, NavBtn, DesktopWrap, HomeTile, ToolCard } from './ui.jsx';
import { BoltIcon, ClockIcon, BreathIcon, HeartIcon, GaugeIcon, HomeIcon, InfoIcon, MapIcon, UserIcon, ToolsIcon, GroundIcon, JournalIcon, ResetIcon, LockIcon, BuildingIcon, TimerIcon, SettingsIcon, ShieldIcon } from './icons.jsx';
import { trackCheckin, trackTool, trackAISession, trackPSTContact, AW_ENDPOINT, AW_PROJECT, AW_DB } from './analytics.js';
import { useLayoutConfig, getContractStatus, getCodeStatus, getContractBanner, detectSpiritual, detectLevel } from './utils.js';

export default function DashboardScreen({navigate,agency}){
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


