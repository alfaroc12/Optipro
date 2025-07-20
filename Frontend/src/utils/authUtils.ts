/**
 * Utilidades relacionadas con la autenticación y sesiones
 */

// Genera una clave única para esta sesión de navegación
export const generateSessionId = () => {
  return Math.random().toString(36).substring(2, 15);
};

// Verifica si esta pestaña tiene una sesión activa
export const hasActiveSession = (): boolean => {
  return !!sessionStorage.getItem("token");
};

// Verifica si hay múltiples sesiones activas en diferentes pestañas
export const checkMultipleSessions = async (): Promise<boolean> => {
  // Establecer un evento personalizado para comunicación entre pestañas
  return new Promise((resolve) => {
    const sessionCheckChannel = new BroadcastChannel("session-check");
    const responseTimeout = setTimeout(() => {
      sessionCheckChannel.close();
      resolve(false); // No hay otras sesiones activas
    }, 500);

    sessionCheckChannel.onmessage = (event) => {
      if (event.data === "session-active") {
        clearTimeout(responseTimeout);
        sessionCheckChannel.close();
        resolve(true); // Hay otra sesión activa
      }
    };

    // Enviar mensaje para verificar si hay otras pestañas con sesiones activas
    sessionCheckChannel.postMessage("check-session");
  });
};

// Para ser usado como oyente en componentes que necesiten detectar otras sesiones
export const listenForSessionChecks = (
  callback: (hasMultipleSessions: boolean) => void
) => {
  const sessionCheckChannel = new BroadcastChannel("session-check");

  sessionCheckChannel.onmessage = (event) => {
    if (event.data === "check-session" && hasActiveSession()) {
      sessionCheckChannel.postMessage("session-active");
      callback(true);
    }
  };

  return () => {
    sessionCheckChannel.close();
  };
};
