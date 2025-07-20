from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from notifications.utils.notifications_ut import notify_new_message

from chat.models.chat_message import ChatMessage
from chat.models.chat_attachment import ChatAttachment
from chat.serializers.chat_serializers import ChatMessageSerializer, ChatAttachmentSerializer

class ChatMessageListCreate(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, cotizacion_id):
        """Obtener todos los mensajes de una cotización"""
        messages = ChatMessage.objects.filter(cotizacion_id=cotizacion_id)
        serializer = ChatMessageSerializer(messages, many=True, context={'request': request})
        return Response(serializer.data)
    
    def post(self, request):
        """Crear un nuevo mensaje"""
        # Extraer datos
        cotizacion_id = request.data.get('cotizacion_id')
        message_text = request.data.get('message')
        parent_message_id = request.data.get('parent_message_id')
        commitment_type = request.data.get('commitment_type')
        commitment_description = request.data.get('commitment_description')
        negotiation_progress = request.data.get('negotiation_progress', '0%')
        user_id = request.data.get('user_id')  # Obtener el user_id de los datos enviados
        
        # Depuración para ver exactamente qué datos se están recibiendo
        print("Datos recibidos:", request.data)
        
        # Validar datos requeridos
        if not cotizacion_id or not message_text:
            return Response({
                'error': 'Se requieren cotizacion_id y message'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Importar el modelo M_sale_order para obtener la cotización
        from sale_order.models.sale_order import M_sale_order
        
        # Obtener el objeto de cotización a partir del ID
        try:
            cotizacion = M_sale_order.objects.get(pk=cotizacion_id)
        except M_sale_order.DoesNotExist:
            return Response({
                'error': f'No se encontró una cotización con el ID {cotizacion_id}'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Obtener el mensaje padre si se proporcionó un ID
        parent_message = None
        if parent_message_id:
            try:
                parent_message = ChatMessage.objects.get(pk=parent_message_id)
            except ChatMessage.DoesNotExist:
                # Si no existe, simplemente dejar como None
                pass
        
        # Obtener datos del usuario
        user = None
        user_name = request.data.get('user_name', 'Usuario')
        
        # Si hay un usuario autenticado, usarlo
        if request.user.is_authenticated:
            user = request.user
            user_name = user.username
        # Si se proporciona un ID de usuario específico, intentar usarlo
        elif user_id:
            try:
                user = User.objects.get(pk=user_id)
                if not user_name or user_name == 'Usuario':
                    user_name = user.username
            except User.DoesNotExist:
                # Si no existe el usuario, dejamos user como None
                pass
        
        # Preparar datos para el serializador
        message_data = {
            'cotizacion': cotizacion.id,
            'user': user.id if user else None,
            'user_name': user_name,
            'message': message_text,
            'parent_message': parent_message.id if parent_message else None,
            'commitment_type': commitment_type,
            'commitment_description': commitment_description if commitment_type == 'otros' else None,
            'negotiation_progress': negotiation_progress
        }
        
        # Depurar para ver qué datos de usuario se están enviando
        print("USER ID:", message_data['user'])
        print("USER NAME:", message_data['user_name'])
        
        # Manejar archivos adjuntos
        attachments_data = []
        if 'attachments' in request.FILES:
            files = request.FILES.getlist('attachments')
            for file in files:
                attachment_data = {
                    'file': file,
                    'file_name': file.name
                }
                attachments_data.append(attachment_data)
          # Crear mensaje
        serializer = ChatMessageSerializer(
            data=message_data,
            context={'attachments': attachments_data, 'request': request}
        )
        
        if serializer.is_valid():
            try:
                message = serializer.save()
                
                # Enviar notificación, manejando el caso en que user pueda ser None
                try:
                    notify_new_message(
                        chat=cotizacion,        
                        message=message,        
                        sender=user            
                    )
                except Exception as notification_error:
                    # Solo registrar el error de notificación pero continuar
                    print(f"Error al enviar notificación: {str(notification_error)}")
                    
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                # Capturar cualquier error durante el guardado
                print(f"Error al guardar mensaje: {str(e)}")
                return Response(
                    {"error": f"Error al guardar el mensaje: {str(e)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            # Mostrar errores detallados de validación
            print("Errores de validación:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
