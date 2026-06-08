export type ReferralRewardStatus = "pending" | "credited" | "expired";
export type ReferralRewardType = "percentage" | "fixed" | "bonus";

export interface ReferralReward {
  id: string;
  type: ReferralRewardType;
  amount: number;
  currency: string;
  labelKey: string;
  status: ReferralRewardStatus;
  creditedAt: string | null;
  createdAt: string;
}

export interface ReferralInvitee {
  id: string;
  company: string;
  joinedAt: string;
  status: "active" | "pending";
  rewardsEarned: number;
}

export interface ReferralData {
  code: string;
  shareUrl: string;
  totalInvited: number;
  activeInvited: number;
  rewardsTotal: number;
  rewardsCurrency: string;
  rewards: ReferralReward[];
  invitees: ReferralInvitee[];
  createdAt: string;
}

export interface ReferralStats {
  inviteCount: number;
  rewardCount: number;
  rewardAmount: number;
  conversionRate: number;
}
