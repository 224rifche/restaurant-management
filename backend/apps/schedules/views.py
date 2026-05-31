from rest_framework import permissions
from drf_spectacular.utils import extend_schema, extend_schema_view
# pyrefly: ignore [missing-import]
from apps.users.api_base import BaseViewSet
from .models import Schedule
from .serializers import ScheduleReadSerializer, ScheduleWriteSerializer


class IsAdminOnly(permissions.BasePermission):
    """
    Permission pour les administrateurs uniquement basée sur le rôle.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == 'admin'
        )


@extend_schema_view(
    list=extend_schema(tags=["Planning"], summary="Liste des plannings"),
    create=extend_schema(tags=["Planning"], summary="Créer un créneau"),
    retrieve=extend_schema(tags=["Planning"], summary="Détail d'un créneau"),
    update=extend_schema(tags=["Planning"], summary="Modifier un créneau"),
    destroy=extend_schema(tags=["Planning"], summary="Supprimer un créneau"),
)
class ScheduleViewSet(BaseViewSet):
    """
    Gestion du planning des employés.
    """
    queryset = Schedule.objects.all().select_related('employee__user')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ScheduleWriteSerializer
        return ScheduleReadSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminOnly()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtres simples
        employee_id = self.request.query_params.get('employee_id')

        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
            
        return queryset
