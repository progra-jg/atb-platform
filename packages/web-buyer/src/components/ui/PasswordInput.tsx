import { useState, useRef, type InputHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../context/ThemeContext";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { Eye, EyeSlash, Copy, Check } from "@phosphor-icons/react";
import PasswordStrengthMeter from "./PasswordStrengthMeter";
import { analyzePassword } from "../../utils/passwordStrength";
import { PASSWORD_RULES } from "../../utils/security";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  label?: string;
  hint?: string;
  error?: string | null;
  showStrengthMeter?: boolean;
  showRules?: boolean;
}

export default function PasswordInput({
  label, hint, error, showStrengthMeter = true, showRules = false,
  value, onChange, onBlur, onFocus,
  id, required, disabled, placeholder,
  ...inputProps
}: PasswordInputProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  const [focused, setFocused] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pwd = (value as string) || "";
  const analysis = showStrengthMeter || showRules ? analyzePassword(pwd) : null;
  const showMeter = showStrengthMeter && pwd.length > 0 && focused;

  const inputId = id || `pwd-${label?.replace(/\s+/g, "-").toLowerCase() || "input"}`;
  const hasError = !!error;
  const borderColor = hasError ? colors.error : focused ? colors.accent : colors.borderLight;

  const handleCopy = async () => {
    if (!pwd || copied) return;
    try {
      await navigator.clipboard.writeText(pwd);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent */ }
  };

  return (
    <div style={{ width: "100%" }}>
      {label && (
        <label htmlFor={inputId} style={{
          display: "block", fontSize: isMobile ? 11 : 12, fontWeight: 600,
          color: hasError ? colors.error : colors.textMuted,
          marginBottom: 5, transition: "color 150ms ease",
        }}>
          {label}
          {required && <span style={{ color: colors.error, marginLeft: 2 }}>*</span>}
        </label>
      )}

      <div style={{
        position: "relative", display: "flex", alignItems: "center",
        borderRadius: 12,
        border: `1.5px solid ${borderColor}`,
        background: disabled ? colors.surfaceHover : colors.inputBg,
        transition: "border-color 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms ease",
        boxShadow: focused && !hasError ? `0 0 0 3px ${colors.accent}20`
          : hasError ? `0 0 0 3px ${colors.error}15`
          : "none",
      }}>
        <input
          ref={inputRef}
          id={inputId}
          type={showPwd ? "text" : "password"}
          value={value}
          onChange={onChange}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          placeholder={placeholder || "••••••••"}
          disabled={disabled}
          required={required}
          autoComplete="new-password"
          aria-invalid={hasError}
          aria-describedby={hasError ? `${inputId}-error` : undefined}
          style={{
            width: "100%",
            padding: `${isMobile ? 10 : 11}px 88px ${isMobile ? 10 : 11}px 14px`,
            borderRadius: 12,
            border: "none",
            background: "transparent",
            color: colors.text,
            fontSize: isMobile ? 14 : 14,
            fontFamily: "'SF Mono', 'JetBrains Mono', 'Cascadia Code', monospace",
            outline: "none",
            boxSizing: "border-box",
            lineHeight: 1.5,
            letterSpacing: showPwd ? "normal" : "0.15em",
          }}
          {...inputProps}
        />

        <div style={{
          position: "absolute", right: 6, top: "50%",
          transform: "translateY(-50%)",
          display: "flex", alignItems: "center", gap: 1,
        }}>
          {pwd && (
            <button type="button" onClick={handleCopy}
              title={copied ? t("auth.pwd.copied") : t("auth.pwd.copy")}
              disabled={copied}
              style={{
                background: "none", border: "none", cursor: copied ? "default" : "pointer",
                padding: 6, display: "flex",
                color: copied ? colors.success : colors.textMuted, opacity: copied ? 1 : 0.5,
                transition: "opacity 150ms ease, color 150ms ease",
              }}
              onMouseEnter={(e) => { if (!copied) e.currentTarget.style.opacity = "1"; }}
              onMouseLeave={(e) => { if (!copied) e.currentTarget.style.opacity = "0.5"; }}>
              {copied ? <Check size={isMobile ? 14 : 16} weight="bold" /> : <Copy size={isMobile ? 14 : 16} />}
            </button>
          )}

          <button type="button" onClick={() => setShowPwd(!showPwd)}
            title={showPwd ? t("auth.pwd.hide") : t("auth.pwd.show")}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: 6, display: "flex",
              color: colors.textMuted, opacity: 0.5,
              transition: "opacity 150ms ease",
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "0.5"}>
            {showPwd ? <EyeSlash size={isMobile ? 16 : 18} /> : <Eye size={isMobile ? 16 : 18} />}
          </button>
        </div>
      </div>

      {showRules && pwd.length > 0 && (
        <div style={{
          display: "flex", flexWrap: "wrap", gap: "4px 12px",
          marginTop: 6, padding: "0 2px",
        }}>
          {PASSWORD_RULES.map((rule) => {
            const ok = rule.test(pwd);
            return (
              <span key={rule.key} style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 10, fontWeight: 500,
                color: ok ? colors.success : colors.textMuted,
                transition: "color 200ms ease",
              }}>
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ flexShrink: 0 }}>
                  {ok ? (
                    <path d="M1.5 4l1.5 1.5L6.5 2" stroke="#22c55e" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round" />
                  ) : (
                    <circle cx="4" cy="4" r="3" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.3" />
                  )}
                </svg>
                {rule.label}
              </span>
            );
          })}
        </div>
      )}

      {analysis && (
        <PasswordStrengthMeter analysis={analysis} visible={showMeter} />
      )}

      {error && (
        <p id={`${inputId}-error`} style={{
          margin: "4px 0 0", fontSize: 11, color: colors.error,
          fontWeight: 500, lineHeight: 1.3,
          animation: "fadeSlideUp 150ms ease both",
        }} role="alert">
          {error}
        </p>
      )}

      {hint && !error && (
        <p style={{ margin: "4px 0 0", fontSize: 10, color: colors.textMuted, lineHeight: 1.3 }}>
          {hint}
        </p>
      )}
    </div>
  );
}
