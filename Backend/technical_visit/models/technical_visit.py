from django.db import models
from django.contrib.auth.models import User
from .technical_question import M_technical_question
from function.validators import only_lters_for_names, only_numbers, only_letters_numbers_symbols

class M_technical_visit(models.Model):
    concept_visit_choice = [
        ('proceeds','procede'),
        ('not applicable', 'no procede'),
        ('proceed conditions','procede con condiciones'),
    ]

    # principio 
    code = models.CharField(max_length=6, null=False, blank=False, unique=True)
    name = models.CharField(max_length=35, null=False, blank=False, validators=[only_lters_for_names])
    last_name = models.CharField(max_length=35, null=False, blank=False, validators=[only_lters_for_names])

    #ubicacain y contacto
    city = models.CharField(max_length=45, null=False, blank=False, validators=[only_lters_for_names])
    department = models.CharField(max_length=35, null=False, blank=False, validators=[only_lters_for_names])
    phone = models.CharField(max_length=10, null=False, validators=[only_numbers])
    N_identification = models.CharField(max_length=10, null=True, blank=False, unique=True, validators=[only_numbers])
    company = models.CharField(max_length=45, null=False, blank=False, validators=[only_lters_for_names])
    addres = models.CharField(max_length=60, null=False, blank=False, validators=[only_letters_numbers_symbols])

    #fechas
    date_visit = models.DateField(null=False, blank=False)
    start_time = models.TimeField(null=False, blank=False)
    end_time = models.TimeField(null=True, blank=True)

    #page 3
    concept_visit = models.CharField(max_length=30, null=False, blank=False, choices=concept_visit_choice)
    description_more = models.TextField(null=True, blank=True)
    question_id = models.ForeignKey(M_technical_question, on_delete=models.DO_NOTHING, related_name='visit')
    
    # Nuevos campos
    nic = models.CharField(max_length=20, null=True, blank=True, help_text="Número de Identificación de Contrato")
    user_id = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='technical_visits')

    class Meta:
        db_table = 'technical_visit'  # Arreglado: era 'thechnical_visit'

    def __str__(self):
        return f'{self.code}'