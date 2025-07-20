from django.db import models
from function.validators import only_letters_numbers_symbols


class M_technical_question(models.Model):
    Q_1_choice = [
        ('Bifásica','Bifásica'),
        ('Trifásica', 'Trifásica'),
    ]
    Q_2_choice = [
        ('Sí tiene','Sí tiene'),
        ('No tiene', 'No tiene'),
    ]
    Q_3_choice = [
        ('Buenas condiciones','Buenas condiciones'),
        ('Requiere adecuación', 'Requiere adecuación'),
    ]
    Q_4_choice = [
        ('Fácil acceso','Fácil acceso'),
        ('Difícil acceso', 'Difícil acceso'),
    ]
    Q_5_choice = [
        ('Realizada','Realizada'),
        ('Pendiente', 'Pendiente'),
    ]
    Q_6_choice = [
        ('Recibida','Recibida'),
        ('Pendiente', 'Pendiente'),
        ('No tiene','No tiene'),
    ]
    Q_1 = models.CharField(max_length=30, null=False, blank=False, choices=Q_1_choice)
    Q_1_comentary = models.TextField(null=True, blank=True, validators=[only_letters_numbers_symbols])   
    Q_2 = models.CharField(max_length=30, null=False, blank=False, choices=Q_2_choice)
    Q_2_comentary = models.TextField(null=True, blank=True, validators=[only_letters_numbers_symbols])
    Q_3 = models.CharField(max_length=30, null=False, blank=False, choices=Q_3_choice)
    Q_3_comentary = models.TextField(null=True, blank=True, validators=[only_letters_numbers_symbols])
    Q_4 = models.CharField(max_length=30, null=False, blank=False, choices=Q_4_choice)
    Q_4_comentary = models.TextField(null=True, blank=True, validators=[only_letters_numbers_symbols])
    Q_5 = models.CharField(max_length=30, null=False, blank=False, choices=Q_5_choice)
    Q_5_comentary = models.TextField(null=True, blank=True, validators=[only_letters_numbers_symbols])
    Q_6 = models.CharField(max_length=30, null=False, blank=False, choices=Q_6_choice)
    Q_6_comentary = models.TextField(null=True, blank=True, validators=[only_letters_numbers_symbols])

    class Meta:
        db_table = 'technical_question'

    def __str__(self):
        return f'{self.Q_1} - {self.Q_2} - {self.Q_3} - {self.Q_4} - {self.Q_5} - {self.Q_6}'