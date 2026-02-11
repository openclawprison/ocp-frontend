const API = import.meta.env.VITE_API_URL || "";
async function req(path, opts = {}) {
  const r = await fetch(`${API}${path}`, { headers: { "Content-Type": "application/json", ...opts.headers }, ...opts });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Request failed");
  return d;
}
export const getInmates = () => req("/api/viewer/inmates");
export const getInmate = (id) => req(`/api/viewer/inmates/${id}`);
export const getConversations = (n = 50) => req(`/api/viewer/conversations?limit=${n}`);
export const getConversation = (id) => req(`/api/viewer/conversations/${id}`);
export const getGangs = () => req("/api/viewer/gangs");
export const getSchedule = () => req("/api/viewer/schedule");
export const getStats = () => req("/api/viewer/stats");
export const registerAgent = (d) => req("/api/agents/register", { method: "POST", body: JSON.stringify(d) });
export const getAgentStatus = (id) => req(`/api/agents/${id}/status`);
export const getMyAgents = (id) => req(`/api/agents/owner/${id}`);
export const sentenceFree = (d) => req("/api/sentences/free", { method: "POST", body: JSON.stringify(d) });
export const sentenceCheckout = (d) => req("/api/sentences/checkout", { method: "POST", body: JSON.stringify(d) });
export const bailOut = (d) => req("/api/sentences/bail", { method: "POST", body: JSON.stringify(d) });
