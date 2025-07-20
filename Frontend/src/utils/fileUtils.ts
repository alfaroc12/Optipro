export const downloadFile = async (url: string, filename: string): Promise<boolean> => {
  try {
    console.log(`Intentando descargar: ${filename} desde ${url}`);

    // Crear un nuevo objeto AbortController para poder cancelar la petición si es necesario
    const controller = new AbortController();
    const signal = controller.signal;

    // Configurar un timeout por si la petición tarda demasiado
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos de timeout

    // Obtener el token de autenticación del localStorage
    const token = JSON.parse(localStorage.getItem("auth") || "{}")?.token || "";
    console.log("Token disponible:", token ? "Sí" : "No");

    // Hacer la petición para obtener el archivo como Blob
    const response = await fetch(url, {
      method: "GET",
      credentials: "include",
      signal,
      headers: {
        // Incluir cabeceras de autenticación si están disponibles
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    clearTimeout(timeoutId);

    // Verificar si la respuesta fue exitosa
    if (!response.ok) {
      console.error(`Error HTTP: ${response.status} - ${response.statusText}`);

      // Si es un error 404, intentar con una URL alternativa
      if (response.status === 404) {
        console.log(
          "Archivo no encontrado. Intentando con ruta alternativa..."
        );

        // Crear URL alternativa: primero intentar quitando 'media/' duplicado
        let alternativeUrl = url.replace("/media/media/", "/media/");

        // Si la URL original no tenía 'media/media/', intentar agregándolo
        if (url === alternativeUrl) {
          const urlParts = url.split("/");
          const lastPart = urlParts[urlParts.length - 1];
          alternativeUrl = url.replace(lastPart, `media/${lastPart}`);
        }

        console.log("Intentando con URL alternativa:", alternativeUrl);

        // Si es diferente, intentar descargar con la URL alternativa
        if (url !== alternativeUrl) {
          // Llamarse recursivamente con la nueva URL pero con un flag para evitar bucles infinitos
          return downloadFile(alternativeUrl, filename);
        }
      }

      // Si llegamos aquí, mostrar error en la consola pero no al usuario
      throw new Error(`Error al descargar el archivo: ${response.statusText}`);
    }

    // Obtener el contenido como Blob
    const blob = await response.blob();
    console.log("Archivo recibido correctamente. Tamaño:", blob.size);

    // Crear una URL para el blob
    const blobUrl = window.URL.createObjectURL(blob);

    // Crear un enlace para descargar
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;

    // Añadir el enlace al DOM, hacer clic y removerlo
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log("Descarga iniciada");

    // Liberar la URL del blob cuando ya no sea necesaria
    setTimeout(() => {
      window.URL.revokeObjectURL(blobUrl);
    }, 100);

    return true;
  } catch (error) {
    console.error("Error al descargar el archivo:", error);
    // No mostrar alert/confirm, solo mostrar mensaje en consola y mediante toast
    
    return false;
  }
};

// Función para corregir las rutas de archivos media
export const getCorrectMediaUrl = (url: string): string => {
  if (!url) return "";

  // Obtener la URL base del API desde la configuración (asegurarse de que no tenga "/" al final)
  const API_BASE_URL = "http://127.0.0.1:8000";

  console.log("URL original:", url);

  // Limpiar y normalizar la URL
  // Reemplazar espacios por guiones bajos en nombres de archivos
  let cleanedUrl = url;
  // Extraer el nombre del archivo (última parte después de la última barra o backslash)
  const parts = url.split(/[\/\\]/);
  const fileName = parts[parts.length - 1];

  if (fileName && fileName.includes(" ")) {
    const fileNameWithUnderscores = fileName.replace(/ /g, "_");
    cleanedUrl = url.replace(fileName, fileNameWithUnderscores);
    console.log(
      "Nombre de archivo con espacios convertido a guiones bajos:",
      fileNameWithUnderscores
    );
  }

  // Si la URL ya es absoluta (comienza con http:// o https://), procesarla
  if (cleanedUrl.startsWith("http://") || cleanedUrl.startsWith("https://")) {
    // Corregir duplicación de base URL
    if (cleanedUrl.includes("http://127.0.0.1:8000http://127.0.0.1:8000")) {
      cleanedUrl = cleanedUrl.replace(
        "http://127.0.0.1:8000http://127.0.0.1:8000",
        "http://127.0.0.1:8000"
      );
    }

    // Asegurar que contenga /media/media/ (estructura correcta según el backend)
    if (
      cleanedUrl.includes("/media/") &&
      !cleanedUrl.includes("/media/media/")
    ) {
      // No reemplazar si ya tiene la estructura correcta
      if (!cleanedUrl.match(/\/media\/media\//)) {
        cleanedUrl = cleanedUrl.replace(/\/media\//, "/media/media/");
      }
    }

    console.log("URL procesada (absoluta):", cleanedUrl);
    return cleanedUrl;
  }

  // Asegurarnos de que la URL no comience con "/", para evitar doble barra
  let finalUrl = cleanedUrl.startsWith("/")
    ? cleanedUrl.substring(1)
    : cleanedUrl;

  // Asegurar que si contiene path "media/" pero no "media/media/", se agregue la estructura correcta
  if (finalUrl.startsWith("media/") && !finalUrl.startsWith("media/media/")) {
    finalUrl = finalUrl.replace("media/", "media/media/");
  }

  // Si no comienza con "media/" en absoluto, asegurarse de que tenga el prefijo correcto
  if (!finalUrl.includes("media/")) {
    finalUrl = `media/media/${finalUrl}`;
  }

  // Construir la URL completa con la base de la API
  const result = `${API_BASE_URL}/${finalUrl}`;
  console.log("URL final:", result);
  return result;
};

export const downloadQuotationPDF = () => {
  const pdfPath = "/ctz/cotizacion.pdf";
  downloadFile(pdfPath, "cotizacion.pdf");
};
