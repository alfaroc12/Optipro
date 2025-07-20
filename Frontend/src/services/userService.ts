import api from "./api";
import { Usuario } from "@/store/slices/userSlice";

interface UserResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: any[];
}

interface UserCreate {
  nombre: string;
  usuario: string;
  contrasena: string;
  ciudad: string;
  correoElectronico: string;
  telefono: string;
  cargo: string;
  cedula: string;
  proyecto?: string;
  categoriaUsuario: string;
}

export type { UserCreate };

// Función para transformar los datos del API al formato de Usuario
const transformApiDataToUser = (userData: any): Usuario => {
  const estado = (): "activo" | "inactivo" | "suspendido" | "pendiente" => {
    if (userData.is_active === true) return "activo";
    if (userData.is_active === false) return "inactivo";
    if (userData.status === "suspended") return "suspendido";
    if (userData.status === "pending") return "pendiente";
    return "inactivo";
  };

  return {
    id: userData.id,
    nombre: `${userData.first_name} ${userData.last_name || ""}`.trim(),
    usuario: userData.username,
    ciudad: userData.profile?.ciudad || "",
    cedula: userData.profile?.cedula || "",
    email: userData.email,
    telefono: userData.profile?.telefono || "",
    cargo: userData.profile?.cargo || "",
    fechaRegistro: userData.date_joined
      ? new Date(userData.date_joined).toLocaleDateString("es-ES")
      : "",
    estado: estado(),
    tipoUsuario: userData.profile?.categoria?.toLowerCase() || "cliente",
  };
};

// Función para transformar los datos del formulario al formato de API
const transformUserToApiData = (userData: UserCreate) => {
  return {
    username: userData.usuario,
    password: userData.contrasena,
    email: userData.correoElectronico,
    first_name: userData.nombre.split(" ")[0] || "",
    last_name: userData.nombre.split(" ").slice(1).join(" ") || "",
    profile: {
      ciudad: userData.ciudad,
      telefono: userData.telefono,
      cargo: userData.cargo,
      cedula: userData.cedula,
      categoria: userData.categoriaUsuario,
    },
    // Otros campos específicos pueden agregarse según sea necesario
  };
};

export const userService = {
  // Obtener todos los usuarios con paginación
  getAllUsers: async (
    page: number = 1,
    pageSize: number = 10,
    searchTerm: string = "",
    filterStatus: string | null = null
  ) => {
    try {
      let url = `/api/users/?page=${page}&size=${pageSize}`;

      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }

      if (filterStatus) {
        url += `&status=${filterStatus}`;
      }

      

      const response = await api.get<UserResponse>(url);

      

      return {
        users: response.data.results.map(transformApiDataToUser),
        total: response.data.count,
        pages: Math.ceil(response.data.count / pageSize),
      };
    } catch (error: any) {
      console.error("Error al conectar con la API:", error);
      console.error("Detalles:", error?.response?.data || error.message);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Error al obtener usuarios: " +
          (error?.response?.status || "desconocido");

      // Si el backend no está disponible o no tiene la ruta implementada,
      // considera usar datos de prueba en lugar de fallar completamente
      throw new Error(message);
    }
  },

  // Obtener un usuario por ID
  getUserById: async (id: number) => {
    const response = await api.get(`/api/users/${id}/`);
    return transformApiDataToUser(response.data);
  },
  // Crear un nuevo usuario
  createUser: async (userData: UserCreate) => {
    try {
      const transformedData = transformUserToApiData(userData);
      const response = await api.post("/api/users/", transformedData);
      return transformApiDataToUser(response.data);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.email?.[0] ||
        error?.response?.data?.username?.[0] ||
        "Error al crear usuario";
      throw new Error(message);
    }
  },

  // Actualizar un usuario existente
  updateUser: async (id: number, userData: Partial<UserCreate>) => {
    try {
      const transformedData = {
        ...transformUserToApiData(userData as UserCreate),
        // Si no se proporciona contraseña, no la enviamos en la actualización
        password: userData.contrasena ? userData.contrasena : undefined,
      };
      delete transformedData.password; // Eliminamos la contraseña si es undefined

      const response = await api.put(`/api/users/${id}/`, transformedData);
      return transformApiDataToUser(response.data);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Error al actualizar usuario";
      throw new Error(message);
    }
  },

  // Cambiar el estado de un usuario (activar/desactivar)
  changeUserStatus: async (id: number, isActive: boolean) => {
    const response = await api.patch(`/api/users/${id}/`, {
      is_active: isActive,
    });
    return transformApiDataToUser(response.data);
  },
  // Eliminar un usuario
  deleteUser: async (id: number) => {
    try {
      await api.delete(`/api/users/${id}/`);
      return id;
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Error al eliminar usuario";
      throw new Error(message);
    }
  },
};
