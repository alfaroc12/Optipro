from django.db import models
from proyect.models.proyect import M_proyect
from function.validators import only_lters_for_names
from django.core.validators import RegexValidator
from django.core.validators import FileExtensionValidator

class M_attach_proyect(models.Model):
    news_choices = [
        ('Ninguna', 'none'),

        ('Cambio solicitados por cliente', 'Changes requested by customer'),
        ('Cambio por error en cálculos', 'Change due to error in calculations'),
        ('Adición de equipos','adding equipment'),
    ]
    fulfillment_choices = [
        ('Completado', 'Completed'),
        ('En progreso', 'In progress'),
        ('Pendiente', 'Pending'),
    ]
    date = models.DateField(null=False, auto_now_add=True, editable=False)
    date_2 = models.DateField(null=True, blank=True, editable=True)
    attach = models.FileField(null=False, upload_to='media/', validators=[FileExtensionValidator(allowed_extensions=['pdf','doc', 'docx', 'xls', 'xlsx','png', 'jpg'])])
    news = models.CharField(max_length=30, choices=news_choices, default='Ninguna', null=False, blank=False)
    fulfillment = models.CharField(max_length=12, choices=fulfillment_choices, default='Pendiente', null=False, blank=False)
    name = models.CharField(max_length=80, null=False, blank=False, validators=[
            RegexValidator(
                regex=r'^[A-Za-z0-9 ._-]+$',
                message="The field only accepts letters, numbers, spaces, dots, underscores and hyphens."
            )
        ])
    size = models.CharField(max_length=50, null=False, blank=False)
    content_type = models.CharField(max_length=100, null=False, blank=False)
    proyect_id = models.ForeignKey(M_proyect, null=False, on_delete=models.CASCADE, db_column='proyect_id')

    class Meta:
        db_table = 'attach_proyect'

    def __str__(self):
        return f'{self.name} ({self.proyect_id})'