"""
Fichier principal des URLs de Django.

C'est le "chef d'orchestre" des URLs :
Django reçoit une requête → lit ce fichier → sait où la router.

Analogie :
C'est comme le standard téléphonique d'un hôtel.
Le client appelle → le standard redirige vers la bonne chambre.
Ici : la requête arrive → Django redirige vers la bonne app.

Chaque app a ENSUITE son propre fichier urls.py pour ses détails.
Ce fichier ne fait que dire "pour /api/users/... va voir apps/users/urls.py"
"""

# ===========================
# IMPORTS
# ===========================
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
# Le module d'administration Django
# admin.site.urls = toutes les URLs de l'interface /admin
# Générées automatiquement depuis notre admin.py

from django.urls import path, include
# path()    = définir une URL et son handler
#             Syntaxe : path('chemin/', vue_ou_include)
#
# include() = inclure un autre fichier urls.py
#             Permet de déléguer les URLs à une sous-app
#             Avantage : chaque app gère ses propres URLs indépendamment
#             Si on supprime une app, on retire juste sa ligne ici

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
# Ces trois vues sont fournies DIRECTEMENT par simplejwt
# On n'a pas besoin de les créer nous-mêmes !
#
# TokenObtainPairView  = POST /api/token/
#   → Le client envoie téléphone + mot de passe
#   → Django vérifie, retourne access_token + refresh_token
#   → C'est le "LOGIN"
#
# TokenRefreshView = POST /api/token/refresh/
#   → Le client envoie son refresh_token (qui expire dans 24h)
#   → Django retourne un nouveau access_token (+ nouveau refresh_token si ROTATE=True)
#   → Permet de rester connecté sans ressaisir le mot de passe
#
# TokenVerifyView = POST /api/token/verify/
#   → Le client envoie un token
#   → Django répond : valide (HTTP 200) ou invalide (HTTP 401)
#   → Utile pour vérifier si l'utilisateur est encore connecté au chargement de l'app


# ===========================
# DÉFINITION DES URLs
# ===========================
urlpatterns = [
    # "urlpatterns" est le NOM OBLIGATOIRE que Django cherche dans ce fichier
    # C'est une liste Python de chemins URL
    # Django les parcourt DANS L'ORDRE → s'arrête au premier qui correspond

    # ---------------------------
    # INTERFACE D'ADMINISTRATION
    # ---------------------------
    path('admin/', admin.site.urls),
    # Toutes les URLs commençant par /admin/ → interface Django admin
    #
    # admin.site.urls génère automatiquement TOUTES les URLs de /admin :
    # /admin/                    → page d'accueil admin
    # /admin/users/user/         → liste des utilisateurs
    # /admin/users/user/add/     → ajouter un utilisateur
    # /admin/users/user/1/change/ → modifier l'utilisateur #1
    # etc.
    #
    # On n'écrit pas ces URLs nous-mêmes, Django admin les génère
    # à partir des classes qu'on a définies dans admin.py

    # ---------------------------
    # AUTHENTIFICATION JWT
    # ---------------------------
    path('api/token', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    # POST /api/token
    # Corps de la requete (JSON) : telephone et password
    #
    # Reponse si correct (HTTP 200) : access et refresh tokens
    #
    # Reponse si incorrect (HTTP 401) : detail d'erreur
    #
    # .as_view() : TokenObtainPairView est une classe, pas une fonction
    # Django a besoin d'une fonction → .as_view() fait la conversion
    #
    # name='token_obtain_pair' : nom de cette URL pour la référencer dans le code
    # Ex: reverse('token_obtain_pair') → '/api/token'

    path('api/token/refresh', TokenRefreshView.as_view(), name='token_refresh'),
    # POST /api/token/refresh
    # Corps de la requête (JSON) :
    # {
    #   "refresh": "eyJ0eXAi...."  ← l'ancien refresh token
    # }
    #
    # Réponse si valide (HTTP 200) :
    # {
    #   "access": "eyJ0eXAi....",   ← nouveau access token (60 min)
    #   "refresh": "eyJ0eXAi...."  ← nouveau refresh token (car ROTATE=True)
    # }
    # L'ancien refresh token est blacklisté immédiatement (car BLACKLIST=True)
    #
    # Le frontend appelle cet endpoint automatiquement quand il reçoit HTTP 401
    # L'utilisateur ne voit rien, l'expérience est transparente

    path('api/token/verify', TokenVerifyView.as_view(), name='token_verify'),
    # POST /api/token/verify
    # Corps de la requête :
    # {
    #   "token": "eyJ0eXAi...."  ← l'access token à vérifier
    # }
    #
    # Réponse valide    → HTTP 200 {}
    # Réponse invalide  → HTTP 401 {"detail": "Token is invalid or expired"}
    #
    # Cas d'usage : quand l'app Next.js démarre (ou l'onglet se rouvre),
    # elle vérifie si le token stocké est encore valide
    # avant de rediriger vers la page de login

    # ---------------------------
    
    # NOS APPLICATIONS 
    # ---------------------------
    path('api/', include('apps.users.urls')),
    path('api/', include('apps.employees.urls')),
    path('api/', include('apps.schedules.urls')),
    path('api/', include('apps.attendance.urls')),
    path('api/', include('apps.notifications.urls')),
    path('api/', include('apps.expenses.urls')),
    # C'est ici que l'on connecte nos propres modules métier.
    # Pour toute URL commençant par /api/, on passe le relais à apps/users/urls.py

    # ---------------------------
    # DOCUMENTATION API
    # ---------------------------
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

# Service des fichiers MEDIA (Selfies) en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

