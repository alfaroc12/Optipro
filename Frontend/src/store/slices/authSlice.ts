import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "@/types/user";

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
}

// Función para obtener el estado inicial desde sessionStorage
const loadAuthState = (): AuthState => {
  try {
    const serializedUser = sessionStorage.getItem("user");
    const serializedToken = sessionStorage.getItem("token");

    if (serializedUser && serializedToken) {
      return {
        isAuthenticated: true,
        user: JSON.parse(serializedUser),
        token: serializedToken,
        loading: false,
      };
    }
  } catch (err) {
    console.log("Error al cargar el estado de autenticación:", err);
  }

  return {
    isAuthenticated: false,
    user: null,
    token: null,
    loading: false,
  };
};

const initialState: AuthState = loadAuthState();

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart(state) {
      state.loading = true;
    },
    loginSuccess(state, action: PayloadAction<{ user: User; token: string }>) {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;

      // Guardar en sessionStorage (permite múltiples sesiones en diferentes pestañas)
      sessionStorage.setItem("user", JSON.stringify(action.payload.user));
      sessionStorage.setItem("token", action.payload.token);
    },
    loginFailure(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.loading = false;

      // Limpiar sessionStorage
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
    },
    logout(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.loading = false;

      // Limpiar sessionStorage
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout } =
  authSlice.actions;
export default authSlice.reducer;
