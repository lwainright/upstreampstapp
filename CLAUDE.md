# CLAUDE.md — Upstream Approach PWA

## Project Overview
Upstream Approach is a first responder wellness PWA (Progressive Web App) built for agencies like NC LEAP. It provides confidential, anonymous mental health tools for EMS, Fire, Law Enforcement, and Dispatch personnel.

**Live URL:** https://upstreampst.netlify.app  
**Repo:** https://github.com/lwainright/upstreampstapp  
**Stack:** React + Vite + Netlify + Appwrite  
**Owner:** Lee Wainright — Upstream Initiative LLC

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Hosting | Netlify (auto-deploy from main branch) |
| Backend / DB | Appwrite (nyc.cloud.appwrite.io) |
| Auth | Appwrite Auth |
| Storage | Appwrite Storage (bucket ID: 69e14d570027ebb13e13) |
| Push | Appwrite + VAPID |
| PWA | vite-plugin-pwa |

---

## Appwrite Configuration

**Project ID:** upstreamapproach  
**Database ID:** 69c88588001ed071c19e (env: VITE_APPWRITE_DATABASE)  
**Endpoint:** https://nyc.cloud.appwrite.io/v1

### Collections
- `agencies` — agency records (name, code, region, type, adminName, adminEmail, adminPhone, logoUrl, showLogo, active)
- `checkins` — anonymous shift check-ins (agencyCode, status, phase)
- `ai_sessions` — anonymous AI chat sessions
- `tool_usage` — anonymous tool use tracking
- `pst_contacts` — anonymous PST contact events
- `pst_members` — PST team roster per agency (agencyCode, name, role, unit, phone, email, status, note)
- `escalations` — crisis escalation events (agencyCode, level, trigger, hour, dayOfWeek)
- `buddy_checks` — buddy check events (agencyCode, crisisLevel, choice)
- `hrv_readings` — HRV readings (agencyCode, value, category, context, hour, dayOfWeek)
- `resource_views` — resource view events (agencyCode, category, userState)
- `debriefs` — debrief completions (agencyCode, type, completedSteps)
- `sessions` — session starts (agencyCode, frVerified, hour, dayOfWeek)
- `support_choices` — support option selections (agencyCode, crisisLevel, option)
- `user_permissions` — role assignments (agencyCode, userId, role)
- `platform_audit_log` — platform owner audit trail (action, details)
- `platform_settings` — global platform settings (logoUrl, logoFullUrl)
- `password_reset_requests` — staff password reset queue
- `journals`, `push_subscriptions`, `Resources`, `admin_clients`, `admin_invoices`

### Storage Bucket
- **logos** (69e14d570027ebb13e13) — app logos, agency logos, founder photo

### Key Asset URLs
- App icon: `https://nyc.cloud.appwrite.io/v1/storage/buckets/69e14d570027ebb13e13/files/69e154f3003b5265e9a3/view?project=upstreamapproach`
- App full logo: `https://nyc.cloud.appwrite.io/v1/storage/buckets/69e14d570027ebb13e13/files/69e154c7000987e685e8/view?project=upstreamapproach`
- Business logo: `https://nyc.cloud.appwrite.io/v1/storage/buckets/69e14d570027ebb13e13/files/69e2d97f0025066baba8/view?project=upstreamapproach`
- Founder photo: `https://nyc.cloud.appwrite.io/v1/storage/buckets/69e14d570027ebb13e13/files/69e3890c0004b4b1a05c/view?project=upstreamapproach`

---

## Project Structure

```
src/
├── App.jsx                    — Main app, routing, auth, QR join, nav
├── main.jsx                   — Entry point, dark background fix
├── ui.jsx                     — Shared components (AppHeader, Screen, ScreenSingle, Btn, Card)
├── analytics.js               — All anonymous event tracking to Appwrite
├── appwrite.js                — Appwrite client setup
├── auth.js                    — Auth helpers
├── utils.js                   — useLayoutConfig, helpers
├── icons.jsx                  — SVG icon components
├── push-client.js             — Push notification helpers

Screens:
├── HomeScreen.jsx             — Landing screen with tiles + PTSD banner
├── SplashScreen.jsx           — App splash/logo screen
├── IDVerifyScreen.jsx         — ID badge verification + activation code entry
├── AIChatScreen.jsx           — AI peer support chat
├── HumanPSTScreen.jsx         — Human PST contact (wide desktop layout)
├── PSTPanelScreen.jsx         — PST team panel (wide desktop layout)
├── AdminToolsScreen.jsx       — Agency admin dashboard (wide desktop layout)
├── AdminAIScreen.jsx          — Platform AI assistant + QR generator + join codes
├── PlatformInlineContent.jsx  — Platform owner console (agencies, roles, audit)
├── AboutScreen.jsx            — About, privacy, settings, founder
├── ResourcesScreen.jsx        — Crisis resources, AI finder, upstream/downstream
├── ToolsScreen.jsx            — Coping tools grid
├── BreathingScreen.jsx        — Box breathing (4-4-4-4) with voice + HRV
├── GroundingScreen.jsx        — 5-4-3-2-1 grounding
├── HRVScreen.jsx              — Camera-based HRV reading
├── JournalScreen.jsx          — Private voice/text journal
├── AfterActionScreen.jsx      — After-action reset (3 steps)
├── Dump90Screen.jsx           — 90-second voice/text vent
├── ShiftCheckScreen.jsx       — Shift check-in (start/mid/end)
├── PTSDInterruptionScreen.jsx — 21 PTSD grounding tools
├── AgencyCodeScreen.jsx       — Agency code / QR join entry
├── EmergencyContactsScreen.jsx
├── CustomAlertsScreen.jsx
├── EducationalScreen.jsx
├── FeedbackScreen.jsx
├── DashboardScreen.jsx
├── MetricsScreen.jsx
├── RoughCallScreen.jsx

netlify/functions/
├── claude.js                  — Anthropic API proxy
├── search.js                  — Tavily search proxy
```

---

## Key Architecture Decisions

### Privacy Model
- **Option B analytics** — event-level only, no conversations, no identity
- All AI chat stays on device — never sent to any server
- Journal, HRV readings, check-in answers stored locally only
- Anonymous usage events only (agencyCode + timestamp + category)
- Dev device flag: `localStorage.setItem("upstream_dev_device", "true")` excludes device from tracking

### Layout System
- `ScreenSingle` — standard mobile-first layout (max 560px)
- `ScreenSingle wide={true}` — desktop-expanded layout (1100px) for admin/PST screens
- `useLayoutConfig()` from utils.js — detects desktop vs mobile
- Wide screens: AdminToolsScreen, AdminAIScreen, PSTPanelScreen, HumanPSTScreen

### Authentication Flow
1. App loads → splash screen
2. If not verified/skipped/member → IDVerifyScreen (photo OCR + activation code + staff login)
3. QR code scan (`?code=AGENCY_CODE`) → auto-joins agency, saves `upstream_verified_fr: "agency_qr"` permanently
4. Staff login → Appwrite auth → role-based nav
5. Roles: user, pst, supervisor, admin, platform

### Agency Branding
- Upstream logo always top center (never changes)
- Agency logo shows in "Powered by [Agency]" line below header
- Toggle in admin Settings — text only OR logo+text
- Stored in `agencies.logoUrl` and `agencies.showLogo`
- Also saved to localStorage: `upstream_agency_logo_url`, `upstream_agency_show_logo`

### QR Code Join
- URL format: `https://upstreampst.netlify.app?code=AGENCY_CODE`
- On scan: fetches agency name + logo from Appwrite, saves membership, marks verified permanently
- Re-fetches if stored membership is missing logoUrl

---

## Netlify Environment Variables
```
ANTHROPIC_API_KEY
VITE_APPWRITE_DATABASE
VITE_APPWRITE_ENDPOINT
VITE_APPWRITE_PROJECT
VITE_APPWRITE_PROJECT_ID
VITE_DEMO_AGENCY_CODES
VITE_ENABLE_DEMO_ROLE_SWITCHER
VAPID_EMAIL
VAPID_PRIVATE_KEY
VAPID_PUBLIC_KEY
GEMINI_KEY_1 through GEMINI_KEY_5
ALLOWED_ORIGINS
```

---

## Analytics Functions (analytics.js)
All fire-and-forget, silent fail, skip if dev device:
- `trackCheckin(agencyCode, status, phase)`
- `trackTool(agencyCode, toolName)`
- `trackAISession(agencyCode)`
- `trackPSTContact(agencyCode, contactType)`
- `trackEscalation(agencyCode, level, trigger)`
- `trackBuddyCheck(agencyCode, crisisLevel, choice)`
- `trackHRV(agencyCode, value, category, context)`
- `trackResourceView(agencyCode, category, userState)`
- `trackDebrief(agencyCode, type, completedSteps)`
- `trackSessionStart(agencyCode, frVerified)`
- `trackSupportChoice(agencyCode, crisisLevel, option)`

---

## Current Agencies
- **NC LEAP** — code: NCLEAP, region: NC, type: EMS, admin: Lee Wainright

---

## Known Issues / Notes
- `analytics.js` must be a `.js` file not `.jsx` — no JSX allowed
- QR join useEffect must use async wrapper `joinFromQR()` — cannot use `await` directly in useEffect
- HRV uses camera rPPG (finger on lens, 60 seconds) — falls back to manual entry
- Breathing countdown fix: speak label AND start timer in same pass, no early return
- White flash fix: `index.html` has `<style>html,body,#root{background:#040d18!important}</style>` in head
- Agency logo shows as solid black background — transparent PNG needed for proper display on dark background

---

## Deployment
- Push to `main` branch → Netlify auto-deploys
- Build command: `npm run build`
- Publish directory: `dist`
- All routes redirect to `index.html` (SPA)
