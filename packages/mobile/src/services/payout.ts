import api from "./api";
import type { PayoutRecord, PayoutStats } from "../types";

export const fetchPayouts = async (): Promise<PayoutRecord[]> => {
  const { data } = await api.get("/payouts");
  return data;
};

export const fetchPayoutStats = async (): Promise<PayoutStats> => {
  const { data } = await api.get("/payouts/stats");
  return data;
};

export const initiatePayout = async (params: { amount: number; phone: string; provider: string; orderId?: string }): Promise<PayoutRecord> => {
  const { data } = await api.post("/payouts/initiate", params);
  return data;
};
