import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Flask, CaretDown, CaretRight } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import Card, { CardHeader } from "./ui/Card";
import { useTheme } from "../context/ThemeContext";
import type { LotLabResult } from "../types";

interface LotLabResultsProps {
  results: LotLabResult[];
}

export default function LotLabResults({ results }: LotLabResultsProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  if (results.length === 0) return null;

  const displayResults = expanded ? results : results.slice(0, 3);

  return (
    <Card variant="premium" style={{ padding: 16 }}>
      <CardHeader icon={<Flask size={16} />} title={t("detail.labResults")} action={
        results.length > 3 ? (
          <button onClick={() => setExpanded(!expanded)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.accent, fontSize: 11, fontWeight: 600, fontFamily: "inherit", display: "flex", alignItems: "center", gap: 2 }}>
            {expanded ? t("common.showLess") : t("common.viewAll")}
            {expanded ? <CaretDown size={11} /> : <CaretRight size={11} />}
          </button>
        ) : undefined
      } />
      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
        <AnimatePresence>
          {displayResults.map((r) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
              style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${colors.borderLight}`, background: colors.surface }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{r.parameter}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: colors.accent }}>{r.result}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 10, color: colors.textMuted }}>{r.laboratory} · {r.method}</span>
                <span style={{ fontSize: 10, color: colors.textMuted }}>{r.date}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );
}
