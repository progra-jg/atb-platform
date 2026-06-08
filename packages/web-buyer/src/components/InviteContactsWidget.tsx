import React, { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShareNetwork, WhatsappLogo, EnvelopeSimple, DownloadSimple,
  CheckCircle, Copy, CaretRight, UsersThree, TrendUp, ArrowSquareOut,
} from "@phosphor-icons/react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import Button from "./ui/Button";
import Card, { CardHeader, CardDivider } from "./ui/Card";
import { useIsMobile } from "../hooks/useMediaQuery";
import { sendBulkInvites, generateInviteLink, getInviteStats, getInviteHistory } from "../services/invites";
import type { CsvContact, InviteRecord, InviteStats, InviteChannel } from "../types/invite";

function parseCsv(text: string): CsvContact[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
  const nameIdx = headers.findIndex((h) => h.includes("nom") || h.includes("name") || h.includes("prenom") || h.includes("prénom"));
  const emailIdx = headers.findIndex((h) => h.includes("email") || h.includes("mail") || h.includes("courriel"));
  const phoneIdx = headers.findIndex((h) => h.includes("tel") || h.includes("phone") || h.includes("mobile") || h.includes("portable") || h.includes("téléphone") || h.includes("whatsapp"));
  const results: CsvContact[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].split(",").map((v) => v.trim().replace(/['"]/g, ""));
    if (vals.length < 2) continue;
    const entry: CsvContact = {};
    if (nameIdx >= 0) entry.nom = vals[nameIdx];
    if (emailIdx >= 0 && vals[emailIdx].includes("@")) entry.email = vals[emailIdx];
    if (phoneIdx >= 0 && vals[phoneIdx]) entry.telephone = vals[phoneIdx];
    if (entry.email || entry.telephone) results.push(entry);
  }
  return results;
}

function isValidEmail(v: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function isValidPhone(v: string): boolean { return /^[\d\s\+\-\(\)]{7,}$/.test(v); }

export default function InviteContactsWidget({ onViewAll }: { onViewAll?: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"share" | "upload" | "manual">("share");
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [csvContacts, setCsvContacts] = useState<CsvContact[]>([]);
  const [csvFile, setCsvFile] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [stats, setStats] = useState<InviteStats | null>(null);
  const [history, setHistory] = useState<InviteRecord[]>([]);
  const [manualEmail, setManualEmail] = useState("");
  const [manualName, setManualName] = useState("");

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    const [s, h, l] = await Promise.all([
      getInviteStats(user.id),
      getInviteHistory(user.id),
      generateInviteLink(user.id),
    ]);
    setStats(s);
    setHistory(h);
    setInviteLink(l);
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* fallback */ }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvFile(file.name);
      const contacts = parseCsv(text);
      setCsvContacts(contacts);
    };
    reader.readAsText(file);
  };

  const handleSend = async (channel: InviteChannel) => {
    if (!user?.id) return;
    setSending(true);
    try {
      if (channel === "link") {
        await handleCopy();
        return;
      }
      let contacts: CsvContact[] = [];
      if (channel === "email" && tab === "manual") {
        if (!isValidEmail(manualEmail)) return;
        contacts = [{ nom: manualName || undefined, email: manualEmail }];
      } else if (tab === "upload") {
        contacts = csvContacts;
      }
      if (contacts.length > 0) {
        await sendBulkInvites(user.id, channel, contacts.map((c) => ({ name: c.nom, email: c.email, phone: c.telephone })));
        setSent(true);
        setTimeout(() => setSent(false), 2500);
        loadData();
      }
    } finally {
      setSending(false);
    }
  };

  const handleWhatsApp = () => {
    if (!user?.id) return;
    const text = encodeURIComponent(`${t("invites.whatsappMessage")} ${inviteLink}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "8px 0", fontSize: 12, fontWeight: 600, textAlign: "center",
    background: active ? colors.accent : "transparent",
    color: active ? "#fff" : colors.textSecondary,
    border: "none", borderRadius: 8, cursor: "pointer",
    transition: "all 0.2s",
  });

  return (
    <Card variant="premium">
      <CardHeader
        icon={<ShareNetwork size={18} />}
        title={t("invites.title")}
        action={onViewAll && <Button variant="ghost" size="sm" onClick={onViewAll}>{t("common.viewAll")} →</Button>}
      />

      {stats && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {([
            { label: t("invites.sent"), value: stats.totalSent, icon: UsersThree, color: colors.accent },
            { label: t("invites.clicked"), value: stats.totalClicked, icon: TrendUp, color: colors.warning },
            { label: t("invites.registered"), value: stats.totalRegistered, icon: CheckCircle, color: colors.success },
          ] as const).map((s, i) => (
            <div key={i} style={{
              flex: 1, borderRadius: 10, padding: "10px 8px",
              background: colors.surfaceHover, textAlign: "center",
            }}>
              <s.icon size={16} color={s.color} style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>{s.value}</div>
              <div style={{ fontSize: 10, color: colors.textSecondary }}>{s.label}</div>
            </div>
          ))}
          <div style={{
            flex: 1, borderRadius: 10, padding: "10px 8px",
            background: colors.surfaceHover, textAlign: "center",
          }}>
            <TrendUp size={16} color={colors.accent} style={{ marginBottom: 4 }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>{stats.conversionRate}%</div>
            <div style={{ fontSize: 10, color: colors.textSecondary }}>{t("invites.conversion")}</div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 4, marginBottom: 14, background: colors.surfaceHover, borderRadius: 10, padding: 3 }}>
        {(["share", "upload", "manual"] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)} style={tabStyle(tab === k)}>
            {k === "share" ? <ShareNetwork size={14} style={{ verticalAlign: "middle", marginRight: 4 }} /> : k === "upload" ? <DownloadSimple size={14} style={{ verticalAlign: "middle", marginRight: 4 }} /> : <EnvelopeSimple size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />}
            {t(`invites.tab.${k}`)}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "share" && (
          <motion.div key="share" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            <div style={{
              display: "flex", gap: 8, padding: "10px 12px",
              background: colors.surfaceHover, borderRadius: 10, marginBottom: 10,
              border: `1px solid ${colors.borderLight}`,
            }}>
              <div style={{ flex: 1, fontSize: 12, color: colors.textSecondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: "32px" }}>
                {inviteLink || t("common.loading")}
              </div>
              <Button variant={copied ? "primary" : "secondary"} size="sm" onClick={handleCopy}>
                {copied ? <><CheckCircle size={14} /> {t("common.copied")}</> : <><Copy size={14} /> {t("common.copy")}</>}
              </Button>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="secondary" size="sm" onClick={handleWhatsApp} style={{ flex: 1 }}>
                <WhatsappLogo size={16} /> WhatsApp
              </Button>
              <Button variant="secondary" size="sm" onClick={() => {
                window.open(`mailto:?subject=${encodeURIComponent(t("invites.emailSubject"))}&body=${encodeURIComponent(`${t("invites.emailBody")} ${inviteLink}`)}`, "_blank");
              }} style={{ flex: 1 }}>
                <EnvelopeSimple size={16} /> Email
              </Button>
            </div>
          </motion.div>
        )}

        {tab === "upload" && (
          <motion.div key="upload" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleFileChange} />
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${csvContacts.length > 0 ? colors.success : colors.borderLight}`,
                borderRadius: 10, padding: "20px 16px", textAlign: "center", cursor: "pointer",
                background: csvContacts.length > 0 ? colors.successLight : "transparent",
                transition: "all 0.2s", marginBottom: 10,
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files[0];
                if (f) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    setCsvFile(f.name);
                    setCsvContacts(parseCsv(ev.target?.result as string));
                  };
                  reader.readAsText(f);
                }
              }}
            >
              <DownloadSimple size={24} color={csvContacts.length > 0 ? colors.success : colors.textSecondary} />
              <div style={{ fontSize: 12, fontWeight: 600, color: csvContacts.length > 0 ? colors.success : colors.textSecondary, marginTop: 6 }}>
                {csvContacts.length > 0
                  ? t("invites.csvLoaded", { count: csvContacts.length, file: csvFile })
                  : t("invites.csvPrompt")}
              </div>
              <div style={{ fontSize: 10, color: colors.textMuted, marginTop: 2 }}>{t("invites.csvHint")}</div>
            </div>
            {csvContacts.length > 0 && (
              <div style={{ maxHeight: 120, overflowY: "auto", marginBottom: 10, borderRadius: 8, border: `1px solid ${colors.borderLight}` }}>
                {csvContacts.slice(0, 6).map((c, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, padding: "6px 10px", fontSize: 11, borderBottom: i < Math.min(csvContacts.length, 6) - 1 ? `1px solid ${colors.borderLight}` : "none" }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: colors.accentLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <UsersThree size={12} color={colors.accent} />
                    </div>
                    <div style={{ flex: 1, color: colors.text }}>{c.nom || t("common.unknown")}</div>
                    <div style={{ color: colors.textSecondary }}>{c.email || c.telephone || "—"}</div>
                  </div>
                ))}
                {csvContacts.length > 6 && <div style={{ padding: "6px 10px", fontSize: 11, color: colors.textSecondary, textAlign: "center" }}>+{csvContacts.length - 6} {t("invites.more")}</div>}
              </div>
            )}
            <Button
              variant={csvContacts.length > 0 ? "primary" : "secondary"}
              size="sm"
              disabled={csvContacts.length === 0 || sending}
              onClick={() => handleSend("email")}
              style={{ width: "100%" }}
            >
              {sending ? t("common.sending") : sent ? <><CheckCircle size={14} /> {t("common.sent")}</> : t("invites.sendInvites", { count: csvContacts.length })}
            </Button>
          </motion.div>
        )}

        {tab === "manual" && (
          <motion.div key="manual" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
              <input
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder={t("invites.namePlaceholder")}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 12,
                  background: colors.surfaceHover, color: colors.text, border: `1px solid ${colors.borderLight}`,
                  outline: "none", boxSizing: "border-box",
                }}
              />
              <input
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                placeholder={t("invites.emailPlaceholder")}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8, fontSize: 12,
                  background: colors.surfaceHover, color: colors.text, border: `1px solid ${colors.borderLight}`,
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              disabled={!isValidEmail(manualEmail) || sending}
              onClick={() => handleSend("email")}
              style={{ width: "100%" }}
            >
              {sending ? t("common.sending") : sent ? <><CheckCircle size={14} /> {t("common.sent")}</> : t("invites.sendInvite")}
            </Button>
            {manualEmail && !isValidEmail(manualEmail) && (
              <div style={{ fontSize: 10, color: colors.error, marginTop: 4 }}>{t("invites.invalidEmail")}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <CardDivider />

      {history.length > 0 && (
        <div style={{ maxHeight: 100, overflowY: "auto" }}>
          {history.slice(0, 3).map((r, i) => (
            <div key={r.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "6px 0", fontSize: 11, color: colors.textSecondary,
              borderBottom: i < Math.min(history.length, 3) - 1 ? `1px solid ${colors.borderLight}` : "none",
            }}>
              <div>
                <span style={{ fontWeight: 600, color: colors.text }}>{r.recipientEmail || r.recipientPhone || t("common.unknown")}</span>
                <span style={{ marginLeft: 6, fontSize: 10, color: colors.textMuted }}>
                  {new Date(r.sentAt).toLocaleDateString()}
                </span>
              </div>
              <span style={{
                padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600,
                background: r.status === "registered" ? colors.successLight : r.status === "clicked" ? colors.warningLight : colors.surfaceHover,
                color: r.status === "registered" ? colors.success : r.status === "clicked" ? colors.warning : colors.textMuted,
              }}>
                {t(`invites.status.${r.status}`)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: history.length > 0 ? 8 : 0 }}>
        <Button variant="ghost" size="sm" onClick={onViewAll}>
          {t("invites.viewAll")} <CaretRight size={12} />
        </Button>
      </div>
    </Card>
  );
}
