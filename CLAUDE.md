# CLAUDE.md -- Upstream Approach PWA
# Last Updated: Session 6 Complete / Pre-Final Build

## Project Overview
Upstream Approach is a first responder and workforce wellness PWA built for agencies, counties, and organizations of all types. It provides confidential, anonymous mental health tools for EMS, Fire, Law Enforcement, Dispatch, Corrections, DSS/CPS/APS, Veterans, Civilians, Hospital Staff, School Staff, Entertainment Industry, Mental Health Professionals, and their families.

**Live:** https://upstreampst.netlify.app
**Repo:** github.com/lwainright/upstreampstapp
**Owner:** Lee Wainright -- Upstream Initiative LLC
**Stack:** React 18 + Vite + vite-plugin-pwa + Appwrite + Netlify

---

## BUILD STATUS: GREEN (as of Session 6)
All screens building clean. Last confirmed green build had 96+ modules transforming.

### Known file locations -- all in src/
Every screen is a single .jsx file in src/. No subdirectories for screens.

---

## Pricing
- $40.00 per user / per year -- flat rate, all inclusive
- Family members included at no extra charge
- Remote onboarding: $500 flat
- On-site training: $1,500/day + travel | $850/half-day + travel
- Annual invoice, Net 30

---

## LLC
Upstream Initiative LLC -- North Carolina
- Do it yourself at NC Secretary of State ($125)
- Use registered agent service for privacy (~$125/year)
- UPS Store or similar for business address (~$25/month)
- Do NOT use home address in public records

---

## Core Privacy Principle
No GPS. No location tracking. Anonymous, aggregated data only. No admin visibility into personal data. Zero PII collected from end users. Not a covered entity. Does not store PHI. Same legal category as a personal journal app.

---

## Seats (8 total)
| Seat | Population |
|---|---|
| First Responder | EMS, Fire, LE, Corrections, Dispatch, SRO, Co-Responder, Forensic, Probation, Parole |
| Veteran | All eras, Coast Guard included |
| Telecommunications | 911 Dispatch, CCT Dispatch, Comm Centers |
| Human Services | DSS, CPS, APS, Child Welfare, Adult Services |
| Civilian Workforce | Government employees, Admin, Facilities, Courthouse, School support |
| Spouse / Partner | Co-regulation tools, DV resources hardwired |
| Family Member | Age-appropriate, auto-updates from birth year |
| Retiree | Retired FR and veterans |

Family members included at no cost. Each user generates up to 4 family codes.

---

## Age Progression System (AgeExperience.js)
Birth year stored only -- never full DOB. Auto-calculates on every app launch.
- under8: Young Child -- KidsHomeScreen -- immediate escalation
- 8-12: Child -- KidsHomeScreen -- immediate escalation
- 13-17: Teen -- HomeScreen -- 60s cancel window
- 17-18: Young Adult -- HomeScreen -- 60s cancel window
- 18-24: College -- HomeScreen -- no parent notification
- spouse: Adult -- HomeScreen -- no parent notification

checkAgeProgression() runs silently on launch. If age key changes, updates localStorage and shows brief notification.

---

## All Screens (src/)

### Core / Navigation
- App.jsx -- main routing, auth, QR/family join, age progression on launch
- HomeScreen.jsx -- seat-aware, home layout, tile grid
- HomeCustomizationScreen.jsx -- pin/hide/reorder tiles, saves to localStorage
- SeatSelectorScreen.jsx -- 8 seat types
- DivisionSelectorScreen.jsx -- multi-division support
- SplashScreen.jsx -- agency branding (logo on welcome only)
- AgencyCodeScreen.jsx -- agency code entry
- AboutScreen.jsx -- birth year input, age update, FamilyCodeGenerator

### Wellness Tools
- BreathingScreen.jsx -- 4-4-4-4 box breathing
- GroundingScreen.jsx -- 5-4-3-2-1 sensory grounding
- PTSDInterruptionScreen.jsx -- bilateral sensory grounding (NOT EMDR -- language removed)
- JournalScreen.jsx -- private, stays on device
- HRVScreen.jsx -- camera-based heart rate variability
- AfterActionScreen.jsx -- structured post-incident processing
- Dump90Screen.jsx -- timed 90-second vent
- ShiftCheckScreen.jsx -- start/mid/end of shift check-in
- HighAcuityScreen.jsx -- peds, fatality, removal, LOD, CCT, co-response
- GriefScreen.jsx -- 7 loss types, 3-step flow
- SleepScreen.jsx -- shift work sleep disorder tools, 4-7-8 breath timer
- HomeCustomizationScreen.jsx -- pin/hide/reorder tiles

### Population Screens
- VeteransScreen.jsx -- full resource library, benefits, postpartum
- TelecommunicationsScreen.jsx -- 911, CCT dispatch (RENAMED from CivilianScreen -- delete old)
- HumanServicesScreen.jsx -- DSS/CPS/APS, secondary trauma, NCWWI, APS TARC
- CivilianWorkforceScreen.jsx -- government employees, secretaries, janitorial, courthouse
- RetireesScreen.jsx -- transition, identity, physical, financial/VA benefits
- SupervisorScreen.jsx -- check-in scripts, debrief tools, spot overload, YOUR OWN WELLNESS + peer support tools
- KidsHomeScreen.jsx -- emoji check-in, school resources, age-appropriate tools

### NEW SCREENS (Session 6)
- HospitalScreen.jsx -- 736 lines. 10 staff groups, 12 decompression flows, QR context (?hctx=), education tab, resources tab. NO patients. Staff only.
- SchoolStaffScreen.jsx -- 597 lines. 7 staff groups, 8 flows, QR context (?sctx=). Same color scheme as hospital. Softer language.
- EntertainmentScreen.jsx -- 553 lines. NO QR. NO routing. NO admin view. 9 flows + 90-Second Shredder. External resources only. The director might be the stressor.
- MentalHealthProfScreen.jsx -- 587 lines. Reflective Practice Notes (on-device), Dump Mode (auto-delete), Boundary Reset Tools, Burnout Check-In. NOT clinical documentation. NOT PHI.

### Support / PST
- AIChatScreen.jsx -- age-aware AI peer support, anonymous, 24/7
- HumanPSTScreen.jsx -- PST connection + PST MEMBER SELF-CARE section (peer support tools)
- PSTRequestScreen.jsx -- 5-step anonymous request form + RESPONDER PEER SUPPORT TOOLS (Dump Mode, Shift Decompression, Reflective Notes). Exports ResponderPeerSupportTools component.
- PSTDispatchBoard.jsx -- CAD-style dispatch board, division filter, contact info guard
- PSTPanelScreen.jsx -- PST panel
- SmartResourcesScreen.jsx -- unified seat-aware resources hub
- SafetyVaultScreen.jsx -- PIN protected, DV resources, addictions, postpartum
- MedicalVaultSection.jsx -- medical journal inside vault
- AIMedicalChat.jsx -- AI inside vault
- FamilyConnectScreen.jsx -- Appwrite Realtime cross-device chat (uses local Client instance -- does NOT import client from appwrite.js)
- FamilyCodeGenerator.jsx -- birth year field, College (18-24) code option
- ResourcesScreen.jsx -- 30+ resources including SRO/NASRO, CIT, forensic, SANE, federal, probation, grief, sleep, QPR, chaplaincy, financial, addictions, postpartum

### Admin
- AdminToolsScreen.jsx -- PST visibility control, retention settings, HOSPITAL ANALYTICS PANEL
- AdminAIScreen.jsx -- AI business assistant, PST QR with division
- PlatformInlineContent.jsx -- Toggles (17 features), PST Config, County tab, Audit log
- PlatformOwnerScreen.jsx -- platform owner screen
- AppGuideScreen.jsx -- app guide
- QRPosterGenerator.jsx -- QR generation per division

### Tools Hub
- ToolsScreen.jsx -- tiles for ALL tools including Hospital, School, Entertainment, MH Pros, Supervisor

### Staff / Auth
- components/LoginScreen.jsx -- staff login
- hooks/useAuth.js -- auth state hook
- MasterLoginModal.jsx -- master login

### Utility Screens
- DashboardScreen.jsx
- MetricsScreen.jsx
- FeedbackScreen.jsx
- EducationalScreen.jsx
- EmergencyContactsScreen.jsx
- CustomAlertsScreen.jsx
- IDVerifyScreen.jsx

---

## Key JS Files (src/)
- appwrite.js -- exports: databases, account, storage, functions. Does NOT export client.
- AgeExperience.js -- AGE_CONFIGS at top, then utility functions. No unicode/em-dashes.
- escalation.js -- family SMS + push escalation
- analytics.js -- anonymous event tracking
- auth.js -- auth helpers
- utils.js -- useLayoutConfig, helpers
- fetchResources.js -- resource fetching
- icons.jsx -- SVG icon components
- ui.jsx -- shared UI components (ScreenSingle, Btn, etc.)
- push-client.js -- web push client

---

## netlify/functions/
- chat.js -- Claude peer support + admin AI
- search.js -- Tavily + Claude resource finder
- sms-escalate.js -- Twilio SMS family escalation
- push-notify.js -- web push VAPID family escalation

---

## Appwrite Collections
```
agencies              -- code, name, logoUrl, pstRetentionDays, pstVisibility
pst_cases             -- case management
pst_members           -- PST team roster
agency_divisions      -- multi-division support
family_codes          -- family access codes
family_checkins       -- anonymous kids check-in (familyToken, ageKey, feeling, severity, timestamp)
fc_sessions           -- Family Connect sessions (code:30, expiry:36, active:bool, createdAt:36)
fc_messages           -- Family Connect messages (sessionCode:30, sender:50, text:2000, timestamp:36)
user_permissions      -- staff roles (platform/admin/supervisor/pst)
platform_settings     -- global platform config
platform_audit_log    -- audit trail
checkins              -- anonymous wellness check-ins
tool_usage            -- feature usage tracking (includes hospital_ and school_ prefixed entries)
ai_sessions           -- AI chat session counts
escalations           -- crisis escalation events
hrv_readings          -- HRV data
resource_views        -- resource click tracking
resources             -- vetted resource library (AI-found go through admin approval)
```

### Appwrite Fields Needed (not yet added)
- agencies collection: add pstRetentionDays (Integer)
- pst_cases collection: add division (String 50)

---

## Multi-Tenant Architecture
```
QR Code / Family Code / Agency Code
  -> Agency lookup in Appwrite
  -> Agency branding (logo on welcome screen ONLY -- text in header)
  -> Division selector if applicable
  -> Seat selector (8 types)
  -> Age-appropriate experience
  -> Seat-aware resources + tools
```

### County Model
```
County Admin (sees all agencies)
  -> WAKEMS (sees only their data)
  -> WAKESO (sees only their data)
  -> WAKEDSS (sees only their data)
  -> WAKE911 (sees only their data)
```

---

## Staff Roles
```
platform    Full cross-agency, toggles, county management, audit log
admin       Agency management, PST config, divisions, retention, hospital analytics
supervisor  Wellness dashboard, team tools, peer support self-care
pst         Dispatch board, case management (visibility set by agency head)
```

---

## Feature Toggles (17 -- no code changes needed)
Managed in PlatformInlineContent.jsx Toggles tab. Platform owner can enable/disable per agency.

---

## PST System
- PSTRequestScreen -- 7 need types (grief, sleep, supervisor, etc.)
- PSTDispatchBoard -- division filter, contact info guard (only claiming PST member sees contact)
- Auto-purge based on pstRetentionDays (30/60/90/120 days)
- PST visibility: None/Basic/Full -- set by agency head per PST member

---

## Peer Support Self-Care Tools (NEW -- Session 6)
Exported from PSTRequestScreen.jsx as ResponderPeerSupportTools component.
Used in:
- PSTRequestScreen.jsx (for the person requesting support)
- SupervisorScreen.jsx (Your Own Wellness section)
- HumanPSTScreen.jsx (PST member self-care after heavy contacts)

Contains:
- Dump Mode (write anything, auto-shreds, no save, no trace)
- Shift Decompression (Leave the Scene, Come Home as Yourself, Stop Second-Guessing)
- Reflective Notes (localStorage only, no sync, rotating prompts)

---

## Hospital Screen Architecture
- Staff only. No patients. No PHI. No identity.
- 10 staff groups (Acute, BH, Med/Surg, Palliative, Women/Children, Support Services, Comms, Leadership, Physicians, Interdisciplinary)
- 12 decompression flows
- QR context: ?hctx=code&hunit=acute routes directly to flow
- Analytics tracked to tool_usage with hospital_ prefix
- Admin analytics panel in AdminToolsScreen.jsx
- Legal: "Not clinical care. Not reporting. Not documentation."

## School Staff Screen Architecture
- Staff only. No students. No parents. No identity.
- 7 staff groups
- 8 decompression flows
- QR context: ?sctx=incident routes directly to flow
- Softer language than hospital ("that was a lot" not "incident")
- Analytics tracked with school_ prefix

## Entertainment Screen Architecture
- NO QR. NO routing. NO internal escalation. NO admin view.
- 9 decompression flows
- 90-Second Shredder (type and destroy -- nothing saved, nothing sent)
- External resources ONLY (unions, guilds, industry orgs)
- The director might be the stressor -- routing = danger

## Mental Health Professional Screen Architecture
- 3-screen onboarding (seen once)
- Reflective Practice Notes -- localStorage only, NOT PHI, NOT clinical documentation
- Dump Mode -- auto-deletes on close
- Boundary Reset Tools -- 4 flows (Leave the Room, Helper Mode, Emotional Tab, Return to Yourself)
- Burnout Check-In -- no scoring, no labels
- External resources only -- Emotional PPE, ProQOL, NCTSN, etc.
- Legal posture: same category as Apple Notes + peer support app

---

## Safety Vault
- PIN protected (set/defer/skip on first use)
- DV resources hardwired
- Addictions + postpartum sections
- MedicalVaultSection.jsx inside
- AIMedicalChat.jsx inside
- First-time flow: Set PIN / Enter without PIN / Not now

---

## Family System
- FamilyCodeGenerator: birth year field, College (18-24) option
- FamilyConnectScreen: Appwrite Realtime -- uses local Client instance (NOT imported from appwrite.js)
- Age auto-calculates from birth year on every launch
- checkAgeProgression() runs silently, updates if age range changed

---

## Branding Rules
- Agency logo: welcome/splash screen ONLY -- big
- Header: "POWERED BY [AGENCY]" text only -- no logo in header
- Color scheme consistent across all screens

---

## EMDR Language
REMOVED everywhere. Use "bilateral sensory grounding" only. Never say EMDR.

---

## Critical Bug History (so we don't repeat)
1. AgeExperience.js -- em dashes and box-drawing unicode chars cause esbuild parse error. File must be ASCII only. AGE_CONFIGS must be declared BEFORE utility functions that reference it.
2. SafetyVaultScreen.jsx -- extra } in JSX comments caused parse error. Comments like {/* -- text -- */}} are invalid.
3. MedicalVaultSection.jsx -- line 454 had duplicated content appended. One clean object entry only.
4. FamilyConnectScreen.jsx -- appwrite.js does NOT export client. Use local Client instance.
5. AboutScreen.jsx -- FamilyDashboard.jsx does not exist. Import removed.
6. App.jsx -- duplicate resources key caused build failure. Renamed old one to allresources.
7. TelecommunicationsScreen.jsx -- was CivilianScreen.jsx. Old file must be DELETED from repo.
8. push-notify.js and sms-escalate.js -- must be in netlify/functions/ NOT in src/

---

## Deployment
- Push to main -> Netlify auto-deploys
- Build: npm run build -- Publish: dist
- All routes -> index.html (SPA)
- Functions -> netlify/functions/
- BUILD STATUS: GREEN as of Session 6

## Environment Variables (Netlify)
```
VITE_APPWRITE_ENDPOINT
VITE_APPWRITE_PROJECT
VITE_APPWRITE_DATABASE
VITE_APPWRITE_PROJECT_ID
ANTHROPIC_API_KEY
VAPID_EMAIL
VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
GEMINI_KEY_1 through GEMINI_KEY_5
ALLOWED_ORIGINS
SECRETS_SCAN_SMART_DETECTION_ENABLED
VITE_DEMO_AGENCY_CODES
VITE_ENABLE_DEMO_ROLE_SWITCHER
```

---

## Current Agency (Testing)
NC LEAP -- code: NCLEAP -- Appwrite $id: 69e6dc700013b1972197

---

## PENDING BUILD QUEUE (Pre-Final Build)

### Needs mapping conversation first:
- Algorithm -- how content surfaces for owner vs admin vs user
- Individual vs business pricing model
- Owner dashboard view vs agency admin view vs end user view

### Remaining modules to build:
1. Developmental Support Layer -- cross-cutting, all domains, plain language, no diagnostic labels
2. Signal Interpreter -- stress/overwhelm detection, feeds adaptive pathway
3. Adaptive Pathway Engine -- makes flows dynamic instead of linear
4. Spirituality Resource Layer -- optional, user-led, universal first then faith-specific
5. Recovery/Addiction Resource Layer -- optional, available everywhere, FR-specific resources
6. Resource Language Pack -- formalize AI search vocabulary for Tavily queries

### Security pass (after modules):
- Rate limiting on Netlify functions
- Input sanitization on PST forms
- Audit log completeness check
- CSP header review
- NO session timeout for staff (breaks push notifications)
- Safety Vault PIN re-prompt on inactivity (already exists)

### Compliance notes:
- HIPAA: Not applicable -- no PHI, not a covered entity
- FERPA: Low risk -- no student data
- 42 CFR Part 2: Watch if recovery resources reference substance use records
- ADA: Needs accessibility audit before enterprise contracts
- SOC 2: Future -- when scaling to enterprise

### Schoolhouse pet (deferred):
- Owl for school staff branding
- Interactive animal for KidsHomeScreen
- Animal choice pending -- options: owl, dog, turtle, fox

### Home screen tile filter:
- getHomeLayout() imported but tile filter not fully wired into HomeScreen rendering

---

## Competitive Position
No platform covers: whole building (sworn+civilian+dispatch+corrections+DSS+family+hospital+school+entertainment+MH pros), zero identity collection, 24-48hr deployment, built-in PST infrastructure, safety vault with DV resources, high acuity decompression, age-progressive family system, multi-agency county management, feature toggles without code changes, 90-second shredder for entertainment, peer support self-care tools for supervisors and PST members.

Closest competitor Cordico: $96-180/user/year, responder-only, no family system.
