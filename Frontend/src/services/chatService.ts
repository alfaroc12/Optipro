import axios from "axios";
import { ChatMessage } from "@/types/chat";

// Usar una constante directa para evitar problemas con process.env en el navegador
const API_URL = `${import.meta.env.VITE_API_URL}`;

export const fetchChatMessages = async (
  cotizacionId: string | number
): Promise<ChatMessage[]> => {
  try {
    const response = await axios.get(
      `${API_URL}/api/chat/messages/${cotizacionId}/`
    );

    // Procesar los archivos adjuntos para asegurarnos de que tengan URLs absolutas
    const messages = response.data.map((message: any) => {
      if (message.attachments && message.attachments.length > 0) {
        // Asegurarse de que los archivos tienen URLs completas
        message.attachments = message.attachments.map((attachment: any) => {
          return {
            ...attachment,
            fileName: attachment.file_name,
            fileUrl: attachment.file.startsWith("http")
              ? attachment.file
              : `${API_URL}${attachment.file}`,
          };
        });
      }

      // Mapear el campo negotiation_progress al formato que espera el frontend
      if (message.negotiation_progress) {
        message.negotiationProgress = message.negotiation_progress;
      }

      // Normalizar el campo de commitment si existe
      if (message.commitment) {
        // Si ya está en el formato esperado, lo dejamos como está
      } else if (message.commitment_type) {
        // Si viene como commitment_type, lo convertimos al formato esperado por el frontend
        if (
          message.commitment_type === "otros" &&
          message.commitment_description
        ) {
          message.commitment = {
            type: "otros",
            description: message.commitment_description,
          };
        } else {
          message.commitment = message.commitment_type;
        }
      }

      return message;
    });

    return messages;
  } catch (error) {
    console.error("Error al obtener mensajes:", error);
    return [];
  }
};

export const sendMessage = async (
  message: ChatMessage,
  cotizacionId: string | number,
  files?: File[]
): Promise<ChatMessage> => {
  try {
    const formData = new FormData();
    formData.append("message", message.message);
    formData.append("cotizacion_id", cotizacionId.toString());

    // Enviar el user_id explícitamente
    if (message.userId) {
      formData.append("user_id", message.userId);
    }

    // Enviar el nombre de usuario
    formData.append("user_name", message.userName || "Usuario");

    if (message.parentMessageId) {
      formData.append("parent_message_id", message.parentMessageId);
    }

    // Agregar información de compromiso
    if (message.commitment) {
      if (typeof message.commitment === "string") {
        formData.append("commitment_type", message.commitment);
      } else {
        formData.append("commitment_type", "otros");
        formData.append(
          "commitment_description",
          message.commitment.description
        );
      }
    }

    // Agregar progreso de negociación
    formData.append(
      "negotiation_progress",
      message.negotiationProgress || "0%"
    );

    // Agregar archivos adjuntos si existen
    if (files && files.length > 0) {
      files.forEach((file) => {
        formData.append("attachments", file);
      });
    }

    const response = await axios.post(
      `${API_URL}/api/chat/messages/`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
    throw error;
  }
};