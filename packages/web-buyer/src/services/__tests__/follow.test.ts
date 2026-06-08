import { describe, it, expect, vi } from "vitest";
import { toggleFollow, getFollowing, isFollowing, getFollowStats, getProducerFeed } from "../follow";

vi.mock("../api", () => ({
  default: {
    get: vi.fn(() => Promise.reject(new Error("Network error"))),
    post: vi.fn(() => Promise.reject(new Error("Network error"))),
  },
}));

vi.mock("../lots", () => ({
  fetchLots: vi.fn(() => Promise.resolve([])),
}));

const FARMER_ID = "ATB-FARM-0042-GLZ";
const FARMER_ID_2 = "ATB-FARM-0001-KAM";

describe("toggleFollow", () => {
  it("returns true when following a farmer", async () => {
    const uid = "u-flw-toggle-on";
    const result = await toggleFollow(uid, FARMER_ID);
    expect(result).toBe(true);
  });

  it("returns false when unfollowing", async () => {
    const uid = "u-flw-toggle-off";
    await toggleFollow(uid, FARMER_ID);
    const result = await toggleFollow(uid, FARMER_ID);
    expect(result).toBe(false);
  });
});

describe("isFollowing", () => {
  it("returns false for non-followed farmer", async () => {
    const result = await isFollowing("u-flw-isf-no", FARMER_ID_2);
    expect(result).toBe(false);
  });

  it("returns true after following", async () => {
    const uid = "u-flw-isf-yes";
    await toggleFollow(uid, FARMER_ID_2);
    const result = await isFollowing(uid, FARMER_ID_2);
    expect(result).toBe(true);
  });
});

describe("getFollowing", () => {
  it("returns empty array for new user", async () => {
    const list = await getFollowing("u-flw-empty");
    expect(list).toEqual([]);
  });

  it("includes followed farmer after toggle", async () => {
    const uid = "u-flw-list";
    await toggleFollow(uid, FARMER_ID);
    const list = await getFollowing(uid);
    expect(list.some((r) => r.farmerId === FARMER_ID)).toBe(true);
  });
});

describe("getFollowStats", () => {
  it("returns zero for non-followed farmer", async () => {
    const stats = await getFollowStats("unknown-farmer");
    expect(stats.followersCount).toBe(0);
  });

  it("returns count after someone follows", async () => {
    const uid = "u-flw-stats";
    await toggleFollow(uid, FARMER_ID);
    const stats = await getFollowStats(FARMER_ID);
    expect(stats.followersCount).toBeGreaterThan(0);
  });
});

describe("getProducerFeed", () => {
  it("returns empty feed when not following anyone", async () => {
    const feed = await getProducerFeed("u-flw-feed-empty");
    expect(feed).toEqual([]);
  });
});
