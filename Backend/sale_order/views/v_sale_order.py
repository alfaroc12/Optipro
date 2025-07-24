from time import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.generics import CreateAPIView, ListAPIView, RetrieveAPIView, UpdateAPIView, DestroyAPIView
from sale_order.models.sale_order import M_sale_order
from sale_order.serializers.sz_sale_order import sz_sale_order, sz_sale_order_retrive, sz_sale_order_list

from django.db.models import F, Q
from django.db import transaction
from function.paginator import Limit_paginator
from sale_order.models.attach_sale_order import M_attach_sale_order
from sale_order.models.comentary_sale_order import M_comentary_sale_order
from proyect.models.proyect import M_proyect
from notifications.utils.notifications_ut import notify_sale_order_status_change  # <--- Importa la utilidad
from notifications.utils.notifications_ut import notify_admins_quote_reminder
from notifications.utils.notifications_ut import notify_admins_sale_order
from django.http import FileResponse, Http404
from datetime import timedelta
from django.utils import timezone
import logging

# Configurar logger
logger = logging.getLogger(__name__)

class V_sale_order_create(CreateAPIView):
    permission_classes = [IsAuthenticated]  # Cambiamos a IsAuthenticated para asegurar que hay un usuario
    serializer_class = sz_sale_order
    model_class = M_sale_order
    
    def perform_create(self, serializer):
        sale_order = serializer.save(user_id=self.request.user)
        notify_admins_sale_order(sale_order)
        return serializer.save(user_id=self.request.user)
        
    def create(self, request, *args, **kwargs):
        # Pasar el request en el contexto para acceder a los archivos
        serializer = self.serializer_class(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            # Guardamos y capturamos la instancia de la cotización
            instance = self.perform_create(serializer)

        
            notify_admins_quote_reminder.apply_async(
                args=[instance.id],
                eta=timezone.now() + timedelta(days=3) 
            )
        
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        # Si hubo errores en la validación, los devolvemos
        error_messages = {
            "error": "data invalid",
            "messages": serializer.errors
        }
        return Response(error_messages, status=status.HTTP_400_BAD_REQUEST)


class V_sale_order_list(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = sz_sale_order_list
    pagination_class = Limit_paginator
    queryset = M_sale_order.objects.all().order_by('-id')  # Ordenar por ID descendente (más recientes primero)

    def get_queryset(self): #overwrite function get_queryset, permit alter queryset initial 
        queryset = super().get_queryset()
        query = self.request.query_params.get('query', None)

        if query is not None and query != "":
            queryset = queryset.filter(
                Q(code__startswith=query) |
                Q(state__startswith=query)
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
    

    
class V_sale_order_retrive(RetrieveAPIView): #class retrieve return response witch data filter for pk in request
    permission_classes = [AllowAny]
    model_class = M_sale_order
    queryset = model_class.objects.all()
    serializer_class = sz_sale_order_retrive
    
    def retrieve(self, request, *args, **kwargs):
        try:
            sale_order_id = kwargs.get('pk')
            logger.info(f"Attempting to retrieve sale_order with ID: {sale_order_id}")
            
            # Verificar primero si la oferta existe
            if not M_sale_order.objects.filter(id=sale_order_id).exists():
                logger.warning(f"Sale order with ID {sale_order_id} not found")
                return Response(
                    {
                        "error": "Oferta no encontrada",
                        "message": f"La oferta con ID {sale_order_id} ya no existe o ha sido eliminada.",
                        "code": "SALE_ORDER_NOT_FOUND"
                    }, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            instance = self.get_object()
            logger.info(f"Found sale_order: {instance.code} (ID: {instance.id})")
            
            # Verificar si tiene technical_visit_id
            if instance.technical_visit_id:
                logger.info(f"Sale order has technical visit: {instance.technical_visit_id.id}")
            else:
                logger.info("Sale order has no associated technical visit")
            
            serializer = self.get_serializer(instance)
            logger.info("Serialization completed successfully")
            return Response(serializer.data)
            
        except M_sale_order.DoesNotExist:
            sale_order_id = kwargs.get('pk')
            logger.warning(f"Sale order with ID {sale_order_id} not found (DoesNotExist)")
            return Response(
                {
                    "error": "Oferta no encontrada",
                    "message": f"La oferta con ID {sale_order_id} ya no existe o ha sido eliminada.",
                    "code": "SALE_ORDER_NOT_FOUND"
                }, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            sale_order_id = kwargs.get('pk')
            logger.error(f"Error en retrieve sale_order {sale_order_id}: {e}", exc_info=True)
            return Response(
                {
                    "error": "Error interno del servidor",
                    "message": f"Ocurrió un error al obtener la oferta con ID {sale_order_id}. Por favor, contacte al administrador.",
                    "code": "INTERNAL_ERROR",
                    "details": str(e) if hasattr(e, '__str__') else "Error desconocido"
                }, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class V_sale_order_update(UpdateAPIView): #class update have request post with data for update
    permission_classes = [AllowAny]
    model_class = M_sale_order
    queryset = model_class.objects.all()
    serializer_class = sz_sale_order_retrive
    
    def update(self, request, *args, **kwargs):
        print("--------- DATOS DE LA SOLICITUD ---------")
        print("Método:", request.method)
        print("Content-Type:", request.content_type)
        print("DATA:", request.data)
        print("FILES:", request.FILES)
        print("archivos_a_eliminar:", request.data.get('archivos_a_eliminar'))
        print("------------------------------------------")
        
        instance = self.get_object()
        old_state = instance.state  

        # Depurar los datos recibidos para actualización
        print("Datos recibidos en UPDATE:")
        for key, value in request.data.items():
            print(f"  - Campo: {key}, Valor: {value}")

        # Añadir depuración para ver qué archivos se reciben
        print("Archivos recibidos en UPDATE:")
        for field_name, file_obj in request.FILES.items():
            print(f"  - Campo: {field_name}, Archivo: {file_obj.name}, Tamaño: {file_obj.size}")
        
        # Primero actualizamos la instancia con los datos recibidos
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
    
        # Después de la actualización, procesamos los archivos adjuntos
        if hasattr(request, 'FILES') and request.FILES:
            # Procesamos primero la hoja de cálculo para implementar la lógica de reemplazo
            # Verificamos si estamos recibiendo una hoja de cálculo
            hoja_calculo_fields = ['hojaCalculo', 'hoja_calculo']
            for field_name in hoja_calculo_fields:
                if field_name in request.FILES:
                    files = request.FILES.getlist(field_name)
                    for archivo in files:
                        print(f"Procesando hoja de cálculo: {archivo.name}")
                        content_type = archivo.content_type
                        if len(content_type) > 100:  # Ajustamos a 100 para mayor flexibilidad
                            content_type = content_type[:100]
                        
                        is_calculation_sheet = True
                        name = f"Hoja de Cálculo - {archivo.name}"
                        
                        # Buscar y eliminar hojas de cálculo anteriores
                        old_sheets = M_attach_sale_order.objects.filter(
                            sale_order_id=instance,
                            is_calculation_sheet=True
                        )
                        
                        if old_sheets.exists():
                            print(f"Eliminando {old_sheets.count()} hojas de cálculo anteriores")
                            for old_sheet in old_sheets:
                                try:
                                    # Eliminar el archivo físico
                                    if old_sheet.attach:
                                        if old_sheet.attach.storage.exists(old_sheet.attach.name):
                                            old_sheet.attach.delete()
                                    # Eliminar el registro de la BD
                                    old_sheet.delete()
                                    print(f"Hoja de cálculo anterior eliminada: {old_sheet.name}")
                                except Exception as e:
                                    print(f"Error al eliminar hoja de cálculo anterior: {str(e)}")
                        
                        # Crear el registro del archivo adjunto
                        try:
                            attachment = M_attach_sale_order.objects.create(
                                attach=archivo,
                                sale_order_id=instance,
                                name=name,
                                size=str(archivo.size),
                                content_type=content_type,
                                is_calculation_sheet=True
                            )
                            print(f"Nueva hoja de cálculo guardada correctamente: {name}, ID: {attachment.id}")
                        except Exception as e:
                            print(f"Error al guardar hoja de cálculo {name}: {str(e)}")
        
            # Procesamos archivos adjuntos generales
            for field_name in ['archivos_adjuntos', 'archivos_generales']:
                if field_name in request.FILES:
                    files = request.FILES.getlist(field_name)
                    for archivo in files:
                        print(f"Procesando archivo adjunto general: {archivo.name}")
                        content_type = archivo.content_type
                        if len(content_type) > 100:
                            content_type = content_type[:100]
                        
                        # Crear el registro del archivo adjunto
                        try:
                            attachment = M_attach_sale_order.objects.create(
                                attach=archivo,
                                sale_order_id=instance,
                                name=archivo.name,
                                size=str(archivo.size),
                                content_type=content_type,
                                is_calculation_sheet=False
                            )
                            print(f"Archivo adjunto general guardado correctamente: {archivo.name}, ID: {attachment.id}")
                        except Exception as e:
                            print(f"Error al guardar archivo adjunto general {archivo.name}: {str(e)}")
                        
        # Procesamos la eliminación explícita de la hoja de cálculo si se solicita
        if request.data.get('eliminar_hoja_calculo') == 'true':
            print("Se solicitó eliminar la hoja de cálculo")
            old_sheets = M_attach_sale_order.objects.filter(
                sale_order_id=instance,
                is_calculation_sheet=True
            )
            
            if old_sheets.exists():
                print(f"Eliminando {old_sheets.count()} hojas de cálculo")
                for old_sheet in old_sheets:
                    try:
                        # Eliminar el archivo físico
                        if old_sheet.attach:
                            if old_sheet.attach.storage.exists(old_sheet.attach.name):
                                old_sheet.attach.delete()
                        # Eliminar el registro de la BD
                        old_sheet.delete()
                        print(f"Hoja de cálculo eliminada: {old_sheet.name}")
                    except Exception as e:
                        print(f"Error al eliminar hoja de cálculo: {str(e)}")
            else:
                print("No se encontraron hojas de cálculo para eliminar")
                
        # Procesamos la eliminación de archivos adjuntos específicos si se solicita
        archivos_a_eliminar = request.data.get('archivos_a_eliminar')
        if archivos_a_eliminar:
            try:
                import json
                # Intentamos interpretar como JSON si es string
                if isinstance(archivos_a_eliminar, str):
                    try:
                        archivos_ids = json.loads(archivos_a_eliminar)
                    except:
                        archivos_ids = [int(archivos_a_eliminar)]
                else:
                    archivos_ids = archivos_a_eliminar
                
                print(f"IDs de archivos a eliminar: {archivos_ids}")
                # Eliminar los archivos específicos
                for archivo_id in archivos_ids:
                    try:
                        archivo = M_attach_sale_order.objects.get(id=archivo_id)
                        if archivo.attach:
                            if archivo.attach.storage.exists(archivo.attach.name):
                                archivo.attach.delete()
                        archivo.delete()
                        print(f"Archivo eliminado correctamente: ID={archivo_id}")
                    except M_attach_sale_order.DoesNotExist:
                        print(f"No se encontró el archivo con ID={archivo_id}")
                    except Exception as e:
                        print(f"Error al eliminar archivo con ID={archivo_id}: {str(e)}")
            except Exception as e:
                print(f"Error al procesar archivos_a_eliminar: {str(e)}")
        
        # Nuevo: Procesamos la eliminación de archivos por nombre si se proporcionan nombres
        archivos_nombres_eliminar = request.data.get('archivos_nombres_eliminar')
        if archivos_nombres_eliminar:
            try:
                import json
                # Intentamos interpretar como JSON si es string
                if isinstance(archivos_nombres_eliminar, str):
                    try:
                        nombres_archivos = json.loads(archivos_nombres_eliminar)
                    except:
                        nombres_archivos = [archivos_nombres_eliminar]
                else:
                    nombres_archivos = archivos_nombres_eliminar
                
                print(f"Nombres de archivos a eliminar: {nombres_archivos}")
                
                # Buscar y eliminar archivos por nombre
                for nombre in nombres_archivos:
                    try:
                        archivos = M_attach_sale_order.objects.filter(
                            sale_order_id=instance,
                            name=nombre
                        )
                        
                        if archivos.exists():
                            for archivo in archivos:
                                if archivo.attach:
                                    if archivo.attach.storage.exists(archivo.attach.name):
                                        archivo.attach.delete()
                                archivo.delete()
                                print(f"Archivo eliminado por nombre: {nombre}")
                        else:
                            print(f"No se encontró archivo con nombre: {nombre}")
                    except Exception as e:
                        print(f"Error al eliminar archivo por nombre {nombre}: {str(e)}")
            except Exception as e:
                print(f"Error al procesar archivos_nombres_eliminar: {str(e)}")
                    
        # Refrescamos la instancia para obtener los datos actualizados
        instance.refresh_from_db()
        new_state = instance.state

        # Notificamos si cambió el estado
        if old_state != new_state:
            notify_sale_order_status_change(instance, old_state, new_state)

        return Response(serializer.data)
            
class V_sale_order_delete(DestroyAPIView): # Clase para eliminar ofertas
    permission_classes = [AllowAny]
    model_class = M_sale_order
    queryset = model_class.objects.all()
    serializer_class = sz_sale_order_retrive
    http_method_names = ['delete']  # Aseguramos que solo acepte solicitudes DELETE
    
    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            sale_order_id = instance.id
            
            # Verificar si existen proyectos relacionados con esta oferta
            proyectos_relacionados = M_proyect.objects.filter(sale_order_id=sale_order_id)
            
            if proyectos_relacionados.exists():
                # Obtener los códigos de los proyectos relacionados para el mensaje
                codigos_proyectos = list(proyectos_relacionados.values_list('code', flat=True))
                proyectos_str = ', '.join(codigos_proyectos)
                
                return Response(
                    {
                        "error": f"Esta oferta no se puede eliminar porque está asociada a {proyectos_relacionados.count()} proyecto(s): {proyectos_str}. "
                                f"Primero debe eliminar o reasignar los proyectos relacionados."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Usamos transacción para asegurar que todo se elimina o nada
            with transaction.atomic():
                # 1. Primero eliminamos los archivos adjuntos relacionados
                attachments = M_attach_sale_order.objects.filter(sale_order_id=sale_order_id)
                for attachment in attachments:
                    # Si queremos eliminar también los archivos físicos:
                    if attachment.attach:
                        try:
                            if attachment.attach.storage.exists(attachment.attach.name):
                                attachment.attach.delete()
                        except Exception as e:
                            print(f"Error al eliminar archivo físico: {str(e)}")
                # Eliminamos todos los registros de attachments de una vez
                attachments.delete()
                
                # 2. Eliminamos los comentarios relacionados
                M_comentary_sale_order.objects.filter(sale_order_id=sale_order_id).delete()
                
                # 3. Finalmente eliminamos la oferta
                self.perform_destroy(instance)
            
            return Response({"message": "Oferta eliminada correctamente"}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response(
                {"error": f"Error al eliminar la oferta: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )