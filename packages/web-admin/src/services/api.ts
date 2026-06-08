import axios from "axios";
import { emitApiError } from "./errorEvents";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem("atb_admin_session");
    if (raw) {
      const session = JSON.parse(raw);
      if (session.token) config.headers.Authorization = `Bearer ${session.token}`;
    }
  } catch { /* ignorer */ }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("atb_admin_token");
    } else if (err.response?.data?.message) {
      emitApiError(err.response.data.message);
    } else if (err.code === "ERR_NETWORK") {
      emitApiError("Erreur réseau. Vérifiez votre connexion.");
    } else {
      emitApiError("Une erreur est survenue. Veuillez réessayer.");
    }
    return Promise.reject(err);
  }
);

export default api;
