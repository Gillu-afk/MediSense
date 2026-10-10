"""
Configuration settings for MediSense
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
DATA_DIR = BASE_DIR / "data"
DATASET_PATH = DATA_DIR / "diabetes.csv"

# Load .env file from ROOT_DIR if present
ENV_PATH = ROOT_DIR / ".env"
if ENV_PATH.exists():
    with open(ENV_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, val = line.split("=", 1)
                key = key.strip()
                val = val.strip().strip('"').strip("'")
                if key and key not in os.environ:
                    os.environ[key] = val

# Database Configuration
DATABASE_URL = os.getenv("DATABASE_URL", "")
TURSO_DATABASE_URL = os.getenv("TURSO_DATABASE_URL", "")
TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN", "")

# Default local SQLite database file
SQLITE_DB_PATH = os.getenv("SQLITE_DB_PATH", str(BASE_DIR / "medisense.db"))

# Check if hosted persistent database is configured
IS_HOSTED_DB = bool(TURSO_DATABASE_URL or (DATABASE_URL and not DATABASE_URL.startswith("sqlite")))
IS_VERCEL = bool(os.getenv("VERCEL", False))

# If on Vercel without hosted DB, running in Demo Mode with ephemeral storage
IS_DEMO_MODE = IS_VERCEL and not IS_HOSTED_DB
DEMO_STORAGE_NOTICE = (
    "Running in Demo Mode on serverless infrastructure. "
    "Local modifications are active for this session but not durable across cold restarts without a configured hosted DB (e.g. Turso / libSQL)."
    if IS_DEMO_MODE else
    "Local SQLite persistent storage active."
)
