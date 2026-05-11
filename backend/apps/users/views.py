# ===========================
# IMPORTS
# ===========================
from rest_framework import status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, extend_schema_view

from .models import User
from .serializers import (
    UserReadSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer,
)
from .api_base import BaseUserViewset


# ===========================
# PERMISSION PERSONNALISÉE
# ===========================
class IsAdminUser(permissions.BasePermission):
    """
    Permission pour les administrateurs uniquement.
    """
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == 'admin'
        )


# ===========================
# VIEWSET PRINCIPAL
# ===========================
@extend_schema_view(
    list=extend_schema(tags=["Users"], summary="Liste tous les utilisateurs"),
    retrieve=extend_schema(tags=["Users"], summary="Récupère un utilisateur"),
    create=extend_schema(tags=["Users"], summary="Crée un nouvel utilisateur"),
    update=extend_schema(tags=["Users"], summary="Modifie un utilisateur"),
    partial_update=extend_schema(tags=["Users"], summary="Modifie partiellement un utilisateur"),
    destroy=extend_schema(tags=["Users"], summary="Supprime un utilisateur"),
)
class UserViewSet(BaseUserViewset):
    """
    ViewSet pour la gestion des utilisateurs.
    """

    queryset = User.objects.all().order_by('-inserted_at')
    permission_classes = [IsAdminUser]

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        if self.action in ['update', 'partial_update']:
            return UserUpdateSerializer
        if self.action == 'change_password':
            return ChangePasswordSerializer
        return UserReadSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        read_serializer = UserReadSerializer(user)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserReadSerializer(user).data, status=status.HTTP_200_OK)

    @extend_schema(
        tags=["Users"],
        summary="Change le mot de passe d'un utilisateur",
        request=ChangePasswordSerializer,
        responses={200: {"type": "object", "properties": {"detail": {"type": "string"}}}}
    )
    @action(
        detail=True,
        methods=['post'],
        permission_classes=[permissions.IsAuthenticated],
    )
    def change_password(self, request, pk=None):
        user = self.get_object()

        if request.user != user and request.user.role != 'admin':
            return Response(
                {"detail": "Vous ne pouvez pas modifier le mot de passe d'un autre utilisateur."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not user.check_password(serializer.validated_data['old_password']):
            return Response(
                {"old_password": "Mot de passe actuel incorrect."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(serializer.validated_data['new_password'])
        user.save()

        return Response(
            {"detail": "Mot de passe modifié avec succès."},
            status=status.HTTP_200_OK
        )