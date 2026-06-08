import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { tCrop } from "../utils/i18n";
import { useTheme } from "../context/ThemeContext";
import { useIsMobile } from "../hooks/useMediaQuery";
import Breadcrumb from "../components/Breadcrumb";
import { PageTitle } from "../components/ResponsiveContainer";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { useToast } from "../context/ToastContext";
import { PRODUCT_OPTIONS, REGION_OPTIONS } from "../types/onboarding";

const CULTURE_OPTIONS = ["Cacao", "Coton", "Anacarde", "Café", "Maïs", "Riz", "Soja", "Manioc", "Palmier", "Ananas", "Banane"];

export default function SubmitOffer() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const toast = useToast();
  const [culture, setCulture] = useState("");
  const [quantite, setQuantite] = useState("");
  const [prix, setPrix] = useState("");
  const [region, setRegion] = useState("");
  const [origine, setOrigine] = useState("");
  const [certification, setCertification] = useState("");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!culture || !quantite || !prix) {
      toast.error(t("common.error"), t("submitOffer.required"));
      return;
    }
    setSending(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      toast.success(t("submitOffer.success"));
      navigate("/lots");
    } catch {
      toast.error(t("common.error"));
    } finally {
      setSending(false);
    }
  };

  const inputBase: React.CSSProperties = {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: `1px solid ${colors.borderLight}`, background: colors.inputBg,
    color: colors.text, fontSize: 13, fontFamily: "inherit", outline: "none",
    boxSizing: "border-box", transition: "border-color 0.2s",
  };

  return (
    <div>
      <Breadcrumb crumbs={[
        { label: t("nav.dashboard"), path: "/dashboard" },
        { label: t("nav.submitOffer") },
      ]} />
      <PageTitle title={t("submitOffer.title")} subtitle={t("submitOffer.subtitle")} />

      <Card style={{ maxWidth: 600, margin: "0 auto", padding: isMobile ? 20 : 28 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: colors.text, display: "block", marginBottom: 4 }}>
              {t("lots.fields.culture")} *
            </label>
            <select value={culture} onChange={(e) => setCulture(e.target.value)}
              style={{ ...inputBase, cursor: "pointer" }}>
              <option value="">{t("common.select")}</option>
              {CULTURE_OPTIONS.map((c) => <option key={c} value={c}>{tCrop(c)}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.text, display: "block", marginBottom: 4 }}>
                {t("lots.fields.volume")} *
              </label>
              <input style={inputBase} value={quantite}
                placeholder={t("submitOffer.quantityPlaceholder")}
                onChange={(e) => setQuantite(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.text, display: "block", marginBottom: 4 }}>
                {t("lots.fields.price")} *
              </label>
              <input style={inputBase} value={prix}
                placeholder={t("submitOffer.pricePlaceholder")}
                onChange={(e) => setPrix(e.target.value)} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.text, display: "block", marginBottom: 4 }}>
                {t("lots.fields.region")}
              </label>
              <select value={region} onChange={(e) => setRegion(e.target.value)}
                style={{ ...inputBase, cursor: "pointer" }}>
                <option value="">{t("common.select")}</option>
                {REGION_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: colors.text, display: "block", marginBottom: 4 }}>
                {t("lots.fields.origin")}
              </label>
              <input style={inputBase} value={origine}
                placeholder={t("submitOffer.originPlaceholder")}
                onChange={(e) => setOrigine(e.target.value)} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: colors.text, display: "block", marginBottom: 4 }}>
              {t("lots.fields.certification")}
            </label>
            <select value={certification} onChange={(e) => setCertification(e.target.value)}
              style={{ ...inputBase, cursor: "pointer" }}>
              <option value="">{t("common.select")}</option>
              <option value="EUDR">EUDR</option>
              <option value="GlobalGAP">GlobalGAP</option>
              <option value="Bio">Bio</option>
              <option value="Fair Trade">Fair Trade</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: colors.text, display: "block", marginBottom: 4 }}>
              {t("submitOffer.description")}
            </label>
            <textarea style={{ ...inputBase, minHeight: 80, resize: "vertical" }} value={description}
              placeholder={t("submitOffer.descPlaceholder")}
              onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <Button variant="secondary" onClick={() => navigate("/lots")}>
              {t("common.cancel")}
            </Button>
            <Button variant="premium" onClick={handleSubmit} disabled={sending}>
              {sending ? t("common.loading") : t("submitOffer.submit")}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
