-- CreateTable
CREATE TABLE "Salle" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "capacite" INTEGER,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "centreCompositionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Salle_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "DossierInscription" ADD COLUMN "salleId" TEXT;

-- CreateIndex
CREATE INDEX "Salle_centreCompositionId_idx" ON "Salle"("centreCompositionId");

-- CreateIndex
CREATE INDEX "Salle_actif_idx" ON "Salle"("actif");

-- CreateIndex
CREATE INDEX "DossierInscription_salleId_idx" ON "DossierInscription"("salleId");

-- AddForeignKey
ALTER TABLE "Salle" ADD CONSTRAINT "Salle_centreCompositionId_fkey" FOREIGN KEY ("centreCompositionId") REFERENCES "CentreComposition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierInscription" ADD CONSTRAINT "DossierInscription_salleId_fkey" FOREIGN KEY ("salleId") REFERENCES "Salle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
