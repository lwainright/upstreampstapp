// ============================================================
// SCREEN: EmergencyContactsScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { AppHeader, Screen, ScreenSingle, Btn, Card, SLabel, DragList, NavBtn, DesktopWrap, HomeTile, ToolCard } from '../ui.jsx';
import { BoltIcon, ClockIcon, BreathIcon, HeartIcon, GaugeIcon, HomeIcon, InfoIcon, MapIcon, UserIcon, ToolsIcon, GroundIcon, JournalIcon, ResetIcon, LockIcon, BuildingIcon, TimerIcon, SettingsIcon, ShieldIcon } from '../icons.jsx';
import { trackCheckin, trackTool, trackAISession, trackPSTContact, AW_ENDPOINT, AW_PROJECT, AW_DB } from '../analytics.js';
import { useLayoutConfig, getContractStatus, getCodeStatus, getContractBanner, detectSpiritual, detectLevel } from '../utils.js';

export default function EmergencyContactsScreen({navigate,agency}){
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

