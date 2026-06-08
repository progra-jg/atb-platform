import api from "./api";
import type { FollowRelation, FollowStats, ProducerFeedItem } from "../types/follow";
import { fetchLots } from "./lots";

const FOLLOW_STORE = new Map<string, FollowRelation[]>();

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms + Math.random() * ms));

function buildFeedItem(lot: any, farmerName: string, farmerId: string): ProducerFeedItem {
  return {
    farmerId,
    farmerName,
    farmerAvatar: farmerName.split(" ").map((n: string) => n[0]).join(""),
    lotId: lot.id ?? `LOT-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    crop: lot.culture ?? "—",
    quantity: lot.quantite ?? "—",
    price: lot.prix ?? 0,
    postedAt: lot.dateDispo ?? new Date().toISOString().split("T")[0],
    status: lot.statut ?? "Disponible",
  };
}

export async function toggleFollow(userId: string, farmerId: string): Promise<boolean> {
  try {
    const { data } = await api.post("/follow/toggle", { userId, farmerId });
    return data.following;
  } catch {
    await delay(200);
    const list = FOLLOW_STORE.get(userId) ?? [];
    const idx = list.findIndex((r) => r.farmerId === farmerId);
    if (idx >= 0) {
      list.splice(idx, 1);
      FOLLOW_STORE.set(userId, list);
      return false;
    }
    list.push({ farmerId, followedAt: new Date().toISOString(), notifications: true });
    FOLLOW_STORE.set(userId, list);
    return true;
  }
}

export async function getFollowing(userId: string): Promise<FollowRelation[]> {
  try {
    const { data } = await api.get(`/follow/${userId}/following`);
    return data;
  } catch {
    await delay(150);
    return FOLLOW_STORE.get(userId) ?? [];
  }
}

export async function isFollowing(userId: string, farmerId: string): Promise<boolean> {
  try {
    const { data } = await api.get(`/follow/${userId}/is-following`, { params: { farmerId } });
    return data.following;
  } catch {
    await delay(100);
    const list = FOLLOW_STORE.get(userId) ?? [];
    return list.some((r) => r.farmerId === farmerId);
  }
}

export async function getFollowStats(farmerId: string): Promise<FollowStats> {
  try {
    const { data } = await api.get(`/follow/${farmerId}/stats`);
    return data;
  } catch {
    await delay(100);
    let followersCount = 0;
    for (const [, list] of FOLLOW_STORE) {
      if (list.some((r) => r.farmerId === farmerId)) followersCount++;
    }
    return { followersCount, followingCount: 0 };
  }
}

export async function getProducerFeed(userId: string): Promise<ProducerFeedItem[]> {
  try {
    const { data } = await api.get(`/follow/${userId}/feed`);
    return data;
  } catch {
    await delay(300);
    const following = FOLLOW_STORE.get(userId) ?? [];
    if (following.length === 0) return [];
    const allLots = await fetchLots();
    if (!Array.isArray(allLots)) return [];
    const farmerNames: Record<string, string> = {
      "ATB-FARM-0042-GLZ": "Koffi Agbozo",
      "ATB-FARM-0001-KAM": "Kouassi Amadou",
      "ATB-FARM-0002-MDI": "Moussa Diallo",
      "ATB-FARM-0003-BTO": "Bakari Toundé",
      "ATB-FARM-0004-GHO": "Gisèle Hounkpatin",
      "ATB-FARM-0005-SAH": "Sébastien Ahouansou",
    };
    const followFarmerIds = new Set(following.map((r) => r.farmerId));
    const items: ProducerFeedItem[] = [];
    for (const lot of allLots as any[]) {
      const producerId = lot.producteurId ?? lot.farmerId;
      if (producerId && followFarmerIds.has(producerId)) {
        items.push(buildFeedItem(lot, farmerNames[producerId] ?? producerId, producerId));
      }
    }
    return items.slice(0, 10);
  }
}
