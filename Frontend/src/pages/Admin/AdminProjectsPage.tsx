import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/hooks/useAppSelector";
import {
  fetchProjectsStart,
  fetchProjectsSuccess,
  fetchProjectsFailure,
} from "@/store/slices/projectSlice";
import {
  Monitor,
  Info,
  Filter,
  ChevronDown,
  Search,
  Download,
  RefreshCw,
  Clock,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
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
import api from "@/services/api";
import NuevoProyectoForm from "@/components/modals/Admin/AdminNuevoProyectoForm";
import AdminDetallesProyectoForm from "@/components/modals/Admin/AdminDetallesProyectoForm.tsx";

interface Project {
  cotizador: any;
  id: number;
  nombre: string;
  ciudad: string;
  fechaEmision: string;
  potencia: number | null;
  valor: string;
  etapa: "Planificación" | "Ejecución" | "Finalizado"
  descripcion?: string;
  cliente?: string;
  fechaInicio?: string;
  fechaFinalizacion?: string;
  progreso?: number;
}

const AdminProjectsPage: React.FC = () => {
  const dispatch = useDispatch();
  useAppSelector((state) => state.project);

  // Estados locales para la gestión de la página
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        dispatch(fetchProjectsStart());
        setIsLoading(true);

        // Primero obtener la lista de proyectos
        const listResponse = await api.get("/proyect/list/");
        const projectsList = listResponse.data.results;

        // Luego obtener los detalles de cada proyecto
        const projectsWithDetails = await Promise.all(
          projectsList.map(async (project: any) => {
            const detailsResponse = await api.get(`/proyect/retrive/${project.id}/`);
            return mapApiProjectToLocal(detailsResponse.data);
          })
        );

        setAllProjects(projectsWithDetails);
        dispatch(fetchProjectsSuccess(projectsWithDetails));
      } catch (err) {
        console.error("Error fetching projects:", err);
        dispatch(fetchProjectsFailure());
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [dispatch]);

  // Mapear el estado de la API al formato local
  const calcularProgresoDocumentos = (
    attachments: Array<{ name: string; attach: string }> = [],
    status: string = "planification"
  ): number => {
    const progressMapByStatus: Record<string, Record<string, number>> = {
      process: {
        anticipo: 5,
        listado_de_materiales: 10,
        acta_de_compra: 10,
        acta_de_inicio: 10,
        legalizacion: 20,
        retie: 10,
        acta_de_avance_de_obra_1: 10,
        acta_de_avance_de_obra_2: 10,
        acta_de_entrega_final: 10,
        factura: 5,
      },
    };

    if (status === "planification") {
      const requiredDocs = [
        /aceptacion_de_oferta/i,
        /camara_de_comercio/i,
        /rut/i,
        /copia_cedula_representante_legal/i,
        /numero_de_contrato/i,
        /polizas/i,
      ];

      const encontrados = requiredDocs.filter((regex) =>
        attachments.some((att) => regex.test(att.name || att.attach))
      ).length;

      const porcentaje = Math.floor(100 / requiredDocs.length); // 16
      const progresoBase = encontrados * porcentaje;
      const exceso = encontrados === requiredDocs.length ? 100 - progresoBase : 0;

      return progresoBase + exceso; // asegura que llegue a 100 exacto
    }

    const progressMap = progressMapByStatus[status] || {};
    return Object.entries(progressMap).reduce((total, [docKey, porcentaje]) => {
      const regex = new RegExp(docKey, "i");
      return attachments.some((att) => regex.test(att.name || att.attach))
        ? total + porcentaje
        : total;
    }, 0);
  };

  const calcularProgresoPorCumplimiento = (
    attachments: Array<{ name: string; attach: string; fulfillment: string }> = []
  ): number => {
    const progressMap: Record<string, number> = {
      cotizacion: 0,
      contrato_firmado: 10,
      rut: 10,
      camara_de_comercio: 10,
      cedula_representante_legal: 10,
      anticipo: 10,
      soporte_de_pago: 10,
      factura: 10,
      acta_de_inicio: 10,
      cronograma_de_trabajo: 5,
      retie: 5,
      legalizacion: 5,
      acta_de_cierre: 5,
    };

    return Object.entries(progressMap).reduce((total, [docKey, porcentaje]) => {
      const regex = new RegExp(docKey, "i");
      const matching = attachments.find(
        (att) =>
          regex.test(att.name || att.attach) &&
          att.fulfillment?.toLowerCase() === "completado"
      );
      return matching ? total + porcentaje : total;
    }, 0);
  };
  
  const mapApiProjectToLocal = (apiProject: any): any => {
    const atts = apiProject.attachments || [];

    let progreso = 0;

    if (apiProject.status === "finaly") {
      progreso = 100;
    } else if (apiProject.status === "process") {
      progreso = calcularProgresoPorCumplimiento(atts);
    } else {
      progreso = calcularProgresoDocumentos(atts, apiProject.status);
    }

    let etapaTraducida = "";
    switch (apiProject.status) {
      case "finaly":
        etapaTraducida = "Finalizado";
        break;
      case "process":
        etapaTraducida = "Ejecución";
        break;
      case "planification":
        etapaTraducida = "Planificación";
        break;
      case "suspendido":
        etapaTraducida = "suspendido";
        break;
      default:
        etapaTraducida = "otro";
    }

    return {
      id: apiProject.id,
      nombre: apiProject.sale_order?.name || `Proyecto ${apiProject.code}`,
      ciudad: apiProject.sale_order?.city || 'Desconocida',
      fechaEmision: apiProject.date || 'Sin fecha',
      potencia: apiProject.sale_order?.power_required
        ? parseFloat(apiProject.sale_order.power_required)
        : null,
      valor: apiProject.sale_order?.total_quotation
        ? `$${parseFloat(apiProject.sale_order.total_quotation).toLocaleString()}`
        : '$0',
      etapa: etapaTraducida,
      descripcion: apiProject.sale_order?.description || 'Sin descripción',
      cliente: apiProject.sale_order?.name || 'Cliente desconocido',
      fechaInicio: apiProject.sale_order?.date_start,
      fechaFinalizacion: apiProject.sale_order?.date_end,
      progreso,
      cotizador: apiProject.sale_order?.cotizador || 'Sin asignar',
    };
  };


  // Filtrar proyectos según términos de búsqueda y filtros
  const filteredProjects = allProjects.filter((project) => {
    const matchesSearch =
      searchTerm === "" ||
      project.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.cliente &&
        project.cliente.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      filterStatus === null || project.etapa === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Calcular el número total de páginas después del filtrado
  const filteredTotalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  // Calcular los proyectos a mostrar basados en la página actual y elementos por página
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedProjects = filteredProjects.slice(
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

  const getStatusStyles = (etapa: string) => {
    switch (etapa) {
      case "Finalizado":
        return "bg-green-100 text-green-800";
      case "suspendido":
        return "bg-red-100 text-red-800";
      case "Ejecución":
        return "bg-blue-100 text-blue-800";
      case "Planificación":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (etapa: string) => {
    switch (etapa) {
      case "planification":
        return "Planificación";
      case "process":
        return "Ejecución";
      case "finaly":
        return "Finalizado";
      case "suspendido":
        return "Suspendido";
      default:
        return etapa;
    }
  };


  const getStatusIcon = (etapa: string) => {
    switch (etapa) {
      case "Finalizado":
        return <CheckCircle className="w-4 h-4" />;
      case "suspendido":
        return <XCircle className="w-4 h-4" />;
      case "Ejecución":
        return <RefreshCw className="w-4 h-4" />;
      case "Planificación":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };
  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setShowProjectModal(true);
    console.log("Ver proyecto:", project);
  };

  const handleEditProject = (project: Project) => {
    // Implementar lógica para editar proyecto
    console.log("Editar proyecto:", project);
  };

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };
  const handleFormSubmit = (data: any) => {
    console.log("Nuevo proyecto enviado:", data);
    setShowForm(false);
    // Aquí puedes hacer la llamada a la API para crear el proyecto
    api.post("/proyect/create/", data)
      .then(response => {
        // Actualizar la lista de proyectos
        const newProject = mapApiProjectToLocal(response.data);
        setAllProjects([...allProjects, newProject]);
      })
      .catch(err => {
        console.error("Error creating project:", err);
      });
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };
  const generatePaginationLinks = () => {
    const pages = [];
    const maxVisiblePages = 5;
    const totalPagesToUse = filteredTotalPages || 1;

    pages.push(
      <PaginationItem key="page-1">
        <PaginationLink
          href="#"
          isActive={currentPage === 1}
          onClick={(e) => {
            e.preventDefault();
            handlePageChange(1);
          }}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    if (totalPagesToUse <= maxVisiblePages) {
      for (let i = 2; i <= totalPagesToUse; i++) {
        pages.push(
          <PaginationItem key={`page-${i}`}>
            <PaginationLink
              href="#"
              isActive={currentPage === i}
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(i);
              }}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    } else {
      if (currentPage > 3) {
        pages.push(
          <PaginationItem key="ellipsis-1">
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
              isActive={currentPage === i}
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(i);
              }}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      if (currentPage < totalPagesToUse - 2) {
        pages.push(
          <PaginationItem key="ellipsis-2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      if (totalPagesToUse > 1) {
        pages.push(
          <PaginationItem key={`page-${totalPagesToUse}`}>
            <PaginationLink
              href="#"
              isActive={currentPage === totalPagesToUse}
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(totalPagesToUse);
              }}
            >
              {totalPagesToUse}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }

    return pages;
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex-1 p-4 md:p-6 max-w-full bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#4178D4]" />
            <p className="mt-2 text-gray-600">Cargando proyectos...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {showDeleteModal && projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 shadow-md w-full max-w-md text-center">
            <div className="text-red-500 mb-4">
              <AlertCircle className="w-10 h-10 mx-auto" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Confirmar eliminación</h2>
            <p className="mb-4">
              ¿Estás seguro de que deseas eliminar el proyecto{" "}
              <strong>{projectToDelete.nombre}</strong> (ID: #{projectToDelete.id.toString().padStart(3, "0")})?
            </p>
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded mb-5">
              <strong>Advertencia:</strong> Esta acción no se puede deshacer. Todos los datos asociados serán eliminados permanentemente.
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProjectToDelete(null);
                }}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  try {
                    await api.delete(`/proyecto/delete/${projectToDelete.id}/`);
                    const updated = allProjects.filter(p => p.id !== projectToDelete.id);
                    setAllProjects(updated);
                    dispatch(fetchProjectsSuccess(updated));
                    setShowDeleteModal(false);
                    setProjectToDelete(null);
                  } catch (error) {
                    alert("Error al eliminar el proyecto.");
                    console.error(error);
                  }
                }}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Eliminar proyecto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ver detalles del proyecto */}
      {selectedProject && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <AdminDetallesProyectoForm
            project={selectedProject}
            onSubmit={(updatedProject) => {
              // Lógica para actualizar el proyecto
              api.put(`/proyect/retrive/${updatedProject.id}/`, updatedProject)
                .then(response => {
                  const updated = mapApiProjectToLocal(response.data);
                  setAllProjects(allProjects.map(p => p.id === updated.id ? updated : p));
                  setSelectedProject(null);
                })
                .catch(err => {
                  console.error("Error updating project:", err);
                });
            }}
            onCancel={() => setSelectedProject(null)}
            onDelete={(id) => {
              handleDeleteProject(id);
              setSelectedProject(null);
            }}
          />
        </div>
      )}

      <div className="flex-1 p-4 md:p-6 max-w-full bg-gray-50">
        {/* Header */}
        {!selectedProject && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-[#34509F] mb-2 flex items-center gap-2">
                    <Monitor className="inline-block h-6 w-6 md:h-8 md:w-8" />
                    GESTIÓN DE PROYECTOS
                  </h1>
                  <p className="text-gray-500 text-sm text-left">
                    {showForm
                      ? "Crear nuevo proyecto"
                      : `Total: ${filteredProjects.length} proyectos ${
                        isFilterActive ? "(filtrados)" : ""
                      }`}
                  </p>
                </div>
              </div>
            </div>

            {/* Mostrar formulario o contenido de proyectos */}
            {showForm ? (
              // Formulario Nuevo Proyecto
              <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <NuevoProyectoForm
                  onSubmit={handleFormSubmit}
                  onCancel={handleFormCancel}
                />
              </div>
            ) : (
              <>
                {/* Filtros y búsqueda */}
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
                          placeholder="Buscar proyectos..."
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div
                        className="inline-flex rounded-md shadow-sm"
                        role="group"
                      >
                        <button
                          onClick={() => handleFilterChange("finalizado")}
                          className={`px-3 py-2 text-xs font-medium rounded-l-lg border ${
                            filterStatus === "finalizado"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-white border-gray-200 text-gray-900 hover:bg-gray-100"
                          }`}
                        >
                          <CheckCircle className="w-4 h-4 inline-block mr-1" />
                          Finalizados
                        </button>
                        <button
                          onClick={() => handleFilterChange("ejecucion")}
                          className={`px-3 py-2 text-xs font-medium border-l-0 border-r-0 border ${
                            filterStatus === "ejecucion"
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : "bg-white border-gray-200 text-gray-900 hover:bg-gray-100"
                          }`}
                        >
                          <RefreshCw className="w-4 h-4 inline-block mr-1" />
                          En Ejecución
                        </button>
                        <button
                          onClick={() => handleFilterChange("planificacion")}
                          className={`px-3 py-2 text-xs font-medium border-l-0 border-r-0 border ${
                            filterStatus === "planificacion"
                              ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                              : "bg-white border-gray-200 text-gray-900 hover:bg-gray-100"
                          }`}
                        >
                          <AlertCircle className="w-4 h-4 inline-block mr-1" />
                          Planificación
                        </button>
                        <button
                          onClick={() => handleFilterChange("suspendido")}
                          className={`px-3 py-2 text-xs font-medium rounded-r-lg border ${
                            filterStatus === "suspendido"
                              ? "bg-red-100 text-red-800 border-red-200"
                              : "bg-white border-gray-200 text-gray-900 hover:bg-gray-100"
                          }`}
                        >
                          <XCircle className="w-4 h-4 inline-block mr-1" />
                          Suspendidos
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

                {/* Tabla de proyectos */}
                <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100">
                  {displayedProjects.length > 0 ? (
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
                              {/*<th className="py-4 px-4 text-left text-[#34509F] font-bold whitespace-nowrap">*/}
                              {/*  Encargado*/}
                              {/*</th>*/}
                              <th className="py-4 px-4 text-left text-[#34509F] font-bold whitespace-nowrap">
                                Potencia (Kw)
                              </th>
                              <th className="py-4 px-4 text-left text-[#34509F] font-bold whitespace-nowrap">
                                Valor
                              </th>
                              <th className="py-4 px-4 text-center text-[#34509F] font-bold whitespace-nowrap">
                                Progreso
                              </th>
                              <th className="py-4 px-4 text-center text-[#34509F] font-bold whitespace-nowrap">
                                Etapa
                              </th>
                              <th className="py-4 px-4 text-center text-[#34509F] font-bold whitespace-nowrap">
                                Acciones
                              </th>
                            </tr>
                            </thead>
                            <tbody className="text-left">
                            {displayedProjects.map((project, index) => (
                              <tr
                                key={project.id}
                                className={`border-b border-gray-100 hover:bg-blue-50/30 transition-colors cursor-pointer ${
                                  index % 2 === 0 ? "bg-white" : "bg-slate-50/30"
                                }`}
                              >
                                <td className="py-3 px-4 whitespace-nowrap font-medium text-[#34509F]">
                                  #{project.id.toString().padStart(3, "0")}
                                </td>
                                <td className="py-3 px-4 font-medium">
                                  {project.nombre}
                                </td>
                                <td className="py-3 px-4 text-gray-600">
                                  {project.ciudad}
                                </td>
                                <td className="py-3 px-4 text-gray-600">
                                  {project.fechaEmision}
                                </td>
                                {/*<td className="py-3 px-4 text-gray-600">*/}
                                {/*  {project.cotizador}*/}
                                {/*</td>*/}
                                <td className="py-3 px-4 text-gray-600">
                                  {project.potencia !== null
                                    ? `${project.potencia} kW`
                                    : "-"}
                                </td>
                                <td className="py-3 px-4 text-gray-600">
                                  {project.valor}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                      className={`h-2.5 rounded-full ${
                                        project.etapa === "Finalizado" ? "bg-green-500" :
                                          project.etapa === "Ejecución" ? "bg-blue-500" :
                                            project.etapa === "Planificación" ? "bg-yellow-500" :
                                              "bg-red-500"
                                      }`}
                                      style={{ width: `${project.progreso}%` }}
                                    ></div>
                                  </div>
                                  <div className="text-xs text-gray-500 text-center mt-1">
                                    {project.progreso}%
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <span
                                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusStyles(
                                        project.etapa
                                      )}`}
                                    >
                                      {getStatusIcon(project.etapa)}
                                      {getStatusLabel(project.etapa)}
                                    </span>
                                </td>
                                <td className="py-3 px-4 text-center flex gap-2 justify-center">
                                  {/* Ver */}
                                  <button
                                    className="text-[#4178D4] hover:text-[#34509F]"
                                    onClick={() => handleViewProject(project)}
                                  >
                                    <Info className="w-5 h-5" />
                                  </button>
                                  {/* Editar */}
                                  <button
                                    className="text-[#FFB200] hover:text-[#FFA000]"
                                    onClick={() => handleEditProject(project)}
                                  >
                                    <Pencil className="w-5 h-5" />
                                  </button>
                                  {/* Eliminar */}
                                  <button
                                    className="text-[#E53935] hover:text-[#B71C1C]"
                                    onClick={() => handleDeleteProject(project)}
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Controles de paginación */}
                      <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-gray-200 gap-4 bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">
                              Mostrando{" "}
                              {Math.min(startIndex + 1, filteredProjects.length)} -{" "}
                              {Math.min(
                                startIndex + itemsPerPage,
                                filteredProjects.length
                              )}{" "}
                              de {filteredProjects.length} registros
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
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64">
                      <Filter className="w-12 h-12 text-gray-400 mb-4" />
                      <p className="text-gray-500 text-center">
                        No se encontraron proyectos que coincidan con los criterios
                        de búsqueda.
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
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default AdminProjectsPage;