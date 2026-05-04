from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    # BigAutoField = entier 64 bits pour les IDs
    # Supporte jusqu'a 9 quintillions de lignes (largement suffisant !)
    
    name = 'apps.users'
    # IMPORTANT : le chemin complet depuis la racine du projet
    # Sans "apps." Django ne trouve pas l'app