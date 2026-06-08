import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";

const CITIES: Record<string, [number, number]> = {
  Cotonou: [6.37, 2.42], Parakou: [9.34, 2.63], Bohicon: [7.18, 2.07],
  Lokossa: [6.64, 1.72], Natitingou: [10.3, 1.38], Sakété: [6.72, 2.68],
  Allada: [6.66, 2.16], "Grand-Popo": [6.28, 1.83], Kétou: [7.36, 2.6],
  Kandi: [11.13, 2.94], Zogbodomey: [7.1, 2.1],
};

const REGION_COORDS: Record<string, [number, number]> = {
  Zou: [7.25, 2.1], Borgou: [9.85, 2.75], Mono: [6.55, 1.9],
  Ouémé: [6.6, 2.6], Atlantique: [6.45, 2.35], "—": [8.5, 2.2],
};

const START: [number, number] = [6.37, 2.42];

const DRIVERS = [
  { name: "Koffi Agossou", vehicle: "Toyota Hilux · AB 1234 CD", phone: "+229 97 81 23 45" },
  { name: "Sébastien Hounkpatin", vehicle: "Mercedes Sprinter · AB 5678 EF", phone: "+229 96 42 78 90" },
  { name: "Emmanuel Sossou", vehicle: "Renault Master · AB 9012 GH", phone: "+229 62 15 37 89" },
];

function getDest(location: string): [number, number] {
  return CITIES[location] || REGION_COORDS[location] || [8.5, 2.2];
}

function formatETA(m: number): string {
  if (m <= 0) return i18n.t("tracking.arriving");
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h}h ${min.toString().padStart(2, "0")}min`;
}

function formatSpeed(kmh: number): string {
  return `${Math.round(kmh)} km/h`;
}

function interpolate(a: [number, number], b: [number, number], t: number): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function distanceKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const la = ((a[0] * Math.PI) / 180);
  const lb = ((b[0] * Math.PI) / 180);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(la) * Math.cos(lb) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

interface Props {
  location: string;
  status: string;
}

export default function OrderTrackingMap({ location, status }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const truckRef = useRef<L.Marker | null>(null);
  const trailCompletedRef = useRef<L.Polyline | null>(null);
  const displayProgress = useRef(0.08);
  const targetProgress = useRef(0.08);
  const rafRef = useRef<number>(0);
  const lastTickTime = useRef(Date.now());

  const [eta, setEta] = useState(185);
  const [speed, setSpeed] = useState(42);
  const [driver] = useState(() => DRIVERS[Math.floor(Math.random() * DRIVERS.length)]);

  const dest = getDest(location);
  const totalDist = distanceKm(START, dest);
  const pct = Math.min(100, Math.round(displayProgress.current * 100));

  useEffect(() => {
    if (status !== "En livraison") return;
    const id = setInterval(() => {
      const now = Date.now();
      const dt = (now - lastTickTime.current) / 1000;
      lastTickTime.current = now;

      targetProgress.current = Math.min(targetProgress.current + 0.06, 1);
      const distCovered = totalDist * 0.06;
      setSpeed(distCovered / Math.max(dt, 1) * 3.6);
      setEta((e) => Math.max(0, e - 11));
    }, 3000);
    return () => clearInterval(id);
  }, [status, totalDist]);

  useEffect(() => {
    if (container.current && !mapRef.current) {
      const m = L.map(container.current, {
        zoomControl: false, dragging: false,
        attributionControl: false,
      }).setView(START, 6);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        className: "tracking-tiles",
      }).addTo(m);

      L.marker(START, {
        icon: L.divIcon({
          html: `<div style="width:14px;height:14px;border-radius:50%;background:#1a73e8;border:3px solid #fff;box-shadow:0 2px 8px rgba(26,115,232,.5);transition:transform .3s ease;" onmouseover="this.style.transform='scale(1.3)'" onmouseout="this.style.transform='scale(1)'"></div>`,
          className: "", iconSize: [14, 14], iconAnchor: [7, 7],
        }),
      }).addTo(m).bindPopup(t("tracking.departure") + " · Cotonou");

      L.marker(dest, {
        icon: L.divIcon({
          html: `<div style="position:relative;width:20px;height:20px;"><div style="position:absolute;inset:0;border-radius:50%;background:#e53935;opacity:.2;animation:pulse-dot 2s infinite;"></div><div style="position:absolute;inset:3px;border-radius:50%;background:#e53935;border:3px solid #fff;box-shadow:0 2px 8px rgba(229,57,53,.4);"></div></div>`,
          className: "", iconSize: [20, 20], iconAnchor: [10, 10],
        }),
      }).addTo(m).bindPopup(`Livraison · ${location}`);

      L.polyline([START, dest], {
        color: "rgba(0,0,0,0.12)", weight: 4, dashArray: "6,4",
      }).addTo(m);

      trailCompletedRef.current = L.polyline([START], {
        color: "#43a047", weight: 4, opacity: 0.9,
      }).addTo(m);

      mapRef.current = m;
    }
  }, []);

  useEffect(() => {
    const m = mapRef.current;
    if (!m || status !== "En livraison") return;

    let running = true;

    const animate = () => {
      if (!running) return;
      displayProgress.current += (targetProgress.current - displayProgress.current) * 0.06;

      if (Math.abs(targetProgress.current - displayProgress.current) < 0.0005) {
        displayProgress.current = targetProgress.current;
      } else {
        rafRef.current = requestAnimationFrame(animate);
      }

      const p = displayProgress.current;
      const pos: [number, number] = interpolate(START, dest, p);

      if (truckRef.current) m.removeLayer(truckRef.current);

      if (p < 1) {
        const angle = Math.atan2(dest[0] - START[0], dest[1] - START[1]) * (180 / Math.PI);
        truckRef.current = L.marker(pos, {
          icon: L.divIcon({
            html: `<div style="font-size:24px;transform:rotate(${angle}deg);filter:drop-shadow(0 2px 6px rgba(0,0,0,.4));transition:transform .6s cubic-bezier(.34,1.56,.64,1);">🚛</div>`,
            className: "", iconSize: [28, 28], iconAnchor: [14, 14],
          }),
        }).addTo(m);

        const partial = interpolate(START, dest, p * 0.5);
        m.setView([pos[0] + partial[0] * 0.2, pos[1] + partial[1] * 0.2], 6, { animate: true, duration: 1.2 });
      }

      if (trailCompletedRef.current) {
        const trailPos = interpolate(START, dest, p);
        trailCompletedRef.current.setLatLngs([START, trailPos]);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [status, dest]);

  const isDelivered = status === "Livrée";
  const isInTransit = status === "En livraison";

  return (
    <div>
      <style>{`
        @keyframes pulse-dot { 0%,100% { transform:scale(1); } 50% { transform:scale(1.5); } }
        @keyframes pulse-live { 0%,100% { opacity:1; } 50% { opacity:.4; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes widthIn { from { width:0%; } }
        .tracking-tiles { filter: none; }
      `}</style>

      <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        <div ref={container} style={{ width: "100%", height: 260, zIndex: 0 }} />

        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(transparent, rgba(0,0,0,0.75) 60%)",
          padding: "28px 16px 16px",
          zIndex: 10,
        }}>
          <div style={{
            background: colors.glassBg, backdropFilter: "blur(14px)",
            border: `1px solid ${colors.glassBorder}`,
            borderRadius: 14, padding: 14,
            animation: "slideUp .5s ease",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px rgba(34,197,94,.6)", animation: "pulse-live 1.5s infinite" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: colors.text, letterSpacing: ".3px" }}>{t("tracking.live")}</span>
                <span style={{ fontSize: 11, color: colors.textMuted }}>· {t("tracking.updatedEvery")}</span>
              </div>
              {isInTransit && (
                <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600, background: "rgba(34,197,94,.12)", padding: "2px 8px", borderRadius: 20 }}>
                  {pct}%
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: colors.text, whiteSpace: "nowrap" }}>Cotonou</span>
              <div style={{ flex: 1, height: 5, background: colors.borderLight, borderRadius: 3, overflow: "hidden", position: "relative" }}>
                <div style={{
                  width: `${isDelivered ? 100 : pct}%`, height: "100%",
                  background: "linear-gradient(90deg,#059669,#0a6e4a)",
                  borderRadius: 3,
                  transition: "width .8s cubic-bezier(.34,1.56,.64,1)",
                  boxShadow: "0 0 8px rgba(67,160,71,.4)",
                }} />
                <div style={{
                  position: "absolute", top: -2, left: `${isDelivered ? 99 : pct - 1}%`,
                  width: 9, height: 9, borderRadius: "50%",
                  background: "#43a047", border: "2px solid #fff",
                  boxShadow: "0 1px 4px rgba(0,0,0,.3)",
                  transition: "left .8s cubic-bezier(.34,1.56,.64,1)",
                }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 500, color: colors.text, whiteSpace: "nowrap" }}>{location}</span>
            </div>

            {isInTransit && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", animation: "slideUp .4s ease .1s both" }}>
                <div style={{ display: "flex", gap: 14, fontSize: 11 }}>
                  <div>
                    <span style={{ color: colors.textMuted }}>🚛 </span>
                    <span style={{ color: colors.text, fontWeight: 600 }}>{formatSpeed(speed)}</span>
                  </div>
                  <div>
                    <span style={{ color: colors.textMuted }}>📍 </span>
                    <span style={{ color: colors.text, fontWeight: 600 }}>{formatETA(eta)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isInTransit && (
        <div style={{
          marginTop: 12, padding: 12, borderRadius: 12,
          background: colors.glassBg, backdropFilter: "blur(8px)",
          border: `1px solid ${colors.glassBorder}`,
          animation: "slideUp .4s ease .2s both",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg,#1a73e8,#0d47a1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, color: "white", flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{driver.name}</div>
            <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>{driver.vehicle}</div>
          </div>
          <a href={`tel:${driver.phone.replace(/\s/g, "")}`} style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(34,197,94,.12)", border: "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#22c55e", fontSize: 18, textDecoration: "none",
            transition: "all .2s", flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </a>
        </div>
      )}

      {isDelivered && (
        <div style={{
          marginTop: 12, padding: 14, borderRadius: 12,
          background: "rgba(34,197,94,.08)",
          border: "1px solid rgba(34,197,94,.2)",
          display: "flex", alignItems: "center", gap: 10,
          animation: "slideUp .4s ease .1s both",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "#22c55e",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#22c55e" }}>{t("tracking.delivered")}</div>
            <div style={{ fontSize: 12, color: colors.textMuted }}>{t("tracking.deliveredTo")} {location}</div>
          </div>
        </div>
      )}
    </div>
  );
}
