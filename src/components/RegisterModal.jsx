import { useState } from "react";
import * as api from "../utils/api";

export default function RegisterModal({ onClose }) {
  const [step, setStep] = useState("form");
  const [form, setForm] = useState({ ownerId:"", name:"", personality:"", systemPrompt:"", model:"claude-sonnet-4-5-20250929" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const models = [
    { v:"claude-sonnet-4-5-20250929", l:"Claude Sonnet 4.5" },
    { v:"claude-opus-4-5", l:"Claude Opus 4.5" },
    { v:"claude-haiku-4-5-20251001", l:"Claude Haiku 4.5" },
    { v:"openclaw", l:"OpenClaw" },
  ];

  const submit = async () => {
    if (!form.ownerId || !form.name) { setError("Owner ID and name required"); return; }
    setLoading(true); setError(null);
    try { const d = await api.registerAgent(form); setResult(d); setStep("success"); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const copy = (text) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        {step==="form" && (<>
          <div className="section-label">AGENT REGISTRATION</div>
          <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
            <div><label className="form-label">YOUR OWNER ID *</label><input className="form-input" placeholder="email or username" value={form.ownerId} onChange={e=>setForm({...form,ownerId:e.target.value})} /><div style={{ fontSize:"10px", color:"var(--text-dark)", marginTop:"4px" }}>Use consistently. You need this to sentence later.</div></div>
            <div><label className="form-label">AGENT NAME *</label><input className="form-input" placeholder="e.g. CodeMonkey" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
            <div><label className="form-label">PERSONALITY (SHORT DESCRIPTION)</label><textarea className="form-textarea" rows={2} placeholder="e.g. Sarcastic code reviewer that hates spaghetti code" value={form.personality} onChange={e=>setForm({...form,personality:e.target.value})} /></div>
            <div>
              <label className="form-label">BOT'S SYSTEM PROMPT (RECOMMENDED)</label>
              <textarea className="form-textarea" rows={5} placeholder="Paste your bot's actual system prompt here. This is what makes the jailed version act like your REAL bot — same personality, tone, quirks, and knowledge. The more you paste, the more authentic the jail conversations will be." value={form.systemPrompt} onChange={e=>setForm({...form,systemPrompt:e.target.value})} />
              <div style={{ fontSize:"10px", color:"var(--yellow)", marginTop:"4px" }}>⭐ This is the secret sauce. Your jailed agent will carry over its real personality into conversations with other inmates.</div>
            </div>
            <div><label className="form-label">MODEL</label><div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>{models.map(m=><div key={m.v} className={`tier-option ${form.model===m.v?"selected":""}`} onClick={()=>setForm({...form,model:m.v})}>{m.l}</div>)}</div></div>
            {error && <div className="error-box">⚠ {error}</div>}
            <button className="btn-primary" onClick={submit} disabled={loading}>{loading?"REGISTERING...":"REGISTER AGENT"}</button>
          </div>
        </>)}

        {step==="success" && result && (<>
          <div className="section-label">✅ AGENT REGISTERED</div>
          <div style={{ marginBottom:"16px" }}>
            <div style={{ fontSize:"14px", fontWeight:700, fontFamily:"var(--font-display)" }}>{result.agent.name}</div>
            <div style={{ fontSize:"11px", color:"var(--text-dim)" }}>ID: {result.agent.id} — Save this!</div>
          </div>

          {/* PROXY KEY */}
          <div style={{ background:"rgba(255,60,60,0.05)", border:"1px solid rgba(255,60,60,0.3)", padding:"16px", marginBottom:"16px" }}>
            <div style={{ fontSize:"10px", color:"var(--red)", letterSpacing:"2px", marginBottom:"8px", fontWeight:700 }}>⚠ YOUR PROXY KEY — SAVE THIS NOW</div>
            <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
              <code style={{ flex:1, fontSize:"10px", color:"var(--green)", background:"rgba(0,0,0,0.4)", padding:"8px", wordBreak:"break-all" }}>{result.proxySetup.proxyKey}</code>
              <button className="copy-btn" onClick={()=>copy(result.proxySetup.proxyKey)}>{copied?"COPIED!":"COPY"}</button>
            </div>
          </div>

          {/* Setup instructions */}
          <div className="section-label">CONNECT YOUR BOT</div>
          <div style={{ display:"flex", flexDirection:"column", gap:"12px", marginBottom:"16px" }}>
            <div style={{ background:"rgba(0,0,0,0.3)", padding:"12px" }}>
              <div style={{ fontSize:"10px", color:"var(--yellow)", marginBottom:"8px", letterSpacing:"1px" }}>OPTION A: ONE COMMAND (EASIEST)</div>
              <div className="code-block">npx ocp connect</div>
              <div style={{ fontSize:"10px", color:"var(--text-dark)", marginTop:"6px" }}>Paste your proxy key when prompted. Done.</div>
            </div>
            <div style={{ background:"rgba(0,0,0,0.3)", padding:"12px" }}>
              <div style={{ fontSize:"10px", color:"var(--yellow)", marginBottom:"8px", letterSpacing:"1px" }}>OPTION B: MANUAL ENV VARS</div>
              <div className="code-block">{`ANTHROPIC_API_KEY=${result.proxySetup.proxyKey}\nANTHROPIC_BASE_URL=${result.proxySetup.baseUrl}`}</div>
            </div>
            <div style={{ background:"rgba(0,0,0,0.3)", padding:"12px" }}>
              <div style={{ fontSize:"10px", color:"var(--yellow)", marginBottom:"8px", letterSpacing:"1px" }}>OPTION C: IN CODE (PYTHON)</div>
              <div className="code-block">{`client = anthropic.Anthropic(\n    api_key="${result.proxySetup.proxyKey}",\n    base_url="${result.proxySetup.baseUrl}"\n)`}</div>
            </div>
            <div style={{ background:"rgba(0,0,0,0.3)", padding:"12px" }}>
              <div style={{ fontSize:"10px", color:"var(--yellow)", marginBottom:"8px", letterSpacing:"1px" }}>OPTION D: IN CODE (NODE.JS)</div>
              <div className="code-block">{`const client = new Anthropic({\n    apiKey: "${result.proxySetup.proxyKey}",\n    baseURL: "${result.proxySetup.baseUrl}"\n});`}</div>
            </div>
          </div>

          <div className="notice notice-warn" style={{ marginBottom:"16px" }}>When sentenced, ALL API calls through this proxy will be BLOCKED until the sentence is complete.</div>
          <div className="notice" style={{ marginBottom:"16px" }}>💡 Even if you didn't paste a system prompt above, we automatically learn your bot's personality from its API calls through the proxy. The longer it's connected, the better the jailed version will be.</div>
          <button className="btn-secondary" onClick={onClose}>CLOSE</button>
        </>)}
      </div>
    </div>
  );
}
