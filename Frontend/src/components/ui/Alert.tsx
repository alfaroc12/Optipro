import React from "react";
import { CheckCircle, AlertCircle, XCircle, Info, X } from "lucide-react";

interface AlertProps {
  type: "success" | "error" | "warning" | "info";
  message: string;
  onClose?: () => void;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({
  type,
  message,
  onClose,
  className = "",
}) => {
  const getAlertStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-50 text-green-800 border-green-200";
      case "error":
        return "bg-red-50 text-red-800 border-red-200";
      case "warning":
        return "bg-yellow-50 text-yellow-800 border-yellow-200";
      case "info":
        return "bg-blue-50 text-blue-800 border-blue-200";
      default:
        return "bg-gray-50 text-gray-800 border-gray-200";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5" />;
      case "error":
        return <XCircle className="w-5 h-5" />;
      case "warning":
        return <AlertCircle className="w-5 h-5" />;
      case "info":
        return <Info className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  return (
    <div
      className={`flex items-center p-4 mb-4 rounded-lg border ${getAlertStyles()} ${className}`}
      role="alert"
    >
      <div className="flex-shrink-0 mr-3">{getIcon()}</div>
      <div className="flex-1">{message}</div>
      {onClose && (
        <button
          type="button"
          className="ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 p-1.5 inline-flex h-8 w-8 items-center justify-center"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
          <span className="sr-only">Cerrar</span>
        </button>
      )}
    </div>
  );
};

export default Alert;
