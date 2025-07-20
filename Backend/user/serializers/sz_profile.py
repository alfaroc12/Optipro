from rest_framework import serializers
from django.contrib.auth.models import User
from user.models.profile import UserProfile
from django.conf import settings

class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializador para mostrar y actualizar los datos del perfil de usuario
    """
    nombre = serializers.SerializerMethodField()
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', required=False)
    first_name = serializers.CharField(source='user.first_name', required=False, allow_blank=True)
    last_name = serializers.CharField(source='user.last_name', required=False, allow_blank=True)
    profile_image = serializers.SerializerMethodField()
    # Campo para recibir la imagen desde el frontend usando el nombre 'profile_image'
    profile_image_upload = serializers.ImageField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'nombre', 
                 'cargo', 'ciudad', 'telefono', 'cedula', 'categoria', 'profile_image', 'profile_image_upload']
        read_only_fields = ['id']
    
    def get_nombre(self, obj):
        """
        Devuelve el nombre completo del usuario
        """
        user = obj.user
        return f"{user.first_name} {user.last_name}" if user.first_name or user.last_name else user.username
    
    def get_profile_image(self, obj):
        """
        Devuelve la URL completa de la imagen de perfil si existe
        """
        if obj.profile_image and hasattr(obj.profile_image, 'url'):
            # Construir URL completa
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.profile_image.url)
            return obj.profile_image.url
        return None
        
    def update(self, instance, validated_data):
        """
        Actualiza los campos del usuario y su perfil
        """
        # Extraer datos del usuario
        user_data = validated_data.pop('user', {})
        
        # Actualizar campos básicos del usuario
        user = instance.user
        if 'username' in user_data:
            user.username = user_data['username']
        if 'email' in user_data:
            user.email = user_data['email']
        if 'first_name' in user_data:
            user.first_name = user_data['first_name']
        if 'last_name' in user_data:
            user.last_name = user_data['last_name']
        user.save()
        
        # Actualizar campos del perfil
        instance.cargo = validated_data.get('cargo', instance.cargo)
        instance.ciudad = validated_data.get('ciudad', instance.ciudad)
        instance.telefono = validated_data.get('telefono', instance.telefono)
        instance.cedula = validated_data.get('cedula', instance.cedula)
        instance.categoria = validated_data.get('categoria', instance.categoria)
        
    # Manejar la imagen de perfil si está presente
        profile_image = None
        if 'profile_image_upload' in validated_data and validated_data['profile_image_upload']:
            profile_image = validated_data['profile_image_upload']
        
        # También buscar la imagen directamente con el nombre 'profile_image'
        elif 'profile_image' in validated_data and validated_data['profile_image']:
            profile_image = validated_data['profile_image']
            
        # Asignar la imagen solo si hay una nueva
        if profile_image:
            # Si había una imagen anterior, borrarla para liberar espacio
            if instance.profile_image:
                instance.profile_image.delete(save=False)
            instance.profile_image = profile_image
        
        instance.save()
        return instance
