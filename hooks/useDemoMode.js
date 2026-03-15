import { loadDemoData } from "../utils/demo.js";

export const useDemoMode = async (agencyCode, setRole, setAgencyData) => {
  if (agencyCode === "UPSTREAM") {
    setRole("demo");

    try {
      const data = await loadDemoData();
      setAgencyData(data);
    } catch (err) {
      console.error("Demo mode failed to load:", err);
      setAgencyData({ pst: [], cit: null, resources: [] });
    }
  }
};

