from django.db import models
from django.contrib.auth.models import User

class m_notification(models.Model):
    NOTIFICATION_TYPES = (
        ('new_sale_order', 'Nueva Orden de Venta'),
        ('state_change', 'Cambio de Estado'),
        ('new_project', 'Nuevo Proyecto'),
        ('new_chat', 'Nuevo Mensaje en Chat'),
    )

    type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    message = models.CharField(max_length=255)
    data = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        ordering = ['-created_at']