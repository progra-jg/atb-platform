import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Package, Users, SealCheck, ShoppingCart, FileText, ArrowRight, TrendUp,
  Star, MapPin, Clock, Bell, BellRinging, Plus, X, Trash, Leaf, CaretUp, CaretDown,
  ShieldCheck, ArrowsLeftRight, ChartBar, WarningCircle, CheckCircle, Globe, Sparkle,
} from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { useIsMobile } from "../hooks/useMediaQuery";
import { useUserProfile } from "../hooks/useUserProfile";
import Card, { CardHeader, CardDivider } from "../components/ui/Card";
import Button from "../components/ui/Button";
import StatCard from "../components/ui/StatCard";
import QuickActionButton from "../components/ui/QuickActionButton";
import ReferralWidget from "../components/ReferralWidget";
import ReferralWelcomeBonus from "../components/ReferralWelcomeBonus";
import BadgesWidget from "../components/BadgesWidget";
import ReferralEarningsWidget from "../components/ReferralEarningsWidget";
import ProfileCompletenessCard from "../components/ProfileCompletenessCard";
import InviteContactsWidget from "../components/InviteContactsWidget";
import { PermissionGate, AnyPermissionGate } from "../components/PermissionGate";
import ESGScoreCard from "../components/ESGScoreCard";
import SmartFeed from "../components/SmartFeed";
import MarketBriefCard from "../components/MarketBriefCard";
import DemandDashboardWidget from "../components/DemandDashboardWidget";
import EudrFunnelWidget from "../components/EudrFunnelWidget";
import NegotiationWidget from "../components/NegotiationWidget";
import LogisticsWidget from "../components/LogisticsWidget";
import QAWidget from "../components/QAWidget";
import StreakWidget from "../components/StreakWidget";
import PushNotificationPrompt from "../components/PushNotificationPrompt";
import EmailVerificationBanner from "../components/EmailVerificationBanner";
import WelcomeTour from "../components/WelcomeTour";
import type { TourStep } from "../components/WelcomeTour";
import TrustScoreCard from "../components/TrustScoreCard";
import TradeEvaluationForm from "../components/TradeEvaluationForm";
import EscrowDashboardWidget from "../components/EscrowDashboardWidget";
import Stagger, { StaggerGrid } from "../components/Stagger";
import Skeleton from "../components/Skeleton";
import { staggerContainer, staggerItem, slideUp, slideInRight, scaleIn } from "../lib/motion-variants";
import { tCrop } from "../utils/i18n";
import { formatNumber, formatDate } from "../utils/format";
import { computeLotCompleteness } from "../utils/scoring";
import CompletenessGauge from "../components/CompletenessGauge";
import { fetchDashboardStats, fetchLots, fetchCertificates } from "../services/lots";
import { fetchOrders } from "../services/orders";
import { fetchMarketPrices } from "../services/market";
import { fetchComplianceSummary } from "../services/compliance";
import { getFavorites, toggleFavorite } from "../services/favorites";
import { getAlerts, addAlert, removeAlert } from "../services/priceAlerts";
import FollowedFarmersPanel from "../components/FollowedFarmersPanel";
import type { Lot, MarketPrice, Certificate, PriceAlert, Order } from "../types";

function LotCard({ lot, fav, onToggleFav, onClick }: {
  lot: Lot; fav: boolean; onToggleFav: (e: React.MouseEvent) => void; onClick: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [hover, setHover] = React.useState(false);
  const statusColor = lot.statut === "Disponible" ? colors.success : lot.statut === "En transit" ? colors.warning : colors.error;
  const statusBg = lot.statut === "Disponible" ? colors.successLight : lot.statut === "En transit" ? colors.warningLight : colors.errorLight;
  const noteColor = lot.note >= 90 ? colors.success : lot.note >= 80 ? colors.warning : colors.error;
  const noteBg = lot.note >= 90 ? colors.successLight : lot.note >= 80 ? colors.warningLight : colors.errorLight;

  return (
    <motion.div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      whileHover={{ y: -3, transition: { duration: 0.25 } }}
      style={{
        background: colors.surface, borderRadius: 14, padding: 18,
        border: `1.5px solid ${colors.borderLight}`,
        cursor: "pointer", transition: "border-color 0.3s, box-shadow 0.3s",
        position: "relative", overflow: "hidden",
        boxShadow: colors.shadowXs,
      }}
    >
      {hover && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${colors.accent}60, transparent)`,
        }} />
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: 11, fontWeight: 600, color: colors.accent, letterSpacing: "0.3px" }}>{lot.id}</span>
            <span style={{
              fontSize: 10, padding: "2px 8px", borderRadius: 6,
              fontWeight: 600, background: statusBg, color: statusColor,
              border: `1px solid ${statusColor}20`,
            }}>{t("lotStatus." + lot.statut)}</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: colors.text, letterSpacing: "-0.01em" }}>{tCrop(lot.culture)}</div>
        </div>
        <motion.button
          onClick={onToggleFav}
          whileHover={{ scale: 1.2, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: 4, display: "flex",
            color: fav ? colors.gold : colors.border,
            transition: "color 0.15s",
          }}
        >
          <Star size={14} weight={fav ? "fill" : "regular"} />
        </motion.button>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {lot.origine && <Tag icon={MapPin} text={lot.origine} />}
        {lot.quantite && <Tag icon={Package} text={lot.quantite} />}
        {lot.certification && <Tag icon={SealCheck} text={lot.certification} />}
      </div>

      <div style={{ marginBottom: 8 }}>
        <CompletenessGauge result={computeLotCompleteness(lot)} size="sm" />
      </div>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderTop: `1px solid ${colors.borderLight}`, paddingTop: 12, marginTop: 4,
      }}>
        <div>
          <span style={{ fontSize: 18, fontWeight: 700, color: colors.accent, letterSpacing: "-0.3px" }}>
            {formatNumber(lot.prix)}
          </span>
            <span style={{ fontSize: 11, color: colors.textSecondary, marginLeft: 4, fontWeight: 500 }}>{t("common.currency")}{t("common.perKg")}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            fontSize: 11, padding: "3px 10px", borderRadius: 6,
            fontWeight: 600, background: noteBg, color: noteColor,
            border: `1px solid ${noteColor}20`,
          }}>{lot.note}/100</span>
          <motion.div
            animate={{ x: hover ? 2 : 0 }}
            transition={{ duration: 0.2 }}
            style={{
              width: 24, height: 24, borderRadius: 6,
              background: colors.accentLight, display: "flex",
              alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ArrowRight size={12} color={colors.accent} weight="bold" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function Tag({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  const { colors } = useTheme();
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10,
      color: colors.textSecondary, background: colors.surfaceHover, padding: "2px 8px",
      borderRadius: 6, border: `1px solid ${colors.borderLight}`,
    }}>
      <Icon size={10} /> {text}
    </span>
  );
}

function Sparkline({ data, color, width = 72, height = 22 }: { data: number[]; color: string; width?: number; height?: number }) {
  if (!data?.length) return null;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`spark-fill-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

const QUICK_ACTIONS = [
  { labelKey: "dashboard.quickActions.viewLots", icon: Package, path: "/lots", color: "#0d7a4a", roles: ["buyer", "farmer"] as string[] },
  { labelKey: "dashboard.quickActions.certificates", icon: SealCheck, path: "/certificates", color: "#2d6fc4", roles: ["buyer", "farmer"] },
  { labelKey: "dashboard.quickActions.newOrder", icon: ShoppingCart, path: "/orders", color: "#c45d2e", roles: ["buyer"] },
  { labelKey: "nav.contracts", icon: FileText, path: "/contracts", color: "#7c3aed", roles: ["buyer", "farmer"] },
  { labelKey: "dashboard.quickActions.viewFarmers", icon: Users, path: "/farmers", color: "#c4942e", roles: ["buyer"] },
];

const STAT_META = [
  { icon: Package, color: "#0d7a4a", subKey: "dashboard.stats.active" },
  { icon: TrendUp, color: "#2d6fc4", subKey: "dashboard.stats.volume" },
  { icon: Users, color: "#c45d2e", subKey: "dashboard.stats.farmers" },
  { icon: SealCheck, color: "#7c3aed", subKey: "dashboard.stats.certified" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justOnboarded = searchParams.get("onboarded") === "true";
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  const profile = useUserProfile();
  const [favorites, setFavorites] = React.useState<string[]>(() => getFavorites());
  const [alerts, setAlerts] = React.useState<PriceAlert[]>(() => getAlerts());
  const [showAlertForm, setShowAlertForm] = React.useState(false);
  const [alertCrop, setAlertCrop] = React.useState("");
  const [alertDir, setAlertDir] = React.useState<"above" | "below">("above");
  const [alertTarget, setAlertTarget] = React.useState("");

  const { data: stats } = useQuery({ queryKey: ["dash-stats"], queryFn: fetchDashboardStats });
  const { data: lots, isLoading: lotsLoading } = useQuery({ queryKey: ["dash-lots"], queryFn: () => fetchLots({ statut: "Disponible" }) });
  const { data: prices, isLoading: pricesLoading } = useQuery({ queryKey: ["dash-prices"], queryFn: fetchMarketPrices, refetchInterval: 180000 });
  const { data: allCerts } = useQuery({ queryKey: ["dash-certs"], queryFn: fetchCertificates });
  const { data: compliance } = useQuery({ queryKey: ["dash-compliance"], queryFn: fetchComplianceSummary });
  const { data: dashOrders } = useQuery({ queryKey: ["dash-orders"], queryFn: fetchOrders });

  const expiringCerts = React.useMemo(() => {
    if (!allCerts) return [];
    const parseDate = (s: string) => { const p = s.split("/"); return new Date(+p[2], +p[1] - 1, +p[0]); };
    const now = new Date();
    return (allCerts as Certificate[])
      .filter((c) => { const d = parseDate(c.expire); return d.getTime() - now.getTime() > 0; })
      .sort((a, b) => parseDate(a.expire).getTime() - parseDate(b.expire).getTime())
      .slice(0, 3)
      .map((c) => {
        const days = Math.ceil((parseDate(c.expire).getTime() - now.getTime()) / 86400000);
        return { type: c.type, lot: c.lot, expire: c.expire, days, urgent: days <= 30 };
      });
  }, [allCerts]);

  const handleFav = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    toggleFavorite(id);
    setFavorites(getFavorites());
  };

  const hour = new Date().getHours();
  const greetingKey = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  const heroIcon = profile.isPotentialBuyer ? Sparkle
    : profile.isActiveBuyer ? ShoppingCart
    : profile.isFarmer ? Leaf
    : Globe;

  const heroTitleKey = profile.isPotentialBuyer ? "dashboard.heroTitleDiscovery"
    : profile.isFarmer ? "dashboard.heroFarmer"
    : profile.isActiveBuyer ? "dashboard.heroActiveBuyer"
    : "dashboard.heroTitle";

  const heroGreetingKey = profile.isPotentialBuyer ? "dashboard.greeting.discovery"
    : profile.isActiveBuyer ? "dashboard.greeting.activeBuyer"
    : profile.isFarmer ? "dashboard.greeting.farmer"
    : "dashboard.greeting.other";

  const productsOfInterest = profile.onboarding.productsOfInterest ?? [];
  const regionsOfInterest = profile.onboarding.regionsOfInterest ?? [];

  const filteredLots = React.useMemo(() => {
    if (!lots) return [];
    let result = lots as Lot[];
    if (productsOfInterest.length > 0) {
      result = result.filter((l: Lot) => productsOfInterest.includes(l.culture));
    }
    if (regionsOfInterest.length > 0) {
      result = result.filter((l: Lot) => regionsOfInterest.includes(l.region));
    }
    return result;
  }, [lots, productsOfInterest, regionsOfInterest]);

  const recentLots = filteredLots.slice(0, 6);

  const filteredPrices = React.useMemo(() => {
    if (!prices) return [];
    if (productsOfInterest.length === 0) return prices;
    return (prices as MarketPrice[]).filter((p) => productsOfInterest.includes(p.crop));
  }, [prices, productsOfInterest]);

  const tourSteps: TourStep[] = [
    { target: "hero", title: t("tour.welcome"), description: t("tour.welcomeDesc") },
    { target: "stats", title: t("tour.stats"), description: t("tour.statsDesc") },
    { target: "market", title: t("tour.market"), description: t("tour.marketDesc") },
    { target: "lots", title: t("tour.lots"), description: t("tour.lotsDesc") },
  ];

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      <WelcomeTour steps={tourSteps} autoStart={justOnboarded} />

      {/* Email Verification */}
      <EmailVerificationBanner />

      {/* Hero Section */}
      <div style={{
        borderRadius: 20, padding: isMobile ? "28px 24px" : "40px 48px",
        marginBottom: 28, position: "relative", overflow: "hidden",
        background: "linear-gradient(135deg, #064e34 0%, #0a6e4a 40%, #0d8a5c 70%, #0a6e4a 100%)",
      }}>
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `
            radial-gradient(ellipse at 15% 40%, rgba(255,255,255,0.06) 0%, transparent 60%),
            radial-gradient(ellipse at 85% 30%, rgba(76,175,80,0.07) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 90%, rgba(255,255,255,0.03) 0%, transparent 50%)
          `,
        }} />
        <div style={{
          position: "absolute", inset: 0, opacity: 0.03, pointerEvents: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23fff' fill-opacity='0.1'%3E%3Cpath d='M0 0h1v40H0zM40 0h1v40H0z'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 4 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {React.createElement(heroIcon, { size: 22, weight: "fill", color: "#fff" })}
                </div>
                <div>
                  <div style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
                    {t(`dashboard.greeting.${greetingKey}`)} — {t(heroTitleKey)}
                  </div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 1, fontWeight: 500 }}>
                    {t(heroGreetingKey)}
                    {profile.interestsLabel && ` \u2022 ${profile.interestsLabel}`}
                  </div>
                </div>
              </div>

              <motion.div variants={staggerContainer} initial="hidden" animate="visible" style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
                {!stats ? Array.from({ length: 4 }).map((_, i) => (
                  <motion.div key={i} variants={staggerItem} style={{
                    background: "rgba(255,255,255,0.06)", borderRadius: 8,
                    padding: "10px 16px", minWidth: 100,
                  }}>
                    <div style={{
                      height: 22, width: 60, borderRadius: 4,
                      background: "linear-gradient(90deg, rgba(255,255,255,0.08) 25%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.08) 75%)",
                      backgroundSize: "200% 100%",
                      animation: "shimmerSkeleton 1.5s ease-in-out infinite",
                    }} />
                  </motion.div>
                )) : (stats ?? []).map((s, i) => (
                  <motion.div key={s.labelKey} variants={staggerItem} style={{
                    background: "rgba(255,255,255,0.07)", backdropFilter: "blur(10px)",
                    borderRadius: 8, padding: "10px 16px", minWidth: 100,
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.3px" }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginTop: 1 }}>{t(s.labelKey)}</div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <motion.div variants={staggerContainer} initial="hidden" animate="visible" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {QUICK_ACTIONS.filter((a) => {
                if (profile.isBuyer && a.roles.includes("buyer")) return true;
                if (profile.isFarmer && a.roles.includes("farmer")) return true;
                if (profile.isOther) return true;
                return a.roles.includes("buyer");
              }).map((a) => (
                <motion.div key={a.labelKey} variants={staggerItem}>
                  <QuickActionButton icon={a.icon} label={t(a.labelKey)} onClick={() => navigate(a.path)} color={a.color} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Profile completeness */}
      <ProfileCompletenessCard />

      <PermissionGate permission="producer.hub">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate("/producer")}
          style={{
            background: `linear-gradient(135deg, ${colors.accent}18, ${colors.accent}08)`,
            borderRadius: 14, padding: "14px 18px", marginBottom: 24,
            border: `1px solid ${colors.accent}22`, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 12,
          }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${colors.accent}20`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Package size={18} color={colors.accent} weight="fill" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{t("nav.farmerHub")}</div>
            <div style={{ fontSize: 11, color: colors.textMuted }}>{t("producer.hubDesc")}</div>
          </div>
          <ArrowRight size={16} color={colors.accent} weight="bold" />
        </motion.div>
      </PermissionGate>

      {/* Stats Row */}
      <StaggerGrid columns={isMobile ? "1fr 1fr" : "repeat(4, 1fr)"} gap={14} stagger={60} baseDelay={50}>
        {!stats
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: colors.surface, borderRadius: 14, padding: "22px 24px" }}>
                <Skeleton width={44} height={44} radius={12} mb={12} />
                <Skeleton width="40%" height={12} mb={6} />
                <Skeleton width="70%" height={24} mb={4} />
                <Skeleton width="50%" height={12} />
              </div>
            ))
          : (stats ?? []).map((s, i) => (
              <motion.div key={s.labelKey} variants={staggerItem}>
                <StatCard icon={STAT_META[i]?.icon || Package} value={s.value} label={t(s.labelKey)} sub={s.sub} color={STAT_META[i]?.color} />
              </motion.div>
            ))}
      </StaggerGrid>

      {/* Hub Quick-Links */}
      <HubQuickLinks navigate={navigate} t={t} colors={colors} isMobile={isMobile} />

      {/* Two-Column: Market Prices + Recent Lots */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.1fr 0.9fr", gap: 24, marginTop: 28 }}>

        {/* Market Prices */}
        <Card variant="premium">
          <CardHeader icon={<TrendUp size={18} />} title={t("dashboard.marketPrices.title")} subtitle={t("dashboard.marketPrices.lastUpdate")} />
          {pricesLoading ? (
            <div style={{ padding: "16px 0" }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <Skeleton width="35%" height={14} />
                  <Skeleton width="25%" height={14} />
                </div>
              ))}
            </div>
          ) : (prices ?? []).length === 0 ? (
            <p style={{ fontSize: 13, color: colors.textMuted, padding: "12px 0" }}>{t("dashboard.cannotLoad")}</p>
          ) : (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {(filteredPrices).slice(0, 8).map((p, i) => {
                const changeDir = p.change > 0 ? "up" : p.change < 0 ? "down" : "flat";
                const changeColor = p.change > 0 ? colors.success : p.change < 0 ? colors.error : colors.textMuted;
                return (
                  <motion.div key={p.crop + i} variants={staggerItem} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "8px 0", borderBottom: i < 7 ? `1px solid ${colors.borderLight}` : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: changeColor, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: colors.text }}>{tCrop(p.crop)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {p.history && <Sparkline data={p.history} color={colors.accent} width={48} height={18} />}
                      <span style={{ fontSize: 13, fontWeight: 600, color: colors.text, minWidth: 70, textAlign: "right" }}>
                        {p.price ? formatNumber(p.price) : "—"}
                      </span>
                      <div style={{ minWidth: 32, textAlign: "right" }}>
                        {changeDir !== "flat" && (
                          <span style={{ fontSize: 10, fontWeight: 600, color: changeColor, display: "inline-flex", alignItems: "center", gap: 1 }}>
                            {p.change > 0 ? <CaretUp size={10} weight="fill" /> : <CaretDown size={10} weight="fill" />}
                            {Math.abs(p.change)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
          <CardDivider />
          <div style={{ textAlign: "center" }}>
            <Button variant="ghost" size="sm" onClick={() => navigate("/price-history")}>
              {t("dashboard.marketPrices.viewAll")} →
            </Button>
          </div>
        </Card>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Recent Lots */}
          <Card variant="premium">
            <CardHeader icon={<Package size={18} />} title={t("dashboard.recentLots.title")}
              action={<Button variant="ghost" size="sm" onClick={() => navigate("/lots")}>{t("dashboard.recentLots.viewAll")} →</Button>}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {lotsLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, padding: "4px 0" }}>
                      <Skeleton width={32} height={32} radius={8} />
                      <div style={{ flex: 1 }}>
                        <Skeleton width="55%" height={12} mb={4} />
                        <Skeleton width="35%" height={10} />
                      </div>
                    </div>
                  ))
                : recentLots.length === 0
                  ? <p style={{ fontSize: 13, color: colors.textMuted, padding: "8px 0" }}>{t("dashboard.empty.lotsTitle")}</p>
                  : recentLots.slice(0, 4).map((lot, i) => (
                      <motion.div
                        key={lot.id}
                        variants={slideUp}
                        initial="hidden"
                        animate="visible"
                        custom={i}
                        onClick={() => navigate(`/lots/${lot.id}`)}
                        whileHover={{ x: 4, transition: { duration: 0.2 } }}
                        style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "8px 0", cursor: "pointer",
                          borderBottom: i < Math.min(recentLots.length, 4) - 1 ? `1px solid ${colors.borderLight}` : "none",
                          borderRadius: 6,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = colors.surfaceHover; e.currentTarget.style.padding = "8px 8px"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.padding = "8px 0"; }}
                      >
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: colors.accentLight, display: "flex",
                          alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          <Package size={14} color={colors.accent} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {tCrop(lot.culture)}
                          </div>
                          <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>
                            {lot.origine && `${lot.origine} · `}{formatNumber(lot.prix)} {t("common.currency")}{t("common.perKg")}
                          </div>
                        </div>
                        <div style={{
                          fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
                          background: lot.statut === "Disponible" ? colors.successLight : colors.warningLight,
                          color: lot.statut === "Disponible" ? colors.success : colors.warning,
                        }}>
                          {t("lotStatus." + lot.statut)}
                        </div>
                      </motion.div>
                    ))}
            </div>
          </Card>

          {/* Active Deals — Escrow + Negotiations */}
          <EscrowDashboardWidget onViewAll={() => navigate("/escrow")} />
          <NegotiationWidget />

          {/* Smart Recommendations */}
          <SmartFeed />
        </div>
      </div>

      {/* Active Alerts & Urgent Items */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 24, marginTop: 28 }}>

        {/* Pending Verifications */}
        <Card variant="premium">
          <CardHeader icon={<ShieldCheck size={18} />} title={t("dashboard.verifications.title")}
            action={<Button variant="ghost" size="sm" onClick={() => navigate("/orders")}>{t("dashboard.verifications.viewAll")} →</Button>}
          />
          {(() => {
            const orders = (dashOrders ?? []) as Order[];
            const pending = orders.filter((o) => o.statut === "Dépôt reçu" || o.statut === "En inspection");
            if (!dashOrders) return Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} width="100%" height={40} radius={8} mb={8} />);
            if (pending.length === 0) return <p style={{ fontSize: 13, color: colors.textMuted, padding: "8px 0" }}>{t("dashboard.verifications.none")}</p>;
            return pending.slice(0, 4).map((o, i: number) => (
              <div key={o.id} onClick={() => navigate("/orders")} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 0", cursor: "pointer", borderRadius: 6,
                borderBottom: i < pending.slice(0, 4).length - 1 ? `1px solid ${colors.borderLight}` : "none",
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = colors.surfaceHover}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: o.statut === "En inspection" ? colors.warningLight : colors.accentLight,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <ShieldCheck size={14} color={o.statut === "En inspection" ? colors.warning : colors.accent} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{o.id}</div>
                    <div style={{ fontSize: 10, color: colors.textMuted }}>{t("crops." + o.culture, o.culture)} · {o.verificationPointName || "—"}</div>
                  </div>
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
                  background: o.statut === "En inspection" ? colors.warningLight : colors.accentLight,
                  color: o.statut === "En inspection" ? colors.warning : colors.accent,
                }}>
                  {o.statut === "Dépôt reçu" ? t("orders.status.depositReceived") : t("orders.status.inspection")}
                </div>
              </div>
            ));
          })()}
        </Card>

        {/* Expiring Certificates */}
        <Card variant="premium">
          <CardHeader icon={<Clock size={18} />} title={t("dashboard.expiry.title")} />
          {expiringCerts.length === 0 ? (
            <p style={{ fontSize: 13, color: colors.textMuted, padding: "8px 0" }}>{t("common.noData")}</p>
          ) : expiringCerts.map((c, i) => (
            <div key={c.lot + i} onClick={() => navigate("/certificates")} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "9px 0", cursor: "pointer", borderRadius: 6,
              borderBottom: i < expiringCerts.length - 1 ? `1px solid ${colors.borderLight}` : "none",
              animation: `fadeSlideUp 0.3s ease ${0.05 * i}s both`,
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = colors.surfaceHover}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.type}
                </div>
                <div style={{ fontSize: 11, color: colors.textMuted }}>{c.lot}</div>
              </div>
              <div style={{
                fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6,
                background: c.urgent ? colors.errorLight : colors.successLight,
                color: c.urgent ? colors.error : colors.success,
                whiteSpace: "nowrap",
              }}>
                {c.days} {t("dashboard.expiry.days")}
              </div>
            </div>
          ))}
          <CardDivider />
          <div style={{ textAlign: "center" }}>
            <Button variant="ghost" size="sm" onClick={() => navigate("/certificates")}>
              {t("dashboard.expiry.viewAll")} →
            </Button>
          </div>
        </Card>
      </div>

      {/* Market Intelligence Brief */}
      <div style={{ marginTop: 28 }}>
        <MarketBriefCard onViewAll={() => navigate("/impact")} />
      </div>





      {/* Top Lots Grid */}
      <div style={{ marginTop: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: colors.text, letterSpacing: "-0.3px" }}>{t("dashboard.recentLots.title")}</h2>
          <Button variant="ghost" size="sm" onClick={() => navigate("/lots")}>{t("dashboard.recentLots.viewAll")} →</Button>
        </div>
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {lotsLoading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} width="100%" height={170} radius={14} />)
            : recentLots.map((lot, i) => (
                <motion.div key={lot.id} variants={staggerItem}>
                  <LotCard lot={lot} fav={favorites.includes(lot.id)} onToggleFav={(e) => handleFav(e, lot.id)} onClick={() => navigate(`/lots/${lot.id}`)} />
                </motion.div>
              ))}
        </motion.div>
      </div>

      {/* Followed Farmers */}
      <div style={{ marginTop: 28 }}>
        <FollowedFarmersPanel />
      </div>
    </div>
  );
}

function HubQuickLinks({ navigate, t, colors, isMobile }: any) {
  const hubs = [
          { key: "shop", icon: Package, path: "/shop", color: colors.info, descKey: "dashboard.hubShopDesc" },
          { key: "business", icon: FileText, path: "/business", color: colors.accent, descKey: "dashboard.hubBusinessDesc" },
          { key: "intelligence", icon: ChartBar, path: "/intelligence", color: colors.warning, descKey: "dashboard.hubIntelDesc" },
  ];
  return (
    <div style={{
      display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12, marginTop: 24,
    }}>
      {hubs.map((h) => {
        const Icon = h.icon;
        return (
          <motion.div key={h.key} onClick={() => navigate(h.path)}
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              background: colors.surface, borderRadius: 14, padding: "16px 18px",
              border: `1.5px solid ${colors.borderLight}`, cursor: "pointer",
              boxShadow: colors.shadowXs,
            }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `${h.color}15`, display: "flex",
              alignItems: "center", justifyContent: "center", marginBottom: 10,
            }}>
              <Icon size={18} weight="fill" color={h.color} />
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.text, marginBottom: 2 }}>
              {t("nav." + h.key)}
            </div>
            <div style={{ fontSize: 11, color: colors.textMuted, lineHeight: 1.5 }}>
              {t(h.descKey)}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
