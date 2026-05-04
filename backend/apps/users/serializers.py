# ===========================
# IMPORTS
# ===========================
from rest_framework import serializers
# "rest_framework" = Django REST Framework (DRF)
# "serializers" = le module qui contient toutes les classes
# de serialization de DRF

from django.contrib.auth.password_validation import validate_password
# Django a un système de validation de mot de passe intégré
# Il vérifie par exemple :
# - mot de passe pas trop court (min 8 caractères par défaut)
# - mot de passe pas entièrement numérique
# - mot de passe pas trop commun ("password123" refusé)
# On importe cette fonction pour l'utiliser dans notre serializer

from .models import User
# On importe notre modèle User depuis models.py
# Le point "." signifie "dans le même dossier (apps/users/)"


# ===================================================
# SERIALIZER 1 : Lecture d'un utilisateur
# Utilisé pour GET /api/users/ et GET /api/users/{id}/
# ===================================================
class UserReadSerializer(serializers.ModelSerializer):
    """
    Ce serializer sert UNIQUEMENT à lire/afficher des utilisateurs.
    On l'utilise quand on veut envoyer des données AU frontend.
    
    On le sépare du serializer d'écriture car :
    - En lecture : on ne veut JAMAIS envoyer le mot de passe
    - En écriture : on a besoin de champs spéciaux (password1, password2)
    Avoir deux serializers distincts = code plus clair et plus sécurisé
    """

    class Meta:
        # "Meta" est une classe interne de configuration
        # DRF la lit pour savoir comment se comporter
        # C'est une convention Django/DRF - le nom "Meta" est obligatoire

        model = User
        # Quel modèle ce serializer représente ?
        # DRF va automatiquement créer les champs correspondants
        # aux colonnes de la table User en base de données

        fields = ('id', 'telephone', 'nom', 'role', 'is_active', 'date_creation')
        # Liste EXPLICITE des champs à inclure dans le JSON de sortie
        # 
        # IMPORTANT : "password" n'est PAS dans cette liste
        # Même hashé, on ne renvoie jamais le mot de passe au frontend
        # C'est une règle de sécurité fondamentale
        #
        # Pourquoi pas fields = '__all__' (tous les champs) ?
        # Car '__all__' inclurait le password et d'autres champs sensibles
        # Toujours lister explicitement les champs = meilleure pratique

        read_only_fields = ('id', 'date_creation')
        # Ces champs sont en lecture seule = le frontend ne peut pas les modifier
        # "id" : généré automatiquement par la base de données
        # "date_creation" : rempli automatiquement par auto_now_add=True


# ===================================================
# SERIALIZER 2 : Création d'un utilisateur
# Utilisé pour POST /api/users/
# ===================================================
class UserCreateSerializer(serializers.ModelSerializer):
    """
    Ce serializer sert à CRÉER un nouvel utilisateur.
    Il gère la sécurité du mot de passe avec deux champs distincts.
    """

    password = serializers.CharField(
        write_only=True,
        # write_only=True = ce champ est accepté en entrée
        # mais jamais renvoyé en sortie (jamais dans le JSON de réponse)
        # Même en lecture, le mot de passe reste invisible

        required=True,
        # Ce champ est obligatoire
        # Si le frontend ne l'envoie pas → erreur de validation automatique

        validators=[validate_password]
        # validators = liste de fonctions de validation
        # validate_password va vérifier la complexité du mot de passe
        # Si le mot de passe est trop simple → erreur avec message explicite
    )

    password2 = serializers.CharField(
        write_only=True,
        # Même logique : jamais renvoyé au frontend

        required=True
        # Obligatoire aussi
    )
    # password2 = champ de confirmation
    # Il n'existe PAS dans le modèle User
    # On le crée ici JUSTE pour la validation (vérifier que les deux sont identiques)
    # Il ne sera jamais sauvegardé en base de données

    class Meta:
        model = User

        fields = ('telephone', 'nom', 'role', 'password', 'password2')
        # On inclut password et password2 pour la création
        # Pas d'id ni date_creation car ils sont auto-générés

    def validate(self, attrs):
        """
        "validate" est une méthode spéciale de DRF
        Elle est appelée automatiquement APRÈS la validation de chaque champ individuel
        Elle reçoit "attrs" = dictionnaire de tous les champs déjà validés
        
        C'est ici qu'on fait les validations qui concernent PLUSIEURS champs
        en même temps (ex: comparer password et password2)
        """

        if attrs['password'] != attrs['password2']:
            # attrs['password'] = le mot de passe saisi
            # attrs['password2'] = la confirmation saisie
            # Si les deux sont différents → on lève une erreur

            raise serializers.ValidationError({
                # serializers.ValidationError = l'erreur standard de DRF
                # Elle renvoie automatiquement un HTTP 400 Bad Request au frontend
                # avec le message d'erreur en JSON

                "password": "Les mots de passe ne correspondent pas."
                # On associe l'erreur au champ "password"
                # Le frontend recevra : {"password": ["Les mots de passe ne correspondent pas."]}
            })

        return attrs
        # Si tout est OK, on retourne attrs tel quel
        # DRF continuera ensuite vers la méthode create()

    def create(self, validated_data):
        """
        "create" est appelée quand on appelle serializer.save()
        Elle reçoit "validated_data" = les données après validation réussie
        
        On surcharge cette méthode car la création d'un User
        nécessite un traitement spécial pour le mot de passe
        """

        validated_data.pop('password2')
        # .pop() = retire et retourne la valeur d'un dictionnaire
        # On retire password2 car il n'existe pas dans le modèle User
        # Si on essayait de créer User(password2=...) → erreur Django

        user = User.objects.create_user(
            telephone=validated_data['telephone'],
            nom=validated_data['nom'],
            role=validated_data['role'],
            password=validated_data['password']
        )
        # User.objects.create_user() et pas User.objects.create()
        # 
        # La différence CRUCIALE :
        # create()      → sauvegarde le mot de passe en CLAIR dans la base → DANGER
        # create_user() → HASH le mot de passe avant de sauvegarder → SÉCURISÉ
        #
        # create_user() est définie dans notre CustomUserManager (models.py)
        # Elle appelle set_password() qui applique l'algorithme de hashage (bcrypt/PBKDF2)

        return user
        # On retourne l'objet User créé
        # DRF l'utilisera pour construire la réponse JSON avec UserReadSerializer


# ===================================================
# SERIALIZER 3 : Modification d'un utilisateur
# Utilisé pour PUT/PATCH /api/users/{id}/
# ===================================================
class UserUpdateSerializer(serializers.ModelSerializer):
    """
    Ce serializer sert à MODIFIER un utilisateur existant.
    On peut changer le nom, le rôle, le statut actif.
    Le mot de passe a son propre endpoint dédié (bonne pratique).
    """

    class Meta:
        model = User

        fields = ('nom', 'role', 'is_active')
        # On permet uniquement de modifier ces trois champs
        # 
        # Pourquoi pas "telephone" ?
        # Le téléphone = identifiant de connexion, comme un email
        # Le changer nécessiterait une vérification (SMS, etc.)
        # Pour un projet d'apprentissage, on le garde en lecture seule
        #
        # Pourquoi pas "password" ?
        # Le changement de mot de passe mérite son propre endpoint
        # avec des vérifications supplémentaires (ancien mot de passe, etc.)

        extra_kwargs = {
            'nom': {'required': False},
            'role': {'required': False},
            'is_active': {'required': False},
        }
        # extra_kwargs = configuration supplémentaire par champ
        # required=False = ces champs sont optionnels
        # 
        # Pourquoi ? Pour supporter PATCH (modification partielle)
        # PUT   = envoyer TOUS les champs obligatoirement
        # PATCH = envoyer seulement les champs qu'on veut modifier
        # Avec required=False, PATCH /api/users/1/ {"nom": "Ali"} fonctionne
        # sans avoir à envoyer role et is_active aussi


# ===================================================
# SERIALIZER 4 : Changement de mot de passe
# Utilisé pour POST /api/users/{id}/change-password/
# ===================================================
class ChangePasswordSerializer(serializers.Serializer):
    """
    Remarque : on hérite de serializers.Serializer
    et PAS de serializers.ModelSerializer
    
    Pourquoi ?
    ModelSerializer = lié à un modèle, génère les champs automatiquement
    Serializer      = indépendant, on définit tous les champs manuellement
    
    Ici, ces champs (old_password, new_password, new_password2)
    n'existent pas dans le modèle → on utilise Serializer de base
    """

    old_password = serializers.CharField(
        required=True,
        write_only=True
        # L'utilisateur doit prouver qu'il connaît son mot de passe actuel
        # avant de pouvoir le changer → sécurité
    )

    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password]
        # On valide la complexité du nouveau mot de passe
    )

    new_password2 = serializers.CharField(
        required=True,
        write_only=True
        # Confirmation du nouveau mot de passe
    )

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({
                "new_password": "Les nouveaux mots de passe ne correspondent pas."
            })
        return attrs
        # Même logique que dans UserCreateSerializer