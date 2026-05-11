# ===========================
# IMPORTS
# ===========================
from rest_framework import serializers
# serializers = le module DRF qui gère la transformation des données
# Sens 1 : Objet Python (Employee) → JSON (pour répondre au client)
# Sens 2 : JSON (du client) → Objet Python validé (pour sauvegarder en BDD)
# C'est le "traducteur" entre notre code Python et le monde extérieur

from .models import Employee, POSTE_CHOICES, STATUT_CHOICES

# pyrefly: ignore [missing-import]
from apps.users.models import User
# On importe le modèle ET les listes de choix
# Les listes de choix servent à valider les données entrantes

# ===========================
# POURQUOI PLUSIEURS SERIALIZERS ?
# ===========================
# Principe : séparation des responsabilités
# 
# Mauvaise approche (débutant) : UN seul serializer pour tout
# → Problème : on expose des champs qu'on ne veut pas (salaire en lecture publique ?)
# → Problème : les champs obligatoires à la création peuvent être optionnels en modif
#
# Bonne approche (pro) : un serializer par OPÉRATION
# - EmployeeReadSerializer   → GET  (lire/afficher)
# - EmployeeCreateSerializer → POST (créer)
# - EmployeeUpdateSerializer → PUT/PATCH (modifier)
#
# Avantages :
# 1. Contrôle précis des champs exposés
# 2. Validations différentes selon l'opération
# 3. Code plus lisible et maintenable


# ===================================================
# SERIALIZER 1 : LECTURE — Affichage d'un employé
# ===================================================
class EmployeeReadSerializer(serializers.ModelSerializer):
    """
    Utilisé pour les réponses GET.
    Affiche toutes les informations utiles d'un employé,
    y compris les données du User associé (nom, téléphone).
    """
    
    # ===========================
    # CHAMPS "CALCULÉS" (SerializerMethodField)
    # ===========================
    # Ces champs n'existent pas directement dans la BDD Employee
    # On les calcule via une méthode Python
    # DRF appelle automatiquement la méthode "get_NOM_DU_CHAMP"
    
    nom = serializers.SerializerMethodField()
    # Appelle automatiquement la méthode get_nom() ci-dessous
    # Affiche le nom de l'employé (qui vient du User, pas d'Employee)
    
    telephone = serializers.SerializerMethodField()
    # Affiche le téléphone (qui vient du User)
    
    role = serializers.SerializerMethodField()
    # Affiche le rôle du User
    
    poste_label = serializers.SerializerMethodField()
    # Affiche "Serveur / Serveuse" au lieu de "serveur"
    # Plus lisible pour le frontend
    
    statut_label = serializers.SerializerMethodField()
    # Affiche "Actif" au lieu de "actif"
    
    class Meta:
        model = Employee
        # model : quel modèle ce serializer représente ?
        
        fields = (
            # Ordre des champs dans la réponse JSON
            'id',              # UUID de l'employé
            'nom',             # Calculé via get_nom()
            'telephone',       # Calculé via get_telephone()
            'role',            # Calculé via get_role()
            'poste',           # La valeur BDD : "serveur"
            'poste_label',     # Le label lisible : "Serveur / Serveuse"
            'salaire_base',    # Le nom exact dans models.py
            'date_embauche',   # Peut être null
            'statut',          # La valeur BDD : "actif"
            'statut_label',    # Le label lisible : "Actif"
            'notes',           # Notes internes
            'inserted_at',     # Date de création
            'updated_at',      # Date de modification
        )
        read_only_fields = fields
        # read_only_fields : TOUS les champs sont en lecture seule
        # Ce serializer ne JAMAIS utilisé pour écrire des données
        # C'est une protection supplémentaire
    
    # ===========================
    # MÉTHODES "get_" pour les SerializerMethodField
    # ===========================
    # Règle : pour un champ "nom = SerializerMethodField()"
    # DRF cherche AUTOMATIQUEMENT une méthode "get_nom(self, obj)"
    # "obj" = l'instance Employee en cours de sérialisation
    
    def get_nom(self, obj):
        # obj = l'Employee dont on génère le JSON
        # obj.user = le User associé via OneToOneField
        # obj.user.nom = le nom de cet utilisateur
        return obj.user.nom
    
    def get_telephone(self, obj):
        return obj.user.telephone
    
    def get_role(self, obj):
        return obj.user.role
    
    def get_poste_label(self, obj):
        # get_poste_display() = méthode Django auto pour les choices
        # Retourne le label ("Serveur / Serveuse") au lieu de la valeur ("serveur")
        return obj.get_poste_display()
    
    def get_statut_label(self, obj):
        return obj.get_statut_display()


# ===================================================
# SERIALIZER 2 : CRÉATION — Créer un nouvel employé
# ===================================================
class EmployeeCreateSerializer(serializers.ModelSerializer):
    """
    Utilisé pour les requêtes POST /api/employees/
    
    Logique métier :
    - L'admin entre : nom, téléphone, poste, salaire, etc.
    - Ce serializer crée AUTOMATIQUEMENT le User ET l'Employee
    - L'admin ne doit pas savoir que User et Employee sont deux tables
    - Pour lui, c'est juste "créer un employé"
    
    C'est ce qu'on appelle un serializer "abstrait" :
    il cache la complexité technique (deux tables) derrière une API simple.
    """
    
    # ===========================
    # CHAMPS VENANT DU USER
    # ===========================
    # Ces champs ne sont PAS dans la table Employee
    # Mais on les accepte dans la requête pour créer le User automatiquement
    
    nom = serializers.CharField(
        max_length=100,
        # max_length : validation côté DRF (avant d'arriver en BDD)
        # Si le client envoie 200 caractères → erreur 400 immédiate
    )
    
    telephone = serializers.CharField(
        max_length=20,
    )
    
    password = serializers.CharField(
        write_only=True,
        # write_only=True : ce champ est accepté en ENTRÉE mais jamais renvoyé
        # Si on oublie ça, le mot de passe (hashé) apparaît dans la réponse
        # C'est une faille de sécurité ! Toujours write_only pour les mots de passe
        
        min_length=6,
        # Minimum 6 caractères pour le mot de passe
        # Pour un restaurant local, pas besoin d'une politique trop stricte
        
        default='Restaurant2024!',
        # Mot de passe par défaut si l'admin n'en fournit pas
        # En pratique : l'admin peut créer le compte, l'employé change son mot de passe
        # La valeur par défaut est documentée pour que l'équipe soit au courant
    )
    
    class Meta:
        model = Employee
        fields = (
            # Champs du User (traités dans create())
            'nom',
            'telephone',
            'password',
            
            # Champs directs de Employee
            'poste',
            'salaire_base',
            'date_embauche',
            'statut',
            'notes',
        )
        extra_kwargs = {
            'salaire_base': {'required': False},
            # required=False : pas obligatoire, même si le modèle l'a en blank=True
            # DRF valide required AVANT de passer au modèle
            
            'date_embauche': {'required': False},
            'statut': {'required': False},
            'notes': {'required': False},
        }
    
    # ===========================
    # VALIDATION GLOBALE
    # ===========================
    def validate_telephone(self, value):
        # validate_NOM_DU_CHAMP = validation spécifique à UN champ
        # DRF appelle automatiquement cette méthode lors de is_valid()
        # "value" = la valeur brute envoyée par le client
        
        
        # Import local pour éviter les imports circulaires
        # (employees importe User, ce qui est OK ici car c'est dans une fonction)
        
        # Vérifier que le téléphone n'est pas déjà utilisé
        if User.objects.filter(telephone=value).exists():
            # .exists() : retourne True/False si la requête renvoie des résultats
            # Plus efficace que .count() > 0 ou .first() is not None
            # MySQL s'arrête dès qu'il trouve le premier résultat
            raise serializers.ValidationError(
                "Ce numéro de téléphone est déjà utilisé."
            )
            # ValidationError = DRF arrête immédiatement et retourne HTTP 400
            # avec le message d'erreur dans la réponse JSON
        
        return value
        # IMPORTANT : toujours retourner la valeur validée !
        # C'est cette valeur qui continuera dans le processus
    
    # ===========================
    # CRÉATION PERSONNALISÉE
    # ===========================
    def create(self, validated_data):
        """
        Override de la méthode create() de ModelSerializer.
        
        Par défaut, create() fait juste Employee.objects.create(**validated_data)
        Mais ici on doit :
        1. Extraire les données du User (nom, téléphone, password)
        2. Créer le User
        3. Créer l'Employee avec le User créé
        
        validated_data = dictionnaire des données validées
        (DRF a déjà vérifié que tout est correct avant d'appeler create())
        """
        
        
        # ===========================
        # ÉTAPE 1 : Extraire les données User
        # ===========================
        # .pop() extrait ET supprime la clé du dictionnaire
        # Pourquoi supprimer ? Car validated_data sera passé à Employee.objects.create()
        # Si 'nom' reste dans validated_data → Django cherchera un champ 'nom' sur Employee → Erreur
        
        nom = validated_data.pop('nom')
        # Extrait 'nom' de validated_data, il n'y est plus après
        
        telephone = validated_data.pop('telephone')
        # Même chose pour téléphone
        
        password = validated_data.pop('password', 'Restaurant2024!')
        # .pop(clé, valeur_par_défaut) : si 'password' n'existe pas → 'Restaurant2024!'
        # Sécurité supplémentaire même si le serializer a déjà un default
        
        # Déduire le rôle depuis le poste
        # La table User a un champ "role" 
        # La table Employee a un champ "poste"
        # Ils doivent être cohérents !
        poste = validated_data.get('poste', 'serveur')
        role_map = {
            # Correspondance poste → role
            'serveur': 'serveur',
            'caissier': 'caissier',
            'admin': 'admin',
        }
        role = role_map.get(poste, 'serveur')
        
        # ===========================
        # ÉTAPE 2 : Créer le User
        # ===========================
        user = User.objects.create_user(
            # create_user() : méthode de notre UserManager custom
            # Elle hash automatiquement le mot de passe (IMPORTANT !)
            # Si on utilisait User.objects.create() → mot de passe en clair → FAILLE DE SÉCURITÉ
            
            telephone=telephone,
            nom=nom,
            role=role,
            password=password,
        )
        
        # ===========================
        # ÉTAPE 3 : Créer l'Employee
        # ===========================
        employee = Employee.objects.create(
            # Maintenant validated_data ne contient plus nom, telephone, password
            # Il ne contient que les champs Employee : poste, salaire, date_embauche, etc.
            user=user,
            **validated_data,
            # ** = "unpacking" du dictionnaire
            # Équivalent à : poste=validated_data['poste'], salaire=validated_data['salaire'], etc.
        )
        
        return employee
        # On retourne l'Employee créé
        # La vue utilisera ensuite EmployeeReadSerializer pour la réponse


# ===================================================
# SERIALIZER 3 : MODIFICATION — Modifier un employé
# ===================================================
class EmployeeUpdateSerializer(serializers.ModelSerializer):
    """
    Utilisé pour les requêtes PUT et PATCH.
    
    Différence PUT vs PATCH :
    - PUT : on envoie TOUS les champs (remplacement complet)
    - PATCH : on envoie seulement les champs à modifier (mise à jour partielle)
    
    On peut modifier les infos Employee ET les infos User (nom, téléphone)
    Mais pas le mot de passe (il a son propre endpoint dans Users)
    """
    
    # Champs optionnels venant du User
    nom = serializers.CharField(max_length=100, required=False)
    telephone = serializers.CharField(max_length=20, required=False)
    
    class Meta:
        model = Employee
        fields = (
            'nom',
            'telephone',
            'poste',
            'salaire_base',
            'date_embauche',
            'statut',
            'notes',
        )
        extra_kwargs = {
            # Tous les champs sont optionnels pour la modification partielle (PATCH)
            'poste': {'required': False},
            'salaire_base': {'required': False},
            'date_embauche': {'required': False},
            'statut': {'required': False},
            'notes': {'required': False},
        }
    
    def validate_telephone(self, value):
        # Même validation que pour la création MAIS on exclut l'employé actuel
        
        
        # self.instance = l'Employee EN COURS de modification
        # Si l'instance existe (= on modifie), on exclut son propre User
        instance = self.instance
        
        queryset = User.objects.filter(telephone=value)
        
        if instance:
            # exclude() : exclut les résultats qui correspondent au filtre
            # On exclut le User de l'employé actuel
            # Pourquoi ? Si l'admin garde le même téléphone, la validation ne doit pas bloquer
            queryset = queryset.exclude(pk=instance.user.pk)
        
        if queryset.exists():
            raise serializers.ValidationError(
                "Ce numéro de téléphone est déjà utilisé par un autre employé."
            )
        
        return value
    
    def update(self, instance, validated_data):
        """
        Override de update() pour gérer les champs du User.
        
        instance = l'Employee existant (récupéré de la BDD)
        validated_data = les données validées de la requête
        """
        
        # ===========================
        # MISE À JOUR DU USER (si des données User ont été envoyées)
        # ===========================
        user = instance.user
        user_updated = False
        # Flag pour savoir si on a modifié le User
        # Évite un .save() inutile si rien n'a changé (optimisation)
        
        if 'nom' in validated_data:
            # 'in' vérifie si la clé existe dans le dictionnaire
            # On utilise 'in' et pas .get() pour distinguer :
            # - Champ non envoyé (PATCH) → on ne touche pas
            # - Champ envoyé avec valeur null → on met null (si autorisé)
            user.nom = validated_data.pop('nom')
            user_updated = True
        
        if 'telephone' in validated_data:
            user.telephone = validated_data.pop('telephone')
            user_updated = True
        
        # Synchroniser le role si le poste change
        if 'poste' in validated_data:
            role_map = {
                'serveur': 'serveur',
                'caissier': 'caissier',
                'admin': 'admin',
            }
            user.role = role_map.get(validated_data['poste'], 'serveur')
            user_updated = True
        
        if user_updated:
            user.save()
            # .save() : écrit les modifications en BDD
            # Sans .save(), les changements ne sont que en mémoire Python
        
        # ===========================
        # MISE À JOUR DE L'EMPLOYEE
        # ===========================
        # À ce point, validated_data ne contient plus nom/téléphone (pop les a retirés)
        # Il ne reste que les champs Employee
        
        for attr, value in validated_data.items():
            # .items() : itère sur les paires clé-valeur du dictionnaire
            # attr = nom du champ (ex: "salaire")
            # value = nouvelle valeur (ex: 600000)
            setattr(instance, attr, value)
            # setattr(objet, 'nom_attribut', valeur) = instance.attr = value
            # On ne peut pas faire instance.attr = value directement
            # car "attr" est une variable contenant le NOM de l'attribut
        
        instance.save()
        # Sauvegarde toutes les modifications en une seule requête SQL UPDATE
        
        return instance


# ===================================================
# SERIALIZER 4 : LISTE SIMPLIFIÉE (pour les dropdowns)
# ===================================================
class EmployeeListSimpleSerializer(serializers.ModelSerializer):
    """
    Version ultra-légère pour les listes déroulantes.
    Utilisé quand on a besoin de juste : id + nom + poste
    Ex: pour créer un planning, on choisit l'employé dans une liste
    On n'a pas besoin de tout le détail.
    
    Pourquoi ? Performance !
    Sur une connexion lente (Guinée), envoyer 50 employés avec tous
    leurs détails = payload lourd.
    Avec ce serializer : payload minimal.
    """
    
    nom = serializers.SerializerMethodField()
    poste_label = serializers.SerializerMethodField()
    
    class Meta:
        model = Employee
        fields = ('id', 'nom', 'poste', 'poste_label', 'statut')
    
    def get_nom(self, obj):
        return obj.user.nom
    
    def get_poste_label(self, obj):
        return obj.get_poste_display()