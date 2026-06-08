import api from "./api";
import type { Lot } from "../types";

export const fetchLots = async (params?: { search?: string; statut?: string }): Promise<Lot[]> => {
  const { data } = await api.get("/lots", { params });
  return data;
};

export const fetchLotById = async (id: string): Promise<Lot> => {
  const { data } = await api.get(`/lots/${id}`);
  return data;
};
