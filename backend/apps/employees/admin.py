from django.contrib import admin
from .models import Employee

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('get_name', 'poste', 'date_embauche', 'inserted_at')
    list_filter = ('poste', 'date_embauche')
    search_fields = ('user__nom', 'user__telephone')
    ordering = ('-inserted_at',)
    
    readonly_fields = ('inserted_at', 'updated_at')

    def get_name(self, obj):
        return obj.user.nom
    get_name.short_description = 'Nom de l\'employé'
