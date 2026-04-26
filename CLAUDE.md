# CLAUDE.md -- Upstream Approach PWA
# Last Updated: Session 7 Complete -- Final Foundation Build

## Project Overview
Upstream Approach is a first responder and workforce wellness PWA. It provides confidential, anonymous mental health tools for EMS, Fire, Law Enforcement, Dispatch, Corrections, DSS/CPS/APS, Veterans, Civilians, Hospital Staff, School Staff, Entertainment Industry, Mental Health Professionals, and their families.

**Live:** https://upstreampst.netlify.app
**Repo:** github.com/lwainright/upstreampstapp
**Owner:** Lee Wainright -- Upstream Initiative LLC
**Stack:** React 18 + Vite + vite-plugin-pwa + Appwrite + Netlify
**BUILD STATUS: GREEN**

---

## Business Model
- **Pricing:** $40/user/year flat -- all inclusive -- family included
- **Remote onboarding:** $500 flat
- **On-site training:** $1,500/day + travel | $850/half-day + travel
- **Invoice:** Annual, Net 30
- **Buyer:** Always an organization (agency, county, hospital, school district) -- never the end user
- **End users:** Anonymous, never pay, never log in
- **Sales pitch:** "A governed behavioral support platform. We configure the experience, resources, tone, and safety thresholds for your agency. Your people stay anonymous. You get aggregate utilization data."

## LLC
Upstream Initiative LLC -- North Carolina
- NC Secretary of State ($125)
- Registered agent service for privacy (~$125/year)
- Business address not home address

---

## Core Privacy Principle
No GPS. No location. Anonymous, aggregated data only. No PII from end users. Not a covered entity. Does not store PHI. Not a medical record system. Same legal category as a personal journal app + peer support app protected by state confidentiality laws.

---

## Architecture -- Three Core Engines

### 1. Response Engine (what AI says)
- chat.js -- Claude Haiku via fetch, domain profile injection, continuum classifier
- 12 domain profiles (responder, veteran, telecom, humanservices, civilian, spouse, family, retiree, hospital, school, entertainment, mhpro)
- Each profile sets: tone, style, pacing, maxTier
- Continuum classifier runs on every conversation: Green/Yellow/Orange/Red
- Orange → PST offer appended. Red → 988 crisis resources appended.

### 2. Resource Engine (what AI finds)
- search.js -- Tavily + Claude resource finder
- Resources stored in Appwrite (not hardcoded)
- AI finds → vets → sends to admin for approval → writes to Appwrite → caches on device
- Resource Language Pack in SupportLayers.js defines search vocabulary

### 3. Governance Engine (what AI is allowed to do)
- security.js -- rate limiting, input sanitization, prompt injection detection
- ContinuumEngine.js -- on-device signal detection, operational modes
- Platform toggles (17 features, no code changes)
- PST visibility control per agency
- County admin model -- county sees all, agency sees only theirs
- Audit log in platform_audit_log collection

---

## Mental Health Continuum
| Level | Label | AI Response | Handoff |
|---|---|---|---|
| Green | Doing okay | Normal peer conversation | None |
| Yellow | Feeling the weight | Offer tools, slow down | None |
| Orange | Struggling | Be present, offer PST | PST offer appended to response |
| Red | Need support now | Safety first, crisis resources | 988 + PST offer immediate |

Handoff is user-led. AI never forces escalation. PST dispatch board -- available PST members pick up cases.

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

---

## Age Progression System (AgeExperience.js)
Birth year only stored -- never full DOB. Auto-calculates on every app launch.
- under8 / 8-12 / 13-17 / 17-18 / 18-24 / spouse
- checkAgeProgression() runs silently on launch
- AGE_CONFIGS must be declared BEFORE utility functions (esbuild requirement)

---

## All Files -- src/

### Core
- App.jsx -- routing, auth, QR/family join, age progression
- HomeScreen.jsx -- tile grid driven by getHomeLayout() from HomeCustomizationScreen
- HomeCustomizationScreen.jsx -- pin/hide/reorder tiles, exports DEFAULT_TILES + getHomeLayout()
- SeatSelectorScreen.jsx -- 8 seat types
- DivisionSelectorScreen.jsx
- SplashScreen.jsx -- agency logo on welcome ONLY
- AgencyCodeScreen.jsx
- AboutScreen.jsx -- birth year input, age update

### New Files (Session 7)
- ContinuumEngine.js -- on-device continuum detection, domain profiles, resource tier filter
- SupportLayers.js -- Developmental Support + Spirituality + Recovery layers + Resource Language Pack + Vetting Checklist

### Wellness Tools
- BreathingScreen.jsx
- GroundingScreen.jsx
- PTSDInterruptionScreen.jsx -- bilateral sensory grounding (NOT EMDR)
- JournalScreen.jsx
- HRVScreen.jsx
- AfterActionScreen.jsx
- Dump90Screen.jsx
- ShiftCheckScreen.jsx
- HighAcuityScreen.jsx
- GriefScreen.jsx
- SleepScreen.jsx

### Population Screens
- VeteransScreen.jsx
- TelecommunicationsScreen.jsx (RENAMED from CivilianScreen -- old file deleted)
- HumanServicesScreen.jsx
- CivilianWorkforceScreen.jsx
- RetireesScreen.jsx
- SupervisorScreen.jsx -- includes ResponderPeerSupportTools
- KidsHomeScreen.jsx

### New Screens (Sessions 6-7)
- HospitalScreen.jsx -- 10 staff groups, 12 flows, QR context ?hctx=, staff only
- SchoolStaffScreen.jsx -- 7 staff groups, 8 flows, QR context ?sctx=
- EntertainmentScreen.jsx -- NO QR, NO routing, 9 flows, 90-Second Shredder, external resources only
- MentalHealthProfScreen.jsx -- Reflective Notes, Dump Mode, Boundary Reset, Burnout Check-In

### Support / PST
- AIChatScreen.jsx -- age-aware, sends seat+ageKey to chat.js, handles continuum response
- HumanPSTScreen.jsx -- includes PST member self-care (ResponderPeerSupportTools)
- PSTRequestScreen.jsx -- exports ResponderPeerSupportTools component (Dump Mode, Shift Decompression, Reflective Notes)
- PSTDispatchBoard.jsx
- PSTPanelScreen.jsx
- SmartResourcesScreen.jsx
- SafetyVaultScreen.jsx
- MedicalVaultSection.jsx
- AIMedicalChat.jsx
- FamilyConnectScreen.jsx -- local Client instance (NOT from appwrite.js)
- FamilyCodeGenerator.jsx
- ResourcesScreen.jsx

### Admin
- AdminToolsScreen.jsx -- hospital analytics panel
- AdminAIScreen.jsx
- PlatformInlineContent.jsx -- Toggles, PST Config, County, Audit
- PlatformOwnerScreen.jsx
- AppGuideScreen.jsx
- QRPosterGenerator.jsx

### Utility
- DashboardScreen.jsx, MetricsScreen.jsx, FeedbackScreen.jsx
- EducationalScreen.jsx, EmergencyContactsScreen.jsx
- CustomAlertsScreen.jsx, IDVerifyScreen.jsx

### JS Utilities (src/)
- appwrite.js -- exports: databases, account, storage, functions. Does NOT export client.
- AgeExperience.js -- AGE_CONFIGS first, then functions. No unicode/em-dashes.
- ContinuumEngine.js -- continuum detection, domain profiles, resource filters
- SupportLayers.js -- developmental, spirituality, recovery, resource language pack
- escalation.js -- family SMS + push escalation
- analytics.js -- anonymous event tracking
- auth.js -- auth helpers
- utils.js -- useLayoutConfig, helpers
- fetchResources.js -- resource fetching
- icons.jsx -- SVG icons
- ui.jsx -- ScreenSingle, Btn, etc.
- push-client.js -- web push

---

## netlify/functions/
- chat.js -- Claude peer support + admin AI + continuum classifier + domain profiles + rate limiting
- security.js -- rate limiting, sanitization, injection detection, CORS headers
- search.js -- Tavily + Claude resource finder
- sms-escalate.js -- Twilio SMS family escalation
- push-notify.js -- web push VAPID family escalation

---

## Appwrite Collections
```
agencies              -- code, name, logoUrl, pstRetentionDays, pstVisibility
pst_cases             -- case management + division field
pst_members           -- PST team roster
agency_divisions      -- multi-division support
family_codes          -- family access codes
family_checkins       -- anonymous kids check-in
fc_sessions           -- Family Connect (code:30, expiry:36, active:bool, createdAt:36)
fc_messages           -- Family Connect (sessionCode:30, sender:50, text:2000, timestamp:36)
user_permissions      -- platform/admin/supervisor/pst
platform_settings     -- global config
platform_audit_log    -- audit trail (immutable)
checkins              -- anonymous wellness check-ins
tool_usage            -- feature usage (hospital_ and school_ prefixed)
ai_sessions           -- AI chat session counts
escalations           -- crisis escalation events
hrv_readings          -- HRV data
resource_views        -- resource click tracking
resources             -- vetted library (AI-found go through admin approval)
```

### Appwrite Schema -- Still Needed
- resources collection: add `tier` Integer (0-4) and `approved_domains` Array
- agencies collection: add `pstRetentionDays` Integer (if not already)
- pst_cases collection: add `division` String 50 (if not already)

---

## Security
- Rate limiting: 30 req/min users, 60 req/min admins (security.js)
- Input sanitization: all chat inputs, agency codes, phone numbers
- Prompt injection detection: 8 pattern checks
- CORS: ALLOWED_ORIGINS env var
- No session timeout for staff (breaks push notifications)
- Safety Vault PIN re-prompt on inactivity
- No client-side resource decisions -- policy engine on backend

---

## Compliance
- HIPAA: Not applicable -- no PHI, not covered entity
- FERPA: Low risk -- no student data
- 42 CFR Part 2: Watch if recovery resources reference substance records
- ADA: Needs accessibility audit before enterprise contracts
- SOC 2: Future -- when scaling to enterprise

---

## Critical Bug History
1. AgeExperience.js -- em dashes cause esbuild parse error. ASCII only. AGE_CONFIGS before functions.
2. SafetyVaultScreen.jsx -- extra } in JSX comments breaks parse
3. MedicalVaultSection.jsx -- line 454 had duplicated content
4. FamilyConnectScreen.jsx -- appwrite.js does NOT export client. Use local Client instance.
5. AboutScreen.jsx -- FamilyDashboard.jsx does not exist
6. App.jsx -- duplicate resources key
7. TelecommunicationsScreen.jsx -- was CivilianScreen.jsx. Old file deleted from repo.
8. push-notify.js + sms-escalate.js -- must be in netlify/functions/ NOT src/
9. -> arrow in JSX text is invalid. Use unicode → instead.
10. HomeScreen.jsx -- ageConfig used before declared. Add useState init.
11. chat.js -- @anthropic-ai/sdk not in package.json. Use fetch() directly.
12. Gemini API format (candidates/contents) replaced with Anthropic fetch format (messages/content).

---

## Pending -- Small Items
- Schoolhouse pet -- owl for staff, interactive for kids -- animal choice pending
- Appwrite schema update -- add tier + approved_domains to resources collection
- Accessibility audit -- before enterprise contracts

## Pending -- Future / Phase 2
- Code-splitting (bundle is 1.2MB -- consider dynamic imports for large screens)
- Upstash Redis for persistent rate limiting at scale
- Netlify Pro/Enterprise before 500+ user agency
- Request Anthropic rate limit increase before large deployment
- Load testing before first enterprise contract
- SOC 2 certification at scale

---

## Environment Variables (Netlify)
```
VITE_APPWRITE_ENDPOINT
VITE_APPWRITE_PROJECT
VITE_APPWRITE_DATABASE
VITE_APPWRITE_PROJECT_ID
ANTHROPIC_API_KEY
VAPID_EMAIL / VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY
GEMINI_KEY_1 through GEMINI_KEY_5
ALLOWED_ORIGINS
SECRETS_SCAN_SMART_DETECTION_ENABLED
VITE_DEMO_AGENCY_CODES
VITE_ENABLE_DEMO_ROLE_SWITCHER
```

## Current Agency (Testing)
NC LEAP -- code: NCLEAP -- Appwrite $id: 69e6dc700013b1972197

---

## Competitive Position
No platform covers: whole building (sworn+civilian+dispatch+corrections+DSS+family+hospital+school+entertainment+MH pros), zero identity, 24-48hr deployment, built-in PST infrastructure, safety vault, high acuity decompression, age-progressive family, multi-agency county management, 17 feature toggles, 90-second shredder, peer support self-care tools for supervisors and PST members, continuum-aware AI with domain profiles, security layer.

Closest competitor Cordico: $96-180/user/year, responder-only, no family system.
