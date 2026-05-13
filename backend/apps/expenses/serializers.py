from rest_framework import serializers
# pyrefly: ignore [missing-import]
from apps.users.api_base import BaseModelSerializerV1
from .models import Expense

class ExpenseSerializer(BaseModelSerializerV1):
    created_by_name = serializers.CharField(source='created_by.nom', read_only=True)
    validated_by_name = serializers.CharField(source='validated_by.nom', read_only=True)
    
    class Meta:
        model = Expense
        fields = '__all__'
        read_only_fields = ('created_by', 'validated_by', 'status')
