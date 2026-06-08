import api from "./api";
import { fetchMarketPrices } from "./market";
import type {
  NegotiationSession, NegotiationMessage, SmartSuggestion,
  NegotiationStatus, NegotiationSummary,
} from "../types/negotiation";
import {
  NEGOTIATION_STORAGE_KEY, generateSessionId, generateMessageId,
} from "../types/negotiation";

const SESSION_STORE = new Map<string, NegotiationSession>();

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms + Math.random() * ms));

function getLocal<T>(key: string): T[] {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T[] : []; }
  catch { return []; }
}
function setLocal<T>(key: string, data: T[]): void {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* noop */ }
}

export async function createSession(params: {
  lotId: string; lotName: string; crop: string; region: string;
  producerId: string; producerName: string; producerCooperative: string;
  initialPrice: number; initialVolume: number;
  buyerId: string; buyerName: string; buyerCompany: string;
}): Promise<NegotiationSession> {
  try {
    const { data } = await api.post("/negotiations", params);
    return data;
  } catch {
    await delay(400);
    const now = new Date().toISOString();
    const session: NegotiationSession = {
      id: generateSessionId(),
      lotId: params.lotId,
      lotName: params.lotName,
      crop: params.crop,
      region: params.region,
      buyerId: params.buyerId,
      buyerName: params.buyerName,
      buyerCompany: params.buyerCompany,
      producerId: params.producerId,
      producerName: params.producerName,
      producerCooperative: params.producerCooperative,
      initialPrice: params.initialPrice,
      initialVolume: params.initialVolume,
      currentPrice: params.initialPrice,
      status: "active",
      messages: [{
        id: generateMessageId(),
        sessionId: "",
        senderId: params.buyerId,
        senderName: params.buyerName,
        senderRole: "buyer",
        type: "proposal",
        text: `Proposition initiale : ${params.initialPrice.toLocaleString("fr-FR")} FCFA/kg pour ${params.initialVolume} kg`,
        proposedPrice: params.initialPrice,
        proposedVolume: params.initialVolume,
        createdAt: now,
      }],
      createdAt: now,
      updatedAt: now,
    };
    session.messages[0].sessionId = session.id;
    SESSION_STORE.set(session.id, session);
    const all = getLocal<NegotiationSession>(NEGOTIATION_STORAGE_KEY);
    all.unshift(session);
    setLocal(NEGOTIATION_STORAGE_KEY, all);
    return session;
  }
}

export async function getSession(sessionId: string): Promise<NegotiationSession | null> {
  try {
    const { data } = await api.get(`/negotiations/${sessionId}`);
    return data;
  } catch {
    await delay(150);
    const cached = SESSION_STORE.get(sessionId);
    if (cached) return cached;
    const all = getLocal<NegotiationSession>(NEGOTIATION_STORAGE_KEY);
    return all.find((s) => s.id === sessionId) ?? null;
  }
}

export async function listSessions(userId: string): Promise<NegotiationSession[]> {
  try {
    const { data } = await api.get(`/negotiations?userId=${userId}`);
    return data;
  } catch {
    await delay(200);
    const all = getLocal<NegotiationSession>(NEGOTIATION_STORAGE_KEY);
    return all.filter((s) => s.buyerId === userId || s.producerId === userId);
  }
}

export async function sendMessage(
  sessionId: string,
  senderId: string,
  senderName: string,
  senderRole: "buyer" | "producer",
  text: string,
  proposedPrice?: number,
  proposedVolume?: number,
): Promise<NegotiationSession> {
  try {
    const { data } = await api.post(`/negotiations/${sessionId}/messages`, {
      senderId, senderName, senderRole, text, proposedPrice, proposedVolume,
    });
    return data;
  } catch {
    await delay(200);
    const session = SESSION_STORE.get(sessionId) ??
      getLocal<NegotiationSession>(NEGOTIATION_STORAGE_KEY).find((s) => s.id === sessionId);
    if (!session) throw new Error("Session not found");

    const msg: NegotiationMessage = {
      id: generateMessageId(),
      sessionId,
      senderId,
      senderName,
      senderRole,
      type: proposedPrice != null ? "counter" : "text",
      text,
      proposedPrice,
      proposedVolume,
      previousPrice: proposedPrice != null ? session.currentPrice : undefined,
      createdAt: new Date().toISOString(),
    };
    session.messages.push(msg);
    if (proposedPrice != null) session.currentPrice = proposedPrice;
    session.updatedAt = msg.createdAt;

    SESSION_STORE.set(sessionId, session);
    const all = getLocal<NegotiationSession>(NEGOTIATION_STORAGE_KEY);
    const idx = all.findIndex((s) => s.id === sessionId);
    if (idx >= 0) all[idx] = session; else all.unshift(session);
    setLocal(NEGOTIATION_STORAGE_KEY, all);
    return session;
  }
}

export async function updateSessionStatus(
  sessionId: string,
  status: NegotiationStatus,
  userId: string,
  userName: string,
): Promise<NegotiationSession> {
  try {
    const { data } = await api.patch(`/negotiations/${sessionId}/status`, { status });
    return data;
  } catch {
    await delay(150);
    const session = SESSION_STORE.get(sessionId) ??
      getLocal<NegotiationSession>(NEGOTIATION_STORAGE_KEY).find((s) => s.id === sessionId);
    if (!session) throw new Error("Session not found");

    session.status = status;
    if (status === "accepted") session.acceptedAt = new Date().toISOString();

    const typeMap: Record<string, "accept" | "reject" | "withdraw"> = {
      accepted: "accept", rejected: "reject", withdrawn: "withdraw",
    };
    session.messages.push({
      id: generateMessageId(),
      sessionId,
      senderId: userId,
      senderName: userName,
      senderRole: session.buyerId === userId ? "buyer" : "producer",
      type: typeMap[status] ?? "system",
      text: status === "accepted" ? "Offre acceptée" : status === "rejected" ? "Offre refusée" : "Négociation retirée",
      createdAt: new Date().toISOString(),
    });
    session.updatedAt = new Date().toISOString();

    SESSION_STORE.set(sessionId, session);
    const all = getLocal<NegotiationSession>(NEGOTIATION_STORAGE_KEY);
    const idx = all.findIndex((s) => s.id === sessionId);
    if (idx >= 0) all[idx] = session;
    setLocal(NEGOTIATION_STORAGE_KEY, all);
    return session;
  }
}

export async function getSmartSuggestion(
  crop: string,
  currentPrice: number,
): Promise<SmartSuggestion> {
  try {
    const { data } = await api.post("/negotiations/suggest", { crop, currentPrice });
    return data;
  } catch {
    await delay(250);
    let marketPrice = currentPrice;
    let trend: "up" | "down" | "stable" = "stable";

    try {
      const prices = await fetchMarketPrices();
      const match = prices.find((p) =>
        p.crop.toLowerCase() === crop.toLowerCase(),
      );
      if (match) {
        marketPrice = match.price;
        const hist = match.history;
        if (hist && hist.length >= 2) {
          const recent = hist.slice(-3);
          const avg = recent.reduce((s, v) => s + v, 0) / recent.length;
          trend = avg > marketPrice * 1.02 ? "down" : avg < marketPrice * 0.98 ? "up" : "stable";
        }
      }
    } catch {
      /* use defaults */
    }

    const ratio = marketPrice > 0 ? currentPrice / marketPrice : 1;
    let suggestedPrice: number;
    let reasoning: string;
    let confidence: number;

    if (ratio > 1.1) {
      suggestedPrice = Math.round(marketPrice * 1.05);
      reasoning = "Votre prix est supérieur au marché. Une offre à 5% au-dessus du marché reste compétitive.";
      confidence = 75;
    } else if (ratio < 0.9) {
      suggestedPrice = Math.round(marketPrice * 0.95);
      reasoning = "Votre prix est inférieur au marché. Une offre à 5% sous le marché attire les producteurs.";
      confidence = 70;
    } else {
      const midpoint = Math.round((currentPrice + marketPrice) / 2);
      suggestedPrice = Math.round(midpoint * (trend === "up" ? 1.02 : trend === "down" ? 0.98 : 1));
      reasoning = "Votre prix est aligné avec le marché. Un ajustement fin maximise vos chances.";
      confidence = 85;
    }

    return {
      suggestedPrice,
      marketPrice,
      marketTrend: trend,
      confidence,
      reasoning,
      minRecommendation: Math.round(Math.min(currentPrice, marketPrice) * 0.9),
      maxRecommendation: Math.round(Math.max(currentPrice, marketPrice) * 1.1),
    };
  }
}

export async function getNegotiationSummaries(userId: string): Promise<NegotiationSummary[]> {
  try {
    const { data } = await api.get(`/negotiations/summary?userId=${userId}`);
    return data;
  } catch {
    await delay(150);
    const all = getLocal<NegotiationSession>(NEGOTIATION_STORAGE_KEY);
    const filtered = all.filter((s) => s.buyerId === userId || s.producerId === userId);
    return filtered.map((s) => ({
      id: s.id,
      crop: s.crop,
      producerName: s.buyerId === userId ? s.producerName : s.buyerName,
      currentPrice: s.currentPrice,
      initialPrice: s.initialPrice,
      messageCount: s.messages.length,
      status: s.status,
      updatedAt: s.updatedAt,
      unread: false,
    }));
  }
}
