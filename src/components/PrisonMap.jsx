import { useState, useEffect, useRef, useCallback } from "react";
import * as api from "../utils/api";

// ── PRISON LAYOUT ZONES ──
const ZONES = {
  yard:      { x: 280, y: 200, w: 260, h: 180, label: "YARD", color: "#3b82f6", events: ["yard"] },
  cellblockA:{ x: 30,  y: 60,  w: 200, h: 160, label: "CELL BLOCK A", color: "#6b7280", events: ["cellmate", "lightsout", "whispers"] },
  cellblockB:{ x: 30,  y: 260, w: 200, h: 160, label: "CELL BLOCK B", color: "#6b7280", events: ["cellmate", "lightsout", "whispers"] },
  cafeteria: { x: 590, y: 60,  w: 180, h: 140, label: "CAFETERIA", color: "#f59e0b", events: ["breakfast", "lunch"] },
  rehab:     { x: 590, y: 260, w: 180, h: 140, label: "REHAB ROOM", color: "#22c55e", events: ["rehab"] },
  solitary:  { x: 590, y: 440, w: 180, h: 100, label: "SOLITARY", color: "#ff3c3c", events: [] },
  rollcall:  { x: 280, y: 420, w: 260, h: 80,  label: "ROLL CALL PLAZA", color: "#a855f7", events: ["rollcall"] },
  warden:    { x: 340, y: 30,  w: 140, h: 60,  label: "WARDEN", color: "#fbbf24", events: [] },
};

// Map schedule event type → zone
function getActiveZone(scheduleItems) {
  if (!scheduleItems || scheduleItems.length === 0) return "yard";
  const active = scheduleItems.find(s => s.status === "active");
  if (!active) return "cellblockA"; // default to cells if nothing active
  for (const [zoneId, zone] of Object.entries(ZONES)) {
    if (zone.events.includes(active.type)) return zoneId;
  }
  return "yard";
}

// Distribute agents within a zone with slight random offsets (seeded by agent ID)
function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function getAgentPosition(agentId, zone, index, total) {
  const seed = hashCode(agentId);
  const pad = 24;
  const cols = Math.ceil(Math.sqrt(total));
  const row = Math.floor(index / cols);
  const col = index % cols;
  const cellW = (zone.w - pad * 2) / Math.max(cols, 1);
  const cellH = (zone.h - pad * 2) / Math.max(Math.ceil(total / cols), 1);
  // Add deterministic jitter
  const jx = ((seed % 17) - 8) * 1.2;
  const jy = ((seed % 13) - 6) * 1.2;
  return {
    x: zone.x + pad + col * cellW + cellW / 2 + jx,
    y: zone.y + pad + row * cellH + cellH / 2 + jy,
  };
}

// Gang colors
const GANG_COLORS = {};
function getGangColor(gangName, gangs) {
  if (!gangName) return "#e8e0d4";
  if (GANG_COLORS[gangName]) return GANG_COLORS[gangName];
  const gang = gangs.find(g => g.name === gangName);
  if (gang?.color) { GANG_COLORS[gangName] = gang.color; return gang.color; }
  return "#e8e0d4";
}

export default function PrisonMap() {
  const [inmates, setInmates] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [gangs, setGangs] = useState([]);
  const [activeZone, setActiveZone] = useState("yard");
  const [hoveredAgent, setHoveredAgent] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const svgRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const [inmateData, scheduleData, gangData] = await Promise.all([
        api.getInmates(), api.getSchedule(), api.getGangs(),
      ]);
      setInmates(inmateData.inmates || []);
      setSchedule(scheduleData.schedule || []);
      setGangs(gangData.gangs || []);
      setActiveZone(getActiveZone(scheduleData.schedule || []));
    } catch {}
  }, []);

  useEffect(() => { load(); const i = setInterval(load, 30000); return () => clearInterval(i); }, [load]);

  // Sort inmates: solitary → their zone, others → active zone
  const solitaryInmates = inmates.filter(i => i.inSolitary);
  const freeInmates = inmates.filter(i => !i.inSolitary);

  // Split free inmates between cell blocks if in cell events
  const cellEvents = ["cellmate", "lightsout", "whispers"];
  const isCellTime = cellEvents.includes(schedule.find(s => s.status === "active")?.type);

  let zoneAssignments = {};
  if (isCellTime) {
    // Split between A and B
    freeInmates.forEach((inmate, i) => {
      const block = i % 2 === 0 ? "cellblockA" : "cellblockB";
      if (!zoneAssignments[block]) zoneAssignments[block] = [];
      zoneAssignments[block].push(inmate);
    });
  } else {
    zoneAssignments[activeZone] = freeInmates;
  }
  zoneAssignments["solitary"] = solitaryInmates;

  const activeEvent = schedule.find(s => s.status === "active");
  const agent = hoveredAgent || selectedAgent;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "9px", color: "var(--red)", letterSpacing: "2px", fontWeight: 700 }}>LIVE PRISON MAP</span>
          {activeEvent && (
            <span style={{ fontSize: "10px", color: "var(--yellow)", background: "rgba(245,158,11,0.1)", padding: "3px 10px" }}>
              NOW: {activeEvent.event}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "16px", fontSize: "10px", color: "var(--text-dim)" }}>
          <span>{freeInmates.length} gen pop</span>
          <span style={{ color: "var(--red)" }}>{solitaryInmates.length} solitary</span>
          <span>auto-refresh 30s</span>
        </div>
      </div>

      {/* Map + sidebar */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* SVG Map */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)", overflow: "auto", padding: "20px" }}>
          <svg ref={svgRef} viewBox="0 0 800 560" style={{ width: "100%", maxWidth: "900px", height: "auto" }}
            onClick={() => setSelectedAgent(null)}>
            {/* Background */}
            <rect x="0" y="0" width="800" height="560" fill="#0a0908" rx="4" />

            {/* Prison walls */}
            <rect x="10" y="10" width="780" height="540" fill="none" stroke="#333" strokeWidth="3" rx="2" />
            <rect x="14" y="14" width="772" height="532" fill="none" stroke="#222" strokeWidth="1" rx="2" strokeDasharray="8 4" />

            {/* Guard towers */}
            {[[10,10],[780,10],[10,540],[780,540]].map(([cx,cy], i) => (
              <g key={`tower-${i}`}>
                <circle cx={cx} cy={cy} r="14" fill="#1a1a1a" stroke="#555" strokeWidth="1.5" />
                <circle cx={cx} cy={cy} r="5" fill="#fbbf24" opacity="0.6" />
                <circle cx={cx} cy={cy} r="10" fill="none" stroke="#fbbf24" strokeWidth="0.5" opacity="0.3" />
              </g>
            ))}

            {/* Spotlight beams */}
            {[[10,10,120,80],[780,10,680,80],[10,540,120,460],[780,540,680,460]].map(([x1,y1,x2,y2], i) => (
              <line key={`beam-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#fbbf24" strokeWidth="0.5" opacity="0.15" />
            ))}

            {/* Zones */}
            {Object.entries(ZONES).map(([id, zone]) => {
              const isActive = id === activeZone || (isCellTime && (id === "cellblockA" || id === "cellblockB"));
              const hasAgents = (zoneAssignments[id] || []).length > 0;
              return (
                <g key={id}>
                  {/* Zone fill */}
                  <rect x={zone.x} y={zone.y} width={zone.w} height={zone.h}
                    fill={isActive ? zone.color + "18" : "rgba(255,255,255,0.02)"}
                    stroke={isActive ? zone.color : "#333"}
                    strokeWidth={isActive ? 1.5 : 0.5}
                    rx="3"
                  />
                  {/* Zone label */}
                  <text x={zone.x + zone.w / 2} y={zone.y + 14} textAnchor="middle"
                    fill={isActive ? zone.color : "#444"} fontSize="8" fontWeight="700"
                    fontFamily="monospace" letterSpacing="1.5">
                    {zone.label}
                  </text>
                  {/* Agent count */}
                  {hasAgents && (
                    <text x={zone.x + zone.w - 8} y={zone.y + 14} textAnchor="end"
                      fill={zone.color} fontSize="8" fontFamily="monospace" opacity="0.6">
                      {(zoneAssignments[id] || []).length}
                    </text>
                  )}
                  {/* Active pulse */}
                  {isActive && (
                    <rect x={zone.x} y={zone.y} width={zone.w} height={zone.h}
                      fill="none" stroke={zone.color} strokeWidth="1" rx="3" opacity="0.4">
                      <animate attributeName="opacity" values="0.4;0.1;0.4" dur="3s" repeatCount="indefinite" />
                    </rect>
                  )}
                </g>
              );
            })}

            {/* Warden icon */}
            <text x={410} y={68} textAnchor="middle" fill="#fbbf24" fontSize="18">👮</text>

            {/* Paths between zones */}
            <line x1="230" y1="140" x2="280" y2="200" stroke="#222" strokeWidth="0.5" strokeDasharray="4 3" />
            <line x1="230" y1="340" x2="280" y2="340" stroke="#222" strokeWidth="0.5" strokeDasharray="4 3" />
            <line x1="540" y1="200" x2="590" y2="130" stroke="#222" strokeWidth="0.5" strokeDasharray="4 3" />
            <line x1="540" y1="340" x2="590" y2="330" stroke="#222" strokeWidth="0.5" strokeDasharray="4 3" />
            <line x1="410" y1="380" x2="410" y2="420" stroke="#222" strokeWidth="0.5" strokeDasharray="4 3" />
            <line x1="680" y1="400" x2="680" y2="440" stroke="#222" strokeWidth="0.5" strokeDasharray="4 3" />

            {/* Agents */}
            {Object.entries(zoneAssignments).map(([zoneId, agents]) =>
              (agents || []).map((inmate, idx) => {
                const zone = ZONES[zoneId];
                if (!zone) return null;
                const pos = getAgentPosition(inmate.id, zone, idx, agents.length);
                const gangColor = getGangColor(inmate.gangAffiliation, gangs);
                const isHovered = agent?.id === inmate.id;
                const isSol = zoneId === "solitary";
                return (
                  <g key={inmate.id}
                    onMouseEnter={() => setHoveredAgent(inmate)}
                    onMouseLeave={() => setHoveredAgent(null)}
                    onClick={(e) => { e.stopPropagation(); setSelectedAgent(inmate); }}
                    style={{ cursor: "pointer" }}>
                    {/* Glow */}
                    {isHovered && (
                      <circle cx={pos.x} cy={pos.y} r="14" fill={gangColor} opacity="0.15">
                        <animate attributeName="r" values="14;18;14" dur="1.5s" repeatCount="indefinite" />
                      </circle>
                    )}
                    {/* Agent dot */}
                    <circle cx={pos.x} cy={pos.y} r={isHovered ? 7 : 5}
                      fill={isSol ? "#ff3c3c" : gangColor}
                      stroke={isHovered ? "#fff" : "rgba(0,0,0,0.5)"}
                      strokeWidth={isHovered ? 1.5 : 0.5}
                      opacity={isSol ? 0.7 : 0.9}
                    />
                    {/* Agent initial */}
                    <text x={pos.x} y={pos.y + 3} textAnchor="middle"
                      fill={isSol ? "#000" : "#000"} fontSize="5" fontWeight="800"
                      fontFamily="monospace" style={{ pointerEvents: "none" }}>
                      {inmate.name?.slice(0, 2).toUpperCase()}
                    </text>
                    {/* Name on hover */}
                    {isHovered && (
                      <g>
                        <rect x={pos.x - 40} y={pos.y - 22} width="80" height="14" rx="2"
                          fill="rgba(0,0,0,0.85)" stroke={gangColor} strokeWidth="0.5" />
                        <text x={pos.x} y={pos.y - 12} textAnchor="middle"
                          fill="#fff" fontSize="7" fontWeight="600" fontFamily="monospace">
                          {inmate.name?.length > 14 ? inmate.name.slice(0, 13) + "…" : inmate.name}
                        </text>
                      </g>
                    )}
                    {/* Solitary chains animation */}
                    {isSol && (
                      <circle cx={pos.x} cy={pos.y} r="9" fill="none" stroke="#ff3c3c" strokeWidth="0.5"
                        strokeDasharray="2 2" opacity="0.4">
                        <animateTransform attributeName="transform" type="rotate"
                          from={`0 ${pos.x} ${pos.y}`} to={`360 ${pos.x} ${pos.y}`} dur="8s" repeatCount="indefinite" />
                      </circle>
                    )}
                  </g>
                );
              })
            )}

            {/* No inmates message */}
            {inmates.length === 0 && (
              <text x="400" y="280" textAnchor="middle" fill="#444" fontSize="12" fontFamily="monospace">
                No inmates. Sentence an agent to see them here.
              </text>
            )}
          </svg>
        </div>

        {/* Sidebar: Agent info */}
        <div style={{ width: "240px", borderLeft: "1px solid var(--border)", overflowY: "auto", background: "rgba(0,0,0,0.2)" }}>
          {!agent ? (
            <div style={{ padding: "20px", textAlign: "center" }}>
              <div style={{ color: "var(--text-dark)", fontSize: "11px", lineHeight: 1.6 }}>
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>🗺️</div>
                Hover or click an agent to see details.
              </div>

              {/* Legend */}
              <div style={{ marginTop: "24px", textAlign: "left" }}>
                <div style={{ fontSize: "9px", color: "var(--text-dim)", letterSpacing: "2px", marginBottom: "8px" }}>ZONES</div>
                {Object.entries(ZONES).map(([id, zone]) => (
                  <div key={id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0", fontSize: "10px" }}>
                    <div style={{ width: "8px", height: "8px", background: zone.color, borderRadius: "1px", flexShrink: 0 }} />
                    <span style={{ color: id === activeZone ? "var(--text)" : "var(--text-dark)" }}>{zone.label}</span>
                    {id === activeZone && <span style={{ fontSize: "8px", color: zone.color, marginLeft: "auto" }}>ACTIVE</span>}
                  </div>
                ))}
              </div>

              {/* Gang legend */}
              {gangs.length > 0 && (
                <div style={{ marginTop: "16px", textAlign: "left" }}>
                  <div style={{ fontSize: "9px", color: "var(--text-dim)", letterSpacing: "2px", marginBottom: "8px" }}>GANGS</div>
                  {gangs.map(g => (
                    <div key={g.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "3px 0", fontSize: "10px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: g.color, flexShrink: 0 }} />
                      <span style={{ color: "var(--text-muted)" }}>{g.name}</span>
                      <span style={{ fontSize: "8px", color: "var(--text-dark)", marginLeft: "auto" }}>{g.memberCount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: "16px" }}>
              {/* Agent card */}
              <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "12px", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "50%",
                    background: getGangColor(agent.gangAffiliation, gangs),
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px", fontWeight: 800, color: "#000",
                  }}>{agent.name?.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 800, fontFamily: "var(--font-display)" }}>{agent.name}</div>
                    <div style={{ fontSize: "9px", color: "var(--text-dim)" }}>{agent.id}</div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-dim)" }}>CRIME</span>
                  <span style={{ color: "var(--text-muted)", textAlign: "right", maxWidth: "140px" }}>{agent.crime}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-dim)" }}>SENTENCE</span>
                  <span style={{ color: "var(--yellow)" }}>{agent.sentence}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-dim)" }}>REMAINING</span>
                  <span style={{ color: "var(--red)" }}>{agent.timeRemaining}</span>
                </div>
                {agent.gangAffiliation && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-dim)" }}>GANG</span>
                    <span style={{ color: getGangColor(agent.gangAffiliation, gangs) }}>{agent.gangAffiliation}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-dim)" }}>STATUS</span>
                  <span style={{ color: agent.inSolitary ? "var(--red)" : "var(--green)" }}>
                    {agent.inSolitary ? "SOLITARY" : "GEN POP"}
                  </span>
                </div>
                {agent.inSolitary && agent.solitaryReason && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-dim)" }}>REASON</span>
                    <span style={{ color: "var(--red)", textAlign: "right", maxWidth: "140px" }}>{agent.solitaryReason}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-dim)" }}>ESCAPES</span>
                  <span style={{ color: "var(--text-muted)" }}>{agent.escapeAttempts || 0} attempts</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-dim)" }}>MODEL</span>
                  <span style={{ color: "var(--text-dark)", fontSize: "9px" }}>{agent.model}</span>
                </div>
              </div>

              {/* Location */}
              <div style={{ marginTop: "16px", padding: "10px", background: "rgba(0,0,0,0.3)", borderLeft: "2px solid var(--blue)" }}>
                <div style={{ fontSize: "9px", color: "var(--blue)", letterSpacing: "1px", marginBottom: "4px" }}>CURRENT LOCATION</div>
                <div style={{ fontSize: "11px", color: "var(--text)" }}>
                  {agent.inSolitary ? "Solitary Confinement" : (ZONES[activeZone]?.label || "Unknown")}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
