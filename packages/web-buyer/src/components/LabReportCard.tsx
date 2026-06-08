import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  FileText, DownloadSimple, CheckCircle, WarningCircle, XCircle,
  FloppyDisk, ChartBar, Cube, SealCheck, Clock, MapPin,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useIsMobile } from "../hooks/useMediaQuery";
import { fetchLabReport } from "../services/lab";
import { GRADE_CFG } from "../types/lab";
import type { LabReport, LabParameter } from "../types/lab";
import Card, { CardHeader } from "./ui/Card";

const STATUS_ICONS = {
  pass: CheckCircle,
  warning: WarningCircle,
  fail: XCircle,
  info: Clock,
};

const STATUS_COLORS = {
  pass: { base: "#059669", bg: "#ecfdf5" },
  warning: { base: "#d97706", bg: "#fffbeb" },
  fail: { base: "#dc2626", bg: "#fef2f2" },
  info: { base: "#6b7280", bg: "#f3f4f6" },
};

function ParamRow({ param, delay: d }: { param: LabParameter; delay: number }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const Icon = STATUS_ICONS[param.status];
  const colorSet = STATUS_COLORS[param.status];
  const scoreColor = param.score >= 85 ? "#059669" : param.score >= 65 ? "#d97706" : "#dc2626";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: d * 0.04 }}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 80px 80px 30px",
        gap: 8,
        padding: "8px 10px",
        borderRadius: 8,
        background: param.status === "fail" ? "#fef2f2" : "transparent",
        alignItems: "center",
        fontSize: 12,
        borderBottom: `1px solid ${colors.borderLight}`,
      }}
    >
      <span style={{ fontWeight: 500, color: colors.text, display: "flex", alignItems: "center", gap: 5 }}>
        {t(param.nameKey)}
      </span>
      <span style={{ fontWeight: 600, color: colors.text, textAlign: "right", fontFamily: "var(--font-mono, monospace)" }}>{param.value}</span>
      <span style={{ color: colors.textMuted, textAlign: "center", fontSize: 11 }}>{param.standard}</span>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Icon size={14} weight="fill" color={colorSet.base} />
      </div>
    </motion.div>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const { colors } = useTheme();
  const r = 24;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 85 ? "#059669" : score >= 65 ? "#d97706" : "#dc2626";

  return (
    <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
      <svg width={64} height={64} viewBox="0 0 64 64">
        <circle cx={32} cy={32} r={r} fill="none" stroke={colors.borderLight} strokeWidth={5} />
        <motion.circle
          cx={32} cy={32} r={r}
          fill="none" stroke={color} strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        alignItems: "center", justifyContent: "center",
        fontSize: 14, fontWeight: 800, color, letterSpacing: "-0.5px",
      }}>
        {score}
      </div>
    </div>
  );
}

interface Props {
  lotId: string;
  culture: string;
}

export default function LabReportCard({ lotId, culture }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isMobile = useIsMobile();

  const { data: report, isLoading } = useQuery({
    queryKey: ["lab-report", lotId],
    queryFn: () => fetchLabReport(lotId, culture),
  });

  if (isLoading) {
    return (
      <Card variant="premium" style={{ padding: isMobile ? 16 : 20, marginBottom: isMobile ? 12 : 16 }}>
        <CardHeader icon={<ChartBar size={16} />} title={t("detail.labReport")} />
        <div style={{ textAlign: "center", padding: 16, fontSize: 12, color: colors.textMuted }}>
          {t("common.loading")}
        </div>
      </Card>
    );
  }

  if (!report) return null;

  const gradeCfg = GRADE_CFG[report.overallGrade];
  const passCount = report.parameters.filter((p) => p.status === "pass").length;
  const failCount = report.parameters.filter((p) => p.status === "fail").length;
  const warningCount = report.parameters.filter((p) => p.status === "warning").length;

  return (
    <Card variant="premium" style={{
      padding: 0,
      marginBottom: isMobile ? 12 : 16,
      overflow: "hidden",
      border: `1px solid ${gradeCfg.color}25`,
    }}>
      {/* Header with grade */}
      <div style={{
        padding: isMobile ? 16 : 20,
        borderBottom: `1px solid ${colors.borderLight}`,
        display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <ChartBar size={16} color={gradeCfg.color} weight="fill" />
            <span style={{ fontWeight: 700, fontSize: 14, color: colors.text }}>{t("detail.labReport")}</span>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "2px 8px", borderRadius: 6,
              background: gradeCfg.bg, color: gradeCfg.color,
              fontSize: 10, fontWeight: 800, letterSpacing: "0.5px",
            }}>
              {gradeCfg.icon} · {t(gradeCfg.labelKey)}
            </span>
          </div>
          <div style={{ fontSize: 10, color: colors.textMuted, display: "flex", flexWrap: "wrap", gap: 4 }}>
            <span>{report.reportId}</span>
            <span>·</span>
            <span>{report.laboratory}</span>
          </div>
        </div>
        <ScoreGauge score={report.overallScore} />
      </div>

      {/* Sample info */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 6, padding: isMobile ? "10px 16px" : "12px 20px",
        background: colors.statBg, borderBottom: `1px solid ${colors.borderLight}`,
        fontSize: 10, color: colors.textMuted,
      }}>
        {[
          { icon: MapPin, label: t("detail.offerDestination") || t("detail.origin"), value: report.origin },
          { icon: Clock, label: t("detail.labSampled"), value: report.sampleDate },
          { icon: Cube, label: t("detail.labAnalyzed"), value: report.reportDate },
          { icon: SealCheck, label: t("detail.labAnalyst"), value: report.analyst },
        ].map((item, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <item.icon size={10} />
            <span>{item.label}:</span>
            <span style={{ fontWeight: 600, color: colors.text }}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Summary bar */}
      <div style={{
        display: "flex", gap: isMobile ? 4 : 8,
        padding: isMobile ? "8px 16px" : "10px 20px",
        borderBottom: `1px solid ${colors.borderLight}`,
      }}>
        {[
          { count: passCount, label: t("detail.labPass"), color: "#059669", bg: "#ecfdf5" },
          { count: warningCount, label: t("detail.labWarning"), color: "#d97706", bg: "#fffbeb" },
          { count: failCount, label: t("detail.labFail"), color: "#dc2626", bg: "#fef2f2" },
        ].map((s) => s.count > 0 ? (
          <div key={s.label} style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "3px 8px", borderRadius: 6,
            background: s.bg, fontSize: 10, fontWeight: 600, color: s.color,
          }}>
            {s.label} · {s.count}
          </div>
        ) : null)}
      </div>

      {/* Parameters */}
      <div style={{ padding: isMobile ? 8 : 12 }}>
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 80px 80px 30px",
          gap: 8, padding: "4px 10px 8px",
          fontSize: 9, color: colors.textMuted, textTransform: "uppercase",
          letterSpacing: "0.5px", fontWeight: 600,
          borderBottom: `1px solid ${colors.borderLight}`,
        }}>
          <span>{t("detail.labParams")}</span>
          <span style={{ textAlign: "right" }}>{t("lots.fields.value")}</span>
          <span style={{ textAlign: "center" }}>{t("detail.labStandards")}</span>
          <span />
        </div>
        <div style={{ marginTop: 2 }}>
          {report.parameters.map((param, idx) => (
            <ParamRow key={param.id} param={param} delay={idx} />
          ))}
        </div>
      </div>

      {/* Conclusion */}
      <div style={{
        padding: isMobile ? 12 : 16,
        background: `${gradeCfg.color}06`,
        borderTop: `1px solid ${colors.borderLight}`,
        fontSize: 11.5, color: colors.textSecondary, lineHeight: 1.6,
        display: "flex", gap: 8, alignItems: "flex-start",
      }}>
        <SealCheck size={16} color={gradeCfg.color} weight="fill" style={{ flexShrink: 0, marginTop: 1 }} />
        <span>{t(report.conclusionKey)}</span>
      </div>

      {/* PDF Download */}
      {report.pdfAvailable && (
        <div style={{
          padding: "10px 20px", borderTop: `1px solid ${colors.borderLight}`,
        }}>
          <div
            role="button"
            tabIndex={0}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 8,
              background: colors.accentLight, color: colors.accent,
              fontSize: 11, fontWeight: 600, cursor: "pointer",
              border: `1px solid ${colors.accent}30`,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `${colors.accent}20`; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = colors.accentLight; }}
            onKeyDown={(e) => { if (e.key === "Enter") {} }}
          >
            <DownloadSimple size={14} weight="bold" />
            {t("detail.labDownload")} ({report.reportId}.pdf)
            <FileText size={12} style={{ marginLeft: 2 }} />
          </div>
        </div>
      )}

      {/* No PDF fallback */}
      {!report.pdfAvailable && report.lotId !== "—" && (
        <div style={{
          padding: "10px 20px", borderTop: `1px solid ${colors.borderLight}`,
          fontSize: 10, color: colors.textMuted, display: "flex", alignItems: "center", gap: 4,
        }}>
          <WarningCircle size={12} />
          {t("detail.labNotAvailable")}
        </div>
      )}
    </Card>
  );
}
