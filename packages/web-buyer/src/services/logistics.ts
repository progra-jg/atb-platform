import api from "./api";
import type {
  LogisticsShipment, TrackingEvent, TransportCostEstimate,
  TransportMode, ShipmentStatus, LogisticsSummary,
} from "../types/logistics";
import {
  LOGISTICS_STORAGE_KEY, generateShipmentId, generateDeliveryCode,
  TRANSPORT_MODES,
} from "../types/logistics";

const SHIPMENT_STORE = new Map<string, LogisticsShipment>();

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms + Math.random() * ms));

function getLocal<T>(key: string): T[] {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T[] : []; }
  catch { return []; }
}
function setLocal<T>(key: string, data: T[]): void {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* noop */ }
}

export async function createShipment(params: {
  orderId: string; lotId: string; crop: string; volumeKg: number;
  origin: string; destination: string; distanceKm: number;
  transportMode: TransportMode; estimatedCost: number; estimatedDelivery: string;
}): Promise<LogisticsShipment> {
  try {
    const { data } = await api.post("/logistics/shipments", params);
    return data;
  } catch {
    await delay(400);
    const now = new Date().toISOString();
    const deliveryCode = generateDeliveryCode();
    const shipment: LogisticsShipment = {
      id: generateShipmentId(),
      orderId: params.orderId,
      lotId: params.lotId,
      crop: params.crop,
      volumeKg: params.volumeKg,
      origin: params.origin,
      destination: params.destination,
      distanceKm: params.distanceKm,
      transportMode: params.transportMode,
      status: "preparing",
      estimatedCost: params.estimatedCost,
      estimatedDelivery: params.estimatedDelivery,
      trackingEvents: [{
        id: `evt-${Date.now()}`,
        shipmentId: "",
        status: "preparing",
        location: params.origin,
        description: "Expédition en préparation",
        timestamp: now,
        actorName: "Système",
      }],
      deliveryCode,
      deliveryConfirmed: false,
      createdAt: now,
      updatedAt: now,
    };
    shipment.trackingEvents[0].shipmentId = shipment.id;
    SHIPMENT_STORE.set(shipment.id, shipment);
    const all = getLocal<LogisticsShipment>(LOGISTICS_STORAGE_KEY);
    all.unshift(shipment);
    setLocal(LOGISTICS_STORAGE_KEY, all);
    return shipment;
  }
}

export async function getShipment(shipmentId: string): Promise<LogisticsShipment | null> {
  try {
    const { data } = await api.get(`/logistics/shipments/${shipmentId}`);
    return data;
  } catch {
    await delay(150);
    return SHIPMENT_STORE.get(shipmentId) ??
      getLocal<LogisticsShipment>(LOGISTICS_STORAGE_KEY).find((s) => s.id === shipmentId) ?? null;
  }
}

export async function listShipments(): Promise<LogisticsShipment[]> {
  try {
    const { data } = await api.get("/logistics/shipments");
    return data;
  } catch {
    await delay(200);
    const all = getLocal<LogisticsShipment>(LOGISTICS_STORAGE_KEY);
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

export async function addTrackingEvent(
  shipmentId: string,
  status: ShipmentStatus,
  location: string,
  description: string,
  actorName: string,
): Promise<LogisticsShipment> {
  try {
    const { data } = await api.post(`/logistics/shipments/${shipmentId}/events`, {
      status, location, description, actorName,
    });
    return data;
  } catch {
    await delay(200);
    const shipment = SHIPMENT_STORE.get(shipmentId) ??
      getLocal<LogisticsShipment>(LOGISTICS_STORAGE_KEY).find((s) => s.id === shipmentId);
    if (!shipment) throw new Error("Shipment not found");

    const event: TrackingEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      shipmentId,
      status,
      location,
      description,
      timestamp: new Date().toISOString(),
      actorName,
    };
    shipment.trackingEvents.push(event);
    shipment.status = status;
    shipment.updatedAt = event.timestamp;
    if (status === "delivered") shipment.actualDelivery = event.timestamp;

    SHIPMENT_STORE.set(shipmentId, shipment);
    const all = getLocal<LogisticsShipment>(LOGISTICS_STORAGE_KEY);
    const idx = all.findIndex((s) => s.id === shipmentId);
    if (idx >= 0) all[idx] = shipment;
    setLocal(LOGISTICS_STORAGE_KEY, all);
    return shipment;
  }
}

export async function confirmDelivery(
  shipmentId: string,
  deliveryCode: string,
  confirmedBy: string,
): Promise<LogisticsShipment> {
  try {
    const { data } = await api.post(`/logistics/shipments/${shipmentId}/confirm`, { deliveryCode, confirmedBy });
    return data;
  } catch {
    await delay(200);
    const shipment = SHIPMENT_STORE.get(shipmentId) ??
      getLocal<LogisticsShipment>(LOGISTICS_STORAGE_KEY).find((s) => s.id === shipmentId);
    if (!shipment) throw new Error("Expédition introuvable");
    if (shipment.deliveryCode !== deliveryCode) throw new Error("Code de livraison invalide");

    const event: TrackingEvent = {
      id: `evt-${Date.now()}`,
      shipmentId,
      status: "delivered",
      location: shipment.destination,
      description: "Livraison confirmée par le destinataire",
      timestamp: new Date().toISOString(),
      actorName: confirmedBy,
    };
    shipment.trackingEvents.push(event);
    shipment.status = "delivered";
    shipment.deliveryConfirmed = true;
    shipment.confirmedBy = confirmedBy;
    shipment.confirmedAt = event.timestamp;
    shipment.actualDelivery = event.timestamp;
    shipment.updatedAt = event.timestamp;

    SHIPMENT_STORE.set(shipmentId, shipment);
    const all = getLocal<LogisticsShipment>(LOGISTICS_STORAGE_KEY);
    const idx = all.findIndex((s) => s.id === shipmentId);
    if (idx >= 0) all[idx] = shipment;
    setLocal(LOGISTICS_STORAGE_KEY, all);
    return shipment;
  }
}

export async function estimateTransportCost(
  distanceKm: number,
  volumeKg: number,
  transportMode: TransportMode,
): Promise<TransportCostEstimate> {
  try {
    const { data } = await api.post("/logistics/estimate", { distanceKm, volumeKg, transportMode });
    return data;
  } catch {
    await delay(300);
    const mode = TRANSPORT_MODES.find((m) => m.key === transportMode) ?? TRANSPORT_MODES[0];
    const baseRate = 50;
    const baseCost = distanceKm * volumeKg * baseRate * mode.multiplier / 1000;
    const fuelSurcharge = baseCost * 0.12;
    const insuranceCost = baseCost * 0.03;
    const handlingCost = volumeKg * 5;
    const speedMap = { road: 2, air: 0.5, sea: 10, rail: 3 };
    const speed = speedMap[transportMode] ?? 2;
    return {
      distanceKm, volumeKg, transportMode,
      baseCost: Math.round(baseCost),
      fuelSurcharge: Math.round(fuelSurcharge),
      insuranceCost: Math.round(insuranceCost),
      handlingCost: Math.round(handlingCost),
      totalCost: Math.round(baseCost + fuelSurcharge + insuranceCost + handlingCost),
      estimatedDays: Math.max(1, Math.round((distanceKm / 500) * speed)),
    };
  }
}

export async function getLogisticsSummary(): Promise<LogisticsSummary> {
  try {
    const { data } = await api.get("/logistics/summary");
    return data;
  } catch {
    await delay(150);
    const all = getLocal<LogisticsShipment>(LOGISTICS_STORAGE_KEY);
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return {
      activeShipments: all.filter((s) => ["preparing", "picked_up", "in_transit", "customs", "arrived"].includes(s.status)).length,
      deliveredToday: all.filter((s) => s.status === "delivered" && s.actualDelivery?.startsWith(today)).length,
      inTransit: all.filter((s) => s.status === "in_transit").length,
      avgDeliveryDays: 4.2,
      totalCostMonth: all
        .filter((s) => s.createdAt >= monthStart)
        .reduce((sum, s) => sum + (s.actualCost ?? s.estimatedCost), 0),
    };
  }
}
