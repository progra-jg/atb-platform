import api from "./api";
import type { FrameworkContract, PriceSuggestion } from "../types/contract";

export async function fetchContracts(): Promise<FrameworkContract[]> {
  const { data } = await api.get("/framework-contracts", { params: { buyerId: "b0000000-0001-4000-8000-000000000001" } });
  return data;
}

export async function fetchContractById(id: string): Promise<FrameworkContract> {
  const { data } = await api.get(`/framework-contracts/${id}`);
  return data;
}

export async function suggestPrice(culture: string): Promise<PriceSuggestion> {
  const { data } = await api.get("/framework-contracts/suggest-price", { params: { culture } });
  return data;
}

export async function createContract(body: {
  producteurId: string;
  culture: string;
  volumeKg: number;
  prixKg: number;
  dateDebut: string;
  dateFin: string;
  conditions?: string;
  renouvelable?: boolean;
  lotId?: string;
}): Promise<FrameworkContract> {
  const { data } = await api.post("/framework-contracts", { ...body, buyerId: "b0000000-0001-4000-8000-000000000001" });
  return data;
}

export async function updateContract(id: string, body: Partial<FrameworkContract>): Promise<FrameworkContract> {
  const { data } = await api.patch(`/framework-contracts/${id}`, body);
  return data;
}

export async function signContract(id: string, role: "buyer" | "producteur"): Promise<FrameworkContract> {
  const { data } = await api.post(`/framework-contracts/${id}/sign`, { role });
  return data;
}

export async function negotiateContract(id: string, body: { role: string; prixKg: number; volumeKg: number; message: string }): Promise<FrameworkContract> {
  const { data } = await api.post(`/framework-contracts/${id}/negotiate`, body);
  return data;
}

export async function renewContract(id: string): Promise<FrameworkContract> {
  const { data } = await api.post(`/framework-contracts/${id}/renew`);
  return data;
}

export async function markDeliveryReceived(id: string, index: number): Promise<FrameworkContract> {
  const { data } = await api.post(`/framework-contracts/${id}/delivery/${index}/recu`);
  return data;
}

export async function deleteContract(id: string): Promise<void> {
  await api.delete(`/framework-contracts/${id}`);
}

export async function duplicateContract(id: string): Promise<FrameworkContract> {
  const { data } = await api.post(`/framework-contracts/${id}/duplicate`);
  return data;
}

export function getExportPdfUrl(id: string, lang?: string): string {
  const base = api.defaults.baseURL || "http://localhost:4000/api";
  return `${base}/framework-contracts/${id}/export-pdf?lang=${lang || "fr"}`;
}

export async function markPaiementRegle(id: string, index: number): Promise<FrameworkContract> {
  const { data } = await api.post(`/framework-contracts/${id}/paiements/${index}/regle`);
  return data;
}

export interface FarmerRef {
  id: string; name: string; village: string; cooperative: string;
}

export async function fetchFarmers(): Promise<FarmerRef[]> {
  const { data } = await api.get("/farmers");
  return data;
}
