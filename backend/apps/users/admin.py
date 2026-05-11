from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    @admin.register(User)
    = décore la classe pour dire à Django :
      "affiche ce modèle dans l'interface /admin"
    
    On hérite de BaseUserAdmin et pas de admin.ModelAdmin
    car BaseUserAdmin gère déjà :
    - le formulaire sécurisé de changement de mot de passe
    - l'affichage securise du mot de passe (hache)
    """

    # Ce qu'on voit dans le tableau de liste /admin/users/user/
    list_display = ('telephone', 'nom', 'role', 'is_active', 'inserted_at')

    # Filtres cliquables sur la droite
    list_filter = ('role', 'is_active')

    # Barre de recherche en haut
    search_fields = ('telephone', 'nom')

    # Tri par défaut : plus récent en premier
    ordering = ('-inserted_at',)

    # ===========================
    # FORMULAIRE DE MODIFICATION
    # Ce qu'on voit quand on clique sur un user existant
    # Organisé en sections
    # ===========================
    fieldsets = (
        ('Connexion', {
            'fields': ('telephone', 'password')
            # 'password' est gere par BaseUserAdmin (affichage securise)
        }),
        ('Informations personnelles', {
            'fields': ('nom', 'role')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser')
        }),
        ('Dates', {
            'fields': ('inserted_at', 'updated_at'),
            'classes': ('collapse',)
            # 'collapse' = section repliée par défaut
            # L'utilisateur peut l'ouvrir en cliquant
        }),
    )

    # Ces champs sont auto-remplis par Django → lecture seule
    readonly_fields = ('inserted_at', 'updated_at')

    # ===========================
    # FORMULAIRE DE CRÉATION
    # Ce qu'on voit quand on clique "Ajouter un user"
    # ===========================
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('telephone', 'nom', 'role', 'password1', 'password2')
            # Champs de creation securises
        }),
    )

    filter_horizontal = ()
    # On vide ça car on n'utilise pas les groupes Django