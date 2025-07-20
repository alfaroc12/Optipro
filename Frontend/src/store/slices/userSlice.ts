import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Usuario {
  id: number;
  nombre: string; // first_name + last_name
  usuario: string; // username
  ciudad: string;
  cedula: string;
  email?: string;
  telefono?: string;
  cargo?: string;
  fechaRegistro?: string;
  estado: "activo" | "inactivo" | "suspendido" | "pendiente";
  tipoUsuario?: "administrador" | "operador" | "cliente" | "tecnico";
}

interface UserState {
  users: Usuario[];
  loading: boolean;
  error: string | null;
  currentUser: Usuario | null;
  totalUsers: number;
  totalPages: number;
}

const initialState: UserState = {
  users: [],
  loading: false,
  error: null,
  currentUser: null,
  totalUsers: 0,
  totalPages: 1,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    fetchUsersStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchUsersSuccess: (
      state,
      action: PayloadAction<{ users: Usuario[]; total: number; pages: number }>
    ) => {
      state.users = action.payload.users;
      state.totalUsers = action.payload.total;
      state.totalPages = action.payload.pages;
      state.loading = false;
      state.error = null;
    },
    fetchUsersFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    addUserStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    addUserSuccess: (state, action: PayloadAction<Usuario>) => {
      state.users.push(action.payload);
      state.totalUsers += 1;
      state.loading = false;
      state.error = null;
    },
    addUserFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateUserStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    updateUserSuccess: (state, action: PayloadAction<Usuario>) => {
      const index = state.users.findIndex(
        (user) => user.id === action.payload.id
      );
      if (index !== -1) {
        state.users[index] = action.payload;
      }
      state.loading = false;
      state.error = null;
    },
    updateUserFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    deleteUserStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    deleteUserSuccess: (state, action: PayloadAction<number>) => {
      state.users = state.users.filter((user) => user.id !== action.payload);
      state.totalUsers -= 1;
      state.loading = false;
      state.error = null;
    },
    deleteUserFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchUsersStart,
  fetchUsersSuccess,
  fetchUsersFailure,
  addUserStart,
  addUserSuccess,
  addUserFailure,
  updateUserStart,
  updateUserSuccess,
  updateUserFailure,
  deleteUserStart,
  deleteUserSuccess,
  deleteUserFailure,
} = userSlice.actions;

export default userSlice.reducer;
