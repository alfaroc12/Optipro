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
} from "lucide-react";
import { Gauge } from "@mui/x-charts";
import api from "@/services/api";
import Chat from "@/components/modals/chat";
import {LinearProgress} from "@mui/material";
import { Project } from "@/types/project";

interface DetallesProyectoFormProps {
	project: Project;
	onSubmit: (data: Project) => void;
	onCancel: () => void;
	onDelete?: (id: number) => void;
	showStatus?: boolean;
}

interface Notification {
	id: string;
	type: 'success' | 'error';
	message: string;
}

const DetallesProyectoForm: React.FC<DetallesProyectoFormProps> = ({
																																		 project,
																																		 onSubmit,
																																		 onCancel,
																																		 onDelete,
																																	 }) => {
	const [formData, setFormData] = useState<Project>(project);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [, setUploadingFile] = useState<string | null>(null);
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [currentStep, setCurrentStep] = useState<number>(1);
	const [cumplimientoEstado, setCumplimientoEstado] = useState<Record<string, string>>({})
	const [, setDataProject] = useState<Project | null>(null);;

	const [novedadesEstado, setNovedadesEstado] = useState<Record<string, string>>({});


	const [showChat, setShowChat] = useState(false);


	const userRole = (() => {
		try {
			const storedUser = sessionStorage.getItem("user");
			if (storedUser) {
				const parsed = JSON.parse(storedUser);
				return parsed.role || null;
			}
		} catch (error) {
			console.error("Error leyendo el usuario desde sessionStorage", error);
		}
		return null;
	})();


	// Función para mostrar notificaciones
	const showNotification = (type: 'success' | 'error', message: string) => {
		const id = Math.random().toString(36).substring(2, 9);
		setNotifications(prev => [...prev, { id, type, message }]);

		// Eliminar la notificación después de 5 segundos
		setTimeout(() => {
			setNotifications(prev => prev.filter(n => n.id !== id));
		}, 5000);
	};
	const calcularProgresoDocumentos = (
		attachments: Array<{ name: string; attach: string }> = [],
		status: string = "planification"
	): number => {
		const progressMapByStatus: Record<string, Record<string, number>> = {
			process: {
				anticipo: 5,
				listado_de_materiales: 10,
				acta_de_compra: 10,
				acta_de_inicio: 10,
				legalizacion: 20,
				retie: 10,
				acta_de_avance_de_obra_1: 10,
				acta_de_avance_de_obra_2: 10,
				acta_de_entrega_final: 10,
				factura: 5,
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

			const porcentaje = Math.floor(100 / requiredDocs.length); // 16
			const progresoBase = encontrados * porcentaje;
			const exceso = encontrados === requiredDocs.length ? 100 - progresoBase : 0;

			return progresoBase + exceso; // asegura que llegue a 100 exacto
		}

		const progressMap = progressMapByStatus[status] || {};
		return Object.entries(progressMap).reduce((total, [docKey, porcentaje]) => {
			const regex = new RegExp(docKey, "i");
			return attachments.some((att) => regex.test(att.name || att.attach))
				? total + porcentaje
				: total;
		}, 0);
	};

	useEffect(() => {
		if (formData.status === "process") {
			const progreso = calcularProgresoPorCumplimiento(formData.attachments, cumplimientoEstado);
			setFormData((prev: any) => ({ ...prev, progreso }));
		} else {
			const progreso = formData.status === "finaly" ? 100 : calcularProgresoDocumentos(
				formData.attachments || [],
				formData.status
			);
			setFormData((prev: any) => ({ ...prev, progreso }));
		}
	}, [formData.attachments, cumplimientoEstado, formData.status]);

	useEffect(() => {
		if (formData.status !== "process") return;

		const cumplimiento: Record<string, string> = {};
		const novedades: Record<string, string> = {};

		Object.keys(progressMapByStatus.process).forEach((docKey) => {
			const regex = new RegExp(docKey, "i");
			const matching = (formData.attachments || []).find((att) =>
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
	}, [formData.attachments, formData.status]);

	const formatDateForInput = (dateString: string | undefined): string => {
		if (!dateString) return '';
		return dateString.split('T')[0];
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


	const fetchProjectData = async () => {
		try {
			if (!project?.id) return;

			const detailResponse = await api.get(`/proyect/retrieve/${project.id}/`);
			const projectData = detailResponse.data;
			console.log(projectData)
			setFormData(projectData);

		} catch (error) {
			console.error("Error fetching project data:", error);
			showNotification('error', 'Error al cargar los datos del proyecto');
		}
	};



	useEffect(() => {
		fetchProjectData();
	}, [project?.id]);

	const uploadDocument = async (
		fieldKey: string,
		file: File,
		projectId: number,
		documentName: string
	): Promise<string | null> => {
		setUploadingFile(fieldKey);

		try {
			const normalizedName = normalizeFileName(documentName);
			const fileExtension = file.name.split(".").pop();

			const existingFiles = formData?.attachments?.filter(att =>
				att.name.toLowerCase().includes(normalizedName)
			) || [];

			const consecutive = existingFiles.length + 1;
			const newFileName = `${normalizedName}_${consecutive}.${fileExtension}`;

			const formPayload = new FormData();
			formPayload.append("attach", file, newFileName);
			formPayload.append("proyect_id", projectId.toString());
			formPayload.append("comment", documentName); // Importante para el backend

			const response = await api.post("/attach_proyect/create/", formPayload, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			if (response.status !== 201) {
				throw new Error(`Error en la respuesta del servidor: ${response.status}`);
			}

			showNotification("success", `Documento ${documentName} subido correctamente`);
			return response.data.file || response.data.url;
		} catch (error: any) {
			console.error(`Error subiendo ${fieldKey}:`, error);
			let errorMessage = `Error al subir el documento ${documentName}`;

			if (error.response) {
				errorMessage += `: ${error.response.data.detail || error.response.statusText}`;
			}

			showNotification("error", errorMessage);
			return null;
		} finally {
			setUploadingFile(null);
			fetchProjectData();
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
								href={`${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}${file.attach}`}
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


	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
	) => {
		const { name, value, type } = e.target as HTMLInputElement;

		if (type === "number") {
			setFormData((prev) => ({
				...prev,
				[name]: value === "" ? null : Number(value),
			}));
		} else if (name.startsWith("cliente.")) {
			const field = name.split(".")[1];
			setFormData((prev) => ({
				...prev,
				cliente: {
					...prev.cliente!,
					[field]: value
				}
			}));
		} else {
			setFormData((prev) => ({
				...prev,
				[name]: value,
			}));
		}
	};

	const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({...prev, [name]: value}));
	};

	const handleNextStep = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		if (currentStep < 2) {
			setCurrentStep((s) => s + 1);
		}
	};


	const handlePrevStep = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.preventDefault();
		if (currentStep > 1) setCurrentStep((s) => s - 1);
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			await onSubmit(formData);
			showNotification('success', 'Proyecto actualizado correctamente');
		} catch (error: any) {
			console.error('Error al actualizar el proyecto:', error);
			let errorMessage = 'Error al actualizar el proyecto';

			if (error.response) {
				errorMessage += `: ${error.response.data.detail || error.response.statusText}`;
			}

			showNotification('error', errorMessage);
		} finally {
			setIsSubmitting(false);
		}
	};

	const getStatusIcon = (etapa: "Planificación" | "Ejecución" | "Finalizado" | "Suspendido" | undefined) => {
		switch (etapa) {
			case "Finalizado":
				return <CheckCircle className="w-4 h-4 text-green-500" />;
			case "Ejecución":
				return <RefreshCw className="w-4 h-4 text-blue-500" />;
			case "Planificación":
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

		const formatMoney = (v?: string | number) =>
			v ? `$${Number(v).toLocaleString("es-CO", { minimumFractionDigits: 2 })}` : "No especificado";

		return (
			<div>
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
								{formData.sale_order?.name || "No especificado"}
							</p>
						</div>
						<div>
							<label className="block mb-1 text-sm font-medium text-gray-600">NIT</label>
							<p className="text-gray-800">{formData.sale_order?.nitCC || "No especificado"}</p>
						</div>
						<div>
							<label className="block mb-1 text-sm font-medium text-gray-600">Tipo de Instalación</label>
							<p className="text-gray-800">{formData.sale_order?.Type_installation || "No especificado"}</p>
						</div>
						<div>
							<label className="block mb-1 text-sm font-medium text-gray-600">Teléfono</label>
							<p className="text-gray-800">{formData.sale_order?.phone || "No especificado"}</p>
						</div>
						<div>
							<label className="block mb-1 text-sm font-medium text-gray-600">Valor total</label>
							<p className="text-gray-800">
								{formatMoney(formData.sale_order?.total_quotation)}
							</p>
						</div>
						<div>
							<label className="block mb-1 text-sm font-medium text-gray-600">Dirección</label>
							<p className="text-gray-800">{formData.sale_order?.addres || "No especificado"}</p>
						</div>
						<div>
							<label className="block mb-1 text-sm font-medium text-gray-600">Tipo de Proyecto</label>
							<p className="text-gray-800 capitalize">{formData.sale_order?.system_type || "No especificado"}</p>
						</div>
						<div>
							<label className="block mb-1 text-sm font-medium text-gray-600">Ciudad</label>
							<p className="text-gray-800">{formData.sale_order?.city}</p>
						</div>
					</div>
					<div className="flex justify-center items-center mt-6 mb-2">
						<div className="rounded-lg px-6 py-4">
							<label className="block mb-1 text-sm font-medium text-gray-600 text-center">Cotizador</label>
							<p
								className="text-[#34509F] text-center font-semibold">{formData.sale_order?.cotizador || "No especificado"}</p>
						</div>
					</div>
					<div className="mt-6">
						<h4 className="font-semibold text-[#34509F] mb-2 text-center">Estado de Aprobación</h4>
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
										sx={{height: 10, borderRadius: 5}}
									/>
								</div>
							) : (
								<Gauge
									value={formData.progreso || 0}
									startAngle={-110}
									endAngle={110}
									innerRadius="80%"
									outerRadius="100%"
									width={280}
									height={180}
									text={({value}) => `${value}%`}
								/>
							)}

						</div>
					</div>
				</div>
			</div>
		)
	};

	// ---------------------------------------------------------------------------
//  USER – Paso 1  (Información básica + Documentos legales)
// ---------------------------------------------------------------------------
	const renderStep1 = () => (
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

			{renderClientInfo()}

			{/* nombre + ciudad */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
				<div>
					<label className="block mb-1.5 font-medium text-gray-700">Nombre del proyecto</label>
					<input
						name="nombre"
						type="text"
						value={formData.sale_order?.name || formData.name || ""}
						onChange={handleChange}
						placeholder="Nombre del proyecto"
						className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
						disabled={isSubmitting}
					/>
				</div>
				<div>
					<label className="block mb-1.5 font-medium text-gray-700">Ciudad</label>
					<input
						name="ciudad"
						type="text"
						value={formData.ciudad || formData.sale_order?.city || ""}
						onChange={handleChange}
						placeholder="Ciudad del proyecto"
						className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
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
							value={formatDateForInput(formData.fechaEmision || formData.date)}
							onChange={handleDateChange}
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
						value={formData.potencia || formData.sale_order?.power_required || ""}
						onChange={handleChange}
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
						value={formData.valor || formData.sale_order?.total_quotation || ""}
						onChange={handleChange}
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
					onChange={handleChange}
					placeholder="Descripción detallada del proyecto"
					className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
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
							value={formatDateForInput(formData.sale_order?.date_start) || formatDateForInput(formData.date_start)}
							onChange={handleDateChange}
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
							value={formatDateForInput(formData.fechaFinalizacion || formData.date_end)}
							onChange={handleDateChange}
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
					{renderCompactUploadField("aceptacionOferta","Aceptación de oferta")}
					{renderCompactUploadField("rut","RUT",)}
					{renderCompactUploadField("camaraComercio","Cámara de Comercio")}
					{renderCompactUploadField("cedulaRepresentante","Copia cédula representante legal")}
				</div>
			</div>
		</div>
	);


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

			<div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
				{renderCompactUploadField("numeroContrato", "Número de contrato")}
				{renderCompactUploadField("polizas", "Pólizas")}
			</div>

			<div className="mb-6">
				<label className="block mb-1.5 font-medium text-gray-700">
					Notas del contrato
				</label>
				<textarea
					name="descripcion"
					value={formData.sale_order?.description_2 || ""}
					onChange={e =>
						setFormData((prev: any) => ({
							...prev,
							sale_order: {
								...prev.sale_order,
								description_2: e.target.value,
							},
						}))
					}
					placeholder="Notas relevantes sobre el contrato"
					className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg"
					rows={4}
					disabled={isSubmitting}
				/>
			</div>
		</div>
	);

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

	const calcularProgresoPorCumplimiento = (
		attachments: Array<{ name: string; attach: string }> = [],
		cumplimiento: Record<string, string> = {}
	): number => {
		const progressMap = progressMapByStatus["process"] || {};

		return Object.entries(progressMap).reduce((total, [docKey, porcentaje]) => {
			const regex = new RegExp(docKey, "i");
			const tieneArchivo = attachments.some((att) => regex.test(att.name || att.attach));
			const estadoCumplimiento = cumplimiento?.[docKey];

			if (tieneArchivo && estadoCumplimiento === "Completado") {
				return total + porcentaje;
			}
			return total;
		}, 0);
	};

	const eliminarArchivo = async (idArchivo: number, nombreDoc: string) => {
		try {
			await api.delete(`/attach_proyect/delete/${idArchivo}/`);
			showNotification("success", `Archivo "${nombreDoc}" eliminado correctamente.`);
			await fetchProjectData();
		} catch (error) {
			console.error("Error al eliminar el archivo:", error);
			showNotification("error", "No se pudo eliminar el archivo. Intenta nuevamente.");
		}
	};



	const renderStep3 = () => {
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
			"Cambio solicitados por cliente",
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
									const matching = (formData.attachments || []).filter((a) =>
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
													? new Date(matching[0].date ?? "").toLocaleDateString()
													: "-"}
											</td>
											<td className="py-2 px-3 text-center border-r border-gray-300">
												<div className="flex flex-col gap-1 items-center">
													<p className="text-xs text-gray-500 mb-1">{doc.label}</p>
													{matching.map((file, idx) => (
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
																onClick={() => file.id !== undefined && eliminarArchivo(file.id, file.name)}
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
															await fetchProjectData();
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
													className={`border border-gray-300 rounded px-2 py-1 text-xs w-full ${
														userRole !== "admin" ? "bg-gray-100" : ""
													}`}
													value={novedadesEstado[doc.key] || "Ninguna"}
													onChange={async (e) => {
														const newValue = e.target.value;

														// Actualizar en el estado local
														setNovedadesEstado((prev) => ({
															...prev,
															[doc.key]: newValue,
														}));

														// Si hay documento subido, actualizar en backend
														const matching = (formData.attachments || []).find((att) =>
															att.name.toLowerCase().includes(doc.key)
														);
														if (matching) {
															try {
																await api.patch(`/attach_proyect/update/${matching.id}/`, {
																	news: newValue,
																});
																showNotification("success", "Novedad actualizada");
																await fetchProjectData();
															} catch (error) {
																console.error("Error actualizando novedad:", error);
																showNotification("error", "Error al actualizar novedad");
															}
														}
													}}
												>
													{novedadesOptions.map((opt) => (
														<option key={opt}>{opt}</option>
													))}
												</select>
											</td>
											<td className="py-2 px-3 text-center">
												<select
													className={`border border-gray-300 rounded px-2 py-1 text-xs w-full ${
														userRole !== "admin" ? "bg-gray-100 cursor-not-allowed" : ""
													}`}
													value={cumplimientoEstado[doc.key] || (isUploaded ? "Completado" : "Pendiente")}
													disabled={userRole !== "admin"}
													onChange={(e) => {
														setCumplimientoEstado((prev) => ({
															...prev,
															[doc.key]: e.target.value,
														}));
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
	}
	const renderStep = () => {
		// Si el proyecto está en estado "process", forzar solo la vista del paso 3
		if (formData?.status === "process") {
			if (currentStep !== 3) setCurrentStep(3);
			return renderStep3();
		}

		// Renderización estándar por pasos
		if (currentStep === 1) return renderStep1();
		if (currentStep === 2) return renderStep2();
		if (currentStep === 3) return renderStep3();
	};

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
					{renderStep3()}
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
							formData.status === "finaly" ? "bg-green-100 text-green-800" :
								formData.status === "process" ? "bg-blue-100 text-blue-800" :
									formData.status === "planification" ? "bg-yellow-100 text-yellow-800" :
										"bg-gray-100 text-gray-800"
						}`}>
              {getStatusIcon(formData.status)}
							{formData.status}
            </span>
						{formData.progreso !== undefined && (
							<span className="text-xs text-gray-500">
								Progreso: {formData.status === "finaly" ? 100 : formData.progreso}%
  						</span>
						)}
					</div>
				</div>
				<div className="flex gap-2">
					{onDelete && (
						<button
							type="button"
							onClick={() => onDelete(formData.id)}
							className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
							title="Eliminar proyecto"
							disabled={isSubmitting}
						>
							<Trash2 className="w-5 h-5" />
						</button>
					)}
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
			{renderStepIndicator()}
			{showChat ? (
				<Chat
					projectId={formData.sale_order?.id || formData.id}
					onBack={() => setShowChat(false)}
				/>
			) : (
				<form onSubmit={handleSubmit} className="p-6">
					{isSubmitting && (
						<div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50 rounded-xl">
							<RefreshCw className="w-8 h-8 animate-spin text-[#4178D4]" />
						</div>
					)}

					{renderStep()}
					<div className="flex justify-between mt-8 border-t pt-6 border-gray-100">
						{currentStep > 1 && userRole === "user" ? (
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

						<div className="flex gap-4">
							{currentStep < 2 && (
								<button
									type="button"
									onClick={handleNextStep}
									className="flex items-center justify-center gap-2 px-8 py-2.5 bg-[#4178D4] text-white font-medium rounded-lg hover:bg-[#34509F] transition-colors cursor-pointer"
									disabled={isSubmitting}
								>
									Siguiente
									<ChevronRight className="w-5 h-5" />
								</button>
							)}

							{/* Guardar en step 2 */}
							{currentStep === 2 && (
								<button
									type="submit"
									className="flex items-center justify-center gap-2 px-8 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
									disabled={isSubmitting}
								>
									<CheckCircle className="w-5 h-5" />
									Guardar cambios
								</button>
							)}
						</div>
					</div>

				</form>
			)}

		</div>
	);
};

export default DetallesProyectoForm;