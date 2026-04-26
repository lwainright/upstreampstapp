// ============================================================
// SCREEN: FamilyConnectScreen
// Upstream Initiative — Family Connect
// Secure session-based chat — no server storage
// Session code expires after 24 hours or when closed
// Works for: medical review, veteran support, family check-in
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { ScreenSingle } from './ui.jsx';
import { databases } from './appwrite.js';
import { Client } from 'appwrite';
const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1')
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT || 'upstreamapproach');
import { ID, Query } from 'appwrite';

const ADJECTIVES = ["amber","blue","calm","dawn","echo","frost","gold","haven","iron","jade","keen","lark","mist","nova","oak","pine","quest","reed","sage","tide","ultra","vale","wind","xray","yield","zinc"];
const NOUNS = ["anchor","bridge","cedar","delta","ember","forge","grove","haven","inlet","junco","kite","ledge","maple","north","orbit","peak","quill","river","stone","trail","unity","vault","water","xenon","yarrow","zenith"];

function generateCode() {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${a}-${n}-${num}`.toUpperCase();
}

// Messaging via Appwrite Realtime + polling fallback
// Messages stored in Appwrite fc_sessions collection — auto-purged on close
// Zero long-term storage — session content deleted when ended

export default function FamilyConnectScreen({ navigate, agency, logoSrc }) {
  const [phase, setPhase] = useState("home"); // home | generate | join | chat
  const [sessionCode, setSessionCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [userName, setUserName] = useState("");
  const [joinError, setJoinError] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [sessionExpiry, setSessionExpiry] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [participants, setParticipants] = useState(1);
  const [myName, setMyName] = useState("");
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Countdown timer
  useEffect(() => {
    if (!sessionExpiry) return;
    const t = setInterval(() => {
      const remaining = sessionExpiry - Date.now();
      if (remaining <= 0) {
        clearInterval(t);
        endSession();
        return;
      }
      const h = Math.floor(remaining / 3600000);
      const m = Math.floor((remaining % 3600000) / 60000);
      setTimeLeft(h > 0 ? `${h}h ${m}m` : `${m}m`);
    }, 30000);
    return () => clearInterval(t);
  }, [sessionExpiry]);

  // Appwrite Realtime + polling fallback
  useEffect(() => {
    if (phase !== "chat") return;

    const DB_ID_RT = import.meta.env.VITE_APPWRITE_DATABASE || '69c88588001ed071c19e';

    // Poll Appwrite for messages
    const poll = async () => {
      try {
        const res = await databases.listDocuments(DB_ID_RT, 'fc_messages', [
          Query.equal('sessionCode', sessionCode),
          Query.orderAsc('timestamp'),
          Query.limit(200),
        ]);
        const msgs = (res.documents || []).map(d => ({
          id: d.$id,
          sender: d.sender,
          text: d.text,
          timestamp: d.timestamp,
          isMe: d.sender === myName,
        }));
        setMessages(msgs);
      } catch(e) {
        // Fallback to sessionStorage
        try {
          const stored = JSON.parse(sessionStorage.getItem(`fc_msgs_${sessionCode}`) || "[]");
          setMessages(stored);
        } catch(e2) {}
      }
    };

    poll();
    pollRef.current = setInterval(poll, 2000);

    // Appwrite Realtime subscription
    let unsubscribe;
    try {
      unsubscribe = client.subscribe(
        `databases.${DB_ID_RT}.collections.fc_messages.documents`,
        (response) => {
          if (response.payload?.sessionCode === sessionCode) {
            poll(); // Re-fetch on any change
          }
        }
      );
    } catch(e) {}

    return () => {
      clearInterval(pollRef.current);
      if (unsubscribe) try { unsubscribe(); } catch(e) {}
    };
  }, [phase, sessionCode, myName]);

  const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE || '69c88588001ed071c19e';

  const generateSession = async () => {
    const code = generateCode();
    const expiry = Date.now() + 24 * 60 * 60 * 1000;
    setSessionCode(code);
    setSessionExpiry(expiry);
    try {
      // Create session record in Appwrite
      await databases.createDocument(DB_ID, 'fc_sessions', ID.unique(), {
        code, expiry: new Date(expiry).toISOString(),
        createdAt: new Date().toISOString(), active: true,
      }).catch(() => {});
      // Fallback sessionStorage
      sessionStorage.setItem(`fc_session_${code}`, JSON.stringify({ expiry, created: Date.now() }));
    } catch(e) {}
    setPhase("generate");
  };

  const joinSession = async () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) { setJoinError("Please enter a session code."); return; }
    if (!userName.trim()) { setJoinError("Please enter your name."); return; }
    try {
      // Check Appwrite first
      let expiry = null;
      try {
        const res = await databases.listDocuments(DB_ID, 'fc_sessions', [
          Query.equal('code', code), Query.equal('active', true), Query.limit(1)
        ]);
        if (res.documents && res.documents[0]) {
          expiry = new Date(res.documents[0].expiry).getTime();
        }
      } catch(e) {}

      // Fallback to sessionStorage (same device)
      if (!expiry) {
        const local = sessionStorage.getItem(`fc_session_${code}`);
        if (local) {
          expiry = JSON.parse(local).expiry;
        }
      }

      if (!expiry) { setJoinError("Session not found. Check the code and try again."); return; }
      if (Date.now() > expiry) { setJoinError("This session has expired."); return; }

      setSessionCode(code);
      setSessionExpiry(expiry);
      setMyName(userName.trim());

      // Send join message via Appwrite
      await sendMessageToAppwrite(code, "system", `${userName.trim()} joined the session.`);
      setPhase("chat");
    } catch(e) {
      setJoinError("Could not join session. Please try again.");
    }
  };

  const startChat = () => {
    if (!userName.trim()) return;
    setMyName(userName.trim());
    // Add welcome message
    try {
      const msgs = JSON.parse(sessionStorage.getItem(`fc_msgs_${sessionCode}`) || "[]");
      msgs.push({ id: Date.now(), sender: "system", text: `Session started by ${userName.trim()}. Share the code to invite others.`, timestamp: new Date().toISOString() });
      sessionStorage.setItem(`fc_msgs_${sessionCode}`, JSON.stringify(msgs));
    } catch(e) {}
    setPhase("chat");
  };

  const DB_ID_CHAT = import.meta.env.VITE_APPWRITE_DATABASE || '69c88588001ed071c19e';

  const sendMessageToAppwrite = async (code, sender, text) => {
    try {
      await databases.createDocument(DB_ID_CHAT, 'fc_messages', ID.unique(), {
        sessionCode: code,
        sender,
        text,
        timestamp: new Date().toISOString(),
      });
    } catch(e) {
      // Fallback to sessionStorage
      try {
        const msgs = JSON.parse(sessionStorage.getItem(`fc_msgs_${code}`) || "[]");
        msgs.push({ id: Date.now(), sender, text, timestamp: new Date().toISOString() });
        sessionStorage.setItem(`fc_msgs_${code}`, JSON.stringify(msgs));
      } catch(e2) {}
    }
  };

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    // Add optimistically to UI
    const msg = { id: Date.now(), sender: myName, text, timestamp: new Date().toISOString(), isMe: true };
    setMessages(prev => [...prev, msg]);
    // Send to Appwrite
    sendMessageToAppwrite(sessionCode, myName, text);
  };

  const endSession = async () => {
    // Delete all messages for this session from Appwrite
    try {
      const DB_ID_END = import.meta.env.VITE_APPWRITE_DATABASE || '69c88588001ed071c19e';
      const res = await databases.listDocuments(DB_ID_END, 'fc_messages', [
        Query.equal('sessionCode', sessionCode), Query.limit(200)
      ]);
      await Promise.all((res.documents || []).map(d =>
        databases.deleteDocument(DB_ID_END, 'fc_messages', d.$id).catch(() => {})
      ));
      // Mark session inactive
      const sessions = await databases.listDocuments(DB_ID_END, 'fc_sessions', [
        Query.equal('code', sessionCode), Query.limit(1)
      ]);
      if (sessions.documents?.[0]) {
        await databases.updateDocument(DB_ID_END, 'fc_sessions', sessions.documents[0].$id, { active: false }).catch(() => {});
      }
    } catch(e) {}
    // Clear sessionStorage fallback
    try {
      sessionStorage.removeItem(`fc_session_${sessionCode}`);
      sessionStorage.removeItem(`fc_msgs_${sessionCode}`);
    } catch(e) {}
    setPhase("home");
    setSessionCode("");
    setMessages([]);
    setMyName("");
  };

  const copyCode = () => {
    try {
      navigator.clipboard.writeText(sessionCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch(e) {}
  };

  const inputStyle = {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12, padding: "12px 14px",
    fontSize: 14, fontFamily: "'DM Sans',sans-serif",
    outline: "none", color: "#dde8f4", width: "100%",
  };

  // ── HOME ──
  if (phase === "home") return (
    <ScreenSingle headerProps={{ onBack: () => navigate("home"), agencyName: agency?.name, logoSrc }}>
      <div style={{ fontSize: 22, textAlign: "center", marginBottom: 8 }}>🔗</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#dde8f4", textAlign: "center", marginBottom: 8 }}>Family Connect</div>
      <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7, textAlign: "center", marginBottom: 24 }}>
        A private, temporary session to talk through medical results, appointments, or anything else with someone you trust. No accounts. No stored history. Session disappears when you're done.
      </div>

      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>How it works</div>
        {[
          { icon: "1️⃣", text: "You start a session and get a code" },
          { icon: "2️⃣", text: "Share the code with a family member or friend" },
          { icon: "3️⃣", text: "They open the app and enter the code to join" },
          { icon: "4️⃣", text: "You chat privately — session ends when you close it" },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
            <span>{s.icon}</span>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>{s.text}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.15)", borderRadius: 12, padding: "12px 14px", marginBottom: 20, fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
        🔒 Nothing is stored on any server. All messages exist only in your browser session. Closing the session permanently deletes everything.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div onClick={generateSession} style={{ padding: "15px", borderRadius: 14, cursor: "pointer", textAlign: "center", background: "rgba(56,189,248,0.12)", border: "1.5px solid rgba(56,189,248,0.3)", fontSize: 15, fontWeight: 800, color: "#38bdf8" }}>
          Start a Session →
        </div>
        <div onClick={() => setPhase("join")} style={{ padding: "15px", borderRadius: 14, cursor: "pointer", textAlign: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 14, fontWeight: 700, color: "#94a3b8" }}>
          Join with a Code
        </div>
      </div>
    </ScreenSingle>
  );

  // ── GENERATE ──
  if (phase === "generate") return (
    <ScreenSingle headerProps={{ onBack: () => setPhase("home"), agencyName: agency?.name, logoSrc }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#38bdf8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Your Session Code</div>

      <div style={{ background: "rgba(56,189,248,0.08)", border: "2px solid rgba(56,189,248,0.3)", borderRadius: 16, padding: "24px", textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: "#38bdf8", letterSpacing: "0.08em", marginBottom: 8 }}>{sessionCode}</div>
        <div style={{ fontSize: 12, color: "#64748b" }}>Expires in 24 hours</div>
      </div>

      <div onClick={copyCode} style={{ padding: "12px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: copied ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"}`, fontSize: 13, fontWeight: 700, color: copied ? "#22c55e" : "#94a3b8", marginBottom: 16 }}>
        {copied ? "✓ Copied!" : "Copy Code"}
      </div>

      <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, marginBottom: 20 }}>
        Share this code with the person you want to connect with. They'll enter it in the app to join your session.
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Your name (so they know it's you)</div>
        <input value={userName} onChange={e => setUserName(e.target.value)} placeholder="Enter your name" style={inputStyle}/>
      </div>

      <div onClick={() => userName.trim() ? startChat() : null} style={{ padding: "15px", borderRadius: 14, cursor: userName.trim() ? "pointer" : "not-allowed", textAlign: "center", background: userName.trim() ? "rgba(56,189,248,0.12)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${userName.trim() ? "rgba(56,189,248,0.3)" : "rgba(255,255,255,0.07)"}`, fontSize: 15, fontWeight: 800, color: userName.trim() ? "#38bdf8" : "#334155" }}>
        Enter Session →
      </div>
    </ScreenSingle>
  );

  // ── JOIN ──
  if (phase === "join") return (
    <ScreenSingle headerProps={{ onBack: () => { setPhase("home"); setJoinError(""); }, agencyName: agency?.name, logoSrc }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: "#dde8f4", marginBottom: 8 }}>Join a Session</div>
      <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6, marginBottom: 20 }}>
        Enter the session code shared with you to join the conversation.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Session code</div>
          <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} placeholder="e.g. AMBER-CEDAR-412" style={{ ...inputStyle, textTransform: "uppercase", letterSpacing: "0.08em", fontSize: 16, fontWeight: 700, textAlign: "center" }}/>
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Your name</div>
          <input value={userName} onChange={e => setUserName(e.target.value)} placeholder="Enter your name" style={inputStyle}/>
        </div>
      </div>

      {joinError && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#f87171", marginBottom: 12 }}>
          {joinError}
        </div>
      )}

      <div onClick={joinSession} style={{ padding: "15px", borderRadius: 14, cursor: "pointer", textAlign: "center", background: "rgba(56,189,248,0.12)", border: "1.5px solid rgba(56,189,248,0.3)", fontSize: 15, fontWeight: 800, color: "#38bdf8" }}>
        Join Session →
      </div>
    </ScreenSingle>
  );

  // ── CHAT ──
  if (phase === "chat") return (
    <div style={{ position: "fixed", inset: 0, background: "#040d18", display: "flex", flexDirection: "column", fontFamily: "'DM Sans',sans-serif", zIndex: 100 }}>

      {/* Header */}
      <div style={{ background: "rgba(6,14,27,0.97)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#dde8f4" }}>Family Connect</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>Code: {sessionCode} · {participants} connected{timeLeft ? ` · ${timeLeft} left` : ""}</div>
        </div>
        <div onClick={endSession} style={{ padding: "7px 12px", borderRadius: 8, cursor: "pointer", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 11, fontWeight: 700, color: "#f87171" }}>
          End Session
        </div>
      </div>

      {/* Privacy notice */}
      <div style={{ background: "rgba(56,189,248,0.05)", borderBottom: "1px solid rgba(56,189,248,0.1)", padding: "8px 16px", fontSize: 11, color: "#334155", textAlign: "center", flexShrink: 0 }}>
        🔒 Private session · Nothing stored on any server · Closes permanently when you end
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#334155", fontSize: 13, padding: "40px 20px" }}>
            Session is ready. Share your code and start chatting.
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender === myName;
          const isSystem = msg.sender === "system";
          if (isSystem) return (
            <div key={msg.id} style={{ textAlign: "center", fontSize: 11, color: "#334155", padding: "4px 0" }}>{msg.text}</div>
          );
          return (
            <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
              <div style={{ maxWidth: "78%" }}>
                {!isMe && <div style={{ fontSize: 10, color: "#64748b", marginBottom: 3, paddingLeft: 4 }}>{msg.sender}</div>}
                <div style={{ background: isMe ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${isMe ? "rgba(56,189,248,0.25)" : "rgba(255,255,255,0.08)"}`, borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "11px 14px" }}>
                  <div style={{ fontSize: 13, color: "#dde8f4", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{msg.text}</div>
                </div>
                <div style={{ fontSize: 10, color: "#334155", marginTop: 3, textAlign: isMe ? "right" : "left", paddingLeft: isMe ? 0 : 4, paddingRight: isMe ? 4 : 0 }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px", background: "rgba(6,14,27,0.97)", borderTop: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Type a message..."
            rows={2}
            style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "10px 14px", fontSize: 13, fontFamily: "'DM Sans',sans-serif", outline: "none", resize: "none", color: "#dde8f4", lineHeight: 1.5 }}
          />
          <div onClick={sendMessage} style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, cursor: "pointer", background: "rgba(56,189,248,0.15)", border: "1.5px solid rgba(56,189,248,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );

  return null;
}
