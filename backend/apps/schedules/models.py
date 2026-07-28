import uuid
from django.db import models
from django.core.exceptions import ValidationError
# pyrefly: ignore [missing-import]
from apps.employees.models import Employee

# ===========================
# JOURS DE LA SEMAINE
# ===========================
# Pas de date calendrier precise -- un planning qui se repete
# automatiquement chaque semaine, sans ressaisie par l'admin.
JOURS_SEMAINE = [
    ('lundi', 'Lundi'),
    ('mardi', 'Mardi'),
    ('mercredi', 'Mercredi'),
    ('jeudi', 'Jeudi'),
    ('vendredi', 'Vendredi'),
    ('samedi', 'Samedi'),
    ('dimanche', 'Dimanche'),
]
ORDRE_JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']

TACHE_CHOICES = [
    ('salle_int', 'Salle Interieure'),
    ('salle_balcon', 'Balcon'),
    ('caisse', 'Caisse'),
    ('repos', 'Repos'),
]


# ===========================================================
# MODELE 1 : HORAIRES DE REFERENCE (modifiable dans l'admin)
# ===========================================================
class ShiftSchedule(models.Model):
    """
    Horaire de reference pour UN poste + UN jour + UNE equipe.

    C'est LA table que l'admin modifie directement dans /admin
    quand les horaires du restaurant changent -- jamais besoin
    de toucher au code Python pour ajuster un horaire.

    Le champ 'tolerance_retard_minutes' est visible UNIQUEMENT
    par l'admin (jamais expose dans les serializers utilises
    par les interfaces Serveur/Caissier) -- ca evite qu'un employe
    calcule pile le moment ou il peut arriver sans etre marque en retard.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    poste = models.CharField(
        max_length=20,
        choices=[('serveur', 'Serveur'), ('caissier', 'Caissier')],
        verbose_name="Poste concerne"
    )

    jour_semaine = models.CharField(
        max_length=10,
        choices=JOURS_SEMAINE,
        verbose_name="Jour de la semaine"
    )

    nom_equipe = models.CharField(
        max_length=50,
        verbose_name="Nom de l'equipe",
        help_text="Ex: Matin, Soir, Soir Equipe A, Soir Equipe B"
    )

    heure_debut = models.TimeField(verbose_name="Heure de debut")
    heure_fin = models.TimeField(verbose_name="Heure de fin")

    # REGLE METIER : tolerance de retard AVANT d'etre marque "en retard".
    # Info connue SEULEMENT du systeme et de l'admin.
    tolerance_retard_minutes = models.PositiveIntegerField(
        default=10,
        verbose_name="Tolerance retard (minutes)",
        help_text="CONFIDENTIEL : jamais affiche aux employes"
    )

    is_active = models.BooleanField(default=True, verbose_name="Equipe active")

    class Meta:
        db_table = 'shift_schedules'
        ordering = ['poste', 'jour_semaine', 'heure_debut']
        verbose_name = "Horaire de reference"
        verbose_name_plural = "Horaires de reference"

    def __str__(self):
        return f"{self.get_poste_display()} - {self.get_jour_semaine_display()} - {self.nom_equipe} ({self.heure_debut}-{self.heure_fin})"


# ===========================================================
# MODELE 2 : AFFECTATION HEBDOMADAIRE TYPE (planning reel)
# ===========================================================
class WeeklyAssignment(models.Model):
    """
    Affectation hebdomadaire TYPE d'un employe pour UN jour de la semaine.
    Se repete automatiquement chaque semaine.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    employee = models.ForeignKey(
        # ForeignKey (pas OneToOne) : un employe a PLUSIEURS lignes,
        # une par jour de la semaine -- corrige l'erreur du modele precedent
        # qui empechait "Salle le lundi ET Balcon le mardi" pour la meme personne.
        Employee,
        on_delete=models.CASCADE,
        related_name='weekly_assignments',
        verbose_name="Employe"
    )

    jour_semaine = models.CharField(max_length=10, choices=JOURS_SEMAINE, verbose_name="Jour de la semaine")

    tache = models.CharField(
        max_length=20,
        choices=TACHE_CHOICES,
        default='salle_int',
        verbose_name="Tache principale du jour"
    )

    # Lien optionnel vers l'equipe horaire (Matin/Soir/etc.) -- permet
    # de savoir QUEL ShiftSchedule utiliser pour calculer les retards
    # de CET employe, CE jour precis.
    shift = models.ForeignKey(
        ShiftSchedule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assignments',
        verbose_name="Equipe horaire"
    )

    # REGLE METIER : la sauce est une tache ADDITIONNELLE du soir (23h),
    # qui s'ajoute a la tache principale du MEME jour (pas la veille).
    fait_sauce_soir = models.BooleanField(
        default=False,
        verbose_name="Fait la sauce ce soir (23h) ?",
        help_text="Additionnel a la tache principale du jour"
    )

    notes = models.TextField(null=True, blank=True, verbose_name="Notes")

    is_replacement = models.BooleanField(default=False, verbose_name="Est un remplacement ?")
    replaced_employee = models.ForeignKey(
        Employee, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='replacements_made', verbose_name="Employe remplace"
    )

    inserted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'weekly_assignments'
        ordering = ['employee__user__nom', 'jour_semaine']
        verbose_name = "Affectation hebdomadaire"
        verbose_name_plural = "Affectations hebdomadaires"
        unique_together = ['employee', 'jour_semaine']

    def __str__(self):
        sauce = " + Sauce 23h" if self.fait_sauce_soir else ""
        return f"{self.employee.user.nom} - {self.get_jour_semaine_display()} : {self.get_tache_display()}{sauce}"

    def clean(self):
        # REGLE 1 : Seuls les serveurs font la sauce
        if self.fait_sauce_soir and self.employee.poste != 'serveur':
            raise ValidationError("Seuls les serveurs peuvent etre assignes a la sauce.")

        # REGLE 2 : Sauce possible seulement un jour de Salle ou Balcon
        if self.fait_sauce_soir and self.tache not in ['salle_int', 'salle_balcon']:
            raise ValidationError("La sauce ne peut s'ajouter qu'un jour de Salle ou de Balcon.")

        # REGLE 3 : Employe doit etre actif
        if not self.employee.user.is_active or self.employee.statut != 'actif':
            raise ValidationError("Impossible de planifier un employe inactif.")

        # REGLE 4 : Pas d'auto-remplacement
        if self.is_replacement and self.replaced_employee == self.employee:
            raise ValidationError("Un employe ne peut pas se remplacer lui-meme.")

        # REGLE 5 : Quotas de repos (max 2 serveurs, max 1 caissier, par jour)
        if self.tache == 'repos':
            repos_du_jour = WeeklyAssignment.objects.filter(
                jour_semaine=self.jour_semaine,
                tache='repos',
                employee__poste=self.employee.poste,
            ).exclude(pk=self.pk)

            if self.employee.poste == 'serveur' and repos_du_jour.count() >= 2:
                raise ValidationError(f"Maximum 2 serveurs en repos le {self.get_jour_semaine_display()}.")

            if self.employee.poste == 'caissier' and repos_du_jour.count() >= 1:
                raise ValidationError(f"Maximum 1 caissier en repos le {self.get_jour_semaine_display()}.")


# ===========================================================
# MODELE 3 : VALIDATION DE LA SAUCE (controle qualite)
# ===========================================================
class SauceValidation(models.Model):
    """
    Controle APRES COUP par un caissier/admin : "oui, la sauce a bien
    ete faite". Simple case a cocher, PAS un droit de modifier l'affectation.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    assignment = models.ForeignKey(
        WeeklyAssignment, on_delete=models.CASCADE,
        related_name='validations_sauce',
        limit_choices_to={'fait_sauce_soir': True},
        verbose_name="Affectation sauce concernee"
    )

    # pyrefly: ignore [missing-import]
    valide_par = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True,
        related_name='sauces_validees', verbose_name="Valide par"
    )

    commentaire = models.TextField(null=True, blank=True)
    date_validation = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sauce_validations'
        ordering = ['-date_validation']
        verbose_name = "Validation de sauce"
        verbose_name_plural = "Validations de sauce"

    def clean(self):
        if self.valide_par and self.valide_par.role not in ['admin', 'caissier']:
            raise ValidationError("Seul un caissier ou un administrateur peut valider une sauce.")


# ===========================================================
# MODELE 4 : DEMANDE DE CHANGEMENT DE PLANNING
# ===========================================================
class ScheduleChangeRequest(models.Model):
    """
    L'employe PROPOSE un changement -- il ne peut jamais modifier
    son planning directement. L'admin accepte ou refuse.
    """
    STATUT_CHOICES = [
        ('en_attente', 'En attente'),
        ('accepte', 'Accepte'),
        ('refuse', 'Refuse'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    assignment = models.ForeignKey(
        WeeklyAssignment, on_delete=models.CASCADE,
        related_name='demandes_changement', verbose_name="Affectation concernee"
    )

    demande_par = models.ForeignKey(
        Employee, on_delete=models.CASCADE,
        related_name='demandes_faites', verbose_name="Demande par"
    )

    message = models.TextField(verbose_name="Message de la demande")
    statut = models.CharField(max_length=15, choices=STATUT_CHOICES, default='en_attente')
    reponse_admin = models.TextField(null=True, blank=True)

    # pyrefly: ignore [missing-import]
    traite_par = models.ForeignKey(
        'users.User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='demandes_traitees'
    )

    inserted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'schedule_change_requests'
        ordering = ['-inserted_at']
        verbose_name = "Demande de changement"
        verbose_name_plural = "Demandes de changement"

    def __str__(self):
        return f"Demande de {self.demande_par.user.nom} ({self.get_statut_display()})"
