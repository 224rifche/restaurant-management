from django_filters import rest_framework as filters
from .models import Employee

class EmployeeFilter(filters.FilterSet):
    """
    Filtres personnalisés pour les employés.
    Permet de filtrer par :
    - poste (exact)
    - statut (exact)
    - date_embauche (après telle date, avant telle date)
    """
    
    date_embauche_apres = filters.DateFilter(field_name="date_embauche", lookup_expr='gte')
    date_embauche_avant = filters.DateFilter(field_name="date_embauche", lookup_expr='lte')
    
    class Meta:
        model = Employee
        fields = ['poste', 'statut']
