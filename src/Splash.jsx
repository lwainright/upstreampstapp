import { useState, useEffect } from "react";

export default function Splash({ onFinish }) {
  const [visible, setVisible] = useState(true);
  const [ripple, setRipple] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [message, setMessage] = useState("");

  // Time‑aware greeting logic
  useEffect(() => {
    const hour = new Date().getHours();

    if (hour < 12) {
      setGreeting("Good Morning");
      setMessage("Hope you're having a relaxing morning.");
    } else if (hour < 17) {
      setGreeting("Good Afternoon");
      setMessage("Hope you're having a relaxing day.");
    } else if (hour < 22) {
      setGreeting("Good Evening");
      setMessage("Hope you're having a relaxing evening.");
    } else {
      setGreeting("Good Night");
      setMessage("Hope you're having a relaxing night.");
    }
  }, []);

  // Tap → ripple → fade out → continue
  const handleContinue = () => {
    setRipple(true);
    setVisible(false);

    setTimeout(() => {
      onFinish();
    }, 3000); // matches fade-out duration
  };

  return (
    <div
      onClick={handleContinue}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        padding: "32px",
        textAlign: "center",
        color: "#ffffff",
        background: "linear-gradient(180deg, #0ea5e9, #0369a1)",
        fontFamily: "Inter, system-ui, sans-serif",
        cursor: "pointer",
        opacity: visible ? 1 : 0,
        transition: "opacity 3s ease"
      }}
    >
      {/* Ripple effect */}
      {ripple && (
        <span
          style={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.25)",
            animation: "ripple 0.8s ease-out",
            pointerEvents: "none"
          }}
        />
      )}

      {/* Logo + breathing glow wrapper */}
      <div
        style={{
          position: "relative",
          width: "70%",
          maxWidth: 260,
          marginBottom: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.35)",
            filter: "blur(28px)",
            animation: "breatheGlow 6s ease-in-out infinite"
          }}
        />

        {/* Logo */}
        <img
          src="/icons/upstream-full-logo.png"
          alt="Upstream Approach"
          style={{
            width: "100%",
            height: "auto",
            objectFit: "contain",
            filter: "drop-shadow(0 0 24px rgba(0,0,0,0.25))",
            animation: "breathe 6s ease-in-out infinite"
          }}
        />
      </div>

      {/* Greeting */}
      <h1 style={{ fontSize: "1.9rem", marginBottom: 6, fontWeight: 600 }}>
        {greeting}
      </h1>

      {/* Message */}
      <p style={{ fontSize: "1.15rem", marginBottom: 28, opacity: 0.95 }}>
        {message}
      </p>

      {/* Footer line */}
      <p style={{ fontSize: "0.9rem", opacity: 0.85, marginBottom: 6 }}>
        Free. Confidential. You earned the right to ask for help.
      </p>

      {/* Tap prompt */}
      <p style={{ fontSize: "1rem", fontWeight: 600, marginTop: 14 }}>
        TAP TO CONTINUE
      </p>
    </div>
  );
}

