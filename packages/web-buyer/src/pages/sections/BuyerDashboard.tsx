import { useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Package, ShoppingCart, Heart, Handshake, ArrowRight,
  SquaresFour, Envelope, MagnifyingGlass, BellRinging, SunHorizon,
  CheckCircle, Clock, CurrencyCircleDollar, ShieldCheck,
} from "@phosphor-icons/react";
import { useTheme } from "../../context/ThemeContext";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { useAuth } from "../../context/AuthContext";
import { fetchOrders } from "../../services/orders";
import { fetchLots } from "../../services/lots";
import { getEscrowStats } from "../../services/escrow";
import { formatNumber } from "../../utils/format";
import Badge from "../../components/Badge";
import type { Order } from "../../types";

const BUYER_ACCENT = "#2563eb";

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

export default function BuyerDashboard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();

  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: () => fetchOrders(),
  });

  const { data: lots = [] } = useQuery({
    queryKey: ["lots"],
    queryFn: () => fetchLots(),
  });

  const myOrders = useMemo(() => (orders as Order[]).filter((o: Order) => o.producteurId === user?.id || o.buyerId === user?.id), [orders, user?.id]);
  const activeOrders = useMemo(() => myOrders.filter((o: Order) => o.statut !== "Livrée"), [myOrders]);
  const totalSpent = useMemo(() => myOrders.reduce((s: number, o: Order) => s + (o.escrowDeposit ?? 0), 0), [myOrders]);
  const escrowStats = useMemo(() => user?.id ? getEscrowStats(user.id, "buyer") : null, [user?.id]);

  const greetingKey = Greeting();
  const initials = (user?.company || user?.email || "A").charAt(0).toUpperCase();
  const displayName = user?.company || user?.email?.split("@")[0] || t("nav.buyer");

  const stats = [
    { key: "orders", value: myOrders.length, icon: ShoppingCart, color: BUYER_ACCENT },
    { key: "active", value: activeOrders.length, icon: Clock, color: colors.warning },
    { key: "favorites", value: lots.length, icon: Heart, color: colors.error },
    { key: "spent", value: totalSpent, icon: CurrencyCircleDollar, color: colors.success },
  ];

  const quickActions = [
    { key: "browse", icon: MagnifyingGlass, path: "/lots", color: BUYER_ACCENT, desc: "Parcourez les dernières offres disponibles" },
    { key: "orders", icon: ShoppingCart, path: "/business/orders", color: colors.warning, desc: "Suivez vos commandes en cours" },
    { key: "contracts", icon: Handshake, path: "/business/contracts", color: colors.info, desc: "Gérez vos contrats d'approvisionnement" },
    { key: "inbox", icon: Envelope, path: "/business/inbox", color: colors.accent, desc: "Consultez vos messages" },
  ];

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px 60px" }}>
      {/* Welcome Card */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{
        background: `linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #3b82f6 100%)`,
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
              {t("nav.buyer")}
            </span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.4 }}>
            {myOrders.length > 0
              ? `${myOrders.length} commande(s) · ${lots.length} lot(s) disponibles`
              : t("producer.emptyWelcome")}
          </p>
        </div>

        <div style={{ flexShrink: 0, position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", padding: "8px 14px", borderRadius: 10 }}>
          <ShoppingCart size={18} color="#fff" weight="fill" />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{myOrders.length}</span>
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
                  {stat.key === "spent" ? t("common.total") : t(`orders.stats.${stat.key === "active" ? "active" : "total"}`)}
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
                {stat.key === "spent" ? (
                  <>{formatNumber(stat.value)} FCFA</>
                ) : (
                  <AnimatedNumber value={stat.value} />
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10, marginTop: 20 }}>
        {quickActions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <motion.div key={action.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + idx * 0.04 }}
              whileHover={{ y: -2 }}
              onClick={() => navigate(action.path)}
              style={{
                background: colors.surface, borderRadius: 12,
                border: `1.5px solid ${colors.borderLight}`, padding: "14px",
                cursor: "pointer", textAlign: "center",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = action.color; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = colors.borderLight; }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `${action.color}14`, margin: "0 auto 8px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon size={18} color={action.color} weight="bold" />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{t(`nav.${action.key === "browse" ? "catalog" : action.key}`)}</div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Recent Orders */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        style={{
          background: colors.surface, borderRadius: 16,
          border: `1px solid ${colors.borderLight}`, padding: 18, marginTop: 20,
        }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShoppingCart size={16} color={BUYER_ACCENT} weight="bold" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: colors.text }}>
              {t("producer.recentOrders")}
            </h3>
          </div>
          {myOrders.length > 0 && (
            <button onClick={() => navigate("/business/orders")}
              style={{ background: "none", border: "none", color: BUYER_ACCENT, fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              {t("common.viewAll")} <ArrowRight size={10} />
            </button>
          )}
        </div>

        {myOrders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 16px" }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: `${BUYER_ACCENT}10`, margin: "0 auto 12px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <BellRinging size={28} color={BUYER_ACCENT} weight="thin" />
            </div>
            <p style={{ fontSize: 13, color: colors.textMuted, margin: "0 0 4px" }}>{t("producer.noOrders")}</p>
            <p style={{ fontSize: 10, color: colors.textMuted, margin: "0 0 14px" }}>{t("producer.noOrdersSub")}</p>
            <button onClick={() => navigate("/lots")}
              style={{ background: BUYER_ACCENT, border: "none", color: "#fff", padding: "10px 22px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
              <MagnifyingGlass size={14} weight="bold" />
              {t("nav.catalog")}
            </button>
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
                whileHover={{ x: 2, borderColor: BUYER_ACCENT }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `${order.statut === "Livrée" ? colors.success : colors.warning}14`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <ShoppingCart size={16} color={order.statut === "Livrée" ? colors.success : colors.warning} weight="bold" />
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

      {/* Escrow Stats */}
      {escrowStats && escrowStats.total > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          style={{
            marginTop: 16,
            background: colors.surface, borderRadius: 16,
            border: `1px solid ${colors.borderLight}`, padding: 18,
          }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <ShieldCheck size={16} color={BUYER_ACCENT} weight="bold" />
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: colors.text }}>
              {t("escrow.title")}
            </h3>
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: 10, color: colors.textMuted }}>
              {escrowStats.held} {t("escrowEngine.dashboard.active")}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {[
              { label: t("escrow.deposit"), value: `${formatNumber(escrowStats.totalHeld)} FCFA`, icon: ShieldCheck, color: BUYER_ACCENT },
              { label: t("escrow.released"), value: `${formatNumber(escrowStats.totalReleased)} FCFA`, icon: CheckCircle, color: colors.success },
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

      {/* First visit CTA */}
      {myOrders.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          style={{
            marginTop: 20,
            background: `linear-gradient(135deg, ${BUYER_ACCENT}08, ${colors.info}06)`,
            borderRadius: 16, border: `1px solid ${colors.borderLight}`,
            padding: "36px 24px", textAlign: "center",
          }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: `linear-gradient(135deg, ${BUYER_ACCENT}20, ${colors.info}15)`,
            margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <MagnifyingGlass size={32} color={BUYER_ACCENT} weight="thin" />
          </div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.text }}>
            {t("buyer.startTitle")}
          </h3>
          <p style={{ fontSize: 12, color: colors.textMuted, margin: "8px 0 20px", maxWidth: 400, marginInline: "auto", lineHeight: 1.5 }}>
            {t("buyer.startDesc")}
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => navigate("/lots")}
              style={{ background: BUYER_ACCENT, border: "none", color: "#fff", padding: "12px 28px", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
              <MagnifyingGlass size={16} weight="bold" />
              {t("nav.catalog")}
            </button>
            <button onClick={() => navigate("/farmers")}
              style={{ background: "transparent", border: `1.5px solid ${colors.border}`, color: colors.text, padding: "12px 28px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              {t("nav.farmers")}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
