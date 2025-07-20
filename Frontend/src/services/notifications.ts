import { AxiosResponse } from "axios";
import api from "./api";
import { Notification } from "@/hooks/useNotifications";

// Interfaces para la comunicación con el backend
interface ApiNotification {
  id: string;
  type: string;
  message: string;
  data: Record<string, any>;
  created_at: string;
  is_read: boolean;
}

// Función para transformar de formato API a formato de aplicación
const mapApiNotificationToApp = (apiNotif: ApiNotification): Notification => {
  // Determinar el tipo de notificación según el tipo del backend
  let notifType: "alert" | "info" | "success" | "warning" | "normal" = "normal";
  let title = "";
  let priority: "high" | "medium" | "low" = "medium";
  let actionRequired = false;
  let navigationTarget:
    | {
        route: string;
        params?: Record<string, any>;
        viewType?: "form" | "chat" | "table" | string;
      }
    | undefined = undefined;

  // Mapear tipos del backend a tipos de frontend
  switch (apiNotif.type) {
    case "new_sale_order":
      notifType = "info";
      title = "Nueva Orden de Venta";
      priority = "medium";
      // Si existe el ID de la orden de venta en data, incluir información de navegación
      if (apiNotif.data && apiNotif.data.sale_order_id) {
        actionRequired = true;

        // Determinar si es para admin o usuario basado en la información del usuario
        // Verificamos si el usuario tiene rol de administrador o si la notificación lo especifica
        // El backend debe enviar is_admin en los datos para indicar la vista correcta
        const isAdmin = apiNotif.data.is_admin === true;

        navigationTarget = {
          route: isAdmin ? "/admin/ofertas" : "/ofertas",
          params: {
            id: apiNotif.data.sale_order_id,
            exact: true, // Indica que debe buscar exactamente por este ID
          },
          viewType: "form", // Indica que se debe abrir el formulario de detalles
        };
      }
      break;
    case "state_change":
      notifType = "warning";
      title = "Cambio de Estado";
      priority = "high";
      actionRequired = true;
      // Extraer información relevante para la navegación
      if (apiNotif.data) {
        const isAdmin = apiNotif.data.is_admin === true;

        if (apiNotif.data.sale_order_id) {
          // Si el nuevo estado es "aprobado", redirigir al chat de la oferta
          const viewType =
            apiNotif.data.new_state === "aprobado" ? "chat" : "form";

          navigationTarget = {
            route: isAdmin ? "/admin/ofertas" : "/ofertas",
            params: { id: apiNotif.data.sale_order_id },
            viewType: viewType,
          };
        } else if (apiNotif.data.project_id) {
          navigationTarget = {
            route: isAdmin ? "/admin/projects" : "/projects",
            params: { id: apiNotif.data.project_id },
            viewType: "form",
          };
        }
      }
      break;
    case "new_project":
      notifType = "success";
      title = "Nuevo Proyecto";
      priority = "medium";
      if (apiNotif.data && apiNotif.data.project_id) {
        actionRequired = true;
        const isAdmin = apiNotif.data.is_admin === true;

        navigationTarget = {
          route: isAdmin ? "/admin/projects" : "/projects",
          params: { id: apiNotif.data.project_id },
          viewType: "form",
        };
      }
      break;
    case "new_chat":
      notifType = "info";
      title = "Nuevo Mensaje";
      priority = "medium"; // Cambiado de "low" a "medium" para dar más visibilidad

      // Para las notificaciones de chat, necesitamos verificar si existe sale_order_id
      if (
        apiNotif.data &&
        (apiNotif.data.sale_order_id || apiNotif.data.chat_id)
      ) {
        actionRequired = true; // Asegurarnos de que el botón de acción aparezca
        const isAdmin = apiNotif.data.is_admin === true;
        const offerId = apiNotif.data.sale_order_id || apiNotif.data.chat_id;

        navigationTarget = {
          route: isAdmin ? "/admin/ofertas" : "/ofertas", // Vamos a la página de ofertas
          params: { id: offerId },
          viewType: "chat", // Pero especificamos que debe abrir el chat
        };
      }
      break;
    default:
      notifType = "normal";
      title = "Notificación";
      priority = "medium";
      // Para notificaciones genéricas que puedan tener ruta de navegación
      if (apiNotif.data && apiNotif.data.navigation_route) {
        actionRequired = true;
        navigationTarget = {
          route: apiNotif.data.navigation_route,
          params: apiNotif.data.navigation_params,
          viewType: apiNotif.data.view_type || "form",
        };
      }
  }

  // Convertir la fecha a un formato más amigable
  const createdDate = new Date(apiNotif.created_at);
  const now = new Date();
  const diffInMillis = now.getTime() - createdDate.getTime();
  const diffInHours = diffInMillis / (1000 * 60 * 60);

  let timeDisplay: string;
  if (diffInHours < 1) {
    timeDisplay = `${Math.round(diffInHours * 60)} minutos`;
  } else if (diffInHours < 24) {
    timeDisplay = `${Math.round(diffInHours)} horas`;
  } else {
    timeDisplay = `${Math.round(diffInHours / 24)} días`;
  }

  // Extraer usuario del mensaje o datos si está disponible
  let user: string | undefined = undefined;
  if (apiNotif.data && apiNotif.data.user_name) {
    user = apiNotif.data.user_name;
  }

  return {
    id: apiNotif.id,
    type: notifType,
    title: title,
    message: apiNotif.message,
    time: timeDisplay,
    user,
    read: apiNotif.is_read,
    priority,
    actionRequired,
    navigationTarget,
  };
};

// Servicio para interactuar con el API de notificaciones
export const NotificationsService = {
  getAll: async (): Promise<Notification[]> => {
    const response: AxiosResponse<ApiNotification[]> = await api.get(
      "/api/notifications/"
    );
    return response.data.map(mapApiNotificationToApp);
  },

  getUnread: async (): Promise<Notification[]> => {
    const response: AxiosResponse<ApiNotification[]> = await api.get(
      "/api/notifications/unread/"
    );
    return response.data.map(mapApiNotificationToApp);
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.post("/api/notifications/mark_as_read/", { ids: [id] });
  },

  markAllAsRead: async (ids: string[]): Promise<void> => {
    await api.post("/api/notifications/mark_as_read/", { ids });
  },
};

export default NotificationsService;
