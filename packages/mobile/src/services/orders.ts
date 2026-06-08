import { cacheGet, cacheSet } from "../storage/offline";

export type OrderStatus = "negociation" | "commerce_act" | "escrow_depose" | "en_livraison" | "livree" | "conteste" | "remboursee";

export interface OrderEvent {
  date: string;
  statut: OrderStatus;
  description: string;
  acteur: string;
}

export interface Order {
  id: string;
  lotId: string;
  producteurId: string;
  acheteurId: string;
  transporteurId?: string;
  produit: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
  montantTotal: number;
  statut: OrderStatus;
  escrowRef?: string;
  escrowMontant?: number;
  fraisSequestre?: number;
  commerceActId?: string;
  missionTransportId?: string;
  dateCreation: string;
  dateLivraisonPrevue?: string;
  dateLivraisonReelle?: string;
  acheteurNom: string;
  transporteurNom?: string;
  events: OrderEvent[];
}

const MOCK_ORDERS: Order[] = [
  {
    id: "CMD-001", lotId: "LOT-B012", producteurId: "p1", acheteurId: "a1",
    produit: "Maïs blanc", quantite: 5000, unite: "kg", prixUnitaire: 180, montantTotal: 900000,
    statut: "en_livraison", escrowRef: "ESC-001", escrowMontant: 900000, fraisSequestre: 18000,
    commerceActId: "CA-001", missionTransportId: "m1",
    dateCreation: "2026-06-01", dateLivraisonPrevue: "2026-06-15",
    acheteurNom: "Koffi Agbéko", transporteurNom: "Sébastien Togbé",
    events: [
      { date: "2026-06-01 08:00", statut: "negociation", description: "Offre acceptée par l'acheteur", acteur: "Koffi A." },
      { date: "2026-06-02 10:30", statut: "commerce_act", description: "Commerce Act signé avec 2 témoins", acteur: "Producteur" },
      { date: "2026-06-03 09:00", statut: "escrow_depose", description: "Fonds séquestrés (900 000 FCFA + 2% frais)", acteur: "Koffi A." },
      { date: "2026-06-05 07:00", statut: "en_livraison", description: "Camion chargé à Parakou, en route vers Cotonou", acteur: "Sébastien T." },
    ],
  },
  {
    id: "CMD-002", lotId: "LOT-B015", producteurId: "p1", acheteurId: "a2",
    produit: "Soja", quantite: 3000, unite: "kg", prixUnitaire: 250, montantTotal: 750000,
    statut: "livree", escrowRef: "ESC-002", escrowMontant: 750000, fraisSequestre: 15000,
    commerceActId: "CA-002",
    dateCreation: "2026-05-20", dateLivraisonPrevue: "2026-06-01", dateLivraisonReelle: "2026-05-30",
    acheteurNom: "Olam Agri",
    events: [
      { date: "2026-05-20 14:00", statut: "negociation", description: "Offre reçue de Olam Agri", acteur: "Olam Agri" },
      { date: "2026-05-21 09:00", statut: "commerce_act", description: "Commerce Act signé électroniquement", acteur: "Producteur" },
      { date: "2026-05-22 11:00", statut: "escrow_depose", description: "Fonds séquestrés", acteur: "Olam Agri" },
      { date: "2026-05-25 06:00", statut: "en_livraison", description: "Lot expédié", acteur: "Transporteur" },
      { date: "2026-05-30 16:00", statut: "livree", description: "Lot livré et confirmé. Paiement débloqué.", acteur: "Olam Agri" },
    ],
  },
  {
    id: "CMD-003", lotId: "LOT-C002", producteurId: "p1", acheteurId: "a1",
    produit: "Cacao bio", quantite: 1000, unite: "kg", prixUnitaire: 1500, montantTotal: 1500000,
    statut: "negociation",
    dateCreation: "2026-06-06",
    acheteurNom: "Koffi Agbéko",
    events: [
      { date: "2026-06-06 10:00", statut: "negociation", description: "Offre reçue pour cacao bio", acteur: "Koffi A." },
    ],
  },
  {
    id: "CMD-004", lotId: "LOT-D001", producteurId: "p1", acheteurId: "a3",
    produit: "Anacarde", quantite: 2000, unite: "kg", prixUnitaire: 650, montantTotal: 1300000,
    statut: "conteste", escrowRef: "ESC-004", escrowMontant: 1300000, fraisSequestre: 26000,
    commerceActId: "CA-004",
    dateCreation: "2026-05-10", dateLivraisonPrevue: "2026-05-25",
    acheteurNom: "Cargill Bénin",
    events: [
      { date: "2026-05-10 08:00", statut: "negociation", description: "Offre acceptée", acteur: "Cargill" },
      { date: "2026-05-12 10:00", statut: "commerce_act", description: "Commerce Act signé", acteur: "Producteur" },
      { date: "2026-05-13 09:00", statut: "escrow_depose", description: "Fonds bloqués", acteur: "Cargill" },
      { date: "2026-05-18 07:00", statut: "en_livraison", description: "En transit", acteur: "Transporteur" },
      { date: "2026-05-24 14:00", statut: "conteste", description: "Qualité non conforme signalée par l'acheteur", acteur: "Cargill" },
    ],
  },
];

export async function getOrders(role?: string, userId?: string): Promise<Order[]> {
  const cached = await cacheGet<Order[]>("orders");
  if (cached && cached.length > 0) return cached.filter(o => role === "acheteur" ? o.acheteurId === userId : o.producteurId === userId);
  return MOCK_ORDERS.filter(o => role === "acheteur" ? o.acheteurId === userId : o.producteurId === userId);
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  const orders = await getOrders();
  return orders.find(o => o.id === id);
}

export function getOrderStatusLabel(statut: OrderStatus): string {
  const labels: Record<OrderStatus, string> = {
    negociation: "Négociation",
    commerce_act: "Commerce Act",
    escrow_depose: "Fonds séquestrés",
    en_livraison: "En livraison",
    livree: "Livrée",
    conteste: "Contestée",
    remboursee: "Remboursée",
  };
  return labels[statut];
}

export function getOrderStatusColor(statut: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    negociation: "#f59e0b",
    commerce_act: "#2563eb",
    escrow_depose: "#8b5cf6",
    en_livraison: "#059669",
    livree: "#22c55e",
    conteste: "#ef4444",
    remboursee: "#6b7280",
  };
  return colors[statut];
}

export function getOrderStatusIcon(statut: OrderStatus): string {
  const icons: Record<OrderStatus, string> = {
    negociation: "💬",
    commerce_act: "⚖️",
    escrow_depose: "🔒",
    en_livraison: "🚛",
    livree: "✅",
    conteste: "⚠️",
    remboursee: "🔄",
  };
  return icons[statut];
}
