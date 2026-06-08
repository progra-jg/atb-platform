export type UserRole = "producteur" | "acheteur" | "transporteur" | "intermediaire" | "agent";

export interface User {
  id: string;
  email: string;
  company: string;
  country: string;
  role: UserRole;
  phone: string;
  kycLevel: 0 | 1 | 2 | 3;
  badge: "bronze" | "argent" | "or" | "";
  trustScore: number;
  creditScore: number;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// ---- Lot ----
export interface Lot {
  id: string;
  producteurId: string;
  culture: string;
  origine: string;
  region: string;
  quantite: number;
  unite: string;
  certification: string;
  statut: "Disponible" | "Reserve" | "Vendu" | "En transit";
  prix: number;
  qualite: string;
  photos: string[];
  gpsCoords: [number, number];
  producteur: string;
  cooperative: string;
  badge: string;
  createdAt: string;
}

// ---- Appel d'offre ----
export interface AppelOffre {
  id: string;
  acheteurId: string;
  acheteur: string;
  culture: string;
  quantiteMin: number;
  quantiteMax: number;
  prixMin: number;
  prixMax: number;
  region: string;
  qualite: string;
  dateLimite: string;
  statut: "ouvert" | "clos" | "attribue";
  createdAt: string;
}

// ---- Transaction ----
export interface Transaction {
  id: string;
  lotId: string;
  acheteurId: string;
  producteurId: string;
  transporteurId?: string;
  intermediaireId?: string;
  montant: number;
  statut: "negociation" | "commerce_act" | "en_livraison" | "livree" | "conteste";
  createdAt: string;
  escrowRef?: string;
  commerceActId?: string;
}

// ---- Commerce Act ----
export interface CommerceAct {
  id: string;
  transactionId: string;
  producteurId: string;
  acheteurId: string;
  transporteurId?: string;
  montant: number;
  produit: string;
  quantite: number;
  prixUnitaire: number;
  lieu: string;
  gpsCoords: [number, number];
  temoins: Temoin[];
  photoPreuve?: PhotoPreuve;
  qrSeal: string;
  blockchainHash: string;
  pdfUrl: string;
  signedAt: string;
  createdAt: string;
}

export interface Temoin {
  nom: string;
  phone: string;
  role: string;
}

export interface PhotoPreuve {
  uri: string;
  etalonnage: EtalonnageMetrique;
  hash: string;
  takenAt: string;
}

export interface EtalonnageMetrique {
  objet: "regle" | "billet" | "piece" | "smartphone";
  tailleRefMm: number;
  pixelsParMm: number;
  largeurEstimeeMm: number;
  hauteurEstimeeMm: number;
}

// ---- Transport ----
export interface MissionTransport {
  id: string;
  transporteurId: string;
  transactionId: string;
  origine: string;
  destination: string;
  corridor: string;
  dateChargement: string;
  dateEstimeeArrivee: string;
  statut: "affectee" | "chargee" | "en_route" | "arrivee" | "livree";
  groupageId?: string;
  avanceCarburant: number;
  avanceVersee: boolean;
  checkpoints: Checkpoint[];
}

export interface Checkpoint {
  nom: string;
  type: "peage" | "pesage" | "carrefour";
  ussdCode: string;
  checkedAt?: string;
  gpsCoords?: [number, number];
}

export interface Groupage {
  id: string;
  corridor: string;
  missionIds: string[];
  lots: { lotId: string; quantite: number; producteurId: string }[];
  pointCollecte: string;
  gpsCollecte: [number, number];
  dateGroupement: string;
  coutProrata: { producteurId: string; montant: number }[];
}

// ---- Paiement ----
export type PayoutStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

export interface PayoutRecord {
  id: string;
  paymentId: string;
  orderId: string;
  producteurId: string;
  amount: number;
  currency: string;
  method: string;
  provider: string;
  phone: string;
  providerRef?: string;
  status: PayoutStatus;
  statusMessage?: string;
  completedAt?: string;
  createdAt: string;
}

export interface PayoutStats {
  totalDisbursed: number;
  totalTransactions: number;
  successRate: number;
  byProvider: { provider: string; count: number; volume: number }[];
  pendingCount: number;
}

// ---- Finance ----
export interface FinancingOffer {
  id: string;
  inputType: string;
  label: string;
  maxAmount: number;
  interestRate: number;
  durationDays: number;
  minTrustScore: number;
  collateralRequired: string[];
  active: boolean;
}

export interface FinancingContract {
  id: string;
  producteurId: string;
  amount: number;
  totalRepayable: number;
  status: "active" | "repaid" | "defaulted";
  dueDate: string;
  schedule: RepaymentSchedule[];
  createdAt: string;
}

export interface RepaymentSchedule {
  dueDate: string;
  amount: number;
  status: "pending" | "paid" | "overdue";
  paidAmount?: number;
}

export interface FinancingEligibility {
  eligible: boolean;
  score: number;
  maxAmount: number;
  availableOffers: FinancingOffer[];
  activeContracts: number;
  repaymentRate: number;
}

// ---- KYC ----
export type KycLevel = 0 | 1 | 2 | 3;

export interface KycSubmission {
  level: KycLevel;
  cniPhoto?: string;
  cniNumber?: string;
  selfiePhoto?: string;
  residenceProof?: string;
  fieldAgentId?: string;
  fieldAgentPhoto?: string;
  status: "pending" | "verified" | "rejected";
  verifiedAt?: string;
}

// ---- Corridor de prix ----
export interface CorridorPrix {
  produit: string;
  region: string;
  qualite: string;
  prixMin: number;
  prixMax: number;
  spread: number;
  spreadPercent: number;
  confiance: number;
  tendance: "hausse" | "baisse" | "stable";
}

// ---- Marché du Soir ----
export interface BulletinPrix {
  date: string;
  produits: CorridorPrix[];
  source: string;
}

// ---- Badge ----
export interface Badge {
  niveau: "bronze" | "argent" | "or";
  seuilVentes: number;
  seuilConformite: number;
  acquiredAt?: string;
}

// ---- Maillage de confiance ----
export interface ReputationNode {
  userId: string;
  role: UserRole;
  score: number;
  badge: string;
  connexions: string[];
  transactionsReussies: number;
  tauxConformite: number;
}

// ---- Talkie ----
export interface TalkieMessage {
  id: string;
  fromId: string;
  toId: string;
  audioUri: string;
  durationSec: number;
  transcript?: string;
  sentAt: string;
  lu: boolean;
}

// ---- Prévisions ----
export interface Prevision {
  produit: string;
  region: string;
  prixPrediction: number;
  volumePrediction: number;
  intervalleConfiance: [number, number];
  saison: string;
  modelVersion: string;
  generatedAt: string;
}
