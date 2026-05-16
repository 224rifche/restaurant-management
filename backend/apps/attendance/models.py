import uuid
from django.db import models
from django.utils import timezone
from apps.employees.models import Employee

# ===========================
# CHOIX DE STATUTS DE POINTAGE
# ===========================
ATTENDANCE_STATUS = [
    ('present', 'Présent'),
    ('en_retard', 'En Retard'),
    ('absent', 'Absent'),
    ('depart_anticipe', 'Départ Anticipé'),
]

# ===========================
# MODÈLE RÈGLES DE POINTAGE
# ===========================
class AttendanceRule(models.Model):
    """
    Définit les règles de détection d'absence par poste ou par plage horaire.
    Gérable par l'admin via le frontend.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    name = models.CharField(max_length=100, verbose_name="Nom de la règle (ex: Matin Salle)")
    
    poste = models.CharField(
        max_length=50, 
        choices=[
            ('serveur', 'Serveur / Salle'),
            ('caissier', 'Caissier'),
            ('cuisine', 'Cuisine'),
            ('tout', 'Tous les postes'),
        ],
        default='tout'
    )
    
    grace_period_minutes = models.IntegerField(
        default=30, 
        help_text="Nombre de minutes autorisées avant d'être marqué absent."
    )
    
    absolute_limit_time = models.TimeField(
        null=True, 
        blank=True, 
        help_text="Heure fixe après laquelle l'employé est d'office absent (ex: 16:30)."
    )

    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'attendance_rules'
        verbose_name = "Règle de pointage"
        verbose_name_plural = "Règles de pointage"

    def __str__(self):
        return self.name

# ===========================
# MODÈLE ATTENDANCE (Pointage)
# ===========================
class Attendance(models.Model):
    """
    Modèle pour enregistrer les présences réelles (Pointage).
    Inclut la sécurité par Selfie et QR Code.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    employee = models.ForeignKey(
        Employee, 
        on_delete=models.CASCADE, 
        related_name='attendances',
        verbose_name="Employé"
    )

    date = models.DateField(default=timezone.now, verbose_name="Date")
    
    # ---------------------------
    # ARRIVÉE (Check-In)
    # ---------------------------
    heure_arrivee = models.TimeField(null=True, blank=True, verbose_name="Heure d'Arrivée")
    
    selfie_arrivee = models.ImageField(
        upload_to='attendances/selfies/%Y/%m/%d/', 
        null=True, 
        blank=True, 
        verbose_name="Selfie Arrivée"
    )
    
    # ---------------------------
    # DÉPART (Check-Out)
    # ---------------------------
    heure_depart = models.TimeField(null=True, blank=True, verbose_name="Heure de Départ")
    
    selfie_depart = models.ImageField(
        upload_to='attendances/selfies/%Y/%m/%d/', 
        null=True, 
        blank=True, 
        verbose_name="Selfie Départ"
    )
    
    # ---------------------------
    # SÉCURITÉ ET ANALYSE
    # ---------------------------
    statut = models.CharField(
        max_length=20, 
        choices=ATTENDANCE_STATUS, 
        default='present'
    )
    
    qr_code_token = models.CharField(
        max_length=255, 
        null=True, 
        blank=True, 
        verbose_name="Token QR Code utilisé"
    )

    # Géolocalisation
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    notes = models.TextField(null=True, blank=True, verbose_name="Notes / Justifications")
    
    # Audit
    inserted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'attendances'
        ordering = ['-date', '-heure_arrivee']
        verbose_name = "Pointage"
        verbose_name_plural = "Pointages"
        # On ne peut pointer qu'une seule fois (Arrivée/Départ) par jour
        unique_together = ['employee', 'date']

    def __str__(self):
        return f"Pointage {self.employee.user.nom} - {self.date}"

