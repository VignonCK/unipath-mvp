-- Demande d'ajout de filière (admin établissement → validation DGES)
CREATE TABLE `DemandeAjoutFiliere` (
  `id` VARCHAR(191) NOT NULL,
  `etablissementId` VARCHAR(191) NOT NULL,
  `demandeParId` VARCHAR(191) NOT NULL,
  `nom` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NULL,
  `niveau` ENUM('LICENCE', 'MASTER') NOT NULL,
  `dureeAnnees` INTEGER NOT NULL,
  `details` JSON NULL,
  `statut` ENUM('EN_ATTENTE', 'VALIDE', 'REJETE') NOT NULL DEFAULT 'EN_ATTENTE',
  `motifDecision` VARCHAR(191) NULL,
  `decidedAt` DATETIME(3) NULL,
  `decidedBy` VARCHAR(191) NULL,
  `filiereId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `DemandeAjoutFiliere_filiereId_key`(`filiereId`),
  INDEX `DemandeAjoutFiliere_etablissementId_idx`(`etablissementId`),
  INDEX `DemandeAjoutFiliere_demandeParId_idx`(`demandeParId`),
  INDEX `DemandeAjoutFiliere_statut_idx`(`statut`),
  INDEX `DemandeAjoutFiliere_createdAt_idx`(`createdAt`),
  CONSTRAINT `DemandeAjoutFiliere_etablissementId_fkey` FOREIGN KEY (`etablissementId`) REFERENCES `Etablissement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `DemandeAjoutFiliere_demandeParId_fkey` FOREIGN KEY (`demandeParId`) REFERENCES `AdminEtablissement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `DemandeAjoutFiliere_filiereId_fkey` FOREIGN KEY (`filiereId`) REFERENCES `Filiere`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
