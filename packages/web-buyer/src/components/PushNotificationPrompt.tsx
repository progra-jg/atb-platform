import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, SealCheck, X, BellRinging } from "@phosphor-icons/react";
import { requestNotificationPermission, subscribeToPush, getPushSupport } from "../services/pushNotifications";

const DISMISSED_KEY = "atb_push_dismissed";
const SESSION_COUNT_KEY = "atb_push_session_count";

type View = "prompt" | "success" | "denied";

interface Props {
  /** When true, show immediately (used after onboarding) */
  force?: boolean;
  /** Called after user responds */
  onComplete?: (granted: boolean) => void;
}

export default function PushNotificationPrompt({ force, onComplete }: Props) {
  const { t } = useTranslation();
  const [view, setView] = useState<View>("prompt");
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (force) { setVisible(true); return; }
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed === "true") return;
    const support = getPushSupport();
    if (!support.supported || support.permission === "granted" || support.permission === "denied") return;
    let count = 0;
    try { count = Number(localStorage.getItem(SESSION_COUNT_KEY) ?? "0"); } catch { /* noop */ }
    count += 1;
    localStorage.setItem(SESSION_COUNT_KEY, String(count));
    if (count >= 2) setVisible(true);
  }, [force]);

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setVisible(false);
    onComplete?.(false);
  };

  const handleEnable = async () => {
    setAnimating(true);
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        await subscribeToPush();
        setView("success");
      } else {
        setView("denied");
      }
      onComplete?.(granted);
    } catch {
      setView("denied");
    } finally {
      setAnimating(false);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="relative overflow-hidden"
        >
          {view === "prompt" && (
            <div className="bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl p-4 text-white shadow-lg">
              <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <X size={12} weight="bold" />
              </button>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <BellRinging size={20} weight="fill" />
                </div>
                <div>
                  <p className="text-sm font-bold">{t("push.title")}</p>
                  <p className="text-[11px] text-indigo-100">{t("push.subtitle")}</p>
                </div>
              </div>

              <div className="space-y-1.5 mb-3">
                {[
                  t("push.benefit1"),
                  t("push.benefit2"),
                  t("push.benefit3"),
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-indigo-100">
                    <SealCheck size={12} weight="fill" className="text-indigo-200 flex-shrink-0" />
                    {b}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <motion.button
                  onClick={handleEnable}
                  disabled={animating}
                  className="flex-1 py-2 bg-white text-indigo-700 text-sm font-semibold rounded-lg hover:bg-indigo-50 disabled:opacity-70 transition-colors flex items-center justify-center gap-1.5"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {animating ? (
                    <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Bell size={14} weight="fill" />
                  )}
                  {t("push.activate")}
                </motion.button>
                <button
                  onClick={handleDismiss}
                  className="px-3 py-2 text-xs text-indigo-200 hover:text-white transition-colors"
                >
                  {t("push.later")}
                </button>
              </div>
            </div>
          )}

          {view === "success" && (
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <SealCheck size={20} weight="fill" />
                </div>
                <div>
                  <p className="text-sm font-bold">{t("push.success")}</p>
                  <p className="text-[11px] text-emerald-100">{t("push.successDesc")}</p>
                </div>
              </div>
            </div>
          )}

          {view === "denied" && (
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-4 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <Bell size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold">{t("push.denied")}</p>
                  <p className="text-[11px] text-amber-100">{t("push.deniedDesc")}</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="text-xs text-amber-200 hover:text-white transition-colors"
              >
                {t("push.later")}
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
