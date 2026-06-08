import type { Lot } from "../types";

const STORAGE_KEY = "atb_farmer_lots";

function loadRaw(): Record<string, Lot> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveRaw(data: Record<string, Lot>): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { }
}

let idCounter = Date.now();
function generateId(): string {
  return `FARM-${(++idCounter).toString(36).toUpperCase()}`;
}

export function getFarmerLots(farmerId: string): Lot[] {
  const all = loadRaw();
  return Object.values(all).filter((l) => l.producteurId === farmerId);
}

export function getFarmerLotById(lotId: string): Lot | null {
  const all = loadRaw();
  return all[lotId] ?? null;
}

export function createFarmerLot(data: Record<string, any>): Lot {
  const all = loadRaw();
  const id = generateId();
  const now = new Date();
  const date = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
  const lot: Lot = {
    id,
    culture: data.culture,
    origine: data.origine ?? "",
    region: data.region ?? "",
    quantite: data.quantite,
    certification: data.certification ?? "",
    statut: data.statut ?? "Disponible",
    prix: data.prix,
    producteur: data.producteur ?? "",
    producteurId: data.producteurId ?? "",
    cooperative: data.cooperative ?? "",
    note: data.note ?? 75,
    date,
    phone: data.phone ?? "",
    images: data.images,
    harvest: data.harvest,
    stockQuality: data.stockQuality,
    labResults: data.labResults,
  };
  all[id] = lot;
  saveRaw(all);
  return lot;
}

export function updateFarmerLot(lotId: string, data: Partial<Omit<Lot, "id">>): Lot | null {
  const all = loadRaw();
  if (!all[lotId]) return null;
  const updated = {
    ...all[lotId],
    ...data,
    prix: data.prix !== undefined ? (typeof data.prix === "string" ? Number(data.prix) : data.prix) : all[lotId].prix,
    note: data.note !== undefined ? (typeof data.note === "string" ? Number(data.note) : data.note) : all[lotId].note,
  };
  all[lotId] = updated;
  saveRaw(all);
  return updated;
}

export function deleteFarmerLot(lotId: string): boolean {
  const all = loadRaw();
  if (!all[lotId]) return false;
  delete all[lotId];
  saveRaw(all);
  return true;
}

export function getAllFarmerLots(): Lot[] {
  return Object.values(loadRaw());
}
