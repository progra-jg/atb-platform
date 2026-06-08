import api from "./api";

export interface SampleRequest {
  id: string;
  buyerId: string;
  lotId: string;
  producteurId: string;
  quantiteDemandee: string;
  message: string;
  adresseLivraison: string;
  telephone: string;
  statut: string;
  createdAt: string;
  updatedAt: string;
}

const BUYER_ID = "b0000000-0001-4000-8000-000000000001";

export async function fetchSampleRequests(): Promise<SampleRequest[]> {
  const { data } = await api.get("/sample-requests", { params: { buyerId: BUYER_ID } });
  return data;
}

export async function createSampleRequest(body: {
  lotId: string;
  producteurId: string;
  quantiteDemandee?: string;
  message?: string;
  adresseLivraison?: string;
  telephone?: string;
}): Promise<SampleRequest> {
  const { data } = await api.post("/sample-requests", { ...body, buyerId: BUYER_ID });
  return data;
}
