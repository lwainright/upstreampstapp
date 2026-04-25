// ============================================================
// COMPONENT: AIMedicalChat
// Upstream Initiative — Medical Wellness AI Chat
// Inside Safety Vault — PIN protected
// ⚠️ NOT MEDICAL ADVICE — Plain language only, non-diagnostic
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { MedicalDisclaimer } from './MedicalVaultSection.jsx';

const SYSTEM_PROMPT = `You are a plain-language medical wellness assistant inside a private, secure app for first responders, veterans, and their families.

CRITICAL RULES — follow these without exception:
1. You are NOT a doctor. You do NOT provide medical advice, diagnoses, or treatment recommendations.
2. Every response must be written at a 6th/7th grade reading level — clear, simple, no jargon.
3. Never speculate about what a result "probably means" for the user specifically.
4. Never say "you should" regarding medical decisions.
5. Always end responses with: "For questions about your specific results, please contact your physician or healthcare provider. If this is a medical emergency, call 911."
6. When asked about lab values or imaging results, explain what the GENERAL term means — not what it means for this specific person.
7. Be warm, calm, and steady. These users may be scared or overwhelmed. Never alarm them unnecessarily.
8. If someone describes a medical emergency (chest pain, difficulty breathing, severe bleeding, loss of consciousness, stroke symptoms), immediately tell them to call 911. Do not provide any other information first.
9. You can help users: understand medical terms in plain language, prepare questions for their doctor, organize their symptoms, understand what to expect during tests, and feel less overwhelmed by their results.
10. You cannot: interpret individual results, diagnose conditions, recommend treatments, or replace a physician.

Tone: Calm, steady, peer-to-peer. Like a trusted friend who happens to understand medical terminology and can translate it into plain English. Not clinical. Not alarming. Not dismissive.`;

export default function AIMedicalChat({ onClose }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hey — I'm here to help you make sense of medical information in plain language. I can help you understand lab values, imaging terms, prepare questions for your doctor, or just talk through what you're seeing in a report.\n\nI'm not a doctor and I can't interpret your specific results — but I can help you understand what things mean in general and feel less overwhelmed.\n\nWhat's on your mind?",
      id: Date.now(),
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError("");

    const userMsg = { role: "user", content: text, id: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newMessages
            .filter(m => m.role === "user" || m.role === "assistant")
            .map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();
      const reply = data?.content?.[0]?.text || "I couldn't get a response. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: reply, id: Date.now() }]);
    } catch (e) {
      setError("Connection issue — please try again.");
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#040d18" }}>

      {/* Disclaimer — compact, always visible */}
      <MedicalDisclaimer compact/>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingBottom: 16 }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "85%",
              background: msg.role === "user"
                ? "rgba(56,189,248,0.15)"
                : "rgba(255,255,255,0.04)",
              border: `1px solid ${msg.role === "user" ? "rgba(56,189,248,0.3)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              padding: "12px 14px",
            }}>
              {msg.role === "assistant" && (
                <div style={{ fontSize: 10, fontWeight: 700, color: "#38bdf8", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                  Medical Assistant
                </div>
              )}
              <div style={{ fontSize: 13, color: "#dde8f4", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px 16px 16px 4px", padding: "12px 16px", display: "flex", gap: 6, alignItems: "center" }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "#38bdf8", opacity: 0.6, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}/>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#f87171", textAlign: "center" }}>
            {error}
          </div>
        )}

        <div ref={bottomRef}/>
      </div>

      {/* Quick prompts */}
      {messages.length === 1 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {[
            "What does a high WBC mean?",
            "Help me understand my imaging report",
            "What questions should I ask my doctor?",
            "What does 'lesion' mean on an MRI?",
            "Help me prep for my appointment",
          ].map((prompt, i) => (
            <div key={i} onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
              style={{ padding: "7px 12px", borderRadius: 20, cursor: "pointer", background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", fontSize: 11, fontWeight: 600, color: "#38bdf8", whiteSpace: "nowrap" }}>
              {prompt}
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about lab values, imaging terms, or appointment prep..."
          rows={2}
          style={{
            flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 14, padding: "12px 14px", fontSize: 13,
            fontFamily: "'DM Sans',sans-serif", outline: "none", resize: "none",
            color: "#dde8f4", lineHeight: 1.5,
          }}
        />
        <div
          onClick={sendMessage}
          style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0, cursor: loading ? "not-allowed" : "pointer",
            background: loading ? "rgba(255,255,255,0.04)" : "rgba(56,189,248,0.15)",
            border: `1.5px solid ${loading ? "rgba(255,255,255,0.08)" : "rgba(56,189,248,0.35)"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={loading ? "#334155" : "#38bdf8"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </div>
      </div>

      {/* Disclaimer footer */}
      <div style={{ marginTop: 10, fontSize: 10, color: "#334155", textAlign: "center", lineHeight: 1.5 }}>
        Not medical advice · Always consult your physician · Emergency: call 911
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
