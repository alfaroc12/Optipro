import React from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAppSelector";

interface AdminOnlyRouteProps {
  children: React.ReactNode;
}

const AdminOnlyRoute: React.FC<AdminOnlyRouteProps> = ({ children }) => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Solo permitir acceso a usuarios con rol "admin"
  if (user?.role !== "admin") {
    return <Navigate to="/admin/dashboard" />;
  }

  return <>{children}</>;
};

export default AdminOnlyRoute;
