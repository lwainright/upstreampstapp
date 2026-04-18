# Upstream Approach — A First Responder Wellness Platform

<div align="center">

![Upstream Approach](https://nyc.cloud.appwrite.io/v1/storage/buckets/69e14d570027ebb13e13/files/69e154c7000987e685e8/view?project=upstreamapproach)

*Confidential · Stigma-Free · Built for the Job*

<br/>

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-Ready-brightgreen.svg)]()
[![Offline](https://img.shields.io/badge/Offline-Supported-orange.svg)]()
[![Claude AI](https://img.shields.io/badge/AI-Claude%20by%20Anthropic-blueviolet.svg)]()
[![Appwrite](https://img.shields.io/badge/Backend-Appwrite-pink.svg)]()

<br/>

> *"Upstream of the crisis. Every time."*

<br/>

**Upstream Approach · Powered by Upstream Initiative · First Responder Edition**

[🚀 Live App](https://upstreampst.netlify.app) &nbsp;•&nbsp; [🐛 Report Bug](https://github.com/lwainright/upstreampstapp/issues) &nbsp;•&nbsp; [💡 Request Feature](https://github.com/lwainright/upstreampstapp/issues)

<br/>

</div>

---

## 🚨 Purpose

First responders face unique stressors that require fast, private, judgment-free support. **Upstream Approach** is built to provide immediate wellness tools, peer support access, AI-powered resources, and crisis lines — right from the field.

### Core Privacy Principle

> **No GPS. No location tracking. Anonymous, aggregated data only. No admin visibility into personal data.**
>
> Upstream collects anonymous, aggregated wellness data only. All personal activity stays on the device. Anonymous by design.

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
- 🤖 **AI Peer Support Chat** — Confidential, peer-style AI support via Claude
- 👥 **Human PST** — Connect directly with your peer support team
- 📞 **Crisis Resources** — National and local, always available offline
- 🔍 **AI Resource Finder** — Natural language resource search powered by Tavily + Claude

### Resource System
- **Vetted database first** — 284+ embedded first responder resources
- **Live web search** — Tavily-powered real-time resource discovery
- **Auto-save** — AI-found resources saved to Appwrite for admin review
- **Admin review queue** — Approve or reject AI-found resources before they go live
- **Scope filtering** — Local, Regional, State, or National results

### Platform Features
- 📱 **Progressive Web App** — Install on any device, no app store needed
- ✈️ **Offline Mode** — Core tools work without internet
- 🏢 **Agency Customization** — Custom branding via Appwrite
- 🔐 **Staff Login** — PST, supervisors, admins via Appwrite Auth
- 📊 **Admin Dashboard** — Agency wellness metrics and analytics
- 🤖 **AI Business Assistant** — Clients, invoices, writing, and platform analytics

---

## 📦 Tech Stack

```
Frontend    React + Vite + vite-plugin-pwa
Backend     Appwrite (Auth, Database, Storage)
Deploy      Netlify (CI/CD from GitHub)
AI          Claude (Anthropic) via Netlify Functions
Search      Tavily Search API
```

---

## 🔒 Privacy & Security

### What We Never Collect
- ❌ No GPS or device location — ever
- ❌ No location tracking of any kind
- ❌ No user accounts for regular users
- ❌ No email addresses (regular users)
- ❌ No conversation logs accessible to supervisors
- ✅ Anonymous, aggregated wellness data only — no individual data is identified

### Notifications
Notifications are used exclusively for Human PST responses and buddy check alerts. They are never used for location tracking, activity monitoring, or any purpose outside of peer support communication.

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
Supervisors and admins see **zero** individual data. Analytics are agency-level only — no names, no conversations, no personal information.

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
TAVILY_API_KEY=your_key
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
├── App.jsx                   # Main routing and auth
├── appwrite.js               # Appwrite client config
├── auth.js                   # Auth functions
├── analytics.js              # Anonymous usage tracking
├── fetchResources.js         # Resource fetching
├── utils.js                  # Hooks and helpers
├── icons.jsx                 # SVG icon components
│
├── components/
│   ├── ui.jsx                # Shared UI components
│   └── LoginScreen.jsx       # Staff login
│
├── hooks/
│   └── useAuth.js            # Auth state hook
│
└── screens/
    ├── HomeScreen.jsx
    ├── AIChatScreen.jsx       # AI peer support
    ├── HumanPSTScreen.jsx     # Human PST connection
    ├── ResourcesScreen.jsx    # AI resource finder + crisis
    ├── AdminToolsScreen.jsx   # Agency admin dashboard
    ├── AdminAIScreen.jsx      # AI business assistant
    ├── PlatformInlineContent.jsx
    └── [20 more screens]

netlify/functions/
├── chat.js                   # Claude peer support + admin AI
└── search.js                 # Tavily + Claude resource finder
```

---

## ⚙️ Appwrite Collections

```
agencies              — Agency registry
user_permissions      — Staff roles and access
resources             — 284+ vetted first responder resources
platform_settings     — Logo URLs and platform config
checkins              — Anonymous wellness check-ins
tool_usage            — Feature usage tracking
ai_sessions           — AI chat session counts
pst_contacts          — PST contact requests
pst_roster            — PST member availability
admin_clients         — Business client management
admin_invoices        — Invoice tracking and management
password_reset_requests
platform_audit_log
journals
```

---

## 🏢 Multi-Tenant Architecture

```
QR Code → Agency Code → Appwrite lookup
→ Agency branding (logo, name)
→ Agency PST roster
→ Agency-specific resources
→ Splash screen: "Powered by [Agency Name]"
```

No app update needed to add agencies. All managed through the Platform Dashboard.

---

## 🤖 Three AI System Architecture

```
1. AI Peer Support (AIChatScreen)
   — Emotional support, grounding, peer-style conversation
   — Claude Haiku via chat.js Netlify function

2. AI Resource Finder (ResourcesScreen)
   — Natural language resource search
   — Tavily live web search + Claude Haiku formatting
   — Auto-saves new resources to Appwrite for admin review
   — Emotional redirect → AI Chat | Crisis redirect → Crisis tab

3. AI Business Assistant (AdminAIScreen)
   — Platform owner only
   — Clients, invoices, revenue tracking, writing assistant
   — Live stats: vetted resources, revenue, outstanding invoices
   — Claude via chat.js Netlify function
```

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

Regular users — no login needed. Enter agency code and use the app.

```
platform    Full cross-agency access + business tools
admin       Agency-level management + resource review
supervisor  Wellness dashboard
pst         PST queue and contact management
```

---

## 📄 License

Apache License 2.0 — see [LICENSE](LICENSE) for details.

---

## 💙 Built for First Responders, By First Responders

Upstream Approach is designed by a paramedic with nearly 30 years in EMS who understands the unique challenges of the job.

**Upstream of the crisis. Every time.**

---

<div align="center">

**© 2026 Upstream Initiative LLC**

[Live App](https://upstreampst.netlify.app) • [GitHub](https://github.com/lwainright/upstreampstapp)

</div>
