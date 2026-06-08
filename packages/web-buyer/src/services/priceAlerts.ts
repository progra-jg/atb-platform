import type { PriceAlert, MarketPrice } from "../types";

const STORAGE_KEY = "atb_price_alerts";

function getStored(): PriceAlert[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

function setStored(alerts: PriceAlert[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
}

export function getAlerts(): PriceAlert[] {
  return getStored();
}

export function addAlert(alert: Omit<PriceAlert, "id" | "createdAt" | "triggered">): PriceAlert {
  const alerts = getStored();
  const newAlert: PriceAlert = {
    ...alert,
    id: `alert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    triggered: false,
  };
  alerts.push(newAlert);
  setStored(alerts);
  return newAlert;
}

export function removeAlert(id: string) {
  setStored(getStored().filter((a) => a.id !== id));
}

export function checkAlerts(prices: MarketPrice[]): PriceAlert[] {
  const alerts = getStored();
  const triggered: PriceAlert[] = [];
  const updated = alerts.map((alert) => {
    const market = prices.find((p) => p.crop === alert.crop);
    if (!market || alert.triggered) return alert;
    const matches = alert.direction === "above"
      ? market.price >= alert.targetPrice
      : market.price <= alert.targetPrice;
    if (matches) {
      triggered.push({ ...alert, triggered: true });
      return { ...alert, triggered: true };
    }
    return alert;
  });
  if (triggered.length > 0) setStored(updated);
  return triggered;
}
