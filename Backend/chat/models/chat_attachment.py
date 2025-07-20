from django.db import models

class ChatAttachment(models.Model):
    message = models.ForeignKey('chat.ChatMessage', on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='chat_attachments/')
    file_name = models.CharField(max_length=255)
    upload_date = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.file_name
