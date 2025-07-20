from rest_framework import serializers
from person.models.person import M_person

class sz_person(serializers.ModelSerializer):
    class Meta:
        model = M_person
        fields = [
            'id',
            'type_identifacion',
            'identification',
            'firs_name',
            'other_name',
            'last_name',
            'secon_surname',
            'name',
            'addres',
            'city',
            'phone',
            'phone_2',
        ]
    
    def create(self, validated_data):
        # create name automatic
        if 'name' not in validated_data:
            validated_data['name'] = f"{validated_data['last_name']} {validated_data['secon_surname']} {validated_data['firs_name']} {validated_data['other_name']}"
        return super().create(validated_data)
    
class sz_person_fk(serializers.ModelSerializer):
    class Meta:
        model = M_person
        fields = [
            'id',
            'identification',
            'name',
        ]
        read_only_fields = fields
    
class sz_person_list(serializers.ModelSerializer):
    type_identifacion = serializers.SerializerMethodField()
    class Meta:
        model = M_person
        fields = [
            'id',
            'type_identifacion',
            'identification',
            'name',
            'addres',
            'city',
            'phone',
            'phone_2',
        ]
        read_only_fields = fields

    def get_type_identifacion(self, obj):
        return obj.get_type_identifacion_display()

class sz_person_retrive(serializers.ModelSerializer):
    class Meta:
        model = M_person
        fields = [
            'id',
            'type_identifacion',
            'identification',
            'firs_name',
            'other_name',
            'last_name',
            'secon_surname',
            'name',
            'addres',
            'city',
            'phone',
            'phone_2',
        ]
        read_only_fields = [
            'type_identifacion',
            'identification',
        ]