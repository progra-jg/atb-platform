import api from "./api";

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms + Math.random() * 400));

export async function getConversations(userId: string): Promise<any[]> {
  try { const { data } = await api.get(`/messages/${userId}`); return data; }
  catch { await delay(); return []; }
}

export async function getMessagesBetween(userId: string, otherId: string): Promise<any[]> {
  try { const { data } = await api.get(`/messages/${userId}/with/${otherId}`); return data; }
  catch { await delay(); return []; }
}

export async function sendMessage(dto: { senderId: string; receiverId: string; lotId?: string; message: string }): Promise<any> {
  const { data } = await api.post("/messages", dto);
  return data;
}

export async function getUnreadCount(userId: string): Promise<number> {
  try { const { data } = await api.get(`/messages/unread/${userId}`); return data; }
  catch { return 0; }
}

export async function markRead(id: string) {
  await api.patch(`/messages/${id}/read`);
}
