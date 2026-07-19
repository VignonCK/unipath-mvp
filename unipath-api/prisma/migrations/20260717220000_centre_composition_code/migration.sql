-- Code unique du centre de composition (01–99) pour les N° de table
ALTER TABLE `CentreComposition` ADD COLUMN `code` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `CentreComposition_code_key` ON `CentreComposition`(`code`);
CREATE INDEX `CentreComposition_code_idx` ON `CentreComposition`(`code`);
