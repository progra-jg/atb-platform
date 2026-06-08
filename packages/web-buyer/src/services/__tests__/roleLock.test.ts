import { describe, it, expect, beforeEach } from "vitest";
import { setRoleLock, getRoleLock, clearRoleLock, setOnboardingCompleted, getOnboardingCompleted } from "../roleLock";

describe("roleLock service", () => {
  beforeEach(() => {
    clearRoleLock();
  });

  it("stores and retrieves role", () => {
    setRoleLock("farmer");
    expect(getRoleLock()).toBe("farmer");
  });

  it("stores and retrieves buyer role", () => {
    setRoleLock("active_buyer");
    expect(getRoleLock()).toBe("active_buyer");
  });

  it("returns null when no role is stored", () => {
    expect(getRoleLock()).toBeNull();
  });

  it("clears role lock", () => {
    setRoleLock("farmer");
    clearRoleLock();
    expect(getRoleLock()).toBeNull();
  });

  it("returns null for invalid stored value", () => {
    localStorage.setItem("atb_role_lock", "invalid_role");
    expect(getRoleLock()).toBeNull();
  });

  it("tracks onboarding completion", () => {
    expect(getOnboardingCompleted()).toBe(false);
    setOnboardingCompleted();
    expect(getOnboardingCompleted()).toBe(true);
  });

  it("clearRoleLock clears both role and completion", () => {
    setRoleLock("farmer");
    setOnboardingCompleted();
    clearRoleLock();
    expect(getRoleLock()).toBeNull();
    expect(getOnboardingCompleted()).toBe(false);
  });
});
