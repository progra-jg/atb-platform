import React, { useState } from "react";
import {
  Box, Grid, Typography, Card, CardContent, Select, MenuItem, FormControl, InputLabel,
  Chip, Skeleton,
} from "@mui/material";
import {
  Sun, Drop, Wind, Plant, Warning, CheckCircle,
  Info, CalendarBlank, Eye,
} from "@phosphor-icons/react";
import {
  Line, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ComposedChart,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  fetchForecast, fetchWeatherHistory, fetchWeatherAlerts, fetchCropAdvisory,
} from "../services/weather";
import type { WeatherDay } from "../services/weather";

const REGIONS = ["Zou", "Borgou", "Mono", "Ouémé", "Atlantique", "Collines", "Couffo", "Plateau", "Donga", "Alibori", "Atacora", "Littoral"];
const CROPS = ["Cacao", "Coton", "Anacarde", "Café", "Maïs", "Soja", "Banane", "Ananas", "Manioc", "Riz", "Sésame"];

const weatherEmoji = (code: number): string => {
  switch (code) {
    case 1: return "\u2600\uFE0F";
    case 2: return "\uD83C\uDF24";
    case 3: return "\u2601\uFE0F";
    case 45: return "\uD83C\uDF2B";
    case 61: return "\uD83C\uDF26";
    case 63: return "\uD83C\uDF27";
    default: return "\uD83C\uDF21";
  }
};

const severityColor = (severity: string): string => {
  switch (severity) {
    case "extreme": return "#d32f2f";
    case "high": return "#f57c00";
    case "moderate": return "#fbc02d";
    default: return "#9e9e9e";
  }
};

const dayLabel = (dateStr: string): string => {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Demain";
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
};

const formatDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

const Weather: React.FC = () => {
  const { t } = useTranslation();
  const [region, setRegion] = useState("Zou");
  const [crop, setCrop] = useState("Cacao");

  const { data: forecast, isLoading: forecastLoading } = useQuery({
    queryKey: ["weather-forecast", region],
    queryFn: () => fetchForecast(region),
  });

  const { data: history } = useQuery({
    queryKey: ["weather-history", region],
    queryFn: () => fetchWeatherHistory(region),
  });

  const { data: alerts } = useQuery({
    queryKey: ["weather-alerts", region],
    queryFn: () => fetchWeatherAlerts(region),
  });

  const { data: advisory } = useQuery({
    queryKey: ["weather-advisory", region, crop],
    queryFn: () => fetchCropAdvisory(region, crop),
  });

  const today = forecast?.[0];
  const activeAlerts = alerts?.filter((a) => a.active) ?? [];
  const forecastDays = forecast?.slice(0, 7) ?? [];

  const chartData = forecastDays.map((d) => ({
    ...d,
    label: dayLabel(d.date),
    tempAvg: Math.round(((d.tempMin + d.tempMax) / 2) * 10) / 10,
  }));

  const historyChartData = (history ?? []).map((d) => ({
    ...d,
    label: formatDate(d.date),
    tempAvg: Math.round(((d.tempMin + d.tempMax) / 2) * 10) / 10,
  }));

  const tempMin30 = history ? Math.min(...history.map((d) => d.tempMin)) : 0;
  const tempMax30 = history ? Math.max(...history.map((d) => d.tempMax)) : 0;
  const totalPrecip = history ? history.reduce((s, d) => s + d.precipitation, 0) : 0;
  const avgHumidity = history
    ? Math.round(history.reduce((s, d) => s + d.humidity, 0) / history.length)
    : 0;
  const rainyDays = history ? history.filter((d) => d.precipitation > 0.5).length : 0;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={700}>{t("weather.title")}</Typography>
          <Typography variant="body2" color="text.secondary">{t("weather.subtitle")}</Typography>
        </Box>
        <Box display="flex" gap={2} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t("weather.region")}</InputLabel>
            <Select value={region} label={t("weather.region")} onChange={(e) => setRegion(e.target.value)}>
              {REGIONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t("weather.crop")}</InputLabel>
            <Select value={crop} label={t("weather.crop")} onChange={(e) => setCrop(e.target.value)}>
              {CROPS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, background: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #388e3c 100%)", color: "white" }}>
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
              {forecastLoading ? (
                <Skeleton variant="rounded" width="100%" height={120} sx={{ bgcolor: "rgba(255,255,255,0.1)" }} />
              ) : today ? (
                <Grid container alignItems="center" spacing={2}>
                  <Grid item xs={12} md={3} display="flex" alignItems="center" gap={2}>
                    <Typography variant="h2" sx={{ lineHeight: 1 }}>{weatherEmoji(today.weatherCode)}</Typography>
                    <Box>
                      <Typography variant="h3" fontWeight={700}>{today.tempMax}°C</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        {t("weather.temperature")} {today.tempMin}° / {today.tempMax}°
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Drop size={18} />
                      <Typography variant="body2">{t("weather.precipitation")}: {today.precipitation} mm</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Wind size={18} />
                      <Typography variant="body2">{t("weather.windSpeed")}: {today.windSpeed} km/h</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Drop size={18} />
                      <Typography variant="body2">{t("weather.humidity")}: {today.humidity}%</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Sun size={18} />
                      <Typography variant="body2">{t("weather.solarRadiation")}: {today.solarRadiation} W/m²</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={3} display="flex" justifyContent="flex-end">
                    <Chip
                      label={`${weatherEmoji(today.weatherCode)} ${today.weatherLabel || "—"}`}
                      sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white", fontWeight: 600, backdropFilter: "blur(4px)" }}
                    />
                  </Grid>
                </Grid>
              ) : null}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <CalendarBlank size={20} />
            <Typography variant="h6" fontWeight={600}>{t("weather.forecast")}</Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 2, overflowX: "auto", pb: 1, "&::-webkit-scrollbar": { height: 6 }, "&::-webkit-scrollbar-thumb": { borderRadius: 3, bgcolor: "rgba(0,0,0,0.15)" } }}>
            {forecastLoading
              ? Array.from({ length: 7 }).map((_, i) => (
                  <Card key={i} sx={{ minWidth: 140, borderRadius: 3, flexShrink: 0 }}>
                    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 }, textAlign: "center" }}>
                      <Skeleton variant="rounded" width="100%" height={120} />
                    </CardContent>
                  </Card>
                ))
              : forecastDays.map((d) => (
                  <Card
                    key={d.date}
                    sx={{
                      minWidth: 140, borderRadius: 3, flexShrink: 0,
                      background: "linear-gradient(180deg, rgba(27,94,32,0.04) 0%, rgba(27,94,32,0.1) 100%)",
                      "&:hover": { transform: "translateY(-2px)", transition: "0.2s" },
                    }}
                  >
                    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 }, textAlign: "center" }}>
                      <Typography variant="body2" fontWeight={600} mb={1}>{dayLabel(d.date)}</Typography>
                      <Typography variant="h4" sx={{ lineHeight: 1.2 }}>{weatherEmoji(d.weatherCode)}</Typography>
                      <Typography variant="h6" fontWeight={700} mt={1}>{d.tempMax}°</Typography>
                      <Typography variant="caption" color="text.secondary">{d.tempMin}°</Typography>
                      <Box sx={{ mt: 1, height: 4, borderRadius: 2, bgcolor: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
                        <Box
                          sx={{
                            height: "100%", borderRadius: 2,
                            width: `${Math.min(100, (d.precipitation / 30) * 100)}%`,
                            bgcolor: d.precipitation > 10 ? "#1565c0" : "#42a5f5",
                            transition: "width 0.3s",
                          }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">{d.precipitation} mm</Typography>
                    </CardContent>
                  </Card>
                ))}
          </Box>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {t("weather.temperature")} & {t("weather.precipitation")} — 7 {t("weather.forecast").toLowerCase()}
              </Typography>
              {forecastLoading ? (
                <Skeleton variant="rounded" width="100%" height={300} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={chartData}>
                    <defs>
                      <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f57c00" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#f57c00" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="temp" orientation="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="precip" orientation="right" tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="precip" dataKey="precipitation" fill="#42a5f5" radius={[4, 4, 0, 0]} name={t("weather.precipitation")} />
                    <Line yAxisId="temp" type="monotone" dataKey="tempMax" stroke="#f57c00" strokeWidth={2} dot={{ r: 4 }} name={`${t("weather.temperature")} max`} />
                    <Line yAxisId="temp" type="monotone" dataKey="tempMin" stroke="#1976d2" strokeWidth={2} dot={{ r: 4 }} name={`${t("weather.temperature")} min`} />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {t("weather.history")} — {t("weather.temperature")} & {t("weather.precipitation")}
              </Typography>
              {!history ? (
                <Skeleton variant="rounded" width="100%" height={300} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={historyChartData}>
                    <defs>
                      <linearGradient id="histTemp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f57c00" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f57c00" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="histPrecip" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#42a5f5" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#42a5f5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={4} />
                    <YAxis yAxisId="temp" orientation="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="precip" orientation="right" tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Area yAxisId="temp" type="monotone" dataKey="tempAvg" stroke="#f57c00" fill="url(#histTemp)" strokeWidth={2} name={t("weather.temperature")} />
                    <Area yAxisId="precip" type="monotone" dataKey="precipitation" stroke="#42a5f5" fill="url(#histPrecip)" strokeWidth={2} name={t("weather.precipitation")} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Warning size={20} color="#f57c00" />
            <Typography variant="h6" fontWeight={600}>{t("weather.alerts")}</Typography>
          </Box>
          {activeAlerts.length === 0 ? (
            <Card sx={{ borderRadius: 3, bgcolor: "rgba(46,125,50,0.04)" }}>
              <CardContent sx={{ p: 3, "&:last-child": { pb: 3 }, textAlign: "center" }}>
                <CheckCircle size={40} color="#2e7d32" />
                <Typography variant="h6" color="success.main" mt={1}>{t("weather.noAlerts")}</Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={2}>
              {activeAlerts.map((alert) => (
                <Grid item xs={12} sm={6} key={alert.id}>
                  <Card sx={{ borderRadius: 3, borderLeft: `4px solid ${severityColor(alert.severity)}` }}>
                    <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Chip
                          label={t(`weather.${alert.severity}`)}
                          size="small"
                          sx={{ bgcolor: `${severityColor(alert.severity)}20`, color: severityColor(alert.severity), fontWeight: 600 }}
                        />
                        {alert.crop && <Chip label={alert.crop} size="small" variant="outlined" />}
                      </Box>
                      <Typography variant="subtitle2" fontWeight={700}>{alert.title}</Typography>
                      <Typography variant="body2" color="text.secondary" mt={0.5}>{alert.description}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                        {alert.startDate} → {alert.endDate}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Plant size={20} color="#2e7d32" />
                <Typography variant="h6" fontWeight={600}>{t("weather.advisory")}</Typography>
              </Box>
              {!advisory ? (
                <Skeleton variant="rounded" width="100%" height={240} />
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(0,0,0,0.02)" }}>
                      <Typography variant="caption" color="text.secondary">{t("weather.plantingConditions")}</Typography>
                      <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                        {advisory.plantingConditions.favorable
                          ? <CheckCircle size={16} color="#2e7d32" weight="fill" />
                          : <Warning size={16} color="#f57c00" weight="fill" />}
                        <Typography variant="body2" fontWeight={600}>
                          {advisory.plantingConditions.favorable ? t("weather.favorable") : t("weather.unfavorable")}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">{advisory.plantingConditions.reason}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(0,0,0,0.02)" }}>
                      <Typography variant="caption" color="text.secondary">{t("weather.harvestRisk")}</Typography>
                      <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                        <Info size={16} color={advisory.harvestRisk.level === "low" ? "#2e7d32" : "#f57c00"} weight="fill" />
                        <Typography variant="body2" fontWeight={600}>
                          {advisory.harvestRisk.level === "low" ? t("weather.low") : t("weather.moderate")}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">{advisory.harvestRisk.reason}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(0,0,0,0.02)" }}>
                      <Typography variant="caption" color="text.secondary">{t("weather.diseaseRisk")}</Typography>
                      <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                        <Warning size={16} color={advisory.diseaseRisk.level === "low" ? "#2e7d32" : "#f57c00"} weight="fill" />
                        <Typography variant="body2" fontWeight={600}>
                          {advisory.diseaseRisk.level === "low" ? t("weather.low") : t("weather.moderate")}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">{advisory.diseaseRisk.disease}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(0,0,0,0.02)" }}>
                      <Typography variant="caption" color="text.secondary">{t("weather.irrigation")}</Typography>
                      <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                        <Drop size={16} color={advisory.irrigation.needed ? "#1565c0" : "#9e9e9e"} weight={advisory.irrigation.needed ? "fill" : "regular"} />
                        <Typography variant="body2" fontWeight={600}>
                          {advisory.irrigation.needed ? `${advisory.irrigation.amount} mm` : "—"}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {advisory.irrigation.needed ? t("weather.irrigation") : t("weather.low")}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <Eye size={20} />
                <Typography variant="h6" fontWeight={600}>{t("weather.history")}</Typography>
              </Box>
              {!history ? (
                <Grid container spacing={2}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Grid item xs={6} sm={3} key={i}>
                      <Skeleton variant="rounded" width="100%" height={80} />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(211,47,47,0.06)", textAlign: "center" }}>
                      <Typography variant="h4" fontWeight={700} color="#d32f2f">{tempMax30}°</Typography>
                      <Typography variant="body2" color="text.secondary">{t("weather.temperature")} max</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(25,118,210,0.06)", textAlign: "center" }}>
                      <Typography variant="h4" fontWeight={700} color="#1976d2">{tempMin30}°</Typography>
                      <Typography variant="body2" color="text.secondary">{t("weather.temperature")} min</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(21,101,192,0.06)", textAlign: "center" }}>
                      <Typography variant="h4" fontWeight={700} color="#1565c0">{totalPrecip.toFixed(0)} mm</Typography>
                      <Typography variant="body2" color="text.secondary">{t("weather.precipitation")} total</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: "rgba(46,125,50,0.06)", textAlign: "center" }}>
                      <Typography variant="h4" fontWeight={700} color="#2e7d32">{avgHumidity}%</Typography>
                      <Typography variant="body2" color="text.secondary">{t("weather.humidity")} moy.</Typography>
                    </Box>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Weather;
