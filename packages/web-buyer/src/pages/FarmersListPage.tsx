import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { tCrop } from "../utils/i18n";
import { useQuery } from "@tanstack/react-query";
import {
  Users, MapPin, Buildings, Clock, ArrowRight,
} from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import Card from "../components/ui/Card";
import Badge from "../components/Badge";
import FadeIn from "../components/FadeIn";
import Breadcrumb from "../components/Breadcrumb";
import { useIsMobile } from "../hooks/useMediaQuery";
import { fetchFarmersList } from "../services/farmers";

function Skeleton({ h = 20, w = "100%", r = 6 }: { h?: number; w?: string | number; r?: number }) {
  const { colors } = useTheme();
  return <div style={{ height: h, width: typeof w === "number" ? w : w, borderRadius: r, background: `linear-gradient(90deg, ${colors.borderLight} 25%, ${colors.surface} 50%, ${colors.borderLight} 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.2s ease-in-out infinite" }} />;
}

function FarmersListPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isMobile = useIsMobile();

  const { data: farmers, isLoading } = useQuery({
    queryKey: ["farmers-list"],
    queryFn: fetchFarmersList,
  });

  return (
    <FadeIn>
      <div>
        <Breadcrumb crumbs={[
          { label: t("nav.dashboard"), path: "/dashboard" },
          { label: t("farmersList.title") },
        ]} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? 16 : 24 }}>
          <div>
            <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, margin: 0, color: colors.text, display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={isMobile ? 22 : 26} color={colors.accent} weight="fill" /> {t("farmersList.title")}
            </h1>
            <p style={{ fontSize: isMobile ? 12 : 13, color: colors.textMuted, margin: "4px 0 0" }}>
              {farmers ? `${farmers.length} ${t("farmersList.count")}` : ""}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))", gap: isMobile ? 12 : 16 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} variant="bordered" hoverable={false} style={{ padding: isMobile ? 16 : 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <Skeleton h={48} w={48} r={12} />
                  <div style={{ flex: 1 }}>
                    <Skeleton h={16} w="60%" />
                    <Skeleton h={12} w="80%" />
                  </div>
                </div>
                <Skeleton h={12} w="90%" />
                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  <Skeleton h={36} r={8} /><Skeleton h={36} r={8} /><Skeleton h={36} r={8} />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))", gap: isMobile ? 12 : 16 }}>
            {farmers?.map((f, i) => (
              <Card key={f.anonymousId} onClick={() => navigate(`/farmers/${f.anonymousId}`)} style={{ padding: isMobile ? 14 : 20, animation: `fadeSlideUp 0.4s ease ${i * 0.04}s both` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: isMobile ? 42 : 48, height: isMobile ? 42 : 48, borderRadius: 12, background: `linear-gradient(135deg, ${colors.accent}, #34d399)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: "white", fontWeight: 800, fontSize: isMobile ? 16 : 18 }}>
                      {f.displayName.split(" ").map((n: string) => n[0]).join("")}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 600, color: colors.text, marginBottom: 1 }}>{f.displayName}</div>
                    <div style={{ fontSize: isMobile ? 11 : 12, color: colors.textMuted, display: "flex", alignItems: "center", gap: 4 }}>
                      <MapPin size={10} /> {f.localisation}
                    </div>
                  </div>
                  <Badge text={f.didVerified ? t("farmers.didVerified") : t("farmers.didNotVerified")} variant={f.didVerified ? "success" : "neutral"} size="sm" />
                </div>

                <div style={{ fontSize: isMobile ? 11 : 12, color: colors.textSecondary, lineHeight: 1.6, marginBottom: 12 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Buildings size={12} /> {f.cooperative}</span>
                  <span style={{ marginLeft: 12, display: "inline-flex", alignItems: "center", gap: 4 }}><Clock size={12} /> {f.experience}{t("farmers.years")}</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  <div style={{ background: colors.statBg, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: isMobile ? 10 : 11, color: colors.textMuted, marginBottom: 2 }}>{t("farmers.score")}</div>
                    <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: f.credibilityScore >= 90 ? "#059669" : f.credibilityScore >= 80 ? "#d97706" : "#dc2626" }}>
                      {f.credibilityScore}
                    </div>
                  </div>
                  <div style={{ background: colors.statBg, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: isMobile ? 10 : 11, color: colors.textMuted, marginBottom: 2 }}>{t("farmers.trust")}</div>
                    <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: "#059669" }}>
                      {f.trustIndex}%
                    </div>
                  </div>
                  <div style={{ background: colors.statBg, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                    <div style={{ fontSize: isMobile ? 10 : 11, color: colors.textMuted, marginBottom: 2 }}>{t("farmers.volume")}</div>
                    <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: colors.text }}>
                      {f.totalTracedVolume}<span style={{ fontSize: 9, color: colors.textMuted }}>{f.volumeUnit}</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: isMobile ? 10 : 11, color: colors.textMuted }}>
                    {tCrop(f.culture)} · {f.superficie} Ha · {f.parcelleCount} parcelle{f.parcelleCount > 1 ? "s" : ""}
                  </span>
                  <span style={{ color: colors.accent, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                    {t("farmersList.viewProfile")} <ArrowRight size={12} />
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </FadeIn>
  );
}

export default FarmersListPage;
