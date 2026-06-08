import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  House, Package, ChartBar, ShieldCheck,
  ClipboardText, Buildings, Envelope, CaretDown,
  X, List, Leaf as LeafIcon, User, FileText,
} from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { useTranslation } from "react-i18next";
import type { UserType } from "../types/onboarding";

interface MobileNavItem { navKey: string; path: string; icon: React.ElementType; }
interface MobileNavGroup { labelKey: string; icon: React.ElementType; items: MobileNavItem[]; }

function getMobileGroups(userType: UserType | null): MobileNavGroup[] {
  const groups: MobileNavGroup[] = [];
  if (userType === "farmer") {
    groups.push(
      { labelKey: "nav.farmerHub", icon: Package, items: [
        { navKey: "farmerDashboard", path: "/producer", icon: Package },
        { navKey: "farmerLots", path: "/producer/lots", icon: Package },
        { navKey: "farmerOrders", path: "/producer/orders", icon: FileText },
      ]},
    );
  }
  if (userType === "potential_buyer" || userType === "active_buyer" || !userType) {
    groups.push(
      { labelKey: "nav.shop", icon: Package, items: [
        { navKey: "catalog", path: "/lots", icon: Package },
        { navKey: "farmers", path: "/farmers", icon: User },
        { navKey: "prices", path: "/prices", icon: ChartBar },
      ]},
    );
  }
  groups.push(
    { labelKey: "nav.myBusiness", icon: ClipboardText, items: [
      { navKey: "deals", path: "/orders", icon: ClipboardText },
      { navKey: "compliance", path: "/certificates", icon: ShieldCheck },
      { navKey: "inbox", path: "/inbox", icon: Envelope },
    ]},
    { labelKey: "nav.intelligence", icon: ChartBar, items: [
      { navKey: "insights", path: "/insights", icon: ChartBar },
      { navKey: "impact", path: "/impact", icon: LeafIcon },
      { navKey: "network", path: "/cooperatives", icon: Buildings },
    ]},
  );
  return groups;
}

export function MobileNav({
  isOpen,
  onClose,
  userType,
}: {
  isOpen: boolean;
  onClose: () => void;
  userType?: UserType | null;
}) {
  const mobileGroups = useMemo(() => getMobileGroups(userType ?? null), [userType]);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const isChildActive = (group: MobileNavGroup): boolean =>
    group.items.some((item) => location.pathname === item.path);

  const navigateAndClose = (path: string) => {
    navigate(path);
    onClose();
    setOpenGroup(null);
  };

  return (
    <>
      {isOpen && (
        <div onClick={onClose} style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.5)", zIndex: 200,
          animation: "fadeIn 0.2s ease",
        }} />
      )}

      <div role="dialog" aria-modal="true" aria-label="Navigation" style={{
        position: "fixed", top: 0, left: 0, bottom: 0,
        width: "min(300px, 80vw)",
        background: colors.surface, zIndex: 300,
        transform: isOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.25s ease",
        display: "flex", flexDirection: "column",
        boxShadow: isOpen ? "4px 0 24px rgba(0,0,0,0.2)" : "none",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 20px", borderBottom: `1px solid ${colors.border}`,
        }}>
          <span style={{ fontWeight: 700, fontSize: 16, color: colors.text }}>
            {t("nav.navigation")}
          </span>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: colors.textMuted, padding: 4, display: "flex",
          }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, padding: "8px", overflowY: "auto" }}>
          <button onClick={() => navigateAndClose("/dashboard")} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12,
            padding: "14px 16px", borderRadius: 10, border: "none",
            background: location.pathname === "/dashboard" ? `${colors.accent}12` : "transparent",
            color: location.pathname === "/dashboard" ? colors.accent : colors.text,
            fontSize: 15, fontWeight: location.pathname === "/dashboard" ? 600 : 450,
            cursor: "pointer", marginBottom: 2, textAlign: "left",
          }}>
            <House size={20} weight={location.pathname === "/dashboard" ? "fill" : "regular"} />
            {t("nav.dashboard")}
          </button>

          {mobileGroups.map((group) => {
            const active = isChildActive(group);
            const isOpen = openGroup === group.labelKey;
            const GroupIcon = group.icon;
            return (
              <div key={group.labelKey} style={{ marginBottom: 2 }}>
                <button onClick={() => setOpenGroup(isOpen ? null : group.labelKey)} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 16px", borderRadius: 10, border: "none",
                  background: active ? `${colors.accent}0c` : "transparent",
                  color: active ? colors.accent : colors.text,
                  fontSize: 15, fontWeight: active ? 600 : 450,
                  cursor: "pointer", textAlign: "left",
                }}>
                  <GroupIcon size={20} weight={active ? "fill" : "regular"} />
                  <span style={{ flex: 1 }}>{t(group.labelKey)}</span>
                  <CaretDown size={12} style={{
                    opacity: 0.5, transform: isOpen ? "rotate(180deg)" : "none",
                    transition: "transform 0.15s",
                  }} />
                </button>

                {isOpen && (
                  <div style={{ paddingLeft: 16 }}>
                    {group.items.map((item) => {
                      const itemActive = location.pathname === item.path;
                      const ItemIcon = item.icon;
                      return (
                        <button key={item.path} onClick={() => navigateAndClose(item.path)} style={{
                          width: "100%", display: "flex", alignItems: "center", gap: 12,
                          padding: "12px 16px", borderRadius: 10, border: "none",
                          background: itemActive ? `${colors.accent}12` : "transparent",
                          color: itemActive ? colors.accent : colors.textSecondary,
                          fontSize: 14, fontWeight: itemActive ? 600 : 400,
                          cursor: "pointer", textAlign: "left",
                        }}>
                          <ItemIcon size={18} weight={itemActive ? "fill" : "regular"} />
                          {t("nav." + item.navKey)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

        </div>
      </div>
    </>
  );
}

export function HamburgerButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button onClick={onClick} aria-label={t("nav.menu")} style={{
      width: 38, height: 38, borderRadius: 10,
      background: "rgba(255,255,255,0.1)", border: "none",
      display: "flex", alignItems: "center", justifyContent: "center",
      cursor: "pointer", color: "white",
      transition: "background 0.15s",
    }}>
      <List size={20} weight="bold" />
    </button>
  );
}
