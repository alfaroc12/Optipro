import React from "react";
import {
  AlertTriangle,
  Info,
  CheckCircle,
  Bell,
  Clock,
  User,
} from "lucide-react";
import { Notification } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onAction?: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onAction,
}) => {
  const navigate = useNavigate();

  // Determine estilos basados en el tipo de notificación
  const getNotificationStyles = (type: string, _priority: string) => {
    const baseStyles = "relative overflow-hidden";

    switch (type) {
      case "alert":
        return {
          container: `${baseStyles} bg-gradient-to-r from-red-50 via-red-25 to-transparent border-l-4 border-red-400`,
          icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
          iconBg: "bg-red-100",
        };
      case "warning":
        return {
          container: `${baseStyles} bg-gradient-to-r from-orange-50 via-orange-25 to-transparent border-l-4 border-orange-400`,
          icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
          iconBg: "bg-orange-100",
        };
      case "success":
        return {
          container: `${baseStyles} bg-gradient-to-r from-green-50 via-green-25 to-transparent border-l-4 border-green-400`,
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          iconBg: "bg-green-100",
        };
      case "info":
        return {
          container: `${baseStyles} bg-gradient-to-r from-blue-50 via-blue-25 to-transparent border-l-4 border-blue-400`,
          icon: <Info className="h-5 w-5 text-blue-500" />,
          iconBg: "bg-blue-100",
        };
      default:
        return {
          container: `${baseStyles} bg-gradient-to-r from-gray-50 via-gray-25 to-transparent border-l-4 border-gray-300`,
          icon: <Bell className="h-5 w-5 text-gray-500" />,
          iconBg: "bg-gray-100",
        };
    }
  };

  const styles = getNotificationStyles(
    notification.type,
    notification.priority
  );
  const isUnread = !notification.read;

  // Función para manejar la navegación cuando se hace clic en el botón de acción
  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Si hay información de navegación, navegar a la ruta especificada
    if (notification.navigationTarget) {
      const { route, params, viewType } = notification.navigationTarget;

      // Extraer el ID y asegurarse de que sea un número
      const idParam = params?.id;
      const id = typeof idParam === "string" ? parseInt(idParam, 10) : idParam;

      console.log(
        `NotificationItem: Procesando notificación tipo ${notification.type} con viewType ${viewType}`,
        params
      );

      // Construir el estado para enviar información adicional a la página de destino
      const navigationState = {
        id,
        showDetail: true,
        viewType: viewType || "form",
        fromNotification: true,
        notificationId: notification.id,
      };

      // Determinar la ruta de navegación
      let targetUrl = route;

      console.log(`Navegando a: ${targetUrl} con estado:`, navigationState);

      // Disparar el evento para que cualquier componente que esté escuchando pueda reaccionar
      // Ahora RoleBasedRedirector también está escuchando este evento y manejará la navegación
      console.log(
        `NotificationItem: Disparando evento notificationNavigation con ruta=${targetUrl}`
      );
      window.dispatchEvent(
        new CustomEvent("notificationNavigation", {
          detail: {
            route: targetUrl,
            params: navigationState,
          },
        })
      );
    }

    // Llamar a la función onAction si existe
    onAction?.(notification.id);
  };

  return (
    <div
      className={`${
        styles.container
      } p-4 hover:shadow-md transition-all duration-300 cursor-pointer group ${
        isUnread ? "bg-opacity-80" : "opacity-75"
      }`}
      onClick={() => {
        onMarkAsRead(notification.id);
      }}
    >
      {/* Indicador de prioridad alta */}
      {notification.priority === "high" && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-[#34509F] rounded-full animate-pulse"></div>
        </div>
      )}

      <div className="flex items-start space-x-3">
        {/* Ícono de la notificación */}
        <div
          className={`${styles.iconBg} p-2 rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}
        >
          {styles.icon}
        </div>

        <div className="flex-grow min-w-0">
          {/* Header con título y tiempo */}
          <div className="flex items-start justify-between mb-1">
            <h4
              className={`font-semibold text-sm ${
                isUnread ? "text-gray-900" : "text-gray-600"
              } truncate`}
            >
              {notification.title}
              {isUnread && (
                <span className="ml-2 w-2 h-2 bg-[#34509F] rounded-full inline-block"></span>
              )}
            </h4>
            <div className="flex items-center text-xs text-gray-500 ml-2 flex-shrink-0">
              <Clock className="h-3 w-3 mr-1" />
              {notification.time instanceof Date
                ? notification.time.toLocaleString()
                : notification.time}
            </div>
          </div>

          {/* Usuario si existe */}
          {notification.user && (
            <div className="flex items-center mb-2">
              <User className="h-3 w-3 text-blue-500 mr-1" />
              <span className="text-xs font-medium text-[#34509F]">
                {notification.user}
              </span>
            </div>
          )}

          {/* Mensaje */}
          <p
            className={`text-sm leading-relaxed text-left ${
              isUnread ? "text-gray-700" : "text-gray-500"
            }`}
          >
            {notification.message}
          </p>

          {/* Botón de acción si es requerido */}
          {notification.actionRequired && (
            <button
              onClick={handleActionClick}
              className="mt-2 px-3 py-1 bg-[#34509F] text-white text-xs rounded-md hover:bg-[#34509F] hover:bg-opacity-90 transition-colors duration-200"
            >
              Ver detalles
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
