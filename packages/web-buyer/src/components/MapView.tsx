import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { tCrop } from "../utils/i18n";

interface ParcelleFeature {
  id: string;
  culture: string;
  superficie: number;
  coordinates: [number, number][];
}

interface MapViewProps {
  parcelles: ParcelleFeature[];
  center?: [number, number];
  zoom?: number;
}

const colors = ["#1b5e20", "#1565c0", "#e65100", "#6a1b9a", "#c62828", "#2e7d32", "#f9a825"];

function MapView({ parcelles, center = [8.5, 2.5], zoom = 7 }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (mapRef.current && !instanceRef.current) {
      const map = L.map(mapRef.current, { zoomControl: true }).setView(center, zoom);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);
      instanceRef.current = map;
    }
    return () => {
      instanceRef.current?.remove();
      instanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = instanceRef.current;
    if (!map) return;
    map.eachLayer((l) => { if (l instanceof L.Polygon || l instanceof L.Marker) map.removeLayer(l); });

    parcelles.forEach((p, i) => {
      if (p.coordinates.length < 3) return;
      const color = colors[i % colors.length];
      L.polygon(p.coordinates as [number, number][], {
        color, weight: 2, fillOpacity: 0.2,
      }).addTo(map).bindPopup(`<b>${tCrop(p.culture)}</b><br/>${p.superficie} ha<br/>ID: ${p.id}`);
    });

    if (parcelles.length === 0) {
      L.marker(center).addTo(map).bindPopup("Centre de la zone");
    }
  }, [parcelles, center]);

  return (
    <div ref={mapRef} style={{ width: "100%", height: 400, borderRadius: 16, overflow: "hidden", zIndex: 0 }} />
  );
}

export default MapView;
