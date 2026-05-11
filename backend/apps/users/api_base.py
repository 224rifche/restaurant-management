from rest_framework import serializers

class BaseModelSerializerV1(serializers.ModelSerializer):
    """Base serializer for read operations."""
    pass

class BaseWriteSerializer(serializers.ModelSerializer):
    """Base serializer for write operations with unknown field validation."""
    
    def validate(self, attrs):
        return super().validate(attrs)

from rest_framework import viewsets

class BaseViewSet(viewsets.ModelViewSet):
    """Base ViewSet with common logic."""
    
    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return self.queryset.model.objects.none()
        return super().get_queryset()

class BaseUserViewset(BaseViewSet):
    """Base ViewSet for user-related operations."""
    pass
