import React, { useState } from "react";
import { Star } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";

interface Props {
  rating: number;
  onChange?: (rating: number) => void;
  size?: number;
  readonly?: boolean;
}

export default function StarRating({ rating, onChange, size = 24, readonly = false }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [hover, setHover] = useState(0);

  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hover || rating);
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: readonly ? "default" : "pointer",
              lineHeight: 0,
              transition: "transform 0.1s",
              transform: !readonly && hover >= star ? "scale(1.15)" : "scale(1)",
            }}
            aria-label={t("common.stars", { count: star })}
          >
            <Star
              size={size}
              weight={filled ? "fill" : "regular"}
              color={filled ? (hover ? "#ffa000" : "#ffb300") : colors.borderLight}
              style={{
                transition: "color 0.12s, transform 0.12s",
                filter: filled ? "drop-shadow(0 1px 2px rgba(255,179,0,0.3))" : "none",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
