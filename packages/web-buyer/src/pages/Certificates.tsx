import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { tCrop } from "../utils/i18n";
import { useQuery } from "@tanstack/react-query";
import {
  SealCheck, FileText, Cube, ChartBar, DownloadSimple, FilePdf, FileCode,
  MagnifyingGlass, CalendarBlank, ShieldCheck, Clock, WarningCircle, Leaf,
} from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import FadeIn from "../components/FadeIn";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import IconButton from "../components/IconButton";
import Breadcrumb from "../components/Breadcrumb";
import { PageTitle } from "../components/ResponsiveContainer";
import { useIsMobile, useIsSmall } from "../hooks/useMediaQuery";
import { fetchCertificates } from "../services/lots";
import type { Certificate } from "../types";
import { downloadCSV, downloadPDF, downloadXML } from "../utils/export";
import Badge, { Tag } from "../components/Badge";

const typeIcons: Record<string, React.ReactNode> = {
  "EUDR Due Diligence": <ShieldCheck size={14} color="#059669" weight="fill" />,
  "GlobalGAP": <SealCheck size={14} color="#e65100" weight="fill" />,
  "Certification Bio": <Leaf size={14} color="#2563eb" weight="fill" />,
};

function Skeleton({ h = 20, w = "100%", r = 6 }: { h?: number; w?: string | number; r?: number }) {
  const { colors } = useTheme();
  return <div style={{ height: h, width: typeof w === "number" ? w : w, borderRadius: r, background: `linear-gradient(90deg, ${colors.borderLight} 25%, ${colors.surface} 50%, ${colors.borderLight} 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.2s ease-in-out infinite" }} />;
}

function daysUntil(expireStr: string): number {
  const [d, m, y] = expireStr.split("/").map(Number);
  const exp = new Date(y, m - 1, d);
  return Math.ceil((exp.getTime() - Date.now()) / 86400000);
}

function Certificates() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  const isSmall = useIsSmall();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const { data: certs, isLoading, isError } = useQuery({ queryKey: ["certificates"], queryFn: fetchCertificates });

  const list = certs ?? [];

  const filtered = useMemo(() => {
    let result = filter === "all" ? list : list.filter((c: Certificate) => c.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((c: Certificate) =>
        c.id.toLowerCase().includes(q) || c.lot.toLowerCase().includes(q) ||
        c.culture.toLowerCase().includes(q) || c.emetteur.toLowerCase().includes(q)
      );
    }
    return result;
  }, [list, filter, search]);

  const stats = useMemo(() => {
    const expiringSoon = list.filter((c: Certificate) => {
      const d = daysUntil(c.expire);
      return d > 0 && d <= 30;
    });
    return {
      total: list.length,
      verified: list.filter((c) => c.blockchain).length,
      compliant: list.filter((c) => c.statut === "Valide").length,
      complianceRate: list.length ? Math.round((list.filter((c) => c.statut === "Valide").length / list.length) * 100) : 0,
      expiringSoon: expiringSoon.length,
      avgValidity: list.length ? Math.round(list.reduce((s, c) => s + daysUntil(c.expire), 0) / list.length) : 0,
    };
  }, [list]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((c) => c.id)));
  };

  const batchDownload = () => {
    const toDownload = list.filter((c) => selected.has(c.id));
    toDownload.forEach((cert) => downloadPDF({ id: cert.id, type: cert.type, lot: cert.lot, culture: cert.culture, statut: cert.statut, emetteur: cert.emetteur, expire: cert.expire }, `certificat-${cert.id}`));
  };

  const typeKeys = [...new Set(list.map((c) => c.type))];

  const getExpiryStatus = (days: number) => {
    if (days < 0) return { label: t("certificates.expiry.expired"), color: "#dc2626", bg: "#fef2f2" };
    if (days <= 30) return { label: `${t("certificates.expiry.soon")}${days}`, color: "#dc2626", bg: "#fef2f2" };
    if (days <= 90) return { label: `${days}${t("certificates.expiry.days")}`, color: "#d97706", bg: "#fffbeb" };
    return { label: `${days}${t("certificates.expiry.days")}`, color: "#059669", bg: "#ecfdf5" };
  };

  if (isLoading) {
    return (
      <FadeIn>
        <div style={{ padding: isMobile ? 12 : 24 }}>
          <Skeleton h={28} w={240} r={8} /><Skeleton h={14} w={360} r={6} />
          <div style={{ display: "grid", gridTemplateColumns: isSmall ? "1fr 1fr" : "repeat(auto-fit, minmax(200px, 1fr))", gap: isMobile ? 10 : 16, marginTop: 20 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} style={{ background: colors.surface, borderRadius: 16, padding: isMobile ? 14 : 20 }}><Skeleton h={36} w={60} r={6} /><Skeleton h={12} w={120} r={6} /></div>)}
          </div>
        </div>
      </FadeIn>
    );
  }

  if (isError) {
    return (
      <FadeIn>
        <div style={{ padding: isMobile ? 12 : 24, textAlign: "center", paddingTop: 60 }}>
          <FileText size={48} style={{ opacity: 0.3, marginBottom: 12, color: colors.textMuted }} />
          <h2 style={{ color: colors.text, margin: "0 0 8px" }}>{t("certificates.error")}</h2>
          <p style={{ color: colors.textMuted, marginBottom: 20 }}>{t("certificates.errorDesc")}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>{t("certificates.retry")}</Button>
        </div>
      </FadeIn>
    );
  }

  return (
    <FadeIn delay={0.05}>
      <div style={{ padding: isMobile ? 12 : 24 }}>
        <Breadcrumb crumbs={[{ label: t("nav.dashboard"), path: "/dashboard" }, { label: t("nav.certificates") }]} />
        <PageTitle title={t("certificates.title")} subtitle={t("certificates.subtitle")} />

        <div style={{ display: "grid", gridTemplateColumns: isSmall ? "1fr 1fr" : "repeat(auto-fit, minmax(160px, 1fr))", gap: isMobile ? 10 : 16, marginBottom: isMobile ? 16 : 24, marginTop: isMobile ? 14 : 20 }}>
          {[
            { label: t("certificates.stats.total"), value: stats.total, icon: FileText, color: colors.accent },
            { label: t("certificates.stats.blockchain"), value: stats.verified, icon: Cube, color: "#7c3aed" },
            { label: t("certificates.stats.compliant"), value: `${stats.complianceRate}%`, icon: ChartBar, color: "#d97706" },
            { label: t("certificates.stats.active"), value: stats.compliant, icon: SealCheck, color: "#059669" },
            { label: t("certificates.stats.expires"), value: stats.expiringSoon, icon: WarningCircle, color: stats.expiringSoon > 0 ? "#dc2626" : "#059669" },
            { label: t("certificates.stats.validity"), value: `${stats.avgValidity}j`, icon: CalendarBlank, color: "#2563eb" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} hoverable={false} style={{ padding: isMobile ? 14 : 20, animation: `fadeSlideUp 0.4s ease ${i * 0.05}s both` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${stat.color}14`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={16} color={stat.color} weight="fill" />
                  </div>
                  <span style={{ fontSize: isMobile ? 11 : 13, color: colors.textMuted }}>{stat.label}</span>
                </div>
                <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: stat.label === t("certificates.stats.expires") && stats.expiringSoon > 0 ? colors.error : colors.text }}>{stat.value}</div>
              </Card>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: isMobile ? 14 : 20, flexWrap: "wrap", alignItems: "center" }}>
          {["all", ...typeKeys].map((f) => (
            <Button key={f} variant={filter === f ? "primary" : "ghost"} size="sm"
              onClick={() => setFilter(f)}>
              {f === "all" ? t("certificates.all") : f}
            </Button>
          ))}
          <div style={{ position: "relative", flex: isMobile ? "1 1 100%" : "0 1 220px", marginTop: isMobile ? 4 : 0 }}>
            <MagnifyingGlass size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: colors.textMuted }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("certificates.search")} style={{
              width: "100%", padding: "8px 10px 8px 30px", borderRadius: 10, fontSize: 13,
              border: `1.5px solid ${colors.borderLight}`, outline: "none",
              background: colors.inputBg, color: colors.text, boxSizing: "border-box",
              transition: "border-color 0.15s",
            }}
              onFocus={(e) => { e.currentTarget.style.borderColor = colors.accent; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = colors.borderLight; }} />
          </div>
          <div style={{ flex: 1 }} />
          <Button variant={selectMode ? "primary" : "ghost"} size="sm"
            icon={<SealCheck size={16} weight={selectMode ? "fill" : "regular"} />}
            onClick={() => { setSelectMode(!selectMode); setSelected(new Set()); }}>
            {t("certificates.select")}
          </Button>
          <Button variant="ghost" size="sm" icon={<DownloadSimple size={16} />}
            onClick={() => {
              const headers = [t("certificates.table.id"), t("certificates.table.type"), t("certificates.table.lot"), t("certificates.table.culture"), t("certificates.table.statut"), t("certificates.table.emetteur"), t("certificates.table.expire")];
              const rows = filtered.map((c: Certificate) => [c.id, c.type, c.lot, c.culture, c.statut, c.emetteur, c.expire]);
              downloadCSV(headers, rows, `certificats-${new Date().toISOString().slice(0, 10)}`);
            }}
            style={{ border: `1.5px solid ${colors.borderLight}` }}>
            {t("certificates.export")}
          </Button>
        </div>

        {selectMode && selected.size > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "10px 16px", background: colors.accentLight, borderRadius: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: colors.accent }}>{selected.size} {t("certificates.batch.selected")}</span>
            <Button variant="primary" size="sm" icon={<DownloadSimple size={14} />} onClick={batchDownload}>
              {t("certificates.batch.downloadAll")}
            </Button>
            <button onClick={() => setSelected(new Set())} style={{ background: "none", border: "none", color: colors.textMuted, fontSize: 12, cursor: "pointer" }}>{t("certificates.deselect")}</button>
          </div>
        )}

        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map((cert: Certificate, i: number) => {
              const days = daysUntil(cert.expire);
              const exp = getExpiryStatus(days);
              return (
                <div key={cert.id} style={{ animation: `fadeSlideUp 0.3s ease ${i * 0.03}s both` }}>
                  <Card hoverable={false} style={{ padding: 14, border: selectMode && selected.has(cert.id) ? `2px solid ${colors.accent}` : `1.5px solid ${colors.borderLight}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {selectMode && (
                          <input type="checkbox" checked={selected.has(cert.id)} onChange={() => toggleSelect(cert.id)} style={{ accentColor: colors.accent }} />
                        )}
                        <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{cert.type}</span>
                        {cert.blockchain && <Cube size={14} color="#6a1b9a" weight="fill" />}
                      </div>
                      <Badge text={t("lotStatus." + cert.statut, cert.statut)} variant={cert.statut === "Valide" ? "success" : cert.statut === "Expiré" ? "error" : "warning"} size="sm" pill={false} />
                    </div>
                    <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>Lot: {cert.lot} — {tCrop(cert.culture)}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: colors.textMuted }}>{t("certificates.table.expire")}: {cert.expire}</span>
                      <span style={{ background: exp.bg, color: exp.color, padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{exp.label}</span>
                    </div>
                    <Button variant="primary" size="sm" fullWidth onClick={() => downloadPDF({ id: cert.id, type: cert.type, lot: cert.lot, culture: cert.culture, statut: cert.statut, emetteur: cert.emetteur, expire: cert.expire }, `certificat-${cert.id}`)}>{t("certificates.download")}</Button>
                  </Card>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ background: colors.surface, borderRadius: 16, overflow: "hidden", boxShadow: colors.shadowMd, border: `1.5px solid ${colors.border}` }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: `linear-gradient(135deg, ${colors.statBg}, ${colors.surface})`, borderBottom: `1px solid ${colors.border}` }}>
                  {selectMode && <th style={{ padding: "12px 16px", width: 40 }}>
                    <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={selectAll} style={{ accentColor: colors.accent }} />
                  </th>}
                  {[t("certificates.table.id"), t("certificates.table.type"), t("certificates.table.lot"), t("certificates.table.culture"), t("certificates.table.statut"), t("certificates.table.blockchain"), t("certificates.table.emetteur"), t("certificates.table.expire"), t("certificates.table.actions")].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((cert: Certificate, i: number) => {
                  const days = daysUntil(cert.expire);
                  const exp = getExpiryStatus(days);
                  return (
                    <tr key={cert.id} style={{
                      borderBottom: `1px solid ${colors.borderLight}`,
                      background: selectMode && selected.has(cert.id) ? colors.accentLight + "22" : "transparent",
                      animation: `fadeSlideUp 0.3s ease ${i * 0.02}s both`,
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.02)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = selectMode && selected.has(cert.id) ? colors.accentLight + "22" : "transparent"; }}>
                      {selectMode && (
                        <td style={{ padding: "12px 16px" }}>
                          <input type="checkbox" checked={selected.has(cert.id)} onChange={() => toggleSelect(cert.id)} style={{ accentColor: colors.accent }} />
                        </td>
                      )}
                      <td style={{ padding: "12px 16px", fontSize: 12, color: colors.textMuted, fontFamily: "monospace" }}>{cert.id}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500, color: colors.text, display: "flex", alignItems: "center", gap: 6 }}>
                        {typeIcons[cert.type] || <SealCheck size={14} color={colors.textMuted} />} {cert.type}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: colors.text }}>{cert.lot}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: colors.text }}>{tCrop(cert.culture)}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <Badge text={t("lotStatus." + cert.statut, cert.statut)} variant={cert.statut === "Valide" ? "success" : cert.statut === "Expiré" ? "error" : "warning"} size="sm" pill={false} />
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {cert.blockchain ? (
                          <Badge text={t("certificates.verified")} variant="info" icon={<Cube size={11} weight="fill" />} size="sm" />
                        ) : (
                          <span style={{ color: colors.textMuted, fontSize: 11 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: colors.textSecondary }}>{cert.emetteur}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 12, color: colors.textMuted }}>{cert.expire}</span>
                          <span style={{ background: exp.bg, color: exp.color, padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>
                            <Clock size={10} style={{ marginRight: 2, verticalAlign: "middle" }} />{exp.label}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <IconButton icon={<FilePdf size={14} />} tooltip={t("certificates.actions.pdf")} size={32} color={colors.textMuted} bg="transparent" hoverBg={colors.borderLight} onClick={() => downloadPDF({ id: cert.id, type: cert.type, lot: cert.lot, culture: cert.culture, statut: cert.statut, emetteur: cert.emetteur, expire: cert.expire }, `certificat-${cert.id}`)} />
                          <IconButton icon={<FileCode size={14} />} tooltip={t("certificates.actions.xml")} size={32} color={colors.textMuted} bg="transparent" hoverBg={colors.borderLight} onClick={() => downloadXML({ id: cert.id, type: cert.type, lot: cert.lot, culture: cert.culture, statut: cert.statut, emetteur: cert.emetteur, expire: cert.expire }, `certificat-${cert.id}`)} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: colors.textMuted }}>{t("certificates.empty")}</div>
            )}
          </div>
        )}
      </div>
    </FadeIn>
  );
}

export default Certificates;
