from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view
# pyrefly: ignore [missing-import]
from apps.users.api_base import BaseViewSet
from .models import WeeklyAssignment, ShiftSchedule, SauceValidation, ScheduleChangeRequest
from .serializers import (
    WeeklyAssignmentReadSerializer, WeeklyAssignmentWriteSerializer,
    ShiftScheduleSerializer, SauceValidationSerializer,
    ScheduleChangeRequestReadSerializer, ScheduleChangeRequestWriteSerializer,
)


class IsAdminOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsAdminOrCaissier(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'caissier']


# ===================================================
# SHIFT SCHEDULE -- reserve ADMIN uniquement
# ===================================================
@extend_schema_view(
    list=extend_schema(tags=["Horaires"], summary="Liste des horaires de reference"),
    create=extend_schema(tags=["Horaires"], summary="Creer un horaire"),
    update=extend_schema(tags=["Horaires"], summary="Modifier un horaire"),
    destroy=extend_schema(tags=["Horaires"], summary="Supprimer un horaire"),
)
class ShiftScheduleViewSet(BaseViewSet):
    """
    CONFIDENTIEL : reserve a l'admin. Contient la tolerance de retard
    qui ne doit jamais etre visible par les autres roles.
    """
    queryset = ShiftSchedule.objects.all()
    serializer_class = ShiftScheduleSerializer
    permission_classes = [IsAdminOnly]


# ===================================================
# WEEKLY ASSIGNMENT -- le planning
# ===================================================
@extend_schema_view(
    list=extend_schema(tags=["Planning"], summary="Liste des affectations hebdomadaires"),
    create=extend_schema(tags=["Planning"], summary="Creer une affectation"),
    update=extend_schema(tags=["Planning"], summary="Modifier une affectation"),
    destroy=extend_schema(tags=["Planning"], summary="Supprimer une affectation"),
)
class WeeklyAssignmentViewSet(BaseViewSet):
    """
    Gestion du planning hebdomadaire type.
    """

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return WeeklyAssignmentWriteSerializer
        return WeeklyAssignmentReadSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOnly()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return WeeklyAssignment.objects.none()

        queryset = WeeklyAssignment.objects.all().select_related('employee__user', 'shift')
        user = self.request.user

        if user.role in ['serveur', 'cuisine']:
            queryset = queryset.filter(employee__user=user)

        employee_id = self.request.query_params.get('employee_id')
        jour_semaine = self.request.query_params.get('jour_semaine')

        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        if jour_semaine:
            queryset = queryset.filter(jour_semaine=jour_semaine)

        return queryset

    @extend_schema(
        tags=["Planning"],
        summary="Vue groupee par jour de la semaine (pour affichage tableau)",
    )
    @action(detail=False, methods=['get'], url_path='par-jour', permission_classes=[permissions.IsAuthenticated])
    def par_jour(self, request):
        queryset = self.get_queryset()
        from .models import JOURS_SEMAINE

        result = {}
        for jour_key, jour_label in JOURS_SEMAINE:
            assignments_du_jour = queryset.filter(jour_semaine=jour_key)
            result[jour_key] = {
                'label': jour_label,
                'affectations': WeeklyAssignmentReadSerializer(assignments_du_jour, many=True).data,
            }
        return Response(result)


# ===================================================
# SAUCE VALIDATION -- controle qualite (admin + caissier)
# ===================================================
@extend_schema_view(
    list=extend_schema(tags=["Sauce"], summary="Liste des validations de sauce"),
    create=extend_schema(tags=["Sauce"], summary="Valider une sauce"),
)
class SauceValidationViewSet(BaseViewSet):
    """
    REGLE METIER : seul un caissier ou un admin peut valider
    qu'une sauce a bien ete realisee.
    """
    queryset = SauceValidation.objects.all().select_related('assignment', 'valide_par')
    serializer_class = SauceValidationSerializer
    permission_classes = [IsAdminOrCaissier]

    def perform_create(self, serializer):
        serializer.save(valide_par=self.request.user)


# ===================================================
# SCHEDULE CHANGE REQUEST -- demandes de changement
# ===================================================
@extend_schema_view(
    list=extend_schema(tags=["Demandes"], summary="Liste des demandes de changement"),
    create=extend_schema(tags=["Demandes"], summary="Creer une demande de changement"),
)
class ScheduleChangeRequestViewSet(BaseViewSet):
    """
    L'employe cree une demande (statut='en_attente' par defaut).
    Seul l'admin peut ensuite l'accepter ou la refuser.
    """

    def get_serializer_class(self):
        if self.action == 'create':
            return ScheduleChangeRequestWriteSerializer
        return ScheduleChangeRequestReadSerializer

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return ScheduleChangeRequest.objects.none()

        queryset = ScheduleChangeRequest.objects.all().select_related('demande_par__user', 'assignment')
        user = self.request.user

        if user.role in ['serveur', 'cuisine', 'caissier']:
            queryset = queryset.filter(demande_par__user=user)

        return queryset

    def get_permissions(self):
        if self.action in ['accepter', 'refuser']:
            return [IsAdminOnly()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(demande_par=self.request.user.employee)

    @extend_schema(tags=["Demandes"], summary="Accepter une demande (Admin)")
    @action(detail=True, methods=['post'], url_path='accepter')
    def accepter(self, request, pk=None):
        demande = self.get_object()
        demande.statut = 'accepte'
        demande.reponse_admin = request.data.get('reponse_admin', '')
        demande.traite_par = request.user
        demande.save()
        return Response(ScheduleChangeRequestReadSerializer(demande).data)

    @extend_schema(tags=["Demandes"], summary="Refuser une demande (Admin)")
    @action(detail=True, methods=['post'], url_path='refuser')
    def refuser(self, request, pk=None):
        demande = self.get_object()
        demande.statut = 'refuse'
        demande.reponse_admin = request.data.get('reponse_admin', '')
        demande.traite_par = request.user
        demande.save()
        return Response(ScheduleChangeRequestReadSerializer(demande).data)
