import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell, BellRinging, Plus, Trash, ToggleLeft, ToggleRight,
  TrendUp, TrendDown, Lightbulb, X, CheckCircle,
} from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import FadeIn from "../components/FadeIn";
import Breadcrumb from "../components/Breadcrumb";
import { PageTitle } from "../components/ResponsiveContainer";
import { useIsMobile } from "../hooks/useMediaQuery";
import { fetchAlerts, createAlert, toggleAlert, deleteAlert } from "../services/alertsV2";
import { fetchPriceHistory } from "../services/prices";
import { tCrop } from "../utils/i18n";
import { formatNumber } from "../utils/format";

const ALERT_TYPES: { value: string; labelKey: string; descKey: string; icon: React.ReactNode }[] = [
  { value: "price_alert", labelKey: "alertsManage.types.priceThreshold", descKey: "alertsManage.types.priceThresholdDesc", icon: <TrendUp size={14} /> },
  { value: "new_lot", labelKey: "alertsManage.types.newLot", descKey: "alertsManage.types.newLotDesc", icon: <Bell size={14} /> },
  { value: "price_drop", labelKey: "alertsManage.types.priceDrop", descKey: "alertsManage.types.priceDropDesc", icon: <TrendDown size={14} /> },
  { value: "new_producer", labelKey: "alertsManage.types.newProducer", descKey: "alertsManage.types.newProducerDesc", icon: <CheckCircle size={14} /> },
];

const CROPS = ["Maïs", "Cacao", "Anacarde", "Riz", "Soja", "Coton"];
const REGIONS = ["Zou", "Borgou", "Mono", "Ouémé", "Atlantique", "Collines", "Couffo", "Plateau"];
const CERTIFICATIONS = ["Bio", "EUDR", "GlobalGAP", "Commerce équitable", "Rainforest Alliance"];

export default function AlertsManage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isMobile = useIsMobile();

  const tCert = (c: string) => {
    const map: Record<string, string> = {
      "Bio": t("certificates.types.bio"),
      "EUDR": t("certificates.types.eudr"),
      "GlobalGAP": t("certificates.types.globalGap"),
      "Commerce équitable": t("certificates.types.fairTrade"),
      "Rainforest Alliance": t("certificates.types.rainforestAlliance"),
    };
    return map[c] || c;
  };
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevTriggered = useRef(0);

  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState("price_alert");
  const [crop, setCrop] = useState("");
  const [region, setRegion] = useState("");
  const [certification, setCertification] = useState("");
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [targetPrice, setTargetPrice] = useState("");
  const [toast, setToast] = useState<{ message: string; id: number } | null>(null);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["alerts-v2"],
    queryFn: fetchAlerts,
    refetchInterval: 8000,
  });

  const { data: prices } = useQuery({
    queryKey: ["price-history-alerts", 6],
    queryFn: () => fetchPriceHistory(undefined, 6),
    refetchInterval: 60000,
  });

  const triggered = alerts.filter((a) => a.triggered);
  const triggeredCount = triggered.length;

  useEffect(() => {
    if (triggeredCount > prevTriggered.current) {
      const newTriggers = triggeredCount - prevTriggered.current;
      const msg = `${newTriggers} ${t("alertsManage.alert", { count: newTriggers })}`;
      setToast({ message: msg, id: Date.now() });
      try {
        if (Notification.permission === "granted") {
          new Notification("ATB AgriTrace", { body: msg, icon: "/favicon.ico" });
        }
      } catch {}
    }
    prevTriggered.current = triggeredCount;
  }, [triggeredCount, t]);

  useEffect(() => {
    if (Notification.permission === "default") Notification.requestPermission();
  }, []);

  const createMut = useMutation({
    mutationFn: createAlert,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["alerts-v2"] }); resetForm(); },
  });
  const toggleMut = useMutation({
    mutationFn: toggleAlert,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts-v2"] }),
  });
  const deleteMut = useMutation({
    mutationFn: deleteAlert,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts-v2"] }),
  });

  function resetForm() {
    setShowForm(false); setType("price_alert"); setCrop(""); setRegion("");
    setCertification(""); setDirection("above"); setTargetPrice("");
  }

  function handleCreate() {
    const body: any = { type };
    if (crop) body.crop = crop;
    if (region) body.region = region;
    if (certification) body.certification = certification;
    if (direction) body.direction = direction;
    if (targetPrice) body.targetPrice = Number(targetPrice);
    createMut.mutate(body);
  }

  const smartSuggestions = useCallback(() => {
    if (!prices) return [];
    return prices
      .filter((p) => {
        const d = p.data;
        if (d.length < 3) return false;
        const last = d[d.length - 1].avg;
        const first = d[0].avg;
        const change = ((last - first) / first) * 100;
        return Math.abs(change) > 5;
      })
      .map((p) => {
        const d = p.data;
        const last = d[d.length - 1].avg;
        const first = d[0].avg;
        const change = ((last - first) / first) * 100;
        return {
          crop: p.culture,
          change,
          direction: change > 0 ? "above" as const : "below" as const,
          targetPrice: change > 0 ? Math.round(last * 1.1) : Math.round(last * 0.9),
        };
      });
  }, [prices]);

  const suggestions = smartSuggestions();

  return (
    <FadeIn>
      <div style={{ padding: isMobile ? "16px" : "24px 32px", maxWidth: 900, margin: "0 auto" }}>
        <Breadcrumb crumbs={[{ label: t("nav.dashboard"), path: "/dashboard" }, { label: t("alertsManage.breadcrumb") }]} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
          <PageTitle title={t("alertsManage.pageTitle")} subtitle={t("alertsManage.subtitle")} />
          <button onClick={() => setShowForm(!showForm)} style={{
            padding: "8px 16px", borderRadius: 10, border: "none",
            background: `linear-gradient(135deg, ${colors.accent}, #34d399)`,
            color: "#fff", fontSize: 12, fontWeight: 600,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
          }}>
            <Plus size={14} weight="bold" /> {showForm ? t("common.cancel") : t("alertsManage.newAlert")}
          </button>
        </div>

        {toast && (
          <div style={{
            marginBottom: 12, padding: "10px 14px", borderRadius: 10,
            background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", fontSize: 13, fontWeight: 500,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
            animation: "fadeSlideUp 0.3s ease",
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <BellRinging size={16} weight="fill" /> {toast.message}
            </span>
            <button onClick={() => setToast(null)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 0, display: "flex" }}>
              <X size={14} />
            </button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
          <div style={{ background: colors.surface, borderRadius: 12, padding: "12px 14px", border: `1px solid ${colors.border}`, boxShadow: colors.shadowSm }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: ".3px", color: colors.textMuted, marginBottom: 2 }}>{t("alertsManage.stats.active")}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>{alerts.filter((a) => a.active && !a.triggered).length}</div>
          </div>
          <div style={{ background: colors.surface, borderRadius: 12, padding: "12px 14px", border: `1px solid ${colors.border}`, boxShadow: colors.shadowSm }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: ".3px", color: colors.textMuted, marginBottom: 2 }}>{t("alertsManage.stats.triggered")}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: triggeredCount > 0 ? "#dc2626" : colors.text }}>{triggeredCount}</div>
          </div>
          <div style={{ background: colors.surface, borderRadius: 12, padding: "12px 14px", border: `1px solid ${colors.border}`, boxShadow: colors.shadowSm }}>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: ".3px", color: colors.textMuted, marginBottom: 2 }}>{t("alertsManage.stats.inactive")}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: colors.textMuted }}>{alerts.filter((a) => !a.active).length}</div>
          </div>
        </div>

        {suggestions.length > 0 && (
          <div style={{ marginBottom: 16, padding: 14, borderRadius: 12, background: `linear-gradient(135deg, rgba(10,110,74,0.06), rgba(52,211,153,0.06))`, border: `1.5px solid ${colors.borderLight}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Lightbulb size={14} color={colors.accent} weight="fill" /> <span style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{t("alertsManage.suggestions")}</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {suggestions.map((s) => (
                <button key={s.crop} onClick={() => {
                  setType("price_alert"); setCrop(s.crop); setDirection(s.direction);
                  setTargetPrice(String(s.targetPrice)); setShowForm(true);
                }} style={{
                  padding: "6px 12px", borderRadius: 8, border: "1.5px solid", borderColor: colors.borderLight,
                  background: colors.surface, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: colors.text,
                }}>
                  {s.change > 0 ? <TrendUp size={12} color="#059669" /> : <TrendDown size={12} color="#dc2626" />}
                  {tCrop(s.crop)} {s.change > 0 ? "+" : ""}{s.change.toFixed(1)}%
                </button>
              ))}
            </div>
          </div>
        )}

        {triggeredCount > 0 && (
          <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 10, background: "#fef2f2", border: "1.5px solid #fecaca", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#dc2626", fontWeight: 500 }}>
            <BellRinging size={16} weight="fill" /> {t("alertsManage.triggeredBanner", { count: triggeredCount })}
          </div>
        )}

        {showForm && (
          <div style={{ marginBottom: 20, padding: 18, borderRadius: 12, background: colors.statBg, border: `1.5px solid ${colors.borderLight}`, boxShadow: colors.shadowSm }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: colors.text, marginBottom: 12 }}>{t("alertsManage.formTitle")}</div>
            <div style={{ display: "grid", gap: 10 }}>
              <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${colors.borderLight}`, fontSize: 12, background: colors.surface, color: colors.text }}>
                {ALERT_TYPES.map((at) => <option key={at.value} value={at.value}>{t(at.labelKey)}</option>)}
              </select>

              {type === "price_alert" && (
                <>
                  <select value={crop} onChange={(e) => setCrop(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${colors.borderLight}`, fontSize: 12, background: colors.surface, color: colors.text }}>
                    <option value="">{t("alertsManage.chooseCrop")}</option>
                    {CROPS.map((c) => <option key={c} value={c}>{tCrop(c)}</option>)}
                  </select>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => setDirection("above")} style={{ flex: 1, padding: "6px 0", borderRadius: 8, border: "1.5px solid", borderColor: direction === "above" ? colors.accent : colors.borderLight, background: direction === "above" ? colors.accentLight : colors.surface, fontSize: 11, fontWeight: 600, color: direction === "above" ? colors.accent : colors.textMuted, cursor: "pointer" }}>{t("dashboard.alerts.above")}</button>
                    <button onClick={() => setDirection("below")} style={{ flex: 1, padding: "6px 0", borderRadius: 8, border: "1.5px solid", borderColor: direction === "below" ? colors.accent : colors.borderLight, background: direction === "below" ? colors.accentLight : colors.surface, fontSize: 11, fontWeight: 600, color: direction === "below" ? colors.accent : colors.textMuted, cursor: "pointer" }}>{t("dashboard.alerts.below")}</button>
                  </div>
                  <input type="number" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} placeholder={t("dashboard.alerts.target")} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${colors.borderLight}`, fontSize: 12, boxSizing: "border-box", background: colors.surface, color: colors.text }} />
                </>
              )}
              {type === "new_lot" && (
                <>
                  <select value={region} onChange={(e) => setRegion(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${colors.borderLight}`, fontSize: 12, background: colors.surface, color: colors.text }}>
                    <option value="">{t("alertsManage.chooseRegion")}</option>
                    {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <select value={certification} onChange={(e) => setCertification(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${colors.borderLight}`, fontSize: 12, background: colors.surface, color: colors.text }}>
                    <option value="">{t("alertsManage.allCertifications")}</option>
                    {CERTIFICATIONS.map((c) => <option key={c} value={c}>{tCert(c)}</option>)}
                  </select>
                </>
              )}
              {type === "price_drop" && (
                <select value={crop} onChange={(e) => setCrop(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${colors.borderLight}`, fontSize: 12, background: colors.surface, color: colors.text }}>
                  <option value="">{t("alertsManage.chooseCrop")}</option>
                  {CROPS.map((c) => <option key={c} value={c}>{tCrop(c)}</option>)}
                </select>
              )}
              {type === "new_producer" && (
                <select value={certification} onChange={(e) => setCertification(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${colors.borderLight}`, fontSize: 12, background: colors.surface, color: colors.text }}>
                  <option value="">{t("alertsManage.chooseCertification")}</option>
                  {CERTIFICATIONS.map((c) => <option key={c} value={c}>{tCert(c)}</option>)}
                </select>
              )}
              <button onClick={handleCreate} disabled={createMut.isPending} style={{ width: "100%", padding: "8px 0", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${colors.accent}, #34d399)`, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: createMut.isPending ? 0.6 : 1 }}>{createMut.isPending ? t("common.loading") : t("dashboard.alerts.save")}</button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div style={{ textAlign: "center", padding: 40, fontSize: 13, color: colors.textMuted }}>{t("common.loading")}</div>
        ) : alerts.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, fontSize: 13, color: colors.textMuted, background: colors.surface, borderRadius: 12, border: `1.5px solid ${colors.borderLight}` }}>
            {t("alertsManage.empty")}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {alerts.map((alert, i) => {
              const typeInfo = ALERT_TYPES.find((at) => at.value === alert.type);
              return (
                <div key={alert.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 16px", borderRadius: 12,
                  background: alert.triggered ? "#fef2f2" : colors.surface,
                  border: "1.5px solid", borderColor: alert.triggered ? "#fecaca" : colors.borderLight,
                  boxShadow: !alert.triggered ? colors.shadowSm : "none",
                  transition: "all 0.15s",
                  animation: `fadeSlideUp 0.3s ease ${i * 0.03}s both`,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      {typeInfo?.icon}
                      <span style={{ fontSize: 13, fontWeight: 600, color: alert.triggered ? "#dc2626" : colors.text }}>
                        {typeInfo ? t(typeInfo.labelKey) : alert.type}
                      </span>
                      {alert.triggered && <BellRinging size={12} color="#dc2626" weight="fill" />}
                      {!alert.active && <span style={{ fontSize: 10, color: colors.textMuted, background: colors.statBg, padding: "1px 6px", borderRadius: 4 }}>{t("alertsManage.disabled")}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: alert.triggered ? "#dc2626" : colors.textMuted, marginTop: 2 }}>
                      {alert.type === "price_alert" && alert.crop && alert.targetPrice != null && `${alert.direction === "above" ? ">" : "<"} ${formatNumber(alert.targetPrice)} ${t("common.currency")}/kg · ${tCrop(alert.crop)}`}
                      {alert.type === "new_lot" && `${alert.region || t("alertsManage.allRegions")}${alert.certification ? ` · ${tCert(alert.certification)}` : ""}`}
                      {alert.type === "price_drop" && alert.crop && `${t("alertsManage.dropOn")} ${tCrop(alert.crop)}`}
                      {alert.type === "new_producer" && alert.certification && `${t("alertsManage.certifiedProducer")} ${tCert(alert.certification)}`}
                      {alert.triggered && ` · ${t("alertsManage.triggered")}`}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <button onClick={() => toggleMut.mutate(alert.id)} style={{ background: "none", border: "none", cursor: "pointer", color: alert.active ? "#22c55e" : colors.textMuted, padding: 4, display: "flex" }}>
                      {alert.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>
                    <button onClick={() => deleteMut.mutate(alert.id)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, padding: 4, display: "flex" }}>
                      <Trash size={14} />
                    </button>
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
