import React from "react"
import ReactDOM from "react-dom/client"
import { registerSW } from 'virtual:pwa-register'
import App from "./App.jsx"

registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    setInterval(() => {
      reg.update();
    }, 60 * 1000);
  },
  onNeedRefresh() {
    window.location.reload();
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
<React.StrictMode>
<App />
</React.StrictMode>
)
