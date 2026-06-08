import api from "./api";
import type { CertificateItem } from "../types";

const MOCK: CertificateItem[] = [
  { id: "CERT-001", type: "EUDR", lot: "LOT-2024-001", culture: "Cacao", statut: "Valide", emis: "2024-01-15", expire: "2025-01-15", emetteur: "Bureau Veritas", format: "PDF", blockchain: true },
  { id: "CERT-002", type: "GlobalGAP", lot: "LOT-2024-002", culture: "Coton", statut: "Valide", emis: "2024-02-01", expire: "2025-02-01", emetteur: "SGS", format: "PDF", blockchain: true },
  { id: "CERT-003", type: "EUDR", lot: "LOT-2024-003", culture: "Anacarde", statut: "Expiré", emis: "2023-03-10", expire: "2024-03-10", emetteur: "Bureau Veritas", format: "PDF", blockchain: false },
  { id: "CERT-004", type: "Rainforest Alliance", lot: "LOT-2024-004", culture: "Cacao", statut: "Valide", emis: "2024-04-20", expire: "2025-04-20", emetteur: "Rainforest Alliance", format: "PDF", blockchain: true },
  { id: "CERT-005", type: "Fair Trade", lot: "LOT-2024-005", culture: "Café", statut: "En attente", emis: "2024-05-01", expire: "2025-05-01", emetteur: "FLOCERT", format: "Numérique", blockchain: false },
  { id: "CERT-006", type: "GlobalGAP", lot: "LOT-2024-006", culture: "Maïs", statut: "Valide", emis: "2024-06-10", expire: "2025-06-10", emetteur: "SGS", format: "PDF", blockchain: false },
  { id: "CERT-007", type: "EUDR", lot: "LOT-2024-007", culture: "Coton", statut: "Expiré", emis: "2023-07-15", expire: "2024-07-15", emetteur: "Bureau Veritas", format: "PDF", blockchain: false },
  { id: "CERT-008", type: "Rainforest Alliance", lot: "LOT-2024-008", culture: "Anacarde", statut: "Valide", emis: "2024-08-01", expire: "2025-08-01", emetteur: "Rainforest Alliance", format: "Numérique", blockchain: true },
];

export async function fetchCertificates(): Promise<CertificateItem[]> {
  try { const { data } = await api.get("/certificates"); return data; }
  catch { return [...MOCK]; }
}
