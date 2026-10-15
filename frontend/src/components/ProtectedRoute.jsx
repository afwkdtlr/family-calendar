import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function ProtectedRoute({ children, requireAdmin = false }) {
  const { loading, isAuthenticated, isApproved, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="page-loading">불러오는 중...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isApproved) {
    return <Navigate to="/pending" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/calendar" replace />;
  }

  return children;
}

export function GuestRoute({ children }) {
  const { loading, isAuthenticated, isApproved } = useAuth();

  if (loading) {
    return <div className="page-loading">불러오는 중...</div>;
  }

  if (isAuthenticated && isApproved) {
    return <Navigate to="/calendar" replace />;
  }

  return children;
}
