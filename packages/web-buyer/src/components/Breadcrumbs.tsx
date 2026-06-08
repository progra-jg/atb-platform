import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CaretRight } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";

interface Crumb {
  labelKey: string;
  path?: string;
}

interface BreadcrumbsProps {
  crumbs: Crumb[];
}

export default function Breadcrumbs({ crumbs }: BreadcrumbsProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigate = useNavigate();

  if (crumbs.length <= 1) return null;

  return (
    <nav style={{
      display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap",
    }}>
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        const key = crumb.path ? `crumb:${crumb.path}` : `crumb:${crumb.labelKey}:${i}`;
        return (
          <Fragment key={key}>
            {i > 0 && <CaretRight size={10} color={colors.textMuted} weight="bold" />}
            <span
              onClick={isLast || !crumb.path ? undefined : () => navigate(crumb.path!)}
              style={{
                fontSize: 11, fontWeight: isLast ? 600 : 400,
                color: isLast ? colors.text : colors.textMuted,
                cursor: !isLast && crumb.path ? "pointer" : "default",
                whiteSpace: "nowrap",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isLast && crumb.path) (e.currentTarget as HTMLElement).style.color = colors.accent;
              }}
              onMouseLeave={(e) => {
                if (!isLast && crumb.path) (e.currentTarget as HTMLElement).style.color = colors.textMuted;
              }}
            >
              {t(crumb.labelKey)}
            </span>
          </Fragment>
        );
      })}
    </nav>
  );
}
