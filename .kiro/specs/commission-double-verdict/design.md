# Document de Design - Commission à Double Verdict

## Overview

Ce module implémente un système de **commission à double verdict** pour l'évaluation des dossiers d'inscription aux concours universitaires dans UniPath.

### Principe Fondamental

Chaque dossier candidat est examiné indépendamment par **2 examinateurs** qui rendent chacun un verdict (VALIDE, REJETE, SOUS_RESERVE). Un **contrôleur** peut intervenir dès qu'au moins 1 examinateur a rendu son verdict pour confirmer ou modifier la décision.

**Règles clés :**
- Les verdicts des examinateurs sont **modifiables une seule fois** par leur auteur
- Un examinateur ne peut **jamais** modifier le verdict d'un autre examinateur
- Le contrôleur peut modifier sa propre décision **plusieurs fois**
- Les dossiers **disparaissent automatiquement** de la liste d'un examinateur après qu'il ait rendu son verdict
- Les motifs sont **obligatoires** pour les verdicts REJETE et SOUS_RESERVE (validation backend)

### Objectifs

1. **Garantir l'équité** : Double évaluation indépendante sans influence mutuelle
2. **Assurer la traçabilité** : Historique complet de toutes les décisions via ActionHistory
3. **Détecter les divergences** : Alertes automatiques quand les 2 examinateurs sont en désaccord
4. **Permettre la flexibilité** : Le contrôleur peut intervenir tôt ou tard dans le processus
5. **Maintenir l'intégrité** : Modification unique des verdicts, motifs obligatoires

## Architecture

Voir le fichier requirements.md pour les détails complets des exigences.

Le design technique complet sera ajouté dans les prochaines itérations.

## TODO

- Schéma Prisma détaillé avec extensions
- Endpoints API complets
- Contrôleurs backend
- Middlewares de sécurité
- Diagrammes de séquence
- Gestion des erreurs
- Tests et migration



## Components and Interfaces

### Schéma Prisma - Extensions Nécessaires

#### Extension 1 : Ajout du champ `sousRole` à `MembreCommission`

```prisma
model MembreCommission {
  id        String             @id @default(uuid())
  nom       String
  prenom    String
  email     String             @unique
  telephone String?
  role      Role               @default(COMMISSION)
  sousRole  SousRoleCommission // ✅ NOUVEAU
  createdAt DateTime           @default(now())
  updatedAt DateTime           @updatedAt
  
  @@index([sousRole])
}

enum SousRoleCommission {
  EXAMINATEUR
  CONTROLEUR
}
```

#### Extension 2 : Ajout des champs de double verdict à `DossierInscription`

```prisma
model DossierInscription {
  id            String @id @default(uuid())
  inscriptionId String @unique
  
  // Pièces spécifiques (existant)
  quittanceUrl String?
  piecesExtras Json?
  statut StatutDossier @default(EN_ATTENTE)
  
  // ✅ NOUVEAU : Verdict Examinateur 1
  verdict1Par          String?   // ID du premier examinateur
  verdict1             Verdict?  // VALIDE | REJETE | SOUS_RESERVE
  verdict1Motif        String?   // Motif obligatoire si REJETE ou SOUS_RESERVE
  verdict1Date         DateTime? // Date de soumission
  verdict1ModifieCount Int       @default(0) // Compteur de modifications (max 1)
  
  // ✅ NOUVEAU : Verdict Examinateur 2
  verdict2Par          String?   // ID du deuxième examinateur
  verdict2             Verdict?  // VALIDE | REJETE | SOUS_RESERVE
  verdict2Motif        String?   // Motif obligatoire si REJETE ou SOUS_RESERVE
  verdict2Date         DateTime? // Date de soumission
  verdict2ModifieCount Int       @default(0) // Compteur de modifications (max 1)
  
  // ✅ NOUVEAU : Décision Contrôleur
  decisionControleurPar   String?   // ID du contrôleur
  decisionControleur      Verdict?  // VALIDE | REJETE | SOUS_RESERVE
  decisionControleurMotif String?   // Motif obligatoire si REJETE ou SOUS_RESERVE
  decisionControleurDate  DateTime? // Date de la décision
  
  // Anciens champs (conservés pour compatibilité)
  commentaireRejet       String?
  commentaireSousReserve String?
  decisionCommissionPar  String?
  decisionCommissionDate DateTime?
  commentaireControleur  String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  inscription   Inscription     @relation(fields: [inscriptionId], references: [id], onDelete: Cascade)
  actionHistory ActionHistory[]
  
  @@index([inscriptionId])
  @@index([statut])
  @@index([verdict1Par])
  @@index([verdict2Par])
  @@index([decisionControleurPar])
  @@index([createdAt])
}

enum Verdict {
  VALIDE
  REJETE
  SOUS_RESERVE
}
```

### Endpoints API

#### Groupe 1 : Endpoints Examinateur

##### GET `/api/examinateur/dossiers-a-evaluer`
**Description** : Liste des dossiers en attente d'évaluation (exclut les dossiers déjà évalués par l'examinateur)

**Permissions** : COMMISSION avec sousRole=EXAMINATEUR

**Query Parameters** :
- `concoursId` (optionnel) : Filtrer par concours
- `limite` (optionnel, défaut: 50)
- `offset` (optionnel, défaut: 0)

**Réponse** :
```json
{
  "dossiers": [
    {
      "dossierInscriptionId": "uuid",
      "inscription": {
        "numeroInscription": "UAC-2024-MED-00123",
        "candidat": { "nom": "DOE", "prenom": "John" },
        "concours": { "libelle": "Médecine 2024" }
      },
      "completude": 100,
      "dateCreation": "2024-01-16T08:00:00Z",
      "autreVerdictRendu": true,
      "nombreVerdictsRendus": 1
    }
  ],
  "pagination": { "total": 25, "limite": 50, "offset": 0 }
}
```

##### GET `/api/examinateur/dossiers/:dossierInscriptionId`
**Description** : Détail complet d'un dossier (sans voir les verdicts des autres)

**Permissions** : COMMISSION avec sousRole=EXAMINATEUR

##### POST `/api/examinateur/dossiers/:dossierInscriptionId/verdict`
**Description** : Rendre un verdict sur un dossier

**Body** :
```json
{
  "verdict": "VALIDE",
  "motif": "Obligatoire si REJETE ou SOUS_RESERVE"
}
```

##### PUT `/api/examinateur/dossiers/:dossierInscriptionId/verdict`
**Description** : Modifier son propre verdict (une seule fois)

#### Groupe 2 : Endpoints Contrôleur

##### GET `/api/controleur/tableau-de-bord`
**Description** : Indicateurs clés (nombre de dossiers, taux de divergence, etc.)

##### GET `/api/controleur/dossiers`
**Description** : Liste des dossiers avec au moins 1 verdict

**Query Parameters** :
- `filtre` : `1_verdict` | `2_verdicts` | `divergents` | `sans_decision`

##### GET `/api/controleur/dossiers/divergents`
**Description** : Liste des dossiers avec verdicts divergents uniquement

##### GET `/api/controleur/dossiers/:dossierInscriptionId`
**Description** : Détail complet avec tous les verdicts visibles

##### POST `/api/controleur/dossiers/:dossierInscriptionId/decision`
**Description** : Rendre une décision finale

**Body** :
```json
{
  "decision": "VALIDE",
  "motif": "Obligatoire si REJETE ou SOUS_RESERVE"
}
```

##### PUT `/api/controleur/dossiers/:dossierInscriptionId/decision`
**Description** : Modifier la décision finale (modifications multiples autorisées)



## Contrôleurs Backend

### `examinateur.controller.js`

```javascript
const prisma = require('../prisma');

/**
 * Liste des dossiers à évaluer par l'examinateur connecté
 * Exclut automatiquement les dossiers déjà évalués par cet examinateur
 */
exports.getDossiersAEvaluer = async (req, res) => {
  try {
    const examinateurId = req.user.id;
    const { concoursId, limite = 50, offset = 0 } = req.query;

    const whereClause = {
      // Dossiers avec au moins une place disponible
      OR: [
        // Cas 1 : Aucun verdict rendu
        { verdict1Par: null, verdict2Par: null },
        // Cas 2 : verdict1 rendu par un autre, verdict2 libre
        { verdict1Par: { not: examinateurId }, verdict2Par: null },
        // Cas 3 : verdict2 rendu par un autre, verdict1 libre
        { verdict1Par: null, verdict2Par: { not: examinateurId } }
      ],
      // Exclure les dossiers où l'examinateur a déjà rendu son verdict
      NOT: {
        OR: [
          { verdict1Par: examinateurId },
          { verdict2Par: examinateurId }
        ]
      }
    };

    if (concoursId) {
      whereClause.inscription = { concoursId };
    }

    const [dossiers, total] = await Promise.all([
      prisma.dossierInscription.findMany({
        where: whereClause,
        include: {
          inscription: {
            include: {
              candidat: { select: { nom: true, prenom: true, email: true } },
              concours: { select: { libelle: true, etablissement: true } }
            }
          }
        },
        orderBy: { createdAt: 'asc' },
        take: parseInt(limite),
        skip: parseInt(offset)
      }),
      prisma.dossierInscription.count({ where: whereClause })
    ]);

    const dossiersFormates = dossiers.map(d => ({
      dossierInscriptionId: d.id,
      inscription: {
        numeroInscription: d.inscription.numeroInscription,
        candidat: d.inscription.candidat,
        concours: d.inscription.concours
      },
      dateCreation: d.createdAt,
      autreVerdictRendu: !!(d.verdict1Par || d.verdict2Par),
      nombreVerdictsRendus: (d.verdict1Par ? 1 : 0) + (d.verdict2Par ? 1 : 0)
    }));

    res.json({
      dossiers: dossiersFormates,
      pagination: {
        total,
        limite: parseInt(limite),
        offset: parseInt(offset),
        pages: Math.ceil(total / parseInt(limite))
      }
    });
  } catch (error) {
    console.error('Erreur getDossiersAEvaluer:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Détail d'un dossier pour examinateur (sans voir les verdicts des autres)
 */
exports.getDetailDossier = async (req, res) => {
  try {
    const { dossierInscriptionId } = req.params;
    const examinateurId = req.user.id;

    const dossier = await prisma.dossierInscription.findUnique({
      where: { id: dossierInscriptionId },
      include: {
        inscription: {
          include: {
            candidat: {
              include: { dossier: true }
            },
            concours: true
          }
        }
      }
    });

    if (!dossier) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }

    // Déterminer si l'examinateur a déjà rendu son verdict
    const monVerdictRendu = dossier.verdict1Par === examinateurId || dossier.verdict2Par === examinateurId;
    let monVerdict = null;
    let modificationsPossibles = 1;

    if (dossier.verdict1Par === examinateurId) {
      monVerdict = {
        verdict: dossier.verdict1,
        motif: dossier.verdict1Motif,
        date: dossier.verdict1Date
      };
      modificationsPossibles = 1 - dossier.verdict1ModifieCount;
    } else if (dossier.verdict2Par === examinateurId) {
      monVerdict = {
        verdict: dossier.verdict2,
        motif: dossier.verdict2Motif,
        date: dossier.verdict2Date
      };
      modificationsPossibles = 1 - dossier.verdict2ModifieCount;
    }

    // Construire la réponse (sans révéler les verdicts des autres)
    res.json({
      dossierInscription: {
        id: dossier.id,
        statut: dossier.statut,
        createdAt: dossier.createdAt
      },
      inscription: {
        numeroInscription: dossier.inscription.numeroInscription,
        candidat: {
          nom: dossier.inscription.candidat.nom,
          prenom: dossier.inscription.candidat.prenom,
          email: dossier.inscription.candidat.email,
          anip: dossier.inscription.candidat.anip,
          serie: dossier.inscription.candidat.serie
        },
        concours: {
          libelle: dossier.inscription.concours.libelle,
          etablissement: dossier.inscription.concours.etablissement
        }
      },
      piecesBase: {
        acteNaissance: { url: dossier.inscription.candidat.dossier?.acteNaissance, statut: dossier.inscription.candidat.dossier?.acteNaissance ? 'fournie' : 'manquante' },
        carteIdentite: { url: dossier.inscription.candidat.dossier?.carteIdentite, statut: dossier.inscription.candidat.dossier?.carteIdentite ? 'fournie' : 'manquante' },
        photo: { url: dossier.inscription.candidat.dossier?.photo, statut: dossier.inscription.candidat.dossier?.photo ? 'fournie' : 'manquante' },
        releve: { url: dossier.inscription.candidat.dossier?.releve, statut: dossier.inscription.candidat.dossier?.releve ? 'fournie' : 'manquante' }
      },
      piecesSpecifiques: {
        quittance: { url: dossier.quittanceUrl, statut: dossier.quittanceUrl ? 'fournie' : 'manquante' }
      },
      monVerdict: {
        rendu: monVerdictRendu,
        verdict: monVerdict?.verdict || null,
        motif: monVerdict?.motif || null,
        date: monVerdict?.date || null,
        modificationsPossibles
      },
      autreVerdictRendu: (dossier.verdict1Par && dossier.verdict1Par !== examinateurId) || 
                         (dossier.verdict2Par && dossier.verdict2Par !== examinateurId)
    });
  } catch (error) {
    console.error('Erreur getDetailDossier:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Rendre un verdict sur un dossier
 */
exports.rendreVerdict = async (req, res) => {
  try {
    const { dossierInscriptionId } = req.params;
    const { verdict, motif } = req.body;
    const examinateurId = req.user.id;

    // Validation
    if (!['VALIDE', 'REJETE', 'SOUS_RESERVE'].includes(verdict)) {
      return res.status(400).json({ error: 'Verdict invalide' });
    }

    if ((verdict === 'REJETE' || verdict === 'SOUS_RESERVE') && (!motif || motif.trim().length < 10)) {
      return res.status(400).json({ 
        error: `Le motif est obligatoire pour un ${verdict === 'REJETE' ? 'rejet' : 'validation sous réserve'} (minimum 10 caractères)` 
      });
    }

    const dossier = await prisma.dossierInscription.findUnique({
      where: { id: dossierInscriptionId },
      include: { inscription: { include: { candidat: true, concours: true } } }
    });

    if (!dossier) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }

    // Vérifier que l'examinateur n'a pas déjà rendu son verdict
    if (dossier.verdict1Par === examinateurId || dossier.verdict2Par === examinateurId) {
      return res.status(403).json({ error: 'Vous avez déjà rendu votre verdict sur ce dossier' });
    }

    // Vérifier qu'il reste une place disponible
    if (dossier.verdict1Par && dossier.verdict2Par) {
      return res.status(403).json({ error: 'Les 2 verdicts ont déjà été rendus sur ce dossier' });
    }

    // Assigner au premier champ disponible
    const numeroVerdict = !dossier.verdict1Par ? 1 : 2;
    const updateData = numeroVerdict === 1 ? {
      verdict1Par: examinateurId,
      verdict1: verdict,
      verdict1Motif: motif || null,
      verdict1Date: new Date(),
      verdict1ModifieCount: 0
    } : {
      verdict2Par: examinateurId,
      verdict2: verdict,
      verdict2Motif: motif || null,
      verdict2Date: new Date(),
      verdict2ModifieCount: 0
    };

    // Transaction : mettre à jour le dossier + enregistrer l'action
    const result = await prisma.$transaction(async (tx) => {
      const dossierMisAJour = await tx.dossierInscription.update({
        where: { id: dossierInscriptionId },
        data: updateData
      });

      await tx.actionHistory.create({
        data: {
          utilisateurId: examinateurId,
          dossierInscriptionId,
          typeAction: 'VERDICT_EXAMINATEUR_RENDU',
          details: { numeroVerdict, verdict, motif },
          ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent']
        }
      });

      return dossierMisAJour;
    });

    // Créer une notification pour le contrôleur
    const controleur = await prisma.membreCommission.findFirst({
      where: { sousRole: 'CONTROLEUR' }
    });

    if (controleur) {
      const nombreVerdictsRendus = (result.verdict1Par ? 1 : 0) + (result.verdict2Par ? 1 : 0);
      await prisma.notification.create({
        data: {
          userId: controleur.id,
          type: 'NOUVEAU_DOSSIER',
          priority: 'NORMAL',
          title: `Nouveau verdict rendu (${nombreVerdictsRendus}/2)`,
          message: `Un examinateur a rendu son verdict sur le dossier ${dossier.inscription.numeroInscription} (${dossier.inscription.candidat.nom} ${dossier.inscription.candidat.prenom})`,
          data: {
            dossierInscriptionId,
            numeroInscription: dossier.inscription.numeroInscription,
            nombreVerdictsRendus
          }
        }
      });

      // Si 2 verdicts et divergents, créer une alerte HIGH
      if (result.verdict1 && result.verdict2 && result.verdict1 !== result.verdict2) {
        await prisma.notification.create({
          data: {
            userId: controleur.id,
            type: 'ALERTE',
            priority: 'HIGH',
            title: '⚠️ Verdicts divergents détectés',
            message: `Le dossier ${dossier.inscription.numeroInscription} a des verdicts divergents : Examinateur 1 = ${result.verdict1}, Examinateur 2 = ${result.verdict2}`,
            data: {
              dossierInscriptionId,
              verdict1: result.verdict1,
              verdict2: result.verdict2
            }
          }
        });
      }
    }

    res.status(201).json({
      message: 'Verdict enregistré avec succès',
      verdict: {
        numeroVerdict,
        verdict,
        motif,
        date: numeroVerdict === 1 ? result.verdict1Date : result.verdict2Date
      },
      dossierInscription: {
        id: result.id,
        nombreVerdictsRendus: (result.verdict1Par ? 1 : 0) + (result.verdict2Par ? 1 : 0),
        decisionControleurRendue: !!result.decisionControleur
      }
    });
  } catch (error) {
    console.error('Erreur rendreVerdict:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Modifier son propre verdict (une seule fois autorisée)
 */
exports.modifierVerdict = async (req, res) => {
  try {
    const { dossierInscriptionId } = req.params;
    const { verdict, motif } = req.body;
    const examinateurId = req.user.id;

    // Validation
    if (!['VALIDE', 'REJETE', 'SOUS_RESERVE'].includes(verdict)) {
      return res.status(400).json({ error: 'Verdict invalide' });
    }

    if ((verdict === 'REJETE' || verdict === 'SOUS_RESERVE') && (!motif || motif.trim().length < 10)) {
      return res.status(400).json({ 
        error: `Le motif est obligatoire pour un ${verdict === 'REJETE' ? 'rejet' : 'validation sous réserve'} (minimum 10 caractères)` 
      });
    }

    const dossier = await prisma.dossierInscription.findUnique({
      where: { id: dossierInscriptionId }
    });

    if (!dossier) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }

    // Vérifier que l'examinateur a bien rendu un verdict
    if (dossier.verdict1Par !== examinateurId && dossier.verdict2Par !== examinateurId) {
      return res.status(403).json({ error: 'Vous n\'avez pas encore rendu de verdict sur ce dossier' });
    }

    // Déterminer quel verdict modifier
    const numeroVerdict = dossier.verdict1Par === examinateurId ? 1 : 2;
    const modifieCount = numeroVerdict === 1 ? dossier.verdict1ModifieCount : dossier.verdict2ModifieCount;

    // Vérifier que la modification est autorisée (max 1)
    if (modifieCount >= 1) {
      return res.status(403).json({ 
        error: 'Vous avez déjà modifié votre verdict. Aucune modification supplémentaire n\'est autorisée.' 
      });
    }

    // Mettre à jour le verdict
    const updateData = numeroVerdict === 1 ? {
      verdict1: verdict,
      verdict1Motif: motif || null,
      verdict1Date: new Date(),
      verdict1ModifieCount: modifieCount + 1
    } : {
      verdict2: verdict,
      verdict2Motif: motif || null,
      verdict2Date: new Date(),
      verdict2ModifieCount: modifieCount + 1
    };

    const result = await prisma.$transaction(async (tx) => {
      const dossierMisAJour = await tx.dossierInscription.update({
        where: { id: dossierInscriptionId },
        data: updateData
      });

      await tx.actionHistory.create({
        data: {
          utilisateurId: examinateurId,
          dossierInscriptionId,
          typeAction: 'VERDICT_EXAMINATEUR_MODIFIE',
          details: { numeroVerdict, ancienVerdict: numeroVerdict === 1 ? dossier.verdict1 : dossier.verdict2, nouveauVerdict: verdict, motif },
          ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent']
        }
      });

      return dossierMisAJour;
    });

    res.json({
      message: 'Verdict modifié avec succès',
      verdict: {
        numeroVerdict,
        verdict,
        motif,
        date: numeroVerdict === 1 ? result.verdict1Date : result.verdict2Date,
        modificationsPossibles: 0
      }
    });
  } catch (error) {
    console.error('Erreur modifierVerdict:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = exports;
```



### `controleur.controller.js`

```javascript
const prisma = require('../prisma');
const emailService = require('../services/email.service');

/**
 * Tableau de bord avec indicateurs clés
 */
exports.getTableauDeBord = async (req, res) => {
  try {
    // Compter les dossiers par catégorie
    const [dossiersAvec1Verdict, dossiersAvec2Verdicts, dossiersAvecDecision] = await Promise.all([
      prisma.dossierInscription.count({
        where: {
          OR: [
            { verdict1Par: { not: null }, verdict2Par: null },
            { verdict1Par: null, verdict2Par: { not: null } }
          ]
        }
      }),
      prisma.dossierInscription.count({
        where: {
          verdict1Par: { not: null },
          verdict2Par: { not: null }
        }
      }),
      prisma.dossierInscription.count({
        where: { decisionControleur: { not: null } }
      })
    ]);

    // Compter les verdicts divergents
    const dossiers2Verdicts = await prisma.dossierInscription.findMany({
      where: {
        verdict1Par: { not: null },
        verdict2Par: { not: null }
      },
      select: { verdict1: true, verdict2: true }
    });

    const dossiersVerdictsDivergents = dossiers2Verdicts.filter(
      d => d.verdict1 !== d.verdict2
    ).length;

    const tauxDivergence = dossiersAvec2Verdicts > 0
      ? ((dossiersVerdictsDivergents / dossiersAvec2Verdicts) * 100).toFixed(2)
      : 0;

    // Répartition des verdicts
    const tousLesDossiers = await prisma.dossierInscription.findMany({
      where: {
        OR: [
          { verdict1: { not: null } },
          { verdict2: { not: null } }
        ]
      },
      select: { verdict1: true, verdict2: true }
    });

    const repartitionVerdicts = {
      verdict1: { VALIDE: 0, REJETE: 0, SOUS_RESERVE: 0 },
      verdict2: { VALIDE: 0, REJETE: 0, SOUS_RESERVE: 0 }
    };

    tousLesDossiers.forEach(d => {
      if (d.verdict1) repartitionVerdicts.verdict1[d.verdict1]++;
      if (d.verdict2) repartitionVerdicts.verdict2[d.verdict2]++;
    });

    res.json({
      indicateurs: {
        dossiersAvec1Verdict,
        dossiersAvec2Verdicts,
        dossiersVerdictsDivergents,
        dossiersAvecDecisionFinale: dossiersAvecDecision,
        tauxDivergence: parseFloat(tauxDivergence)
      },
      repartitionVerdicts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur getTableauDeBord:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Liste des dossiers avec au moins 1 verdict
 */
exports.getDossiers = async (req, res) => {
  try {
    const { filtre, concoursId, limite = 50, offset = 0 } = req.query;

    let whereClause = {
      OR: [
        { verdict1Par: { not: null } },
        { verdict2Par: { not: null } }
      ]
    };

    // Appliquer les filtres
    if (filtre === '1_verdict') {
      whereClause = {
        OR: [
          { verdict1Par: { not: null }, verdict2Par: null },
          { verdict1Par: null, verdict2Par: { not: null } }
        ]
      };
    } else if (filtre === '2_verdicts') {
      whereClause = {
        verdict1Par: { not: null },
        verdict2Par: { not: null }
      };
    } else if (filtre === 'sans_decision') {
      whereClause.decisionControleur = null;
    }

    if (concoursId) {
      whereClause.inscription = { concoursId };
    }

    const [dossiers, total] = await Promise.all([
      prisma.dossierInscription.findMany({
        where: whereClause,
        include: {
          inscription: {
            include: {
              candidat: { select: { nom: true, prenom: true, email: true } },
              concours: { select: { libelle: true, etablissement: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limite),
        skip: parseInt(offset)
      }),
      prisma.dossierInscription.count({ where: whereClause })
    ]);

    // Récupérer les noms des examinateurs
    const examinateurIds = [...new Set(dossiers.flatMap(d => [d.verdict1Par, d.verdict2Par].filter(Boolean)))];
    const examinateurs = await prisma.membreCommission.findMany({
      where: { id: { in: examinateurIds } },
      select: { id: true, nom: true, prenom: true }
    });
    const examinateursMap = Object.fromEntries(examinateurs.map(e => [e.id, `${e.nom} ${e.prenom}`]));

    const dossiersFormates = dossiers.map(d => {
      const verdictsDivergents = d.verdict1 && d.verdict2 && d.verdict1 !== d.verdict2;
      
      return {
        dossierInscriptionId: d.id,
        inscription: {
          numeroInscription: d.inscription.numeroInscription,
          candidat: d.inscription.candidat,
          concours: d.inscription.concours
        },
        verdicts: {
          verdict1: d.verdict1Par ? {
            verdict: d.verdict1,
            par: d.verdict1Par,
            nomExaminateur: examinateursMap[d.verdict1Par],
            date: d.verdict1Date,
            motif: d.verdict1Motif
          } : null,
          verdict2: d.verdict2Par ? {
            verdict: d.verdict2,
            par: d.verdict2Par,
            nomExaminateur: examinateursMap[d.verdict2Par],
            date: d.verdict2Date,
            motif: d.verdict2Motif
          } : null
        },
        statutVerdicts: `${(d.verdict1Par ? 1 : 0) + (d.verdict2Par ? 1 : 0)}/2`,
        verdictsDivergents,
        decisionFinale: d.decisionControleur,
        priorite: verdictsDivergents ? 'HIGH' : 'NORMAL',
        dateCreation: d.createdAt
      };
    });

    // Filtrer les divergents si demandé
    const dossiersFinaux = filtre === 'divergents'
      ? dossiersFormates.filter(d => d.verdictsDivergents)
      : dossiersFormates;

    res.json({
      dossiers: dossiersFinaux,
      pagination: {
        total: filtre === 'divergents' ? dossiersFinaux.length : total,
        limite: parseInt(limite),
        offset: parseInt(offset),
        pages: Math.ceil((filtre === 'divergents' ? dossiersFinaux.length : total) / parseInt(limite))
      }
    });
  } catch (error) {
    console.error('Erreur getDossiers:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Détail complet d'un dossier avec tous les verdicts
 */
exports.getDetailDossier = async (req, res) => {
  try {
    const { dossierInscriptionId } = req.params;

    const dossier = await prisma.dossierInscription.findUnique({
      where: { id: dossierInscriptionId },
      include: {
        inscription: {
          include: {
            candidat: { include: { dossier: true } },
            concours: true
          }
        },
        actionHistory: {
          orderBy: { timestamp: 'desc' },
          take: 50
        }
      }
    });

    if (!dossier) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }

    // Récupérer les noms des examinateurs
    const examinateurIds = [dossier.verdict1Par, dossier.verdict2Par].filter(Boolean);
    const examinateurs = await prisma.membreCommission.findMany({
      where: { id: { in: examinateurIds } },
      select: { id: true, nom: true, prenom: true }
    });
    const examinateursMap = Object.fromEntries(examinateurs.map(e => [e.id, { nom: e.nom, prenom: e.prenom }]));

    res.json({
      dossierInscription: {
        id: dossier.id,
        statut: dossier.statut,
        createdAt: dossier.createdAt,
        updatedAt: dossier.updatedAt
      },
      inscription: {
        numeroInscription: dossier.inscription.numeroInscription,
        candidat: {
          nom: dossier.inscription.candidat.nom,
          prenom: dossier.inscription.candidat.prenom,
          email: dossier.inscription.candidat.email,
          anip: dossier.inscription.candidat.anip,
          serie: dossier.inscription.candidat.serie,
          sexe: dossier.inscription.candidat.sexe,
          nationalite: dossier.inscription.candidat.nationalite
        },
        concours: {
          libelle: dossier.inscription.concours.libelle,
          etablissement: dossier.inscription.concours.etablissement,
          dateComposition: dossier.inscription.concours.dateComposition
        }
      },
      piecesBase: {
        acteNaissance: { url: dossier.inscription.candidat.dossier?.acteNaissance, statut: dossier.inscription.candidat.dossier?.acteNaissance ? 'fournie' : 'manquante' },
        carteIdentite: { url: dossier.inscription.candidat.dossier?.carteIdentite, statut: dossier.inscription.candidat.dossier?.carteIdentite ? 'fournie' : 'manquante' },
        photo: { url: dossier.inscription.candidat.dossier?.photo, statut: dossier.inscription.candidat.dossier?.photo ? 'fournie' : 'manquante' },
        releve: { url: dossier.inscription.candidat.dossier?.releve, statut: dossier.inscription.candidat.dossier?.releve ? 'fournie' : 'manquante' }
      },
      piecesSpecifiques: {
        quittance: { url: dossier.quittanceUrl, statut: dossier.quittanceUrl ? 'fournie' : 'manquante' }
      },
      verdicts: {
        verdict1: dossier.verdict1Par ? {
          verdict: dossier.verdict1,
          motif: dossier.verdict1Motif,
          date: dossier.verdict1Date,
          examinateur: examinateursMap[dossier.verdict1Par]
        } : null,
        verdict2: dossier.verdict2Par ? {
          verdict: dossier.verdict2,
          motif: dossier.verdict2Motif,
          date: dossier.verdict2Date,
          examinateur: examinateursMap[dossier.verdict2Par]
        } : null,
        divergents: dossier.verdict1 && dossier.verdict2 && dossier.verdict1 !== dossier.verdict2
      },
      decisionControleur: dossier.decisionControleur ? {
        decision: dossier.decisionControleur,
        motif: dossier.decisionControleurMotif,
        date: dossier.decisionControleurDate
      } : null,
      historique: dossier.actionHistory
    });
  } catch (error) {
    console.error('Erreur getDetailDossier:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Rendre une décision finale
 */
exports.rendreDecision = async (req, res) => {
  try {
    const { dossierInscriptionId } = req.params;
    const { decision, motif } = req.body;
    const controleurId = req.user.id;

    // Validation
    if (!['VALIDE', 'REJETE', 'SOUS_RESERVE'].includes(decision)) {
      return res.status(400).json({ error: 'Décision invalide' });
    }

    if ((decision === 'REJETE' || decision === 'SOUS_RESERVE') && (!motif || motif.trim().length < 10)) {
      return res.status(400).json({ 
        error: `Le motif est obligatoire pour un ${decision === 'REJETE' ? 'rejet' : 'validation sous réserve'} (minimum 10 caractères)` 
      });
    }

    const dossier = await prisma.dossierInscription.findUnique({
      where: { id: dossierInscriptionId },
      include: {
        inscription: {
          include: {
            candidat: true,
            concours: true
          }
        }
      }
    });

    if (!dossier) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }

    // Vérifier qu'au moins 1 verdict a été rendu
    if (!dossier.verdict1Par && !dossier.verdict2Par) {
      return res.status(400).json({ error: 'Aucun verdict n\'a encore été rendu sur ce dossier' });
    }

    // Mettre à jour le statut selon la décision
    let nouveauStatut = 'EN_ATTENTE';
    if (decision === 'VALIDE') nouveauStatut = 'VALIDE';
    else if (decision === 'REJETE') nouveauStatut = 'REJETE';
    else if (decision === 'SOUS_RESERVE') nouveauStatut = 'SOUS_RESERVE';

    // Transaction : mettre à jour + enregistrer action
    const result = await prisma.$transaction(async (tx) => {
      const dossierMisAJour = await tx.dossierInscription.update({
        where: { id: dossierInscriptionId },
        data: {
          decisionControleurPar: controleurId,
          decisionControleur: decision,
          decisionControleurMotif: motif || null,
          decisionControleurDate: new Date(),
          statut: nouveauStatut
        }
      });

      await tx.actionHistory.create({
        data: {
          utilisateurId: controleurId,
          dossierInscriptionId,
          typeAction: 'DECISION_CONTROLEUR_RENDUE',
          details: {
            decision,
            motif,
            nombreVerdictsPresents: (dossier.verdict1Par ? 1 : 0) + (dossier.verdict2Par ? 1 : 0)
          },
          ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent']
        }
      });

      return dossierMisAJour;
    });

    // Envoyer email au candidat
    const emailData = {
      candidatEmail: dossier.inscription.candidat.email,
      candidatNom: dossier.inscription.candidat.nom,
      candidatPrenom: dossier.inscription.candidat.prenom,
      concours: dossier.inscription.concours.libelle,
      numeroDossier: dossier.inscription.numeroInscription,
      motif
    };

    if (decision === 'VALIDE') {
      await emailService.envoyerEmailValidation(emailData);
    } else if (decision === 'REJETE') {
      await emailService.envoyerEmailRejet(emailData);
    } else if (decision === 'SOUS_RESERVE') {
      await emailService.envoyerEmailSousReserve(emailData);
    }

    // Créer notification pour le candidat
    await prisma.notification.create({
      data: {
        userId: dossier.inscription.candidat.id,
        type: decision === 'VALIDE' ? 'VALIDATION' : 'REJET',
        priority: 'HIGH',
        title: decision === 'VALIDE' ? '✅ Dossier validé' : decision === 'REJETE' ? '❌ Dossier rejeté' : '⚠️ Dossier accepté sous réserve',
        message: `Votre dossier pour le concours ${dossier.inscription.concours.libelle} a été ${decision === 'VALIDE' ? 'validé' : decision === 'REJETE' ? 'rejeté' : 'accepté sous réserve'}`,
        data: { dossierInscriptionId, decision, motif }
      }
    });

    res.status(201).json({
      message: 'Décision enregistrée avec succès',
      decision: {
        decision,
        motif,
        date: result.decisionControleurDate
      },
      dossierInscription: {
        id: result.id,
        statut: result.statut
      }
    });
  } catch (error) {
    console.error('Erreur rendreDecision:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Modifier la décision finale (modifications multiples autorisées)
 */
exports.modifierDecision = async (req, res) => {
  try {
    const { dossierInscriptionId } = req.params;
    const { decision, motif } = req.body;
    const controleurId = req.user.id;

    // Validation
    if (!['VALIDE', 'REJETE', 'SOUS_RESERVE'].includes(decision)) {
      return res.status(400).json({ error: 'Décision invalide' });
    }

    if ((decision === 'REJETE' || decision === 'SOUS_RESERVE') && (!motif || motif.trim().length < 10)) {
      return res.status(400).json({ 
        error: `Le motif est obligatoire pour un ${decision === 'REJETE' ? 'rejet' : 'validation sous réserve'} (minimum 10 caractères)` 
      });
    }

    const dossier = await prisma.dossierInscription.findUnique({
      where: { id: dossierInscriptionId },
      include: {
        inscription: {
          include: {
            candidat: true,
            concours: true
          }
        }
      }
    });

    if (!dossier) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }

    if (!dossier.decisionControleur) {
      return res.status(400).json({ error: 'Aucune décision n\'a encore été rendue sur ce dossier' });
    }

    const ancienneDecision = dossier.decisionControleur;

    // Mettre à jour le statut
    let nouveauStatut = 'EN_ATTENTE';
    if (decision === 'VALIDE') nouveauStatut = 'VALIDE';
    else if (decision === 'REJETE') nouveauStatut = 'REJETE';
    else if (decision === 'SOUS_RESERVE') nouveauStatut = 'SOUS_RESERVE';

    const result = await prisma.$transaction(async (tx) => {
      const dossierMisAJour = await tx.dossierInscription.update({
        where: { id: dossierInscriptionId },
        data: {
          decisionControleur: decision,
          decisionControleurMotif: motif || null,
          decisionControleurDate: new Date(),
          statut: nouveauStatut
        }
      });

      await tx.actionHistory.create({
        data: {
          utilisateurId: controleurId,
          dossierInscriptionId,
          typeAction: 'DECISION_CONTROLEUR_MODIFIEE',
          details: {
            ancienneDecision,
            nouvelleDecision: decision,
            motif
          },
          ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
          userAgent: req.headers['user-agent']
        }
      });

      return dossierMisAJour;
    });

    // Notifier le candidat et les examinateurs
    await prisma.notification.create({
      data: {
        userId: dossier.inscription.candidat.id,
        type: 'ALERTE',
        priority: 'HIGH',
        title: 'Décision modifiée',
        message: `La décision sur votre dossier ${dossier.inscription.numeroInscription} a été modifiée`,
        data: { dossierInscriptionId, ancienneDecision, nouvelleDecision: decision }
      }
    });

    // Notifier les examinateurs
    const examinateurIds = [dossier.verdict1Par, dossier.verdict2Par].filter(Boolean);
    for (const examinateurId of examinateurIds) {
      await prisma.notification.create({
        data: {
          userId: examinateurId,
          type: 'ALERTE',
          priority: 'NORMAL',
          title: 'Décision modifiée par le contrôleur',
          message: `La décision sur le dossier ${dossier.inscription.numeroInscription} a été modifiée : ${ancienneDecision} → ${decision}`,
          data: { dossierInscriptionId, ancienneDecision, nouvelleDecision: decision }
        }
      });
    }

    res.json({
      message: 'Décision modifiée avec succès',
      decision: {
        ancienneDecision,
        nouvelleDecision: decision,
        motif,
        date: result.decisionControleurDate
      }
    });
  } catch (error) {
    console.error('Erreur modifierDecision:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

module.exports = exports;
```



## Middlewares et Sécurité

### `auth.middleware.js` - Extension pour sous-rôles

```javascript
/**
 * Middleware pour vérifier le sous-rôle d'un membre de la commission
 */
const verifierSousRole = (sousRolesAutorises) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      // Vérifier que l'utilisateur est membre de la commission
      if (userRole !== 'COMMISSION') {
        return res.status(403).json({ 
          error: 'Accès refusé. Seuls les membres de la commission peuvent accéder à cette ressource.' 
        });
      }

      // Récupérer le membre de la commission avec son sous-rôle
      const membreCommission = await prisma.membreCommission.findUnique({
        where: { id: userId },
        select: { sousRole: true }
      });

      if (!membreCommission) {
        return res.status(404).json({ 
          error: 'Membre de la commission non trouvé' 
        });
      }

      // Vérifier que le sous-rôle est autorisé
      if (!sousRolesAutorises.includes(membreCommission.sousRole)) {
        return res.status(403).json({ 
          error: `Accès refusé. Cette ressource est réservée aux ${sousRolesAutorises.join(' et ')}.` 
        });
      }

      // Ajouter le sous-rôle à la requête
      req.user.sousRole = membreCommission.sousRole;
      next();
    } catch (error) {
      console.error('Erreur verifierSousRole:', error);
      res.status(500).json({ error: 'Erreur serveur lors de la vérification des permissions' });
    }
  };
};

module.exports = { verifierSousRole };
```

### Routes

#### `examinateur.routes.js`

```javascript
const express = require('express');
const router = express.Router();
const examinateurController = require('../controllers/examinateur.controller');
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const { verifierSousRole } = require('../middleware/auth.middleware');

// Toutes les routes nécessitent authentification + rôle COMMISSION + sous-rôle EXAMINATEUR
router.use(protect, checkRole(['COMMISSION']), verifierSousRole(['EXAMINATEUR']));

// Liste des dossiers à évaluer
router.get('/dossiers-a-evaluer', examinateurController.getDossiersAEvaluer);

// Détail d'un dossier
router.get('/dossiers/:dossierInscriptionId', examinateurController.getDetailDossier);

// Rendre un verdict
router.post('/dossiers/:dossierInscriptionId/verdict', examinateurController.rendreVerdict);

// Modifier son propre verdict (une seule fois)
router.put('/dossiers/:dossierInscriptionId/verdict', examinateurController.modifierVerdict);

module.exports = router;
```

#### `controleur.routes.js`

```javascript
const express = require('express');
const router = express.Router();
const controleurController = require('../controllers/controleur.controller');
const { protect } = require('../middleware/auth.middleware');
const { checkRole } = require('../middleware/role.middleware');
const { verifierSousRole } = require('../middleware/auth.middleware');

// Toutes les routes nécessitent authentification + rôle COMMISSION + sous-rôle CONTROLEUR
router.use(protect, checkRole(['COMMISSION']), verifierSousRole(['CONTROLEUR']));

// Tableau de bord
router.get('/tableau-de-bord', controleurController.getTableauDeBord);

// Liste des dossiers
router.get('/dossiers', controleurController.getDossiers);

// Liste des dossiers divergents
router.get('/dossiers/divergents', controleurController.getDossiers); // Même endpoint avec filtre

// Détail d'un dossier
router.get('/dossiers/:dossierInscriptionId', controleurController.getDetailDossier);

// Rendre une décision
router.post('/dossiers/:dossierInscriptionId/decision', controleurController.rendreDecision);

// Modifier la décision (modifications multiples autorisées)
router.put('/dossiers/:dossierInscriptionId/decision', controleurController.modifierDecision);

module.exports = router;
```

#### Intégration dans `server.js`

```javascript
// Ajouter les nouvelles routes
const examinateurRoutes = require('./routes/examinateur.routes');
const controleurRoutes = require('./routes/controleur.routes');

app.use('/api/examinateur', examinateurRoutes);
app.use('/api/controleur', controleurRoutes);
```

## Migration Prisma

### Fichier de migration

```prisma
-- Migration: Ajout du système de double verdict

-- Étape 1 : Ajouter l'enum SousRoleCommission
CREATE TYPE "SousRoleCommission" AS ENUM ('EXAMINATEUR', 'CONTROLEUR');

-- Étape 2 : Ajouter l'enum Verdict
CREATE TYPE "Verdict" AS ENUM ('VALIDE', 'REJETE', 'SOUS_RESERVE');

-- Étape 3 : Ajouter le champ sousRole à MembreCommission
ALTER TABLE "MembreCommission" ADD COLUMN "sousRole" "SousRoleCommission";

-- Étape 4 : Ajouter les champs de double verdict à DossierInscription
ALTER TABLE "DossierInscription" ADD COLUMN "verdict1Par" TEXT;
ALTER TABLE "DossierInscription" ADD COLUMN "verdict1" "Verdict";
ALTER TABLE "DossierInscription" ADD COLUMN "verdict1Motif" TEXT;
ALTER TABLE "DossierInscription" ADD COLUMN "verdict1Date" TIMESTAMP(3);
ALTER TABLE "DossierInscription" ADD COLUMN "verdict1ModifieCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "DossierInscription" ADD COLUMN "verdict2Par" TEXT;
ALTER TABLE "DossierInscription" ADD COLUMN "verdict2" "Verdict";
ALTER TABLE "DossierInscription" ADD COLUMN "verdict2Motif" TEXT;
ALTER TABLE "DossierInscription" ADD COLUMN "verdict2Date" TIMESTAMP(3);
ALTER TABLE "DossierInscription" ADD COLUMN "verdict2ModifieCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "DossierInscription" ADD COLUMN "decisionControleurPar" TEXT;
ALTER TABLE "DossierInscription" ADD COLUMN "decisionControleur" "Verdict";
ALTER TABLE "DossierInscription" ADD COLUMN "decisionControleurMotif" TEXT;
ALTER TABLE "DossierInscription" ADD COLUMN "decisionControleurDate" TIMESTAMP(3);

-- Étape 5 : Créer les index pour optimiser les requêtes
CREATE INDEX "DossierInscription_verdict1Par_idx" ON "DossierInscription"("verdict1Par");
CREATE INDEX "DossierInscription_verdict2Par_idx" ON "DossierInscription"("verdict2Par");
CREATE INDEX "DossierInscription_decisionControleurPar_idx" ON "DossierInscription"("decisionControleurPar");
CREATE INDEX "MembreCommission_sousRole_idx" ON "MembreCommission"("sousRole");
```

### Script de rollback

```sql
-- Rollback: Supprimer le système de double verdict

-- Supprimer les index
DROP INDEX IF EXISTS "DossierInscription_verdict1Par_idx";
DROP INDEX IF EXISTS "DossierInscription_verdict2Par_idx";
DROP INDEX IF EXISTS "DossierInscription_decisionControleurPar_idx";
DROP INDEX IF EXISTS "MembreCommission_sousRole_idx";

-- Supprimer les colonnes de DossierInscription
ALTER TABLE "DossierInscription" DROP COLUMN IF EXISTS "verdict1Par";
ALTER TABLE "DossierInscription" DROP COLUMN IF EXISTS "verdict1";
ALTER TABLE "DossierInscription" DROP COLUMN IF EXISTS "verdict1Motif";
ALTER TABLE "DossierInscription" DROP COLUMN IF EXISTS "verdict1Date";
ALTER TABLE "DossierInscription" DROP COLUMN IF EXISTS "verdict1ModifieCount";

ALTER TABLE "DossierInscription" DROP COLUMN IF EXISTS "verdict2Par";
ALTER TABLE "DossierInscription" DROP COLUMN IF EXISTS "verdict2";
ALTER TABLE "DossierInscription" DROP COLUMN IF EXISTS "verdict2Motif";
ALTER TABLE "DossierInscription" DROP COLUMN IF EXISTS "verdict2Date";
ALTER TABLE "DossierInscription" DROP COLUMN IF EXISTS "verdict2ModifieCount";

ALTER TABLE "DossierInscription" DROP COLUMN IF EXISTS "decisionControleurPar";
ALTER TABLE "DossierInscription" DROP COLUMN IF EXISTS "decisionControleur";
ALTER TABLE "DossierInscription" DROP COLUMN IF EXISTS "decisionControleurMotif";
ALTER TABLE "DossierInscription" DROP COLUMN IF EXISTS "decisionControleurDate";

-- Supprimer la colonne sousRole de MembreCommission
ALTER TABLE "MembreCommission" DROP COLUMN IF EXISTS "sousRole";

-- Supprimer les enums
DROP TYPE IF EXISTS "Verdict";
DROP TYPE IF EXISTS "SousRoleCommission";
```

## Gestion des Erreurs

### Erreurs par Endpoint

#### Examinateur - Rendre un verdict

| Code | Erreur | Cause |
|------|--------|-------|
| 400 | Verdict invalide | Le verdict n'est pas VALIDE, REJETE ou SOUS_RESERVE |
| 400 | Motif manquant | Motif obligatoire pour REJETE ou SOUS_RESERVE (min 10 caractères) |
| 403 | Verdict déjà rendu | L'examinateur a déjà rendu son verdict sur ce dossier |
| 403 | 2 verdicts complets | Les 2 examinateurs ont déjà rendu leurs verdicts |
| 404 | Dossier non trouvé | Le dossierInscriptionId n'existe pas |

#### Examinateur - Modifier un verdict

| Code | Erreur | Cause |
|------|--------|-------|
| 400 | Verdict invalide | Le verdict n'est pas VALIDE, REJETE ou SOUS_RESERVE |
| 400 | Motif manquant | Motif obligatoire pour REJETE ou SOUS_RESERVE (min 10 caractères) |
| 403 | Aucun verdict rendu | L'examinateur n'a pas encore rendu de verdict |
| 403 | Modification épuisée | L'examinateur a déjà modifié son verdict une fois |
| 404 | Dossier non trouvé | Le dossierInscriptionId n'existe pas |

#### Contrôleur - Rendre une décision

| Code | Erreur | Cause |
|------|--------|-------|
| 400 | Décision invalide | La décision n'est pas VALIDE, REJETE ou SOUS_RESERVE |
| 400 | Motif manquant | Motif obligatoire pour REJETE ou SOUS_RESERVE (min 10 caractères) |
| 400 | Aucun verdict | Aucun examinateur n'a encore rendu de verdict |
| 404 | Dossier non trouvé | Le dossierInscriptionId n'existe pas |

#### Contrôleur - Modifier une décision

| Code | Erreur | Cause |
|------|--------|-------|
| 400 | Décision invalide | La décision n'est pas VALIDE, REJETE ou SOUS_RESERVE |
| 400 | Motif manquant | Motif obligatoire pour REJETE ou SOUS_RESERVE (min 10 caractères) |
| 400 | Aucune décision | Le contrôleur n'a pas encore rendu de décision |
| 404 | Dossier non trouvé | Le dossierInscriptionId n'existe pas |

### Gestion Globale des Erreurs

```javascript
// Middleware de gestion des erreurs
app.use((error, req, res, next) => {
  console.error('Erreur globale:', error);

  // Erreurs Prisma
  if (error.code === 'P2002') {
    return res.status(409).json({ 
      error: 'Conflit : cette ressource existe déjà' 
    });
  }

  if (error.code === 'P2025') {
    return res.status(404).json({ 
      error: 'Ressource non trouvée' 
    });
  }

  // Erreurs de validation
  if (error.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Données invalides', 
      details: error.message 
    });
  }

  // Erreur par défaut
  res.status(500).json({ 
    error: 'Erreur serveur interne',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});
```

## Performance et Optimisation

### Index Prisma

Les index suivants sont créés pour optimiser les requêtes :

```prisma
@@index([verdict1Par])
@@index([verdict2Par])
@@index([decisionControleurPar])
@@index([sousRole])
@@index([statut])
@@index([createdAt])
```

### Requêtes Optimisées

#### Liste des dossiers à évaluer (Examinateur)

```javascript
// Utilise les index verdict1Par et verdict2Par
// Complexité : O(log n) grâce aux index B-tree
const dossiers = await prisma.dossierInscription.findMany({
  where: {
    OR: [
      { verdict1Par: null, verdict2Par: null },
      { verdict1Par: { not: examinateurId }, verdict2Par: null },
      { verdict1Par: null, verdict2Par: { not: examinateurId } }
    ],
    NOT: {
      OR: [
        { verdict1Par: examinateurId },
        { verdict2Par: examinateurId }
      ]
    }
  }
});
```

#### Détection des verdicts divergents

```javascript
// Requête unique avec filtrage en mémoire (plus rapide que 2 requêtes)
const dossiers2Verdicts = await prisma.dossierInscription.findMany({
  where: {
    verdict1Par: { not: null },
    verdict2Par: { not: null }
  },
  select: { id: true, verdict1: true, verdict2: true }
});

const divergents = dossiers2Verdicts.filter(d => d.verdict1 !== d.verdict2);
```

### Pagination

Toutes les listes utilisent la pagination pour limiter la charge :

```javascript
const limite = parseInt(req.query.limite) || 50; // Max 50 par défaut
const offset = parseInt(req.query.offset) || 0;

const [dossiers, total] = await Promise.all([
  prisma.dossierInscription.findMany({
    where: whereClause,
    take: limite,
    skip: offset
  }),
  prisma.dossierInscription.count({ where: whereClause })
]);
```

## Tests et Validation

### Tests Unitaires

#### Test : Rendre un verdict

```javascript
describe('Examinateur - Rendre un verdict', () => {
  it('devrait enregistrer le verdict avec succès', async () => {
    const response = await request(app)
      .post('/api/examinateur/dossiers/uuid/verdict')
      .set('Authorization', `Bearer ${examinateurToken}`)
      .send({ verdict: 'VALIDE' });

    expect(response.status).toBe(201);
    expect(response.body.verdict.verdict).toBe('VALIDE');
  });

  it('devrait refuser un verdict sans motif pour REJETE', async () => {
    const response = await request(app)
      .post('/api/examinateur/dossiers/uuid/verdict')
      .set('Authorization', `Bearer ${examinateurToken}`)
      .send({ verdict: 'REJETE' });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('motif est obligatoire');
  });

  it('devrait refuser un deuxième verdict du même examinateur', async () => {
    // Premier verdict
    await request(app)
      .post('/api/examinateur/dossiers/uuid/verdict')
      .set('Authorization', `Bearer ${examinateurToken}`)
      .send({ verdict: 'VALIDE' });

    // Deuxième tentative
    const response = await request(app)
      .post('/api/examinateur/dossiers/uuid/verdict')
      .set('Authorization', `Bearer ${examinateurToken}`)
      .send({ verdict: 'REJETE', motif: 'Dossier incomplet' });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('déjà rendu votre verdict');
  });
});
```

#### Test : Modification unique du verdict

```javascript
describe('Examinateur - Modifier un verdict', () => {
  it('devrait autoriser une première modification', async () => {
    // Rendre le verdict initial
    await request(app)
      .post('/api/examinateur/dossiers/uuid/verdict')
      .set('Authorization', `Bearer ${examinateurToken}`)
      .send({ verdict: 'REJETE', motif: 'Dossier incomplet' });

    // Modifier le verdict
    const response = await request(app)
      .put('/api/examinateur/dossiers/uuid/verdict')
      .set('Authorization', `Bearer ${examinateurToken}`)
      .send({ verdict: 'SOUS_RESERVE', motif: 'Accepté sous réserve' });

    expect(response.status).toBe(200);
    expect(response.body.verdict.modificationsPossibles).toBe(0);
  });

  it('devrait refuser une deuxième modification', async () => {
    // Rendre + modifier une fois
    await request(app).post('/api/examinateur/dossiers/uuid/verdict')
      .set('Authorization', `Bearer ${examinateurToken}`)
      .send({ verdict: 'REJETE', motif: 'Dossier incomplet' });
    
    await request(app).put('/api/examinateur/dossiers/uuid/verdict')
      .set('Authorization', `Bearer ${examinateurToken}`)
      .send({ verdict: 'SOUS_RESERVE', motif: 'Accepté sous réserve' });

    // Deuxième tentative de modification
    const response = await request(app)
      .put('/api/examinateur/dossiers/uuid/verdict')
      .set('Authorization', `Bearer ${examinateurToken}`)
      .send({ verdict: 'VALIDE' });

    expect(response.status).toBe(403);
    expect(response.body.error).toContain('déjà modifié votre verdict');
  });
});
```

### Tests d'Intégration

#### Test : Workflow complet

```javascript
describe('Workflow complet - Double verdict', () => {
  it('devrait gérer le workflow complet avec verdicts divergents', async () => {
    // 1. Examinateur 1 rend son verdict
    const verdict1 = await request(app)
      .post('/api/examinateur/dossiers/uuid/verdict')
      .set('Authorization', `Bearer ${examinateur1Token}`)
      .send({ verdict: 'VALIDE' });
    expect(verdict1.status).toBe(201);

    // 2. Examinateur 2 rend son verdict (divergent)
    const verdict2 = await request(app)
      .post('/api/examinateur/dossiers/uuid/verdict')
      .set('Authorization', `Bearer ${examinateur2Token}`)
      .send({ verdict: 'REJETE', motif: 'Dossier incomplet' });
    expect(verdict2.status).toBe(201);

    // 3. Vérifier que le contrôleur reçoit une alerte
    const notifications = await prisma.notification.findMany({
      where: {
        userId: controleurId,
        type: 'ALERTE',
        data: { path: ['dossierInscriptionId'], equals: 'uuid' }
      }
    });
    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications[0].title).toContain('divergents');

    // 4. Contrôleur rend sa décision
    const decision = await request(app)
      .post('/api/controleur/dossiers/uuid/decision')
      .set('Authorization', `Bearer ${controleurToken}`)
      .send({ decision: 'SOUS_RESERVE', motif: 'Accepté sous réserve de compléter le dossier' });
    expect(decision.status).toBe(201);

    // 5. Vérifier que le candidat reçoit une notification
    const notificationCandidat = await prisma.notification.findFirst({
      where: {
        userId: candidatId,
        data: { path: ['dossierInscriptionId'], equals: 'uuid' }
      }
    });
    expect(notificationCandidat).toBeTruthy();
  });
});
```

## Documentation

### Diagramme de Séquence - Workflow Complet

Voir la section Architecture pour les diagrammes mermaid détaillés.

### Types d'Actions pour ActionHistory

```typescript
type TypeActionDoubleVerdict =
  | 'VERDICT_EXAMINATEUR_RENDU'
  | 'VERDICT_EXAMINATEUR_MODIFIE'
  | 'DECISION_CONTROLEUR_RENDUE'
  | 'DECISION_CONTROLEUR_MODIFIEE';
```

### Structure des Notifications

#### Notification : Nouveau verdict rendu

```json
{
  "type": "NOUVEAU_DOSSIER",
  "priority": "NORMAL",
  "title": "Nouveau verdict rendu (1/2)",
  "message": "Un examinateur a rendu son verdict sur le dossier UAC-2024-MED-00123",
  "data": {
    "dossierInscriptionId": "uuid",
    "numeroInscription": "UAC-2024-MED-00123",
    "nombreVerdictsRendus": 1
  }
}
```

#### Notification : Verdicts divergents

```json
{
  "type": "ALERTE",
  "priority": "HIGH",
  "title": "⚠️ Verdicts divergents détectés",
  "message": "Le dossier UAC-2024-MED-00123 a des verdicts divergents : Examinateur 1 = VALIDE, Examinateur 2 = REJETE",
  "data": {
    "dossierInscriptionId": "uuid",
    "verdict1": "VALIDE",
    "verdict2": "REJETE"
  }
}
```

## Conclusion

Ce document de design fournit une architecture complète pour le système de commission à double verdict. Les points clés sont :

1. **Séparation stricte des rôles** : Examinateurs et contrôleur avec permissions distinctes
2. **Indépendance des évaluations** : Les examinateurs ne voient jamais les verdicts des autres
3. **Modification contrôlée** : Une seule modification pour les examinateurs, illimitée pour le contrôleur
4. **Traçabilité complète** : Toutes les actions enregistrées dans ActionHistory
5. **Détection automatique** : Alertes pour verdicts divergents et dossiers en retard
6. **Intégration transparente** : Utilisation des systèmes existants (email, notifications)

Le système est prêt pour l'implémentation avec tous les contrôleurs, middlewares, routes et migrations définis.
