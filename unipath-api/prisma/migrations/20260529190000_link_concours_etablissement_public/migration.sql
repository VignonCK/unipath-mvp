-- AlterTable
ALTER TABLE "Concours" ADD COLUMN "etablissementId" TEXT;

-- CreateIndex
CREATE INDEX "Concours_etablissementId_idx" ON "Concours"("etablissementId");

-- AddForeignKey
ALTER TABLE "Concours" ADD CONSTRAINT "Concours_etablissementId_fkey" FOREIGN KEY ("etablissementId") REFERENCES "Etablissement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
