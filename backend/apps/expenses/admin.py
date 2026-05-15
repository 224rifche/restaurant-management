from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Expense

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('title', 'amount', 'issuer_name', 'recipient_name', 'status', 'date', 'view_pdf_link')
    list_filter = ('status', 'category', 'date')
    search_fields = ('title', 'issuer_name', 'recipient_name')
    readonly_fields = ('created_by', 'validated_by', 'inserted_at', 'updated_at')
    
    def view_pdf_link(self, obj):
        # Créer un lien vers le PDF
        url = reverse('expense-pdf', args=[obj.pk])
        return format_html('<a href="{}" target="_blank">📄 Télécharger PDF</a>', url)
    view_pdf_link.short_description = "Action"

    def save_model(self, request, obj, form, change):
        if not change: # Si c'est une création
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
