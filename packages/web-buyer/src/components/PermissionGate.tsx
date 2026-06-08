import { usePermissions } from "../hooks/usePermissions";
import type { Permission } from "../services/rbac";

interface PermissionGateProps {
  permission: Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({ permission, fallback = null, children }: PermissionGateProps) {
  const { can } = usePermissions();
  if (can(permission)) return <>{children}</>;
  return <>{fallback}</>;
}

interface AnyGateProps {
  permissions: Permission[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function AnyPermissionGate({ permissions, fallback = null, children }: AnyGateProps) {
  const { canAny } = usePermissions();
  if (canAny(...permissions)) return <>{children}</>;
  return <>{fallback}</>;
}

interface AllGateProps {
  permissions: Permission[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function AllPermissionsGate({ permissions, fallback = null, children }: AllGateProps) {
  const { canAll } = usePermissions();
  if (canAll(...permissions)) return <>{children}</>;
  return <>{fallback}</>;
}
