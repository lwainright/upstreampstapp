// ============================================================
// escalation.js
// Upstream Initiative — Family Escalation System
// Fires SMS + push when a family member needs support
// Zero content — signal only
// ============================================================

const ESCALATION_URL = "/.netlify/functions/sms-escalate";

/**
 * Fire escalation — SMS + push to registered parent/responder
 * @param {object} opts
 * @param {string} opts.memberType - spouse | teen | child | young | adult
 * @param {string} opts.urgency    - low | medium | high | red
 * @param {string} opts.agencyCode - agency code
 * @param {string} opts.agencyName - agency name for SMS
 */
export async function fireEscalation({ memberType, urgency = "medium", agencyCode, agencyName }) {
  // Get contact phone from family codes
  const contactPhone = getContactPhone();
  if (!contactPhone) return { sent: false, reason: "no_contact" };

  // Get cancel window based on age
  const cancelWindow = memberType === "young" ? 0 : memberType === "child" ? 0 : 60; // seconds

  if (cancelWindow > 0) {
    // Show cancel window — returns true if cancelled
    const cancelled = await showCancelWindow(cancelWindow, memberType);
    if (cancelled) return { sent: false, reason: "cancelled" };
  }

  // Send SMS
  let smsSent = false;
  try {
    const res = await fetch(ESCALATION_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toPhone: contactPhone, agencyName, memberType, urgency }),
    });
    smsSent = res.ok;
  } catch(e) {
    console.warn("SMS escalation failed:", e.message);
  }

  // Send push notification
  let pushSent = false;
  try {
    pushSent = await sendPushEscalation({ memberType, urgency, agencyName });
  } catch(e) {
    console.warn("Push escalation failed:", e.message);
  }

  // Log escalation (anonymous — no content)
  try {
    logEscalationEvent({ memberType, urgency, agencyCode, smsSent, pushSent });
  } catch(e) {}

  return { sent: smsSent || pushSent, smsSent, pushSent };
}

/**
 * Get the contact phone from stored family codes
 */
function getContactPhone() {
  try {
    const codes = JSON.parse(localStorage.getItem("upstream_family_codes") || "[]");
    const myCode = localStorage.getItem("upstream_my_family_code");
    if (myCode) {
      const match = codes.find(c => c.code === myCode);
      return match?.contactPhone || null;
    }
    // Fall back to any code with a phone
    const withPhone = codes.find(c => c.contactPhone);
    return withPhone?.contactPhone || null;
  } catch(e) { return null; }
}

/**
 * Show cancel window — returns promise that resolves to true if cancelled
 */
function showCancelWindow(seconds, memberType) {
  return new Promise((resolve) => {
    // Create overlay
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.9);
      display: flex; align-items: center; justify-content: center;
      z-index: 99999; font-family: 'DM Sans', sans-serif; padding: 24px;
    `;

    let remaining = seconds;
    let timer;
    let cancelled = false;

    const update = () => {
      overlay.innerHTML = `
        <div style="background:#0b1829;border:1.5px solid rgba(239,68,68,0.4);border-radius:20px;padding:28px 24px;max-width:360px;width:100%;text-align:center;">
          <div style="font-size:40px;margin-bottom:16px;">💙</div>
          <div style="font-size:18px;font-weight:800;color:#dde8f4;margin-bottom:8px;">Sending support alert</div>
          <div style="font-size:13px;color:#94a3b8;line-height:1.7;margin-bottom:20px;">
            We're letting someone know you might need support.<br/>No details are shared — just the signal.
          </div>
          <div style="font-size:32px;font-weight:900;color:#ef4444;margin-bottom:16px;">${remaining}</div>
          <div style="font-size:11px;color:#475569;margin-bottom:16px;">seconds until sent</div>
          <button id="cancel-escalation" style="width:100%;padding:14px;border-radius:12px;cursor:pointer;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);font-size:13px;font-weight:700;color:#8099b0;font-family:'DM Sans',sans-serif;">
            I'm okay — cancel
          </button>
        </div>
      `;
      document.getElementById("cancel-escalation")?.addEventListener("click", () => {
        cancelled = true;
        clearInterval(timer);
        document.body.removeChild(overlay);
        resolve(true);
      });
    };

    document.body.appendChild(overlay);
    update();

    timer = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(timer);
        document.body.removeChild(overlay);
        resolve(false);
      } else {
        update();
      }
    }, 1000);
  });
}

/**
 * Send push notification via service worker
 */
async function sendPushEscalation({ memberType, urgency, agencyName }) {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return false;

    // Call push notification endpoint
    const res = await fetch("/.netlify/functions/push-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: sub,
        title: "Upstream Approach",
        body: `Someone in your family may need your support right now. Check in when you can.`,
        data: { type: "family_escalation", memberType, urgency },
      }),
    });
    return res.ok;
  } catch(e) { return false; }
}

/**
 * Log escalation event — anonymous, no content
 */
async function logEscalationEvent({ memberType, urgency, agencyCode, smsSent, pushSent }) {
  try {
    const { databases } = await import('./appwrite.js');
    const { ID } = await import('appwrite');
    const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE || '69c88588001ed071c19e';
    await databases.createDocument(DB_ID, 'escalations', ID.unique(), {
      agencyCode: agencyCode || "NONE",
      level: urgency,
      trigger: `family_${memberType}`,
      hour: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
    });
  } catch(e) {}
}

/**
 * Check if escalation should fire based on AI chat content
 * Called from AIChatScreen when crisis keywords detected
 */
export function checkEscalationTrigger(message) {
  const lower = message.toLowerCase();
  const redKeywords = [
    "hurt myself", "hurt myself", "end it", "don't want to be here",
    "nobody cares", "can't take it", "kill myself", "suicide",
    "want to die", "not safe", "scared", "help me",
  ];
  const orangeKeywords = [
    "really bad", "falling apart", "can't cope", "overwhelmed",
    "breaking down", "losing it", "can't do this",
  ];

  const isRed = redKeywords.some(k => lower.includes(k));
  const isOrange = orangeKeywords.some(k => lower.includes(k));

  if (isRed) return { shouldEscalate: true, urgency: "red" };
  if (isOrange) return { shouldEscalate: true, urgency: "orange" };
  return { shouldEscalate: false };
}

/**
 * Register family member's own code for escalation tracking
 */
export function registerFamilyCode(code) {
  try {
    localStorage.setItem("upstream_my_family_code", code);
  } catch(e) {}
}
