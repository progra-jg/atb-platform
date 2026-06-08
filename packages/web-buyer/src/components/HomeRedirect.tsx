import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRole } from "../hooks/useRole";
import Landing from "../pages/Landing";

export default function HomeRedirect() {
  const { user, loading } = useAuth();
  const role = useRole();

  if (loading) return null;

  if (user) {
    if (role.isFarmer) return <Navigate to="/producer" replace />;
    if (role.isBuyer || !role.userType) return <Navigate to="/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <Landing />;
}
