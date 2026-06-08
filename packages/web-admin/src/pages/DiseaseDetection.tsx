import React, { useState } from "react";
import {
  Box, Grid, Typography, Card, CardContent, Chip, LinearProgress, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Select, MenuItem,
  FormControl, InputLabel, Button, TableSortLabel,
} from "@mui/material";
import {
  Warning, WarningCircle, Bug, Leaf, MapPin, Flask, FirstAid, Microscope, ArrowRight,
} from "@phosphor-icons/react";
import {
  AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { fetchDiseaseRisks, fetchDiseaseSummary, fetchDiseaseReports } from "../services/disease";
import type { DiseaseRisk, DiseaseReport, DiseaseSummary } from "../services/disease";

const REGIONS = ["Zou", "Borgou", "Mono", "Ouémé", "Atlantique", "Collines", "Couffo", "Plateau"];
const CROPS = ["Cacao", "Coton", "Anacarde", "Café", "Maïs", "Soja", "Banane", "Ananas", "Manioc", "Riz"];

const RISK_COLORS: Record<string, string> = {
  severe: "#d32f2f", high: "#ed6c02", moderate: "#e9a300", low: "#2e7d32",
};

const RISK_BG: Record<string, string> = {
  severe: "#ffebee", high: "#fff3e0", moderate: "#fff8e1", low: "#e8f5e9",
};

const HEAT_COLORS = ["#e8f5e9", "#fff8e1", "#fff3e0", "#ffebee"];
const STATUS_COLORS: Record<string, "default" | "warning" | "info" | "success"> = {
  reported: "default", confirmed: "warning", treated: "info", resolved: "success",
};

const LEVEL_ORDER: Record<string, number> = { severe: 4, high: 3, moderate: 2, low: 1 };

function levelChip(level: string, t: any) {
  return (
    <Chip
      label={t(`disease.${level}`, level)}
      size="small"
      sx={{ fontWeight: 600, color: "#fff", bgcolor: RISK_COLORS[level] || "#888", minWidth: 64 }}
    />
  );
}

function statusChip(status: string, t: any) {
  const labels: Record<string, string> = {
    reported: t("disease.reported", "Signalé"),
    confirmed: t("disease.confirmed", "Confirmé"),
    treated: t("disease.treated", "Traité"),
    resolved: t("disease.resolved", "Résolu"),
  };
  return (
    <Chip
      label={labels[status] || status}
      size="small"
      color={STATUS_COLORS[status] || "default"}
      variant="outlined"
      sx={{ fontWeight: 500 }}
    />
  );
}

function riskBar(score: number) {
  const color = score >= 70 ? RISK_COLORS.severe : score >= 50 ? RISK_COLORS.high : score >= 30 ? RISK_COLORS.moderate : RISK_COLORS.low;
  const bg = score >= 70 ? RISK_BG.severe : score >= 50 ? RISK_BG.high : score >= 30 ? RISK_BG.moderate : RISK_BG.low;
  return (
    <Box display="flex" alignItems="center" gap={1}>
      <LinearProgress
        variant="determinate"
        value={score}
        sx={{
          flex: 1, height: 8, borderRadius: 4, bgcolor: "rgba(0,0,0,0.06)",
          "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 4 },
        }}
      />
      <Typography variant="caption" fontWeight={700} sx={{ color, minWidth: 32, textAlign: "right" }}>
        {score}
      </Typography>
    </Box>
  );
}

const DiseaseDetection: React.FC = () => {
  const { t } = useTranslation();
  const [filterRegion, setFilterRegion] = useState<string>("");
  const [filterCrop, setFilterCrop] = useState<string>("");
  const [filterLevel, setFilterLevel] = useState<string>("");
  const [sortBy, setSortBy] = useState<keyof DiseaseRisk>("riskScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { data: summary } = useQuery<DiseaseSummary>({
    queryKey: ["disease-summary"],
    queryFn: fetchDiseaseSummary,
  });

  const { data: risks = [] } = useQuery<DiseaseRisk[]>({
    queryKey: ["disease-risks", filterRegion, filterCrop],
    queryFn: () => fetchDiseaseRisks(filterRegion || undefined, filterCrop || undefined),
  });

  const { data: reports = [] } = useQuery<DiseaseReport[]>({
    queryKey: ["disease-reports", filterRegion],
    queryFn: () => fetchDiseaseReports(filterRegion || undefined),
  });

  const filtered = risks.filter(r => !filterLevel || r.riskLevel === filterLevel);

  const sorted = [...filtered].sort((a, b) => {
    const aVal = sortBy === "riskLevel" ? LEVEL_ORDER[a.riskLevel] || 0 : (a[sortBy] as number || 0);
    const bVal = sortBy === "riskLevel" ? LEVEL_ORDER[b.riskLevel] || 0 : (b[sortBy] as number || 0);
    return sortDir === "asc" ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (col: keyof DiseaseRisk) => {
    if (col === sortBy) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("desc"); }
  };

  const s = summary || {
    totalRisks: 0, highRisk: 0, moderateRisk: 0, lowRisk: 0, activeAlerts: 0,
    reportsThisMonth: 0, topDisease: "", mostAffectedRegion: "", mostAffectedCrop: "",
    riskTrend: [],
  };

  const avgScore = filtered.length > 0
    ? Math.round(filtered.reduce((sum, r) => sum + r.riskScore, 0) / filtered.length)
    : 0;

  const pieData = [
    { name: t("disease.severe"), value: s.highRisk, color: RISK_COLORS.severe },
    { name: t("disease.high"), value: s.moderateRisk, color: RISK_COLORS.high },
    { name: t("disease.moderate"), value: s.lowRisk, color: RISK_COLORS.moderate },
  ].filter(d => d.value > 0);

  const regionCropRisk: Record<string, Record<string, number>> = {};
  for (const reg of REGIONS) {
    regionCropRisk[reg] = {};
    for (const crop of CROPS) {
      const r = risks.filter(rr => rr.region === reg && rr.crop === crop);
      regionCropRisk[reg][crop] = r.length > 0 ? Math.round(r.reduce((a, b) => a + b.riskScore, 0) / r.length) : 0;
    }
  }

  const heatColor = (score: number) =>
    score >= 70 ? RISK_COLORS.severe : score >= 50 ? RISK_COLORS.high : score >= 30 ? RISK_COLORS.moderate : RISK_COLORS.low;

  return (
    <Box>
      {/* Header + Quick Filters */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4">{t("disease.title", "Détection des Maladies")}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t("disease.subtitle", "Surveillance phytosanitaire intelligente et prévention des risques")}
          </Typography>
        </Box>
        <Box display="flex" gap={2} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>{t("disease.filterRegion", "Région")}</InputLabel>
            <Select value={filterRegion} label={t("disease.filterRegion", "Région")} onChange={e => setFilterRegion(e.target.value)}>
              <MenuItem value="">{t("disease.all", "Toutes")}</MenuItem>
              {REGIONS.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>{t("disease.filterCrop", "Culture")}</InputLabel>
            <Select value={filterCrop} label={t("disease.filterCrop", "Culture")} onChange={e => setFilterCrop(e.target.value)}>
              <MenuItem value="">{t("disease.all", "Toutes")}</MenuItem>
              {CROPS.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>{t("disease.filterRisk", "Niveau")}</InputLabel>
            <Select value={filterLevel} label={t("disease.filterRisk", "Niveau")} onChange={e => setFilterLevel(e.target.value)}>
              <MenuItem value="">{t("disease.all", "Tous")}</MenuItem>
              <MenuItem value="severe">{t("disease.severe", "Sévère")}</MenuItem>
              <MenuItem value="high">{t("disease.high", "Élevé")}</MenuItem>
              <MenuItem value="moderate">{t("disease.moderate", "Modéré")}</MenuItem>
              <MenuItem value="low">{t("disease.low", "Faible")}</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* A. Summary Stats */}
      <Grid container spacing={2.5} mb={3}>
        {[
          { icon: <Warning size={24} />, label: t("disease.summary.total", "Risques surveillés"), value: s.totalRisks, bg: "#e3f2fd", color: "#1565c0" },
          { icon: <WarningCircle size={24} />, label: t("disease.summary.highAlerts", "Alertes actives"), value: s.activeAlerts, bg: "#ffebee", color: "#d32f2f" },
          { icon: <Bug size={24} />, label: t("disease.summary.outbreaks", "Foyers signalés"), value: s.reportsThisMonth, bg: "#fff3e0", color: "#ed6c02" },
          { icon: <Leaf size={24} />, label: t("disease.summary.topCrop", "Culture la plus à risque"), value: s.mostAffectedCrop, bg: "#e8f5e9", color: "#2e7d32" },
        ].map((item, i) => (
          <Grid item xs={6} sm={3} md={3} key={i}>
            <Card sx={{ "&:hover": { transform: "translateY(-2px)", transition: "0.2s" } }}>
              <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                  <Box sx={{ width: 46, height: 46, borderRadius: 2, bgcolor: item.bg, display: "flex", alignItems: "center", justifyContent: "center", color: item.color }}>
                    {item.icon}
                  </Box>
                </Box>
                <Typography variant="h4" fontWeight={700}>{item.value}</Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>{item.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* B. Risk Trend + C. Donut */}
      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <MapPin size={18} /> {t("disease.riskTrend", "Tendance du risque")}
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={s.riskTrend}>
                  <defs>
                    <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d32f2f" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#d32f2f" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <ReTooltip />
                  <ReferenceLine y={70} stroke="#d32f2f" strokeDasharray="4 4" label={{ value: "Severe", position: "right", fontSize: 11, fill: "#d32f2f" }} />
                  <ReferenceLine y={50} stroke="#ed6c02" strokeDasharray="4 4" label={{ value: "High", position: "right", fontSize: 11, fill: "#ed6c02" }} />
                  <Area type="monotone" dataKey="score" stroke="#d32f2f" fill="url(#riskGradient)" strokeWidth={2} dot={false} name={t("disease.riskScore", "Score")} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 }, height: "100%", display: "flex", flexDirection: "column" }}>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <WarningCircle size={18} /> {t("disease.distribution", "Répartition")}
              </Typography>
              <Box flex={1} display="flex" alignItems="center" justifyContent="center" position="relative">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                      {pieData.map((entry, idx) => <Cell key={idx} fill={entry.color} stroke="none" />)}
                    </Pie>
                    <ReTooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Box position="absolute" top="50%" left="50%" sx={{ transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
                  <Typography variant="h4" fontWeight={700} lineHeight={1}>{avgScore}</Typography>
                  <Typography variant="caption" color="text.secondary">{t("disease.riskScore", "Score")}</Typography>
                </Box>
              </Box>
              <Box display="flex" justifyContent="center" gap={1.5} flexWrap="wrap" mt={1}>
                {pieData.map(d => (
                  <Box key={d.name} display="flex" alignItems="center" gap={0.5}>
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: d.color }} />
                    <Typography variant="caption" fontWeight={500}>{d.name}</Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* D. Disease Risk Table */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
            <Microscope size={18} /> {t("disease.riskTable", "Tableau des risques")}
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel active={sortBy === "diseaseName"} direction={sortBy === "diseaseName" ? sortDir : "desc"} onClick={() => handleSort("diseaseName")}>
                      {t("disease.disease", "Maladie")}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>{t("disease.crop", "Culture")}</TableCell>
                  <TableCell>{t("disease.region", "Région")}</TableCell>
                  <TableCell>
                    <TableSortLabel active={sortBy === "riskScore"} direction={sortBy === "riskScore" ? sortDir : "desc"} onClick={() => handleSort("riskScore")}>
                      {t("disease.riskScore", "Score de risque")}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel active={sortBy === "riskLevel"} direction={sortBy === "riskLevel" ? sortDir : "desc"} onClick={() => handleSort("riskLevel")}>
                      {t("disease.level", "Niveau")}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>{t("disease.status", "Statut")}</TableCell>
                  <TableCell>{t("disease.actions", "Actions")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sorted.slice(0, 10).map(row => (
                  <TableRow key={row.id} sx={{ "&:hover": { bgcolor: "rgba(0,0,0,0.02)" } }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{row.diseaseName}</Typography>
                    </TableCell>
                    <TableCell>{row.crop}</TableCell>
                    <TableCell>{row.region}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>{riskBar(row.riskScore)}</TableCell>
                    <TableCell>{levelChip(row.riskLevel, t)}</TableCell>
                    <TableCell>
                      <Chip label={row.activeAlert ? "Alerte active" : "Normal"} size="small" color={row.activeAlert ? "error" : "success"} variant={row.activeAlert ? "filled" : "outlined"} sx={{ fontWeight: 500 }} />
                    </TableCell>
                    <TableCell>
                      <Button size="small" variant="text" endIcon={<ArrowRight size={14} />} sx={{ textTransform: "none", fontWeight: 600 }}>
                        {t("disease.viewDetails", "Détails")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {sorted.length === 0 && (
              <Box textAlign="center" py={4}>
                <Typography color="text.secondary">{t("disease.noData", "Aucune donnée disponible")}</Typography>
              </Box>
            )}
          </TableContainer>
        </CardContent>
      </Card>

      {/* E. Outbreak Reports + F. Preventive Measures */}
      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <Bug size={18} /> {t("disease.reports", "Signalements de maladies")}
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                {reports.map(r => (
                  <Box key={r.id} display="flex" gap={2} p={2} borderRadius={2} bgcolor="rgba(0,0,0,0.02)" border="1px solid rgba(0,0,0,0.04)">
                    <Box sx={{ width: 4, borderRadius: 2, bgcolor: r.status === "confirmed" ? "#ed6c02" : r.status === "treated" ? "#0288d1" : r.status === "resolved" ? "#2e7d32" : "#888", flexShrink: 0 }} />
                    <Box flex={1}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                        <Typography variant="subtitle2" fontWeight={600}>{r.diseaseName}</Typography>
                        {statusChip(r.status, t)}
                      </Box>
                      <Box display="flex" gap={2} flexWrap="wrap" mb={0.5}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <MapPin size={12} />
                          <Typography variant="caption" color="text.secondary">{r.region}</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Leaf size={12} />
                          <Typography variant="caption" color="text.secondary">{r.crop}</Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">{r.estimatedArea} ha</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                      </Typography>
                      <Typography variant="body2" mt={0.5} color="text.secondary">{r.description}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <Flask size={18} /> {t("disease.preventive", "Mesures préventives")}
              </Typography>
              <Box mb={3}>
                <Typography variant="subtitle2" fontWeight={600} display="flex" alignItems="center" gap={1} mb={1.5}>
                  <FirstAid size={16} /> {t("disease.preventive", "Mesures préventives")}
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2.5, "& li": { mb: 1 } }}>
                  <Typography component="li" variant="body2">Assurer une bonne circulation de l'air entre les plants</Typography>
                  <Typography component="li" variant="body2">Éviter l'excès d'humidité par un drainage adéquat</Typography>
                  <Typography component="li" variant="body2">Pratiquer la rotation des cultures pour réduire les pathogènes</Typography>
                  <Typography component="li" variant="body2">Utiliser des semences certifiées et résistantes aux maladies</Typography>
                  <Typography component="li" variant="body2">Inspecter régulièrement les parcelles pour détecter les symptômes précoces</Typography>
                </Box>
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={600} display="flex" alignItems="center" gap={1} mb={1.5}>
                  <FirstAid size={16} /> {t("disease.treatment", "Traitements recommandés")}
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2.5, "& li": { mb: 1 } }}>
                  <Typography component="li" variant="body2">Appliquer des fongicides appropriés selon le type de maladie identifié</Typography>
                  <Typography component="li" variant="body2">Utiliser des bio-pesticides et des solutions naturelles dans la mesure du possible</Typography>
                  <Typography component="li" variant="body2">Consulter un technicien agricole local pour un diagnostic précis</Typography>
                  <Typography component="li" variant="body2">Mettre en quarantaine les parcelles infectées pour éviter la propagation</Typography>
                  <Typography component="li" variant="body2">Signaler tout foyer suspect aux autorités agricoles compétentes</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* G. Regional Risk Heat Map */}
      <Card>
        <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
          <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
            <MapPin size={18} /> Carte des risques par région et culture
          </Typography>
          <Box sx={{ overflowX: "auto" }}>
            <Box component="table" sx={{ borderCollapse: "collapse", minWidth: 600, fontSize: "0.8rem" }}>
              <Box component="thead">
                <Box component="tr">
                  <Box component="th" sx={{ p: 0.5, textAlign: "left", position: "sticky", left: 0, bgcolor: "#fff", zIndex: 1 }}>Région</Box>
                  {CROPS.map(c => (
                    <Box component="th" key={c} sx={{ p: 0.5, textAlign: "center", fontWeight: 600, minWidth: 64, maxWidth: 80, fontSize: "0.7rem", writingMode: "vertical-lr", transform: "rotate(180deg)", height: 100 }}>{c}</Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {REGIONS.map(reg => (
                  <Box component="tr" key={reg}>
                    <Box component="td" sx={{ p: 0.5, fontWeight: 600, position: "sticky", left: 0, bgcolor: "#fff", whiteSpace: "nowrap", borderBottom: "1px solid rgba(0,0,0,0.04)" }}>{reg}</Box>
                    {CROPS.map(crop => {
                      const score = regionCropRisk[reg]?.[crop] || 0;
                      const color = heatColor(score);
                      return (
                        <Box
                          component="td"
                          key={`${reg}-${crop}`}
                          sx={{
                            p: 1, textAlign: "center", borderBottom: "1px solid rgba(0,0,0,0.04)",
                            bgcolor: score > 0 ? color : "#f5f5f5",
                            color: score >= 50 ? "#fff" : "inherit",
                            fontWeight: 600, fontSize: "0.75rem",
                            opacity: score > 0 ? 1 : 0.3,
                          }}
                        >
                          {score > 0 ? score : "-"}
                        </Box>
                      );
                    })}
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" justifyContent="flex-end" gap={2} mt={2}>
            {["Faible", "Modéré", "Élevé", "Sévère"].map((label, i) => (
              <Box key={label} display="flex" alignItems="center" gap={0.5}>
                <Box sx={{ width: 14, height: 14, borderRadius: 0.5, bgcolor: [RISK_COLORS.low, RISK_COLORS.moderate, RISK_COLORS.high, RISK_COLORS.severe][i] }} />
                <Typography variant="caption">{label}</Typography>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default DiseaseDetection;
