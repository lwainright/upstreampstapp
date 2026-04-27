// netlify/functions/push-notify.js
// Upstream Initiative — Push Notification Service
// Fires push notification to parent/responder device
// Signal only — zero content shared
// Works alongside sms-escalate.js

const { checkRateLimit, getClientIP, rateLimitResponse } = require('./security');
const webpush = require('web-push');

const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL   = process.env.VAPID_EMAIL || 'mailto:admin@upstreaminitiative.com';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // Rate limit push notifications -- 10 per minute per IP
  const ip = getClientIP(event);
  if (!checkRateLimit(ip, 'push', 10, 60000)) {
    return rateLimitResponse();
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { subscription, title, message, urgency, memberType } = body;

    if (!subscription || !subscription.endpoint) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'No subscription provided' }) };
    }

    if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
      console.log('VAPID keys not set — dev mode, skipping push');
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, dev: true }) };
    }

    webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);

    // Build notification payload — signal only, no content
    const memberLine = memberType === 'spouse'  ? 'Someone in your household'
      : memberType === 'teen'   ? 'A teen in your family'
      : memberType === 'child'  ? 'A child in your family'
      : memberType === 'young'  ? 'Your young child'
      : 'Someone in your family';

    const notifTitle = title || 'Upstream Approach';
    const notifBody  = message || `${memberLine} may need your support right now. Check in when you can.`;

    const payload = JSON.stringify({
      title:   notifTitle,
      body:    notifBody,
      icon:    'https://nyc.cloud.appwrite.io/v1/storage/buckets/69e14d570027ebb13e13/files/69e154f3003b5265e9a3/view?project=upstreamapproach',
      badge:   'https://nyc.cloud.appwrite.io/v1/storage/buckets/69e14d570027ebb13e13/files/69e154f3003b5265e9a3/view?project=upstreamapproach',
      tag:     'family-escalation',
      renotify: true,
      data: {
        type:       'family_escalation',
        memberType: memberType || 'family',
        urgency:    urgency    || 'medium',
        url:        'https://upstreampst.netlify.app',
      },
    });

    await webpush.sendNotification(subscription, payload, {
      urgency: urgency === 'red' ? 'high' : 'normal',
      TTL: 3600, // 1 hour TTL
    });

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };

  } catch (err) {
    // Push subscription may be expired — not a fatal error
    if (err.statusCode === 410 || err.statusCode === 404) {
      return { statusCode: 200, headers, body: JSON.stringify({ success: false, reason: 'subscription_expired' }) };
    }
    console.error('Push notify error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Push failed', detail: err.message }) };
  }
};
