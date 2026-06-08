import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { getAllPermissions, hasPermission, hasAnyPermission, hasAllPermissions } from "../services/rbac";
import type { Permission } from "../services/rbac";

export function usePermissions() {
  const { user } = useAuth();
  const userType = user?.metadata?.onboarding?.userType ?? null;

  const permissions = useMemo(() => getAllPermissions(userType), [userType]);

  return {
    permissions,
    userType,
    can: (permission: Permission) => hasPermission(userType, permission),
    canAny: (...perms: Permission[]) => hasAnyPermission(userType, perms),
    canAll: (...perms: Permission[]) => hasAllPermissions(userType, perms),
  };
}
