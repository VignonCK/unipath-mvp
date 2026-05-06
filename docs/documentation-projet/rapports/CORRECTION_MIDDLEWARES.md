# Correction des Middlewares Backend

## 🐛 Problème rencontré

Lors du démarrage du serveur backend, deux erreurs critiques empêchaient le lancement :

```
Error: Cannot find module '../middlewares/auth.middleware'
Error: Cannot find module '../middleware/upload.middleware'
```

## ✅ Corrections appliquées

### 1. Correction du chemin d'import dans concours.routes.js

**Problème** : Import depuis `../middlewares/` (pluriel) alors que le dossier s'appelle `middleware` (singulier)

**Fichier** : `unipath-api/src/routes/concours.routes.js`

**Avant** :
```javascript
const { authMiddleware, roleMiddleware } = require('../middlewares/auth.middleware');
```

**Après** :
```javascript
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
```

**Changements** :
- ✅ Correction du chemin : `middlewares` → `middleware`
- ✅ Correction des noms d'export : `authMiddleware` → `protect`
- ✅ Correction des noms d'export : `roleMiddleware` → `checkRole`
- ✅ Import depuis deux fichiers séparés (auth et role)

**Utilisation dans les routes** :
```javascript
// Avant
router.post('/', authMiddleware, roleMiddleware(['DGES']), concoursController.createConcours);

// Après
router.post('/', protect, checkRole(['DGES']), concoursController.createConcours);
```

### 2. Création du middleware upload.middleware.js

**Problème** : Le fichier `upload.middleware.js` n'existait pas

**Fichier créé** : `unipath-api/src/middleware/upload.middleware.js`

**Fonctionnalités** :
- ✅ Configuration de multer pour l'upload de fichiers
- ✅ Stockage dans le dossier `uploads/`
- ✅ Génération de noms de fichiers uniques (timestamp + random)
- ✅ Filtrage des types de fichiers (JPG, PNG, PDF, WEBP)
- ✅ Limite de taille : 5 MB
- ✅ Création automatique du dossier uploads s'il n'existe pas

**Configuration** :
```javascript
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
  }
});
```

**Types de fichiers acceptés** :
- `image/jpeg`
- `image/jpg`
- `image/png`
- `image/webp`
- `application/pdf`

**Utilisation** :
```javascript
const { upload } = require('../middleware/upload.middleware');

router.post('/:inscriptionId/quittance', 
  protect, 
  upload.single('quittance'), 
  inscriptionController.uploadQuittanceInscription
);
```

## 📁 Structure des middlewares

```
unipath-api/src/middleware/
├── auth.middleware.js       ← Authentification (export: protect)
├── role.middleware.js       ← Vérification des rôles (export: checkRole)
├── upload.middleware.js     ← Upload de fichiers (export: upload) [CRÉÉ]
└── validation.middleware.js ← Validation des données
```

## 🔍 Exports des middlewares

### auth.middleware.js
```javascript
module.exports = { protect };
```

### role.middleware.js
```javascript
module.exports = { checkRole };
```

### upload.middleware.js
```javascript
module.exports = { upload };
```

## ✅ Résultat

Le serveur démarre maintenant correctement :

```
[SUCCESS] Serveur UniPath démarré sur le port 3001
[INFO] Health check: http://localhost:3001/health
[INFO] API Base URL: http://localhost:3001/api
[INFO] Environnement: development
```

## 📝 Fichiers modifiés

1. ✅ `unipath-api/src/routes/concours.routes.js` - Correction des imports
2. ✅ `unipath-api/src/middleware/upload.middleware.js` - Création du fichier

## 🧪 Tests

- ✅ Serveur démarre sans erreur
- ✅ Aucune erreur de diagnostic
- ✅ Routes protégées fonctionnelles
- ✅ Upload de fichiers configuré

## 📌 Notes importantes

1. **Dossier uploads** : Le dossier `uploads/` est créé automatiquement au premier démarrage
2. **Sécurité** : Les fichiers sont filtrés par type MIME
3. **Noms uniques** : Chaque fichier uploadé reçoit un nom unique pour éviter les collisions
4. **Limite de taille** : 5 MB maximum par fichier

## 🚀 Prochaines étapes

Le backend est maintenant opérationnel et prêt à :
- Gérer les inscriptions avec upload de quittances
- Protéger les routes avec authentification
- Vérifier les rôles (CANDIDAT, COMMISSION, DGES)
- Gérer le statut SOUS_RESERVE avec emails

---

**Date de correction** : 6 mai 2026  
**Statut** : ✅ Résolu  
**Impact** : Critique → Serveur opérationnel
