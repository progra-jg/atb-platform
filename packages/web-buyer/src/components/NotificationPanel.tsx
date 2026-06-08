import React, { useState, useEffect } from "react";
import {
  Bell, SealCheck, Truck, Clock, X, WarningCircle,
  ShoppingCart, TrendUp, FileText, Handshake, CheckCircle, FilePlus,
} from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import IconButton from "./IconButton";
import { fetchNotifications, markAsRead, markAllAsRead } from "../services/notifications";
import type { NotificationItem } from "../types";

function getIcon(title: string, accent: string, success: string, warning: string, error: string, info: string) {
  const lower = title.toLowerCase();
  if (lower.includes("certifié") || lower.includes("certified") || lower.includes("lot")) return { Icon: SealCheck, color: success };
  if (lower.includes("expédition") || lower.includes("expedition") || lower.includes("shipment")) return { Icon: Truck, color: info };
  if (lower.includes("certificat") || lower.includes("expire") || lower.includes("expir")) return { Icon: Clock, color: warning };
  if (lower.includes("commande") || lower.includes("order")) return { Icon: ShoppingCart, color: accent };
  if (lower.includes("alerte") || lower.includes("alert") || lower.includes("prix") || lower.includes("price")) return { Icon: TrendUp, color: error };
  if (lower.includes("rapport") || lower.includes("report")) return { Icon: FileText, color: "#7c3aed" };
  if (lower.includes("contre") || lower.includes("counter")) return { Icon: Handshake, color: "#7c3aed" };
  if (lower.includes("signé") || lower.includes("signe") || lower.includes("sign")) return { Icon: CheckCircle, color: success };
  if (lower.includes("créé") || lower.includes("cree") || lower.includes("new")) return { Icon: FilePlus, color: success };
  return { Icon: Bell, color: info };
}

interface NotificationPanelProps {
  onClose: () => void;
  onCountChange?: (count: number) => void;
}

function NotificationPanel({ onClose, onCountChange }: NotificationPanelProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetchNotifications().then((data) => {
      setNotifications(data);
      setLoading(false);
      if (onCountChange) onCountChange(data.filter((n) => n.unread).length);
    });
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const handleMarkRead = (id: string | number) => {
    markAsRead(id);
    setNotifications((prev) => {
      const next = prev.map((n) => n.id === id ? { ...n, unread: false } : n);
      if (onCountChange) onCountChange(next.filter((n) => n.unread).length);
      return next;
    });
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    setNotifications((prev) => {
      const next = prev.map((n) => ({ ...n, unread: false }));
      if (onCountChange) onCountChange(0);
      return next;
    });
  };

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <div style={{
      position: "absolute", top: 44, right: 0, width: 360,
      background: colors.surface, borderRadius: 14,
      border: `1px solid ${colors.border}`,
      boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
      overflow: "hidden", zIndex: 200,
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 16px 10px", borderBottom: `1px solid ${colors.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: colors.text }}>{t("common.notifications")}</span>
          {unreadCount > 0 && (
            <span style={{ background: colors.accent, color: "white", borderRadius: 10, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>{unreadCount}</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} style={{
              background: "none", border: "none", fontSize: 10, color: colors.accent,
              cursor: "pointer", fontWeight: 600, padding: "4px 8px",
            }}>{t("common.markAllRead")}</button>
          )}
          <IconButton icon={<X size={14} />} onClick={onClose} tooltip={t("common.close")} size={28} color={colors.textMuted} />
        </div>
      </div>
      <div style={{ maxHeight: 360, overflowY: "auto" }}>
        {loading ? (
          <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 12, color: colors.textMuted }}>
            {t("common.loading")}
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: "24px 16px", textAlign: "center", fontSize: 12, color: colors.textMuted }}>
            <Bell size={24} style={{ marginBottom: 8, opacity: 0.4 }} /><br />
            {t("common.noNotification")}
          </div>
        ) : (
          notifications.map((n) => {
            const { Icon, color } = getIcon(n.title, colors.accent, colors.success, colors.warning, colors.error, colors.info);
            return (
              <div key={n.id} onClick={() => handleMarkRead(n.id)} style={{
                display: "flex", gap: 10, padding: "12px 16px",
                borderBottom: `1px solid ${colors.border}`,
                background: n.unread ? `${colors.accent}08` : "transparent",
                cursor: "pointer", transition: "background 0.1s",
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: `${color}14`, display: "flex",
                  alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon size={14} color={color} weight="fill" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{n.title}</span>
                    <span style={{ fontSize: 10, color: colors.textMuted, whiteSpace: "nowrap" }}>{n.time}</span>
                  </div>
                  <span style={{ fontSize: 11, color: colors.textSecondary, display: "block", marginTop: 1 }}>{n.desc}</span>
                </div>
                {n.unread && <div style={{ width: 6, height: 6, borderRadius: "50%", background: colors.success, marginTop: 3, flexShrink: 0 }} />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default NotificationPanel;
