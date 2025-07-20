from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveAPIView, UpdateAPIView
from rest_framework.views import APIView
from sale_order.models.comentary_sale_order import M_comentary_sale_order
from sale_order.serializers.sz_comentary_sale_order import sz_comentary_sale_order, sz_comentary_sale_order_list, sz_comentary_sale_order_retrive
from django.shortcuts import get_object_or_404

class V_comentary_sale_order_create(CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = sz_comentary_sale_order
    
    def perform_create(self, serializer):
        return serializer.save()

class V_comentary_sale_order_list(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = sz_comentary_sale_order_list
    queryset = M_comentary_sale_order.objects.all()

class V_comentary_sale_order_retrive(RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = sz_comentary_sale_order_retrive
    queryset = M_comentary_sale_order.objects.all()

class V_comentary_sale_order_update(UpdateAPIView):
    permission_classes = [AllowAny]
    queryset = M_comentary_sale_order.objects.all()
    serializer_class = sz_comentary_sale_order
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        print(f"Actualizando comentario {instance.id}. Datos recibidos: {request.data}")
        
        # Asegurarnos que solo actualizamos la descripción
        data_to_update = {'description': request.data.get('description', instance.description)}
        
        serializer = self.get_serializer(instance, data=data_to_update, partial=True)
        if serializer.is_valid():
            self.perform_update(serializer)
            print(f"Comentario {instance.id} actualizado correctamente")
            return Response(serializer.data)
        
        print(f"Error al actualizar comentario: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class V_comentary_sale_order_list_by_oferta(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = sz_comentary_sale_order_list
    
    def get_queryset(self):
        oferta_id = self.kwargs.get('oferta_id')
        return M_comentary_sale_order.objects.filter(sale_order_id=oferta_id).order_by('-date')

# Nueva vista para obtener o crear un único comentario por oferta
class V_comentary_sale_order_get_or_create(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, oferta_id):
        """Obtener el último comentario de una oferta o None si no existe"""
        comentario = M_comentary_sale_order.objects.filter(sale_order_id=oferta_id).order_by('-date').first()
        if comentario:
            serializer = sz_comentary_sale_order_retrive(comentario)
            return Response(serializer.data)
        return Response({"message": "No hay comentarios para esta oferta"}, status=status.HTTP_404_NOT_FOUND)
    
    def post(self, request, oferta_id):
        """Crear un nuevo comentario o actualizar el último si ya existe"""
        comentario = M_comentary_sale_order.objects.filter(sale_order_id=oferta_id).order_by('-date').first()
        
        if comentario:
            # Actualizar comentario existente
            data_to_update = {'description': request.data.get('description')}
            serializer = sz_comentary_sale_order(comentario, data=data_to_update, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Crear nuevo comentario
            data = {
                'user_id': request.data.get('user_id'),
                'sale_order_id': oferta_id,
                'description': request.data.get('description'),
            }
            serializer = sz_comentary_sale_order(data=data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)