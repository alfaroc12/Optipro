import api from "@/services/api.ts";

export const createProject = async () => {
  const response = await api.post("/proyect/create");
  return response.data;
};

export const getProjects = async () => {
  const response = await api.get("/proyect/list");
  return response.data;
};

export const convertQuotationToProject = async (
  saleOrderId: number
): Promise<any> => {
  try {
    const response = await api.post(`/sale_order_to_proyect/${saleOrderId}/`);
    return response.data;
  } catch (error: any) {
    console.error("Error al convertir cotización a proyecto:", error);

    // Traducir el mensaje de error si existe y es el que menciona que ya existe un proyecto
    if (
      error.response?.data?.error ===
      "A project already exists for this sale order."
    ) {
      const customError = new Error(
        "Ya existe un proyecto para esta cotización"
      );
      customError.name = "ProjectExistsError";
      throw customError;
    }

    throw error;
  }
};

export const checkQuotationHasProject = async (
  saleOrderId: number
): Promise<boolean> => {
  try {
    const projects = await getProjects();
    // Verificamos si existe algún proyecto que tenga la cotización con el ID proporcionado
    // Convertimos a número para asegurarnos de que la comparación sea correcta
    return projects.some(
      (project: any) => Number(project.sale_order_id) === Number(saleOrderId)
    );
  } catch (error) {
    
    return false;
  }
};

export const deleteProject = async (projectId: number): Promise<any> => {
  try {
    console.log(`Eliminando proyecto con ID: ${projectId}`);
    const response = await api.delete(`/proyect/delete/${projectId}/`);
    console.log("Respuesta de eliminación:", response.data);
    return response.data;
  } catch (error: any) {
    console.error("Error en deleteProject service:", error);
    
    // Propagar el error con más información
    if (error.response?.data) {
      throw new Error(error.response.data.error || error.response.data.mensaje || "Error al eliminar el proyecto");
    }
    
    throw new Error(error.message || "Error desconocido al eliminar el proyecto");
  }
};
