// ============================================================
// COMPONENT: KidsHomeScreen
// Upstream Initiative — Age-Appropriate Home Experience
// For Under 8 and 8-12 family members
// Simple, emoji-based, no clinical language
// ============================================================
import React, { useState } from 'react';
import { getAgeConfig, getAgeMentalHealthResources } from './AgeExperience.js';

const UNDER8_EMOJIS = [
  { emoji: "😊", label: "Happy",   color: "#22c55e" },
  { emoji: "😐", label: "Okay",    color: "#38bdf8" },
  { emoji: "😢", label: "Sad",     color: "#60a5fa" },
  { emoji: "😡", label: "Angry",   color: "#f97316" },
  { emoji: "😨", label: "Scared",  color: "#a78bfa" },
];

const CHILD_EMOJIS = [
  { emoji: "😊", label: "Great",        color: "#22c55e" },
  { emoji: "😐", label: "Okay",         color: "#38bdf8" },
  { emoji: "😕", label: "A little off", color: "#eab308" },
  { emoji: "😢", label: "Sad",          color: "#60a5fa" },
  { emoji: "😤", label: "Frustrated",   color: "#f97316" },
  { emoji: "😨", label: "Worried",      color: "#a78bfa" },
];

export default function KidsHomeScreen({ navigate, agency, ageConfig }) {
  const [selected, setSelected] = useState(null);
  const [saved, setSaved] = useState(false);
  const isUnder8 = ageConfig?.ageKey === "under8";
  const isCollege = ageConfig?.ageKey === "18-24";
  const emojis = isUnder8 ? UNDER8_EMOJIS : CHILD_EMOJIS;
  const agencyColor = ageConfig?.primaryColor || "#38bdf8";

  const saveCheckIn = async (emoji) => {
    setSelected(emoji.label);
    setSaved(true);
    const entry = { feeling: emoji.label, emoji: emoji.emoji, timestamp: new Date().toISOString() };

    // Save locally
    try {
      const history = JSON.parse(localStorage.getItem("upstream_kids_checkins") || "[]");
      history.unshift(entry);
      localStorage.setItem("upstream_kids_checkins", JSON.stringify(history.slice(0, 30)));
    } catch(e) {}

    // Save anonymous trend to Appwrite for parent visibility
    // No identity — just mood + age group + timestamp
    try {
      const { databases } = await import('./appwrite.js');
      const { ID } = await import('appwrite');
      const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE || '69c88588001ed071c19e';
      const familyToken = localStorage.getItem("upstream_family_token") || null;
      const ageKey = localStorage.getItem("upstream_family_seat") || "family";
      await databases.createDocument(DB_ID, 'family_checkins', ID.unique(), {
        familyToken,
        ageKey,
        feeling: emoji.label,
        severity: ["Happy","Great"].includes(emoji.label) ? 0
          : ["Okay"].includes(emoji.label) ? 1
          : ["A little off","Frustrated"].includes(emoji.label) ? 2
          : ["Sad","Worried"].includes(emoji.label) ? 3
          : 4, // Angry, Scared
        timestamp: new Date().toISOString(),
      });
    } catch(e) {}

    // Check if escalation needed (Scared or very high severity)
    if (["Scared", "Angry"].includes(emoji.label) && ageConfig?.escalateImmediately) {
      try {
        const { fireEscalation } = await import('./escalation.js');
        const ageKey = localStorage.getItem("upstream_family_seat") || "under8";
        fireEscalation({
          memberType: ageKey,
          urgency: emoji.label === "Scared" ? "red" : "orange",
          agencyCode: agency?.code || "NONE",
          agencyName: agency?.name,
        });
      } catch(e) {}
    }
  };

  const hr = new Date().getHours();
  const timeGreeting = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ minHeight: "100vh", background: "#040d18", fontFamily: "'DM Sans', sans-serif", padding: "0 0 80px" }}>

      {/* Header */}
      <div style={{ background: "rgba(6,14,27,0.97)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 12, color: agencyColor, fontWeight: 700 }}>
            {agency?.name || "Upstream"}
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#dde8f4", marginTop: 2 }}>
            {timeGreeting}! {isUnder8 ? "👋" : "Hey 👋"}
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 20px", maxWidth: 480, margin: "0 auto" }}>

        {/* Check-in */}
        <div style={{ background: agencyColor + "08", border: `1.5px solid ${agencyColor}20`, borderRadius: 20, padding: "20px", marginBottom: 24 }}>
          <div style={{ fontSize: isUnder8 ? 20 : 16, fontWeight: 800, color: "#dde8f4", marginBottom: 4, textAlign: "center" }}>
            {isUnder8 ? "How are you feeling?" : "How are you doing today?"}
          </div>
          {!saved ? (
            <div style={{ display: "flex", gap: isUnder8 ? 12 : 8, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
              {emojis.map((e, i) => (
                <div key={i} onClick={() => saveCheckIn(e)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer", padding: "12px 10px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", minWidth: isUnder8 ? 70 : 60, transition: "all 0.15s" }}>
                  <span style={{ fontSize: isUnder8 ? 40 : 32 }}>{e.emoji}</span>
                  <span style={{ fontSize: isUnder8 ? 13 : 11, fontWeight: 600, color: "#94a3b8" }}>{e.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <div style={{ fontSize: 48 }}>{emojis.find(e => e.label === selected)?.emoji}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#dde8f4", marginTop: 8 }}>
                {isUnder8 ? "Thank you for sharing! 💙" : `Got it — ${selected}`}
              </div>
              <div onClick={() => { setSelected(null); setSaved(false); }} style={{ fontSize: 12, color: "#475569", marginTop: 8, cursor: "pointer", textDecoration: "underline" }}>
                Change
              </div>
            </div>
          )}
        </div>

        {/* Tools */}
        <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
          {isUnder8 ? "Things that help" : "Tools"}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Breathing */}
          <div onClick={() => navigate("breathing")} style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 16, padding: "16px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 28 }}>🫁</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#22c55e" }}>
                {isUnder8 ? "Belly Breathing" : "Breathing"}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                {isUnder8 ? "Breathe like a big balloon" : "Box breathing — calms you down fast"}
              </div>
            </div>
          </div>

          {/* Grounding */}
          <div onClick={() => navigate("grounding")} style={{ background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 16, padding: "16px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 28 }}>🌿</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#38bdf8" }}>
                {isUnder8 ? "Look Around" : "5-4-3-2-1 Grounding"}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                {isUnder8 ? "Find things around you" : "Find what you see, hear, and feel"}
              </div>
            </div>
          </div>

          {/* Follow the light */}
          <div onClick={() => navigate("ptsd")} style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 16, padding: "16px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 28 }}>💙</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#a78bfa" }}>Follow the Light</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                {isUnder8 ? "Watch the light move — it helps" : "Moving light to follow — auto-runs"}
              </div>
            </div>
          </div>

          {/* Journal — 8-12 only */}
          {!isUnder8 && (
            <div onClick={() => navigate("journal")} style={{ background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)", borderRadius: 16, padding: "16px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 28 }}>📓</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#a78bfa" }}>Journal</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Write or record — just for you. Nobody reads it.</div>
              </div>
            </div>
          )}

          {/* AI Chat — 8-12 only */}
          {!isUnder8 && (
            <div onClick={() => navigate("aichat")} style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", borderRadius: 16, padding: "16px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontSize: 28 }}>💬</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#f87171" }}>Talk to Someone</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Private chat — nobody else sees it</div>
              </div>
            </div>
          )}
        </div>

        {/* School resources */}
        <div style={{ fontSize:12, fontWeight:700, color:"#475569", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10, marginTop:8 }}>
          {isUnder8 ? "At school" : "School resources"}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
          {isUnder8 ? (
            <>
              <div style={{ background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.15)", borderRadius:14, padding:"14px 16px" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#22c55e", marginBottom:4 }}>🏫 Your school counselor can help</div>
                <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6 }}>If something feels hard at school, you can talk to your counselor. That is their job and they want to help you.</div>
              </div>
              <div style={{ background:"rgba(56,189,248,0.06)", border:"1px solid rgba(56,189,248,0.15)", borderRadius:14, padding:"14px 16px" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#38bdf8", marginBottom:4 }}>👩‍🏫 Trusted adults at school</div>
                <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6 }}>Your teacher, the school nurse, or the principal are all people you can go to if you feel scared or upset.</div>
              </div>
            </>
          ) : (
            <>
              <div style={{ background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.15)", borderRadius:14, padding:"14px 16px" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#22c55e", marginBottom:4 }}>🏫 School counselor</div>
                <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6 }}>Your school counselor is there for more than class schedules. If things at home feel heavy or school feels overwhelming, they can help — and it stays private.</div>
              </div>
              <div style={{ background:"rgba(167,139,250,0.06)", border:"1px solid rgba(167,139,250,0.15)", borderRadius:14, padding:"14px 16px" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#a78bfa", marginBottom:4 }}>👤 Trusted adult at school</div>
                <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6 }}>Think of one adult at school you trust — a teacher, coach, or staff member. You don't have to explain everything. Just "I'm having a hard time" is enough to start.</div>
              </div>
              <div onClick={() => window.open("https://www.studentcrisisline.org", "_blank")} style={{ background:"rgba(56,189,248,0.06)", border:"1px solid rgba(56,189,248,0.15)", borderRadius:14, padding:"14px 16px", cursor:"pointer" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#38bdf8", marginBottom:4 }}>💬 Teen Line — talk to another teen</div>
                <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6 }}>Peer support by teens, for teens. Text TEEN to 839863 or call 1-800-852-8336.</div>
              </div>
              <div onClick={() => window.location.href = "sms:741741?body=HOME"} style={{ background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.15)", borderRadius:14, padding:"14px 16px", cursor:"pointer" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#ef4444", marginBottom:4 }}>📱 Crisis Text Line</div>
                <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6 }}>Text HOME to 741741. If you don't want to talk, you can text. Available 24/7.</div>
              </div>
            </>
          )}
        </div>

        {/* College / job market resources — 18-24 only */}
        {isCollege && (
          <>
            <div style={{ fontSize:12, fontWeight:700, color:"#475569", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10, marginTop:8 }}>College & Career Resources</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:20 }}>
              <div onClick={() => window.open("https://www.activeminds.org", "_blank")} style={{ background:"rgba(34,197,94,0.06)", border:"1px solid rgba(34,197,94,0.15)", borderRadius:14, padding:"14px 16px", cursor:"pointer" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#22c55e", marginBottom:4 }}>🎓 Active Minds — College Mental Health</div>
                <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6 }}>Mental health resources specifically for college students. Campus chapters, peer support, and tools for navigating college stress.</div>
              </div>
              <div onClick={() => window.open("https://www.jedfoundation.org", "_blank")} style={{ background:"rgba(56,189,248,0.06)", border:"1px solid rgba(56,189,248,0.15)", borderRadius:14, padding:"14px 16px", cursor:"pointer" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#38bdf8", marginBottom:4 }}>💙 JED Foundation — College Student Wellness</div>
                <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6 }}>Mental health and suicide prevention for college students and young adults. seizetheawkward.org for conversations about mental health.</div>
              </div>
              <div onClick={() => window.open("https://www.studentveterans.org", "_blank")} style={{ background:"rgba(167,139,250,0.06)", border:"1px solid rgba(167,139,250,0.15)", borderRadius:14, padding:"14px 16px", cursor:"pointer" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#a78bfa", marginBottom:4 }}>🎖 Student Veterans of America</div>
                <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6 }}>Support for veterans and first responder family members in higher education — scholarships, peer support, and transition resources.</div>
              </div>
              <div onClick={() => window.open("https://www.loveisrespect.org", "_blank")} style={{ background:"rgba(249,115,22,0.06)", border:"1px solid rgba(249,115,22,0.15)", borderRadius:14, padding:"14px 16px", cursor:"pointer" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#f97316", marginBottom:4 }}>❤️ Love is Respect — Healthy Relationships</div>
                <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6 }}>Understanding healthy vs. unhealthy relationship patterns — especially important for those who grew up in high-stress households. Ages 13–26.</div>
              </div>
              <div onClick={() => window.open("https://www.finaid.org", "_blank")} style={{ background:"rgba(234,179,8,0.06)", border:"1px solid rgba(234,179,8,0.15)", borderRadius:14, padding:"14px 16px", cursor:"pointer" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"#eab308", marginBottom:4 }}>💰 Financial Aid — First Responder Scholarships</div>
                <div style={{ fontSize:12, color:"#94a3b8", lineHeight:1.6 }}>Scholarship and grant resources for children of first responders and veterans entering college or vocational programs.</div>
              </div>
            </div>
          </>
        )}

        {/* Age-appropriate mental health resources */}
        <div style={{ fontSize:12, fontWeight:700, color:"#475569", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:10, marginTop:8 }}>
          {isUnder8 ? "If you need help" : "Mental health resources"}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:16 }}>
          {getAgeMentalHealthResources(ageConfig?.ageKey || "8-12").map((r, i) => (
            <div key={i} onClick={() => {
              if (r.phone) window.location.href = `tel:${r.phone}`;
              else if (r.text) window.location.href = `sms:${r.text}${r.textBody ? `?body=${r.textBody}` : ""}`;
              else if (r.url) window.open(r.url, "_blank");
            }} style={{ background:"rgba(255,255,255,0.025)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:12, padding:"11px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:700, color:agencyColor }}>{r.label}</div>
                <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>{r.detail}</div>
              </div>
              {(r.phone || r.text || r.url) && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              )}
            </div>
          ))}
        </div>

        {/* Help line — always visible */}
        <div style={{ marginTop: 24, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 14, padding: "14px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>
            {isUnder8 ? "Need help? Find a grown-up you trust. Or call:" : "Need to talk to someone right now?"}
          </div>
          <div onClick={() => window.location.href = "tel:988"} style={{ fontSize: 14, fontWeight: 800, color: "#ef4444", cursor: "pointer" }}>
            📞 {isUnder8 ? "Call for help: 988" : "988 — Call or Text"}
          </div>
        </div>

      </div>
    </div>
  );
}
