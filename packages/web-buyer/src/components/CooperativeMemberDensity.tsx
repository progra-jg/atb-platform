import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { listCooperatives } from "../services/cooperative";
import { REGIONS_BENIN } from "../types/cooperative";
import { Users, MapPin, CaretUp, CaretDown } from "@phosphor-icons/react";

export default function CooperativeMemberDensity() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [coops, setCoops] = useState<Awaited<ReturnType<typeof listCooperatives>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const all = await listCooperatives();
      if (mounted) { setCoops(all); setLoading(false); }
    })();
    return () => { mounted = false; };
  }, []);

  const densityData = useMemo(() => {
    const regionMap = new Map<string, { coops: number; members: number; revenue: number }>();
    coops.forEach((c) => {
      const existing = regionMap.get(c.region) ?? { coops: 0, members: 0, revenue: 0 };
      existing.coops += 1;
      existing.members += c.memberCount;
      existing.revenue += c.totalRevenueXof;
      regionMap.set(c.region, existing);
    });
    const maxMembers = Math.max(...Array.from(regionMap.values()).map((v) => v.members), 1);
    return REGIONS_BENIN.map((region) => {
      const data = regionMap.get(region);
      return {
        region,
        coops: data?.coops ?? 0,
        members: data?.members ?? 0,
        revenue: data?.revenue ?? 0,
        fillPct: maxMembers > 0 ? ((data?.members ?? 0) / maxMembers) * 100 : 0,
      };
    });
  }, [coops]);

  if (loading) {
    return (
      <div style={{
        background: colors.surface, borderRadius: 16, padding: 20,
        border: `1px solid ${colors.borderLight}`,
      }}>
        <div style={{ height: 18, width: "40%", background: colors.surfaceHover, borderRadius: 6, marginBottom: 16 }} />
        {[1,2,3,4,5].map((i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <div style={{ width: 60, height: 10, background: colors.surfaceHover, borderRadius: 4 }} />
            <div style={{ flex: 1, height: 10, background: colors.surfaceHover, borderRadius: 4 }} />
          </div>
        ))}
      </div>
    );
  }

  const sorted = [...densityData].sort((a, b) => b.members - a.members);
  const hasData = sorted.some((d) => d.members > 0);

  if (!hasData) {
    return (
      <div style={{
        background: colors.surface, borderRadius: 16, padding: 20,
        border: `1px solid ${colors.borderLight}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <MapPin size={16} color={colors.textMuted} />
          <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
            {t("cooperative.densityTitle")}
          </span>
        </div>
        <p style={{ fontSize: 12, color: colors.textMuted, textAlign: "center", padding: "12px 0" }}>
          {t("cooperative.noData")}
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: colors.surface, borderRadius: 16, padding: 20,
        border: `1px solid ${colors.borderLight}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <MapPin size={16} color={colors.accent} />
        <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
          {t("cooperative.densityTitle")}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {sorted.map((d, i) => (
          <motion.div
            key={d.region}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <span style={{
                width: 60, fontSize: 10, fontWeight: 500, color: colors.text,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                flexShrink: 0,
              }}>
                {d.region}
              </span>
              <div style={{
                flex: 1, height: 10, borderRadius: 5,
                background: colors.surfaceHover, overflow: "hidden",
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${d.fillPct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }}
                  style={{
                    height: "100%", borderRadius: 5,
                    background: `linear-gradient(90deg, ${colors.accent}, ${colors.accent}cc)`,
                    opacity: d.fillPct > 0 ? 0.85 : 0,
                  }}
                />
              </div>
              <div style={{
                minWidth: 36, textAlign: "right",
                fontSize: 10, fontWeight: 600, color: colors.text, flexShrink: 0,
              }}>
                {d.members}
              </div>
            </div>
            {d.coops > 0 && (
              <div style={{
                display: "flex", gap: 6, paddingLeft: 68, marginBottom: 4,
                fontSize: 9, color: colors.textMuted,
              }}>
                <span>{d.coops} coop{d.coops > 1 ? "s" : ""}</span>
                {d.revenue > 0 && (
                  <span>· {d.revenue.toLocaleString("fr-FR")} FCFA</span>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
