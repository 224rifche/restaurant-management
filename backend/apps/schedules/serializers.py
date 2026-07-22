from django.core.exceptions import ValidationError
from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import WeeklyAssignment, ShiftSchedule, SauceValidation, ScheduleChangeRequest
# pyrefly: ignore [missing-import]
from apps.users.api_base import BaseModelSerializerV1, BaseWriteSerializer
# pyrefly: ignore [missing-import]
from apps.employees.serializers import EmployeeListSimpleSerializer


# ===================================================
# SERIALIZER : ShiftSchedule (horaires de reference)
# ===================================================
class ShiftScheduleSerializer(BaseModelSerializerV1):
    class Meta:
        model = ShiftSchedule
        fields = (
            'id', 'poste', 'jour_semaine', 'nom_equipe',
            'heure_debut', 'heure_fin', 'tolerance_retard_minutes', 'is_active',
        )
        read_only_fields = ('id',)

# ===================================================
# SERIALIZER : WeeklyAssignment -- LECTURE
# ===================================================
class WeeklyAssignmentReadSerializer(BaseModelSerializerV1):
    employee = EmployeeListSimpleSerializer(read_only=True)
    replaced_employee = EmployeeListSimpleSerializer(read_only=True)
    shift = ShiftScheduleSerializer(read_only=True)

    @extend_schema_field(serializers.CharField())
    def get_tache_label(self, obj):
        return obj.get_tache_display()

    @extend_schema_field(serializers.CharField())
    def get_jour_label(self, obj):
        return obj.get_jour_semaine_display()

    tache_label = serializers.SerializerMethodField()
    jour_label = serializers.SerializerMethodField()

    class Meta:
        model = WeeklyAssignment
        fields = (
            'id', 'employee', 'jour_semaine', 'jour_label',
            'tache', 'tache_label', 'shift', 'fait_sauce_soir',
            'notes', 'is_replacement', 'replaced_employee',
            'inserted_at', 'updated_at',
        )
        read_only_fields = fields


# ===================================================
# SERIALIZER : WeeklyAssignment -- ECRITURE
# ===================================================
class WeeklyAssignmentWriteSerializer(BaseWriteSerializer):
    class Meta:
        model = WeeklyAssignment
        fields = (
            'employee', 'jour_semaine', 'tache', 'shift',
            'fait_sauce_soir', 'notes', 'is_replacement', 'replaced_employee',
        )

    def validate(self, data):
        instance = WeeklyAssignment(**data)
        try:
            instance.clean()
        except ValidationError as e:
            raise serializers.ValidationError(
                e.message_dict if hasattr(e, 'message_dict') else e.message
            )
        return data


# ===================================================
# SERIALIZER : SauceValidation
# ===================================================
class SauceValidationSerializer(BaseModelSerializerV1):
    class Meta:
        model = SauceValidation
        fields = ('id', 'assignment', 'valide_par', 'commentaire', 'date_validation')
        read_only_fields = ('id', 'date_validation')


# ===================================================
# SERIALIZER : ScheduleChangeRequest
# ===================================================
class ScheduleChangeRequestReadSerializer(BaseModelSerializerV1):
    demande_par = EmployeeListSimpleSerializer(read_only=True)

    class Meta:
        model = ScheduleChangeRequest
        fields = (
            'id', 'assignment', 'demande_par', 'message',
            'statut', 'reponse_admin', 'traite_par',
            'inserted_at', 'updated_at',
        )
        read_only_fields = fields


class ScheduleChangeRequestWriteSerializer(BaseWriteSerializer):
    class Meta:
        model = ScheduleChangeRequest
        fields = (
            'assignment', 'demande_par', 'message',
            'statut', 'reponse_admin', 'traite_par',
        )


# Alias pour retrocompatibilite
ScheduleReadSerializer = WeeklyAssignmentReadSerializer
ScheduleWriteSerializer = WeeklyAssignmentWriteSerializer
