import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { loginSuccess } from "@/store/slices/authSlice";
import { User } from "@/types/user";
import api from "@/services/api";

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Verificar si hay token y usuario guardados en sessionStorage
        const token = sessionStorage.getItem("token");
        const userStr = sessionStorage.getItem("user");

        if (token && userStr) {
          const user = JSON.parse(userStr) as User;

          // Opcionalmente, verificar si el token sigue siendo válido
          try {
            // Hacer una petición ligera para validar el token
            await api.get("profile/");

            // Si llegamos aquí, el token es válido
            console.log("Sesión restaurada correctamente");

            // Restaurar la sesión
            dispatch(loginSuccess({ user, token }));
          } catch (error) {
            console.error("Token inválido o expirado:", error);
            // Limpiar sessionStorage si el token no es válido
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("user");
            // El interceptor en api.ts se encargará de redirigir si es necesario
          }
        }
      } catch (error) {
        console.error("Error al inicializar la autenticación:", error);
        // Si hay error, limpiar sessionStorage por seguridad
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#34509F]"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthProvider;
