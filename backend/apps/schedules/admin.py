from django.contrib import admin
from .models import ShiftSchedule, WeeklyAssignment, SauceValidation, ScheduleChangeRequest


@admin.register(ShiftSchedule)
class ShiftScheduleAdmin(admin.ModelAdmin):
    """
    C'est ICI que tu corriges les horaires de reference,
    sans jamais avoir besoin de toucher au code.
    """
    list_display = ('poste', 'jour_semaine', 'nom_equipe', 'heure_debut', 'heure_fin', 'tolerance_retard_minutes', 'is_active')
    list_filter = ('poste', 'jour_semaine', 'is_active')
    list_editable = ('heure_debut', 'heure_fin', 'tolerance_retard_minutes', 'is_active')
    ordering = ('poste', 'jour_semaine', 'heure_debut')


@admin.register(WeeklyAssignment)
class WeeklyAssignmentAdmin(admin.ModelAdmin):
    list_display = ('employee', 'jour_semaine', 'tache', 'fait_sauce_soir', 'shift', 'is_replacement')
    list_filter = ('jour_semaine', 'tache', 'fait_sauce_soir')
    search_fields = ('employee__user__nom',)


@admin.register(SauceValidation)
class SauceValidationAdmin(admin.ModelAdmin):
    list_display = ('assignment', 'valide_par', 'date_validation')
    readonly_fields = ('date_validation',)


@admin.register(ScheduleChangeRequest)
class ScheduleChangeRequestAdmin(admin.ModelAdmin):
    list_display = ('demande_par', 'assignment', 'statut', 'inserted_at')
    list_filter = ('statut',)
    readonly_fields = ('inserted_at', 'updated_at')
