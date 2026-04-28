# ===========================
# ÉTAPE 1 : Image de base
# ===========================
FROM python:3.12-slim
# "FROM" = on part d'une image existante comme base
# "python:3.12-slim" = Python 3.12 sur une version allégée de Linux (Debian)
# "slim" = sans les outils inutiles → image plus légère (300MB vs 1GB)

# ===========================
# ÉTAPE 2 : Variables d'environnement système
# ===========================
ENV PYTHONDONTWRITEBYTECODE=1
# Empêche Python de créer des fichiers .pyc (bytecode compilé)
# Ces fichiers sont inutiles dans un container

ENV PYTHONUNBUFFERED=1
# Force Python à afficher les logs immédiatement
# Sans ça, les logs apparaissent avec du retard dans Docker

# ===========================
# ÉTAPE 3 : Dossier de travail
# ===========================
WORKDIR /app
# Crée et définit /app comme dossier de travail dans le container
# Toutes les commandes suivantes s'exécutent depuis /app

# ===========================
# ÉTAPE 4 : Dépendances système
# ===========================
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*
# "apt-get" = gestionnaire de paquets Linux (comme pip mais pour le système)
# "gcc" = compilateur C, nécessaire pour compiler mysqlclient
# "default-libmysqlclient-dev" = headers MySQL pour la compilation
# "pkg-config" = outil pour trouver les bibliothèques système
# "rm -rf /var/lib/apt/lists/*" = nettoie le cache apt → image plus légère

# ===========================
# ÉTAPE 5 : Dépendances Python
# ===========================
COPY requirements.txt .
# Copie SEULEMENT requirements.txt en premier (avant le reste du code)
# Pourquoi ? Optimisation du cache Docker :
# Si le code change mais pas requirements.txt,
# Docker réutilise le cache de "pip install" → build beaucoup plus rapide

RUN pip install --upgrade pip && pip install -r requirements.txt
# "pip install --upgrade pip" = met à jour pip lui-même
# "pip install -r requirements.txt" = installe toutes nos dépendances

# ===========================
# ÉTAPE 6 : Copier le code
# ===========================
COPY . .
# Maintenant on copie tout le reste du code
# Le point source = tout dans le dossier backend/
# Le point destination = /app dans le container

# ===========================
# ÉTAPE 7 : Port exposé
# ===========================
EXPOSE 8000
# Documente que le container écoute sur le port 8000
# C'est informatif - docker-compose fera le vrai mapping

# ===========================
# ÉTAPE 8 : Commande de démarrage
# ===========================
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
# Commande exécutée quand le container démarre
# "0.0.0.0" = écouter sur toutes les interfaces réseau
# Sans ça, Django n'est accessible que depuis l'intérieur du container