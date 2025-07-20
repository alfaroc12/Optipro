from django.urls import path
from chat.views.chat_views import ChatMessageListCreate


urlpatterns = [
    # Rutas para el chat
    path('api/chat/messages/<int:cotizacion_id>/', ChatMessageListCreate.as_view(), name='chat-messages'),
    path('api/chat/messages/', ChatMessageListCreate.as_view(), name='chat-message-create'),
    
    
]
