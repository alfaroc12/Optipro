
import { BarChart3 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Navbar from "@/components/layout/Admin/Navbar";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAppSelector";

const DashboardPage = () => {
  const [, setSidebarOpen] = useState(false);
  const { user } = useAppSelector((state: any) => state.auth);
  const isSupervisor = user?.role === "supervisor";

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50">
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="p-6 size-full overflow-auto">
        {/* Header con gradiente y efectos mejorados */}
        <Card className="mb-8 optipro-border optipro-shadow rounded-[20px] bg-gradient-to-r from-blue-50 to-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -mr-16 -mt-16 opacity-30"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-100 rounded-full -ml-12 -mb-12 opacity-30"></div>
          <CardContent className=" text-left relative z-10">
            <h1 className="optipro-title mb-2">Panel de control Optipro</h1>
            <CardDescription className="optipro-description">
              Gestión de cotizaciones y proyectos fotovoltaicos
            </CardDescription>
          </CardContent>
        </Card>


        {/* Main layout container */}
        <div className="max-w-[1440px] mx-auto">
          {/* Top row - Ofertas y Proyectos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Ofertas Card */}
            <Link to="/admin/ofertas" className="block no-underline group w-full max-w-[700px] mx-auto">
              <Card className="w-full optipro-border optipro-shadow rounded-[20px] hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden bg-white transform group-hover:-translate-y-1">
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-400 to-blue-600"></div>
                <CardHeader className="p-6 flex items-center">
                  <div className="mr-6 bg-blue-50 p-4 rounded-full transform group-hover:scale-110 transition-transform duration-300">
                    <img
                      src="../src/assets/icons/Oferta.svg"
                      alt="Ofertas"
                      width={72}
                      height={72}
                      className="w-16 h-16"
                    />
                  </div>
                  <div>
                    <CardTitle className="optipro-card-title mb-2">
                      OFERTAS
                    </CardTitle>
                    <CardDescription className="optipro-card-description">
                      Gestiona oportunidades
                      <br />y estado de cotizaciones
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>

            {/* Proyectos Card */}
            <Link to="/admin/projects" className="block no-underline group w-full max-w-[700px] mx-auto">
              <Card className="w-full optipro-border optipro-shadow rounded-[20px] hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden bg-white transform group-hover:-translate-y-1">
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-400 to-blue-600"></div>
                <CardHeader className="p-6 flex items-center">
                  <div className="mr-6 bg-blue-50 p-4 rounded-full transform group-hover:scale-110 transition-transform duration-300">
                    <img
                      src="../src/assets/icons/Proyectos.svg"
                      alt="Proyectos"
                      width={72}
                      height={72}
                      className="w-16 h-16"
                    />
                  </div>
                  <div>
                    <CardTitle className="optipro-card-title mb-2">
                      PROYECTOS
                    </CardTitle>
                    <CardDescription className="optipro-card-description">
                      Optimiza la ejecución y<br />
                      seguimiento de proyectos
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </div>

          {/* Bottom row - Inventario, Usuarios, Ideas ocupando todo el ancho sin gaps */}
          <div className={`grid ${!isSupervisor ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
            {/* Inventario Card - Square style */}
            <Link to="/admin/inventario" className="block no-underline group">
              <Card className="w-full h-full optipro-border optipro-shadow rounded-[20px] hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden bg-white transform group-hover:-translate-y-1">
                <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-400 to-blue-600"></div>
                <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                  <div className="mb-4 bg-blue-50 p-4 rounded-full transform group-hover:scale-110 transition-transform duration-300">
                    <img
                      src="../src/assets/icons/Inventario.svg"
                      alt="Inventario"
                      width={60}
                      height={60}
                      className="w-12 h-12"
                    />
                  </div>
                  <CardTitle className="optipro-small-title">INVENTARIO</CardTitle>
                </CardContent>
              </Card>
            </Link>

            {/* Usuarios Card - solo visible si no es supervisor */}
            {!isSupervisor && (
              <Link to="/admin/Users" className="block no-underline group">
                <Card className="w-full h-full optipro-border optipro-shadow rounded-[20px] hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden bg-white transform group-hover:-translate-y-1">
                  <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-400 to-blue-600"></div>
                  <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                    <div className="mb-4 bg-blue-50 p-4 rounded-full transform group-hover:scale-110 transition-transform duration-300">
                      <img
                        src="../src/assets/icons/Users.svg"
                        alt="Usuarios"
                        width={60}
                        height={60}
                        className="w-12 h-12"
                      />
                    </div>
                    <CardTitle className="optipro-small-title">USUARIOS</CardTitle>
                  </CardContent>
                </Card>
              </Link>
            )}

            {/* Ideas Card */}
            {/* Informes Card */}
        <a 
          href="https://app.powerbi.com/view?r=eyJrIjoiMTAxZjExMzctZWJjMi00NzcyLThhYWUtM2VhYTlhNWQ4MWFhIiwidCI6IjhkMzY4MzZlLTZiNzUtNGRlNi1iYWI5LTVmNGIxNzc1NDI3ZiIsImMiOjR9" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block no-underline group"
        >
          <Card className="w-full h-full optipro-border optipro-shadow rounded-[20px] hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden bg-white transform group-hover:-translate-y-1">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-400 to-blue-600"></div>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
              <div className="mb-4 bg-blue-50 p-4 rounded-full transform group-hover:scale-110 transition-transform duration-300">
                <BarChart3 
                  size={48}
                  className="w-12 h-12 text-blue-600"
                />
              </div>
              <CardTitle className="optipro-small-title">INFORMES</CardTitle>
            </CardContent>
          </Card>
        </a>
          </div>
        </div>

        {/* Footer con marca de agua discreta */}
        <div className="mt-8 text-center text-sm text-gray-400">
          <p>
            Optipro © {new Date().getFullYear()} - Proingelectric
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;