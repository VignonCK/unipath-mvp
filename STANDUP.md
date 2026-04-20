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

## Standup — 10 Avril 2026

### Qu'ai-je fait hier ?
- frontend jour 1-2 et documentation pour la modélisation UML

### Que vais-je faire aujourd'hui ?
- Créé et exécuté les seeds de test (3 concours, 5 candidats, inscriptions)
- Configuré le bucket Supabase Storage `dossiers-candidats`
- Mis en place les politiques d'accès RLS (upload et lecture)
- Mis à jour DATABASE.md avec les sections Seeds et Storage
- Diagramme des cas d'utilisation

### Ai-je un blocage ?
Aucun blocage pour le moment.

## Jour 5 — Harry (Backend)

**Qu'est-ce que j'ai fait ?**
- Implémenté le middleware d'authentification JWT
- Créé toutes les routes : candidat, concours, inscription, commission, dossier
- Configuré l'upload de fichiers avec Multer vers Supabase Storage
- Testé et validé toutes les routes avec Postman et Thunder Client

**Statut**
- Backend 100% terminé et pushé sur le repo

**Blocages rencontrés**
- Problème de synchronisation entre Supabase Auth et la table Candidat → résolu manuellement
- Upload fichier difficile avec Thunder Client → résolu avec Postman

## Jours 6-7 — Harry (Backend)

**Qu'est-ce que j'ai fait ?**
- Intégré la route DGES (GET /api/dges/statistiques)
- Configuré Resend pour les emails de notification validation/rejet
- Créé le service de génération PDF (convocation avec couleurs du Bénin, drapeau et logo MESRS)
- Ajouté la route GET /api/candidats/convocation/:id avec vérification propriétaire

**Blocages rencontrés**
- Connexion Supabase pooler instable → en cours de résolution
- dotenvx interceptait le .env → résolu par lecture manuelle