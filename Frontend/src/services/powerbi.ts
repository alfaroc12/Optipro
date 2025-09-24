import api from "@/services/api.ts";

export const sendProgressToPowerBI = async (
	ProjectId: any,
	progress: any
) => {
	try {
		const response = await api.post(`powerbi/UpdateProjectProgress/${ProjectId}/`, {
			progress_percentage: progress,
		});
		return response.data;
	} catch (error: any) {
		console.error("Error al enviar progreso a Power BI:", error);
		throw error;
	}
}