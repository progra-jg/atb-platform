import { enqueueAction, cacheSet, cacheGet } from "../storage/offline";
import { Platform } from "react-native";

export interface OfflineLot {
  id: string;
  culture: string;
  variete?: string;
  quantite: number;
  unite: string;
  prix: number;
  region: string;
  origine: string;
  qualite: string;
  certification?: string;
  gps?: [number, number];
  producteur: string;
  producteurId: string;
  statut: string;
  synced: boolean;
  createdOffline: boolean;
  createdAt: string;
}

export async function createLotOffline(lot: Omit<OfflineLot, "id" | "synced" | "createdOffline" | "createdAt">): Promise<OfflineLot> {
  const newLot: OfflineLot = {
    ...lot,
    id: `offline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    synced: false,
    createdOffline: true,
    createdAt: new Date().toISOString(),
  };
  const existing = (await cacheGet<OfflineLot[]>("producer_lots")) || [];
  existing.unshift(newLot);
  await cacheSet("producer_lots", existing);
  await enqueueAction("lots/create", {
    culture: lot.culture,
    variete: lot.variete,
    quantite: lot.quantite,
    unite: lot.unite,
    prix: lot.prix,
    region: lot.region,
    origine: lot.origine,
    qualite: lot.qualite,
    certification: lot.certification,
    gps: lot.gps,
  });
  return newLot;
}

export async function getOfflineLots(): Promise<OfflineLot[]> {
  return (await cacheGet<OfflineLot[]>("producer_lots")) || [];
}

export async function updateLotOfflineStatus(id: string, updates: Partial<OfflineLot>): Promise<void> {
  const lots = await getOfflineLots();
  const idx = lots.findIndex(l => l.id === id);
  if (idx === -1) return;
  lots[idx] = { ...lots[idx], ...updates };
  await cacheSet("producer_lots", lots);
}

export async function markLotSynced(id: string): Promise<void> {
  await updateLotOfflineStatus(id, { synced: true, createdOffline: false });
}

export async function mergeServerLots(serverLots: any[]): Promise<OfflineLot[]> {
  const localLots = await getOfflineLots();
  const unsyncedLocal = localLots.filter(l => l.createdOffline && !l.synced);
  const serverMapped: OfflineLot[] = serverLots.map((s: any) => ({
    id: s.id,
    culture: s.culture,
    variete: s.variete,
    quantite: s.quantite,
    unite: s.unite || "kg",
    prix: s.prix,
    region: s.region,
    origine: s.origine || s.region,
    qualite: s.qualite,
    certification: s.certification,
    gps: s.gps,
    producteur: s.producteur || s.producteurNom || "",
    producteurId: s.producteurId || "",
    statut: s.statut || "disponible",
    synced: true,
    createdOffline: false,
    createdAt: s.createdAt || new Date().toISOString(),
  }));
  const merged = [...unsyncedLocal, ...serverMapped];
  await cacheSet("producer_lots", merged);
  return merged;
}
