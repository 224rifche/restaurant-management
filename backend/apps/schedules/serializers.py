from django.core.exceptions import ValidationError
from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import Schedule
# pyrefly: ignore [missing-import]
from apps.users.api_base import BaseModelSerializerV1, BaseWriteSerializer
# pyrefly: ignore [missing-import]
from apps.employees.serializers import EmployeeListSimpleSerializer

# ===================================================
# SERIALIZER 1 : LECTURE — Affichage du planning
# ===================================================
class ScheduleReadSerializer(BaseModelSerializerV1):
    """
    Utilisé pour afficher le planning.
    Inclus les infos de base de l'employé (nom, poste).
    """
    # On utilise la version légère du sérialiseur d'employé
    employee = EmployeeListSimpleSerializer(read_only=True)
    
    @extend_schema_field(serializers.CharField())
    def get_fonction_label(self, obj):
        return obj.get_fonction_display()

    fonction_label = serializers.SerializerMethodField()

    class Meta:
        model = Schedule
        fields = (
            'id',
            'employee',
            'date',
            'heure_debut',
            'heure_fin',
            'fonction',
            'fonction_label',
            'notes',
            'inserted_at',
            'updated_at',
        )
        read_only_fields = fields

# ===================================================
# SERIALIZER 2 : ÉCRITURE — Créer / Modifier le planning
# ===================================================
class ScheduleWriteSerializer(BaseWriteSerializer):
    """
    Utilisé pour créer ou modifier un créneau dans le planning.
    """
    class Meta:
        model = Schedule
        fields = (
            'employee',
            'date',
            'heure_debut',
            'heure_fin',
            'fonction',
            'notes',
            'is_replacement',
            'replaced_employee',
        )

    def validate(self, data):
        """
        Appel de la validation du modèle (clean) pour garantir les règles métier.
        """
        # Créer une instance temporaire pour appeler .clean()
        instance = Schedule(**data)
        try:
            instance.clean()
        except ValidationError as e:
            raise serializers.ValidationError(e.message_dict if hasattr(e, 'message_dict') else e.message)
            
        return data
