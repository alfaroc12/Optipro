from django.db import models
from .category import M_category
from function.validators import only_lters_for_names, only_letters_numbers_symbols, only_numbers


class M_product(models.Model):
    code = models.CharField(max_length=6, unique=True, null=False, blank=False, validators=[only_numbers])
    name = models.CharField(max_length=45, null=False, blank=False, validators=[only_lters_for_names])
    description = models.TextField(null=False, blank=False, validators=[only_letters_numbers_symbols])
    active = models.BooleanField(default=True)
    type_product = models.CharField(max_length=15, null=False, blank=False, validators=[only_letters_numbers_symbols])
    cost = models.DecimalField(max_digits=10, null=False, blank=False, decimal_places=2)
    price = models.DecimalField(max_digits=10, null=False, blank=False, decimal_places=2)
    category_id = models.ForeignKey(M_category, on_delete=models.DO_NOTHING, null=False, blank=False, db_column='category_id')

    class Meta:
        db_table = "product"

    def __str__(self):
        return f'{self.code} -'

