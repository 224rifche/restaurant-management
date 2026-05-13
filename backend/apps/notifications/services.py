from .models import Notification
# pyrefly: ignore [missing-import]
from apps.users.models import User

class NotificationService:
    """
    Service central pour envoyer des alertes dans le système.
    """

    @staticmethod
    def send_to_managers(title, message, type='alert'):
        """
        Envoie une notification à tous les administrateurs/managers.
        """
        managers = User.objects.filter(role='admin') # Ou selon ta logique de rôles
        for manager in managers:
            Notification.objects.create(
                recipient=manager,
                title=title,
                message=message,
                type=type
            )

    @staticmethod
    def send_to_user(user, title, message, type='alert'):
        """
        Envoie une notification à un utilisateur spécifique.
        """
        Notification.objects.create(
            recipient=user,
            title=title,
            message=message,
            type=type
        )
