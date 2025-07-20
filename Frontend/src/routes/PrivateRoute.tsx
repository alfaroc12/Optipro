import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAppSelector";

interface PrivateRouteProps {
  allowedRole?: "user" | "admin";
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ allowedRole }) => {
  const { isAuthenticated, loading, user } = useAppSelector(
    (state) => state.auth
  );

  // Mostrar spinner mientras carga
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  // Si hay un rol específico requerido
  if (allowedRole) {
    // Si la ruta es para admin
    if (allowedRole === "admin") {
      // Si es usuario normal (no admin ni supervisor), redirigir a dashboard normal
      if (user?.role === "user") {
        return <Navigate to="/dashboard" />;
      }
    }
    // Si la ruta es para usuarios normales
    else if (allowedRole === "user") {
      // Si es admin o supervisor, redirigir a dashboard admin
      if (user?.role === "admin" || user?.role === "supervisor") {
        return <Navigate to="/admin/dashboard" />;
      }
    }
  }

  // Si está autenticado y tiene los permisos correctos, mostrar el contenido
  return <Outlet />;
};

export default PrivateRoute;
