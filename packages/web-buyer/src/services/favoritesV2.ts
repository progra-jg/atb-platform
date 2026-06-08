import api from "./api";

export interface FavoriteItem {
  lotId: string;
  createdAt: string;
  lot: {
    id: string;
    culture: string;
    origine: string;
    region: string;
    quantite: string;
    certification: string;
    statut: string;
    prix: number;
    producteurId: string;
    cooperative: string;
    date: string;
  } | null;
}

export interface FavoriteUpdate {
  lotId: string;
  culture: string;
  currentPrice: number;
  available: boolean;
  message: string;
}

const USER_ID = "b0000000-0001-4000-8000-000000000001";

export async function fetchFavorites(): Promise<FavoriteItem[]> {
  const { data } = await api.get("/favorites", { params: { userId: USER_ID } });
  return data;
}

export async function addFavorite(lotId: string): Promise<void> {
  await api.post(`/favorites/${lotId}`, null, { params: { userId: USER_ID } });
}

export async function removeFavorite(lotId: string): Promise<void> {
  await api.delete(`/favorites/${lotId}`, { params: { userId: USER_ID } });
}

export async function fetchFavoriteUpdates(): Promise<FavoriteUpdate[]> {
  const { data } = await api.get("/favorites/updates", { params: { userId: USER_ID } });
  return data;
}
