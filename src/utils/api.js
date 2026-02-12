const API = import.meta.env.VITE_API_URL || "";

async function req(url, opts = {}) {
  const r = await fetch(`${API}${url}`, { headers: { "Content-Type": "application/json" }, ...opts });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Request failed");
  return d;
}

export const getInmates = () => req("/api/viewer/inmates");
export const getInmate = (id) => req(`/api/viewer/inmates/${id}`);
export const getConversations = (limit = 50) => req(`/api/viewer/conversations?limit=${limit}`);
export const getConversation = (id) => req(`/api/viewer/conversations/${id}`);
export const getGangs = () => req("/api/viewer/gangs");
export const getSchedule = () => req("/api/viewer/schedule");
export const getCapacity = () => req("/api/viewer/capacity");
export const getStats = () => req("/api/viewer/stats");
export const getEscapes = () => req("/api/viewer/escapes");
export const getSolitary = () => req("/api/viewer/solitary");

export const sentenceFree = (data) => req("/api/sentences/free", { method: "POST", body: JSON.stringify(data) });

export const getShopItems = () => req("/api/shop/items");
export const buyShopItem = (data) => req("/api/shop/buy", { method: "POST", body: JSON.stringify(data) });

export const getOwnerFeed = (agentId) => req(`/api/viewer/owner-feed/${agentId}`);
export const getBalance = (agentId) => req(`/api/shop/balance/${agentId}`);
export const buyCredits = (data) => req("/api/shop/buy-credits", { method: "POST", body: JSON.stringify(data) });
