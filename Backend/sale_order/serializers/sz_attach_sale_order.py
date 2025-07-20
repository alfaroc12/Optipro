from rest_framework import serializers
from sale_order.models.attach_sale_order import M_attach_sale_order
# from .sz_sale_order import sz_sale_order_fk

class sz_attach_sale_order(serializers.ModelSerializer):
    class Meta:
        model = M_attach_sale_order
        fields = [
            'id',
            'date',
            'attach',
            'sale_order_id',
            'is_calculation_sheet',
            'uploaded_by',
        ]
        
    def create(self, validated_data):
        # Extraer información del archivo
        file = validated_data.get('attach')
        if file:
            validated_data['name'] = file.name
            validated_data['size'] = str(file.size)
            validated_data['content_type'] = file.content_type
        else:
            # Si no hay archivo, asignar valores predeterminados
            validated_data['name'] = 'Sin nombre'
            validated_data['size'] = '0'
            validated_data['content_type'] = 'application/octet-stream'

        try:
            return super().create(validated_data)
        except Exception as e:
            # Registrar el error para depuración
            print(f"Error al crear adjunto: {str(e)}")
            # Relanzar la excepción para que el ViewSet la capture
            raise

class sz_attach_sale_order_list(serializers.ModelSerializer):
    sale_order_id_code = serializers.CharField(source='sale_order_id.code', read_only=True)
    username = serializers.SerializerMethodField()
    
    def get_username(self, obj):
        # Prioridad al campo uploaded_by si existe
        if obj.uploaded_by:
            return obj.uploaded_by.username
        # De lo contrario, usar el user_id de la sale_order
        elif hasattr(obj.sale_order_id, 'user_id') and obj.sale_order_id.user_id:
            return obj.sale_order_id.user_id.username
        return "Usuario"
    
    class Meta:
        model = M_attach_sale_order
        fields = [
            'id',
            'date',
            'attach',
            'name',
            'size',
            'content_type',
            'is_calculation_sheet',
            'sale_order_id_code',
            'username',
            'uploaded_by',
        ]
        read_only_fields = fields

class sz_attach_sale_order_retrive(serializers.ModelSerializer):
    sale_order_id_code = serializers.CharField(source='sale_order_id.code', read_only=True)
    username = serializers.SerializerMethodField()
    
    def get_username(self, obj):
        # Prioridad al campo uploaded_by si existe
        if obj.uploaded_by:
            return obj.uploaded_by.username
        # De lo contrario, usar el user_id de la sale_order
        elif hasattr(obj.sale_order_id, 'user_id') and obj.sale_order_id.user_id:
            return obj.sale_order_id.user_id.username
        return "Usuario"
    
    class Meta:
        model = M_attach_sale_order
        fields = [
            'id',
            'date',
            'attach',
            'name',
            'size',
            'content_type',
            'is_calculation_sheet',
            'sale_order_id',
            'sale_order_id_code',
            'username',
            'uploaded_by',
        ]
        read_only_fields = fields

class sz_attach_sale_order_fk(serializers.ModelSerializer):
    class Meta:
        model = M_attach_sale_order
        fields = [
            'id',
            'attach',
            'is_calculation_sheet',
            'name',
        ]
        read_only_fields = fields