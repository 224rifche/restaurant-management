# ===========================
# ÉTAPE 1 : Image de base
# ===========================
FROM node:20-alpine
# "node:20" = Node.js version 20 (LTS)
# "alpine" = version ultra-légère basée sur Alpine Linux (50MB vs 300MB)
# Parfait pour Next.js en développement

# ===========================
# ÉTAPE 2 : Dossier de travail
# ===========================
WORKDIR /app
# Même principe que le backend - tout se passe dans /app

# ===========================
# ÉTAPE 3 : Dépendances Node
# ===========================
COPY package*.json ./
# Copie package.json ET package-lock.json (le * couvre les deux)
# Même stratégie de cache que le backend :
# les dépendances changent rarement → on les installe en premier

RUN npm install
# Installe toutes les dépendances listées dans package.json
# Crée le dossier node_modules (ignoré par .gitignore)

# ===========================
# ÉTAPE 4 : Copier le code
# ===========================
COPY . .
# Copie tout le code frontend dans le container

# ===========================
# ÉTAPE 5 : Port exposé
# ===========================
EXPOSE 3000
# Next.js tourne sur le port 3000 par défaut

# ===========================
# ÉTAPE 6 : Commande de démarrage
# ===========================
CMD ["npm", "run", "dev"]
# Lance Next.js en mode développement
# Hot reload activé : les changements de code sont visibles immédiatement