# Stratégie de Test - Refonte Dossier Candidat et Inscription

## Vue d'Ensemble

Cette stratégie de test couvre tous les aspects de la refonte "Upload Once, Use Everywhere", incluant les tests unitaires, d'intégration, de migration, et de non-régression.

## Types de Tests

### 1. Tests Unitaires

#### Tests des Contrôleurs

**`dossier.controller.test.js`**
```javascript
describe('Dossier Controller - Routage Intelligent', () => {
  describe('uploadPiece', () => {
    it('devrait router une pièce de base vers le Dossier Personnel', async () => {
      const req = {
        user: { id: 'candidat123' },
        body: { typePiece: 'carteIdentite' },
        file: mockFile
      };
      
      await dossierController.uploadPiece(req, res);
      
      expect(prisma.dossier.upsert).toHaveBeenCalledWith({
        where: { candidatId: 'candidat123' },
        update: { carteIdentite: expect.any(String) },
        create: { candidatId: 'candidat123', carteIdentite: expect.any(String) }
      });
    });
    
    it('devrait router une quittance vers le Dossier Concours', async () => {
      const req = {
        user: { id: 'candidat123' },
        body: { typePiece: 'quittance', inscriptionId: 'inscription123' },
        file: mockFile
      };
      
      await dossierController.uploadPiece(req, res);
      
      expect(prisma.dossierInscription.update).toHaveBeenCalledWith({
        where: { inscriptionId: 'inscription123' },
        data: { quittanceUrl: expect.any(String) }
      });
    });
    
    it('devrait enregistrer une action pour chaque inscription affectée', async () => {
      const req = {
        user: { id: 'candidat123' },
        body: { typePiece: 'acteNaissance' },
        file: mockFile
      };
      
      // Mock 3 inscriptions existantes
      prisma.inscription.findMany.mockResolvedValue([
        { id: 'i1', dossierInscription: { id: 'di1' } },
        { id: 'i2', dossierInscription: { id: 'di2' } },
        { id: 'i3', dossierInscription: { id: 'di3' } }
      ]);
      
      await dossierController.uploadPiece(req, res);
      
      expect(prisma.actionHistory.create).toHaveBeenCalledTimes(3);
    });
  });
  
  describe('getDossierPersonnel', () => {
    it('devrait retourner le dossier personnel avec complétude', async () => {
      const req = {
        params: { candidatId: 'candidat123' },
        user: { id: 'candidat123', role: 'CANDIDAT' }
      };
      
      prisma.dossier.findUnique.mockResolvedValue({
        id: 'dossier123',
        candidatId: 'candidat123',
        acteNaissance: 'url1',
        carteIdentite: 'url2',
        photo: null,
        releve: 'url3'
      });
      
      await dossierController.getDossierPersonnel(req, res);
      
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          completude: {
            pourcentage: 75,
            piecesPresentes: 3,
            piecesRequises: 4
          }
        })
      );
    });
  });
});
```

**`inscription.controller.test.js`**
```javascript
describe('Inscription Controller - Création Automatique', () => {
  describe('creerInscription', () => {
    it('devrait créer une inscription et un DossierInscription', async () => {
      const req = {
        user: { id: 'candidat123' },
        body: { concoursId: 'concours123' }
      };
      
      await inscriptionController.creerInscription(req, res);
      
      expect(prisma.inscription.create).toHaveBeenCalled();
      expect(prisma.dossierInscription.create).toHaveBeenCalledWith({
        data: {
          inscriptionId: expect.any(String),
          statut: 'EN_ATTENTE',
          piecesExtras: {}
        }
      });
    });
    
    it('devrait créer un Dossier Personnel si inexistant', async () => {
      const req = {
        user: { id: 'candidat123' },
        body: { concoursId: 'concours123' }
      };
      
      prisma.dossier.findUnique.mockResolvedValue(null);
      
      await inscriptionController.creerInscription(req, res);
      
      expect(prisma.dossier.create).toHaveBeenCalledWith({
        data: { candidatId: 'candidat123' }
      });
    });
    
    it('devrait enregistrer une action DOSSIER_CONCOURS_CREE', async () => {
      const req = {
        user: { id: 'candidat123' },
        body: { concoursId: 'concours123' }
      };
      
      await inscriptionController.creerInscription(req, res);
      
      expect(prisma.actionHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          typeAction: 'DOSSIER_CONCOURS_CREE'
        })
      });
    });
    
    it('devrait rollback en cas d\'erreur', async () => {
      const req = {
        user: { id: 'candidat123' },
        body: { concoursId: 'concours123' }
      };
      
      prisma.dossierInscription.create.mockRejectedValue(new Error('DB Error'));
      
      await inscriptionController.creerInscription(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      // Vérifier que l'inscription n'a pas été créée
    });
  });
});
```

**`completion.controller.test.js`**
```javascript
describe('Completion Controller - Référence Implicite', () => {
  describe('getCompletionInscription', () => {
    it('devrait calculer la complétude avec référence implicite', async () => {
      const req = {
        params: { inscriptionId: 'inscription123' },
        user: { id: 'candidat123', role: 'CANDIDAT' }
      };
      
      prisma.inscription.findUnique.mockResolvedValue({
        id: 'inscription123',
        candidatId: 'candidat123',
        candidat: {
          dossier: {
            acteNaissance: 'url1',
            carteIdentite: 'url2',
            photo: 'url3',
            releve: 'url4'
          }
        },
        concours: {
          piecesRequises: {
            extras: [
              { nom: 'diplome', obligatoire: true }
            ]
          }
        },
        dossierInscription: {
          quittanceUrl: 'url5',
          piecesExtras: { diplome: 'url6' }
        }
      });
      
      await completionController.getCompletionInscription(req, res);
      
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          completudeGlobale: {
            pourcentage: 100,
            piecesPresentes: 6,
            piecesRequises: 6,
            estComplet: true
          }
        })
      );
    });
    
    it('devrait gérer le cas où le Dossier Personnel n\'existe pas', async () => {
      const req = {
        params: { inscriptionId: 'inscription123' },
        user: { id: 'candidat123', role: 'CANDIDAT' }
      };
      
      prisma.inscription.findUnique.mockResolvedValue({
        id: 'inscription123',
        candidatId: 'candidat123',
        candidat: {
          dossier: null  // Pas de dossier personnel
        },
        concours: { piecesRequises: { extras: [] } },
        dossierInscription: { quittanceUrl: null, piecesExtras: {} }
      });
      
      await completionController.getCompletionInscription(req, res);
      
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          piecesBase: {
            completude: {
              presentes: 0,
              requises: 4,
              pourcentage: 0
            }
          }
        })
      );
    });
  });
});
```

**`history.controller.test.js`**
```javascript
describe('History Controller - dossierInscriptionId', () => {
  describe('getHistorique', () => {
    it('devrait récupérer l\'historique avec dossierInscriptionId', async () => {
      const req = {
        params: { dossierInscriptionId: 'di123' },
        query: {},
        user: { role: 'COMMISSION' }
      };
      
      prisma.dossierInscription.findUnique.mockResolvedValue({
        id: 'di123',
        inscription: {
          numeroInscription: 'UAC-2024-MED-00123',
          candidat: { nom: 'DOE', prenom: 'John' },
          concours: { libelle: 'Médecine 2024' }
        }
      });
      
      prisma.actionHistory.findMany.mockResolvedValue([
        { id: 'a1', typeAction: 'DOSSIER_CONCOURS_CREE' },
        { id: 'a2', typeAction: 'QUITTANCE_AJOUTEE' }
      ]);
      
      await historyController.getHistorique(req, res);
      
      expect(prisma.actionHistory.findMany).toHaveBeenCalledWith({
        where: { dossierInscriptionId: 'di123' },
        orderBy: { timestamp: 'desc' },
        take: 50,
        skip: 0
      });
    });
  });
  
  describe('enregistrerAction', () => {
    it('devrait enregistrer une action avec dossierInscriptionId', async () => {
      const req = {
        body: {
          dossierInscriptionId: 'di123',
          typeAction: 'QUITTANCE_AJOUTEE',
          details: { url: 'url1' }
        },
        user: { id: 'candidat123', role: 'CANDIDAT' }
      };
      
      prisma.dossierInscription.findUnique.mockResolvedValue({ id: 'di123' });
      
      await historyController.enregistrerAction(req, res);
      
      expect(prisma.actionHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          dossierInscriptionId: 'di123',
          typeAction: 'QUITTANCE_AJOUTEE'
        })
      });
    });
  });
});
```

### 2. Tests d'Intégration

**`integration/dossier-workflow.test.js`**
```javascript
describe('Workflow Complet - Upload Once, Use Everywhere', () => {
  let candidat, concours1, concours2;
  
  beforeEach(async () => {
    // Créer un candidat
    candidat = await prisma.candidat.create({
      data: {
        nom: 'DOE',
        prenom: 'John',
        email: 'john.doe@test.com',
        matricule: 'TEST001'
      }
    });
    
    // Créer 2 concours
    concours1 = await prisma.concours.create({
      data: { libelle: 'Médecine 2024', dateDebut: new Date(), dateFin: new Date() }
    });
    
    concours2 = await prisma.concours.create({
      data: { libelle: 'Pharmacie 2024', dateDebut: new Date(), dateFin: new Date() }
    });
  });
  
  it('devrait permettre le workflow complet', async () => {
    // 1. Créer le dossier personnel et uploader les 4 pièces de base
    const dossier = await prisma.dossier.create({
      data: {
        candidatId: candidat.id,
        acteNaissance: 'url1',
        carteIdentite: 'url2',
        photo: 'url3',
        releve: 'url4'
      }
    });
    
    expect(dossier).toBeDefined();
    
    // 2. S'inscrire au concours 1
    const inscription1 = await prisma.inscription.create({
      data: {
        candidatId: candidat.id,
        concoursId: concours1.id
      }
    });
    
    const dossierInscription1 = await prisma.dossierInscription.create({
      data: {
        inscriptionId: inscription1.id,
        statut: 'EN_ATTENTE'
      }
    });
    
    expect(dossierInscription1).toBeDefined();
    
    // 3. Uploader la quittance pour le concours 1
    await prisma.dossierInscription.update({
      where: { id: dossierInscription1.id },
      data: { quittanceUrl: 'quittance1' }
    });
    
    // 4. S'inscrire au concours 2 (réutilisation des pièces de base)
    const inscription2 = await prisma.inscription.create({
      data: {
        candidatId: candidat.id,
        concoursId: concours2.id
      }
    });
    
    const dossierInscription2 = await prisma.dossierInscription.create({
      data: {
        inscriptionId: inscription2.id,
        statut: 'EN_ATTENTE'
      }
    });
    
    // 5. Vérifier que les 2 inscriptions utilisent le même dossier personnel
    const inscriptionComplete1 = await prisma.inscription.findUnique({
      where: { id: inscription1.id },
      include: {
        candidat: { include: { dossier: true } },
        dossierInscription: true
      }
    });
    
    const inscriptionComplete2 = await prisma.inscription.findUnique({
      where: { id: inscription2.id },
      include: {
        candidat: { include: { dossier: true } },
        dossierInscription: true
      }
    });
    
    // Les 2 inscriptions partagent le même dossier personnel
    expect(inscriptionComplete1.candidat.dossier.id).toBe(inscriptionComplete2.candidat.dossier.id);
    
    // Mais ont des dossiers concours différents
    expect(inscriptionComplete1.dossierInscription.id).not.toBe(inscriptionComplete2.dossierInscription.id);
    
    // 6. Mettre à jour une pièce de base
    await prisma.dossier.update({
      where: { id: dossier.id },
      data: { carteIdentite: 'url2_updated' }
    });
    
    // 7. Vérifier que les 2 inscriptions voient la mise à jour
    const inscriptionApresUpdate1 = await prisma.inscription.findUnique({
      where: { id: inscription1.id },
      include: { candidat: { include: { dossier: true } } }
    });
    
    const inscriptionApresUpdate2 = await prisma.inscription.findUnique({
      where: { id: inscription2.id },
      include: { candidat: { include: { dossier: true } } }
    });
    
    expect(inscriptionApresUpdate1.candidat.dossier.carteIdentite).toBe('url2_updated');
    expect(inscriptionApresUpdate2.candidat.dossier.carteIdentite).toBe('url2_updated');
  });
});
```

### 3. Tests de Migration

**`migration/migration.test.js`**
```javascript
describe('Migration - Refonte Dossier Inscription', () => {
  beforeAll(async () => {
    // Créer des données de test dans l'ancienne structure
    await setupOldStructure();
  });
  
  it('devrait migrer toutes les inscriptions vers DossierInscription', async () => {
    const inscriptionsAvant = await prisma.inscription.count();
    
    // Exécuter la migration
    await executeMigration();
    
    const dossiersInscriptionApres = await prisma.dossierInscription.count();
    
    expect(dossiersInscriptionApres).toBe(inscriptionsAvant);
  });
  
  it('devrait migrer les données correctement', async () => {
    const inscriptionAvant = await prisma.inscription.findFirst({
      where: { id: 'test-inscription-1' }
    });
    
    await executeMigration();
    
    const dossierInscriptionApres = await prisma.dossierInscription.findFirst({
      where: { inscriptionId: 'test-inscription-1' }
    });
    
    expect(dossierInscriptionApres.statut).toBe(inscriptionAvant.statut);
    expect(dossierInscriptionApres.quittanceUrl).toBe(inscriptionAvant.quittanceUrl);
    expect(dossierInscriptionApres.piecesExtras).toEqual(inscriptionAvant.piecesExtras);
  });
  
  it('devrait migrer ActionHistory correctement', async () => {
    const actionsAvant = await prisma.actionHistory.findMany({
      where: { dossierId: 'test-dossier-1' }
    });
    
    await executeMigration();
    
    const actionsApres = await prisma.actionHistory.findMany({
      where: {
        dossierInscriptionId: {
          in: await getDossierInscriptionIds('test-dossier-1')
        }
      }
    });
    
    expect(actionsApres.length).toBeGreaterThan(0);
  });
  
  it('devrait permettre un rollback complet', async () => {
    await executeMigration();
    
    const dossiersInscriptionApres = await prisma.dossierInscription.count();
    expect(dossiersInscriptionApres).toBeGreaterThan(0);
    
    await executeRollback();
    
    const dossiersInscriptionApresRollback = await prisma.dossierInscription.count();
    expect(dossiersInscriptionApresRollback).toBe(0);
    
    const inscriptionsApresRollback = await prisma.inscription.findFirst();
    expect(inscriptionsApresRollback.statut).toBeDefined();
    expect(inscriptionsApresRollback.quittanceUrl).toBeDefined();
  });
});
```

### 4. Tests de Non-Régression

**`regression/existing-features.test.js`**
```javascript
describe('Tests de Non-Régression', () => {
  describe('Fonctionnalités Existantes', () => {
    it('devrait toujours permettre la création d\'un candidat', async () => {
      const candidat = await prisma.candidat.create({
        data: {
          nom: 'TEST',
          prenom: 'User',
          email: 'test@example.com',
          matricule: 'TEST002'
        }
      });
      
      expect(candidat).toBeDefined();
      expect(candidat.id).toBeDefined();
    });
    
    it('devrait toujours permettre la création d\'un concours', async () => {
      const concours = await prisma.concours.create({
        data: {
          libelle: 'Test Concours',
          dateDebut: new Date(),
          dateFin: new Date()
        }
      });
      
      expect(concours).toBeDefined();
    });
    
    it('devrait toujours calculer la complétude du dossier personnel', async () => {
      const candidat = await createTestCandidat();
      const dossier = await prisma.dossier.create({
        data: {
          candidatId: candidat.id,
          acteNaissance: 'url1',
          carteIdentite: 'url2'
        }
      });
      
      const completion = calculateDossierCompletion(dossier);
      
      expect(completion.pourcentage).toBe(50);
      expect(completion.piecesPresentes).toBe(2);
      expect(completion.piecesRequises).toBe(4);
    });
  });
  
  describe('Endpoints API', () => {
    it('GET /api/candidats/:id/dossier-personnel devrait fonctionner', async () => {
      const response = await request(app)
        .get(`/api/candidats/${testCandidatId}/dossier-personnel`)
        .set('Authorization', `Bearer ${testToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('piecesBase');
      expect(response.body).toHaveProperty('completude');
    });
    
    it('POST /api/inscriptions devrait créer inscription + dossier', async () => {
      const response = await request(app)
        .post('/api/inscriptions')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ concoursId: testConcoursId });
      
      expect(response.status).toBe(201);
      expect(response.body.inscription).toBeDefined();
      expect(response.body.inscription.dossierInscription).toBeDefined();
    });
  });
});
```

### 5. Tests de Performance

**`performance/completion-calculation.test.js`**
```javascript
describe('Performance - Calcul de Complétude', () => {
  it('devrait calculer la complétude en moins de 200ms', async () => {
    const start = Date.now();
    
    await completionController.getCompletionInscription(req, res);
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(200);
  });
  
  it('devrait gérer 1000 inscriptions efficacement', async () => {
    // Créer 1000 inscriptions
    const inscriptions = await createTestInscriptions(1000);
    
    const start = Date.now();
    
    for (const inscription of inscriptions) {
      await completionController.getCompletionInscription(
        { params: { inscriptionId: inscription.id }, user: testUser },
        res
      );
    }
    
    const duration = Date.now() - start;
    const avgDuration = duration / 1000;
    
    expect(avgDuration).toBeLessThan(200);
  });
});
```

## Couverture de Code

### Objectifs de Couverture

- **Contrôleurs** : 90% minimum
- **Services** : 85% minimum
- **Utilitaires** : 95% minimum
- **Global** : 85% minimum

### Configuration Jest

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/prisma.js'
  ],
  coverageThresholds: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './src/controllers/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
```

## Commandes de Test

```bash
# Exécuter tous les tests
npm test

# Exécuter les tests avec couverture
npm run test:coverage

# Exécuter les tests unitaires uniquement
npm run test:unit

# Exécuter les tests d'intégration uniquement
npm run test:integration

# Exécuter les tests de migration
npm run test:migration

# Exécuter les tests de non-régression
npm run test:regression

# Exécuter les tests de performance
npm run test:performance

# Exécuter les tests en mode watch
npm run test:watch
```

## Checklist de Test

### Avant la Migration

- [ ] Tous les tests unitaires passent
- [ ] Tous les tests d'intégration passent
- [ ] Couverture de code > 85%
- [ ] Tests de migration validés en environnement de développement
- [ ] Sauvegarde de la base de données créée

### Après la Migration

- [ ] Script de vérification exécuté avec succès
- [ ] Tous les tests de non-régression passent
- [ ] Tests de performance validés
- [ ] Aucune régression détectée
- [ ] Documentation mise à jour

### Tests Manuels

- [ ] Créer un candidat et uploader les 4 pièces de base
- [ ] S'inscrire à un concours et uploader la quittance
- [ ] S'inscrire à un second concours (vérifier la réutilisation)
- [ ] Mettre à jour une pièce de base (vérifier l'impact multi-concours)
- [ ] Consulter la vue agrégée en tant que commission
- [ ] Consulter l'historique des actions
- [ ] Tester les permissions (candidat, commission, contrôleur, DGES)

