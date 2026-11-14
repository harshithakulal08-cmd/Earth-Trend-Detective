from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os


class Settings(BaseSettings):
    APP_NAME: str = "NASA Data Detectives API"
    APP_VERSION: str = "0.1.0"
    APP_ENV: str = "development"
    DEBUG: bool = False
    
    # Server
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    
    # NASA Earthdata credentials (loaded from environment)
    EARTHDATA_USERNAME: str = ""
    EARTHDATA_PASSWORD: str = ""
    
    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    
    # Cache
    CACHE_DIR: str = "./cache"
    CACHE_TTL_SECONDS: int = 86400
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()

