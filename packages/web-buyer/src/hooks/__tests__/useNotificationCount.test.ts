import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useNotificationCount } from "../useNotificationCount";

vi.mock("../../services/api", () => ({
  default: {
    get: vi.fn(() => Promise.reject(new Error("Network error"))),
  },
}));

vi.mock("../../services/follow", () => ({
  getProducerFeed: vi.fn(() => Promise.resolve([])),
}));

vi.mock("../../i18n", () => ({
  default: { language: "fr" },
}));

describe("useNotificationCount", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns initial count of 0 when no notifications", async () => {
    const { result } = renderHook(() => useNotificationCount(5000));
    await waitFor(() => expect(result.current).toBe(0), { timeout: 6000 });
  });

  it("counts only unread notifications", async () => {
    localStorage.setItem("atb_notifications", JSON.stringify([
      { id: 1, title: "Unread", desc: "Test", time: "1 min", unread: true },
      { id: 2, title: "Read", desc: "Test", time: "2 min", unread: false },
      { id: 3, title: "Unread 2", desc: "Test", time: "3 min", unread: true },
    ]));
    const { result } = renderHook(() => useNotificationCount(5000));
    await waitFor(() => expect(result.current).toBe(2), { timeout: 6000 });
  });

  it("returns 0 when all notifications are read", async () => {
    localStorage.setItem("atb_notifications", JSON.stringify([
      { id: 1, title: "Read", desc: "Test", time: "1 min", unread: false },
    ]));
    const { result } = renderHook(() => useNotificationCount(5000));
    await waitFor(() => expect(result.current).toBe(0), { timeout: 6000 });
  });

  it("handles empty localStorage gracefully", async () => {
    const { result } = renderHook(() => useNotificationCount(5000));
    await waitFor(() => expect(result.current).toBe(0), { timeout: 6000 });
  });
});
