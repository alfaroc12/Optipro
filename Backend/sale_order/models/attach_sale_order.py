from django.db import models
from .sale_order import M_sale_order
from django.contrib.auth.models import User

class M_attach_sale_order(models.Model):
    date = models.DateField(null=False, auto_now_add=True, editable=False)
    attach = models.FileField(null=False, upload_to='media/')
    name = models.CharField(max_length=60, null=False, blank=False)
    size = models.CharField(max_length=50, null=False, blank=False)
    content_type = models.CharField(max_length=100, null=False, blank=False)  # Aumentado de 50 a 100 caracteres
    is_calculation_sheet = models.BooleanField(default=False)  # Nuevo campo para identificar la hoja de cálculo
    sale_order_id = models.ForeignKey(M_sale_order, null=False, on_delete=models.CASCADE, db_column='sale_order_id')
    # Campo opcional para el usuario que subió el archivo (no requiere migración si es nuevo y opcional)
    uploaded_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='uploaded_attachments')

    class Meta:
        db_table = 'attach_sale_order'
    
    def __str__(self):
        return f'{self.name} - {self.sale_order_id.code}'