from rest_framework import serializers
from proyect.models.proyect_comentary import M_proyect_comentary

class sz_proyect_comentary(serializers.ModelSerializer):
    class Meta:
        model = M_proyect_comentary
        fields = [
            'id',
            'date',
            'description',
            'user_id',
            'proyect_id',
        ]

class sz_proyect_comentary_list(serializers.ModelSerializer):
    proyect_id_code = serializers.CharField(source='proyect_id.code', read_only=True)
    class Meta:
        model = M_proyect_comentary
        fields = [
            'id',
            'date',
            'description',
            'proyect_id_code',
        ]
        read_only_fields = fields

class sz_proyect_comentary_fk(serializers.ModelSerializer):
    proyect_id_code = serializers.CharField(source='proyect_id.code', read_only=True)
    class Meta:
        model = M_proyect_comentary
        fields = [
            'id',
            'description',
            'proyect_id',
            'proyect_id_code',
        ]
        read_only_fields = fields

class sz_proyect_comentary_retrive(serializers.ModelSerializer):
    proyect_id_code = serializers.CharField(source='proyect_id.code', read_only=True)
    class Meta:
        model = M_proyect_comentary
        fields = [
            'id',
            'date',
            'description',
            'user_id',
            'proyect_id',
            'proyect_id_code',
        ]
        read_only_fields = [
            'id',
            'date',
            'user_id',
            'proyect_id',
            'proyect_id_code',
        ]