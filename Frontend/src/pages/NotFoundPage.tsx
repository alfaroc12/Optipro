import { useState, useEffect, KeyboardEvent } from "react";
import {
  Home,
  Search,
  ArrowLeft,
  RefreshCw,
  MapPin,
  Compass,
} from "lucide-react";

const NotFoundPage = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    setIsLoaded(true);

    // Mouse movement effect
    const handleMouseMove = (e: { clientX: number; clientY: number }) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);
  const handleSearch = (e: KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setShowError(false);
    
    
    const userRoutes = [
      "/", 
      "/dashboard", 
      "/projects", 
      "/quotes", 
      "/ofertas", 
      "/profile"
    ];
    
    const adminRoutes = [
      ...userRoutes,
      "/admin/dashboard",
      "/admin/ofertas", 
      "/admin/projects",
      "/admin/users",
      "/admin/profile"
    ];
    
    // Get user role (aquí deberías usar tu contexto de autenticación real)
    // Por ahora usando localStorage como ejemplo
    const userRole = localStorage.getItem('userRole') || 'user';
    
    // Determine available routes based on user role
    const availableRoutes = userRole === "admin" ? adminRoutes : userRoutes;
    
    // Format the search term as a route
    let requestedRoute = searchTerm.startsWith("/") ? searchTerm : `/${searchTerm}`;
    requestedRoute = requestedRoute.toLowerCase();
    
    setTimeout(() => {
      setIsSearching(false);
      
      // Check if the route exists in available routes
      if (availableRoutes.includes(requestedRoute)) {
        // Navigate to the route usando React Router (mejor que window.location.href)
        window.location.href = requestedRoute;
      } else {
        // Mostrar mensaje de error elegante en lugar de alert
        setErrorMessage(`La ruta "${requestedRoute}" no existe o no tienes permisos para acceder.`);
        setShowError(true);
        
        // Auto-hide error after 5 seconds
        setTimeout(() => {
          setShowError(false);
        }, 5000);
      }
    }, 1000);
  };

  const handleGoHome = () => {
    // Aquí podrías usar React Router para navegar
    window.location.href = "/"; 
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const floatingElements = Array.from({ length: 6 }, (_, i) => (
    <div
      key={i}
      className={`absolute w-2 h-2 bg-[#4178D4] rounded-full opacity-20 animate-pulse`}
      style={{
        left: `${20 + i * 15}%`,
        top: `${30 + i * 8}%`,
        animationDelay: `${i * 0.5}s`,
        animationDuration: `${2 + i * 0.3}s`,
      }}
    />
  ));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-100/20 flex items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingElements}

        {/* Animated gradient orbs */}
        <div
          className="absolute w-96 h-96 bg-gradient-to-r from-[#4178D4]/10 to-[#34509F]/10 rounded-full blur-3xl transition-transform duration-1000 ease-out"
          style={{
            transform: `translate(${mousePosition.x * 0.05}px, ${
              mousePosition.y * 0.05
            }px)`,
            left: "10%",
            top: "10%",
          }}
        />
        <div
          className="absolute w-64 h-64 bg-gradient-to-r from-[#34509F]/10 to-[#4178D4]/10 rounded-full blur-2xl transition-transform duration-1000 ease-out"
          style={{
            transform: `translate(${-mousePosition.x * 0.03}px, ${
              -mousePosition.y * 0.03
            }px)`,
            right: "10%",
            bottom: "20%",
          }}
        />
      </div>

      <div
        className={`relative z-10 max-w-4xl mx-auto px-6 text-center transform transition-all duration-1000 ${
          isLoaded ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        }`}
      >
        {/* 404 Number - Large and animated */}
        <div className="mb-8 relative">
          <h1 className="text-8xl md:text-9xl font-black text-transparent bg-gradient-to-r from-[#34509F] to-[#4178D4] bg-clip-text animate-pulse">
            404
          </h1>

          {/* Floating compass animation */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <Compass
              className="w-16 h-16 text-[#4178D4]/30 animate-spin"
              style={{ animationDuration: "8s" }}
            />
          </div>
        </div>

        {/* Main content card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8 md:p-12 mb-8 transform hover:scale-105 transition-all duration-500">
          <div className="mb-6">
            <MapPin className="w-12 h-12 text-[#4178D4] mx-auto mb-4 animate-bounce" />
            <h2 className="text-3xl md:text-4xl font-bold text-[#34509F] mb-4 animate-fade-in">
              ¡Ups! Te has perdido
            </h2>
            <p className="text-lg text-gray-600 mb-2 leading-relaxed">
              Parece que la página que buscas decidió tomar unas vacaciones
            </p>
            <p className="text-gray-500">
              No te preocupes, te ayudamos a encontrar el camino de vuelta
            </p>
          </div>          {/* Search section */}
          <div className="mb-8">
            <div className="max-w-md mx-auto relative">
              <div className="flex items-center bg-gray-50 rounded-2xl border-2 border-gray-200 focus-within:border-[#4178D4] focus-within:ring-4 focus-within:ring-[#4178D4]/10 transition-all duration-300">
                <Search className="w-5 h-5 text-gray-400 ml-4" />
                <input
                  type="text"
                  placeholder="¿Qué estabas buscando?"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-4 bg-transparent border-none outline-none text-gray-700 placeholder-gray-400"
                  onKeyPress={(e) => e.key === "Enter" && handleSearch(e)}
                />
                <button
                  onClick={handleSearch}
                  disabled={!searchTerm.trim() || isSearching}
                  className="m-2 px-6 py-2 bg-[#4178D4] text-white rounded-xl hover:bg-[#34509F] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSearching ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Buscando...</span>
                    </>
                  ) : (
                    <span>Buscar</span>
                  )}
                </button>
              </div>
            </div>

            {/* Error notification - Elegant replacement for alert */}
            {showError && (
              <div className={`mt-4 max-w-md mx-auto transform transition-all duration-500 ${
                showError ? "translate-y-0 opacity-100 scale-100" : "translate-y-4 opacity-0 scale-95"
              }`}>
                <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-400 rounded-lg p-4 shadow-lg">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-red-500" />
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-red-800">
                        Ruta no encontrada
                      </h3>
                      <p className="text-sm text-red-600 mt-1">
                        {errorMessage}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowError(false)}
                      className="ml-4 text-red-400 hover:text-red-600 transition-colors duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleGoHome}
              className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#4178D4] to-[#34509F] text-white rounded-2xl hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 font-semibold"
            >
              <Home className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
              <span>Ir al Inicio</span>
            </button>

            <button
              onClick={handleGoBack}
              className="group flex items-center gap-3 px-8 py-4 bg-white text-[#4178D4] border-2 border-[#4178D4] rounded-2xl hover:bg-[#4178D4] hover:text-white transform hover:-translate-y-1 transition-all duration-300 font-semibold"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
              <span>Volver Atrás</span>
            </button>
          </div>
        </div>

        {/* Helpful suggestions */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/50">
          <h3 className="text-lg font-semibold text-[#34509F] mb-4">
            Mientras tanto, puedes:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-white/50 rounded-xl hover:bg-white/70 transition-colors duration-300 cursor-pointer">
              <div className="w-8 h-8 bg-[#4178D4]/10 rounded-lg flex items-center justify-center mb-2 mx-auto">
                <Home className="w-4 h-4 text-[#4178D4]" />
              </div>
              <p className="font-medium text-[#34509F]">Explorar el inicio</p>
              <p className="text-gray-600 text-xs mt-1">
                Descubre nuestro contenido principal
              </p>
            </div>

            <div className="p-3 bg-white/50 rounded-xl hover:bg-white/70 transition-colors duration-300 cursor-pointer">
              <div className="w-8 h-8 bg-[#4178D4]/10 rounded-lg flex items-center justify-center mb-2 mx-auto">
                <Search className="w-4 h-4 text-[#4178D4]" />
              </div>
              <p className="font-medium text-[#34509F]">Usar el buscador</p>
              <p className="text-gray-600 text-xs mt-1">
                Encuentra exactamente lo que necesitas
              </p>
            </div>

            <div className="p-3 bg-white/50 rounded-xl hover:bg-white/70 transition-colors duration-300 cursor-pointer">
              <div className="w-8 h-8 bg-[#4178D4]/10 rounded-lg flex items-center justify-center mb-2 mx-auto">
                <RefreshCw className="w-4 h-4 text-[#4178D4]" />
              </div>
              <p className="font-medium text-[#34509F]">Recargar página</p>
              <p className="text-gray-600 text-xs mt-1">
                A veces es solo un error temporal
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </div>
  );
};

export default NotFoundPage;
