import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { ChatMessage } from "@/types/chat";
import {
  fetchChatMessages,
  sendMessage as sendMessageAPI,
} from "@/services/chatService";

interface ChatState {
  messages: Record<string, ChatMessage[]>; // cotizacionId -> mensajes
  loading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  messages: {},
  loading: false,
  error: null,
};

export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async (cotizacionId: string | number, { rejectWithValue }) => {
    try {
      const messages = await fetchChatMessages(cotizacionId);
      return { cotizacionId: cotizacionId.toString(), messages };
    } catch (error: any) {
      return rejectWithValue(error.message || "Error al obtener mensajes");
    }
  }
);

export const sendMessage = createAsyncThunk(
  "chat/sendMessage",
  async (
    {
      cotizacionId,
      message,
      files,
    }: {
      cotizacionId: string | number;
      message: ChatMessage;
      files?: File[];
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await sendMessageAPI(message, cotizacionId, files);
      return { cotizacionId: cotizacionId.toString(), message: response };
    } catch (error: any) {
      return rejectWithValue(error.message || "Error al enviar mensaje");
    }
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage(
      state,
      action: PayloadAction<{ cotizacionId: string; message: ChatMessage }>
    ) {
      const { cotizacionId, message } = action.payload;
      if (!state.messages[cotizacionId]) {
        state.messages[cotizacionId] = [];
      }

      // Si es una respuesta, actualizar el mensaje padre
      if (message.parentMessageId) {
        const parentMessage = state.messages[cotizacionId].find(
          (m) => m.id === message.parentMessageId
        );
        if (parentMessage) {
          if (!parentMessage.replies) {
            parentMessage.replies = [];
          }
          parentMessage.replies.push(message.id);
        }
      }

      state.messages[cotizacionId].push(message);
    },
  },
  extraReducers: (builder) => {
    // Manejo de fetchMessages
    builder.addCase(fetchMessages.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchMessages.fulfilled, (state, action) => {
      const { cotizacionId, messages } = action.payload;
      state.messages[cotizacionId] = messages;
      state.loading = false;
    });
    builder.addCase(fetchMessages.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Manejo de sendMessage
    builder.addCase(sendMessage.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(sendMessage.fulfilled, (state, _action) => {
      // El mensaje ya se añadió optimísticamente, no necesitamos hacer nada más
      state.loading = false;
    });
    builder.addCase(sendMessage.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { addMessage } = chatSlice.actions;

export default chatSlice.reducer;
