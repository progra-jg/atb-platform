import React, { ReactNode } from "react";
import { useIsMobile } from "../hooks/useMediaQuery";

export function ResponsiveContainer({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();

  return (
    <div
      style={{
        flex: 1,
        maxWidth: 1280,
        margin: "0 auto",
        padding: isMobile ? "16px" : "24px 32px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {children}
    </div>
  );
}

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const isMobile = useIsMobile();

  return (
    <div style={{ marginBottom: isMobile ? 20 : 28 }}>
      <h1
        style={{
          fontSize: isMobile ? 22 : 28,
          fontWeight: 700,
          color: "inherit",
          margin: 0,
          marginBottom: 4,
        }}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          style={{
            color: "inherit",
            fontSize: isMobile ? 13 : 15,
            margin: 0,
            opacity: 0.6,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
