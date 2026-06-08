import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ShieldCheck, LockKey, LockSimpleOpen, Warning, CheckCircle,
} from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import {
  getEscrow, releaseEscrow, disputeEscrow,
} from "../services/escrow";
import type { Order, OrderStatus } from "../types";
import { formatNumber } from "../utils/format";

interface Props {
  order: Order;
  onRelease?: () => void;
  onDispute?: () => void;
}

const STEP_STATUS_ORDER: OrderStatus[] = [
  "En attente",
  "Dépôt reçu",
  "Confirmée",
  "En inspection",
  "Prêt au hub",
  "En livraison",
  "Livrée",
];

export default function EscrowStatus({ order, onRelease, onDispute }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const escrow = useMemo(() => getEscrow(order.id), [order.id]);
  const isProducer = user?.id === order.producteurId;
  const isBuyer = user?.id === order.buyerId;

  const progress = useMemo(() => {
    const idx = STEP_STATUS_ORDER.indexOf(order.statut);
    return idx >= 0 ? Math.round((idx / (STEP_STATUS_ORDER.length - 1)) * 100) : 0;
  }, [order.statut]);

  const canRelease = isProducer && escrow?.status === "held" && order.statut === "Livrée";
  const canDispute = (isBuyer || isProducer) && escrow?.status === "held" && order.statut !== "En attente";

  if (!order.escrowDeposit && !escrow) return null;

  const depositAmount = order.escrowDeposit || 0;
  const totalAmount = order.escrowTotal || 0;
  const isReleased = escrow?.status === "released";
  const isDisputed = escrow?.status === "disputed";
  const isHeld = escrow?.status === "held";

  const handleRelease = () => {
    if (!window.confirm(t("escrow.confirmRelease"))) return;
    releaseEscrow(order.id);
    onRelease?.();
  };

  const handleDispute = () => {
    if (!window.confirm(t("escrow.confirmDispute"))) return;
    disputeEscrow(order.id);
    onDispute?.();
  };

  return (
    <div style={{
      background: `linear-gradient(135deg, ${colors.success}06, ${colors.accent}04)`,
      borderRadius: 12, border: `1px solid ${colors.borderLight}`,
      padding: 16, marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <ShieldCheck size={18} color={isDisputed ? colors.error : isReleased ? colors.success : colors.accent} weight="fill" />
        <span style={{ fontSize: 13, fontWeight: 700, color: colors.text, flex: 1 }}>
          {t("escrow.title")}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
          background: isDisputed ? `${colors.error}15` : isReleased ? `${colors.success}15` : `${colors.accent}15`,
          color: isDisputed ? colors.error : isReleased ? colors.success : colors.accent,
        }}>
          {isDisputed ? t("escrow.disputed") : isReleased ? t("escrow.released") : t("escrow.secured")}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        <div style={{ background: colors.surface, borderRadius: 8, padding: "8px 12px" }}>
          <div style={{ fontSize: 10, color: colors.textMuted }}>{t("escrow.deposit")}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>
            {formatNumber(depositAmount)} FCFA
          </div>
        </div>
        <div style={{ background: colors.surface, borderRadius: 8, padding: "8px 12px" }}>
          <div style={{ fontSize: 10, color: colors.textMuted }}>{t("escrow.total")}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: colors.accent }}>
            {formatNumber(totalAmount)} FCFA
          </div>
        </div>
      </div>

      {!isReleased && !isDisputed && (
        <>
          <div style={{ position: "relative", height: 6, background: colors.borderLight, borderRadius: 3, marginBottom: 8 }}>
            <div style={{
              position: "absolute", left: 0, top: 0, height: "100%",
              width: `${progress}%`, borderRadius: 3,
              background: `linear-gradient(90deg, ${colors.accent}, ${colors.success})`,
              transition: "width 0.5s ease",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: colors.textMuted, marginBottom: 12 }}>
            <span>{t("escrow.deposited")}</span>
            <span>{t("escrow.releaseReady")}</span>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {canRelease && (
              <button onClick={handleRelease} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 8, border: "none",
                background: colors.success, color: "#fff",
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>
                <LockSimpleOpen size={14} weight="bold" />
                {t("escrow.releaseFunds")}
              </button>
            )}
            {canDispute && (
              <button onClick={handleDispute} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 8,
                border: `1.5px solid ${colors.error}30`, background: "transparent",
                color: colors.error, fontSize: 12, fontWeight: 500, cursor: "pointer",
              }}>
                <Warning size={14} />
                {t("escrow.dispute")}
              </button>
            )}
          </div>
        </>
      )}

      {isReleased && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: `${colors.success}10`, borderRadius: 8 }}>
          <CheckCircle size={16} color={colors.success} weight="fill" />
          <span style={{ fontSize: 12, color: colors.success, fontWeight: 600 }}>
            {t("escrow.releasedOn")} {escrow?.releasedAt ? new Date(escrow.releasedAt).toLocaleDateString() : "—"}
          </span>
        </div>
      )}

      {isDisputed && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", background: `${colors.error}10`, borderRadius: 8 }}>
          <Warning size={16} color={colors.error} weight="fill" />
          <span style={{ fontSize: 12, color: colors.error, fontWeight: 600 }}>
            {t("escrow.disputeActive")}
          </span>
        </div>
      )}
    </div>
  );
}
