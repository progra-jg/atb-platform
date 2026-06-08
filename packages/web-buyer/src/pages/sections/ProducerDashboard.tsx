import { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Package, PlusCircle, FileText, ArrowRight, ChartBar,
  CheckCircle, CurrencyCircleDollar, Warehouse,
  Handshake, BellRinging, Leaf, SunHorizon,
  ShieldCheck, LockKey,
} from "@phosphor-icons/react";
import { useTheme } from "../../context/ThemeContext";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { useAuth } from "../../context/AuthContext";
import { fetchLots } from "../../services/lots";
import { fetchOrders } from "../../services/orders";
import { getAllFarmerLots } from "../../services/farmerLots";
import { getEscrowStats } from "../../services/escrow";
import { formatNumber } from "../../utils/format";
import Badge from "../../components/Badge";
import type { Lot, Order } from "../../types";

function computeTrust(lots: Lot[], orders: Order[]): { score: number; label: string; color: string; items: { label: string; earned: boolean }[] } {
  let score = 40;
  const items = [
    { label: "producer.trustListed", earned: lots.length > 0 },
    { label: "producer.trustActive", earned: lots.filter((l: Lot) => l.statut === "Disponible").length > 0 },
    { label: "producer.trustOrders", earned: orders.length > 0 },
    { label: "producer.trustCertified", earned: lots.some((l: Lot) => l.certification) },
    { label: "producer.trustQuality", earned: lots.some((l: Lot) => l.stockQuality && Object.keys(l.stockQuality).length > 0) },
  ];
  items.forEach((item) => { if (item.earned) score += 12; });
  const final = Math.min(score, 100);
  const color = final >= 80 ? "#059669" : final >= 50 ? "#d97706" : "#dc2626";
  const label = final >= 80 ? "producer.trustExcellent" : final >= 50 ? "producer.trustGood" : "producer.trustLow";
  return { score: final, label, color, items };
}

function Greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "producer.greetingMorning";
  if (h < 17) return "producer.greetingAfternoon";
  return "producer.greetingEvening";
}

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  return (
    <span style={{ fontSize: "inherit", fontWeight: "inherit", color: "inherit" }}>
      {prefix}{value.toLocaleString()}{suffix}
    </span>
  );
}

function TrustGauge({ score, color, size = 48 }: { score: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)" }}
      />
    </svg>
  );
}

export default function ProducerDashboard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const { data: lots = [] } = useQuery({
    queryKey: ["lots"],
    queryFn: () => fetchLots(),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: () => fetchOrders(),
  });

  const myOrders = useMemo(() => (orders as Order[]).filter((o: Order) => o.producteurId === user?.id), [orders, user?.id]);
  const orderRevenue = useMemo(() => myOrders.reduce((sum, o) => sum + (o.escrowDeposit ?? 0), 0), [myOrders]);
  const escrowStats = useMemo(() => user?.id ? getEscrowStats(user.id, "seller") : null, [user?.id]);

  const myLots = useMemo(() => getAllFarmerLots().filter((l: Lot) => l.producteurId === user?.id), [user?.id]);
  const farmerLots = useMemo(() => [...myLots, ...lots.filter((l: Lot) => l.producteurId === user?.id || l.producteur === user?.company)], [myLots, lots, user?.id, user?.company]);
  const seen = useMemo(() => new Set<string>(), []);
  const dedupedLots = useMemo(() => farmerLots.filter((l: Lot) => { if (seen.has(l.id)) return false; seen.add(l.id); return true; }), [farmerLots, seen]);
  const activeLots = useMemo(() => dedupedLots.filter((l: Lot) => l.statut === "Disponible"), [dedupedLots]);

  const trust = useMemo(() => computeTrust(dedupedLots, myOrders), [dedupedLots, myOrders]);
  const greetingKey = Greeting();
  const initials = (user?.company || user?.email || "P").charAt(0).toUpperCase();
  const displayName = user?.company || user?.email?.split("@")[0] || t("nav.farmer");

  const stats = [
    { key: "active", value: activeLots.length, icon: CheckCircle, color: colors.success, desc: "lots actifs" },
    { key: "total", value: dedupedLots.length, icon: Package, color: colors.accent, desc: "lots total" },
    { key: "orders", value: myOrders.length, icon: Handshake, color: colors.warning, desc: "commandes reçues" },
    { key: "revenue", value: orderRevenue, icon: CurrencyCircleDollar, color: colors.info, desc: "revenu total", prefix: "" },
  ];

  const quickActions = [
    { key: "newLot", icon: PlusCircle, path: "/producer/lots/new", color: colors.accent, descKey: "producer.newLotDesc" },
    { key: "myLots", icon: Package, path: "/producer/lots", color: colors.info, descKey: "producer.myLotsDesc" },
    { key: "orders", icon: FileText, path: "/producer/orders", color: colors.warning, descKey: "producer.ordersDesc" },
    { key: "analytics", icon: ChartBar, path: "/producer/analytics", color: colors.info, descKey: "producer.analyticsDesc" },
  ];

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px 60px" }}>
      {/* Welcome Card */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{
        background: `linear-gradient(135deg, #0a3d25 0%, #0d6b42 50%, #108052 100%)`,
        borderRadius: 16, padding: isMobile ? "20px" : "24px 28px",
        display: "flex", alignItems: "center", gap: 20,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
        <div style={{ position: "absolute", bottom: -60, left: "40%", width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />

        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: "rgba(255,255,255,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, fontSize: 22, fontWeight: 800, color: "#fff",
          backdropFilter: "blur(4px)",
        }}>
          {initials}
        </div>

        <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: "#fff" }}>
              {t(greetingKey)}, {displayName.split(" ")[0]}
            </span>
            <span style={{
              fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
              padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.15)", color: "#fff",
            }}>
              {t("nav.farmer")}
            </span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>
            {activeLots.length > 0
              ? t("producer.activeSummary", { count: activeLots.length, orders: myOrders.length })
              : t("producer.emptyWelcome")}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, position: "relative", zIndex: 1 }}>
          <TrustGauge score={trust.score} color={trust.color} size={48} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: trust.color }}>{trust.score}/100</span>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.6)" }}>{t(trust.label)}</span>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: 12, marginTop: 20,
        }}>
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + idx * 0.05 }}
              whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
              style={{
                background: colors.surface, borderRadius: 14,
                border: `1px solid ${colors.borderLight}`, padding: "18px 16px",
                transition: "box-shadow 0.2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  {t(`producer.${stat.key}`)}
                </span>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: `${stat.color}14`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={16} color={stat.color} weight="bold" />
                </div>
              </div>
              <div style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, color: colors.text, lineHeight: 1.1 }}>
                {stat.key === "revenue" ? (
                  <>{formatNumber(stat.value)} FCFA</>
                ) : (
                  <AnimatedNumber value={stat.value} />
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Trust Badges */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
        {trust.items.map((item) => (
          <span key={item.label} style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 10, fontWeight: 500, padding: "4px 10px", borderRadius: 20,
            background: item.earned ? `${colors.success}14` : colors.surfaceHover,
            color: item.earned ? colors.success : colors.textMuted,
            border: `1px solid ${item.earned ? colors.success : "transparent"}`,
          }}>
            <CheckCircle size={10} weight={item.earned ? "fill" : "regular"} />
            {t(item.label)}
          </span>
        ))}
      </motion.div>

      {/* Quick Actions + Lots */}
      <div style={{
        display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 2fr",
        gap: 16, marginTop: 24,
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <motion.div key={action.key} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + idx * 0.04 }}
                whileHover={{ y: -2, scale: 1.01 }}
                onClick={() => navigate(action.path)}
                style={{
                  background: colors.surface, borderRadius: 14,
                  border: `1.5px solid ${colors.borderLight}`,
                  padding: "16px", cursor: "pointer",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = action.color; (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 12px ${action.color}18`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = colors.borderLight; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: `${action.color}18`,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Icon size={20} color={action.color} weight="bold" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{t(`producer.${action.key}`)}</div>
                    <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>{t(action.descKey)}</div>
                  </div>
                  <ArrowRight size={14} color={colors.textMuted} weight="bold" style={{ flexShrink: 0 }} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Lots Preview */}
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
          style={{
            background: colors.surface, borderRadius: 16,
            border: `1px solid ${colors.borderLight}`, padding: 18,
          }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Package size={16} color={colors.accent} weight="bold" />
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: colors.text }}>{t("producer.lots")}</h3>
              <span style={{ fontSize: 11, color: colors.textMuted, fontWeight: 500 }}>({dedupedLots.length})</span>
            </div>
            {dedupedLots.length > 0 && (
              <button onClick={() => navigate("/producer/lots")}
                style={{ background: "none", border: "none", color: colors.accent, fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                {t("common.viewAll")} <ArrowRight size={10} />
              </button>
            )}
          </div>

          {dedupedLots.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 16px" }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: `${colors.accent}10`, margin: "0 auto 12px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Leaf size={28} color={colors.accent} weight="thin" />
              </div>
              <p style={{ fontSize: 13, color: colors.textMuted, margin: "0 0 4px" }}>{t("producer.createFirst")}</p>
              <p style={{ fontSize: 10, color: colors.textMuted, margin: "0 0 14px" }}>{t("producer.createFirstSub")}</p>
              <button onClick={() => navigate("/producer/lots/new")}
                style={{ background: colors.accent, border: "none", color: "#fff", padding: "10px 22px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <PlusCircle size={14} weight="bold" />
                {t("producer.newLot")}
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {dedupedLots.slice(0, 5).map((lot: Lot, idx: number) => (
                <motion.div key={lot.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                  onClick={() => navigate(`/producer/lots/${lot.id}/edit`)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px", borderRadius: 12,
                    border: `1px solid ${colors.borderLight}`, cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  whileHover={{ x: 2, borderColor: colors.accent }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${lot.statut === "Disponible" ? colors.success : colors.warning}14`,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Package size={16} color={lot.statut === "Disponible" ? colors.success : colors.warning} weight={lot.statut === "Disponible" ? "fill" : "regular"} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{lot.culture}</div>
                    <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>
                      {lot.quantite} &middot; {formatNumber(lot.prix)} {t("common.currency")}/kg
                    </div>
                  </div>
                  <Badge
                    text={t("lotStatus." + lot.statut, lot.statut)}
                    variant={lot.statut === "Disponible" ? "success" : lot.statut === "En transit" ? "warning" : "error"}
                    size="sm"
                    pill
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Stock Quality + Recent Orders */}
      <div style={{
        display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
        gap: 16, marginTop: 16,
      }}>
        {/* Stock Quality */}
        {(() => {
          const lotsWithQuality = dedupedLots.filter((l: Lot) => l.stockQuality && Object.keys(l.stockQuality).length > 0);
          if (lotsWithQuality.length === 0) return null;
          const avgMoisture = lotsWithQuality.reduce((sum: number, l: Lot) => sum + (parseFloat(l.stockQuality?.moisture ?? "0") || 0), 0) / lotsWithQuality.length;
          return (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              style={{
                background: colors.surface, borderRadius: 16,
                border: `1px solid ${colors.borderLight}`, padding: 18,
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <Warehouse size={16} color={colors.info} weight="bold" />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: colors.text }}>
                  {t("producer.stockQuality")}
                </h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {[
                  { label: t("producer.total"), value: `${dedupedLots.length}`, icon: Package, color: colors.accent },
                  { label: t("producer.active"), value: `${activeLots.length}`, icon: CheckCircle, color: colors.success },
                  { label: t("producer.qualityWithData"), value: `${lotsWithQuality.length}`, icon: Warehouse, color: colors.info },
                ].map((s) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} style={{ textAlign: "center", padding: "14px 8px", background: colors.surfaceHover, borderRadius: 10 }}>
                      <Icon size={18} color={s.color} style={{ marginBottom: 6 }} />
                      <div style={{ fontSize: 20, fontWeight: 700, color: colors.text }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: colors.textMuted }}>{s.label}</div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })()}

        {/* Recent Orders */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{
            background: colors.surface, borderRadius: 16,
            border: `1px solid ${colors.borderLight}`, padding: 18,
          }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Handshake size={16} color={colors.warning} weight="bold" />
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: colors.text }}>
                {t("producer.recentOrders")}
              </h3>
            </div>
            {myOrders.length > 0 && (
              <button onClick={() => navigate("/producer/orders")}
                style={{ background: "none", border: "none", color: colors.accent, fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                {t("common.viewAll")} <ArrowRight size={10} />
              </button>
            )}
          </div>

          {myOrders.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 16px" }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: `${colors.warning}10`, margin: "0 auto 12px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <BellRinging size={28} color={colors.warning} weight="thin" />
              </div>
              <p style={{ fontSize: 13, color: colors.textMuted, margin: "0 0 4px" }}>{t("producer.noOrders")}</p>
              <p style={{ fontSize: 10, color: colors.textMuted, margin: 0 }}>{t("producer.noOrdersSub")}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {myOrders.slice(0, 5).map((order: Order, idx: number) => (
                <motion.div key={order.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px", borderRadius: 12,
                    border: `1px solid ${colors.borderLight}`, cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  whileHover={{ x: 2, borderColor: colors.warning }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${order.statut === "Livrée" ? colors.success : colors.warning}14`,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <FileText size={16} color={order.statut === "Livrée" ? colors.success : colors.warning} weight="bold" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{order.culture}</div>
                    <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>
                      {order.quantite} &middot; {order.total}
                    </div>
                  </div>
                  <Badge
                    text={order.statut}
                    variant={order.statut === "Livrée" ? "success" : order.statut === "En attente" ? "warning" : "info"}
                    size="sm"
                    pill
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Escrow Stats */}
      {escrowStats && escrowStats.total > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          style={{
            marginTop: 16,
            background: colors.surface, borderRadius: 16,
            border: `1px solid ${colors.borderLight}`, padding: 18,
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <ShieldCheck size={16} color={colors.accent} weight="bold" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: colors.text }}>
              {t("escrow.title")}
            </h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[
              { label: t("escrow.secured"), value: `${formatNumber(escrowStats.totalHeld)} FCFA`, icon: ShieldCheck, color: colors.accent },
              { label: t("escrow.released"), value: `${formatNumber(escrowStats.totalReleased)} FCFA`, icon: CheckCircle, color: colors.success },
              { label: t("escrowEngine.dashboard.active"), value: `${escrowStats.held}`, icon: LockKey, color: colors.warning },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} style={{ textAlign: "center", padding: "14px 8px", background: colors.surfaceHover, borderRadius: 10 }}>
                  <Icon size={18} color={s.color} style={{ marginBottom: 6 }} />
                  <div style={{ fontSize: 20, fontWeight: 700, color: colors.text }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: colors.textMuted }}>{s.label}</div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {dedupedLots.length === 0 && myOrders.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          style={{
            marginTop: 20, textAlign: "center",
            background: colors.surface, borderRadius: 16,
            border: `1px solid ${colors.borderLight}`, padding: "40px 20px",
          }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: `linear-gradient(135deg, ${colors.accent}15, ${colors.info}10)`,
            margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <SunHorizon size={36} color={colors.accent} weight="thin" />
          </div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.text }}>
            {t("producer.startTitle")}
          </h3>
          <p style={{ fontSize: 12, color: colors.textMuted, margin: "8px 0 20px", maxWidth: 360, marginInline: "auto" }}>
            {t("producer.startDesc")}
          </p>
          <button onClick={() => navigate("/producer/lots/new")}
            style={{
              background: colors.accent, border: "none", color: "#fff",
              padding: "12px 28px", borderRadius: 12, fontSize: 13, fontWeight: 700,
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
            }}>
            <PlusCircle size={16} weight="bold" />
            {t("producer.newLot")}
          </button>
        </motion.div>
      )}
    </div>
  );
}
