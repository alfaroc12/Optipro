import axios from "axios";
import api from "./api";

// Usar una constante directa para evitar problemas con process.env en el navegador
const API_URL = `${import.meta.env.VITE_API_URL}`;
export interface QuotationDocument {
  id: string;
  name: string;
  uploadDate: string; // Esta será convertida a Date cuando se use
  size: string;
  uploadedBy: string;
  fileUrl: string;
  content_type?: string;
  attach?: string;
  username?: string; // Campo para almacenar el nombre del usuario que subió el archivo
}

export const fetchQuotationDocument = async (
  cotizacionId: string | number
): Promise<string | null> => {
  try {
    // URL base de la API de producción
    const API_BASE_URL = "https://backend-optipro-production.up.railway.app";
    
    // Función auxiliar para obtener los headers de autenticación
    function getAuthHeaders() {
      const token = JSON.parse(localStorage.getItem("auth") || "{}")?.token || "";
      return token ? { Authorization: `Bearer ${token}` } : {};
    }
    
    // Primero intentamos obtener los detalles de la oferta para verificar si hay un archivo
    const ofertaResponse = await axios.get(
      `${API_BASE_URL}/sale_order/retrieve/${cotizacionId}/`,
      {
        headers: {
          ...getAuthHeaders()
        }
      }
    );

    if (!ofertaResponse.data || !ofertaResponse.data.archivo_cotizacion) {
      return null;
    }

    // Si hay un archivo, aseguramos que la URL es absoluta y usa la URL de producción
    let fileUrl = ofertaResponse.data.archivo_cotizacion;
    
    // Si la URL no es absoluta o no usa la URL de producción, la corregimos
    if (!fileUrl.startsWith('http')) {
      fileUrl = `${API_BASE_URL}/${fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl}`;
    } else if (!fileUrl.includes(API_BASE_URL)) {
      // Extraer la ruta de la URL
      const urlObj = new URL(fileUrl);
      const path = urlObj.pathname;
      fileUrl = `${API_BASE_URL}${path}`;
    }
    
    // Realizar la petición para obtener el archivo
    const response = await axios.get(fileUrl, {
      responseType: "blob",
      headers: {
        ...getAuthHeaders()
      }
    });

    if (response.status === 200) {
      return URL.createObjectURL(response.data);
    }
    return null;
  } catch (error) {
    console.error("Error al obtener el documento de cotización:", error);
    return null;
  }
};

export const fetchQuotationDocuments = async (
  cotizacionId: string | number
): Promise<QuotationDocument[]> => {
  try {
    let response;
    const API_BASE_URL = "https://backend-optipro-production.up.railway.app";
    
    try {
      // Intentar con la ruta principal en la URL de producción
      response = await axios.get(
        `${API_BASE_URL}/sale_order/attach_sale_order/list/?sale_order=${cotizacionId}`,
        {
          headers: {
            // Incluir token si está disponible
            ...getAuthHeaders()
          }
        }
      );
    } catch (error) {
      // Si falla, intentar con la ruta de depuración en la URL de producción
      response = await axios.get(
        `${API_BASE_URL}/debug/attach_sale_order/?sale_order=${cotizacionId}`,
        {
          headers: {
            // Incluir token si está disponible
            ...getAuthHeaders()
          }
        }
      );
    }
    
    // Función auxiliar para obtener los headers de autenticación
    function getAuthHeaders() {
      const token = JSON.parse(localStorage.getItem("auth") || "{}")?.token || "";
      return token ? { Authorization: `Bearer ${token}` } : {};
    }

    if (!response.data) {
      return [];
    } // Si la respuesta viene de la ruta de depuración, tendrá un formato diferente
    if (response.data.results && Array.isArray(response.data.results)) {
      const documents = response.data.results.map((doc: any) => {
        return {
          id: doc.id,
          name: doc.name || "Documento sin nombre",
          uploadDate: doc.date || new Date().toISOString(),
          size: doc.size || "0 KB",
          uploadedBy: doc.username || "Usuario",
          fileUrl: doc.attach,
          content_type: doc.content_type,
          attach: doc.attach,
          username: doc.username,
        };
      });

      return documents;
    }

    // Verificar si es un objeto con mensaje (no hay resultados) o un array
    if (
      response.data.message &&
      response.data.message === "No results found."
    ) {
      return [];
    }

    if (!Array.isArray(response.data)) {
      return [];
    } // Mapear los datos al formato que espera nuestro componente
    const documents = response.data.map((doc: any) => {
      // Formatear el tamaño del archivo si es posible
      let formattedSize = doc.size || "0 KB";
      if (doc.size && !isNaN(Number(doc.size))) {
        const bytes = Number(doc.size);
        const sizes = ["Bytes", "KB", "MB", "GB"];
        if (bytes === 0) {
          formattedSize = "0 Bytes";
        } else {
          const i = Math.floor(Math.log(bytes) / Math.log(1024));
          formattedSize =
            parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
        }
      }

      return {
        id: doc.id,
        name: doc.name || "Documento sin nombre",
        uploadDate: doc.date || new Date().toISOString(),
        size: formattedSize,
        uploadedBy: doc.username || "Usuario", // Usamos el nombre de usuario si está disponible
        fileUrl: doc.attach,
        content_type: doc.content_type,
        attach: doc.attach,
        username: doc.username,
      };
    });

    return documents;
  } catch (error) {
    console.error("Error al obtener los documentos:", error);
    return [];
  }
};

// Función auxiliar para procesar respuestas de subida de archivos
const processUploadResponse = (
  response: any,
  file: File
): QuotationDocument | null => {
  if (!response.data || !response.data.id) {
    console.error("No se recibió un ID válido en la respuesta");
    return null;
  }

  // Mapear la respuesta al formato que espera nuestro componente
  return {
    id: response.data.id,
    name: file.name,
    uploadDate: new Date().toISOString(),
    size: `${(file.size / 1024).toFixed(2)} KB`,
    uploadedBy: response.data.username || "Usuario",
    fileUrl: response.data.attach,
    username: response.data.username || "Usuario",
  };
};

export const uploadQuotationDocument = async (
  cotizacionId: string | number,
  file: File
): Promise<QuotationDocument | null> => {
  try {
    // Preparar el FormData para la subida
    const formData = new FormData();
    formData.append("attach", file);
    formData.append("sale_order_id", cotizacionId.toString());

    // Intentar con el endpoint simplificado primero
    try {
      const response = await api.post(`/sale_order/simple-upload/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return processUploadResponse(response, file);
    } catch (firstError) {
      // Si falla, intentar con el endpoint tradicional

      const response = await api.post(
        `/sale_order/attach_sale_order/create/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return processUploadResponse(response, file);
    }
  } catch (error) {
    console.error("Error al subir el documento:", error);

    // Mostrar más detalles del error para depuración
    if (axios.isAxiosError(error) && error.response) {
      console.error("Detalles del error:", {
        status: error.response.status,
        data: error.response.data,
      });
    }

    return null;
  }
};

// Método alternativo para subir archivos cuando falla el método principal
export const uploadDocumentAlternative = async (
  cotizacionId: string | number,
  file: File
): Promise<boolean> => {
  try {
    // Crear un FormData muy simple
    const formData = new FormData();
    formData.append("file", file);
    formData.append("id", cotizacionId.toString());

    // Hacer la petición directamente a un endpoint simplificado (que habría que crear)
    const response = await fetch(`${API_URL}/upload_simple/`, {
      method: "POST",
      body: formData,
    });

    return response.ok;
  } catch (error) {
    console.error("Error en método alternativo de subida:", error);
    return false;
  }
};

export const downloadQuotationDocument = async (
  documentId: string
): Promise<string | null> => {
  try {
    // Primero obtenemos los detalles del documento
    const detailResponse = await axios.get(
      `${API_URL}/sale_order/attach_sale_order/retrieve/${documentId}/`
    );

    if (!detailResponse.data || !detailResponse.data.attach) {
      console.error(
        "No se encontró la URL del documento en la respuesta:",
        detailResponse.data
      );
      throw new Error("No se encontró la URL del documento");
    }

    // Obtenemos la URL del archivo
    const fileUrl = detailResponse.data.attach;

    // Descargamos el archivo usando la URL
    const response = await axios.get(fileUrl, {
      responseType: "blob",
    });

    // Crear un objeto URL para el blob
    const blobUrl = URL.createObjectURL(response.data);

    return blobUrl;
  } catch (error) {
    console.error("Error al descargar el documento:", error);
    return null;
  }
};

export const downloadQuotationPDF = async (
  cotizacionId: string | number
): Promise<boolean> => {
  try {
    // Verificar y depurar el ID de la cotización
    

    if (!cotizacionId) {
      console.error("Error: ID de cotización no válido", cotizacionId);
      return false;
    }

    // La URL del endpoint que genera el PDF de la cotización
    const url = `https://backend-optipro-production.up.railway.app/api/quotations_pdf/${cotizacionId}/`;
    

    // Realizar la petición para obtener el PDF como un blob
    const response = await axios.get(url, {
      responseType: "blob",
      headers: {
        Accept: "application/pdf",
      },
    });

    if (response.status === 200) {
      // Crear un objeto URL para el blob
      const blob = new Blob([response.data], { type: "application/pdf" });
      const fileUrl = URL.createObjectURL(blob);

      // Nombre del archivo
      const filename = `cotizacion_${cotizacionId}.pdf`;

      // Descargar el archivo
      const link = document.createElement("a");
      link.href = fileUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      // Limpiar después de la descarga
      window.URL.revokeObjectURL(fileUrl);
      document.body.removeChild(link);

      return true;
    }
    return false;
  } catch (error) {
    console.error("Error al descargar el PDF de la cotización:", error);
    return false;
  }
};
