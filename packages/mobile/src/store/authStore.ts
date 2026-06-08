import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  setAuth: async (user, token) => {
    await SecureStore.setItemAsync("auth_token", token);
    set({ user, token, isLoading: false });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync("auth_token");
    set({ user: null, token: null, isLoading: false });
  },

  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync("auth_token");
      if (!token) {
        set({ isLoading: false });
        return;
      }
      const { getProfile } = await import("../services/auth");
      const { user } = await getProfile();
      set({ user, token, isLoading: false });
    } catch {
      await SecureStore.deleteItemAsync("auth_token");
      set({ isLoading: false });
    }
  },
}));
