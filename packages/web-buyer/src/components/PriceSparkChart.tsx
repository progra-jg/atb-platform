import { motion } from "framer-motion";

interface Props {
  offerPrice: number;
  marketPrice: number;
  suggestedPrice?: number;
  height?: number;
}

export default function PriceSparkChart({ offerPrice, marketPrice, suggestedPrice, height = 60 }: Props) {
  const max = Math.max(offerPrice, marketPrice, suggestedPrice ?? 0) * 1.15;
  const w = 120;

  const offerX = 10;
  const marketX = 60;
  const suggestX = 110;

  const toY = (v: number) => height - 8 - ((v / max) * (height - 16));

  const offerY = toY(offerPrice);
  const marketY = toY(marketPrice);
  const suggestY = suggestedPrice != null ? toY(suggestedPrice) : 0;

  return (
    <svg width={w} height={height} className="overflow-visible">
      <line x1={0} y1={height - 8} x2={w} y2={height - 8} stroke="#e5e7eb" strokeWidth={1} />
      <line x1={offerX} y1={height - 8} x2={offerX} y2={4} stroke="#e5e7eb" strokeWidth={0.5} strokeDasharray="2,2" />

      <motion.circle
        cx={offerX} cy={offerY} r={4}
        fill="#10b981"
        initial={{ r: 0 }}
        animate={{ r: 4 }}
        transition={{ delay: 0.2, type: "spring" }}
      />
      <text x={offerX} y={offerY - 8} textAnchor="middle" fontSize={8} fill="#10b981" fontWeight={600}>
        {offerPrice.toLocaleString("fr-FR")}
      </text>
      <text x={offerX} y={height - 2} textAnchor="middle" fontSize={7} fill="#9ca3af">
        Offre
      </text>

      <motion.circle
        cx={marketX} cy={marketY} r={4}
        fill="#3b82f6"
        initial={{ r: 0 }}
        animate={{ r: 4 }}
        transition={{ delay: 0.4, type: "spring" }}
      />
      <text x={marketX} y={marketY - 8} textAnchor="middle" fontSize={8} fill="#3b82f6" fontWeight={600}>
        {marketPrice.toLocaleString("fr-FR")}
      </text>
      <text x={marketX} y={height - 2} textAnchor="middle" fontSize={7} fill="#9ca3af">
        Marché
      </text>

      {suggestedPrice != null && (
        <>
          <motion.circle
            cx={suggestX} cy={suggestY} r={4}
            fill="#8b5cf6"
            initial={{ r: 0 }}
            animate={{ r: 4 }}
            transition={{ delay: 0.6, type: "spring" }}
          />
          <text x={suggestX} y={suggestY - 8} textAnchor="middle" fontSize={8} fill="#8b5cf6" fontWeight={600}>
            {suggestedPrice.toLocaleString("fr-FR")}
          </text>
          <text x={suggestX} y={height - 2} textAnchor="middle" fontSize={7} fill="#9ca3af">
            Suggéré
          </text>
        </>
      )}

      <motion.line
        x1={offerX} y1={offerY}
        x2={marketX} y2={marketY}
        stroke="#d1d5db" strokeWidth={1} strokeDasharray="3,2"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      />
    </svg>
  );
}
