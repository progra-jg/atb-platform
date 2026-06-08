import { Suspense, useState, useMemo, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Package, ArrowFatRight, User, Gear,
  SignOut, SquaresFour, ListDashes, Handshake, ChartLineUp,
  Bell, Question, X, CurrencyCircleDollar, Heart, Envelope,
  ShoppingCart,
} from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useIsMobile } from "../hooks/useMediaQuery";
import { fetchOrders } from "../services/orders";
import { formatNumber } from "../utils/format";
import { PageTransition } from "./PageTransition";
import Breadcrumbs from "./Breadcrumbs";

const BUYER_ACCENT = "#2563eb";
const BUYER_GRADIENT = "linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #3b82f6 100%)";

function BuyerLoading() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 60 }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        border: "3px solid", borderTopColor: BUYER_ACCENT,
        borderRightColor: "rgba(37,99,235,0.2)",
        borderBottomColor: "rgba(37,99,235,0.2)",
        borderLeftColor: "rgba(37,99,235,0.2)",
        animation: "spin 0.7s linear infinite",
      }} />
    </div>
  );
}

interface NavEntry {
  key: string;
  path: string;
  icon: React.ElementType;
  labelKey: string;
}

const NAV_ITEMS: NavEntry[] = [
  { key: "dashboard", path: "/business", icon: SquaresFour, labelKey: "nav.dashboard" },
  { key: "orders", path: "/business/orders", icon: ShoppingCart, labelKey: "nav.orders" },
  { key: "contracts", path: "/business/contracts", icon: Handshake, labelKey: "nav.contracts" },
  { key: "favorites", path: "/business/favorites", icon: Heart, labelKey: "nav.favorites" },
  { key: "inbox", path: "/business/inbox", icon: Envelope, labelKey: "nav.inbox" },
  { key: "settings", path: "/business/settings", icon: Gear, labelKey: "nav.settings" },
];

const TOKEN = {
  sidebarW: 220,
  sidebarWCollapsed: 64,
  headerH: 56,
  mobileNavH: 64,
};

function NavItem({ item, active, collapsed, onClick }: { item: NavEntry; active: boolean; collapsed?: boolean; onClick: () => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: collapsed ? "10px" : "10px 12px",
        borderRadius: 8, cursor: "pointer",
        justifyContent: collapsed ? "center" : "flex-start",
        background: active ? BUYER_ACCENT : hovered ? colors.surfaceHover : "transparent",
        color: active ? "#fff" : colors.textSecondary,
        transition: "all 0.15s ease",
        position: "relative",
      }}
    >
      <item.icon size={18} weight={active ? "fill" : "regular"} />
      {!collapsed && <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, whiteSpace: "nowrap" }}>{t(item.labelKey)}</span>}
      {active && !collapsed && (
        <div style={{
          position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)",
          width: 3, height: 20, borderRadius: "3px 0 0 3px", background: BUYER_ACCENT,
        }} />
      )}
      {collapsed && hovered && (
        <div style={{
          position: "absolute", left: "100%", top: "50%", transform: "translateY(-50%)",
          marginLeft: 8, padding: "4px 10px", borderRadius: 6,
          background: colors.surfaceElevated, color: colors.text,
          fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", zIndex: 999,
          boxShadow: colors.shadowMd, border: `1px solid ${colors.borderLight}`,
          pointerEvents: "none",
        }}>
          {t(item.labelKey)}
        </div>
      )}
    </div>
  );
}

function MobileNavItem({ item, active, onClick }: { item: NavEntry; active: boolean; onClick: () => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 14px", borderRadius: 10, cursor: "pointer", marginBottom: 2,
        background: active ? BUYER_ACCENT : "transparent",
        color: active ? "#fff" : colors.textSecondary,
        transition: "all 0.15s ease",
      }}
    >
      <item.icon size={18} weight={active ? "fill" : "regular"} />
      <span style={{ fontSize: 14, fontWeight: active ? 600 : 400 }}>{t(item.labelKey)}</span>
    </div>
  );
}

function BottomNavItem({ item, active, onClick }: { item: NavEntry; active: boolean; onClick: () => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 2, padding: "4px 0", cursor: "pointer",
        flex: 1, minWidth: 0, maxWidth: "20%",
        color: active ? BUYER_ACCENT : colors.textMuted, transition: "color 0.15s",
      }}
    >
      <div style={{
        width: active ? 32 : 28, height: active ? 32 : 28, borderRadius: 8,
        background: active ? `${BUYER_ACCENT}14` : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s",
      }}>
        <item.icon size={18} weight={active ? "fill" : "regular"} />
      </div>
      <span style={{
        fontSize: 9, fontWeight: active ? 600 : 400, whiteSpace: "nowrap",
        overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%",
        lineHeight: 1.2,
      }}>
        {t(item.labelKey).split(" ")[0]}
      </span>
    </div>
  );
}

export default function BuyerLayout() {
  const { colors } = useTheme();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: () => fetchOrders(),
    retry: false,
    staleTime: 60000,
  });

  const myOrders = useMemo(() => orders.filter((o: any) => o.buyerId === user?.id || o.producteurId === user?.id), [orders, user?.id]);
  const activeOrders = useMemo(() => myOrders.filter((o: any) => o.statut !== "Livrée"), [myOrders]);
  const totalSpent = useMemo(() => myOrders.reduce((s: number, o: any) => s + (o.escrowDeposit ?? 0), 0), [myOrders]);

  const activeKey = NAV_ITEMS.find(
    (item) => item.path === "/business"
      ? location.pathname === "/business"
      : location.pathname.startsWith(item.path)
  )?.key;

  const activeLabel = NAV_ITEMS.find((i) => i.key === activeKey)?.labelKey ?? "nav.myBusiness";
  const closeMobile = useCallback(() => setMobileMenu(false), []);

  const crumbs = useMemo(() => {
    const segs = location.pathname.replace("/business", "").replace(/^\//, "").split("/").filter(Boolean);
    if (segs.length === 0) return [];
    const result: { labelKey: string; path?: string }[] = [
      { labelKey: "nav.dashboard", path: "/business" },
    ];
    let current = "/business";
    for (let i = 0; i < segs.length; i++) {
      current += "/" + segs[i];
      if (segs[i] === "orders") result.push({ labelKey: "nav.orders", path: current });
      else if (segs[i] === "contracts") result.push({ labelKey: "nav.contracts", path: current });
      else if (segs[i] === "favorites") result.push({ labelKey: "nav.favorites", path: current });
      else if (segs[i] === "inbox") result.push({ labelKey: "nav.inbox", path: current });
      else if (segs[i] === "settings") result.push({ labelKey: "nav.settings", path: current });
      else if (segs[i] === "new") result.push({ labelKey: "nav.new" });
      else result.push({ labelKey: "nav.detail" });
    }
    return result;
  }, [location.pathname]);

  const handleLogout = useCallback(() => {
    logout();
    navigate("/");
  }, [logout, navigate]);

  if (isMobile) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: colors.bg }}>
        <header style={{
          height: TOKEN.headerH, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px", background: colors.surface, borderBottom: `1px solid ${colors.borderLight}`,
          position: "sticky", top: 0, zIndex: 100,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: BUYER_GRADIENT, display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <Package size={16} color="#fff" weight="bold" />
            </div>
            <div style={{ minWidth: 0, overflow: "hidden" }}>
              <Breadcrumbs crumbs={crumbs} />
              {crumbs.length <= 1 && <span style={{ fontSize: 15, fontWeight: 700, color: colors.text, lineHeight: 1.2 }}>{t(activeLabel)}</span>}
              {crumbs.length <= 1 && <div style={{ fontSize: 9, color: BUYER_ACCENT, fontWeight: 600, lineHeight: 1.2 }}>{t("nav.myBusiness")}</div>}
            </div>
          </div>
          <div onClick={() => setMobileMenu(!mobileMenu)} style={{
            width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", background: mobileMenu ? colors.surfaceHover : "transparent",
          }}>
            {mobileMenu ? <X size={20} color={colors.text} /> : <SquaresFour size={20} color={colors.text} />}
          </div>
        </header>

        {mobileMenu && (
          <div style={{
            position: "fixed", top: TOKEN.headerH, left: 0, right: 0, bottom: 0, zIndex: 200,
            background: colors.surface, overflowY: "auto",
          }}>
            <div style={{ padding: "8px", borderBottom: `1px solid ${colors.borderLight}` }}>
              {NAV_ITEMS.map((item) => (
                <MobileNavItem key={item.key} item={item} active={activeKey === item.key} onClick={() => { navigate(item.path); closeMobile(); }} />
              ))}
            </div>
            <div style={{ padding: "8px" }}>
              <div onClick={() => { navigate("/lots"); closeMobile(); }} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10,
                cursor: "pointer", color: colors.textSecondary, fontSize: 14,
              }}>
                <ListDashes size={18} />
                <span>{t("nav.catalog")}</span>
              </div>
              <div onClick={handleLogout} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10,
                cursor: "pointer", color: colors.textMuted, fontSize: 14,
              }}>
                <SignOut size={18} />
                <span>{t("nav.logout")}</span>
              </div>
            </div>
          </div>
        )}

        <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <PageTransition>
            <Suspense fallback={<BuyerLoading />}>
              <Outlet />
            </Suspense>
          </PageTransition>
        </main>

        <nav style={{
          height: TOKEN.mobileNavH, display: "flex", alignItems: "center", justifyContent: "space-around",
          background: colors.surface, borderTop: `1px solid ${colors.borderLight}`,
          position: "sticky", bottom: 0, zIndex: 100,
          padding: "4px 0",
        }}>
          {NAV_ITEMS.map((item) => (
            <BottomNavItem key={item.key} item={item} active={activeKey === item.key} onClick={() => navigate(item.path)} />
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: colors.bg }}>
      <aside style={{
        width: collapsed ? TOKEN.sidebarWCollapsed : TOKEN.sidebarW,
        minHeight: "100vh", display: "flex", flexDirection: "column",
        background: `linear-gradient(180deg, ${colors.surface} 0%, ${colors.bg} 100%)`,
        borderRight: `1px solid ${colors.borderLight}`,
        transition: "width 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        overflow: "hidden", flexShrink: 0,
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{
          height: TOKEN.headerH, display: "flex", alignItems: "center", gap: 10,
          padding: collapsed ? "0 14px" : "0 18px",
          borderBottom: `1px solid ${colors.borderLight}`, cursor: "pointer",
        }} onClick={() => navigate("/business")}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: BUYER_GRADIENT, display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Package size={16} color="#fff" weight="bold" />
          </div>
          {!collapsed && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: colors.text, lineHeight: 1.2 }}>ATB</span>
              <span style={{ fontSize: 9, color: BUYER_ACCENT, fontWeight: 600, opacity: 0.8 }}>{t("nav.myBusiness")}</span>
            </div>
          )}
        </div>

        <div style={{ flex: 1, padding: "8px", display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.key} item={item} active={activeKey === item.key} collapsed={collapsed} onClick={() => navigate(item.path)} />
          ))}
        </div>

        {!collapsed && (
          <div style={{
            padding: "8px 10px", margin: "0 8px 4px",
            background: colors.surfaceHover, borderRadius: 8,
            display: "flex", flexDirection: "column", gap: 4,
          }}>
            <div style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, color: colors.textMuted, marginBottom: 2 }}>
              {t("common.overview")}
            </div>
            {[
              { icon: ShoppingCart, label: t("orders.stats.active"), value: String(activeOrders.length), color: BUYER_ACCENT },
              { icon: CurrencyCircleDollar, label: t("common.total"), value: `${formatNumber(totalSpent)} FCFA`, color: colors.success },
              { icon: ListDashes, label: t("nav.orders"), value: String(myOrders.length), color: colors.warning },
            ].map((s) => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: colors.textSecondary }}>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <s.icon size={10} color={s.color} weight="fill" />
                  {s.label}
                </span>
                <span style={{ fontWeight: 700, color: colors.text }}>{s.value}</span>
              </div>
            ))}
          </div>
        )}

        <div onClick={() => setCollapsed(!collapsed)} style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "10px", cursor: "pointer", color: colors.textMuted, fontSize: 11,
          borderTop: `1px solid ${colors.borderLight}`,
          transition: "color 0.15s",
        }}
          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.color = colors.text}
          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.color = colors.textMuted}
        >
          <ArrowFatRight size={14} weight="bold" style={{ transform: `rotate(${collapsed ? 180 : 0}deg)`, transition: "transform 0.3s ease" }} />
          {!collapsed && <span>{t("common.close")}</span>}
        </div>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header style={{
          height: TOKEN.headerH, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 24px", background: colors.surface, borderBottom: `1px solid ${colors.borderLight}`,
          position: "sticky", top: 0, zIndex: 40,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
            <Breadcrumbs crumbs={crumbs} />
            {crumbs.length <= 1 && <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{t(activeLabel)}</span>}
            <span style={{
              fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
              padding: "2px 6px", borderRadius: 4, background: `${BUYER_ACCENT}15`, color: BUYER_ACCENT,
            }}>
              {t("nav.buyer")}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Bell size={18} color={colors.textMuted} style={{ cursor: "pointer" }} />
            <Question size={18} color={colors.textMuted} style={{ cursor: "pointer" }} />
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "4px 10px 4px 4px", borderRadius: 8,
              background: colors.surfaceHover, cursor: "pointer",
            }} onClick={() => navigate("/business/settings")}>
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                background: BUYER_GRADIENT, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <User size={14} color="#fff" weight="fill" />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: colors.text, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.company || user?.email || t("nav.buyer")}
              </span>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: "auto" }}>
          <PageTransition>
            <Suspense fallback={<BuyerLoading />}>
              <Outlet />
            </Suspense>
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
