import api from "./api";
import type {
  ShareReferral, ReferralEarning, ReferralV2Data,
} from "../types/referralV2";
import { COMMISSION_RATE, COMMISSION_DURATION_DAYS } from "../types/referralV2";
import { generateShareUrl } from "./whatsappBridge";

const STORE = new Map<string, ReferralV2Data>();
const EARNINGS_STORE = new Map<string, ReferralEarning[]>();
const SHARES_STORE = new Map<string, ShareReferral[]>();
const CODE_REGISTRY = new Map<string, string>();

let shareCounter = 0;
const nextShareId = () => `SHR-${String(++shareCounter).padStart(6, "0")}`;
let earnCounter = 0;
const nextEarnId = () => `ERN-${String(++earnCounter).padStart(6, "0")}`;

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms + Math.random() * ms));

function getLocal<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}
function setLocal<T>(key: string, data: T[]): void {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* noop */ }
}

function buildV2Data(userId: string, code: string): ReferralV2Data {
  return {
    userId,
    code,
    shareUrl: `${window.location.origin}/register?ref=${code}`,
    totalShares: 0,
    totalClicks: 0,
    totalRegistrations: 0,
    totalReferredTrades: 0,
    commissionTotal: 0,
    commissionCurrency: "XOF",
    shares: [],
    earnings: [],
    lastShareAt: null,
  };
}

export async function initializeReferralV2(userId: string): Promise<ReferralV2Data> {
  try {
    const { data } = await api.post("/referral/v2/initialize", { userId });
    CODE_REGISTRY.set(data.code, userId);
    STORE.set(userId, data);
    return data;
  } catch {
    await delay(250);
    let existing = STORE.get(userId);
    if (existing) return existing;

    const legacyRef = await (await import("./referral")).getReferralData(userId);
    const code = legacyRef?.code ?? `ATB-${userId.slice(0, 4).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const data = buildV2Data(userId, code);
    data.shareUrl = legacyRef?.shareUrl ?? data.shareUrl;
    CODE_REGISTRY.set(code, userId);
    STORE.set(userId, data);
    return data;
  }
}

export async function recordShare(
  userId: string,
  crop: string,
  price: number,
  change: number,
): Promise<ShareReferral> {
  const refData = await initializeReferralV2(userId);
  const refCode = refData.code;
  const shareUrl = generateShareUrl(crop, price, change, [], refCode);

  const share: ShareReferral = {
    id: nextShareId(),
    userId,
    crop,
    price,
    change,
    refCode,
    shareUrl,
    clicks: 0,
    registrations: 0,
    trades: 0,
    commissionEarned: 0,
    createdAt: new Date().toISOString(),
  };

  try {
    const { data } = await api.post("/referral/v2/share", share);
    return data;
  } catch {
    await delay(200);
    const existing = STORE.get(userId);
    if (existing) {
      existing.totalShares += 1;
      existing.lastShareAt = share.createdAt;
      existing.shares.push(share);
      STORE.set(userId, existing);
    }
    const shares = getLocal<ShareReferral>(`atb_shares_${userId}`);
    shares.push(share);
    setLocal(`atb_shares_${userId}`, shares);
    return share;
  }
}

export async function recordShareClick(shareId: string): Promise<void> {
  try {
    await api.post(`/referral/v2/share/${shareId}/click`);
  } catch {
    await delay(100);
    for (const entry of STORE.values()) {
      const share = entry.shares.find((s) => s.id === shareId);
      if (share) {
        share.clicks += 1;
        entry.totalClicks += 1;
        STORE.set(entry.userId, entry);
        return;
      }
    }
  }
}

export async function recordReferredRegistration(refCode: string, newUserId: string): Promise<boolean> {
  try {
    const { data } = await api.post("/referral/v2/register", { refCode, newUserId });
    return data.success;
  } catch {
    await delay(300);
    const ownerId = CODE_REGISTRY.get(refCode);
    if (!ownerId || ownerId === newUserId) return false;
    const owner = STORE.get(ownerId);
    if (!owner) return false;
    owner.totalRegistrations += 1;
    const share = owner.shares.find((s) => s.refCode === refCode && s.registrations === 0);
    if (share) share.registrations += 1;
    STORE.set(ownerId, owner);
    return true;
  }
}

export async function recordReferredTrade(
  referredUserId: string,
  tradeId: string,
  tradeAmount: number,
  crop: string,
): Promise<ReferralEarning | null> {
  try {
    const { data } = await api.post("/referral/v2/trade", {
      referredUserId, tradeId, tradeAmount, crop,
    });
    return data;
  } catch {
    await delay(300);
    const refData = await import("./referral");
    const shares = getLocal<ShareReferral>(`atb_shares_${referredUserId}`);
    const matchingShare = shares.find((s) => s.registrations > 0);
    if (!matchingShare) return null;

    const ownerId = CODE_REGISTRY.get(matchingShare.refCode);
    if (!ownerId) return null;

    const commission = Math.round(tradeAmount * COMMISSION_RATE);
    const earning: ReferralEarning = {
      tradeId,
      referredUserId,
      referredName: `Inscrit #${referredUserId.slice(0, 6)}`,
      crop,
      tradeAmount,
      commissionRate: COMMISSION_RATE,
      commissionAmount: commission,
      status: "pending",
      createdAt: new Date().toISOString(),
      creditedAt: null,
    };

    const owner = STORE.get(ownerId);
    if (owner) {
      owner.totalReferredTrades += 1;
      owner.commissionTotal += commission;
      owner.earnings.push(earning);
      STORE.set(ownerId, owner);
    }

    const earnings = getLocal<ReferralEarning>(`atb_earnings_${ownerId}`);
    earnings.push(earning);
    setLocal(`atb_earnings_${ownerId}`, earnings);

    if (matchingShare) {
      matchingShare.trades += 1;
      matchingShare.commissionEarned += commission;
      const allShares = getLocal<ShareReferral>(`atb_shares_${referredUserId}`);
      const idx = allShares.findIndex((s) => s.id === matchingShare.id);
      if (idx >= 0) allShares[idx] = matchingShare;
      setLocal(`atb_shares_${referredUserId}`, allShares);
    }

    return earning;
  }
}

export async function getReferralV2Data(userId: string): Promise<ReferralV2Data | null> {
  try {
    const { data } = await api.get(`/referral/v2/${userId}`);
    return data;
  } catch {
    await delay(150);
    const base = STORE.get(userId);
    if (!base) return null;
    const earnings = getLocal<ReferralEarning>(`atb_earnings_${userId}`);
    const shares = getLocal<ShareReferral>(`atb_shares_${userId}`);
    return {
      ...base,
      earnings: earnings || base.earnings,
      shares: shares || base.shares,
    };
  }
}

export async function getReferralV2Stats(userId: string): Promise<{
  totalShares: number;
  totalClicks: number;
  totalRegistrations: number;
  totalReferredTrades: number;
  commissionTotal: number;
  clickRate: number;
  conversionRate: number;
}> {
  try {
    const { data } = await api.get(`/referral/v2/${userId}/stats`);
    return data;
  } catch {
    await delay(100);
    const ref = await getReferralV2Data(userId);
    if (!ref) {
      return {
        totalShares: 0, totalClicks: 0, totalRegistrations: 0,
        totalReferredTrades: 0, commissionTotal: 0,
        clickRate: 0, conversionRate: 0,
      };
    }
    return {
      totalShares: ref.totalShares,
      totalClicks: ref.totalClicks,
      totalRegistrations: ref.totalRegistrations,
      totalReferredTrades: ref.totalReferredTrades,
      commissionTotal: ref.commissionTotal,
      clickRate: ref.totalShares > 0 ? Math.round((ref.totalClicks / ref.totalShares) * 100) : 0,
      conversionRate: ref.totalClicks > 0 ? Math.round((ref.totalRegistrations / ref.totalClicks) * 100) : 0,
    };
  }
}
