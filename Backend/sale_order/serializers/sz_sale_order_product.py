# from rest_framework import serializers
# from sale_order.models.sale_order_product import M_sale_order_product
# from product.models.product import M_product
# from product.serializers.sz_product import sz_product_fk

# class sz_sale_order_product(serializers.ModelSerializer):
#     product_id = serializers.PrimaryKeyRelatedField(queryset=M_product.objects.all())
#     class Meta:
#         model = M_sale_order_product
#         fields = [
#             'id',
#             'product_id',
#         ]

# class sz_sale_order_product_list(serializers.ModelSerializer):
#     product_id_name = sz_product_fk(source='product_id.name', read_only=True)
#     sale_order_id_code = serializers.CharField(source='sale_order_id.code', read_only=True)
#     class Meta:
#         model = M_sale_order_product
#         fields = [
#             'id',
#             'product_id',
#             'sale_order_id',
#             'product_id_name',
#             'sale_order_id_code',
#         ]
#         read_only_fields = fields

# class sz_sale_order_product_retrive(serializers.ModelSerializer):
#     class Meta:
#         model = M_sale_order_product
#         fields = [
#             'id',
#             'product_id',
#             'sale_order_id',
#         ]
#         read_only_fields = [
#             'id',
#             'sale_order_id',
#         ]