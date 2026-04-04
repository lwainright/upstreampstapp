const AW_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const AW_PROJECT  = import.meta.env.VITE_APPWRITE_PROJECT  || 'upstreamapproach';
const AW_DB       = import.meta.env.VITE_APPWRITE_DATABASE || 'upstream_db';

export { AW_ENDPOINT, AW_PROJECT, AW_DB };

//   ToolsScreen           (~2522)
//   BreathingScreen       (~2558)
//   GroundingScreen       (~2602)
//   JournalScreen         (~2641)
//   AfterActionScreen     (~2911)
//   Dump90Screen          (~2940)
//   AdminToolsScreen      (~3057)
//   PlatformInlineContent (~3925)
//   PlatformOwnerScreen   (~4175)
//   PSTPanelScreen        (~4425)
//   DashboardScreen       (~4484)
//   MetricsScreen         (~4655)
//   ResourcesScreen       (~5231)
//   PTSDInterruptionScreen(~5794)
//   EmergencyContactsScreen(~6349)
//   CustomAlertsScreen    (~6447)
//   EducationalScreen     (~6521)
//   FeedbackScreen        (~6604)
//   SplashScreen          (~6707)
//   AboutScreen           (~6081)
//
// MODALS
//   MasterLoginModal      (~5997)
//   AddAgencyModal        (~4415)
//   ResourceManagerModal  (~4501)
//
// ICONS (line ~6238)
//   BoltIcon, ClockIcon, BreathIcon, HeartIcon, GaugeIcon
//   HomeIcon, InfoIcon, MapIcon, UserIcon, ToolsIcon
//   GroundIcon, JournalIcon, ResetIcon, LockIcon, BuildingIcon
//   TimerIcon, SettingsIcon, ShieldIcon
//
// MAIN APP (line ~6823)
//   App() — routing, state, auth gate
//
// ============================================================
// TO FIND ANY SCREEN: Ctrl+F "SCREEN: ScreenName"
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './hooks/useAuth';
import LoginScreen from './components/LoginScreen';

// Appwrite anonymous analytics
const AW_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const AW_PROJECT  = 'upstreamapproach';
const AW_DB       = 'upstream_db';  // Updated to match your database ID!

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

