import os
from pathlib import Path

# Base Directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent
APP_DIR = BASE_DIR / "app"
DATASET_DIR = BASE_DIR / "dataset"
DATA_SOURCE_DIR = Path(r"C:\Users\divya\OneDrive\Desktop\data set")

# Database & Storage
DB_PATH = BASE_DIR / "verispect.db"
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Service Configuration
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))
NODE_APP_URL = os.getenv("NODE_APP_URL", "http://localhost:3000")

# Security & Encryption Key
SECRET_KEY = os.getenv("SECRET_KEY", "authbridge-production-secret-key-32b")
ALGORITHM = "HS256"
ENCRYPTION_SALT = os.getenv("ENCRYPTION_SALT", "verispect-identity-integrity-salt")

# Decision Engine Thresholds
TAMPER_RISK_THRESHOLD = 40.0
HIGH_RISK_THRESHOLD = 70.0
