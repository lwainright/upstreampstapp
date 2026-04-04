// ============================================================
// SCREEN: PTSDInterruptionScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { AppHeader, Screen, ScreenSingle, Btn, Card, SLabel, DragList, NavBtn, DesktopWrap, HomeTile, ToolCard } from '../ui.jsx';
import { BoltIcon, ClockIcon, BreathIcon, HeartIcon, GaugeIcon, HomeIcon, InfoIcon, MapIcon, UserIcon, ToolsIcon, GroundIcon, JournalIcon, ResetIcon, LockIcon, BuildingIcon, TimerIcon, SettingsIcon, ShieldIcon } from '../icons.jsx';
import { trackCheckin, trackTool, trackAISession, trackPSTContact, AW_ENDPOINT, AW_PROJECT, AW_DB } from '../analytics.js';
import { useLayoutConfig, getContractStatus, getCodeStatus, getContractBanner, detectSpiritual, detectLevel } from '../utils.js';

export default function PTSDInterruptionScreen({navigate,agency}){
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
            {step<currentTool.steps.length-1?"Next Step →":"Complete ✓"}
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
// ── MASTER LOGIN ─────────────────────────────────────────────────────────────
const MASTER_PIN = "2727"; // change this to whatever PIN you want


