import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { TestWrapper } from "../../test/providers";
import { useFollowedFarmers, useFollowedFeed } from "../useFollowedFarmers";

vi.mock("../../services/api", () => ({
  default: {
    get: vi.fn(() => Promise.reject(new Error("Network error"))),
    post: vi.fn(() => Promise.reject(new Error("Network error"))),
  },
}));

vi.mock("../../services/follow", () => ({
  getFollowing: vi.fn(() => Promise.resolve([
    { farmerId: "ATB-FARM-0001-KAM", followedAt: "2026-05-01T00:00:00Z", notifications: true },
  ])),
  getProducerFeed: vi.fn(() => Promise.resolve([
    { farmerId: "ATB-FARM-0001-KAM", farmerName: "Kouassi Amadou", farmerAvatar: "KA", lotId: "LOT-001", crop: "Cacao", quantity: "2 000 kg", price: 1200, postedAt: "2026-05-10", status: "Disponible" },
  ])),
}));

vi.mock("../../services/farmers", () => ({
  fetchFarmersList: vi.fn(() => Promise.resolve([
    { anonymousId: "ATB-FARM-0001-KAM", displayName: "Kouassi Amadou", avatar: "KA" },
    { anonymousId: "ATB-FARM-0002-MDI", displayName: "Moussa Diallo", avatar: "MD" },
  ])),
}));

vi.mock("../../context/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u-test-1", name: "Test User" } }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("useFollowedFarmers", () => {
  it("returns followed profiles", async () => {
    const { result } = renderHook(() => useFollowedFarmers(), {
      wrapper: TestWrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 5000 });
    expect(result.current.following.length).toBeGreaterThan(0);
    expect(result.current.followedProfiles.length).toBeGreaterThan(0);
    expect(result.current.followedProfiles[0].displayName).toBe("Kouassi Amadou");
  });
});

describe("useFollowedFeed", () => {
  it("returns producer feed", async () => {
    const { result } = renderHook(() => useFollowedFeed(), {
      wrapper: TestWrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false), { timeout: 5000 });
    expect(result.current.feed.length).toBeGreaterThan(0);
    expect(result.current.feed[0].crop).toBe("Cacao");
  });
});
