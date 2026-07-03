-- AlterTable
ALTER TABLE "MembreCommission" ADD COLUMN "etablissementId" TEXT;

-- CreateIndex
CREATE INDEX "MembreCommission_etablissementId_idx" ON "MembreCommission"("etablissementId");

-- CreateIndex
CREATE INDEX "MembreCommission_etablissementId_sousRole_idx" ON "MembreCommission"("etablissementId", "sousRole");

-- AddForeignKey
ALTER TABLE "MembreCommission" ADD CONSTRAINT "MembreCommission_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Etablissement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
