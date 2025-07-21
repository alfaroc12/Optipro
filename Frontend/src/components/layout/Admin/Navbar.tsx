import { UserCircle, Menu, Settings, User, LogOut } from "lucide-react";
import { useDispatch } from "react-redux";
import { logout } from "@/store/slices/authSlice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import { useNotifications } from "@/hooks/useNotifications";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


interface NavbarProps {
  toggleSidebar: () => void;
  sidebarOpen?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({
  toggleSidebar,
  sidebarOpen = false,
}) => {
  const dispatch = useDispatch();
  // Usamos el hook unificado de notificaciones
  useNotifications();
  // Obtener la información del perfil de usuario
  const { profileData } = useUserProfile();

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm h-16 sticky top-0 z-50 transition-all duration-200">
      <div className="h-full container mx-auto flex justify-between items-center px-4">
        <div className="flex items-center">
          {/* Botón de hamburguesa con animación */}
          {!sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="mr-3 md:hidden p-2 rounded-full hover:bg-blue-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
              aria-label="Toggle sidebar"
            >
              <Menu className="text-[#34509F] h-5 w-5" />
            </button>
          )}
          <Link
            to="/admin/dashboard"
            className="cursor-pointer transition-transform duration-200 hover:scale-105"
          >
            <img
              src="../assets/Logo.svg"
              alt="OptiPro"
              className="h-14 md:h-16"
            />
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {" "}
          {/* Componente de notificaciones con animación */}
          <div className=" cursor-pointer">
            <NotificationBell />
          </div>
          {/* Dropdown de usuario mejorado */}{" "}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer rounded-full hover:bg-blue-50 p-1 pr-2 transition-colors duration-200">
                {profileData?.profile_image ? (
                  <Avatar className="h-8 w-8 border border-gray-200">
                    <AvatarImage src={profileData.profile_image} />
                    <AvatarFallback>
                      <UserCircle className="text-[#34509F] h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <UserCircle className="text-[#34509F] h-8 w-8" />
                )}
                <span className="text-gray-700 text-sm font-medium hidden md:inline">
                  Mi cuenta
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-xl p-1 shadow-lg border border-gray-100">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1 py-1">
                  <p className="text-sm font-medium">
                    {profileData?.nombre ||
                      profileData?.username ||
                      "Mi Cuenta"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {profileData?.email || "usuario@optipro.com"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-100" />
              <DropdownMenuGroup>
                {" "}
                <DropdownMenuItem
                  className="cursor-pointer rounded-lg hover:bg-blue-50 focus:bg-blue-50 transition-colors duration-150 my-1"
                  onClick={() => (window.location.href = "/admin/profile")}
                >
                  <User className="h-4 w-4 mr-2 text-[#34509F]" />
                  <span>Perfil</span>
                  <DropdownMenuShortcut className="text-xs text-gray-400">
                    ⇧⌘P
                  </DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer rounded-lg hover:bg-blue-50 focus:bg-blue-50 transition-colors duration-150 my-1">
                  <Settings className="h-4 w-4 mr-2 text-[#34509F]" />
                  <span>Ajustes</span>
                  <DropdownMenuShortcut className="text-xs text-gray-400">
                    ⌘S
                  </DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator className="bg-gray-100" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer rounded-lg hover:bg-red-50 focus:bg-red-50 transition-colors duration-150 my-1"
              >
                <LogOut className="h-4 w-4 mr-2 text-red-500" />
                <span className="text-red-500">Cerrar sesión</span>
                <DropdownMenuShortcut className="text-xs text-gray-400">
                  ⇧⌘Q
                </DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
