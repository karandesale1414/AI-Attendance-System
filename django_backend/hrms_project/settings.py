from pathlib import Path

from decouple import config, Csv
from django.core.management.utils import get_random_secret_key

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config("SECRET_KEY", default=get_random_secret_key())
DEBUG = config("DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="*", cast=Csv())

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "drf_spectacular",
    "hrms",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "hrms_project.urls"
WSGI_APPLICATION = "hrms_project.wsgi.application"
ASGI_APPLICATION = "hrms_project.asgi.application"
AUTH_USER_MODEL = "hrms.User"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    }
]

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

# NOTE: simplejwt's default ACCESS_TOKEN_LIFETIME is only 5 minutes. The React
# frontend previously never called the refresh endpoint (and didn't even store
# the refresh token), so every session died a few minutes after login and the
# user was silently bounced back to the login screen the next time any
# dashboard API call ran. We give the access token a realistic lifetime and
# rotate refresh tokens so a long admin session stays valid.
from datetime import timedelta

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=8),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "UPDATE_LAST_LOGIN": True,
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Attend AI HRMS API",
    "DESCRIPTION": "Django REST backend for AI attendance, ESS, leave, payroll and analytics.",
    "VERSION": "1.0.0",
}

CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="http://localhost:5173,https://frontend-taupe-seven-wvh8eejz3v.vercel.app",
    cast=Csv(),
)

# django-cors-headers does NOT support "*" wildcards inside CORS_ALLOWED_ORIGINS
# (that list is exact-match only) - "https://*.vercel.app" was silently ignored
# and doing nothing. Any *.vercel.app preview URL must be matched here instead.
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.vercel\.app$",
]

# Kept True so the app keeps working even if CORS_ALLOWED_ORIGINS is ever out of
# date, but the two settings above are now correct/self-consistent regardless.
CORS_ALLOW_ALL_ORIGINS = config("CORS_ALLOW_ALL_ORIGINS", default=True, cast=bool)

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Database Configuration - SQLite for local, PostgreSQL for production
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# Render PostgreSQL URL parsing - overrides SQLite if DATABASE_URL is set
import dj_database_url
if config("DATABASE_URL", default=""):
    DATABASES["default"] = dj_database_url.parse(config("DATABASE_URL"))
    DATABASES["default"]["CONN_MAX_AGE"] = 600

CELERY_BROKER_URL = config("REDIS_URL", default="redis://localhost:6379/0")
CELERY_RESULT_BACKEND = CELERY_BROKER_URL
CELERY_BEAT_SCHEDULE = {
    "daily-absent-calculation": {
        "task": "hrms.tasks.daily_absent_calculation",
        "schedule": 60 * 60 * 24,
    },
    "daily-leave-reminders": {
        "task": "hrms.tasks.email_pending_leave_reminders",
        "schedule": 60 * 60 * 24,
    },
}

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = config("EMAIL_HOST", default="")
EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=True, cast=bool)
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default="AI HRMS <no-reply@example.com>")
WHATSAPP_API_URL = config("WHATSAPP_API_URL", default="")
WHATSAPP_API_TOKEN = config("WHATSAPP_API_TOKEN", default="")
WHATSAPP_FROM = config("WHATSAPP_FROM", default="")
