export type RepaymentStatus = "pending" | "paid" | "overdue" | "defaulted";

export type CollateralType = "harvest" | "guarantor" | "land_title" | "none";

export type ContractStatus = "active" | "repaid" | "defaulted" | "cancelled";

export interface RepaymentSchedule {
  dueDate: Date;
  amount: number;
  status: RepaymentStatus;
  paidAt?: Date;
  paidAmount?: number;
  transactionRef?: string;
}

export interface FinancingOffer {
  id: string;
  inputType: string;
  label: string;
  maxAmount: number;
  interestRate: number;
  durationDays: number;
  minTrustScore: number;
  collateralRequired: CollateralType[];
  active: boolean;
}

export interface FinancingContract {
  id: string;
  producteurId: string;
  offerId: string;
  amount: number;
  interestRate: number;
  totalRepayable: number;
  status: ContractStatus;
  collateralType: CollateralType;
  collateralRef?: string;
  disbursedAt: Date;
  repaidAt?: Date;
  dueDate: Date;
  schedule: RepaymentSchedule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancingEligibility {
  eligible: boolean;
  score: number;
  minRequired: number;
  maxAmount: number;
  availableOffers: FinancingOffer[];
  reason?: string;
  activeContracts: number;
  totalOutstanding: number;
  repaymentRate: number;
}
