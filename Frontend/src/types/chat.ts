export type CommitmentType =
  | "Llamar coordinar visita"
  | "Retomar negociacion"
  | "Visitar nuevamente"
  | "Confirmar cita"
  | "Llamada de seguimiento"
  | { type: "otros"; description: string };

export type NegotiationProgress =
  | "0%"
  | "10%"
  | "20%"
  | "30%"
  | "40%"
  | "50%"
  | "60%"
  | "70%"
  | "80%"
  | "90%"
  | "100%";

export interface ChatAttachment {
  fileName: string;
  fileUrl: string;
  // No guardamos el objeto File en el estado de Redux
}

export interface ChatMessage {
  id: string;
  userId?: string; // Opcional para manejar respuestas del backend
  user_id?: number; // Campo que viene del backend
  userName?: string; // Versión camelCase para frontend
  user_name?: string; // Versión con guiones para backend
  message: string;
  timestamp: string;
  attachments?: ChatAttachment[];
  parentMessageId?: string; // ID del mensaje al que se responde
  parent_message_id?: number; // Versión con guiones para backend
  replies?: string[]; // IDs de las respuestas a este mensaje
  isReply?: boolean; // Indica si es una respuesta
  commitment?: CommitmentType;
  commitment_type?: string; // Versión del backend
  commitment_description?: string; // Versión del backend
  negotiationProgress?: NegotiationProgress;
  negotiation_progress?: string; // Versión del backend
}

export interface ChatWallProps {
  cotizacionId: string;
  cotizacionData: any; // Los datos de la cotización que vienen del formulario
}
