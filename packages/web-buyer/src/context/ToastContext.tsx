import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, Info, Warning, X } from "@phosphor-icons/react";
import { useTheme } from "./ThemeContext";
import { toastEnter } from "../lib/motion-variants";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

interface ToastContextType {
  toast: (type: ToastType, title: string, message?: string, action?: { label: string; onClick: () => void }, duration?: number) => void;
  success: (title: string, message?: string, action?: { label: string; onClick: () => void }) => void;
  error: (title: string, message?: string, action?: { label: string; onClick: () => void }) => void;
  info: (title: string, message?: string, action?: { label: string; onClick: () => void }) => void;
  warning: (title: string, message?: string, action?: { label: string; onClick: () => void }) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: Warning,
};

function ToastItem({ t, onRemove }: { t: Toast; onRemove: (id: string) => void }) {
  const { colors } = useTheme();
  const Icon = ICONS[t.type];
  const progressRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef(Date.now());
  const duration = t.duration ?? 4000;
  const remainingRef = useRef(duration);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => onRemove(t.id), remainingRef.current);
  }, [t.id, onRemove]);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      remainingRef.current -= Date.now() - startTimeRef.current;
    }
  }, []);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [startTimer]);

  const typeColorMap = {
    success: colors.success,
    error: colors.error,
    info: colors.info,
    warning: colors.warning,
  };
  const typeBgMap = {
    success: colors.successLight,
    error: colors.errorLight,
    info: colors.infoLight,
    warning: colors.warningLight,
  };

  const accentColor = typeColorMap[t.type];

  return (
    <motion.div
      layout
      variants={toastEnter}
      initial="hidden"
      animate="visible"
      exit="exit"
      onMouseEnter={pauseTimer}
      onMouseLeave={startTimer}
      role="alert"
      style={{
        pointerEvents: "auto",
        background: colors.surface,
        border: `1px solid ${colors.border}`,
        borderLeft: `3px solid ${accentColor}`,
        borderRadius: 12,
        padding: "14px 16px",
        minWidth: 340,
        maxWidth: 420,
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        boxShadow: `0 8px 24px rgba(0,0,0,0.1), ${colors.shadowGlow}`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 3, background: colors.borderLight,
      }}>
        <motion.div
          ref={progressRef}
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: duration / 1000, ease: "linear" }}
          style={{
            height: "100%",
            background: accentColor,
            transformOrigin: "left",
            borderRadius: "0 2px 2px 0",
          }}
          onAnimationEnd={() => onRemove(t.id)}
        />
      </div>
      <Icon size={20} weight="fill" color={accentColor} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: colors.text, lineHeight: 1.4 }}>{t.title}</div>
        {t.message && <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 1.5 }}>{t.message}</div>}
        {t.action && (
          <button onClick={() => { t.action!.onClick(); onRemove(t.id); }} style={{
            marginTop: 8, padding: "4px 10px", borderRadius: 6, border: "none",
            background: accentColor, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
            transition: "opacity 0.15s",
          }} onMouseOver={e => (e.currentTarget.style.opacity = "0.9")}
            onMouseOut={e => (e.currentTarget.style.opacity = "1")}
          >
            {t.action.label}
          </button>
        )}
      </div>
      <button onClick={() => onRemove(t.id)} style={{
        background: "none", border: "none", padding: 2, cursor: "pointer",
        color: colors.textMuted, flexShrink: 0, marginTop: 2,
        borderRadius: 4, transition: "color 0.15s",
      }} onMouseOver={e => (e.currentTarget.style.color = colors.text)}
        onMouseOut={e => (e.currentTarget.style.color = colors.textMuted)}
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastType, title: string, message?: string, action?: { label: string; onClick: () => void }, duration?: number) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, title, message, action, duration }]);
  }, []);

  const ctx: ToastContextType = {
    toast: addToast,
    success: (t, m, a) => addToast("success", t, m, a),
    error: (t, m, a) => addToast("error", t, m, a),
    info: (t, m, a) => addToast("info", t, m, a),
    warning: (t, m, a) => addToast("warning", t, m, a),
    dismiss: remove,
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div style={{
        position: "fixed", top: 20, right: 20, zIndex: 9999,
        display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none",
        maxHeight: "calc(100vh - 40px)", overflow: "hidden",
      }}>
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} t={t} onRemove={remove} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
