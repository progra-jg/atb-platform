import React, { type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { CaretRight } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";

interface Crumb { label: string; path?: string; icon?: React.ReactNode; }
interface Props { crumbs: Crumb[]; }

const Breadcrumb: React.FC<Props> = ({ crumbs }) => {
  const navigate = useNavigate();
  const { colors } = useTheme();

  return (
    <nav style={{
      display: "flex", alignItems: "center", gap: 6,
      marginBottom: 20, fontSize: 12, flexWrap: "wrap",
    }}>
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <React.Fragment key={crumb.label}>
            {i > 0 && <CaretRight size={10} color={colors.textMuted} weight="bold" />}
            <div
              onClick={crumb.path && !isLast ? () => navigate(crumb.path!) : undefined}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                color: isLast ? colors.text : colors.textMuted,
                fontWeight: isLast ? 600 : 450,
                cursor: crumb.path && !isLast ? "pointer" : "default",
                transition: "color 0.15s",
                padding: "2px 4px",
                borderRadius: 4,
              }}
              onMouseEnter={(e) => { if (!isLast) e.currentTarget.style.color = colors.accent; }}
              onMouseLeave={(e) => { if (!isLast) e.currentTarget.style.color = colors.textMuted; }}
              aria-current={isLast ? "page" as const : undefined}
              {...(crumb.path && !isLast ? { role: "button", tabIndex: 0, onKeyDown: (e: KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate(crumb.path!); } } } : {})}
            >
              {crumb.icon && <span style={{ display: "flex" }}>{crumb.icon}</span>}
              <span>{crumb.label}</span>
            </div>
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
