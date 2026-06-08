import React, { useState } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, Chip,
  TablePagination, InputAdornment, Grid, Card, CardContent,
  Alert, Snackbar, IconButton, Tooltip, Button, Dialog, DialogTitle,
  DialogContent, DialogActions,
} from "@mui/material";
import {
  MagnifyingGlass, User, ShieldCheck, UserCircle, UserPlus,
  PencilSimple, Trash, Plus, Check, Clock, SealCheck,
} from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { fetchUsers } from "../services/users";
import type { UserAccount, LogEntry } from "../types";
import { downloadCSV } from "../utils/export";
import EmptyState from "../components/EmptyState";

const ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin", color: "#6a1b9a", bg: "#f3e5f5" },
  { value: "admin", label: "Admin", color: "#1565c0", bg: "#e3f2fd" },
  { value: "manager", label: "Manager", color: "#2e7d32", bg: "#e8f5e9" },
  { value: "user", label: "Utilisateur", color: "#e65100", bg: "#fff3e0" },
  { value: "viewer", label: "Lecteur", color: "#546e7a", bg: "#f5f5f5" },
];

const emptyUser = (): UserAccount => ({
  id: "", name: "", email: "", company: "", role: "user", status: "Actif", lastLogin: new Date().toISOString().slice(0, 10), lots: 0, permissions: [], logs: [],
});

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 9 }).map((_, i) => (
        <TableCell key={i}>
          <Box sx={{ height: 14, width: i === 1 ? 140 : 70, borderRadius: 1, bgcolor: "rgba(0,0,0,0.06)", animation: "pulse 1.5s ease-in-out infinite" }} />
        </TableCell>
      ))}
    </TableRow>
  );
}

function UserAccounts() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [localUsers, setLocalUsers] = useState<UserAccount[] | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [logTarget, setLogTarget] = useState<UserAccount | null>(null);
  const [editing, setEditing] = useState<UserAccount | null>(null);
  const [form, setForm] = useState<UserAccount>(emptyUser());
  const [deleteTarget, setDeleteTarget] = useState<UserAccount | null>(null);
  const [notify, setNotify] = useState<{ open: boolean; message: string }>({ open: false, message: "" });

  const { data: users, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const list = localUsers ?? users ?? [];

  const filtered = list.filter((u: UserAccount) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.company.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: list.length,
    actifs: list.filter((u: UserAccount) => u.status === "Actif").length,
    admins: list.filter((u: UserAccount) => u.role === "super_admin" || u.role === "admin").length,
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyUser());
    setDialogOpen(true);
  };

  const openEdit = (u: UserAccount) => {
    setEditing(u);
    setForm({ ...u });
    setDialogOpen(true);
  };

  const openLogs = (u: UserAccount) => {
    setLogTarget(u);
    setLogDialogOpen(true);
  };

  const handleSave = () => {
    const roleInfo = ROLE_OPTIONS.find((r) => r.value === form.role) || ROLE_OPTIONS[3];
    const defaultPerms: Record<string, string[]> = {
      super_admin: ["Toutes les permissions", "Gestion utilisateurs", "Gestion plateforme", "Voir rapports", "Export"],
      admin: ["Gestion utilisateurs", "Voir rapports", "Export", "Modération"],
      manager: ["Export PDF", "Export CSV", "Voir lots", "Gérer commandes"],
      user: ["Export CSV", "Voir lots", "Gérer commandes"],
      viewer: ["Voir lots"],
    };
    const updated = { ...form, permissions: form.permissions.length ? form.permissions : defaultPerms[form.role] || [] };
    if (editing) {
      setLocalUsers((prev) => (prev ?? list).map((u) => u.id === editing.id ? updated : u));
      setNotify({ open: true, message: `Utilisateur ${updated.name} modifié` });
    } else {
      const newId = `ATB-U${String(list.length + 1).padStart(3, "0")}`;
      setLocalUsers((prev) => [...(prev ?? list), { ...updated, id: newId, logs: [], lastLogin: "—" }]);
      setNotify({ open: true, message: `Utilisateur ${updated.name} créé (${newId})` });
    }
    setDialogOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setLocalUsers((prev) => (prev ?? list).filter((u) => u.id !== deleteTarget.id));
    setNotify({ open: true, message: `Utilisateur ${deleteTarget.name} supprimé` });
    setDeleteTarget(null);
  };

  const handleExport = () => {
    const headers = ["ID", "Nom", "Email", "Entreprise", "Rôle", "Statut", "Dernière connexion", "Lots", "Permissions"];
    const rows = list.map((u: UserAccount) => [u.id, u.name, u.email, u.company, u.role, u.status, u.lastLogin, u.lots, u.permissions.join(", ")]);
    downloadCSV(headers, rows, `utilisateurs-${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4">Comptes utilisateurs</Typography>
          <Typography variant="body2" color="text.secondary">
            Gestion des comptes, rôles, permissions et activité
          </Typography>
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button variant="outlined" startIcon={<MagnifyingGlass />} onClick={handleExport}>Exporter</Button>
          <Button variant="contained" startIcon={<Plus />} onClick={openCreate}>Nouvel utilisateur</Button>
        </Box>
      </Box>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(27,94,32,0.08)", display: "flex" }}>
                <User size={24} color="#1b5e20" />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700}>{stats.total}</Typography>
                <Typography variant="body2" color="text.secondary">Total utilisateurs</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(46,125,50,0.08)", display: "flex" }}>
                <ShieldCheck size={24} color="#2e7d32" />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700}>{stats.actifs}</Typography>
                <Typography variant="body2" color="text.secondary">Comptes actifs</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(21,101,192,0.08)", display: "flex" }}>
                <UserCircle size={24} color="#1565c0" />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700}>{stats.admins}</Typography>
                <Typography variant="body2" color="text.secondary">Administrateurs</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Box display="flex" alignItems="center" gap={2} p={2}>
          <TextField size="small" placeholder="Rechercher par nom, email, entreprise..."
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><MagnifyingGlass size={16} /></InputAdornment> }}
            sx={{ flex: 1, maxWidth: 380 }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
            Erreur lors du chargement des utilisateurs. Affichage des données locales.
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Identifiant</TableCell>
                <TableCell>Nom</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Entreprise</TableCell>
                <TableCell>Rôle</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Dernière connexion</TableCell>
                <TableCell>Lots</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && !localUsers ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} sx={{ border: 0, p: 0 }}>
                    <EmptyState icon={<UserPlus size={48} />}
                      title="Aucun utilisateur trouvé"
                      description={search ? "Aucun utilisateur ne correspond à votre recherche." : "Aucun utilisateur inscrit sur la plateforme."}
                      action={{ label: "Ajouter un utilisateur", onClick: openCreate }}
                    />
                  </TableCell>
                </TableRow>
              ) : filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((u: UserAccount) => {
                const roleInfo = ROLE_OPTIONS.find((r) => r.value === u.role) || ROLE_OPTIONS[3];
                return (
                  <TableRow key={u.id} hover>
                    <TableCell><Typography variant="body2" fontWeight={600} fontSize="0.8rem" color="text.secondary">{u.id}</Typography></TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Box sx={{
                          width: 32, height: 32, borderRadius: 2,
                          background: roleInfo.bg,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: roleInfo.color, fontWeight: 700, fontSize: 12, flexShrink: 0,
                        }}>
                          {u.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </Box>
                        <Typography variant="body2" fontWeight={600}>{u.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{u.email}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{u.company}</Typography></TableCell>
                    <TableCell>
                      <Chip label={roleInfo.label} size="small"
                        sx={{ bgcolor: roleInfo.bg, color: roleInfo.color, fontWeight: 600 }} />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={0.5} flexWrap="wrap">
                        {u.permissions.slice(0, 3).map((p) => (
                          <Chip key={p} label={p} size="small" variant="outlined" sx={{ fontSize: "0.65rem", height: 20 }} />
                        ))}
                        {u.permissions.length > 3 && (
                          <Chip label={`+${u.permissions.length - 3}`} size="small" sx={{ fontSize: "0.65rem", height: 20 }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell><Chip label={u.status} size="small" color={u.status === "Actif" ? "success" : "default"} /></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary" fontSize="0.8rem">{u.lastLogin}</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600}>{u.lots}</Typography></TableCell>
                    <TableCell align="center">
                      <Tooltip title="Voir activité"><IconButton size="small" onClick={() => openLogs(u)}><Clock size={16} /></IconButton></Tooltip>
                      <Tooltip title="Modifier"><IconButton size="small" onClick={() => openEdit(u)}><PencilSimple size={16} /></IconButton></Tooltip>
                      <Tooltip title="Supprimer"><IconButton size="small" color="error" onClick={() => setDeleteTarget(u)}><Trash size={16} /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination component="div" count={filtered.length} page={page}
          onPageChange={(_, p) => setPage(p)} rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          labelRowsPerPage="Lignes par page" />
      </Paper>

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? "Modifier l'utilisateur" : "Nouvel utilisateur"}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField label="Nom complet" size="small" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Email" size="small" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextField label="Entreprise" size="small" value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })} />
            <TextField label="Rôle" size="small" select value={form.role}
              onChange={(e) => {
                const r = e.target.value as UserAccount["role"];
                const defaultPerms: Record<string, string[]> = {
                  super_admin: ["Toutes les permissions", "Gestion utilisateurs", "Gestion plateforme", "Voir rapports", "Export"],
                  admin: ["Gestion utilisateurs", "Voir rapports", "Export", "Modération"],
                  manager: ["Export PDF", "Export CSV", "Voir lots", "Gérer commandes"],
                  user: ["Export CSV", "Voir lots", "Gérer commandes"],
                  viewer: ["Voir lots"],
                };
                setForm({ ...form, role: r, permissions: defaultPerms[r] || [] });
              }}
              SelectProps={{ native: true }}>
              {ROLE_OPTIONS.map((ro) => <option key={ro.value} value={ro.value}>{ro.label}</option>)}
            </TextField>
            <TextField label="Statut" size="small" select value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })} SelectProps={{ native: true }}>
              <option value="Actif">Actif</option>
              <option value="Inactif">Inactif</option>
            </TextField>
            <TextField label="Lots" size="small" type="number" value={form.lots}
              onChange={(e) => setForm({ ...form, lots: parseInt(e.target.value) || 0 })} />
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                Permissions associées au rôle : <strong>{ROLE_OPTIONS.find((r) => r.value === form.role)?.label}</strong>
              </Typography>
              <Box display="flex" gap={0.5} flexWrap="wrap">
                {form.permissions.map((p) => (
                  <Chip key={p} label={p} size="small" variant="outlined" color="success" sx={{ fontSize: "0.7rem" }} />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSave} startIcon={<Check />}>
            {editing ? "Enregistrer" : "Créer"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>Voulez-vous vraiment supprimer l'utilisateur <strong>{deleteTarget?.name}</strong> ({deleteTarget?.id}) ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>Supprimer</Button>
        </DialogActions>
      </Dialog>

      {/* Activity logs dialog */}
      <Dialog open={logDialogOpen} onClose={() => setLogDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Clock size={20} /> Activité — {logTarget?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {logTarget && logTarget.logs.length > 0 ? (
            <Box display="flex" flexDirection="column" gap={1.5} pt={1}>
              {logTarget.logs.map((log: LogEntry, i: number) => (
                <Box key={i} sx={{
                  display: "flex", gap: 2, p: 1.5, borderRadius: 2,
                  bgcolor: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)",
                }}>
                  <Box sx={{
                    width: 32, height: 32, borderRadius: "50%",
                    bgcolor: "#e8f5e9", display: "flex", alignItems: "center",
                    justifyContent: "center", flexShrink: 0,
                  }}>
                    <SealCheck size={14} color="#2e7d32" />
                  </Box>
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight={600}>{log.action}</Typography>
                    <Typography variant="caption" color="text.secondary">{log.details}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>{log.date}</Typography>
                </Box>
              ))}
            </Box>
          ) : (
            <Box py={4} textAlign="center">
              <Typography variant="body2" color="text.secondary">Aucune activité enregistrée pour cet utilisateur.</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogDialogOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={notify.open} autoHideDuration={4000} onClose={() => setNotify({ open: false, message: "" })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert severity="success" variant="filled" sx={{ borderRadius: 2 }}>{notify.message}</Alert>
      </Snackbar>
    </Box>
  );
}

export default UserAccounts;
