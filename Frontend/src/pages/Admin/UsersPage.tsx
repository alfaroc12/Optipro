import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/hooks/useAppSelector";
import {
  fetchUsersStart,
  fetchUsersSuccess,
  fetchUsersFailure,
  addUserStart,
  addUserSuccess,
  addUserFailure,
  deleteUserStart,
  deleteUserSuccess,
  deleteUserFailure,
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  Usuario,
} from "@/store/slices/userSlice";
import ConfirmDeleteModal from "@/components/modals/Admin/ConfirmDeleteModal";
import {
  Users,
  Info,
  Filter,
  ChevronDown,
  Search,
  Download,
  Plus,
  RefreshCw,
  Clock,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
} from "lucide-react";
import { userService, UserCreate } from "@/services/userService";
import FormularioNuevoUsuario from "@/components/modals/Admin/FormularioNuevoUsuario";
import Layout from "@/components/layout/Admin/layout";
import Alert from "@/components/ui/Alert";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// La interfaz Usuario se importa desde userSlice

const UsersPage: React.FC = () => {
  const dispatch = useDispatch();
  const { users } = useAppSelector((state) => state.user);

  // Estados locales para la gestión de la página
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [viewingUser, setViewingUser] = useState<Usuario | null>(null);
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    show: boolean;
    user: Usuario | null;
  }>({
    show: false,
    user: null,
  });
  const [alert, setAlert] = useState<{
    show: boolean;
    type: "success" | "error" | "warning" | "info";
    message: string;
  }>({
    show: false,
    type: "info",
    message: "",
  });

  // Función para mostrar alertas
  const showAlert = (
    type: "success" | "error" | "warning" | "info",
    message: string
  ) => {
    setAlert({
      show: true,
      type,
      message,
    });

    // Auto-ocultar la alerta después de 5 segundos
    setTimeout(() => {
      setAlert((prev) => ({ ...prev, show: false }));
    }, 5000);
  }; // Efecto para cargar usuarios al montar el componente o cuando cambian los filtros
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        dispatch(fetchUsersStart());
        const response = await userService.getAllUsers(
          currentPage,
          itemsPerPage,
          searchTerm,
          filterStatus
        );

        dispatch(
          fetchUsersSuccess({
            users: response.users,
            total: response.total,
            pages: response.pages,
          })
        );
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.message || "Error al cargar usuarios";
        dispatch(fetchUsersFailure(errorMsg));
        showAlert("error", errorMsg);
      }
    };
    fetchUsers();
  }, [dispatch, currentPage, itemsPerPage, searchTerm, filterStatus]);
  // Filtrar usuarios según términos de búsqueda y filtros
  const filteredUsers = users.filter((user: Usuario) => {
    const matchesSearch =
      searchTerm === "" ||
      user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.cedula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email &&
        user.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filterStatus === null || user.estado === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Calcular el número total de páginas después del filtrado
  const filteredTotalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Calcular los usuarios a mostrar basados en la página actual y elementos por página
  const startIndex = (currentPage - 1) * itemsPerPage;
  const displayedUsers = filteredUsers.slice(
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

  const getStatusStyles = (estado: string) => {
    switch (estado) {
      case "activo":
        return "bg-green-100 text-green-800";
      case "inactivo":
        return "bg-gray-100 text-gray-800";
      case "suspendido":
        return "bg-red-100 text-red-800";
      case "pendiente":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case "activo":
        return <CheckCircle className="w-4 h-4" />;
      case "inactivo":
        return <Clock className="w-4 h-4" />;
      case "suspendido":
        return <XCircle className="w-4 h-4" />;
      case "pendiente":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };
  const handleViewUser = (user: Usuario) => {
    setViewingUser(user);
    setShowViewDetails(true);
    setShowForm(false); // Aseguramos que el form de edición no esté activo
  };

  const handleCloseViewDetails = () => {
    setShowViewDetails(false);
    setViewingUser(null);
  };

  const handleEditUser = (user: Usuario) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleShowDeleteModal = (user: Usuario) => {
    setDeleteModal({
      show: true,
      user: user,
    });
  };

  const handleCancelDelete = () => {
    setDeleteModal({
      show: false,
      user: null,
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteModal.user) return;

    const userId = deleteModal.user.id;
    dispatch(deleteUserStart());

    userService
      .deleteUser(userId)
      .then(() => {
        dispatch(deleteUserSuccess(userId));
        showAlert("success", "Usuario eliminado correctamente");
        setDeleteModal({ show: false, user: null });
      })
      .catch((error) => {
        const errorMsg =
          error?.response?.data?.message || "Error al eliminar usuario";
        dispatch(deleteUserFailure(errorMsg));
        showAlert("error", errorMsg);
        setDeleteModal({ show: false, user: null });
      });
  };
  // La función handleCloseUserDetail ya no se necesita porque usamos handleCloseViewDetails

  const showNewUserForm = () => {
    setEditingUser(null);
    setShowForm(true);
  }; // Esta función se está utilizando en el botón del componente
  const handleFormSubmit = (data: UserCreate) => {
    if (editingUser) {
      // Editar usuario
      dispatch(updateUserStart());
      userService
        .updateUser(editingUser.id, data)
        .then((updatedUser) => {
          dispatch(updateUserSuccess(updatedUser));
          setEditingUser(null);
          showAlert("success", "Usuario actualizado correctamente");
        })
        .catch((error) => {
          const errorMsg =
            error?.response?.data?.message || "Error al actualizar usuario";
          dispatch(updateUserFailure(errorMsg));
          showAlert("error", errorMsg);
        });
    } else {
      // Nuevo usuario
      dispatch(addUserStart());
      userService
        .createUser(data)
        .then((response) => {
          dispatch(addUserSuccess(response));
          showAlert("success", "Usuario creado correctamente");
        })
        .catch((error) => {
          const errorMsg =
            error?.response?.data?.message || "Error al crear usuario";
          dispatch(addUserFailure(errorMsg));
          showAlert("error", errorMsg);
        });
    }
    setShowForm(false);
  };

  const handleFormCancel = () => {
    setShowForm(false);
  };

  // Funciones adicionales que pueden ser útiles en el futuro
  /* 
  const handleNewUserClick = () => {
    setShowForm(true);
  };
  
  const handleBackToUsers = () => {
    setShowForm(false);
  };
  */

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
  return (
    <Layout>
      <div className="flex-1 p-4 md:p-6 max-w-full bg-gray-50">
        {" "}
        {/* Formulario de detalles de usuario en modo de solo lectura */}
        {/* Modal de confirmación de eliminación */}
        {deleteModal.show && deleteModal.user && (
          <ConfirmDeleteModal
            userId={deleteModal.user.id}
            userName={deleteModal.user.nombre}
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
          />
        )}
        {/* Alerta */}
        {alert.show && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert((prev) => ({ ...prev, show: false }))}
            className="mb-4"
          />
        )}
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#34509F] mb-2 flex items-center gap-2">
                <Users className="inline-block h-6 w-6 md:h-8 md:w-8" />
                USUARIOS
              </h1>
              <p className="text-gray-500 text-sm text-left">
                {showForm
                  ? "Crear nuevo usuario"
                  : `Total: ${filteredUsers.length} usuarios ${
                      isFilterActive ? "(filtrados)" : ""
                    }`}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-[#4178D4] rounded-lg bg-[#4178D4] text-white hover:bg-[#34509F] transition-colors shadow-sm cursor-pointer"
                onClick={showNewUserForm}
              >
                <span className="font-bold text-sm whitespace-nowrap">
                  AGREGAR USUARIO
                </span>
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>{" "}
        {/* Mostrar formulario (edición/creación), formulario en modo solo lectura o contenido de usuarios */}{" "}
        {showForm ? (
          // Formulario Nuevo Usuario / Edición
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <FormularioNuevoUsuario
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              initialData={editingUser}
            />
          </div>
        ) : showViewDetails && viewingUser ? (
          // Formulario en modo solo lectura para ver detalles
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <FormularioNuevoUsuario
              onSubmit={() => {}}
              onCancel={handleCloseViewDetails}
              initialData={viewingUser}
              readOnly={true}
              title="DETALLES DE USUARIO"
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
                      placeholder="Buscar usuarios..."
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div
                    className="inline-flex rounded-md shadow-sm"
                    role="group"
                  >
                    <button
                      onClick={() => handleFilterChange("activo")}
                      className={`px-3 py-2 text-xs font-medium rounded-l-lg border ${
                        filterStatus === "activo"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-white border-gray-200 text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      <CheckCircle className="w-4 h-4 inline-block mr-1" />
                      Activos
                    </button>
                    <button
                      onClick={() => handleFilterChange("inactivo")}
                      className={`px-3 py-2 text-xs font-medium border-l-0 border-r-0 border ${
                        filterStatus === "inactivo"
                          ? "bg-gray-100 text-gray-800 border-gray-200"
                          : "bg-white border-gray-200 text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      <Clock className="w-4 h-4 inline-block mr-1" />
                      Inactivos
                    </button>
                    <button
                      onClick={() => handleFilterChange("pendiente")}
                      className={`px-3 py-2 text-xs font-medium border-l-0 border-r-0 border ${
                        filterStatus === "pendiente"
                          ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                          : "bg-white border-gray-200 text-gray-900 hover:bg-gray-100"
                      }`}
                    >
                      <AlertCircle className="w-4 h-4 inline-block mr-1" />
                      Pendientes
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

            {/* Tabla de usuarios */}
            <div className="bg-white overflow-hidden rounded-xl shadow-sm border border-gray-100">
              {displayedUsers.length > 0 ? (
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
                              Cédula
                            </th>
                            <th className="py-4 px-4 text-left text-[#34509F] font-bold whitespace-nowrap">
                              Email
                            </th>
                            <th className="py-4 px-4 text-left text-[#34509F] font-bold whitespace-nowrap">
                              Cargo
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
                          {displayedUsers.map(
                            (user: Usuario, index: number) => (
                              <tr
                                key={user.id}
                                className={`border-b border-gray-100 hover:bg-blue-50/30 transition-colors cursor-pointer ${
                                  index % 2 === 0
                                    ? "bg-white"
                                    : "bg-slate-50/30"
                                }`}
                              >
                                <td className="py-3 px-4 whitespace-nowrap font-medium text-[#34509F]">
                                  #{user.id.toString().padStart(3, "0")}
                                </td>
                                <td className="py-3 px-4 font-medium">
                                  {user.nombre}
                                </td>
                                <td className="py-3 px-4 text-gray-600">
                                  {user.ciudad}
                                </td>
                                <td className="py-3 px-4 text-gray-600">
                                  {user.cedula}
                                </td>
                                <td className="py-3 px-4 text-gray-600">
                                  {user.email || "-"}
                                </td>
                                <td className="py-3 px-4 text-gray-600">
                                  {user.cargo || "-"}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span
                                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusStyles(
                                      user.estado
                                    )}`}
                                  >
                                    {getStatusIcon(user.estado)}
                                    {user.estado.charAt(0).toUpperCase() +
                                      user.estado.slice(1)}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center flex gap-2 justify-center">
                                  {/* Ver */}
                                  <button
                                    className="text-[#4178D4] hover:text-[#34509F]"
                                    onClick={() => handleViewUser(user)}
                                  >
                                    <Info className="w-5 h-5" />
                                  </button>
                                  {/* Editar */}
                                  <button
                                    className="text-[#FFB200] hover:text-[#FFA000]"
                                    onClick={() => handleEditUser(user)}
                                  >
                                    <Pencil className="w-5 h-5" />
                                  </button>{" "}
                                  {/* Eliminar */}
                                  <button
                                    className="text-[#E53935] hover:text-[#B71C1C]"
                                    onClick={() => handleShowDeleteModal(user)}
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Controles de paginación */}
                  <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-gray-200 gap-4 bg-gray-50/50">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">
                        Mostrando{" "}
                        {Math.min(startIndex + 1, filteredUsers.length)} -{" "}
                        {Math.min(
                          startIndex + itemsPerPage,
                          filteredUsers.length
                        )}{" "}
                        de {filteredUsers.length} registros
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
                    No se encontraron usuarios que coincidan con los criterios
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
      </div>
    </Layout>
  );
};

export default UsersPage;
