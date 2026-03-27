import React, { useState, useEffect } from 'react';

// ================= CONFIG =================
const AW_ENDPOINT = 'https://nyc.cloud.appwrite.io/v1';
const AW_PROJECT = 'upstreamapproach';
const AW_DB = 'upstream_db';

const LOGO_SRC = "data:image/png;base64,..."; // keep your existing base64 here

// ================= ANALYTICS =================
const awTrack = async (collection, data) => {
  try {
    const id = `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    const res = await fetch(
      `${AW_ENDPOINT}/databases/${AW_DB}/collections/${collection}/documents`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': AW_PROJECT,
        },
        body: JSON.stringify({
          documentId: id,
          data: { ...data, timestamp: new Date().toISOString() },
        }),
      }
    );

    if (!res.ok) {
      console.warn('Analytics failed:', collection);
    }
  } catch (e) {
    console.warn('Analytics error:', e);
  }
};

// ================= HELPERS =================
const trackCheckin = (agencyCode, status, shiftPhase) => {
  const now = new Date();
  awTrack('checkins', {
    agencyCode: agencyCode || 'NONE',
    status,
    shiftPhase: shiftPhase || '',
    dayOfWeek: now.getDay(),
    hour: now.getHours(),
  });
};

// ================= COMPONENTS =================

const SplashScreen = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => onFinish(), 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div style={styles.centered}>
      <img src={LOGO_SRC} alt="Upstream Logo" style={styles.logo} />
      <h1>Upstream PST</h1>
    </div>
  );
};

const Dashboard = () => {
  const [status, setStatus] = useState(null);

  const handleCheckin = (level) => {
    setStatus(level);
    trackCheckin('NONE', level);
  };

  return (
    <div style={styles.container}>
      <h2>Daily Check-In</h2>

      <div style={styles.buttonRow}>
        <button onClick={() => handleCheckin('great')}>Great</button>
        <button onClick={() => handleCheckin('striving')}>Striving</button>
        <button onClick={() => handleCheckin('notwell')}>Not Well</button>
        <button onClick={() => handleCheckin('ill')}>Ill</button>
      </div>

      {status && <p>Status Logged: {status}</p>}
    </div>
  );
};

// ================= MAIN APP =================

export default function App() {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');

  return loading ? (
    <SplashScreen onFinish={() => setLoading(false)} />
  ) : (
    <div>
      <Nav setView={setView} />
      {view === 'dashboard' && <Dashboard />}
      {view === 'ai' && <AIChat />}
      {view === 'peer' && <PeerSupport />}
      {view === 'resources' && <Resources />}
      {view === 'analytics' && <Analytics />}
    </div>
  );
}

// ================= NAV =================
const Nav = ({ setView }) => (
  <div style={styles.buttonRow}>
    <button onClick={() => setView('dashboard')}>Home</button>
    <button onClick={() => setView('ai')}>AI Chat</button>
    <button onClick={() => setView('peer')}>Peer Support</button>
    <button onClick={() => setView('resources')}>Resources</button>
    <button onClick={() => setView('analytics')}>Analytics</button>
  </div>
);

// ================= AI CHAT =================
const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (!input) return;
    setMessages([...messages, { role: 'user', text: input }]);
    setInput('');

    setTimeout(() => {
      setMessages(m => [...m, { role: 'ai', text: 'AI response placeholder' }]);
    }, 500);
  };

  return (
    <div style={styles.container}>
      <h2>AI Peer Support</h2>
      <div>
        {messages.map((m, i) => (
          <div key={i}><b>{m.role}:</b> {m.text}</div>
        ))}
      </div>
      <input value={input} onChange={e => setInput(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

// ================= PEER SUPPORT =================
const PeerSupport = () => (
  <div style={styles.container}>
    <h2>Peer Support</h2>
    <p>Connect with a PST or trigger buddy check.</p>
  </div>
);

// ================= RESOURCES =================
const Resources = () => (
  <div style={styles.container}>
    <h2>Resources</h2>
    <p>State / Regional / National resources go here.</p>
  </div>
);

// ================= ANALYTICS =================
const Analytics = () => (
  <div style={styles.container}>
    <h2>Analytics</h2>
    <p>Agency stats + trends.</p>
  </div>
); />
  ) : (
    <Dashboard />
  );
}

// ================= STYLES =================

const styles = {
  centered: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
  },
  logo: {
    width: 150,
    marginBottom: 20,
  },
  container: {
    padding: 20,
    textAlign: 'center',
  },
  buttonRow: {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
  },
};
