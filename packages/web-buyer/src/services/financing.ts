import api from "./api";
import type { FinancingEligibility, FinancingContract, FinancingOffer } from "../types/financing";

export async function checkEligibility(producteurId: string, trustScore: number): Promise<FinancingEligibility> {
  const { data } = await api.get("/financing/eligibility", { params: { producteurId, trustScore } });
  return data;
}

export async function applyForFinancing(
  producteurId: string,
  trustScore: number,
  offerId: string,
  amount: number,
  collateralType: string,
  collateralRef?: string,
): Promise<FinancingContract> {
  const { data } = await api.post("/financing/apply", { offerId, amount, collateralType, collateralRef }, { params: { producteurId, trustScore } });
  return data;
}

export async function getActiveContracts(producteurId: string): Promise<FinancingContract[]> {
  const { data } = await api.get(`/financing/active/${producteurId}`);
  return data;
}

export async function repayContract(contractId: string, amount: number, transactionRef: string): Promise<FinancingContract> {
  const { data } = await api.post(`/financing/${contractId}/repay`, { amount, transactionRef });
  return data;
}

export async function getContractById(id: string): Promise<FinancingContract> {
  const { data } = await api.get(`/financing/${id}`);
  return data;
}
