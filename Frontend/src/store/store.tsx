import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import projectReducer from "./slices/projectSlice";
import saleOrderReducer from "./slices/saleOrderSlice";
import offersReducer from "./slices/offersSlice";
import userReducer from "./slices/userSlice";
import chatReducer from "./slices/chatSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    project: projectReducer,
    saleOrder: saleOrderReducer,
    offers: offersReducer,
    user: userReducer,
    chat: chatReducer,
  },
});

// Note: Offers will be loaded from API instead of localStorage

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
