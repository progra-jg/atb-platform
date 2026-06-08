import React, { useState, useEffect, useRef, Suspense, lazy, useCallback, useMemo } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  House, Package, Certificate, ClipboardText, Bell, UserCircle, CaretDown,
  Sun, Moon, User, GearSix, SignOut, ChartBar, Users, ShoppingCart, Envelope,
  FileArrowDown, Star, FileText, Cloud, ShieldCheck, SealCheck, ArrowsLeftRight, List, X, MagnifyingGlass,
  PlusCircle, Leaf as LeafIcon, Buildings, Megaphone, Truck, CurrencyCircleDollar, HandCoins,
}
 from "@phosphor-icons/react";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { RoleThemeProvider, useRoleTheme } from "./context/RoleThemeContext";
import GlobalStyles from "./styles/GlobalStyles";
import Footer from "./components/Footer";
import Logo from "./components/Logo";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastProvider } from "./context/ToastContext";
import { PageTransition } from "./components/PageTransition";
import { ResponsiveContainer } from "./components/ResponsiveContainer";
import { MobileNav } from "./components/MobileNav";
import { useIsMobile } from "./hooks/useMediaQuery";
import { useNotificationToasts } from "./hooks/useNotificationToasts";
import { useRole } from "./hooks/useRole";
import NotificationPanel from "./components/NotificationPanel";
import { CartProvider, useCart } from "./context/CartContext";
import { CompareProvider } from "./context/CompareContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ProducerLayout from "./components/ProducerLayout";
import BuyerLayout from "./components/BuyerLayout";
import { SkeletonCard, SkeletonText, SkeletonStatCard } from "./components/ui/Skeleton";
import FloatingLangToggle, { HomeButton } from "./components/FloatingLangToggle";
import ConnectionStatus from "./components/ConnectionStatus";
import InstallPrompt from "./components/InstallPrompt";
import RbacRoute from "./components/RbacRoute";

const PageLoading = () => (
  <div style={{ padding: "40px 24px", maxWidth: 900, margin: "0 auto" }}>
    <SkeletonText lines={2} width="60%" />
    <div style={{ height: 24 }} />
    <SkeletonCard height={200} />
    <div style={{ height: 24 }} />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
      {[1,2,3,4].map((i) => <SkeletonStatCard key={i} />)}
    </div>
    <div style={{ height: 24 }} />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <SkeletonCard height={120} />
      <SkeletonCard height={120} />
    </div>
  </div>
);

const Dashboard = lazy(() => import("./pages/Dashboard"));
const LotSearch = lazy(() => import("./pages/LotSearch"));
const LotDetail = lazy(() => import("./pages/LotDetail"));
const Certificates = lazy(() => import("./pages/Certificates"));
const Orders = lazy(() => import("./pages/Orders"));
const Settings = lazy(() => import("./pages/Settings"));
const Insights = lazy(() => import("./pages/Insights"));
const ArticleDetailPage = lazy(() => import("./pages/ArticleDetailPage"));
const FarmerProfilePage = lazy(() => import("./pages/FarmerProfilePage"));
const FarmersListPage = lazy(() => import("./pages/FarmersListPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Cart = lazy(() => import("./pages/Cart"));
const Inbox = lazy(() => import("./pages/Inbox"));
const CompareLots = lazy(() => import("./pages/CompareLots"));
const Downloads = lazy(() => import("./pages/Downloads"));
const PriceHistory = lazy(() => import("./pages/PriceHistory"));
const AlertsManage = lazy(() => import("./pages/AlertsManage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const SampleRequests = lazy(() => import("./pages/SampleRequests"));
const Contracts = lazy(() => import("./pages/Contracts"));
const WeatherInsights = lazy(() => import("./pages/WeatherInsights"));
const EscrowCheckout = lazy(() => import("./pages/EscrowCheckout"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const Landing = lazy(() => import("./pages/Landing"));
const About = lazy(() => import("./pages/About"));
const Legal = lazy(() => import("./pages/Legal"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Eudr = lazy(() => import("./pages/Eudr"));
const Help = lazy(() => import("./pages/Help"));
const Contact = lazy(() => import("./pages/Contact"));
const ApiStatus = lazy(() => import("./pages/ApiStatus"));
const Changelog = lazy(() => import("./pages/Changelog"));
const SubmitOffer = lazy(() => import("./pages/SubmitOffer"));
const ImpactPage = lazy(() => import("./pages/ImpactPage"));
const PriceCardPage = lazy(() => import("./pages/PriceCardPage"));
const CooperativePage = lazy(() => import("./pages/CooperativePage"));
const DemandPage = lazy(() => import("./pages/DemandPage"));
const EudrFunnelPage = lazy(() => import("./pages/EudrFunnelPage"));
const NegotiationPage = lazy(() => import("./pages/NegotiationPage"));
const LogisticsPage = lazy(() => import("./pages/LogisticsPage"));
const QAPage = lazy(() => import("./pages/QAPage"));
const ShopHub = lazy(() => import("./pages/ShopHub"));
const BusinessHub = lazy(() => import("./pages/BusinessHub"));
const IntelHub = lazy(() => import("./pages/IntelHub"));
const ScanPage = lazy(() => import("./pages/ScanPage"));
const PayoutPage = lazy(() => import("./pages/PayoutPage"));
const FinancingPage = lazy(() => import("./pages/FinancingPage"));
const ProducerDashboard = lazy(() => import("./pages/sections/ProducerDashboard"));
const ProducerLotList = lazy(() => import("./pages/sections/ProducerLotList"));
const ProducerLotForm = lazy(() => import("./pages/sections/ProducerLotForm"));
const ProducerLotDetail = lazy(() => import("./pages/sections/ProducerLotDetail"));
const ProducerOrders = lazy(() => import("./pages/sections/ProducerOrders"));
const ProducerContracts = lazy(() => import("./pages/sections/ProducerContracts"));
const ProducerAnalytics = lazy(() => import("./pages/sections/ProducerAnalytics"));
const ProducerSettings = lazy(() => import("./pages/sections/ProducerSettings"));
const BuyerDashboard = lazy(() => import("./pages/sections/BuyerDashboard"));
const HomeRedirect = lazy(() => import("./components/HomeRedirect"));

interface NavGroupItem { navKey: string; path: string; icon: React.ElementType; }
interface NavGroup { labelKey: string; icon: React.ElementType; path: string; items: NavGroupItem[]; }

function getNavGroups(role: { isFarmer: boolean; isBuyer: boolean; userType: string | null }): NavGroup[] {
  const groups: NavGroup[] = [];
  if (role.isFarmer) {
    groups.push(
      { labelKey: "nav.farmerHub", icon: Package, path: "/producer", items: [
        { navKey: "farmerDashboard", path: "/producer", icon: Package },
        { navKey: "farmerLots", path: "/producer/lots", icon: Package },
        { navKey: "farmerOrders", path: "/producer/orders", icon: FileText },
        { navKey: "farmerContracts", path: "/producer/contracts", icon: FileText },
        { navKey: "farmerFinancing", path: "/financing", icon: HandCoins },
        { navKey: "farmerAnalytics", path: "/producer/analytics", icon: ChartBar },
        { navKey: "farmerSettings", path: "/producer/settings", icon: User },
      ]},
    );
  }
  if (role.isBuyer || !role.userType) {
    groups.push(
      { labelKey: "nav.shop", icon: Package, path: "/shop", items: [
        { navKey: "catalog", path: "/lots", icon: Package },
        { navKey: "farmers", path: "/farmers", icon: Users },
        { navKey: "prices", path: "/prices", icon: ChartBar },
      ]},
    );
  }
  groups.push(
    { labelKey: "nav.myBusiness", icon: ClipboardText, path: "/business", items: [
      { navKey: "deals", path: "/orders", icon: FileText },
      { navKey: "payout", path: "/payout", icon: CurrencyCircleDollar },
      { navKey: "compliance", path: "/certificates", icon: ShieldCheck },
      { navKey: "inbox", path: "/inbox", icon: Envelope },
    ]},
    { labelKey: "nav.intelligence", icon: ChartBar, path: "/intelligence", items: [
      { navKey: "insights", path: "/insights", icon: ChartBar },
      { navKey: "impact", path: "/impact", icon: LeafIcon },
      { navKey: "network", path: "/cooperatives", icon: Buildings },
    ]},
  );
  return groups;
}

const PROFILE_ITEMS = [
  { icon: User, labelKey: "nav.settings", path: "/settings" },
  { icon: Bell, labelKey: "nav.alerts", path: "/alerts" },
  { icon: FileArrowDown, labelKey: "nav.downloads", path: "/downloads" },
  { icon: GearSix, labelKey: "nav.settings", path: "/settings" },
];

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { isDark, toggle, colors } = useTheme();
  const { theme: roleTheme } = useRoleTheme();
  const isMobile = useIsMobile();
  const { user, logout } = useAuth();
  const role = useRole();
  const navGroups = useMemo(() => getNavGroups(role), [role]);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [notifCount, setNotifCount] = useState(0);
  const cartCount = useCart().count;
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    const poll = () => {
      import("./services/notifications").then((m) => m.fetchNotifications().then((data) => {
        if (mounted) setNotifCount(data.filter((n) => n.unread).length);
      }));
    };
    poll();
    const id = setInterval(poll, 15000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  useEffect(() => {
    const base = document.title.replace(/\s*\(\d+\)\s*$/, "");
    document.title = notifCount > 0 ? `${base} (${notifCount})` : base;
  }, [notifCount]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isChildActive = (group: NavGroup): boolean =>
    location.pathname === group.path || group.items.some((item) =>
      location.pathname === item.path || (item.path !== "/dashboard" && location.pathname.startsWith(item.path))
    );

  return (
    <>
      <MobileNav isOpen={menuOpen} onClose={() => setMenuOpen(false)} userType={role.userType} />
      <nav style={{
        height: 64,
        display: "flex", alignItems: "center",
        padding: isMobile ? "0 12px" : "0 28px",
        gap: isMobile ? 8 : 28,
        position: "sticky", top: 0, zIndex: 100,
        background: roleTheme.navbarBg,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 2px 24px rgba(0,20,0,0.18)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        {isMobile && (
          <>
            <button onClick={() => setMenuOpen(true)}
              style={{ background: "rgba(255,255,255,0.1)", border: "none", width: 36, height: 36, borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
              {menuOpen ? <X size={18} weight="bold" /> : <List size={18} weight="bold" />}
            </button>
            {user && (
              <div ref={notifRef} style={{ position: "relative" }}>
                <div onClick={() => setShowNotif(!showNotif)} style={{ background: "rgba(255,255,255,0.1)", border: "none", width: 36, height: 36, borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  <Bell size={16} weight={showNotif ? "fill" : "regular"} />
                  {notifCount > 0 && (
                    <span style={{ position: "absolute", top: -2, right: -2, width: 16, height: 16, borderRadius: 8, background: "#ef4444", color: "white", fontSize: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(239,68,68,0.4)", animation: "scaleIn 0.2s ease" }}>{notifCount}</span>
                  )}
                </div>
                {showNotif && <NotificationPanel onClose={() => setShowNotif(false)} onCountChange={setNotifCount} />}
              </div>
            )}
          </>
        )}

        <div style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          <Logo size={isMobile ? 32 : 38} showText={!isMobile} />
        </div>

        {!isMobile && (
          <div style={{ flex: 1, display: "flex", gap: 2, alignItems: "center", justifyContent: "center" }}>
            <motion.button onClick={() => navigate("/dashboard")}
              whileHover={{ scale: 1.04, background: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.16)" }}
              whileTap={{ scale: 0.96 }}
              style={{
                background: location.pathname === "/dashboard" ? "rgba(255,255,255,0.12)" : "transparent",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "white", padding: "8px 14px",
                borderRadius: 8, cursor: "pointer", fontSize: 13,
                fontWeight: location.pathname === "/dashboard" ? 600 : 500,
                display: "flex", alignItems: "center", gap: 6,
                whiteSpace: "nowrap",
                boxShadow: location.pathname === "/dashboard" ? "0 0 16px rgba(255,255,255,0.06)" : "none",
              }}>
              <House size={16} weight={location.pathname === "/dashboard" ? "fill" : "regular"} />
              <span>{t("nav.dashboard")}</span>
            </motion.button>

            {navGroups.map((group) => {
              const active = isChildActive(group);
              const isOpen = openGroup === group.labelKey;
              const GroupIcon = group.icon;
              return (
                <div key={group.labelKey} style={{ position: "relative" }}>
                  <motion.button
                    onMouseEnter={() => setOpenGroup(group.labelKey)}
                    onClick={() => { navigate(group.path); setOpenGroup(isOpen ? null : group.labelKey); }}
                    whileHover={{ scale: 1.04, background: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.16)" }}
                    whileTap={{ scale: 0.96 }}
                    style={{
                      background: active ? "rgba(255,255,255,0.12)" : "transparent",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "white", padding: "8px 12px",
                      borderRadius: 8, cursor: "pointer", fontSize: 13,
                      fontWeight: active ? 600 : 500,
                      display: "flex", alignItems: "center", gap: 5,
                      whiteSpace: "nowrap",
                    }}>
                    <GroupIcon size={15} weight={active ? "fill" : "regular"} />
                    <span>{t(group.labelKey)}</span>
                    <CaretDown size={8} weight="bold" style={{ opacity: 0.6, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                  </motion.button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.96 }}
                        transition={{ duration: 0.12 }}
                        onMouseLeave={() => setOpenGroup(null)}
                        style={{
                          position: "absolute", top: 44, left: 0, minWidth: 190,
                          background: colors.surfaceElevated,
                          borderRadius: 12, border: `1px solid ${colors.border}`,
                          boxShadow: colors.shadowXl,
                          overflow: "hidden", zIndex: 200, padding: 4,
                        }}>
                        {group.items.map((item) => {
                          const itemActive = location.pathname === item.path;
                          const ItemIcon = item.icon;
                          return (
                            <div key={item.path}
                              onClick={() => { navigate(item.path); setOpenGroup(null); }}
                              style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "9px 14px", borderRadius: 8, cursor: "pointer",
                                color: itemActive ? roleTheme.accent : colors.text,
                                fontSize: 12.5, fontWeight: itemActive ? 600 : 400,
                                background: itemActive ? `${roleTheme.accent}0c` : "transparent",
                                transition: "background 0.1s",
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = itemActive ? `${roleTheme.accent}14` : colors.surfaceHover}
                              onMouseLeave={(e) => e.currentTarget.style.background = itemActive ? `${roleTheme.accent}0c` : "transparent"}>  
                              <ItemIcon size={14} weight={itemActive ? "fill" : "regular"} />
                              {t("nav." + item.navKey)}
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            <motion.button onClick={() => navigate("/inbox")}
              whileHover={{ scale: 1.04, background: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.16)" }}
              whileTap={{ scale: 0.96 }}
              style={{
                background: location.pathname === "/inbox" ? "rgba(255,255,255,0.12)" : "transparent",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "white", padding: "8px 14px",
                borderRadius: 8, cursor: "pointer", fontSize: 13,
                fontWeight: location.pathname === "/inbox" ? 600 : 500,
                display: "flex", alignItems: "center", gap: 6,
                whiteSpace: "nowrap",
              }}>
              <Envelope size={15} weight={location.pathname === "/inbox" ? "fill" : "regular"} />
              <span>{t("nav.messages")}</span>
            </motion.button>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 4 : 6 }}>
          <motion.button onClick={() => { const l = i18n.language === "fr" ? "en" : "fr"; i18n.changeLanguage(l); localStorage.setItem("lang", l); }}
            whileHover={{ scale: 1.05, background: "rgba(255,255,255,0.18)" }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: "5px 10px", borderRadius: 8,
              border: "1.5px solid rgba(255,255,255,0.25)",
              background: "rgba(255,255,255,0.08)", color: "#fff",
              cursor: "pointer", fontSize: 10, fontWeight: 700,
              letterSpacing: "0.3px",
            }}>
            {i18n.language === "fr" ? t("common.en") : t("common.fr")}
          </motion.button>

          <ThemeToggleBtn isDark={isDark} toggle={toggle} />

          <div style={{ position: "relative" }}>
            <NavIconBtn onClick={() => navigate("/cart")} tooltip={t("cart.title")}>
              <ShoppingCart size={16} weight="regular" />
            </NavIconBtn>
            {cartCount > 0 && (
              <span style={{
                position: "absolute", top: -2, right: -2,
                minWidth: 16, height: 16, borderRadius: 8,
                background: "#ef4444", color: "white", fontSize: 8,
                fontWeight: 700, display: "flex", alignItems: "center",
                justifyContent: "center", padding: "0 4px",
                boxShadow: "0 2px 6px rgba(239,68,68,0.4)",
                animation: "scaleIn 0.2s ease",
              }}>{cartCount}</span>
            )}
          </div>

          <div ref={notifRef} style={{ position: "relative" }}>
            <div style={{ position: "relative" }}>
            <NavIconBtn onClick={() => navigate("/scan")} tooltip={t("nav.scan")}>
              <MagnifyingGlass size={16} weight="regular" />
            </NavIconBtn>
            <NavIconBtn onClick={() => setShowNotif(!showNotif)} tooltip={t("nav.notifications")}>
              <Bell size={16} weight={showNotif ? "fill" : "regular"} />
            </NavIconBtn>
              {notifCount > 0 && (
                <span style={{
                  position: "absolute", top: -2, right: -2,
                  width: 16, height: 16, borderRadius: 8,
                  background: "#ef4444", color: "white", fontSize: 8,
                  fontWeight: 700, display: "flex", alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(239,68,68,0.4)",
                  animation: "scaleIn 0.2s ease",
                }}>{notifCount}</span>
              )}
            </div>
            {showNotif && (
              <NotificationPanel onClose={() => setShowNotif(false)} onCountChange={setNotifCount} />
            )}
          </div>

          {!isMobile && !user && (
            <>
              <motion.button onClick={() => navigate("/login")}
                whileHover={{ scale: 1.04, background: "rgba(255,255,255,0.18)" }}
                whileTap={{ scale: 0.96 }}
                style={{
                  padding: "8px 16px", borderRadius: 10,
                  border: "1.5px solid rgba(255,255,255,0.25)",
                  background: "rgba(255,255,255,0.08)", color: "#fff",
                  cursor: "pointer", fontSize: 12, fontWeight: 600,
                }}>
                {t("auth.login")}
              </motion.button>
              <motion.button onClick={() => navigate("/register")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                style={{
                  padding: "8px 16px", borderRadius: 10,
                  border: "none",
                  background: roleTheme.gradient, color: "#fff",
                  cursor: "pointer", fontSize: 12, fontWeight: 700,
                }}>
                {t("auth.register")}
              </motion.button>
            </>
          )}

          {!isMobile && user && (
            <div ref={profileRef} style={{ position: "relative" }}>
              <div onClick={() => setShowProfile(!showProfile)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "5px 10px 5px 5px", borderRadius: 10,
                  background: showProfile ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)",
                  cursor: "pointer", transition: "background 0.15s",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
                onMouseLeave={(e) => e.currentTarget.style.background = showProfile ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)"}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: "linear-gradient(135deg, #2e7d32, #4caf50)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "white", fontWeight: 700, fontSize: 11,
                  }}>{user ? user.company.charAt(0).toUpperCase() : t("common.user").charAt(0).toUpperCase()}</div>
                <CaretDown size={9} weight="bold" color="rgba(255,255,255,0.7)" />
              </div>

              <AnimatePresence>
              {showProfile && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position: "absolute", top: 46, right: 0, width: 220,
                    background: colors.surfaceElevated,
                    borderRadius: 12,
                    border: `1px solid ${colors.border}`,
                    boxShadow: colors.shadowXl,
                    overflow: "hidden", zIndex: 200,
                  }}>
                  <div style={{
                    padding: "14px 16px",
                    borderBottom: `1px solid ${colors.borderLight}`,
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: roleTheme.gradient,
                      display: "flex", alignItems: "center",
                      justifyContent: "center", color: "white",
                      fontWeight: 700, fontSize: 14,
                    }}>{user ? user.company.charAt(0).toUpperCase() : t("common.user").charAt(0).toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: colors.text, marginBottom: 1, display: "flex", alignItems: "center", gap: 6 }}>
                        {user?.company || t("common.user")}
                        {role.isFarmer && (
                          <span style={{
                            fontSize: 9, fontWeight: 600, background: `${roleTheme.accent}20`,
                            color: roleTheme.accent, padding: "1px 6px", borderRadius: 4,
                            whiteSpace: "nowrap",
                          }}>{t("nav.farmer")}</span>
                        )}
                        {role.isBuyer && (
                          <span style={{
                            fontSize: 9, fontWeight: 600, background: `${colors.info}20`,
                            color: colors.info, padding: "1px 6px", borderRadius: 4,
                            whiteSpace: "nowrap",
                          }}>{t("nav.buyer")}</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: colors.textMuted, overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email || "—"}</div>
                    </div>
                  </div>

                  {PROFILE_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.labelKey}
                        onClick={() => { navigate(item.path); setShowProfile(false); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 8,
                          padding: "9px 16px", cursor: "pointer",
                          color: colors.text, fontSize: 12, fontWeight: 500,
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = colors.surfaceHover}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                        <Icon size={14} color={colors.textMuted} />
                        {t(item.labelKey)}
                      </div>
                    );
                  })}

                  <div style={{ borderTop: `1px solid ${colors.borderLight}`, marginTop: 2 }}>
                    <div
                      onClick={() => { logout(); setShowProfile(false); navigate("/login"); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "9px 16px", cursor: "pointer",
                        color: colors.error, fontSize: 12, fontWeight: 500,
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = colors.surfaceHover}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <SignOut size={14} />
                      {t("nav.logout")}
                    </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}

function NavIconBtn({ children, onClick, tooltip }: { children: React.ReactNode; onClick: () => void; tooltip: string }) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button ref={ref} onClick={onClick}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      style={{
        width: 36, height: 36, borderRadius: 10,
        background: "rgba(255,255,255,0.08)", border: "none",
        color: "white", cursor: "pointer", display: "flex",
        alignItems: "center", justifyContent: "center",
        transition: "all 0.15s", position: "relative",
      }}>
      {children}
      {show && (
        <span style={{
          position: "absolute", top: "calc(100% + 8px)", left: "50%",
          transform: "translateX(-50%)", background: "#1a1a2e",
          color: "white", fontSize: 10, fontWeight: 500,
          padding: "3px 8px", borderRadius: 6, whiteSpace: "nowrap",
          pointerEvents: "none", zIndex: 9999,
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        }}>
          {tooltip}
        </span>
      )}
    </button>
  );
}

function ThemeToggleBtn({ isDark, toggle }: { isDark: boolean; toggle: () => void }) {
  return (
    <motion.button onClick={toggle}
      whileHover={{ scale: 1.08, background: "rgba(255,255,255,0.18)" }}
      whileTap={{ scale: 0.9 }}
      style={{
        width: 36, height: 36, borderRadius: 10,
        background: "rgba(255,255,255,0.08)", border: "none",
        color: "white", cursor: "pointer", display: "flex",
        alignItems: "center", justifyContent: "center",
      }}>
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </motion.button>
  );
}

function AppContent() {
  const { colors } = useTheme();
  const location = useLocation();
  useNotificationToasts();

  return (
    <div style={{
      minHeight: "100vh", background: colors.bg,
      display: "flex", flexDirection: "column",
      color: colors.text, transition: "background 0.25s",
    }}>
      <GlobalStyles />
      <ConnectionStatus />
      {(() => {
        const publicPages = ["/login", "/register", "/about", "/legal", "/privacy", "/terms", "/eudr", "/help", "/contact", "/api-status", "/changelog", "/price-card"];
        const isPublic = publicPages.includes(location.pathname);
        const isLanding = location.pathname === "/";
        return <>{isLanding ? null : isPublic ? <><HomeButton /><FloatingLangToggle /></> : <ErrorBoundary context="Navbar"><Navbar /></ErrorBoundary>}</>;
      })()}

      <ErrorBoundary context="Routes">
        <Suspense fallback={<PageLoading />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
            <Route path="/about" element={<About />} />
            <Route path="/legal" element={<Legal />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/eudr" element={<Eudr />} />
            <Route path="/help" element={<Help />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/api-status" element={<ApiStatus />} />
            <Route path="/changelog" element={<Changelog />} />
  <Route path="/dashboard" element={<ProtectedRoute><ResponsiveContainer><PageTransition><Dashboard /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
  <Route path="/shop" element={<ProtectedRoute><ResponsiveContainer><PageTransition><ShopHub /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
  <Route path="/business" element={<ProtectedRoute><BuyerLayout /></ProtectedRoute>}>
              <Route index element={<BuyerDashboard />} />
              <Route path="orders" element={<Orders />} />
              <Route path="contracts" element={<Contracts />} />
              <Route path="favorites" element={<FavoritesPage />} />
              <Route path="inbox" element={<Inbox />} />
              <Route path="settings" element={<Settings />} />
            </Route>
  <Route path="/intelligence" element={<ProtectedRoute><ResponsiveContainer><PageTransition><IntelHub /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
  <Route path="/lots" element={<ProtectedRoute><ResponsiveContainer><PageTransition><LotSearch /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
            <Route path="/lots/:id" element={<ProtectedRoute><ResponsiveContainer><PageTransition><LotDetail /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
            <Route path="/certificates" element={<ProtectedRoute><ResponsiveContainer><PageTransition><Certificates /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><RbacRoute permission="order.view_own" fallbackPath="/producer"><ResponsiveContainer><PageTransition><Orders /></PageTransition></ResponsiveContainer></RbacRoute></ProtectedRoute>} />
      <Route path="/insights" element={<ResponsiveContainer><PageTransition><Insights /></PageTransition></ResponsiveContainer>} />
      <Route path="/insights/:id" element={<ResponsiveContainer><PageTransition><ArticleDetailPage /></PageTransition></ResponsiveContainer>} />
            <Route path="/weather-insights" element={<ProtectedRoute><ResponsiveContainer><PageTransition><WeatherInsights /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><ResponsiveContainer><PageTransition><Settings /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
            <Route path="/farmers" element={<ProtectedRoute><ResponsiveContainer><PageTransition><FarmersListPage /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
            <Route path="/farmers/:id" element={<ProtectedRoute><ResponsiveContainer><PageTransition><FarmerProfilePage /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute><RbacRoute permission="cart.manage" fallbackPath="/dashboard"><ResponsiveContainer><PageTransition><Cart /></PageTransition></ResponsiveContainer></RbacRoute></ProtectedRoute>} />
            <Route path="/inbox" element={<ProtectedRoute><ResponsiveContainer><PageTransition><Inbox /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
            <Route path="/compare" element={<ProtectedRoute><ResponsiveContainer><PageTransition><CompareLots /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
            <Route path="/downloads" element={<ProtectedRoute><ResponsiveContainer><PageTransition><Downloads /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
            <Route path="/prices" element={<ProtectedRoute><ResponsiveContainer><PageTransition><PriceHistory /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute><ResponsiveContainer><PageTransition><AlertsManage /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
            <Route path="/favorites" element={<ProtectedRoute><ResponsiveContainer><PageTransition><FavoritesPage /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
            <Route path="/contracts" element={<ProtectedRoute><ResponsiveContainer><PageTransition><Contracts /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
            <Route path="/contracts/new" element={<ProtectedRoute><ResponsiveContainer><PageTransition><Contracts /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
            <Route path="/contracts/:id" element={<ProtectedRoute><ResponsiveContainer><PageTransition><Contracts /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
            <Route path="/escrow" element={<ProtectedRoute><RbacRoute permission="escrow.use" fallbackPath="/dashboard"><ResponsiveContainer><PageTransition><EscrowCheckout /></PageTransition></ResponsiveContainer></RbacRoute></ProtectedRoute>} />
            <Route path="/escrow/:orderId" element={<ProtectedRoute><RbacRoute permission="escrow.use" fallbackPath="/dashboard"><ResponsiveContainer><PageTransition><EscrowCheckout /></PageTransition></ResponsiveContainer></RbacRoute></ProtectedRoute>} />
            <Route path="/payout" element={<ProtectedRoute><ResponsiveContainer><PageTransition><PayoutPage /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
            <Route path="/financing" element={<ProtectedRoute><ResponsiveContainer><PageTransition><FinancingPage /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
            <Route path="/my-samples" element={<ProtectedRoute><ResponsiveContainer><PageTransition><SampleRequests /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
            <Route path="/submit-offer" element={<ProtectedRoute><ResponsiveContainer><PageTransition><SubmitOffer /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
            <Route path="/impact" element={<ProtectedRoute><ResponsiveContainer><PageTransition><ImpactPage /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
            <Route path="/price-card" element={<PageTransition><PriceCardPage /></PageTransition>} />
            <Route path="/cooperatives" element={<ProtectedRoute><ResponsiveContainer><PageTransition><CooperativePage /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
            <Route path="/demand" element={<ProtectedRoute><ResponsiveContainer><PageTransition><DemandPage /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
            <Route path="/eudr-funnel" element={<ProtectedRoute><ResponsiveContainer><PageTransition><EudrFunnelPage /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
            <Route path="/negotiations" element={<ProtectedRoute><ResponsiveContainer><PageTransition><NegotiationPage /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
            <Route path="/logistics" element={<ProtectedRoute><ResponsiveContainer><PageTransition><LogisticsPage /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
            <Route path="/quality" element={<ProtectedRoute><ResponsiveContainer><PageTransition><QAPage /></PageTransition></ResponsiveContainer></ProtectedRoute>} />
            <Route path="/producer" element={<ProtectedRoute><RbacRoute permission="producer.hub" fallbackPath="/dashboard"><ProducerLayout /></RbacRoute></ProtectedRoute>}>
              <Route index element={<ProducerDashboard />} />
              <Route path="lots" element={<ProducerLotList />} />
              <Route path="lots/new" element={<ProducerLotForm />} />
              <Route path="lots/:id/edit" element={<ProducerLotForm />} />
              <Route path="lots/:id" element={<ProducerLotDetail />} />
              <Route path="orders" element={<ProducerOrders />} />
              <Route path="contracts" element={<ProducerContracts />} />
              <Route path="analytics" element={<ProducerAnalytics />} />
              <Route path="settings" element={<ProducerSettings />} />
            </Route>
            <Route path="/scan" element={<ScanPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
      </ErrorBoundary>
      <InstallPrompt />
      {!["/", "/login", "/register"].includes(location.pathname) && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <RoleThemeProvider>
            <CartProvider>
              <CompareProvider>
                <ToastProvider>
                  <AppContent />
                </ToastProvider>
              </CompareProvider>
            </CartProvider>
            </RoleThemeProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
