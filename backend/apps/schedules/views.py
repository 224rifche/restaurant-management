from rest_framework import permissions
from drf_spectacular.utils import extend_schema, extend_schema_view
# pyrefly: ignore [missing-import]
from apps.users.api_base import BaseViewSet
from .models import Schedule
from .serializers import ScheduleReadSerializer, ScheduleWriteSerializer

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
            return [permissions.IsAdminUser()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtres simples
        employee_id = self.request.query_params.get('employee_id')
        date = self.request.query_params.get('date')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        if date:
            queryset = queryset.filter(date=date)
        if start_date and end_date:
            queryset = queryset.filter(date__range=[start_date, end_date])
            
        return queryset
