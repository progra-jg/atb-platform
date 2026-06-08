import type { UserType } from "../types/onboarding";

export type Permission =
  | "lot.create" | "lot.edit" | "lot.delete" | "lot.view_own"
  | "lot.view_all" | "lot.compare"
  | "order.create" | "order.view_own" | "order.view_received" | "order.update_status"
  | "producer.dashboard" | "producer.lots" | "producer.orders" | "producer.hub"
  | "cart.manage" | "escrow.use"
  | "profile.manage" | "certifications.manage"
  | "messages.send"
  | "alerts.manage" | "downloads.access"
  | "farmers.view" | "prices.view"
  | "scanner.use"
  | "impact.view"
  | "shop.view";

const PERMISSIONS: Record<UserType, Permission[]> = {
  farmer: [
    "lot.create", "lot.edit", "lot.delete", "lot.view_own",
    "order.view_received", "order.update_status",
    "producer.dashboard", "producer.lots", "producer.orders", "producer.hub",
    "profile.manage", "certifications.manage",
    "messages.send",
    "alerts.manage", "downloads.access",
    "prices.view",
    "scanner.use",
    "impact.view",
  ],
  active_buyer: [
    "lot.view_all", "lot.compare",
    "order.create", "order.view_own",
    "cart.manage", "escrow.use",
    "profile.manage",
    "messages.send",
    "alerts.manage", "downloads.access",
    "farmers.view", "prices.view",
    "scanner.use",
    "impact.view",
    "shop.view",
  ],
  potential_buyer: [
    "lot.view_all", "lot.compare",
    "profile.manage",
    "messages.send",
    "alerts.manage", "downloads.access",
    "farmers.view", "prices.view",
    "scanner.use",
    "impact.view",
    "shop.view",
  ],
  other: [
    "profile.manage",
    "messages.send",
    "alerts.manage", "downloads.access",
    "scanner.use",
    "impact.view",
    "lot.view_all",
    "farmers.view", "prices.view",
  ],
};

export function getAllPermissions(userType: UserType | null): Permission[] {
  if (!userType || !PERMISSIONS[userType]) return [];
  return PERMISSIONS[userType];
}

export function hasPermission(userType: UserType | null, permission: Permission): boolean {
  return getAllPermissions(userType).includes(permission);
}

export function hasAnyPermission(userType: UserType | null, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(userType, p));
}

export function hasAllPermissions(userType: UserType | null, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(userType, p));
}
