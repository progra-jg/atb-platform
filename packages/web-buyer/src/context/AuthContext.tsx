import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";
import type { OnboardingData } from "../types/onboarding";
import { setRoleLock, clearRoleLock, setOnboardingCompleted } from "../services/roleLock";

export interface UserMetadata {
  onboarding?: OnboardingData;
  referralCode?: string;
  referrerId?: string;
  ifu?: string;
  nom?: string;
  fonction?: string;
  contactEmail?: string;
  contactTel?: string;
}

interface AuthUser {
  id: string;
  company: string;
  email: string;
  country: string;
  role: string;
  phone?: string;
  address?: string;
  metadata?: UserMetadata;
  totpEnabled?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (company: string, email: string, password: string, country: string) => Promise<string | null>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  loginToken: string | null;
  verifyTotp: (code: string) => Promise<string | null>;
  cancelTotp: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("atb_token"));
  const [loading, setLoading] = useState(true);
  const [loginToken, setLoginToken] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      api.get("/auth/profile")
        .then((res) => {
          if (res.data?.id) {
            setUser(res.data);
            const onboarding = res.data?.metadata?.onboarding;
            if (onboarding?.completed && onboarding?.userType) {
              setRoleLock(onboarding.userType);
              setOnboardingCompleted();
            }
          }
        })
        .catch(() => { localStorage.removeItem("atb_token"); setToken(null); setUser(null); clearRoleLock(); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      const res = await api.post("/auth/login", { email, password });
      if (res.data.error) return res.data.error;
      if (res.data.totpRequired) {
        setLoginToken(res.data.loginToken);
        return "totp_required";
      }
      localStorage.setItem("atb_token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return null;
    } catch {
      return "auth.error.serverConnection";
    }
  }, []);

  const register = useCallback(async (company: string, email: string, password: string, country: string): Promise<string | null> => {
    try {
      const res = await api.post("/auth/register", { company, email, password, country });
      if (res.data.error) return res.data.error;
      localStorage.setItem("atb_token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return null;
    } catch {
      return "auth.error.serverRegistration";
    }
  }, []);

  const verifyTotp = useCallback(async (code: string): Promise<string | null> => {
    if (!loginToken) return "auth.error.sessionExpired";
    try {
      const res = await api.post("/auth/2fa/challenge", { loginToken, code });
      if (res.data.error) return res.data.error;
      localStorage.setItem("atb_token", res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setLoginToken(null);
      return null;
    } catch {
      return "auth.error.invalidCode";
    }
  }, [loginToken]);

  const cancelTotp = useCallback(() => {
    setLoginToken(null);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("atb_token");
    clearRoleLock();
    setToken(null);
    setUser(null);
    setLoginToken(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get("/auth/profile");
      if (res.data?.id) setUser(res.data);
    } catch { }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshProfile, loginToken, verifyTotp, cancelTotp }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
