import React from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";
import { Compass } from "@phosphor-icons/react";

function NotFound() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        textAlign: "center",
        px: 2,
      }}
    >
      <Compass size={64} style={{ opacity: 0.2, marginBottom: 16 }} />
      <Typography variant="h2" fontWeight={800} sx={{ lineHeight: 1, mb: 1 }}>
        404
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 400 }}>
        Cette page n'existe pas ou a été déplacée.
      </Typography>
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
        <Button variant="contained" onClick={() => navigate("/")}>
          Tableau de bord
        </Button>
        <Button variant="outlined" onClick={() => navigate("/farmers")}>
          Voir les producteurs
        </Button>
      </Box>
    </Box>
  );
}

export default NotFound;
