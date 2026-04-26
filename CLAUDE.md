# CLAUDE.md — Upstream Approach PWA

## Project Overview
Upstream Approach is a first responder and workforce wellness PWA built for agencies, counties, and organizations of all types. It provides confidential, anonymous mental health tools for EMS, Fire, Law Enforcement, Dispatch, Corrections, DSS/CPS/APS, Veterans, Civilians, and their families.

**Live URL:** https://upstreampst.netlify.app
**Repo:** https://github.com/lwainright/upstreampstapp
**Stack:** React + Vite + Netlify + Appwrite
**Owner:** Lee Wainright — Upstream Initiative LLC
**Pricing:** $40/user/year flat · Remote onboarding $500 · On-site $1,500/day + travel · Net 30

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Hosting | Netlify (consider Cloudflare Pages at scale) |
| Backend / DB | Appwrite (nyc.cloud.appwrite.io) |
| Auth | Appwrite Auth |
| Storage | Appwrite Storage (bucket: 69e14d570027ebb13e13) |
| Push | web-push npm package + VAPID |
| SMS | Twilio (via Netlify function) |
| PWA | vite-plugin-pwa |

---

## Appwrite Configuration

**Project ID:** upstreamapproach
**Database ID:** 69c88588001ed071c19e (env: VITE_APPWRITE_DATABASE)
**Endpoint:** https://nyc.cloud.appwrite.io/v1

### Collections
- `agencies` — name, code, region, type, adminName, adminEmail, adminPhone, logoUrl, showLogo, active, crewStream, humanPSTActive, pstRetentionDays
- `checkins` — agencyCode, status, phase
- `ai_sessions` — agencyCode
- `tool_usage` — agencyCode, toolName
- `pst_contacts` — agencyCode, contactType
- `pst_members` — agencyCode, name, role, unit, phone, email, status, note
- `pst_cases` — caseNumber, agencyCode, needType, urgency, narrative, contactMethod, callbackTime, contactInfo, status, division, pstNarrative, followUpNote, claimedBy, createdAt, updatedAt
- `escalations` — agencyCode, level, trigger, hour, dayOfWeek
- `buddy_checks` — agencyCode, crisisLevel, choice
- `hrv_readings` — agencyCode, value, category, context, hour, dayOfWeek
- `resource_views` — agencyCode, category, userState
- `debriefs` — agencyCode, type, completedSteps
- `sessions` — agencyCode, frVerified, hour, dayOfWeek
- `support_choices` — agencyCode, crisisLevel, option
- `user_permissions` — agencyCode, userId, role
- `platform_audit_log` — action, details
- `platform_settings` — logoUrl, logoFullUrl
- `password_reset_requests` — email, agencyCode, role, status
- `agency_divisions` — agencyCode, name, description, supervisor, icon, active, createdAt
- `family_codes` — code, type, ageKey, agencyCode, contactPhone, used, usedAt, createdAt
- `family_checkins` — familyToken, ageKey, feeling, severity, timestamp (Any: Create)
- `fc_sessions` — code(30), expiry(36), active(bool), createdAt(36) · Any: Create/Read/Update ✅
- `fc_messages` — sessionCode(30), sender(50), text(2000), timestamp(36) · Any: Create/Read/Delete ✅

### Storage Bucket
- **logos** (69e14d570027ebb13e13) — app logos, agency logos, founder photo

### Key Asset URLs
- App icon: `https://nyc.cloud.appwrite.io/v1/storage/buckets/69e14d570027ebb13e13/files/69e154f3003b5265e9a3/view?project=upstreamapproach`
- App full logo: `https://nyc.cloud.appwrite.io/v1/storage/buckets/69e14d570027ebb13e13/files/69e154c7000987e685e8/view?project=upstreamapproach`
- NC LEAP logo: `https://nyc.cloud.appwrite.io/v1/storage/buckets/69e14d570027ebb13e13/files/69e811ea002065115b97/view?project=upstreamapproach`

---

## Project Structure

```
src/
├── App.jsx                      — Main app, routing, auth, QR/family join, nav
├── main.jsx                     — Entry point, dark background fix
├── ui.jsx                       — AppHeader, Screen, ScreenSingle, Btn, Card
├── analytics.js                 — Anonymous event tracking (no JSX allowed)
├── appwrite.js                  — Appwrite client + realtime
├── auth.js                      — Auth helpers
├── utils.js                     — useLayoutConfig, helpers
├── escalation.js                — Family escalation (SMS + push)
├── AgeExperience.js             — Age-based config + auto-progression

Screens:
├── HomeScreen.jsx               — Landing, age-aware, home layout customization
├── KidsHomeScreen.jsx           — Under 8 / 8-12 family home
├── SplashScreen.jsx
├── IDVerifyScreen.jsx
├── SeatSelectorScreen.jsx       — 8 seat types including civilian workforce
├── DivisionSelectorScreen.jsx
├── AIChatScreen.jsx             — Age-aware system prompt injection
├── HumanPSTScreen.jsx
├── PSTPanelScreen.jsx
├── PSTRequestScreen.jsx         — 7 need types including grief/sleep/supervisor
├── PSTDispatchBoard.jsx         — Division filter, contact guard, auto-purge
├── AdminToolsScreen.jsx         — PST visibility, retention, divisions
├── AdminAIScreen.jsx            — QR generator + PST poster + per-division QR
├── PlatformInlineContent.jsx    — Toggles, PST Config, County, Agencies, Analytics
├── QRPosterGenerator.jsx
├── AboutScreen.jsx              — Settings, age update, family codes
├── AppGuideScreen.jsx
├── SmartResourcesScreen.jsx     — Unified seat-aware resources hub ← NEW
├── HomeCustomizationScreen.jsx  — Pin/hide/reorder tiles ← NEW
├── GriefScreen.jsx              — Grief & LOD decompression ← NEW
├── SleepScreen.jsx              — Shift work sleep module ← NEW
├── SupervisorScreen.jsx         — Supervisor wellness module ← NEW
├── HighAcuityScreen.jsx         — High acuity case decompression
├── HumanServicesScreen.jsx      — DSS/CPS/APS worker wellness
├── TelecommunicationsScreen.jsx — 911/CCT dispatch wellness (was CivilianScreen)
├── CivilianWorkforceScreen.jsx  — Government/admin/facilities/courthouse ← NEW
├── VeteransScreen.jsx
├── RetireesScreen.jsx
├── ToolsScreen.jsx
├── BreathingScreen.jsx
├── GroundingScreen.jsx
├── HRVScreen.jsx
├── JournalScreen.jsx
├── AfterActionScreen.jsx
├── Dump90Screen.jsx
├── ShiftCheckScreen.jsx
├── PTSDInterruptionScreen.jsx   — Bilateral sensory grounding + haptics
├── FamilyConnectScreen.jsx      — Appwrite Realtime cross-device chat
├── SafetyVaultScreen.jsx        — PIN/no-PIN/defer + DV + medical
├── MedicalVaultSection.jsx
├── AIMedicalChat.jsx
├── FamilyCodeGenerator.jsx      — Birth year capture for age progression
├── AgencyCodeScreen.jsx
├── ResourcesScreen.jsx          — Full hardwired resource library

netlify/functions/
├── claude.js                    — Anthropic API proxy
├── search.js                    — Tavily search proxy
├── sms-escalate.js              — Twilio SMS family escalation
├── push-notify.js               — Web push family escalation (needs web-push npm)

public/
├── guide.html                   — External per-seat app guide
```

---

## Seat System (8 seats)

| Seat | Key | Notes |
|---|---|---|
| First Responder | `responder` | EMS·Fire·LE·Corrections·Dispatch·SRO·Co-responder·Forensic·Probation |
| Veteran | `veteran` | Includes Coast Guard |
| Telecommunications | `telecommunications` | 911·CCT dispatch·Comm centers |
| Human Services | `humanservices` | DSS·CPS·APS·Child welfare |
| Civilian Workforce | `civilianworkforce` | Gov employees·Admin·Facilities·Courthouse |
| Spouse / Partner | `spouse` | Co-regulation tools, DV resources |
| Family Member | `family` | Age-branched experience |
| Retiree | `retiree` | Retired FR and veterans |

---

## Age Progression System (Option B)

Birth year stored only — never full DOB. Auto-calculates on every launch.

| Age Key | Label | Home | Escalation |
|---|---|---|---|
| `under8` | Young Child | KidsHomeScreen | Immediate |
| `8-12` | Child | KidsHomeScreen | Immediate |
| `13-17` | Teen | HomeScreen | 60s cancel |
| `17-18` | Young Adult | HomeScreen | 60s cancel |
| `18-24` | College / Job Market | HomeScreen | No parent notify |
| `spouse` | Adult | HomeScreen | No parent notify |

- `checkAgeProgression()` — runs on every launch, silent update + brief notification
- `getAgeMentalHealthResources(ageKey)` — age-specific mental health resources
- Parent or user can manually update in About → Settings
- `FamilyCodeGenerator` captures birth year at code creation

---

## PST System

**Case number format:** `PST-{AGENCYCODE}-{YEAR}-{4DIGITS}`
**Status flow:** open → claimed → in_progress → follow_up / referred → closed → purged
**Contact info:** visible only to claiming PST member — never to others
**Retention:** 30/60/90/120 days — open cases never purge — content nulled, metadata kept
**Auto-purge:** runs silently on dispatch board load

**PST Visibility (agency head controls):**
- None — PST sees only claimed cases
- Basic — open count, urgency distribution, high acuity volume, time trends
- Full — same as supervisor analytics

---

## Multi-Agency / County Model

**Agency code structure:** `WAKE` (county) → `WAKEMS`, `WAKESO`, `WAKEDSS`, `WAKE911`
- County admin sees all agencies — aggregate only
- Agencies cannot see each other
- Data wall enforced by `agencyCode` field on every record
- County panel in PlatformInlineContent → County tab

---

## Platform Feature Toggles

17 toggles across 6 groups — no code changes needed.
Stored in localStorage + Appwrite `platform_settings`.
Agency admin can further restrict per agency.
`subcontract_pst` toggle documented as FUTURE — not yet active.

---

## Home Screen Customization

- `HomeCustomizationScreen.jsx` — pin/hide/reorder tiles
- `getHomeLayout()` / `saveHomeLayout()` — localStorage, device only
- Pinned tiles always at top
- Hidden tiles restorable with one tap
- Reset to default always available

---

## Smart Resources Screen

Replaces scattered resource screens with one unified entry point.
- Crisis resources always hardwired at top (988, DV Hotline, Safe Call, Crisis Text, 211)
- "For You" section reads `upstream_seats` from localStorage
- Seat-aware content: responder, veteran, telecom, human services, civilian workforce, retiree, spouse, family
- General resources always shown below
- Local agency resources shown if available
- "Update your role" link to About → Settings

---

## Grief / LOD Screen

7 loss types: LOD, colleague suicide, sudden, medical, personal, patient, child.
3-step flow: type → acknowledgment + grounding + reflection → resources + routing.
Private reflection saved to device only.

---

## Sleep Module

4 tools: Wind Down, Rotating Shift Recovery, Can't Turn Brain Off, On-Shift Fatigue.
Built-in 4-7-8 breath with timer.
Education: SWSD diagnosis, chronic deprivation effects, FR sleep differences, sleep/PTSD connection.

---

## Supervisor Wellness

4 tools: Check-In Script Generator (4 scenarios, tap-to-copy prompts), Spot Overload Early, Lead a Peer Debrief (6 steps), Your Own Wellness (5 steps).
Education: supervisor burden, moral injury, culture-setting, when to escalate.
Quick access to PST, AI support, journal.

---

## Key Architecture Decisions

### Privacy Model
- Event-level analytics only — no conversations, no identity
- AI chat stays on device
- Safety Vault never logged
- Family Connect messages deleted on session end
- Dev device: `localStorage.setItem("upstream_dev_device","true")`

### Branding
- Agency logo shows BIG on welcome modal only
- Header: "POWERED BY [AGENCY]" text only — no logo in header
- Stored in `agencies.logoUrl` + localStorage

### EMDR Language
- NEVER call it EMDR — use "bilateral sensory grounding"
- Medical module: "NOT MEDICAL ADVICE" on every screen

### Corrections Fatigue
- Dr. Caterina Spinaris — corrections-specific condition, different from LE burnout
- In TelecommunicationsScreen resources

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
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_FROM_NUMBER
GEMINI_KEY_1 through GEMINI_KEY_5
ALLOWED_ORIGINS
```

---

## Current Agencies
- **NC LEAP** — code: NCLEAP, $id: 69e6dc700013b1972197, admin: Lee Wainright

---

## Known Issues / Notes
- `analytics.js` must be `.js` not `.jsx`
- QR join: async wrapper required in useEffect
- White flash fix: `index.html` `<style>html,body,#root{background:#040d18!important}</style>`
- Agency logo: transparent PNG needed for dark background
- `push-notify.js`: needs `web-push` npm in netlify/functions/package.json
- Bilateral haptics: iOS does not support `navigator.vibrate` — Android only
- `CivilianScreen.jsx` — DELETE from repo, replaced by `TelecommunicationsScreen.jsx`
- Subcontract PST: FUTURE feature, toggle ready, documented in CountyPanel

## Pricing
- **$40/user/year** — flat, all inclusive, one rate for everyone
- Family included — no extra charge
- Remote onboarding: $500 flat
- On-site training: $1,500/day or $850/half-day + travel at actual cost
- Annual invoice · Net 30
- $3.33/user/month — less than a cup of coffee

## Deployment
- Push to `main` → Netlify auto-deploys
- Build: `npm run build` · Publish: `dist`
- All routes → `index.html` (SPA)
- `guide.html` → `public/` (accessible at `/guide`)
- Functions → `netlify/functions/`
