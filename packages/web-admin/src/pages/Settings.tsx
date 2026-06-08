import React, { useState } from "react";
import {
  Box, Typography, Switch, TextField, Button,
  FormControlLabel, Grid, Tabs, Tab, Divider, Alert, Snackbar,
  Card, CardContent, Chip, Avatar,
} from "@mui/material";
import {
  FloppyDisk, Cloud, Shield, SealCheck, ArrowsClockwise, Plant,
} from "@phosphor-icons/react";

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return value === index ? <Box>{children}</Box> : null;
}

const STORAGE_KEY = "atb-admin-settings";

const loadSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
};

const loadStandards = () => {
  try {
    const raw = localStorage.getItem("atb-admin-standards");
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
};

const Settings: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState(loadSettings() || {
    blockchainEnabled: true,
    autoCertifyEUDR: true,
    deforestationMonitoring: true,
    syncInterval: "30",
    certificationDays: "365",
    minSuperficie: "0.01",
  });

  const [standards, setStandards] = useState(loadStandards() || [
    { label: "EUDR", active: true },
    { label: "GlobalGAP", active: true },
    { label: "Rainforest Alliance", active: false },
    { label: "Fair Trade", active: false },
  ]);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    localStorage.setItem("atb-admin-standards", JSON.stringify(standards));
    setSaved(true);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4">Configuration</Typography>
          <Typography variant="body2" color="text.secondary">Paramètres généraux de la plateforme</Typography>
        </Box>
        <Button variant="contained" startIcon={<FloppyDisk />} onClick={handleSave}>
          Sauvegarder
        </Button>
      </Box>

      <Card sx={{ mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            px: 2, pt: 1,
            "& .MuiTab-root": { textTransform: "none", fontWeight: 600, minHeight: 48 },
            "& .MuiTabs-indicator": { bgcolor: "primary.main", height: 3, borderRadius: "3px 3px 0 0" },
          }}
        >
          <Tab icon={<Cloud />} label="Général" iconPosition="start" />
          <Tab icon={<Shield />} label="Blockchain" iconPosition="start" />
          <Tab icon={<SealCheck />} label="Certifications" iconPosition="start" />
          <Tab icon={<Plant />} label="Parcelles" iconPosition="start" />
        </Tabs>
      </Card>

      <TabPanel value={tab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                <Typography variant="h6" gutterBottom>Fonctionnalités</Typography>
                <Divider sx={{ mb: 2 }} />
                <FormControlLabel
                  control={<Switch checked={settings.deforestationMonitoring} onChange={(e) => setSettings({ ...settings, deforestationMonitoring: e.target.checked })} />}
                  label="Monitoring déforestation par satellite"
                  sx={{ mb: 1, width: "100%" }}
                />
                <FormControlLabel
                  control={<Switch checked={settings.autoCertifyEUDR} onChange={(e) => setSettings({ ...settings, autoCertifyEUDR: e.target.checked })} />}
                  label="Certification EUDR automatique"
                  sx={{ mb: 1, width: "100%" }}
                />
                <FormControlLabel
                  control={<Switch checked={false} />}
                  label="Notifications push producteurs"
                  sx={{ width: "100%" }}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                <Typography variant="h6" gutterBottom>Synchronisation</Typography>
                <Divider sx={{ mb: 2 }} />
                <TextField
                  label="Intervalle de synchronisation (minutes)"
                  value={settings.syncInterval}
                  onChange={(e) => setSettings({ ...settings, syncInterval: e.target.value })}
                  size="small"
                  fullWidth
                  sx={{ mb: 2 }}
                  InputProps={{ startAdornment: <ArrowsClockwise size={16} style={{ marginRight: 8 }} /> }}
                />
                <TextField
                  label="Validité certification (jours)"
                  value={settings.certificationDays}
                  onChange={(e) => setSettings({ ...settings, certificationDays: e.target.value })}
                  size="small"
                  fullWidth
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                <Typography variant="h6" gutterBottom>Ancrage blockchain</Typography>
                <Divider sx={{ mb: 2 }} />
                <FormControlLabel
                  control={<Switch checked={settings.blockchainEnabled} onChange={(e) => setSettings({ ...settings, blockchainEnabled: e.target.checked })} />}
                  label="Ancrage blockchain activé"
                  sx={{ mb: 2, width: "100%" }}
                />
                <TextField label="URL du nœud RPC" value="https://besu.agritrace.bj" size="small" fullWidth sx={{ mb: 2 }} />
                <TextField label="Adresse du contrat LotRegistry" value="0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18" size="small" fullWidth sx={{ mb: 2 }} />
                <TextField label="Adresse du contrat CertificateRegistry" value="0x742d35Cc6634C0532925a3b844Bc9e7595f2bD19" size="small" fullWidth />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                <Typography variant="h6" gutterBottom>État du réseau</Typography>
                <Divider sx={{ mb: 2 }} />
                <Box display="flex" flexDirection="column" gap={1.5}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Validateurs actifs</Typography>
                    <Typography variant="body2" fontWeight={700} color="success.main">6 / 6</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Dernier bloc</Typography>
                    <Typography variant="body2" fontWeight={700}>#184,293</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Transactions en attente</Typography>
                    <Typography variant="body2" fontWeight={700}>0</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Dernière synchronisation</Typography>
                    <Typography variant="body2" fontWeight={700}>Il y a 12s</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tab} index={2}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                <Typography variant="h6" gutterBottom>Standards activés</Typography>
                <Divider sx={{ mb: 2 }} />
                <Box display="flex" flexDirection="column" gap={1}>
                  {standards.map((s: { label: string; active: boolean }) => (
                    <Box key={s.label} display="flex" alignItems="center" justifyContent="space-between" p={1.5} borderRadius={2} bgcolor="rgba(0,0,0,0.02)">
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <SealCheck color={s.active ? "green" : "gray"} size={16} />
                        <Typography variant="body2" fontWeight={500}>{s.label}</Typography>
                      </Box>
                      <Switch checked={s.active} size="small" onChange={(e) => setStandards(standards.map((st: { label: string; active: boolean }) => st.label === s.label ? { ...st, active: e.target.checked } : st))} />
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                <Typography variant="h6" gutterBottom>Paramètres EUDR</Typography>
                <Divider sx={{ mb: 2 }} />
                <TextField label="Seuil de conformité (%)" value="95" size="small" fullWidth sx={{ mb: 2 }} />
                <TextField label="Validité du rapport (mois)" value="12" size="small" fullWidth sx={{ mb: 2 }} />
                <TextField label="Email de notification" value="compliance@agritrace.bj" size="small" fullWidth />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tab} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                <Typography variant="h6" gutterBottom>Seuils parcellaires</Typography>
                <Divider sx={{ mb: 2 }} />
                <TextField label="Superficie minimum (ha)" value={settings.minSuperficie} size="small" fullWidth sx={{ mb: 2 }} onChange={(e) => setSettings({ ...settings, minSuperficie: e.target.value })} />
                <TextField label="Superficie maximum (ha)" value="50" size="small" fullWidth sx={{ mb: 2 }} />
                <TextField label="Distance minimale entre parcelles (m)" value="10" size="small" fullWidth />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
                <Typography variant="h6" gutterBottom>Détection satellite</Typography>
                <Divider sx={{ mb: 2 }} />
                <TextField label="Seuil de confiance (%)" value="85" size="small" fullWidth sx={{ mb: 2 }} />
                <TextField label="Résolution minimale (m)" value="10" size="small" fullWidth sx={{ mb: 2 }} />
                <TextField label="API Key Sentinel Hub" value="••••••••" type="password" size="small" fullWidth />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <Snackbar
        open={saved}
        autoHideDuration={3000}
        onClose={() => setSaved(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity="success" variant="filled" sx={{ borderRadius: 2 }}>
          Configuration sauvegardée avec succès
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
