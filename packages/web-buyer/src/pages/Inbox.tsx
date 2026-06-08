import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { useIsMobile } from "../hooks/useMediaQuery";
import FadeIn from "../components/FadeIn";
import Breadcrumb from "../components/Breadcrumb";
import { PageTitle } from "../components/ResponsiveContainer";
import { getConversations, getMessagesBetween, sendMessage } from "../services/messages";
import { getBuyerId } from "../utils/buyer";
import {
  Envelope, PaperPlaneTilt, CaretLeft, X,
} from "@phosphor-icons/react";

export default function Inbox() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  const buyerId = getBuyerId();
  const [selectedOtherId, setSelectedOtherId] = useState<string | null>(null);
  const [input, setInput] = useState("");

  const { data: conversations = [], refetch: refetchConvs } = useQuery({
    queryKey: ["conversations", buyerId],
    queryFn: () => getConversations(buyerId),
  });

  const { data: messages = [], refetch: refetchMsgs } = useQuery({
    queryKey: ["messages", buyerId, selectedOtherId],
    queryFn: () => getMessagesBetween(buyerId, selectedOtherId!),
    enabled: !!selectedOtherId,
  });

  const selected = conversations.find((c: any) => c.otherId === selectedOtherId);

  const handleSend = async () => {
    if (!input.trim() || !selectedOtherId) return;
    await sendMessage({ senderId: buyerId, receiverId: selectedOtherId, message: input.trim() });
    setInput("");
    refetchMsgs();
    refetchConvs();
  };

  return (
    <FadeIn delay={0.05}>
      <div>
        <Breadcrumb crumbs={[
          { label: t("nav.dashboard"), path: "/dashboard" },
          { label: t("inbox.title") },
        ]} />
        <PageTitle title={t("inbox.pageTitle")} subtitle={t("inbox.subtitle")} />

        <div style={{
          display: "grid",
          gridTemplateColumns: selectedOtherId && isMobile ? "0fr 1fr" : isMobile ? "1fr" : "280px 1fr",
          gap: isMobile ? 0 : 16, minHeight: 500,
        }}>
          {(!selectedOtherId || !isMobile) && (
            <div style={{
              background: colors.surface, borderRadius: 14, border: `1.5px solid ${colors.border}`,
              overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: colors.shadowSm,
            }}>
              <div style={{ padding: "14px 16px", borderBottom: `1.5px solid ${colors.border}`, fontWeight: 600, fontSize: 13, color: colors.text, background: `linear-gradient(135deg, ${colors.statBg}, ${colors.surface})` }}>
                {t("inbox.conversations", { count: conversations.length })}
              </div>
              {conversations.length === 0 ? (
                <div style={{ padding: 24, textAlign: "center", color: colors.textMuted, fontSize: 12 }}>
                  {t("inbox.noConversations")}
                </div>
              ) : (
                conversations.map((c: any, i: number) => (
                  <div key={c.otherId} onClick={() => setSelectedOtherId(c.otherId)} style={{
                    padding: "12px 16px", cursor: "pointer", borderBottom: `1.5px solid ${colors.borderLight}`,
                    background: selectedOtherId === c.otherId ? colors.accentLight : "transparent",
                    transition: "all 0.15s", animation: `fadeSlideUp 0.3s ease ${i * 0.03}s both`,
                    borderLeft: selectedOtherId === c.otherId ? `3px solid ${colors.accent}` : "3px solid transparent",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: selectedOtherId === c.otherId ? colors.accent : colors.text }}>{c.otherName}</span>
                      {c.unread > 0 && (
                        <span style={{ background: colors.error, color: "white", borderRadius: 10, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>{c.unread}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>
                      {c.lastMessage}
                    </div>
                    <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>{c.lastDate}</div>
                  </div>
                ))
              )}
            </div>
          )}

          {selectedOtherId ? (
            <div style={{
              background: colors.surface, borderRadius: 14, border: `1.5px solid ${colors.border}`,
              display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: colors.shadowMd,
            }}>
              <div style={{
                padding: "12px 16px", borderBottom: `1.5px solid ${colors.border}`,
                display: "flex", alignItems: "center", gap: 10, fontWeight: 600, fontSize: 13,
                background: `linear-gradient(135deg, ${colors.statBg}, ${colors.surface})`,
              }}>
                {isMobile && (
                  <button onClick={() => setSelectedOtherId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: colors.text, padding: 0 }}>
                    <CaretLeft size={18} />
                  </button>
                )}
                {selected?.otherName || "—"}
              </div>

              <div style={{ flex: 1, overflow: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 8, minHeight: 300, maxHeight: 450 }}>
                {messages.length === 0 ? (
                  <div style={{ textAlign: "center", color: colors.textMuted, fontSize: 12, padding: 40 }}>
                    {t("inbox.noMessages")}
                  </div>
                ) : messages.map((m: any, i: number) => (
                  <div key={m.id} style={{
                    alignSelf: m.isMine ? "flex-end" : "flex-start",
                    maxWidth: "75%",
                    background: m.isMine ? `linear-gradient(135deg, ${colors.accent}, #34d399)` : colors.statBg,
                    color: m.isMine ? "white" : colors.text,
                    padding: "8px 14px", borderRadius: m.isMine ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                    fontSize: 13, lineHeight: 1.4, boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                    animation: `fadeSlideUp 0.3s ease ${i * 0.02}s both`,
                  }}>
                    <div>{m.message}</div>
                    <div style={{ fontSize: 9, opacity: 0.6, marginTop: 4, textAlign: "right" }}>{m.createdAt}</div>
                  </div>
                ))}
              </div>

              <div style={{ padding: "12px 16px", borderTop: `1.5px solid ${colors.border}`, display: "flex", gap: 8, background: colors.statBg }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={t("inbox.placeholder")}
                  style={{
                    flex: 1, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${colors.borderLight}`,
                    background: colors.inputBg, color: colors.text, fontSize: 13, outline: "none",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = colors.accent; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = colors.borderLight; }}
                />
                <button onClick={handleSend} disabled={!input.trim()} style={{
                  background: input.trim() ? `linear-gradient(135deg, ${colors.accent}, #34d399)` : colors.borderLight,
                  border: "none", borderRadius: 10, width: 40, height: 40,
                  cursor: input.trim() ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: input.trim() ? "white" : colors.textMuted,
                }}><PaperPlaneTilt size={16} weight="bold" /></button>
              </div>
            </div>
          ) : (
            !isMobile && (
              <div style={{
                background: colors.surface, borderRadius: 14, border: `1.5px solid ${colors.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: colors.textMuted, fontSize: 13, boxShadow: colors.shadowMd,
              }}>
                <div style={{ textAlign: "center" }}>
                  <Envelope size={40} style={{ marginBottom: 8, opacity: 0.4 }} />
                  <div>{t("inbox.selectConversation")}</div>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </FadeIn>
  );
}
