import api from "./api";
import type { ShipmentInfo, ShipmentStats, Milestone } from "../types/shipment";

const MOCK_CACHE = new Map<string, ShipmentInfo>();

const MILESTONES: Milestone[] = [
  { id: "collected", icon: "package", titleKey: "tracking.collected", descKey: "tracking.collectedDesc", date: "19/03/2024", location: "Parakou", status: "completed" },
  { id: "quality", icon: "check", titleKey: "tracking.qualityCheck", descKey: "tracking.qualityCheckDesc", date: "20/03/2024", location: "Hub Borgou", status: "completed" },
  { id: "transit", icon: "truck", titleKey: "tracking.inTransit", descKey: "tracking.inTransitDesc", date: "21/03/2024", location: "Route RNIE2", status: "active" },
  { id: "hub_arrival", icon: "building", titleKey: "tracking.hubArrival", descKey: "tracking.hubArrivalDesc", date: "22/03/2024", location: "Hub Atlantique", status: "pending" },
  { id: "delivery", icon: "check-circle", titleKey: "tracking.delivered", descKey: "tracking.deliveredDesc", date: "23/03/2024", location: "Cotonou", status: "pending" },
];

const DELIVERED_MILESTONES: Milestone[] = [
  { id: "collected", icon: "package", titleKey: "tracking.collected", descKey: "tracking.collectedDesc", date: "10/03/2024", location: "Kétou", status: "completed" },
  { id: "quality", icon: "check", titleKey: "tracking.qualityCheck", descKey: "tracking.qualityCheckDesc", date: "11/03/2024", location: "Hub Atlantique", status: "completed" },
  { id: "transit", icon: "truck", titleKey: "tracking.inTransit", descKey: "tracking.inTransitDesc", date: "12/03/2024", location: "Route RNIE1", status: "completed" },
  { id: "hub_arrival", icon: "building", titleKey: "tracking.hubArrival", descKey: "tracking.hubArrivalDesc", date: "13/03/2024", location: "Hub Cotonou", status: "completed" },
  { id: "delivery", icon: "check-circle", titleKey: "tracking.delivered", descKey: "tracking.deliveredDesc", date: "14/03/2024", location: "Zone industrielle, Cotonou", status: "completed" },
];

const PENDING_MILESTONES: Milestone[] = [
  { id: "collected", icon: "package", titleKey: "tracking.collected", descKey: "tracking.collectedDesc", date: "—", location: "—", status: "pending" },
  { id: "quality", icon: "check", titleKey: "tracking.qualityCheck", descKey: "tracking.qualityCheckDesc", date: "—", location: "—", status: "pending" },
  { id: "transit", icon: "truck", titleKey: "tracking.inTransit", descKey: "tracking.inTransitDesc", date: "—", location: "—", status: "pending" },
  { id: "hub_arrival", icon: "building", titleKey: "tracking.hubArrival", descKey: "tracking.hubArrivalDesc", date: "—", location: "—", status: "pending" },
  { id: "delivery", icon: "check-circle", titleKey: "tracking.delivered", descKey: "tracking.deliveredDesc", date: "—", location: "—", status: "pending" },
];

const DRIVERS = [
  { name: "Koffi Agossou", vehicle: "Toyota Hilux · AB 1234 CD", phone: "+229 97 81 23 45" },
  { name: "Sébastien Hounkpatin", vehicle: "Mercedes Sprinter · AB 5678 EF", phone: "+229 96 42 78 90" },
  { name: "Emmanuel Sossou", vehicle: "Renault Master · AB 9012 GH", phone: "+229 62 15 37 89" },
];

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms + Math.random() * ms));

function getMilestonesForStatus(status: string): Milestone[] {
  if (status === "Livrée") return DELIVERED_MILESTONES;
  if (status === "En attente") return PENDING_MILESTONES;
  return MILESTONES;
}

function getDriver() {
  return DRIVERS[Math.floor(Math.random() * DRIVERS.length)];
}

function buildShipment(orderId: string, status: string, culture: string, lotId: string, destination: string, weight: string): ShipmentInfo {
  const milestones = getMilestonesForStatus(status);
  const completed = milestones.filter((m) => m.status === "completed").length;
  const activeIdx = milestones.findIndex((m) => m.status === "active");
  const lastCompleted = milestones.filter((m) => m.status === "completed").pop();
  return {
    orderId,
    lotId,
    culture,
    status,
    milestones,
    currentLocation: lastCompleted?.location || destination,
    origin: lastCompleted?.location || "Hub producteur",
    destination,
    estimatedDelivery: status === "Livrée" ? "Livrée" : status === "En livraison" ? "22/03/2024" : "—",
    completedSteps: completed,
    totalSteps: milestones.length,
    driver: status === "En livraison" || status === "En transit" ? getDriver() : undefined,
    documents: [
      { label: "tracking.documents.packingList", type: "pdf", available: completed > 1 },
      { label: "tracking.documents.qualityCert", type: "pdf", available: completed > 1 },
      { label: "tracking.documents.transportDoc", type: "pdf", available: status !== "En attente" },
      { label: "tracking.documents.photoLoading", type: "image", available: completed > 2 },
      { label: "tracking.documents.deliveryNote", type: "pdf", available: status === "Livrée" },
    ],
    weight,
    recipient: "Votre entreprise",
    departureDate: completed > 0 ? "19/03/2024" : "—",
    activeStep: activeIdx >= 0 ? activeIdx : -1,
  } as ShipmentInfo;
}

export async function fetchShipmentByOrder(orderId: string, status: string, culture: string, lotId: string, destination: string, weight: string): Promise<ShipmentInfo> {
  try {
    const { data } = await api.get(`/shipments/by-order/${orderId}`);
    return data;
  } catch {
    await delay(200);
    const cached = MOCK_CACHE.get(orderId);
    if (cached) return cached;
    const shipment = buildShipment(orderId, status, culture, lotId, destination, weight);
    MOCK_CACHE.set(orderId, shipment);
    return shipment;
  }
}

export async function fetchShipmentStats(): Promise<ShipmentStats> {
  try {
    const { data } = await api.get("/shipments/stats");
    return data;
  } catch {
    await delay();
    return { active: 3, inTransit: 2, deliveredToday: 1, avgTransitDays: 4.2 };
  }
}
