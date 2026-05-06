# 🆔 Intégration ANIP - Guide de démarrage rapide

## 📖 Qu'est-ce que l'ANIP ?

L'**ANIP** (Numéro Personnel d'Identification) est un code unique à **12 chiffres** attribué à chaque citoyen béninois enregistré au Registre National des Personnes Physiques (RNPP). Il sert d'identifiant unique pour l'accès aux services publics en ligne.

## 🎯 Objectif

Intégrer l'ANIP comme identifiant unique obligatoire pour tous les candidats de la plateforme UniPath.

## 📁 Structure des fichiers

```
📦 Projet UniPath
├── 📄 README_ANIP.md                          ← Vous êtes ici (Guide de démarrage)
├── 📄 INTEGRATION_ANIP.md                     ← Documentation technique complète
├── 📄 MIGRATION_ANIP.md                       ← Guide de migration DB
├── 📄 ANIP_IMPLEMENTATION_SUMMARY.md          ← Résumé de l'implémentation
├── 📄 ANIP_CHECKLIST.md                       ← Checklist de déploiement
├── 📄 ANIP_RAPPORT_FINAL.md                   ← Rapport final complet
│
├── 📂 unipath-api/
│   ├── 📂 src/
│   │   └── 📂 controllers/
│   │       └── 📄 auth.controller.js          ← Validation ANIP ajoutée
│   ├── 📂 prisma/
│   │   └── 📄 schema.prisma                   ← Contrainte unique + index
│   ├── 📂 tests/
│   │   └── 📄 anip.test.js                    ← Suite de tests complète
│   └── 📂 scripts/
│       ├── 📄 anip-utils.js                   ← Utilitaires de gestion
│       └── 📄 README_ANIP_UTILS.md            ← Documentation utilitaires
│
└── 📂 unipath-front/
    └── 📂 src/
        └── 📂 pages/
            └── 📄 Register.jsx                 ← Champ ANIP amélioré
```

## 🚀 Démarrage rapide

### 1. Comprendre les changements

**Lisez d'abord :**
1. 📄 `README_ANIP.md` (ce fichier) - Vue d'ensemble
2. 📄 `ANIP_IMPLEMENTATION_SUMMARY.md` - Résumé des changements
3. 📄 `INTEGRATION_ANIP.md` - Détails techniques

### 2. Vérifier l'état actuel

```bash
cd unipath-api

# Statistiques sur les ANIP
node scripts/anip-utils.js stats

# Lister les candidats sans ANIP
node scripts/anip-utils.js sans-anip

# Valider les ANIP existants
node scripts/anip-utils.js valider
```

### 3. Exécuter les tests

```bash
cd unipath-api

# Tests ANIP uniquement
npm test -- anip.test.js

# Tous les tests
npm test
```

### 4. Appliquer la migration

```bash
cd unipath-api

# Backup de la base de données
pg_dump -U postgres -d unipath > backup_$(date +%Y%m%d).sql

# Générer et appliquer la migration
npx prisma migrate dev --name add_anip_unique_constraint

# Mettre à jour le client Prisma
npx prisma generate

# Redémarrer le serveur
npm run dev
```

### 5. Tester l'interface

```bash
cd unipath-front
npm run dev
```

Ouvrir http://localhost:5173/register et tester :
- ✅ Inscription avec ANIP valide (12 chiffres)
- ❌ Inscription sans ANIP (doit échouer)
- ❌ Inscription avec ANIP invalide (doit échouer)

## 📚 Documentation

### Pour les développeurs

| Document | Description | Quand l'utiliser |
|----------|-------------|------------------|
| `INTEGRATION_ANIP.md` | Documentation technique complète | Comprendre l'implémentation |
| `MIGRATION_ANIP.md` | Guide de migration | Déployer en production |
| `README_ANIP_UTILS.md` | Documentation des utilitaires | Gérer les ANIP |

### Pour les chefs de projet

| Document | Description | Quand l'utiliser |
|----------|-------------|------------------|
| `ANIP_IMPLEMENTATION_SUMMARY.md` | Résumé exécutif | Vue d'ensemble rapide |
| `ANIP_RAPPORT_FINAL.md` | Rapport complet | Présentation stakeholders |
| `ANIP_CHECKLIST.md` | Checklist de déploiement | Planifier le déploiement |

## 🔧 Utilitaires

### Commandes principales

```bash
# Statistiques
node scripts/anip-utils.js stats

# Liste des candidats sans ANIP
node scripts/anip-utils.js sans-anip [limit]

# Validation de tous les ANIP
node scripts/anip-utils.js valider

# Recherche par ANIP
node scripts/anip-utils.js rechercher <anip>

# Nettoyage des ANIP
node scripts/anip-utils.js nettoyer

# Génération d'ANIP de test
node scripts/anip-utils.js generer-test [nombre]
```

**Documentation complète :** `unipath-api/scripts/README_ANIP_UTILS.md`

## ✅ Validation

### Format ANIP valide

- ✅ Exactement **12 chiffres**
- ✅ Uniquement des chiffres (0-9)
- ❌ Pas de lettres
- ❌ Pas de caractères spéciaux
- ❌ Pas d'espaces

**Exemples :**
- ✅ `123456789012` - Valide
- ❌ `12345` - Trop court
- ❌ `1234567890123` - Trop long
- ❌ `12345678901A` - Contient une lettre
- ❌ `123-456-789-012` - Contient des tirets
- ❌ `123 456 789 012` - Contient des espaces

### Tests automatisés

```bash
# Exécuter tous les tests ANIP
npm test -- anip.test.js

# Tests avec couverture
npm test -- anip.test.js --coverage

# Tests en mode watch
npm test -- anip.test.js --watch
```

## 🐛 Dépannage

### Problème : "Format ANIP invalide"

**Solution :** L'ANIP doit contenir exactement 12 chiffres.

```javascript
// ✅ Valide
anip: "123456789012"

// ❌ Invalide
anip: "12345"        // Trop court
anip: "ANIP123456789" // Contient des lettres
```

### Problème : "ANIP déjà enregistré"

**Solution :** Cet ANIP est déjà utilisé par un autre candidat.

```bash
# Rechercher le candidat avec cet ANIP
node scripts/anip-utils.js rechercher 123456789012
```

### Problème : Migration échoue

**Solution :** Vérifier les doublons d'ANIP avant la migration.

```bash
# Identifier les doublons
node scripts/anip-utils.js valider

# Nettoyer les ANIP
node scripts/anip-utils.js nettoyer
```

### Problème : Tests échouent

**Solution :** Vérifier la configuration de la base de données.

```bash
# Vérifier la connexion
npx prisma db pull

# Régénérer le client Prisma
npx prisma generate

# Réexécuter les tests
npm test
```

## 📊 Monitoring

### Vérifications quotidiennes

```bash
# Statistiques ANIP
node scripts/anip-utils.js stats >> logs/anip-daily-$(date +%Y%m%d).log

# Validation
node scripts/anip-utils.js valider >> logs/anip-validation-$(date +%Y%m%d).log
```

### Métriques à surveiller

- Nombre total de candidats
- Pourcentage avec ANIP
- Nombre de doublons (doit être 0)
- Temps de réponse des validations

## 🔄 Workflow de développement

### 1. Développement local

```bash
# 1. Créer une branche
git checkout -b feature/anip-integration

# 2. Faire les modifications
# ...

# 3. Exécuter les tests
npm test

# 4. Vérifier les changements
node scripts/anip-utils.js stats

# 5. Commit
git add .
git commit -m "feat: Intégration ANIP"

# 6. Push
git push origin feature/anip-integration
```

### 2. Déploiement staging

```bash
# 1. Backup
pg_dump -U postgres -d unipath_staging > backup_staging.sql

# 2. Migration
npx prisma migrate deploy

# 3. Tests
npm test

# 4. Vérification
node scripts/anip-utils.js stats
```

### 3. Déploiement production

**Suivre la checklist :** `ANIP_CHECKLIST.md`

## 🎓 Formation

### Pour les développeurs

1. Lire `INTEGRATION_ANIP.md`
2. Examiner le code dans `auth.controller.js`
3. Exécuter les tests : `npm test -- anip.test.js`
4. Tester les utilitaires : `node scripts/anip-utils.js`

### Pour le support

1. Lire `README_ANIP.md` (ce fichier)
2. Comprendre les messages d'erreur
3. Savoir utiliser les utilitaires de recherche
4. Connaître la procédure de mise à jour d'ANIP

### Pour les administrateurs

1. Lire `ANIP_RAPPORT_FINAL.md`
2. Comprendre la checklist de déploiement
3. Savoir effectuer un rollback
4. Connaître les procédures de monitoring

## 📞 Support

### Questions fréquentes

**Q : L'ANIP est-il obligatoire ?**  
R : Oui, depuis cette mise à jour, l'ANIP est obligatoire pour tous les nouveaux candidats.

**Q : Que faire si un candidat n'a pas d'ANIP ?**  
R : Le candidat doit s'enregistrer au RNPP pour obtenir son ANIP avant de s'inscrire sur UniPath.

**Q : Peut-on modifier l'ANIP d'un candidat ?**  
R : Oui, mais uniquement par un administrateur via l'utilitaire :
```bash
node scripts/anip-utils.js rechercher <ancien-anip>
# Puis mise à jour manuelle en base de données
```

**Q : Comment gérer les candidats existants sans ANIP ?**  
R : Voir `MIGRATION_ANIP.md` section "Gestion des données existantes".

### Contacts

- **Équipe technique** : [À compléter]
- **Product Owner** : [À compléter]
- **Support** : [À compléter]

## 🎯 Prochaines étapes

### Court terme
- [ ] Déployer en staging
- [ ] Former l'équipe support
- [ ] Mettre à jour la FAQ

### Moyen terme
- [ ] Intégration avec l'API RNPP
- [ ] Vérification en temps réel
- [ ] Pré-remplissage automatique

### Long terme
- [ ] Authentification via ANIP
- [ ] Synchronisation carte biométrique
- [ ] Chiffrement des ANIP

## 📝 Changelog

### Version 1.0 (6 mai 2026)
- ✅ Intégration ANIP obligatoire
- ✅ Validation format (12 chiffres)
- ✅ Contrainte d'unicité
- ✅ Tests automatisés
- ✅ Utilitaires de gestion
- ✅ Documentation complète

---

**Pour commencer :** Lisez `ANIP_IMPLEMENTATION_SUMMARY.md`  
**Pour déployer :** Suivez `ANIP_CHECKLIST.md`  
**Pour les détails :** Consultez `INTEGRATION_ANIP.md`

**Équipe** : Groupe 4 de SGBD (GIT) — EPAC: 2025-2026  
**Date** : 6 mai 2026  
**Version** : 1.0
