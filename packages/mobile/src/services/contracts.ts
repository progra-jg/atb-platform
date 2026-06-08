interface Contract {
  id: string;
  titre: string;
  produit: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
  montantTotal: number;
  acheteurId: string;
  acheteurNom: string;
  producteurId: string;
  producteurNom: string;
  statut: "brouillon" | "envoye" | "negociation" | "signe" | "actif" | "complete" | "resilie";
  dateCreation: string;
  dateSignature?: string;
  dateDebut?: string;
  dateFin?: string;
  modalites?: string;
  conditions?: string;
  historique: { date: string; action: string; par: string }[];
  echeances: { date: string; type: string; montant: number; statut: "paye" | "attente" | "retard" }[];
}

const MOCK_CONTRACTS: Contract[] = [
  { id: "CT-001", titre: "Contrat Maïs blanc — Koffi Agbéko", produit: "Maïs blanc", quantite: 2500, unite: "kg", prixUnitaire: 185, montantTotal: 462500, acheteurId: "buy-001", acheteurNom: "Koffi Agbéko", producteurId: "user-1", producteurNom: "Vous", statut: "actif", dateCreation: "2026-05-20", dateSignature: "2026-05-25", dateDebut: "2026-06-01", dateFin: "2026-08-30", modalites: "Livraison échelonnée : 1T au 15 juin, 1.5T au 30 juin", conditions: "Paiement 30% à la signature, 70% à la livraison", historique: [
    { date: "2026-05-20", action: "Création du contrat", par: "Vous" },
    { date: "2026-05-21", action: "Envoi à l'acheteur", par: "Vous" },
    { date: "2026-05-23", action: "Contre-proposition : 180 FCFA/kg", par: "Koffi Agbéko" },
    { date: "2026-05-24", action: "Acceptation : 185 FCFA/kg", par: "Vous" },
    { date: "2026-05-25", action: "Signature électronique", par: "Les deux parties" },
    { date: "2026-06-01", action: "Contrat activé", par: "Système" },
  ], echeances: [
    { date: "2026-05-25", type: "Acompte 30%", montant: 138750, statut: "paye" },
    { date: "2026-06-15", type: "1ère livraison + solde", montant: 185000, statut: "attente" },
    { date: "2026-06-30", type: "Solde final", montant: 138750, statut: "attente" },
  ]},
  { id: "CT-002", titre: "Contrat Soja — Olam Agri", produit: "Soja", quantite: 3000, unite: "kg", prixUnitaire: 240, montantTotal: 720000, acheteurId: "buy-002", acheteurNom: "Olam Agri", producteurId: "user-1", producteurNom: "Vous", statut: "negociation", dateCreation: "2026-06-05", historique: [
    { date: "2026-06-05", action: "Création du contrat", par: "Olam Agri" },
    { date: "2026-06-06", action: "Contre-proposition : 245 FCFA/kg", par: "Vous" },
  ], echeances: []},
  { id: "CT-003", titre: "Contrat Cacao bio — Cargill", produit: "Cacao bio", quantite: 1000, unite: "kg", prixUnitaire: 1550, montantTotal: 1550000, acheteurId: "buy-003", acheteurNom: "Cargill Bénin", producteurId: "user-1", producteurNom: "Vous", statut: "complete", dateCreation: "2026-03-01", dateSignature: "2026-03-10", dateDebut: "2026-03-15", dateFin: "2026-05-30", modalites: "Livraison unique au dépôt Cargill", historique: [
    { date: "2026-03-01", action: "Création du contrat", par: "Cargill" },
    { date: "2026-03-10", action: "Signature", par: "Les deux parties" },
    { date: "2026-05-25", action: "Livraison effectuée", par: "Cargill" },
    { date: "2026-05-30", action: "Paiement final reçu", par: "Système" },
  ], echeances: [
    { date: "2026-03-10", type: "Acompte 30%", montant: 465000, statut: "paye" },
    { date: "2026-05-25", type: "Solde livraison", montant: 1085000, statut: "paye" },
  ]},
];

export function getContracts(): Contract[] {
  return MOCK_CONTRACTS;
}

export function getContractById(id: string): Contract | undefined {
  return MOCK_CONTRACTS.find(c => c.id === id);
}

export function getContractStatusIcon(statut: Contract["statut"]): string {
  const icons = { brouillon: "📝", envoye: "📤", negociation: "💬", signe: "✍️", actif: "✅", complete: "🏁", resilie: "⛔" };
  return icons[statut] || "📄";
}

export function getContractStatusColor(statut: Contract["statut"]): string {
  const colors = { brouillon: "#9E9E9E", envoye: "#42A5F5", negociation: "#FFA726", signe: "#66BB6A", actif: "#43A047", complete: "#388E3C", resilie: "#EF5350" };
  return colors[statut] || "#9E9E9E";
}

export function formatContractStatut(statut: Contract["statut"]): string {
  const labels = { brouillon: "Brouillon", envoye: "Envoyé", negociation: "Négociation", signe: "Signé", actif: "Actif", complete: "Terminé", resilie: "Résilié" };
  return labels[statut] || statut;
}

export type { Contract };
