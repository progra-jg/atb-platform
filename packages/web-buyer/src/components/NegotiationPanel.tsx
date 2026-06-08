import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PaperPlaneTilt, CheckCircle, XCircle, ArrowCounterClockwise,
  Handshake, Clock, SealCheck, X, CaretLeft, ArrowsLeftRight,
  CurrencyCircleDollar, Package, SpinnerGap, WarningCircle,
} from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { useIsMobile } from "../hooks/useMediaQuery";
import Button from "./ui/Button";
import { fadeIn, slideUp, scaleIn, staggerContainer, staggerItem } from "../lib/motion-variants";
import {
  fetchOffersByLot, createOffer, respondToOffer,
  counterOffer, withdrawOffer, simulateSellerResponse,
} from "../services/offers";
import type { Offer, OfferRequest, OfferStatus } from "../types/offer";
import { formatNumber, formatTime } from "../utils/format";

interface Props {
  lotId: string;
  sellerId: string;
  culture: string;
  lotQuantity: string;
  lotPrice: number;
  lotOrigin: string;
}

const STATUS_CFG: Record<OfferStatus, { labelKey: string; color: string; bg: string; icon: React.ElementType }> = {
  pending:     { labelKey: "detail.offerPending",     color: "#d97706", bg: "#fffbeb", icon: Clock },
  accepted:    { labelKey: "detail.offerAccepted",    color: "#059669", bg: "#ecfdf5", icon: CheckCircle },
  rejected:    { labelKey: "detail.offerRejected",    color: "#dc2626", bg: "#fef2f2", icon: XCircle },
  countered:   { labelKey: "detail.offerInNegotiation", color: "#2563eb", bg: "#eff6ff", icon: ArrowsLeftRight },
  withdrawn:   { labelKey: "detail.offerWithdrawn",   color: "#6b7280", bg: "#f3f4f6", icon: X },
  expired:     { labelKey: "detail.offerWithdrawn",   color: "#6b7280", bg: "#f3f4f6", icon: WarningCircle },
};

function formatCurrency(n: number) {
  return `${formatNumber(n)} FCFA`;
}

function NegotiationModal({
  onClose,
  lotId,
  sellerId,
  culture,
  lotQuantity,
  lotPrice,
  lotOrigin,
}: Props & { onClose: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  const toast = useToast();
  const queryClient = useQueryClient();
  const modalRef = useRef<HTMLDivElement>(null);

  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState(String(lotPrice));
  const [message, setMessage] = useState("");

  const qtyNum = parseInt(quantity.replace(/\s/g, "")) || 0;
  const priceNum = parseFloat(price.replace(/\s/g, "")) || 0;
  const maxQty = parseInt(lotQuantity.replace(/\s/g, "").replace("kg", "")) || 0;
  const total = qtyNum * priceNum;

  const { data: offers = [], isLoading: loadingOffers } = useQuery({
    queryKey: ["offers", lotId],
    queryFn: () => fetchOffersByLot(lotId),
    refetchInterval: 5000,
  });

  const currentOffer = offers.length > 0 ? offers[offers.length - 1] : null;
  const hasActiveOffer = currentOffer && (currentOffer.status === "pending" || currentOffer.status === "countered");

  const createMut = useMutation({
    mutationFn: (body: OfferRequest) => createOffer(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers", lotId] });
      toast.success(t("detail.offerSent"));
    },
    onError: () => toast.error(t("common.apiUnavailable")),
  });

  const respondMut = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "accept" | "reject" }) => respondToOffer(id, action),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["offers", lotId] });
      if (data.status === "accepted") {
        toast.success(t("detail.offerContractCreated"));
      }
    },
    onError: () => toast.error(t("common.apiUnavailable")),
  });

  const counterMut = useMutation({
    mutationFn: ({ parentId, body }: { parentId: string; body: OfferRequest }) => counterOffer(parentId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers", lotId] });
      toast.success(t("detail.offerSent"));
    },
    onError: () => toast.error(t("common.apiUnavailable")),
  });

  const withdrawMut = useMutation({
    mutationFn: (id: string) => withdrawOffer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers", lotId] });
    },
    onError: () => toast.error(t("common.apiUnavailable")),
  });

  const handleSendOffer = () => {
    if (!quantity || !price) return;
    createMut.mutate({
      lotId, sellerId,
      quantity: `${formatNumber(qtyNum)} kg`,
      pricePerKg: priceNum,
      message,
    });
    setQuantity("");
    setPrice(String(lotPrice));
    setMessage("");
  };

  const handleCounter = () => {
    if (!currentOffer || !quantity || !price) return;
    counterMut.mutate({
      parentId: currentOffer.id,
      body: {
        lotId, sellerId,
        quantity: `${formatNumber(qtyNum)} kg`,
        pricePerKg: priceNum,
        message,
      },
    });
    setQuantity("");
    setPrice(String(lotPrice));
    setMessage("");
  };

  const handleSimulate = useCallback(async () => {
    if (!currentOffer) return;
    try {
      const simOffer = await simulateSellerResponse(currentOffer.id);
      queryClient.setQueryData(["offers", lotId], (old: Offer[] = []) => [...old, simOffer]);
      queryClient.invalidateQueries({ queryKey: ["offers", lotId] });
    } catch {
      toast.error(t("common.apiUnavailable"));
    }
  }, [currentOffer, lotId, queryClient, t, toast]);

  const qtyError = quantity && qtyNum > maxQty ? t("lots.fields.volume") + " > " + lotQuantity : null;
  const canSend = quantity && price && qtyNum > 0 && priceNum > 0 && !qtyError;

  const sortedOffers = useMemo(() => {
    const map = new Map<string, Offer>();
    for (const o of offers) map.set(o.id, o);
    const chain: Offer[] = [];
    let current: Offer | undefined = offers.find((o) => !o.parentOfferId);
    while (current) {
      chain.push(current);
      current = offers.find((o) => o.parentOfferId === current?.id);
    }
    return chain;
  }, [offers]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("detail.offerNegotiation")}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: isMobile ? 0 : 20,
      }}
    >
      <motion.div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        exit="hidden"
        style={{
          width: "100%",
          maxWidth: isMobile ? "100%" : 560,
          maxHeight: isMobile ? "100%" : "90vh",
          height: isMobile ? "100%" : "auto",
          background: colors.surface,
          borderRadius: isMobile ? 0 : 20,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: isMobile ? "none" : `0 25px 60px rgba(0,0,0,0.3), ${colors.shadowGlow}`,
          border: isMobile ? "none" : `1px solid ${colors.borderLight}`,
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: isMobile ? "16px 16px 12px" : "20px 24px 16px",
          borderBottom: `1px solid ${colors.borderLight}`,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isMobile && (
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: colors.text, padding: 2, display: "flex" }}>
                <CaretLeft size={20} />
              </button>
            )}
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, ${colors.accent}, #34d399)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Handshake size={18} weight="fill" color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: colors.text }}>{t("detail.offerNegotiation")}</div>
              <div style={{ fontSize: 11, color: colors.textMuted }}>{culture} · {lotOrigin}</div>
            </div>
          </div>
          {!isMobile && (
            <button onClick={onClose}
              style={{ background: colors.surfaceHover, border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: colors.textMuted, transition: "all 0.15s" }}>
              <X size={16} />
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: isMobile ? 16 : 24 }}>
          {loadingOffers && offers.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: colors.textMuted }}>
              <SpinnerGap size={24} style={{ animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
              <div style={{ fontSize: 13 }}>{t("common.loading")}</div>
            </div>
          ) : hasActiveOffer ? (
            /* Negotiation Thread */
            <div>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                marginBottom: 20, padding: "10px 14px",
                background: STATUS_CFG[currentOffer!.status].bg,
                borderRadius: 10, fontSize: 12, fontWeight: 600,
                color: STATUS_CFG[currentOffer!.status].color,
              }}>
                {React.createElement(STATUS_CFG[currentOffer!.status].icon, { size: 16, weight: "fill" })}
                {t(STATUS_CFG[currentOffer!.status].labelKey)}
                {offers.length > 0 && (
                  <span style={{ marginLeft: "auto", fontSize: 10, opacity: 0.7 }}>
                    {offers.length} offre{offers.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Offer History */}
              <div style={{ marginBottom: 20 }}>
                {sortedOffers.map((offer, idx) => {
                  const isBuyer = offer.buyerName === "Vous";
                  const statusIcon = React.createElement(STATUS_CFG[offer.status]?.icon || Clock, { size: 14, weight: "fill" });
                  return (
                    <motion.div
                      key={offer.id}
                      variants={slideUp}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: idx * 0.06 }}
                      style={{
                        display: "flex", gap: 10, marginBottom: 14,
                        flexDirection: isBuyer ? "row-reverse" : "row",
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: isBuyer ? `linear-gradient(135deg, ${colors.accent}, #34d399)` : colors.surfaceHover,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: isBuyer ? "white" : colors.textMuted,
                        fontSize: 11, fontWeight: 700, flexShrink: 0,
                        border: !isBuyer ? `2px solid ${colors.borderLight}` : "none",
                      }}>
                        {isBuyer ? "V" : offer.sellerName.charAt(0).toUpperCase()}
                      </div>
                      <div style={{
                        maxWidth: "75%",
                        background: isBuyer ? `linear-gradient(135deg, ${colors.accent}, #34d399)` : colors.statBg,
                        color: isBuyer ? "white" : colors.text,
                        padding: "12px 16px",
                        borderRadius: isBuyer ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        fontSize: 12.5, lineHeight: 1.5,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                        position: "relative",
                      }}>
                        <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 11, opacity: 0.8 }}>
                          {isBuyer ? t("detail.yourOffer") : t("detail.sellerOffer")} · {formatTime(offer.createdAt)}
                        </div>
                        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 4 }}>
                          <span><Package size={11} style={{ verticalAlign: "middle", marginRight: 3 }} /> {offer.quantity}</span>
                          <span><CurrencyCircleDollar size={11} style={{ verticalAlign: "middle", marginRight: 3 }} /> {formatNumber(offer.pricePerKg)} FCFA/kg</span>
                          <span style={{ fontWeight: 700 }}>{offer.totalFormatted}</span>
                        </div>
                        {offer.message && (
                          <div style={{
                            marginTop: 6, paddingTop: 6,
                            borderTop: `1px solid ${isBuyer ? "rgba(255,255,255,0.2)" : colors.borderLight}`,
                            fontSize: 11.5, opacity: 0.85, fontStyle: "italic",
                          }}>
                            “{offer.message}”
                          </div>
                        )}
                        <div style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          marginTop: 6, fontSize: 10, fontWeight: 600,
                          color: isBuyer ? "rgba(255,255,255,0.8)" : STATUS_CFG[offer.status]?.color || colors.textMuted,
                          background: offer.status !== "pending" && offer.status !== "countered"
                            ? (isBuyer ? "rgba(255,255,255,0.12)" : STATUS_CFG[offer.status]?.bg)
                            : "transparent",
                          padding: offer.status !== "pending" && offer.status !== "countered" ? "2px 8px" : 0,
                          borderRadius: 6,
                        }}>
                          {statusIcon}
                          {t(STATUS_CFG[offer.status]?.labelKey || "detail.offerPending")}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Actions */}
              {currentOffer && currentOffer.status === "pending" && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                  <Button variant="premium" size="md" icon={<CheckCircle size={16} weight="fill" />}
                    onClick={() => respondMut.mutate({ id: currentOffer.id, action: "accept" })}
                    loading={respondMut.isPending}
                  >{t("detail.acceptOffer")}</Button>
                  <Button variant="danger" size="md" icon={<XCircle size={16} />}
                    onClick={() => respondMut.mutate({ id: currentOffer.id, action: "reject" })}
                    loading={respondMut.isPending}
                  >{t("detail.rejectOffer")}</Button>
                  <Button variant="ghost" size="md" icon={<X size={16} />}
                    onClick={() => withdrawMut.mutate(currentOffer.id)}
                    loading={withdrawMut.isPending}
                  >{t("detail.withdrawOffer")}</Button>
                </div>
              )}

              {currentOffer && currentOffer.status === "countered" && (
                <div style={{ marginTop: 16, borderTop: `1px solid ${colors.borderLight}`, paddingTop: 16 }}>
                  <div style={{
                    fontWeight: 600, fontSize: 13, color: colors.text, marginBottom: 12,
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    <ArrowCounterClockwise size={16} />
                    {t("detail.counterOffer")}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: colors.textSecondary, display: "block", marginBottom: 4 }}>
                        {t("detail.offerQuantity")}
                      </label>
                      <input value={quantity} onChange={(e) => setQuantity(e.target.value)}
                        placeholder={t("detail.offerPlaceholderQty")}
                        style={{
                          width: "100%", padding: "10px 14px", borderRadius: 10,
                          border: `1px solid ${qtyError ? "#dc2626" : colors.borderLight}`,
                          background: colors.inputBg, color: colors.text, fontSize: 13, outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      {qtyError && <div style={{ fontSize: 10, color: "#dc2626", marginTop: 3 }}>{qtyError}</div>}
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: colors.textSecondary, display: "block", marginBottom: 4 }}>
                        {t("detail.offerPricePerKg")}
                      </label>
                      <input value={price} onChange={(e) => setPrice(e.target.value)}
                        placeholder={t("detail.offerPlaceholderPrice")}
                        style={{
                          width: "100%", padding: "10px 14px", borderRadius: 10,
                          border: `1px solid ${colors.borderLight}`,
                          background: colors.inputBg, color: colors.text, fontSize: 13, outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: colors.textSecondary, display: "block", marginBottom: 4 }}>
                        {t("detail.offerMessage")}
                      </label>
                      <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                        placeholder={t("detail.offerPlaceholderMessage")} rows={2}
                        style={{
                          width: "100%", padding: "10px 14px", borderRadius: 10,
                          border: `1px solid ${colors.borderLight}`,
                          background: colors.inputBg, color: colors.text, fontSize: 13, outline: "none",
                          fontFamily: "inherit", resize: "none", boxSizing: "border-box",
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        {qtyNum > 0 && priceNum > 0 && (
                          <span style={{ fontSize: 13, fontWeight: 700, color: colors.accent }}>
                            {t("detail.offerTotal")}: <span style={{ fontSize: 15 }}>{formatCurrency(total)}</span>
                          </span>
                        )}
                      </div>
                      <Button variant="premium" size="md"
                        icon={<PaperPlaneTilt size={15} weight="bold" />}
                        onClick={handleCounter}
                        disabled={!canSend}
                        loading={counterMut.isPending}
                      >{t("detail.counterOffer")}</Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Simulate seller (demo only) */}
              {currentOffer && (currentOffer.status === "pending") && (
                <div style={{ marginTop: 16, padding: "10px 14px", background: colors.statBg, borderRadius: 10, fontSize: 11, color: colors.textMuted, display: "flex", alignItems: "center", gap: 8 }}>
                  <WarningCircle size={14} />
                  <span>{t("detail.offerSimulate")}</span>
                  <button onClick={handleSimulate} style={{
                    marginLeft: "auto", background: colors.accent, color: "white", border: "none",
                    borderRadius: 6, padding: "4px 10px", fontSize: 10, fontWeight: 600, cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}>
                    <ArrowsLeftRight size={11} style={{ verticalAlign: "middle", marginRight: 3 }} />
                    Simuler
                  </button>
                </div>
              )}

              {currentOffer && currentOffer.status === "accepted" && (
                <motion.div variants={fadeIn} initial="hidden" animate="visible"
                  style={{
                    textAlign: "center", padding: 24,
                    background: `linear-gradient(135deg, ${colors.successLight}, ${colors.surface})`,
                    borderRadius: 16, border: `1px solid ${colors.success}30`,
                  }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${colors.success}, #34d399)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 12px", boxShadow: `0 4px 16px ${colors.success}40`,
                  }}>
                    <SealCheck size={28} weight="fill" color="white" />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 17, color: colors.text, marginBottom: 4 }}>
                    {t("detail.offerContractCreated")}
                  </div>
                  <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 16, maxWidth: 280, marginLeft: "auto", marginRight: "auto" }}>
                    {culture} · {currentOffer.quantity} · {formatCurrency(total)}
                  </div>
                  <Button variant="primary" size="md" icon={<SealCheck size={16} weight="fill" />}
                    onClick={() => window.location.href = "/contracts"}
                  >{t("nav.contracts")}</Button>
                </motion.div>
              )}
            </div>
          ) : (
            /* Initial Offer Form */
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              {/* Lot Summary */}
              <div style={{
                display: "flex", gap: 16, marginBottom: 24,
                padding: "14px 16px", background: colors.statBg, borderRadius: 12,
                border: `1px solid ${colors.borderLight}`,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `linear-gradient(135deg, ${colors.accent}, #34d399)`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Package size={22} weight="fill" color="white" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: colors.text }}>{culture}</div>
                  <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 1 }}>{lotQuantity} · {lotOrigin}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: colors.accent, marginTop: 4 }}>
                    {t("detail.price")}: {formatCurrency(lotPrice)}/kg
                  </div>
                </div>
              </div>

              {/* Step 1: Quantity */}
              <motion.div variants={staggerItem} style={{ marginBottom: 20 }}>
                <div style={{
                  fontWeight: 600, fontSize: 13, color: colors.text, marginBottom: 8,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: colors.accent, color: "white", fontSize: 11, fontWeight: 700,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}>1</span>
                  {t("detail.offerStepQty")}
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder={t("detail.offerPlaceholderQty")}
                    inputMode="numeric"
                    style={{
                      width: "100%", padding: "12px 14px", borderRadius: 12,
                      border: `1.5px solid ${qtyError ? "#dc2626" : quantity ? colors.accent + "60" : colors.borderLight}`,
                      background: colors.inputBg, color: colors.text, fontSize: 15, fontWeight: 600,
                      outline: "none", boxSizing: "border-box", fontFamily: "inherit",
                      transition: "border-color 0.15s",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = colors.accent; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = quantity ? colors.accent + "60" : colors.borderLight; }}
                  />
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: colors.textMuted, pointerEvents: "none" }}>
                    kg
                  </span>
                </div>
                {qtyError && <div style={{ fontSize: 11, color: "#dc2626", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                  <WarningCircle size={12} weight="fill" /> {qtyError}
                </div>}
                <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 3 }}>
                  {t("detail.totalVolume")}: {lotQuantity}
                </div>
              </motion.div>

              {/* Step 2: Price */}
              <motion.div variants={staggerItem} style={{ marginBottom: 20 }}>
                <div style={{
                  fontWeight: 600, fontSize: 13, color: colors.text, marginBottom: 8,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: colors.accent, color: "white", fontSize: 11, fontWeight: 700,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}>2</span>
                  {t("detail.offerStepPrice")}
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder={t("detail.offerPlaceholderPrice")}
                    inputMode="numeric"
                    style={{
                      width: "100%", padding: "12px 14px", borderRadius: 12,
                      border: `1.5px solid ${price ? colors.accent + "60" : colors.borderLight}`,
                      background: colors.inputBg, color: colors.text, fontSize: 15, fontWeight: 600,
                      outline: "none", boxSizing: "border-box", fontFamily: "inherit",
                      transition: "border-color 0.15s",
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = colors.accent; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = price ? colors.accent + "60" : colors.borderLight; }}
                  />
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: colors.textMuted, pointerEvents: "none" }}>
                    FCFA/kg
                  </span>
                </div>
                <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 3 }}>
                  {t("detail.price")}: {formatCurrency(lotPrice)}/kg
                </div>
              </motion.div>

              {/* Step 3: Message */}
              <motion.div variants={staggerItem} style={{ marginBottom: 16 }}>
                <div style={{
                  fontWeight: 600, fontSize: 13, color: colors.text, marginBottom: 8,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: colors.statBg, color: colors.textMuted, fontSize: 11, fontWeight: 700,
                    border: `1.5px solid ${colors.borderLight}`,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}>3</span>
                  {t("detail.offerMessage")}
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("detail.offerPlaceholderMessage")}
                  rows={3}
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 12,
                    border: `1.5px solid ${colors.borderLight}`,
                    background: colors.inputBg, color: colors.text, fontSize: 13,
                    outline: "none", fontFamily: "inherit", resize: "none",
                    boxSizing: "border-box", lineHeight: 1.5,
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = colors.accent; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = colors.borderLight; }}
                />
              </motion.div>

              {/* Total & Send */}
              <motion.div variants={staggerItem} style={{
                background: `linear-gradient(135deg, ${colors.statBg}, ${colors.surface})`,
                borderRadius: 12, padding: "14px 16px",
                border: `1px solid ${colors.borderLight}`,
                marginTop: 8,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: colors.textMuted, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {t("detail.offerTotalValue")}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: colors.accent, letterSpacing: "-0.5px" }}>
                      {qtyNum > 0 && priceNum > 0 ? formatCurrency(total) : "—"}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: colors.textMuted, textAlign: "right" }}>
                    {qtyNum > 0 && <div>{formatNumber(qtyNum)} kg</div>}
                    {priceNum > 0 && <div>{formatNumber(priceNum)} FCFA/kg</div>}
                  </div>
                </div>
                <Button variant="premium" size="lg" fullWidth
                  icon={<PaperPlaneTilt size={16} weight="bold" />}
                  onClick={handleSendOffer}
                  disabled={!canSend}
                  loading={createMut.isPending}
                >{t("detail.makeOffer")}</Button>
              </motion.div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function NegotiationTrigger({
  lotId, sellerId, culture, lotQuantity, lotPrice, lotOrigin,
}: Props) {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);

  const { data: offers = [] } = useQuery({
    queryKey: ["offers", lotId],
    queryFn: () => fetchOffersByLot(lotId),
    refetchInterval: 10000,
  });

  const hasPendingOffer = offers.some((o) => o.status === "pending" || o.status === "countered");

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <Button variant="premium" size="lg" fullWidth
          icon={<Handshake size={20} weight="bold" />}
          onClick={() => setShowModal(true)}
          style={{ position: "relative" }}
        >
          {hasPendingOffer ? t("detail.offerNegotiation") : t("detail.makeOffer")}
        </Button>
        {hasPendingOffer && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 11, color: "#d97706", fontWeight: 600,
            padding: "8px 12px", background: "#fffbeb",
            borderRadius: 8, border: "1px solid #fde68a",
          }}>
            <Clock size={14} weight="fill" />
            {t("detail.offerPending")}
            <span style={{ marginLeft: "auto", fontSize: 10, color: "#92400e" }}>
              {offers.length} offre{offers.length > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
      <AnimatePresence>
        {showModal && (
          <NegotiationModal
            lotId={lotId}
            sellerId={sellerId}
            culture={culture}
            lotQuantity={lotQuantity}
            lotPrice={lotPrice}
            lotOrigin={lotOrigin}
            onClose={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default NegotiationTrigger;
