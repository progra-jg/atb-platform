import api from "./api";
import type { Order } from "../types";
import { formatNumber } from "../utils/format";

const NOW = "20/03/2024";

const MOCK_ORDERS: Order[] = [
  {
    id: "CMD-2024-001", lot: "ATB-2403-001", culture: "Cacao", quantite: "5 000 kg", prixUnitaire: "2 500 FCFA", total: "12 500 000 FCFA", statut: "En attente", date: "20/03/2024", livraison: "Port de Cotonou",
    producteurId: "farmer-001",
    verificationPointId: "VP-ATL-001", verificationPointName: "Hub Atlantique — Coopérative Côtière",
    transportOption: "hub", escrowDeposit: 12500000,
    timeline: [
      { step: 1, title: "Commande créée", date: "20/03/2024", lieu: "Cotonou", acteur: "Acheteur", desc: "Commande soumise pour validation", status: "completed" },
      { step: 2, title: "En attente de dépôt", date: "—", lieu: "—", acteur: "—", desc: "En attente du dépôt escrow par l'acheteur", status: "active" },
      { step: 3, title: "Inspection", date: "—", lieu: "—", acteur: "—", desc: "En attente de dépôt", status: "pending" },
      { step: 4, title: "Livraison", date: "—", lieu: "—", acteur: "—", desc: "En attente d'inspection", status: "pending" },
    ],
  },
  {
    id: "CMD-2024-002", lot: "ATB-2403-003", culture: "Anacarde", quantite: "2 000 kg", prixUnitaire: "3 200 FCFA", total: "6 400 000 FCFA", statut: "Dépôt reçu", date: "18/03/2024", livraison: "Parakou",
    producteurId: "farmer-001",
    verificationPointId: "VP-BOR-001", verificationPointName: "Hub Borgou — Coopérative Terroir",
    transportOption: "hub", escrowDeposit: 6400000, escrowReleaseDate: "22/03/2024",
    timeline: [
      { step: 1, title: "Commande créée", date: "18/03/2024", lieu: "Cotonou", acteur: "Acheteur", desc: "Commande soumise pour validation", status: "completed" },
      { step: 2, title: "Dépôt reçu", date: "19/03/2024", lieu: "Parakou", acteur: "Système", desc: "Dépôt escrow confirmé — 6 400 000 FCFA sécurisés", status: "completed" },
      { step: 3, title: "Inspection", date: "—", lieu: "—", acteur: "—", desc: "En attente d'acheminement au point de vérification", status: "active" },
      { step: 4, title: "Livraison", date: "—", lieu: "—", acteur: "—", desc: "En attente d'inspection", status: "pending" },
    ],
  },
  {
    id: "CMD-2024-003", lot: "ATB-2403-002", culture: "Coton", quantite: "3 200 kg", prixUnitaire: "1 800 FCFA", total: "5 760 000 FCFA", statut: "En livraison", date: "15/03/2024", livraison: "Bohicon",
    producteurId: "farmer-002",
    verificationPointId: "VP-MON-001", verificationPointName: "Hub Mono — Coopérative Lacustre",
    transportOption: "door", escrowDeposit: 5760000, escrowReleaseDate: "22/03/2024",
    timeline: [
      { step: 1, title: "Commande créée", date: "15/03/2024", lieu: "Cotonou", acteur: "Acheteur", desc: "Commande soumise pour validation", status: "completed" },
      { step: 2, title: "Dépôt reçu", date: "16/03/2024", lieu: "Bohicon", acteur: "Système", desc: "Dépôt escrow confirmé", status: "completed" },
      { step: 3, title: "Inspection passée", date: "17/03/2024", lieu: "Hub Mono", acteur: "Inspecteur", desc: "Lot conforme — qualité, quantité et certifications vérifiées", status: "completed" },
      { step: 4, title: "En livraison", date: "—", lieu: "—", acteur: "—", desc: "En cours de livraison vers l'entrepôt acheteur", status: "active" },
    ],
  },
  {
    id: "CMD-2024-004", lot: "ATB-2403-004", culture: "Café", quantite: "800 kg", prixUnitaire: "4 500 FCFA", total: "3 600 000 FCFA", statut: "Livrée", date: "10/03/2024", livraison: "Cotonou",
    producteurId: "farmer-001",
    verificationPointId: "VP-ATL-001", verificationPointName: "Hub Atlantique — Coopérative Côtière",
    transportOption: "door", escrowDeposit: 3600000, escrowReleaseDate: "15/03/2024",
    deliveryAddress: { rue: "Zone industrielle", ville: "Cotonou", region: "Littoral", pays: "Bénin", phone: "+229 01 23 45 67 89" },
    timeline: [
      { step: 1, title: "Commande créée", date: "10/03/2024", lieu: "Cotonou", acteur: "Acheteur", desc: "Commande soumise pour validation", status: "completed" },
      { step: 2, title: "Dépôt reçu", date: "11/03/2024", lieu: "Kétou", acteur: "Système", desc: "Dépôt escrow confirmé", status: "completed" },
      { step: 3, title: "Inspection passée", date: "12/03/2024", lieu: "Hub Atlantique", acteur: "Inspecteur", desc: "Lot conforme — qualité et certifications vérifiées", status: "completed" },
      { step: 4, title: "Livrée", date: "14/03/2024", lieu: "Cotonou", acteur: "Acheteur", desc: "Livraison réceptionnée avec succès", status: "completed" },
    ],
  },
];

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms + Math.random() * 400));

export async function fetchOrders(): Promise<Order[]> {
  try { const { data } = await api.get("/orders"); return data; }
  catch { await delay(); return [...MOCK_ORDERS]; }
}

export async function fetchOrderById(id: string): Promise<Order | undefined> {
  try { const { data } = await api.get(`/orders/${id}`); return data; }
  catch { await delay(200); return MOCK_ORDERS.find((o) => o.id === id); }
}

export async function createOrder(orderData: { lotId: string; culture: string; quantite: string; prix: number }): Promise<Order> {
  const { data } = await api.post("/orders", {
    items: [{ lotId: orderData.lotId, culture: orderData.culture, quantite: orderData.quantite, prixUnitaire: `${formatNumber(orderData.prix)} FCFA` }],
    status: "pending",
  });
  return data;
}
