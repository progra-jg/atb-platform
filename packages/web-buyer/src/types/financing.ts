export type RepaymentStatus = "pending" | "paid" | "overdue" | "defaulted";
export type ContractStatus = "active" | "repaid" | "defaulted" | "cancelled";
export type CollateralType = "harvest" | "guarantor" | "land_title" | "none";

export interface RepaymentSchedule {
  dueDate: string;
  amount: number;
  status: RepaymentStatus;
  paidAt?: string;
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
  disbursedAt: string;
  repaidAt?: string;
  dueDate: string;
  schedule: RepaymentSchedule[];
  createdAt: string;
  updatedAt: string;
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
