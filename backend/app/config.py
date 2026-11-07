"""
ASTID Backend Configuration
Settings managed via Pydantic v2 BaseSettings
"""

from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "ASTID RiskOps API"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = ""  # Must be set via ASTID_SECRET_KEY env var in production
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Storage Paths
    PARQUET_WAREHOUSE_PATH: str = "backend/warehouse/data/paysim_warehouse.parquet"
    TEST_SAMPLE_PATH: str = "backend/warehouse/data/scored_test_sample.parquet"
    MODEL_ARTIFACTS_DIR: str = "backend/ml/artifacts"

    # Banking SLA Constants
    ESCALATION_SLA_MINUTES: int = 15
    MAX_GEO_SPEED_KMH: float = 900.0
    UPI_TRANSACTION_CEILING_INR: float = 100000.0

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
