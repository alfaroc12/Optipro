import Router from "@/routes/Router";
import AuthProvider from "@/components/auth/AuthProvider";
import MultiSessionAlert from "@/components/ui/MultiSessionAlert";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router />
      <MultiSessionAlert />
      <ToastContainer position="top-right" autoClose={3000} />
    </AuthProvider>
  );
}

export default App;
