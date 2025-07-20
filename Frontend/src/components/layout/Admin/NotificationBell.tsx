import React, { useState } from "react";
import { Bell } from "lucide-react";
import NotificationPanel from "./NotificationPanel";
import { useNotifications } from "@/hooks/useNotifications";

interface NotificationBellProps {
  count?: number; // Este prop ahora es opcional ya que usaremos el hook
}

const NotificationBell: React.FC<NotificationBellProps> = ({ count }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount } = useNotifications();

  // Usamos el prop count si está definido, de lo contrario usamos unreadCount del hook
  const notificationCount = count !== undefined ? count : unreadCount;

  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleNotifications}
        className="relative p-3 rounded-xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 hover:bg-gray-100 cursor-pointer"
        aria-label="Notificaciones"
      >
        {" "}
        <Bell className="h-6 w-6 text-[#34509F] transition-colors duration-300" />{" "}
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#E53E3E] bg-opacity-85 text-white text-xs font-medium rounded-full h-5 w-5 flex items-center justify-center shadow-sm border border-white">
            {notificationCount > 99 ? "99+" : notificationCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop mejorado que no interfiere con otros elementos */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            style={{ zIndex: 30 }}
          />
          <div className="absolute right-0 sm:-right-24 md:right-0 mt-3 z-40 w-[calc(100vw-20px)] max-w-[20rem] sm:max-w-[24rem] md:max-w-[28rem]">
            <NotificationPanel onClose={() => setIsOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
