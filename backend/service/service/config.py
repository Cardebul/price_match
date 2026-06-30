from pathlib import Path

from pydantic import SecretStr, RedisDsn, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


DOTENV_PATH = Path(__file__).resolve().parent.parent.parent / ".env"


class BaseConfig(BaseSettings):
    model_config = SettingsConfigDict(env_file=DOTENV_PATH, extra="ignore")


class PostgresSettings(BaseConfig):
    model_config = SettingsConfigDict(
        env_prefix="postgres_", env_file=DOTENV_PATH, extra="ignore"
    )

    user: str
    password: str
    host: str = Field(validation_alias="DB_HOST")
    port: int = Field(validation_alias="DB_PORT")
    db: str


class AiSettings(BaseConfig):
    embedding_model_doc: str
    embedding_model_query: str
    base_url: str
    api_key: str


class AppSettings(BaseConfig):
    secret_key: SecretStr
    debug: bool = False
    allowed_hosts: list[str] = ["localhost", "127.0.0.1"]
    timezone: str = "Europe/Moscow"


class ProjectSettings(BaseConfig):
    app: AppSettings = AppSettings()
    pg: PostgresSettings = PostgresSettings()
    ai: AiSettings = AiSettings()

    redis: RedisDsn


config = ProjectSettings()
