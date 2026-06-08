import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Package, ArrowLeft, PencilSimple, Copy, Trash, ArrowRight,
  MapPin, CalendarBlank, CheckCircle, Flask, Warehouse, Image as ImageIcon, X,
} from "@phosphor-icons/react";
import { useTheme } from "../../context/ThemeContext";
import { getFarmerLotById, deleteFarmerLot, createFarmerLot } from "../../services/farmerLots";
import { fetchLotById } from "../../services/lots";
import { formatNumber } from "../../utils/format";
import Badge from "../../components/Badge";
import type { Lot } from "../../types";

export default function ProducerLotDetail() {
  const { id: lotId } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [lot, setLot] = useState<Lot | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const safeId = lotId || "";

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const farmerLot = getFarmerLotById(safeId);
      if (farmerLot) {
        if (!cancelled) { setLot(farmerLot); setLoading(false); }
        return;
      }
      const apiResult = await fetchLotById(safeId);
      if (apiResult?.lot && !cancelled) {
        setLot(apiResult.lot);
      }
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [safeId]);

  const handleDelete = () => {
    if (!window.confirm(t("common.confirmDelete"))) return;
    deleteFarmerLot(safeId);
    navigate("/producer/lots", { replace: true });
  };

  const handleDuplicate = () => {
    if (!lot) return;
    createFarmerLot({ ...lot, id: undefined as any });
    navigate("/producer/lots");
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 20px", textAlign: "center", color: colors.textMuted, fontSize: 13 }}>
        {t("common.loading")}
      </div>
    );
  }

  if (!lot) {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 20px", textAlign: "center", color: colors.textMuted, fontSize: 13 }}>
        <Package size={48} color={colors.textMuted} />
        <p>{t("common.notFound")}</p>
      </div>
    );
  }

  const statusVariant = lot.statut === "Disponible" ? "success" as const : lot.statut === "En transit" ? "warning" as const : "error" as const;

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 20px 60px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div onClick={() => navigate("/producer/lots")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: colors.textSecondary, fontSize: 12 }}>
          <ArrowLeft size={14} />
          <span>{t("common.back")}</span>
        </div>
        <div style={{ flex: 1 }} />
        <div onClick={handleDuplicate} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: colors.accent, fontSize: 11 }}>
          <Copy size={12} />
          <span>{t("common.duplicate")}</span>
        </div>
        <div onClick={() => navigate(`/producer/lots/${lot.id}/edit`)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: colors.info, fontSize: 11 }}>
          <PencilSimple size={12} />
          <span>{t("producer.edit")}</span>
        </div>
        <div onClick={handleDelete} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: colors.error, fontSize: 11 }}>
          <Trash size={12} />
          <span>{t("common.delete")}</span>
        </div>
      </div>

      <div style={{ background: colors.surface, borderRadius: 14, border: `1px solid ${colors.borderLight}`, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.text }}>{lot.culture}</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, fontSize: 11, color: colors.textMuted }}>
              <span>{lot.id}</span>
              <span>&middot;</span>
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}><CalendarBlank size={11} />{lot.date}</span>
            </div>
          </div>
          <Badge text={t("lotStatus." + lot.statut, lot.statut)} variant={statusVariant} pill />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 20px", padding: "14px 0", borderTop: `1px solid ${colors.borderLight}`, borderBottom: `1px solid ${colors.borderLight}` }}>
          {[
            { label: t("lots.fields.origin"), value: lot.origine || "—" },
            { label: t("lots.fields.region"), value: lot.region || "—", icon: MapPin },
            { label: t("lots.fields.volume"), value: lot.quantite },
            { label: t("lots.fields.price"), value: `${formatNumber(lot.prix)} FCFA/kg` },
            { label: t("lots.fields.certification"), value: lot.certification || "—" },
            { label: t("lots.fields.farmer"), value: lot.producteur },
            { label: t("lots.fields.note"), value: `${lot.note}/100` },
            { label: t("common.phone"), value: lot.phone || "—" },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label}>
              <div style={{ fontSize: 10, fontWeight: 600, color: colors.textSecondary, marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 500, color: colors.text, display: "flex", alignItems: "center", gap: 4 }}>
                {Icon && <Icon size={12} color={colors.textMuted} />}
                {value}
              </div>
            </div>
          ))}
        </div>

        {lot.stockQuality && Object.keys(lot.stockQuality).length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <Warehouse size={14} color={colors.info} />
              <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{t("producer.stockQuality")}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {Object.entries(lot.stockQuality).filter(([, v]) => v).map(([key, value]) => (
                <div key={key} style={{ background: colors.surfaceHover, borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: colors.textSecondary, textTransform: "capitalize" }}>{key.replace(/([A-Z])/g, " $1")}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: colors.text, marginTop: 2 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {lot.labResults && lot.labResults.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <Flask size={14} color={colors.accent} />
              <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{t("producer.labResults")}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {lot.labResults.map((r) => (
                <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: colors.surfaceHover, borderRadius: 8, padding: "8px 12px" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: colors.text }}>{r.parameter}</div>
                    <div style={{ fontSize: 10, color: colors.textMuted }}>{r.method} — {r.laboratory}</div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: colors.accent }}>{r.result}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {lot.images && lot.images.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <ImageIcon size={14} color={colors.warning} />
              <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{t("producer.images")}</span>
              <span style={{ fontSize: 10, color: colors.textMuted }}>({lot.images.length})</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
              {lot.images.map((img, idx) => (
                <div key={img.id} onClick={() => setLightboxIdx(idx)} style={{
                  aspectRatio: "4/3", borderRadius: 10, overflow: "hidden",
                  background: colors.surfaceHover, border: `1px solid ${colors.borderLight}`,
                  cursor: "pointer", position: "relative",
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.12)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  {img.url ? (
                    <img src={img.url} alt={img.caption} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ImageIcon size={28} color={colors.textMuted} />
                    </div>
                  )}
                  {img.caption && (
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0,
                      padding: "4px 6px", fontSize: 9, color: "#fff",
                      background: "linear-gradient(transparent, rgba(0,0,0,0.6))",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {img.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lightbox */}
        {lightboxIdx !== null && lot.images && lot.images[lightboxIdx] && (
          <div onClick={() => setLightboxIdx(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 9999,
              background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 24,
            }}
          >
            <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", maxWidth: 800, width: "100%" }}>
              <img src={lot.images[lightboxIdx].url} alt={lot.images[lightboxIdx].caption}
                style={{ width: "100%", borderRadius: 12, display: "block" }}
              />
              {lot.images[lightboxIdx].caption && (
                <p style={{ color: "#fff", textAlign: "center", fontSize: 13, marginTop: 8, opacity: 0.8 }}>
                  {lot.images[lightboxIdx].caption}
                </p>
              )}
              <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 12 }}>
                <button onClick={() => setLightboxIdx((lightboxIdx + 1) % lot.images!.length)}
                  style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: "8px 16px", color: "#fff", cursor: "pointer", fontSize: 12 }}
                >
                  {t("common.next")}
                </button>
                <button onClick={() => setLightboxIdx((lightboxIdx - 1 + lot.images!.length) % lot.images!.length)}
                  style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, padding: "8px 16px", color: "#fff", cursor: "pointer", fontSize: 12 }}
                >
                  {t("common.previous")}
                </button>
              </div>
            </div>
            <button onClick={() => setLightboxIdx(null)}
              style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 10, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}
            >
              <X size={20} />
            </button>
          </div>
        )}

        <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
          <button onClick={() => navigate(`/producer/lots/${lot.id}/edit`)}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 8, border: "none",
              background: colors.accent, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
            <PencilSimple size={14} />
            {t("producer.edit")}
          </button>
          <button onClick={() => navigate("/producer/lots")}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${colors.border}`,
              background: "transparent", color: colors.text, fontSize: 13, fontWeight: 500, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
            {t("producer.myLots")}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
