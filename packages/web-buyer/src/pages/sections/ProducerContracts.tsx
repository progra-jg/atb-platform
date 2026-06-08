import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, FileText, Eye, CaretDown, CaretUp,
  CheckCircle, Clock, XCircle, FileArrowDown,
} from "@phosphor-icons/react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { fetchContracts, getExportPdfUrl } from "../../services/contracts";
import type { FrameworkContract, ContractStatus } from "../../types/contract";
import { formatNumber } from "../../utils/format";

const STATUS_CONFIG: Record<ContractStatus, { color: string; bg: string }> = {
  brouillon: { color: "#6b7280", bg: "#6b728014" },
  envoye: { color: "#f59e0b", bg: "#f59e0b14" },
  en_negociation: { color: "#f97316", bg: "#f9731614" },
  signe: { color: "#3b82f6", bg: "#3b82f614" },
  actif: { color: "#059669", bg: "#05966914" },
  termine: { color: "#10b981", bg: "#10b98114" },
  resilie: { color: "#ef4444", bg: "#ef444414" },
};

export default function ProducerContracts() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: allContracts = [] } = useQuery({
    queryKey: ["contracts"],
    queryFn: () => fetchContracts(),
    retry: false,
  });

  const contracts = useMemo(() => {
    const list = Array.isArray(allContracts) ? allContracts : [];
    return list.filter((c) => c.producteurId === user?.id || !user?.id);
  }, [allContracts, user?.id]);

  const stats = useMemo(() => {
    const total = contracts.length;
    const active = contracts.filter((c) => c.statut === "actif").length;
    const completed = contracts.filter((c) => c.statut === "termine").length;
    const totalValue = contracts.reduce((s, c) => s + c.montantTotal, 0);
    return { total, active, completed, totalValue };
  }, [contracts]);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 20px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div onClick={() => navigate("/producer")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: colors.textSecondary, fontSize: 12 }}>
          <ArrowLeft size={14} />
          <span>{t("common.back")}</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <FileText size={18} color={colors.accent} weight="bold" />
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.text }}>
          {t("producer.contracts")}
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
        {[
          { label: t("producer.total"), value: String(stats.total), color: colors.accent },
          { label: t("producer.active"), value: String(stats.active), color: colors.success },
          { label: t("producer.completed"), value: String(stats.completed), color: colors.info },
          { label: t("producer.totalValue"), value: `${formatNumber(stats.totalValue)}`, color: colors.warning },
        ].map((s) => (
          <div key={s.label} style={{ background: colors.surfaceHover, borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: colors.text }}>{s.value}</div>
            <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {contracts.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: colors.textMuted, fontSize: 14 }}>
          {t("producer.noContracts")}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {contracts.map((c) => {
          const cfg = STATUS_CONFIG[c.statut] || STATUS_CONFIG.brouillon;
          const isOpen = expanded === c.id;
          return (
            <div key={c.id} style={{
              background: colors.surface, borderRadius: 12,
              border: `1px solid ${colors.borderLight}`, overflow: "hidden",
            }}>
              <div
                onClick={() => setExpanded(isOpen ? null : c.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 16px", cursor: "pointer",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.color }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>
                      {c.culture} — {formatNumber(c.montantTotal)} {c.devise}
                    </div>
                    <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>
                      {c.dateDebut} → {c.dateFin}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
                    color: cfg.color, background: cfg.bg,
                  }}>
                    {t(`contracts.status.${c.statut}`, { defaultValue: c.statut })}
                  </span>
                  {isOpen ? <CaretUp size={14} color={colors.textMuted} /> : <CaretDown size={14} color={colors.textMuted} />}
                </div>
              </div>

              {isOpen && (
                <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${colors.borderLight}`, paddingTop: 12, marginTop: 0 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>
                    <div>
                      <span style={{ color: colors.textMuted }}>{t("contracts.csvHeaders.volume")}:</span>{" "}
                      <span style={{ fontWeight: 600, color: colors.text }}>{formatNumber(c.volumeKg)} kg</span>
                    </div>
                    <div>
                      <span style={{ color: colors.textMuted }}>{t("contracts.csvHeaders.price")}:</span>{" "}
                      <span style={{ fontWeight: 600, color: colors.text }}>{formatNumber(c.prixKg)} {c.devise}</span>
                    </div>
                    {c.conditions && (
                      <div style={{ gridColumn: "1 / -1" }}>
                        <span style={{ color: colors.textMuted }}>{t("contracts.csvHeaders.conditions")}:</span>{" "}
                        <span style={{ color: colors.text }}>{c.conditions}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <a
                      href={getExportPdfUrl(c.id)}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "flex", alignItems: "center", gap: 4,
                        padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600,
                        background: colors.surfaceHover, color: colors.accent,
                        textDecoration: "none", border: `1px solid ${colors.borderLight}`,
                      }}
                    >
                      <FileArrowDown size={14} />
                      {t("producer.exportPdf")}
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
