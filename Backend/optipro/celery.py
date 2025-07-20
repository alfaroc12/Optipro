#archivo celery.py en el mismo nivel de settings.py

from __future__ import absolute_import
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'optipro.settings')

app = Celery('optipro')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()