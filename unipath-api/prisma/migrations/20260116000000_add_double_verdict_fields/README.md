# Migration: Commission à Double Verdict

**Date**: 16 janvier 2026  
**Nom**: `add_double_verdict_fields`  
**Statut**: ✅ Appliquée avec succès

## Résumé

Cette migration ajoute les champs nécessaires pour implémenter le système de **commission à double verdict** dans UniPath. Le système permet une double évaluation indépendante par 2 examinateurs, suivie d'une validation ou modification par un contrôleur.

## Modifications apportées

### 1. Nouveaux Enums

- **`Verdict`**: Enum pour les verdicts des examinateurs et du contrôleur
  - `VALIDE`
  - `REJETE`
  - `SOUS_RESERVE`

- **`SousRoleCommission`**: Enum pour les sous-rôles des membres de la commission
  - `EXAMINATEUR`
  - `CONTROLEUR`

### 2. Modifications du modèle `MembreCommission`

- Ajout du champ `sousRole` de type `SousRoleCommission`
- Ajout d'un index sur `sousRole` pour optimiser les requêtes

### 3. Nouvelle table `DossierInscription`

Création d'une table dédiée pour gérer les dossiers d'inscription avec les champs suivants :

**Champs de base:**
- `id`: Identifiant unique (UUID)
- `inscriptionId`: Référence à l'inscription (relation 1-1)
- `quittanceUrl`: URL de la quittance de paiement
- `piecesExtras`: Pièces personnalisées (JSON)
- `statut`: Statut du dossier (enum `StatutDossier`)

**Verdict Examinateur 1:**
- `verdict1Par`: ID de l'examinateur 1
- `verdict1`: Verdict rendu (enum `Verdict`)
- `verdict1Motif`: Motif du verdict
- `verdict1Date`: Date de soumission
- `verdict1ModifieCount`: Compteur de modifications (max 1)

**Verdict Examinateur 2:**
- `verdict2Par`: ID de l'examinateur 2
- `verdict2`: Verdict rendu (enum `Verdict`)
- `verdict2Motif`: Motif du verdict
- `verdict2Date`: Date de soumission
- `verdict2ModifieCount`: Compteur de modifications (max 1)

**Décision Contrôleur:**
- `decisionControleur`: Décision finale (enum `Verdict`)
- `decisionControleurMotif`: Motif de la décision
- `decisionControleurDate`: Date de la décision
- `decisionControleurPar`: ID du contrôleur

**Champs de compatibilité:**
- `commentaireRejet`: Commentaire en cas de rejet
- `commentaireSousReserve`: Commentaire en cas de validation sous réserve
- `decisionCommissionPar`: ID du membre commission (ancien système)
- `decisionCommissionDate`: Date de décision commission (ancien système)
- `commentaireControleur`: Commentaire du contrôleur (ancien système)

**Timestamps:**
- `createdAt`: Date de création
- `updatedAt`: Date de dernière mise à jour

### 4. Index créés

**Sur `DossierInscription`:**
- `DossierInscription_inscriptionId_key` (UNIQUE)
- `DossierInscription_inscriptionId_idx`
- `DossierInscription_statut_idx`
- `DossierInscription_verdict1Par_idx`
- `DossierInscription_verdict2Par_idx`
- `DossierInscription_decisionControleurPar_idx`
- `DossierInscription_createdAt_idx`

**Sur `MembreCommission`:**
- `MembreCommission_sousRole_idx`

**Sur `Inscription`:**
- `Inscription_candidatId_idx`
- `Inscription_concoursId_idx`

### 5. Modifications du modèle `ActionHistory`

- Ajout du champ `dossierInscriptionId` pour référencer les dossiers d'inscription
- Migration des données de `dossierId` vers `dossierInscriptionId`
- Suppression des anciens index sur `dossierId`
- Création de nouveaux index sur `dossierInscriptionId`
- Ajout d'une foreign key vers `DossierInscription`

**Note**: La colonne `dossierId` est conservée temporairement pour assurer la compatibilité pendant la transition.

### 6. Foreign Keys

- `DossierInscription.inscriptionId` → `Inscription.id` (CASCADE)
- `ActionHistory.dossierInscriptionId` → `DossierInscription.id` (CASCADE)

## Migration des données

Les données existantes dans la table `Inscription` ont été migrées vers `DossierInscription` :
- Les champs `quittanceUrl`, `piecesExtras`, `statut`, `commentaireRejet`, `commentaireSousReserve`, `decisionCommissionPar`, `decisionCommissionDate`, `decisionControleurPar`, `commentaireControleur` ont été copiés.
- Les nouveaux champs de double verdict sont initialisés à `NULL`.

**Résultat**: 0 dossiers migrés (base de données vide au moment de la migration).

## Compatibilité

Cette migration préserve la compatibilité avec les modules existants :
- Les anciens champs de `Inscription` sont conservés temporairement
- La colonne `dossierId` dans `ActionHistory` est conservée
- Les enums et types existants ne sont pas modifiés

## Prochaines étapes

1. ✅ Migration appliquée
2. ✅ Client Prisma généré
3. ⏳ Implémenter les contrôleurs backend (tâches 3.x, 4.x, 5.x)
4. ⏳ Créer les routes API (tâches 7.x)
5. ⏳ Implémenter les interfaces frontend (tâches 11.x, 12.x)

## Rollback

Pour annuler cette migration, exécuter les commandes suivantes :

```sql
-- Supprimer les foreign keys
ALTER TABLE "ActionHistory" DROP CONSTRAINT IF EXISTS "ActionHistory_dossierInscriptionId_fkey";
ALTER TABLE "DossierInscription" DROP CONSTRAINT IF EXISTS "DossierInscription_inscriptionId_fkey";

-- Supprimer les index
DROP INDEX IF EXISTS "DossierInscription_inscriptionId_key";
DROP INDEX IF EXISTS "DossierInscription_inscriptionId_idx";
DROP INDEX IF EXISTS "DossierInscription_statut_idx";
DROP INDEX IF EXISTS "DossierInscription_verdict1Par_idx";
DROP INDEX IF EXISTS "DossierInscription_verdict2Par_idx";
DROP INDEX IF EXISTS "DossierInscription_decisionControleurPar_idx";
DROP INDEX IF EXISTS "DossierInscription_createdAt_idx";
DROP INDEX IF EXISTS "MembreCommission_sousRole_idx";
DROP INDEX IF EXISTS "ActionHistory_dossierInscriptionId_idx";
DROP INDEX IF EXISTS "ActionHistory_dossierInscriptionId_timestamp_idx";

-- Supprimer la table DossierInscription
DROP TABLE IF EXISTS "DossierInscription";

-- Supprimer le champ sousRole
ALTER TABLE "MembreCommission" DROP COLUMN IF EXISTS "sousRole";

-- Supprimer le champ dossierInscriptionId
ALTER TABLE "ActionHistory" DROP COLUMN IF EXISTS "dossierInscriptionId";

-- Recréer les anciens index sur dossierId
CREATE INDEX "ActionHistory_dossierId_idx" ON "ActionHistory"("dossierId");
CREATE INDEX "ActionHistory_dossierId_timestamp_idx" ON "ActionHistory"("dossierId", "timestamp" DESC);

-- Supprimer les enums
DROP TYPE IF EXISTS "Verdict";
DROP TYPE IF EXISTS "SousRoleCommission";
```

## Vérification

Pour vérifier que la migration a été appliquée correctement :

```bash
npx prisma migrate status
npx prisma generate
```

Tous les tests de vérification ont été passés avec succès ✅
