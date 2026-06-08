import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { confirmDelivery } from "../services/logistics";
import type { LogisticsShipment } from "../types/logistics";
import { CheckCircle, Copy, ArrowRight } from "@phosphor-icons/react";

interface Props {
  shipment: LogisticsShipment;
  onConfirmed: (shipment: LogisticsShipment) => void;
}

function generateQRPattern(code: string): string {
  const n = 11;
  const cells: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));
  const hash = (s: string, i: number, j: number) => {
    let h = 0;
    const str = s + i + j;
    for (let k = 0; k < str.length; k++) {
      h = ((h << 5) - h) + str.charCodeAt(k);
      h |= 0;
    }
    return h;
  };
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const isBorder = i === 0 || i === n - 1 || j === 0 || j === n - 1;
      const isCorner = (i < 4 && j < 4) || (i < 4 && j >= n - 4) || (i >= n - 4 && j < 4);
      cells[i][j] = isBorder || (hash(code, i, j) % 3 === 0 && !isCorner);
    }
  }
  cells[0][0] = true; cells[0][n - 1] = true; cells[n - 1][0] = true;
  return cells.map((row) => row.map((c) => c ? "1" : "0").join("")).join("");
}

export default function DeliveryQRCode({ shipment, onConfirmed }: Props) {
  const { t } = useTranslation();
  const [inputCode, setInputCode] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const pattern = generateQRPattern(shipment.deliveryCode);

  const handleConfirm = async () => {
    if (!inputCode.trim()) return;
    setConfirming(true);
    setError("");
    try {
      const updated = await confirmDelivery(shipment.id, inputCode.trim(), "Destinataire");
      onConfirmed(updated);
    } catch {
      setError(t("logistics.qr.invalidCode"));
    } finally {
      setConfirming(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shipment.deliveryCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (shipment.deliveryConfirmed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center"
      >
        <div className="w-12 h-12 mx-auto mb-2 bg-emerald-100 rounded-full flex items-center justify-center">
          <CheckCircle size={24} className="text-emerald-600" weight="fill" />
        </div>
        <p className="text-sm font-semibold text-emerald-800">{t("logistics.qr.confirmed")}</p>
        <p className="text-[11px] text-emerald-600 mt-1">
          {t("logistics.qr.confirmedBy")} {shipment.confirmedBy}
        </p>
        {shipment.confirmedAt && (
          <p className="text-[10px] text-emerald-400 mt-0.5">
            {new Date(shipment.confirmedAt).toLocaleString("fr-FR")}
          </p>
        )}
      </motion.div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-xl border border-gray-200">
      <h4 className="text-xs font-semibold text-gray-700 mb-3 text-center">{t("logistics.qr.title")}</h4>

      <div className="flex justify-center mb-3">
        <div className="p-2 bg-white rounded-xl border-2 border-gray-200">
          <svg width="120" height="120" viewBox="0 0 11 11" shapeRendering="crispEdges">
            {pattern.split("").map((c, i) => {
              if (c !== "1") return null;
              const x = i % 11;
              const y = Math.floor(i / 11);
              return <rect key={i} x={x} y={y} width={1} height={1} fill="#059669" />;
            })}
          </svg>
        </div>
      </div>

      <div className="text-center mb-3">
        <p className="text-lg font-bold tracking-widest text-gray-800 font-mono">{shipment.deliveryCode}</p>
        <motion.button
          onClick={handleCopy}
          className="text-[10px] text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 mx-auto mt-0.5"
          whileTap={{ scale: 0.95 }}
        >
          <Copy size={10} />
          {copied ? t("common.copied") : t("common.copy")}
        </motion.button>
      </div>

      <div className="flex gap-2">
        <input
          value={inputCode}
          onChange={(e) => { setInputCode(e.target.value.toUpperCase()); setError(""); }}
          placeholder={t("logistics.qr.placeholder")}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 uppercase text-center tracking-wider font-mono"
          maxLength={9}
        />
        <motion.button
          onClick={handleConfirm}
          disabled={confirming || !inputCode.trim()}
          className="px-3 py-2 bg-emerald-500 text-white rounded-lg disabled:opacity-30 transition-colors"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {confirming ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
          ) : (
            <ArrowRight size={16} weight="bold" />
          )}
        </motion.button>
      </div>
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
    </div>
  );
}
