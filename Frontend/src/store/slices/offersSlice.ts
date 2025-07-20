import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Oferta {
  id: number;
  nombre: string;
  departamento?: string;
  ciudad: string;
  fechaEmision: string;
  fechaCreacion?: string;
  potencia: number | null;
  valor: string;
  validez: number | null;
  estado: "rechazado" | "pendiente" | "aprobado";
  comentarios?: string;
  cotizador?: string;
  archivoCotizacion?: string;

  // Campos del cliente según el modelo backend
  type_identification?: "C.C" | "NIT";
  identification?: string;
  firs_name?: string;
  other_name?: string;
  last_name?: string;
  secon_surname?: string;
  name?: string;
  addres?: string;
  phone?: string;
  phone_2?: string;

  // Additional fields from NuevaOfertaFormData to store full offer details
  fechaVisitaComercial?: string;
  tipoProyecto?: string;
  codigoVT?: string;
  code?: string;
  fechaInicio?: string;
  descripcion?: string;
  nitCC?: string;
  representante?: string;
  tipoSistema?: string;
  potenciaKw?: number;
  tipoPotenciaPaneles?: string;
  produccionEnergetica?: number;
  cantidadPaneles?: number;
  areaNecesaria?: number;
  tipoInstalacion?: string;

  // Campos relacionados con la orden de venta
  date_start?: string;
  date_end?: string;
  proyect_type?: string;
  payment_type?: string;
  system_type?: string;
  power_required?: number;
  panel_type?: string;
  energy_production?: number;
  necessary_area?: number;
  Type_installation?: string;
  Delivery_deadline?: string | number;
  Validity_offer?: string | number;
  Warranty?: string;
  total_quotation?: number;

  // IDs para el backend
  person_id?: number | null;
  user_id?: number;
  equipamiento?: {
    panelesSolares: boolean;
    estructurasMontaje: boolean;
    cableadoGabinete: boolean;
    legalizacionDisenos: boolean;
    bateria: boolean;
    inversor: boolean;
    kit5kw: boolean;
    kit8kw: boolean;
    kit12kw: boolean;
    kit15kw: boolean;
    kit30kw: boolean;
    microinversores: boolean;
    transporte: boolean;
    manoDeObra: boolean;
    preciosPanelesSolares: number;
    preciosEstructurasMontaje: number;
    preciosCableadoGabinete: number;
    preciosLegalizacionDisenos: number;
    preciosBateria: number;
    preciosInversor: number;
    preciosKit5kw: number;
    preciosKit8kw: number;
    preciosKit12kw: number;
    preciosKit15kw: number;
    preciosKit30kw: number;
    preciosMicroinversores: number;
    preciosTransporte: number;
    preciosManoDeObra: number;
    [key: string]: boolean | number; // Para permitir acceso dinámico a las propiedades
  };
  hojaCalculo?: string;
  valorTotal?: number;
  plazoEntrega?: number;
  validezOferta?: number;
  garantia?: string;
  formaPago?: string;
  observaciones?: string;
  archivosAdjuntos?: string[];
  // Campos adicionales para archivos
  archivosAdjuntosInfo?: any[];
  todosLosArchivos?:
    | {
        hoja_calculo?: Array<{
          id?: number;
          name: string;
          attach: string;
          is_calculation_sheet?: boolean;
        }>;
        archivos_generales?: Array<{
          id?: number;
          name: string;
          attach: string;
          is_calculation_sheet?: boolean;
        }>;
      }
    | Array<{
        id?: number;
        name: string;
        attach: string;
        is_calculation_sheet?: boolean;
      }>;
  // Campos de cotización
  estadoCotizacion?: string;
  comentarioCotizacion?: string;
  fechaCotizacion?: string;

  // Nueva propiedad sugerida
  comentarioId?: number;
}

interface OffersState {
  offers: Oferta[];
}

// Inicializar estado vacío sin localStorage
const initialState: OffersState = {
  offers: [],
};

const offersSlice = createSlice({
  name: "offers",
  initialState,
  reducers: {
    setOffers: (state, action: PayloadAction<Oferta[]>) => {
      state.offers = action.payload;
    },
    addOffer: (state, action: PayloadAction<Oferta>) => {
      // Verificar si la oferta ya existe (actualización)
      const index = state.offers.findIndex(
        (offer) => offer.id === action.payload.id
      );
      if (index >= 0) {
        // Reemplazar la oferta existente con la nueva versión
        state.offers[index] = action.payload;
      } else {
        // Agregar nueva oferta
        state.offers.push(action.payload);
      }
    },
    removeOffer: (state, action: PayloadAction<number>) => {
      state.offers = state.offers.filter(
        (offer) => offer.id !== action.payload
      );
    },
    updateOffer: (state, action: PayloadAction<Oferta>) => {
      const index = state.offers.findIndex(
        (offer) => offer.id === action.payload.id
      );
      if (index >= 0) {
        state.offers[index] = action.payload;
      }
    },
  },
});

export const { setOffers, addOffer, removeOffer, updateOffer } =
  offersSlice.actions;
export type { Oferta };
export default offersSlice.reducer;
