import { describe, it, expect } from "vitest";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getAllPermissions,
} from "../rbac";
import type { Permission } from "../rbac";

describe("RBAC", () => {
  describe("getAllPermissions", () => {
    it("returns farmer permissions for farmer userType", () => {
      const perms = getAllPermissions("farmer");
      expect(perms).toContain("lot.create");
      expect(perms).toContain("lot.edit");
      expect(perms).toContain("lot.delete");
      expect(perms).toContain("lot.view_own");
      expect(perms).toContain("order.view_received");
      expect(perms).toContain("order.update_status");
      expect(perms).toContain("producer.hub");
      expect(perms).toContain("producer.dashboard");
      expect(perms).toContain("producer.lots");
      expect(perms).toContain("producer.orders");
      expect(perms).not.toContain("lot.view_all");
      expect(perms).not.toContain("cart.manage");
      expect(perms).not.toContain("escrow.use");
      expect(perms).not.toContain("shop.view");
    });

    it("returns active_buyer permissions for active_buyer userType", () => {
      const perms = getAllPermissions("active_buyer");
      expect(perms).toContain("lot.view_all");
      expect(perms).toContain("lot.compare");
      expect(perms).toContain("order.create");
      expect(perms).toContain("order.view_own");
      expect(perms).toContain("cart.manage");
      expect(perms).toContain("escrow.use");
      expect(perms).toContain("shop.view");
      expect(perms).not.toContain("lot.create");
      expect(perms).not.toContain("lot.edit");
      expect(perms).not.toContain("producer.hub");
      expect(perms).not.toContain("order.view_received");
    });

    it("returns potential_buyer permissions (subset of active)", () => {
      const perms = getAllPermissions("potential_buyer");
      expect(perms).toContain("lot.view_all");
      expect(perms).toContain("lot.compare");
      expect(perms).toContain("shop.view");
      expect(perms).not.toContain("order.create");
      expect(perms).not.toContain("cart.manage");
      expect(perms).not.toContain("escrow.use");
    });

    it("returns other permissions for other userType", () => {
      const perms = getAllPermissions("other");
      expect(perms).toContain("lot.view_all");
      expect(perms).toContain("profile.manage");
      expect(perms).not.toContain("lot.create");
      expect(perms).not.toContain("cart.manage");
    });

    it("returns empty array for null userType", () => {
      expect(getAllPermissions(null)).toEqual([]);
    });
  });

  describe("hasPermission", () => {
    it("returns true when farmer has producer.hub", () => {
      expect(hasPermission("farmer", "producer.hub")).toBe(true);
    });

    it("returns false when buyer tries to access producer.hub", () => {
      expect(hasPermission("active_buyer", "producer.hub")).toBe(false);
    });

    it("returns false for null userType", () => {
      expect(hasPermission(null, "lot.view_all")).toBe(false);
    });

    it("returns true when buyer has cart.manage", () => {
      expect(hasPermission("active_buyer", "cart.manage")).toBe(true);
    });

    it("returns false when farmer has cart.manage", () => {
      expect(hasPermission("farmer", "cart.manage")).toBe(false);
    });
  });

  describe("hasAnyPermission", () => {
    it("returns true if any permission matches", () => {
      const perms: Permission[] = ["lot.create", "cart.manage"];
      expect(hasAnyPermission("farmer", perms)).toBe(true);
      expect(hasAnyPermission("active_buyer", perms)).toBe(true);
    });

    it("returns false if no permission matches", () => {
      const perms: Permission[] = ["lot.create", "producer.hub"];
      expect(hasAnyPermission("active_buyer", perms)).toBe(false);
    });
  });

  describe("hasAllPermissions", () => {
    it("returns true if all permissions match", () => {
      const perms: Permission[] = ["lot.view_own", "producer.hub"];
      expect(hasAllPermissions("farmer", perms)).toBe(true);
    });

    it("returns false if any permission is missing", () => {
      const perms: Permission[] = ["producer.hub", "cart.manage"];
      expect(hasAllPermissions("farmer", perms)).toBe(false);
    });
  });
});
