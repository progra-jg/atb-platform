import type { ESGScoreTier } from "./esg";

export interface ImpactSnapshot {
  date: string;
  overall: number;
  environmental: number;
  social: number;
  governance: number;
  tier: ESGScoreTier;
  badgesUnlocked: number;
  profilePercentage: number;
}

export interface MilestoneEvent {
  id: string;
  date: string;
  type: "badge" | "profile" | "esg_tier" | "follow" | "invite" | "order";
  labelKey: string;
  icon: string;
  value?: string;
}

export interface ImpactHistory {
  snapshots: ImpactSnapshot[];
  milestones: MilestoneEvent[];
}
