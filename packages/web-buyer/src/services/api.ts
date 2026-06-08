import axios from "axios";
import { emitApiError } from "./errorEvents";
import i18n from "../i18n";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("atb_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("atb_token");
    } else if (err.response?.data?.message) {
      emitApiError(err.response.data.message);
    } else if (err.code === "ERR_NETWORK") {
      emitApiError(i18n.t("apiError.network"));
    } else {
      emitApiError(i18n.t("apiError.generic"));
    }
    return Promise.reject(err);
  }
);

export default api;
