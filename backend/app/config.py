from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    AIRIA_API_KEY: str = ""
    AIRIA_PROJECT_ID: str = ""
    AIRIA_BASE_URL: str = "https://api.airia.ai"

    PROSPECT_SCOUT_PIPELINE_ID: str = ""
    FIT_ANALYZER_PIPELINE_ID: str = ""
    PITCH_CRAFT_PIPELINE_ID: str = ""
    OUTREACH_PILOT_PIPELINE_ID: str = ""

    DATABASE_URL: str = "sqlite+aiosqlite:///./dealflow.db"
    FRONTEND_URL: str = "http://localhost:3000"
    SENDER_EMAIL: str = ""
    PORT: int = 8000

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
