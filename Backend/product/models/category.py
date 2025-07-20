from django.db import models
from function.validators import only_letters_numbers_symbols, only_numbers

class M_category(models.Model):
    code = models.CharField(max_length=6, unique=True, null=False, blank=False, validators=[only_numbers])
    name = models.CharField(max_length=40, null=False, blank=False, validators=[only_letters_numbers_symbols])

    class Meta:
        db_table = "category"