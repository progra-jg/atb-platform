export type ShipmentStatus = "preparing" | "picked_up" | "in_transit" | "customs" | "arrived" | "delivered" | "cancelled";

export type TransportMode = "road" | "air" | "sea" | "rail";

export interface TrackingEvent {
  id: string;
  shipmentId: string;
  status: ShipmentStatus;
  location: string;
  description: string;
  timestamp: string;
  actorName: string;
  coordinates?: { lat: number; lng: number };
}

export interface LogisticsShipment {
  id: string;
  orderId: string;
  lotId: string;
  crop: string;
  volumeKg: number;
  origin: string;
  destination: string;
  distanceKm: number;
  transportMode: TransportMode;
  status: ShipmentStatus;
  estimatedCost: number;
  actualCost?: number;
  estimatedDelivery: string;
  actualDelivery?: string;
  trackingEvents: TrackingEvent[];
  deliveryCode: string;
  deliveryConfirmed: boolean;
  confirmedBy?: string;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransportCostEstimate {
  distanceKm: number;
  volumeKg: number;
  transportMode: TransportMode;
  baseCost: number;
  fuelSurcharge: number;
  insuranceCost: number;
  handlingCost: number;
  totalCost: number;
  estimatedDays: number;
}

export interface LogisticsSummary {
  activeShipments: number;
  deliveredToday: number;
  inTransit: number;
  avgDeliveryDays: number;
  totalCostMonth: number;
}

export const LOGISTICS_STORAGE_KEY = "atb_logistics_v1";
export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  preparing: "logistics.status.preparing",
  picked_up: "logistics.status.pickedUp",
  in_transit: "logistics.status.inTransit",
  customs: "logistics.status.customs",
  arrived: "logistics.status.arrived",
  delivered: "logistics.status.delivered",
  cancelled: "logistics.status.cancelled",
};

export const TRANSPORT_MODES: { key: TransportMode; labelKey: string; icon: string; multiplier: number }[] = [
  { key: "road", labelKey: "logistics.mode.road", icon: "🚛", multiplier: 1.0 },
  { key: "sea",  labelKey: "logistics.mode.sea",  icon: "🚢", multiplier: 0.6 },
  { key: "air",  labelKey: "logistics.mode.air",  icon: "✈️", multiplier: 3.0 },
  { key: "rail", labelKey: "logistics.mode.rail", icon: "🚂", multiplier: 0.8 },
];

export function generateShipmentId(): string {
  return `SHP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export function generateDeliveryCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += "-";
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
