from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from notifications.models.m_notifications import m_notification
from notifications.serializers.sz_notification import sz_notification

class V_Notification(viewsets.ModelViewSet):
    serializer_class = sz_notification
    
    def get_queryset(self):
        return m_notification.objects.filter(user=self.request.user)
    
    def list(self, request):
        """
        Obtiene todas las notificaciones del usuario, con opciones para filtrar por tipo, 
        fecha y estado de lectura.
        """
        queryset = self.get_queryset()
        
        # Verificar si el usuario es admin para personalizar la navegación
        is_admin = request.user.is_staff or request.user.is_superuser
        
        # Filtrar por tipo
        notification_type = request.query_params.get('type')
        if notification_type:
            queryset = queryset.filter(type=notification_type)
            
        # Filtrar por estado de lectura
        is_read = request.query_params.get('is_read')
        if is_read is not None:
            is_read_bool = is_read.lower() == 'true'
            queryset = queryset.filter(is_read=is_read_bool)
            
        # Filtrar por fecha (notificaciones recientes, último día, semana o mes)
        time_filter = request.query_params.get('time')
        if time_filter:
            now = timezone.now()
            if time_filter == 'day':
                since = now - timedelta(days=1)
            elif time_filter == 'week':
                since = now - timedelta(days=7)
            elif time_filter == 'month':
                since = now - timedelta(days=30)
            else:
                since = None
                
            if since:
                queryset = queryset.filter(created_at__gte=since)
        
        # Limitar resultados
        limit = request.query_params.get('limit')
        if limit and limit.isdigit():
            queryset = queryset[:int(limit)]
            
        # Enriquecer los datos de notificación con información de navegación
        for notification in queryset:
            if 'data' not in notification.__dict__:
                notification.data = {}
            
            # Añadir información si el usuario es admin para la navegación frontend
            notification.data['is_admin'] = is_admin
            
            # Asegurar que haya una estructura de navegación
            if 'navigation_route' not in notification.data and notification.type:
                # Configurar rutas basadas en el tipo de notificación
                if notification.type == 'new_sale_order':
                    notification.data['navigation_route'] = '/admin/ofertas' if is_admin else '/ofertas'
                elif notification.type == 'new_project':
                    notification.data['navigation_route'] = '/admin/projects' if is_admin else '/projects'
                elif notification.type == 'new_chat':
                    notification.data['navigation_route'] = '/admin/chat' if is_admin else '/chat'
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def mark_as_read(self, request):
        """
        Marca como leídas las notificaciones con los IDs especificados.
        """
        notifications = m_notification.objects.filter(
            id__in=request.data.get('ids', []),
            user=request.user
        )
        
        count = notifications.count()
        notifications.update(is_read=True)
        
        return Response({
            'success': True,
            'count': count,
            'message': f'{count} notificaciones marcadas como leídas'
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """
        Marca todas las notificaciones del usuario como leídas.
        """
        notifications = self.get_queryset().filter(is_read=False)
        count = notifications.count()
        notifications.update(is_read=True)
        
        return Response({
            'success': True,
            'count': count,
            'message': f'{count} notificaciones marcadas como leídas'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def unread(self, request):
        """
        Obtiene todas las notificaciones no leídas del usuario.
        """
        notifications = self.get_queryset().filter(is_read=False)
        
        # Verificar si el usuario es admin para personalizar la navegación
        is_admin = request.user.is_staff or request.user.is_superuser
        
        # Enriquecer los datos de notificación con información de navegación
        for notification in notifications:
            if 'data' not in notification.__dict__:
                notification.data = {}
            
            # Añadir información si el usuario es admin para la navegación frontend
            notification.data['is_admin'] = is_admin
            
            # Asegurar que haya una estructura de navegación
            if 'navigation_route' not in notification.data and notification.type:
                # Configurar rutas basadas en el tipo de notificación
                if notification.type == 'new_sale_order':
                    notification.data['navigation_route'] = '/admin/ofertas' if is_admin else '/ofertas'
                elif notification.type == 'new_project':
                    notification.data['navigation_route'] = '/admin/projects' if is_admin else '/projects'
                elif notification.type == 'new_chat':
                    notification.data['navigation_route'] = '/admin/chat' if is_admin else '/chat'
        
        serializer = self.get_serializer(notifications, many=True)
        return Response(serializer.data)
        
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Devuelve un resumen de las notificaciones: total, no leídas, 
        y contadores por tipo.
        """
        queryset = self.get_queryset()
        total = queryset.count()
        unread = queryset.filter(is_read=False).count()
        
        # Contar por tipo
        type_counts = {}
        notification_types = m_notification.NOTIFICATION_TYPES
        
        for type_code, type_name in notification_types:
            type_counts[type_code] = {
                'name': type_name,
                'count': queryset.filter(type=type_code).count(),
                'unread': queryset.filter(type=type_code, is_read=False).count()
            }
        
        return Response({
            'total': total,
            'unread': unread,
            'types': type_counts
        })
    
    @action(detail=False, methods=['post'])
    def validate_and_cleanup(self, request):
        """
        Valida todas las notificaciones del usuario y elimina las que referencian
        objetos que ya no existen
        """
        from notifications.utils.notifications_ut import validate_notification_references
        
        queryset = self.get_queryset().filter(is_read=False)
        invalid_notifications = []
        valid_count = 0
        
        for notification in queryset:
            if not validate_notification_references(notification):
                invalid_notifications.append({
                    'id': notification.id,
                    'type': notification.type,
                    'message': notification.message,
                    'reason': 'Referencia no válida'
                })
                notification.delete()
            else:
                valid_count += 1
        
        return Response({
            'message': 'Validación completada',
            'valid_notifications': valid_count,
            'removed_notifications': len(invalid_notifications),
            'removed_details': invalid_notifications
        })
    
    @action(detail=True, methods=['post'])
    def validate_reference(self, request, pk=None):
        """
        Valida si una notificación específica hace referencia a objetos que aún existen
        """
        from notifications.utils.notifications_ut import validate_notification_references
        
        try:
            notification = self.get_object()
            is_valid = validate_notification_references(notification)
            
            if not is_valid:
                # La notificación hace referencia a algo que ya no existe
                return Response({
                    'valid': False,
                    'message': 'Esta notificación hace referencia a un elemento que ya no existe',
                    'recommendation': 'La notificación será eliminada automáticamente'
                }, status=status.HTTP_410_GONE)
            
            return Response({
                'valid': True,
                'message': 'La notificación es válida'
            })
            
        except m_notification.DoesNotExist:
            return Response({
                'error': 'Notificación no encontrada'
            }, status=status.HTTP_404_NOT_FOUND)