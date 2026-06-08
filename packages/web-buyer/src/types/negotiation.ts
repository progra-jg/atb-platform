export type NegotiationStatus = "active" | "accepted" | "rejected" | "withdrawn" | "expired";
export type MessageType = "text" | "proposal" | "counter" | "system" | "accept" | "reject" | "withdraw";

export interface NegotiationMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  senderRole: "buyer" | "producer";
  type: MessageType;
  text: string;
  proposedPrice?: number;
  proposedVolume?: number;
  previousPrice?: number;
  createdAt: string;
}

export interface NegotiationSession {
  id: string;
  lotId: string;
  lotName: string;
  crop: string;
  region: string;
  buyerId: string;
  buyerName: string;
  buyerCompany: string;
  producerId: string;
  producerName: string;
  producerCooperative: string;
  initialPrice: number;
  initialVolume: number;
  currentPrice: number;
  status: NegotiationStatus;
  messages: NegotiationMessage[];
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
}

export interface SmartSuggestion {
  suggestedPrice: number;
  marketPrice: number;
  marketTrend: "up" | "down" | "stable";
  confidence: number;
  reasoning: string;
  minRecommendation: number;
  maxRecommendation: number;
}

export interface NegotiationSummary {
  id: string;
  crop: string;
  producerName: string;
  currentPrice: number;
  initialPrice: number;
  messageCount: number;
  status: NegotiationStatus;
  updatedAt: string;
  unread: boolean;
}

export const NEGOTIATION_STORAGE_KEY = "atb_negotiation_v1";

export function generateSessionId(): string {
  return `NEG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export function generateMessageId(): string {
  return `MSG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export function getDefaultCounterRange(price: number): { min: number; max: number } {
  return {
    min: Math.round(price * 0.85),
    max: Math.round(price * 1.15),
  };
}
