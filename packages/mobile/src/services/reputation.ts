import type { UserRole } from "../types";
import { getOrders, Order } from "./orders";

export type BadgeLevel = "bronze" | "argent" | "or";

export interface BadgeInfo {
  niveau: BadgeLevel;
  seuilVentes: number;
  seuilConformite: number;
  icone: string;
  couleur: string;
}

export interface TrustConnection {
  userId: string;
  nom: string;
  role: UserRole;
  badge: BadgeLevel | "";
  trustScore: number;
  transactionsReussies: number;
  connexionDepuis: string;
}

export interface ReputationSummary {
  badge: BadgeInfo | null;
  niveauSuivant: BadgeInfo | null;
  progressionSuivante: number;
  creditScore: number;
  trustScore: number;
  transactionsReussies: number;
  tauxConformite: number;
  disputesPerdues: number;
  volumeTotal: number;
  joursActif: number;
  connexions: number;
}

const BADGES: BadgeInfo[] = [
  { niveau: "bronze", seuilVentes: 0, seuilConformite: 0, icone: "🥉", couleur: "#cd7f32" },
  { niveau: "argent", seuilVentes: 10, seuilConformite: 85, icone: "🥈", couleur: "#c0c0c0" },
  { niveau: "or", seuilVentes: 50, seuilConformite: 95, icone: "🥇", couleur: "#ffd700" },
];

function getBadge(transactions: number, conformite: number): BadgeInfo {
  if (transactions >= 50 && conformite >= 95) return BADGES[2];
  if (transactions >= 10 && conformite >= 85) return BADGES[1];
  return BADGES[0];
}

function getProchainBadge(transactions: number, conformite: number): BadgeInfo | null {
  if (transactions < 10 || conformite < 85) return BADGES[1];
  if (transactions < 50 || conformite < 95) return BADGES[2];
  return null;
}

function progressionVersSuivant(transactions: number, conformite: number, suivant: BadgeInfo): number {
  if (suivant.niveau === "argent") {
    const progressionTx = Math.min(100, (transactions / 10) * 100);
    const progressionConf = Math.min(100, (conformite / 85) * 100);
    return Math.round(Math.min(progressionTx, progressionConf));
  }
  if (suivant.niveau === "or") {
    const progressionTx = Math.min(100, ((transactions - 10) / 40) * 100);
    const progressionConf = Math.min(100, ((conformite - 85) / 10) * 100);
    return Math.round(Math.min(progressionTx, progressionConf));
  }
  return 100;
}

function calcCreditScore(kycLevel: number, transactions: number, conformite: number, disputes: number, volume: number): number {
  const kycPart = kycLevel * 100;
  const txPart = Math.min(200, transactions * 4);
  const confPart = Math.round(conformite * 3);
  const disputePenalty = disputes * 50;
  const volumePart = Math.min(150, Math.round(volume / 100000));
  const base = 300;
  return Math.max(0, Math.min(1000, base + kycPart + txPart + confPart + volumePart - disputePenalty));
}

function calcTrustScore(transactions: number, conformite: number, disputes: number): number {
  if (transactions === 0) return 50;
  const txBonus = Math.min(20, Math.round(transactions / 5));
  const confWeight = Math.round(conformite * 0.7);
  const disputePenalty = Math.min(30, disputes * 10);
  return Math.max(0, Math.min(100, confWeight + txBonus - disputePenalty));
}

function mockTransactions(): number {
  return Math.floor(Math.random() * 60) + 2;
}
function mockConformite(): number {
  return Math.floor(Math.random() * 20) + 80;
}
function mockDisputes(): number {
  return Math.floor(Math.random() * 3);
}
function mockVolume(): number {
  return Math.floor(Math.random() * 20000000) + 500000;
}

export function computeReputation(kycLevel: number = 2, transactions?: number, conformite?: number, disputes?: number, volume?: number): ReputationSummary {
  const txs = transactions ?? mockTransactions();
  const conf = conformite ?? mockConformite();
  const dps = disputes ?? mockDisputes();
  const vol = volume ?? mockVolume();
  const jours = Math.floor(Math.random() * 400) + 30;

  const badge = getBadge(txs, conf);
  const suivant = getProchainBadge(txs, conf);
  const progression = suivant ? progressionVersSuivant(txs, conf, suivant) : 100;

  return {
    badge,
    niveauSuivant: suivant,
    progressionSuivante: progression,
    creditScore: calcCreditScore(kycLevel, txs, conf, dps, vol),
    trustScore: calcTrustScore(txs, conf, dps),
    transactionsReussies: txs,
    tauxConformite: conf,
    disputesPerdues: dps,
    volumeTotal: vol,
    joursActif: jours,
    connexions: Math.floor(Math.random() * 15) + 3,
  };
}

export const MOCK_CONNECTIONS: TrustConnection[] = [
  { userId: "u1", nom: "Koffi Agbéko", role: "acheteur", badge: "or", trustScore: 92, transactionsReussies: 48, connexionDepuis: "2025-03" },
  { userId: "u2", nom: "Marie Dossou", role: "producteur", badge: "argent", trustScore: 88, transactionsReussies: 22, connexionDepuis: "2025-06" },
  { userId: "u3", nom: "Sébastien Togbé", role: "transporteur", badge: "argent", trustScore: 85, transactionsReussies: 35, connexionDepuis: "2025-09" },
  { userId: "u4", nom: "Amadou Bah", role: "producteur", badge: "bronze", trustScore: 72, transactionsReussies: 6, connexionDepuis: "2026-01" },
  { userId: "u5", nom: "Blandine Hounkpè", role: "intermediaire", badge: "or", trustScore: 95, transactionsReussies: 62, connexionDepuis: "2024-11" },
  { userId: "u6", nom: "Didier Akplogan", role: "acheteur", badge: "argent", trustScore: 78, transactionsReussies: 14, connexionDepuis: "2025-08" },
  { userId: "u7", nom: "Fati Soumaïla", role: "producteur", badge: "or", trustScore: 90, transactionsReussies: 53, connexionDepuis: "2025-04" },
];

export function getBadgeIcon(niveau: BadgeLevel | ""): string {
  if (niveau === "bronze") return "🥉";
  if (niveau === "argent") return "🥈";
  if (niveau === "or") return "🥇";
  return "⚪";
}

export function getBadgeColor(niveau: BadgeLevel | ""): string {
  if (niveau === "bronze") return "#cd7f32";
  if (niveau === "argent") return "#6b7280";
  if (niveau === "or") return "#f59e0b";
  return "#9ca3af";
}

export function getScoreLabel(score: number): string {
  if (score >= 900) return "Excellent";
  if (score >= 750) return "Très bon";
  if (score >= 600) return "Bon";
  if (score >= 450) return "Moyen";
  if (score >= 300) return "Faible";
  return "Insuffisant";
}

export function getScoreColor(score: number): string {
  if (score >= 750) return "#22c55e";
  if (score >= 600) return "#f59e0b";
  if (score >= 450) return "#f97316";
  return "#ef4444";
}

export async function computeReputationFromOrders(userId: string, role?: UserRole, kycLevel?: number): Promise<ReputationSummary> {
  const orders = await getOrders(role, userId);
  const txs = orders.filter(o => o.statut === "livree" || o.statut === "en_livraison").length;
  const total = orders.length || 1;
  const livrees = orders.filter(o => o.statut === "livree").length;
  const conteste = orders.filter(o => o.statut === "conteste").length;
  const conf = total > 0 ? Math.round((livrees / total) * 100) : 0;
  const vol = orders.reduce((s, o) => s + o.montantTotal, 0);
  const jours = orders.length > 0 ? Math.max(1, Math.round((Date.now() - new Date(orders[orders.length - 1].dateCreation).getTime()) / 86400000)) : 1;

  return {
    badge: getBadge(txs, conf),
    niveauSuivant: getProchainBadge(txs, conf),
    progressionSuivante: getProchainBadge(txs, conf) ? progressionVersSuivant(txs, conf, getProchainBadge(txs, conf)!) : 100,
    creditScore: calcCreditScore(kycLevel || 0, txs, conf, conteste, vol),
    trustScore: calcTrustScore(txs, conf, conteste),
    transactionsReussies: txs,
    tauxConformite: conf,
    disputesPerdues: conteste,
    volumeTotal: vol,
    joursActif: jours,
    connexions: Math.floor(Math.random() * 15) + 3,
  };
}
