# urls de la notificación

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from notifications.views.v_notifications import V_Notification

router = DefaultRouter()
router.register(r'notifications', V_Notification, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]