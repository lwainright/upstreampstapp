import { loadDemoData } from "../utils/demo.js";

export const useDemoMode = async (agencyCode, setRole, setAgencyData) => {
  if (agencyCode === "UPSTREAM") {
    setRole("demo");

    try {
      const data = await loadDemoData();

      // Enable demo-specific features
      const demoConfig = {
        ...data,
        features: {
          typingIndicator: true,
          groundingBar: true,
          demoMode: true
        }
      };

      setAgencyData(demoConfig);
    } catch (err) {
      console.error("Demo mode failed to load:", err);

      setAgencyData({
        pst: [],
        cit: null,
        resources: [],
        features: {
          typingIndicator: true,
          groundingBar: true,
          demoMode: true
        }
      });
    }
  }
};

