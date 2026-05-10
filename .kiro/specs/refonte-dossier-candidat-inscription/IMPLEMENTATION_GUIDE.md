# Guide d'Implémentation - Refonte Dossier Candidat et Inscription

## Vue d'Ensemble

Ce guide fournit un plan d'action étape par étape pour implémenter la refonte "Upload Once, Use Everywhere".

## Documents de Référence

1. **requirements.md** : Exigences fonctionnelles complètes
2. **design.md** : Architecture et design détaillé
3. **migrations.md** : Scripts SQL de migration (up/down)
4. **testing-strategy.md** : Stratégie de test complète

## Plan d'Implémentation

### Phase 1 : Préparation (1-2 jours)

#### 1.1 Revue de l'Architecture Actuelle
- [ ] Analyser le schéma Prisma actuel
- [ ] Identifier toutes les dépendances sur `Inscription.statut`, `Inscription.quittanceUrl`, etc.
- [ ] Lister tous les contrôleurs et services impactés
- [ ] Documenter les endpoints API existants

#### 1.2 Configuration de l'Environnement
- [ ] Créer une branche Git : `feature/refonte-dossier-inscription`
- [ ] Configurer un environnement de développement isolé
- [ ] Créer une copie de la base de données de développement
- [ ] Installer les dépendances de test

#### 1.3 Préparation des Tests
- [ ] Créer les fichiers de test unitaires
- [ ] Créer les fichiers de test d'intégration
- [ ] Créer les fixtures de test
- [ ] Configurer Jest avec couverture de code

### Phase 2 : Modification du Schéma Prisma (1 jour)

#### 2.1 Créer la Nouvelle Entité DossierInscription
```prisma
// prisma/schema.prisma

model DossierInscription {
  id String @id @default(uuid())
  inscriptionId String @unique
  quittanceUrl String?
  piecesExtras Json?
  statut StatutDossier @default(EN_ATTENTE)
  commentaireRejet String?
  commentaireSousReserve String?
  decisionCommissionPar String?
  decisionCommissionDate DateTime?
  decisionControleurPar String?
  decisionControleurDate DateTime?
  commentaireControleur String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  inscription Inscription @relation(fields: [inscriptionId], references: [id], onDelete: Cascade)
  actionHistory ActionHistory[]
  
  @@index([inscriptionId])
  @@index([statut])
  @@index([createdAt])
}
```

#### 2.2 Modifier l'Entité Inscription
```prisma
model Inscription {
  id String @id @default(uuid())
  numeroInscription String? @unique
  candidatId String
  concoursId String
  note Float?
  createdAt DateTime @default(now())
  
  candidat Candidat @relation(fields: [candidatId], references: [id])
  concours Concours @relation(fields: [concoursId], references: [id])
  dossierInscription DossierInscription?
  
  @@unique([candidatId, concoursId])
  @@index([candidatId])
  @@index([concoursId])
}
```

#### 2.3 Modifier l'Entité ActionHistory
```prisma
model ActionHistory {
  id String @id @default(uuid())
  utilisateurId String
  dossierInscriptionId String
  typeAction String
  details Json?
  timestamp DateTime @default(now())
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  dossierInscription DossierInscription @relation(fields: [dossierInscriptionId], references: [id], onDelete: Cascade)

  @@index([dossierInscriptionId])
  @@index([utilisateurId])
  @@index([timestamp])
  @@index([typeAction])
  @@index([dossierInscriptionId, timestamp(sort: Desc)])
  @@index([utilisateurId, timestamp(sort: Desc)])
}
```

#### 2.4 Générer la Migration
```bash
npx prisma migrate dev --name refonte_dossier_inscription --create-only
```

#### 2.5 Éditer le Fichier de Migration
- [ ] Ouvrir le fichier généré dans `prisma/migrations/`
- [ ] Ajouter les scripts de migration de données (voir migrations.md)
- [ ] Ajouter les scripts de vérification
- [ ] Tester la migration sur une copie de la base

### Phase 3 : Implémentation des Contrôleurs (3-4 jours)

#### 3.1 Adapter `dossier.controller.js`

**Tâches** :
- [ ] Implémenter le routage intelligent dans `uploadPiece`
- [ ] Créer `getDossierPersonnel`
- [ ] Ajouter la logique de mise à jour multi-concours
- [ ] Enregistrer les actions dans ActionHistory
- [ ] Écrire les tests unitaires

**Code clé** :
```javascript
const PIECES_DOSSIER_BASE = ['acteNaissance', 'carteIdentite', 'photo', 'releve'];

exports.uploadPiece = [
  upload.single('fichier'),
  async (req, res) => {
    const { typePiece, inscriptionId } = req.body;
    const candidatId = req.user.id;
    
    // Routage intelligent
    if (PIECES_DOSSIER_BASE.includes(typePiece)) {
      // Route vers Dossier Personnel
      // + Enregistrer action pour chaque inscription
    } else if (typePiece === 'quittance') {
      // Route vers DossierInscription.quittanceUrl
    } else {
      // Route vers DossierInscription.piecesExtras
    }
  }
];
```

#### 3.2 Adapter `inscription.controller.js`

**Tâches** :
- [ ] Modifier `creerInscription` pour créer automatiquement DossierInscription
- [ ] Ajouter la création automatique du Dossier Personnel si inexistant
- [ ] Utiliser une transaction Prisma pour garantir l'atomicité
- [ ] Enregistrer l'action DOSSIER_CONCOURS_CREE
- [ ] Écrire les tests unitaires

**Code clé** :
```javascript
exports.creerInscription = async (req, res) => {
  const result = await prisma.$transaction(async (tx) => {
    // 1. Créer Inscription
    const inscription = await tx.inscription.create({ ... });
    
    // 2. Créer DossierInscription
    const dossierInscription = await tx.dossierInscription.create({
      data: {
        inscriptionId: inscription.id,
        statut: 'EN_ATTENTE',
        piecesExtras: {}
      }
    });
    
    // 3. Enregistrer action
    await tx.actionHistory.create({ ... });
    
    return { inscription, dossierInscription };
  });
};
```

#### 3.3 Adapter `completion.controller.js`

**Tâches** :
- [ ] Créer `getCompletionInscription` avec référence implicite
- [ ] Créer `getDossierComplet` pour la vue agrégée
- [ ] Calculer la complétude globale (base + spécifiques)
- [ ] Gérer le cas où Dossier Personnel n'existe pas
- [ ] Écrire les tests unitaires

**Code clé** :
```javascript
exports.getCompletionInscription = async (req, res) => {
  const inscription = await prisma.inscription.findUnique({
    where: { id: inscriptionId },
    include: {
      candidat: { include: { dossier: true } },  // Référence implicite
      concours: { select: { piecesRequises: true } },
      dossierInscription: true
    }
  });
  
  // Calculer complétude base
  const piecesBasesPresentes = PIECES_BASE.filter(p => inscription.candidat.dossier?.[p]).length;
  
  // Calculer complétude spécifiques
  const quittancePresente = inscription.dossierInscription?.quittanceUrl ? 1 : 0;
  const piecesExtrasPresentes = ...;
  
  // Calculer pourcentage global
  const pourcentage = (piecesBasesPresentes + quittancePresente + piecesExtrasPresentes) / total * 100;
};
```

#### 3.4 Adapter `history.controller.js`

**Tâches** :
- [ ] Modifier `getHistorique` pour utiliser `dossierInscriptionId`
- [ ] Modifier `enregistrerAction` pour utiliser `dossierInscriptionId`
- [ ] Mettre à jour les vérifications de permissions
- [ ] Écrire les tests unitaires

**Code clé** :
```javascript
exports.getHistorique = async (req, res) => {
  const { dossierInscriptionId } = req.params;
  
  const dossierInscription = await prisma.dossierInscription.findUnique({
    where: { id: dossierInscriptionId },
    include: {
      inscription: {
        include: {
          candidat: { select: { nom: true, prenom: true } },
          concours: { select: { libelle: true } }
        }
      }
    }
  });
  
  const actions = await prisma.actionHistory.findMany({
    where: { dossierInscriptionId },
    orderBy: { timestamp: 'desc' }
  });
};
```

### Phase 4 : Mise à Jour des Routes API (1 jour)

#### 4.1 Créer les Nouvelles Routes

**Fichier : `src/routes/dossier.routes.js`**
```javascript
// Dossier Personnel
router.get('/candidats/:candidatId/dossier-personnel', auth, dossierController.getDossierPersonnel);
router.put('/candidats/:candidatId/dossier-personnel/pieces', auth, dossierController.uploadPiece);

// Dossier Concours
router.get('/inscriptions/:inscriptionId/dossier-complet', auth, completionController.getDossierComplet);
router.post('/inscriptions/:inscriptionId/dossier-concours/quittance', auth, dossierController.uploadPiece);
router.post('/inscriptions/:inscriptionId/dossier-concours/pieces-extras', auth, dossierController.uploadPiece);

// Historique
router.get('/dossiers-inscription/:dossierInscriptionId/historique', auth, historyController.getHistorique);
```

#### 4.2 Mettre à Jour les Routes Existantes
- [ ] Modifier les routes d'inscription
- [ ] Modifier les routes de complétude
- [ ] Tester tous les endpoints avec Postman/Insomnia

### Phase 5 : Tests (2-3 jours)

#### 5.1 Tests Unitaires
- [ ] Exécuter tous les tests unitaires
- [ ] Vérifier la couverture de code (> 85%)
- [ ] Corriger les tests échoués

#### 5.2 Tests d'Intégration
- [ ] Tester le workflow complet "Upload Once, Use Everywhere"
- [ ] Tester la création d'inscription avec DossierInscription
- [ ] Tester la mise à jour de pièce de base (impact multi-concours)
- [ ] Tester la vue agrégée

#### 5.3 Tests de Migration
- [ ] Tester la migration sur une copie de la base de développement
- [ ] Vérifier l'intégrité des données après migration
- [ ] Tester le rollback
- [ ] Exécuter le script de vérification

#### 5.4 Tests de Non-Régression
- [ ] Vérifier que toutes les fonctionnalités existantes fonctionnent
- [ ] Tester tous les endpoints API
- [ ] Vérifier les permissions

### Phase 6 : Migration en Production (1 jour)

#### 6.1 Préparation
- [ ] Créer une sauvegarde complète de la base de données de production
- [ ] Planifier une fenêtre de maintenance
- [ ] Préparer un plan de rollback
- [ ] Notifier les utilisateurs

#### 6.2 Exécution
```bash
# 1. Sauvegarder la base de données
pg_dump -h <host> -U <user> -d <database> > backup_pre_migration.sql

# 2. Appliquer la migration
npx prisma migrate deploy

# 3. Vérifier la migration
node scripts/verify-migration.js

# 4. Redémarrer l'application
pm2 restart unipath-api

# 5. Vérifier les logs
pm2 logs unipath-api --lines 100
```

#### 6.3 Vérification Post-Migration
- [ ] Exécuter le script de vérification
- [ ] Tester les endpoints critiques
- [ ] Vérifier les logs d'erreur
- [ ] Monitorer les performances

#### 6.4 Rollback (si nécessaire)
```bash
# 1. Arrêter l'application
pm2 stop unipath-api

# 2. Restaurer la sauvegarde
psql -h <host> -U <user> -d <database> < backup_pre_migration.sql

# 3. Revenir à la version précédente du code
git checkout main
npm install
npx prisma generate

# 4. Redémarrer l'application
pm2 start unipath-api
```

### Phase 7 : Documentation et Formation (1 jour)

#### 7.1 Documentation Technique
- [ ] Mettre à jour la documentation API
- [ ] Documenter les nouveaux endpoints
- [ ] Mettre à jour les diagrammes d'architecture
- [ ] Créer un guide de dépannage

#### 7.2 Documentation Utilisateur
- [ ] Créer un guide utilisateur "Upload Once, Use Everywhere"
- [ ] Documenter le nouveau workflow d'inscription
- [ ] Créer des captures d'écran/vidéos explicatives

#### 7.3 Formation
- [ ] Former l'équipe de développement
- [ ] Former l'équipe support
- [ ] Former les administrateurs DGES

## Checklist Finale

### Avant le Déploiement
- [ ] Tous les tests passent (unitaires, intégration, migration)
- [ ] Couverture de code > 85%
- [ ] Code review complété
- [ ] Documentation à jour
- [ ] Sauvegarde de la base de données créée
- [ ] Plan de rollback préparé
- [ ] Fenêtre de maintenance planifiée
- [ ] Utilisateurs notifiés

### Après le Déploiement
- [ ] Migration exécutée avec succès
- [ ] Script de vérification passé
- [ ] Tests de non-régression passés
- [ ] Aucune erreur dans les logs
- [ ] Performances acceptables
- [ ] Utilisateurs informés du succès
- [ ] Documentation publiée

## Contacts et Support

- **Lead Développeur** : [Nom]
- **DevOps** : [Nom]
- **Product Owner** : [Nom]
- **Support** : [Email/Slack]

## Ressources

- **Repository Git** : [URL]
- **Documentation API** : [URL]
- **Environnement de Dev** : [URL]
- **Environnement de Staging** : [URL]
- **Environnement de Production** : [URL]

