import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import DemandSignalForm from "../components/DemandSignalForm";
import DemandMatchCard from "../components/DemandMatchCard";
import { getDemandMatches, respondToMatch } from "../services/demand";
import type { DemandMatch } from "../types/demand";
import { Plus, Lightbulb, Megaphone, X } from "@phosphor-icons/react";

export default function DemandPage() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [matches, setMatches] = useState<DemandMatch[]>([]);
  const [loaded, setLoaded] = useState(false);

  const handleCreated = async () => {
    setShowForm(false);
    try {
      const all = await getDemandMatches();
      setMatches(all);
      setLoaded(true);
    } catch {
      /* noop */
    }
  };

  const handleAccept = async (matchId: string) => {
    try {
      await respondToMatch(matchId, "accepted");
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId ? { ...m, status: "accepted" as const } : m,
        ),
      );
    } catch {
      /* noop */
    }
  };

  const handleReject = async (matchId: string) => {
    try {
      await respondToMatch(matchId, "rejected");
      setMatches((prev) =>
        prev.map((m) =>
          m.id === matchId ? { ...m, status: "rejected" as const } : m,
        ),
      );
    } catch {
      /* noop */
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px 60px" }}>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 28 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: "linear-gradient(135deg, #059669, #10b981)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Megaphone size={22} color="#fff" weight="fill" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: colors.text }}>
              {t("demand.pageTitle")}
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.textMuted }}>
              {t("demand.pageDesc")}
            </p>
          </div>
        </div>

        {!showForm && (
          <motion.button
            onClick={() => setShowForm(true)}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "10px 20px", borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #059669, #10b981)",
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <Plus size={16} weight="bold" />
            {t("demand.createSignal")}
          </motion.button>
        )}
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ maxWidth: 480, marginBottom: 24, overflow: "hidden" }}
          >
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
              <button
                onClick={() => setShowForm(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted }}
              >
                <X size={18} />
              </button>
            </div>
            <DemandSignalForm onCreated={handleCreated} onClose={() => setShowForm(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {matches.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: colors.text, marginBottom: 12 }}>
            {t("demand.matches")} ({matches.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {matches.map((match) => (
              <DemandMatchCard
                key={match.id}
                match={match}
                onAccept={handleAccept}
                onReject={handleReject}
              />
            ))}
          </div>
        </div>
      )}

      {loaded && matches.length === 0 && (
        <div style={{
          padding: 24, borderRadius: 16, textAlign: "center",
          background: colors.surface, border: `1px solid ${colors.borderLight}`,
        }}>
          <Lightbulb size={32} color={colors.textMuted} style={{ opacity: 0.3, marginBottom: 8 }} />
          <p style={{ fontSize: 13, color: colors.textMuted, margin: 0, lineHeight: 1.5 }}>
            {t("demand.howItWorks")}
          </p>
        </div>
      )}

      {!loaded && !showForm && (
        <div style={{
          padding: 24, borderRadius: 16, textAlign: "center",
          background: colors.surface, border: `1px solid ${colors.borderLight}`,
        }}>
          <Lightbulb size={32} color={colors.textMuted} style={{ opacity: 0.3, marginBottom: 8 }} />
          <p style={{ fontSize: 13, color: colors.textMuted, margin: 0, lineHeight: 1.5 }}>
            {t("demand.howItWorks")}
          </p>
        </div>
      )}
    </div>
  );
}
