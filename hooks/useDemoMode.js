import { loadDemoData } from "../utils/demo.js";

export const useDemoMode = async (agencyCode, setRole, setAgencyData) => {
  if (agencyCode === "UPSTREAM") {
    setRole("demo");
    const data = await loadDemoData();
    setAgencyData(data);
  }
};

