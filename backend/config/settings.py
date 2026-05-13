"""
Configuration principale de Django
Ce fichier controle TOUT le comportement de Django
"""
from pathlib import Path
from decouple import config
# "decouple" lit les variables depuis le fichier .env
# Jamais de mots de passe ecrits directement dans ce fichier !

# ===========================
# CHEMINS
# ===========================
BASE_DIR = Path(__file__).resolve().parent.parent
# Path(__file__) = chemin vers ce fichier (settings.py)
# .parent = dossier config/
# .parent.parent = dossier backend/ (racine du projet)
# Tous les autres chemins seront relatifs a BASE_DIR

# ===========================
# SECURITE
# ===========================
SECRET_KEY = config('SECRET_KEY')
# Cle secrete Django - sert a signer les cookies, tokens, etc.
# On la lit depuis .env - JAMAIS en dur dans le code !

DEBUG = config('DEBUG', default=False, cast=bool)
# True en dev (affiche les erreurs detaillees)
# False en prod (cache les erreurs - securite)
# cast=bool convertit la string "True" en booleen Python True

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost').split(',')
# Liste des domaines autorises a servir cette app
# En dev : localhost et 127.0.0.1
# En prod : ton-domaine.com
# .split(',') transforme "localhost,127.0.0.1" en liste Python

# ===========================
# APPLICATIONS INSTALLEES
# ===========================
INSTALLED_APPS = [
    # Apps Django par defaut
    'django.contrib.admin',        # Interface d'administration
    'django.contrib.auth',         # Systeme d'authentification
    'django.contrib.contenttypes', # Framework de types generiques
    'django.contrib.sessions',     # Gestion des sessions
    'django.contrib.messages',     # Systeme de messages flash
    'django.contrib.staticfiles',  # Gestion des fichiers statiques

    # Bibliotheques tierces
    'rest_framework',              # Django REST Framework - notre API
    'corsheaders',                 # Gestion CORS (frontend <-> backend)
    'drf_spectacular',             # Documentation OpenAPI
    'django_filters',              # Filtrage API

    # Nos apps metier
    'apps.users',                  # Gestion des comptes utilisateurs
    'apps.employees',              # Gestion des employes
    'apps.schedules',              # Planning hebdomadaire
    'apps.attendance',             # Pointage (check-in/check-out)
    'apps.notifications',          # Alertes et notifications
    'apps.expenses',               # Gestion des dépenses et factures
    'rest_framework_simplejwt.token_blacklist', 
]

# ===========================
# MIDDLEWARE
# ===========================
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    # CORS doit etre EN HAUT de la liste - avant CommonMiddleware
    # Il intercepte les requetes OPTIONS (preflight) du navigateur
    
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'
# Dit a Django ou trouver le fichier principal des URLs

# ===========================
# TEMPLATES
# ===========================
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

# ===========================
# BASE DE DONNEES
# ===========================
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        # On utilise MySQL (pas SQLite qui est le defaut Django)
        
        'NAME': config('DB_NAME'),
        # Nom de la base de donnees
        
        'USER': config('DB_USER'),
        # Utilisateur MySQL
        
        'PASSWORD': config('DB_PASSWORD'),
        # Mot de passe - lu depuis .env
        
        'HOST': config('DB_HOST', default='localhost'),
        # En Docker : le nom du service = "db"
        # En local sans Docker : "localhost"
        
        'PORT': config('DB_PORT', default='3306'),
        # Port MySQL standard
        
        'OPTIONS': {
            'charset': 'utf8mb4',
            # utf8mb4 = UTF-8 complet qui supporte les emojis
            # utf8 classique de MySQL ne supporte pas tous les caracteres
        },
    }
}

# ===========================
# AUTHENTIFICATION
# ===========================
AUTH_USER_MODEL = 'users.User'
# Dit a Django d'utiliser NOTRE modele User personnalise
# au lieu du modele User par defaut
# IMPORTANT : doit etre defini AVANT la premiere migration !

# ===========================
# DJANGO REST FRAMEWORK
# ===========================
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        # Toutes les requetes API seront authentifiees par JWT
        # Le client doit envoyer : Authorization: Bearer <token>
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
        # Par defaut : toutes les API necessitent une connexion
        # On overridera ce comportement sur les endpoints publics (login)
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    # Pagination : max 20 resultats par page
    # Evite de renvoyer 10000 lignes d'un coup

    # ===========================
    # DOCUMENTATION
    # ===========================
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',

    # ===========================
    # FILTRAGE
    # ===========================
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),

    # ===========================
    # SECURITE (THROTTLING)
    # ===========================
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',   # Limite pour les utilisateurs non connectés
        'user': '1000/day',  # Limite pour les utilisateurs connectés
    },
}


# ===========================
# JWT CONFIGURATION
# ===========================
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=config('JWT_ACCESS_TOKEN_LIFETIME', default=60, cast=int)),
    # Token d'acces : valide 60 minutes
    # Apres ca, le client doit en demander un nouveau

    'REFRESH_TOKEN_LIFETIME': timedelta(minutes=config('JWT_REFRESH_TOKEN_LIFETIME', default=1440, cast=int)),
    # Token de rafraichissement : valide 24h (1440 minutes)
    # Permet d'obtenir un nouveau access token sans se reconnecter

    'ROTATE_REFRESH_TOKENS': True,
    # A chaque refresh, un nouveau refresh token est emis
    # Securite : l'ancien devient invalide

    'BLACKLIST_AFTER_ROTATION': True,
    # L'ancien refresh token est mis en blacklist
    # Empeche sa reutilisation meme s'il est vole

    'AUTH_HEADER_TYPES': ('Bearer',),
    # Format du header : Authorization: Bearer eyJ0...
}

# ===========================
# SPECTACULAR SETTINGS
# ===========================
SPECTACULAR_SETTINGS = {
    'TITLE': 'Restaurant Management API',
    'DESCRIPTION': 'API pour la gestion d\'un restaurant (Employés, Pointage, Planning)',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
}

# ===========================
# CORS
# ===========================
CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='http://localhost:3000').split(',')
# Liste des origines autorisees a appeler notre API
# En dev : seulement le frontend local
# En prod : ton domaine de production

CORS_ALLOW_CREDENTIALS = True
# Autorise l'envoi de cookies avec les requetes cross-origin
# Necessaire pour l'authentification

# ===========================
# INTERNATIONALISATION
# ===========================
LANGUAGE_CODE = 'fr-fr'
# Interface admin en francais

TIME_ZONE = 'Africa/Conakry'
# Fuseau horaire de Conakry, Guinee
# TRES IMPORTANT pour le pointage - les heures doivent etre correctes !

USE_I18N = True
USE_TZ = True
# USE_TZ = True : Django stocke les dates en UTC dans la BDD
# et les convertit automatiquement vers TIME_ZONE pour l'affichage

# ===========================
# FICHIERS STATIQUES
# ===========================
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
# STATIC_ROOT = ou collecter les fichiers statiques pour la prod

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'
# MEDIA = fichiers uploades par les utilisateurs (photos de profil etc.)

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
# Type d'ID par defaut pour tous les modeles
# BigAutoField = entier 64 bits auto-incrementé
# ===========================
# CONFIGURATION RESTAURANT (Pointage)
# ===========================
RESTAURANT_LATITUDE = 9.509167  # Exemple : Conakry
RESTAURANT_LONGITUDE = -13.712222
POINTAGE_MAX_DISTANCE_METERS = 100 # Rayon autoris autour du restaurant
