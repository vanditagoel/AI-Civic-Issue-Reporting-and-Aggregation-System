"""
Django settings for CivicLens backend.
Phase 1-3 compliant: PostgreSQL strictly required, custom User model,
DRF throttling & OpenAPI, configurable Gemini AI pipeline & priority scoring.
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# Security Settings
SECRET_KEY = os.getenv('SECRET_KEY', 'civiclens-dev-secret-key-302918')
DEBUG = os.getenv('DEBUG', 'True').lower() in ('true', '1', 't')
ALLOWED_HOSTS = [h.strip() for h in os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,0.0.0.0').split(',') if h.strip()]

# Custom User Model
AUTH_USER_MODEL = 'accounts.User'

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third-Party Packages
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'drf_spectacular',
    
    # CivicLens Modular Domain Apps
    'apps.accounts',
    'apps.reports',
    'apps.issues',
    'apps.ai_processing',
    'apps.analytics',
    'apps.notifications',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# ==============================================================================
# Database Configuration (PostgreSQL STRICTLY REQUIRED)
# ==============================================================================
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    raise RuntimeError(
        "CRITICAL CONFIGURATION ERROR: DATABASE_URL environment variable is missing. "
        "CivicLens strictly requires PostgreSQL. SQLite fallback is prohibited."
    )

if 'sqlite' in DATABASE_URL.lower():
    raise RuntimeError(
        "CRITICAL CONFIGURATION ERROR: SQLite is prohibited for CivicLens. "
        "Please provide a valid PostgreSQL connection string in DATABASE_URL."
    )

DATABASES = {
    'default': dj_database_url.config(
        default=DATABASE_URL,
        conn_max_age=600,
        ssl_require=False if 'localhost' in DATABASE_URL or '127.0.0.1' in DATABASE_URL else True
    )
}

# ==============================================================================
# Django REST Framework Configuration
# ==============================================================================
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '60/min',
        'user': '120/min',
        'report_submission': '10/min',
        'auth_attempt': '10/min',
    }
}

SPECTACULAR_SETTINGS = {
    'TITLE': 'CivicLens API',
    'DESCRIPTION': 'AI-Powered Municipal Civic Issue Aggregation and Prioritization Platform',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# ==============================================================================
# CORS & CSRF Configuration
# ==============================================================================
cors_origins_env = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000')
CORS_ALLOWED_ORIGINS = [orig.strip() for orig in cors_origins_env.split(',') if orig.strip()]
CORS_ALLOW_CREDENTIALS = True

csrf_trusted_env = os.getenv('CSRF_TRUSTED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000')
CSRF_TRUSTED_ORIGINS = [orig.strip() for orig in csrf_trusted_env.split(',') if orig.strip()]

# Cookie Security (Enforced for production)
if not DEBUG:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    CSRF_COOKIE_SAMESITE = 'Lax'

# ==============================================================================
# CivicLens AI Intelligence Pipeline & Scoring Config
# ==============================================================================
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash')
JOB_RUNNER = os.getenv('JOB_RUNNER', 'inline').lower()  # 'inline' or 'worker'

# Authoritative Priority Formula Weights
# Priority Score = clamp(w_sev*Severity + w_rec*Recurrence + w_ward*Ward + w_age*Aging)
PRIORITY_WEIGHTS = {
    'severity': 0.45,
    'recurrence': 0.25,
    'ward_sensitivity': 0.15,
    'aging': 0.15,
}

# Candidate Retrieval and Recurrence Thresholds
CANDIDATE_RETRIEVAL_LIMIT = int(os.getenv('CANDIDATE_RETRIEVAL_LIMIT', '10'))
CANDIDATE_TIME_WINDOW_DAYS = int(os.getenv('CANDIDATE_TIME_WINDOW_DAYS', '30'))
RECURRENCE_CONFIDENCE_THRESHOLD = float(os.getenv('RECURRENCE_CONFIDENCE_THRESHOLD', '0.70'))
FEATURE_FLAG_PGVECTOR = os.getenv('FEATURE_FLAG_PGVECTOR', 'False').lower() in ('true', '1')

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
