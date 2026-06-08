import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { subscribe, getState, start, stop, forceCheck } from "../networkMonitor";

describe("networkMonitor", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
    vi.stubGlobal("navigator", { onLine: true });
    vi.useFakeTimers();
    start();
  });

  afterEach(() => {
    stop();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("initially reports online", () => {
    const state = getState();
    expect(state.quality).toBe("online");
  });

  it("notifies subscribers when going offline", () => {
    const fn = vi.fn();
    const unsub = subscribe(fn);

    window.dispatchEvent(new Event("offline"));

    expect(fn).toHaveBeenCalledWith(expect.objectContaining({ quality: "offline" }));
    unsub();
  });

  it("subscriber receives current state on subscribe", () => {
    const fn = vi.fn();
    const unsub = subscribe(fn);
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({ quality: "online" }));
    unsub();
  });

  it("unsubscribe removes listener", () => {
    const fn = vi.fn();
    const unsub = subscribe(fn);
    unsub();
    window.dispatchEvent(new Event("offline"));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("marks degraded when health check fails", async () => {
    (vi.mocked(fetch) as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("fetch failed"));

    await vi.advanceTimersByTimeAsync(30_000);

    const state = getState();
    expect(["offline", "degraded"]).toContain(state.quality);
  });
});
