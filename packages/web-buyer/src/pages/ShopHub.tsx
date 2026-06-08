import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Package, Users, ChartBar, MagnifyingGlass, ArrowRight, Star } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { useIsMobile } from "../hooks/useMediaQuery";
import { fadeUp } from "../utils/animations";

export default function ShopHub() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [params] = useSearchParams();
  const q = params.get("q") || "";

  const hubs = [
    { key: "catalog", icon: Package, path: "/lots", color: colors.accent, desc: "Parcourez tous les produits disponibles par culture, région et certification" },
    { key: "farmers", icon: Users, path: "/farmers", color: colors.info, desc: "Découvrez les producteurs partners et leur historique" },
    { key: "prices", icon: ChartBar, path: "/prices", color: colors.warning, desc: "Consultez l'évolution des prix et définissez des alertes" },
  ];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px 60px" }}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: `linear-gradient(135deg, #2563eb, #1d4ed8)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Package size={20} color="#fff" weight="bold" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: colors.text }}>
              {t("nav.shop")}
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.textMuted }}>
              {t("dashboard.hubShopDesc")}
            </p>
          </div>
        </div>

        <div style={{ position: "relative", marginTop: 20, marginBottom: 28 }}>
          <MagnifyingGlass size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: colors.textMuted }} />
          <input
            value={q}
            onChange={(e) => {
              const v = e.target.value;
              if (v.length >= 2) navigate(`/lots?q=${encodeURIComponent(v)}`);
            }}
            placeholder="Rechercher un produit, une région, un producteur..."
            style={{
              width: "100%", padding: "14px 14px 14px 42px", borderRadius: 12,
              fontSize: 14, border: `1.5px solid ${colors.border}`,
              background: colors.surface, color: colors.text,
              fontFamily: "inherit", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
      </motion.div>

      <div style={{
        display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16,
      }}>
        {hubs.map((h) => {
          const Icon = h.icon;
          return (
            <motion.div key={h.key} variants={fadeUp} initial="hidden" animate="visible" onClick={() => navigate(h.path)}
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                background: colors.surface, borderRadius: 16, padding: "24px 20px",
                border: `1.5px solid ${colors.borderLight}`, cursor: "pointer",
                boxShadow: colors.shadowXs,
              }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${h.color}15`, display: "flex",
                alignItems: "center", justifyContent: "center", marginBottom: 14,
              }}>
                <Icon size={22} weight="fill" color={h.color} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: colors.text, marginBottom: 4 }}>
                {t("nav." + h.key)}
              </div>
              <div style={{ fontSize: 12, color: colors.textMuted, lineHeight: 1.5, marginBottom: 14 }}>
                {h.desc}
              </div>
              <div style={{ fontSize: 12, color: h.color, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                {t("common.viewAll")} <ArrowRight size={12} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
