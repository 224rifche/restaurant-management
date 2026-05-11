# ===========================
# IMPORTS
# ===========================
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from drf_spectacular.utils import extend_schema_field

from .models import User
from .api_base import BaseModelSerializerV1, BaseWriteSerializer


# ===================================================
# SERIALIZER 1 : Lecture d'un utilisateur
# ===================================================
class UserReadSerializer(BaseModelSerializerV1):
    """
    Ce serializer sert UNIQUEMENT à lire/afficher des utilisateurs.
    """

    class Meta:
        model = User
        fields = ('id', 'telephone', 'nom', 'role', 'is_active', 'inserted_at')
        read_only_fields = ('id', 'inserted_at')


# ===================================================
# SERIALIZER 2 : Création d'un utilisateur
# ===================================================
class UserCreateSerializer(BaseWriteSerializer):
    """
    Ce serializer sert à CRÉER un nouvel utilisateur.
    """

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )

    password2 = serializers.CharField(
        write_only=True,
        required=True
    )

    class Meta:
        model = User
        fields = ('telephone', 'nom', 'role', 'password', 'password2')

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                "password": "Les mots de passe ne correspondent pas."
            })
        return super().validate(attrs)

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            telephone=validated_data['telephone'],
            nom=validated_data['nom'],
            role=validated_data['role'],
            password=validated_data['password']
        )
        return user


# ===================================================
# SERIALIZER 3 : Modification d'un utilisateur
# ===================================================
class UserUpdateSerializer(BaseWriteSerializer):
    """
    Ce serializer sert à MODIFIER un utilisateur existant.
    """

    class Meta:
        model = User
        fields = ('nom', 'role', 'is_active')
        extra_kwargs = {
            'nom': {'required': False},
            'role': {'required': False},
            'is_active': {'required': False},
        }


# ===================================================
# SERIALIZER 4 : Changement de mot de passe
# ===================================================
class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer pour le changement de mot de passe.
    """

    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password]
    )
    new_password2 = serializers.CharField(required=True, write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({
                "new_password": "Les nouveaux mots de passe ne correspondent pas."
            })
        return attrs