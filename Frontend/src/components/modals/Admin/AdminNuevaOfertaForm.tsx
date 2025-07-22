import { useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Upload,
  CheckCircle,
  FileText,
  DollarSign,
  Zap,
  DownloadCloud,
  Download,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { colombiaData } from "@/utils/colombiaData";
import { downloadFile, getCorrectMediaUrl } from "@/utils/fileUtils";
import { toast } from "react-toastify";

import ofertaServiceFixed from "../../../services/ofertaServiceFixed";
import {
  visitaTecnicaService,
  VisitaTecnicaResponse,
} from "../../../services/VisitaTecnicaService";

// Función para formatear números con separadores de miles
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
  }).format(value);
};

// Función para eliminar caracteres no numéricos de un valor
const cleanNumber = (value: string): number => {
  // Eliminar todos los caracteres excepto dígitos y punto decimal
  const cleanedValue = value.replace(/[^\d]/g, "");
  return cleanedValue ? parseInt(cleanedValue, 10) : 0;
};

// Tipos para los archivos adjuntos
type FileData = {
  id?: number;
  name: string;
  attach: string;
  is_calculation_sheet?: boolean;
};

// Tipo para la estructura de archivos separados
type SeparatedFilesStructure = {
  hoja_calculo?: FileData[];
  archivos_generales?: FileData[];
};

// Funciones para verificar el tipo de datos de los archivos
// @ts-ignore
function isArrayOfFiles(files: any): files is FileData[] {
  return Array.isArray(files);
}

// Tipo para determinar si todosLosArchivos es una estructura separada
function isSeparatedFilesStructure(
  files: any
): files is SeparatedFilesStructure {
  return (
    !Array.isArray(files) &&
    typeof files === "object" &&
    (files.hoja_calculo !== undefined || files.archivos_generales !== undefined)
  );
}

interface NuevaOfertaFormData {
  id?: number;
  // Campos del cliente según el modelo backend
  type_identification: "C.C" | "NIT";
  identification: string;
  firs_name: string;
  other_name?: string;
  last_name: string;
  secon_surname: string;
  name: string;
  addres: string;
  phone: string;
  phone_2?: string;
  // ID de la visita técnica relacionada
  selectedVisit?: number | null;
  // Otros campos existentes
  nombreCliente: string;
  departamento: string;
  ciudad: string;
  fechaVisitaComercial: string;
  tipoProyecto: string;
  codigoVT?: string;
  fechaInicio: string;
  descripcion: string;
  nitCC: string;
  representante: string;
  tipoSistema: string;
  potenciaKw: number;
  tipoPotenciaPaneles: string;
  produccionEnergetica: number;
  cantidadPaneles: number;
  areaNecesaria: number;
  tipoInstalacion: string;

  // Campo para el código de oferta requerido por el backend
  code?: string;
  // IDs para el backend
  person_id?: number | null;
  user_id?: number;

  // Campos para el estado de la cotización
  estadoCotizacion?: string; // Corresponde a 'state' en el backend
  comentarioCotizacion?: string; // Se guardará en M_comentary_sale_order
  cotizador?: string; // Corresponde a 'cotizador' en el backend
  archivoCotizacion?: File | string; // Corresponde a 'archivo_cotizacion' en el backend

  equipamiento: {
    panelesSolares: boolean;
    estructurasMontaje: boolean;
    cableadoGabinete: boolean;
    legalizacionDisenos: boolean;
    bateria: boolean;
    inversor: boolean;
    kit5kw: boolean;
    kit8kw: boolean;
    kit12kw: boolean;
    kit15kw: boolean;
    kit30kw: boolean;
    microinversores: boolean;
    transporte: boolean;
    manoDeObra: boolean;
    preciosPanelesSolares: number;
    preciosEstructurasMontaje: number;
    preciosCableadoGabinete: number;
    preciosLegalizacionDisenos: number;
    preciosBateria: number;
    preciosInversor: number;
    preciosKit5kw: number;
    preciosKit8kw: number;
    preciosKit12kw: number;
    preciosKit15kw: number;
    preciosKit30kw: number;
    preciosMicroinversores: number;
    preciosTransporte: number;
    preciosManoDeObra: number;
    [key: string]: boolean | number; // Para permitir acceso dinámico a las propiedades
  };
  hojaCalculo: string | File;
  valorTotal: number;
  plazoEntrega: number;
  validezOferta: number;
  garantia: string;
  formaPago: string;
  observaciones: string;
  archivosAdjuntos: (string | File)[];
  // Campos adicionales para manejar archivos
  archivosAdjuntosInfo?: any[]; // Información completa sobre los archivos adjuntos

  // Campos para el manejo de eliminación de archivos
  archivos_a_eliminar?: number[];
  archivos_nombres_eliminar?: string[];

  // Todos los archivos, incluyendo hoja de cálculo - puede ser un array o un objeto con estructura separada
  todosLosArchivos?:
    | {
        hoja_calculo?: Array<{
          id?: number;
          name: string;
          attach: string;
          is_calculation_sheet?: boolean;
        }>;
        archivos_generales?: Array<{
          id?: number;
          name: string;
          attach: string;
          is_calculation_sheet?: boolean;
        }>;
      }
    | Array<{
        id?: number;
        name: string;
        attach: string;
        is_calculation_sheet?: boolean;
      }>;

  // Campos de cotización conectados al backend
  estado?: string; // 'aprobado' | 'rechazado' | 'pendiente'
  fechaCotizacion?: string; // Campo 'fecha_cotizacion' en el modelo M_sale_order
}

interface NuevaOfertaFormProps {
  onSubmit: (data: NuevaOfertaFormData) => void;
  onCancel: () => void;
  // Podemos recibir datos de vista técnica existente si es necesario
  visitaTecnicaData?: any;
  // Datos de la oferta para visualizar
  initialData?: NuevaOfertaFormData;
  // Indica si el formulario está en modo de solo lectura
  isReadOnly?: boolean;
  // Indica si el paso 4 (información de cotización) es editable incluso en modo de solo lectura
  editableStep4?: boolean;
  // Nuevo prop para el ID del usuario actual
  currentUserId?: number;
}

const AdminNuevaOfertaForm: React.FC<NuevaOfertaFormProps> = ({
  onSubmit,
  onCancel,
  visitaTecnicaData,
  initialData,
  isReadOnly = false,
  editableStep4 = false,
  currentUserId, // Añadir aquí el currentUserId
}) => {
  // Estado para controlar el paso actual del formulario
  const [currentStep, setCurrentStep] = useState<number>(
    isReadOnly && editableStep4 ? 4 : 1
  );

  // Estados para las visitas técnicas
  const [userVisits, setUserVisits] = useState<VisitaTecnicaResponse[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<number | null>(null);
  const [isLoadingVisits, setIsLoadingVisits] = useState(false);

  // Efecto para cargar las visitas técnicas del usuario actual
  useEffect(() => {
    const fetchUserVisits = async () => {
      if (!currentUserId) return;

      try {
        setIsLoadingVisits(true);
        const response: any = await visitaTecnicaService.getUserVisits(
          currentUserId
        );
        // Asegurar que siempre tengamos un array, incluso si la API devuelve algo inesperado
        if (Array.isArray(response)) {
          setUserVisits(response);
        } else if (
          response &&
          typeof response === "object" &&
          Array.isArray(response.results)
        ) {
          setUserVisits(response.results);
        } else {
          console.error(
            "La respuesta de visitas técnicas no es un array:",
            response
          );
          setUserVisits([]);
        }
      } catch (error) {
        console.error("Error al cargar visitas técnicas:", error);
        setUserVisits([]);
      } finally {
        setIsLoadingVisits(false);
      }
    };

    fetchUserVisits();
  }, [currentUserId]);

  // Función para manejar la selección de una visita técnica
  const handleVisitSelection = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const visitId = parseInt(e.target.value);

    if (visitId && !isNaN(visitId)) {
      setSelectedVisit(visitId);
      // También actualizar el estado selectedVisit en formData
      setFormData((prev) => ({
        ...prev,
        selectedVisit: visitId,
      }));
      try {
        const visitData = await visitaTecnicaService.getById(visitId);

        // Verificar que tenemos datos válidos antes de continuar
        if (!visitData || typeof visitData !== "object") {
          toast.error("No se pudieron obtener detalles de la visita técnica");
          return;
        }

        // Actualizar el formulario con los datos de la visita seleccionada
        // Procesar apellido para dividirlo si tiene un espacio
        let lastName = visitData.last_name || "";
        let secondSurname = "";

        // Si el apellido tiene un espacio, dividirlo en dos partes
        if (lastName.includes(" ")) {
          const nameParts = lastName.split(" ");
          lastName = nameParts[0]; // Primera parte del apellido
          secondSurname = nameParts.slice(1).join(" "); // El resto como segundo apellido
        }

        // Procesar fechas para su uso en el formulario - con log adicional para debug

        const formattedDateVisit =
          visitData.date_visit && typeof visitData.date_visit === "string"
            ? visitData.date_visit.split("T")[0]
            : new Date().toISOString().split("T")[0];

        const formattedStartTime =
          visitData.start_time && typeof visitData.start_time === "string"
            ? visitData.start_time.split("T")[0] // Si ya incluye tiempo, extraemos solo la fecha
            : formattedDateVisit; // Si no hay start_time, usamos date_visit como respaldo

        // Primero actualizamos datos principales
        setFormData((prev) => ({
          ...prev,
          // Datos del cliente
          nombreCliente: `${visitData.name || ""} ${visitData.last_name || ""}`,
          firs_name: visitData.name || "",
          last_name: lastName,
          secon_surname: secondSurname,
          departamento: visitData.department || "",
          // Ciudad se actualizará después con la lógica específica del departamento
          phone: visitData.phone || "",
          nitCC: visitData.N_identification || "",
          addres: visitData.addres || "",
          identification: visitData.N_identification || "",
          name: `${visitData.name || ""} ${visitData.last_name || ""}`,
          // representante: visitData.name || "",

          // Fecha de visita comercial desde la visita técnica (date_visit)
          fechaVisitaComercial: formattedDateVisit,
          // Fecha de inicio desde start_time de la visita técnica
          fechaInicio: formattedStartTime,
          // El tipo de identificación siempre se mantiene como C.C ya que es el default
          type_identification: "C.C" as "C.C" | "NIT", // Especificar tipo explícitamente
          // Código de visita técnica
          codigoVT: visitData.code || "",
          // ID de la visita técnica para la relación con el backend
          selectedVisit: visitId,
        }));

        // Si hay un departamento, actualiza también el selector de departamentos
        if (visitData.department) {
          // Intentar encontrar el ID del departamento en colombiaData
          const deptData = colombiaData.find(
            (dept) =>
              dept.name.toLowerCase() === visitData.department?.toLowerCase()
          );

          if (deptData) {
            setSelectedDepartment(deptData.id);
            // También actualizar las ciudades disponibles
            setAvailableCities(deptData.cities || []);

            // Si tenemos el city de la visita, encontrar el id de la ciudad y establecerlo
            if (visitData.city) {
              // Buscar la ciudad por nombre en el departamento seleccionado
              const cityObj = deptData.cities?.find(
                (city) =>
                  city.name.toLowerCase() === visitData.city?.toLowerCase()
              );

              if (cityObj) {
                // Primero actualizar las ciudades disponibles y luego la selección
                setAvailableCities(deptData.cities || []);

                // Dar tiempo al DOM para actualizar las opciones y luego seleccionar la ciudad
                setTimeout(() => {
                  setFormData((prev) => ({
                    ...prev,
                    ciudad: cityObj.name,
                  }));
                }, 100);
              } else {
                // Si no encontramos la ciudad, crear una opción personalizada
                const ciudadesPersonalizadas = [
                  ...deptData.cities,
                  { id: "custom", name: visitData.city },
                ];
                setAvailableCities(ciudadesPersonalizadas);

                setTimeout(() => {
                  setFormData((prev) => ({
                    ...prev,
                    ciudad: visitData.city,
                  }));
                }, 100);
              }
            }
          } else {
            // Si no encontramos el departamento, al menos configuramos el string para mostrar
            setSelectedDepartment(visitData.department);

            // Si tenemos ciudad pero no departamento en la lista, usar directamente el valor de la ciudad
            if (visitData.city) {
              setTimeout(() => {
                setFormData((prev) => ({
                  ...prev,
                  ciudad: visitData.city,
                }));
              }, 0);
            }
          }
        }
      } catch (error) {
        console.error("Error al obtener detalles de la visita técnica:", error);
      }
    } else {
      // Si selecciona "Seleccionar visita técnica", limpiar la selección
      setSelectedVisit(null);
    }
  };

  // Estados para manejar departamentos y ciudades
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [availableCities, setAvailableCities] = useState<
    Array<{ id: string; name: string }>
  >([]); // Estado para el formulario con todos los campos
  const [formData, setFormData] = useState<NuevaOfertaFormData>(
    visitaTecnicaData
      ? {
          // Inicializar con datos de visita técnica si existen
          type_identification: visitaTecnicaData.type_identification || "C.C",
          identification: visitaTecnicaData.identification || "",
          firs_name: visitaTecnicaData.firs_name || "",
          other_name: visitaTecnicaData.other_name || "",
          last_name: visitaTecnicaData.last_name || "",
          secon_surname: visitaTecnicaData.secon_surname || "",
          name: visitaTecnicaData.name || "",
          addres: visitaTecnicaData.addres || "",
          phone: visitaTecnicaData.phone || "",
          phone_2: visitaTecnicaData.phone_2 || "",
          nombreCliente: visitaTecnicaData.nombreCliente || "",
          ciudad: visitaTecnicaData.ciudad || "",
          departamento: visitaTecnicaData.departamento || "",
          fechaVisitaComercial: visitaTecnicaData.fechaVisitaComercial || "",
          tipoProyecto: visitaTecnicaData.tipoProyecto || "",
          codigoVT: visitaTecnicaData.codigoVT || "",
          fechaInicio: visitaTecnicaData.fechaInicio || "",
          descripcion: visitaTecnicaData.descripcion || "",
          nitCC: visitaTecnicaData.nitCC || visitaTecnicaData.nitcc || "",
          representante: visitaTecnicaData.representante || "",
          tipoSistema: visitaTecnicaData.tipoSistema || "",
          potenciaKw: visitaTecnicaData.potenciaKw || 0,
          tipoPotenciaPaneles: visitaTecnicaData.tipoPotenciaPaneles || "",
          produccionEnergetica: visitaTecnicaData.produccionEnergetica || 0,
          cantidadPaneles: visitaTecnicaData.cantidadPaneles || 0,
          areaNecesaria: visitaTecnicaData.areaNecesaria || 0,
          // ID de la visita técnica seleccionada
          selectedVisit: visitaTecnicaData.id || null,
          tipoInstalacion: visitaTecnicaData.tipoInstalacion || "",
          equipamiento: visitaTecnicaData.equipamiento || {
            panelesSolares: false,
            estructurasMontaje: false,
            cableadoGabinete: false,
            legalizacionDisenos: false,
            bateria: false,
            inversor: false,
            kit5kw: false,
            kit8kw: false,
            kit12kw: false,
            kit15kw: false,
            kit30kw: false,
            microinversores: false,
            transporte: false,
            manoDeObra: false,
            preciosPanelesSolares: 0,
            preciosEstructurasMontaje: 0,
            preciosCableadoGabinete: 0,
            preciosLegalizacionDisenos: 0,
            preciosBateria: 0,
            preciosInversor: 0,
            preciosKit5kw: 0,
            preciosKit8kw: 0,
            preciosKit12kw: 0,
            preciosKit15kw: 0,
            preciosKit30kw: 0,
            preciosMicroinversores: 0,
            preciosTransporte: 0,
            preciosManoDeObra: 0,
          },
          hojaCalculo: visitaTecnicaData.hojaCalculo || "",
          valorTotal: visitaTecnicaData.valorTotal || 0,
          plazoEntrega: visitaTecnicaData.plazoEntrega || 0,
          validezOferta: visitaTecnicaData.validezOferta || 0,
          garantia: visitaTecnicaData.garantia || "",
          formaPago: visitaTecnicaData.formaPago || "",
          observaciones: visitaTecnicaData.observaciones || "",
          archivosAdjuntos: visitaTecnicaData.archivosAdjuntos || [],
          estadoCotizacion:
            visitaTecnicaData.estadoCotizacion ||
            visitaTecnicaData.state ||
            "pendiente",
          comentarioCotizacion: visitaTecnicaData.comentarioCotizacion || "",
          cotizador: visitaTecnicaData.cotizador || "",
          fechaCotizacion: visitaTecnicaData.fechaCotizacion || "",
          archivoCotizacion:
            visitaTecnicaData.archivoCotizacion ||
            visitaTecnicaData.archivo_cotizacion ||
            "",
        }
      : {
          // Campos del cliente según el modelo backend
          type_identification: "C.C",
          identification: "",
          firs_name: "",
          other_name: "",
          last_name: "",
          secon_surname: "",
          name: "",
          addres: "",
          phone: "",
          phone_2: "",

          // Otros campos existentes
          nombreCliente: "",
          ciudad: "",
          departamento: "",
          fechaVisitaComercial: "",
          tipoProyecto: "",
          codigoVT: "",
          fechaInicio: "",
          descripcion: "",
          // Soportar tanto nitcc (camelCase) como nitCC (PascalCase) para mayor compatibilidad
          nitCC: "",
          representante: "",

          // Paso 2: Detalles técnicos
          tipoSistema: "",
          potenciaKw: 0,
          tipoPotenciaPaneles: "",
          produccionEnergetica: 0,
          cantidadPaneles: 0,
          areaNecesaria: 0,
          tipoInstalacion: "",
          equipamiento: visitaTecnicaData?.equipamiento || {
            panelesSolares: false,
            estructurasMontaje: false,
            cableadoGabinete: false,
            legalizacionDisenos: false,
            bateria: false,
            inversor: false,
            kit5kw: false,
            kit8kw: false,
            kit12kw: false,
            kit15kw: false,
            kit30kw: false,
            microinversores: false,
            transporte: false,
            manoDeObra: false,
            preciosPanelesSolares: 0,
            preciosEstructurasMontaje: 0,
            preciosCableadoGabinete: 0,
            preciosLegalizacionDisenos: 0,
            preciosBateria: 0,
            preciosInversor: 0,
            preciosKit5kw: 0,
            preciosKit8kw: 0,
            preciosKit12kw: 0,
            preciosKit15kw: 0,
            preciosKit30kw: 0,
            preciosMicroinversores: 0,
            preciosTransporte: 0,
            preciosManoDeObra: 0,
          },
          hojaCalculo: "", // Paso 3: Información financiera
          valorTotal: 0,
          plazoEntrega: 0,
          validezOferta: 0,
          garantia: "",
          formaPago: "",
          observaciones: "",
          archivosAdjuntos: [],

          // Campos para el manejo de eliminación de archivos
          archivos_a_eliminar: [],
          archivos_nombres_eliminar: [],

          // Paso 4: Información de cotización
          estadoCotizacion: "pendiente",
          comentarioCotizacion: "",
          cotizador: "",
          fechaCotizacion: "",
          archivoCotizacion: "",
        }
  );

  // Efecto para cargar datos iniciales desde initialData (si existe)
  // Esto es importante para garantizar que los datos se carguen cuando
  // initialData se proporciona después del montaje del componente
  useEffect(() => {
    if (initialData) {
      setFormData((prevData) => ({
        ...prevData,
        ...initialData,
      }));
    }
  }, [initialData]);

  // Efecto para inicializar departamento y ciudades cuando hay datos iniciales
  useEffect(() => {
    if (!visitaTecnicaData) return;

    // MÉTODO 1: Usar departamento directamente si existe
    if (visitaTecnicaData.departamento) {
      const dept = colombiaData.find(
        (d) => d.name === visitaTecnicaData.departamento
      );

      if (dept) {
        setSelectedDepartment(dept.id);
        setAvailableCities(dept.cities);

        setFormData((prev) => ({
          ...prev,
          departamento: dept.name,
          ciudad: visitaTecnicaData.ciudad || prev.ciudad,
        }));
      } else {
        // Departamento no está en la lista estándar, crear entrada personalizada

        setSelectedDepartment("custom");
        const ciudadItem = visitaTecnicaData.ciudad
          ? { id: "custom", name: visitaTecnicaData.ciudad }
          : { id: "custom", name: "Ciudad personalizada" };
        setAvailableCities([ciudadItem]);

        setFormData((prev) => ({
          ...prev,
          departamento: visitaTecnicaData.departamento,
          ciudad: visitaTecnicaData.ciudad || prev.ciudad,
        }));
      }
    }
    // MÉTODO 2: Si no hay departamento pero sí ciudad, buscar el departamento por ciudad
    else if (visitaTecnicaData.ciudad) {
      let foundDept = null;
      for (const dept of colombiaData) {
        const city = dept.cities.find(
          (c) => c.name === visitaTecnicaData.ciudad
        );
        if (city) {
          foundDept = dept;
          break;
        }
      }

      if (foundDept) {
        setSelectedDepartment(foundDept.id);
        setAvailableCities(foundDept.cities);

        setFormData((prev) => ({
          ...prev,
          departamento: foundDept.name,
          ciudad: visitaTecnicaData.ciudad,
        }));
      } else {
        // Ciudad no encontrada en la lista estándar, crear entrada personalizada

        setSelectedDepartment("custom");
        const ciudadItem = { id: "custom", name: visitaTecnicaData.ciudad };
        setAvailableCities([ciudadItem]);

        const departamentoGenerado = `Departamento de ${visitaTecnicaData.ciudad}`;
        setFormData((prev) => ({
          ...prev,
          departamento: departamentoGenerado,
          ciudad: visitaTecnicaData.ciudad,
        }));
      }
    }
  }, [visitaTecnicaData?.departamento, visitaTecnicaData?.ciudad, isReadOnly]); // Efecto para actualizar las ciudades cuando cambia el departamento
  useEffect(() => {
    if (selectedDepartment) {
      // Si es un departamento personalizado (caso especial)
      if (selectedDepartment === "custom") {
        // No hacemos nada aquí, ya que los valores ya están establecidos
        // en el efecto anterior para visitaTecnicaData
      } else {
        // Es un departamento normal de la lista
        const department = colombiaData.find(
          (d) => d.id === selectedDepartment
        );
        if (department) {
          setAvailableCities(department.cities);

          // Solo actualizar el departamento en formData si no tenemos datos iniciales
          // o si el usuario está cambiando activamente el departamento
          if (!visitaTecnicaData?.departamento) {
            setFormData((prev) => ({
              ...prev,
              departamento: department.name,
              ciudad: "", // Solo resetear la ciudad si no hay datos iniciales
            }));
          }
        }
      }
    } else {
      // Si no hay departamento seleccionado, limpiar las ciudades disponibles
      setAvailableCities([]);
    }
  }, [selectedDepartment, visitaTecnicaData?.departamento]); // Efecto para manejar la inicialización del archivo de cotización
  useEffect(() => {
    // Si tenemos datos de visitaTecnicaData y hay un archivo_cotizacion o archivoCotizacion
    if (visitaTecnicaData) {
      // Buscamos el archivo de cotización en todas las posibles ubicaciones
      const archivoPath =
        visitaTecnicaData.archivo_cotizacion ||
        visitaTecnicaData.archivoCotizacion ||
        visitaTecnicaData.archivos_adjuntos?.archivo_cotizacion;

      if (archivoPath) {
        // Actualizamos el formData para asegurarnos de que el archivo se muestre correctamente
        setFormData((prev) => ({
          ...prev,
          archivoCotizacion: archivoPath,
        }));
      } else {
      }
    }
  }, [visitaTecnicaData]);
  // Función para manejar cambios en los inputs de texto
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  // Función para manejar cambios en inputs numéricos
  // Función para manejar cambios en inputs numéricos
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Si es valorTotal, limpiamos el formato y convertimos a número
    if (name === "valorTotal") {
      const cleanedValue = cleanNumber(value);
      setFormData((prev) => ({
        ...prev,
        [name]: cleanedValue,
      }));
    } else {
      // Para otros campos numéricos
      setFormData((prev) => ({
        ...prev,
        [name]: value === "" ? 0 : Number(value),
      }));
    }
  };

  // Función para manejar cambios en checkboxes de equipamiento
  const handleEquipmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      equipamiento: {
        ...prev.equipamiento,
        [name]: checked,
      },
    }));
  };
  // Función para manejar subida de archivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      // Guardar los objetos File completos, no solo los nombres
      const files = Array.from(e.target.files);
      setFormData((prev) => ({
        ...prev,
        archivosAdjuntos: [...prev.archivosAdjuntos, ...files],
      }));
    }
  };

  const handleDeleteFile = async (file: File | string | any, index: number) => {
    try {
      // Array para IDs de archivos a eliminar
      let archivosAEliminar: number[] = [
        ...(formData.archivos_a_eliminar || []),
      ];

      // Nuevo array para nombres de archivos a eliminar cuando no hay ID
      let archivosNombresEliminar: string[] = [
        ...(formData.archivos_nombres_eliminar || []),
      ]; // Si el archivo tiene una estructura con ID y name
      if (typeof file === "object" && file !== null) {
        if (file.id) {
          archivosAEliminar.push(file.id);

          // Si tenemos el ID de la oferta, eliminar inmediatamente el archivo del servidor
          if (initialData?.id) {
            try {
              await ofertaServiceFixed.deleteAttachFile(
                initialData.id,
                file.id
              );
              toast.success("Archivo eliminado del servidor");
            } catch (err) {
              console.error("Error al eliminar archivo del servidor:", err);
              toast.error("Error al eliminar archivo del servidor");
            }
          }
        } else if (file.name) {
          archivosNombresEliminar.push(file.name);
        }
      }
      // Si es un string, asumimos que es el nombre del archivo
      else if (typeof file === "string") {
        archivosNombresEliminar.push(file);
      }

      // Crear una copia de los archivos adjuntos y eliminar el que corresponde al índice
      const nuevosArchivos = [...formData.archivosAdjuntos];
      nuevosArchivos.splice(index, 1);

      setFormData((prev) => ({
        ...prev,
        archivosAdjuntos: nuevosArchivos,
        archivos_a_eliminar: archivosAEliminar,
        archivos_nombres_eliminar: archivosNombresEliminar,
      }));

      // Si fue solo un cambio local
      if (
        file instanceof File ||
        !initialData?.id ||
        (typeof file === "string" && !file.startsWith("media/"))
      ) {
        toast.success("Archivo eliminado");
      }
    } catch (error) {
      console.error("Error al eliminar archivo:", error);
      toast.error("Error al eliminar archivo");
    }
  };

  // Función para avanzar al siguiente paso
  const handleNextStep = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (currentStep < 4) {
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
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Clonar formData para no modificar el estado directamente
    const dataToSubmit = { ...formData };

    // Verificar que la hoja de cálculo está preparada correctamente
    if (dataToSubmit.hojaCalculo instanceof File) {
      // Asignar un nombre especial para que el backend identifique que es una hoja de cálculo
      const originalFile = dataToSubmit.hojaCalculo;

      // Crear un nuevo objeto File con un nombre que indica que es una hoja de cálculo
      // Esto ayudará al backend a identificarlo correctamente
      //@ts-ignore
      const newFileName = "Hoja de Cálculo - " + originalFile.name;

      // No es necesario crear un nuevo File, solo registramos esto para referencia
      // El backend debería identificar este archivo por el campo "hojaCalculo"
    }

    // Verificar si hay archivos adjuntos que son objetos File
    if (
      dataToSubmit.archivosAdjuntos &&
      Array.isArray(dataToSubmit.archivosAdjuntos)
    ) {
      //@ts-ignore
      const filesCount = dataToSubmit.archivosAdjuntos.filter(
        (f) => f instanceof File
      ).length;
    }

    onSubmit(dataToSubmit);
  };

  // Prevenir envío del formulario al presionar Enter en inputs
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
    }
  }; // Función para generar cotización
  const handleGenerarCotizacion = async () => {
    try {
      // Buscar el ID de la oferta en todas las fuentes posibles
      let ofertaId = null;

      // Verificar todas las posibles fuentes de ID en orden de prioridad

      // Primera prioridad: obtener de la URL si estamos en una vista de detalle
      if (typeof window !== "undefined" && window.location.pathname) {
        const urlMatch = window.location.pathname.match(/\/ofertas\/(\d+)/);
        if (urlMatch && urlMatch[1]) {
          ofertaId = parseInt(urlMatch[1]);
        } else {
          // Intento alternativo para extraer el ID
          const urlParts = window.location.pathname.split("/");
          for (let i = 0; i < urlParts.length; i++) {
            const possibleId = parseInt(urlParts[i]);
            if (!isNaN(possibleId) && possibleId > 0) {
              ofertaId = possibleId;

              break;
            }
          }
        }
      }

      // Segunda prioridad: obtener de los datos del formulario si no se encontró en la URL
      if (!ofertaId) {
        if (formData.id) {
          ofertaId = formData.id;
        } else if (initialData?.id) {
          ofertaId = initialData.id;
        } else if (visitaTecnicaData?.id) {
          ofertaId = visitaTecnicaData.id;
        }
      }

      // Registrar todos los datos para depuración

      if (!ofertaId) {
        toast.error(
          "No se pudo identificar el ID de la oferta para generar la cotización"
        );
        return;
      }

      // Mostrar notificación de carga
      toast.info("Por favor espera mientras se genera la cotización...");

      // Importar dinámicamente el servicio para evitar dependencias circulares
      const { downloadQuotationPDF } = await import(
        "@/services/documentService"
      );

      // Llamar al servicio para descargar el PDF
      const success = await downloadQuotationPDF(ofertaId);

      if (success) {
        toast.success("La cotización se ha descargado correctamente.");
      } else {
        toast.error("No se pudo generar la cotización. Intenta nuevamente.");
      }
    } catch (error) {
      console.error("Error al generar la cotización:", error);
      toast.error("Ocurrió un error al generar la cotización");
    }
  };

  // Función para manejar cambios en los precios del equipamiento
  // Función para calcular el valor total
  const calculateTotalValue = (equipamiento: any) => {
    const prices = [
      equipamiento.preciosPanelesSolares || 0,
      equipamiento.preciosEstructurasMontaje || 0,
      equipamiento.preciosCableadoGabinete || 0,
      equipamiento.preciosLegalizacionDisenos || 0,
      equipamiento.preciosBateria || 0,
      equipamiento.preciosInversor || 0,
      equipamiento.preciosKit5kw || 0,
      equipamiento.preciosKit8kw || 0,
      equipamiento.preciosKit12kw || 0,
      equipamiento.preciosKit15kw || 0,
      equipamiento.preciosKit30kw || 0,
      equipamiento.preciosMicroinversores || 0,
      equipamiento.preciosTransporte || 0,
      equipamiento.preciosManoDeObra || 0,
    ];

    return prices.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  };

  // Función para manejar cambios en los precios del equipamiento
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = cleanNumber(value);
    const equipmentName =
      name.replace("precios", "").charAt(0).toLowerCase() +
      name.replace("precios", "").slice(1);

    setFormData((prev) => {
      // Aseguramos que si se ingresa un precio, el checkbox correspondiente esté seleccionado
      const newEquipamiento = {
        ...prev.equipamiento,
        [name]: numericValue,
        [equipmentName]: true, // Si el usuario está editando el precio, automáticamente marcamos el checkbox
      };

      const newTotal = calculateTotalValue(newEquipamiento);

      return {
        ...prev,
        equipamiento: newEquipamiento,
        valorTotal: newTotal,
      };
    });
  };
  // Función para descargar archivos adjuntos
  const handleDownloadFile = async (filename: string) => {
    console.log("Intentando descargar archivo:", filename);

    try {
      // 1. Buscar en archivosAdjuntosInfo
      if (Array.isArray(formData.archivosAdjuntosInfo)) {
        const archivo = formData.archivosAdjuntosInfo.find(
          (a: any) => a.name === filename
        );

        if (archivo && archivo.attach) {
          console.log("Archivo encontrado en archivosAdjuntosInfo:", archivo);
          // Usar la función de corrección de URL
          let fileUrl = archivo.attach;
          if (!fileUrl.startsWith("http")) {
            fileUrl = getCorrectMediaUrl(
              `http://127.0.0.1:8000${archivo.attach}`
            );
          } else {
            fileUrl = getCorrectMediaUrl(fileUrl);
          }
          console.log("URL de descarga:", fileUrl);
          downloadFile(fileUrl, filename);
          return;
        }
      }

      // 2. Buscar en todosLosArchivos (estructura separada)
      if (
        formData.todosLosArchivos &&
        isSeparatedFilesStructure(formData.todosLosArchivos) &&
        formData.todosLosArchivos.archivos_generales
      ) {
        const archivo = formData.todosLosArchivos.archivos_generales.find(
          (a: any) => a.name === filename
        );

        if (archivo && archivo.attach) {
          console.log(
            "Archivo encontrado en todosLosArchivos.archivos_generales:",
            archivo
          );
          // Usar la función de corrección de URL
          let fileUrl = archivo.attach;
          if (!fileUrl.startsWith("http")) {
            fileUrl = getCorrectMediaUrl(
              `http://127.0.0.1:8000${archivo.attach}`
            );
          } else {
            fileUrl = getCorrectMediaUrl(fileUrl);
          }
          console.log("URL de descarga:", fileUrl);
          downloadFile(fileUrl, filename);
          return;
        }
      }

      // 3. Buscar en todosLosArchivos (array)
      if (
        formData.todosLosArchivos &&
        Array.isArray(formData.todosLosArchivos)
      ) {
        const archivo = formData.todosLosArchivos.find(
          (a: any) => a.name === filename
        );

        if (archivo && archivo.attach) {
          console.log("Archivo encontrado en todosLosArchivos array:", archivo);
          // Usar la función de corrección de URL
          let fileUrl = archivo.attach;
          if (!fileUrl.startsWith("http")) {
            fileUrl = getCorrectMediaUrl(
              `http://127.0.0.1:8000${archivo.attach}`
            );
          } else {
            fileUrl = getCorrectMediaUrl(fileUrl);
          }
          console.log("URL de descarga:", fileUrl);
          downloadFile(fileUrl, filename);
          return;
        }
      }

      // 4. Buscar en initialData si está disponible
      if (initialData) {
        // 4.1 Verificar archivosAdjuntosInfo en initialData
        if (Array.isArray(initialData.archivosAdjuntosInfo)) {
          const archivo = initialData.archivosAdjuntosInfo.find(
            (a: any) => a.name === filename
          );

          if (archivo && archivo.attach) {
            console.log(
              "Archivo encontrado en initialData.archivosAdjuntosInfo:",
              archivo
            );
            // Usar la función de corrección de URL
            let fileUrl = archivo.attach;
            if (!fileUrl.startsWith("http")) {
              fileUrl = getCorrectMediaUrl(
                `http://127.0.0.1:8000${archivo.attach}`
              );
            } else {
              fileUrl = getCorrectMediaUrl(fileUrl);
            }
            console.log("URL de descarga:", fileUrl);
            downloadFile(fileUrl, filename);
            return;
          }
        }

        // 4.2 Verificar todosLosArchivos en initialData (estructura separada)
        if (
          initialData.todosLosArchivos &&
          isSeparatedFilesStructure(initialData.todosLosArchivos) &&
          initialData.todosLosArchivos.archivos_generales
        ) {
          const archivo = initialData.todosLosArchivos.archivos_generales.find(
            (a: any) => a.name === filename
          );

          if (archivo && archivo.attach) {
            console.log(
              "Archivo encontrado en initialData.todosLosArchivos.archivos_generales:",
              archivo
            );
            // Usar la función de corrección de URL
            let fileUrl = archivo.attach;
            if (!fileUrl.startsWith("http")) {
              fileUrl = getCorrectMediaUrl(
                `http://127.0.0.1:8000${archivo.attach}`
              );
            } else {
              fileUrl = getCorrectMediaUrl(fileUrl);
            }
            console.log("URL de descarga:", fileUrl);
            downloadFile(fileUrl, filename);
            return;
          }
        }

        // 4.3 Buscar en todosLosArchivos de initialData (array)
        if (
          initialData.todosLosArchivos &&
          Array.isArray(initialData.todosLosArchivos)
        ) {
          const archivo = initialData.todosLosArchivos.find(
            (a: any) => a.name === filename
          );

          if (archivo && archivo.attach) {
            console.log(
              "Archivo encontrado en initialData.todosLosArchivos array:",
              archivo
            );
            // Usar la función de corrección de URL
            let fileUrl = archivo.attach;
            if (!fileUrl.startsWith("http")) {
              fileUrl = getCorrectMediaUrl(
                `http://127.0.0.1:8000${archivo.attach}`
              );
            } else {
              fileUrl = getCorrectMediaUrl(fileUrl);
            }
            console.log("URL de descarga:", fileUrl);
            downloadFile(fileUrl, filename);
            return;
          }
        }
      }

      // 5. Método de respaldo: construir URL basada en el nombre del archivo
      console.log("No se encontró el archivo, usando método de respaldo");

      // Limpiar el nombre del archivo (reemplazar espacios por guiones bajos)
      const justFileName = filename.split(/[\/\\]/).pop();
      const cleanFileName = justFileName?.replace(/ /g, "_") || filename;

      console.log("Nombre del archivo limpio:", cleanFileName);

      // Usar la función de corrección de URL para el método de respaldo
      const fileUrl = getCorrectMediaUrl(
        `http://127.0.0.1:8000/media/media/${cleanFileName}`
      );

      console.log("URL de respaldo:", fileUrl);
      const success = await downloadFile(fileUrl, cleanFileName || filename);

      // Si la descarga falló, intentar con ruta alternativa
      if (!success) {
        console.log("Primer intento fallido, probando con ruta alternativa");
        const altFileUrl = getCorrectMediaUrl(
          `http://127.0.0.1:8000/media/${cleanFileName}`
        );
        console.log("URL alternativa:", altFileUrl);
        downloadFile(altFileUrl, cleanFileName || filename);
      }
    } catch (error) {
      console.error("Error al descargar archivo:", error);
      toast.error("Error al descargar el archivo. Intente nuevamente.");
    }
  };

  // Función para descargar archivo de cotización
  const handleDownloadCotizacion = async () => {
    console.log("Intentando descargar archivo de cotización");

    if (!formData.archivoCotizacion) {
      console.log("No hay archivo de cotización disponible");
      toast.error("No hay archivo de cotización disponible para descargar");
      return;
    }

    console.log("Archivo de cotización:", formData.archivoCotizacion);

    try {
      // Verificar si es un objeto File o una cadena de texto
      if (formData.archivoCotizacion instanceof File) {
        // Es un archivo recién seleccionado, lo convertimos a URL
        console.log("El archivo de cotización es un objeto File local");
        const url = URL.createObjectURL(formData.archivoCotizacion);
        downloadFile(url, formData.archivoCotizacion.name);
        toast.success("Descargando archivo de cotización");
        // Limpiar la URL después de la descarga
        setTimeout(() => URL.revokeObjectURL(url), 3000);
      } else {
        // Es una URL o nombre de archivo existente del backend
        const filename =
          typeof formData.archivoCotizacion === "string"
            ? formData.archivoCotizacion.split("/").pop() ||
              "archivo_cotizacion"
            : "archivo_cotizacion";

        console.log(
          "El archivo de cotización es una URL o nombre de archivo:",
          filename
        );

        // Limpiar el nombre del archivo (reemplazar espacios por guiones bajos)
        const cleanFileName = filename.replace(/ /g, "_");
        console.log("Nombre del archivo de cotización limpio:", cleanFileName);

        // Si la ruta ya es una URL completa, la usamos directamente
        let fileUrl;
        if (formData.archivoCotizacion.toString().startsWith("http")) {
          fileUrl = getCorrectMediaUrl(formData.archivoCotizacion.toString());
        } else {
          fileUrl = getCorrectMediaUrl(
            `${
              import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
            }/media/media/${formData.archivoCotizacion}`
          );
        }

        console.log("URL de descarga:", fileUrl);
        const success = await downloadFile(fileUrl, cleanFileName);
        toast.success(`Descargando archivo: ${cleanFileName}`);

        // Si la descarga falló, intentar con ruta alternativa
        if (!success) {
          console.log("Primer intento fallido, probando con ruta alternativa");
          let altFileUrl;
          if (formData.archivoCotizacion.toString().startsWith("http")) {
            altFileUrl = formData.archivoCotizacion
              .toString()
              .replace("/media/", "/media/media/");
          } else {
            altFileUrl = getCorrectMediaUrl(
              `${
                import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
              }/media/${formData.archivoCotizacion}`
            );
          }
          console.log("URL alternativa:", altFileUrl);
          await downloadFile(altFileUrl, cleanFileName);
        }
      }
    } catch (error) {
      console.error("Error al descargar el archivo de cotización:", error);
      toast.error("Error al descargar el archivo. Intente nuevamente.");
    }
  };

  // Función para descargar hoja de cálculo
  const handleDownloadHojaCalculo = async () => {
    console.log("Intentando descargar hoja de cálculo");

    try {
      // Si es un objeto File, creamos una URL para descargar el archivo local
      if (formData.hojaCalculo instanceof File) {
        console.log(
          "La hoja de cálculo es un archivo local:",
          formData.hojaCalculo.name
        );
        const fileURL = URL.createObjectURL(formData.hojaCalculo);
        downloadFile(fileURL, formData.hojaCalculo.name);
        // Limpiamos la URL después de la descarga
        setTimeout(() => URL.revokeObjectURL(fileURL), 3000);
        toast.success("Descargando hoja de cálculo");
        return;
      }

      // 1. Primero intentamos con la nueva estructura (hoja_calculo separada)
      // Verificar en formData.todosLosArchivos
      if (formData.todosLosArchivos) {
        console.log("Buscando en formData.todosLosArchivos");
        // Si es un objeto con hoja_calculo (nueva estructura)
        if (
          isSeparatedFilesStructure(formData.todosLosArchivos) &&
          formData.todosLosArchivos.hoja_calculo &&
          formData.todosLosArchivos.hoja_calculo.length > 0
        ) {
          const hojaCalculoInfo = formData.todosLosArchivos.hoja_calculo[0];
          if (hojaCalculoInfo && hojaCalculoInfo.attach) {
            console.log(
              "Hoja de cálculo encontrada en estructura separada:",
              hojaCalculoInfo
            );
            // Usar la función de corrección de URL
            let fileUrl = hojaCalculoInfo.attach;
            if (!fileUrl.startsWith("http")) {
              fileUrl = getCorrectMediaUrl(
                `http://127.0.0.1:8000${hojaCalculoInfo.attach}`
              );
            } else {
              fileUrl = getCorrectMediaUrl(fileUrl);
            }
            console.log("URL de descarga:", fileUrl);
            downloadFile(fileUrl, hojaCalculoInfo.name);
            toast.success(`Descargando: ${hojaCalculoInfo.name}`);
            return;
          }
        }

        // Si es un array (estructura mixta)
        if (
          Array.isArray(formData.todosLosArchivos) &&
          formData.todosLosArchivos.length > 0
        ) {
          console.log("Buscando en array de todosLosArchivos");
          // Primero buscar por el campo is_calculation_sheet
          const hojaCalculoPorFlag = formData.todosLosArchivos.find(
            (archivo: any) => archivo.is_calculation_sheet === true
          );

          if (hojaCalculoPorFlag && hojaCalculoPorFlag.attach) {
            console.log(
              "Hoja de cálculo encontrada por flag:",
              hojaCalculoPorFlag
            );
            // Usar la función de corrección de URL
            let fileUrl = hojaCalculoPorFlag.attach;
            if (!fileUrl.startsWith("http")) {
              fileUrl = getCorrectMediaUrl(
                `http://127.0.0.1:8000${hojaCalculoPorFlag.attach}`
              );
            } else {
              fileUrl = getCorrectMediaUrl(fileUrl);
            }
            console.log("URL de descarga:", fileUrl);
            downloadFile(fileUrl, hojaCalculoPorFlag.name);
            toast.success(`Descargando: ${hojaCalculoPorFlag.name}`);
            return;
          }

          // Si no la encontramos por flag, buscar por nombre
          const hojaCalculoArchivo = formData.todosLosArchivos.find(
            (archivo: any) =>
              archivo.name && archivo.name.startsWith("Hoja de Cálculo - ")
          );

          if (hojaCalculoArchivo && hojaCalculoArchivo.attach) {
            console.log(
              "Hoja de cálculo encontrada por nombre:",
              hojaCalculoArchivo
            );
            // Usar la función de corrección de URL
            let fileUrl = hojaCalculoArchivo.attach;
            if (!fileUrl.startsWith("http")) {
              fileUrl = getCorrectMediaUrl(
                `http://127.0.0.1:8000${hojaCalculoArchivo.attach}`
              );
            } else {
              fileUrl = getCorrectMediaUrl(fileUrl);
            }
            console.log("URL de descarga:", fileUrl);
            downloadFile(fileUrl, hojaCalculoArchivo.name);
            toast.success(`Descargando: ${hojaCalculoArchivo.name}`);
            return;
          }
        }
      }

      // 2. Verificar en initialData.todosLosArchivos
      if (initialData && initialData.todosLosArchivos) {
        console.log("Buscando en initialData.todosLosArchivos");
        // Si es un objeto con hoja_calculo (nueva estructura)
        if (
          isSeparatedFilesStructure(initialData.todosLosArchivos) &&
          initialData.todosLosArchivos.hoja_calculo &&
          initialData.todosLosArchivos.hoja_calculo.length > 0
        ) {
          const hojaCalculoInfo = initialData.todosLosArchivos.hoja_calculo[0];
          if (hojaCalculoInfo && hojaCalculoInfo.attach) {
            console.log(
              "Hoja de cálculo encontrada en initialData (estructura separada):",
              hojaCalculoInfo
            );
            // Usar la función de corrección de URL
            let fileUrl = hojaCalculoInfo.attach;
            if (!fileUrl.startsWith("http")) {
              fileUrl = getCorrectMediaUrl(
                `http://127.0.0.1:8000${hojaCalculoInfo.attach}`
              );
            } else {
              fileUrl = getCorrectMediaUrl(fileUrl);
            }
            console.log("URL de descarga:", fileUrl);
            downloadFile(fileUrl, hojaCalculoInfo.name);
            toast.success(`Descargando: ${hojaCalculoInfo.name}`);
            return;
          }
        }

        // Si es un array (estructura mixta)
        if (
          Array.isArray(initialData.todosLosArchivos) &&
          initialData.todosLosArchivos.length > 0
        ) {
          console.log("Buscando en array de initialData.todosLosArchivos");
          // Primero buscar por el campo is_calculation_sheet
          const hojaCalculoPorFlag = initialData.todosLosArchivos.find(
            (archivo: any) => archivo.is_calculation_sheet === true
          );

          if (hojaCalculoPorFlag && hojaCalculoPorFlag.attach) {
            console.log(
              "Hoja de cálculo encontrada por flag en initialData:",
              hojaCalculoPorFlag
            );
            // Usar la función de corrección de URL
            let fileUrl = hojaCalculoPorFlag.attach;
            if (!fileUrl.startsWith("http")) {
              fileUrl = getCorrectMediaUrl(
                `http://127.0.0.1:8000${hojaCalculoPorFlag.attach}`
              );
            } else {
              fileUrl = getCorrectMediaUrl(fileUrl);
            }
            console.log("URL de descarga:", fileUrl);
            downloadFile(fileUrl, hojaCalculoPorFlag.name);
            toast.success(`Descargando: ${hojaCalculoPorFlag.name}`);
            return;
          }

          // Si no la encontramos por flag, buscar por nombre
          const hojaCalculoArchivo = initialData.todosLosArchivos.find(
            (archivo: any) =>
              archivo.name && archivo.name.startsWith("Hoja de Cálculo - ")
          );

          if (hojaCalculoArchivo && hojaCalculoArchivo.attach) {
            console.log(
              "Hoja de cálculo encontrada por nombre en initialData:",
              hojaCalculoArchivo
            );
            // Usar la función de corrección de URL
            let fileUrl = hojaCalculoArchivo.attach;
            if (!fileUrl.startsWith("http")) {
              fileUrl = getCorrectMediaUrl(
                `http://127.0.0.1:8000${hojaCalculoArchivo.attach}`
              );
            } else {
              fileUrl = getCorrectMediaUrl(fileUrl);
            }
            console.log("URL de descarga:", fileUrl);
            downloadFile(fileUrl, hojaCalculoArchivo.name);
            toast.success(`Descargando: ${hojaCalculoArchivo.name}`);
            return;
          }
        }
      }

      // 3. Finalmente usamos hojaCalculo como cadena directa si existe
      const hojaCalculo = formData.hojaCalculo || initialData?.hojaCalculo;
      if (
        hojaCalculo &&
        typeof hojaCalculo === "string" &&
        hojaCalculo.length > 0
      ) {
        console.log("Usando hojaCalculo como cadena directa:", hojaCalculo);
        const filename = hojaCalculo as string;

        // Limpiar el nombre del archivo (reemplazar espacios por guiones bajos)
        const justFileName = filename.split(/[\/\\]/).pop();
        const cleanFileName = justFileName?.replace(/ /g, "_") || filename;

        console.log("Nombre de la hoja de cálculo limpio:", cleanFileName);

        // Usar la función de corrección de URL para el método de respaldo
        const fileUrl = getCorrectMediaUrl(
          `http://127.0.0.1:8000/media/media/${cleanFileName}`
        );

        console.log("URL de descarga:", fileUrl);
        const success = await downloadFile(fileUrl, cleanFileName || filename);
        toast.success(`Descargando: ${cleanFileName || filename}`);

        // Si la descarga falló, intentar con ruta alternativa
        if (!success) {
          console.log("Primer intento fallido, probando con ruta alternativa");
          const altFileUrl = getCorrectMediaUrl(
            `http://127.0.0.1:8000/media/${cleanFileName}`
          );
          console.log("URL alternativa:", altFileUrl);
          await downloadFile(altFileUrl, cleanFileName || filename);
        }
        return;
      }

      console.log("No se encontró ninguna hoja de cálculo para descargar");
      toast.error("No se encontró ninguna hoja de cálculo para descargar");
    } catch (error) {
      console.error("Error al descargar la hoja de cálculo:", error);
      toast.error("Error al descargar la hoja de cálculo. Intente nuevamente.");
    }
  };

  // Función para determinar si un campo debe estar en modo de solo lectura
  // Modificar esta función en AdminNuevaOfertaForm.tsx
  const isFieldReadOnly = (step: number, fieldName?: string): boolean => {
    // Si estamos en modo edición (isReadOnly=false) o en el Step 1, todos los campos son editables
    if (!isReadOnly || step === 1) return false;

    // Permitir edición de archivos en todos los casos
    if (fieldName === "hojaCalculo" || fieldName === "archivosAdjuntos")
      return false;

    // En el paso 4, si editableStep4 es true, los campos son editables
    if (step === 4 && editableStep4) return false;

    // En cualquier otro caso en modo isReadOnly, los campos son de solo lectura
    return true;
  };

  // Renderizar el indicador de pasos
  const renderStepIndicator = () => {
    const steps = [
      { name: "Información general", number: 1 },
      { name: "Detalles técnicos", number: 2 },
      { name: "Oferta económica", number: 3 },
      { name: "Información cotización", number: 4 },
    ];

    return (
      <div className="px-6 pt-4 pb-2">
        <div className="relative flex justify-between mb-6 z-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex flex-col items-center relative z-10 ${
                isReadOnly && step.number < 4 ? "opacity-50" : ""
              }`}
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
            <div
              className={`h-0.5 flex-1 ${
                currentStep > 3 ? "bg-[#4178D4]" : "bg-gray-300"
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
                Complete la información del cliente para la nueva cotización
              </p>
            </div>
            {!isReadOnly && !initialData && !visitaTecnicaData && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-[#34509F] mb-3">
                  Seleccionar Visita Técnica
                </h4>
                <div className="relative">
                  <select
                    id="visitaTecnica"
                    name="visitaTecnica"
                    value={selectedVisit || ""}
                    onChange={handleVisitSelection}
                    disabled={isLoadingVisits}
                    className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all duration-300 appearance-none"
                  >
                    <option value="">Seleccionar visita técnica</option>
                    {Array.isArray(userVisits) &&
                      userVisits.map((visit) => (
                        <option key={visit.id} value={visit.id}>
                          {`${visit.code || ""} - ${visit.name || ""} ${
                            visit.last_name || ""
                          } (${visit.N_identification || ""})`}
                        </option>
                      ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                  {isLoadingVisits && (
                    <div className="absolute top-0 right-12 h-full flex items-center">
                      <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#4178D4]"></span>
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Selecciona una visita técnica para cargar automáticamente los
                  datos del cliente.
                </p>
              </div>
            )}
            {/* Tipo de identificación y número */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div className="transition-all duration-300 hover:shadow-md rounded-lg p-0.5">
                <label
                  htmlFor="type_identification"
                  className="block font-medium text-gray-700 mb-1.5"
                >
                  Tipo de identificación<span className="text-red-500">*</span>
                </label>
                <select
                  id="type_identification"
                  name="type_identification"
                  value={formData.type_identification}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] transition-colors"
                  disabled={isFieldReadOnly(1)}
                >
                  <option value="C.C">C.C - Cédula de Ciudadanía</option>
                  <option value="NIT">
                    NIT - Número de Identificación Tributaria
                  </option>
                </select>
              </div>

              <div className="transition-all duration-300 hover:shadow-md rounded-lg p-0.5">
                <label
                  htmlFor="identification"
                  className="block font-medium text-gray-700 mb-1.5"
                >
                  Número de identificación
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="identification"
                  name="identification"
                  type="text"
                  value={formData.identification}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] transition-colors"
                  disabled={isFieldReadOnly(1)}
                  required
                />
              </div>
            </div>
            {/* Nombres */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div className="transition-all duration-300 hover:shadow-md rounded-lg p-0.5">
                <label
                  htmlFor="firs_name"
                  className="block font-medium text-gray-700 mb-1.5"
                >
                  Primer nombre<span className="text-red-500">*</span>
                </label>
                <input
                  id="firs_name"
                  name="firs_name"
                  type="text"
                  value={formData.firs_name}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] transition-colors"
                  disabled={isFieldReadOnly(1)}
                  required
                />
              </div>

              <div className="transition-all duration-300 hover:shadow-md rounded-lg p-0.5">
                <label
                  htmlFor="other_name"
                  className="block font-medium text-gray-700 mb-1.5"
                >
                  Segundo nombre
                </label>
                <input
                  id="other_name"
                  name="other_name"
                  type="text"
                  value={formData.other_name || ""}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] transition-colors"
                  disabled={isFieldReadOnly(1)}
                />
              </div>
            </div>
            {/* Apellidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div className="transition-all duration-300 hover:shadow-md rounded-lg p-0.5">
                <label
                  htmlFor="last_name"
                  className="block font-medium text-gray-700 mb-1.5"
                >
                  Primer apellido<span className="text-red-500">*</span>
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] transition-colors"
                  disabled={isFieldReadOnly(1)}
                  required
                />
              </div>

              <div className="transition-all duration-300 hover:shadow-md rounded-lg p-0.5">
                <label
                  htmlFor="secon_surname"
                  className="block font-medium text-gray-700 mb-1.5"
                >
                  Segundo apellido<span className="text-red-500">*</span>
                </label>
                <input
                  id="secon_surname"
                  name="secon_surname"
                  type="text"
                  value={formData.secon_surname}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] transition-colors"
                  disabled={isFieldReadOnly(1)}
                  required
                />
              </div>
            </div>
            {/* Representante (para NIT) y Dirección */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div className="transition-all duration-300 hover:shadow-md rounded-lg p-0.5">
                <label
                  htmlFor="representante"
                  className="block font-medium text-gray-700 mb-1.5"
                >
                  Representante{" "}
                  {formData.type_identification === "NIT" ? (
                    <span className="text-red-500">*</span>
                  ) : (
                    ""
                  )}
                </label>
                <input
                  id="representante"
                  name="representante"
                  type="text"
                  value={formData.representante || ""}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] transition-colors"
                  disabled={isFieldReadOnly(1)}
                />
              </div>
              <div className="transition-all duration-300 hover:shadow-md rounded-lg p-0.5">
                <label
                  htmlFor="addres"
                  className="block font-medium text-gray-700 mb-1.5"
                >
                  Dirección<span className="text-red-500">*</span>
                </label>
                <input
                  id="addres"
                  name="addres"
                  type="text"
                  value={formData.addres}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] transition-colors"
                  disabled={isFieldReadOnly(1)}
                  required
                />
              </div>
            </div>
            {/* Teléfonos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div className="transition-all duration-300 hover:shadow-md rounded-lg p-0.5">
                <label
                  htmlFor="phone"
                  className="block font-medium text-gray-700 mb-1.5"
                >
                  Teléfono<span className="text-red-500">*</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="text"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] transition-colors"
                  disabled={isFieldReadOnly(1)}
                  required
                />
              </div>
              <div className="transition-all duration-300 hover:shadow-md rounded-lg p-0.5">
                <label
                  htmlFor="phone_2"
                  className="block font-medium text-gray-700 mb-1.5"
                >
                  Teléfono secundario
                </label>
                <input
                  id="phone_2"
                  name="phone_2"
                  type="text"
                  value={formData.phone_2 || ""}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] transition-colors"
                  disabled={isFieldReadOnly(1)}
                />
              </div>
            </div>
            {/* Departamento y Ciudad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div className="transition-all duration-300 hover:shadow-md rounded-lg p-0.5">
                <label
                  htmlFor="departamento"
                  className="block font-medium text-gray-700 mb-1.5"
                >
                  Departamento<span className="text-red-500">*</span>
                </label>
                <select
                  id="departamento"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] transition-colors"
                  disabled={isFieldReadOnly(1)}
                >
                  <option value="">Seleccione un departamento</option>
                  {colombiaData.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="transition-all duration-300 hover:shadow-md rounded-lg p-0.5">
                <label
                  htmlFor="ciudad"
                  className="block font-medium text-gray-700 mb-1.5"
                >
                  Ciudad<span className="text-red-500">*</span>
                </label>
                <select
                  id="ciudad"
                  name="ciudad"
                  value={formData.ciudad}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] transition-colors"
                  disabled={isFieldReadOnly(1) || !selectedDepartment}
                >
                  <option value="">Seleccione una ciudad</option>
                  {availableCities.map((city) => (
                    <option key={city.id} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Información del proyecto */}
            <div className="mt-8 mb-6 pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-[#4178D4] text-white rounded-full text-xs mr-2">
                  +
                </span>
                INFORMACIÓN DEL PROYECTO
              </h3>
            </div>
            {/* Tipo de proyecto y fecha inicio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
              <div className="transition-all duration-300 hover:shadow-md rounded-lg p-0.5">
                <label
                  htmlFor="tipoProyecto"
                  className="block font-medium text-gray-700 mb-1.5"
                >
                  Tipo de proyecto<span className="text-red-500">*</span>
                </label>
                <select
                  id="tipoProyecto"
                  name="tipoProyecto"
                  value={formData.tipoProyecto}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] transition-colors"
                  disabled={isFieldReadOnly(1)}
                >
                  <option value="">Seleccione un tipo</option>
                  <option value="Publico">Público</option>
                  <option value="Privado">Privado</option>
                </select>
              </div>
              <div className="transition-all duration-300 hover:shadow-md rounded-lg p-0.5">
                <label
                  htmlFor="fechaInicio"
                  className="block font-medium text-gray-700 mb-1.5"
                >
                  Fecha de inicio<span className="text-red-500">*</span>
                </label>
                <input
                  id="fechaInicio"
                  name="fechaInicio"
                  type="date"
                  value={formData.fechaInicio}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] transition-colors"
                  disabled={isFieldReadOnly(1)}
                  required
                />{" "}
              </div>
            </div>{" "}
            {/* Fecha Visita Comercial */}
            <div className="mb-6">
              <div className="transition-all duration-300 hover:shadow-md rounded-lg p-0.5">
                <label
                  htmlFor="fechaVisitaComercial"
                  className="block font-medium text-gray-700 mb-1.5"
                >
                  Fecha visita comercial
                </label>
                <input
                  id="fechaVisitaComercial"
                  name="fechaVisitaComercial"
                  type="date"
                  value={formData.fechaVisitaComercial}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] transition-colors"
                  disabled={isFieldReadOnly(1)}
                />
              </div>
            </div>
            {/* Descripción */}
            <div className="mb-6">
              <label
                htmlFor="descripcion"
                className="block font-medium text-gray-700 mb-1.5"
              >
                Propuesta de servicios
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] transition-colors min-h-[100px]"
                disabled={isFieldReadOnly(1)}
              />
            </div>
            <div className="bg-gray-50 rounded-lg p-5 mb-6">
              <h4 className="font-semibold text-gray-800 mb-3">
                Representante y Cotizador
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="representante"
                    className="block mb-1.5 font-medium text-gray-700"
                  >
                    Nombre del representante
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="representante"
                    name="representante"
                    type="text"
                    required
                    value={formData.representante}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Nombre completo del representante"
                    className="w-full p-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all"
                    readOnly={isFieldReadOnly(1)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="cotizador"
                    className="block mb-1.5 font-medium text-gray-700"
                  >
                    Nombre del cotizador
                    <span className="text-red-500">*</span>
                    {isReadOnly && (
                      <span className="ml-2 text-xs font-normal bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        Editable
                      </span>
                    )}
                  </label>
                  <input
                    id="cotizador"
                    name="cotizador"
                    type="text"
                    required
                    value={formData.cotizador}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Nombre del cotizador"
                    className={`w-full p-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all ${
                      isReadOnly ? "border-blue-300" : ""
                    }`}
                    readOnly={isFieldReadOnly(1, "cotizador")}
                  />
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
                DETALLES TÉCNICOS
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Complete los detalles técnicos de la instalación
              </p>
            </div>
            {/* Tipo de sistema y Potencia */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5 hover:shadow-md transition-all">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="tipoSistema"
                    className="block mb-1.5 font-medium text-gray-700"
                  >
                    Tipo de sistema (On-grid/Off-grid/Híbrido)
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="tipoSistema"
                    name="tipoSistema"
                    required
                    value={formData.tipoSistema}
                    onChange={handleChange}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all"
                    disabled={isFieldReadOnly(2)}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="On-grid">On-grid (Conectado a red)</option>
                    <option value="Off-grid">Off-grid (Aislado)</option>
                    <option value="Híbrido">Híbrido</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="potenciaKw"
                    className="block mb-1.5 font-medium text-gray-700"
                  >
                    Potencia requerida (kW)
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="potenciaKw"
                      name="potenciaKw"
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.potenciaKw || ""}
                      onChange={handleNumberChange}
                      onKeyDown={handleKeyDown}
                      placeholder="0.00"
                      className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all"
                      readOnly={isFieldReadOnly(2)}
                    />
                    <Zap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
            {/* Tipo de paneles y producción energética */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5 hover:shadow-md transition-all">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="tipoPotenciaPaneles"
                    className="block mb-1.5 font-medium text-gray-700"
                  >
                    Tipo y potencia de paneles (W)
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="tipoPotenciaPaneles"
                    name="tipoPotenciaPaneles"
                    type="text"
                    required
                    value={formData.tipoPotenciaPaneles}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ej: Monocristalino 450W"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all"
                    readOnly={isFieldReadOnly(2)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="produccionEnergetica"
                    className="block mb-1.5 font-medium text-gray-700"
                  >
                    Producción energética (kWh)
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="produccionEnergetica"
                    name="produccionEnergetica"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.produccionEnergetica || ""}
                    onChange={handleNumberChange}
                    onKeyDown={handleKeyDown}
                    placeholder="0.00"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all"
                    readOnly={isFieldReadOnly(2)}
                  />
                </div>
              </div>
            </div>
            {/* Detalles de la instalación */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5 hover:shadow-md transition-all">
              <h4 className="font-semibold text-gray-800 mb-4">
                Detalles de la instalación
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="cantidadPaneles"
                    className="block mb-1.5 font-medium text-gray-700"
                  >
                    Cantidad de paneles<span className="text-red-500">*</span>
                  </label>
                  <input
                    id="cantidadPaneles"
                    name="cantidadPaneles"
                    type="number"
                    min="0"
                    required
                    value={formData.cantidadPaneles || ""}
                    onChange={handleNumberChange}
                    onKeyDown={handleKeyDown}
                    placeholder="0"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all"
                    readOnly={isFieldReadOnly(2)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="areaNecesaria"
                    className="block mb-1.5 font-medium text-gray-700"
                  >
                    Área necesaria (m²)<span className="text-red-500">*</span>
                  </label>
                  <input
                    id="areaNecesaria"
                    name="areaNecesaria"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.areaNecesaria || ""}
                    onChange={handleNumberChange}
                    onKeyDown={handleKeyDown}
                    placeholder="0.00"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all"
                    readOnly={isFieldReadOnly(2)}
                  />
                </div>
              </div>
            </div>
            {/* Tipo de instalación */}
            <div className="bg-blue-50 rounded-lg p-5 mb-6">
              <h4 className="font-semibold text-[#34509F] mb-3">
                Tipo de instalación
              </h4>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="instalacionTejado"
                    name="tipoInstalacion"
                    value="Tejado"
                    checked={formData.tipoInstalacion === "Tejado"}
                    onChange={handleChange}
                    className="appearance-none w-4 h-4 rounded-full border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
                    disabled={isFieldReadOnly(2)}
                  />
                  <label
                    htmlFor="instalacionTejado"
                    className="ml-2 font-medium"
                  >
                    Tejado
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="instalacionSuelo"
                    name="tipoInstalacion"
                    value="Suelo"
                    checked={formData.tipoInstalacion === "Suelo"}
                    onChange={handleChange}
                    className="appearance-none w-4 h-4 rounded-full border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
                    disabled={isFieldReadOnly(2)}
                  />
                  <label
                    htmlFor="instalacionSuelo"
                    className="ml-2 font-medium"
                  >
                    Suelo
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="instalacionPergola"
                    name="tipoInstalacion"
                    value="Pérgola"
                    checked={formData.tipoInstalacion === "Pérgola"}
                    onChange={handleChange}
                    className="appearance-none w-4 h-4 rounded-full border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
                    disabled={isFieldReadOnly(2)}
                  />
                  <label
                    htmlFor="instalacionPergola"
                    className="ml-2 font-medium"
                  >
                    Pérgola
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="instalacionOtro"
                    name="tipoInstalacion"
                    value="Otro"
                    checked={formData.tipoInstalacion === "Otro"}
                    onChange={handleChange}
                    className="appearance-none w-4 h-4 rounded-full border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
                    disabled={isFieldReadOnly(2)}
                  />
                  <label htmlFor="instalacionOtro" className="ml-2 font-medium">
                    Otro
                  </label>
                </div>
              </div>
            </div>{" "}
            {/* Equipamiento incluido */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5 hover:shadow-md transition-all">
              <h4 className="font-semibold text-gray-800 mb-4">
                Equipamiento incluido
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Primera columna */}
                <div className="space-y-2">
                  {/* Paneles solares */}
                  <div className="flex items-center justify-between gap-4 p-2 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="panelesSolares"
                        name="panelesSolares"
                        checked={formData.equipamiento.panelesSolares}
                        onChange={handleEquipmentChange}
                        className="appearance-none w-4 h-4 rounded border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
                        disabled={isFieldReadOnly(2)}
                      />
                      <label htmlFor="panelesSolares" className="ml-2">
                        Paneles solares
                      </label>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">$</span>
                      <input
                        type="text"
                        name="preciosPanelesSolares"
                        value={
                          formData.equipamiento.preciosPanelesSolares
                            ? formatNumber(
                                formData.equipamiento.preciosPanelesSolares
                              )
                            : ""
                        }
                        onChange={handlePriceChange}
                        placeholder="0"
                        className="w-32 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent"
                        disabled={
                          !formData.equipamiento.panelesSolares ||
                          isFieldReadOnly(2)
                        }
                      />
                    </div>
                  </div>

                  {/* Estructuras de montaje */}
                  <div className="flex items-center justify-between gap-4 p-2 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="estructurasMontaje"
                        name="estructurasMontaje"
                        checked={formData.equipamiento.estructurasMontaje}
                        onChange={handleEquipmentChange}
                        className="appearance-none w-4 h-4 rounded border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
                        disabled={isFieldReadOnly(2)}
                      />
                      <label htmlFor="estructurasMontaje" className="ml-2">
                        Estructuras de montaje
                      </label>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">$</span>
                      <input
                        type="text"
                        name="preciosEstructurasMontaje"
                        value={
                          formData.equipamiento.preciosEstructurasMontaje
                            ? formatNumber(
                                formData.equipamiento.preciosEstructurasMontaje
                              )
                            : ""
                        }
                        onChange={handlePriceChange}
                        placeholder="0"
                        className="w-32 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent"
                        disabled={
                          !formData.equipamiento.estructurasMontaje ||
                          isFieldReadOnly(2)
                        }
                      />
                    </div>
                  </div>

                  {/* Cableado y gabinete */}
                  <div className="flex items-center justify-between gap-4 p-2 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="cableadoGabinete"
                        name="cableadoGabinete"
                        checked={formData.equipamiento.cableadoGabinete}
                        onChange={handleEquipmentChange}
                        className="appearance-none w-4 h-4 rounded border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
                        disabled={isFieldReadOnly(2)}
                      />
                      <label htmlFor="cableadoGabinete" className="ml-2">
                        Cableado y gabinete
                      </label>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">$</span>
                      <input
                        type="text"
                        name="preciosCableadoGabinete"
                        value={
                          formData.equipamiento.preciosCableadoGabinete
                            ? formatNumber(
                                formData.equipamiento.preciosCableadoGabinete
                              )
                            : ""
                        }
                        onChange={handlePriceChange}
                        placeholder="0"
                        className="w-32 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent"
                        disabled={
                          !formData.equipamiento.cableadoGabinete ||
                          isFieldReadOnly(2)
                        }
                      />
                    </div>
                  </div>

                  {/* Legalización y diseños */}
                  <div className="flex items-center justify-between gap-4 p-2 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="legalizacionDisenos"
                        name="legalizacionDisenos"
                        checked={formData.equipamiento.legalizacionDisenos}
                        onChange={handleEquipmentChange}
                        className="appearance-none w-4 h-4 rounded border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
                        disabled={isFieldReadOnly(2)}
                      />
                      <label htmlFor="legalizacionDisenos" className="ml-2">
                        Legalización y diseños
                      </label>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">$</span>
                      <input
                        type="text"
                        name="preciosLegalizacionDisenos"
                        value={
                          formData.equipamiento.preciosLegalizacionDisenos
                            ? formatNumber(
                                formData.equipamiento.preciosLegalizacionDisenos
                              )
                            : ""
                        }
                        onChange={handlePriceChange}
                        placeholder="0"
                        className="w-32 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent"
                        disabled={
                          !formData.equipamiento.legalizacionDisenos ||
                          isFieldReadOnly(2)
                        }
                      />
                    </div>
                  </div>

                  {/* Batería */}
                  <div className="flex items-center justify-between gap-4 p-2 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="bateria"
                        name="bateria"
                        checked={formData.equipamiento.bateria}
                        onChange={handleEquipmentChange}
                        className="appearance-none w-4 h-4 rounded border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
                        disabled={isFieldReadOnly(2)}
                      />
                      <label htmlFor="bateria" className="ml-2">
                        Batería
                      </label>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">$</span>
                      <input
                        type="text"
                        name="preciosBateria"
                        value={
                          formData.equipamiento.preciosBateria
                            ? formatNumber(formData.equipamiento.preciosBateria)
                            : ""
                        }
                        onChange={handlePriceChange}
                        placeholder="0"
                        className="w-32 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent"
                        disabled={
                          !formData.equipamiento.bateria || isFieldReadOnly(2)
                        }
                      />
                    </div>
                  </div>

                  {/* Inversor */}
                  <div className="flex items-center justify-between gap-4 p-2 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="inversor"
                        name="inversor"
                        checked={formData.equipamiento.inversor}
                        onChange={handleEquipmentChange}
                        className="appearance-none w-4 h-4 rounded border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
                        disabled={isFieldReadOnly(2)}
                      />
                      <label htmlFor="inversor" className="ml-2 whitespace-nowrap">
                        Inversores/Microinversores
                      </label>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">$</span>
                      <input
                        type="text"
                        name="preciosInversor"
                        value={
                          formData.equipamiento.preciosInversor
                            ? formatNumber(
                                formData.equipamiento.preciosInversor
                              )
                            : ""
                        }
                        onChange={handlePriceChange}
                        placeholder="0"
                        className="w-32 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent"
                        disabled={
                          !formData.equipamiento.inversor || isFieldReadOnly(2)
                        }
                      />
                    </div>
                  </div>

                  {/* Kit 5kw */}
                  <div className="flex items-center justify-between gap-4 p-2 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="kit5kw"
                        name="kit5kw"
                        checked={formData.equipamiento.kit5kw}
                        onChange={handleEquipmentChange}
                        className="appearance-none w-4 h-4 rounded border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
                        disabled={isFieldReadOnly(2)}
                      />
                      <label htmlFor="kit5kw" className="ml-2">
                        Kit 5kw
                      </label>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">$</span>
                      <input
                        type="text"
                        name="preciosKit5kw"
                        value={
                          formData.equipamiento.preciosKit5kw
                            ? formatNumber(formData.equipamiento.preciosKit5kw)
                            : ""
                        }
                        onChange={handlePriceChange}
                        placeholder="0"
                        className="w-32 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent"
                        disabled={
                          !formData.equipamiento.kit5kw || isFieldReadOnly(2)
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Segunda columna */}
                <div className="space-y-2">
                  {/* Kit 8kw */}
                  <div className="flex items-center justify-between gap-4 p-2 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="kit8kw"
                        name="kit8kw"
                        checked={formData.equipamiento.kit8kw}
                        onChange={handleEquipmentChange}
                        className="appearance-none w-4 h-4 rounded border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
                        disabled={isFieldReadOnly(2)}
                      />
                      <label htmlFor="kit8kw" className="ml-2">
                        Kit 8kw
                      </label>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">$</span>
                      <input
                        type="text"
                        name="preciosKit8kw"
                        value={
                          formData.equipamiento.preciosKit8kw
                            ? formatNumber(formData.equipamiento.preciosKit8kw)
                            : ""
                        }
                        onChange={handlePriceChange}
                        placeholder="0"
                        className="w-32 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent"
                        disabled={
                          !formData.equipamiento.kit8kw || isFieldReadOnly(2)
                        }
                      />
                    </div>
                  </div>

                  {/* Kit 12kw */}
                  <div className="flex items-center justify-between gap-4 p-2 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="kit12kw"
                        name="kit12kw"
                        checked={formData.equipamiento.kit12kw}
                        onChange={handleEquipmentChange}
                        className="appearance-none w-4 h-4 rounded border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
                        disabled={isFieldReadOnly(2)}
                      />
                      <label htmlFor="kit12kw" className="ml-2">
                        Kit 12kw
                      </label>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">$</span>
                      <input
                        type="text"
                        name="preciosKit12kw"
                        value={
                          formData.equipamiento.preciosKit12kw
                            ? formatNumber(formData.equipamiento.preciosKit12kw)
                            : ""
                        }
                        onChange={handlePriceChange}
                        placeholder="0"
                        className="w-32 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent"
                        disabled={
                          !formData.equipamiento.kit12kw || isFieldReadOnly(2)
                        }
                      />
                    </div>
                  </div>

                  {/* Kit 15kw */}
                  <div className="flex items-center justify-between gap-4 p-2 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="kit15kw"
                        name="kit15kw"
                        checked={formData.equipamiento.kit15kw}
                        onChange={handleEquipmentChange}
                        className="appearance-none w-4 h-4 rounded border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
                        disabled={isFieldReadOnly(2)}
                      />
                      <label htmlFor="kit15kw" className="ml-2">
                        Kit 15kw
                      </label>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">$</span>
                      <input
                        type="text"
                        name="preciosKit15kw"
                        value={
                          formData.equipamiento.preciosKit15kw
                            ? formatNumber(formData.equipamiento.preciosKit15kw)
                            : ""
                        }
                        onChange={handlePriceChange}
                        placeholder="0"
                        className="w-32 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent"
                        disabled={
                          !formData.equipamiento.kit15kw || isFieldReadOnly(2)
                        }
                      />
                    </div>
                  </div>

                  {/* Kit 30kw */}
                  <div className="flex items-center justify-between gap-4 p-2 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="kit30kw"
                        name="kit30kw"
                        checked={formData.equipamiento.kit30kw}
                        onChange={handleEquipmentChange}
                        className="appearance-none w-4 h-4 rounded border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
                        disabled={isFieldReadOnly(2)}
                      />
                      <label htmlFor="kit30kw" className="ml-2">
                        Kit 30kw
                      </label>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">$</span>
                      <input
                        type="text"
                        name="preciosKit30kw"
                        value={
                          formData.equipamiento.preciosKit30kw
                            ? formatNumber(formData.equipamiento.preciosKit30kw)
                            : ""
                        }
                        onChange={handlePriceChange}
                        placeholder="0"
                        className="w-32 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent"
                        disabled={
                          !formData.equipamiento.kit30kw || isFieldReadOnly(2)
                        }
                      />
                    </div>
                  </div>

                  {/* Transporte */}
                  <div className="flex items-center justify-between gap-4 p-2 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="transporte"
                        name="transporte"
                        checked={formData.equipamiento.transporte}
                        onChange={handleEquipmentChange}
                        className="appearance-none w-4 h-4 rounded border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
                        disabled={isFieldReadOnly(2)}
                      />
                      <label htmlFor="transporte" className="ml-2">
                        Transporte
                      </label>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">$</span>
                      <input
                        type="text"
                        name="preciosTransporte"
                        value={
                          formData.equipamiento.preciosTransporte
                            ? formatNumber(
                                formData.equipamiento.preciosTransporte
                              )
                            : ""
                        }
                        onChange={handlePriceChange}
                        placeholder="0"
                        className="w-32 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent"
                        disabled={
                          !formData.equipamiento.transporte ||
                          isFieldReadOnly(2)
                        }
                      />
                    </div>
                  </div>

                  {/* Mano de obra */}
                  <div className="flex items-center justify-between gap-4 p-2 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="manoDeObra"
                        name="manoDeObra"
                        checked={formData.equipamiento.manoDeObra}
                        onChange={handleEquipmentChange}
                        className="appearance-none w-4 h-4 rounded border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
                        disabled={isFieldReadOnly(2)}
                      />
                      <label htmlFor="manoDeObra" className="ml-2">
                        Mano de obra
                      </label>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">$</span>
                      <input
                        type="text"
                        name="preciosManoDeObra"
                        value={
                          formData.equipamiento.preciosManoDeObra
                            ? formatNumber(
                                formData.equipamiento.preciosManoDeObra
                              )
                            : ""
                        }
                        onChange={handlePriceChange}
                        placeholder="0"
                        className="w-32 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent"
                        disabled={
                          !formData.equipamiento.manoDeObra ||
                          isFieldReadOnly(2)
                        }
                      />
                    </div>
                  </div>
                  
                  {/* Microinversores */}
                  <div className="flex items-center justify-between gap-4 p-2 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="microinversores"
                        name="microinversores"
                        checked={formData.equipamiento.microinversores}
                        onChange={handleEquipmentChange}
                        className="appearance-none w-4 h-4 rounded border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all"
                        disabled={isFieldReadOnly(2)}
                      />
                      <label htmlFor="microinversores" className="ml-2">
                        Otros conceptos
                      </label>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">$</span>
                      <input
                        type="text"
                        name="preciosMicroinversores"
                        value={
                          formData.equipamiento.preciosMicroinversores
                            ? formatNumber(
                                formData.equipamiento.preciosMicroinversores
                              )
                            : ""
                        }
                        onChange={handlePriceChange}
                        placeholder="0"
                        className="w-32 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent"
                        disabled={
                          !formData.equipamiento.microinversores ||
                          isFieldReadOnly(2)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>{" "}
            {/* Documentación */}
            <div className="bg-gray-50 rounded-lg p-5 mb-6">
              <h4 className="font-semibold text-[#34509F] mb-3">
                Documentación
              </h4>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="hojaCalculo"
                    className="block mb-1.5 font-medium text-gray-700"
                  >
                    Hoja de cálculo
                  </label>
                  <div className="flex flex-col gap-3">
                    {/* Botón para subir nueva hoja de cálculo - siempre disponible en edición */}
                    <label
                      htmlFor="hojaCalculo"
                      className={`inline-flex items-center gap-2 px-4 py-2 border rounded-md 
            ${
              isFieldReadOnly(2, "hojaCalculo")
                ? "border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed"
                : "border-[#4178D4] bg-white text-[#4178D4] hover:bg-blue-50 cursor-pointer"
            } max-w-fit`}
                    >
                      <DownloadCloud className="w-4 h-4" />
                      <span>Subir hoja de cálculo</span>
                    </label>

                    <input
                      id="hojaCalculo"
                      name="hojaCalculo"
                      type="file"
                      className="hidden"
                      disabled={isFieldReadOnly(2, "hojaCalculo")}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];

                          setFormData((prev) => ({
                            ...prev,
                            hojaCalculo: file,
                          }));
                        }
                      }}
                    />

                    {/* Mostrar hoja de cálculo actual */}
                    {(formData.hojaCalculo ||
                      (formData.todosLosArchivos &&
                        ((isSeparatedFilesStructure(
                          formData.todosLosArchivos
                        ) &&
                          formData.todosLosArchivos.hoja_calculo?.length) ||
                          (Array.isArray(formData.todosLosArchivos) &&
                            formData.todosLosArchivos.some(
                              (a) =>
                                a.is_calculation_sheet ||
                                (a.name &&
                                  a.name.startsWith("Hoja de Cálculo - "))
                            ))))) && (
                      <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="text-green-700 w-5 h-5" />
                          <span className="text-sm font-medium">
                            {formData.hojaCalculo instanceof File
                              ? formData.hojaCalculo.name
                              : typeof formData.hojaCalculo === "string"
                              ? formData.hojaCalculo
                              : "Hoja de cálculo"}
                          </span>
                        </div>

                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              console.log(
                                "Click en botón descargar hoja de cálculo"
                              );
                              console.log("hojaCalculo:", formData.hojaCalculo);
                              console.log(
                                "todosLosArchivos:",
                                formData.todosLosArchivos
                              );
                              handleDownloadHojaCalculo().catch((err) => {
                                console.error(
                                  "Error al descargar hoja de cálculo:",
                                  err
                                );
                                toast.error(
                                  "Error al descargar la hoja de cálculo"
                                );
                              });
                            }}
                            className="p-1.5 hover:bg-blue-50 rounded-md text-blue-600"
                            title="Descargar hoja de cálculo"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {!isFieldReadOnly(2, "hojaCalculo") && (
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  hojaCalculo: "",
                                }))
                              }
                              className="p-1.5 hover:bg-red-50 rounded-md text-red-500"
                              title="Eliminar hoja de cálculo"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Mensaje cuando no hay hoja de cálculo */}
                    {!formData.hojaCalculo &&
                      !(
                        formData.todosLosArchivos &&
                        ((isSeparatedFilesStructure(
                          formData.todosLosArchivos
                        ) &&
                          formData.todosLosArchivos.hoja_calculo?.length) ||
                          (Array.isArray(formData.todosLosArchivos) &&
                            formData.todosLosArchivos.some(
                              (a) =>
                                a.is_calculation_sheet ||
                                (a.name &&
                                  a.name.startsWith("Hoja de Cálculo - "))
                            )))
                      ) && (
                        <p className="text-xs text-gray-500 italic">
                          No hay hoja de cálculo adjunta
                        </p>
                      )}
                  </div>
                </div>
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
                OFERTA ECONÓMICA
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Complete la información económica y condiciones de la oferta
              </p>
            </div>
            {/* Valor total */}
            {/* Valor total */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5 hover:shadow-md transition-all">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="font-medium text-gray-800 flex items-center">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-[#4178D4] text-white rounded-full text-xs mr-2">
                      1
                    </span>
                    Valor total de la oferta
                  </p>
                  <p className="text-sm text-gray-500">
                    Indique el valor total en pesos colombianos (COP)
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="valorTotal"
                    className="block mb-1.5 font-medium text-gray-700"
                  >
                    Valor total (COP)<span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="valorTotal"
                      name="valorTotal"
                      type="text"
                      required
                      value={
                        formData.valorTotal
                          ? formatNumber(formData.valorTotal)
                          : ""
                      }
                      onChange={handleNumberChange}
                      onKeyDown={handleKeyDown}
                      placeholder="0"
                      className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all"
                      readOnly={isFieldReadOnly(3)}
                    />
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
            {/* Plazos y condiciones */}
            <div className="bg-blue-50 rounded-lg p-5 mb-6">
              <h4 className="font-semibold text-[#34509F] mb-3">
                Plazos y condiciones
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="plazoEntrega"
                    className="block mb-1.5 font-medium text-gray-700"
                  >
                    Plazo de entrega (días)
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="plazoEntrega"
                    name="plazoEntrega"
                    type="number"
                    min="1"
                    required
                    value={formData.plazoEntrega || ""}
                    onChange={handleNumberChange}
                    onKeyDown={handleKeyDown}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all"
                    readOnly={isFieldReadOnly(3)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="validezOferta"
                    className="block mb-1.5 font-medium text-gray-700"
                  >
                    Validez oferta (días)<span className="text-red-500">*</span>
                  </label>
                  <input
                    id="validezOferta"
                    name="validezOferta"
                    type="number"
                    min="1"
                    required
                    value={formData.validezOferta || ""}
                    onChange={handleNumberChange}
                    onKeyDown={handleKeyDown}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all"
                    readOnly={isFieldReadOnly(3)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="garantia"
                    className="block mb-1.5 font-medium text-gray-700"
                  >
                    Garantía<span className="text-red-500">*</span>
                  </label>
                  <input
                    id="garantia"
                    name="garantia"
                    type="text"
                    required
                    value={formData.garantia}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ej: 5 años equipos, 1 año instalación"
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all"
                    readOnly={isFieldReadOnly(3)}
                  />
                </div>
              </div>
            </div>
            {/* Forma de pago */}
            <div className="mb-6">
              <label
                htmlFor="formaPago"
                className="block mb-1.5 font-medium text-gray-700"
              >
                Forma de pago<span className="text-red-500">*</span>
              </label>
              <select
                id="formaPago"
                name="formaPago"
                required
                value={formData.formaPago}
                onChange={handleChange}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all"
                disabled={isFieldReadOnly(3)}
              >
                <option value="">Seleccionar...</option>
                <option value="50%,30%,20%">50%, 30%, 20%</option>
                <option value="50%,50%">50%, 50%</option>
                <option value="Personalizado en observaciones">
                  Personalizado en observaciones
                </option>
              </select>
            </div>
            {/* Observaciones adicionales */}
            <div className="mb-6">
              <label
                htmlFor="observaciones"
                className="block mb-1.5 font-medium text-gray-700"
              >
                Resumen del proyecto
              </label>
              <textarea
                id="observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Agregue cualquier observación o condición adicional para la oferta"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all min-h-[120px] resize-none"
                readOnly={isFieldReadOnly(3)}
              />
            </div>{" "}
            {/* Archivos adjuntos */}
            <div className="bg-gray-50 rounded-lg p-5 mb-6">
              <h4 className="font-semibold text-[#34509F] mb-3">
                Archivos adjuntos
              </h4>
              <div className="flex flex-col gap-3">
                <input
                  type="file"
                  id="archivosAdjuntos"
                  multiple
                  onChange={handleFileChange}
                  disabled={isFieldReadOnly(3, "archivosAdjuntos")}
                  className="hidden"
                />

                {/* Botón para adjuntar archivos - siempre disponible en edición */}
                <label
                  htmlFor="archivosAdjuntos"
                  className={`inline-flex items-center gap-2 px-3.5 py-2 border rounded-md 
        ${
          isFieldReadOnly(3, "archivosAdjuntos")
            ? "border-gray-300 text-gray-400 bg-gray-100 cursor-not-allowed"
            : "border-[#4178D4] bg-white text-[#4178D4] hover:bg-blue-50 cursor-pointer"
        } max-w-fit`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Adjuntar archivos</span>
                </label>

                {/* Mostrar archivos adjuntos */}
                <div className="w-full space-y-2 mt-2">
                  {/* Archivos nuevos (objetos File) */}
                  {formData.archivosAdjuntos
                    .filter((file) => file instanceof File)
                    .map((file, index) => {
                      const fileName =
                        file instanceof File ? file.name : String(file);
                      return (
                        <div
                          key={`new-${index}`}
                          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg group"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="text-gray-500 w-4 h-4" />
                            <span className="text-sm truncate max-w-[180px] md:max-w-md">
                              {fileName}
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              Nuevo
                            </span>
                          </div>

                          {!isFieldReadOnly(3, "archivosAdjuntos") && (
                            <button
                              type="button"
                              onClick={() => handleDeleteFile(file, index)}
                              className="p-1.5 hover:bg-red-50 rounded-md text-red-500 opacity-0 group-hover:opacity-100"
                              title="Eliminar archivo"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}

                  {/* Archivos existentes (strings) */}
                  {formData.archivosAdjuntos
                    .filter((file) => typeof file === "string")
                    .map((file, index) => {
                      const fileName = String(file);
                      return (
                        <div
                          key={`existing-${index}`}
                          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg group"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="text-gray-500 w-4 h-4" />
                            <span className="text-sm truncate max-w-[180px] md:max-w-md">
                              {fileName}
                            </span>
                          </div>

                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                console.log(
                                  "Click en botón descargar archivo:",
                                  fileName
                                );
                                console.log(
                                  "archivosAdjuntosInfo:",
                                  formData.archivosAdjuntosInfo
                                );
                                console.log(
                                  "todosLosArchivos:",
                                  formData.todosLosArchivos
                                );
                                handleDownloadFile(fileName).catch((err) => {
                                  console.error(
                                    `Error al descargar archivo ${fileName}:`,
                                    err
                                  );
                                  toast.error(`Error al descargar ${fileName}`);
                                });
                              }}
                              className="p-1.5 hover:bg-blue-50 rounded-md text-blue-600"
                              title="Descargar archivo"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            {!isFieldReadOnly(3, "archivosAdjuntos") && (
                              <button
                                type="button"
                                onClick={() => handleDeleteFile(file, index)}
                                className="p-1.5 hover:bg-red-50 rounded-md text-red-500 opacity-0 group-hover:opacity-100"
                                title="Eliminar archivo"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                  {/* Archivos desde archivosAdjuntosInfo */}
                  {formData.archivosAdjuntosInfo &&
                    Array.isArray(formData.archivosAdjuntosInfo) &&
                    formData.archivosAdjuntosInfo.length > 0 &&
                    formData.archivosAdjuntosInfo
                      .filter(
                        (archivo) =>
                          !formData.archivosAdjuntos.includes(archivo.name) &&
                          archivo.is_calculation_sheet !== true &&
                          archivo.name &&
                          !archivo.name.startsWith("Hoja de Cálculo - ")
                      )
                      .map((archivo, index) => (
                        <div
                          key={`info-${index}`}
                          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg group"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="text-gray-500 w-4 h-4" />
                            <span className="text-sm truncate max-w-[180px] md:max-w-md">
                              {archivo.name}
                            </span>
                          </div>

                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleDownloadFile(archivo.name)}
                              className="p-1.5 hover:bg-blue-50 rounded-md text-blue-600"
                              title="Descargar archivo"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            {!isFieldReadOnly(3, "archivosAdjuntos") && (
                              <button
                                type="button"
                                onClick={() => handleDeleteFile(archivo, index)}
                                className="p-1.5 hover:bg-red-50 rounded-md text-red-500 opacity-0 group-hover:opacity-100"
                                title="Eliminar archivo"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                  {/* Archivos desde todosLosArchivos (estructura separada) */}
                  {formData.todosLosArchivos &&
                    isSeparatedFilesStructure(formData.todosLosArchivos) &&
                    formData.todosLosArchivos.archivos_generales &&
                    formData.todosLosArchivos.archivos_generales.length > 0 &&
                    formData.todosLosArchivos.archivos_generales
                      .filter(
                        (archivo) =>
                          !formData.archivosAdjuntos.includes(archivo.name) &&
                          archivo.name
                      )
                      .map((archivo, index) => (
                        <div
                          key={`estructura-${index}`}
                          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg group"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="text-gray-500 w-4 h-4" />
                            <span className="text-sm truncate max-w-[180px] md:max-w-md">
                              {archivo.name}
                            </span>
                          </div>

                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleDownloadFile(archivo.name)}
                              className="p-1.5 hover:bg-blue-50 rounded-md text-blue-600"
                              title="Descargar archivo"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            {!isFieldReadOnly(3, "archivosAdjuntos") && (
                              <button
                                type="button"
                                onClick={() => handleDeleteFile(archivo, index)}
                                className="p-1.5 hover:bg-red-50 rounded-md text-red-500 opacity-0 group-hover:opacity-100"
                                title="Eliminar archivo"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                  {/* Archivos desde todosLosArchivos (array) */}
                  {formData.todosLosArchivos &&
                    Array.isArray(formData.todosLosArchivos) &&
                    formData.todosLosArchivos.length > 0 &&
                    formData.todosLosArchivos
                      .filter(
                        (archivo) =>
                          !formData.archivosAdjuntos.includes(archivo.name) &&
                          archivo.is_calculation_sheet !== true &&
                          archivo.name &&
                          !archivo.name.startsWith("Hoja de Cálculo - ")
                      )
                      .map((archivo, index) => (
                        <div
                          key={`array-${index}`}
                          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg group"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="text-gray-500 w-4 h-4" />
                            <span className="text-sm truncate max-w-[180px] md:max-w-md">
                              {archivo.name}
                            </span>
                          </div>

                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleDownloadFile(archivo.name)}
                              className="p-1.5 hover:bg-blue-50 rounded-md text-blue-600"
                              title="Descargar archivo"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            {!isFieldReadOnly(3, "archivosAdjuntos") && (
                              <button
                                type="button"
                                onClick={() => handleDeleteFile(archivo, index)}
                                className="p-1.5 hover:bg-red-50 rounded-md text-red-500 opacity-0 group-hover:opacity-100"
                                title="Eliminar archivo"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                </div>

                {/* Mostrar mensaje cuando no hay archivos */}
                {!formData.archivosAdjuntos.length &&
                  !(
                    formData.archivosAdjuntosInfo &&
                    formData.archivosAdjuntosInfo.length > 0
                  ) &&
                  !(
                    formData.todosLosArchivos &&
                    isSeparatedFilesStructure(formData.todosLosArchivos) &&
                    formData.todosLosArchivos.archivos_generales &&
                    formData.todosLosArchivos.archivos_generales.length > 0
                  ) &&
                  !(
                    formData.todosLosArchivos &&
                    Array.isArray(formData.todosLosArchivos) &&
                    formData.todosLosArchivos.filter(
                      (archivo) =>
                        archivo.is_calculation_sheet !== true &&
                        archivo.name &&
                        !archivo.name.startsWith("Hoja de Cálculo - ")
                    ).length > 0
                  ) && (
                    <p className="text-xs text-gray-500 mt-2 text-center italic">
                      No hay archivos adjuntos. Adjunte planos, fichas técnicas
                      u otros documentos relevantes.
                    </p>
                  )}
              </div>
            </div>
            {/* Botón para generar cotización - visible solo para el creador o nuevas ofertas */}
            <div className="flex justify-center mb-6">
              {/* Mostrar el botón solo si:
      1. Es una oferta completamente nueva (sin datos en initialData o visitaTecnicaData), O
      2. El usuario actual es el propietario de la oferta */}
              {((initialData === undefined &&
                visitaTecnicaData === undefined) ||
                (currentUserId &&
                  (currentUserId === parseInt(String(formData.user_id)) ||
                    currentUserId === parseInt(String(initialData?.user_id)) ||
                    currentUserId ===
                      parseInt(String(visitaTecnicaData?.user_id))))) && (
                <button
                  type="button"
                  onClick={handleGenerarCotizacion}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-[#4178D4] rounded-lg bg-white text-[#4178D4] hover:bg-blue-50 transition-colors"
                >
                  <FileText className="w-5 h-5" />
                  <span className="text-base">Generar cotización</span>
                </button>
              )}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="mb-6">
            <div className="mb-6 pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-[#4178D4] text-white rounded-full text-xs mr-2">
                  4
                </span>
                INFORMACIÓN COTIZACIÓN
                {isReadOnly && editableStep4 && (
                  <span className="ml-2 text-xs font-normal bg-green-100 text-green-800 px-2 py-0.5 rounded">
                    Editable
                  </span>
                )}
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                {isReadOnly && editableStep4
                  ? "Puede actualizar el estado y los comentarios de esta cotización"
                  : "Información del estado de la cotización"}
              </p>
            </div>

            {/* Panel principal con estilo consistente */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5 hover:shadow-md transition-all">
              <div className="mb-6">
                <label
                  htmlFor="estadoCotizacion"
                  className="block mb-1.5 font-medium text-gray-700"
                >
                  Estado de la cotización
                  <span className="text-red-500">*</span>
                  {isReadOnly && editableStep4 && (
                    <span className="ml-2 text-xs font-normal bg-green-100 text-green-800 px-2 py-0.5 rounded">
                      Editable
                    </span>
                  )}
                </label>{" "}
                <select
                  id="estadoCotizacion"
                  name="estadoCotizacion"
                  required
                  value={formData.estadoCotizacion}
                  onChange={handleChange}
                  className={`w-full p-3 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all ${
                    isReadOnly && editableStep4
                      ? "border-blue-300"
                      : "border-gray-200"
                  }`}
                  disabled={isFieldReadOnly(4, "estadoCotizacion")}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="aprobado">Aprobado</option>
                  <option value="rechazado">Rechazado</option>
                </select>
              </div>
              <div className="mb-6">
                <label
                  htmlFor="comentarioCotizacion"
                  className="block mb-1.5 font-medium text-gray-700"
                >
                  Comentarios sobre la cotización
                  {isReadOnly && editableStep4 && (
                    <span className="ml-2 text-xs font-normal bg-green-100 text-green-800 px-2 py-0.5 rounded">
                      Editable
                    </span>
                  )}
                </label>
                <textarea
                  id="comentarioCotizacion"
                  name="comentarioCotizacion"
                  value={formData.comentarioCotizacion}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Añada comentarios sobre la cotización"
                  className={`w-full p-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent transition-all min-h-[120px] resize-none ${
                    isReadOnly && editableStep4
                      ? "border-blue-300"
                      : "border-gray-200"
                  }`}
                  readOnly={isFieldReadOnly(4, "comentarioCotizacion")}
                />
              </div>{" "}
              {/* El campo de fecha de cotización está oculto porque se llena automáticamente cuando se aprueba o rechaza */}
              <input
                type="hidden"
                id="fechaCotizacion"
                name="fechaCotizacion"
                value={
                  formData.fechaCotizacion ||
                  new Date().toISOString().split("T")[0]
                }
              />{" "}
              <div className="mb-6">
                <label className="block mb-1.5 font-medium text-gray-700">
                  Archivo de cotización
                  {isReadOnly && editableStep4 && (
                    <span className="ml-2 text-xs font-normal bg-green-100 text-green-800 px-2 py-0.5 rounded">
                      Editable
                    </span>
                  )}
                </label>

                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    id="archivoCotizacion"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setFormData((prev) => ({
                          ...prev,
                          archivoCotizacion: e.target.files![0],
                        }));
                      }
                    }}
                    disabled={isFieldReadOnly(4, "archivoCotizacion")}
                    className="hidden"
                  />
                  <label
                    htmlFor="archivoCotizacion"
                    className={`inline-flex items-center gap-2 px-3.5 py-2 border rounded-md bg-white hover:bg-blue-50 ${
                      isFieldReadOnly(4, "archivoCotizacion")
                        ? "hidden"
                        : "block border-[#4178D4] text-[#4178D4]"
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    <span>Subir archivo de cotización</span>
                  </label>{" "}
                  {formData.archivoCotizacion && (
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200 flex-1">
                      <FileText className="w-4 h-4 text-[#4178D4]" />{" "}
                      <span className="text-sm text-gray-600 truncate">
                        {formData.archivoCotizacion instanceof File
                          ? formData.archivoCotizacion.name
                          : typeof formData.archivoCotizacion === "string" &&
                            formData.archivoCotizacion
                          ? formData.archivoCotizacion.split("/").pop() ||
                            formData.archivoCotizacion.split("\\").pop() ||
                            "Archivo de cotización"
                          : "Archivo de cotización"}
                      </span>{" "}
                      <button
                        type="button"
                        onClick={handleDownloadCotizacion}
                        className="ml-auto text-[#4178D4] hover:text-[#34509F] p-1"
                        title="Descargar cotización"
                      >
                        <DownloadCloud className="w-4 h-4" />
                      </button>
                      {typeof formData.archivoCotizacion === "string" &&
                        formData.archivoCotizacion && (
                          <a
                            href={`${
                              import.meta.env.VITE_API_URL ||
                              "http://127.0.0.1:8000"
                            }/${formData.archivoCotizacion}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#4178D4] hover:text-[#34509F] p-1"
                            title="Ver archivo"
                          >
                            <FileText className="w-4 h-4" />
                          </a>
                        )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Información de resumen de la cotización */}
            <div className="bg-gray-50 rounded-lg p-5 mb-6">
              <h4 className="font-semibold text-[#34509F] mb-3">
                Resumen de la cotización
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Cliente:</p>
                  <p className="font-medium">{formData.nombreCliente}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Valor total:</p>
                  <p className="font-medium">
                    ${formData.valorTotal.toLocaleString()} COP
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Cotizador:</p>
                  <p className="font-medium">
                    {formData.cotizador || "No asignado"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Estado:</p>{" "}
                  <div
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      formData.estadoCotizacion === "aprobado"
                        ? "bg-green-100 text-green-800"
                        : formData.estadoCotizacion === "rechazado"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {" "}
                    {formData.estadoCotizacion
                      ? formData.estadoCotizacion.charAt(0).toUpperCase() +
                        formData.estadoCotizacion.slice(1)
                      : "Pendiente"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Efecto para reinicializar el formulario cuando visitaTecnicaData es undefined (nueva oferta)
  useEffect(() => {
    if (visitaTecnicaData === undefined) {
      // Establecer el paso actual a 1 para una nueva oferta
      setCurrentStep(1);

      // Reiniciar datos del formulario con valores por defecto
      setFormData({
        // Campos del cliente según el modelo backend
        type_identification: "C.C",
        identification: "",
        firs_name: "",
        other_name: "",
        last_name: "",
        secon_surname: "",
        name: "",
        addres: "",
        phone: "",
        phone_2: "",
        // Otros campos existentes
        nombreCliente: "",
        departamento: "",
        ciudad: "",
        fechaVisitaComercial: new Date().toISOString().split("T")[0],
        tipoProyecto: "Privado",
        codigoVT: "",
        fechaInicio: new Date().toISOString().split("T")[0],
        descripcion: "",
        nitCC: "",
        representante: "",
        // Paso 2: Detalles técnicos
        tipoSistema: "On-grid",
        potenciaKw: 0,
        tipoPotenciaPaneles: "",
        produccionEnergetica: 0,
        cantidadPaneles: 0,
        areaNecesaria: 0,
        tipoInstalacion: "Tejado",
        equipamiento: {
          panelesSolares: false,
          estructurasMontaje: false,
          cableadoGabinete: false,
          legalizacionDisenos: false,
          bateria: false,
          inversor: false,
          kit5kw: false,
          kit8kw: false,
          kit12kw: false,
          kit15kw: false,
          kit30kw: false,
          microinversores: false,
          transporte: false,
          manoDeObra: false,
          preciosPanelesSolares: 0,
          preciosEstructurasMontaje: 0,
          preciosCableadoGabinete: 0,
          preciosLegalizacionDisenos: 0,
          preciosBateria: 0,
          preciosInversor: 0,
          preciosKit5kw: 0,
          preciosKit8kw: 0,
          preciosKit12kw: 0,
          preciosKit15kw: 0,
          preciosKit30kw: 0,
          preciosMicroinversores: 0,
          preciosTransporte: 0,
          preciosManoDeObra: 0,
        },
        // Paso 3: Detalles comerciales
        hojaCalculo: "",
        valorTotal: 0,
        plazoEntrega: 30,
        validezOferta: 15,
        garantia: "5 años",
        formaPago: "50%,30%,20%",
        observaciones: "",
        archivosAdjuntos: [],
        estado: "pendiente",
        comentarioCotizacion: "",
        archivoCotizacion: "",
      });

      // Reiniciar selección de departamento y ciudades
      setSelectedDepartment("");
      setAvailableCities([]);
    }
  }, [visitaTecnicaData]);

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100">
      {/* Header del form */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white z-9 rounded-t-xl">
        <div className="flex items-center">
          <FileText className="w-6 h-6 text-[#4178D4] mr-2" />
          <h2 className="text-xl md:text-2xl font-bold text-[#34509F]">
            {isReadOnly ? "DETALLES DE OFERTA" : "NUEVA OFERTA"}
          </h2>
        </div>
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
          {/* Botón izquierdo: anterior o cancelar */}
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

          {/* Botón derecho: siguiente o guardar */}
          <div>
            {/* Mostramos botón siguiente en todos los pasos excepto el último */}
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center justify-center gap-2 px-8 py-2.5 bg-[#4178D4] hover:bg-[#34509F] text-white font-medium rounded-lg transition-colors cursor-pointer"
              >
                Siguiente
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="submit"
                className="flex items-center justify-center gap-2 px-8 py-2.5 bg-[#4178D4] text-white font-medium rounded-lg hover:bg-[#34509F] hover:shadow-lg transition cursor-pointer"
                disabled={isReadOnly && !editableStep4} // Deshabilitar si es modo lectura y no es editable el paso 4
              >
                <CheckCircle className="w-5 h-5" />
                {isReadOnly ? "Actualizar estado" : "Guardar oferta"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminNuevaOfertaForm;
