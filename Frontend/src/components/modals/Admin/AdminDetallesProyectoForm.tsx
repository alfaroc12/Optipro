import {useEffect, useState} from "react";
import {
	Calendar,
	ChevronRight,
	ChevronLeft,
	Upload,
	CheckCircle,
	XCircle,
	RefreshCw,
	AlertCircle,
	Clock,
	Download,
	Trash2,
	Pencil,
} from "lucide-react";
import { Gauge } from "@mui/x-charts";
import api from "@/services/api";
import Chat from "@/components/modals/chat.tsx";
import {LinearProgress} from "@mui/material";
import {Project} from "@/types/project.ts";
interface DetallesProyectoFormProps {
	project: any;
	onSubmit: (data: any) => void;
	onCancel: () => void;
	onDelete: (id: number) => void;
}

interface Notification {
	id: string;
	type: 'success' | 'error';
	message: string;
}

const AdminDetallesProyectoForm: React.FC<DetallesProyectoFormProps> = ({
																																					project,
																																					onSubmit,
																																					onCancel,
																																					onDelete,
																																				}) => {
	const [currentStep, setCurrentStep] = useState<number>(1);
	const [uploadedFiles, ] = useState<Array<{file: File, comment: string}>>([]);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [, setUploadingFile] = useState<string | null>(null);
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [showChat, setShowChat] = useState(false);

	const [dataProject, setDataProject] = useState<Project | null>(null);
	const [, setFormValues] = useState<any>({}); // Datos editables por el usuario
	const [formData, setFormData] = useState<any>()

	const [novedadesEstado, setNovedadesEstado] = useState<Record<string, string>>({});


	const fetchProjectDetail = async () => {
		if (!project?.id) return;

		try {
			const response = await api.get(`/proyect/retrieve/${project.id}/`);
			const fullProject = response.data;
			const progreso = calcularProgresoDocumentos(fullProject.attachments || [], fullProject.status);
			const etapa = mapStatusToLocal(fullProject.status);

			setDataProject(fullProject); // 100% crudo
			setFormData({
				...fullProject,
				progreso,
				etapa,
			});

			setFormValues({
				nombre: fullProject.sale_order?.name || "",
				ciudad: fullProject.sale_order?.city || "",
				potencia: fullProject.sale_order?.power_required || "",
				valor: fullProject.sale_order?.total_quotation || "",
				descripcion: fullProject.sale_order?.description || "",
				fechaEmision: fullProject.sale_order?.date || "",
				fechaInicio: fullProject.sale_order?.date_start || "",
				fechaFinalizacion: fullProject.sale_order?.date_end || "",
				description: fullProject.sale_order?.description || "",
				notasdelContrato: fullProject.sale_order?.description_2 || "",
				representaten: fullProject.sale_order?.representante || "",
				cotizador: fullProject.sale_order?.cotizador || "",
			});
		} catch (error) {
			console.error("Error al cargar detalles del proyecto:", error);
			showNotification("error", "No se pudo cargar el proyecto.");
		}
	};

	useEffect(() => {
		if (!formData || formData.status !== "process") return;

		const estadoInicial: Record<string, string> = {};

		Object.keys(progressMapByStatus.process).forEach((docKey) => {
			const regex = new RegExp(docKey, "i");
			const tieneArchivo = (formData.attachments || []).some((att: { name: any; attach: any; }) =>
				regex.test(att.name || att.attach)
			);

			estadoInicial[docKey] = tieneArchivo ? "Completado" : "Pendiente";
		});

		setCumplimientoEstado(estadoInicial);
	}, [formData?.attachments, formData?.status]);

	const progressMapByStatus: Record<string, Record<string, number>> = {
		process: {
			cotizacion: 0,
			contrato_firmado: 10,
			rut: 10,
			camara_de_comercio: 10,
			cedula_representante_legal: 10,
			anticipo: 10,
			soporte_de_pago: 10,
			factura: 10,
			acta_de_inicio: 10,
			cronograma_de_trabajo: 5,
			retie: 5,
			legalizacion: 5,
			acta_de_cierre: 5,
		},
	};

	// Función para mostrar notificaciones
	const showNotification = (type: 'success' | 'error', message: string) => {
		const id = Math.random().toString(36).substring(2, 9);
		setNotifications(prev => [...prev, { id, type, message }]);

		// Eliminar la notificación después de 5 segundos
		setTimeout(() => {
			setNotifications(prev => prev.filter(n => n.id !== id));
		}, 5000);
	};

	const formatDateForInput = (dateString: string | undefined): string => {
		if (!dateString) return '';
		return dateString.split('T')[0];
	};

	useEffect(() => {
				fetchProjectDetail();
	}, [project?.id]);

	useEffect(() => {
		if (!formData || formData.status !== "process") return;

		const cumplimiento: Record<string, string> = {};
		const novedades: Record<string, string> = {};

		Object.keys(progressMapByStatus.process).forEach((docKey) => {
			const regex = new RegExp(docKey, "i");
			const matching = (formData.attachments || []).find((att:any) =>
				regex.test(att.name || att.attach)
			);

			if (matching) {
				cumplimiento[docKey] = matching.fulfillment || "Pendiente";
				novedades[docKey] = matching.news || "Ninguna";
			} else {
				cumplimiento[docKey] = "Pendiente";
				novedades[docKey] = "Ninguna";
			}
		});

		setCumplimientoEstado(cumplimiento);
		setNovedadesEstado(novedades);
	}, [formData?.attachments, formData?.status]);



	const mapStatusToLocal = (apiStatus: string): string => {
		switch (apiStatus) {
			case 'planification': return 'planification';
			case 'process': return 'process';
			case 'finaly': return 'finaly';
			default: return 'process';
		}
	};

	const normalizeFileName = (label: string) => {
		return label
			.trim()
			.toLowerCase()
			.normalize("NFD")
			.replace(/\p{Diacritic}/gu, "")
			.replace(/\s+/g, "_")
			.replace(/[^a-z0-9_]/g, "");
	};

	const calcularProgresoDocumentos = (
		attachments: Array<{ name: string; attach: string }> = [],
		status: string = "planification",
		cumplimientoEstado: Record<string, string> = {}
	): number => {
		const progressMapByStatus: Record<string, Record<string, number>> = {
			process: {
				cotizacion: 0,
				contrato_firmado: 10,
				rut: 10,
				camara_de_comercio: 10,
				cedula_representante_legal: 10,
				anticipo: 10,
				soporte_de_pago: 10,
				factura: 10,
				acta_de_inicio: 10,
				cronograma_de_trabajo: 5,
				retie: 5,
				legalizacion: 5,
				acta_de_cierre: 5,
			},
		};

		if (status === "planification") {
			const requiredDocs = [
				/aceptacion_de_oferta/i,
				/camara_de_comercio/i,
				/rut/i,
				/copia_cedula_representante_legal/i,
				/numero_de_contrato/i,
				/polizas/i,
			];

			const encontrados = requiredDocs.filter((regex) =>
				attachments.some((att) => regex.test(att.name || att.attach))
			).length;

			const porcentaje = Math.floor(100 / requiredDocs.length);
			const progresoBase = encontrados * porcentaje;
			const exceso = encontrados === requiredDocs.length ? 100 - progresoBase : 0;

			return progresoBase + exceso;
		}

		const progressMap = progressMapByStatus[status] || {};

		return Object.entries(progressMap).reduce((total, [docKey, porcentaje]) => {
			const regex = new RegExp(docKey, "i");
			attachments.some((att) => regex.test(att.name || att.attach));
			const estadoCumplimiento = cumplimientoEstado?.[docKey];
			if (estadoCumplimiento === "Completado") {
				return total + porcentaje;
			}
			return total;
		}, 0);
	};


	const handleNextStep = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		if (currentStep < 3) setCurrentStep((s) => s + 1);
	};

	const handlePrevStep = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		if (currentStep > 1) setCurrentStep((s) => s - 1);
	};
	const handleUpdateProject = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);

		if (!formData?.id) {
			showNotification("error", "El proyecto no tiene un ID válido.");
			return;
		}

		setIsSubmitting(true);

		try {
			// Payload con todos los campos que quieres actualizar

			let newStatus = formData.status;

		// Si está en planification y la cotización es aprobada, cambia a process
			if (formData.etapa === "planification" && formData.estadoCotizacion === "aprobado") {
				newStatus = "process";
			}
			const payload = {
				status: newStatus,
				sale_order: {
					id: formData.sale_order?.id,
					date: formData.sale_order?.date,
					nitCC: formData.sale_order?.nitCC,
					representante: formData.sale_order?.representante,
					firs_name: formData.sale_order?.firs_name,
					other_name: formData.sale_order?.other_name,
					last_name: formData.sale_order?.last_name,
					secon_surname: formData.sale_order?.secon_surname,
					name: formData.sale_order?.name,
					addres: formData.sale_order?.addres,
					phone: formData.sale_order?.phone,
					phone_2: formData.sale_order?.phone_2,
					proyect_type: formData.sale_order?.proyect_type,
					total_quotation: formData.sale_order?.total_quotation,
					description: formData.sale_order?.description,
					payment_type: formData.sale_order?.payment_type,
					system_type: formData.sale_order?.system_type,
					power_required: formData.sale_order?.power_required,
					panel_type: formData.sale_order?.panel_type,
					energy_production: formData.sale_order?.energy_production,
					city: formData.sale_order?.city,
					departement: formData.sale_order?.departement,
					number_panels: formData.sale_order?.number_panels,
					necessary_area: formData.sale_order?.necessary_area,
					Type_installation: formData.sale_order?.Type_installation,
					Delivery_deadline: formData.sale_order?.Delivery_deadline,
					Validity_offer: formData.sale_order?.Validity_offer,
					Warranty: formData.sale_order?.Warranty,
					solar_panels: formData.sale_order?.solar_panels,
					solar_panels_price: formData.sale_order?.solar_panels_price,
					Assembly_structures: formData.sale_order?.Assembly_structures,
					Assembly_structures_price: formData.sale_order?.Assembly_structures_price,
					Wiring_and_cabinet: formData.sale_order?.Wiring_and_cabinet,
					Wiring_and_cabinet_price: formData.sale_order?.Wiring_and_cabinet_price,
					Legalization_and_designs: formData.sale_order?.Legalization_and_designs,
					Legalization_and_designs_price: formData.sale_order?.Legalization_and_designs_price,
					batterys: formData.sale_order?.batterys,
					batterys_price: formData.sale_order?.batterys_price,
					investors: formData.sale_order?.investors,
					investors_price: formData.sale_order?.investors_price,
					Kit_5kw: formData.sale_order?.Kit_5kw,
					Kit_5kw_price: formData.sale_order?.Kit_5kw_price,
					Kit_8kw: formData.sale_order?.Kit_8kw,
					Kit_8kw_price: formData.sale_order?.Kit_8kw_price,
					Kit_12kw: formData.sale_order?.Kit_12kw,
					Kit_12kw_price: formData.sale_order?.Kit_12kw_price,
					Kit_15kw: formData.sale_order?.Kit_15kw,
					Kit_15kw_price: formData.sale_order?.Kit_15kw_price,
					Kit_30kw: formData.sale_order?.Kit_30kw,
					Kit_30kw_price: formData.sale_order?.Kit_30kw_price,
					Microinverters: formData.sale_order?.Microinverters,
					Microinverters_price: formData.sale_order?.Microinverters_price,
					Transport: formData.sale_order?.Transport,
					Transport_price: formData.sale_order?.Transport_price,
					workforce: formData.sale_order?.workforce,
					workforce_price: formData.sale_order?.workforce_price,
					supervisor: formData.supervisor
				},
			};

			const response = await api.patch(`/proyect/update/${formData.id}/`, payload);

			if (response.status === 200) {
				showNotification("success", "Proyecto actualizado correctamente.");
				onSubmit(response.data);
			} else {
				throw new Error(`Error inesperado: ${response.status}`);
			}
		} catch (error: any) {
			console.error("Error al actualizar el proyecto:", error);
			let message = "Error al actualizar el proyecto.";

			if (error.response) {
				message += ` ${error.response.data.detail || error.response.statusText}`;
			}

			showNotification("error", message);
		} finally {
			setIsSubmitting(false);
			await fetchProjectDetail();
		}
	};
	const uploadDocument = async (
		fieldKey: string,
		file: File,
		projectId: number,
		documentName: string
	): Promise<string | null> => {
		setUploadingFile(fieldKey);

		try {
			const normalizedName = normalizeFileName(documentName);
			const fileExtension = file.name.split('.').pop();
			const existingFiles = dataProject?.attachments?.filter(att =>
				att.name.toLowerCase().includes(normalizedName)
			) || [];

			const consecutive = existingFiles.length + 1;
			const newFileName = `${normalizedName}_${consecutive}.${fileExtension}`;

			const formDataUpload = new FormData();
			formDataUpload.append("attach", file, newFileName);
			formDataUpload.append("proyect_id", projectId.toString());
			formDataUpload.append("comment", documentName);

			const response = await api.post("/attach_proyect/create/", formDataUpload, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			if (response.status !== 201) {
				throw new Error(`Error en la respuesta del servidor: ${response.status}`);
			}

			showNotification('success', `Documento ${documentName} subido correctamente`);

			// Creamos el nuevo attachment con la info del backend
			const newAttachment = {
				name: newFileName,
				attach: response.data.file || response.data.url,
				date: new Date().toISOString(),
			};

			// Generamos la lista actualizada de attachments
			const updatedAttachments = [...(formData.attachments || []), newAttachment];

			// Recalculamos el progreso
			const newProgress = calcularProgresoDocumentos(
				updatedAttachments,
				formData.status
			);

			// Actualizamos el estado local de forma inmediata
			setFormData((prev: any) => ({
				...prev,
				attachments: updatedAttachments,
				progreso: newProgress,
			}));

			setDataProject((prev: any) => ({
				...prev,
				attachments: updatedAttachments,
			}));

			return response.data.file || response.data.url;
		} catch (error: any) {
			console.error(`Error subiendo ${fieldKey}:`, error);
			let errorMessage = `Error al subir el documento ${documentName}`;

			if (error.response) {
				errorMessage += `: ${error.response.data.detail || error.response.statusText}`;
			}

			showNotification('error', errorMessage);
			return null;
		} finally {
			setUploadingFile(null);
		}
	};


	useEffect(() => {
		if (!project) return;

		// Guardamos una copia literal, sin mutar
		setDataProject(project);
		const etapa = mapStatusToLocal(project.status);

		setFormData({
			...project,
			etapa,
		});
	}, [project]);

	const eliminarArchivo = async (idArchivo: number, nombreDoc: string) => {
		try {
			await api.delete(`/attach_proyect/delete/${idArchivo}/`);
			showNotification("success", `Archivo "${nombreDoc}" eliminado correctamente.`);
			await fetchProjectDetail();
		} catch (error) {
			console.error("Error al eliminar el archivo:", error);
			showNotification("error", "No se pudo eliminar el archivo. Intenta nuevamente.");
		}
	};


	const getStatusIcon = (etapa: string) => {
		switch (etapa) {
			case "finalizado":
				return <CheckCircle className="w-4 h-4 text-green-500" />;
			case "suspendido":
				return <XCircle className="w-4 h-4 text-red-500" />;
			case "ejecucion":
				return <RefreshCw className="w-4 h-4 text-blue-500" />;
			case "planificacion":
				return <AlertCircle className="w-4 h-4 text-yellow-500" />;
			default:
				return <Clock className="w-4 h-4 text-gray-500" />;
		}
	};

	const renderStepIndicator = () => {
		const steps = [
			{ name: "Información básica", number: 1 },
			{ name: "Contratación", number: 2 },
			{ name: "Estado de Aprobación", number: 3 },
		];

		return (
			<div className="relative px-6 pt-4 pb-8 border-b border-gray-100 z-0">
				<div className="flex justify-between items-center">
					{steps.map((step, index) => (
						<div key={index} className="flex flex-col items-center flex-1">
							<div
								className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-semibold ${
									currentStep >= step.number
										? "bg-[#4178D4] border-[#4178D4] text-white"
										: "bg-white border-gray-300 text-gray-500"
								}`}
							>
								{currentStep > step.number ? (
									<CheckCircle className="w-4 h-4" />
								) : (
									step.number
								)}
							</div>
							<span
								className={`mt-2 text-xs font-medium text-center ${
									currentStep >= step.number ? "text-[#4178D4]" : "text-gray-500"
								}`}
							>
							{step.name}
						</span>
						</div>
					))}
				</div>

				{/* líneas de conexión */}
				<div className="absolute top-8 left-8 right-8 h-0.5 bg-gray-300 z-[-1]">
					<div
						className="h-full bg-[#4178D4] transition-all duration-300"
						style={{
							width:
								currentStep === 1
									? "0%"
									: currentStep === 2
										? "50%"
										: "100%",
						}}
					/>
				</div>
			</div>
		);
	};

	const renderClientInfo = () => {
		const progreso = calcularProgresoDocumentos(
			formData.attachments || [],
			formData.status,
			cumplimientoEstado
		);
		if (!dataProject?.sale_order) {
			return (
				<div className="mb-6 p-4 bg-yellow-50 text-yellow-700 rounded-lg">
					Información del cliente no disponible.
				</div>
			);
		}

		const cliente = dataProject.sale_order;
		const formatMoney = (v?: string | number) =>
			v ? `$${Number(v).toLocaleString("es-CO", { minimumFractionDigits: 2 })}` : "No especificado";
		return (
			<div className="mb-6 p-4 bg-gray-50 rounded-lg">
				{formData?.status === "process" && (
					<div className="flex justify-end mb-4">
						<div className="flex gap-2">
							<button
								type="button"
								onClick={() => setShowChat(true)}
								className={`px-4 py-2 rounded-full text-sm font-semibold border transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md ${
									showChat
										? 'bg-blue-600 text-white border-blue-600'
										: 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
								}`}
							>
								Ver Chat
							</button>

						</div>
					</div>
				)}
				<h4 className="font-semibold text-[#34509F] mb-3">Información del Cliente</h4>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					<div>
						<label className="block mb-1 text-sm font-medium text-gray-600">Nombre</label>
						<p className="text-gray-800">
							{cliente.name || cliente.first_name || "No especificado"}
						</p>
					</div>
					<div>
						<label className="block mb-1 text-sm font-medium text-gray-600">NIT</label>
						<p className="text-gray-800">{cliente.nitCC || "No especificado"}</p>
					</div>
					<div>
						<label className="block mb-1 text-sm font-medium text-gray-600">Dirección</label>
						<p className="text-gray-800">{cliente.addres || "No especificado"}</p>
					</div>
					<div>
						<label className="block mb-1 text-sm font-medium text-gray-600">Ciudad</label>
						<p className="text-gray-800">{cliente.city || "No especificado"}</p>
					</div>
					<div>
						<label className="block mb-1 text-sm font-medium text-gray-600">Teléfono</label>
						<p className="text-gray-800">{cliente.phone || "No especificado"}</p>
					</div>
					<div>
						<label className="block mb-1 text-sm font-medium text-gray-600">Valor total</label>
						<p className="text-gray-800">{formatMoney(cliente.total_quotation)}</p>
					</div>
					<div>
						<label className="block mb-1 text-sm font-medium text-gray-600">Tipo de Instalación</label>
						<p className="text-gray-800">{cliente.Type_installation}</p>
					</div>
					<div>
						<label className="block mb-1 text-sm font-medium text-gray-600">Tipo de Proyecto</label>
						<p className="text-gray-800 capitalize">
							{cliente.project_type === "private"
								? "Privado"
								: cliente.project_type === "public"
									? "Público"
									: "No especificado"}
						</p>
					</div>
				</div>
				<div className="flex justify-center items-center mt-6 mb-2">
					<div className="rounded-lg px-6 py-4">
						<label className="block mb-1 text-sm font-medium text-gray-600">Cotizador</label>
						<p className="text-[#34509F] text-center font-semibold">{cliente.cotizador || "No especificado"}</p>
					</div>
				</div>
				<div className="mt-8 border-t border-gray-200 pt-6">
					<h4 className="font-semibold text-[#34509F] mb-2 text-center">Progreso del Proyecto</h4>
					<div className="flex justify-center">
						{formData.status === "planification" ? (
							<div className="w-full max-w-md mx-auto mt-4">
								<div className="flex justify-between mb-1 text-sm text-gray-600">
									<span>Progreso del proyecto</span>
									<span>{formData.progreso || 0}%</span>
								</div>
								<LinearProgress
									variant="determinate"
									value={formData.progreso || 0}
									sx={{ height: 10, borderRadius: 5 }}
								/>
							</div>
						) : (
							<Gauge
								value={formData.status === "finaly" ? 100 : progreso || 0}
								startAngle={-110}
								endAngle={110}
								innerRadius="80%"
								outerRadius="100%"
								width={280}
								height={180}
								text={({ value }) => `${value}%`}
							/>
						)}

					</div>
				</div>
			</div>
		);
	};

	const actualizarEstadoAFinalizado = async () => {
		try {
			await api.patch(`/proyect/update/${dataProject?.id}/`, { status: "finaly" });
			alert("Estado del proyecto actualizado a Finalizado");
			setFormData((prev: any) => ({ ...prev, status: "finaly" }));
		} catch (error) {
			console.error("Error actualizando el estado del proyecto:", error);
			alert("No se pudo actualizar el estado. Intenta nuevamente.");
		}
	};

	const renderCompactUploadField = (key: string, label: string) => {
		const normalized = normalizeFileName(label);
		const matchingFiles = (formData.attachments || []).filter((a: any) =>
			a.name.toLowerCase().includes(normalized)
		);

		const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file || !project?.id) return;

			const uploadedUrl = await uploadDocument(key, file, project.id, label);
			if (uploadedUrl) {
				const newAttachment = {
					name: file.name,
					attach: uploadedUrl,
					date: new Date().toISOString(),
				};

				// Actualizamos estado para que la UI se refresque con el nuevo archivo
				setFormData((prev: any) => ({
					...prev,
					attachments: [...(prev.attachments || []), newAttachment],
				}));
				setDataProject((prev: any) => ({
					...prev,
					attachments: [...(prev.attachments || []), newAttachment],
				}));
			}
			e.target.value = '';
		};

		return (
			<div className="flex flex-col gap-2">
				<label className="block text-sm font-medium text-gray-700">{label}</label>

				{/* Archivos existentes */}
				<div className="flex flex-col gap-2">
					{matchingFiles.map((file: any, idx: number) => (
						<div key={idx} className="flex justify-between items-center border rounded-lg px-4 py-2 bg-white shadow-sm">
							<p className="text-sm text-gray-700 truncate">{file.name}</p>
							<a
								href={`${import.meta.env.VITE_API_URL || "https://backend-optipro-production.up.railway.app"}${file.attach}`}
								download
								target="_blank"
								rel="noopener noreferrer"
								className="text-blue-600 hover:text-blue-800"
								title="Descargar"
							>
								<Download className="w-4 h-4" />
							</a>
						</div>
					))}
				</div>

				{/* Input para subir más archivos */}
				<div>
					<input
						type="file"
						id={`upload-${key}`}
						onChange={handleChange}
						className="hidden"
					/>
					<label
						htmlFor={`upload-${key}`}
						className="inline-flex items-center gap-2 px-4 py-2 border border-[#4178D4] rounded-md bg-white text-[#4178D4] hover:bg-blue-50 cursor-pointer text-sm"
					>
						<Upload className="w-4 h-4" />
						<span>Subir archivo</span>
					</label>
				</div>
			</div>
		);
	};


	// ---------------------------------------------------------------------------
//  ADMIN – Paso 1  (Información básica + Documentos legales)
// ---------------------------------------------------------------------------
	const renderStep1 = () => {
		/* --------------------------------------------------------------------- */
		/*  NORMALIZAMOS la data que llega del backend                            */
		/* --------------------------------------------------------------------- */
		const project = dataProject || {};
		console.log(project); //


		/* --------------------------------------------------------------------- */
		return (
			<div className="mb-6">
				{/* encabezado */}
				<div className="mb-6 pb-4 border-b border-gray-100">
					<h3 className="text-lg font-bold text-gray-800 flex items-center">
          <span className="inline-flex items-center justify-center w-6 h-6 bg-[#4178D4] text-white rounded-full text-xs mr-2">
            1
          </span>
						INFORMACIÓN BÁSICA
					</h3>
				</div>

				{/* info del cliente reutilizada */}
				{renderClientInfo()}

				{/* nombre + ciudad */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
					<div>
						<label className="block mb-1.5 font-medium text-gray-700">Nombre del proyecto</label>
						<input
							name="nombre"
							type="text"
							value={formData.sale_order?.name || ""}
							onChange={(e) =>
								setFormData((prev: any) => ({
									...prev,
									sale_order: {
										...prev.sale_order,
										name: e.target.value,
									},
								}))
							}
							className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
							placeholder="Nombre del proyecto"
							disabled={isSubmitting}
						/>
					</div>
					<div>
						<label className="block mb-1.5 font-medium text-gray-700">Ciudad</label>
						<input
							name="ciudad"
							type="text"
							value={formData.sale_order?.city || ""}
							onChange={(e) =>
								setFormData((prev: any) => ({
									...prev,
									sale_order: {
										...prev.sale_order,
										city: e.target.value,
									},
								}))
							}
							className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
							placeholder="Ciudad del proyecto"
							disabled={isSubmitting}
						/>
					</div>
				</div>


				{/* fecha | potencia | valor */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
					<div>
						<label className="block mb-1.5 font-medium text-gray-700">Fecha de emisión</label>
						<div className="relative">
							<input
								name="fechaEmision"
								type="date"
								value={formatDateForInput(formData.sale_order?.date)}
								onChange={(e) =>
									setFormData((prev: any) => ({
										...prev,
										sale_order: {
											...prev.sale_order,
											date: e.target.value, // aquí se guarda en formato YYYY-MM-DD
										},
									}))
								}
								className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-lg"
								disabled={isSubmitting}
							/>
							<Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
						</div>
					</div>

					<div>
						<label className="block mb-1.5 font-medium text-gray-700">Potencia (kW)</label>
						<input
							name="potencia"
							type="number"
							min="0"
							step="0.01"
							value={formData.sale_order?.power_required || ""}
							onChange={(e) =>
								setFormData((prev: any) => ({
									...prev,
									sale_order: {
										...prev.sale_order,
										power_required: e.target.value,
									},
								}))
							}
							className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
							placeholder="Potencia instalada"
							disabled={isSubmitting}
						/>
					</div>

					<div>
						<label className="block mb-1.5 font-medium text-gray-700">Valor del proyecto</label>
						<input
							name="valor"
							type="text"
							value={formData.sale_order?.total_quotation || ""}
							onChange={(e) =>
								setFormData((prev: any) => ({
									...prev,
									sale_order: {
										...prev.sale_order,
										total_quotation: e.target.value,
									},
								}))
							}
							className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
							placeholder="Valor total"
							disabled={isSubmitting}
						/>
					</div>
				</div>

				{/* descripción */}
				<div className="mb-6">
					<label className="block mb-1.5 font-medium text-gray-700">Descripción</label>
					<textarea
						name="descripcion"
						value={formData.sale_order?.description || ""}
						onChange={(e) =>
							setFormData((prev: any) => ({
								...prev,
								sale_order: {
									...prev.sale_order,
									description: e.target.value,
								},
							}))
						}
						className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
						placeholder="Descripción detallada del proyecto"
						rows={4}
						disabled={isSubmitting}
					/>
				</div>


				{/* fechas de inicio / fin */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
					<div>
						<label className="block mb-1.5 font-medium text-gray-700">Fecha de inicio</label>
						<div className="relative">
							<input
								name="fechaInicio"
								type="date"
								value={formatDateForInput(formData.sale_order?.date_start)}
								onChange={(e) =>
									setFormData((prev: any) => ({
										...prev,
										sale_order: {
											...prev.sale_order,
											date_start: e.target.value,
										},
									}))
								}
								className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-lg"
								disabled={isSubmitting}
							/>
							<Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
						</div>
					</div>
					<div>
						<label className="block mb-1.5 font-medium text-gray-700">Fecha de finalización</label>
						<div className="relative">
							<input
								name="fechaFinalizacion"
								type="date"
								value={formatDateForInput(formData.sale_order?.date_end)}
								onChange={(e) =>
									setFormData((prev: any) => ({
										...prev,
										sale_order: {
											...prev.sale_order,
											date_end: e.target.value,
										},
									}))
								}
								className="w-full p-3 pl-10 bg-gray-50 border border-gray-200 rounded-lg"
								disabled={isSubmitting}
							/>
							<Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none w-5 h-5" />
						</div>
					</div>
				</div>


				{/* --------------------------- Documentos legales -------------------- */}
				<div className="mb-6">
					<h4 className="font-semibold text-[#34509F] mb-3">Documentos legales</h4>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						{renderCompactUploadField("aceptacionOferta", "Aceptación de oferta")}
						{renderCompactUploadField("rut", "RUT")}
						{renderCompactUploadField("camaraComercio", "Cámara de Comercio")}
						{renderCompactUploadField("cedulaRepresentante", "Copia cédula representante legal")}
					</div>
				</div>
			</div>
		);
	};


	const renderStep2 = () => (
		<div className="mb-6">
			<div className="mb-6 pb-4 border-b border-gray-100">
				<h3 className="text-lg font-bold text-gray-800 flex items-center">
          <span className="inline-flex items-center justify-center w-6 h-6 bg-[#4178D4] text-white rounded-full text-xs mr-2">
            2
          </span>
					CONTRATACIÓN
				</h3>
			</div>

			{renderClientInfo()}

			<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
				{renderCompactUploadField("numeroContrato", "Número de contrato")}
				{renderCompactUploadField("polizas", "Pólizas")}
			</div>


			<div>
				<label className="block mb-1.5 font-medium text-gray-700">
					Adjuntar archivo adicional
				</label>

				{/* Input real */}
				<input
					type="file"
					id="fileUploadExtra"
					className="hidden"
					disabled={isSubmitting}
					onChange={async (e) => {
						const file = e.target.files?.[0];
						if (!file || !project?.id) return;

						const label = "Documento adicional"; // Cambia si quieres
						await uploadDocument("extra", file, project.id, label);
						await fetchProjectDetail();
					}}
				/>

				{/* Botón estilizado */}
				<label
					htmlFor="fileUploadExtra"
					className={`flex items-center gap-2 px-4 py-2 border border-[#4178D4] rounded-lg bg-white text-[#4178D4] hover:bg-blue-50 cursor-pointer transition-colors ${
						isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
					}`}
				>
					<Upload className="w-5 h-5" />
					<span>Adjuntar archivo</span>
				</label>

				{/* Lista de archivos subidos que coinciden con "documento_adicional" */}
				<div className="mt-2 space-y-1">
					{(formData.attachments || [])
						.filter((a: any) =>
							a.name?.toLowerCase().includes("documento_adicional")
						)
						.map((file: any) => (
							<div
								key={file.id}
								className="flex items-center gap-2 text-sm text-gray-700"
							>
								<a
									href={`http://127.0.0.1:8000${file.attach}`}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-1 text-blue-600 hover:underline"
								>
									<Download className="w-4 h-4" />
									{file.name}
								</a>
								<button
									type="button"
									className="text-red-500 hover:text-red-700"
									title="Eliminar"
									onClick={() => eliminarArchivo(file.id, file.name)}
								>
									<Trash2 className="w-4 h-4" />
								</button>
							</div>
						))}
				</div>
			</div>


		</div>
	);

	const renderStep3 = () => (
		<div className="mb-6">
			<div className="mb-6 pb-4 border-b border-gray-100">
				<h3 className="text-lg font-bold text-gray-800 flex items-center">
					<span className="inline-flex items-center justify-center w-6 h-6 bg-[#4178D4] text-white rounded-full text-xs mr-2">
						3
					</span>
					INFORMACIÓN COTIZACIÓN
				</h3>
				<p className="text-sm text-gray-500 ml-8 mt-1">Puede actualizar el estado y los comentarios de esta cotización</p>
			</div>

			{renderClientInfo()}

			<div className="grid grid-cols-1 gap-5 mb-6">
				<div>
					<label className="block mb-1.5 font-medium text-gray-700">
						Estado de cotización<span className="text-red-500">*</span>
					</label>
					<select
						name="estadoCotizacion"
						value={formData.estadoCotizacion || ""}
						onChange={(e) => setFormData({ ...formData, estadoCotizacion: e.target.value })}
						className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
						disabled={isSubmitting}
					>
						<option value="">Seleccione un estado</option>
						<option value="aprobado">Aprobado</option>
						<option value="rechazado">Rechazado</option>
					</select>
				</div>

				<div>
					<label className="block mb-1.5 font-medium text-gray-700">
						Nombre del supervisor<span className="text-red-500">*</span>
					</label>
					<input
						type="text"
						value={formData.supervisor || ""}
						onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
						placeholder="Nombre del supervisor"
						className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
						disabled={isSubmitting}
					/>
				</div>

				<div>
					<label className="block mb-1.5 font-medium text-gray-700">
						Comentarios<span className="text-red-500">*</span>
					</label>
					<textarea
						value={formData.comentarios || ""}
						onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
						placeholder="Escribe tus comentarios aquí"
						className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
						rows={4}
						disabled={isSubmitting}
					/>
				</div>

				<div>
					<label className="block mb-1.5 font-medium text-gray-700">
						Adjuntar archivo
					</label>
					<div className="flex items-center gap-4">
						<input
							type="file"
							id="fileUploadExtra"
							className="hidden"
							disabled={isSubmitting}
						/>
						<label
							htmlFor="fileUploadExtra"
							className={`flex items-center gap-2 px-4 py-2 border border-[#4178D4] rounded-lg bg-white text-[#4178D4] hover:bg-blue-50 cursor-pointer transition-colors ${
								isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
							}`}
						>
							<Upload className="w-5 h-5" />
							<span>Adjuntar archivo</span>
						</label>
						{uploadedFiles.length > 0 && (
							<span className="text-sm text-gray-600">
								{uploadedFiles[0].file.name}
							</span>
						)}
					</div>
				</div>
			</div>
		</div>
	);

	const [cumplimientoEstado, setCumplimientoEstado] = useState<Record<string, string>>({});

	const renderStep3Admin = () => {

		const etapas = [
			{ etapa: "Cotización", documentos: [{ key: "cotizacion", label: "Cotización" }] },
			{
				etapa: "Negociación",
				documentos: [
					{ key: "contrato_firmado", label: "Contrato firmado" },
					{ key: "rut", label: "RUT" },
					{ key: "camara_de_comercio", label: "Cámara de comercio" },
					{ key: "cedula_representante_legal", label: "Cédula representante legal" },
				],
			},
			{
				etapa: "Contabilización",
				documentos: [
					{ key: "anticipo", label: "Anticipo" },
					{ key: "soporte_de_pago", label: "Soporte de pago" },
					{ key: "factura", label: "Factura" },
				],
			},
			{
				etapa: "Inicio de obra",
				documentos: [
					{ key: "acta_de_inicio", label: "Acta de inicio" },
					{ key: "cronograma_de_trabajo", label: "Cronograma de trabajo" },
				],
			},
			{
				etapa: "Legalización",
				documentos: [
					{ key: "retie", label: "Retie" },
					{ key: "legalizacion", label: "Legalización" },
				],
			},
			{ etapa: "Cierre", documentos: [{ key: "acta_de_cierre", label: "Acta de cierre" }] },
		];

		const novedadesOptions = [
			"Ninguna",
			"Cambios solicitados por cliente",
			"Cambio por erro en calculos",
			"adicion de equipos",
		];

		const cumplimientoOptions = ["Pendiente", "En progreso", "Completado"];

		return (
			<div className="mt-6 flex flex-col gap-8">
				{renderClientInfo()}

				<div>
					<h3 className="text-lg font-semibold text-center mb-6">
						Desarrollo y Avance de Etapas del Proyecto
					</h3>
					<div className="overflow-x-auto">
						<table className="min-w-full border text-sm">
							<thead>
							<tr className="bg-[#4178D4] text-white">
								<th className="py-2 px-3 border border-gray-300">Etapas</th>
								<th className="py-2 px-3 border border-gray-300">Fecha programada</th>
								<th className="py-2 px-3 border border-gray-300">Fecha ejecutada</th>
								<th className="py-2 px-3 border border-gray-300">Documento soporte</th>
								<th className="py-2 px-3 border border-gray-300">Novedades</th>
								<th className="py-2 px-3 border border-gray-300">Cumplimiento</th>
							</tr>
							</thead>
							<tbody>
							{etapas.flatMap(({ etapa, documentos }) =>
								documentos.map((doc, docIndex) => {
									const matching = (formData.attachments || []).filter((a: { name: string; }) =>
										a.name.toLowerCase().includes(doc.key)
									);
									const isUploaded = matching.length > 0;

									return (
										<tr key={`${etapa}-${doc.key}`} className="border-b">
											{docIndex === 0 && (
												<td
													className="py-2 px-3 font-medium border-r border-gray-300"
													rowSpan={documentos.length}
												>
													{etapa}
												</td>
											)}
											<td className="py-2 px-3 text-center border-r border-gray-300">
												<input
													type="date"
													className="border border-gray-300 rounded px-2 py-1 text-xs"
													defaultValue={new Date().toISOString().split("T")[0]}
												/>
											</td>
											<td className="py-2 px-3 text-center border-r border-gray-300">
												{isUploaded
													? new Date(matching[0].date).toLocaleDateString()
													: "-"}
											</td>
											<td className="py-2 px-3 text-center border-r border-gray-300">
												<div className="flex flex-col gap-1 items-center">
													<p className="text-xs text-gray-500 mb-1">{doc.label}</p>
													{matching.map((file: any, idx: number) => (
														<div key={idx} className="flex items-center gap-2">
															<a
																href={`${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}${file.attach}`}
																target="_blank"
																rel="noopener noreferrer"
																className="inline-flex items-center gap-1 border border-[#4178D4] text-[#4178D4] rounded-full px-3 py-1 text-xs hover:bg-blue-50"
															>
																<Download className="w-4 h-4" />
																{file.name}
															</a>
															<button
																type="button"
																onClick={() => eliminarArchivo(file.id, file.name)}
																className="inline-flex items-center border border-red-500 text-red-500 rounded-full p-1 hover:bg-red-50"
																title="Eliminar"
															>
																<Trash2 className="w-4 h-4" />
															</button>
														</div>
													))}
													<input
														type="file"
														id={`upload-${doc.key}`}
														onChange={async (e) => {
															const file = e.target.files?.[0];
															if (!file || !project?.id) return;
															await uploadDocument(doc.key, file, project.id, doc.label);
															await fetchProjectDetail();
														}}
														className="hidden"
													/>
													<label
														htmlFor={`upload-${doc.key}`}
														className="inline-flex items-center gap-1 border border-[#4178D4] text-[#4178D4] rounded-full px-3 py-1 text-xs cursor-pointer hover:bg-blue-50"
													>
														<Upload className="w-4 h-4" />
														Subir documento
													</label>
												</div>
											</td>

											<td className="py-2 px-3 text-center border-r border-gray-300">
												<select
													className="border border-gray-300 rounded px-2 py-1 text-xs w-full"
													value={novedadesEstado[doc.key] || "Ninguna"}
													onChange={async (e) => {
														const newValue = e.target.value;
														setNovedadesEstado((prev) => ({
															...prev,
															[doc.key]: newValue,
														}));

														const matching = (formData.attachments || []).find((att: any) =>
															att.name.toLowerCase().includes(doc.key)
														);
														if (matching) {
															await api.patch(`/attach_proyect/update/${matching.id}/`, {
																news: newValue,
															});
															showNotification("success", "Novedad actualizada");
															await fetchProjectDetail();
														}
													}}
												>
													{novedadesOptions.map((opt) => (
														<option key={opt}>{opt}</option>
													))}
												</select>

											</td>
											<td className="py-2 px-3 text-center border-r border-gray-300">
												<select
													className="border border-gray-300 rounded px-2 py-1 text-xs w-full"
													value={cumplimientoEstado[doc.key] || (isUploaded ? "Completado" : "Pendiente")}
													onChange={async (e) => {
														const newValue = e.target.value;

														// Actualizar estado local siempre
														setCumplimientoEstado((prev) => ({
															...prev,
															[doc.key]: newValue,
														}));

														const matching = (formData.attachments || []).find((att: { name: string; }) =>
															att.name.toLowerCase().includes(doc.key)
														);

														if (matching) {
															// Si hay documento, actualizar en backend
															await api.patch(`/attach_proyect/update/${matching.id}/`, {
																fulfillment: newValue,
															});
															showNotification("success", "Cumplimiento actualizado");
															await fetchProjectDetail();
														} else {
															// Si no hay documento, solo notificar y mantener en local
															showNotification("success", "Cumplimiento actualizado localmente");
														}
													}}
												>
													{cumplimientoOptions.map((opt) => (
														<option key={opt}>{opt}</option>
													))}
												</select>

											</td>

										</tr>
									);
								})
							)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		);
	};



	const renderStep = () => {
		if (dataProject?.status === "process") {
			return renderStep3Admin();
		}
		if (currentStep === 1) return renderStep1();
		if (currentStep === 2) return renderStep2();
		if (currentStep === 3) return renderStep3();
	};

	if (!dataProject) {
		return (
			<div className="p-6 text-center text-gray-500">
				Cargando detalles del proyecto...
			</div>
		);
	}

	const renderForm = () => {
		if (showChat) {
			return (
				<div className="p-6">
					<Chat
						projectId={dataProject.sale_order?.id ?? 0}
						onBack={() => setShowChat(false)}
					/>
				</div>
			);
		}

		const progresoActual = calcularProgresoDocumentos(
			formData.attachments || [],
			formData.status,
			cumplimientoEstado
		);
		
		return(
			<form onSubmit={handleUpdateProject} className="p-6">
				{isSubmitting && (
					<div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 rounded-xl">
						<RefreshCw className="w-8 h-8 animate-spin text-[#4178D4]" />
					</div>
				)}

				{renderStep()}
				<div className="flex justify-between items-center mt-8 border-t pt-6 border-gray-100">
				{dataProject?.status === "process" ? (
					<button
						type="button"
						onClick={actualizarEstadoAFinalizado}
						className={`flex items-center justify-center gap-2 px-8 py-2.5 font-medium rounded-lg transition cursor-pointer
    ${progresoActual < 100 || isSubmitting
							? "bg-gray-300 text-gray-500 cursor-not-allowed"
							: "bg-[#4178D4] text-white hover:bg-[#34509F] hover:shadow-lg"
						}`}
						disabled={progresoActual < 100 || isSubmitting}
						title={progresoActual < 100 ? "Debes subir todos los documentos para actualizar" : "Actualizar proyecto"}
					>
						<CheckCircle className="w-5 h-5" />
						Actualizar proyecto
					</button>

				) : (
						<>
							{currentStep > 1 ? (
								<button
									type="button"
									onClick={handlePrevStep}
									className="flex items-center justify-center gap-2 px-6 py-2.5 border-2 border-[#4178D4] bg-white text-[#4178D4] font-medium rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
									disabled={isSubmitting}
								>
									<ChevronLeft className="w-5 h-5" />
									Anterior
								</button>
							) : (
								<button
									type="button"
									onClick={onCancel}
									className="flex items-center justify-center gap-2 px-6 py-2.5 border-2 border-gray-300 bg-white text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
									disabled={isSubmitting}
								>
									Volver a proyectos
								</button>
							)}
							<div>
								{currentStep < 3 ? (
									<button
										type="button"
										onClick={handleNextStep}
										className="flex items-center justify-center gap-2 px-8 py-2.5 bg-[#4178D4] text-white font-medium rounded-lg hover:bg-[#34509F] transition-colors cursor-pointer"
										disabled={isSubmitting}
									>
										Siguiente
										<ChevronRight className="w-5 h-5" />
									</button>
								) : (
									<button
										type="submit"
										className="flex items-center justify-center gap-2 px-8 py-2.5 bg-[#4178D4] text-white font-medium rounded-lg hover:bg-[#34509F] hover:shadow-lg transition cursor-pointer"
										disabled={isSubmitting}
									>
										<Pencil className="w-5 h-5" />
										Guardar cambios
									</button>
								)}
							</div>
						</>
					)}
				</div>
			</form>
		)
	}

	if (formData.status === "finaly") {
		return (
			<div className="bg-white rounded-xl shadow-md border border-gray-100">
				<div className="flex flex-col items-center justify-center p-12">
					<CheckCircle className="w-16 h-16 text-green-500 mb-4" />
					<h2 className="text-2xl font-bold text-green-700 mb-2">¡Felicidades!</h2>
					<p className="text-gray-700 text-center">
						Has finalizado el proyecto satisfactoriamente.
					</p>
					<button
						onClick={onCancel}
						className="mt-6 px-6 py-3 bg-[#4178D4] text-white rounded-lg hover:bg-[#34509F] transition-colors"
					>
						Volver a proyectos
					</button>
				</div>
				<div className="p-6">
					{renderStep3Admin()}
				</div>
			</div>
		);
	}


	return (
		<div className="bg-white rounded-xl shadow-md border border-gray-100">
			{/* Notifications container */}
			<div className="fixed top-4 right-4 z-50 space-y-2">
				{notifications.map((notification) => (
					<div
						key={notification.id}
						className={`p-4 rounded-lg shadow-lg flex items-start gap-2 ${
							notification.type === 'success'
								? 'bg-green-100 text-green-800'
								: 'bg-red-100 text-red-800'
						}`}
					>
						{notification.type === 'success' ? (
							<CheckCircle className="w-5 h-5 flex-shrink-0" />
						) : (
							<XCircle className="w-5 h-5 flex-shrink-0" />
						)}
						<span>{notification.message}</span>
					</div>
				))}
			</div>

			<div className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white rounded-t-xl z-40">
			<div>
					<h2 className="text-xl md:text-2xl font-bold text-[#34509F]">
						{formData.nombre}
					</h2>
					<p className="text-sm text-gray-500">
						ID: #{formData.id.toString().padStart(3, "0")}
					</p>
					<div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
							formData.etapa === "finaly" ? "bg-green-100 text-green-800" :
								formData.etapa === "process" ? "bg-blue-100 text-blue-800" :
									formData.etapa === "planification" ? "bg-yellow-100 text-yellow-800" :
										"bg-red-100 text-red-800"
						}`}>
              {getStatusIcon(formData.etapa)}
							{formData.etapa.charAt(0).toUpperCase() + formData.etapa.slice(1)}
            </span>
						{formData.progreso !== undefined && (
							<span className="text-xs text-gray-500">
    						Progreso: {formData.etapa === "finaly" ? 100 : project.progreso}%
							</span>
						)}
					</div>
				</div>
				<div className="flex gap-2">
					<button
						type="button"
						onClick={() => onDelete(formData.id)}
						className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
						title="Eliminar proyecto"
						disabled={isSubmitting}
					>
						<Trash2 className="w-5 h-5" />
					</button>
					<button
						onClick={onCancel}
						className="p-2 hover:bg-gray-100 rounded-full transition-colors"
						aria-label="Cerrar"
						type="button"
						disabled={isSubmitting}
					>
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M18 6L6 18M6 6L18 18"
								stroke="#64748b"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</button>
				</div>
			</div>
			{dataProject?.status !== "process" && renderStepIndicator()}
			{renderForm()}
		</div>
	);
};

export default AdminDetallesProyectoForm;