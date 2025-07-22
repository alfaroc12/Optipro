import axios from "axios";
import { ChatMessage } from "@/types/chat";

// Asegúrate que la URL NO tiene barra al final
const API_URL = import.meta.env.VITE_API_URL.replace(/\/$/, "");

export const fetchChatMessages = async (
  cotizacionId: string | number
): Promise<ChatMessage[]> => {
  try {
    const response = await axios.get(
      `${API_URL}/api/chat/messages/${cotizacionId}/`
    );

    const messages = response.data.map((message: any) => {
      // Procesar archivos adjuntos con URLs completas
      if (message.attachments && message.attachments.length > 0) {
        message.attachments = message.attachments.map((attachment: any) => ({
          ...attachment,
          fileName: attachment.file_name,
          fileUrl: attachment.file.startsWith("http")
            ? attachment.file
            : `${API_URL}${attachment.file}`,
        }));
      }

      // Mapear negociación
      if (message.negotiation_progress) {
        message.negotiationProgress = message.negotiation_progress;
      }

      // Normalizar compromiso
      if (message.commitment_type === "otros" && message.commitment_description) {
        message.commitment = {
          type: "otros",
          description: message.commitment_description,
        };
      } else {
        message.commitment = message.commitment_type;
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

    if (message.userId) {
      formData.append("user_id", message.userId);
    }

    formData.append("user_name", message.userName || "Usuario");

    if (message.parentMessageId) {
      formData.append("parent_message_id", message.parentMessageId);
    }

    if (message.commitment) {
      if (typeof message.commitment === "string") {
        formData.append("commitment_type", message.commitment);
      } else {
        formData.append("commitment_type", "otros");
        formData.append("commitment_description", message.commitment.description);
      }
    }

    formData.append("negotiation_progress", message.negotiationProgress || "0%");

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
