import { getBadgeState } from "./badges";
import { getFollowing, getFollowStats } from "./follow";
import { getInviteStats } from "./invites";
import { fetchOrders } from "./orders";
import { fetchCertificates } from "./lots";
import api from "./api";
import type { ESGScore, ESGFactor, ESGRecommendation, ESGImpactBadge } from "../types/esg";
import { ESG_TIERS } from "../types/esg";

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms + Math.random() * ms));

async function fetchAll(userId: string): Promise<{
  badges: Awaited<ReturnType<typeof getBadgeState>>;
  following: Awaited<ReturnType<typeof getFollowing>>;
  followStats: Awaited<ReturnType<typeof getFollowStats>>;
  inviteStats: Awaited<ReturnType<typeof getInviteStats>>;
  orders: Awaited<ReturnType<typeof fetchOrders>>;
  certs: Awaited<ReturnType<typeof fetchCertificates>>;
}> {
  const [badges, following, inviteStats, orders, certs] = await Promise.all([
    getBadgeState(userId),
    getFollowing(userId),
    getInviteStats(userId),
    fetchOrders().catch(() => []),
    fetchCertificates().catch(() => []),
  ]);
  const followStats = following.length > 0
    ? await getFollowStats(userId).catch(() => ({ followersCount: 0, followingCount: 0 }))
    : { followersCount: 0, followingCount: 0 };
  return { badges, following, followStats, inviteStats, orders, certs };
}

function badgeUnlocked(badges: Awaited<ReturnType<typeof getBadgeState>>, id: string): boolean {
  return badges.badges.some((b) => b.badgeId === id && b.unlocked);
}

function calculateEnvironmental(data: Awaited<ReturnType<typeof fetchAll>>): { score: number; factors: ESGFactor[] } {
  let score = 0;
  const factors: ESGFactor[] = [];

  const eudr = badgeUnlocked(data.badges, "eudrCompliant");
  factors.push({ id: "eudr", category: "environmental", labelKey: "esg.factor.eudr", weight: 25, score: eudr ? 25 : 0, maxScore: 25, unlocked: eudr, sourceKey: "badges.eudrCompliant.name" });
  if (eudr) score += 25;

  const green = badgeUnlocked(data.badges, "greenPurchase");
  factors.push({ id: "green", category: "environmental", labelKey: "esg.factor.green", weight: 25, score: green ? 25 : 0, maxScore: 25, unlocked: green, sourceKey: "badges.greenPurchase.name" });
  if (green) score += 25;

  const certCount = Array.isArray(data.certs) ? data.certs.length : 0;
  const certScore = Math.min(certCount * 10, 20);
  factors.push({ id: "certificates", category: "environmental", labelKey: "esg.factor.certificates", weight: 20, score: certScore, maxScore: 20, unlocked: certScore > 0, sourceKey: "certificates.title" });
  score += certScore;

  const vol10 = badgeUnlocked(data.badges, "volume10t");
  factors.push({ id: "volume", category: "environmental", labelKey: "esg.factor.volume", weight: 15, score: vol10 ? 15 : 0, maxScore: 15, unlocked: vol10, sourceKey: "badges.volume10t.name" });
  if (vol10) score += 15;

  const first = badgeUnlocked(data.badges, "firstPurchase");
  factors.push({ id: "firstOrder", category: "environmental", labelKey: "esg.factor.firstOrder", weight: 15, score: first ? 15 : 0, maxScore: 15, unlocked: first, sourceKey: "badges.firstPurchase.name" });
  if (first) score += 15;

  return { score: Math.min(score, 100), factors };
}

function calculateSocial(data: Awaited<ReturnType<typeof fetchAll>>): { score: number; factors: ESGFactor[] } {
  let score = 0;
  const factors: ESGFactor[] = [];

  const followingCount = data.following.length;
  const followingScore = Math.min(followingCount * 8, 20);
  factors.push({ id: "following", category: "social", labelKey: "esg.factor.following", weight: 20, score: followingScore, maxScore: 20, unlocked: followingCount > 0, sourceKey: "follow.title" });
  score += followingScore;

  const followersCount = data.followStats.followersCount;
  const followerScore = Math.min(followersCount * 8, 15);
  factors.push({ id: "followers", category: "social", labelKey: "esg.factor.followers", weight: 15, score: followerScore, maxScore: 15, unlocked: followersCount > 0, sourceKey: "follow.stats.followers" });
  score += followerScore;

  const ambassador = badgeUnlocked(data.badges, "ambassador");
  factors.push({ id: "ambassador", category: "social", labelKey: "esg.factor.ambassador", weight: 25, score: ambassador ? 25 : 0, maxScore: 25, unlocked: ambassador, sourceKey: "badges.ambassador.name" });
  if (ambassador) score += 25;

  const inviteCount = data.inviteStats.totalSent;
  const inviteScore = Math.min(inviteCount * 5, 20);
  factors.push({ id: "invites", category: "social", labelKey: "esg.factor.invites", weight: 20, score: inviteScore, maxScore: 20, unlocked: inviteCount > 0, sourceKey: "invites.title" });
  score += inviteScore;

  const orderCount = Array.isArray(data.orders) ? data.orders.length : 0;
  const orderScore = Math.min(orderCount * 5, 20);
  factors.push({ id: "orders", category: "social", labelKey: "esg.factor.orders", weight: 20, score: orderScore, maxScore: 20, unlocked: orderCount > 0, sourceKey: "orders.title" });
  score += orderScore;

  return { score: Math.min(score, 100), factors };
}

function calculateGovernance(
  data: Awaited<ReturnType<typeof fetchAll>>,
  profileCompleteness: number,
  user?: { company?: string; email?: string; country?: string; metadata?: { ifu?: string; nom?: string; fonction?: string } },
): { score: number; factors: ESGFactor[] } {
  let score = 0;
  const factors: ESGFactor[] = [];

  const compScore = Math.min(Math.round(profileCompleteness * 0.3), 25);
  factors.push({ id: "profile", category: "governance", labelKey: "esg.factor.profile", weight: 25, score: compScore, maxScore: 25, unlocked: profileCompleteness >= 60, sourceKey: "profileCompleteness.score" });
  score += compScore;

  const verified = badgeUnlocked(data.badges, "verifiedBuyer");
  factors.push({ id: "verified", category: "governance", labelKey: "esg.factor.verified", weight: 25, score: verified ? 25 : 0, maxScore: 25, unlocked: verified, sourceKey: "badges.verifiedBuyer.name" });
  if (verified) score += 25;

  let companyScore = 0;
  if (user?.company) companyScore += 8;
  if (user?.metadata?.ifu) companyScore += 7;
  if (user?.metadata?.nom) companyScore += 5;
  factors.push({ id: "company", category: "governance", labelKey: "esg.factor.company", weight: 20, score: companyScore, maxScore: 20, unlocked: companyScore >= 13, sourceKey: "settings.profile.company" });
  score += companyScore;

  const fiveOrders = badgeUnlocked(data.badges, "fiveOrders");
  factors.push({ id: "fiveOrders", category: "governance", labelKey: "esg.factor.fiveOrders", weight: 15, score: fiveOrders ? 15 : 0, maxScore: 15, unlocked: fiveOrders, sourceKey: "badges.fiveOrders.name" });
  if (fiveOrders) score += 15;

  const hasReferral = data.inviteStats.totalSent > 0 || data.inviteStats.totalRegistered > 0;
  factors.push({ id: "referral", category: "governance", labelKey: "esg.factor.referral", weight: 15, score: hasReferral ? 15 : 0, maxScore: 15, unlocked: hasReferral, sourceKey: "referral.share.title" });
  if (hasReferral) score += 15;

  return { score: Math.min(score, 100), factors };
}

function computeTier(overall: number): ESGScore["tier"] {
  return ESG_TIERS.find((t) => overall >= t.min)?.tier ?? "ccc";
}

export async function calculateESGScore(
  userId: string,
  profileCompleteness: number,
  user?: { company?: string; email?: string; country?: string; metadata?: { ifu?: string; nom?: string; fonction?: string } },
): Promise<ESGScore> {
  try {
    const { data } = await api.post("/esg/score", { userId });
    return data;
  } catch {
    await delay(400);
    const data = await fetchAll(userId);
    const env = calculateEnvironmental(data);
    const soc = calculateSocial(data);
    const gov = calculateGovernance(data, profileCompleteness, user);
    const overall = Math.round(env.score * 0.4 + soc.score * 0.3 + gov.score * 0.3);
    return {
      overall,
      environmental: env.score,
      social: soc.score,
      governance: gov.score,
      tier: computeTier(overall),
      factors: [...env.factors, ...soc.factors, ...gov.factors],
      lastUpdated: new Date().toISOString(),
      trend: "stable",
    };
  }
}

export async function getRecommendations(userId: string, score: ESGScore): Promise<ESGRecommendation[]> {
  const recommendations: ESGRecommendation[] = [];
  for (const f of score.factors) {
    if (f.score < f.maxScore) {
      const pct = f.score / f.maxScore;
      let impact: "high" | "medium" | "low";
      let effort: "easy" | "medium" | "hard";
      if (pct < 0.33) { impact = "high"; effort = f.weight >= 20 ? "easy" : "medium"; }
      else if (pct < 0.66) { impact = "medium"; effort = "medium"; }
      else { impact = "low"; effort = "hard"; }
      recommendations.push({ id: `rec-${f.id}`, factorKey: f.labelKey, impact, effort, actionKey: `esg.rec.${f.id}` as any, link: f.id === "profile" ? "/settings?tab=profil" : undefined });
    }
  }
  return recommendations.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.impact] - order[b.impact];
  }).slice(0, 5);
}

export async function getImpactBadges(score: ESGScore): Promise<ESGImpactBadge[]> {
  return [
    { badgeKey: "esg.badge.climate", icon: "🌍", unlocked: score.environmental >= 60, impact: score.environmental },
    { badgeKey: "esg.badge.community", icon: "🤝", unlocked: score.social >= 60, impact: score.social },
    { badgeKey: "esg.badge.transparency", icon: "🔗", unlocked: score.governance >= 60, impact: score.governance },
    { badgeKey: "esg.badge.leader", icon: "🏆", unlocked: score.overall >= 75, impact: score.overall },
  ];
}
