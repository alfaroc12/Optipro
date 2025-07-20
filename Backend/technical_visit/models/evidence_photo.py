from django.db import models
from .technical_visit import M_technical_visit

class M_evidence_photo(models.Model):
    """Modelo para almacenar múltiples evidencias fotográficas de una visita técnica"""
    technical_visit = models.ForeignKey(
        M_technical_visit, 
        on_delete=models.CASCADE, 
        related_name='evidence_photos'
    )
    photo = models.ImageField(
        upload_to='technical_visits/evidence', 
        null=False, 
        blank=False
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    order = models.PositiveIntegerField(default=0, help_text="Orden de la imagen")
    
    class Meta:
        db_table = 'evidence_photo'
        ordering = ['order', 'uploaded_at']
    
    def __str__(self):
        return f'Evidence {self.technical_visit.code} - {self.id}'
