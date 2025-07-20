from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from user.models.profile import UserProfile

class Command(BaseCommand):
    help = 'Crea perfiles de usuario para los usuarios existentes que no tienen perfil'

    def handle(self, *args, **options):
        usuarios_sin_perfil = 0
        for user in User.objects.all():
            try:
                # Intentar acceder al perfil
                profile = user.profile
                self.stdout.write(f"El usuario {user.username} ya tiene perfil")
            except UserProfile.DoesNotExist:
                # Si no existe el perfil, crearlo
                UserProfile.objects.create(user=user)
                usuarios_sin_perfil += 1
                self.stdout.write(f"Creado perfil para el usuario {user.username}")
        
        self.stdout.write(self.style.SUCCESS(f"Se crearon {usuarios_sin_perfil} perfiles de usuario"))
