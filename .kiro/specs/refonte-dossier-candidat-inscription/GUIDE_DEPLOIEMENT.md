# Guide de Déploiement - Refonte Dossier Candidat et Inscription

## Vue d'Ensemble

Ce guide vous accompagne dans le déploiement de la refonte "Upload Once, Use Everywhere" qui sépare le **Dossier Personnel** (4 pièces de base) du **Dossier Concours** (pièces spécifiques par inscription).

## ✅ Pré-requis

- Node.js 18+ installé
- PostgreSQL 14+ en cours d'exécution
- Accès à Supabase Storage configuré
- Variables d'environnement configurées dans `.env`
- Backup de la base de données effectué

## 📋 Checklist Pré-Déploiement

### 1. Vérification de l'Environnement

```bash
# Vérifier Node.js
node --version  # Doit être >= 18

# Vérifier PostgreSQL
psql --version  # Doit être >= 14

# Vérifier les variables d'environnement
cd unipath-api
cat .env | grep DATABASE_URL
cat .env | grep SUPABASE
```

### 2. Backup de la Base de Données

**CRITIQUE : Créer un backup AVANT toute migration**

```bash
# Backup PostgreSQL
pg_dump -U postgres -d unipath_db -F c -b -v -f backup_pre_refonte_$(date +%Y%m%d_%H%M%S).dump

# Vérifier que le backup existe
ls -lh backup_pre_refonte_*.dump
```

### 3. Vérification du Schéma Prisma

```bash
cd unipath-api

# Vérifier que le schéma est à jour
npx prisma validate

# Générer le client Prisma
npx prisma generate
```

## 🚀 Procédure de Déploiement

### Étape 1 : Arrêter l'Application

```bash
# Arrêter le serveur API
pm2 stop unipath-api
# OU
pkill -f "node.*server.js"
```

### Étape 2 : Mettre à Jour le Code

```bash
cd unipath-mvp

# Récupérer les dernières modifications
git pull origin main

# Installer les dépendances
cd unipath-api
npm install

cd ../unipath-front
npm install
```

### Étape 3 : Exécuter les Migrations

```bash
cd unipath-api

# Vérifier les migrations en attente
npx prisma migrate status

# Appliquer les migrations
npx prisma migrate deploy

# Vérifier que la migration a réussi
npx prisma migrate status
```

**Sortie attendue :**
```
✓ Migration 20260510173725_refonte_dossier_inscription applied
✓ All migrations have been applied
```

### Étape 4 : Vérifier l'Intégrité des Données

```bash
# Exécuter le script de vérification
node scripts/verify-migration.js
```

**Script de vérification** (`scripts/verify-migration.js`) :

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyMigration() {
  console.log('🔍 Vérification de l\'intégrité des données...\n');

  // 1. Vérifier que chaque Inscription a un DossierInscription
  const inscriptions = await prisma.inscription.count();
  const dossiersInscription = await prisma.dossierInscription.count();
  
  console.log(`✓ Inscriptions: ${inscriptions}`);
  console.log(`✓ DossiersInscription: ${dossiersInscription}`);
  
  if (inscriptions !== dossiersInscription) {
    console.error('❌ ERREUR: Le nombre de DossierInscription ne correspond pas au nombre d\'Inscription');
    process.exit(1);
  }

  // 2. Vérifier que ActionHistory utilise dossierInscriptionId
  const actionsHistory = await prisma.actionHistory.findMany({
    take: 5,
    include: { dossierInscription: true }
  });
  
  const invalidActions = actionsHistory.filter(a => !a.dossierInscription);
  if (invalidActions.length > 0) {
    console.error('❌ ERREUR: Certaines ActionHistory ont des références invalides');
    process.exit(1);
  }
  
  console.log(`✓ ActionHistory: ${actionsHistory.length} actions vérifiées`);

  // 3. Vérifier les relations
  const inscriptionSample = await prisma.inscription.findFirst({
    include: {
      candidat: { include: { dossier: true } },
      dossierInscription: true
    }
  });

  if (!inscriptionSample) {
    console.log('⚠️  Aucune inscription trouvée (base vide)');
  } else {
    console.log(`✓ Relations vérifiées pour l'inscription ${inscriptionSample.id}`);
    console.log(`  - Candidat: ${inscriptionSample.candidat.nom}`);
    console.log(`  - Dossier Personnel: ${inscriptionSample.candidat.dossier ? 'Présent' : 'Absent'}`);
    console.log(`  - Dossier Inscription: ${inscriptionSample.dossierInscription ? 'Présent' : 'Absent'}`);
  }

  console.log('\n✅ Vérification terminée avec succès !');
  await prisma.$disconnect();
}

verifyMigration().catch(console.error);
```

### Étape 5 : Redémarrer l'Application

```bash
# Backend
cd unipath-api
pm2 start ecosystem.config.js
# OU
npm run start

# Frontend (si nécessaire)
cd ../unipath-front
npm run build
```

### Étape 6 : Tests de Fumée

Exécuter ces tests manuels pour vérifier que tout fonctionne :

#### Test 1 : Création d'Inscription

```bash
curl -X POST http://localhost:5000/api/inscriptions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"concoursId": "CONCOURS_ID"}'
```

**Réponse attendue :** Status 201 avec `inscription` et `dossierInscription` créés

#### Test 2 : Upload Pièce de Base

```bash
curl -X POST http://localhost:5000/api/dossier/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "fichier=@acte_naissance.pdf" \
  -F "typePiece=acteNaissance"
```

**Réponse attendue :** Status 200 avec `impactInscriptions` indiquant le nombre d'inscriptions affectées

#### Test 3 : Récupération Dossier Complet

```bash
curl -X GET http://localhost:5000/api/completion/inscriptions/INSCRIPTION_ID/dossier-complet \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Réponse attendue :** Status 200 avec `piecesBase` (source: dossier_personnel) et `piecesSpecifiques` (source: dossier_concours)

## 🔄 Procédure de Rollback

Si un problème survient, suivez cette procédure :

### 1. Arrêter l'Application

```bash
pm2 stop unipath-api
```

### 2. Restaurer le Backup

```bash
# Restaurer la base de données
pg_restore -U postgres -d unipath_db -c backup_pre_refonte_YYYYMMDD_HHMMSS.dump

# Vérifier la restauration
psql -U postgres -d unipath_db -c "SELECT COUNT(*) FROM \"Inscription\";"
```

### 3. Revenir au Code Précédent

```bash
cd unipath-mvp
git checkout PREVIOUS_COMMIT_HASH

cd unipath-api
npm install
npx prisma generate
```

### 4. Redémarrer l'Application

```bash
pm2 start ecosystem.config.js
```

## 📊 Monitoring Post-Déploiement

### Métriques à Surveiller

1. **Temps de réponse des endpoints**
   - `/api/completion/inscriptions/:id/dossier-complet` : < 200ms
   - `/api/dossier/upload` : < 2s (upload inclus)

2. **Intégrité des données**
   ```sql
   -- Vérifier que chaque Inscription a un DossierInscription
   SELECT COUNT(*) FROM "Inscription" i
   LEFT JOIN "DossierInscription" di ON i.id = di."inscriptionId"
   WHERE di.id IS NULL;
   -- Résultat attendu : 0
   ```

3. **Logs d'erreurs**
   ```bash
   # Surveiller les logs
   pm2 logs unipath-api --lines 100
   
   # Filtrer les erreurs
   pm2 logs unipath-api --err
   ```

### Alertes à Configurer

- ❌ Erreur 500 sur les endpoints de dossier
- ⚠️  Temps de réponse > 500ms sur `/api/completion/*`
- ❌ Échec d'upload vers Supabase Storage
- ⚠️  Incohérence entre Inscription et DossierInscription

## 🐛 Résolution des Problèmes Courants

### Problème 1 : Migration échoue avec "relation already exists"

**Cause :** La migration a déjà été partiellement appliquée

**Solution :**
```bash
# Vérifier l'état des migrations
npx prisma migrate status

# Marquer la migration comme appliquée
npx prisma migrate resolve --applied 20260510173725_refonte_dossier_inscription
```

### Problème 2 : ActionHistory référence des dossierInscriptionId invalides

**Cause :** Données orphelines dans ActionHistory

**Solution :**
```sql
-- Identifier les actions orphelines
SELECT ah.id, ah."dossierInscriptionId"
FROM "ActionHistory" ah
LEFT JOIN "DossierInscription" di ON ah."dossierInscriptionId" = di.id
WHERE di.id IS NULL;

-- Supprimer les actions orphelines (si acceptable)
DELETE FROM "ActionHistory"
WHERE "dossierInscriptionId" NOT IN (SELECT id FROM "DossierInscription");
```

### Problème 3 : Upload de fichiers échoue

**Cause :** Configuration Supabase incorrecte

**Solution :**
```bash
# Vérifier les variables d'environnement
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_KEY

# Tester la connexion Supabase
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
supabase.storage.listBuckets().then(console.log).catch(console.error);
"
```

## 📝 Checklist Post-Déploiement

- [ ] Migration appliquée avec succès
- [ ] Vérification d'intégrité passée
- [ ] Tests de fumée réussis
- [ ] Monitoring configuré
- [ ] Backup vérifié et accessible
- [ ] Documentation mise à jour
- [ ] Équipe informée des changements

## 🎯 Prochaines Étapes

1. **Surveiller les logs pendant 24h** pour détecter les problèmes
2. **Collecter les retours utilisateurs** sur la nouvelle expérience
3. **Optimiser les performances** si nécessaire (cache, indexes)
4. **Planifier la suppression du code legacy** après validation complète

## 📞 Support

En cas de problème critique :
1. Exécuter le rollback immédiatement
2. Documenter l'erreur (logs, screenshots)
3. Contacter l'équipe technique avec les détails

---

**Date de création :** 2026-05-20  
**Version :** 1.0  
**Auteur :** Équipe Technique UniPath
