import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Trash, MapPin, Package, CalendarBlank } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import FadeIn from "../components/FadeIn";
import Breadcrumb from "../components/Breadcrumb";
import { PageTitle } from "../components/ResponsiveContainer";
import EmptyState from "../components/EmptyState";
import Badge from "../components/Badge";
import { useIsMobile } from "../hooks/useMediaQuery";
import { fetchFavorites, removeFavorite, fetchFavoriteUpdates } from "../services/favoritesV2";
import { tCrop } from "../utils/i18n";
import { formatNumber } from "../utils/format";

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites-v2"],
    queryFn: fetchFavorites,
    refetchInterval: 30000,
  });

  const { data: updates = [] } = useQuery({
    queryKey: ["favorite-updates"],
    queryFn: fetchFavoriteUpdates,
    refetchInterval: 30000,
  });

  const removeMut = useMutation({
    mutationFn: removeFavorite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favorites-v2"] }),
  });

  const validFavorites = favorites.filter((f) => f.lot);
  const updateMap = new Map(updates.map((u) => [u.lotId, u]));

  return (
    <FadeIn>
      <div style={{ padding: isMobile ? "16px" : "24px 32px", maxWidth: 1000, margin: "0 auto" }}>
        <Breadcrumb crumbs={[{ label: t("nav.dashboard"), path: "/dashboard" }, { label: t("favorites.title") }]} />

        <PageTitle title={t("favorites.title")} subtitle={t("favorites.subtitle")} />

        {isLoading ? (
          <div style={{ textAlign: "center", padding: 60, fontSize: 13, color: colors.textMuted }}>{t("common.loading")}</div>
        ) : validFavorites.length === 0 ? (
          <EmptyState icon={<Star size={32} color={colors.textMuted} />} title={t("favorites.empty")} description={t("favorites.emptyDesc")} action={{ label: t("favorites.browse"), onClick: () => navigate("/lots") }} />
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {validFavorites.map((fav, i) => {
              const lot = fav.lot!;
              const update = updateMap.get(lot.id);
              const priceChanged = update && update.currentPrice !== lot.prix;
              return (
                <div key={fav.lotId} style={{
                  border: `1.5px solid ${colors.borderLight}`, borderRadius: 14, background: colors.surface,
                  cursor: "pointer", overflow: "hidden", boxShadow: colors.shadowSm,
                  animation: `fadeSlideUp 0.4s ease ${i * 0.05}s both`,
                  transition: "all 0.2s",
                }}
                  onClick={() => navigate(`/lots/${lot.id}`)}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.boxShadow = "0 8px 32px rgba(10,110,74,0.12)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderLight; e.currentTarget.style.boxShadow = colors.shadowSm; e.currentTarget.style.transform = "none"; }}
                >
                  <div style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{tCrop(lot.culture)}</span>
                        <Badge text={lot.certification} variant={lot.certification === "EUDR" ? "success" : lot.certification === "Bio" ? "info" : "neutral"} size="sm" pill />
                        <Badge text={t("lotStatus." + lot.statut, lot.statut)} variant={lot.statut === "Disponible" ? "success" : lot.statut === "En transit" ? "warning" : "error"} size="sm" pill />
                      </div>
                      <div style={{ display: "flex", gap: 14, fontSize: 11, color: colors.textMuted, flexWrap: "wrap" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}><MapPin size={11} /> {lot.region}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Package size={11} /> {lot.quantite}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}><CalendarBlank size={11} /> {lot.date}</span>
                      </div>
                      {update && (
                        <div style={{ fontSize: 11, marginTop: 6, color: update.available ? "#059669" : "#dc2626", display: "flex", alignItems: "center", gap: 4, background: update.available ? "#ecfdf5" : "#fef2f2", padding: "4px 10px", borderRadius: 6, width: "fit-content" }}>
                          {update.available ? t("favorites.available") : t("favorites.unavailable")}
                          {priceChanged && ` · ${t("common.price")}: ${formatNumber(update.currentPrice)} ${t("common.currency")}/kg`}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: colors.accent }}>{formatNumber(lot.prix)} {t("common.currency")}</div>
                      <div style={{ fontSize: 10, color: colors.textMuted }}>/{lot.quantite}</div>
                      <button onClick={(e) => { e.stopPropagation(); removeMut.mutate(fav.lotId); }} style={{ marginTop: 8, background: colors.statBg, border: `1px solid ${colors.borderLight}`, cursor: "pointer", color: colors.textMuted, padding: "6px 10px", borderRadius: 8, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500, transition: "all 0.15s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = "#dc2626"; e.currentTarget.style.borderColor = "#fecaca"; e.currentTarget.style.background = "#fef2f2"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = colors.textMuted; e.currentTarget.style.borderColor = colors.borderLight; e.currentTarget.style.background = colors.statBg; }}>
                        <Trash size={12} /> {t("favorites.remove")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </FadeIn>
  );
}
