export type OrderStatus = "En attente" | "Dépôt reçu" | "Confirmée" | "En inspection" | "Prêt au hub" | "En livraison" | "Livrée";

export interface VerificationPoint {
  id: string;
  name: string;
  region: string;
  ville: string;
  cooperative: string;
  coordinates: [number, number];
  capacityTonnes: number;
  services: string[];
  contact: string;
  inspectionFeeFcfa: number;
}

export interface DeliveryAddress {
  rue: string;
  ville: string;
  region: string;
  pays: string;
  phone: string;
}

export interface LotMedia {
  id: string;
  url: string;
  thumbnail?: string;
  caption: string;
  type: "product" | "field" | "harvest" | "certification" | "lab";
}

export interface LotHarvest {
  date?: string;
  location?: string;
  year?: string;
  conditions?: string;
  qualityGrade?: string;
}

export interface LotStockQuality {
  moisture?: string;
  impurities?: string;
  defects?: string;
  netWeight?: string;
  grossWeight?: string;
  packaging?: string;
  packagingDate?: string;
  storageLocation?: string;
  storageConditions?: string;
}

export interface LotLabResult {
  id: string;
  type: string;
  parameter: string;
  result: string;
  method: string;
  date: string;
  laboratory: string;
}

export interface Lot {
  id: string;
  culture: string;
  origine: string;
  region: string;
  quantite: string;
  certification: string;
  statut: "Disponible" | "En transit" | "Vendu";
  prix: number;
  producteur: string;
  producteurId?: string;
  cooperative: string;
  note: number;
  date: string;
  phone: string;
  images?: LotMedia[];
  harvest?: LotHarvest;
  stockQuality?: LotStockQuality;
  labResults?: LotLabResult[];
}

export interface TimelineStep {
  step: number;
  title: string;
  date: string;
  lieu: string;
  acteur: string;
  desc: string;
  status: "completed" | "active" | "pending";
}

export interface Certificate {
  id: string;
  type: string;
  lot: string;
  culture: string;
  statut: string;
  emis: string;
  expire: string;
  emetteur: string;
  format: string;
  blockchain?: boolean;
}

export interface Order {
  id: string;
  lot: string;
  culture: string;
  quantite: string;
  prixUnitaire: string;
  total: string;
  statut: OrderStatus;
  date: string;
  livraison: string;
  verificationPointId?: string;
  verificationPointName?: string;
  deliveryAddress?: DeliveryAddress;
  transportOption?: "hub" | "door";
  escrowDeposit?: number;
  escrowTotal?: number;
  escrowReleaseDate?: string;
  timeline?: TimelineStep[];
  buyerId?: string;
  producteurId?: string;
}

export interface Review {
  id: string;
  orderId: string;
  rating: number;
  comment: string | null;
  buyerName: string;
  createdAt: string;
}

export interface ReviewSubmission {
  orderId: string;
  buyerId: string;
  rating: number;
  comment?: string;
}

export interface DashboardStat {
  labelKey: string;
  value: string;
  sub: string;
  color: string;
  bg: string;
}

export interface MarketPrice {
  crop: string;
  price: number;
  change: number;
  changeFcfa: number;
  unit: string;
  color: string;
  history: number[];
  region: string;
  lastUpdated: string;
  source?: string;
}

export interface NotificationItem {
  id: string | number;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
}

export interface PriceAlert {
  id: string;
  crop: string;
  direction: "above" | "below";
  targetPrice: number;
  createdAt: string;
  triggered: boolean;
}

export interface Weighing {
  date: string;
  weight: number;
  culture: string;
  lotId: string;
  deviceId: string;
}

export interface BlockchainTx {
  hash: string;
  block: string;
  timestamp: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: "Vente" | "Livraison" | "Avance" | "Paiement";
  montant: string;
  statut: string;
  blockchain?: BlockchainTx;
}

export interface Parcelle {
  id: string;
  culture: string;
  superficie: number;
  coordinates: [number, number][];
}

export interface YieldPrediction {
  predicted: number;
  unit: string;
  confidence: number;
  confidenceInterval: string;
  modelVersion: string;
  lastUpdated: string;
  history: { year: string; value: number }[];
}

export interface EUDRCompliance {
  compliant: boolean;
  deforestationDetected: boolean;
  lastAnalysis: string;
  satelliteSource: string;
  ndviScore: number;
  details: string;
}

export interface FarmerCard {
  anonymousId: string;
  displayName: string;
  cooperative: string;
  localisation: string;
  experience: number;
  didVerified: boolean;
  credibilityScore: number;
  trustIndex: number;
  totalTracedVolume: number;
  volumeUnit: string;
  culture: string;
  superficie: number;
  parcelleCount: number;
}

export interface FarmerProfile {
  anonymousId: string;
  anonymous?: boolean;
  displayName: string;
  cooperative: string;
  localisation: string;
  region: string;
  experience: number;
  didVerified: boolean;
  didHash?: string;
  credibilityScore: number;
  trustIndex: number;
  totalTracedVolume: number;
  volumeUnit: string;
  superficie: number;
  parcelleCount: number;
  parcelles: Parcelle[];
  center: [number, number];
  eudr: EUDRCompliance;
  yieldPrediction: YieldPrediction;
  timeline: TimelineStep[];
  certifications: {
    id: string;
    type: string;
    emetteur: string;
    emis: string;
    expire: string;
    statut: string;
    blockchain: boolean;
  }[];
  recentWeighings: Weighing[];
  transactions: Transaction[];
  contact: {
    managerName: string;
    phone: string;
    email: string;
  };
}


