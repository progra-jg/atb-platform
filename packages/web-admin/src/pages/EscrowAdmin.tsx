import React, { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, Chip, Button,
  TablePagination, InputAdornment, Grid, Card, CardContent,
  Alert, Snackbar, IconButton, Tooltip, Collapse, Avatar,
  Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle,
  DialogContent, DialogActions, Radio, RadioGroup, FormControlLabel,
  Tabs, Tab, LinearProgress,
} from "@mui/material";
import {
  MagnifyingGlass, ShieldCheck, CurrencyCircleDollar, SealCheck,
  Warning, Check, XCircle, Funnel, CaretDown, CaretUp, ArrowRight,
  User, Storefront, Hash, CalendarCheck, Timer,
} from "@phosphor-icons/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchEscrows, fetchEscrowStats, resolveDispute, releaseFunds, cancelEscrow } from "../services/escrow-admin";
import type { EscrowContract, EscrowStatus } from "../services/escrow-admin";
import EmptyState from "../components/EmptyState";

const STATUS_CHIPS: Record<EscrowStatus, { label: string; color: "warning" | "info" | "secondary" | "success" | "error" | "default" | "primary" }> = {
  pending: { label: "En attente", color: "warning" },
  funded: { label: "Fondé", color: "info" },
  delivered: { label: "Livré", color: "secondary" },
  confirmed: { label: "Confirmé", color: "success" },
  released: { label: "Libéré", color: "success" },
  disputed: { label: "Litige", color: "error" },
  resolved: { label: "Résolu", color: "default" },
  refunded: { label: "Remboursé", color: "default" },
  cancelled: { label: "Annulé", color: "default" },
};

const STATUS_ACTIONS: Partial<Record<EscrowStatus, { label: string; action: string }[]>> = {
  disputed: [{ label: "Résoudre", action: "resolve" }],
  confirmed: [{ label: "Libérer", action: "release" }],
  pending: [{ label: "Annuler", action: "cancel" }],
};

const STATUS_ORDER: EscrowStatus[] = ["pending", "funded", "delivered", "confirmed", "released", "disputed", "resolved", "refunded", "cancelled"];

const CHART_COLORS: Record<string, string> = {
  pending: "#f57c00", funded: "#1565c0", delivered: "#6a1b9a", confirmed: "#2e7d32",
  released: "#1b5e20", disputed: "#c62828", resolved: "#4a148c", refunded: "#e65100", cancelled: "#616161",
};

function formatAmount(amount: number): string {
  return amount.toLocaleString("fr-FR") + " USDT";
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 7 }).map((_, i) => (
        <TableCell key={i}>
          <Box sx={{ height: 14, width: i === 1 ? 120 : 60, borderRadius: 1, bgcolor: "rgba(0,0,0,0.06)", animation: "pulse 1.5s ease-in-out infinite" }} />
        </TableCell>
      ))}
    </TableRow>
  );
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Box sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: "rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <Box sx={{ width: `${pct}%`, height: "100%", borderRadius: 4, bgcolor: color, transition: "width 1s ease" }} />
      </Box>
      <Typography variant="caption" fontWeight={700} sx={{ minWidth: 70, textAlign: "right" }}>{formatAmount(value)}</Typography>
    </Box>
  );
}

export default function EscrowAdmin() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [notify, setNotify] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({ open: false, message: "", severity: "success" });
  const [resolveDialog, setResolveDialog] = useState<{ escrow: EscrowContract | null; resolution: string }>({ escrow: null, resolution: "release_to_seller" });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data: escrows, isLoading, refetch } = useQuery({
    queryKey: ["escrows", statusFilter],
    queryFn: () => fetchEscrows({ status: statusFilter || undefined }),
  });

  const { data: stats } = useQuery({
    queryKey: ["escrowStats"],
    queryFn: fetchEscrowStats,
  });

  const list = escrows ?? [];

  const filtered = list.filter((e) => {
    if (search && !e.orderId.toLowerCase().includes(search.toLowerCase()) && !e.id.toLowerCase().includes(search.toLowerCase()) && !(e.buyerName?.toLowerCase() || "").includes(search.toLowerCase()) && !(e.producteurName?.toLowerCase() || "").includes(search.toLowerCase())) return false;
    return true;
  });

  const handleAction = useCallback(async (escrow: EscrowContract, action: string) => {
    setActionLoading(`${action}_${escrow.id}`);
    try {
      if (action === "release") {
        await releaseFunds(escrow.id);
        setNotify({ open: true, message: "Fonds libérés avec succès", severity: "success" });
      } else if (action === "cancel") {
        await cancelEscrow(escrow.id);
        setNotify({ open: true, message: "Escrow annulé", severity: "success" });
      }
      refetch();
      queryClient.invalidateQueries({ queryKey: ["escrowStats"] });
    } catch {
      setNotify({ open: true, message: "Erreur lors de l'action", severity: "error" });
    }
    setActionLoading(null);
  }, [refetch, queryClient]);

  const handleResolve = useCallback(async () => {
    const { escrow, resolution } = resolveDialog;
    if (!escrow) return;
    setActionLoading(`resolve_${escrow.id}`);
    try {
      await resolveDispute(escrow.id, resolution as "release_to_seller" | "refund_buyer" | "split");
      setNotify({ open: true, message: "Litige résolu avec succès", severity: "success" });
      setResolveDialog({ escrow: null, resolution: "release_to_seller" });
      refetch();
      queryClient.invalidateQueries({ queryKey: ["escrowStats"] });
    } catch {
      setNotify({ open: true, message: "Erreur lors de la résolution", severity: "error" });
    }
    setActionLoading(null);
  }, [resolveDialog, refetch, queryClient]);

  const statCards = useMemo(() => [
    { label: t("escrow.kpis.totalVolume"), value: stats ? formatAmount(stats.totalVolume) : "—", icon: <CurrencyCircleDollar size={24} />, bg: "rgba(27,94,32,0.08)", color: "#1b5e20" },
    { label: t("escrow.kpis.activeCount"), value: stats ? String(stats.activeCount) : "—", icon: <ShieldCheck size={24} />, bg: "rgba(21,101,192,0.08)", color: "#1565c0" },
    { label: t("escrow.kpis.disputeRate"), value: stats ? `${stats.disputeRate}%` : "—", icon: <Warning size={24} />, bg: "rgba(198,40,40,0.08)", color: "#c62828" },
    { label: t("escrow.kpis.feesCollected"), value: stats ? formatAmount(stats.feesCollected) : "—", icon: <SealCheck size={24} />, bg: "rgba(106,27,154,0.08)", color: "#6a1b9a" },
  ], [stats, t]);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4">{t("escrow.title")}</Typography>
          <Typography variant="body2" color="text.secondary">{t("escrow.subtitle")}</Typography>
        </Box>
      </Box>

      <Grid container spacing={3} mb={3}>
        {statCards.map((s) => (
          <Grid item xs={12} sm={6} md={3} key={s.label}>
            <Card>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, py: 2, "&:last-child": { pb: 2 } }}>
                <Avatar sx={{ bgcolor: s.bg, color: s.color, width: 44, height: 44 }}>{s.icon}</Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={700}>{s.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Volume par statut</Typography>
              {stats?.byStatus.map((s) => (
                <Box key={s.status} mb={1.5}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" fontWeight={600}>
                      <Box component="span" sx={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", bgcolor: CHART_COLORS[s.status] || "#888", mr: 1 }} />
                      {STATUS_CHIPS[s.status as EscrowStatus]?.label || s.status}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{s.count} escrow(s)</Typography>
                  </Box>
                  <Bar value={s.volume} max={Math.max(...stats.byStatus.map(x => x.volume))} color={CHART_COLORS[s.status] || "#888"} />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>Tendance des litiges</Typography>
              {stats?.disputeTrend.map((d) => (
                <Box key={d.month} display="flex" alignItems="center" gap={1} mb={1}>
                  <Typography variant="caption" sx={{ minWidth: 40 }}>{d.month}</Typography>
                  <Box sx={{ flex: 1, height: 20, borderRadius: 4, bgcolor: "rgba(0,0,0,0.06)", overflow: "hidden", display: "flex", alignItems: "center" }}>
                    <Box sx={{ width: `${Math.min(100, d.count * 20)}%`, height: "100%", borderRadius: 4, bgcolor: "#c62828", transition: "width 1s ease" }} />
                  </Box>
                  <Typography variant="caption" fontWeight={700} sx={{ minWidth: 20 }}>{d.count}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Box p={2} display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <TextField
            placeholder="Rechercher par ID, commande, acheteur, producteur..."
            variant="outlined" size="small"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            sx={{ minWidth: 320 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><MagnifyingGlass size={16} /></InputAdornment> }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Filtrer par statut</InputLabel>
            <Select value={statusFilter} label="Filtrer par statut" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
              <MenuItem value="">Tous</MenuItem>
              {(Object.entries(STATUS_CHIPS) as [EscrowStatus, typeof STATUS_CHIPS[EscrowStatus]][]).map(([k, v]) => (
                <MenuItem key={k} value={k}>{v.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Escrow</TableCell>
                <TableCell>Acheteur</TableCell>
                <TableCell>Producteur</TableCell>
                <TableCell align="right">Montant</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ border: 0, p: 0 }}>
                    <EmptyState icon={<ShieldCheck size={48} />}
                      title={t("escrow.noEscrow")}
                      description="Aucun escrow ne correspond à votre recherche." />
                  </TableCell>
                </TableRow>
              ) : filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((e: EscrowContract) => {
                const chip = STATUS_CHIPS[e.status] || { label: e.status, color: "default" as const };
                const actions = STATUS_ACTIONS[e.status] || [];
                const isExpanded = expandedRow === e.id;
                return (
                  <React.Fragment key={e.id}>
                    <TableRow
                      hover
                      onClick={() => setExpandedRow(isExpanded ? null : e.id)}
                      sx={{ cursor: "pointer", "&:last-child td": { border: 0 } }}
                    >
                      <TableCell>
                        <Typography variant="caption" fontWeight={600} color="primary.main">{e.id}</Typography>
                        <Typography variant="caption" display="block" color="text.secondary">{e.orderId}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{e.buyerName || "—"}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{e.producteurName || "—"}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={700}>{formatAmount(e.amount)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={chip.label} size="small" color={chip.color} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                          {formatDate(e.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" gap={0.5} justifyContent="center">
                          {actions.map((a) => (
                            <Button
                              key={a.action}
                              size="small"
                              variant={a.action === "resolve" ? "contained" : "outlined"}
                              color={a.action === "resolve" ? "error" : a.action === "release" ? "success" : "warning"}
                              onClick={(ev) => {
                                ev.stopPropagation();
                                if (a.action === "resolve") setResolveDialog({ escrow: e, resolution: "release_to_seller" });
                                else handleAction(e, a.action);
                              }}
                              disabled={actionLoading === `${a.action}_${e.id}`}
                              sx={{ fontSize: "0.7rem", whiteSpace: "nowrap" }}
                            >
                              {actionLoading === `${a.action}_${e.id}` ? "..." : a.label}
                            </Button>
                          ))}
                          <IconButton size="small" onClick={(ev) => ev.stopPropagation()}>
                            {isExpanded ? <CaretUp size={14} /> : <CaretDown size={14} />}
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
                        <Collapse in={isExpanded}>
                          <Box sx={{ p: 2, bgcolor: "rgba(0,0,0,0.02)", borderTop: `1px solid rgba(0,0,0,0.06)` }}>
                            <Grid container spacing={2}>
                              <Grid item xs={6} sm={3}>
                                <Typography variant="caption" color="text.secondary">ID Escrow</Typography>
                                <Typography variant="body2" fontWeight={600}>{e.id}</Typography>
                              </Grid>
                              <Grid item xs={6} sm={3}>
                                <Typography variant="caption" color="text.secondary">Commande</Typography>
                                <Typography variant="body2" fontWeight={600}>{e.orderId}</Typography>
                              </Grid>
                              <Grid item xs={6} sm={3}>
                                <Typography variant="caption" color="text.secondary">Montant</Typography>
                                <Typography variant="body2" fontWeight={700}>{formatAmount(e.amount)}</Typography>
                              </Grid>
                              <Grid item xs={6} sm={3}>
                                <Typography variant="caption" color="text.secondary">Réseau</Typography>
                                <Typography variant="body2">{e.network}</Typography>
                              </Grid>
                              {e.contractAddress && (
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="caption" color="text.secondary">Adresse contrat</Typography>
                                  <Typography variant="body2" fontSize="0.75rem" sx={{ wordBreak: "break-all" }}>{e.contractAddress}</Typography>
                                </Grid>
                              )}
                              {e.depositTxHash && (
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="caption" color="text.secondary">TX Dépôt</Typography>
                                  <Typography variant="body2" fontSize="0.75rem" sx={{ wordBreak: "break-all" }}>{e.depositTxHash}</Typography>
                                </Grid>
                              )}
                              {e.disputed && e.disputeReason && (
                                <Grid item xs={12}>
                                  <Typography variant="caption" color="text.secondary">Motif du litige</Typography>
                                  <Typography variant="body2" color="error.main">{e.disputeReason}</Typography>
                                </Grid>
                              )}
                              {e.resolution && (
                                <Grid item xs={12}>
                                  <Typography variant="caption" color="text.secondary">Résolution</Typography>
                                  <Typography variant="body2" color="success.main">
                                    {e.resolution === "release_to_seller" ? "Versé au vendeur" : e.resolution === "refund_buyer" ? "Remboursé à l'acheteur" : "Partagé 50/50"}
                                  </Typography>
                                </Grid>
                              )}
                              <Grid item xs={6} sm={3}>
                                <Typography variant="caption" color="text.secondary">Créé le</Typography>
                                <Typography variant="body2">{formatDate(e.createdAt)}</Typography>
                              </Grid>
                              {e.fundedAt && (
                                <Grid item xs={6} sm={3}>
                                  <Typography variant="caption" color="text.secondary">Fondé le</Typography>
                                  <Typography variant="body2">{formatDate(e.fundedAt)}</Typography>
                                </Grid>
                              )}
                              {e.deliveredAt && (
                                <Grid item xs={6} sm={3}>
                                  <Typography variant="caption" color="text.secondary">Livré le</Typography>
                                  <Typography variant="body2">{formatDate(e.deliveredAt)}</Typography>
                                </Grid>
                              )}
                              {e.confirmedAt && (
                                <Grid item xs={6} sm={3}>
                                  <Typography variant="caption" color="text.secondary">Confirmé le</Typography>
                                  <Typography variant="body2">{formatDate(e.confirmedAt)}</Typography>
                                </Grid>
                              )}
                              {e.releasedAt && (
                                <Grid item xs={6} sm={3}>
                                  <Typography variant="caption" color="text.secondary">Libéré le</Typography>
                                  <Typography variant="body2">{formatDate(e.releasedAt)}</Typography>
                                </Grid>
                              )}
                            </Grid>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination component="div" count={filtered.length} page={page}
          onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          labelRowsPerPage="Lignes par page:"
        />
      </Paper>

      <Dialog open={!!resolveDialog.escrow} onClose={() => setResolveDialog({ escrow: null, resolution: "release_to_seller" })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Warning size={22} color="#c62828" />
          Résoudre le litige
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Escrow <strong>{resolveDialog.escrow?.id}</strong> — {resolveDialog.escrow && formatAmount(resolveDialog.escrow.amount)}
          </Typography>
          {resolveDialog.escrow?.disputeReason && (
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "#ffebee", mb: 2 }}>
              <Typography variant="caption" color="error.main" fontWeight={600}>Motif du litige</Typography>
              <Typography variant="body2">{resolveDialog.escrow.disputeReason}</Typography>
            </Box>
          )}
          <Typography variant="subtitle2" fontWeight={600} mb={1}>Choisir la résolution</Typography>
          <RadioGroup value={resolveDialog.resolution} onChange={(e) => setResolveDialog(prev => ({ ...prev, resolution: e.target.value }))}>
            <FormControlLabel value="release_to_seller" control={<Radio />} label="Verser au vendeur" />
            <FormControlLabel value="refund_buyer" control={<Radio />} label="Rembourser l'acheteur" />
            <FormControlLabel value="split" control={<Radio />} label="Partager 50/50" />
          </RadioGroup>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setResolveDialog({ escrow: null, resolution: "release_to_seller" })} variant="outlined">Annuler</Button>
          <Button onClick={handleResolve} variant="contained" color="error" disabled={actionLoading === `resolve_${resolveDialog.escrow?.id}`}>
            {actionLoading === `resolve_${resolveDialog.escrow?.id}` ? "Résolution..." : "Confirmer la résolution"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={notify.open} autoHideDuration={4000} onClose={() => setNotify({ ...notify, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={notify.severity} variant="filled" sx={{ borderRadius: 2 }}>{notify.message}</Alert>
      </Snackbar>
    </Box>
  );
}
