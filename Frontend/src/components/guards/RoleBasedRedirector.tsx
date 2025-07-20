import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAppSelector";

/**
 * Componente que se encarga de redireccionar al usuario según su rol.
 * Este componente debe ser montado al nivel más alto del Router.
 * También maneja eventos globales de navegación desde notificaciones.
 */
const RoleBasedRedirector: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && user) {
      const currentPath = location.pathname;
      const isAdmin = user.role === "admin";
      const isSupervisor = user.role === "supervisor";
      const hasAdminAccess = isAdmin || isSupervisor;

      console.log("RoleBasedRedirector:", {
        role: user.role,
        path: currentPath,
        shouldHaveAdminAccess: hasAdminAccess,
      });

      // Si está en login o en la raíz, redirigir según rol
      if (currentPath === "/" || currentPath === "/login") {
        if (hasAdminAccess) {
          navigate("/admin/dashboard", { replace: true });
          return;
        } else {
          navigate("/dashboard", { replace: true });
          return;
        }
      }

      // Si el usuario normal está intentando acceder a rutas de admin
      if (!hasAdminAccess && currentPath.startsWith("/admin")) {
        navigate("/dashboard", { replace: true });
        return;
      }

      // Si el supervisor intenta acceder a la página de usuarios
      if (isSupervisor && currentPath === "/admin/Users") {
        navigate("/admin/dashboard", { replace: true });
        return;
      }

      // Si el rol es admin o supervisor pero está intentando acceder a una ruta de usuario normal
      if (
        hasAdminAccess &&
        !currentPath.startsWith("/admin") &&
        currentPath !== "/login" &&
        currentPath !== "/"
      ) {
        navigate("/admin/dashboard", { replace: true });
        return;
      }
    }
  }, [isAuthenticated, user, location.pathname, navigate]);

  // Efecto independiente para manejar eventos de notificación que requieren navegación
  useEffect(() => {
    // Solo configurar el listener si el usuario está autenticado
    if (!isAuthenticated || !user) return;

    const isAdmin = user.role === "admin";
    const isSupervisor = user.role === "supervisor";
    const hasAdminAccess = isAdmin || isSupervisor;

    const handleNotificationNavigation = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (!customEvent.detail) return;

      const { route, params } = customEvent.detail;

      // Solo procesar si hay una ruta y un ID en los parámetros
      if (route && params?.id) {
        const idNum =
          typeof params.id === "string" ? parseInt(params.id, 10) : params.id;
        const viewType = params.viewType || "form";

        console.log(
          `RoleBasedRedirector: Evento de navegación detectado a ${route} con ID=${idNum} y viewType=${viewType}`
        );

        // Determinar la ruta correcta basada en el rol del usuario
        let targetRoute = route;

        if (hasAdminAccess) {
          // Asegurarse de que las rutas de admin comiencen con /admin/
          if (!targetRoute.startsWith("/admin/")) {
            targetRoute = targetRoute.replace("/ofertas", "/admin/ofertas");
            targetRoute = targetRoute.replace("/projects", "/admin/projects");
          }
        } else {
          // Asegurarse de que las rutas de usuario no comiencen con /admin/
          targetRoute = targetRoute.replace("/admin/", "/");
        }

        // Solo navegar si no estamos ya en la ruta de destino
        if (location.pathname !== targetRoute) {
          console.log(`RoleBasedRedirector: Navegando a ${targetRoute}`);
          navigate(targetRoute, {
            state: {
              id: idNum,
              showDetail: true,
              viewType: viewType,
              fromNotification: true,
              notificationId: params.notificationId,
            },
          });
        } else {
          console.log(
            `RoleBasedRedirector: Ya estamos en ${targetRoute}, solo disparando evento local`
          );
        }
      }
    };

    // Escuchar el evento de navegación
    window.addEventListener(
      "notificationNavigation",
      handleNotificationNavigation
    );

    return () => {
      window.removeEventListener(
        "notificationNavigation",
        handleNotificationNavigation
      );
    };
  }, [isAuthenticated, user, navigate, location.pathname]);

  return null;
};

export default RoleBasedRedirector;
