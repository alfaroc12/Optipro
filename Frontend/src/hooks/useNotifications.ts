import { useState, useEffect } from "react";
import NotificationsService from "@/services/notifications";

// Importamos los tipos desde el panel de notificaciones
export type NotificationType =
  | "alert"
  | "info"
  | "success"
  | "warning"
  | "normal";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  time: string | Date;
  user?: string;
  read: boolean;
  priority: "high" | "medium" | "low";
  actionRequired?: boolean;
  // URL o información de navegación para redireccionar cuando se presiona "Ver detalles"
  navigationTarget?: {
    route: string;
    params?: Record<string, any>;
    viewType?: "form" | "chat" | "table" | string; // Tipo de vista a mostrar: formulario, chat, tabla, etc.
  };
}

const sampleNotifications: Notification[] = [
  {
    id: "1",
    type: "alert",
    title: "Cotización Pendiente",
    message:
      "Yeison ha subido una cotización hace 5 días, requiere revisión urgente.",
    time: "5 días",
    read: false,
    priority: "high",
    actionRequired: true,
    navigationTarget: {
      route: "/admin/ofertas",
      params: { id: "123456" },
      viewType: "form",
    },
  },
  {
    id: "2",
    type: "success",
    title: "Proyecto Actualizado",
    message: "Ha actualizado exitosamente la etapa del proyecto Zazue",
    time: "1 día",
    user: "Carlos",
    read: false,
    priority: "medium",
  },
  {
    id: "3",
    type: "warning",
    title: "Cotización Rechazada",
    message: "Tu cotización ha sido rechazada. Verifica el comentario adjunto.",
    time: "3 horas",
    user: "Carlos",
    read: false,
    priority: "high",
    actionRequired: true,
    navigationTarget: {
      route: "/ofertas",
      params: { id: "789012" },
      viewType: "form",
    },
  },
  {
    id: "4",
    type: "info",
    title: "Nueva Actualización",
    message: "Se han implementado nuevas funcionalidades en el sistema.",
    time: "4 horas",
    user: "Sistema",
    read: false,
    priority: "low",
  },
  {
    id: "5",
    type: "normal",
    title: "Comentario Nuevo",
    message: "Ha dejado un comentario en tu proyecto principal.",
    time: "6 horas",
    user: "Marta",
    read: false,
    priority: "medium",
  },
  {
    id: "6",
    type: "success",
    title: "Tarea Completada",
    message: "El proyecto XYZ ha sido actualizado correctamente.",
    time: "7 horas",
    user: "Ana",
    read: true,
    priority: "low",
  },
  {
    id: "7",
    type: "info",
    title: "Nueva Asignación",
    message: "Te ha asignado una nueva tarea con prioridad media.",
    time: "8 horas",
    user: "Juan",
    read: false,
    priority: "medium",
    actionRequired: true,
    navigationTarget: {
      route: "/projects/detail",
      params: { id: "456789" },
    },
  },
  {
    id: "8",
    type: "alert",
    title: "Proyecto en Retraso",
    message: "El proyecto ABC presenta un retraso de 2 días en su cronograma.",
    time: "1 día",
    read: false,
    priority: "high",
    actionRequired: true,
    navigationTarget: {
      route: "/admin/projects/detail",
      params: { id: "112233" },
    },
  },
];

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar las notificaciones al iniciar
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        // Llamada a la API real mediante el servicio
        const data = await NotificationsService.getAll();
        setNotifications(data);
        setLoading(false);
      } catch (err) {
        console.error("Error al cargar notificaciones:", err);
        setError("Error al cargar las notificaciones");
        setLoading(false);
        // Cargar notificaciones de muestra en caso de error (solo para desarrollo)
        setNotifications(sampleNotifications);
      }
    };

    fetchNotifications();

    // Listener para limpiar notificaciones inválidas
    const handleInvalidNotification = (event: CustomEvent) => {
      const { notificationId, reason } = event.detail;
      console.log(`Eliminando notificación inválida ${notificationId}: ${reason}`);
      
      // Eliminar la notificación del estado local
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      // Opcional: llamar al backend para eliminar la notificación
      // NotificationsService.delete(notificationId);
    };
    
    window.addEventListener('invalidNotification', handleInvalidNotification as EventListener);

    // Opcionalmente, podemos configurar un intervalo para actualizar las notificaciones periódicamente
    const intervalId = setInterval(fetchNotifications, 30000); // Cada 30 segundos

    return () => {
      clearInterval(intervalId); // Limpieza al desmontar
      window.removeEventListener('invalidNotification', handleInvalidNotification as EventListener);
    };
  }, []);

  // Calcular el número de notificaciones no leídas
  const unreadCount = notifications.filter((n) => !n.read).length;
  // Marcar una notificación como leída
  const markAsRead = async (id: string) => {
    try {
      // Actualización visual inmediata
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, read: true }
            : notification
        )
      );

      // Solicitud al servidor en segundo plano
      await NotificationsService.markAsRead(id);
    } catch (err) {
      console.error("Error al marcar notificación como leída:", err);
      setError("Error al actualizar la notificación");

      // Si falla, revertir el cambio visual (opcional)
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, read: false }
            : notification
        )
      );
    }
  }; // Marcar todas las notificaciones como leídas
  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);

      if (unreadIds.length === 0) return;

      // Actualización visual inmediata
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, read: true }))
      );

      // Solicitud al servidor en segundo plano
      await NotificationsService.markAllAsRead(unreadIds);
    } catch (err) {
      console.error(
        "Error al marcar todas las notificaciones como leídas:",
        err
      );
      setError("Error al actualizar las notificaciones");

      // Si falla, revertir el cambio visual (opcional)
      const failedIds = notifications.filter((n) => !n.read).map((n) => n.id);
      setNotifications((prev) =>
        prev.map((notification) =>
          failedIds.includes(notification.id)
            ? { ...notification, read: false }
            : notification
        )
      );
    }
  };

  // Manejar acciones específicas de las notificaciones
  const handleAction = (id: string) => {
    console.log("Acción requerida para notificación:", id);

    // Encontrar la notificación específica
    const notification = notifications.find((n) => n.id === id);
    if (!notification) return;

    // Si hay destino de navegación, disparar un evento global
    if (notification.navigationTarget) {
      const { route, params, viewType } = notification.navigationTarget;

      console.log(
        `useNotifications: Procesando acción de notificación ${id} con viewType ${viewType}`,
        params
      );

      // Disparar evento para cualquier componente que esté escuchando
      window.dispatchEvent(
        new CustomEvent("notificationAction", {
          detail: {
            notificationId: id,
            route,
            params,
            viewType,
          },
        })
      );

      // También disparar el evento de navegación para asegurar que todos los listeners lo reciban
      const idParam = params?.id;
      const numericId =
        typeof idParam === "string" ? parseInt(idParam, 10) : idParam;

      window.dispatchEvent(
        new CustomEvent("notificationNavigation", {
          detail: {
            route,
            params: {
              id: numericId,
              showDetail: true,
              viewType: viewType || "form",
              fromNotification: true,
              notificationId: id,
            },
          },
        })
      );
    }

    // Marcar como leída
    markAsRead(id);
  };

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    handleAction,
  };
};
