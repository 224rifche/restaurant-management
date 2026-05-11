# ===========================
# IMPORTS
# ===========================
from rest_framework.routers import DefaultRouter
# DefaultRouter = le système magique de DRF
#
# Rappelle-toi : notre UserViewSet hérite de ModelViewSet
# qui donne automatiquement 5 actions (list, create, retrieve, update, destroy)
#
# DefaultRouter LIT ces actions et GÉNÈRE automatiquement
# toutes les URLs correspondantes
#
# Sans Router, il faudrait écrire manuellement :
# path('users/', UserViewSet.as_view({'get': 'list', 'post': 'create'}))
# path('users/<pk>/', UserViewSet.as_view({'get': 'retrieve', ...}))
# etc. → long et répétitif
#
# Avec Router → une seule ligne fait tout ça

from .views import UserViewSet
# On importe notre ViewSet depuis views.py
# Le point "." = même dossier (apps/users/)


# ===========================
# CRÉATION DU ROUTER
# ===========================
router = DefaultRouter(trailing_slash=False)
# On instancie le router
# C'est lui qui va gérer toute la génération d'URLs

router.register(
    r'users',
    # r'users' = le préfixe d'URL
    # Le "r" devant la string = "raw string" (ignore les caractères spéciaux)
    # C'est une convention Python pour les URLs/regex
    #
    # Ce préfixe donnera :
    # /users/          pour la liste
    # /users/{id}/     pour le détail
    # /users/{id}/change-password/  pour notre action custom

    UserViewSet,
    # Le ViewSet à associer à ce préfixe
    # Le Router va inspecter ses actions et générer les URLs

    basename='user'
    # basename = préfixe pour les noms d'URLs générés
    # DRF nomme chaque URL pour pouvoir les référencer par nom :
    # 'user-list'     → /users/
    # 'user-detail'   → /users/{id}/
    # Utile pour les tests et la génération d'URLs dans le code
)


# ===========================
# EXPORT DES URLS
# ===========================
urlpatterns = router.urls
# router.urls = la liste de toutes les URLs générées automatiquement
# On l'assigne à urlpatterns qui est le nom standard
# que Django cherche dans chaque fichier urls.py
#
# À ce stade, le Router a généré :
# GET    /users/                          → list
# POST   /users/                          → create
# GET    /users/{id}/                     → retrieve
# PUT    /users/{id}/                     → update
# PATCH  /users/{id}/                     → partial_update
# DELETE /users/{id}/                     → destroy
# POST   /users/{id}/change-password/     → change_password