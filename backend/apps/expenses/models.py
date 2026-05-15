import uuid
from django.db import models
# pyrefly: ignore [missing-import]
from apps.users.models import User

class Expense(models.Model):
    """
    Modèle pour gérer les dépenses et factures fournisseurs du restaurant.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    title = models.CharField(max_length=255, verbose_name="Libellé de la dépense")
    amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Montant")
    
    issuer_name = models.CharField(max_length=255, null=True, blank=True, verbose_name="Donneur")
    recipient_name = models.CharField(max_length=255, null=True, blank=True, verbose_name="Récepteur")
    
    date = models.DateField(auto_now_add=True, verbose_name="Date de la dépense")
    
    category = models.CharField(
        max_length=50,
        choices=[
            ('nourriture', 'Achats Nourriture'),
            ('boisson', 'Achats Boissons'),
            ('entretien', 'Entretien / Nettoyage'),
            ('energie', 'Gaz / Énergie'),
            ('autre', 'Autre'),
        ],
        default='nourriture',
        verbose_name="Catégorie"
    )
    
    # Image de la facture ou du reçu
    invoice_image = models.ImageField(
        upload_to='expenses/invoices/%Y/%m/%d/', 
        null=True, 
        blank=True, 
        verbose_name="Photo de la facture"
    )
    
    # Workflow
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='expenses_created',
        verbose_name="Créé par (Cuisinier/Autre)"
    )
    
    validated_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='expenses_validated',
        verbose_name="Validé par (Caissier/Admin)"
    )
    
    status = models.CharField(
        max_length=20,
        choices=[
            ('en_attente', 'En attente'),
            ('valide', 'Validé / Payé'),
            ('rejete', 'Rejeté'),
        ],
        default='en_attente',
        verbose_name="Statut"
    )

    notes = models.TextField(null=True, blank=True, verbose_name="Notes complémentaires")
    
    inserted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'expenses'
        ordering = ['-inserted_at']
        verbose_name = "Dépense / Facture"
        verbose_name_plural = "Dépenses / Factures"

    def __str__(self):
        return f"{self.title} — {self.amount} FG"
