from rest_framework import serializers
from sale_order.models.comentary_sale_order import M_comentary_sale_order

class sz_comentary_sale_order(serializers.ModelSerializer):
    class Meta:
        model = M_comentary_sale_order
        fields = [
            'id',
            'user_id',
            'sale_order_id',
            'description',
            'date',
        ]
        read_only_fields = ['date']  # Permitir actualizar los otros campos

class sz_comentary_sale_order_list(serializers.ModelSerializer):
    sale_order_id_code = serializers.CharField(source='sale_order_id.code', read_only=True)
    class Meta:
        model = M_comentary_sale_order
        fields = [
            'id',
            'user_id',
            'sale_order_id_code',
            'description',
            'date',
        ]
        read_only_fields = fields

class sz_comentary_sale_order_fk(serializers.ModelSerializer):
    sale_order_id_code = serializers.CharField(source='sale_order_id.code', read_only=True)
    class Meta:
        model = M_comentary_sale_order
        fields = [
            'id',
            'user_id',
            'sale_order_id_code',
            'description',
            'date',
        ]
        read_only_fields = fields

class sz_comentary_sale_order_retrive(serializers.ModelSerializer):
    sale_order_id_code = serializers.CharField(source='sale_order_id.code', read_only=True)
    class Meta:
        model = M_comentary_sale_order
        fields = '__all__'
        read_only_fields = [
            'id',
            'sale_order_id',
            'date',
        ]
