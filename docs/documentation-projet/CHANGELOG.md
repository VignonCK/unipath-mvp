# Changelog

Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté
- Configuration initiale du projet
- Architecture backend avec Express + Prisma
- Architecture frontend avec React + Vite
- Système d'authentification (login, register)
- Gestion des inscriptions aux concours
- Upload de pièces justificatives
- Dashboard candidat
- Dashboard commission
- Dashboard DGES avec statistiques
- Génération de PDF (convocations, préinscriptions)
- Système de validation avec Zod
- Middleware de gestion d'erreurs
- Logger personnalisé
- Configuration centralisée
- Tests unitaires avec Jest
- CI/CD avec GitHub Actions
- Documentation API complète
- Guide de contribution
- Politique de sécurité

### Sécurité
- Validation des inputs avec Zod
- Gestion des erreurs sans exposition de stack traces en production
- Variables d'environnement pour les secrets
- CORS configuré

## [1.0.0] - 2026-04-29

### Ajouté
- Version initiale du MVP UniPath
- Fonctionnalités de base pour candidats, commission et DGES

---

## Types de changements

- `Ajouté` — Nouvelles fonctionnalités
- `Modifié` — Changements dans les fonctionnalités existantes
- `Déprécié` — Fonctionnalités qui seront supprimées
- `Supprimé` — Fonctionnalités supprimées
- `Corrigé` — Corrections de bugs
- `Sécurité` — Corrections de vulnérabilités
