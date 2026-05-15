from django.contrib import admin
from django.utils.html import format_html
from .models import Attendance, AttendanceRule

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('employee', 'date', 'heure_arrivee', 'display_selfie_arrivee', 'heure_depart', 'display_selfie_depart', 'statut')
    list_filter = ('date', 'statut', 'employee__poste')
    search_fields = ('employee__user__nom', 'employee__user__telephone')
    date_hierarchy = 'date'
    
    def display_selfie_arrivee(self, obj):
        if obj.selfie_arrivee:
            return format_html('<img src="{}" width="50" height="50" style="border-radius:50%;" />', obj.selfie_arrivee.url)
        return "-"
    display_selfie_arrivee.short_description = "Selfie Arrivée"

    def display_selfie_depart(self, obj):
        if obj.selfie_depart:
            return format_html('<img src="{}" width="50" height="50" style="border-radius:50%;" />', obj.selfie_depart.url)
        return "-"
    display_selfie_depart.short_description = "Selfie Départ"

@admin.register(AttendanceRule)
class AttendanceRuleAdmin(admin.ModelAdmin):
    list_display = ('name', 'poste', 'grace_period_minutes', 'absolute_limit_time', 'is_active')
    list_filter = ('poste', 'is_active')
