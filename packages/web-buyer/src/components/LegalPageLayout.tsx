import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { PageTransition } from "./PageTransition";
import { type LegalPageData } from "../data/types";

interface Props {
  data: LegalPageData;
}

export function LegalPageLayout({ data }: Props) {
  const { colors, isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  useEffect(() => { setVisible(true); }, []);

  const fadeUp = (d: number) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(16px)",
    transition: `opacity 400ms cubic-bezier(0.16,1,0.3,1) ${d}ms, transform 400ms cubic-bezier(0.16,1,0.3,1) ${d}ms`,
  });

  return (
    <PageTransition>
      <div style={{ minHeight: "100vh", background: isDark ? "#070b09" : "#f4f6f5" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px 100px" }}>
          <div style={fadeUp(0)}>
            {data.badge && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                background: isDark ? "rgba(52,211,153,0.1)" : "rgba(10,110,74,0.08)",
                color: isDark ? "#34d399" : "#0a6e4a", marginBottom: 16,
              }}>
                {data.badge}
              </div>
            )}
            <h1 style={{
              fontSize: 32, fontWeight: 800, marginBottom: 8,
              background: "linear-gradient(135deg, #0a6e4a, #34d399)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>{data.title}</h1>
            <p style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 40, lineHeight: 1.7 }}>
              {data.subtitle}
            </p>
          </div>
          {data.sections.map((s, i) => (
            <div key={s.id} style={{
              ...fadeUp(80 + i * 40),
              marginBottom: 28,
              padding: 24, borderRadius: 14,
              background: isDark ? "rgba(255,255,255,0.02)" : "white",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
            }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: colors.text }}>{s.title}</h2>
              {s.paragraphs.map((p, j) => (
                <p key={j} style={{
                  fontSize: 13, color: colors.textSecondary, lineHeight: 1.8,
                  marginBottom: j < s.paragraphs.length - 1 ? 10 : 0,
                }}>{p}</p>
              ))}
              {s.subsections?.map((sub) => (
                <div key={sub.title} style={{ marginTop: 16, paddingLeft: 16, borderLeft: "2px solid var(--color-accent)" }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: colors.text }}>{sub.title}</h3>
                  {sub.paragraphs.map((p, j) => (
                    <p key={j} style={{
                      fontSize: 13, color: colors.textSecondary, lineHeight: 1.8,
                      marginBottom: j < sub.paragraphs.length - 1 ? 8 : 0,
                    }}>{p}</p>
                  ))}
                </div>
              ))}
            </div>
          ))}
          <p style={{ ...fadeUp(600), fontSize: 11, color: colors.textMuted, textAlign: "center", marginTop: 40 }}>
            &copy; {new Date().getFullYear()} ATB Technologies SAS. Tous droits réservés. / All rights reserved.
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
