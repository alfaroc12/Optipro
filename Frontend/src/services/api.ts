import axios from "axios";
import store from "@/store/store";
import { logout } from "@/store/slices/authSlice";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/", // URL base del backend
});

// Interceptor para añadir el token a las peticiones
api.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Si el error es 401 (no autorizado), probablemente el token expiró
    if (error.response && error.response.status === 401) {
      console.log("Sesión expirada o token inválido");

      // Limpiar la sesión del usuario
      store.dispatch(logout());

      // Opcional: redirigir al login
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
