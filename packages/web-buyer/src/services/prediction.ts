const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export interface PredictionPoint {
  date: string;
  predicted: number;
  lower: number;
  upper: number;
}

export interface PredictionSummary {
  crop: string;
  region: string;
  nextWeek: { predicted: number; lower: number; upper: number; trend: "up" | "down" | "stable" };
  nextMonth: { predicted: number; lower: number; upper: number; trend: "up" | "down" | "stable" };
  nextQuarter: { predicted: number; lower: number; upper: number; trend: "up" | "down" | "stable" };
  generatedAt: string;
}

const delay = (ms = 500) => new Promise(r => setTimeout(r, ms + Math.random() * 400));

function generateMockPrediction(basePrice: number): PredictionPoint[] {
  const today = new Date();
  const points: PredictionPoint[] = [];
  for (let i = 1; i <= 90; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const seasonal = Math.sin((i / 365) * 2 * Math.PI * 12) * basePrice * 0.1;
    const trend = basePrice * 0.0005 * i;
    const noise = (Math.random() - 0.5) * basePrice * 0.02;
    const predicted = basePrice + seasonal + trend + noise;
    const ci = basePrice * 0.05 * Math.sqrt(i);
    points.push({ date: date.toISOString().split("T")[0], predicted: Math.round(predicted), lower: Math.round(predicted - ci), upper: Math.round(predicted + ci) });
  }
  return points;
}

export async function fetchPredictions(crop: string, region: string, days = 90): Promise<PredictionPoint[]> {
  try {
    const res = await fetch(`${API_BASE}/prediction/${encodeURIComponent(crop)}/${encodeURIComponent(region)}?days=${days}`);
    const d = await res.json();
    return d.data || [];
  } catch {
    await delay();
    return generateMockPrediction(500 + Math.random() * 500);
  }
}

export async function generatePredictions(crop: string, region: string, days = 90): Promise<PredictionPoint[]> {
  try {
    const res = await fetch(`${API_BASE}/prediction/generate`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ crop, region, days }),
    });
    const d = await res.json();
    return d.data || [];
  } catch {
    await delay(1500);
    return generateMockPrediction(500 + Math.random() * 500);
  }
}

export function getTrend(current: number, previous: number): "up" | "down" | "stable" {
  const diff = ((current - previous) / previous) * 100;
  if (diff > 1) return "up";
  if (diff < -1) return "down";
  return "stable";
}
