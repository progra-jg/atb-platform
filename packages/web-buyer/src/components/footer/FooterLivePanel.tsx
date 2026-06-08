import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { formatTime } from "../../utils/format";

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

export default function FooterLivePanel() {
  const { t } = useTranslation();
  const [besuNodes, setBesuNodes] = useState(6);
  const [kongLatency, setKongLatency] = useState(12);
  const [time, setTime] = useState(new Date());
  const [satStatus, setSatStatus] = useState<"online" | "degraded">("online");
  const [uptime, setUptime] = useState(99.97);
  const mounted = useRef(false);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      if (!mounted.current) return;
      setBesuNodes(rand(5, 6));
      setKongLatency(rand(8, 45));
      setSatStatus(Math.random() > 0.1 ? "online" : "degraded");
      setUptime((prev) => {
        const drift = (Math.random() - 0.5) * 0.02;
        return Math.min(100, Math.max(99.9, +(prev + drift).toFixed(2)));
      });
    }, 4000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => { if (mounted.current) setTime(new Date()); }, 1000);
    return () => clearInterval(iv);
  }, []);

  const badges = [
    {
      key: "bc",
      dot: besuNodes >= 5 ? "#22c55e" : "#f97316",
      label: `${besuNodes}/6`,
      title: `${t("footer.besuNodes", "Blockchain Besu")}: ${besuNodes}/6 ${t("footer.activeNodes", "nœuds actifs")}`,
    },
    {
      key: "sat",
      dot: satStatus === "online" ? "#22c55e" : "#f97316",
      label: satStatus === "online" ? "ONLINE" : "DEGRADED",
      title: `${t("footer.satellite", "Surveillance satellite")}: ${satStatus === "online" ? t("footer.active", "Active") : t("footer.degraded", "Dégradée")}`,
    },
    {
      key: "api",
      dot: kongLatency < 25 ? "#22c55e" : "#f97316",
      label: `${kongLatency}ms`,
      title: `${t("footer.apiLatency", "API Gateway")}: ${kongLatency}ms`,
    },
    {
      key: "uptime",
      dot: uptime >= 99.95 ? "#22c55e" : "#f97316",
      label: `${uptime.toFixed(2)}%`,
      title: `${t("footer.uptime", "Uptime")}: ${uptime.toFixed(2)}%`,
    },
  ];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <span style={{
        fontSize: 9, fontVariantNumeric: "tabular-nums",
        color: "rgba(255,255,255,0.35)",
        fontWeight: 500, fontFamily: "'JetBrains Mono', monospace",
        padding: "2px 4px", letterSpacing: "0.3px", minWidth: 62,
      }}>
        {formatTime(time)}
      </span>

      <span style={{ width: 1, height: 10, background: "rgba(255,255,255,0.06)", flexShrink: 0 }} />

      {badges.map((b) => (
        <span key={b.key} title={b.title}
          style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            padding: "2px 5px", borderRadius: 4,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.055)",
            cursor: "help", height: 18,
            transition: "border-color 300ms ease",
          }}>
          <span style={{
            width: 4, height: 4, borderRadius: "50%",
            background: b.dot, display: "inline-block", flexShrink: 0,
            transition: "background 300ms ease",
          }} />
          <span style={{
            color: "rgba(255,255,255,0.4)",
            fontWeight: 600, fontSize: 7, letterSpacing: "0.4px",
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {b.label}
          </span>
        </span>
      ))}
    </div>
  );
}
