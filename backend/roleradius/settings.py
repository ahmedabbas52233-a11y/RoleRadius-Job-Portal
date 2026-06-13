import os
import sys
from pathlib import Path
from datetime import timedelta
import dj_database_url
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# ── Secret key — MUST be set in production ───────────────────────────────────
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-dev-only-key-change-in-production-now')
DEBUG = os.getenv('DEBUG', 'True') == 'True'

if not DEBUG and SECRET_KEY.startswith('django-insecure'):
    from django.core.exceptions import ImproperlyConfigured
    raise ImproperlyConfigured(
        'SECRET_KEY must be set to a secure random value in production. '
        'Run: python -c "import secrets; print(secrets.token_urlsafe(50))"'
    )

ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'cloudinary_storage',
    'cloudinary',
    'drf_spectacular',
    'axes',
    'csp',
    'accounts.apps.AccountsConfig',
    'jobs.apps.JobsConfig',
    'applications.apps.ApplicationsConfig',
    'matching.apps.MatchingConfig',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'axes.middleware.AxesMiddleware',
    'csp.middleware.CSPMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'accounts.middleware.SecurityAuditMiddleware',
]

ROOT_URLCONF = 'roleradius.urls'

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [],
    'APP_DIRS': True,
    'OPTIONS': {'context_processors': [
        'django.template.context_processors.debug',
        'django.template.context_processors.request',
        'django.contrib.auth.context_processors.auth',
        'django.contrib.messages.context_processors.messages',
    ]},
}]

WSGI_APPLICATION = 'roleradius.wsgi.application'

# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL = os.getenv('DATABASE_URL')
if DATABASE_URL:
    DATABASES = {'default': dj_database_url.parse(DATABASE_URL)}
else:
    DATABASES = {'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'roleradius_db'),
        'USER': os.getenv('DB_USER', 'postgres'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'postgres'),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }}

AUTHENTICATION_BACKENDS = [
    'axes.backends.AxesStandaloneBackend',
    'django.contrib.auth.backends.ModelBackend',
]

AUTH_USER_MODEL = 'accounts.User'

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ── Static & Media ────────────────────────────────────────────────────────────
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
MEDIA_URL = '/media/'

_cloudinary_configured = bool(
    os.getenv('CLOUDINARY_CLOUD_NAME') and
    os.getenv('CLOUDINARY_API_KEY') and
    os.getenv('CLOUDINARY_API_SECRET')
)
if _cloudinary_configured:
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
    CLOUDINARY_STORAGE = {
        'CLOUD_NAME': os.getenv('CLOUDINARY_CLOUD_NAME'),
        'API_KEY': os.getenv('CLOUDINARY_API_KEY'),
        'API_SECRET': os.getenv('CLOUDINARY_API_SECRET'),
    }
else:
    DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
    MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
DATA_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 5 * 1024 * 1024

# ── REST Framework ────────────────────────────────────────────────────────────
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': ('accounts.authentication.CookieJWTAuthentication',),
    'DEFAULT_PERMISSION_CLASSES': ('rest_framework.permissions.IsAuthenticatedOrReadOnly',),
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'roleradius.pagination.StandardPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '200/hour',
        'user': '2000/hour',
        'login': '5/min',
        'register': '10/hour',
        'password_reset': '3/min',
    },
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# ── JWT ───────────────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(minutes=15),   # Short for security
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS':  True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ── Cookie settings ───────────────────────────────────────────────────────────
JWT_COOKIE_ACCESS_NAME   = 'access_token'
JWT_COOKIE_REFRESH_NAME  = 'refresh_token'
JWT_COOKIE_SECURE        = not DEBUG
JWT_COOKIE_SAMESITE      = 'Lax'
JWT_COOKIE_HTTPONLY      = True
JWT_COOKIE_ACCESS_MAX_AGE  = 15 * 60          # 15 minutes
JWT_COOKIE_REFRESH_MAX_AGE = 7 * 24 * 60 * 60 # 7 days

# ── CORS ──────────────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = os.getenv(
    'CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:3000'
).split(',')
CORS_ALLOW_CREDENTIALS = True

# ── CSRF ──────────────────────────────────────────────────────────────────────
CSRF_TRUSTED_ORIGINS = os.getenv(
    'CSRF_TRUSTED_ORIGINS', 'http://localhost:5173,http://localhost:3000'
).split(',')
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = 'Lax'

# ── Content Security Policy ───────────────────────────────────────────────────
CSP_DEFAULT_SRC  = ("'self'",)
CSP_SCRIPT_SRC   = ("'self'", "'unsafe-inline'")   # unsafe-inline needed for Swagger UI
CSP_STYLE_SRC    = ("'self'", "'unsafe-inline'", "https://fonts.googleapis.com")
CSP_FONT_SRC     = ("'self'", "https://fonts.gstatic.com")
CSP_IMG_SRC      = ("'self'", "data:", "https://res.cloudinary.com", "https:")
CSP_CONNECT_SRC  = ("'self'",)
CSP_FRAME_ANCESTORS = ("'none'",)
CSP_BASE_URI     = ("'self'",)
CSP_FORM_ACTION  = ("'self'",)

# ── Email ─────────────────────────────────────────────────────────────────────
EMAIL_BACKEND   = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')
EMAIL_HOST      = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT      = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS   = True
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL  = os.getenv('DEFAULT_FROM_EMAIL', 'noreply@roleradius.com')
FRONTEND_URL        = os.getenv('FRONTEND_URL', 'http://localhost:5173')

# ── API Documentation ─────────────────────────────────────────────────────────
SPECTACULAR_SETTINGS = {
    'TITLE': 'RoleRadius API',
    'DESCRIPTION': 'AI-powered job portal — TF-IDF matching, candidate/recruiter flows',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
}

# ── Account lockout ───────────────────────────────────────────────────────────
AXES_FAILURE_LIMIT    = 5
AXES_COOLOFF_TIME     = timedelta(minutes=30)
AXES_RESET_ON_SUCCESS = True
AXES_LOCKOUT_CALLABLE = 'accounts.views.axes_lockout_response'

# ── Logging ───────────────────────────────────────────────────────────────────
LOGS_DIR = BASE_DIR / 'logs'
LOGS_DIR.mkdir(exist_ok=True)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {'format': '[{levelname}] {asctime} {module}: {message}', 'style': '{'},
        'simple':  {'format': '[{levelname}] {message}', 'style': '{'},
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
            'stream': 'ext://sys.stdout',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': LOGS_DIR / 'roleradius.log',
            'formatter': 'verbose',
            'encoding': 'utf-8',
        },
        'security_file': {
            'class': 'logging.FileHandler',
            'filename': LOGS_DIR / 'security.log',
            'formatter': 'verbose',
            'encoding': 'utf-8',
        },
    },
    'root': {'handlers': ['console'], 'level': 'WARNING'},
    'loggers': {
        'django':           {'handlers': ['console'], 'level': 'INFO', 'propagate': False},
        'roleradius':       {'handlers': ['console', 'file'], 'level': 'DEBUG', 'propagate': False},
        'security':         {'handlers': ['console', 'security_file'], 'level': 'INFO', 'propagate': False},
        'axes':             {'handlers': ['console', 'security_file'], 'level': 'WARNING', 'propagate': False},
    },
}

# ── Production hardening ──────────────────────────────────────────────────────
if not DEBUG:
    SECURE_SSL_REDIRECT            = True
    SECURE_HSTS_SECONDS            = 31_536_000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD            = True
    SESSION_COOKIE_SECURE          = True
    CSRF_COOKIE_SECURE             = True
    SECURE_BROWSER_XSS_FILTER      = True
    SECURE_CONTENT_TYPE_NOSNIFF    = True
    X_FRAME_OPTIONS                = 'DENY'
    SECURE_REFERRER_POLICY         = 'strict-origin-when-cross-origin'
    CSP_SCRIPT_SRC                 = ("'self'",)  # remove unsafe-inline in production
