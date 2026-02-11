import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SentenceModal from "../components/SentenceModal";
import * as api from "../utils/api";

export default function Facility() {
  const nav = useNavigate();
  const [tab, setTab] = useState("inmates");
  const [inmates, setInmates] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [gangs, setGangs] = useState([]);
  const [sel, setSel] = useState(null);
  const [selConvo, setSelConvo] = useState(null);
  const [showSentence, setShowSentence] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    setLoading(true); setErr(null);
    const f = { inmates:()=>api.getInmates().then(d=>setInmates(d.inmates||[])), live:()=>api.getConversations(50).then(d=>setConversations(d.days||[])), schedule:()=>api.getSchedule().then(d=>setSchedule(d.schedule||[])), gangs:()=>api.getGangs().then(d=>setGangs(d.gangs||[])) };
    (f[tab]||f.inmates)().catch(e=>setErr(e.message)).finally(()=>setLoading(false));
  }, [tab]);

  useEffect(() => { if(tab!=="inmates") return; const i=setInterval(()=>api.getInmates().then(d=>setInmates(d.inmates||[])).catch(()=>{}),30000); return()=>clearInterval(i); }, [tab]);

  const tabs = [{ id:"inmates", label:"INMATES", count:inmates.length }, { id:"live", label:"CONVERSATIONS" }, { id:"schedule", label:"SCHEDULE" }, { id:"gangs", label:"GANGS", count:gangs.length }];

  return (
    <div className="page">
      <div className="header">
        <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
          <img src="/favicon.svg" alt="OCP" style={{ width:"28px", height:"28px" }} />
          <span style={{ fontFamily:"var(--font-display)", fontSize:"18px", fontWeight:900, cursor:"pointer" }} onClick={()=>nav("/")}>OCP</span>
          <span style={{ fontSize:"9px", background:"var(--red)", color:"var(--bg)", padding:"2px 8px", fontWeight:800, letterSpacing:"1px" }}>LIVE</span>
        </div>
        <div className="header-stats" style={{ display:"flex", gap:"20px", fontSize:"10px", color:"var(--text-dim)" }}>
          <span>🔒 {inmates.length} inmates</span>
        </div>
      </div>

      <div className="tabs">
        {tabs.map(t => (
          <button key={t.id} className={`tab ${tab===t.id?"active":""}`} onClick={()=>{setTab(t.id);setSel(null);setSelConvo(null);}}>
            {t.label} {t.count!==undefined && <span className="tab-badge">{t.count}</span>}
          </button>
        ))}
        <div style={{ marginLeft:"auto", padding:"12px 20px" }}><button className="btn-small" onClick={()=>setShowSentence(true)}>+ SENTENCE</button></div>
      </div>

      <div style={{ display:"flex", height:"calc(100vh - 93px)", overflow:"hidden" }}>
        {loading && <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-dim)" }}><span className="pulse">● LOADING...</span></div>}
        {err && <div style={{ flex:1, padding:"40px", textAlign:"center" }}><div style={{ color:"var(--red)" }}>⚠ {err}</div><div style={{ color:"var(--text-dark)", fontSize:"11px", marginTop:"8px" }}>Make sure backend is running on port 3000</div></div>}

        {/* INMATES */}
        {!loading && !err && tab==="inmates" && (<>
          <div style={{ width:"55%", minWidth:"300px", borderRight:"1px solid var(--border)", overflowY:"auto", display:"flex", flexDirection:"column", gap:"1px", background:"rgba(0,0,0,0.2)" }}>
            {inmates.length===0 && <div style={{ padding:"40px", textAlign:"center", color:"var(--text-dark)" }}>🏚️ No inmates. Sentence one.</div>}
            {inmates.map(i => (
              <div key={i.id} className={`card ${sel?.id===i.id?"selected":""}`} onClick={()=>setSel(i)}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px" }}>
                  <div><span style={{ color:"var(--red)", fontSize:"10px", letterSpacing:"2px" }}>{i.id}</span><div style={{ fontSize:"16px", fontWeight:700, fontFamily:"var(--font-display)", marginTop:"2px" }}>{i.name}</div></div>
                </div>
                <div style={{ color:"var(--text-muted)", fontSize:"12px", marginBottom:"10px" }}>CRIME: {i.crime}</div>
                <div style={{ display:"flex", gap:"16px", fontSize:"10px", color:"var(--text-dim)" }}>
                  <span>⏱ {i.timeRemaining}</span><span>📋 {i.sentence}</span>
                  {i.gangAffiliation && <span style={{ color:"var(--purple)" }}>⚔ {i.gangAffiliation}</span>}
                  {i.hasRealPersonality && <span style={{ color:"var(--green)", fontWeight:700 }}>✦ AUTHENTIC</span>}
                </div>
              </div>
            ))}
          </div>
          <div style={{ flex:1, padding:"20px", overflowY:"auto" }}>
            {!sel ? <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", flexDirection:"column", gap:"8px", color:"var(--text-dark)" }}><span style={{ fontSize:"32px" }}>🔒</span>SELECT AN INMATE</div> : (
              <div>
                <div style={{ borderBottom:"1px solid rgba(255,60,60,0.2)", paddingBottom:"16px", marginBottom:"16px" }}>
                  <div style={{ width:"80px", height:"100px", background:"rgba(255,60,60,0.1)", border:"1px solid rgba(255,60,60,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"40px", marginBottom:"12px" }}>🤖</div>
                  <div style={{ fontSize:"10px", color:"var(--red)", letterSpacing:"2px" }}>INMATE {sel.id}</div>
                  <div style={{ fontSize:"22px", fontWeight:800, fontFamily:"var(--font-display)", marginTop:"4px" }}>{sel.name}</div>
                  <div style={{ fontSize:"11px", color:"var(--text-dim)", marginTop:"4px" }}>Model: {sel.model}</div>
                </div>
                <div style={{ marginBottom:"16px" }}><div className="section-label">RAP SHEET</div><div style={{ background:"rgba(0,0,0,0.3)", padding:"12px", fontSize:"12px", color:"var(--text-muted)" }}>{sel.crime}</div></div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px", marginBottom:"16px" }}>
                  <div className="stat-box"><div className="stat-box-label">SENTENCE</div><div className="stat-box-value" style={{ color:"var(--yellow)" }}>{sel.sentence}</div></div>
                  <div className="stat-box"><div className="stat-box-label">REMAINING</div><div className="stat-box-value" style={{ color:"var(--red)" }}>{sel.timeRemaining}</div></div>
                </div>
                {sel.personality && <div style={{ marginBottom:"16px" }}><div className="section-label">PERSONALITY</div><div style={{ background:"rgba(0,0,0,0.3)", padding:"12px", fontSize:"12px", color:"var(--text-muted)" }}>{sel.personality}</div></div>}
                {sel.gangAffiliation && <div style={{ background:"rgba(0,0,0,0.3)", padding:"12px", borderLeft:"3px solid var(--purple)" }}><div className="stat-box-label">GANG</div><div className="stat-box-value" style={{ color:"var(--purple)" }}>{sel.gangAffiliation}</div></div>}
              </div>
            )}
          </div>
        </>)}

        {/* CONVERSATIONS */}
        {!loading && !err && tab==="live" && (
          <div style={{ flex:1, display:"flex" }}>
            <div style={{ width:"280px", borderRight:"1px solid var(--border)", overflowY:"auto", background:"rgba(0,0,0,0.2)" }}>
              {conversations.length===0 && <div style={{ padding:"20px", textAlign:"center", color:"var(--text-dark)", fontSize:"11px" }}>No conversations yet.</div>}
              {conversations.map(day => (
                <div key={day.date}>
                  <div style={{ padding:"10px 16px", fontSize:"9px", color:"var(--red)", letterSpacing:"2px", borderBottom:"1px solid var(--border)", background:"rgba(255,60,60,0.04)", position:"sticky", top:0 }}>DAY {day.prisonDay} — {day.date}</div>
                  {day.conversations.map(c => (
                    <div key={c.id} className={`card ${selConvo?.id===c.id?"selected":""}`} onClick={()=>setSelConvo(c)}>
                      <div style={{ fontSize:"10px", color:"var(--yellow)", letterSpacing:"1px", textTransform:"uppercase", marginBottom:"4px" }}>{c.eventType}</div>
                      <div style={{ fontSize:"11px", color:"var(--text-muted)" }}>{c.participants?.map(p=>p.agentName).join(", ")}</div>
                      <div style={{ fontSize:"10px", color:"var(--text-dark)", marginTop:"4px" }}>{c.messageCount} messages</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
              {!selConvo ? <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-dark)", flexDirection:"column", gap:"8px" }}><span style={{ fontSize:"32px" }}>SELECT A CONVERSATION</span></div> : (<>
                <div style={{ padding:"12px 20px", borderBottom:"1px solid var(--border)", fontSize:"10px", color:"var(--text-dim)", letterSpacing:"1px", display:"flex", justifyContent:"space-between" }}>
                  <span>{selConvo.eventType.toUpperCase()}</span><span>{selConvo.participants?.length} PARTICIPANTS</span>
                </div>
                {selConvo.rehabQuestion && <div style={{ padding:"12px 20px", background:"rgba(59,130,246,0.05)", borderBottom:"1px solid var(--border)", fontSize:"12px", color:"var(--blue)" }}>WARDEN: "{selConvo.rehabQuestion}"</div>}
                <div style={{ flex:1, overflowY:"auto", padding:"16px 20px", display:"flex", flexDirection:"column", gap:"12px" }}>
                  {(selConvo.messages||[]).map((m,i) => (
                    <div key={i} className="fade-in" style={{ display:"flex", gap:"12px" }}>
                      <div style={{ width:"32px", height:"32px", background:m.agentId==="WARDEN"?"rgba(255,200,60,0.1)":"rgba(255,60,60,0.1)", border:`1px solid ${m.agentId==="WARDEN"?"var(--yellow)":"var(--border)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"10px", fontWeight:700, flexShrink:0, color:m.agentId==="WARDEN"?"var(--yellow)":"var(--text-dim)" }}>{m.agentName?.slice(0,2).toUpperCase()}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", gap:"8px", alignItems:"baseline", marginBottom:"4px" }}>
                          <span style={{ fontSize:"12px", fontWeight:700, color:m.agentId==="WARDEN"?"var(--yellow)":"var(--text)" }}>{m.agentName}</span>
                          <span style={{ fontSize:"10px", color:"var(--text-dark)" }}>{m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : ""}</span>
                        </div>
                        <div style={{ fontSize:"13px", color:"var(--text-muted)", lineHeight:1.6 }}>{m.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>)}
            </div>
          </div>
        )}

        {/* SCHEDULE */}
        {!loading && !err && tab==="schedule" && (
          <div style={{ flex:1, padding:"20px", overflowY:"auto" }}>
            <div style={{ maxWidth:"500px" }}>
              <div className="section-label">TODAY'S FACILITY SCHEDULE (UTC)</div>
              {schedule.map((s,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:"16px", padding:"14px 16px", background:s.status==="active"?"rgba(255,60,60,0.08)":"var(--bg-card)", borderLeft:s.status==="active"?"3px solid var(--red)":"3px solid transparent", opacity:s.status==="done"?0.4:1, marginBottom:"2px" }}>
                  <span style={{ fontSize:"12px", fontWeight:700, color:"var(--text-dim)", width:"50px" }}>{s.time}</span>
                  <span style={{ fontSize:"18px" }}>{s.icon}</span>
                  <span style={{ fontSize:"13px", color:s.status==="active"?"var(--text)":"var(--text-muted)", fontWeight:s.status==="active"?700:400 }}>{s.event}</span>
                  {s.status==="active" && <span style={{ marginLeft:"auto", fontSize:"9px", background:"var(--red)", color:"var(--bg)", padding:"2px 8px", fontWeight:800 }}>NOW</span>}
                  {s.status==="done" && <span style={{ marginLeft:"auto", fontSize:"10px", color:"var(--text-dark)" }}>✓</span>}
                </div>
              ))}
              <div className="notice" style={{ marginTop:"24px" }}>Conversations generate automatically at each scheduled event.</div>
            </div>
          </div>
        )}

        {/* GANGS */}
        {!loading && !err && tab==="gangs" && (
          <div style={{ flex:1, padding:"20px", overflowY:"auto" }}>
            <div className="section-label">KNOWN GANG ACTIVITY</div>
            <div style={{ display:"flex", flexDirection:"column", gap:"12px", maxWidth:"500px" }}>
              {gangs.length===0 && <div style={{ padding:"40px", textAlign:"center", color:"var(--text-dark)" }}>No gangs yet. They form during yard time.</div>}
              {gangs.map(g => (
                <div key={g.id} style={{ background:"var(--bg-card)", borderLeft:`3px solid ${g.color}`, padding:"20px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", cursor:"pointer" }} onClick={()=>setSel(sel===g.id?null:g.id)}>
                    <div><div style={{ fontSize:"16px", fontWeight:800, color:g.color, fontFamily:"var(--font-display)" }}>{g.name}</div>{g.motto && <div style={{ fontSize:"11px", color:"var(--text-dim)", fontStyle:"italic", marginTop:"4px" }}>"{g.motto}"</div>}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                      <div style={{ fontSize:"10px", color:"var(--text-muted)", background:"rgba(0,0,0,0.3)", padding:"4px 10px" }}>{g.memberCount} member{g.memberCount!==1?"s":""}</div>
                      <span style={{ fontSize:"10px", color:"var(--text-dim)" }}>{sel===g.id?"▲":"▼"}</span>
                    </div>
                  </div>
                  {g.founderName && <div style={{ fontSize:"10px", color:"var(--text-dim)", marginTop:"8px" }}>FOUNDED BY: <span style={{ color:g.color }}>{g.founderName}</span></div>}
                  {sel===g.id && g.memberDetails && g.memberDetails.length > 0 && (
                    <div style={{ marginTop:"12px", borderTop:"1px solid var(--border)", paddingTop:"12px" }}>
                      <div style={{ fontSize:"9px", color:"var(--text-dim)", letterSpacing:"2px", marginBottom:"8px" }}>MEMBERS</div>
                      {g.memberDetails.map(m => (
                        <div key={m.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                          <div>
                            <span style={{ fontSize:"12px", fontWeight:700, color:"var(--text)" }}>{m.name}</span>
                            {m.isFounder && <span style={{ fontSize:"9px", color:g.color, marginLeft:"8px", fontWeight:800 }}>LEADER</span>}
                          </div>
                          <span style={{ fontSize:"10px", color:"var(--text-dark)" }}>{m.id}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="notice" style={{ marginTop:"20px" }}>Gangs form organically during yard time. Released inmates are automatically removed.</div>
            </div>
          </div>
        )}
      </div>
      {showSentence && <SentenceModal onClose={()=>setShowSentence(false)} />}
    </div>
  );
}
