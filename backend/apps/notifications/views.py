from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    from rest_framework import filters
    filter_backends = [filters.SearchFilter]
    search_fields = ['message']

    def get_queryset(self):
        # Chaque utilisateur ne voit que ses notifications
        return self.queryset.filter(recipient=self.request.user)

    @action(detail=False, methods=['post'], url_path='mark-all-as-read')
    def mark_all_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({'status': 'notifications marked as read'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='mark-as-read')
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'notification marked as read'}, status=status.HTTP_200_OK)
