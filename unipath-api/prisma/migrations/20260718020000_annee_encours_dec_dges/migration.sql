-- Années académiques duales : Module 1 (DEC) / Module 2 (DGES)
ALTER TABLE `AnneeAcademique` ADD COLUMN `enCoursDec` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `AnneeAcademique` ADD COLUMN `enCoursDges` BOOLEAN NOT NULL DEFAULT false;

UPDATE `AnneeAcademique` SET `enCoursDec` = `enCours`, `enCoursDges` = `enCours`;

ALTER TABLE `AnneeAcademique` DROP COLUMN `enCours`;

CREATE INDEX `AnneeAcademique_enCoursDec_idx` ON `AnneeAcademique`(`enCoursDec`);
CREATE INDEX `AnneeAcademique_enCoursDges_idx` ON `AnneeAcademique`(`enCoursDges`);
