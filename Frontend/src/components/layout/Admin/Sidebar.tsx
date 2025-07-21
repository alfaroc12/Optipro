import type React from "react";
import { Link, useLocation } from "react-router-dom";
import { X, BarChart3 } from "lucide-react";
import { useAppSelector } from "@/hooks/useAppSelector";

interface SidebarProps {
  toggleSidebar?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ toggleSidebar }) => {
  const location = useLocation();
  
  const { user } = useAppSelector((state) => state.auth);
  const isSupervisor = user?.role === "supervisor";

  // Menú base sin la opción de usuarios
  const baseMenuItems = [
    {
      name: "OFERTA",
      path: "/admin/ofertas",
      icon: "../assets/icons/Oferta.svg",
      isExternal: false,
    },
    {
      name: "PROYECTOS",
      path: "/admin/projects",
      icon: "../assets/icons/Proyectos.svg",
      isExternal: false,
    },
    {
      name: "INVENTARIO",
      path: "/admin/inventario",
      icon: "../assets/icons/Inventario.svg",
      isExternal: false,
    },
    {
      name: "INFORMES",
      path: "https://app.powerbi.com/view?r=eyJrIjoiMTAxZjExMzctZWJjMi00NzcyLThhYWUtM2VhYTlhNWQ4MWFhIiwidCI6IjhkMzY4MzZlLTZiNzUtNGRlNi1iYWI5LTVmNGIxNzc1NDI3ZiIsImMiOjR9",
      icon: <BarChart3 className="w-full h-full text-[#4178D4]" />,
      isExternal: true,
    },
  ];

  // Opción de usuarios (solo se muestra a administradores)
  const usersMenuItem = {
    name: "USUARIOS",
    path: "/admin/Users",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={48}
        height={48}
        viewBox="0 0 24 24"
      >
        <path
          fill="#4d88d4"
          d="M24 14.6c0 .6-1.2 1-2.6 1.2c-.9-1.7-2.7-3-4.8-3.9c.2-.3.4-.5.6-.8h.8c3.1-.1 6 1.8 6 3.5M6.8 11H6c-3.1 0-6 1.9-6 3.6c0 .6 1.2 1 2.6 1.2c.9-1.7 2.7-3 4.8-3.9zm5.2 1c2.2 0 4-1.8 4-4s-1.8-4-4-4s-4 1.8-4 4s1.8 4 4 4m0 1c-4.1 0-8 2.6-8 5c0 2 8 2 8 2s8 0 8-2c0-2.4-3.9-5-8-5m5.7-3h.3c1.7 0 3-1.3 3-3s-1.3-3-3-3c-.5 0-.9.1-1.3.3c.8 1 1.3 2.3 1.3 3.7c0 .7-.1 1.4-.3 2M6 10h.3C6.1 9.4 6 8.7 6 8c0-1.4.5-2.7 1.3-3.7C6.9 4.1 6.5 4 6 4C4.3 4 3 5.3 3 7s1.3 3 3 3"
        ></path>
      </svg>
    ),
    isExternal: false,
  };

  // Agregar la opción de usuarios solo si no es supervisor
  const menuItems = isSupervisor
    ? baseMenuItems
    : [...baseMenuItems.slice(0, 3), usersMenuItem, ...baseMenuItems.slice(3)];

  return (
    <div className="h-full bg-white overflow-y-auto flex flex-col shadow-lg border-r border-gray-100">
      {/* Header con logo y botón de cierre */}
      <div className="h-16 px-4 flex justify-between items-center border-b border-[#34509F] md:hidden">
        <div className="font-bold text-[#4178D4] text-xl tracking-wide">
          Menú
        </div>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-full hover:bg-blue-50 transition-colors duration-200"
          aria-label="Cerrar sidebar"
        >
          <X className="text-[#34509F] h-5 w-5" />
        </button>
      </div>

      {/* Espacio superior en desktop */}
      <div className="hidden md:block h-6"></div>

      {/* Contenedor de los items del menú */}
      <div className="flex flex-col space-y-1 p-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path && !item.isExternal;

          const ItemContent = () => (
            <div
              className={`
                flex items-center py-3 px-3 rounded-xl transition-all duration-200
                ${
                  isActive
                    ? "bg-blue-50 border-l-4 border-[#4178D4]"
                    : "hover:bg-blue-50/50 border-l-4 border-transparent"
                }
              `}
            >
              <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                {typeof item.icon === "string" ? (
                  <img
                    src={item.icon}
                    alt={`${item.name} icon`}
                    className={`w-full h-full object-contain transition-transform duration-200 ${
                      isActive ? "scale-110" : ""
                    }`}
                  />
                ) : (
                  item.icon
                )}
              </div>
              <span
                className={`
                ml-3 text-[#4178D4] font-bold text-base md:text-lg tracking-wide
                transition-all duration-200
                ${isActive ? "transform translate-x-1" : ""}
              `}
              >
                {item.name}
              </span>
            </div>
          );

          // Si es un enlace externo, usar una etiqueta <a>
          if (item.isExternal) {
            return (
              <a
                key={item.path}
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <ItemContent />
              </a>
            );
          }

          // Si es un enlace interno, usar Link de React Router
          return (
            <Link key={item.path} to={item.path} className="block">
              <ItemContent />
            </Link>
          );
        })}
      </div>

      {/* Footer con información o logo corporativo - opcional */}
      <div className="mt-auto p-4 border-t border-gray-100 hidden md:block">
        <div className="flex justify-center">
          <div className="text-xs text-gray-400 text-center">Optipro © 2025</div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
