// netlify/functions/sms-escalate.js
// Upstream Initiative — SMS Escalation via Twilio
// Fires when a family member or kid escalates in the app
// Sends SMS to the parent/responder's registered phone number
// Zero content shared — signal only

const { checkRateLimit, sanitizePhone, sanitizeText, getClientIP, rateLimitResponse, corsHeaders } = require("./security");
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN   = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM_NUMBER  = process.env.TWILIO_FROM_NUMBER;

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  // Rate limit -- SMS is expensive, 5 per minute per IP
  const ip = getClientIP(event);
  if (!checkRateLimit(ip, "sms", 5, 60000)) {
    return rateLimitResponse();
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const toPhone = sanitizePhone(body.toPhone || "");
    const agencyName = sanitizeText(body.agencyName || "", 100);
    const memberType = sanitizeText(body.memberType || "family", 30);
    const urgency = sanitizeText(body.urgency || "medium", 20);

    // Validate
    if (!toPhone || !toPhone.trim()) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Phone number required" }) };
    }

    // Sanitize phone — digits only with +1 prefix
    const clean = toPhone.replace(/\D/g, "");
    const phone = clean.startsWith("1") ? `+${clean}` : `+1${clean}`;

    if (phone.length < 11) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid phone number" }) };
    }

    // Build message — signal only, zero content
    const agencyLine = agencyName ? ` (${agencyName})` : "";
    const memberLine = memberType === "spouse" ? "someone in your household"
      : memberType === "teen" ? "a teen in your family"
      : memberType === "child" ? "a child in your family"
      : memberType === "young" ? "your young child"
      : "someone in your family";

    const urgencyLine = urgency === "red" || urgency === "high"
      ? "They may need your support right now."
      : "They may benefit from a check-in when you can.";

    const message = `Upstream Approach${agencyLine}: ${memberLine} may need your support. ${urgencyLine} Open the app or reach out directly. — This is an automated notification.`;

    // Send via Twilio
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
      // Dev mode — log but don't fail
      console.log("SMS would send to:", phone, "Message:", message);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, dev: true }) };
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");

    const params = new URLSearchParams();
    params.append("To", phone);
    params.append("From", TWILIO_FROM_NUMBER);
    params.append("Body", message);

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Twilio error:", result);
      return { statusCode: 500, headers, body: JSON.stringify({ error: "SMS failed", detail: result.message }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, sid: result.sid }) };

  } catch (err) {
    console.error("Escalation error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Internal error" }) };
  }
};
