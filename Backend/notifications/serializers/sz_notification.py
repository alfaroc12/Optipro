from rest_framework import serializers
from notifications.models.m_notifications import m_notification
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name']

class sz_notification(serializers.ModelSerializer):
    user_info = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = m_notification
        fields = [
            'id',
            'type', 
            'message', 
            'data', 
            'created_at', 
            'is_read',
            'user',
            'user_info'
            ]