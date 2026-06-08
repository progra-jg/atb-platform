import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import LogisticsShipmentCard from "../components/LogisticsShipmentCard";
import TrackingTimeline from "../components/TrackingTimeline";
import TransportCostCalculator from "../components/TransportCostCalculator";
import DeliveryQRCode from "../components/DeliveryQRCode";
import { listShipments, addTrackingEvent } from "../services/logistics";
import type { LogisticsShipment, TrackingEvent, TransportCostEstimate } from "../types/logistics";
import { Truck, Plus, Package, MapPin, ArrowLeft } from "@phosphor-icons/react";

type TabKey = "tracking" | "calculator";

export default function LogisticsPage() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [shipments, setShipments] = useState<LogisticsShipment[]>([]);
  const [selected, setSelected] = useState<LogisticsShipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("tracking");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await listShipments();
        if (mounted) setShipments(s);
      } catch {
        /* noop */
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleSimulateEvent = async (status: string) => {
    if (!selected) return;
    try {
      const locations: Record<string, string> = {
        picked_up: selected.origin,
        in_transit: "En transit",
        customs: "Port de Cotonou",
        arrived: selected.destination,
      };
      const updated = await addTrackingEvent(
        selected.id,
        status as any,
        locations[status] ?? selected.origin,
        `Statut mis à jour vers ${status}`,
        "Système",
      );
      setSelected(updated);
      setShipments((prev) => prev.map((s) => s.id === updated.id ? updated : s));
    } catch {
      /* noop */
    }
  };

  const handleDeliveryConfirmed = (updated: LogisticsShipment) => {
    setSelected(updated);
    setShipments((prev) => prev.map((s) => s.id === updated.id ? updated : s));
  };

  if (selected) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px 60px" }}>
        <motion.button
          onClick={() => setSelected(null)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 mb-4 transition-colors"
          whileHover={{ x: -2 }}
        >
          <ArrowLeft size={14} />
          {t("common.back")}
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-800">{selected.crop}</h2>
                <span className="text-xs text-gray-400 font-mono">{selected.id}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-gray-600">
                <div><span className="text-gray-400">{t("logistics.shipment.origin")}:</span> {selected.origin}</div>
                <div><span className="text-gray-400">{t("logistics.shipment.destination")}:</span> {selected.destination}</div>
                <div><span className="text-gray-400">{t("logistics.calculator.volume")}:</span> {selected.volumeKg.toLocaleString("fr-FR")} kg</div>
                <div><span className="text-gray-400">{t("logistics.shipment.cost")}:</span> {selected.estimatedCost.toLocaleString("fr-FR")} FCFA</div>
              </div>
              <TrackingTimeline events={selected.trackingEvents} />
            </div>

            {selected.status !== "delivered" && selected.status !== "cancelled" && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-xs font-semibold text-gray-600 mb-2">{t("logistics.shipment.simulate")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {["picked_up", "in_transit", "customs", "arrived"].filter((s) => {
                    const order = ["preparing", "picked_up", "in_transit", "customs", "arrived"];
                    const currentIdx = order.indexOf(selected.status);
                    const nextIdx = order.indexOf(s);
                    return nextIdx > currentIdx;
                  }).map((s) => (
                    <motion.button
                      key={s}
                      onClick={() => handleSimulateEvent(s)}
                      className="px-2.5 py-1 text-[10px] font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {t(`logistics.status.${s}`)}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <DeliveryQRCode shipment={selected} onConfirmed={handleDeliveryConfirmed} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px 60px" }}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <Truck size={20} color="#fff" weight="bold" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: colors.text }}>{t("logistics.pageTitle")}</h1>
            <p style={{ fontSize: 12, color: colors.textMuted }}>{t("logistics.pageDesc")}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          {(["tracking", "calculator"] as TabKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                tab === key ? "bg-emerald-100 text-emerald-800" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {t(`logistics.tab.${key}`)}
            </button>
          ))}
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {tab === "tracking" && (
          <motion.div key="tracking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {loading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-32" />
                      <div className="h-3 bg-gray-100 rounded w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : shipments.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Package size={24} className="text-emerald-300" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">{t("logistics.empty.title")}</p>
                <p className="text-xs text-gray-400">{t("logistics.empty.desc")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {shipments.map((s) => (
                    <LogisticsShipmentCard key={s.id} shipment={s} onClick={() => setSelected(s)} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {tab === "calculator" && (
          <motion.div key="calculator" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TransportCostCalculator onEstimate={() => {}} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
