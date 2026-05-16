from datetime import timedelta
from django.db import transaction
from .models import Schedule

class ReplacementService:
    """
    Service gérant la logique automatique de remplacement en cas d'absence.
    """

    @staticmethod
    @transaction.atomic
    def trigger_replacement(absent_employee, absence_date):
        """
        Fonction appelée lorsqu'un employé est marqué absent.
        absent_employee: L'instance Employee absente
        absence_date: La date de l'absence
        """
        
        # 1. On cherche ce que l'absent devait faire ce jour-là
        original_schedule = Schedule.objects.filter(
            employee=absent_employee, 
            date=absence_date
        ).first()

        if not original_schedule:
            return f"Aucun planning trouvé pour {absent_employee} le {absence_date}."

        if original_schedule.fonction == 'repos':
            return "L'employé était déjà en repos, pas besoin de remplaçant."

        # 2. On cherche le remplaçant (celui qui fait la même tâche à J+1)
        next_day = absence_date + timedelta(days=1)
        replacement_schedule_j_plus_1 = Schedule.objects.filter(
            date=next_day,
            fonction=original_schedule.fonction
        ).first()

        if not replacement_schedule_j_plus_1:
            # Si personne à J+1, on pourrait chercher à J+2, mais on suit votre règle J+1
            return f"Aucun remplaçant trouvé à J+1 pour la tâche {original_schedule.get_fonction_display()}."

        replacer = replacement_schedule_j_plus_1.employee

        # 3. On vérifie si le remplaçant n'est pas déjà occupé ce jour-là
        # (ex: il fait déjà la caisse ou le balcon)
        existing_task = Schedule.objects.filter(employee=replacer, date=absence_date).first()
        
        if existing_task:
            if existing_task.fonction == 'repos':
                # S'il était en repos, on supprime son repos pour mettre le remplacement
                existing_task.delete()
            else:
                return f"Le remplaçant {replacer} est déjà occupé sur une autre tâche le {absence_date}."

        # 4. CRÉATION DU REMPLACEMENT
        new_schedule = Schedule.objects.create(
            employee=replacer,
            date=absence_date,
            heure_debut=original_schedule.heure_debut,
            heure_fin=original_schedule.heure_fin,
            fonction=original_schedule.fonction,
            is_replacement=True,
            replaced_employee=absent_employee,
            notes=f"Remplacement automatique de {absent_employee.user.nom} (Absent)."
        )

        # 5. TODO: Envoyer l'alerte/message au serveur
        # Pour l'instant on simule avec un print
        print(f"ALERTE : {replacer.user.nom}, tu remplaces {absent_employee.user.nom} aujourd'hui !")

        return new_schedule
