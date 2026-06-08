import React, { useState, useCallback } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, Button, Chip,
  TablePagination, IconButton, Tooltip, InputAdornment, Avatar, Grid, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, Snackbar,
} from "@mui/material";
import {
  DownloadSimple, MagnifyingGlass, PencilSimple, Trash, Eye, Funnel, Plus,
  Users, SealCheck, Warning, UserPlus, Check,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { fetchFarmers } from "../services/farmers";
import type { Farmer } from "../types";
import { downloadCSV } from "../utils/export";
import EmptyState from "../components/EmptyState";

const cultureColors: Record<string, string> = {
  Cacao: "#5d4037", Coton: "#78909c", Anacarde: "#ffb300", Café: "#4e342e", Maïs: "#ffd54f",
};

const emptyFarmer = (): Farmer => ({
  id: "", name: "", phone: "", village: "", cooperative: "", culture: "Cacao", parcelles: 0, lots: 0, status: "Actif",
});

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 9 }).map((_, i) => (
        <TableCell key={i}>
          <Box sx={{ height: 14, width: i === 1 ? 120 : 60, borderRadius: 1, bgcolor: "rgba(0,0,0,0.06)", animation: "pulse 1.5s ease-in-out infinite" }} />
        </TableCell>
      ))}
    </TableRow>
  );
}

const Farmers: React.FC = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [cultureFilter, setCultureFilter] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Farmer | null>(null);
  const [details, setDetails] = useState<Farmer | null>(null);
  const [form, setForm] = useState<Farmer>(emptyFarmer());
  const [deleteTarget, setDeleteTarget] = useState<Farmer | null>(null);
  const [notify, setNotify] = useState<{ open: boolean; message: string }>({ open: false, message: "" });

  const { data: farmers, isLoading } = useQuery({
    queryKey: ["farmers"],
    queryFn: fetchFarmers,
  });

  const [localFarmers, setLocalFarmers] = useState<Farmer[] | null>(null);
  const list = localFarmers ?? farmers ?? [];

  const filtered = list.filter((f: Farmer) => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.id.toLowerCase().includes(search.toLowerCase()) || f.village.toLowerCase().includes(search.toLowerCase());
    const matchCulture = !cultureFilter || f.culture === cultureFilter;
    return matchSearch && matchCulture;
  });

  const cultures = [...new Set(list.map((f: Farmer) => f.culture))];

  const stats = {
    total: list.length,
    actifs: list.filter((f: Farmer) => f.status === "Actif").length,
    withCert: list.filter((f: Farmer) => f.lots > 10).length,
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyFarmer());
    setDialogOpen(true);
  };

  const openEdit = (f: Farmer) => {
    setEditing(f);
    setForm({ ...f });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const ts = new Date().toISOString();
    if (editing) {
      setLocalFarmers((prev) => (prev ?? list).map((f) => f.id === editing.id ? { ...form } : f));
      setNotify({ open: true, message: `Producteur ${form.name} modifié avec succès` });
    } else {
      const newId = `ATB-F${String(list.length + 1).padStart(3, "0")}`;
      setLocalFarmers((prev) => [...(prev ?? list), { ...form, id: newId }]);
      setNotify({ open: true, message: `Producteur ${form.name} créé avec succès (${newId})` });
    }
    setDialogOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setLocalFarmers((prev) => (prev ?? list).filter((f) => f.id !== deleteTarget.id));
    setNotify({ open: true, message: `Producteur ${deleteTarget.name} supprimé` });
    setDeleteTarget(null);
  };

  const handleExport = () => {
    const headers = ["ID", "Producteur", "Téléphone", "Village", "Coopérative", "Culture", "Parcelles", "Lots", "Statut"];
    const rows = list.map((f: Farmer) => [f.id, f.name, f.phone, f.village, f.cooperative, f.culture, f.parcelles, f.lots, f.status]);
    downloadCSV(headers, rows, `producteurs-${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4">Producteurs</Typography>
          <Typography variant="body2" color="text.secondary">Gestion des producteurs enregistrés sur la plateforme</Typography>
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button variant="outlined" startIcon={<DownloadSimple />} onClick={handleExport}>Exporter</Button>
          <Button variant="contained" startIcon={<Plus />} onClick={openCreate}>Nouveau</Button>
        </Box>
      </Box>

      <Grid container spacing={3} mb={3}>
        {[
          { label: "Total producteurs", value: stats.total, icon: <Users />, bg: "rgba(25,118,210,0.1)", color: "#1976d2" },
          { label: "Producteurs actifs", value: stats.actifs, icon: <SealCheck />, bg: "rgba(46,125,50,0.1)", color: "#2e7d32" },
          { label: "Avec certifications", value: stats.withCert, icon: <Warning />, bg: "rgba(245,124,0,0.1)", color: "#f57c00" },
        ].map((s) => (
          <Grid item xs={12} sm={4} key={s.label}>
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

      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Box p={2} display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <TextField placeholder="Rechercher un producteur..." variant="outlined" size="small"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            sx={{ minWidth: 300 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><MagnifyingGlass size={16} /></InputAdornment> }}
          />
          <Box display="flex" gap={0.5} alignItems="center">
            <Funnel size={16} color="gray" />
            {cultures.map((c: string) => (
              <Chip key={c} label={c} size="small"
                variant={cultureFilter === c ? "filled" : "outlined"}
                color={cultureFilter === c ? "primary" : "default"}
                onClick={() => setCultureFilter(cultureFilter === c ? null : c)}
                sx={{ cursor: "pointer" }}
              />
            ))}
          </Box>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Producteur</TableCell>
                <TableCell>Village</TableCell>
                <TableCell>Coopérative</TableCell>
                <TableCell>Culture</TableCell>
                <TableCell align="center">Parcelles</TableCell>
                <TableCell align="center">Lots</TableCell>
                <TableCell align="center">Statut</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && !localFarmers ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ border: 0, p: 0 }}>
                    <EmptyState icon={<UserPlus size={48} />}
                      title="Aucun producteur trouvé"
                      description={search ? "Aucun producteur ne correspond à votre recherche." : "Aucun producteur enregistré sur la plateforme."}
                      action={{ label: "Ajouter un producteur", onClick: openCreate }}
                    />
                  </TableCell>
                </TableRow>
              ) : filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((f: Farmer) => (
                <TableRow key={f.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                  <TableCell><Typography variant="caption" fontWeight={600} color="primary.main">{f.id}</Typography></TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: "#1b5e20" }}>{f.name.charAt(0)}</Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{f.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{f.phone}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2">{f.village}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{f.cooperative}</Typography></TableCell>
                  <TableCell>
                    <Chip label={f.culture} size="small"
                      sx={{ bgcolor: `${cultureColors[f.culture]}20`, color: cultureColors[f.culture], fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="center"><Typography variant="body2" fontWeight={600}>{f.parcelles}</Typography></TableCell>
                  <TableCell align="center"><Typography variant="body2" fontWeight={600}>{f.lots}</Typography></TableCell>
                  <TableCell align="center">
                    <Chip label={f.status} size="small" color={f.status === "Actif" ? "success" : "default"} variant="outlined" />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Voir"><IconButton size="small"><Eye size={16} /></IconButton></Tooltip>
                    <Tooltip title="Modifier"><IconButton size="small" onClick={() => openEdit(f)}><PencilSimple size={16} /></IconButton></Tooltip>
                    <Tooltip title="Supprimer"><IconButton size="small" color="error" onClick={() => setDeleteTarget(f)}><Trash size={16} /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination component="div" count={filtered.length} page={page}
          onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          labelRowsPerPage="Lignes par page:"
        />
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Modifier le producteur" : "Nouveau producteur"}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField label="Nom complet" size="small" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Téléphone" size="small" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <TextField label="Village" size="small" value={form.village}
              onChange={(e) => setForm({ ...form, village: e.target.value })} />
            <TextField label="Coopérative" size="small" value={form.cooperative}
              onChange={(e) => setForm({ ...form, cooperative: e.target.value })} />
            <TextField label="Culture" size="small" select value={form.culture}
              onChange={(e) => setForm({ ...form, culture: e.target.value })} SelectProps={{ native: true }}>
              {["Cacao", "Coton", "Anacarde", "Café", "Maïs"].map((c) => <option key={c} value={c}>{c}</option>)}
            </TextField>
            <Box display="flex" gap={2}>
              <TextField label="Parcelles" size="small" type="number" value={form.parcelles}
                onChange={(e) => setForm({ ...form, parcelles: parseInt(e.target.value) || 0 })} sx={{ flex: 1 }} />
              <TextField label="Lots" size="small" type="number" value={form.lots}
                onChange={(e) => setForm({ ...form, lots: parseInt(e.target.value) || 0 })} sx={{ flex: 1 }} />
            </Box>
            <TextField label="Statut" size="small" select value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })} SelectProps={{ native: true }}>
              {["Actif", "Inactif"].map((s) => <option key={s} value={s}>{s}</option>)}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSave} startIcon={<Check />}>
            {editing ? "Enregistrer" : "Créer"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>Voulez-vous vraiment supprimer le producteur <strong>{deleteTarget?.name}</strong> ({deleteTarget?.id}) ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>Supprimer</Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar open={notify.open} autoHideDuration={4000} onClose={() => setNotify({ open: false, message: "" })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity="success" variant="filled" sx={{ borderRadius: 2 }}>{notify.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Farmers;
