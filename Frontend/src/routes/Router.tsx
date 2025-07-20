import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAppSelector";
import PrivateRoute from "./PrivateRoute";
import RoleBasedRedirector from "@/components/guards/RoleBasedRedirector";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ProjectsPage from "@/pages/ProjectsPage";
import NotFoundPage from "@/pages/NotFoundPage";
import OfertasPage from "@/pages/OfertasPage";
import AdminDashboardPage from "@/pages/Admin/AdminDashboardPage";
import AdminOfertasPage from "@/pages/Admin/AdminOfertasPage";
import UsersPage from "@/pages/Admin/UsersPage";
import ProfilePage from "@/pages/ProfilePage";
import AdminProfilePage from "@/pages/Admin/AdminProfilePage";
import AdminProjectsPage from "@/pages/Admin/AdminProjectsPage";

const Router: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  // Verificar si el usuario es administrador o supervisor
  const isAdmin = user?.role === "admin";
  const isSupervisor = user?.role === "supervisor";
  const hasAdminAccess = isAdmin || isSupervisor;

  // Función para redirigir según el rol del usuario
  const redirectBasedOnRole = () => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    return hasAdminAccess ? (
      <Navigate to="/admin/dashboard" />
    ) : (
      <Navigate to="/dashboard" />
    );
  };
  return (
    <BrowserRouter>
      <RoleBasedRedirector />
      <Routes>
        {/* Rutas públicas */}
        <Route
          path="/login"
          element={isAuthenticated ? redirectBasedOnRole() : <LoginPage />}
        />
        {/* Rutas protegidas de usuario normal */}
        <Route element={<PrivateRoute allowedRole="user" />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/ofertas" element={<OfertasPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>{" "}
        {/* Rutas protegidas de administrador y supervisor */}
        <Route element={<PrivateRoute allowedRole="admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/ofertas" element={<AdminOfertasPage />} />
          <Route path="/admin/projects" element={<AdminProjectsPage />} />
          <Route path="/admin/profile" element={<AdminProfilePage />} />
        </Route>{" "}
        {/* Ruta específica solo para administradores (no supervisores) */}
        <Route
          path="/admin/Users"
          element={
            // Solo los usuarios con rol "admin" (administrador) pueden acceder a la página de usuarios
            isAdmin ? <UsersPage /> : <Navigate to="/admin/dashboard" />
          }
        />
        {/* Ruta principal - redirecciona según el rol */}
        <Route path="/" element={redirectBasedOnRole()} />
        {/* Ruta 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
