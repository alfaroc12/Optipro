import api from "@/services/api";

/**
 * Servicios para gestionar la información del perfil de usuario
 */

export interface ProfileData {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  nombre: string;
  cargo: string;
  ciudad: string;
  telefono: string;
  cedula: string;
  categoria: string;
  profile_image?: string | null;
}

/**
 * Obtiene la información del perfil del usuario
 */
export const getUserProfile = async (): Promise<ProfileData> => {
  try {
    
    

    const response = await api.get("profile/");
    
    return response.data;
  } catch (error: any) {
    console.error(
      "Error al obtener perfil:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/**
 * Actualiza la información del perfil del usuario
 */
export const updateUserProfile = async (
  profileData: Partial<ProfileData>,
  profileImage?: File
): Promise<ProfileData> => {
  try {
    

    // Si hay una imagen, usamos FormData para enviar los datos
    if (profileImage) {
      const formData = new FormData();

      // Agregamos la imagen al FormData
      formData.append("profile_image", profileImage);

      // Agregamos el resto de datos al FormData
      Object.entries(profileData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          
          formData.append(key, String(value));
        }
      });

      const response = await api.put("profile/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      return response.data;
    } else {
      // Si no hay imagen, enviamos los datos como JSON normalmente
      const response = await api.put("profile/", profileData);
      
      return response.data;
    }
  } catch (error: any) {
    console.error(
      "Error al actualizar perfil:",
      error.response?.data || error.message
    );
    throw error;
  }
};
