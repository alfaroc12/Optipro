from django.core.management.base import BaseCommand
from django.utils import timezone
from notifications.models.m_notifications import m_notification
from notifications.utils.notifications_ut import validate_notification_references
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Limpia las notificaciones que referencian objetos que ya no existen'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Muestra qué notificaciones serían eliminadas sin eliminarlas realmente',
        )
        parser.add_argument(
            '--type',
            type=str,
            help='Filtrar por tipo específico de notificación (new_sale_order, quote_reminder, etc.)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        notification_type = options.get('type')
        
        self.stdout.write(
            self.style.SUCCESS(f'Iniciando limpieza de notificaciones {"(modo de prueba)" if dry_run else ""}')
        )
        
        # Filtrar notificaciones
        queryset = m_notification.objects.filter(is_read=False)
        
        if notification_type:
            queryset = queryset.filter(type=notification_type)
            self.stdout.write(f'Filtrando por tipo: {notification_type}')
        
        total_checked = 0
        invalid_notifications = []
        
        for notification in queryset:
            total_checked += 1
            
            if not validate_notification_references(notification):
                invalid_notifications.append({
                    'id': notification.id,
                    'type': notification.type,
                    'message': notification.message[:100] + '...' if len(notification.message) > 100 else notification.message,
                    'user': notification.user.username,
                    'created_at': notification.created_at
                })
                
                if not dry_run:
                    notification.delete()
                    logger.info(f'Notificación eliminada: ID {notification.id}, Tipo: {notification.type}')
        
        # Mostrar resultados
        self.stdout.write(f'\\nNotificaciones revisadas: {total_checked}')
        self.stdout.write(f'Notificaciones inválidas encontradas: {len(invalid_notifications)}')
        
        if invalid_notifications:
            self.stdout.write('\\nNotificaciones inválidas:')
            for notif in invalid_notifications:
                self.stdout.write(
                    f'  - ID: {notif["id"]}, Tipo: {notif["type"]}, Usuario: {notif["user"]}'
                )
                self.stdout.write(f'    Mensaje: {notif["message"]}')
                self.stdout.write(f'    Creada: {notif["created_at"]}')
                self.stdout.write('')
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('Modo de prueba activado - No se eliminaron notificaciones')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'Limpieza completada - {len(invalid_notifications)} notificaciones eliminadas')
            )
