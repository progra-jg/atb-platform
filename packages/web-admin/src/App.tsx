import React, { useState, Suspense, lazy, useCallback } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  AppBar, Toolbar, Typography, IconButton, Badge, Avatar, Divider, Tooltip,
  useMediaQuery, useTheme, CircularProgress, Menu, MenuItem,
} from "@mui/material";
import {
  Gauge, Users, Warning, SealCheck, FileText, Gear, Cloud, Bug, Cpu, ChartLine,
  List as MenuList, CaretLeft, Bell, UserCircle, User, Clock, SignOut, Bank, ShieldCheck,
} from "@phosphor-icons/react";
import ErrorBoundary from "./components/ErrorBoundary";
import Toast from "./components/Toast";
import AdminFooter from "./components/AdminFooter";
import PageTransition from "./components/PageTransition";
import Breadcrumb from "./components/Breadcrumb";
import { getAdminSession, logoutAdmin } from "./services/auth";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const SummaryDashboard = lazy(() => import("./pages/SummaryDashboard"));
const Farmers = lazy(() => import("./pages/Farmers"));
const Alerts = lazy(() => import("./pages/Alerts"));
const ComplianceEUDR = lazy(() => import("./pages/ComplianceEUDR"));
const SettingsPage = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const UserAccounts = lazy(() => import("./pages/UserAccounts"));
const AuditLog = lazy(() => import("./pages/AuditLog"));
const Certifications = lazy(() => import("./pages/Certifications"));
const DiseaseDetection = lazy(() => import("./pages/DiseaseDetection"));
const Weather = lazy(() => import("./pages/Weather"));
const AIDashboard = lazy(() => import("./pages/AIDashboard"));
const Payments = lazy(() => import("./pages/Payments"));
const PredictionsAdmin = lazy(() => import("./pages/PredictionsAdmin"));
const EscrowAdmin = lazy(() => import("./pages/EscrowAdmin"));

const DRAWER_WIDTH = 260;
const DRAWER_COLLAPSED = 72;

const menuItems = [
  { text: "Dashboard", icon: <Gauge />, path: "/" },
  { text: "Producteurs", icon: <Users />, path: "/farmers" },
  { text: "Alertes", icon: <Warning />, path: "/alerts" },
  { text: "Météo", icon: <Cloud />, path: "/weather" },
  { text: "IA & Analytics", icon: <Cpu />, path: "/ai" },
  { text: "Maladies", icon: <Bug />, path: "/disease" },
  { text: "Conformité EUDR", icon: <SealCheck />, path: "/compliance" },
  { text: "Certifications", icon: <FileText />, path: "/certifications" },
  { text: "Paiements", icon: <Bank />, path: "/payments" },
  { text: "Prévisions Prix", icon: <ChartLine />, path: "/predictions" },
  { text: "Escrow B2B", icon: <ShieldCheck />, path: "/escrow" },
  { text: "Utilisateurs", icon: <User />, path: "/users" },
  { text: "Journal d'audit", icon: <Clock />, path: "/audit" },
  { text: "Configuration", icon: <Gear />, path: "/settings" },
];

interface BreadcrumbInfo { label: string; path?: string; parent?: string; }

const breadcrumbMap: Record<string, BreadcrumbInfo> = {
  "/": { label: "Tableau de bord", path: "/" },
  "/farmers": { label: "Producteurs", parent: "/" },
  "/alerts": { label: "Alertes", parent: "/" },
  "/compliance": { label: "Conformité EUDR", parent: "/" },
  "/users": { label: "Comptes utilisateurs", parent: "/" },
  "/audit": { label: "Journal d'audit", parent: "/" },
  "/settings": { label: "Configuration", parent: "/" },
  "/certifications": { label: "Certifications", parent: "/" },
  "/payments": { label: "Paiements", parent: "/" },
  "/predictions": { label: "Prévisions Prix", parent: "/" },
  "/escrow": { label: "Escrow B2B", parent: "/" },
  "/ai": { label: "IA & Analytics", parent: "/" },
  "/disease": { label: "Détection des Maladies", parent: "/" },
  "/weather": { label: "Météo", parent: "/" },
};

function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [collapsed, setCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const drawerWidth = collapsed && !isMobile ? DRAWER_COLLAPSED : DRAWER_WIDTH;
  const session = getAdminSession();

  const handleLogout = useCallback(async () => {
    setAnchorEl(null);
    await logoutAdmin();
    navigate("/login", { replace: true });
  }, [navigate]);

  const breadcrumbs = (() => {
    const info = breadcrumbMap[location.pathname];
    if (!info) return [{ label: "Dashboard" }];
    if (!info.parent) return [{ label: info.label, path: "/" }];
    const parentInfo = breadcrumbMap[info.parent];
    return [
      { label: parentInfo?.label || "Dashboard", path: info.parent },
      { label: info.label },
    ];
  })();

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f4f6f8" }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          bgcolor: "#ffffff",
          color: "#1a1a2e",
          backdropFilter: "blur(12px)",
        }}
      >
        <Toolbar>
          <Tooltip title={collapsed ? "Développer" : "Réduire"}>
            <IconButton edge="start" onClick={() => setCollapsed(!collapsed)} sx={{ mr: 1 }}>
              {collapsed ? <CaretLeft /> : <MenuList />}
            </IconButton>
          </Tooltip>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 36, height: 36, borderRadius: 2,
                background: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Typography color="white" fontWeight="bold" fontSize={18}>A</Typography>
            </Box>
            <Typography variant="h6" fontWeight={700} noWrap>
              ATB AgriTrace
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Notifications">
            <IconButton sx={{ mr: 1 }}>
              <Badge badgeContent={3} color="error">
                <Bell />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title={session?.full_name || "Administrateur"}>
            <Avatar
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ width: 36, height: 36, bgcolor: "#1b5e20", cursor: "pointer" }}
            >
              <UserCircle />
            </Avatar>
          </Tooltip>
          <Menu
            anchorEl={anchorEl}
            open={!!anchorEl}
            onClose={() => setAnchorEl(null)}
            transformOrigin={{ horizontal: "right", vertical: "top" }}
            anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            slotProps={{ paper: { sx: { mt: 1, minWidth: 200, borderRadius: 2, p: 1 } } }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" fontWeight={700}>{session?.full_name}</Typography>
              <Typography variant="caption" color="text.secondary">{session?.role}</Typography>
            </Box>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem onClick={handleLogout} sx={{ borderRadius: 2, gap: 1.5 }}>
              <SignOut size={18} />
              <Typography>Déconnexion</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={!isMobile ? true : undefined}
        onClose={isMobile ? () => setCollapsed(true) : undefined}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          transition: "width 0.25s ease",
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            transition: "width 0.25s ease",
            overflowX: "hidden",
            bgcolor: "#ffffff",
            borderRight: "1px solid rgba(0,0,0,0.06)",
          },
        }}
      >
        <Toolbar />
        <Box sx={{ px: collapsed && !isMobile ? 1 : 2, py: 2 }}>
          <List>
            {menuItems.map((item) => {
              const selected = location.pathname === item.path;
              return (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton
                    selected={selected}
                    onClick={() => navigate(item.path)}
                    sx={{
                      borderRadius: 3,
                      minHeight: 48,
                      justifyContent: collapsed && !isMobile ? "center" : "initial",
                      px: collapsed && !isMobile ? 1 : 2,
                      bgcolor: selected ? "rgba(27,94,32,0.08)" : "transparent",
                      "&:hover": { bgcolor: selected ? "rgba(27,94,32,0.12)" : "rgba(0,0,0,0.04)" },
                      "&.Mui-selected": {
                        bgcolor: "rgba(27,94,32,0.08)",
                        "&:hover": { bgcolor: "rgba(27,94,32,0.12)" },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: collapsed && !isMobile ? 0 : 40,
                        color: selected ? "primary.main" : "text.secondary",
                        justifyContent: "center",
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {(collapsed && isMobile) || !collapsed || isMobile ? (
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontSize: "0.9rem",
                          fontWeight: selected ? 700 : 500,
                          color: selected ? "primary.main" : "text.primary",
                        }}
                      />
                    ) : null}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
        <Divider />
        <Box sx={{ p: collapsed && !isMobile ? 1 : 2, mt: "auto" }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              background: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)",
              color: "white",
              textAlign: "center",
              display: collapsed && !isMobile ? "none" : "block",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontSize: "0.75rem", opacity: 0.8 }}>Version</Typography>
            <Typography fontWeight={700}>v2.0.0</Typography>
          </Box>
        </Box>
      </Drawer>

      <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1, minHeight: "100vh" }}>
        <Toolbar />
        <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 4 }, overflow: "auto" }}>
          <Breadcrumb crumbs={breadcrumbs} />
          <Suspense fallback={<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>}>
            <PageTransition>
              {children}
            </PageTransition>
          </Suspense>
        </Box>
        <AdminFooter />
      </Box>
      <Toast />
    </Box>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const session = getAdminSession();
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={
            <Suspense fallback={<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>}>
              <LoginPage />
            </Suspense>
          } />
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<SummaryDashboard />} />
                  <Route path="/farmers" element={<Farmers />} />
                  <Route path="/alerts" element={<Alerts />} />
                  <Route path="/ai" element={<AIDashboard />} />
                  <Route path="/disease" element={<DiseaseDetection />} />
                  <Route path="/compliance" element={<ComplianceEUDR />} />
                  <Route path="/certifications" element={<Certifications />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/predictions" element={<PredictionsAdmin />} />
                  <Route path="/escrow" element={<EscrowAdmin />} />
                  <Route path="/weather" element={<Weather />} />
                  <Route path="/users" element={<UserAccounts />} />
                  <Route path="/audit" element={<AuditLog />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
