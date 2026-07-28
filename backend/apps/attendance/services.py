import hashlib
import math
from datetime import datetime, timezone, timedelta
from django.conf import settings
from django.core.exceptions import ValidationError
# pyrefly: ignore [missing-import]
from apps.schedules.models import WeeklyAssignment, ShiftSchedule
# pyrefly: ignore [missing-import]
from apps.schedules.services import ReplacementService
# pyrefly: ignore [missing-import]
from apps.notifications.services import NotificationService
from .models import Attendance, AttendanceRule

# ===========================================================
# NOMS DES JOURS EN FRANCAIS -- pour convertir la date du jour
# en 'jour_semaine' utilise par WeeklyAssignment/ShiftSchedule
# ===========================================================
JOURS_PYTHON_VERS_FR = {
    0: 'lundi', 1: 'mardi', 2: 'mercredi', 3: 'jeudi',
    4: 'vendredi', 5: 'samedi', 6: 'dimanche',
}

# REGLE METIER : heure limite absolue -- si l'employe n'a toujours pas
# pointe son arrivee a cette heure, le systeme le marque AUTOMATIQUEMENT
# absent, sans attendre l'intervention d'un admin.
HEURE_LIMITE_ABSENCE_AUTO = datetime.strptime("20:30", "%H:%M").time()


class AttendanceService:
    """
    Service gerant la logique de pointage (QR Code, Selfie, Retards, GPS).
    """

    @staticmethod
    def calculate_distance(lat1, lon1, lat2, lon2):
        if lat1 is None or lon1 is None:
            return 0
        R = 6371000
        phi1, phi2 = math.radians(float(lat1)), math.radians(float(lat2))
        dphi = math.radians(float(lat2) - float(lat1))
        dlambda = math.radians(float(lon2) - float(lon1))
        a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c

    @staticmethod
    def generate_current_qr_token():
        now = datetime.now()
        seed = f"{settings.SECRET_KEY}-{now.strftime('%Y-%m-%d-%H-%M')}"
        return hashlib.sha256(seed.encode()).hexdigest()[:12]

    @staticmethod
    def verify_qr_token(client_token):
        if client_token == AttendanceService.generate_current_qr_token():
            return True
        last_minute = datetime.now() - timedelta(minutes=1)
        seed_last = f"{settings.SECRET_KEY}-{last_minute.strftime('%Y-%m-%d-%H-%M')}"
        token_last = hashlib.sha256(seed_last.encode()).hexdigest()[:12]
        return client_token == token_last

    @staticmethod
    def _get_shift_du_jour(employee, jour_semaine):
        """
        Retrouve l'horaire de reference (ShiftSchedule) applicable
        a CET employe, CE jour de la semaine -- en passant par
        son affectation WeeklyAssignment du jour.

        REGLE METIER : le champ tolerance_retard_minutes de ShiftSchedule
        est CONFIDENTIEL -- seul ce service backend le lit, jamais
        expose directement a un employe via l'API.
        """
        assignment = WeeklyAssignment.objects.filter(
            employee=employee, jour_semaine=jour_semaine
        ).select_related('shift').first()

        if assignment and assignment.shift:
            return assignment.shift
        return None

    @classmethod
    def pointage_arrivee(cls, employee, selfie, qr_token, lat=None, lon=None):
        """
        Gere l'arrivee d'un employe.
        """
        if lat and lon:
            dist = cls.calculate_distance(lat, lon, settings.RESTAURANT_LATITUDE, settings.RESTAURANT_LONGITUDE)
            if dist > settings.POINTAGE_MAX_DISTANCE_METERS:
                raise ValidationError(f"Vous etes trop loin du restaurant ({int(dist)}m). Pointage refuse.")

        if not cls.verify_qr_token(qr_token):
            raise ValidationError("QR Code invalide ou expire. Veuillez scanner le code actuel sur la tablette.")

        today = datetime.now().date()
        if Attendance.objects.filter(employee=employee, date=today).exists():
            raise ValidationError("Vous avez deja pointe votre arrivee aujourd'hui.")

        now_time = datetime.now().time()
        statut = 'present'

        # REGLE METIER : calcul du retard via le NOUVEAU systeme
        # (ShiftSchedule + tolerance confidentielle), et non plus
        # via l'ancien champ Schedule.heure_debut qui n'existe plus.
        jour_semaine = JOURS_PYTHON_VERS_FR[today.weekday()]
        shift = cls._get_shift_du_jour(employee, jour_semaine)

        if shift:
            tolerance = timedelta(minutes=shift.tolerance_retard_minutes)
            limite_retard = (datetime.combine(today, shift.heure_debut) + tolerance).time()
            if now_time > limite_retard:
                statut = 'en_retard'

        attendance = Attendance.objects.create(
            employee=employee,
            date=today,
            heure_arrivee=now_time,
            selfie_arrivee=selfie,
            statut=statut,
            qr_code_token=qr_token,
            latitude=lat,
            longitude=lon
        )

        return attendance

    @classmethod
    def pointage_depart(cls, employee, selfie, qr_token, lat=None, lon=None):
        """
        Gere le depart d'un employe.
        """
        if lat and lon:
            dist = cls.calculate_distance(lat, lon, settings.RESTAURANT_LATITUDE, settings.RESTAURANT_LONGITUDE)
            if dist > settings.POINTAGE_MAX_DISTANCE_METERS:
                raise ValidationError(f"Vous etes trop loin du restaurant ({int(dist)}m) pour pointer votre depart.")

        if not cls.verify_qr_token(qr_token):
            raise ValidationError("QR Code invalide ou expire. Veuillez scanner le code actuel sur la tablette.")

        attendance = Attendance.objects.filter(
            employee=employee,
            heure_depart__isnull=True
        ).order_by('-date', '-heure_arrivee').first()

        if not attendance:
            raise ValidationError("Aucun pointage d'arrivee 'ouvert' trouve. Vous devez d'abord pointer votre arrivee.")

        if (datetime.now().date() - attendance.date).days > 1:
            raise ValidationError("Votre dernier pointage est trop ancien. Veuillez contacter un administrateur.")

        now_time = datetime.now().time()
        attendance.heure_depart = now_time
        attendance.selfie_depart = selfie

        # Detection depart anticipe via le nouveau systeme ShiftSchedule
        jour_semaine = JOURS_PYTHON_VERS_FR[attendance.date.weekday()]
        shift = cls._get_shift_du_jour(employee, jour_semaine)

        if shift and now_time < shift.heure_fin:
            current_dt = datetime.now()
            shift_fin_dt = datetime.combine(attendance.date, shift.heure_fin)

            if shift.heure_fin < shift.heure_debut:
                shift_fin_dt += timedelta(days=1)

            if current_dt < shift_fin_dt:
                diff = shift_fin_dt - current_dt
                if diff.total_seconds() > 900:
                    attendance.notes = (attendance.notes or "") + f" [Depart anticipe de {int(diff.total_seconds() // 60)} min]"

        attendance.save()
        return attendance

    @classmethod
    def check_and_process_absences(cls):
        """
        REGLE METIER (seuil 20h30) : verifie tous les employes qui
        devaient travailler aujourd'hui (WeeklyAssignment != repos)
        et qui n'ont TOUJOURS PAS pointe leur arrivee a 20h30.
        Ceux-la sont marques absents automatiquement, et le
        remplacement en chaine est declenche.

        Appelee regulierement (ex: toutes les 30 minutes via un
        scheduler/cron, ou manuellement par l'admin).
        """
        now = datetime.now()
        today = now.date()
        jour_semaine = JOURS_PYTHON_VERS_FR[today.weekday()]

        # On ne traite les absences qu'APRES l'heure limite (20h30)
        if now.time() < HEURE_LIMITE_ABSENCE_AUTO:
            return 0

        # Toutes les affectations du jour, sauf repos
        assignments_du_jour = WeeklyAssignment.objects.filter(
            jour_semaine=jour_semaine
        ).exclude(tache='repos').select_related('employee__user')

        processed_count = 0

        for assignment in assignments_du_jour:
            employee = assignment.employee

            has_attendance = Attendance.objects.filter(employee=employee, date=today).exists()

            if not has_attendance:
                Attendance.objects.create(
                    employee=employee,
                    date=today,
                    statut='absent',
                    notes=f"Absence auto detectee a {HEURE_LIMITE_ABSENCE_AUTO.strftime('%H:%M')} (aucun pointage)."
                )

                NotificationService.send_to_managers(
                    title="Alerte Absence",
                    message=f"{employee.user.nom} est absent (aucun pointage avant {HEURE_LIMITE_ABSENCE_AUTO.strftime('%H:%M')}).",
                    type='absence'
                )

                # Remplacement en chaine (jour+1, jour+2, ... cf schedules/services.py)
                ReplacementService.trigger_replacement(employee, jour_semaine)
                processed_count += 1

        return processed_count
