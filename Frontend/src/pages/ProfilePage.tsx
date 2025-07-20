import { useState, ChangeEvent, useEffect } from "react";
import {
  Camera,
  Edit2,
  Save,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  CreditCard,
  Tag,
  CheckCircle,
  AlertCircle,
  RefreshCw, // Añadido ícono de recarga
} from "lucide-react";
import Layout from "@/components/layout/layout";
import { getUserProfile, updateUserProfile } from "@/services/profileService";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null); // Para mensajes de error específicos al cargar

  // Obtener el usuario autenticado del store
  const authUser = useSelector((state: RootState) => state.auth.user);

  const [userData, setUserData] = useState({
    nombre: "",
    usuario: "",
    ciudad: "",
    telefono: "",
    cedula: "",
    correo: "",
    cargo: "",
    categoria: "",
  });
  const [originalData, setOriginalData] = useState({ ...userData });
  const [errorMessage, setErrorMessage] = useState(
    "Ha ocurrido un error al actualizar tu perfil."
  );

  // Cargar datos del perfil al iniciar
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        setLoadError(null); // Limpiamos errores anteriores
        const profileData = await getUserProfile();

        // Mapear los datos del backend al formato del frontend
        setUserData({
          nombre: profileData.nombre || "",
          usuario: profileData.username || "",
          ciudad: profileData.ciudad || "",
          telefono: profileData.telefono || "",
          cedula: profileData.cedula || "",
          correo: profileData.email || "",
          cargo: profileData.cargo || "",
          categoria: profileData.categoria || "",
        });

        setOriginalData({
          nombre: profileData.nombre || "",
          usuario: profileData.username || "",
          ciudad: profileData.ciudad || "",
          telefono: profileData.telefono || "",
          cedula: profileData.cedula || "",
          correo: profileData.email || "",
          cargo: profileData.cargo || "",
          categoria: profileData.categoria || "",
        });

        // Si hay una imagen de perfil, establecerla
        if (profileData.profile_image) {
          setProfileImage(profileData.profile_image);
        }
      } catch (error: any) {
        console.error("Error al cargar datos del perfil:", error);
        setShowError(true);
        // Mensaje de error más descriptivo
        if (error.response?.status === 401) {
          setLoadError(
            "Tu sesión ha expirado. Por favor, vuelve a iniciar sesión."
          );
        } else if (error.response?.status === 500) {
          setLoadError(
            "Error en el servidor. El equipo técnico ha sido notificado."
          );
        } else {
          setLoadError(
            error.response?.data?.error ||
              "No se pudieron cargar los datos del perfil."
          );
        }
        setErrorMessage("No se pudieron cargar los datos del perfil.");
      } finally {
        setIsLoading(false);
      }
    };

    if (authUser) {
      fetchProfileData();
    }
  }, [authUser]);

  // Función para reintentar la carga del perfil
  const handleRetryLoad = () => {
    if (authUser) {
      const fetchProfileData = async () => {
        try {
          setIsLoading(true);
          setLoadError(null);
          const profileData = await getUserProfile();

          // Mapear los datos del backend al formato del frontend
          setUserData({
            nombre: profileData.nombre || "",
            usuario: profileData.username || "",
            ciudad: profileData.ciudad || "",
            telefono: profileData.telefono || "",
            cedula: profileData.cedula || "",
            correo: profileData.email || "",
            cargo: profileData.cargo || "",
            categoria: profileData.categoria || "",
          });

          setOriginalData({
            nombre: profileData.nombre || "",
            usuario: profileData.username || "",
            ciudad: profileData.ciudad || "",
            telefono: profileData.telefono || "",
            cedula: profileData.cedula || "",
            correo: profileData.email || "",
            cargo: profileData.cargo || "",
            categoria: profileData.categoria || "",
          });

          // Si hay una imagen de perfil, establecerla
          if (profileData.profile_image) {
            setProfileImage(profileData.profile_image);
          }

          setShowError(false);
        } catch (error: any) {
          console.error("Error al cargar datos del perfil:", error);
          setShowError(true);
          if (error.response?.status === 401) {
            setLoadError(
              "Tu sesión ha expirado. Por favor, vuelve a iniciar sesión."
            );
          } else if (error.response?.status === 500) {
            setLoadError(
              "Error en el servidor. El equipo técnico ha sido notificado."
            );
          } else {
            setLoadError(
              error.response?.data?.error ||
                "No se pudieron cargar los datos del perfil."
            );
          }
        } finally {
          setIsLoading(false);
        }
      };

      fetchProfileData();
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          setProfileImage(event.target.result as string);
          setProfileImageFile(file);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target;
    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setShowError(false);

    try {
      // Transformar datos para el backend
      const profileDataToUpdate = {
        username: userData.usuario,
        email: userData.correo,
        // Separar el nombre completo en first_name y last_name
        first_name: userData.nombre.split(" ")[0] || "",
        last_name: userData.nombre.split(" ").slice(1).join(" ") || "",
        ciudad: userData.ciudad,
        telefono: userData.telefono,
        cedula: userData.cedula,
        cargo: userData.cargo,
        categoria: userData.categoria,
      };

      setIsSaving(true);
      // Enviar datos al backend con la imagen si existe
      await updateUserProfile(
        profileDataToUpdate,
        profileImageFile || undefined
      );

      setOriginalData({ ...userData });
      setIsEditing(false);
      setShowSuccess(true);
      setProfileImageFile(null); // Limpiar el archivo después de subir
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error al actualizar perfil:", error);
      setShowError(true);
      // Mensaje de error más descriptivo
      if (error.response?.status === 401) {
        setErrorMessage(
          "Tu sesión ha expirado. Por favor, vuelve a iniciar sesión."
        );
      } else if (error.response?.status === 400) {
        setErrorMessage(
          "Datos de perfil inválidos. Por favor verifica la información."
        );
      } else {
        setErrorMessage(
          error.response?.data?.error ||
            "Ha ocurrido un error al actualizar tu perfil."
        );
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setUserData({ ...originalData });
    setProfileImage(null);
    setProfileImageFile(null);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setOriginalData({ ...userData });
    setIsEditing(true);
  };

  const fieldConfig = [
    {
      key: "nombre",
      label: "Nombre Completo",
      icon: User,
      type: "text",
      placeholder: "Ingresa tu nombre completo",
    },
    {
      key: "usuario",
      label: "Usuario",
      icon: User,
      type: "text",
      placeholder: "Nombre de usuario",
    },
    {
      key: "correo",
      label: "Correo Electrónico",
      icon: Mail,
      type: "email",
      placeholder: "ejemplo@correo.com",
    },
    {
      key: "telefono",
      label: "Teléfono",
      icon: Phone,
      type: "tel",
      placeholder: "+57 300 123 4567",
    },
    {
      key: "ciudad",
      label: "Ciudad",
      icon: MapPin,
      type: "text",
      placeholder: "Tu ciudad de residencia",
    },
    {
      key: "cargo",
      label: "Cargo",
      icon: Briefcase,
      type: "text",
      placeholder: "Tu cargo actual",
    },
    {
      key: "cedula",
      label: "Número de Cédula",
      icon: CreditCard,
      type: "text",
      placeholder: "1234567890",
    },
    {
      key: "categoria",
      label: "Categoría de Usuario",
      icon: Tag,
      type: "text",
      placeholder: "Categoría del usuario",
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-[#34509F] mb-2">
                    Mi Perfil
                  </h1>
                  <p className="text-gray-600">
                    Administra tu información personal y mantén tu perfil
                    actualizado
                  </p>
                </div>

                {!isLoading && !isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-3 px-6 py-3 rounded-xl text-[#4178D4] border-2 border-[#4178D4] hover:bg-[#4178D4] hover:text-white transition-all duration-300 font-medium shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  >
                    <Edit2 className="w-5 h-5" />
                    <span>Editar Perfil</span>
                  </button>
                ) : isLoading ? (
                  <div className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 text-gray-500">
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    <span>Cargando...</span>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl text-gray-600 border-2 border-gray-300 hover:bg-gray-50 transition-all duration-300 font-medium"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancelar</span>
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#4178D4] text-white hover:bg-[#34509F] transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-70 disabled:transform-none"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Guardar Cambios</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-xl shadow-sm animate-pulse">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-400 mr-3" />
                <p className="text-green-800 font-medium">
                  ¡Perfil actualizado exitosamente!
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {showError && loadError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{loadError}</p>
                  <button
                    onClick={handleRetryLoad}
                    className="mt-3 flex items-center gap-2 text-sm font-medium text-red-700 hover:text-red-800"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reintentar cargar perfil
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          {isLoading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 border-4 border-[#4178D4] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">
                Cargando información del perfil...
              </p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Image Section */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 h-fit sticky top-6">
                    <div className="text-center">
                      <div className="relative inline-block mb-6">
                        <div className="relative w-48 h-48 mx-auto">
                          <div className="w-full h-full rounded-full border-4 border-[#4178D4] p-1 shadow-lg bg-white">
                            {profileImage ? (
                              <img
                                src={profileImage}
                                alt="Foto de perfil"
                                className="w-full h-full object-cover rounded-full"
                              />
                            ) : (
                              <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                                <span className="text-[#4178D4] text-7xl font-bold">
                                  {userData.nombre.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>

                          {isEditing && (
                            <label
                              htmlFor="profile-image"
                              className="absolute bottom-2 right-2 w-14 h-14 bg-[#4178D4] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#34509F] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110"
                            >
                              <Camera className="w-6 h-6 text-white" />
                              <input
                                type="file"
                                id="profile-image"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-[#34509F] mb-2">
                        {userData.nombre}
                      </h3>
                      <p className="text-gray-600 mb-1">@{userData.usuario}</p>
                      <p className="text-[#4178D4] font-medium">
                        {userData.cargo}
                      </p>

                      {isEditing && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                          <p className="text-sm text-[#34509F] font-medium">
                            💡 Consejo: Usa una foto clara y profesional para
                            mejorar tu perfil
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Fields Section */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold text-[#34509F] mb-2">
                        Información Personal
                      </h2>
                      <p className="text-gray-600">
                        Mantén tu información actualizada para una mejor
                        experiencia
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {fieldConfig.map(
                        ({ key, label, icon: Icon, type, placeholder }) => (
                          <div key={key} className="group">
                            <label className="text-[#34509F] font-semibold mb-3 flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {label}
                            </label>

                            {isEditing ? (
                              <div className="relative">
                                <input
                                  type={type}
                                  name={key}
                                  value={userData[key as keyof typeof userData]}
                                  onChange={handleInputChange}
                                  placeholder={placeholder}
                                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#4178D4]/20 focus:border-[#4178D4] transition-all duration-300 bg-white hover:border-gray-300 text-gray-900 placeholder-gray-400"
                                />
                                <div className="absolute inset-0 rounded-xl ring-2 ring-transparent group-hover:ring-[#4178D4]/10 transition-all duration-300 pointer-events-none"></div>
                              </div>
                            ) : (
                              <div className="bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 group-hover:bg-gray-100 transition-colors duration-200">
                                <p className="font-medium text-gray-900 flex items-center gap-2">
                                  <Icon className="w-4 h-4 text-gray-500" />
                                  {userData[key as keyof typeof userData] ||
                                    "No específicado"}
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>

                    {isEditing && (
                      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-[#4178D4] rounded-full mt-2 flex-shrink-0"></div>
                          <div>
                            <h4 className="font-semibold text-[#34509F] mb-2">
                              Importante
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              Asegúrate de que toda la información sea correcta
                              antes de guardar. Los cambios se aplicarán
                              inmediatamente a tu perfil.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
