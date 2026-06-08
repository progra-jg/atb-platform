import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export type SoirBulletinItem = {
  produit: string;
  region: string;
  prixProducteur: number;
  prixAcheteur: number;
  spread: number;
  tendance: "hausse" | "baisse" | "stable";
  volume: number;
};

export type SoirPreferences = {
  actif: boolean;
  produits: string[];
  regions: string[];
  heureEnvoi: string;
};

const DEFAULT_PREFS: SoirPreferences = {
  actif: true,
  produits: [],
  regions: [],
  heureEnvoi: "18:00",
};

const BULLETIN_MOCK: SoirBulletinItem[] = [
  { produit: "Maïs blanc", region: "Donga", prixProducteur: 180, prixAcheteur: 204, spread: 24, tendance: "stable", volume: 15000 },
  { produit: "Soja", region: "Alibori", prixProducteur: 250, prixAcheteur: 280, spread: 30, tendance: "hausse", volume: 22000 },
  { produit: "Cacao bio", region: "Couffo", prixProducteur: 1500, prixAcheteur: 1660, spread: 160, tendance: "hausse", volume: 4500 },
  { produit: "Anacarde", region: "Borgou", prixProducteur: 650, prixAcheteur: 720, spread: 70, tendance: "hausse", volume: 12000 },
  { produit: "Riz paddy", region: "Ouémé", prixProducteur: 210, prixAcheteur: 238, spread: 28, tendance: "baisse", volume: 18000 },
];

function getEmoji(t: string) {
  if (t === "hausse") return "📈"; if (t === "baisse") return "📉"; return "➡️";
}

export function formatBulletinMessage(items: SoirBulletinItem[]): string {
  const date = new Date().toLocaleDateString("fr-FR");
  let msg = `🌾 *Marché du Soir — ${date}*\n\n`;
  msg += `📊 *Bulletin des Prix AgriTrace*\n`;
  msg += `─────────────────────\n\n`;
  for (const p of items) {
    msg += `${getEmoji(p.tendance)} *${p.produit}* (${p.region})\n`;
    msg += `   Producteur: ${p.prixProducteur.toLocaleString()} FCFA\n`;
    msg += `   Acheteur:   ${p.prixAcheteur.toLocaleString()} FCFA\n`;
    msg += `   Spread:     ${p.spread.toLocaleString()} FCFA\n`;
    msg += `   Volume:     ${p.volume.toLocaleString()} t\n\n`;
  }
  msg += `─────────────────────\n`;
  msg += `🔒 Prix sécurisés par AgriTrace\n`;
  msg += `💬 Répondez STOP pour vous désabonner`;
  return msg;
}

export function formatBulletinSms(items: SoirBulletinItem[]): string {
  const date = new Date().toLocaleDateString("fr-FR");
  let sms = `Marche du Soir ${date}: `;
  for (const p of items) {
    sms += `${p.produit} ${p.prixProducteur}/${p.prixAcheteur}FCFA (${p.tendance}) | `;
  }
  sms += `AgriTrace`;
  return sms;
}

export function formatBulletinUssd(items: SoirBulletinItem[]): string {
  let ussd = `*123*MARCHE#\n`;
  for (const p of items.slice(0, 3)) {
    ussd += `${p.produit}: ${p.prixAcheteur}F/kg ${p.tendance}\n`;
  }
  ussd += `AgriTrace`;
  return ussd;
}

export async function triggerBulletinPush(items: SoirBulletinItem[] = BULLETIN_MOCK): Promise<void> {
  if (Platform.OS === "web") return;
  const message = formatBulletinMessage(items);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🌾 Marché du Soir — Bulletin des Prix",
      body: message.substring(0, 200),
      data: { type: "marche_soir", items },
      sticky: false,
    },
    trigger: null,
  });
}

export async function scheduleEveningBulletin(
  items: SoirBulletinItem[] = BULLETIN_MOCK,
  hour: number = 18,
  minute: number = 0
): Promise<string> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "🌾 Marché du Soir — Bulletin des Prix",
      body: `Bulletin du ${new Date().toLocaleDateString("fr-FR")} — ${items.length} produits suivis`,
      data: { type: "marche_soir", items },
      sticky: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
  return id;
}

export function getDefaultBulletin(): SoirBulletinItem[] {
  return BULLETIN_MOCK;
}

export function getDefaultPreferences(): SoirPreferences {
  return DEFAULT_PREFS;
}
