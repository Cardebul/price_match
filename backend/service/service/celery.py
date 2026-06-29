import os
from celery import Celery
from service import celeryconfig

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'service.settings')

app = Celery('celery_app')

app.config_from_object(celeryconfig)

app.autodiscover_tasks()
