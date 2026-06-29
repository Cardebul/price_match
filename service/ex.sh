python manage.py migrate
# python manage.py collectstatic --no-input
gunicorn --bind 0.0.0.0:8000 service.wsgi:application --workers 3 --worker-class sync --timeout 60