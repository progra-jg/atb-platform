import api from "./api";
import type { InviteRecord, InviteStats, InviteChannel } from "../types/invite";

const INVITE_STORE = new Map<string, InviteRecord[]>();

const delay = (ms = 300) => new Promise((r) => setTimeout(r, ms + Math.random() * ms));

function generateId(): string {
  return `INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function sendInvite(
  referrerId: string,
  channel: InviteChannel,
  recipient?: { name?: string; email?: string; phone?: string },
): Promise<InviteRecord> {
  try {
    const { data } = await api.post("/invites/send", { referrerId, channel, recipient });
    return data;
  } catch {
    await delay(400);
    const record: InviteRecord = {
      id: generateId(),
      channel,
      recipientEmail: recipient?.email,
      recipientPhone: recipient?.phone,
      recipientName: recipient?.name,
      status: "sent",
      sentAt: new Date().toISOString(),
      referrerId,
    };
    const list = INVITE_STORE.get(referrerId) ?? [];
    list.push(record);
    INVITE_STORE.set(referrerId, list);
    return record;
  }
}

export async function sendBulkInvites(
  referrerId: string,
  channel: InviteChannel,
  recipients: { name?: string; email?: string; phone?: string }[],
): Promise<InviteRecord[]> {
  try {
    const { data } = await api.post("/invites/bulk", { referrerId, channel, recipients });
    return data;
  } catch {
    await delay(600);
    const records: InviteRecord[] = [];
    for (const r of recipients) {
      records.push({
        id: generateId(),
        channel,
        recipientEmail: r.email,
        recipientPhone: r.phone,
        recipientName: r.name,
        status: "sent",
        sentAt: new Date().toISOString(),
        referrerId,
      });
    }
    const list = INVITE_STORE.get(referrerId) ?? [];
    list.push(...records);
    INVITE_STORE.set(referrerId, list);
    return records;
  }
}

export async function generateInviteLink(referrerId: string): Promise<string> {
  try {
    const { data } = await api.get(`/invites/link/${referrerId}`);
    return data.link;
  } catch {
    await delay(200);
    const code = referrerId.slice(0, 6).toUpperCase();
    return `${window.location.origin}/register?ref=${code}`;
  }
}

export async function getInviteStats(userId: string): Promise<InviteStats> {
  try {
    const { data } = await api.get(`/invites/${userId}/stats`);
    return data;
  } catch {
    await delay(200);
    const list = INVITE_STORE.get(userId) ?? [];
    const totalSent = list.length;
    const totalClicked = list.filter((i) => i.status === "clicked" || i.status === "registered").length;
    const totalRegistered = list.filter((i) => i.status === "registered").length;
    return {
      totalSent,
      totalClicked,
      totalRegistered,
      conversionRate: totalSent > 0 ? Math.round((totalRegistered / totalSent) * 100) : 0,
    };
  }
}

export async function getInviteHistory(userId: string): Promise<InviteRecord[]> {
  try {
    const { data } = await api.get(`/invites/${userId}/history`);
    return data;
  } catch {
    await delay(150);
    return INVITE_STORE.get(userId) ?? [];
  }
}
