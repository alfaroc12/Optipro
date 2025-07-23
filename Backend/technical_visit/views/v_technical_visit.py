from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveAPIView, UpdateAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from technical_visit.models.technical_visit import M_technical_visit
from technical_visit.serializers.sz_technical_visit import sz_technical_visit, sz_technical_visit_list, sz_technical_visit_retrive
from django.db.models import F, Q
from function.paginator import Limit_paginator
import logging
import random
from django.db import transaction
from function.code_generators import generate_technical_visit_code_with_prefix

logger = logging.getLogger(__name__)

class V_technical_visit_create(CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = sz_technical_visit
    model_class = M_technical_visit

    def perform_create(self, serializer):
        try:
            # Generar código único antes de guardar usando la utilidad compartida con prefijo VT
            unique_code = generate_technical_visit_code_with_prefix()
            
            # Asignar el usuario actual y el código a la visita técnica
            if self.request.user.is_authenticated:
                return serializer.save(user_id=self.request.user, code=unique_code)
            return serializer.save(code=unique_code)
        except Exception as e:
            logger.error(f"Error al crear visita técnica: {str(e)}")
            raise
    
    def create(self, request, *args, **kwargs):
        try:
            logger.info("Iniciando creación de visita técnica")
            
            # Crear una copia mutable de los datos
            if hasattr(request.data, '_mutable'):
                request.data._mutable = True
            
            data = dict(request.data)
            evidence_files = []
            
            # Procesar archivos de evidencia de manera más eficiente
            if hasattr(request, 'FILES') and request.FILES:
                logger.info(f"Procesando {len(request.FILES)} archivos")
                for key in request.FILES.keys():
                    if key.startswith('evidence_photo'):
                        file_list = request.FILES.getlist(key)
                        evidence_files.extend(file_list)
                
                # Solo agregar si hay archivos
                if evidence_files:
                    data['evidence_photo'] = evidence_files
                    logger.info(f"Se agregaron {len(evidence_files)} archivos de evidencia")

            # Procesar campos de preguntas de manera optimizada
            question_data = {}
            question_fields = [f'Q_{i}' for i in range(1, 7)] + [f'Q_{i}_comentary' for i in range(1, 7)]
            
            for field in question_fields:
                field_key = f'question_id.{field}'
                if field_key in data:
                    value = data.pop(field_key)
                    if isinstance(value, list) and len(value) > 0:
                        question_data[field] = value[0]
                    elif value is not None:
                        question_data[field] = value
            
            if question_data:
                data['question_id'] = question_data
                logger.info(f"Procesadas {len(question_data)} respuestas de preguntas")

            # Crear el serializer con los datos procesados
            serializer = self.serializer_class(data=data, context={'request': request})
            
            if serializer.is_valid():
                try:
                    # Usar transacción atómica optimizada
                    with transaction.atomic():
                        instance = self.perform_create(serializer)
                    
                    logger.info(f"Visita técnica creada exitosamente: {instance.code}")
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                    
                except Exception as e:
                    logger.error(f"Error al guardar visita técnica: {str(e)}", exc_info=True)
                    return Response(
                        {"error": "Error interno al crear la visita técnica", "details": str(e)},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            else:
                logger.warning(f"Datos inválidos para crear visita técnica: {serializer.errors}")
                return Response({
                    "error": "Datos inválidos",
                    "messages": serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Error inesperado al crear visita técnica: {str(e)}", exc_info=True)
            return Response(
                {"error": "Error interno del servidor", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class V_technical_visit_list(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = sz_technical_visit_list
    pagination_class = Limit_paginator
    queryset = M_technical_visit.objects.all().order_by('-date_visit', '-id')  # Ordenar por fecha de visita descendente, luego por ID

    def get_queryset(self): #overwrite function get_queryset, permit alter queryset initial 
        queryset = super().get_queryset()
        query = self.request.query_params.get('query', None)
        user_id = self.request.query_params.get('user_id', None)

        # Filtrar por user_id si se proporciona
        if user_id is not None and user_id != "":
            queryset = queryset.filter(user_id=user_id)

        if query is not None and query != "":
            queryset = queryset.filter(
                Q(code__startswith=query) |
                Q(description_more__startswith=query)
            )
        return queryset
    
    def get(self, request, *args, **kwargs): #overwrite functoin get to change the default
        queryset = self.get_queryset()

        if not queryset.exists(): #if not exists data retur message error
            return Response({"message": "No results found."}, status=status.HTTP_200_OK)
        
        page = self.paginate_queryset(queryset) #asing function paginate_queryset with the queryset if valid the size of data

        if page is not None: #if page asing and return the queryset paginate
            serializer = self.get_serializer(page, many=True, context={'request': request})
            data = serializer.data

            return self.get_paginated_response(data)

        serializer = self.get_serializer(queryset, many=True, context={'request': request}) #if queryset not valid size for paginated return queryset initial in serializer
        data = serializer.data

        return Response(data, status=status.HTTP_200_OK)
    
class V_technical_visit_retrive(RetrieveAPIView): #class retrieve return response witch data filter for pk in request
    permission_classes = [AllowAny]
    model_class = M_technical_visit
    queryset = model_class.objects.all()
    serializer_class = sz_technical_visit_retrive
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

class V_technical_visit_update(UpdateAPIView): #class update have request post with data for update
    permission_classes = [AllowAny]
    model_class = M_technical_visit
    queryset = model_class.objects.all()
    serializer_class = sz_technical_visit
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def update(self, request, *args, **kwargs):
        data = request.data.copy()
        evidence_files = []
        if hasattr(request, 'FILES'):
            for key in request.FILES.keys():
                if key.startswith('evidence_photo'):
                    if isinstance(request.FILES.getlist(key), list):
                        evidence_files.extend(request.FILES.getlist(key))
                    else:
                        evidence_files.append(request.FILES[key])
        if evidence_files:
            data['evidence_photo'] = evidence_files
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=data, partial=partial)
        if serializer.is_valid():
            self.perform_update(serializer)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)