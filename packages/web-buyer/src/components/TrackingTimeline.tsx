import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { TrackingEvent, ShipmentStatus } from "../types/logistics";
import { SHIPMENT_STATUS_LABELS } from "../types/logistics";
import { CheckCircle, Circle, Package, Truck, Airplane, ShippingContainer, MapPin } from "@phosphor-icons/react";

interface Props {
  events: TrackingEvent[];
}

const STATUS_ORDER: ShipmentStatus[] = [
  "preparing", "picked_up", "in_transit", "customs", "arrived", "delivered",
];

const STATUS_ICONS: Record<string, React.ElementType> = {
  preparing: Package,
  picked_up: Truck,
  in_transit: Airplane,
  customs: ShippingContainer,
  arrived: MapPin,
  delivered: CheckCircle,
};

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function TrackingTimeline({ events }: Props) {
  const { t } = useTranslation();

  const sorted = [...events].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const completedStatuses = new Set(sorted.map((e) => e.status));
  const currentIdx = STATUS_ORDER.findIndex((s) => !completedStatuses.has(s));
  const activeIdx = currentIdx >= 0 ? currentIdx : STATUS_ORDER.length;

  return (
    <div className="relative">
      {STATUS_ORDER.map((status, idx) => {
        const isCompleted = completedStatuses.has(status);
        const isActive = idx === activeIdx;
        const event = sorted.find((e) => e.status === status);
        const Icon = STATUS_ICONS[status] ?? Circle;

        return (
          <div key={status} className="flex gap-3">
            <div className="flex flex-col items-center w-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.1, type: "spring" }}
                className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                  isCompleted
                    ? "bg-emerald-500 text-white"
                    : isActive
                    ? "bg-emerald-100 text-emerald-600 border-2 border-emerald-400"
                    : "bg-gray-100 text-gray-300"
                }`}
              >
                <Icon size={14} weight={isCompleted ? "fill" : "regular"} />
              </motion.div>
              {idx < STATUS_ORDER.length - 1 && (
                <div className={`w-0.5 flex-1 min-h-[24px] ${
                  isCompleted ? "bg-emerald-300" : "bg-gray-200"
                }`} />
              )}
            </div>

            <div className={`flex-1 pb-5 ${idx === STATUS_ORDER.length - 1 ? "pb-0" : ""}`}>
              <div className={`p-2.5 rounded-lg border ${
                isCompleted
                  ? "bg-emerald-50 border-emerald-200"
                  : isActive
                  ? "bg-amber-50 border-amber-200"
                  : "bg-gray-50 border-gray-100"
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${
                    isCompleted ? "text-emerald-700" : isActive ? "text-amber-700" : "text-gray-400"
                  }`}>
                    {t(SHIPMENT_STATUS_LABELS[status])}
                  </span>
                  {event && (
                    <span className="text-[9px] text-gray-400">{formatDateTime(event.timestamp)}</span>
                  )}
                </div>
                {event && (
                  <div className="mt-1">
                    <p className="text-[11px] text-gray-600">{event.description}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">{event.location}</p>
                  </div>
                )}
                {isActive && !event && (
                  <p className="text-[11px] text-amber-600 italic mt-1">
                    {t("logistics.timeline.pending")}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
