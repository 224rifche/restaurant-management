from django.http import FileResponse
from rest_framework import status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view

# pyrefly: ignore [missing-import]
from apps.users.api_base import BaseViewSet
from .models import Expense
from .serializers import ExpenseSerializer
from .utils import generate_expense_pdf

@extend_schema_view(
    list=extend_schema(tags=["Dépenses"], summary="Liste des factures et dépenses"),
    create=extend_schema(tags=["Dépenses"], summary="Créer une nouvelle facture (Dépense)"),
)
class ExpenseViewSet(BaseViewSet):
    """
    Gestion des factures fournisseurs et dépenses quotidiennes.
    Seul le Caissier ou l'Admin peut créer/valider.
    """
    queryset = Expense.objects.all().select_related('created_by', 'validated_by')
    serializer_class = ExpenseSerializer

    def perform_create(self, serializer):
        # 0. Vérification du rôle
        if self.request.user.role not in ['admin', 'caissier']:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Seul un caissier ou un administrateur peut créer une facture.")
            
        # 1. Enregistrement auto du créateur
        serializer.save(created_by=self.request.user)

    # ---------------------------
    # ACTION : VALIDER UNE FACTURE (Caissier/Admin)
    # ---------------------------
    @extend_schema(
        tags=["Dépenses"],
        summary="Valider et payer une facture (Action Caissier/Admin)",
    )
    @action(detail=True, methods=['post'], url_path='validate')
    def validate_expense(self, request, pk=None):
        expense = self.get_object()
        
        # Seul un caissier ou un admin peut valider
        if request.user.role not in ['admin', 'caissier']:
            return Response(
                {"detail": "Seul un caissier ou un administrateur peut valider une dépense."}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        expense.status = 'valide'
        expense.validated_by = request.user
        expense.save()
        
        return Response({
            "message": "Facture validée et payée avec succès.",
            "validated_by": request.user.nom
        }, status=status.HTTP_200_OK)

    # ---------------------------
    # ACTION : TÉLÉCHARGER LE PDF
    # ---------------------------
    @extend_schema(
        tags=["Dépenses"],
        summary="Générer et télécharger la facture en PDF",
    )
    @action(detail=True, methods=['get'], url_path='pdf')
    def download_pdf(self, request, pk=None):
        expense = self.get_object()
        pdf_buffer = generate_expense_pdf(expense)
        
        filename = f"facture_{expense.date.strftime('%Y%m%d')}_{str(expense.id)[:8]}.pdf"
        
        return FileResponse(
            pdf_buffer, 
            as_attachment=True, 
            filename=filename, 
            content_type='application/pdf'
        )
