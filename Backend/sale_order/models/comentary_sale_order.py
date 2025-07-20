from django.db import models
from django.contrib.auth.models import User
from .sale_order import M_sale_order
from function.validators import only_letters_numbers_symbols

class M_comentary_sale_order(models.Model):
    user_id = models.ForeignKey(User, null=False, blank=False, on_delete=models.DO_NOTHING, db_column='user_id')
    sale_order_id = models.ForeignKey(M_sale_order, null=False, blank=False, on_delete=models.CASCADE, db_column='sale_order_id')
    description = models.TextField(null=False, blank=False, validators=[only_letters_numbers_symbols])
    date = models.DateField(null=False, blank=False, auto_now_add=True, editable=False)

    class Meta:
        db_table = 'comentary_sale_order'

    def __str__(self):
        return f'{self.sale_order_id.code}'