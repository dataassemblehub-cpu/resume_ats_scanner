import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Supabase Settings (loaded from environment / .env)
    SUPABASE_URL: str | None = None
    SUPABASE_KEY: str | None = None
    DATABASE_URL: str | None = None
    PORT: int | None = None
    HOST: str = "0.0.0.0"
    ENV: str = "production"
    
    # Gemini API Settings
    GEMINI_API_KEY: str | None = None
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GEMINI_FALLBACK_MODELS: str = "gemini-2.0-flash"

    # Testing & Debug bypass toggles
    BYPASS_AUTH: bool = False
    BYPASS_PREMIUM: bool = False

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def __init__(self, **values):
        super().__init__(**values)
        if self.ENV == "production":
            self.BYPASS_AUTH = False
            self.BYPASS_PREMIUM = False

settings = Settings()
