from django.db import transaction
from .models import WeeklyAssignment, ORDRE_JOURS
# pyrefly: ignore [missing-import]
from apps.notifications.services import NotificationService


class ReplacementService:
    """
    Gere le remplacement automatique en cas d'absence.

    REGLE METIER (remplacement en chaine) : on ne s'arrete pas
    au jour suivant si personne n'est disponible -- on continue
    de chercher jour apres jour (jusqu'a 6 jours plus loin, soit
    un tour complet de la semaine) jusqu'a trouver quelqu'un
    qui fait la MEME tache et qui n'est pas deja occupe ailleurs.
    """

    @staticmethod
    def _jour_suivant(jour_semaine, decalage=1):
        """
        Renvoie le jour de la semaine qui se trouve 'decalage' jours
        apres 'jour_semaine', en bouclant sur la semaine
        (ex: samedi + 2 jours = lundi).
        """
        index_actuel = ORDRE_JOURS.index(jour_semaine)
        nouvel_index = (index_actuel + decalage) % len(ORDRE_JOURS)
        return ORDRE_JOURS[nouvel_index]

    @staticmethod
    @transaction.atomic
    def trigger_replacement(absent_employee, jour_semaine_absence):
        """
        Appelee quand un employe est marque absent pour un jour_semaine donne.

        absent_employee: instance Employee absente
        jour_semaine_absence: ex 'mardi' -- le jour de la semaine concerne
        """

        # 1. Ce que l'absent devait faire ce jour-la
        original_assignment = WeeklyAssignment.objects.filter(
            employee=absent_employee,
            jour_semaine=jour_semaine_absence,
        ).first()

        if not original_assignment:
            return f"Aucune affectation trouvee pour {absent_employee} le {jour_semaine_absence}."

        if original_assignment.tache == 'repos':
            return "L'employe etait deja en repos, pas besoin de remplacant."

        # 2. Recherche EN CHAINE : jour+1, jour+2, ... jusqu'a 6 jours plus loin
        # (un tour complet de la semaine sans repasser sur le jour de depart)
        remplacant_trouve = None
        assignment_source = None

        for decalage in range(1, 7):
            jour_a_verifier = ReplacementService._jour_suivant(jour_semaine_absence, decalage)

            candidat_assignment = WeeklyAssignment.objects.filter(
                jour_semaine=jour_a_verifier,
                tache=original_assignment.tache,
            ).exclude(employee=absent_employee).first()

            if candidat_assignment:
                candidat = candidat_assignment.employee

                # Verifier que ce candidat n'est pas deja occupe
                # le jour_semaine_absence lui-meme (le jour a remplacer)
                deja_occupe = WeeklyAssignment.objects.filter(
                    employee=candidat,
                    jour_semaine=jour_semaine_absence,
                ).exclude(tache='repos').exists()

                if not deja_occupe:
                    remplacant_trouve = candidat
                    assignment_source = candidat_assignment
                    break
                # Si occupe mais que c'etait son jour de repos, on peut
                # liberer ce repos pour le remplacement (regle deja en place
                # dans l'ancienne version, on la reprend ici)
                repos_du_candidat = WeeklyAssignment.objects.filter(
                    employee=candidat,
                    jour_semaine=jour_semaine_absence,
                    tache='repos',
                ).first()
                if repos_du_candidat:
                    remplacant_trouve = candidat
                    assignment_source = candidat_assignment
                    repos_du_candidat.delete()
                    break

        if not remplacant_trouve:
            return (
                f"Aucun remplacant trouve pour la tache "
                f"{original_assignment.get_tache_display()} apres avoir "
                f"verifie les 6 jours suivants."
            )

        # 3. Creation de l'affectation de remplacement pour LE JOUR ABSENT
        new_assignment, created = WeeklyAssignment.objects.update_or_create(
            employee=remplacant_trouve,
            jour_semaine=jour_semaine_absence,
            defaults={
                'tache': original_assignment.tache,
                'shift': original_assignment.shift,
                'is_replacement': True,
                'replaced_employee': absent_employee,
                'notes': f"Remplacement automatique de {absent_employee.user.nom} (absent le {jour_semaine_absence}).",
            }
        )

        # 4. Notifications
        NotificationService.send_to_managers(
            title="Remplacement Automatique",
            message=f"{remplacant_trouve.user.nom} remplace {absent_employee.user.nom} le {jour_semaine_absence}.",
            type='replacement'
        )

        NotificationService.send_to_user(
            user=remplacant_trouve.user,
            title="Nouveau Shift (Remplacement)",
            message=(
                f"Bonjour, vous remplacez {absent_employee.user.nom} le "
                f"{jour_semaine_absence} pour la tache {original_assignment.get_tache_display()}."
            ),
            type='replacement'
        )

        return new_assignment
