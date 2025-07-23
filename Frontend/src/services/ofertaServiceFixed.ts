import api from "./api";

export interface Equipamiento {
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
  [key: string]: boolean | number;
}

// Definimos la estructura para los productos en una orden de venta
// El backend espera objetos con product_id
export interface ProductSaleOrder {
  product_id: number;
  quantity?: number;
  unit_price?: number;
  // Añadimos un campo opcional para cualquier otra propiedad que pueda requerir el backend
  [key: string]: any;
}

export interface Oferta {
  id?: number;
  date?: string;
  person_id: number;
  code?: string;
  state?: string;
  user_id: number;
  date_start: string;
  date_end?: string;
  proyect_type: string;
  total_quotation: number;
  description: string;
  payment_type: string;
  system_type: string;
  power_required: number;
  panel_type: string;
  energy_production: number;
  city: string;
  products: ProductSaleOrder[];

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
  representante?: string;

  // Campos adicionales del frontend
  departamento?: string;
  potenciaKw?: number;
  cantidadPaneles?: number;
  areaNecesaria?: number;
  tipoInstalacion?: string;
  validezOferta?: number;
  plazoEntrega?: number;
  garantia?: string;
  observaciones?: string;
  archivosAdjuntos?: string[];
  comentarios?: string;

  // Campos de cotización
  estado?: "aprobado" | "rechazado" | "pendiente";
  estadoCotizacion?: string;
  comentarioCotizacion?: string;
  cotizador?: string;
  archivoCotizacion?: string;
  fechaCotizacion?: string;
}

// Esta configuración se establece en api.ts

// Función de utilidad para encontrar la hoja de cálculo en los archivos adjuntos
const findCalculationSheet = (archivosAdjuntos: any[]): any | null => {
  if (!archivosAdjuntos || !Array.isArray(archivosAdjuntos)) return null;

  return archivosAdjuntos.find(
    (archivo: any) =>
      archivo.is_calculation_sheet === true ||
      (archivo.name && archivo.name.startsWith("Hoja de Cálculo - "))
  );
};

// Función para mapear datos del frontend al modelo del backend
export const mapFrontendToBackend = (data: any): any => {
  // Generar un código único para la oferta (solo números como requiere el backend)
  const codeValue = data.code || new Date().getTime().toString().slice(-6);

  // Siempre reconstruir el nombre completo a partir de los campos individuales
  let clienteName = "";

  // Obtener el ID de la visita técnica si existe
  //@ts-ignore
  const technical_visit_id =
    data.selectedVisit || data.technical_visit_id || null;

  // Si alguno de los campos de nombre está presente, reconstruir el nombre completo
  if (
    data.firs_name ||
    data.other_name ||
    data.last_name ||
    data.secon_surname
  ) {
    const parts = [
      data.firs_name || "",
      data.other_name || "",
      data.last_name || "",
      data.secon_surname || "",
    ].filter(Boolean);
    clienteName = parts.join(" ");
  } else {
    // Si no hay nombres individuales, usar el nombre completo si existe
    clienteName = data.name || data.nombreCliente || "";
  }

  // Mapear equipamiento a los campos específicos del backend
  const equipamiento = data.equipamiento || {};

  // Construir el objeto final para el backend
  const backendData = {
    // Campos del cliente según el modelo backend
    type_identification: data.type_identification || "C.C",
    identification: data.identification || data.nitCC || "",
    firs_name: data.firs_name || "",
    other_name: data.other_name || "",
    last_name: data.last_name || "",
    secon_surname: data.secon_surname || "",
    name: clienteName,
    addres: data.addres || "",
    city: data.ciudad || data.city || "",
    phone: data.phone || "",
    phone_2: data.phone_2 || "",

    // Campos obligatorios del backend
    code: codeValue,
    // Ya no enviamos user_id desde el frontend, el backend lo asignará automáticamente

    date_start:
      data.date_start ||
      data.fechaInicio ||
      new Date().toISOString().split("T")[0],
    date_end: data.date_end || data.fechaFin || "",
    proyect_type: data.proyect_type || data.tipoProyecto || "Privado",
    total_quotation:
      typeof data.valorTotal === "number"
        ? data.valorTotal
        : typeof data.valorTotal === "string"
        ? parseFloat(data.valorTotal) || 0
        : 0,
    description: data.description || data.descripcion || "",
    description_2: data.description_2 || data.observaciones || "",
    payment_type: data.payment_type || data.formaPago || "50%,30%,20%",
    system_type: data.system_type || data.tipoSistema || "On-grid",
    power_required:
      typeof data.potenciaKw === "number"
        ? data.potenciaKw
        : typeof data.potenciaKw === "string"
        ? parseFloat(data.potenciaKw) || 0
        : 0,
    panel_type: data.tipoPotenciaPaneles || "",
    energy_production:
      typeof data.produccionEnergetica === "number"
        ? data.produccionEnergetica
        : typeof data.produccionEnergetica === "string"
        ? parseFloat(data.produccionEnergetica) || 0
        : 0,
    departement: data.departamento || "Magdalena",
    number_panels: data.cantidadPaneles?.toString() || "0",
    necessary_area:
      typeof data.areaNecesaria === "number"
        ? data.areaNecesaria
        : typeof data.areaNecesaria === "string"
        ? parseFloat(data.areaNecesaria) || 0
        : 0,
    Type_installation: data.tipoInstalacion || "Tejado",
    Delivery_deadline: data.plazoEntrega?.toString() || "30",
    technical_visit_id: data.selectedVisit || data.technical_visit_id || null,
    Validity_offer: data.validezOferta?.toString() || "15",
    Warranty: data.garantia || 5,
    state: data.estadoCotizacion || data.estado || "pendiente",
    nitCC: data.nitCC || data.identification || "",
    representante: data.representante || "",

    // Mapear equipamiento (manualmente para evitar arrays)
    solar_panels: equipamiento.panelesSolares || false,
    solar_panels_price: equipamiento.preciosPanelesSolares || 0,
    Assembly_structures: equipamiento.estructurasMontaje || false,
    Assembly_structures_price: equipamiento.preciosEstructurasMontaje || 0,
    Wiring_and_cabinet: equipamiento.cableadoGabinete || false,
    Wiring_and_cabinet_price: equipamiento.preciosCableadoGabinete || 0,
    Legalization_and_designs: equipamiento.legalizacionDisenos || false,
    Legalization_and_designs_price:
      equipamiento.preciosLegalizacionDisenos || 0,
    batterys: equipamiento.bateria || false,
    batterys_price: equipamiento.preciosBateria || 0,
    investors: equipamiento.inversor || false,
    investors_price: equipamiento.preciosInversor || 0,
    Kit_5kw: equipamiento.kit5kw || false,
    Kit_5kw_price: equipamiento.preciosKit5kw || 0,
    Kit_8kw: equipamiento.kit8kw || false,
    Kit_8kw_price: equipamiento.preciosKit8kw || 0,
    Kit_12kw: equipamiento.kit12kw || false,
    Kit_12kw_price: equipamiento.preciosKit12kw || 0,
    Kit_15kw: equipamiento.kit15kw || false,
    Kit_15kw_price: equipamiento.preciosKit15kw || 0,
    Kit_30kw: equipamiento.kit30kw || false,
    Kit_30kw_price: equipamiento.preciosKit30kw || 0,
    Microinverters: equipamiento.microinversores || false,
    Microinverters_price: equipamiento.preciosMicroinversores || 0,
    Transport: equipamiento.transporte || false,
    Transport_price: equipamiento.preciosTransporte || 0,
    workforce: equipamiento.manoDeObra || false,
    workforce_price: equipamiento.preciosManoDeObra || 0,

    // Incluir estos campos para el manejo de eliminación de archivos
    archivos_a_eliminar: data.archivos_a_eliminar,
    archivos_nombres_eliminar: data.archivos_nombres_eliminar,
  };

  return backendData;
};

// Función para mapear datos del backend al formato del frontend
export const mapBackendToFrontend = (data: any): any => {
  if (!data) return null;

  // Verificar que los campos necesarios existan
  if (!data.id) {
    return null;
  }

  // Construir la estructura de equipamiento esperada por el frontend
  const equipamiento = {
    panelesSolares: data.solar_panels || false,
    estructurasMontaje: data.Assembly_structures || false,
    cableadoGabinete: data.Wiring_and_cabinet || false,
    legalizacionDisenos: data.Legalization_and_designs || false,
    bateria: data.batterys || false,
    inversor: data.investors || false,
    kit5kw: data.Kit_5kw || false,
    kit8kw: data.Kit_8kw || false,
    kit12kw: data.Kit_12kw || false,
    kit15kw: data.Kit_15kw || false,
    kit30kw: data.Kit_30kw || false,
    microinversores: data.Microinverters || false,
    transporte: data.Transport || false,
    manoDeObra: data.workforce || false,
    preciosPanelesSolares: data.solar_panels_price || 0,
    preciosEstructurasMontaje: data.Assembly_structures_price || 0,
    preciosCableadoGabinete: data.Wiring_and_cabinet_price || 0,
    preciosLegalizacionDisenos: data.Legalization_and_designs_price || 0,
    preciosBateria: data.batterys_price || 0,
    preciosInversor: data.investors_price || 0,
    preciosKit5kw: data.Kit_5kw_price || 0,
    preciosKit8kw: data.Kit_8kw_price || 0,
    preciosKit12kw: data.Kit_12kw_price || 0,
    preciosKit15kw: data.Kit_15kw_price || 0,
    preciosKit30kw: data.Kit_30kw_price || 0,
    preciosMicroinversores: data.Microinverters_price || 0,
    preciosTransporte: data.Transport_price || 0,
    preciosManoDeObra: data.workforce_price || 0,
  }; // Separar la hoja de cálculo de los archivos adjuntos generales
  let hojaCalculo = null;
  let archivosAdjuntos = [];
  let archivosAdjuntosInfo = [];

  // Nueva estructura que viene del backend con archivos separados
  if (
    data.archivos_adjuntos &&
    typeof data.archivos_adjuntos === "object" &&
    !Array.isArray(data.archivos_adjuntos)
  ) {
    // Manejar la nueva estructura donde la hoja de cálculo y los adjuntos están separados
    if (
      data.archivos_adjuntos.hoja_calculo &&
      data.archivos_adjuntos.hoja_calculo.length > 0
    ) {
      const hojaCalculoArchivo = data.archivos_adjuntos.hoja_calculo[0];
      hojaCalculo = hojaCalculoArchivo.name.replace("Hoja de Cálculo - ", "");
      console.log(`Hoja de cálculo encontrada: ${hojaCalculo}`);
    }

    // Obtener los archivos generales
    if (
      data.archivos_adjuntos.archivos_generales &&
      Array.isArray(data.archivos_adjuntos.archivos_generales)
    ) {
      archivosAdjuntos = data.archivos_adjuntos.archivos_generales.map(
        (archivo: any) => archivo.name
      );
      archivosAdjuntosInfo = data.archivos_adjuntos.archivos_generales;
    }
  }
  // Compatibilidad con la estructura anterior
  else if (data.archivos_adjuntos && Array.isArray(data.archivos_adjuntos)) {
    // Filtrar archivos adjuntos para encontrar la hoja de cálculo por el flag is_calculation_sheet o por el nombre
    const hojaCalculoArchivo = data.archivos_adjuntos.find(
      (archivo: any) =>
        archivo.is_calculation_sheet === true ||
        (archivo.name && archivo.name.startsWith("Hoja de Cálculo - "))
    );

    // Si encontramos la hoja de cálculo, la separamos de los demás archivos
    if (hojaCalculoArchivo) {
      hojaCalculo = hojaCalculoArchivo.name.replace("Hoja de Cálculo - ", "");
      console.log(
        `Hoja de cálculo encontrada (estructura antigua): ${hojaCalculo}`
      );

      // El resto de los archivos son los adjuntos generales
      archivosAdjuntos = data.archivos_adjuntos
        .filter(
          (archivo: any) =>
            archivo.is_calculation_sheet !== true &&
            !archivo.name.startsWith("Hoja de Cálculo - ")
        )
        .map((archivo: any) => archivo.name);

      archivosAdjuntosInfo = data.archivos_adjuntos.filter(
        (archivo: any) =>
          archivo.is_calculation_sheet !== true &&
          !archivo.name.startsWith("Hoja de Cálculo - ")
      );
    } else {
      // Si no hay hoja de cálculo, todos son archivos adjuntos generales
      archivosAdjuntos = data.archivos_adjuntos.map(
        (archivo: any) => archivo.name
      );
      archivosAdjuntosInfo = data.archivos_adjuntos;
      console.log(
        `No se encontró hoja de cálculo entre los ${archivosAdjuntos.length} archivos adjuntos`
      );
    }
  }
  return {
    // Información básica
    id: data.id,
    nombre: data.name,
    departamento: data.departement,
    ciudad: data.city,
    fechaEmision: data.date,
    fechaCreacion: data.date,
    potencia: data.power_required,
    valor: data.total_quotation?.toString() || "0",
    validez: parseInt(data.Validity_offer) || 0,
    estado: data.state || "pendiente",

    // Datos del cliente
    type_identification: data.type_identification,
    identification: data.identification,
    firs_name: data.firs_name,
    other_name: data.other_name,
    last_name: data.last_name,
    secon_surname: data.secon_surname,
    name: data.name,
    addres: data.addres,
    phone: data.phone,
    phone_2: data.phone_2,
    nitCC: data.nitCC || data.identification,
    representante: data.representante,

    // Campos adicionales
    code: data.code,
    fechaInicio: data.date_start,
    fechaVisitaComercial: data.date_start, // Usamos la misma fecha por defecto
    tipoProyecto: data.proyect_type,
    descripcion: data.description || "",
    tipoSistema: data.system_type,
    potenciaKw: data.power_required,
    tipoPotenciaPaneles: data.panel_type,
    produccionEnergetica: data.energy_production,
    cantidadPaneles: parseInt(data.number_panels) || 0,
    areaNecesaria: data.necessary_area,
    tipoInstalacion: data.Type_installation,
    plazoEntrega: parseInt(data.Delivery_deadline) || 30,
    validezOferta: parseInt(data.Validity_offer) || 15,
    garantia: data.Warranty,
    formaPago: data.payment_type,
    observaciones: data.description_2 || "",

    // Equipamiento
    equipamiento,

    // Visita técnica asociada
    technical_visit_details: data.technical_visit_details,

    // Valor total calculado
    valorTotal: data.total_quotation || 0, // Campos de usuario
    user_id: data.user_id, // Campos adicionales
    comentarios:
      data.comentaries?.length > 0 ? data.comentaries[0]?.description : "",
    comentarioCotizacion:
      data.comentaries?.length > 0 ? data.comentaries[0]?.description : "",
    comentarioId:
      data.comentaries?.length > 0 ? data.comentaries[0]?.id : undefined,
    cotizador:
      data.cotizador ||
      (data.comentaries?.length > 0 ? data.comentaries[0]?.user_name : ""),
    estadoCotizacion: data.state || "pendiente",
    archivoCotizacion: data.archivo_cotizacion || "",
    fechaCotizacion:
      data.comentaries?.length > 0 ? data.comentaries[0]?.date : "", // Archivos adjuntos (ahora separando la hoja de cálculo)
    archivosAdjuntos: archivosAdjuntos,
    hojaCalculo: hojaCalculo,

    // Información de archivos adjuntos para referencia
    archivosAdjuntosInfo: archivosAdjuntosInfo,
    // Guardamos la estructura de archivos para poder acceder a ellos fácilmente
    todosLosArchivos: data.archivos_adjuntos || {
      hoja_calculo: hojaCalculo
        ? [
            {
              name: `Hoja de Cálculo - ${hojaCalculo}`,
              is_calculation_sheet: true,
              // Si hay archivos adjuntos organizados, intenta obtener el ID real
              id: Array.isArray(data.archivos_adjuntos)
                ? findCalculationSheet(data.archivos_adjuntos)?.id
                : data.archivos_adjuntos?.hoja_calculo?.[0]?.id,
            },
          ]
        : [],
      archivos_generales: archivosAdjuntosInfo || [],
    },
  };
};

const ofertaServiceFixed = {
  // Obtener todas las ofertas
  getOfertas: async (query: string = "") => {
    try {
      const response = await api.get(`/sale_order/list/?query=${query}`);

      //Convertir datos del backend al formato del frontend
      let ofertas = [];

      // Manejo de diferentes estructuras de respuesta del backend
      if (Array.isArray(response.data)) {
        ofertas = response.data;
      } else if (
        response.data &&
        response.data.results &&
        Array.isArray(response.data.results)
      ) {
        ofertas = response.data.results;
      } else if (response.data && typeof response.data === "object") {
        // Si es un objeto único, lo convertimos en array
        ofertas = [response.data];
      }

      // Verificamos que realmente tengamos datos antes de mapear
      if (ofertas.length === 0) {
        return [];
      }

      // Mapeamos los datos al formato del frontend
      try {
        const mappedOfertas = ofertas.map((oferta: any) =>
          mapBackendToFrontend(oferta)
        );

        return mappedOfertas.filter(Boolean); // Filtrar cualquier mapeo nulo
      } catch (mapError) {
        console.error("Error al mapear ofertas:", mapError);
        // Si hay error al mapear, devolvemos los datos crudos como respaldo
        return ofertas;
      }
    } catch (error) {
      console.error("Error al obtener ofertas:", error);
      return [];
    }
  }, // Obtener oferta por ID
  getOferta: async (id: number) => {
    try {
      const response = await api.get(`/sale_order/retrieve/${id}/`);

      if (!response.data) {
        console.error(`No se encontraron datos para la oferta ${id}`);
        return null;
      }

      // Añadir log para depuración
      console.log(
        `Datos recibidos de la API para oferta ${id}:`,
        response.data
      );
      console.log(
        `¿Contiene visita técnica?`,
        response.data.technical_visit_details ? "Sí" : "No"
      );

      // Verificar si existe archivos_adjuntos
      if (response.data.archivos_adjuntos) {
        // Verificar la estructura de los archivos adjuntos
        if (
          typeof response.data.archivos_adjuntos === "object" &&
          !Array.isArray(response.data.archivos_adjuntos)
        ) {
          if (response.data.archivos_adjuntos.hoja_calculo) {
          }
          if (response.data.archivos_adjuntos.archivos_generales) {
          }
        } else if (Array.isArray(response.data.archivos_adjuntos)) {
          const hojaCalculo = response.data.archivos_adjuntos.find(
            (archivo: any) =>
              archivo.is_calculation_sheet === true ||
              (archivo.name && archivo.name.startsWith("Hoja de Cálculo - "))
          );
          if (hojaCalculo) {
          }
        }
      }

      // Convertir datos del backend al formato del frontend
      try {
        const mappedOferta = mapBackendToFrontend(response.data);

        return mappedOferta;
      } catch (mapError) {
        console.error(`Error al mapear oferta ${id}:`, mapError);

        // Si hay error al mapear, devolver un objeto con estructura mínima para evitar errores        // Separamos la hoja de cálculo y los archivos adjuntos
        let hojaCalculo = null;
        let archivosAdjuntos = [];
        let archivosAdjuntosInfo = [];

        if (
          response.data.archivos_adjuntos &&
          Array.isArray(response.data.archivos_adjuntos)
        ) {
          // Filtrar archivos para encontrar la hoja de cálculo
          const hojaCalculoArchivo = response.data.archivos_adjuntos.find(
            (archivo: any) =>
              archivo.name && archivo.name.startsWith("Hoja de Cálculo - ")
          );

          if (hojaCalculoArchivo) {
            hojaCalculo = hojaCalculoArchivo.name.replace(
              "Hoja de Cálculo - ",
              ""
            );

            // El resto son archivos adjuntos generales
            archivosAdjuntos = response.data.archivos_adjuntos
              .filter(
                (archivo: any) => !archivo.name.startsWith("Hoja de Cálculo - ")
              )
              .map((archivo: any) => archivo.name);

            archivosAdjuntosInfo = response.data.archivos_adjuntos.filter(
              (archivo: any) => !archivo.name.startsWith("Hoja de Cálculo - ")
            );
          } else {
            // Si no hay hoja de cálculo, todos son archivos adjuntos
            archivosAdjuntos = response.data.archivos_adjuntos.map(
              (archivo: any) => archivo.name
            );
            archivosAdjuntosInfo = response.data.archivos_adjuntos;
          }
        }

        return {
          id: response.data.id,
          nombre: response.data.name || "",
          hojaCalculo: hojaCalculo,
          archivosAdjuntos: archivosAdjuntos,
          archivosAdjuntosInfo: archivosAdjuntosInfo,
          todosLosArchivos: response.data.archivos_adjuntos || [],
          equipamiento: {
            panelesSolares: false,
            estructurasMontaje: false,
            cableadoGabinete: false,
            legalizacionDisenos: false,
            bateria: false,
            inversor: false,
            kit5kw: false,
            kit8kw: false,
            kit12kw: false,
            kit15kw: false,
            kit30kw: false,
            microinversores: false,
            transporte: false,
            manoDeObra: false,
            preciosPanelesSolares: 0,
            preciosEstructurasMontaje: 0,
            preciosCableadoGabinete: 0,
            preciosLegalizacionDisenos: 0,
            preciosBateria: 0,
            preciosInversor: 0,
            preciosKit5kw: 0,
            preciosKit8kw: 0,
            preciosKit12kw: 0,
            preciosKit15kw: 0,
            preciosKit30kw: 0,
            preciosMicroinversores: 0,
            preciosTransporte: 0,
            preciosManoDeObra: 0,
          },
          // Datos mínimos necesarios para el formulario
          valorTotal: response.data.total_quotation || 0,
        };
      }
    } catch (error) {
      console.error(`Error al obtener oferta con ID ${id}:`, error);
      return null;
    }
  },

  // Crear nueva oferta con mejor manejo de errores
  createOferta: async (ofertaData: any) => {
    try {
      // Log para depurar
      console.log("Datos recibidos para crear oferta:", ofertaData);
      console.log("ID de visita técnica recibido:", ofertaData.selectedVisit);

      // Construimos un objeto limpio sin ninguna referencia a los datos originales
      const backendData = mapFrontendToBackend(ofertaData);

      console.log("Datos mapeados para backend:", backendData);
      console.log(
        "ID de visita técnica mapeado:",
        backendData.technical_visit_id
      );

      // Eliminar campos que podrían causar problemas
      if (backendData.products) delete backendData.products;
      if (backendData.comentaries) delete backendData.comentaries;
      if (backendData.archivosAdjuntos) delete backendData.archivosAdjuntos;
      if (backendData.nombreCliente) delete backendData.nombreCliente;
      if (backendData.person_id === 0 || backendData.person_id === null)
        delete backendData.person_id;

      // Convertir tipos de datos
      backendData.Delivery_deadline = String(
        backendData.Delivery_deadline || "30"
      );
      backendData.Validity_offer = String(backendData.Validity_offer || "15");
      backendData.number_panels = String(backendData.number_panels || "0");

      // Actualizar estado si está presente
      if (ofertaData.estadoCotizacion) {
        backendData.state = ofertaData.estadoCotizacion;
      }

      // Log de datos antes de enviar

      if (!backendData.name) {
        throw new Error("El nombre del cliente es requerido");
      }

      if (!backendData.identification && !backendData.nitCC) {
        throw new Error(
          "La identificación del cliente (CC o NIT) es requerida"
        );
      }

      // Crear un objeto FormData para enviar datos y archivos
      const formData = new FormData();

      // Añadir todos los datos del backend como campos de formulario
      Object.entries(backendData).forEach(([key, value]) => {
        // Omitir valores nulos o indefinidos
        if (value !== null && value !== undefined) {
          // Convertir objetos/arrays a JSON string
          if (typeof value === "object") {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value as string | Blob);
          }
        }
      });

      // Manejar archivo de cotización si existe
      if (ofertaData.archivoCotizacion instanceof File) {
        formData.append("archivo_cotizacion", ofertaData.archivoCotizacion);
      }

      // Manejar comentario de cotización si existe
      if (ofertaData.comentarioCotizacion) {
        formData.append(
          "comentarioCotizacion",
          ofertaData.comentarioCotizacion
        );
      }

      // Manejar cotizador si existe
      if (ofertaData.cotizador) {
        formData.append("cotizador", ofertaData.cotizador);
      }

      // Manejar archivos adjuntos reales
      if (
        ofertaData.archivosAdjuntos &&
        Array.isArray(ofertaData.archivosAdjuntos)
      ) {
        // Si archivosAdjuntos contiene objetos File, añadirlos al FormData
        ofertaData.archivosAdjuntos.forEach((archivo: any) => {
          if (archivo instanceof File) {
            formData.append("archivos_adjuntos", archivo);
          } else if (typeof archivo === "string") {
          }
        });
      } // Manejar la hoja de cálculo si existe como un archivo real
      if (ofertaData.hojaCalculo instanceof File) {
        formData.append("hojaCalculo", ofertaData.hojaCalculo); // Nombre del campo actualizado para coincidir con el backend
        formData.append("is_calculation_sheet", "true"); // Indica al backend que este archivo es una hoja de cálculo
        console.log(
          `Añadiendo hoja de cálculo: ${ofertaData.hojaCalculo.name}`
        );
      } else if (
        typeof ofertaData.hojaCalculo === "string" &&
        ofertaData.hojaCalculo
      ) {
        // Si ya hay una referencia como string, se mantiene la existente
      }

      // Manejar fecha de cotización si existe
      if (ofertaData.fechaCotizacion) {
        formData.append("fecha_cotizacion", ofertaData.fechaCotizacion);
      }

      // Hacer la solicitud al backend usando FormData
      const response = await api.post("/sale_order/create/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (
        ofertaData.comentarioCotizacion &&
        response.data.id &&
        ofertaData.user_id
      ) {
        try {
          await ofertaServiceFixed.saveComentarioOferta(
            response.data.id,
            ofertaData.comentarioCotizacion,
            ofertaData.user_id
          );
        } catch (commentError) {
          console.error("Error al guardar comentario:", commentError);
        }
      }

      return mapBackendToFrontend(response.data);
    } catch (error: any) {
      console.error("Error al crear oferta:", error);

      // Mejor manejo de errores
      if (error.response?.data) {
        console.error("Detalles del error:", error.response.data);
        let errorMessage = "Error al crear la oferta: ";

        if (typeof error.response.data === "string") {
          errorMessage += error.response.data;
        } else if (error.response.data.messages) {
          Object.entries(error.response.data.messages).forEach(
            ([field, messages]) => {
              errorMessage += `${field}: ${messages}\n`;
            }
          );
        } else if (error.response.data.error) {
          errorMessage += error.response.data.error;
        } else {
          errorMessage +=
            "Respuesta del servidor: " + JSON.stringify(error.response.data);
        }
        throw new Error(errorMessage);
      }

      // Si es un error personalizado, lo lanzamos tal cual
      if (error.message) {
        throw error;
      }

      // Error genérico
      throw new Error("Error desconocido al crear la oferta");
    }
  },

  // Actualizar oferta existente
  // Reemplazar el método updateOferta con esta versión corregida
  updateOferta: async (id: number, ofertaData: any) => {
    try {
      // Preparar datos para enviar
      const backendData = mapFrontendToBackend(ofertaData);

      // Preparar FormData para envío de archivos
      const formData = new FormData();

      // Añadir todos los campos al FormData
      Object.keys(backendData).forEach((key) => {
        if (backendData[key] !== undefined && backendData[key] !== null) {
          formData.append(key, backendData[key]);
        }
      });

      // Manejar archivos a eliminar por ID
      if (
        ofertaData.archivos_a_eliminar &&
        ofertaData.archivos_a_eliminar.length > 0
      ) {
        formData.append(
          "archivos_a_eliminar",
          JSON.stringify(ofertaData.archivos_a_eliminar)
        );
      }

      // Manejar archivos a eliminar por nombre
      if (
        ofertaData.archivos_nombres_eliminar &&
        ofertaData.archivos_nombres_eliminar.length > 0
      ) {
        formData.append(
          "archivos_nombres_eliminar",
          JSON.stringify(ofertaData.archivos_nombres_eliminar)
        );
      }

      // Manejar archivo de cotización si existe
      if (ofertaData.archivoCotizacion instanceof File) {
        formData.append("archivo_cotizacion", ofertaData.archivoCotizacion);
      }

      // Manejar comentario de cotización si existe
      if (ofertaData.comentarioCotizacion) {
        formData.append(
          "comentarioCotizacion",
          ofertaData.comentarioCotizacion
        );
      }

      // Manejar cotizador si existe
      if (ofertaData.cotizador) {
        formData.append("cotizador", ofertaData.cotizador);
      }

      // CORREGIDO: Manejar archivos adjuntos reales
      if (
        ofertaData.archivosAdjuntos &&
        Array.isArray(ofertaData.archivosAdjuntos)
      ) {
        ofertaData.archivosAdjuntos.forEach((archivo: any) => {
          if (archivo instanceof File) {
            // IMPORTANTE: El nombre del campo debe ser "archivos_adjuntos", no "archivosAdjuntos"
            formData.append("archivos_adjuntos", archivo);
          } else if (typeof archivo === "string") {
          }
        });
      } // Manejar la hoja de cálculo, implementando la lógica de reemplazo
      if (ofertaData.hojaCalculo instanceof File) {
        // IMPORTANTE: El nombre del campo debe ser "hojaCalculo" para actualizar
        formData.append("hojaCalculo", ofertaData.hojaCalculo);
        formData.append("is_calculation_sheet", "true"); // Indica al backend que este archivo es una hoja de cálculo

        // Buscar si ya existe una hoja de cálculo previa para indicar explícitamente que se reemplazará
        const tieneHojaExistente =
          ofertaData.todosLosArchivos &&
          findCalculationSheet(
            Array.isArray(ofertaData.todosLosArchivos)
              ? ofertaData.todosLosArchivos
              : ofertaData.todosLosArchivos?.hoja_calculo || []
          );

        if (tieneHojaExistente) {
          console.log(
            `Reemplazando hoja de cálculo existente (ID: ${tieneHojaExistente.id}) con: ${ofertaData.hojaCalculo.name}`
          );
          formData.append("reemplazar_hoja_calculo", "true");
        } else {
          console.log(
            `Añadiendo nueva hoja de cálculo: ${ofertaData.hojaCalculo.name}`
          );
        }
      }

      // Manejar fecha de cotización si existe
      if (ofertaData.fechaCotizacion) {
        formData.append("fecha_cotizacion", ofertaData.fechaCotizacion);
      }
      // Mostrar los contenidos del formData para depuración
      console.log("FormData antes de enviar la actualización:");
      for (const pair of formData.entries()) {
        if (pair[1] instanceof File) {
          console.log(
            `${pair[0]}: Archivo - ${(pair[1] as File).name} (${
              (pair[1] as File).size
            } bytes)`
          );
        } else {
          console.log(`${pair[0]}: ${pair[1]}`);
        }
      }
      const response = await api.put(`/sale_order/update/${id}/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Verificar que el nombre se haya actualizado correctamente
      if (response.data && response.data.name) {
        // Comparar con lo que deberíamos esperar
        if (
          ofertaData.firs_name ||
          ofertaData.other_name ||
          ofertaData.last_name ||
          ofertaData.secon_surname
        ) {
          const expectedName = [
            ofertaData.firs_name || "",
            ofertaData.other_name || "",
            ofertaData.last_name || "",
            ofertaData.secon_surname || "",
          ]
            .filter(Boolean)
            .join(" ");

          if (expectedName !== response.data.name) {
            console.warn(
              `¡Advertencia! El nombre devuelto por el backend (${response.data.name}) no coincide con el esperado (${expectedName})`
            );
          }
        }
      } // Si hay comentario, lo guardamos
      if (ofertaData.comentarioCotizacion && ofertaData.user_id) {
        try {
          // Usar el nuevo método unificado que actualiza o crea
          await ofertaServiceFixed.saveComentarioOferta(
            id,
            ofertaData.comentarioCotizacion,
            ofertaData.user_id
          );
        } catch (commentError) {
          console.error(
            "Error al guardar/actualizar comentario:",
            commentError
          );
        }
      }

      return mapBackendToFrontend(response.data);
    } catch (error: any) {
      console.error(`Error al actualizar oferta con ID ${id}:`, error);

      if (error.response?.data) {
        console.error(
          "Detalles del error en updateOferta:",
          error.response.data
        );
        let errorMessage = `Error al actualizar la oferta ${id}: `;

        if (typeof error.response.data === "string") {
          errorMessage += error.response.data;
        } else if (error.response.data.messages) {
          Object.entries(error.response.data.messages).forEach(
            ([field, messages]) => {
              errorMessage += `${field}: ${messages}\n`;
            }
          );
        } else if (error.response.data.error) {
          errorMessage += error.response.data.error;
        } else {
          errorMessage +=
            "Respuesta del servidor: " + JSON.stringify(error.response.data);
        }

        throw new Error(errorMessage);
      }

      throw error;
    }
  },

  // Cambiar estado de oferta
  changeOfertaState: async (id: number, state: string) => {
    try {
      const response = await api.patch(`/sale_order/state/${id}/`, { state });
      return mapBackendToFrontend(response.data);
    } catch (error) {
      console.error(`Error al cambiar estado de oferta con ID ${id}:`, error);
      throw error;
    }
  },
  // Usar un único endpoint para obtener o actualizar un comentario para una oferta
  saveComentarioOferta: async (
    ofertaId: number,
    comentario: string,
    userId: number
  ) => {
    try {
      const comentarioData = {
        user_id: userId,
        description: comentario,
      };

      // Esta API actualizará el comentario existente o creará uno nuevo si no existe
      const response = await api.post(
        `/comentary_sale_order/get_or_create/${ofertaId}/`,
        comentarioData
      );

      return response.data;
    } catch (error: any) {
      console.error("Error al guardar comentario:", error);
      if (error.response) {
        console.error("Detalles del error:", error.response.data);
        console.error("Estado HTTP:", error.response.status);
      }
      throw new Error("No se pudo guardar el comentario para la oferta");
    }
  },

  // Estos métodos se mantienen para compatibilidad con el código existente
  createComentarioOferta: async (
    ofertaId: number,
    comentario: string,
    userId: number
  ) => {
    try {
      return await ofertaServiceFixed.saveComentarioOferta(
        ofertaId,
        comentario,
        userId
      );
    } catch (error) {
      console.error("Error al crear comentario:", error);
      throw new Error("No se pudo crear el comentario para la oferta");
    }
  },

  updateComentarioOferta: async (comentarioId: number, comentario: string) => {
    try {
      // Obtenemos el ID de la oferta del comentario
      const response = await api.get(
        `/comentary_sale_order/retrieve/${comentarioId}/`
      );
      if (!response.data || !response.data.sale_order_id) {
        throw new Error(
          `No se pudo encontrar la oferta asociada al comentario ${comentarioId}`
        );
      }

      const ofertaId = response.data.sale_order_id;

      // Usamos el método unificado con el ID de la oferta
      return await ofertaServiceFixed.saveComentarioOferta(
        ofertaId,
        comentario,
        1 // Usuario por defecto, idealmente debería venir del contexto
      );
    } catch (error: any) {
      console.error("Error al actualizar comentario:", error);
      throw new Error("No se pudo actualizar el comentario para la oferta");
    }
  },

  // Obtener último comentario de una oferta
  getLastComentarioOferta: async (ofertaId: number) => {
    try {
      // Usar el nuevo endpoint
      const response = await api.get(
        `/comentary_sale_order/get_or_create/${ofertaId}/`
      );
      return response.data;
    } catch (error: any) {
      // Si no encuentra comentarios, devuelve null (es un comportamiento esperado)
      if (error.response && error.response.status === 404) {
        return null;
      }
      console.error("Error al obtener comentario:", error);
      return null;
    }
  },
  // Eliminar una oferta existente
  deleteOferta: async (id: number) => {
    try {
      // Asegurarse de que el ID sea válido
      if (!id || isNaN(id)) {
        throw new Error(`ID de oferta inválido: ${id}`);
      }

      // Usar una solicitud DELETE directamente al endpoint específico
      const response = await api.delete(`/sale_order/delete/${id}/`);

      return response.data;
    } catch (error: any) {
      console.error(`Error al eliminar oferta con ID ${id}:`, error);
      console.error("Detalles del error:", error.response || error.message);

      if (error.response?.data) {
        console.error(
          "Detalles del error en deleteOferta:",
          error.response.data
        );
        let errorMessage = `Error al eliminar la oferta ${id}: `;

        if (typeof error.response.data === "string") {
          errorMessage += error.response.data;
        } else if (error.response.data.messages) {
          Object.entries(error.response.data.messages).forEach(
            ([field, messages]) => {
              errorMessage += `${field}: ${messages}\n`;
            }
          );
        } else if (error.response.data.error) {
          errorMessage += error.response.data.error;
        } else {
          errorMessage +=
            "Respuesta del servidor: " + JSON.stringify(error.response.data);
        }

        throw new Error(errorMessage);
      }

      throw new Error(`Error desconocido al eliminar la oferta ${id}`);
    }
  },

  // Nueva función para eliminar específicamente la hoja de cálculo de una oferta
  deleteHojaCalculo: async (id: number) => {
    try {
      // Asegurarse de que el ID sea válido
      if (!id || isNaN(id)) {
        throw new Error(`ID de oferta inválido: ${id}`);
      }

      // Crear un FormData solo con la instrucción de eliminar la hoja de cálculo
      const formData = new FormData();
      formData.append("eliminar_hoja_calculo", "true");

      console.log(`Solicitando eliminar la hoja de cálculo de la oferta ${id}`);

      // Usar una solicitud PATCH para actualizar solo lo necesario
      const response = await api.patch(`/sale_order/update/${id}/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return mapBackendToFrontend(response.data);
    } catch (error: any) {
      console.error(
        `Error al eliminar hoja de cálculo de oferta ${id}:`,
        error
      );
      throw new Error(
        `No se pudo eliminar la hoja de cálculo: ${error.message}`
      );
    }
  },

  // Función para eliminar un archivo adjunto específico
  deleteAttachFile: async (ofertaId: number, fileId: number | string) => {
    try {
      console.log(
        `Iniciando eliminación de archivo: ofertaId=${ofertaId}, fileId=${fileId}`
      );

      // Crear un objeto FormData para el envío
      const formData = new FormData();

      // Agregar el ID como string para asegurar la compatibilidad
      formData.append("archivos_a_eliminar", String(fileId));

      console.log(
        `Enviando solicitud para eliminar archivo ${fileId} de la oferta ${ofertaId}`
      );

      // Hacer la solicitud al backend
      const response = await api.put(
        `/sale_order/update/${ofertaId}/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Respuesta del servidor:", response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        `Error al eliminar archivo ID=${fileId} de oferta ${ofertaId}:`,
        error
      );
      if (error.response) {
        console.error("Detalles del error:", error.response.data);
        console.error("Status:", error.response.status);
      }
      throw new Error(`No se pudo eliminar el archivo: ${error.message}`);
    }
  },
};

export default ofertaServiceFixed;
