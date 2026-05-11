# ===========================
# IMPORTS
# ===========================
import uuid
from datetime import time
from django.db import models
from django.core.exceptions import ValidationError
# pyrefly: ignore [missing-import]
from apps.employees.models import Employee

# ===========================
# CHOIX DE MISSIONS (Fonctions du jour)
# ===========================
FONCTION_CHOICES = [
    ('salle_int', 'Salle Intérieure'),
    ('salle_balcon', 'Salle Balcon'),
    ('sauce', 'Préparation des Sauces'),
    ('repos', 'Jour de Repos'),
    ('caisse', 'Gestion Caisse (Caissiers uniquement)'),
]

# ===========================
# MODÈLE SCHEDULE (Planning)
# ===========================
class Schedule(models.Model):
    """
    Modèle pour gérer l'emploi du temps complexe du restaurant.
    Gère les horaires décalés, les zones et les jours de repos.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    employee = models.ForeignKey(
        Employee, 
        on_delete=models.CASCADE, 
        related_name='schedules',
        verbose_name="Employé"
    )

    date = models.DateField(verbose_name="Date du service")
    
    # Horaires
    heure_debut = models.TimeField(verbose_name="Heure de début")
    heure_fin = models.TimeField(verbose_name="Heure de fin")

    # Fonction / Zone
    fonction = models.CharField(
        max_length=20, 
        choices=FONCTION_CHOICES, 
        default='salle_int',
        verbose_name="Fonction assignée"
    )

    # Gestion des remplacements
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
        ordering = ['date', 'heure_debut']
        verbose_name = "Planning"
        verbose_name_plural = "Plannings"
        unique_together = ['employee', 'date']

    def __str__(self):
        return f"{self.employee.user.nom} — {self.date} [{self.get_fonction_display()}]"

    # ===========================
    # VALIDATIONS MÉTIER (Clean)
    # ===========================
    def clean(self):
        """
        Application des règles métier strictes.
        """
        super().clean()
        
        # 1. Règle Caissiers : Ils ne font pas la Salle ou les Sauces
        if self.employee.poste == 'caissier' and self.fonction in ['salle_int', 'salle_balcon', 'sauce']:
            raise ValidationError({
                'fonction': "Un caissier ne peut pas être assigné à la Salle ou aux Sauces."
            })

        # 2. Règle Caissiers : Un seul caissier en repos par jour
        if self.employee.poste == 'caissier' and self.fonction == 'repos':
            # On cherche s'il y a un AUTRE caissier déjà en repos ce jour-là
            autre_caissier_en_repos = Schedule.objects.filter(
                date=self.date,
                fonction='repos',
                employee__poste='caissier'
            ).exclude(employee=self.employee).exists()
            
            if autre_caissier_en_repos:
                raise ValidationError("Un autre caissier est déjà en repos ce jour-là. Il doit toujours y avoir un caissier disponible.")

        # 3. Règle Serveurs : Ils ne font pas la Caisse
        if self.employee.poste == 'serveur' and self.fonction == 'caisse':
            raise ValidationError({
                'fonction': "Un serveur ne peut pas être assigné à la Caisse."
            })

        # 4. Horaires : Fin après Début (gestion minuit)
        if self.heure_debut and self.heure_fin:
            # Si le service finit après minuit (ex: 17h30 à 01h00), heure_fin < heure_debut
            # On considère que si fin < 06h00 du matin, c'est un service de nuit valide.
            if self.heure_debut >= self.heure_fin and self.heure_fin > time(6, 0):
                raise ValidationError("L'heure de fin doit être après l'heure de début.")
