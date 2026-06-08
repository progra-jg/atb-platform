import api from "./api";
import type {
  Cooperative, CooperativeMember, CooperativeInvite, CooperativeStats,
} from "../types/cooperative";
import {
  COOPERATIVE_STORAGE_KEY, COOPERATIVE_INVITES_KEY,
  generateCooperativeSlug,
} from "../types/cooperative";

const STORE = new Map<string, Cooperative>();
const INVITES_STORE = new Map<string, CooperativeInvite>();

let coopIdCounter = 0;
let memberIdCounter = 0;
let inviteIdCounter = 0;
const nextCoopId = () => `COOP-${String(++coopIdCounter).padStart(4, "0")}`;
const nextMemberId = () => `CMEM-${String(++memberIdCounter).padStart(4, "0")}`;
const nextInviteId = () => `CINV-${String(++inviteIdCounter).padStart(4, "0")}`;

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms + Math.random() * ms));

function getLocal<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch { return []; }
}
function setLocal<T>(key: string, data: T[]): void {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* noop */ }
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

export async function createCooperative(
  name: string,
  region: string,
  department: string,
  commune: string,
  description: string,
  presidentId: string,
  presidentName: string,
  mainCrops: string[],
): Promise<Cooperative> {
  try {
    const { data } = await api.post("/cooperative", {
      name, region, department, commune, description,
      presidentId, presidentName, mainCrops,
    });
    return data;
  } catch {
    await delay(400);
    const id = nextCoopId();
    const slug = generateCooperativeSlug(name);
    const inviteCode = generateInviteCode();
    const now = new Date().toISOString();
    const coop: Cooperative = {
      id, name, slug, region, department, commune, description,
      foundedAt: now,
      memberCount: 1, activeMemberCount: 1,
      totalLots: 0, totalVolumeKg: 0, totalRevenueXof: 0,
      avgRating: 0, mainCrops, certificationLabels: [],
      presidentName, presidentId, inviteCode,
      members: [{
        id: nextMemberId(),
        cooperativeId: id,
        name: presidentName,
        email: "",
        phone: "",
        role: "president",
        joinedAt: now,
        lotsCount: 0, totalVolumeKg: 0, totalRevenueXof: 0,
        rating: 0, isActive: true,
        avatarInitial: presidentName.charAt(0).toUpperCase(),
      }],
      createdAt: now, updatedAt: now,
    };
    STORE.set(id, coop);
    const all = getLocal<Cooperative>(COOPERATIVE_STORAGE_KEY);
    all.push(coop);
    setLocal(COOPERATIVE_STORAGE_KEY, all);
    return coop;
  }
}

export async function getCooperative(id: string): Promise<Cooperative | null> {
  try {
    const { data } = await api.get(`/cooperative/${id}`);
    return data;
  } catch {
    await delay(200);
    return STORE.get(id) ?? null;
  }
}

export async function getCooperativeByInvite(code: string): Promise<Cooperative | null> {
  const trimmed = code.trim().toUpperCase();
  try {
    const { data } = await api.get("/cooperative/by-invite", { params: { code: trimmed } });
    return data;
  } catch {
    await delay(200);
    for (const coop of STORE.values()) {
      if (coop.inviteCode === trimmed) return coop;
    }
    return null;
  }
}

export async function listCooperatives(): Promise<Cooperative[]> {
  try {
    const { data } = await api.get("/cooperative");
    return data;
  } catch {
    await delay(200);
    return Array.from(STORE.values());
  }
}

export async function joinCooperative(
  cooperativeId: string,
  name: string,
  email: string,
  phone: string,
): Promise<CooperativeMember> {
  try {
    const { data } = await api.post(`/cooperative/${cooperativeId}/join`, { name, email, phone });
    return data;
  } catch {
    await delay(300);
    const coop = STORE.get(cooperativeId);
    if (!coop) throw new Error("Cooperative not found");
    const member: CooperativeMember = {
      id: nextMemberId(),
      cooperativeId,
      name, email, phone,
      role: "member",
      joinedAt: new Date().toISOString(),
      lotsCount: 0, totalVolumeKg: 0, totalRevenueXof: 0,
      rating: 0, isActive: true,
      avatarInitial: name.charAt(0).toUpperCase(),
    };
    coop.members.push(member);
    coop.memberCount = coop.members.length;
    coop.activeMemberCount = coop.members.filter((m) => m.isActive).length;
    coop.updatedAt = new Date().toISOString();
    STORE.set(cooperativeId, coop);
    const all = getLocal<Cooperative>(COOPERATIVE_STORAGE_KEY);
    const idx = all.findIndex((c) => c.id === cooperativeId);
    if (idx >= 0) all[idx] = coop;
    setLocal(COOPERATIVE_STORAGE_KEY, all);
    return member;
  }
}

export async function getCooperativesForUser(userId: string): Promise<Cooperative[]> {
  try {
    const { data } = await api.get("/cooperative/user", { params: { userId } });
    return data;
  } catch {
    await delay(200);
    return Array.from(STORE.values()).filter(
      (c) => c.members.some((m) => m.id === userId || c.presidentId === userId),
    );
  }
}

export async function getCooperativeStats(): Promise<CooperativeStats> {
  try {
    const { data } = await api.get("/cooperative/stats");
    return data;
  } catch {
    await delay(200);
    const all = Array.from(STORE.values());
    const regionMap = new Map<string, number>();
    const cropMap = new Map<string, number>();
    all.forEach((c) => {
      regionMap.set(c.region, (regionMap.get(c.region) ?? 0) + 1);
      c.mainCrops.forEach((cr) => cropMap.set(cr, (cropMap.get(cr) ?? 0) + 1));
    });
    return {
      totalCooperatives: all.length,
      totalMembers: all.reduce((s, c) => s + c.memberCount, 0),
      totalLots: all.reduce((s, c) => s + c.totalLots, 0),
      totalVolumeKg: all.reduce((s, c) => s + c.totalVolumeKg, 0),
      totalRevenueXof: all.reduce((s, c) => s + c.totalRevenueXof, 0),
      topRegions: [...regionMap.entries()].map(([region, count]) => ({ region, count })),
      topCrops: [...cropMap.entries()].map(([crop, count]) => ({ crop, count })),
      memberGrowth: [{ month: "2024-01", count: all.length }],
    };
  }
}
