import { createContext, useContext, useMemo, ReactNode } from "react";
import { useRole } from "../hooks/useRole";

interface RoleTheme {
  accent: string;
  gradient: string;
  navbarBg: string;
  badgeBg: string;
  badgeText: string;
  label: string;
}

const FARMER: RoleTheme = {
  accent: "#0d7a4a",
  gradient: "linear-gradient(135deg, #0a3d25 0%, #0d6b42 50%, #108052 100%)",
  navbarBg: "linear-gradient(135deg, #0a3d25 0%, #0e5c3a 50%, #118053 100%)",
  badgeBg: "rgba(13,122,74,0.15)",
  badgeText: "#0d7a4a",
  label: "Producteur",
};

const BUYER: RoleTheme = {
  accent: "#2563eb",
  gradient: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #3b82f6 100%)",
  navbarBg: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #3b82f6 100%)",
  badgeBg: "rgba(37,99,235,0.15)",
  badgeText: "#2563eb",
  label: "Acheteur",
};

const DEFAULT: RoleTheme = {
  accent: "#0d7a4a",
  gradient: "linear-gradient(135deg, #0a3d25 0%, #0d6b42 50%, #108052 100%)",
  navbarBg: "linear-gradient(135deg, #0a3d25 0%, #0e5c3a 50%, #118053 100%)",
  badgeBg: "rgba(13,122,74,0.15)",
  badgeText: "#0d7a4a",
  label: "Visiteur",
};

interface RoleThemeValue {
  theme: RoleTheme;
  isFarmer: boolean;
  isBuyer: boolean;
}

const RoleThemeContext = createContext<RoleThemeValue>({
  theme: DEFAULT,
  isFarmer: false,
  isBuyer: false,
});

export function RoleThemeProvider({ children }: { children: ReactNode }) {
  const role = useRole();

  const value = useMemo(() => {
    if (role.isFarmer) return { theme: FARMER, isFarmer: true, isBuyer: false };
    if (role.isBuyer) return { theme: BUYER, isFarmer: false, isBuyer: true };
    return { theme: DEFAULT, isFarmer: false, isBuyer: false };
  }, [role.isFarmer, role.isBuyer]);

  return (
    <RoleThemeContext.Provider value={value}>
      {children}
    </RoleThemeContext.Provider>
  );
}

export const useRoleTheme = () => useContext(RoleThemeContext);
