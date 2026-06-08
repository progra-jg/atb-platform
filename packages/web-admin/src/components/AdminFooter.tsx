import React, { useState, useEffect } from "react";
import {
  Box, Typography, Tooltip, IconButton, Menu, MenuItem,
} from "@mui/material";
import {
  SealCheck, Globe, CurrencyCircleDollar, MagnifyingGlass,
  FileText, Lock, Leaf, CheckCircle,
} from "@phosphor-icons/react";

const year = new Date().getFullYear();

function randBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const AdminFooter: React.FC = () => {
  const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);
  const [currencyAnchor, setCurrencyAnchor] = useState<null | HTMLElement>(null);
  const [lang, setLang] = useState("FR");
  const [currency, setCurrency] = useState("XOF");

  const [besuNodes, setBesuNodes] = useState(6);
  const [kongLatency, setKongLatency] = useState(12);
  const [satLastHours, setSatLastHours] = useState(4);
  const [satOK, setSatOK] = useState(true);
  const [besuLatency, setBesuLatency] = useState(230);

  useEffect(() => {
    const interval = setInterval(() => {
      setBesuNodes(randBetween(5, 6));
      setKongLatency(randBetween(8, 45));
      setBesuLatency(randBetween(180, 450));
      const hrs = randBetween(1, 8);
      setSatLastHours(hrs);
      setSatOK(Math.random() > 0.15);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      component="footer"
      sx={{
        height: 35,
        minHeight: 35,
        bgcolor: "#0a130c",
        backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 3px)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        alignItems: "center",
        px: { xs: 1, md: 2 },
        gap: { xs: 0.5, md: 1.5 },
        position: "relative",
        zIndex: 10,
        overflow: "hidden",
      }}
    >
      <Typography variant="caption" color="rgba(255,255,255,0.35)" sx={{ fontSize: 9, whiteSpace: "nowrap", display: { xs: "none", md: "block" } }}>
        &copy; {year} ATB — Traçabilité, souveraineté agricole, conformité EUDR
      </Typography>

      <MagnifyingGlass size={10} color="rgba(255,255,255,0.25)" />
      <Typography variant="caption" component="a" href="#" sx={{ color: "rgba(255,255,255,0.45)", fontSize: 9, textDecoration: "none", "&:hover": { color: "#81c784" }, display: { xs: "none", lg: "inline" } }}>
        Recherche
      </Typography>
      <Typography variant="caption" color="rgba(255,255,255,0.15)" sx={{ fontSize: 8, display: { xs: "none", lg: "inline" } }}>|</Typography>
      <Typography variant="caption" component="a" href="#" sx={{ color: "rgba(255,255,255,0.45)", fontSize: 9, textDecoration: "none", "&:hover": { color: "#81c784" }, display: { xs: "none", lg: "inline" } }}>
        Lots
      </Typography>
      <Typography variant="caption" color="rgba(255,255,255,0.15)" sx={{ fontSize: 8, display: { xs: "none", lg: "inline" } }}>|</Typography>
      <Typography variant="caption" component="a" href="#" sx={{ color: "rgba(255,255,255,0.45)", fontSize: 9, textDecoration: "none", "&:hover": { color: "#81c784" }, display: { xs: "none", lg: "inline" } }}>
        Cadastre
      </Typography>
      <Typography variant="caption" color="rgba(255,255,255,0.15)" sx={{ fontSize: 8, display: { xs: "none", lg: "inline" } }}>|</Typography>
      <Typography variant="caption" component="a" href="#" sx={{ color: "rgba(255,255,255,0.45)", fontSize: 9, textDecoration: "none", "&:hover": { color: "#81c784" }, display: { xs: "none", lg: "inline" } }}>
        Déforestation
      </Typography>

      <Box sx={{ width: 1, height: 16, bgcolor: "rgba(255,255,255,0.08)", display: { xs: "none", lg: "block" } }} />

      <FileText size={9} color="rgba(255,255,255,0.25)" />
      <Typography variant="caption" component="a" href="#" sx={{ color: "rgba(255,255,255,0.45)", fontSize: 9, textDecoration: "none", "&:hover": { color: "#81c784" }, display: { xs: "none", lg: "inline" } }}>
        EUDR
      </Typography>
      <Typography variant="caption" color="rgba(255,255,255,0.15)" sx={{ fontSize: 8, display: { xs: "none", lg: "inline" } }}>|</Typography>
      <Typography variant="caption" component="a" href="#" sx={{ color: "rgba(255,255,255,0.45)", fontSize: 9, textDecoration: "none", "&:hover": { color: "#81c784" }, display: { xs: "none", lg: "inline" } }}>
        GlobalGAP
      </Typography>
      <Typography variant="caption" color="rgba(255,255,255,0.15)" sx={{ fontSize: 8, display: { xs: "none", lg: "inline" } }}>|</Typography>
      <Lock size={9} color="rgba(255,255,255,0.25)" />
      <Typography variant="caption" component="a" href="#" sx={{ color: "rgba(255,255,255,0.45)", fontSize: 9, textDecoration: "none", "&:hover": { color: "#81c784" }, display: { xs: "none", lg: "inline" } }}>
        RGPD
      </Typography>

      <Box sx={{ flex: 1 }} />

      <Tooltip
        title={
          <Box>
            <Typography variant="caption" fontWeight={700} display="block">Blockchain Besu</Typography>
            <Typography variant="caption" display="block">Nœuds: {besuNodes}/6 actifs</Typography>
            <Typography variant="caption" display="block">Latence: {besuLatency}ms</Typography>
            <Typography variant="caption" display="block">Dernier bloc: #{randBetween(184200, 184500)}</Typography>
          </Box>
        }
        arrow
      >
        <Box display="flex" alignItems="center" gap={0.6} sx={{ cursor: "help" }}>
          <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: besuNodes >= 5 ? "#4caf50" : besuNodes >= 3 ? "#ff9800" : "#f44336" }} />
          <SealCheck size={10} color="#81c784" weight="fill" />
          <Typography variant="caption" color="rgba(255,255,255,0.55)" sx={{ fontSize: 9, fontWeight: 600, whiteSpace: "nowrap" }}>
            Blockchain Certified
          </Typography>
        </Box>
      </Tooltip>

      <Tooltip
        title={
          <Box>
            <Typography variant="caption" fontWeight={700} display="block">Surveillance Satellite</Typography>
            <Typography variant="caption" display="block">Statut: {satOK ? "Opérationnel" : "Alerte"}</Typography>
            <Typography variant="caption" display="block">Dernière analyse: il y a {satLastHours}h</Typography>
            <Typography variant="caption" display="block">Couverture: Sentinel-2 + PlanetScope</Typography>
          </Box>
        }
        arrow
      >
        <Box display="flex" alignItems="center" gap={0.6} sx={{ cursor: "help" }}>
          <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: satOK ? "#4caf50" : "#ff9800" }} />
          <Leaf size={10} color="#81c784" weight="fill" />
          <Typography variant="caption" color="rgba(255,255,255,0.55)" sx={{ fontSize: 9, fontWeight: 600, whiteSpace: "nowrap" }}>
            Satellite Verified
          </Typography>
        </Box>
      </Tooltip>

      <Tooltip title={`API Gateway Kong: ${kongLatency}ms · 0 erreur`} arrow>
        <Box display="flex" alignItems="center" gap={0.4} sx={{ cursor: "help" }}>
          <CheckCircle size={10} color={kongLatency < 25 ? "#4caf50" : kongLatency < 50 ? "#ff9800" : "#f44336"} weight="fill" />
          <Typography variant="caption" color="rgba(255,255,255,0.35)" sx={{ fontSize: 9 }}>Kong {kongLatency}ms</Typography>
        </Box>
      </Tooltip>

      <Box sx={{ width: 1, height: 14, bgcolor: "rgba(255,255,255,0.08)" }} />

      <Box display="flex" alignItems="center" gap={0.3}>
        <Tooltip title="Langue">
          <IconButton size="small" onClick={(e) => setLangAnchor(e.currentTarget)} sx={{ color: "rgba(255,255,255,0.45)", p: 0.2, "&:hover": { color: "#81c784" } }}>
            <Globe size={12} />
          </IconButton>
        </Tooltip>
        <Typography variant="caption" color="rgba(255,255,255,0.45)" sx={{ fontSize: 9, fontWeight: 600 }}>{lang}</Typography>
        <Menu anchorEl={langAnchor} open={Boolean(langAnchor)} onClose={() => setLangAnchor(null)} sx={{ "& .MuiPaper-root": { borderRadius: 2, minWidth: 110 } }}>
          {[{ code: "FR", label: "Français" }, { code: "EN", label: "English" }].map((l) => (
            <MenuItem key={l.code} selected={lang === l.code} onClick={() => { setLang(l.code); setLangAnchor(null); }} sx={{ fontSize: 12, py: 0.5 }}>{l.label}</MenuItem>
          ))}
        </Menu>
      </Box>

      <Box display="flex" alignItems="center" gap={0.3}>
        <Tooltip title="Devise">
          <IconButton size="small" onClick={(e) => setCurrencyAnchor(e.currentTarget)} sx={{ color: "rgba(255,255,255,0.45)", p: 0.2, "&:hover": { color: "#81c784" } }}>
            <CurrencyCircleDollar size={12} />
          </IconButton>
        </Tooltip>
        <Typography variant="caption" color="rgba(255,255,255,0.45)" sx={{ fontSize: 9, fontWeight: 600 }}>{currency}</Typography>
        <Menu anchorEl={currencyAnchor} open={Boolean(currencyAnchor)} onClose={() => setCurrencyAnchor(null)} sx={{ "& .MuiPaper-root": { borderRadius: 2, minWidth: 110 } }}>
          {[{ code: "XOF", label: "F CFA" }, { code: "EUR", label: "Euro" }, { code: "USD", label: "USD" }].map((c) => (
            <MenuItem key={c.code} selected={currency === c.code} onClick={() => { setCurrency(c.code); setCurrencyAnchor(null); }} sx={{ fontSize: 12, py: 0.5 }}>{c.label}</MenuItem>
          ))}
        </Menu>
      </Box>

      <Typography variant="caption" color="rgba(255,255,255,0.2)" sx={{ fontSize: 8, display: { xs: "none", sm: "inline" } }}>
        v2.0.0
      </Typography>
    </Box>
  );
};

export default AdminFooter;
