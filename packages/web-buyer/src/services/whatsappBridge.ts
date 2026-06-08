import type { ShareLink } from "../types/referralV2";
import { getCropEmoji, formatTrend } from "../types/referralV2";

export function generateShareUrl(
  crop: string,
  price: number,
  change: number,
  history: number[],
  refCode: string,
): string {
  const base = `${window.location.origin}/price-card`;
  const params = new URLSearchParams({
    c: crop,
    p: price.toString(),
    ch: change.toString(),
    h: history.slice(-10).join(","),
    r: refCode,
  });
  return `${base}?${params.toString()}`;
}

export function parseShareUrl(
  search: string,
): { crop: string; price: number; change: number; history: number[]; refCode: string } | null {
  const params = new URLSearchParams(search);
  const crop = params.get("c");
  const priceStr = params.get("p");
  const changeStr = params.get("ch");
  const histStr = params.get("h");
  const refCode = params.get("r");
  if (!crop || !priceStr || !changeStr) return null;
  const price = parseFloat(priceStr);
  const change = parseFloat(changeStr);
  const history = histStr ? histStr.split(",").map(Number).filter((n) => !isNaN(n)) : [];
  return { crop, price, change, history, refCode: refCode ?? "" };
}

export function generateWhatsAppMessage(
  crop: string,
  price: number,
  change: number,
  refCode: string,
): ShareLink {
  const emoji = getCropEmoji(crop);
  const trend = formatTrend(change);
  const url = generateShareUrl(crop, price, change, [], refCode);
  const cropDisplay = crop.charAt(0).toUpperCase() + crop.slice(1).toLowerCase();
  const currency = "FCFA";

  const messageParts = [
    `${emoji} *${cropDisplay}*: ${price.toLocaleString("fr-FR")} ${currency}/kg ${trend}`,
    "",
    `📊 Découvrez les prix du marché en temps réel sur ATB AgriTrace`,
    `${url}`,
    "",
    `_Partagé via ATB AgriTrace — Votre marketplace agricole B2B_`,
  ];

  return {
    crop,
    price,
    change,
    history: [],
    refCode,
    url,
    message: messageParts.join("\n"),
  };
}

export function generateCropInsightMessage(
  crop: string,
  price: number,
  change: number,
  trend: "hausse" | "baisse" | "stable",
  recommendation: string,
  refCode: string,
): ShareLink {
  const emoji = getCropEmoji(crop);
  const cropDisplay = crop.charAt(0).toUpperCase() + crop.slice(1).toLowerCase();
  const trendEmoji = trend === "hausse" ? "📈" : trend === "baisse" ? "📉" : "📊";
  const url = generateShareUrl(crop, price, change, [], refCode);

  const messageParts = [
    `${emoji} ${trendEmoji} *Alerte Marché — ${cropDisplay}*`,
    "",
    `💰 Prix actuel: ${price.toLocaleString("fr-FR")} FCFA/kg`,
    `📊 Variation: ${change >= 0 ? "+" : ""}${change}%`,
    `💡 Conseil: ${recommendation}`,
    "",
    `👉 Découvrir: ${url}`,
    `_ATB AgriTrace — Intelligence de marché agricole_`,
  ];

  return {
    crop,
    price,
    change,
    history: [],
    refCode,
    url,
    message: messageParts.join("\n"),
  };
}
