import React, { useState, useRef } from 'react';
import { Screen, Card, SLabel, Btn } from './ui.jsx';
import { useLayoutConfig } from './utils.js';
import { useAuth } from './hooks/useAuth';

const ROLES = ["user", "pst", "supervisor", "admin", "platform"];
const ROLE_LABELS = {
  user: "Responder", pst: "PST Member", supervisor: "Supervisor",
  admin: "Admin", platform: "Platform Owner",
};
const ROLE_DESCRIPTIONS = {
  user:       "Basic wellness features",
  pst:        "PST panel · Alert response · Coverage status",
  supervisor: "All user features + Admin Tools (limited)",
  admin:      "Full Admin Tools · Dashboards · All screens",
  platform:   "Platform-wide management · All agencies · Owner access",
};

export default function AboutScreen({
  navigate, agency, onChangeAgency, role, setRole,
  userState, onChangeState, userLanguage = "en",
  setUserLanguage, logoSrc, MasterLoginModal,
}) {
  const [tab, setTab] = useState("about");
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const lc = useLayoutConfig();
  const { user, logout } = useAuth();

  const tabs = [
    { key: "about",    label: "About"    },
    { key: "founder",  label: "Founder"  },
    { key: "privacy",  label: "Privacy"  },
    { key: "security", label: "Security" },
    { key: "settings", label: "Settings" },
    { key: "account",  label: "Agency"   },
    { key: "role",     label: "Role"     },
  ];

  const tapCountRef = useRef(0);
  const tapTimerRef = useRef(null);
  const [showMasterLogin, setShowMasterLogin] = useState(false);

  const handleLogoTap = () => {
    tapCountRef.current += 1;
    clearTimeout(tapTimerRef.current);
    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      setShowMasterLogin(true);
    } else {
      tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0; }, 1200);
    }
  };

  const handleMasterSuccess = () => {
    setShowMasterLogin(false);
    setRole("platform");
    navigate("admintools");
  };

  const handleLogout = async () => {
    try { await logout(); } catch (e) {}
    setLogoutConfirm(false);
    navigate("home");
  };

  const tabStyle = (key) => ({
    flex: "0 0 auto", textAlign: "center",
    padding: "12px 16px", minHeight: 38, borderRadius: 9,
    background: tab === key ? "rgba(56,189,248,0.2)" : "rgba(255,255,255,0.02)",
    border: `1.5px solid ${tab === key ? "rgba(56,189,248,0.4)" : "rgba(56,189,248,0.12)"}`,
    cursor: "pointer", fontSize: 12, fontWeight: tab === key ? 800 : 600,
    color: tab === key ? "#dde8f4" : "#a8c5db",
    transition: "all 0.2s", whiteSpace: "nowrap",
    display: "flex", alignItems: "center",
  });

  return (
    <Screen headerProps={{ onBack: () => navigate("home"), title: "About", agencyName: agency?.name, logoSrc }}>

      {showMasterLogin && MasterLoginModal && (
        <MasterLoginModal onSuccess={handleMasterSuccess} onClose={() => setShowMasterLogin(false)} />
      )}

      {/* Logout confirm modal */}
      {logoutConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 }}>
          <div style={{ background: "#0c1929", border: "1.5px solid rgba(239,68,68,0.3)", borderRadius: 20, padding: "28px 22px", maxWidth: 340, width: "100%", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏻</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#f87171", marginBottom: 8 }}>Log Out?</div>
            <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, marginBottom: 24 }}>
              You will be signed out of your staff session. Regular wellness features remain available without logging in.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div onClick={() => setLogoutConfirm(false)} style={{ flex: 1, padding: "12px", borderRadius: 11, cursor: "pointer", textAlign: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", fontSize: 13, fontWeight: 700, color: "#475569" }}>Cancel</div>
              <div onClick={handleLogout} style={{ flex: 1, padding: "12px", borderRadius: 11, cursor: "pointer", textAlign: "center", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", fontSize: 13, fontWeight: 700, color: "#f87171" }}>Log Out</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="full-width" style={{ display: "flex", gap: 6, background: "rgba(56,189,248,0.04)", borderRadius: 12, padding: 8, overflowX: "auto", border: "1px solid rgba(56,189,248,0.15)", minHeight: 54 }}>
        {tabs.map(t => (
          <div key={t.key} onClick={() => setTab(t.key)} style={tabStyle(t.key)}>{t.label}</div>
        ))}
      </div>

      {/* ── ABOUT ── */}
      {tab === "about" && (
        <>
          <div className="full-width" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "10px 0" }}>
            {logoSrc && (
              <img src={logoSrc} alt="Upstream Approach" style={{ width: "60%", maxWidth: 220, height: "auto", objectFit: "contain" }}/>
            )}
            <div style={{ fontSize: 13, color: "#64748b", textAlign: "center", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              First Responder Wellness App
            </div>
            <div onClick={handleLogoTap} title="Tap 3× for platform access" style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(56,189,248,0.07)", border: "1.5px solid rgba(56,189,248,0.18)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 14, marginTop: 2 }}>🔐</div>
          </div>
          <Card>
            <SLabel>Our Purpose</SLabel>
            <p style={{ fontSize: 13, color: "#8099b0", lineHeight: 1.75, marginBottom: 12 }}>First responders face challenges most people will never experience. This app was created to provide support for those who spend their careers supporting everyone else.</p>
            <p style={{ fontSize: 13, color: "#8099b0", lineHeight: 1.75 }}>Our goal: <span style={{ color: "#dde8f4", fontWeight: 600 }}>make wellness support accessible, confidential, and built for the realities of the job.</span></p>
          </Card>
          <Card>
            <SLabel>Our Mission</SLabel>
            <p style={{ fontSize: 13, color: "#8099b0", lineHeight: 1.75 }}>To support the mental wellness and resilience of first responders by providing confidential tools, peer connection, and access to trusted support resources.</p>
          </Card>
          <Card>
            <SLabel>Who This Is For</SLabel>
            {["EMS / Paramedics / EMTs", "Firefighters", "Law Enforcement", "Emergency Communications / Dispatch", "Other emergency service professionals"].map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#38bdf8", flexShrink: 0 }}/>
                <span style={{ fontSize: 13, color: "#8099b0" }}>{r}</span>
              </div>
            ))}
          </Card>
          <Card style={{ background: "rgba(56,189,248,0.05)", borderColor: "rgba(56,189,248,0.15)" }} className="full-width">
            <SLabel>A Culture Shift</SLabel>
            <p style={{ fontSize: 13, color: "#38bdf8", fontWeight: 600, lineHeight: 1.6 }}>Taking care of yourself is not weakness — it's part of staying effective in the job and healthy outside of it.</p>
          </Card>
        </>
      )}

      {/* ── FOUNDER ── */}
      {tab === "founder" && (
        <>
          <div className="full-width" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "10px 0" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, rgba(14,165,233,0.2), rgba(56,189,248,0.1))", border: "2px solid rgba(56,189,248,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🌊</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#dde8f4" }}>Founder</div>
            <div style={{ fontSize: 12, color: "#64748b" }}>Nearly 30 years in Emergency Medical Services</div>
          </div>
          <Card style={{ background: "rgba(56,189,248,0.04)", borderColor: "rgba(56,189,248,0.12)" }}>
            <p style={{ fontSize: 13, color: "#8099b0", lineHeight: 1.8, marginBottom: 12 }}>This app was created by someone who understands the job from the inside.</p>
            <p style={{ fontSize: 13, color: "#8099b0", lineHeight: 1.8, marginBottom: 12 }}>After nearly three decades in EMS, I've seen firsthand the impact this profession can have on the people who serve in it.</p>
            <p style={{ fontSize: 13, color: "#8099b0", lineHeight: 1.8 }}>For many years, the culture encouraged people to keep moving to the next call. That mindset has helped many perform under pressure — but also made it harder for some to seek support.</p>
          </Card>
          <Card>
            <SLabel color="#38bdf8">Why "Upstream Approach"?</SLabel>
            <p style={{ fontSize: 13, color: "#8099b0", lineHeight: 1.8 }}>The name comes from addressing problems <span style={{ color: "#dde8f4", fontWeight: 600 }}>before they become crises</span> — recognizing stress early and building resilience over time.</p>
          </Card>
          <Card>
            <SLabel color="#38bdf8">Background</SLabel>
            {["Nearly 30 years in Emergency Medical Services", "Field Paramedic experience", "Communications / Dispatch experience", "Leadership and supervisory roles", "Peer support and wellness initiative experience"].map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "7px 0", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#38bdf8", flexShrink: 0, marginTop: 4 }}/>
                <span style={{ fontSize: 13, color: "#8099b0", lineHeight: 1.5 }}>{r}</span>
              </div>
            ))}
          </Card>
          <Card style={{ background: "rgba(56,189,248,0.04)", borderColor: "rgba(56,189,248,0.12)" }} className="full-width">
            <p style={{ fontSize: 13, color: "#38bdf8", fontWeight: 600, lineHeight: 1.7, textAlign: "center" }}>Taking care of the people who spend their careers taking care of everyone else.</p>
          </Card>
        </>
      )}

      {/* ── PRIVACY ── */}
      {tab === "privacy" && (
        <>
          <Card style={{ background: "rgba(34,197,94,0.05)", borderColor: "rgba(34,197,94,0.15)" }}>
            <SLabel color="#22c55e">Confidential by Design</SLabel>
            <p style={{ fontSize: 13, color: "#8099b0", lineHeight: 1.8 }}>We do not share personal information, conversations, or wellness check-in data with employers, supervisors, or agencies. Your data is not sold, shared, or used for marketing.</p>
          </Card>
          <Card style={{ background: "rgba(56,189,248,0.05)", borderColor: "rgba(56,189,248,0.15)" }}>
            <SLabel color="#38bdf8">Location & State Detection</SLabel>
            <p style={{ fontSize: 13, color: "#8099b0", lineHeight: 1.8, marginBottom: 8 }}>To show you relevant first responder resources, we detect your approximate state using your internet connection (IP address) — <span style={{ color: "#dde8f4", fontWeight: 600 }}>not your GPS or device location.</span></p>
            <p style={{ fontSize: 13, color: "#8099b0", lineHeight: 1.8 }}>You can always change your state manually in Settings. No location permission is ever requested.</p>
          </Card>
          <Card>
            <SLabel color="#a78bfa">Peer Support Conversations</SLabel>
            <p style={{ fontSize: 13, color: "#8099b0", lineHeight: 1.75 }}>Treated with respect and discretion, consistent with best practices in first responder peer support programs.</p>
          </Card>
          <Card>
            <SLabel color="#eab308">Your Control</SLabel>
            <p style={{ fontSize: 13, color: "#8099b0", lineHeight: 1.75 }}>You are always in control of what you share. Many features allow anonymous or minimal-input use.</p>
          </Card>
          <Card style={{ background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.18)" }}>
            <SLabel color="#f87171">Limits of Confidentiality</SLabel>
            {["Someone expresses an immediate risk of harm to themselves or others", "Required by applicable laws or emergency intervention protocols"].map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "5px 0" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#f87171", flexShrink: 0, marginTop: 5 }}/>
                <span style={{ fontSize: 12, color: "#8099b0", lineHeight: 1.6 }}>{r}</span>
              </div>
            ))}
          </Card>
          <div className="full-width" style={{ fontSize: 11, color: "#3d5268", textAlign: "center", lineHeight: 1.7 }}>This app is not a replacement for professional medical or mental health care.</div>
        </>
      )}

      {/* ── SECURITY ── */}
      {tab === "security" && (
        <>
          <Card style={{ background: "rgba(56,189,248,0.05)", borderColor: "rgba(56,189,248,0.15)" }}>
            <SLabel>Protecting Your Information</SLabel>
            <p style={{ fontSize: 13, color: "#8099b0", lineHeight: 1.8 }}>This platform uses modern security practices to ensure information you enter remains protected.</p>
          </Card>
          {[
            { title: "Encryption", color: "#38bdf8", icon: "🔐", body: "Data transmitted through the app is protected using secure encryption so it cannot easily be intercepted." },
            { title: "Limited Access", color: "#a78bfa", icon: "🔒", body: "Wellness information is not accessible to employers, agencies, or supervisors." },
            { title: "Responsible Data Handling", color: "#eab308", icon: "📋", body: "User information is used only to support the app's intended features." },
          ].map((s, i) => (
            <Card key={i}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                <SLabel color={s.color}>{s.title}</SLabel>
              </div>
              <p style={{ fontSize: 13, color: "#8099b0", lineHeight: 1.75 }}>{s.body}</p>
            </Card>
          ))}
        </>
      )}

      {/* ── SETTINGS ── */}
      {tab === "settings" && (
        <>
          <Card>
            <SLabel color="#38bdf8">Your Language</SLabel>
            <div style={{ fontSize: 13, color: "#8099b0", marginTop: 4, lineHeight: 1.6 }}>Auto-detected from your device. You can change it at any time.</div>
            <div style={{ background: "rgba(56,189,248,0.08)", border: "1.5px solid rgba(56,189,248,0.2)", borderRadius: 12, padding: "14px 16px", marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 2 }}>Current language</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#38bdf8" }}>{userLanguage === "es" ? "🇪🇸 Español" : "🇺🇸 English"}</div>
              </div>
              {setUserLanguage && (
                <div onClick={() => setUserLanguage(userLanguage === "es" ? "en" : "es")} style={{ fontSize: 13, color: "#38bdf8", fontWeight: 700, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>Change</div>
              )}
            </div>
          </Card>

          <Card>
            <SLabel color="#38bdf8">Your State</SLabel>
            <div style={{ fontSize: 13, color: "#8099b0", marginTop: 4, lineHeight: 1.6 }}>Used to show relevant first responder mental health resources in your state and surrounding areas.</div>
            <div style={{ background: "rgba(56,189,248,0.08)", border: "1.5px solid rgba(56,189,248,0.2)", borderRadius: 12, padding: "14px 16px", marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 2 }}>Currently set to</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#38bdf8" }}>{userState || "North Carolina"}</div>
              </div>
              {onChangeState && (
                <div onClick={onChangeState} style={{ fontSize: 13, color: "#38bdf8", fontWeight: 700, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>Change</div>
              )}
            </div>
          </Card>

          <Card style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.05)" }}>
            <SLabel color="#64748b">Privacy Note</SLabel>
            <div style={{ fontSize: 13, color: "#8099b0", marginTop: 8, lineHeight: 1.6 }}>Your state selection is stored only on this device and used to filter resources. It is never shared or transmitted.</div>
          </Card>

          {/* Staff session / logout — only shows when logged in */}
          {user && (
            <Card style={{ background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.18)" }}>
              <SLabel color="#f87171">Staff Session</SLabel>
              <div style={{ fontSize: 13, color: "#8099b0", marginTop: 4, marginBottom: 16, lineHeight: 1.6 }}>
                You are currently logged in as staff. Log out when you are done for the day or want to end your session.
              </div>
              <div
                onClick={() => setLogoutConfirm(true)}
                style={{ padding: "13px", borderRadius: 12, cursor: "pointer", textAlign: "center", background: "rgba(239,68,68,0.1)", border: "1.5px solid rgba(239,68,68,0.3)", fontSize: 14, fontWeight: 700, color: "#f87171", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                ⏻ Log Out
              </div>
            </Card>
          )}
        </>
      )}

      {/* ── ROLE ── */}
      {tab === "role" && (
        <>
          <Card style={{ background: "rgba(56,189,248,0.05)", borderColor: "rgba(56,189,248,0.15)" }} className="full-width">
            <SLabel>Current Role</SLabel>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#38bdf8", marginTop: 4 }}>{ROLE_LABELS[role] || role}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Tap a role to preview that experience. In production, roles are assigned by your agency administrator.</div>
          </Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }} className="full-width">
            {ROLES.map(r => (
              <div key={r} onClick={() => setRole(r)} style={{ background: role === r ? "rgba(56,189,248,0.1)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${role === r ? "rgba(56,189,248,0.3)" : "rgba(255,255,255,0.07)"}`, borderRadius: 14, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: role === r ? "#38bdf8" : "#1e3a52", flexShrink: 0 }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: role === r ? "#38bdf8" : "#dde8f4" }}>{ROLE_LABELS[r]}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{ROLE_DESCRIPTIONS[r]}</div>
                </div>
                {role === r && <span style={{ fontSize: 10, color: "#38bdf8", fontWeight: 700, background: "rgba(56,189,248,0.12)", padding: "3px 8px", borderRadius: 6 }}>ACTIVE</span>}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── AGENCY ── */}
      {tab === "account" && (
        <>
          <Card style={{ background: agency ? "rgba(56,189,248,0.05)" : "rgba(255,255,255,0.025)", borderColor: agency ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.06)" }} className="full-width">
            <SLabel color={agency ? "#38bdf8" : "#64748b"}>Current Mode</SLabel>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: agency ? "#22c55e" : "#2d4a66", boxShadow: agency ? "0 0 8px rgba(34,197,94,0.5)" : "none" }}/>
              <span style={{ fontSize: 16, fontWeight: 700, color: agency ? "#dde8f4" : "#64748b" }}>{agency ? agency.name : "Individual Mode"}</span>
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{agency ? "Agency code active · Human PST enabled" : "No agency linked · Human PST not available"}</div>
          </Card>
          <Btn color="#38bdf8" onClick={() => onChangeAgency()} className="full-width">{agency ? "Change Agency Code" : "Enter Agency Code →"}</Btn>
          <Card className="full-width">
            <SLabel>What agency codes unlock:</SLabel>
            {["Human PST availability panel", "Contact request flow (Text / Call)", "Agency name shown in header", "Crew Stream bar on Home Screen"].map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <div style={{ fontSize: 14 }}>{agency ? "✓" : "🔒"}</div>
                <span style={{ fontSize: 13, color: agency ? "#8099b0" : "#64748b" }}>{f}</span>
              </div>
            ))}
          </Card>
          <div className="full-width" style={{ fontSize: 11, color: "#3d5268", textAlign: "center" }}>Demo codes: UPSTREAM · DEMO123 · PST123</div>
        </>
      )}

    </Screen>
  );
}
