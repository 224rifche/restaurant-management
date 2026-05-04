# ===========================
# IMPORTS
# ===========================
from rest_framework import viewsets, status, permissions
# "viewsets" = classes DRF qui regroupent toutes les actions CRUD
#              en un seul endroit (list, create, retrieve, update, destroy)
#
# "status" = constantes HTTP de DRF
#             status.HTTP_200_OK        = 200
#             status.HTTP_201_CREATED   = 201
#             status.HTTP_400_BAD_REQUEST = 400
#             status.HTTP_404_NOT_FOUND = 404
#             Utiliser ces constantes plutôt que des chiffres bruts
#             rend le code plus lisible et moins sujet aux fautes de frappe
#
# "permissions" = module de gestion des droits d'accès
#                 Qui a le droit de faire quoi ?

from rest_framework.decorators import action
# "action" = décorateur pour ajouter des endpoints personnalisés
#             au-delà du CRUD standard
#             Ex: /api/users/{id}/change-password/
#             Sans ce décorateur, on ne peut faire que
#             list/create/retrieve/update/destroy

from rest_framework.response import Response
# "Response" = la classe pour construire les réponses HTTP dans DRF
# Elle prend des données Python et les convertit automatiquement en JSON
# C'est TOUJOURS elle qu'on utilise dans DRF, jamais HttpResponse de Django

from django.contrib.auth import authenticate
# Fonction Django qui vérifie les identifiants de connexion
# authenticate(telephone=..., password=...) 
# → retourne l'objet User si correct
# → retourne None si incorrect
# Elle utilise notre backend d'authentification défini dans settings.py

from .models import User
from .serializers import (
    UserReadSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer,
)
# On importe tous nos serializers créés à l'étape précédente
# Les parenthèses permettent d'importer sur plusieurs lignes
# pour la lisibilité - PEP8 (guide de style Python)


# ===========================
# PERMISSION PERSONNALISÉE
# ===========================
class IsAdminUser(permissions.BasePermission):
    """
    On crée notre propre classe de permission.
    
    DRF a un système de permissions modulaire :
    - Chaque view peut avoir une liste de permissions
    - DRF les vérifie AVANT d'exécuter la view
    - Si une permission échoue → HTTP 403 Forbidden automatiquement
    
    On hérite de permissions.BasePermission
    et on surcharge has_permission() pour définir notre règle
    """

    def has_permission(self, request, view):
        """
        Cette méthode est appelée automatiquement par DRF
        avant chaque requête sur la view protégée.
        
        request = la requête HTTP en cours
        view    = la view qui est appelée
        
        Doit retourner True (accès autorisé) ou False (accès refusé)
        """

        return (
            request.user.is_authenticated
            # is_authenticated = True si l'utilisateur est connecté
            # (son token JWT est valide)
            # False si pas de token ou token expiré → on bloque

            and request.user.role == 'admin'
            # ET son rôle doit être 'admin'
            # Un serveur connecté ne peut pas accéder aux endpoints admin
        )


# ===========================
# VIEWSET PRINCIPAL
# ===========================
class UserViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet est la classe la plus puissante de DRF.
    
    En héritant de ModelViewSet, on obtient AUTOMATIQUEMENT
    ces 5 actions sans écrire une seule ligne supplémentaire :
    
    Action      Méthode HTTP   URL
    ─────────────────────────────────────────────
    list        GET            /api/users/
    create      POST           /api/users/
    retrieve    GET            /api/users/{id}/
    update      PUT            /api/users/{id}/
    partial_update PATCH       /api/users/{id}/
    destroy     DELETE         /api/users/{id}/
    
    On va personnaliser certaines de ces actions
    et en ajouter de nouvelles.
    """

    queryset = User.objects.all().order_by('-date_creation')
    # queryset = la liste d'objets de base que cette view peut manipuler
    #
    # User.objects.all() = récupère TOUS les utilisateurs de la base
    # .order_by('-date_creation') = triés par date, plus récent en premier
    # Le "-" = ordre décroissant (sans "-" = ordre croissant)
    #
    # Ce queryset est le point de départ - on peut le filtrer
    # ensuite dans chaque action si nécessaire

    permission_classes = [IsAdminUser]
    # Seuls les admins peuvent accéder à toutes les actions de ce ViewSet
    # DRF vérifie cette permission AVANT chaque action
    # Si non-admin → HTTP 403 Forbidden automatiquement
    #
    # On verra plus loin comment surcharger ça par action
    # (ex: un user peut voir son propre profil sans être admin)

    def get_serializer_class(self):
        """
        get_serializer_class() est appelée par DRF automatiquement
        pour savoir QUEL serializer utiliser.
        
        On surcharge cette méthode pour retourner
        un serializer différent selon l'action en cours.
        
        self.action = le nom de l'action en cours
        ('list', 'create', 'retrieve', 'update', 'partial_update', 'destroy')
        """

        if self.action == 'create':
            return UserCreateSerializer
            # Pour créer un user, on a besoin de password + password2

        if self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
            # Pour modifier, on utilise le serializer sans mot de passe

        if self.action == 'change_password':
            return ChangePasswordSerializer
            # Pour changer le mot de passe, serializer dédié

        return UserReadSerializer
        # Par défaut (list, retrieve, et tout le reste)
        # on utilise le serializer de lecture (sans mot de passe)

    def create(self, request, *args, **kwargs):
        """
        Surcharge de l'action "create" (POST /api/users/)
        
        On surcharge pour contrôler exactement ce qui est renvoyé
        après la création. Par défaut, ModelViewSet renverrait
        les données avec UserCreateSerializer (qui a password).
        On veut renvoyer les données avec UserReadSerializer.
        """

        serializer = UserCreateSerializer(data=request.data)
        # request.data contient les donnees de l'utilisateur (telephone, nom, etc.)
        # 
        # On passe ces données au serializer pour validation

        serializer.is_valid(raise_exception=True)
        # is_valid() déclenche toutes les validations :
        # - les champs requis sont présents ?
        # - les formats sont corrects ?
        # - les mots de passe correspondent ?
        # - la complexité du mot de passe est suffisante ?
        #
        # raise_exception=True = si invalide, DRF lève automatiquement
        # une exception qui renvoie HTTP 400 avec les erreurs en JSON
        # Sans ça, il faudrait vérifier manuellement if not serializer.is_valid()

        user = serializer.save()
        # .save() appelle notre méthode create() du serializer
        # qui appelle User.objects.create_user() avec hashage du mot de passe
        # Retourne l'objet User créé en base

        read_serializer = UserReadSerializer(user)
        # On crée un nouveau serializer de LECTURE
        # avec l'objet user qu'on vient de créer
        # Pour renvoyer les données propres (sans mot de passe)

        return Response(read_serializer.data, status=status.HTTP_201_CREATED)
        # read_serializer.data = dict Python des données sérialisées
        # DRF le convertit automatiquement en JSON
        # HTTP 201 = "Created" - convention REST pour une création réussie

    def update(self, request, *args, **kwargs):
        """
        Surcharge de l'action "update" (PUT et PATCH /api/users/{id}/)
        
        kwargs['partial'] vaut True pour PATCH, False pour PUT
        On récupère ça pour le passer au serializer
        """

        partial = kwargs.pop('partial', False)
        # .pop('partial', False) = retire 'partial' de kwargs et le retourne
        # Si 'partial' n'existe pas, retourne False par défaut
        # partial=True → PATCH (champs optionnels)
        # partial=False → PUT (tous les champs requis)

        instance = self.get_object()
        # get_object() est fourni par ModelViewSet
        # Il récupère automatiquement l'utilisateur demandé
        # depuis l'URL /api/users/{id}/
        # Si l'id n'existe pas → HTTP 404 automatiquement

        serializer = UserUpdateSerializer(
            instance,
            data=request.data,
            partial=partial
        )
        # On passe l'instance existante + les nouvelles données
        # DRF comprend qu'on fait une mise à jour (pas une création)

        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        # Même logique que create()

        return Response(UserReadSerializer(user).data, status=status.HTTP_200_OK)
        # HTTP 200 = "OK" - convention REST pour une modification réussie

    @action(
        detail=True,
        # detail=True = cet endpoint concerne UN utilisateur spécifique
        # → URL sera /api/users/{id}/change-password/
        # detail=False aurait donné /api/users/change-password/

        methods=['post'],
        # Seule la méthode POST est acceptée sur cet endpoint
        # Une tentative GET → HTTP 405 Method Not Allowed

        permission_classes=[permissions.IsAuthenticated],
        # On surcharge les permissions pour CET endpoint uniquement
        # Un utilisateur connecté peut changer SON mot de passe
        # sans avoir besoin d'être admin
        # IsAuthenticated = juste vérifier que le token JWT est valide
    )
    def change_password(self, request, pk=None):
        """
        Endpoint personnalisé : POST /api/users/{id}/change-password/
        
        pk = "primary key" = l'id de l'utilisateur dans l'URL
        Exemple : /api/users/3/change-password/ → pk = 3
        """

        user = self.get_object()
        # Récupère l'utilisateur dont l'id est dans l'URL

        if request.user != user and request.user.role != 'admin':
            return Response(
                {"detail": "Vous ne pouvez pas modifier le mot de passe d'un autre utilisateur."},
                status=status.HTTP_403_FORBIDDEN
            )
        # Vérification métier importante :
        # - Tu peux changer TON mot de passe (request.user == user)
        # - OU tu es admin (tu peux changer celui de n'importe qui)
        # - Sinon → HTTP 403 Forbidden
        #
        # Sans cette vérification, n'importe quel utilisateur connecté
        # pourrait changer le mot de passe de quelqu'un d'autre !

        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {"old_password": "Mot de passe actuel incorrect."},
                status=status.HTTP_400_BAD_REQUEST
            )
        # check_password() est une méthode de Django
        # Elle compare le mot de passe saisi avec le hash en base
        # JAMAIS on compare en clair - toujours via cette méthode
        # Si incorrect → on arrête et on renvoie une erreur

        user.set_password(serializer.validated_data['new_password'])
        # set_password() = méthode Django qui :
        # 1. Prend le nouveau mot de passe en clair
        # 2. Le HASH avec l'algorithme configuré (PBKDF2 par défaut)
        # 3. Stocke le hash dans user.password
        # JAMAIS user.password = 'valeur_en_clair' directement !

        user.save()
        # Sauvegarde les changements en base de données
        # Sans .save(), les modifications restent en mémoire seulement

        return Response(
            {"detail": "Mot de passe modifié avec succès."},
            status=status.HTTP_200_OK
        )