import React, { useState, useMemo } from "react";
import {
  Box, Typography, TextField, InputAdornment, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Chip, Button, Alert, Grid, Card, CardContent,
} from "@mui/material";
import {
  MagnifyingGlass, Clock, User, Funnel, DownloadSimple,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { fetchUsers } from "../services/users";
import { downloadCSV } from "../utils/export";
import type { LogEntry, UserAccount } from "../types";

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  Connexion: { bg: "#e8f5e9", color: "#2e7d32" },
  Déconnexion: { bg: "#f3e5f5", color: "#6a1b9a" },
  "Export CSV": { bg: "#e3f2fd", color: "#1565c0" },
  "Export PDF": { bg: "#e3f2fd", color: "#1565c0" },
  "Export système": { bg: "#e3f2fd", color: "#1565c0" },
  "Création lot": { bg: "#fff3e0", color: "#e65100" },
  Commande: { bg: "#fff3e0", color: "#e65100" },
  "Modification profil": { bg: "#fce4ec", color: "#c62828" },
  "Modification utilisateur": { bg: "#fce4ec", color: "#c62828" },
  "Consultation lots": { bg: "#e8f5e9", color: "#2e7d32" },
  "Validation certificat": { bg: "#e8f5e9", color: "#2e7d32" },
};

function AuditLog() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const { data: users, isLoading, isError } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const allLogs = useMemo(() => {
    if (!users) return [];
    const result: Array<LogEntry & { userName: string; userId: string; userRole: string }> = [];
    (users as UserAccount[]).forEach((u) => {
      (u.logs || []).forEach((log) => {
        result.push({ ...log, userName: u.name, userId: u.id, userRole: u.role });
      });
    });
    result.sort((a, b) => b.date.localeCompare(a.date));
    return result;
  }, [users]);

  const actionTypes = useMemo(() => {
    const types = new Set(allLogs.map((l) => l.action));
    return Array.from(types).sort();
  }, [allLogs]);

  const filtered = useMemo(() => {
    let result = allLogs;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q) ||
          l.userName.toLowerCase().includes(q) ||
          l.userId.toLowerCase().includes(q)
      );
    }
    if (actionFilter) {
      result = result.filter((l) => l.action === actionFilter);
    }
    return result;
  }, [allLogs, search, actionFilter]);

  const stats = {
    total: allLogs.length,
    users: new Set(allLogs.map((l) => l.userId)).size,
    actions: actionTypes.length,
  };

  const handleExport = () => {
    const headers = ["Date", "Utilisateur", "ID", "Rôle", "Action", "Détails"];
    const rows = filtered.map((l) => [l.date, l.userName, l.userId, l.userRole, l.action, l.details]);
    downloadCSV(headers, rows, `audit-logs-${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4">Journal d'audit</Typography>
          <Typography variant="body2" color="text.secondary">
            Toutes les activités des utilisateurs sur la plateforme
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<DownloadSimple />} onClick={handleExport}>
            Exporter CSV
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(27,94,32,0.08)", display: "flex" }}>
                <Clock size={24} color="#1b5e20" />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700}>{stats.total}</Typography>
                <Typography variant="body2" color="text.secondary">Événements totaux</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(21,101,192,0.08)", display: "flex" }}>
                <User size={24} color="#1565c0" />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700}>{stats.users}</Typography>
                <Typography variant="body2" color="text.secondary">Utilisateurs actifs</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(230,81,0,0.08)", display: "flex" }}>
                <Funnel size={24} color="#e65100" />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700}>{stats.actions}</Typography>
                <Typography variant="body2" color="text.secondary">Types d'actions</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Box display="flex" alignItems="center" gap={2} p={2} flexWrap="wrap">
          <TextField size="small" placeholder="Rechercher par action, détail, utilisateur..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><MagnifyingGlass size={16} /></InputAdornment> }}
            sx={{ flex: 1, maxWidth: 380 }}
          />
          <TextField size="small" select value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
            sx={{ minWidth: 200 }}
            SelectProps={{ native: true }}>
            <option value="">Toutes les actions</option>
            {actionTypes.map((a) => <option key={a} value={a}>{a}</option>)}
          </TextField>
        </Box>

        {isError && (
          <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
            Erreur de chargement. Affichage des données locales.
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Utilisateur</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Détails</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <TableCell key={j}>
                        <Box sx={{ height: 14, width: j === 3 ? 200 : 80, borderRadius: 1, bgcolor: "rgba(0,0,0,0.06)", animation: "pulse 1.5s ease-in-out infinite" }} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
                    Aucune activité trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((log, i) => {
                  const style = ACTION_COLORS[log.action] || { bg: "#f5f5f5", color: "#666" };
                  return (
                    <TableRow key={i} hover>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" fontSize="0.8rem" sx={{ whiteSpace: "nowrap" }}>
                          {log.date}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} fontSize="0.85rem">
                          {log.userName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {log.userId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={log.action} size="small"
                          sx={{ bgcolor: style.bg, color: style.color, fontWeight: 600 }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" fontSize="0.85rem">
                          {log.details}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination component="div" count={filtered.length} page={page}
          onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          labelRowsPerPage="Lignes par page" />
      </Paper>
    </Box>
  );
}

export default AuditLog;
