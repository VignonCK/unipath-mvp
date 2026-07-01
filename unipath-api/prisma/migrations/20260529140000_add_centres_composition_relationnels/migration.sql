-- CreateTable
CREATE TABLE "CentreComposition" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "adresse" TEXT,
    "telephone" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CentreComposition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConcourscentreComposition" (
    "id" TEXT NOT NULL,
    "concoursId" TEXT NOT NULL,
    "centreId" TEXT NOT NULL,
    "anneeAcademique" TEXT NOT NULL,
    "capacite" INTEGER,
    "estActif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConcourscentreComposition_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "DossierInscription" ADD COLUMN "concoursCentreId" TEXT;

-- CreateIndex
CREATE INDEX "CentreComposition_ville_idx" ON "CentreComposition"("ville");

-- CreateIndex
CREATE INDEX "CentreComposition_actif_idx" ON "CentreComposition"("actif");

-- CreateIndex
CREATE UNIQUE INDEX "ConcourscentreComposition_concoursId_centreId_anneeAcademique_key" ON "ConcourscentreComposition"("concoursId", "centreId", "anneeAcademique");

-- CreateIndex
CREATE INDEX "ConcourscentreComposition_concoursId_idx" ON "ConcourscentreComposition"("concoursId");

-- CreateIndex
CREATE INDEX "ConcourscentreComposition_centreId_idx" ON "ConcourscentreComposition"("centreId");

-- CreateIndex
CREATE INDEX "DossierInscription_concoursCentreId_idx" ON "DossierInscription"("concoursCentreId");

-- AddForeignKey
ALTER TABLE "ConcourscentreComposition" ADD CONSTRAINT "ConcourscentreComposition_concoursId_fkey" FOREIGN KEY ("concoursId") REFERENCES "Concours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConcourscentreComposition" ADD CONSTRAINT "ConcourscentreComposition_centreId_fkey" FOREIGN KEY ("centreId") REFERENCES "CentreComposition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierInscription" ADD CONSTRAINT "DossierInscription_concoursCentreId_fkey" FOREIGN KEY ("concoursCentreId") REFERENCES "ConcourscentreComposition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
