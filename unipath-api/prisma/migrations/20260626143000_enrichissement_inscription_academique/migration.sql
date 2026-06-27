-- AlterEnum
ALTER TYPE "StatutInscriptionAcad" ADD VALUE 'EN_ATTENTE_QUITTANCE';
ALTER TYPE "StatutInscriptionAcad" ADD VALUE 'QUITTANCE_SOUMISE';

-- AlterTable
ALTER TABLE "Etablissement" ADD COLUMN "matriculeFormat" TEXT;

-- AlterTable
ALTER TABLE "Filiere" ADD COLUMN "matriculeCompteur" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "sigle" TEXT;

-- AlterTable
ALTER TABLE "InscriptionAcademique" ADD COLUMN "matricule" TEXT,
ADD COLUMN "quittanceBancaire" TEXT,
ADD COLUMN "quittanceSoumiseLe" TIMESTAMP(3),
ADD COLUMN "quittanceValideeLe" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PreinscriptionEtablissement" ADD COLUMN "commentaireAdmin" TEXT,
ADD COLUMN "documentsCompl" JSONB,
ADD COLUMN "historiqueStatuts" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "InscriptionAcademique_matricule_key" ON "InscriptionAcademique"("matricule");
