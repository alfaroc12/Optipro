from django.db import models
from sale_order.models.sale_order import M_sale_order
from django.contrib.auth.models import User
from function.validators import only_numbers, only_letters_numbers_symbols

class M_proyect(models.Model):
    status_choices = [
        ('process', 'En proceso'),
        ('planification', 'Planificación'),
        ('finaly', 'Finalizado'),
    ]
    p_name = models.CharField(max_length=100, null=False, blank=False, validators=[only_letters_numbers_symbols])
    date = models.DateField(null=False, auto_now_add=True, editable=False)
    code = models.CharField(max_length=6, null=False, unique=True, validators=[only_numbers])
    status = models.CharField(max_length=30, null=False, blank=False, choices=status_choices)
    progress_percentage = models.FloatField(default=0.0)
    sale_order_id = models.ForeignKey(M_sale_order, null=False, blank=False, on_delete=models.DO_NOTHING, db_column='sale_order_id')
    

    class Meta:
        db_table = 'proyect'
    
    def __str__(self):
        return f'{self.code} / {self.sale_order_id}'