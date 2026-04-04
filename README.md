# Upstream Approach — First Responder Wellness App

<div align="center">

![Upstream Approach Logo](icons/icon-512.png)

**Confidential, stigma-free wellness support for first responders**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-Ready-brightgreen.svg)]()
[![Offline](https://img.shields.io/badge/Offline-Supported-orange.svg)]()

**Upstream Approach · Powered by Upstream Initiative · First Responder Edition**

[Live App](https://upstreampstapp.netlify.app) • [Report Bug](https://github.com/lwainright/upstreampstapp/issues) • [Request Feature](https://github.com/lwainright/upstreampstapp/issues)

</div>

---

## 🚨 Purpose

First responders face unique stressors that require fast, private, judgment-free support. **Upstream Approach** is built to provide immediate wellness tools, peer support access, and crisis resources — right from the field.

### Core Privacy Principle

> **No accounts. No analytics. No tracking. No admin visibility.**
>
> All activity stays on the device. Anonymous by design.

---

## 🧭 Features

### Wellness Tools
- 🫁 **Box Breathing** — 4-4-4-4 tactical breathing
- 🌬️ **Grounding Exercise** — 5-4-3-2-1 sensory awareness
- 🔄 **After Action Reset** — Quick mental reset between calls
- 📓 **Journal** — Private, stays on device
- 🧠 **PTSD Interruption** — Pattern interrupt techniques
- 💥 **Rough Call Debrief** — Structured post-incident processing

### Support Access
- 🤖 **AI PST Chat** — Anonymous AI conversations, confidential
- 👥 **Human PST** — Connect with your peer support team
- 📞 **Crisis Resources** — National and local, always available offline
- 🔍 **ZIP Code Search** — Find local resources near you

### Platform Features
- 📱 **Progressive Web App** — Install on any device
- ✈️ **Offline Mode** — Core tools work without internet
- 🏢 **Agency Customization** — Custom branding and resources via Appwrite
- 🔐 **Staff Login** — PST, supervisors, admins via Appwrite Auth
- 📊 **Platform Dashboard** — Cross-agency analytics and management

---

## 📦 Tech Stack

```
Frontend    React + Vite + PWA
Backend     Appwrite (Auth, Database, Storage)
Deploy      Netlify (CI/CD from GitHub)
AI          Gemini via Netlify Functions
```

---

## 🔒 Privacy & Security

### What We Never Collect
- ❌ No user accounts for regular users
- ❌ No email addresses
- ❌ No phone numbers
- ❌ No IP addresses
- ❌ No location data
- ❌ No conversation logs
- ❌ No usage analytics tied to individuals

### What Stays on Device
- ✅ AI chat history
- ✅ Journal entries
- ✅ Settings and preferences
- ✅ ZIP code (for resource search only)
- ✅ Cached resources (for offline use)

### What Leaves the Device
- Only if you choose to contact Human PST
- Name and phone you provide — your choice, every time

### Admin Visibility
Supervisors and admins see **zero** individual data. Analytics are agency-level only — no names, no conversations, no personal information of any kind.

---

## 🚀 Quick Start

### Prerequisites
```
Node.js 18+
Netlify account
Appwrite account
```

### Environment Variables
```
VITE_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT=your_project_id
VITE_APPWRITE_DATABASE=your_database_id
ANTHROPIC_API_KEY=your_key
GEMINI_KEY_1=your_key
```

### Local Development
```bash
git clone https://github.com/lwainright/upstreampstapp
cd upstreampstapp
npm install
npm run dev
```

### Deploy
```bash
# Push to GitHub → Netlify auto-deploys
git push origin main
```

---

## 📁 Project Structure

```
src/
├── App.jsx                  # Main routing and auth gate
├── appwrite.js              # Appwrite client config
├── auth.js                  # Auth functions
├── analytics.js             # Anonymous usage tracking
├── fetchResources.js        # Tiered resource system + caching
├── utils.js                 # Hooks and helpers
├── icons.jsx                # SVG icon components
│
├── components/
│   ├── ui.jsx               # Shared UI components
│   └── LoginScreen.jsx      # Staff login
│
├── hooks/
│   └── useAuth.js           # Auth state hook
│
└── screens/                 # One file per screen
    ├── HomeScreen.jsx
    ├── AIChatScreen.jsx      # Offline detection built in
    ├── HumanPSTScreen.jsx
    ├── ResourcesScreen.jsx   # ZIP search + Appwrite resources
    ├── JournalScreen.jsx
    ├── BreathingScreen.jsx
    ├── GroundingScreen.jsx
    ├── AdminToolsScreen.jsx
    ├── PlatformOwnerScreen.jsx
    └── [20 more screens]
```

---

## ⚙️ Appwrite Setup

### Collections Required
```
user_permissions   — Staff roles and access
agencies           — Agency registry
resources          — Local and national resources
agency_resources   — Per-agency EAP and contacts
checkins           — Anonymous wellness check-ins
tool_usage         — Feature usage tracking
ai_sessions        — AI chat session counts
pst_contacts       — PST contact requests
```

See `src/APPWRITE_SETUP.md` for full attribute definitions.

---

## 🏢 Multi-Tenant Architecture

Upstream Approach supports multiple agencies from a single deployment. Each agency gets:

```
QR Code → Agency Code → Appwrite lookup
→ Agency branding (logo, colors)
→ Agency resources (EAP, local contacts)
→ Agency PST roster
→ Agency-specific welcome message
```

No app update needed to add or configure agencies. All managed through the Platform Dashboard.

---

## 📞 Resource System

Four-tier fallback ensures resources always show:

```
Tier 1  Vetted local resources from Appwrite (by ZIP/state)
Tier 2  SAMHSA API fallback for unvetted areas
Tier 3  National directory links (NVFC, Badge of Life, etc)
Tier 4  Hardcoded crisis lines — always visible, always offline
        988 · Crisis Text Line · Safe Call Now · Veterans Crisis Line
```

SAMHSA results auto-import to Appwrite for future Tier 1 use.

---

## 📱 Installation

### iPhone
1. Open in Safari
2. Tap Share → Add to Home Screen

### Android
1. Open in Chrome
2. Tap Menu → Install App

### Desktop
1. Open in Chrome or Edge
2. Click Install icon in address bar

---

## 🔐 Staff Access

Regular users — no login needed. Scan agency QR code and use the app.

Staff roles (PST, Supervisor, Admin, Platform) log in via email and password. Roles managed in Appwrite `user_permissions` collection.

```
platform    Full cross-agency access
admin       Agency-level management
supervisor  Wellness dashboard for their unit
pst         PST queue and contact management
```

---

## 📄 License

Apache License 2.0 — see [LICENSE](LICENSE) for details.

---

## 💙 Built for First Responders, By First Responders

Upstream Approach is designed by a paramedic who understands the unique challenges of the job. Built with input from peer support specialists, mental health professionals, and first responders across disciplines.

**Upstream of the crisis. Every time.**

---

<div align="center">

**© 2026 Upstream Initiative**

[Live App](https://upstreampstapp.netlify.app) • [GitHub](https://github.com/lwainright/upstreampstapp)

</div>
