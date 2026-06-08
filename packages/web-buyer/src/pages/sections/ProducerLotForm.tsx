import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Package, ArrowLeft, FloppyDisk, Image as ImageIcon, PlusCircle, Trash,
  Flask, Warehouse, CaretDown, CaretUp, Camera, X,
} from "@phosphor-icons/react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { getFarmerLotById, createFarmerLot, updateFarmerLot } from "../../services/farmerLots";
import type { Lot, LotLabResult, LotStockQuality, LotMedia } from "../../types";

const CULTURE_OPTIONS = [
  "Anacarde", "Cacao", "Café", "Coton", "Maïs",
  "Soja", "Manioc", "Riz", "Sésame", "Fruits", "Légumes", "Huile de Palme",
];

const STATUT_OPTIONS = ["Disponible", "En transit", "Vendu"];

interface LabResultEntry {
  type: string; parameter: string; result: string; method: string; date: string; laboratory: string;
}

interface ImageEntry {
  url: string; caption: string; type: LotMedia["type"];
}

export default function ProducerLotForm() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id: lotId } = useParams<{ id?: string }>();
  const isEdit = !!lotId;

  const [form, setForm] = useState({
    culture: "", origine: "", region: "", quantite: "", certification: "",
    statut: "Disponible" as "Disponible" | "En transit" | "Vendu",
    prix: "", producteur: user?.company ?? "", producteurId: user?.id ?? "",
    note: "75", phone: user?.phone ?? "",
  });

  const [stockQuality, setStockQuality] = useState<LotStockQuality>({});
  const [labResults, setLabResults] = useState<LabResultEntry[]>([]);
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [showStock, setShowStock] = useState(false);
  const [showLab, setShowLab] = useState(false);
  const [showImages, setShowImages] = useState(false);

  useEffect(() => {
    if (lotId) {
      const lot = getFarmerLotById(lotId);
      if (lot) {
        setForm({
          culture: lot.culture, origine: lot.origine, region: lot.region,
          quantite: lot.quantite, certification: lot.certification, statut: lot.statut,
          prix: String(lot.prix), producteur: lot.producteur,
          producteurId: lot.producteurId ?? "", note: String(lot.note), phone: lot.phone,
        });
        if (lot.stockQuality) setStockQuality(lot.stockQuality);
        if (lot.labResults) setLabResults(lot.labResults.map((r) => ({
          type: r.type, parameter: r.parameter, result: r.result,
          method: r.method, date: r.date, laboratory: r.laboratory,
        })));
        if (lot.images) setImages(lot.images.map((i) => ({
          url: i.url, caption: i.caption, type: i.type,
        })));
      }
    }
  }, [lotId]);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleStockChange = (key: keyof LotStockQuality, value: string) => {
    setStockQuality((prev) => ({ ...prev, [key]: value }));
  };

  const addLabEntry = () => {
    setLabResults((prev) => [...prev, { type: "", parameter: "", result: "", method: "", date: "", laboratory: "" }]);
  };
  const removeLabEntry = (idx: number) => {
    setLabResults((prev) => prev.filter((_, i) => i !== idx));
  };
  const updateLabEntry = (idx: number, key: keyof LabResultEntry, value: string) => {
    setLabResults((prev) => prev.map((e, i) => i === idx ? { ...e, [key]: value } : e));
  };

  const addImageEntry = () => {
    setImages((prev) => [...prev, { url: "", caption: "", type: "product" }]);
  };
  const removeImageEntry = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };
  const updateImageEntry = (idx: number, key: keyof ImageEntry, value: string) => {
    setImages((prev) => prev.map((e, i) => i === idx ? { ...e, [key]: value } : e));
  };

  const handleSubmit = () => {
    if (!form.culture || !form.quantite || !form.prix) return;
    setSaving(true);
    const data: Partial<Lot> = {
      culture: form.culture, origine: form.origine, region: form.region,
      quantite: form.quantite, certification: form.certification, statut: form.statut,
      prix: Number(form.prix), producteur: form.producteur,
      producteurId: form.producteurId, note: Number(form.note) || 75, phone: form.phone,
      stockQuality: Object.keys(stockQuality).length > 0 ? stockQuality : undefined,
      labResults: labResults.filter((r) => r.parameter || r.type).length > 0
        ? labResults.filter((r) => r.parameter || r.type).map((r, idx) => ({
            id: `lab-${Date.now()}-${idx}`, ...r,
          })) : undefined,
      images: images.filter((i) => i.url).length > 0
        ? images.filter((i) => i.url).map((i, idx) => ({
            id: `img-${Date.now()}-${idx}`, ...i,
          })) : undefined,
    };
    if (isEdit && lotId) {
      updateFarmerLot(lotId, data);
    } else {
      createFarmerLot(data as any);
    }
    navigate("/producer/lots");
  };

  const field = (
    label: string, key: string,
    type: "text" | "select" | "number" = "text", options?: string[],
  ) => (
    <div key={key} style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: colors.textSecondary, display: "block", marginBottom: 4 }}>
        {label}
      </label>
      {type === "select" && options ? (
        <select value={form[key as keyof typeof form]} onChange={(e) => handleChange(key, e.target.value)}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${colors.border}`,
            background: colors.surface, color: colors.text, fontSize: 13, outline: "none",
          }}
        >
          {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <input type={type} value={form[key as keyof typeof form]}
          onChange={(e) => handleChange(key, e.target.value)}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${colors.border}`,
            background: colors.surface, color: colors.text, fontSize: 13, outline: "none", boxSizing: "border-box",
          }}
        />
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 20px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div onClick={() => navigate("/producer/lots")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: colors.textSecondary, fontSize: 12 }}>
          <ArrowLeft size={14} />
          <span>{t("common.back")}</span>
        </div>
      </div>

      <div style={{ background: colors.surface, borderRadius: 14, border: `1px solid ${colors.borderLight}`, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${colors.accent}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Package size={18} color={colors.accent} weight="bold" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: colors.text }}>
              {isEdit ? t("producer.editLot") : t("producer.newLot")}
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: colors.textMuted }}>{t("producer.formDesc")}</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          {field(t("lots.fields.culture"), "culture", "select", CULTURE_OPTIONS)}
          {field(t("lots.fields.origin"), "origine")}
          {field(t("lots.fields.region"), "region")}
          {field(t("lots.fields.volume"), "quantite")}
          {field(t("lots.fields.price"), "prix", "number")}
          {field(t("lots.fields.certification"), "certification", "select", ["", "EUDR", "GlobalGAP", "Bio", "Fair Trade", "Rainforest Alliance"])}
          {field(t("producer.status"), "statut", "select", STATUT_OPTIONS)}
          {field(t("lots.fields.note"), "note", "number")}
        </div>
        {field(t("lots.fields.farmer"), "producteur")}
        {field(t("common.phone"), "phone")}

        {/* Stock Quality Section */}
        <div style={{ marginTop: 20, borderTop: `1px solid ${colors.borderLight}`, paddingTop: 16 }}>
          <div onClick={() => setShowStock(!showStock)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
            <Warehouse size={16} color={colors.info} />
            <span style={{ fontSize: 13, fontWeight: 600, color: colors.text, flex: 1 }}>{t("producer.stockQuality")}</span>
            {showStock ? <CaretUp size={14} color={colors.textMuted} /> : <CaretDown size={14} color={colors.textMuted} />}
          </div>
          {showStock && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px", marginTop: 12 }}>
              {[
                ["Humidité (%)", "moisture"], ["Impuretés (%)", "impurities"],
                ["Défauts (%)", "defects"], ["Poids net", "netWeight"],
                ["Poids brut", "grossWeight"], ["Emballage", "packaging"],
                ["Date emballage", "packagingDate"], ["Lieu stockage", "storageLocation"],
                ["Conditions stockage", "storageConditions"],
              ].map(([label, key]) => (
                <div key={key}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: colors.textSecondary, display: "block", marginBottom: 4 }}>{label}</label>
                  <input type="text" value={stockQuality[key as keyof LotStockQuality] ?? ""}
                    onChange={(e) => handleStockChange(key as keyof LotStockQuality, e.target.value)}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${colors.border}`,
                      background: colors.surface, color: colors.text, fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 14,
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lab Results Section */}
        <div style={{ marginTop: 16, borderTop: `1px solid ${colors.borderLight}`, paddingTop: 16 }}>
          <div onClick={() => setShowLab(!showLab)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
            <Flask size={16} color={colors.accent} />
            <span style={{ fontSize: 13, fontWeight: 600, color: colors.text, flex: 1 }}>{t("producer.labResults")}</span>
            {showLab ? <CaretUp size={14} color={colors.textMuted} /> : <CaretDown size={14} color={colors.textMuted} />}
          </div>
          {showLab && (
            <div style={{ marginTop: 12 }}>
              {labResults.map((entry, idx) => (
                <div key={idx} style={{
                  background: colors.surfaceHover, borderRadius: 8, padding: 12, marginBottom: 10,
                  border: `1px solid ${colors.borderLight}`, position: "relative",
                }}>
                  <div onClick={() => removeLabEntry(idx)} style={{ position: "absolute", top: 8, right: 8, cursor: "pointer", color: colors.error }}>
                    <Trash size={14} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                    {[
                      ["Type analyse", "type"], ["Paramètre", "parameter"],
                      ["Résultat", "result"], ["Méthode", "method"],
                      ["Date", "date"], ["Laboratoire", "laboratory"],
                    ].map(([label, key]) => (
                      <div key={key}>
                        <label style={{ fontSize: 10, fontWeight: 600, color: colors.textSecondary, display: "block", marginBottom: 2 }}>{label}</label>
                        <input type="text" value={entry[key as keyof LabResultEntry]}
                          onChange={(e) => updateLabEntry(idx, key as keyof LabResultEntry, e.target.value)}
                          style={{
                            width: "100%", padding: "8px 10px", borderRadius: 6, border: `1px solid ${colors.border}`,
                            background: colors.surface, color: colors.text, fontSize: 12, outline: "none", boxSizing: "border-box", marginBottom: 8,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={addLabEntry} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                borderRadius: 8, border: `1px dashed ${colors.accent}`, background: "transparent",
                color: colors.accent, fontSize: 12, fontWeight: 500, cursor: "pointer", width: "100%", justifyContent: "center",
              }}>
                <PlusCircle size={14} /> {t("producer.addLabResult")}
              </button>
            </div>
          )}
        </div>

        {/* Images Section — File Upload */}
        <div style={{ marginTop: 16, borderTop: `1px solid ${colors.borderLight}`, paddingTop: 16 }}>
          <div onClick={() => setShowImages(!showImages)} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
            <ImageIcon size={16} color={colors.warning} />
            <span style={{ fontSize: 13, fontWeight: 600, color: colors.text, flex: 1 }}>{t("producer.images")}</span>
            <span style={{ fontSize: 10, color: colors.textMuted }}>{images.length}/10</span>
            {showImages ? <CaretUp size={14} color={colors.textMuted} /> : <CaretDown size={14} color={colors.textMuted} />}
          </div>
          {showImages && (
            <div style={{ marginTop: 12 }}>
              {images.length === 0 && (
                <div style={{ textAlign: "center", padding: "20px 0", color: colors.textMuted, fontSize: 11 }}>
                  {t("producer.noImages")}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                {images.map((entry, idx) => (
                  <div key={idx} style={{
                    background: colors.surface, borderRadius: 10, overflow: "hidden",
                    border: `1px solid ${colors.borderLight}`, position: "relative",
                    aspectRatio: "4/3",
                  }}>
                    {entry.url ? (
                      <img src={entry.url} alt={entry.caption}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: colors.surfaceHover }}>
                        <ImageIcon size={24} color={colors.textMuted} />
                      </div>
                    )}
                    <div onClick={() => removeImageEntry(idx)} style={{
                      position: "absolute", top: 4, right: 4, width: 24, height: 24,
                      borderRadius: 6, background: "rgba(0,0,0,0.5)", border: "none",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff",
                    }}>
                      <X size={12} weight="bold" />
                    </div>
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "4px 6px",
                      background: "linear-gradient(transparent, rgba(0,0,0,0.6))",
                    }}>
                      <input type="text" value={entry.caption}
                        onChange={(e) => updateImageEntry(idx, "caption", e.target.value)}
                        placeholder="Légende"
                        style={{
                          width: "100%", padding: "4px 6px", borderRadius: 4, border: "none",
                          background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 10,
                          outline: "none", boxSizing: "border-box", marginBottom: 2,
                        }}
                      />
                      <select value={entry.type}
                        onChange={(e) => updateImageEntry(idx, "type", e.target.value)}
                        style={{
                          width: "100%", padding: "2px 4px", borderRadius: 3, border: "none",
                          background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 9,
                          outline: "none",
                        }}
                      >
                        {["product", "field", "harvest", "certification", "lab"].map((opt) => (
                          <option key={opt} value={opt} style={{ color: "#000" }}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
              {images.length < 10 && (
                <label style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "10px 14px",
                  borderRadius: 8, border: `1.5px dashed ${colors.warning}`, background: `${colors.warning}06`,
                  color: colors.warning, fontSize: 12, fontWeight: 500, cursor: "pointer",
                  width: "100%", justifyContent: "center", marginTop: 10, transition: "background 0.15s",
                }}
                  onMouseEnter={e => e.currentTarget.style.background = `${colors.warning}10`}
                  onMouseLeave={e => e.currentTarget.style.background = `${colors.warning}06`}
                >
                  <Camera size={16} />
                  {t("producer.addImage")}
                  <input type="file" accept="image/*" multiple
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files) return;
                      const remaining = 10 - images.length;
                      const toProcess = Math.min(files.length, remaining);
                      for (let i = 0; i < toProcess; i++) {
                        const file = files[i];
                        if (!file.type.startsWith("image/")) continue;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const dataUrl = ev.target?.result as string;
                          setImages((prev) => [...prev, { url: dataUrl, caption: "", type: "product" }]);
                        };
                        reader.readAsDataURL(file);
                      }
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>
          )}
        </div>

        <div style={{ marginTop: 24, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={() => navigate("/producer/lots")}
            style={{
              padding: "10px 20px", borderRadius: 8, border: `1px solid ${colors.border}`,
              background: "transparent", color: colors.text, fontSize: 13, fontWeight: 500, cursor: "pointer",
            }}>
            {t("common.cancel")}
          </button>
          <button onClick={handleSubmit} disabled={saving}
            style={{
              padding: "10px 20px", borderRadius: 8, border: "none",
              background: !form.culture || !form.quantite || !form.prix ? colors.textMuted : colors.accent,
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: !form.culture || !form.quantite || !form.prix ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 6, opacity: saving ? 0.7 : 1,
            }}>
            <FloppyDisk size={14} weight="bold" />
            {saving ? t("common.sending") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
