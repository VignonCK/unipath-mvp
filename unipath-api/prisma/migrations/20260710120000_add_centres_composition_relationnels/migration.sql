-- Centres de composition relationnels (MySQL)

CREATE TABLE IF NOT EXISTS `CentreComposition` (
  `id` VARCHAR(191) NOT NULL,
  `nom` VARCHAR(191) NOT NULL,
  `ville` VARCHAR(191) NOT NULL,
  `adresse` VARCHAR(191) NULL,
  `telephone` VARCHAR(191) NULL,
  `actif` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `CentreComposition_ville_idx` (`ville`),
  INDEX `CentreComposition_actif_idx` (`actif`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ConcoursCentreComposition` (
  `id` VARCHAR(191) NOT NULL,
  `concoursId` VARCHAR(191) NOT NULL,
  `centreId` VARCHAR(191) NOT NULL,
  `anneeAcademique` VARCHAR(191) NOT NULL DEFAULT '2025-2026',
  `capacite` INT NULL,
  `estActif` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ConcoursCentreComposition_concoursId_centreId_anneeAcademique_key` (`concoursId`, `centreId`, `anneeAcademique`),
  INDEX `ConcoursCentreComposition_concoursId_idx` (`concoursId`),
  INDEX `ConcoursCentreComposition_centreId_idx` (`centreId`),
  CONSTRAINT `ConcoursCentreComposition_concoursId_fkey`
    FOREIGN KEY (`concoursId`) REFERENCES `Concours`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ConcoursCentreComposition_centreId_fkey`
    FOREIGN KEY (`centreId`) REFERENCES `CentreComposition`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Ajouter la FK sur DossierInscription si absente
SET @col_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'DossierInscription'
    AND COLUMN_NAME = 'concoursCentreId'
);

SET @sql := IF(
  @col_exists = 0,
  'ALTER TABLE `DossierInscription` ADD COLUMN `concoursCentreId` VARCHAR(191) NULL, ADD INDEX `DossierInscription_concoursCentreId_idx` (`concoursCentreId`)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'DossierInscription'
    AND CONSTRAINT_NAME = 'DossierInscription_concoursCentreId_fkey'
);

SET @sql_fk := IF(
  @fk_exists = 0,
  'ALTER TABLE `DossierInscription` ADD CONSTRAINT `DossierInscription_concoursCentreId_fkey` FOREIGN KEY (`concoursCentreId`) REFERENCES `ConcoursCentreComposition`(`id`) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt_fk FROM @sql_fk;
EXECUTE stmt_fk;
DEALLOCATE PREPARE stmt_fk;
