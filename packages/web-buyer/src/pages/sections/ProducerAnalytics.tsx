import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  ChartBar, ArrowLeft, Package, CurrencyCircleDollar, TrendUp, SealCheck,
  CaretUp, CaretDown,
} from "@phosphor-icons/react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { fetchOrders } from "../../services/orders";
import { getAllFarmerLots } from "../../services/farmerLots";
import { formatNumber } from "../../utils/format";
import type { Lot, Order } from "../../types";

const MONTHS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

function parseMonth(dateStr: string): number {
  const parts = dateStr.split("/");
  return parseInt(parts[1], 10) - 1;
}

function Bar({ h, color, label, value }: { h: number; color: string; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 10, color: colors.textMuted, width: 28, textAlign: "right", flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 20, background: colors.surfaceHover, borderRadius: 4, overflow: "hidden", position: "relative" }}>
        <div style={{ width: `${Math.min(h, 100)}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color: colors.text, width: 60, textAlign: "right", flexShrink: 0 }}>{value}</span>
    </div>
  );
}

function MiniCard({ icon: Icon, value, label, color }: { icon: React.ElementType; value: string; label: string; color: string }) {
  const { colors } = useTheme();
  return (
    <div style={{ background: colors.surfaceHover, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
      <Icon size={18} color={color} weight="fill" style={{ marginBottom: 6 }} />
      <div style={{ fontSize: 20, fontWeight: 700, color: colors.text }}>{value}</div>
      <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default function ProducerAnalytics() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: orders = [] } = useQuery({ queryKey: ["orders"], queryFn: () => fetchOrders() });
  const myOrders = useMemo(() => (orders as Order[]).filter((o: Order) => o.producteurId === user?.id), [orders, user?.id]);

  const myLots = useMemo(() => getAllFarmerLots().filter((l: Lot) => l.producteurId === user?.id), [user?.id]);

  const stats = useMemo(() => {
    const totalLots = myLots.length;
    const activeLots = myLots.filter((l) => l.statut === "Disponible").length;
    const totalOrders = myOrders.length;
    const deliveredOrders = myOrders.filter((o) => o.statut === "Livrée").length;
    const revenue = myOrders.reduce((sum, o) => sum + (o.escrowDeposit ?? 0), 0);
    const fulfillmentRate = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;
    return { totalLots, activeLots, totalOrders, deliveredOrders, revenue, fulfillmentRate };
  }, [myLots, myOrders]);

  const revenueByMonth = useMemo(() => {
    const buckets = new Array(12).fill(0);
    for (const o of myOrders) {
      if (o.date) {
        const m = parseMonth(o.date);
        if (m >= 0 && m < 12) buckets[m] += o.escrowDeposit ?? 0;
      }
    }
    const max = Math.max(...buckets, 1);
    return buckets.map((v) => ({ value: v, pct: max > 0 ? (v / max) * 100 : 0 }));
  }, [myOrders]);

  const ordersByMonth = useMemo(() => {
    const buckets = new Array(12).fill(0);
    for (const o of myOrders) {
      if (o.date) {
        const m = parseMonth(o.date);
        if (m >= 0 && m < 12) buckets[m]++;
      }
    }
    const max = Math.max(...buckets, 1);
    return buckets.map((v) => ({ value: v, pct: max > 0 ? (v / max) * 100 : 0 }));
  }, [myOrders]);

  const topCultures = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of myOrders) {
      counts[o.culture] = (counts[o.culture] || 0) + 1;
    }
    const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 5);
    const max = sorted.length > 0 ? sorted[0][1] : 1;
    return sorted.map(([culture, count]) => ({ culture, count, pct: (count / max) * 100 }));
  }, [myOrders]);

  const currentMonth = new Date().getMonth();
  const displayMonths = revenueByMonth.slice(Math.max(0, currentMonth - 5), currentMonth + 1);
  const displayLabels = MONTHS.slice(Math.max(0, currentMonth - 5), currentMonth + 1);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div onClick={() => navigate("/producer")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: colors.textSecondary, fontSize: 12 }}>
          <ArrowLeft size={14} />
          <span>{t("common.back")}</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <ChartBar size={18} color={colors.info} weight="bold" />
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.text }}>
          {t("producer.analytics")}
        </h2>
      </div>

      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
        <MiniCard icon={Package} value={String(stats.totalLots)} label={t("producer.total")} color={colors.accent} />
        <MiniCard icon={TrendUp} value={String(stats.totalOrders)} label={t("producer.orders")} color={colors.warning} />
        <MiniCard icon={SealCheck} value={`${stats.fulfillmentRate}%`} label={t("producer.fulfillmentRate")} color={colors.success} />
        <MiniCard icon={CurrencyCircleDollar} value={`${formatNumber(stats.revenue)}`} label={t("producer.revenue")} color={colors.info} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Revenue chart */}
        <div style={{ background: colors.surface, borderRadius: 14, border: `1px solid ${colors.borderLight}`, padding: 16 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 600, color: colors.text, display: "flex", alignItems: "center", gap: 6 }}>
            <CurrencyCircleDollar size={14} color={colors.accent} />
            {t("producer.revenueTrend")}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {displayMonths.map((m, i) => (
              <Bar key={i} h={m.pct} color={colors.accent} label={displayLabels[i]} value={`${formatNumber(m.value)}`} />
            ))}
          </div>
        </div>

        {/* Orders chart */}
        <div style={{ background: colors.surface, borderRadius: 14, border: `1px solid ${colors.borderLight}`, padding: 16 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 600, color: colors.text, display: "flex", alignItems: "center", gap: 6 }}>
            <TrendUp size={14} color={colors.warning} />
            {t("producer.ordersTrend")}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {ordersByMonth.slice(Math.max(0, currentMonth - 5), currentMonth + 1).map((m, i) => (
              <Bar key={i} h={m.pct} color={colors.warning} label={displayLabels[i]} value={String(m.value)} />
            ))}
          </div>
        </div>

        {/* Top cultures */}
        {topCultures.length > 0 && (
          <div style={{ background: colors.surface, borderRadius: 14, border: `1px solid ${colors.borderLight}`, padding: 16 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 600, color: colors.text, display: "flex", alignItems: "center", gap: 6 }}>
              <Package size={14} color={colors.info} />
              {t("producer.topCultures")}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {topCultures.map((c) => (
                <Bar key={c.culture} h={c.pct} color={colors.info} label={c.culture} value={String(c.count)} />
              ))}
            </div>
          </div>
        )}

        {/* Lot status distribution */}
        <div style={{ background: colors.surface, borderRadius: 14, border: `1px solid ${colors.borderLight}`, padding: 16 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 600, color: colors.text, display: "flex", alignItems: "center", gap: 6 }}>
            <Package size={14} color={colors.success} />
            {t("producer.lotDistribution")}
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { status: "Disponible" as const, color: colors.success },
              { status: "En transit" as const, color: colors.warning },
              { status: "Vendu" as const, color: colors.info },
            ].map((s) => {
              const count = myLots.filter((l) => l.statut === s.status).length;
              const pct = myLots.length > 0 ? (count / myLots.length) * 100 : 0;
              return <Bar key={s.status} h={pct} color={s.color} label={t("lotStatus." + s.status, s.status)} value={String(count)} />;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
