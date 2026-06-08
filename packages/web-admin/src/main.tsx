import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ThemeProvider, createTheme, CssBaseline, responsiveFontSizes,
} from "@mui/material";
import App from "./App";
import "./i18n";

let theme = createTheme({
  palette: {
    primary: { main: "#1b5e20", light: "#4c8c4a", dark: "#0f3d13" },
    secondary: { main: "#f57c00", light: "#ffb74d", dark: "#bb4d00" },
    background: { default: "#f4f6f8", paper: "#ffffff" },
    success: { main: "#2e7d32" },
    warning: { main: "#ed6c02" },
    error: { main: "#d32f2f" },
    info: { main: "#0288d1" },
    divider: "rgba(0,0,0,0.08)",
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, fontSize: "1.75rem" },
    h5: { fontWeight: 600, fontSize: "1.25rem" },
    h6: { fontWeight: 600, fontSize: "1.1rem" },
    subtitle2: { fontWeight: 600, fontSize: "0.875rem", letterSpacing: 0.5 },
    body2: { fontSize: "0.85rem" },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, padding: "8px 20px" },
        containedPrimary: {
          background: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)",
          "&:hover": { background: "linear-gradient(135deg, #0f3d13 0%, #1b5e20 100%)" },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          border: "1px solid rgba(0,0,0,0.04)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            fontWeight: 700,
            fontSize: "0.8rem",
            textTransform: "uppercase",
            letterSpacing: 0.5,
            color: "#64748b",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { padding: "12px 16px" },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 600 },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { borderRight: "none" },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { boxShadow: "none", borderBottom: "1px solid rgba(0,0,0,0.06)" },
      },
    },
  },
});

theme = responsiveFontSizes(theme);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 2, staleTime: 30000 },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
