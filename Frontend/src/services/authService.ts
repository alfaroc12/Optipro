import api from "./api";
import { User } from "@/types/user";

interface LoginResponse {
  user: User;
  token: string;
}

interface BackendUser {
  id: number;
  username: string;
  email: string;
  role?: string; // El backend ahora envía directamente el rol
  profile?: {
    categoria?: string;
  };
}

export const authService = {
  /**
   * Inicia sesión y mapea el tipo de usuario al rol correspondiente
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await api.post("auth/login/", {
      username,
      password,
    });

    // Datos originales del backend
    const backendUser = response.data.user as BackendUser;
    const token = response.data.token; // El backend ahora envía el rol directamente, pero verificamos y asignamos según corresponda
    let role = backendUser.role || "user";

    // Verificación adicional: si tenemos información del perfil y categoría
    if (backendUser.profile?.categoria) {
      const categoria = backendUser.profile.categoria.toLowerCase();

      // Si la categoría es 'administrador', asignamos el rol 'admin'
      if (categoria === "administrador") {
        role = "admin";
      }
      // Si la categoría es 'supervisor', asignamos ese rol
      else if (categoria === "supervisor") {
        role = "supervisor";
      }
    }

    // Verifica que el rol sea uno de los tipos válidos
    if (role !== "admin" && role !== "supervisor" && role !== "user") {
      role = "user"; // Valor predeterminado si el rol no es válido
    }

    // Crear el objeto de usuario para el frontend
    const user: User = {
      id: backendUser.id,
      username: backendUser.username,
      email: backendUser.email || "",
      role: role as "user" | "admin" | "supervisor",
    };

    

    return { user, token };
  },

  /**
   * Cierra la sesión del usuario
   */
  async logout(): Promise<void> {
    try {
      await api.post("auth/logout/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }

    // Limpiar datos locales
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
  },
};

export default authService;
