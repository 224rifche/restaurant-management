# ===========================
# IMPORTS
# ===========================
from rest_framework import status, permissions, filters
# status : constantes HTTP (HTTP_200_OK, HTTP_201_CREATED, HTTP_404_NOT_FOUND...)
# permissions : classes de permission (IsAuthenticated, etc.)
# filters : SearchFilter, OrderingFilter pour la recherche/tri

from rest_framework.decorators import action
# @action : décorateur pour créer des endpoints custom dans un ViewSet
# Ex: /api/employees/{id}/activer/ → une action custom "activer"

from rest_framework.response import Response
# Response : la classe de réponse DRF
# Différent de HttpResponse Django : gère automatiquement JSON/XML/etc.

from django_filters.rest_framework import DjangoFilterBackend
# DjangoFilterBackend : filtre exact sur des champs
# Ex: /api/employees/?poste=serveur → filtre sur le poste

from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
# Pour documenter l'API automatiquement (Swagger/Redoc)

from .models import Employee
from .serializers import (
    EmployeeReadSerializer,
    EmployeeCreateSerializer,
    EmployeeUpdateSerializer,
    EmployeeListSimpleSerializer,
)
# pyrefly: ignore [missing-import]
from apps.users.api_base import BaseViewSet
from django.utils import timezone
# pyrefly: ignore [missing-import]
from apps.schedules.services import ReplacementService
# BaseViewSet = notre ViewSet de base dans apps/users/api_base.py
# Il contient déjà la logique commune (gestion swagger_fake_view)


# ===========================
# PERMISSIONS PERSONNALISÉES
# ===========================
class IsAdminOrCaissier(permissions.BasePermission):
    """
    Autoriser uniquement les admins ET les caissiers.
    
    Explication du pattern BasePermission :
    - DRF vérifie has_permission() pour CHAQUE requête
    - Si retourne False → HTTP 403 Forbidden automatiquement
    - Si retourne True → la requête continue vers la vue
    
    Cas d'usage :
    - Admin : peut tout faire (CRUD complet)
    - Caissier : peut VOIR les employés (lecture seule)
    - Serveur/Sauce : ne peuvent PAS accéder à cette API
    """
    
    def has_permission(self, request, view):
        # request.user = l'utilisateur authentifié (via JWT)
        # Si pas de token JWT → request.user = AnonymousUser
        
        if not request.user.is_authenticated:
            # AnonymousUser.is_authenticated = toujours False
            return False
        
        return request.user.role in ['admin', 'caissier']
        # Retourne True si le rôle est admin OU caissier
        # Retourne False pour tout autre rôle


class IsAdminOnly(permissions.BasePermission):
    """
    Uniquement les admins.
    Pour les opérations d'écriture (créer, modifier, supprimer).
    """
    
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == 'admin'
        )


from .filters import EmployeeFilter

# ===========================
# VIEWSET PRINCIPAL
# ===========================
@extend_schema_view(
    # @extend_schema_view : ajoute de la documentation à chaque action du ViewSet
    # DRF Spectacular génère automatiquement la doc Swagger à partir de ça
    
    list=extend_schema(
        tags=["Employés"],
        summary="Liste tous les employés",
        description="Retourne la liste de tous les employés. Filtrable par poste et statut.",
    ),
    retrieve=extend_schema(tags=["Employés"], summary="Détail d'un employé"),
    create=extend_schema(tags=["Employés"], summary="Créer un nouvel employé"),
    update=extend_schema(tags=["Employés"], summary="Modifier un employé (complet)"),
    partial_update=extend_schema(tags=["Employés"], summary="Modifier un employé (partiel)"),
    destroy=extend_schema(tags=["Employés"], summary="Désactiver un employé"),
)
class EmployeeViewSet(BaseViewSet):
    """
    ViewSet pour la gestion complète des employés.
    
    Ce ViewSet hérite de BaseViewSet (qui hérite de ModelViewSet).
    ModelViewSet fournit AUTOMATIQUEMENT ces 5 actions :
    
    GET    /api/employees/         → list()          (liste)
    POST   /api/employees/         → create()        (créer)
    GET    /api/employees/{id}/    → retrieve()      (détail)
    PUT    /api/employees/{id}/    → update()        (modifier complet)
    PATCH  /api/employees/{id}/    → partial_update()(modifier partiel)
    DELETE /api/employees/{id}/    → destroy()       (supprimer)
    
    On override certaines pour personnaliser le comportement.
    """
    
    def get_queryset(self):
        """
        Optimisation critique : select_related('user') pour éviter le N+1.
        Gestion de swagger_fake_view pour la documentation automatique.
        """
        # REQUIRED pour drf-spectacular : évite de faire des requêtes réelles
        # lors de la génération du schéma OpenAPI
        if getattr(self, "swagger_fake_view", False):
            return Employee.objects.none()

        return Employee.objects.all().select_related('user').order_by('-inserted_at')
    
    # ===========================
    # FILTRAGE ET RECHERCHE
    # ===========================
    filter_backends = [
        DjangoFilterBackend,
        # Pour les filtres exacts : ?poste=serveur, ?statut=actif
        
        filters.SearchFilter,
        # Pour la recherche textuelle : ?search=Awa
        # Cherche dans les champs définis dans search_fields
        
        filters.OrderingFilter,
        # Pour le tri : ?ordering=poste, ?ordering=-inserted_at
        # Cherche dans les champs définis dans ordering_fields
    ]
    
    filterset_class = EmployeeFilter
    # Utilisation de notre classe de filtre personnalisée (recommandé par le skill)
    
    search_fields = ['user__nom', 'user__telephone']
    # search_fields : champs dans lesquels SearchFilter cherche
    # 'user__nom' = le champ nom de la table User (jointure automatique)
    # '__' = traverser une relation (comme JOIN en SQL)
    # Ex: GET /api/employees/?search=Awa → cherche "Awa" dans les noms
    
    ordering_fields = ['inserted_at', 'poste', 'statut']
    # ordering_fields : quels champs on peut utiliser pour trier
    # Ex: GET /api/employees/?ordering=poste → tri alphabétique par poste
    
    ordering = ['-inserted_at']
    # Tri par défaut si ?ordering n'est pas spécifié
    
    # ===========================
    # SÉLECTION DYNAMIQUE DU SERIALIZER
    # ===========================
    def get_serializer_class(self):
        """
        Retourne le bon serializer selon l'action en cours.
        
        self.action = nom de l'action ('list', 'create', 'update', etc.)
        DRF renseigne cette propriété automatiquement.
        
        C'est le pattern "serializer par action" (bonne pratique pro).
        """
        if self.action == 'create':
            return EmployeeCreateSerializer
            # POST /api/employees/ → on accepte nom, tel, password, poste...
        
        if self.action in ['update', 'partial_update']:
            return EmployeeUpdateSerializer
            # PUT ou PATCH /api/employees/{id}/ → on accepte les modifications
        
        if self.action == 'simple_list':
            return EmployeeListSimpleSerializer
            # Notre action custom (définie plus bas)
        
        return EmployeeReadSerializer
        # Par défaut (list, retrieve) → lecture complète
    
    # ===========================
    # SÉLECTION DYNAMIQUE DES PERMISSIONS
    # ===========================
    def get_permissions(self):
        """
        Retourne les permissions selon l'action.
        
        Règle métier :
        - Lire (list, retrieve) : Admin ET Caissier peuvent
        - Écrire (create, update, destroy) : Admin SEULEMENT
        
        C'est plus fin que d'appliquer une permission globale.
        """
        if self.action in ['list', 'retrieve', 'simple_list', 'actifs_par_poste']:
            # Lecture → Admin ou Caissier
            return [IsAdminOrCaissier()]
            # IMPORTANT : on retourne des INSTANCES (avec parenthèses)
            # pas des classes
        
        # Toute autre action (create, update, partial_update, destroy, activer, desactiver)
        # → Admin seulement
        return [IsAdminOnly()]
    
    # ===========================
    # OVERRIDE : CREATE
    # ===========================
    def create(self, request, *args, **kwargs):
        """
        Override de create() pour personnaliser la réponse.
        
        Problème avec le create() par défaut de DRF :
        Il utilise le MÊME serializer pour lire la réponse que pour écrire.
        Or notre EmployeeCreateSerializer ne retourne pas toutes les données.
        
        Solution : après la création, on utilise EmployeeReadSerializer
        pour retourner les données complètes.
        """
        serializer = self.get_serializer(data=request.data)
        # get_serializer() = instancie le bon serializer (EmployeeCreateSerializer ici)
        # data=request.data : les données JSON de la requête
        
        serializer.is_valid(raise_exception=True)
        # is_valid() : lance la validation (tous les validators, validate_*(), etc.)
        # raise_exception=True : si invalide → lève une exception → DRF retourne HTTP 400
        # Sans raise_exception : on devrait gérer l'erreur manuellement
        
        employee = serializer.save()
        # .save() : appelle create() du serializer → crée User + Employee en BDD
        # Retourne l'objet Employee créé
        
        # Retourner les données complètes avec le ReadSerializer
        read_serializer = EmployeeReadSerializer(employee)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)
        # HTTP_201_CREATED = 201 (convention REST pour la création réussie)
        # HTTP_200_OK = 200 (pour les lectures et modifications)
    
    # ===========================
    # OVERRIDE : UPDATE
    # ===========================
    def update(self, request, *args, **kwargs):
        """
        Override de update() pour retourner les données complètes.
        """
        partial = kwargs.pop('partial', False)
        # partial=True → PATCH (modification partielle)
        # partial=False → PUT (remplacement complet)
        
        instance = self.get_object()
        # get_object() : récupère l'Employee par son ID (depuis l'URL)
        # Lève automatiquement HTTP 404 si l'ID n'existe pas
        
        serializer = self.get_serializer(
            instance,
            # instance : l'objet existant à modifier
            data=request.data,
            partial=partial,
            # partial=True : les champs non envoyés gardent leur valeur actuelle
            # partial=False : les champs non envoyés prennent leur valeur par défaut
        )
        serializer.is_valid(raise_exception=True)
        employee = serializer.save()
        
        return Response(EmployeeReadSerializer(employee).data, status=status.HTTP_200_OK)
    
    # ===========================
    # OVERRIDE : DESTROY (soft delete)
    # ===========================
    def destroy(self, request, *args, **kwargs):
        """
        On ne supprime PAS vraiment l'employé.
        On le marque comme "inactif" (soft delete).
        
        Pourquoi ?
        - L'historique de pointage référence cet employé
        - Si on supprime l'employé → les pointages "orphelins" posent problème
        - En Guinée, les conflits sociaux sont fréquents
        - Garder la trace "cet employé a travaillé du X au Y" est important
        
        C'est une décision MÉTIER, pas technique.
        """
        instance = self.get_object()
        
        # Soft delete : désactiver au lieu de supprimer
        instance.statut = 'inactif'
        instance.save()
        
        # Désactiver aussi le compte User pour empêcher la connexion
        instance.user.is_active = False
        instance.user.save()
        
        return Response(
            {"detail": f"L'employé {instance.user.nom} a été désactivé."},
            status=status.HTTP_200_OK
            # On retourne 200 (pas 204) car on envoie un message
            # HTTP 204 = succès SANS corps de réponse
        )
    
    # ===========================
    # ACTIONS CUSTOM
    # ===========================
    
    @extend_schema(
        tags=["Employés"],
        summary="Réactiver un employé",
        responses={200: EmployeeReadSerializer}
    )
    @action(
        detail=True,
        # detail=True : action sur UN employé spécifique (avec {id} dans l'URL)
        # URL générée : /api/employees/{id}/activer/
        
        methods=['post'],
        # methods : méthodes HTTP acceptées
        # POST car on fait une action, pas une lecture
        
        url_path='activer',
        # url_path : le segment d'URL après {id}
        # Sans ça : DRF utilise le nom de la méthode Python ('activer')
        # C'est pareil ici mais c'est une bonne pratique de l'expliciter
    )
    def activer(self, request, pk=None):
        """
        Réactive un employé qui était inactif.
        POST /api/employees/{id}/activer/
        """
        employee = self.get_object()
        
        if employee.statut == 'actif':
            return Response(
                {"detail": "Cet employé est déjà actif."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        employee.statut = 'actif'
        employee.save()
        
        # Réactiver le compte User
        employee.user.is_active = True
        employee.user.save()
        
        return Response(
            EmployeeReadSerializer(employee).data,
            status=status.HTTP_200_OK
        )
    
    @extend_schema(
        tags=["Employés"],
        summary="Liste simplifiée (pour dropdowns)",
        description="Retourne id + nom + poste uniquement. Utile pour les formulaires de planning.",
        responses={200: EmployeeListSimpleSerializer(many=True)}
    )
    @action(
        detail=False,
        # detail=False : action sur la COLLECTION (pas un employé spécifique)
        # URL générée : /api/employees/simple/
        
        methods=['get'],
        url_path='simple',
    )
    def simple_list(self, request):
        """
        Liste légère des employés actifs.
        GET /api/employees/simple/
        
        Utilisé par :
        - Le formulaire de création de planning (choisir un employé)
        - Les dropdowns dans le frontend
        
        Retourne SEULEMENT les employés actifs (filtre automatique).
        """
        queryset = Employee.objects.filter(statut='actif').select_related('user')
        serializer = EmployeeListSimpleSerializer(queryset, many=True)
        # many=True : on sérialise une LISTE d'objets (pas un seul)
        return Response(serializer.data)
    
    @extend_schema(
        tags=["Employés"],
        summary="Employés actifs groupés par poste",
        description="Retourne les employés actifs organisés par poste. Utile pour le dashboard.",
    )
    @action(
        detail=False,
        methods=['get'],
        url_path='par-poste',
    )
    def actifs_par_poste(self, request):
        """
        Retourne les employés actifs organisés par poste.
        GET /api/employees/par-poste/
        
        Réponse :
        {
            "serveur": [...],
            "caissier": [...],
        }
        Utile pour le dashboard admin : voir d'un coup d'œil
        combien de personnes par département.
        """
        actifs = Employee.objects.filter(statut='actif').select_related('user')
        
        result = {}
        for poste_value, poste_label in [('serveur', 'Serveurs'), ('caissier', 'Caissiers'), ('admin', 'Administrateurs')]:
            employes_du_poste = actifs.filter(poste=poste_value)
            result[poste_value] = {
                'label': poste_label,
                'count': employes_du_poste.count(),
                # .count() : requête SQL COUNT(*) → retourne juste le nombre
                # Plus efficace que len(liste) qui chargerait tous les objets
                
                'employes': EmployeeListSimpleSerializer(employes_du_poste, many=True).data,
            }
        return Response(result)
        
    @extend_schema(
        tags=["Employés"],
        summary="Supprimer définitivement un employé",
        description="Supprime l'employé et son compte utilisateur associé définitivement de la base de données."
    )
    @action(detail=True, methods=['delete'], url_path='hard-delete', permission_classes=[IsAdminOnly])
    def hard_delete(self, request, pk=None):
        """
        Supprime définitivement un employé (et son User associé par cascade).
        """
        employee = self.get_object()
        user = employee.user
        nom = user.nom
        user.delete()
        return Response(
            {"detail": f"L'employé {nom} a été supprimé définitivement."},
            status=status.HTTP_200_OK
        )

    @extend_schema(
        tags=["Employés"],
        summary="Marquer un employé comme absent aujourd'hui",
        description="Déclenche automatiquement le moteur de remplacement."
    )
    @action(detail=True, methods=['post'], url_path='marquer-absent')
    def marquer_absent(self, request, pk=None):
        """
        Déclenche manuellement le remplacement d'un employé.
        Utile pour tester le moteur ou gérer une absence imprévue.
        """
        employee = self.get_object()
        today = timezone.now().date()
        
        result = ReplacementService.trigger_replacement(employee, today)
        
        if isinstance(result, str):
            return Response({"detail": result}, status=status.HTTP_400_BAD_REQUEST)
            
        return Response({
            "detail": f"Remplacement effectué avec succès par {result.employee.user.nom}.",
            "schedule_id": str(result.id)
        }, status=status.HTTP_201_CREATED)