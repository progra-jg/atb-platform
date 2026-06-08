import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  CheckCircle, Clock, Package, Truck, SealCheck, CurrencyCircleDollar,
} from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import type { OrderStatus } from "../types";

interface StepDef {
  key: string;
  labelKey: string;
  icon: React.ElementType;
  matchStatus: OrderStatus[];
}

const STEPS: StepDef[] = [
  { key: "submitted", labelKey: "orders.timeline.submitted", icon: Clock, matchStatus: ["En attente"] },
  { key: "accepted", labelKey: "orders.timeline.accepted", icon: CheckCircle, matchStatus: ["Dépôt reçu", "Confirmée"] },
  { key: "prepared", labelKey: "orders.timeline.prepared", icon: Package, matchStatus: ["En inspection", "Prêt au hub"] },
  { key: "shipped", labelKey: "orders.timeline.shipped", icon: Truck, matchStatus: ["En livraison"] },
  { key: "delivered", labelKey: "orders.timeline.delivered", icon: SealCheck, matchStatus: ["Livrée"] },
  { key: "paid", labelKey: "orders.timeline.paid", icon: CurrencyCircleDollar, matchStatus: [] },
];

interface Props {
  status: OrderStatus;
}

export default function OrderStatusTimeline({ status }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const currentIdx = useMemo(() => {
    const idx = STEPS.findIndex((s) => s.matchStatus.includes(status));
    return idx >= 0 ? idx : 0;
  }, [status]);

  return (
    <div style={{ padding: "16px 0" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative", paddingLeft: 28 }}>
        {STEPS.map((step, i) => {
          const isCompleted = i < currentIdx;
          const isActive = i === currentIdx;
          const isPending = i > currentIdx;
          const Icon = step.icon;
          const dotColor = isCompleted ? colors.success : isActive ? colors.accent : colors.borderLight;
          const textColor = isCompleted ? colors.success : isActive ? colors.text : colors.textMuted;
          const bgColor = isCompleted ? colors.success : isActive ? colors.accent : colors.borderLight;

          return (
            <div key={step.key} style={{ position: "relative", paddingBottom: i < STEPS.length - 1 ? 0 : 0 }}>
              <div style={{
                position: "absolute", left: -28, top: 8,
                width: 24, height: 24, borderRadius: 12,
                background: bgColor, display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", zIndex: 1,
                boxShadow: isActive ? `0 0 0 4px ${colors.accent}18` : "none",
                transition: "all 0.3s",
              }}>
                <Icon size={13} weight="bold" />
              </div>
              {i < STEPS.length - 1 && (
                <div style={{
                  position: "absolute", left: -17, top: 34,
                  width: 2, height: "calc(100% - 4px)",
                  background: isCompleted ? colors.success : colors.borderLight,
                  opacity: isCompleted ? 0.5 : 1,
                }} />
              )}
              <div style={{
                padding: "8px 12px", marginBottom: 0,
                borderRadius: 8,
                background: isActive ? `${colors.accent}06` : "transparent",
                borderLeft: `3px solid ${isActive ? colors.accent : "transparent"}`,
                transition: "all 0.2s",
              }}>
                <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: textColor, display: "flex", alignItems: "center", gap: 6 }}>
                  {t(step.labelKey)}
                  {isActive && (
                    <span style={{ fontSize: 9, fontWeight: 600, color: colors.accent, background: `${colors.accent}12`, padding: "1px 6px", borderRadius: 4 }}>
                      {t("orders.timeline.current")}
                    </span>
                  )}
                  {isCompleted && <CheckCircle size={12} weight="fill" color={colors.success} />}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
