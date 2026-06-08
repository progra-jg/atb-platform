import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { getPendingEvaluations, submitEvaluation } from "../services/trustScore";
import { Star, Check, Spinner } from "@phosphor-icons/react";

export default function TradeEvaluationForm() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [pending, setPending] = useState<{ tradeId: string; tradeRef: string; counterpartyName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTrade, setActiveTrade] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let mounted = true;
    (async () => {
      const p = await getPendingEvaluations(user.id);
      if (mounted) { setPending(p); setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [user]);

  const handleSubmit = async (tradeId: string) => {
    if (!user?.id || rating === 0) return;
    setSubmitting(true);
    try {
      await submitEvaluation(user.id, tradeId, tradeId, rating, comment.trim());
      setSubmitted([...submitted, tradeId]);
      setActiveTrade(null);
      setRating(0);
      setComment("");
    } catch {
      /* noop */
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        background: colors.surface, borderRadius: 16, padding: 20,
        border: `1px solid ${colors.borderLight}`,
      }}>
        <div style={{ height: 18, width: "55%", background: colors.surfaceHover, borderRadius: 6, marginBottom: 12 }} />
        <div style={{ height: 40, background: colors.surfaceHover, borderRadius: 8 }} />
      </div>
    );
  }

  if (pending.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: colors.surface, borderRadius: 16, padding: 20,
        border: `1px solid ${colors.borderLight}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Star size={16} color={colors.accent} weight="fill" />
        <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
          {t("trustScore.evaluateTitle")}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {pending.filter((p) => !submitted.includes(p.tradeId)).map((p) => (
          <div key={p.tradeId}>
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              style={{
                padding: "10px 12px", borderRadius: 10,
                background: colors.surfaceHover,
                cursor: "pointer",
                border: activeTrade === p.tradeId ? `1px solid ${colors.accent}` : `1px solid transparent`,
                transition: "border 0.15s",
              }}
              onClick={() => setActiveTrade(activeTrade === p.tradeId ? null : p.tradeId)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: colors.text }}>
                    {p.tradeRef}
                  </div>
                  <div style={{ fontSize: 10, color: colors.textMuted }}>
                    {p.counterpartyName}
                  </div>
                </div>
                {submitted.includes(p.tradeId) ? (
                  <Check size={14} color="#22c55e" weight="bold" />
                ) : (
                  <Star size={14} color={colors.textMuted} />
                )}
              </div>

              <AnimatePresence>
                {activeTrade === p.tradeId && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{
                      marginTop: 12, paddingTop: 10,
                      borderTop: `1px solid ${colors.borderLight}`,
                    }}>
                      {/* Star rating */}
                      <div style={{ display: "flex", gap: 4, marginBottom: 10, justifyContent: "center" }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <motion.button
                            key={star}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); setRating(star); }}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            style={{
                              background: "none", border: "none", cursor: "pointer",
                              padding: 2, color: star <= (hoverRating || rating) ? "#fbbf24" : colors.borderLight,
                              transition: "color 0.1s",
                            }}
                          >
                            <Star size={22} weight={star <= (hoverRating || rating) ? "fill" : "regular"} />
                          </motion.button>
                        ))}
                      </div>

                      <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={t("trustScore.commentPlaceholder")}
                        rows={2}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: "100%", padding: "8px 10px", borderRadius: 8,
                          border: `1px solid ${colors.borderLight}`,
                          background: colors.inputBg, color: colors.text,
                          fontSize: 11, outline: "none", fontFamily: "inherit",
                          resize: "none", boxSizing: "border-box",
                        }}
                      />

                      <motion.button
                        onClick={(e) => { e.stopPropagation(); handleSubmit(p.tradeId); }}
                        disabled={submitting || rating === 0}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                          width: "100%", padding: "8px 16px", borderRadius: 8, border: "none",
                          marginTop: 8,
                          background: rating === 0 ? colors.surfaceHover : "linear-gradient(135deg, #fbbf24, #f59e0b)",
                          color: rating === 0 ? colors.textMuted : "#1a1a2e",
                          fontSize: 12, fontWeight: 600, cursor: rating === 0 ? "not-allowed" : "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        {submitting ? <Spinner size={14} /> : <Check size={14} weight="bold" />}
                        {t("trustScore.submitEvaluation")}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {submitted.includes(p.tradeId) && (
              <div style={{
                fontSize: 10, color: "#22c55e", textAlign: "center", marginTop: 4, fontWeight: 500,
              }}>
                {t("trustScore.evaluationSubmitted")}
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
