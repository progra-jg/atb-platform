import React, { useState } from "react";
import {
  Box, Grid, Typography, Card, CardContent, Chip, Select, MenuItem,
  FormControl, InputLabel, Skeleton,
} from "@mui/material";
import {
  Cpu, Cloud, Warning, ChartLine, Leaf, Thermometer, Drop,
  Bell, Info, CheckCircle, Heartbeat, Clock,
} from "@phosphor-icons/react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as ReTooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { fetchAIDashboard } from "../services/ai";

const REGIONS = ["Zou", "Borgou", "Mono", "Ouémé", "Atlantique", "Collines", "Couffo", "Plateau"];

const severityColor = (severity: string): string => {
  switch (severity) {
    case "high": return "#d32f2f";
    case "moderate": return "#ed6c02";
    case "low": return "#fbc02d";
    default: return "#1976d2";
  }
};

const healthColor = (status: string): string => {
  switch (status) {
    case "healthy": return "#2e7d32";
    case "moderate": return "#ed6c02";
    case "critical": return "#d32f2f";
    default: return "#9e9e9e";
  }
};

const AIDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [region, setRegion] = useState("Zou");

  const { data: aiData, isLoading } = useQuery({
    queryKey: ["ai-dashboard", region],
    queryFn: fetchAIDashboard,
  });

  const alerts = aiData?.alerts ?? [];
  const cropHealth = aiData?.cropHealth ?? [];
  const riskTrend = aiData?.riskTrend ?? [];
  const isOnline = true;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={700}>{t("ai.title")}</Typography>
          <Typography variant="body2" color="text.secondary">{t("ai.subtitle")}</Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>{t("weather.region")}</InputLabel>
          <Select value={region} label={t("weather.region")} onChange={(e) => setRegion(e.target.value)}>
            {REGIONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {isLoading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" width="100%" height={120} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          <Grid container spacing={2.5} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, background: "linear-gradient(135deg, #1b5e20, #2e7d32)", color: "white" }}>
                <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Cpu size={28} weight="fill" />
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#4caf50", boxShadow: "0 0 8px rgba(76,175,80,0.8)", animation: "pulse 2s infinite" }} />
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Satellite AI</Typography>
                  <Typography fontWeight={700} fontSize={20}>En ligne</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, background: "linear-gradient(135deg, #1565c0, #1976d2)", color: "white" }}>
                <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Cloud size={28} weight="fill" />
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#4caf50", boxShadow: "0 0 8px rgba(76,175,80,0.8)", animation: "pulse 2s infinite" }} />
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Weather Service</Typography>
                  <Typography fontWeight={700} fontSize={20}>En ligne</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, background: "linear-gradient(135deg, #e65100, #ed6c02)", color: "white" }}>
                <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Warning size={28} weight="fill" />
                    <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "#4caf50", boxShadow: "0 0 8px rgba(76,175,80,0.8)", animation: "pulse 2s infinite" }} />
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Disease Engine</Typography>
                  <Typography fontWeight={700} fontSize={20}>Actif</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 3, background: "linear-gradient(135deg, #37474f, #546e7a)", color: "white" }}>
                <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Clock size={28} weight="fill" />
                    <Info size={18} />
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>Dernière analyse</Typography>
                  <Typography fontWeight={700} fontSize={14}>Il y a 12 min</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={2.5} mb={3}>
            {[
              { icon: <ChartLine size={22} />, label: t("ai.stats.predictions"), value: aiData?.predictions ?? 0, bg: "#e8f5e9", color: "#2e7d32", change: "+12%" },
              { icon: <Warning size={22} />, label: t("ai.stats.highRisks"), value: aiData?.highRisks ?? 0, bg: "#ffebee", color: "#d32f2f", change: "+2" },
              { icon: <Bell size={22} />, label: t("ai.stats.weatherAlerts"), value: aiData?.weatherAlerts ?? 0, bg: "#fff3e0", color: "#ed6c02", change: "-1" },
              { icon: <Leaf size={22} />, label: t("ai.stats.monitoredCrops"), value: aiData?.monitoredCrops ?? 0, bg: "#e3f2fd", color: "#1565c0", change: "0" },
            ].map((item, i) => (
              <Grid item xs={6} sm={3} key={i}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                      <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: item.bg, display: "flex", alignItems: "center", justifyContent: "center", color: item.color }}>
                        {item.icon}
                      </Box>
                      <Chip label={item.change} size="small" sx={{
                        fontWeight: 600, fontSize: "0.7rem", bgcolor: item.change.startsWith("+") ? "#e8f5e9" : item.change.startsWith("-") ? "#ffebee" : "#f5f5f5",
                        color: item.change.startsWith("+") ? "#2e7d32" : item.change.startsWith("-") ? "#d32f2f" : "#9e9e9e",
                      }} />
                    </Box>
                    <Typography variant="h4" fontWeight={700}>{item.value}</Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>{item.label}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2.5} mb={3}>
            <Grid item xs={12} md={7}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Thermometer size={18} />
                    <Typography variant="h6" fontWeight={600}>{t("weather.title")} & {t("disease.title")} — 14 jours</Typography>
                  </Box>
                  {riskTrend.length === 0 ? (
                    <Skeleton variant="rounded" width="100%" height={300} />
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <ComposedChart data={riskTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                        <YAxis yAxisId="risk" domain={[0, 100]} tick={{ fontSize: 11 }} />
                        <ReTooltip />
                        <Legend />
                        <Bar yAxisId="risk" dataKey="score" fill="#d32f2f" radius={[4, 4, 0, 0]} name={t("ai.riskTrend")} opacity={0.7} />
                        <Line yAxisId="risk" type="monotone" dataKey="score" stroke="#d32f2f" strokeWidth={2} dot={{ r: 4, fill: "#d32f2f" }} name={t("weather.temperature")} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                  <Box mt={1} display="flex" justifyContent="flex-end">
                    <Typography variant="caption" color="text.secondary">
                      ⚠ {t("disease.high")} &gt; 60 — marqueurs de risque superposés
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ borderRadius: 3, height: "100%" }}>
                <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Leaf size={18} />
                    <Typography variant="h6" fontWeight={600}>{t("ai.cropHealth")}</Typography>
                  </Box>
                  {cropHealth.length === 0 ? (
                    <Skeleton variant="rounded" width="100%" height={300} />
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <ComposedChart data={cropHealth} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                        <YAxis type="category" dataKey="crop" tick={{ fontSize: 11 }} width={80} />
                        <ReTooltip />
                        <Bar dataKey="healthScore" layout="vertical" radius={[0, 6, 6, 0]} name={t("ai.cropHealth")}>
                          {cropHealth.map((entry, idx) => (
                            <Cell key={idx} fill={healthColor(entry.status)} />
                          ))}
                        </Bar>
                      </ComposedChart>
                    </ResponsiveContainer>
                  )}
                  <Box display="flex" justifyContent="center" gap={2} mt={1}>
                    {["healthy", "moderate", "critical"].map((s) => (
                      <Box key={s} display="flex" alignItems="center" gap={0.5}>
                        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: healthColor(s) }} />
                        <Typography variant="caption">
                          {s === "healthy" ? t("ai.healthy") : s === "moderate" ? t("ai.moderate") : t("ai.critical")}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={2.5}>
            <Grid item xs={12} md={7}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Bell size={18} />
                    <Typography variant="h6" fontWeight={600}>{t("ai.predictiveAlerts")}</Typography>
                  </Box>
                  {alerts.length === 0 ? (
                    <Box textAlign="center" py={4}>
                      <CheckCircle size={40} color="#2e7d32" />
                      <Typography color="text.secondary" mt={1}>Aucune alerte active</Typography>
                    </Box>
                  ) : (
                    <Box display="flex" flexDirection="column" gap={1.5}>
                      {alerts.map((alert) => (
                        <Box key={alert.id} display="flex" gap={2} p={2} borderRadius={2} bgcolor="rgba(0,0,0,0.02)" border="1px solid rgba(0,0,0,0.04)" sx={{ "&:hover": { bgcolor: "rgba(0,0,0,0.035)" } }}>
                          <Box sx={{ width: 4, borderRadius: 2, bgcolor: severityColor(alert.severity), flexShrink: 0 }} />
                          <Box flex={1}>
                            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                              <Typography variant="subtitle2" fontWeight={600}>{alert.title}</Typography>
                              <Chip
                                label={alert.severity}
                                size="small"
                                sx={{ fontWeight: 600, fontSize: "0.65rem", bgcolor: `${severityColor(alert.severity)}18`, color: severityColor(alert.severity), textTransform: "uppercase" }}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary">{alert.description}</Typography>
                            <Box display="flex" gap={2} mt={0.5} alignItems="center">
                              <Typography variant="caption" color="text.secondary">{alert.region} · {alert.crop}</Typography>
                              <Chip label={`${Math.round(alert.confidence * 100)}%`} size="small" variant="outlined" sx={{ fontSize: "0.6rem", height: 20 }} />
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ borderRadius: 3, height: "100%" }}>
                <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Info size={18} />
                    <Typography variant="h6" fontWeight={600}>{t("ai.last24h")}</Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(27,94,32,0.04)", border: "1px solid rgba(27,94,32,0.1)", minHeight: 200 }}>
                    <Typography variant="body2" color="text.secondary" lineHeight={1.8}>
                      {aiData?.summary ?? t("ai.summary")}
                    </Typography>
                  </Box>
                  <Box mt={2} display="flex" alignItems="center" gap={1}>
                    <Heartbeat size={16} color="#2e7d32" weight="fill" />
                    <Typography variant="caption" color="text.secondary">
                      {t("ai.summary")} · {t("ai.last24h")}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default AIDashboard;
