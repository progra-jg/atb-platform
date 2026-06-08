import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Package, MapPin, Calendar, Truck } from "@phosphor-icons/react";
import type { LogisticsShipment } from "../types/logistics";
import { SHIPMENT_STATUS_LABELS } from "../types/logistics";

interface Props {
  shipment: LogisticsShipment;
  onClick: () => void;
}

const STATUS_STYLES: Record<string, string> = {
  preparing: "bg-amber-100 text-amber-700",
  picked_up: "bg-blue-100 text-blue-700",
  in_transit: "bg-indigo-100 text-indigo-700",
  customs: "bg-purple-100 text-purple-700",
  arrived: "bg-emerald-100 text-emerald-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

export default function LogisticsShipmentCard({ shipment, onClick }: Props) {
  const { t } = useTranslation();
  const lastEvent = shipment.trackingEvents[shipment.trackingEvents.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.005 }}
      onClick={onClick}
      className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:border-emerald-200 hover:shadow-md transition-all"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center flex-shrink-0">
        <Package size={18} className="text-emerald-600" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800 truncate">{shipment.crop}</span>
          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_STYLES[shipment.status] ?? ""}`}>
            {t(SHIPMENT_STATUS_LABELS[shipment.status])}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
          <span className="flex items-center gap-0.5">
            <MapPin size={10} />
            {shipment.origin} → {shipment.destination}
          </span>
          <span className="flex items-center gap-0.5">
            <Truck size={10} />
            {shipment.distanceKm} km
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-gray-400">
          <span className="flex items-center gap-0.5">
            <Calendar size={10} />
            {new Date(shipment.estimatedDelivery).toLocaleDateString("fr-FR")}
          </span>
          <span className="font-medium text-gray-600">
            {shipment.estimatedCost.toLocaleString("fr-FR")} FCFA
          </span>
        </div>
      </div>

      <motion.div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0" whileHover={{ x: 3 }}>
        <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
          <path d="M1 1L6 6L1 11" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </motion.div>
    </motion.div>
  );
}
