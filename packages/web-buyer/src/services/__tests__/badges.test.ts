import { describe, it, expect, vi } from "vitest";
import { getBadgeState, progressBadge } from "../badges";
import { BADGE_CATALOG } from "../../types/badge";

vi.mock("../api", () => ({
  default: {
    get: vi.fn(() => Promise.reject(new Error("Network error"))),
    post: vi.fn(() => Promise.reject(new Error("Network error"))),
  },
}));

const USER_ID = "u-badges-001";

describe("getBadgeState", () => {
  it("returns all badges with zero progress for new user", async () => {
    const state = await getBadgeState(USER_ID);
    expect(state.totalBadges).toBe(BADGE_CATALOG.length);
    expect(state.totalUnlocked).toBe(0);
    expect(state.badges.length).toBe(BADGE_CATALOG.length);
  });

  it("reports nextMilestone as first badge", async () => {
    const state = await getBadgeState(USER_ID);
    expect(state.nextMilestone).not.toBeNull();
  });
});

describe("progressBadge", () => {
  it("unlocks badge when progress reaches max", async () => {
    const def = BADGE_CATALOG[0];
    const result = await progressBadge(USER_ID, def.id, def.maxProgress);
    expect(result.badgeUnlocked).toBe(true);
    expect(result.badgeId).toBe(def.id);
  });

  it("does not unlock on partial progress", async () => {
    const otherUser = "u-badges-002";
    const def = BADGE_CATALOG[2];
    const result = await progressBadge(otherUser, def.id, 3);
    expect(result.badgeUnlocked).toBe(false);
  });

  it("state reflects unlocked badge", async () => {
    const u = "u-badges-003";
    const def = BADGE_CATALOG[1];
    await progressBadge(u, def.id, def.maxProgress);
    const state = await getBadgeState(u);
    const bp = state.badges.find((b) => b.badgeId === def.id);
    expect(bp?.unlocked).toBe(true);
    expect(bp?.unlockedAt).not.toBeNull();
    expect(state.totalUnlocked).toBeGreaterThanOrEqual(1);
  });

  it("returns no unlock for unknown badge id", async () => {
    const result = await progressBadge(USER_ID, "nonexistent", 1);
    expect(result.badgeUnlocked).toBe(false);
  });
});
