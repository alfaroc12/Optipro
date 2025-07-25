import { useState, useEffect } from "react";
import {
  Calendar,
  ChevronRight,
  ChevronLeft,
  Upload,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  visitaTecnicaService,
  type VisitaTecnicaFormData,
} from "@/services/VisitaTecnicaService";
import { toast } from "react-toastify";
import { colombiaData } from "@/utils/colombiaData";

interface VisitaTecnicaFormProps {
  onSubmit?: (data: VisitaTecnicaFormData) => void;
  onCancel: () => void;
}

const AdminVisitaTecnicaForm: React.FC<VisitaTecnicaFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  // Estado para controlar el paso actual del formulario
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado para el formulario con todos los campos
  const [formData, setFormData] = useState<VisitaTecnicaFormData>({
    // Paso 1: Información del cliente
    nombre: "",
    apellidos: "",
    departamento: "",
    ciudad: "",
    telefono: "",
    nitcc: "",
    nombreEmpresa: "",
    direccion: "",
    fechaVisita: "",
    horaInicio: "",
    horaFin: "",

    // Paso 2: Aspectos evaluados (primeros 4)
    tipoMedida: "",
    comentariosTipoMedida: "",
    sistemaPuestaTierra: "",
    comentariosSistemaPuestaTierra: "",
    disponibilidadSitio: "",
    comentariosDisponibilidadSitio: "",
    condicionesAcceso: "",
    comentariosCondicionesAcceso: "",

    // Paso 3: Aspectos adicionales y concepto
    verificacionAerea: "",
    comentariosVerificacionAerea: "",
    copiaFactura: "",
    comentariosCopiaFactura: "",
    conceptoVisitante: "",
    observacionesAdicionales: "",
    evidenciaFotografica: null,
    nic: "",
  });

  // Estados para el select dependiente de departamento y ciudad
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  // useEffect para manejar el cambio de departamento y actualizar las ciudades disponibles
  useEffect(() => {
    if (selectedDepartment) {
      const department = colombiaData.find(
        (dep) => dep.name === selectedDepartment
      );
      if (department) {
        setAvailableCities(department.cities.map((city) => city.name));
        // Limpiar la ciudad seleccionada cuando cambia el departamento
        setFormData((prev) => ({ ...prev, ciudad: "" }));
      }
    } else {
      setAvailableCities([]);
      setFormData((prev) => ({ ...prev, ciudad: "" }));
    }
  }, [selectedDepartment]);

  // Función para manejar cambios en los inputs de texto
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    // Eliminamos e.preventDefault() para permitir el comportamiento normal de los radio buttons
    const { name, value } = e.target;

    // Manejar cambio específico en el departamento
    if (name === "departamento") {
      setSelectedDepartment(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Función específica para manejar clics en botones de tipo radio
  const handleRadioClick = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Función para manejar subida de archivos (evidencia fotográfica)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData((prev) => ({
        ...prev,
        evidenciaFotografica: file.name,
        evidenciaFile: file,
      }));
    }
  };

  // Componente auxiliar para botones de radio mejorados
  const EnhancedRadioButton = ({
    id,
    name,
    value,
    checked,
    label,
  }: {
    id: string;
    name: string;
    value: string;
    checked: boolean;
    label: string;
  }) => {
    return (
      <div className="flex items-center">
        <input
          type="radio"
          id={id}
          name={name}
          value={value}
          checked={checked}
          onChange={handleChange}
          onClick={() => handleRadioClick(name, value)}
          className="appearance-none w-4 h-4 rounded-full border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
        />
        <label
          htmlFor={id}
          className="ml-2 font-medium"
          onClick={() => handleRadioClick(name, value)}
        >
          {label}
        </label>
      </div>
    );
  };

  // Función para avanzar al siguiente paso
  const handleNextStep = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (currentStep < 3) {
      setCurrentStep((prevStep) => prevStep + 1);
      // Scroll al inicio cuando cambia de paso
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Función para retroceder al paso anterior
  const handlePrevStep = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (currentStep > 1) {
      setCurrentStep((prevStep) => prevStep - 1);
      // Scroll al inicio cuando cambia de paso
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      // Crear la visita técnica usando el servicio
      await visitaTecnicaService.create(formData);

      toast.success("¡Visita técnica creada exitosamente!");

      // Si hay una función onSubmit personalizada, la llamamos
      if (onSubmit) {
        onSubmit(formData);
      }

      // Cerrar el modal
      onCancel();
    } catch (error: any) {
      console.error("Error creating technical visit:", error);

      // Mostrar mensaje de error específico si viene del backend
      if (error.response?.data?.messages) {
        const messages = error.response.data.messages;
        let errorMessage = "Error al crear la visita técnica:";

        // Iterar sobre los errores de cada campo
        Object.entries(messages).forEach(([field, errors]) => {
          if (Array.isArray(errors)) {
            // Mapear los nombres de campo a nombres más legibles
            let fieldName = field;
            switch (field) {
              case "code":
                fieldName = "Código";
                break;
              case "name":
                fieldName = "Nombre";
                break;
              case "last_name":
                fieldName = "Apellidos";
                break;
              case "city":
                fieldName = "Ciudad";
                break;
              case "department":
                fieldName = "Departamento";
                break;
              case "phone":
                fieldName = "Teléfono";
                break;
              case "N_identification":
                fieldName = "NIT/CC";
                break;
              case "company":
                fieldName = "Empresa";
                break;
              case "addres":
                fieldName = "Dirección";
                break;
              case "start_time":
                fieldName = "Fecha de inicio";
                break;
              case "end_time":
                fieldName = "Fecha de finalización";
                break;
              case "concept_visit":
                fieldName = "Concepto de visita";
                break;
              case "description_more":
                fieldName = "Observaciones";
                break;
            }
            errorMessage += `\n- ${fieldName}: ${errors.join(", ")}`;
          }
        });

        toast.error(errorMessage, {
          autoClose: 8000, // Mostrar por 8 segundos
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else if (error.message) {
        toast.error(error.message);
      } else {
        toast.error(
          "Error al crear la visita técnica. Por favor, intente nuevamente."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prevenir envío del formulario al presionar Enter en inputs
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Renderizar el indicador de pasos
  const renderStepIndicator = () => {
    const steps = [
      { name: "Información del cliente", number: 1 },
      { name: "Aspectos técnicos", number: 2 },
      { name: "Conclusión", number: 3 },
    ];

    return (
      <div className="px-6 pt-4 pb-2">
        <div className="relative flex justify-between mb-6 z-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex flex-col items-center relative z-10"
            >
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 
                ${
                  currentStep >= step.number
                    ? "bg-[#4178D4] border-[#4178D4] text-white"
                    : "bg-white border-gray-300 text-gray-500"
                }`}
              >
                {currentStep > step.number ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-bold">{step.number}</span>
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  currentStep >= step.number
                    ? "text-[#4178D4]"
                    : "text-gray-500"
                }`}
              >
                {step.name}
              </span>
            </div>
          ))}

          {/* Líneas conectoras */}
          <div className="absolute top-5 left-0 right-0 flex">
            <div
              className={`h-0.5 flex-1 ${
                currentStep > 1 ? "bg-[#4178D4]" : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`h-0.5 flex-1 ${
                currentStep > 2 ? "bg-[#4178D4]" : "bg-gray-300"
              }`}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar el paso actual del formulario
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="mb-6">
            <div className="mb-6 pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-[#4178D4] text-white rounded-full text-xs mr-2">
                  1
                </span>
                INFORMACIÓN DEL CLIENTE
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Complete la información básica del cliente para la visita
                técnica
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              {/* Nombre y Apellidos */}
              <div className="transition-all duration-300 hover:shadow-md rounded-lg p-0.5">
                <label
                  htmlFor="nombre"
                  className="block mb-1.5 font-medium text-gray-700"
                >
                  {"Nombre(s)"}<span className="text-red-500">*</span>
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ingrese su nombre"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all duration-300"
                />
              </div>
              <div className="transition-all duration-300 hover:shadow-md rounded-lg p-0.5">
                <label
                  htmlFor="apellidos"
                  className="block mb-1.5 font-medium text-gray-700"
                >
                  Apellidos<span className="text-red-500">*</span>
                </label>
                <input
                  id="apellidos"
                  name="apellidos"
                  type="text"
                  required
                  value={formData.apellidos}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Ingrese sus apellidos"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all duration-300"
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h4 className="font-semibold text-[#34509F] mb-3">
                Ubicación y contacto
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Departamento, Ciudad, Teléfono, NIT/CC */}
                <div>
                  <label
                    htmlFor="departamento"
                    className="block mb-1.5 font-medium text-gray-700 text-sm"
                  >
                    Departamento<span className="text-red-500">*</span>
                  </label>
                  <select
                    id="departamento"
                    name="departamento"
                    required
                    value={formData.departamento}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all"
                  >
                    <option value="">Seleccionar departamento</option>
                    {colombiaData.map((department) => (
                      <option key={department.id} value={department.name}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="ciudad"
                    className="block mb-1.5 font-medium text-gray-700 text-sm"
                  >
                    Ciudad<span className="text-red-500">*</span>
                  </label>
                  <select
                    id="ciudad"
                    name="ciudad"
                    required
                    value={formData.ciudad}
                    onChange={handleChange}
                    disabled={!selectedDepartment}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {selectedDepartment
                        ? "Seleccionar ciudad"
                        : "Primero selecciona un departamento"}
                    </option>
                    {availableCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="telefono"
                    className="block mb-1.5 font-medium text-gray-700 text-sm"
                  >
                    Teléfono<span className="text-red-500">*</span>
                  </label>
                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    required
                    value={formData.telefono}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="000-000-0000"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label
                    htmlFor="nitcc"
                    className="block mb-1.5 font-medium text-gray-700 text-sm"
                  >
                    NIT o CC<span className="text-red-500">*</span>
                  </label>
                  <input
                    id="nitcc"
                    name="nitcc"
                    type="text"
                    required
                    value={formData.nitcc}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Número de identificación"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              {/* Nombre empresa y Dirección */}
              <div>
                <label
                  htmlFor="nombreEmpresa"
                  className="block mb-1.5 font-medium text-gray-700"
                >
                  Nombre empresa
                </label>
                <input
                  id="nombreEmpresa"
                  name="nombreEmpresa"
                  type="text"
                  value={formData.nombreEmpresa}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Nombre de la empresa (opcional)"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label
                  htmlFor="direccion"
                  className="block mb-1.5 font-medium text-gray-700"
                >
                  Dirección<span className="text-red-500">*</span>
                </label>
                <input
                  id="direccion"
                  name="direccion"
                  type="text"
                  required
                  value={formData.direccion}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Dirección completa"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 mb-6">
              <h4 className="font-semibold text-gray-800 mb-3">
                Fecha y hora de la visita
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Fecha y horas */}
                <div>
                  <label
                    htmlFor="fechaVisita"
                    className="block mb-1.5 font-medium text-gray-700"
                  >
                    Fecha de visita<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="fechaVisita"
                      name="fechaVisita"
                      type="date"
                      required
                      value={formData.fechaVisita}
                      onChange={handleChange}
                      onKeyDown={handleKeyDown}
                      className="w-full p-3 pl-10 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all"
                    />
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="horaInicio"
                    className="block mb-1.5 font-medium text-gray-700"
                  >
                    Hora de inicio<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="horaInicio"
                      name="horaInicio"
                      type="time"
                      required
                      value={formData.horaInicio}
                      onChange={handleChange}
                      onKeyDown={handleKeyDown}
                      className="w-full p-3 pl-10 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all"
                    />
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="horaFin"
                    className="block mb-1.5 font-medium text-gray-700"
                  >
                    Hora de fin<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="horaFin"
                      name="horaFin"
                      type="time"
                      required
                      value={formData.horaFin}
                      onChange={handleChange}
                      onKeyDown={handleKeyDown}
                      className="w-full p-3 pl-10 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all"
                    />
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                  </div>
                </div>
                </div>
              </div>
            </div>
        );
      case 2:
        return (
          <div className="mb-6">
            <div className="mb-6 pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-[#4178D4] text-white rounded-full text-xs mr-2">
                  2
                </span>
                ASPECTOS EVALUADOS
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Evalúe las condiciones técnicas en el sitio de instalación
              </p>
            </div>

            {/* Aspecto 1 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5 hover:shadow-md transition-all">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="font-medium text-gray-800 flex items-center">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-[#4178D4] text-white rounded-full text-xs mr-2">
                      1
                    </span>
                    Tipo de medida
                  </p>
                  <p className="text-sm text-gray-500">
                    Seleccione el tipo de medida que corresponda
                  </p>
                  <div className="flex items-center space-x-6 mt-3">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="bifasica"
                        name="tipoMedida"
                        value="Bifásica"
                        checked={formData.tipoMedida === "Bifásica"}
                        onChange={handleChange}
                        className="appearance-none w-4 h-4 rounded-full border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
                      />
                      <label htmlFor="bifasica" className="ml-2 font-medium">
                        Bifásica
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="trifasica"
                        name="tipoMedida"
                        value="Trifásica"
                        checked={formData.tipoMedida === "Trifásica"}
                        onChange={handleChange}
                        className="appearance-none w-4 h-4 rounded-full border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
                      />
                      <label htmlFor="trifasica" className="ml-2 font-medium">
                        Trifásica
                      </label>
                    </div>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="comentariosTipoMedida"
                    className="block mb-1.5 font-medium text-gray-700"
                  >
                    Comentarios
                  </label>
                  <textarea
                    id="comentariosTipoMedida"
                    name="comentariosTipoMedida"
                    value={formData.comentariosTipoMedida}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ingrese comentarios adicionales"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all min-h-[90px] resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Aspecto 2 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5 hover:shadow-md transition-all">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="font-medium text-gray-800 flex items-center">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-[#4178D4] text-white rounded-full text-xs mr-2">
                      2
                    </span>
                    Sistema puesta a tierra
                  </p>
                  <p className="text-sm text-gray-500">
                    Evalúe el estado del sistema de puesta a tierra
                  </p>
                  <div className="flex items-center space-x-6 mt-3">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="tieneSistema"
                        name="sistemaPuestaTierra"
                        value="Sí tiene"
                        checked={formData.sistemaPuestaTierra === "Sí tiene"}
                        onChange={handleChange}
                        className="appearance-none w-4 h-4 rounded-full border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
                      />
                      <label
                        htmlFor="tieneSistema"
                        className="ml-2 font-medium"
                      >
                        Sí tiene
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="noTieneSistema"
                        name="sistemaPuestaTierra"
                        value="No tiene"
                        checked={formData.sistemaPuestaTierra === "No tiene"}
                        onChange={handleChange}
                        className="appearance-none w-4 h-4 rounded-full border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
                      />
                      <label
                        htmlFor="noTieneSistema"
                        className="ml-2 font-medium"
                      >
                        No tiene
                      </label>
                    </div>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="comentariosSistemaPuestaTierra"
                    className="block mb-1.5 font-medium text-gray-700"
                  >
                    Comentarios
                  </label>
                  <textarea
                    id="comentariosSistemaPuestaTierra"
                    name="comentariosSistemaPuestaTierra"
                    value={formData.comentariosSistemaPuestaTierra}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Detalles sobre el estado del sistema"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all min-h-[90px] resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Aspecto 3 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5 hover:shadow-md transition-all">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="font-medium text-gray-800 flex items-center">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-[#4178D4] text-white rounded-full text-xs mr-2">
                      3
                    </span>
                    Area de trabajo
                  </p>
                  <p className="text-sm text-gray-500">
                    Evalúe las condiciones de montaje e instalación
                  </p>
                  <div className="flex items-center space-x-6 mt-3">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="buenasCondiciones"
                        name="disponibilidadSitio"
                        value="Buenas condiciones"
                        checked={
                          formData.disponibilidadSitio === "Buenas condiciones"
                        }
                        onChange={handleChange}
                        className="appearance-none w-4 h-4 rounded-full border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
                      />
                      <label
                        htmlFor="buenasCondiciones"
                        className="ml-2 font-medium"
                      >
                        Buenas condiciones
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="requiereAdecuacion"
                        name="disponibilidadSitio"
                        value="Requiere adecuación"
                        checked={
                          formData.disponibilidadSitio === "Requiere adecuación"
                        }
                        onChange={handleChange}
                        className="appearance-none w-4 h-4 rounded-full border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
                      />
                      <label
                        htmlFor="requiereAdecuacion"
                        className="ml-2 font-medium"
                      >
                        Requiere adecuación
                      </label>
                    </div>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="comentariosDisponibilidadSitio"
                    className="block mb-1.5 font-medium text-gray-700"
                  >
                    Comentarios
                  </label>
                  <textarea
                    id="comentariosDisponibilidadSitio"
                    name="comentariosDisponibilidadSitio"
                    value={formData.comentariosDisponibilidadSitio}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Describa las condiciones del sitio"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all min-h-[90px] resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Aspecto 4 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5 hover:shadow-md transition-all">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="font-medium text-gray-800 flex items-center">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-[#4178D4] text-white rounded-full text-xs mr-2">
                      4
                    </span>
                    Condicion de acceso area de trabajo
                  </p>
                  <p className="text-sm text-gray-500">
                    Evalúe el acceso al sitio de montaje
                  </p>
                  <div className="flex items-center space-x-6 mt-3">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="accesoFacil"
                        name="condicionesAcceso"
                        value="Fácil acceso"
                        checked={formData.condicionesAcceso === "Fácil acceso"}
                        onChange={handleChange}
                        className="appearance-none w-4 h-4 rounded-full border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
                      />
                      <label htmlFor="accesoFacil" className="ml-2 font-medium">
                        Fácil acceso
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="accesoDificil"
                        name="condicionesAcceso"
                        value="Difícil acceso"
                        checked={
                          formData.condicionesAcceso === "Difícil acceso"
                        }
                        onChange={handleChange}
                        className="appearance-none w-4 h-4 rounded-full border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
                      />
                      <label
                        htmlFor="accesoDificil"
                        className="ml-2 font-medium"
                      >
                        Difícil acceso
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label
                  htmlFor="comentariosCondicionesAcceso"
                  className="block mb-1.5 font-medium text-gray-700"
                >
                  Comentarios
                </label>
                <textarea
                  id="comentariosCondicionesAcceso"
                  name="comentariosCondicionesAcceso"
                  value={formData.comentariosCondicionesAcceso}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Describa las condiciones de acceso"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all min-h-[90px] resize-none"
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="mb-6">
            <div className="mb-6 pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-[#4178D4] text-white rounded-full text-xs mr-2">
                  3
                </span>
                ASPECTOS ADICIONALES Y CONCEPTO
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Complete la evaluación final y agregue evidencias documentales
              </p>
            </div>

            {/* Aspecto 5 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5 hover:shadow-md transition-all">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="font-medium text-gray-800 flex items-center">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-[#4178D4] text-white rounded-full text-xs mr-2">
                      5
                    </span>
                    Area de cuarto electrico
                  </p>
                  <p className="text-sm text-gray-500">
                    Estado del cuarto eléctrico
                  </p>{" "}
                  <div className="flex items-center space-x-6 mt-3">
                    <EnhancedRadioButton
                      id="verificacionRealizada"
                      name="verificacionAerea"
                      value="Realizada"
                      checked={formData.verificacionAerea === "Realizada"}
                      label="Realizada"
                    />
                    <EnhancedRadioButton
                      id="verificacionPendiente"
                      name="verificacionAerea"
                      value="Pendiente"
                      checked={formData.verificacionAerea === "Pendiente"}
                      label="Pendiente"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="comentariosVerificacionAerea"
                    className="block mb-1.5 font-medium text-gray-700"
                  >
                    Comentarios
                  </label>
                  <textarea
                    id="comentariosVerificacionAerea"
                    name="comentariosVerificacionAerea"
                    value={formData.comentariosVerificacionAerea}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Detalles sobre la verificación aérea"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all min-h-[90px] resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Aspecto 6 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5 hover:shadow-md transition-all">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="font-medium text-gray-800 flex items-center">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-[#4178D4] text-white rounded-full text-xs mr-2">
                      6
                    </span>
                    Factura de energía eléctrica
                  </p>
                  <p className="text-sm text-gray-500">
                    Estado de la copia de factura del servicio
                  </p>
                  <div className="flex items-center space-x-6 mt-3">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="facturaRecibida"
                        name="copiaFactura"
                        value="Recibida"
                        checked={formData.copiaFactura === "Recibida"}
                        onChange={handleChange}
                        className="appearance-none w-4 h-4 rounded-full border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
                      />
                      <label
                        htmlFor="facturaRecibida"
                        className="ml-2 font-medium"
                      >
                        Recibida
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="facturaPendiente"
                        name="copiaFactura"
                        value="Pendiente"
                        checked={formData.copiaFactura === "Pendiente"}
                        onChange={handleChange}
                        className="appearance-none w-4 h-4 rounded-full border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
                      />
                      <label
                        htmlFor="facturaPendiente"
                        className="ml-2 font-medium"
                      >
                        Pendiente
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="facturaNoTiene"
                        name="copiaFactura"
                        value="No tiene"
                        checked={formData.copiaFactura === "No tiene"}
                        onChange={handleChange}
                        className="appearance-none w-4 h-4 rounded-full border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
                      />
                      <label
                        htmlFor="facturaNoTiene"
                        className="ml-2 font-medium"
                      >
                        No tiene
                      </label>
                    </div>
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="comentariosCopiaFactura"
                    className="block mb-1.5 font-medium text-gray-700"
                  >
                    Comentarios
                  </label>
                  <textarea
                    id="comentariosCopiaFactura"
                    name="comentariosCopiaFactura"
                    value={formData.comentariosCopiaFactura}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Información adicional sobre la factura"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all min-h-[90px] resize-none"
                  />
                </div>
              </div>
            </div>

            {/* NIC */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5 hover:shadow-md transition-all">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="font-medium text-gray-800 flex items-center">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-[#4178D4] text-white rounded-full text-xs mr-2">
                      7
                    </span>
                    NIC (Número de Identificación de Contrato)
                  </p>
                  <p className="text-sm text-gray-500">
                    Ingrese el NIC que aparece en la factura de energía
                    eléctrica
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="nic"
                    className="block mb-1.5 font-medium text-gray-700"
                  >
                    NIC
                  </label>
                  <input
                    id="nic"
                    name="nic"
                    type="text"
                    value={formData.nic}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ingrese el NIC (opcional)"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Concepto del visitante */}
            <div className="bg-blue-50 rounded-xl p-5 mb-5">
              <h4 className="font-semibold text-[#34509F] mb-3">
                CONCEPTO DEL VISITANTE
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="conceptoVisitante"
                    className="block mb-1.5 font-medium text-gray-700"
                  >
                    Concepto<span className="text-red-500">*</span>
                  </label>
                  <select
                    id="conceptoVisitante"
                    name="conceptoVisitante"
                    value={formData.conceptoVisitante}
                    onChange={handleChange}
                    className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all"
                    required
                  >
                    <option value="">Seleccione un concepto</option>
                    <option value="Procede">Procede</option>
                    <option value="No procede">No procede</option>
                    <option value="Procede con condiciones">
                      Procede con condiciones
                    </option>
                  </select>
                </div>
                <div className="flex items-end justify-end">
                  <div className="bg-gray-100 px-4 py-2 rounded-lg">
                    <p className="font-medium text-gray-700">
                      ID Visita Tecnica{" "}
                      <span className="text-[#4178D4]">VT1982</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Observaciones adicionales */}
            <div className="mb-6">
              <label
                htmlFor="observacionesAdicionales"
                className="block mb-1.5 font-medium text-gray-700"
              >
                Observaciones adicionales
              </label>
              <textarea
                id="observacionesAdicionales"
                name="observacionesAdicionales"
                value={formData.observacionesAdicionales}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Agregue cualquier observación relevante sobre la visita técnica"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all min-h-[120px] resize-none"
              />
            </div>

            {/* Evidencia fotográfica */}
            <div className="bg-gray-50 rounded-xl p-5 mb-5">
              <label
                htmlFor="evidenciaFotografica"
                className="block mb-3 font-medium text-gray-700"
              >
                Evidencia fotográfica
              </label>
              <div className="flex flex-col sm:flex-row items-start gap-3">
                <input
                  type="file"
                  id="evidenciaFotografica"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="evidenciaFotografica"
                  className="flex items-center gap-2 px-4 py-2.5 border border-[#4178D4] rounded-lg bg-white text-[#4178D4] hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <span>Subir imagen</span>
                </label>
                {formData.evidenciaFotografica ? (
                  <div className="flex-1 bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                    <span className="text-sm text-gray-600 truncate">
                      {formData.evidenciaFotografica}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          evidenciaFotografica: null,
                        }))
                      }
                      className="text-gray-400 hover:text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 bg-white p-3 rounded-lg border border-dashed border-gray-300 text-sm text-gray-400 text-center">
                    No se ha seleccionado ninguna imagen
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Formatos permitidos: JPG, PNG, GIF. Tamaño máximo: 5MB
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100">
      {/* Header del form */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white z-9 rounded-t-xl">
        <h2 className="text-xl md:text-2xl font-bold text-[#34509F]">
          VISITA TÉCNICA
        </h2>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          aria-label="Cerrar"
          type="button"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="#64748b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Indicador de pasos */}
      {renderStepIndicator()}

      <form onSubmit={handleSubmit} className="p-6">
        {/* Renderizar el paso actual */}
        {renderStep()}

        {/* Botones de navegación */}
        <div className="flex justify-between mt-8 border-t pt-6 border-gray-100">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="flex items-center justify-center gap-2 px-6 py-2.5 border-2 border-[#4178D4] bg-white text-[#4178D4] font-medium rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
              Anterior
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center justify-center gap-2 px-6 py-2.5 border-2 border-gray-300 bg-white text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          )}
          <div>
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center justify-center gap-2 px-8 py-2.5 bg-[#4178D4] text-white font-medium rounded-lg hover:bg-[#34509F] transition-colors cursor-pointer"
              >
                Siguiente
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center justify-center gap-2 px-8 py-2.5 font-medium rounded-lg transition cursor-pointer ${
                  isSubmitting
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-[#4178D4] text-white hover:bg-[#34509F] hover:shadow-lg"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 animate-spin rounded-full border-2 border-gray-300 border-t-white"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Guardar visita técnica
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminVisitaTecnicaForm;
