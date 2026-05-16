from datetime import datetime
from django.shortcuts import render
from rest_framework import status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view
from django.core.exceptions import ValidationError

# pyrefly: ignore [missing-import]
from apps.users.api_base import BaseViewSet
from .models import Attendance, AttendanceRule
from .serializers import (
    AttendanceReadSerializer, 
    CheckInSerializer, 
    CheckOutSerializer, 
    AttendanceRuleSerializer
)
from .analytics import AttendanceAnalytics
from .services import AttendanceService

@extend_schema_view(
    list=extend_schema(tags=["Pointage"], summary="Liste des pointages"),
    retrieve=extend_schema(tags=["Pointage"], summary="Détail d'un pointage"),
)
class AttendanceViewSet(BaseViewSet):
    """
    ViewSet pour la gestion des pointages.
    """
    queryset = Attendance.objects.all().select_related('employee__user')
    serializer_class = AttendanceReadSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['employee__user__nom', 'statut']

    # ---------------------------
    # ACTION : POINTAGE ARRIVÉE
    # ---------------------------
    @extend_schema(
        tags=["Pointage"],
        summary="Pointer l'arrivée (Check-in)",
        request=CheckInSerializer,
    )
    @action(detail=False, methods=['post'], url_path='check-in')
    def check_in(self, request):
        serializer = CheckInSerializer(data=request.data)
        if serializer.is_valid():
            try:
                # On appelle le service pour faire le boulot
                attendance = AttendanceService.pointage_arrivee(
                    employee=request.user.employee, # On récupère l'employé connecté
                    selfie=serializer.validated_data['selfie'],
                    qr_token=serializer.validated_data['qr_token'],
                    lat=serializer.validated_data.get('latitude'),
                    lon=serializer.validated_data.get('longitude'),
                )
                return Response(
                    AttendanceReadSerializer(attendance).data, 
                    status=status.HTTP_201_CREATED
                )
            except ValidationError as e:
                return Response({"detail": str(e.message)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # ---------------------------
    # ACTION : POINTAGE DÉPART
    # ---------------------------
    @extend_schema(
        tags=["Pointage"],
        summary="Pointer le départ (Check-out)",
        request=CheckOutSerializer,
    )
    @action(detail=False, methods=['post'], url_path='check-out')
    def check_out(self, request):
        serializer = CheckOutSerializer(data=request.data)
        if serializer.is_valid():
            try:
                attendance = AttendanceService.pointage_depart(
                    employee=request.user.employee,
                    selfie=serializer.validated_data['selfie'],
                    qr_token=serializer.validated_data['qr_token'],
                    lat=serializer.validated_data.get('latitude'),
                    lon=serializer.validated_data.get('longitude'),
                )
                return Response(
                    AttendanceReadSerializer(attendance).data, 
                    status=status.HTTP_200_OK
                )
            except ValidationError as e:
                return Response({"detail": str(e.message)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # ---------------------------
    # ACTION : GÉNÉRER LE QR CODE (Pour la tablette)
    # ---------------------------
    @extend_schema(
        tags=["Pointage"],
        summary="Générer le Token QR Code actuel (pour la tablette du restaurant)",
    )
    @action(detail=False, methods=['get'], url_path='qr-token')
    def get_qr_token(self, request):
        token = AttendanceService.generate_current_qr_token()
        return Response({
            "token": token,
            "expires_in_seconds": 60 - datetime.now().second # Temps restant avant le prochain token
        })

    # ---------------------------
    # ACTION : TRAITER LES ABSENCES (Admin only)
    # ---------------------------
    @extend_schema(
        tags=["Pointage"],
        summary="Détecter les absents et lancer les remplacements (Action Admin)",
    )
    @action(detail=False, methods=['post'], url_path='process-absences', permission_classes=[permissions.IsAdminUser])
    def process_absences(self, request):
        count = AttendanceService.check_and_process_absences()
        return Response({
            "message": "Traitement terminé",
            "absences_detected": count
        }, status=status.HTTP_200_OK)

    # ---------------------------
    # ACTION : STATISTIQUES DASHBOARD (Global)
    # ---------------------------
    @extend_schema(
        tags=["Analytics"],
        summary="Statistiques globales du jour pour le dashboard",
    )
    @action(detail=False, methods=['get'], url_path='dashboard', permission_classes=[permissions.IsAdminUser])
    def dashboard(self, request):
        stats = AttendanceAnalytics.get_global_dashboard_stats()
        return Response(stats, status=status.HTTP_200_OK)

    # ---------------------------
    # ACTION : RAPPORT DÉTAILLÉ PAR EMPLOYÉ
    # ---------------------------
    @extend_schema(
        tags=["Analytics"],
        summary="Rapport complet d'un employé sur une période",
    )
    @action(detail=False, methods=['get'], url_path='employee-report', permission_classes=[permissions.IsAdminUser])
    def employee_report(self, request):
        emp_id = request.query_params.get('employee_id')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not all([emp_id, start_date, end_date]):
            return Response(
                {"detail": "Paramètres manquants (employee_id, start_date, end_date)"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        stats = AttendanceAnalytics.get_employee_stats(emp_id, start_date, end_date)
        return Response(stats, status=status.HTTP_200_OK)

# ===================================================
# VIEWSET : RÈGLES DE POINTAGE
# ===================================================
@extend_schema_view(
    list=extend_schema(tags=["Configuration"], summary="Liste des règles de pointage"),
    create=extend_schema(tags=["Configuration"], summary="Créer une nouvelle règle"),
    update=extend_schema(tags=["Configuration"], summary="Modifier une règle"),
    destroy=extend_schema(tags=["Configuration"], summary="Supprimer une règle"),
)
class AttendanceRuleViewSet(BaseViewSet):
    """
    Gestion des seuils d'absence par l'administrateur.
    """
    queryset = AttendanceRule.objects.all()
    serializer_class = AttendanceRuleSerializer
    permission_classes = [permissions.IsAdminUser] # Seul l'admin y a accès

