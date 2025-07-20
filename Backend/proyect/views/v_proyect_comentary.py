from rest_framework.generics import CreateAPIView,ListAPIView, RetrieveAPIView,UpdateAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from proyect.models.proyect_comentary import M_proyect_comentary
from proyect.serializers.sz_proyect_comentary import sz_proyect_comentary, sz_proyect_comentary_retrive, sz_proyect_comentary_list


from django.db.models import F, Q
from function.paginator import Limit_paginator


class V_proyect_comentary_create(CreateAPIView):  #create
    permission_classes = [AllowAny]
    serializer_class = sz_proyect_comentary
    model_class = M_proyect_comentary

    def perform_create(self, serializer):
        return serializer.save()
    
    def create(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)

        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        error_messages = {
            "error": "Data Invalide",
            "messages":serializer.errors
        }

        return Response(error_messages, status=status.HTTP_400_BAD_REQUEST)

class V_proyect_comentary_list(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = sz_proyect_comentary_list
    pagination_class = Limit_paginator
    queryset = M_proyect_comentary.objects.all()

    def get_queryset(self): #overwrite function get_queryset, permit alter queryset initial 
        queryset = super().get_queryset()
        query = self.request.query_params.get('query', None)

        if query is not None and query != "":
            queryset = queryset.filter(
                Q(date__startswith=query) 
            )
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
    
class V_proyect_comentary_retrive(RetrieveAPIView): #class retrieve return response witch data filter for pk in request
    permission_classes = [AllowAny]
    model_class = M_proyect_comentary
    queryset = model_class.objects.all()
    serializer_class = sz_proyect_comentary_retrive

class V_proyect_comentary_update(UpdateAPIView): #class update have request post with data for update
    permission_classes = [AllowAny]
    model_class = M_proyect_comentary
    queryset = model_class.objects.all()
    serializer_class = sz_proyect_comentary_retrive
