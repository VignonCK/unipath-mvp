# Comptes Administrateurs

Ce document explique comment gérer les comptes administrateurs (Commission et DGES).

---

## 🔐 Politique d'Accès

### Inscription Publique
- ✅ **CANDIDAT** — Inscription libre via `/register`
- ❌ **COMMISSION** — Comptes pré-créés uniquement
- ❌ **DGES** — Comptes pré-créés uniquement

### Permissions

| Fonctionnalité | CANDIDAT | COMMISSION | DGES |
|----------------|----------|------------|------|
| S'inscrire aux concours | ✅ | ❌ | ❌ |
| Soumettre un dossier | ✅ | ❌ | ❌ |
| Valider/Rejeter dossiers | ❌ | ✅ | ❌ |
| Voir statistiques | ❌ | ✅ | ✅ |
| Gérer les concours | ❌ | ❌ | ✅ |

---

## 🚀 Créer les Comptes Administrateurs

### Méthode 1 : Script Automatique (Recommandé)

```bash
cd unipath-api
npm run create-admins
```

Ce script crée automatiquement :

**Commission :**
- Email : `commission@epac.bj`
- Mot de passe : `Commission2026!`

**DGES :**
- Email : `dges@mesrs.bj`
- Mot de passe : `DGES2026!`

⚠️ **IMPORTANT** : Changez ces mots de passe en production !

---

### Méthode 2 : Manuellement via Supabase

1. **Aller dans Supabase Dashboard**
   - Authentication → Users → Add user

2. **Créer l'utilisateur**
   - Email : `commission@epac.bj`
   - Password : `Commission2026!`
   - Confirm email : ✅ (cocher)

3. **Copier l'UUID de l'utilisateur**

4. **Insérer dans la base de données**

```sql
-- Pour Commission
INSERT INTO "MembreCommission" (id, email, nom, prenom, telephone, role, "createdAt", "updatedAt")
VALUES (
  '<UUID_COPIÉ>',
  'commission@epac.bj',
  'Commission',
  'EPAC',
  '+22997000001',
  'COMMISSION',
  NOW(),
  NOW()
);

-- Pour DGES
INSERT INTO "AdministrateurDGES" (id, email, nom, prenom, telephone, role, "createdAt", "updatedAt")
VALUES (
  '<UUID_COPIÉ>',
  'dges@mesrs.bj',
  'DGES',
  'MESRS',
  '+22997000002',
  'DGES',
  NOW(),
  NOW()
);
```

---

## 🔄 Changer les Mots de Passe

### Via Supabase Dashboard

1. Authentication → Users
2. Trouver l'utilisateur
3. Cliquer sur les 3 points → Reset password
4. Envoyer l'email de réinitialisation

### Via API (pour automatisation)

```javascript
const { supabase } = require('./src/supabase');

await supabase.auth.admin.updateUserById(
  '<USER_ID>',
  { password: 'NouveauMotDePasse2026!' }
);
```

---

## 🔒 Bonnes Pratiques

### Mots de Passe

- ✅ Minimum 12 caractères
- ✅ Mélange majuscules, minuscules, chiffres, symboles
- ✅ Unique pour chaque compte
- ✅ Changé régulièrement (tous les 3 mois)
- ❌ Jamais partagé par email/SMS
- ❌ Jamais stocké en clair

### Sécurité

1. **Activer 2FA** (si Supabase le supporte)
2. **Limiter les tentatives de connexion** (rate limiting)
3. **Logger toutes les actions** (audit trail)
4. **Révoquer les sessions inactives** (après 24h)
5. **Notifications** pour connexions suspectes

---

## 📊 Accès aux Statistiques

La Commission a accès aux mêmes statistiques que la DGES :

### Endpoints Disponibles

```bash
# Statistiques globales
GET /api/dges/statistiques
Authorization: Bearer <token_commission>

# Statistiques par concours
GET /api/dges/statistiques/:concoursId
Authorization: Bearer <token_commission>
```

### Exemple de Réponse

```json
{
  "totaux": {
    "candidats": 1250,
    "inscriptions": 2100,
    "valides": 850,
    "rejetes": 120,
    "enAttente": 1130
  },
  "statistiques": [
    {
      "concoursId": "uuid",
      "libelle": "Concours EPAC 2026",
      "inscriptions": 450,
      "valides": 200,
      "rejetes": 30,
      "enAttente": 220
    }
  ]
}
```

---

## 🧪 Tester les Comptes

### 1. Créer les comptes

```bash
npm run create-admins
```

### 2. Tester la connexion Commission

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "commission@epac.bj",
    "password": "Commission2026!"
  }'
```

### 3. Tester l'accès aux statistiques

```bash
# Récupérer le token de la réponse précédente
TOKEN="<token_reçu>"

curl http://localhost:3001/api/dges/statistiques \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Tester la connexion DGES

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "dges@mesrs.bj",
    "password": "DGES2026!"
  }'
```

---

## 🆘 Dépannage

### Erreur : "User already registered"

Le compte existe déjà. Utilisez la méthode de réinitialisation de mot de passe.

### Erreur : "Utilisateur non trouvé"

L'utilisateur existe dans Supabase Auth mais pas dans la table Prisma.
Exécutez la requête SQL d'insertion manuelle.

### Erreur : "Accès refusé"

Vérifiez que :
1. Le token est valide
2. Le rôle est correct dans la base de données
3. Les routes utilisent `checkRole(['DGES', 'COMMISSION'])`

---

## 📝 Checklist de Déploiement

Avant de déployer en production :

- [ ] Comptes administrateurs créés
- [ ] Mots de passe changés (différents de ceux par défaut)
- [ ] Mots de passe stockés dans un gestionnaire sécurisé (1Password, Bitwarden)
- [ ] Endpoints `/register/commission` et `/register/dges` désactivés ou protégés
- [ ] Rate limiting activé sur `/login`
- [ ] Logs d'audit configurés
- [ ] Notifications email configurées
- [ ] Backup de la base de données configuré

---

## 📞 Support

Pour toute question sur les comptes administrateurs :
- Email : harrydedji@gmail.com
- Discord : @the_hvrris17
