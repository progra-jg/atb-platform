import React, { useState, useEffect, useCallback } from "react";
import { X } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { onApiError } from "../services/errorEvents";

function Toast() {
  const { colors } = useTheme();
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => onApiError((msg) => {
    setMessage(msg);
    setVisible(true);
    setTimeout(() => setVisible(false), 5000);
  }), []);

  const dismiss = useCallback(() => setVisible(false), []);

  if (!message) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: `translateX(-50%) translateY(${visible ? "0" : "20px"})`,
        zIndex: 9999,
        background: "#dc2626",
        color: "white",
        padding: "12px 16px 12px 20px",
        borderRadius: 12,
        boxShadow: "0 8px 32px rgba(220,38,38,0.25)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        fontSize: 13,
        fontWeight: 500,
        maxWidth: "90vw",
        opacity: visible ? 1 : 0,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: visible ? "all" : "none",
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={dismiss}
        style={{
          width: 24, height: 24, borderRadius: 6,
          background: "rgba(255,255,255,0.2)", border: "none",
          color: "white", cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center",
          flexShrink: 0, transition: "background 0.15s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.35)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}>
        <X size={12} weight="bold" />
      </button>
    </div>
  );
}

export default Toast;
