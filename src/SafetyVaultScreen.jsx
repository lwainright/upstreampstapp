// ============================================================
// SCREEN: SafetyVaultScreen
// Upstream Initiative - Protected Safety Area
// Zero partner visibility. Zero agency reporting.
// User-controlled only.
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import MedicalVaultSection from './MedicalVaultSection';

// -- Quick Exit ------------------------------------------------
// Always available - redirects to neutral screen instantly
function QuickExitButton() {
  return (
    <div
      onClick={() => {
        // Clear navigation history and redirect to neutral page
        try { sessionStorage.removeItem("upstream_vault_open"); } catch(e) {}
        window.location.replace("https://weather.com");
      }}
      style={{
        position: "fixed", top: 12, right: 12, zIndex: 9999,
        background: "rgba(100,116,139,0.9)", border: "1px solid rgba(255,255,255,0.2)",
        borderRadius: 8, padding: "6px 12px", cursor: "pointer",
        fontSize: 11, fontWeight: 800, color: "#f1f5f9",
        letterSpacing: "0.08em", backdropFilter: "blur(8px)",
      }}
    >
      ✕ EXIT
    </div>
  );
}

// -- Voice Note Recorder ----------------------------------------
function SafetyRecorder({ onClose }) {
  const [recording, setRecording] = useState(false);
  const [saved, setSaved] = useState(false);
  const [text, setText] = useState("");
  const [tag, setTag] = useState(null);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);

  const tags = [
    { key: "unsafe",   label: "Felt unsafe",          color: "#ef4444" },
    { key: "verbal",   label: "Verbal escalation",     color: "#f97316" },
    { key: "physical", label: "Physical safety concern",color: "#ef4444" },
    { key: "emotional",label: "Emotional strain",      color: "#eab308" },
    { key: "incident", label: "Incident",              color: "#ef4444" },
  ];

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        // Save to localStorage as base64
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const notes = JSON.parse(localStorage.getItem("upstream_safety_notes") || "[]");
            notes.push({
              id: Date.now(),
              type: "audio",
              url: reader.result,
              tag,
              text,
              timestamp: new Date().toISOString(),
            });
            localStorage.setItem("upstream_safety_notes", JSON.stringify(notes));
            setSaved(true);
          } catch(e) {}
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
    } catch(e) {
      alert("Microphone access needed for voice notes.");
    }
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const saveText = () => {
    if (!text.trim()) return;
    try {
      const notes = JSON.parse(localStorage.getItem("upstream_safety_notes") || "[]");
      notes.push({ id: Date.now(), type: "text", text, tag, timestamp: new Date().toISOString() });
      localStorage.setItem("upstream_safety_notes", JSON.stringify(notes));
      setSaved(true);
    } catch(e) {}
  };

  if (saved) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "20px 0" }}>
      <div style={{ fontSize: 44 }}>🔒</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#dde8f4" }}>Saved to your device</div>
      <div style={{ fontSize: 13, color: "#64748b", textAlign: "center", lineHeight: 1.6 }}>
        Only you can access this. It is not shared with anyone.
      </div>
      <div onClick={onClose} style={{ padding: "12px 28px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 13, fontWeight: 700, color: "#8099b0", cursor: "pointer" }}>Done</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
        This note is saved only to your device. You control what happens to it. Nothing is shared with anyone.
      </div>

      {/* Tag selector */}
      <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase" }}>What happened?</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {tags.map(t => (
          <div key={t.key} onClick={() => setTag(tag === t.key ? null : t.key)} style={{ padding: "7px 12px", borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600, background: tag === t.key ? t.color + "20" : "rgba(255,255,255,0.04)", border: `1.5px solid ${tag === t.key ? t.color : "rgba(255,255,255,0.08)"}`, color: tag === t.key ? t.color : "#64748b" }}>
            {t.label}
          </div>
        ))}
      </div>

      {/* Text note */}
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Write what happened (optional)..."
        rows={4}
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 14px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", resize: "none", color: "#dde8f4", lineHeight: 1.6 }}
      />

      {/* Voice note */}
      <div onClick={recording ? stopRecording : startRecording} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "14px", borderRadius: 12, cursor: "pointer", background: recording ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.04)", border: `1.5px solid ${recording ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.08)"}`, fontSize: 14, fontWeight: 700, color: recording ? "#f87171" : "#8099b0" }}>
        {recording ? (
          <><div style={{ display: "flex", gap: 3 }}>{[1,2,3,4].map(i => <div key={i} style={{ width: 3, background: "#f87171", borderRadius: 2, height: 8 + i * 4 }}/>)}</div> Stop Recording</>
        ) : (
          <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg> Start Voice Note</>
        )}
      </div>

      {/* Save text */}
      {text.trim() && !recording && (
        <div onClick={saveText} style={{ padding: "13px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(56,189,248,0.1)", border: "1.5px solid rgba(56,189,248,0.25)", fontSize: 13, fontWeight: 700, color: "#38bdf8" }}>
          Save Note
        </div>
      )}

      <div onClick={onClose} style={{ textAlign: "center", fontSize: 12, color: "#334155", cursor: "pointer", textDecoration: "underline" }}>Cancel</div>
    </div>
  );
}

// -- Safety Plan ------------------------------------------------
function SafetyPlan({ onClose }) {
  const steps = [
    { icon: "🏠", title: "Safe places to go", body: "Identify at least 2 places you can go if you need to leave quickly — a neighbor, family member, or public space." },
    { icon: "📞", title: "People you can call", body: "Keep a mental list of 2-3 trusted people who know your situation and can help without judgment." },
    { icon: "🎒", title: "Go bag essentials", body: "ID, Social Security card, medications, cash, phone charger, important documents. Keep copies somewhere safe outside the home." },
    { icon: "💻", title: "Safe communication", body: "If your devices may be monitored, use a library computer or a trusted person's phone to reach out for help." },
    { icon: "📝", title: "Code word", body: "Set a code word with a trusted person — when you use it, they know to call for help without asking questions." },
    { icon: "⚖️", title: "Know your options", body: "Protective orders, restricted reporting, address confidentiality programs — a DV advocate can walk you through what applies to your situation." },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
        A safety plan is yours alone. Take what applies and leave what doesn't.
      </div>
      {steps.map((s, i) => (
        <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", display: "flex", gap: 14 }}>
          <div style={{ fontSize: 24, flexShrink: 0 }}>{s.icon}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#dde8f4", marginBottom: 4 }}>{s.title}</div>
            <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>{s.body}</div>
          </div>
        </div>
      ))}
      <div onClick={onClose} style={{ textAlign: "center", fontSize: 12, color: "#334155", cursor: "pointer", textDecoration: "underline", marginTop: 4 }}>Close</div>
    </div>
  );
}

// -- Behavior Awareness (Responder Self-Awareness Path) ---------
function BehaviorAwareness({ navigate, onClose }) {
  const [selected, setSelected] = useState([]);
  const [step, setStep] = useState("check");

  const behaviors = [
    { key: "command",    label: "I stay in command mode at home",              color: "#eab308" },
    { key: "irritable",  label: "Everything irritates me",                     color: "#eab308" },
    { key: "control",    label: "I feel the need to control things at home",    color: "#f97316" },
    { key: "scared",     label: "I've scared my partner or kids",              color: "#ef4444" },
    { key: "justify",    label: "I justify my reactions because of work",       color: "#f97316" },
    { key: "explosive",  label: "I go from 0 to 100 fast",                     color: "#ef4444" },
    { key: "numb",       label: "I don't feel anything... until I explode",     color: "#ef4444" },
    { key: "verbal",     label: "I've raised my voice or used intimidating language", color: "#ef4444" },
    { key: "physical",   label: "There has been pushing, grabbing, or blocking", color: "#dc2626" },
    { key: "objects",    label: "I've thrown or destroyed objects",             color: "#dc2626" },
    { key: "weapon",     label: "I've displayed a weapon to intimidate",        color: "#dc2626" },
  ];

  const toggle = (key) => {
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const hasSerious = selected.some(k => ["physical","objects","weapon"].includes(k));
  const hasModerate = selected.some(k => ["scared","explosive","numb","verbal"].includes(k));

  if (step === "support") return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 14, padding: "16px" }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: "#f87171", marginBottom: 8 }}>Stress explains. It does not excuse.</div>
        <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>What you're carrying is real. And the people at home deserve safety. Both things are true.</div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase" }}>Right now — pause</div>

      {[
        { icon: "🚶", title: "Step away", body: "Leave the space. Do not follow if they move away." },
        { icon: "💧", title: "Cold reset", body: "Cold water on face, step outside, or physical movement for 2 minutes." },
        { icon: "⏱", title: "20 minute buffer", body: "Do not re-engage for at least 20 minutes. This is not weakness — it is tactical." },
      ].map((s, i) => (
        <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "13px 15px", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ fontSize: 20 }}>{s.icon}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#dde8f4", marginBottom: 3 }}>{s.title}</div>
            <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{s.body}</div>
          </div>
        </div>
      ))}

      <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4 }}>Get support</div>
      {[
        { label: "First Responder Support Network", url: "https://www.frsn.org", color: "#38bdf8" },
        { label: "Badge of Life", url: "https://www.badgeoflife.org", color: "#a78bfa" },
        { label: "988 — Loss of control support", url: "tel:988", color: "#22c55e" },
        { label: "SAMHSA Helpline: 1-800-662-4357", url: "tel:18006624357", color: "#eab308" },
      ].map((r, i) => (
        <div key={i} onClick={() => window.open(r.url, '_blank')} style={{ padding: "12px 14px", borderRadius: 12, cursor: "pointer", background: r.color + "10", border: `1px solid ${r.color}25`, fontSize: 13, fontWeight: 700, color: r.color }}>
          {r.label} →
        </div>
      ))}

      <div onClick={() => navigate("aichat")} style={{ padding: "13px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(167,139,250,0.1)", border: "1.5px solid rgba(167,139,250,0.25)", fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>
        Talk to AI Peer Support →
      </div>
      <div onClick={onClose} style={{ textAlign: "center", fontSize: 12, color: "#334155", cursor: "pointer", textDecoration: "underline" }}>Close</div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 13, color: "#8099b0", lineHeight: 1.6 }}>
        Be honest. This is just between you and this screen. Check anything that's shown up at home.
      </div>
      {behaviors.map(b => (
        <div key={b.key} onClick={() => toggle(b.key)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, cursor: "pointer", background: selected.includes(b.key) ? b.color + "12" : "rgba(255,255,255,0.03)", border: `1.5px solid ${selected.includes(b.key) ? b.color + "50" : "rgba(255,255,255,0.07)"}`, transition: "all 0.15s" }}>
          <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${selected.includes(b.key) ? b.color : "rgba(255,255,255,0.15)"}`, background: selected.includes(b.key) ? b.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12 }}>
            {selected.includes(b.key) && "✓"}
          </div>
          <div style={{ fontSize: 13, color: selected.includes(b.key) ? b.color : "#8099b0", fontWeight: selected.includes(b.key) ? 600 : 400 }}>{b.label}</div>
        </div>
      ))}

      {selected.length > 0 && (
        <div onClick={() => setStep("support")} style={{ marginTop: 8, padding: "14px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(56,189,248,0.1)", border: "1.5px solid rgba(56,189,248,0.3)", fontSize: 14, fontWeight: 700, color: "#38bdf8" }}>
          See what to do next →
        </div>
      )}
      <div onClick={onClose} style={{ textAlign: "center", fontSize: 12, color: "#334155", cursor: "pointer", textDecoration: "underline" }}>Close</div>
    </div>
  );
}

// -- Secure AI Chat -------------------------------------------
function SecureAIChat({ onClose }) {
  const [messages, setMessages] = React.useState([{
    role: "assistant",
    content: "This conversation is completely private — nothing is stored anywhere. I'm here to listen, help you think through something, or just talk. What's on your mind?",
    id: Date.now(),
  }]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const bottomRef = React.useRef(null);

  React.useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg = { role: "user", content: text, id: Date.now() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are a confidential peer support AI inside a secure, PIN-protected vault. The user is a first responder, veteran, or family member who needs to talk about something sensitive in complete privacy. Rules: Be warm, steady, non-judgmental. Never alarm or catastrophize. Never tell them what to do. Never report or escalate. This is their space. If they describe a crisis or emergency, gently ask if they want crisis resources — never force them. Speak like a trusted peer, not a clinician. Keep responses concise — 2-4 sentences unless they need more. This conversation does not exist outside this session.`,
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const reply = data?.content?.[0]?.text || "I'm having trouble connecting. Try again.";
      setMessages(prev => [...prev, { role: "assistant", content: reply, id: Date.now() }]);
    } catch(e) { setMessages(prev => [...prev, { role: "assistant", content: "Connection issue — try again.", id: Date.now() }]); }
    setLoading(false);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12, minHeight:400 }}>
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:10, maxHeight:400, overflowY:"auto" }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display:"flex", justifyContent: msg.role==="user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth:"85%", background: msg.role==="user" ? "rgba(56,189,248,0.12)" : "rgba(255,255,255,0.04)", border:`1px solid ${msg.role==="user" ? "rgba(56,189,248,0.25)" : "rgba(255,255,255,0.08)"}`, borderRadius: msg.role==="user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding:"11px 14px" }}>
              <div style={{ fontSize:13, color:"#dde8f4", lineHeight:1.7, whiteSpace:"pre-wrap" }}>{msg.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:"flex", gap:6, padding:"12px 14px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"16px 16px 16px 4px", width:"fit-content" }}>
            {[0,1,2].map(i => <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:"#38bdf8", opacity:0.6 }}/>)}
          </div>
        )}
        <div ref={bottomRef}/>
      </div>
      <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
        <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} }} placeholder="Say anything..." rows={2}
          style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"10px 14px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"none", color:"#dde8f4" }}/>
        <div onClick={send} style={{ width:44, height:44, borderRadius:12, cursor:"pointer", background:"rgba(56,189,248,0.12)", border:"1.5px solid rgba(56,189,248,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </div>
      </div>
      <div style={{ fontSize:10, color:"#334155", textAlign:"center" }}>Zero storage · Session only · Nothing logged anywhere</div>
    </div>
  );
}

// -- Main Safety Vault -----------------------------------------
function FaithSection({ faith }) {
  const [open, setOpen] = React.useState(false);
  const data = {
    christian: { label:"Christian", color:"#38bdf8" },
    muslim:    { label:"Muslim",    color:"#22c55e" },
    jewish:    { label:"Jewish",   color:"#eab308" },
    buddhist:  { label:"Buddhist", color:"#a78bfa" },
  }[faith] || { label:faith, color:"#94a3b8" };

  const faithData = SPIRITUALITY_SUPPORT.faithSpecific[faith];
  if (!faithData) return null;

  return (
    <div style={{ background:"rgba(255,255,255,0.025)", border:`1px solid ${open?data.color+"40":"rgba(255,255,255,0.06)"}`, borderRadius:10, overflow:"hidden", marginBottom:8 }}>
      <div onClick={() => setOpen(o=>!o)} style={{ padding:"11px 14px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ fontSize:13, fontWeight:700, color:open?data.color:"#dde8f4" }}>{data.label}</div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5" style={{ transform:open?"rotate(90deg)":"none", transition:"transform 0.2s" }}><polyline points="9 18 15 12 9 6"/></svg>
      </div>
      {open && (
        <div style={{ padding:"0 14px 14px" }}>
          {faithData.shortVerses && faithData.shortVerses.map((v,i) => (
            <div key={i} style={{ background:"rgba(255,255,255,0.03)", borderRadius:8, padding:"10px 12px", marginBottom:6 }}>
              <div style={{ fontSize:11, fontWeight:700, color:data.color, marginBottom:3 }}>{v.reference}</div>
              <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.7, fontStyle:"italic" }}>{v.text}</div>
            </div>
          ))}
          {faithData.encouragement && (
            <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.7, marginTop:8, fontStyle:"italic" }}>{faithData.encouragement}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SafetyVaultScreen({ navigate, onClose }) {
  const [pin, setPin] = useState("");
  const [pinSet, setPinSet] = useState(() => {
    try { return !!localStorage.getItem("upstream_vault_pin"); } catch(e) { return false; }
  });
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [unlocked, setUnlocked] = useState(() => {
    // Already chose no PIN previously -- go straight in
    try { return localStorage.getItem("upstream_vault_no_pin") === "true"; } catch(e) { return false; }
  });
  const [pinError, setPinError] = useState("");
  const [section, setSection] = useState(null);
  const [settingPin, setSettingPin] = useState(false);

  // Mark vault open in session
  useEffect(() => {
    try { sessionStorage.setItem("upstream_vault_open", "1"); } catch(e) {}
    return () => { try { sessionStorage.removeItem("upstream_vault_open"); } catch(e) {} };
  }, []);

  const handleUnlock = () => {
    try {
      const stored = localStorage.getItem("upstream_vault_pin");
      if (stored === pin) {
        setUnlocked(true);
        setPinError("");
      } else {
        setPinError("Incorrect PIN");
        setPin("");
      }
    } catch(e) {}
  };

  const handleSetPin = () => {
    if (newPin.length < 4) { setPinError("PIN must be at least 4 digits"); return; }
    if (newPin !== confirmPin) { setPinError("PINs don't match"); return; }
    try {
      localStorage.setItem("upstream_vault_pin", newPin);
      setPinSet(true);
      setSettingPin(false);
      setUnlocked(true);
      setPinError("");
    } catch(e) {}
  };

  // -- First Time / PIN Setup --
  // If they already chose no-PIN in a previous session, skip the gate entirely
  const hasNoPinChoice = (() => { try { return localStorage.getItem("upstream_vault_no_pin") === "true"; } catch(e) { return false; } })();
  if ((!pinSet && !hasNoPinChoice) || settingPin) return (
    <div style={{ position: "fixed", inset: 0, background: "#040d18", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", fontFamily: "'DM Sans',sans-serif", zIndex: 9000 }}>
      <QuickExitButton/>
      <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ fontSize: 44, textAlign: "center" }}>🔒</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#dde8f4", textAlign: "center" }}>Private Safety Area</div>
        <div style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", lineHeight: 1.7 }}>
          This is your private space. Set a PIN now to protect it, enter without one, or come back later — everything is here either way.
        </div>

        {!settingPin ? (<>
          <div onClick={() => setSettingPin(true)} style={{ padding: "14px 16px", borderRadius: 14, cursor: "pointer", background: "rgba(56,189,248,0.1)", border: "1.5px solid rgba(56,189,248,0.3)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 22 }}>🔐</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#38bdf8" }}>Set a PIN now</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>Recommended — protects this space from others</div>
            </div>
          </div>
          <div onClick={() => { try { localStorage.setItem("upstream_vault_no_pin","true"); } catch(e){} setUnlocked(true); }}
            style={{ padding: "14px 16px", borderRadius: 14, cursor: "pointer", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 22 }}>🚪</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#dde8f4" }}>Enter without a PIN</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>You can set one later in Settings</div>
            </div>
          </div>
          <div onClick={onClose} style={{ padding: "12px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 12, fontWeight: 600, color: "#64748b" }}>
            Not now — come back later
          </div>
          <div style={{ marginTop: 4, textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>
            <div style={{ fontSize: 11, color: "#334155", marginBottom: 8 }}>Need immediate help?</div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <div onClick={() => window.location.href = "tel:911"} style={{ padding: "10px 16px", borderRadius: 10, cursor: "pointer", background: "rgba(239,68,68,0.12)", border: "1.5px solid rgba(239,68,68,0.3)", fontSize: 13, fontWeight: 800, color: "#ef4444" }}>📞 911</div>
              <div onClick={() => window.location.href = "tel:18007997233"} style={{ padding: "10px 16px", borderRadius: 10, cursor: "pointer", background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", fontSize: 12, fontWeight: 700, color: "#38bdf8" }}>DV Hotline</div>
            </div>
          </div>
        </>) : (<>
          <input type="password" value={newPin} onChange={e => setNewPin(e.target.value)} placeholder="Create PIN (4+ digits)" inputMode="numeric" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 16px", fontSize: 18, fontFamily: "'DM Sans',sans-serif", outline: "none", color: "#dde8f4", textAlign: "center", letterSpacing: "0.3em" }}/>
          <input type="password" value={confirmPin} onChange={e => setConfirmPin(e.target.value)} placeholder="Confirm PIN" inputMode="numeric" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 16px", fontSize: 18, fontFamily: "'DM Sans',sans-serif", outline: "none", color: "#dde8f4", textAlign: "center", letterSpacing: "0.3em" }}/>
          {pinError && <div style={{ fontSize: 12, color: "#f87171", textAlign: "center" }}>{pinError}</div>}
          <div onClick={handleSetPin} style={{ padding: "14px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(56,189,248,0.12)", border: "1.5px solid rgba(56,189,248,0.3)", fontSize: 14, fontWeight: 700, color: "#38bdf8" }}>Set PIN</div>
          <div onClick={() => setSettingPin(false)} style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", cursor: "pointer", textDecoration: "underline" }}>← Back</div>
        </>)}
      </div>
    </div>
  );

  // -- PIN Entry --
  // No-PIN check is now handled in useState initializer above

  if (!unlocked) return (
    <div style={{ position: "fixed", inset: 0, background: "#040d18", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", fontFamily: "'DM Sans',sans-serif", zIndex: 9000 }}>
      <QuickExitButton/>
      <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 20, alignItems: "center" }}>
        <div style={{ fontSize: 44 }}>🔒</div>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#dde8f4" }}>Private Area</div>
        <div style={{ fontSize: 13, color: "#64748b", textAlign: "center" }}>Enter your PIN to continue</div>
        <input
          type="password"
          value={pin}
          onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleUnlock()}
          placeholder="PIN"
          inputMode="numeric"
          autoFocus
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 16px", fontSize: 24, fontFamily: "'DM Sans',sans-serif", outline: "none", color: "#dde8f4", textAlign: "center", letterSpacing: "0.4em", width: "100%" }}
        />
        {pinError && <div style={{ fontSize: 12, color: "#f87171" }}>{pinError}</div>}
        <div onClick={handleUnlock} style={{ width: "100%", padding: "14px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(56,189,248,0.12)", border: "1.5px solid rgba(56,189,248,0.3)", fontSize: 14, fontWeight: 700, color: "#38bdf8" }}>Enter</div>

        {/* Immediate help always available even when locked */}
        <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.06)" }}/>
        <div style={{ fontSize: 11, color: "#334155", textAlign: "center" }}>Need immediate help?</div>
        <div style={{ display: "flex", gap: 10, width: "100%" }}>
          <div onClick={() => window.location.href = "tel:911"} style={{ flex: 1, padding: "12px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: "rgba(239,68,68,0.12)", border: "1.5px solid rgba(239,68,68,0.3)", fontSize: 13, fontWeight: 800, color: "#ef4444" }}>📞 911</div>
          <div onClick={() => window.location.href = "tel:18007997233"} style={{ flex: 1, padding: "12px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", fontSize: 11, fontWeight: 700, color: "#38bdf8" }}>DV Hotline</div>
        </div>
        <div onClick={onClose} style={{ fontSize: 12, color: "#334155", cursor: "pointer", textDecoration: "underline" }}>Go back</div>
      </div>
    </div>
  );

  // -- Unlocked Menu --
  return (
    <div style={{ position: "fixed", inset: 0, background: "#040d18", overflowY: "auto", fontFamily: "'DM Sans',sans-serif", zIndex: 9000 }}>
      <QuickExitButton/>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "60px 24px 100px" }}>

        {section === null && (<>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#334155", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 20, textAlign: "center" }}>Private Safety Area</div>

          {/* Immediate help - always first */}
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.25)", borderRadius: 16, padding: "16px", marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: "#fca5a5", fontWeight: 700, marginBottom: 12 }}>If you need help right now</div>
            <div style={{ display: "flex", gap: 10 }}>
              <div onClick={() => window.location.href = "tel:911"} style={{ flex: 1, padding: "14px 8px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(239,68,68,0.15)", border: "2px solid rgba(239,68,68,0.4)", fontSize: 15, fontWeight: 900, color: "#ef4444" }}>📞 Call 911</div>
              <div onClick={() => window.location.href = "tel:18007997233"} style={{ flex: 1, padding: "14px 8px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(56,189,248,0.1)", border: "1.5px solid rgba(56,189,248,0.3)", fontSize: 12, fontWeight: 700, color: "#38bdf8" }}>DV Hotline<br/><span style={{ fontSize: 10 }}>800-799-7233</span></div>
              <div onClick={() => window.location.href = "sms:741741?body=START"} style={{ flex: 1, padding: "14px 8px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(167,139,250,0.1)", border: "1.5px solid rgba(167,139,250,0.25)", fontSize: 12, fontWeight: 700, color: "#a78bfa" }}>Text<br/><span style={{ fontSize: 10 }}>741741</span></div>
            </div>
          </div>

          {/* Two paths */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
            <div onClick={() => setSection("victim")} style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 14, padding: "18px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 28 }}>🛡</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fca5a5" }}>I don't feel safe at home</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Resources, safety planning, and support</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>

            <div onClick={() => setSection("responder")} style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.18)", borderRadius: 14, padding: "18px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 28 }}>🔄</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#fde68a" }}>I'm worried about my own reactions</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Honest self-check and intervention tools</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>

            <div onClick={() => setSection("secure")} style={{ background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.18)", borderRadius: 14, padding: "18px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 28 }}>🔐</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#7dd3fc" }}>I need a secure space</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Private documentation, secure chat, confidential resources</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>

          {/* Safety tools */}
          <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>Safety Tools</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { key: "plan",     icon: "🧭", label: "Safety Plan",           sub: "What to do, where to go, who to call" },
              { key: "recorder", icon: "🎙", label: "Safety Documentation",  sub: "Record a voice or text note — device only" },
              { key: "notes",     icon: "📋", label: "My Notes",              sub: "View saved safety notes" },
              { key: "resources", icon: "📚", label: "Resources & Education", sub: "Hardwired — always available offline" },
              { key: "medical",   icon: "🏥", label: "Medical Wellness Journal",  sub: "Labs, imaging, symptoms — private & device only" },
              { key: "recovery",  icon: "🌱", label: "Recovery Support",          sub: "Non-judgmental, anonymous, user-led" },
              { key: "spiritual", icon: "✨", label: "Meaning & Spiritual Support", sub: "Universal and faith-specific — your choice" },
            ].map(t => (
              <div key={t.key} onClick={() => setSection(t.key)} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 22 }}>{t.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#dde8f4" }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{t.sub}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, textAlign: "center" }}>
            <div onClick={() => setSettingPin(true)} style={{ fontSize: 11, color: "#334155", cursor: "pointer", textDecoration: "underline", marginBottom: 12 }}>Change PIN</div>
            <div onClick={onClose} style={{ fontSize: 12, color: "#334155", cursor: "pointer", textDecoration: "underline" }}>Close private area</div>
          </div>
        </>)}

        {/* -- VICTIM PATH -- */}
        {section === "victim" && (<>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div onClick={() => setSection(null)} style={{ cursor: "pointer", color: "#38bdf8", fontSize: 13, fontWeight: 700 }}>← Back</div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#dde8f4", marginBottom: 6 }}>You're not alone</div>
          <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: 20 }}>
            Trust what you're feeling. You don't have to have it figured out to reach out.
          </div>

          {/* Emergency */}
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <div onClick={() => window.location.href = "tel:911"} style={{ flex: 1, padding: "16px 8px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(239,68,68,0.15)", border: "2px solid rgba(239,68,68,0.4)", fontSize: 15, fontWeight: 900, color: "#ef4444" }}>📞 Call 911</div>
            <div onClick={() => window.location.href = "tel:18007997233"} style={{ flex: 1, padding: "16px 8px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(56,189,248,0.1)", border: "1.5px solid rgba(56,189,248,0.3)", fontSize: 12, fontWeight: 700, color: "#38bdf8" }}>DV Hotline<br/>800-799-7233</div>
          </div>

          {/* Resources */}
          {[
            { label: "National DV Hotline — Chat online", url: "https://www.thehotline.org", color: "#38bdf8" },
            { label: "Text START to 88788", url: "sms:88788?body=START", color: "#a78bfa" },
            { label: "myPlan — Safety planning app", url: "https://www.myplanapp.org", color: "#22c55e" },
            { label: "Aspire News App — Disguised safety app", url: "https://www.whengeorgiasmiled.org/aspire-news-app/", color: "#eab308" },
            { label: "NC Address Confidentiality Program", url: "https://www.ncdoj.gov/protecting-consumers/address-confidentiality-program/", color: "#f97316" },
          ].map((r, i) => (
            <div key={i} onClick={() => window.open(r.url, '_blank')} style={{ marginBottom: 10, padding: "13px 14px", borderRadius: 12, cursor: "pointer", background: r.color + "10", border: `1px solid ${r.color}25`, fontSize: 13, fontWeight: 600, color: r.color }}>
              {r.label} →
            </div>
          ))}

          <div style={{ marginTop: 16 }}>
            <div onClick={() => setSection("plan")} style={{ padding: "13px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 13, fontWeight: 700, color: "#8099b0", marginBottom: 10 }}>
              🧭 See Safety Plan
            </div>
            <div onClick={() => setSection("recorder")} style={{ padding: "13px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 13, fontWeight: 700, color: "#8099b0" }}>
              🎙 Document What Happened
            </div>
          </div>

          {/* Unique barriers acknowledgment */}
          <div style={{ marginTop: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>If your partner is a first responder</div>
            <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.7 }}>
              You may worry about their career, pension, or how local law enforcement will respond. These are real concerns. A DV advocate familiar with officer-involved situations can help you navigate your options safely and confidentially.
            </div>
          </div>
        </>)}

        {/* -- RESPONDER PATH -- */}
        {section === "responder" && (<>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div onClick={() => setSection(null)} style={{ cursor: "pointer", color: "#38bdf8", fontSize: 13, fontWeight: 700 }}>← Back</div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#dde8f4", marginBottom: 6 }}>Honest self-check</div>
          <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.7, marginBottom: 20 }}>
            If the job is following you home in ways you don't like — this is where you take control back.
          </div>
          <BehaviorAwareness navigate={navigate} onClose={() => setSection(null)}/>
        </>)}

        {/* -- RECORDER -- */}
        {section === "recorder" && (<>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div onClick={() => setSection(null)} style={{ cursor: "pointer", color: "#38bdf8", fontSize: 13, fontWeight: 700 }}>← Back</div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#dde8f4", marginBottom: 16 }}>Safety Documentation</div>
          <SafetyRecorder onClose={() => setSection(null)}/>
        </>)}

        {/* -- SAFETY PLAN -- */}
        {section === "plan" && (<>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div onClick={() => setSection(null)} style={{ cursor: "pointer", color: "#38bdf8", fontSize: 13, fontWeight: 700 }}>← Back</div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#dde8f4", marginBottom: 16 }}>Safety Plan</div>
          <SafetyPlan onClose={() => setSection(null)}/>
        </>)}

        {/* -- SECURE RESPONDER SPACE -- */}
        {section === "secure" && (<>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
            <div onClick={() => setSection(null)} style={{ cursor:"pointer", color:"#38bdf8", fontSize:13, fontWeight:700 }}>← Back</div>
          </div>
          <div style={{ fontSize:16, fontWeight:800, color:"#dde8f4", marginBottom:6 }}>Secure Space</div>
          <div style={{ fontSize:13, color:"#94a3b8", lineHeight:1.7, marginBottom:20 }}>
            This space is for you alone. PIN protected, zero trace, nothing shared. Use it however you need to.
          </div>

          {/* Secure recorder */}
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
            <div onClick={() => setSection("recorder")} style={{ background:"rgba(56,189,248,0.08)", border:"1px solid rgba(56,189,248,0.2)", borderRadius:14, padding:"16px", cursor:"pointer", display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ fontSize:24 }}>🎙</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#38bdf8" }}>Record a Private Note</div>
                <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>Voice or text — device only, never shared</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>

            <div onClick={() => setSection("secure-chat")} style={{ background:"rgba(167,139,250,0.08)", border:"1px solid rgba(167,139,250,0.2)", borderRadius:14, padding:"16px", cursor:"pointer", display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ fontSize:24 }}>💬</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#a78bfa" }}>Talk to AI — Confidential</div>
                <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>Anonymous, nothing stored, available 24/7</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>

            <div onClick={() => setSection("secure-connect")} style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:14, padding:"16px", cursor:"pointer", display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ fontSize:24 }}>🔗</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#22c55e" }}>Talk to Someone You Trust</div>
                <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>Private session — generate a code, invite one person</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>

          {/* Responder-specific resources */}
          <div style={{ fontSize:10, fontWeight:700, color:"#94a3b8", letterSpacing:"0.14em", textTransform:"uppercase", marginBottom:10 }}>Confidential Resources</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {[
              { icon:"📞", label:"Safe Call Now", detail:"First responder specific · 24/7 · Confidential", action:"tel:12064593020", color:"#38bdf8" },
              { icon:"🧠", label:"First Responder Support Network", detail:"Trauma-informed support · peer-led", action:"https://www.frsn.org", color:"#a78bfa" },
              { icon:"⚖️", label:"Know Your Legal Rights", detail:"EAP is confidential. Union reps cannot share with supervisors. ADA may protect you.", action:null, color:"#eab308" },
              { icon:"🛡", label:"Whistleblower Protections", detail:"Federal and state laws protect first responders who report misconduct. Document everything first.", action:null, color:"#22c55e" },
              { icon:"📋", label:"EAP — Employee Assistance Program", detail:"Ask HR for your EAP number. Sessions are confidential and do not go in your personnel file.", action:null, color:"#f97316" },
              { icon:"🤝", label:"Badge of Life", detail:"Mental health resources for law enforcement", action:"https://www.badgeoflife.org", color:"#38bdf8" },
              { icon:"📞", label:"988 — Crisis & Loss of Control", detail:"Not just for suicidal thoughts — for any moment you feel out of control", action:"tel:988", color:"#ef4444" },
            ].map((r, i) => (
              <div key={i} onClick={() => r.action && (r.action.startsWith("http") ? window.open(r.action,"_blank") : window.location.href=r.action)}
                style={{ background:"rgba(255,255,255,0.025)", border:`1px solid rgba(255,255,255,0.06)`, borderRadius:12, padding:"12px 14px", cursor: r.action ? "pointer" : "default" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:18 }}>{r.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:r.color }}>{r.label}</div>
                    <div style={{ fontSize:11, color:"#94a3b8", marginTop:2, lineHeight:1.5 }}>{r.detail}</div>
                  </div>
                  {r.action && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={r.color} strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>}
                </div>
              </div>
            ))}
          </div>
          <div onClick={() => setSection(null)} style={{ textAlign:"center", fontSize:12, color:"#94a3b8", cursor:"pointer", textDecoration:"underline", marginTop:16 }}>Close</div>
        </>)}

        {/* -- SECURE AI CHAT -- */}
        {section === "secure-chat" && (<>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
            <div onClick={() => setSection("secure")} style={{ cursor:"pointer", color:"#38bdf8", fontSize:13, fontWeight:700 }}>← Back</div>
            <div style={{ fontSize:15, fontWeight:800, color:"#dde8f4" }}>Confidential AI Chat</div>
          </div>
          <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6, marginBottom:12 }}>
            This conversation is not stored anywhere. Nothing is logged. Close the vault and it's gone.
          </div>
          <SecureAIChat onClose={() => setSection("secure")}/>
        </>)}

        {/* -- SECURE CONNECT -- */}
        {section === "secure-connect" && (<>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
            <div onClick={() => setSection("secure")} style={{ cursor:"pointer", color:"#38bdf8", fontSize:13, fontWeight:700 }}>← Back</div>
            <div style={{ fontSize:15, fontWeight:800, color:"#dde8f4" }}>Private Session</div>
          </div>
          <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6, marginBottom:16 }}>
            Generate a code and share it with one trusted person. Session disappears when closed.
          </div>
          <div onClick={() => {}} style={{ padding:"15px", borderRadius:14, cursor:"pointer", textAlign:"center", background:"rgba(34,197,94,0.1)", border:"1.5px solid rgba(34,197,94,0.25)", fontSize:14, fontWeight:700, color:"#22c55e" }}>
            Open Family Connect →
          </div>
        </>)}

        {/* RESOURCES AND EDUCATION */}
        {section === "resources" && (<>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
            <div onClick={() => setSection(null)} style={{ cursor:"pointer", color:"#38bdf8", fontSize:13, fontWeight:700 }}>← Back</div>
          </div>
          <div style={{ fontSize:16, fontWeight:800, color:"#dde8f4", marginBottom:6 }}>Resources & Education</div>
          <div style={{ fontSize:13, color:"#64748b", lineHeight:1.6, marginBottom:20 }}>
            These resources are hardwired into the app and available offline. No internet required.
          </div>

          {[
            {
              category: "Domestic & Physical Abuse",
              color: "#ef4444",
              icon: "🛡",
              items: [
                { label: "National DV Hotline", detail: "24/7 · Call, text, or chat", action: "tel:18007997233", actionLabel: "800-799-7233" },
                { label: "Text START to 88788", detail: "Text-based support · 24/7", action: "sms:88788?body=START", actionLabel: "Text now" },
                { label: "NC Address Confidentiality", detail: "Hides your location from abuser in public records", action: "https://www.ncdoj.gov/protecting-consumers/address-confidentiality-program/", actionLabel: "Learn more" },
                { label: "Battered Women's Justice Project", detail: "Officer-involved DV specialists", action: "https://www.bwjp.org", actionLabel: "bwjp.org" },
              ]
            },
            {
              category: "Sexual Abuse & Assault",
              color: "#a78bfa",
              icon: "💜",
              items: [
                { label: "RAINN National Sexual Assault Hotline", detail: "24/7 · Confidential", action: "tel:18006564673", actionLabel: "800-656-4673" },
                { label: "RAINN Online Chat", detail: "rainn.org · Confidential chat available", action: "https://www.rainn.org", actionLabel: "rainn.org" },
                { label: "Safe Helpline (Military)", detail: "For military-connected individuals", action: "tel:18779955247", actionLabel: "877-995-5247" },
                { label: "NC Rape Crisis Centers", detail: "Local support across NC", action: "https://www.ncrcc.org", actionLabel: "ncrcc.org" },
              ]
            },
            {
              category: "Child Abuse",
              color: "#f97316",
              icon: "🧒",
              items: [
                { label: "Childhelp National Child Abuse Hotline", detail: "24/7 · Crisis intervention", action: "tel:18004224453", actionLabel: "800-422-4453" },
                { label: "NC Child Protective Services", detail: "Report abuse in NC", action: "tel:18888350099", actionLabel: "888-835-0099" },
                { label: "First Responder Children's Foundation", detail: "Free counseling for children of responders", action: "https://www.1stresponderchildren.org", actionLabel: "1stresponderchildren.org" },
                { label: "Mandatory Reporting", detail: "First responders are mandated reporters. When in doubt, report.", action: null, actionLabel: null },
              ]
            },
            {
              category: "Elder Abuse",
              color: "#eab308",
              icon: "👴",
              items: [
                { label: "National Elder Fraud Hotline", detail: "DOJ · Financial & physical elder abuse", action: "tel:18333728311", actionLabel: "833-372-8311" },
                { label: "Eldercare Locator", detail: "Find local elder care resources", action: "tel:18006771116", actionLabel: "800-677-1116" },
                { label: "NC Adult Protective Services", detail: "Report elder abuse in NC", action: "tel:18888350099", actionLabel: "888-835-0099" },
              ]
            },
            {
              category: "Emotional & Psychological Abuse",
              color: "#38bdf8",
              icon: "🧠",
              items: [
                { label: "What is coercive control?", detail: "Isolation, monitoring, financial control, threats — these are abuse even without physical violence.", action: null, actionLabel: null },
                { label: "The Power & Control Wheel", detail: "A tool for understanding patterns of abusive behavior. Common in first responder households when command presence doesn't turn off.", action: "https://www.thehotline.org/identify-abuse/power-and-control/", actionLabel: "Learn more" },
                { label: "22Zero — Brain-based trauma education", detail: "For families to understand the neurological side of PTSD and behavior", action: "https://www.22zero.org", actionLabel: "22zero.org" },
              ]
            },
            {
              category: "Substance Use & Recovery",
              color: "#22c55e",
              icon: "🌱",
              items: [
                { label: "SAMHSA National Helpline", detail: "24/7 · Free · Confidential · Treatment referrals", action: "tel:18006624357", actionLabel: "800-662-4357" },
                { label: "Al-Anon Family Groups", detail: "Support for families of those with alcohol problems", action: "https://al-anon.org", actionLabel: "al-anon.org" },
                { label: "SMART Recovery", detail: "Science-based addiction recovery — peer-led, no stigma", action: "https://www.smartrecovery.org", actionLabel: "smartrecovery.org" },
                { label: "First Responders First", detail: "Addiction recovery for first responders — confidential, career-safe", action: "https://www.firstrespondersfirst.org", actionLabel: "firstrespondersfirst.org" },
                { label: "Crisis Text Line", detail: "Text HOME to 741741 · Substance use and mental health", action: "sms:741741?body=HOME", actionLabel: "Text now" },
              ]
            },
            {
              category: "Postpartum & Perinatal Mental Health",
              color: "#ec4899",
              icon: "👶",
              items: [
                { label: "Postpartum Support International Helpline", detail: "800-944-4773 · 24/7 · Confidential · For mothers AND fathers", action: "tel:18009444773", actionLabel: "800-944-4773" },
                { label: "National Maternal Mental Health Hotline", detail: "1-833-943-5746 · 24/7 · English and Spanish", action: "tel:18339435746", actionLabel: "833-943-5746" },
                { label: "PSI — For Fathers and Partners", detail: "Paternal postpartum depression is real and underdiagnosed", action: "https://www.postpartum.net/get-help/for-fathers-and-partners/", actionLabel: "postpartum.net" },
                { label: "Postpartum Progress — Warrior Mom Community", detail: "Peer community for postpartum depression and anxiety", action: "https://www.postpartumprogress.com", actionLabel: "postpartumprogress.com" },
              ]
            },
            {
              category: "Workplace Harassment & Retaliation",
              color: "#64748b",
              icon: "⚖️",
              items: [
                { label: "EEOC — Workplace harassment reporting", detail: "Federal Equal Employment Opportunity Commission", action: "tel:18004694295", actionLabel: "800-469-4295" },
                { label: "NC DOL Workplace Rights", detail: "NC Department of Labor", action: "tel:18002251560", actionLabel: "800-225-1560" },
                { label: "Peer retaliation", detail: "If you face retaliation for seeking help or reporting misconduct, document everything and contact your EAP or union rep first.", action: null, actionLabel: null },
              ]
            },
            {
              category: "Education — Understanding Trauma at Home",
              color: "#a78bfa",
              icon: "📖",
              items: [
                { label: "Emotional Survival for Law Enforcement", detail: "Kevin Gilmartin — the gold standard for understanding how the job changes behavior at home", action: null, actionLabel: null },
                { label: "CRAFT-PTSD (VA Online)", detail: "Self-paced course for family members supporting someone with PTSD", action: "https://www.ptsd.va.gov/apps/craftptsd/", actionLabel: "VA CRAFT course" },
                { label: "FOCUS Resiliency Training", detail: "For families — skill building during high-stress times", action: "https://focusproject.org", actionLabel: "focusproject.org" },
                { label: "Military Kids Connect", detail: "For kids 6–17 navigating a parent's service-related stress", action: "https://militarykidsconnect.health.mil", actionLabel: "MKC" },
                { label: "Love is Respect", detail: "For ages 13–26 — healthy vs unhealthy relationship education", action: "https://www.loveisrespect.org", actionLabel: "loveisrespect.org" },
              ]
            },
          ].map((cat, ci) => (
            <div key={ci} style={{ marginBottom: 20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                <span style={{ fontSize:18 }}>{cat.icon}</span>
                <div style={{ fontSize:11, fontWeight:800, color:cat.color, letterSpacing:"0.1em", textTransform:"uppercase" }}>{cat.category}</div>
              </div>
              {cat.items.map((item, ii) => (
                <div key={ii} style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:12, padding:"12px 14px", marginBottom:8 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#dde8f4", marginBottom:3 }}>{item.label}</div>
                  <div style={{ fontSize:12, color:"#64748b", lineHeight:1.6, marginBottom: item.action ? 8 : 0 }}>{item.detail}</div>
                  {item.action && (
                    <div onClick={() => item.action.startsWith("http") ? window.open(item.action,"_blank") : window.location.href=item.action}
                      style={{ display:"inline-block", padding:"6px 12px", borderRadius:8, cursor:"pointer", background:cat.color+"15", border:`1px solid ${cat.color}30`, fontSize:12, fontWeight:700, color:cat.color }}>
                      {item.actionLabel} →
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}

          <div onClick={() => setSection(null)} style={{ textAlign:"center", fontSize:12, color:"#334155", cursor:"pointer", textDecoration:"underline", marginTop:8 }}>Close</div>
        </>)}

        {/* -- MEDICAL -- */}
        {section === "medical" && (<>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
            <div onClick={() => setSection(null)} style={{ cursor:"pointer", color:"#38bdf8", fontSize:13, fontWeight:700 }}>← Back</div>
          </div>
          <div style={{ fontSize:16, fontWeight:800, color:"#dde8f4", marginBottom:16 }}>Medical Wellness Journal</div>
          <MedicalVaultSection onClose={() => setSection(null)}/>
        </>)}

        {/* SAVED NOTES */}
        {section === "recovery" && (<>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
            <div onClick={() => setSection(null)} style={{ cursor:"pointer", color:"#38bdf8", fontSize:13, fontWeight:700 }}>← Back</div>
            <div style={{ fontSize:15, fontWeight:800, color:"#22c55e" }}>🌱 Recovery Support</div>
          </div>
          <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6, marginBottom:16 }}>Non-judgmental. Anonymous. User-led only. Available to everyone.</div>
          <div style={{ fontSize:12, fontWeight:700, color:"#475569", marginBottom:8 }}>In-the-moment tools</div>
          {RECOVERY_SUPPORT.microTools.urgeSurfing.map((item,i) => (
            <div key={i} style={{ background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.15)", borderRadius:12, padding:"13px 14px", marginBottom:8 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#22c55e", marginBottom:4 }}>{item.title}</div>
              <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.7 }}>{item.body}</div>
            </div>
          ))}
          <div style={{ fontSize:12, fontWeight:700, color:"#475569", margin:"16px 0 8px" }}>First Responder Specific</div>
          {RECOVERY_SUPPORT.firstResponderSpecific.map((r,i) => (
            <div key={i} onClick={() => r.url ? window.open(r.url,"_blank") : window.location.href="tel:"+r.phone}
              style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"11px 13px", marginBottom:6, cursor:"pointer" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#dde8f4" }}>{r.label}</div>
              <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{r.detail}</div>
            </div>
          ))}
          <div style={{ fontSize:12, fontWeight:700, color:"#475569", margin:"16px 0 8px" }}>Peer Support</div>
          {RECOVERY_SUPPORT.peerSupport.slice(0,4).map((r,i) => (
            <div key={i} onClick={() => window.open(r.url,"_blank")}
              style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"11px 13px", marginBottom:6, cursor:"pointer" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#dde8f4" }}>{r.label}</div>
              <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{r.detail}</div>
            </div>
          ))}
        </>)}

        {section === "spiritual" && (<>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
            <div onClick={() => setSection(null)} style={{ cursor:"pointer", color:"#38bdf8", fontSize:13, fontWeight:700 }}>← Back</div>
            <div style={{ fontSize:15, fontWeight:800, color:"#a78bfa" }}>✨ Meaning & Spiritual Support</div>
          </div>
          <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6, marginBottom:16 }}>Universal by default. Faith-specific only if you choose it. No assumptions.</div>
          <div style={{ fontSize:12, fontWeight:700, color:"#475569", marginBottom:8 }}>Reflection prompts</div>
          {SPIRITUALITY_SUPPORT.universal.groundingPrompts.map((p,i) => (
            <div key={i} style={{ background:"rgba(167,139,250,0.06)", border:"1px solid rgba(167,139,250,0.15)", borderRadius:10, padding:"12px 14px", marginBottom:8, fontSize:13, color:"#a78bfa", lineHeight:1.7, fontStyle:"italic" }}>{p}</div>
          ))}
          <div style={{ fontSize:12, fontWeight:700, color:"#475569", margin:"16px 0 8px" }}>Meaning and purpose</div>
          {SPIRITUALITY_SUPPORT.universal.meaningMaking.map((item,i) => (
            <div key={i} style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"12px 14px", marginBottom:8 }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#dde8f4", marginBottom:4 }}>{item.title}</div>
              <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.7 }}>{item.body}</div>
            </div>
          ))}
          <div style={{ fontSize:12, fontWeight:700, color:"#475569", margin:"16px 0 8px" }}>Faith-specific support (tap your tradition)</div>
          {["christian","muslim","jewish","buddhist"].map(faith => (
            <FaithSection key={faith} faith={faith}/>
          ))}
          <div style={{ fontSize:12, fontWeight:700, color:"#475569", margin:"16px 0 8px" }}>Chaplaincy resources</div>
          {SPIRITUALITY_SUPPORT.resources.map((r,i) => (
            <div key={i} onClick={() => window.open(r.url,"_blank")}
              style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"11px 13px", marginBottom:6, cursor:"pointer" }}>
              <div style={{ fontSize:13, fontWeight:700, color:"#dde8f4" }}>{r.label}</div>
              <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{r.detail}</div>
            </div>
          ))}
        </>)}

        {section === "notes" && (<>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div onClick={() => setSection(null)} style={{ cursor: "pointer", color: "#38bdf8", fontSize: 13, fontWeight: 700 }}>← Back</div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#dde8f4", marginBottom: 16 }}>My Safety Notes</div>
          {(() => {
            try {
              const notes = JSON.parse(localStorage.getItem("upstream_safety_notes") || "[]");
              if (notes.length === 0) return <div style={{ fontSize: 13, color: "#334155", textAlign: "center", padding: "30px" }}>No notes saved yet.</div>;
              return notes.slice().reverse().map((n, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "13px 15px", marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ fontSize: 11, color: "#334155" }}>{new Date(n.timestamp).toLocaleDateString()}</div>
                    {n.tag && <div style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", background: "rgba(239,68,68,0.1)", padding: "2px 8px", borderRadius: 5 }}>{n.tag}</div>}
                  </div>
                  {n.text && <div style={{ fontSize: 13, color: "#8099b0", lineHeight: 1.6 }}>{n.text}</div>}
                  {n.type === "audio" && <div style={{ fontSize: 12, color: "#475569" }}>🎙 Voice note</div>}
                </div>
              ));
            } catch(e) { return <div style={{ fontSize: 13, color: "#334155", textAlign: "center" }}>Could not load notes.</div>; }
          })()}
          <div onClick={() => setSection(null)} style={{ textAlign: "center", fontSize: 12, color: "#334155", cursor: "pointer", textDecoration: "underline", marginTop: 12 }}>Close</div>
        </>)}

      </div>
    </div>
  );
}
