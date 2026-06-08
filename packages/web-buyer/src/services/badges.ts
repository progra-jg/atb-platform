import api from "./api";
import type { BadgeProgress, BadgeState } from "../types/badge";
import { BADGE_CATALOG } from "../types/badge";

const BADGE_STORE = new Map<string, BadgeProgress[]>();

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms + Math.random() * ms));

function initBadges(): BadgeProgress[] {
  return BADGE_CATALOG.map((b) => ({
    badgeId: b.id,
    unlocked: false,
    unlockedAt: null,
    progress: 0,
  }));
}

export async function getBadgeState(userId: string): Promise<BadgeState> {
  try {
    const { data } = await api.get(`/badges/${userId}`);
    return data;
  } catch {
    await delay(200);
    const badges = BADGE_STORE.get(userId) ?? initBadges();
    BADGE_STORE.set(userId, badges);
    const totalUnlocked = badges.filter((b) => b.unlocked).length;
    const nextBadge = BADGE_CATALOG.find((bd) => {
      const bp = badges.find((b) => b.badgeId === bd.id);
      return bp && !bp.unlocked;
    });
    return {
      badges,
      totalUnlocked,
      totalBadges: BADGE_CATALOG.length,
      nextMilestone: nextBadge?.id ?? null,
    };
  }
}

export async function progressBadge(
  userId: string,
  badgeId: string,
  increment: number,
): Promise<{ badgeUnlocked: boolean; badgeId: string }> {
  try {
    const { data } = await api.post(`/badges/${userId}/progress`, { badgeId, increment });
    return data;
  } catch {
    await delay(300);
    const badges = BADGE_STORE.get(userId) ?? initBadges();
    const idx = badges.findIndex((b) => b.badgeId === badgeId);
    if (idx === -1) return { badgeUnlocked: false, badgeId };
    const bp = badges[idx];
    if (bp.unlocked) return { badgeUnlocked: false, badgeId };
    const def = BADGE_CATALOG.find((b) => b.id === badgeId);
    if (!def) return { badgeUnlocked: false, badgeId };
    bp.progress = Math.min(bp.progress + increment, def.maxProgress);
    if (bp.progress >= def.maxProgress) {
      bp.unlocked = true;
      bp.unlockedAt = new Date().toISOString();
      badges[idx] = bp;
      BADGE_STORE.set(userId, badges);
      return { badgeUnlocked: true, badgeId };
    }
    badges[idx] = bp;
    BADGE_STORE.set(userId, badges);
    return { badgeUnlocked: false, badgeId };
  }
}
