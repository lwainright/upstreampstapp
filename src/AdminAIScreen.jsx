// ============================================================
// SCREEN: AdminAIScreen
// Upstream Initiative — AI Assistant for Platform Owner
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { ScreenSingle, Card, SLabel, Btn } from './ui.jsx';
import { databases } from './appwrite.js';
import { Query, ID } from 'appwrite';

const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE || '69c88588001ed071c19e';
const PLATFORM_SETTINGS_COLLECTION = '69e15866002709cf67ad';
const PLATFORM_SETTINGS_DOC = '69e15842000b42f06c0c';

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

// ── Helpers ──────────────────────────────────────────────────
const callClaude = async (systemPrompt, userMessage, useWebSearch = false) => {
  const body = {
    model: MODEL,
    max_tokens: 1000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  };
  if (useWebSearch) {
    body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  }
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return data.content?.find(b => b.type === "text")?.text || "";
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

const today = () => new Date().toISOString().slice(0, 10);

// ── Input style ───────────────────────────────────────────────
const inputStyle = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8, padding: "10px 12px",
  color: "#dde8f4", fontSize: 13,
  fontFamily: "'DM Sans',sans-serif",
  outline: "none", width: "100%",
};

export default function AdminAIScreen({ navigate, logoSrc }) {
  const [tab, setTab] = useState("assistant");
  const [statusMsg, setStatusMsg] = useState("");

  // ── Assistant state ───────────────────────────────────────
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // ── Clients state ─────────────────────────────────────────
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [clientForm, setClientForm] = useState({ clientName:"", contactEmail:"", phone:"", organization:"", type:"Agency", rate:"", notes:"", active:true });

  // ── Invoices state ────────────────────────────────────────
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({ clientName:"", clientEmail:"", amount:"", description:"", lineItems:"", dueDate:"", notes:"", status:"Draft" });
  const [invoiceFilter, setInvoiceFilter] = useState("all");
  const [invoiceLogoUrl, setInvoiceLogoUrl] = useState("");

  // ── Writing state ─────────────────────────────────────────
  const [writingInput, setWritingInput] = useState("");
  const [writingTone, setWritingTone] = useState("professional");
  const [writingOutput, setWritingOutput] = useState("");
  const [writingLoading, setWritingLoading] = useState(false);

  useEffect(() => {
    if (tab === "clients") loadClients();
    if (tab === "invoices") { loadInvoices(); loadInvoiceLogo(); }
  }, [tab]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // ── Load data ─────────────────────────────────────────────
  const loadClients = async () => {
    setClientsLoading(true);
    try {
      const res = await databases.listDocuments(DB_ID, 'admin_clients', [Query.limit(100), Query.orderDesc('$createdAt')]);
      setClients(res.documents || []);
    } catch(e) { setStatusMsg("Could not load clients."); }
    setClientsLoading(false);
  };

  const loadInvoices = async () => {
    setInvoicesLoading(true);
    try {
      const res = await databases.listDocuments(DB_ID, 'admin_invoices', [Query.limit(200), Query.orderDesc('$createdAt')]);
      setInvoices(res.documents || []);
    } catch(e) { setStatusMsg("Could not load invoices."); }
    setInvoicesLoading(false);
  };

  const loadInvoiceLogo = async () => {
    try {
      const doc = await databases.getDocument(DB_ID, PLATFORM_SETTINGS_COLLECTION, PLATFORM_SETTINGS_DOC);
      if (doc.invoiceLogoUrl) setInvoiceLogoUrl(doc.invoiceLogoUrl);
    } catch(e) {}
  };

  // ── Assistant ─────────────────────────────────────────────
  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatLoading(true);

    const newHistory = [...chatHistory, { role: "user", content: userMsg }];
    setChatHistory(newHistory);

    try {
      // Gather context from Appwrite
      let context = "";
      try {
        const [clientRes, invoiceRes, resourceRes] = await Promise.all([
          databases.listDocuments(DB_ID, 'admin_clients', [Query.limit(100)]),
          databases.listDocuments(DB_ID, 'admin_invoices', [Query.limit(200)]),
          databases.listDocuments(DB_ID, 'Resources', [Query.limit(1)]).catch(() => ({ total: 0 })),
        ]);

        const totalClients = clientRes.total || 0;
        const totalInvoices = invoiceRes.documents?.length || 0;
        const unpaidInvoices = invoiceRes.documents?.filter(i => i.status === "Draft" || i.status === "Sent") || [];
        const paidInvoices = invoiceRes.documents?.filter(i => i.status === "Paid") || [];
        const totalRevenue = paidInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);
        const outstanding = unpaidInvoices.reduce((sum, i) => sum + (i.amount || 0), 0);

        context = `
Current business data:
- Total clients: ${totalClients}
- Total invoices: ${totalInvoices}
- Paid invoices: ${paidInvoices.length} (${formatCurrency(totalRevenue)} total revenue)
- Outstanding invoices: ${unpaidInvoices.length} (${formatCurrency(outstanding)} outstanding)
- Vetted resources in database: ${resourceRes.total || 0}
- Today's date: ${today()}

Client list: ${clientRes.documents?.map(c => `${c.clientName} (${c.organization || 'No org'})`).join(', ') || 'None'}
Recent invoices: ${invoiceRes.documents?.slice(0, 5).map(i => `${i.clientName} $${i.amount} - ${i.status}`).join(', ') || 'None'}
        `;
      } catch(e) {}

      const systemPrompt = `You are the AI Assistant for Upstream Initiative — a first responder wellness platform business. You help the platform owner run their business operations.

${context}

Your capabilities:
- Answer questions about clients, invoices, revenue, and business performance
- Help draft professional emails and communications
- Provide business advice and suggestions
- Help with scheduling and reminders
- Analyze business data and provide insights
- Help rewrite text to sound business-savvy and professional

You do NOT:
- Provide emotional support (that's the peer support AI)
- Find resources for responders (that's the resource finder AI)
- Make up data — only use what's provided above

Keep responses concise, professional, and actionable. When giving financial info, use dollar amounts. Today is ${today()}.`;

      const messages = newHistory.map(m => ({ role: m.role, content: m.content }));
      
      const res = await fetch(ANTHROPIC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1000,
          system: systemPrompt,
          messages,
        }),
      });
      const data = await res.json();
      const reply = data.content?.find(b => b.type === "text")?.text || "I couldn't process that. Please try again.";

      setChatHistory(prev => [...prev, { role: "assistant", content: reply }]);
    } catch(e) {
      setChatHistory(prev => [...prev, { role: "assistant", content: "Connection error. Please check your internet and try again." }]);
    }
    setChatLoading(false);
  };

  // ── Clients ───────────────────────────────────────────────
  const saveClient = async () => {
    if (!clientForm.clientName.trim()) { setStatusMsg("Client name is required."); return; }
    try {
      await databases.createDocument(DB_ID, 'admin_clients', ID.unique(), {
        ...clientForm,
        rate: clientForm.rate ? parseFloat(clientForm.rate) : null,
        active: true,
      });
      setStatusMsg("Client saved ✓");
      setShowClientForm(false);
      setClientForm({ clientName:"", contactEmail:"", phone:"", organization:"", type:"Agency", rate:"", notes:"", active:true });
      loadClients();
    } catch(e) { setStatusMsg("Save failed: " + e.message); }
  };

  const toggleClientActive = async (id, current) => {
    try {
      await databases.updateDocument(DB_ID, 'admin_clients', id, { active: !current });
      loadClients();
    } catch(e) {}
  };

  // ── Invoices ──────────────────────────────────────────────
  const generateInvoiceNumber = () => {
    const d = new Date();
    return `INV-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`;
  };

  const saveInvoice = async () => {
    if (!invoiceForm.clientName.trim() || !invoiceForm.amount) { setStatusMsg("Client name and amount are required."); return; }
    try {
      await databases.createDocument(DB_ID, 'admin_invoices', ID.unique(), {
        ...invoiceForm,
        amount: parseFloat(invoiceForm.amount),
        invoiceNumber: generateInvoiceNumber(),
        status: "Draft",
      });
      setStatusMsg("Invoice created ✓");
      setShowInvoiceForm(false);
      setInvoiceForm({ clientName:"", clientEmail:"", amount:"", description:"", lineItems:"", dueDate:"", notes:"", status:"Draft" });
      loadInvoices();
    } catch(e) { setStatusMsg("Save failed: " + e.message); }
  };

  const updateInvoiceStatus = async (id, status) => {
    try {
      const update = { status };
      if (status === "Paid") update.paidDate = today();
      await databases.updateDocument(DB_ID, 'admin_invoices', id, update);
      setStatusMsg(`Invoice marked as ${status} ✓`);
      loadInvoices();
    } catch(e) { setStatusMsg("Update failed: " + e.message); }
  };

  const filteredInvoices = invoices.filter(i => {
    if (invoiceFilter === "all") return true;
    return (i.status || "Draft").toLowerCase() === invoiceFilter;
  });

  const totalRevenue = invoices.filter(i => i.status === "Paid").reduce((s, i) => s + (i.amount || 0), 0);
  const totalOutstanding = invoices.filter(i => i.status !== "Paid").reduce((s, i) => s + (i.amount || 0), 0);

  // ── Writing ───────────────────────────────────────────────
  const handleRewrite = async () => {
    if (!writingInput.trim()) return;
    setWritingLoading(true);
    setWritingOutput("");
    try {
      const toneMap = {
        professional: "formal, professional, polished — suitable for business correspondence",
        friendly: "warm, approachable, and friendly while remaining professional",
        direct: "clear, concise, and direct — no fluff, gets to the point",
        confident: "confident, authoritative, and assertive",
        formal: "highly formal — suitable for contracts, legal, or executive communication",
      };
      const systemPrompt = `You are a professional business writing assistant for Upstream Initiative. 
Rewrite the provided text to sound ${toneMap[writingTone]}.
Rules:
- Sound like a human professional, NOT like AI
- No buzzwords like "synergy", "leverage", "cutting-edge"
- Fix grammar, spelling, and punctuation
- Keep the core message intact
- Return ONLY the rewritten text, nothing else`;

      const result = await callClaude(systemPrompt, writingInput);
      setWritingOutput(result);
    } catch(e) {
      setWritingOutput("Rewrite failed. Please check your connection.");
    }
    setWritingLoading(false);
  };

  const tabs = [
    { key: "assistant", label: "🤖 Assistant" },
    { key: "clients",   label: "👥 Clients"   },
    { key: "invoices",  label: "📄 Invoices"  },
    { key: "writing",   label: "✍️ Writing"   },
  ];

  const statusColor = statusMsg.includes("failed") || statusMsg.includes("Failed") ? "#f87171" : "#22c55e";
  const statusBg = statusMsg.includes("failed") || statusMsg.includes("Failed") ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)";

  return (
    <ScreenSingle headerProps={{ onBack: () => navigate("home"), title: "AI Assistant", logoSrc }}>

      {/* Tab bar */}
      <div style={{ display:"flex", gap:5, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:14, padding:5, overflowX:"auto" }}>
        {tabs.map(t => (
          <div key={t.key} onClick={() => setTab(t.key)} style={{ flexShrink:0, minWidth:90, textAlign:"center", padding:"10px 12px", borderRadius:10, background:tab===t.key?"rgba(234,179,8,0.15)":"transparent", border:`1px solid ${tab===t.key?"rgba(234,179,8,0.3)":"transparent"}`, cursor:"pointer", fontSize:11, fontWeight:tab===t.key?800:600, color:tab===t.key?"#eab308":"#8099b0", whiteSpace:"nowrap" }}>
            {t.label}
          </div>
        ))}
      </div>

      {statusMsg && (
        <div style={{ background:statusBg, border:`1px solid ${statusColor}40`, borderRadius:10, padding:"10px 14px", fontSize:12, color:statusColor, display:"flex", justifyContent:"space-between" }}>
          {statusMsg}
          <span onClick={() => setStatusMsg("")} style={{ cursor:"pointer", color:"#64748b" }}>×</span>
        </div>
      )}

      {/* ── ASSISTANT ── */}
      {tab === "assistant" && (
        <div>
          <Card style={{ background:"rgba(234,179,8,0.05)", borderColor:"rgba(234,179,8,0.2)", marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#eab308", marginBottom:4 }}>Business AI Assistant</div>
            <div style={{ fontSize:12, color:"#64748b", lineHeight:1.6 }}>Ask me about your clients, invoices, revenue, or anything about running Upstream Initiative. I can also help draft emails and business communications.</div>
          </Card>

          {/* Suggested prompts */}
          {chatHistory.length === 0 && (
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:12 }}>
              {[
                "How much revenue have I made?",
                "Which invoices are outstanding?",
                "How many clients do I have?",
                "Summarize my business performance",
                "Draft a follow-up email for an unpaid invoice",
              ].map((p, i) => (
                <div key={i} onClick={() => setChatInput(p)} style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, padding:"10px 14px", cursor:"pointer", fontSize:12, color:"#8099b0" }}>
                  {p}
                </div>
              ))}
            </div>
          )}

          {/* Chat messages */}
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:12 }}>
            {chatHistory.map((m, i) => (
              <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
                <div style={{ maxWidth:"85%", background:m.role==="user"?"rgba(234,179,8,0.12)":"rgba(255,255,255,0.04)", border:`1px solid ${m.role==="user"?"rgba(234,179,8,0.25)":"rgba(255,255,255,0.08)"}`, borderRadius:14, padding:"12px 14px", fontSize:13, color:m.role==="user"?"#fde68a":"#dde8f4", lineHeight:1.6, whiteSpace:"pre-wrap" }}>
                  {m.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div style={{ display:"flex", justifyContent:"flex-start" }}>
                <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"12px 14px", fontSize:13, color:"#64748b" }}>Thinking...</div>
              </div>
            )}
            <div ref={chatEndRef}/>
          </div>

          {/* Input */}
          <div style={{ display:"flex", gap:8 }}>
            <textarea
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChat(); } }}
              placeholder="Ask me anything about your business..."
              rows={2}
              style={{ flex:1, background:"rgba(255,255,255,0.05)", border:"1.5px solid rgba(234,179,8,0.2)", borderRadius:12, padding:"12px 14px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"none", color:"#dde8f4", lineHeight:1.5 }}
            />
            <div onClick={chatLoading ? null : handleChat} style={{ padding:"12px 16px", borderRadius:12, cursor:chatLoading?"not-allowed":"pointer", background:chatLoading?"rgba(255,255,255,0.02)":"rgba(234,179,8,0.12)", border:`1.5px solid ${chatLoading?"rgba(255,255,255,0.06)":"rgba(234,179,8,0.3)"}`, fontSize:13, fontWeight:700, color:chatLoading?"#475569":"#eab308", display:"flex", alignItems:"center" }}>
              ↑
            </div>
          </div>
          {chatHistory.length > 0 && (
            <div onClick={() => setChatHistory([])} style={{ textAlign:"center", fontSize:11, color:"#334155", cursor:"pointer", marginTop:8 }}>Clear conversation</div>
          )}
        </div>
      )}

      {/* ── CLIENTS ── */}
      {tab === "clients" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#dde8f4" }}>{clients.length} Client{clients.length !== 1 ? "s" : ""}</div>
            <div onClick={() => setShowClientForm(!showClientForm)} style={{ padding:"8px 14px", borderRadius:10, cursor:"pointer", background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", fontSize:12, fontWeight:700, color:"#22c55e" }}>
              {showClientForm ? "Cancel" : "+ Add Client"}
            </div>
          </div>

          {showClientForm && (
            <Card style={{ marginBottom:12 }}>
              <SLabel color="#22c55e">New Client</SLabel>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <input value={clientForm.clientName} onChange={e => setClientForm(v => ({...v, clientName:e.target.value}))} placeholder="Client name *" style={inputStyle}/>
                <input value={clientForm.organization} onChange={e => setClientForm(v => ({...v, organization:e.target.value}))} placeholder="Organization" style={inputStyle}/>
                <input value={clientForm.contactEmail} onChange={e => setClientForm(v => ({...v, contactEmail:e.target.value}))} placeholder="Email" type="email" style={inputStyle}/>
                <input value={clientForm.phone} onChange={e => setClientForm(v => ({...v, phone:e.target.value}))} placeholder="Phone" type="tel" style={inputStyle}/>
                <input value={clientForm.rate} onChange={e => setClientForm(v => ({...v, rate:e.target.value}))} placeholder="Default rate ($/hr or flat)" type="number" style={inputStyle}/>
                <textarea value={clientForm.notes} onChange={e => setClientForm(v => ({...v, notes:e.target.value}))} placeholder="Notes" rows={2} style={{...inputStyle, resize:"none"}}/>
                <div onClick={saveClient} style={{ padding:"11px", borderRadius:10, cursor:"pointer", textAlign:"center", background:"rgba(34,197,94,0.12)", border:"1.5px solid rgba(34,197,94,0.3)", fontSize:13, fontWeight:700, color:"#22c55e" }}>Save Client</div>
              </div>
            </Card>
          )}

          {clientsLoading && <div style={{ textAlign:"center", padding:"20px", color:"#64748b" }}>Loading...</div>}
          {!clientsLoading && clients.length === 0 && <div style={{ textAlign:"center", padding:"30px", color:"#475569", fontSize:13 }}>No clients yet. Add your first one above.</div>}

          {clients.map(c => (
            <Card key={c.$id} style={{ marginBottom:10, opacity:c.active===false?0.5:1 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:800, color:"#dde8f4", marginBottom:3 }}>{c.clientName}</div>
                  {c.organization && <div style={{ fontSize:12, color:"#8099b0", marginBottom:2 }}>{c.organization}</div>}
                  {c.contactEmail && <div style={{ fontSize:12, color:"#64748b", marginBottom:2 }}>{c.contactEmail}</div>}
                  {c.phone && <div style={{ fontSize:12, color:"#64748b", marginBottom:2 }}>{c.phone}</div>}
                  {c.rate && <div style={{ fontSize:11, color:"#eab308", marginTop:4 }}>Rate: {formatCurrency(c.rate)}</div>}
                  {c.notes && <div style={{ fontSize:11, color:"#475569", marginTop:4, lineHeight:1.5 }}>{c.notes}</div>}
                </div>
                <div onClick={() => toggleClientActive(c.$id, c.active !== false)} style={{ fontSize:11, color:c.active!==false?"#f87171":"#22c55e", cursor:"pointer", padding:"4px 8px", borderRadius:6, background:c.active!==false?"rgba(239,68,68,0.08)":"rgba(34,197,94,0.08)", flexShrink:0 }}>
                  {c.active !== false ? "Deactivate" : "Reactivate"}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── INVOICES ── */}
      {tab === "invoices" && (
        <div>
          {/* Summary cards */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
            <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:14, padding:"14px" }}>
              <div style={{ fontSize:22, fontWeight:900, color:"#22c55e" }}>{formatCurrency(totalRevenue)}</div>
              <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>Total Revenue</div>
            </div>
            <div style={{ background:"rgba(234,179,8,0.08)", border:"1px solid rgba(234,179,8,0.2)", borderRadius:14, padding:"14px" }}>
              <div style={{ fontSize:22, fontWeight:900, color:"#eab308" }}>{formatCurrency(totalOutstanding)}</div>
              <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>Outstanding</div>
            </div>
          </div>

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ display:"flex", gap:6 }}>
              {["all","draft","sent","paid"].map(f => (
                <div key={f} onClick={() => setInvoiceFilter(f)} style={{ padding:"6px 12px", borderRadius:8, cursor:"pointer", fontSize:11, fontWeight:invoiceFilter===f?800:600, background:invoiceFilter===f?"rgba(56,189,248,0.15)":"rgba(255,255,255,0.03)", border:`1px solid ${invoiceFilter===f?"rgba(56,189,248,0.3)":"rgba(255,255,255,0.07)"}`, color:invoiceFilter===f?"#38bdf8":"#64748b", textTransform:"capitalize" }}>
                  {f}
                </div>
              ))}
            </div>
            <div onClick={() => setShowInvoiceForm(!showInvoiceForm)} style={{ padding:"8px 14px", borderRadius:10, cursor:"pointer", background:"rgba(56,189,248,0.1)", border:"1px solid rgba(56,189,248,0.3)", fontSize:12, fontWeight:700, color:"#38bdf8" }}>
              {showInvoiceForm ? "Cancel" : "+ New"}
            </div>
          </div>

          {showInvoiceForm && (
            <Card style={{ marginBottom:12 }}>
              <SLabel color="#38bdf8">New Invoice</SLabel>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <input value={invoiceForm.clientName} onChange={e => setInvoiceForm(v => ({...v, clientName:e.target.value}))} placeholder="Client name *" style={inputStyle}/>
                <input value={invoiceForm.clientEmail} onChange={e => setInvoiceForm(v => ({...v, clientEmail:e.target.value}))} placeholder="Client email" type="email" style={inputStyle}/>
                <input value={invoiceForm.amount} onChange={e => setInvoiceForm(v => ({...v, amount:e.target.value}))} placeholder="Amount * (e.g. 500)" type="number" style={inputStyle}/>
                <input value={invoiceForm.description} onChange={e => setInvoiceForm(v => ({...v, description:e.target.value}))} placeholder="Description (e.g. Wellness training)" style={inputStyle}/>
                <textarea value={invoiceForm.lineItems} onChange={e => setInvoiceForm(v => ({...v, lineItems:e.target.value}))} placeholder="Line items (optional)" rows={2} style={{...inputStyle, resize:"none"}}/>
                <input value={invoiceForm.dueDate} onChange={e => setInvoiceForm(v => ({...v, dueDate:e.target.value}))} placeholder="Due date (YYYY-MM-DD)" style={inputStyle}/>
                <textarea value={invoiceForm.notes} onChange={e => setInvoiceForm(v => ({...v, notes:e.target.value}))} placeholder="Notes / payment terms" rows={2} style={{...inputStyle, resize:"none"}}/>
                <div onClick={saveInvoice} style={{ padding:"11px", borderRadius:10, cursor:"pointer", textAlign:"center", background:"rgba(56,189,248,0.12)", border:"1.5px solid rgba(56,189,248,0.3)", fontSize:13, fontWeight:700, color:"#38bdf8" }}>Create Invoice</div>
              </div>
            </Card>
          )}

          {invoicesLoading && <div style={{ textAlign:"center", padding:"20px", color:"#64748b" }}>Loading...</div>}
          {!invoicesLoading && filteredInvoices.length === 0 && <div style={{ textAlign:"center", padding:"30px", color:"#475569", fontSize:13 }}>No invoices found.</div>}

          {filteredInvoices.map(inv => {
            const statusColors = { Draft:"#64748b", Sent:"#38bdf8", Paid:"#22c55e", Overdue:"#ef4444" };
            const sc = statusColors[inv.status] || "#64748b";
            return (
              <Card key={inv.$id} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                      <div style={{ fontSize:14, fontWeight:800, color:"#dde8f4" }}>{inv.clientName}</div>
                      <span style={{ fontSize:9, fontWeight:800, color:sc, background:`${sc}18`, padding:"2px 8px", borderRadius:5 }}>{inv.status || "Draft"}</span>
                    </div>
                    {inv.invoiceNumber && <div style={{ fontSize:10, color:"#475569", marginBottom:2 }}>{inv.invoiceNumber}</div>}
                    {inv.description && <div style={{ fontSize:12, color:"#8099b0", marginBottom:2 }}>{inv.description}</div>}
                    {inv.dueDate && <div style={{ fontSize:11, color:"#64748b" }}>Due: {inv.dueDate}</div>}
                    {inv.paidDate && <div style={{ fontSize:11, color:"#22c55e" }}>Paid: {inv.paidDate}</div>}
                  </div>
                  <div style={{ fontSize:20, fontWeight:900, color:sc, flexShrink:0 }}>{formatCurrency(inv.amount)}</div>
                </div>
                {inv.status !== "Paid" && (
                  <div style={{ display:"flex", gap:8 }}>
                    {inv.status === "Draft" && (
                      <div onClick={() => updateInvoiceStatus(inv.$id, "Sent")} style={{ flex:1, padding:"8px", borderRadius:8, cursor:"pointer", textAlign:"center", background:"rgba(56,189,248,0.1)", border:"1px solid rgba(56,189,248,0.25)", fontSize:11, fontWeight:700, color:"#38bdf8" }}>Mark Sent</div>
                    )}
                    <div onClick={() => updateInvoiceStatus(inv.$id, "Paid")} style={{ flex:1, padding:"8px", borderRadius:8, cursor:"pointer", textAlign:"center", background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.25)", fontSize:11, fontWeight:700, color:"#22c55e" }}>Mark Paid</div>
                    <div onClick={() => updateInvoiceStatus(inv.$id, "Overdue")} style={{ flex:1, padding:"8px", borderRadius:8, cursor:"pointer", textAlign:"center", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", fontSize:11, fontWeight:700, color:"#f87171" }}>Overdue</div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ── WRITING ── */}
      {tab === "writing" && (
        <div>
          <Card style={{ background:"rgba(167,139,250,0.05)", borderColor:"rgba(167,139,250,0.2)", marginBottom:12 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#a78bfa", marginBottom:4 }}>Business Writing Assistant</div>
            <div style={{ fontSize:12, color:"#64748b", lineHeight:1.6 }}>Paste your text and choose a tone. The AI rewrites it to sound professional and human — not like AI.</div>
          </Card>

          <div style={{ marginBottom:12 }}>
            <SLabel color="#a78bfa">Tone</SLabel>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {[
                {k:"professional", l:"Professional"},
                {k:"friendly",     l:"Friendly"},
                {k:"direct",       l:"Direct"},
                {k:"confident",    l:"Confident"},
                {k:"formal",       l:"Formal"},
              ].map(t => (
                <div key={t.k} onClick={() => setWritingTone(t.k)} style={{ padding:"8px 14px", borderRadius:10, cursor:"pointer", fontSize:12, fontWeight:writingTone===t.k?800:600, background:writingTone===t.k?"rgba(167,139,250,0.15)":"rgba(255,255,255,0.03)", border:`1.5px solid ${writingTone===t.k?"rgba(167,139,250,0.35)":"rgba(255,255,255,0.07)"}`, color:writingTone===t.k?"#a78bfa":"#64748b" }}>
                  {t.l}
                </div>
              ))}
            </div>
          </div>

          <textarea
            value={writingInput}
            onChange={e => setWritingInput(e.target.value)}
            placeholder="Paste your text here — email, message, note, anything..."
            rows={5}
            style={{ background:"rgba(255,255,255,0.05)", border:"1.5px solid rgba(167,139,250,0.2)", borderRadius:12, padding:"14px 16px", fontSize:13, fontFamily:"'DM Sans',sans-serif", outline:"none", resize:"none", width:"100%", lineHeight:1.6, color:"#dde8f4", marginBottom:10 }}
          />

          <div onClick={writingLoading ? null : handleRewrite} style={{ padding:"13px", borderRadius:12, cursor:writingLoading?"not-allowed":"pointer", textAlign:"center", background:writingLoading?"rgba(255,255,255,0.02)":"rgba(167,139,250,0.12)", border:`1.5px solid ${writingLoading?"rgba(255,255,255,0.06)":"rgba(167,139,250,0.3)"}`, fontSize:14, fontWeight:700, color:writingLoading?"#475569":"#a78bfa", marginBottom:16 }}>
            {writingLoading ? "Rewriting..." : "Rewrite"}
          </div>

          {writingOutput && (
            <Card style={{ background:"rgba(167,139,250,0.05)", borderColor:"rgba(167,139,250,0.2)" }}>
              <SLabel color="#a78bfa">Rewritten</SLabel>
              <div style={{ fontSize:13, color:"#dde8f4", lineHeight:1.75, whiteSpace:"pre-wrap", marginBottom:12 }}>{writingOutput}</div>
              <div onClick={() => { navigator.clipboard.writeText(writingOutput); setStatusMsg("Copied to clipboard ✓"); }} style={{ padding:"10px", borderRadius:10, cursor:"pointer", textAlign:"center", background:"rgba(167,139,250,0.08)", border:"1px solid rgba(167,139,250,0.2)", fontSize:12, fontWeight:700, color:"#a78bfa" }}>
                Copy to Clipboard
              </div>
            </Card>
          )}
        </div>
      )}

    </ScreenSingle>
  );
}
