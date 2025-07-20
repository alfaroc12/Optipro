from rest_framework import serializers
from django.contrib.auth.models import User
from user.models.user import M_user
from user.models.profile import UserProfile

class sz_user(serializers.ModelSerializer):
    class Meta:
        model = M_user
        fields = [
            'id',
            'first_name',
            'last_name',
        ]

class UserListSerializer(serializers.ModelSerializer):
    """
    Serializador para mostrar y gestionar usuarios
    """
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    profile = serializers.SerializerMethodField()
    date_joined = serializers.DateTimeField(read_only=True)
    is_active = serializers.BooleanField(default=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 
                 'profile', 'date_joined', 'is_active', 'password']
        extra_kwargs = {
            'password': {'write_only': True},
        }
    
    def get_profile(self, obj):
        try:
            profile = UserProfile.objects.get(user=obj)
            return {
                'ciudad': profile.ciudad,
                'telefono': profile.telefono,                'cargo': profile.cargo,
                'cedula': profile.cedula,
                'categoria': profile.categoria,
                'profile_image_url': profile.profile_image.url if profile.profile_image else None,
            }
        except UserProfile.DoesNotExist:
            return {}
    
    def create(self, validated_data):
        profile_data = validated_data.pop('profile', {})
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            
        # Comprobar si se ha proporcionado una categoría
        categoria = profile_data.get('categoria', '').lower() if 'categoria' in profile_data else ''
          # Si es administrador, establecerlo como staff y superusuario
        if categoria == 'administrador':
            user.is_staff = True
            user.is_superuser = True
            
        user.save()
        
        # Crear perfil
        if not hasattr(user, 'profile'):
            UserProfile.objects.create(user=user, **profile_data)
        return user
    
    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        
        # Actualizar usuario
        for attr, value in validated_data.items():
            if attr == 'password':
                instance.set_password(value)
            else:
                setattr(instance, attr, value)
        
        # Si se está actualizando el perfil, tenemos que revisar si cambia la categoría
        if hasattr(instance, 'profile') and profile_data:
            categoria = profile_data.get('categoria', '').lower() if 'categoria' in profile_data else instance.profile.categoria.lower()
            
            # Si es administrador, establecerlo como staff y superusuario
            if categoria == 'administrador':
                instance.is_staff = True
                instance.is_superuser = True
            # Si ya no es administrador pero era superusuario, quitarle los permisos
            elif instance.is_superuser:
                # Solo si es supervisor o usuario normal, no administrador
                instance.is_superuser = False
                # Si es supervisor, mantener como staff
                if categoria != 'supervisor':
                    instance.is_staff = False
        
        instance.save()
        
        # Actualizar perfil
        if hasattr(instance, 'profile') and profile_data:
            profile = instance.profile
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
            
        return instance