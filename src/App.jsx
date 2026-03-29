import React, { useState, useEffect, useRef } from 'react';

// Appwrite anonymous analytics
// Best practice: Use environment variables instead of hardcoded strings
const AW_ENDPOINT = import.meta.env.VITE_AW_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const AW_PROJECT  = import.meta.env.VITE_AW_PROJECT  || 'upstreamapproach';
const AW_DB       = import.meta.env.VITE_AW_DB       || 'upstream_db';  

async function awTrack(collection, data) {
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

function trackCheckin(agencyCode, status, shiftPhase) {
  const now = new Date();
  awTrack('checkins', {
    agencyCode: agencyCode || 'NONE',
    status,
    shiftPhase: shiftPhase || '',
    dayOfWeek: now.getDay(),
    hour: now.getHours(),
  });
}

function trackTool(agencyCode, tool) {
  awTrack('tool_usage', { agencyCode: agencyCode || 'NONE', tool });
}

function trackAISession(agencyCode, crisisLevel, messageCount) {
  awTrack('ai_sessions', { agencyCode: agencyCode || 'NONE', crisisLevel: crisisLevel||0, messageCount: messageCount||1 });
}

function trackPSTContact(agencyCode, contactType) {
  awTrack('pst_contacts', { agencyCode: agencyCode || 'NONE', contactType, resolved: false });
}

async function fetchAgencyStats(agencyCode, days=30) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString();
    const headers = { 'X-Appwrite-Project': AW_PROJECT };
    const base = `${AW_ENDPOINT}/databases/${AW_DB}/collections`;
    const qs = (col) => base+"/"+col+"/documents?queries[]="+encodeURIComponent(JSON.stringify({method:"equal",attribute:"agencyCode",values:[agencyCode]}))+"&queries[]="+encodeURIComponent(JSON.stringify({method:"greaterThan",attribute:"timestamp",values:[sinceStr]}))+"&limit=5000";

    const [r1,r2,r3,r4] = await Promise.all([
      fetch(qs('checkins'),{headers}).then(r=>r.json()),
      fetch(qs('tool_usage'),{headers}).then(r=>r.json()),
      fetch(qs('ai_sessions'),{headers}).then(r=>r.json()),
      fetch(qs('pst_contacts'),{headers}).then(r=>r.json()),
    ]);

    const statusCounts={great:0,striving:0,notwell:0,ill:0};
    const byDay={};
    (r1.documents||[]).forEach(checkin=>{
      if(statusCounts[checkin.status]!==undefined) statusCounts[checkin.status]++;
      const day=checkin.timestamp&&checkin.timestamp.slice(0,10);
      if(day) byDay[day]=(byDay[day]||0)+1;
    });

    const toolCounts={};
    (r2.documents||[]).forEach(toolRecord=>{ toolCounts[toolRecord.tool]=(toolCounts[toolRecord.tool]||0)+1; });

    const total=r1.total||0;
    return {
      totalCheckins: total,
      statusCounts,
      byDay,
      toolCounts,
      totalToolUsage: r2.total||0,
      aiSessionCount: r3.total||0,
      pstContactCount: r4.total||0,
      wellnessScore: total>0 ? Math.round((statusCounts.great*100+statusCounts.striving*67+statusCounts.notwell*33)/total) : null,
    };
  } catch(e) { return null; }
}
// --------------------------------------------------------------------------
