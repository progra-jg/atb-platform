import { getStreakState } from "./streak";
import { requestNotificationPermission } from "./pushNotifications";

const NOTIF_SENT_KEY = "atb_streak_notif_sent_today";
const LAST_ACTIVE_KEY = "atb_streak_last_active";

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getActiveHour(): number {
  try {
    const last = localStorage.getItem(LAST_ACTIVE_KEY);
    if (!last) return 18;
    const h = new Date(last).getHours();
    return h < 6 ? 18 : h;
  } catch {
    return 18;
  }
}

function scheduleNext(): void {
  const now = new Date();
  const targetHour = getActiveHour();
  const target = new Date(now);
  target.setHours(targetHour, 0, 0, 0);

  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  const delay = target.getTime() - now.getTime();
  setTimeout(() => {
    triggerReminder();
  }, delay);
}

function triggerReminder(): void {
  const todayStr = today();
  const sentToday = localStorage.getItem(NOTIF_SENT_KEY) === todayStr;
  if (sentToday || !("Notification" in window) || Notification.permission !== "granted") return;

  const state = getStreakState();
  if (state.isActiveToday) return;

  const streak = state.streak;
  let title = "🔥 Revenez sur ATB !";
  let body = "Votre série de connexion va expirer. Connectez-vous dès aujourd'hui pour la maintenir !";

  if (streak > 0) {
    title = `🔥 J+${streak} — Ne perdez pas votre série !`;
    body = `Vous êtes à ${streak} jours consécutifs. Un jour sans connexion et vous repartez à zéro.`;
  }

  if (state.atRiskDays >= 2 && state.freezes > 0) {
    body += ` Utilisez un gel gratuit (${state.freezes} disponible${state.freezes > 1 ? "s" : ""}).`;
  }

  try {
    const notif = new Notification(title, {
      body,
      icon: "/android-chrome-192x192.png",
      badge: "/favicon.ico",
      tag: "streak-reminder",
      requireInteraction: true,
    });
    notif.addEventListener("click", () => {
      window.focus();
      notif.close();
    });
    localStorage.setItem(NOTIF_SENT_KEY, todayStr);
  } catch {
    /* notification may fail */
  }
}

function recordActivity(): void {
  localStorage.setItem(LAST_ACTIVE_KEY, new Date().toISOString());
  localStorage.removeItem(NOTIF_SENT_KEY);
}

let initialized = false;

export function initStreakReminders(): void {
  if (initialized) return;
  initialized = true;

  if (!("Notification" in window) || Notification.permission === "denied") return;
  if (Notification.permission !== "granted") {
    requestNotificationPermission().then((granted) => {
      if (granted) scheduleNext();
    });
    return;
  }

  recordActivity();
  scheduleNext();
}

export function checkStreakReminderNow(): void {
  triggerReminder();
}
