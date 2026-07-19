-- Catalogue de filières de référence (DGES) + lien optionnel sur les demandes
CREATE TABLE `FiliereReference` (
  `id` VARCHAR(191) NOT NULL,
  `nom` VARCHAR(191) NOT NULL,
  `niveau` ENUM('LICENCE', 'MASTER') NULL,
  `actif` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`id`),
  UNIQUE INDEX `FiliereReference_nom_key`(`nom`),
  INDEX `FiliereReference_actif_idx`(`actif`),
  INDEX `FiliereReference_nom_idx`(`nom`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `DemandeAjoutFiliere` ADD COLUMN `filiereReferenceId` VARCHAR(191) NULL;
CREATE INDEX `DemandeAjoutFiliere_filiereReferenceId_idx` ON `DemandeAjoutFiliere`(`filiereReferenceId`);
ALTER TABLE `DemandeAjoutFiliere` ADD CONSTRAINT `DemandeAjoutFiliere_filiereReferenceId_fkey` FOREIGN KEY (`filiereReferenceId`) REFERENCES `FiliereReference`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
