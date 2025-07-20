from rest_framework import serializers
from proyect.models.proyect import M_proyect
from proyect.models.proyect_comentary import M_proyect_comentary
from proyect.serializers.sz_proyect_comentary import sz_proyect_comentary_retrive
from proyect.models.attach_proyect import M_attach_proyect
from proyect.serializers.sz_attach_proyect import sz_attach_proyect_list
from sale_order.serializers.sz_sale_order import sz_sale_order, sz_sale_order_retrive

class sz_proyect(serializers.ModelSerializer):
    class Meta:
        model = M_proyect
        fields = [
            'id',
            'date',
            'code',
            'status',
            'sale_order_id',
        ]

class sz_proyect_list(serializers.ModelSerializer):
    sale_order_city = serializers.CharField(source='sale_order_id.city', read_only=True)
    sale_order_representante = serializers.CharField(source='sale_order_id.representante', read_only=True)
    sale_order_power_required = serializers.CharField(source='sale_order_id.power_required', read_only=True)
    sale_order_total_quotation = serializers.CharField(source='sale_order_id.total_quotation', read_only=True)
    class Meta:
        model = M_proyect
        fields = [
            'id',
            'p_name',
            'date',
            'code',
            'status',
            'sale_order_city',
            'sale_order_representante',
            'sale_order_power_required',
            'sale_order_total_quotation',
        ]
        read_only_fields = fields




class sz_proyect_fk(serializers.ModelSerializer):
    sale_order_id_name = serializers.CharField(source='sale_order_id.code', read_only=True)
    class Meta:
        model = M_proyect
        fields = [
            'id',
            'code',
            'sale_order_id_name',
        ]
        read_only_fields = fields

class sz_proyect_retrive(serializers.ModelSerializer):
    sale_order = sz_sale_order(source='sale_order_id')
    comentaries = serializers.SerializerMethodField()
    attachments = serializers.SerializerMethodField()

    class Meta:
        model = M_proyect
        fields = [
            'id',
            'p_name',
            'date',
            'code',
            'status',
            'sale_order',         
            'comentaries',
            'attachments',
        ]
        read_only_fields = ['id', 'date']

    def update(self, instance, validated_data):
        sale_order_data = validated_data.pop('sale_order_id', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if sale_order_data:
            sale_order_instance = instance.sale_order_id
            sale_order_data.pop('code', None)  
            for attr, value in sale_order_data.items():
                setattr(sale_order_instance, attr, value)
            sale_order_instance.save()

        return instance



    def get_comentaries(self, obj):
        comentarios = M_proyect_comentary.objects.filter(proyect_id=obj)
        return sz_proyect_comentary_retrive(comentarios, many=True).data
    def get_attachments(self, obj):
        attaches = M_attach_proyect.objects.filter(proyect_id=obj)
        return sz_attach_proyect_list(attaches, many=True).data
    
# esto es power full
class sz_proyect_powerBi(serializers.ModelSerializer):
    sale_order_id = sz_sale_order_retrive()
    attachments = serializers.SerializerMethodField()

    class Meta:
        model = M_proyect
        fields = [
            'id',
            'date',
            'p_name',
            'attachments',
            'code',
            'status',
            'sale_order_id',
        ]
        read_only_fields = fields

    def get_attachments(self, obj):
        return M_attach_proyect.objects.filter(proyect_id=obj.id).count()

