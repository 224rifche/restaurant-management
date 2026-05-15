import hashlib
import math
from datetime import datetime, timezone, timedelta
from django.conf import settings
from django.core.exceptions import ValidationError
# pyrefly: ignore [missing-import]
from apps.schedules.models import Schedule
# pyrefly: ignore [missing-import]
from apps.schedules.services import ReplacementService
# pyrefly: ignore [missing-import]
from apps.notifications.services import NotificationService
from .models import Attendance, AttendanceRule

class AttendanceService:
    """
    Service gérant la logique de pointage (QR Code, Selfie, Retards, GPS).
    """

    @staticmethod
    def calculate_distance(lat1, lon1, lat2, lon2):
        """
        Calcule la distance en mètres entre deux points GPS (Haversine).
        """
        if lat1 is None or lon1 is None:
            return 0
        
        R = 6371000  # Rayon de la Terre en mètres
        phi1, phi2 = math.radians(float(lat1)), math.radians(float(lat2))
        dphi = math.radians(float(lat2) - float(lat1))
        dlambda = math.radians(float(lon2) - float(lon1))
        
        a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        return R * c

    @staticmethod
    def generate_current_qr_token():
        """
        Génère un token unique basé sur la minute actuelle.
        Le QR Code sur la tablette devra afficher ce token.
        """
        # On utilise une clé secrète + la date et l'heure (arrondie à la minute)
        now = datetime.now()
        seed = f"{settings.SECRET_KEY}-{now.strftime('%Y-%m-%d-%H-%M')}"
        return hashlib.sha256(seed.encode()).hexdigest()[:12]

    @staticmethod
    def verify_qr_token(client_token):
        """
        Vérifie si le token scanné par l'employé est valide.
        On accepte le token de la minute actuelle OU de la minute précédente (latence).
        """
        # Token actuel
        if client_token == AttendanceService.generate_current_qr_token():
            return True
            
        # Token d'il y a 1 minute (pour être souple)
        last_minute = datetime.now() - timedelta(minutes=1)
        seed_last = f"{settings.SECRET_KEY}-{last_minute.strftime('%Y-%m-%d-%H-%M')}"
        token_last = hashlib.sha256(seed_last.encode()).hexdigest()[:12]
        
        return client_token == token_last

    @classmethod
    def pointage_arrivee(cls, employee, selfie, qr_token, lat=None, lon=None):
        """
        Gère l'arrivée d'un employé.
        """
        # 0. Vérification GPS
        if lat and lon:
            dist = cls.calculate_distance(lat, lon, settings.RESTAURANT_LATITUDE, settings.RESTAURANT_LONGITUDE)
            if dist > settings.POINTAGE_MAX_DISTANCE_METERS:
                 raise ValidationError(f"Vous êtes trop loin du restaurant ({int(dist)}m). Pointage refusé.")

        # 1. Vérification du QR Code
        if not cls.verify_qr_token(qr_token):
            raise ValidationError("QR Code invalide ou expiré. Veuillez scanner le code actuel sur la tablette.")

        # 2. Vérifier si déjà pointé aujourd'hui
        today = datetime.now().date()
        if Attendance.objects.filter(employee=employee, date=today).exists():
            raise ValidationError("Vous avez déjà pointé votre arrivée aujourd'hui.")

        # 3. Calcul du statut (Retard ?)
        now_time = datetime.now().time()
        statut = 'present'
        
        # On cherche le planning de l'employé pour aujourd'hui
        planning = Schedule.objects.filter(employee=employee, date=today).first()
        if planning:
            # Si pointage > heure_debut + 15 minutes de grâce
            grace_time = (datetime.combine(today, planning.heure_debut) + timedelta(minutes=15)).time()
            if now_time > grace_time:
                statut = 'en_retard'

        # 4. Création du pointage
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
        Gère le départ d'un employé.
        """
        # 0. Vérification GPS
        if lat and lon:
            dist = cls.calculate_distance(lat, lon, settings.RESTAURANT_LATITUDE, settings.RESTAURANT_LONGITUDE)
            if dist > settings.POINTAGE_MAX_DISTANCE_METERS:
                 raise ValidationError(f"Vous êtes trop loin du restaurant ({int(dist)}m) pour pointer votre départ.")

        # 1. Vérification du QR Code (obligatoire aussi au départ)
        if not cls.verify_qr_token(qr_token):
            raise ValidationError("QR Code invalide ou expiré. Veuillez scanner le code actuel sur la tablette.")

        # 2. Récupérer le pointage "ouvert" le plus récent
        # On cherche un pointage qui n'a pas encore d'heure de départ
        attendance = Attendance.objects.filter(
            employee=employee, 
            heure_depart__isnull=True
        ).order_by('-date', '-heure_arrivee').first()
        
        if not attendance:
            raise ValidationError("Aucun pointage d'arrivée 'ouvert' trouvé. Vous devez d'abord pointer votre arrivée.")
        
        # On vérifie quand même que le pointage n'est pas trop vieux (max 16h)
        # pour éviter de fermer un pointage d'il y a 3 jours par erreur
        if (datetime.now().date() - attendance.date).days > 1:
             raise ValidationError("Votre dernier pointage est trop ancien. Veuillez contacter un administrateur.")

        # 3. Mise à jour du pointage
        now_time = datetime.now().time()
        attendance.heure_depart = now_time
        attendance.selfie_depart = selfie
        
        # Optionnel : Détecter si départ anticipé (par rapport au planning du pointage)
        planning = Schedule.objects.filter(employee=employee, date=attendance.date).first()
        if planning and now_time < planning.heure_fin:
             # Si c'est un départ anticipé de plus de 15 min
             # On utilise datetime.combine pour gérer la comparaison
             current_dt = datetime.now()
             planning_fin_dt = datetime.combine(attendance.date, planning.heure_fin)
             
             # Si le shift finit après minuit, on ajoute un jour à la date de fin du planning
             if planning.heure_fin < planning.heure_debut:
                 planning_fin_dt += timedelta(days=1)
             
             if current_dt < planning_fin_dt:
                 diff = planning_fin_dt - current_dt
                 if diff.total_seconds() > 900: # 15 minutes
                     attendance.notes = (attendance.notes or "") + f" [Départ anticipé de {int(diff.total_seconds() // 60)} min]"

        attendance.save()
        return attendance

    @classmethod
    def check_and_process_absences(cls):
        """
        Vérifie les employés qui devaient commencer leur shift mais ne sont pas là.
        Appelé régulièrement (ex: toutes les 30 minutes).
        """
        today = datetime.now().date()
        now_time = datetime.now().time()
        
        # 1. On cherche tous les plannings d'aujourd'hui
        # où l'heure de début + 30 minutes de retard est déjà passée
        # et qui ne sont pas des jours de repos
        all_schedules = Schedule.objects.filter(
            date=today
        ).exclude(fonction='repos').select_related('employee')

        processed_count = 0
        
        # Récupérer toutes les règles actives une seule fois pour optimiser
        rules = list(AttendanceRule.objects.filter(is_active=True))

        for planning in all_schedules:
            # 1. Trouver la règle applicable (poste spécifique ou 'tout')
            rule = next((r for r in rules if r.poste == planning.employee.poste), None)
            if not rule:
                rule = next((r for r in rules if r.poste == 'tout'), None)
            
            # 2. Déterminer l'heure limite
            if rule and rule.absolute_limit_time:
                # Heure fixe (ex: 16:30)
                limit_dt = datetime.combine(today, rule.absolute_limit_time)
            else:
                # Délai relatif (ex: début + 30 min)
                grace = rule.grace_period_minutes if rule else 30
                limit_dt = datetime.combine(today, planning.heure_debut) + timedelta(minutes=grace)
            
            # 3. Vérifier si l'heure est passée
            if datetime.now() > limit_dt:
                # Vérifier si un pointage existe
                has_attendance = Attendance.objects.filter(
                    employee=planning.employee, 
                    date=today
                ).exists()

                if not has_attendance:
                    # MARQUER ABSENT
                    attendance = Attendance.objects.create(
                        employee=planning.employee,
                        date=today,
                        statut='absent',
                        notes=f"Absence auto (Règle: {rule.name if rule else 'Défaut'})"
                    )
                    
                    # NOTIFIER LE MANAGER
                    NotificationService.send_to_managers(
                        title="Alerte Absence",
                        message=f"{planning.employee.user.nom} est absent (Limite de {limit_dt.strftime('%H:%M')} dépassée).",
                        type='absence'
                    )
                    
                    # DÉCLENCHER LE REMPLACEMENT
                    ReplacementService.trigger_replacement(planning.employee, today)
                    processed_count += 1
        
        return processed_count
