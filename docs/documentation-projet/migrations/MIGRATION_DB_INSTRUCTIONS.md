# 🔧 Instructions pour la Migration de la Base de Données

## ⚠️ Problème Actuel

La migration Prisma échoue avec l'erreur suivante :
```
FATAL: (EMAXCONNSESSION) max clients reached in session mode - max clients are limited to pool_size: 15
```

Cela signifie que le pool de connexions Supabase est saturé (15 connexions maximum en mode session).

---

## ✅ Solutions Possibles

### Solution 1 : Attendre et Réessayer (RECOMMANDÉ)

1. **Fermez tous les terminaux et applications** qui pourraient utiliser la base de données
2. **Attendez 2-3 minutes** pour que toutes les connexions se ferment automatiquement
3. **Exécutez la migration** :
   ```bash
   cd unipath-api
   npx prisma db push
   ```

### Solution 2 : Utiliser le Dashboard Supabase

Si la solution 1 ne fonctionne pas, vous pouvez appliquer les modifications manuellement via le dashboard Supabase :

1. **Connectez-vous à Supabase** : https://supabase.com/dashboard
2. **Allez dans SQL Editor**
3. **Exécutez les requêtes SQL suivantes** :

```sql
-- Ajouter les colonnes manquantes au modèle Candidat
ALTER TABLE "Candidat" 
ADD COLUMN IF NOT EXISTS "anip" TEXT,
ADD COLUMN IF NOT EXISTS "serie" TEXT,
ADD COLUMN IF NOT EXISTS "emailConfirme" BOOLEAN DEFAULT false;

-- Ajouter la colonne seriesAcceptees au modèle Concours
ALTER TABLE "Concours" 
ADD COLUMN IF NOT EXISTS "seriesAcceptees" TEXT[] DEFAULT '{}';

-- Ajouter la colonne numeroInscription au modèle Inscription
ALTER TABLE "Inscription" 
ADD COLUMN IF NOT EXISTS "numeroInscription" TEXT;

-- Créer l'index unique sur numeroInscription
CREATE UNIQUE INDEX IF NOT EXISTS "Inscription_numeroInscription_key" 
ON "Inscription"("numeroInscription");
```

4. **Vérifiez que les colonnes ont été ajoutées** :
   ```sql
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name IN ('Candidat', 'Concours', 'Inscription')
   ORDER BY table_name, ordinal_position;
   ```

### Solution 3 : Utiliser une URL de connexion directe

Si vous avez accès à l'URL de connexion directe (sans pgbouncer), modifiez temporairement le fichier `.env` :

1. **Ouvrez** `unipath-api/.env`
2. **Remplacez** la ligne `DATABASE_URL` par l'URL directe (sans `?pgbouncer=true`)
3. **Exécutez** la migration :
   ```bash
   cd unipath-api
   npx prisma db push
   ```
4. **Restaurez** l'URL avec pgbouncer après la migration

---

## 📋 Modifications Appliquées par la Migration

### Modèle Candidat
- ✅ `anip String?` - Identifiant ANIP du candidat
- ✅ `serie String?` - Série du cursus scolaire (A, B, C, D, E, F, G)
- ✅ `emailConfirme Boolean @default(false)` - Confirmation de l'email

### Modèle Concours
- ✅ `seriesAcceptees String[] @default([])` - Séries acceptées pour ce concours

### Modèle Inscription
- ✅ `numeroInscription String @unique` - Numéro d'inscription unique (ex: UAC-2026-MED-00123)

---

## 🧪 Vérification Après Migration

Une fois la migration réussie, vérifiez que tout fonctionne :

```bash
# 1. Ouvrir Prisma Studio pour voir les nouvelles colonnes
cd unipath-api
npx prisma studio

# 2. Vérifier que le serveur démarre correctement
npm start
```

---

## 📊 État Actuel du Projet

### ✅ Code Backend (100% prêt)
- ✅ `auth.controller.js` - Accepte ANIP et série, envoie email de confirmation
- ✅ `concours.controller.js` - Filtre les concours par série
- ✅ `inscription.controller.js` - Génère numéro d'inscription unique
- ✅ `email.service.js` - Fonction envoyerEmailConfirmation()

### ✅ Code Frontend (100% prêt)
- ✅ `Register.jsx` - Champs ANIP et série ajoutés
- ✅ `GestionConcours.jsx` - Multi-select pour les séries
- ✅ `DashboardCandidat.jsx` - Affichage du numéro d'inscription

### ⚠️ Base de Données (En attente)
- ⏳ Migration Prisma à exécuter

---

## 🎯 Prochaines Étapes

1. **Exécuter la migration** (voir solutions ci-dessus)
2. **Tester l'inscription** avec ANIP et série
3. **Vérifier le filtrage** des concours par série
4. **Tester la génération** du numéro d'inscription unique

---

## 📞 Support

Si le problème persiste :
- Vérifiez le nombre de connexions actives dans le dashboard Supabase
- Contactez le support Supabase pour augmenter la limite du pool
- Utilisez la Solution 2 (SQL manuel) comme alternative

---

**Date** : 6 mai 2026  
**Statut** : Code prêt, migration en attente  
**Prochaine action** : Exécuter la migration DB
