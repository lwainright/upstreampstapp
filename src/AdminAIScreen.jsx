// ============================================================
// SCREEN: AdminAIScreen
// Upstream Initiative — AI Assistant for Platform Owner
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { ScreenSingle, Card, SLabel, Btn } from './ui.jsx';
import { databases } from './appwrite.js';
import { Query, ID } from 'appwrite';

const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE || '69c88588001ed071c19e';
const PLATFORM_SETTINGS_COLLECTION = '69e15866002709cf67ad';
const PLATFORM_SETTINGS_DOC = '69e15842000b42f06c0c';

const CHAT_ENDPOINT = "/.netlify/functions/chat";

const callClaude = async (systemPrompt, userMessage) => {
  const res = await fetch(CHAT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      isAdminAI: true,
      systemPrompt,
      messages: [{ role: "user", content: userMessage }],
      adminContext: "Admin AI business assistant",
    }),
  });
  const data = await res.json();
  return data.content || "";
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

const today = () => new Date().toISOString().slice(0, 10);

const inputStyle = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8, padding: "10px 12px",
  color: "#dde8f4", fontSize: 13,
  fontFamily: "'DM Sans',sans-serif",
  outline: "none", width: "100%",
};

// ── QR Generator with logo overlay using canvas ──────────────
function QRGenerator({ onStatus }) {
  const [url, setUrl]           = useState("https://upstreampst.netlify.app");
  const [label, setLabel]       = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [generated, setGenerated] = useState(false);
  const [qrSize, setQrSize]     = useState(300);
  const canvasRef  = useRef(null);
  const fileRef    = useRef(null);

  const loadQRLib = () => new Promise((resolve) => {
    if (window.QRCode) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    s.onload = resolve;
    document.head.appendChild(s);
  });

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
    setGenerated(false);
  };

  const generate = async () => {
    if (!url.trim()) return;
    await loadQRLib();

    // Step 1: render QR into temp div
    const tempDiv = document.createElement('div');
    document.body.appendChild(tempDiv);
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';

    new window.QRCode(tempDiv, {
      text: url.trim(),
      width: qrSize,
      height: qrSize,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: window.QRCode.CorrectLevel.H,
    });

    await new Promise(r => setTimeout(r, 300));

    const qrCanvas = tempDiv.querySelector('canvas');
    if (!qrCanvas) { document.body.removeChild(tempDiv); return; }

    // Step 2: draw onto our canvas
    const canvas = canvasRef.current;
    const padding = 24;
    const labelH  = label ? 36 : 0;
    canvas.width  = qrSize + padding * 2;
    canvas.height = qrSize + padding * 2 + labelH;
    const ctx = canvas.getContext('2d');

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.roundRect(0, 0, canvas.width, canvas.height, 16);
    ctx.fill();

    // QR code
    ctx.drawImage(qrCanvas, padding, padding, qrSize, qrSize);

    // Label
    if (label) {
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 14px DM Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, canvas.width / 2, qrSize + padding + 22);
    }

    // Logo overlay in center
    if (logoPreview) {
      await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const logoSize = qrSize * 0.28;
          const logoX = padding + (qrSize - logoSize) / 2;
          const logoY = padding + (qrSize - logoSize) / 2;
          // White rounded rect behind logo — no circle clip
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(logoX - 8, logoY - 8, logoSize + 16, logoSize + 16, 10);
          ctx.fill();
          // Draw logo full size, no clipping
          ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
          resolve();
        };
        img.src = logoPreview;
      });
    }

    document.body.removeChild(tempDiv);
    setGenerated(true);
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `qr-${url.replace(/https?:\/\//,'').replace(/[^a-z0-9]/gi,'-').slice(0,30)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    onStatus?.("QR downloaded ✓");
  };

  return (
    <div>
      <Card style={{ background:"rgba(56,189,248,0.05)", borderColor:"rgba(56,189,248,0.2)", marginBottom:12 }}>
        <div style={{ fontSize:13, fontWeight:700, color:"#38bdf8", marginBottom:4 }}>📱 QR Code Generator</div>
        <div style={{ fontSize:12, color:"#64748b", lineHeight:1.6 }}>Generate a QR code for any URL — the app, an event page, a form, anything. Add your logo in the center and a label below. Download as PNG.</div>
      </Card>

      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
        <div>
          <SLabel color="#38bdf8">URL *</SLabel>
          <input value={url} onChange={e => { setUrl(e.target.value); setGenerated(false); }} placeholder="https://..." style={inputStyle}/>
        </div>

        <div>
          <SLabel color="#38bdf8">Agency Code (optional — auto-joins on scan)</SLabel>
          <input
            placeholder="e.g. NCLEAP — member scans QR and joins automatically"
            style={inputStyle}
            onChange={e => {
              const code = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
              if (code) {
                setUrl('https://upstreampst.netlify.app?code=' + code);
              } else {
                setUrl('https://upstreampst.netlify.app');
              }
              setGenerated(false);
            }}
          />
        </div>

        <div>
          <SLabel color="#a78bfa">PST Request QR (links directly to request form)</SLabel>
          <div style={{ display:"flex", gap:8 }}>
            <input
              placeholder="Agency code for PST form e.g. NCLEAP"
              style={{ ...inputStyle, flex:1 }}
              onChange={e => {
                const code = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (code) setUrl('https://upstreampst.netlify.app/pst?code=' + code);
                setGenerated(false);
              }}
            />
            <input
              placeholder="Division (optional)"
              style={{ ...inputStyle, flex:1 }}
              onChange={e => {
                const div = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                const base = url.split('&div=')[0];
                if (div) setUrl(base + '&div=' + div);
                setGenerated(false);
              }}
            />
          </div>
          <div style={{ fontSize:10, color:"#475569", marginTop:4 }}>
            PST QR links directly to the request form — pre-tagged to this agency/division
          </div>
        </div>

        <div>
          <SLabel color="#38bdf8">Label (shown below QR)</SLabel>
          <input value={label} onChange={e => { setLabel(e.target.value); setGenerated(false); }} placeholder="e.g. Scan to access Upstream Approach" style={inputStyle}/>
        </div>

        <div>
          <SLabel color="#38bdf8">Logo (optional — centered on QR)</SLabel>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display:"none" }}/>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <div onClick={() => fileRef.current?.click()} style={{ padding:"10px 16px", borderRadius:10, cursor:"pointer", background:"rgba(56,189,248,0.08)", border:"1.5px solid rgba(56,189,248,0.25)", fontSize:12, fontWeight:700, color:"#38bdf8" }}>
              {logoFile ? "Change Logo" : "Upload Logo"}
            </div>
            {logoPreview && (
              <>
                <img src={logoPreview} style={{ height:40, width:40, objectFit:"cover", borderRadius:8, border:"1px solid rgba(255,255,255,0.1)" }}/>
                <div onClick={() => { setLogoFile(null); setLogoPreview(""); setGenerated(false); }} style={{ fontSize:11, color:"#f87171", cursor:"pointer" }}>Remove</div>
              </>
            )}
          </div>
        </div>

        <div>
          <SLabel color="#38bdf8">Size</SLabel>
          <div style={{ display:"flex", gap:8 }}>
            {[{l:"Small",v:200},{l:"Medium",v:300},{l:"Large",v:400}].map(s => (
              <div key={s.v} onClick={() => { setQrSize(s.v); setGenerated(false); }} style={{ flex:1, padding:"9px", borderRadius:10, cursor:"pointer", textAlign:"center", fontSize:12, fontWeight:qrSize===s.v?800:600, background:qrSize===s.v?"rgba(56,189,248,0.15)":"rgba(255,255,255,0.03)", border:`1.5px solid ${qrSize===s.v?"rgba(56,189,248,0.35)":"rgba(255,255,255,0.07)"}`, color:qrSize===s.v?"#38bdf8":"#64748b" }}>
                {s.l}
              </div>
            ))}
          </div>
        </div>

        <div onClick={generate} style={{ padding:"14px", borderRadius:12, cursor:"pointer", textAlign:"center", background:"rgba(56,189,248,0.12)", border:"1.5px solid rgba(56,189,248,0.35)", fontSize:14, fontWeight:800, color:"#38bdf8" }}>
          Generate QR Code
        </div>
      </div>

      {/* Preview */}
      <div style={{ display: generated ? "block" : "none" }}>
        <Card style={{ alignItems:"center", textAlign:"center" }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}>
            <canvas ref={canvasRef} style={{ borderRadius:16, maxWidth:"100%" }}/>
          </div>
          {label && <div style={{ fontSize:12, color:"#8099b0", marginBottom:4 }}>{label}</div>}
          <div style={{ fontSize:10, color:"#475569", marginBottom:16, wordBreak:"break-all" }}>{url}</div>
          <div style={{ display:"flex", gap:8 }}>
            <div onClick={download} style={{ flex:1, padding:"12px", borderRadius:10, cursor:"pointer", textAlign:"center", background:"rgba(56,189,248,0.12)", border:"1.5px solid rgba(56,189,248,0.3)", fontSize:13, fontWeight:700, color:"#38bdf8" }}>
              ⬇ Download PNG
            </div>
            <div onClick={() => { navigator.clipboard.writeText(url); onStatus?.("URL copied ✓"); }} style={{ flex:1, padding:"12px", borderRadius:10, cursor:"pointer", textAlign:"center", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", fontSize:13, fontWeight:700, color:"#8099b0" }}>
              Copy URL
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Line Item Calculator ─────────────────────────────────────
function LineItemCalculator({ onUpdate }) {
  const [users, setUsers] = React.useState("");
  const [onsite, setOnsite] = React.useState(false);
  const [onsiteDays, setOnsiteDays] = React.useState(1);
  const [remote, setRemote] = React.useState(false);
  const [travel, setTravel] = React.useState("");

  const IMPL_FEE = 5000;
  const PRICE_PER_USER = 40;
  const REMOTE_SESSION = 500;
  const ONSITE_DAY = 1500;

  const [includeImpl, setIncludeImpl] = React.useState(true);

  const userCount = parseInt(users) || 0;
  const implTotal = includeImpl ? IMPL_FEE : 0;
  const licenseTotal = userCount * PRICE_PER_USER;
  const remoteTotal = remote ? REMOTE_SESSION : 0;
  const onsiteTotal = onsite ? (onsiteDays * ONSITE_DAY) : 0;
  const travelTotal = parseFloat(travel) || 0;
  const grandTotal = implTotal + licenseTotal + remoteTotal + onsiteTotal + travelTotal;

  const lineItems = [
    includeImpl ? `Implementation Fee (one time) = $${IMPL_FEE.toLocaleString()}` : null,
    userCount > 0 ? `Platform License: ${userCount} users x $${PRICE_PER_USER}/user/year = $${licenseTotal.toLocaleString()}` : null,
    `Family members included at no charge`,
    `All features included (PST, analytics, admin dashboard)`,
    remote ? `Remote Training Session = $${REMOTE_SESSION}` : null,
    onsite ? `On-site Training: ${onsiteDays} day${onsiteDays>1?"s":""} x $${ONSITE_DAY}/day = $${onsiteTotal.toLocaleString()}` : null,
    travelTotal > 0 ? `Travel and Expenses = $${travelTotal.toLocaleString()}` : null,
    `Payment Terms: Net 30`,
    `Taxes: Not applicable (NC SaaS ruling, Feb 2021)`,
  ].filter(Boolean);

  React.useEffect(() => {
    if (grandTotal > 0) {
      const desc = `Upstream Approach -- ${userCount} users, 1 year license${remote?" + remote onboarding":""}${onsite?" + on-site training":""}`;
      onUpdate(grandTotal, desc, lineItems.join("
"));
    }
  }, [users, onsite, onsiteDays, remote, travel]);

  return (
    <div style={{ background:"rgba(56,189,248,0.05)", border:"1px solid rgba(56,189,248,0.15)", borderRadius:12, padding:"14px" }}>
      <div style={{ fontSize:12, fontWeight:800, color:"#38bdf8", marginBottom:12 }}>Invoice Calculator</div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        <div>
          <div style={{ fontSize:11, color:"#64748b", marginBottom:4 }}>Number of users ($40/user/year)</div>
          <input value={users} onChange={e=>setUsers(e.target.value)} placeholder="e.g. 150" type="number" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:9, padding:"9px 12px", fontSize:13, outline:"none", width:"100%", color:"#dde8f4", boxSizing:"border-box" }}/>
        </div>
        <div onClick={() => setIncludeImpl(i=>!i)} style={{ padding:"10px", borderRadius:9, cursor:"pointer", textAlign:"center", background:includeImpl?"rgba(234,179,8,0.12)":"rgba(255,255,255,0.03)", border:`1px solid ${includeImpl?"rgba(234,179,8,0.3)":"rgba(255,255,255,0.07)"}`, fontSize:11, fontWeight:700, color:includeImpl?"#eab308":"#64748b" }}>
          {includeImpl?"✓ ":""}Implementation Fee<br/><span style={{fontSize:10,fontWeight:400}}>$5,000 one time</span>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <div onClick={() => setRemote(r=>!r)} style={{ flex:1, padding:"10px", borderRadius:9, cursor:"pointer", textAlign:"center", background:remote?"rgba(34,197,94,0.12)":"rgba(255,255,255,0.03)", border:`1px solid ${remote?"rgba(34,197,94,0.3)":"rgba(255,255,255,0.07)"}`, fontSize:11, fontWeight:700, color:remote?"#22c55e":"#64748b" }}>
            {remote?"✓ ":""}Remote Training<br/><span style={{fontSize:10,fontWeight:400}}>$500/session</span>
          </div>
          <div onClick={() => setOnsite(o=>!o)} style={{ flex:1, padding:"10px", borderRadius:9, cursor:"pointer", textAlign:"center", background:onsite?"rgba(167,139,250,0.12)":"rgba(255,255,255,0.03)", border:`1px solid ${onsite?"rgba(167,139,250,0.3)":"rgba(255,255,255,0.07)"}`, fontSize:11, fontWeight:700, color:onsite?"#a78bfa":"#64748b" }}>
            {onsite?"✓ ":""}On-site Training<br/><span style={{fontSize:10,fontWeight:400}}>$1,500/day</span>
          </div>
        </div>
        {onsite && (
          <div>
            <div style={{ fontSize:11, color:"#64748b", marginBottom:4 }}>On-site days</div>
            <div style={{ display:"flex", gap:6 }}>
              {[1,2,3].map(d => (
                <div key={d} onClick={() => setOnsiteDays(d)} style={{ flex:1, padding:"8px", borderRadius:8, cursor:"pointer", textAlign:"center", background:onsiteDays===d?"rgba(167,139,250,0.15)":"rgba(255,255,255,0.03)", border:`1px solid ${onsiteDays===d?"rgba(167,139,250,0.3)":"rgba(255,255,255,0.07)"}`, fontSize:12, fontWeight:700, color:onsiteDays===d?"#a78bfa":"#64748b" }}>{d} day{d>1?"s":""}</div>
              ))}
            </div>
          </div>
        )}
        {onsite && (
          <div>
            <div style={{ fontSize:11, color:"#64748b", marginBottom:4 }}>Travel and expenses (estimate)</div>
            <input value={travel} onChange={e=>setTravel(e.target.value)} placeholder="e.g. 450" type="number" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:9, padding:"9px 12px", fontSize:13, outline:"none", width:"100%", color:"#dde8f4", boxSizing:"border-box" }}/>
          </div>
        )}
        {grandTotal > 0 && (
          <div style={{ background:"rgba(56,189,248,0.08)", border:"1px solid rgba(56,189,248,0.2)", borderRadius:10, padding:"12px 14px" }}>
            {lineItems.map((item,i) => (
              <div key={i} style={{ fontSize:11, color:"#94a3b8", marginBottom:4 }}>{item}</div>
            ))}
            <div style={{ fontSize:16, fontWeight:900, color:"#38bdf8", marginTop:8 }}>
              Total: ${grandTotal.toLocaleString()}<span style={{fontSize:11,fontWeight:400,color:"#64748b"}}> — Net 30</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Onboarding Checklist ──────────────────────────────────────
function OnboardingChecklist() {
  const CHECKLIST = [
    {
      phase: "Before the Call",
      color: "#38bdf8",
      items: [
        { id:"c1", label:"Confirm number of users (for invoice)" },
        { id:"c2", label:"Confirm seat types needed (responder, hospital, school, etc.)" },
        { id:"c3", label:"Confirm number of divisions or locations" },
        { id:"c4", label:"Confirm PST team exists and who leads it" },
        { id:"c5", label:"Confirm onboarding type: remote or on-site" },
        { id:"c6", label:"Invoice sent and payment terms agreed" },
      ]
    },
    {
      phase: "Appwrite Setup",
      color: "#a78bfa",
      items: [
        { id:"a1", label:"Create agency document in agencies collection" },
        { id:"a2", label:"Set agency code (uppercase, no spaces)" },
        { id:"a3", label:"Upload agency logo to Appwrite Storage, add URL to agency doc" },
        { id:"a4", label:"Set pstRetentionDays (default 90)" },
        { id:"a5", label:"Set pstVisibility (none / basic / full)" },
        { id:"a6", label:"Create divisions in agency_divisions if multi-location" },
        { id:"a7", label:"Create staff accounts in user_permissions for PST members, supervisors, admins" },
        { id:"a8", label:"Set role for each staff account (pst / supervisor / admin)" },
      ]
    },
    {
      phase: "QR Code Setup",
      color: "#f97316",
      items: [
        { id:"q1", label:"Generate QR codes in AdminAIScreen QR tab" },
        { id:"q2", label:"Generate one QR per division/location if applicable" },
        { id:"q3", label:"Generate high-acuity QR codes for specific contexts (?hctx= for hospital, ?sctx= for school)" },
        { id:"q4", label:"Download QR poster PDFs" },
        { id:"q5", label:"Confirm print size and placement locations with client" },
      ]
    },
    {
      phase: "Platform Configuration",
      color: "#22c55e",
      items: [
        { id:"p1", label:"Set feature toggles in Platform panel (17 available)" },
        { id:"p2", label:"Configure which seats are relevant for this agency" },
        { id:"p3", label:"Configure county admin if this is a multi-agency county contract" },
        { id:"p4", label:"Verify resources collection has relevant resources for their seat types" },
        { id:"p5", label:"Test agency code entry end-to-end on a device" },
        { id:"p6", label:"Test PST request flow from user to dispatch board" },
      ]
    },
    {
      phase: "Onboarding Session",
      color: "#eab308",
      items: [
        { id:"o1", label:"Walk admin through the admin dashboard" },
        { id:"o2", label:"Walk PST lead through dispatch board and claiming cases" },
        { id:"o3", label:"Walk supervisor through check-in tools and wellness dashboard" },
        { id:"o4", label:"Explain the family code system if applicable" },
        { id:"o5", label:"Explain QR placement strategy for their environment" },
        { id:"o6", label:"Leave agency with one-page staff guide (see AppGuideScreen)" },
        { id:"o7", label:"Schedule 30-day check-in call" },
      ]
    },
    {
      phase: "Post-Launch",
      color: "#64748b",
      items: [
        { id:"x1", label:"Confirm first PST request received and dispatched correctly" },
        { id:"x2", label:"Check tool_usage analytics after 2 weeks" },
        { id:"x3", label:"30-day check-in call completed" },
        { id:"x4", label:"Annual renewal reminder set (11 months out)" },
        { id:"x5", label:"Mark invoice paid in AdminAIScreen" },
      ]
    },
  ];

  const [checked, setChecked] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("upstream_onboard_checklist") || "{}"); } catch(e) { return {}; }
  });
  const [clientName, setClientName] = React.useState("");

  const toggle = (id) => {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    try { localStorage.setItem("upstream_onboard_checklist", JSON.stringify(next)); } catch(e) {}
  };

  const reset = () => {
    setChecked({});
    try { localStorage.removeItem("upstream_onboard_checklist"); } catch(e) {}
  };

  const total = CHECKLIST.reduce((s,p) => s + p.items.length, 0);
  const done = Object.values(checked).filter(Boolean).length;

  return (
    <div>
      <div style={{ fontSize:10, fontWeight:800, letterSpacing:"0.16em", textTransform:"uppercase", color:"#475569", marginBottom:12 }}>New Client Onboarding Checklist</div>
      <div style={{ fontSize:12, color:"#64748b", marginBottom:12 }}>
        Saved on this device. Reset when starting a new client.
      </div>
      <input value={clientName} onChange={e=>setClientName(e.target.value)} placeholder="Client name (for reference)" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:9, padding:"9px 12px", fontSize:13, outline:"none", width:"100%", color:"#dde8f4", boxSizing:"border-box", marginBottom:12 }}/>

      {/* Progress */}
      <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"12px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
        <div style={{ flex:1, background:"rgba(255,255,255,0.06)", borderRadius:4, height:8, overflow:"hidden" }}>
          <div style={{ width:`${(done/total)*100}%`, height:"100%", background:"#22c55e", borderRadius:4, transition:"width 0.3s" }}/>
        </div>
        <div style={{ fontSize:13, fontWeight:800, color:"#22c55e", flexShrink:0 }}>{done}/{total}</div>
      </div>

      {CHECKLIST.map((phase, pi) => {
        const phaseDone = phase.items.filter(item => checked[item.id]).length;
        return (
          <div key={pi} style={{ marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <div style={{ fontSize:12, fontWeight:800, color:phase.color, letterSpacing:"0.08em", textTransform:"uppercase" }}>{phase.phase}</div>
              <div style={{ fontSize:10, color:"#475569" }}>{phaseDone}/{phase.items.length}</div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {phase.items.map(item => (
                <div key={item.id} onClick={() => toggle(item.id)}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:checked[item.id]?"rgba(34,197,94,0.06)":"rgba(255,255,255,0.025)", border:`1px solid ${checked[item.id]?"rgba(34,197,94,0.2)":"rgba(255,255,255,0.06)"}`, borderRadius:9, cursor:"pointer" }}>
                  <div style={{ width:18, height:18, borderRadius:5, border:`2px solid ${checked[item.id]?"#22c55e":"#334155"}`, background:checked[item.id]?"#22c55e":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:11, color:"white", fontWeight:800 }}>
                    {checked[item.id]?"✓":""}
                  </div>
                  <div style={{ fontSize:12, color:checked[item.id]?"#475569":"#94a3b8", textDecoration:checked[item.id]?"line-through":"none", lineHeight:1.5 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div onClick={reset} style={{ padding:"10px", borderRadius:9, cursor:"pointer", textAlign:"center", background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.15)", fontSize:11, fontWeight:700, color:"#f87171", marginTop:8 }}>
        Reset for New Client
      </div>
    </div>
  );
}

export default function AdminAIScreen({ navigate, logoSrc }) {
  const [tab, setTab] = useState("assistant");
  const [statusMsg, setStatusMsg] = useState("");

  const [stats, setStats] = useState(null);
  useEffect(() => {
    const loadStats = async () => {
      try {
        const [clientRes, invoiceRes, resourceRes] = await Promise.all([
          databases.listDocuments(DB_ID, 'admin_clients', [Query.limit(1)]),
          databases.listDocuments(DB_ID, 'admin_invoices', [Query.limit(200)]),
          databases.listDocuments(DB_ID, 'resources', [Query.limit(1)]),
        ]);
        const invoices = invoiceRes.documents || [];
        const paid = invoices.filter(i => i.status === "Paid").reduce((s, i) => s + (i.amount || 0), 0);
        const outstanding = invoices.filter(i => i.status !== "Paid").reduce((s, i) => s + (i.amount || 0), 0);
        setStats({ clients: clientRes.total || 0, resources: resourceRes.total || 0, revenue: paid, outstanding, invoices: invoices.length });
      } catch(e) {}
    };
    loadStats();
  }, []);

  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput]     = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const [clients, setClients]               = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [clientForm, setClientForm]         = useState({ clientName:"", contactEmail:"", phone:"", organization:"", type:"Agency", rate:"", notes:"", active:true });

  const [invoices, setInvoices]               = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceForm, setInvoiceForm]         = useState({ clientName:"", clientEmail:"", amount:"", description:"", lineItems:"", dueDate:"", notes:"", status:"Draft" });
  const [invoiceFilter, setInvoiceFilter]     = useState("all");

  const [writingInput, setWritingInput]   = useState("");
  const [writingTone, setWritingTone]     = useState("professional");
  const [writingOutput, setWritingOutput] = useState("");
  const [writingLoading, setWritingLoading] = useState(false);

  useEffect(() => {
    if (tab === "clients") loadClients();
    if (tab === "invoices") loadInvoices();
  }, [tab]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatHistory]);

  const loadClients = async () => {
    setClientsLoading(true);
    try {
      const res = await databases.listDocuments(DB_ID, 'admin_clients', [Query.limit(100), Query.orderDesc('$createdAt')]);
      setClients(res.documents || []);
    } catch(e) { setStatusMsg("Could not load clients."); }
    setClientsLoading(false);
  };

  const loadInvoices = async () => {
    setInvoicesLoading(true);
    try {
      const res = await databases.listDocuments(DB_ID, 'admin_invoices', [Query.limit(200), Query.orderDesc('$createdAt')]);
      setInvoices(res.documents || []);
    } catch(e) { setStatusMsg("Could not load invoices."); }
    setInvoicesLoading(false);
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatLoading(true);
    const newHistory = [...chatHistory, { role: "user", content: userMsg }];
    setChatHistory(newHistory);
    try {
      let context = "";
      try {
        const [clientRes, invoiceRes] = await Promise.all([
          databases.listDocuments(DB_ID, 'admin_clients', [Query.limit(100)]),
          databases.listDocuments(DB_ID, 'admin_invoices', [Query.limit(200)]),
        ]);
        const resourceRes = await databases.listDocuments(DB_ID, 'resources', [Query.limit(1)]).catch(() => ({ total: 0 }));
        const paidInvoices = invoiceRes.documents?.filter(i => i.status === "Paid") || [];
        const unpaidInvoices = invoiceRes.documents?.filter(i => i.status !== "Paid") || [];
        context = `Current business data:
- Total clients: ${clientRes.total || 0}
- Total invoices: ${invoiceRes.documents?.length || 0}
- Paid: ${paidInvoices.length} (${formatCurrency(paidInvoices.reduce((s,i)=>s+(i.amount||0),0))})
- Outstanding: ${unpaidInvoices.length} (${formatCurrency(unpaidInvoices.reduce((s,i)=>s+(i.amount||0),0))})
- Vetted resources: ${resourceRes.total || 0}
- Today: ${today()}
Clients: ${clientRes.documents?.map(c=>`${c.clientName} (${c.organization||'No org'})`).join(', ')||'None'}
Recent invoices: ${invoiceRes.documents?.slice(0,5).map(i=>`${i.clientName} $${i.amount} - ${i.status}`).join(', ')||'None'}`;
      } catch(e) {}
      const systemPrompt = `You are the AI Assistant for Upstream Initiative — a first responder wellness platform business.
${context}
Help the owner with clients, invoices, revenue, emails, and business advice. Only use data provided above. Be concise and professional. Today is ${today()}.`;
      const res = await fetch(CHAT_ENDPOINT, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ isAdminAI:true, systemPrompt, messages:newHistory.map(m=>({role:m.role,content:m.content})), adminContext:"Admin AI business assistant" }) });
      const data = await res.json();
      const reply = data.content || "I couldn't process that.";
      setChatHistory(prev => [...prev, { role:"assistant", content:reply }]);
    } catch(e) {
      setChatHistory(prev => [...prev, { role:"assistant", content:"Connection error. Please try again." }]);
    }
    setChatLoading(false);
  };

  const saveClient = async () => {
    if (!clientForm.clientName.trim()) { setStatusMsg("Client name is required."); return; }
    try {
      await databases.createDocument(DB_ID, 'admin_clients', ID.unique(), { ...clientForm, rate: clientForm.rate ? parseFloat(clientForm.rate) : null, active: true });
      setStatusMsg("Client saved ✓");
      setShowClientForm(false);
      setClientForm({ clientName:"", contactEmail:"", phone:"", organization:"", type:"Agency", rate:"", notes:"", active:true });
      loadClients();
    } catch(e) { setStatusMsg("Save failed: " + e.message); }
  };

  const toggleClientActive = async (id, current) => {
    try { await databases.updateDocument(DB_ID, 'admin_clients', id, { active: !current }); loadClients(); } catch(e) {}
  };

  const generateInvoiceNumber = () => {
    const d = new Date();
    return `INV-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`;
  };

  const saveInvoice = async () => {
    if (!invoiceForm.clientName.trim() || !invoiceForm.amount) { setStatusMsg("Client name and amount are required."); return; }
    try {
      await databases.createDocument(DB_ID, 'admin_invoices', ID.unique(), { ...invoiceForm, amount: parseFloat(invoiceForm.amount), invoiceNumber: generateInvoiceNumber(), status:"Draft" });
      setStatusMsg("Invoice created ✓");
      setShowInvoiceForm(false);
      setInvoiceForm({ clientName:"", clientEmail:"", amount:"", description:"", lineItems:"", dueDate:"", notes:"", status:"Draft" });
      loadInvoices();
    } catch(e) { setStatusMsg("Save failed: " + e.message); }
  };

  const updateInvoiceStatus = async (id, status) => {
    try {
      const update = { status };
      if (status === "Paid") update.paidDate = today();
      await databases.updateDocument(DB_ID, 'admin_invoices', id, update);
      setStatusMsg(`Invoice marked as ${status} ✓`);
      loadInvoices();
    } catch(e) { setStatusMsg("Update failed: " + e.message); }
  };

  const filteredInvoices = invoices.filter(i => invoiceFilter === "all" || (i.status||"Draft").toLowerCase() === invoiceFilter);
  const totalRevenue = invoices.filter(i => i.status === "Paid").reduce((s, i) => s + (i.amount||0), 0);
  const totalOutstanding = invoices.filter(i => i.status !== "Paid").reduce((s, i) => s + (i.amount||0), 0);

  const handleRewrite = async () => {
    if (!writingInput.trim()) return;
    setWritingLoading(true);
    setWritingOutput("");
    try {
      const toneMap = { professional:"formal, professional, polished", friendly:"warm, approachable, and friendly while professional", direct:"clear, concise, direct — no fluff", confident:"confident, authoritative, assertive", formal:"highly formal — suitable for contracts or executive communication" };
      const result = await callClaude(`You are a professional business writing assistant. Rewrite the text to sound ${toneMap[writingTone]}. Sound human, fix grammar, keep the core message. Return ONLY the rewritten text.`, writingInput);
      setWritingOutput(result);
    } catch(e) { setWritingOutput("Rewrite failed. Please check your connection."); }
    setWritingLoading(false);
  };

  const tabs = [
    { key:"assistant", label:"🤖 Assistant" },
    { key:"clients",   label:"👥 Clients"   },
    { key:"invoices",  label:"📄 Invoices"  },
    { key:"onboard",   label:"✅ Onboarding" },
    { key:"writing",   label:"✍️ Writing"   },
    { key:"qr",        label:"📱 QR Code"   },
    { key:"codes",     label:"🔑 Join Codes" },
  ];

  // ── Join Codes state ─────────────────────────────────────────────────
  const [joinCodes, setJoinCodes] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem("upstream_join_codes") || "[]"); } catch(e) { return []; }
  });
  const [codeAgency, setCodeAgency]     = React.useState("");
  const [codeMaxUses, setCodeMaxUses]   = React.useState("50");
  const [codeExpireH, setCodeExpireH]   = React.useState("72");

  const saveJoinCodes = (codes) => {
    setJoinCodes(codes);
    try { localStorage.setItem("upstream_join_codes", JSON.stringify(codes)); } catch(e) {}
  };

  const generateCode = () => {
    if (!codeAgency.trim()) return;
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const rand = Array.from({length: 8}, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const code = {
      id:        Date.now(),
      code:      rand,
      agency:    codeAgency.trim().toUpperCase(),
      maxUses:   parseInt(codeMaxUses) || 50,
      uses:      0,
      expiresAt: Date.now() + (parseInt(codeExpireH) || 72) * 3600000,
      active:    true,
    };
    saveJoinCodes([code, ...joinCodes]);
  };

  const revokeCode = (id) => saveJoinCodes(joinCodes.filter(c => c.id !== id));

  const isExpired = (c) => !c.active || c.uses >= c.maxUses || Date.now() > c.expiresAt;

  const timeLeft = (c) => {
    const ms = c.expiresAt - Date.now();
    if (ms <= 0) return "Expired";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
  };

  const statusColor = statusMsg.includes("failed")||statusMsg.includes("Failed") ? "#f87171" : "#22c55e";
  const statusBg    = statusMsg.includes("failed")||statusMsg.includes("Failed") ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)";

  return (
    <ScreenSingle wide={true} headerProps={{ onBack: () => navigate("home"), logoSrc }}>

      <div style={{ display:"flex", gap:5, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:14, padding:5, overflowX:"auto" }}>
        {tabs.map(t => (
          <div key={t.key} onClick={() => setTab(t.key)} style={{ flexShrink:0, minWidth:80, textAlign:"center", padding:"10px 12px", borderRadius:10, background:tab===t.key?"rgba(234,179,8,0.15)":"transparent", border:`1px solid ${tab===t.key?"rgba(234,179,8,0.3)":"transparent"}`, cursor:"pointer", fontSize:11, fontWeight:tab===t.key?800:600, color:tab===t.key?"#eab308":"#8099b0", whiteSpace:"nowrap" }}>
            {t.label}
          </div>
        ))}
      </div>

      {statusMsg && (
        <div style={{ background:statusBg, border:`1px solid ${statusColor}40`, borderRadius:10, padding:"10px 14px", fontSize:12, color:statusColor, display:"flex", justifyContent:"space-between" }}>
          {statusMsg}
          <span onClick={() => setStatusMsg("")} style={{ cursor:"pointer", color:"#64748b" }}>×</span>
        </div>
      )}

      {/* ── ASSISTANT ── */}
      {tab === "assistant" && (
        <div>
          {stats && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:12 }}>
              {[
                { label:"Vetted Resources", value:stats.resources.toLocaleString(), color:"#38bdf8" },
                { label:"Clients",          value:stats.clients.toLocaleString(),   color:"#a78bfa" },
                { label:"Revenue",          value:`$${stats.revenue.toLocaleString()}`, color:"#22c55e" },
                { label:"Outstanding",      value:`$${stats.outstanding.toLocaleString()}`, color:"#eab308" },
              ].map((s, i) => (
                <div key={i} style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.055)", borderRadius:12, padding:"12px 14px", position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:s.color, opacity:0.5 }}/>
                  <div style={{ fontSize:20, fontWeight:900, color:s.color, lineHeight:1 }}>{s.value}</div>
                  <div style={{ fontSize:10, fontWeight:700, color:"#64748b", marginTop:2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
          <Card style={{ background:"rgba(234,179,8,0.05)", borderColor:"rgba(234,179,8,0.2)", marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#eab308", marginBottom:4 }}>Business AI Assistant</div>
            <div style={{ fontSize:12, color:"#64748b", lineHeight:1.6 }}>Ask me about clients, invoices, revenue, or anything about running Upstream Initiative. I can also help draft emails and communications.</div>
          </Card>
          {chatHistory.length === 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
              {["How much revenue have I made?","Which invoices are outstanding?","How many clients do I have?","Summarize my business performance","Draft a follow-up email for an unpaid invoice"].map((p,i) => (
                <div key={i} onClick={() => setChatInput(p)} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"10px 14px", cursor:"pointer", fontSize:12, color:"#8099b0" }}>{p}</div>
              ))}
            </div>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:12 }}>
            {chatHistory.map((m, i) => (
              <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
                <div style={{ maxWidth:"85%", background:m.role==="user"?"rgba(234,179,8,0.12)":"rgba(255,255,255,0.04)", border:`1px solid ${m.role==="user"?"rgba(234,179,8,0.25)":"rgba(255,255,255,0.08)"}`, borderRadius:14, padding:"12px 14px", fontSize:13, color:m.role==="user"?"#fde68a":"#dde8f4", lineHeight:1.6, whiteSpace:"pre-wrap" }}>{m.content}</div>
              </div>
            ))}
            {chatLoading && <div style={{ display:"flex", justifyContent:"flex-start" }}><div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"12px 14px", fontSize:13, color:"#64748b" }}>Thinking...</div></div>}
            <div ref={chatEndRef}/>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <textarea value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleChat();} }} placeholder="Ask me anything about your business..." rows={2} style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1.5px solid rgba(234,179,8,0.2)", borderRadius:12, padding:"12px 14px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"none", color:"#dde8f4", lineHeight:1.5 }}/>
            <div onClick={chatLoading?null:handleChat} style={{ padding:"12px 16px", borderRadius:12, cursor:chatLoading?"not-allowed":"pointer", background:chatLoading?"rgba(255,255,255,0.02)":"rgba(234,179,8,0.12)", border:`1.5px solid ${chatLoading?"rgba(255,255,255,0.06)":"rgba(234,179,8,0.3)"}`, fontSize:13, fontWeight:700, color:chatLoading?"#475569":"#eab308", display:"flex", alignItems:"center" }}>↑</div>
          </div>
          {chatHistory.length > 0 && <div onClick={() => setChatHistory([])} style={{ textAlign:"center", fontSize:11, color:"#334155", cursor:"pointer", marginTop:8 }}>Clear conversation</div>}
        </div>
      )}

      {/* ── CLIENTS ── */}
      {tab === "clients" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#dde8f4" }}>{clients.length} Client{clients.length!==1?"s":""}</div>
            <div onClick={() => setShowClientForm(!showClientForm)} style={{ padding:"8px 14px", borderRadius:10, cursor:"pointer", background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", fontSize:12, fontWeight:700, color:"#22c55e" }}>{showClientForm?"Cancel":"+ Add Client"}</div>
          </div>
          {showClientForm && (
            <Card style={{ marginBottom:12 }}>
              <SLabel color="#22c55e">New Client</SLabel>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <input value={clientForm.clientName} onChange={e => setClientForm(v=>({...v,clientName:e.target.value}))} placeholder="Client name *" style={inputStyle}/>
                <input value={clientForm.organization} onChange={e => setClientForm(v=>({...v,organization:e.target.value}))} placeholder="Organization" style={inputStyle}/>
                <input value={clientForm.contactEmail} onChange={e => setClientForm(v=>({...v,contactEmail:e.target.value}))} placeholder="Email" type="email" style={inputStyle}/>
                <input value={clientForm.phone} onChange={e => setClientForm(v=>({...v,phone:e.target.value}))} placeholder="Phone" type="tel" style={inputStyle}/>
                <input value={clientForm.rate} onChange={e => setClientForm(v=>({...v,rate:e.target.value}))} placeholder="Default rate ($/hr or flat)" type="number" style={inputStyle}/>
                <textarea value={clientForm.notes} onChange={e => setClientForm(v=>({...v,notes:e.target.value}))} placeholder="Notes" rows={2} style={{...inputStyle,resize:"none"}}/>
                <div onClick={saveClient} style={{ padding:"11px", borderRadius:10, cursor:"pointer", textAlign:"center", background:"rgba(34,197,94,0.12)", border:"1.5px solid rgba(34,197,94,0.3)", fontSize:13, fontWeight:700, color:"#22c55e" }}>Save Client</div>
              </div>
            </Card>
          )}
          {clientsLoading && <div style={{ textAlign:"center", padding:"20px", color:"#64748b" }}>Loading...</div>}
          {!clientsLoading && clients.length===0 && <div style={{ textAlign:"center", padding:"30px", color:"#475569", fontSize:13 }}>No clients yet.</div>}
          {clients.map(c => (
            <Card key={c.$id} style={{ marginBottom:10, opacity:c.active===false?0.5:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:"#dde8f4", marginBottom:3 }}>{c.clientName}</div>
                  {c.organization && <div style={{ fontSize:12, color:"#8099b0", marginBottom:2 }}>{c.organization}</div>}
                  {c.contactEmail && <div style={{ fontSize:12, color:"#64748b", marginBottom:2 }}>{c.contactEmail}</div>}
                  {c.phone && <div style={{ fontSize:12, color:"#64748b", marginBottom:2 }}>{c.phone}</div>}
                  {c.rate && <div style={{ fontSize:11, color:"#eab308", marginTop:4 }}>Rate: {formatCurrency(c.rate)}</div>}
                  {c.notes && <div style={{ fontSize:11, color:"#475569", marginTop:4, lineHeight:1.5 }}>{c.notes}</div>}
                </div>
                <div onClick={() => toggleClientActive(c.$id, c.active!==false)} style={{ fontSize:11, color:c.active!==false?"#f87171":"#22c55e", cursor:"pointer", padding:"4px 8px", borderRadius:6, background:c.active!==false?"rgba(239,68,68,0.08)":"rgba(34,197,94,0.08)", flexShrink:0 }}>{c.active!==false?"Deactivate":"Reactivate"}</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── INVOICES ── */}
      {tab === "invoices" && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
            <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:14, padding:"14px" }}>
              <div style={{ fontSize:22, fontWeight:900, color:"#22c55e" }}>{formatCurrency(totalRevenue)}</div>
              <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>Total Revenue</div>
            </div>
            <div style={{ background:"rgba(234,179,8,0.08)", border:"1px solid rgba(234,179,8,0.2)", borderRadius:14, padding:"14px" }}>
              <div style={{ fontSize:22, fontWeight:900, color:"#eab308" }}>{formatCurrency(totalOutstanding)}</div>
              <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>Outstanding</div>
            </div>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ display:"flex", gap:6 }}>
              {["all","draft","sent","paid"].map(f => (
                <div key={f} onClick={() => setInvoiceFilter(f)} style={{ padding:"6px 12px", borderRadius:8, cursor:"pointer", fontSize:11, fontWeight:invoiceFilter===f?800:600, background:invoiceFilter===f?"rgba(56,189,248,0.15)":"rgba(255,255,255,0.03)", border:`1px solid ${invoiceFilter===f?"rgba(56,189,248,0.3)":"rgba(255,255,255,0.07)"}`, color:invoiceFilter===f?"#38bdf8":"#64748b", textTransform:"capitalize" }}>{f}</div>
              ))}
            </div>
            <div onClick={() => setShowInvoiceForm(!showInvoiceForm)} style={{ padding:"8px 14px", borderRadius:10, cursor:"pointer", background:"rgba(56,189,248,0.1)", border:"1px solid rgba(56,189,248,0.3)", fontSize:12, fontWeight:700, color:"#38bdf8" }}>{showInvoiceForm?"Cancel":"+ New"}</div>
          </div>
          {showInvoiceForm && (
            <Card style={{ marginBottom:12 }}>
              <SLabel color="#38bdf8">New Invoice</SLabel>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <input value={invoiceForm.clientName} onChange={e => setInvoiceForm(v=>({...v,clientName:e.target.value}))} placeholder="Client name *" style={inputStyle}/>
                <input value={invoiceForm.clientEmail} onChange={e => setInvoiceForm(v=>({...v,clientEmail:e.target.value}))} placeholder="Client email" type="email" style={inputStyle}/>
                {/* Line item calculator */}
                <LineItemCalculator onUpdate={(amount, desc, lines) => setInvoiceForm(v=>({...v, amount:String(amount), description:desc, lineItems:lines}))}/>
                <input value={invoiceForm.amount} onChange={e => setInvoiceForm(v=>({...v,amount:e.target.value}))} placeholder="Total amount *" type="number" style={inputStyle}/>
                <input value={invoiceForm.description} onChange={e => setInvoiceForm(v=>({...v,description:e.target.value}))} placeholder="Description (auto-filled above)" style={inputStyle}/>
                <textarea value={invoiceForm.lineItems} onChange={e => setInvoiceForm(v=>({...v,lineItems:e.target.value}))} placeholder="Line items detail" rows={3} style={{...inputStyle,resize:"none"}}/>
                <input value={invoiceForm.dueDate} onChange={e => setInvoiceForm(v=>({...v,dueDate:e.target.value}))} placeholder="Due date (YYYY-MM-DD)" style={inputStyle}/>
                <textarea value={invoiceForm.notes} onChange={e => setInvoiceForm(v=>({...v,notes:e.target.value}))} placeholder="Notes / payment terms" rows={2} style={{...inputStyle,resize:"none"}}/>
                <div onClick={saveInvoice} style={{ padding:"11px", borderRadius:10, cursor:"pointer", textAlign:"center", background:"rgba(56,189,248,0.12)", border:"1.5px solid rgba(56,189,248,0.3)", fontSize:13, fontWeight:700, color:"#38bdf8" }}>Create Invoice</div>
              </div>
            </Card>
          )}
          {invoicesLoading && <div style={{ textAlign:"center", padding:"20px", color:"#64748b" }}>Loading...</div>}
          {!invoicesLoading && filteredInvoices.length===0 && <div style={{ textAlign:"center", padding:"30px", color:"#475569", fontSize:13 }}>No invoices found.</div>}
          {filteredInvoices.map(inv => {
            const statusColors = { Draft:"#64748b", Sent:"#38bdf8", Paid:"#22c55e", Overdue:"#ef4444" };
            const sc = statusColors[inv.status] || "#64748b";
            return (
              <Card key={inv.$id} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                      <div style={{ fontSize:14, fontWeight:800, color:"#dde8f4" }}>{inv.clientName}</div>
                      <span style={{ fontSize:9, fontWeight:800, color:sc, background:`${sc}18`, padding:"2px 8px", borderRadius:5 }}>{inv.status||"Draft"}</span>
                    </div>
                    {inv.invoiceNumber && <div style={{ fontSize:10, color:"#475569", marginBottom:2 }}>{inv.invoiceNumber}</div>}
                    {inv.description && <div style={{ fontSize:12, color:"#8099b0", marginBottom:2 }}>{inv.description}</div>}
                    {inv.dueDate && <div style={{ fontSize:11, color:"#64748b" }}>Due: {inv.dueDate}</div>}
                    {inv.paidDate && <div style={{ fontSize:11, color:"#22c55e" }}>Paid: {inv.paidDate}</div>}
                  </div>
                  <div style={{ fontSize:20, fontWeight:900, color:sc, flexShrink:0 }}>{formatCurrency(inv.amount)}</div>
                </div>
                {inv.status !== "Paid" && (
                  <div style={{ display:"flex", gap:8 }}>
                    {inv.status==="Draft" && <div onClick={() => updateInvoiceStatus(inv.$id,"Sent")} style={{ flex:1, padding:"8px", borderRadius:8, cursor:"pointer", textAlign:"center", background:"rgba(56,189,248,0.1)", border:"1px solid rgba(56,189,248,0.25)", fontSize:11, fontWeight:700, color:"#38bdf8" }}>Mark Sent</div>}
                    <div onClick={() => updateInvoiceStatus(inv.$id,"Paid")} style={{ flex:1, padding:"8px", borderRadius:8, cursor:"pointer", textAlign:"center", background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.25)", fontSize:11, fontWeight:700, color:"#22c55e" }}>Mark Paid</div>
                    <div onClick={() => updateInvoiceStatus(inv.$id,"Overdue")} style={{ flex:1, padding:"8px", borderRadius:8, cursor:"pointer", textAlign:"center", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", fontSize:11, fontWeight:700, color:"#f87171" }}>Overdue</div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ── ONBOARDING ── */}
      {tab === "onboard" && (
        <OnboardingChecklist/>
      )}

      {/* ── WRITING ── */}
      {tab === "writing" && (
        <div>
          <Card style={{ background:"rgba(167,139,250,0.05)", borderColor:"rgba(167,139,250,0.2)", marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#a78bfa", marginBottom:4 }}>Business Writing Assistant</div>
            <div style={{ fontSize:12, color:"#64748b", lineHeight:1.6 }}>Paste your text and choose a tone. The AI rewrites it to sound professional and human.</div>
          </Card>
          <div style={{ marginBottom:12 }}>
            <SLabel color="#a78bfa">Tone</SLabel>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {[{k:"professional",l:"Professional"},{k:"friendly",l:"Friendly"},{k:"direct",l:"Direct"},{k:"confident",l:"Confident"},{k:"formal",l:"Formal"}].map(t => (
                <div key={t.k} onClick={() => setWritingTone(t.k)} style={{ padding:"8px 14px", borderRadius:10, cursor:"pointer", fontSize:12, fontWeight:writingTone===t.k?800:600, background:writingTone===t.k?"rgba(167,139,250,0.15)":"rgba(255,255,255,0.03)", border:`1.5px solid ${writingTone===t.k?"rgba(167,139,250,0.35)":"rgba(255,255,255,0.07)"}`, color:writingTone===t.k?"#a78bfa":"#64748b" }}>{t.l}</div>
              ))}
            </div>
          </div>
          <textarea value={writingInput} onChange={e => setWritingInput(e.target.value)} placeholder="Paste your text here..." rows={5} style={{ background:"rgba(255,255,255,0.05)", border:"1.5px solid rgba(167,139,250,0.2)", borderRadius:12, padding:"14px 16px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"none", width:"100%", lineHeight:1.6, color:"#dde8f4", marginBottom:10 }}/>
          <div onClick={writingLoading?null:handleRewrite} style={{ padding:"13px", borderRadius:12, cursor:writingLoading?"not-allowed":"pointer", textAlign:"center", background:writingLoading?"rgba(255,255,255,0.02)":"rgba(167,139,250,0.12)", border:`1.5px solid ${writingLoading?"rgba(255,255,255,0.06)":"rgba(167,139,250,0.3)"}`, fontSize:14, fontWeight:700, color:writingLoading?"#475569":"#a78bfa", marginBottom:16 }}>{writingLoading?"Rewriting...":"Rewrite"}</div>
          {writingOutput && (
            <Card style={{ background:"rgba(167,139,250,0.05)", borderColor:"rgba(167,139,250,0.2)" }}>
              <SLabel color="#a78bfa">Rewritten</SLabel>
              <div style={{ fontSize:13, color:"#dde8f4", lineHeight:1.75, whiteSpace:"pre-wrap", marginBottom:12 }}>{writingOutput}</div>
              <div onClick={() => { navigator.clipboard.writeText(writingOutput); setStatusMsg("Copied ✓"); }} style={{ padding:"10px", borderRadius:10, cursor:"pointer", textAlign:"center", background:"rgba(167,139,250,0.08)", border:"1px solid rgba(167,139,250,0.2)", fontSize:12, fontWeight:700, color:"#a78bfa" }}>Copy to Clipboard</div>
            </Card>
          )}
        </div>
      )}

      {/* ── QR CODE ── */}
      {tab === "qr" && <QRGenerator onStatus={setStatusMsg}/>}

      {/* ── JOIN CODES ── */}
      {tab === "poster" && (
        <QRPosterGenerator agency={agency} onStatus={setStatusMsg}/>
      )}

      {tab === "codes" && (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <Card style={{ background:"rgba(56,189,248,0.05)", borderColor:"rgba(56,189,248,0.15)" }}>
            <div style={{ fontSize:13, fontWeight:800, color:"#38bdf8", marginBottom:4 }}>🔑 Rotating Join Codes</div>
            <div style={{ fontSize:12, color:"#64748b", lineHeight:1.6 }}>Generate time-limited codes for agencies. Each code expires after a set number of uses or hours. Prevents leaked codes from being reused.</div>
          </Card>

          {/* Generate form */}
          <Card>
            <SLabel color="#38bdf8">Generate New Code</SLabel>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:8 }}>
              <input value={codeAgency} onChange={e=>setCodeAgency(e.target.value)} placeholder="Agency code (e.g. FIRE07)" style={inputStyle}/>
              <div style={{ display:"flex", gap:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:"#64748b", marginBottom:4 }}>Max uses</div>
                  <input value={codeMaxUses} onChange={e=>setCodeMaxUses(e.target.value)} type="number" placeholder="50" style={inputStyle}/>
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:11, color:"#64748b", marginBottom:4 }}>Expires after (hours)</div>
                  <input value={codeExpireH} onChange={e=>setCodeExpireH(e.target.value)} type="number" placeholder="72" style={inputStyle}/>
                </div>
              </div>
              <div onClick={generateCode} style={{ padding:"12px", borderRadius:10, cursor:"pointer", textAlign:"center", background:"rgba(56,189,248,0.12)", border:"1.5px solid rgba(56,189,248,0.3)", fontSize:13, fontWeight:700, color:"#38bdf8" }}>
                Generate Code
              </div>
            </div>
          </Card>

          {/* Active codes */}
          {joinCodes.length === 0 && (
            <div style={{ textAlign:"center", padding:"30px", color:"#334155", fontSize:13 }}>No codes generated yet.</div>
          )}
          {joinCodes.map(c => {
            const expired = isExpired(c);
            return (
              <div key={c.id} style={{ background: expired ? "rgba(255,255,255,0.02)" : "rgba(56,189,248,0.05)", border:`1px solid ${expired ? "rgba(255,255,255,0.06)" : "rgba(56,189,248,0.15)"}`, borderRadius:14, padding:"14px 16px", opacity: expired ? 0.5 : 1 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                  <div style={{ fontSize:18, fontWeight:900, color: expired ? "#475569" : "#38bdf8", letterSpacing:"0.1em", fontFamily:"monospace" }}>{c.code}</div>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    {expired && <span style={{ fontSize:10, fontWeight:700, color:"#ef4444", background:"rgba(239,68,68,0.1)", padding:"2px 8px", borderRadius:5 }}>EXPIRED</span>}
                    <div onClick={() => revokeCode(c.id)} style={{ fontSize:11, color:"#f87171", cursor:"pointer", padding:"4px 8px", borderRadius:6, background:"rgba(239,68,68,0.08)" }}>Revoke</div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:16, fontSize:11, color:"#64748b" }}>
                  <span>Agency: <strong style={{ color:"#8099b0" }}>{c.agency}</strong></span>
                  <span>Uses: <strong style={{ color: c.uses >= c.maxUses ? "#ef4444" : "#8099b0" }}>{c.uses}/{c.maxUses}</strong></span>
                  <span style={{ color: expired ? "#ef4444" : "#22c55e" }}>{timeLeft(c)}</span>
                </div>
                {!expired && (
                  <div style={{ marginTop:8, fontSize:11, color:"#334155", wordBreak:"break-all" }}>
                    https://upstreampst.netlify.app?code={c.agency}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </ScreenSingle>
  );
}
