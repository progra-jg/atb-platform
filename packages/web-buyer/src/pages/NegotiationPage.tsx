import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import NegotiationWorkspace from "../components/NegotiationWorkspace";
import NegotiationListCard from "../components/NegotiationListCard";
import { listSessions } from "../services/negotiation";
import type { NegotiationSession } from "../types/negotiation";
import { ArrowsLeftRight, Plus } from "@phosphor-icons/react";

export default function NegotiationPage() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<NegotiationSession[]>([]);
  const [activeSession, setActiveSession] = useState<NegotiationSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;
    (async () => {
      try {
        const s = await listSessions(user.id);
        if (mounted) setSessions(s);
      } catch {
        if (mounted) setError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user?.id]);

  const handleSessionUpdate = (updated: NegotiationSession) => {
    setSessions((prev) => prev.map((s) => s.id === updated.id ? updated : s));
    setActiveSession(updated);
  };

  if (!user?.id) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px 60px", textAlign: "center" }}>
        <p className="text-sm text-gray-400">{t("negotiation.error.auth")}</p>
      </div>
    );
  }

  if (activeSession) {
    return (
      <div className="h-full flex flex-col" style={{ maxWidth: 1100, margin: "0 auto", width: "100%" }}>
        <NegotiationWorkspace
          session={activeSession}
          userId={user.id}
          userName={user.company ?? user.email}
          userRole="buyer"
          onBack={() => setActiveSession(null)}
          onSessionUpdate={handleSessionUpdate}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px 60px" }}>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <ArrowsLeftRight size={20} color="#fff" weight="bold" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: colors.text }}>
              {t("negotiation.pageTitle")}
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: colors.textMuted }}>
              {t("negotiation.pageDesc")}
            </p>
          </div>
        </div>
      </motion.div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
              <div className="w-10 h-10 bg-gray-100 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-32" />
                <div className="h-3 bg-gray-100 rounded w-48" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">{t("negotiation.error.load")}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
          >
            {t("common.retry")}
          </button>
        </div>
      )}

      {!loading && !error && sessions.length === 0 && (
        <div className="text-center py-16 px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
            <ArrowsLeftRight size={24} className="text-emerald-400" />
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">{t("negotiation.empty.title")}</p>
          <p className="text-xs text-gray-400 mb-4">{t("negotiation.empty.desc")}</p>
          <motion.button
            onClick={() => { /* navigate to a lot to start negotiating */ }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus size={14} weight="bold" />
            {t("negotiation.empty.cta")}
          </motion.button>
        </div>
      )}

      {!loading && !error && sessions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400">
              {sessions.filter((s) => s.status === "active").length} {t("negotiation.list.active")} · {sessions.length} total
            </p>
          </div>
          <AnimatePresence>
            {sessions.map((session) => (
              <NegotiationListCard
                key={session.id}
                session={session}
                userId={user.id}
                onClick={() => setActiveSession(session)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
