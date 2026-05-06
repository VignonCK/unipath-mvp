# ✅ Checklist d'intégration ANIP

## 📦 Fichiers créés/modifiés

### Backend
- ✅ `unipath-api/src/controllers/auth.controller.js` - Validation ANIP ajoutée
- ✅ `unipath-api/prisma/schema.prisma` - Contrainte unique et index ajoutés
- ✅ `unipath-api/tests/anip.test.js` - Suite de tests complète
- ✅ `unipath-api/scripts/anip-utils.js` - Utilitaires de gestion ANIP
- ✅ `unipath-api/scripts/README_ANIP_UTILS.md` - Documentation des utilitaires

### Frontend
- ✅ `unipath-front/src/pages/Register.jsx` - Champ ANIP amélioré avec validation

### Documentation
- ✅ `INTEGRATION_ANIP.md` - Documentation technique complète
- ✅ `MIGRATION_ANIP.md` - Guide de migration et déploiement
- ✅ `ANIP_IMPLEMENTATION_SUMMARY.md` - Résumé de l'implémentation
- ✅ `ANIP_CHECKLIST.md` - Ce fichier (checklist)

## 🔍 Validation des changements

### 1. Code Backend

#### Validation dans `auth.controller.js`
```javascript
// ✅ Vérifier que ces validations sont présentes :
- [ ] Vérification de présence de l'ANIP
- [ ] Validation du format (12 chiffres exactement)
- [ ] Vérification d'unicité dans la base
- [ ] Messages d'erreur explicites
```

#### Schéma Prisma
```prisma
// ✅ Vérifier dans schema.prisma :
- [ ] anip String? @unique
- [ ] @@index([anip])
```

### 2. Code Frontend

#### Formulaire d'inscription
```jsx
// ✅ Vérifier dans Register.jsx :
- [ ] Label explicite avec description
- [ ] Placeholder "123456789012"
- [ ] maxLength="12"
- [ ] pattern="\d{12}"
- [ ] Message d'aide contextuel
- [ ] Validation JavaScript dans handleStep1
```

### 3. Tests

```bash
# ✅ Exécuter les tests
cd unipath-api
npm test -- anip.test.js

# Vérifier que tous les tests passent :
- [ ] ANIP valide accepté
- [ ] ANIP manquant rejeté
- [ ] ANIP trop court/long rejeté
- [ ] ANIP avec lettres rejeté
- [ ] ANIP dupliqué rejeté
```

## 🚀 Étapes de déploiement

### Pré-déploiement

- [ ] **Backup de la base de données**
  ```bash
  pg_dump -U postgres -d unipath > backup_pre_anip_$(date +%Y%m%d).sql
  ```

- [ ] **Vérifier l'état actuel**
  ```bash
  node scripts/anip-utils.js stats
  node scripts/anip-utils.js sans-anip 100
  node scripts/anip-utils.js valider
  ```

- [ ] **Documenter les candidats sans ANIP**
  ```bash
  node scripts/anip-utils.js sans-anip 1000 > candidats_sans_anip.txt
  ```

### Migration de la base de données

- [ ] **Générer la migration Prisma**
  ```bash
  cd unipath-api
  npx prisma migrate dev --name add_anip_unique_constraint
  ```

- [ ] **Vérifier la migration générée**
  ```bash
  cat prisma/migrations/*/migration.sql
  ```

- [ ] **Appliquer la migration**
  ```bash
  npx prisma migrate deploy
  ```

- [ ] **Mettre à jour le client Prisma**
  ```bash
  npx prisma generate
  ```

### Tests post-migration

- [ ] **Test 1 : Inscription avec ANIP valide**
  ```bash
  curl -X POST http://localhost:3001/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"nom":"TEST","prenom":"User","anip":"123456789012",...}'
  ```
  Résultat attendu : ✅ 201 Created

- [ ] **Test 2 : Inscription sans ANIP**
  ```bash
  curl -X POST http://localhost:3001/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"nom":"TEST","prenom":"User","email":"test@example.com",...}'
  ```
  Résultat attendu : ❌ 400 Bad Request

- [ ] **Test 3 : Inscription avec ANIP invalide**
  ```bash
  curl -X POST http://localhost:3001/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"nom":"TEST","prenom":"User","anip":"12345",...}'
  ```
  Résultat attendu : ❌ 400 Bad Request

- [ ] **Test 4 : Inscription avec ANIP dupliqué**
  Résultat attendu : ❌ 400 Bad Request

- [ ] **Test 5 : Interface frontend**
  - [ ] Ouvrir http://localhost:5173/register
  - [ ] Vérifier le champ ANIP
  - [ ] Tester la validation en temps réel
  - [ ] Soumettre le formulaire avec ANIP valide
  - [ ] Soumettre le formulaire avec ANIP invalide

### Vérification en base de données

- [ ] **Vérifier la contrainte UNIQUE**
  ```sql
  SELECT conname, contype
  FROM pg_constraint
  WHERE conrelid = '"Candidat"'::regclass
    AND conname LIKE '%anip%';
  ```

- [ ] **Vérifier l'index**
  ```sql
  SELECT indexname, indexdef
  FROM pg_indexes
  WHERE tablename = 'Candidat'
    AND indexdef LIKE '%anip%';
  ```

- [ ] **Statistiques**
  ```bash
  node scripts/anip-utils.js stats
  ```

### Monitoring post-déploiement

- [ ] **Surveiller les logs d'erreur**
  ```bash
  tail -f logs/error.log | grep -i anip
  ```

- [ ] **Surveiller les inscriptions**
  ```bash
  # Vérifier que les nouvelles inscriptions ont un ANIP
  node scripts/anip-utils.js stats
  ```

- [ ] **Vérifier les métriques**
  - Taux de succès des inscriptions
  - Erreurs liées à l'ANIP
  - Temps de réponse

## 📋 Gestion des données existantes

### Scénario 1 : Environnement de développement

- [ ] **Option A : Supprimer les candidats sans ANIP**
  ```sql
  DELETE FROM "Candidat" WHERE anip IS NULL;
  ```

- [ ] **Option B : Générer des ANIP temporaires**
  ```sql
  UPDATE "Candidat" 
  SET anip = LPAD(CAST(FLOOR(RANDOM() * 1000000000000) AS TEXT), 12, '0')
  WHERE anip IS NULL;
  ```

### Scénario 2 : Environnement de production

- [ ] **Identifier les candidats sans ANIP**
  ```bash
  node scripts/anip-utils.js sans-anip 1000 > candidats_a_contacter.csv
  ```

- [ ] **Contacter les candidats**
  - Envoyer un email pour demander leur ANIP
  - Fournir un formulaire de mise à jour

- [ ] **Mettre à jour manuellement**
  ```javascript
  // Utiliser l'utilitaire
  const { mettreAJourANIP } = require('./scripts/anip-utils');
  await mettreAJourANIP('candidat-id', '123456789012');
  ```

## 🔄 Rollback (si nécessaire)

### En cas de problème critique

- [ ] **Annuler la migration**
  ```bash
  npx prisma migrate resolve --rolled-back <migration_name>
  ```

- [ ] **Restaurer le backup**
  ```bash
  psql -U postgres -d unipath < backup_pre_anip_YYYYMMDD.sql
  ```

- [ ] **Revenir au code précédent**
  ```bash
  git revert <commit-hash>
  ```

- [ ] **Redémarrer les services**
  ```bash
  npm run dev
  ```

## 📊 Métriques de succès

### Objectifs

- [ ] 100% des nouvelles inscriptions ont un ANIP valide
- [ ] 0 doublon d'ANIP dans la base
- [ ] Temps de réponse < 500ms pour la validation ANIP
- [ ] Taux d'erreur < 1% sur les inscriptions

### Suivi

```bash
# Exécuter quotidiennement
node scripts/anip-utils.js stats >> logs/anip-metrics-$(date +%Y%m%d).log
```

## 📞 Communication

### Équipe technique

- [ ] Informer l'équipe de développement
- [ ] Partager la documentation
- [ ] Organiser une session de Q&A

### Utilisateurs

- [ ] Mettre à jour la FAQ
- [ ] Préparer un message d'annonce
- [ ] Former le support utilisateur

### Stakeholders

- [ ] Présenter les bénéfices
- [ ] Partager les métriques
- [ ] Planifier les évolutions futures

## 🎯 Prochaines étapes

### Court terme (1-2 semaines)

- [ ] Surveiller les métriques
- [ ] Corriger les bugs éventuels
- [ ] Recueillir les retours utilisateurs

### Moyen terme (1-3 mois)

- [ ] Intégration avec l'API RNPP
- [ ] Vérification en temps réel des ANIP
- [ ] Pré-remplissage automatique des informations

### Long terme (3-6 mois)

- [ ] Authentification via ANIP
- [ ] Synchronisation avec la carte biométrique CIP
- [ ] Chiffrement des ANIP en base de données

## ✅ Validation finale

### Avant de marquer comme terminé

- [ ] Tous les tests passent
- [ ] La migration est appliquée
- [ ] La documentation est à jour
- [ ] L'équipe est informée
- [ ] Le monitoring est en place
- [ ] Les backups sont effectués
- [ ] Les métriques sont suivies

### Signature

- **Développeur** : _________________ Date : _______
- **Reviewer** : _________________ Date : _______
- **Product Owner** : _________________ Date : _______

---

**Date de création** : 6 mai 2026  
**Version** : 1.0  
**Statut** : ✅ Prêt pour déploiement
