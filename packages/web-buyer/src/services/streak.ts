import api from "./api";
import type { StreakData, StreakState, StreakMilestone } from "../types/streak";
import { STREAK_MILESTONES, STORAGE_KEY, MAX_HISTORY } from "../types/streak";

const LAST_SYNC_KEY = "atb_streak_last_sync";

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function defaultData(): StreakData {
  return {
    current: 0, longest: 0, lastActive: null, freezes: 5,
    history: [],
    milestones: STREAK_MILESTONES.map((m) => ({ ...m, achieved: false, achievedAt: null })),
  };
}

function migrateLegacy(): void {
  const old = localStorage.getItem("atb_streak");
  if (!old) return;
  try {
    const parsed = JSON.parse(old);
    if (parsed && typeof parsed === "object") {
      const data: StreakData = {
        current: parsed.current ?? 0, longest: parsed.longest ?? 0,
        lastActive: parsed.lastActive ?? null, freezes: parsed.freezes ?? 5,
        history: Array.isArray(parsed.history) ? parsed.history.slice(-MAX_HISTORY) : [],
        milestones: STREAK_MILESTONES.map((m) => {
          const existing = (parsed.milestones ?? []).find((em: StreakMilestone) => em.days === m.days);
          return existing ?? { ...m, achieved: false, achievedAt: null };
        }),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
    localStorage.removeItem("atb_streak");
  } catch {
    localStorage.removeItem("atb_streak");
  }
}

function loadLocal(): StreakData {
  migrateLegacy();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.current !== "number") return defaultData();
    return parsed as StreakData;
  } catch {
    return defaultData();
  }
}

function saveLocal(data: StreakData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

async function syncWithServer(userId: string): Promise<void> {
  const lastSync = localStorage.getItem(LAST_SYNC_KEY);
  const now = Date.now().toString();
  try {
    const local = loadLocal();
    const { data: server } = await api.post("/user/streak/sync", {
      userId, data: local, lastSync,
    });
    if (server) {
      saveLocal(server as StreakData);
    }
    localStorage.setItem(LAST_SYNC_KEY, now);
  } catch {
    /* offline — keep local */
  }
}

async function pushToServer(userId: string, data: StreakData): Promise<void> {
  try {
    await api.post("/user/streak/save", { userId, data });
    localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
  } catch {
    /* offline */
  }
}

function computeState(data: StreakData): StreakState {
  const now = today();
  const yest = yesterday();
  const last = data.lastActive;

  let isActiveToday = last === now;
  let isAtRisk = false;
  let atRiskDays = 0;

  if (!isActiveToday && last !== null) {
    const gap = daysBetween(last, now);
    if (gap === 1) { isAtRisk = true; atRiskDays = 1; }
    else if (gap > 1) { const canFreeze = data.freezes > 0 && gap <= 2; isAtRisk = canFreeze; atRiskDays = gap; }
  }

  const unachieved = data.milestones.filter((m) => !m.achieved);
  const nextMilestone = unachieved.length > 0 ? unachieved[0] : null;

  let progressToNext = 0;
  if (nextMilestone) {
    const prevDays = data.milestones.length > 0
      ? data.milestones.filter((m) => m.achieved).sort((a, b) => b.days - a.days) : [];
    const base = prevDays.length > 0 ? prevDays[0].days : 0;
    const range = nextMilestone.days - base;
    const currentInRange = data.current - base;
    progressToNext = range > 0 ? Math.min(Math.round((currentInRange / range) * 100), 100) : 0;
  }

  return { streak: data.current, longestStreak: data.longest, lastActive: data.lastActive,
    freezes: data.freezes, isActiveToday, isAtRisk, atRiskDays,
    milestones: data.milestones, nextMilestone, progressToNext };
}

export async function initStreak(userId: string): Promise<StreakState> {
  await syncWithServer(userId);
  return computeState(loadLocal());
}

export async function updateStreak(userId?: string): Promise<StreakState> {
  const data = loadLocal();
  const now = today();
  const yest = yesterday();
  const last = data.lastActive;

  if (last === now) return computeState(data);

  if (last === null) {
    data.current = 1; data.lastActive = now; data.history.push(now);
  } else if (last === yest) {
    data.current += 1; data.lastActive = now; data.history.push(now);
  } else {
    const gap = daysBetween(last, now);
    if (gap <= 2 && data.freezes > 0) {
      data.freezes -= 1; data.current += 1; data.lastActive = now; data.history.push(now);
    } else {
      data.current = 1; data.lastActive = now; data.history.push(now);
    }
  }

  if (data.history.length > MAX_HISTORY) data.history = data.history.slice(-MAX_HISTORY);
  if (data.current > data.longest) data.longest = data.current;

  data.milestones = STREAK_MILESTONES.map((m) => {
    const existing = data.milestones.find((em) => em.days === m.days);
    if (existing?.achieved) return existing;
    const achieved = data.current >= m.days;
    return { ...m, achieved, achievedAt: achieved ? now : null };
  }) as StreakMilestone[];

  saveLocal(data);
  if (userId) pushToServer(userId, data);
  return computeState(data);
}

export async function addFreeze(userId: string | undefined, amount: number = 1): Promise<StreakState> {
  const data = loadLocal();
  data.freezes += amount;
  saveLocal(data);
  if (userId) pushToServer(userId, data);
  return computeState(data);
}

export async function useFreeze(userId?: string): Promise<StreakState> {
  const data = loadLocal();
  if (data.freezes <= 0) return computeState(data);
  data.freezes -= 1;
  saveLocal(data);
  if (userId) pushToServer(userId, data);
  return computeState(data);
}

export function resetStreak(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("atb_streak");
  localStorage.removeItem(LAST_SYNC_KEY);
}

export function getStreakState(): StreakState {
  return computeState(loadLocal());
}
