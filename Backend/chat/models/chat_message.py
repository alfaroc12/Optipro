from django.db import models
from sale_order.models.sale_order import M_sale_order
from django.contrib.auth.models import User

class ChatMessage(models.Model):
    cotizacion = models.ForeignKey(M_sale_order, on_delete=models.CASCADE, related_name='messages')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='messages')
    user_name = models.CharField(max_length=255)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Campo para mensajes jerarquicos (respuestas)
    parent_message = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='replies')
    
    # Campos para compromisos
    COMMITMENT_CHOICES = [
        ('Llamar coordinar visita', 'Llamar coordinar visita'),
        ('Retomar negociacion', 'Retomar negociacion'),
        ('Visitar nuevamente', 'Visitar nuevamente'),
        ('Confirmar cita', 'Confirmar cita'),
        ('Llamada de seguimiento', 'Llamada de seguimiento'),
        ('otros', 'Otros'),
    ]
    commitment_type = models.CharField(max_length=100, choices=COMMITMENT_CHOICES, null=True, blank=True)
    commitment_description = models.CharField(max_length=255, null=True, blank=True)
    
    # Campo para progreso de negociación
    NEGOTIATION_PROGRESS_CHOICES = [
        ('0%', '0%'),
        ('10%', '10%'),
        ('20%', '20%'),
        ('30%', '30%'),
        ('40%', '40%'),
        ('50%', '50%'),
        ('60%', '60%'),
        ('70%', '70%'),
        ('80%', '80%'),
        ('90%', '90%'),
        ('100%', '100%'),
    ]
    negotiation_progress = models.CharField(max_length=10, choices=NEGOTIATION_PROGRESS_CHOICES, default='0%')
    
    class Meta:
        ordering = ['timestamp']
        
    def __str__(self):
        return f"{self.user_name}: {self.message[:50]}"
