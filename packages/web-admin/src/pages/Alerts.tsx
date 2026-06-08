import React, { useState } from "react";
import {
  Box, Typography, Paper, Card, CardContent, Chip, Grid, Avatar, Button, Skeleton, Alert,
} from "@mui/material";
import {
  Warning, CheckCircle, Clock, Image, Crosshair,
} from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAlerts, runComplianceCheck } from "../services/alerts";
import type { AlertItem } from "../types";
import SatelliteImage from "../components/SatelliteImage";

const severityConfig: Record<string, { color: "error" | "warning" | "success"; bg: string; icon: React.ReactNode }> = {
  Haute: { color: "error", bg: "rgba(211,47,47,0.1)", icon: <Warning /> },
  Moyenne: { color: "warning", bg: "rgba(237,108,2,0.1)", icon: <Warning /> },
  Basse: { color: "success", bg: "rgba(46,125,50,0.1)", icon: <CheckCircle /> },
};

const statusConfig: Record<string, { color: "error" | "warning" | "success"; bg: string }> = {
  "Non résolu": { color: "error", bg: "rgba(211,47,47,0.08)" },
  "En cours": { color: "warning", bg: "rgba(237,108,2,0.08)" },
  "Résolu": { color: "success", bg: "rgba(46,125,50,0.08)" },
};

const Alerts: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: alerts, isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: fetchAlerts,
  });
  const [analysing, setAnalysing] = useState(false);
  const [analysisMsg, setAnalysisMsg] = useState<string | null>(null);

  const handleAnalyse = async () => {
    setAnalysing(true);
    setAnalysisMsg(null);
    try {
      const result = await runComplianceCheck();
      setAnalysisMsg(`Analyse terminée : ${result.total} parcelles vérifiées.`);
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
    } catch {
      setAnalysisMsg("Erreur lors de l'analyse. Vérifiez que le serveur API est accessible.");
    } finally {
      setAnalysing(false);
    }
  };

  const list = alerts ?? [];
  const total = list.length;
  const nonResolues = list.filter((a: AlertItem) => a.status === "Non résolu").length;
  const enCours = list.filter((a: AlertItem) => a.status === "En cours").length;
  const resolues = list.filter((a: AlertItem) => a.status === "Résolu").length;
  const surfaceTotale = list.reduce((s: number, a: AlertItem) => s + parseFloat(a.surface), 0).toFixed(1);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4">Alertes déforestation</Typography>
          <Typography variant="body2" color="text.secondary">Surveillance satellite des parcelles agricoles</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          {analysisMsg && <Alert severity="info" sx={{ py: 0, px: 2 }}>{analysisMsg}</Alert>}
          <Button variant="contained" startIcon={<Image />} onClick={handleAnalyse} disabled={analysing}>{analysing ? "Analyse en cours..." : "Analyser maintenant"}</Button>
        </Box>
      </Box>

      <Grid container spacing={3} mb={3}>
        {[
          { label: "Total alertes", value: total, color: "error.main" },
          { label: "Non résolues", value: nonResolues, color: "error.main" },
          { label: "En cours", value: enCours, color: "warning.main" },
          { label: "Résolues", value: resolues, color: "success.main" },
        ].map((stat) => (
          <Grid item xs={6} sm={3} key={stat.label}>
            <Card>
              <CardContent sx={{ textAlign: "center", py: 3, "&:last-child": { pb: 3 } }}>
                {isLoading ? (
                  <Skeleton variant="rounded" width={60} height={40} sx={{ mx: "auto", mb: 1 }} />
                ) : (
                  <Typography variant="h3" fontWeight={700} color={stat.color}>{stat.value}</Typography>
                )}
                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Comparaison satellite</Typography>
                <Chip icon={<Clock size={16} />} label="Dernière analyse: 24h" size="small" variant="outlined" />
              </Box>
              <SatelliteImage dateBefore="2023-03" dateAfter="2024-03" />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
              <Typography variant="h6" gutterBottom>Statistiques</Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: "rgba(211,47,47,0.1)", color: "error.main" }}>
                    <Warning fontSize="small" />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Surface impactée totale</Typography>
                    {isLoading ? (
                      <Skeleton variant="rounded" width={80} height={32} />
                    ) : (
                      <Typography variant="h5" fontWeight={700} color="error.main">{surfaceTotale} ha</Typography>
                    )}
                  </Box>
                </Box>
                <Box display="flex" gap={1}>
                  {[{ label: "Haute", value: list.filter((a: AlertItem) => a.severity === "Haute").length, color: "error.main", bg: "rgba(211,47,47,0.1)" },
                    { label: "Moyenne", value: list.filter((a: AlertItem) => a.severity === "Moyenne").length, color: "warning.main", bg: "rgba(237,108,2,0.1)" },
                    { label: "Basse", value: list.filter((a: AlertItem) => a.severity === "Basse").length, color: "success.main", bg: "rgba(46,125,50,0.1)" },
                  ].map((s) => (
                    <Box key={s.label} flex={1} textAlign="center" p={1.5} borderRadius={2} bgcolor={s.bg}>
                      <Typography variant="h5" fontWeight={700} color={s.color}>{s.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h6" gutterBottom>Historique des alertes</Typography>
      <Box sx={{ position: "relative" }}>
        <Box sx={{ position: "absolute", left: 27, top: 0, bottom: 0, width: 2, bgcolor: "rgba(0,0,0,0.08)" }} />
        {isLoading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <Card key={idx} sx={{ mb: 2, ml: 6, position: "relative" }}>
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Box display="flex" gap={2}>
                  <Skeleton variant="circular" width={36} height={36} />
                  <Box flex={1}>
                    <Skeleton variant="rounded" width="40%" height={20} />
                    <Skeleton variant="rounded" width="60%" height={14} sx={{ mt: 1 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))
        ) : list.map((alert: AlertItem) => {
          const sev = severityConfig[alert.severity];
          const st = statusConfig[alert.status];
          return (
            <Card key={alert.id} sx={{ mb: 2, ml: 6, position: "relative" }}>
              <Box sx={{ position: "absolute", left: -44, top: 20 }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: sev.bg, color: `${sev.color}.main`, border: "3px solid white" }}>
                  {sev.icon}
                </Avatar>
              </Box>
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Grid container alignItems="center" spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Crosshair size={16} color="gray" />
                      <Typography variant="body2" fontWeight={600}>Parcelle {alert.parcelle}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">{alert.culture} — {alert.surface}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <Typography variant="caption" color="text.secondary">Coordonnées</Typography>
                    <Typography variant="body2">{alert.coordinates}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <Typography variant="caption" color="text.secondary">Date</Typography>
                    <Typography variant="body2">{alert.date}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <Chip label={alert.severity} color={sev.color} size="small" />
                  </Grid>
                  <Grid item xs={6} sm={2}>
                    <Chip label={alert.status} sx={{ bgcolor: st.bg, color: `${st.color}.main`, fontWeight: 600 }} size="small" />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
};

export default Alerts;
