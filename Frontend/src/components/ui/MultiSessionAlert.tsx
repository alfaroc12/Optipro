import React, { useEffect, useState } from "react";
import { listenForSessionChecks } from "@/utils/authUtils";

const MultiSessionAlert: React.FC = () => {
  const [showAlert, setShowAlert] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const cleanup = listenForSessionChecks((hasMultipleSessions) => {
      if (hasMultipleSessions && !dismissed) {
        setShowAlert(true);
      }
    });

    return cleanup;
  }, [dismissed]);

  if (!showAlert) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-blue-50 border border-blue-300 text-blue-800 p-4 rounded-lg shadow-lg max-w-md z-50">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium mb-2">
            Múltiples sesiones detectadas
          </h3>
          <p className="text-xs">
            Has iniciado sesión en varias pestañas. Cada pestaña funciona con
            una sesión independiente, así puedes usar diferentes cuentas en
            distintas pestañas.
          </p>
          <div className="mt-3">
            <button
              onClick={() => setDismissed(true)}
              className="text-xs text-blue-700 font-medium focus:outline-none hover:underline"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiSessionAlert;
