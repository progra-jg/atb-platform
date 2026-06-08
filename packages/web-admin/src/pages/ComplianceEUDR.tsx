import React from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Grid, Card, CardContent,
  LinearProgress, Avatar, Skeleton,
} from "@mui/material";
import {
  SealCheck, XCircle, ChartPie, ChartBar,
} from "@phosphor-icons/react";
import {
  PieChart as RePie, Pie, Cell, ResponsiveContainer, Tooltip,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { fetchComplianceReports } from "../services/compliance";
import type { ReportRow } from "../types";
import ExportReportButton from "../components/ExportReportButton";
import { downloadCSV, downloadPDF, downloadXML } from "../utils/export";

const filiereColors: Record<string, string> = {
  Cacao: "#5d4037",
  Coton: "#78909c",
  Anacarde: "#ffb300",
  Café: "#4e342e",
  Maïs: "#ffd54f",
};

const ComplianceEUDR: React.FC = () => {
  const { data: reports, isLoading } = useQuery({
    queryKey: ["compliance"],
    queryFn: fetchComplianceReports,
  });

  const list = reports ?? [];
  const totalLots = list.reduce((s: number, r: ReportRow) => s + r.lots, 0);
  const totalConformes = list.reduce((s: number, r: ReportRow) => s + r.conformes, 0);
  const totalNonConformes = list.reduce((s: number, r: ReportRow) => s + r.nonConformes, 0);
  const tauxGlobal = totalLots ? ((totalConformes / totalLots) * 100).toFixed(1) : "0";

  const pieData = [
    { name: "Conformes", value: totalConformes, color: "#2e7d32" },
    { name: "Non conformes", value: totalNonConformes, color: "#d32f2f" },
  ];

  const handleExport = (format: "pdf" | "excel" | "xml") => {
    const rows = (reports ?? list).map((r: ReportRow) => [r.filiere, r.lots, r.conformes, r.nonConformes, `${r.taux}%`, r.taux >= 95 ? "Conforme" : "Non conforme"]);
    const headers = ["Filière", "Total lots", "Conformes", "Non conformes", "Taux", "Statut"];

    if (format === "excel") {
      downloadCSV(headers, rows, `conformite-eudr-${new Date().toISOString().slice(0, 10)}`);
    } else if (format === "pdf") {
      const text = `CONFORMITÉ EUDR — ${new Date().toLocaleDateString("fr-FR")}\n${"=".repeat(50)}\n\n${rows.map((r) => `${r[0]} | Lots: ${r[1]} | Conformes: ${r[2]} | Non conformes: ${r[3]} | Taux: ${r[4]} | ${r[5]}`).join("\n")}\n\n${"=".repeat(50)}\nTotal conformes: ${totalConformes}/${totalLots} (${tauxGlobal}%)`;
      downloadPDF(text, `conformite-eudr-${new Date().toISOString().slice(0, 10)}`);
    } else if (format === "xml") {
      const xml = `<ConformiteEUDR date="${new Date().toISOString().slice(0, 10)}">
  ${list.map((r: ReportRow) => `  <Filiere nom="${r.filiere}" lots="${r.lots}" conformes="${r.conformes}" nonConformes="${r.nonConformes}" taux="${r.taux}" statut="${r.taux >= 95 ? "Conforme" : "Non conforme"}" />`).join("\n")}
  <Resume lots="${totalLots}" conformes="${totalConformes}" nonConformes="${totalNonConformes}" tauxGlobal="${tauxGlobal}" />
</ConformiteEUDR>`;
      downloadXML(xml, `conformite-eudr-${new Date().toISOString().slice(0, 10)}`);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4">Conformité EUDR</Typography>
          <Typography variant="body2" color="text.secondary">Règlement européen contre la déforestation</Typography>
        </Box>
        <ExportReportButton onExport={handleExport} />
      </Box>

      <Grid container spacing={3} mb={3}>
        {[
          { label: "Lots conformes", value: totalConformes, color: "success.main", bg: "rgba(46,125,50,0.1)", icon: <SealCheck />, avatarColor: "success.main" },
          { label: "Lots non conformes", value: totalNonConformes, color: "error.main", bg: "rgba(211,47,47,0.1)", icon: <XCircle />, avatarColor: "error.main" },
          { label: "Taux de conformité", value: `${tauxGlobal}%`, color: "info.main", bg: "rgba(2,136,209,0.1)", icon: <ChartPie />, avatarColor: "info.main" },
          { label: "Total lots analysés", value: totalLots, color: "secondary.main", bg: "rgba(123,31,162,0.1)", icon: <ChartBar />, avatarColor: "secondary.main" },
        ].map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.label}>
            <Card>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, py: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Avatar sx={{ bgcolor: stat.bg, color: stat.avatarColor, width: 48, height: 48 }}>{stat.icon}</Avatar>
                <Box>
                  {isLoading ? (
                    <Skeleton variant="rounded" width={60} height={32} />
                  ) : (
                    <Typography variant="h4" fontWeight={700} color={stat.color}>{stat.value}</Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
              <Typography variant="h6" gutterBottom>Répartition conformité</Typography>
              {isLoading ? (
                <Skeleton variant="rounded" width="100%" height={280} />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={280}>
                    <RePie>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value">
                        {pieData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePie>
                  </ResponsiveContainer>
                  <Box display="flex" justifyContent="center" gap={3} mt={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#2e7d32" }} />
                      <Typography variant="caption">Conformes</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "#d32f2f" }} />
                      <Typography variant="caption">Non conformes</Typography>
                    </Box>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
              <Typography variant="h6" gutterBottom>Taux de conformité par filière</Typography>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Box key={i} mb={2}>
                    <Skeleton variant="rounded" width="100%" height={36} />
                  </Box>
                ))
              ) : (
                <Box display="flex" flexDirection="column" gap={2.5}>
                  {list.map((r: ReportRow) => (
                    <Box key={r.filiere}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: filiereColors[r.filiere] }} />
                          <Typography variant="body2" fontWeight={600}>{r.filiere}</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Typography variant="caption" color="text.secondary">{r.conformes}/{r.lots} lots</Typography>
                          <Typography variant="body2" fontWeight={700} color={r.taux >= 95 ? "success.main" : r.taux >= 90 ? "warning.main" : "error.main"}>
                            {r.taux}%
                          </Typography>
                        </Box>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={r.taux}
                        sx={{
                          height: 10, borderRadius: 5, bgcolor: "rgba(0,0,0,0.06)",
                          "& .MuiLinearProgress-bar": {
                            bgcolor: r.taux >= 95 ? "#2e7d32" : r.taux >= 90 ? "#ed6c02" : "#d32f2f",
                            borderRadius: 5,
                          },
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Filière</TableCell>
                <TableCell align="center">Total lots</TableCell>
                <TableCell align="center">Conformes</TableCell>
                <TableCell align="center">Non conformes</TableCell>
                <TableCell align="center">Taux</TableCell>
                <TableCell align="center">Statut</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j} align={j === 0 ? "left" : "center"}>
                        <Skeleton variant="rounded" width={j === 0 ? 80 : 50} height={20} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : list.map((r: ReportRow) => (
                <TableRow key={r.filiere} hover sx={{ "&:last-child td": { border: 0 } }}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: filiereColors[r.filiere] }} />
                      <Typography fontWeight={600}>{r.filiere}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">{r.lots}</TableCell>
                  <TableCell align="center"><Typography color="success.main" fontWeight={600}>{r.conformes}</Typography></TableCell>
                  <TableCell align="center"><Typography color="error.main" fontWeight={600}>{r.nonConformes}</Typography></TableCell>
                  <TableCell align="center"><Typography fontWeight={700}>{r.taux}%</Typography></TableCell>
                  <TableCell align="center">
                    <Chip label={r.taux >= 95 ? "Conforme" : "Non conforme"} color={r.taux >= 95 ? "success" : "error"} size="small" variant="outlined" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default ComplianceEUDR;
