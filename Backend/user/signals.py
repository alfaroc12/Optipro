from django.db.models.signals import post_save
from django.contrib.auth.models import User
from django.dispatch import receiver
from .models.profile import UserProfile

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """
    Crea un perfil de usuario automáticamente cuando se crea un usuario nuevo.
    """
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """
    Guarda el perfil del usuario cuando se guarda un usuario.
    """
    try:
        instance.profile.save()
    except UserProfile.DoesNotExist:
        # Si por alguna razón no existe el perfil, lo creamos
        UserProfile.objects.create(user=instance)
