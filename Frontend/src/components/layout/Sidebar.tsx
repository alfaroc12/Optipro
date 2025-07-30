import type React from "react";
import { Link, useLocation } from "react-router-dom";
import { X, BarChart3 } from "lucide-react";

import OfertaIcon from "../../assets/icons/Oferta.svg";
import ProyectosIcon from "../../assets/icons/Proyectos.svg";
import InventarioIcon from "../../assets/icons/Inventario.svg";

interface SidebarProps {
  toggleSidebar?: () => void;
}
const Sidebar: React.FC<SidebarProps> = ({ toggleSidebar }) => {
  const location = useLocation();
  const menuItems = [
    {
      name: "OFERTA",
      path: "/ofertas",
      icon: OfertaIcon,
    },
    {
      name: "PROYECTOS",
      path: "/projects",
      icon: ProyectosIcon,
    },
    {
      name: "INVENTARIO",
      path: "/inventario",
      icon: InventarioIcon,
    },
    {
      name: "INFORMES",
      path: "https://app.powerbi.com/view?r=eyJrIjoiNjhjNWZiNjktMjU2NC00NDkwLTg2NjMtZTZjMmYyNDAyYjA5IiwidCI6IjhkMzY4MzZlLTZiNzUtNGRlNi1iYWI5LTVmNGIxNzc1NDI3ZiIsImMiOjR9",
      icon: <BarChart3 className="w-full h-full text-[#4178D4]" />,
      isExternal: true,
    },
  ];
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
          const isActive = location.pathname === item.path;
          const itemContent = (
            <>
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
            </>
          );
          // Si es un enlace externo, usar una etiqueta <a>
          if (item.isExternal) {
            return (
              <a
                key={item.path}
                href={item.path}
                target="_blank"
                rel="noopener noreferrer"
                className={`
                  flex items-center py-3 px-3 rounded-xl transition-all duration-200
                  ${
                    isActive
                      ? "bg-blue-50 border-l-4 border-[#4178D4]"
                      : "hover:bg-blue-50/50 border-l-4 border-transparent"
                  }
                `}
              >
                {itemContent}
              </a>
            );
          }
          // Si es un enlace interno, usar Link de React Router
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center py-3 px-3 rounded-xl transition-all duration-200
                ${
                  isActive
                    ? "bg-blue-50 border-l-4 border-[#4178D4]"
                    : "hover:bg-blue-50/50 border-l-4 border-transparent"
                }
              `}
            >
              {itemContent}
            </Link>
          );
        })}
      </div>
      {/* Footer con información o logo corporativo - opcional */}
      <div className="mt-auto p-4 border-t border-gray-100 hidden md:block">
        <div className="flex justify-center">
          <div className="text-xs text-gray-400 text-center">
            Optipro © 2025
          </div>
        </div>
      </div>
    </div>
  );
};
export default Sidebar;
