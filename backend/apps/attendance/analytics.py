from django.db.models import Sum, Count, Q, F, ExpressionWrapper, fields
from datetime import datetime, timedelta
from .models import Attendance
# pyrefly: ignore [missing-import]
from apps.employees.models import Employee

class AttendanceAnalytics:
    """
    Service pour générer des rapports sur les présences et la performance.
    """

    @staticmethod
    def get_employee_stats(employee_id, start_date, end_date):
        """
        Calcul les stats détaillées pour un employé sur une période.
        """
        attendances = Attendance.objects.filter(
            employee_id=employee_id,
            date__range=[start_date, end_date]
        )

        total_present = attendances.filter(statut='present').count()
        total_late = attendances.filter(statut='en_retard').count()
        total_absent = attendances.filter(statut='absent').count()
        
        # Calcul des heures travaillées
        # (Différence entre heure_depart et heure_arrivee pour les pointages valides)
        total_seconds = 0
        valid_attendances = attendances.filter(heure_arrivee__isnull=False, heure_depart__isnull=False)
        
        for att in valid_attendances:
            # On utilise la VRAIE date du pointage
            dt_arrivee = datetime.combine(att.date, att.heure_arrivee)
            dt_depart = datetime.combine(att.date, att.heure_depart)
            
            # FAIT : Si l'heure de départ est inférieure à l'arrivée, 
            # c'est que l'employé a fini le lendemain matin (shift de nuit)
            if dt_depart < dt_arrivee:
                dt_depart += timedelta(days=1)
                
            total_seconds += (dt_depart - dt_arrivee).total_seconds()

        total_hours = round(total_seconds / 3600, 2)

        return {
            "employee_id": employee_id,
            "period": f"{start_date} au {end_date}",
            "total_present": total_present,
            "total_late": total_late,
            "total_absent": total_absent,
            "total_hours": total_hours,
            "attendance_rate": round((total_present + total_late) / (total_present + total_late + total_absent) * 100, 2) if (total_present + total_late + total_absent) > 0 else 0
        }

    @staticmethod
    def get_global_dashboard_stats():
        """
        Stats globales complètes pour le dashboard du manager (Aujourd'hui).
        """
        from apps.expenses.models import Expense
        from apps.attendance.serializers import AttendanceReadSerializer
        from apps.expenses.serializers import ExpenseSerializer
        
        today = datetime.now().date()
        
        # Stats de pointage
        attendance_stats = Attendance.objects.filter(date=today).aggregate(
            presents=Count('id', filter=Q(statut='present')),
            retards=Count('id', filter=Q(statut='en_retard')),
            absents=Count('id', filter=Q(statut='absent'))
        )
        
        # Dernières activités (pointages)
        recent_attendance = Attendance.objects.all().select_related('employee__user').order_by('-inserted_at')[:5]
        
        # Calcul du taux de présence réel
        total_active_employees = Employee.objects.filter(user__is_active=True).count()
        present_count = attendance_stats['presents'] or 0
        attendance_rate = round((present_count / total_active_employees * 100), 1) if total_active_employees > 0 else 0
        
        # Stats de dépenses
        total_expenses = Expense.objects.filter(inserted_at__date=today, status='validated').aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        recent_expenses = Expense.objects.all().order_by('-inserted_at')[:5]

        # Stats d'hier pour calcul de tendance
        yesterday = today - timedelta(days=1)
        yesterday_attendance = Attendance.objects.filter(date=yesterday).aggregate(
            presents=Count('id', filter=Q(statut='present'))
        )['presents'] or 0
        
        yesterday_expenses = Expense.objects.filter(inserted_at__date=yesterday, status='validated').aggregate(
            total=Sum('amount')
        )['total'] or 0

        # Calcul des tendances
        attendance_trend = attendance_stats['presents'] - yesterday_attendance
        expense_trend = 0
        if yesterday_expenses > 0:
            expense_trend = round(((total_expenses - yesterday_expenses) / yesterday_expenses) * 100, 1)
        elif total_expenses > 0:
            expense_trend = 100

        # État détaillé des employés pour le tableau du dashboard
        active_employees = Employee.objects.filter(user__is_active=True).select_related('user')
        employee_status_list = []
        
        # On récupère tous les pointages du jour d'un coup pour optimiser
        today_attendances = {a.employee_id: a for a in Attendance.objects.filter(date=today)}
        
        for emp in active_employees:
            att = today_attendances.get(emp.id)
            status_label = 'absent'
            if att:
                status_label = att.statut
                
            employee_status_list.append({
                "id": emp.id,
                "nom": emp.user.nom,
                "statut": status_label,
            })

        # Stats Hebdomadaires Optimisées
        week_ago = today - timedelta(days=6)
        
        # Récupération groupée des présences
        att_weekly = Attendance.objects.filter(date__gte=week_ago, date__lte=today, statut__in=['present', 'en_retard']) \
            .values('date').annotate(count=Count('id'))
        att_map = {a['date']: a['count'] for a in att_weekly}
        
        # Récupération groupée des dépenses
        exp_weekly = Expense.objects.filter(inserted_at__date__gte=week_ago, inserted_at__date__lte=today, status='valide') \
            .values('inserted_at__date').annotate(total=Sum('amount'))
        exp_map = {e['inserted_at__date']: e['total'] for e in exp_weekly}
        
        weekly_stats = []
        for i in range(6, -1, -1):
            day = today - timedelta(days=i)
            weekly_stats.append({
                "name": day.strftime('%a'),
                "attendance": att_map.get(day, 0),
                "expenses": float(exp_map.get(day, 0))
            })

        return {
            "date": today,
            "attendance": {
                "presents": attendance_stats['presents'] or 0,
                "retards": attendance_stats['retards'] or 0,
                "absents": attendance_stats['absents'] or 0,
                "rate": attendance_rate,
                "trend": attendance_trend
            },
            "expenses": {
                "today_total": total_expenses,
                "trend": expense_trend
            },
            "recent_activity": AttendanceReadSerializer(recent_attendance, many=True).data,
            "employee_status": employee_status_list[:10], # Top 10 pour le dashboard
            "recent_expenses": ExpenseSerializer(recent_expenses, many=True).data,
            "weekly_stats": weekly_stats
        }
