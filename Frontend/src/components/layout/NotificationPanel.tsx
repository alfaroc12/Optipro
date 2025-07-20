import React, { useState } from "react";
import { X, Bell, ChevronDown } from "lucide-react";
import NotificationItem from "./NotificationItem";
import { useNotifications } from "@/hooks/useNotifications";

interface NotificationPanelProps {
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ onClose }) => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    handleAction,
  } = useNotifications();

  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filteredNotifications =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const displayedNotifications = showAll
    ? filteredNotifications
    : filteredNotifications.slice(0, 5);

  const hasMoreNotifications = filteredNotifications.length > 5;

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[85vh] flex flex-col backdrop-blur-xl">
      {/* Header Premium */}
      <div className="bg-white border-b border-gray-200">
        {/* Título y botón de cerrar */}
        <div className="flex justify-between items-center px-5 py-4">
          <div className="flex items-center">
            <div className="bg-[#4178D4] bg-opacity-10 p-1.5 rounded-lg mr-3">
              <Bell className="h-5 w-5 text-[#e0e7ff]" />
            </div>
            <h3 className="font-bold text-gray-800 text-lg">Notificaciones</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1.5 rounded-md hover:bg-gray-100 transition-colors duration-200"
            aria-label="Cerrar notificaciones"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs de filtrado */}
        <div className="px-5 pb-1">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setFilter("all")}
              className={`relative py-2 px-3 -mb-px font-medium text-sm transition-colors duration-200 ${
                filter === "all"
                  ? "text-[#4178D4] border-b-2 border-[#4178D4]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Todas
              <span className="ml-1.5 py-0.5 px-1.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                {notifications.length}
              </span>
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`relative py-2 px-3 -mb-px font-medium text-sm transition-colors duration-200 ${
                filter === "unread"
                  ? "text-[#4178D4] border-b-2 border-[#4178D4]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              No leídas
              <span
                className={`ml-1.5 py-0.5 px-1.5 text-xs rounded-full ${
                  unreadCount > 0
                    ? "bg-[#4178D4] text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {unreadCount}
              </span>
            </button>
            <div className="flex-grow"></div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="py-2 px-3 text-[#4178D4] hover:text-[#34509F] text-xs font-medium transition-colors duration-200 flex items-center"
              >
                <span>Marcar todas como leídas</span>
              </button>
            )}
          </div>
        </div>
      </div>{" "}
      {/* Lista de notificaciones con scrollbar personalizado */}
      <div className="overflow-y-auto flex-grow custom-scrollbar">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">
              {filter === "unread"
                ? "No tienes notificaciones sin leer"
                : "No tienes notificaciones"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {displayedNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onAction={handleAction}
              />
            ))}
          </div>
        )}
      </div>
      {/* Footer con diseño premium */}
      {hasMoreNotifications && (
        <div className="bg-white border-t border-gray-200">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center justify-center gap-2 py-3 w-full text-[#4178D4] hover:bg-gray-50 transition-colors duration-200"
          >
            <span className="text-sm font-medium">
              {showAll
                ? "Ver menos"
                : `Ver ${filteredNotifications.length - 5} más`}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-300 ${
                showAll ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
