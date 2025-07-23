from rest_framework import serializers
from technical_visit.models.technical_visit import M_technical_visit
from technical_visit.models.technical_question import M_technical_question
from technical_visit.models.evidence_photo import M_evidence_photo
from technical_visit.serializers.sz_technical_question import sz_technical_question
from technical_visit.serializers.sz_evidence_photo import sz_evidence_photo
from django.db import transaction
from django.conf import settings
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class sz_technical_visit(serializers.ModelSerializer):
    question_id = sz_technical_question()
    evidence_photos = serializers.SerializerMethodField()
    evidence_photo = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False,
        allow_empty=True
    )

    class Meta:
        model = M_technical_visit
        fields = [
            'id',
            'code',
            'name',
            'last_name',
            'city',
            'department',
            'phone',
            'N_identification',
            'company',
            'addres',
            'date_visit',
            'start_time',
            'end_time',
            'concept_visit',
            'description_more',
            'question_id',
            'evidence_photos',
            'evidence_photo',
            'nic',
        ]
        read_only_fields = ['id', 'code', 'evidence_photos']  # code se genera automáticamente
    
    def validate(self, data):
        """
        Validación personalizada para campos requeridos
        """
        # Campos que son obligatorios en el modelo
        required_fields = {
            'name': 'Nombre',
            'last_name': 'Apellidos', 
            'city': 'Ciudad',
            'department': 'Departamento',
            'phone': 'Teléfono',
            'company': 'Empresa',
            'addres': 'Dirección',
            'date_visit': 'Fecha de visita',
            'start_time': 'Hora de inicio',
            'concept_visit': 'Concepto de visita'
        }
        
        errors = {}
        
        for field, display_name in required_fields.items():
            if field not in data or not data[field] or str(data[field]).strip() == '':
                errors[field] = f"{display_name} es requerido"
        
        if errors:
            raise serializers.ValidationError(errors)
            
        return data
    
    def get_evidence_photos(self, obj):
        evidence_photos = obj.evidence_photos.all()
        if evidence_photos.exists():
            serializer = sz_evidence_photo(evidence_photos, many=True, context=self.context)
            return serializer.data
        return []
    
    def to_internal_value(self, data):
        """
        Procesar y limpiar los datos antes de la validación
        """
        logger.info(f"Datos originales recibidos en serializer: {data}")
        
        # Crear una copia mutable de los datos
        if hasattr(data, 'copy'):
            data = data.copy()
        else:
            data = dict(data)
        
        # Campos de texto que pueden venir como listas
        text_fields = [
            'name', 'last_name', 'city', 'department', 'phone', 
            'N_identification', 'company', 'addres', 'concept_visit',
            'description_more', 'nic'
        ]
        
        # Convertir listas a strings para campos de texto
        for field in text_fields:
            if field in data:
                value = data[field]
                if isinstance(value, list) and len(value) > 0:
                    # Tomar el primer elemento de la lista
                    data[field] = str(value[0]).strip()
                elif isinstance(value, list) and len(value) == 0:
                    data[field] = ''
                elif value is not None:
                    data[field] = str(value).strip()
        
        # Manejar concept_visit específicamente por sus choices
        if 'concept_visit' in data:
            concept_value = data['concept_visit']
            if isinstance(concept_value, list) and len(concept_value) > 0:
                concept_value = str(concept_value[0]).strip()
            elif concept_value is not None:
                concept_value = str(concept_value).strip()
            
            # Mapear posibles valores del frontend a los choices del modelo
            concept_mapping = {
                'procede': 'proceeds',
                'proceeds': 'proceeds',
                'no procede': 'not applicable',
                'not applicable': 'not applicable',
                'procede con condiciones': 'proceed conditions',
                'proceed conditions': 'proceed conditions'
            }
            
            data['concept_visit'] = concept_mapping.get(concept_value, concept_value)
            logger.info(f"Concept visit mapeado: {concept_value} -> {data['concept_visit']}")
        
        # Manejar fechas
        if 'date_visit' in data:
            date_value = data['date_visit']
            if isinstance(date_value, list) and len(date_value) > 0:
                data['date_visit'] = str(date_value[0]).strip()
            elif date_value is not None:
                data['date_visit'] = str(date_value).strip()
        
        # Convertir horas de AM/PM a formato 24h si es necesario
        for field in ['start_time', 'end_time']:
            if field in data:
                time_value = data[field]
                if isinstance(time_value, list) and len(time_value) > 0:
                    time_value = str(time_value[0]).strip()
                elif time_value is not None:
                    time_value = str(time_value).strip()
                else:
                    continue
                
                try:
                    # Intentar diferentes formatos de tiempo
                    if 'AM' in time_value.upper() or 'PM' in time_value.upper():
                        # Formato 12 horas con AM/PM
                        parsed_time = datetime.strptime(time_value, "%I:%M %p").time()
                        data[field] = parsed_time.strftime("%H:%M")
                        logger.info(f"Tiempo convertido {field}: {time_value} -> {data[field]}")
                    elif ':' in time_value:
                        # Ya está en formato 24h, validar y mantener
                        datetime.strptime(time_value, "%H:%M")
                        data[field] = time_value
                except ValueError as e:
                    logger.error(f"Error al parsear tiempo {field}: {time_value} - {e}")
                    # Si no se puede parsear, mantener el valor original para que Django maneje el error
                    data[field] = time_value

        logger.info(f"Datos procesados en serializer: {data}")
        return super().to_internal_value(data)

    def create(self, validated_data):
        try:
            logger.info("Iniciando creación de visita técnica en serializer")
            
            questions_data = validated_data.pop('question_id', {})
            evidence_photos_data = validated_data.pop('evidence_photo', [])
            
            logger.info(f"Creando visita técnica con {len(evidence_photos_data)} fotos de evidencia")

            with transaction.atomic():
                # Crear la pregunta técnica primero
                if questions_data:
                    questions_tec = M_technical_question.objects.create(**questions_data)
                    logger.info(f"Pregunta técnica creada con ID: {questions_tec.id}")
                else:
                    # Si no hay datos de pregunta, crear una vacía
                    questions_tec = M_technical_question.objects.create()
                    logger.info("Pregunta técnica vacía creada")
                
                # Crear la visita técnica
                visit = M_technical_visit.objects.create(question_id=questions_tec, **validated_data)
                logger.info(f"Visita técnica creada con código: {visit.code}")
                
                # Procesar fotos de evidencia de manera eficiente
                if evidence_photos_data:
                    photo_objects = []
                    for index, photo in enumerate(evidence_photos_data):
                        photo_obj = M_evidence_photo(
                            technical_visit=visit,
                            photo=photo,
                            order=index
                        )
                        photo_objects.append(photo_obj)
                    
                    # Bulk create para mejor performance
                    M_evidence_photo.objects.bulk_create(photo_objects)
                    logger.info(f"Se crearon {len(photo_objects)} fotos de evidencia")
                
            return visit
            
        except Exception as e:
            logger.error(f"Error en create del serializer: {str(e)}", exc_info=True)
            raise

    def update(self, instance, validated_data):
        try:
            logger.info(f"Actualizando visita técnica: {instance.code}")
            
            questions_data = validated_data.pop('question_id', {})
            evidence_photos_data = validated_data.pop('evidence_photo', [])

            with transaction.atomic():
                # Actualizar campos de la visita técnica
                for attr, value in validated_data.items():
                    setattr(instance, attr, value)
                instance.save()
                logger.info("Datos de visita técnica actualizados")
                
                # Actualizar preguntas técnicas si hay datos
                if questions_data and instance.question_id:
                    for attr, value in questions_data.items():
                        setattr(instance.question_id, attr, value)
                    instance.question_id.save()
                    logger.info("Preguntas técnicas actualizadas")
                
                # Actualizar fotos de evidencia si hay nuevas
                if evidence_photos_data:
                    # Eliminar fotos existentes
                    instance.evidence_photos.all().delete()
                    logger.info("Fotos de evidencia existentes eliminadas")
                    
                    # Crear nuevas fotos
                    photo_objects = []
                    for index, photo in enumerate(evidence_photos_data):
                        photo_obj = M_evidence_photo(
                            technical_visit=instance,
                            photo=photo,
                            order=index
                        )
                        photo_objects.append(photo_obj)
                    
                    M_evidence_photo.objects.bulk_create(photo_objects)
                    logger.info(f"Se crearon {len(photo_objects)} nuevas fotos de evidencia")
                    
            return instance
            
        except Exception as e:
            logger.error(f"Error en update del serializer: {str(e)}", exc_info=True)
            raise

class sz_technical_visit_list(serializers.ModelSerializer):
    concept_visit = serializers.SerializerMethodField()
    evidence_photos = serializers.SerializerMethodField()
    
    class Meta:
        model = M_technical_visit
        fields = [
            'id',
            'code',
            'name',
            'last_name',
            'city',
            'department',
            'phone',
            'N_identification',
            'company',
            'addres',
            'date_visit',
            'start_time',
            'end_time',
            'concept_visit',
            'description_more',
            'evidence_photos',
            'nic',
        ]
        read_only_fields = fields

    def get_concept_visit(self, obj):
        return obj.get_concept_visit_display()
        
    def get_evidence_photos(self, obj):
        evidence_photos = obj.evidence_photos.all()
        if evidence_photos.exists():
            serializer = sz_evidence_photo(evidence_photos, many=True, context=self.context)
            return serializer.data
        return []

class sz_technical_visit_retrive(serializers.ModelSerializer):
    question_id = sz_technical_question(read_only=True)
    evidence_photos = serializers.SerializerMethodField()
    
    class Meta:
        model = M_technical_visit
        fields = [
            'id',
            'code',
            'name',
            'last_name',
            'city',
            'department',
            'phone',
            'N_identification',
            'company',
            'addres',
            'date_visit',
            'start_time',
            'end_time',
            'concept_visit',
            'description_more',
            'question_id',
            'evidence_photos',
            'nic',
        ]
        read_only_fields = [
            'id',
            'code',
            'question_id'
        ]
        
    def get_evidence_photos(self, obj):
        evidence_photos = obj.evidence_photos.all()
        if evidence_photos.exists():
            serializer = sz_evidence_photo(evidence_photos, many=True, context=self.context)
            return serializer.data
        return []
