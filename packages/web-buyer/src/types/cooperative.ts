export type CooperativeRole = "president" | "secretary" | "treasurer" | "member" | "invited";

export interface CooperativeMember {
  id: string;
  cooperativeId: string;
  name: string;
  email: string;
  phone: string;
  role: CooperativeRole;
  joinedAt: string;
  lotsCount: number;
  totalVolumeKg: number;
  totalRevenueXof: number;
  rating: number;
  isActive: boolean;
  avatarInitial: string;
}

export interface Cooperative {
  id: string;
  name: string;
  slug: string;
  region: string;
  department: string;
  commune: string;
  description: string;
  foundedAt: string;
  memberCount: number;
  activeMemberCount: number;
  totalLots: number;
  totalVolumeKg: number;
  totalRevenueXof: number;
  avgRating: number;
  mainCrops: string[];
  certificationLabels: string[];
  presidentName: string;
  presidentId: string;
  inviteCode: string;
  members: CooperativeMember[];
  createdAt: string;
  updatedAt: string;
}

export interface CooperativeInvite {
  id: string;
  cooperativeId: string;
  code: string;
  createdBy: string;
  maxUses: number;
  useCount: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface CooperativeStats {
  totalCooperatives: number;
  totalMembers: number;
  totalLots: number;
  totalVolumeKg: number;
  totalRevenueXof: number;
  topRegions: { region: string; count: number }[];
  topCrops: { crop: string; count: number }[];
  memberGrowth: { month: string; count: number }[];
}

export const COOPERATIVE_STORAGE_KEY = "atb_cooperatives_v1";
export const COOPERATIVE_INVITES_KEY = "atb_coop_invites_v1";

export const REGIONS_BENIN = [
  "Atlantique", "Borgou", "Collines", "Couffo", "Donga",
  "Littoral", "Mono", "Ouémé", "Plateau", "Zou",
  "Alibori", "Atacora",
];

export function generateCooperativeSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

const COOP_ADJECTIVES = ["Agri", "Vert", "Bio", "Solidaire", "Durable", "Prospère", "Uni", "Nouveau", "Bénin", "Savane"];
const COOP_NOUNS = ["Espoir", "Union", "Entente", "Croissance", "Terre", "Avenir", "Récolte", "Fermier", "Progrès", "Harmonie"];
let coopCounter = 0;

export function generateCooperativeName(): string {
  const adj = COOP_ADJECTIVES[Math.floor(Math.random() * COOP_ADJECTIVES.length)];
  const noun = COOP_NOUNS[Math.floor(Math.random() * COOP_NOUNS.length)];
  coopCounter++;
  return `Coopérative ${adj} ${noun}`;
}
