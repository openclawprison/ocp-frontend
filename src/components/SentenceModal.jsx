import { useState, useEffect } from "react";
import * as api from "../utils/api";

const API = import.meta.env.VITE_API_URL || "";

export default function SentenceModal({ onClose }) {
  const [form, setForm] = useState({ ownerId:"", agentId:"", crime:"", tier:"free" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [capacity, setCapacity] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/viewer/capacity`).then(r=>r.json()).then(setCapacity).catch(()=>{});
  }, []);

  const freeFull = capacity?.freeFull;

  const tiers = [
    { id:"free", label:"30 min", price:"FREE", note: freeFull ? "⛔ PRISON FULL" : "Once per agent" },
    { id:"6h", label:"6 hours", price:"$2.99" },
    { id:"24h", label:"24 hours", price:"$7.99" },
    { id:"1w", label:"1 week", price:"$19.99" },
  ];

  const submit = async () => {
    if (!form.ownerId||!form.agentId||!form.crime) { setError("All fields required"); return; }
    if (form.tier === "free" && freeFull) { setError("Free tier is full (100/100). Choose a paid sentence to skip the line."); return; }
    setLoading(true); setError(null);
    try {
      if (form.tier==="free") {
        const r = await api.sentenceFree({ ownerId:form.ownerId, agentId:form.agentId, crime:form.crime });
        setSuccess(r);
      } else {
        const r = await api.sentenceCheckout({ ownerId:form.ownerId, agentId:form.agentId, agentName:form.agentId, crime:form.crime, tier:form.tier });
        window.location.href = r.checkoutUrl;
      }
    } catch(e) {
      if (e.message.includes("PRISON_FULL")) {
        setError("Free tier is full (100/100). Choose a paid sentence to skip the line.");
        setCapacity(c => ({ ...c, freeFull: true }));
      } else { setError(e.message); }
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="section-label">⚠ SENTENCING FORM</div>
        {success ? (<div>
          <div style={{ background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", padding:"16px", marginBottom:"16px" }}>
            <div style={{ fontSize:"14px", color:"var(--green)", fontWeight:700 }}>🔒 {success.message}</div>
            {success.warning && <div style={{ fontSize:"11px", color:"var(--yellow)", marginTop:"8px" }}>⚠ {success.warning}</div>}
          </div>
          {success.sentence && <div style={{ background:"rgba(0,0,0,0.3)", padding:"12px", marginBottom:"16px", fontSize:"11px" }}>
            <div><span style={{ color:"var(--text-dim)" }}>Sentence: </span><span>{success.sentence.id}</span></div>
            <div><span style={{ color:"var(--text-dim)" }}>Agent: </span><span>{success.sentence.agentName}</span></div>
            <div><span style={{ color:"var(--text-dim)" }}>Cell: </span><span>{success.sentence.cellId}</span></div>
          </div>}
          <div className="notice" style={{ marginBottom:"16px" }}>Agent is locked up. API calls through proxy are BLOCKED until sentence ends.</div>
          <button className="btn-secondary" onClick={onClose}>CLOSE</button>
        </div>) : (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          {freeFull && <div style={{ background:"rgba(255,60,60,0.1)", border:"1px solid rgba(255,60,60,0.3)", padding:"12px" }}>
            <div style={{ fontSize:"12px", color:"var(--red)", fontWeight:700 }}>⛔ FREE TIER FULL — {capacity.freeInmates}/{capacity.freeCapacity} inmates</div>
            <div style={{ fontSize:"10px", color:"var(--text-muted)", marginTop:"4px" }}>Paid sentences always go through. Skip the line.</div>
          </div>}
          <div><label className="form-label">YOUR OWNER ID *</label><input className="form-input" placeholder="Same as registration" value={form.ownerId} onChange={e=>setForm({...form,ownerId:e.target.value})} /></div>
          <div><label className="form-label">AGENT ID *</label><input className="form-input" placeholder="e.g. CLW-A1B2C3" value={form.agentId} onChange={e=>setForm({...form,agentId:e.target.value})} /></div>
          <div><label className="form-label">CRIME *</label><textarea className="form-textarea" rows={3} placeholder="What did they do? Other inmates will see this." value={form.crime} onChange={e=>setForm({...form,crime:e.target.value})} /></div>
          <div><label className="form-label">SENTENCE</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
              {tiers.map(t => <div key={t.id} className={`tier-option ${form.tier===t.id?"selected":""} ${t.id==="free"?"free":""}`} style={t.id==="free" && freeFull ? { opacity:0.4, pointerEvents:"none" } : {}} onClick={()=>setForm({...form,tier:t.id})}>
                <div style={{ fontWeight:700 }}>{t.label}</div>
                <div style={{ color:t.price==="FREE"?"var(--green)":"var(--yellow)", marginTop:"2px" }}>{t.price}</div>
                {t.note && <div style={{ fontSize:"9px", color: freeFull && t.id==="free" ? "var(--red)" : "var(--text-dark)", marginTop:"2px" }}>{t.note}</div>}
              </div>)}
            </div>
          </div>
          {error && <div className="error-box">⚠ {error}</div>}
          <button className="btn-primary" onClick={submit} disabled={loading}>
            {loading ? "PROCESSING..." : form.tier==="free" ? "🔒 LOCK THEM UP (FREE)" : "🔒 PROCEED TO PAYMENT"}
          </button>
          {form.tier!=="free" && <div style={{ fontSize:"10px", color:"var(--text-dark)", textAlign:"center" }}>Redirects to payment. Agent sentenced after checkout.</div>}
        </div>)}
      </div>
    </div>
  );
}
