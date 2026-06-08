import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { PageTransition } from "../components/PageTransition";
import api from "../services/api";
import {
  Circle, CheckCircle, WarningCircle, XCircle,
  ArrowsClockwise, Clock, Pulse, ChartLine,
  Play, Pause,
} from "@phosphor-icons/react";
import { formatTime } from "../utils/format";

interface ServiceCheck {
  name: string;
  endpoint: string;
  status: "operational" | "degraded" | "downtime";
  latency: number;
  message: string;
}

interface StatusSnapshot {
  overall: "operational" | "degraded" | "downtime";
  timestamp: string;
  uptime: number;
  services: ServiceCheck[];
}

const STATUS_META: Record<string, { color: string; bg: string; icon: typeof Circle }> = {
  operational: { color: "#34d399", bg: "rgba(52,211,153,0.12)", icon: CheckCircle },
  degraded: { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: WarningCircle },
  downtime: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", icon: XCircle },
};

export default function ApiStatus() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [snapshot, setSnapshot] = useState<StatusSnapshot | null>(null);
  const [history, setHistory] = useState<{ t: number; ok: boolean }[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [polling, setPolling] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => setVisible(true), []);

  const fetchStatus = useCallback(async () => {
    setPolling(true);
    try {
      const [svcRes, histRes] = await Promise.all([
        api.get("/status/services"),
        api.get("/status/history"),
      ]);
      setSnapshot(svcRes.data);
      setHistory(histRes.data.points || []);
    } catch {
      // keep last known state
    } finally {
      setPolling(false);
      setElapsed(0);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!autoRefresh) {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    pollRef.current = setInterval(fetchStatus, 10000);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefresh, fetchStatus]);

  const uptimePct = history.length > 0
    ? Math.round((history.filter((p) => p.ok).length / history.length) * 100)
    : 100;

  const overallMeta = snapshot ? STATUS_META[snapshot.overall] || STATUS_META.downtime : null;
  const OverallIcon = overallMeta?.icon || Circle;

  const fadeUp = (d: number) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(16px)",
    transition: `opacity 400ms cubic-bezier(0.16,1,0.3,1) ${d}ms, transform 400ms cubic-bezier(0.16,1,0.3,1) ${d}ms`,
  });

  return (
    <PageTransition>
      <div style={{ minHeight: "100vh", background: isDark ? "#070b09" : "#f4f6f5" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px 100px" }}>
          <div style={{ textAlign: "center", ...fadeUp(0) }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "6px 16px", borderRadius: 100,
              background: overallMeta?.bg || (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"),
              color: overallMeta?.color || "var(--color-text-muted)",
              fontSize: 12, fontWeight: 600, marginBottom: 16,
            }}>
              <OverallIcon size={14} weight="fill" />
              {snapshot ? (
                snapshot.overall === "operational" ? t("status.allOperational")
                  : snapshot.overall === "degraded" ? t("status.degraded")
                  : t("status.labelDowntime")
              ) : "..."}
            </div>

            <h1 style={{
              fontSize: 32, fontWeight: 800, marginBottom: 8,
              background: "linear-gradient(135deg, #0a6e4a, #34d399)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              {t("status.title")}
            </h1>
            <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 32, maxWidth: 500, margin: "0 auto 32px" }}>
              {t("status.subtitle")}
            </p>
          </div>

          <div style={{
            display: "flex", justifyContent: "center", gap: 16, marginBottom: 28, ...fadeUp(50),
          }}>
            <div style={{
              padding: "12px 20px", borderRadius: 12, textAlign: "center",
              background: isDark ? "rgba(255,255,255,0.02)" : "white",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
              minWidth: 100,
            }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text)" }}>
                {snapshot ? `${uptimePct}%` : "..."}
              </p>
              <p style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{t("status.uptimeLabel") || "Uptime"}</p>
            </div>
            <div style={{
              padding: "12px 20px", borderRadius: 12, textAlign: "center",
              background: isDark ? "rgba(255,255,255,0.02)" : "white",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
              minWidth: 100,
            }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text)" }}>
                {snapshot ? snapshot.services.filter((s) => s.status === "operational").length + "/" + snapshot.services.length : "..."}
              </p>
              <p style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{t("status.healthyLabel") || "Opérationnels"}</p>
            </div>
            <div style={{
              padding: "12px 20px", borderRadius: 12, textAlign: "center",
              background: isDark ? "rgba(255,255,255,0.02)" : "white",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
              minWidth: 100,
            }}>
              <p style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text)" }}>
                {snapshot ? snapshot.services.filter((s) => s.latency > 0).reduce((a, s) => a + s.latency, 0) + "ms" : "..."}
              </p>
              <p style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{t("status.avgLatency") || "Latence moy."}</p>
            </div>
          </div>

          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 12, ...fadeUp(80),
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => setAutoRefresh(!autoRefresh)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", borderRadius: 8, border: "none",
                  cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit",
                  background: autoRefresh
                    ? (isDark ? "rgba(52,211,153,0.15)" : "rgba(10,110,74,0.1)")
                    : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"),
                  color: autoRefresh ? "#34d399" : "var(--color-text-muted)",
                }}
              >
                {autoRefresh ? <Pause size={12} weight="fill" /> : <Play size={12} weight="fill" />}
                {autoRefresh ? `${10 - (elapsed % 10)}s` : (t("status.paused") || "Pause")}
              </button>
              {polling && <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}><Pulse size={12} /> {t("status.checking") || "Vérification..."}</span>}
            </div>
            {snapshot && (
              <span style={{ fontSize: 11, color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={11} />
                {formatTime(snapshot.timestamp)}
              </span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, ...fadeUp(100) }}>
            {snapshot?.services.map((svc, i) => {
              const meta = STATUS_META[svc.status] || STATUS_META.downtime;
              const Icon = meta.icon;
              return (
                <div key={i} style={{
                  padding: "14px 18px", borderRadius: 12,
                  background: isDark ? "rgba(255,255,255,0.02)" : "white",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  transition: "all 0.3s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ position: "relative" }}>
                      <Icon size={16} weight="fill" color={meta.color} />
                      {svc.status === "operational" && (
                        <span style={{
                          position: "absolute", inset: -2, borderRadius: "50%",
                          border: `2px solid ${meta.color}`,
                          opacity: 0.4, animation: "pulse-ring 2s infinite",
                        }} />
                      )}
                    </span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{svc.name}</p>
                      <p style={{ fontSize: 11, color: "var(--color-text-muted)", fontFamily: "monospace" }}>
                        {svc.endpoint === "in-process" ? "process" : svc.endpoint}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: meta.color }}>
                      {svc.status === "operational" ? t("status.labelOperational")
                        : svc.status === "degraded" ? t("status.labelDegraded")
                        : t("status.labelDowntime")}
                    </p>
                    <p style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                      {svc.status !== "downtime" ? `${svc.latency}ms` : svc.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {history.length > 0 && (
            <div style={fadeUp(200)}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: "32px 0 12px", color: "var(--color-text)", display: "flex", alignItems: "center", gap: 8 }}>
                <ChartLine size={16} /> {t("status.uptimeHistory") || "Historique disponibilité"}
              </h2>
              <div style={{
                padding: "16px 20px", borderRadius: 12,
                background: isDark ? "rgba(255,255,255,0.02)" : "white",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
              }}>
                <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 32 }}>
                  {history.slice(-120).map((pt, i) => (
                    <div key={i} style={{
                      flex: 1, height: pt.ok ? "100%" : "30%",
                      background: pt.ok ? "#34d399" : "#ef4444",
                      borderRadius: "2px 2px 0 0",
                      opacity: 0.7, transition: "all 0.3s",
                      minWidth: 3,
                    }} title={pt.ok ? "OK" : "Downtime"} />
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: "var(--color-text-muted)" }}>
                  <span>{history.length > 0 ? formatTime(history[0]?.t) : ""}</span>
                  <span>{history.length} {t("status.dataPoints") || "points"}</span>
                  <span>{history.length > 0 ? formatTime(history[history.length - 1]?.t) : ""}</span>
                </div>
              </div>
            </div>
          )}

          <div style={fadeUp(300)}>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: "32px 0 12px", color: "var(--color-text)" }}>
              {t("status.incidentsTitle")}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { titleKey: "status.incident1Title", descKey: "status.incident1Desc", date: "21 Mai 2026", status: "resolved" as const, duration: "14 min" },
                { titleKey: "status.incident2Title", descKey: "status.incident2Desc", date: "15 Mai 2026", status: "resolved" as const, duration: "23 min" },
                { titleKey: "status.incident3Title", descKey: "status.incident3Desc", date: "02 Mai 2026", status: "maintenance" as const, duration: "2 h" },
                { titleKey: "status.incident4Title", descKey: "status.incident4Desc", date: "18 Avr 2026", status: "resolved" as const, duration: "1 h 12 min" },
              ].map((inc, i) => {
                const icon = inc.status === "resolved" ? CheckCircle : ArrowsClockwise;
                const color = inc.status === "resolved" ? "#34d399" : "#3b82f6";
                return (
                  <div key={i} style={{
                    padding: "14px 18px", borderRadius: 12,
                    background: isDark ? "rgba(255,255,255,0.02)" : "white",
                    border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {icon({ size: 14, weight: "fill", color })}
                        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>{t(inc.titleKey)}</span>
                      </div>
                      <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{inc.date}</span>
                    </div>
                    <p style={{ fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.6, marginLeft: 24 }}>
                      {t(inc.descKey)} <strong style={{ color: "var(--color-text)" }}>({inc.duration})</strong>
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ ...fadeUp(400), marginTop: 32, textAlign: "center" }}>
            <p style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
              API Gateway · {snapshot ? new Date(snapshot.timestamp).toISOString() : "..."}
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </PageTransition>
  );
}
