// ============================================================
// UI COMPONENTS — Upstream Initiative
// Shared layout components used across all screens
// ============================================================
import React, { useState, useRef, createContext, useContext } from 'react';
import { useLayoutConfig } from './utils.js';
import { LockIcon, HomeIcon, BoltIcon, HeartIcon, ToolsIcon, MapIcon, UserIcon, SettingsIcon } from './icons.jsx';

const FALLBACK_LOGO = "/icons/logo.png";

export const LogoContext = createContext("");
export function LogoProvider({ src, children }) {
  return <LogoContext.Provider value={src}>{children}</LogoContext.Provider>;
}

const t = (key, lang) => {
  const dict = {
    en: { home: "Home", aiPST: "AI PST", pstTeam: "PST Team", tools: "Tools", about: "About" }
  };
  return dict[lang]?.[key] || key;
};

function LogoImg({ src, style }) {
  const [errored, setErrored] = useState(false);
  const logoSrc = errored ? FALLBACK_LOGO : (src || FALLBACK_LOGO);
  return (
    <img
      src={logoSrc}
      alt="Upstream Approach"
      onError={() => setErrored(true)}
      style={style}
    />
  );
}

export function AppHeader({ onBack, title, agencyName, agencyLogoSrc, lc, logoSrc: logoSrcProp }) {
  const logoSrcCtx = useContext(LogoContext);
  const logoSrc = logoSrcProp || logoSrcCtx || "";
  const isSubScreen = !!onBack;

  if (isSubScreen) {
    return (
      <div style={{
        width: "100%",
        background: "linear-gradient(180deg,#0a1628 0%,rgba(10,22,40,0.97) 100%)",
        borderBottom: "1px solid rgba(56,189,248,0.1)",
        backdropFilter: "blur(14px)",
        paddingTop: lc.headerPT,
        paddingBottom: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          width: "100%",
          maxWidth: lc.maxW,
          padding: `14px ${lc.isDesktop ? 40 : 16}px 0`,
          display: "flex",
          alignItems: "center",
          minHeight: 48,
        }}>
          <div onClick={onBack} style={{
            cursor: "pointer", color: "#38bdf8",
            display: "flex", alignItems: "center", gap: 6,
            fontSize: lc.isDesktop ? 15 : 14, fontWeight: 800,
            background: "rgba(56,189,248,0.12)",
            border: "1.5px solid rgba(56,189,248,0.35)",
            borderRadius: 12,
            padding: "9px 18px",
            letterSpacing: "0.02em",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Back
          </div>
        </div>

        {logoSrc && (
          <div style={{ width: "100%", display: "flex", justifyContent: "center", padding: "4px 24px 2px" }}>
            <LogoImg
              src={logoSrc}
              style={{ width: "80%", maxWidth: 320, height: "auto", objectFit: "contain" }}
            />
          </div>
        )}

        <div style={{ marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          {agencyLogoSrc && (
            <img src={agencyLogoSrc} alt={agencyName} style={{ height: 28, width: "auto", maxWidth: 100, objectFit: "contain" }} onError={e => e.target.style.display="none"}/>
          )}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 16, height: 1, background: "#38bdf8", opacity: 0.4 }}/>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#4d7a99", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                Powered by {agencyName || "Upstream Initiative"}
              </span>
              <div style={{ width: 16, height: 1, background: "#38bdf8", opacity: 0.4 }}/>
            </div>
          </div>
          {agencyLogoSrc && (
            <img src={agencyLogoSrc} alt={agencyName} style={{ height: 32, width: "auto", maxWidth: 120, objectFit: "contain" }} onError={e => e.target.style.display='none'}/>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: "100%",
      background: "linear-gradient(180deg,#0a1628 0%,rgba(10,22,40,0.97) 100%)",
      borderBottom: "1px solid rgba(56,189,248,0.1)",
      backdropFilter: "blur(14px)",
      paddingTop: lc.headerPT,
      paddingBottom: 10,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      position: "sticky",
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ width: "100%", maxWidth: lc.maxW, padding: `0 ${lc.isDesktop ? 40 : 24}px`, display: "flex", justifyContent: "center" }}>
        {logoSrc && (
          <LogoImg
            src={logoSrc}
            style={{ width: "80%", maxWidth: 320, height: "auto", objectFit: "contain" }}
          />
        )}
      </div>
      {title && (
        <div style={{ fontSize: lc.isDesktop ? 12 : 11, color: "#38bdf8", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 6 }}>
          {title}
        </div>
      )}
      <div style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        {agencyLogoSrc && (
          <img src={agencyLogoSrc} alt={agencyName} style={{ height: 28, width: "auto", maxWidth: 100, objectFit: "contain" }} onError={e => e.target.style.display='none'}/>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 16, height: 1, background: "#38bdf8", opacity: 0.3 }}/>
          <span style={{ fontSize: 10, fontWeight: 700, color: "#4d7a99", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Powered by {agencyName || "Upstream Initiative"}
          </span>
          <div style={{ width: 16, height: 1, background: "#38bdf8", opacity: 0.3 }}/>
        </div>
        {agencyLogoSrc && (
          <img src={agencyLogoSrc} alt={agencyName} style={{ height: 28, width: "auto", maxWidth: 100, objectFit: "contain" }} onError={e => e.target.style.display='none'}/>
        )}
      </div>
    </div>
  );
}

export function Screen({ children, headerProps }) {
  const lc = useLayoutConfig();
  return (
    <div style={{height:"100vh",background:"linear-gradient(160deg,#060e1b 0%,#0b1829 55%,#07101e 100%)",fontFamily:"'DM Sans',sans-serif",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden",overscrollBehavior:"contain"}}>
      <div style={{position:"fixed",top:-100,left:"50%",transform:"translateX(-50%)",width:800,height:400,background:"radial-gradient(ellipse,rgba(8,70,160,0.18) 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"fixed",inset:0,opacity:0.02,pointerEvents:"none",backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 40px,#fff 40px,#fff 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,#fff 40px,#fff 41px)"}}/>
      <AppHeader {...headerProps} lc={lc}/>
      {lc.isDesktop ? (
        <div style={{width:"100%",maxWidth:lc.maxW,padding:lc.contentPad,display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,alignItems:"start",overflowY:"auto",flex:1,paddingBottom:20}}>
          {children}
        </div>
      ) : (
        <div style={{width:"100%",maxWidth:lc.maxW,padding:lc.contentPad,paddingBottom:80,display:"flex",flexDirection:"column",gap:lc.gap,overflowY:"auto",overflowX:"hidden",flex:1,overscrollBehavior:"contain"}}>
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
        ::-webkit-scrollbar{width:12px;height:12px;}
        ::-webkit-scrollbar-track{background:rgba(6,14,27,0.5);border-radius:10px;}
        ::-webkit-scrollbar-thumb{background:rgba(56,189,248,0.2);border-radius:10px;border:2px solid rgba(6,14,27,0.5);}
        ::-webkit-scrollbar-thumb:hover{background:rgba(56,189,248,0.3);}
        *{scrollbar-width:thin;scrollbar-color:rgba(56,189,248,0.2) rgba(6,14,27,0.5);}
      `}</style>
    </div>
  );
}

export function ScreenSingle({ children, headerProps }) {
  const lc = useLayoutConfig();
  return (
    <div style={{height:"100vh",background:"linear-gradient(160deg,#060e1b 0%,#0b1829 55%,#07101e 100%)",fontFamily:"'DM Sans',sans-serif",display:"flex",flexDirection:"column",alignItems:"center",position:"relative",overflow:"hidden",zIndex:1,overscrollBehavior:"contain"}}>
      <div style={{position:"fixed",top:-100,left:"50%",transform:"translateX(-50%)",width:800,height:400,background:"radial-gradient(ellipse,rgba(8,70,160,0.18) 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"fixed",inset:0,opacity:0.02,pointerEvents:"none",backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 40px,#fff 40px,#fff 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,#fff 40px,#fff 41px)"}}/>
      <AppHeader {...headerProps} lc={lc}/>
      <div style={{width:"100%",maxWidth:Math.min(lc.maxW,560),padding:lc.contentPad,display:"flex",flexDirection:"column",gap:lc.gap,overflowY:"auto",overflowX:"hidden",flex:1,paddingBottom:lc.isDesktop?20:90,overscrollBehavior:"contain"}}>
        {children}
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        html,body{overflow:hidden;width:100%;height:100%;background:#060e1b;margin:0;padding:0;}
        *{box-sizing:border-box;margin:0;padding:0;}
        textarea,input{color:#dde8f4!important;}
        input::placeholder,textarea::placeholder{color:#2d4a66!important;}
        ::-webkit-scrollbar{width:12px;height:12px;}
        ::-webkit-scrollbar-track{background:rgba(6,14,27,0.5);border-radius:10px;}
        ::-webkit-scrollbar-thumb{background:rgba(56,189,248,0.2);border-radius:10px;border:2px solid rgba(6,14,27,0.5);}
        ::-webkit-scrollbar-thumb:hover{background:rgba(56,189,248,0.3);}
        *{scrollbar-width:thin;scrollbar-color:rgba(56,189,248,0.2) rgba(6,14,27,0.5);}
      `}</style>
    </div>
  );
}

export function Btn({children,color="#38bdf8",bg,onClick,style={},disabled=false}){
  const[p,setP]=useState(false);
  return <div onClick={disabled?null:onClick} onMouseDown={()=>!disabled&&setP(true)} onMouseUp={()=>setP(false)} onMouseLeave={()=>setP(false)} style={{background:bg||"rgba(56,189,248,0.1)",border:`1.5px solid ${color}${disabled?"20":"40"}`,borderRadius:14,padding:"14px 18px",cursor:disabled?"not-allowed":"pointer",textAlign:"center",fontSize:14,fontWeight:700,color:disabled?color+"55":color,transform:p?"scale(0.97)":"scale(1)",transition:"all 0.13s",opacity:disabled?0.5:1,...style}}>{children}</div>;
}

export function Card({children,style={},className="",onClick}){return <div onClick={onClick} className={className} style={{background:"rgba(255,255,255,0.033)",border:"1.5px solid rgba(255,255,255,0.065)",borderRadius:18,padding:"18px 16px",cursor:onClick?"pointer":"default",...style}}>{children}</div>;}

export function SLabel({children,color="#38bdf8"}){return <div style={{fontSize:11,color,fontWeight:700,letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:6}}>{children}</div>;}

export function DragList({items,onReorder,renderItem,keyFn}){
  const[dragIdx,setDragIdx]=useState(null);
  const[overIdx,setOverIdx]=useState(null);
  const handleDragStart=(e,i)=>{setDragIdx(i);e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",String(i));};
  const handleDragOver=(e,i)=>{e.preventDefault();e.dataTransfer.dropEffect="move";if(i!==overIdx)setOverIdx(i);};
  const handleDrop=(e,i)=>{e.preventDefault();if(dragIdx===null||dragIdx===i){setDragIdx(null);setOverIdx(null);return;}const next=[...items];const[moved]=next.splice(dragIdx,1);next.splice(i,0,moved);onReorder(next);setDragIdx(null);setOverIdx(null);};
  const handleDragEnd=()=>{setDragIdx(null);setOverIdx(null);};
  const touchStart=useRef(null);
  const handleTouchStart=(e,i)=>{touchStart.current={idx:i,y:e.touches[0].clientY};setDragIdx(i);};
  const handleTouchMove=(e)=>{if(touchStart.current===null)return;const y=e.touches[0].clientY;const els=e.currentTarget.parentNode.children;let over=touchStart.current.idx;for(let j=0;j<els.length;j++){const r=els[j].getBoundingClientRect();if(y>=r.top&&y<=r.bottom){over=j;break;}}setOverIdx(over);};
  const handleTouchEnd=(e)=>{if(touchStart.current===null||overIdx===null){setDragIdx(null);setOverIdx(null);touchStart.current=null;return;}const from=touchStart.current.idx;const to=overIdx;if(from!==to){const next=[...items];const[moved]=next.splice(from,1);next.splice(to,0,moved);onReorder(next);}setDragIdx(null);setOverIdx(null);touchStart.current=null;};
  return(
    <div>
      {items.map((item,i)=>(
        <div key={keyFn?keyFn(item):i} draggable onDragStart={e=>handleDragStart(e,i)} onDragOver={e=>handleDragOver(e,i)} onDrop={e=>handleDrop(e,i)} onDragEnd={handleDragEnd} onTouchStart={e=>handleTouchStart(e,i)} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} style={{opacity:dragIdx===i?0.4:1,transform:overIdx===i&&dragIdx!==i?"translateY(-2px)":"none",borderTop:overIdx===i&&dragIdx!==null&&dragIdx!==i?"2px solid #38bdf8":"2px solid transparent",transition:"transform 0.15s, opacity 0.15s, border-color 0.1s",cursor:"grab"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{color:"#334155",fontSize:16,flexShrink:0,cursor:"grab",padding:"0 4px",userSelect:"none"}}>:::</div>
            <div style={{flex:1}}>{renderItem(item,i)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function NavBtn({icon,label,sub,color,bg,onClick,style={},disabled=false,locked=false}){
  const[p,setP]=useState(false);
  const lc=useLayoutConfig();
  const fs=lc.isDesktop?16:13;
  return(
    <div onMouseDown={()=>setP(true)} onMouseUp={()=>setP(false)} onMouseLeave={()=>setP(false)} onClick={onClick} style={{background:p&&!locked?bg:"rgba(255,255,255,0.033)",border:`1.5px solid ${locked?"rgba(255,255,255,0.04)":p?color+"55":"rgba(255,255,255,0.065)"}`,borderRadius:lc.cardRadius,padding:`${lc.isDesktop?20:17}px 20px`,cursor:"pointer",display:"flex",alignItems:"flex-start",flexDirection:"row",gap:15,transition:"all 0.13s",transform:p&&!locked?"scale(0.98)":"scale(1)",position:"relative",overflow:"hidden",userSelect:"none",opacity:locked?0.55:1,...style}}>
      <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,borderRadius:"18px 0 0 18px",background:locked?"#1e3a52":color,opacity:locked?1:p?1:0.55}}/>
      <div style={{width:46,height:46,borderRadius:14,background:locked?"rgba(255,255,255,0.04)":bg,border:`1px solid ${locked?"rgba(255,255,255,0.06)":color+"25"}`,display:"flex",alignItems:"center",justifyContent:"center",color:locked?"#2d4a66":color,flexShrink:0}}>{locked?<LockIcon/>:icon}</div>
      <div style={{flex:1}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <span style={{fontSize:fs,fontWeight:700,color:locked?"#2d4a66":"#dde8f4",lineHeight:1.3}}>{label}</span>
          {locked&&<span style={{fontSize:9,fontWeight:800,letterSpacing:"0.1em",color:"#1e3a52",background:"rgba(255,255,255,0.04)",padding:"2px 7px",borderRadius:6,textTransform:"uppercase"}}>AGENCY ONLY</span>}
        </div>
        <div style={{fontSize:12,color:locked?"#1e3a52":"#8099b0",marginTop:4,lineHeight:1.5}}>{locked?"Enter agency code to unlock":sub}</div>
      </div>
      <div style={{color:"#1e3a52",alignSelf:"center"}}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg></div>
    </div>
  );
}

export function CrewBar(){
  const segs=[{pct:48,color:"#22c55e",label:"Great"},{pct:28,color:"#eab308",label:"Striving"},{pct:16,color:"#f97316",label:"Not Well"},{pct:8,color:"#ef4444",label:"Ill"}];
  return(<div><div style={{display:"flex",height:8,borderRadius:8,overflow:"hidden",gap:2}}>{segs.map((s,i)=><div key={i} style={{width:`${s.pct}%`,background:s.color,borderRadius:8}}/>)}</div><div style={{display:"flex",gap:14,marginTop:9,flexWrap:"wrap"}}>{segs.map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:6,height:6,borderRadius:"50%",background:s.color}}/><span style={{fontSize:10,color:"#8099b0"}}>{s.pct}% {s.label}</span></div>)}</div></div>);
}

export function BottomNav({screen,navigate,hasAgency,userLanguage="en",role="user"}){
  const lc=useLayoutConfig();
  const isOps=role==="supervisor"||role==="admin"||role==="platform";
  const tabs=[
    {key:"home",       label:t("home",userLanguage),    icon:<HomeIcon/>},
    {key:"aichat",     label:t("aiPST",userLanguage),   icon:<BoltIcon/>},
    {key:"admintools", label:"Dashboard",               icon:<SettingsIcon/>, opsOnly:true},
    {key:"humanpst",   label:t("pstTeam",userLanguage), icon:<HeartIcon/>,    userOnly:true},
    {key:"tools",      label:t("tools",userLanguage),   icon:<ToolsIcon/>},
    {key:"resources",  label:"Resources",               icon:<MapIcon/>,      opsOnly:true},
    {key:"about",      label:t("about",userLanguage),   icon:<UserIcon/>,     userOnly:true},
  ].filter(tab=>isOps?!tab.userOnly:!tab.opsOnly);
  const topLevel=["home","aichat","humanpst","tools","about","admintools","resources"];
  const active=topLevel.includes(screen)?screen:screen==="admintools"?"admintools":"home";
  if(lc.isDesktop){
    return(
      <div style={{position:"fixed",top:0,left:0,bottom:0,width:64,background:"#060e1b",borderRight:"1px solid rgba(255,255,255,0.06)",display:"flex",flexDirection:"column",alignItems:"center",paddingTop:140,gap:6,zIndex:200}}>
        {tabs.map(tab=>(
          <div key={tab.key} onClick={()=>navigate(tab.key)} title={tab.label} style={{width:44,height:44,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",background:(active===tab.key||screen===tab.key)?"rgba(56,189,248,0.15)":"transparent",border:"1px solid "+((active===tab.key||screen===tab.key)?"rgba(56,189,248,0.3)":"transparent"),color:(active===tab.key||screen===tab.key)?"#38bdf8":(tab.key==="humanpst"&&!hasAgency)?"#2d4a66":"#8099b0",transition:"all 0.2s",position:"relative"}}>
            {(tab.key==="humanpst"&&!hasAgency)?<LockIcon/>:tab.icon}
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
        </div>
      ))}
    </div>
  );
}

export function DesktopWrap({children,isDesktop}){
  if(!isDesktop) return children;
  return <div style={{marginLeft:64,width:"calc(100vw - 64px)",overflowX:"hidden"}}>{children}</div>;
}

export function StateSelector({onSelect,currentState}){
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
  const currentStateName=currentState?states.find(s=>s.code===currentState)?.name:'';
  return(
    <ScreenSingle headerProps={{onBack:currentState?()=>onSelect(currentState):null,title:currentState?"Change State":"Welcome"}}>
      {!currentState&&(<div style={{background:"rgba(56,189,248,0.06)",border:"1px solid rgba(56,189,248,0.15)",borderRadius:14,padding:"16px 18px"}}><div style={{fontSize:14,fontWeight:700,color:"#38bdf8",marginBottom:6}}>👋 Welcome to Upstream</div><div style={{fontSize:13,color:"#8099b0",lineHeight:1.6}}>We will automatically show resources for your state and surrounding states. Confirm or change your state below.</div><div style={{fontSize:11,color:"#334155",marginTop:8,lineHeight:1.6}}>🔒 State is detected from your internet connection - not GPS. We never access your precise location.</div></div>)}
      {currentState&&(<div style={{background:"rgba(234,179,8,0.06)",border:"1px solid rgba(234,179,8,0.15)",borderRadius:14,padding:"14px 16px"}}><div style={{fontSize:12,color:"#eab308",fontWeight:600,marginBottom:2}}>Current: {currentStateName}</div><div style={{fontSize:12,color:"#8099b0"}}>Select a new state to update your resources</div></div>)}
      <div style={{fontSize:13,fontWeight:700,color:"#dde8f4",marginTop:8,marginBottom:8}}>Select Your State</div>
      <div style={{display:"grid",gridTemplateColumns:lc.isDesktop?"repeat(4,1fr)":"repeat(2,1fr)",gap:8}}>
        {states.map(s=>(<div key={s.code} onClick={()=>setSelected(s.code)} style={{background:selected===s.code?"rgba(56,189,248,0.12)":"rgba(255,255,255,0.03)",border:`1.5px solid ${selected===s.code?"rgba(56,189,248,0.3)":"rgba(255,255,255,0.06)"}`,borderRadius:12,padding:"12px 14px",cursor:"pointer",textAlign:"center",transition:"all 0.15s"}}><div style={{fontSize:14,fontWeight:700,color:selected===s.code?"#38bdf8":"#dde8f4"}}>{s.code}</div><div style={{fontSize:11,color:selected===s.code?"#38bdf8":"#8099b0",marginTop:2}}>{s.name}</div></div>))}
      </div>
      {selected&&<Btn color="#38bdf8" onClick={()=>onSelect(selected)}>Continue →</Btn>}
      {!currentState&&<div onClick={()=>onSelect("NC")} style={{textAlign:"center",fontSize:13,color:"#8099b0",cursor:"pointer",textDecoration:"underline",textUnderlineOffset:3}}>Skip for now (defaults to NC)</div>}
    </ScreenSingle>
  );
}

export function HomeTile({icon,label,color,bg,border,badge,locked=false,onClick}){
  const[p,setP]=useState(false);
  return(
    <div onMouseDown={()=>setP(true)} onMouseUp={()=>setP(false)} onMouseLeave={()=>setP(false)} onClick={onClick} style={{background:p?bg:"rgba(255,255,255,0.03)",border:`1.5px solid ${p?border:locked?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.07)"}`,borderRadius:18,padding:"18px 10px 14px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:10,transform:p?"scale(0.96)":"scale(1)",transition:"all 0.13s",position:"relative",opacity:locked?0.5:1,userSelect:"none"}}>
      <div style={{position:"absolute",top:0,left:"20%",right:"20%",height:2,borderRadius:"0 0 4px 4px",background:locked?"#1e3a52":color,opacity:locked?1:p?1:0.5}}/>
      <div style={{width:46,height:46,borderRadius:14,background:locked?"rgba(255,255,255,0.04)":bg,border:`1px solid ${locked?"rgba(255,255,255,0.06)":color+"30"}`,display:"flex",alignItems:"center",justifyContent:"center",color:locked?"#1e3a66":color}}>{locked?<LockIcon size={18}/>:icon}</div>
      <div style={{fontSize:11,fontWeight:700,color:locked?"#1e3a52":"#c8dae8",textAlign:"center",lineHeight:1.35,whiteSpace:"pre-line"}}>{label}</div>
      {badge&&!locked&&<div style={{position:"absolute",top:8,right:8,fontSize:8,fontWeight:800,letterSpacing:"0.1em",color,background:color+"18",padding:"2px 6px",borderRadius:5,textTransform:"uppercase"}}>{badge}</div>}
      {locked&&<div style={{position:"absolute",top:8,right:8,fontSize:8,fontWeight:800,letterSpacing:"0.08em",color:"#1e3a52",background:"rgba(255,255,255,0.04)",padding:"2px 6px",borderRadius:5,textTransform:"uppercase"}}>AGENCY</div>}
    </div>
  );
}

export function ToolCard({icon,label,sub,color,bg,onClick}){
  const[p,setP]=useState(false);
  return(
    <div onMouseDown={()=>setP(true)} onMouseUp={()=>setP(false)} onMouseLeave={()=>setP(false)} onClick={onClick} style={{background:p?bg:"rgba(255,255,255,0.033)",border:"1.5px solid "+(p?color+"55":"rgba(255,255,255,0.065)"),borderRadius:16,padding:"22px 12px 18px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,transform:p?"scale(0.97)":"scale(1)",transition:"all 0.13s",userSelect:"none",minHeight:140}}>
      <div style={{width:52,height:52,borderRadius:15,background:bg,border:"1px solid "+color+"30",display:"flex",alignItems:"center",justifyContent:"center",color:color,flexShrink:0}}>{icon}</div>
      <div style={{textAlign:"center"}}><div style={{fontSize:13,fontWeight:700,color:"#dde8f4",lineHeight:1.3,marginBottom:4}}>{label}</div><div style={{fontSize:11,color:"#8099b0",lineHeight:1.4}}>{sub}</div></div>
    </div>
  );
}
