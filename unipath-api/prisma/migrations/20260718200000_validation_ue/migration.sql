-- CreateEnum
-- MySQL: Prisma maps enums as ENUM columns

-- CreateTable
CREATE TABLE `ValidationUE` (
    `id` VARCHAR(191) NOT NULL,
    `inscriptionAcadId` VARCHAR(191) NOT NULL,
    `uniteEnseignementId` VARCHAR(191) NOT NULL,
    `statut` ENUM('VALIDE', 'NON_VALIDE') NOT NULL,
    `decidedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `decidedBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ValidationUE_uniteEnseignementId_statut_idx`(`uniteEnseignementId`, `statut`),
    INDEX `ValidationUE_inscriptionAcadId_idx`(`inscriptionAcadId`),
    UNIQUE INDEX `ValidationUE_inscriptionAcadId_uniteEnseignementId_key`(`inscriptionAcadId`, `uniteEnseignementId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ValidationUE` ADD CONSTRAINT `ValidationUE_inscriptionAcadId_fkey` FOREIGN KEY (`inscriptionAcadId`) REFERENCES `InscriptionAcademique`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ValidationUE` ADD CONSTRAINT `ValidationUE_uniteEnseignementId_fkey` FOREIGN KEY (`uniteEnseignementId`) REFERENCES `UniteEnseignement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
