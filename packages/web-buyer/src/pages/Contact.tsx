import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";
import { PageTransition } from "../components/PageTransition";
import { useToast } from "../context/ToastContext";
import api from "../services/api";
import {
  Envelope, Phone, MapPin, Clock, PaperPlaneTilt, CheckCircle,
  FileArrowDown, Trash, CloudArrowUp, WifiSlash, Ticket,
  ClockCountdown, Shield,
} from "@phosphor-icons/react";

const DRAFT_KEY = "atb_contact_draft";
const RATE_LIMIT_KEY = "atb_contact_count";
const RATE_WINDOW = 3600000;
const MAX_RATE = 5;
const TOPIC_KEYS = ["general", "kyc", "payment", "eudr", "bug", "partnership"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf", "text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

function loadDraft(): any {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveDraft(data: any) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {}
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY); } catch {}
}

function canSubmit(): boolean {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    if (!raw) return true;
    const { count, resetAt } = JSON.parse(raw);
    if (Date.now() > resetAt) {
      localStorage.removeItem(RATE_LIMIT_KEY);
      return true;
    }
    return count < MAX_RATE;
  } catch { return true; }
}

function incrementRate() {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    let entry = raw ? JSON.parse(raw) : { count: 0, resetAt: Date.now() + RATE_WINDOW };
    if (Date.now() > entry.resetAt) {
      entry = { count: 0, resetAt: Date.now() + RATE_WINDOW };
    }
    entry.count++;
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(entry));
  } catch {}
}

function getRateRemaining(): number {
  try {
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    if (!raw) return MAX_RATE;
    const { count, resetAt } = JSON.parse(raw);
    if (Date.now() > resetAt) return MAX_RATE;
    return Math.max(0, MAX_RATE - count);
  } catch { return MAX_RATE; }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1048576).toFixed(1)} Mo`;
}

interface AttachFile {
  id: string;
  name: string;
  size: number;
  type: string;
  preview?: string;
  base64?: string;
}

export default function Contact() {
  const { t } = useTranslation();
  const { isDark, colors } = useTheme();
  const toast = useToast();

  const [form, setForm] = useState(() => loadDraft() || { name: "", email: "", topic: TOPIC_KEYS[0], message: "" });
  const [topic, setTopic] = useState(form.topic || TOPIC_KEYS[0]);
  const [sent, setSent] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [honeypot] = useState(() => Math.random().toString(36).slice(2, 8));
  const [hoverTopic, setHoverTopic] = useState<string | null>(null);
  const [files, setFiles] = useState<AttachFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [restored, setRestored] = useState(false);
  const [rateRemaining, setRateRemaining] = useState(getRateRemaining());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => setVisible(true), []);

  useEffect(() => {
    const handler = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", handler);
    window.addEventListener("offline", handler);
    return () => {
      window.removeEventListener("online", handler);
      window.removeEventListener("offline", handler);
    };
  }, []);

  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      saveDraft({ ...form, topic });
    }, 1200);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [form, topic]);

  useEffect(() => {
    if (!restored && form.name && !sent) {
      setRestored(true);
    }
  }, [form, sent, restored]);

  const handleFileDrop = useCallback(async (items: DataTransferItemList | FileList) => {
    const newFiles: AttachFile[] = [];
    const processFile = async (file: File) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.warning(`${file.name} : format non supporté.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.warning(`${file.name} : dépasse 5 Mo.`);
        return;
      }
      const id = crypto.randomUUID();
      let preview: string | undefined;
      if (file.type.startsWith("image/")) {
        preview = URL.createObjectURL(file);
      }
      newFiles.push({ id, name: file.name, size: file.size, type: file.type, preview });
    };
    const promises: Promise<void>[] = [];
    const files: File[] = [];
    if (items instanceof FileList) {
      for (let i = 0; i < items.length; i++) files.push(items[i]);
    } else {
      for (let i = 0; i < items.length; i++) {
        const f = items[i].getAsFile();
        if (f) files.push(f);
      }
    }
    for (const f of files) promises.push(processFile(f));
    await Promise.all(promises);
    setFiles((prev) => [...prev, ...newFiles].slice(0, 5));
  }, [toast]);

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error(t("contact.formError"));
      return;
    }

    if (!isOnline) {
      toast.warning(t("contact.offlineQueue"));
      const queue = JSON.parse(localStorage.getItem("atb_contact_queue") || "[]");
      queue.push({ ...form, topic, files, queuedAt: new Date().toISOString() });
      localStorage.setItem("atb_contact_queue", JSON.stringify(queue));
      setSent(true);
      setTicketId("OFFLINE-" + Date.now().toString(36).toUpperCase());
      return;
    }

    if (!canSubmit()) {
      toast.error(t("contact.rateLimited"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/contact", {
        name: form.name,
        email: form.email,
        topic,
        message: form.message,
        [honeypot]: "",
        files: files.map((f) => ({ name: f.name, type: f.type, size: f.size })),
      });
      incrementRate();
      setRateRemaining(getRateRemaining());
      setTicketId(res.data.ticketId);
      setSent(true);
      clearDraft();
      toast.success(t("contact.successTitle"));
    } catch (err: any) {
      const msg = err.response?.data?.message || t("contact.submitError") || "Erreur lors de l'envoi.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const validated = form.name.trim().length > 0 && form.email.includes("@") && form.message.trim().length > 0;

  const fadeUp = (d: number) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(16px)",
    transition: `opacity 400ms cubic-bezier(0.16,1,0.3,1) ${d}ms, transform 400ms cubic-bezier(0.16,1,0.3,1) ${d}ms`,
  });

  const inputStyle = {
    width: "100%", padding: "11px 14px", borderRadius: 10,
    border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
    background: isDark ? "rgba(255,255,255,0.04)" : "white",
    color: "var(--color-text)", fontSize: 13, outline: "none",
    fontFamily: "inherit", transition: "all 0.2s",
  };

  return (
    <PageTransition>
      <div style={{ minHeight: "100vh", background: isDark ? "#070b09" : "#f4f6f5" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "60px 24px 100px" }}>
          <div style={{ textAlign: "center", ...fadeUp(0) }}>
            {!isOnline && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 12,
                padding: "4px 12px", borderRadius: 100,
                background: isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.1)",
                color: "#ef4444", fontSize: 11, fontWeight: 600,
              }}>
                <WifiSlash size={12} weight="bold" />
                {t("contact.offline") || "Hors ligne — message mis en file d'attente"}
              </div>
            )}
            {restored && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 12,
                padding: "4px 12px", borderRadius: 100,
                background: isDark ? "rgba(245,158,11,0.15)" : "rgba(245,158,11,0.1)",
                color: "#f59e0b", fontSize: 11, fontWeight: 600,
              }}>
                <ClockCountdown size={12} weight="bold" />
                {t("contact.draftRestored") || "Brouillon restauré"}
              </div>
            )}
            {rateRemaining <= 2 && (
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 12,
                padding: "4px 12px", borderRadius: 100,
                background: isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.1)",
                color: "#ef4444", fontSize: 11, fontWeight: 600,
              }}>
                <Shield size={12} weight="bold" />
                {t("contact.rateLimitWarn") || `${rateRemaining} envoi(s) restant`}
              </div>
            )}
            <h1 style={{
              fontSize: 32, fontWeight: 800, marginBottom: 8,
              background: "linear-gradient(135deg, #0a6e4a, #34d399)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              {t("contact.title")}
            </h1>
            <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 40, maxWidth: 450, margin: "0 auto 40px" }}>
              {t("contact.subtitle")}
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { icon: Envelope, title: t("contact.email"), desc: "support@agritrace.bj", note: "Réponse sous 24h" },
                { icon: Phone, title: t("contact.phone"), desc: "+229 01 23 45 67 89", note: "Lun-Ven 8h-18h" },
                { icon: MapPin, title: t("contact.address"), desc: "Cotonou, Bénin", note: null },
                { icon: Clock, title: t("contact.hours"), desc: t("contact.hoursValue"), note: "UTC+1" },
              ].map((item, i) => (
                <div key={i} style={{
                  ...fadeUp(100 + i * 50), padding: 20, borderRadius: 14,
                  background: isDark ? "rgba(255,255,255,0.02)" : "white",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                  display: "flex", alignItems: "center", gap: 14,
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: isDark ? "rgba(52,211,153,0.1)" : "rgba(10,110,74,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: isDark ? "#34d399" : "#0a6e4a",
                  }}>
                    <item.icon size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", marginBottom: 2 }}>{item.title}</p>
                    <p style={{ fontSize: 13, color: "var(--color-text-secondary)", fontWeight: 500 }}>{item.desc}</p>
                    {item.note && (
                      <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>{item.note}</p>
                    )}
                  </div>
                </div>
              ))}

              <div style={{
                ...fadeUp(300), padding: 16, borderRadius: 14,
                background: isDark ? "rgba(52,211,153,0.04)" : "rgba(10,110,74,0.03)",
                border: `1px solid ${isDark ? "rgba(52,211,153,0.1)" : "rgba(10,110,74,0.08)"}`,
                fontSize: 12, color: "var(--color-text-secondary)", lineHeight: 1.6,
              }}>
                <p style={{ fontWeight: 600, marginBottom: 4, color: isDark ? "#34d399" : "#0a6e4a" }}>
                  <Ticket size={14} style={{ verticalAlign: "middle", marginRight: 4 }} weight="bold" />
                  {t("contact.responsePolicy") || "Politique de réponse"}
                </p>
                <p>{t("contact.responsePolicyDesc") || "Notre équipe traite les demandes par ordre d'arrivée. Chaque message reçoit un numéro de ticket unique. Les demandes EUDR et KYC sont prioritaires."}</p>
              </div>
            </div>

            <div style={fadeUp(100)}>
              {sent ? (
                <div style={{
                  textAlign: "center", padding: "48px 32px", borderRadius: 14,
                  background: isDark ? "rgba(255,255,255,0.02)" : "white",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 20, margin: "0 auto 16px",
                    background: isDark ? "rgba(52,211,153,0.12)" : "rgba(10,110,74,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <CheckCircle size={36} color="#34d399" weight="fill" />
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--color-text)", marginBottom: 6 }}>
                    {t("contact.successTitle")}
                  </h3>
                  <p style={{ fontSize: 13, color: "var(--color-text-secondary)", marginBottom: ticketId ? 4 : 16 }}>
                    {t("contact.successDesc")}
                  </p>
                  {ticketId && (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "6px 16px", borderRadius: 8, marginBottom: 12,
                      background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                      fontSize: 13, fontWeight: 700, fontFamily: "monospace",
                      color: "var(--color-text)",
                    }}>
                      <Ticket size={16} weight="bold" color="#34d399" />
                      {ticketId}
                    </div>
                  )}
                  {ticketId?.startsWith("OFFLINE") && (
                    <p style={{ fontSize: 11, color: "#f59e0b", marginBottom: 12 }}>
                      <WifiSlash size={12} style={{ verticalAlign: "middle", marginRight: 4 }} />
                      {t("contact.offlineQueued") || "Envoyé dès retour en ligne."}
                    </p>
                  )}
                  <div style={{ marginTop: 20 }}>
                    <a href="/" style={{
                      padding: "10px 24px", borderRadius: 10,
                      background: "var(--color-accent-gradient)", color: "white",
                      fontWeight: 600, fontSize: 13, textDecoration: "none",
                      display: "inline-flex", alignItems: "center", gap: 8,
                    }}>
                      {t("contact.backHome") || "Retour à l'accueil"}
                    </a>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{
                  padding: 28, borderRadius: 14,
                  background: isDark ? "rgba(255,255,255,0.02)" : "white",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                  display: "flex", flexDirection: "column", gap: 14,
                }}>
                  <input type="text" name={honeypot} value="" readOnly
                    style={{ position: "absolute", left: "-9999px", top: "-9999px", opacity: 0.01, height: 0, width: 0 }}
                    tabIndex={-1} autoComplete="off" />

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)", marginBottom: 6, display: "block" }}>
                      {t("contact.formName")} <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required maxLength={200} style={{
                        ...inputStyle,
                        borderColor: form.name && form.name.length < 2 && form.name.length > 0 ? "#ef4444" : undefined,
                      }}
                      placeholder={t("contact.formNamePlaceholder") || "Jean Dupont"} />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)", marginBottom: 6, display: "block" }}>
                      {t("contact.formEmail")} <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required maxLength={254} style={{
                        ...inputStyle,
                        borderColor: form.email && !form.email.includes("@") && form.email.length > 3 ? "#ef4444" : undefined,
                      }}
                      placeholder="jean@exemple.com" />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)", marginBottom: 6, display: "block" }}>
                      {t("contact.formTopic")}
                    </label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {TOPIC_KEYS.map((k) => {
                        const key = `contact.topic${k.charAt(0).toUpperCase() + k.slice(1)}`;
                        const selected = topic === k;
                        return (
                          <button key={k} type="button" onClick={() => setTopic(k)}
                            onMouseEnter={() => setHoverTopic(k)}
                            onMouseLeave={() => setHoverTopic(null)}
                            style={{
                              padding: "6px 14px", borderRadius: 100, border: "none",
                              cursor: "pointer", fontSize: 12, fontWeight: 600,
                              fontFamily: "inherit", transition: "all 0.2s",
                              background: selected
                                ? "var(--color-accent-gradient)"
                                : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"),
                              color: selected ? "white" : "var(--color-text-secondary)",
                              transform: (selected || hoverTopic === k) ? "scale(1.03)" : "scale(1)",
                              boxShadow: selected ? "0 2px 8px rgba(10,110,74,0.3)" : "none",
                            }}
                          >
                            {t(key)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)", marginBottom: 6, display: "block" }}>
                      {t("contact.formMessage")} <span style={{ color: "#ef4444" }}>*</span>
                      <span style={{ fontWeight: 400, fontSize: 11, color: "var(--color-text-muted)", marginLeft: 8 }}>
                        {form.message.length}/5000
                      </span>
                    </label>
                    <textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value.slice(0, 5000) })}
                      required style={{ ...inputStyle, resize: "vertical", minHeight: 100 }}
                      placeholder={t("contact.formMessagePlaceholder") || "Décrivez votre demande..."} />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text)", marginBottom: 6, display: "block" }}>
                      {t("contact.attachments") || "Pièces jointes"}
                      <span style={{ fontWeight: 400, fontSize: 11, color: "var(--color-text-muted)", marginLeft: 8 }}>
                        {t("contact.maxFiles") || "max 5 fichiers, 5 Mo chacun"}
                      </span>
                    </label>
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileDrop(e.dataTransfer.items); }}
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        padding: "20px", borderRadius: 10, cursor: "pointer",
                        textAlign: "center", transition: "all 0.2s",
                        border: `2px dashed ${dragOver ? "#34d399" : (isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)")}`,
                        background: dragOver
                          ? (isDark ? "rgba(52,211,153,0.06)" : "rgba(10,110,74,0.04)")
                          : "transparent",
                      }}
                    >
                      {files.length === 0 ? (
                        <div style={{ color: "var(--color-text-muted)", fontSize: 12 }}>
                          <CloudArrowUp size={28} style={{ marginBottom: 6, opacity: 0.5 }} />
                          <p>{t("contact.dropFiles") || "Glissez-déposez vos fichiers ici"}</p>
                          <p style={{ fontSize: 11, marginTop: 4 }}>{t("contact.clickToBrowse") || "ou cliquez pour parcourir"}</p>
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {files.map((f) => (
                            <div key={f.id} style={{
                              display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
                              borderRadius: 8, fontSize: 12,
                              background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                            }}>
                              {f.preview ? (
                                <img src={f.preview} alt="" style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover" }} />
                              ) : (
                                <FileArrowDown size={20} opacity={0.5} />
                              )}
                              <div style={{ flex: 1, textAlign: "left" }}>
                                <p style={{ fontWeight: 600, color: "var(--color-text)" }}>{f.name}</p>
                                <p style={{ fontSize: 10, color: "var(--color-text-muted)" }}>{formatFileSize(f.size)}</p>
                              </div>
                              <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                                style={{
                                  background: "none", border: "none", cursor: "pointer",
                                  color: "#ef4444", padding: 2,
                                }}>
                                <Trash size={14} />
                              </button>
                            </div>
                          ))}
                          <p style={{ fontSize: 11, color: "var(--color-text-muted)", cursor: "pointer" }}>
                            {t("contact.addMoreFiles") || "Ajouter d'autres fichiers"}
                          </p>
                        </div>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" multiple
                      accept={ALLOWED_TYPES.join(",")}
                      style={{ display: "none" }}
                      onChange={(e) => { if (e.target.files) handleFileDrop(e.target.files); }} />
                  </div>

                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    fontSize: 11, color: "var(--color-text-muted)", padding: "4px 0",
                  }}>
                    <Shield size={12} />
                    <span>{t("contact.dataProtection") || "Vos données sont protégées par notre politique de confidentialité."}</span>
                  </div>

                  <button type="submit" disabled={!validated || submitting}
                    style={{
                      padding: "12px 24px", borderRadius: 10, border: "none",
                      background: validated && !submitting
                        ? "var(--color-accent-gradient)"
                        : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"),
                      color: validated && !submitting ? "white" : "var(--color-text-muted)",
                      fontWeight: 700, fontSize: 13, cursor: validated && !submitting ? "pointer" : "not-allowed",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      transition: "all 0.2s", opacity: submitting ? 0.7 : 1,
                    }}
                    onMouseEnter={(e) => { if (validated && !submitting) e.currentTarget.style.opacity = "0.9"; }}
                    onMouseLeave={(e) => { if (validated && !submitting) e.currentTarget.style.opacity = "1"; }}
                  >
                    {submitting ? (
                      <><span style={{
                        display: "inline-block", width: 14, height: 14, borderRadius: "50%",
                        border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white",
                        animation: "spin 0.6s linear infinite",
                      }} /> {t("contact.sending") || "Envoi en cours..."}</>
                    ) : (
                      <><PaperPlaneTilt size={16} /> {t("contact.formSend")}</>
                    )}
                  </button>

                  {restored && (
                    <button type="button" onClick={() => { clearDraft(); setForm({ name: "", email: "", message: "" }); setTopic(TOPIC_KEYS[0]); setFiles([]); setRestored(false); }}
                      style={{
                        padding: "8px", borderRadius: 8, border: "none", cursor: "pointer",
                        fontSize: 11, fontWeight: 600, fontFamily: "inherit",
                        background: "none", color: "var(--color-text-muted)",
                      }}>
                      {t("contact.clearDraft") || "Effacer le brouillon"}
                    </button>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
