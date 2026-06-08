import { Component, type ReactNode, type ErrorInfo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Warning, ArrowCounterClockwise } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";

interface FallbackProps {
  error: Error;
  errorInfo?: ErrorInfo;
  retry?: () => void;
  context?: string;
}

function FallbackContent({ error, errorInfo, retry, context }: FallbackProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 12, padding: "40px 24px",
        textAlign: "center", maxWidth: 420, margin: "0 auto", minHeight: 200,
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: `${colors.error}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: colors.error,
      }}>
        <Warning size={24} weight="fill" />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>
        {context ? `${t("errorBoundary.title")} — ${context}` : t("errorBoundary.title")}
      </div>
      <div style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 1.5 }}>
        {t("errorBoundary.description")}
      </div>
      {retry && (
        <button
          onClick={retry}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "9px 20px", borderRadius: 10, border: "none",
            background: colors.accent, color: "#fff", fontSize: 13,
            fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            transition: "transform 150ms, box-shadow 150ms",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
        >
          <ArrowCounterClockwise size={14} weight="bold" />
          {t("common.retry")}
        </button>
      )}
    </motion.div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  context?: string;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ errorInfo: info });
    this.props.onError?.(error, info);
  }

  handleRetry = () => {
    this.setState({ error: null, errorInfo: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <FallbackContent
          error={this.state.error}
          errorInfo={this.state.errorInfo ?? undefined}
          retry={this.handleRetry}
          context={this.props.context}
        />
      );
    }
    return this.props.children;
  }
}
