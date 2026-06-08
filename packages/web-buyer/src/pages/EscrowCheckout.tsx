import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import {
  ShieldCheck, Check, XCircle, Clock, ArrowRight, Copy, SealCheck,
  Warning, CurrencyDollar, Storefront, Hash, CalendarCheck, CaretDown,
  CaretUp, List,
} from "@phosphor-icons/react";
import Card, { CardHeader } from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/Badge";
import Stagger from "../components/Stagger";
import FadeIn from "../components/FadeIn";
import { fetchEscrows, fetchEscrowById, fundEscrow, markDelivered, confirmDelivery, raiseDispute } from "../services/escrow";
import type { EscrowContract, EscrowStatus } from "../services/escrow";
import { formatNumber, formatDate } from "../utils/format";
import EscrowSmartContract from "../components/EscrowSmartContract";
import EscrowFeeBadge from "../components/EscrowFeeBadge";
import { generateVisualContract, calculateEscrowFee, recordEscrowSavings } from "../services/escrowEngine";
import { getTrustScore } from "../services/trustScore";

const STATUS_MAP: Record<EscrowStatus, { labelKey: string; color: string; bg: string }> = {
  pending: { labelKey: "escrow.status.pending", color: "#f57c00", bg: "#fff3e0" },
  funded: { labelKey: "escrow.status.funded", color: "#1565c0", bg: "#e3f2fd" },
  delivered: { labelKey: "escrow.status.delivered", color: "#6a1b9a", bg: "#f3e5f5" },
  confirmed: { labelKey: "escrow.status.confirmed", color: "#059669", bg: "#ecfdf5" },
  released: { labelKey: "escrow.status.released", color: "#0a6e4a", bg: "#d1fae5" },
  disputed: { labelKey: "escrow.status.disputed", color: "#c62828", bg: "#ffebee" },
  resolved: { labelKey: "escrow.status.resolved", color: "#4a148c", bg: "#f3e5f5" },
  refunded: { labelKey: "escrow.status.refunded", color: "#e65100", bg: "#fff3e0" },
  cancelled: { labelKey: "escrow.status.cancelled", color: "#616161", bg: "#f5f5f5" },
};

const TIMELINE: EscrowStatus[] = ["pending", "funded", "delivered", "confirmed", "released"];
const CAN_DISPUTE: EscrowStatus[] = ["funded", "delivered", "confirmed"];

function StatusBadge({ status }: { status: EscrowStatus }) {
  const { t } = useTranslation();
  const cfg = STATUS_MAP[status];
  return (
    <Badge text={t(cfg.labelKey)} variant={
      status === "pending" ? "warning" : status === "funded" ? "info" :
      status === "delivered" ? "neutral" : status === "confirmed" || status === "released" ? "success" :
      status === "disputed" || status === "cancelled" ? "error" : "info"
    } size="md" />
  );
}

function DetailRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  const { colors } = useTheme();
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", fontSize: 13, borderBottom: `1px solid ${colors.borderLight}10` }}>
      <span style={{ color: colors.textMuted }}>{label}</span>
      <span style={{ fontWeight: 600, color: colors.text, textAlign: "right", fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit", fontSize: mono ? 11 : 13 }}>
        {value}
      </span>
    </div>
  );
}

function fmtAmount(amount: number): string {
  return `${formatNumber(amount)} USDT`;
}

function fmtEscrowDate(iso?: string): string {
  if (!iso) return "—";
  return formatDate(iso, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function EscrowCheckout() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [escrow, setEscrow] = useState<EscrowContract | null>(null);
  const [escrowList, setEscrowList] = useState<EscrowContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeInput, setShowDisputeInput] = useState(false);
  const [showTimeline, setShowTimeline] = useState(orderId ? true : false);
  const [successMsg, setSuccessMsg] = useState("");
  const [trustScore, setTrustScore] = useState<number | null>(null);
  const [feeApplied, setFeeApplied] = useState(false);

  const loadEscrow = useCallback(async () => {
    setLoading(true);
    try {
      if (!orderId) {
        const data = await fetchEscrows();
        setEscrowList(data);
      } else {
        const data = await fetchEscrowById(orderId);
        if (data) setEscrow(data);
      }
    } catch {}
    setLoading(false);
  }, [orderId]);

  useEffect(() => { loadEscrow(); }, [loadEscrow]);

  useEffect(() => {
    if (!escrow?.buyerId) return;
    let mounted = true;
    (async () => {
      const ts = await getTrustScore(escrow.buyerId);
      if (mounted && ts) setTrustScore(ts.score);
    })();
    return () => { mounted = false; };
  }, [escrow?.buyerId]);

  const execAction = useCallback(async (label: string, fn: () => Promise<any>) => {
    setActionLoading(label);
    try {
      const updated = await fn();
      setEscrow(prev => prev ? { ...prev, ...updated } : updated);
      setSuccessMsg(t("common.success"));
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch { setSuccessMsg(t("common.error")); setTimeout(() => setSuccessMsg(""), 3000); }
    setActionLoading(null);
  }, [t]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessMsg("Copi\u00e9 !");
    setTimeout(() => setSuccessMsg(""), 2000);
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 28, height: 28, border: "3px solid", borderColor: `${colors.borderLight} ${colors.borderLight} ${colors.borderLight} ${colors.accent}`, borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 14px" }} />
          <div style={{ fontSize: 13, color: colors.textMuted }}>{t("common.loading")}</div>
        </div>
      </div>
    );
  }

  /* ---- LIST VIEW ---- */
  if (!orderId) {
    return (
      <FadeIn>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: `linear-gradient(135deg, ${colors.accent}, ${colors.accent}80)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: `0 4px 12px ${colors.accent}30`,
            }}>
              <ShieldCheck size={22} color="#fff" weight="fill" />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: colors.text, margin: 0, letterSpacing: "-0.3px" }}>{t("escrow.title")}</h1>
              <p style={{ fontSize: 13, color: colors.textMuted, margin: "2px 0 0" }}>{t("escrow.subtitle")}</p>
            </div>
          </div>

          {escrowList.length === 0 ? (
            <Card variant="premium" style={{ textAlign: "center", padding: "60px 20px", marginTop: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: colors.surfaceHover, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <ShieldCheck size={28} color={colors.textMuted} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: colors.text, marginBottom: 4 }}>{t("escrow.noEscrow")}</div>
              <Button variant="primary" size="md" icon={<ArrowRight size={16} />} onClick={() => navigate("/orders")} style={{ marginTop: 16 }}>
                {t("orders.title")}
              </Button>
            </Card>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
              <Stagger stagger={50} baseDelay={30}>
                {escrowList.map((e) => {
                  const cfg = STATUS_MAP[e.status];
                  return (
                    <div key={e.id} onClick={() => navigate(`/escrow/${e.id}`)}
                      style={{
                        background: colors.surface, borderRadius: 16,
                        border: `1px solid ${colors.borderLight}`,
                        padding: "16px 20px",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 14,
                        transition: "all 0.25s cubic-bezier(0.16, 1, 0.36, 1)",
                        boxShadow: colors.shadowSm,
                      }}
                      onMouseEnter={el => {
                        el.currentTarget.style.borderColor = colors.accent + "60";
                        el.currentTarget.style.boxShadow = `${colors.shadowLg}, ${colors.accentGlow}`;
                        el.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={el => {
                        el.currentTarget.style.borderColor = colors.borderLight;
                        el.currentTarget.style.boxShadow = colors.shadowSm;
                        el.currentTarget.style.transform = "translateY(0)";
                      }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 12,
                        background: cfg.bg, display: "flex", alignItems: "center",
                        justifyContent: "center", border: `1px solid ${cfg.color}22`,
                        flexShrink: 0,
                      }}>
                        {STATUS_MAP[e.status].labelKey === "escrow.status.pending" ? <Clock size={20} color={cfg.color} /> :
                         e.status === "funded" ? <CurrencyDollar size={20} color={cfg.color} /> :
                         e.status === "delivered" ? <Check size={20} color={cfg.color} /> :
                         e.status === "confirmed" || e.status === "released" ? <SealCheck size={20} color={cfg.color} /> :
                         e.status === "disputed" ? <Warning size={20} color={cfg.color} /> :
                         <ShieldCheck size={20} color={cfg.color} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: colors.text }}>{e.orderId}</div>
                        <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                          <span>{e.buyerName || e.buyerId}</span>
                          <ArrowRight size={10} color={colors.textMuted} />
                          <span>{e.producteurName || e.producteurId}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: colors.text, letterSpacing: "-0.2px" }}>{formatNumber(e.amount)} USDT</div>
                        <div style={{ marginTop: 4 }}><StatusBadge status={e.status} /></div>
                      </div>
                      <ArrowRight size={14} color={colors.textMuted} weight="bold" />
                    </div>
                  );
                })}
              </Stagger>
            </div>
          )}
        </div>
      </FadeIn>
    );
  }

  /* ---- DETAIL VIEW ---- */
  if (!escrow) {
    return (
      <Card variant="premium" style={{ textAlign: "center", padding: "60px 20px", marginTop: 20 }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: colors.surfaceHover, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
          <ShieldCheck size={28} color={colors.textMuted} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: colors.text, marginBottom: 4 }}>{t("escrow.noEscrow")}</div>
        <Button variant="primary" size="md" icon={<ArrowRight size={16} />} onClick={() => navigate("/escrow")}>
          {t("common.back")}
        </Button>
      </Card>
    );
  }

  const statusIdx = TIMELINE.indexOf(escrow.status);
  const isTerminal = ["released", "resolved", "refunded", "cancelled"].includes(escrow.status);

  return (
    <FadeIn>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {successMsg && (
          <div style={{
            position: "fixed", top: 80, right: 24, zIndex: 999,
            background: colors.accent, color: "#fff", padding: "10px 18px",
            borderRadius: 10, fontSize: 13, fontWeight: 600,
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            animation: "slideDown 0.3s ease",
          }}>
            {successMsg}
          </div>
        )}

        <button onClick={() => navigate("/escrow")}
          style={{
            background: "none", border: "none", color: colors.textMuted,
            cursor: "pointer", fontSize: 13, display: "flex",
            alignItems: "center", gap: 6, padding: 0, marginBottom: 16,
          }}>
          <ArrowRight size={14} style={{ transform: "rotate(180deg)" }} />
          {t("common.back")}
        </button>

        <Card variant="premium" padding="0" style={{ overflow: "hidden", marginBottom: 20 }}>
          <div style={{
            padding: "20px 24px",
            background: `linear-gradient(135deg, ${colors.accent}08, transparent)`,
            borderBottom: `1px solid ${colors.borderLight}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
                  <ShieldCheck size={22} color={colors.accent} weight="fill" />
                  <h1 style={{ fontSize: 20, fontWeight: 700, color: colors.text, margin: 0, letterSpacing: "-0.3px" }}>{t("escrow.title")}</h1>
                </div>
                <p style={{ fontSize: 13, color: colors.textMuted, margin: "2px 0 0" }}>{escrow.orderId}</p>
              </div>
              <StatusBadge status={escrow.status} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, padding: "20px 24px" }}>
            <div style={{ borderRight: `1px solid ${colors.borderLight}`, paddingRight: 20 }}>
              <CardHeader icon={<Storefront size={16} weight="fill" />} title={t("orders.title")} />
              <div>
                <DetailRow label={t("escrow.amount")} value={<span style={{ color: colors.accent, fontWeight: 700 }}>{fmtAmount(escrow.amount)}</span>} />
                <DetailRow label={t("escrow.network")} value={escrow.network} />
                <DetailRow label={t("nav.contracts")} value={escrow.orderId} />
                <DetailRow label={t("common.buyer")} value={escrow.buyerName || escrow.buyerId} />
                <DetailRow label={t("common.seller")} value={escrow.producteurName || escrow.producteurId} />
              </div>
            </div>
            <div style={{ paddingLeft: 20 }}>
              <CardHeader icon={<CalendarCheck size={16} weight="fill" />} title={t("common.details")} />
              <div>
                <DetailRow label={t("common.created")} value={fmtEscrowDate(escrow.createdAt)} />
                {escrow.contractAddress && (
                  <DetailRow label={t("escrow.contractAddress")}
                    value={
                      <span style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                        <Hash size={11} />{escrow.contractAddress.slice(0, 10)}...
                        <button onClick={() => copyToClipboard(escrow.contractAddress!)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, display: "flex", padding: 2 }}>
                          <Copy size={11} />
                        </button>
                      </span>
                    } mono
                  />
                )}
                {escrow.depositTxHash && (
                  <DetailRow label={t("escrow.txHash")}
                    value={
                      <span style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                        <Hash size={11} />{escrow.depositTxHash.slice(0, 10)}...
                        <button onClick={() => copyToClipboard(escrow.depositTxHash!)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: colors.textMuted, display: "flex", padding: 2 }}>
                          <Copy size={11} />
                        </button>
                      </span>
                    } mono
                  />
                )}
                {escrow.fundedAt && <DetailRow label={t("escrow.status.funded")} value={fmtEscrowDate(escrow.fundedAt)} />}
                {escrow.releasedAt && <DetailRow label={t("escrow.status.released")} value={fmtEscrowDate(escrow.releasedAt)} />}
              </div>
            </div>
          </div>
        </Card>

        {/* Timeline */}
        <Card variant="glass" style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", marginBottom: showTimeline ? 16 : 0 }}
            onClick={() => setShowTimeline(!showTimeline)}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Clock size={16} color={colors.textMuted} />
              <span style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>{t("escrow.timeline")}</span>
            </div>
            {showTimeline ? <CaretUp size={14} color={colors.textMuted} /> : <CaretDown size={14} color={colors.textMuted} />}
          </div>
          {showTimeline && (
            <div style={{ display: "flex", gap: 0, paddingTop: 8 }}>
              {TIMELINE.map((s, idx) => {
                const stepIdx = isTerminal ? TIMELINE.length : statusIdx + (escrow.status === "confirmed" ? 1 : 0);
                const completed = idx < stepIdx;
                const active = idx === statusIdx && !isTerminal;
                const cfg = STATUS_MAP[s];
                return (
                  <div key={s} style={{ flex: idx === TIMELINE.length - 1 ? 0 : 1, display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 14, display: "flex",
                      alignItems: "center", justifyContent: "center", flexShrink: 0,
                      background: completed ? cfg.color : active ? cfg.bg : colors.borderLight,
                      color: completed ? "#fff" : active ? cfg.color : colors.textMuted,
                      border: `2px solid ${completed ? cfg.color : active ? cfg.color : colors.borderLight}`,
                      fontSize: 12, transition: "all 0.3s",
                      boxShadow: active ? `0 0 0 4px ${cfg.color}20` : "none",
                    }}>
                      {completed ? <Check size={12} weight="bold" /> : active ? <Clock size={12} /> : <div style={{ width: 6, height: 6, borderRadius: 3, background: colors.borderLight }} />}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: active || completed ? 600 : 400, color: active || completed ? colors.text : colors.textMuted, whiteSpace: "nowrap" }}>
                      {t(cfg.labelKey)}
                    </span>
                    {idx < TIMELINE.length - 1 && (
                      <div style={{ flex: 1, height: 2, background: completed ? cfg.color : colors.borderLight, margin: "0 4px", borderRadius: 1 }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Visual Smart Contract */}
        <div style={{ marginBottom: 20 }}>
          <EscrowSmartContract
            data={generateVisualContract(
              escrow.orderId,
              escrow.buyerName || escrow.buyerId,
              escrow.producteurName || escrow.producteurId,
              escrow.amount,
              escrow.status,
              !!escrow.fundedAt,
              !!escrow.deliveredAt,
              !!escrow.confirmedAt,
            )}
          />
        </div>

        {/* Fee badge */}
        {trustScore !== null && !feeApplied && (
          <div style={{ marginBottom: 20 }}>
            <EscrowFeeBadge
              savings={calculateEscrowFee(escrow.amount, trustScore)}
              amount={escrow.amount}
            />
          </div>
        )}

        {/* Dispute alert */}
        {escrow.disputed && (
          <Card variant="glass" style={{ padding: 20, marginBottom: 20, background: colors.errorLight, borderColor: colors.errorLight }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Warning size={18} color={colors.error} weight="fill" />
              <span style={{ fontSize: 14, fontWeight: 600, color: colors.error }}>{t("escrow.dispute")}</span>
            </div>
            <p style={{ fontSize: 13, color: colors.error, margin: "0 0 2px" }}>{escrow.disputeReason || t("common.na")}</p>
            {escrow.resolution && (
              <p style={{ fontSize: 13, color: colors.accent, marginTop: 6 }}>
                {t("common.resolution")}: {escrow.resolution === "release_to_seller" ? t("common.releaseToSeller") : escrow.resolution === "refund_buyer" ? t("common.refundBuyer") : t("common.split50")}
              </p>
            )}
          </Card>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
          {escrow.status === "pending" && (
            <Button variant="premium" size="lg" icon={actionLoading === "fund" ? undefined : <CurrencyDollar size={18} weight="fill" />}
              onClick={() => {
                if (trustScore !== null && !feeApplied) {
                  const savings = calculateEscrowFee(escrow.amount, trustScore);
                  if (savings.savings > 0) { recordEscrowSavings(savings.savings); setFeeApplied(true); }
                }
                execAction("fund", () => fundEscrow(escrow.id));
              }}
              loading={actionLoading === "fund"}>
              {t("escrow.fund")} ({fmtAmount(escrow.amount)})
            </Button>
          )}
          {escrow.status === "funded" && (
            <Button size="lg" variant="success"
              icon={actionLoading === "deliver" ? undefined : <Check size={18} weight="bold" />}
              onClick={() => execAction("deliver", () => markDelivered(escrow.id))}
              loading={actionLoading === "deliver"}>
              {t("escrow.deliver")}
            </Button>
          )}
          {escrow.status === "delivered" && (
            <Button variant="premium" size="lg"
              icon={actionLoading === "confirm" ? undefined : <SealCheck size={18} weight="fill" />}
              onClick={() => execAction("confirm", () => confirmDelivery(escrow.id))}
              loading={actionLoading === "confirm"}>
              {t("escrow.confirm")}
            </Button>
          )}
          {CAN_DISPUTE.includes(escrow.status) && !escrow.disputed && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {showDisputeInput ? (
                <>
                  <input value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)}
                    placeholder={t("escrow.disputePlaceholder")}
                    style={{
                      padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${colors.borderLight}`,
                      fontSize: 13, background: colors.surface, color: colors.text, width: 260,
                      outline: "none", transition: "border-color 0.15s",
                    }}
                    onFocus={e => e.target.style.borderColor = colors.accent}
                    onBlur={e => e.target.style.borderColor = colors.borderLight} />
                  <Button variant="danger"
                    onClick={() => execAction("dispute", () => raiseDispute(escrow.id, disputeReason))}
                    disabled={!disputeReason.trim()}
                    loading={actionLoading === "dispute"}>
                    {t("common.confirm")}
                  </Button>
                  <Button variant="secondary" onClick={() => { setShowDisputeInput(false); setDisputeReason(""); }}>
                    {t("common.cancel")}
                  </Button>
                </>
              ) : (
                <Button variant="danger" icon={<Warning size={18} />} onClick={() => setShowDisputeInput(true)}>
                  {t("escrow.dispute")}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Info footer */}
        <Card variant="glass" style={{ padding: 16, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <ShieldCheck size={14} color={colors.accent} />
            <span style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>Smart Contract Escrow</span>
          </div>
          <p style={{ fontSize: 11, color: colors.textMuted, margin: 0, lineHeight: 1.6 }}>
            {t("escrow.subtitle")}
          </p>
        </Card>
      </div>
    </FadeIn>
  );
}
