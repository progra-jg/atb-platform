import api from "./api";
import type { FinancingEligibility, FinancingContract, FinancingOffer } from "../types";

export const checkEligibility = async (producteurId: string, trustScore: number): Promise<FinancingEligibility> => {
  const { data } = await api.post("/financing/check-eligibility", { producteurId, trustScore });
  return data;
};

export const applyForFinancing = async (producteurId: string, trustScore: number, offerId: string, amount: number, collateralType: string, collateralRef?: string): Promise<FinancingContract> => {
  const { data } = await api.post("/financing/apply", { producteurId, trustScore, offerId, amount, collateralType, collateralRef });
  return data;
};

export const getActiveContracts = async (producteurId: string): Promise<FinancingContract[]> => {
  const { data } = await api.get("/financing/contracts", { params: { producteurId } });
  return data;
};

export const repayContract = async (contractId: string, amount: number, transactionRef: string): Promise<FinancingContract> => {
  const { data } = await api.post(`/financing/repay/${contractId}`, { amount, transactionRef });
  return data;
};
