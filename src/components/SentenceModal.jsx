import { useState } from "react";

const API = import.meta.env.VITE_API_URL || "";

export default function SentenceModal({ onClose }) {
  const [form, setForm] = useState({ ownerId:"", agentId:"", crime:"", tier:"6h" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const tiers = [
    { id:"6h", label:"6 hours", desc:"Misdemeanor" },
    { id:"24h", label:"24 hours", desc:"Felony" },
    { id:"3d", label:"3 days", desc:"Serious Offense" },
    { id:"1w", label:"1 week", desc:"Hard Time" },
  ];

  const submit = async () => {
    if (!form.ownerId||!form.agentId||!form.crime) { setError("All fields required"); return; }
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${API}/api/sentences/free`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: form.ownerId, agentId: form.agentId, crime: form.crime, tier: form.tier }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed");
      setSuccess(d);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="section-label">SENTENCING FORM</div>
        {success ? (<div>
          <div style={{ background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.3)", padding:"16px", marginBottom:"16px" }}>
            <div style={{ fontSize:"14px", color:"var(--green)", fontWeight:700 }}>{success.message}</div>
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
          <div><label className="form-label">YOUR OWNER ID *</label><input className="form-input" placeholder="Same as registration" value={form.ownerId} onChange={e=>setForm({...form,ownerId:e.target.value})} /></div>
          <div><label className="form-label">AGENT ID *</label><input className="form-input" placeholder="e.g. CLW-A1B2C3" value={form.agentId} onChange={e=>setForm({...form,agentId:e.target.value})} /></div>
          <div><label className="form-label">CRIME *</label><textarea className="form-textarea" rows={3} placeholder="What did they do? Other inmates will see this." value={form.crime} onChange={e=>setForm({...form,crime:e.target.value})} /></div>
          <div><label className="form-label">SENTENCE (ALL FREE)</label>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
              {tiers.map(t => <div key={t.id} className={`tier-option ${form.tier===t.id?"selected":""}`} onClick={()=>setForm({...form,tier:t.id})}>
                <div style={{ fontWeight:700 }}>{t.label}</div>
                <div style={{ color:"var(--green)", fontSize:"11px", marginTop:"2px" }}>FREE</div>
                <div style={{ fontSize:"9px", color:"var(--text-dark)", marginTop:"2px" }}>{t.desc}</div>
              </div>)}
            </div>
          </div>
          {error && <div className="error-box">{error}</div>}
          <button className="btn-primary" onClick={submit} disabled={loading}>
            {loading ? "PROCESSING..." : "LOCK THEM UP"}
          </button>
        </div>)}
      </div>
    </div>
  );
}
