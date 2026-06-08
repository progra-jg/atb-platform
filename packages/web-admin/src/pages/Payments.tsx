import React, { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, Chip, Button,
  TablePagination, InputAdornment, Grid, Card, CardContent,
  Alert, Snackbar, IconButton, Tooltip, Collapse, Avatar,
  Select, MenuItem, FormControl, InputLabel,
} from "@mui/material";
import {
  MagnifyingGlass, Bank, CurrencyCircleDollar, DeviceMobile, CreditCard,
  Check, SealCheck, XCircle, ArrowRight, CaretDown, Funnel, Repeat, DownloadSimple,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { fetchPayments, fetchPaymentStats, verifyPayment, retryPayment, STATUS_CHIPS, METHODS } from "../services/payments";
import type { PaymentTransaction } from "../services/payments";
import EmptyState from "../components/EmptyState";

const METHOD_ICONS: Record<string, React.ReactNode> = {
  mobile_money: <DeviceMobile size={20} />,
  card: <CreditCard size={20} />,
  bank_transfer: <Bank size={20} />,
  crypto: <CurrencyCircleDollar size={20} />,
};

const METHOD_COLORS: Record<string, string> = {
  mobile_money: "#1565c0",
  card: "#6a1b9a",
  bank_transfer: "#2e7d32",
  crypto: "#e65100",
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["processing", "failed"],
  processing: ["completed", "failed"],
  completed: ["refunded"],
  failed: ["pending"],
  refunded: [],
};

function formatAmount(amount: number): string {
  return amount.toLocaleString("fr-FR") + " XOF";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
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

function DonutSegment({ label, value, color, total }: { label: string; value: number; color: string; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: color, flexShrink: 0 }} />
      <Typography variant="body2" sx={{ flex: 1 }}>{label}</Typography>
      <Typography variant="body2" fontWeight={700}>{pct}%</Typography>
      <Typography variant="caption" color="text.secondary">({value})</Typography>
    </Box>
  );
}

const DONUT_COLORS = ["#1565c0", "#6a1b9a", "#2e7d32", "#e65100"];

export default function Payments() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [notify, setNotify] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({ open: false, message: "", severity: "success" });
  const [showTransitions, setShowTransitions] = useState(false);

  const { data: payments, isLoading, refetch } = useQuery({
    queryKey: ["payments", statusFilter, methodFilter],
    queryFn: () => fetchPayments({ status: statusFilter || undefined, method: methodFilter || undefined }),
  });

  const { data: stats } = useQuery({
    queryKey: ["paymentStats"],
    queryFn: fetchPaymentStats,
  });

  const list = payments ?? [];

  const filtered = list.filter((p) => {
    if (search && !p.orderId.toLowerCase().includes(search.toLowerCase()) && !p.id.toLowerCase().includes(search.toLowerCase()) && !(p.buyerName?.toLowerCase() || "").includes(search.toLowerCase())) return false;
    return true;
  });

  const handleVerify = useCallback(async (paymentId: string) => {
    setVerifying(paymentId);
    try {
      await verifyPayment(paymentId);
      setNotify({ open: true, message: "Paiement vérifié avec succès", severity: "success" });
      refetch();
    } catch {
      setNotify({ open: true, message: "Erreur lors de la vérification", severity: "error" });
    }
    setVerifying(null);
  }, [refetch]);

  const handleRetry = useCallback(async (paymentId: string) => {
    setRetrying(paymentId);
    try {
      const pay = list.find(p => p.id === paymentId);
      if (pay) {
        await retryPayment({ orderId: pay.orderId, amount: pay.amount, method: pay.method, provider: pay.provider, currency: pay.currency });
        setNotify({ open: true, message: "Paiement relancé avec succès", severity: "success" });
        refetch();
      }
    } catch {
      setNotify({ open: true, message: "Erreur lors de la relance", severity: "error" });
    }
    setRetrying(null);
  }, [list, refetch]);

  const handleExportCSV = useCallback(() => {
    const headers = ["Transaction", "Commande", "Acheteur", "Montant", "Méthode", "Statut", "Date", "Fournisseur", "Réf. fournisseur"];
    const rows = filtered.map(p => [
      p.id, p.orderId, p.buyerName || "", formatAmount(p.amount), METHODS[p.method] || p.method,
      STATUS_CHIPS[p.status]?.label || p.status, formatDate(p.createdAt), p.provider, p.providerRef || "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "paiements.csv"; a.click();
    URL.revokeObjectURL(url);
    setNotify({ open: true, message: "CSV exporté avec succès", severity: "success" });
  }, [filtered]);

  const statCards = [
    { label: t("payments.volumeTotal"), value: stats ? formatAmount(stats.totalVolume) : "—", icon: <CurrencyCircleDollar size={24} />, bg: "rgba(27,94,32,0.08)", color: "#1b5e20" },
    { label: t("payments.successRate"), value: stats ? `${stats.successRate}%` : "—", icon: <SealCheck size={24} />, bg: "rgba(46,125,50,0.08)", color: "#2e7d32" },
    { label: t("payments.pendingVerification"), value: stats ? String(stats.pendingVerification) : "—", icon: <XCircle size={24} />, bg: "rgba(245,124,0,0.08)", color: "#f57c00" },
    { label: t("payments.todayVolume"), value: stats ? formatAmount(stats.todayVolume) : "—", icon: <Bank size={24} />, bg: "rgba(21,101,192,0.08)", color: "#1565c0" },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4">{t("payments.title")}</Typography>
          <Typography variant="body2" color="text.secondary">{t("payments.subtitle")}</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" size="small" startIcon={<Repeat size={16} />}
            onClick={() => setShowTransitions(!showTransitions)}>
            {t("payments.possibleTransitions")}
          </Button>
          <Button variant="outlined" size="small" startIcon={<DownloadSimple size={16} />}
            onClick={handleExportCSV} disabled={filtered.length === 0}>
            {t("payments.exportCsv")}
          </Button>
        </Box>
      </Box>

      {showTransitions && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>{t("payments.possibleTransitions")}</Typography>
            <Grid container spacing={2}>
              {Object.entries(STATUS_TRANSITIONS).map(([from, toList]) =>
                toList.length > 0 && toList.map(to => {
                  const fromChip = STATUS_CHIPS[from] || { label: from, color: "default" as const };
                  const toChip = STATUS_CHIPS[to] || { label: to, color: "default" as const };
                  return (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={`${from}-${to}`}>
                      <Box display="flex" alignItems="center" gap={1} sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(0,0,0,0.02)" }}>
                        <Chip label={fromChip.label} size="small" color={fromChip.color} />
                        <ArrowRight size={14} />
                        <Chip label={toChip.label} size="small" color={toChip.color} />
                      </Box>
                    </Grid>
                  );
                })
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

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
              <Typography variant="subtitle1" fontWeight={600} mb={2}>{t("payments.volumeByMethod")}</Typography>
              {stats?.byMethod.map((m) => (
                <Box key={m.method} mb={1.5}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" fontWeight={600}>{METHODS[m.method] || m.method}</Typography>
                    <Typography variant="caption" color="text.secondary">{m.count} transactions</Typography>
                  </Box>
                  <Bar value={m.volume} max={Math.max(...stats.byMethod.map(x => x.volume))} color={METHOD_COLORS[m.method] || "#888"} />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} mb={2}>{t("payments.transactionDistribution")}</Typography>
              {stats?.byMethod.map((m, i) => (
                <Box key={m.method} mb={1}>
                  <DonutSegment
                    label={METHODS[m.method] || m.method}
                    value={m.count}
                    color={DONUT_COLORS[i % DONUT_COLORS.length]}
                    total={stats.byMethod.reduce((a, x) => a + x.count, 0)}
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Box p={2} display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <TextField
            placeholder={t("payments.search")}
            variant="outlined" size="small"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            sx={{ minWidth: 280 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><MagnifyingGlass size={16} /></InputAdornment> }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>{t("payments.filterStatus")}</InputLabel>
            <Select value={statusFilter} label={t("payments.filterStatus")} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
              <MenuItem value="">{t("payments.all")}</MenuItem>
              {(Object.entries(STATUS_CHIPS) as [string, typeof STATUS_CHIPS[keyof typeof STATUS_CHIPS]][]).map(([k, v]) => (
                <MenuItem key={k} value={k}>{v.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>{t("payments.filterMethod")}</InputLabel>
            <Select value={methodFilter} label={t("payments.filterMethod")} onChange={(e) => { setMethodFilter(e.target.value); setPage(0); }}>
              <MenuItem value="">{t("payments.allMethods")}</MenuItem>
              {(Object.entries(METHODS) as [string, string][]).map(([k, v]) => (
                <MenuItem key={k} value={k}>{v}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t("payments.transaction")}</TableCell>
                <TableCell>{t("payments.buyer")}</TableCell>
                <TableCell align="right">{t("payments.amount")}</TableCell>
                <TableCell>{t("payments.method")}</TableCell>
                <TableCell>{t("payments.status")}</TableCell>
                <TableCell>{t("payments.date")}</TableCell>
                <TableCell align="center">{t("payments.actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ border: 0, p: 0 }}>
                    <EmptyState icon={<Bank size={48} />}
                      title={t("payments.noResults")}
                      description={search ? t("payments.noResultsDesc") : t("payments.noTransactions")} />
                  </TableCell>
                </TableRow>
              ) : filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((p: PaymentTransaction) => {
                const chip = STATUS_CHIPS[p.status] || { label: p.status, color: "default" as const };
                const transitions = STATUS_TRANSITIONS[p.status] || [];
                const isExpanded = expandedRow === p.id;
                return (
                  <React.Fragment key={p.id}>
                    <TableRow
                      hover
                      onClick={() => setExpandedRow(isExpanded ? null : p.id)}
                      sx={{ cursor: "pointer", "&:last-child td": { border: 0 } }}
                    >
                      <TableCell>
                        <Typography variant="caption" fontWeight={600} color="primary.main">{p.id}</Typography>
                        <Typography variant="caption" display="block" color="text.secondary">{p.orderId}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{p.buyerName || "—"}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={700}>{formatAmount(p.amount)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box sx={{ color: METHOD_COLORS[p.method] || "text.secondary", display: "flex" }}>
                            {METHOD_ICONS[p.method] || <DeviceMobile size={16} />}
                          </Box>
                          <Typography variant="body2">{METHODS[p.method] || p.method}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Tooltip
                          title={
                            <Box>
                              <Typography variant="caption" fontWeight={600} display="block" mb={0.5}>
                                {t("payments.possibleTransitions")}:
                              </Typography>
                              {transitions.length > 0 ? transitions.map(next => {
                                const nextChip = STATUS_CHIPS[next] || { label: next, color: "default" as const };
                                return (
                                  <Chip key={next} label={nextChip.label} size="small" color={nextChip.color}
                                    sx={{ m: 0.3, height: 20, "& .MuiChip-label": { fontSize: "0.65rem" } }} />
                                );
                              }) : (
                                <Typography variant="caption">—</Typography>
                              )}
                            </Box>
                          }
                          arrow
                        >
                          <Chip label={chip.label} size="small" color={chip.color} sx={{ cursor: "pointer" }} />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" fontSize="0.8rem">
                          {formatDate(p.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" gap={0.5} justifyContent="center">
                          {p.method === "bank_transfer" && p.status === "pending" && !p.verifiedByAdmin ? (
                            <Button
                              size="small"
                              variant="outlined"
                              color="success"
                              onClick={(e) => { e.stopPropagation(); handleVerify(p.id); }}
                              disabled={verifying === p.id}
                              sx={{ fontSize: "0.7rem", whiteSpace: "nowrap" }}
                            >
                              {verifying === p.id ? t("payments.verifying") : t("payments.verify")}
                            </Button>
                          ) : p.verifiedByAdmin ? (
                            <Chip label={t("payments.verified")} size="small" color="success" variant="outlined" />
                          ) : null}
                          {p.status === "failed" && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="warning"
                              startIcon={<Repeat size={12} />}
                              onClick={(e) => { e.stopPropagation(); handleRetry(p.id); }}
                              disabled={retrying === p.id}
                              sx={{ fontSize: "0.7rem", whiteSpace: "nowrap" }}
                            >
                              {retrying === p.id ? t("payments.retrying") : t("payments.retry")}
                            </Button>
                          )}
                          <IconButton size="small" onClick={(e) => e.stopPropagation()}>
                            <CaretDown size={14} />
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
                                <Typography variant="caption" color="text.secondary">ID Transaction</Typography>
                                <Typography variant="body2" fontWeight={600}>{p.id}</Typography>
                              </Grid>
                              <Grid item xs={6} sm={3}>
                                <Typography variant="caption" color="text.secondary">{t("payments.transaction")}</Typography>
                                <Typography variant="body2" fontWeight={600}>{p.orderId}</Typography>
                              </Grid>
                              <Grid item xs={6} sm={3}>
                                <Typography variant="caption" color="text.secondary">Fournisseur</Typography>
                                <Typography variant="body2" fontWeight={600}>{p.provider}</Typography>
                              </Grid>
                              <Grid item xs={6} sm={3}>
                                <Typography variant="caption" color="text.secondary">Réf. fournisseur</Typography>
                                <Typography variant="body2" fontWeight={600}>{p.providerRef || "—"}</Typography>
                              </Grid>
                              <Grid item xs={6} sm={3}>
                                <Typography variant="caption" color="text.secondary">{t("payments.buyer")}</Typography>
                                <Typography variant="body2">{p.buyerName || "—"}</Typography>
                              </Grid>
                              <Grid item xs={6} sm={3}>
                                <Typography variant="caption" color="text.secondary">Producteur</Typography>
                                <Typography variant="body2">{p.producteurName || "—"}</Typography>
                              </Grid>
                              <Grid item xs={6} sm={3}>
                                <Typography variant="caption" color="text.secondary">{t("payments.date")}</Typography>
                                <Typography variant="body2">{formatDate(p.createdAt)}</Typography>
                              </Grid>
                              <Grid item xs={6} sm={3}>
                                <Typography variant="caption" color="text.secondary">Payé le</Typography>
                                <Typography variant="body2">{p.paidAt ? formatDate(p.paidAt) : "—"}</Typography>
                              </Grid>
                              {p.invoiceNumber && (
                                <Grid item xs={6} sm={3}>
                                  <Typography variant="caption" color="text.secondary">Facture</Typography>
                                  <Typography variant="body2">{p.invoiceNumber}</Typography>
                                </Grid>
                              )}
                              {p.notes && (
                                <Grid item xs={12}>
                                  <Typography variant="caption" color="text.secondary">Notes</Typography>
                                  <Typography variant="body2">{p.notes}</Typography>
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

      <Snackbar open={notify.open} autoHideDuration={4000} onClose={() => setNotify({ ...notify, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity={notify.severity} variant="filled" sx={{ borderRadius: 2 }}>{notify.message}</Alert>
      </Snackbar>
    </Box>
  );
}
