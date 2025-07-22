import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store/store";
import {
  ChatMessage,
  ChatWallProps,
  CommitmentType,
  NegotiationProgress,
} from "@/types/chat";
import { addMessage, fetchMessages } from "@/store/slices/chatSlice";
import {
  FileText,
  Download,
  Send,
  Upload,
  X,
  Reply,
  MessageSquare,
  Calendar,
  TrendingUp,
} from "lucide-react";
import QuotationInfo from "./QuotationInfo";

const API_URL = import.meta.env.VITE_API_URL;

const COMMITMENT_OPTIONS = [
  "Llamar coordinar visita",
  "Retomar negociacion",
  "Visitar nuevamente",
  "Confirmar cita",
  "Llamada de seguimiento",
] as const;

const PROGRESS_OPTIONS: NegotiationProgress[] = [
  "0%",
  "10%",
  "20%",
  "30%",
  "40%",
  "50%",
  "60%",
  "70%",
  "80%",
  "90%",
  "100%",
];

const ChatWall: React.FC<ChatWallProps> = ({
  cotizacionId,
  cotizacionData,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const messages = useSelector(
    (state: RootState) => state.chat.messages[cotizacionId] || []
  );
  const user = useSelector((state: RootState) => state.auth.user);
  const [newMessage, setNewMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [selectedCommitment, setSelectedCommitment] = useState<
    CommitmentType | undefined
  >(undefined);
  const [negotiationProgress, setNegotiationProgress] =
    useState<NegotiationProgress>("0%");
  const [otherCommitment, setOtherCommitment] = useState("");
  const [showDocuments, setShowDocuments] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // Cargar mensajes cuando se monte el componente
    dispatch(fetchMessages(cotizacionId));
  }, [dispatch, cotizacionId]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleReply = (message: ChatMessage) => {
    setReplyingTo(message);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const handleCommitmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === "") {
      setSelectedCommitment(undefined);
    } else if (value === "otros") {
      setSelectedCommitment({ type: "otros", description: otherCommitment });
    } else {
      setSelectedCommitment(value as CommitmentType);
    }
  };

  const handleOtherCommitmentChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setOtherCommitment(value);
    if (selectedCommitment && typeof selectedCommitment === "object") {
      setSelectedCommitment({ type: "otros", description: value });
    }
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!newMessage.trim() && selectedFiles.length === 0) {
      return;
    }

    // Guardar referencia a los archivos para usarla después
    const filesToUpload = [...selectedFiles];

    // Creamos un objeto con los datos del mensaje sin incluir los archivos
    const attachments = selectedFiles.map((file) => ({
      fileName: file.name,
      fileUrl: URL.createObjectURL(file),
      // No incluimos el objeto File en el estado de Redux
    }));

    const message: ChatMessage = {
      id: Date.now().toString(), // El backend reemplazará este ID
      userId: user?.id.toString() || "unknown",
      userName: user?.username || "Usuario",
      message: newMessage.trim(),
      timestamp: new Date().toISOString(),
      attachments: attachments.length > 0 ? attachments : undefined,
      parentMessageId: replyingTo?.id,
      isReply: !!replyingTo,
      commitment: selectedCommitment,
      negotiationProgress,
    };

    try {
      // Añadimos el mensaje localmente para feedback inmediato
      dispatch(addMessage({ cotizacionId, message }));
      // Enviar mensaje directamente con los archivos usando fetch
      const formData = new FormData();
      formData.append("message", message.message);
      formData.append("cotizacion_id", cotizacionId.toString());
      formData.append(
        "user_name",
        message.userName || message.user_name || "Usuario"
      );

      // Enviar explícitamente el user_id si está disponible
      if (user && user.id) {
        formData.append("user_id", user.id.toString());
      }

      if (message.parentMessageId) {
        formData.append("parent_message_id", message.parentMessageId);
      }

      // Agregar información de compromiso
      if (message.commitment) {
        if (typeof message.commitment === "string") {
          formData.append("commitment_type", message.commitment);
        } else if (message.commitment) {
          formData.append("commitment_type", "otros");
          formData.append(
            "commitment_description",
            message.commitment.description
          );
        }
      }

      // Agregar progreso de negociación
      if (message.negotiationProgress) {
        formData.append("negotiation_progress", message.negotiationProgress);
      }

      // Agregar archivos adjuntos si existen
      filesToUpload.forEach((file) => {
        formData.append("attachments", file);
      });
      const response = await fetch(`${API_URL}/api/chat/messages/`, {
      method: "POST",
      body: formData,
      credentials: "include",
      });

      if (!response.ok) {
        // Intentar obtener el detalle del error desde el cuerpo de la respuesta
        let errorDetail = "";
        try {
          const errorJson = await response.json();
          errorDetail = JSON.stringify(errorJson);
        } catch (e) {
          errorDetail = await response.text();
        }
        console.error("Detalles del error:", errorDetail);
        throw new Error(`Error al enviar mensaje: ${response.status}`);
      }

      // Recargar mensajes después de enviar
      // dispatch(fetchMessages(cotizacionId));

      // Limpiamos el formulario
      setNewMessage("");
      setSelectedFiles([]);
      setReplyingTo(null);
      setSelectedCommitment(undefined);
      setOtherCommitment("");
      setNegotiationProgress("0%");
    } catch (error) {
      console.error(
        "Error al enviar mensaje:",
        error instanceof Error ? error.message : String(error)
      );
      alert(
        "Hubo un error al enviar el mensaje. Por favor intente nuevamente."
      );
    }
  };

  // Organizar mensajes en una estructura jerárquica
  const organizedMessages = messages.reduce(
    (acc: { [key: string]: ChatMessage[] }, message: ChatMessage) => {
      if (!message.parentMessageId) {
        if (!acc["root"]) acc["root"] = [];
        acc["root"].push(message);
      } else {
        if (!acc[message.parentMessageId]) acc[message.parentMessageId] = [];
        acc[message.parentMessageId].push(message);
      }
      return acc;
    },
    {}
  );

  const renderMessage = (
    message: ChatMessage,
    isReply = false,
    index: number
  ) => {
    const replies = organizedMessages[message.id] || [];
    const isEven = index % 2 === 0;

    return (
      <div
        key={message.id}
        className={`w-full ${
          isReply
            ? "ml-6 md:ml-12 border-l-4 border-blue-100 pl-4 md:pl-6"
            : "mb-6 md:mb-8"
        }`}
      >
        <div
          className={`group relative p-4 md:p-6 rounded-2xl transition-all duration-300 hover:shadow-md ${
            isEven
              ? "bg-gradient-to-r from-blue-50/50 to-blue-50/30 border border-blue-100/60"
              : "bg-gradient-to-r from-slate-50/50 to-slate-50/30 border border-gray-100/60"
          }`}
        >
          <div className="flex items-start gap-3 md:gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-gradient-to-r from-[#4178D4] to-[#5b8de8] flex items-center justify-center ring-4 ring-white shadow-lg">
                {" "}
                <span className="text-white text-sm font-semibold">
                  {(message.user_name || message.userName || "U")
                    .charAt(0)
                    .toUpperCase()}
                </span>
              </div>
            </div>
            <div className="flex-grow min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-3 mb-3">
                {" "}
                <span className="text-sm md:text-base font-semibold text-gray-900">
                  {message.user_name || message.userName || "Usuario"}
                </span>
                <span className="text-xs md:text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                  {new Date(message.timestamp).toLocaleString("es-CO")}
                </span>
              </div>

              {message.parentMessageId && (
                <div className="mb-4 p-3 bg-white/60 rounded-lg border border-gray-200/50">
                  <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                    <Reply className="w-4 h-4 flex-shrink-0" />
                    <span>
                      Respondiendo a{" "}
                      <strong>
                        {
                          messages.find((m) => m.id === message.parentMessageId)
                            ?.userName
                        }
                      </strong>
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row flex-wrap gap-2 md:gap-3 mb-4">
                <div className="flex items-center gap-2 text-xs md:text-sm text-blue-700 bg-blue-100/80 py-2 px-3 md:px-4 rounded-full border border-blue-200/50">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium truncate">
                    {typeof message.commitment === "object" && message.commitment !== null
                      ? message.commitment.description || "Compromiso no especificado"
                      : message.commitment || "Sin compromiso"}
                  </span>

                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-green-700 bg-green-100/80 py-2 px-3 md:px-4 rounded-full border border-green-200/50">
                  <TrendingUp className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">
                    Avance: {message.negotiationProgress}
                  </span>
                </div>
              </div>

              <div className="text-gray-800 text-sm md:text-base leading-relaxed mb-4 bg-white/40 p-3 md:p-4 rounded-xl border border-gray-100/50 break-words">
                {message.message}
              </div>

              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-4 space-y-3">
                  {message.attachments.map((attachment, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 md:p-4 bg-white/80 rounded-xl border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 md:w-5 md:h-5 text-[#4178D4]" />
                      </div>
                      <span className="text-xs md:text-sm text-gray-700 flex-1 font-medium truncate">
                        {attachment.fileName || "Archivo adjunto"}
                      </span>
                      <a
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#4178D4] hover:text-[#2d5aa8] p-2 rounded-lg hover:bg-blue-50 transition-colors flex-shrink-0"
                        download
                      >
                        <Download className="w-4 h-4 md:w-5 md:h-5" />
                      </a>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => handleReply(message)}
                  className="text-gray-500 hover:text-[#4178D4] flex items-center gap-2 text-xs md:text-sm font-medium py-2 px-3 rounded-lg hover:bg-blue-50 transition-all duration-200"
                >
                  <MessageSquare className="w-4 h-4" />
                  Responder
                </button>
              </div>
            </div>
          </div>
        </div>

        {replies.length > 0 && (
          <div className="mt-4">
            {replies.map((reply, replyIndex) =>
              renderMessage(reply, true, index + replyIndex + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full">
      <QuotationInfo
        cotizacion={cotizacionData}
        onDocumentsToggle={setShowDocuments}
      />

      {!showDocuments && (
        <>
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto custom-scrollbar bg-white rounded-2xl shadow-lg border border-gray-200/60 p-4 md:p-8 mb-6 min-h-[55vh] backdrop-blur-sm"
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
              boxShadow:
                "0 10px 40px rgba(65, 120, 212, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
            }}
          >
            {messages.length === 0 ||
            !organizedMessages.root ||
            organizedMessages.root.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-blue-50 rounded-full flex items-center justify-center mb-6">
                  <MessageSquare className="w-10 h-10 text-[#4178D4]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-700 mb-3">
                  No hay mensajes
                </h3>
                <p className="text-gray-500 max-w-md text-base mb-6">
                  Aún no se han enviado mensajes para esta cotización. Comienza
                  la conversación escribiendo tu primer mensaje.
                </p>
                <div className="w-24 h-1 bg-gradient-to-r from-[#4178D4] to-[#5b8de8] rounded-full"></div>
              </div>
            ) : (
              <div className="space-y-4 md:space-y-6">
                {organizedMessages.root.map((message, index) =>
                  renderMessage(message, false, index)
                )}
              </div>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl shadow-lg border border-gray-200/60 p-4 md:p-6"
            style={{
              boxShadow:
                "0 8px 32px rgba(65, 120, 212, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04)",
            }}
          >
            {replyingTo && (
              <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-blue-50/50 rounded-xl border border-blue-200/50 flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-blue-700">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Reply className="w-4 h-4" />
                  </div>
                  <span className="font-medium">
                    Respondiendo a <strong>{replyingTo.userName}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={cancelReply}
                  className="text-blue-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex flex-col gap-4 md:gap-6">
              <div className="flex flex-col lg:flex-row items-start gap-4 lg:gap-6">
                <div className="flex-1 w-full">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe tu mensaje aquí..."
                    className="w-full p-3 md:p-4 border-2 border-gray-200/60 rounded-2xl resize-none focus:outline-none focus:border-[#4178D4] focus:ring-4 focus:ring-blue-100/50 transition-all duration-200 text-sm md:text-base bg-gray-50/30"
                    rows={4}
                    style={{ minHeight: "100px" }}
                  />
                  {selectedFiles.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 md:p-4 bg-gradient-to-r from-gray-50 to-gray-50/50 rounded-xl border border-gray-200/60"
                        >
                          <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4 md:w-5 md:h-5 text-[#4178D4]" />
                          </div>
                          <span className="text-xs md:text-sm text-gray-700 flex-1 font-medium truncate">
                            {file.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index)}
                            className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-row lg:flex-col gap-3 w-full lg:w-auto">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 lg:flex-none p-3 md:p-4 text-gray-500 hover:text-[#4178D4] rounded-2xl hover:bg-blue-50 border-2 border-gray-200/60 hover:border-blue-200 transition-all duration-200"
                  >
                    <Upload className="w-5 h-5 md:w-6 md:h-6 mx-auto" />
                  </button>
                  <button
                    type="submit"
                    disabled={
                      !selectedCommitment ||
                      (typeof selectedCommitment === "object" &&
                        !selectedCommitment.description)
                    }
                    className="flex-1 lg:flex-none p-3 md:p-4 text-white bg-gradient-to-r from-[#4178D4] to-[#5b8de8] rounded-2xl hover:from-[#2d5aa8] hover:to-[#4178D4] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                  >
                    <Send className="w-5 h-5 md:w-6 md:h-6 mx-auto" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div className="flex-1">
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                    Compromiso *
                  </label>
                  <select
                    value={
                      selectedCommitment
                        ? typeof selectedCommitment === "object"
                          ? "otros"
                          : selectedCommitment
                        : ""
                    }
                    onChange={handleCommitmentChange}
                    className="w-full p-3 border-2 border-gray-200/60 rounded-xl focus:outline-none focus:border-[#4178D4] focus:ring-4 focus:ring-blue-100/50 text-xs md:text-sm bg-gray-50/30 transition-all duration-200"
                    required
                  >
                    <option value="">Seleccionar Compromiso</option>
                    {COMMITMENT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                    <option value="otros">Otros</option>
                  </select>
                </div>

                {selectedCommitment &&
                  typeof selectedCommitment === "object" && (
                    <div className="flex-1 md:col-span-1">
                      <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                        Especificar Compromiso *
                      </label>
                      <input
                        type="text"
                        value={otherCommitment}
                        onChange={handleOtherCommitmentChange}
                        placeholder="Especifica el compromiso..."
                        className="w-full p-3 border-2 border-gray-200/60 rounded-xl focus:outline-none focus:border-[#4178D4] focus:ring-4 focus:ring-blue-100/50 text-xs md:text-sm bg-gray-50/30 transition-all duration-200"
                        required
                      />
                    </div>
                  )}

                <div className="flex-1">
                  <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-2">
                    Avance de Negociación *
                  </label>
                  <select
                    value={negotiationProgress}
                    onChange={(e) =>
                      setNegotiationProgress(
                        e.target.value as NegotiationProgress
                      )
                    }
                    className="w-full p-3 border-2 border-gray-200/60 rounded-xl focus:outline-none focus:border-[#4178D4] focus:ring-4 focus:ring-blue-100/50 text-xs md:text-sm bg-gray-50/30 transition-all duration-200"
                    required
                  >
                    <option value="" disabled>
                      Seleccionar Avance
                    </option>
                    {PROGRESS_OPTIONS.map((progress) => (
                      <option key={progress} value={progress}>
                        {progress}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.xlsx,.xls"
            />
          </form>
        </>
      )}
    </div>
  );
};

export default ChatWall;
