import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import type { PasswordAnalysis } from "../../utils/passwordStrength";

const STRENGTH_COLORS = [
  "#ef4444", "#ef4444",
  "#f97316", "#f97316",
  "#eab308", "#eab308",
  "#22c55e", "#22c55e",
  "#06b6d4", "#06b6d4",
];

const STRENGTH_GRADIENTS = [
  ["#ef4444", "#dc2626"],
  ["#ef4444", "#f97316"],
  ["#eab308", "#84cc16"],
  ["#22c55e", "#10b981"],
  ["#06b6d4", "#0ea5e9"],
];

interface PasswordStrengthMeterProps {
  analysis: PasswordAnalysis;
  visible: boolean;
}

export default function PasswordStrengthMeter({ analysis, visible }: PasswordStrengthMeterProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const barRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!visible || !barRef.current || !analysis.score) return;
    const bar = barRef.current;
    bar.style.transition = "none";
    bar.style.width = "0%";
    requestAnimationFrame(() => {
      bar.style.transition = "width 400ms cubic-bezier(0.16, 1, 0.3, 1)";
      bar.style.width = `${analysis.score}%`;
    });
  }, [analysis.score, visible]);

  useEffect(() => {
    if (!visible || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    const grad = ctx.createLinearGradient(0, 0, w, 0);
    const [c1, c2] = STRENGTH_GRADIENTS[analysis.strength];
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.fillStyle = grad;

    const radius = h / 2;
    const pct = analysis.score / 100;

    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(w * pct - radius, 0);
    ctx.quadraticCurveTo(w * pct, 0, w * pct, radius);
    ctx.quadraticCurveTo(w * pct, h, w * pct - radius, h);
    ctx.lineTo(radius, h);
    ctx.quadraticCurveTo(0, h, 0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();
  }, [analysis.score, analysis.strength, visible]);

  if (!visible) return null;

  const checkLabels: { key: keyof PasswordAnalysis["checks"]; label: string }[] = [
    { key: "length", label: t("auth.pwd.strength.length") },
    { key: "uppercase", label: t("auth.pwd.strength.uppercase") },
    { key: "lowercase", label: t("auth.pwd.strength.lowercase") },
    { key: "digit", label: t("auth.pwd.strength.digit") },
    { key: "special", label: t("auth.pwd.strength.special") },
    { key: "noCommon", label: t("auth.pwd.strength.noCommon") },
  ];

  return (
    <div style={{
      marginTop: 8, padding: "10px 12px",
      background: colors.surfaceHover,
      borderRadius: 10,
      border: `1px solid ${colors.borderLight}`,
      animation: "fadeSlideUp 200ms ease both",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <div style={{
          flex: 1, height: 6, borderRadius: 3,
          background: colors.borderLight,
          position: "relative", overflow: "hidden",
        }}>
          <canvas
            ref={canvasRef}
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              borderRadius: 3,
            }}
          />
          <div
            ref={barRef}
            role="progressbar"
            aria-valuenow={analysis.score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t("auth.pwd.strength.ariaLabel")}
            style={{
              width: 0, height: "100%", borderRadius: 3,
              position: "relative", zIndex: 1,
            }}
          />
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, color: STRENGTH_COLORS[analysis.strength * 2],
          fontVariantNumeric: "tabular-nums", minWidth: 56, textAlign: "right",
          letterSpacing: "0.3px",
        }}>
          {analysis.score}/100
        </span>
      </div>

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 8,
      }}>
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: STRENGTH_COLORS[analysis.strength * 2],
        }}>
          {analysis.strengthLabel}
        </span>
        <span style={{ fontSize: 10, color: colors.textMuted }}>
          Crack: <span style={{ fontWeight: 600, color: colors.text }}>
            {analysis.crackTimeLabel}
          </span>
        </span>
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 8px",
      }}>
        {checkLabels.map(({ key, label }) => {
          const ok = analysis.checks[key];
          return (
            <div key={key} style={{
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 10,               color: ok ? colors.success : colors.textMuted,
              transition: "color 200ms ease",
            }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                style={{ flexShrink: 0 }}>
                {ok ? (
                  <path d="M2 5l2 2 4-4" stroke="#22c55e" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{ animation: "drawCheck 200ms ease both" }} />
                ) : (
                  <circle cx="5" cy="5" r="4" stroke="currentColor"
                    strokeWidth="1" fill="none" opacity="0.3" />
                )}
              </svg>
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
