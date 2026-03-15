export const loadDemoData = async () => {
  try {
    const pst = await fetch("demo/pst.json").then(r => r.json());
    const cit = await fetch("demo/cit.json").then(r => r.json());
    const resources = await fetch("demo/resources.json").then(r => r.json());

    return { pst, cit, resources };
  } catch (err) {
    console.error("Error loading demo data:", err);
    return { pst: [], cit: null, resources: [] };
  }
};

