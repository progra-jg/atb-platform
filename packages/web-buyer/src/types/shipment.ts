export type MilestoneStatus = "completed" | "active" | "pending";

export interface Milestone {
  id: string;
  icon: string;
  title?: string;
  titleKey: string;
  description?: string;
  descKey: string;
  date: string;
  location: string;
  status: MilestoneStatus;
}

export interface ShipmentDocument {
  label: string;
  type: "pdf" | "image" | "xls";
  available: boolean;
}

export interface ShipmentInfo {
  orderId: string;
  lotId: string;
  culture: string;
  status: string;
  milestones: Milestone[];
  currentLocation: string;
  origin: string;
  destination: string;
  estimatedDelivery: string;
  completedSteps: number;
  totalSteps: number;
  driver?: { name: string; phone: string; vehicle: string };
  documents: ShipmentDocument[];
  weight?: string;
  recipient?: string;
  departureDate?: string;
}

export interface ShipmentStats {
  active: number;
  inTransit: number;
  deliveredToday: number;
  avgTransitDays: number;
}
