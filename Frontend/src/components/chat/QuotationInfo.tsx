import React, { useState, useEffect } from "react";
import { Oferta } from "@/store/slices/offersSlice";
import { Button } from "@/components/ui/button";
import QuotationDocuments from "./QuotationDocuments";
import QuotationDrones from "./QuotationDrones";
import { fetchQuotationDocument } from "@/services/documentService";
import { downloadFile } from "@/utils/fileUtils";
import {
  convertQuotationToProject,
  checkQuotationHasProject,
} from "@/services/projectService";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

interface QuotationInfoProps {
  cotizacion: Oferta;
  onDocumentsToggle?: (show: boolean) => void;
}

const QuotationInfo: React.FC<QuotationInfoProps> = ({
  cotizacion,
  onDocumentsToggle,
}) => {
  const [showDocuments, setShowDocuments] = useState(false);
  const [showDrones, setShowDrones] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [, setConversionError] = useState<string | null>(null);
  const [conversionSuccess, setConversionSuccess] = useState(false);
  const [hasProject, setHasProject] = useState(false);

  // Obtener el usuario actual del estado de Redux
  const user = useSelector((state: RootState) => state.auth.user);
  const isAdmin = user?.role === "admin";

  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(value);
  };

  const [documentData, setDocumentData] = useState<{
    url: string;
    fileName: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadQuotationDocument = async () => {
      setIsLoading(true);
      try {
        const url = await fetchQuotationDocument(cotizacion.id);
        // Extraer el nombre del archivo de la URL
        let fileName = "cotizacion.pdf"; // Nombre predeterminado
        if (url) {
          const urlFileName = url.split("/").pop();
          if (urlFileName) {
            fileName = decodeURIComponent(urlFileName);
          }
          setDocumentData({ url, fileName });
        } else {
          setDocumentData(null);
        }
      } catch (error) {
        console.error("Error al cargar el documento de cotización:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuotationDocument();
  }, [cotizacion.id]); // Verificar si la cotización ya tiene un proyecto asociado
  useEffect(() => {
    const checkForProject = async () => {
      if (cotizacion.id) {
        try {
          setIsConverting(true); // Mostrar estado de carga mientras verificamos
          
          const hasExistingProject = await checkQuotationHasProject(
            cotizacion.id
          );
          
          setHasProject(hasExistingProject);

          if (hasExistingProject) {
            setConversionSuccess(true);
            // Mostrar mensaje informativo al cargar si ya existe un proyecto
            toast.info("Esta cotización ya ha sido convertida a proyecto");
          }
        } catch (err) {
          console.error("Error al verificar existencia de proyecto:", err);
        } finally {
          setIsConverting(false);
        }
      }
    };

    checkForProject();
  }, [cotizacion.id]);
  const handleDownloadQuotation = () => {
    if (documentData && documentData.url) {
      // En lugar de abrir en una nueva pestaña, descargar el archivo con su nombre original
      downloadFile(documentData.url, documentData.fileName);
    } else {
      // Mostrar mensaje de que no hay documento disponible
      toast.warning("No hay documento de cotización disponible");
    }
  };

  const handleToggleDocuments = () => {
    const newShowDocuments = !showDocuments;
    setShowDocuments(newShowDocuments);
    if (newShowDocuments) {
      setShowDrones(false);
    }
    onDocumentsToggle?.(newShowDocuments);
  };


  const handleConvertToProject = async () => {
    // Si ya verificamos que existe un proyecto, no hacemos nada
    if (hasProject) {
      toast.info("Esta cotización ya ha sido convertida a proyecto");
      return;
    }

    setIsConverting(true);
    setConversionError(null);
    try {
      // Primero verificamos si ya existe un proyecto para esta cotización
      const existingProject = await checkQuotationHasProject(cotizacion.id);
      if (existingProject) {
        // Si ya existe, actualizamos los estados y mostramos un mensaje informativo
        setHasProject(true);
        setConversionSuccess(true);
        toast.info("Esta cotización ya ha sido convertida a proyecto");
        return;
      }

      await convertQuotationToProject(cotizacion.id);
      setConversionSuccess(true);
      // Mostrar confirmación de éxito usando toast
      toast.success("¡Cotización convertida a proyecto exitosamente!");
      // Actualizar el estado para indicar que ahora hay un proyecto
      setHasProject(true);
    } catch (error: any) {
      // Manejar errores específicos
      if (error.name === "ProjectExistsError") {
        // Este es nuestro error personalizado que ya tiene el mensaje en español
        setHasProject(true);
        setConversionSuccess(true);
        toast.info(error.message);
      } else {
        // Para otros errores, mostramos un mensaje genérico en español
        let errorMessage = "No se pudo convertir la cotización a proyecto";

        if (error.response?.data?.error) {
          // Si hay un error específico del backend, lo traducimos si es posible
          if (error.response.data.error.includes("already exists")) {
            errorMessage = "Ya existe un proyecto para esta cotización";
            setHasProject(true);
            setConversionSuccess(true);
            toast.info(errorMessage);
          } else {
            // Otros errores del backend
            errorMessage = error.response.data.error;
            toast.error(`Error: ${errorMessage}`);
          }
        } else if (error.message) {
          errorMessage = error.message;
          toast.error(`Error: ${errorMessage}`);
        } else {
          toast.error(`Error: ${errorMessage}`);
        }

        setConversionError(errorMessage);
      }
    } finally {
      setIsConverting(false);
    }
  };
  return (
    <div
      className={`flex flex-col space-y-4 md:space-y-6 px-2 md:px-0 ${
        showDocuments || showDrones ? "" : ""
      }`}
    >
      <div
        className="bg-white rounded-2xl shadow-lg border border-gray-200/60 p-4 md:p-8"
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          boxShadow:
            "0 8px 32px rgba(65, 120, 212, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04)",
        }}
      >
        {" "}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 md:mb-8 gap-4">
          <div>
            <h2 className="text-xl md:text-3xl font-bold text-[#4178D4] mb-2 tracking-tight">
              CRM Cotización #{cotizacion.id.toString().padStart(3, "0")}
            </h2>
            <p className="text-gray-600 text-base md:text-lg">
              Seguimiento y gestión de cotización
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4">
            {cotizacion.estado === "aprobado" && isAdmin && (
              <Button
                onClick={handleConvertToProject}
                className="bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-600 transition-all duration-300 px-4 md:px-6 py-2 md:py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold w-full sm:w-auto"
                disabled={isConverting || conversionSuccess || hasProject}
                title={
                  hasProject
                    ? "Esta cotización ya está convertida a proyecto"
                    : ""
                }
              >
                <span className="text-sm md:text-base">
                  {isConverting
                    ? "Convirtiendo..."
                    : conversionSuccess || hasProject
                    ? "¡Convertido!"
                    : "Convertir a Proyecto"}
                </span>
              </Button>
            )}
            <Button
              onClick={handleToggleDocuments}
              className="bg-gradient-to-r from-[#4178D4] to-[#5b8de8] text-white hover:from-[#2d5aa8] hover:to-[#4178D4] transition-all duration-300 px-4 md:px-6 py-2 md:py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold w-full sm:w-auto"
            >
              <span className="text-sm md:text-base">
                {showDocuments ? "Volver al Chat" : "Ver Documentos"}
              </span>
            </Button>
            
          </div>
        </div>{" "}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          <div className="space-y-1 md:space-y-2">
            <h3 className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wide">
              Cliente
            </h3>
            <p className="text-gray-900 text-base md:text-lg font-medium">
              {cotizacion.nombre}
            </p>
          </div>
          <div className="space-y-1 md:space-y-2">
            <h3 className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wide">
              Ubicación
            </h3>
            <p className="text-gray-900 text-base md:text-lg">
              {cotizacion.departamento}, {cotizacion.ciudad}
            </p>
          </div>
          <div className="space-y-1 md:space-y-2">
            <h3 className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wide">
              Tipo de Instalación
            </h3>
            <p className="text-gray-900 text-base md:text-lg">
              {cotizacion.tipoInstalacion}
            </p>
          </div>
          <div className="space-y-1 md:space-y-2">
            <h3 className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wide">
              Estado
            </h3>
            <span
              className={`inline-flex items-center px-3 py-1 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-bold shadow-sm ${
                cotizacion.estado === "aprobado"
                  ? "bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200"
                  : cotizacion.estado === "pendiente"
                  ? "bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border border-yellow-200"
                  : "bg-gradient-to-r from-red-100 to-red-50 text-red-800 border border-red-200"
              }`}
            >
              {cotizacion.estado?.charAt(0).toUpperCase() +
                cotizacion.estado?.slice(1)}
            </span>
          </div>
          <div className="space-y-1 md:space-y-2">
            <h3 className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wide">
              Valor Total
            </h3>
            <p className="text-base md:text-xl font-bold text-[#4178D4]">
              {formatNumber(cotizacion.valorTotal || 0)}
            </p>
          </div>
          <div className="space-y-1 md:space-y-2">
            <h3 className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wide">
              Fecha de Creación
            </h3>
            <p className="text-gray-900 text-base md:text-lg">
              {cotizacion.fechaCreacion
                ? new Date(cotizacion.fechaCreacion).toLocaleDateString("es-CO")
                : new Date(cotizacion.fechaEmision).toLocaleDateString("es-CO")}
            </p>
          </div>{" "}
          {!showDocuments && !showDrones && (
            <div className="space-y-1 md:space-y-2">
              <h3 className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-wide">
                Documento de Cotización
              </h3>{" "}
              {isLoading ? (
                <p className="text-gray-600 text-sm md:text-base">
                  Cargando documento...
                </p>
              ) : documentData?.url ? (
                <button
                  onClick={handleDownloadQuotation}
                  className="text-[#4178D4] hover:text-[#2d5aa8] underline font-medium text-base md:text-lg hover:no-underline transition-all duration-200"
                >
                  Descargar documento
                </button>
              ) : (
                <p className="text-gray-600 text-sm md:text-base">
                  No hay documento disponible
                </p>
              )}
            </div>
          )}
        </div>
      </div>{" "}
      {showDocuments && (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <QuotationDocuments cotizacionId={cotizacion.id} />
        </div>
      )}
      {showDrones && (
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <QuotationDrones cotizacionId={cotizacion.id} />
        </div>
      )}
    </div>
  );
};

export default QuotationInfo;
