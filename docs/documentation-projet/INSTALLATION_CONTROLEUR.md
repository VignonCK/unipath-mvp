# Installation du Système Contrôleur

## 📋 Prérequis

- Base de données PostgreSQL accessible
- Node.js installé
- Prisma CLI installé (`npm install -g prisma`)
- Accès au projet unipath-api et unipath-front

## 🚀 Installation Backend (API)

### Étape 1 : Appliquer la migration Prisma

```bash
cd unipath-api

# Générer la migration
npx prisma migrate dev --name add_controleur_role

# Ou si la migration existe déjà
npx prisma migrate deploy
```

### Étape 2 : Générer le client Prisma

```bash
npx prisma generate
```

### Étape 3 : Créer les comptes Commission et Contrôleur

```bash
node scripts/create-commission-controleur.js
```

**Résultat attendu:**
```
🚀 Création des comptes Commission et Contrôleur

============================================================

📝 Création du compte COMMISSION...
✅ Compte COMMISSION créé avec succès!
   Email: commission@unipath.bj
   Mot de passe: Commission2024!
   ID: xxx-xxx-xxx

📝 Création du compte CONTROLEUR...
✅ Compte CONTROLEUR créé avec succès!
   Email: controleur@unipath.bj
   Mot de passe: Controleur2024!
   ID: xxx-xxx-xxx

============================================================
✅ Script terminé!
```

### Étape 4 : Redémarrer le serveur API

```bash
npm run dev
```

### Étape 5 : Vérifier les endpoints

```bash
# Test 1: Login contrôleur
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "controleur@unipath.bj",
    "password": "Controleur2024!"
  }'

# Test 2: Récupérer les dossiers (avec le token obtenu)
curl -X GET http://localhost:3001/api/controleur/dossiers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🎨 Installation Frontend

### Étape 1 : Créer les pages Contrôleur

Les fichiers suivants doivent être créés dans `unipath-front/src/pages/`:

1. **DashboardControleur.jsx** - Page principale
2. **ValidationControleur.jsx** - Page de validation des dossiers
3. **ControleurLayout.jsx** - Layout avec sidebar (dans `components/`)

### Étape 2 : Ajouter le service API

Modifier `unipath-front/src/services/api.js` :

```javascript
// Ajouter à la fin du fichier
export const controleurService = {
  getDossiersEnAttente: async (statut) => {
    const params = statut ? `?statut=${statut}` : '';
    const response = await axios.get(`${API_URL}/controleur/dossiers${params}`);
    return response.data;
  },
  
  validerDecision: async (inscriptionId, action, commentaire) => {
    const response = await axios.put(
      `${API_URL}/controleur/dossiers/${inscriptionId}/valider`,
      { action, commentaireControleur: commentaire }
    );
    return response.data;
  },
  
  getStatistiques: async () => {
    const response = await axios.get(`${API_URL}/controleur/statistiques`);
    return response.data;
  }
};
```

### Étape 3 : Ajouter les routes

Modifier `unipath-front/src/App.jsx` :

```javascript
import DashboardControleur from './pages/DashboardControleur';
import ValidationControleur from './pages/ValidationControleur';

// Dans le composant App, ajouter :
<Route path="/controleur" element={<ProtectedRoute allowedRoles={['CONTROLEUR']} />}>
  <Route index element={<DashboardControleur />} />
  <Route path="validation/:inscriptionId" element={<ValidationControleur />} />
</Route>
```

### Étape 4 : Redémarrer le serveur frontend

```bash
cd unipath-front
npm run dev
```

## ✅ Tests de Validation

### Test 1 : Login Commission

1. Aller sur http://localhost:5173/login
2. Se connecter avec :
   - Email: `commission@unipath.bj`
   - Mot de passe: `Commission2024!`
3. Vérifier la redirection vers `/commission`

### Test 2 : Décision Commission

1. Connecté en tant que commission
2. Aller sur un dossier candidat
3. Prendre une décision (VALIDER, REJETER, ou SOUS_RESERVE)
4. **Vérifier** : 
   - ✅ Le statut devient `XXX_PAR_COMMISSION`
   - ❌ Aucun email n'est envoyé au candidat

### Test 3 : Login Contrôleur

1. Se déconnecter
2. Se connecter avec :
   - Email: `controleur@unipath.bj`
   - Mot de passe: `Controleur2024!`
3. Vérifier la redirection vers `/controleur`

### Test 4 : Validation Contrôleur

1. Connecté en tant que contrôleur
2. Voir la liste des dossiers en attente
3. Cliquer sur un dossier
4. **Option A** : Confirmer la décision de la commission
   - ✅ Le statut devient `VALIDE/REJETE/SOUS_RESERVE`
   - ✅ Email envoyé au candidat
5. **Option B** : Modifier la décision
   - Choisir un nouveau statut
   - Ajouter un commentaire
   - ✅ Le statut change selon la nouvelle décision
   - ✅ Email envoyé avec le commentaire du contrôleur

### Test 5 : Vérifier les emails

1. Vérifier que le candidat reçoit l'email **uniquement après** la validation du contrôleur
2. Vérifier que l'email contient les bonnes informations
3. Si le contrôleur a modifié la décision, vérifier que son commentaire apparaît

## 🔍 Vérification Base de Données

### Vérifier les nouveaux statuts

```sql
SELECT statut, COUNT(*) 
FROM "Inscription" 
GROUP BY statut;
```

**Résultat attendu:**
```
statut                      | count
----------------------------+-------
EN_ATTENTE                  |   45
VALIDE_PAR_COMMISSION       |   12
REJETE_PAR_COMMISSION       |    3
SOUS_RESERVE_PAR_COMMISSION |    5
VALIDE                      |   89
REJETE                      |    7
SOUS_RESERVE                |   11
```

### Vérifier la traçabilité

```sql
SELECT 
  id,
  statut,
  decisionCommissionPar,
  decisionCommissionDate,
  decisionControleurPar,
  decisionControleurDate
FROM "Inscription"
WHERE decisionCommissionDate IS NOT NULL
LIMIT 5;
```

### Vérifier les comptes créés

```sql
-- Commission
SELECT * FROM "MembreCommission" WHERE email = 'commission@unipath.bj';

-- Contrôleur
SELECT * FROM "Controleur" WHERE email = 'controleur@unipath.bj';
```

## 🐛 Dépannage

### Erreur : "Role CONTROLEUR does not exist"

**Solution** : L'enum n'a pas été mis à jour
```bash
cd unipath-api
npx prisma migrate reset
npx prisma migrate dev
```

### Erreur : "Table Controleur does not exist"

**Solution** : La migration n'a pas été appliquée
```bash
cd unipath-api
npx prisma migrate deploy
npx prisma generate
```

### Erreur : "Cannot find module controleur.controller"

**Solution** : Vérifier que le fichier existe
```bash
ls -la unipath-api/src/controllers/controleur.controller.js
ls -la unipath-api/src/routes/controleur.routes.js
```

### Les emails sont toujours envoyés par la commission

**Solution** : Vérifier que le code de `commission.controller.js` a été modifié
```bash
grep -n "En attente de validation du contrôleur" unipath-api/src/controllers/commission.controller.js
```

### Le contrôleur ne voit pas les dossiers

**Solution** : Vérifier les statuts dans la base
```sql
SELECT statut, COUNT(*) FROM "Inscription" 
WHERE statut LIKE '%PAR_COMMISSION%'
GROUP BY statut;
```

## 📊 Monitoring

### Logs à surveiller

```bash
# Backend
tail -f unipath-api/logs/app.log | grep -i "controleur\|commission"

# Vérifier les emails envoyés
tail -f unipath-api/logs/email.log
```

### Métriques importantes

- Nombre de dossiers en attente de validation contrôleur
- Temps moyen entre décision commission et validation contrôleur
- Taux de modification des décisions par le contrôleur
- Taux d'emails envoyés avec succès

## 📝 Checklist Finale

- [ ] Migration Prisma appliquée
- [ ] Client Prisma généré
- [ ] Comptes commission et contrôleur créés
- [ ] Endpoints API testés
- [ ] Pages frontend créées
- [ ] Routes frontend ajoutées
- [ ] Service API ajouté
- [ ] Login commission fonctionne
- [ ] Login contrôleur fonctionne
- [ ] Workflow complet testé
- [ ] Emails envoyés uniquement après validation contrôleur
- [ ] Traçabilité vérifiée en base de données

## 🎓 Formation Utilisateurs

### Pour la Commission

1. Se connecter avec `commission@unipath.bj`
2. Évaluer les dossiers candidats
3. Prendre une décision (VALIDER/REJETER/SOUS_RESERVE)
4. **Important** : Le candidat ne recevra l'email qu'après validation du contrôleur

### Pour le Contrôleur

1. Se connecter avec `controleur@unipath.bj`
2. Consulter la liste des dossiers en attente
3. Pour chaque dossier :
   - Vérifier la décision de la commission
   - Confirmer si la décision est correcte
   - Ou modifier si nécessaire en ajoutant un commentaire
4. **Important** : C'est vous qui déclenchez l'envoi des emails aux candidats

## 📞 Support

En cas de problème, vérifier :
1. Les logs du serveur API
2. Les logs du serveur frontend
3. La console du navigateur
4. La base de données PostgreSQL

Pour plus d'informations, consulter `SYSTEME_VALIDATION_DEUX_NIVEAUX.md`
