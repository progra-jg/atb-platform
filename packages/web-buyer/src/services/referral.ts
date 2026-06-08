import api from "./api";
import type { ReferralData, ReferralStats } from "../types/referral";

const REFERRAL_STORE = new Map<string, ReferralData>();
const REFERRAL_CODE_REGISTRY = new Map<string, string>();

let counter = 0;
const nextId = () => `REF-${String(++counter).padStart(4, "0")}`;

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms + Math.random() * ms));

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateCode(length = 8): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  const prefix = "ATB";
  return `${prefix}-${code.slice(0, 4)}-${code.slice(4)}`;
}

function buildReferralData(userId: string, code: string): ReferralData {
  return {
    code,
    shareUrl: `${window.location.origin}/register?ref=${code}`,
    totalInvited: 0,
    activeInvited: 0,
    rewardsTotal: 0,
    rewardsCurrency: "XOF",
    rewards: [],
    invitees: [],
    createdAt: new Date().toISOString(),
  };
}

export async function initializeReferral(userId: string): Promise<ReferralData> {
  try {
    const { data } = await api.post("/referral/initialize", { userId });
    REFERRAL_CODE_REGISTRY.set(data.code, userId);
    REFERRAL_STORE.set(userId, data);
    return data;
  } catch {
    await delay(300);
    let existing = REFERRAL_STORE.get(userId);
    if (existing) return existing;
    const code = generateCode();
    const data = buildReferralData(userId, code);
    REFERRAL_CODE_REGISTRY.set(code, userId);
    REFERRAL_STORE.set(userId, data);
    return data;
  }
}

export async function getReferralData(userId: string): Promise<ReferralData | null> {
  try {
    const { data } = await api.get(`/referral/${userId}`);
    return data;
  } catch {
    await delay(200);
    return REFERRAL_STORE.get(userId) ?? null;
  }
}

export async function validateReferralCode(code: string): Promise<string | null> {
  const trimmed = code.trim().toUpperCase();
  try {
    const { data } = await api.get("/referral/validate", { params: { code: trimmed } });
    return data.ownerId ?? null;
  } catch {
    await delay(200);
    const ownerId = REFERRAL_CODE_REGISTRY.get(trimmed);
    return ownerId ?? null;
  }
}

export async function applyReferralCode(
  code: string,
  newUserId: string,
): Promise<{ success: boolean; reward?: string; newUserReward?: string; inviterName?: string }> {
  const trimmed = code.trim().toUpperCase();
  try {
    const { data } = await api.post("/referral/apply", { code: trimmed, newUserId });
    return data;
  } catch {
    await delay(400);
    const ownerId = REFERRAL_CODE_REGISTRY.get(trimmed);
    if (!ownerId || ownerId === newUserId) {
      return { success: false };
    }
    const ownerData = REFERRAL_STORE.get(ownerId);
    if (!ownerData) return { success: false };
    ownerData.totalInvited += 1;
    ownerData.activeInvited += 1;
    const ownerReward = 5000;
    const newUserReward = 2500;
    ownerData.rewardsTotal += ownerReward;
    ownerData.invitees.push({
      id: newUserId,
      company: "Nouvel inscrit",
      joinedAt: new Date().toISOString(),
      status: "pending",
      rewardsEarned: 0,
    });
    ownerData.rewards.push({
      id: nextId(),
      type: "fixed",
      amount: ownerReward,
      currency: "XOF",
      labelKey: "referral.reward.newUser",
      status: "pending",
      creditedAt: null,
      createdAt: new Date().toISOString(),
    });
    REFERRAL_STORE.set(ownerId, ownerData);
    return { success: true, reward: `${ownerReward}`, newUserReward: `${newUserReward}` };
  }
}

export async function getReferralStats(userId: string): Promise<ReferralStats> {
  try {
    const { data } = await api.get(`/referral/${userId}/stats`);
    return data;
  } catch {
    await delay(150);
    const ref = REFERRAL_STORE.get(userId);
    if (!ref) {
      return { inviteCount: 0, rewardCount: 0, rewardAmount: 0, conversionRate: 0 };
    }
    return {
      inviteCount: ref.totalInvited,
      rewardCount: ref.rewards.length,
      rewardAmount: ref.rewardsTotal,
      conversionRate: ref.totalInvited > 0
        ? Math.round((ref.activeInvited / ref.totalInvited) * 100)
        : 0,
    };
  }
}

export async function regenerateReferralCode(userId: string): Promise<string> {
  try {
    const { data } = await api.post("/referral/regenerate", { userId });
    return data.code;
  } catch {
    await delay(300);
    const existing = REFERRAL_STORE.get(userId);
    if (existing) {
      REFERRAL_CODE_REGISTRY.delete(existing.code);
    }
    const newCode = generateCode();
    if (existing) {
      existing.code = newCode;
      existing.shareUrl = `${window.location.origin}/register?ref=${newCode}`;
      REFERRAL_STORE.set(userId, existing);
    }
    REFERRAL_CODE_REGISTRY.set(newCode, userId);
    return newCode;
  }
}
