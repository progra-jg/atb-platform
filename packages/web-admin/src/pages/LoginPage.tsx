import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, TextField, Button, Typography, Alert, Paper, InputAdornment,
  IconButton, CircularProgress, FormControlLabel, Checkbox, Link,
} from "@mui/material";
import { Eye, EyeSlash, User, Lock } from "@phosphor-icons/react";
import { loginAdmin } from "../services/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Veuillez saisir votre identifiant et mot de passe.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await loginAdmin(username, password, remember);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Identifiants incorrects.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", bgcolor: "#f4f6f8" }}>
      <Box
        sx={{
          flex: 1, display: { xs: "none", md: "flex" }, alignItems: "center", justifyContent: "center",
          background: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #388e3c 100%)",
          p: 4,
        }}
      >
        <Box sx={{ textAlign: "center", color: "white" }}>
          <Box sx={{ width: 80, height: 80, borderRadius: 4, bgcolor: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 3 }}>
            <Typography variant="h3" fontWeight="bold">A</Typography>
          </Box>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>ATB AgriTrace</Typography>
          <Typography variant="body1" sx={{ opacity: 0.85 }}>Plateforme de traçabilité agricole</Typography>
          <Typography variant="body2" sx={{ opacity: 0.6, mt: 0.5 }}>Administration</Typography>
        </Box>
      </Box>
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", p: 4 }}>
        <Paper elevation={0} sx={{ p: 5, width: "100%", maxWidth: 420, borderRadius: 4, border: "1px solid rgba(0,0,0,0.06)" }}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography variant="h5" fontWeight={700}>Connexion</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Administration ATB</Typography>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth label="Identifiant" value={username}
              onChange={(e) => setUsername(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><User /></InputAdornment>,
              }}
              sx={{ mb: 2.5 }}
            />
            <TextField
              fullWidth label="Mot de passe" type={showPwd ? "text" : "password"}
              value={password} onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPwd(!showPwd)} edge="end">
                      {showPwd ? <EyeSlash /> : <Eye />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, mt: 1 }}>
              <FormControlLabel
                control={<Checkbox size="small" checked={remember} onChange={(e) => setRemember(e.target.checked)} />}
                label={<Typography variant="body2">Se souvenir de moi</Typography>}
              />
              <Link href="#" variant="body2" underline="hover" color="text.secondary"
                onClick={(e) => { e.preventDefault(); setError("Contactez l'administrateur pour réinitialiser votre mot de passe."); }}
              >
                Mot de passe oublié ?
              </Link>
            </Box>
            <Button
              type="submit" fullWidth variant="contained" size="large"
              disabled={loading}
              sx={{ py: 1.5, borderRadius: 2, textTransform: "none", fontWeight: 600, fontSize: 16 }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : "Se connecter"}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
