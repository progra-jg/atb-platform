import api from "./api";
import type { LoginResponse } from "../types";

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
};

export const register = async (params: { email: string; password: string; company: string; country: string; role: string }): Promise<LoginResponse> => {
  const { data } = await api.post("/auth/register", params);
  return data;
};

export const getProfile = async (): Promise<{ user: import("../types").User }> => {
  const { data } = await api.get("/auth/profile");
  return data;
};
