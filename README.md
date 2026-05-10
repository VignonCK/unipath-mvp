# 🎓 UniPath - Plateforme de Gestion des Concours Universitaires

[![Version](https://img.shields.io/badge/version-2.0-blue.svg)](https://github.com/your-repo/unipath)
[![Status](https://img.shields.io/badge/status-production%20ready-green.svg)](https://github.com/your-repo/unipath)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> Plateforme complète de gestion des inscriptions, dossiers et validations pour les concours universitaires.

---

## 📋 Table des Matières

- [Vue d'ensemble](#-vue-densemble)
- [Fonctionnalités](#-fonctionnalités)
- [Technologies](#-technologies)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Utilisation](#-utilisation)
- [Tests](#-tests)
- [Documentation](#-documentation)
- [Corrections Récentes](#-corrections-récentes)
- [Contribution](#-contribution)
- [Support](#-support)
- [Licence](#-licence)

---

## 🎯 Vue d'ensemble

UniPath est une plateforme web moderne qui digitalise et automatise la gestion complète des concours universitaires :

- ✅ **Inscription en ligne** des candidats avec validation ANIP
- ✅ **Gestion des dossiers** avec upload de pièces justificatives
- ✅ **Workflow de validation** Commission → Contrôleur → DGES
- ✅ **Système de notifications** en temps réel
- ✅ **Génération automatique** de matricules, convocations et attestations
- ✅ **Tableau de bord** pour chaque rôle (Candidat, Commission, Contrôleur, DGES)

**Version actuelle :** 2.0 (8 Mai 2026)  
**Statut :** ✅ Production Ready

---

## ✨ Fonctionnalités

### Pour les Candidats
- 📝 Inscription en ligne avec validation ANIP (12 chiffres)
- 📋 Génération automatique du matricule (format: **UnP-2026-000001**)
- 📧 Confirmation d'email obligatoire
- 📁 Upload de pièces justificatives (PDF, JPEG, PNG)
- 📊 Suivi de complétude du dossier en temps réel
- 🔔 Notifications de changement de statut
- 📄 Téléchargement de convocations et attestations

### Pour la Commission
- 👥 Consultation des dossiers EN_ATTENTE
- ✅ Validation/Rejet/Mise sous réserve des candidats
- 📝 Attribution de notes
- 📊 Consultation du classement (avec `?role=COMMISSION`)
- 📧 Envoi de notifications aux candidats
- 📈 Statistiques de complétude des dossiers

### Pour le Contrôleur
- 🔍 Consultation des dossiers VALIDE_PAR_COMMISSION
- ✅ Confirmation/Modification des décisions de la commission
- 📜 Consultation de l'historique complet des dossiers
- 📊 Accès aux statistiques globales
- 📧 Envoi de notifications finales

### Pour le DGES
- 🎛️ Accès complet à tous les dossiers
- 📊 Rapports d'audit et exports CSV
- 🎓 Gestion des concours (création, modification, suppression)
- 📧 Envoi de notifications système
- 📈 Tableaux de bord et statistiques avancées

---

## 🛠️ Technologies

### Backend
- **Node.js** v18+ avec Express.js
- **PostgreSQL** avec Prisma ORM
- **Supabase** pour l'authentification
- **Nodemailer** pour les emails
- **Redis** (optionnel) pour les notifications temps réel

### Frontend
- **React** v18+ avec Vite
- **TailwindCSS** pour le styling
- **React Router** pour la navigation
- **Axios** pour les appels API

### Outils
- **Prisma** pour les migrations de base de données
- **ESLint** pour la qualité du code
- **Jest** pour les tests (optionnel)

---

## 🚀 Installation

### Prérequis
- Node.js v18 ou supérieur
- PostgreSQL v14 ou supérieur
- npm ou yarn
- Compte Supabase (gratuit)

### Étapes d'installation

```bash
# 1. Cloner le projet
git clone https://github.com/your-repo/unipath.git
cd unipath

# 2. Installer les dépendances backend
cd unipath-api
npm install

# 3. Installer les dépendances frontend
cd ../unipath-front
npm install

# 4. Retour à la racine
cd ..
```

---

## ⚙️ Configuration

### 1. Backend (.env)

Créer un fichier `.env` dans `unipath-api/` :

```bash
# Base de données
DATABASE_URL="postgresql://user:password@host:5432/database"

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Serveur
PORT=3001

# Matricule (configurable par site)
SITE_CODE=UnP

# Frontend
FRONTEND_URL=http://localhost:5173
APP_URL=http://localhost:5173

# Email (Gmail recommandé)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
```

### 2. Frontend (.env.local)

Créer un fichier `.env.local` dans `unipath-front/` :

```bash
VITE_API_URL=http://localhost:3001
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Base de données

```bash
cd unipath-api

# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate deploy

# (Optionnel) Seed la base de données
npx prisma db seed
```

---

## 🎮 Utilisation

### Démarrage en développement

```bash
# Terminal 1 - Backend
cd unipath-api
npm run dev
# → http://localhost:3001

# Terminal 2 - Frontend
cd unipath-front
npm run dev
# → http://localhost:5173
```

### Démarrage en production

```bash
# Backend
cd unipath-api
npm run build
npm run start

# Frontend
cd unipath-front
npm run build
# → Déployer le dossier dist/
```

### Accès à l'application

- **Frontend :** http://localhost:5173
- **Backend API :** http://localhost:3001
- **Prisma Studio :** `npx prisma studio` (http://localhost:5555)

---

## 🧪 Tests

### Tests automatisés

```bash
cd unipath-api

# Test système de matricule
node test-matricule.js
# → 10/10 tests passés ✅

# Test routes de sécurité
node test-routes-securite.js
# → 28/28 tests passés ✅

# Test workflow statuts
node test-statuts-workflow.js
# → Tous les statuts vérifiés ✅
```

### Tests manuels

1. **Inscription candidat**
   - Ouvrir http://localhost:5173/register
   - Remplir le formulaire avec un ANIP valide (12 chiffres)
   - Vérifier l'email de confirmation
   - Confirmer l'email et se connecter

2. **Workflow Commission → Contrôleur**
   - Se connecter en tant que COMMISSION
   - Valider un candidat et attribuer une note
   - Se connecter en tant que CONTROLEUR
   - Confirmer la décision
   - Vérifier l'email envoyé au candidat

3. **Gestion des pièces**
   - Se connecter en tant que CANDIDAT
   - Créer une inscription et uploader la quittance
   - Uploader les pièces du dossier
   - Vérifier le calcul de complétude

---

## 📚 Documentation

### Documentation Complète

Toute la documentation est disponible dans `docs/documentation-projet/` :

- 📖 **[Index Complet](./docs/documentation-projet/INDEX_COMPLET.md)** - Navigation complète
- 🚀 **[Guide de Démarrage Rapide](./docs/documentation-projet/GUIDE_DEMARRAGE_RAPIDE.md)** - Démarrer en 5 minutes
- 📋 **[Récapitulatif Final](./docs/documentation-projet/RECAP_CORRECTIONS_FINALES.md)** - Toutes les corrections
- 🏗️ **[Architecture](./docs/documentation-projet/ARCHITECTURE.md)** - Architecture du système

### Documentation par Catégorie

**Corrections Appliquées :**
- [Corrections Sécurité Complète](./docs/documentation-projet/CORRECTIONS_SECURITE_COMPLETE.md) - Backend contrôleurs
- [Corrections Routes Sécurité](./docs/documentation-projet/CORRECTIONS_ROUTES_SECURITE.md) - Backend routes
- [Corrections Frontend](./docs/documentation-projet/CORRECTIONS_FRONTEND_INCOHERENCES.md) - Frontend

**Configuration :**
- [Variables d'Environnement](./docs/documentation-projet/configuration/ENV_VARIABLES.md)
- [Configuration Email](./docs/documentation-projet/configuration/EMAIL_CONFIRMATION_CONFIG.md)
- [Configuration URLs](./docs/documentation-projet/configuration/URL_CONFIGURATION.md)

**Guides Utilisateur :**
- [Guide Commission](./docs/documentation-projet/guides/GUIDE_UTILISATION_COMMISSION.md)
- [Guide Test Rapide](./docs/documentation-projet/guides/GUIDE_TEST_RAPIDE.md)
- [Instructions Test](./docs/documentation-projet/guides/INSTRUCTIONS_TEST.md)

---

## ✅ Corrections Récentes

### Version 2.0 (8 Mai 2026)

**35 corrections appliquées** avec succès :

#### Backend Contrôleurs (12 corrections)
- ✅ 5 bugs critiques corrigés (statuts, classement, actions)
- ✅ 4 avertissements de sécurité corrigés
- ✅ 3 améliorations implémentées

#### Backend Routes (11 corrections)
- ✅ 4 bugs de sécurité corrigés (notifications, classement, doublons)
- ✅ 4 avertissements corrigés (checkRole, CONTROLEUR)
- ✅ 3 nettoyages effectués (imports morts, logique inline)

#### Frontend (8 corrections)
- ✅ 3 problèmes critiques corrigés (IDs pièces, formats, quittance)
- ✅ 2 problèmes de sécurité corrigés (Bearer token, rôles)
- ✅ 3 dettes techniques résolues (systèmes dupliqués)

#### Système Matricule (4 corrections)
- ✅ Format configurable : **UnP-2026-000001**
- ✅ Année académique automatique
- ✅ Numéro séquentiel avec compteur
- ✅ Intégration dans l'inscription

**Détails complets :** [Récapitulatif Final](./docs/documentation-projet/RECAP_CORRECTIONS_FINALES.md)

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment contribuer :

1. **Fork** le projet
2. **Créer** une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. **Commit** vos changements (`git commit -m 'Add some AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrir** une Pull Request

### Guidelines

- Suivre les conventions de code existantes
- Ajouter des tests pour les nouvelles fonctionnalités
- Mettre à jour la documentation si nécessaire
- Utiliser des commits descriptifs avec emojis

**Guide complet :** [Contributing](./docs/documentation-projet/CONTRIBUTING.md)

---

## 📞 Support

### En cas de problème

1. **Consulter la documentation** dans `docs/documentation-projet/`
2. **Vérifier les logs** avec les emojis pour identifier l'erreur
3. **Exécuter les tests** pour valider le système
4. **Ouvrir une issue** sur GitHub avec :
   - Description du problème
   - Étapes pour reproduire
   - Logs d'erreur
   - Environnement (OS, Node version, etc.)

### Ressources Utiles

- 📖 [Documentation Complète](./docs/documentation-projet/INDEX_COMPLET.md)
- 🚀 [Guide de Démarrage Rapide](./docs/documentation-projet/GUIDE_DEMARRAGE_RAPIDE.md)
- 🐛 [Bugs Résolus](./docs/documentation-projet/BUGS_CRITIQUES_RESOLUS.md)
- 📧 [Configuration Email](./docs/documentation-projet/configuration/EMAIL_CONFIRMATION_CONFIG.md)

### Liens Externes

- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Express Documentation](https://expressjs.com)

---

## 📊 Statistiques du Projet

| Métrique | Valeur |
|----------|--------|
| **Corrections appliquées** | 35 |
| **Fichiers créés** | 6 |
| **Fichiers modifiés** | 23 |
| **Fonctions utilitaires** | 31 |
| **Scripts de test** | 3 |
| **Taux de réussite tests** | 100% |
| **Bugs critiques** | 0 |
| **Avertissements sécurité** | 0 |

---

## 🏆 Fonctionnalités Clés

### Sécurité
- 🔒 Authentification avec Supabase
- 🔐 Contrôle d'accès par rôle (RBAC)
- 🛡️ Protection CSRF et XSS
- 🔑 Tokens JWT avec expiration
- 📧 Confirmation d'email obligatoire

### Performance
- ⚡ API REST optimisée
- 🚀 Chargement lazy des composants
- 💾 Cache Redis (optionnel)
- 📦 Build optimisé avec Vite

### Expérience Utilisateur
- 🎨 Interface moderne avec TailwindCSS
- 📱 Design responsive (mobile-first)
- 🔔 Notifications en temps réel
- 📊 Tableaux de bord interactifs
- ✅ Validation en temps réel des formulaires

---

## 📅 Roadmap

### Version 2.1 (Prochaine)
- [ ] Système de chat en temps réel
- [ ] Export PDF des dossiers complets
- [ ] Statistiques avancées avec graphiques
- [ ] API publique avec documentation Swagger
- [ ] Tests E2E avec Playwright

### Version 3.0 (Future)
- [ ] Application mobile (React Native)
- [ ] Système de paiement en ligne
- [ ] Intégration avec d'autres universités
- [ ] IA pour détection de fraude
- [ ] Blockchain pour certification

---

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 👥 Équipe

Développé avec ❤️ par l'équipe UniPath

- **Lead Developer** - [Votre Nom](https://github.com/your-username)
- **Backend Developer** - [Nom](https://github.com/username)
- **Frontend Developer** - [Nom](https://github.com/username)
- **UI/UX Designer** - [Nom](https://github.com/username)

---

## 🙏 Remerciements

- [Prisma](https://www.prisma.io/) pour l'ORM
- [Supabase](https://supabase.com/) pour l'authentification
- [TailwindCSS](https://tailwindcss.com/) pour le styling
- [React](https://react.dev/) pour le framework frontend
- [Express](https://expressjs.com/) pour le framework backend

---

## 📞 Contact

- **Email :** support@unipath.com
- **Website :** https://unipath.com
- **GitHub :** https://github.com/your-repo/unipath
- **Twitter :** [@UniPathApp](https://twitter.com/UniPathApp)

---

<div align="center">

**⭐ Si ce projet vous a aidé, n'hésitez pas à lui donner une étoile ! ⭐**

[![GitHub stars](https://img.shields.io/github/stars/your-repo/unipath?style=social)](https://github.com/your-repo/unipath/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/your-repo/unipath?style=social)](https://github.com/your-repo/unipath/network/members)
[![GitHub watchers](https://img.shields.io/github/watchers/your-repo/unipath?style=social)](https://github.com/your-repo/unipath/watchers)

**Fait avec ❤️ pour l'éducation**

</div>
