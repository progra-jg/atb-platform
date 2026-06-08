import React, { useState } from "react";
import {
  Box, Grid, Typography, Card, CardContent, Select, MenuItem, FormControl, InputLabel,
  Button, Chip, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Divider, LinearProgress,
} from "@mui/material";
import {
  ChartLine, TrendUp, TrendDown, ArrowsClockwise, Gear, PlayCircle,
  Clock, CheckCircle, Warning,
} from "@phosphor-icons/react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Area, ComposedChart, Legend,
} from "recharts";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  fetchPredictionAccuracy, runBacktest, fetchPredictionSummary,
} from "../services/prediction-admin";

const CROPS = ["Café", "Cacao", "Anacarde", "Maïs", "Coton", "Riz", "Soja", "Manioc", "Ananas"];
const REGIONS = ["Zou", "Borgou", "Mono", "Ouémé", "Atlantique", "Collines", "Couffo", "Plateau", "Donga", "Alibori", "Atacora", "Littoral", "Kouffou", "Agneby-Tiassa", "Savanes"];

const trendIcon = (trend: string) => {
  switch (trend) {
    case "up": return <TrendUp size={16} color="#2e7d32" weight="bold" />;
    case "down": return <TrendDown size={16} color="#c62828" weight="bold" />;
    default: return <ArrowsClockwise size={16} color="#757575" />;
  }
};

const trendColor = (trend: string) => {
  switch (trend) {
    case "up": return "#2e7d32";
    case "down": return "#c62828";
    default: return "#757575";
  }
};

export default function PredictionsAdmin() {
  const { t } = useTranslation();
  const [crop, setCrop] = useState("Café");
  const [region, setRegion] = useState("Kouffou");

  const mockPredictionPoints = Array.from({ length: 90 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    const base = 2800;
    const seasonal = Math.sin((i / 365) * 2 * Math.PI * 12) * base * 0.1;
    const noise = (Math.random() - 0.5) * base * 0.02;
    const predicted = base + seasonal + noise + (base * 0.0008 * i);
    const ci = base * 0.04 * Math.sqrt(i + 1);
    return {
      date: date.toISOString().split("T")[0],
      predicted: Math.round(predicted),
      lower: Math.round(predicted - ci),
      upper: Math.round(predicted + ci),
    };
  });

  const { data: accuracy, isLoading: accuracyLoading } = useQuery({
    queryKey: ["prediction-accuracy", crop, region],
    queryFn: () => fetchPredictionAccuracy(crop, region),
  });

  const { data: summary } = useQuery({
    queryKey: ["prediction-summary"],
    queryFn: fetchPredictionSummary,
  });

  const backtestMutation = useMutation({
    mutationFn: () => runBacktest(crop, region),
  });

  const backtestResult = backtestMutation.data;
  const chartData = mockPredictionPoints;

  const isMobile = false;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={700}>{t("predictions.title")}</Typography>
          <Typography variant="body2" color="text.secondary">{t("predictions.subtitle")}</Typography>
        </Box>
        <Box display="flex" gap={2} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t("predictions.crop")}</InputLabel>
            <Select value={crop} label={t("predictions.crop")} onChange={(e) => setCrop(e.target.value)}>
              {CROPS.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>{t("predictions.region")}</InputLabel>
            <Select value={region} label={t("predictions.region")} onChange={(e) => setRegion(e.target.value)}>
              {REGIONS.map((r) => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            size="small"
            onClick={() => {}}
            sx={{ bgcolor: "#f57c00", "&:hover": { bgcolor: "#e65100" }, textTransform: "none", gap: 1 }}
          >
            <PlayCircle size={18} />
            {t("predictions.generate")}
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => backtestMutation.mutate()}
            disabled={backtestMutation.isPending}
            sx={{ textTransform: "none", gap: 1 }}
          >
            <Gear size={18} />
            {backtestMutation.isPending ? t("predictions.generating") : t("predictions.backtest")}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <ChartLine size={20} color="#f57c00" />
                <Typography variant="h6" fontWeight={600}>
                  {t("predictions.title")} — {crop} / {region}
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="predCIGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f57c00" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f57c00" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(d: string) => {
                      const p = d.split("-");
                      return `${p[2]}/${p[1]}`;
                    }}
                    interval={14}
                  />
                  <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} width={50} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    labelFormatter={(d: string) => {
                      const p = d.split("-");
                      return `${p[2]}/${p[1]}/${p[0]}`;
                    }}
                    formatter={(value: any) => [`${Number(value).toLocaleString()} FCFA`]}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="upper" fill="url(#predCIGrad)" stroke="none" name="CI 95% (upper)" />
                  <Area type="monotone" dataKey="lower" fill="url(#predCIGrad)" stroke="none" name="CI 95% (lower)" />
                  <Line type="monotone" dataKey="predicted" stroke="#f57c00" strokeWidth={2.5} strokeDasharray="6,3" dot={false} activeDot={{ r: 5, fill: "#f57c00" }} name={t("predictions.title")} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, height: "100%" }}>
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <CheckCircle size={20} color="#2e7d32" />
                <Typography variant="h6" fontWeight={600}>{t("predictions.accuracy")}</Typography>
              </Box>
              {accuracyLoading ? (
                <Box>
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} variant="rounded" width="100%" height={40} sx={{ mb: 1.5 }} />
                  ))}
                </Box>
              ) : accuracy ? (
                <Box>
                  <AccuracyRow label={t("predictions.mae")} value={accuracy.mae} unit="" />
                  <AccuracyRow label={t("predictions.rmse")} value={accuracy.rmse} unit="" />
                  <AccuracyRow label={t("predictions.mape")} value={accuracy.mape} unit="%" />
                  <Divider sx={{ my: 1.5 }} />
                  <AccuracyRow label={t("predictions.sampleSize")} value={accuracy.sampleSize} unit="" />
                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                      {t("predictions.accuracy")}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box flex={1}>
                        <LinearProgress
                          variant="determinate"
                          value={Math.max(0, 100 - accuracy.mape)}
                          sx={{
                            height: 8, borderRadius: 4,
                            bgcolor: "rgba(0,0,0,0.06)",
                            "& .MuiLinearProgress-bar": {
                              bgcolor: accuracy.mape < 10 ? "#2e7d32" : accuracy.mape < 20 ? "#f57c00" : "#c62828",
                            },
                          }}
                        />
                      </Box>
                      <Typography variant="body2" fontWeight={700}>
                        {(100 - accuracy.mape).toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ) : null}
            </CardContent>
          </Card>
        </Grid>

        {backtestResult && (
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <Gear size={20} color="#1565c0" />
                  <Typography variant="h6" fontWeight={600}>{t("predictions.backtest")}</Typography>
                  <Chip
                    label={backtestResult.modelType}
                    size="small"
                    sx={{ ml: 1, bgcolor: "rgba(21,101,192,0.1)", color: "#1565c0", fontWeight: 600 }}
                  />
                </Box>
                <Grid container spacing={2} mb={2}>
                  <Grid item xs={4} md={3}>
                    <AccuracyRow label={t("predictions.mae")} value={backtestResult.accuracy.mae} unit="" />
                  </Grid>
                  <Grid item xs={4} md={3}>
                    <AccuracyRow label={t("predictions.rmse")} value={backtestResult.accuracy.rmse} unit="" />
                  </Grid>
                  <Grid item xs={4} md={3}>
                    <AccuracyRow label={t("predictions.mape")} value={backtestResult.accuracy.mape} unit="%" />
                  </Grid>
                  <Grid item xs={4} md={3}>
                    <AccuracyRow label={t("predictions.sampleSize")} value={backtestResult.accuracy.sampleSize} unit="" />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <ChartLine size={20} color="#1b5e20" />
                <Typography variant="h6" fontWeight={600}>{t("predictions.summary")}</Typography>
              </Box>
              {!summary || summary.length === 0 ? (
                <Box display="flex" alignItems="center" gap={1} py={4} justifyContent="center">
                  <Warning size={20} color="#757575" />
                  <Typography color="text.secondary">{t("predictions.noData")}</Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} sx={{ boxShadow: "none", borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>{t("predictions.crop")}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t("predictions.region")}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{t("predictions.nextWeek")}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{t("predictions.nextMonth")}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{t("predictions.nextQuarter")}</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>{t("predictions.trend")}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{t("predictions.accuracy_")}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {summary.map((row: any, i: number) => (
                        <TableRow key={i} sx={{ "&:hover": { bgcolor: "rgba(0,0,0,0.02)" } }}>
                          <TableCell>{row.crop}</TableCell>
                          <TableCell>{row.region}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{row.nextWeek.toLocaleString()}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{row.nextMonth.toLocaleString()}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>{row.nextQuarter.toLocaleString()}</TableCell>
                          <TableCell align="center">
                            <Box display="flex" justifyContent="center">
                              {trendIcon(row.trend)}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${row.accuracy}%`}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                bgcolor: row.accuracy >= 90 ? "rgba(46,125,50,0.1)" : row.accuracy >= 85 ? "rgba(245,124,0,0.1)" : "rgba(198,40,40,0.1)",
                                color: row.accuracy >= 90 ? "#2e7d32" : row.accuracy >= 85 ? "#e65100" : "#c62828",
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function AccuracyRow({ label, value, unit }: { label: string; value: number; unit?: string }) {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={700}>
        {typeof value === "number" ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : value}
        {unit}
      </Typography>
    </Box>
  );
}
