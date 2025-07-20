from rest_framework import serializers
from technical_visit.models.evidence_photo import M_evidence_photo
from django.conf import settings

class sz_evidence_photo(serializers.ModelSerializer):
    photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = M_evidence_photo
        fields = ['id', 'photo', 'photo_url', 'uploaded_at', 'order']
        read_only_fields = ['id', 'uploaded_at', 'photo_url']
    
    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            # Si no hay request, construye la URL absoluta manualmente
            # Asume que el backend corre en localhost:8000 si no hay request
            return f"http://127.0.0.1:8000{obj.photo.url}"
        return None
