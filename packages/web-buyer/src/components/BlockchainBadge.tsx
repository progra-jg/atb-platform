import React from "react";
import { useTranslation } from "react-i18next";

interface BlockchainBadgeProps {
  verified: boolean;
  hash?: string;
  size?: "sm" | "md" | "lg";
}

function BlockchainBadge({ verified, hash, size = "md" }: BlockchainBadgeProps) {
  const { t } = useTranslation();
  const sizes = { sm: { padding: "3px 10px", fontSize: 11 }, md: { padding: "5px 14px", fontSize: 13 }, lg: { padding: "8px 18px", fontSize: 15 } };
  const s = sizes[size];

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 20,
      padding: s.padding, fontSize: s.fontSize, fontWeight: 600,
      background: verified ? "#ecfdf5" : "#f5f5f5",
      color: verified ? "#059669" : "#999",
    }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: verified ? "#059669" : "#ccc" }} />
      <span>{t(verified ? "blockchain.verified" : "blockchain.unverified")}</span>
      {hash && <span style={{ fontSize: s.fontSize - 2, opacity: 0.6 }}>{hash.slice(0, 10)}...</span>}
    </div>
  );
}

export default BlockchainBadge;
