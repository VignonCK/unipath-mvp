-- CreateEnum
CREATE TYPE "StatutCampagne" AS ENUM ('BROUILLON', 'PUBLIEE', 'CLOTUREE', 'ANNULEE');

-- CreateTable
CREATE TABLE "AdminEtablissement" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'ADMIN_ETABLISSEMENT',
    "etablissementId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminEtablissement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampagneInscription" (
    "id" TEXT NOT NULL,
    "etablissementId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "anneeAcademique" TEXT NOT NULL,
    "dateOuverture" TIMESTAMP(3) NOT NULL,
    "dateCloture" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "statut" "StatutCampagne" NOT NULL DEFAULT 'BROUILLON',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampagneInscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampagneFiliere" (
    "id" TEXT NOT NULL,
    "campagneId" TEXT NOT NULL,
    "filiereId" TEXT NOT NULL,
    "fraisDossier" INTEGER NOT NULL,
    "placesDisponibles" INTEGER,
    "criteresSelection" TEXT,
    "seriesAcceptees" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "niveauMinBac" TEXT,
    "autresCriteres" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampagneFiliere_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminEtablissement_email_key" ON "AdminEtablissement"("email");

-- CreateIndex
CREATE INDEX "AdminEtablissement_etablissementId_idx" ON "AdminEtablissement"("etablissementId");

-- CreateIndex
CREATE INDEX "CampagneInscription_etablissementId_statut_idx" ON "CampagneInscription"("etablissementId", "statut");

-- CreateIndex
CREATE INDEX "CampagneInscription_dateOuverture_idx" ON "CampagneInscription"("dateOuverture");

-- CreateIndex
CREATE INDEX "CampagneInscription_dateCloture_idx" ON "CampagneInscription"("dateCloture");

-- CreateIndex
CREATE INDEX "CampagneFiliere_campagneId_idx" ON "CampagneFiliere"("campagneId");

-- CreateIndex
CREATE INDEX "CampagneFiliere_filiereId_idx" ON "CampagneFiliere"("filiereId");

-- CreateIndex
CREATE UNIQUE INDEX "CampagneFiliere_campagneId_filiereId_key" ON "CampagneFiliere"("campagneId", "filiereId");

-- AddForeignKey
ALTER TABLE "AdminEtablissement" ADD CONSTRAINT "AdminEtablissement_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Etablissement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampagneInscription" ADD CONSTRAINT "CampagneInscription_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Etablissement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampagneFiliere" ADD CONSTRAINT "CampagneFiliere_campagneId_fkey" FOREIGN KEY ("campagneId") REFERENCES "CampagneInscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampagneFiliere" ADD CONSTRAINT "CampagneFiliere_filiereId_fkey" FOREIGN KEY ("filiereId") REFERENCES "Filiere"("id") ON DELETE CASCADE ON UPDATE CASCADE;
