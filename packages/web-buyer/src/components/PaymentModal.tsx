import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  X, DeviceMobile, CreditCard, Bank, CurrencyCircleDollar,
  SpinnerGap, CheckCircle, XCircle, Copy, DownloadSimple,
  LockKey, ArrowLeft, Check, PhoneCall, GlobeSimple, Mailbox,
} from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { usePayment, PaymentStep, MAX_RETRY_ATTEMPTS } from "../context/PaymentContext";
import { detectOperator, detectCountry, formatPhoneInternational, validatePhone, MobileOperator } from "../utils/operator-detection";
import { parsePaymentError } from "../utils/payment-errors";
import { downloadReceipt, printReceipt } from "../utils/receipt";
import { getSavedPayment, formatLastUsed } from "../utils/saved-payments";
import PhoneInput from "./PhoneInput";
import { formatNumber, formatDateTime } from "../utils/format";

const ICON_MAP: Record<string, React.ElementType> = {
  Smartphone: DeviceMobile, CreditCard, Bank, CurrencyCircleDollar,
};

const STEPS = [
  PaymentStep.SELECT_METHOD,
  PaymentStep.INPUT_DETAILS,
  PaymentStep.PROCESSING,
  PaymentStep.SUCCESS,
];

const STEP_LABELS = ["Method", "Details", "Payment", "Confirm"];

function formatAmount(amount: number, currency = "XOF"): string {
  return `${formatNumber(amount)} ${currency}`;
}

function luhnCheck(card: string): boolean {
  let sum = 0;
  for (let i = 0; i < card.length; i++) {
    let digit = parseInt(card[i], 10);
    if ((card.length - i) % 2 === 0) { digit *= 2; if (digit > 9) digit -= 9; }
    sum += digit;
  }
  return sum % 10 === 0;
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function detectCardBrand(prefix: string): string {
  if (/^4/.test(prefix)) return "Visa";
  if (/^5[1-5]/.test(prefix)) return "Mastercard";
  if (/^3[47]/.test(prefix)) return "Amex";
  return "";
}

export default function PaymentModal() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { state, closePayment, selectPaymentMethod, setUserInput, setFieldErrors, processPayment, verifyPayment, expirePayment, resetPayment } = usePayment();
  const [copied, setCopied] = useState(false);
  const [dotCount, setDotCount] = useState(0);
  const [phone, setPhone] = useState("");
  const [cardNum, setCardNum] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [senderName, setSenderName] = useState("");
  const [cryptoWallet, setCryptoWallet] = useState("");
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [receiptEmail, setReceiptEmail] = useState("");
  const [checkVisible, setCheckVisible] = useState(false);

  const { open, step, amount, currency, orderId, items, methods, selectedMethod, selectedProvider, userPhone, paymentResult, receipt, errorMessage, fieldErrors, loading, expiresAt } = state;

  useEffect(() => { if (open) { setCopied(false); setPhone(""); setCardNum(""); setCardExp(""); setCardCvv(""); setSenderName(""); setCryptoWallet(""); } }, [open]);

  useEffect(() => {
    if (step !== PaymentStep.MOMO_PUSH_SENT && step !== PaymentStep.REDIRECT && step !== PaymentStep.THREEDS_REDIRECT) { setDotCount(0); return; }
    const interval = setInterval(() => setDotCount(c => (c + 1) % 4), 500);
    return () => clearInterval(interval);
  }, [step]);

  useEffect(() => {
    if (step !== PaymentStep.MOMO_PUSH_SENT || !expiresAt) return;
    const remaining = expiresAt - Date.now();
    if (remaining <= 0) { expirePayment(); return; }
    const timer = setTimeout(() => expirePayment(), remaining);
    return () => clearTimeout(timer);
  }, [step, expiresAt, expirePayment]);

  useEffect(() => {
    const url = paymentResult?.paymentUrl;
    if (!url || step !== PaymentStep.THREEDS_REDIRECT) return;
    const handler = (event: MessageEvent) => {
      try {
        if (event.origin !== new URL(url).origin) return;
        if (event.data?.type === "threeds-complete" || event.data?.status === "success") {
          verifyPayment();
        }
      } catch {}
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [paymentResult?.paymentUrl, step, verifyPayment]);

  useEffect(() => {
    if (step !== PaymentStep.SUCCESS) { setCheckVisible(false); return; }
    const timer = setTimeout(() => setCheckVisible(true), 100);
    return () => clearTimeout(timer);
  }, [step]);

  useEffect(() => {
    if (step !== PaymentStep.SUCCESS) { setEmailSending(false); setEmailSent(false); setShowEmailInput(false); setReceiptEmail(""); }
  }, [step]);

  const currentMethod = methods.find(m => m.id === selectedMethod);
  const providers = currentMethod?.providers || [];

  useEffect(() => {
    if (selectedMethod !== "mobile_money" || phone.replace(/\D/g, "").length < 4) return;
    const country = detectCountry(phone);
    const op = detectOperator(phone, country?.code);
    if (!op || providers.length < 2) return;
    const opPrefix = op.id.split("_")[0];
    const matched = providers.find(p => p.id.startsWith(opPrefix));
    if (matched && matched.id !== selectedProvider) {
      selectPaymentMethod(selectedMethod, matched.id);
    }
  }, [phone, selectedMethod, selectedProvider, providers, selectPaymentMethod]);

  const stepIndex = useMemo(() => {
    if ([PaymentStep.MOMO_PUSH_SENT, PaymentStep.THREEDS_REDIRECT, PaymentStep.REDIRECT, PaymentStep.VERIFYING].includes(step)) return 2;
    if ([PaymentStep.BANK_DETAILS, PaymentStep.CRYPTO_ADDRESS].includes(step)) return 2;
    const idx = STEPS.indexOf(step);
    return idx >= 0 ? idx : 0;
  }, [step]);

  const handleMethodSelect = useCallback((methodId: string) => {
    selectPaymentMethod(methodId, methods.find(x => x.id === methodId)?.providers?.[0]?.id || "");
  }, [methods, selectPaymentMethod]);

  const validateFields = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (selectedMethod === "mobile_money") {
      const result = validatePhone(phone);
      if (!result.valid) errors.phone = result.error ?? t("payment.errorPhoneRequired");
    }
    if (selectedMethod === "card") {
      const digits = cardNum.replace(/\D/g, "");
      if (digits.length < 13 || digits.length > 16) errors.cardNumber = t("payment.errorCardLength");
      else if (!luhnCheck(digits)) errors.cardNumber = t("payment.errorCardInvalid");
      if (cardExp.replace(/\D/g, "").length !== 4) errors.cardExpiry = t("payment.errorExpiryFormat");
      if (cardCvv.replace(/\D/g, "").length < 3) errors.cardCvv = t("payment.errorCvvFormat");
    }
    if (selectedMethod === "bank_transfer" && !senderName.trim()) {
      errors.senderName = t("payment.errorSenderName");
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [selectedMethod, phone, cardNum, cardExp, cardCvv, senderName, setFieldErrors, t]);

  const handleSubmitInput = useCallback(async () => {
    if (!validateFields()) return;
    setUserInput({ phone: phone || undefined, cardNumber: cardNum.replace(/\s/g, "") || undefined, cardExpiry: cardExp || undefined, cardCvv: cardCvv || undefined, senderName: senderName || undefined, cryptoWallet: cryptoWallet || undefined });
    await processPayment();
  }, [phone, cardNum, cardExp, cardCvv, senderName, cryptoWallet, setUserInput, validateFields, processPayment]);

  const handleRetry = useCallback(() => { resetPayment(); }, [resetPayment]);

  const handleCopy = useCallback(async (text: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }, []);

  const methodLabel = useMemo(() => {
    if (receipt?.method && currentMethod) return currentMethod.label;
    if (selectedMethod === "mobile_money") return t("payment.mobileMoney");

    if (selectedMethod === "card") return t("payment.card");

    if (selectedMethod === "bank_transfer") return t("payment.bankTransfer");

    if (selectedMethod === "crypto") return t("payment.crypto");
    return "-";
  }, [receipt, currentMethod, selectedMethod, t]);

  const handleDownload = useCallback(() => { if (receipt) downloadReceipt({ receipt, items, methodLabel, lang: i18n.language }); }, [receipt, items, methodLabel, i18n.language]);
  const handlePrint = useCallback(() => { if (receipt) printReceipt({ receipt, items, methodLabel, lang: i18n.language }); }, [receipt, items, methodLabel, i18n.language]);
  const handleSendEmail = useCallback(async () => {
    if (!receiptEmail || !receipt) return;
    setEmailSending(true);
    try {
      const response = await fetch("/api/payment/receipt-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: receiptEmail, transactionId: receipt.transactionId }),
      });
      if (response.ok) setEmailSent(true);
    } catch {} finally { setEmailSending(false); }
  }, [receiptEmail, receipt]);

  const getConfirmLabel = () => {
    switch (selectedMethod) {
      case "mobile_money": return `${t("payment.payWithSuffix")} ${formatAmount(amount)}`;
      case "card": return `${t("payment.payCardSuffix")} ${formatAmount(amount)}`;
      case "bank_transfer": return t("payment.confirmTransfer");
      case "crypto": return t("payment.confirmCrypto");
      default: return `${t("payment.confirmPayment")} - ${formatAmount(amount)}`;
    }
  };

  if (!open) return null;

  const renderStepIndicator = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 20, padding: "0 2px" }}>
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%", display: "flex",
              alignItems: "center", justifyContent: "center", position: "relative",
              background: i < stepIndex ? colors.success : i === stepIndex ? `linear-gradient(135deg, ${colors.accent}, #0d8a5a)` : colors.statBg,
              color: i <= stepIndex ? "#fff" : colors.textMuted,
              fontSize: 11, fontWeight: 700,
              transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              boxShadow: i === stepIndex ? `0 0 0 4px ${colors.accent}20, ${colors.accentGlow}` : "none",
            }}>
              {i < stepIndex ? <Check size={13} weight="bold" /> : i + 1}
            </div>
            <span style={{
              fontSize: 10, fontWeight: i === stepIndex ? 600 : 400,
              color: i === stepIndex ? colors.text : colors.textMuted,
              display: "none",
            }}>
              {t(`payment.step${STEP_LABELS[i]}`)}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div style={{
              flex: 1, height: 2, margin: "0 8px", borderRadius: 1, position: "relative",
              background: i < stepIndex ? colors.success : colors.borderLight,
              transition: "background 0.3s ease",
            }}>
              {i < stepIndex && (
                <div style={{
                  position: "absolute", inset: 0,
                  background: `linear-gradient(90deg, ${colors.success}, transparent)`,
                  animation: "shimmer 1.5s ease-in-out infinite",
                }} />
              )}
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderSelect = () => (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1, fontSize: 16, fontWeight: 700, color: colors.text, letterSpacing: "-0.01em" }}>{t("payment.chooseMethod")}</div>
      </div>

      {items && items.length > 0 && (
        <div style={{
          marginBottom: 14, padding: "12px 14px", borderRadius: 10,
          background: `linear-gradient(135deg, ${colors.statBg}, ${colors.surface})`,
          border: `1px solid ${colors.borderLight}`,
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: colors.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            {t("payment.orderSummary")}
          </div>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", fontSize: 12, color: colors.text }}>
              <span>{item.name} {item.quantity > 1 && <span style={{ color: colors.textMuted }}>x{item.quantity}</span>}</span>
              <span style={{ fontWeight: 600 }}>{formatAmount(item.price * item.quantity, currency)}</span>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${colors.borderLight}`, marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ fontWeight: 700, color: colors.text }}>{t("common.total")}</span>
            <span style={{ fontWeight: 700, color: colors.accent }}>{formatAmount(amount, currency)}</span>
          </div>
        </div>
      )}

      {!items && (
        <div style={{
          marginBottom: 14, padding: "14px 16px", borderRadius: 10,
          background: `linear-gradient(135deg, ${colors.accentLight}, ${colors.surface})`,
          border: `1px solid ${colors.accent}20`,
        }}>
          <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>{t("payment.amount")}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: colors.accent, letterSpacing: "-0.02em" }}>{formatAmount(amount, currency)}</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {methods.map((m) => {
          const Icon = ICON_MAP[m.icon] || DeviceMobile;
          const sel = selectedMethod === m.id;
          const saved = getSavedPayment();
          const isSaved = saved?.methodId === m.id;
          const hover = hoveredMethod === m.id;
          return (
            <div
              key={m.id}
              onClick={() => handleMethodSelect(m.id)}
              onMouseEnter={() => setHoveredMethod(m.id)}
              onMouseLeave={() => setHoveredMethod(null)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "13px 14px", borderRadius: 10, cursor: "pointer",
                border: `1.5px solid ${sel ? colors.accent : hover ? `${colors.accent}30` : colors.borderLight}`,
                background: sel ? `linear-gradient(135deg, ${colors.accentLight}, ${colors.surface})` : colors.surface,
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: sel ? `0 0 0 1px ${colors.accent}15` : hover ? colors.shadowSm : "none",
                transform: hover ? "translateY(-1px)" : "translateY(0)",
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10, display: "flex",
                alignItems: "center", justifyContent: "center", flexShrink: 0,
                background: sel ? `linear-gradient(135deg, ${colors.accent}, #0d8a5a)` : colors.statBg,
                color: sel ? "#fff" : colors.textMuted,
                transition: "all 0.2s ease",
              }}>
                <Icon size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{m.label}</span>
                  {isSaved && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                      background: `linear-gradient(135deg, ${colors.successLight}, ${colors.surface})`,
                      color: colors.success, border: `1px solid ${colors.success}30`,
                      letterSpacing: "0.02em",
                    }}>
                      {t("payment.recentlyUsed")}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>
                  {t("payment.fee")}: {m.fee} &middot; {m.processingTime}
                  {isSaved && saved?.lastUsed && (
                    <span> &middot; {formatLastUsed(saved.lastUsed)}</span>
                  )}
                </div>
              </div>
              <div style={{
                width: 20, height: 20, borderRadius: "50%",
                border: `2px solid ${sel ? colors.accent : colors.borderLight}`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                background: sel ? colors.accent : "transparent",
                transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                transform: sel ? "scale(1.1)" : "scale(1)",
              }}>
                {sel && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 0, padding: "8px 10px", borderRadius: 8, background: colors.statBg }}>
        <LockKey size={12} color={colors.success} weight="fill" />
        <span style={{ fontSize: 10, color: colors.textMuted }}>{t("payment.secureBadge")}</span>
      </div>
    </>
  );

  const renderInputDetails = () => {
    const brand = detectCardBrand(cardNum.replace(/\D/g, ""));
    return (
      <>
        <div style={{ fontSize: 16, fontWeight: 700, color: colors.text, marginBottom: 2, letterSpacing: "-0.01em" }}>{t("payment.inputTitle")}</div>
        <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 14 }}>
          {selectedMethod === "mobile_money" && t("payment.inputPhoneHint")}
          {selectedMethod === "card" && t("payment.inputCardHint")}
          {selectedMethod === "bank_transfer" && t("payment.inputBankHint")}
          {selectedMethod === "crypto" && t("payment.inputCryptoHint")}
        </div>

        {items && items.length > 0 && (
          <div style={{
            marginBottom: 14, padding: "10px 12px", borderRadius: 10,
            background: `linear-gradient(135deg, ${colors.statBg}, ${colors.surface})`,
            border: `1px solid ${colors.borderLight}`,
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: colors.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              {t("payment.orderSummary")}
            </div>
            {items.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 12, color: colors.text }}>
                <span>{item.name} {item.quantity > 1 && <span style={{ color: colors.textMuted }}>x{item.quantity}</span>}</span>
                <span style={{ fontWeight: 600 }}>{formatAmount(item.price * item.quantity, currency)}</span>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${colors.borderLight}`, marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ fontWeight: 700, color: colors.text }}>{t("common.total")}</span>
              <span style={{ fontWeight: 700, color: colors.accent }}>{formatAmount(amount, currency)}</span>
            </div>
          </div>
        )}

        {selectedMethod === "mobile_money" && (
          <>
            <PhoneInput
              value={phone}
              onChange={setPhone}
              countryCode={detectCountry(phone)?.code || "BJ"}
              error={fieldErrors.phone}
              placeholder="XX XX XX XX"
            />
            {phone.replace(/\D/g, "").length >= 6 && providers.length > 1 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: colors.text, marginBottom: 6, letterSpacing: "0.02em" }}>
                  {t("payment.selectProvider")}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {providers.map((p) => {
                    const sel = selectedProvider === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => selectPaymentMethod(selectedMethod, p.id)}
                        style={{
                          padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${sel ? colors.accent : colors.borderLight}`,
                          background: sel ? `linear-gradient(135deg, ${colors.accentLight}, ${colors.surface})` : colors.surface,
                          color: colors.text, fontSize: 11, fontWeight: sel ? 700 : 500, cursor: "pointer",
                          transition: "all 0.15s ease", fontFamily: "inherit",
                        }}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {selectedMethod === "card" && (
          <div style={{ marginBottom: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: colors.text, marginBottom: 4, display: "flex", alignItems: "center", gap: 6, letterSpacing: "0.02em" }}>
                {t("payment.cardNumberLabel")} <span style={{ color: colors.error }}>*</span>
                {brand && <span style={{ fontSize: 10, color: colors.accent, fontWeight: 500 }}>{brand}</span>}
              </label>
              <input
                value={formatCardNumber(cardNum)}
                onChange={(e) => setCardNum(e.target.value.replace(/\D/g, "").slice(0, 16))}
                placeholder="1234 5678 9012 3456"
                inputMode="numeric"
                style={{
                  width: "100%", padding: "12px 12px", borderRadius: 8, border: `1.5px solid ${fieldErrors.cardNumber ? colors.error : colors.borderLight}`,
                  background: colors.inputBg, fontSize: 14, color: colors.text, outline: "none", boxSizing: "border-box",
                  fontFamily: "monospace", transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                  boxShadow: fieldErrors.cardNumber ? "none" : cardNum.replace(/\D/g, "").length > 0 ? `0 0 0 3px ${colors.accent}10` : "none",
                }}
                onFocus={(e) => {
                  if (!fieldErrors.cardNumber) e.target.style.boxShadow = `0 0 0 3px ${colors.accent}15`;
                }}
                onBlur={(e) => { e.target.style.boxShadow = ""; }}
              />
              {fieldErrors.cardNumber && <div style={{ fontSize: 10, color: colors.error, marginTop: 3 }}>{fieldErrors.cardNumber}</div>}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: colors.text, marginBottom: 4, display: "block", letterSpacing: "0.02em" }}>
                  {t("payment.cardExpiryLabel")} <span style={{ color: colors.error }}>*</span>
                </label>
                <input
                  value={cardExp}
                  onChange={(e) => setCardExp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="MM/AA"
                  inputMode="numeric"
                  style={{
                    width: "100%", padding: "12px 12px", borderRadius: 8, border: `1.5px solid ${fieldErrors.cardExpiry ? colors.error : colors.borderLight}`,
                    background: colors.inputBg, fontSize: 14, color: colors.text, outline: "none", boxSizing: "border-box",
                    fontFamily: "monospace", transition: "border-color 0.2s ease",
                  }}
                />
                {fieldErrors.cardExpiry && <div style={{ fontSize: 10, color: colors.error, marginTop: 3 }}>{fieldErrors.cardExpiry}</div>}
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: colors.text, marginBottom: 4, display: "flex", alignItems: "center", gap: 4, letterSpacing: "0.02em" }}>
                  {t("payment.cardCvvLabel")} <span style={{ color: colors.error }}>*</span>
                  <LockKey size={10} color={colors.textMuted} />
                </label>
                <input
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  placeholder="123"
                  type="password"
                  inputMode="numeric"
                  style={{
                    width: "100%", padding: "12px 12px", borderRadius: 8, border: `1.5px solid ${fieldErrors.cardCvv ? colors.error : colors.borderLight}`,
                    background: colors.inputBg, fontSize: 14, color: colors.text, outline: "none", boxSizing: "border-box",
                    fontFamily: "monospace", transition: "border-color 0.2s ease",
                  }}
                />
                {fieldErrors.cardCvv && <div style={{ fontSize: 10, color: colors.error, marginTop: 3 }}>{fieldErrors.cardCvv}</div>}
              </div>
            </div>
          </div>
        )}

        {selectedMethod === "bank_transfer" && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: colors.text, marginBottom: 4, display: "block", letterSpacing: "0.02em" }}>
              {t("payment.senderNameLabel")}
            </label>
            <input
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder={t("payment.senderNamePlaceholder")}
              style={{
                width: "100%", padding: "12px 12px", borderRadius: 8, border: `1.5px solid ${fieldErrors.senderName ? colors.error : colors.borderLight}`,
                background: colors.inputBg, fontSize: 14, color: colors.text, outline: "none", boxSizing: "border-box",
                transition: "border-color 0.2s ease",
              }}
            />
            {fieldErrors.senderName && <div style={{ fontSize: 10, color: colors.error, marginTop: 3 }}>{fieldErrors.senderName}</div>}
          </div>
        )}

        {selectedMethod === "crypto" && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: colors.text, marginBottom: 4, display: "block", letterSpacing: "0.02em" }}>
              {t("payment.cryptoWalletLabel")}
            </label>
            <input
              value={cryptoWallet}
              onChange={(e) => setCryptoWallet(e.target.value)}
              placeholder={t("payment.cryptoWalletPlaceholder")}
              style={{
                width: "100%", padding: "12px 12px", borderRadius: 8, border: `1.5px solid ${colors.borderLight}`,
                background: colors.inputBg, fontSize: 14, color: colors.text, outline: "none", boxSizing: "border-box",
                fontFamily: "monospace",
              }}
            />
          </div>
        )}

        <div style={{
          display: "flex", alignItems: "center", gap: 6, marginBottom: 14,
          padding: "8px 10px", borderRadius: 8,
          background: `linear-gradient(135deg, ${colors.statBg}, ${colors.surface})`,
          border: `1px solid ${colors.borderLight}`,
        }}>
          <LockKey size={12} color={colors.success} weight="fill" />
          <span style={{ fontSize: 10, color: colors.textSecondary }}>{t("payment.secureBadge")}</span>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => resetPayment()} style={{
            flex: 1, padding: "11px 0", borderRadius: 10, border: `1.5px solid ${colors.borderLight}`,
            background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 500, color: colors.textSecondary,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            transition: "all 0.15s ease",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = colors.surfaceHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <ArrowLeft size={14} /> {t("common.back")}
          </button>
          <button
            onClick={handleSubmitInput}
            disabled={loading}
            style={{
              flex: 2, padding: "11px 0", borderRadius: 10, border: "none",
              background: colors.accentGradient, color: "#fff", fontSize: 13, fontWeight: 600, cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "all 0.2s ease, transform 0.1s ease",
              boxShadow: loading ? "none" : `0 4px 12px ${colors.accent}30`,
            }}
            onMouseEnter={(e) => {
              if (!loading) { e.currentTarget.style.boxShadow = `0 6px 20px ${colors.accent}40`; e.currentTarget.style.transform = "translateY(-1px)"; }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = loading ? "none" : `0 4px 12px ${colors.accent}30`;
              e.currentTarget.style.transform = "translateY(0)";
            }}
            onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = "scale(0.98)"; }}
            onMouseUp={(e) => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
          >
            {loading && <SpinnerGap size={14} style={{ animation: "spin 1s linear infinite" }} />}
            {getConfirmLabel()}
          </button>
        </div>
      </>
    );
  };

  const renderProcessing = () => (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <div style={{
        width: 64, height: 64, borderRadius: "50%",
        background: `linear-gradient(135deg, ${colors.accentLight}, ${colors.surface})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 16px", border: `2px solid ${colors.accent}20`,
      }}>
        <SpinnerGap size={36} color={colors.accent} weight="bold" style={{ animation: "spin 1s linear infinite" }} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{t("payment.processing")}</div>
      <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 6 }}>{formatAmount(amount, currency)}</div>
      <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
        <LockKey size={10} color={colors.success} weight="fill" />
        {t("payment.secureBadge")}
      </div>
    </div>
  );

  const renderMoMoPushSent = () => {
    const prov = providers.find(p => p.id === selectedProvider);
    const op: MobileOperator | null = userPhone ? detectOperator(userPhone, detectCountry(userPhone)?.code) : null;
    const remaining = expiresAt ? Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)) : 120;
    const remainingPct = expiresAt ? remaining / 120 : 0;
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{
          width: 76, height: 76, borderRadius: "50%",
          background: op ? `${op.bgColor}` : `linear-gradient(135deg, ${colors.accentLight}, ${colors.surface})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 14px", position: "relative",
          border: `2px solid ${op ? op.color : colors.accent}20`,
          animation: "scaleInCenter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}>
          <DeviceMobile size={36} color={op?.color || colors.accent} weight="fill" />
          <div style={{
            position: "absolute", top: -2, right: -2, width: 24, height: 24,
            borderRadius: "50%", background: `linear-gradient(135deg, ${colors.success}, ${colors.success}dd)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}>
            <Check size={13} color="#fff" weight="bold" />
          </div>
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 2, letterSpacing: "-0.01em" }}>{t("payment.momoPushTitle")}</div>
        <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4 }}>
          {t("payment.momoPushHint")}
        </div>
        {op && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 14px", borderRadius: 6, background: op.bgColor,
            marginBottom: 10, fontSize: 12, fontWeight: 700, color: op.color,
            border: `1px solid ${op.color}20`,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: op.color, flexShrink: 0 }} />
            {op.name} {op.countryName}
          </div>
        )}
        <div style={{
          fontSize: 13, fontWeight: 700, color: colors.text, marginBottom: 14,
          fontFamily: "monospace", letterSpacing: "0.5px",
          padding: "4px 12px", background: colors.statBg, borderRadius: 6,
          display: "inline-block",
        }}>
          {formatPhoneInternational(userPhone || "")}
        </div>
        <div style={{
          padding: "14px 16px", borderRadius: 10,
          background: `linear-gradient(135deg, ${colors.statBg}, ${colors.surface})`,
          border: `1px solid ${colors.borderLight}`, marginBottom: 14, textAlign: "left",
        }}>
          <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.3px" }}>
            {t("payment.momoPushSteps")}
          </div>
          <div style={{ fontSize: 11, color: colors.text, lineHeight: 2 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ color: colors.accent, fontWeight: 700 }}>1</span>
              <span>{t("payment.momoStep1")}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ color: colors.accent, fontWeight: 700 }}>2</span>
              <span>{t("payment.momoStep2")}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ color: colors.accent, fontWeight: 700 }}>3</span>
              <span>{t("payment.momoStep3")}</span>
            </div>
          </div>
        </div>
        <div style={{
          width: "100%", height: 4, borderRadius: 2,
          background: colors.borderLight, marginBottom: 8, overflow: "hidden",
        }}>
          <div style={{
            height: "100%", borderRadius: 2,
            background: remainingPct > 0.2
              ? `linear-gradient(90deg, ${colors.accent}, ${colors.success})`
              : colors.error,
            width: `${remainingPct * 100}%`,
            transition: "width 1s linear, background 0.5s ease",
          }} />
        </div>
        <div style={{
          fontSize: 11, color: colors.textMuted,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
        }}>
          <SpinnerGap size={12} color={colors.accent} style={{ animation: "spin 1s linear infinite" }} />
          {t("payment.momoPushWait")}{".".repeat(dotCount)}
        </div>
        <div style={{
          fontSize: 11, fontWeight: 600, marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
          color: remainingPct > 0.2 ? colors.textSecondary : colors.error,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: remainingPct > 0.2 ? colors.accent : colors.error,
            animation: remainingPct <= 0.2 ? "pulseGlow 1s ease-in-out infinite" : "none",
          }} />
          {t("payment.momoPushTimeout")} <span style={{ fontFamily: "monospace" }}>{remaining}s</span>
        </div>
        <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          {t("payment.momoPushNotReceived")}
          <button onClick={verifyPayment} style={{
            background: "none", border: "none", color: colors.accent, cursor: "pointer",
            fontSize: 10, fontWeight: 600, textDecoration: "underline", padding: 0,
            transition: "color 0.15s ease",
          }}
            onMouseEnter={(e) => e.currentTarget.style.color = colors.accentDark}
            onMouseLeave={(e) => e.currentTarget.style.color = colors.accent}
          >
            {t("payment.momoCheckStatus")}
          </button>
        </div>
        <div style={{
          fontSize: 10, color: colors.textMuted, marginTop: 12,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
          padding: "6px 12px", borderRadius: 6, background: colors.statBg,
        }}>
          <LockKey size={10} color={colors.success} weight="fill" />
          {t("payment.secureBadge")}
        </div>
      </div>
    );
  };

  const renderThreeDS = () => {
    const prov = providers.find(p => p.id === selectedProvider);
    const url = paymentResult?.paymentUrl;

    return (
      <div style={{ padding: "8px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: `linear-gradient(135deg, ${colors.accentLight}, ${colors.surface})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: `1px solid ${colors.accent}20`,
          }}>
            <LockKey size={20} color={colors.accent} weight="fill" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: colors.text, letterSpacing: "-0.01em" }}>{t("payment.threedsTitle")}</div>
            <div style={{ fontSize: 11, color: colors.textSecondary }}>{prov?.name || t("payment.card")}</div>
          </div>
        </div>
        <div style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 12, lineHeight: 1.6 }}>
          {t("payment.threedsInstructions")}
        </div>
        {url && !iframeError && (
          <div style={{
            position: "relative", width: "100%", height: 320, borderRadius: 10,
            overflow: "hidden", border: `1px solid ${colors.borderLight}`, marginBottom: 12,
          }}>
            {iframeLoading && (
              <div style={{
                position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", background: colors.surface,
              }}>
                <SpinnerGap size={24} color={colors.accent} style={{ animation: "spin 1s linear infinite" }} />
                <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 8 }}>{t("payment.threedsWait")}</div>
              </div>
            )}
            <iframe
              src={url}
              style={{ width: "100%", height: "100%", border: "none" }}
              onLoad={() => setIframeLoading(false)}
              onError={() => { setIframeLoading(false); setIframeError(true); }}
              title="3D Secure"
              sandbox="allow-scripts allow-forms allow-same-origin"
            />
          </div>
        )}
        {iframeError && (
          <div style={{ textAlign: "center", padding: 20, marginBottom: 12, borderRadius: 10, background: colors.errorLight || "#fef2f2" }}>
            <div style={{ fontSize: 11, color: colors.error, marginBottom: 8 }}>{t("payment.threedsError")}</div>
            <button onClick={() => { setIframeError(false); setIframeLoading(true); }} style={{
              padding: "8px 16px", borderRadius: 8, border: "none",
              background: colors.accent, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>
              {t("common.retry")}
            </button>
          </div>
        )}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 10px", borderRadius: 8, background: colors.statBg,
        }}>
          <LockKey size={12} color={colors.success} weight="fill" />
          <span style={{ fontSize: 10, color: colors.textMuted }}>{t("payment.secureBadge")}</span>
        </div>
      </div>
    );
  };

  const renderRedirect = () => {
    const prov = providers.find(p => p.id === selectedProvider);
    return (
      <div style={{ textAlign: "center", padding: "24px 0" }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: `linear-gradient(135deg, ${colors.accentLight}, ${colors.surface})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 16px", border: `2px solid ${colors.accent}20`,
        }}>
          <SpinnerGap size={36} color={colors.accent} weight="bold" style={{ animation: "spin 1s linear infinite" }} />
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>
          {t("payment.redirect")} {prov?.name || ""}{".".repeat(dotCount)}
        </div>
        <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>{formatAmount(amount, currency)}</div>
        <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 8, maxWidth: 280, margin: "8px auto 0", lineHeight: 1.5 }}>
          {t("payment.redirectNotice")}
        </div>
        <button
          onClick={() => { if (paymentResult?.paymentUrl) window.open(paymentResult.paymentUrl, "_blank"); }}
          style={{
            marginTop: 18, padding: "10px 24px", borderRadius: 10, border: "none",
            background: colors.accentGradient, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
            boxShadow: `0 4px 12px ${colors.accent}30`,
          }}
        >
          {t("payment.openPaymentPage")}
        </button>
        <button
          onClick={verifyPayment}
          style={{
            marginTop: 10, padding: "8px 20px", borderRadius: 8, border: `1.5px solid ${colors.borderLight}`,
            background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 500, color: colors.textSecondary,
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = colors.surfaceHover}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
          {t("payment.alreadyPaid")}
        </button>
      </div>
    );
  };

  const renderVerifying = () => (
    <div style={{ textAlign: "center", padding: "36px 0" }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: `linear-gradient(135deg, ${colors.accentLight}, ${colors.surface})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 14px", border: `2px solid ${colors.accent}20`,
      }}>
        <SpinnerGap size={32} color={colors.accent} weight="bold" style={{ animation: "spin 1s linear infinite" }} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{t("payment.verifying")}</div>
      <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>{formatAmount(amount, currency)}</div>
    </div>
  );

  const renderExpired = () => (
    <div style={{ textAlign: "center", padding: "24px 0" }}>
      <div style={{
        width: 60, height: 60, borderRadius: "50%",
        background: `linear-gradient(135deg, ${colors.errorLight}, ${colors.surface})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 12px", border: `1px solid ${colors.error}20`,
      }}>
        <XCircle size={28} color={colors.error} weight="fill" />
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: colors.text, marginBottom: 4, letterSpacing: "-0.01em" }}>{t("payment.expiredTitle")}</div>
      <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 4, maxWidth: 260, margin: "4px auto 4px" }}>
        {t("payment.expiredHint")}
      </div>
      <div style={{
        padding: "6px 14px", borderRadius: 8, background: colors.statBg,
        fontSize: 10, color: colors.textMuted, marginBottom: 16,
        display: "inline-flex", alignItems: "center", gap: 4,
        border: `1px solid ${colors.borderLight}`,
      }}>
        <CheckCircle size={10} color={colors.success} weight="fill" />
        {t("payment.errorNoDebit")}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={closePayment} style={{
          flex: 1, padding: "10px 0", borderRadius: 10, border: `1.5px solid ${colors.borderLight}`,
          background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 500, color: colors.textSecondary,
          transition: "background 0.15s ease",
        }}
          onMouseEnter={(e) => e.currentTarget.style.background = colors.surfaceHover}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
        >
          {t("common.cancel")}
        </button>
        <button onClick={handleRetry} style={{
          flex: 2, padding: "10px 0", borderRadius: 10, border: "none",
          background: colors.accentGradient, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
          boxShadow: `0 4px 12px ${colors.accent}30`,
        }}>
          {t("payment.retry")}
        </button>
      </div>
    </div>
  );

  const renderBankDetails = () => {
    const bd = paymentResult?.bankDetails;
    return (
      <>
        <div style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: colors.text, letterSpacing: "-0.01em" }}>{t("payment.bankDetails")}</div>
          {paymentResult?.invoiceNumber && (
            <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
              {t("payment.invoice")}: {paymentResult.invoiceNumber}
            </div>
          )}
        </div>
        {bd && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            {[
              { label: t("payment.bankName"), value: bd.bankName, mono: false },
              { label: t("payment.accountName"), value: bd.accountName, mono: false },
              { label: t("payment.accountNumber"), value: bd.accountNumber, mono: true },
              { label: "SWIFT", value: bd.swift, mono: true },
              { label: "RIB", value: bd.rib, mono: true },
            ].map((row) => (
              <div key={row.label} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "8px 12px", borderRadius: 8, background: colors.statBg,
                border: `1px solid ${colors.borderLight}`,
              }}>
                <span style={{ fontSize: 11, color: colors.textMuted }}>{row.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: colors.text, fontFamily: row.mono ? "monospace" : "inherit" }}>{row.value}</span>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => {}} style={{
          width: "100%", padding: "10px 0", borderRadius: 10, border: "none",
          background: colors.accentGradient, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          boxShadow: `0 4px 12px ${colors.accent}30`,
        }}>
          <DownloadSimple size={16} /> {t("payment.downloadInvoicePDF")}
        </button>
      </>
    );
  };

  const renderCrypto = () => (
    <>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: colors.text, letterSpacing: "-0.01em" }}>{t("payment.walletAddress")}</div>
        <div style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
          {providers.find(p => p.id === selectedProvider)?.name}
        </div>
      </div>
      {paymentResult?.qrCode && (
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{
            width: 130, height: 130, margin: "0 auto", borderRadius: 10,
            background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            border: `1px solid ${colors.borderLight}`, fontSize: 10, color: colors.textMuted,
          }}>
            <img src={paymentResult.qrCode} alt="QR" style={{ width: 120, height: 120, borderRadius: 6 }} />
          </div>
        </div>
      )}
      {paymentResult?.walletAddress && (
        <div style={{ marginBottom: 14 }}>
          <div style={{
            padding: "10px 12px", borderRadius: 8, background: colors.statBg,
            border: `1px solid ${colors.borderLight}`, fontSize: 11, color: colors.text,
            wordBreak: "break-all", fontFamily: "monospace", marginBottom: 6,
          }}>
            {paymentResult.walletAddress}
          </div>
          <button onClick={() => handleCopy(paymentResult.walletAddress!)} style={{
            width: "100%", padding: "8px 0", borderRadius: 8, border: `1.5px solid ${colors.borderLight}`,
            background: colors.surface, cursor: "pointer", fontSize: 12, fontWeight: 600,
            color: copied ? colors.success : colors.text,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            transition: "all 0.15s ease",
          }}>
            <Copy size={14} /> {copied ? t("payment.copied") : t("payment.copyAddress")}
          </button>
        </div>
      )}
      <div style={{ fontSize: 11, color: colors.textSecondary, textAlign: "center" }}>
        {t("payment.cryptoNotice")}
      </div>
    </>
  );

  const renderSuccess = () => {
    return (
      <div style={{ textAlign: "center", padding: "16px 0" }}>
        <div style={{
          width: 60, height: 60, borderRadius: "50%",
          background: `linear-gradient(135deg, ${colors.successLight}, ${colors.surface})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 10px", border: `2px solid ${colors.success}30`,
          animation: checkVisible ? "scaleInCenter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)" : "none",
          opacity: checkVisible ? 1 : 0,
        }}>
          <CheckCircle size={34} color={colors.success} weight="fill" />
        </div>
        <div style={{
          fontSize: 16, fontWeight: 700, color: colors.success, marginBottom: 2, letterSpacing: "-0.01em",
          animation: checkVisible ? "fadeSlideUp 0.3s ease both" : "none",
          opacity: checkVisible ? 1 : 0,
        }}>
          {t("payment.success")}
        </div>
        <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>{formatAmount(amount, currency)}</div>

        {receipt && (
          <div style={{
            padding: "12px 14px", borderRadius: 10,
            background: `linear-gradient(135deg, ${colors.statBg}, ${colors.surface})`,
            border: `1px solid ${colors.borderLight}`, textAlign: "left", marginBottom: 12,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11 }}>
              <span style={{ color: colors.textMuted }}>{t("payment.receiptTransaction")}</span>
              <span style={{ color: colors.text, fontWeight: 600, fontFamily: "monospace", fontSize: 10 }}>{receipt.transactionId.slice(0, 16)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11 }}>
              <span style={{ color: colors.textMuted }}>{t("payment.receiptMethod")}</span>
              <span style={{ color: colors.text, fontWeight: 600 }}>{methodLabel}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 11 }}>
              <span style={{ color: colors.textMuted }}>{t("payment.receiptDate")}</span>
              <span style={{ color: colors.text, fontWeight: 600, fontSize: 10 }}>
                {formatDateTime(receipt.paidAt)}
              </span>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button onClick={handleDownload} style={{
            flex: 1, padding: "9px 0", borderRadius: 10, border: `1.5px solid ${colors.borderLight}`,
            background: colors.surface, cursor: "pointer", fontSize: 11, fontWeight: 600, color: colors.text,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            transition: "all 0.15s ease",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = colors.surfaceHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = colors.surface; }}
          >
            <DownloadSimple size={14} /> {t("payment.downloadReceipt")}
          </button>
          <button onClick={handlePrint} style={{
            flex: 1, padding: "9px 0", borderRadius: 10, border: `1.5px solid ${colors.borderLight}`,
            background: colors.surface, cursor: "pointer", fontSize: 11, fontWeight: 600, color: colors.text,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            transition: "all 0.15s ease",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = colors.surfaceHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = colors.surface; }}
          >
            <Copy size={14} /> {t("payment.printReceipt")}
          </button>
        </div>

        {!emailSent ? (
          <div style={{ marginBottom: 12 }}>
            {!showEmailInput ? (
              <button onClick={() => setShowEmailInput(true)} style={{
                background: "none", border: "none", color: colors.accent, cursor: "pointer",
                fontSize: 11, fontWeight: 600, textDecoration: "underline", padding: 0,
                transition: "color 0.15s ease",
              }}
                onMouseEnter={(e) => e.currentTarget.style.color = colors.accentDark}
                onMouseLeave={(e) => e.currentTarget.style.color = colors.accent}
              >
                {t("payment.emailReceipt")}
              </button>
            ) : (
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  value={receiptEmail}
                  onChange={e => setReceiptEmail(e.target.value)}
                  placeholder={t("payment.emailPlaceholder")}
                  type="email"
                  style={{
                    flex: 1, padding: "8px 10px", borderRadius: 8, border: `1.5px solid ${colors.borderLight}`,
                    background: colors.inputBg, fontSize: 12, color: colors.text, outline: "none",
                  }}
                />
                <button
                  onClick={handleSendEmail}
                  disabled={emailSending || !receiptEmail}
                  style={{
                    padding: "8px 14px", borderRadius: 8, border: "none",
                    background: colors.accentGradient, color: "#fff", fontSize: 12, fontWeight: 600,
                    cursor: emailSending ? "default" : "pointer", opacity: emailSending ? 0.6 : 1,
                    whiteSpace: "nowrap", transition: "all 0.15s ease",
                  }}
                >
                  {emailSending ? <SpinnerGap size={12} style={{ animation: "spin 1s linear infinite" }} /> : t("common.send")}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ fontSize: 11, color: colors.success, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <CheckCircle size={12} color={colors.success} weight="fill" />
            {t("payment.emailSent")}
          </div>
        )}

        <div style={{ fontSize: 10, color: colors.textMuted, marginBottom: 14, lineHeight: 1.6 }}>
          {t("payment.successNotice")}
        </div>

        <button onClick={closePayment} style={{
          width: "100%", padding: "11px 0", borderRadius: 10, border: "none",
          background: colors.accentGradient, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
          boxShadow: `0 4px 12px ${colors.accent}30`, transition: "all 0.2s ease",
        }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 6px 20px ${colors.accent}40`; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = `0 4px 12px ${colors.accent}30`; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          {t("payment.done")}
        </button>
      </div>
    );
  };

  const renderFailed = () => {
    const ctx = { method: selectedMethod, provider: selectedProvider };
    const parsed = errorMessage ? parsePaymentError(errorMessage, ctx) : null;
    const tooManyAttempts = state.retryCount >= MAX_RETRY_ATTEMPTS;
    return (
      <div style={{ textAlign: "center", padding: "24px 0" }}>
        <div style={{
          width: 60, height: 60, borderRadius: "50%",
          background: `linear-gradient(135deg, ${colors.errorLight}, ${colors.surface})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 12px", border: `1px solid ${colors.error}20`,
        }}>
          <XCircle size={32} color={colors.error} weight="fill" />
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: colors.error, marginBottom: 2, letterSpacing: "-0.01em" }}>{parsed?.title || t("payment.failed")}</div>
        <div style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 6 }}>{formatAmount(amount, currency)}</div>
        <div style={{
          padding: "10px 14px", borderRadius: 8,
          background: `linear-gradient(135deg, ${colors.errorLight}, ${colors.surface})`,
          border: `1px solid ${colors.error}20`,
          fontSize: 11, color: colors.text, marginBottom: 10, textAlign: "left", lineHeight: 1.6,
        }}>
          <div>{parsed?.description || errorMessage || t("payment.errorFallbackDesc")}</div>
          {parsed?.action && (
            <div style={{ marginTop: 6, fontSize: 10, color: colors.error }}>{parsed.action}</div>
          )}
          {tooManyAttempts && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${colors.error}30`, fontSize: 11, color: colors.error }}>
              {t("payment.tooManyAttempts")}
            </div>
          )}
        </div>
        <div style={{
          padding: "8px 14px", borderRadius: 8, background: colors.statBg,
          fontSize: 10, color: colors.textMuted, marginBottom: 14,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
          border: `1px solid ${colors.borderLight}`,
        }}>
          <CheckCircle size={12} color={colors.success} weight="fill" />
          {parsed?.reassurance || t("payment.errorNoDebit")}
        </div>
        {tooManyAttempts ? (
          <div style={{ marginBottom: 14 }}>
            <div style={{
              padding: "10px 14px", borderRadius: 10,
              background: `linear-gradient(135deg, ${colors.statBg}, ${colors.surface})`,
              border: `1px solid ${colors.borderLight}`, textAlign: "left", marginBottom: 10,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: colors.text, marginBottom: 6 }}>
                {t("payment.supportTitle")}
              </div>
              <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <Mailbox size={14} color={colors.accent} />
                {t("payment.supportEmail")}
              </div>
              <div style={{ fontSize: 11, color: colors.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
                <PhoneCall size={14} color={colors.accent} />
                {t("payment.supportPhone")}
              </div>
            </div>
            <button onClick={handleRetry} style={{
              width: "100%", padding: "10px 0", borderRadius: 10, border: `1.5px solid ${colors.borderLight}`,
              background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 500, color: colors.textSecondary,
            }}>
              {t("payment.retry")}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={closePayment} style={{
              flex: 1, padding: "10px 0", borderRadius: 10, border: `1.5px solid ${colors.borderLight}`,
              background: "transparent", cursor: "pointer", fontSize: 13, fontWeight: 500, color: colors.textSecondary,
              transition: "background 0.15s ease",
            }}
              onMouseEnter={(e) => e.currentTarget.style.background = colors.surfaceHover}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              {t("common.cancel")}
            </button>
            <button onClick={handleRetry} style={{
              flex: 2, padding: "10px 0", borderRadius: 10, border: "none",
              background: colors.accentGradient, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
              boxShadow: `0 4px 12px ${colors.accent}30`,
            }}>
              {t("payment.retry")}
            </button>
          </div>
        )}
      </div>
    );
  };

  const borderGradient = `linear-gradient(135deg, ${colors.accent}40, ${colors.accentLight}, ${colors.accent}40)`;

  return (
    <div onClick={closePayment} style={{
      position: "fixed", inset: 0, zIndex: 1100,
      background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      animation: "fadeIn 0.2s ease",
    }}>
      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes scaleInCenter { 0% { opacity: 0; transform: scale(0.8); } 70% { transform: scale(1.05); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes pulseGlow { 0%, 100% { box-shadow: 0 0 8px rgba(10,110,74,0.08); } 50% { box-shadow: 0 0 24px rgba(10,110,74,0.18); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: colors.surface,
        borderRadius: 20,
        padding: 24,
        maxWidth: 420,
        width: "100%",
        boxShadow: `0 32px 64px rgba(0,0,0,0.2), ${colors.accentGlow}`,
        animation: "fadeSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${colors.borderLight}`,
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: borderGradient,
        }} />
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginBottom: step !== PaymentStep.SELECT_METHOD ? 0 : 16,
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: colors.text, letterSpacing: "-0.01em" }}>
            {step !== PaymentStep.SELECT_METHOD && step !== PaymentStep.INPUT_DETAILS ? t("payment.title") : ""}
          </div>
          <button onClick={closePayment} style={{
            background: colors.statBg, border: "none", borderRadius: 8, width: 32, height: 32,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: colors.textMuted,
            transition: "all 0.15s ease",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = colors.surfaceHover; e.currentTarget.style.color = colors.text; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = colors.statBg; e.currentTarget.style.color = colors.textMuted; }}
          >
            <X size={16} />
          </button>
        </div>

        {step !== PaymentStep.SELECT_METHOD && step !== PaymentStep.INPUT_DETAILS && renderStepIndicator()}

        <div style={{ animation: step === PaymentStep.INPUT_DETAILS ? "none" : "fadeSlideUp 0.3s ease both" }}>
          {step === PaymentStep.SELECT_METHOD && renderSelect()}
          {step === PaymentStep.INPUT_DETAILS && renderInputDetails()}
          {step === PaymentStep.PROCESSING && renderProcessing()}
          {step === PaymentStep.MOMO_PUSH_SENT && renderMoMoPushSent()}
          {step === PaymentStep.THREEDS_REDIRECT && renderThreeDS()}
          {step === PaymentStep.REDIRECT && renderRedirect()}
          {step === PaymentStep.BANK_DETAILS && renderBankDetails()}
          {step === PaymentStep.CRYPTO_ADDRESS && renderCrypto()}
          {step === PaymentStep.VERIFYING && renderVerifying()}
          {step === PaymentStep.SUCCESS && renderSuccess()}
          {step === PaymentStep.FAILED && renderFailed()}
          {step === PaymentStep.EXPIRED && renderExpired()}
        </div>
      </div>
    </div>
  );
}
