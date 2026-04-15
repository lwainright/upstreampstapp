// ============================================================
// SCREEN: HumanPSTScreen
// Upstream Initiative — First Responder Edition
// ============================================================
import React, { useState, useEffect } from 'react';
import { Screen } from './ui.jsx';
import { trackPSTContact } from './analytics.js';

export default function HumanPSTScreen({ navigate, agency, logoSrc }) {
  const [step, setStep] = useState("panel");
  const [method, setMethod] = useState(null);
  const [urgency, setUrgency] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipContext, setTipContext] = useState(null);
  const [tipPriority, setTipPriority] = useState("Priority");
  const [requestedPST, setRequestedPST] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatBlurred, setChatBlurred] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [pstTyping, setPstTyping] = useState(false);
  const [replyIdx, setReplyIdx] = useState(0);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const pstReplies = [
    "Thank you for reaching out. I'm here and I'm listening. Take your time.",
    "That sounds really heavy. You don't have to carry this alone.",
    "I hear you. Can you tell me a bit more about what's been going on?",
    "You did the right thing reaching out. What's weighing on you most right now?",
    "I'm glad you messaged. There's no rush — we can go at whatever pace feels right.",
    "That makes a lot of sense given what you've been through. How are you doing right now, in this moment?",
  ];

  const pstMembers = [
    { id: "pst1", name: "J. Martinez",  role: "PST Lead",   unit: "EMS Division", status: "green",  specialty: ["Trauma", "PTSD"],           note: "Available now" },
    { id: "pst2", name: "A. Thompson",  role: "PST Member", unit: "Station 4",    status: "green",  specialty: ["Grief", "Substance Use"],    note: "On shift until 18:00" },
    { id: "pst3", name: "C. Williams",  role: "PST Member", unit: "HQ / Admin",   status: "yellow", specialty: ["Family", "Stress"],          note: "Available later today" },
    { id: "pst4", name: "D. Nguyen",    role: "PST Member", unit: "Dispatch",     status: "red",    specialty: ["Trauma", "Critical Incident"], note: "Off duty today" },
  ];

  const statusColor = { green: "#22c55e", yellow: "#eab308", red: "#ef4444" };
  const statusLabel = { green: "Available", yellow: "Limited", red: "Off Duty" };

  const contactMethods = [
    { key: "chat",     icon: "💬", label: "Chat",          color: "#a78bfa", bg: "rgba(167,139,250,0.1)",  border: "rgba(167,139,250,0.3)",  desc: "In-app message" },
    { key: "call",     icon: "📞", label: "Call",          color: "#38bdf8", bg: "rgba(56,189,248,0.08)",  border: "rgba(56,189,248,0.2)",   desc: "PST calls you" },
    { key: "text",     icon: "📱", label: "Text",          color: "#22c55e", bg: "rgba(34,197,94,0.08)",   border: "rgba(34,197,94,0.2)",    desc: "SMS follow-up" },
    { key: "inperson", icon: "🤝", label: "In-Person",     color: "#f97316", bg: "rgba(249,115,22,0.08)",  border: "rgba(249,115,22,0.2)",   desc: "Meet face to face" },
    { key: "schedule", icon: "📅", label: "Schedule Call", color: "#eab308", bg: "rgba(234,179,8,0.08)",   border: "rgba(234,179,8,0.2)",    desc: "Pick a time" },
  ];

  const urgencyLevels = [
    { key: "now",     label: "Right Now", icon: "🔴", color: "#ef4444", desc: "Immediate — I need support now" },
    { key: "today",   label: "Today",     icon: "🟡", color: "#eab308", desc: "Within the next few hours" },
    { key: "anytime", label: "Anytime",   icon: "🟢", color: "#22c55e", desc: "No rush — whenever works" },
  ];

  const filteredMembers = pstMembers.filter(m => {
    if (filter === "available") return m.status === "green";
    if (filter === "limited") return m.status === "yellow";
    return true;
  }).filter(m =>
    searchQuery === "" ||
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.specialty.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const userMsg = { from: "user", text: chatInput.trim(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setPstTyping(true);
    setTimeout(() => {
      const pstMsg = { from: "pst", text: pstReplies[replyIdx % pstReplies.length], time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      setChatMessages(prev => [...prev, pstMsg]);
      setReplyIdx(i => i + 1);
      setPstTyping(false);
    }, 1800 + Math.random() * 1200);
  };

  const startChat = (targetPST) => {
    const pstName = targetPST ? targetPST.name : "a PST member";
    const openingMsg = {
      from: "pst",
      text: `Hi, this is ${pstName}. I picked up your request and I'm here for you. To get started, can you share your name? This conversation stays between us and the PST team.`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setChatMessages([openingMsg]);
    setRequestedPST(targetPST);
    setStep("chat");
    trackPSTContact(agency?.code || "NONE", "chat");
  };

  const submitRequest = () => {
    if (!name.trim() || !phone.trim()) return;
    setSubmitted(true);
    trackPSTContact(agency?.code || "NONE", method || "callback");
    setStep("confirm");
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1.5px solid rgba(255,255,255,0.09)",
    borderRadius: 12, padding: "12px 14px",
    fontSize: 13, fontFamily: "'DM Sans',sans-serif",
    outline: "none", width: "100%", color: "#dde8f4",
  };

  if (!agency) {
    return (
      <Screen headerProps={{ onBack: () => navigate("home"), logoSrc }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, paddingTop: 20 }}>
          <div style={{ fontSize: 44 }}>🔒</div>
          <div style={{ fontSize: 17, fontWeight: 800, color: "#dde8f4", textAlign: "center" }}>Agency Feature</div>
          <div style={{ fontSize: 13, color: "#64748b", textAlign: "center", lineHeight: 1.7 }}>
            Human PST access is available to members of participating agencies. Enter your agency code to connect with your peer support team.
          </div>
          <div onClick={() => navigate("agencycode")} style={{ width: "100%", padding: "14px", borderRadius: 12, textAlign: "center", cursor: "pointer", background: "rgba(56,189,248,0.12)", border: "1.5px solid rgba(56,189,248,0.3)", fontSize: 14, fontWeight: 700, color: "#38bdf8" }}>
            Enter Agency Code →
          </div>
          <div style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 12, padding: "14px 16px", width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#f87171", fontWeight: 700, marginBottom: 6 }}>Need immediate support?</div>
            <div style={{ fontSize: 13, color: "#ef4444", fontWeight: 700 }}>📞 988 · Safe Call Now: 1-206-459-3020</div>
          </div>
        </div>
      </Screen>
    );
  }

  return (
    <Screen headerProps={{ onBack: () => { if (step !== "panel") setStep("panel"); else navigate("home"); }, logoSrc, agencyName: agency?.name }}>

      {/* ── PANEL ── */}
      {step === "panel" && (
        <>
          <div style={{ background: "rgba(167,139,250,0.07)", border: "1px solid rgba(167,139,250,0.18)", borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ fontSize: 13, color: "#c4b5fd", fontWeight: 600, marginBottom: 4 }}>Real people. Real support.</div>
            <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>Your agency's peer support team are trained colleagues who've been there. Conversations stay within the PST team.</div>
          </div>

          {/* Search + Filter */}
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name or specialty..."
            style={{ ...inputStyle, marginBottom: 0 }}
          />
          <div style={{ display: "flex", gap: 6 }}>
            {["all", "available", "limited"].map(f => (
              <div key={f} onClick={() => setFilter(f)} style={{ flex: 1, padding: "8px 6px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: filter === f ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.03)", border: `1px solid ${filter === f ? "rgba(167,139,250,0.4)" : "rgba(255,255,255,0.07)"}`, fontSize: 11, fontWeight: filter === f ? 800 : 600, color: filter === f ? "#a78bfa" : "#64748b" }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </div>
            ))}
          </div>

          {/* PST Members */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredMembers.map((m, i) => {
              const available = m.status !== "red";
              return (
                <div key={i} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "14px 16px", opacity: available ? 1 : 0.45 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: available ? 12 : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>👤</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#dde8f4" }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{m.role} · {m.unit}</div>
                        <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                          {m.specialty.map(s => (
                            <span key={s} style={{ fontSize: 9, fontWeight: 700, color: "#64748b", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4 }}>{s}</span>
                          ))}
                        </div>
                        <div style={{ fontSize: 10, color: statusColor[m.status], marginTop: 3, fontStyle: "italic" }}>{m.note}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0 }}>
                      <div style={{ width: 9, height: 9, borderRadius: "50%", background: statusColor[m.status], boxShadow: `0 0 7px ${statusColor[m.status]}90` }}/>
                      <span style={{ fontSize: 9, color: statusColor[m.status], fontWeight: 700 }}>{statusLabel[m.status]}</span>
                    </div>
                  </div>
                  {available && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <div onClick={() => startChat(m)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px 0", borderRadius: 10, background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.3)", cursor: "pointer" }}>
                        <span style={{ fontSize: 14 }}>💬</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa" }}>Chat</span>
                      </div>
                      <div onClick={() => { setRequestedPST(m); setMethod("call"); setStep("contact"); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px 0", borderRadius: 10, background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", cursor: "pointer" }}>
                        <span style={{ fontSize: 14 }}>📞</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#38bdf8" }}>Call</span>
                      </div>
                      <div onClick={() => { setRequestedPST(m); setMethod("text"); setStep("contact"); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "9px 0", borderRadius: 10, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", cursor: "pointer" }}>
                        <span style={{ fontSize: 14 }}>📱</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#22c55e" }}>Text</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }}/>

          {/* Broadcast */}
          <div onClick={() => startChat(null)} style={{ background: "rgba(167,139,250,0.08)", border: "1.5px solid rgba(167,139,250,0.25)", borderRadius: 14, padding: "16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(167,139,250,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>📡</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#c4b5fd" }}>Broadcast to All PST</div>
              <div style={{ fontSize: 12, color: "#7c5cbf", marginTop: 2 }}>First available PST member will respond</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </div>

          {/* Request callback */}
          <div onClick={() => { setRequestedPST(null); setStep("contact"); }} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>📋</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8" }}>Request a Callback</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>Leave your name and number — PST will reach out</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </div>

          {/* Anonymous wellness check */}
          <div style={{ background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#eab308", marginBottom: 6 }}>🤝 Concerned About a Co-Worker?</div>
            <div style={{ fontSize: 12, color: "#8099b0", lineHeight: 1.7, marginBottom: 12 }}>Anonymously request that PST check on someone. No names, no identities — just a heads-up.</div>
            <div onClick={() => setShowTipModal(true)} style={{ padding: "11px", borderRadius: 10, textAlign: "center", cursor: "pointer", background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.25)", fontSize: 13, fontWeight: 700, color: "#eab308" }}>
              Submit Anonymous Wellness Check →
            </div>
          </div>

          {/* Crisis line */}
          <div style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#f87171", fontWeight: 700, marginBottom: 4 }}>Crisis? Call now.</div>
            <div style={{ fontSize: 13, color: "#ef4444", fontWeight: 700 }}>988 · Safe Call Now: 1-206-459-3020</div>
          </div>
        </>
      )}

      {/* ── CONTACT FORM ── */}
      {step === "contact" && (
        <>
          <div style={{ background: "rgba(167,139,250,0.06)", border: "1px solid rgba(167,139,250,0.18)", borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ fontSize: 13, color: "#c4b5fd", fontWeight: 600, marginBottom: 4 }}>
              {requestedPST ? `Contacting ${requestedPST.name}` : "Request PST Support"}
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Your name and number are shared with your PST team only — never with supervisors or admin.</div>
          </div>

          {/* Contact method */}
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#64748b", marginBottom: 8 }}>How would you like to connect?</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 4 }}>
            {contactMethods.map(m => (
              <div key={m.key} onClick={() => { if (m.key === "chat") { startChat(requestedPST); return; } setMethod(m.key); }} style={{ background: method === m.key ? m.bg : "rgba(255,255,255,0.03)", border: `1.5px solid ${method === m.key ? m.border : "rgba(255,255,255,0.07)"}`, borderRadius: 14, padding: "14px 10px", cursor: "pointer", textAlign: "center" }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{m.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: method === m.key ? m.color : "#dde8f4" }}>{m.label}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{m.desc}</div>
              </div>
            ))}
          </div>

          {/* Urgency */}
          {method && method !== "chat" && (
            <>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#64748b", marginTop: 8, marginBottom: 8 }}>When do you need support?</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {urgencyLevels.map(u => (
                  <div key={u.key} onClick={() => setUrgency(u.key)} style={{ background: urgency === u.key ? `rgba(${u.color === "#ef4444" ? "239,68,68" : u.color === "#eab308" ? "234,179,8" : "34,197,94"},0.1)` : "rgba(255,255,255,0.03)", border: `1.5px solid ${urgency === u.key ? u.color : "rgba(255,255,255,0.07)"}`, borderRadius: 12, padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 18 }}>{u.icon}</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: urgency === u.key ? 700 : 500, color: urgency === u.key ? u.color : "#dde8f4" }}>{u.label}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{u.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Contact info */}
          {method && urgency && (
            <>
              <div style={{ background: "rgba(56,189,248,0.05)", border: "1px solid rgba(56,189,248,0.12)", borderRadius: 12, padding: "10px 14px", fontSize: 11, color: "#38bdf8", fontWeight: 600 }}>
                🔒 Your info is shared with PST only — never with supervisors or admin
              </div>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" style={inputStyle}/>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" style={inputStyle}/>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Optional — anything you want them to know first..." rows={3} style={{ ...inputStyle, resize: "none" }}/>
              <div onClick={submitRequest} style={{ padding: "14px", borderRadius: 12, textAlign: "center", cursor: name.trim() && phone.trim() ? "pointer" : "not-allowed", background: name.trim() && phone.trim() ? "rgba(167,139,250,0.15)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${name.trim() && phone.trim() ? "rgba(167,139,250,0.4)" : "rgba(255,255,255,0.07)"}`, fontSize: 14, fontWeight: 700, color: name.trim() && phone.trim() ? "#a78bfa" : "#475569", opacity: name.trim() && phone.trim() ? 1 : 0.5 }}>
                Send Request →
              </div>
            </>
          )}
        </>
      )}

      {/* ── CONFIRM ── */}
      {step === "confirm" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, paddingTop: 20 }}>
          <div style={{ fontSize: 52 }}>✓</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#a78bfa", textAlign: "center" }}>Request Sent</div>
          <div style={{ fontSize: 13, color: "#64748b", textAlign: "center", lineHeight: 1.7 }}>
            A PST member will contact you — urgency: <span style={{ color: "#a78bfa", fontWeight: 700 }}>{urgencyLevels.find(u => u.key === urgency)?.label}</span>.<br/><br/>
            Your name and number were submitted to the PST team only.
          </div>
          <div style={{ background: "rgba(167,139,250,0.08)", border: "1.5px solid rgba(167,139,250,0.25)", borderRadius: 14, padding: "16px", width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#c4b5fd", marginBottom: 6 }}>Want to chat now instead?</div>
            <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14, lineHeight: 1.5 }}>Start an in-app message thread with your PST team.</div>
            <div onClick={() => startChat(requestedPST)} style={{ padding: "12px", borderRadius: 10, cursor: "pointer", background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.3)", fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>Open PST Chat</div>
          </div>
          <div onClick={() => navigate("home")} style={{ width: "100%", padding: "14px", borderRadius: 12, textAlign: "center", cursor: "pointer", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)", fontSize: 14, fontWeight: 700, color: "#38bdf8" }}>Back to Home</div>
        </div>
      )}

      {/* ── CHAT ── */}
      {step === "chat" && (
        <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 200px)" }}>
          <div style={{ background: "rgba(167,139,250,0.07)", border: "1px solid rgba(167,139,250,0.18)", borderRadius: 12, padding: "10px 14px", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px rgba(34,197,94,0.6)" }}/>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#c4b5fd" }}>{requestedPST ? `${requestedPST.name} (PST)` : "PST Member Connected"}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div onClick={() => setChatBlurred(b => !b)} style={{ fontSize: 10, fontWeight: 700, color: "#475569", cursor: "pointer", padding: "4px 8px", borderRadius: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                {chatBlurred ? "Unblur" : "🛡 Protect"}
              </div>
              <div onClick={() => setShowDeleteConfirm(true)} style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", cursor: "pointer", padding: "4px 8px", borderRadius: 6, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)" }}>Delete</div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, padding: "4px 0", filter: chatBlurred ? "blur(6px)" : "none", transition: "filter 0.3s" }}>
            {chatMessages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.from === "user" ? "flex-end" : "flex-start", maxWidth: "82%" }}>
                <div style={{ background: m.from === "user" ? "rgba(167,139,250,0.18)" : "rgba(255,255,255,0.05)", border: `1px solid ${m.from === "user" ? "rgba(167,139,250,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: m.from === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "10px 14px" }}>
                  <div style={{ fontSize: 13, color: m.from === "user" ? "#dde8f4" : "#c4b5fd", lineHeight: 1.5 }}>{m.text}</div>
                  <div style={{ fontSize: 9, color: "#64748b", marginTop: 4, textAlign: m.from === "user" ? "right" : "left" }}>{m.from === "pst" ? "PST · " : ""}{m.time}</div>
                </div>
              </div>
            ))}
            {pstTyping && (
              <div style={{ alignSelf: "flex-start", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px 16px 16px 4px", padding: "12px 16px", display: "flex", gap: 5, alignItems: "center" }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#a78bfa", opacity: 0.6 }}/>)}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: 6 }}>
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendChat()} placeholder="Message your PST member..." style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(167,139,250,0.2)", borderRadius: 12, padding: "12px 14px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", color: "#dde8f4" }}/>
            <div onClick={sendChat} style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(167,139,250,0.15)", border: "1.5px solid rgba(167,139,250,0.3)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </div>
          </div>
          <div style={{ fontSize: 10, color: "#475569", textAlign: "center", marginTop: 8, letterSpacing: "0.06em" }}>PRIVATE — PST TEAM ONLY</div>
        </div>
      )}

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 }}>
          <div style={{ background: "#0c1929", border: "1.5px solid rgba(239,68,68,0.3)", borderRadius: 20, padding: "28px 22px", maxWidth: 340, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🗑</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#f87171", marginBottom: 8 }}>Delete Chat Thread?</div>
            <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, marginBottom: 20 }}>This will clear the conversation from your device. The PST team may retain their copy per agency policy.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <div onClick={() => setShowDeleteConfirm(false)} style={{ flex: 1, padding: "12px", borderRadius: 11, cursor: "pointer", textAlign: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 13, fontWeight: 700, color: "#475569" }}>Cancel</div>
              <div onClick={() => { setChatMessages([]); setShowDeleteConfirm(false); setStep("panel"); }} style={{ flex: 1, padding: "12px", borderRadius: 11, cursor: "pointer", textAlign: "center", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", fontSize: 13, fontWeight: 700, color: "#f87171" }}>Delete</div>
            </div>
          </div>
        </div>
      )}

      {/* Wellness check modal */}
      {showTipModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 }} onClick={() => setShowTipModal(false)}>
          <div style={{ background: "#0b1829", border: "1.5px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "28px 24px", maxWidth: 440, width: "100%", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#dde8f4", marginBottom: 8 }}>Anonymous Wellness Check</div>
            <div style={{ fontSize: 13, color: "#8099b0", marginBottom: 20, lineHeight: 1.6 }}>Completely anonymous. PST will know someone needs support, but not who submitted this or who needs help.</div>

            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#64748b", marginBottom: 8 }}>Context (Optional)</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {["Recent traumatic call", "Behavioral changes noticed", "Mentioned struggling", "Just a feeling"].map(ctx => (
                <div key={ctx} onClick={() => setTipContext(tipContext === ctx ? null : ctx)} style={{ padding: "12px 14px", borderRadius: 10, background: tipContext === ctx ? "rgba(234,179,8,0.12)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${tipContext === ctx ? "rgba(234,179,8,0.3)" : "rgba(255,255,255,0.06)"}`, cursor: "pointer", fontSize: 13, color: tipContext === ctx ? "#eab308" : "#8099b0" }}>{ctx}</div>
              ))}
            </div>

            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "#64748b", marginBottom: 8 }}>Urgency</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              {[{ label: "Routine", color: "#22c55e" }, { label: "Priority", color: "#eab308" }, { label: "Urgent", color: "#ef4444" }].map(p => (
                <div key={p.label} onClick={() => setTipPriority(p.label)} style={{ flex: 1, padding: "10px 6px", borderRadius: 10, background: tipPriority === p.label ? p.color + "18" : "rgba(255,255,255,0.03)", border: `1.5px solid ${tipPriority === p.label ? p.color : "rgba(255,255,255,0.06)"}`, cursor: "pointer", textAlign: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: p.color }}>{p.label}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.15)", borderRadius: 12, padding: "12px 14px", marginBottom: 20 }}>
              <div style={{ fontSize: 12, color: "#38bdf8", fontWeight: 700, marginBottom: 4 }}>🔒 Your Privacy Protected</div>
              <div style={{ fontSize: 11, color: "#8099b0", lineHeight: 1.6 }}>Your identity is not tracked · PST will not know who submitted this · They'll do general crew wellness checks</div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <div onClick={() => { setShowTipModal(false); setTipContext(null); }} style={{ flex: 1, padding: "13px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 13, fontWeight: 700, color: "#475569" }}>Cancel</div>
              <div onClick={() => { setShowTipModal(false); setTipContext(null); }} style={{ flex: 2, padding: "13px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(234,179,8,0.12)", border: "1.5px solid rgba(234,179,8,0.3)", fontSize: 13, fontWeight: 700, color: "#eab308" }}>Submit Wellness Check</div>
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
}
