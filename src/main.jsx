import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("App error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          background: "#060e1b",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'DM Sans', sans-serif",
          padding: "24px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#dde8f4", marginBottom: 8 }}>
            Something went wrong
          </div>
          <div style={{ fontSize: 13, color: "#3d5268", marginBottom: 24 }}>
            Tap below to reload the app
          </div>
          <div
            onClick={() => window.location.reload()}
            style={{
              padding: "14px 28px",
              borderRadius: 12,
              background: "rgba(56,189,248,0.12)",
              border: "1.5px solid rgba(56,189,248,0.3)",
              fontSize: 14,
              fontWeight: 700,
              color: "#38bdf8",
              cursor: "pointer",
            }}
          >
            Reload App
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
