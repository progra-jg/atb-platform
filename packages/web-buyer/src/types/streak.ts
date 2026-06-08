export interface StreakMilestone {
  days: number;
  achieved: boolean;
  achievedAt: string | null;
  labelKey: string;
}

export interface StreakData {
  current: number;
  longest: number;
  lastActive: string | null;
  freezes: number;
  history: string[];
  milestones: StreakMilestone[];
}

export interface StreakState {
  streak: number;
  longestStreak: number;
  lastActive: string | null;
  freezes: number;
  isActiveToday: boolean;
  isAtRisk: boolean;
  atRiskDays: number;
  milestones: StreakMilestone[];
  nextMilestone: StreakMilestone | null;
  progressToNext: number;
}

export const STREAK_MILESTONES: Omit<StreakMilestone, "achieved" | "achievedAt">[] = [
  { days: 3, labelKey: "streak.milestone.3" },
  { days: 7, labelKey: "streak.milestone.7" },
  { days: 14, labelKey: "streak.milestone.14" },
  { days: 30, labelKey: "streak.milestone.30" },
  { days: 60, labelKey: "streak.milestone.60" },
  { days: 100, labelKey: "streak.milestone.100" },
  { days: 365, labelKey: "streak.milestone.365" },
];

export const STORAGE_KEY = "atb_streak_v2";
export const MAX_HISTORY = 90;
