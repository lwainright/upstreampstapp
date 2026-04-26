// ============================================================
// SCREEN: ToolsScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { AppHeader, Screen, ScreenSingle, Btn, Card, SLabel, DragList, NavBtn, DesktopWrap, HomeTile, ToolCard } from './ui.jsx';
import { BoltIcon, ClockIcon, BreathIcon, HeartIcon, GaugeIcon, HomeIcon, InfoIcon, MapIcon, UserIcon, ToolsIcon, GroundIcon, JournalIcon, ResetIcon, LockIcon, BuildingIcon, TimerIcon, SettingsIcon, ShieldIcon } from './icons.jsx';
import { trackCheckin, trackTool, trackAISession, trackPSTContact, AW_ENDPOINT, AW_PROJECT, AW_DB } from './analytics.js';
import { useLayoutConfig, getContractStatus, getCodeStatus, getContractBanner, detectSpiritual, detectLevel } from './utils.js';

export default function ToolsScreen({navigate,agency}){
  const lc=useLayoutConfig();
  const tools=[
    {icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
     label:"HRV Check",         sub:"Heart rate variability · body readiness", color:"#f87171",bg:"rgba(248,113,113,0.08)",dest:"hrv"},
    {icon:<BreathIcon/>,  label:"Box Breathing",       sub:"4-4-4-4 animated reset",         color:"#22c55e",bg:"rgba(34,197,94,0.09)",   dest:"breathing"},
    {icon:<GroundIcon/>,  label:"5-4-3-2-1 Grounding", sub:"Sensory awareness technique",     color:"#38bdf8",bg:"rgba(56,189,248,0.08)",  dest:"grounding"},
    {icon:<JournalIcon/>, label:"Journal",              sub:"Text or voice, private",           color:"#a78bfa",bg:"rgba(167,139,250,0.08)", dest:"journal"},
    {icon:<ResetIcon/>,   label:"After-Action Reset",   sub:"Structured decompression",         color:"#f97316",bg:"rgba(249,115,22,0.08)",  dest:"afteraction"},
    {icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.65A2 2 0 012.18 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.15A16 16 0 0015.54 16.78l1.41-1.41a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>,
     label:"Emergency Contacts", sub:"Your personal safety net",  color:"#ef4444",bg:"rgba(239,68,68,0.08)",dest:"emergencycontacts"},
    {icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
     label:"Personal Alerts",    sub:"Self-check reminders",       color:"#eab308",bg:"rgba(234,179,8,0.08)",dest:"customalerts"},
    {icon:<span style={{fontSize:18}}>🏫</span>,
     label:"School Staff",       sub:"Teachers · Admin · Counselors · Support",      color:"#38bdf8",bg:"rgba(56,189,248,0.08)",dest:"school"},
    {icon:<span style={{fontSize:18}}>🏥</span>,
     label:"Hospital Staff",      sub:"ED · ICU · Palliative · EVS · All areas",       color:"#38bdf8",bg:"rgba(56,189,248,0.08)",dest:"hospital"},
    {icon:<span style={{fontSize:18}}>🌙</span>,
     label:"Sleep & Fatigue",      sub:"Shift work sleep disorder tools",              color:"#6366f1",bg:"rgba(99,102,241,0.08)",dest:"sleep"},
    {icon:<span style={{fontSize:18}}>🕯</span>,
     label:"Grief & Loss",         sub:"Line of duty death · Colleague loss",          color:"#475569",bg:"rgba(71,85,105,0.08)",dest:"grief"},
    {icon:<span style={{fontSize:18}}>👔</span>,
     label:"Supervisor Wellness",  sub:"Tools for leaders carrying the team",          color:"#ef4444",bg:"rgba(239,68,68,0.08)",dest:"supervisor"},
    {icon:<span style={{fontSize:18}}>🏛</span>,
     label:"Civilian Workforce",   sub:"Government · Admin · Facilities · Courts",     color:"#38bdf8",bg:"rgba(56,189,248,0.08)",dest:"civilianworkforce"},
    {icon:<span style={{fontSize:18}}>⚠️</span>,
     label:"High Acuity",        sub:"After a case that stays with you",         color:"#ef4444",bg:"rgba(239,68,68,0.08)",dest:"highacuity"},
    {icon:<span style={{fontSize:18}}>🏛</span>,
     label:"Human Services",     sub:"DSS · CPS · APS worker wellness",          color:"#38bdf8",bg:"rgba(56,189,248,0.08)",dest:"humanservices"},
    {icon:<span style={{fontSize:18}}>🔗</span>,
     label:"Family Connect",    sub:"Private session chat with family",    color:"#a78bfa",bg:"rgba(167,139,250,0.08)",dest:"familyconnect"},
    {icon:<span style={{fontSize:18}}>📡</span>,
     label:"Telecommunications & Comm Centers",  sub:"Dispatchers, comm centers, 911 professionals & more", color:"#38bdf8",bg:"rgba(56,189,248,0.08)",dest:"telecommunications"},
    {icon:<span style={{fontSize:18}}>🏅</span>,
     label:"Retirees",           sub:"Retired FR, veterans & public safety",        color:"#94a3b8",bg:"rgba(100,116,139,0.08)",dest:"retirees"},
    {icon:<span style={{fontSize:18}}>🎖</span>,
     label:"Veterans",           sub:"Resources, education & tools",      color:"#a78bfa",bg:"rgba(167,139,250,0.08)",dest:"veterans"},
    {icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
     label:"Learn",              sub:"Stigma-free modules",         color:"#64748b",bg:"rgba(100,116,139,0.08)",dest:"educational"},
    {icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
     label:"Feedback",           sub:"Help improve this app",       color:"#38bdf8",bg:"rgba(56,189,248,0.07)",dest:"feedback"},
  ];
  return(
    <Screen headerProps={{onBack:()=>navigate("home"),agencyName:agency&&agency.name}}>
      <div className="full-width" style={{fontSize:13,color:"#8099b0",lineHeight:1.6}}>Tools you can use anytime — during a shift, after a rough call, or at home.</div>
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
