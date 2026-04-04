const AW_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const AW_PROJECT  = import.meta.env.VITE_APPWRITE_PROJECT  || 'upstreamapproach';
const AW_DB       = import.meta.env.VITE_APPWRITE_DATABASE || 'upstream_db';

export { AW_ENDPOINT, AW_PROJECT, AW_DB };

export async function awTrack(collection, data) {
  // Fire-and-forget - never blocks UI, never crashes app
  try {
    const id = 'id' + Date.now() + Math.random().toString(36).slice(2,7);
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
  } catch(e) { /* silent - analytics never interrupts the user */ }
}

export function trackCheckin(agencyCode, status, shiftPhase) {
  const now = new Date();
  awTrack('checkins', {
    agencyCode: agencyCode || 'NONE',
    status,
    shiftPhase: shiftPhase || '',
    dayOfWeek: now.getDay(),
    hour: now.getHours(),
  });
}
export function trackTool(agencyCode, tool) {
  awTrack('tool_usage', { agencyCode: agencyCode || 'NONE', tool });
}
export function trackAISession(agencyCode, crisisLevel, messageCount) {
  awTrack('ai_sessions', { agencyCode: agencyCode || 'NONE', crisisLevel: crisisLevel||0, messageCount: messageCount||1 });
}
export function trackPSTContact(agencyCode, contactType) {
  awTrack('pst_contacts', { agencyCode: agencyCode || 'NONE', contactType, resolved: false });
}

