from drf_spectacular.utils import extend_schema, extend_schema_view
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
# pyrefly: ignore [missing-import]
from apps.users.api_base import BaseViewSet
from .models import Schedule
from .serializers import ScheduleReadSerializer, ScheduleWriteSerializer

@extend_schema_view(
    list=extend_schema(tags=["Plannings"], summary="Liste des plannings (filtres possibles)"),
    retrieve=extend_schema(tags=["Plannings"], summary="Détail d'un créneau"),
    create=extend_schema(tags=["Plannings"], summary="Ajouter un créneau au planning"),
    update=extend_schema(tags=["Plannings"], summary="Modifier un créneau"),
    destroy=extend_schema(tags=["Plannings"], summary="Supprimer un créneau"),
)
class ScheduleViewSet(BaseViewSet):
    """
    ViewSet pour la gestion du planning.
    """
    
    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Schedule.objects.none()

        # On charge l'employé ET son compte utilisateur d'un coup
        return Schedule.objects.all().select_related('employee__user').order_by('date', 'heure_debut')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ScheduleWriteSerializer
        return ScheduleReadSerializer

    # Configuration des filtres
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['employee', 'date', 'fonction']
    search_fields = ['employee__user__nom', 'notes']
