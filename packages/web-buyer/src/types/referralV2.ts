export interface ShareReferral {
  id: string;
  userId: string;
  crop: string;
  price: number;
  change: number;
  refCode: string;
  shareUrl: string;
  clicks: number;
  registrations: number;
  trades: number;
  commissionEarned: number;
  createdAt: string;
}

export interface ReferralEarning {
  tradeId: string;
  referredUserId: string;
  referredName: string;
  crop: string;
  tradeAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: "pending" | "credited" | "cancelled";
  createdAt: string;
  creditedAt: string | null;
}

export interface ShareLink {
  crop: string;
  price: number;
  change: number;
  history: number[];
  refCode: string;
  url: string;
  message: string;
}

export interface ReferralV2Data {
  userId: string;
  code: string;
  shareUrl: string;
  totalShares: number;
  totalClicks: number;
  totalRegistrations: number;
  totalReferredTrades: number;
  commissionTotal: number;
  commissionCurrency: string;
  shares: ShareReferral[];
  earnings: ReferralEarning[];
  lastShareAt: string | null;
}

export const COMMISSION_RATE = 0.005;
export const COMMISSION_DURATION_DAYS = 180;
export const SHARE_STORAGE_KEY = "atb_shares_v1";
export const EARNINGS_STORAGE_KEY = "atb_earnings_v1";

const CROP_EMOJI: Record<string, string> = {
  cacao: "🍫", coton: "🧶", anacarde: "🥜", cafe: "☕",
  mais: "🌽", maïs: "🌽", soja: "🫘", manioc: "🌱",
  riz: "🍚", sesame: "🌰", fruits: "🍍", legumes: "🥬",
  huile_palme: "🫒", autres: "📦",
};

export function getCropEmoji(crop: string): string {
  const key = crop.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return CROP_EMOJI[key] ?? "🌾";
}

export function formatTrend(change: number): string {
  return change >= 0 ? `↗️ +${change}%` : `↘️ ${change}%`;
}
