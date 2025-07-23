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
    
    def get_evidence_photos(self, obj):
        evidence_photos = obj.evidence_photos.all()
        if evidence_photos.exists():
            serializer = sz_evidence_photo(evidence_photos, many=True, context=self.context)
            return serializer.data
        return []
    
    def to_internal_value(self, data):
    # Convertir AM/PM a formato 24h si es necesario
        for field in ['start_time', 'end_time']:
            if field in data and isinstance(data[field], str):
                try:
                    data[field] = datetime.strptime(data[field], "%I:%M %p").time()
                except ValueError:
                    pass  

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
