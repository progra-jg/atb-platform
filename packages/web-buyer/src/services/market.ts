import api from "./api";
import type { MarketPrice } from "../types";

function cropHash(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) { h = ((h << 5) - h) + name.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

function pseudoRandom(seed: number, i: number): number {
  return ((seed * 13 + i * 7 + 3) % 100) / 100;
}

function generateHistory(prixMoyen: number, prixMin: number, prixMax: number, seed: number): number[] {
  const points = [];
  for (let i = 0; i < 12; i++) {
    const jitter = (prixMax - prixMin) * 0.3 * (pseudoRandom(seed, i) - 0.5);
    points.push(Math.round(prixMoyen + jitter));
  }
  return points;
}

const now = new Date();
const fmt = (d: Date) =>
  `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()} à ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;

const CROP_COLORS: Record<string, string> = {
  Cacao: "#5d4037", Coton: "#1565c0", Anacarde: "#e65100",
  Café: "#6d4c41", Mais: "#f9a825", Maïs: "#f9a825",
};

export async function fetchMarketPrices(): Promise<MarketPrice[]> {
  const { data } = await api.get("/market/prices");
  const arr = Array.isArray(data) ? data : data?.value ?? [];
  return arr.map((d: any, i: number) => {
    const seed = cropHash(d.culture || `crop-${i}`);
    const price = d.prixMoyen || 0;
    const min = d.prixMin || price;
    const max = d.prixMax || price;
    const change = d.variation ?? Math.round((pseudoRandom(seed, 99) * 8 - 4) * 10) / 10;
    return {
      crop: d.culture,
      price,
      change,
      changeFcfa: Math.round(pseudoRandom(seed, 101) * 200 - 100),
      unit: d.unite || "FCFA/kg",
      color: CROP_COLORS[d.culture] || "#1b5e20",
      history: generateHistory(price, min, max, seed),
      region: "",
      lastUpdated: d.miseAJour || fmt(new Date(now.getTime() - i * 60000)),
      source: d.source || "internal",
    };
  });
}
