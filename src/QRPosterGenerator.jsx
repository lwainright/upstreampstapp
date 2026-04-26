// ============================================================
// COMPONENT: QRPosterGenerator
// Upstream Initiative — PST QR Poster Generator
// Generates printable poster: "Had a rough call? Scan here"
// Downloads as PNG — print-ready
// ============================================================
import React, { useState, useRef, useEffect } from 'react';
import { Card, SLabel } from './ui.jsx';

const POSTER_TEMPLATES = [
  {
    key: "pst_request",
    label: "PST Request Poster",
    headline: "Had a rough call?",
    subline: "Scan for confidential peer support",
    body: "Anonymous · Confidential · Available 24/7",
    color: "#ef4444",
    bg: "#0a1628",
  },
  {
    key: "general",
    label: "General App Access",
    headline: "Upstream Approach",
    subline: "First Responder Wellness",
    body: "Scan to access tools, resources & peer support",
    color: "#38bdf8",
    bg: "#0a1628",
  },
  {
    key: "family",
    label: "Family Access Poster",
    headline: "Family Support",
    subline: "Resources for first responder families",
    body: "Scan to access confidential family wellness tools",
    color: "#a78bfa",
    bg: "#0a1628",
  },
  {
    key: "veteran",
    label: "Veteran Support Poster",
    headline: "Veteran Support",
    subline: "Resources, tools & peer connection",
    body: "Scan for confidential veteran wellness support",
    color: "#22c55e",
    bg: "#0a1628",
  },
];

export default function QRPosterGenerator({ agency, onStatus }) {
  const [template, setTemplate] = useState("pst_request");
  const [customHeadline, setCustomHeadline] = useState("");
  const [customSubline, setCustomSubline] = useState("");
  const [agencyCodeOverride, setAgencyCodeOverride] = useState(agency?.code || "");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(agency?.logoUrl || "");
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [posterType, setPosterType] = useState("pst"); // pst | join
  const canvasRef = useRef(null);
  const fileRef = useRef(null);
  const posterCanvasRef = useRef(null);

  const tpl = POSTER_TEMPLATES.find(t => t.key === template) || POSTER_TEMPLATES[0];
  const headline = customHeadline || tpl.headline;
  const subline = customSubline || tpl.subline;
  const agencyCode = agencyCodeOverride || agency?.code || "SCAN";

  const targetUrl = posterType === "pst"
    ? `https://upstreampst.netlify.app/pst?code=${agencyCode}`
    : `https://upstreampst.netlify.app?code=${agencyCode}`;

  const loadQRLib = () => new Promise((resolve) => {
    if (window.QRCode) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    s.onload = resolve;
    document.head.appendChild(s);
  });

  const generatePoster = async () => {
    setGenerating(true);
    try {
      await loadQRLib();

      // Generate QR code
      const qrSize = 280;
      const tempDiv = document.createElement('div');
      document.body.appendChild(tempDiv);
      tempDiv.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';

      new window.QRCode(tempDiv, {
        text: targetUrl,
        width: qrSize,
        height: qrSize,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: window.QRCode.CorrectLevel.H,
      });

      await new Promise(r => setTimeout(r, 400));
      const qrCanvas = tempDiv.querySelector('canvas');
      if (!qrCanvas) { document.body.removeChild(tempDiv); return; }

      // Draw poster
      const canvas = posterCanvasRef.current;
      const W = 800;
      const H = 1100;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = tpl.bg;
      ctx.fillRect(0, 0, W, H);

      // Top color bar
      ctx.fillStyle = tpl.color;
      ctx.fillRect(0, 0, W, 8);

      // Agency name / branding
      const agencyName = agency?.name || agencyCode;
      ctx.fillStyle = tpl.color + "40";
      ctx.fillRect(0, 8, W, 60);

      ctx.fillStyle = tpl.color;
      ctx.font = 'bold 16px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`POWERED BY ${agencyName.toUpperCase()}`, W / 2, 46);

      // Headline
      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 56px Arial, sans-serif';
      ctx.textAlign = 'center';

      // Word wrap headline
      const words = headline.split(' ');
      let line = '';
      let y = 160;
      for (let i = 0; i < words.length; i++) {
        const test = line + words[i] + ' ';
        if (ctx.measureText(test).width > W - 80 && i > 0) {
          ctx.fillText(line.trim(), W / 2, y);
          line = words[i] + ' ';
          y += 65;
        } else {
          line = test;
        }
      }
      ctx.fillText(line.trim(), W / 2, y);

      // Subline
      y += 50;
      ctx.fillStyle = tpl.color;
      ctx.font = 'bold 28px Arial, sans-serif';
      ctx.fillText(subline, W / 2, y);

      // QR code area
      const qrX = (W - qrSize - 48) / 2;
      const qrY = y + 40;

      // White rounded rect for QR
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 48, 20);
      ctx.fill();

      // Draw QR
      ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

      // Logo overlay on QR
      if (logoPreview) {
        await new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            const lSize = qrSize * 0.26;
            const lX = qrX + (qrSize - lSize) / 2;
            const lY = qrY + (qrSize - lSize) / 2;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(lX - 6, lY - 6, lSize + 12, lSize + 12, 8);
            ctx.fill();
            ctx.drawImage(img, lX, lY, lSize, lSize);
            resolve();
          };
          img.onerror = resolve;
          img.src = logoPreview;
        });
      }

      // Body text
      const bodyY = qrY + qrSize + 80;
      ctx.fillStyle = '#94a3b8';
      ctx.font = '22px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tpl.body, W / 2, bodyY);

      // Confidentiality line
      ctx.fillStyle = tpl.color + "80";
      ctx.font = 'bold 18px Arial, sans-serif';
      ctx.fillText('🔒 Anonymous · Confidential · No login required', W / 2, bodyY + 44);

      // URL below QR
      ctx.fillStyle = '#334155';
      ctx.font = '14px Arial, sans-serif';
      ctx.fillText(targetUrl, W / 2, bodyY + 84);

      // Bottom bar
      ctx.fillStyle = tpl.color;
      ctx.fillRect(0, H - 8, W, 8);

      // Upstream branding at bottom
      ctx.fillStyle = '#334155';
      ctx.font = '13px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Upstream Approach · upstreampst.netlify.app', W / 2, H - 24);

      document.body.removeChild(tempDiv);
      setGenerated(true);
    } catch(e) {
      onStatus?.("Poster generation failed: " + e.message);
    }
    setGenerating(false);
  };

  const downloadPoster = () => {
    const canvas = posterCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `upstream-pst-poster-${agencyCode}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    onStatus?.("Poster downloaded ✓");
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 8, padding: "8px 10px",
    color: "#dde8f4", fontSize: 12,
    fontFamily: "'DM Sans',sans-serif",
    outline: "none", width: "100%",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      <Card style={{ background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.2)" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444", marginBottom: 4 }}>🖨 PST Poster Generator</div>
        <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>Generate a print-ready poster with your agency branding and a QR code. Post in stations, vehicles, locker rooms. Download as PNG.</div>
      </Card>

      {/* Poster type */}
      <div>
        <SLabel color="#38bdf8">Poster Type</SLabel>
        <div style={{ display: "flex", gap: 8 }}>
          {[
            { key: "pst",  label: "PST Request",   sub: "Links to request form" },
            { key: "join", label: "App Join",       sub: "Links to full app" },
          ].map(t => (
            <div key={t.key} onClick={() => { setPosterType(t.key); setGenerated(false); }}
              style={{ flex: 1, padding: "10px 12px", borderRadius: 10, cursor: "pointer", background: posterType === t.key ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${posterType === t.key ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)"}`, textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: posterType === t.key ? "#ef4444" : "#8099b0" }}>{t.label}</div>
              <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{t.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Template */}
      <div>
        <SLabel color="#38bdf8">Message Template</SLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {POSTER_TEMPLATES.map(t => (
            <div key={t.key} onClick={() => { setTemplate(t.key); setCustomHeadline(""); setCustomSubline(""); setGenerated(false); }}
              style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer", background: template === t.key ? t.color + "10" : "rgba(255,255,255,0.03)", border: `1.5px solid ${template === t.key ? t.color + "40" : "rgba(255,255,255,0.07)"}`, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: t.color, flexShrink: 0 }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: template === t.key ? t.color : "#dde8f4" }}>{t.label}</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 1 }}>"{t.headline}" · "{t.subline}"</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom text */}
      <div>
        <SLabel color="#38bdf8">Custom Text (optional — overrides template)</SLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input value={customHeadline} onChange={e => { setCustomHeadline(e.target.value); setGenerated(false); }} placeholder={`Headline: "${tpl.headline}"`} style={inputStyle}/>
          <input value={customSubline} onChange={e => { setCustomSubline(e.target.value); setGenerated(false); }} placeholder={`Subline: "${tpl.subline}"`} style={inputStyle}/>
        </div>
      </div>

      {/* Agency code */}
      <div>
        <SLabel color="#38bdf8">Agency Code</SLabel>
        <input value={agencyCodeOverride} onChange={e => { setAgencyCodeOverride(e.target.value.toUpperCase()); setGenerated(false); }} placeholder="e.g. NCLEAP" style={inputStyle}/>
        <div style={{ fontSize: 10, color: "#475569", marginTop: 4 }}>QR will link to: {targetUrl}</div>
      </div>

      {/* Logo */}
      <div>
        <SLabel color="#38bdf8">Agency Logo (centered on QR)</SLabel>
        <input ref={fileRef} type="file" accept="image/*" onChange={e => {
          const file = e.target.files?.[0];
          if (!file) return;
          setLogoFile(file);
          const reader = new FileReader();
          reader.onload = ev => { setLogoPreview(ev.target.result); setGenerated(false); };
          reader.readAsDataURL(file);
        }} style={{ display: "none" }}/>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div onClick={() => fileRef.current?.click()} style={{ padding: "9px 14px", borderRadius: 9, cursor: "pointer", background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", fontSize: 11, fontWeight: 700, color: "#38bdf8" }}>
            {logoPreview ? "Change Logo" : "Upload Logo"}
          </div>
          {logoPreview && (
            <>
              <img src={logoPreview} style={{ height: 36, width: 36, objectFit: "cover", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)" }} onError={e => e.target.style.display = "none"}/>
              <div onClick={() => { setLogoPreview(""); setLogoFile(null); setGenerated(false); }} style={{ fontSize: 11, color: "#f87171", cursor: "pointer" }}>Remove</div>
            </>
          )}
        </div>
      </div>

      {/* Generate button */}
      <div onClick={generating ? null : generatePoster} style={{ padding: "13px", borderRadius: 12, cursor: generating ? "not-allowed" : "pointer", textAlign: "center", background: generating ? "rgba(255,255,255,0.03)" : "rgba(239,68,68,0.1)", border: `1.5px solid ${generating ? "rgba(255,255,255,0.07)" : "rgba(239,68,68,0.3)"}`, fontSize: 14, fontWeight: 700, color: generating ? "#334155" : "#ef4444" }}>
        {generating ? "Generating..." : "🖨 Generate Poster"}
      </div>

      {/* Hidden canvas for poster */}
      <canvas ref={posterCanvasRef} style={{ display: "none" }}/>

      {/* Preview + download */}
      {generated && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", textAlign: "center" }}>✓ Poster ready</div>
          <canvas ref={posterCanvasRef} style={{ width: "100%", height: "auto", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)" }}/>
          <div onClick={downloadPoster} style={{ padding: "13px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(34,197,94,0.1)", border: "1.5px solid rgba(34,197,94,0.3)", fontSize: 14, fontWeight: 700, color: "#22c55e" }}>
            ⬇ Download PNG
          </div>
          <div style={{ fontSize: 11, color: "#475569", textAlign: "center", lineHeight: 1.6 }}>
            Print at any size — recommended 8.5×11" or 11×17". Post in stations, vehicles, locker rooms, and briefing rooms.
          </div>
        </div>
      )}
    </div>
  );
}
