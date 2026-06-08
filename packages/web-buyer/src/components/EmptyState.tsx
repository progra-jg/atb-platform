import React, { ReactElement } from "react";
import { useTheme } from "../context/ThemeContext";

interface Props {
  icon: ReactElement;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  compact?: boolean;
}

const EmptyState: React.FC<Props> = ({ icon, title, description, action, compact }) => {
  const { colors } = useTheme();

  return (
    <div style={{
      textAlign: "center", padding: compact ? "40px 20px" : "60px 20px",
      borderRadius: colors.radiusMd,
    }}>
      <div style={{
        marginBottom: 16, opacity: 0.3, display: "inline-flex",
        width: 56, height: 56, borderRadius: 16,
        background: colors.surfaceHover, alignItems: "center",
        justifyContent: "center",
      }}>
        {icon}
      </div>
      <div style={{
        fontSize: compact ? 15 : 17, fontWeight: 600,
        color: colors.text, marginBottom: description ? 6 : 0,
      }}>
        {title}
      </div>
      {description && (
        <div style={{
          fontSize: compact ? 12 : 13, color: colors.textMuted,
          maxWidth: 400, margin: "0 auto", lineHeight: 1.6,
        }}>
          {description}
        </div>
      )}
      {action && (
        <button onClick={action.onClick}
          style={{
            marginTop: 20,
            background: colors.accentGradient,
            color: "#fff", border: "none",
            padding: "10px 24px", borderRadius: 10,
            fontSize: 13, fontWeight: 600,
            cursor: "pointer", transition: "all 0.2s",
            boxShadow: "0 2px 12px rgba(27,94,32,0.2)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(27,94,32,0.3)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(27,94,32,0.2)"; }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
