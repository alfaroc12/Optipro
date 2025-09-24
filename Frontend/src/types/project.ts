export interface SaleOrder {
  id: number;
  name: string;
  first_name: string;
  nitCC: string;
  Type_installation: string;
  phone: string;
  total_quotation: number;
  addres: string;
  system_type: string;
  city: string;
  cotizador: string;
  date_start: string;
  power_required: number
  project_type: string
  description: string;
  description_2: string
}

export interface Project {
  id: number;
  name?: string;
  description?: string;
  user_id: number;
  project_id: any;
  tipo?: string;
  etapa?: "Planificación" | "Ejecución" | "Finalizado" | "Suspendido";
  sale_order?: SaleOrder;
  attachments?: Attachment[];
  [key: string]: any;
}

interface Attachment {
  name: string;
  attach: string;
  fulfillment?: string;
  news?: string;
  date?: string;
  id?: number;
}

