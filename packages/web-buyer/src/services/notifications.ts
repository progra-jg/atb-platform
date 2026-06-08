import api from "./api";
import type { NotificationItem } from "../types";
import i18n from "../i18n";
import { getProducerFeed } from "./follow";

const NOTIF_STORAGE_KEY = "atb_notifications";
const SEEN_LOTS_KEY = "atb_seen_lots";

const MOCK_FR: NotificationItem[] = [
  { id: 1, title: "Lot certifié EUDR", desc: "ATB-2403-001 — Cacao, 5 000 kg certifié conforme EUDR", time: "12 min", unread: true },
  { id: 2, title: "Expédition en cours", desc: "ATB-2403-002 — Coton vers Cotonou, arrivée prévue demain", time: "1 h", unread: true },
  { id: 3, title: "Certificat expire bientôt", desc: "GlobalGAP — ATB-2403-001, expiration le 15/06/2026", time: "3 h", unread: false },
  { id: 4, title: "Nouveau lot disponible", desc: "ATB-2403-009 — Café, 1 200 kg, producteur Gisèle Hounkpatin", time: "1 j", unread: false },
  { id: 5, title: "Commande confirmée", desc: "CMD-2024-002 — Anacarde, 2 000 kg confirmée par le producteur", time: "2 j", unread: false },
  { id: 6, title: "Alerte prix Cacao", desc: "Le prix du Cacao a augmenté de +4.2% sur le marché", time: "3 j", unread: false },
  { id: 7, title: "Rapport mensuel disponible", desc: "Le rapport de traçabilité du mois de Mai est prêt", time: "5 j", unread: false },
];

const MOCK_EN: NotificationItem[] = [
  { id: 1, title: "EUDR Certified Lot", desc: "ATB-2403-001 — Cocoa, 5,000 kg certified EUDR compliant", time: "12 min", unread: true },
  { id: 2, title: "Shipment in progress", desc: "ATB-2403-002 — Cotton to Cotonou, arriving tomorrow", time: "1 h", unread: true },
  { id: 3, title: "Certificate expiring soon", desc: "GlobalGAP — ATB-2403-001, expires 15/06/2026", time: "3 h", unread: false },
  { id: 4, title: "New lot available", desc: "ATB-2403-009 — Coffee, 1,200 kg, producer Gisèle Hounkpatin", time: "1 d", unread: false },
  { id: 5, title: "Order confirmed", desc: "CMD-2024-002 — Cashew, 2,000 kg confirmed by producer", time: "2 d", unread: false },
  { id: 6, title: "Cocoa price alert", desc: "Cocoa price increased by +4.2% on the market", time: "3 d", unread: false },
  { id: 7, title: "Monthly report available", desc: "The May traceability report is ready", time: "5 d", unread: false },
];

let nextId = 100;

function getMock(): NotificationItem[] {
  return i18n.language === "en" ? MOCK_EN : MOCK_FR;
}

function getStored(): NotificationItem[] {
  try {
    const raw = localStorage.getItem(NOTIF_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function store(items: NotificationItem[]) {
  try { localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(items)); } catch { /* ignore */ }
}

function getSeenLots(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_LOTS_KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function markLotsSeen(lotIds: string[]) {
  try {
    const seen = getSeenLots();
    for (const id of lotIds) seen.add(id);
    localStorage.setItem(SEEN_LOTS_KEY, JSON.stringify([...seen]));
  } catch { /* ignore */ }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h`;
  return `${Math.floor(hrs / 24)} j`;
}

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms + Math.random() * ms));

export async function fetchNotifications(): Promise<NotificationItem[]> {
  let fromApi: NotificationItem[] = [];
  try {
    const { data } = await api.get("/notifications");
    fromApi = data;
  } catch {
    await delay();
    fromApi = [...getMock()];
  }

  const stored = getStored();
  const followItems: NotificationItem[] = [];

  if (i18n.language === "fr" || i18n.language === "en") {
    const feed = await getProducerFeed("current-user");
    const seen = getSeenLots();
    const isEn = i18n.language === "en";
    for (const item of feed) {
      if (seen.has(item.lotId)) continue;
      const id = nextId++;
      const n: NotificationItem = {
        id,
        title: isEn ? `New lot from ${item.farmerName}` : `Nouveau lot de ${item.farmerName}`,
        desc: `${item.lotId} — ${item.crop}, ${item.quantity}`,
        time: timeAgo(item.postedAt),
        unread: true,
      };
      followItems.push(n);
      stored.unshift(n);
    }
    if (followItems.length > 0) {
      markLotsSeen(feed.map((f) => f.lotId));
      store(stored);
    }
  }

  const merged = [...followItems, ...fromApi, ...stored];
  const seenIds = new Set<string | number>();
  const deduped: NotificationItem[] = [];
  for (const n of merged) {
    if (!seenIds.has(n.id)) {
      seenIds.add(n.id);
      deduped.push(n);
    }
  }
  return deduped.slice(0, 50);
}

export async function markAsRead(id: string | number): Promise<void> {
  try { await api.put(`/notifications/${id}/read`); } catch { /* silent */ }
  const stored = getStored();
  const idx = stored.findIndex((n) => n.id === id);
  if (idx >= 0) { stored[idx].unread = false; store(stored); }
}

export async function markAllAsRead(): Promise<void> {
  try { await api.put("/notifications/read-all"); } catch { /* silent */ }
  const stored = getStored().map((n) => ({ ...n, unread: false }));
  store(stored);
}

export function addNotification(n: { title: string; desc: string; time?: string }): void {
  const stored = getStored();
  const id = nextId++;
  stored.unshift({ id, title: n.title, desc: n.desc, time: n.time || "À l'instant", unread: true });
  store(stored);
}
