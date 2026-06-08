import React, { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { RegionWeather } from "../../types/weather";
import { useTheme } from "../../context/ThemeContext";

const tempToColor = (temp: number): string => {
  if (temp >= 36) return "#dc2626";
  if (temp >= 33) return "#ea580c";
  if (temp >= 30) return "#d97706";
  if (temp >= 27) return "#ca8a04";
  if (temp >= 24) return "#65a30d";
  return "#16a34a";
};

function getFillOpacity(selected: boolean, isTarget: boolean): number {
  if (!selected) return 0.7;
  return isTarget ? 0.9 : 0.2;
}

function normalizeName(name: string): string {
  if (name === "Kouffo") return "Couffo";
  if (name === "Atakora") return "Atacora";
  if (name === "Oueme") return "Ouémé";
  if (name === "Atlanique") return "Atlantique";
  return name;
}

interface BeninMapProps {
  regions: RegionWeather[];
  selectedRegion: string | null;
  onSelectRegion: (name: string | null) => void;
  height?: number;
}

const BeninMap: React.FC<BeninMapProps> = ({ regions, selectedRegion, onSelectRegion, height = 420 }) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<L.Map | null>(null);
  const geoLayerRef = useRef<L.GeoJSON | null>(null);
  const selRef = useRef(selectedRegion);
  const onSelectRef = useRef(onSelectRegion);
  selRef.current = selectedRegion;
  onSelectRef.current = onSelectRegion;

  const regionMap = useMemo(() => {
    const map = new Map<string, RegionWeather>();
    for (const r of regions) map.set(r.name, r);
    return map;
  }, [regions]);

  useEffect(() => {
    if (mapRef.current && !instanceRef.current) {
      const map = L.map(mapRef.current, {
        center: [9.5, 2.3],
        zoom: 7,
        zoomControl: true,
        scrollWheelZoom: true,
        dragging: true,
        attributionControl: false,
      });
      instanceRef.current = map;
    }
    return () => {
      instanceRef.current?.remove();
      instanceRef.current = null;
    };
  }, []);

  const loadedRef = useRef(false);

  useEffect(() => {
    const map = instanceRef.current;
    if (!map || loadedRef.current) return;

    const geoUrl = "https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/main/releaseData/gbOpen/BEN/ADM1/geoBoundaries-BEN-ADM1.geojson";

    fetch(geoUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load GeoJSON");
        return res.json();
      })
      .then((data) => {
        const layer = L.geoJSON(data, {
          style: () => ({
            fillColor: "#65a30d",
            fillOpacity: 0.5,
            color: "#ffffff",
            weight: 1.2,
            opacity: 0.9,
          }),
          onEachFeature: (feature, layer) => {
            const name = feature?.properties?.shapeName ?? "";
            const normalized = normalizeName(name);
            const region = regionMap.get(normalized);

            layer.on({
              click: () => {
                const current = selRef.current;
                onSelectRef.current(current === normalized ? null : normalized);
              },
              dblclick: () => {
                navigate(`/lots?region=${encodeURIComponent(normalized)}`);
              },
              mouseover: (e) => {
                const target = e.target;
                if (selRef.current !== normalized) {
                  target.setStyle({ weight: 2.5 });
                }
                if (region) {
                  const condLabel = region.condition === "Données simulées" ? t("weatherInsights.simulated") : region.condition;
                  target.bindTooltip(
                    `<div style="font-weight:600;font-size:13px;margin-bottom:4px">${normalized}</div>` +
                    `<div>${region.temp}°C · 💧 ${region.rain}mm · 💨 ${region.humidity}%</div>` +
                    `<div>${condLabel}</div>`,
                    { direction: "top", offset: [0, -8], className: "benin-tooltip" }
                  ).openTooltip();
                }
              },
              mouseout: (e) => {
                const target = e.target;
                if (selRef.current !== normalized) {
                  target.setStyle({ weight: 1.2 });
                }
                target.closeTooltip();
              },
            });
          },
        });

        layer.addTo(map);
        geoLayerRef.current = layer;
        loadedRef.current = true;
        map.fitBounds(layer.getBounds(), { padding: [10, 10] });
      })
      .catch(() => {
      });

    return () => {
      if (geoLayerRef.current) {
        map.removeLayer(geoLayerRef.current);
        geoLayerRef.current = null;
        loadedRef.current = false;
      }
    };
  }, []);

  useEffect(() => {
    const map = instanceRef.current;
    if (!map || !geoLayerRef.current) return;
    geoLayerRef.current.eachLayer((layer: any) => {
      const name = layer?.feature?.properties?.shapeName ?? "";
      const normalized = normalizeName(name);
      const region = regionMap.get(normalized);
      const temp = region?.temp ?? 30;
      const isSelected = selectedRegion === normalized;
      layer.setStyle({
        fillColor: tempToColor(temp),
        fillOpacity: getFillOpacity(!!selectedRegion, isSelected),
        color: isSelected ? colors.accent : "#ffffff",
        weight: isSelected ? 2.5 : 1.2,
      });
    });
  }, [regions, selectedRegion, colors.accent, regionMap]);

  return (
    <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", border: `1.5px solid ${colors.border}` }}>
      <div ref={mapRef} style={{ width: "100%", height, background: colors.bg }} />
      <style>{`
        .benin-tooltip {
          background: ${colors.surfaceElevated} !important;
          border: 1.5px solid ${colors.border} !important;
          border-radius: 8px !important;
          padding: 6px 10px !important;
          box-shadow: ${colors.shadowMd} !important;
          font-size: 12px !important;
          color: ${colors.text} !important;
        }
        .benin-tooltip::before {
          border-top-color: ${colors.border} !important;
        }
      `}</style>
    </div>
  );
};

export default BeninMap;
