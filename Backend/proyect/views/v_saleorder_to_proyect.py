from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from sale_order.models.sale_order import M_sale_order
from sale_order.views.v_sale_order import sz_sale_order
from proyect.models.proyect import M_proyect
from proyect.serializers.sz_proyect import sz_proyect
from notifications.utils.notifications_ut import notify_sale_order_to_project

class V_sale_order_to_proyect(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, sale_order_id):
        try:
            sale_order = M_sale_order.objects.get(pk=sale_order_id)
        except M_sale_order.DoesNotExist:
            return Response({"error": "Sale order not found."}, status=status.HTTP_404_NOT_FOUND)

        if sale_order.state != "aprobado":
            return Response({"error": "Sale order is not approved."}, status=status.HTTP_400_BAD_REQUEST)

        # Verifica si ya existe un proyecto para esta oferta
        if M_proyect.objects.filter(sale_order_id=sale_order).exists():
            return Response({"error": "A project already exists for this sale order."}, status=status.HTTP_400_BAD_REQUEST)

        # Crea el proyecto
        proyect = M_proyect.objects.create(
            code=sale_order.code,
            status="planification",
            sale_order_id=sale_order,
            p_name=sale_order.name 
        )

        #se crea la notifiacion 
        notify_sale_order_to_project(sale_order, proyect)

        
        serializer = sz_proyect(proyect)
        return Response(serializer.data, status=status.HTTP_201_CREATED)