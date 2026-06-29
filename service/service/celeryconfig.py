from service.config import config


broker_url = config.redis
result_backend = config.redis
timezone = config.app.timezone
task_serializer = 'json'
result_serializer = 'json'
accept_content = ['json']
