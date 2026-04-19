// src/push-client.js
// Web Push subscription management for Upstream Approach
// Used ONLY for Human PST responses and buddy check alerts

const VAPID_PUBLIC_KEY = 'BKHtqT8Sa85XlwFO-P9AROkWi_r5hi628WmnfLqHAesbYvP7IcCPz6taKCNdc7ep5jwMIi5IFIjwTzVhy0H3yTQ';

const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE || '69c88588001ed071c19e';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function requestPushPermission(databases, role, agencyCode) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push not supported');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const registration = await navigator.serviceWorker.ready;
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    const sub = subscription.toJSON();

    // Save to Appwrite
    const { ID } = await import('appwrite');
    await databases.createDocument(DB_ID, 'push_subscriptions', ID.unique(), {
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      role: role || 'user',
      agencyCode: agencyCode || null,
    });

    return true;
  } catch (err) {
    console.error('Push subscription error:', err);
    return false;
  }
}

export async function sendPushToRole(targetRole, agencyCode, title, message, type) {
  try {
    // Get all subscriptions for the target role
    const { databases, DB_ID: dbId } = await import('./appwrite.js');
    const { Query } = await import('appwrite');
    
    const queries = [Query.equal('role', targetRole), Query.limit(100)];
    if (agencyCode) queries.push(Query.equal('agencyCode', agencyCode));
    
    const res = await databases.listDocuments(dbId || DB_ID, 'push_subscriptions', queries);
    
    // Send to each subscription
    const pushPromises = (res.documents || []).map(doc => 
      fetch('/.netlify/functions/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: {
            endpoint: doc.endpoint,
            keys: { p256dh: doc.p256dh, auth: doc.auth }
          },
          title,
          message,
          type,
        }),
      })
    );
    
    await Promise.allSettled(pushPromises);
    return true;
  } catch (err) {
    console.error('Send push error:', err);
    return false;
  }
}

export async function sendPushToUser(subscription, title, message, type) {
  try {
    await fetch('/.netlify/functions/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription, title, message, type }),
    });
    return true;
  } catch (err) {
    console.error('Send push error:', err);
    return false;
  }
}
