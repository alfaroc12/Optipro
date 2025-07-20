from rest_framework import serializers
from sale_order.models.sale_order import M_sale_order
from sale_order.models.comentary_sale_order import M_comentary_sale_order
from sale_order.models.attach_sale_order import M_attach_sale_order
from technical_visit.models.technical_visit import M_technical_visit
from .sz_comentary_sale_order import sz_comentary_sale_order_retrive
from .sz_attach_sale_order import sz_attach_sale_order_list
from technical_visit.serializers.sz_technical_visit import sz_technical_visit_retrive
from django.core.files import File


class sz_sale_order(serializers.ModelSerializer):
    technical_visit_id = serializers.PrimaryKeyRelatedField(queryset=M_technical_visit.objects.all(),required=False)

    def __init__(self, *args, **kwargs):
        # Extraer y almacenar los archivos antes de hacer una copia de los datos
        request = kwargs.get('context', {}).get('request', None)
        files = None
        
        if request and hasattr(request, 'FILES'):
            # Guardar referencia a los archivos
            files = request.FILES
        
        # Ahora copiar los datos de forma segura
        if 'data' in kwargs and hasattr(kwargs['data'], 'copy'):
            try:
                # Si estamos trabajando con un QueryDict (como request.POST)
                # Usar copy() simple en lugar de deepcopy() que causa problemas con archivos
                if hasattr(kwargs['data'], '_mutable'):
                    mutable = kwargs['data']._mutable
                    kwargs['data']._mutable = True
                    kwargs['data'] = kwargs['data'].copy()
                    kwargs['data']._mutable = mutable
                else:
                    # Crear una copia plana (no profunda) para evitar problemas con BufferedRandom
                    data_copy = {}
                    for key, value in kwargs['data'].items():
                        if key != 'archivos_adjuntos' and key != 'hojaCalculo' and not isinstance(value, (bytes, bytearray)):
                            data_copy[key] = value
                    kwargs['data'] = data_copy
            except Exception as e:
                print(f"Error al copiar los datos: {e}")
                # Si hay un error, seguir con los datos originales
                pass
        
        super().__init__(*args, **kwargs)
        
        # Ahora puedes modificar self.initial_data
        # Ignorar campos no definidos en el modelo
        if getattr(self, 'initial_data', None):
            ignored_fields = ['products', 'person_id', 'user_id']  # Añadimos user_id a los campos ignorados
            for field in ignored_fields:
                if field in self.initial_data:
                    self.initial_data.pop(field, None)

    
    class Meta:
        model = M_sale_order
        fields = [
            'id',
            'date',            # Estos campos están comentados en el modelo
            # 'person_id',
            # 'person_id_name',
            'type_identification',
            'identification',
            'nitCC',
            'representante',
            'firs_name',
            'other_name',
            'last_name',
            'secon_surname',
            'name',
            'addres',
            'phone',
            'phone_2',
            'code',
            'state',
            'user_id', # Lo mantenemos en fields pero lo ignoraremos en initial_data            
            'technical_visit_id',
            'date_start',
            'date_end',
            'proyect_type',
            'total_quotation',
            'description',
            'payment_type',
            'system_type',
            'power_required',
            'panel_type',
            'energy_production',
            'city',

            'description_2',
            'departement',
            'number_panels',
            'necessary_area',
            'Type_installation',
            'Delivery_deadline',
            'Validity_offer',
            'Warranty',
            'cotizador',
            'fecha_cotizacion',
            'archivo_cotizacion',

            # 'products',
            'solar_panels',
            'solar_panels_price',
            'Assembly_structures',
            'Assembly_structures_price',
            'Wiring_and_cabinet',
            'Wiring_and_cabinet_price',
            'Legalization_and_designs',
            'Legalization_and_designs_price',
            'batterys',
            'batterys_price',
            'investors',
            'investors_price',
            'Kit_5kw',
            'Kit_5kw_price',
            'Kit_8kw',
            'Kit_8kw_price',
            'Kit_12kw',
            'Kit_12kw_price',
            'Kit_15kw',
            'Kit_15kw_price',
            'Kit_30kw',
            'Kit_30kw_price',
            'Microinverters',
            'Microinverters_price',            'Transport',            'Transport_price',
            'workforce',
            'workforce_price',
        ]
        read_only_fields = ['user_id','code'] 




    def validate(self, data):
        nit = data.get('nitCC')
        visita = data.get('technical_visit_id')
        if visita and visita.N_identification != nit:
            raise serializers.ValidationError("La visita técnica seleccionada no coincide con el número de identificación (nitCC).")
        return data


    
    def create(self, validated_data):
        request = self.context.get('request')
        archivo_cotizacion = validated_data.pop('archivo_cotizacion', None)

        import random
        from django.db.utils import IntegrityError

        max_attempts = 5
        for attempt in range(max_attempts):
            try:
                sale = M_sale_order.objects.create(**validated_data)
                break
            except IntegrityError as e:
                if 'code' in str(e) and attempt < max_attempts - 1:
                    new_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
                    validated_data['code'] = new_code
                    print(f"Código duplicado, generando nuevo código: {new_code}")
                else:
                    raise

        if archivo_cotizacion:
            sale.archivo_cotizacion = archivo_cotizacion
            sale.save()

        if request:
            # Para los datos enviados en formato FormData con archivos
            if hasattr(request, 'FILES') and request.FILES:
                # Archivos adjuntos generales
                # Intentar obtener archivos adjuntos con diferentes nombres de campos
                archivos_adjuntos = request.FILES.getlist('archivos_adjuntos')
                
                # Si no se encontraron archivos, intentar con otros posibles nombres de campos
                if not archivos_adjuntos:
                    for field_name in ['archivos_adjuntos[]', 'archivosAdjuntos', 'files']:
                        archivos_adjuntos = request.FILES.getlist(field_name)
                        if archivos_adjuntos:
                            print(f"Archivos encontrados con el nombre: {field_name}")
                            break
                for archivo in archivos_adjuntos:
                    # Asegurarnos de que content_type no exceda el límite de caracteres
                    content_type = archivo.content_type
                    if len(content_type) > 50:
                        content_type = content_type[:50]
                        
                    M_attach_sale_order.objects.create(
                        attach=archivo,
                        sale_order_id=sale,
                        name=archivo.name,
                        size=str(archivo.size),
                        content_type=content_type,
                        is_calculation_sheet=False  # Este NO es una hoja de cálculo
                    )
                
                # Hoja de cálculo
                hoja_calculo = request.FILES.get('hojaCalculo')
                if not hoja_calculo:
                    # Intentar con otros posibles nombres de campo
                    for field_name in ['hoja_calculo', 'hojaDeCalculo']:
                        hoja_calculo = request.FILES.get(field_name)
                        if hoja_calculo:
                            break
                
                if hoja_calculo:
                    # Asegurarnos de que content_type no exceda el límite de caracteres
                    content_type = hoja_calculo.content_type
                    if len(content_type) > 50:
                        content_type = content_type[:50]
                        
                    M_attach_sale_order.objects.create(
                        attach=hoja_calculo,
                        sale_order_id=sale,
                        name=f"Hoja de Cálculo - {hoja_calculo.name}",
                        size=str(hoja_calculo.size),
                        content_type=content_type,
                        is_calculation_sheet=True  # Este SÍ es una hoja de cálculo
                    )
            
            # Si hay datos de archivos en formato JSON (solo nombres)
            raw_data = getattr(request, 'data', {})
            if 'archivos_adjuntos' in raw_data and isinstance(raw_data['archivos_adjuntos'], list):
                print(f"Se encontraron nombres de archivos adjuntos: {raw_data['archivos_adjuntos']}")
                # Aquí no podemos crear archivos reales, solo registrar que existen referencias
                for nombre_archivo in raw_data['archivos_adjuntos']:
                    print(f"Registrando referencia a archivo: {nombre_archivo}")
            
            if 'hoja_calculo' in raw_data and isinstance(raw_data['hoja_calculo'], str) and raw_data['hoja_calculo']:
                print(f"Se encontró referencia a hoja de cálculo: {raw_data['hoja_calculo']}")
                # Aquí también solo podríamos registrar la referencia



        return sale
    #         M_sale_order_product.objects.create(
    #             sale_order_id=sale,
    #             **question_data
    #         )

    #     return sale

class sz_sale_order_list(serializers.ModelSerializer):
    # person_id_name = serializers.CharField(source='person_id.name', read_only=True)
    
    class Meta:
        model = M_sale_order
        fields = [
            'id',
            'date',
            'type_identification',
            'identification',
            'nitCC',
            'representante',
            'firs_name',
            'other_name',
            'last_name',
            'secon_surname',
            'description',
            'description_2',
            'name',
            'addres',
            'city',
            'phone',
            'phone_2',
            'code',
            'state',
            'user_id',            
            'date_start',
            'date_end',
            'proyect_type',
            'total_quotation',
            'payment_type',
            'system_type',
            'cotizador',
            'fecha_cotizacion',
            'archivo_cotizacion',

            'departement',
            'number_panels',
            'necessary_area',
            'Type_installation',
            'Delivery_deadline',
            'Validity_offer',
            'Warranty',

            'power_required',
            'panel_type',
            'energy_production',
            'city', 
            'solar_panels',
            'solar_panels_price',
            'Assembly_structures',
            'Assembly_structures_price',
            'Wiring_and_cabinet',
            'Wiring_and_cabinet_price',
            'Legalization_and_designs',
            'Legalization_and_designs_price',
            'batterys',
            'batterys_price',
            'investors',
            'investors_price',
            'Kit_5kw',
            'Kit_5kw_price',
            'Kit_8kw',
            'Kit_8kw_price',
            'Kit_12kw',
            'Kit_12kw_price',
            'Kit_15kw',
            'Kit_15kw_price',
            'Kit_30kw',
            'Kit_30kw_price',
            'Microinverters',
            'Microinverters_price',
            'Transport',
            'Transport_price',
            'workforce',
            'workforce_price',


        ]
        read_only_fields = fields

# class sz_sale_order_fk(serializers.ModelSerializer):
#     person_id_name = serializers.CharField(source='person_id.name', read_only=True)
#     class Meta:
#         model = M_sale_order
#         fields = [
#             'id',
#             'code',
#             'person_id_name',
#         ]
#         read_only_fields = fields

class sz_sale_order_retrive(serializers.ModelSerializer):    # person_id_name = serializers.CharField(source='person_id.name', read_only=True)
    # product_id = sz_product_retrive(read_only=True, many=True)
    comentaries = serializers.SerializerMethodField()
    archivos_adjuntos = serializers.SerializerMethodField()
    technical_visit_details = serializers.SerializerMethodField()
    
    class Meta: 
        model = M_sale_order
        fields = [
            'id',
            'date',
            'type_identification',
            'identification',
            'nitCC',
            'representante',
            'firs_name',
            'other_name',
            'last_name',
            'secon_surname',
            'name',
            'addres',
            'city',
            'phone',
            'phone_2',
            'code',
            'state',
            'user_id',
            'date_start',
            'date_end',
            'proyect_type',
            'total_quotation',
            'description',
            'description_2',
            'payment_type',
            'system_type',
            'power_required',
            'panel_type',
            'energy_production',
            'city',
            'cotizador',
            'fecha_cotizacion',
            'archivo_cotizacion',

            'departement',
            'number_panels',
            'necessary_area',
            'Type_installation',
            'Delivery_deadline',
            'Validity_offer',            
            'Warranty',

            'comentaries',
            'archivos_adjuntos',
            'technical_visit_details',

            'solar_panels',
            'solar_panels_price',
            'Assembly_structures',
            'Assembly_structures_price',
            'Wiring_and_cabinet',
            'Wiring_and_cabinet_price',
            'Legalization_and_designs',
            'Legalization_and_designs_price',
            'batterys',
            'batterys_price',
            'investors',
            'investors_price',
            'Kit_5kw',
            'Kit_5kw_price',
            'Kit_8kw',
            'Kit_8kw_price',
            'Kit_12kw',
            'Kit_12kw_price',
            'Kit_15kw',
            'Kit_15kw_price',
            'Kit_30kw',
            'Kit_30kw_price',
            'Microinverters',
            'Microinverters_price',
            'Transport',
            'Transport_price',            'workforce',
            'workforce_price',

        ]
        
        # Solo mantener como read-only los campos que realmente no deben ser editables
        # como los identificadores, las fechas de creación, y los campos calculados
        read_only_fields = [
            'id',
            'date',
            'code',
            'user_id',     
            
        ]
        
    def get_comentaries(self, obj):
        comentarios = M_comentary_sale_order.objects.filter(sale_order_id=obj.id)
        return sz_comentary_sale_order_retrive(comentarios, many=True).data
      # Método para obtener los archivos adjuntos relacionados
    def get_archivos_adjuntos(self, obj):
        try:
            # Obtener todos los archivos adjuntos
            archivos = M_attach_sale_order.objects.filter(sale_order_id=obj.id)
            
            # Separar los archivos en dos categorías
            archivos_generales = archivos.filter(is_calculation_sheet=False)
            hoja_calculo = archivos.filter(is_calculation_sheet=True).first()
            
            resultado = {
                'archivos_generales': sz_attach_sale_order_list(archivos_generales, many=True).data,
                'hoja_calculo': sz_attach_sale_order_list([hoja_calculo], many=True).data if hoja_calculo else []
            }
            
            return resultado
        except Exception as e:
            print(f"Error al obtener archivos adjuntos: {e}")
            return {'archivos_generales': [], 'hoja_calculo': []}      # Modificamos el método update para asegurar que todos los campos se actualicen correctamente
    def update(self, instance, validated_data):
        print("\n--- ACTUALIZANDO DATOS EN SERIALIZADOR ---")
        print("Datos validados recibidos:", validated_data)
        
        # Actualizamos todos los campos básicos del modelo
        for attr, value in validated_data.items():
            if hasattr(instance, attr):
                print(f"Actualizando campo {attr}: '{getattr(instance, attr)}' → '{value}'")
                setattr(instance, attr, value)
            else:
                print(f"¡Advertencia! Campo {attr} no existe en el modelo")
        
        # Reconstruir el campo name con los valores actualizados
        if any(field in validated_data for field in ['firs_name', 'other_name', 'last_name', 'secon_surname']):
            # Construir el nombre completo
            name_parts = [
                instance.firs_name if instance.firs_name else "",
                instance.other_name if instance.other_name else "",
                instance.last_name if instance.last_name else "",
                instance.secon_surname if instance.secon_surname else ""
            ]
            # Filtrar partes vacías y unir con espacios
            old_name = instance.name
            instance.name = " ".join(filter(None, name_parts))
            print(f"Nombre recalculado: '{old_name}' → '{instance.name}'")
        
        # Guardamos la instancia actualizada
        try:
            instance.save()
            print("Instancia guardada correctamente")
        except Exception as e:
            print(f"¡ERROR al guardar la instancia!: {str(e)}")
        
        # Verificamos campos actualizados del equipamiento
        equipments = [
            ('solar_panels', 'solar_panels_price'),
            ('Assembly_structures', 'Assembly_structures_price'),
            ('Wiring_and_cabinet', 'Wiring_and_cabinet_price'),
            ('Legalization_and_designs', 'Legalization_and_designs_price'),
            ('batterys', 'batterys_price'),
            ('investors', 'investors_price'),
            ('Kit_5kw', 'Kit_5kw_price'),
            ('Kit_8kw', 'Kit_8kw_price'),
            ('Kit_12kw', 'Kit_12kw_price'),
            ('Kit_15kw', 'Kit_15kw_price'),
            ('Kit_30kw', 'Kit_30kw_price'),
            ('Microinverters', 'Microinverters_price'),
            ('Transport', 'Transport_price'),
            ('workforce', 'workforce_price'),
        ]
        
        for field, price_field in equipments:
            if field in validated_data or price_field in validated_data:
                print(f"Equipamiento actualizado: {field}={getattr(instance, field)}, {price_field}={getattr(instance, price_field)}")
                
        return instance

    def get_technical_visit_details(self, obj):
        if hasattr(obj, 'technical_visit_id') and obj.technical_visit_id:
            return sz_technical_visit_retrive(obj.technical_visit_id).data
        return None
