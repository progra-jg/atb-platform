import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { QrCode, DownloadSimple, Copy } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import Card, { CardHeader } from "./ui/Card";
import { useTheme } from "../context/ThemeContext";

interface LotQRCodeProps {
  lotId: string;
  lotUrl: string;
  size?: number;
}

export default function LotQRCode({ lotId, lotUrl, size = 180 }: LotQRCodeProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(lotUrl, {
      width: size * 2,
      margin: 2,
      color: { dark: "#1a1a1a", light: "#ffffff" },
    }).then(setQrDataUrl);
  }, [lotUrl, size]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `lot-${lotId}-qr.png`;
    a.click();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(lotUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <Card variant="premium" style={{ padding: 16 }}>
      <CardHeader
        icon={<QrCode size={16} />}
        title={t("detail.qrCode")}
        action={
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={handleDownload} style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: colors.textMuted, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = colors.surfaceHover; e.currentTarget.style.color = colors.text; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = colors.textMuted; }}
              aria-label={t("common.download")}
            >
              <DownloadSimple size={14} />
            </button>
            <button onClick={handleCopy} style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", color: copied ? colors.success : colors.textMuted, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
              onMouseEnter={(e) => { if (!copied) { e.currentTarget.style.background = colors.surfaceHover; e.currentTarget.style.color = colors.text; } }}
              onMouseLeave={(e) => { if (!copied) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = colors.textMuted; } }}
              aria-label={t("common.copy")}
            >
              <Copy size={14} />
            </button>
          </div>
        }
      />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "12px 0 4px" }}>
        {qrDataUrl ? (
          <motion.img
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            src={qrDataUrl}
            alt={`QR code pour le lot ${lotId}`}
            style={{ width: size, height: size, borderRadius: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
          />
        ) : (
          <div style={{ width: size, height: size, borderRadius: 12, background: colors.skeleton ?? colors.surface, animation: "shimmer 1.5s ease-in-out infinite" }} />
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: colors.textMuted, fontWeight: 500, letterSpacing: "0.3px" }}>{lotId}</span>
        </div>
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </Card>
  );
}
