import { useState, useEffect } from "react";
import { getUserProfile } from "@/services/profileService";
import { ProfileData } from "@/services/profileService";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export const useUserProfile = () => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Verificamos si el usuario está autenticado
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getUserProfile();
        setProfileData(data);
        setError(null);
      } catch (err: any) {
        console.error("Error al obtener perfil de usuario:", err);
        setError(err.message || "Error al cargar el perfil");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [isAuthenticated]);

  return {
    profileData,
    loading,
    error,
  };
};
