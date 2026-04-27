# CLAUDE.md -- Upstream Approach PWA
# Last Updated: Session 8 Complete

## Project Overview
Upstream Approach is a first responder and workforce wellness PWA. Confidential, anonymous mental health tools for EMS, Fire, Law Enforcement, Dispatch, Corrections, DSS/CPS/APS, Veterans, Civilians, Hospital Staff, School Staff, Entertainment Industry, Mental Health Professionals, and their families.

**Live:** https://upstreampst.netlify.app
**Repo:** github.com/lwainright/upstreampstapp
**Owner:** Lee Wainright -- Upstream Initiative LLC
**Stack:** React 18 + Vite + vite-plugin-pwa + Appwrite + Netlify
**BUILD STATUS: GREEN**

---

## Business Model

### Organizational (Built)
- Implementation Fee: $5,000 one time
- Platform License: $40/user/year flat -- no tiers, no penalties for size
- Remote Training: $500/session
- On-site Training: $1,500/day + travel
- Family: included at no charge (up to 4 codes per user)
- All features included -- PST, analytics, admin dashboard
- Annual invoice, Net 30
- Taxes: Not applicable in NC (NC DOR SaaS ruling Feb 2, 2021)

### Individual (Not yet built)
- Price: $60/year -- includes buyer + up to 3 family members
- One-time payment (not subscription) via Stripe on website
- Delivery: email with activation link (https://upstreampst.netlify.app?code=UA-XXXX)
- Code: max_users:4, expires 365 days, renewal via new code
- Automated renewal emails: 30 days out, 7 days out, day of expiry
- No PST team, no admin dashboard, no agency branding
- Stripe handles tax collection by state automatically

### Individual flow
1. Buy on website → Stripe payment
2. Netlify webhook generates code → writes to activation_codes (no email)
3. Writes email + code_ref to purchasers collection (admin only, app never reads)
4. Sends email with activation link
5. User taps link → app opens → code activates → 365 days access
6. Day 335: automated renewal email sent
7. Renewal = new code, new link, new 365 days

---

## LLC
Upstream Initiative LLC -- North Carolina
NC DOR SaaS ruling Feb 2, 2021 -- SaaS not subject to NC sales tax

---

## Core Privacy Principle
No GPS. No location. Anonymous, aggregated data only. No PII from end users.
Exception: purchaser email stored separately for renewal emails only -- never linked to app usage.
Not a covered entity. Does not store PHI.

---

## Architecture -- Three Core Engines

### 1. Response Engine (chat.js)
- Claude Haiku via fetch -- no SDK
- 12 domain profiles (responder, veteran, telecom, humanservices, civilian, spouse, family, retiree, hospital, school, entertainment, mhpro)
- Continuum classifier on every conversation: Green/Yellow/Orange/Red
- Orange → PST offer appended. Red → 988 crisis resources appended.
- Admin AI path separate with higher rate limits

### 2. Resource Engine (search.js)
- Claude direct -- no Tavily dependency
- Location-aware: local/regional/state/national scope
- AI-found resources show immediately with "AI Found -- verify before use" label
- Vetted resources show "✓ Vetted" label
- No auto-save to Appwrite (dynamic imports don't work in zisi bundler)

### 3. Governance Engine
- security.js -- rate limiting, sanitization, injection detection
- ContinuumEngine.js -- on-device signal detection
- Platform toggles (17 features)
- PST visibility control per agency
- Audit log in platform_audit_log

---

## Mental Health Continuum
Green → normal peer conversation
Yellow → offer tools, slow down
Orange → PST offer appended to response
Red → 988 + PST offer immediate

---

## Home Screen (6 tiles -- hub layout)
| Tile | Routes to | Contains |
|---|---|---|
| 💬 Talk to Someone | TalkToSomeoneScreen | AI chat + Human PST + 988 + Safety Vault |
| 🌬 Breathe & Ground | BreatheGroundScreen | Box breathing + 5-4-3-2-1 + Follow the Light + Sleep |
| ✍ Write It Out | WriteItOutScreen | 90-second dump + Journal + After-action + Grief |
| 📋 Daily Check In | DailyCheckInScreen | 5 questions, continuum-aware, routes to support |
| 🗺 Resources | SmartResourcesScreen | AI finder + crisis lines + seat-specific resources |
| 🧠 PTSD Interruption | PTSDInterruptionScreen | 21 grounding tools |

Layout version: v4 -- bumping this resets all users to default 6 tiles

---

## New Screens (Session 8)
- TalkToSomeoneScreen.jsx -- AI chat + Human PST + 988 + Safety Vault access
- BreatheGroundScreen.jsx -- breathing + grounding hub
- WriteItOutScreen.jsx -- writing tools hub
- DailyCheckInScreen.jsx -- 5-question check-in, continuum-aware

---

## Netlify Functions
- chat.js -- Claude peer support, continuum classifier, 12 domain profiles, fetch-based
- search.js -- Claude direct resource finder, NO Tavily, NO local requires, standalone
- security.js -- rate limiting, sanitization (NOT required by other functions -- each must be standalone)
- sms-escalate.js -- Twilio SMS
- push-notify.js -- VAPID push

### CRITICAL RULE -- Netlify Functions
Every function must be completely self-contained.
NO local requires (require("./security") breaks zisi bundler).
NO dynamic imports (await import() fails in Netlify functions).
If two functions need the same utility, copy it inline into both.

---

## Appwrite Collections
```
agencies              -- code, name, logoUrl, pstRetentionDays, pstVisibility
pst_cases             -- case management, division field
pst_members           -- PST team roster
agency_divisions      -- multi-division support
family_codes          -- family access codes (4 max per user)
family_checkins       -- anonymous kids check-in
fc_sessions           -- Family Connect sessions
fc_messages           -- Family Connect messages
user_permissions      -- platform/admin/supervisor/pst
platform_settings     -- global config
platform_audit_log    -- audit trail
checkins              -- anonymous wellness check-ins
tool_usage            -- feature usage tracking
ai_sessions           -- AI chat session counts
escalations           -- crisis escalation events
hrv_readings          -- HRV data
resource_views        -- resource click tracking
resources             -- vetted library (tier + approved_domains fields added)
activation_codes      -- individual license codes (PENDING BUILD)
purchasers            -- email + code_ref for renewal emails only (PENDING BUILD)
```

### Appwrite Schema -- Completed
- resources.tier -- Integer, default 0
- resources.approved_domains -- String 500

---

## Product Versions

| Version | Status | Price |
|---|---|---|
| Agency/Org | Built | $5k impl + $40/user/yr |
| Individual | Pending | $60/yr (buyer + 3 family) |
| County multi-agency | Partially built | $5k impl + $40/user/yr |
| Trial/Demo | Partially built | Free, time-limited |

---

## Security
- chat.js, sms-escalate.js, push-notify.js -- rate limiting inline
- search.js -- standalone, no dependencies
- CORS headers on all functions
- CSP, HSTS, X-Frame-Options in netlify.toml
- No session timeout for staff (breaks push notifications)
- Safety Vault PIN optional

---

## Compliance
- HIPAA: Not applicable -- no PHI
- NC Sales Tax: Not applicable (SaaS ruling Feb 2, 2021)
- Privacy Policy: Written -- needs public URL
- HIPAA Statement: Written -- for procurement
- DPA Template: Written -- for contracts over $10k

---

## Critical Bug History
1. AgeExperience.js -- ASCII only, AGE_CONFIGS before functions
2. FamilyConnectScreen.jsx -- use local Client instance, not from appwrite.js
3. -> arrow in JSX -- use → unicode
4. chat.js -- use fetch() not @anthropic-ai/sdk
5. Netlify functions -- NO local requires, NO dynamic imports, self-contained only
6. search.js -- dynamic import("appwrite") crashed function silently
7. SmartResourcesScreen -- is the actual resources screen, not ResourcesScreen
8. Home layout cache -- bump LAYOUT_VERSION string to force reset

---

## Pending -- Next Session
1. activation_codes collection in Appwrite
2. purchasers collection in Appwrite (admin-only permissions)
3. Stripe webhook Netlify function (payment → code → email)
4. Scheduled renewal function (Netlify cron -- 30/7/0 day emails)
5. Code expiry check on app launch + soft lock + renewal prompt
6. Renewal banner component (30 days out)
7. Privacy Policy update -- email-for-fulfillment clause
8. User Guide -- Individual
9. User Guide -- Business/Agency/County

---

## Current Agency (Testing)
NC LEAP -- code: NCLEAP -- Appwrite $id: 69e6dc700013b1972197

---

## Competitive Position
No platform covers: whole building + zero identity + 24-48hr deployment + built-in PST + safety vault + high acuity decompression + age-progressive family + multi-agency county + 17 feature toggles + 90-second shredder + peer support self-care + continuum-aware AI + domain profiles + security layer + DD support everywhere + turtle mascot + hub-based home screen.
Cordico: $96-180/user/year, responder-only, no family system.
