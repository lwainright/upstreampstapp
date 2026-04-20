// ============================================================
// ANALYTICS — Upstream Initiative
// Event-only tracking. No conversations. No identity.
// Fire-and-forget — never blocks UI, never crashes app.
// ============================================================

const AW_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const AW_PROJECT  = import.meta.env.VITE_APPWRITE_PROJECT  || 'upstreamapproach';
const AW_DB       = import.meta.env.VITE_APPWRITE_DATABASE || 'upstream_db';
export { AW_ENDPOINT, AW_PROJECT, AW_DB };

// ── Dev mode — set in browser console to exclude your devices ──────────────
// localStorage.setItem("upstream_dev_device", "true")
const isDev = () => {
  try { return localStorage.getItem("upstream_dev_device") === "true"; } catch(e) { return false; }
};

// ── Core tracker ──────────────────────────────────────────────────────────
export async function awTrack(collection, data) {
  if (isDev()) return; // never count dev devices
  try {
    const id = 'id' + Date.now() + Math.random().toString(36).slice(2, 7);
    await fetch(`${AW_ENDPOINT}/databases/${AW_DB}/collections/${collection}/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': AW_PROJECT,
      },
      body: JSON.stringify({
        documentId: id,
        data: { ...data, timestamp: new Date().toISOString() },
      }),
    });
  } catch(e) { /* silent — analytics never interrupts the user */ }
}

// ── Existing trackers (unchanged) ─────────────────────────────────────────

export function trackCheckin(agencyCode, status, shiftPhase) {
  const now = new Date();
  awTrack('checkins', {
    agencyCode:  agencyCode || 'NONE',
    status,
    shiftPhase:  shiftPhase || '',
    dayOfWeek:   now.getDay(),
    hour:        now.getHours(),
  });
}

export function trackTool(agencyCode, tool) {
  awTrack('tool_usage', {
    agencyCode: agencyCode || 'NONE',
    tool,
  });
}

export function trackAISession(agencyCode, crisisLevel, messageCount) {
  awTrack('ai_sessions', {
    agencyCode:   agencyCode || 'NONE',
    crisisLevel:  crisisLevel  || 0,
    messageCount: messageCount || 1,
  });
}

export function trackPSTContact(agencyCode, contactType) {
  awTrack('pst_contacts', {
    agencyCode:  agencyCode || 'NONE',
    contactType,
    resolved:    false,
  });
}

// ── New trackers ──────────────────────────────────────────────────────────

// Escalation — when crisis card appears or buddy check fires
// level: 1-4, trigger: "keywords" | "buddy_check" | "reentry"
export function trackEscalation(agencyCode, level, trigger) {
  const now = new Date();
  awTrack('escalations', {
    agencyCode: agencyCode || 'NONE',
    level:      level      || 0,
    trigger:    trigger    || 'keywords',
    hour:       now.getHours(),
    dayOfWeek:  now.getDay(),
  });
}

// Buddy check — what choice they made when checked on
// choice: "ok" | "30min" | "tomorrow" | "talk_now"
export function trackBuddyCheck(agencyCode, crisisLevel, choice) {
  awTrack('buddy_checks', {
    agencyCode:  agencyCode  || 'NONE',
    crisisLevel: crisisLevel || 0,
    choice:      choice      || 'ok',
  });
}

// HRV reading — anonymous, device only, no biometric stored
// value: the HRV number, category: "high" | "moderate" | "low"
// context: "morning" | "post_shift" | "manual"
export function trackHRV(agencyCode, value, category, context) {
  const now = new Date();
  awTrack('hrv_readings', {
    agencyCode: agencyCode || 'NONE',
    value:      value      || 0,
    category:   category   || 'moderate',
    context:    context    || 'manual',
    hour:       now.getHours(),
    dayOfWeek:  now.getDay(),
  });
}

// Resource viewed — which resource category, which state
export function trackResourceView(agencyCode, category, userState) {
  awTrack('resource_views', {
    agencyCode: agencyCode || 'NONE',
    category:   category   || 'general',
    userState:  userState  || 'NC',
  });
}

// Debrief completed — after action, shift check, or 90-second dump
// type: "afteraction" | "shiftcheck" | "dump90"
// completedSteps: how many steps they finished (not content)
export function trackDebrief(agencyCode, type, completedSteps) {
  awTrack('debriefs', {
    agencyCode:     agencyCode     || 'NONE',
    type:           type           || 'shiftcheck',
    completedSteps: completedSteps || 0,
  });
}

// Session start — anonymous app open event
// frVerified: did they verify as first responder
export function trackSessionStart(agencyCode, frVerified) {
  const now = new Date();
  awTrack('sessions', {
    agencyCode: agencyCode || 'NONE',
    frVerified: frVerified || false,
    hour:       now.getHours(),
    dayOfWeek:  now.getDay(),
  });
}

// Support option chosen from crisis card
// option: "human_pst" | "988" | "211" | "safe_call_now" | "resources" | "continue"
export function trackSupportChoice(agencyCode, crisisLevel, option) {
  awTrack('support_choices', {
    agencyCode:  agencyCode  || 'NONE',
    crisisLevel: crisisLevel || 0,
    option:      option      || 'continue',
  });
}
