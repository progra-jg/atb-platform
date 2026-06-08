import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle, X, Truck, Package, MapPin, CalendarBlank,
  CurrencyCircleDollar, ClipboardText, Clock, MagnifyingGlass,
  SortAscending, CaretRight, SealCheck, Star, ShieldCheck,
  Cube, MapPinLine,
} from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import FadeIn from "../components/FadeIn";
import EmptyState from "../components/EmptyState";
import Breadcrumb from "../components/Breadcrumb";
import { useIsMobile } from "../hooks/useMediaQuery";
import { fetchOrders, fetchOrderById } from "../services/orders";
import { getBuyerReviewForOrder } from "../services/reviews";
import FollowButton from "../components/FollowButton";
import OrderStatusTimeline from "../components/OrderStatusTimeline";
import EscrowStatus from "../components/EscrowStatus";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import type { Order, TimelineStep, Review } from "../types";
import Badge from "../components/Badge";
import OrderTrackingMap from "../components/OrderTrackingMap";
import ShipmentTracker from "../components/ShipmentTracker";
import { getBuyerId } from "../utils/buyer";
import { createEscrow } from "../services/escrow";
import { formatNumber } from "../utils/format";

const STATUS_ICONS: Record<string, React.ReactNode> = {
  "En attente": <Clock size={14} />,
  "Confirmée": <CheckCircle size={14} />,
  "En livraison": <Truck size={14} />,
  "Livrée": <SealCheck size={14} />,
};

function statusLabel(s: string, t: (key: string) => string): string {
  const map: Record<string, string> = {
    "En attente": t("orders.status.pending"),
    "Dépôt reçu": t("orders.status.depositReceived"),
    "Confirmée": t("orders.status.depositReceived"),
    "En inspection": t("orders.status.inspection"),
    "Prêt au hub": t("orders.status.readyAtHub"),
    "En livraison": t("orders.status.inDelivery"),
    "Livrée": t("orders.status.delivered"),
  };
  return map[s] || s;
}

function statusVariant(status: string): "success" | "warning" | "info" | "error" | "neutral" {
  if (status === "Livrée" || status === "Prêt au hub") return "success";
  if (status === "En attente") return "warning";
  if (status === "Dépôt reçu" || status === "Confirmée" || status === "En livraison") return "info";
  if (status === "En inspection") return "neutral";
  return "neutral";
}

function S({ h = 20, w = "100%", r = 6 }: { h?: number; w?: string | number; r?: number }) {
  const { colors } = useTheme();
  return <div style={{ height: h, width: w, borderRadius: r, background: colors.border, animation: "shimmer 1.2s ease-in-out infinite" }} />;
}

function OrderTimeline({ steps }: { steps: TimelineStep[] }) {
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  return (
    <div style={{ position: "relative", paddingLeft: isMobile ? 20 : 24 }}>
      {steps.map((s, i) => {
        const dotColor = s.status === "completed" ? colors.success : s.status === "active" ? colors.accent : colors.border;
        const lineColor = s.status === "completed" ? colors.success : colors.border;
        return (
          <div key={s.step} style={{ position: "relative", paddingBottom: i < steps.length - 1 ? 20 : 0 }}>
            <div style={{
              position: "absolute", left: isMobile ? -16 : -20, top: 4,
              width: 12, height: 12, borderRadius: "50%",
              background: dotColor, border: `2px solid ${colors.surface}`,
              zIndex: 1, boxShadow: s.status === "active" ? `0 0 0 4px ${colors.accent}20` : "none",
            }} />
            {i < steps.length - 1 && (
              <div style={{
                position: "absolute", left: isMobile ? -11 : -15, top: 16,
                width: 2, height: "calc(100% - 4px)",
                background: lineColor, opacity: 0.4,
              }} />
            )}
            <div style={{ paddingLeft: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: s.status === "pending" ? colors.textMuted : colors.text }}>{s.title}</span>
                <span style={{ fontSize: 10, color: colors.textMuted }}>{s.date}</span>
              </div>
              <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 1 }}>{s.desc}</div>
              {s.acteur !== "—" && (
                <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 1 }}>
                  {s.acteur} · {s.lieu}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Orders() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isMobile = useIsMobile();

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"date-desc" | "date-asc" | "total-desc" | "total-asc">("date-desc");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [existingReview, setExistingReview] = useState<Review | null>(null);
  const buyerId = getBuyerId();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: fetchOrders,
  });

  const { data: orderDetail } = useQuery({
    queryKey: ["order-detail", selectedOrder?.id],
    queryFn: () => fetchOrderById(selectedOrder!.id),
    enabled: !!selectedOrder,
  });

  const [localOrders, setLocalOrders] = useState<Order[] | null>(null);
  const [notify, setNotify] = useState<{ open: boolean; message: string; type: "confirmed" | "cancelled" }>({ open: false, message: "", type: "confirmed" });
  const { user: authUser } = useAuth();

  useEffect(() => { if (orders) setLocalOrders(orders); }, [orders]);

  useEffect(() => {
    if (selectedOrder?.statut === "Livrée") {
      getBuyerReviewForOrder(selectedOrder.id, buyerId).then(setExistingReview);
      setShowReviewForm(false);
    } else {
      setExistingReview(null);
      setShowReviewForm(false);
    }
  }, [selectedOrder]);

  const list = localOrders ?? orders ?? [];

  const filtered = useMemo(() => {
    let result = list.filter((o: Order) => {
      if (tab !== "all" && tab !== "active" && o.statut !== tab) return false;
      if (tab === "active" && o.statut === "Livrée") return false;
      if (search) {
        const q = search.toLowerCase();
        if (!o.id.toLowerCase().includes(q) && !o.lot.toLowerCase().includes(q) && !o.culture.toLowerCase().includes(q) && !t("crops." + o.culture, "").toLowerCase().includes(q)) return false;
      }
      return true;
    });
    result.sort((a: Order, b: Order) => {
      const parseDate = (d: string) => { const p = d.split("/"); return new Date(+p[2], +p[1] - 1, +p[0]).getTime(); };
      const parseTotal = (t: string) => { const n = t.replace(/[^0-9]/g, ""); return parseInt(n, 10) || 0; };
      switch (sort) {
        case "date-asc": return parseDate(a.date) - parseDate(b.date);
        case "date-desc": return parseDate(b.date) - parseDate(a.date);
        case "total-asc": return parseTotal(a.total) - parseTotal(b.total);
        case "total-desc": return parseTotal(b.total) - parseTotal(a.total);
        default: return 0;
      }
    });
    return result;
  }, [list, tab, search, sort]);

  const stats = useMemo(() => ({
    total: list.length,
    active: list.filter((o: Order) => o.statut !== "Livrée").length,
    delivered: list.filter((o: Order) => o.statut === "Livrée").length,
  }), [list]);

  const confirmOrder = (id: string) => {
    const order = (localOrders ?? list).find((o: Order) => o.id === id);
    if (order && authUser) {
      const deposit = Math.round(parseFloat(order.total.replace(/[^0-9]/g, "")) * 0.15);
      const total = parseInt(order.total.replace(/[^0-9]/g, ""), 10) || 0;
      createEscrow(id, deposit, total, authUser.id, order.producteurId || "", order.statut);
    }
    setLocalOrders((prev) => (prev ?? list).map((o) => o.id === id ? { ...o, statut: "Dépôt reçu" } : o));
    setNotify({ open: true, message: `${t("nav.orders")} ${id} ${t("orders.notified.confirmed")}`, type: "confirmed" });
    setSelectedOrder(null);
  };

  const cancelOrder = (id: string) => {
    setLocalOrders((prev) => (prev ?? list).filter((o) => o.id !== id));
    setNotify({ open: true, message: `${t("nav.orders")} ${id} ${t("orders.notified.cancelled")}`, type: "cancelled" });
    setSelectedOrder(null);
  };

  const sortLabel = sort === "date-desc" ? t("orders.sort.dateDesc") : sort === "date-asc" ? t("orders.sort.dateAsc") : sort === "total-desc" ? t("orders.sort.totalDesc") : t("orders.sort.totalAsc");

  return (
    <FadeIn delay={0.05}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <Breadcrumb crumbs={[
          { label: t("nav.dashboard"), path: "/dashboard" },
          { label: t("nav.orders") },
        ]} />

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: isMobile ? 16 : 20 }}>
          {[
            { label: t("orders.stats.total"), value: stats.total, color: colors.text },
            { label: t("orders.stats.active"), value: stats.active, color: colors.accent },
            { label: t("orders.stats.delivered"), value: stats.delivered, color: colors.success },
          ].map((s) => (
            <Card key={s.label} variant="premium" hoverable={false} style={{ padding: isMobile ? 10 : 14, textAlign: "center" }}>
              <div style={{ fontSize: isMobile ? 20 : 28, fontWeight: 700, color: s.color, letterSpacing: "-0.5px" }}>{s.value}</div>
              <div style={{ fontSize: isMobile ? 10 : 11, color: colors.textMuted, marginTop: 2 }}>{s.label}</div>
            </Card>
          ))}
        </div>

        {/* Search + Sort + Tabs */}
        <div style={{ marginBottom: isMobile ? 12 : 16 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <MagnifyingGlass size={14} color={colors.textMuted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", zIndex: 1 }} />
              <input
                placeholder={t("orders.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%", padding: "10px 12px 10px 36px", borderRadius: 12,
                  border: `1.5px solid ${colors.borderLight}`, fontSize: 13,
                  background: colors.surface, color: colors.text,
                  outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.15s",
                }}
                onFocus={e => e.target.style.borderColor = colors.accent}
                onBlur={e => e.target.style.borderColor = colors.borderLight}
              />
            </div>
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowSortMenu(!showSortMenu)} style={{
                background: colors.surface, border: `1.5px solid ${colors.borderLight}`,
                padding: "10px 14px", borderRadius: 12, cursor: "pointer",
                color: colors.text, display: "flex", alignItems: "center", gap: 6,
                fontSize: 12, fontWeight: 500, height: "100%",
                transition: "border-color 0.15s",
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = colors.accent + "60"}
                onMouseLeave={e => e.currentTarget.style.borderColor = colors.borderLight}>
                <SortAscending size={14} /> {sortLabel}
              </button>
              {showSortMenu && (
                <div style={{
                  position: "absolute", top: "100%", right: 0, marginTop: 6,
                  background: colors.surface, border: `1px solid ${colors.borderLight}`,
                  borderRadius: 12, boxShadow: colors.shadowLg,
                  zIndex: 10, overflow: "hidden", minWidth: 160,
                }}>
                  {[
                    { key: "date-desc", label: t("orders.sort.dateDesc") },
                    { key: "date-asc", label: t("orders.sort.dateAsc") },
                    { key: "total-desc", label: t("orders.sort.totalDesc") },
                    { key: "total-asc", label: t("orders.sort.totalAsc") },
                  ].map((opt) => (
                    <button key={opt.key} onClick={() => { setSort(opt.key as typeof sort); setShowSortMenu(false); }} style={{
                      display: "block", width: "100%", padding: "9px 16px",
                      background: sort === opt.key ? colors.accentLight : "transparent",
                      border: "none", textAlign: "left", cursor: "pointer",
                      fontSize: 13, color: sort === opt.key ? colors.accent : colors.text,
                      fontWeight: sort === opt.key ? 600 : 400,
                      transition: "background 0.1s",
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = colors.surfaceHover}
                      onMouseLeave={e => e.currentTarget.style.background = sort === opt.key ? colors.accentLight : "transparent"}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["all", "active", "En attente", "Confirmée", "En livraison", "Livrée"].map((tabKey) => (
              <Button key={tabKey} variant={tab === tabKey ? "primary" : "ghost"} size="sm"
                onClick={() => setTab(tabKey)}
                style={tab === tabKey ? {} : { border: `1px solid ${colors.borderLight}` }}>
                {tabKey === "all" ? t("orders.tabs.all") : tabKey === "active" ? t("orders.tabs.active") : statusLabel(tabKey, t)}
              </Button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: isMobile ? 12 : 14 }}>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} variant="premium" hoverable={false} style={{ padding: isMobile ? 14 : 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <S h={15} w="30%" />
                  <S h={22} w={90} r={12} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
                  {Array.from({ length: 6 }).map((_, j) => <S key={j} h={13} w="80%" />)}
                </div>
              </Card>
            ))
          ) : (
            filtered.map((order: Order, idx: number) => {
              return (
                <Card key={order.id} variant="premium" onClick={() => setSelectedOrder(order)}
                  style={{ animation: "fadeSlideUp 0.35s ease both", animationDelay: `${idx * 0.04}s`, padding: isMobile ? 14 : 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: colors.accentLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ClipboardText size={isMobile ? 16 : 18} color={colors.accent} weight="fill" />
                      </div>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: isMobile ? 13 : 15, color: colors.text }}>{order.id}</span>
                        {!isMobile && <span style={{ color: colors.textMuted, fontSize: 13, marginLeft: 6 }}>— {order.lot}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Badge text={statusLabel(order.statut, t)} variant={statusVariant(order.statut)} icon={STATUS_ICONS[order.statut] || <Clock size={12} />} size="sm" pill />
                      <CaretRight size={12} color={colors.textMuted} />
                    </div>
                  </div>

                  {isMobile && (
                    <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 10 }}>
                      {order.lot} · {t("crops." + order.culture, order.culture)}
                    </div>
                  )}

                  <div style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: isMobile ? 6 : 10,
                    padding: "10px 12px", background: colors.statBg, borderRadius: 10,
                  }}>
                    {!isMobile && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Package size={14} color={colors.textMuted} />
                        <span style={{ fontSize: 11, color: colors.textMuted }}>{t("orders.fields.culture")}</span>
                        <span style={{ fontWeight: 600, fontSize: 13, marginLeft: "auto", color: colors.text }}>{t("crops." + order.culture, order.culture)}</span>
                      </div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Package size={isMobile ? 12 : 14} color={colors.textMuted} />
                      <span style={{ fontSize: isMobile ? 10 : 11, color: colors.textMuted }}>{t("orders.fields.quantity")}</span>
                      <span style={{ fontWeight: 600, fontSize: isMobile ? 12 : 13, marginLeft: "auto", color: colors.text }}>{order.quantite}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <CurrencyCircleDollar size={isMobile ? 12 : 14} color={colors.textMuted} />
                      <span style={{ fontSize: isMobile ? 10 : 11, color: colors.textMuted }}>{t("orders.fields.unitPrice")}</span>
                      <span style={{ fontWeight: 600, fontSize: isMobile ? 12 : 13, marginLeft: "auto", color: colors.text }}>{order.prixUnitaire}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <CurrencyCircleDollar size={isMobile ? 12 : 14} color={colors.accent} />
                      <span style={{ fontSize: isMobile ? 10 : 11, color: colors.textMuted }}>{t("orders.fields.totalPrice")}</span>
                      <span style={{ fontWeight: 700, fontSize: isMobile ? 12 : 13, color: colors.accent, marginLeft: "auto" }}>{order.total}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <MapPin size={isMobile ? 12 : 14} color={colors.textMuted} />
                      <span style={{ fontSize: isMobile ? 10 : 11, color: colors.textMuted }}>{t("orders.fields.delivery")}</span>
                      <span style={{ fontWeight: 500, fontSize: isMobile ? 11 : 12, marginLeft: "auto", color: colors.textSecondary }}>{order.livraison}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <CalendarBlank size={isMobile ? 12 : 14} color={colors.textMuted} />
                      <span style={{ fontSize: isMobile ? 10 : 11, color: colors.textMuted }}>{t("orders.fields.date")}</span>
                      <span style={{ fontWeight: 500, fontSize: isMobile ? 11 : 12, marginLeft: "auto", color: colors.text }}>{order.date}</span>
                    </div>
                  </div>
                  {order.statut === "En attente" && (
                    <div style={{ marginTop: 12, display: "flex", gap: isMobile ? 6 : 8 }} onClick={(e) => e.stopPropagation()}>
                      <Button variant="primary" size="sm" icon={<CheckCircle size={isMobile ? 14 : 16} weight="bold" />}
                        onClick={() => confirmOrder(order.id)}>
                        {t("orders.actions.confirm")}
                      </Button>
                      <Button variant="ghost" size="sm" icon={<X size={isMobile ? 14 : 16} weight="bold" />}
                        onClick={() => cancelOrder(order.id)}
                        style={{ color: "#dc2626", border: "1.5px solid rgba(220,38,38,0.2)" }}>
                        {t("orders.actions.cancel")}
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })
          )}
          {!isLoading && filtered.length === 0 && (
            <EmptyState
              icon={<ClipboardText size={48} />}
              title={t("orders.empty.title")}
              description={search ? t("orders.empty.searchResult") : tab === "all" ? t("orders.empty.desc") : `${t("orders.empty.descTab")} "${tab}".`}
              action={{ label: t("orders.empty.action"), onClick: () => navigate("/lots") }}
            />
          )}
        </div>

        {/* Detail modal */}
        {selectedOrder && (
          <div onClick={() => setSelectedOrder(null)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <Card variant="premium" onClick={(e) => e.stopPropagation()} hoverable={false} style={{ padding: isMobile ? 20 : 28, maxWidth: 520, width: "100%", maxHeight: "90vh", overflow: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: colors.text, display: "flex", alignItems: "center", gap: 8 }}>
                    <ClipboardText size={18} color={colors.accent} /> {selectedOrder.id}
                  </div>
                  <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{selectedOrder.lot} · {t("crops." + selectedOrder.culture, selectedOrder.culture)}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Badge text={statusLabel(selectedOrder.statut, t)} variant={statusVariant(selectedOrder.statut)} size="sm" />
                  <button onClick={() => setSelectedOrder(null)} style={{ background: colors.statBg, border: "none", borderRadius: 10, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: colors.textMuted }}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20, fontSize: 12 }}>
                <div style={{ background: colors.statBg, padding: "10px 14px", borderRadius: 10 }}>
                  <span style={{ color: colors.textMuted }}>{t("orders.modal.quantity")}</span>
                  <div style={{ fontWeight: 600, color: colors.text, fontSize: 14 }}>{selectedOrder.quantite}</div>
                </div>
                <div style={{ background: colors.statBg, padding: "10px 14px", borderRadius: 10 }}>
                  <span style={{ color: colors.textMuted }}>{t("orders.modal.total")}</span>
                  <div style={{ fontWeight: 700, color: colors.accent, fontSize: 14 }}>{selectedOrder.total}</div>
                </div>
                <div style={{ background: colors.statBg, padding: "10px 14px", borderRadius: 10 }}>
                  <span style={{ color: colors.textMuted }}>{t("orders.modal.unitPrice")}</span>
                  <div style={{ fontWeight: 600, color: colors.text, fontSize: 14 }}>{selectedOrder.prixUnitaire}</div>
                </div>
                <div style={{ background: colors.statBg, padding: "10px 14px", borderRadius: 10 }}>
                  <span style={{ color: colors.textMuted }}>{t("orders.modal.delivery")}</span>
                  <div style={{ fontWeight: 500, color: colors.text, fontSize: 14 }}>{selectedOrder.livraison}</div>
                </div>
                <div style={{ background: colors.statBg, padding: "10px 14px", borderRadius: 10 }}>
                  <span style={{ color: colors.textMuted }}>{t("orders.modal.date")}</span>
                  <div style={{ fontWeight: 500, color: colors.text, fontSize: 14 }}>{selectedOrder.date}</div>
                </div>
              </div>

              {/* Timeline */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.text, marginBottom: 4 }}>
                  {t("orders.timeline.title")}
                </div>
                <OrderStatusTimeline status={selectedOrder.statut} />
              </div>

              {selectedOrder.statut === "En attente" && (
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  <span style={{ fontSize: 11, padding: "6px 12px", borderRadius: 6, background: `${colors.accent}10`, color: colors.accent }}>
                    {t("orders.timeline.noInfo")}
                  </span>
                </div>
              )}

              {/* Escrow */}
              <EscrowStatus order={selectedOrder} onRelease={() => setSelectedOrder(null)} onDispute={() => setSelectedOrder(null)} />

              {/* Verification Point + Transport */}
              {(selectedOrder.verificationPointId || selectedOrder.transportOption) && (
                <div style={{
                  background: colors.statBg, borderRadius: 10, padding: "12px 14px",
                  marginBottom: 16, display: "grid", gap: 8,
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                }}>
                  {selectedOrder.verificationPointName && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <ShieldCheck size={14} color={colors.accent} weight="fill" />
                      <span style={{ fontSize: 12, color: colors.textMuted }}>{t("orders.modal.verificationPoint")}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: colors.text, marginLeft: "auto" }}>{selectedOrder.verificationPointName}</span>
                    </div>
                  )}
                  {selectedOrder.transportOption && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Truck size={14} color={colors.accent} />
                      <span style={{ fontSize: 12, color: colors.textMuted }}>{t("orders.modal.transport")}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: colors.text, marginLeft: "auto" }}>
                        {selectedOrder.transportOption === "hub" ? t("cart.transportHub") : t("cart.transportDoor")}
                      </span>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Cube size={14} color={colors.accent} />
                    <span style={{ fontSize: 12, color: colors.textMuted }}>{t("orders.modal.escrow")}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: colors.accent, marginLeft: "auto" }}>
                      {formatNumber(selectedOrder.escrowTotal || 0)} {t("common.currency")}
                    </span>
                  </div>
                </div>
              )}

              {/* Delivery Address (door delivery) */}
              {selectedOrder.deliveryAddress?.rue && (
                <div style={{
                  background: colors.statBg, borderRadius: 10, padding: "10px 14px",
                  marginBottom: 16, display: "flex", alignItems: "flex-start", gap: 6,
                }}>
                  <MapPinLine size={14} color={colors.accent} style={{ marginTop: 2, flexShrink: 0 }} />
                  <div style={{ fontSize: 12, color: colors.textSecondary, lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 600, color: colors.text }}>{selectedOrder.deliveryAddress.rue}</span>
                    , {selectedOrder.deliveryAddress.ville}
                    {selectedOrder.deliveryAddress.region && `, ${selectedOrder.deliveryAddress.region}`}
                    · {selectedOrder.deliveryAddress.phone}
                  </div>
                </div>
              )}

              {selectedOrder.statut === "En attente" && (
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  <Button variant="premium" size="sm" icon={<CheckCircle size={16} />}
                    onClick={() => confirmOrder(selectedOrder.id)}>
                    {t("orders.actions.confirm")}
                  </Button>
                  <Button variant="ghost" size="sm" icon={<X size={16} />}
                    onClick={() => cancelOrder(selectedOrder.id)}
                    style={{ color: "#dc2626", border: "1.5px solid rgba(220,38,38,0.2)" }}>
                    {t("orders.actions.cancel")}
                  </Button>
                </div>
              )}

              <ShipmentTracker
                orderId={selectedOrder.id}
                status={selectedOrder.statut}
                culture={selectedOrder.culture}
                lotId={selectedOrder.lot}
                destination={selectedOrder.livraison}
                quantity={selectedOrder.quantite}
              />

              {(selectedOrder.statut === "En livraison" || selectedOrder.statut === "Livrée") && (
                <div style={{ marginTop: 16 }}>
                  <OrderTrackingMap location={selectedOrder.livraison} status={selectedOrder.statut} />
                </div>
              )}

              {selectedOrder.statut === "Livrée" && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${colors.borderLight}` }}>
                  {existingReview ? (
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <Star size={16} color="#ffb300" weight="fill" />
                        <span style={{ fontWeight: 600, fontSize: 13, color: colors.text }}>{t("orders.feedback")}</span>
                      </div>
                      <div style={{ display: "flex", gap: 4 }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={16} color={s <= existingReview.rating ? "#ffb300" : colors.borderLight} weight={s <= existingReview.rating ? "fill" : "regular"} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" icon={<Star size={18} weight="fill" />}
                      onClick={() => setShowReviewForm(true)}
                      style={{ border: `1.5px solid ${colors.borderLight}` }}>
                      {t("orders.rate")}
                    </Button>
                  )}

                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${colors.borderLight}` }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <span style={{ fontSize: 13, color: colors.textSecondary }}>{t("follow.suggestion")}</span>
                      <FollowButton farmerId={selectedOrder.producteurId ?? ""} size="sm" />
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {notify.open && (
          <div style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 9999,
            background: notify.type === "confirmed" ? colors.success : "#dc2626",
            color: "white", padding: "14px 24px", borderRadius: 14,
            fontSize: 14, fontWeight: 500,
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            animation: "fadeSlideUp 0.3s ease",
            cursor: "pointer",
          }} onClick={() => setNotify({ open: false, message: "", type: "confirmed" })}>
            {notify.message}
          </div>
        )}
      </div>
    </FadeIn>
  );
}

export default Orders;
