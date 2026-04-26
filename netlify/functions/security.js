// ============================================================
// security.js -- Netlify Functions Security Utilities
// Rate limiting, input sanitization, CSP helpers
// Used by chat.js, search.js, sms-escalate.js, push-notify.js
// ============================================================

// ── In-Memory Rate Limiter ────────────────────────────────────
// Netlify functions are stateless so this resets per instance.
// For production scale use Upstash Redis or Netlify Edge.
const rateLimitStore = new Map();

/**
 * Simple rate limiter -- max requests per window per IP
 * @param {string} ip - Client IP
 * @param {string} action - Action type (chat, search, pst, etc.)
 * @param {number} maxRequests - Max requests in window
 * @param {number} windowMs - Window in milliseconds
 * @returns {boolean} - true if allowed, false if rate limited
 */
function checkRateLimit(ip, action, maxRequests = 20, windowMs = 60000) {
  const key = `${ip}:${action}`;
  const now = Date.now();
  const record = rateLimitStore.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > record.resetAt) {
    // Window expired -- reset
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false; // Rate limited
  }

  record.count++;
  rateLimitStore.set(key, record);
  return true;
}

// ── Input Sanitization ────────────────────────────────────────
/**
 * Sanitize a string -- remove HTML, limit length, strip control chars
 */
function sanitizeText(input, maxLength = 2000) {
  if (!input || typeof input !== "string") return "";
  return input
    .slice(0, maxLength)
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/[^\x20-\x7E\u00A0-\uFFFF\n\r\t]/g, "") // Strip control chars
    .trim();
}

/**
 * Sanitize an array of chat messages
 */
function sanitizeMessages(messages, maxMessages = 30) {
  if (!Array.isArray(messages)) return [];
  return messages
    .slice(-maxMessages)
    .filter(m => m && typeof m === "object")
    .map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: sanitizeText(m.content || m.text || "", 1000),
    }))
    .filter(m => m.content.length > 0);
}

/**
 * Sanitize agency code -- alphanumeric only
 */
function sanitizeAgencyCode(code) {
  if (!code || typeof code !== "string") return "";
  return code.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 50).toUpperCase();
}

/**
 * Sanitize a phone number
 */
function sanitizePhone(phone) {
  if (!phone || typeof phone !== "string") return "";
  return phone.replace(/[^0-9+\-() ]/g, "").slice(0, 20);
}

// ── Request Validator ─────────────────────────────────────────
/**
 * Validate and get client IP from Netlify event
 */
function getClientIP(event) {
  return (
    event.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    event.headers["x-real-ip"] ||
    event.headers["client-ip"] ||
    "unknown"
  );
}

/**
 * Standard rate limit response
 */
function rateLimitResponse() {
  return {
    statusCode: 429,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Retry-After": "60",
    },
    body: JSON.stringify({
      error: "Too many requests. Please wait a moment.",
      content: "I need a moment. Please try again shortly.",
    }),
  };
}

/**
 * Standard CORS headers
 */
function corsHeaders() {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGINS || "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };
}

// ── Prompt Injection Guard ────────────────────────────────────
// Detect attempts to override system prompt
const INJECTION_PATTERNS = [
  /ignore (previous|above|all) instructions/i,
  /you are now/i,
  /forget (your|all|previous)/i,
  /pretend (you are|to be)/i,
  /system prompt/i,
  /\[INST\]/i,
  /\<\|im_start\|\>/i,
  /jailbreak/i,
  /dan mode/i,
];

function detectPromptInjection(text) {
  if (!text || typeof text !== "string") return false;
  return INJECTION_PATTERNS.some(p => p.test(text));
}

/**
 * Check all messages for injection attempts
 */
function checkForInjection(messages) {
  if (!Array.isArray(messages)) return false;
  return messages.some(m => {
    const content = m.content || m.text || "";
    return detectPromptInjection(content);
  });
}

// ── Exports ───────────────────────────────────────────────────
module.exports = {
  checkRateLimit,
  sanitizeText,
  sanitizeMessages,
  sanitizeAgencyCode,
  sanitizePhone,
  getClientIP,
  rateLimitResponse,
  corsHeaders,
  detectPromptInjection,
  checkForInjection,
};
