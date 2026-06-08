import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Package, PlusCircle, PencilSimple, ArrowLeft, CaretDown, Leaf,
} from "@phosphor-icons/react";
import { useTheme } from "../../context/ThemeContext";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { useAuth } from "../../context/AuthContext";
import { fetchLots } from "../../services/lots";
import { getAllFarmerLots, updateFarmerLot } from "../../services/farmerLots";
import { formatNumber } from "../../utils/format";
import Badge from "../../components/Badge";
import type { Lot } from "../../types";

const STATUS_CYCLE: Array<Lot["statut"]> = ["Disponible", "En transit", "Vendu"];

export default function ProducerLotList() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [statusOpen, setStatusOpen] = useState<string | null>(null);

  const { data: lots = [], refetch } = useQuery({
    queryKey: ["lots"],
    queryFn: () => fetchLots(),
  });

  const myLots = getAllFarmerLots().filter((l: Lot) => l.producteurId === user?.id);
  const farmerLots = [...myLots, ...lots.filter((l: Lot) => l.producteurId === user?.id || l.producteur === user?.company)];
  const seen = new Set<string>();
  const dedupedLots = farmerLots.filter((l: Lot) => { if (seen.has(l.id)) return false; seen.add(l.id); return true; });

  const handleStatusChange = (lotId: string, newStatus: Lot["statut"]) => {
    updateFarmerLot(lotId, { statut: newStatus });
    setStatusOpen(null);
    refetch();
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div onClick={() => navigate("/producer")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: colors.textSecondary, fontSize: 12 }}>
          <ArrowLeft size={14} />
          <span>{t("common.back")}</span>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => navigate("/producer/lots/new")}
          style={{
            background: colors.accent, border: "none", color: "#fff",
            padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <PlusCircle size={14} weight="bold" />
          {t("producer.newLot")}
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Package size={18} color={colors.accent} weight="bold" />
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.text }}>
          {t("producer.myLots")}
        </h2>
        <span style={{ fontSize: 12, color: colors.textMuted, fontWeight: 500 }}>
          ({dedupedLots.length})
        </span>
      </div>

      {dedupedLots.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{
            textAlign: "center", padding: "60px 24px",
            background: colors.surface, borderRadius: 16,
            border: `1px solid ${colors.borderLight}`,
          }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20,
            background: `linear-gradient(135deg, ${colors.accent}15, ${colors.info}10)`,
            margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Leaf size={34} color={colors.accent} weight="thin" />
          </div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.text }}>
            {t("producer.startTitle")}
          </h3>
          <p style={{ fontSize: 13, color: colors.textMuted, margin: "8px 0 20px", maxWidth: 360, marginInline: "auto", lineHeight: 1.5 }}>
            {t("producer.createFirstSub")}
          </p>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/producer/lots/new")}
            style={{ background: colors.accent, border: "none", color: "#fff", padding: "12px 28px", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <PlusCircle size={16} weight="bold" />
            {t("producer.newLot")}
          </motion.button>
        </motion.div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {dedupedLots.map((lot: Lot) => (
            <motion.div key={lot.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{
                background: colors.surface, borderRadius: 12,
                border: `1px solid ${colors.borderLight}`,
                padding: "14px 16px",
                display: "flex", alignItems: "center", gap: 12,
              }}
            >
              <div onClick={() => navigate(`/producer/lots/${lot.id}`)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: `${lot.statut === "Disponible" ? colors.success : colors.warning}14`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Package size={18} color={lot.statut === "Disponible" ? colors.success : colors.warning} weight="bold" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>
                    {lot.id} &mdash; {lot.culture}
                  </div>
                  <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                    {lot.quantite} &middot; {formatNumber(lot.prix)} {t("common.currency")}/kg
                    {lot.region ? ` &middot; ${lot.region}` : ""}
                  </div>
                </div>
              </div>
              <div style={{ position: "relative" }}>
                <div onClick={() => setStatusOpen(statusOpen === lot.id ? null : lot.id)}
                  style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  <Badge text={t("lotStatus." + lot.statut, lot.statut)}
                    variant={lot.statut === "Disponible" ? "success" : lot.statut === "En transit" ? "warning" : "error"} size="sm" pill />
                  <CaretDown size={10} color={colors.textMuted} />
                </div>
                {statusOpen === lot.id && (
                  <div style={{
                    position: "absolute", top: "100%", right: 0, zIndex: 10, marginTop: 4,
                    background: colors.surface, borderRadius: 8, border: `1px solid ${colors.border}`,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.12)", minWidth: 130, overflow: "hidden",
                  }}>
                    {STATUS_CYCLE.map((s) => (
                      <div key={s} onClick={() => handleStatusChange(lot.id, s)}
                        style={{
                          padding: "8px 14px", fontSize: 12, cursor: "pointer",
                          color: s === lot.statut ? colors.accent : colors.text,
                          fontWeight: s === lot.statut ? 600 : 400,
                          background: s === lot.statut ? `${colors.accent}0c` : "transparent",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = colors.surfaceHover}
                        onMouseLeave={(e) => e.currentTarget.style.background = s === lot.statut ? `${colors.accent}0c` : "transparent"}
                      >
                        {t("lotStatus." + s, s)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div onClick={() => navigate(`/producer/lots/${lot.id}/edit`)} style={{ cursor: "pointer", display: "flex", alignItems: "center", padding: 4 }}>
                <PencilSimple size={14} color={colors.textMuted} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
