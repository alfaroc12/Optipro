from django.db import models
from function.validators import only_numbers, only_lters_for_names, only_letters_numbers_symbols



class M_person(models.Model):
    type_person_choice = [
        ("C.C", "Cedula"),
        ("NIT", "NIT"),
    ]
    type_identification = models.CharField(max_length=3, null=False, blank=False, choices=type_person_choice)
    identification = models.CharField(max_length=10, null=True, blank=False, unique=True, validators=[only_numbers])
    firs_name = models.CharField(max_length=15, null=False, blank=False, validators=[only_lters_for_names])
    other_name = models.CharField(max_length=15, null=True, blank=True, validators=[only_lters_for_names])
    last_name = models.CharField(max_length=15, null=False, blank=False, validators=[only_lters_for_names])
    secon_surname = models.CharField(max_length=15, null=False, blank=False, validators=[only_lters_for_names])
    name = models.CharField(max_length=60, null=False, blank=False, validators=[only_lters_for_names])
    addres = models.CharField(max_length=30, null=False, blank=False, validators=[only_letters_numbers_symbols])
    city = models.CharField(max_length=45, null=False, blank=False, validators=[only_lters_for_names])
    phone = models.CharField(max_length=10, null=False, validators=[only_numbers])
    phone_2 = models.CharField(max_length=10, null=True, validators=[only_numbers])

    class Meta:
        db_table = "person"

    def __str__(self):
        return f"{self.name} - {self.identification}"
    