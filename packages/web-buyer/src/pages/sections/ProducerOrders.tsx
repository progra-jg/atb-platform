import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  FileText, ArrowLeft, Package, Clock, CheckCircle, Truck, SealCheck,
  Cube, MapPin, CalendarBlank, CurrencyCircleDollar, BellRinging, X,
} from "@phosphor-icons/react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { fetchOrders } from "../../services/orders";
import Badge from "../../components/Badge";
import OrderStatusTimeline from "../../components/OrderStatusTimeline";
import EscrowStatus from "../../components/EscrowStatus";
import { formatNumber } from "../../utils/format";
import type { Order } from "../../types";

const STATUS_ICONS: Record<string, React.ReactNode> = {
  "En attente": <Clock size={14} />,
  "Dépôt reçu": <CheckCircle size={14} />,
  "En livraison": <Truck size={14} />,
  "Livrée": <SealCheck size={14} />,
};

function statusVariant(status: string): "success" | "warning" | "info" | "error" | "neutral" {
  if (status === "Livrée") return "success";
  if (status === "En attente") return "warning";
  if (status === "Dépôt reçu" || status === "En livraison") return "info";
  return "neutral";
}

export default function ProducerOrders() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => fetchOrders(),
  });

  const myOrders = orders.filter((o: Order) => o.producteurId === user?.id);
  const activeOrders = myOrders.filter((o: Order) => o.statut !== "Livrée");

  const stats = [
    { key: "total", value: myOrders.length, icon: FileText, color: colors.accent },
    { key: "active", value: activeOrders.length, icon: Package, color: colors.warning },
    { key: "delivered", value: myOrders.filter((o: Order) => o.statut === "Livrée").length, icon: SealCheck, color: colors.success },
  ];

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div onClick={() => navigate("/producer")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: colors.textSecondary, fontSize: 12 }}>
          <ArrowLeft size={14} />
          <span>{t("common.back")}</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <FileText size={18} color={colors.warning} weight="bold" />
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.text }}>
          {t("producer.orders")}
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{
                background: colors.surface, borderRadius: 12, padding: "14px 16px",
                border: `1px solid ${colors.borderLight}`,
              }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: colors.text }}>
                {s.value}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, fontSize: 11, color: colors.textMuted }}>
                <Icon size={12} color={s.color} />
                <span>{t(`producer.${s.key}`)}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {isLoading ? (
        <div style={{ textAlign: "center", padding: 40, color: colors.textMuted, fontSize: 13 }}>
          {t("common.loading")}
        </div>
      ) : myOrders.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{
            textAlign: "center", padding: "60px 24px",
            background: colors.surface, borderRadius: 16,
            border: `1px solid ${colors.borderLight}`,
          }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: `linear-gradient(135deg, ${colors.warning}15, ${colors.info}10)`,
            margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <BellRinging size={34} color={colors.warning} weight="thin" />
          </div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.text }}>
            {t("producer.noOrders")}
          </h3>
          <p style={{ fontSize: 13, color: colors.textMuted, margin: "8px 0 0", maxWidth: 360, marginInline: "auto", lineHeight: 1.5 }}>
            {t("producer.noOrdersSub")}
          </p>
        </motion.div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {myOrders.map((order: Order) => (
            <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{
                background: colors.surface, borderRadius: 12,
                border: `1px solid ${colors.borderLight}`, padding: 16,
                cursor: "pointer",
              }}
              onClick={() => setSelectedOrder(order)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: colors.text }}>
                    {order.culture}
                  </div>
                  <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                    {order.id} — {order.quantite}
                  </div>
                </div>
                <Badge variant={statusVariant(order.statut)} text={order.statut} icon={STATUS_ICONS[order.statut] ?? undefined} />
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 11, color: colors.textSecondary }}>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <CalendarBlank size={12} />
                  {order.date}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <MapPin size={12} />
                  {order.livraison}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <CurrencyCircleDollar size={12} />
                  {order.total}
                </span>
              </div>

              {order.producteurId && (
                <div style={{ marginTop: 8, fontSize: 11, color: colors.textMuted }}>
                  <Cube size={11} style={{ marginRight: 4, verticalAlign: "middle" }} />
                  {order.lot}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selectedOrder && (
        <div onClick={() => setSelectedOrder(null)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: colors.surface, borderRadius: 16, maxWidth: 480, width: "100%",
            padding: 24, maxHeight: "90vh", overflow: "auto",
            border: `1px solid ${colors.borderLight}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: colors.text }}>{selectedOrder.culture}</div>
                <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{selectedOrder.id} — {selectedOrder.quantite}</div>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={{ background: colors.statBg, border: "none", borderRadius: 10, width: 32, height: 32, cursor: "pointer", color: colors.textMuted, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={14} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                { label: t("orders.fields.totalPrice"), value: selectedOrder.total, color: colors.accent },
                { label: t("orders.fields.delivery"), value: selectedOrder.livraison },
                { label: t("orders.fields.date"), value: selectedOrder.date },
              ].map((f) => (
                <div key={f.label} style={{ background: colors.statBg, padding: "8px 12px", borderRadius: 8 }}>
                  <div style={{ fontSize: 10, color: colors.textMuted }}>{f.label}</div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: f.color || colors.text }}>{f.value}</div>
                </div>
              ))}
            </div>

            <EscrowStatus order={selectedOrder} onRelease={() => setSelectedOrder(null)} onDispute={() => setSelectedOrder(null)} />

            <div style={{ borderTop: `1px solid ${colors.borderLight}`, paddingTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: colors.text, marginBottom: 8 }}>
                {t("orders.timeline.title")}
              </div>
              <OrderStatusTimeline status={selectedOrder.statut} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
