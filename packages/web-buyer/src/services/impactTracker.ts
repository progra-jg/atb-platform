import type { ImpactSnapshot, MilestoneEvent, ImpactHistory } from "../types/impact";
import type { ESGScore } from "../types/esg";
import { ESG_TIERS } from "../types/esg";
import { getBadgeState } from "./badges";
import { getFollowing } from "./follow";
import { getInviteStats } from "./invites";
import { fetchOrders } from "./orders";
import { getFavorites } from "./favorites";

const STORAGE_KEY = "atb_impact_history";
const MAX_SNAPSHOTS = 30;

function loadSnapshots(): ImpactSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function saveSnapshots(snapshots: ImpactSnapshot[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots.slice(-MAX_SNAPSHOTS)));
  } catch { /* ignore */ }
}

export async function recordSnapshot(
  userId: string,
  esgScore: ESGScore,
  profilePercentage: number,
): Promise<ImpactSnapshot> {
  const snapshot: ImpactSnapshot = {
    date: new Date().toISOString(),
    overall: esgScore.overall,
    environmental: esgScore.environmental,
    social: esgScore.social,
    governance: esgScore.governance,
    tier: esgScore.tier,
    badgesUnlocked: esgScore.factors.filter((f) => f.unlocked).length,
    profilePercentage,
  };
  const existing = loadSnapshots();
  const last = existing[existing.length - 1];
  if (last && last.overall === snapshot.overall && last.badgesUnlocked === snapshot.badgesUnlocked) {
    return snapshot;
  }
  existing.push(snapshot);
  saveSnapshots(existing);
  return snapshot;
}

export function getHistory(): ImpactHistory {
  const snapshots = loadSnapshots();
  return { snapshots, milestones: [] };
}

export async function generateMilestones(userId: string): Promise<MilestoneEvent[]> {
  const milestones: MilestoneEvent[] = [];
  const snapshots = loadSnapshots();

  const [badges, following, inviteStats, orders] = await Promise.all([
    getBadgeState(userId).catch(() => null),
    getFollowing(userId).catch(() => []),
    getInviteStats(userId).catch(() => ({ totalSent: 0 })),
    fetchOrders().catch(() => []),
  ]);

  if (badges) {
    const now = new Date();
    for (const b of badges.badges) {
      if (b.unlocked && b.unlockedAt) {
        milestones.push({
          id: `badge-${b.badgeId}`,
          date: b.unlockedAt,
          type: "badge",
          labelKey: `impact.milestone.badge.${b.badgeId}`,
          icon: "🏅",
        });
      }
    }
  }

  if (following.length > 0) {
    const sorted = [...following].sort((a, b) => new Date(a.followedAt).getTime() - new Date(b.followedAt).getTime());
    milestones.push({
      id: "first-follow",
      date: sorted[0].followedAt,
      type: "follow",
      labelKey: "impact.milestone.firstFollow",
      icon: "👥",
    });
  }

  if (inviteStats.totalSent > 0) {
    milestones.push({
      id: "first-invite",
      date: snapshots.length > 0 ? snapshots[0].date : new Date().toISOString(),
      type: "invite",
      labelKey: "impact.milestone.firstInvite",
      icon: "📨",
    });
  }

  const orderCount = Array.isArray(orders) ? orders.length : 0;
  if (orderCount > 0) {
    milestones.push({
      id: "first-order",
      date: snapshots.length > 0 ? snapshots[0].date : new Date().toISOString(),
      type: "order",
      labelKey: "impact.milestone.firstOrder",
      icon: "📦",
    });
  }

  if (snapshots.length > 0) {
    for (let i = 0; i < snapshots.length - 1; i++) {
      const before = snapshots[i];
      const after = snapshots[i + 1];
      const beforeTier = ESG_TIERS.find((t) => t.tier === before.tier);
      const afterTier = ESG_TIERS.find((t) => t.tier === after.tier);
      if (beforeTier && afterTier && afterTier.min > beforeTier.min) {
        milestones.push({
          id: `esg-tier-${after.tier}-${after.date}`,
          date: after.date,
          type: "esg_tier",
          labelKey: `impact.milestone.esgTier.${after.tier}`,
          icon: "🌱",
          value: after.tier.toUpperCase(),
        });
      }
    }
  }

  if (snapshots.length > 0 && snapshots[0].profilePercentage >= 100) {
    milestones.push({
      id: "profile-complete",
      date: snapshots[0].date,
      type: "profile",
      labelKey: "impact.milestone.profileComplete",
      icon: "✅",
    });
  }

  return milestones.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getTrend(snapshots: ImpactSnapshot[]): { direction: "up" | "down" | "stable"; change: number } {
  if (snapshots.length < 2) return { direction: "stable", change: 0 };
  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];
  const diff = last.overall - first.overall;
  return {
    direction: diff > 2 ? "up" : diff < -2 ? "down" : "stable",
    change: diff,
  };
}
