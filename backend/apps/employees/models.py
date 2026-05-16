# ===========================
# IMPORTS
# ===========================
import uuid
# uuid = Universally Unique Identifier
# C'est une bibliothèque Python standard (pas besoin de pip install)
# Elle génère des identifiants uniques comme : "a1b2c3d4-e5f6-..."
# On l'utilise comme clé primaire pour éviter les IDs prévisibles (1, 2, 3...)
# Sécurité : avec un ID numérique, un attaquant peut deviner /api/employees/1
# Avec UUID : /api/employees/a1b2c3d4... → impossible à deviner

from django.db import models
# models = le module central de Django pour définir les tables BDD
# Chaque classe Python qui hérite de models.Model = une table MySQL
# Chaque attribut de classe = une colonne dans la table

from django.conf import settings
# settings = accès à notre fichier config/settings.py
# On l'utilise pour référencer AUTH_USER_MODEL (notre modèle User custom)
# C'est TOUJOURS mieux que d'importer directement le modèle User
# Pourquoi ? Évite les problèmes d'import circulaire
# (employees importe User, User importe employees → boucle infinie)


# ===========================
# CHOIX CONSTANTS
# ===========================
# En Python, on définit les choix HORS de la classe
# pour les réutiliser ailleurs si besoin (serializers, tests, etc.)

POSTE_CHOICES = [
    ('serveur', 'Serveur / Serveuse'),
    ('caissier', 'Caissier / Caissière'),
    ('cuisine', 'Cuisinier / Cuisine'),
    ('admin', 'Administrateur'),
]

STATUT_CHOICES = [
    ('actif', 'Actif'),
    # L'employé travaille actuellement au restaurant
    
    ('demission', 'Demission'),
    # L'employé ne travaille plus (congé, renvoi, démission)
    # On ne SUPPRIME JAMAIS vraiment un employé de la BDD
    # Pourquoi ? Historique des pointages, des plannings
    # Si on supprime l'employé, on perd toutes ses données liées
    # → On préfère le marquer "inactif"
    # C'est le pattern "soft delete" (suppression douce)
    
    ('renvoi', 'Renvoi'),
    # L'employé est renvoyé
    # Différent de "demission" : il reviendra pas

    ('conge', 'En congé' ),
    # L'employé est en congé
    # Différent de "inactif" : il reviendra

]


# ===========================
# MODÈLE EMPLOYEE
# ===========================
class Employee(models.Model):
    """
    Le modèle Employee représente un employé du restaurant.
    
    Relation avec User :
    - Un Employee EST AUSSI un User (il peut se connecter)
    - Un User peut exister SANS être un Employee (ex: un admin système)
    - La relation est OneToOne : 1 User = 1 Employee maximum
    
    Pourquoi séparer User et Employee ?
    - User gère l'AUTHENTIFICATION (téléphone, mot de passe, token JWT)
    - Employee gère les DONNÉES MÉTIER (salaire, poste, contrat)
    - Séparation des responsabilités : chaque table a UN rôle clair
    - Évolutivité : on peut ajouter des données RH sans toucher à l'auth
    
    Exemple concret :
    User : { telephone: "622...", password: "hash...", role: "serveur" }
    Employee : { user: <User>, salaire: 500000, date_embauche: "2024-01-01" }
    """
    
    # ===========================
    # CLÉ PRIMAIRE
    # ===========================
    id = models.UUIDField(
        primary_key=True,
        # primary_key=True : c'est L'identifiant unique de cette ligne
        # Django ne créera PAS de colonne "id" automatique car on la définit
        
        default=uuid.uuid4,
        # default : valeur automatique si rien n'est fourni
        # uuid.uuid4 : la FONCTION (sans parenthèses !)
        # Django appellera uuid.uuid4() à chaque nouveau Employee
        # Si on écrivait uuid.uuid4() AVEC parenthèses → un seul UUID pour tous
        
        editable=False,
        # editable=False : non modifiable dans les formulaires admin
        # L'ID ne doit JAMAIS changer une fois créé (intégrité référentielle)
    )
    
    # ===========================
    # RELATION AVEC USER
    # ===========================
    user = models.OneToOneField(
        # OneToOneField = relation 1-à-1 stricte
        # Un User ne peut avoir qu'UN seul Employee associé
        # Un Employee ne peut appartenir qu'à UN seul User
        # Si on essaie de créer 2 Employee pour le même User → erreur BDD
        
        settings.AUTH_USER_MODEL,
        # settings.AUTH_USER_MODEL = 'users.User' (défini dans settings.py)
        # C'est la façon CORRECTE de référencer notre User custom
        # Évite l'import direct : from apps.users.models import User
        
        on_delete=models.CASCADE,
        # on_delete = que faire si le User parent est supprimé ?
        # CASCADE = supprimer l'Employee aussi
        # Logique : si on supprime le compte User, l'employé n'a plus de sens
        # Alternatives :
        # - models.PROTECT : empêche la suppression (lève une erreur)
        # - models.SET_NULL : met null (si on autorisait null)
        # - models.SET_DEFAULT : met la valeur par défaut
        
        related_name='employee',
        # related_name = comment accéder à Employee depuis User
        # Sans ça : user.employee_set.get()  → pas intuitif
        # Avec ça : user.employee  → clair et simple
        # OneToOne → pas de "set" (1 seul), accès direct
        
        verbose_name='Utilisateur associé',
        # verbose_name = étiquette dans l'interface admin
    )
    
    # ===========================
    # DONNÉES MÉTIER
    # ===========================
    poste = models.CharField(
        # CharField = colonne texte à longueur maximale définie
        
        max_length=20,
        # max_length : obligatoire pour CharField
        # MySQL créera une colonne VARCHAR(20)
        
        choices=POSTE_CHOICES,
        # choices : liste les valeurs valides
        # Django valide que la valeur est dans la liste
        # L'admin affiche un menu déroulant au lieu d'un champ texte libre
        
        default='serveur',
        # Valeur par défaut si rien n'est fourni
        # La plupart des nouveaux employés sont des serveurs
        
        verbose_name='Poste',
    )
    
    
    date_embauche = models.DateField(
        # DateField = date sans heure (YYYY-MM-DD en BDD)
        # Différent de DateTimeField qui stocke aussi l'heure
        # Pour une date d'embauche, l'heure n'a pas de sens
        
        null=True,
        blank=True,
        # Optionnel : on ne connaît pas toujours la date exacte
        
        verbose_name="Date d'embauche",
    )
    
    date_embauche = models.DateField(
        null=True,
        blank=True,
        verbose_name="Date d'embauche",
    )
    
    statut = models.CharField(
        max_length=10,
        choices=STATUT_CHOICES,
        default='actif',
        # Par défaut actif : un employé qu'on crée travaille
        verbose_name='Statut',
    )
    
    notes = models.TextField(
        # TextField = texte long sans limite de longueur
        # Différent de CharField qui a une limite max_length
        # Utilisé pour les commentaires, remarques libres
        # Ex: "Allergique aux produits ménagers", "Parle anglais"
        
        null=True,
        blank=True,
        verbose_name='Notes internes',
        help_text='Informations complémentaires sur cet employé'
        # help_text : texte d'aide affiché sous le champ dans l'admin
    )
    
    # ===========================
    # MÉTADONNÉES TEMPORELLES
    # ===========================
    inserted_at = models.DateTimeField(
        auto_now_add=True,
        # auto_now_add=True : Django remplit automatiquement ce champ
        # avec la date/heure COURANTE lors de la CRÉATION
        # Ne peut JAMAIS être modifié ensuite
        # Parfait pour "date de création"
        verbose_name='Créé le',
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        # auto_now=True : Django met à jour ce champ
        # à CHAQUE sauvegarde (.save())
        # Différent de auto_now_add qui ne le fait qu'à la création
        # Parfait pour "dernière modification"
        verbose_name='Modifié le',
    )
    
    # ===========================
    # MÉTADONNÉES DU MODÈLE
    # ===========================
    class Meta:
        # Meta = classe interne pour configurer le modèle lui-même
        # (pas les colonnes, mais le comportement du modèle)
        
        db_table = 'employees'
        # db_table : nom exact de la table MySQL
        # Sans ça, Django nomme : "apps_employees_employee" (moche)
        # Avec ça : "employees" (propre)
        
        verbose_name = 'Employé'
        verbose_name_plural = 'Employés'
        # Ces noms s'affichent dans l'interface admin Django
        
        ordering = ['-inserted_at']
        # ordering : tri par défaut des requêtes
        # '-inserted_at' = les plus récents EN PREMIER (le "-" = DESC)
        # Sans ça, l'ordre est aléatoire (selon l'ordre d'insertion BDD)
        
        indexes = [
            # indexes : accélère les recherches fréquentes
            # Sans index : MySQL lit TOUTE la table pour trouver (lent)
            # Avec index : MySQL saute directement à l'entrée (rapide)
            
            models.Index(fields=['statut'], name='idx_employee_statut'),
            # On filtre souvent par statut (actif/inactif)
            # Ex: "donne-moi tous les employés actifs"
            
            models.Index(fields=['poste'], name='idx_employee_poste'),
            # On filtre souvent par poste
            # Ex: "donne-moi tous les serveurs"
        ]
    
    class JSONAPIMeta:
        resource_name = "employees"

    # ===========================
    # MÉTHODES DU MODÈLE
    # ===========================
    def __str__(self):
        # __str__ = représentation textuelle de l'objet
        # Python l'appelle quand on fait str(employee) ou print(employee)
        # Django l'utilise dans l'admin pour afficher l'objet dans les listes
        return f"{self.user.nom} — {self.get_poste_display()}"
        # self.user.nom : accède au nom via la relation OneToOne
        # self.get_poste_display() : méthode AUTOMATIQUE de Django
        # Pour chaque CharField avec choices, Django génère get_CHAMP_display()
        # get_poste_display() retourne le LABEL, pas la valeur BDD
        # Ex: 'serveur' → 'Serveur / Serveuse'
    
    @property
    def nom(self):
        # @property = propriété calculée (pas une colonne BDD)
        # On peut appeler employee.nom comme si c'était un champ
        # Mais ça exécute en réalité cette fonction
        # Utile pour simplifier l'accès dans les serializers/vues
        return self.user.nom
    
    @property
    def telephone(self):
        # Même pattern : accès facile au téléphone
        return self.user.telephone
    
    @property
    def is_actif(self):
        # Propriété booléenne pratique pour les vérifications
        return self.statut == 'actif'