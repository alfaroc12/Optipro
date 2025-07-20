import React, { useState } from "react";
import {
  X,
  User,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  IdCard,
  Users,
  ChevronDown,
  Info,
} from "lucide-react";

interface FormularioNuevoUsuarioProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
  readOnly?: boolean; // Nuevo prop para modo de solo lectura
  title?: string; // Prop opcional para personalizar el título
}

interface FormData {
  nombre: string;
  usuario: string;
  contrasena: string;
  ciudad: string;
  correoElectronico: string;
  telefono: string;
  cargo: string;
  cedula: string;
  proyecto: string;
  categoriaUsuario: string;
}

const FormularioNuevoUsuario: React.FC<FormularioNuevoUsuarioProps> = ({
  onSubmit,
  onCancel,
  initialData,
  readOnly = false, // Por defecto, el formulario es editable
  title = "AGREGAR USUARIO", // Título por defecto
}) => {
  const [formData, setFormData] = useState<FormData>({
    nombre: initialData?.nombre || "",
    usuario: initialData?.usuario || "",
    contrasena: initialData ? "" : "", // No mostramos la contraseña en edición
    ciudad: initialData?.ciudad || "",
    correoElectronico: initialData?.email || "",
    telefono: initialData?.telefono || "",
    cargo: initialData?.cargo || "",
    cedula: initialData?.cedula || "",
    proyecto: initialData?.proyecto || "",
    categoriaUsuario: initialData?.tipoUsuario || "",
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  // Opciones para los selectores
  const categoriasUsuario = [
    { value: "administrador", label: "Administrador" },
    { value: "supervisor", label: "Supervisor" },
    { value: "ingeniero", label: "Ingeniero" },
  ];

  const proyectos = [
    { value: "proyecto1", label: "Proyecto Solar Residencial" },
    { value: "proyecto2", label: "Proyecto Solar Comercial" },
    { value: "proyecto3", label: "Proyecto Solar Industrial" },
    { value: "proyecto4", label: "Proyecto Eólico" },
  ];

  const ciudades = [
    { value: "bogota", label: "Bogotá" },
    { value: "medellin", label: "Medellín" },
    { value: "cali", label: "Cali" },
    { value: "santa-marta", label: "Santa Marta" },
    { value: "cartagena", label: "Cartagena" },
    { value: "barranquilla", label: "Barranquilla" },
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es requerido";
    if (!formData.usuario.trim()) newErrors.usuario = "El usuario es requerido"; // Solo validamos contraseña para usuarios nuevos (sin initialData) o si se ha ingresado algún valor
    if (!initialData && !formData.contrasena.trim())
      newErrors.contrasena = "La contraseña es requerida";
    if (formData.contrasena.trim() && formData.contrasena.length < 6)
      newErrors.contrasena = "La contraseña debe tener al menos 6 caracteres";
    if (!formData.ciudad) newErrors.ciudad = "La ciudad es requerida";
    if (!formData.correoElectronico.trim())
      newErrors.correoElectronico = "El correo electrónico es requerido";
    if (!formData.telefono.trim())
      newErrors.telefono = "El teléfono es requerido";
    if (!formData.cargo.trim()) newErrors.cargo = "El cargo es requerido";
    if (!formData.cedula.trim()) newErrors.cedula = "La cédula es requerida";
    if (!formData.categoriaUsuario)
      newErrors.categoriaUsuario = "La categoría de usuario es requerida";

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (
      formData.correoElectronico &&
      !emailRegex.test(formData.correoElectronico)
    ) {
      newErrors.correoElectronico = "Ingrese un correo electrónico válido";
    }

    // Validación de teléfono (formato colombiano)
    const phoneRegex = /^[0-9]{10}$/;
    if (
      formData.telefono &&
      !phoneRegex.test(formData.telefono.replace(/\D/g, ""))
    ) {
      newErrors.telefono = "Ingrese un teléfono válido (10 dígitos)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) {
      // En modo solo lectura, simplemente cerramos
      onCancel();
      return;
    }

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      {/* Header */}{" "}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#4178D4] rounded-lg flex items-center justify-center">
            {readOnly ? (
              <Info className="w-5 h-5 text-white" />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#34509F]">{title}</h2>
            <p className="text-gray-500 text-sm">
              {readOnly
                ? "Detalles completos del usuario"
                : "Complete los datos del nuevo usuario"}
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Primera fila: Nombre, Usuario, Contraseña */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4 text-[#4178D4]" />
              Nombre
            </label>{" "}
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              readOnly={readOnly}
              disabled={readOnly}
              className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#4178D4] focus:border-[#4178D4] transition-colors ${
                errors.nombre
                  ? "border-red-500"
                  : readOnly
                  ? "border-gray-200 bg-gray-50"
                  : "border-gray-300"
              }`}
              placeholder="Ingrese el nombre completo"
            />
            {errors.nombre && (
              <p className="text-red-500 text-xs">{errors.nombre}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#4178D4]" />
              Usuario
            </label>{" "}
            <input
              type="text"
              name="usuario"
              value={formData.usuario}
              onChange={handleInputChange}
              readOnly={readOnly}
              disabled={readOnly}
              className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#4178D4] focus:border-[#4178D4] transition-colors ${
                errors.usuario
                  ? "border-red-500"
                  : readOnly
                  ? "border-gray-200 bg-gray-50"
                  : "border-gray-300"
              }`}
              placeholder="Nombre de usuario"
            />
            {errors.usuario && (
              <p className="text-red-500 text-xs">{errors.usuario}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <IdCard className="w-4 h-4 text-[#4178D4]" />
              Contraseña
            </label>{" "}
            {readOnly ? (
              // En modo lectura, no mostramos el campo de contraseña
              <div className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-gray-500">
                ••••••••••
              </div>
            ) : (
              <input
                type="password"
                name="contrasena"
                value={formData.contrasena}
                onChange={handleInputChange}
                className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#4178D4] focus:border-[#4178D4] transition-colors ${
                  errors.contrasena ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Contraseña segura"
              />
            )}
            {errors.contrasena && (
              <p className="text-red-500 text-xs">{errors.contrasena}</p>
            )}
          </div>
        </div>
        {/* Segunda fila: Ciudad, Correo electrónico, Teléfono */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#4178D4]" />
              Ciudad
            </label>
            <div className="relative">
              {" "}
              {readOnly ? (
                <div
                  className={`w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-gray-700`}
                >
                  {ciudades.find((c) => c.value === formData.ciudad)?.label ||
                    formData.ciudad ||
                    "No especificada"}
                </div>
              ) : (
                <select
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleInputChange}
                  disabled={readOnly}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#4178D4] focus:border-[#4178D4] transition-colors appearance-none bg-white ${
                    errors.ciudad
                      ? "border-red-500"
                      : readOnly
                      ? "border-gray-200 bg-gray-50"
                      : "border-gray-300"
                  }`}
                >
                  <option value="">Seleccionar ciudad</option>
                  {ciudades.map((ciudad) => (
                    <option key={ciudad.value} value={ciudad.value}>
                      {ciudad.label}
                    </option>
                  ))}
                </select>
              )}
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
            {errors.ciudad && (
              <p className="text-red-500 text-xs">{errors.ciudad}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#4178D4]" />
              Correo electrónico
            </label>{" "}
            <input
              type="email"
              name="correoElectronico"
              value={formData.correoElectronico}
              onChange={handleInputChange}
              readOnly={readOnly}
              disabled={readOnly}
              className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#4178D4] focus:border-[#4178D4] transition-colors ${
                errors.correoElectronico
                  ? "border-red-500"
                  : readOnly
                  ? "border-gray-200 bg-gray-50"
                  : "border-gray-300"
              }`}
              placeholder="ejemplo@correo.com"
            />
            {errors.correoElectronico && (
              <p className="text-red-500 text-xs">{errors.correoElectronico}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#4178D4]" />
              Teléfono
            </label>{" "}
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              readOnly={readOnly}
              disabled={readOnly}
              className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#4178D4] focus:border-[#4178D4] transition-colors ${
                errors.telefono
                  ? "border-red-500"
                  : readOnly
                  ? "border-gray-200 bg-gray-50"
                  : "border-gray-300"
              }`}
              placeholder="3001234567"
            />
            {errors.telefono && (
              <p className="text-red-500 text-xs">{errors.telefono}</p>
            )}
          </div>
        </div>
        {/* Tercera fila: Cargo, Cédula */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#4178D4]" />
              Cargo
            </label>{" "}
            <input
              type="text"
              name="cargo"
              value={formData.cargo}
              onChange={handleInputChange}
              readOnly={readOnly}
              disabled={readOnly}
              className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#4178D4] focus:border-[#4178D4] transition-colors ${
                errors.cargo
                  ? "border-red-500"
                  : readOnly
                  ? "border-gray-200 bg-gray-50"
                  : "border-gray-300"
              }`}
              placeholder="Ej: Ingeniero de software"
            />
            {errors.cargo && (
              <p className="text-red-500 text-xs">{errors.cargo}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <IdCard className="w-4 h-4 text-[#4178D4]" />
              Cédula
            </label>{" "}
            <input
              type="text"
              name="cedula"
              value={formData.cedula}
              onChange={handleInputChange}
              readOnly={readOnly}
              disabled={readOnly}
              className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#4178D4] focus:border-[#4178D4] transition-colors ${
                errors.cedula
                  ? "border-red-500"
                  : readOnly
                  ? "border-gray-200 bg-gray-50"
                  : "border-gray-300"
              }`}
              placeholder="Número de cédula"
            />
            {errors.cedula && (
              <p className="text-red-500 text-xs">{errors.cedula}</p>
            )}
          </div>
        </div>
        {/* Cuarta fila: Proyecto y Categoría de usuario */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Proyecto
            </label>
            <div className="relative">
              {" "}
              {readOnly ? (
                <div className="w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-gray-700">
                  {proyectos.find((p) => p.value === formData.proyecto)
                    ?.label ||
                    formData.proyecto ||
                    "No asignado"}
                </div>
              ) : (
                <select
                  name="proyecto"
                  value={formData.proyecto}
                  onChange={handleInputChange}
                  disabled={readOnly}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4178D4] focus:border-[#4178D4] transition-colors appearance-none bg-white"
                >
                  <option value="">Seleccionar proyecto</option>
                  {proyectos.map((proyecto) => (
                    <option key={proyecto.value} value={proyecto.value}>
                      {proyecto.label}
                    </option>
                  ))}
                </select>
              )}
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Categoría de usuario
            </label>
            <div className="relative">
              {" "}
              {readOnly ? (
                <div
                  className={`w-full px-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-gray-700`}
                >
                  {categoriasUsuario.find(
                    (c) => c.value === formData.categoriaUsuario
                  )?.label ||
                    formData.categoriaUsuario ||
                    "No especificada"}
                </div>
              ) : (
                <select
                  name="categoriaUsuario"
                  value={formData.categoriaUsuario}
                  onChange={handleInputChange}
                  disabled={readOnly}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#4178D4] focus:border-[#4178D4] transition-colors appearance-none bg-white ${
                    errors.categoriaUsuario
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                >
                  <option value="">Seleccionar categoría</option>
                  {categoriasUsuario.map((categoria) => (
                    <option key={categoria.value} value={categoria.value}>
                      {categoria.label}
                    </option>
                  ))}
                </select>
              )}
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
            {errors.categoriaUsuario && (
              <p className="text-red-500 text-xs">{errors.categoriaUsuario}</p>
            )}
          </div>
        </div>{" "}
        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
          {readOnly ? (
            <button
              type="button"
              onClick={onCancel}
              className="w-full px-6 py-3 bg-[#4178D4] text-white rounded-lg font-medium hover:bg-[#34509F] transition-colors shadow-sm"
            >
              Cerrar
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-[#4178D4] text-white rounded-lg font-medium hover:bg-[#34509F] transition-colors shadow-sm"
              >
                Guardar Usuario
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default FormularioNuevoUsuario;
