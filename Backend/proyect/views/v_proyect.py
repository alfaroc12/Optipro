from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveAPIView, UpdateAPIView, DestroyAPIView 
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from proyect.models import M_proyect, M_attach_proyect
from proyect.serializers.sz_proyect import sz_proyect, sz_proyect_retrive, sz_proyect_list, sz_proyect_powerBi
import os

from django.db.models import F, Q
from function.paginator import Limit_paginator

class V_proyect_create(CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = sz_proyect
    model_class = M_proyect

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
    
class V_proyect_list(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = sz_proyect_list
    pagination_class = Limit_paginator
    queryset = M_proyect.objects.all().order_by('-date', '-id')  # Ordenar por fecha descendente, luego por ID

    def get_queryset(self): #overwrite function get_queryset, permit alter queryset initial 
        queryset = super().get_queryset()
        query = self.request.query_params.get('query', None)

        if query is not None and query != "":
            queryset = queryset.filter(
                Q(code__startswith=query) |
                Q(status_choices__startswith=query)
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
    
class V_proyect_retrive(RetrieveAPIView): #class retrieve return response witch data filter for pk in request
    permission_classes = [AllowAny]
    model_class = M_proyect
    queryset = model_class.objects.all()
    serializer_class = sz_proyect_retrive

class V_proyect_update(UpdateAPIView):
    queryset = M_proyect.objects.all()
    permission_classes = [AllowAny]
    serializer_class = sz_proyect_retrive


class V_proyect_delete(DestroyAPIView):
    permission_classes = [AllowAny]
    queryset = M_proyect.objects.all()

    def delete(self, request, *args, **kwargs):
        try:
            proyecto = self.get_object()

            # Buscar y eliminar archivos físicos
            archivos = M_attach_proyect.objects.filter(proyect_id=proyecto)
            for archivo in archivos:
                try:
                    if archivo.attach and os.path.isfile(archivo.attach.path):
                        os.remove(archivo.attach.path)
                except Exception as e:
                    print(f"Error eliminando archivo {archivo.attach.name}: {str(e)}")

            # Eliminar el proyecto
            self.perform_destroy(proyecto)
            return Response({'mensaje': 'Proyecto eliminado correctamente.'}, status=status.HTTP_204_NO_CONTENT)
            
        except Exception as e:
            return Response(
                {"error": f"Error al eliminar el proyecto: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class V_proyect_export(ListAPIView):
    queryset = M_proyect.objects.all()
    serializer_class = sz_proyect_powerBi
    pagination_class = None  
    permission_classes = [AllowAny]

class UpdateProjectProgress(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk):
        try:
            project = M_proyect.objects.get(pk=pk)
        except M_proyect.DoesNotExist:
            return Response({'error': 'Project not found'}, status=status.HTTP_404_NOT_FOUND)
        progress = request.data.get('progress_percentage')
        if progress is not None:
            project.progress_percentage = progress
            project.save()
            return Response({'success': True}, status=status.HTTP_200_OK)
        return Response({'error': 'Missing progress'}, status=status.HTTP_400_BAD_REQUEST)