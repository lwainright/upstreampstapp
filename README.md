# Upstream - First Responder Wellness App

<div align="center">

![Upstream Logo](icons/icon-512.png)

**Confidential, stigma-free wellness support for first responders**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-Ready-brightgreen.svg)]()
[![Offline](https://img.shields.io/badge/Offline-Supported-orange.svg)]()

[Live Demo](https://your-username.github.io/upstream-pwa) • [Report Bug](https://github.com/your-username/upstream-pwa/issues) • [Request Feature](https://github.com/your-username/upstream-pwa/issues)

</div>

---

## 🚨 Purpose

First responders face unique stressors that require fast, private, judgment-free support. **Upstream** is built to provide:

- ✅ **Anonymous wellness tools** - No accounts, no tracking
- ✅ **Grounding and breathing exercises** - Instant stress relief
- ✅ **Peer Support Team (PST) contact** - Connect with trained peers
- ✅ **Crisis Intervention Team (CIT) pathways** - Specialized support
- ✅ **Optional AI support** - Talk through tough calls confidentially
- ✅ **Comprehensive resources** - EMS, Fire, Law Enforcement, Dispatch, Corrections, Veterans
- ✅ **100% Private** - All data stays on device only

### Core Principles

> **No accounts. No analytics. No tracking. No admin visibility.**
> 
> All activity stays on the device. Anonymous by design.

---

## 🧭 Features

### Wellness Tools
- 🫁 **Box Breathing** - 4-4-4-4 tactical breathing
- 🌬️ **4-7-8 Breathing** - Calming breath pattern
- 🔄 **Shift Reset** - Quick mental reset between calls
- 👁️ **5-4-3-2-1 Grounding** - Sensory awareness exercise

### Support Access
- 👥 **Peer Support Directory** - Agency-specific PST roster
- 🛡️ **CIT Pathways** - Crisis intervention resources
- 🤖 **AI Support** (Optional) - Anonymous AI conversations
- 📞 **Crisis Resources** - National and local hotlines

### App Features
- 📱 **Progressive Web App** - Install on any device
- ✈️ **Offline Mode** - Works without internet
- 🌓 **Light/Dark Mode** - Optimized for all lighting
- 🏢 **Agency Customization** - Custom branding and resources
- 🎭 **Demo Mode** - For agency evaluation

---

## 📦 Tech Stack

**Simple. Static. Reliable.**

- ✅ **HTML/CSS/JavaScript** - No frameworks
- ✅ **PWA** - Service worker for offline support
- ✅ **GitHub Pages Ready** - Deploy in minutes
- ✅ **No Backend** - All client-side
- ✅ **No Build Tools** - Direct deployment

### Why Static?

- 🚀 **Fast** - No server processing
- 🔒 **Secure** - No database to breach
- 💰 **Free** - Host on GitHub Pages
- 📴 **Offline** - Works without internet
- 🔧 **Simple** - Easy to maintain

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/upstream-pwa.git
cd upstream-pwa
```

### 2. Test Locally

```bash
# Option 1: Python
python -m http.server 8000

# Option 2: Node.js
npx serve

# Option 3: VS Code Live Server
# Install Live Server extension and click "Go Live"
```

Open http://localhost:8000 in your browser.

### 3. Deploy to GitHub Pages

```bash
# Push to GitHub
git add .
git commit -m "Initial deployment"
git push origin main

# Enable GitHub Pages
# Go to: Settings → Pages → Source → main branch → Save
```

Your app will be live at: `https://your-username.github.io/upstream-pwa`

---

## 📁 Project Structure

```
upstream-pwa/
├── index.html              # Home screen
├── ai.html                 # AI support interface
├── humanpst.html           # Peer support directory
├── resources.html          # Resource list
├── settings.html           # App settings
├── tools.html              # Wellness tools menu
├── app.js                  # Main application logic
├── style.css               # Global styles
├── manifest.json           # PWA manifest
├── service-worker.js       # Offline support
├── LICENSE                 # Apache 2.0 license
├── README.md               # This file
│
├── config/                 # Configuration files
│   ├── systemPrompt.js     # AI prompt (CIT-informed)
│   ├── agencyConfig.js     # Agency customization
│   └── ...
│
├── data/                   # Static data
│   ├── citModules.js       # CIT communication techniques
│   ├── pstTemplate.js      # PST member structure
│   └── ...
│
├── demo/                   # Demo mode data
│   ├── pst.json            # Demo PST roster
│   ├── cit.json            # Demo CIT team
│   ├── resources.json      # Demo resources
│   └── ...
│
├── hooks/                  # Custom React-style hooks
│   └── useDemoMode.js      # Demo initialization
│
├── icons/                  # PWA icons
│   ├── icon-192.png        # Standard icon
│   ├── icon-512.png        # Standard icon
│   ├── maskable-192.png    # Android maskable
│   ├── maskable-512.png    # Android maskable
│   └── upstream-full-logo.png  # Company logo
│
├── tools/                  # Individual tool HTML files
│   ├── box-breathing.html
│   ├── 4-7-8-breathing.html
│   ├── 5-4-3-2-1-grounding.html
│   └── shift-reset.html
│
└── utils/                  # Utility functions
    └── demo.js             # Demo data loader
```

---

## ⚙️ Configuration

### Agency Customization

Edit `config/agencyConfig.js` to customize for your agency:

```javascript
export const DEFAULT_AGENCY_CONFIG = {
  branding: {
    logoUrl: "/icons/your-logo.png",
    primaryColor: "#38bdf8",
    agencyName: "Your Fire Department",
  },
  pstRoster: [
    {
      name: "John Smith",
      role: "Paramedic",
      phone: "555-0100",
      specialties: ["Trauma", "Burnout"]
    }
  ],
  resources: [
    // Your local resources
  ],
  accessCodes: ["YOUR-CODE"]
};
```

### Demo Mode

Access demo mode by entering code: **`UPSTREAM`**

Demo mode includes:
- Sample PST roster
- Example CIT team
- Pre-loaded resources
- All features enabled

---

## 🔒 Privacy & Security

### What We Don't Collect

- ❌ No user accounts
- ❌ No email addresses
- ❌ No phone numbers
- ❌ No IP addresses
- ❌ No device IDs
- ❌ No location data
- ❌ No usage analytics
- ❌ No conversation logs

### What Stays on Device

- ✅ AI chat history (localStorage)
- ✅ Tool usage preferences
- ✅ Language settings
- ✅ Theme preferences

### Data You Can Export

- Journal entries
- Breathing exercise logs
- (User-initiated only)

**Admin/Supervisors have ZERO access to:**
- User conversations
- AI chat logs
- Individual tool usage
- Personal data of any kind

---

## 📱 Installation

### iPhone (iOS)

1. Open in Safari
2. Tap the **Share** button (box with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **Add**

### Android

1. Open in Chrome
2. Tap the **Menu** (⋮)
3. Tap **"Install app"** or **"Add to Home screen"**

### Desktop

1. Open in Chrome or Edge
2. Click the **Install** icon in the address bar
3. Click **Install**

---

## 🤝 Contributing

We welcome contributions from first responders, mental health professionals, and developers!

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/new-tool`)
3. **Commit your changes** (`git commit -m 'Add new wellness tool'`)
4. **Push to the branch** (`git push origin feature/new-tool`)
5. **Open a Pull Request**

### Contribution Guidelines

- **Respect privacy** - No tracking or analytics
- **Keep it simple** - Static files only
- **Test offline** - Ensure offline functionality
- **Follow CIT principles** - Non-clinical, peer-like support
- **Document changes** - Update README if needed

### Areas We Need Help

- 🌐 **Translations** - Spanish, other languages
- 🎨 **Design** - UI/UX improvements
- 🧠 **Mental Health Expertise** - CIT validation
- 🚒 **First Responder Feedback** - Real-world testing
- 📚 **Resources** - State-specific support services

---

## 📋 Roadmap

### Current Version (v1.0)
- ✅ Core wellness tools
- ✅ PST directory
- ✅ Resource lists
- ✅ PWA support
- ✅ Offline mode

### Planned Features (v1.1)
- [ ] Voice-guided breathing exercises
- [ ] Journal with export
- [ ] Additional grounding techniques
- [ ] Spanish language support
- [ ] Enhanced CIT modules

### Future Considerations (v2.0)
- [ ] Optional backend for PST chat
- [ ] Multi-agency support
- [ ] Anonymous wellness check-ins
- [ ] Aggregate (anonymous) usage metrics

---

## 🐛 Known Issues

- Service worker may need manual update on some browsers
- PWA install prompt varies by browser/OS
- Voice features require HTTPS

See [Issues](https://github.com/your-username/upstream-pwa/issues) for full list.

---

## 📞 Support

### For Agencies

Interested in deploying Upstream for your department?

- 📧 Email: contact@upstreampst.com
- 🌐 Website: https://upstreampst.com
- 📱 Demo: https://demo.upstreampst.com

### For Users

- 🔴 **Crisis:** Call 988 or text HOME to 741741
- 🚒 **First Responders:** Safe Call Now: 1-206-459-3020
- 💬 **App Issues:** [Open an issue](https://github.com/your-username/upstream-pwa/issues)

---

## 📄 License

This project is licensed under the **Apache License 2.0** - see the [LICENSE](LICENSE) file for details.

### What This Means

- ✅ You can use this for free
- ✅ You can modify it
- ✅ You can use it commercially
- ✅ You must include the license
- ✅ You must state changes made

---

## 🙏 Acknowledgments

- **First responders** who provided feedback and testing
- **CIT trainers** who validated communication approach
- **Peer support specialists** who reviewed content
- **Mental health professionals** who guided ethical approach

---

## 💙 Built for First Responders, By First Responders

Upstream is designed with input from active and retired first responders who understand the unique challenges of the job.

**Stay safe. Stay well. You're not alone.**

---

<div align="center">

**© 2026 Upstream Applications, LLC**

[Website](https://upstreampst.com) • [Documentation](https://docs.upstreampst.com) • [GitHub](https://github.com/your-username/upstream-pwa)

</div>
