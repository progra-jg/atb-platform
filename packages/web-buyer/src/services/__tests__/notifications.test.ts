import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchNotifications, markAsRead, markAllAsRead } from "../notifications";

vi.mock("../api", () => ({
  default: {
    get: vi.fn(() => Promise.reject(new Error("Network error"))),
    put: vi.fn(() => Promise.reject(new Error("Network error"))),
  },
}));

vi.mock("../follow", () => ({
  getProducerFeed: vi.fn(() => Promise.resolve([])),
}));

vi.mock("../../i18n", () => ({
  default: { language: "fr" },
}));

const NOTIF_KEY = "atb_notifications";
const SEEN_KEY = "atb_seen_lots";

function seedStorage(data: any, key: string) {
  localStorage.setItem(key, JSON.stringify(data));
}

function getStorage(key: string) {
  try { return JSON.parse(localStorage.getItem(key) ?? "null"); } catch { return null; }
}

describe("fetchNotifications", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns mock notifications when API fails", async () => {
    const items = await fetchNotifications();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].title).toBeDefined();
    expect(items[0].desc).toBeDefined();
  });

  it("all notifications have required fields", async () => {
    const items = await fetchNotifications();
    for (const n of items) {
      expect(n.id).toBeDefined();
      expect(n.title).toBeDefined();
      expect(n.desc).toBeDefined();
      expect(n.time).toBeDefined();
      expect(typeof n.unread).toBe("boolean");
    }
  });

  it("uses API when available", async () => {
    const api = await import("../api");
    vi.mocked(api.default.get).mockResolvedValueOnce({
      data: [
        { id: "api-1", title: "API Notif", desc: "From API", time: "1 min", unread: true },
      ],
    });
    const items = await fetchNotifications();
    const apiItems = items.filter((n) => n.id === "api-1");
    expect(apiItems.length).toBe(1);
    expect(apiItems[0].title).toBe("API Notif");
  });

  it("limits to 50 items", async () => {
    const many = Array.from({ length: 100 }, (_, i) => ({
      id: 10000 + i, title: `Notif ${i}`, desc: `Desc ${i}`, time: "1 h", unread: true,
    }));
    seedStorage(many, NOTIF_KEY);
    const items = await fetchNotifications();
    expect(items.length).toBeLessThanOrEqual(50);
  });

  it("does not include duplicates by id", async () => {
    seedStorage([{ id: 1, title: "Dupe", desc: "Already in storage", time: "5 min", unread: false }], NOTIF_KEY);
    const items = await fetchNotifications();
    const dupes = items.filter((n) => n.id === 1);
    expect(dupes.length).toBe(1);
  });

  it("includes follow notifications when feed has items", async () => {
    const follow = await import("../follow");
    vi.mocked(follow.getProducerFeed).mockResolvedValueOnce([
      { farmerId: "F-001", farmerName: "Koffi", farmerAvatar: "KO", lotId: "LOT-NEW-1", crop: "Cacao", quantity: "2 000 kg", price: 1200, postedAt: new Date().toISOString(), status: "Disponible" },
    ]);
    const items = await fetchNotifications();
    const followItems = items.filter((n) => n.title.includes("Koffi"));
    expect(followItems.length).toBe(1);
    expect(followItems[0].unread).toBe(true);
  });

  it("marks follow-generated lots as seen in localStorage", async () => {
    const follow = await import("../follow");
    vi.mocked(follow.getProducerFeed).mockResolvedValueOnce([
      { farmerId: "F-002", farmerName: "Amadou", farmerAvatar: "AM", lotId: "LOT-SEEN-1", crop: "Coton", quantity: "5 000 kg", price: 800, postedAt: new Date().toISOString(), status: "Disponible" },
    ]);
    await fetchNotifications();
    const seen = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]");
    expect(seen).toContain("LOT-SEEN-1");
  });

  it("does not re-add seen lots on second call", async () => {
    const follow = await import("../follow");
    vi.mocked(follow.getProducerFeed).mockResolvedValue([
      { farmerId: "F-003", farmerName: "Moussa", farmerAvatar: "MO", lotId: "LOT-SEEN-2", crop: "Riz", quantity: "1 000 kg", price: 500, postedAt: new Date().toISOString(), status: "Disponible" },
    ]);
    const first = await fetchNotifications();
    const followFirst = first.filter((n) => n.title.includes("Moussa"));
    expect(followFirst.length).toBe(1);

    const second = await fetchNotifications();
    const followSecond = second.filter((n) => n.title.includes("Moussa"));
    expect(followSecond.length).toBe(1);
    expect(followSecond[0].id).toBe(followFirst[0].id);
  });

  it("persists new follow notifications to localStorage", async () => {
    const follow = await import("../follow");
    vi.mocked(follow.getProducerFeed).mockResolvedValueOnce([
      { farmerId: "F-004", farmerName: "Gisèle", farmerAvatar: "GI", lotId: "LOT-PERSIST-1", crop: "Café", quantity: "500 kg", price: 2000, postedAt: new Date().toISOString(), status: "Disponible" },
    ]);
    await fetchNotifications();
    const stored = getStorage(NOTIF_KEY);
    expect(stored).not.toBeNull();
    expect(stored.some((n: any) => n.title.includes("Gisèle"))).toBe(true);
  });
});

describe("markAsRead", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("marks notification as unread=false in localStorage", async () => {
    seedStorage([{ id: "mr-1", title: "Test", desc: "Test", time: "1 min", unread: true }], NOTIF_KEY);
    await markAsRead("mr-1");
    const stored = getStorage(NOTIF_KEY);
    expect(stored[0].unread).toBe(false);
  });

  it("does not error for non-existent id", async () => {
    seedStorage([{ id: "mr-2", title: "Test", desc: "Test", time: "1 min", unread: true }], NOTIF_KEY);
    await markAsRead("nonexistent");
    const stored = getStorage(NOTIF_KEY);
    expect(stored[0].unread).toBe(true);
  });
});

describe("markAllAsRead", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("marks all notifications as read", async () => {
    seedStorage([
      { id: "ma-1", title: "A", desc: "A", time: "1 min", unread: true },
      { id: "ma-2", title: "B", desc: "B", time: "2 min", unread: true },
    ], NOTIF_KEY);
    await markAllAsRead();
    const stored = getStorage(NOTIF_KEY);
    expect(stored.every((n: any) => n.unread === false)).toBe(true);
  });
});
