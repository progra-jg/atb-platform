import React from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useOnboarding } from "../hooks/useOnboarding";
import OnboardingTour from "./OnboardingTour";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user, loading } = useAuth();
  const { needsOnboarding } = useOnboarding();
  const location = useLocation();

  if (loading) {
    return (
      <div role="status" aria-label={t("common.loading")} style={{
        display: "flex", justifyContent: "center", alignItems: "center",
        minHeight: "100vh", fontSize: 14, color: colors.textMuted,
        flexDirection: "column", gap: 12,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          border: "3px solid", borderTopColor: colors.accent,
          borderRightColor: colors.border, borderBottomColor: colors.border,
          borderLeftColor: colors.border,
          animation: "spin 0.7s linear infinite",
        }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  if (needsOnboarding && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <>
      {children}
      {!needsOnboarding && <OnboardingTour />}
    </>
  );
}
