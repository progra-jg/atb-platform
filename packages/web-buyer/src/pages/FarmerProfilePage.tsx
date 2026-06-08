import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBuyerId } from "../utils/buyer";
import { sendMessage } from "../services/messages";
import { useTranslation } from "react-i18next";
import { tCrop } from "../utils/i18n";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, ArrowRight, User, MapPin, Buildings, Clock,
  SealCheck, ShieldCheck, Cube, TreeEvergreen, Binoculars,
  Circuitry, Scales as Balance, CheckCircle, WarningCircle,
  ArrowUp, ArrowDown, CaretRight, Phone, Envelope, Eye,
  EyeSlash, MapTrifold, DownloadSimple, Package, ChatText,
} from "@phosphor-icons/react";
import Button from "../components/ui/Button";
import FollowButton from "../components/FollowButton";
import { useTheme } from "../context/ThemeContext";
import FadeIn from "../components/FadeIn";
import Breadcrumb from "../components/Breadcrumb";
import BlockchainBadge from "../components/BlockchainBadge";
import MapView from "../components/MapView";
import { useIsMobile } from "../hooks/useMediaQuery";
import { fetchFarmerProfile } from "../services/farmers";
import { fetchLots } from "../services/lots";
import { fetchOrders } from "../services/orders";
import { getSellerReviews } from "../services/reviews";
import { downloadFarmerProfilePDF } from "../utils/export";
import { computeTrustScore } from "../utils/scoring";
import TrustBadge from "../components/TrustBadge";
import type { Weighing, Transaction } from "../types";
import { formatNumber } from "../utils/format";

function Skeleton({ h = 20, w = "100%", r = 6 }: { h?: number; w?: string | number; r?: number }) {
  const { colors } = useTheme();
  return <div style={{ height: h, width: typeof w === "number" ? w : w, borderRadius: r, background: `linear-gradient(90deg, ${colors.borderLight} 25%, ${colors.surface} 50%, ${colors.borderLight} 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.2s ease-in-out infinite" }} />;
}

const TX_TYPE_COLORS: Record<string, string> = {
  Vente: "#059669", Livraison: "#2563eb", Avance: "#d97706", Paiement: "#7c3aed",
};

function FarmerProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  const profileRef = useRef<HTMLDivElement>(null);
  const [showHashes, setShowHashes] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showEUDR, setShowEUDR] = useState(false);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const [showTrustBreakdown, setShowTrustBreakdown] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowContact(false); setShowEUDR(false);
        setShowScoreBreakdown(false); setShowTrustBreakdown(false);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const { data: farmerLots } = useQuery({ queryKey: ["lots"], queryFn: () => fetchLots() });
  const { data: farmer, isLoading, isError } = useQuery({
    queryKey: ["farmer", id],
    queryFn: () => fetchFarmerProfile(id || ""),
    enabled: !!id,
  });
  const { data: farmerOrders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: () => fetchOrders(),
  });
  const { data: farmerReviews = [] } = useQuery({
    queryKey: ["farmerReviews", id],
    queryFn: () => id ? getSellerReviews(id) : Promise.resolve([] as import("../types").Review[]),
    enabled: !!id,
  });

  if (isError && !isLoading) {
    return (
      <FadeIn>
        <div style={{ textAlign: "center", padding: isMobile ? 60 : 80 }}>
          <User size={48} style={{ opacity: 0.3, marginBottom: 12, color: colors.textMuted }} />
          <h2 style={{ color: colors.text, margin: "0 0 8px", fontSize: isMobile ? 20 : 24 }}>{t("farmer.error")}</h2>
          <p style={{ color: colors.textMuted, marginBottom: 16 }}>{t("farmer.errorDesc")}</p>
          <Button variant="primary" onClick={() => navigate("/lots")}>{t("farmer.back")}</Button>
        </div>
      </FadeIn>
    );
  }
  if (isLoading) {
    return (
      <FadeIn>
        <div>
          <Skeleton h={14} w={180} />
          <Skeleton h={isMobile ? 220 : 180} r={14} />
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
              {[1, 2, 3].map((i) => <Skeleton key={i} h={100} r={14} />)}
            </div>
            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
              <Skeleton h={320} r={14} /><Skeleton h={320} r={14} />
            </div>
          </div>
        </div>
      </FadeIn>
    );
  }
  if (!farmer) {
    return (
      <FadeIn>
        <div style={{ textAlign: "center", padding: isMobile ? 60 : 80 }}>
          <User size={48} style={{ opacity: 0.3, marginBottom: 12, color: colors.textMuted }} />
          <h2 style={{ color: colors.text, margin: "0 0 8px", fontSize: isMobile ? 20 : 24 }}>{t("farmer.notFound")}</h2>
          <p style={{ color: colors.textMuted, marginBottom: 16 }}>{t("farmer.notFoundDesc", { id })}</p>
          <Button variant="primary" onClick={() => navigate("/lots")}>{t("farmer.back")}</Button>
        </div>
      </FadeIn>
    );
  }

  const f = farmer;
  const renderScoreRing = (score: number) => {
    const c = score >= 90 ? "#059669" : score >= 70 ? "#d97706" : "#dc2626";
    return (
      <svg width="52" height="52" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r="22" fill="none" stroke={colors.borderLight} strokeWidth="4" />
        <circle cx="26" cy="26" r="22" fill="none" stroke={c} strokeWidth="4"
          strokeDasharray={`${(score / 100) * 138.2} 138.2`} strokeLinecap="round" transform="rotate(-90 26 26)" />
        <text x="26" y="26" textAnchor="middle" dominantBaseline="central" fill={c} fontSize="14" fontWeight="700">{score}</text>
      </svg>
    );
  };

  const yieldData = f.yieldPrediction;
  const maxYield = Math.max(...yieldData.history.map((h: any) => h.value), yieldData.predicted);
  const barColorFn = (val: number) => val === yieldData.predicted ? "#059669" : colors.accent;
  const farmerLotsList = farmerLots?.filter((l) => l.producteur === f.displayName) ?? [];

  const txLabel = (type: string) => {
    const m: Record<string, string> = {
      Vente: t("farmer.transactionTypes.sale"),
      Livraison: t("farmer.transactionTypes.delivery"),
      Avance: t("farmer.transactionTypes.advance"),
      Paiement: t("farmer.transactionTypes.payment"),
    };
    return m[type] || type;
  };

  const scoreBreakdown = [
    { label: t("farmer.scoreBreakdown.quality"), score: 97, max: 100, color: "#059669" },
    { label: t("farmer.scoreBreakdown.punctuality"), score: 96, max: 100, color: "#059669" },
    { label: t("farmer.scoreBreakdown.certificationCompliance"), score: 95, max: 100, color: "#059669" },
    { label: t("farmer.scoreBreakdown.tracedVolume"), score: 88, max: 100, color: "#d97706" },
    { label: t("farmer.scoreBreakdown.seniority"), score: 100, max: 100, color: "#059669" },
  ];
  const trustBreakdown = [
    { label: t("farmer.trustBreakdown.totalDeliveries"), value: "48", color: colors.text },
    { label: t("farmer.trustBreakdown.compliant"), value: "47", color: "#059669" },
    { label: t("farmer.trustBreakdown.late"), value: "1", color: "#d97706" },
    { label: t("farmer.trustBreakdown.refused"), value: "0", color: "#059669" },
    { label: t("farmer.trustBreakdown.complianceRate"), value: "98%", color: "#059669" },
  ];

  const CARD = { background: colors.surface, borderRadius: 14, border: `1.5px solid ${colors.border}`, boxShadow: colors.shadowMd };

  function renderControls() {
    return (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isMobile ? 16 : 20 }}>
        <button onClick={() => navigate(-1)} style={{
          background: "none", border: "none", color: colors.accent, cursor: "pointer",
          fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, padding: 0,
        }}>
          <ArrowLeft size={16} /> {t("farmer.back")}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: colors.textMuted }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#059669" }} />
            {t("farmer.lastSync")} 15/05/2026
          </div>
          <button onClick={() => { if (profileRef.current) downloadFarmerProfilePDF(profileRef.current, f.anonymousId, (localStorage.getItem("lang") || "fr") as "fr" | "en"); }} style={{
            display: "flex", alignItems: "center", gap: 6,
            border: `1.5px solid ${colors.borderLight}`, padding: "7px 14px", borderRadius: 8,
            cursor: "pointer", background: colors.surface, color: colors.text, fontSize: 12, fontWeight: 500,
          }}>
            <DownloadSimple size={14} /> {t("dashboard.exportPdf")}
          </button>
        </div>
      </div>
    );
  }

  function renderHeader() {
    return (
      <div style={{ ...CARD, overflow: "hidden", marginBottom: isMobile ? 16 : 24 }}>
        <div style={{
          height: isMobile ? 80 : 100, background: `linear-gradient(135deg, ${colors.accent}, #059669, #34d399)`,
          position: "relative",
        }}>
          <div style={{
            position: "absolute", left: isMobile ? 16 : 28, bottom: isMobile ? -28 : -32,
            width: isMobile ? 56 : 72, height: isMobile ? 56 : 72, borderRadius: 14,
            background: `linear-gradient(135deg, ${colors.accent}, #34d399)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `3px solid ${colors.surface}`, boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}>
            <span style={{ color: "white", fontWeight: 800, fontSize: isMobile ? 20 : 26 }}>
              {f.displayName.split(" ").map((n: string) => n[0]).join("")}
            </span>
          </div>
        </div>
        <div style={{ padding: isMobile ? "34px 16px 16px" : "40px 28px 24px", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 10 : 0 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, margin: 0, color: colors.text }}>
                  {f.anonymousId}
                </h1>
                {f.anonymous && (
                  <span style={{ fontSize: 9, background: "#fef3c7", color: "#d97706", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>
                    {t("farmer.anonymous")}
                  </span>
                )}
                <BlockchainBadge verified={f.didVerified} hash={f.didHash} size="sm" />
              </div>
              {!f.anonymous && (
                <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 500, color: colors.textSecondary, marginBottom: 8 }}>
                  {f.displayName}
                </div>
              )}
              <div style={{ display: "flex", flexWrap: "wrap", gap: isMobile ? 6 : 12, fontSize: isMobile ? 11 : 12, color: colors.textMuted }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Buildings size={13} /> {f.cooperative}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={13} /> {f.localisation}, Bénin</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={13} /> {f.experience} {t("farmer.years")}</span>
              </div>
            </div>
            <FollowButton farmerId={f.anonymousId} size="sm" />
          </div>
        </div>
      </div>
    );
  }

  function renderKPIs() {
    const trustScoreResult = computeTrustScore(f, farmerOrders, farmerLotsList, farmerReviews);
    return (
      <div style={{
        display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)",
        gap: isMobile ? 12 : 16, marginBottom: isMobile ? 16 : 24,
      }}>
        <div onClick={() => setShowScoreBreakdown(true)} style={{ ...CARD, padding: isMobile ? 14 : 20, cursor: "pointer", transition: "all 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.boxShadow = "0 8px 24px rgba(10,110,74,0.12)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.boxShadow = colors.shadowMd; }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {renderScoreRing(f.credibilityScore)}
            <div>
              <div style={{ fontSize: isMobile ? 11 : 12, color: colors.textMuted, marginBottom: 2 }}>{t("farmer.credibilityScore")}</div>
              <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, color: colors.text }}>
                {f.credibilityScore >= 90 ? t("farmer.excellent") : f.credibilityScore >= 70 ? t("farmer.good") : t("farmer.average")}
              </div>
            </div>
          </div>
        </div>
        <div onClick={() => setShowTrustBreakdown(true)} style={{ ...CARD, padding: isMobile ? 14 : 20, cursor: "pointer", transition: "all 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.accent; e.currentTarget.style.boxShadow = "0 8px 24px rgba(10,110,74,0.12)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.border; e.currentTarget.style.boxShadow = colors.shadowMd; }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShieldCheck size={24} color="#059669" weight="fill" />
            </div>
            <div>
              <div style={{ fontSize: isMobile ? 11 : 12, color: colors.textMuted, marginBottom: 2 }}>{t("farmer.trustIndex")}</div>
              <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: "#059669" }}>{f.trustIndex}%</div>
              <div style={{ fontSize: isMobile ? 10 : 11, color: colors.textMuted }}>{t("farmer.compliantDeliveries")}</div>
            </div>
          </div>
        </div>
        <div style={{ ...CARD, padding: isMobile ? 14 : 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Cube size={24} color="#d97706" weight="fill" />
            </div>
            <div>
              <div style={{ fontSize: isMobile ? 11 : 12, color: colors.textMuted, marginBottom: 2 }}>{t("farmer.tracedVolume")}</div>
              <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: colors.text }}>
                {formatNumber(f.totalTracedVolume)}
                <span style={{ fontSize: isMobile ? 11 : 13, fontWeight: 500, color: colors.textMuted }}> {f.volumeUnit}</span>
              </div>
              <div style={{ fontSize: isMobile ? 10 : 11, color: "#059669" }}>
                <ArrowUp size={10} weight="bold" style={{ verticalAlign: "middle" }} /> +12% {t("farmer.vs2025")}
              </div>
            </div>
          </div>
        </div>
        <div style={{ ...CARD, padding: 0, overflow: "hidden" }}>
          <TrustBadge result={trustScoreResult} size="md" />
        </div>
      </div>
    );
  }

  function renderTechnical() {
    return (
      <div style={{
        display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: isMobile ? 12 : 16, marginBottom: isMobile ? 16 : 24,
      }}>
        <div style={{ ...CARD, overflow: "hidden" }}>
          <div style={{ padding: isMobile ? 14 : 20, paddingBottom: 0 }}>
            <h3 style={{ fontSize: isMobile ? 14 : 15, fontWeight: 600, margin: "0 0 4px", color: colors.text, display: "flex", alignItems: "center", gap: 6 }}>
              <MapTrifold size={16} color={colors.accent} /> {t("farmer.parcelles")}
            </h3>
            <div style={{ fontSize: isMobile ? 11 : 12, color: colors.textMuted, marginBottom: 12 }}>
              {f.superficie} Ha · {f.parcelleCount} {t("farmer.parcellesCount")} · PostGIS
            </div>
          </div>
          <div style={{ height: 220 }}>
            <MapView parcelles={f.parcelles.map((p: any) => ({ id: p.id, culture: p.culture, superficie: p.superficie, coordinates: p.coordinates }))} center={f.center} zoom={15} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? 12 : 16 }}>
          <div style={{
            background: `linear-gradient(135deg, ${f.eudr.compliant ? colors.accent : "#7f1d1d"}, ${f.eudr.compliant ? "#059669" : "#dc2626"})`,
            borderRadius: 14, padding: isMobile ? 14 : 20, color: "white",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {f.eudr.compliant ? <TreeEvergreen size={20} weight="fill" /> : <WarningCircle size={20} weight="fill" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  {f.eudr.compliant ? t("farmer.eudrCompliant") : t("farmer.eudrNonCompliant")}
                  <span style={{ fontSize: 9, background: "rgba(255,255,255,0.2)", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>EUDR</span>
                </div>
                <div style={{ fontSize: isMobile ? 11 : 12, opacity: 0.85, lineHeight: 1.5, marginBottom: 8 }}>
                  {t("farmer.deforestationFree")} · {t("farmer.sentinel2")}
                </div>
                <div style={{ display: "flex", gap: isMobile ? 8 : 16, fontSize: isMobile ? 10 : 11, opacity: 0.75 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Binoculars size={11} /> {t("farmer.lastAnalysis")} {f.eudr.lastAnalysis}
                  </span>
                  <span>NDVI: {(f.eudr.ndviScore * 100).toFixed(0)}%</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setShowEUDR(true); }} style={{
                  background: "rgba(255,255,255,0.15)", border: "none", color: "white",
                  padding: "2px 10px", borderRadius: 8, fontSize: 10, fontWeight: 600, cursor: "pointer", marginTop: 8,
                }}>
                  {t("common.details")}
                </button>
              </div>
            </div>
          </div>
          <div style={{ ...CARD, padding: isMobile ? 14 : 20, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Circuitry size={20} color="#059669" />
              </div>
              <div>
                <h3 style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, margin: "0 0 2px", color: colors.text }}>{t("farmer.aiPrediction")}</h3>
                <div style={{ fontSize: isMobile ? 10 : 11, color: colors.textMuted }}>
                  {t("farmer.modelVersion")} {yieldData.modelVersion} · {t("farmer.lastUpdated")} {yieldData.lastUpdated}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4, padding: "10px 14px", background: colors.statBg, borderRadius: 10 }}>
              <span style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: "#059669" }}>{yieldData.predicted}</span>
              <span style={{ fontSize: isMobile ? 12 : 13, color: colors.textMuted }}>{yieldData.unit}</span>
              <span style={{ fontSize: isMobile ? 10 : 11, color: colors.textSecondary, marginLeft: "auto" }}>
                IC {yieldData.confidenceInterval} · Confiance {yieldData.confidence}%
              </span>
            </div>
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, color: colors.textMuted, marginBottom: 6 }}>{t("farmer.historicalYield")}</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 60 }}>
                {yieldData.history.map((h: any) => (
                  <div key={h.year} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <div style={{
                      width: "100%", height: `${(h.value / maxYield) * 100}%`, background: barColorFn(h.value),
                      borderRadius: "4px 4px 0 0", minHeight: 8, transition: "height 0.3s",
                    }} />
                    <span style={{ fontSize: 8, color: colors.textMuted, whiteSpace: "nowrap" }}>{h.year.split("-")[0]}</span>
                  </div>
                ))}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div style={{
                    width: "100%", height: `${(yieldData.predicted / maxYield) * 100}%`, background: "#059669",
                    borderRadius: "4px 4px 0 0", minHeight: 8, position: "relative",
                  }}>
                    <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", fontSize: 9, fontWeight: 700, color: "#059669", whiteSpace: "nowrap" }}>
                      ~{yieldData.predicted}
                    </div>
                  </div>
                  <span style={{ fontSize: 8, color: "#059669", fontWeight: 600 }}>{t("farmer.est")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderTimeline() {
    return (
      <div style={{ ...CARD, marginBottom: isMobile ? 16 : 24, padding: isMobile ? 16 : 24 }}>
        <h3 style={{ fontSize: isMobile ? 14 : 15, fontWeight: 600, margin: "0 0 18px", color: colors.text, display: "flex", alignItems: "center", gap: 6 }}>
          <Clock size={16} color={colors.accent} /> {t("farmer.timeline")}
        </h3>
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", left: 14, top: 6, bottom: 6, width: 2, background: colors.borderLight }} />
          {f.timeline.map((item: any, i: number) => (
            <div key={item.step} style={{ display: "flex", gap: 14, marginBottom: i < f.timeline.length - 1 ? 20 : 0, position: "relative", animation: `fadeSlideUp 0.3s ease ${i * 0.05}s both` }}>
              <div style={{ zIndex: 1, flexShrink: 0 }}>
                {item.status === "active" ? (
                  <CheckCircle size={28} color={colors.accent} weight="fill" />
                ) : (
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: item.status === "completed" ? colors.borderLight : colors.border,
                    border: `2px solid ${item.status === "completed" ? colors.accent : colors.borderLight}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: item.status === "completed" ? colors.accent : colors.textMuted }}>
                      {item.step}
                    </span>
                  </div>
                )}
              </div>
              <div style={{ flex: 1, paddingTop: 2 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2, flexWrap: "wrap", gap: 4 }}>
                  <h4 style={{ fontSize: isMobile ? 13 : 14, fontWeight: 600, margin: 0, color: colors.text }}>{item.title}</h4>
                  <span style={{ fontSize: 10, color: colors.textMuted }}>{item.date}</span>
                </div>
                <p style={{ fontSize: isMobile ? 11 : 12, color: colors.textSecondary, margin: "0 0 2px" }}>
                  {item.acteur}{item.lieu ? ` — ${item.lieu}` : ""}
                </p>
                <p style={{ fontSize: isMobile ? 10 : 11, color: colors.textMuted, margin: 0 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderCertifications() {
    return (
      <div style={{ ...CARD, marginBottom: isMobile ? 16 : 24, overflow: "hidden" }}>
        <div style={{ padding: isMobile ? 14 : 20, borderBottom: `1px solid ${colors.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: isMobile ? 14 : 15, fontWeight: 600, margin: 0, color: colors.text, display: "flex", alignItems: "center", gap: 6 }}>
            <SealCheck size={16} color={colors.accent} /> {t("farmer.certifications")}
          </h3>
          <span style={{ fontSize: isMobile ? 10 : 11, color: colors.textMuted }}>{f.certifications.length} {t("certificates.days")}</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: isMobile ? 11 : 12 }}>
            <thead>
              <tr style={{ background: `linear-gradient(135deg, ${colors.statBg}, ${colors.surface})`, borderBottom: `1px solid ${colors.borderLight}` }}>
                {[t("farmer.certType"), t("certificates.table.emetteur"), t("certificates.table.expire"), t("farmer.status"), t("farmer.bc")].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", fontWeight: 600, color: colors.textSecondary, textAlign: "left", whiteSpace: "nowrap", fontSize: isMobile ? 10 : 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {f.certifications.map((cert: any, i: number) => (
                <tr key={cert.id} style={{ borderBottom: `1px solid ${colors.borderLight}`, animation: `fadeSlideUp 0.3s ease ${i * 0.03}s both` }}>
                  <td style={{ padding: "10px 14px", color: colors.text, fontWeight: 500 }}>{cert.type}</td>
                  <td style={{ padding: "10px 14px", color: colors.textSecondary }}>{cert.emetteur}</td>
                  <td style={{ padding: "10px 14px", color: colors.textMuted }}>{cert.expire}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ background: "#ecfdf5", color: "#059669", padding: "2px 8px", borderRadius: 6, fontSize: isMobile ? 10 : 11, fontWeight: 600 }}>{String(t("lotStatus." + cert.statut, cert.statut))}</span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    {cert.blockchain ? <SealCheck size={14} color={colors.accent} weight="fill" /> : <span style={{ fontSize: 10, color: colors.textMuted }}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderWeighings() {
    return (
      <div style={{ ...CARD, marginBottom: isMobile ? 16 : 24, overflow: "hidden" }}>
        <div style={{ padding: isMobile ? 14 : 20, borderBottom: `1px solid ${colors.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <h3 style={{ fontSize: isMobile ? 14 : 15, fontWeight: 600, margin: 0, color: colors.text, display: "flex", alignItems: "center", gap: 6 }}>
            <Balance size={16} color={colors.accent} /> {t("farmer.weighings")}
          </h3>
          <span style={{ fontSize: isMobile ? 10 : 11, color: colors.textMuted }}>
            {t("farmer.iotBalances")} · {f.recentWeighings.length} {t("farmer.records")}
          </span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: isMobile ? 11 : 12 }}>
            <thead>
              <tr style={{ background: `linear-gradient(135deg, ${colors.statBg}, ${colors.surface})`, borderBottom: `1px solid ${colors.borderLight}` }}>
                {[t("farmer.date"), t("farmer.culture"), t("farmer.weight"), t("farmer.lot"), t("farmer.device")].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", fontWeight: 600, color: colors.textSecondary, textAlign: "left", whiteSpace: "nowrap", fontSize: isMobile ? 10 : 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {f.recentWeighings.map((w: Weighing, i: number) => (
                <tr key={`${w.lotId}-${w.date}`} style={{ borderBottom: `1px solid ${colors.borderLight}`, animation: `fadeSlideUp 0.3s ease ${i * 0.02}s both` }}>
                  <td style={{ padding: "10px 14px", color: colors.text, whiteSpace: "nowrap" }}>{w.date}</td>
                  <td style={{ padding: "10px 14px", color: colors.text }}>{tCrop(w.culture)}</td>
                  <td style={{ padding: "10px 14px", color: colors.text, fontWeight: 600 }}>{formatNumber(w.weight)} kg</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ color: colors.accent, fontWeight: 500, cursor: "pointer" }} onClick={() => navigate(`/lots/${w.lotId}`)}>{w.lotId}</span>
                  </td>
                  <td style={{ padding: "10px 14px", color: colors.textMuted, fontSize: isMobile ? 10 : 11 }}>{w.deviceId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderTransactions() {
    return (
      <div style={{ ...CARD, marginBottom: isMobile ? 16 : 24, overflow: "hidden" }}>
        <div style={{ padding: isMobile ? 14 : 20, borderBottom: `1px solid ${colors.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <h3 style={{ fontSize: isMobile ? 14 : 15, fontWeight: 600, margin: 0, color: colors.text, display: "flex", alignItems: "center", gap: 6 }}>
            <Cube size={16} color={colors.accent} /> {t("farmer.transactions")}
          </h3>
          <button onClick={() => setShowHashes(!showHashes)} style={{ background: "none", border: `1.5px solid ${colors.borderLight}`, padding: "4px 10px", borderRadius: 8, fontSize: 10, color: colors.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            {showHashes ? <EyeSlash size={12} /> : <Eye size={12} />}
            {showHashes ? t("farmer.hideHashes") : t("farmer.showHashes")}
          </button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: isMobile ? 11 : 12 }}>
            <thead>
              <tr style={{ background: `linear-gradient(135deg, ${colors.statBg}, ${colors.surface})`, borderBottom: `1px solid ${colors.borderLight}` }}>
                {[t("farmer.date"), t("farmer.type"), t("farmer.amount"), t("farmer.status"), t("farmer.blockchain")].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", fontWeight: 600, color: colors.textSecondary, textAlign: "left", whiteSpace: "nowrap", fontSize: isMobile ? 10 : 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {f.transactions.map((tx: Transaction, i: number) => (
                <tr key={tx.id} style={{ borderBottom: `1px solid ${colors.borderLight}`, animation: `fadeSlideUp 0.3s ease ${i * 0.02}s both` }}>
                  <td style={{ padding: "10px 14px", color: colors.text, whiteSpace: "nowrap" }}>{tx.date}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ background: `${TX_TYPE_COLORS[tx.type] || "#6b7280"}18`, color: TX_TYPE_COLORS[tx.type] || "#6b7280", padding: "2px 8px", borderRadius: 6, fontSize: isMobile ? 10 : 11, fontWeight: 600 }}>{txLabel(tx.type)}</span>
                  </td>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: tx.type === "Vente" ? "#059669" : tx.type === "Avance" ? "#d97706" : colors.text }}>
                    {tx.montant === "—" ? "—" : `${tx.montant} ${t("common.currency")}`}
                  </td>
                  <td style={{ padding: "10px 14px", color: colors.text }}>{t("lotStatus." + tx.statut, tx.statut)}</td>
                  <td style={{ padding: "10px 14px" }}>
                    {tx.blockchain ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <SealCheck size={12} color={colors.accent} weight="fill" />
                        {showHashes ? (
                          <span style={{ fontSize: isMobile ? 9 : 10, color: colors.textMuted, fontFamily: "monospace" }}>
                            {tx.blockchain.hash.slice(0, 14)}...
                          </span>
                        ) : (
                          <span style={{ fontSize: isMobile ? 9 : 10, color: colors.textMuted }}>{tx.blockchain.block}</span>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: isMobile ? 9 : 10, color: colors.textMuted }}>{t("farmer.pending")}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderLots() {
    if (farmerLotsList.length === 0) return null;
    return (
      <div style={{ ...CARD, marginBottom: isMobile ? 16 : 24, overflow: "hidden" }}>
        <div style={{ padding: isMobile ? 14 : 20, borderBottom: `1px solid ${colors.borderLight}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: isMobile ? 14 : 15, fontWeight: 600, margin: 0, color: colors.text, display: "flex", alignItems: "center", gap: 6 }}>
            <Package size={16} color={colors.accent} /> {t("farmer.lots")} ({farmerLotsList.length})
          </h3>
          <button onClick={() => navigate("/lots")} style={{ background: "none", border: "none", color: colors.accent, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {t("dashboard.recentLots.viewAll")} <ArrowRight size={12} style={{ verticalAlign: "middle" }} />
          </button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: isMobile ? 11 : 12 }}>
            <thead>
              <tr style={{ background: `linear-gradient(135deg, ${colors.statBg}, ${colors.surface})`, borderBottom: `1px solid ${colors.borderLight}` }}>
                {[t("farmer.lot"), t("farmer.culture"), t("farmer.weight"), t("farmer.status"), t("farmer.lotPrice")].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", fontWeight: 600, color: colors.textSecondary, textAlign: "left", whiteSpace: "nowrap", fontSize: isMobile ? 10 : 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {farmerLotsList.map((lot: any, i: number) => (
                <tr key={lot.id} style={{ borderBottom: `1px solid ${colors.borderLight}`, cursor: "pointer", animation: `fadeSlideUp 0.3s ease ${i * 0.02}s both` }}
                  onClick={() => navigate(`/lots/${lot.id}`)}
                  onMouseEnter={(e) => { e.currentTarget.style.background = colors.surfaceHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                  <td style={{ padding: "10px 14px", color: colors.accent, fontWeight: 500 }}>{lot.id}</td>
                  <td style={{ padding: "10px 14px", color: colors.text }}>{tCrop(lot.culture)}</td>
                  <td style={{ padding: "10px 14px", color: colors.text, fontWeight: 600 }}>{lot.quantite}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{
                      background: lot.statut === "Disponible" ? "#ecfdf5" : lot.statut === "En transit" ? "#fff3e0" : "#ffebee",
                      color: lot.statut === "Disponible" ? "#2e7d32" : lot.statut === "En transit" ? "#e65100" : "#c62828",
                      padding: "2px 8px", borderRadius: 6, fontSize: isMobile ? 10 : 11, fontWeight: 600,
                    }}>{String(t("lotStatus." + lot.statut, lot.statut))}</span>
                  </td>
                  <td style={{ padding: "10px 14px", fontWeight: 600, color: colors.accent }}>{formatNumber(lot.prix)} {t("common.currency")}/kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderContact() {
    return (
      <div style={{
        background: `linear-gradient(135deg, ${colors.accent}, #059669)`, borderRadius: 14,
        padding: isMobile ? 16 : 24, color: "white", display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "stretch" : "center",
        justifyContent: "space-between", gap: isMobile ? 14 : 20,
      }}>
        <div>
          <div style={{ fontSize: isMobile ? 12 : 13, opacity: 0.75, marginBottom: 4 }}>{t("farmer.contactManager")}</div>
          <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 700, marginBottom: 8 }}>{f.contact.managerName}</div>
          <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 4 : 16, fontSize: isMobile ? 12 : 13, opacity: 0.85 }}>
            <span onClick={() => window.open(`tel:${f.contact.phone.replace(/\s/g, "")}`, "_self")} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <Phone size={13} weight="fill" /> {f.contact.phone}
            </span>
            <span onClick={() => window.open(`mailto:${f.contact.email}`, "_self")} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <Envelope size={13} weight="fill" /> {f.contact.email}
            </span>
          </div>
        </div>
        <button onClick={() => setShowContact(true)} style={{
          display: "flex", alignItems: "center", gap: 8, justifyContent: "center",
          background: "white", color: "#059669", border: "none",
          padding: isMobile ? "12px 20px" : "14px 28px", borderRadius: 10,
          fontSize: isMobile ? 13 : 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
          transition: "all 0.2s", boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.15)"; }}>
          <Phone size={16} weight="fill" /> {t("farmer.contactAction")}
        </button>
      </div>
    );
  }

  function renderModals() {
    return (
      <>
        {showTrustBreakdown && (
          <div onClick={() => setShowTrustBreakdown(false)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: colors.surface, borderRadius: 16, padding: isMobile ? 20 : 28, maxWidth: 380, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ShieldCheck size={22} color="#059669" weight="fill" />
                </div>
                <div>
                  <h3 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, margin: 0, color: colors.text }}>{t("farmer.trustIndex")}</h3>
                  <p style={{ fontSize: 12, color: colors.textSecondary, margin: "2px 0 0" }}>{f.anonymousId}</p>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {trustBreakdown.map((item) => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: colors.statBg, borderRadius: 10 }}>
                    <span style={{ fontSize: 13, color: colors.textSecondary }}>{item.label}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: item.color, display: "flex", alignItems: "center", gap: 4 }}>
                      {/taux|rate/i.test(item.label) && <ShieldCheck size={14} color="#059669" weight="fill" />}
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
              <Button variant="primary" fullWidth onClick={() => setShowTrustBreakdown(false)} style={{ marginTop: 14 }}>
                {t("common.close")}
              </Button>
            </div>
          </div>
        )}
        {showScoreBreakdown && (
          <div onClick={() => setShowScoreBreakdown(false)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: colors.surface, borderRadius: 16, padding: isMobile ? 20 : 28, maxWidth: 400, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <h3 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, margin: "0 0 4px", color: colors.text }}>{t("farmer.credibilityScore")}</h3>
              <p style={{ fontSize: 13, color: colors.textSecondary, margin: "0 0 20px" }}>{f.anonymousId}{f.anonymous ? "" : ` — ${f.displayName}`}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {scoreBreakdown.map((item) => (
                  <div key={item.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: colors.text }}>{item.label}</span>
                      <span style={{ fontWeight: 700, color: item.score >= 90 ? "#059669" : item.score >= 70 ? "#d97706" : "#dc2626" }}>
                        {item.score}/{item.max}
                      </span>
                    </div>
                    <div style={{ height: 6, background: colors.borderLight, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(item.score / item.max) * 100}%`, background: item.color, borderRadius: 3, transition: "width 0.6s" }} />
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="primary" fullWidth onClick={() => setShowScoreBreakdown(false)} style={{ marginTop: 16 }}>
                {t("common.close")}
              </Button>
            </div>
          </div>
        )}
        {showEUDR && (
          <div onClick={() => setShowEUDR(false)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: colors.surface, borderRadius: 16, padding: isMobile ? 20 : 28, maxWidth: 520, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <TreeEvergreen size={20} color="#059669" weight="fill" />
                </div>
                <div>
                  <h3 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, margin: 0, color: colors.text }}>{t("farmer.eudrCompliant")}</h3>
                  <span style={{ fontSize: 11, color: colors.textMuted }}>{t("farmer.lastAnalysis")} {f.eudr.lastAnalysis}</span>
                </div>
              </div>
              <div style={{ background: colors.statBg, borderRadius: 10, padding: 14, marginBottom: 14, fontSize: isMobile ? 12 : 13, color: colors.textSecondary, lineHeight: 1.7 }}>
                {f.eudr.details}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  { label: t("farmer.sentinel2"), value: f.eudr.satelliteSource },
                  { label: t("farmer.ndviScore"), value: `${(f.eudr.ndviScore * 100).toFixed(0)}%` },
                  { label: t("farmer.deforestation"), value: f.eudr.deforestationDetected ? t("farmer.deforestationDetected") : t("farmer.noDeforestation") },
                  { label: t("farmer.eudrCompliance"), value: f.eudr.compliant ? t("farmer.compliant") : t("farmer.nonCompliant") },
                ].map((row) => (
                  <div key={row.label} style={{ background: colors.statBg, borderRadius: 8, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: colors.textMuted, marginBottom: 2 }}>{row.label}</div>
                    <div style={{ fontSize: isMobile ? 12 : 13, fontWeight: 600, color: colors.text }}>{row.value}</div>
                  </div>
                ))}
              </div>
              <Button variant="primary" fullWidth onClick={() => setShowEUDR(false)}>
                {t("common.close")}
              </Button>
            </div>
          </div>
        )}
        {showContact && (
          <div onClick={() => setShowContact(false)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: colors.surface, borderRadius: 16, padding: isMobile ? 20 : 28, maxWidth: 380, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
              <h3 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, margin: "0 0 4px", color: colors.text }}>{t("farmer.contactManager")}</h3>
              <p style={{ fontSize: 13, color: colors.textSecondary, margin: "0 0 20px" }}>{f.contact.managerName}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <a href={`tel:${f.contact.phone.replace(/\s/g, "")}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, background: colors.statBg, color: colors.text, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Phone size={20} color="#059669" weight="fill" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: colors.textMuted, fontWeight: 400 }}>{t("farmer.phone")}</div>
                    <div>{f.contact.phone}</div>
                  </div>
                </a>
                <a href={`mailto:${f.contact.email}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, background: colors.statBg, color: colors.text, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Envelope size={20} color="#059669" weight="fill" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: colors.textMuted, fontWeight: 400 }}>{t("farmer.email")}</div>
                    <div>{f.contact.email}</div>
                  </div>
                </a>
                <button onClick={() => { setShowContact(false); navigate(`/inbox`); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, background: colors.statBg, color: colors.text, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "#e3f2fd", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ChatText size={20} color="#1565c0" weight="fill" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: colors.textMuted, fontWeight: 400 }}>{t("farmer.messaging")}</div>
                    <div>{t("farmer.sendMessage")}</div>
                  </div>
                </button>
              </div>
              <button onClick={() => setShowContact(false)} style={{ width: "100%", marginTop: 14, padding: "10px", borderRadius: 10, background: "none", border: `1.5px solid ${colors.borderLight}`, color: colors.textSecondary, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                {t("common.close")}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <FadeIn>
      <div ref={profileRef}>
        <Breadcrumb crumbs={[
          { label: t("nav.dashboard"), path: "/dashboard" },
          { label: t("farmer.title") },
          { label: f.anonymousId },
        ]} />
        {renderControls()}
        {renderHeader()}
        {renderKPIs()}
        {renderTechnical()}
        {renderTimeline()}
        {renderCertifications()}
        {renderWeighings()}
        {renderTransactions()}
        {renderLots()}
        {renderContact()}
        {renderModals()}
      </div>
    </FadeIn>
  );
}

export default FarmerProfilePage;
