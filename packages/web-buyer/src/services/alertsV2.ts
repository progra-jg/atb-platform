import api from "./api";

export interface UserAlert {
  id: string;
  userId: string;
  type: string;
  crop?: string;
  region?: string;
  certification?: string;
  direction?: string;
  targetPrice?: number;
  active: boolean;
  triggered: boolean;
  triggeredAt?: string;
  createdAt: string;
}

const USER_ID = "b0000000-0001-4000-8000-000000000001";

export async function fetchAlerts(): Promise<UserAlert[]> {
  const { data } = await api.get("/alerts-v2", { params: { userId: USER_ID } });
  return data;
}

export async function createAlert(body: Partial<UserAlert>): Promise<UserAlert> {
  const { data } = await api.post("/alerts-v2", { ...body, userId: USER_ID });
  return data;
}

export async function toggleAlert(id: string): Promise<UserAlert> {
  const { data } = await api.patch(`/alerts-v2/${id}/toggle`);
  return data;
}

export async function deleteAlert(id: string): Promise<void> {
  await api.delete(`/alerts-v2/${id}`);
}
