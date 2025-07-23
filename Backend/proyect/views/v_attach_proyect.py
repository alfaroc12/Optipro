from rest_framework.generics import CreateAPIView,ListAPIView, RetrieveAPIView, UpdateAPIView, DestroyAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from proyect.models.attach_proyect import M_attach_proyect
from proyect.serializers.sz_attach_proyect import sz_attach_proyect, sz_attach_proyect_retrive, sz_attach_proyect_list, sz_attach_proyect_PowerBi
from django.db.models import F, Q
from function.paginator import Limit_paginator
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from proyect.models.proyect import M_proyect
from notifications.utils.notifications_ut import notify_new_project_attachment
import os



class AttachProyect(APIView):
    """
    Vista para subir archivos a un proyecto existente.
    """
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, format=None):
        # Verifica que se envíe el archivo
        file = request.FILES.get('attach')
        if not file:
            return Response({'error': 'No se envió ningún archivo.'}, status=status.HTTP_400_BAD_REQUEST)

        # Verifica que se envíe el ID del proyecto
        proyect_id = request.data.get('proyect_id')
        if not proyect_id:
            return Response({'error': 'Falta el campo proyect_id.'}, status=status.HTTP_400_BAD_REQUEST)

        # Verifica que el proyecto exista
        try:
            proyecto = M_proyect.objects.get(pk=proyect_id)
        except M_proyect.DoesNotExist:
            return Response({'error': 'El proyecto no existe.'}, status=status.HTTP_404_NOT_FOUND)

        # Prepara los datos para el serializer
        data = {
            'attach': file,
            'proyect_id': proyect_id,
            # Los siguientes campos se pueden autocompletar en el serializer si lo prefieres
            'name': file.name,
            'size': str(file.size),
            'content_type': file.content_type or '',
        }


        serializer = sz_attach_proyect(data=data)
        if serializer.is_valid():
            attach_obj = serializer.save()

            # Notificar a los administradores (puedes cambiar request.user si tienes autenticación)

            notify_new_project_attachment(attach_obj, request.user if request.user.is_authenticated else None)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response({'error': 'Datos inválidos', 'details': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        


class V_attach_proyect_list(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = sz_attach_proyect_list
    pagination_class = Limit_paginator
    queryset = M_attach_proyect.objects.all().order_by('-id')  # Ordenar por ID descendente (más recientes primero)

    def get_queryset(self): #overwrite function get_queryset, permit alter queryset initial 
        queryset = super().get_queryset()
        query = self.request.query_params.get('query', None)

        if query is not None and query != "":
            queryset = queryset.filter(
                Q(date__startswith=query) |
                Q(name__startswith=query)
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
    
class V_attach_proyect_retrive(RetrieveAPIView): #class retrieve return response witch data filter for pk in request
    permission_classes = [AllowAny]
    model_class = M_attach_proyect
    queryset = model_class.objects.all()
    serializer_class = sz_attach_proyect_retrive

class V_attach_proyect_update(UpdateAPIView): #class update have request post with data for update
    permission_classes = [AllowAny]
    model_class = M_attach_proyect
    queryset = model_class.objects.all()
    serializer_class = sz_attach_proyect_retrive

class V_attach_proyect_delete(DestroyAPIView):
    permission_classes = [AllowAny]
    queryset = M_attach_proyect.objects.all()
    serializer_class = sz_attach_proyect_retrive
    parser_classes = [MultiPartParser, FormParser]  # Permite manejar archivos adjuntos

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        file_path = instance.attach.path  # Ruta completa del archivo
        file_name = instance.name # nombre del archivo
        if os.path.exists(file_path):
            os.remove(file_path)
        self.perform_destroy(instance)
        return Response(
            {
                "message": f"El archivo '{file_name}' ha sido eliminado correctamente.",
            },
            status=status.HTTP_200_OK
        )


class V_attach_proyect_PowerBi(ListAPIView):
    queryset = M_attach_proyect.objects.all()
    serializer_class = sz_attach_proyect_PowerBi
    pagination_class = None  
    permission_classes = [AllowAny]
