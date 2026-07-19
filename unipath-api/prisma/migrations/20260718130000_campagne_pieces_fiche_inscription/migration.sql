-- Pièces requises au niveau campagne + lien application → offre + fiche inscription
ALTER TABLE `CampagneInscription` ADD COLUMN `piecesRequises` JSON NULL;
ALTER TABLE `Application` ADD COLUMN `campagneFiliereId` VARCHAR(191) NULL;
ALTER TABLE `Application` ADD INDEX `Application_campagneFiliereId_idx` (`campagneFiliereId`);
ALTER TABLE `Application` ADD CONSTRAINT `Application_campagneFiliereId_fkey` FOREIGN KEY (`campagneFiliereId`) REFERENCES `CampagneFiliere`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `InscriptionAcademique` ADD COLUMN `ficheInscriptionUrl` VARCHAR(191) NULL;
