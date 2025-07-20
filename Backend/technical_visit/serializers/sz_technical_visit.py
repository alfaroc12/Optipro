from rest_framework import serializers
from technical_visit.models.technical_visit import M_technical_visit
from technical_visit.models.technical_question import M_technical_question
from technical_visit.models.evidence_photo import M_evidence_photo
from technical_visit.serializers.sz_technical_question import sz_technical_question
from technical_visit.serializers.sz_evidence_photo import sz_evidence_photo
from django.db import transaction
from django.conf import settings
from datetime import datetime

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
        questions_data = validated_data.pop('question_id', {})
        evidence_photos_data = validated_data.pop('evidence_photo', [])

        with transaction.atomic():
            questions_tec = M_technical_question.objects.create(**questions_data) 
            visit = M_technical_visit.objects.create(question_id=questions_tec, **validated_data)
            for index, photo in enumerate(evidence_photos_data):
                M_evidence_photo.objects.create(
                    technical_visit=visit,
                    photo=photo,
                    order=index
                )
        return visit

    def update(self, instance, validated_data):
        questions_data = validated_data.pop('question_id', {})
        evidence_photos_data = validated_data.pop('evidence_photo', [])

        with transaction.atomic():
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            if questions_data:
                for attr, value in questions_data.items():
                    setattr(instance.question_id, attr, value)
                instance.question_id.save()
            if evidence_photos_data:
                instance.evidence_photos.all().delete()
                for index, photo in enumerate(evidence_photos_data):
                    M_evidence_photo.objects.create(
                        technical_visit=instance,
                        photo=photo,
                        order=index
                    )
        return instance

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
