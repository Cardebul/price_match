from service.config import config


broker_url = str(config.redis)
result_backend = str(config.redis)
timezone = config.app.timezone
task_serializer = "json"
result_serializer = "json"
accept_content = ["json"]
