import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { RootState } from "@/store/store";
import { addOffer, removeOffer, setOffers } from "@/store/slices/offersSlice";
import { downloadFile, getCorrectMediaUrl } from "@/utils/fileUtils";
import { toast } from "react-toastify";
import {
  Check,
  Info,
  X,
  FileText,
  Filter,
  Search,
  Download,
  Plus,
  RefreshCw,
  Clock,
  Pencil,
  Trash2,
  ChevronLeft,
  MessageSquare,
  Loader,
  CheckCircle,
} from "lucide-react";
import Layout from "@/components/layout/Admin/layout";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import AdminNuevaOfertaForm from "@/components/modals/Admin/AdminNuevaOfertaForm";
import ChatWall from "@/components/chat/ChatWall";
import ConfirmDeleteOfertaModal from "@/components/modals/Admin/ConfirmDeleteOfertaModal";
import VisitaTecnicaForm from "@/components/modals/VisitaTecnicaForm";

interface Oferta {
  type_identification: "C.C" | "NIT";
  identification: string | undefined;
  firs_name: string;
  other_name: string;
  last_name: string;
  secon_surname: string;
  name: string;
  addres: string;
  phone: string;
  phone_2: string;
  id: number;
  nombre: string;
  departamento?: string;
  ciudad: string;
  fechaEmision: string;
  potencia: number | null;
  valor: string;
  validez: number | null;
  estado: "rechazado" | "pendiente" | "aprobado";
  comentarios?: string;
  cotizador?: string;
  archivoCotizacion?: string;

  // Datos de la visita técnica asociada
  technical_visit_details?: any;

  // Campos extendidos para detalles completos de la oferta
  fechaVisitaComercial?: string;
  tipoProyecto?: string;
  codigoVT?: string;
  fechaInicio?: string;
  descripcion?: string;
  nitCC?: string;
  representante?: string;
  tipoSistema?: string;
  tipoPotenciaPaneles?: string;
  produccionEnergetica?: number;
  cantidadPaneles?: number;
  areaNecesaria?: number;
  tipoInstalacion?: string;
  equipamiento?: {
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
    preciosPanelesSolares?: number;
    preciosEstructurasMontaje?: number;
    preciosCableadoGabinete?: number;
    preciosLegalizacionDisenos?: number;
    preciosBateria?: number;
    preciosInversor?: number;
    preciosKit5kw?: number;
    preciosKit8kw?: number;
    preciosKit12kw?: number;
    preciosKit15kw?: number;
    preciosKit30kw?: number;
    preciosMicroinversores?: number;
    preciosTransporte?: number;
    preciosManoDeObra?: number;
  };
  hojaCalculo?: string;
  valorTotal?: number;
  plazoEntrega?: number;
  garantia?: string;
  formaPago?: string;
  observaciones?: string;
  archivosAdjuntos?: (string | File)[];

  // Campos para backend
  user_id?: number;
  person_id?: number;
  archivosAdjuntosInfo?: any[];
  todosLosArchivos?: any;
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

  // Campo para el código de oferta requerido por el backend
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
  estado?: "rechazado" | "pendiente" | "aprobado";
  estadoCotizacion?: string;
  comentarioCotizacion?: string;
  cotizador?: string;
  archivoCotizacion?: string | File;
  fechaCotizacion?: string;
}

interface VisitaTecnicaFormData {
  nombre: string;
  apellidos: string;
  departamento: string;
  ciudad: string;
  telefono: string;
  nitcc: string;
  nombreEmpresa: string;
  direccion: string;
  fechaVisita: string;
  horaInicio: string;
  horaFin: string;
  tipoMedida: string;
  comentariosTipoMedida: string;
  sistemaPuestaTierra: string;
  comentariosSistemaPuestaTierra: string;
  disponibilidadSitio: string;
  comentariosDisponibilidadSitio: string;
  condicionesAcceso: string;
  comentariosCondicionesAcceso: string;
  verificacionAerea: string;
  comentariosVerificacionAerea: string;
  copiaFactura: string;
  comentariosCopiaFactura: string;
  conceptoVisitante: string;
  observacionesAdicionales: string;
  evidenciaFotografica: string | string[] | null;
}

const AdminOfertasPage = () => {
  // Usar Redux para obtener las ofertas
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

  // Estado para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Estados para el manejo de ChatWall
  const [showChatWall, setShowChatWall] = useState(false);
  const [selectedChatOferta, setSelectedChatOferta] = useState<Oferta | null>(
    null
  );

  // Estado para el filtrado y búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  // Estado para controlar la visualización del formulario de Visita Técnica
  const [isVisitaTecnicaFormVisible, setIsVisitaTecnicaFormVisible] =
    useState<boolean>(false);

  // Estado para controlar la visualización del formulario de Nueva Oferta
  const [isNuevaOfertaFormVisible, setIsNuevaOfertaFormVisible] =
    useState<boolean>(false);

  // Estado para almacenar la oferta seleccionada para ver/editar
  const [selectedOffer, setSelectedOffer] = useState<Oferta | null>(null);

  // Estado para controlar la visualización del formulario de visita técnica
  const [isShowingVisitaTecnicaForm, setIsShowingVisitaTecnicaForm] =
    useState<boolean>(false);

  // Estado para el formulario inicial
  const [formInitialData, setFormInitialData] = useState<
    NuevaOfertaFormData | undefined
  >();

  // Estado para controlar si el formulario está en modo de solo lectura o edición parcial
  const [, setIsEditMode] = useState<boolean>(false);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);

  // Estado para controlar si el paso 4 es editable en modo lectura
  const [editableStep4, setEditableStep4] = useState<boolean>(false);

  // Estado para controlar la visualización del chat
  const [isChatVisible, setIsChatVisible] = useState<boolean>(false);

  // Efecto para escuchar eventos de navegación desde notificaciones
  useEffect(() => {
    const handleNotificationNavigation = async (event: Event) => {
      try {
        const customEvent = event as CustomEvent;
        console.log(
          "AdminOfertasPage: Evento notificationNavigation recibido",
          customEvent.detail
        );

        if (customEvent.detail) {
          const { params } = customEvent.detail;

          if (params && params.id) {
            // Buscar la oferta por ID en las ofertas cargadas
            const idNum =
              typeof params.id === "string"
                ? parseInt(params.id, 10)
                : params.id;
            let ofertaEncontrada = allOfertas.find((o: any) => o.id === idNum);

            if (!ofertaEncontrada) {
              console.log(
                `Oferta #${idNum} no encontrada en estado actual, intentando cargarla`
              );

              // Si no se encuentra en el estado, intentar cargarla directamente del servicio
              try {
                const ofertaServiceModule = await import(
                  "@/services/ofertaServiceFixed"
                );
                const ofertaService = ofertaServiceModule.default;
                const oferta = await ofertaService.getOferta(idNum);
                if (oferta) {
                  ofertaEncontrada = oferta;
                  // Actualizar el estado para incluir esta oferta
                  dispatch(addOffer(oferta));
                }
              } catch (error) {
                console.error("Error cargando oferta directamente:", error);
              }
            }

            if (ofertaEncontrada) {
              console.log(
                `AdminOfertasPage: Procesando oferta #${idNum} con viewType ${params.viewType}`
              );

              // Manejar según el tipo de vista
              if (params.viewType === "form") {
                // Asegurarse de que la vista de chat esté cerrada
                setShowChatWall(false);
                //@ts-ignore
                setSelectedOffer(ofertaEncontrada);

                // Cargar oferta completa con sus archivos
                const ofertaServiceModule = await import(
                  "@/services/ofertaServiceFixed"
                );
                const ofertaService = ofertaServiceModule.default;
                try {
                  const ofertaCompleta = await ofertaService.getOferta(idNum);

                  if (ofertaCompleta) {
                    console.log(
                      "AdminOfertasPage: Oferta completa cargada con archivos:",
                      ofertaCompleta
                    );
                    setFormInitialData({
                      ...ofertaCompleta,
                      nombreCliente: ofertaCompleta.nombre || "",
                    });
                  } else {
                    //@ts-ignore
                    setFormInitialData(
                      //@ts-ignore
                      ofertaToFormData({
                        ...ofertaEncontrada,
                      })
                    );
                  }

                  // Asegurarse de que no se muestre la visita técnica
                  setIsShowingVisitaTecnicaForm(false);
                  setIsReadOnly(true);

                  // Usar setTimeout para asegurar que los estados anteriores se apliquen primero
                  setTimeout(() => {
                    setIsNuevaOfertaFormVisible(true);
                    console.log(
                      "AdminOfertasPage: Formulario de oferta visible ahora"
                    );
                  }, 100);
                } catch (error) {
                  console.error("Error al cargar oferta completa:", error);
                  // Usar los datos disponibles si hay un error
                  //@ts-ignore
                  setFormInitialData({
                    ...ofertaEncontrada,
                    nombreCliente: ofertaEncontrada.nombre || "",
                  });
                  setIsShowingVisitaTecnicaForm(false);
                  setIsReadOnly(true);

                  setTimeout(() => {
                    setIsNuevaOfertaFormVisible(true);
                    console.log(
                      "AdminOfertasPage: Formulario de oferta visible (recuperación de error)"
                    );
                  }, 100);
                }
              } else if (params.viewType === "chat") {
                console.log(
                  "AdminOfertasPage: Abriendo vista de chat para oferta",
                  ofertaEncontrada
                );
                // Cerrar otras vistas primero
                setIsNuevaOfertaFormVisible(false);
                setIsVisitaTecnicaFormVisible(false);
                setIsShowingVisitaTecnicaForm(false);

                // Mostrar chat
                setSelectedChatOferta(ofertaEncontrada);
                setTimeout(() => {
                  setShowChatWall(true);
                  console.log("AdminOfertasPage: Chat wall visible ahora");
                }, 100);
              }
            } else {
              console.warn(
                `AdminOfertasPage: No se pudo encontrar la oferta con ID ${idNum}`
              );
              toast.warning("No se pudo encontrar la oferta solicitada");
            }
          } else {
            console.warn("AdminOfertasPage: Evento sin ID de oferta", params);
          }
        }
      } catch (error) {
        console.error("AdminOfertasPage: Error procesando notificación", error);
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

  // Estado para el modal de confirmación de eliminación
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    oferta: Oferta | null;
  }>({
    show: false,
    oferta: null,
  });

  // Obtener la ubicación actual para manejar navegación desde notificaciones
  const location = useLocation();

  // Cargar ofertas al iniciar y manejar navegación desde notificaciones
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
          console.log(
            "AdminOfertasPage: Detectada navegación desde notificación",
            location.state
          );
          const { id, showDetail, viewType } = location.state as {
            id: string | number;
            showDetail: boolean;
            viewType: string;
            fromNotification: boolean;
          };

          // Buscar la oferta en los datos cargados
          const idNum = typeof id === "string" ? parseInt(id, 10) : id;
          const ofertaEncontrada = ofertas.find((o: any) => o.id === idNum);

          if (ofertaEncontrada) {
            console.log(
              `Abriendo oferta #${idNum} desde notificación con viewType: ${viewType}`
            );

            // Manejar distintos tipos de vistas según el tipo de notificación
            if (viewType === "form") {
              // Configurar el formulario para ver los detalles de la oferta existente
              setSelectedOffer(ofertaEncontrada);
              // Cargar la oferta completa para asegurarnos que tiene todos los datos y archivos
              try {
                // Obtener la oferta completa con todos sus archivos y detalles
                const ofertaCompleta = await ofertaService.getOferta(idNum);

                if (ofertaCompleta) {
                  console.log(
                    "Oferta completa cargada con archivos:",
                    ofertaCompleta
                  );
                  setFormInitialData({
                    ...ofertaCompleta,
                    nombreCliente: ofertaCompleta.nombre || "",
                  });
                } else {
                  // Si no se puede cargar la oferta completa, usar la versión básica
                  setFormInitialData({
                    ...ofertaEncontrada,
                    nombreCliente: ofertaEncontrada.nombre || "",
                  });
                }
              } catch (error) {
                console.error("Error al cargar oferta completa:", error);
                setFormInitialData({
                  ...ofertaEncontrada,
                  nombreCliente: ofertaEncontrada.nombre || "",
                });
              }

              setIsReadOnly(true); // Modo de solo lectura para ver detalles
              setTimeout(() => {
                setIsNuevaOfertaFormVisible(true);
                console.log(
                  "Mostrando formulario de oferta desde location.state"
                );
              }, 100);
            } else if (viewType === "chat") {
              // Mostrar el chat de la oferta - usar las variables correctas
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
        toast.error("Error al cargar las ofertas. Intente nuevamente.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOfertas();
  }, [dispatch, location]);
  // Filtrar ofertas según términos de búsqueda y filtros
  const filteredOfertas = allOfertas.filter((oferta) => {
    const matchesSearch =
      searchTerm === "" ||
      (oferta.nombre &&
        oferta.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (oferta.ciudad &&
        oferta.ciudad.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter =
      filterStatus === null || oferta.estado === filterStatus;

    return matchesSearch && matchesFilter;
  });
  // Calcular paginación después de filtrar
  const filteredTotalPages = Math.ceil(filteredOfertas.length / itemsPerPage);
  const filteredStartIndex = (currentPage - 1) * itemsPerPage;
  const filteredEndIndex = filteredStartIndex + itemsPerPage;
  const displayedOfertas = filteredOfertas.slice(
    filteredStartIndex,
    filteredEndIndex
  );
  const startIndex = filteredStartIndex;

  // Funciones para manejo de paginación
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setItemsPerPage(Number(event.target.value));
    setCurrentPage(1); // Resetear a la primera página
  };

  // Funciones para manejo de filtros y búsqueda
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Resetear a la primera página al buscar
  };

  const handleFilterChange = (status: string | null) => {
    if (filterStatus === status) {
      setFilterStatus(null); // Si ya está seleccionado, lo deseleccionamos
    } else {
      setFilterStatus(status);
    }
    setCurrentPage(1); // Resetear a la primera página al filtrar
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterStatus(null);
    setCurrentPage(1);
  };

  // Función para generar los enlaces de paginación
  const generatePaginationLinks = () => {
    const pages = [];
    const totalPages = filteredTotalPages;

    if (totalPages <= 7) {
      // Si hay 7 páginas o menos, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(
          <PaginationItem key={i}>
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
      // Lógica para mostrar páginas con ellipsis
      if (currentPage <= 4) {
        // Mostrar primeras páginas
        for (let i = 1; i <= 5; i++) {
          pages.push(
            <PaginationItem key={i}>
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
        pages.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
        pages.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(totalPages);
              }}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      } else if (currentPage >= totalPages - 3) {
        // Mostrar últimas páginas
        pages.push(
          <PaginationItem key={1}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(1);
              }}
            >
              1
            </PaginationLink>
          </PaginationItem>
        );
        pages.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(
            <PaginationItem key={i}>
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
        // Mostrar páginas del medio
        pages.push(
          <PaginationItem key={1}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(1);
              }}
            >
              1
            </PaginationLink>
          </PaginationItem>
        );
        pages.push(
          <PaginationItem key="ellipsis3">
            <PaginationEllipsis />
          </PaginationItem>
        );
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(
            <PaginationItem key={i}>
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
        pages.push(
          <PaginationItem key="ellipsis4">
            <PaginationEllipsis />
          </PaginationItem>
        );
        pages.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(totalPages);
              }}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return pages;
  };

  // Determinar estado de filtro activo
  const isFilterActive = searchTerm !== "" || filterStatus !== null;

  // Función para mostrar el formulario de Visita Técnica
  const showVisitaTecnicaForm = () => {
    setIsVisitaTecnicaFormVisible(true);
  };

  // Función para ocultar el formulario de Visita Técnica y volver a la tabla
  const hideVisitaTecnicaForm = () => {
    setIsVisitaTecnicaFormVisible(false);
  };

  // Función para manejar el envío del formulario de Visita Técnica
  const handleVisitaTecnicaSubmit = (_formData: VisitaTecnicaFormData) => {
    hideVisitaTecnicaForm();
  };

  // Función para mostrar el formulario de Nueva Oferta
  const showNuevaOfertaForm = () => {
    setSelectedOffer(null); // Reiniciamos la oferta seleccionada
    setFormInitialData(undefined); // Limpiamos los datos del formulario completamente
    setIsEditMode(false); // No estamos en modo edición
    setIsReadOnly(false); // Aseguramos que el formulario sea editable
    setEditableStep4(false); // Resetear este estado también
    setIsShowingVisitaTecnicaForm(false); // Asegurarse de que la visita técnica no esté visible
    console.log("Mostrando formulario de nueva oferta");
    setIsNuevaOfertaFormVisible(true);
  };

  // Función para ocultar el formulario de Nueva Oferta y volver a la tabla
  const hideNuevaOfertaForm = () => {
    console.log("Ocultando formulario de nueva oferta");
    setIsNuevaOfertaFormVisible(false);
    setIsShowingVisitaTecnicaForm(false); // Asegurarse de resetear este estado también
  };
  // Función para manejar el envío del formulario de Nueva Oferta
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
      }

      // Añadir ID del usuario actual
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

      if (selectedOffer && selectedOffer.id) {
        // SOLUCIÓN: Actualizar oferta existente
        const updatedOferta = await ofertaService.updateOferta(
          selectedOffer.id,
          formattedData
        );

        // Actualizar la oferta en el Redux store con la oferta actualizada
        dispatch(addOffer(updatedOferta));

        // Actualizar la oferta seleccionada para reflejar cambios
        setSelectedOffer(updatedOferta);

        // NUEVO: Forzar recarga de ofertas para asegurar actualización en la UI
        try {
          const todasLasOfertas = await ofertaService.getOfertas();
          dispatch(setOffers(todasLasOfertas));
        } catch (err) {
          console.error("Error al recargar ofertas:", err);
        }

        toast.success("Oferta actualizada exitosamente");

        // Si no estamos en el último paso, no cerramos el formulario
        if (!formData.estadoCotizacion) {
          return;
        }
      } else {
        // Crear nueva oferta
        const response = await ofertaService.createOferta(formattedData);

        // El servicio ya se encarga de mapear la respuesta del backend al formato del frontend
        dispatch(addOffer(response));

        // NUEVO: Forzar recarga de ofertas para asegurar actualización en la UI
        try {
          const todasLasOfertas = await ofertaService.getOfertas();
          dispatch(setOffers(todasLasOfertas));
        } catch (err) {
          console.error("Error al recargar ofertas:", err);
        }

        toast.success("Oferta creada exitosamente");
      }

      hideNuevaOfertaForm();
    } catch (error) {
      console.error("Error al guardar la oferta:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error desconocido al guardar la oferta"
      );
    }
  };
  const handleViewOfferDetails = async (
    oferta: any,
    isEdit: boolean = false
  ) => {
    try {
      setIsLoading(true);

      // Importar el servicio de ofertas optimizado dinámicamente
      const ofertaServiceModule = await import("@/services/ofertaServiceFixed");
      const ofertaService = ofertaServiceModule.default;

      // Obtener los detalles completos de la oferta desde el backend
      const ofertaDetalle = await ofertaService.getOferta(oferta.id);

      if (!ofertaDetalle) {
        throw new Error(
          `No se pudieron obtener los detalles de la oferta ${oferta.id}`
        );
      }

      // Actualizar el estado de la oferta seleccionada con los datos completos
      setSelectedOffer(ofertaDetalle);

      // Convertir datos al formato del formulario
      setFormInitialData(ofertaToFormData(ofertaDetalle));

      // Si es edición (lápiz), isEditMode será true
      setIsEditMode(isEdit);

      // En modo edición, ningún campo debe ser de solo lectura
      setIsReadOnly(!isEdit);

      // Siempre permitir la edición completa del formulario
      setEditableStep4(isEdit);

      // Si la oferta tiene una visita técnica asociada, no estamos en modo edición y el estado es "pendiente",
      // mostrar primero el formulario de visita técnica en modo solo lectura
      if (
        ofertaDetalle.technical_visit_details &&
        !isEdit &&
        ofertaDetalle.estado === "pendiente"
      ) {
        setIsShowingVisitaTecnicaForm(true);
      }

      // Mostrar el formulario de oferta
      setIsNuevaOfertaFormVisible(true);
    } catch (error) {
      console.error("Error al cargar detalles de la oferta:", error);
      toast.error("No se pudieron cargar los detalles de la oferta");
    } finally {
      setIsLoading(false);
    }
  };
  const handleDownloadAttachment = (fileUrl: string) => {
    try {
      // Extraer el nombre del archivo de la URL
      const filename = fileUrl.split("/").pop() || "archivo";

      // Obtener la URL correcta para la descarga
      const correctUrl = getCorrectMediaUrl(fileUrl);

      console.log("Descargando archivo:", filename);
      console.log("URL de descarga:", correctUrl);

      // Llamar a la función de descarga
      downloadFile(correctUrl, filename);
    } catch (error) {
      console.error("Error al preparar la descarga:", error);
      toast.error("Error al descargar el archivo");
    }
  };
  const handleShowDeleteModal = (oferta: Oferta) => {
    setDeleteModal({
      show: true,
      oferta: oferta,
    });
  };

  const handleCancelDelete = () => {
    setDeleteModal({
      show: false,
      oferta: null,
    });
  };

  const handleDeleteOffer = async () => {
    if (!deleteModal.oferta) return;

    const id = deleteModal.oferta.id;

    try {
      setIsLoading(true);

      // Importar el servicio de ofertas optimizado dinámicamente
      const ofertaServiceModule = await import("@/services/ofertaServiceFixed");
      const ofertaService = ofertaServiceModule.default;

      // Llamar al servicio para eliminar la oferta
      await ofertaService.deleteOferta(id);

      // Eliminar la oferta del store de Redux
      dispatch(removeOffer(id));

      toast.success("Oferta eliminada correctamente");

      // Cerrar el modal
      setDeleteModal({
        show: false,
        oferta: null,
      });
    } catch (error) {
      console.error("Error al eliminar la oferta:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error desconocido al eliminar la oferta"
      );
    } finally {
      setIsLoading(false);
    }
  };
  // Función para manejar el click en el nombre de una oferta
  const handleNombreClick = (oferta: any) => {
    // Como es un administrador, siempre puede acceder al chat
    setSelectedChatOferta(oferta);
    setShowChatWall(true);
  };

  // Función auxiliar para transformar una oferta a los datos del formulario
  const ofertaToFormData = (oferta: Oferta): NuevaOfertaFormData => {
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
      preciosEstructurasMontaje:
        equipamientoData.preciosEstructurasMontaje ?? 0,
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
      type_identification:
        (oferta.type_identification as "C.C" | "NIT") || "C.C",
      identification: oferta.identification || oferta.nitCC || "",
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
      potenciaKw: oferta.potencia || 0,
      tipoPotenciaPaneles: oferta.tipoPotenciaPaneles || "",
      produccionEnergetica: oferta.produccionEnergetica || 0,
      cantidadPaneles: oferta.cantidadPaneles || 0,
      areaNecesaria: oferta.areaNecesaria || 0,
      tipoInstalacion: oferta.tipoInstalacion || "Tejado",
      formaPago: oferta.formaPago || "50%,30%,20%",
      validezOferta: oferta.validez || 15,
      plazoEntrega: oferta.plazoEntrega || 30,
      garantia: oferta.garantia || "5 años",
      observaciones: oferta.observaciones || "",
      equipamiento: equipamiento,
      valorTotal: oferta.valorTotal || 0,
      // Campos de usuario
      id: oferta.id, // Añadimos explícitamente el ID
      user_id: oferta.user_id || 1,
      person_id: oferta.person_id || 0,
      // Campos adicionales
      estado:
        (oferta.estado as "aprobado" | "rechazado" | "pendiente") ||
        "pendiente",
      archivosAdjuntos: oferta.archivosAdjuntos || [],
      // Campos de hoja de cálculo y archivos
      hojaCalculo: oferta.hojaCalculo || "",
      // Campos de cotización
      comentarioCotizacion: oferta.comentarios || "",
      cotizador: oferta.cotizador || "",
      archivoCotizacion: oferta.archivoCotizacion || "",
      estadoCotizacion: oferta.estado || "pendiente",
    };
  };

  return (
    <Layout>
      <div className="flex-1 p-4 md:p-6 max-w-full bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen">
        {/* Modal de confirmación para eliminar ofertas */}
        {deleteModal.show && deleteModal.oferta && (
          <ConfirmDeleteOfertaModal
            ofertaId={deleteModal.oferta.id}
            ofertaNombre={deleteModal.oferta.nombre}
            onConfirm={handleDeleteOffer}
            onCancel={handleCancelDelete}
          />
        )}{" "}
        {showChatWall && selectedChatOferta ? (
          <div className="w-full">
            <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/60 mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowChatWall(false)}
                  className="flex items-center gap-3 text-[#4178D4] hover:text-[#2d5aa8] font-medium py-2 px-4 rounded-xl hover:bg-blue-50 transition-all duration-200"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Volver a la lista de ofertas
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
        ) : (
          <>
            {/* Header con título y estadísticas */}
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
                  {/* Botón Agregar Visita Técnica */}
                  <button
                    className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-[#4178D4] rounded-lg bg-white text-[#4178D4] hover:bg-blue-50 transition-colors shadow-sm cursor-pointer"
                    onClick={showVisitaTecnicaForm}
                  >
                    <span className="font-bold text-sm whitespace-nowrap">
                      VISITA TÉCNICA
                    </span>
                    <Plus className="w-4 h-4" />
                  </button>

                  {/* Botón Agregar Oferta */}
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

            {/* Condicionalmente mostrar el formulario de Visita Técnica o la tabla de ofertas */}
            {isVisitaTecnicaFormVisible ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <VisitaTecnicaForm
                  onSubmit={handleVisitaTecnicaSubmit}
                  onCancel={hideVisitaTecnicaForm}
                />
              </div>
            ) : isNuevaOfertaFormVisible ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                {isShowingVisitaTecnicaForm &&
                isShowingVisitaTecnicaForm &&
                selectedOffer &&
                selectedOffer.technical_visit_details ? (
                  <VisitaTecnicaForm
                    initialData={selectedOffer.technical_visit_details}
                    viewOnly={true}
                    onCancel={() => setIsShowingVisitaTecnicaForm(false)}
                  />
                ) : (
                  <>
                    {selectedOffer && selectedOffer.technical_visit_details && (
                      <div className="mb-4">
                        <div className="p-4 bg-blue-50 text-blue-700 rounded-lg mb-3 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5" />
                            <span>
                              Visita técnica asociada:{" "}
                              {selectedOffer.technical_visit_details.code}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setIsShowingVisitaTecnicaForm(true);
                            }}
                            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-md text-sm"
                          >
                            Ver detalles
                          </button>
                        </div>
                      </div>
                    )}
                    <AdminNuevaOfertaForm
                      //@ts-ignore
                      onSubmit={handleNuevaOfertaSubmit}
                      onCancel={hideNuevaOfertaForm}
                      visitaTecnicaData={formInitialData}
                      initialData={formInitialData}
                      isReadOnly={isReadOnly}
                      editableStep4={editableStep4}
                      currentUserId={user?.id} // Pasar el ID del usuario actual
                    />
                  </>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                {/* Controles de búsqueda y filtros */}
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

                {/* Tabla de ofertas o mensaje de vacío */}
                <div className="p-6">
                  {filteredOfertas.length > 0 ? (
                    <div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b-2 border-gray-100">
                              <th className="py-4 px-4 text-left text-[#34509F] font-bold whitespace-nowrap">
                                ID
                              </th>
                              <th className="py-4 px-4 text-left text-[#34509F] font-bold whitespace-nowrap">
                                Nombre
                              </th>
                              <th className="py-4 px-4 text-left text-[#34509F] font-bold whitespace-nowrap">
                                Ciudad
                              </th>
                              <th className="py-4 px-4 text-left text-[#34509F] font-bold whitespace-nowrap">
                                Fecha
                              </th>
                              <th className="py-4 px-4 text-left text-[#34509F] font-bold whitespace-nowrap">
                                Potencia
                              </th>
                              <th className="py-4 px-4 text-left text-[#34509F] font-bold whitespace-nowrap">
                                Valor
                              </th>
                              <th className="py-4 px-4 text-left text-[#34509F] font-bold whitespace-nowrap">
                                Validez
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
                                className={`
                              border-b border-gray-100 hover:bg-blue-50/30 transition-colors cursor-pointer
                              ${index % 2 === 0 ? "bg-white" : "bg-slate-50/30"}
                            `}
                              >
                                <td className="py-3 px-4 whitespace-nowrap font-medium text-[#34509F]">
                                  #{oferta.id.toString().padStart(3, "0")}
                                </td>
                                <td
                                  className="py-3 px-4 font-medium cursor-pointer hover:text-[#4178D4] hover:underline flex items-center"
                                  onClick={() => handleNombreClick(oferta)}
                                >
                                  {oferta.name}
                                  <MessageSquare className="ml-2 w-4 h-4 text-[#4178D4]" />
                                </td>
                                <td className="py-3 px-4 text-gray-600">
                                  {oferta.ciudad}
                                </td>
                                <td className="py-3 px-4 text-gray-600">
                                  {oferta.fechaEmision}
                                </td>
                                <td className="py-3 px-4 text-gray-600">
                                  {oferta.potencia} kW
                                </td>
                                <td className="py-3 px-4 font-medium text-gray-900">
                                  {formatNumber(oferta.valor)}
                                </td>
                                <td className="py-3 px-4 text-gray-600">
                                  {oferta.validez} días
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span
                                    className={`
                                inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                                ${
                                  oferta.estado === "aprobado"
                                    ? "bg-green-100 text-green-800"
                                    : ""
                                }
                                ${
                                  oferta.estado === "rechazado"
                                    ? "bg-red-100 text-red-800"
                                    : ""
                                }
                                ${
                                  oferta.estado === "pendiente"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : ""
                                }
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
                                    {oferta.estado.charAt(0).toUpperCase() +
                                      oferta.estado.slice(1)}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center flex gap-2 justify-center">
                                  {/* Ver */}
                                  <button
                                    className="text-[#4178D4] hover:text-[#34509F]"
                                    onClick={() =>
                                      handleViewOfferDetails(oferta)
                                    }
                                  >
                                    <Info className="w-5 h-5" />
                                  </button>
                                  {oferta.archivoCotizacion && (
                                    <button
                                      className="text-[#4178D4] hover:text-[#34509F]"
                                      onClick={() =>
                                        handleDownloadAttachment(
                                          oferta.archivoCotizacion || ""
                                        )
                                      }
                                      title="Descargar cotización"
                                    >
                                      <Download className="w-5 h-5" />
                                    </button>
                                  )}
                                  {/* Editar */}
                                  <button
                                    className="text-[#FFB200] hover:text-[#FFA000]"
                                    onClick={() =>
                                      handleViewOfferDetails(oferta, true)
                                    }
                                  >
                                    <Pencil className="w-5 h-5" />
                                  </button>
                                  {/* Eliminar */}{" "}
                                  <button
                                    className="text-[#E53935] hover:text-[#B71C1C]"
                                    onClick={() =>
                                      //@ts-ignore
                                      handleShowDeleteModal(oferta)
                                    }
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>{" "}
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
                      <Loader className="h-8 w-8 text-[#4178D4] animate-spin mb-4" />
                      <p className="text-gray-500">Cargando ofertas...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                      <Filter className="w-12 h-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No se encontraron ofertas
                      </h3>
                      <p className="text-gray-500 mb-6">
                        No hay ofertas que coincidan con los filtros aplicados
                      </p>
                      <button
                        onClick={handleClearFilters}
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-[#4178D4] rounded-lg bg-white text-[#4178D4] hover:bg-blue-50 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>Limpiar filtros</span>
                      </button>
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

export default AdminOfertasPage;
