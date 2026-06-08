import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, FloppyDisk } from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { createSampleRequest } from "../services/sampleRequests";
import PhoneInput from "./PhoneInput";

interface Props {
  lotId: string;
  producteurId: string;
  culture: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SampleRequestModal({ lotId, producteurId, culture, onClose, onSuccess }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [quantite, setQuantite] = useState("1 kg");
  const [message, setMessage] = useState("");
  const [adresse, setAdresse] = useState("");
  const [telephone, setTelephone] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    setSending(true);
    try {
      await createSampleRequest({ lotId, producteurId, quantiteDemandee: quantite, message, adresseLivraison: adresse, telephone });
      setDone(true);
      setTimeout(() => { onSuccess(); onClose(); }, 1500);
    } catch {}
    setSending(false);
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: colors.surface, borderRadius: 16, padding: 24, maxWidth: 440, width: "100%", boxShadow: colors.shadowXl, animation: "fadeSlideUp .25s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: colors.text }}>{t("sampleRequests.title")}</div>
            <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{culture} — {lotId}</div>
          </div>
          <button onClick={onClose} style={{ background: colors.statBg, border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: colors.textMuted }}>
            <X size={16} />
          </button>
        </div>

        {done ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: colors.text }}>{t("sampleRequests.sent")}</div>
            <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 4 }}>{t("sampleRequests.sentDesc")}</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, display: "block", marginBottom: 4 }}>{t("sampleRequests.qty")}</label>
              <input value={quantite} onChange={(e) => setQuantite(e.target.value)} placeholder={t("sampleRequests.qtyPlaceholder")} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${colors.borderLight}`, fontSize: 12, boxSizing: "border-box", background: colors.inputBg, color: colors.text }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, display: "block", marginBottom: 4 }}>{t("sampleRequests.message")}</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t("sampleRequests.messagePlaceholder")} rows={3} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${colors.borderLight}`, fontSize: 12, boxSizing: "border-box", resize: "vertical", background: colors.inputBg, color: colors.text, fontFamily: "inherit" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <PhoneInput
                value={telephone}
                onChange={setTelephone}
                countryCode="BJ"
                placeholder="XX XX XX XX"
                showFormat={false}
              />
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: colors.textMuted, display: "block", marginBottom: 4 }}>{t("sampleRequests.address")}</label>
                <input value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder={t("sampleRequests.addressPlaceholder")} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${colors.borderLight}`, fontSize: 12, boxSizing: "border-box", background: colors.inputBg, color: colors.text }} />
              </div>
            </div>
            <button onClick={handleSubmit} disabled={sending} style={{ marginTop: 6, width: "100%", padding: "10px 0", borderRadius: 10, border: "none", background: colors.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: sending ? 0.6 : 1 }}>
              <FloppyDisk size={16} /> {sending ? t("common.loading") : t("sampleRequests.send")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
