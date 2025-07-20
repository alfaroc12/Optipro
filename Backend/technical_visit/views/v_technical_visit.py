from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveAPIView, UpdateAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from technical_visit.models.technical_visit import M_technical_visit
from technical_visit.serializers.sz_technical_visit import sz_technical_visit, sz_technical_visit_list, sz_technical_visit_retrive
from django.db.models import F, Q
from function.paginator import Limit_paginator

class V_technical_visit_create(CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = sz_technical_visit
    model_class = M_technical_visit

    def perform_create(self, serializer):
        # Asignar el usuario actual a la visita técnica
        if self.request.user.is_authenticated:
            return serializer.save(user_id=self.request.user)
        return serializer.save()
    
    def create(self, request, *args, **kwargs):
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
            data.setlist('evidence_photo', evidence_files)

        # Reconstruir el diccionario para question_id
        question_fields = [f'Q_{i}' for i in range(1, 7)] + [f'Q_{i}_comentary' for i in range(1, 7)]
        question_data = {}
        for field in question_fields:
            value = data.pop(f'question_id.{field}', None)
            if value:
                question_data[field] = value[0] if isinstance(value, list) else value
        if question_data:
            data['question_id'] = question_data

        # --- AJUSTE: convertir QueryDict a dict plano para DRF ---
        from django.http import QueryDict
        if isinstance(data, QueryDict):
            data = data.dict()
            if evidence_files:
                data['evidence_photo'] = evidence_files
            if question_data:
                data['question_id'] = question_data
        # --- FIN AJUSTE ---

        serializer = self.serializer_class(data=data, context={'request': request})
        print(serializer)

        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        error_messages = {
            "error": "Data Invalid",
            "messages": serializer.errors
        }

        return Response(error_messages, status=status.HTTP_400_BAD_REQUEST)

class V_technical_visit_list(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = sz_technical_visit_list
    pagination_class = Limit_paginator
    queryset = M_technical_visit.objects.all()

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