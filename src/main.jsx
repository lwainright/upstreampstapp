// EMERGENCY DEMO BYPASS — PUTS ALL CRASHING VARIABLES IN THE GLOBAL SCOPE
window.isOpsRole = true;
window.AGENCY_CODES = { "DEMO123": "Upstream Demo Agency" };
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
