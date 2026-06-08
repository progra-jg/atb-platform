import React from "react";
import {
  Box, Grid, Typography, Card, CardContent, LinearProgress, Avatar, Skeleton, Chip, Button,
} from "@mui/material";
import {
  Users, Plant, SealCheck, Warning, Package, TrendUp, TrendDown,
  Circle, Clock, CheckCircle, XCircle, ArrowRight, MapPin, Database,
} from "@phosphor-icons/react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardData } from "../services/dashboard";
import type { DashboardData } from "../services/dashboard";
import { useNavigate } from "react-router-dom";

const iconMap = [Users, Package, SealCheck, Plant, Warning];

const SummaryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"], queryFn: fetchDashboardData,
  });

  const d: DashboardData = data ?? {
    kpis: [], evolution: [], cultureRepartition: [],
    monthlyCerts: [], completion: [],
    systemHealth: [], pendingActions: [], regionData: [], recentAlerts: [],
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4">Tableau de bord</Typography>
          <Typography variant="body2" color="text.secondary">Vue d'ensemble de la plateforme ATB AgriTrace</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} mb={3}>
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Grid item xs={12} sm={6} md key={i}>
                <Card><CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                  <Skeleton variant="circular" width={48} height={48} />
                  <Skeleton variant="rounded" width="60%" height={28} sx={{ mt: 2 }} />
                  <Skeleton variant="rounded" width="40%" height={16} sx={{ mt: 1 }} />
                </CardContent></Card>
              </Grid>
            ))
          : d.kpis.map((kpi, i) => {
              const Icon = iconMap[i] || Package;
              return (
                <Grid item xs={12} sm={6} md key={kpi.label}>
                  <Card sx={{ "&:hover": { transform: "translateY(-2px)", transition: "0.2s" } }}>
                    <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Avatar sx={{ bgcolor: kpi.bg, color: kpi.color, width: 48, height: 48 }}><Icon /></Avatar>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          {kpi.up ? <TrendUp size={18} color="green" weight="bold" /> : <TrendDown size={18} color="red" weight="bold" />}
                          <Typography variant="caption" fontWeight={700} color={kpi.up ? "success.main" : "error.main"}>{kpi.change}</Typography>
                        </Box>
                      </Box>
                      <Typography variant="h4" fontWeight={700} mb={0.5}>{kpi.value}</Typography>
                      <Typography variant="body2" color="text.secondary">{kpi.label}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
      </Grid>

      {/* System Health + Pending Actions */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <Database size={18} /> Santé du système
              </Typography>
              <Box display="flex" flexDirection="column" gap={1.5}>
                {d.systemHealth.map((s) => (
                  <Box key={s.label} display="flex" alignItems="center" justifyContent="space-between" p={1.5} borderRadius={2} bgcolor="rgba(0,0,0,0.02)">
                    <Box display="flex" alignItems="center" gap={1.5}>
                      {s.status === "ok" ? <CheckCircle size={14} color="#2e7d32" weight="fill" /> : <Warning size={14} color="#ed6c02" weight="fill" />}
                      <Typography variant="body2" fontWeight={500}>{s.label}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="caption" color="text.secondary">{s.uptime}</Typography>
                      <Chip label={s.status === "ok" ? "OK" : "Warning"} size="small" color={s.status === "ok" ? "success" : "warning"} sx={{ height: 22, fontSize: 11 }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <Clock size={18} /> Actions en attente
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                {d.pendingActions.map((a) => (
                  <Button key={a.action} onClick={() => navigate(a.path)} variant="text" fullWidth sx={{
                    justifyContent: "space-between", textTransform: "none", p: 1.5, borderRadius: 2,
                    color: "text.primary", "&:hover": { bgcolor: "rgba(27,94,32,0.06)" },
                  }}>
                    <Typography variant="body2" fontWeight={500}>{a.action}</Typography>
                    <Chip label={a.count} size="small" color="primary" sx={{ fontWeight: 700 }} />
                  </Button>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <Warning size={18} color="#d32f2f" /> Alertes récentes
              </Typography>
              {d.recentAlerts.map((a, i) => (
                <Box key={i} display="flex" alignItems="center" gap={1.5} p={1.5} borderRadius={2} bgcolor="rgba(0,0,0,0.02)" mb={1}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: a.severity === "Haute" ? "#d32f2f" : a.severity === "Moyenne" ? "#ed6c02" : "#2e7d32", flexShrink: 0 }} />
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight={600}>{a.parcelle} — {a.type}</Typography>
                    <Typography variant="caption" color="text.secondary">{a.date}</Typography>
                  </Box>
                  <Chip label={a.severity} size="small" color={a.severity === "Haute" ? "error" : a.severity === "Moyenne" ? "warning" : "success"} sx={{ height: 22, fontSize: 11 }} />
                </Box>
              ))}
              <Box mt={1}>
                <Button size="small" onClick={() => navigate("/alerts")} endIcon={<ArrowRight size={14} />} sx={{ textTransform: "none", color: "primary.main" }}>
                  Voir toutes les alertes
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts area */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
              <Typography variant="h6" gutterBottom>Évolution des lots tracés</Typography>
              {isLoading ? (
                <Skeleton variant="rounded" width="100%" height={320} />
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={d.evolution}>
                    <defs>
                      <linearGradient id="colorLots" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1b5e20" stopOpacity={0.3} /><stop offset="95%" stopColor="#1b5e20" stopOpacity={0} /></linearGradient>
                      <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f57c00" stopOpacity={0.2} /><stop offset="95%" stopColor="#f57c00" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="lots" stroke="#1b5e20" fill="url(#colorLots)" strokeWidth={2} name="Lots" />
                    <Area type="monotone" dataKey="producteurs" stroke="#f57c00" fill="url(#colorProd)" strokeWidth={2} name="Producteurs" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
              <Typography variant="h6" gutterBottom>Activité par région</Typography>
              {d.regionData.map((r) => (
                <Box key={r.region} mb={1.5}>
                  <Box display="flex" justifyContent="space-between" mb={0.3}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <MapPin size={12} color={r.color} />
                      <Typography variant="body2" fontWeight={600}>{r.region}</Typography>
                    </Box>
                    <Typography variant="caption" fontWeight={500}>{r.lots} lots</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <LinearProgress variant="determinate" value={d.regionData.length > 0 ? (r.lots / Math.max(...d.regionData.map((x: any) => x.lots))) * 100 : 0} sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: "rgba(0,0,0,0.06)", "& .MuiLinearProgress-bar": { bgcolor: r.color, borderRadius: 3 } }} />
                    <Typography variant="caption" color="text.secondary">{r.producteurs} prod.</Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
              <Typography variant="h6" gutterBottom>Certifications mensuelles</Typography>
              {isLoading ? (
                <Skeleton variant="rounded" width="100%" height={200} />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={d.monthlyCerts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="certs" fill="#f57c00" radius={[6, 6, 0, 0]} name="Certifications" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Completion + Culture repartition */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
              <Typography variant="h6" gutterBottom>Taux de complétion par filière</Typography>
              {isLoading ? (
                <Grid container spacing={2}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Grid item xs={12} sm={6} md key={i}>
                      <Skeleton variant="rounded" width="100%" height={48} />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Grid container spacing={2}>
                  {d.completion.map((f) => (
                    <Grid item xs={12} sm={6} md key={f.name}>
                      <Box>
                        <Box display="flex" justifyContent="space-between" mb={0.5}>
                          <Typography variant="body2" fontWeight={600}>{f.name}</Typography>
                          <Typography variant="body2" fontWeight={700} color="primary.main">{f.pct}%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={f.pct} sx={{ height: 8, borderRadius: 4, bgcolor: "rgba(0,0,0,0.06)", "& .MuiLinearProgress-bar": { bgcolor: f.color, borderRadius: 4 } }} />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
              <Typography variant="h6" gutterBottom>Répartition par culture</Typography>
              {isLoading ? (
                <Skeleton variant="rounded" width="100%" height={250} />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={d.cultureRepartition} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value"
                      label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {d.cultureRepartition.map((entry, idx) => <Cell key={idx} fill={entry.color} stroke="none" />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SummaryDashboard;
