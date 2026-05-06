# ⚡ ANIP - Quick Start (5 minutes)

## 🎯 En bref

L'ANIP est maintenant **obligatoire** pour tous les candidats. C'est un code unique à **12 chiffres**.

## 🚀 Démarrage en 5 étapes

### 1️⃣ Vérifier l'état actuel (30 secondes)

```bash
cd unipath-api
node scripts/anip-utils.js stats
```

### 2️⃣ Exécuter les tests (1 minute)

```bash
npm test -- anip.test.js
```

### 3️⃣ Appliquer la migration (2 minutes)

```bash
# Backup
pg_dump -U postgres -d unipath > backup.sql

# Migration
npx prisma migrate dev --name add_anip_unique_constraint
npx prisma generate
```

### 4️⃣ Redémarrer le serveur (30 secondes)

```bash
npm run dev
```

### 5️⃣ Tester l'interface (1 minute)

```bash
cd ../unipath-front
npm run dev
```

Ouvrir http://localhost:5173/register et tester une inscription.

## ✅ Validation rapide

### Format ANIP

- ✅ `123456789012` - Valide
- ❌ `12345` - Invalide (trop court)
- ❌ `ANIP123456789` - Invalide (contient des lettres)

### Test d'inscription

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

**Résultat attendu :** `201 Created`

## 🛠️ Commandes utiles

```bash
# Statistiques
node scripts/anip-utils.js stats

# Recherche
node scripts/anip-utils.js rechercher 123456789012

# Validation
node scripts/anip-utils.js valider
```

## 📚 Documentation complète

- **Guide complet** : `README_ANIP.md`
- **Technique** : `INTEGRATION_ANIP.md`
- **Migration** : `MIGRATION_ANIP.md`
- **Checklist** : `ANIP_CHECKLIST.md`

## 🆘 Problème ?

### Erreur : "Format ANIP invalide"
→ L'ANIP doit contenir exactement 12 chiffres

### Erreur : "ANIP déjà enregistré"
→ Cet ANIP est déjà utilisé par un autre candidat

### Erreur : Migration échoue
→ Vérifier les doublons : `node scripts/anip-utils.js valider`

## ✅ C'est fait !

Votre système est maintenant configuré pour utiliser l'ANIP.

**Prochaine étape :** Lire `README_ANIP.md` pour plus de détails.

---

**Temps total : 5 minutes** ⏱️  
**Difficulté : Facile** 🟢  
**Statut : Prêt** ✅
