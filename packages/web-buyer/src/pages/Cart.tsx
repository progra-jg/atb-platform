import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useIsMobile } from "../hooks/useMediaQuery";
import { PaymentProvider, usePayment, PaymentStep } from "../context/PaymentContext";
import FadeIn from "../components/FadeIn";
import Breadcrumb from "../components/Breadcrumb";
import EmptyState from "../components/EmptyState";
import Badge from "../components/Badge";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import PaymentModal from "../components/PaymentModal";
import { ShoppingCart, Trash, MapPin, ArrowRight, Package, SealCheck, Star, Plus, Minus, MapPinLine, ShieldCheck, Cube } from "@phosphor-icons/react";
import api from "../services/api";
import { fetchVerificationPoints } from "../services/verification";
import { sanitizeAddress, validateNumber, generateNonce } from "../utils/security";
import { getBuyerId } from "../utils/buyer";
import { tCrop } from "../utils/i18n";
import { formatNumber } from "../utils/format";
import type { VerificationPoint } from "../types";

function CartContent() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  const { items, removeItem, updateQuantity, clearCart, total, count, selectedPoint, setSelectedPoint, transportOption, setTransportOption, inspectionFee, escrowTotal, nonce } = useCart();
  const { user } = useAuth();
  const { state, openPayment } = usePayment();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const handledRef = useRef(false);
  const buyerId = getBuyerId();
  const [points, setPoints] = useState<VerificationPoint[]>([]);
  const [pointsLoading, setPointsLoading] = useState(true);
  const [address, setAddress] = useState({
    rue: "", ville: "", region: "", pays: t("cart.countryDefault"), phone: user?.phone || "",
  });
  const [orderNonce] = useState(() => generateNonce());

  useEffect(() => {
    fetchVerificationPoints().then((data) => {
      setPoints(data);
      setPointsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (user?.address) {
      try {
        const parsed = typeof user.address === "string" ? JSON.parse(user.address) : user.address;
        if (parsed?.rue) setAddress((prev) => ({ ...prev, ...parsed }));
      } catch { }
    }
    if (user?.phone) setAddress((prev) => ({ ...prev, phone: user.phone || "" }));
  }, [user]);

  useEffect(() => {
    if (state.step === PaymentStep.SUCCESS && !handledRef.current) {
      handledRef.current = true;
      clearCart();
      setDone(true);
      setTimeout(() => navigate("/orders"), 2000);
    }
  }, [state.step, clearCart, navigate]);

  useEffect(() => {
    if (state.step === PaymentStep.SUCCESS) return;
    handledRef.current = false;
  }, [state.step]);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!address.rue || !address.ville || !address.phone) return;
    if (!selectedPoint) return;
    setSubmitting(true);
    try {
      const orderItems = items.map((i) => ({
        lotId: i.lotId, culture: i.culture,
        quantite: `${i.quantiteChoisie} × ${i.quantite}`,
        prixUnitaire: `${formatNumber(validateNumber(i.prix))} ${t("common.currency")}`,
        prix: validateNumber(i.prix) * Math.max(1, validateNumber(i.quantiteChoisie, 1)),
      }));
      const totalAmount = items.reduce((s, i) => s + validateNumber(i.prix) * Math.max(1, validateNumber(i.quantiteChoisie, 1)), 0);
      const escrowDeposit = totalAmount + selectedPoint.inspectionFeeFcfa;
      const { data } = await api.post("/orders", {
        items: orderItems, status: "En attente", total: totalAmount,
        buyerId, producteurId: items[0].producteurId,
        verificationPointId: selectedPoint.id,
        verificationPointName: selectedPoint.name,
        transportOption,
        deliveryAddress: {
          rue: sanitizeAddress(address.rue),
          ville: sanitizeAddress(address.ville),
          region: sanitizeAddress(address.region),
          pays: sanitizeAddress(address.pays),
          phone: sanitizeAddress(address.phone),
        },
        inspectionFee: selectedPoint.inspectionFeeFcfa,
        escrowTotal: escrowDeposit,
        nonce: orderNonce,
      });
      const orderId = data?.id || `CMD-${Date.now().toString(36).toUpperCase()}`;
      setSubmitting(false);
      openPayment({
        amount: escrowDeposit, orderId,
        lotId: items[0]?.lotId, producteurId: items[0]?.producteurId,
        items: items.map(i => ({ name: i.culture, quantity: Math.max(1, validateNumber(i.quantiteChoisie, 1)), price: validateNumber(i.prix) * Math.max(1, validateNumber(i.quantiteChoisie, 1)) })),
      });
    } catch {
      const orderId = `CMD-${Date.now().toString(36).toUpperCase()}`;
      const totalAmount = items.reduce((s, i) => s + validateNumber(i.prix) * Math.max(1, validateNumber(i.quantiteChoisie, 1)), 0);
      const escrowDeposit = totalAmount + (selectedPoint?.inspectionFeeFcfa || 0);
      setSubmitting(false);
      openPayment({
        amount: escrowDeposit, orderId,
        lotId: items[0]?.lotId, producteurId: items[0]?.producteurId,
        items: items.map(i => ({ name: i.culture, quantity: Math.max(1, validateNumber(i.quantiteChoisie, 1)), price: validateNumber(i.prix) * Math.max(1, validateNumber(i.quantiteChoisie, 1)) })),
      });
    }
  };

  if (done) {
    return (
      <FadeIn delay={0.05}>
        <div style={{ textAlign: "center", padding: "100px 20px" }}>
          <div style={{
            width: 80, height: 80, borderRadius: 24,
            background: colors.accentLight,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
            animation: "scaleInCenter 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}>
            <SealCheck size={40} color={colors.accent} weight="fill" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: colors.text, marginBottom: 8, letterSpacing: "-0.3px" }}>{t("cart.sent")}</div>
          <div style={{ fontSize: 14, color: colors.textMuted }}>{t("cart.redirect")}</div>
        </div>
      </FadeIn>
    );
  }

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 10, fontSize: 13,
    border: `1.5px solid ${colors.borderLight}`, outline: "none",
    background: colors.inputBg, color: colors.text,
    boxSizing: "border-box" as const, transition: "border-color 0.15s",
  };

  const selectStyle = {
    ...inputStyle, cursor: "pointer" as const,
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat" as const, backgroundPosition: "right 14px center",
  };

  const canCheckout = items.length > 0 && address.rue && address.ville && address.phone && !!selectedPoint;

  return (
    <FadeIn delay={0.05}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <Breadcrumb crumbs={[
          { label: t("nav.dashboard"), path: "/dashboard" },
          { label: t("cart.title") },
        ]} />

        {items.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart size={24} />}
            title={t("cart.empty")}
            description={t("cart.emptyDesc")}
            action={{ label: t("cart.viewLots"), onClick: () => navigate("/lots") }}
          />
        ) : (
          <>
            <div style={{
              display: "flex", gap: isMobile ? 8 : 16,
              marginBottom: isMobile ? 16 : 20,
              padding: isMobile ? "10px 14px" : "14px 20px",
              background: colors.surface,
              borderRadius: 16,
              border: `1px solid ${colors.borderLight}`,
              boxShadow: colors.shadowSm,
            }}>
              {[
                { label: t("orders.stats.total"), value: count, color: colors.text },
                { label: t("cart.totalValue"), value: `${formatNumber(total)} ${t("common.currency")}`, color: colors.accent },
                { label: t("cart.origins"), value: new Set(items.map(i => i.origine)).size.toString(), color: colors.text },
              ].map((stat, idx) => (
                <div key={idx} style={{ flex: 1, textAlign: "center", borderRight: idx < 2 ? `1px solid ${colors.borderLight}` : "none", paddingRight: idx < 2 ? (isMobile ? 8 : 16) : 0 }}>
                  <div style={{ fontSize: isMobile ? 16 : 22, fontWeight: 700, color: stat.color, letterSpacing: "-0.3px" }}>{stat.value}</div>
                  <div style={{ fontSize: isMobile ? 9 : 11, color: colors.textMuted, marginTop: 2 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {items.map((item, idx) => (
                <Card key={item.lotId} variant="premium" padding={isMobile ? "14px 16px" : "16px 20px"}
                  style={{ animation: "fadeSlideUp 0.35s ease both", animationDelay: `${idx * 0.05}s` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ flex: 1, display: "grid", gap: 10, gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)" }}>
                      <div>
                        <div style={{ fontSize: 9, color: colors.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.8px" }}>{t("cart.culture")}</div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: colors.text, display: "flex", alignItems: "center", gap: 4 }}>
                          <Star size={12} color={colors.accent} weight="fill" /> {tCrop(item.culture)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: colors.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.8px" }}>{t("cart.origin")}</div>
                        <div style={{ fontWeight: 500, fontSize: 13, color: colors.text, display: "flex", alignItems: "center", gap: 3 }}>
                          <MapPin size={11} color={colors.textMuted} /> {item.origine}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: colors.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.8px" }}>{t("cart.qty")}</div>
                        <div style={{ fontWeight: 500, fontSize: 13, color: colors.text }}>{item.quantite}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 9, color: colors.textMuted, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.8px" }}>{t("cart.price")}</div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: colors.accent }}>
                          {formatNumber(validateNumber(item.prix) * Math.max(1, validateNumber(item.quantiteChoisie, 1)))} {t("common.currency")}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <Badge text={item.certification} variant={item.certification === "Bio" ? "success" : "info"} size="sm" />
                      <button onClick={() => removeItem(item.lotId)}
                        style={{
                          width: 34, height: 34, borderRadius: 10,
                          background: colors.errorLight, border: "none",
                          cursor: "pointer", display: "flex",
                          alignItems: "center", justifyContent: "center",
                          color: colors.error, flexShrink: 0,
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = colors.error; e.currentTarget.style.color = "#fff"; e.currentTarget.style.transform = "scale(1.05)" }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = colors.errorLight; e.currentTarget.style.color = colors.error; e.currentTarget.style.transform = "scale(1)" }}>
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${colors.borderLight}` }}>
                    <span style={{ fontSize: 12, color: colors.textMuted }}>{t("cart.qty")} :</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button onClick={() => updateQuantity(item.lotId, -1)}
                        disabled={item.quantiteChoisie <= 1}
                        style={{
                          width: 30, height: 30, borderRadius: 8,
                          border: `1.5px solid ${colors.borderLight}`,
                          background: colors.inputBg, color: colors.text,
                          cursor: item.quantiteChoisie <= 1 ? "not-allowed" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          opacity: item.quantiteChoisie <= 1 ? 0.4 : 1,
                          transition: "all 0.15s",
                        }}>
                        <Minus size={12} weight="bold" />
                      </button>
                      <span style={{
                        minWidth: 32, textAlign: "center", fontWeight: 700,
                        fontSize: 15, color: colors.text,
                      }}>{item.quantiteChoisie}</span>
                      <button onClick={() => updateQuantity(item.lotId, 1)}
                        style={{
                          width: 30, height: 30, borderRadius: 8,
                          border: `1.5px solid ${colors.borderLight}`,
                          background: colors.inputBg, color: colors.text,
                          cursor: "pointer", display: "flex",
                          alignItems: "center", justifyContent: "center",
                          transition: "all 0.15s",
                        }}>
                        <Plus size={12} weight="bold" />
                      </button>
                    </div>
                    <span style={{ fontSize: 11, color: colors.textMuted, marginLeft: "auto" }}>
                      {formatNumber(validateNumber(item.prix))} {t("common.currency")} / {t("cart.unit")}
                    </span>
                  </div>
                </Card>
              ))}
            </div>

            {/* Verification Point Selection */}
            <div style={{
              marginTop: 20, padding: isMobile ? "16px" : "24px",
              background: colors.surface, borderRadius: 16,
              border: `1.5px solid ${colors.borderLight}`,
              boxShadow: colors.shadowMd,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <ShieldCheck size={18} color={colors.accent} weight="fill" />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: colors.text }}>{t("cart.verificationPoint")}</h3>
              </div>
              <p style={{ fontSize: 12, color: colors.textSecondary, margin: "0 0 12px", lineHeight: 1.5 }}>
                {t("cart.pointInfo")}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: colors.textMuted, marginBottom: 4 }}>{t("cart.selectPoint")} *</label>
                  <select value={selectedPoint?.id || ""} onChange={(e) => {
                    const p = points.find((pt) => pt.id === e.target.value);
                    setSelectedPoint(p || null);
                  }}
                    style={selectStyle}
                    disabled={pointsLoading}>
                    <option value="">{pointsLoading ? t("common.loading") : "—"}</option>
                    {points.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} — {p.ville}, {p.region}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: colors.textMuted, marginBottom: 4 }}>{t("cart.transportOption")}</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setTransportOption("hub")}
                      style={{
                        flex: 1, padding: "10px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                        border: `1.5px solid ${transportOption === "hub" ? colors.accent : colors.borderLight}`,
                        background: transportOption === "hub" ? colors.accentLight : colors.inputBg,
                        color: transportOption === "hub" ? colors.accent : colors.text,
                        cursor: "pointer", transition: "all 0.15s",
                      }}>
                      {t("cart.transportHub")}
                    </button>
                    <button onClick={() => setTransportOption("door")}
                      style={{
                        flex: 1, padding: "10px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                        border: `1.5px solid ${transportOption === "door" ? colors.accent : colors.borderLight}`,
                        background: transportOption === "door" ? colors.accentLight : colors.inputBg,
                        color: transportOption === "door" ? colors.accent : colors.text,
                        cursor: "pointer", transition: "all 0.15s",
                      }}>
                      {t("cart.transportDoor")}
                    </button>
                  </div>
                </div>
              </div>
              {selectedPoint && (
                <div style={{
                  marginTop: 12, padding: "12px 16px", borderRadius: 10,
                  background: colors.statBg, fontSize: 12, color: colors.textSecondary,
                  display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 8,
                }}>
                  <div><strong style={{ color: colors.text }}>{t("orders.verification.address")} :</strong> {selectedPoint.ville}, {selectedPoint.region}</div>
                  <div><strong style={{ color: colors.text }}>{t("orders.verification.contact")} :</strong> {selectedPoint.contact}</div>
                  <div><strong style={{ color: colors.text }}>{t("orders.verification.capacity")} :</strong> {selectedPoint.capacityTonnes} t</div>
                </div>
              )}
            </div>

            {/* Delivery Address (shown only for door delivery) */}
            {transportOption === "door" && (
              <div style={{
                marginTop: 16, padding: isMobile ? "16px" : "24px",
                background: colors.surface, borderRadius: 16,
                border: `1.5px solid ${colors.borderLight}`,
                boxShadow: colors.shadowMd,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <MapPinLine size={18} color={colors.accent} weight="fill" />
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: colors.text }}>{t("cart.deliveryAddress")}</h3>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: colors.textMuted, marginBottom: 4 }}>{t("cart.street")} *</label>
                    <input type="text" value={address.rue} onChange={(e) => setAddress({ ...address, rue: e.target.value })}
                      placeholder={t("cart.streetPlaceholder")}
                      style={inputStyle}
                      onFocus={(e) => e.currentTarget.style.borderColor = colors.accent}
                      onBlur={(e) => e.currentTarget.style.borderColor = colors.borderLight} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: colors.textMuted, marginBottom: 4 }}>{t("cart.city")} *</label>
                    <select value={address.ville} onChange={(e) => setAddress({ ...address, ville: e.target.value })}
                      style={selectStyle}>
                      <option value="">—</option>
                      <option value="Cotonou">{t("cart.cities.cotonou")}</option>
                      <option value="Porto-Novo">{t("cart.cities.portoNovo")}</option>
                      <option value="Parakou">{t("cart.cities.parakou")}</option>
                      <option value="Abomey-Calavi">{t("cart.cities.abomeyCalavi")}</option>
                      <option value="Bohicon">{t("cart.cities.bohicon")}</option>
                      <option value="Lokossa">{t("cart.cities.lokossa")}</option>
                      <option value="Natitingou">{t("cart.cities.natitingou")}</option>
                      <option value="Sakété">{t("cart.cities.sakhété")}</option>
                      <option value="Kandi">{t("cart.cities.kandi")}</option>
                      <option value="Allada">{t("cart.cities.allada")}</option>
                      <option value="Grand-Popo">{t("cart.cities.grandPopo")}</option>
                      <option value="Ouidah">{t("cart.cities.ouidah")}</option>
                      <option value="Malanville">{t("cart.cities.malanville")}</option>
                      <option value="Djougou">{t("cart.cities.djougou")}</option>
                      <option value="Dassa-Zoumé">{t("cart.cities.dassa")}</option>
                      <option value="Savalou">{t("cart.cities.savalou")}</option>
                      <option value="Comè">{t("cart.cities.come")}</option>
                      <option value="Bembéréké">{t("cart.cities.bembereke")}</option>
                      <option value="Bassila">{t("cart.cities.bassila")}</option>
                      <option value="Kétou">{t("cart.cities.ketou")}</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: colors.textMuted, marginBottom: 4 }}>{t("cart.region")}</label>
                    <select value={address.region} onChange={(e) => setAddress({ ...address, region: e.target.value })}
                      style={selectStyle}>
                      <option value="">—</option>
                      <option value="Littoral">{t("cart.regions.littoral")}</option>
                      <option value="Ouémé">{t("cart.regions.oueme")}</option>
                      <option value="Zou">{t("cart.regions.zou")}</option>
                      <option value="Borgou">{t("cart.regions.borgou")}</option>
                      <option value="Mono">{t("cart.regions.mono")}</option>
                      <option value="Atlantique">{t("cart.regions.atlantique")}</option>
                      <option value="Atacora">{t("cart.regions.atacora")}</option>
                      <option value="Plateau">{t("cart.regions.plateau")}</option>
                      <option value="Alibori">{t("cart.regions.alibori")}</option>
                      <option value="Donga">{t("cart.regions.donga")}</option>
                      <option value="Collines">{t("cart.regions.collines")}</option>
                      <option value="Couffo">{t("cart.regions.couffo")}</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: colors.textMuted, marginBottom: 4 }}>{t("cart.phone")} *</label>
                    <input type="tel" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      placeholder={t("cart.phonePlaceholder")}
                      style={inputStyle}
                      onFocus={(e) => e.currentTarget.style.borderColor = colors.accent}
                      onBlur={(e) => e.currentTarget.style.borderColor = colors.borderLight} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: colors.textMuted, marginBottom: 4 }}>{t("cart.country")} *</label>
                    <select value={address.pays} onChange={(e) => setAddress({ ...address, pays: e.target.value })}
                      style={{
                        ...inputStyle, cursor: "pointer",
                        appearance: "none",
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center",
                      }}>
                      <option value="Bénin">{t("cart.countries.benin")}</option>
                      <option value="Côte d'Ivoire">{t("cart.countries.coteIvoire")}</option>
                      <option value="Togo">{t("cart.countries.togo")}</option>
                      <option value="Burkina Faso">{t("cart.countries.burkinaFaso")}</option>
                      <option value="Niger">{t("cart.countries.niger")}</option>
                      <option value="Sénégal">{t("cart.countries.senegal")}</option>
                      <option value="Mali">{t("cart.countries.mali")}</option>
                      <option value="Guinée">{t("cart.countries.guinee")}</option>
                      <option value="Ghana">{t("cart.countries.ghana")}</option>
                      <option value="Nigeria">{t("cart.countries.nigeria")}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Escrow Summary + Checkout */}
            <div style={{
              marginTop: 16,
              background: colors.surface,
              borderRadius: 16,
              padding: isMobile ? "16px" : "20px 24px",
              border: `1.5px solid ${colors.borderLight}`,
              boxShadow: colors.shadowLg,
              position: "sticky", bottom: 16,
              backdropFilter: colors.glassBlur,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <Cube size={14} color={colors.accent} />
                <span style={{ fontSize: 11, color: colors.textSecondary }}>{t("cart.depositDesc")}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "baseline" }}>
                    <div>
                      <span style={{ fontSize: 11, color: colors.textMuted }}>{t("common.total")} </span>
                      <span style={{ fontWeight: 700, fontSize: isMobile ? 18 : 22, color: colors.text, letterSpacing: "-0.5px" }}>
                        {formatNumber(total)} {t("common.currency")}
                      </span>
                    </div>
                    {inspectionFee > 0 && (
                      <div>
                        <span style={{ fontSize: 10, color: colors.textMuted }}>{t("cart.inspectionFee")} </span>
                        <span style={{ fontWeight: 600, fontSize: 13, color: colors.textSecondary }}>
                          {formatNumber(inspectionFee)} {t("common.currency")}
                        </span>
                      </div>
                    )}
                    <div style={{ paddingLeft: 12, borderLeft: `1px solid ${colors.borderLight}` }}>
                      <span style={{ fontSize: 11, color: colors.accent, fontWeight: 600 }}>{t("cart.deposit")} </span>
                      <span style={{ fontWeight: 700, fontSize: isMobile ? 18 : 24, color: colors.accent, letterSpacing: "-0.5px" }}>
                        {formatNumber(escrowTotal)} {t("common.currency")}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button variant="secondary" size="md" icon={<Trash size={14} />} onClick={clearCart}>
                    {t("common.clearCart")}
                  </Button>
                  <Button variant="premium" size="md" icon={<ArrowRight size={16} />}
                    onClick={handleCheckout} loading={submitting}
                    disabled={!canCheckout}
                    style={!canCheckout ? { opacity: 0.5, cursor: "not-allowed" } : {}}>
                    {submitting ? t("cart.sending") : t("common.orderNow")}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <PaymentModal />
    </FadeIn>
  );
}

export default function Cart() {
  return (
    <PaymentProvider>
      <CartContent />
    </PaymentProvider>
  );
}
