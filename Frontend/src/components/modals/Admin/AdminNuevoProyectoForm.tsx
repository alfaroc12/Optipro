import { useState } from "react";
import {
  Calendar,
  ChevronRight,
  ChevronLeft,
  Upload,
  CheckCircle,
} from "lucide-react";

// NUEVO INTERFACE AJUSTADO SEGÚN LOS CAMPOS DE LA IMAGEN
interface NuevoProyectoFormData {
  // Paso 1: Información del cliente
  nombre: string;
  apellidos: string;
  departamento: string;
  ciudad: string;
  telefono: string;
  nitcc: string;
  nombreEmpresa: string;
  direccion: string;

  // Paso 2: Información del proyecto
  nombreClienteEmpresa: string;
  proyectoEnvigado: string;
  ciudadProyecto: string;
  fechaVisitaComercial: string;
  tipoProyecto: string;
  codigoOferta: string;
  fechaInicio: string;
  descripcion: string;
  nicccCliente: string;
  representante: string;

  // Paso 3: Detalles técnicos
  tipoSistema: string;
  potenciaRequerida: number | string;
  tipoPotenciaPaneles: string;
  produccionEnergetica: number | string;

  // Equipamiento incluido
  equipamiento: {
    panelesSolares: boolean;
    cableadoGabinete: boolean;
    bateria: boolean;
    kit5kw: boolean;
    kit8kw: boolean;
    kit12kw: boolean;
    kit15kw: boolean;
    kit30kw: boolean;
    microinversores: boolean;
    estructurasMontaje: boolean;
    legalizacionDisenios: boolean;
    transporte: boolean;
    manoObra: boolean;
  };

  hojaCalculo: string;
  hojaCalculoArchivo: File | null;
  valorCotizacion: number | string;
  formaPago: string;
}

interface NuevoProyectoFormProps {
  onSubmit: (data: NuevoProyectoFormData) => void;
  onCancel: () => void;
}

const AdminNuevoProyectoForm: React.FC<NuevoProyectoFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  const [formData, setFormData] = useState<NuevoProyectoFormData>({
    // Cliente
    nombre: "",
    apellidos: "",
    departamento: "",
    ciudad: "",
    telefono: "",
    nitcc: "",
    nombreEmpresa: "",
    direccion: "",
    // Proyecto
    nombreClienteEmpresa: "",
    proyectoEnvigado: "",
    ciudadProyecto: "",
    fechaVisitaComercial: "",
    tipoProyecto: "",
    codigoOferta: "",
    fechaInicio: "",
    descripcion: "",
    nicccCliente: "",
    representante: "",
    // Técnicos
    tipoSistema: "",
    potenciaRequerida: "",
    tipoPotenciaPaneles: "",
    produccionEnergetica: "",
    // Equipamiento
    equipamiento: {
      panelesSolares: false,
      cableadoGabinete: false,
      bateria: false,
      kit5kw: false,
      kit8kw: false,
      kit12kw: false,
      kit15kw: false,
      kit30kw: false,
      microinversores: false,
      estructurasMontaje: false,
      legalizacionDisenios: false,
      transporte: false,
      manoObra: false,
    },
    hojaCalculo: "",
    hojaCalculoArchivo: null,
    valorCotizacion: "",
    formaPago: "",
  });

  // Cambios en campos de texto, número, fecha, etc.
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    // Para campos numéricos, convertimos el valor a número si es necesario
    if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? "" : Number(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Cambios en checkboxes de equipamiento
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      equipamiento: {
        ...prev.equipamiento,
        [name]: checked,
      },
    }));
  };

  // Manejo de archivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const { name } = e.target;

      setFormData((prev) => ({
        ...prev,
        [name + "Archivo"]: file,
        [name]: file.name, // Guardamos el nombre del archivo para mostrarlo
      }));
    }
  };

  // Navegación pasos
  const handleNextStep = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (currentStep < 3) setCurrentStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrevStep = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (currentStep > 1) setCurrentStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Submit
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Prevent Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Indicador de pasos
  const renderStepIndicator = () => {
    const steps = [
      { name: "Información del cliente", number: 1 },
      { name: "Información del proyecto", number: 2 },
      { name: "Detalles técnicos", number: 3 },
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
          {/* Lines */}
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

  // PASO 1: Información del cliente
  const renderStep1 = () => (
    <div className="mb-6">
      <div className="mb-6 pb-4 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <span className="inline-flex items-center justify-center w-6 h-6 bg-[#4178D4] text-white rounded-full text-xs mr-2">
            1
          </span>
          INFORMACIÓN DEL CLIENTE
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div>
          <label className="block mb-1.5 font-medium text-gray-700">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            name="nombre"
            type="text"
            required
            value={formData.nombre}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Ingrese nombre"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
          />
        </div>
        <div>
          <label className="block mb-1.5 font-medium text-gray-700">
            Apellidos <span className="text-red-500">*</span>
          </label>
          <input
            name="apellidos"
            type="text"
            required
            value={formData.apellidos}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Ingrese apellidos"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
        <div>
          <label className="block mb-1.5 font-medium text-gray-700">
            Departamento <span className="text-red-500">*</span>
          </label>
          <input
            name="departamento"
            type="text"
            required
            value={formData.departamento}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Departamento"
            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg"
          />
        </div>
        <div>
          <label className="block mb-1.5 font-medium text-gray-700">
            Ciudad <span className="text-red-500">*</span>
          </label>
          <input
            name="ciudad"
            type="text"
            required
            value={formData.ciudad}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Ciudad"
            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg"
          />
        </div>
        <div>
          <label className="block mb-1.5 font-medium text-gray-700">
            Teléfono <span className="text-red-500">*</span>
          </label>
          <input
            name="telefono"
            type="tel"
            pattern="[0-9]{7,10}"
            required
            value={formData.telefono}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Teléfono"
            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg"
          />
        </div>
        <div>
          <label className="block mb-1.5 font-medium text-gray-700">
            NIT o CC <span className="text-red-500">*</span>
          </label>
          <input
            name="nitcc"
            type="text"
            required
            value={formData.nitcc}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Número identificación"
            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div>
          <label className="block mb-1.5 font-medium text-gray-700">
            Nombre empresa <span className="text-red-500">*</span>
          </label>
          <input
            name="nombreEmpresa"
            type="text"
            required
            value={formData.nombreEmpresa}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Nombre de la empresa"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
          />
        </div>
        <div>
          <label className="block mb-1.5 font-medium text-gray-700">
            Dirección <span className="text-red-500">*</span>
          </label>
          <input
            name="direccion"
            type="text"
            required
            value={formData.direccion}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Dirección completa"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
          />
        </div>
      </div>
    </div>
  );

  // PASO 2: Información del proyecto de grado
  const renderStep2 = () => (
    <div className="mb-6">
      <div className="mb-6 pb-4 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <span className="inline-flex items-center justify-center w-6 h-6 bg-[#4178D4] text-white rounded-full text-xs mr-2">
            2
          </span>
          INFORMACIÓN DEL PROYECTO
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div>
          <label className="block mb-1.5 font-medium text-gray-700">
            Nombre cliente o empresa <span className="text-red-500">*</span>
          </label>
          <input
            name="nombreClienteEmpresa"
            type="text"
            required
            value={formData.nombreClienteEmpresa}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Nombre cliente o empresa"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
          />
        </div>
        <div>
          <label className="block mb-1.5 font-medium text-gray-700">
            Proyecto Envigado <span className="text-red-500">*</span>
          </label>
          <input
            name="proyectoEnvigado"
            type="text"
            required
            value={formData.proyectoEnvigado}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Nombre del proyecto"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-6">
        <div>
          <label className="block mb-1.5 font-medium text-gray-700">
            Ciudad <span className="text-red-500">*</span>
          </label>
          <input
            name="ciudadProyecto"
            type="text"
            required
            value={formData.ciudadProyecto}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Ciudad del proyecto"
            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg"
          />
        </div>
        <div>
          <label className="block mb-1.5 font-medium text-gray-700">
            Fecha visita comercial <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              name="fechaVisitaComercial"
              type="date"
              required
              value={formData.fechaVisitaComercial}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className="w-full p-2.5 pl-10 bg-white border border-gray-200 rounded-lg"
            />
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
          </div>
        </div>
        <div>
          <label className="block mb-1.5 font-medium text-gray-700">
            Tipo de proyecto <span className="text-red-500">*</span>
          </label>
          <select
            name="tipoProyecto"
            required
            value={formData.tipoProyecto}
            onChange={handleChange}
            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg"
          >
            <option value="">Seleccione</option>
            <option value="Público">Público</option>
            <option value="Privado">Privado</option>
          </select>
        </div>
        <div>
          <label className="block mb-1.5 font-medium text-gray-700">
            Código de oferta <span className="text-red-500">*</span>
          </label>
          <input
            name="codigoOferta"
            type="text"
            required
            value={formData.codigoOferta}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Código"
            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div>
          <label className="block mb-1.5 font-medium text-gray-700">
            Fecha de inicio <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              name="fechaInicio"
              type="date"
              required
              value={formData.fechaInicio}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-lg"
            />
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
          </div>
        </div>
        <div>
          <label className="block mb-1.5 font-medium text-gray-700">
            NIC o CC cliente <span className="text-red-500">*</span>
          </label>
          <input
            name="nicccCliente"
            type="text"
            required
            value={formData.nicccCliente}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Identificación del cliente"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div>
          <label className="block mb-1.5 font-medium text-gray-700">
            Representante <span className="text-red-500">*</span>
          </label>
          <input
            name="representante"
            type="text"
            required
            value={formData.representante}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Nombre del representante"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
          />
        </div>
        <div>
          <label className="block mb-1.5 font-medium text-gray-700">
            Descripción <span className="text-red-500">*</span>
          </label>
          <textarea
            name="descripcion"
            required
            value={formData.descripcion}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Breve descripción del proyecto"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  // PASO 3: Detalles técnicos
  const renderStep3 = () => (
    <div className="mb-6">
      <div className="mb-6 pb-4 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 flex items-center">
          <span className="inline-flex items-center justify-center w-6 h-6 bg-[#4178D4] text-white rounded-full text-xs mr-2">
            3
          </span>
          DETALLES TÉCNICOS
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div>
          <label className="block mb-1.5 font-medium text-gray-700">
            Tipo de sistema <span className="text-red-500">*</span>
          </label>
          <select
            name="tipoSistema"
            required
            value={formData.tipoSistema}
            onChange={handleChange}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
          >
            <option value="">Seleccione tipo de sistema</option>
            <option value="On-grid">On-grid</option>
            <option value="Off-grid">Off-grid</option>
            <option value="Híbrido">Híbrido</option>
          </select>
        </div>
        <div>
          <label className="block mb-1.5 font-medium text-gray-700">
            Potencia requerida (kW) <span className="text-red-500">*</span>
          </label>
          <input
            name="potenciaRequerida"
            type="number"
            min="0"
            step="0.01"
            required
            value={formData.potenciaRequerida}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Ej: 5.0"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <div>
          <label className="block mb-1.5 font-medium text-gray-700">
            Tipo y potencia de paneles (W){" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            name="tipoPotenciaPaneles"
            type="text"
            required
            value={formData.tipoPotenciaPaneles}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Ej: Monocristalino 500W"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
          />
        </div>
        <div>
          <label className="block mb-1.5 font-medium text-gray-700">
            Producción energética (kWh) <span className="text-red-500">*</span>
          </label>
          <input
            name="produccionEnergetica"
            type="number"
            min="0"
            step="0.01"
            required
            value={formData.produccionEnergetica}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Ej: 800"
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
          />
        </div>
      </div>
      {/* Equipamiento incluido */}
      <div className="mb-6">
        <h4 className="font-semibold text-[#34509F] mb-3">
          Equipamiento incluido
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="panelesSolares"
                name="panelesSolares"
                checked={formData.equipamiento.panelesSolares}
                onChange={handleCheckboxChange}
                className="mr-2 h-4 w-4 text-[#4178D4] focus:ring-[#4178D4]"
              />
              <label
                htmlFor="panelesSolares"
                className="text-gray-700 font-medium"
              >
                Paneles solares
              </label>
            </div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="cableadoGabinete"
                name="cableadoGabinete"
                checked={formData.equipamiento.cableadoGabinete}
                onChange={handleCheckboxChange}
                className="mr-2 h-4 w-4 text-[#4178D4] focus:ring-[#4178D4]"
              />
              <label
                htmlFor="cableadoGabinete"
                className="text-gray-700 font-medium"
              >
                Cableado y gabinete
              </label>
            </div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="bateria"
                name="bateria"
                checked={formData.equipamiento.bateria}
                onChange={handleCheckboxChange}
                className="mr-2 h-4 w-4 text-[#4178D4] focus:ring-[#4178D4]"
              />
              <label htmlFor="bateria" className="text-gray-700 font-medium">
                Batería
              </label>
            </div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="kit8kw"
                name="kit8kw"
                checked={formData.equipamiento.kit8kw}
                onChange={handleCheckboxChange}
                className="mr-2 h-4 w-4 text-[#4178D4] focus:ring-[#4178D4]"
              />
              <label htmlFor="kit8kw" className="text-gray-700 font-medium">
                Kit 8kw
              </label>
            </div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="kit15kw"
                name="kit15kw"
                checked={formData.equipamiento.kit15kw}
                onChange={handleCheckboxChange}
                className="mr-2 h-4 w-4 text-[#4178D4] focus:ring-[#4178D4]"
              />
              <label htmlFor="kit15kw" className="text-gray-700 font-medium">
                Kit 15kw
              </label>
            </div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="microinversores"
                name="microinversores"
                checked={formData.equipamiento.microinversores}
                onChange={handleCheckboxChange}
                className="mr-2 h-4 w-4 text-[#4178D4] focus:ring-[#4178D4]"
              />
              <label
                htmlFor="microinversores"
                className="text-gray-700 font-medium"
              >
                Microinversores
              </label>
            </div>
          </div>
          <div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="estructurasMontaje"
                name="estructurasMontaje"
                checked={formData.equipamiento.estructurasMontaje}
                onChange={handleCheckboxChange}
                className="mr-2 h-4 w-4 text-[#4178D4] focus:ring-[#4178D4]"
              />
              <label
                htmlFor="estructurasMontaje"
                className="text-gray-700 font-medium"
              >
                Estructuras de montaje
              </label>
            </div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="legalizacionDisenios"
                name="legalizacionDisenios"
                checked={formData.equipamiento.legalizacionDisenios}
                onChange={handleCheckboxChange}
                className="mr-2 h-4 w-4 text-[#4178D4] focus:ring-[#4178D4]"
              />
              <label
                htmlFor="legalizacionDisenios"
                className="text-gray-700 font-medium"
              >
                Legalización y diseños
              </label>
            </div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="kit5kw"
                name="kit5kw"
                checked={formData.equipamiento.kit5kw}
                onChange={handleCheckboxChange}
                className="mr-2 h-4 w-4 text-[#4178D4] focus:ring-[#4178D4]"
              />
              <label htmlFor="kit5kw" className="text-gray-700 font-medium">
                Kit 5kw
              </label>
            </div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="kit12kw"
                name="kit12kw"
                checked={formData.equipamiento.kit12kw}
                onChange={handleCheckboxChange}
                className="mr-2 h-4 w-4 text-[#4178D4] focus:ring-[#4178D4]"
              />
              <label htmlFor="kit12kw" className="text-gray-700 font-medium">
                Kit 12kw
              </label>
            </div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="kit30kw"
                name="kit30kw"
                checked={formData.equipamiento.kit30kw}
                onChange={handleCheckboxChange}
                className="mr-2 h-4 w-4 text-[#4178D4] focus:ring-[#4178D4]"
              />
              <label htmlFor="kit30kw" className="text-gray-700 font-medium">
                Kit 30kw
              </label>
            </div>
          </div>
          <div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="transporte"
                name="transporte"
                checked={formData.equipamiento.transporte}
                onChange={handleCheckboxChange}
                className="mr-2 h-4 w-4 text-[#4178D4] focus:ring-[#4178D4]"
              />
              <label htmlFor="transporte" className="text-gray-700 font-medium">
                Transporte
              </label>
            </div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="manoObra"
                name="manoObra"
                checked={formData.equipamiento.manoObra}
                onChange={handleCheckboxChange}
                className="mr-2 h-4 w-4 text-[#4178D4] focus:ring-[#4178D4]"
              />
              <label htmlFor="manoObra" className="text-gray-700 font-medium">
                Mano de obra
              </label>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div>
          <label className="block mb-1.5 font-medium text-gray-700">
            Hoja de cálculo <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center">
            <input
              type="file"
              id="hojaCalculoArchivo"
              name="hojaCalculo"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <label
              htmlFor="hojaCalculoArchivo"
              className="flex items-center gap-2 px-4 py-2 border border-[#4178D4] rounded-lg bg-white text-[#4178D4] hover:bg-blue-50 cursor-pointer transition-colors"
            >
              <Upload className="w-5 h-5" />
              <span>
                {formData.hojaCalculo ? formData.hojaCalculo : "Subir archivo"}
              </span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">Formatos: Excel, CSV</p>
        </div>
        <div>
          <label className="block mb-1.5 font-medium text-gray-700">
            Valor cotización <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              $
            </span>
            <input
              name="valorCotizacion"
              type="number"
              min="0"
              step="1000"
              required
              value={formData.valorCotizacion}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Valor en pesos"
              className="w-full p-3 pl-8 bg-gray-50 border border-gray-200 rounded-lg"
            />
          </div>
        </div>
        <div>
          <label className="block mb-1.5 font-medium text-gray-700">
            Forma de pago <span className="text-red-500">*</span>
          </label>
          <select
            name="formaPago"
            required
            value={formData.formaPago}
            onChange={handleChange}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
          >
            <option value="">Seleccione forma de pago</option>
            <option value="Contado">Contado</option>
            <option value="Crédito">Crédito</option>
            <option value="Leasing">Leasing</option>
            <option value="Anticipos">Anticipos</option>
          </select>
        </div>
      </div>
    </div>
  );

  // Render paso actual
  const renderStep = () => {
    if (currentStep === 1) return renderStep1();
    if (currentStep === 2) return renderStep2();
    if (currentStep === 3) return renderStep3();
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white z-9 rounded-t-xl">
        <h2 className="text-xl md:text-2xl font-bold text-[#34509F]">
          NUEVO PROYECTO
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
      {renderStepIndicator()}

      <form onSubmit={handleSubmit} className="p-6">
        {renderStep()}
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
                className="flex items-center justify-center gap-2 px-8 py-2.5 bg-[#4178D4] text-white font-medium rounded-lg hover:bg-[#34509F] hover:shadow-lg transition cursor-pointer"
              >
                <CheckCircle className="w-5 h-5" />
                Guardar
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminNuevoProyectoForm;
