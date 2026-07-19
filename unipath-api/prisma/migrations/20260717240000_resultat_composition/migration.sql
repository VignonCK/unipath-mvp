-- Décision DEC après composition (parmi les candidatures VALIDE)
ALTER TABLE `Inscription`
  ADD COLUMN `resultatComposition` ENUM('EN_ATTENTE', 'ADMIS', 'REFUSE') NOT NULL DEFAULT 'EN_ATTENTE',
  ADD COLUMN `resultatCompositionAt` DATETIME(3) NULL,
  ADD COLUMN `resultatCompositionPar` VARCHAR(191) NULL;

CREATE INDEX `Inscription_resultatComposition_idx` ON `Inscription`(`resultatComposition`);
