# Restaurant Management System

Systeme de gestion de restaurant pour les etablissements locaux en Guinee.

## Stack Technique

| Couche | Technologie |
|--------|------------|
| Backend | Django 4.2 + Django REST Framework |
| Frontend | Next.js 20 (App Router) |
| Base de donnees | MySQL 8.0 |
| Conteneurisation | Docker + Docker Compose |
| Monitoring | Grafana + Loki + Tempo + Mimir |

## Roles utilisateurs

- **Admin** - Gestion complete du systeme
- **Caissier** - Supervision presences et rapports
- **Serveur** - Pointage (affecte en salle ou cuisine selon planning)

## Lancer le projet en developpement

### 1. Cloner le repo
\\\ash
git clone https://github.com/TON_USERNAME/restaurant-management.git
cd restaurant-management
\\\

### 2. Copier les variables d'environnement
\\\ash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
\\\

### 3. Lancer Docker
\\\ash
cd infra
docker compose up --build
\\\

### 4. Acceder aux services
- Frontend : http://localhost:3000
- Backend API : http://localhost:8000/api
- Admin Django : http://localhost:8000/admin

## Structure du projet

\\\
restaurant-management/
├── backend/      - API Django REST Framework
├── frontend/     - Interface Next.js
├── infra/        - Docker + Monitoring
└── docs/         - Documentation
\\\

## Workflow Git

- main        - Production uniquement
- develop     - Branche d'integration
- feature/xxx - Nouvelles fonctionnalites
- hotfix/xxx  - Corrections urgentes

## Convention des commits

- feat:     nouvelle fonctionnalite
- fix:      correction de bug
- chore:    tache technique
- docs:     documentation
- refactor: amelioration du code