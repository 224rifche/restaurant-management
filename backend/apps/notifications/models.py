import uuid
from django.db import models
# pyrefly: ignore [missing-import]
from apps.users.models import User

# ===========================
# MODÈLE NOTIFICATION
# ===========================
class Notification(models.Model):
    """
    Système d'alertes pour les managers et employés.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    recipient = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='notifications',
        verbose_name="Destinataire"
    )
    
    title = models.CharField(max_length=255, verbose_name="Titre")
    message = models.TextField(verbose_name="Message")
    
    type = models.CharField(
        max_length=50, 
        choices=[
            ('absence', 'Absence détectée'),
            ('replacement', 'Remplacement effectué'),
            ('alert', 'Alerte Système'),
        ],
        default='alert'
    )
    
    is_read = models.BooleanField(default=False, verbose_name="Lu ?")
    
    # Audit
    inserted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-inserted_at']
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"

    def __str__(self):
        return f"{self.title} pour {self.recipient.nom}"
