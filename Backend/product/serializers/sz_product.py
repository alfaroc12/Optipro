from rest_framework import serializers
from product.models.product import M_product
from product.serializers.sz_category import sz_category_fk

class sz_product(serializers.ModelSerializer):
    class Meta:
        model = M_product
        fields = [
            'id',
            'code',
            'name',
            'description',
            'active',
            'type_product',
            'cost',
            'price',
            'category_id',
        ]

class sz_product_list(serializers.ModelSerializer):
    category_id = serializers.CharField(source='category_id.name', read_only=True)
    class Meta:
        model = M_product
        fields = [
            'id',   
            'code',
            'name',
            'description',
            'type_product',
            'cost',
            'price',
            'category_id',
        ]
        read_only_fields = fields

class sz_product_fk(serializers.ModelSerializer):
    class Meta:
        model = M_product
        fields = [
            'id',
            'code',
            'name',
        ]
        read_only_fields = fields

class sz_product_retrive(serializers.ModelSerializer):
    category = sz_category_fk(source='category_id', read_only=True)
    class Meta:
        model = M_product
        fields = [
            'id',
            'code',
            'name',
            'description',
            'active',
            'type_product',
            'cost',
            'price',
            'category_id',
            'category',
        ]
        read_only_fields = [
            'id',
            'code',
            'category',
        ]