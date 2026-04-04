// ============================================================
// UTILS & HOOKS — Upstream Initiative
// Layout hooks, contract helpers, text detection
// ============================================================
import { useState, useEffect } from 'react';

export function useLayout() {
  const [layout, setLayout] = useState(() => getLayout());

  function getLayout() {
    const w = window.innerWidth;
    if (w >= 1024) return "desktop";
    if (w >= 768) return "tablet";
    return "mobile";
  }

  useEffect(() => {
    const handleResize = () => setLayout(getLayout());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return layout;
}

// Left blank since the file was cut off. Add a valid image path or base64 string here later if needed.
export const SPLASH_SRC = "";
