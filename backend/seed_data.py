import os
import django
import uuid

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User
from apps.employees.models import Employee
from apps.attendance.models import Attendance
from django.utils import timezone
from datetime import time

def seed():
    # 1. Créer l'utilisateur Cherif si besoin
    user_cherif, created = User.objects.get_or_create(
        telephone='620000000',
        defaults={
            'nom': 'Cherif',
            'role': 'admin',
            'is_staff': True,
            'is_superuser': True
        }
    )
    if created:
        user_cherif.set_password('cherif123')
        user_cherif.save()
        print("User Cherif créé")

    # 2. Créer l'employé Cherif
    emp_cherif, created = Employee.objects.get_or_create(
        user=user_cherif,
        defaults={
            'poste': 'admin',
            'statut': 'actif'
        }
    )
    if created:
        print("Employee Cherif créé")

    # 3. Créer quelques employés de test
    test_data = [
        ('621111111', 'Oumar Diallo', 'serveur'),
        ('622222222', 'Mariama Sylla', 'caissier'),
        ('623333333', 'Abdoulaye Sow', 'cuisine'),
    ]

    for tel, nom, poste in test_data:
        u, created = User.objects.get_or_create(
            telephone=tel,
            defaults={'nom': nom, 'role': poste}
        )
        if created:
            u.set_password('password123')
            u.save()
        
        emp, created = Employee.objects.get_or_create(
            user=u,
            defaults={'poste': poste, 'statut': 'actif'}
        )
        
        # 4. Créer des pointages pour les 7 derniers jours
        import random
        for i in range(7):
            day = timezone.now().date() - timezone.timedelta(days=i)
            Attendance.objects.update_or_create(
                employee=emp,
                date=day,
                defaults={
                    'heure_arrivee': time(8, random.randint(0, 59)),
                    'statut': random.choice(['present', 'present', 'en_retard', 'present'])
                }
            )
    
    print("Données de test pour les 7 derniers jours synchronisées !")

if __name__ == '__main__':
    seed()
