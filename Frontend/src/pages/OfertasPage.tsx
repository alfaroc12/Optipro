import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  Check,
  Info,
  X,
  FileText,
  Filter,
  ChevronDown,
  Search,
  Download,
  Plus,
  RefreshCw,
  Clock,
  Loader,
  ChevronLeft,
  MessageSquare,
} from "lucide-react";
import { RootState } from "@/store/store";
import {
  addOffer,
  setOffers,
  Oferta as OfertaStore,
} from "@/store/slices/offersSlice";
import Layout from "@/components/layout/layout";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import VisitaTecnicaForm from "@/components/modals/VisitaTecnicaForm";
import NuevaOfertaForm from "@/components/modals/NuevaOfertaForm";
import ChatWall from "@/components/chat/ChatWall";


// @ts-ignore
type Oferta = OfertaStore;

interface VisitaTecnicaFormData {
  // ...tus campos aquí si usas este formulario
}

interface NuevaOfertaFormData {
  id?: number; // ID de la oferta en el backend
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
  // Otros campos existentes
  nombreCliente: string; // Se mantiene temporalmente para compatibilidad
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
  equipamiento: {
    // Aquí van todos los campos del equipamiento
    [key: string]: any;
  };
  user_id?: number;
  person_id?: number;
  valorTotal: number;
  // Campos adicionales
  formaPago?: string;
  validezOferta?: number;
  plazoEntrega?: number;
  garantia?: string;
  observaciones?: string;
  archivosAdjuntos?: string[];
  hojaCalculo?: string | File;
  comentarios?: string;
  // Campos adicionales para manejar archivos
  archivosAdjuntosInfo?: any[]; // Información completa sobre los archivos adjuntos
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
  // Campos de cotización
  estado?: "aprobado" | "rechazado" | "pendiente";
  estadoCotizacion?: string;
  comentarioCotizacion?: string;
  cotizador?: string;
  archivoCotizacion?: string;
  fechaCotizacion?: string;
}

// Función auxiliar para transformar una oferta a los datos del formulario
const ofertaToFormData = (oferta: OfertaStore): NuevaOfertaFormData => {
  // Verificar que la oferta no sea nula o indefinida
  if (!oferta) {
    console.error("Se intentó transformar una oferta nula o indefinida");
    // Devolver datos por defecto para evitar errores
    return {
      type_identification: "C.C" as "C.C" | "NIT",
      identification: "",
      firs_name: "",
      other_name: "",
      last_name: "",
      secon_surname: "",
      name: "",
      addres: "",
      phone: "",
      phone_2: "",
      nombreCliente: "",
      departamento: "",
      ciudad: "",
      fechaVisitaComercial: new Date().toISOString().split("T")[0],
      tipoProyecto: "public",
      fechaInicio: new Date().toISOString().split("T")[0],
      descripcion: "",
      nitCC: "",
      representante: "",
      tipoSistema: "On-grid",
      potenciaKw: 0,
      tipoPotenciaPaneles: "",
      produccionEnergetica: 0,
      cantidadPaneles: 0,
      areaNecesaria: 0,
      tipoInstalacion: "Tejado",
      hojaCalculo: "",
      valorTotal: 0,
      plazoEntrega: 30,
      validezOferta: 15,
      garantia: "",
      formaPago: "",
      observaciones: "",
      archivosAdjuntosInfo: [],
      todosLosArchivos: [],
      archivosAdjuntos: [],
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
    };
  }
  // Verificar que el equipamiento existe
  const equipamientoData = oferta.equipamiento || ({} as Record<string, any>);

  // Inicializamos el equipamiento con valores predeterminados
  const equipamiento = {
    panelesSolares: equipamientoData.panelesSolares ?? false,
    estructurasMontaje: equipamientoData.estructurasMontaje ?? false,
    cableadoGabinete: equipamientoData.cableadoGabinete ?? false,
    legalizacionDisenos: equipamientoData.legalizacionDisenos ?? false,
    bateria: equipamientoData.bateria ?? false,
    inversor: equipamientoData.inversor ?? false,
    kit5kw: equipamientoData.kit5kw ?? false,
    kit8kw: equipamientoData.kit8kw ?? false,
    kit12kw: equipamientoData.kit12kw ?? false,
    kit15kw: equipamientoData.kit15kw ?? false,
    kit30kw: equipamientoData.kit30kw ?? false,
    microinversores: equipamientoData.microinversores ?? false,
    transporte: equipamientoData.transporte ?? false,
    manoDeObra: equipamientoData.manoDeObra ?? false,
    preciosPanelesSolares: equipamientoData.preciosPanelesSolares ?? 0,
    preciosEstructurasMontaje: equipamientoData.preciosEstructurasMontaje ?? 0,
    preciosCableadoGabinete: equipamientoData.preciosCableadoGabinete ?? 0,
    preciosLegalizacionDisenos:
      equipamientoData.preciosLegalizacionDisenos ?? 0,
    preciosBateria: equipamientoData.preciosBateria ?? 0,
    preciosInversor: equipamientoData.preciosInversor ?? 0,
    preciosKit5kw: equipamientoData.preciosKit5kw ?? 0,
    preciosKit8kw: equipamientoData.preciosKit8kw ?? 0,
    preciosKit12kw: equipamientoData.preciosKit12kw ?? 0,
    preciosKit15kw: equipamientoData.preciosKit15kw ?? 0,
    preciosKit30kw: equipamientoData.preciosKit30kw ?? 0,
    preciosMicroinversores: equipamientoData.preciosMicroinversores ?? 0,
    preciosTransporte: equipamientoData.preciosTransporte ?? 0,
    preciosManoDeObra: equipamientoData.preciosManoDeObra ?? 0,
  };
  return {
    type_identification: (oferta.type_identification as "C.C" | "NIT") || "C.C",
    identification: oferta.identification || "",
    firs_name: oferta.firs_name || "",
    other_name: oferta.other_name || "",
    last_name: oferta.last_name || "",
    secon_surname: oferta.secon_surname || "",
    name: oferta.name || "",
    addres: oferta.addres || "",
    phone: oferta.phone || "",
    phone_2: oferta.phone_2 || "",
    // Usar el nombre de oferta.name como nombreCliente
    nombreCliente: oferta.nombre || oferta.name || "",
    departamento: oferta.departamento || "",
    ciudad: oferta.ciudad || "",
    fechaVisitaComercial:
      oferta.fechaVisitaComercial || new Date().toISOString().split("T")[0],
    fechaInicio: oferta.fechaInicio || new Date().toISOString().split("T")[0],
    tipoProyecto: oferta.tipoProyecto || "private",
    descripcion: oferta.descripcion || "",
    nitCC: oferta.nitCC || oferta.identification || "",
    representante: oferta.representante || "",
    tipoSistema: oferta.tipoSistema || "On-grid",
    potenciaKw: oferta.potenciaKw || 0,
    tipoPotenciaPaneles: oferta.tipoPotenciaPaneles || "",
    produccionEnergetica: oferta.produccionEnergetica || 0,
    cantidadPaneles: oferta.cantidadPaneles || 0,
    areaNecesaria: oferta.areaNecesaria || 0,
    tipoInstalacion: oferta.tipoInstalacion || "Tejado",
    formaPago: oferta.formaPago || "50%,30%,20%",
    validezOferta: oferta.validezOferta || 15,
    plazoEntrega: oferta.plazoEntrega || 30,
    garantia: oferta.garantia || "5 años",
    observaciones: oferta.observaciones || "",
    equipamiento: equipamiento,
    valorTotal: oferta.valorTotal || 0,
    // Campos de usuario
    id: oferta.id, // Añadimos explícitamente el ID
    user_id: oferta.user_id || 1,
    person_id: oferta.person_id || 0, // Campos adicionales
    estado:
      (oferta.estado as "aprobado" | "rechazado" | "pendiente") || "pendiente",
    archivosAdjuntos: oferta.archivosAdjuntos || [],
    // Campos de hoja de cálculo y archivos
    hojaCalculo: oferta.hojaCalculo || "",
    todosLosArchivos: oferta.todosLosArchivos || [],
    archivosAdjuntosInfo: oferta.archivosAdjuntosInfo || [],
    // Campos de cotización
    comentarioCotizacion: oferta.comentarioCotizacion || "",
    cotizador: oferta.cotizador || "",
    archivoCotizacion: oferta.archivoCotizacion || "",
    fechaCotizacion: oferta.fechaCotizacion || "",
  };
};

const OfertasPage = () => {
  const allOfertas = useSelector((state: RootState) => state.offers.offers);
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();

  // Función para formatear valores monetarios
  const formatNumber = (value: number | string | undefined): string => {
    if (value === undefined || value === null) return "$0";

    // Convertir a número si es string
    const numValue = typeof value === "string" ? parseFloat(value) : value;

    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(numValue);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isVisitaTecnicaFormVisible, setIsVisitaTecnicaFormVisible] =
    useState(false);
  const [isNuevaOfertaFormVisible, setIsNuevaOfertaFormVisible] =
    useState(false);

  const [selectedOferta, setSelectedOferta] = useState<OfertaStore | null>(
    null
  );
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formInitialData, setFormInitialData] = useState<
    NuevaOfertaFormData | undefined
  >();

  const [showChatWall, setShowChatWall] = useState(false);
  const [selectedChatOferta, setSelectedChatOferta] =
    useState<OfertaStore | null>(null);

  // Efecto para escuchar eventos de navegación desde notificaciones
  useEffect(() => {
    const handleNotificationNavigation = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail) {
        const { params } = customEvent.detail;

        if (params.id) {
          // Buscar la oferta por ID en las ofertas cargadas
          const idNum =
            typeof params.id === "string" ? parseInt(params.id, 10) : params.id;
          const ofertaEncontrada = allOfertas.find((o: any) => o.id === idNum);

          if (ofertaEncontrada) {
            console.log(`Evento de navegación: Abriendo oferta #${idNum}`);

            // Manejar según el tipo de vista
            if (params.viewType === "form") {
              setSelectedOferta(ofertaEncontrada);
              setFormInitialData(ofertaToFormData(ofertaEncontrada));
              setIsNuevaOfertaFormVisible(true);
              setIsReadOnly(true);
              setIsEditMode(false);
            } else if (params.viewType === "chat") {
              setSelectedChatOferta(ofertaEncontrada);
              setShowChatWall(true);
            }
          }
        }
      }
    };

    window.addEventListener(
      "notificationNavigation",
      handleNotificationNavigation
    );

    return () => {
      window.removeEventListener(
        "notificationNavigation",
        handleNotificationNavigation
      );
    };
  }, [allOfertas]);

  // Cargar ofertas al iniciar
  // Obtener la ubicación actual para manejar navegación desde notificaciones
  const location = useLocation();

  useEffect(() => {
    const fetchOfertas = async () => {
      try {
        setIsLoading(true);
        // Importar el servicio de ofertas optimizado
        const ofertaServiceModule = await import(
          "@/services/ofertaServiceFixed"
        );
        const ofertaService = ofertaServiceModule.default;

        // Obtener ofertas del backend (la función de mapeo ya está incluida en el servicio)
        const ofertas = await ofertaService.getOfertas();

        // Actualizar el estado redux con las ofertas cargadas
        dispatch(setOffers(ofertas));

        // Verificar si hay datos de navegación desde una notificación
        if (location.state && location.state.fromNotification) {
          const { id, viewType } = location.state as {
            id: string | number;
            showDetail: boolean;
            viewType: string;
            fromNotification: boolean;
          };

          const idNum = typeof id === "string" ? parseInt(id, 10) : id;
          // Buscar la oferta por su ID numérico exacto
          const ofertaEncontrada = ofertas.find((o: any) => o.id === idNum);

          if (ofertaEncontrada) {
            console.log(
              `Abriendo oferta #${idNum} desde notificación con viewType: ${viewType}`
            );

            // Manejar distintos tipos de vistas según el tipo de notificación
            if (viewType === "form") {
              // Para formulario de oferta existente, no crear una nueva
              // Cargar la oferta completa con todos sus detalles
              try {
                // Importar el servicio de ofertas optimizado
                const ofertaServiceModule = await import(
                  "@/services/ofertaServiceFixed"
                );
                const ofertaService = ofertaServiceModule.default;

                // Obtener la oferta completa con todos sus archivos y detalles
                const ofertaCompleta = await ofertaService.getOferta(idNum);

                if (ofertaCompleta) {
                  console.log(
                    "Oferta completa cargada con archivos:",
                    ofertaCompleta
                  );
                  setSelectedOferta(ofertaCompleta);
                  const formData = ofertaToFormData(ofertaCompleta);
                  // Asegurarse que los archivos adjuntos y la hoja de cálculo estén incluidos
                  setFormInitialData(formData);
                  setIsNuevaOfertaFormVisible(true);
                  setIsReadOnly(true); // Modo de solo lectura para ver detalles
                  setIsEditMode(false);
                } else {
                  console.error(
                    `No se pudo cargar la oferta completa ${idNum}`
                  );
                  // Usar la versión básica si no se puede cargar la completa
                  setSelectedOferta(ofertaEncontrada);
                  setFormInitialData(ofertaToFormData(ofertaEncontrada));
                  setIsNuevaOfertaFormVisible(true);
                  setIsReadOnly(true);
                  setIsEditMode(false);
                }
              } catch (error) {
                console.error("Error al cargar oferta completa:", error);
                // En caso de error, usar la versión básica
                setSelectedOferta(ofertaEncontrada);
                setFormInitialData(ofertaToFormData(ofertaEncontrada));
                setIsNuevaOfertaFormVisible(true);
                setIsReadOnly(true);
                setIsEditMode(false);
              }
            } else if (viewType === "chat") {
              // Mostrar el chat de la oferta
              setSelectedChatOferta(ofertaEncontrada);
              setShowChatWall(true);
            }
          } else {
            console.warn(`Oferta con ID ${id} no encontrada`);
            toast.warning("No se encontró la oferta solicitada");
          }
        }
      } catch (error) {
        console.error("Error al cargar ofertas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOfertas();
  }, [dispatch, location]);

  // Filtrar ofertas según términos de búsqueda, filtros y usuario actual
  const filteredOfertas = allOfertas.filter((oferta) => {
    const matchesSearch =
      searchTerm === "" ||
      oferta.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      oferta.ciudad?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === null || oferta.estado === filterStatus;

    // Filtrar por usuario actual (solo mostrar las ofertas creadas por el usuario actual)
    const matchesUser =
      user?.role === "admin" ? true : oferta.user_id === user?.id;

    return matchesSearch && matchesStatus && matchesUser;
  });

  // Calcular el número total de páginas después del filtrado
  const filteredTotalPages = Math.ceil(filteredOfertas.length / itemsPerPage);

  // Calcular las ofertas a mostrar basadas en la página currentPage y elementos por página
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedOfertas = filteredOfertas.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleItemsPerPageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };
  const handleFilterChange = (status: string | null) => {
    setFilterStatus(status === filterStatus ? null : status);
    setCurrentPage(1);
  };
  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterStatus(null);
    setCurrentPage(1);
  };

  const isFilterActive = searchTerm !== "" || filterStatus !== null;

  const showVisitaTecnicaForm = () => setIsVisitaTecnicaFormVisible(true);
  const hideVisitaTecnicaForm = () => setIsVisitaTecnicaFormVisible(false);

  const showNuevaOfertaForm = () => {
    setSelectedOferta(null);
    setIsReadOnly(false);
    setIsEditMode(false);
    setFormInitialData(undefined);
    setIsNuevaOfertaFormVisible(true);
  };

  const hideNuevaOfertaForm = () => {
    setIsNuevaOfertaFormVisible(false);
    setSelectedOferta(null);
    setFormInitialData(undefined);
    setIsEditMode(false);
    setIsReadOnly(false);
  };
  const handleViewOferta = async (oferta: OfertaStore) => {
    try {
      setIsLoading(true);

      // Importar el servicio de ofertas optimizado dinámicamente
      const ofertaServiceModule = await import("@/services/ofertaServiceFixed");
      const ofertaService = ofertaServiceModule.default; // Obtener los detalles completos de la oferta desde el backend
      const ofertaDetalle = await ofertaService.getOferta(oferta.id);

      if (!ofertaDetalle) {
        throw new Error(
          `No se pudieron obtener los detalles de la oferta ${oferta.id}`
        );
      }

      // Actualizar el estado de la oferta seleccionada con los datos completos
      setSelectedOferta(ofertaDetalle);

      // Convertir datos al formato del formulario
      setFormInitialData(ofertaToFormData(ofertaDetalle));

      // Configurar el modo de visualización
      setIsReadOnly(true);
      setIsEditMode(false);
      setIsNuevaOfertaFormVisible(true);
    } catch (error) {
      console.error("Error al cargar detalles de la oferta:", error);
      toast.error("No se pudieron cargar los detalles de la oferta");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNuevaOfertaSubmit = async (formData: NuevaOfertaFormData) => {
    try {
      // Verificar si hay al menos un producto seleccionado en el equipamiento
      const selectedProducts = Object.entries(formData.equipamiento).filter(
        ([key, value]) =>
          key.indexOf("paneles") === -1 &&
          key.indexOf("precios") === -1 &&
          value === true
      );

      if (selectedProducts.length === 0) {
        toast.error("Debe seleccionar al menos un producto para la oferta");
        return;
      } // Añadir ID del usuario actual
      formData.user_id = user?.id || 0;

      // Verificar y asegurar que tenemos un nombre de cliente
      let formattedData = { ...formData };

      // Si no tenemos name pero sí nombreCliente, lo usamos
      if (!formattedData.name && formattedData.nombreCliente) {
        formattedData.name = formattedData.nombreCliente;
      }

      // Si tenemos nombres individuales, construimos el nombre completo
      if (
        !formattedData.name &&
        (formattedData.firs_name || formattedData.last_name)
      ) {
        formattedData.name = [
          formattedData.firs_name || "",
          formattedData.other_name || "",
          formattedData.last_name || "",
          formattedData.secon_surname || "",
        ]
          .filter(Boolean)
          .join(" ");
      }

      // Importar el servicio de ofertas optimizado dinámicamente
      const ofertaServiceModule = await import("@/services/ofertaServiceFixed");
      const ofertaService = ofertaServiceModule.default;

      if (isEditMode && selectedOferta && selectedOferta.id) {
        // Actualizar oferta existente
        const updatedOferta = await ofertaService.updateOferta(
          selectedOferta.id,
          formattedData
        );

        // Actualizar la oferta en el Redux store
        dispatch(addOffer(updatedOferta));
      } else {
        // Crear nueva oferta
        const response = await ofertaService.createOferta(formattedData);

        // El servicio ya se encarga de mapear la respuesta del backend al formato del frontend
        dispatch(addOffer(response));
      }

      // Cerrar el formulario
      hideNuevaOfertaForm();

      // Mostrar notificación de éxito
      toast.success("Oferta guardada exitosamente");
    } catch (error) {
      console.error("Error al guardar la oferta:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error desconocido al guardar la oferta"
      );
    }
  };

  const handleVisitaTecnicaSubmit = (_formData: VisitaTecnicaFormData) => {
    // Implementar lógica para manejar el envío del formulario de visita técnica
    hideVisitaTecnicaForm();
  };

  const getStatusStyles = (estado: string) => {
    switch (estado) {
      case "aprobado":
        return "bg-green-100 text-green-800";
      case "rechazado":
        return "bg-red-100 text-red-800";
      case "pendiente":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  const handleNombreClick = (oferta: OfertaStore) => {
    if (
      oferta.estado === "aprobado" ||
      oferta.estado === "rechazado" ||
      user?.role === "admin"
    ) {
      setSelectedChatOferta(oferta);
      setShowChatWall(true);
    }
  };

  const generatePaginationLinks = () => {
    let pages = [];
    const totalPagesToUse = filteredTotalPages;

    // Siempre incluir la primera página
    pages.push(
      <PaginationItem key="page-1">
        <PaginationLink
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handlePageChange(1);
          }}
          isActive={currentPage === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    // Para pocas páginas, mostrar todas
    if (totalPagesToUse <= 5) {
      for (let i = 2; i <= totalPagesToUse; i++) {
        pages.push(
          <PaginationItem key={`page-${i}`}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(i);
              }}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      // Para muchas páginas, mostrar un rango alrededor de la página actual
      if (currentPage > 3) {
        pages.push(
          <PaginationItem key="start-ellipsis">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      const startPage = Math.max(2, currentPage - 1);
      const endPage = Math.min(totalPagesToUse - 1, currentPage + 1);

      for (let i = startPage; i <= endPage; i++) {
        pages.push(
          <PaginationItem key={`page-${i}`}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(i);
              }}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPagesToUse - 2) {
        pages.push(
          <PaginationItem key="end-ellipsis">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Siempre incluir la última página si hay más de una página
      if (totalPagesToUse > 1) {
        pages.push(
          <PaginationItem key={`page-${totalPagesToUse}`}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(totalPagesToUse);
              }}
              isActive={currentPage === totalPagesToUse}
            >
              {totalPagesToUse}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return pages;
  };

  return (
    <Layout>
      <div className="flex-1 p-4 md:p-6 max-w-full bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen">
        {" "}
        {showChatWall && selectedChatOferta ? (
          <div className="w-full">
            <div className="flex flex-col space-y-6">
              <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/60">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setShowChatWall(false)}
                    className="flex items-center gap-3 text-[#4178D4] hover:text-[#2d5aa8] font-medium py-2 px-4 rounded-xl hover:bg-blue-50 transition-all duration-200"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Volver a la lista
                  </button>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-bold text-[#34509F] mb-1">
                    Chat: {selectedChatOferta.nombre || "Sin nombre"}
                  </h2>
                  <p className="text-sm text-gray-500">
                    ID: #{selectedChatOferta.id?.toString().padStart(3, "0")} |
                    Estado:{" "}
                    <span
                      className={`font-medium ${
                        selectedChatOferta.estado === "aprobado"
                          ? "text-green-600"
                          : selectedChatOferta.estado === "pendiente"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {selectedChatOferta.estado}
                    </span>
                  </p>
                </div>
              </div>
              <ChatWall
                cotizacionId={selectedChatOferta.id.toString()}
                cotizacionData={selectedChatOferta}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[#34509F] mb-2 flex items-center gap-2">
                    <FileText className="inline-block h-6 w-6 md:h-8 md:w-8" />
                    GESTIÓN DE OFERTAS
                  </h1>
                  {!isVisitaTecnicaFormVisible && (
                    <p className="text-gray-500 text-sm text-left">
                      Total: {filteredOfertas.length} ofertas{" "}
                      {isFilterActive ? "(filtradas)" : ""}
                    </p>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-[#4178D4] rounded-lg bg-white text-[#4178D4] hover:bg-blue-50 transition-colors shadow-sm cursor-pointer"
                    onClick={showVisitaTecnicaForm}
                  >
                    <span className="font-bold text-sm whitespace-nowrap">
                      VISITA TÉCNICA
                    </span>
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-[#4178D4] rounded-lg bg-[#4178D4] text-white hover:bg-[#34509F] transition-colors shadow-sm cursor-pointer"
                    onClick={showNuevaOfertaForm}
                  >
                    <span className="font-bold text-sm whitespace-nowrap">
                      COTIZACIÓN
                    </span>
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            {isVisitaTecnicaFormVisible ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <VisitaTecnicaForm
                  onSubmit={handleVisitaTecnicaSubmit}
                  onCancel={hideVisitaTecnicaForm}
                />
              </div>
            ) : isNuevaOfertaFormVisible ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <NuevaOfertaForm
                  //@ts-ignore
                  onSubmit={handleNuevaOfertaSubmit}
                  onCancel={hideNuevaOfertaForm}
                  //@ts-ignore
                  initialData={formInitialData}
                  readOnly={isReadOnly}
                  isEditMode={isEditMode}
                />
              </div>
            ) : (
              <div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 p-4">
                  <div className="flex flex-wrap gap-3 justify-between items-center">
                    <div className="flex flex-1 min-w-[180px] md:max-w-xs">
                      <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <Search className="w-4 h-4 text-gray-500" />
                        </div>
                        <input
                          type="text"
                          value={searchTerm}
                          onChange={handleSearchChange}
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-[#4178D4] focus:border-[#4178D4] block w-full pl-10 p-2.5"
                          placeholder="Buscar ofertas..."
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div
                        className="inline-flex rounded-md shadow-sm"
                        role="group"
                      >
                        <button
                          onClick={() => handleFilterChange("aprobado")}
                          className={`px-3 py-2 text-xs font-medium rounded-l-lg border ${
                            filterStatus === "aprobado"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-white border-gray-200 text-gray-900 hover:bg-gray-100"
                          }`}
                        >
                          <Check className="w-4 h-4 inline-block mr-1" />
                          Aprobadas
                        </button>
                        <button
                          onClick={() => handleFilterChange("rechazado")}
                          className={`px-3 py-2 text-xs font-medium border-l-0 border-r-0 border ${
                            filterStatus === "rechazado"
                              ? "bg-red-100 text-red-800 border-red-200"
                              : "bg-white border-gray-200 text-gray-900 hover:bg-gray-100"
                          }`}
                        >
                          <X className="w-4 h-4 inline-block mr-1" />
                          Rechazadas
                        </button>
                        <button
                          onClick={() => handleFilterChange("pendiente")}
                          className={`px-3 py-2 text-xs font-medium rounded-r-lg border ${
                            filterStatus === "pendiente"
                              ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                              : "bg-white border-gray-200 text-gray-900 hover:bg-gray-100"
                          }`}
                        >
                          <Clock className="w-4 h-4 inline-block mr-1" />
                          Pendientes
                        </button>
                      </div>
                      {isFilterActive && (
                        <button
                          onClick={handleClearFilters}
                          className="flex items-center px-3 py-2 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-900 hover:bg-gray-100"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Limpiar
                        </button>
                      )}
                      <button className="flex items-center px-3 py-2 text-xs font-medium rounded-lg border border-[#4178D4] bg-white text-[#4178D4] hover:bg-blue-50">
                        <Download className="w-4 h-4 mr-1" />
                        Exportar
                      </button>
                    </div>
                  </div>
                </div>
                <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100">
                  {displayedOfertas.length > 0 ? (
                    <div>
                      <div className="overflow-x-auto w-full">
                        <div className="max-h-[65vh] overflow-y-auto scrollbar-none scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                          <table className="w-full min-w-[800px]">
                            <thead className="sticky top-0 bg-white">
                              <tr className="border-b border-[#4178D4]/30 bg-blue-50/50">
                                <th className="py-4 px-4 text-left text-[#34509F] font-bold whitespace-nowrap">
                                  <div className="flex items-center gap-1">
                                    ID
                                    <ChevronDown className="w-4 h-4 opacity-50" />
                                  </div>
                                </th>
                                <th className="py-4 px-4 text-left text-[#34509F] font-bold whitespace-nowrap">
                                  <div className="flex items-center gap-1">
                                    Nombre
                                    <ChevronDown className="w-4 h-4 opacity-50" />
                                  </div>
                                </th>
                                <th className="py-4 px-4 text-left text-[#34509F] font-bold whitespace-nowrap">
                                  Ciudad
                                </th>
                                <th className="py-4 px-4 text-left text-[#34509F] font-bold whitespace-nowrap">
                                  Fecha emisión
                                </th>
                                <th className="py-4 px-4 text-left text-[#34509F] font-bold whitespace-nowrap">
                                  Potencia (Kw)
                                </th>
                                <th className="py-4 px-4 text-left text-[#34509F] font-bold whitespace-nowrap">
                                  Valor ($)
                                </th>
                                <th className="py-4 px-4 text-left text-[#34509F] font-bold whitespace-nowrap">
                                  Validez (días)
                                </th>
                                <th className="py-4 px-4 text-center text-[#34509F] font-bold whitespace-nowrap">
                                  Estado
                                </th>
                                <th className="py-4 px-4 text-center text-[#34509F] font-bold whitespace-nowrap">
                                  Acciones
                                </th>
                              </tr>
                            </thead>
                            <tbody className="text-left">
                              {displayedOfertas.map((oferta, index) => (
                                <tr
                                  key={oferta.id}
                                  className={`border-b border-gray-100 hover:bg-blue-50/30 transition-colors cursor-pointer ${
                                    index % 2 === 0
                                      ? "bg-white"
                                      : "bg-slate-50/30"
                                  }`}
                                >
                                  <td className="py-3 px-4 whitespace-nowrap font-medium text-[#34509F]">
                                    #
                                    {oferta.id !== undefined &&
                                    oferta.id !== null
                                      ? oferta.id.toString().padStart(3, "0")
                                      : "000"}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span
                                      className={`
                                        inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                                        ${oferta.estado === "aprobado" ? "bg-green-100 text-green-800" : ""}
                                        ${oferta.estado === "rechazado" ? "bg-red-100 text-red-800" : ""}
                                        ${oferta.estado === "pendiente" ? "bg-yellow-100 text-yellow-800" : ""}
                                      `}
                                    >
                                      {oferta.estado === "aprobado" && (
                                        <Check className="w-3 h-3 mr-1" />
                                      )}
                                      {oferta.estado === "rechazado" && (
                                        <X className="w-3 h-3 mr-1" />
                                      )}
                                      {oferta.estado === "pendiente" && (
                                        <Clock className="w-3 h-3 mr-1" />
                                      )}
                                      {oferta.estado.charAt(0).toUpperCase() + oferta.estado.slice(1)}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-gray-600">
                                    {oferta.ciudad || "Sin ciudad"}
                                  </td>
                                  <td className="py-3 px-4 text-gray-600">
                                    {oferta.fechaEmision || "Sin fecha"}
                                  </td>
                                  <td className="py-3 px-4 text-gray-600">
                                    {oferta.potencia !== null
                                      ? `${oferta.potencia} kW`
                                      : "-"}
                                  </td>
                                  <td className="py-3 px-4 text-gray-600">
                                    {formatNumber(oferta.valor)}
                                  </td>
                                  <td className="py-3 px-4 text-gray-600">
                                    {oferta.validez !== null
                                      ? `${oferta.validez} días`
                                      : "-"}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span
                                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusStyles(
                                        oferta.estado
                                      )}`}
                                    >
                                      {oferta.estado.charAt(0).toUpperCase() +
                                        oferta.estado.slice(1)}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-center flex gap-2 justify-center">
                                    {/* Ver */}
                                    <button
                                      className="text-[#4178D4] hover:text-[#34509F]"
                                      onClick={() => handleViewOferta(oferta)}
                                    >
                                      <Info className="w-5 h-5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      {/* Controles de paginación y registros por página */}
                      <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-gray-200 gap-4 bg-gray-50/50">
                        {/* Selector de items por página */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            Mostrando{" "}
                            {Math.min(startIndex + 1, filteredOfertas.length)} -{" "}
                            {Math.min(
                              startIndex + itemsPerPage,
                              filteredOfertas.length
                            )}{" "}
                            de {filteredOfertas.length} registros
                          </span>
                          <select
                            id="itemsPerPage"
                            value={itemsPerPage}
                            onChange={handleItemsPerPageChange}
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white"
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                          </select>
                          <span className="text-sm text-gray-600 hidden sm:inline">
                            por página
                          </span>
                        </div>

                        {/* Implementación del componente de paginación de shadcn/ui */}
                        <Pagination className="mt-2 sm:mt-0 sm:ml-auto flex justify-center sm:justify-end">
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (currentPage > 1)
                                    handlePageChange(currentPage - 1);
                                }}
                                className={
                                  currentPage === 1
                                    ? "pointer-events-none opacity-50"
                                    : ""
                                }
                              />
                            </PaginationItem>

                            {generatePaginationLinks()}

                            <PaginationItem>
                              <PaginationNext
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  if (currentPage < filteredTotalPages)
                                    handlePageChange(currentPage + 1);
                                }}
                                className={
                                  currentPage === filteredTotalPages
                                    ? "pointer-events-none opacity-50"
                                    : ""
                                }
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    </div>
                  ) : isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                      <Loader className="w-12 h-12 text-[#4178D4] mb-4 animate-spin" />
                      <p className="text-gray-500 text-center">
                        Cargando ofertas...
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64">
                      <Filter className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-gray-500 text-center">
                        No se encontraron ofertas que coincidan con los
                        criterios de búsqueda.
                      </p>
                      {isFilterActive && (
                        <button
                          onClick={handleClearFilters}
                          className="mt-4 flex items-center gap-2 text-[#4178D4] hover:text-[#34509F]"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Limpiar filtros
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default OfertasPage;
