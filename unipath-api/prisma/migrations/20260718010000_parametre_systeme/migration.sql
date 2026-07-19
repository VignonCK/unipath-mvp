-- Paramètres système (en-tête PDF configurable par la DEC)
CREATE TABLE IF NOT EXISTS `ParametreSysteme` (
  `id` VARCHAR(191) NOT NULL,
  `cle` VARCHAR(191) NOT NULL,
  `valeur` TEXT NULL,
  `updatedById` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `ParametreSysteme_cle_key`(`cle`),
  INDEX `ParametreSysteme_cle_idx`(`cle`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
