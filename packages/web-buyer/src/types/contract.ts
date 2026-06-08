export type ContractStatus = "brouillon" | "envoye" | "en_negociation" | "signe" | "actif" | "termine" | "resilie";

export interface CounterOffer {
  role: string;
  prixKg: number;
  volumeKg: number;
  message: string;
  createdAt: string;
}

export interface DeliveryCalendarItem {
  date: string;
  volume: number;
  statut: string;
}

export interface PaiementItem {
  echeance: string;
  montant: number;
  statut: string;
  methode?: string;
  reference?: string;
  payeAt?: string;
  livraisonIndex?: number;
}

export interface FrameworkContract {
  id: string;
  buyerId: string;
  producteurId: string;
  lotId: string | null;
  culture: string;
  volumeKg: number;
  prixKg: number;
  devise: string;
  dateDebut: string;
  dateFin: string;
  calendrierLivraisons: DeliveryCalendarItem[] | null;
  counterOffers: CounterOffer[] | null;
  paiements: PaiementItem[] | null;
  conditions: string | null;
  statut: ContractStatus;
  signatureBuyerAt: string | null;
  signatureProducteurAt: string | null;
  montantTotal: number;
  renouvelable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PriceSuggestion {
  culture: string;
  avg: number | null;
  min: number | null;
  max: number | null;
  count: number;
}
