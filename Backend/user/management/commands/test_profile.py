from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from user.models.profile import UserProfile
import json
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Verifica el funcionamiento del perfil de usuario'

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, help='Usuario a comprobar')

    def handle(self, *args, **options):
        username = options.get('username')
        
        if username:
            # Comprobar un usuario específico
            try:
                user = User.objects.get(username=username)
                self._check_user_profile(user)
            except User.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"El usuario {username} no existe"))
        else:
            # Comprobar todos los usuarios
            users = User.objects.all()
            self.stdout.write(f"Comprobando {users.count()} usuarios...")
            
            for user in users:
                self._check_user_profile(user)
    
    def _check_user_profile(self, user):
        """Comprueba si un usuario tiene perfil y muestra sus datos"""
        self.stdout.write(f"\nVerificando perfil para: {user.username}")
        
        # Datos del usuario
        self.stdout.write("Datos del Usuario:")
        self.stdout.write(f"  ID: {user.id}")
        self.stdout.write(f"  Username: {user.username}")
        self.stdout.write(f"  Nombre: {user.first_name} {user.last_name}")
        self.stdout.write(f"  Email: {user.email}")
        self.stdout.write(f"  Es staff: {user.is_staff}")
        self.stdout.write(f"  Es superusuario: {user.is_superuser}")
        
        # Verificar si tiene perfil
        try:
            profile = user.profile
            self.stdout.write(self.style.SUCCESS("✓ El usuario tiene un perfil asociado"))
            
            # Mostrar datos del perfil
            self.stdout.write("\nDatos del Perfil:")
            self.stdout.write(f"  ID del perfil: {profile.id}")
            self.stdout.write(f"  Cargo: {profile.cargo}")
            self.stdout.write(f"  Ciudad: {profile.ciudad}")
            self.stdout.write(f"  Teléfono: {profile.telefono}")
            self.stdout.write(f"  Cédula: {profile.cedula}")
            self.stdout.write(f"  Categoría: {profile.categoria}")
            self.stdout.write(f"  Imagen de perfil: {'Sí' if profile.profile_image else 'No'}")
            
        except UserProfile.DoesNotExist:
            self.stdout.write(self.style.ERROR("✗ El usuario NO tiene un perfil asociado"))
            self.stdout.write("Creando perfil...")
            
            UserProfile.objects.create(user=user)
            self.stdout.write(self.style.SUCCESS("✓ Perfil creado correctamente"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"✗ Error al acceder al perfil: {str(e)}"))
