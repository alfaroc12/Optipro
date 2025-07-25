import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { downloadFile } from "@/utils/fileUtils";
import { colombiaData } from "@/utils/colombiaData";
import { toast } from "react-toastify";
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
} from "lucide-react";
import { RootState } from "@/store/store";
import {
  visitaTecnicaService,
  VisitaTecnicaResponse,
} from "../../services/VisitaTecnicaService";

// Función para formatear números con separadores de miles
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value);
};

// Función para limpiar el formato y obtener solo números
const cleanNumber = (value: string): number => {
  const cleaned = value.replace(/[^\d]/g, "");
  return cleaned ? parseInt(cleaned, 10) : 0;
};

interface NuevaOfertaFormData {
  id: any;
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
  nombreCliente: string; // Se mantiene temporalmente para compatibilidad
  departamento: string;
  ciudad: string;
  fechaVisitaComercial: string;
  tipoProyecto: string;
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
  tipoInstalacion: string; // Campo para el código de oferta requerido por el backend
  code?: string;
  // IDs para el backend
  person_id?: number | null;
  user_id?: number;
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
  // Campos de cotización
  estado?: "aprobado" | "rechazado" | "pendiente";
  estadoCotizacion?: string;
  comentarioCotizacion?: string;
  cotizador?: string;
  archivoCotizacion?: string;
  fechaCotizacion?: string;
  // Campos adicionales para manejar archivos
  archivosAdjuntosInfo?: any[]; // Información completa sobre los archivos adjuntos

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
}

// Tipo para los archivos adjuntos
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

// Tipo para determinar si todosLosArchivos es una estructura separada o un array plano

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

interface NuevaOfertaFormProps {
  onSubmit: (data: NuevaOfertaFormData) => void;
  onCancel: () => void;
  visitaTecnicaData?: any;
  initialData?: NuevaOfertaFormData; // Datos de la oferta para visualizar
  readOnly?: boolean; // true = solo lectura
  isEditMode?: boolean; // true = modo edición, false = modo creación
}

const NuevaOfertaForm: React.FC<NuevaOfertaFormProps> = ({
  onSubmit,
  onCancel,
  visitaTecnicaData,
  initialData,
  readOnly = false,
}) => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [availableCities, setAvailableCities] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [headerZIndex] = useState<string>("z-9");

  // Estados para las visitas técnicas
  const [userVisits, setUserVisits] = useState<VisitaTecnicaResponse[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<number | null>(null);
  const [isLoadingVisits, setIsLoadingVisits] = useState(false);

  // Efecto para cargar las visitas técnicas del usuario actual
  useEffect(() => {
    const fetchUserVisits = async () => {
      if (!currentUser) return;

      try {
        setIsLoadingVisits(true);
        const response: any = await visitaTecnicaService.getUserVisits(
          currentUser?.id || 0
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
  }, [currentUser]);

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
          lastName = nameParts[0]; // Primera parte 
          secondSurname = nameParts[1] || ""; // Segunda parte 
        }

        let firstName = visitData.name || "";
        let otherName = "";

        // Si el nombre tiene un espacio, dividirlo en dos partes
        if (firstName.includes(" ")) {
          const nameParts = firstName.split(" ");
          firstName = nameParts[0]; // Primera parte del nombre
          otherName = nameParts[1] || ""; // Solo la segunda palabra como segundo nombre
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
          firs_name: firstName,        // Usar el primer nombre procesado
          other_name: otherName,       // Usar el segundo nombre procesado
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

  // Generar un código único para la oferta (solo números)
  const generateOfertaCode = () => {
    // Generamos solo los 6 últimos dígitos del timestamp actual
    return new Date().getTime().toString().slice(-6);
  };
  const [formData, setFormData] = useState<NuevaOfertaFormData>(
    initialData
      ? {
          ...initialData,
          // Asegurarse de que estos campos estén incluidos
          archivosAdjuntosInfo: initialData.archivosAdjuntosInfo || [],
          todosLosArchivos: initialData.todosLosArchivos || [],
        }
      : {
          // Campos del cliente según el modelo backend
          id: null, // <-- Añadido para cumplir con la interfaz
          type_identification: "C.C",
          identification: visitaTecnicaData?.nitcc || "",
          nitCC: visitaTecnicaData?.nitcc || "",
          firs_name: "",
          other_name: "",
          last_name: "",
          secon_surname: "",
          name: visitaTecnicaData?.nombre || "",
          addres: "",
          phone: "",
          phone_2: "",
          representante: "",

          // Campos existentes mantenidos para compatibilidad
          nombreCliente: visitaTecnicaData?.nombre || "",
          departamento: visitaTecnicaData?.departamento || "",
          ciudad: visitaTecnicaData?.ciudad || "",
          fechaVisitaComercial: "",
          tipoProyecto: "",
          fechaInicio: "",
          descripcion: "",
          tipoSistema: "",
          potenciaKw: 0,
          tipoPotenciaPaneles: "",
          produccionEnergetica: 0,
          cantidadPaneles: 0,
          areaNecesaria: 0,
          tipoInstalacion: "",
          code: generateOfertaCode(), // Código de oferta generado automáticamente
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
          hojaCalculo: "",
          valorTotal: 0,
          plazoEntrega: 30,
          validezOferta: 15,
          garantia: "",
          formaPago: "",
          observaciones: "",
          archivosAdjuntos: [],
          cotizador: "",
        }
  );
  useEffect(() => {
    if (initialData) {
      // Buscar la hoja de cálculo en los archivos adjuntos
      if (initialData.todosLosArchivos) {
        if (Array.isArray(initialData.todosLosArchivos)) {
          //@ts-ignore
          const hojaCalculo = initialData.todosLosArchivos.find(
            (archivo: any) =>
              archivo.is_calculation_sheet === true ||
              (archivo.name && archivo.name.startsWith("Hoja de Cálculo - "))
          );
        } else if (
          typeof initialData.todosLosArchivos === "object" &&
          initialData.todosLosArchivos.hoja_calculo
        ) {
        }
      }

      setFormData({ ...initialData });

      // Si la oferta está aprobada o rechazada y estamos en modo solo lectura,
      // mostramos el paso de información de cotización
      if (
        readOnly &&
        initialData.estado &&
        (initialData.estado === "aprobado" ||
          initialData.estado === "rechazado")
      ) {
        setCurrentStep(4); // Ir directamente al paso de información de cotización
      }

      // Encontrar el departamento en colombiaData y configurar las ciudades
      const dept = colombiaData.find(
        (d) => d.name === initialData.departamento
      );
      if (dept) {
        setSelectedDepartment(dept.id);
        setAvailableCities(dept.cities);
      } else if (initialData.departamento && readOnly) {
        // Si estamos en modo readOnly y no encontramos el departamento en colombiaData
        // pero tenemos un valor, creamos una ciudad personalizada para mostrar la información
        setSelectedDepartment("custom");
        const ciudadItem = { id: "custom", name: initialData.ciudad };
        setAvailableCities([ciudadItem]);

        // Aseguramos que la ciudad se mantenga en el formData aunque el departamento no esté en la lista
        setFormData((prev) => ({
          ...prev,
          departamento: initialData.departamento,
          ciudad: initialData.ciudad,
        }));
      }
    }
  }, [initialData, readOnly]);
  useEffect(() => {
    if (selectedDepartment) {
      const department = colombiaData.find((d) => d.id === selectedDepartment);
      if (department) {
        setAvailableCities(department.cities);

        // Actualizar el departamento en formData con el nombre del departamento
        // En modo readOnly no resetear la ciudad
        if (!readOnly) {
          setFormData((prev) => ({
            ...prev,
            departamento: department.name,
            ciudad: "", // Resetear la ciudad cuando cambia el departamento (solo en modo edición)
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            departamento: department.name,
            // Mantenemos la ciudad existente en modo solo lectura
          }));
        }
      }
    }
  }, [selectedDepartment, readOnly]); // Ya no necesitamos funciones de búsqueda, selección o creación de clientes
  // porque ahora los datos del cliente se ingresan directamente en el formulario

  const shouldShowCotizacionStep = () => {
    return (
      readOnly &&
      formData.estado &&
      (formData.estado === "aprobado" || formData.estado === "rechazado")
    );
  };

  // Calcular el número total de pasos según el estado de la cotización
  shouldShowCotizacionStep() ? 4 : 3;
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    // Eliminamos el e.preventDefault() para permitir el comportamiento normal de los inputs
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Eliminamos el e.preventDefault() para permitir el comportamiento normal
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === "" ? 0 : Number(value),
    }));
  };
  const handleEquipmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;

    // Obtenemos el nombre del campo de precio correspondiente
    const priceName = "precios" + name.charAt(0).toUpperCase() + name.slice(1);

    setFormData((prev) => ({
      ...prev,
      equipamiento: {
        ...prev.equipamiento,
        [name]: checked,
        // Si se desmarca el checkbox, reiniciamos el precio a 0
        ...(checked ? {} : { [priceName]: 0 }),
      },
    }));
  };

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

    setFormData((prev: NuevaOfertaFormData): NuevaOfertaFormData => {
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
  const handleRemoveFile = (fileName: string) => {
    setFormData((prev) => ({
      ...prev,
      archivosAdjuntos: prev.archivosAdjuntos.filter((file) => {
        // Si es un objeto File, comparar por nombre
        if (file instanceof File) {
          return file.name !== fileName;
        }
        // Si es una cadena (para compatibilidad con el código existente)
        return file !== fileName;
      }),
    }));
  };

  const handleNextStep = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentStep < 4) {
      setCurrentStep((prevStep) => prevStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevStep = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentStep > 1) {
      setCurrentStep((prevStep) => prevStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Si es solo lectura, solo cerramos
    if (readOnly) {
      onCancel();
      return;
    }

    // Validaciones para campos obligatorios del cliente
    if (!formData.identification) {
      alert("Por favor ingrese el número de identificación");
      return;
    }

    if (!formData.firs_name || !formData.last_name) {
      alert("Por favor ingrese el nombre y apellido del cliente");
      return;
    }

    // Validar campos obligatorios adicionales
    if (!formData.fechaInicio) {
      alert("Por favor ingrese la fecha de inicio");
      return;
    }

    if (!formData.tipoProyecto) {
      alert("Por favor seleccione un tipo de proyecto");
      return;
    }

    if (!formData.tipoSistema) {
      alert("Por favor seleccione un tipo de sistema");
      return;
    }

    // Validar si hay productos seleccionados en el paso 3
    const hasSelectedProducts = Object.entries(formData.equipamiento).some(
      ([key, value]) =>
        typeof value === "boolean" &&
        value === true &&
        !key.startsWith("precios")
    );

    if (!hasSelectedProducts) {
      alert("Debe seleccionar al menos un producto para la oferta");
      return;
    }

    if (formData.valorTotal <= 0) {
      alert("El valor total debe ser mayor a cero");
      return;
    } // Preparar datos para el backend
    const backendData = {
      ...formData,
      // Asegurarnos de que user_id esté disponible
      user_id: currentUser?.id || 0,
      // Asegurar que person_id sea un número
      person_id: Number(formData.person_id) || 0,
    };

    // Construir el campo name si no existe
    if (!backendData.name) {
      // Si tenemos nombreCliente, lo usamos para name
      if (backendData.nombreCliente) {
        backendData.name = backendData.nombreCliente;
      }
      // Si tenemos nombres individuales, construimos el nombre completo
      else if (backendData.firs_name || backendData.last_name) {
        backendData.name = [
          backendData.firs_name || "",
          backendData.other_name || "",
          backendData.last_name || "",
          backendData.secon_surname || "",
        ]
          .filter(Boolean)
          .join(" ");
      }
    }

    // Llamamos al callback onSubmit con los datos del formulario
    onSubmit(backendData);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
    }
  };
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
        }
      }

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
  const handleDownloadFile = (filename: string) => {
    // Buscar primero en los datos originales de archivos adjuntos
    if (Array.isArray(formData.archivosAdjuntosInfo)) {
      const archivo = formData.archivosAdjuntosInfo.find(
        (a: any) => a.name === filename
      );

      if (archivo && archivo.attach) {
        // Si encontramos el archivo en la información original, usamos esa URL
        const fileUrl = `http://127.0.0.1:8000${archivo.attach}`;
        downloadFile(fileUrl, filename);
        return;
      }
    }

    // Si no lo encontramos en la información original, intentamos construir la URL del backend
    const justFileName = filename.split("/").pop();
    const fileUrl = `http://127.0.0.1:8000/media/${justFileName}`;
    downloadFile(fileUrl, justFileName || filename);
  };
  const handleDownloadCotizacion = () => {
    if (!formData.archivoCotizacion) {
      toast.error("No hay archivo de cotización disponible para descargar");
      return;
    }

    try {
      // Verificar si es un objeto File o una cadena de texto
      //@ts-ignore
      if (formData.archivoCotizacion instanceof File) {
        // Es un archivo recién seleccionado, lo convertimos a URL
        const url = URL.createObjectURL(formData.archivoCotizacion);
        downloadFile(url, formData.archivoCotizacion.name);
        toast.success("Descargando archivo de cotización");

        // Limpiamos la URL después de la descarga
        setTimeout(() => URL.revokeObjectURL(url), 3000);
      } else {
        // Es una URL o nombre de archivo existente del backend
        const filename =
          typeof formData.archivoCotizacion === "string"
            ? formData.archivoCotizacion.split("/").pop() ||
              "archivo_cotizacion"
            : "archivo_cotizacion";

        // Si la ruta ya es una URL completa, la usamos directamente
        const fileUrl = formData.archivoCotizacion.toString().startsWith("http")
          ? formData.archivoCotizacion.toString()
          : `${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}/${
              formData.archivoCotizacion
            }`;

        downloadFile(fileUrl, filename);
        toast.success(`Descargando archivo: ${filename}`);
      }
    } catch (error) {
      console.error("Error al descargar el archivo de cotización:", error);
      toast.error("Error al descargar el archivo. Intente nuevamente.");
    }
  };
  const handleDownloadHojaCalculo = () => {
    // Si es un objeto File, creamos una URL para descargar el archivo local
    if (formData.hojaCalculo instanceof File) {
      const fileURL = URL.createObjectURL(formData.hojaCalculo);
      downloadFile(fileURL, formData.hojaCalculo.name);
      // Limpiamos la URL después de la descarga
      setTimeout(() => URL.revokeObjectURL(fileURL), 3000);
      return;
    }

    // 1. Primero intentamos con la nueva estructura (hoja_calculo separada)

    // Verificar en formData.todosLosArchivos
    if (formData.todosLosArchivos) {
      // Si es un objeto con hoja_calculo (nueva estructura)
      if (
        isSeparatedFilesStructure(formData.todosLosArchivos) &&
        formData.todosLosArchivos.hoja_calculo &&
        formData.todosLosArchivos.hoja_calculo.length > 0
      ) {
        const hojaCalculoInfo = formData.todosLosArchivos.hoja_calculo[0];
        if (hojaCalculoInfo && hojaCalculoInfo.attach) {
          const fileUrl = `http://127.0.0.1:8000${hojaCalculoInfo.attach}`;
          downloadFile(fileUrl, hojaCalculoInfo.name);
          return;
        }
      }

      // Si es un array (estructura mixta)
      if (
        Array.isArray(formData.todosLosArchivos) &&
        formData.todosLosArchivos.length > 0
      ) {
        // Primero buscar por el campo is_calculation_sheet
        const hojaCalculoPorFlag = formData.todosLosArchivos.find(
          (archivo: any) => archivo.is_calculation_sheet === true
        );

        if (hojaCalculoPorFlag && hojaCalculoPorFlag.attach) {
          const fileUrl = `http://127.0.0.1:8000${hojaCalculoPorFlag.attach}`;
          downloadFile(fileUrl, hojaCalculoPorFlag.name);
          return;
        }

        // Si no la encontramos por flag, buscar por nombre
        const hojaCalculoArchivo = formData.todosLosArchivos.find(
          (archivo: any) =>
            archivo.name && archivo.name.startsWith("Hoja de Cálculo - ")
        );

        if (hojaCalculoArchivo && hojaCalculoArchivo.attach) {
          const fileUrl = `http://127.0.0.1:8000${hojaCalculoArchivo.attach}`;
          downloadFile(fileUrl, hojaCalculoArchivo.name);
          return;
        }
      }
    }

    // 2. Verificar en initialData.todosLosArchivos
    if (initialData && initialData.todosLosArchivos) {
      // Si es un objeto con hoja_calculo (nueva estructura)
      if (
        isSeparatedFilesStructure(initialData.todosLosArchivos) &&
        initialData.todosLosArchivos.hoja_calculo &&
        initialData.todosLosArchivos.hoja_calculo.length > 0
      ) {
        const hojaCalculoInfo = initialData.todosLosArchivos.hoja_calculo[0];
        if (hojaCalculoInfo && hojaCalculoInfo.attach) {
          const fileUrl = `http://127.0.0.1:8000${hojaCalculoInfo.attach}`;
          downloadFile(fileUrl, hojaCalculoInfo.name);
          return;
        }
      }

      // Si es un array (estructura mixta)
      if (
        Array.isArray(initialData.todosLosArchivos) &&
        initialData.todosLosArchivos.length > 0
      ) {
        // Primero buscar por el campo is_calculation_sheet
        const hojaCalculoPorFlag = initialData.todosLosArchivos.find(
          (archivo: any) => archivo.is_calculation_sheet === true
        );

        if (hojaCalculoPorFlag && hojaCalculoPorFlag.attach) {
          const fileUrl = `http://127.0.0.1:8000${hojaCalculoPorFlag.attach}`;
          downloadFile(fileUrl, hojaCalculoPorFlag.name);
          return;
        }

        // Si no la encontramos por flag, buscar por nombre
        const hojaCalculoArchivo = initialData.todosLosArchivos.find(
          (archivo: any) =>
            archivo.name && archivo.name.startsWith("Hoja de Cálculo - ")
        );

        if (hojaCalculoArchivo && hojaCalculoArchivo.attach) {
          const fileUrl = `http://127.0.0.1:8000${hojaCalculoArchivo.attach}`;
          downloadFile(fileUrl, hojaCalculoArchivo.name);
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
      const filename = hojaCalculo as string;
      const justFileName = filename.split("/").pop();
      const fileUrl = `http://127.0.0.1:8000/media/${justFileName}`;
      downloadFile(fileUrl, justFileName || filename);
      return;
    }
  };

  const renderStepIndicator = () => {
    // Determinar si se debe mostrar el paso de información de cotización
    const showCotizacionStep = shouldShowCotizacionStep();

    const steps = [
      { name: "Información general", number: 1 },
      { name: "Detalles técnicos", number: 2 },
      { name: "Oferta económica", number: 3 },
    ];

    // Añadir paso de información de cotización si es necesario
    if (showCotizacionStep) {
      steps.push({ name: "Info. cotización", number: 4 });
    }

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
          ))}{" "}
          <div className="absolute top-5 left-0 right-0 flex">
            {steps.slice(0, -1).map((step, index) => (
              <div
                key={index}
                className={`h-0.5 flex-1 ${
                  currentStep > step.number ? "bg-[#4178D4]" : "bg-gray-300"
                }`}
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  };

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
            {!readOnly && (
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
                  disabled={readOnly}
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
                  disabled={readOnly}
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
                  disabled={readOnly}
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
                  disabled={readOnly}
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
                  disabled={readOnly}
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
                  disabled={readOnly}
                  required
                />
              </div>
            </div>
            {/* Representante y Cotizador */}
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
                  disabled={readOnly}
                />
              </div>
              <div className="transition-all duration-300 hover:shadow-md rounded-lg p-0.5">
                <label
                  htmlFor="cotizador"
                  className="block font-medium text-gray-700 mb-1.5"
                >
                  Cotizador
                </label>
                <input
                  id="cotizador"
                  name="cotizador"
                  type="text"
                  value={formData.cotizador || ""}
                  onChange={handleChange}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] transition-colors"
                  disabled={readOnly}
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
                  disabled={readOnly}
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
                  disabled={readOnly}
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
                  disabled={readOnly}
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
                  disabled={readOnly}
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
                  disabled={readOnly || !selectedDepartment}
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
                  disabled={readOnly}
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
                  disabled={readOnly}
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
                  disabled={readOnly}
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
                disabled={readOnly}
              />
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
                    disabled={readOnly}
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
                      disabled={readOnly}
                    />
                    <Zap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
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
                    disabled={readOnly}
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
                    disabled={readOnly}
                  />
                </div>
              </div>
            </div>
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
                    disabled={readOnly}
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
                    disabled={readOnly}
                  />
                </div>
              </div>
            </div>
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
                    disabled={readOnly}
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
                    disabled={readOnly}
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
                    disabled={readOnly}
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
                    disabled={readOnly}
                  />
                  <label htmlFor="instalacionOtro" className="ml-2 font-medium">
                    Otro
                  </label>
                </div>
              </div>
            </div>
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
                        disabled={readOnly}
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
                          !formData.equipamiento.panelesSolares || readOnly
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
                        disabled={readOnly}
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
                          !formData.equipamiento.estructurasMontaje || readOnly
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
                        disabled={readOnly}
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
                          !formData.equipamiento.cableadoGabinete || readOnly
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
                        disabled={readOnly}
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
                          !formData.equipamiento.legalizacionDisenos || readOnly
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
                        disabled={readOnly}
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
                        disabled={!formData.equipamiento.bateria || readOnly}
                      />
                    </div>
                  </div>

                  {/* Inversor */}
                  <div className="flex items-center justify-between gap-4 p-2 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center flex-1 min-w-0">
                      <input
                        type="checkbox"
                        id="inversor"
                        name="inversor"
                        checked={formData.equipamiento.inversor}
                        onChange={handleEquipmentChange}
                        className="appearance-none w-4 h-4 rounded border border-gray-300 bg-white checked:bg-[#4178D4] checked:border-[#4178D4] focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:ring-offset-2 transition-all flex-shrink-0"
                        disabled={readOnly}
                      />
                      <label htmlFor="inversor" className="ml-2">
                        Inversores/Microinversores
                      </label>
                    </div>
                    <div className="flex items-center flex-shrink-0">
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
                        className="w-24 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4178D4] focus:border-transparent"
                        disabled={!formData.equipamiento.inversor || readOnly}
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
                        disabled={readOnly}
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
                        disabled={!formData.equipamiento.kit5kw || readOnly}
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
                        disabled={readOnly}
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
                        disabled={!formData.equipamiento.kit8kw || readOnly}
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
                        disabled={readOnly}
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
                        disabled={!formData.equipamiento.kit12kw || readOnly}
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
                        disabled={readOnly}
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
                        disabled={!formData.equipamiento.kit15kw || readOnly}
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
                        disabled={readOnly}
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
                        disabled={!formData.equipamiento.kit30kw || readOnly}
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
                        disabled={readOnly}
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
                        disabled={!formData.equipamiento.transporte || readOnly}
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
                        disabled={readOnly}
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
                        disabled={!formData.equipamiento.manoDeObra || readOnly}
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
                        disabled={readOnly}
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
                          !formData.equipamiento.microinversores || readOnly
                        }
                      />
                    </div>
                  </div>
                </div>{" "}
              </div>{" "}
            </div>{" "}
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
                    {!readOnly && (
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 px-3.5 py-2 border border-[#4178D4] rounded-md bg-white text-[#4178D4] hover:bg-blue-50"
                        onClick={() =>
                          document.getElementById("hojaCalculo")?.click()
                        }
                        disabled={readOnly}
                      >
                        <DownloadCloud className="w-4 h-4" />
                        <span>Subir hoja de cálculo</span>
                      </button>
                    )}
                    <input
                      id="hojaCalculo"
                      name="hojaCalculo"
                      type="file"
                      className="hidden"
                      disabled={readOnly}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setFormData((prev) => ({
                            ...prev,
                            hojaCalculo: file,
                          }));
                        }
                      }}
                    />{" "}
                    {/* Verificamos primero si hay una hoja de cálculo disponible en cualquiera de las fuentes posibles */}
                    {(() => {
                      // Revisar estructura de archivos en formData
                      if (formData.todosLosArchivos) {
                        if (Array.isArray(formData.todosLosArchivos)) {
                          const hojaCalculo = formData.todosLosArchivos.find(
                            (archivo) =>
                              archivo.is_calculation_sheet === true ||
                              (archivo.name &&
                                archivo.name.startsWith("Hoja de Cálculo - "))
                          );
                          if (hojaCalculo) {
                          }
                        } else if (
                          typeof formData.todosLosArchivos === "object" &&
                          formData.todosLosArchivos.hoja_calculo
                        ) {
                        }
                      }

                      // Revisar estructura de archivos en initialData
                      if (initialData?.todosLosArchivos) {
                        if (Array.isArray(initialData.todosLosArchivos)) {
                          const hojaCalculo = initialData.todosLosArchivos.find(
                            (archivo) =>
                              archivo.is_calculation_sheet === true ||
                              (archivo.name &&
                                archivo.name.startsWith("Hoja de Cálculo - "))
                          );
                          if (hojaCalculo) {
                          }
                        } else if (
                          typeof initialData.todosLosArchivos === "object" &&
                          initialData.todosLosArchivos.hoja_calculo
                        ) {
                        }
                      }

                      // Verificar todas las posibles fuentes para la hoja de cálculo
                      return (
                        formData.hojaCalculo ||
                        initialData?.hojaCalculo ||
                        (formData.todosLosArchivos &&
                          Array.isArray(formData.todosLosArchivos) &&
                          formData.todosLosArchivos.some(
                            (archivo) =>
                              archivo.is_calculation_sheet === true ||
                              (archivo.name &&
                                archivo.name.startsWith("Hoja de Cálculo - "))
                          )) ||
                        (formData.todosLosArchivos &&
                          isSeparatedFilesStructure(
                            formData.todosLosArchivos
                          ) &&
                          formData.todosLosArchivos.hoja_calculo &&
                          formData.todosLosArchivos.hoja_calculo.length > 0) ||
                        (initialData?.todosLosArchivos &&
                          Array.isArray(initialData.todosLosArchivos) &&
                          initialData.todosLosArchivos.some(
                            (archivo) =>
                              archivo.is_calculation_sheet === true ||
                              (archivo.name &&
                                archivo.name.startsWith("Hoja de Cálculo - "))
                          )) ||
                        (initialData?.todosLosArchivos &&
                          isSeparatedFilesStructure(
                            initialData.todosLosArchivos
                          ) &&
                          initialData.todosLosArchivos.hoja_calculo &&
                          initialData.todosLosArchivos.hoja_calculo.length > 0)
                      );
                    })() && (
                      <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-200">
                        <FileText className="w-4 h-4 text-[#4178D4]" />
                        <span className="text-sm truncate">
                          {formData.hojaCalculo instanceof File
                            ? formData.hojaCalculo.name
                            : formData.hojaCalculo &&
                              typeof formData.hojaCalculo === "string"
                            ? formData.hojaCalculo
                            : initialData?.hojaCalculo &&
                              typeof initialData.hojaCalculo === "string"
                            ? initialData.hojaCalculo
                            : formData.todosLosArchivos &&
                              Array.isArray(formData.todosLosArchivos)
                            ? formData.todosLosArchivos.find(
                                (archivo) =>
                                  archivo.is_calculation_sheet === true
                              )?.name ||
                              formData.todosLosArchivos
                                .find((archivo) =>
                                  archivo.name?.startsWith("Hoja de Cálculo - ")
                                )
                                ?.name?.replace("Hoja de Cálculo - ", "") ||
                              "Hoja de cálculo"
                            : formData.todosLosArchivos &&
                              isSeparatedFilesStructure(
                                formData.todosLosArchivos
                              ) &&
                              formData.todosLosArchivos.hoja_calculo
                            ? formData.todosLosArchivos.hoja_calculo[0]?.name?.replace(
                                "Hoja de Cálculo - ",
                                ""
                              ) || "Hoja de cálculo"
                            : initialData?.todosLosArchivos &&
                              Array.isArray(initialData.todosLosArchivos)
                            ? initialData.todosLosArchivos.find(
                                (archivo) =>
                                  archivo.is_calculation_sheet === true
                              )?.name ||
                              initialData.todosLosArchivos
                                .find((archivo) =>
                                  archivo.name?.startsWith("Hoja de Cálculo - ")
                                )
                                ?.name?.replace("Hoja de Cálculo - ", "") ||
                              "Hoja de cálculo"
                            : initialData?.todosLosArchivos &&
                              isSeparatedFilesStructure(
                                initialData.todosLosArchivos
                              ) &&
                              initialData.todosLosArchivos.hoja_calculo
                            ? initialData.todosLosArchivos.hoja_calculo[0]?.name?.replace(
                                "Hoja de Cálculo - ",
                                ""
                              ) || "Hoja de cálculo"
                            : "Hoja de cálculo"}
                        </span>
                        <button
                          type="button"
                          onClick={handleDownloadHojaCalculo}
                          className="text-[#4178D4] hover:text-[#34509F] p-1 ml-auto"
                          title="Descargar hoja de cálculo"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
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
                      disabled={readOnly}
                    />
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
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
                    disabled={readOnly}
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
                    disabled={readOnly}
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
                    disabled={readOnly}
                  />
                </div>
              </div>
            </div>
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
                disabled={readOnly}
              >
                <option value="">Seleccionar...</option>
                <option value="50%,30%,20%">50%, 30%, 20%</option>
                <option value="50%,50%">50%, 50%</option>
                <option value="Personalizado en observaciones">
                  Personalizado en observaciones
                </option>
              </select>
            </div>
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
                disabled={readOnly}
              />
            </div>

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
                  disabled={readOnly}
                  className="hidden"
                />
                <label
                  htmlFor="archivosAdjuntos"
                  className="inline-flex items-center gap-2 px-3.5 py-2 border border-[#4178D4] rounded-md bg-white text-[#4178D4] hover:bg-blue-50"
                  style={{ display: readOnly ? "none" : "flex" }}
                >
                  <Upload className="w-4 h-4" />
                  <span>Adjuntar archivos</span>
                </label>
                {formData.archivosAdjuntos.length > 0 ? (
                  <div className="w-full mt-2 space-y-2">
                    {" "}
                    {formData.archivosAdjuntos.map((file, index) => {
                      // Determinar el nombre del archivo según sea un objeto File o string
                      const displayName =
                        file instanceof File ? file.name : file;

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[#4178D4]" />
                            <span className="text-sm text-gray-600 truncate max-w-[250px]">
                              {displayName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (file instanceof File) {
                                  // Para archivos locales, crear una URL temporal
                                  const fileURL = URL.createObjectURL(file);
                                  downloadFile(fileURL, file.name);
                                  setTimeout(
                                    () => URL.revokeObjectURL(fileURL),
                                    3000
                                  );
                                } else {
                                  // Para archivos del servidor
                                  handleDownloadFile(file);
                                }
                              }}
                              className="text-[#4178D4] hover:text-[#34509F] p-1"
                              title="Descargar archivo"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            {!readOnly && (
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(displayName)}
                                className="text-gray-400 hover:text-red-500 p-1"
                                title="Eliminar archivo"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Adjunte planos, fichas técnicas u otros documentos
                    relevantes
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-center mb-6">
              <button
                type="button"
                onClick={handleGenerarCotizacion}
                className="inline-flex items-center gap-2 px-6 py-3 border border-[#4178D4] rounded-lg bg-white text-[#4178D4] hover:bg-blue-50 transition-colors"
              >
                <FileText className="w-5 h-5" />
                <span className="text-base">Generar cotización</span>
              </button>
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
                INFORMACIÓN DE COTIZACIÓN
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Detalles de la cotización del proyecto
              </p>
            </div>

            {/* Panel principal con estilo consistente con el resto del formulario */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5 hover:shadow-md transition-all">
              {/* Badge de estado */}
              <div
                className={`inline-flex items-center px-3 py-1.5 rounded-full mb-4 ${
                  formData.estado === "aprobado"
                    ? "bg-green-100 text-green-800"
                    : formData.estado === "rechazado"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {formData.estado === "aprobado" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-5 h-5 mr-1.5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {formData.estado === "rechazado" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-5 h-5 mr-1.5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {formData.estado === "pendiente" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-5 h-5 mr-1.5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                <span className="font-semibold text-sm">
                  {formData.estado
                    ? formData.estado.toUpperCase()
                    : "PENDIENTE"}
                </span>
              </div>

              {/* Resumen de la cotización */}
              <div
                className={`p-4 rounded-lg mb-5 ${
                  formData.estado === "aprobado"
                    ? "bg-green-50 border border-green-100"
                    : formData.estado === "rechazado"
                    ? "bg-red-50 border border-red-100"
                    : "bg-gray-50 border border-gray-100"
                }`}
              >
                <h4
                  className={`font-semibold mb-2 ${
                    formData.estado === "aprobado"
                      ? "text-green-700"
                      : formData.estado === "rechazado"
                      ? "text-red-700"
                      : "text-gray-700"
                  }`}
                >
                  Resumen de la cotización
                </h4>
                <p className="text-gray-600 text-sm">
                  {formData.estado === "aprobado"
                    ? "Tu oferta ha sido aprobada. A continuación encontrarás los detalles de la cotización."
                    : formData.estado === "rechazado"
                    ? "Lo sentimos, tu oferta no ha sido aprobada. A continuación encontrarás los comentarios del cotizador."
                    : "Estado de la cotización pendiente"}
                </p>
              </div>

              {/* Información detallada */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna 1 */}
                <div>
                  {formData.fechaCotizacion && (
                    <div className="mb-4 transition-all duration-300 hover:shadow-sm rounded-lg p-0.5">
                      <label className="block mb-1.5 font-medium text-gray-700">
                        Fecha de cotización
                      </label>
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg w-full">
                        <div className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-5 h-5 mr-2 text-[#4178D4]"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {formData.fechaCotizacion}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Columna 2 */}
                <div>
                  {formData.archivoCotizacion && (
                    <div className="mb-4 transition-all duration-300 hover:shadow-sm rounded-lg p-0.5">
                      <label className="block mb-1.5 font-medium text-gray-700">
                        Archivo de cotización
                      </label>
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg w-full">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-5 h-5 mr-2 text-[#4178D4]"
                            >
                              <path
                                fillRule="evenodd"
                                d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zM10 8a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5A.75.75 0 0110 8z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-sm text-gray-600 truncate max-w-[200px]">
                              {
                              //@ts-ignore
                              formData.archivoCotizacion instanceof File
                                ? formData.archivoCotizacion.name
                                : typeof formData.archivoCotizacion ===
                                    "string" && formData.archivoCotizacion
                                ? formData.archivoCotizacion.split("/").pop() ||
                                  formData.archivoCotizacion
                                    .split("\\")
                                    .pop() ||
                                  "Archivo de cotización"
                                : "Archivo de cotización"}
                            </span>
                          </div>{" "}
                          <div className="flex">
                            <button
                              type="button"
                              onClick={handleDownloadCotizacion}
                              className="text-[#4178D4] hover:text-[#34509F] p-1 flex items-center"
                              title="Descargar cotización"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-5 h-5"
                              >
                                <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                                <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                              </svg>
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
                                  className="text-[#4178D4] hover:text-[#34509F] p-1 flex items-center"
                                  title="Ver archivo"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="w-5 h-5"
                                  >
                                    <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                                    <path
                                      fillRule="evenodd"
                                      d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </a>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Comentarios de cotización */}
            {formData.comentarioCotizacion && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6 hover:shadow-md transition-all">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-5 h-5 mr-2 text-[#4178D4]"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902 1.168.188 2.352.327 3.55.414.28.02.521.18.642.413l1.713 3.293a.75.75 0 001.33 0l1.713-3.293a.783.783 0 01.642-.413 45.273 45.273 0 003.55-.414c1.437-.231 2.43-1.49 2.43-2.902V5.426c0-1.413-.993-2.67-2.43-2.902A46.45 46.45 0 0010 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Comentarios del cotizador
                </h4>
                <div
                  className={`p-4 rounded-lg whitespace-pre-wrap ${
                    formData.estado === "aprobado"
                      ? "bg-green-50 border border-green-100 text-green-800"
                      : formData.estado === "rechazado"
                      ? "bg-red-50 border border-red-100 text-red-800"
                      : "bg-gray-50 border border-gray-100 text-gray-700"
                  }`}
                >
                  {formData.comentarioCotizacion}
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100">
      {" "}
      <div
        className={`flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white ${headerZIndex} rounded-t-xl`}
      >
        <div className="flex items-center">
          <FileText className="w-6 h-6 text-[#4178D4] mr-2" />
          <h2 className="text-xl md:text-2xl font-bold text-[#34509F]">
            {readOnly ? "DETALLES DE LA COTIZACIÓN" : "NUEVA COTIZACIÓN"}
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
              // Botón siguiente para pasos 1 y 2
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center justify-center gap-2 px-8 py-2.5 bg-[#4178D4] text-white font-medium rounded-lg hover:bg-[#34509F] transition-colors cursor-pointer"
              >
                Siguiente
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : currentStep === 3 ? (
              // En el paso 3, mostrar botón de guardar oferta o pasar a info de cotización
              shouldShowCotizacionStep() ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="flex items-center justify-center gap-2 px-8 py-2.5 bg-[#4178D4] text-white font-medium rounded-lg hover:bg-[#34509F] transition-colors cursor-pointer"
                >
                  Ver info. de cotización
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex items-center justify-center gap-2 px-8 py-2.5 bg-[#4178D4] text-white font-medium rounded-lg hover:bg-[#34509F] hover:shadow-lg transition cursor-pointer"
                  disabled={readOnly}
                >
                  <CheckCircle className="w-5 h-5" />
                  Guardar oferta
                </button>
              )
            ) : (
              // En el paso 4, botón de cerrar si estamos viendo info de cotización
              <button
                type="button"
                onClick={onCancel}
                className="flex items-center justify-center gap-2 px-8 py-2.5 bg-[#4178D4] text-white font-medium rounded-lg hover:bg-[#34509F] hover:shadow-lg transition cursor-pointer"
              >
                <CheckCircle className="w-5 h-5" />
                Cerrar
              </button>
            )}
          </div>{" "}
        </div>{" "}
      </form>{" "}
    </div>
  );
};

export default NuevaOfertaForm;
