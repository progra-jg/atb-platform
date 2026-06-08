import React from "react";
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, Grid, Card, CardContent,
  Avatar, Skeleton, Tooltip,
} from "@mui/material";
import {
  CheckCircle, WarningCircle, Clock, ShieldCheck,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { fetchCertificates } from "../services/certificates";
import type { CertificateItem } from "../types";

const statutConfig: Record<string, { color: "success" | "error" | "warning"; bg: string }> = {
  Valide: { color: "success", bg: "rgba(46,125,50,0.1)" },
  Expiré: { color: "error", bg: "rgba(211,47,47,0.1)" },
  "En attente": { color: "warning", bg: "rgba(237,108,2,0.1)" },
};

const typeColors: Record<string, string> = {
  EUDR: "#2e7d32",
  GlobalGAP: "#1565c0",
  "Rainforest Alliance": "#43a047",
  "Fair Trade": "#e65100",
  Bio: "#558b2f",
};

const Certifications: React.FC = () => {
  const { data: certs, isLoading } = useQuery({
    queryKey: ["certificates"],
    queryFn: fetchCertificates,
  });

  const list = certs ?? [];
  const total = list.length;
  const valides = list.filter((c: CertificateItem) => c.statut === "Valide").length;
  const expires = list.filter((c: CertificateItem) => c.statut === "Expiré").length;
  const blockchainCount = list.filter((c: CertificateItem) => c.blockchain).length;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4">Certifications</Typography>
          <Typography variant="body2" color="text.secondary">Gestion des certificats de traçabilité</Typography>
        </Box>
      </Box>

      <Grid container spacing={3} mb={3}>
        {[
          { label: "Total certificats", value: total, color: "primary.main", bg: "rgba(27,94,32,0.1)" },
          { label: "Valides", value: valides, color: "success.main", bg: "rgba(46,125,50,0.1)" },
          { label: "Expirés", value: expires, color: "error.main", bg: "rgba(211,47,47,0.1)" },
          { label: "Blockchain", value: blockchainCount, color: "info.main", bg: "rgba(2,136,209,0.1)" },
        ].map((stat) => (
          <Grid item xs={6} sm={3} key={stat.label}>
            <Card>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, py: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Avatar sx={{ bgcolor: stat.bg, color: stat.color, width: 44, height: 44, fontWeight: 700, fontSize: 18 }}>
                  {stat.label.charAt(0)}
                </Avatar>
                <Box>
                  {isLoading ? (
                    <Skeleton variant="rounded" width={50} height={28} />
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

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Lot</TableCell>
                <TableCell>Culture</TableCell>
                <TableCell align="center">Statut</TableCell>
                <TableCell>Émis le</TableCell>
                <TableCell>Expire le</TableCell>
                <TableCell>Émetteur</TableCell>
                <TableCell align="center">Format</TableCell>
                <TableCell align="center">Blockchain</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j} align={j >= 3 && j !== 4 && j !== 5 ? "center" : "left"}>
                        <Skeleton variant="rounded" width={j === 0 ? 100 : 70} height={20} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : list.map((c: CertificateItem) => {
                const st = statutConfig[c.statut];
                return (
                  <TableRow key={c.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: typeColors[c.type] || "#78909c" }} />
                        <Typography fontWeight={600}>{c.type}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2">{c.lot}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{c.culture}</Typography></TableCell>
                    <TableCell align="center">
                      <Chip label={c.statut} color={st?.color || "default"} size="small" />
                    </TableCell>
                    <TableCell><Typography variant="body2">{c.emis}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{c.expire}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{c.emetteur}</Typography></TableCell>
                    <TableCell align="center">
                      <Chip label={c.format} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={c.blockchain ? "Certificat enregistré sur la blockchain" : "Non enregistré sur la blockchain"}>
                        <Box display="flex" justifyContent="center">
                          {c.blockchain ? (
                            <ShieldCheck size={20} color="#2e7d32" />
                          ) : (
                            <Clock size={20} color="#bdbdbd" />
                          )}
                        </Box>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default Certifications;
