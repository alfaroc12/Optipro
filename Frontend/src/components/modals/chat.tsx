import React, { useEffect, useRef, useState } from "react";
import { fetchChatMessages, sendMessage } from "@/services/chatService.ts";

// Extraer datos de usuario desde sessionStorage
const storedUser = sessionStorage.getItem("user");
const user = storedUser ? JSON.parse(storedUser) : { role: "admin", username: "admin" };

interface AdminChatProps {
	projectId: number;
	onBack: () => void;
}

const Chat: React.FC<AdminChatProps> = ({ projectId, onBack }) => {
	const [messages, setMessages] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [newMessage, setNewMessage] = useState("");
	const scrollRef = useRef<HTMLDivElement>(null);

	const fetchMessages = async () => {
		try {
			const response = await fetchChatMessages(projectId);
			const mensajes = Array.isArray(response) ? response : [];
			const ordenados = mensajes.sort(
				(a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
			);
			setMessages(ordenados);
		} catch (err) {
			console.error("Error al obtener mensajes:", err);
			setMessages([]);
		} finally {
			setLoading(false);
		}
	};

	const handleSend = async () => {
		const trimmed = newMessage.trim();
		if (!trimmed) return;

		const storedUser = sessionStorage.getItem("user");
		const user = storedUser ? JSON.parse(storedUser) : null;
		if (!user) {
			console.error("Usuario no autenticado.");
			return;
		}

		const messagePayload = {
			message: trimmed,
			userId: user.id,
			userName: user.username,
			negotiationProgress: "0%",
			// Opcionalmente podrías incluir:
			// parentMessageId: null,
			// commitment: null,
		};

		setSending(true);
		try {
			await sendMessage(messagePayload, projectId);
			setNewMessage("");
			await fetchMessages();
		} catch (err) {
			console.error("Error al enviar mensaje:", err);
		} finally {
			setSending(false);
		}
	};




	useEffect(() => {
		fetchMessages();
	}, [projectId]);

	useEffect(() => {
		const interval = setInterval(() => {
			fetchMessages();
		}, 5000);
		return () => clearInterval(interval);
	}, [projectId]);

	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [messages]);

	return (
		<div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm">
			<div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-4">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 bg-[#4178D4] text-white rounded-full flex items-center justify-center font-bold text-lg shadow">
						💬
					</div>
					<div>
						<h2 className="text-xl font-semibold text-gray-800 leading-tight">
							Chat del Proyecto
						</h2>
						<p className="text-sm text-gray-500">ID Proyecto #{projectId}</p>
					</div>
				</div>
				<button
					onClick={onBack}
					className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:-translate-y-0.5 hover:shadow-md transition-transform duration-200"
				>
					← Volver
				</button>
			</div>


			<div className="flex flex-col h-[500px] bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
			<div className="flex-1 p-4 overflow-y-auto text-sm text-gray-700" ref={scrollRef}>
					{loading ? (
						<p className="text-center text-gray-400 mt-32">Cargando mensajes...</p>
					) : messages.length > 0 ? (
						messages.map((msg) => {
							const isCurrentUser = msg.user_name === user.username;
							const content = !msg.message || msg.message === "undefined"
								? "[mensaje vacío]"
								: msg.message;

							return (
								<div key={msg.id} className="mb-4">
									<div className="w-full bg-gray-50 border border-gray-200 rounded-lg shadow-sm px-6 py-4">
									<div className="flex items-center gap-2 mb-2">
											{/* Avatar inicial */}
											<div className="w-8 h-8 bg-blue-600 text-white text-xs font-bold flex items-center justify-center rounded-full">
												{msg.user_name?.charAt(0).toUpperCase() || "U"}
											</div>
											<div className="flex-1">
												<p className="text-sm font-semibold text-gray-800">{msg.user_name}</p>
												<p className="text-xs text-gray-400">
													{new Date(msg.timestamp).toLocaleString("es-CO", {
														day: "2-digit",
														month: "2-digit",
														year: "numeric",
														hour: "2-digit",
														minute: "2-digit",
														second: "2-digit",
													})}
												</p>
											</div>
										</div>
										<div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-2 text-sm text-gray-800">
											{content}
										</div>
									</div>
								</div>
							);
						})
					) : (
						<div className="text-center text-gray-400 mt-32">
							<p className="text-lg font-medium">No hay mensajes aún</p>
							<p className="text-sm mt-1">Comienza la conversación escribiendo tu primer mensaje.</p>
						</div>
					)}
				</div>

				<div className="border-t border-gray-200 p-4 bg-white flex items-center gap-3">
				<input
						type="text"
						placeholder="Escribe tu mensaje aquí..."
						value={newMessage}
						onChange={(e) => setNewMessage(e.target.value)}
						className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#4178D4]"
						onKeyDown={(e) => {
							if (e.key === "Enter") handleSend();
						}}
					/>
					<button
						onClick={handleSend}
						disabled={sending}
						className="flex items-center gap-2 px-4 py-2 bg-[#4178D4] text-white rounded-lg text-sm hover:bg-[#34509F] transition disabled:opacity-50"
					>
						<span>Enviar</span>
					</button>
				</div>
			</div>
		</div>
	);
};

export default Chat;
