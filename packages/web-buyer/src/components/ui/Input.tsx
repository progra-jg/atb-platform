import React, { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { Eye, EyeSlash } from "@phosphor-icons/react";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string | null;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  containerStyle?: React.CSSProperties;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label, hint, error, leftIcon, rightIcon,
  showPasswordToggle, showPassword, onTogglePassword,
  containerStyle,
  id,
  ...inputProps
}, ref) => {
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  const [focused, setFocused] = useState(false);
  const inputId = id || `input-${label?.replace(/\s+/g, "-").toLowerCase()}-${Math.random().toString(36).slice(2, 6)}`;

  const hasError = !!error;
  const borderColor = hasError ? colors.error : focused ? colors.accent : colors.borderLight;

  return (
    <div style={{ width: "100%", ...containerStyle }}>
      {label && (
        <label htmlFor={inputId} style={{
          display: "block", fontSize: isMobile ? 11 : 12, fontWeight: 600,
          color: hasError ? colors.error : colors.textMuted,
          marginBottom: 5, transition: "color 150ms ease",
        }}>
          {label}
          {inputProps.required && <span style={{ color: colors.error, marginLeft: 2 }}>*</span>}
        </label>
      )}

      <div style={{
        position: "relative", display: "flex", alignItems: "center",
        borderRadius: 12,
        border: `1.5px solid ${borderColor}`,
        background: colors.inputBg,
        transition: "border-color 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 200ms ease",
        boxShadow: focused && !hasError ? `0 0 0 3px ${colors.accent}20` : hasError ? `0 0 0 3px ${colors.error}15` : "none",
      }}>
        {leftIcon && (
          <span style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            display: "flex", color: colors.textMuted, opacity: focused ? 1 : 0.6,
            transition: "opacity 150ms ease", pointerEvents: "none",
          }}>
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          {...inputProps}
          type={showPasswordToggle && showPassword ? "text" : inputProps.type}
          onFocus={(e) => { setFocused(true); inputProps.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); inputProps.onBlur?.(e); }}
          style={{
            width: "100%",
            padding: `${isMobile ? 10 : 11}px ${showPasswordToggle ? 44 : rightIcon ? 40 : 14}px ${isMobile ? 10 : 11}px ${leftIcon ? 40 : 14}px`,
            borderRadius: 12,
            border: "none",
            background: "transparent",
            color: colors.text,
            fontSize: isMobile ? 14 : 14,
            fontFamily: "inherit",
            outline: "none",
            boxSizing: "border-box",
            lineHeight: 1.5,
            ...inputProps.style,
          } as React.CSSProperties}
        />

        {showPasswordToggle && (
          <button
            type="button"
            onClick={onTogglePassword}
            tabIndex={-1}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            style={{
              position: "absolute", right: 8, top: "50%",
              transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer",
              padding: 6, display: "flex",
              color: colors.textMuted, opacity: 0.6,
              transition: "opacity 150ms ease, color 150ms ease",
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "0.6"}
          >
            {showPassword ? <EyeSlash size={isMobile ? 16 : 18} /> : <Eye size={isMobile ? 16 : 18} />}
          </button>
        )}

        {rightIcon && !showPasswordToggle && (
          <span style={{
            position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
            display: "flex", color: colors.textMuted, pointerEvents: "none",
          }}>
            {rightIcon}
          </span>
        )}
      </div>

      {error && (
        <p style={{
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
});

Input.displayName = "Input";
