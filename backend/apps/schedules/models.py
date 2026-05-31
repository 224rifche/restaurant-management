import uuid
from datetime import time
from django.db import models
from django.core.exceptions import ValidationError
# pyrefly: ignore [missing-import]
from apps.employees.models import Employee

# ===========================
# CHOIX DE FONCTIONS (Tasks)
# ===========================
SCHEDULE_FUNCTIONS = [
    ('salle_int', 'Salle Intérieure'),
    ('salle_balcon', 'Salle Balcon'),
    ('sauce', 'Préparation des Sauces'),
    ('repos', 'Jour de Repos'),
    ('caisse', 'Gestion Caisse (Caissiers uniquement)'),
]

class Schedule(models.Model):
    """
    Modèle pour le planning hebdomadaire des employés.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    employee = models.OneToOneField(
        Employee, 
        on_delete=models.CASCADE, 
        related_name='schedule',
        verbose_name="Employé"
    )
    
    jours_repos = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        verbose_name="Jours de repos",
        help_text="Ex: Lundi, Mardi"
    )
    
    heure_debut = models.TimeField(verbose_name="Heure de début")
    
    heure_fin = models.TimeField(verbose_name="Heure de fin")
    
    fonction = models.CharField(
        max_length=20,
        choices=SCHEDULE_FUNCTIONS,
        default='salle_int',
        verbose_name="Fonction assignée"
    )
    
    # ---------------------------
    # GESTION DES REMPLACEMENTS
    # ---------------------------
    is_replacement = models.BooleanField(
        default=False, 
        verbose_name="Est un remplacement ?",
        help_text="Coché automatiquement si l'employé remplace un absent"
    )
    
    replaced_employee = models.ForeignKey(
        Employee,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='replacements_made',
        verbose_name="Employé remplacé"
    )
    
    notes = models.TextField(null=True, blank=True, verbose_name="Notes / Instructions")
    
    # Audit
    inserted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'schedules'
        ordering = ['employee__user__nom']
        verbose_name = "Planning Fixe"
        verbose_name_plural = "Plannings Fixes"

    def __str__(self):
        return f"Planning de {self.employee.user.nom} ({self.get_fonction_display()})"

    def clean(self):
        """
        Validations métier pour le planning.
        """
        # 1. Vérifier si l'employé est actif
        if not self.employee.user.is_active:
            raise ValidationError("Impossible de planifier un employé inactif.")

        # 2. Vérifier si l'employé n'est pas "Sorti"
        if self.employee.statut == 'sorti':
            raise ValidationError("L'employé a quitté l'entreprise et ne peut plus être planifié.")

        # 3. Vérifier les doublons de remplacement
        if self.is_replacement and self.replaced_employee == self.employee:
            raise ValidationError("Un employé ne peut pas se remplacer lui-même.")

        # 4. Horaires : Fin après Début (gestion minuit)
        if self.heure_debut and self.heure_fin:
            # Si le service finit après minuit (ex: 17h30 à 01h00), heure_fin < heure_debut
            # On considère que si fin < 06h00 du matin, c'est un service de nuit valide.
            if self.heure_debut >= self.heure_fin and self.heure_fin > time(6, 0):
                raise ValidationError("L'heure de fin doit être après l'heure de début.")
