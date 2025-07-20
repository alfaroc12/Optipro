from django.db import models
from django.contrib.auth.models import User
from .proyect import M_proyect
from function.validators import only_letters_numbers_symbols

class M_proyect_comentary(models.Model):
    date = models.DateField(null=False, auto_now_add=True, editable=False)
    description = models.TextField(null=False, blank=False, validators=[only_letters_numbers_symbols])
    user_id = models.ForeignKey(User, null=False, blank=False, on_delete=models.DO_NOTHING, db_column='user_id')
    proyect_id = models.ForeignKey(M_proyect, null=False, blank=False, on_delete=models.CASCADE, db_column='proyect_id')

    class Meta:
        db_table = 'proyect_comentary'

    def __str__(self):
        return f'{self.proyect_id.code}'
    