# STANDUP.md — Journal quotidien UniPath

## Jour 1 — [06 Avril 2026]

### Vignon — DB Architect
- Fait hier : /
- Aujourd'hui : Créer projet Supabase + schéma Prisma
- Blocages : aucun

### Harry — Backend / API
- Fait hier : /
- Aujourd'hui : Initialiser projet Express + configurer Supabase Auth
- Blocages : aucun

### Adébayor — Frontend
- Fait hier : /
- Aujourd'hui : Initialiser React + Vite + Tailwind + pages squelettes
- Blocages : aucun

## Jour 2 — [07 Avril 2026]

### Vignon — DB Architect
- Fait hier : Création du projet Supabase, rédaction du schéma Prisma, configuration de la connexion à la base de données.
- Aujourd'hui : Implémentation des triggers PostgreSQL
- Blocages : La récupération du bon url de connexion à la base de données Supabase a été un peu laborieuse, mais c’est réglé.

## Jour 2 — Harry (Backend)[07 avril 2026]

Qu'est-ce que j'ai fait ?
- Créé la structure du serveur Express (server.js, app.js)
- Configuré Supabase Auth avec les routes /register et /login
- Créé les dossiers src/routes, src/controllers, src/middleware
- Résolu le problème de chargement du fichier .env
- Pushé tout le code sur le repo GitHub

Blocages rencontrés
- dotenvx interceptait le chargement du .env → résolu en lecture manuelle
- Fichier .env mal nommé (unipath.env) → renommé en .env

# STANDUP — UniPath Frontend

## Jour 1-2 — Adébayor

### Qu'ai-je fait ?
- Créé le projet React avec Vite
- Installé et configuré Tailwind CSS v4
- Installé React Router
- Créé la structure des dossiers (pages, components, services)
- Configuré les routes dans App.jsx
- Créé les 4 pages squelettes (Login, Register, DashboardCandidat, DashboardCommission)
- Créé le service API (api.js) et le fichier .env

### Que vais-je faire demain ?
- Implémenter le formulaire Register complet
- Connecter Login à l'API backend
- Implémenter les routes protégées avec ProtectedRoute

### Blocages
- Aucun blocage pour l'instant