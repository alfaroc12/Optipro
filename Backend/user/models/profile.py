from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    """
    Modelo extendido para almacenar información adicional del usuario.
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    cargo = models.CharField(max_length=100, blank=True, default="Usuario")
    ciudad = models.CharField(max_length=100, blank=True)
    telefono = models.CharField(max_length=20, blank=True)
    cedula = models.CharField(max_length=20, blank=True)
    categoria = models.CharField(max_length=50, blank=True, default="Estándar")
    profile_image = models.ImageField(upload_to='profile_images/', null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} Profile"
