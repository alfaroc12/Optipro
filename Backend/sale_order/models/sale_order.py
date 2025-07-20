from django.db import models
# from person.models.person import M_person
# from product.models.product import M_product
from django.contrib.auth.models import User
from function.validators import only_numbers, only_letters_numbers_symbols, only_letters_numbers_spaces,only_lters_for_names
from technical_visit.models.technical_visit import M_technical_visit
import re


class M_sale_order(models.Model):
    state_choices = [
        ('pendiente', 'pendiente'),
        ('aprobado', 'aprobado'),
        ('rechazado', 'rechazado'),
    ]
    proyect_type_choices = [
        ('Publico', 'Publico'),
        ('Privado', 'Privado'),
    ]
    payment_type_choices = [
        ('50%,30%,20%', '50%, 30%, 20%'),
        ('50%,50%', '50%, 50%'),
        ('Personalizado en observaciones', 'Personalizado en observaciones'),
    ]
    
    def save(self, *args, **kwargs):
        # Recalcular el campo name antes de guardar
        name_parts = [
            self.firs_name if self.firs_name else "",
            self.other_name if self.other_name else "",
            self.last_name if self.last_name else "",
            self.secon_surname if self.secon_surname else ""
        ]
        # Filtrar partes vacías y unir con espacios
        self.name = " ".join(filter(None, name_parts))
        print(f"Nombre recalculado en save(): {self.name}")
        
        # Llamar al método save original
        super(M_sale_order, self).save(*args, **kwargs)
    system_type_choices = [
        ('On-grid', 'On-grid (Conectado a red)'),
        ('Off-grid', 'Off-grid (Aislado)'),
        ('Híbrido', 'Híbrido'),
    ]
    type_person_choice = [
        ("C.C", "Cedula"),
        ("NIT", "NIT"),
    ]
    Type_installation_choice = [
        ("Tejado", "Tejado"),
        ("Suelo", "Suelo"),
        ("Pérgola", "Pérgola"),
        ("Otro", "Otro")
    ]
    date = models.DateField(null=False, blank=False, editable=False, auto_now_add=True)  


    # campuse de person 
    
    type_identification = models.CharField(max_length=3, null=False, blank=False, choices=type_person_choice)
    identification = models.CharField(max_length=10, null=True, blank=False, unique=False, validators=[only_numbers])
    nitCC = models.CharField(max_length=15, null=True, blank=True, validators=[only_numbers])
    representante = models.CharField(max_length=60, null=True, blank=True, validators=[only_lters_for_names])
    firs_name = models.CharField(max_length=15, null=False, blank=False, validators=[only_lters_for_names])
    other_name = models.CharField(max_length=15, null=True, blank=True, validators=[only_lters_for_names])
    last_name = models.CharField(max_length=15, null=False, blank=False, validators=[only_lters_for_names])
    secon_surname = models.CharField(max_length=15, null=False, blank=False, validators=[only_lters_for_names])
    name = models.CharField(max_length=60, null=False, blank=False, validators=[only_lters_for_names])
    addres = models.CharField(max_length=60, null=False, blank=False, validators=[only_letters_numbers_symbols])
    city = models.CharField(max_length=45, null=False, blank=False, validators=[only_lters_for_names])
    phone = models.CharField(max_length=10, null=False, validators=[only_numbers])
    phone_2 = models.CharField(max_length=10, null=True, validators=[only_numbers])

    code = models.CharField(max_length=6, null=False, blank=False, unique=True, validators=[only_numbers])
    state = models.CharField(max_length=35, null=False, blank=False, choices=state_choices, default='pendiente')
    user_id = models.ForeignKey(User, null=False, on_delete=models.DO_NOTHING, db_column='user_id')
    technical_visit_id = models.ForeignKey(M_technical_visit,null=True,blank=True,on_delete=models.SET_NULL,
    related_name="sale_orders")


    # Campos para la cotización
    cotizador = models.CharField(max_length=60, null=True, blank=True)
    fecha_cotizacion = models.DateField(null=True, blank=True)
    archivo_cotizacion = models.FileField(upload_to='media/', null=True, blank=True)

    date_start = models.DateField(null=False, blank=False)
    date_end = models.DateField(null=True, blank=True)

    proyect_type = models.CharField(max_length=20, null=False, blank=False, choices=proyect_type_choices)
    total_quotation = models.DecimalField(max_digits=13, null=False, blank=False, decimal_places=2)
    description = models.TextField(null=True, blank=False, validators=[only_letters_numbers_symbols])
    payment_type = models.CharField(max_length=30, null=False, blank=False, choices=payment_type_choices)
    system_type = models.CharField(max_length=20, null=False, blank=False, choices=system_type_choices)
    power_required = models.DecimalField(max_digits=10, null=True, blank=False, decimal_places=2)
    panel_type = models.CharField(max_length=20, null=True, blank=False, validators=[only_letters_numbers_spaces])
    energy_production = models.DecimalField(max_digits=10, null=True, decimal_places=2)
    city = models.CharField(max_length=45, null=False, blank=False)

    description_2 = models.TextField(null=True, blank=False, validators=[only_letters_numbers_symbols])
    departement = models.CharField(max_length=45, null=False, blank=False, default="Magdalena")
    number_panels = models.CharField(max_length=10, null=True, blank=False, validators=[only_numbers])
    necessary_area = models.DecimalField(max_digits=10, null=True, blank=False, decimal_places=2)
    Type_installation = models.CharField(max_length=10, null=False, blank=False, choices=Type_installation_choice, default='Tejado')
    Delivery_deadline = models.CharField(max_length=3, null=True, blank=False, validators=[only_numbers])
    Validity_offer = models.CharField(max_length=3, null=True, blank=False, validators=[only_numbers])
    Warranty= models.CharField(max_length=100, null=True, blank=False, validators=[only_letters_numbers_symbols])


    solar_panels = models.BooleanField( null=True, default=False)
    solar_panels_price = models.DecimalField(max_digits=20, null=True, default=0, decimal_places=2)

    Assembly_structures = models.BooleanField( null=True, default=False)
    Assembly_structures_price = models.DecimalField(max_digits=20, null=True, default=0, decimal_places=2)
    
    Wiring_and_cabinet = models.BooleanField( null=True, default=False)
    Wiring_and_cabinet_price = models.DecimalField(max_digits=20, null=True, default=0, decimal_places=2)
    
    Legalization_and_designs = models.BooleanField( null=True, default=False)
    Legalization_and_designs_price = models.DecimalField(max_digits=20, null=True, default=0, decimal_places=2)
    
    batterys = models.BooleanField( null=True, default=False)
    batterys_price = models.DecimalField(max_digits=20, null=True, default=0, decimal_places=2)
    
    investors = models.BooleanField( null=True, default=False)
    investors_price = models.DecimalField(max_digits=20, null=True, default=0, decimal_places=2)
    
    Kit_5kw = models.BooleanField(null=True, default=False)
    Kit_5kw_price = models.DecimalField(max_digits=20, null=True, default=0, decimal_places=2)
    
    Kit_8kw = models.BooleanField(null=True, default=False)
    Kit_8kw_price = models.DecimalField(max_digits=20, null=True, default=0, decimal_places=2)
    
    Kit_12kw = models.BooleanField(null=True, default=False)
    Kit_12kw_price = models.DecimalField(max_digits=20, null=True, default=0, decimal_places=2)
    
    Kit_15kw = models.BooleanField(null=True, default=False)
    Kit_15kw_price = models.DecimalField(max_digits=20, null=True, default=0, decimal_places=2)
    
    Kit_30kw = models.BooleanField(null=True, default=False)
    Kit_30kw_price = models.DecimalField(max_digits=20, null=True, default=0, decimal_places=2)
    
    Microinverters = models.BooleanField(null=True, default=False)
    Microinverters_price = models.DecimalField(max_digits=20, null=True, default=0, decimal_places=2)
    
    Transport = models.BooleanField(null=True, default=False)
    Transport_price = models.DecimalField(max_digits=20, null=True, default=0, decimal_places=2)
    workforce = models.BooleanField(null=True, default=False)
    workforce_price = models.DecimalField(max_digits=20, null=True, default=0, decimal_places=2)

    comentary_id = models.ManyToManyField(User, through='M_comentary_sale_order', related_name='comentarys')

    class Meta:
        db_table = 'sale_order'

    def __str__(self):
        return f'{self.code} - {self.name} - {self.city} - {self.representante} - {self.power_required} - {self.total_quotation}   '