import { Navigate } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions";
import type { Permission } from "../services/rbac";

interface RbacRouteProps {
  permission: Permission;
  fallbackPath?: string;
  children: React.ReactNode;
}

export default function RbacRoute({ permission, fallbackPath = "/dashboard", children }: RbacRouteProps) {
  const { can } = usePermissions();
  if (!can(permission)) return <Navigate to={fallbackPath} replace />;
  return <>{children}</>;
}
