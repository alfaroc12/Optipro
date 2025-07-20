from rest_framework import serializers
from proyect.models.attach_proyect import M_attach_proyect

class sz_attach_proyect(serializers.ModelSerializer):
    class Meta:
        model = M_attach_proyect
        fields = '__all__'

    def create(self, validated_data):
        file = validated_data.get('attach')
        if file:
            validated_data['name'] = file.name
            validated_data['size'] = str(file.size)
            validated_data['content_type'] = file.content_type

        return super().create(validated_data)

class sz_attach_proyect_list(serializers.ModelSerializer):
    proyect_id_code = serializers.CharField(source='proyect_id.code', read_only=True)
    class Meta:
        model = M_attach_proyect
        fields = [
            'id',
            'date',
            'date_2',
            'fulfillment',
            'news',
            'attach',
            'name',
            'size',
            'content_type',
            'proyect_id_code',
        ]
        read_only_fields = fields

class sz_attach_proyect_retrive(serializers.ModelSerializer):
    proyect_id_code = serializers.CharField(source='proyect_id.code', read_only=True)
    class Meta:
        model = M_attach_proyect
        fields = [
            'id',
            'date',
            'date_2',
            'fulfillment',
            'news',
            'attach',
            'name',
            'size',
            'content_type',
            'proyect_id',
            'proyect_id_code',
        ]
        read_only_fields =[
            'id',
            'date',
            'date_2',
            'attach',
            'name',
            'size',
            'content_type',
            'proyect_id',
            'proyect_id_code',
        ]

class sz_attach_proyect_PowerBi(serializers.ModelSerializer):
    class Meta:
        model = M_attach_proyect
        fields = [
            'name',
            'proyect_id',
        ]
        read_only_fields = fields

