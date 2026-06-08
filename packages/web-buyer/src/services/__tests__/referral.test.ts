import { describe, it, expect, vi } from "vitest";
import {
  initializeReferral,
  getReferralData,
  validateReferralCode,
  applyReferralCode,
  getReferralStats,
  regenerateReferralCode,
} from "../referral";

vi.mock("../api", () => ({
  default: {
    get: vi.fn(() => Promise.reject(new Error("Network error"))),
    post: vi.fn(() => Promise.reject(new Error("Network error"))),
  },
}));

const USER_ID = "u0000000-0001-4000-8000-000000000001";
const REFERRED_USER_ID = "u0000000-0002-4000-8000-000000000002";

describe("initializeReferral", () => {
  it("creates referral data with a generated code", async () => {
    const data = await initializeReferral(USER_ID);
    expect(data).toBeDefined();
    expect(data.code).toMatch(/^ATB-/);
    expect(data.shareUrl).toContain("register?ref=");
    expect(data.totalInvited).toBe(0);
    expect(data.rewardsTotal).toBe(0);
  });

  it("returns existing referral data on second call", async () => {
    const first = await initializeReferral(USER_ID);
    const second = await initializeReferral(USER_ID);
    expect(second.code).toBe(first.code);
  });
});

describe("getReferralData", () => {
  it("returns null for uninitialized user", async () => {
    const data = await getReferralData("non-existent-user");
    expect(data).toBeNull();
  });

  it("returns data for initialized user", async () => {
    await initializeReferral(USER_ID);
    const data = await getReferralData(USER_ID);
    expect(data).not.toBeNull();
    expect(data!.code).toMatch(/^ATB-/);
  });
});

describe("validateReferralCode", () => {
  it("returns null for invalid code", async () => {
    const ownerId = await validateReferralCode("INVALID");
    expect(ownerId).toBeNull();
  });

  it("returns ownerId for valid code", async () => {
    const refData = await initializeReferral(USER_ID);
    const ownerId = await validateReferralCode(refData.code);
    expect(ownerId).toBe(USER_ID);
  });

  it("is case-insensitive", async () => {
    const refData = await initializeReferral(USER_ID);
    const lowerCode = refData.code.toLowerCase();
    const ownerId = await validateReferralCode(lowerCode);
    expect(ownerId).toBe(USER_ID);
  });
});

describe("applyReferralCode", () => {
  it("applies valid code and creates reward", async () => {
    const refData = await initializeReferral(USER_ID);
    const result = await applyReferralCode(refData.code, REFERRED_USER_ID);
    expect(result.success).toBe(true);
    expect(result.reward).toBeDefined();
  });

  it("rejects self-referral", async () => {
    const refData = await initializeReferral(USER_ID);
    const result = await applyReferralCode(refData.code, USER_ID);
    expect(result.success).toBe(false);
  });

  it("updates stats after application", async () => {
    const refData = await initializeReferral(USER_ID);
    await applyReferralCode(refData.code, REFERRED_USER_ID);
    const data = await getReferralData(USER_ID);
    expect(data!.totalInvited).toBeGreaterThan(0);
    expect(data!.rewardsTotal).toBeGreaterThan(0);
    expect(data!.invitees.length).toBeGreaterThan(0);
    expect(data!.rewards.length).toBeGreaterThan(0);
  });
});

describe("getReferralStats", () => {
  it("returns zero stats for uninitialized user", async () => {
    const stats = await getReferralStats("non-existent");
    expect(stats.inviteCount).toBe(0);
    expect(stats.rewardCount).toBe(0);
    expect(stats.rewardAmount).toBe(0);
    expect(stats.conversionRate).toBe(0);
  });

  it("returns updated stats after referral", async () => {
    const refData = await initializeReferral(USER_ID);
    await applyReferralCode(refData.code, REFERRED_USER_ID);
    const stats = await getReferralStats(USER_ID);
    expect(stats.inviteCount).toBeGreaterThan(0);
    expect(stats.rewardCount).toBeGreaterThan(0);
  });
});

describe("regenerateReferralCode", () => {
  it("generates a new code", async () => {
    await initializeReferral(USER_ID);
    const oldCode = (await getReferralData(USER_ID))!.code;
    const newCode = await regenerateReferralCode(USER_ID);
    expect(newCode).toMatch(/^ATB-/);
    expect(newCode).not.toBe(oldCode);
  });

  it("old code becomes invalid after regeneration", async () => {
    const refData = await initializeReferral(USER_ID);
    const oldCode = refData.code;
    await regenerateReferralCode(USER_ID);
    const ownerId = await validateReferralCode(oldCode);
    expect(ownerId).toBeNull();
  });
});
