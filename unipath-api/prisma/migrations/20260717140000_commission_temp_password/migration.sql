-- AlterTable
ALTER TABLE `Compte` ADD COLUMN `mustChangePassword` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `MembreCommission` ADD COLUMN `motDePasseTemporaire` VARCHAR(191) NULL;
