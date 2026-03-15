export const loadDemoData = async () => {
  const pst = await fetch("demo/pst.json").then(r => r.json());
  const cit = await fetch("demo/cit.json").then(r => r.json());
  const resources = await fetch("demo/resources.json").then(r => r.json());

  return { pst, cit, resources };
};

