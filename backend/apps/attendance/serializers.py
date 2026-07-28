from rest_framework import serializers
# pyrefly: ignore [missing-import]
from apps.users.api_base import BaseModelSerializerV1
# pyrefly: ignore [missing-import]
from apps.employees.serializers import EmployeeListSimpleSerializer
from .models import Attendance, AttendanceRule
from .services import AttendanceService

# ===================================================
# SERIALIZER 0 : RÈGLES DE POINTAGE
# ===================================================
class AttendanceRuleSerializer(BaseModelSerializerV1):
    class Meta:
        model = AttendanceRule
        fields = '__all__'

# ===================================================
# SERIALIZER 1 : LECTURE
# ===================================================
class AttendanceReadSerializer(BaseModelSerializerV1):
    """
    Affiche les détails d'un pointage (avec photo).
    """
    employee = EmployeeListSimpleSerializer(read_only=True)
    employee_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Attendance
        fields = (
            'id', 'employee', 'employee_name', 'date', 
            'heure_arrivee', 'selfie_arrivee',
            'heure_depart', 'selfie_depart',
            'statut', 'notes'
        )

    def get_employee_name(self, obj):
        return obj.employee.user.nom if obj.employee and obj.employee.user else "Inconnu"

# ===================================================
# SERIALIZER 2 : ACTION POINTAGE ARRIVÉE
# ===================================================
class CheckInSerializer(serializers.Serializer):
    """
    Serializer pour l'action de pointage (Check-in).
    Prend le selfie et le token QR.
    """
    qr_token = serializers.CharField(max_length=255)
    selfie = serializers.ImageField()
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False)

    def validate(self, data):
        # La validation complexe est faite dans le Service
        return data

class CheckOutSerializer(serializers.Serializer):
    """
    Serializer pour l'action de pointage (Check-out).
    """
    qr_token = serializers.CharField(max_length=255)
    selfie = serializers.ImageField()
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False)
