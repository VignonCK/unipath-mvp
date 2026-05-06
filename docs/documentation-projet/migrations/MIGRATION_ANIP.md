# Migration ANIP - Instructions

## Changements apportés

### 1. Schéma Prisma (`schema.prisma`)
- Ajout de la contrainte `@unique` sur le champ `anip`
- Ajout d'un index `@@index([anip])` pour optimiser les recherches

### 2. Validation Backend (`auth.controller.js`)
- ANIP devient **obligatoire** lors de l'inscription
- Validation du format : exactement 12 chiffres
- Vérification d'unicité avant création du compte

### 3. Interface Frontend (`Register.jsx`)
- Amélioration du champ ANIP avec :
  - Placeholder explicite (12 chiffres)
  - Attribut `maxLength="12"`
  - Pattern HTML5 pour validation
  - Message d'aide contextuel
- Validation JavaScript avant soumission

## Étapes de migration

### 1. Générer la migration Prisma

```bash
cd unipath-api
npx prisma migrate dev --name add_anip_unique_constraint
```

Cette commande va :
- Créer un fichier de migration SQL
- Ajouter la contrainte `UNIQUE` sur la colonne `anip`
- Créer un index sur `anip`
- Appliquer la migration à la base de données

### 2. Vérifier la migration

```bash
npx prisma migrate status
```

### 3. Mettre à jour le client Prisma

```bash
npx prisma generate
```

### 4. Redémarrer le serveur API

```bash
npm run dev
```

## Gestion des données existantes

### Si des candidats existent déjà sans ANIP

**Option 1 : Environnement de développement**
```sql
-- Supprimer les candidats sans ANIP (si données de test)
DELETE FROM "Candidat" WHERE anip IS NULL;
```

**Option 2 : Environnement de production**
```sql
-- Générer des ANIP temporaires pour les candidats existants
UPDATE "Candidat" 
SET anip = LPAD(CAST(FLOOR(RANDOM() * 1000000000000) AS TEXT), 12, '0')
WHERE anip IS NULL;
```

⚠️ **Important** : En production, contactez les candidats pour qu'ils fournissent leur véritable ANIP.

### Si des doublons d'ANIP existent

```sql
-- Identifier les doublons
SELECT anip, COUNT(*) 
FROM "Candidat" 
WHERE anip IS NOT NULL 
GROUP BY anip 
HAVING COUNT(*) > 1;

-- Résoudre manuellement les doublons avant d'appliquer la contrainte UNIQUE
```

## Rollback (en cas de problème)

```bash
# Annuler la dernière migration
npx prisma migrate resolve --rolled-back <migration_name>

# Revenir à l'état précédent
npx prisma migrate dev
```

## Tests post-migration

### 1. Test d'inscription avec ANIP valide
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "TEST",
    "prenom": "User",
    "anip": "123456789012",
    "serie": "C",
    "sexe": "M",
    "nationalite": "Béninoise",
    "telephone": "+229 01 23 45 67 89",
    "dateNaiss": "2000-01-01",
    "lieuNaiss": "Cotonou",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 2. Test d'inscription sans ANIP (doit échouer)
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "TEST",
    "prenom": "User",
    "email": "test2@example.com",
    "password": "password123"
  }'
```

### 3. Test d'inscription avec ANIP invalide (doit échouer)
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "TEST",
    "prenom": "User",
    "anip": "12345",
    "email": "test3@example.com",
    "password": "password123"
  }'
```

### 4. Test d'inscription avec ANIP dupliqué (doit échouer)
```bash
# Utiliser le même ANIP que le test 1
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "AUTRE",
    "prenom": "User",
    "anip": "123456789012",
    "email": "test4@example.com",
    "password": "password123"
  }'
```

## Vérification en base de données

```sql
-- Vérifier la contrainte UNIQUE
SELECT 
  conname AS constraint_name,
  contype AS constraint_type
FROM pg_constraint
WHERE conrelid = '"Candidat"'::regclass
  AND conname LIKE '%anip%';

-- Vérifier l'index
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'Candidat'
  AND indexdef LIKE '%anip%';

-- Statistiques sur les ANIP
SELECT 
  COUNT(*) AS total_candidats,
  COUNT(anip) AS candidats_avec_anip,
  COUNT(DISTINCT anip) AS anip_uniques
FROM "Candidat";
```

## Checklist de déploiement

- [ ] Backup de la base de données effectué
- [ ] Migration Prisma générée et testée en local
- [ ] Tests d'inscription validés
- [ ] Documentation mise à jour
- [ ] Équipe informée des changements
- [ ] Migration appliquée en staging
- [ ] Tests en staging validés
- [ ] Migration appliquée en production
- [ ] Monitoring post-déploiement actif

## Support

En cas de problème lors de la migration :
1. Consulter les logs Prisma : `npx prisma migrate status`
2. Vérifier l'état de la base de données
3. Contacter l'équipe technique avec les logs d'erreur
