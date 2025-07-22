from xmlrpc import client
from celery import shared_task
from notifications.models.m_notifications import m_notification
from django.contrib.auth.models import User
from django.utils import timezone
from sale_order.models.sale_order import M_sale_order


@shared_task
def notify_admins_quote_reminder(sale_order_id):
    try:
        sale_order = M_sale_order.objects.get(id=sale_order_id)
    except M_sale_order.DoesNotExist:
        return

    data = {
        'sale_order_id': sale_order.id,
        'sale_order_code': sale_order.code,
        'client_name': sale_order.name,
        'timestamp': timezone.now().isoformat()
    }

    message = f'Recordatorio: La cotización #{sale_order.code} de {sale_order.name} fue creada hace 3 días.'

    admins = User.objects.filter(is_staff=True)
    for admin in admins:
        m_notification.objects.create(
            type='new_sale_order',  # debe coincidir con los valores permitidos
            message=message,
            data=data,
            user=admin
        )

def notify_admins_sale_order (sale_order):
    notificacaion_data ={
        'sale_order_id': sale_order.id,
        'sale_order_code': sale_order.code,
        'client_name': sale_order.name,
        'created_at': sale_order.date.isoformat(),
        'total_quotation': str(sale_order.total_quotation),
        'timestamp': timezone.now().isoformat()
    }

    message = f'Se ha creado una nueva cotizacion comercial #{sale_order.code} para {sale_order.name}'

    notify_all_admins('new_sale_order', message,notificacaion_data)

    if sale_order.user_id:
        create_notification('new_sale_order', message,notificacaion_data, sale_order.user_id)



def create_notification(type, message, data, user):
    """
    Función genérica para crear notificaciones
    """
    return m_notification.objects.create(
        type=type,
        message=message,
        data=data,
        user=user
    )

def notify_all_admins(type, message, data):
    """
    Envía notificación a todos los administradores del sistema
    """
    admin_users = User.objects.filter(is_staff=True)
    notifications = []
    
    for admin in admin_users:
        notifications.append(
            create_notification(type, message, data, admin)
        )
    
    return notifications

def notify_sale_order_status_change(sale_order, old_state, new_state):
    """
    Notifica sobre cambios de estado en órdenes de venta
    """
    # Datos comunes para la notificación
    notification_data = {
        'sale_order_id': sale_order.id,
        'sale_order_code': sale_order.code,
        'client_name': sale_order.name,
        'old_state': old_state,
        'new_state': new_state,
        'timestamp': timezone.now().isoformat()
    }

    # Notificar a los administradores
    admin_message = f'La orden de cotizacion comercial #{sale_order.code} de {sale_order.name} cambió de estado {old_state} a {new_state}'
    notify_all_admins('state_change', admin_message, notification_data)

    # Notificar al usuario que creó la orden
    if sale_order.user_id:
        user_message = f'Su orden de cotizacion comercial #{sale_order.code} cambió de estado a {new_state}'
        create_notification('state_change', user_message, notification_data, sale_order.user_id)

def notify_sale_order_to_project(sale_order, project):
    """
    Notifica cuando una orden de venta se convierte en proyecto
    """
    notification_data = {
        'sale_order_id': sale_order.id,
        'sale_order_code': sale_order.code,
        'project_id': project.id,
        'project_code': project.code,
        'client_name': sale_order.name,
        'project_status': project.status,
        'timestamp': timezone.now().isoformat()
    }

    # Notificar a los administradores
    admin_message = f'La orden de cotizacion #{sale_order.code} de {sale_order.name} se convirtió en el proyecto #{project.code}'
    notify_all_admins('new_project', admin_message, notification_data)

    # Notificar al usuario que creó la orden
    if sale_order.user_id:
        user_message = f'Su orden de cotizacion #{sale_order.code} se ha convertido en proyecto #{project.code}'
        create_notification('new_project', user_message, notification_data, sale_order.user_id)

def notify_new_message(chat, message, sender):
    """
    Notifica cuando hay un nuevo mensaje en un chat
    
    Args:
        chat: Objeto M_sale_order (cotización)
        message: Objeto ChatMessage
        sender: Usuario que envió el mensaje
    """
    # Para M_sale_order debemos notificar al usuario asociado a la cotización
    # y posiblemente a los administradores
    
    notification_data = {
        'sale_order_id': chat.id,
        'sale_order_code': chat.code,
        'message_id': message.id,
        'sender_id': sender.id if sender else None,
        'sender_name': f"{sender.first_name} {sender.last_name}".strip() or sender.username if sender else message.user_name,
        'message_preview': message.message[:100] + ('...' if len(message.message) > 100 else ''),
        'timestamp': timezone.now().isoformat()
    }
    
    # Notificar al usuario asociado a la cotización (si existe y es diferente al remitente)
    if hasattr(chat, 'user_id') and chat.user_id and (not sender or chat.user_id.id != sender.id):
        notification_message = f'{notification_data["sender_name"]} envió un mensaje en cotización #{chat.code}: "{notification_data["message_preview"]}"'
        create_notification('new_chat', notification_message, notification_data, chat.user_id)
    
    # Notificar a los administradores
    admin_message = f'Nuevo mensaje en cotización #{chat.code} de {chat.name}: "{notification_data["message_preview"]}"'
    notify_all_admins('new_chat', admin_message, notification_data)

def notify_task_assignment(task, assigned_by, assigned_to):
    """
    Notifica cuando se asigna una tarea a un usuario
    """
    notification_data = {
        'task_id': task.id,
        'task_title': task.title,
        'assigned_by_id': assigned_by.id,
        'assigned_by_name': f"{assigned_by.first_name} {assigned_by.last_name}".strip() or assigned_by.username,
        'due_date': task.due_date.isoformat() if task.due_date else None,
        'priority': task.priority,
        'timestamp': timezone.now().isoformat()
    }
    
    notification_message = f'{notification_data["assigned_by_name"]} te ha asignado la tarea: "{task.title}"'
    create_notification('task_assignment', notification_message, notification_data, assigned_to)

def notify_new_project_attachment(attach_obj, user):

    notification_data = {
        'project_id': attach_obj.proyect_id.id,
        'project_code': attach_obj.proyect_id.code,
        'attachment_id': attach_obj.id,
        'attachment_name': attach_obj.name,
        'timestamp': timezone.now().isoformat()
    }
    message = f'Se ha subido un nuevo archivo "{attach_obj.name}" al proyecto #{attach_obj.proyect_id.code}'
    # Notifica a todos los administradores
    notify_all_admins('new_project_attachment', message, notification_data)
    # Puedes notificar también al responsable del proyecto si lo deseas