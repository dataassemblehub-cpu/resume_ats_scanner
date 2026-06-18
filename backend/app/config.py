import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Set user's actual Supabase keys as defaults for seamless prod deployment
    SUPABASE_URL: str = "https://qnmxuzobldgcgbcixazl.supabase.co"
    SUPABASE_KEY: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFubXh1em9ibGRnY2diY2l4YXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0OTgzOTEsImV4cCI6MjA5NzA3NDM5MX0.N6Ovuyabo2MeVjSpEIYTTKMHI4IZfvRHN0-x8G0kaG4"
    DATABASE_URL: str | None = None
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    ENV: str = "development"
    
    # Gemini API Settings
    GEMINI_API_KEY: str | None = None
    GEMINI_MODEL: str = "gemini-2.5-flash"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
