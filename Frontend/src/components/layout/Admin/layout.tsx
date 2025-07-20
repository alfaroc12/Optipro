import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Iniciar el sidebar como cerrado en pantallas pequeñas y abierto en pantallas grandes
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar el ancho de la pantalla y ajustar el sidebar al cargar y al cambiar tamaño
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile); // 768px es el breakpoint 'md' en Tailwind
    };

    // Establecer el estado inicial basado en el tamaño de pantalla
    handleResize();

    // Añadir listener para cambios de tamaño
    window.addEventListener("resize", handleResize);

    // Limpiar listener al desmontar
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Efecto para bloquear el scroll cuando el sidebar está abierto en móvil
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      // Bloquear el scroll
      document.body.style.overflow = "hidden";
    } else {
      // Permitir el scroll
      document.body.style.overflow = "";
    }

    // Limpiar el efecto al desmontar
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen, isMobile]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Pasamos el estado del sidebar al Navbar */}
      <Navbar
        toggleSidebar={toggleSidebar}
        sidebarOpen={isMobile && sidebarOpen}
      />

      <div className="flex flex-1 overflow-hidden">
        <div
          className={`
            ${sidebarOpen ? "block" : "hidden"} 
            md:${sidebarOpen ? "block" : "hidden"} 
            fixed md:relative
            z-20 md:z-0
            top-16 md:top-0
            h-[calc(100vh-64px)]
            w-64
            bg-white
            border-r border-[#34509F]
            transition-all duration-300
            overflow-y-auto
          `}
        >
          {/* Pasamos la función toggleSidebar al componente Sidebar */}
          <Sidebar toggleSidebar={toggleSidebar} />
        </div>

        {sidebarOpen && (
          <div
            className="fixed inset-0 top-16 bg-[#0000009e] bg-opacity-50 z-10 md:hidden"
            onClick={toggleSidebar}
          />
        )}

        {/* Main content */}
        <div
          className={`flex-1 ${
            isMobile && sidebarOpen ? "overflow-hidden" : "overflow-auto"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
