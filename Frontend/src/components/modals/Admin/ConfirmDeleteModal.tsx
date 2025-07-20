import React from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDeleteModalProps {
  userId: number;
  userName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  userId,
  userName,
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-[#0000008c] bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-center text-gray-900 mb-2">
          Confirmar eliminación
        </h2>

        <p className="text-center text-gray-600 mb-6">
          ¿Estás seguro de que deseas eliminar al usuario{" "}
          <span className="font-semibold">{userName}</span> (ID: #
          {userId.toString().padStart(3, "0")})?
        </p>

        <p className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm mb-6">
          <strong>Advertencia:</strong> Esta acción no se puede deshacer. Todos
          los datos asociados a este usuario serán eliminados permanentemente.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Eliminar usuario
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
