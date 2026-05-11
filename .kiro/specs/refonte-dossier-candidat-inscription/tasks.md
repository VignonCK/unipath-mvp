# Implementation Plan: Refonte Dossier Candidat et Inscription

## Overview

This implementation plan refactors the database architecture to implement the **"Upload Once, Use Everywhere"** principle. The refactoring separates the personal folder (Dossier) containing 4 base documents from the competition-specific folder (DossierInscription) containing the receipt and extra documents. This eliminates duplicate uploads and clarifies responsibilities between entities.

**Key Changes:**
1. Create new `DossierInscription` table (1-1 with Inscription) for competition-specific documents and status
2. Migrate fields from `Inscription` to `DossierInscription` (status, quittanceUrl, piecesExtras, decision fields)
3. Fix `ActionHistory` to reference `DossierInscription` instead of `Dossier`
4. Implement implicit reference mechanism: Inscription → Candidat → Dossier (for base documents)
5. Update controllers to use the new architecture with smart routing

**Implementation Language:** JavaScript (Node.js with Prisma ORM)

## Tasks

### Phase 1: Database Schema Changes

- [-] 1. Update Prisma schema to create DossierInscription table
  - Add new `DossierInscription` model with fields: id, inscriptionId (unique), quittanceUrl, piecesExtras (Json), statut (StatutDossier enum)
  - Add decision fields: commentaireRejet, commentaireSousReserve, decisionCommissionPar, decisionCommissionDate, decisionControleurPar, decisionControleurDate, commentaireControleur
  - Add timestamps: createdAt, updatedAt
  - Add 1-1 relation with Inscription via inscriptionId
  - Add 1-N relation with ActionHistory
  - Add indexes on inscriptionId, statut, createdAt
  - Add onDelete: Cascade for foreign key constraints
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 2. Update Inscription model in Prisma schema
  - Remove fields: statut, quittanceUrl, piecesExtras, commentaireRejet, commentaireSousReserve
  - Remove decision fields: decisionCommissionPar, decisionCommissionDate, decisionControleurPar, decisionControleurDate, commentaireControleur
  - Keep only: id, numeroInscription, candidatId, concoursId, note, createdAt
  - Add optional 1-1 relation to DossierInscription
  - Add indexes on candidatId and concoursId
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Update ActionHistory model in Prisma schema
  - Rename field dossierId to dossierInscriptionId
  - Update foreign key to reference DossierInscription.id instead of Dossier.id
  - Add onDelete: Cascade constraint
  - Update indexes to use dossierInscriptionId
  - Add relation to DossierInscription model
  - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [x] 4. Generate Prisma migration files
  - Run `npx prisma migrate dev --name refonte-dossier-inscription --create-only` to generate migration SQL
  - Review generated SQL to ensure it matches the schema changes
  - Verify that indexes are created correctly
  - Verify that foreign key constraints are correct with CASCADE delete
  - _Requirements: 2.1, 3.1, 4.1_

### Phase 2: Data Migration

- [x] 5. Create data migration script for existing inscriptions
  - [x] 5.1 Write migration script to create DossierInscription records
    - For each existing Inscription, create a corresponding DossierInscription
    - Copy statut, quittanceUrl, piecesExtras from Inscription to DossierInscription
    - Copy decision fields (commentaireRejet, commentaireSousReserve, decisionCommissionPar, decisionCommissionDate, decisionControleurPar, decisionControleurDate, commentaireControleur)
    - Set createdAt to Inscription.createdAt, updatedAt to current timestamp
    - Use Prisma transactions to ensure atomicity
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 5.2 Write migration script to update ActionHistory references
    - Map old dossierId references to new dossierInscriptionId
    - For each ActionHistory record, find the corresponding DossierInscription via Inscription
    - Update the dossierInscriptionId field
    - Handle cases where dossierId doesn't map to a valid DossierInscription (log errors)
    - _Requirements: 4.4, 5.4, 14.4_

  - [x] 5.3 Add migration validation and rollback logic
    - Verify that number of DossierInscription records equals number of Inscription records
    - Verify that all ActionHistory records have valid dossierInscriptionId references
    - Create database backup before migration using `pg_dump` or Prisma snapshot
    - Implement rollback script to restore previous state if migration fails
    - Generate migration report with counts and any errors
    - _Requirements: 5.5, 5.6, 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

- [x] 6. Execute migration with safety checks
  - Create pre-migration database backup
  - Run migration script in transaction with savepoint
  - Validate data integrity after migration
  - Generate and review migration report
  - Test rollback script on a copy of the database
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 17.1, 17.2, 20.1, 20.2, 20.3, 20.5_

### Phase 3: Controller Updates

- [x] 7. Update dossier.controller.js with smart routing
  - [x] 7.1 Implement uploadPiece with intelligent routing logic
    - Define PIECES_DOSSIER_BASE constant: ['acteNaissance', 'carteIdentite', 'photo', 'releve']
    - Route base documents (acteNaissance, carteIdentite, photo, releve) to Dossier table
    - Route quittance to DossierInscription.quittanceUrl
    - Route piecesExtras to DossierInscription.piecesExtras JSON field
    - Validate inscriptionId is provided for quittance and piecesExtras
    - Validate that inscription belongs to the authenticated candidat
    - _Requirements: 11.1, 11.2, 11.3, 11.5_

  - [x] 7.2 Implement multi-inscription impact for base document updates
    - When a base document is updated, retrieve all inscriptions for the candidat
    - Create ActionHistory entry for each DossierInscription with typeAction='PIECE_BASE_MISE_A_JOUR'
    - Return list of affected inscriptions in response
    - Include ipAddress and userAgent in ActionHistory entries
    - _Requirements: 11.4, 23.1, 23.2, 23.3_

  - [x] 7.3 Implement getDossierPersonnel endpoint
    - Retrieve Dossier by candidatId with candidat relation
    - Check permissions: CANDIDAT (self only), COMMISSION, CONTROLEUR, DGES
    - Return 403 if candidat tries to access another candidat's dossier
    - Count inscriptions using this dossier
    - Return structured response with piecesBase array, completude, impactInscriptions
    - Handle case where Dossier doesn't exist (return empty structure with 0% completude)
    - _Requirements: 7.1, 16.1, 16.2_

  - [ ]* 7.4 Write unit tests for dossier.controller.js
    - Test uploadPiece routing for base documents (should update Dossier)
    - Test uploadPiece routing for quittance (should update DossierInscription)
    - Test uploadPiece routing for piecesExtras (should update DossierInscription)
    - Test multi-inscription impact when updating base documents
    - Test getDossierPersonnel with existing and non-existing dossier
    - Test permission checks for getDossierPersonnel
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 8. Update inscription.controller.js to auto-create DossierInscription
  - [x] 8.1 Modify creerInscription to create DossierInscription automatically
    - Check if candidat has a Dossier, create empty one if not
    - Use Prisma transaction to create Inscription + DossierInscription atomically
    - Initialize DossierInscription with statut='EN_ATTENTE', piecesExtras={}
    - Create ActionHistory entry with typeAction='DOSSIER_CONCOURS_CREE'
    - Calculate initial completude (base documents + specific documents)
    - Return inscription with dossierInscription and completude in response
    - _Requirements: 10.1, 10.2, 10.3, 14.1, 14.5_

  - [x] 8.2 Update annulerInscription to handle cascade deletion
    - Verify inscription belongs to authenticated candidat
    - Check that DossierInscription.statut is 'EN_ATTENTE' (cannot cancel processed inscriptions)
    - Delete Inscription (cascade will delete DossierInscription and ActionHistory)
    - Return success message
    - _Requirements: 10.4, 10.5_

  - [ ]* 8.3 Write unit tests for inscription.controller.js
    - Test creerInscription creates both Inscription and DossierInscription
    - Test creerInscription creates empty Dossier if candidat doesn't have one
    - Test creerInscription creates ActionHistory entry
    - Test creerInscription returns correct completude calculation
    - Test annulerInscription deletes Inscription and cascades to DossierInscription
    - Test annulerInscription rejects deletion if statut is not EN_ATTENTE
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 9. Update completion.controller.js with implicit reference logic
  - [x] 9.1 Implement getCompletionInscription with implicit reference
    - Retrieve Inscription with include: { candidat: { include: { dossier: true } }, concours, dossierInscription }
    - Check permissions: CANDIDAT (self only), COMMISSION, CONTROLEUR, DGES
    - Extract 4 base documents from inscription.candidat.dossier (implicit reference)
    - Extract quittance from inscription.dossierInscription.quittanceUrl
    - Extract piecesExtras from inscription.dossierInscription.piecesExtras
    - Calculate global percentage: (piecesBasesPresentes + quittancePresente + piecesExtrasPresentes) / (4 + 1 + nombrePiecesExtras) * 100
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [x] 9.2 Structure response with source indicators
    - Return piecesBase array with source='dossier_personnel', statut, url, uploadedAt
    - Return piecesSpecifiques array with source='dossier_concours', statut, url, uploadedAt, obligatoire
    - Include completudeGlobale with pourcentage, piecesPresentes, piecesRequises, estComplet
    - Include dossierInscription with id, statut, createdAt, updatedAt
    - Include permissions object indicating peutModifier and peutVoirDetails
    - _Requirements: 6.5, 7.3, 8.4_

  - [x] 9.3 Implement getDossierComplet endpoint
    - Use same logic as getCompletionInscription
    - Add decision information: decisionCommission (par, date, commentaires), decisionControleur (par, date, commentaire)
    - Return complete aggregated view with base documents + specific documents + status + decisions
    - _Requirements: 7.2, 7.3, 22.1, 22.2, 22.3, 22.4, 22.5_

  - [ ]* 9.4 Write unit tests for completion.controller.js
    - Test getCompletionInscription calculates correct percentage with all documents present
    - Test getCompletionInscription calculates correct percentage with missing documents
    - Test getCompletionInscription handles missing Dossier (returns 0% for base documents)
    - Test getCompletionInscription returns correct source indicators
    - Test getDossierComplet includes decision information
    - Test permission checks for both endpoints
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 10. Update history.controller.js to use dossierInscriptionId
  - [x] 10.1 Update getHistorique to use dossierInscriptionId
    - Accept dossierInscriptionId as route parameter
    - Retrieve DossierInscription with include: { inscription: { include: { candidat, concours } } }
    - Check permissions: COMMISSION, CONTROLEUR, DGES only
    - Build WHERE clause with dossierInscriptionId and optional filters (dateDebut, dateFin, utilisateur, typeAction)
    - Return actions with pagination (limite, offset)
    - Include inscription details (numeroInscription, candidat, concours) in response
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 10.2 Update enregistrerAction to use dossierInscriptionId
    - Accept dossierInscriptionId in request body
    - Verify DossierInscription exists
    - Check role-based permissions for typeAction (CANDIDAT, COMMISSION, CONTROLEUR, DGES)
    - Create ActionHistory with dossierInscriptionId, utilisateurId, typeAction, details, ipAddress, userAgent
    - Return success with actionId and timestamp
    - _Requirements: 4.5, 9.1, 9.2_

  - [ ]* 10.3 Write unit tests for history.controller.js
    - Test getHistorique retrieves actions for a DossierInscription
    - Test getHistorique filters by dateDebut, dateFin, utilisateur, typeAction
    - Test getHistorique pagination works correctly
    - Test getHistorique permission checks (only COMMISSION, CONTROLEUR, DGES)
    - Test enregistrerAction creates ActionHistory with correct dossierInscriptionId
    - Test enregistrerAction validates role-based permissions for typeAction
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

### Phase 4: API Endpoint Updates

- [x] 11. Create new API routes for Dossier Personnel
  - Add GET /api/candidats/:candidatId/dossier-personnel route (getDossierPersonnel)
  - Add PUT /api/candidats/:candidatId/dossier-personnel/pieces route (uploadPiece with base document routing)
  - Apply authentication middleware to both routes
  - Apply permission checks: CANDIDAT (self only), COMMISSION, CONTROLEUR, DGES
  - _Requirements: 7.1, 7.4_

- [x] 12. Create new API routes for Dossier Concours
  - Add GET /api/inscriptions/:inscriptionId/dossier-complet route (getDossierComplet)
  - Add POST /api/inscriptions/:inscriptionId/dossier-concours/quittance route (uploadPiece with quittance routing)
  - Add POST /api/inscriptions/:inscriptionId/dossier-concours/pieces-extras route (uploadPiece with piecesExtras routing)
  - Apply authentication middleware to all routes
  - Apply permission checks: CANDIDAT (owner only), COMMISSION, CONTROLEUR, DGES
  - _Requirements: 7.2, 7.5, 7.6_

- [x] 13. Update existing API routes for ActionHistory
  - Update GET /api/dossiers-inscription/:dossierInscriptionId/historique route (getHistorique)
  - Update POST /api/action-history route (enregistrerAction) to use dossierInscriptionId
  - Apply authentication middleware
  - Apply permission checks: COMMISSION, CONTROLEUR, DGES only
  - _Requirements: 9.1, 9.2_

- [x] 14. Checkpoint - Verify API routes and test endpoints
  - Ensure all tests pass, ask the user if questions arise.

### Phase 5: Testing and Validation

- [ ] 15. Create integration tests for complete workflows
  - [ ] 15.1 Test first inscription workflow (upload base documents + specific documents)
    - Create candidat and authenticate
    - Create inscription (should auto-create DossierInscription)
    - Upload 4 base documents to Dossier Personnel
    - Upload quittance to Dossier Concours
    - Verify completude calculation is correct
    - Verify ActionHistory entries are created
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 10.1, 10.2, 10.3_

  - [ ] 15.2 Test subsequent inscription workflow (reuse base documents)
    - Create second inscription for same candidat
    - Verify base documents are automatically referenced (no re-upload needed)
    - Upload only quittance for second inscription
    - Verify completude shows base documents as 'fournie' from dossier_personnel
    - Verify both inscriptions share the same Dossier
    - _Requirements: 1.3, 1.4, 6.1, 6.2_

  - [ ] 15.3 Test base document update impact on multiple inscriptions
    - Update a base document (e.g., carteIdentite) in Dossier Personnel
    - Verify ActionHistory entries created for all DossierInscription records
    - Verify completude updated for all inscriptions
    - Verify notification sent to candidat about multi-inscription impact
    - _Requirements: 1.5, 11.4, 23.1, 23.2, 23.3_

  - [ ] 15.4 Test aggregated view for commission
    - Authenticate as COMMISSION member
    - Retrieve dossier-complet for an inscription
    - Verify response includes base documents (from Dossier) and specific documents (from DossierInscription)
    - Verify source indicators are correct ('dossier_personnel' vs 'dossier_concours')
    - Verify decision fields are included
    - _Requirements: 7.2, 7.3, 22.1, 22.2, 22.3, 22.4, 22.5_

- [ ] 16. Create non-regression tests
  - [ ] 16.1 Test that each Inscription has a DossierInscription
    - Query all Inscriptions with include: { dossierInscription: true }
    - Verify every Inscription has a non-null dossierInscription
    - _Requirements: 12.1_

  - [ ] 16.2 Test that ActionHistory references valid DossierInscription
    - Query all ActionHistory records with include: { dossierInscription: true }
    - Verify every ActionHistory has a valid dossierInscription reference
    - _Requirements: 12.2_

  - [ ] 16.3 Test completude calculation consistency
    - For a sample of inscriptions, calculate completude manually and compare with API result
    - Verify percentage matches expected value
    - Verify piecesPresentes and piecesRequises counts are correct
    - _Requirements: 12.3_

  - [ ] 16.4 Test API endpoints return correct data structure
    - Test GET /api/candidats/:candidatId/dossier-personnel returns expected structure
    - Test GET /api/inscriptions/:inscriptionId/dossier-complet returns expected structure
    - Test GET /api/dossiers-inscription/:dossierInscriptionId/historique returns expected structure
    - _Requirements: 12.4_

- [ ] 17. Test error handling and edge cases
  - [ ] 17.1 Test inscription creation without Dossier
    - Create inscription for candidat without Dossier
    - Verify empty Dossier is created automatically
    - Verify completude shows 0% for base documents
    - _Requirements: 14.1_

  - [ ] 17.2 Test base document deletion impact
    - Delete a base document from Dossier Personnel
    - Verify completude updated for all inscriptions
    - Verify ActionHistory entries created
    - _Requirements: 14.2_

  - [ ] 17.3 Test concours without piecesExtras
    - Create inscription for concours with no piecesExtras configured
    - Verify completude calculation uses only 4 base + 1 quittance = 5 total
    - _Requirements: 14.3_

  - [ ] 17.4 Test permission checks
    - Test candidat cannot access another candidat's dossier (should return 403)
    - Test candidat cannot modify DossierInscription status (should return 403)
    - Test COMMISSION can access all dossiers
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

  - [ ] 17.5 Test file validation
    - Test upload with invalid file type (should return 400)
    - Test upload with file too large (should return 400)
    - Test upload without file (should return 400)
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ] 18. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

### Phase 6: Documentation and Deployment

- [ ] 19. Create migration documentation
  - Document the "Upload Once, Use Everywhere" principle with diagrams
  - Explain the difference between Dossier_Personnel (base documents) and Dossier_Concours (specific documents)
  - Document the implicit reference mechanism: Inscription → Candidat → Dossier
  - Document the new API endpoints with request/response examples
  - Include code examples for common use cases (first inscription, subsequent inscription, base document update)
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 20. Update API documentation
  - Document GET /api/candidats/:candidatId/dossier-personnel endpoint
  - Document PUT /api/candidats/:candidatId/dossier-personnel/pieces endpoint
  - Document GET /api/inscriptions/:inscriptionId/dossier-complet endpoint
  - Document POST /api/inscriptions/:inscriptionId/dossier-concours/quittance endpoint
  - Document POST /api/inscriptions/:inscriptionId/dossier-concours/pieces-extras endpoint
  - Document GET /api/dossiers-inscription/:dossierInscriptionId/historique endpoint
  - Include authentication requirements, permission checks, request/response schemas
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 9.1, 9.2_

- [ ] 21. Create deployment checklist
  - Verify database backup is created before migration
  - Verify migration script is tested on staging environment
  - Verify rollback script is ready and tested
  - Verify all tests pass in staging environment
  - Verify monitoring and alerting are configured
  - Create deployment runbook with step-by-step instructions
  - _Requirements: 17.1, 17.2, 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ] 22. Configure monitoring and alerts
  - Set up logging for migration script execution
  - Set up alerts for migration failures
  - Set up alerts if DossierInscription count doesn't match Inscription count
  - Set up monitoring for API endpoint response times (especially completude calculation)
  - Configure email notifications for DGES administrators on critical errors
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ] 23. Final checkpoint - Review and deploy
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Unit tests validate specific components and edge cases
- Integration tests validate end-to-end workflows
- The migration is designed to be reversible with rollback scripts
- All changes maintain backward compatibility during transition period
- Smart routing in dossier.controller.js automatically directs uploads to correct table
- Implicit reference mechanism eliminates data duplication while maintaining data integrity
