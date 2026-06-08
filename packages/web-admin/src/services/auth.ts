import axios from "axios";
import type { AdminSession } from "../types";

const SESSION_KEY = "atb_admin_session";

const authApi = axios.create({
  baseURL: import.meta.env.VITE_AUTH_URL || "http://localhost:3002",
  timeout: 10000,
  withCredentials: true,
});

export async function loginAdmin(username: string, password: string, rememberMe = false): Promise<AdminSession> {
  try {
    const { data } = await authApi.post("/auth/admin/login", { username, password, rememberMe });
    const token = data.accessToken || data.token;
    const user = data.user || {
      id: data.id,
      username,
      full_name: data.full_name,
      email: data.email,
      role: data.role,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...user, token }));
    return { ...user, token };
  } catch (err) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 401 || err.response?.status === 400) {
        throw new Error("Identifiants incorrects.");
      }
      if (!err.response) {
        throw new Error("Serveur d'authentification inaccessible.");
      }
      throw new Error("Erreur de connexion.");
    }
    throw new Error("Erreur inattendue.");
  }
}

export async function logoutAdmin(): Promise<void> {
  try {
    await authApi.post("/auth/logout");
  } catch {
    // Même si le serveur est injoignable, on nettoie le localStorage
  }
  localStorage.removeItem(SESSION_KEY);
}

export function getAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem(SESSION_KEY);
}
