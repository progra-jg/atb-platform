import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle, Circle, FileText, Cube,
  SealCheck, User, MapPin, CalendarBlank, Clock, Star, Package,
  Copy,
} from "@phosphor-icons/react";
import Badge from "../components/Badge";
import Button from "../components/ui/Button";
import Card, { CardHeader } from "../components/ui/Card";
import { useTheme } from "../context/ThemeContext";
import FadeIn from "../components/FadeIn";
import Breadcrumb from "../components/Breadcrumb";
import Skeleton from "../components/Skeleton";
import { useIsMobile } from "../hooks/useMediaQuery";
import { fetchLotById, fetchLots } from "../services/lots";
import { getFarmerAnonymousId } from "../services/farmers";
import { getFavorites, toggleFavorite } from "../services/favorites";
import { addFavorite, removeFavorite } from "../services/favoritesV2";
import { fetchSustainabilityScore } from "../services/sustainability";
import SustainabilityBadge, { SustainabilityBreakdown } from "../components/SustainabilityBadge";
import SampleRequestModal from "../components/SampleRequestModal";
import ShareButton from "../components/ShareButton";
import { NegotiationTrigger } from "../components/NegotiationPanel";
import OrderButton from "../components/OrderButton";
import LabReportCard from "../components/LabReportCard";
import { tCrop } from "../utils/i18n";
import { formatNumber } from "../utils/format";
import { computeLotCompleteness } from "../utils/scoring";
import CompletenessGauge from "../components/CompletenessGauge";
import TrustBadge from "../components/TrustBadge";
import { useTrustScore } from "../hooks/useTrustScore";
import LotMediaCarousel from "../components/LotMediaCarousel";
import LotHarvestInfo from "../components/LotHarvestInfo";
import LotStockQualityCard from "../components/LotStockQualityCard";
import LotLabResults from "../components/LotLabResults";
import LotQRCode from "../components/LotQRCode";
import ThresholdBadge from "../components/ThresholdBadge";
import { computeThreshold } from "../utils/threshold";

function LotDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isMobile = useIsMobile();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["lot", id],
    queryFn: () => fetchLotById(id || ""),
    enabled: !!id,
  });

  const { data: allLots } = useQuery<any[]>({
    queryKey: ["lots"],
    queryFn: () => fetchLots(),
  });

  const [isFav, setIsFav] = useState(() => id ? getFavorites().includes(id) : false);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: sustainability } = useQuery({
    queryKey: ["sustainability", id],
    queryFn: () => id ? fetchSustainabilityScore(id) : null,
    enabled: !!id,
    refetchOnMount: true,
  });

  const handleFav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!id) return;
    const now = toggleFavorite(id);
    setIsFav(now);
    try { if (now) await addFavorite(id); else await removeFavorite(id); } catch {}
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isError && !isLoading) {
    return (
      <FadeIn>
        <div style={{ textAlign: "center", padding: isMobile ? 60 : 80 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: colors.errorLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Cube size={32} color={colors.error} />
          </div>
          <h2 style={{ color: colors.text, margin: "0 0 8px", fontSize: isMobile ? 20 : 24 }}>{t("detail.error")}</h2>
          <p style={{ color: colors.textMuted, marginBottom: 24, maxWidth: 360, marginLeft: "auto", marginRight: "auto" }}>{t("detail.errorDesc")}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>{t("certificates.retry")}</Button>
        </div>
      </FadeIn>
    );
  }

  if (isLoading) {
    return (
      <FadeIn>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 380px", gap: isMobile ? 16 : 24, marginTop: 20 }}>
            <div>
              <Skeleton height={180} radius={16} />
              <div style={{ marginTop: 20 }}><Skeleton height={300} radius={16} /></div>
            </div>
            {!isMobile && <div><Skeleton height={200} radius={16} /><div style={{ marginTop: 14 }}><Skeleton height={200} radius={16} /></div></div>}
          </div>
        </div>
      </FadeIn>
    );
  }

  if (!data) {
    return (
      <FadeIn>
        <div style={{ textAlign: "center", padding: isMobile ? 60 : 80 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: colors.surfaceHover, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Cube size={32} color={colors.textMuted} />
          </div>
          <h2 style={{ color: colors.text, margin: "0 0 8px", fontSize: isMobile ? 20 : 24 }}>{t("detail.notFound")}</h2>
          <p style={{ color: colors.textMuted, marginBottom: 24 }}>{t("detail.notFoundDesc", { id })}</p>
          <Button variant="primary" onClick={() => navigate("/lots")}>{t("detail.back")}</Button>
        </div>
      </FadeIn>
    );
  }

  const { lot, timeline, certificates } = data;

  const { data: trustScore } = useTrustScore(lot.producteurId);

  return (
    <FadeIn>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Breadcrumb crumbs={[
          { label: t("nav.dashboard"), path: "/dashboard" },
          { label: t("nav.lots"), path: "/lots" },
          { label: `${lot.id} — ${tCrop(lot.culture)}` },
        ]} />

        {/* Hero Section */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1.2fr", gap: isMobile ? 12 : 20, marginBottom: isMobile ? 16 : 24, alignItems: "start" }}>
          {/* Media Carousel */}
          {lot.images && lot.images.length > 0 && (
            <div style={{ animation: "fadeSlideUp 0.35s ease both" }}>
              <LotMediaCarousel images={lot.images} lotId={lot.id} />
            </div>
          )}

          {/* Info Card */}
          <Card variant="premium" padding="0" style={{ overflow: "hidden" }}>
            <div style={{
              padding: isMobile ? "16px 16px 12px" : "24px 24px 20px",
              position: "relative",
            }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${colors.accent}, ${colors.accent}88, transparent)` }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, margin: 0, color: colors.text, letterSpacing: "-0.5px" }}>
                      {tCrop(lot.culture)}
                    </h1>
                    <button onClick={handleFav}
                      aria-label={isFav ? t("common.removeFromFavorites") : t("common.addToFavorites")}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex", color: isFav ? colors.gold : colors.textMuted, transition: "color 0.2s, transform 0.2s", borderRadius: 8 }}>
                      <Star size={isMobile ? 20 : 24} weight={isFav ? "fill" : "regular"} />
                    </button>
                    <ShareButton
                      title={`${tCrop(lot.culture)} — ${lot.id} | ATB AgriTrace`}
                      url={`${window.location.origin}/lots/${lot.id}`}
                      description={`${lot.quantite} · ${formatNumber(lot.prix)} ${t("common.currency")}/kg · ${lot.origine}`}
                      size={isMobile ? 20 : 24}
                    />
                  </div>
                  <p style={{ color: colors.textSecondary, fontSize: isMobile ? 13 : 14, margin: "2px 0 0", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <MapPin size={14} /> {lot.origine}, {lot.region} · <Package size={14} /> {lot.quantite}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", flexShrink: 0 }}>
                  <Badge text={lot.certification} variant={lot.certification === "EUDR" ? "success" : lot.certification === "GlobalGAP" ? "warning" : lot.certification === "Bio" ? "info" : "neutral"} size="sm" />
                  <Badge text={String(t("lotStatus." + lot.statut, lot.statut))} variant={lot.statut === "Disponible" ? "success" : lot.statut === "En transit" ? "warning" : "error"} size="sm" />
                </div>
              </div>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(2, 1fr)",
              gap: 0,
              padding: isMobile ? "8px 16px" : "12px 24px",
            }}>
              {[
                { label: t("detail.price"), value: `${formatNumber(lot.prix)} ${t("common.currency")}/kg`, accent: true },
                { label: t("detail.totalVolume"), value: lot.quantite },
                { label: t("detail.totalValue"), value: `${formatNumber(lot.prix * parseInt(lot.quantite.replace(/\s/g, "").replace("kg", "")))} ${t("common.currency")}`, accent: true },
                { label: t("detail.qualityScore"), value: `${lot.note}/100`, color: colors.success },
              ].map((item, idx) => (
                <React.Fragment key={idx}>
                  <div style={{ padding: isMobile ? "6px 0" : "8px 0", borderRight: idx % 2 === 0 ? `1px solid ${colors.borderLight}` : "none", paddingRight: idx % 2 === 0 ? 16 : 0, paddingLeft: idx % 2 === 1 ? 16 : 0 }}>
                    <div style={{ fontSize: 10, color: colors.textMuted, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.8px" }}>{item.label}</div>
                    <div style={{ fontSize: isMobile ? 15 : 20, fontWeight: 700, color: item.accent ? colors.accent : item.color || colors.text, letterSpacing: "-0.3px" }}>{item.value}</div>
                  </div>
                  {isMobile && idx === 1 && <div style={{ gridColumn: "1/-1", height: 1, background: colors.borderLight, margin: "4px 0" }} />}
                </React.Fragment>
              ))}
            </div>
          </Card>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 380px", gap: isMobile ? 16 : 24 }}>
          {/* Left Column */}
          <div>
            {/* Timeline */}
            <Card variant="premium" style={{ padding: isMobile ? 16 : 28, marginBottom: isMobile ? 16 : 24 }}>
              <CardHeader icon={<Clock size={18} />} title={t("detail.timeline")} />
              <div style={{ position: "relative", marginTop: 8 }}>
                <div style={{ position: "absolute", left: 15, top: 8, bottom: 8, width: 2, background: `linear-gradient(180deg, ${colors.accent}40, ${colors.accent}20)` }} />
                {timeline.map((item: any) => (
                  <div key={item.step} style={{ display: "flex", gap: 14, marginBottom: 20, position: "relative", animation: "fadeSlideUp 0.4s ease both", animationDelay: `${timeline.indexOf(item) * 0.08}s` }}>
                    <div style={{ zIndex: 1, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {item.status === "active" ? (
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: colors.accentLight, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 4px ${colors.accent}20` }}>
                          <CheckCircle size={16} color={colors.accent} weight="fill" />
                        </div>
                      ) : (
                        <Circle size={32} color={item.status === "completed" ? colors.success : colors.borderLight} weight={item.status === "completed" ? "fill" : "regular"} />
                      )}
                    </div>
                    <div style={{ flex: 1, paddingTop: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2, flexWrap: "wrap", gap: 4 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: colors.text }}>{item.title}</h3>
                        <span style={{ fontSize: 11, color: colors.textMuted, display: "flex", alignItems: "center", gap: 3 }}>
                          <CalendarBlank size={11} /> {item.date}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: colors.textSecondary, margin: "0 0 2px" }}>{item.acteur} — {item.lieu}</p>
                      <p style={{ fontSize: 11, color: colors.textMuted, margin: 0 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div>
            {/* Sustainability */}
            {sustainability && (
              <div style={{ marginBottom: 12, animation: "fadeSlideUp 0.4s ease both" }}>
                {isMobile ? <SustainabilityBreakdown score={sustainability} /> : <SustainabilityBadge score={sustainability} size="md" />}
              </div>
            )}

            {/* Data Completeness */}
            <div style={{ marginBottom: isMobile ? 12 : 16 }}>
              <CompletenessGauge result={computeLotCompleteness(lot)} size="md" />
            </div>

            {/* Trust Score */}
            {trustScore && (
              <div style={{ marginBottom: isMobile ? 12 : 16 }}>
                <TrustBadge result={trustScore} />
              </div>
            )}

            {/* Harvest Info */}
            {lot.harvest && (
              <div style={{ marginBottom: isMobile ? 12 : 16 }}>
                <LotHarvestInfo harvest={lot.harvest} />
              </div>
            )}

            {/* Stock Quality */}
            {lot.stockQuality && (
              <div style={{ marginBottom: isMobile ? 12 : 16 }}>
                <LotStockQualityCard quality={lot.stockQuality} />
              </div>
            )}

            {/* Lab Results */}
            {lot.labResults && lot.labResults.length > 0 && (
              <div style={{ marginBottom: isMobile ? 12 : 16 }}>
                <LotLabResults results={lot.labResults} />
              </div>
            )}

            {/* QR Code */}
            <div style={{ marginBottom: isMobile ? 12 : 16 }}>
              <LotQRCode lotId={lot.id} lotUrl={`${window.location.origin}/lots/${lot.id}`} />
            </div>

            {/* Quality Threshold */}
            <div style={{ marginBottom: isMobile ? 12 : 16 }}>
              <ThresholdBadge result={computeThreshold(lot, trustScore?.overall)} size="md" />
            </div>

            {/* Certificates */}
            <Card variant="premium" style={{ padding: isMobile ? 16 : 24, marginBottom: isMobile ? 12 : 16 }}>
              <CardHeader icon={<FileText size={16} />} title={t("detail.certificates")} />
              <div style={{ marginTop: 8 }}>
                {certificates.map((cert: any) => (
                  <div key={cert.id} style={{
                    padding: "10px 12px", border: `1px solid ${colors.borderLight}`, borderRadius: 10,
                    marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center",
                    transition: "all 0.15s", background: colors.surface,
                  }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = colors.accent + "40"; e.currentTarget.style.background = colors.accentLight }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = colors.borderLight; e.currentTarget.style.background = colors.surface }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: colors.text }}>{cert.type}</div>
                      <div style={{ fontSize: 11, color: colors.textMuted }}>{cert.emetteur} — {t("detail.expires")} {cert.expire}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <SealCheck size={16} color={colors.success} weight="fill" />
                    </div>
                  </div>
                ))}
                <Button variant="ghost" fullWidth onClick={() => navigate("/certificates")}
                  style={{ border: `1px dashed ${colors.borderLight}`, color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
                  + {t("detail.viewCerts")}
                </Button>
              </div>
            </Card>

            {/* Lab Analysis */}
            <LabReportCard lotId={lot.id} culture={lot.culture} />

            {/* On-chain */}
            <Card variant="glass" style={{ padding: isMobile ? 16 : 24, marginBottom: isMobile ? 12 : 16 }}>
              <CardHeader icon={<Cube size={16} />} title={t("detail.onChain")} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, marginBottom: 10 }}>
                <CheckCircle size={14} color={colors.success} weight="fill" />
                <span style={{ fontSize: 13, fontWeight: 500, color: colors.text }}>{t("detail.blockchainVerified")}</span>
              </div>
              <div
                onClick={() => copyHash("0x7d8f3a2b1c9e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f")}
                role="button"
                tabIndex={0}
                aria-label="Copier le hash blockchain"
                onKeyDown={(e) => { if (e.key === "Enter") copyHash("0x7d8f3a2b1c9e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f"); }}
                style={{
                  fontSize: 10, color: colors.textSecondary, background: colors.codeBg,
                  padding: "10px 12px", borderRadius: 8, fontFamily: "var(--font-mono)", wordBreak: "break-all",
                  position: "relative", cursor: "pointer", transition: "background 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = colors.surfaceHover}
                onMouseLeave={(e) => e.currentTarget.style.background = colors.codeBg}
              >
                <span style={{ fontWeight: 600, letterSpacing: "0.3px" }}>0x7d8f3a2b1c9e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f</span>
                <span style={{ position: "absolute", right: 8, top: 8, fontSize: 10, color: colors.textMuted, display: "flex", alignItems: "center", gap: 3 }}>
                  {copied ? "✓" : <Copy size={10} />}
                </span>
              </div>
              <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 8, display: "flex", alignItems: "center", gap: 3 }}>
                <CalendarBlank size={11} /> {t("detail.anchored")}
              </div>
            </Card>

            {/* CTA — Direct Order */}
            <OrderButton
              lotId={lot.id}
              culture={lot.culture}
              quantite={lot.quantite}
              prix={lot.prix}
              producteurId={lot.producteurId}
            />

            <div style={{ height: 8 }} />

            {/* CTA — Negotiation */}
            <NegotiationTrigger
              lotId={lot.id}
              sellerId={lot.producteurId || ""}
              culture={lot.culture}
              lotQuantity={lot.quantite}
              lotPrice={lot.prix}
              lotOrigin={lot.origine}
            />

            <Button variant="ghost" fullWidth
              icon={<Package size={16} />}
              onClick={() => setShowSampleModal(true)}
              style={{ border: `1.5px dashed ${colors.accent}`, background: colors.accentLight, color: colors.accent, marginBottom: isMobile ? 12 : 16 }}>
              {t("detail.requestSample")}
            </Button>

            {/* Contact */}
            <div style={{
              marginTop: isMobile ? 12 : 16,
              background: colors.statBg,
              borderRadius: 12, padding: isMobile ? 12 : 16,
              fontSize: 12, color: colors.textSecondary, lineHeight: 1.8,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
                <User size={14} color={colors.textMuted} />
                <strong style={{ color: colors.text, fontSize: 13 }}>{t("detail.contact")}</strong>
              </div>
              <span onClick={() => {
                const fid = lot.producteurId || getFarmerAnonymousId(lot.producteur);
                if (fid) navigate(`/farmers/${fid}`);
              }}
                style={{
                  color: colors.accent, fontWeight: 600, cursor: (lot.producteurId || getFarmerAnonymousId(lot.producteur)) ? "pointer" : "default",
                  textDecoration: "underline", textUnderlineOffset: 2,
                }}>
                {lot.producteur}
              </span>
              {" | "}{lot.phone}<br />
              {lot.cooperative} — {lot.origine}
            </div>
          </div>
        </div>

        {/* ESG Details */}
        {sustainability && !isMobile && (
          <div style={{ marginTop: 24 }}>
            <SustainabilityBreakdown score={sustainability} />
          </div>
        )}

        {/* Sample Request Modal */}
        {showSampleModal && (
          <SampleRequestModal
            lotId={lot.id}
            producteurId={lot.producteurId || ""}
            culture={lot.culture}
            onClose={() => setShowSampleModal(false)}
            onSuccess={() => {}}
          />
        )}

        {/* Recommendations */}
        {allLots && lot && (
          <div style={{ marginTop: isMobile ? 24 : 40 }}>
            <h2 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, margin: "0 0 16px", color: colors.text, display: "flex", alignItems: "center", gap: 8 }}>
              <Star size={18} /> {t("detail.youMayLike")}
            </h2>
            <div style={{ display: "grid", gap: 12, gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))" }}>
              {allLots
                .filter((l: any) => l.id !== lot.id && (l.culture === lot.culture || l.region === lot.region || l.producteur === lot.producteur))
                .slice(0, 4)
                .map((rec: any, idx: number) => (
                  <Card key={rec.id} variant="premium" hoverable onClick={() => navigate(`/lots/${rec.id}`)}
                    style={{ animation: "fadeSlideUp 0.4s ease both", animationDelay: `${idx * 0.08}s`, padding: isMobile ? 14 : 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: colors.text }}>{tCrop(rec.culture)}</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: colors.textSecondary, fontFamily: "var(--font-mono)" }}>{rec.id}</div>
                      </div>
                      <Badge text={String(t("lotStatus." + rec.statut, rec.statut))} variant={rec.statut === "Disponible" ? "success" : rec.statut === "En transit" ? "warning" : "error"} size="sm" pill />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: colors.textSecondary }}>
                        <MapPin size={11} style={{ verticalAlign: "middle", marginRight: 2 }} /> {rec.origine}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: 15, color: colors.accent }}>{formatNumber(rec.prix)} {t("common.currency")}</span>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
        )}
      </div>
    </FadeIn>
  );
}

export default LotDetail;
