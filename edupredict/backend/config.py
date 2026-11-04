import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-only-change-me")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URI", f"sqlite:///{BASE_DIR / 'edupredict.db'}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MODEL_DIR = os.environ.get("MODEL_DIR", str(BASE_DIR / "ml" / "artifacts"))
    # Teachers must supply this code at registration (prevents open teacher sign-up).
    TEACHER_INVITE_CODE = os.environ.get("TEACHER_INVITE_CODE", "TEACH-2025")
    TOKEN_HOURS = int(os.environ.get("TOKEN_HOURS", "12"))
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:5173").split(",")
