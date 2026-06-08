import React, { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import StarRating from "./StarRating";
import { submitReview, getBuyerReviewForOrder } from "../services/reviews";
import { CheckCircle, Spinner } from "@phosphor-icons/react";

interface Props {
  orderId: string;
  buyerId: string;
  onSubmitted: () => void;
  onClose: () => void;
}

export default function SubmitReview({ orderId, buyerId, onSubmitted, onClose }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (rating < 1) return;
    setSubmitting(true);
    setError("");
    try {
      await submitReview({ orderId, buyerId, rating, comment: comment.trim() || undefined });
      setDone(true);
      setTimeout(onSubmitted, 1500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <CheckCircle size={40} color="#059669" weight="fill" />
        <div style={{ color: colors.text, fontWeight: 600, fontSize: 14, marginTop: 8 }}>{t("reviews.thanks")}</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ color: colors.text, fontWeight: 600, fontSize: 14, marginBottom: 10 }}>
          {t("reviews.rateOrder")}
        </div>
        <StarRating rating={rating} onChange={setRating} size={28} />
      </div>

      {rating > 0 && (
        <div style={{ marginBottom: 12, animation: "fadeSlideUp 0.2s ease" }}>
          <textarea
            placeholder={t("reviews.commentPlaceholder")}
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 2000))}
            rows={3}
            style={{
              width: "100%", padding: "10px 12px", borderRadius: 10,
              border: `1.5px solid ${colors.borderLight}`, fontSize: 13,
              background: colors.surface, color: colors.text,
              outline: "none", resize: "vertical", boxSizing: "border-box",
              fontFamily: "inherit", lineHeight: 1.5,
            }}
          />
          <div style={{ fontSize: 10, color: colors.textMuted, textAlign: "right", marginTop: 3 }}>
            {comment.length}/2000
          </div>
        </div>
      )}

      {error && (
        <div style={{ fontSize: 12, color: "#dc2626", marginBottom: 8, padding: "6px 10px", background: "#fef2f2", borderRadius: 6 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{
          background: "transparent", border: `1.5px solid ${colors.borderLight}`,
          padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 500,
          color: colors.text, cursor: "pointer",
        }}>{t("common.cancel")}</button>
        <button onClick={handleSubmit} disabled={rating < 1 || submitting} style={{
          background: rating < 1 ? colors.borderLight : colors.accent,
          color: rating < 1 ? colors.textMuted : "white", border: "none",
          padding: "7px 18px", borderRadius: 8, fontSize: 12, fontWeight: 600,
          cursor: rating < 1 ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", gap: 6,
          transition: "all 0.15s",
        }}>
          {submitting ? t("reviews.submitting") : t("reviews.publish")}
        </button>
      </div>
    </div>
  );
}
