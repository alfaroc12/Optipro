from rest_framework import serializers
from chat.models.chat_message import ChatMessage
from chat.models.chat_attachment import ChatAttachment
from django.conf import settings

class ChatAttachmentSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatAttachment
        fields = ['id', 'file', 'file_name', 'upload_date']
        read_only_fields = ['id', 'upload_date']
    
    def get_file(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            # Si no hay request, construimos la URL manualmente
            return f"{settings.MEDIA_URL}{obj.file}"
        return None

class ChatMessageSerializer(serializers.ModelSerializer):
    attachments = ChatAttachmentSerializer(many=True, read_only=True)
    commitment = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatMessage
        fields = '__all__'  # Usar todos los campos del modelo automáticamente
        read_only_fields = ['id', 'timestamp']
    
    def get_commitment(self, obj):
        if obj.commitment_type == 'otros' and obj.commitment_description:
            return {
                'type': 'otros',
                'description': obj.commitment_description
            }
        return obj.commitment_type
        
    def create(self, validated_data):
        attachments_data = self.context.get('attachments', [])
        
        # Crear el mensaje
        message = ChatMessage.objects.create(**validated_data)
        
        # Crear los archivos adjuntos
        for attachment in attachments_data:
            ChatAttachment.objects.create(message=message, **attachment)
        
        return message
