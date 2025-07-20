from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny
from sale_order.models.sale_order import M_sale_order
from sale_order.models.attach_sale_order import M_attach_sale_order
import logging
import traceback

# Configurar logging
logger = logging.getLogger(__name__)

class SimpleFileUploadView(APIView):
    """
    Vista simplificada para subir archivos sin restricciones de tipo
    """
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request, format=None):
        try:
            logger.info(f"Datos recibidos para subir archivo: {request.data}")
            
            # Obtener el archivo adjunto
            file = request.FILES.get('attach')
            if not file:
                return JsonResponse({"error": "No se proporcionó un archivo"}, status=400)
                
            # Obtener el ID de la orden de venta
            sale_order_id = request.data.get('sale_order_id')
            if not sale_order_id:
                return JsonResponse({"error": "No se proporcionó el ID de la orden de venta"}, status=400)
            
            # Verificar que la orden de venta existe
            try:
                sale_order = M_sale_order.objects.get(id=sale_order_id)
            except M_sale_order.DoesNotExist:
                return JsonResponse({"error": "La orden de venta no existe"}, status=404)
            
            # Registrar información del archivo
            logger.info(f"Archivo a guardar: nombre={file.name}, tipo={file.content_type}, tamaño={file.size}")
            
            # Crear el adjunto
            attachment = M_attach_sale_order(
                attach=file,
                name=file.name,
                size=str(file.size),
                content_type=file.content_type,
                sale_order_id=sale_order
            )
            
            # Si el usuario está autenticado, asignarle el archivo
            if request.user and request.user.is_authenticated:
                attachment.uploaded_by = request.user
                logger.info(f"Archivo asignado al usuario: {request.user.username}")
            
            # Guardar el adjunto
            attachment.save()
            
            # Devolver la respuesta
            response_data = {
                "id": attachment.id,
                "date": attachment.date,
                "name": attachment.name,
                "size": attachment.size,
                "content_type": attachment.content_type,
                "attach": attachment.attach.url if attachment.attach else None,
                "sale_order_id": sale_order.id,
                "message": "Archivo subido correctamente"
            }
            
            return JsonResponse(response_data, status=201)
            
        except Exception as e:
            logger.error(f"Error al subir archivo: {str(e)}")
            logger.error(traceback.format_exc())
            return JsonResponse({"error": str(e)}, status=500)
