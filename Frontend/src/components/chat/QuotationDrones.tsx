import React from "react";

// Importamos las imágenes de drones
import Drone1 from "@/assets/Dron/Drone1.jpeg";
import Drone2 from "@/assets/Dron/Drone2.jpeg";
import Drone3 from "@/assets/Dron/Drone3.jpeg";
import Drone4 from "@/assets/Dron/Drone4.jpeg";

interface QuotationDronesProps {
  cotizacionId: number;
}

const QuotationDrones: React.FC<QuotationDronesProps> = ({ cotizacionId }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200/60 p-8">
      <h2 className="text-2xl font-bold text-[#4178D4] mb-6">
        Imágenes de drones para la cotización #
        {cotizacionId.toString().padStart(3, "0")}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
          <img
            src={Drone1}
            alt="Drone 1"
            className="w-full h-80 object-cover transform hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <h3 className="text-xl font-semibold text-white group-hover:text-[#4178D4] transition-colors">
              Drone Modelo X1
            </h3>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
          <img
            src={Drone2}
            alt="Drone 2"
            className="w-full h-80 object-cover transform hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <h3 className="text-xl font-semibold text-white group-hover:text-[#4178D4] transition-colors">
              Drone Modelo X2
            </h3>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
          <img
            src={Drone3}
            alt="Drone 3"
            className="w-full h-80 object-cover transform hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <h3 className="text-xl font-semibold text-white group-hover:text-[#4178D4] transition-colors">
              Drone Modelo X3
            </h3>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300">
          <img
            src={Drone4}
            alt="Drone 4"
            className="w-full h-80 object-cover transform hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <h3 className="text-xl font-semibold text-white group-hover:text-[#4178D4] transition-colors">
              Drone Modelo X4
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotationDrones;
