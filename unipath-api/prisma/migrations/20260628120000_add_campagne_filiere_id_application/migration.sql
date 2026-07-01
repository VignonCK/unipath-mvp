-- AlterTable
ALTER TABLE "Application" ADD COLUMN "campagneFiliereId" TEXT;

-- CreateIndex
CREATE INDEX "Application_campagneFiliereId_idx" ON "Application"("campagneFiliereId");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_campagneFiliereId_fkey" FOREIGN KEY ("campagneFiliereId") REFERENCES "CampagneFiliere"("id") ON DELETE SET NULL ON UPDATE CASCADE;
