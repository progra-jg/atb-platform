import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { useIsMobile } from "../hooks/useMediaQuery";
import FadeIn from "../components/FadeIn";
import Breadcrumb from "../components/Breadcrumb";
import { PageTitle } from "../components/ResponsiveContainer";
import EmptyState from "../components/EmptyState";
import Badge from "../components/Badge";
import { fetchOrders } from "../services/orders";
import { fetchCertificates } from "../services/lots";
import { downloadPDF } from "../utils/export";
import { formatDate } from "../utils/format";
import {
  FileArrowDown, SealCheck, ClipboardText, DownloadSimple,
} from "@phosphor-icons/react";

function downloadTxt(filename: string, content: string) {
  const bom = "\uFEFF";
  const blob = new Blob([bom + content], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename;
  a.click(); URL.revokeObjectURL(a.href);
}

export default function Downloads() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  const [tab, setTab] = React.useState<"orders" | "certificates">("orders");

  const { data: orders } = useQuery({ queryKey: ["orders"], queryFn: fetchOrders });
  const { data: certificates } = useQuery({ queryKey: ["certificates"], queryFn: fetchCertificates });

  return (
    <FadeIn delay={0.05}>
      <div>
        <Breadcrumb crumbs={[
          { label: t("nav.dashboard"), path: "/dashboard" },
          { label: t("downloads.title") },
        ]} />
        <PageTitle title={t("downloads.pageTitle")} subtitle={t("downloads.subtitle")} />

        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {(["orders", "certificates"] as const).map((tb) => (
            <button key={tb} onClick={() => setTab(tb)} style={{
              background: tab === tb ? `linear-gradient(135deg, ${colors.accent}, #34d399)` : colors.surface,
              color: tab === tb ? "white" : colors.text,
              border: tab === tb ? "none" : `1.5px solid ${colors.borderLight}`,
              padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 500,
              cursor: "pointer", transition: "all 0.15s",
            }}>{tb === "orders" ? t("downloads.invoices") : t("downloads.certificates")}</button>
          ))}
        </div>

        {tab === "orders" && (
          <div style={{ display: "grid", gap: 10 }}>
            {(!orders || orders.length === 0) ? (
              <EmptyState icon={<ClipboardText size={48} />} title={t("downloads.noOrders")} description={t("downloads.noOrdersDesc")} />
            ) : orders.map((o: any, i: number) => (
              <div key={o.id} style={{
                background: colors.surface, borderRadius: 12, padding: isMobile ? 12 : 16,
                border: `1.5px solid ${colors.borderLight}`, boxShadow: colors.shadowSm,
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
                animation: `fadeSlideUp 0.3s ease ${i * 0.03}s both`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <ClipboardText size={20} color={colors.accent} weight="fill" style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: colors.text }}>{o.id}</div>
                    <div style={{ fontSize: 11, color: colors.textMuted }}>{o.lot} · {o.date}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Badge text={String(t("lotStatus." + o.statut, o.statut))} variant={o.statut === "Livrée" ? "success" : "info"} size="sm" />
                  <button onClick={() => {
                    const crop = t("crops." + o.culture, o.culture);
                    const content = `FACTURE\n${"=".repeat(30)}\nCommande: ${o.id}\nProduit: ${o.lot}\nCulture: ${crop}\nQuantité: ${o.quantite}\nPrix unitaire: ${o.prixUnitaire}\nTotal: ${o.total}\nStatut: ${o.statut}\nDate: ${o.date}\nLivraison: ${o.livraison || "—"}\n${"=".repeat(30)}\nATB AgriTrace — Document généré le ${formatDate(new Date())}`;
                    downloadTxt(`facture-${o.id}.txt`, content);
                  }} style={{
                    background: "transparent", border: `1.5px solid ${colors.borderLight}`,
                    borderRadius: 6, padding: "5px 10px", cursor: "pointer",
                    color: colors.text, fontSize: 11, fontWeight: 500,
                    display: "flex", alignItems: "center", gap: 4,
                  }}><DownloadSimple size={12} /> {t("common.download")}</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "certificates" && (
          <div style={{ display: "grid", gap: 10 }}>
            {(!certificates || certificates.length === 0) ? (
              <EmptyState icon={<SealCheck size={48} />} title={t("downloads.noCerts")} description={t("downloads.noCertsDesc")} />
            ) : certificates.map((c: any, i: number) => (
              <div key={c.id} style={{
                background: colors.surface, borderRadius: 12, padding: isMobile ? 12 : 16,
                border: `1.5px solid ${colors.borderLight}`, boxShadow: colors.shadowSm,
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
                animation: `fadeSlideUp 0.3s ease ${i * 0.03}s both`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <SealCheck size={20} color={colors.success} weight="fill" style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: colors.text }}>{c.type}</div>
                    <div style={{ fontSize: 11, color: colors.textMuted }}>{c.lot} · {c.emetteur}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Badge text={String(t("lotStatus." + c.statut, c.statut))} variant={c.statut === "Valide" ? "success" : "warning"} size="sm" />
                  <button onClick={() => downloadPDF({ id: c.id, type: c.type, emetteur: c.emetteur, expire: c.expire }, `certificat-${c.id}`)} style={{
                    background: "transparent", border: `1.5px solid ${colors.borderLight}`,
                    borderRadius: 6, padding: "5px 10px", cursor: "pointer",
                    color: colors.text, fontSize: 11, fontWeight: 500,
                    display: "flex", alignItems: "center", gap: 4,
                  }}><DownloadSimple size={12} /> PDF</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </FadeIn>
  );
}
