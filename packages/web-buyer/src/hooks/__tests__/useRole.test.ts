import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRole } from "../useRole";
import { clearRoleLock, setRoleLock, setOnboardingCompleted } from "../../services/roleLock";

vi.mock("../../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../../context/AuthContext";

describe("useRole", () => {
  beforeEach(() => {
    clearRoleLock();
  });

  it("returns farmer role from user data", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: {
        metadata: {
          onboarding: { userType: "farmer", completed: true },
        },
      },
    });
    const { result } = renderHook(() => useRole());
    expect(result.current.userType).toBe("farmer");
    expect(result.current.isFarmer).toBe(true);
    expect(result.current.isBuyer).toBe(false);
    expect(result.current.hasCompletedOnboarding).toBe(true);
  });

  it("returns buyer role from user data", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: {
        metadata: {
          onboarding: { userType: "active_buyer", completed: true },
        },
      },
    });
    const { result } = renderHook(() => useRole());
    expect(result.current.userType).toBe("active_buyer");
    expect(result.current.isFarmer).toBe(false);
    expect(result.current.isBuyer).toBe(true);
  });

  it("falls back to cached role when user data is missing", () => {
    setRoleLock("farmer");
    setOnboardingCompleted();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: {
        metadata: {
          onboarding: { completed: false },
        },
      },
    });
    const { result } = renderHook(() => useRole());
    expect(result.current.userType).toBe("farmer");
    expect(result.current.isFarmer).toBe(true);
    expect(result.current.hasCompletedOnboarding).toBe(true);
  });

  it("returns null role when no data and no cache", () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: {
        metadata: {},
      },
    });
    const { result } = renderHook(() => useRole());
    expect(result.current.userType).toBeNull();
    expect(result.current.isFarmer).toBe(false);
    expect(result.current.isBuyer).toBe(false);
    expect(result.current.hasCompletedOnboarding).toBe(false);
  });
});
