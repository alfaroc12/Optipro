import type React from "react";
import LoginForm from "@/components/auth/LoginForm";

const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f4fa] relative">
      {" "}
      {/* Background image with opacity */}
      <div className="absolute inset-0 bg-[url('/src/assets/imgs/background.svg')] bg-cover bg-center opacity-30 z-0"></div>
      {/* Logo */}
      <div className="mb-8 z-10">
        <img src="/src/assets/Logo.svg" alt="OptiPRO" className="h-16" />
      </div>
     
      <LoginForm />
      {/* Footer */}
      <div className="mt-8 absolute bottom-4 left-4 text-sm text-[#34509F]/50">
        <p>
          © {new Date().getFullYear()} OptiPRO. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
