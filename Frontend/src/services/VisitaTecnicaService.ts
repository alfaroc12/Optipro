import api from "./api";

// Interfaces para los datos de la visita técnica
export interface VisitaTecnicaData {
  // Información básica
  code?: string;
  name: string;
  last_name: string;
  city: string;
  department: string;
  phone: string;
  N_identification: string;
  company: string;
  addres: string;
  date_visit: string;
  start_time: string;
  end_time?: string;
  concept_visit?: string;
  description_more?: string;
  evidence_photo?: File[] | null; // MODIFICADO: ahora es array de archivos
  nic?: string;

  // Preguntas técnicas anidadas
  question_id: {
    Q_1: string;
    Q_1_comentary?: string;
    Q_2: string;
    Q_2_comentary?: string;
    Q_3: string;
    Q_3_comentary?: string;
    Q_4: string;
    Q_4_comentary?: string;
    Q_5: string;
    Q_5_comentary?: string;
    Q_6: string;
    Q_6_comentary?: string;
  };
}

// Interface para las evidencias fotográficas
export interface EvidencePhoto {
  id: number;
  photo: string;
  photo_url: string;
  uploaded_at: string;
  order: number;
}

// Interface para la respuesta del backend
export interface VisitaTecnicaResponse {
  id: number;
  code: string;
  name: string;
  last_name: string;
  city: string;
  department: string;
  phone: string;
  N_identification: string;
  company: string;
  addres: string;
  date_visit: string;
  start_time: string;
  end_time?: string;
  concept_visit: string;
  description_more?: string;
  evidence_photos: EvidencePhoto[]; // MODIFICADO: ahora es array de evidencias
  nic?: string;
  question_id: {
    id: number;
    Q_1: string;
    Q_1_comentary?: string;
    Q_2: string;
    Q_2_comentary?: string;
    Q_3: string;
    Q_3_comentary?: string;
    Q_4: string;
    Q_4_comentary?: string;
    Q_5: string;
    Q_5_comentary?: string;
    Q_6: string;
    Q_6_comentary?: string;
  };
}

// Interface para el formulario del frontend
export interface VisitaTecnicaFormData {
  // Paso 1: Información del cliente
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

  // Paso 2: Aspectos evaluados (primeros 4)
  tipoMedida: string;
  comentariosTipoMedida: string;
  sistemaPuestaTierra: string;
  comentariosSistemaPuestaTierra: string;
  disponibilidadSitio: string;
  comentariosDisponibilidadSitio: string;
  condicionesAcceso: string;
  comentariosCondicionesAcceso: string;

  // Paso 3: Aspectos adicionales y concepto
  verificacionAerea: string;
  comentariosVerificacionAerea: string;
  copiaFactura: string;
  comentariosCopiaFactura: string;
  conceptoVisitante: string;
  observacionesAdicionales: string;
  evidenciaFotografica: string | string[] | null; // MODIFICADO: puede ser array
  evidenciaFiles?: File[]; // MODIFICADO: array de archivos
  nic: string;
}

// 2. MODIFICAR LA FUNCIÓN mapFormDataToBackend
// Función auxiliar para asegurar que los valores sean strings únicos
const ensureString = (value: any): string => {
  if (Array.isArray(value)) {
    return String(value[0] || '');
  }
  return String(value || '');
};

const mapFormDataToBackend = (
  formData: VisitaTecnicaFormData
): VisitaTecnicaData => {
  // Generar un código único de 6 caracteres (por ejemplo: VP0001)
  const code = `VP${Math.floor(1000 + Math.random() * 9000)}`;

  // Mapear el valor del concepto a las opciones válidas del backend
  let conceptVisit = "proceeds"; // valor predeterminado
  const conceptoValue = Array.isArray(formData.conceptoVisitante) 
    ? formData.conceptoVisitante[0] 
    : formData.conceptoVisitante;
    
  if (conceptoValue === "Procede") {
    conceptVisit = "proceeds";
  } else if (conceptoValue === "No procede") {
    conceptVisit = "not applicable";
  } else if (conceptoValue === "Procede con condiciones") {
    conceptVisit = "proceed conditions";
  }

  // Convertir formato de fecha y hora a formato YYYY-MM-DD
  const formatDate = (dateStr: string): string => {
    // Si ya viene en formato YYYY-MM-DD, lo dejamos igual
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // Si viene como una fecha en otro formato o una hora, la convertimos
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const formatTime = (timeStr: string): string => {
  if (!timeStr) return "";
  
  // Si ya viene en formato HH:MM:SS, lo dejamos igual
  if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
    return timeStr;
  }
  
  // Si viene en formato HH:MM (del input type="time"), agregamos :00
  if (/^\d{2}:\d{2}$/.test(timeStr)) {
    return `${timeStr}:00`;
  }
  
  return timeStr;
};

  // Manejar múltiples archivos de evidencia
  let evidenceFiles: File[] | null = null;
  if (formData.evidenciaFiles && formData.evidenciaFiles.length > 0) {
    evidenceFiles = formData.evidenciaFiles;
  }

  return {
    code: code,
    name: ensureString(formData.nombre),
    last_name: ensureString(formData.apellidos),
    city: ensureString(formData.ciudad),
    department: ensureString(formData.departamento),
    phone: ensureString(formData.telefono),
    N_identification: ensureString(formData.nitcc),
    company: ensureString(formData.nombreEmpresa),
    addres: ensureString(formData.direccion),
    date_visit : formatDate(ensureString(formData.fechaVisita)),
    start_time: formatTime(ensureString(formData.horaInicio)),
    end_time: formData.horaFin ? formatTime(ensureString(formData.horaFin)) : undefined,
    concept_visit: conceptVisit,
    description_more: formData.observacionesAdicionales ? ensureString(formData.observacionesAdicionales) : undefined,
    evidence_photo: evidenceFiles, // MODIFICADO: array de archivos
    nic: formData.nic ? ensureString(formData.nic) : undefined,
    question_id: {
      Q_1: ensureString(formData.tipoMedida),
      Q_1_comentary: formData.comentariosTipoMedida ? ensureString(formData.comentariosTipoMedida) : undefined,
      Q_2: ensureString(formData.sistemaPuestaTierra),
      Q_2_comentary: formData.comentariosSistemaPuestaTierra ? ensureString(formData.comentariosSistemaPuestaTierra) : undefined,
      Q_3: ensureString(formData.disponibilidadSitio),
      Q_3_comentary: formData.comentariosDisponibilidadSitio ? ensureString(formData.comentariosDisponibilidadSitio) : undefined,
      Q_4: ensureString(formData.condicionesAcceso),
      Q_4_comentary: formData.comentariosCondicionesAcceso ? ensureString(formData.comentariosCondicionesAcceso) : undefined,
      Q_5: ensureString(formData.verificacionAerea),
      Q_5_comentary: formData.comentariosVerificacionAerea ? ensureString(formData.comentariosVerificacionAerea) : undefined,
      Q_6: ensureString(formData.copiaFactura),
      Q_6_comentary: formData.comentariosCopiaFactura ? ensureString(formData.comentariosCopiaFactura) : undefined,
    },
  };
};

// 3. MODIFICAR LAS FUNCIONES create Y update EN visitaTecnicaService
export const visitaTecnicaService = {
  /**
   * Crear una nueva visita técnica
   */
  async create(
    formData: VisitaTecnicaFormData
  ): Promise<VisitaTecnicaResponse> {
    try {
      // Validaciones básicas antes de enviar al backend
      if (
        !formData.nombre ||
        !formData.apellidos ||
        !formData.ciudad ||
        !formData.departamento ||
        !formData.telefono ||
        !formData.nitcc ||
        !formData.nombreEmpresa ||
        !formData.direccion ||
        !formData.horaInicio ||
        !formData.conceptoVisitante
      ) {
        throw new Error("Por favor complete todos los campos obligatorios");
      }

      const backendData = mapFormDataToBackend(formData);
      console.log("Datos enviados al backend:", backendData);

      // Crear un FormData para manejar múltiples archivos
      const formDataObj = new FormData();

      // Agregar campos simples usando set() para evitar arrays
      Object.entries(backendData).forEach(([key, value]) => {
        if (key === "evidence_photo") {
          // Los archivos se manejan por separado
          return;
        } else if (key === "question_id") {
          // Los datos de preguntas se manejan por separado
          return;
        } else if (value !== undefined && value !== null) {
          // Usar set() en lugar de append() para campos únicos
          formDataObj.set(key, String(value));
        }
      });

      // Agregar archivos de evidencia (aquí sí usamos append para múltiples archivos)
      if (formData.evidenciaFiles && formData.evidenciaFiles.length > 0) {
        formData.evidenciaFiles.forEach((file, _index) => {
          formDataObj.append(`evidence_photo`, file);
        });
      }

      // Agregar datos de preguntas técnicas usando set() para evitar duplicados
      const questions = backendData.question_id;
      if (questions) {
        Object.entries(questions).forEach(([qKey, qValue]) => {
          if (qValue !== undefined && qValue !== null) {
            // Usar set() para asegurar que cada pregunta tenga un solo valor
            formDataObj.set(`question_id.${qKey}`, String(qValue));
          }
        });
      }

      // Agregar debug para ver qué se está enviando
      console.log("FormData entries before sending:");
      console.log("=== CAMPOS SIMPLES ===");
      for (let [key, value] of formDataObj.entries()) {
        if (!key.startsWith('question_id.') && key !== 'evidence_photo') {
          console.log(`${key}: "${value}" (type: ${typeof value})`);
        }
      }
      
      console.log("=== PREGUNTAS TÉCNICAS ===");
      for (let [key, value] of formDataObj.entries()) {
        if (key.startsWith('question_id.')) {
          console.log(`${key}: "${value}" (type: ${typeof value})`);
        }
      }
      
      console.log("=== ARCHIVOS ===");
      for (let [key, value] of formDataObj.entries()) {
        if (key === 'evidence_photo') {
          console.log(`${key}: ${value instanceof File ? value.name : value}`);
        }
      }

      // Enviar los datos como FormData
      const response = await api.post("technical_visit/create/", formDataObj, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error: any) {
      console.error("Error creating technical visit:", error);
      throw error;
    }
  },

  /**
   * Obtener lista de visitas técnicas
   */
  async getList(query?: string): Promise<VisitaTecnicaResponse[]> {
    try {
      const params = query ? { query } : {};
      const response = await api.get("technical_visit/list/", { params });
      return response.data.results || response.data;
    } catch (error: any) {
      console.error("Error fetching technical visits:", error);
      throw error;
    }
  },

  /**
   * Actualizar una visita técnica
   */
  async update(
    id: number,
    formData: VisitaTecnicaFormData
  ): Promise<VisitaTecnicaResponse> {
    try {
      const backendData = mapFormDataToBackend(formData);

      // Crear un FormData para manejar múltiples archivos
      const formDataObj = new FormData();

      // Agregar campos simples usando set() para evitar arrays
      Object.entries(backendData).forEach(([key, value]) => {
        if (key === "evidence_photo") {
          // Los archivos se manejan por separado
          return;
        } else if (key === "question_id") {
          // Los datos de preguntas se manejan por separado
          return;
        } else if (value !== undefined && value !== null) {
          // Usar set() en lugar de append() para campos únicos
          formDataObj.set(key, String(value));
        }
      });

      // Agregar archivos de evidencia (aquí sí usamos append para múltiples archivos)
      if (formData.evidenciaFiles && formData.evidenciaFiles.length > 0) {
        formData.evidenciaFiles.forEach((file, _index) => {
          formDataObj.append(`evidence_photo`, file);
        });
      }

      // Agregar datos de preguntas técnicas usando set() para evitar duplicados
      const questions = backendData.question_id;
      if (questions) {
        Object.entries(questions).forEach(([qKey, qValue]) => {
          if (qValue !== undefined && qValue !== null) {
            // Usar set() para asegurar que cada pregunta tenga un solo valor
            formDataObj.set(`question_id.${qKey}`, String(qValue));
          }
        });
      }

      // Enviar los datos como FormData
      const response = await api.put(
        `technical_visit/update/${id}/`,
        formDataObj,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      console.error("Error updating technical visit:", error);
      throw error;
    }
  },

  /**
   * Filtrar visitas técnicas por NIT/CC
   */
  async filterByNitCC(nitCC: string): Promise<VisitaTecnicaResponse[]> {
    try {
      const response = await api.get("technical-visits/nit-cc/", {
        params: { nitCC },
      });
      return response.data;
    } catch (error: any) {
      console.error("Error filtering by NIT/CC:", error);
      throw error;
    }
  },

  /**
   * Obtener lista de visitas técnicas del usuario actual
   */
  async getUserVisits(userId: number): Promise<VisitaTecnicaResponse[]> {
    try {
      const response = await api.get("technical_visit/list/", {
        params: { user_id: userId },
      });
      return response.data.results || response.data;
    } catch (error: any) {
      console.error("Error fetching user technical visits:", error);
      throw error;
    }
  },

  /**
   * Obtener visita técnica por ID
   */
  async getById(id: number): Promise<VisitaTecnicaResponse> {
    try {
      const response = await api.get(`technical_visit/retrieve/${id}/`);
      return response.data;
    } catch (error: any) {
      console.error("Error fetching technical visit by id:", error);
      throw error;
    }
  },
};
