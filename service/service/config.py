from pydantic import SecretStr, PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class BaseConfig(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


class AiSettings(BaseConfig):
    embedding_model_doc: str
    embedding_model_query: str
    base_url: str
    api_key: str


class AppSettings(BaseConfig):
    SECRET_KEY: SecretStr
    DEBUG: bool = False
    ALLOWED_HOSTS: list[str] = ["localhost", "127.0.0.1"]
    DATABASE_URL: PostgresDsn


class ProjectSettings(BaseConfig):
    app: AppSettings = AppSettings()
    ai: AiSettings = AiSettings()


config = ProjectSettings()
