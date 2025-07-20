from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveAPIView, UpdateAPIView
from sale_order.models.attach_sale_order import M_attach_sale_order
from sale_order.serializers.sz_attach_sale_order import sz_attach_sale_order, sz_attach_sale_order_retrive, sz_attach_sale_order_list

from django.db.models import F, Q
from function.paginator import Limit_paginator

class V_attach_sale_order_create(CreateAPIView):
    permission_classes = [AllowAny]  # Temporalmente volvemos a AllowAny hasta resolver el problema de autenticación
    serializer_class = sz_attach_sale_order
    model_class = M_attach_sale_order
    
    def perform_create(self, serializer):
        try:
            # Registrar los datos validados
            import logging
            import traceback
            logger = logging.getLogger(__name__)
            
            # Obtener el archivo
            file = serializer.validated_data.get('attach')
            if file:
                logger.info(f"Archivo a guardar: nombre={file.name}, tipo={file.content_type}, tamaño={file.size}")
            
            # Si el usuario está autenticado, asignar el usuario actual
            if self.request.user and self.request.user.is_authenticated:
                logger.info(f"Usuario autenticado: {self.request.user.username}")
                return serializer.save(uploaded_by=self.request.user)
            else:
                logger.info("Usuario no autenticado, guardando sin uploaded_by")
                return serializer.save()
        except Exception as e:
            # Registrar el error detallado
            import logging
            import traceback
            logger = logging.getLogger(__name__)
            logger.error(f"Error al guardar adjunto: {str(e)}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise
            
    def create(self, request, *args, **kwargs):
        try:
            # Importamos el módulo logging solo una vez
            import logging
            import traceback
            logger = logging.getLogger(__name__)
            
            # Registrar los datos recibidos para depuración
            logger.info(f"Datos recibidos para crear adjunto: {request.data}")
            logger.info(f"Headers: {request.headers}")
            logger.info(f"Usuario autenticado: {request.user.is_authenticated if hasattr(request, 'user') else 'Sin usuario'}")
            
            # SOLUCIÓN SIMPLIFICADA: Usar directamente los datos sin modificar
            serializer = self.serializer_class(data=request.data)
            
            if serializer.is_valid():
                try:
                    instance = self.perform_create(serializer)
                    logger.info(f"Adjunto creado exitosamente: ID={instance.id if instance else 'desconocido'}")
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                except Exception as e:
                    logger.error(f"Error al crear adjunto: {str(e)}")
                    logger.error(traceback.format_exc())
                    return Response(
                        {"error": f"Error al guardar el archivo: {str(e)}"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            else:
                logger.error(f"Error de validación: {serializer.errors}")
                return Response(
                    {"error": "Datos inválidos", "detail": serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        except Exception as e:
            import traceback
            logger.error(f"Error inesperado: {str(e)}")
            logger.error(traceback.format_exc())
            return Response(
                {"error": "Error interno del servidor", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR            )

class V_attach_sale_order_list(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = sz_attach_sale_order_list
    pagination_class = Limit_paginator
    queryset = M_attach_sale_order.objects.all()
    
    def get_queryset(self): #overwrite function get_queryset, permit alter queryset initial 
        queryset = super().get_queryset()
        query = self.request.query_params.get('query', None)
        sale_order = self.request.query_params.get('sale_order', None)

        if query is not None and query != "":
            queryset = queryset.filter(
                Q(date__startswith=query) |
                Q(name__startswith=query)
            )
        
        # Filtrar por id de oferta si se proporciona
        if sale_order is not None and sale_order != "":
            queryset = queryset.filter(sale_order_id=sale_order)
            return queryset
    
    def get(self, request, *args, **kwargs): #overwrite functoin get to change the default
        queryset = self.get_queryset()

        if not queryset.exists(): #if not exists data retur message error
            return Response({"message": "No results found."}, status=status.HTTP_200_OK)
        
        page = self.paginate_queryset(queryset) #asing function paginate_queryset with the queryset if valid the size of data

        if page is not None: #if page asing and return the queryset paginate
            serializer = self.get_serializer(page, many=True)
            data = serializer.data

            return self.get_paginated_response(data)

        serializer = self.get_serializer(queryset, many=True) #if queryset not valid size for paginated return queryset initial in serializer
        data = serializer.data

        return Response(data, status=status.HTTP_200_OK)
    
class V_attach_sale_order_retrive(RetrieveAPIView): #class retrieve return response witch data filter for pk in request
    permission_classes = [AllowAny]
    model_class = M_attach_sale_order
    queryset = model_class.objects.all()
    serializer_class = sz_attach_sale_order_retrive

class V_attach_sale_order_update(UpdateAPIView): #class update have request post with data for update
    permission_classes = [AllowAny]
    model_class = M_attach_sale_order
    queryset = model_class.objects.all()
    serializer_class = sz_attach_sale_order_retrive