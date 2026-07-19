-- CreateTable
CREATE TABLE `UniteEnseignement` (
    `id` VARCHAR(191) NOT NULL,
    `filiereId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `libelle` VARCHAR(191) NOT NULL,
    `credits` INTEGER NOT NULL DEFAULT 0,
    `semestre` INTEGER NOT NULL,
    `anneeEtude` INTEGER NOT NULL,
    `coefficient` DOUBLE NULL,
    `description` VARCHAR(191) NULL,
    `ordre` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UniteEnseignement_filiereId_semestre_idx`(`filiereId`, `semestre`),
    INDEX `UniteEnseignement_filiereId_anneeEtude_idx`(`filiereId`, `anneeEtude`),
    INDEX `UniteEnseignement_semestre_idx`(`semestre`),
    UNIQUE INDEX `UniteEnseignement_filiereId_code_semestre_key`(`filiereId`, `code`, `semestre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UniteEnseignement` ADD CONSTRAINT `UniteEnseignement_filiereId_fkey` FOREIGN KEY (`filiereId`) REFERENCES `Filiere`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
