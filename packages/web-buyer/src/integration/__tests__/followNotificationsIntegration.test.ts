import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TestWrapper } from "../../test/providers";

vi.mock("../../services/api", () => ({
  default: {
    get: vi.fn(() => Promise.reject(new Error("Network error"))),
    post: vi.fn(() => Promise.reject(new Error("Network error"))),
    put: vi.fn(() => Promise.reject(new Error("Network error"))),
  },
}));

vi.mock("../../services/follow", () => ({
  toggleFollow: vi.fn(async (userId: string, farmerId: string) => {
    const key = `test_follow_${userId}`;
    const raw = localStorage.getItem(key);
    const set = raw ? new Set(JSON.parse(raw)) : new Set();
    if (set.has(farmerId)) { set.delete(farmerId); localStorage.setItem(key, JSON.stringify([...set])); return false; }
    set.add(farmerId); localStorage.setItem(key, JSON.stringify([...set])); return true;
  }),
  getFollowing: vi.fn(async (userId: string) => {
    const raw = localStorage.getItem(`test_follow_${userId}`);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    return ids.map((farmerId) => ({ farmerId, followedAt: new Date().toISOString(), notifications: true }));
  }),
  isFollowing: vi.fn(async (userId: string, farmerId: string) => {
    const raw = localStorage.getItem(`test_follow_${userId}`);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    return ids.includes(farmerId);
  }),
  getFollowStats: vi.fn(() => Promise.resolve({ followersCount: 1, followingCount: 0 })),
  getProducerFeed: vi.fn(async () => {
    const raw = localStorage.getItem("test_feed_items");
    return raw ? JSON.parse(raw) : [];
  }),
}));

vi.mock("../../i18n", () => ({
  default: { language: "fr" },
}));

describe("Follow + Notifications Integration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("follow service persists state across calls", async () => {
    const { toggleFollow, getFollowing } = await import("../../services/follow");
    const result1 = await toggleFollow("u-int-1", "F-001");
    expect(result1).toBe(true);
    const result2 = await toggleFollow("u-int-1", "F-001");
    expect(result2).toBe(false);
    const list = await getFollowing("u-int-1");
    expect(list.length).toBe(0);
  });

  it("followed producer feed generates notifications", async () => {
    const follow = await import("../../services/follow");
    const notif = await import("../../services/notifications");

    await follow.toggleFollow("u-int-2", "F-001");

    localStorage.setItem("test_feed_items", JSON.stringify([
      { farmerId: "F-001", farmerName: "Koffi Agbozo", farmerAvatar: "KA", lotId: "LOT-INT-1", crop: "Cacao", quantity: "2 000 kg", price: 1200, postedAt: new Date().toISOString(), status: "Disponible" },
    ]));

    const items = await notif.fetchNotifications();
    const followNotifs = items.filter((n) => n.title.includes("Koffi"));
    expect(followNotifs.length).toBe(1);
    expect(followNotifs[0].unread).toBe(true);
  });

  it("marking follow notification as read works", async () => {
    const follow = await import("../../services/follow");
    const notif = await import("../../services/notifications");

    await follow.toggleFollow("u-int-3", "F-002");

    localStorage.setItem("test_feed_items", JSON.stringify([
      { farmerId: "F-002", farmerName: "Amadou", farmerAvatar: "AM", lotId: "LOT-INT-2", crop: "Coton", quantity: "5 000 kg", price: 800, postedAt: new Date().toISOString(), status: "Disponible" },
    ]));

    const items = await notif.fetchNotifications();
    const followNotif = items.find((n) => n.title.includes("Amadou"));
    expect(followNotif).toBeDefined();

    await notif.markAsRead(followNotif!.id);
    const stored = JSON.parse(localStorage.getItem("atb_notifications") ?? "[]");
    const marked = stored.find((n: any) => n.id === followNotif!.id);
    expect(marked.unread).toBe(false);
  });

  it("unread count decreases after markAsRead (localStorage items only)", async () => {
    const notif = await import("../../services/notifications");
    localStorage.clear();
    localStorage.setItem("atb_notifications", JSON.stringify([
      { id: "cnt-1", title: "N1", desc: "D1", time: "1 min", unread: true },
      { id: "cnt-2", title: "N2", desc: "D2", time: "2 min", unread: true },
    ]));

    await notif.markAsRead("cnt-1");
    const stored = JSON.parse(localStorage.getItem("atb_notifications") ?? "[]");
    expect(stored.find((n: any) => n.id === "cnt-1").unread).toBe(false);
    expect(stored.find((n: any) => n.id === "cnt-2").unread).toBe(true);
  });

  it("markAllAsRead clears all unread in localStorage", async () => {
    const notif = await import("../../services/notifications");
    localStorage.clear();
    localStorage.setItem("atb_notifications", JSON.stringify([
      { id: "ma-1", title: "A", desc: "A", time: "1 min", unread: true },
      { id: "ma-2", title: "B", desc: "B", time: "2 min", unread: true },
      { id: "ma-3", title: "C", desc: "C", time: "3 min", unread: false },
    ]));

    await notif.markAllAsRead();
    const stored = JSON.parse(localStorage.getItem("atb_notifications") ?? "[]");
    expect(stored.every((n: any) => n.unread === false)).toBe(true);
  });

  it("seen lots persist across fetch calls", async () => {
    const follow = await import("../../services/follow");
    const notif = await import("../../services/notifications");

    await follow.toggleFollow("u-int-4", "F-003");

    localStorage.setItem("test_feed_items", JSON.stringify([
      { farmerId: "F-003", farmerName: "Moussa", farmerAvatar: "MO", lotId: "LOT-SEEN-PERSIST", crop: "Riz", quantity: "1 000 kg", price: 500, postedAt: new Date().toISOString(), status: "Disponible" },
    ]));

    await notif.fetchNotifications();

    const seenBefore = JSON.parse(localStorage.getItem("atb_seen_lots") ?? "[]");
    expect(seenBefore).toContain("LOT-SEEN-PERSIST");

    const second = await notif.fetchNotifications();
    const moussaNotifs = second.filter((n) => n.title.includes("Moussa"));
    expect(moussaNotifs.length).toBe(1);
  });
});
