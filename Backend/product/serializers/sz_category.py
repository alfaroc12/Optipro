from rest_framework import serializers
from product.models.category import M_category

class sz_category(serializers.ModelSerializer):
    class Meta:
        model = M_category
        fields = [
            'id',
            'code',
            'name',
        ]

class sz_category_list(serializers.ModelSerializer):
    class Meta:
        model = M_category
        fields = [
            'id',
            'code',
            'name',
        ]
        read_only_fields = fields

class sz_category_fk(serializers.ModelSerializer):
    class Meta:
        model = M_category
        fields = [
            'id',
            'code',
            'name',
        ]
        read_only_fields = fields

class sz_category_retrive(serializers.ModelSerializer):
    class Meta:
        model = M_category
        fields = [
            'id',
            'code',
            'name',
        ]
        read_only_fields = [
            'id',
            'code',
        ]