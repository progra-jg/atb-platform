import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Package, CheckCircle, Truck, Buildings, MapPin,
  CalendarBlank, Clock, FileText, DownloadSimple,
  Circle, CaretRight, WarningCircle,
} from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { useIsMobile } from "../hooks/useMediaQuery";
import { fetchShipmentByOrder } from "../services/shipments";
import type { Milestone, ShipmentInfo } from "../types/shipment";
import { motion } from "framer-motion";

interface Props {
  orderId: string;
  status: string;
  culture: string;
  lotId: string;
  destination: string;
  quantity: string;
}

const MILESTONE_ICONS: Record<string, React.ElementType> = {
  package: Package, check: CheckCircle, truck: Truck, building: Buildings, "check-circle": CheckCircle,
};

const MILESTONE_COLORS: Record<string, string> = {
  collected: "#0a6e4a", quality: "#2563eb", transit: "#d97706",
  hub_arrival: "#7c3aed", delivery: "#059669",
};

function MilestoneIcon({
  icon,
  status,
  color,
}: {
  icon: string; status: "completed" | "active" | "pending"; color: string;
}) {
  const Icon = MILESTONE_ICONS[icon] || Circle;
  if (status === "completed") {
    return (
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        background: `linear-gradient(135deg, ${color}, ${color}88)`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        boxShadow: `0 2px 8px ${color}40`,
      }}>
        <Icon size={18} weight="fill" color="white" />
      </div>
    );
  }
  if (status === "active") {
    return (
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        background: `${color}18`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        border: `2px solid ${color}`,
        boxShadow: `0 0 0 4px ${color}15`,
        animation: "pulseGlow 2s ease-in-out infinite",
      }}>
        <Icon size={18} weight="fill" color={color} />
      </div>
    );
  }
  return (
    <div style={{
      width: 36, height: 36, borderRadius: "50%",
      background: "#f3f4f6",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      border: "2px solid #e5e7eb",
    }}>
      <Circle size={18} color="#9ca3af" />
    </div>
  );
}

function DocumentBadge({
  label,
  type,
  available,
}: {
  label: string; type: string; available: boolean;
}) {
  const { colors } = useTheme();
  const EXT_COLORS: Record<string, string> = { pdf: "#dc2626", image: "#2563eb", xls: "#059669" };
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "6px 10px", borderRadius: 8,
      background: available ? colors.accentLight : colors.statBg,
      border: `1px solid ${available ? `${colors.accent}30` : colors.borderLight}`,
      opacity: available ? 1 : 0.5,
      cursor: available ? "pointer" : "not-allowed",
      fontSize: 11, fontWeight: 500, color: available ? colors.text : colors.textMuted,
      transition: "all 0.15s",
    }}>
      <FileText size={12} color={available ? EXT_COLORS[type] || colors.accent : colors.textMuted} />
      <span>{label}</span>
      {available && <DownloadSimple size={11} color={colors.accent} style={{ marginLeft: "auto" }} />}
    </div>
  );
}

function StatusBadge({ status, eta }: { status: string; eta?: string }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const cfg: Record<string, { color: string; bg: string; icon: React.ElementType; label: string }> = {
    "En attente":     { color: "#d97706", bg: "#fffbeb", icon: Clock, label: t("orders.status.pending") },
    "Dépôt reçu":     { color: "#2563eb", bg: "#eff6ff", icon: CheckCircle, label: t("orders.status.depositReceived") },
    "Confirmée":      { color: "#059669", bg: "#ecfdf5", icon: CheckCircle, label: t("orders.status.depositReceived") },
    "En inspection":  { color: "#7c3aed", bg: "#f5f3ff", icon: Package, label: t("orders.status.inspection") },
    "En livraison":   { color: "#d97706", bg: "#fffbeb", icon: Truck, label: t("orders.status.inDelivery") },
    "Livrée":         { color: "#059669", bg: "#ecfdf5", icon: CheckCircle, label: t("orders.status.delivered") },
    "Prêt au hub":    { color: "#059669", bg: "#ecfdf5", icon: Buildings, label: t("orders.status.readyAtHub") },
  };
  const s = cfg[status] || { color: colors.textMuted, bg: colors.statBg, icon: Clock, label: status };
  const Icon = s.icon;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "6px 12px", borderRadius: 10,
      background: s.bg, color: s.color, fontSize: 12, fontWeight: 600,
      border: `1px solid ${s.color}25`,
    }}>
      <Icon size={14} weight="fill" />
      <span>{s.label}</span>
      {eta && status === "En livraison" && (
        <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.75 }}>
          · {t("tracking.arriving")}: {eta}
        </span>
      )}
    </div>
  );
}

export default function ShipmentTracker({ orderId, status, culture, lotId, destination, quantity }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isMobile = useIsMobile();

  const { data: shipment, isLoading } = useQuery({
    queryKey: ["shipment", orderId],
    queryFn: () => fetchShipmentByOrder(orderId, status, culture, lotId, destination, quantity),
    refetchInterval: status === "En livraison" ? 8000 : 30000,
  });

  if (isLoading) {
    return (
      <div style={{
        padding: 20, textAlign: "center",
        background: colors.statBg, borderRadius: 14,
        fontSize: 12, color: colors.textMuted,
      }}>
        {t("common.loading")}
      </div>
    );
  }

  if (!shipment) return null;

  const renderMilestone = (m: Milestone, idx: number, arr: Milestone[]) => {
    const isLast = idx === arr.length - 1;
    const color = MILESTONE_COLORS[m.id] || colors.accent;
    return (
      <motion.div
        key={m.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.07 }}
        style={{ display: "flex", gap: 14, position: "relative", paddingBottom: isLast ? 0 : 20 }}
      >
        {/* Vertical connector line */}
        {!isLast && (
          <div style={{
            position: "absolute", left: 17, top: 36, width: 2,
            height: "calc(100% - 16px)",
            background: m.status === "completed" ? color : colors.borderLight,
            opacity: m.status === "completed" ? 0.6 : 0.4,
          }} />
        )}
        <MilestoneIcon icon={m.icon} status={m.status} color={color} />
        <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "flex-start", gap: 8,
          }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: m.status === "pending" ? colors.textMuted : colors.text }}>
              {t(m.titleKey)}
            </div>
            <div style={{
              fontSize: 10, color: colors.textMuted, whiteSpace: "nowrap",
              display: "flex", alignItems: "center", gap: 3,
            }}>
              <CalendarBlank size={10} />
              {m.date}
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: colors.textSecondary, marginTop: 1 }}>
            {t(m.descKey)}
          </div>
          {m.location && m.location !== "—" && (
            <div style={{
              fontSize: 10, color: colors.textMuted, marginTop: 3,
              display: "flex", alignItems: "center", gap: 3,
            }}>
              <MapPin size={10} />
              {m.location}
            </div>
          )}
          {m.status === "active" && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              marginTop: 6, padding: "2px 8px", borderRadius: 6,
              background: `${color}15`, color, fontSize: 10, fontWeight: 600,
            }}>
              <Clock size={10} weight="fill" />
              {t("tracking.stepActive")}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const DOC_ICONS: Record<string, React.ElementType> = {
    pdf: FileText, image: Package, xls: FileText,
  };

  return (
    <div>
      {/* Header: Status + Progress */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        gap: 12, marginBottom: 16, flexWrap: "wrap",
      }}>
        <StatusBadge status={shipment.status} eta={shipment.estimatedDelivery} />
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 11, color: colors.textMuted,
        }}>
          <Clock size={12} />
          {shipment.completedSteps}/{shipment.totalSteps} {t("orders.timeline.title").toLowerCase()}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        width: "100%", height: 4, borderRadius: 2,
        background: colors.borderLight, marginBottom: 20, overflow: "hidden",
      }}>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: shipment.completedSteps / shipment.totalSteps }}
          style={{
            height: "100%", borderRadius: 2,
            background: `linear-gradient(90deg, ${colors.accent}, #34d399)`,
            transformOrigin: "left",
          }}
        />
      </div>

      {/* Info cards */}
      <div style={{
        display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
        gap: 8, marginBottom: 20,
      }}>
        {[
          { icon: MapPin, label: t("detail.offerOrigin") || t("detail.contact"), value: shipment.origin },
          { icon: MapPin, label: t("detail.offerDestination") || t("detail.destination"), value: destination },
          { icon: CalendarBlank, label: t("detail.estimatedDelivery") || t("detail.estimatedDelivery"), value: shipment.estimatedDelivery },
          { icon: Package, label: t("detail.totalVolume") || t("detail.totalVolume"), value: quantity },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            style={{
              background: colors.statBg, borderRadius: 10, padding: "10px 12px",
              border: `1px solid ${colors.borderLight}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
              <item.icon size={11} color={colors.textMuted} />
              <span style={{ fontSize: 9, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.3px" }}>{item.label}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{item.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Driver info (in transit) */}
      {shipment.driver && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 14px", background: `${colors.accent}08`,
            borderRadius: 12, border: `1px solid ${colors.accent}20`,
            marginBottom: 16, overflow: "hidden",
          }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: "50%",
            background: `linear-gradient(135deg, ${colors.accent}, #34d399)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 700, color: "white", flexShrink: 0,
          }}>
            {shipment.driver.name.charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0, fontSize: 12 }}>
            <div style={{ fontWeight: 600, color: colors.text }}>{shipment.driver.name}</div>
            <div style={{ color: colors.textMuted, fontSize: 11 }}>{shipment.driver.vehicle}</div>
            <div style={{ color: colors.accent, fontWeight: 600, fontSize: 11, marginTop: 1 }}>{shipment.driver.phone}</div>
          </div>
          <Truck size={24} color={colors.accent} weight="fill" style={{ opacity: 0.3 }} />
        </motion.div>
      )}

      {/* Milestones timeline */}
      <div style={{
        background: colors.surface, borderRadius: 14,
        border: `1px solid ${colors.borderLight}`,
        padding: isMobile ? 16 : 20, marginBottom: 16,
        boxShadow: colors.shadowXs,
      }}>
        <h4 style={{
          fontSize: 12, fontWeight: 700, color: colors.text, margin: "0 0 16px",
          textTransform: "uppercase", letterSpacing: "0.5px",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <Clock size={14} />
          {t("orders.timeline.title")}
        </h4>
        {shipment.milestones.map((m, idx, arr) => renderMilestone(m, idx, arr))}
      </div>

      {/* Documents */}
      {shipment.documents.length > 0 && (
        <div>
          <h4 style={{
            fontSize: 12, fontWeight: 700, color: colors.text, margin: "0 0 10px",
            textTransform: "uppercase", letterSpacing: "0.5px",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <FileText size={14} />
            {t("tracking.documents.packingList")}
          </h4>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {shipment.documents.map((doc, idx) => (
              <DocumentBadge
                key={idx}
                label={t(doc.label)}
                type={doc.type}
                available={doc.available}
              />
            ))}
          </div>
          {shipment.documents.every((d) => !d.available) && (
            <div style={{
              fontSize: 11, color: colors.textMuted, marginTop: 6,
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <WarningCircle size={12} />
              {t("common.noResults")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
